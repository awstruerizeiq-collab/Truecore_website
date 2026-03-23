import React, { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, Search } from "lucide-react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export default function SystemLogs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stats, setStats] = useState({
    totalLogs: 0,
    filteredLogs: 0,
    logsLast24Hours: 0,
  });
  const [logs, setLogs] = useState([]);

  const uniqueActions = useMemo(() => {
    const set = new Set(
      logs.map((log) => String(log.action || "").trim()).filter(Boolean)
    );
    return Array.from(set);
  }, [logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (action.trim()) params.set("action", action.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", "300");

      const res = await fetch(`${API_BASE_URL}/api/global-admin/system-logs?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
      });
      const payload = await safeJson(res);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to fetch system logs");
      }

      const data = payload?.data || {};
      setStats({
        totalLogs: Number(data.totalLogs || 0),
        filteredLogs: Number(data.filteredLogs || 0),
        logsLast24Hours: Number(data.logsLast24Hours || 0),
      });
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (e) {
      setError(e?.message || "Unable to fetch logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="px-4 md:px-6 py-6 space-y-5">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 inline-flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">System Logs</h2>
              <p className="text-slate-500">View system activity logs and audit trails</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Logs" value={stats.totalLogs} />
        <StatCard title="Filtered Logs" value={stats.filteredLogs} />
        <StatCard title="Logs (Last 24h)" value={stats.logsLast24Hours} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, details, user, IP..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
        <button
          onClick={fetchLogs}
          className="rounded-lg bg-[#0b2ba9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#092186]"
        >
          Apply
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Details</th>
                <th className="px-4 py-3 text-left">Performed By</th>
                <th className="px-4 py-3 text-left">IP Address</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No logs found for selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.action || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.details || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.performedBy || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.ipAddress || "-"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
