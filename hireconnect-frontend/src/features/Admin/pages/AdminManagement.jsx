import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import { getDefaultRouteForRole, resolveAccessContext } from "../../../lib/planAccessConfig.js";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const emptyEdit = { name: "", officialEmail: "", mobile: "" };
const passwordPolicyRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const safeParse = (text) => {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
};

export default function AdminManagement({ onBack }) {
  const navigate = useNavigate();
  const accessContext = resolveAccessContext();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toasts, setToasts] = useState([]);

  const [showEdit, setShowEdit] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editErr, setEditErr] = useState({});
  const [editSubmitErr, setEditSubmitErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const authHeader = () => {
    const raw = (localStorage.getItem("token") || "").trim() || (sessionStorage.getItem("token") || "").trim();
    return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
  };
  const tenantCode = () => (localStorage.getItem("tenantCode") || "").trim();
  const companyId = () => {
    const raw = (localStorage.getItem("companyId") || "").trim();
    return !raw || raw === "null" || raw === "undefined" ? "" : raw;
  };
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: authHeader(),
    ...(tenantCode() ? { "X-Tenant-Code": tenantCode() } : {}),
    ...(companyId() ? { "X-Company-Id": companyId() } : {}),
  });
  const url = (path) => {
    const base = (API_BASE_URL || "").replace(/\/+$/, "");
    const clean = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${clean}` : `/${clean}`;
  };

  const toast = (type, message) => {
    const id = Date.now() + Math.floor(Math.random() * 999);
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2600);
  };

  const validateEmail = (v) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(v || "").trim());
  const normalizeMobile = (v) => String(v || "").replace(/[^\d]/g, "");
  const validateMobile = (v) => {
    const digits = normalizeMobile(v);
    if (!digits) return { ok: true, digits };
    if (digits.length < 10 || digits.length > 15) return { ok: false, digits };
    return { ok: true, digits };
  };
  const isTlRole = (v) => ["TEAM_LEAD", "TEAM_LEADER"].includes(String(v || "").trim().toUpperCase().replace(/[\s-]+/g, "_"));

  const fetchTeamLeaders = async () => {
    try {
      setLoading(true);
      setLoadError("");
      if (!authHeader() || !tenantCode() || !companyId()) {
        setLoadError("Tenant info missing. Please log in again.");
        return;
      }
      const res = await fetch(url("/api/users/tenant/team-leaders"), { method: "GET", headers: headers() });
      const text = await res.text().catch(() => "");
      const data = safeParse(text);
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Failed to load team leaders.");
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setAdmins(list);
    } catch (e) {
      setLoadError(e?.message || "Failed to load team leaders.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOne = async (id) => {
    const res = await fetch(url(`/api/users/tenant/${id}`), { method: "GET", headers: headers() });
    const text = await res.text().catch(() => "");
    const data = safeParse(text);
    if (!res.ok || data?.success === false) throw new Error(data?.message || "Failed to fetch details.");
    return data?.data || data;
  };

  useEffect(() => {
    fetchTeamLeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamLeaders = useMemo(
    () => admins.filter((u) => isTlRole(u?.role) || isTlRole(u?.adminRole) || isTlRole(u?.position)),
    [admins]
  );

  const openEdit = async (row) => {
    try {
      setEditing(true);
      const u = await fetchOne(row.id);
      setEditUserId(row.id);
      setEditForm({
        name: u?.fullName || u?.name || "",
        officialEmail: u?.officialEmail || u?.email || "",
        mobile: u?.mobile || "",
      });
      setEditErr({});
      setEditSubmitErr("");
      setResetMode(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setShowEdit(true);
    } catch (e) {
      toast("error", e?.message || "Unable to open edit.");
    } finally {
      setEditing(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!editForm.name.trim()) err.name = "Name is required.";
    if (!validateEmail(editForm.officialEmail)) err.officialEmail = "Valid email is required.";
    const m = validateMobile(editForm.mobile);
    if (!m.ok) err.mobile = "Mobile must be 10 to 15 digits.";
    if (resetMode) {
      if (!passwordForm.newPassword.trim()) err.newPassword = "New Password is required.";
      if (!passwordForm.confirmPassword.trim()) err.confirmPassword = "Confirm New Password is required.";
      if (
        passwordForm.newPassword.trim() &&
        passwordForm.confirmPassword.trim() &&
        passwordForm.newPassword !== passwordForm.confirmPassword
      ) {
        err.confirmPassword = "Passwords do not match.";
      }
      if (passwordForm.newPassword && !passwordPolicyRegex.test(passwordForm.newPassword)) {
        err.newPassword = "Password must be at least 8 characters with 1 uppercase and 1 number.";
      }
    }
    setEditErr(err);
    if (Object.keys(err).length) return;

    try {
      setEditing(true);
      setEditSubmitErr("");
      const payload = {
        fullName: editForm.name.trim(),
        officialEmail: editForm.officialEmail.trim(),
        mobile: m.digits,
      };
      const res = await fetch(url(`/api/users/tenant/${editUserId}`), {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      const data = safeParse(text);
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Update failed.");

      if (resetMode) {
        const resetRes = await fetch(url(`/api/users/tenant/team-leaders/${editUserId}/reset-password`), {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ newPassword: passwordForm.newPassword.trim() }),
        });
        const resetText = await resetRes.text().catch(() => "");
        const resetData = safeParse(resetText);
        if (!resetRes.ok || resetData?.success === false) {
          throw new Error(resetData?.message || "Password reset failed.");
        }
      }

      setShowEdit(false);
      setEditUserId(null);
      toast("success", resetMode ? "Team Leader password updated successfully" : "Team leader updated successfully.");
      setResetMode(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      await fetchTeamLeaders();
    } catch (e3) {
      setEditSubmitErr(e3?.message || "Update failed.");
    } finally {
      setEditing(false);
    }
  };

  const openDetails = async (row) => {
    try {
      setShowDetails(true);
      setDetailsLoading(true);
      setDetails(null);
      const u = await fetchOne(row.id);
      setDetails(u);
    } catch (e) {
      toast("error", e?.message || "Unable to load details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setDeleting(true);
      const res = await fetch(url(`/api/users/tenant/${deleteTarget.id}`), { method: "DELETE", headers: headers() });
      const text = await res.text().catch(() => "");
      const data = safeParse(text);
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Delete failed.");
      setDeleteTarget(null);
      toast("success", "Team leader deleted successfully.");
      await fetchTeamLeaders();
    } catch (e) {
      toast("error", e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="text-slate-900">
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded-lg border text-sm font-semibold shadow ${t.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
            {t.message}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="m-0 text-2xl font-bold">Team_Leader Management</h1>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-300 bg-white text-sm font-semibold"
            onClick={() =>
              (typeof onBack === "function"
                ? onBack()
                : navigate(getDefaultRouteForRole(accessContext.role), { replace: true }))
            }
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {(loading || loadError) && (
          <div className="px-3 py-2 text-sm">
            {loading && <p>Loading team leaders...</p>}
            {loadError && <p className="text-red-600">{loadError}</p>}
          </div>
        )}
        <table className="w-full border-collapse">
          <thead className="bg-[#0b0b76] text-white text-sm">
            <tr>
              <th className="text-left px-4 py-3">Team Leader Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamLeaders.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-600">{loading ? "Loading..." : loadError ? "Failed to load team leaders." : "No team leaders found."}</td></tr>
            ) : (
              teamLeaders.map((u) => (
                <tr key={u.id || u.email} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3">{u.fullName || u.name || "-"}</td>
                  <td className="px-4 py-3">{u.officialEmail || u.email || "-"}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Team Leader</span></td>
                  <td className="px-4 py-3">
                    <button title="Edit" className="mr-2 p-1.5 rounded border border-slate-200" disabled={editing || deleting} onClick={() => openEdit(u)}><Pencil size={14} /></button>
                    <button title="View Details" className="mr-2 p-1.5 rounded border border-slate-200" disabled={detailsLoading || deleting} onClick={() => openDetails(u)}><Eye size={14} /></button>
                    <button title="Delete" className="p-1.5 rounded border border-red-200 text-red-600" disabled={editing || deleting} onClick={() => setDeleteTarget({ id: u.id, name: u.fullName || u.name || "this Team Leader" })}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 p-4 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && !editing && setShowEdit(false)}>
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-lg">Edit Team Leader</h2><button onClick={() => !editing && setShowEdit(false)}><X /></button></div>
            <form className="p-4 space-y-3" onSubmit={submitEdit}>
              <div><label className="text-sm font-semibold">Name *</label><input className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />{editErr.name && <p className="text-xs text-red-600 mt-1">{editErr.name}</p>}</div>
              <div><label className="text-sm font-semibold">Official Email *</label><input className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2" value={editForm.officialEmail} onChange={(e) => setEditForm((p) => ({ ...p, officialEmail: e.target.value }))} />{editErr.officialEmail && <p className="text-xs text-red-600 mt-1">{editErr.officialEmail}</p>}</div>
              <div><label className="text-sm font-semibold">Mobile Number</label><input className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2" value={editForm.mobile} onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))} />{editErr.mobile && <p className="text-xs text-red-600 mt-1">{editErr.mobile}</p>}</div>
              <div className="pt-1">
                <button
                  type="button"
                  className="text-sm font-semibold text-[#0b0b76] underline"
                  onClick={() => {
                    setResetMode((prev) => !prev);
                    setPasswordForm({ newPassword: "", confirmPassword: "" });
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                    setEditErr((prev) => {
                      const next = { ...prev };
                      delete next.newPassword;
                      delete next.confirmPassword;
                      return next;
                    });
                  }}
                >
                  Reset Password
                </button>
              </div>
              {resetMode && (
                <>
                  <div>
                    <label className="text-sm font-semibold">New Password *</label>
                    <div className="relative mt-1">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      />
                      <button type="button" className="absolute right-2 top-2.5 text-slate-500" onClick={() => setShowNewPassword((p) => !p)}>
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {editErr.newPassword && <p className="text-xs text-red-600 mt-1">{editErr.newPassword}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Confirm New Password *</label>
                    <div className="relative mt-1">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      />
                      <button type="button" className="absolute right-2 top-2.5 text-slate-500" onClick={() => setShowConfirmPassword((p) => !p)}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {editErr.confirmPassword && <p className="text-xs text-red-600 mt-1">{editErr.confirmPassword}</p>}
                  </div>
                </>
              )}
              {editSubmitErr && <p className="text-sm text-red-600">{editSubmitErr}</p>}
              <div className="flex justify-end gap-2"><button type="button" className="px-3 py-2 rounded-lg border border-slate-300" onClick={() => !editing && setShowEdit(false)}>Cancel</button><button type="submit" className="px-3 py-2 rounded-lg border border-[#0b0b76] bg-[#0b0b76] text-white">{editing ? "Saving..." : "Save Changes"}</button></div>
            </form>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 p-4 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && setShowDetails(false)}>
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-lg">Team Leader Details</h2><button onClick={() => setShowDetails(false)}><X /></button></div>
            {detailsLoading ? (
              <div className="p-4 text-sm">Loading details...</div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {[
                  ["Name", details?.fullName || details?.name],
                  ["Employee ID", details?.employeeId],
                  ["Role", details?.role],
                  ["Department", details?.department],
                  ["Position", details?.position],
                  ["Official Email", details?.officialEmail || details?.email],
                  ["Personal Email", details?.personalEmail || details?.privateEmail],
                  ["Mobile", details?.mobile],
                  ["Status", details?.status],
                  ["Joining Date", details?.joiningDate],
                  ["Reporting Manager", details?.reportingManager || details?.managerName || details?.teamLeader],
                  ["Work Location", details?.workLocation || details?.location],
                  ["Company", details?.companyName],
                  ["Tenant Code", details?.tenantCode],
                ].map(([k, v]) => (
                  <div key={k} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <p className="text-xs text-slate-500">{k}</p>
                    <p className="font-semibold">{v || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 p-4 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}>
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-lg">Confirm Delete</h2><button onClick={() => !deleting && setDeleteTarget(null)}><X /></button></div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-2"><AlertTriangle size={18} /><strong>Are you sure?</strong></div>
              <p className="text-sm text-slate-700">Are you sure you want to delete this Team Leader?<br /><strong>{deleteTarget.name}</strong></p>
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-3 py-2 rounded-lg border border-slate-300" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="px-3 py-2 rounded-lg border border-red-600 bg-red-600 text-white" disabled={deleting} onClick={doDelete}>{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
