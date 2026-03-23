import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, CalendarDays, Search, UserRound, X } from "lucide-react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

const getTenantContext = () => {
  let tenantCode =
    localStorage.getItem("tenantCode") ||
    localStorage.getItem("tenant_code") ||
    localStorage.getItem("TENANT_CODE") ||
    "";

  let companyId =
    localStorage.getItem("companyId") ||
    localStorage.getItem("company_id") ||
    localStorage.getItem("COMPANY_ID") ||
    "";

  if ((!tenantCode || !companyId) && localStorage.getItem("user")) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      tenantCode = tenantCode || user?.tenantCode || user?.tenant_code || "";
      companyId = companyId || user?.companyId || user?.company_id || "";
    } catch {
      // ignore parse errors
    }
  }

  return { tenantCode, companyId };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const { tenantCode, companyId } = getTenantContext();
  return {
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
    ...(companyId ? { "X-Company-Id": companyId } : {}),
  };
};

const getTenantParams = () => {
  const { tenantCode, companyId } = getTenantContext();
  return {
    ...(tenantCode ? { tenantCode } : {}),
    ...(companyId ? { companyId } : {}),
  };
};

const extractLineValue = (description, key) => {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, "mi");
  return description?.match(regex)?.[1]?.trim() || "";
};

const parseEmployee = (description) => {
  const employee = extractLineValue(description, "Employee");
  if (!employee) return { name: "N/A", employeeId: "N/A" };

  const match = employee.match(/^(.*)\((.*)\)$/);
  if (!match) return { name: employee.trim(), employeeId: "N/A" };

  return {
    name: match[1].trim(),
    employeeId: match[2].trim(),
  };
};

const mapTaskStatus = (status) => {
  if (status === "DONE") return "Approved";
  if (status === "IN_PROGRESS") return "In Review";
  return "Pending";
};

const badgeClasses = (status) => {
  if (status === "Approved") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (status === "Rejected") {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  if (status === "In Review") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  return "bg-amber-50 text-amber-700 border border-amber-200";
};

const formatDate = (value) => {
  if (!value || value === "N/A") return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const TeamLeadExitDetails = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [exitRequests, setExitRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchExitRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/teamlead/tasks", {
          headers: getAuthHeaders(),
          params: getTenantParams(),
        });

        const tasks = Array.isArray(res.data) ? res.data : [];
        const exitTasks = tasks.filter((t) =>
          (t?.title || "").toLowerCase().startsWith("exit request")
        );

        const mapped = exitTasks.map((task) => {
          const desc = task?.description || "";
          const employee = parseEmployee(desc);
          return {
            id: task.id,
            name: employee.name,
            employeeId: employee.employeeId,
            role: extractLineValue(desc, "Role") || "N/A",
            reason: extractLineValue(desc, "Reason") || "N/A",
            noticePeriod: "30 days",
            appliedOn: extractLineValue(desc, "Applied On") || "N/A",
            lastWorkingDay:
              extractLineValue(desc, "Last Working Day") ||
              (typeof task?.dueDate === "string" ? task.dueDate.slice(0, 10) : "N/A"),
            notes: extractLineValue(desc, "Comments") || "N/A",
            status: mapTaskStatus(task.status),
          };
        });

        setExitRequests(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch exit requests.");
        setExitRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExitRequests();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exitRequests;
    return exitRequests.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [exitRequests, search]);

  const stats = useMemo(
    () => ({
      total: exitRequests.length,
      pending: exitRequests.filter((r) => r.status === "Pending").length,
      approved: exitRequests.filter((r) => r.status === "Approved").length,
      review: exitRequests.filter((r) => r.status === "In Review").length,
    }),
    [exitRequests]
  );

  const updateStatus = async (id, newStatus) => {
    const backendStatus =
      newStatus === "Approved" ? "DONE" : newStatus === "In Review" ? "IN_PROGRESS" : "TODO";

    setUpdating(true);
    setError("");
    try {
      await api.patch(
        `/api/teamlead/tasks/${id}/status`,
        { status: backendStatus },
        { headers: getAuthHeaders(), params: getTenantParams() }
      );
      setExitRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)));
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update request status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FB] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Team Lead - Exit Details</h1>
              <p className="text-sm text-slate-500 mt-1">
                Review employee exit submissions and take action quickly.
              </p>
            </div>

            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee, id, reason"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Requests" value={stats.total} tone="slate" />
          <StatCard title="Pending" value={stats.pending} tone="amber" />
          <StatCard title="In Review" value={stats.review} tone="blue" />
          <StatCard title="Approved" value={stats.approved} tone="emerald" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {error && (
            <div className="m-4 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notice</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Last Working Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      Loading exit requests...
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      No exit requests found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((req) => (
                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 grid place-items-center font-semibold text-sm">
                            {(req.name || "N")[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{req.name}</div>
                            <div className="text-xs text-slate-500 truncate">{req.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{req.employeeId}</td>
                      <td className="px-6 py-4 text-slate-700">{req.reason}</td>
                      <td className="px-6 py-4 text-slate-700">{req.noticePeriod}</td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(req.appliedOn)}</td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(req.lastWorkingDay)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badgeClasses(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Exit Request Review</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 grid place-items-center text-slate-700">
                  <UserRound className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{selectedRequest.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.role} • {selectedRequest.employeeId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <Detail label="Reason" value={selectedRequest.reason} />
                <Detail label="Notice Period" value={selectedRequest.noticePeriod} />
                <Detail label="Applied On" value={formatDate(selectedRequest.appliedOn)} icon={<CalendarDays className="w-4 h-4" />} />
                <Detail label="Last Working Day" value={formatDate(selectedRequest.lastWorkingDay)} icon={<CalendarDays className="w-4 h-4" />} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Employee Comments</p>
                <p className="text-sm text-slate-700">{selectedRequest.notes || "No comments shared."}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateStatus(selectedRequest.id, "Rejected")}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, "In Review")}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                >
                  In Review
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, "Approved")}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  {updating ? "Saving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TableHead = ({ children }) => (
  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>
);

const Detail = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
      {icon}
      {value}
    </p>
  </div>
);

const StatCard = ({ title, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-white border-slate-200 text-slate-900",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-xs uppercase tracking-wide font-semibold opacity-70">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
};

export default TeamLeadExitDetails;