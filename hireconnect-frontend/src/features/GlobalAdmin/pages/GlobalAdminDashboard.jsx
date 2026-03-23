import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Building2,
  ArrowRightCircle,
  Layers,
  TrendingUp,
} from "lucide-react";

const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  if (fromEnv && !isLocalHost) {
    return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  }
  if (isLocalHost) {
    return "http://localhost:8080";
  }
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export default function GlobalAdminDashboard() {
  const navigate = useNavigate();

  const [totalCompanies, setTotalCompanies] = useState(0);
  const [activeCompanies, setActiveCompanies] = useState(0);
  const [suspendedCompanies, setSuspendedCompanies] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const authHeader = () => {
    const raw = (localStorage.getItem("token") || "").trim();
    return raw ? (/^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`) : "";
  };

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");

      const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
      const res = await fetch(`${base}/api/global-admin/companies/statistics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader() ? { Authorization: authHeader() } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load stats (status ${res.status})`);
      }

      const json = await res.json();
      const stats = json?.data || {};

      setTotalCompanies(Number(stats.totalCompanies) || 0);
      setActiveCompanies(Number(stats.activeCompanies) || 0);
      setSuspendedCompanies(Number(stats.suspendedCompanies) || 0);
      setTotalEmployees(Number(stats.totalEmployees) || 0);
      setMonthlyRevenue(0);
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
      setStatsError(err?.message || "Failed to load dashboard stats");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Global Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Manage all companies, subscriptions, and system-wide configurations
          from one central location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Building2 className="w-6 h-6 text-[#011A8B]" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Total Companies</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            {statsLoading ? "..." : totalCompanies}
          </h3>
          {statsError ? (
            <p className="text-xs text-red-500">{statsError}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Active: {activeCompanies} | Suspended: {suspendedCompanies}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Active Subscriptions</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            {statsLoading ? "..." : activeCompanies}
          </h3>
          <p className="text-xs text-slate-500">Updated from backend</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Total Users</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            {statsLoading ? "..." : totalEmployees}
          </h3>
          {statsError ? (
            <p className="text-xs text-red-500">{statsError}</p>
          ) : (
            <p className="text-xs text-slate-500">Employees count from backend</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Monthly Revenue</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            {statsLoading
              ? "..."
              : `\u20b9${(monthlyRevenue || 0).toLocaleString("en-IN")}`}
          </h3>
          <p className="text-xs text-slate-500">Connect revenue API to show real data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate("/global-admin/companies")}
          className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-[#011A8B]/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-[#011A8B] transition-colors">
            <Building2 className="w-6 h-6 text-[#011A8B] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-0.5">Companies</h3>
            <p className="text-sm text-slate-500">Manage companies</p>
          </div>
          <ArrowRightCircle className="w-5 h-5 text-slate-400 group-hover:text-[#011A8B] transition-colors" />
        </button>

        <button
          onClick={() => navigate("/global-admin/management")}
          className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-[#011A8B]/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-600 transition-colors">
            <Layers className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-0.5">Manager Management</h3>
          </div>
          <ArrowRightCircle className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate("/global-admin/register")}
          className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-[#011A8B]/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-colors">
            <Users className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-0.5">Add Global Admins</h3>
            <p className="text-sm text-slate-500">Manage roles</p>
          </div>
          <ArrowRightCircle className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </div>
    </div>
  );
}
