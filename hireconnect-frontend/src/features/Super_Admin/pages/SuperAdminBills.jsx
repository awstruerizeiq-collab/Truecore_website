import React, { useEffect, useMemo, useState } from "react";
import { fetchBills } from "../services/billingService.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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
  if (normalized === "paid") return "bg-emerald-100 text-emerald-700";
  if (normalized === "overdue") return "bg-rose-100 text-rose-700";
  if (normalized === "unpaid") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
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
      <div class="muted">${company || "Company"} · ${formatDate(invoice.invoiceDate)}</div>
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

export default function SuperAdminBills() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [data, setData] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchBills();
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || "Failed to load bills");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const invoices = data?.invoices || [];
  const companyName = data?.companyName || "Your Company";

  const summary = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((inv) => String(inv.paymentStatus || "").toLowerCase() === "paid").length;
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [invoices]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
  const pagedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bills</h1>
        <p className="text-sm text-slate-500">Review subscription invoices and payment status.</p>
      </div>

      {toast && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">Current Plan</p>
          <p className="text-lg font-semibold text-slate-900">{data?.plan || "Basic"}</p>
          <p className="text-xs text-slate-500 mt-1">{data?.billingCycle || "Monthly"}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">Total Bills</p>
          <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">Paid Bills</p>
          <p className="text-2xl font-semibold text-emerald-600">{summary.paid}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">Unpaid Bills</p>
          <p className="text-2xl font-semibold text-amber-600">{summary.unpaid}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Invoices</h2>
          <span className="text-xs text-slate-500">{companyName}</span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
            No bills available yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="text-left py-2">Invoice</th>
                    <th className="text-left py-2">Invoice Date</th>
                    <th className="text-left py-2">Due Date</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-b-0">
                      <td className="py-2 font-medium text-slate-900">
                        {invoice.invoiceNumber || `INV-${invoice.id}`}
                      </td>
                      <td className="py-2">{formatDate(invoice.invoiceDate)}</td>
                      <td className="py-2">{formatDate(invoice.dueDate)}</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            invoice.paymentStatus
                          )}`}
                        >
                          {invoice.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="text-xs font-semibold text-[#011A8B] hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openInvoicePrint(invoice, companyName)}
                          className="text-xs font-semibold text-slate-700 hover:underline"
                        >
                          Download
                        </button>
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
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Invoice {selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{selectedInvoice.planName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Cycle</span>
                <span className="font-medium">{selectedInvoice.billingCycle || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Date</span>
                <span className="font-medium">{formatDate(selectedInvoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date</span>
                <span className="font-medium">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bill Amount</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.billingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-medium">{selectedInvoice.paymentStatus || "Pending"}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => openInvoicePrint(selectedInvoice, companyName)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
              >
                Download Invoice
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}