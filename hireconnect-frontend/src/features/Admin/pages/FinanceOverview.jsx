import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

/* ---------------- API BASE ---------------- */
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const safeApiUrl = (path) => {
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  const clean = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${clean}` : `/${clean}`;
};

const parseApiResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return {
    __nonJson: true,
    message: text || "Unexpected non-JSON response from server",
  };
};

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();

  if (!raw) return "";
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

const getTenantCode = () => (localStorage.getItem("tenantCode") || "").trim();
const getCompanyId = () => (localStorage.getItem("companyId") || "").trim();

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "NA";

const AdminFinanceOverview = () => {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ employeeId: "", name: "", netPay: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pageSize = 10;

  // ✅ rows fetched from backend
  const [rows, setRows] = useState([]);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  /* ---------------- FETCH USERS ----------------
     You must create/confirm this backend endpoint.
     Example expected response (array):
     [
       { employeeId, fullName, baseSalary, attendanceRate }
     ]
  */
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setErr("");

      const auth = getAuthHeader();
      const tenantCode = getTenantCode();
      const companyId = getCompanyId();

      if (!auth) throw new Error("Token missing. Please login again.");
      if (!tenantCode) throw new Error("tenantCode missing in localStorage.");

      // Use stable tenant employee endpoint used across admin pages.
      let res = await fetch(
        safeApiUrl("/api/users/tenant/employees"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
            ...(companyId ? { "X-Company-Id": companyId } : {}),
            ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
          },
        }
      );

      // Backward fallback if tenant/employees fails in some environments.
      if (!res.ok) {
        res = await fetch(
          safeApiUrl(`/api/users/tenant`),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
              ...(companyId ? { "X-Company-Id": companyId } : {}),
              ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
            },
          }
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`(${res.status}) ${text || "Failed to fetch users"}`);
      }

      const json = await parseApiResponse(res);
      if (json?.__nonJson) {
        throw new Error(
          "API returned HTML/non-JSON. Set VITE_API_BASE_URL to backend (example: http://localhost:8080)."
        );
      }

      // support ApiResponse.success(..., data)
      const list =
        (Array.isArray(json) && json) ||
        (Array.isArray(json.data) && json.data) ||
        (Array.isArray(json.content) && json.content) ||
        [];

      // ✅ map backend users -> rows
      const mapped = list.map((u) => {
        const employeeId = u.employeeId || u.empId || u.id || u.userId || "";
        const name = u.fullName || u.name || u.username || "Unknown";
        const baseSalary = Number(u.baseSalary ?? u.salary ?? u.grossSalary ?? 0);
        const attendanceRate = Number(u.attendanceRate ?? 1); // default 1 (100%)

        return {
          employeeId: String(employeeId),
          name,
          avatar: initials(name),
          status: "Select",
          netPay: baseSalary, // initial netPay = baseSalary (before submit)
          approval: "",
          baseSalary,
          attendanceRate,
        };
      });

      setRows(mapped);
      setCurrentPage(1);
    } catch (e) {
      setErr(e?.message || "Failed to load employees");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPayroll = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.netPay) || 0), 0),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rows;
    return rows.filter(
      (row) =>
        row.employeeId.toLowerCase().includes(trimmed) ||
        row.name.toLowerCase().includes(trimmed)
    );
  }, [query, rows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredRows.length);
  const paginatedRows = filteredRows.slice(pageStart, pageEnd);

  const formatPeriodLabel = () => {
    if (!startDate || !endDate) return "Select Period";
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-GB")} - ${end.toLocaleDateString("en-GB")}`;
  };

  const attendanceIssues = useMemo(
    () => rows.filter((row) => Number(row.attendanceRate) < 0.9).length,
    [rows]
  );

  const summary = [
    { label: "Payroll Period", value: formatPeriodLabel() },
    { label: "Employee Count", value: rows.length },
    { label: "Attendance Issues", value: attendanceIssues },
    { label: "Payroll Generated", value: currency.format(totalPayroll) },
  ];

  const approvalToStatus = (value) => {
    if (!value) return "Select";
    if (value === "Approved" || value === "Approve") return "Approved";
    if (value === "Edit" || value === "Edited") return "Edit";
    if (value === "Hold") return "Hold";
    if (value === "Pending") return "Pending";
    return "Generated";
  };

  const statusBadgeClass = (status) => {
    if (status === "Approved") return "bg-emerald-100 text-emerald-700";
    if (status === "Hold") return "bg-amber-100 text-amber-700";
    if (status === "Edit") return "bg-sky-100 text-sky-700";
    if (status === "Pending") return "bg-slate-200 text-slate-700";
    return "bg-violet-100 text-violet-700";
  };

  const handleApprovalChange = (employeeId, value) => {
    const status = approvalToStatus(value);
    setRows((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId ? { ...row, approval: value, status } : row
      )
    );
  };

  const handleEditStart = (row) => {
    setEditId(row.employeeId);
    setDraft({ employeeId: row.employeeId, name: row.name, netPay: row.netPay });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setDraft({ employeeId: "", name: "", netPay: "" });
  };

  const handleEditSave = (employeeId) => {
    const trimmedName = draft.name.trim();
    const parsedNetPay = Number(draft.netPay);
    if (!trimmedName || Number.isNaN(parsedNetPay)) return;

    setRows((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId
          ? { ...row, name: trimmedName, netPay: Math.max(0, parsedNetPay) }
          : row
      )
    );
    handleEditCancel();
  };

  const handleDeleteRequest = (employeeId) => {
    setDeleteId(employeeId);
  };

  const confirmDelete = () => {
    setRows((prev) => prev.filter((row) => row.employeeId !== deleteId));
    setDeleteId(null);
  };

  const handleBulkAction = (action) => {
    if (action === "approve") {
      setConfirmOpen(true);
      setBulkOpen(false);
      return;
    }
    if (action === "reject") {
      setRows((prev) => prev.map((row) => ({ ...row, approval: "Hold", status: "Hold" })));
    }
    if (action === "export") {
      handleExportExcel();
    }
    setBulkOpen(false);
  };

  const confirmApproveAll = () => {
    setRows((prev) => prev.map((row) => ({ ...row, approval: "Approved", status: "Approved" })));
    setConfirmOpen(false);
  };

  // ✅ calculates netPay based on attendanceRate + baseSalary
  const handlePayrollSubmit = () => {
    if (!startDate || !endDate) {
      setDateError("Select both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setDateError("End date must be after start date.");
      return;
    }
    setDateError("");

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays =
      Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / dayMs) + 1;

    setRows((prev) =>
      prev.map((row) => {
        const rate = Number(row.attendanceRate) || 0;
        const presentDays = Math.max(0, Math.round(totalDays * rate));
        const updatedNetPay = Math.round((Number(row.baseSalary) || 0) * (presentDays / totalDays));
        return { ...row, netPay: updatedNetPay, status: "Select" };
      })
    );
  };

  const handleExportExcel = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Payslip Status",
      "Net Pay (INR)",
      "Approval",
      "Base Salary",
      "Attendance Rate",
    ];

    const csvRows = rows.map((row) => [
      row.employeeId,
      row.name,
      row.status,
      row.netPay,
      row.approval,
      row.baseSalary,
      row.attendanceRate,
    ]);

    const csvContent = [headers, ...csvRows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</p>
              <h1 className="text-2xl font-semibold text-slate-900">Finance Hub</h1>
              {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchEmployees}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="text-slate-500" size={18} />
                <input
                  className="w-56 bg-transparent text-sm text-slate-700 outline-none"
                  placeholder="Search employees"
                  value={query}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Payroll Start Date</label>
              <input
                type="date"
                className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Payroll End Date</label>
              <input
                type="date"
                className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
              onClick={handlePayrollSubmit}
            >
              Submit
            </button>
            {dateError && <p className="text-sm text-rose-600">{dateError}</p>}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Salary is calculated from attendance within the selected period.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((card) => (
            <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{card.value}</h3>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Payroll Overview</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={handleExportExcel}
              >
                Bulk Download
              </button>

              <div className="relative z-20">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow"
                  onClick={() => setBulkOpen((open) => !open)}
                >
                  Approve Payslips
                  <ChevronDown size={16} />
                </button>

                {bulkOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => handleBulkAction("approve")}
                    >
                      Approve All
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => handleBulkAction("reject")}
                    >
                      Reject All
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => handleBulkAction("export")}
                    >
                      Export Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-6 gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
              <span>Employee ID</span>
              <span>Employee Name</span>
              <span>Payslip Status</span>
              <span>Net Pay</span>
              <span>Approvals</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-5 py-6 text-sm text-slate-500">Loading...</div>
              ) : paginatedRows.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">No employees found.</div>
              ) : (
                paginatedRows.map((row) => {
                  const isEditing = editId === row.employeeId;
                  return (
                    <div
                      key={row.employeeId}
                      className="grid grid-cols-6 items-center gap-4 px-5 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{row.employeeId}</span>

                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {row.avatar}
                        </span>
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            value={draft.name}
                            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                          />
                        ) : (
                          row.name
                        )}
                      </span>

                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>

                      <span className="font-semibold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            value={draft.netPay}
                            onChange={(e) => setDraft((p) => ({ ...p, netPay: e.target.value }))}
                          />
                        ) : (
                          currency.format(row.netPay)
                        )}
                      </span>

                      <span>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={row.approval}
                          onChange={(e) => handleApprovalChange(row.employeeId, e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Approved">Approved</option>
                          <option value="Edit">Edit</option>
                          <option value="Hold">Hold</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </span>

                      <span className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                              onClick={() => handleEditSave(row.employeeId)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                              onClick={() => handleEditStart(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                              onClick={() => handleDeleteRequest(row.employeeId)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {safePage} of {pageCount}
              </span>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage === pageCount}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-600">This will approve all payslips.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => setConfirmOpen(false)}
              >
                No
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={confirmApproveAll}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-600">This will remove the row from UI.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => setDeleteId(null)}
              >
                No
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={confirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinanceOverview;
