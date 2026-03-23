import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import {
  getUpgradeState,
  openUpgradeModal,
  resolveAccessContext,
} from "../../lib/planAccessConfig.js";

export default function AccessDeniedCard({
  targetKey,
  title,
  description,
  className = "",
  compact = false,
}) {
  const context = resolveAccessContext();
  const upgradeState = getUpgradeState(context.role, context.plan, targetKey);
  const resolvedTitle = title || upgradeState.title;
  const resolvedDescription = description || upgradeState.message;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 p-5 text-slate-900 shadow-sm ${className}`}
    >
      <div className={`flex ${compact ? "items-center" : "items-start"} gap-3`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          {compact ? <Lock className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">{resolvedTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{resolvedDescription}</p>
          <button
            type="button"
            onClick={() => openUpgradeModal(targetKey, context)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-medium text-white hover:bg-[#02106A]"
          >
            <Lock className="h-4 w-4" />
            {upgradeState.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
