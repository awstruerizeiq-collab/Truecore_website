import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const getAuthHeaders = () => {
  const token = (localStorage.getItem("token") || "").trim();
  if (!token) return {};
  return token.startsWith("Bearer ") ? { Authorization: token } : { Authorization: `Bearer ${token}` };
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
      // ignore parse errors
    }
  }

  return { tenantCode, companyId };
};

const getTeamLeadContext = () => {
  const employeeId = localStorage.getItem("employeeId") || localStorage.getItem("employee_id") || "";
  const { tenantCode, companyId } = getTenantContext();
  return { employeeId, tenantCode, companyId };
};

const buildApiUrl = (path, params = {}) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  const base = API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
  const search = new URLSearchParams(params).toString();
  return search ? `${base}?${search}` : base;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const normalizeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const extractListDeep = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.tasks)) return payload.tasks;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.data && typeof payload.data === "object") {
    return extractList(payload.data);
  }
  return [];
};

const normalizeAttendanceStats = (payload) => ({
  presentToday: payload.presentToday ?? payload.present ?? payload.presentCount ?? 0,
  absentToday: payload.absentToday ?? payload.absent ?? payload.absentCount ?? 0,
});

const formatActivityTime = (value) => {
  if (!value) return "Just now";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildActivities = ({ notifications = [], tasks = [] }) => {
  const activityRows = [];

  notifications.forEach((item, idx) => {
    activityRows.push({
      id: `notif-${item?.id ?? idx}`,
      title: item?.title || item?.subject || item?.type || "Notification",
      description: item?.message || item?.body || "Team update shared.",
      time: item?.createdAt || item?.publishDate || item?.updatedAt || "",
      type: item?.type || "INFO",
    });
  });

  tasks.forEach((task, idx) => {
    activityRows.push({
      id: `task-${task?.id ?? idx}`,
      title: task?.title ? `Task: ${task.title}` : "Task update",
      description: task?.status ? `Status: ${task.status}` : task?.description || "Task updated.",
      time: task?.updatedAt || task?.createdAt || task?.dueDate || "",
      type: "TASK",
    });
  });

  const toTime = (value) => {
    const d = new Date(value);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  return activityRows
    .sort((a, b) => toTime(b.time) - toTime(a.time))
    .slice(0, 5);
};

const TeamLeadDashboard = () => {
  const mountedRef = useRef(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    tasks: 0,
    present: 0,
    absent: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTeamMembers = useCallback(async () => {
    const { employeeId, tenantCode } = getTeamLeadContext();
    if (!employeeId || !tenantCode) {
      return [];
    }

    const url = buildApiUrl(
      `/api/employee-details/team-lead/${encodeURIComponent(tenantCode)}/${encodeURIComponent(employeeId)}`,
    );
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to load team members.");
    }
    return extractList(data);
  }, []);

  const fetchTasks = useCallback(async () => {
    const { tenantCode, companyId } = getTenantContext();
    const params = {
      ...(tenantCode ? { tenantCode } : {}),
      ...(companyId ? { companyId } : {}),
    };
    const url = buildApiUrl("/api/teamlead/tasks", params);
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to load tasks.");
    }
    return extractListDeep(data);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const url = buildApiUrl("/api/teamlead/notifications");
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to load activities.");
    }
    return extractListDeep(data);
  }, []);

  const buildTeamMemberMatcher = (members = []) => {
    const idSet = new Set();
    const emailSet = new Set();
    const nameSet = new Set();

    members.forEach((m) => {
      const id = String(m?.employeeId || m?.id || m?.userId || "").trim();
      if (id) idSet.add(id);
      const email = String(m?.officialEmail || m?.email || m?.personalEmail || "").trim().toLowerCase();
      if (email) emailSet.add(email);
      const name = String(m?.name || m?.fullName || m?.employeeName || "").trim().toLowerCase();
      if (name) nameSet.add(name);
    });

    return (row) => {
      const rowId = String(row?.employeeId || row?.id || row?.userId || "").trim();
      if (rowId && idSet.has(rowId)) return true;
      const rowEmail = String(row?.officialEmail || row?.email || row?.personalEmail || "").trim().toLowerCase();
      if (rowEmail && emailSet.has(rowEmail)) return true;
      const rowName = String(row?.name || row?.fullName || row?.employeeName || "").trim().toLowerCase();
      if (rowName && nameSet.has(rowName)) return true;
      return false;
    };
  };

  const deriveAttendanceFromLive = useCallback(async (members = []) => {
    const { tenantCode, companyId } = getTenantContext();
    const params = {
      ...(tenantCode ? { tenantCode } : {}),
      ...(companyId ? { companyId } : {}),
    };
    const url = buildApiUrl("/api/admin/attendance/live", params);
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to load live attendance.");
    }
    const rows = extractListDeep(data);
    const isTeamMember = buildTeamMemberMatcher(members);
    const scopedRows = members.length > 0 ? rows.filter(isTeamMember) : rows;
    const present = scopedRows.filter((item) =>
      String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("PRESENT"),
    ).length;
    const absent = scopedRows.filter((item) =>
      String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("ABSENT"),
    ).length;
    return { presentToday: present, absentToday: absent };
  }, []);

  const fetchAttendanceStats = useCallback(async () => {
    const { tenantCode, companyId } = getTenantContext();
    const tenantHeaders = {
      ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
      ...(companyId ? { "X-Company-Id": companyId } : {}),
    };
    const tenantParams = {
      ...(tenantCode ? { tenantCode } : {}),
      ...(companyId ? { companyId } : {}),
    };

    const tryFetch = async (path) => {
      const url = buildApiUrl(path, tenantParams);
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          ...tenantHeaders,
        },
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.message || `Failed to load ${path}`);
      }
      return data;
    };

    try {
      const data = await tryFetch("/api/tl/attendance/team-stats");
      return normalizeAttendanceStats(data?.data ?? data ?? {});
    } catch (err) {
      console.error("Team Lead stats fallback:", err);
    }

    try {
      const data = await tryFetch("/api/tl/attendance/live-team");
      const list = extractList(data);
      const present = list.filter((item) =>
        String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("PRESENT"),
      ).length;
      const absent = list.filter((item) =>
        String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("ABSENT"),
      ).length;
      return { presentToday: present, absentToday: absent };
    } catch (err) {
      console.error("Team Lead live fallback:", err);
    }

    try {
      const data = await tryFetch("/api/admin/attendance/live");
      const list = extractListDeep(data);
      const present = list.filter((item) =>
        String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("PRESENT"),
      ).length;
      const absent = list.filter((item) =>
        String(item?.status || item?.attendanceStatus || "").toUpperCase().includes("ABSENT"),
      ).length;
      return { presentToday: present, absentToday: absent };
    } catch (err) {
      console.error("Admin live fallback:", err);
    }

    try {
      const data = await tryFetch("/api/admin/attendance/dashboard-stats");
      return normalizeAttendanceStats(data?.data ?? data ?? {});
    } catch (err) {
      console.error("Admin stats fallback:", err);
    }

    return { presentToday: 0, absentToday: 0 };
  }, []);

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const results = await Promise.allSettled([
        fetchTeamMembers(),
        fetchTasks(),
        fetchAttendanceStats(),
        fetchNotifications(),
      ]);

      const [membersResult, tasksResult, attendanceResult, notificationsResult] = results;
      const members = membersResult.status === "fulfilled" ? membersResult.value : [];
      const tasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
      let attendance =
        attendanceResult.status === "fulfilled" ? attendanceResult.value : { presentToday: 0, absentToday: 0 };
      const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];

      const errors = results
        .filter((res) => res.status === "rejected")
        .map((res) => res.reason)
        .filter(Boolean);

      if (errors.length > 0) {
        console.error("Team Lead dashboard load errors:", errors);
      }

      if (attendanceResult.status !== "fulfilled") {
        try {
          attendance = await deriveAttendanceFromLive(members);
        } catch (err) {
          console.error("Derived attendance fallback failed:", err);
        }
      }

      if (!mountedRef.current) return;

      setStats({
        totalMembers: normalizeNumber(members?.length),
        tasks: normalizeNumber(tasks?.length),
        present: normalizeNumber(attendance?.presentToday),
        absent: normalizeNumber(attendance?.absentToday),
      });
      setActivities(buildActivities({ notifications, tasks }));

      if (errors.length > 0) {
        setError("Some dashboard data could not be loaded. Showing available data.");
        setToast({ type: "error", message: "Dashboard data partially loaded. Please refresh." });
      }

      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    },
    [deriveAttendanceFromLive, fetchAttendanceStats, fetchNotifications, fetchTasks, fetchTeamMembers],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statCards = useMemo(
    () => [
      {
        id: "teamMembers",
        label: "Total Team Members",
        value: stats.totalMembers,
        hint: "Under your supervision",
        icon: Users,
        iconBg: "bg-[#EEF2FF]",
        iconColor: "text-[#020A8A]",
        valueClass: "text-[#020A8A]",
      },
      {
        id: "tasks",
        label: "Tasks",
        value: stats.tasks,
        hint: "Assigned to your team",
        icon: ClipboardList,
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        valueClass: "text-orange-600",
      },
      {
        id: "present",
        label: "No. of Presents",
        value: stats.present,
        hint: "Members present today",
        icon: CheckCircle,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        valueClass: "text-green-600",
      },
      {
        id: "absent",
        label: "No. of Absents",
        value: stats.absent,
        hint: "Today's count",
        icon: XCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        valueClass: "text-red-600",
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg border text-sm font-semibold shadow-lg ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ===== HERO HEADER ===== */}
      <div className="bg-gradient-to-r from-[#020A8A] to-[#020617] rounded-2xl p-8 text-white flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Team Lead Dashboard</h1>
          <p className="text-sm opacity-90 mt-1">Overview of your team and daily activities</p>
        </div>

        <button
          onClick={() => loadDashboard({ refresh: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-white/10 px-5 py-2 rounded-lg text-sm hover:bg-white/20 disabled:opacity-60"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ===== BIG STAT CARDS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl p-8 shadow-sm flex justify-between items-center min-h-[140px] cursor-pointer transition transform duration-150 ease-out active:scale-95 hover:shadow-md"
            >
              <div>
                <p className="text-sm font-semibold text-gray-700">{card.label}</p>
                <h2 className={`text-4xl font-bold mt-3 ${card.valueClass}`}>
                  {loading ? "..." : normalizeNumber(card.value)}
                </h2>
                <p className="text-xs text-gray-400 mt-2">{card.hint}</p>
              </div>
              <div className={`${card.iconBg} ${card.iconColor} p-5 rounded-2xl`}>
                <Icon size={36} />
              </div>
            </div>
          );
        })}

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-8 shadow-sm min-h-[200px] transition transform duration-150 ease-out active:scale-95 hover:shadow-md">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <Activity size={16} />
            Recent Activities
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-sm text-gray-500">No recent activities yet.</div>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#020A8A]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{activity.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {activity.description || "Activity update"}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatActivityTime(activity.time)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;
