import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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

/**
 * TL Attendance Dashboard (Full Features)
 * - Same UI/UX as Admin Attendance but:
 *   ✅ fetches ONLY TL team members from /api/tl/... endpoints
 *   ✅ TL can assign/approve/track for TEAM only
 */
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
export default function TeamLeadAttendance() {
    const { canAccessFeature } = useAccessControl();
    const accessContext = resolveAccessContext();

    // -------------------- UI STATE --------------------
    const [activeTab, setActiveTab] = useState("dashboard");
    const [selectedDepartment, setSelectedDepartment] = useState("All");

    const [reportSubTab, setReportSubTab] = useState("overview");
    const [settingsSubTab, setSettingsSubTab] = useState("attendance-rules");

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Filters (Employee List)
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("All Departments");
    const [filterStatus, setFilterStatus] = useState("All Statuses");
    const [filterLocation, setFilterLocation] = useState("All Locations");

    // Employees (Live list)
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState("");

    // Dashboard Stats
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
    const [holidayList, setHolidayList] = useState([]);
    const [holidaysLoading, setHolidaysLoading] = useState(false);

    // Timesheets
    const [timesheets, setTimesheets] = useState([]);
    const [timesheetsLoading, setTimesheetsLoading] = useState(false);
    const [timesheetsError, setTimesheetsError] = useState("");
    const [selectedTimesheet, setSelectedTimesheet] = useState(null);

    // Assign Attendance Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [attendanceForm, setAttendanceForm] = useState({
        status: "Present",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const [assignSaving, setAssignSaving] = useState(false);

    // Assign Leave Modal
    const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
    const [assignLeaveEmployee, setAssignLeaveEmployee] = useState(null);
    const [assignLeaveForm, setAssignLeaveForm] = useState({
        startDate: "",
        endDate: "",
        leaveType: "LEAVE",
        reason: "Leave assigned by TL",
    });
    const [assignLeaveSaving, setAssignLeaveSaving] = useState(false);

    // Leave Requests (Approve/Reject)
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState("");

    const primaryBlue = "#00008B";
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

    // -------------------- AUTH + TENANT HELPERS --------------------
    const authHeaders = () => {
        const token = localStorage.getItem("token");
        if (!token) return {};
        return token.startsWith("Bearer ")
            ? { Authorization: token }
            : { Authorization: `Bearer ${token}` };
    };

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
                // ignore
            }
        }

        return { tenantCode, companyId };
    };

    const tenantHeaders = () => {
        const { tenantCode, companyId } = getTenantContext();
        return {
            ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
            ...(companyId ? { "X-Company-Id": companyId } : {}),
        };
    };

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
        name: e.name ?? e.fullName ?? e.employeeName ?? e.username ?? e.firstName ?? "",
        email: e.email ?? e.mailId ?? e.officialEmail ?? e.personalEmail ?? "",
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
        return [];
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
        pendingRequests: payload.pendingRequests ?? payload.pendingCount ?? payload.pending ?? 0,
        onBreak: payload.onBreak ?? payload.breakCount ?? 0,
        absentToday: payload.absentToday ?? payload.absent ?? payload.absentCount ?? 0,
        lateToday: payload.lateToday ?? payload.lateCheckIns ?? payload.lateCount ?? 0,
        workingNow: payload.workingNow ?? payload.currentlyWorking ?? 0,
    });

    const formatDateOnly = (isoString) => {
        if (!isoString) return "-";
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return "-";
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = d.getFullYear();
        return `${dd}-${mm}-${yy}`;
    };

    const normalizeLeaveRequest = (r) => ({
        id: r.id ?? r.requestId ?? "",
        employeeId: r.userId ?? r.employeeId ?? "",
        employeeName: r.employeeName ?? r.employee?.fullName ?? r.employee?.name ?? "",
        leaveType: r.leaveType ?? r.type ?? "LEAVE",
        startDate: r.startDate ?? r.fromDate ?? r.date ?? null,
        endDate: r.endDate ?? r.toDate ?? r.startDate ?? null,
        status: r.status ?? "PENDING",
        requestType: (r.type || "leave").toString().toLowerCase().includes("correction")
            ? "correction"
            : "leave",
    });

    // -------------------- TL API CALLS --------------------
    const tlGet = (url) =>
        axios.get(`${API_BASE_URL}${url}`, {
            headers: { ...authHeaders(), ...tenantHeaders() },
            params: tenantParams(),
        });

    const tlPost = (url, payload) =>
        axios.post(`${API_BASE_URL}${url}`, payload, {
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
                ...tenantHeaders(),
            },
            params: tenantParams(),
        });

    const tlPut = (url, payload) =>
        axios.put(`${API_BASE_URL}${url}`, payload, {
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
                ...tenantHeaders(),
            },
            params: tenantParams(),
        });

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

    // Live employees (team only)
    const fetchTeamEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");

            let list = [];
            try {
                const res = await tlGet("/api/tl/attendance/live-team");
                list = extractEmployeeList(res.data);
            } catch {
                try {
                    const res = await tlGet("/api/admin/attendance/live");
                    list = extractEmployeeList(res.data);
                } catch {
                    const { tenantCode } = getTenantContext();
                    const teamLeadEmployeeId = localStorage.getItem("employeeId") || "";

                    if (tenantCode && teamLeadEmployeeId) {
                        const res = await tlGet(`/api/employee-details/team-lead/${tenantCode}/${teamLeadEmployeeId}`);
                        list = extractEmployeeList(res.data);
                    }
                }
            }

            setEmployees(list);

            if (list.length === 0) setEmployeesError("No team employee data available");
        } catch (e) {
            console.error(e);
            setEmployees([]);
            setEmployeesError("Failed to load team employees");
        } finally {
            setEmployeesLoading(false);
        }
    };

    // Team stats
    const fetchTeamStats = async () => {
        try {
            setStatsLoading(true);
            setStatsError("");

            let res;
            try {
                // Preferred TL endpoint (if present)
                res = await tlGet("/api/tl/attendance/team-stats");
            } catch {
                try {
                    // Fallback to existing admin attendance summary endpoint
                    res = await tlGet("/api/admin/attendance/dashboard-stats");
                } catch {
                    // Final fallback: derive summary from live data
                    const live = await tlGet("/api/admin/attendance/live");
                    const rows = Array.isArray(live.data?.data)
                        ? live.data.data
                        : Array.isArray(live.data)
                            ? live.data
                            : [];

                    const present = rows.filter((r) =>
                        String(r.status || r.attendanceStatus || "").toUpperCase().includes("PRESENT")
                    ).length;
                    const onBreak = rows.filter((r) =>
                        String(r.status || r.attendanceStatus || "").toUpperCase().includes("BREAK")
                    ).length;
                    const absent = rows.filter((r) =>
                        String(r.status || r.attendanceStatus || "").toUpperCase().includes("ABSENT")
                    ).length;

                    setStats({
                        totalEmployees: rows.length,
                        presentToday: present,
                        onLeave: 0,
                        pendingRequests: 0,
                        onBreak,
                        absentToday: absent,
                        lateToday: 0,
                        workingNow: Math.max(0, present - onBreak),
                    });
                    return;
                }
            }
            const data = res.data?.data ?? res.data;
            setStats(normalizeStats(data || {}));
        } catch (e) {
            console.error(e);
            setStatsError("Failed to load attendance summary");
        } finally {
            setStatsLoading(false);
        }
    };

    // Timesheets (team only)
    const fetchTeamTimesheets = async () => {
        try {
            setTimesheetsLoading(true);
            setTimesheetsError("");
            let list = [];
            try {
                const res = await tlGet("/api/tl/attendance/timesheets");
                list = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                        ? res.data
                        : [];
            } catch {
                const res = await tlGet("/api/admin/attendance/timesheets");
                list = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                        ? res.data
                        : [];
            }

            const teamIds = new Set(
                (employees || [])
                    .map((e) => String(e.id || "").trim())
                    .filter(Boolean)
            );
            if (teamIds.size > 0) {
                list = list.filter((t) => teamIds.has(String(t.employeeId ?? t.userId ?? "").trim()));
            }

            setTimesheets(list);
        } catch (e) {
            console.error(e);
            setTimesheets([]);
            setTimesheetsError("Failed to load team timesheets");
        } finally {
            setTimesheetsLoading(false);
        }
    };

    // Leave Requests (team only)
    const fetchLeaveRequests = async () => {
        try {
            setLeaveLoading(true);
            setLeaveError("");

            let list = [];
            try {
                const res = await tlGet("/api/tl/leaves/requests");
                const raw = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                        ? res.data
                        : [];
                list = raw.map(normalizeLeaveRequest);
            } catch {
                const res = await tlGet("/api/admin/attendance/pending-requests");
                const pendingLeaves = Array.isArray(res.data?.data?.pendingLeaves)
                    ? res.data.data.pendingLeaves
                    : Array.isArray(res.data?.pendingLeaves)
                        ? res.data.pendingLeaves
                        : [];

                list = pendingLeaves.map(normalizeLeaveRequest);
            }

            // Show only team members if employee list is available
            const teamIds = new Set(
                (employees || [])
                    .map((e) => String(e.id || "").trim())
                    .filter(Boolean)
            );
            const filtered = teamIds.size > 0
                ? list.filter((r) => teamIds.has(String(r.employeeId || "").trim()))
                : list;

            setLeaveRequests(filtered);
        } catch (e) {
            console.error(e);
            setLeaveRequests([]);
            setLeaveError("Failed to load leave requests");
        } finally {
            setLeaveLoading(false);
        }
    };

    // Assign Attendance (manual correction for team member)
    const assignAttendanceApi = async () => {
        if (!selectedEmployee) return;

        const payload = {
            leaveType: attendanceForm.status.toUpperCase().replace(" ", "_"),
            startDate: attendanceForm.startDate,
            endDate: attendanceForm.endDate || attendanceForm.startDate,
            reason: attendanceForm.reason || "Marked manually by TL",
        };

        // TL endpoint (team-only enforcement on backend)
        return tlPost(`/api/tl/attendance/apply-manual-attendance/${selectedEmployee.id}`, payload);
    };

    // Assign Leave (manual leave assign)
    const assignLeaveApi = async () => {
        if (!assignLeaveEmployee) return;

        const payload = {
            leaveType: assignLeaveForm.leaveType || "LEAVE",
            startDate: assignLeaveForm.startDate,
            endDate: assignLeaveForm.endDate || assignLeaveForm.startDate,
            reason: assignLeaveForm.reason || "Leave assigned by TL",
        };

        return tlPost(`/api/tl/attendance/apply-manual-attendance/${assignLeaveEmployee.id}`, payload);
    };

    // Approve / Reject Leave
    const approveLeave = async (requestId) => {
        try {
            await tlPut(`/api/tl/leaves/${requestId}/approve`, {});
        } catch {
            await tlPut(`/api/admin/attendance/approve-request/${requestId}`, { type: "leave" });
        }
    };

    const rejectLeave = async (requestId) => {
        try {
            await tlPut(`/api/tl/leaves/${requestId}/reject`, {});
        } catch {
            await tlPut(`/api/admin/attendance/reject-request/${requestId}`, {
                type: "leave",
                reason: "Rejected by Team Lead",
            });
        }
    };

    // Update Timesheet (TL review/edit)
    const handleUpdateTimesheet = async () => {
        if (!selectedTimesheet) return;
        try {
            const payload = {
                task: selectedTimesheet.task ?? selectedTimesheet.tasks ?? "",
                remarks: selectedTimesheet.remarks ?? "",
            };
            try {
                await tlPut(`/api/tl/attendance/timesheets/${selectedTimesheet.id}`, payload);
            } catch {
                await tlPut(`/api/admin/attendance/timesheets/${selectedTimesheet.id}`, payload);
            }

            alert("Timesheet updated successfully!");
            setSelectedTimesheet(null);
            fetchTeamTimesheets();
        } catch (e) {
            console.error(e);
            alert("Failed to update timesheet");
        }
    };

    // -------------------- EFFECTS --------------------
    useEffect(() => {
        if (isTabAllowed(activeTab)) return;
        const firstAllowedTab = visibleTabs[0]?.id || "dashboard";
        setActiveTab(firstAllowedTab);
    }, [activeTab, visibleTabs]);

    useEffect(() => {
        fetchTeamEmployees();
        fetchTeamStats();
        fetchTeamTimesheets();
        fetchLeaveRequests();
        fetchHolidayList(currentMonth, currentYear);

        const intervalId = setInterval(() => {
            fetchTeamEmployees();
            fetchTeamStats();
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
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
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
    }, [
        employees,
        searchQuery,
        filterDepartment,
        filterStatus,
        filterLocation,
        selectedDepartment,
    ]);

    const clearFilters = () => {
        setSearchQuery("");
        setFilterDepartment("All Departments");
        setFilterStatus("All Statuses");
        setFilterLocation("All Locations");
    };

    // -------------------- CALENDAR HELPERS --------------------
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const calendarYearOptions = Array.from({ length: 21 }, (_, index) => new Date().getFullYear() - 10 + index);

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
        if (!selectedEmployee) return alert("No employee selected.");
        if (!attendanceForm.startDate) return alert("Please select start date.");
        try {
            setAssignSaving(true);
            await assignAttendanceApi();
            alert("Attendance assigned.");
            setShowAssignModal(false);
            setSelectedEmployee(null);
            fetchTeamEmployees();
            fetchTeamStats();
        } catch (e) {
            console.error(e);
            alert("Failed to assign attendance");
        } finally {
            setAssignSaving(false);
        }
    };

    const openAssignLeaveFor = (employee) => {
        setAssignLeaveEmployee(employee);
        setAssignLeaveForm({
            startDate: "",
            endDate: "",
            leaveType: "LEAVE",
            reason: "Leave assigned by TL",
        });
        setShowAssignLeaveModal(true);
    };

    const handleAssignLeaveSubmit = async () => {
        if (!assignLeaveEmployee) return alert("No employee selected.");
        if (!assignLeaveForm.startDate) return alert("Please select start date.");
        try {
            setAssignLeaveSaving(true);
            await assignLeaveApi();
            alert("Leave assigned successfully.");
            setShowAssignLeaveModal(false);
            setAssignLeaveEmployee(null);
            fetchTeamEmployees();
            fetchTeamStats();
            fetchLeaveRequests();
        } catch (e) {
            console.error(e);
            alert("Failed to assign leave");
        } finally {
            setAssignLeaveSaving(false);
        }
    };

    // -------------------- UI RENDER --------------------
    const renderDashboard = () => (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
                    Real-Time Team Attendance Overview
                </h2>
                {statsLoading && <span className="text-[10px] text-gray-500">Refreshing…</span>}
            </div>

            {statsError && <p className="text-xs text-red-500 mb-2">{statsError}</p>}

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                    <div className="text-2xl font-bold text-[#00008B]">{stats.totalEmployees}</div>
                    <div className="text-xs mt-1 text-[#00008B] font-medium">Team Members</div>
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
                    <div className="text-[11px] text-slate-500 mt-1">Team requests only</div>
                </div>
            </div>
        </div>
    );

    const renderEmployeeList = () => (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
                            Employee Live List (Team Only)
                        </h2>
                        <span className="flex items-center gap-1 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {employeesLoading
                            ? "Loading employees..."
                            : `Currently showing ${filteredEmployees.length} of ${employees.length} team members • Auto-refresh 30s`}
                    </p>
                    {employeesError && <p className="text-xs text-red-500 mt-1">{employeesError}</p>}
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
                        {[...new Set(employees.map((e) => e.department))].map((d) => (
                            <option key={d}>{d}</option>
                        ))}
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
                        {[...new Set(employees.map((e) => e.location))].map((l) => (
                            <option key={l}>{l}</option>
                        ))}
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
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[#00008B]">{emp.name}</span>
                                            <span className="text-xs text-gray-500">{emp.email}</span>
                                            <span className="text-xs text-gray-400">ID: {emp.id}</span>
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
                                        <div className="flex gap-2">
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
                <span>
                    Showing {filteredEmployees.length} of {employees.length} employees
                </span>
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
                    {holidaysLoading && <span className="text-xs text-gray-500">Syncing holidays...</span>}
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

    const renderTimesheetView = () => (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
                        Timesheets (Team) ({timesheets.length})
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Review and update team timesheets</p>
                    {timesheetsError && <p className="text-sm text-red-500 mt-1">{timesheetsError}</p>}
                </div>

                <button
                    onClick={fetchTeamTimesheets}
                    disabled={timesheetsLoading}
                    className="px-6 py-2 text-sm bg-[#00008B] text-white rounded-xl hover:bg-blue-900 disabled:opacity-50"
                >
                    {timesheetsLoading ? "⟳ Loading..." : "⟳ Refresh"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">ID</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Employee</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Task</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Remarks</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {timesheetsLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Loading timesheets...
                                </td>
                            </tr>
                        ) : timesheets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No timesheets found
                                </td>
                            </tr>
                        ) : (
                            timesheets.map((t) => (
                                <tr key={t.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-[#00008B]">{t.id}</td>
                                    <td className="px-6 py-4 text-black">{t.employeeName || t.employeeId}</td>
                                    <td className="px-6 py-4 text-black">{t.task || t.tasks || "-"}</td>
                                    <td className="px-6 py-4 text-black">{t.remarks || "-"}</td>
                                    <td className="px-6 py-4 font-semibold text-[#00008B]">
                                        {formatDateOnly(t.submittedAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() =>
                                                setSelectedTimesheet({
                                                    ...t,
                                                    // unify to single field for editing UI
                                                    task: t.task ?? t.tasks ?? "",
                                                })
                                            }
                                            className="px-4 py-2 text-xs bg-[#00008B] text-white rounded-lg hover:bg-blue-900"
                                        >
                                            View/Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                    <input
                                        type="text"
                                        value={selectedTimesheet.employeeName || selectedTimesheet.employeeId}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                                    <input
                                        type="text"
                                        value={formatDateOnly(selectedTimesheet.submittedAt)}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
                                <input
                                    type="text"
                                    value={selectedTimesheet.task || ""}
                                    onChange={(e) =>
                                        setSelectedTimesheet((prev) => ({ ...prev, task: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <textarea
                                    rows={4}
                                    value={selectedTimesheet.remarks || ""}
                                    onChange={(e) =>
                                        setSelectedTimesheet((prev) => ({ ...prev, remarks: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#00008B]"
                                    placeholder="Enter remarks..."
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

    const renderLeaveManagement = () => (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: primaryBlue }}>
                        Leave Management (Team)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Approve / reject leave requests for your team members.
                    </p>
                    {leaveError && <p className="text-xs text-red-500 mt-1">{leaveError}</p>}
                </div>

                <button
                    onClick={fetchLeaveRequests}
                    disabled={leaveLoading}
                    className="px-5 py-2 text-sm bg-[#00008B] text-white rounded-xl hover:bg-blue-900 disabled:opacity-50"
                >
                    {leaveLoading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Request ID</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Employee</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Start</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">End</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {leaveLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    Loading leave requests...
                                </td>
                            </tr>
                        ) : leaveRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    No leave requests found
                                </td>
                            </tr>
                        ) : (
                            leaveRequests.map((r) => (
                                <tr key={r.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-[#00008B]">{r.id}</td>
                                    <td className="px-6 py-4 text-black">{r.employeeName || r.employeeId}</td>
                                    <td className="px-6 py-4 text-black">{r.leaveType || "-"}</td>
                                    <td className="px-6 py-4 text-black">{formatDateOnly(r.startDate)}</td>
                                    <td className="px-6 py-4 text-black">{formatDateOnly(r.endDate)}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                            {r.status || "PENDING"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                                                onClick={async () => {
                                                    try {
                                                        await approveLeave(r.id);
                                                        fetchLeaveRequests();
                                                        fetchTeamStats();
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Approve failed");
                                                    }
                                                }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                                                onClick={async () => {
                                                    try {
                                                        await rejectLeave(r.id);
                                                        fetchLeaveRequests();
                                                        fetchTeamStats();
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Reject failed");
                                                    }
                                                }}
                                            >
                                                Reject
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
    );

    const renderReportsContent = () => {
        if (reportSubTab === "overview") {
            return (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2" style={{ color: primaryBlue }}>
                            Team Summary Reports
                        </h3>
                        <p className="text-xs text-gray-500">
                            High-level attendance overview for your team only.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-semibold mb-2" style={{ color: primaryBlue }}>
                            Trend Analysis
                        </h3>
                        <p className="text-xs text-gray-500">
                            Track absenteeism and late arrivals trend for your team.
                        </p>
                    </div>
                </div>
            );
        }

        if (reportSubTab === "custom")
            return (
                <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
                    Build custom team reports with filters and export options.
                </div>
            );

        if (reportSubTab === "automated")
            return (
                <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
                    Configure automated team reports (weekly/monthly).
                </div>
            );

        if (reportSubTab === "export")
            return (
                <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
                    Export team attendance data in CSV/XLSX/PDF.
                </div>
            );

        return null;
    };

    const renderSettingsContent = () => {
        // TL settings are typically view-only (no admin policy edits)
        if (settingsSubTab === "attendance-rules") {
            return (
                <div className="mt-4 space-y-3">
                    {[
                        {
                            title: "Late Check-in Grace Period",
                            desc: "Grace period rule (company policy). TL can view only.",
                            enabled: true,
                        },
                        {
                            title: "Auto Punch Out",
                            desc: "Auto punch-out policy (company policy). TL can view only.",
                            enabled: true,
                        },
                        {
                            title: "Break Time Enforcement",
                            desc: "Break rules (company policy). TL can view only.",
                            enabled: false,
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

                            <span className="text-[11px] text-gray-400">View only</span>
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
                        <div className="text-xs text-gray-500">Company configured time zone (View only)</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-[#00008B] mb-2">Notifications</h4>
                        <div className="text-xs text-gray-500">TL notifications preferences (optional)</div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-sm text-gray-600">
                Settings are view-only for TL role.
            </div>
        );
    };

    const renderTabContent = () => {
        if (activeTab === "employee") return renderEmployeeList();
        if (activeTab === "calendar") return renderCalendarView();
        if (activeTab === "leave") return renderLeaveManagement();
        if (activeTab === "assign") return renderEmployeeList(); // actions available inside Employee List
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

        return renderDashboard();
    };

    return (
        <div className="min-h-screen px-4 md:px-6 py-4">
            {/* Header */}
            <div
                className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"
                style={{ backgroundColor: primaryBlue }}
            >
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">TL Attendance Dashboard</h1>
                    <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
                        Monitor team attendance, manage team leave, assign corrections, review timesheets, and view reports.
                    </p>
                </div>

                <button
                    onClick={() => {
                        fetchTeamEmployees();
                        fetchTeamStats();
                        fetchTeamTimesheets();
                        fetchLeaveRequests();
                    }}
                    disabled={employeesLoading || statsLoading || timesheetsLoading || leaveLoading}
                    className="text-xs px-3 py-2 rounded-full bg-white/10 text-white border border-white/30 hover:bg-white/20 disabled:opacity-50"
                >
                    {employeesLoading || statsLoading || timesheetsLoading || leaveLoading
                        ? "⟳ Refreshing..."
                        : "⟳ Refresh Data"}
                </button>
            </div>

            {/* Top quick stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-xl font-bold text-[#00008B]">{stats.totalEmployees}</div>
                    <div className="text-xs mt-1 text-gray-500">Team Members</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-xl font-bold text-green-600">{stats.presentToday}</div>
                    <div className="text-xs mt-1 text-gray-500">Present Today</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-600">On Leave: {stats.onLeave}</div>
                    <div className="text-xs mt-1 text-gray-500">Approved / Scheduled</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-xl font-bold text-red-600">{stats.pendingRequests}</div>
                    <div className="text-xs mt-1 text-gray-500">Pending Requests</div>
                </div>
            </div>

            {/* Department switch */}
            <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm text-xs">
                    <span className="text-gray-500">Department:</span>
                    <select
                        className="bg-transparent text-[#00008B] text-xs outline-none"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="All">All</option>
                        {[...new Set(employees.map((e) => e.department))]
                            .filter(Boolean)
                            .map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-2">
                <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 rounded-t-lg border-b-2 flex flex-col items-start min-w-[120px] ${activeTab === tab.id ? "border-[#00008B] bg-blue-50" : "border-transparent hover:bg-gray-50"
                                }`}
                        >
                            <span
                                className={`text-[11px] font-semibold ${activeTab === tab.id ? "text-[#00008B]" : "text-gray-600"
                                    }`}
                            >
                                {tab.title}
                            </span>
                            <span className="text-[10px] text-gray-400">{tab.sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            {renderTabContent()}

            {/* Assign Attendance Modal */}
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
                            Assign Attendance (Team)
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Employee: <span className="font-medium">{selectedEmployee.name}</span> • ID:{" "}
                            <span className="font-medium">{selectedEmployee.id}</span>
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select
                                    value={attendanceForm.status}
                                    onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value }))}
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
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={attendanceForm.startDate}
                                        onChange={(e) => setAttendanceForm((p) => ({ ...p, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={attendanceForm.endDate}
                                        onChange={(e) => setAttendanceForm((p) => ({ ...p, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Reason (optional)</label>
                                <textarea
                                    rows={3}
                                    value={attendanceForm.reason}
                                    onChange={(e) => setAttendanceForm((p) => ({ ...p, reason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none resize-none"
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

            {/* Assign Leave Modal */}
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
                            Assign Leave (Team)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Employee: <span className="font-medium">{assignLeaveEmployee.name}</span> • ID:{" "}
                            <span className="font-medium">{assignLeaveEmployee.id}</span>
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Leave Type</label>
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
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
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
                                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={assignLeaveForm.endDate}
                                    onChange={(e) =>
                                        setAssignLeaveForm((p) => ({ ...p, endDate: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={assignLeaveForm.reason}
                                    onChange={(e) =>
                                        setAssignLeaveForm((p) => ({ ...p, reason: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#00008B] outline-none"
                                    placeholder="Reason"
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
}
