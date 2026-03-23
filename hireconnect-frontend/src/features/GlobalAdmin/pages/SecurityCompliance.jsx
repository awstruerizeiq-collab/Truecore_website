import React, { useEffect, useMemo, useState } from "react";
import { Lock, RefreshCw, Save, ShieldAlert } from "lucide-react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const defaultSettings = {
  enforceMfaForAdmins: false,
  passwordMinLength: 8,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  auditRetentionDays: 180,
};

const authHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
};

const apiUrl = (path) => `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export default function SecurityCompliance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [stats, setStats] = useState({
    totalAuditLogs: 0,
    auditLogsLast24Hours: 0,
    failedLoginEventsLast24Hours: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  const securityScore = useMemo(() => {
    let score = 100;
    if (!settings.enforceMfaForAdmins) score -= 20;
    if ((settings.passwordMinLength || 0) < 8) score -= 20;
    if ((settings.maxLoginAttempts || 0) > 5) score -= 15;
    if ((settings.sessionTimeoutMinutes || 0) > 60) score -= 15;
    if ((settings.auditRetentionDays || 0) < 90) score -= 10;
    return Math.max(0, score);
  }, [settings]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(apiUrl("/api/global-admin/security-compliance"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
      });
      const data = await safeJson(res);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to load security compliance overview.");
      }

      const payload = data?.data || {};
      setSettings({ ...defaultSettings, ...(payload.settings || {}) });
      setStats({
        totalAuditLogs: Number(payload.totalAuditLogs || 0),
        auditLogsLast24Hours: Number(payload.auditLogsLast24Hours || 0),
        failedLoginEventsLast24Hours: Number(payload.failedLoginEventsLast24Hours || 0),
      });
      setRecentLogs(Array.isArray(payload.recentAuditLogs) ? payload.recentAuditLogs : []);
    } catch (e) {
      setError(e?.message || "Unable to load Security & Compliance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        enforceMfaForAdmins: !!settings.enforceMfaForAdmins,
        passwordMinLength: Number(settings.passwordMinLength || 8),
        sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes || 30),
        maxLoginAttempts: Number(settings.maxLoginAttempts || 5),
        auditRetentionDays: Number(settings.auditRetentionDays || 180),
      };

      const res = await fetch(apiUrl("/api/global-admin/security-compliance/settings"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to save security settings.");
      }

      setSettings((prev) => ({ ...prev, ...(data?.data || {}) }));
      setMessage("Security settings updated successfully.");
    } catch (e) {
      setError(e?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const setField = (name, value) => setSettings((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="px-4 md:px-6 py-6 space-y-5">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 inline-flex items-center justify-center">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Security & Compliance</h2>
              <p className="text-slate-500">
                Monitor security settings and ensure compliance standards
              </p>
            </div>
          </div>
          <button
            onClick={loadOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {(error || message) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Security Score" value={`${securityScore}%`} />
        <StatCard title="Total Audit Logs" value={stats.totalAuditLogs} />
        <StatCard title="Logs (Last 24h)" value={stats.auditLogsLast24Hours} />
        <StatCard title="Failed Logins (24h)" value={stats.failedLoginEventsLast24Hours} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Security Settings</h3>

          <ToggleRow
            label="Enforce MFA for Admins"
            checked={!!settings.enforceMfaForAdmins}
            onChange={(v) => setField("enforceMfaForAdmins", v)}
          />

          <NumberField
            label="Password Minimum Length"
            value={settings.passwordMinLength}
            min={6}
            onChange={(v) => setField("passwordMinLength", v)}
          />
          <NumberField
            label="Session Timeout (minutes)"
            value={settings.sessionTimeoutMinutes}
            min={5}
            onChange={(v) => setField("sessionTimeoutMinutes", v)}
          />
          <NumberField
            label="Maximum Login Attempts"
            value={settings.maxLoginAttempts}
            min={3}
            onChange={(v) => setField("maxLoginAttempts", v)}
          />
          <NumberField
            label="Audit Retention (days)"
            value={settings.auditRetentionDays}
            min={30}
            onChange={(v) => setField("auditRetentionDays", v)}
          />

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b2ba9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#092186] disabled:opacity-60"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Security Settings"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Recent Security Events</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading events...</p>
          ) : recentLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No security events available.
            </div>
          ) : (
            <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Details</th>
                    <th className="px-3 py-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {log.action || "N/A"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {log.details || "No details"}
                      </td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <ShieldAlert size={14} />
            Review failed login spikes and tighten security policies when needed.
          </div>
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

function NumberField({ label, value, onChange, min = 0 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        min={min}
        value={value ?? min}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <button
        type="button"
        className={`h-7 w-12 rounded-full p-1 transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white block transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
