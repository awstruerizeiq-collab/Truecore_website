import React, { useEffect, useState } from "react";
import {
  Settings,
  ShieldCheck,
  Bell,
  SlidersHorizontal,
  RefreshCw,
  Save,
  AlertCircle,
} from "lucide-react";

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

  if (isLocalHost) {
    // Keep settings page functional in local dev even without proxy config.
    return "http://localhost:8080";
  }

  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const defaultSettings = {
  platformName: "TrueCoreHR",
  supportEmail: "support@truecorehr.com",
  defaultTimezone: "Asia/Kolkata",
  defaultCurrency: "INR",
  maintenanceMode: false,
  allowCompanySelfSignup: true,
  enforceMfaForAdmins: false,
  passwordMinLength: 8,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  emailOnNewCompany: true,
  emailOnBillingAlert: true,
  auditRetentionDays: 180,
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const extractErrorMessage = async (res, parsed) => {
  if (parsed?.message) return parsed.message;
  try {
    const text = await res.text();
    if (text && text.trim()) return text;
  } catch {
    // ignore
  }
  return `Request failed (HTTP ${res.status})`;
};

export default function SystemSettings() {
  const [form, setForm] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const authHeader = () => {
    const raw =
      (localStorage.getItem("token") || "").trim() ||
      (sessionStorage.getItem("token") || "").trim();
    return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
  };

  const url = (path) => {
    const base = (API_BASE_URL || "").replace(/\/+$/, "");
    const clean = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${clean}` : `/${clean}`;
  };

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url("/api/global-admin/settings"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
      });
      const data = await safeJson(res);
      if (!res.ok || data?.success === false) {
        throw new Error(await extractErrorMessage(res, data));
      }

      const payload = data?.data || {};
      setForm({
        ...defaultSettings,
        ...payload,
      });
    } catch (e) {
      setError(e?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(url("/api/global-admin/settings"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        body: JSON.stringify(form),
      });
      const data = await safeJson(res);
      if (!res.ok || data?.success === false) {
        throw new Error(await extractErrorMessage(res, data));
      }
      setForm({ ...defaultSettings, ...(data?.data || {}) });
      setToast({ type: "success", message: "System settings updated successfully." });
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="px-4 md:px-6 py-6 bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f7f9ff_45%,#f3f5fb_100%)] min-h-screen text-slate-900">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg border text-sm font-semibold shadow ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0d2f8f] to-[#1f4ecf] text-white p-6 border border-blue-700/40 shadow-[0_12px_36px_rgba(13,47,143,0.22)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15">
                <Settings size={14} />
                Global Configuration
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-3">System Settings</h1>
              <p className="text-blue-100 text-sm mt-1">
                Configure platform-wide behavior, security policies, and notifications.
              </p>
            </div>
            <button
              onClick={loadSettings}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Reload
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="General" icon={SlidersHorizontal}>
            <Input label="Platform Name" value={form.platformName} onChange={(v) => update("platformName", v)} />
            <Input label="Support Email" type="email" value={form.supportEmail} onChange={(v) => update("supportEmail", v)} />
            <Input label="Default Timezone" value={form.defaultTimezone} onChange={(v) => update("defaultTimezone", v)} />
            <Input label="Default Currency" value={form.defaultCurrency} onChange={(v) => update("defaultCurrency", v.toUpperCase())} />
            <Toggle
              label="Maintenance Mode"
              help="Temporarily restrict access for maintenance windows."
              checked={!!form.maintenanceMode}
              onChange={(v) => update("maintenanceMode", v)}
            />
            <Toggle
              label="Allow Company Self Signup"
              help="Allow companies to register without manual creation."
              checked={!!form.allowCompanySelfSignup}
              onChange={(v) => update("allowCompanySelfSignup", v)}
            />
          </SectionCard>

          <SectionCard title="Security Policies" icon={ShieldCheck}>
            <NumberInput label="Password Min Length" value={form.passwordMinLength} min={6} onChange={(v) => update("passwordMinLength", v)} />
            <NumberInput label="Session Timeout (minutes)" value={form.sessionTimeoutMinutes} min={5} onChange={(v) => update("sessionTimeoutMinutes", v)} />
            <NumberInput label="Max Login Attempts" value={form.maxLoginAttempts} min={3} onChange={(v) => update("maxLoginAttempts", v)} />
            <NumberInput label="Audit Retention (days)" value={form.auditRetentionDays} min={30} onChange={(v) => update("auditRetentionDays", v)} />
            <Toggle
              label="Enforce MFA for Admins"
              help="Require two-factor authentication for admin roles."
              checked={!!form.enforceMfaForAdmins}
              onChange={(v) => update("enforceMfaForAdmins", v)}
            />
          </SectionCard>

          <SectionCard title="Notifications" icon={Bell}>
            <Toggle
              label="Email on New Company Signup"
              help="Notify global admins when a new company is created."
              checked={!!form.emailOnNewCompany}
              onChange={(v) => update("emailOnNewCompany", v)}
            />
            <Toggle
              label="Email on Billing Alerts"
              help="Notify global admins when billing issues occur."
              checked={!!form.emailOnBillingAlert}
              onChange={(v) => update("emailOnBillingAlert", v)}
            />
          </SectionCard>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            onClick={() => setForm(defaultSettings)}
            disabled={saving}
          >
            Reset
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b2ba9] text-white text-sm font-semibold hover:bg-[#0a2491] disabled:opacity-60"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 inline-flex items-center justify-center">
          <Icon size={18} />
        </span>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange, min = 0 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        min={min}
        value={value ?? 0}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      />
    </label>
  );
}

function Toggle({ label, help, checked, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{help}</p>
      </div>
      <button
        type="button"
        className={`h-7 w-12 rounded-full p-1 transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
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
