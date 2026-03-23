import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Clock,
  PlusCircle,
  Settings,
  Server,
  ArrowRightCircle,
} from "lucide-react";
import {
  hasRouteAccess,
  openUpgradeModal,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

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

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const accessContext = resolveAccessContext();
  const [userRole, setUserRole] = useState(null);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [activeCompanies, setActiveCompanies] = useState(0);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  const fetchCompanyStats = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError("");

      const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : "";
      const token = localStorage.getItem("token");
      const res = await fetch(`${base}/api/global-admin/companies/statistics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to load registered companies (status ${res.status})`
        );
      }

      const json = await res.json();
      const stats = json?.data || {};
      setTotalCompanies(Number(stats.totalCompanies) || 0);
      setActiveCompanies(Number(stats.activeCompanies) || 0);
    } catch (err) {
      console.error("Company stats fetch error:", err);
      setCompaniesError(err.message || "Failed to load registered companies");
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored =
        (localStorage.getItem("role") || localStorage.getItem("position") || "")
          .trim()
          .toUpperCase();
      setUserRole(stored || null);
    } catch (err) {
      console.error("Error reading role from storage:", err);
    }
    fetchCompanyStats();
  }, []);

  const guardedNavigate = (routeKey, path) => {
    if (!hasRouteAccess(accessContext.role, accessContext.plan, routeKey)) {
      openUpgradeModal(routeKey, accessContext);
      return;
    }
    navigate(path);
  };

  const handleAddEmployeeClick = () => guardedNavigate("addEmployee", "/super-admin/add-employee");
  const handleAdminManagementClick = () =>
    guardedNavigate("adminManagement", "/super-admin/admin-management");

  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-[#F9FAFF]">
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 shadow-sm"
        style={{ backgroundColor: "#00008B" }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            CEO Dashboard
          </h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
            Get a quick overview of companies and access key super admin
            actions from a single place.
          </p>
        </div>

        <div className="flex gap-4 text-xs md:text-sm text-blue-100">
          <div className="flex flex-col items-end">
            {userRole && (
              <span className="px-2 py-1 rounded-full bg-blue-900/60 text-[11px] border border-blue-300/40">
                Logged in as: {userRole}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-5 py-4 md:px-6 md:py-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Companies</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalCompanies}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Across all regions</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-6 w-6 text-[#011A8B]" />
            </div>
          </div> */}

          {/* <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-5 py-4 md:px-6 md:py-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Companies</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {activeCompanies}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Billing & users active</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div> */}

          {/* <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-5 py-4 md:px-6 md:py-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Approval</p>
              <p className="mt-2 text-2xl font-bold text-amber-500">0</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Company requests in queue
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div> */}
        </div>

        {companiesError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {companiesError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={handleAddEmployeeClick}
            className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 md:px-6 md:py-5 text-left shadow-sm hover:shadow-md hover:border-[#011A8B]/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 group-hover:bg-emerald-100">
              <PlusCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Add New Employee</h3>
              <p className="mt-1 text-xs text-slate-500">
                Create a new employee profile with basic details.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleAdminManagementClick}
            className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 md:px-6 md:py-5 text-left shadow-sm hover:shadow-md hover:border-[#011A8B]/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 group-hover:bg-pink-100">
              <Settings className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Manager Management</h3>
              <p className="mt-1 text-xs text-slate-500">
                Configure admin accounts, roles and access levels.
              </p>
            </div>
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-sky-600" />
            Quick Links
          </h3>

          <div className="space-y-2 text-[13px] text-slate-700">
            <button
              onClick={handleAddEmployeeClick}
              className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 transition"
            >
              <span>Add employee via form</span>
              <ArrowRightCircle className="h-4 w-4 text-[#011A8B]" />
            </button>

            <button
              onClick={handleAdminManagementClick}
              className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 transition"
            >
              <span>Manage admin roles</span>
              <ArrowRightCircle className="h-4 w-4 text-[#011A8B]" />
            </button>
          </div>
        </div>

        {companiesLoading && (
          <p className="text-xs text-slate-500">Refreshing company stats...</p>
        )}
      </div>
    </div>
  );
}
