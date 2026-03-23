import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  Clock3,
  Coffee,
  Pencil,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  X,
  Users,
} from "lucide-react";
import {
  HOLIDAY_UPDATE_EVENT,
  createHoliday,
  deleteHolidayFile,
  fetchHolidays,
  fetchHolidayFiles,
  updateHoliday,
  uploadHolidayFile,
  emitHolidayUpdatedEvent,
} from "../../../lib/holidaysApi";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const resolveFileUrl = (path) => {
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
      const user = JSON.parse(localStorage.getItem("user"));
      return {
        tenantCode: tenantCode || user?.tenantCode || user?.tenant_code || "",
        companyId: companyId || user?.companyId || user?.company_id || "",
      };
    } catch {
      return { tenantCode, companyId };
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

const tenantQueryString = () => {
  const { tenantCode, companyId } = getTenantContext();
  const params = new URLSearchParams();
  if (tenantCode) params.append("tenantCode", tenantCode);
  if (companyId) params.append("companyId", companyId);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const unwrapData = (payload) => payload?.data || payload || {};

const isLeaveLikeValue = (value) => String(value || "").toUpperCase().includes("LEAVE");

const normalizeLeaveAwareStatus = (statusValue, leaveTypeValue) => {
  const status = statusValue ?? "Unknown";
  const leaveType = leaveTypeValue ?? "";
  if (isLeaveLikeValue(status) && isLeaveLikeValue(leaveType)) {
    return leaveType;
  }
  return status;
};

const formatStatusLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const normalizeLiveRow = (employee) => ({
  status: normalizeLeaveAwareStatus(
    employee?.status ?? employee?.attendanceStatus ?? "Unknown",
    employee?.leaveType ?? employee?.leave_type ?? employee?.type ?? ""
  ),
  id: employee?.id ?? employee?.employeeId ?? employee?.userId ?? null,
  name:
    employee?.name ??
    employee?.fullName ??
    employee?.employeeName ??
    employee?.username ??
    "Unknown",
  email: employee?.email ?? employee?.mailId ?? "-",
  department:
    employee?.department ?? employee?.departmentName ?? employee?.dept ?? "Not Assigned",
  location: employee?.location ?? employee?.officeLocation ?? "Not Set",
  leaveType: employee?.leaveType ?? employee?.leave_type ?? employee?.type ?? "",
  punchIn: employee?.punchIn ?? employee?.inTime ?? employee?.checkIn ?? null,
  hours: employee?.hours ?? employee?.totalHours ?? employee?.workDuration ?? "-",
});

const normalizeLiveList = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeLiveRow);
  if (Array.isArray(payload?.data)) return payload.data.map(normalizeLiveRow);
  if (Array.isArray(payload?.content)) return payload.content.map(normalizeLiveRow);
  if (Array.isArray(payload?.employees)) return payload.employees.map(normalizeLiveRow);
  if (Array.isArray(payload?.users)) return payload.users.map(normalizeLiveRow);
  return [];
};

const getStatusCount = (rows, keyword) =>
  rows.filter((row) => String(row.status || "").toUpperCase().includes(keyword)).length;

const buildStats = (statsPayload, liveRows) => {
  const stats = unwrapData(statsPayload);
  const presentFallback = getStatusCount(liveRows, "PRESENT");
  const breakFallback = getStatusCount(liveRows, "BREAK");
  const leaveFallback = getStatusCount(liveRows, "LEAVE");
  const absentFallback = getStatusCount(liveRows, "ABSENT");

  const totalEmployees =
    Number(stats?.totalEmployees) ||
    Number(stats?.employeeCount) ||
    liveRows.length ||
    0;

  const presentToday =
    Number(stats?.presentToday) ||
    Number(stats?.presentCount) ||
    presentFallback;

  const onLeave =
    Number(stats?.onLeave) ||
    Number(stats?.leaveCount) ||
    leaveFallback;

  const onBreak =
    Number(stats?.onBreak) ||
    Number(stats?.breakCount) ||
    breakFallback;

  const absentToday =
    Number(stats?.absentToday) ||
    Number(stats?.absentCount) ||
    absentFallback;

  const lateToday = Number(stats?.lateToday) || Number(stats?.lateCount) || 0;

  const workingNow =
    Number(stats?.workingNow) ||
    Math.max(0, presentToday - onBreak);

  return {
    totalEmployees,
    presentToday,
    absentToday,
    onLeave,
    onBreak,
    lateToday,
    workingNow,
  };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const statusBadgeClass = (status) => {
  const value = String(status || "").toUpperCase();
  if (value.includes("PRESENT") || value.includes("WORKING")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (value.includes("BREAK")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (value.includes("LEAVE")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (value.includes("ABSENT")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseHolidayTags = (tagsText) =>
  String(tagsText || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const ALLOWED_HOLIDAY_FILE_EXTENSIONS = new Set(["doc", "docx"]);

const quarterDisplayLabel = (quarter) => {
  if (quarter === "Q1") return "Q1 (Jan - Mar)";
  if (quarter === "Q2") return "Q2 (Apr - Jun)";
  if (quarter === "Q3") return "Q3 (Jul - Sep)";
  if (quarter === "Q4") return "Q4 (Oct - Dec)";
  return quarter;
};

const toEditableNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeQuarterRow = (quarterRow) => {
  const quarter = quarterRow?.quarter ?? quarterRow?.id ?? "";
  return {
    ...quarterRow,
    quarter,
    months: Array.isArray(quarterRow?.months) ? quarterRow.months : [],
    total: Number(quarterRow?.total) || 0,
  };
};

const normalizeEarnedLeavePayload = (payload, fallbackYear) => ({
  year: Number(payload?.year) || fallbackYear,
  yearlyTotal: Number(payload?.yearlyTotal) || 0,
  quarters: Array.isArray(payload?.quarters) ? payload.quarters.map(normalizeQuarterRow) : [],
});

function StatCard({ title, value, subtitle, icon: Icon, iconClassName = "" }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function SuperAttendance() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [liveRows, setLiveRows] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    onBreak: 0,
    lateToday: 0,
    workingNow: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [earnedLeaveYear, setEarnedLeaveYear] = useState(currentYear);
  const [earnedLeaveLoading, setEarnedLeaveLoading] = useState(false);
  const [earnedLeaveSaving, setEarnedLeaveSaving] = useState(false);
  const [earnedLeaveError, setEarnedLeaveError] = useState("");
  const [editingQuarter, setEditingQuarter] = useState("");
  const [editingQuarterValues, setEditingQuarterValues] = useState({});
  const [earnedLeaveSettings, setEarnedLeaveSettings] = useState({
    year: currentYear,
    yearlyTotal: 0,
    quarters: [],
  });
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const holidayFileInputRef = useRef(null);
  const [holidayFiles, setHolidayFiles] = useState([]);
  const [holidayFilesLoading, setHolidayFilesLoading] = useState(false);
  const [holidayFileUploading, setHolidayFileUploading] = useState(false);
  const [holidayFileError, setHolidayFileError] = useState("");
  const [holidayFileSuccess, setHolidayFileSuccess] = useState("");
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayFormError, setHolidayFormError] = useState("");
  const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
  const [assignLeaveEmployee, setAssignLeaveEmployee] = useState(null);
  const [assignLeaveSaving, setAssignLeaveSaving] = useState(false);
  const [assignLeaveError, setAssignLeaveError] = useState("");
  const [assignLeaveForm, setAssignLeaveForm] = useState({
    leaveType: "LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [holidayForm, setHolidayForm] = useState({
    id: "",
    name: "",
    date: toDateInputValue(new Date()),
    tagsText: "",
  });

  const upcomingHolidays = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;

    return holidays
      .map((holiday) => {
        const occurrence = new Date(`${holiday.date}T00:00:00`);
        if (Number.isNaN(occurrence.getTime())) return null;
        const diffDays = Math.ceil((occurrence - startOfToday) / dayMs);
        return {
          ...holiday,
          occurrence,
          daysLeft: diffDays,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.occurrence - b.occurrence);
  }, [holidays]);

  const statusOptions = useMemo(() => {
    const unique = new Set(["ALL"]);
    liveRows.forEach((row) => unique.add(String(row.status || "Unknown")));
    return [...unique];
  }, [liveRows]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return liveRows.filter((row) => {
      const matchesSearch =
        !query ||
        String(row.name || "").toLowerCase().includes(query) ||
        String(row.email || "").toLowerCase().includes(query) ||
        String(row.department || "").toLowerCase().includes(query) ||
        String(row.location || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(row.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [liveRows, searchQuery, statusFilter]);

  const loadAttendanceDashboard = async (isManualRefresh = false) => {
    try {
      setError("");
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
      const suffix = tenantQueryString();
      const headers = {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...tenantHeaders(),
      };

      const [statsResult, liveResult, liveAliasResult] = await Promise.allSettled([
        fetch(`${base}/api/admin/attendance/dashboard-stats${suffix}`, {
          method: "GET",
          headers,
        }),
        fetch(`${base}/api/admin/attendance/live${suffix}`, {
          method: "GET",
          headers,
        }),
        fetch(`${base}/api/admin/attendance/live-employees${suffix}`, {
          method: "GET",
          headers,
        }),
      ]);

      let statsPayload = {};
      let livePayload = [];

      if (statsResult.status === "fulfilled" && statsResult.value.ok) {
        statsPayload = await statsResult.value.json();
      }

      if (liveResult.status === "fulfilled" && liveResult.value.ok) {
        livePayload = await liveResult.value.json();
      } else if (liveAliasResult.status === "fulfilled" && liveAliasResult.value.ok) {
        livePayload = await liveAliasResult.value.json();
      }

      const normalizedLive = normalizeLiveList(unwrapData(livePayload));
      setLiveRows(normalizedLive);
      setStats(buildStats(statsPayload, normalizedLive));
      setLastUpdated(new Date().toISOString());

      const statsFailed =
        statsResult.status === "rejected" ||
        (statsResult.status === "fulfilled" && !statsResult.value.ok);
      const liveFailed =
        liveResult.status === "rejected" ||
        (liveResult.status === "fulfilled" && !liveResult.value.ok);
      const liveAliasFailed =
        liveAliasResult.status === "rejected" ||
        (liveAliasResult.status === "fulfilled" && !liveAliasResult.value.ok);

      if (statsFailed && liveFailed && liveAliasFailed) {
        throw new Error("Unable to fetch attendance data");
      }
    } catch (err) {
      console.error("Super attendance load error:", err);
      setError(err.message || "Failed to load attendance dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHolidayUpdates = async () => {
    try {
      setHolidaysLoading(true);
      const list = await fetchHolidays();
      setHolidays(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Holiday fetch error:", err);
    } finally {
      setHolidaysLoading(false);
    }
  };

  const loadHolidayFiles = async () => {
    try {
      setHolidayFilesLoading(true);
      const list = await fetchHolidayFiles();
      setHolidayFiles(Array.isArray(list) ? list : []);
    } catch (err) {
      setHolidayFileError(err.message || "Failed to fetch uploaded files.");
    } finally {
      setHolidayFilesLoading(false);
    }
  };

  const handleHolidayFileUploadClick = () => {
    setHolidayFileError("");
    setHolidayFileSuccess("");
    if (holidayFileInputRef.current) {
      holidayFileInputRef.current.click();
    }
  };

  const handleHolidayFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = String(file.name || "").split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_HOLIDAY_FILE_EXTENSIONS.has(extension)) {
      setHolidayFileError("Invalid file type. Only DOC and DOCX are allowed.");
      event.target.value = "";
      return;
    }

    try {
      setHolidayFileUploading(true);
      setHolidayFileError("");
      setHolidayFileSuccess("");

      const result = await uploadHolidayFile(file);
      const uploaded = result?.file ?? result;
      if (uploaded?.id) {
        setHolidayFiles((prev) => [uploaded, ...prev.filter((item) => item.id !== uploaded.id)]);
      }

      const importedCount = Number(result?.importedCount) || 0;
      const duplicateCount = Number(result?.duplicateCount) || 0;
      let successMessage = "File uploaded successfully.";
      if (importedCount > 0) {
        successMessage += ` ${importedCount} holidays imported.`;
      } else {
        successMessage += " No holiday rows detected for auto-import.";
      }
      if (duplicateCount > 0) {
        successMessage += ` ${duplicateCount} duplicate holidays skipped.`;
      }
      setHolidayFileSuccess(successMessage);

      emitHolidayUpdatedEvent();
      await Promise.all([loadHolidayFiles(), loadHolidayUpdates()]);
    } catch (err) {
      setHolidayFileError(err.message || "Failed to upload file.");
    } finally {
      setHolidayFileUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteHolidayFile = async (fileId) => {
    const ok = window.confirm("Delete this holiday file?");
    if (!ok) return;
    try {
      setHolidayFileError("");
      setHolidayFileSuccess("");
      setHolidayFiles((prev) => prev.filter((item) => item.id !== fileId));
      await deleteHolidayFile(fileId);
      setHolidayFileSuccess("File deleted successfully.");
      emitHolidayUpdatedEvent();
      await Promise.all([loadHolidayFiles(), loadHolidayUpdates()]);
    } catch (err) {
      setHolidayFileError(err.message || "Failed to delete file.");
      await loadHolidayFiles();
    }
  };

  const loadEarnedLeaveSettings = async (year = earnedLeaveYear) => {
    try {
      setEarnedLeaveLoading(true);
      setEarnedLeaveError("");

      const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
      const headers = {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...tenantHeaders(),
      };

      const response = await fetch(
        `${base}/api/admin/attendance/earned-leave-settings?year=${encodeURIComponent(year)}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to fetch earned leave settings.");
      }

      const payload = unwrapData(await response.json());
      setEarnedLeaveSettings(normalizeEarnedLeavePayload(payload, year));
    } catch (err) {
      setEarnedLeaveError(err.message || "Failed to fetch earned leave settings.");
    } finally {
      setEarnedLeaveLoading(false);
    }
  };

  const startQuarterEdit = (quarterRow) => {
    const draft = {};
    (quarterRow?.months || []).forEach((month) => {
      draft[month.month] = toEditableNumber(month.value);
    });
    setEditingQuarterValues(draft);
    setEditingQuarter(quarterRow?.quarter || "");
    setEarnedLeaveError("");
  };

  const cancelQuarterEdit = () => {
    setEditingQuarter("");
    setEditingQuarterValues({});
  };

  const saveQuarterEdit = async () => {
    if (!editingQuarter) return;
    try {
      setEarnedLeaveSaving(true);
      setEarnedLeaveError("");

      const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
      const headers = {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...tenantHeaders(),
      };

      const monthValues = {};
      Object.entries(editingQuarterValues).forEach(([month, value]) => {
        monthValues[String(month)] = Number.isFinite(Number(value)) ? Number(value) : 0;
      });

      const response = await fetch(`${base}/api/admin/attendance/earned-leave-settings/quarter`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          year: earnedLeaveYear,
          quarter: editingQuarter,
          monthValues,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to update quarter.");
      }

      const payload = unwrapData(await response.json());
      setEarnedLeaveSettings(normalizeEarnedLeavePayload(payload, earnedLeaveYear));
      cancelQuarterEdit();
    } catch (err) {
      setEarnedLeaveError(err.message || "Failed to update quarter.");
    } finally {
      setEarnedLeaveSaving(false);
    }
  };

  useEffect(() => {
    loadAttendanceDashboard(false);
    loadHolidayUpdates();
    loadHolidayFiles();
  }, []);

  useEffect(() => {
    setEditingQuarter("");
    setEditingQuarterValues({});
    loadEarnedLeaveSettings(earnedLeaveYear);
  }, [earnedLeaveYear]);

  useEffect(() => {
    const onHolidayUpdated = () => {
      loadHolidayUpdates();
      loadHolidayFiles();
    };

    window.addEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdated);
    const intervalId = window.setInterval(() => {
      loadHolidayUpdates();
      loadHolidayFiles();
    }, 60000);

    return () => {
      window.removeEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdated);
      window.clearInterval(intervalId);
    };
  }, []);

  const resetHolidayForm = () => {
    setHolidayForm({
      id: "",
      name: "",
      date: toDateInputValue(new Date()),
      tagsText: "",
    });
    setHolidayFormError("");
  };

  const handleOpenAddHoliday = () => {
    resetHolidayForm();
    setShowHolidayModal(true);
  };

  const handleOpenEditHoliday = (holiday) => {
    setHolidayForm({
      id: holiday.id,
      name: holiday.name,
      date: holiday.date,
      tagsText: (holiday.tags || []).join(", "),
    });
    setHolidayFormError("");
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = async (event) => {
    event.preventDefault();
    const name = holidayForm.name.trim();
    const date = holidayForm.date;
    const tags = parseHolidayTags(holidayForm.tagsText);

    if (!name) {
      setHolidayFormError("Holiday name is required.");
      return;
    }
    if (!date) {
      setHolidayFormError("Holiday date is required.");
      return;
    }

    const payload = {
      name,
      date,
      tags: tags.length ? tags : ["Company"],
    };

    try {
      if (holidayForm.id) {
        await updateHoliday(holidayForm.id, payload);
      } else {
        await createHoliday(payload);
      }

      emitHolidayUpdatedEvent();
      await loadHolidayUpdates();
      setShowHolidayModal(false);
      resetHolidayForm();
    } catch (err) {
      setHolidayFormError(err.message || "Failed to save holiday.");
    }
  };

  const openAssignLeaveFor = (employee) => {
    if (!employee?.id) return;
    setAssignLeaveEmployee(employee);
    setAssignLeaveForm({
      leaveType: "LEAVE",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setAssignLeaveError("");
    setShowAssignLeaveModal(true);
  };

  const closeAssignLeaveModal = () => {
    setShowAssignLeaveModal(false);
    setAssignLeaveEmployee(null);
    setAssignLeaveSaving(false);
    setAssignLeaveError("");
    setAssignLeaveForm({
      leaveType: "LEAVE",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const assignLeaveApi = async () => {
    if (!assignLeaveEmployee?.id) {
      throw new Error("No employee selected.");
    }

    const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
    const suffix = tenantQueryString();
    const headers = {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...tenantHeaders(),
    };

    const payload = {
      leaveType: assignLeaveForm.leaveType || "LEAVE",
      startDate: assignLeaveForm.startDate,
      endDate: assignLeaveForm.endDate || assignLeaveForm.startDate,
      reason: assignLeaveForm.reason?.trim() || "Leave assigned manually by super admin",
    };

    const response = await fetch(
      `${base}/api/admin/attendance/apply-manual-attendance/${encodeURIComponent(assignLeaveEmployee.id)}${suffix}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(raw || "Failed to assign leave.");
    }
  };

  const handleAssignLeaveSubmit = async () => {
    if (!assignLeaveEmployee?.id) {
      setAssignLeaveError("No employee selected.");
      return;
    }
    if (!assignLeaveForm.startDate) {
      setAssignLeaveError("Please select a start date.");
      return;
    }

    try {
      setAssignLeaveSaving(true);
      setAssignLeaveError("");
      await assignLeaveApi();
      closeAssignLeaveModal();
      await loadAttendanceDashboard(false);
    } catch (err) {
      setAssignLeaveError(err.message || "Failed to assign leave.");
    } finally {
      setAssignLeaveSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-[#F9FAFF] text-black">
      <div
        className="rounded-2xl px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 shadow-sm"
        style={{ backgroundColor: "#00008B" }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Super Admin Attendance Dashboard</h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl">
            Track real-time attendance across your organization, monitor exceptions, and inspect employee status quickly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAttendanceDashboard(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 text-white px-3 py-2 text-xs md:text-sm border border-white/30 transition"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/super-admin/employees")}
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#011A8B] px-3 py-2 text-xs md:text-sm font-semibold hover:bg-blue-50 transition"
          >
            <Users className="h-4 w-4" />
            Manage Employees
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          subtitle="In scope for attendance"
          icon={Users}
          iconClassName="text-[#011A8B]"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          subtitle={`${stats.workingNow} currently working`}
          icon={UserCheck}
          iconClassName="text-emerald-600"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          subtitle={`${stats.onLeave} on leave`}
          icon={UserX}
          iconClassName="text-rose-600"
        />
        <StatCard
          title="On Break"
          value={stats.onBreak}
          subtitle={`${stats.lateToday} late check-ins`}
          icon={Coffee}
          iconClassName="text-amber-600"
        />
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-4 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-900">Earned Leave Settings</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure monthly earned leave values by quarter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={earnedLeaveYear}
              onChange={(event) => setEarnedLeaveYear(Number(event.target.value) || currentYear)}
              className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
            />
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Yearly Total: {Number(earnedLeaveSettings.yearlyTotal || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {earnedLeaveError && (
          <div className="px-4 pt-3 text-xs text-red-600">{earnedLeaveError}</div>
        )}

        {earnedLeaveLoading ? (
          <div className="px-5 py-5 text-sm text-slate-500">Loading earned leave settings...</div>
        ) : (
          <div className="p-4 grid gap-4 md:grid-cols-2">
            {earnedLeaveSettings.quarters.map((quarterRow) => {
              const isEditing = editingQuarter === quarterRow.quarter;
              return (
                <div
                  key={quarterRow.quarter}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#011A8B]">
                      {quarterDisplayLabel(quarterRow.quarter)}
                    </h3>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startQuarterEdit(quarterRow)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cancelQuarterEdit}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveQuarterEdit}
                          disabled={earnedLeaveSaving}
                          className="rounded-lg bg-[#011A8B] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#00146d] transition disabled:opacity-60"
                        >
                          {earnedLeaveSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(quarterRow.months || []).map((monthRow) => (
                      <div key={`${quarterRow.quarter}-${monthRow.month}`} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-600">{monthRow.monthName}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editingQuarterValues[monthRow.month] ?? 0}
                            onChange={(event) =>
                              setEditingQuarterValues((prev) => ({
                                ...prev,
                                [monthRow.month]: Number(event.target.value),
                              }))
                            }
                            className="h-8 w-24 rounded-md border border-slate-300 px-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-slate-800">
                            {Number(monthRow.value || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Quarter Total</span>
                    <span className="text-sm font-bold text-[#011A8B]">
                      {Number(quarterRow.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#011A8B]" />
              Holidays Update
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upcoming company and national holidays.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <input
              ref={holidayFileInputRef}
              type="file"
              accept=".doc,.docx"
              onChange={handleHolidayFileSelect}
              className="hidden"
            />
            <span className="text-[11px] text-slate-500">
              {holidaysLoading ? "Syncing..." : `${upcomingHolidays.length} listed`}
            </span>
            <button
              type="button"
              onClick={handleHolidayFileUploadClick}
              disabled={holidayFileUploading}
              className="inline-flex items-center gap-1 rounded-lg border border-[#011A8B] px-3 py-1.5 text-[11px] font-semibold text-[#011A8B] hover:bg-blue-50 transition disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {holidayFileUploading ? "Uploading..." : "Upload File"}
            </button>
            <button
              type="button"
              onClick={handleOpenAddHoliday}
              className="inline-flex items-center gap-1 rounded-lg bg-[#011A8B] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#00146d] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Holiday
            </button>
          </div>
        </div>
        <div className="max-h-[440px] overflow-y-auto">
          {(holidayFileError || holidayFileSuccess) && (
            <div className="px-5 pt-3">
              {holidayFileError && <p className="text-xs text-red-600">{holidayFileError}</p>}
              {holidayFileSuccess && <p className="text-xs text-emerald-700">{holidayFileSuccess}</p>}
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {upcomingHolidays.length === 0 && (
              <div className="px-5 py-4 text-xs text-slate-500">
                No holidays configured yet.
              </div>
            )}
            {upcomingHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-[#011A8B]">{holiday.name}</p>
                  <p className="text-xs text-slate-500">
                    {holiday.occurrence.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {holiday.tags.map((tag) => (
                      <span
                        key={`${holiday.id}-${tag}`}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {holiday.daysLeft === 0
                      ? "Today"
                      : holiday.daysLeft > 0
                        ? `${holiday.daysLeft} days left`
                        : `${Math.abs(holiday.daysLeft)} days ago`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditHoliday(holiday)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200">
            <div className="px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Uploaded Holiday Files</h3>
              <span className="text-xs text-slate-500">
                {holidayFilesLoading ? "Loading..." : `${holidayFiles.length} files`}
              </span>
            </div>

            {holidayFilesLoading ? (
              <div className="px-5 pb-4 text-xs text-slate-500">Loading files...</div>
            ) : holidayFiles.length === 0 ? (
              <div className="px-5 pb-4 text-xs text-slate-500">No files uploaded yet.</div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs font-semibold">File Name</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold">Type</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold">Uploaded Date</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold">Uploaded By</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidayFiles.map((file) => (
                      <tr key={file.id} className="border-t border-slate-100">
                        <td className="px-5 py-2 text-xs text-slate-700">
                          {file.originalFileName || file.fileName}
                        </td>
                        <td className="px-5 py-2 text-xs text-slate-700">{file.fileType}</td>
                        <td className="px-5 py-2 text-xs text-slate-700">
                          {file.uploadedAt ? formatDateTime(file.uploadedAt) : "-"}
                        </td>
                        <td className="px-5 py-2 text-xs text-slate-700">{file.uploadedBy || "-"}</td>
                        <td className="px-5 py-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={resolveFileUrl(file.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </a>
                            <a
                              href={resolveFileUrl(file.fileUrl)}
                              download={file.originalFileName || file.fileName}
                              className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteHolidayFile(file.id)}
                              className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHolidayModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {holidayForm.id ? "Edit Holiday" : "Add Holiday"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowHolidayModal(false);
                  resetHolidayForm();
                }}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveHoliday} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Holiday Name</label>
                <input
                  value={holidayForm.name}
                  onChange={(event) =>
                    setHolidayForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Company Foundation Day"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(event) =>
                    setHolidayForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tags</label>
                <input
                  value={holidayForm.tagsText}
                  onChange={(event) =>
                    setHolidayForm((prev) => ({ ...prev, tagsText: event.target.value }))
                  }
                  placeholder="National, Company, Optional"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>

              {holidayFormError && (
                <p className="text-xs text-red-600">{holidayFormError}</p>
              )}

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHolidayModal(false);
                    resetHolidayForm();
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#011A8B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#00146d] transition"
                >
                  {holidayForm.id ? "Update Holiday" : "Save Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignLeaveModal && assignLeaveEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Assign Leave</h3>
              <button
                type="button"
                onClick={closeAssignLeaveModal}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pt-3 text-xs text-slate-500">
              Employee: <span className="font-medium text-slate-700">{assignLeaveEmployee.name}</span>
              {" | "}
              ID: <span className="font-medium text-slate-700">{assignLeaveEmployee.id}</span>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
                <select
                  value={assignLeaveForm.leaveType}
                  onChange={(event) =>
                    setAssignLeaveForm((prev) => ({ ...prev, leaveType: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                >
                  <option value="LEAVE">Leave</option>
                  <option value="EARNED_LEAVE">Earned Leave</option>
                  <option value="SICK_LEAVE">Sick Leave</option>
                  <option value="CASUAL_LEAVE">Casual Leave</option>
                  <option value="WFH">WFH</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={assignLeaveForm.startDate}
                  onChange={(event) =>
                    setAssignLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={assignLeaveForm.endDate}
                  onChange={(event) =>
                    setAssignLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (Optional)</label>
                <textarea
                  rows={2}
                  value={assignLeaveForm.reason}
                  onChange={(event) =>
                    setAssignLeaveForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Add context for this leave assignment"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
                />
              </div>

              {assignLeaveError && <p className="text-xs text-red-600">{assignLeaveError}</p>}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAssignLeaveModal}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignLeaveSubmit}
                disabled={assignLeaveSaving}
                className="rounded-lg bg-[#011A8B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#00146d] transition disabled:opacity-60"
              >
                {assignLeaveSaving ? "Assigning..." : "Assign Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#011A8B]" />
                Live Attendance Feed
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: {lastUpdated ? formatDateTime(lastUpdated) : "-"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, dept..."
                className="h-10 min-w-[220px] rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/20 focus:border-[#011A8B]"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatStatusLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center">
            <Clock3 className="h-5 w-5 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">Loading attendance data...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No attendance records found for the current filters.
          </div>
        ) : (
          <div className="max-h-[440px] overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Punch In</th>
                  <th className="px-4 py-3 text-left font-medium">Hours</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.id || row.email}-${row.name}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.department}</td>
                    <td className="px-4 py-3 text-slate-700">{row.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(row.status)}`}>
                        {formatStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(row.punchIn)}</td>
                    <td className="px-4 py-3 text-slate-700">{row.hours}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openAssignLeaveFor(row)}
                        disabled={!row.id}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Assign Leave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
