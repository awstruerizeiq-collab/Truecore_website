import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    Eye,
    EyeOff,
} from "lucide-react";

/* ---------------- API BASE ---------------- */
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
    return "http://localhost:8080";
  }
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

const normalizeRole = (role) => {
    const r = String(role || "").trim().toUpperCase();
    if (r.startsWith("ROLE_")) return r.replace("ROLE_", "");
    if (["GLOBALADMIN", "GLOBAL_ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(r))
        return "GLOBAL_ADMIN";
    return r;
};

export default function GlobalAdminManagement() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ✅ Backend endpoint
    const endpoint = "/api/global-admin/auth/users";

    // ✅ Modal states for CRUD
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [visiblePasswordRows, setVisiblePasswordRows] = useState({});

    // ✅ Edit form
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "", // optional (only to reset/change)
    });

    const closeModals = () => {
        setIsEditOpen(false);
        setIsDeleteOpen(false);
        setSelected(null);
        setIsPasswordVisible(false);
        setForm({ fullName: "", email: "", password: "" });
    };

    /* ---------------- READ ALL ---------------- */
    const fetchGlobalAdmins = async () => {
        try {
            setLoading(true);
            setErr("");

            const auth = getAuthHeader();
            if (!auth) {
                setErr("Token missing. Please login again.");
                setUsers([]);
                return;
            }

            const res = await fetch(safeApiUrl(endpoint), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: auth,
                },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(
                    `(${res.status}) ${text || (res.status === 403 ? "Forbidden (role issue)" : "Request failed")
                    }`
                );
            }

            const json = await res.json();

            // ApiResponse.success("...", list) => list in json.data
            const list =
                (Array.isArray(json) && json) ||
                (Array.isArray(json.data) && json.data) ||
                (Array.isArray(json.content) && json.content) ||
                (Array.isArray(json?.data?.users) && json.data.users) ||
                [];

            setUsers(list);
        } catch (e) {
            setErr(e?.message || "Failed to load global admins");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalAdmins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Filter ONLY GLOBAL_ADMIN
    const globalAdmins = useMemo(() => {
        return (users || []).filter((u) => {
            const role =
                u.role ||
                u.userRole ||
                u.adminRole ||
                u.position ||
                (Array.isArray(u.authorities) ? u.authorities?.[0]?.authority : "") ||
                "";
            return normalizeRole(role) === "GLOBAL_ADMIN";
        });
    }, [users]);

    /* ---------------- OPEN MODALS ---------------- */
    const openEdit = (u) => {
        setSelected(u);
        setIsPasswordVisible(false);
        setForm({
            fullName: u.fullName || u.name || u.username || "",
            email: u.email || u.officialEmail || u.workEmail || "",
            password: "", // never prefill
        });
        setIsEditOpen(true);
    };

    const openDelete = (u) => {
        setSelected(u);
        setIsDeleteOpen(true);
    };

    const toggleRowPasswordVisibility = (key) => {
        setVisiblePasswordRows((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    /* ---------------- UPDATE ---------------- */
    const updateGlobalAdmin = async () => {
        try {
            setLoading(true);
            setErr("");

            const auth = getAuthHeader();
            if (!auth) throw new Error("Token missing. Please login again.");

            const id = selected?.id || selected?.userId;
            if (!id) throw new Error("Missing admin id");

            const payload = {
                fullName: form.fullName?.trim(),
                email: form.email?.trim(),
                ...(form.password?.trim() ? { password: form.password.trim() } : {}),
            };

            const res = await fetch(safeApiUrl(`/api/global-admin/auth/users/${id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: auth,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`(${res.status}) ${text || "Update failed"}`);
            }

            closeModals();
            await fetchGlobalAdmins();
        } catch (e) {
            setErr(e?.message || "Failed to update global admin");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- DELETE ---------------- */
    const deleteGlobalAdmin = async () => {
        try {
            setLoading(true);
            setErr("");

            const auth = getAuthHeader();
            if (!auth) throw new Error("Token missing. Please login again.");

            const id = selected?.id || selected?.userId;
            if (!id) throw new Error("Missing admin id");

            const res = await fetch(safeApiUrl(`/api/global-admin/auth/users/${id}`), {
                method: "DELETE",
                headers: { Authorization: auth },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`(${res.status}) ${text || "Delete failed"}`);
            }

            closeModals();
            await fetchGlobalAdmins();
        } catch (e) {
            setErr(e?.message || "Failed to delete global admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Global Admin Management
                    </h1>
                    <p className="text-sm text-slate-500">
                        View and manage registered global admins.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/global-admin/dashboard")}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <button
                        onClick={fetchGlobalAdmins}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>

                    <button
                        onClick={() => navigate("/global-admin/register")}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#010f5e] transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Global Admin
                    </button>
                </div>
            </div>

            {/* Error */}
            {err && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-800">Error</p>
                        <p className="text-xs text-red-700 mt-1">{err}</p>
                        <button
                            onClick={fetchGlobalAdmins}
                            className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                    <div className="rounded-xl bg-blue-50 p-2">
                        <ShieldCheck className="h-5 w-5 text-[#011A8B]" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-slate-800">
                            Registered Global Admins
                        </p>
                        <p className="text-xs text-slate-500">
                            Showing only users with role:{" "}
                            <span className="font-mono">GLOBAL_ADMIN</span>
                        </p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Count:{" "}
                        <span className="font-semibold text-slate-700">
                            {loading ? "..." : globalAdmins.length}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="text-left text-xs font-semibold text-slate-600">
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Email</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Password</th>
                                <th className="px-5 py-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className="px-5 py-6 text-sm text-slate-500" colSpan={5}>
                                        Loading global admins...
                                    </td>
                                </tr>
                            ) : globalAdmins.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                        colSpan={5}
                                    >
                                        No global admins found.
                                    </td>
                                </tr>
                            ) : (
                                globalAdmins.map((u, idx) => {
                                    const name = u.fullName || u.name || u.username || "-";
                                    const email = u.email || u.officialEmail || u.workEmail || "-";
                                    const rowKey = u.id || u.userId || email || idx;
                                    const role = normalizeRole(
                                        u.role || u.userRole || u.adminRole || u.position || ""
                                    );
                                    return (
                                        <tr
                                            key={rowKey}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-5 py-4 text-sm font-medium text-slate-800">
                                                {name}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {email}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                    {role || "GLOBAL_ADMIN"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {visiblePasswordRows[rowKey]
                                                            ? "Stored securely"
                                                            : "********"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRowPasswordVisibility(rowKey)}
                                                        className="text-slate-500 hover:text-slate-700"
                                                        aria-label={
                                                            visiblePasswordRows[rowKey]
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                        title={
                                                            visiblePasswordRows[rowKey]
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                    >
                                                        {visiblePasswordRows[rowKey] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openDelete(u)}
                                                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Note */}
            <p className="mt-4 text-xs text-slate-500">
                API used: <span className="font-mono">{safeApiUrl(endpoint)}</span>
            </p>

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
                        <h2 className="text-lg font-bold text-slate-800">
                            Edit Global Admin
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Leave password empty if you don’t want to change it.
                        </p>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Full Name
                                </label>
                                <input
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    value={form.fullName}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, fullName: e.target.value }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    Email
                                </label>
                                <input
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, email: e.target.value }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600">
                                    New Password (optional)
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type={isPasswordVisible ? "text" : "password"}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm"
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, password: e.target.value }))
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordVisible((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                        title={isPasswordVisible ? "Hide password" : "Show password"}
                                    >
                                        {isPasswordVisible ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={closeModals}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateGlobalAdmin}
                                className="rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#010f5e]"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
                        <h2 className="text-lg font-bold text-slate-800">
                            Delete Global Admin
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">
                                {selected?.fullName || selected?.name || "this admin"}
                            </span>
                            ?
                        </p>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={closeModals}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteGlobalAdmin}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
