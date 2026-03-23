import React, { useEffect, useMemo, useState } from "react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const safeApiUrl = (path) => {
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  const clean = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${clean}` : `/${clean}`;
};

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (!raw) return "";
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

const getUserId = () => {
  const fromUserId = (localStorage.getItem("userId") || "").trim();
  if (fromUserId) return fromUserId;
  const fromId = (localStorage.getItem("id") || "").trim();
  if (fromId) return fromId;
  return "";
};

const fmtDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getAuthHeader();
      if (!auth) throw new Error("Token missing. Please login again.");

      const userId = getUserId();
      const headers = {
        "Content-Type": "application/json",
        Authorization: auth,
      };

      let response = null;

      if (userId) {
        response = await fetch(safeApiUrl(`/api/audit/performer/${userId}`), {
          method: "GET",
          headers,
        });
      }

      if (!response || !response.ok) {
        response = await fetch(safeApiUrl("/api/audit/all"), {
          method: "GET",
          headers,
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg =
          errJson?.message ||
          errJson?.error ||
          `Failed to fetch audit logs (${response.status})`;
        throw new Error(errMsg);
      }

      const json = await response.json();
      const list =
        (Array.isArray(json) && json) ||
        (Array.isArray(json.data) && json.data) ||
        [];
      setLogs(list);
    } catch (e) {
      setLogs([]);
      setError(e?.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const total = logs.length;
  const uniqueUsers = useMemo(
    () => new Set(logs.map((l) => l.userId).filter(Boolean)).size,
    [logs]
  );

  return (
    <div className="min-h-screen px-4 md:px-6 py-4">
      <div className="rounded-2xl bg-blue-900 px-6 py-5 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Audit & Logs</h1>
        <p className="text-xs md:text-sm text-blue-100 mt-1">
          Track finance-related actions and audit trail records.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Logs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Affected Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueUsers}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Audit Entries</h2>
          <button
            onClick={loadLogs}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F3F4FF] text-xs font-semibold uppercase tracking-wide text-[#011A8B]">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Details</th>
                <th className="px-4 py-3 text-left">User ID</th>
                <th className="px-4 py-3 text-left">Performed By</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => (
                  <tr key={log.id || `${log.createdAt}-${log.action}`}>
                    <td className="px-4 py-3">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">{log.action || "-"}</td>
                    <td className="px-4 py-3 max-w-[360px] truncate">{log.details || "-"}</td>
                    <td className="px-4 py-3">{log.userId ?? "-"}</td>
                    <td className="px-4 py-3">{log.performedBy ?? "-"}</td>
                    <td className="px-4 py-3">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}