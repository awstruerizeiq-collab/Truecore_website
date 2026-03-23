import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  canAccessProfessionalEmployeeSwitchRoute,
  getDefaultRouteForRole,
  hasRouteAccess,
  isProfessionalEmployeeSwitchActive,
  isCompanyRole,
  resolveAccessContext,
} from "../../lib/planAccessConfig.js";

export default function ProtectedRoute({
  requiredPermissions = [],
  routeKey = "",
  allowUnauthenticated = false,
  allowUnauthenticatedRoles = [],
  children,
}) {
  const location = useLocation();
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  const stored = localStorage.getItem("userPermissions") || "[]";
  const permissions = JSON.parse(stored);
  const accessContext = resolveAccessContext();
  const role = accessContext.role;
  const canBypassTokenCheck =
    !token &&
    (
      allowUnauthenticated ||
      allowUnauthenticatedRoles.some(
        (allowedRole) => String(allowedRole || "").trim().toUpperCase() === role,
      )
    );
  const isProfessionalEmployeeSwitch = isProfessionalEmployeeSwitchActive(
    accessContext,
    location.pathname,
  );
  const canUseEmployeeSwitch = canAccessProfessionalEmployeeSwitchRoute(
    accessContext,
    routeKey,
    location.pathname,
  );

  if (!token && !canBypassTokenCheck) {
    return <Navigate to="/employee/signin" replace />;
  }

  // Keep GLOBAL_ADMIN unblocked during migration when permissions are not yet persisted.
  if (role === "GLOBAL_ADMIN" && requiredPermissions.length > 0 && permissions.length === 0) {
    return <Outlet />;
  }

  const hasRequired =
    requiredPermissions.length === 0 ||
    permissions.includes("*") ||
    requiredPermissions.every((perm) => permissions.includes(perm));

  if (!hasRequired) {
    return <Navigate to="/global-admin/dashboard" replace />;
  }

  if (routeKey && isCompanyRole(role)) {
    if (isProfessionalEmployeeSwitch && !canUseEmployeeSwitch) {
      return <Navigate to="/employee/dashboard" replace />;
    }

    if (!canUseEmployeeSwitch && !hasRouteAccess(role, accessContext.plan, routeKey)) {
      const safePath = getDefaultRouteForRole(role);
      if (location.pathname === safePath) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to={safePath} replace />;
    }
  }

  return children || <Outlet />;
}
