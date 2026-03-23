import React, { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
export default function LeaveManagement() {
  const [pending, setPending] = useState({
    leaveRequests: [],
    correctionRequests: [],
  });

  const [loading, setLoading] = useState(true);

  // ---------------------------------------
  // Fetch Pending Requests
  // ---------------------------------------
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/leaves/pending`);

      setPending({
        leaveRequests: res.data.data || [],
        correctionRequests: [], // update later when backend ready
      });
    } catch (err) {
      console.error("Error fetching pending:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // ---------------------------------------
  // APPROVE LEAVE
  // ---------------------------------------
  const approveLeave = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leaves/${id}/approve`, {
        reviewedBy: 12,
      });

      fetchPending();
    } catch (err) {
      alert("Failed to approve leave");
      console.error(err);
    }
  };

  // ---------------------------------------
  // REJECT LEAVE
  // ---------------------------------------
  const rejectLeave = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leaves/${id}/reject`, {
        reviewedBy: 12,
        reason: "Rejected by admin",
      });

      fetchPending();
    } catch (err) {
      alert("Failed to reject leave");
      console.error(err);
    }
  };

  // ---------------------------------------
  // PROCESS CORRECTION APPROVAL / REJECTION
  // ---------------------------------------
  const process = async (id, type, approve) => {
    try {
      const url = `${API_BASE_URL}/api/attendance/corrections/${id}/${
        approve ? "approve" : "reject"
      }`;

      await axios.put(url, {
        reviewedBy: 12,
        reason: approve ? null : "Rejected by admin",
      });

      fetchPending();
    } catch (err) {
      alert(
        `Failed to ${approve ? "approve" : "reject"} correction request`
      );
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F9FAFF]">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          Loading pending requests...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 bg-[#F9FAFF]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#011A8B]">
            Leave & Attendance Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review pending leave applications and attendance correction requests.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* =============================== */}
        {/* PENDING LEAVE REQUESTS */}
        {/* =============================== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Leave Requests
              </h3>
              <p className="text-xs text-gray-500">
                Approve or reject leave applications from employees.
              </p>
            </div>
            <span className="rounded-full bg-[#F3F4FF] px-3 py-1 text-xs font-medium text-[#011A8B]">
              {pending.leaveRequests.length} pending
            </span>
          </div>

          {pending.leaveRequests.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No pending leaves
            </div>
          ) : (
            <div className="space-y-3">
              {pending.leaveRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFF] p-4 shadow-xs"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        Employee ID:{" "}
                        <span className="font-medium text-[#011A8B]">
                          {r.userId}
                        </span>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#011A8B] border border-[#EEF0FF]">
                        {r.leaveType ?? "No Type"}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Period
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {r.startDate} <span className="mx-1">→</span> {r.endDate}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Total Days
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {r.totalDays}
                    </div>

                    {r.reason && (
                      <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-gray-600 border border-gray-100">
                        <span className="font-semibold text-gray-700">
                          Reason:{" "}
                        </span>
                        {r.reason}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => approveLeave(r.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectLeave(r.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =============================== */}
        {/* PENDING CORRECTION REQUESTS */}
        {/* =============================== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Correction Requests
              </h3>
              <p className="text-xs text-gray-500">
                Review attendance correction / regularization requests.
              </p>
            </div>
            <span className="rounded-full bg-[#F3F4FF] px-3 py-1 text-xs font-medium text-[#011A8B]">
              {pending.correctionRequests.length} pending
            </span>
          </div>

          {pending.correctionRequests.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No pending corrections
            </div>
          ) : (
            <div className="space-y-3">
              {pending.correctionRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFF] p-4 shadow-xs"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        Employee ID:{" "}
                        <span className="font-medium text-[#011A8B]">
                          {r.userId}
                        </span>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                        Correction Request
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Requested At
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {new Date(
                        r.requested_timestamp
                      ).toLocaleString()}
                    </div>

                    {r.reason && (
                      <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-gray-600 border border-gray-100">
                        <span className="font-semibold text-gray-700">
                          Reason:{" "}
                        </span>
                        {r.reason}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => process(r.id, "correction", true)}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => process(r.id, "correction", false)}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}