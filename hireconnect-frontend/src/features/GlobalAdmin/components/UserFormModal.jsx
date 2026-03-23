import React, { useEffect, useState } from "react";

const initialState = {
  name: "",
  email: "",
  password: "",
  role: "",
  companyId: "",
  status: "active",
};

export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  roles,
  editingUser,
  selectedCompany,
  loading,
}) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  const mode = editingUser ? "edit" : "create";

  useEffect(() => {
    if (!open) return;
    if (editingUser) {
      setForm({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role?._id || "",
        companyId: editingUser.companyId || "",
        status: editingUser.status || "active",
      });
    } else {
      setForm({
        ...initialState,
        companyId: String(selectedCompany?.id || ""),
      });
    }
    setErrors({});
  }, [open, editingUser, selectedCompany]);

  if (!open) return null;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) next.email = "Valid email is required";
    if (mode === "create" && (!form.password || form.password.length < 6)) {
      next.password = "Password must be at least 6 characters";
    }
    if (!form.role) next.role = "Role is required";
    if (!form.companyId.trim()) next.companyId = "Company ID is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      companyId: form.companyId.trim(),
      tenantCode: selectedCompany?.tenantCode || editingUser?.tenantCode || "",
      companyName: selectedCompany?.displayName || editingUser?.companyName || "",
      status: form.status,
    };
    if (form.password) payload.password = form.password;
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
        <h3 className="text-xl font-bold text-slate-900">{mode === "create" ? "Add User" : "Edit User"}</h3>
        <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
          <Field label="Name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <input
              type="password"
              placeholder={mode === "edit" ? "Leave blank to keep existing" : "Enter password"}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Role" error={errors.role}>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company ID" error={errors.companyId}>
            <input
              value={form.companyId}
              onChange={(e) => setForm((p) => ({ ...p, companyId: e.target.value }))}
              disabled={Boolean(selectedCompany)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="col-span-full flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#0b2ba9] text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Saving..." : mode === "create" ? "Create User" : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </label>
  );
}
