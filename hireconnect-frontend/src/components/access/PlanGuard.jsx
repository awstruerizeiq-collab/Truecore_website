import React from "react";
import {
  hasRouteAccess,
  resolveAccessContext,
} from "../../lib/planAccessConfig.js";
import AccessDeniedCard from "./AccessDeniedCard.jsx";

export default function PlanGuard({
  routeKey,
  children,
  fallback = null,
}) {
  const context = resolveAccessContext();
  const allowed = hasRouteAccess(context.role, context.plan, routeKey);

  if (allowed) {
    return children;
  }

  return fallback || <AccessDeniedCard targetKey={routeKey} compact />;
}
