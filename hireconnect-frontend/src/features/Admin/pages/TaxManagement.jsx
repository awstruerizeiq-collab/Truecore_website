import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import FinanceModuleShell from "./FinanceModuleShell";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};

const getCurrentUserId = () => {
  const raw =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId") ||
    localStorage.getItem("id") ||
    sessionStorage.getItem("id") ||
    localStorage.getItem("user_id") ||
    sessionStorage.getItem("user_id") ||
    "";
  const parsed = Number(String(raw).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseResponseData = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.declarations)) return payload.declarations;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const currency = (value) => {
  const parsed = Number(value || 0);
  return parsed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TaxManagement() {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  const headers = useMemo(() => {
    const auth = getAuthHeader();
    const companyId =
      localStorage.getItem("companyId") ||
      sessionStorage.getItem("companyId") ||
      "";

    return {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
      ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
    };
  }, []);

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    setError("");

    const tryEndpoints = [
      `${API_BASE_URL}/api/finance/tax-declarations/all`,
      `${API_BASE_URL}/api/tax-declarations/all`,
      `${API_BASE_URL}/api/finance/tax-declarations`,
      `${API_BASE_URL}/api/tax-declarations`,
    ];

    let lastError = "Failed to load tax declarations.";

    for (const endpoint of tryEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers,
          credentials: "include",
        });

        const contentType = res.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
          ? await res.json().catch(() => null)
          : null;

        if (!res.ok) {
          lastError = payload?.message || `Failed to load tax declarations (${res.status}).`;
          continue;
        }

        const rows = parseResponseData(payload);
        setDeclarations(Array.isArray(rows) ? rows : []);
        setLoading(false);
        return;
      } catch (err) {
        lastError = err?.message || lastError;
      }
    }

    setDeclarations([]);
    setError(lastError);
    setLoading(false);
  }, [headers]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const filtered = useMemo(() => {
    return declarations.filter((item) => {
      const status = String(item?.status || "").toUpperCase();
      const financialYear = String(item?.financialYear || "").toLowerCase();
      const userId = String(item?.userId || "").toLowerCase();
      const query = search.trim().toLowerCase();

      const matchesStatus = statusFilter === "ALL" ? true : status === statusFilter;
      const matchesSearch =
        !query || financialYear.includes(query) || userId.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [declarations, search, statusFilter]);

  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    declarations.forEach((item) => {
      const status = String(item?.status || "").toUpperCase();
      if (status === "PENDING") pending += 1;
      if (status === "APPROVED") approved += 1;
      if (status === "REJECTED") rejected += 1;
    });

    return { total: declarations.length, pending, approved, rejected };
  }, [declarations]);

  const submitAction = useCallback(
    async (id, action, reason = "") => {
      const approvedBy = getCurrentUserId();
      setProcessingId(id);
      setError("");

      try {
        const endpoint = `${API_BASE_URL}/api/finance/tax-declarations/${id}/${action}`;
        const payload = {
          ...(approvedBy ? { approvedBy } : {}),
          ...(action === "reject" ? { reason } : {}),
        };

        const res = await fetch(endpoint, {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => null)
          : null;

        if (!res.ok) {
          throw new Error(data?.message || `Failed to ${action} declaration (${res.status}).`);
        }

        await fetchDeclarations();
      } catch (err) {
        setError(err?.message || `Unable to ${action} declaration.`);
      } finally {
        setProcessingId(null);
      }
    },
    [fetchDeclarations, headers]
  );

  const handleApprove = (item) => {
    submitAction(item.id, "approve");
  };

  const handleReject = (item) => {
    const reason = window.prompt("Enter rejection reason:") || "";
    if (!reason.trim()) return;
    submitAction(item.id, "reject", reason.trim());
  };

  return (
    <FinanceModuleShell
      title="Tax Management"
      description="Review declarations and manage tax-related workflows."
      allowedRoles={["CEO", "ADMIN", "MANAGER", "SUPER_ADMIN", "GLOBAL_ADMIN", "COMPANY_ADMIN"]}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs text-yellow-700">Pending</p>
            <p className="mt-1 text-xl font-semibold text-yellow-800">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs text-green-700">Approved</p>
            <p className="mt-1 text-xl font-semibold text-green-800">{summary.approved}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-red-700">Rejected</p>
            <p className="mt-1 text-xl font-semibold text-red-800">{summary.rejected}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user ID or financial year"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              onClick={fetchDeclarations}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Financial Year</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">80C</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">80D</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">HRA</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Other</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Submitted At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-700" />
                    <p className="mt-2 text-sm text-slate-500">Loading declarations...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center">
                    <FileText className="mx-auto h-6 w-6 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">No tax declarations found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const section80c = Number(item?.section80c || 0);
                  const section80d = Number(item?.section80d || 0);
                  const hra = Number(item?.hraExemption || 0);
                  const other = Number(item?.otherExemptions || 0);
                  const total = section80c + section80d + hra + other;
                  const status = String(item?.status || "PENDING").toUpperCase();
                  const isPending = status === "PENDING";
                  const isProcessing = processingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{item?.userId || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item?.financialYear || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">Rs. {currency(section80c)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">Rs. {currency(section80d)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">Rs. {currency(hra)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">Rs. {currency(other)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Rs. {currency(total)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item?.createdAt)}</td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(item)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                            >
                              <CheckCircle2 size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(item)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FinanceModuleShell>
  );
}
