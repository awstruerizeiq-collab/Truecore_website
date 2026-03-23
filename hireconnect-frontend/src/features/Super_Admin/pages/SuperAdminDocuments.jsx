import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Search, Trash2 } from "lucide-react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (!raw) return "";
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

const getTenantCode = () => (localStorage.getItem("tenantCode") || "").trim();
const getCompanyId = () => (localStorage.getItem("companyId") || "").trim();

export default function SuperAdminDocuments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ role: "", company: "", search: "" });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      "X-Tenant-Code": getTenantCode(),
      "X-Company-Id": String(getCompanyId()),
    }),
    []
  );

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/documents/admin/all-documents`, {
        method: "GET",
        headers,
      });
      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(payload?.message || `Failed to load documents (${res.status})`);
      }

      const grouped = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const flat = grouped.flatMap((emp) => {
        const docs = Array.isArray(emp?.documents) ? emp.documents : [];
        return docs.map((doc) => ({
          id: doc?.id,
          documentName: doc?.fileName || "-",
          userName: emp?.name || "-",
          role: emp?.role || "-",
          companyName: emp?.companyName || "-",
          documentType: doc?.documentType || "-",
          uploadDate: doc?.uploadedOn || "-",
          status: doc?.status || "-",
          filePath: doc?.fileUrl || "",
        }));
      });

      setRows(flat);
    } catch (e) {
      setRows([]);
      setError(e?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const roleOptions = useMemo(
    () => ["", ...Array.from(new Set(rows.map((r) => r.role).filter(Boolean)))],
    [rows]
  );
  const companyOptions = useMemo(
    () => ["", ...Array.from(new Set(rows.map((r) => r.companyName).filter(Boolean)))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      const byRole = !filters.role || r.role === filters.role;
      const byCompany = !filters.company || r.companyName === filters.company;
      const bySearch = !q || String(r.userName || "").toLowerCase().includes(q);
      return byRole && byCompany && bySearch;
    });
  }, [rows, filters]);

  const onView = (row) => {
    if (!row.filePath) return;
    window.open(`${API_BASE_URL}${row.filePath}`, "_blank", "noopener,noreferrer");
  };

  const onDownload = (id) => {
    window.open(`${API_BASE_URL}/api/documents/download/${id}`, "_blank", "noopener,noreferrer");
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/admin/${id}`, {
        method: "DELETE",
        headers,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Delete failed");
      await fetchDocuments();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  const filterControlClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B0B76]/20 focus:border-[#0B0B76]";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#0B0B76] px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Super Admin Documents</h1>
        <p className="mt-1 text-sm text-blue-100">
          View documents uploaded by Directors, Managers, Admins, Team Leads and Employees.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
              className={filterControlClass}
            >
              {roleOptions.map((role) => (
                <option key={role || "all"} value={role}>
                  {role || "All Roles"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Company</label>
            <select
              value={filters.company}
              onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))}
              className={filterControlClass}
            >
              {companyOptions.map((company) => (
                <option key={company || "all"} value={company}>
                  {company || "All Companies"}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Search User</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search by user name"
                className={`${filterControlClass} pl-9`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {error ? <div className="border-b border-slate-200 px-5 py-3 text-sm text-rose-600">{error}</div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#0B0B76]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Document Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">User Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Document Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Upload Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={`${row.id}-${row.userName}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{row.documentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.userName}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.role}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.companyName}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.documentType}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.uploadDate}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{row.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="rounded-md p-2 hover:bg-slate-100" title="View" onClick={() => onView(row)}>
                          <Eye size={16} />
                        </button>
                        <button className="rounded-md p-2 hover:bg-slate-100" title="Download" onClick={() => onDownload(row.id)}>
                          <Download size={16} />
                        </button>
                        <button className="rounded-md p-2 text-rose-600 hover:bg-rose-50" title="Delete" onClick={() => onDelete(row.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
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
