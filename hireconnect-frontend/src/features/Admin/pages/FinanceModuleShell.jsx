import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const defaultAllowedRoles = new Set(["ADMIN", "SUPER_ADMIN", "GLOBAL_ADMIN"]);

export default function FinanceModuleShell({ title, description, allowedRoles, children }) {
  const navigate = useNavigate();
  const role = String(
    localStorage.getItem("role") ||
      sessionStorage.getItem("role") ||
      localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      ""
  )
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const allowed = new Set(
    (allowedRoles && allowedRoles.length ? allowedRoles : Array.from(defaultAllowedRoles)).map(
      (r) => String(r || "").trim().toUpperCase().replace(/[\s-]+/g, "_")
    )
  );
  const effectiveRole = role === "COMPANY_ADMIN" ? "ADMIN" : role;
  const hasAccess = allowed.has(effectiveRole);

  if (!hasAccess) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <Lock className="h-10 w-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-700 mb-1">Access Denied</h2>
          <p className="text-sm text-red-600">You are not authorized to access this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      <div className="rounded-2xl bg-blue-900 px-6 py-5 flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-blue-100 mt-1">{description}</p>
        </div>
        <button
          onClick={() => navigate("/admin/finance")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-900 border border-blue-900 text-sm font-medium hover:bg-blue-50 shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Finance Hub
        </button>
      </div>

      {children ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-700 font-semibold">{title}</p>
          <p className="text-sm text-slate-500 mt-2">
            This module route is now active and opens correctly from Finance Hub.
          </p>
        </div>
      )}
    </div>
  );
}
