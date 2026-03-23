import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Crown,
  Target,
  TrendingUp,
  User2,
  Zap,
} from "lucide-react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
  baseURL: API_BASE_URL,
});

export default function EmployeePerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError("");

    try {
      const rawToken = localStorage.getItem("token");
      const tenantCode = localStorage.getItem("tenantCode");
      const companyId = localStorage.getItem("companyId");

      if (!rawToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      if (!tenantCode) {
        throw new Error("Tenant code not found. Please log in again.");
      }
      if (!companyId) {
        throw new Error("Company ID not found. Please log in again.");
      }

      const token = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;

      const res = await api.get("/api/performance/employee", {
        headers: {
          Authorization: token,
          "X-Tenant-Code": tenantCode,
          "X-Company-Id": companyId,
        },
      });

      const payload = res.data;
      const data = payload?.data ?? payload;
      const normalized = Array.isArray(data) ? data : data ? [data] : [];

      setPerformanceData(normalized);
    } catch (err) {
      console.error("Failed to load performance data:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load performance data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const rawToken = localStorage.getItem("token");
      const tenantCode = localStorage.getItem("tenantCode");
      const companyId = localStorage.getItem("companyId");

      if (!rawToken || !tenantCode) return;

      const token = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;

      // Use the same tenant endpoint as the admin dashboard, then take top 5
      const res = await api.get("/api/performance/tenant/all", {
        headers: {
          Authorization: token,
          "X-Tenant-Code": tenantCode,
          ...(companyId ? { "X-Company-Id": companyId } : {}),
        },
      });

      const payload = res.data;
      const data = payload?.data ?? payload;
      const normalized = Array.isArray(data) ? data : data ? [data] : [];

      const top5 = [...normalized]
        .sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))
        .slice(0, 5);

      setTopPerformers(top5);
    } catch (err) {
      console.error("Failed to load top performers:", err);
      setTopPerformers([]);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    fetchTopPerformers();
  }, []);

  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const _formatFeedback = (value) => {
    if (!value) return "N/A";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (!value.length) return "N/A";
      return value
        .map((f) => f?.comment || f?.title || f)
        .filter(Boolean)
        .join(" • ");
    }
    return "N/A";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
    return `${value}%`;
  };

  const statusTone = (status) => {
    switch (status) {
      case "Excellent":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Good":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Average":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Needs Improvement":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const primary = performanceData[0];
  const _taskCompletion = useMemo(() => {
    if (!primary) return 0;
    const total = Number(primary.totalTasks || 0);
    const done = Number(primary.tasksCompleted || 0);
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }, [primary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Data</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Performance Data</h2>
          <p className="text-slate-600">Your performance data is not available yet.</p>
        </div>
      </div>
    );
  }

  const _firstFeedback =
    Array.isArray(primary?.feedback) && primary.feedback.length > 0
      ? primary.feedback[0]
      : null;
  const myRankIndex = topPerformers.findIndex(
    (emp) => primary?.employeeId && emp.employeeId === primary.employeeId
  );
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : "N/A";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-5 text-center">
        <h1 className="text-lg font-semibold text-slate-800">Employee Performance Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">My Performance</p>
                <div className="mt-1 text-sm text-slate-600">
                  Review Period: {primary?.reviewPeriod || "N/A"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${statusTone(primary?.status)}`}>
                  {primary?.status || "N/A"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                  {primary?.validated ? "Validated" : "Pending"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-4">
                <div className="text-sm">Your Score:</div>
                <div className="mt-1 text-3xl font-bold">
                  {primary?.currentScore ?? primary?.rating ?? "N/A"}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  Improved
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="text-sm font-semibold text-slate-800 mb-4">Performance Breakdown</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow
                label="Attendance"
                value={formatPercent(primary?.attendance)}
                accent="from-blue-500 to-indigo-500"
              />
              <DetailRow
                label="Tasks Completed"
                value={`${primary?.tasksCompleted ?? 0}/${primary?.totalTasks ?? 0}`}
                accent="from-emerald-500 to-teal-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <div className="text-base font-semibold text-slate-900">Performance Record Details</div>
                <div className="text-xs text-slate-500">
                  Employee profile + performance metrics overview
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                Read-only
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
                  <User2 className="w-4 h-4 text-slate-500" />
                  Employee
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-slate-400" />
                      Employee ID
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.employeeId || "N/A"}</div>
                  </div>
                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <User2 className="w-4 h-4 text-slate-400" />
                      Name
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.name || primary?.employeeName || "N/A"}</div>
                  </div>
                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      Department
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.department || "N/A"}</div>
                  </div>
                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400" />
                      Position
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.position || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
                  <Target className="w-4 h-4 text-slate-500" />
                  Performance Metrics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400" />
                      Current Score (0-100)
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {primary?.currentScore ?? "N/A"}
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Attendance %
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-2">
                      <span>{formatPercent(primary?.attendance)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(primary?.attendance) || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-slate-400" />
                      Tasks Completed
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.tasksCompleted ?? "N/A"}</div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-slate-400" />
                      Total Tasks
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{primary?.totalTasks ?? "N/A"}</div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-slate-400" />
                      Productivity %
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-2">
                      <span>{formatPercent(primary?.productivity)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(primary?.productivity) || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400" />
                      Quality Score %
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-2">
                      <span>{formatPercent(primary?.qualityScore)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(primary?.qualityScore) || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Punctuality %
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-2">
                      <span>{formatPercent(primary?.punctuality)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(primary?.punctuality) || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      Status
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${primary?.status === "Good"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : primary?.status === "Needs Improvement"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : primary?.status === "Average"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        {primary?.status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="text-sm font-semibold text-slate-800 mb-4">Top 5 Performers</div>
            {topPerformers.length === 0 ? (
              <div className="text-sm text-slate-600">No leaderboard data available.</div>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((emp, idx) => {
                  const score = Number(emp.currentScore ?? emp.rating ?? 0);
                  const displayScore = emp.currentScore ?? emp.rating ?? "N/A";
                  return (
                    <div
                      key={`${emp.id || emp.employeeId || idx}`}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${idx === 0
                                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                : idx === 1
                                  ? "bg-gradient-to-br from-slate-400 to-slate-600"
                                  : idx === 2
                                    ? "bg-gradient-to-br from-orange-400 to-rose-500"
                                    : "bg-gradient-to-br from-indigo-400 to-purple-500"
                              }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                            {getInitials(emp.name || emp.employeeName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {emp.name || emp.employeeName || "Employee"}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {emp.department || "Department N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Score</div>
                          <div className="text-lg font-semibold text-slate-900">{displayScore}</div>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="text-sm font-semibold text-slate-800 mb-3">Your Rank</div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">{myRank}</div>
              <div className="text-xs text-slate-500">out of {topPerformers.length || 0}</div>
            </div>
            <div className="mt-3 text-xs text-slate-600">Keep it up!</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="text-sm font-semibold text-slate-800 mb-3">Recent Update</div>
            <div className="text-sm text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(primary?.lastUpdated)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${accent} text-white flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
    </div>
  );
}

function DetailRow({ label, value, accent, compact }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border border-slate-100 px-4 ${compact ? "py-3 bg-white" : "py-4 bg-slate-50"} relative overflow-hidden`}>
      {accent && (
        <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${accent}`} />
      )}
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
