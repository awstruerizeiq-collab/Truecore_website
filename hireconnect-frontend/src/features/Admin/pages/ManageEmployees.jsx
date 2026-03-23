import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  hasActionAccess,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
export default function ManageEmployees() {
  const accessContext = resolveAccessContext();
  const canViewEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "view");
  const canEditEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "edit");
  const canDeleteEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "delete");
  const canRefreshEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "refresh");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [editForm, setEditForm] = useState({
    id: null,
    fullName: "",
    email: "",
    mobile: "",
    position: "",
    department: "",
    employeeId: "",
    status: "",
  });

  const primaryBlue = "#00008B";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // -------- Normalize API response --------
  const normalizeEmployee = (user) => {
    console.log("Raw user object:", user);
    return {
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      mobile: user.mobile || "",
      position: user.position || "",
      department: user.department || "",
      employeeId: user.employeeId || "",
      status: user.status || "",
      role: user.role || "",
      dob: user.dob || "",
      joiningDate: user.joiningDate || "",
    };
  };

  const extractEmployeeList = (apiResponse) => {
    console.log("Full API response:", apiResponse);

    if (!apiResponse) return [];

    // Handle ApiResponse wrapper: { success, message, data }
    if (apiResponse.data !== undefined) {
      if (Array.isArray(apiResponse.data)) {
        return apiResponse.data.map(normalizeEmployee);
      }
      return [normalizeEmployee(apiResponse.data)];
    }

    // Direct array
    if (Array.isArray(apiResponse)) {
      return apiResponse.map(normalizeEmployee);
    }

    // Single object
    return [normalizeEmployee(apiResponse)];
  };

  // ========== API Calls ==========

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/api/users`);
      console.log("Fetch employees response:", res.data);

      const list = extractEmployeeList(res.data);
      console.log("Normalized employee list:", list);
      setEmployees(list);
    } catch (err) {
      console.error("Error fetching employees", err);
      const errorMsg = err.response?.data?.message || err.message;
      setError("Failed to load employees: " + errorMsg);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSingleEmployee = async (empId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/${empId}`);
      console.log("Refresh response:", res.data);
      
      const list = extractEmployeeList(res.data);
      const updated = list[0];
      
      if (!updated) {
        alert("Failed to refresh - no data returned");
        return;
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? updated : e))
      );
      alert("Employee refreshed successfully!");
    } catch (err) {
      console.error("Error refreshing employee", err);
      alert("Failed to refresh: " + (err.response?.data?.message || err.message));
    }
  };

  const updateEmployee = async (payload) => {
    // Send only the fields that backend expects
    const updatePayload = {
      fullName: payload.fullName,
      email: payload.email,
      mobile: payload.mobile || null,
      position: payload.position || null,
      department: payload.department || null,
      employeeId: payload.employeeId || null,
      status: payload.status || null,
    };

    console.log("Updating employee with payload:", updatePayload);

    const res = await axios.put(
      `${API_BASE_URL}/api/users/${payload.id}`,
      updatePayload
    );
    
    console.log("Update response:", res.data);
    return res.data;
  };

  const deleteEmployeeApi = async (empId) => {
    await axios.delete(`${API_BASE_URL}/api/users/${empId}`);
  };

  // ========== Effects ==========
  useEffect(() => {
    fetchEmployees();
  }, []);

  // ========== Filter ==========
  const filtered = employees.filter((emp) => {
    const s = search.trim().toLowerCase();
    const matchesSearch =
      !s ||
      emp.id?.toString().toLowerCase().includes(s) ||
      emp.fullName?.toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s) ||
      emp.position?.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      emp.employeeId?.toLowerCase().includes(s) ||
      emp.mobile?.toLowerCase().includes(s);

    const status = (emp.status || "").toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && status === "ACTIVE") ||
      (statusFilter === "INACTIVE" && status === "INACTIVE");

    const matchesDepartment =
      departmentFilter === "ALL" ||
      (emp.department || "").toLowerCase() === departmentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departmentOptions = ["ALL", ...Array.from(new Set(employees.map((e) => e.department || "").filter(Boolean)))];

  // ========== Handlers ==========
  const handleView = (emp) => {
    if (!canViewEmployee) return;
    setCurrentEmployee(emp);
    setShowViewModal(true);
  };

  const handleEdit = (emp) => {
    if (!canEditEmployee) return;
    setCurrentEmployee(emp);
    setEditForm({
      id: emp.id,
      fullName: emp.fullName || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      position: emp.position || "",
      department: emp.department || "",
      employeeId: emp.employeeId || "",
      status: emp.status || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.fullName || !editForm.email) {
      alert("Full Name and Email are required!");
      return;
    }

    try {
      setSaving(true);
      const response = await updateEmployee(editForm);
      
      const updatedList = extractEmployeeList(response);
      const updatedEmployee = updatedList[0] || editForm;

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === currentEmployee.id ? updatedEmployee : emp))
      );

      setShowEditModal(false);
      setCurrentEmployee(null);
      alert("Employee updated successfully!");
    } catch (err) {
      console.error("Error updating employee", err);
      alert("Failed to update: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = (emp) => {
    if (!canRefreshEmployee) return;
    refreshSingleEmployee(emp.id);
  };

  const handleDelete = async (emp) => {
    if (!canDeleteEmployee) return;
    if (!window.confirm(`Delete ${emp.fullName}?`)) return;
    
    try {
      await deleteEmployeeApi(emp.id);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      alert("Employee deleted successfully!");
    } catch (err) {
      console.error("Error deleting employee", err);
      alert("Failed to delete: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-gray-50">
      {/* Header */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"
        style={{ backgroundColor: primaryBlue }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Employee Management
          </h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1">
            View and manage all employee records
          </p>
        </div>
        <button
          onClick={fetchEmployees}
          className="text-xs px-4 py-2 rounded-lg bg-white/10 text-white border border-white/30 hover:bg-white/20 transition"
        >
          ðŸ”„ Refresh All
        </button>
      </div>


  {/* Search + Filters */}
  <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Search</span>
        <input
          type="text"
          placeholder="Search by name, email, position, department, employee ID..."
          className="w-full h-12 pl-12 pr-3 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#000080] focus:border-transparent outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 lg:w-[420px]">
        <select
          className="h-12 w-full sm:flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#000080] focus:border-transparent outline-none"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          {departmentOptions.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "ALL" ? "All Departments" : dept}
            </option>
          ))}
        </select>
        <div className="flex gap-2 sm:justify-end">
          {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-12 px-3 rounded-xl text-sm font-semibold border transition ${
                statusFilter === status
                  ? "bg-[#000080] text-white border-[#000080]"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
              <button
                onClick={fetchEmployees}
                title="Refresh"
                className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                Refresh
              </button>
        </div>
      </div>
    </div>
  </div>
      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#000080] text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Employee ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Position</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Department</th>
                <th className="py-3 px-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#000080] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading employees...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <p className="text-gray-500">No employees found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-700 text-sm font-medium">
                      {emp.employeeId || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#000080] font-semibold text-sm">
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                    </td>
                    <td className="py-3 px-4 text-[#000080] text-sm">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-sm font-medium">
                      <span className="bg-blue-50 px-3 py-1 rounded-full">
                        {emp.position || "Not Set"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-sm font-medium">
                      <span className="bg-purple-50 px-3 py-1 rounded-full">
                        {emp.department || "Not Set"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        {canViewEmployee && (
                          <button
                            onClick={() => handleView(emp)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                            title="View Details"
                          >
                            View
                          </button>
                        )}
                        {canEditEmployee && (
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                            title="Edit"
                          >
                            Edit
                          </button>
                        )}
                        {canRefreshEmployee && (
                          <button
                            onClick={() => handleRefresh(emp)}
                            className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm"
                            title="Refresh"
                          >
                            Refresh
                          </button>
                        )}
                        {canDeleteEmployee && (
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                            title="Delete"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && currentEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border-t-4 border-[#000080] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#000080]">
                Employee Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">ID:</strong>
                <p className="text-[#000080] font-semibold">{currentEmployee.id}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Employee ID:</strong>
                <p className="text-[#000080] font-semibold">{currentEmployee.employeeId || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Full Name:</strong>
                <p className="text-[#000080] font-semibold">{currentEmployee.fullName}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Email:</strong>
                <p className="text-[#000080]">{currentEmployee.email}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Mobile:</strong>
                <p className="text-[#000080]">{currentEmployee.mobile || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Position:</strong>
                <p className="text-[#000080]">{currentEmployee.position || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Department:</strong>
                <p className="text-[#000080]">{currentEmployee.department || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Role:</strong>
                <p className="text-[#000080]">{currentEmployee.role || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">Status:</strong>
                <p className="text-[#000080]">{currentEmployee.status || "-"}</p>
              </div>
              <div className="flex border-b pb-3">
                <strong className="text-gray-600 w-40">DOB:</strong>
                <p className="text-[#000080]">{currentEmployee.dob || "-"}</p>
              </div>
              <div className="flex">
                <strong className="text-gray-600 w-40">Joining Date:</strong>
                <p className="text-[#000080]">{currentEmployee.joiningDate || "-"}</p>
              </div>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="mt-6 w-full py-3 bg-[#000080] text-white rounded-lg hover:bg-[#000060] transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && currentEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#000080]">
                Edit Employee
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-4">
              {/* ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  System ID
                </label>
                <input
                  type="text"
                  value={editForm.id}
                  readOnly
                  className="w-full rounded-lg bg-gray-100 text-gray-600 px-4 py-2 border-none outline-none"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={editForm.employeeId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, employeeId: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                  placeholder="e.g., EMP001"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mobile: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                  placeholder="e.g., +91 9876543210"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                  placeholder="e.g., Engineering"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full rounded-lg bg-gray-50 text-gray-800 px-4 py-2 border-2 border-gray-200 focus:border-[#000080] outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditSubmit}
                  disabled={saving}
                  className="flex-1 py-3 rounded-lg bg-[#000080] hover:bg-[#000060] text-white font-semibold disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "ðŸ’¾ Save Changes"}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


