import React, { useState, useEffect } from "react";
import {
  Building2,
  KeyRound,
  Mail,
  Lock,
  PlusCircle,
  RefreshCcw,
} from "lucide-react";

// -------- API BASE URL (local + production ready) --------
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export default function CompanyManagement({ token }) {
  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyKey: "",
    position: "",
  });

  // Feedback / loading
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Companies list from backend
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  // Helper to build Authorization header safely
  const buildAuthHeader = () =>
    token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : null;

  const getCompaniesEndpoint = () => {
    const base = API_BASE_URL.replace(/\/+$/, "");
    return base
      ? `${base}/api/global-admin/companies`
      : "/api/global-admin/companies";
  };

  const getRegisterEndpoint = () => {
    const base = API_BASE_URL.replace(/\/+$/, "");
    return base
      ? `${base}/api/company/company-register`
      : "/api/company/company-register";
  };

  // ---------------- FETCH COMPANIES ----------------
  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError("");

      const auth = buildAuthHeader();

      const res = await fetch(getCompaniesEndpoint(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message || `Failed to load companies (status ${res.status})`
        );
      }

      const data = await res.json();
      console.log("Companies API response:", data);

      const list =
        (Array.isArray(data) && data) ||
        (Array.isArray(data.data) && data.data) ||
        (Array.isArray(data.content) && data.content) ||
        (Array.isArray(data.companies) && data.companies) ||
        [];

      setCompanies(list);
    } catch (err) {
      console.error("Companies fetch error:", err);
      setCompaniesError(err.message || "Failed to load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- FORM HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.companyKey ||
      !form.position
    ) {
      setErrorMsg("Please fill all the fields, including position.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        companyName: form.name,
        companyEmail: form.email,
        password: form.password,
        companyKey: form.companyKey.toUpperCase(),
        position: form.position,
      };

      const auth = buildAuthHeader();

      const res = await fetch(getRegisterEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to create company (status ${res.status})`
        );
      }

      const createdCompanyRaw = data.company || data.data || data || {};
      const createdCompany = {
        id: createdCompanyRaw.id,
        companyName: createdCompanyRaw.companyName ?? payload.companyName,
        companyEmail: createdCompanyRaw.companyEmail ?? payload.companyEmail,
        // NOTE: generally you should NOT show raw passwords in any table in production.
        password: createdCompanyRaw.password ?? payload.password,
        companyKey: createdCompanyRaw.companyKey ?? payload.companyKey,
        position: createdCompanyRaw.position ?? payload.position,
        status: createdCompanyRaw.status ?? "ACTIVE",
      };

      setCompanies((prev) => [createdCompany, ...prev]);

      setSuccessMsg("Company account created successfully.");
      setForm({
        name: "",
        email: "",
        password: "",
        companyKey: "",
        position: "",
      });
    } catch (err) {
      console.error("Create company error:", err);
      setErrorMsg(err.message || "A network or internal error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 bg-[#F9FAFF]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#011A8B]">
            Company Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage company accounts on the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCompanies}
          disabled={companiesLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCcw className="h-4 w-4" />
          {companiesLoading ? "Refreshing..." : "Refresh List"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,1.2fr)]">
        {/* Create company form */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF0FF]">
              <Building2 className="h-5 w-5 text-[#011A8B]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create Company Account
              </h2>
              <p className="text-xs text-gray-500">
                This will create a login for the company admin.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Acme Pvt Ltd"
                  className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 outline-none focus:ring-[#011A8B] focus:border-[#011A8B]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Company Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g., hr@acme.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 outline-none focus:ring-[#011A8B] focus:border-[#011A8B]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Set initial password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 outline-none focus:ring-[#011A8B] focus:border-[#011A8B]"
                />
              </div>
            </div>

            {/* Company Key */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Company Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="companyKey"
                  value={form.companyKey}
                  onChange={handleChange}
                  placeholder="e.g., TRZ001"
                  className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-sm uppercase text-gray-900 outline-none focus:ring-[#011A8B] focus:border-[#011A8B]"
                />
              </div>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Position
              </label>
              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-[#011A8B] focus:border-[#011A8B]"
              >
                <option value="">Select position</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#011A8B] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#020f5d] disabled:opacity-70"
              >
                <PlusCircle className="h-4 w-4" />
                {loading ? "Creating..." : "Create Company Account"}
              </button>
            </div>
          </form>
        </div>

        {/* ---------------- ALL COMPANIES TABLE ---------------- */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Companies
          </h2>

          {companiesError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {companiesError}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-[#F3F4FF] text-xs font-semibold uppercase tracking-wide text-[#011A8B]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Company Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Password</th>
                  <th className="px-4 py-3 text-left">Company Key</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700">
                {companiesLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Loading companies…
                    </td>
                  </tr>
                )}

                {!companiesLoading &&
                  companies.length === 0 &&
                  !companiesError && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No companies found.
                      </td>
                    </tr>
                  )}

                {companies.map((c) => (
                  <tr key={c.id || c.companyKey} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{c.id}</td>
                    <td className="px-4 py-3">
                      {c.companyName || c.displayName || c.legalName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {c.companyEmail || c.officialEmail || c.companyOfficialEmail || "-"}
                    </td>
                    <td className="px-4 py-3">{c.password || "-"}</td>
                    <td className="px-4 py-3">{c.companyKey || c.tenantCode || "-"}</td>
                    <td className="px-4 py-3">{c.position || c.role || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs">
                        {c.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}