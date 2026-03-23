import React from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccessDeniedCard from "./AccessDeniedCard.jsx";

export default function AccessDeniedPage({
  targetKey = "",
  title,
  description,
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-5">
        <div className="rounded-3xl bg-[#011A8B] p-8 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Access Denied</h1>
              <p className="mt-2 text-sm text-blue-100">
                This page is not available for your current role and subscription plan.
              </p>
            </div>
          </div>
        </div>

        <AccessDeniedCard
          targetKey={targetKey}
          title={title}
          description={description}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
