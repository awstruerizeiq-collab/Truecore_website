import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  X,
} from "lucide-react";

import FinanceModuleShell from "./FinanceModuleShell";
import {
  fetchFinanceSettings,
  updateFinanceSettings,
} from "../services/financeSettingsService";

const defaultSettings = {
  templateName: "Standard Payroll",
  templateVariant: "template_1",
  earningsComponents: ["Basic Salary", "House Rent Allowance", "Special Allowance"],
  deductionComponents: ["Provident Fund", "Professional Tax", "TDS"],
  payCycle: "MONTHLY",
  cycleStartDay: 1,
  cycleEndDay: 30,
  payrollProcessingDay: 28,
  salaryDisbursementDay: 30,
  autoGeneratePayslip: true,
  lockPayrollAfterProcessing: true,
  considerAttendance: true,
};

const toDay = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(31, Math.max(1, Math.round(parsed)));
};

const normalizeSettings = (input) => ({
  ...defaultSettings,
  ...(input || {}),
  templateName: String(input?.templateName || defaultSettings.templateName).trim(),
  templateVariant: String(input?.templateVariant || defaultSettings.templateVariant).trim(),
  earningsComponents: Array.isArray(input?.earningsComponents)
    ? input.earningsComponents.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
    : defaultSettings.earningsComponents,
  deductionComponents: Array.isArray(input?.deductionComponents)
    ? input.deductionComponents.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
    : defaultSettings.deductionComponents,
  payCycle: String(input?.payCycle || defaultSettings.payCycle).toUpperCase(),
  cycleStartDay: toDay(input?.cycleStartDay, defaultSettings.cycleStartDay),
  cycleEndDay: toDay(input?.cycleEndDay, defaultSettings.cycleEndDay),
  payrollProcessingDay: toDay(input?.payrollProcessingDay, defaultSettings.payrollProcessingDay),
  salaryDisbursementDay: toDay(input?.salaryDisbursementDay, defaultSettings.salaryDisbursementDay),
  autoGeneratePayslip: input?.autoGeneratePayslip ?? defaultSettings.autoGeneratePayslip,
  lockPayrollAfterProcessing:
    input?.lockPayrollAfterProcessing ?? defaultSettings.lockPayrollAfterProcessing,
  considerAttendance: input?.considerAttendance ?? defaultSettings.considerAttendance,
});

export default function FinanceSettings() {
  const [form, setForm] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [newEarning, setNewEarning] = useState("");
  const [newDeduction, setNewDeduction] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFinanceSettings();
      setForm(normalizeSettings(data));
    } catch (err) {
      setError(err?.message || "Failed to load finance settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addComponent = (type) => {
    const source = type === "earnings" ? newEarning : newDeduction;
    const value = source.trim();
    if (!value) return;

    setForm((prev) => {
      const key = type === "earnings" ? "earningsComponents" : "deductionComponents";
      if (prev[key].some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, [key]: [...prev[key], value] };
    });

    if (type === "earnings") {
      setNewEarning("");
    } else {
      setNewDeduction("");
    }
  };

  const removeComponent = (type, index) => {
    setForm((prev) => {
      const key = type === "earnings" ? "earningsComponents" : "deductionComponents";
      return {
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      };
    });
  };

  const handleReset = () => {
    setForm(defaultSettings);
    setError("");
  };

  const handleSave = async () => {
    if (!form.templateName.trim()) {
      setError("Template name is required.");
      return;
    }
    if (form.cycleEndDay < form.cycleStartDay) {
      setError("Cycle end day must be greater than or equal to cycle start day.");
      return;
    }
    if (!form.earningsComponents.length) {
      setError("Add at least one earning component.");
      return;
    }
    if (!form.deductionComponents.length) {
      setError("Add at least one deduction component.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        templateName: form.templateName.trim(),
        cycleStartDay: toDay(form.cycleStartDay, 1),
        cycleEndDay: toDay(form.cycleEndDay, 30),
        payrollProcessingDay: toDay(form.payrollProcessingDay, 28),
        salaryDisbursementDay: toDay(form.salaryDisbursementDay, 30),
      };
      const updated = await updateFinanceSettings(payload);
      setForm(normalizeSettings(updated));
      setToast({ type: "success", message: "Finance settings saved." });
    } catch (err) {
      const message = err?.message || "Failed to save finance settings.";
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FinanceModuleShell
      title="Finance Settings"
      description="Configure payroll templates and finance cycle preferences."
      allowedRoles={["CEO", "ADMIN", "MANAGER", "SUPER_ADMIN", "GLOBAL_ADMIN", "COMPANY_ADMIN"]}
    >
      {toast ? (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm font-semibold ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Configuration</p>
            <h2 className="text-lg font-bold text-slate-900">Payroll Template and Cycle Preferences</h2>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Reload
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Settings2 size={17} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Payroll Template</h3>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Template Name</span>
              <input
                type="text"
                value={form.templateName}
                onChange={(e) => updateField("templateName", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Template Variant</span>
              <select
                value={form.templateVariant}
                onChange={(e) => updateField("templateVariant", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              >
                <option value="template_1">Template 1</option>
                <option value="template_2">Template 2</option>
                <option value="template_3">Template 3</option>
              </select>
            </label>

            <ComponentEditor
              title="Earning Components"
              draftValue={newEarning}
              onDraftChange={setNewEarning}
              items={form.earningsComponents}
              onAdd={() => addComponent("earnings")}
              onRemove={(index) => removeComponent("earnings", index)}
            />

            <ComponentEditor
              title="Deduction Components"
              draftValue={newDeduction}
              onDraftChange={setNewDeduction}
              items={form.deductionComponents}
              onAdd={() => addComponent("deductions")}
              onRemove={(index) => removeComponent("deductions", index)}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <CalendarClock size={17} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Finance Cycle Preferences</h3>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Pay Cycle</span>
              <select
                value={form.payCycle}
                onChange={(e) => updateField("payCycle", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="SEMI_MONTHLY">Semi-Monthly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Cycle Start Day"
                value={form.cycleStartDay}
                onChange={(value) => updateField("cycleStartDay", value)}
              />
              <NumberField
                label="Cycle End Day"
                value={form.cycleEndDay}
                onChange={(value) => updateField("cycleEndDay", value)}
              />
              <NumberField
                label="Payroll Processing Day"
                value={form.payrollProcessingDay}
                onChange={(value) => updateField("payrollProcessingDay", value)}
              />
              <NumberField
                label="Salary Disbursement Day"
                value={form.salaryDisbursementDay}
                onChange={(value) => updateField("salaryDisbursementDay", value)}
              />
            </div>

            <ToggleField
              label="Auto Generate Payslip"
              help="Generate payslips automatically after payroll processing."
              checked={!!form.autoGeneratePayslip}
              onChange={(value) => updateField("autoGeneratePayslip", value)}
            />
            <ToggleField
              label="Lock Payroll After Processing"
              help="Prevent edits once payroll is processed for the cycle."
              checked={!!form.lockPayrollAfterProcessing}
              onChange={(value) => updateField("lockPayrollAfterProcessing", value)}
            />
            <ToggleField
              label="Consider Attendance"
              help="Use attendance data while calculating payroll."
              checked={!!form.considerAttendance}
              onChange={(value) => updateField("considerAttendance", value)}
            />
          </section>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0b2ba9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2491] disabled:opacity-60"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </FinanceModuleShell>
  );
}

function ComponentEditor({
  title,
  draftValue,
  onDraftChange,
  items,
  onAdd,
  onRemove,
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-3">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}`}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
        />
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-full p-0.5 hover:bg-blue-100"
              aria-label={`Remove ${item}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        min={1}
        max={31}
        value={value}
        onChange={(e) => onChange(toDay(e.target.value, 1))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
      />
    </label>
  );
}

function ToggleField({ label, help, checked, onChange }) {
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
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
