import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Save,
} from "lucide-react";
import {
  hasActionAccess,
  hasRouteAccess,
  openUpgradeModal,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

/* ===================== API BASE URL ===================== */
const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  if (fromEnv && !isLocalHost) {
    return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  }
  if (isLocalHost) {
    return "http://localhost:8080";
  }
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

/* ===================== HELPERS ===================== */
// ✅ normalize status safely (ACTIVE / INACTIVE)
const normalizeStatus = (status) => {
  const s = String(status || "ACTIVE").trim().toUpperCase();
  if (s === "ACTIVE") return "ACTIVE";
  if (["INACTIVE", "IN_ACTIVE", "DEACTIVE", "DEACTIVATED", "DISABLED"].includes(s))
    return "INACTIVE";
  return "ACTIVE";
};

const normalizeRole = (role) => String(role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const ALLOWED_USER_ROLES = new Set(["EMPLOYEE", "ADMIN", "HR_MANAGER", "HRMANAGER", "TEAM_LEAD"]);

// ✅ Use same auth headers everywhere (token + tenant + company)
const getAuthHeaders = (tenantCode) => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("companyId");

  return {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    }),
    ...(tenantCode && { "X-Tenant-Code": tenantCode }),
    ...(companyId && { "X-Company-Id": companyId }),
  };
};

// ✅ Safe API response parsing
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const accessContext = resolveAccessContext();
  const canCreateEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "create");
  const canViewEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "view");
  const canEditEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "edit");
  const canDeleteEmployee = hasActionAccess(accessContext.role, accessContext.plan, "manageEmployee", "delete");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  // ========== STATE ==========
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [statusToggle, setStatusToggle] = useState("all"); // all | active | inactive

  // ✅ Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit"
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ✅ Edit form state (only used in edit mode)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    mobile: "",
    department: "",
    position: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Tenant info
  const [tenantInfo, setTenantInfo] = useState({
    tenantCode: "",
    companyName: "",
    companyId: null,
  });

  /* ===================== LOAD TENANT INFO ===================== */
  useEffect(() => {
    try {
      const tenantCode = localStorage.getItem("tenantCode");
      const companyName = localStorage.getItem("companyName");
      const companyId = localStorage.getItem("companyId");

      if (!tenantCode) {
        setError("Tenant code not found. Please log in again.");
        setLoading(false);
        return;
      }

      setTenantInfo({
        tenantCode: tenantCode || "",
        companyName: companyName || "Unknown Company",
        companyId: companyId ? parseInt(companyId) : null,
      });
    } catch (err) {
      console.error("Error reading tenant info:", err);
      setError("Failed to load company information.");
      setLoading(false);
    }
  }, []);

  /* ===================== FETCH EMPLOYEES ===================== */
  const fetchEmployees = async () => {
    if (!tenantInfo.tenantCode) return;

    setLoading(true);
    setError("");

    try {
      // ✅ Your controller shows: GET /api/users/tenant/employees
      const endpoint = API_BASE_URL
        ? `${API_BASE_URL.replace(/\/+$/, "")}/api/users/tenant`
        : "/api/users/tenant";

      const res = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(tenantInfo.tenantCode),
      });

      const data = await safeJson(res);

      if (res.ok && data?.success) {
        const list = (data.data || [])
          .filter((user) => ALLOWED_USER_ROLES.has(normalizeRole(user.role)))
          .map((emp) => ({
            ...emp,
            status: normalizeStatus(emp.status),
            role: normalizeRole(emp.role),
          }));
        setEmployees(list);
      } else {
        setError(data?.message || `Failed to fetch employees (HTTP ${res.status})`);
      }
    } catch (err) {
      console.error("❌ Error fetching employees:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantInfo.tenantCode) fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantInfo.tenantCode]);

  /* ===================== FILTERED LIST ===================== */
  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.fullName?.toLowerCase() || "").includes(q) ||
          (emp.email?.toLowerCase() || "").includes(q) ||
          (emp.employeeId?.toLowerCase() || "").includes(q) ||
          (emp.mobile?.toLowerCase() || "").includes(q) ||
          (emp.role?.toLowerCase() || "").includes(q)
      );
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter((emp) => emp.department === filterDepartment);
    }

    if (statusToggle === "active") {
      filtered = filtered.filter((emp) => normalizeStatus(emp.status) === "ACTIVE");
    }
    if (statusToggle === "inactive") {
      filtered = filtered.filter((emp) => normalizeStatus(emp.status) === "INACTIVE");
    }

    return filtered;
  }, [employees, searchQuery, filterDepartment, statusToggle]);

  /* ===================== COUNTS ===================== */
  const departments = useMemo(
    () => ["all", ...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees]
  );

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => normalizeStatus(e.status) === "ACTIVE").length;
  const inactiveCount = employees.filter((e) => normalizeStatus(e.status) === "INACTIVE").length;

  /* ===================== CRUD HANDLERS ===================== */
  const handleAddEmployee = () => {
    if (!canCreateEmployee) return;
    const routeKey = "addEmployee";
    if (!hasRouteAccess(accessContext.role, accessContext.plan, routeKey)) {
      openUpgradeModal(routeKey, accessContext);
      return;
    }

    const addEmployeePath =
      accessContext.role === "SUPER_ADMIN"
        ? "/super-admin/add-employee"
        : "/admin/add-employee";

    navigate(addEmployeePath);
  };

  // ✅ open view modal (read-only)
  const handleViewEmployee = (id) => {
    if (!canViewEmployee) return;
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    setSelectedEmployee(emp);
    setModalMode("view");
    setIsModalOpen(true);
  };

  // ✅ open edit modal (form)
  const handleEditEmployee = (id) => {
    if (!canEditEmployee) return;
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    setSelectedEmployee(emp);
    setEditForm({
      fullName: emp.fullName || "",
      email: emp.email || "",
      employeeId: emp.employeeId || "",
      mobile: emp.mobile || "",
      department: emp.department || "",
      position: emp.position || "",
      status: normalizeStatus(emp.status),
    });
    setFormError("");
    setResetPasswordMode(false);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return; // prevent close while saving
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setModalMode("view");
    setFormError("");
    setResetPasswordMode(false);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // ✅ PUT update to DB (controller: PUT /api/users/tenant/{id})
  const handleSaveEdit = async () => {
    if (!selectedEmployee?.id) return;

    setFormError("");
    const trimmedEmail = (editForm.email || "").trim().toLowerCase();
    const trimmedMobile = (editForm.mobile || "").trim();
    const mobileDigits = trimmedMobile.replace(/\D/g, "");

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (trimmedMobile && (mobileDigits.length < 10 || mobileDigits.length > 15)) {
      setFormError("Mobile number should be between 10 and 15 digits.");
      return;
    }
    if (resetPasswordMode) {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setFormError("Both password fields are required in reset mode.");
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setFormError("New Password and Confirm New Password must match.");
        return;
      }
      if (!passwordRegex.test(passwordForm.newPassword)) {
        setFormError(
          "Password must be at least 8 characters and include 1 uppercase letter and 1 number."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const updateEndpoint = API_BASE_URL
        ? `${API_BASE_URL.replace(/\/+$/, "")}/api/users/tenant/${selectedEmployee.id}`
        : `/api/users/tenant/${selectedEmployee.id}`;

      const payload = {
        ...selectedEmployee, // keep any fields backend expects
        ...editForm,
        email: trimmedEmail,
        status: normalizeStatus(editForm.status),
      };

      const res = await fetch(updateEndpoint, {
        method: "PUT",
        headers: getAuthHeaders(tenantInfo.tenantCode),
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (res.ok && data?.success) {
        if (resetPasswordMode) {
          const resetEndpoint = API_BASE_URL
            ? `${API_BASE_URL.replace(/\/+$/, "")}/api/users/tenant/${selectedEmployee.id}/reset-password`
            : `/api/users/tenant/${selectedEmployee.id}/reset-password`;

          const resetRes = await fetch(resetEndpoint, {
            method: "PATCH",
            headers: getAuthHeaders(tenantInfo.tenantCode),
            body: JSON.stringify({ newPassword: passwordForm.newPassword }),
          });
          const resetData = await safeJson(resetRes);
          if (!resetRes.ok || !resetData?.success) {
            throw new Error(
              resetData?.message || `Failed to reset password (HTTP ${resetRes.status})`
            );
          }
        }

        await fetchEmployees();
        const successMessage = resetPasswordMode
          ? "Password updated successfully"
          : "Employee updated successfully";
        setToast({ message: successMessage, type: "success" });

        // ✅ close modal
        setIsModalOpen(false);
        setSelectedEmployee(null);
        setModalMode("view");
        setFormError("");
        setResetPasswordMode(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        setToast({
          message: data?.message || `Failed to update employee (HTTP ${res.status})`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ Error updating employee:", err);
      setToast({
        message: err?.message || "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE = controller: DELETE /api/users/tenant/{id}
  const handleDeleteEmployee = async (id, name) => {
    if (!canDeleteEmployee) return;
    const ok = window.confirm(`Are you sure you want to delete employee: ${name}?`);
    if (!ok) return;

    try {
      const endpoint = API_BASE_URL
        ? `${API_BASE_URL.replace(/\/+$/, "")}/api/users/tenant/${id}`
        : `/api/users/tenant/${id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: getAuthHeaders(tenantInfo.tenantCode),
      });

      const data = await safeJson(res);

      if (res.ok && data?.success) {
        // remove from UI
        setEmployees((prev) => prev.filter((e) => e.id !== id));

        // if deleting currently opened employee, close modal
        if (selectedEmployee?.id === id) {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }
      } else {
        alert(data?.message || `Failed to delete employee (HTTP ${res.status})`);
      }
    } catch (err) {
      console.error("❌ Error deleting employee:", err);
      alert("Network error. Please try again.");
    }
  };

  // ✅ EXPORT
  const handleExport = () => {
    if (filteredEmployees.length === 0) {
      alert("No users to export");
      return;
    }

    const csvHeaders =
      "Full Name,Email,Employee ID,Role,Department,Position,Mobile,Status\n";
    const csvRows = filteredEmployees
      .map(
        (emp) =>
          `"${emp.fullName || ""}","${emp.email || ""}","${emp.employeeId || ""}","${
            (emp.role || "").replace(/_/g, " ")
          }","${emp.department || ""}","${emp.position || ""}","${emp.mobile || ""}","${normalizeStatus(
            emp.status
          )}"`
      )
      .join("\n");

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${tenantInfo.companyName}_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen px-4 md:px-6 py-4 bg-[#F9FAFF]">
      {/* Header */}
      <div className="rounded-2xl px-6 py-5 mb-6 shadow-sm" style={{ backgroundColor: "#00008B" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Employee Management
            </h1>
            <p className="text-xs md:text-sm text-blue-100 mt-1">
              Managing users for{" "}
              <span className="font-semibold">{tenantInfo.companyName}</span>
            </p>
          </div>

          {canCreateEmployee && (
            <button
              onClick={handleAddEmployee}
              className="bg-white text-[#00008B] px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-50 transition shadow-lg"
            >
              <UserPlus size={20} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Filtered Results</p>
          <p className="text-2xl font-bold text-orange-600">{filteredEmployees.length}</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border border-blue-200">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Viewing users (Employee, Admin, HR Manager, Team Lead) for: {tenantInfo.companyName}
            </p>
            <p className="text-xs text-blue-700">
              Tenant Code:{" "}
              <span className="font-mono font-semibold">{tenantInfo.tenantCode}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 text-black">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, ID, role, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status toggle + actions */}
          <div className="flex gap-2 items-center">
            <div className="flex flex-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setStatusToggle("all")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  statusToggle === "all" ? "bg-white shadow text-gray-900" : "text-gray-600 text-black"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusToggle("active")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  statusToggle === "active"
                    ? "bg-white shadow text-green-700"
                    : "text-gray-600"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusToggle("inactive")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  statusToggle === "inactive"
                    ? "bg-white shadow text-red-700"
                    : "text-gray-600"
                }`}
              >
                Inactive
              </button>
            </div>

            <button
              onClick={fetchEmployees}
              className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-black"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-black"
              title="Export to CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="ml-3 text-gray-600">Loading users...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center p-12">
            <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#00008B] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => {
                  const s = normalizeStatus(employee.status);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(employee.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{employee.fullName}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-700">
                          {employee.employeeId || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {(employee.role || "-").replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {employee.department || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {employee.position || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            s === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {canViewEmployee && (
                            <button
                              onClick={() => handleViewEmployee(employee.id)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                          )}

                          {canEditEmployee && (
                            <button
                              onClick={() => handleEditEmployee(employee.id)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition"
                              title="Edit Employee"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}

                          {canDeleteEmployee && (
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.fullName)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                              title="Delete Employee"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== MODAL (VIEW / EDIT) ===================== */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#00008B]">
              <div>
                <p className="text-white font-bold text-lg">
                  {modalMode === "edit" ? "Edit Employee" : "Employee Details"}
                </p>
                <p className="text-blue-100 text-xs">
                  {modalMode === "edit"
                    ? "Update employee information and save"
                    : "View employee information (read-only)"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/10 text-black"
                title="Close"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalMode === "view" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" value={selectedEmployee.fullName} />
                    <Field label="Email" value={selectedEmployee.email} />
                    <Field label="Employee ID" value={selectedEmployee.employeeId} />
                    <Field
                      label="Role"
                      value={(selectedEmployee.role || "").replace(/_/g, " ")}
                    />
                    <Field label="Mobile" value={selectedEmployee.mobile} />
                    <Field label="Department" value={selectedEmployee.department} />
                    <Field label="Position" value={selectedEmployee.position} />
                    <Field label="Status" value={normalizeStatus(selectedEmployee.status)} />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50"
                    >
                      Close
                    </button>

                    {canEditEmployee && (
                      <button
                        onClick={() => handleEditEmployee(selectedEmployee.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#00008B] text-white hover:opacity-95"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {formError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      value={editForm.fullName}
                      onChange={(v) => setEditForm((p) => ({ ...p, fullName: v }))}
                    />
                    <InputField
                      label="Email"
                      value={editForm.email}
                      onChange={(v) => setEditForm((p) => ({ ...p, email: v }))}
                      type="email"
                    />
                    <InputField
                      label="Employee ID"
                      value={editForm.employeeId}
                      onChange={(v) => setEditForm((p) => ({ ...p, employeeId: v }))}
                    />
                    <InputField
                      label="Mobile"
                      value={editForm.mobile}
                      onChange={(v) => setEditForm((p) => ({ ...p, mobile: v }))}
                    />
                    <InputField
                      label="Department"
                      value={editForm.department}
                      onChange={(v) => setEditForm((p) => ({ ...p, department: v }))}
                    />
                    <InputField
                      label="Position"
                      value={editForm.position}
                      onChange={(v) => setEditForm((p) => ({ ...p, position: v }))}
                    />

                    <SelectField
                      label="Status"
                      value={normalizeStatus(editForm.status)}
                      onChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
                      options={[
                        { value: "ACTIVE", label: "ACTIVE" },
                        { value: "INACTIVE", label: "INACTIVE" },
                      ]}
                    />
                  </div>

                  <div className="mt-4 border border-blue-100 rounded-xl p-4 bg-blue-50/40">
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordMode((prev) => !prev);
                        setPasswordForm({ newPassword: "", confirmPassword: "" });
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900 underline"
                    >
                      Reset Password
                    </button>

                    {resetPasswordMode && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PasswordField
                          label="New Password"
                          value={passwordForm.newPassword}
                          onChange={(v) =>
                            setPasswordForm((prev) => ({ ...prev, newPassword: v }))
                          }
                          show={showNewPassword}
                          onToggleShow={() => setShowNewPassword((prev) => !prev)}
                        />
                        <PasswordField
                          label="Confirm New Password"
                          value={passwordForm.confirmPassword}
                          onChange={(v) =>
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: v }))
                          }
                          show={showConfirmPassword}
                          onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6 text-black">
                    <button
                      onClick={() => {
                        // back to view without closing modal
                        setModalMode("view");
                        // keep selectedEmployee same
                      }}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50"
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSaveEdit}
                      className="px-5 py-2.5 rounded-xl bg-[#00008B] text-white hover:opacity-95 flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ✅ Read-only field */
function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="mt-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}

/* ✅ Input field */
function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

/* ✅ Select field */
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggleShow }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="mt-1 relative">
        <input
          type={show ? "text" : "password"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
          title={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
}
