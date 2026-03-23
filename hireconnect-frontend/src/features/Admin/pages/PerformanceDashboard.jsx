import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  AlertCircle,
  ChevronDown,
  Building2,
  RefreshCw,
} from "lucide-react";

/* -------------------- Configuration -------------------- */
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export default function AdminPerformanceDashboard() {
  // ✅ TENANT INFORMATION
  const [tenantInfo, setTenantInfo] = useState({
    tenantCode: "",
    companyName: "",
    companyId: null,
  });

  const [employees, setEmployees] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("score-desc");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    currentScore: 0,
    attendance: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    productivity: 0,
    qualityScore: 0,
    punctuality: 0,
    status: "Average",
    validated: false,
  });
  const [selectedUserId, setSelectedUserId] = useState("");

  /* -------------------- LOAD TENANT INFO -------------------- */
  useEffect(() => {
    try {
      const tenantCode = localStorage.getItem("tenantCode");
      const companyName = localStorage.getItem("companyName");
      const companyId = localStorage.getItem("companyId");

      console.log("🔍 Performance Dashboard - Retrieved tenant info:", {
        tenantCode,
        companyName,
        companyId,
      });

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

  /* -------------------- FETCH USERS (TENANT ONLY) -------------------- */
  const fetchAllUsers = async () => {
    if (!tenantInfo.tenantCode) {
      console.log("⏳ Waiting for tenant code to fetch users...");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("📤 Fetching users for tenant:", tenantInfo.tenantCode);

      const endpoint = `${API_BASE_URL}/api/users/tenant/employees`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Tenant-Code": tenantInfo.tenantCode,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users (HTTP ${response.status})`);
      }

      const result = await response.json();

      if (result.success) {
        const users = result.data || [];
        setAllUsers(users);
        console.log(`✅ Loaded ${users.length} users for tenant ${tenantInfo.tenantCode}`);
      } else {
        throw new Error(result.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  };

  /* -------------------- FETCH PERFORMANCE (TENANT FILTERED) -------------------- */
  const fetchEmployees = async () => {
    if (!tenantInfo.tenantCode) {
      console.log("⏳ Waiting for tenant code to fetch performance...");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      // ✅ USE TENANT-SPECIFIC ENDPOINT
      const url = `${API_BASE_URL}/api/performance/tenant/all`;

      console.log("📤 Fetching tenant performance for:", tenantInfo.tenantCode);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Tenant-Code": tenantInfo.tenantCode, // ✅ Send tenant code in header
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized - Please login again");
        if (response.status === 403) throw new Error("Access denied - Admin privileges required");
        throw new Error(`Failed to fetch performance (HTTP ${response.status})`);
      }

      const result = await response.json();

      if (result.success) {
        const performanceData = result.data || [];
        setEmployees(performanceData);
        console.log(`✅ Loaded ${performanceData.length} performance records for tenant ${tenantInfo.tenantCode}`);
      } else {
        throw new Error(result.message || "Failed to load performance data");
      }
    } catch (err) {
      console.error("❌ Error fetching performance:", err);
      setError(err.message || "Failed to load employee performance data");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- LOAD DATA ON MOUNT -------------------- */
  useEffect(() => {
    if (!tenantInfo.tenantCode) return;

    (async () => {
      await fetchAllUsers();
      await fetchEmployees();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantInfo.tenantCode]);

  /* -------------------- Actions -------------------- */
  const handleUserSelection = (userId) => {
    setSelectedUserId(userId);
    const selectedUser = allUsers.find((user) => user.id === parseInt(userId));

    if (selectedUser) {
      let fullName = "";
      if (selectedUser.fullName) {
        fullName = selectedUser.fullName;
      } else if (selectedUser.firstName && selectedUser.lastName) {
        fullName = `${selectedUser.firstName} ${selectedUser.lastName}`;
      } else if (selectedUser.firstName) {
        fullName = selectedUser.firstName;
      } else if (selectedUser.lastName) {
        fullName = selectedUser.lastName;
      } else if (selectedUser.username) {
        fullName = selectedUser.username;
      } else {
        fullName = selectedUser.email;
      }

      setCreateForm((prev) => ({
        ...prev,
        userId: selectedUser.id,
        employeeId: selectedUser.employeeId || selectedUser.username || `EMP${selectedUser.id}`,
        name: fullName,
        department: selectedUser.department || "",
        position: selectedUser.position || selectedUser.role || "",
        email: selectedUser.email || "",
      }));
    }
  };

  const handleValidate = async (employeeId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/performance/validate/${employeeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-Code": tenantInfo.tenantCode,
          },
          body: JSON.stringify({ validated: true }),
        }
      );

      const result = await response.json();
      if (result.success) {
        await fetchEmployees();
        alert("✅ Performance validated successfully!");
      } else {
        alert("❌ Failed to validate: " + result.message);
      }
    } catch (err) {
      console.error("Error validating:", err);
      alert("❌ Failed to validate employee");
    }
  };

  const handleReject = async (employeeId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/performance/validate/${employeeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-Code": tenantInfo.tenantCode,
          },
          body: JSON.stringify({ validated: false }),
        }
      );

      const result = await response.json();
      if (result.success) {
        await fetchEmployees();
        alert("✅ Validation revoked successfully!");
      } else {
        alert("❌ Failed to revoke: " + result.message);
      }
    } catch (err) {
      console.error("Error revoking:", err);
      alert("❌ Failed to revoke validation");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee.id);
    setEditForm({ ...employee });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/performance/${editingEmployee}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-Code": tenantInfo.tenantCode,
          },
          body: JSON.stringify(editForm),
        }
      );

      const result = await response.json();
      if (result.success) {
        setEditingEmployee(null);
        setEditForm({});
        await fetchEmployees();
        alert("✅ Performance updated successfully!");
      } else {
        alert("❌ Failed to update: " + result.message);
      }
    } catch (err) {
      console.error("Error updating:", err);
      alert("❌ Failed to update employee performance");
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditForm({});
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCreateForm = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePerformance = async () => {
    if (!createForm.userId || !createForm.employeeId) {
      alert("❌ Please select an employee");
      return;
    }

    if (!createForm.name || createForm.name.trim() === "") {
      alert("❌ Employee name is required");
      return;
    }

    // ✅ Check if employee already has performance record
    const existingPerformance = employees.find(
      emp => emp.userId === createForm.userId
    );

    if (existingPerformance) {
      alert("❌ Performance record already exists for this employee. Please edit the existing record instead.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const performanceData = {
        ...createForm,
        // Tenant info will be set by backend from header
      };

      console.log("📤 Creating performance record:", performanceData);

      const response = await fetch(`${API_BASE_URL}/api/performance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Tenant-Code": tenantInfo.tenantCode, // ✅ Send tenant code
        },
        body: JSON.stringify(performanceData),
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({
          currentScore: 0,
          attendance: 0,
          tasksCompleted: 0,
          totalTasks: 0,
          productivity: 0,
          qualityScore: 0,
          punctuality: 0,
          status: "Average",
          validated: false,
        });
        setSelectedUserId("");

        await fetchEmployees();
        alert("✅ Performance record created successfully!");
      } else {
        alert("❌ Failed to create: " + result.message);
      }
    } catch (err) {
      console.error("❌ Error creating:", err);
      alert("❌ Failed to create performance record");
    }
  };

  /* -------------------- UI Computations -------------------- */
  // ✅ Filter to only show employees who don't have performance records yet
  const availableUsersForPerformance = allUsers.filter(user => {
    // Exclude admins
    if (user.role === 'ADMIN' || user.userRole === 'ADMIN') {
      return false;
    }

    // Only show users who don't have performance records yet
    const hasPerformance = employees.some(emp => emp.userId === user.id);
    return !hasPerformance;
  });

  const stats = {
    totalEmployees: employees.length,
    validated: employees.filter((e) => e.validated).length,
    pending: employees.filter((e) => !e.validated).length,
    avgScore:
      employees.length > 0
        ? (
          employees.reduce((sum, e) => sum + (e.currentScore || 0), 0) /
          employees.length
        ).toFixed(1)
        : "0.0",
    excellent: employees.filter((e) => e.status === "Excellent").length,
    needsImprovement: employees.filter((e) => e.status === "Needs Improvement").length,
  };

  const departments = ["All", ...new Set(employees.map((e) => e.department).filter(Boolean))];
  const statuses = ["All", "Excellent", "Good", "Average", "Needs Improvement"];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "All" || emp.department === filterDepartment;

    const matchesStatus = filterStatus === "All" || emp.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortBy) {
      case "score-desc":
        return (b.currentScore || 0) - (a.currentScore || 0);
      case "score-asc":
        return (a.currentScore || 0) - (b.currentScore || 0);
      case "name-asc":
        return (a.name || "").localeCompare(b.name || "");
      case "name-desc":
        return (b.name || "").localeCompare(a.name || "");
      case "attendance-desc":
        return (b.attendance || 0) - (a.attendance || 0);
      case "attendance-asc":
        return (a.attendance || 0) - (b.attendance || 0);
      default:
        return (b.currentScore || 0) - (a.currentScore || 0);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-blue-100 text-blue-800";
      case "Average":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    if (sortedEmployees.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent = [
      [
        "Employee ID",
        "Name",
        "Department",
        "Position",
        "Score",
        "Status",
        "Tasks Completed",
        "Total Tasks",
        "Attendance %",
        "Productivity %",
        "Quality Score %",
        "Punctuality %",
        "Validated",
      ],
      ...sortedEmployees.map((emp) => [
        emp.employeeId,
        emp.name,
        emp.department,
        emp.position,
        emp.currentScore,
        emp.status,
        emp.tasksCompleted,
        emp.totalTasks,
        emp.attendance,
        emp.productivity,
        emp.qualityScore,
        emp.punctuality,
        emp.validated ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_${tenantInfo.companyName}_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /* -------------------- Loading & Errors -------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading performance data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Company: {tenantInfo.companyName}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Error
          </h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={async () => {
                await fetchAllUsers();
                await fetchEmployees();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Performance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track employee performance metrics
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Performance
          </button>
        </div>
      </div>

      {/* Company Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold text-black">{tenantInfo.companyName}</h2>
              <p className="text-sm text-blue-100 text-black">
                Tenant: {tenantInfo.tenantCode}
                {tenantInfo.companyId && ` • ID: ${tenantInfo.companyId}`}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetchAllUsers();
              await fetchEmployees();
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees} color="blue" />
        <StatCard icon={CheckCircle} label="Validated" value={stats.validated} color="green" />
        <StatCard icon={Clock} label="Pending Validation" value={stats.pending} color="yellow" />
        <StatCard icon={Target} label="Average Score" value={stats.avgScore} color="purple" />
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Performance Distribution
          </h3>
          <div className="space-y-3">
            <ProgressBar label="Excellent" value={stats.excellent} total={stats.totalEmployees || 1} color="green" />
            <ProgressBar label="Good" value={employees.filter((e) => e.status === "Good").length} total={stats.totalEmployees || 1} color="blue" />
            <ProgressBar label="Average" value={employees.filter((e) => e.status === "Average").length} total={stats.totalEmployees || 1} color="yellow" />
            <ProgressBar label="Needs Improvement" value={stats.needsImprovement} total={stats.totalEmployees || 1} color="red" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Validation Rate</span>
              <span className="font-semibold text-lg text-gray-900">
                {stats.totalEmployees > 0
                  ? ((stats.validated / stats.totalEmployees) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">High Performers (90+)</span>
              <span className="font-semibold text-lg text-gray-900">
                {employees.filter((e) => (e.currentScore || 0) >= 90).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Needs Attention (&lt;70)</span>
              <span className="font-semibold text-lg text-red-600">
                {employees.filter((e) => (e.currentScore || 0) < 70).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="score-desc">Score: High to Low</option>
            <option value="score-asc">Score: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="attendance-desc">Attendance: High to Low</option>
            <option value="attendance-asc">Attendance: Low to High</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEmployees.map((employee, index) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  rank={index + 1}
                  editingEmployee={editingEmployee}
                  editForm={editForm}
                  onEdit={handleEdit}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  updateEditForm={updateEditForm}
                  onView={() => {
                    setSelectedEmployee(employee);
                    setShowModal(true);
                  }}
                  onValidate={handleValidate}
                  onReject={handleReject}
                  getStatusColor={getStatusColor}
                />
              ))}
            </tbody>
          </table>
        </div>

        {sortedEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No performance records found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterDepartment !== "All" || filterStatus !== "All"
                ? "Try adjusting your filters"
                : "Click 'Add Performance' to create a new record"}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowModal(false);
            setSelectedEmployee(null);
          }}
          onValidate={handleValidate}
          onReject={handleReject}
        />
      )}

      {showCreateModal && (
        <CreateModal
          createForm={createForm}
          updateCreateForm={updateCreateForm}
          allUsers={availableUsersForPerformance}
          selectedUserId={selectedUserId}
          onUserSelect={handleUserSelection}
          onSave={handleCreatePerformance}
          onClose={() => {
            setShowCreateModal(false);
            setCreateForm({
              currentScore: 0,
              attendance: 0,
              tasksCompleted: 0,
              totalTasks: 0,
              productivity: 0,
              qualityScore: 0,
              punctuality: 0,
              status: "Average",
              validated: false,
            });
            setSelectedUserId("");
          }}
        />
      )}
    </div>
  );
}

// ... Rest of the component code remains exactly the same ...
// (StatCard, ProgressBar, EmployeeRow, MetricBar, EmployeeModal, CreateModal)

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function EmployeeRow({
  employee,
  rank,
  editingEmployee,
  editForm,
  onEdit,
  onSave,
  onCancel,
  updateEditForm,
  onView,
  onValidate,
  onReject,
  getStatusColor,
}) {
  if (editingEmployee === employee.id) {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-black">
          <span className="font-bold text-gray-500">#{rank}</span>
        </td>
        <td className="px-6 py-4 text-black">
          <input
            type="text"
            value={editForm.name || ""}
            onChange={(e) => updateEditForm("name", e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            value={editForm.employeeId || ""}
            disabled
            className="w-full px-2 py-1 mt-1 bg-gray-100 border rounded text-xs"
          />
        </td>
        <td className="px-6 py-4 text-black">
          <input
            type="text"
            value={editForm.department || ""}
            onChange={(e) => updateEditForm("department", e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            value={editForm.position || ""}
            onChange={(e) => updateEditForm("position", e.target.value)}
            className="w-full px-2 py-1 mt-1 border rounded text-xs"
          />
        </td>
        <td className="px-6 py-4 text-black">
          <input
            type="number"
            value={editForm.currentScore || 0}
            onChange={(e) => updateEditForm("currentScore", parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border rounded text-sm"
            min="0"
            max="100"
          />
        </td>
        <td className="px-6 py-4 text-black">
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={editForm.tasksCompleted || 0}
              onChange={(e) => updateEditForm("tasksCompleted", parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border rounded text-sm"
              min="0"
            />
            <span>/</span>
            <input
              type="number"
              value={editForm.totalTasks || 0}
              onChange={(e) => updateEditForm("totalTasks", parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border rounded text-sm"
              min="0"
            />
          </div>
        </td>
        <td className="px-6 py-4 text-black">
          <input
            type="number"
            value={editForm.attendance || 0}
            onChange={(e) => updateEditForm("attendance", parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border rounded text-sm"
            min="0"
            max="100"
          />
        </td>
        <td className="px-6 py-4 text-black">
          <select
            value={editForm.status || "Average"}
            onChange={(e) => updateEditForm("status", e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option>Excellent</option>
            <option>Good</option>
            <option>Average</option>
            <option>Needs Improvement</option>
          </select>
        </td>
        <td className="px-6 py-4 text-black">
          <div className="flex gap-2">
            <button onClick={onSave} className="text-green-600 hover:text-green-800">
              <Save className="w-5 h-5" />
            </button>
            <button onClick={onCancel} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {rank <= 3 ? (
            <span
              className={`font-bold text-lg ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-orange-600"
                }`}
            >
              #{rank}
            </span>
          ) : (
            <span className="font-semibold text-gray-500">#{rank}</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{employee.name || "N/A"}</div>
        <div className="text-sm text-gray-600">{employee.employeeId || "N/A"}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{employee.department || "N/A"}</div>
        <div className="text-xs text-gray-600">{employee.position || "N/A"}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">{employee.currentScore || 0}</span>
          {(employee.currentScore || 0) >= 90 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (employee.currentScore || 0) < 70 ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <span className="font-medium text-gray-900">{employee.tasksCompleted || 0}</span>
          <span className="text-gray-600">/{employee.totalTasks || 0}</span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">{employee.attendance || 0}%</span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
          {employee.status || "N/A"}
        </span>

        {employee.validated && (
          <div className="mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Validated
            </span>
          </div>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <button onClick={onView} className="text-blue-600 hover:text-blue-800" title="View">
            <Eye className="w-5 h-5" />
          </button>
          <button onClick={() => onEdit(employee)} className="text-orange-600 hover:text-orange-800" title="Edit">
            <Edit className="w-5 h-5" />
          </button>
          {!employee.validated ? (
            <button
              onClick={() => onValidate(employee.id)}
              className="text-green-600 hover:text-green-800"
              title="Validate"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => onReject(employee.id)}
              className="text-red-600 hover:text-red-800"
              title="Revoke"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function MetricBar({ label, value }) {
  const safeValue = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{safeValue.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function EmployeeModal({ employee, onClose, onValidate, onReject }) {
  const taskCompletionRate =
    employee.totalTasks > 0 ? (employee.tasksCompleted / employee.totalTasks) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name || "N/A"}</h2>
              <p className="text-gray-600">{employee.employeeId || "N/A"}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-black">
            <div>
              <label className="text-sm text-gray-600">Department</label>
              <p className="font-medium text-gray-900">{employee.department || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Position</label>
              <p className="font-medium text-gray-900">{employee.position || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Performance Score</label>
              <p className="text-2xl font-bold text-blue-600">{employee.currentScore || 0}/100</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mt-1 ${employee.status === "Excellent"
                  ? "bg-green-100 text-green-800"
                  : employee.status === "Good"
                    ? "bg-blue-100 text-blue-800"
                    : employee.status === "Average"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
              >
                {employee.status || "N/A"}
              </span>
            </div>
          </div>

          <div className="border-t pt-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <MetricBar label="Task Completion" value={taskCompletionRate} />
              <MetricBar label="Attendance" value={employee.attendance || 0} />
              <MetricBar label="Productivity" value={employee.productivity || 0} />
              <MetricBar label="Quality Score" value={employee.qualityScore || 0} />
              <MetricBar label="Punctuality" value={employee.punctuality || 0} />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Validation Status</p>
                <p className="font-medium">
                  {employee.validated ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Validated
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pending
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                {!employee.validated ? (
                  <button
                    onClick={() => {
                      onValidate(employee.id);
                      onClose();
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Validate
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onReject(employee.id);
                      onClose();
                    }}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <XCircle className="w-5 h-5" />
                    Revoke
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateModal({
  createForm,
  updateCreateForm,
  allUsers,
  selectedUserId,
  onUserSelect,
  onSave,
  onClose,
}) {
  const getUserDisplayName = (user) => {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.username) return user.username;
    return user.email;
  };

  const getUserEmployeeId = (user) => user.employeeId || user.username || `EMP${user.id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Performance Record</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee *</label>

            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => onUserSelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none"
              >
                <option value="">-- Select an Employee --</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserEmployeeId(user)} - {getUserDisplayName(user)}
                    {user.department && ` (${user.department})`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {allUsers.length === 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                No employees available. All employees already have performance records.
              </p>
            )}
          </div>

          {selectedUserId && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={createForm.employeeId || ""}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-black  "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={createForm.name || ""}
                    onChange={(e) => updateCreateForm("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Enter employee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={createForm.department || ""}
                    onChange={(e) => updateCreateForm("department", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={createForm.position || ""}
                    onChange={(e) => updateCreateForm("position", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Software Developer"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Performance Metrics
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Score (0-100) *
                    </label>
                    <input
                      type="number"
                      value={createForm.currentScore || 0}
                      onChange={(e) => updateCreateForm("currentScore", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attendance % *</label>
                    <input
                      type="number"
                      value={createForm.attendance || 0}
                      onChange={(e) => updateCreateForm("attendance", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed *</label>
                    <input
                      type="number"
                      value={createForm.tasksCompleted || 0}
                      onChange={(e) => updateCreateForm("tasksCompleted", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Tasks *</label>
                    <input
                      type="number"
                      value={createForm.totalTasks || 0}
                      onChange={(e) => updateCreateForm("totalTasks", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Productivity % *</label>
                    <input
                      type="number"
                      value={createForm.productivity || 0}
                      onChange={(e) => updateCreateForm("productivity", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score % *</label>
                    <input
                      type="number"
                      value={createForm.qualityScore || 0}
                      onChange={(e) => updateCreateForm("qualityScore", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Punctuality % *</label>
                    <input
                      type="number"
                      value={createForm.punctuality || 0}
                      onChange={(e) => updateCreateForm("punctuality", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={createForm.status || "Average"}
                      onChange={(e) => updateCreateForm("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              disabled={!selectedUserId}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${selectedUserId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              <Save className="w-5 h-5" />
              Create Performance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}