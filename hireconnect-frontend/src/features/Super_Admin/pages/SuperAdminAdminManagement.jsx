import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

// -------- API BASE URL (local + production ready) --------
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export default function SuperAdminAdminManagement({ onBack }) {
    const navigate = useNavigate();

    // -------------------- UI STATE --------------------
    const [activeTab, setActiveTab] = useState("admins"); // "admins" | "employees"
    const [showModal, setShowModal] = useState(false);

    // -------------------- DATA STATE --------------------
    const [admins, setAdmins] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [adminsError, setAdminsError] = useState("");

    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState("");

    // -------------------- FORM STATE --------------------
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        password: "",
    });
    const [errors, setErrors] = useState({});

    // -------------------- AUTH + TENANT HELPERS --------------------
    const getAuthHeader = () => {
        const raw =
            (localStorage.getItem("token") || "").trim() ||
            (sessionStorage.getItem("token") || "").trim();
        if (!raw) return "";
        return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
    };

    const getTenantCode = () => (localStorage.getItem("tenantCode") || "").trim();

    const getCompanyId = () => {
        const raw = (localStorage.getItem("companyId") || "").trim();
        if (!raw || raw === "null" || raw === "undefined") return "";
        return raw;
    };

    const getTenantHeaders = () => {
        const tenantCode = getTenantCode();
        const companyId = getCompanyId();
        return {
            ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
            ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
        };
    };

    const safeApiUrl = (path) => {
        const base = (API_BASE_URL || "").replace(/\/+$/, "");
        const cleanPath = path.replace(/^\/+/, "");
        return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
    };

    // -------------------- BACK --------------------
    const handleBack = () => {
        if (typeof onBack === "function") return onBack();
        navigate("/super-admin/dashboard");
    };

    // -------------------- UI HELPERS --------------------
    const getInitial = (name, email) => {
        const base = (name || "").trim() || (email || "").trim();
        return base ? base[0].toUpperCase() : "A";
    };

    const getRoleBadge = (roleValue) => {
        const r = String(roleValue || "").toUpperCase();
        if (r.includes("SUPER")) return "bg-emerald-100 text-emerald-700";
        if (r.includes("MANAGER")) return "bg-sky-100 text-sky-700";
        if (r.includes("ADMIN")) return "bg-emerald-100 text-emerald-700";
        return "bg-slate-100 text-slate-700";
    };

    // -------------------- FETCH: ADMINS --------------------
    const fetchAdmins = async () => {
        try {
            setAdminsLoading(true);
            setAdminsError("");

            const auth = getAuthHeader();
            const tenantCode = getTenantCode();
            const companyId = getCompanyId();

            if (!auth || !tenantCode || !companyId) {
                setAdminsError("Tenant info missing. Please log in again.");
                setAdmins([]);
                return;
            }

            // same as your AdminManagement
            const endpoint = safeApiUrl("/api/users/tenant/admins");

            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: auth,
                    ...getTenantHeaders(),
                },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(
                    `Failed to load admins (status ${res.status}) ${text ? `- ${text}` : ""}`
                );
            }

            const data = await res.json();
            const list =
                (Array.isArray(data) && data) ||
                (Array.isArray(data.data) && data.data) ||
                (Array.isArray(data.content) && data.content) ||
                [];

            setAdmins(list);
        } catch (err) {
            console.error("Admins fetch error:", err);
            setAdminsError(err.message || "Failed to load admins");
            setAdmins([]);
        } finally {
            setAdminsLoading(false);
        }
    };

    // -------------------- FETCH: EMPLOYEES --------------------
    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");

            const auth = getAuthHeader();
            const tenantCode = getTenantCode();
            const companyId = getCompanyId();

            if (!auth || !tenantCode || !companyId) {
                setEmployeesError("Tenant info missing. Please log in again.");
                setEmployees([]);
                return;
            }

            const employeeEndpoint = safeApiUrl("/api/users/tenant/employees");
            const teamLeadEndpoint = safeApiUrl("/api/users/tenant/team-leaders");

            const commonHeaders = {
                "Content-Type": "application/json",
                Authorization: auth,
                ...getTenantHeaders(),
            };

            const [employeesRes, teamLeadsRes] = await Promise.all([
                fetch(employeeEndpoint, { method: "GET", headers: commonHeaders }),
                fetch(teamLeadEndpoint, { method: "GET", headers: commonHeaders }),
            ]);

            if (!employeesRes.ok && !teamLeadsRes.ok) {
                const e1 = await employeesRes.text().catch(() => "");
                const e2 = await teamLeadsRes.text().catch(() => "");
                throw new Error(
                    `Failed to load employees and team leads. ` +
                    `Employees(${employeesRes.status}) ${e1 ? `- ${e1}` : ""} ` +
                    `TeamLeads(${teamLeadsRes.status}) ${e2 ? `- ${e2}` : ""}`
                );
            }

            const parseList = async (res) => {
                if (!res.ok) return [];
                const payload = await res.json().catch(() => ({}));
                return (
                    (Array.isArray(payload) && payload) ||
                    (Array.isArray(payload.data) && payload.data) ||
                    (Array.isArray(payload.content) && payload.content) ||
                    []
                );
            };

            const employeeList = await parseList(employeesRes);
            const teamLeadList = await parseList(teamLeadsRes);

            const combined = [...employeeList, ...teamLeadList];
            const companyIdNum = Number(companyId);
            const deduped = [];
            const seen = new Set();

            for (const user of combined) {
                const key = String(user?.id || user?.userId || user?.email || Math.random());
                if (seen.has(key)) continue;
                seen.add(key);

                const sameCompany =
                    !Number.isFinite(companyIdNum) ||
                    Number(user?.companyId) === companyIdNum ||
                    String(user?.companyId || "") === String(companyId);
                if (!sameCompany) continue;

                const role = String(user?.role || "").toUpperCase();
                const isAdminLike =
                    role === "ADMIN" ||
                    role === "GLOBAL_ADMIN" ||
                    role === "SUPER_ADMIN" ||
                    user?.isAdmin === true;
                if (isAdminLike) continue;

                deduped.push(user);
            }

            setEmployees(deduped);
        } catch (err) {
            console.error("Employees fetch error:", err);
            setEmployeesError(err.message || "Failed to load employees");
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    };

    // -------------------- EFFECTS --------------------
    useEffect(() => {
        fetchAdmins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === "employees" && employees.length === 0 && !employeesLoading) {
            fetchEmployees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // -------------------- FORM HANDLERS --------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));

        if (errors[name]) {
            setErrors((p) => {
                const c = { ...p };
                delete c[name];
                return c;
            });
        }
        if (submitError) setSubmitError("");
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Admin name is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
        )
            newErrors.email = "Enter a valid email.";

        if (!formData.role) newErrors.role = "Role is required.";

        if (!formData.password.trim()) newErrors.password = "Password is required.";
        else if (formData.password.length < 6)
            newErrors.password = "Password should be at least 6 characters.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);
            setSubmitError("");

            const auth = getAuthHeader();
            const tenantCode = getTenantCode();
            const companyId = getCompanyId();

            if (!auth || !tenantCode || !companyId) {
                setSubmitError("Tenant info missing. Please log in again.");
                return;
            }

            const endpoint = safeApiUrl("/api/users/tenant/admins");

            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                password: formData.password,
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: auth,
                    ...getTenantHeaders(),
                },
                body: JSON.stringify(payload),
            });

            const text = await res.text().catch(() => "");
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = { rawText: text };
            }

            const success = res.ok || data?.success === true;

            if (!success) {
                setSubmitError(
                    data?.message || (text ? text.slice(0, 200) : "") || "Failed to create admin."
                );
                return;
            }

            await fetchAdmins();
            setFormData({ name: "", email: "", role: "", password: "" });
            setErrors({});
            setShowModal(false);
        } catch (err) {
            console.error("Create admin error:", err);
            setSubmitError(err.message || "Something went wrong while creating admin");
        } finally {
            setSubmitting(false);
        }
    };

    const adminCount = useMemo(() => admins?.length || 0, [admins]);
    const employeeCount = useMemo(() => employees?.length || 0, [employees]);
    const activeCountLabel = activeTab === "admins" ? "Admins" : "Employees";
    const activeCountValue = activeTab === "admins" ? adminCount : employeeCount;
    const activeCountError = activeTab === "admins" ? adminsError : employeesError;

    return (
        <div className="min-h-screen bg-[#F3F6FF] px-4 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
                {/* Top bar */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                            Super Admin • Manager Management
                        </h1>
                        <p className="text-sm text-slate-500">
                            This company is loaded automatically from local storage.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                            onClick={handleBack}
                            type="button"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        {/* <button
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0B0B76] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09095F]"
                            onClick={() => {
                                setShowModal(true);
                                setSubmitError("");
                                setErrors({});
                            }}
                            type="button"
                        >
                            <Plus size={18} />
                            Add Admin
                        </button> */}
                    </div>
                </div>

                {/* Count + Tabs row */}
                <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3 sm:items-center">
                    <div className="sm:col-span-2">
                        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200">
                            <button
                                type="button"
                                onClick={() => setActiveTab("admins")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "admins"
                                    ? "bg-[#0B0B76] text-white"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                Admins
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("employees")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "employees"
                                    ? "bg-[#0B0B76] text-white"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                Employees
                            </button>
                        </div>
                    </div>

                    {/* Active tab count */}
                    <div className="flex items-center justify-between rounded-xl bg-[#F9FAFF] px-4 py-3 ring-1 ring-slate-200">
                        <div>
                            <p className="text-xs font-semibold text-slate-600">{activeCountLabel}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {activeCountValue}
                            </p>
                            {activeCountError && (
                                <p className="mt-1 text-[11px] text-rose-600">{activeCountError}</p>
                            )}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                            <Users className="h-5 w-5 text-[#0B0B76]" />
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                    {/* status strip */}
                    {(activeTab === "admins"
                        ? adminsLoading || adminsError
                        : employeesLoading || employeesError) && (
                            <div className="border-b border-slate-200 px-5 py-3">
                                {(activeTab === "admins" ? adminsLoading : employeesLoading) && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B0B76]" />
                                        Loading {activeTab}...
                                    </div>
                                )}
                                {(activeTab === "admins" ? adminsError : employeesError) && (
                                    <p className="mt-1 text-sm font-medium text-rose-600">
                                        {activeTab === "admins" ? adminsError : employeesError}
                                    </p>
                                )}
                            </div>
                        )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-[#0B0B76]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Employee
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        {activeTab === "admins" ? "Role" : "Department"}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {activeTab === "admins" ? (
                                    admins.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-6 py-10 text-center text-sm text-slate-500"
                                            >
                                                {adminsLoading
                                                    ? "Loading..."
                                                    : adminsError
                                                        ? "Failed to load admins."
                                                        : "No admins found for this company."}
                                            </td>
                                        </tr>
                                    ) : (
                                        admins.map((a) => {
                                            const name = a.name || a.fullName || "-";
                                            const email = a.email || "-";
                                            const roleValue = a.adminRole || a.role || a.position || "ADMIN";
                                            return (
                                                <tr
                                                    key={a.id || a.adminId || a.email}
                                                    className="bg-white hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white">
                                                                {getInitial(name, email)}
                                                            </div>
                                                            <div className="leading-tight">
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">{email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-slate-700">
                                                        {email}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadge(
                                                                roleValue
                                                            )}`}
                                                        >
                                                            {roleValue}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            {employeesLoading
                                                ? "Loading..."
                                                : employeesError
                                                    ? "Failed to load employees."
                                                    : "No employees found for this company."}
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((u) => {
                                        const name = u.name || u.fullName || "-";
                                        const email = u.email || "-";
                                        const dept = u.department || u.dept || "-";
                                        return (
                                            <tr
                                                key={u.id || u.userId || u.email}
                                                className="bg-white hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white">
                                                            {getInitial(name, email)}
                                                        </div>
                                                        <div className="leading-tight">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-700">{email}</td>

                                                <td className="px-6 py-4 text-sm text-slate-700">{dept}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Add Admin */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={(e) =>
                        e.target === e.currentTarget && !submitting && setShowModal(false)
                    }
                >
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Add New Admin
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Admin will be created under the current tenant/company.
                                </p>
                            </div>
                            <button
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => !submitting && setShowModal(false)}
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="px-5 py-4">
                            <div className="grid gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Admin Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter admin name"
                                        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.name
                                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-[#0B0B76] focus:ring-[#0B0B76]/15"
                                            }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs font-medium text-rose-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.email
                                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-[#0B0B76] focus:ring-[#0B0B76]/15"
                                            }`}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs font-medium text-rose-600">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Admin Role <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.role
                                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-[#0B0B76] focus:ring-[#0B0B76]/15"
                                            }`}
                                    >
                                        <option value="">Select role</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                    {errors.role && (
                                        <p className="mt-1 text-xs font-medium text-rose-600">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.password
                                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-[#0B0B76] focus:ring-[#0B0B76]/15"
                                            }`}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs font-medium text-rose-600">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {submitError && (
                                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                        {submitError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
                                    onClick={() => !submitting && setShowModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B0B76] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09095F] disabled:opacity-60 sm:w-auto"
                                    disabled={submitting}
                                >
                                    {submitting ? "Adding..." : "Add Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
