import React, { useEffect, useMemo, useState } from "react";
import { Download, Filter, Loader2, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#0b2ba9", "#14b8a6", "#f97316", "#ef4444", "#7c3aed", "#0891b2", "#22c55e"];

const PLAN_MONTHLY_PRICE = {
  basic: 29,
  starter: 29,
  professional: 59,
  growth: 59,
  scale: 99,
  enterprise: 199,
};

const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();

  if (fromEnv && !isLocalHost) {
    return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  }
  if (isLocalHost) return "http://localhost:8080";
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const authHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
};

const _parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizePlan = (value) => String(value || "Unknown").trim();

const _monthlyRevenueEstimate = (company) => {
  const plan = normalizePlan(company?.plan).toLowerCase();
  const monthly = PLAN_MONTHLY_PRICE[plan] ?? 0;
  const cycle = String(company?.billingCycle || "monthly").toLowerCase();
  if (cycle === "yearly") return monthly;
  if (cycle === "quarterly") return monthly;
  return monthly;
};

const normalizeChartRows = (rows) =>
  (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    label: row?.label ?? row?.month ?? row?.name ?? "Unknown",
    value: Number(row?.value || 0),
  }));

const toDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMonthLabel = (value) =>
  value.toLocaleString("en-IN", { month: "short", year: "numeric" });

const isWithinRange = (date, from, to) => {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const buildOverviewFromCompanies = (companies) => {
  const current = new Date();
  const currentMonth = current.getMonth();
  const currentYear = current.getFullYear();

  const totalCompanies = companies.length;
  const totalEmployees = companies.reduce((sum, company) => sum + (Number(company?.employees) || 0), 0);
  const activeUsers = companies
    .filter((company) => String(company?.status || "").trim().toLowerCase() === "active")
    .reduce((sum, company) => sum + (Number(company?.employees) || 0), 0);
  const totalSubscriptions = companies.filter((company) => String(company?.plan || "").trim() !== "").length;
  const revenueOverview = companies.reduce((sum, company) => sum + _monthlyRevenueEstimate(company), 0);
  const newRegistrationsThisMonth = companies.filter((company) => {
    const createdAt = toDateValue(company?.createdDate || company?.startDate);
    return createdAt && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;

  return {
    totalCompanies,
    totalEmployees,
    activeUsers,
    totalSubscriptions,
    revenueOverview,
    newRegistrationsThisMonth,
  };
};

const buildMonthlyGrowthFromCompanies = (companies) => {
  const grouped = new Map();

  companies.forEach((company) => {
    const createdAt = toDateValue(company?.createdDate || company?.startDate);
    if (!createdAt) return;
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const current = grouped.get(key) || { date: new Date(createdAt.getFullYear(), createdAt.getMonth(), 1), value: 0 };
    current.value += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      label: formatMonthLabel(row.date),
      value: row.value,
    }));
};

const buildMonthlyRevenueFromCompanies = (companies) => {
  const grouped = new Map();

  companies.forEach((company) => {
    const createdAt = toDateValue(company?.createdDate || company?.startDate);
    if (!createdAt) return;
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const current = grouped.get(key) || { date: new Date(createdAt.getFullYear(), createdAt.getMonth(), 1), value: 0 };
    current.value += _monthlyRevenueEstimate(company);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      label: formatMonthLabel(row.date),
      value: row.value,
    }));
};

const buildEmployeeDistributionFromCompanies = (companies) =>
  companies
    .map((company) => ({
      name: company?.displayName || company?.legalName || `Company ${company?.id || ""}`.trim(),
      value: Number(company?.employees) || 0,
    }))
    .sort((a, b) => b.value - a.value);

const buildSubscriptionDistributionFromCompanies = (companies) => {
  const grouped = new Map();

  companies.forEach((company) => {
    const plan = normalizePlan(company?.plan);
    grouped.set(plan, (grouped.get(plan) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const buildReportsFromCompanies = (companies) => ({
  overview: buildOverviewFromCompanies(companies),
  monthlyCompanyGrowth: buildMonthlyGrowthFromCompanies(companies),
  monthlyRevenue: buildMonthlyRevenueFromCompanies(companies),
  employeeDistribution: buildEmployeeDistributionFromCompanies(companies),
  subscriptionDistribution: buildSubscriptionDistributionFromCompanies(companies),
});

const filterCompaniesByForm = (companies, filters) => {
  const fromDate = filters?.from ? new Date(`${filters.from}T00:00:00`) : null;
  const toDate = filters?.to ? new Date(`${filters.to}T23:59:59`) : null;

  return (Array.isArray(companies) ? companies : []).filter((company) => {
    if (filters?.companyId && String(company?.id) !== String(filters.companyId)) {
      return false;
    }
    if (filters?.plan && normalizePlan(company?.plan).toLowerCase() !== String(filters.plan).trim().toLowerCase()) {
      return false;
    }
    const createdAt = toDateValue(company?.createdDate || company?.startDate);
    return isWithinRange(createdAt, fromDate, toDate);
  });
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(value || 0) * 83
  );

function Card({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
    </div>
  );
}

export default function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [monthlyCompanyGrowth, setMonthlyCompanyGrowth] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [employeeDistribution, setEmployeeDistribution] = useState([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState([]);
  const [overview, setOverview] = useState({
    totalCompanies: 0,
    totalEmployees: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    revenueOverview: 0,
    newRegistrationsThisMonth: 0,
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    companyId: "",
    plan: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      };

      const [companiesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/global-admin/companies`, { headers }),
        fetch(`${API_BASE_URL}/api/reports/overview${buildQuery(filters)}`, { headers }),
      ]);

      const companiesJson = await companiesRes.json();
      const overviewJson = await usersRes.json();

      if (!companiesRes.ok || companiesJson?.success === false) {
        throw new Error(companiesJson?.message || "Failed to fetch companies");
      }
      const companyList = Array.isArray(companiesJson?.data) ? companiesJson.data : [];
      setCompanies(companyList);

      const reportsDenied =
        !usersRes.ok ||
        overviewJson?.success === false ||
        /Only Global Admin can access reports/i.test(String(overviewJson?.message || ""));

      if (reportsDenied) {
        const filteredCompanies = filterCompaniesByForm(companyList, filters);
        const derived = buildReportsFromCompanies(filteredCompanies);
        setOverview(derived.overview);
        setMonthlyCompanyGrowth(derived.monthlyCompanyGrowth);
        setMonthlyRevenue(derived.monthlyRevenue);
        setEmployeeDistribution(derived.employeeDistribution);
        setSubscriptionDistribution(derived.subscriptionDistribution);
        return;
      }

      setOverview({
        totalCompanies: Number(overviewJson?.data?.totalCompanies || 0),
        totalEmployees: Number(overviewJson?.data?.totalEmployees || 0),
        activeUsers: Number(overviewJson?.data?.activeUsers || 0),
        totalSubscriptions: Number(overviewJson?.data?.totalSubscriptions || 0),
        revenueOverview: Number(overviewJson?.data?.revenueOverview || 0),
        newRegistrationsThisMonth: Number(overviewJson?.data?.newRegistrationsThisMonth || 0),
      });

      const [growthRes, revenueRes, employeeDistRes, planDistRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reports/monthly-growth${buildQuery(filters)}`, { headers }),
        fetch(`${API_BASE_URL}/api/reports/revenue${buildQuery(filters)}`, { headers }),
        fetch(`${API_BASE_URL}/api/reports/employee-distribution${buildQuery(filters)}`, { headers }),
        fetch(`${API_BASE_URL}/api/reports/subscription-distribution${buildQuery(filters)}`, { headers }),
      ]);

      const growthJson = await growthRes.json();
      const revenueJson = await revenueRes.json();
      const employeeDistJson = await employeeDistRes.json();
      const planDistJson = await planDistRes.json();

      const anyReportDatasetDenied =
        !growthRes.ok ||
        growthJson?.success === false ||
        !revenueRes.ok ||
        revenueJson?.success === false ||
        !employeeDistRes.ok ||
        employeeDistJson?.success === false ||
        !planDistRes.ok ||
        planDistJson?.success === false;

      if (anyReportDatasetDenied) {
        const filteredCompanies = filterCompaniesByForm(companyList, filters);
        const derived = buildReportsFromCompanies(filteredCompanies);
        setMonthlyCompanyGrowth(derived.monthlyCompanyGrowth);
        setMonthlyRevenue(derived.monthlyRevenue);
        setEmployeeDistribution(derived.employeeDistribution);
        setSubscriptionDistribution(derived.subscriptionDistribution);
        return;
      }

      setMonthlyCompanyGrowth(normalizeChartRows(growthJson?.data));
      setMonthlyRevenue(normalizeChartRows(revenueJson?.data));
      setEmployeeDistribution(normalizeChartRows(employeeDistJson?.data));
      setSubscriptionDistribution(normalizeChartRows(planDistJson?.data));
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planOptions = useMemo(
    () => Array.from(new Set(companies.map((c) => normalizePlan(c.plan)))).filter(Boolean),
    [companies]
  );

  const _filteredCompanies = useMemo(
    () => companies.filter((c) => !filters.companyId || String(c.id) === String(filters.companyId)),
    [companies, filters.companyId]
  );

  const exportCsv = () => {
    downloadBackendFile("/api/reports/export/csv", "truecorehr-reports.csv");
  };

  const exportPdf = () => {
    downloadBackendFile("/api/reports/export/pdf", "truecorehr-reports.pdf");
  };

  const buildQuery = (params) => {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        q.set(key, String(value).trim());
      }
    });
    const query = q.toString();
    return query ? `?${query}` : "";
  };

  const downloadBackendFile = async (path, fileName) => {
    try {
      const res = await fetch(`${API_BASE_URL}${path}${buildQuery(filters)}`, {
        headers: { Authorization: authHeader() },
      });
      if (!res.ok) {
        throw new Error(`Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.message || "Failed to download report");
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Global analytics with filters, charts, and exports.</p>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              <Download size={15} />
              CSV
            </button>
            <button
              onClick={exportPdf}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0b2ba9] text-white text-sm font-semibold hover:bg-[#0a2491]"
            >
              <Download size={15} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
          <Filter size={16} /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.companyId}
            onChange={(e) => setFilters((p) => ({ ...p, companyId: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.legalName || `Company ${c.id}`}
              </option>
            ))}
          </select>
          <select
            value={filters.plan}
            onChange={(e) => setFilters((p) => ({ ...p, plan: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Plans</option>
            {planOptions.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={fetchAll}
            className="rounded-lg bg-[#0b2ba9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2491]"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 flex items-center justify-center text-slate-500">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading analytics...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <Card title="Total Companies" value={overview.totalCompanies} />
            <Card title="Total Employees" value={overview.totalEmployees} />
            <Card title="Active Users" value={overview.activeUsers} />
            <Card title="Total Subscriptions" value={overview.totalSubscriptions} />
            <Card title="Revenue Overview" value={currency(overview.revenueOverview)} subtitle="Estimated from plan and billing cycle" />
            <Card title="New Registrations (This Month)" value={overview.newRegistrationsThisMonth || 0} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Monthly Company Growth</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCompanyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0b2ba9" name="Companies" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Monthly Revenue (Estimated)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(val) => currency(val)} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Revenue" stroke="#0f766e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Employee Distribution by Company</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={employeeDistribution} dataKey="value" nameKey="name" outerRadius={110}>
                      {employeeDistribution.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Subscription Plan Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subscriptionDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={110}>
                      {subscriptionDistribution.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

