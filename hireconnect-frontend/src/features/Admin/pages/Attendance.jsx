import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import LeaveManagement from "./LeaveManagement";
import useAccessControl from "../../../access-control/useAccessControl";
import { FEATURE_KEYS } from "../../../access-control/permissions";
import {
  getVisibleAttendanceTabs,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";
import {
  HOLIDAY_UPDATE_EVENT,
  HOLIDAY_UPDATE_STORAGE_KEY,
  buildHolidayMapByDate,
  fetchHolidays,
} from "../../../lib/holidaysApi";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");

const ATTENDANCE_TABS = [
  { id: "dashboard", title: "Live", sub: "Dashboard", featureKey: FEATURE_KEYS.ATTENDANCE_LIVE_DASHBOARD },
  { id: "employee", title: "Employee", sub: "List", featureKey: FEATURE_KEYS.ATTENDANCE_EMPLOYEE_LIST },
  { id: "calendar", title: "Calendar", sub: "View", featureKey: FEATURE_KEYS.ATTENDANCE_CALENDAR },
  { id: "leave", title: "Leave", sub: "Management", featureKey: FEATURE_KEYS.ATTENDANCE_LEAVE_MANAGEMENT },
  { id: "assign", title: "Assign", sub: "Attendance", featureKey: FEATURE_KEYS.ATTENDANCE_ASSIGN },
  { id: "timesheet", title: "Timesheet", sub: "Review", featureKey: FEATURE_KEYS.ATTENDANCE_TIMESHEET },
  { id: "reports", title: "Reports", sub: "& Analytics", featureKey: FEATURE_KEYS.ATTENDANCE_REPORTS },
  { id: "settings", title: "Settings", sub: "& Policies", featureKey: FEATURE_KEYS.ATTENDANCE_SETTINGS },
];
export default function Attendance() {
  const { canAccessFeature } = useAccessControl();
  const accessContext = resolveAccessContext();
  const today = new Date();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [reportSubTab, setReportSubTab] = useState("overview");
  const [settingsSubTab, setSettingsSubTab] = useState("attendance-rules");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [searchName, setSearchName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All Departments");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterLocation, setFilterLocation] = useState("All Locations");

  const [timesheets, setTimesheets] = useState([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [timesheetsError, setTimesheetsError] = useState("");
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    status: "Present",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [assignSaving, setAssignSaving] = useState(false);

  const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
  const [assignLeaveEmployee, setAssignLeaveEmployee] = useState(null);
  const [assignLeaveForm, setAssignLeaveForm] = useState({
    leaveType: "LEAVE",
    startDate: "",
    endDate: "",
  });
  const [assignLeaveSaving, setAssignLeaveSaving] = useState(false);

  const primaryBlue = "#00008B";

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingRequests: 0,
    onBreak: 0,
    absentToday: 0,
    lateToday: 0,
    workingNow: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [exportRange, setExportRange] = useState("1_WEEK");
  const [customExportDate, setCustomExportDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const [holidayList, setHolidayList] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const isAdminUser = (() => {
    const role = (localStorage.getItem("userRole") || localStorage.getItem("role") || "").toUpperCase();
    const adminLikeRole =
      role.includes("ADMIN") ||
      role.includes("MANAGER") ||
      role.includes("HR_MANAGER") ||
      role.includes("TEAM_LEADER") ||
      role.includes("SUPER_ADMIN");


    const adminRoute = (window.location.pathname || "").startsWith("/admin");
    return adminLikeRole || adminRoute;
  })();

  const visibleTabs = useMemo(() => {
    const planVisibleTabs = getVisibleAttendanceTabs(
      accessContext.plan,
      accessContext.role,
      ATTENDANCE_TABS.map((tab) => ({ id: tab.id })),
    );
    const planVisibleIds = new Set(planVisibleTabs.map((tab) => tab.id));

    return ATTENDANCE_TABS.filter(
      (tab) => planVisibleIds.has(tab.id) && canAccessFeature(tab.featureKey),
    );
  }, [accessContext.plan, accessContext.role, canAccessFeature]);

  const isTabAllowed = (tabId) => visibleTabs.some((tab) => tab.id === tabId);

  useEffect(() => {
    if (isTabAllowed(activeTab)) return;
    const firstAllowedTab = visibleTabs[0]?.id || "dashboard";
    setActiveTab(firstAllowedTab);
  }, [activeTab, visibleTabs]);

  // -------------------- AUTH + TENANT HELPERS --------------------
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Reads tenantCode + companyId from localStorage.
  // Supports common keys + "user" JSON fallback.
  const getTenantContext = () => {
    const tenantCode =
      localStorage.getItem("tenantCode") ||
      localStorage.getItem("tenant_code") ||
      localStorage.getItem("TENANT_CODE") ||
      "";

    const companyId =
      localStorage.getItem("companyId") ||
      localStorage.getItem("company_id") ||
      localStorage.getItem("COMPANY_ID") ||
      "";

    if ((!tenantCode || !companyId) && localStorage.getItem("user")) {
      try {
        const u = JSON.parse(localStorage.getItem("user"));
        return {
          tenantCode: tenantCode || u?.tenantCode || u?.tenant_code || "",
          companyId: companyId || u?.companyId || u?.company_id || "",
        };
      } catch {
        // ignore JSON parse errors
      }
    }

    return { tenantCode, companyId };
  };

  // Header-based tenant/company context (backend can read from headers)
  const tenantHeaders = () => {
    const { tenantCode, companyId } = getTenantContext();
    return {
      ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
      ...(companyId ? { "X-Company-Id": companyId } : {}),
    };
  };

  // Query-param-based tenant/company context (fallback if backend uses params)
  const tenantParams = () => {
    const { tenantCode, companyId } = getTenantContext();
    return {
      ...(tenantCode ? { tenantCode } : {}),
      ...(companyId ? { companyId } : {}),
    };
  };

  // -------------------- NORMALIZERS --------------------
  const normalizeEmployee = (e) => ({
    id: e.id ?? e.empId ?? e.employeeId ?? e.userId ?? "",
    name: e.name ?? e.fullName ?? e.employeeName ?? e.username ?? "",
    email: e.email ?? e.mailId ?? "",
    department: e.department ?? e.dept ?? e.departmentName ?? "Not Assigned",
    location: e.location ?? e.officeLocation ?? "Not Set",
    status: e.status ?? e.attendanceStatus ?? "Unknown",
    punchIn: e.punchIn ?? e.inTime ?? "-",
    hours: e.hours ?? e.totalHours ?? e.workDuration ?? "-",
    breaks: e.breaks ?? e.breakCount ?? e.breakDuration ?? "-",
    role: e.role ?? e.designation ?? null,
  });

  const extractEmployeeList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.map(normalizeEmployee);
    if (Array.isArray(data.data)) return data.data.map(normalizeEmployee);
    if (Array.isArray(data.content)) return data.content.map(normalizeEmployee);
    if (Array.isArray(data.users)) return data.users.map(normalizeEmployee);
    if (Array.isArray(data.employees)) return data.employees.map(normalizeEmployee);

    if (typeof data === "object") {
      const arr = Object.values(data).filter(
        (v) => v && (v.name || v.employeeName || v.id)
      );
      if (arr.length) return arr.map(normalizeEmployee);
    }
    return [];
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const getTimesheetDateObject = (timesheet) => {
    const raw =
      timesheet?.date ??
      timesheet?.loginTime ??
      timesheet?.startTime ??
      timesheet?.submittedAt ??
      null;
    if (!raw) return null;

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getRangeStartDate = () => {
    const now = new Date();
    const start = new Date(now);

    if (exportRange === "1_DAY") {
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (exportRange === "1_WEEK") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (exportRange === "1_MONTH") {
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (exportRange === "6_MONTHS") {
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (exportRange === "1_YEAR") {
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    return null;
  };

  const getFilteredTimesheetsForExport = () => {
    if (!Array.isArray(timesheets) || timesheets.length === 0) return [];

    if (exportRange === "CUSTOM_DATE") {
      if (!customExportDate) return [];
      return timesheets.filter((t) => {
        const d = getTimesheetDateObject(t);
        if (!d) return false;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}` === customExportDate;
      });
    }

    const startDate = getRangeStartDate();
    if (!startDate) return timesheets;

    return timesheets.filter((t) => {
      const d = getTimesheetDateObject(t);
      return d ? d >= startDate : false;
    });
  };

  const handleDownloadAttendanceExcel = () => {
    try {
      setExportError("");
      setExportLoading(true);

      if (exportRange === "CUSTOM_DATE" && !customExportDate) {
        setExportError("Please select a custom date.");
        return;
      }

      const filtered = getFilteredTimesheetsForExport();
      if (filtered.length === 0) {
        setExportError("No attendance records found for the selected filter.");
        return;
      }

      const rows = filtered.map((t) => ({
        Name:
          t.employeeName ||
          employeeMap[t.employeeId]?.fullName ||
          employeeMap[t.employeeId]?.name ||
          "N/A",
        "Employee ID": t.employeeId ?? "-",
        Date: formatDateOnly(t.date || t.loginTime || t.submittedAt),
        "Login Time": formatTimeOnly(t.loginTime || t.startTime),
        "Logout Time": formatTimeOnly(t.logoutTime || t.endTime),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      const dateStamp = new Date().toISOString().slice(0, 10);
      const suffix =
        exportRange === "CUSTOM_DATE"
          ? `custom-${customExportDate}`
          : exportRange.toLowerCase();

      XLSX.writeFile(workbook, `attendance-${suffix}-${dateStamp}.xlsx`);
    } catch (err) {
      console.error("Failed to export attendance Excel", err);
      setExportError("Failed to export attendance data.");
    } finally {
      setExportLoading(false);
    }
  };

  const normalizeStats = (payload) => ({
    totalEmployees:
      payload.totalEmployees ??
      payload.total ??
      payload.totalCount ??
      payload.employeeCount ??
      0,
    presentToday: payload.presentToday ?? payload.present ?? payload.presentCount ?? 0,
    onLeave: payload.onLeave ?? payload.leaveCount ?? 0,
    pendingRequests:
      payload.pendingRequests ?? payload.pendingCount ?? payload.pending ?? 0,
    onBreak: payload.onBreak ?? payload.breakCount ?? 0,
    absentToday: payload.absentToday ?? payload.absent ?? payload.absentCount ?? 0,
    lateToday: payload.lateToday ?? payload.lateCheckIns ?? payload.lateCount ?? 0,
    workingNow: payload.workingNow ?? payload.currentlyWorking ?? 0,
  });

  // -------------------- API CALLS (TENANT FILTERED) --------------------
  const fetchEmployeeById = async (employeeId) => {
    if (!employeeId || employeeMap[employeeId]) return employeeMap[employeeId];

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/employees/${employeeId}`,
        {
          headers: { ...authHeaders(), ...tenantHeaders() },
          params: tenantParams(),
        }
      );
      const emp = res.data?.data ?? res.data;
      setEmployeeMap((prev) => ({ ...prev, [employeeId]: emp }));
      return emp;
    } catch (err) {
      console.error("Error fetching employee:", employeeId, err);
      return null;
    }
  };

  const fetchTimesheets = async () => {
    try {
      setTimesheetsLoading(true);
      setTimesheetsError("");

      const res = await axios.get(
        `${API_BASE_URL}/api/admin/attendance/timesheets`,
        {
          headers: { ...authHeaders(), ...tenantHeaders() },
          params: tenantParams(),
        }
      );

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];

      setTimesheets(list);

      const ids = [...new Set(list.map((t) => t.employeeId).filter(Boolean))];
      await Promise.all(ids.map((id) => fetchEmployeeById(id)));
    } catch (err) {
      console.error("Error fetching timesheets", err);
      setTimesheetsError("Failed to load timesheets");
      setTimesheets([]);
    } finally {
      setTimesheetsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      setEmployeesError("");

      const res = await axios.get(
        `${API_BASE_URL}/api/admin/attendance/live-employees`,
        {
          headers: { ...authHeaders(), ...tenantHeaders() },
          params: tenantParams(),
        }
      );

      const list = extractEmployeeList(res.data);
      if (list.length === 0) setEmployeesError("No employee data available");
      setEmployees(list);
    } catch (err) {
      console.error("Error fetching live employee data", err);
      setEmployees([]);
      setEmployeesError("Failed to load employee data");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");

      const res = await axios.get(
        `${API_BASE_URL}/api/admin/attendance/dashboard-stats`,
        {
          headers: { ...authHeaders(), ...tenantHeaders() },
          params: tenantParams(),
        }
      );

      const data = res.data?.data ?? res.data;
      setStats(normalizeStats(data || {}));
    } catch (err) {
      console.error("Error fetching attendance stats", err);
      setStatsError("Failed to load attendance summary");
    } finally {
      setStatsLoading(false);
    }
  };

  const assignAttendanceApi = async () => {
    if (!selectedEmployee) return;
    const employeeId = selectedEmployee.id;

    const payload = {
      leaveType: attendanceForm.status.toUpperCase().replace(" ", "_"),
      startDate: attendanceForm.startDate,
      endDate: attendanceForm.endDate || attendanceForm.startDate,
      reason: attendanceForm.reason || "Marked manually by Manager",
    };

    return axios.post(
      `${API_BASE_URL}/api/admin/attendance/apply-manual-attendance/${employeeId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          ...tenantHeaders(),
        },
        params: tenantParams(),
      }
    );
  };

  const assignLeaveApi = async () => {
    if (!assignLeaveEmployee) return;
    const employeeId = assignLeaveEmployee.id;

    const payload = {
      leaveType: assignLeaveForm.leaveType || "LEAVE",
      startDate: assignLeaveForm.startDate,
      endDate: assignLeaveForm.endDate || assignLeaveForm.startDate,
      reason: "Leave assigned manually by admin",
    };

    return axios.post(
      `${API_BASE_URL}/api/admin/attendance/apply-manual-attendance/${employeeId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          ...tenantHeaders(),
        },
        params: tenantParams(),
      }
    );
  };

  const fetchHolidayList = async (month = currentMonth, year = currentYear) => {
    try {
      setHolidaysLoading(true);
      const list = await fetchHolidays({ month: month + 1, year });
      setHolidayList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
      setHolidayList([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    // Optional: warn if tenant/company missing
    const { tenantCode, companyId } = getTenantContext();
    if (!tenantCode || !companyId) {
      console.warn(
        "Tenant context missing in localStorage. tenantCode/companyId not found.",
        { tenantCode, companyId }
      );
    }

    fetchEmployees();
    fetchStats();
    fetchTimesheets();
    fetchHolidayList(currentMonth, currentYear);

    const intervalId = setInterval(() => {
      fetchEmployees();
      fetchStats();
    }, 30000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHolidayList(currentMonth, currentYear);
    const onHolidayUpdated = () => fetchHolidayList(currentMonth, currentYear);
    const onHolidayStorageUpdated = (event) => {
      if (event?.key !== HOLIDAY_UPDATE_STORAGE_KEY) return;
      fetchHolidayList(currentMonth, currentYear);
    };
    const intervalId = setInterval(() => fetchHolidayList(currentMonth, currentYear), 60000);
    window.addEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdated);
    window.addEventListener("storage", onHolidayStorageUpdated);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdated);
      window.removeEventListener("storage", onHolidayStorageUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear]);

  // -------------------- FILTERS --------------------
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      String(emp.id).toLowerCase().includes(q);

    const matchesDepartment =
      filterDepartment === "All Departments" ? true : emp.department === filterDepartment;

    const matchesStatus = filterStatus === "All Statuses" ? true : emp.status === filterStatus;

    const matchesLocation =
      filterLocation === "All Locations" ? true : emp.location === filterLocation;

    const matchesTopDepartment =
      selectedDepartment === "All" || emp.department === selectedDepartment;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesLocation &&
      matchesTopDepartment
    );
  });

  const clearFilters = () => {
    setSearchQuery("");
    setFilterDepartment("All Departments");
    setFilterStatus("All Statuses");
    setFilterLocation("All Locations");
  };

  // -------------------- CALENDAR HELPERS --------------------
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const changeMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else setCurrentMonth((m) => m - 1);
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else setCurrentMonth((m) => m + 1);
    }
  };

  // -------------------- ACTION HANDLERS --------------------
  const handleAssignAttendance = (employee) => {
    setSelectedEmployee(employee);
    setAttendanceForm({
      status: "Present",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedEmployee) {
      alert("No employee selected.");
      return;
    }
    if (!attendanceForm.startDate) {
      alert("Please select a start date.");
      return;
    }
    try {
      setAssignSaving(true);
      await assignAttendanceApi();
      alert("Attendance assigned.");
      setShowAssignModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      console.error("Assign attendance error:", err);
      alert("Failed to assign attendance");
    } finally {
      setAssignSaving(false);
    }
  };

  const openAssignLeaveFor = (employee) => {
    setAssignLeaveEmployee(employee);
    setAssignLeaveForm({ leaveType: "LEAVE", startDate: "", endDate: "" });
    setShowAssignLeaveModal(true);
  };

  const handleAssignLeaveSubmit = async () => {
    if (!assignLeaveForm.startDate) {
      alert("Please select a start date for leave.");
      return;
    }
    try {
      setAssignLeaveSaving(true);
      await assignLeaveApi();
      alert("Leave assigned successfully.");
      setShowAssignLeaveModal(false);
      setAssignLeaveEmployee(null);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      console.error("Assign leave error:", err);
      alert("Failed to assign leave");
    } finally {
      setAssignLeaveSaving(false);
    }
  };

  const handleUpdateTimesheet = async () => {
    if (!selectedTimesheet) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/attendance/timesheets/${selectedTimesheet.id}`,
        {
          task: selectedTimesheet.task,
          remarks: selectedTimesheet.remarks,
        },
        {
          headers: { ...authHeaders(), ...tenantHeaders() },
          params: tenantParams(),
        }
      );

      alert("Timesheet updated successfully!");
      setSelectedTimesheet(null);
      fetchTimesheets();
    } catch (err) {
      console.error("Error updating timesheet:", err);
      alert("Failed to update timesheet");
    }
  };

  // -------------------- UI RENDER HELPERS --------------------
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const calendarYearOptions = Array.from({ length: 21 }, (_, index) => today.getFullYear() - 10 + index);

  const renderEmployeeList = () => (
    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
              Employee Live List
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {employeesLoading
              ? "Loading employees..."
              : `Currently showing ${filteredEmployees.length} of ${employees.length} employees • Auto-refreshes every 30s`}
          </p>
          {employeesError && (
            <p className="text-xs text-red-500 mt-1">{employeesError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#00008B] outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>HR</option>
            <option>Finance</option>
            <option>Testing</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Working</option>
            <option>Absent</option>
            <option>On Leave</option>
            <option>Late</option>
            <option>On Break</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option>All Locations</option>
            <option>Bangalore</option>
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Pune</option>
            <option>Chennai</option>
            <option>Hyderabad</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: primaryBlue }} className="text-white text-left">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Punch In</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Breaks</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employeesLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-xs text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-xs text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#00008B]">{emp.name}</span>
                        <span className="text-xs text-gray-500">{emp.email}</span>
                        <span className="text-xs text-gray-400">ID: {emp.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black">{emp.department}</td>
                  <td className="px-4 py-3 text-black">{emp.location}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === "Working"
                        ? "bg-green-100 text-green-700"
                        : emp.status === "Absent"
                          ? "bg-red-100 text-red-700"
                          : emp.status === "On Leave"
                            ? "bg-yellow-100 text-yellow-700"
                            : emp.status === "Late"
                              ? "bg-orange-100 text-orange-700"
                              : emp.status === "On Break"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black">{emp.punchIn}</td>
                  <td className="px-4 py-3 text-black">{emp.hours}</td>
                  <td className="px-4 py-3 text-black">{emp.breaks}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-black">
                      <button
                        onClick={() => handleAssignAttendance(emp)}
                        className="px-2 py-1 text-xs rounded-md bg-[#00008B] text-white hover:bg-blue-900"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => openAssignLeaveFor(emp)}
                        className="px-2 py-1 text-xs rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Assign Leave
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
        <div className="flex gap-3">
          <span>Working: {filteredEmployees.filter((e) => e.status === "Working").length}</span>
          <span>On Break: {filteredEmployees.filter((e) => e.status === "On Break").length}</span>
          <span>Absent: {filteredEmployees.filter((e) => e.status === "Absent").length}</span>
        </div>
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const cells = [];
    const holidayByDate = buildHolidayMapByDate(holidayList);

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`blank-${i}`} className="h-20 border border-gray-100" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const holidaysForDate = holidayByDate[dateKey] || [];
      const holidayNames = holidaysForDate.map((holiday) => holiday?.name).filter(Boolean);
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isHoliday = holidayNames.length > 0;
      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      cells.push(
        <div
          key={day}
          title={isHoliday ? `${holidayNames.join(", ")} (Holiday)` : undefined}
          className={`h-24 border p-2 flex flex-col justify-between ${
            isHoliday
              ? "bg-purple-50 border-purple-200"
              : isWeekend
                ? "bg-gray-50 border-gray-100"
                : "bg-white border-gray-100"
            } ${isToday ? "ring-2 ring-[#00008B]" : ""}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow]}
            </span>
            <span className="text-sm font-semibold text-[#00008B]">{day}</span>
          </div>
          {isHoliday && (
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-10 pr-1">
              {holidayNames.map((name, index) => (
                <span key={`${dateKey}-${name}-${index}`} className="text-[10px] font-semibold text-purple-700 truncate">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
            Calendar View
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth("prev")}
              className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50"
            >
              ‹
            </button>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-2 py-1 border rounded-lg text-sm bg-white text-[#00008B] focus:ring-2 focus:ring-[#00008B] outline-none"
              aria-label="Select month"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-2 py-1 border rounded-lg text-sm bg-white text-[#00008B] focus:ring-2 focus:ring-[#00008B] outline-none"
              aria-label="Select year"
            >
              {calendarYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={() => changeMonth("next")}
              className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>
    );
  };

  const renderAssignLeave = () => {
    const assignLeaveEmployees = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role ?? null,
    }));

    let filtered = assignLeaveEmployees.filter((emp) =>
      emp.name.toLowerCase().includes(searchName.toLowerCase())
    );

    if (searchName.trim() !== "") {
      filtered = filtered.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(searchName.toLowerCase());
        const bStarts = b.name.toLowerCase().startsWith(searchName.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }

    return (
      <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
              Assign Leave to Employees
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Click Assign Leave next to an employee to open the assign-leave form.
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#00008B] outline-none w-full md:w-64"
          />
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No employees found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            filtered.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <h4 className="text-sm font-semibold text-[#00008B]">{emp.name}</h4>
                  <p className="text-xs text-gray-500">{emp.email}</p>
                  <p className="text-xs text-gray-500">
                    Dept: {emp.department} • ID: {emp.id}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-[#00008B] text-white hover:bg-blue-900"
                    onClick={() => handleAssignAttendance(emp)}
                  >
                    Assign Attendance
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={() => openAssignLeaveFor(emp)}
                  >
                    Assign Leave
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAssignModal && selectedEmployee && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowAssignModal(false)}
          >
            <div
              className="bg-white w-[95%] max-w-lg rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: primaryBlue }}>
                Assign Attendance
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Employee ID: <span className="font-medium">{selectedEmployee.id}</span> •
                Name: <span className="font-medium">{selectedEmployee.name}</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    value={attendanceForm.status}
                    onChange={(e) =>
                      setAttendanceForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                  >
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Half Day</option>
                    <option>Leave</option>
                    <option>Compensation Off</option>
                    <option>Saturday Work</option>
                    <option>Sunday Work</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={attendanceForm.startDate}
                      onChange={(e) =>
                        setAttendanceForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={attendanceForm.endDate}
                      onChange={(e) =>
                        setAttendanceForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={attendanceForm.reason}
                    onChange={(e) =>
                      setAttendanceForm((p) => ({ ...p, reason: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none resize-none placeholder:text-gray-400"
                    placeholder="Optional reason"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-[#00008B] text-white hover:bg-blue-900 disabled:opacity-60"
                  onClick={handleAssignSubmit}
                  disabled={assignSaving}
                >
                  {assignSaving ? "Assigning..." : "Assign Attendance"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAssignLeaveModal && assignLeaveEmployee && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowAssignLeaveModal(false)}
          >
            <div
              className="bg-white w-[95%] max-w-md rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: primaryBlue }}>
                Assign Leave
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Employee ID: <span className="font-medium">{assignLeaveEmployee.id}</span> •
                Name: <span className="font-medium">{assignLeaveEmployee.name}</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={assignLeaveForm.leaveType}
                    onChange={(e) =>
                      setAssignLeaveForm((p) => ({ ...p, leaveType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                  >
                    <option value="LEAVE">Leave</option>
                    <option value="EARNED_LEAVE">Earned Leave</option>
                    <option value="SICK_LEAVE">Sick Leave</option>
                    <option value="CASUAL_LEAVE">Casual Leave</option>
                    <option value="WFH">WFH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={assignLeaveForm.startDate}
                    onChange={(e) =>
                      setAssignLeaveForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={assignLeaveForm.endDate}
                    onChange={(e) =>
                      setAssignLeaveForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowAssignLeaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
                  onClick={handleAssignLeaveSubmit}
                  disabled={assignLeaveSaving}
                >
                  {assignLeaveSaving ? "Assigning..." : "Assign Leave"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimesheetView = () => (
    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
            Timesheets ({timesheets.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            All timesheets with employee names resolved
          </p>
          {timesheetsError && (
            <p className="text-sm text-red-500 mt-1">{timesheetsError}</p>
          )}
        </div>
        <button
          onClick={fetchTimesheets}
          disabled={timesheetsLoading}
          className="px-6 py-2 text-sm bg-[#00008B] text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 flex items-center gap-2"
        >
          {timesheetsLoading ? "⟳ Loading..." : "⟳ Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">ID</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Task</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Remarks</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {timesheetsLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading timesheets...
                </td>
              </tr>
            ) : timesheets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No timesheets found
                </td>
              </tr>
            ) : (
              timesheets.map((t) => {
                const emp = employeeMap[t.employeeId];
                const empName =
                  emp?.name || emp?.fullName || emp?.employeeName || "Unknown";
                return (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-[#00008B]">{t.id}</td>
                    <td className="px-6 py-4 text-black">{t.tasks || "-"}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="text-sm text-gray-900 line-clamp-2 text-black">
                        {t.remarks || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#00008B]">
                      {formatDateOnly(t.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTimesheet(t)}
                        className="px-4 py-2 text-xs bg-[#00008B] text-white rounded-lg hover:bg-blue-900"
                      >
                        View/Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedTimesheet && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTimesheet(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: primaryBlue }}>
              Edit Timesheet #{selectedTimesheet.id}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={selectedTimesheet.employeeId}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={
                      employeeMap[selectedTimesheet.employeeId]?.name ||
                      employeeMap[selectedTimesheet.employeeId]?.fullName ||
                      "Loading..."
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task
                </label>
                <input
                  type="text"
                  value={selectedTimesheet.task || ""}
                  onChange={(e) =>
                    setSelectedTimesheet((prev) => ({
                      ...prev,
                      task: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={4}
                  value={selectedTimesheet.remarks || ""}
                  onChange={(e) =>
                    setSelectedTimesheet((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] resize-vertical"
                  placeholder="Enter remarks..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitted
                </label>
                <input
                  type="text"
                  value={formatDateOnly(selectedTimesheet.submittedAt)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedTimesheet(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTimesheet}
                className="px-6 py-2 bg-[#00008B] text-white rounded-lg hover:bg-blue-900"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReportsContent = () => {
    if (reportSubTab === "overview") {
      return (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-2" style={{ color: primaryBlue }}>
              Summary Reports
            </h3>
            <p className="text-xs text-gray-500">
              High level attendance overview for the selected period.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-2" style={{ color: primaryBlue }}>
              Trend Analysis
            </h3>
            <p className="text-xs text-gray-500">
              Track absenteeism and late arrivals trend over months.
            </p>
          </div>
        </div>
      );
    }
    if (reportSubTab === "custom")
      return (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
          Build custom attendance reports with filters and export options.
        </div>
      );
    if (reportSubTab === "automated")
      return (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
          Configure automated reports that are emailed to managers weekly or monthly.
        </div>
      );
    if (reportSubTab === "export")
      return (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3" style={{ color: primaryBlue }}>
            Attendance Excel Export
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Download attendance
          </p>

          {/* {!isAdminUser && (
            <p className="text-xs text-red-600">Only admin users can access this export.</p>
          )} */}

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter Range
              </label>
              <select
                value={exportRange}
                onChange={(e) => {
                  setExportRange(e.target.value);
                  setExportError("");
                }}
                disabled={!isAdminUser}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none"
              >
                <option value="1_DAY">1 Day</option>
                <option value="1_WEEK">1 Week</option>
                <option value="1_MONTH">1 Month</option>
                <option value="6_MONTHS">6 Months</option>
                <option value="1_YEAR">1 Year</option>
                <option value="CUSTOM_DATE">Custom Date</option>
              </select>
            </div>

            {exportRange === "CUSTOM_DATE" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={customExportDate}
                  onChange={(e) => {
                    setCustomExportDate(e.target.value);
                    setExportError("");
                  }}
                  disabled={!isAdminUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none"
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleDownloadAttendanceExcel}
                disabled={!isAdminUser || exportLoading || timesheetsLoading}
                className="w-full px-4 py-2 bg-[#00008B] text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {exportLoading ? "Downloading..." : "Download Excel"}
              </button>
            </div>
          </div>

          {exportError && <p className="mt-3 text-xs text-red-600">{exportError}</p>}
        </div>
      );
    return null;
  };

  const renderSettingsContent = () => {
    if (settingsSubTab === "attendance-rules") {
      return (
        <div className="mt-4 space-y-3">
          {[
            {
              title: "Late Check-in Grace Period",
              desc: "Allow employees to check in up to 15 minutes late without penalty.",
              enabled: true,
            },
            {
              title: "Auto Punch Out",
              desc: "Automatically punch out employees at end of workday.",
              enabled: true,
            },
            {
              title: "Break Time Enforcement",
              desc: "Require minimum break time between shifts.",
              enabled: false,
            },
            {
              title: "Overtime Calculation",
              desc: "Automatically calculate overtime hours.",
              enabled: true,
            },
          ].map((rule, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-[#00008B]">{rule.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rule.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {rule.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{rule.desc}</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={rule.enabled} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-[#00008B] relative">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4" />
                </div>
              </label>
            </div>
          ))}
        </div>
      );
    }

    if (settingsSubTab === "holidays") {
      return (
        <div className="mt-4 space-y-3">
          {holidaysLoading && (
            <div className="text-xs text-gray-500 px-1">Syncing holidays...</div>
          )}
          {holidayList.length === 0 && !holidaysLoading && (
            <div className="text-xs text-gray-500 px-1">No holidays configured.</div>
          )}
          {holidayList.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-semibold text-[#00008B]">{holiday.name}</h4>
                <p className="text-xs text-gray-500 mb-1">{holiday.date}</p>
                <div className="flex gap-2 flex-wrap">
                  {(holiday.tags || []).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400">Managed by Super Admin</span>
            </div>
          ))}
        </div>
      );
    }

    if (settingsSubTab === "policies") {
      return (
        <div className="mt-4 space-y-3">
          {[
            {
              title: "Work Hours Policy",
              desc: "Standard work hours are 9:00 AM to 6:00 PM, Monday to Friday.",
            },
            {
              title: "Leave Policy",
              desc: "Employees are entitled to 25 days of annual leave per year.",
            },
          ].map((p, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-[#00008B] mb-1">{p.title}</h4>
              <p className="text-xs text-gray-500 mb-2">{p.desc}</p>
              <button className="text-xs text-[#00008B] font-semibold hover:underline">
                Edit Policy
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (settingsSubTab === "leave-policies") {
      return (
        <div className="mt-4 space-y-3">
          {[
            { title: "Annual Leave", annual: 12, monthly: 1, carryForward: 6 },
            { title: "Sick Leave", annual: 6, monthly: 0.5, carryForward: 3 },
          ].map((lp, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#00008B]">{lp.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                Annual Allocation: {lp.annual} days • Monthly Accrual: {lp.monthly} days
              </p>
              <p className="text-xs text-gray-500">Max Carry Forward: {lp.carryForward} days</p>
            </div>
          ))}
        </div>
      );
    }

    if (settingsSubTab === "system") {
      return (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-[#00008B] mb-2">Time Zone</h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B] outline-none">
              <option>UTC+5:30 (IST)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC-5 (ET)</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-[#00008B] mb-2">Notifications</h4>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <input type="checkbox" defaultChecked /> Email for late check-ins
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <input type="checkbox" defaultChecked /> SMS for system downtime
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" /> Push notification for approvals
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTabContent = () => {
    if (!isTabAllowed(activeTab)) return null;

    if (activeTab === "employee") return renderEmployeeList();
    if (activeTab === "calendar") return renderCalendarView();
    if (activeTab === "assign") return renderAssignLeave();
    if (activeTab === "leave") return <LeaveManagement />;
    if (activeTab === "timesheet") return renderTimesheetView();

    if (activeTab === "reports") {
      return (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex gap-2 flex-wrap text-xs mb-3">
            {["overview", "custom", "automated", "export"].map((tab) => (
              <button
                key={tab}
                onClick={() => setReportSubTab(tab)}
                className={`px-3 py-1 rounded-full border text-xs font-medium ${reportSubTab === tab
                  ? "bg-[#00008B] text-white border-[#00008B]"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {tab === "overview" && "📊 Overview"}
                {tab === "custom" && "✏️ Custom"}
                {tab === "automated" && "🤖 Automated"}
                {tab === "export" && "⬇️ Export"}
              </button>
            ))}
          </div>
          {renderReportsContent()}
        </div>
      );
    }

    if (activeTab === "settings") {
      return (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex gap-2 flex-wrap text-xs mb-3">
            {[
              { id: "attendance-rules", label: "⚙️ Attendance Rules" },
              { id: "holidays", label: "🎄 Holidays" },
              { id: "policies", label: "📋 Policies" },
              { id: "leave-policies", label: "📅 Leave Policies" },
              { id: "system", label: "💻 System" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSettingsSubTab(tab.id)}
                className={`px-3 py-1 rounded-full border text-xs font-medium ${settingsSubTab === tab.id
                  ? "bg-[#00008B] text-white border-[#00008B]"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderSettingsContent()}
        </div>
      );
    }

    // Default: Dashboard view
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
            Real-Time Attendance Overview
          </h2>
          {statsLoading && <span className="text-[10px] text-gray-500">Refreshing summary…</span>}
        </div>
        {statsError && <p className="text-xs text-red-500 mb-2">{statsError}</p>}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <div className="text-2xl font-bold text-[#00008B]">{stats.totalEmployees}</div>
            <div className="text-xs mt-1 text-[#00008B] font-medium">Total Employees</div>
          </div>
          <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
            <div className="text-2xl font-bold text-green-700">{stats.presentToday}</div>
            <div className="text-xs mt-1 text-green-800 font-medium">Present Today</div>
          </div>
          <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4">
            <div className="text-2xl font-bold text-yellow-700">{stats.onBreak}</div>
            <div className="text-xs mt-1 text-yellow-800 font-medium">On Break</div>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
            <div className="text-2xl font-bold text-red-700">{stats.absentToday}</div>
            <div className="text-xs mt-1 text-red-800 font-medium">Absent Today</div>
          </div>
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
            <div className="text-2xl font-bold text-orange-700">{stats.lateToday}</div>
            <div className="text-xs mt-1 text-orange-800 font-medium">Late Today</div>
          </div>
          <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
            <div className="text-2xl font-bold text-purple-700">{stats.workingNow}</div>
            <div className="text-xs mt-1 text-purple-800 font-medium">Working Now</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-sm text-slate-600">
              Pending Requests: <span className="font-semibold">{stats.pendingRequests}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-4">
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"
        style={{ backgroundColor: primaryBlue }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Attendance Dashboard</h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
            Monitor real-time attendance, manage leaves, assign corrections,
            and configure policies in one place.
          </p>
        </div>
        <button
          onClick={() => {
            fetchEmployees();
            fetchStats();
            fetchTimesheets();
          }}
          disabled={employeesLoading || statsLoading || timesheetsLoading}
          className="text-xs px-3 py-2 rounded-full bg-white/10 text-white border border-white/30 hover:bg-white/20 disabled:opacity-50"
        >
          {employeesLoading || statsLoading || timesheetsLoading ? "⟳ Refreshing..." : "⟳ Refresh Data"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xl font-bold text-[#00008B]">{stats.totalEmployees}</div>
          <div className="text-xs mt-1 text-gray-500">Total Employees</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xl font-bold text-green-600">{stats.presentToday}</div>
          <div className="text-xs mt-1 text-gray-500">Present Today</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-600">On Leave: {stats.onLeave}</div>
          <div className="text-xs mt-1 text-gray-500">Scheduled / Approved Leaves</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xl font-bold text-red-600">{stats.pendingRequests}</div>
          <div className="text-xs mt-1 text-gray-500">Pending Requests</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm text-xs">
          <span className="text-gray-500">Department:</span>
          <select
            className="bg-transparent text-[#00008B] text-xs outline-none"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
          </select>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={`${tab.title} ${tab.sub}`}
              className={`px-3 py-2 rounded-t-lg border-b-2 flex flex-col items-start min-w-[110px] ${activeTab === tab.id
                ? "border-[#00008B] bg-blue-50"
                : "border-transparent hover:bg-gray-50"
                }`}
            >
              <span className={`text-[11px] font-semibold ${activeTab === tab.id ? "text-[#00008B]" : "text-gray-600"}`}>{tab.title}</span>
              <span className="text-[10px] text-gray-400">{tab.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
}

