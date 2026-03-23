import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  Settings,
  Activity,
  Server,
  Gift,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Cake,
} from "lucide-react";
import FeatureGuard from "../../../components/access/FeatureGuard.jsx";
import {
  getVisibleDashboardWidgets,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

/* -------------------- Configuration -------------------- */
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const accessContext = resolveAccessContext();
  const visibleDashboardWidgets = getVisibleDashboardWidgets(accessContext.plan, accessContext.role, [
    { id: "totalEmployees" },
    { id: "pendingApprovals" },
    { id: "teamleaderManagement" },
    { id: "todayAttendanceSummary" },
    { id: "upcomingBirthdays" },
    { id: "workAnniversaries" },
  ]);
  const hasWidget = (id) => visibleDashboardWidgets.some((widget) => widget.id === id);
  const showTotalEmployees = hasWidget("totalEmployees");
  const showPendingApprovals = hasWidget("pendingApprovals");
  const showTeamleaderManagement = hasWidget("teamleaderManagement");
  const showTodayAttendanceSummary = hasWidget("todayAttendanceSummary");
  const showUpcomingBirthdays = hasWidget("upcomingBirthdays");
  const showWorkAnniversaries = hasWidget("workAnniversaries");
  const shouldFetchEvents = showUpcomingBirthdays || showWorkAnniversaries;

  const [tenantInfo, setTenantInfo] = useState({
    tenantCode: "",
    companyName: "",
    companyId: null,
  });

  const [userRole] = useState(() => {
    try {
      const rawRole = localStorage.getItem("role") || localStorage.getItem("position") || "";
      return rawRole.trim().toUpperCase() || null;
    } catch {
      return null;
    }
  });

  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingApprovals: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [todayAttendance, setTodayAttendance] = useState({
    present: 0,
    absent: 0,
    onLeave: 0,
    lateCheckIns: 0,
    lastUpdated: null,
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  const [birthdays, setBirthdays] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // ✅ Load tenant info from localStorage
  useEffect(() => {
    try {
      const tenantCode = (localStorage.getItem("tenantCode") || "").trim();
      const companyName = (localStorage.getItem("companyName") || "Unknown Company").trim();
      const companyIdRaw = (localStorage.getItem("companyId") || "").trim();

      const companyId =
        companyIdRaw && companyIdRaw !== "null" && companyIdRaw !== "undefined"
          ? Number(companyIdRaw)
          : null;

      if (!tenantCode || !companyId) {
        setSummaryError("Tenant info missing. Please log in again.");
        return;
      }

      setTenantInfo({ tenantCode, companyName, companyId });
    } catch (err) {
      console.error("Tenant read error:", err);
      setSummaryError("Failed to load company information.");
    }
  }, []);

  const safeApiUrl = (path) => {
    const base = (API_BASE_URL || "").replace(/\/+$/, "");
    const cleanPath = path.replace(/^\/+/, "");
    return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
  };

  // ✅ Token from localStorage (primary) + sessionStorage fallback
  const getAuthHeader = () => {
    const raw =
      (localStorage.getItem("token") || "").trim() ||
      (sessionStorage.getItem("token") || "").trim();

    if (!raw) return null;
    return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
  };

  const getTenantHeaders = () => ({
    ...(tenantInfo.tenantCode ? { "X-Tenant-Code": tenantInfo.tenantCode } : {}),
    ...(tenantInfo.companyId ? { "X-Company-Id": String(tenantInfo.companyId) } : {}),
  });

  const classifyError = (err) => {
    if (!err) return { kind: "unknown", message: "Unknown error" };
    if (err.status) {
      const s = Number(err.status);
      if (s === 401 || s === 403) return { kind: "auth", status: s, message: err.message || "Unauthorized" };
      if (s >= 400 && s < 500) return { kind: "client", status: s, message: err.message || "Client error" };
      if (s >= 500) return { kind: "server", status: s, message: err.message || "Server error" };
    }
    if (err.name === "AbortError") return { kind: "timeout", message: "Request timed out" };
    return { kind: "network", message: err.message || String(err) };
  };

  const fetchWithTimeoutAndRetry = async (endpoint, options = {}, retries = MAX_RETRIES) => {
    let attempt = 0;
    let lastError = null;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      try {
        const res = await fetch(endpoint, { ...options, signal: controller.signal });
        clearTimeout(timeout);

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          const err = new Error(`HTTP ${res.status}: ${text ? text.slice(0, 300) : res.statusText}`);
          err.status = res.status;
          err.body = text;
          throw err;
        }

        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch {
          return { rawText: text };
        }
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        const c = classifyError(err);
        const shouldRetry = c.kind === "timeout" || c.kind === "network" || c.kind === "server";

        attempt += 1;
        if (!shouldRetry || attempt > retries) throw lastError;

        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError || new Error("Failed after retries");
  };

  // ✅ Dashboard stats (tenant + company header)
  const fetchDashboardStats = useCallback(async () => {
    if (!tenantInfo.tenantCode || !tenantInfo.companyId) return;

    setSummaryLoading(true);
    setAttendanceLoading(true);
    setSummaryError(null);
    setAttendanceError(null);

    try {
      const auth = getAuthHeader();
      if (!auth) {
        setSummaryError("Session expired. Please log in again.");
        setAttendanceError("Session expired. Please log in again.");
        return;
      }

      const employeesEndpoint = safeApiUrl("/api/users/tenant/employees");
      const employeesResponse = await fetchWithTimeoutAndRetry(employeesEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
          ...getTenantHeaders(),
        },
      });

      let employees = Array.isArray(employeesResponse?.data) ? employeesResponse.data : [];
      // ✅ extra safety filter
      employees = employees.filter((e) => Number(e.companyId) === Number(tenantInfo.companyId));
      const totalEmployees = employees.length;

      const attendanceCandidates = [
        "/api/admin/attendance/dashboard-stats",
        "/api/admin/attendance/today",
        "/api/attendance/today",
      ];

      let attendanceData = null;
      for (const path of attendanceCandidates) {
        try {
          const result = await fetchWithTimeoutAndRetry(safeApiUrl(path), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
              ...getTenantHeaders(),
            },
          });
          if (result) {
            attendanceData = result.data || result;
            break;
          }
        } catch {
          // next
        }
      }

      const presentToday =
        attendanceData?.present ??
        attendanceData?.presentCount ??
        attendanceData?.todayPresent ??
        employees.filter((e) => e.status === "ACTIVE").length;

      const absent = attendanceData?.absent ?? attendanceData?.absentCount ?? 0;
      const onLeave = attendanceData?.onLeave ?? attendanceData?.leaveCount ?? 0;
      const lateCheckIns = attendanceData?.lateCheckIns ?? attendanceData?.lateCount ?? 0;
      const pendingApprovals = attendanceData?.pendingApprovals ?? 0;
      const lastUpdated = attendanceData?.lastUpdated ?? new Date().toISOString();

      setSummary({ totalEmployees, presentToday, pendingApprovals });
      setTodayAttendance({ present: presentToday, absent, onLeave, lateCheckIns, lastUpdated });
    } catch (err) {
      const c = classifyError(err);
      if (c.kind === "auth") {
        setSummaryError("Not authorized. Please log in again.");
        setAttendanceError("Not authorized. Please log in again.");
      } else if (c.kind === "timeout") {
        setSummaryError("Request timed out. Retry.");
        setAttendanceError("Request timed out. Retry.");
      } else {
        setSummaryError("Failed to load summary.");
        setAttendanceError("Failed to load attendance.");
      }
    } finally {
      setSummaryLoading(false);
      setAttendanceLoading(false);
    }
  }, [tenantInfo.tenantCode, tenantInfo.companyId]);

  const parseDateValue = (value) => {
    if (!value) return null;

    if (typeof value === "string") {
      const trimmed = value.trim();
      const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }

      const ddMmYyyyMatch = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(trimmed);
      if (ddMmYyyyMatch) {
        const [, day, month, year] = ddMmYyyyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getEmployeeDisplayName = (employee) =>
    employee?.fullName ||
    employee?.name ||
    employee?.employeeName ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown";

  const buildCurrentMonthEvents = (employees, kind) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const todayDate = now.getDate();

    return employees
      .map((employee) => {
        const rawDate =
          kind === "BIRTHDAY"
            ? employee?.dob || employee?.dateOfBirth || employee?.birthday
            : employee?.joiningDate || employee?.dateOfJoining || employee?.anniversary;

        const parsedDate = parseDateValue(rawDate);
        if (!parsedDate) return null;
        if (parsedDate.getMonth() !== currentMonth) return null;
        if (parsedDate.getDate() < todayDate) return null;

        return {
          ...employee,
          type: kind,
          name: getEmployeeDisplayName(employee),
          eventDate: parsedDate.toISOString(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dayDiff = new Date(a.eventDate).getDate() - new Date(b.eventDate).getDate();
        if (dayDiff !== 0) return dayDiff;
        return String(a.name).localeCompare(String(b.name));
      });
  };

  const fetchUpcomingEvents = useCallback(async () => {
    if (!tenantInfo.tenantCode || !tenantInfo.companyId) return;

    setEventsLoading(true);
    setEventsError(null);

    try {
      const auth = getAuthHeader();
      if (!auth) {
        setEventsError("Session expired. Please log in again.");
        return;
      }

      const usersResponse = await fetchWithTimeoutAndRetry(safeApiUrl("/api/users/tenant"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
          ...getTenantHeaders(),
        },
      });

      let users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
      users = users.filter((u) => Number(u.companyId) === Number(tenantInfo.companyId));

      setBirthdays(buildCurrentMonthEvents(users, "BIRTHDAY"));
      setAnniversaries(buildCurrentMonthEvents(users, "ANNIVERSARY"));
    } catch {
      setEventsError("Failed to load events.");
      setBirthdays([]);
      setAnniversaries([]);
    } finally {
      setEventsLoading(false);
    }
  }, [tenantInfo.tenantCode, tenantInfo.companyId]);

  useEffect(() => {
    if (tenantInfo.tenantCode && tenantInfo.companyId) {
      fetchDashboardStats();
      if (shouldFetchEvents) {
        fetchUpcomingEvents();
      }
    }
  }, [tenantInfo.tenantCode, tenantInfo.companyId, fetchDashboardStats, fetchUpcomingEvents, shouldFetchEvents]);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return value;
    }
  };

  const formatDateShort = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    } catch {
      return value;
    }
  };

  // ✅ Manager Management navigation (do not auto redirect unless token missing)
  const handleAdminManagementClick = () => {
    const auth = getAuthHeader();
    if (!auth) {
      alert("Token missing. Please login again.");
      navigate("/login");
      return;
    }
    if (!tenantInfo.tenantCode || !tenantInfo.companyId) {
      alert("Tenant info missing. Please login again.");
      navigate("/login");
      return;
    }
    navigate("/admin/management");
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-[#F9FAFF]">
      {/* Header */}
      <div className="rounded-2xl px-6 py-5 mb-6 shadow-sm" style={{ backgroundColor: "#00008B" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Manager Dashboard</h1>
            <p className="text-xs md:text-sm text-blue-100 mt-1">Overview of employees, attendance, and HR actions</p>
          </div>
          <div className="flex items-center gap-3">
            {userRole && (
              <div className="text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg">
                Logged in as: <span className="font-semibold">{userRole}</span>
              </div>
            )}
            <button
              onClick={fetchDashboardStats}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-white text-xs hover:bg-white/20 transition"
            >
              <RefreshCw size={14} />
              Refresh Stats
            </button>
            {shouldFetchEvents && (
              <button
                onClick={fetchUpcomingEvents}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-white text-xs hover:bg-white/20 transition"
              >
                <RefreshCw size={14} />
                Refresh Events
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Server className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">{tenantInfo.companyName}</p>
            <p className="text-xs text-blue-700">
              Tenant Code: <span className="font-mono font-semibold">{tenantInfo.tenantCode}</span>
              {tenantInfo.companyId && (
                <>
                  {" "}
                  • ID: <span className="font-mono">{tenantInfo.companyId}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {(showTotalEmployees || showPendingApprovals) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-7">
          {showTotalEmployees && (
            <FeatureGuard featureKey="dashboardTotalEmployees" fallback={null}>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                    <p className="text-3xl font-bold text-[#00008B] mt-2">{summaryLoading ? "..." : summary.totalEmployees}</p>
                    <p className="text-xs text-gray-400 mt-1">Across all departments</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl flex-shrink-0">
                    <Users className="text-[#00008B]" size={32} />
                  </div>
                </div>
              </div>
            </FeatureGuard>
          )}

          {showPendingApprovals && (
            <FeatureGuard featureKey="dashboardPendingApprovals" fallback={null}>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 text-left">
                    <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {summaryLoading ? "..." : summary.pendingApprovals}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Leaves & requests in queue</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl flex-shrink-0">
                    <Clock className="text-orange-600" size={32} />
                  </div>
                </div>
              </div>
            </FeatureGuard>
          )}
        </div>
      )}

      {/* Error Display */}
      {(summaryError || attendanceError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 text-sm font-medium">Error Loading Data</p>
            <p className="text-red-600 text-xs mt-1">{summaryError || attendanceError}</p>
            <button onClick={fetchDashboardStats} className="text-red-600 underline text-xs mt-2 hover:text-red-800">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ✅ ONLY ONE ACTION CARD NOW: Manager Management */}
      {(showTeamleaderManagement || showTodayAttendanceSummary || showUpcomingBirthdays || showWorkAnniversaries) && (
        <>
      {showTeamleaderManagement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={handleAdminManagementClick}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-left flex items-center gap-4 w-full md:col-span-1"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl">
              <Settings className="text-white" size={28} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-lg">TeamLeader Management</h3>
              <p className="text-sm text-gray-500 mt-1">Configure admin roles and access</p>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Row: Attendance + Events */}
      {(showTodayAttendanceSummary || showUpcomingBirthdays || showWorkAnniversaries) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance */}
        {showTodayAttendanceSummary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="text-blue-600" size={24} />
                <h2 className="text-lg font-bold text-gray-800">Today's Attendance Summary</h2>
              </div>
              <button
                onClick={fetchDashboardStats}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs hover:bg-slate-200 text-slate-700 transition"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            {todayAttendance.lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">Last updated: {formatDate(todayAttendance.lastUpdated)}</p>
            )}
          </div>

          <div className="p-6">
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading today's attendance...</p>
                </div>
              </div>
            ) : attendanceError ? (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-3" />
                <p className="text-red-600 text-sm">{attendanceError}</p>
                <button onClick={fetchDashboardStats} className="mt-3 text-blue-600 underline text-xs hover:text-blue-800">
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">Present</p>
                  <p className="text-3xl font-bold text-green-700">{todayAttendance.present ?? "-"}</p>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-red-600 font-medium mb-1">Absent</p>
                  <p className="text-3xl font-bold text-red-700">{todayAttendance.absent ?? "-"}</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">On Leave</p>
                  <p className="text-3xl font-bold text-blue-700">{todayAttendance.onLeave ?? "-"}</p>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <p className="text-xs text-yellow-600 font-medium mb-1">Late Check-ins</p>
                  <p className="text-3xl font-bold text-yellow-700">{todayAttendance.lateCheckIns ?? "-"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Events */}
        {(showUpcomingBirthdays || showWorkAnniversaries) && (
        <div className="space-y-4">
          {showUpcomingBirthdays && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <Gift className="text-pink-600" size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800">Upcoming Birthdays</h3>
                </div>
                <button onClick={fetchUpcomingEvents} className="text-xs text-gray-500 hover:text-gray-700">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading birthdays...</p>
                </div>
              ) : eventsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">{eventsError}</p>
                </div>
              ) : birthdays.length === 0 ? (
                <div className="text-center py-8">
                  <Cake className="mx-auto h-12 w-12 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">No upcoming birthdays</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {birthdays.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{(b.name || b.employeeName || "?").charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{b.name || b.employeeName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{b.department || b.team || "—"}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-pink-600">{formatDateShort(b.date || b.eventDate || b.birthday)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {showWorkAnniversaries && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Sparkles className="text-purple-600" size={20} />
                </div>
                <h3 className="font-bold text-gray-800">Work Anniversaries</h3>
              </div>
            </div>

            <div className="p-5">
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading anniversaries...</p>
                </div>
              ) : anniversaries.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="mx-auto h-12 w-12 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">No upcoming anniversaries</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {anniversaries.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{(a.name || a.employeeName || "?").charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{a.name || a.employeeName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{a.department || a.team || "—"}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-purple-600">{formatDateShort(a.date || a.eventDate || a.anniversary)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

        </div>
        )}
      </div>
      )}
        </>
      )}
    </div>
  );
}
