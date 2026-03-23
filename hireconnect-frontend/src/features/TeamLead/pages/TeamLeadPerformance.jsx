import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Plus,
  Users,
  Trophy,
  Target,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserRound,
  ClipboardList,
} from "lucide-react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const TeamLeadPerformance = () => {
  const [context, setContext] = useState({ name: "", employeeId: "" });
  const [members, setMembers] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    userId: "",
    currentScore: 0,
    attendance: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    productivity: 0,
    qualityScore: 0,
    punctuality: 0,
  });

  const authHeaders = () => {
    const raw = (localStorage.getItem("token") || "").trim();
    const tenantCode = (localStorage.getItem("tenantCode") || "").trim();
    return {
      "Content-Type": "application/json",
      ...(raw && { Authorization: raw.startsWith("Bearer ") ? raw : `Bearer ${raw}` }),
      ...(tenantCode && { "X-Tenant-Code": tenantCode }),
    };
  };

  const url = (path) => {
    const base = (API_BASE_URL || "").replace(/\/+$/, "");
    const clean = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${clean}` : `/${clean}`;
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [ctxRes, membersRes, rankRes] = await Promise.all([
        fetch(url("/api/performance/team-lead/context"), { headers: authHeaders() }),
        fetch(url("/api/performance/team-lead/members"), { headers: authHeaders() }),
        fetch(url("/api/performance/team-lead/rank-list"), { headers: authHeaders() }),
      ]);

      const [ctxData, membersData, rankData] = await Promise.all([
        safeJson(ctxRes),
        safeJson(membersRes),
        safeJson(rankRes),
      ]);

      if (!ctxRes.ok || ctxData?.success === false) {
        throw new Error(ctxData?.message || "Failed to load Team Lead context.");
      }
      if (!membersRes.ok || membersData?.success === false) {
        throw new Error(membersData?.message || "Failed to load team members.");
      }
      if (!rankRes.ok || rankData?.success === false) {
        throw new Error(rankData?.message || "Failed to load rank list.");
      }

      setContext({
        name: ctxData?.data?.name || "",
        employeeId: ctxData?.data?.employeeId || "",
      });
      setMembers(Array.isArray(membersData?.data) ? membersData.data : []);
      setRankList(Array.isArray(rankData?.data) ? rankData.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load team performance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const availableMembers = useMemo(() => {
    const existingEmployeeIds = new Set((rankList || []).map((r) => String(r.employeeId || "")));
    return (members || []).filter((m) => !existingEmployeeIds.has(String(m.employeeId || "")));
  }, [members, rankList]);

  const selectedMember = useMemo(
    () => availableMembers.find((m) => String(m.userId) === String(form.userId)),
    [availableMembers, form.userId]
  );

  const stats = useMemo(() => {
    const total = rankList.length;
    const avgScore =
      total > 0
        ? (rankList.reduce((sum, row) => sum + (row.currentScore || 0), 0) / total).toFixed(1)
        : "0.0";
    return {
      teamMembers: members.length,
      ranked: rankList.length,
      avgScore,
    };
  }, [members, rankList]);

  const handleCreatePerformance = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      setToast({ type: "error", message: "Select a team member first." });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        userId: Number(form.userId),
        currentScore: Number(form.currentScore) || 0,
        attendance: Number(form.attendance) || 0,
        tasksCompleted: Number(form.tasksCompleted) || 0,
        totalTasks: Number(form.totalTasks) || 0,
        productivity: Number(form.productivity) || 0,
        qualityScore: Number(form.qualityScore) || 0,
        punctuality: Number(form.punctuality) || 0,
      };

      const res = await fetch(url("/api/performance/team-lead"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to add performance.");
      }

      setForm({
        userId: "",
        currentScore: 0,
        attendance: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        productivity: 0,
        qualityScore: 0,
        punctuality: 0,
      });
      setToast({ type: "success", message: "Performance added successfully." });
      await loadAll();
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Failed to add performance." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef3ff_0%,#f7f9ff_45%,#f3f5fb_100%)] p-6 text-slate-900">
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

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#163cb8] via-[#2f54d1] to-[#6e42d8] p-7 text-white shadow-[0_10px_35px_rgba(22,60,184,0.18)]">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-10 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Sparkles size={12} />
                Team Lead Performance
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-3">Performance Dashboard</h1>
              <p className="text-sm text-blue-100 mt-1">
                <span className="font-semibold">{context.name || "Team Lead"}</span>
                {"  "} • {"  "}
                <span className="font-mono">{context.employeeId || "No Employee ID"}</span>
              </p>
            </div>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 backdrop-blur px-3 py-2 text-sm font-semibold hover:bg-white/25 transition"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 shadow-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="My Team Members" value={stats.teamMembers} tone="blue" />
          <StatCard icon={Trophy} label="Ranked Members" value={stats.ranked} tone="violet" />
          <StatCard icon={Target} label="Average Score" value={stats.avgScore} tone="emerald" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Plus size={18} />
            Add Performance
          </h2>
          <form onSubmit={handleCreatePerformance} className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-semibold">Team Member</label>
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Select team member</option>
                {availableMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.employeeId} - {m.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Only employees assigned under this Team Lead are listed.
              </p>
            </div>

            {selectedMember && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <MiniInfo icon={UserRound} label="Name" value={selectedMember.name || "-"} />
                <MiniInfo icon={Users} label="Department" value={selectedMember.department || "-"} />
                <MiniInfo icon={ClipboardList} label="Position" value={selectedMember.position || "-"} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <NumberInput label="Score" value={form.currentScore} max={100} onChange={(v) => setForm((p) => ({ ...p, currentScore: v }))} />
              <NumberInput label="Attendance %" value={form.attendance} max={100} onChange={(v) => setForm((p) => ({ ...p, attendance: v }))} />
              <NumberInput label="Tasks Completed" value={form.tasksCompleted} onChange={(v) => setForm((p) => ({ ...p, tasksCompleted: v }))} />
              <NumberInput label="Total Tasks" value={form.totalTasks} onChange={(v) => setForm((p) => ({ ...p, totalTasks: v }))} />
              <NumberInput label="Productivity %" value={form.productivity} max={100} onChange={(v) => setForm((p) => ({ ...p, productivity: v }))} />
              <NumberInput label="Quality %" value={form.qualityScore} max={100} onChange={(v) => setForm((p) => ({ ...p, qualityScore: v }))} />
              <NumberInput label="Punctuality %" value={form.punctuality} max={100} onChange={(v) => setForm((p) => ({ ...p, punctuality: v }))} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1538b3] to-[#2f5af0] text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:opacity-95 disabled:opacity-60"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? "Saving..." : "Save Performance"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold">Team Rank List</h2>
            <p className="text-sm text-slate-500">Performance ranking for this Team Lead's members only.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Rank</th>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Tasks</th>
                  <th className="text-left px-4 py-3">Attendance</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>
                      Loading rank list...
                    </td>
                  </tr>
                ) : rankList.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>
                      No performance records found for your team members.
                    </td>
                  </tr>
                ) : (
                  rankList
                    .slice()
                    .sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))
                    .map((row, index) => (
                      <tr key={row.id || row.employeeId} className="border-t border-slate-100 text-sm">
                        <td className="px-4 py-3 font-bold text-[#0B2BAA]">#{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{row.name || "-"}</div>
                          <div className="text-xs text-slate-500">{row.employeeId || "-"}</div>
                        </td>
                        <td className="px-4 py-3">{row.department || "-"}</td>
                        <td className="px-4 py-3 font-semibold">{row.currentScore || 0}</td>
                        <td className="px-4 py-3">
                          {(row.tasksCompleted || 0)}/{row.totalTasks || 0}
                        </td>
                        <td className="px-4 py-3">{row.attendance || 0}%</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {row.status || "Average"}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${toneMap[tone] || toneMap.blue}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, max }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      />
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Icon size={12} />
        {label}
      </p>
      <p className="font-semibold text-sm text-slate-800 mt-1">{value}</p>
    </div>
  );
}

export default TeamLeadPerformance;