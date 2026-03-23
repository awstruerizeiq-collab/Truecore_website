import React, { useEffect, useState } from "react";
import { RBAC_PERMISSIONS } from "../constants/rbacPermissions.js";

const initialState = {
  roleName: "",
  permissions: [],
};

export default function RoleFormModal({ open, onClose, onSubmit, editingRole, loading }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setForm({
        roleName: editingRole.roleName || "",
        permissions: editingRole.permissions || [],
      });
    } else {
      setForm(initialState);
    }
    setError("");
  }, [open, editingRole]);

  if (!open) return null;

  const togglePermission = (permission) => {
    setForm((prev) => {
      const has = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.roleName.trim()) {
      setError("Role name is required");
      return;
    }
    if (form.permissions.length === 0) {
      setError("Select at least one permission");
      return;
    }
    onSubmit({
      roleName: form.roleName.trim(),
      permissions: form.permissions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
        <h3 className="text-xl font-bold text-slate-900">
          {editingRole ? "Edit Role" : "Create Role"}
        </h3>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Role Name</span>
            <input
              value={form.roleName}
              onChange={(e) => setForm((p) => ({ ...p, roleName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RBAC_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  {permission}
                </label>
              ))}
            </div>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
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
              {loading ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

