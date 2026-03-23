import React from "react";
import {
  hasFeatureAccess,
  resolveAccessContext,
} from "../../lib/planAccessConfig.js";
import AccessDeniedCard from "./AccessDeniedCard.jsx";

export default function FeatureGuard({
  featureKey,
  children,
  fallback = null,
}) {
  const context = resolveAccessContext();
  const allowed = hasFeatureAccess(context.role, context.plan, featureKey);

  if (allowed) {
    return children;
  }

  return fallback || <AccessDeniedCard targetKey={featureKey} compact />;
}
