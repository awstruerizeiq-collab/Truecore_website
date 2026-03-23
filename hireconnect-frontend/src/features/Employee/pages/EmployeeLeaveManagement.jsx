import React, { useState, useEffect } from "react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const cleanBase = API_BASE_URL.replace(/\/+$/, "");

export default function EmployeeLeaves() {

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // ================= FETCH LEAVES =================
  const fetchLeaves = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${cleanBase}/api/leaves/my-leaves`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      setLeaves(result.data || []);

    } catch {
      setError("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ================= APPLY =================
  const handleApplyLeave = async () => {

    if (!formData.startDate || !formData.endDate || !formData.reason) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      await fetch(`${cleanBase}/api/leaves/apply`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setFormData({ leaveType: "CASUAL", startDate: "", endDate: "", reason: "" });

      fetchLeaves();

    } finally {
      setSubmitting(false);
    }
  };

  const approved = leaves.filter(l => l.status === "APPROVED").length;
  const pending = leaves.filter(l => l.status === "PENDING").length;
  const available = 24 - approved;

  const filtered = filterStatus === "ALL" ? leaves : leaves.filter(l => l.status === filterStatus);

  if (loading) return <div className="p-10">Loading...</div>;

  return (

    <div className="min-h-screen bg-[#F9FAFF] px-6 py-4">

      {/* HEADER */}
      <div className="bg-[#00008B] rounded-2xl px-6 py-5 mb-6 shadow">
        <h2 className="text-2xl font-bold text-white">Leave History</h2>
        <p className="text-blue-100 text-sm mt-1">{available} of 24 leaves remaining</p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <Card title="Total Leaves" value={leaves.length} />
        <Card title="Approved" value={approved} color="text-green-600" />
        <Card title="Pending" value={pending} color="text-orange-500" />
        <Card title="Available" value={available} color="text-blue-600" />

      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Filter by status:</span>

        {["ALL","PENDING","APPROVED","REJECTED"].map(s=>(
          <button
            key={s}
            onClick={()=>setFilterStatus(s)}
            className={`px-4 py-1 rounded-lg text-xs font-medium transition ${
              filterStatus===s
                ? "bg-[#2952CC] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#0B2A6F]">Leave History</h3>
          <p className="text-xs text-gray-500">{filtered.length} records found</p>
        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs text-gray-600 uppercase">
              <th className="px-4 py-3">ID</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody className="divide-y">

            {filtered.length===0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  No leave records found
                </td>
              </tr>
            )}

            {filtered.map(l=>(
              <tr key={l.id} className="hover:bg-gray-50">

                <td className="px-4 py-3">{l.id}</td>
                <td>{l.leaveType}</td>
                <td className="max-w-xs truncate">{l.reason}</td>
                <td>{l.startDate}</td>
                <td>{l.endDate}</td>
                <td>{l.totalDays}</td>

                <td>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    l.status==="APPROVED"
                      ? "bg-green-100 text-green-700"
                      : l.status==="REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {l.status}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* APPLY */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow">

        <h3 className="font-semibold mb-3 text-[#0B2A6F]">Apply Leave</h3>

        <div className="flex flex-wrap gap-3">

          <input type="date" className="border rounded px-3 py-2"
            value={formData.startDate}
            onChange={e=>setFormData({...formData,startDate:e.target.value})}
          />

          <input type="date" className="border rounded px-3 py-2"
            value={formData.endDate}
            onChange={e=>setFormData({...formData,endDate:e.target.value})}
          />

          <input placeholder="Reason" className="border rounded px-3 py-2 w-64"
            value={formData.reason}
            onChange={e=>setFormData({...formData,reason:e.target.value})}
          />

          <button
            onClick={handleApplyLeave}
            disabled={submitting}
            className="bg-[#2952CC] text-white px-6 py-2 rounded hover:bg-[#1f3fa3]"
          >
            Apply
          </button>

        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

      </div>

    </div>
  );
}

const Card = ({title,value,color="text-[#0B2A6F]"}) => (
  <div className="bg-white p-4 rounded-xl shadow border">
    <p className="text-xs text-gray-500 mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);