import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchBillingCompanies,
  fetchCompanyBilling,
  generateInvoice,
  sendInvoice,
  markInvoicePaid,
} from "../services/billingService.js";
import rbacApi from "../../../lib/rbacApi.js";

const PLAN_OPTIONS = ["Basic", "Professional", "Enterprise"];
const PAYMENT_STATUS_OPTIONS = ["Paid", "Pending", "Overdue", "Unpaid"];
const SUBSCRIPTION_STATUS_OPTIONS = ["Active", "Expired", "Trial", "Cancelled"];
const BILLING_CYCLE_OPTIONS = ["Monthly", "Quarterly", "Yearly"];

const formatCurrency = (value) =>
  `Rs ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value || 0))}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const statusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active" || normalized === "paid") return "bg-emerald-100 text-emerald-700";
  if (normalized === "trial") return "bg-sky-100 text-sky-700";
  if (normalized === "overdue") return "bg-rose-100 text-rose-700";
  if (normalized === "expired" || normalized === "cancelled") return "bg-slate-200 text-slate-600";
  return "bg-amber-100 text-amber-700";
};

const buildInvoiceHtml = (invoice, company) => `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
        h1 { margin: 0 0 8px; font-size: 24px; }
        .muted { color: #64748b; font-size: 12px; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 6px 0; }
        .right { text-align: right; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <h1>Invoice ${invoice.invoiceNumber || ""}</h1>
      <div class="muted">${company || "Company"} - ${formatDate(invoice.invoiceDate)}</div>
      <div class="card">
        <table>
          <tr><td>Plan</td><td class="right">${invoice.planName || "-"}</td></tr>
          <tr><td>Billing Cycle</td><td class="right">${invoice.billingCycle || "-"}</td></tr>
          <tr><td>Employees</td><td class="right">${invoice.employeeCount || 0}</td></tr>
          <tr><td>Amount</td><td class="right">${formatCurrency(invoice.billingAmount)}</td></tr>
          <tr><td>Tax</td><td class="right">${formatCurrency(invoice.taxAmount)}</td></tr>
          <tr><td class="total">Total</td><td class="right total">${formatCurrency(invoice.totalAmount)}</td></tr>
        </table>
      </div>
      <p class="muted">Due Date: ${formatDate(invoice.dueDate)}</p>
    </body>
  </html>
`;

const openInvoicePrint = (invoice, companyName) => {
  const win = window.open("", "_blank", "width=900,height=650");
  if (!win) return;
  win.document.write(buildInvoiceHtml(invoice, companyName));
  win.document.close();
  win.focus();
  win.print();
};

function Toast({ message, type, onClose }) {
  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="text-xs text-slate-500">
          Close
        </button>
      </div>
    </div>
  );
}

const parseContextJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getScopedCompanyContext = () => {
  const localContext = parseContextJson(localStorage.getItem("companyContext"));
  const sessionContext = parseContextJson(sessionStorage.getItem("companyContext"));

  const companyIdRaw =
    (localStorage.getItem("companyId") || "").trim() ||
    (sessionStorage.getItem("companyId") || "").trim() ||
    String(localContext?.companyId || sessionContext?.companyId || "").trim();
  const companyId = Number(companyIdRaw);

  const tenantCode =
    (localStorage.getItem("tenantCode") || "").trim() ||
    (sessionStorage.getItem("tenantCode") || "").trim() ||
    String(localContext?.tenantCode || sessionContext?.tenantCode || "").trim();

  const companyName =
    (localStorage.getItem("companyName") || "").trim() ||
    (sessionStorage.getItem("companyName") || "").trim();

  const companyLegalName =
    (localStorage.getItem("companyLegalName") || "").trim() ||
    (sessionStorage.getItem("companyLegalName") || "").trim();

  return {
    companyId: Number.isFinite(companyId) && companyId > 0 ? companyId : null,
    tenantCode,
    companyName,
    companyLegalName,
  };
};

const isCompanyScopeMatch = (row, scope) => {
  const rowCompanyId = Number(row?.companyId || 0);
  const scopeId = Number(scope?.companyId || 0);
  if (scopeId > 0 && rowCompanyId === scopeId) return true;

  const rowTenantCode = normalizeText(row?.tenantCode);
  const scopeTenantCode = normalizeText(scope?.tenantCode);
  if (scopeTenantCode && rowTenantCode && rowTenantCode === scopeTenantCode) return true;

  const candidates = [
    row?.companyName,
    row?.companyDisplayName,
    row?.companyLegalName,
  ].map(normalizeText);

  const scopeName = normalizeText(scope?.companyName);
  const scopeLegal = normalizeText(scope?.companyLegalName);

  if (scopeName && candidates.includes(scopeName)) return true;
  if (scopeLegal && candidates.includes(scopeLegal)) return true;

  return false;
};

const buildSummaryFromRows = (rows = []) => ({
  totalCompanies: rows.length,
  activeSubscriptions: rows.filter((r) => r.subscriptionStatus === "Active").length,
  expiredSubscriptions: rows.filter((r) => r.subscriptionStatus === "Expired").length,
  totalMonthlyRevenue: rows.reduce(
    (sum, row) => sum + Number(row.monthlyAmount ?? row.billingAmount ?? 0),
    0,
  ),
  totalPendingPayments: rows.reduce(
    (sum, row) =>
      sum +
      Number(
        row.pendingAmount ??
          (row.paymentStatus === "Paid" ? 0 : row.totalAmount ?? row.billingAmount ?? 0),
      ),
    0,
  ),
});

export default function SubscriptionsBilling({ mode = "global_admin" }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyBilling, setCompanyBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showUpdatePlan, setShowUpdatePlan] = useState(false);
  const [planDraft, setPlanDraft] = useState({
    plan: "Basic",
    billingCycle: "Monthly",
  });

  const isSuperAdminView = mode === "super_admin";
  const isGlobalAdminView = !isSuperAdminView;
  const scopedCompanyContext = useMemo(() => getScopedCompanyContext(), []);

  const refreshBilling = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBillingCompanies();
      const rows = Array.isArray(data?.companies) ? data.companies : [];

      if (isSuperAdminView) {
        if (
          !scopedCompanyContext.companyId &&
          !scopedCompanyContext.tenantCode &&
          !scopedCompanyContext.companyName &&
          !scopedCompanyContext.companyLegalName
        ) {
          setCompanies([]);
          setSummary(buildSummaryFromRows([]));
          setError("Unable to determine company context for Super Admin.");
          return;
        }

        const scopedRows = rows
          .filter((company) => isCompanyScopeMatch(company, scopedCompanyContext))
          .filter((company) => Number(company.sentInvoiceCount || 0) > 0);

        setCompanies(scopedRows);
        setSummary(buildSummaryFromRows(scopedRows));
        return;
      }

      setCompanies(rows);
      setSummary(data?.summary || buildSummaryFromRows(rows));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdminView, scopedCompanyContext]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchesSearch =
        !term ||
        String(company.companyName || "")
          .toLowerCase()
          .includes(term);
      const matchesPlan = !planFilter || company.plan === planFilter;
      const matchesPayment = !paymentFilter || company.paymentStatus === paymentFilter;
      const matchesSubscription =
        !subscriptionFilter || company.subscriptionStatus === subscriptionFilter;
      return matchesSearch && matchesPlan && matchesPayment && matchesSubscription;
    });
  }, [companies, search, planFilter, paymentFilter, subscriptionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const pagedCompanies = filteredCompanies.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleViewCompany = async (company) => {
    setSelectedCompany(company);
    setBillingLoading(true);
    setCompanyBilling(null);
    try {
      const detail = await fetchCompanyBilling(company.companyId);
      if (isSuperAdminView) {
        const sentInvoices = Array.isArray(detail?.invoices)
          ? detail.invoices.filter((invoice) => Boolean(invoice?.sentAt))
          : [];
        setCompanyBilling({ ...detail, invoices: sentInvoices });
      } else {
        setCompanyBilling(detail);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to load billing details",
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleGenerateInvoice = async (company) => {
    setActionLoading(true);
    try {
      await generateInvoice(company.companyId, {});
      await sendInvoice(company.companyId, {});
      setToast({ type: "success", message: "Invoice generated and sent to Super Admin." });
      await refreshBilling();
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to generate and send invoice",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = async (company) => {
    setActionLoading(true);
    try {
      await sendInvoice(company.companyId, {});
      setToast({ type: "success", message: "Invoice resent to Super Admin." });
      await refreshBilling();
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to send invoice",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (company) => {
    setActionLoading(true);
    try {
      const detail = await fetchCompanyBilling(company.companyId);
      const invoiceList = isSuperAdminView
        ? (detail?.invoices || []).filter((invoice) => Boolean(invoice?.sentAt))
        : (detail?.invoices || []);
      const latestInvoice = invoiceList[0];
      if (!latestInvoice?.id) {
        throw new Error("No invoice found to mark as paid.");
      }
      await markInvoicePaid(latestInvoice.id, {});
      setToast({ type: "success", message: "Invoice marked as paid." });
      await refreshBilling();
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to mark invoice as paid",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedCompany) return;
    setActionLoading(true);
    try {
      await rbacApi.put(`/api/global-admin/companies/${selectedCompany.companyId}`, {
        plan: planDraft.plan,
        billingCycle: planDraft.billingCycle.toLowerCase(),
      });
      setToast({ type: "success", message: "Subscription updated successfully." });
      await refreshBilling();
      setShowUpdatePlan(false);
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to update plan",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportReport = () => {
    const headers = [
      "Company Name",
      "Plan",
      "Active Employees",
      "Inactive Employees",
      "Billing Amount",
      "Next Billing Date",
      "Subscription Status",
      "Payment Status",
    ];
    const rows = filteredCompanies.map((c) => [
      c.companyName,
      c.plan,
      c.activeEmployees,
      c.inactiveEmployees,
      c.billingAmount,
      c.nextBillingDate,
      c.subscriptionStatus,
      c.paymentStatus,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "billing-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const emptyStateMessage = isSuperAdminView
    ? "No invoice sent to your company yet."
    : "No companies match the current filters.";

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Billing & Subscription</h1>
        <p className="text-sm text-slate-600">
          {isSuperAdminView
            ? "View bills generated by Global Admin for your company."
            : "Manage company subscriptions, invoices, and payments."}
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400">Total Companies</p>
          <p className="text-2xl font-semibold text-slate-900">{summary?.totalCompanies ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400">Active Subscriptions</p>
          <p className="text-2xl font-semibold text-emerald-600">{summary?.activeSubscriptions ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400">Expired Subscriptions</p>
          <p className="text-2xl font-semibold text-rose-600">{summary?.expiredSubscriptions ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400">Monthly Revenue</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(summary?.totalMonthlyRevenue ?? 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400">Pending Payments</p>
          <p className="text-2xl font-semibold text-amber-600">
            {formatCurrency(summary?.totalPendingPayments ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="text"
            placeholder="Search by Company Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#011A8B] focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20"
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full md:w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#011A8B] focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20"
          >
            <option value="">All Plans</option>
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full md:w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#011A8B] focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20"
          >
            <option value="">All Payment Status</option>
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="w-full md:w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#011A8B] focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20"
          >
            <option value="">All Subscription Status</option>
            {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportReport}
            className="w-full md:w-auto px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Company Billing</h2>
          <span className="text-xs text-slate-500">{filteredCompanies.length} companies</span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading billing data...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
            {emptyStateMessage}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[1200px] text-sm text-slate-700">
                <thead className="text-slate-600 border-b bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Company Name</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Plan</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">Active Employees</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">Inactive Employees</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">Billing Amount</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Next Billing Date</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Subscription Status</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Payment Status</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCompanies.map((company) => (
                    <tr key={company.companyId} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{company.companyName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{company.plan}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{company.activeEmployees}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{company.inactiveEmployees}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(company.billingAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(company.nextBillingDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            company.subscriptionStatus
                          )}`}
                        >
                          {company.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            company.paymentStatus
                          )}`}
                        >
                          {company.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCompany(company)}
                          className="text-xs font-semibold text-[#011A8B] hover:underline whitespace-nowrap"
                        >
                          View
                        </button>
                        {isGlobalAdminView ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCompany(company);
                                setPlanDraft({
                                  plan: company.plan,
                                  billingCycle: company.billingCycle,
                                });
                                setShowUpdatePlan(true);
                              }}
                              className="text-xs font-semibold text-slate-700 hover:underline whitespace-nowrap"
                            >
                              Subscription Details
                            </button>
                            <button
                              onClick={() => handleGenerateInvoice(company)}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-slate-700 hover:underline disabled:opacity-50 whitespace-nowrap"
                            >
                              Generate Invoice
                            </button>
                            <button
                              onClick={() => handleSendInvoice(company)}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-slate-700 hover:underline disabled:opacity-50 whitespace-nowrap"
                            >
                              Resend Bill
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => handleMarkPaid(company)}
                          disabled={actionLoading}
                          className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50 whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedCompany && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedCompany.companyName}</h3>
                <p className="text-xs text-slate-500">
                  ID: {selectedCompany.companyId} - Registered: {formatDate(selectedCompany.registeredDate)}
                </p>
                <p className="text-xs text-slate-500">
                  Plan: {selectedCompany.plan} - Billing Cycle: {selectedCompany.billingCycle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isGlobalAdminView ? (
                  <button
                    onClick={() => {
                      setPlanDraft({
                        plan: selectedCompany.plan,
                        billingCycle: selectedCompany.billingCycle,
                      });
                      setShowUpdatePlan(true);
                    }}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-sm"
                  >
                    Update Plan
                  </button>
                ) : null}
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Current Plan</p>
                <p className="text-lg font-semibold">{companyBilling?.plan || "-"}</p>
                <p className="text-xs text-slate-500 mt-1">{companyBilling?.billingCycle || "-"}</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Billing Amount</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(companyBilling?.billingAmount || 0)}
                </p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Employees (Active / Inactive)</p>
                <p className="text-lg font-semibold">
                  {companyBilling?.activeEmployees || 0} / {companyBilling?.inactiveEmployees || 0}
                </p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(selectedCompany.nextBillingDate)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Invoices</h4>
              {billingLoading ? (
                <div className="text-sm text-slate-500">Loading invoices...</div>
              ) : (companyBilling?.invoices || []).length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
                  No invoices available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 border-b">
                      <tr>
                        <th className="text-left py-2">Invoice</th>
                        <th className="text-left py-2">Invoice Date</th>
                        <th className="text-left py-2">Due Date</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyBilling?.invoices?.map((invoice) => (
                        <tr key={invoice.id} className="border-b last:border-b-0">
                          <td className="py-2">{invoice.invoiceNumber}</td>
                          <td className="py-2">{formatDate(invoice.invoiceDate)}</td>
                          <td className="py-2">{formatDate(invoice.dueDate)}</td>
                          <td className="py-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                                invoice.paymentStatus
                              )}`}
                            >
                              {invoice.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2 text-right space-x-2">
                            <button
                              onClick={() => openInvoicePrint(invoice, selectedCompany.companyName)}
                              className="text-xs font-semibold text-slate-700 hover:underline"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => openInvoicePrint(invoice, selectedCompany.companyName)}
                              className="text-xs font-semibold text-[#011A8B] hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isGlobalAdminView && showUpdatePlan && selectedCompany && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900">Update Plan</h3>
            <p className="text-xs text-slate-500">Company: {selectedCompany.companyName}</p>
            <div className="mt-4 space-y-3">
              <label className="text-sm text-slate-600">Plan</label>
              <select
                value={planDraft.plan}
                onChange={(e) => setPlanDraft((prev) => ({ ...prev, plan: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
              <label className="text-sm text-slate-600">Billing Cycle</label>
              <select
                value={planDraft.billingCycle}
                onChange={(e) => setPlanDraft((prev) => ({ ...prev, billingCycle: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {BILLING_CYCLE_OPTIONS.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowUpdatePlan(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




