import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Clock,
  FileText,
  ArrowRightCircle,
  Activity,
  Briefcase,
  CheckCircle,
  HeartPulse,
  Camera,
  Upload,
  X,
  Check,
} from "lucide-react";
import {
  canAccessProfessionalEmployeeSwitchRoute,
  getVisibleQuickActions,
  hasRouteAccess,
  openUpgradeModal,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const cleanBase = API_BASE_URL.replace(/\/+$/, "");

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const accessContext = resolveAccessContext();

  // ---------------- ROUTE HANDLERS ----------------
  const guardedNavigate = (routeKey, path) => {
    if (canAccessProfessionalEmployeeSwitchRoute(accessContext, routeKey, window.location.pathname)) {
      navigate(path);
      return;
    }

    if (!hasRouteAccess(accessContext.role, accessContext.plan, routeKey)) {
      openUpgradeModal(routeKey, accessContext);
      return;
    }
    navigate(path);
  };
  const handleProfileClick = () => guardedNavigate("home", "/employee/dashboard");
  const handleLeaveClick = () => guardedNavigate("leaveManagement", "/employee/leaves");
  const handlePayslipsClick = () => guardedNavigate("payslip", "/employee/payslip");
  const handleAttendanceClick = () => guardedNavigate("attendance", "/employee/attendance");
  const handleViewReportsClick = () => guardedNavigate("performance", "/employee/performance");
  const visibleQuickActions = getVisibleQuickActions(accessContext.plan, accessContext.role, [
    { id: "applyLeave" },
    { id: "payslip" },
    { id: "attendance" },
    { id: "profile" },
  ]);
  const hasQuickAction = (id) => visibleQuickActions.some((action) => action.id === id);
  const showApplyLeaveAction = hasQuickAction("applyLeave");
  const showPayslipAction = hasQuickAction("payslip");
  const showAttendanceAction = hasQuickAction("attendance");
  const showProfileAction = hasQuickAction("profile");
  const hasVisibleQuickActions =
    showApplyLeaveAction || showPayslipAction || showAttendanceAction || showProfileAction;

  // ---------------- STATE ----------------
  const [employeeName, setEmployeeName] = useState("");
  const [employeePhotoUrl, setEmployeePhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [headerStats, setHeaderStats] = useState({
    todayStatus: null,
    performanceStatus: null,
    thisMonthAttendancePercent: null,
    availableLeave: 24,
    takenLeave: 0,
  });

  const [snapshot, setSnapshot] = useState({
    currentProject: null,
    currentProjectStatus: null,
    projectProgressPercent: null,
    loggedHours: null,
    hoursAboveTarget: null,
    avgHoursPerDay: null,
    pendingItems: [],
  });

  const [_todaysActivity, setTodaysActivity] = useState([]);
  const [_upcomingEvents, setUpcomingEvents] = useState([]);
  const [wellnessHighlights, setWellnessHighlights] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);

  // ---------------- HELPERS ----------------
  const safeUrl = (path) => {
    const cleanPath = path.replace(/^\/+/, "");
    return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
  };

  const formatShortDate = (value) => {
    if (!value) return "--";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return value;
    }
  };

  const formatTime = (value) => {
    if (!value) return "--";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const getActivityPillClasses = (item) => {
    const severity = (item.severity || item.type || "").toUpperCase();
    switch (severity) {
      case "SUCCESS":
      case "ATTENDANCE":
        return "bg-[#EAF9F1] text-[#19724A] border-[#B8EBD1]";
      case "INFO":
      case "UPDATE":
        return "bg-[#E3EBFF] text-[#2952CC] border-[#C2D1FF]";
      case "REMINDER":
        return "bg-[#FFF5E6] text-[#C96A13] border-[#FFE0B8]";
      case "ALERT":
      case "DANGER":
        return "bg-[#FFECEF] text-[#C2273D] border-[#FFC1CD]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    }
  };

  const getEventBadgeClasses = (event) => {
    const status = (event.status || "").toUpperCase();
    if (status.includes("APPROVED")) return "text-[#19724A]";
    if (status.includes("PENDING") || status.includes("REQUESTED"))
      return "text-[#C96A13]";
    if (status.includes("REJECTED")) return "text-[#C2273D]";
    return "text-[#19724A]";
  };

  const _getStatusBadgeClasses = (status) => {
    const s = (status || "").toUpperCase();
    if (s.includes("APPROVED"))
      return "bg-[#EAF9F1] text-[#19724A] border-[#B8EBD1]";
    if (s.includes("PENDING"))
      return "bg-[#FFF5E6] text-[#C96A13] border-[#FFE0B8]";
    if (s.includes("REJECTED"))
      return "bg-[#FFECEF] text-[#C2273D] border-[#FFC1CD]";
    return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear().toString();
    return { month, year };
  };

  const calculateAvailableLeaves = (leaves) => {
    const takenLeaves = leaves.filter((leave) =>
      ["APPROVED"].includes((leave.status || "").toUpperCase())
    ).length;
    return Math.max(0, 24 - takenLeaves);
  };

  // ---------------- PHOTO UPLOAD HANDLERS ----------------
  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      setTimeout(() => setUploadError(""), 3000);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      setTimeout(() => setUploadError(""), 3000);
      return;
    }

    uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setUploadError("User ID not found. Please log in again.");
        setTimeout(() => setUploadError(""), 3000);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("userId", userId);

      console.log("Uploading photo for user:", userId);

      const response = await fetch(safeUrl("/api/users/me/upload-photo"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const photoUrl = data.data.photoUrl;
        setEmployeePhotoUrl(photoUrl);
        setUploadSuccess("Profile photo updated successfully!");
        setTimeout(() => {
          setUploadSuccess("");
          setShowPhotoModal(false);
        }, 2000);
      } else {
        setUploadError(data.message || "Failed to upload photo");
        setTimeout(() => setUploadError(""), 3000);
      }
    } catch (err) {
      setUploadError("Error uploading photo. Please try again.");
      console.error("Upload error:", err);
      setTimeout(() => setUploadError(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?"))
      return;

    setUploading(true);
    setUploadError("");

    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setUploadError("User ID not found. Please log in again.");
        setTimeout(() => setUploadError(""), 3000);
        setUploading(false);
        return;
      }

      const response = await fetch(safeUrl(`/api/users/${userId}/photo`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmployeePhotoUrl("");
        setUploadSuccess("Profile photo deleted successfully!");
        setTimeout(() => {
          setUploadSuccess("");
          setShowPhotoModal(false);
        }, 2000);
      } else {
        setUploadError(data.message || "Failed to delete photo");
        setTimeout(() => setUploadError(""), 3000);
      }
    } catch (err) {
      setUploadError("Error deleting photo. Please try again.");
      console.error("Delete error:", err);
      setTimeout(() => setUploadError(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  // ---------------- FETCH ALL DATA ----------------
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let userId = localStorage.getItem("userId");

        // Recover missing userId from authenticated profile.
        if (!userId && token) {
          try {
            const meRes = await fetch(safeUrl("/api/users/me"), {
              headers: {
                "Content-Type": "application/json",
                Authorization: token.startsWith("Bearer ")
                  ? token
                  : `Bearer ${token}`,
              },
            });

            if (meRes.ok) {
              const meJson = await meRes.json();
              const me = meJson?.data || {};
              const resolvedUserId = me?.id || me?.userId || "";
              if (resolvedUserId) {
                userId = String(resolvedUserId);
                localStorage.setItem("userId", userId);
                if (me?.fullName || me?.name) {
                  localStorage.setItem("employeeName", me?.fullName || me?.name);
                }
              }
            }
          } catch (err) {
            console.warn("Failed to resolve userId from /api/users/me:", err);
          }
        }

        if (!userId) {
          setEmployeeName("Employee");
          setLoadError("User ID not found in session.");
          setLoading(false);
          return;
        }

        const commonHeaders = {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` }
            : {}),
        };

        // 1. Fetch USER data
        try {
          const userEndpoint = safeUrl(`/api/users/${userId}`);
          const userRes = await fetch(userEndpoint, { headers: commonHeaders });

          if (userRes.ok) {
            const userJson = await userRes.json();
            const userData = userJson.data || {};
            const name =
              userData.fullName ||
              userData.name ||
              userData.firstName ||
              "Employee";
            setEmployeeName(name);
            localStorage.setItem("employeeName", name);

            const photo =
              userData.profilePhotoUrl ||
              userData.photoUrl ||
              userData.avatarUrl ||
              "";
            if (photo) setEmployeePhotoUrl(photo);
          }
        } catch (err) {
          console.warn("User fetch failed:", err);
        }

        // 1.5. Fetch PASSPORT PHOTO from documents endpoint (fallback)
        try {
          const passportEndpoint = safeUrl(`/api/documents/my-passport-photo`);
          const passportRes = await fetch(passportEndpoint, {
            headers: commonHeaders,
          });

          if (passportRes.ok) {
            const passportJson = await passportRes.json();
            const passportPhotoUrl = passportJson.data;
            if (passportPhotoUrl && !employeePhotoUrl) {
              setEmployeePhotoUrl(passportPhotoUrl);
            }
          }
        } catch (err) {
          console.warn("Passport photo fetch failed:", err);
        }

        // 2. Fetch MY LEAVES
        try {
          const leavesEndpoint = safeUrl(`/api/leaves/my-leaves`);
          const leavesRes = await fetch(leavesEndpoint, {
            headers: commonHeaders,
          });

          if (leavesRes.ok) {
            const leavesJson = await leavesRes.json();
            const leaves = leavesJson.data || [];
            setMyLeaves(leaves);

            const available = calculateAvailableLeaves(leaves);
            const taken = leaves.filter((leave) =>
              ["APPROVED"].includes((leave.status || "").toUpperCase())
            ).length;

            setHeaderStats((prev) => ({
              ...prev,
              availableLeave: available,
              takenLeave: taken,
            }));
          }
        } catch (err) {
          console.warn("Leaves fetch failed:", err);
          setHeaderStats((prev) => ({ ...prev, availableLeave: 24 }));
        }

        // 3. Fetch DASHBOARD data
        try {
          const dashboardEndpoint = safeUrl(
            `/api/dashboard/employee/${userId}`
          );
          const dashRes = await fetch(dashboardEndpoint, {
            headers: commonHeaders,
          });

          if (dashRes.ok) {
            const dashJson = await dashRes.json();
            const dashboardData = dashJson.data || {};

            setHeaderStats((prev) => ({
              ...prev,
              todayStatus:
                dashboardData.todayStatus ||
                dashboardData.todayAttendance ||
                "No data",
              performanceStatus:
                dashboardData.performance ||
                dashboardData.performanceStatus ||
                "Good",
            }));

            setSnapshot({
              currentProject: dashboardData.currentProject || "No project",
              currentProjectStatus: dashboardData.projectStatus || "Active",
              projectProgressPercent: dashboardData.projectProgress ?? 0,
              loggedHours: dashboardData.loggedHours ?? 0,
              hoursAboveTarget: dashboardData.hoursAboveTarget ?? 0,
              avgHoursPerDay: dashboardData.avgHoursPerDay ?? 0,
              pendingItems: Array.isArray(dashboardData.pendingItems)
                ? dashboardData.pendingItems
                : Number(dashboardData.pendingLeaves || 0) > 0
                  ? [`${dashboardData.pendingLeaves} leave request(s) pending approval`]
                  : [],
            });

            setTodaysActivity(dashboardData.todaysActivity || []);
            setUpcomingEvents(dashboardData.upcomingEvents || []);
            setWellnessHighlights(dashboardData.wellnessHighlights || []);
          }
        } catch (err) {
          console.warn("Dashboard fetch failed:", err);
        }

        // 4. Fetch MONTHLY ATTENDANCE
        try {
          const { month, year } = getCurrentMonthYear();
          const monthlyEndpoint = safeUrl(
            `/api/attendance/monthly?employeeId=${userId}&year=${year}&month=${month}`
          );
          const monthlyRes = await fetch(monthlyEndpoint, {
            headers: commonHeaders,
          });

          if (monthlyRes.ok) {
            const monthlyJson = await monthlyRes.json();
            const monthlyData = monthlyJson.data || {};

            const presentDays = Number(monthlyData.presentDays || 0);
            const totalDays = Number(monthlyData.totalDays || 0);

            let attendancePercent = null;
            if (totalDays > 0) {
              attendancePercent =
                Math.round((presentDays / totalDays) * 1000) / 10;
            }

            setHeaderStats((prev) => ({
              ...prev,
              thisMonthAttendancePercent: attendancePercent,
            }));
          }
        } catch (err) {
          console.warn("Monthly attendance fetch failed:", err);
        }

        // 5. Fetch TODAY'S ATTENDANCE
        try {
          const todayEndpoint = safeUrl(`/api/attendance/today/${userId}`);
          const todayRes = await fetch(todayEndpoint, {
            headers: commonHeaders,
          });

          if (todayRes.ok) {
            const todayJson = await todayRes.json();
            const todayData = todayJson.data || {};
            setHeaderStats((prev) => ({
              ...prev,
              todayStatus:
                todayData.status ||
                todayData.attendanceStatus ||
                prev.todayStatus,
            }));
          }
        } catch (err) {
          console.warn("Today attendance fetch failed:", err);
        }

        setLoadError("");
      } catch (err) {
        console.error("Dashboard load error:", err);
        setLoadError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const displayName = loading ? "..." : employeeName || "Employee";
  const attendancePercent = headerStats.thisMonthAttendancePercent;
  const availableLeave = headerStats.availableLeave;
  const takenLeave = headerStats.takenLeave;
  const { month, year } = getCurrentMonthYear();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFF] flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-[#F9FAFF]">
      {/* PHOTO UPLOAD MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Profile Photo
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-40 w-40 rounded-full border-4 border-gray-200 bg-gray-100 overflow-hidden">
                {employeePhotoUrl ? (
                  <img
                    src={employeePhotoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                {!employeePhotoUrl && (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-20 w-20 text-gray-400" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-white text-sm font-medium">
                      Uploading...
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Upload className="h-4 w-4" />
                  {uploading
                    ? "Uploading..."
                    : employeePhotoUrl
                    ? "Change Photo"
                    : "Upload Photo"}
                </button>

                {employeePhotoUrl && (
                  <button
                    onClick={handleDeletePhoto}
                    disabled={uploading}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <X className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                <Check className="h-4 w-4 flex-shrink-0" />
                {uploadSuccess}
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <X className="h-4 w-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLUE HEADER STRIP */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 shadow-sm"
        style={{ backgroundColor: "#00008B" }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Employee Dashboard
          </h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
            24 leaves allocated per year.{" "}
            {takenLeave > 0 && `${takenLeave} taken, `}
            {availableLeave} remaining.
          </p>
        </div>

        <div className="flex flex-col items-end text-xs md:text-sm text-blue-100">
          {loadError && (
            <span className="text-[10px] text-red-200 text-right">
              {loadError}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-9xl mx-auto px-0 lg:px-1 py-2 md:py-4 space-y-6 md:space-y-8">
        {/* GREETING + QUICK ACTIONS */}
        <section className={`grid grid-cols-1 gap-6 ${hasVisibleQuickActions ? "lg:grid-cols-[2fr,1.2fr]" : ""}`}>
          {/* GREETING CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#E3EBFF]" />
            <div className="relative p-5 md:p-7 flex flex-col justify-between gap-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div
                    onClick={handlePhotoClick}
                    className="relative h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-[#C2D1FF] bg-[#E3EBFF] overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                    {employeePhotoUrl ? (
                      <>
                        <img
                          src={employeePhotoUrl}
                          alt={displayName}
                          className="h-full w-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-8 w-8 md:h-10 md:w-10 text-[#2952CC] flex-shrink-0" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#2952CC]">
                      Welcome back
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-[#0B2A6F]">
                      Hi, {displayName} 👋
                    </h2>
                    {/* <p className="text-sm md:text-base text-gray-600 max-w-xl">
                      {availableLeave > 0
                        ? `You have ${availableLeave} leaves remaining this year (24 total).`
                        : "No leaves remaining this year."}
                    </p> */}
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-1 gap-3 min-w-[220px] text-xs md:text-sm">
                  <div className="rounded-xl border border-gray-200 bg-[#F9FBFF] px-3 py-3">
                    <p className="text-gray-500 text-[11px]">
                      {month}/{year} Attendance
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#0B2A6F]">
                      {attendancePercent != null
                        ? `${attendancePercent}%`
                        : "--"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#1B7C4D] flex items-center gap-1">
                      {attendancePercent != null ? (
                        <>
                          <Activity className="h-3 w-3" />
                          Monthly average
                        </>
                      ) : (
                        "No data"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E3F5FF] text-[#05518C] border border-[#B8E1FF] px-3 py-1 text-[11px] font-medium">
                  <Clock className="h-3 w-3" />
                  Today: {headerStats.todayStatus || "No data"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF9F1] text-[#19724A] border border-[#B8EBD1] px-3 py-1 text-[11px] font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Performance: {headerStats.performanceStatus || "Good"}
                </span>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          {hasVisibleQuickActions && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 md:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2A6F]">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-500">
                  {showApplyLeaveAction && availableLeave > 0
                    ? `Apply for leave (${availableLeave} available)`
                    : showApplyLeaveAction
                      ? "No leaves remaining"
                      : "Quick links for your account"}
                </p>
              </div>
              <span className="rounded-full bg-[#E3EBFF] text-[#0B2A6F] text-[11px] px-3 py-1 font-medium">
                Employee Panel
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
            {showApplyLeaveAction && (
            <button
  onClick={handleLeaveClick}
  disabled={availableLeave === 0}
  className={`group rounded-xl border px-3 py-3 flex flex-col items-start gap-2 transition-all duration-200 ${
    availableLeave === 0
      ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
      : "border-gray-200 bg-[#F9FBFF] hover:border-[#2952CC] hover:bg-[#EAF0FF] hover:shadow-md hover:-translate-y-0.5"
  }`}
>
  <div className="flex items-center gap-2">
    <Calendar className="h-4 w-4 text-[#2952CC]" />
    <span
      className={`font-medium ${
        availableLeave === 0 ? "text-gray-500" : "text-[#0B2A6F]"
      }`}
    >
      Apply Leave
    </span>
  </div>

  <p
    className={`text-[11px] ${
      availableLeave === 0
        ? "text-gray-400"
        : "text-gray-500 group-hover:text-gray-700"
    }`}
  >
    {availableLeave > 0 ? "View status & apply" : "No leaves left"}
  </p>
</button>
            )}

                      {showPayslipAction && (
                      <button
            onClick={handlePayslipsClick}
            className="group rounded-xl border border-gray-200 bg-[#F9FBFF] px-3 py-3 flex flex-col items-start gap-2 hover:border-[#2952CC] hover:bg-[#EAF0FF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2952CC]" />
              <span className="font-medium text-[#0B2A6F]">Payslips</span>
            </div>
            <p className="text-[11px] text-gray-500 group-hover:text-gray-700">
              View latest payslip
            </p>
          </button>
                      )}

          {showAttendanceAction && (
          <button
            onClick={handleAttendanceClick}
            className="group rounded-xl border border-gray-200 bg-[#F9FBFF] px-3 py-3 flex flex-col items-start gap-2 hover:border-[#2952CC] hover:bg-[#EAF0FF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2952CC]" />
              <span className="font-medium text-[#0B2A6F]">Attendance</span>
            </div>
            <p className="text-[11px] text-gray-500 group-hover:text-gray-700">
              Clock in/out & history
            </p>
          </button>
          )}

          {/* {showProfileAction && (
          <button
            onClick={handleProfileClick}
            className="group rounded-xl border border-gray-200 bg-[#F9FBFF] px-3 py-3 flex flex-col items-start gap-2 hover:border-[#2952CC] hover:bg-[#EAF0FF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#2952CC]" />
              <span className="font-medium text-[#0B2A6F]">My Profile</span>
            </div>
            <p className="text-[11px] text-gray-500 group-hover:text-gray-700">
              Update personal details
            </p>
          </button>
          )} */}
        </div>
      </div>
      )}
    </section>

    {/* SNAPSHOT + ACTIVITY */}
    <section className="grid grid-cols-1 xl:grid-cols-[1.7fr,1.3fr] gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0B2A6F]">
            Work Snapshot
          </h3>
          <button
            onClick={handleViewReportsClick}
            className="flex items-center gap-1 text-[11px] text-[#2952CC] hover:text-[#1F3DA3]">
            View reports <ArrowRightCircle className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Current project
              </span>
              <Briefcase className="h-4 w-4 text-[#2952CC]" />
            </div>
            <p className="text-sm font-semibold text-[#0B2A6F]">
              {snapshot.currentProject || "No project assigned"}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5EDFF] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2952CC] to-[#2DAF7D]"
                style={{
                  width: `${snapshot.projectProgressPercent || 0}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">This month</span>
              <Clock className="h-4 w-4 text-[#2952CC]" />
            </div>
            <p className="text-sm font-semibold text-[#0B2A6F]">
              Logged Hours
            </p>
            <p className="text-2xl font-semibold text-[#0B2A6F]">
              {snapshot.loggedHours == null
                ? "--"
                : typeof snapshot.loggedHours === "number"
                  ? `${snapshot.loggedHours}h`
                  : snapshot.loggedHours}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Pending</span>
              <CheckCircle className="h-4 w-4 text-[#2952CC]" />
            </div>
            <p className="text-sm font-semibold text-[#0B2A6F]">HR Items</p>
            {Array.isArray(snapshot.pendingItems) && snapshot.pendingItems.length > 0 ? (
              <ul className="mt-1 space-y-1 text-[11px] text-gray-700">
                {snapshot.pendingItems.slice(0, 3).map((item, idx) => (
                  <li key={idx}>• {String(item || "")}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">
                All caught up!
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 md:p-5">
          <h3 className="text-sm font-semibold text-[#0B2A6F] mb-3">
            Recent Activity
          </h3>
          {myLeaves.length > 0 ? (
            myLeaves.slice(-3).map((leave) => (
              <div
                key={leave.id}
                className="flex gap-3 items-start py-2 border-b border-gray-100 last:border-b-0"
              >
                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-medium ${getActivityPillClasses(
                    { status: leave.status }
                  )}`}
                >
                  {formatTime(leave.startDate)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#0B2A6F]">
                    {leave.type || "Leave Request"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {leave.startDate && leave.endDate
                      ? `${formatShortDate(
                          leave.startDate
                        )} - ${formatShortDate(leave.endDate)}`
                      : "Leave application"}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${getEventBadgeClasses(
                      leave
                    )}`}
                  >
                    {leave.status || "Pending"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No recent activity</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 md:p-5">
          <h3 className="text-sm font-semibold text-[#0B2A6F] mb-2">
            Upcoming Leaves
          </h3>
          <p className="text-xs text-gray-500 mb-4">Next 30 days</p>
          {myLeaves
            .filter(
              (leave) =>
                new Date(leave.startDate) > new Date() &&
                ["APPROVED", "PENDING"].includes(
                  (leave.status || "").toUpperCase()
                )
            )
            .slice(0, 3).length > 0 ? (
            myLeaves
              .filter(
                (leave) =>
                  new Date(leave.startDate) > new Date() &&
                  ["APPROVED", "PENDING"].includes(
                    (leave.status || "").toUpperCase()
                  )
              )
              .slice(0, 3)
              .map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-start gap-3 p-3 rounded-xl border bg-[#F9FBFF] mb-3"
                >
                  <div className="bg-[#E3EBFF] text-[#0B2A6F] h-10 w-10 rounded-lg flex flex-col items-center justify-center text-[11px]">
                    <span>
                      {formatShortDate(leave.startDate)?.slice(0, 2)}
                    </span>
                    <span className="text-[9px] uppercase">
                      {formatShortDate(leave.startDate)?.slice(3)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#0B2A6F]">
                      {leave.type || "Leave"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {leave.reason || "Approved leave"}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium ${getEventBadgeClasses(
                      leave
                    )}`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))
          ) : (
            <p className="text-xs text-gray-500">No upcoming leaves</p>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 md:p-5">
          <h3 className="text-sm font-semibold text-[#0B2A6F] mb-3">
            Wellness
          </h3>
          {wellnessHighlights.length === 0 ? (
            <p className="text-xs text-gray-500">No updates available</p>
          ) : (
            wellnessHighlights.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl border bg-[#F9FBFF] mb-3"
              >
                <div className="h-9 w-9 rounded-xl bg-[#E3EBFF] flex items-center justify-center">
                  <HeartPulse className="h-4 w-4 text-[#2952CC]" />
                </div>
                <div>
                  <p className="font-medium text-[#0B2A6F]">{item.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
          <div className="pt-2">
            <button
              onClick={handleProfileClick}
              className="text-[11px] text-[#2952CC] hover:text-[#1F3DA3] flex items-center gap-1"
            >
              Update profile <ArrowRightCircle className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
);
}
