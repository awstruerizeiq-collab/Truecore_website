import React, { useEffect, useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import {
  UPGRADE_MODAL_EVENT,
  getUpgradeState,
} from "../../lib/planAccessConfig.js";

export default function UpgradePlanModal() {
  const [modalState, setModalState] = useState(null);

  useEffect(() => {
    const openModal = (event) => {
      setModalState(event.detail || {});
    };

    window.addEventListener(UPGRADE_MODAL_EVENT, openModal);
    return () => window.removeEventListener(UPGRADE_MODAL_EVENT, openModal);
  }, []);

  const upgradeState = useMemo(() => {
    if (!modalState) return null;
    return getUpgradeState(modalState.role, modalState.plan, modalState.targetKey);
  }, [modalState]);

  if (!modalState || !upgradeState) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#011A8B]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {upgradeState.ctaLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{upgradeState.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalState(null)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close upgrade modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Your current plan is limiting access to this module. Upgrade availability is handled
            through your subscription workflow.
          </p>
          <p className="mt-2">
            Ask your subscription owner or billing contact to move your company to a higher plan.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setModalState(null)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setModalState(null)}
            className="rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-medium text-white hover:bg-[#02106A]"
          >
            Update Your Plan
          </button>
        </div>
      </div>
    </div>
  );
}
