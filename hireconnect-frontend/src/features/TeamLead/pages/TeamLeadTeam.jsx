import React, { useState, useEffect, useCallback } from "react";
import {
    Users, Mail, Briefcase, Building2, Search,
    RefreshCw, UserCheck, Calendar,
    Badge, AlertCircle, Loader2
} from "lucide-react";

/* ─── API BASE ─────────────────────────────────────────────── */
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

/* ─── STATUS BADGE ─────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
        INACTIVE: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
        ON_HOLD: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    };
    const c = map[status?.toUpperCase()] ?? map["ON_HOLD"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status ?? "Unknown"}
        </span>
    );
};

/* ─── AVATAR ────────────────────────────────────────────────── */
const Avatar = ({ name, size = "md" }) => {
    const initials = (name ?? "??")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
    const colors = ["bg-blue-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500"];
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    const sz = size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-xs";
    return (
        <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
            {initials}
        </div>
    );
};

/* ─── EMPLOYEE CARD ─────────────────────────────────────────── */
const EmployeeCard = ({ emp }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5">
        <div className="flex items-start gap-4">
            <Avatar name={emp.officialEmail} size="lg" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{emp.officialEmail}</h3>
                    <StatusBadge status={emp.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{emp.employeeId}</p>
            </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
                <Briefcase size={12} className="text-blue-400 flex-shrink-0" />
                <span className="truncate">{emp.designation || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
                <Building2 size={12} className="text-purple-400 flex-shrink-0" />
                <span className="truncate">{emp.department || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
                <Calendar size={12} className="text-emerald-400 flex-shrink-0" />
                <span className="truncate">
                    {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
                <Badge size={12} className="text-orange-400 flex-shrink-0" />
                <span className="truncate">{emp.employmentType?.replace("_", " ") || "—"}</span>
            </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <Mail size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{emp.officialEmail}</span>
        </div>
    </div>
);

/* ─── STAT CARD ─────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
        </div>
    </div>
);

const TeamLeadTeam = () => {
    const [members, setMembers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [teamLeadInfo, setTeamLeadInfo] = useState({
        employeeId: "",
        tenantCode: "",
        name: "Team Lead",
    });

    /* ── Load session ── */
    useEffect(() => {
        const employeeId = localStorage.getItem("employeeId") ?? "";
        const tenantCode = localStorage.getItem("tenantCode") ?? "";
        const name = localStorage.getItem("fullName") ?? localStorage.getItem("name") ?? "Team Lead";
        setTeamLeadInfo({ employeeId, tenantCode, name });
    }, []);

    /* ── Fetch members (safe: pass args) ── */
    const fetchMembers = useCallback(async (tenantCode, employeeId) => {
        if (!tenantCode || !employeeId) return;

        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token") ?? "";
            const authHeader = token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : null;

            const url =
                `${API_BASE_URL.replace(/\/+$/, "")}/api/employee-details/team-lead/` +
                `${encodeURIComponent(tenantCode)}/${encodeURIComponent(employeeId)}`;

            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Failed to fetch team members");

            const list = Array.isArray(data?.data) ? data.data : [];
            setMembers(list);
            setFiltered(list);
        } catch (err) {
            setError(err.message || "Error");
            setMembers([]);
            setFiltered([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── Auto fetch once both values exist ── */
    useEffect(() => {
        if (teamLeadInfo.employeeId && teamLeadInfo.tenantCode) {
            fetchMembers(teamLeadInfo.tenantCode, teamLeadInfo.employeeId);
        } else {
            setLoading(false);
        }
    }, [teamLeadInfo.employeeId, teamLeadInfo.tenantCode, fetchMembers]);

    /* ── Filter ── */
    useEffect(() => {
        let list = [...members];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (e) =>
                    e.officialEmail?.toLowerCase().includes(q) ||
                    e.employeeId?.toLowerCase().includes(q) ||
                    e.designation?.toLowerCase().includes(q) ||
                    e.department?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== "ALL") {
            list = list.filter((e) => e.status?.toUpperCase() === statusFilter);
        }

        setFiltered(list);
    }, [search, statusFilter, members]);

    const stats = {
        total: members.length,
        active: members.filter((m) => m.status?.toUpperCase() === "ACTIVE").length,
        inactive: members.filter((m) => m.status?.toUpperCase() === "INACTIVE").length,
        onHold: members.filter((m) => m.status?.toUpperCase() === "ON_HOLD").length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Users size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">My Team</h1>
                            <p className="text-sm text-gray-500">
                                {teamLeadInfo.name} · {teamLeadInfo.employeeId || "..."}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchMembers(teamLeadInfo.tenantCode, teamLeadInfo.employeeId)}
                        disabled={loading || !teamLeadInfo.tenantCode || !teamLeadInfo.employeeId}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total Members" value={stats.total} color="bg-blue-500" />
                    <StatCard icon={UserCheck} label="Active" value={stats.active} color="bg-emerald-500" />
                    <StatCard icon={AlertCircle} label="Inactive" value={stats.inactive} color="bg-red-500" />
                    <StatCard icon={RefreshCw} label="On Hold" value={stats.onHold} color="bg-amber-500" />
                </div>

                {/* Search + Filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email, ID, designation..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {["ALL", "ACTIVE", "INACTIVE", "ON_HOLD"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {s === "ALL" ? "All" : s === "ON_HOLD" ? "On Hold" : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <span className="text-sm text-gray-400 font-medium ml-auto">
                        {filtered.length} of {members.length} shown
                    </span>
                </div>

                {/* States */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={36} className="text-blue-500 animate-spin" />
                        <p className="text-gray-500 text-sm font-medium">Loading your team...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">Failed to load team</p>
                            <p className="text-xs text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && members.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-gray-700">No team members yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Employees assigned to you as Team Lead will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((emp) => (
                            <EmployeeCard key={emp.id ?? emp.employeeId} emp={emp} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamLeadTeam;