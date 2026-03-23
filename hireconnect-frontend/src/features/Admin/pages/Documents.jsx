import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  Calendar,
  Users,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Package,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  Loader2,
  AlertTriangle,
  Shield,
} from "lucide-react";

const primaryBlue = "#00008B";

// Resolve API base URL safely
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const AdminDocuments = () => {
  const [employees, setEmployees] = useState([]);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // NEW: Track auth state

  // Check authentication and authorization on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      const userId = localStorage.getItem("userId");

      console.log("=== Authentication Check ===");
      console.log("🔑 Token exists:", !!token);
      console.log("👤 User ID:", userId);
      console.log("🛡️ User Role:", userRole);
      console.log("===========================");

      if (!token) {
        showMessage("error", "No authentication token found. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        setAuthChecked(true);
        return;
      }

      if (userRole !== "ADMIN") {
        showMessage(
          "error",
          `Access denied. Admin privileges required. Your role: ${userRole || "none"}`
        );
        setAuthChecked(true);
        return;
      }

      console.log("✅ Authentication successful - Admin access granted");
      setIsAuthenticated(true);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Fetch all documents grouped by employees
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      fetchAllDocuments();
    }
  }, [authChecked, isAuthenticated]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const fetchAllDocuments = async (showRefreshMessage = false) => {
    if (showRefreshMessage) setRefreshing(true);
    else setLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");

      const tenantCode = localStorage.getItem("tenantCode");
      const companyId = localStorage.getItem("companyId");

      const response = await fetch(
        `${baseUrl}/api/documents/admin/all-documents`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Code": tenantCode,
            "X-Company-Id": companyId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load documents (${response.status})`);
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      showMessage("error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // Filter employees based on search and status
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        search.trim() === "" ||
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.id?.toString().toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase());

      // Filter by status
      if (statusFilter !== "ALL") {
        const hasMatchingStatus = emp.documents?.some(
          (doc) => doc.status?.toUpperCase() === statusFilter
        );
        return matchesSearch && hasMatchingStatus;
      }

      return matchesSearch;
    });
  }, [employees, search, statusFilter]);

  // Toggle employee expansion
  const toggleEmployee = (employeeId) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  // Handle download single document
  const handleDownload = async (doc, event) => {
    if (event) {
      event.stopPropagation();
    }

    if (!doc || !doc.id) {
      showMessage("error", "Invalid document");
      return;
    }

    try {
      showMessage("info", `Downloading ${doc.fileName || "document"}...`);

      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("token");

      const downloadUrl = `${baseUrl}/api/documents/download/${doc.id}`;
      console.log("⬇️ Downloading from:", downloadUrl);

      try {
        const response = await fetch(downloadUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = doc.fileName || "document";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        showMessage("success", `Downloaded ${doc.fileName || "document"}`);
      } catch (_fetchError) {
        console.log("⚠️ Direct download failed, opening in new tab");
        window.open(downloadUrl, "_blank");
        showMessage("info", `Opened ${doc.fileName || "document"} in new tab`);
      }
    } catch (error) {
      console.error("❌ Download error:", error);
      showMessage("error", `Failed to download ${doc.fileName || "document"}`);
    }
  };

  // Handle download all documents for an employee
  const handleDownloadAll = async (employee, event) => {
    if (event) {
      event.stopPropagation();
    }

    const validDocs = employee.documents || [];

    if (validDocs.length === 0) {
      showMessage("error", "No documents available for download");
      return;
    }

    showMessage("info", `Preparing to download ${validDocs.length} document(s)...`);

    let successCount = 0;
    let failCount = 0;

    // Download all documents with delay
    for (let i = 0; i < validDocs.length; i++) {
      try {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        await handleDownload(validDocs[i], null);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to download document ${i + 1}:`, error);
      }
    }

    if (failCount === 0) {
      showMessage("success", `All ${successCount} document(s) downloaded successfully`);
    } else {
      showMessage("error", `Downloaded ${successCount} documents, ${failCount} failed`);
    }
  };

  // Handle view document
  const handleViewDocument = (doc, event) => {
    if (event) {
      event.stopPropagation();
    }

    if (!doc || !doc.id) {
      showMessage("error", "Invalid document");
      return;
    }

    const baseUrl = getApiBaseUrl();
    const viewUrl = `${baseUrl}/api/documents/download/${doc.id}`;

    window.open(viewUrl, "_blank");
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle2 size={14} />;
      case "REJECTED":
        return <XCircle size={14} />;
      case "PENDING":
      case "SUBMITTED":
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const allDocs = employees.flatMap((emp) => emp.documents || []);
    return {
      totalEmployees: employees.length,
      totalDocs: allDocs.length,
      pending: allDocs.filter(
        (d) =>
          d.status?.toUpperCase() === "PENDING" ||
          d.status?.toUpperCase() === "SUBMITTED"
      ).length,
      approved: allDocs.filter((d) => d.status?.toUpperCase() === "APPROVED").length,
      rejected: allDocs.filter((d) => d.status?.toUpperCase() === "REJECTED").length,
    };
  }, [employees]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md w-full text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (authChecked && !isAuthenticated) {
    const currentUserRole = localStorage.getItem("userRole");
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Current Role:</p>
            <p className="text-lg font-semibold text-gray-800">{currentUserRole || "Not authenticated"}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Main content - only renders if authenticated
  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 md:px-8 py-6">
      {/* Header */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"
        style={{ backgroundColor: primaryBlue }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-white">Documents Dashboard</h1>
            <span className="px-2 py-1 bg-white/20 rounded text-xs text-white font-medium">Admin</span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
            Manage employee documents, track uploads, and monitor document status in one centralized location.
          </p>
        </div>
        <button
          onClick={() => fetchAllDocuments(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Rest of your JSX remains exactly the same... */}
      {/* Message Alert */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 shadow-sm ${message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.type === "info"
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={20} className="flex-shrink-0" />
          ) : message.type === "info" ? (
            <AlertCircle size={20} className="flex-shrink-0" />
          ) : (
            <AlertTriangle size={20} className="flex-shrink-0" />
          )}
          <span className="font-medium flex-1">{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FolderOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDocs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter - same as before */}
      <div className="bg-white rounded-3xl px-6 py-4 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by employee name, ID, or email"
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F6F7FB] border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-[#F6F7FB] border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rest of the employee list JSX remains exactly the same as your original code */}
      {/* Section title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#011A8B]">
          Employees List ({filteredEmployees.length})
        </h2>
        {filteredEmployees.length > 0 && (
          <p className="text-sm text-gray-500">
            {filteredEmployees.reduce((sum, emp) => sum + (emp.documents?.length || 0), 0)}{" "}
            total documents
          </p>
        )}
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm p-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Loading documents...</p>
            <p className="text-sm text-gray-400 mt-1">Please wait</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No employees found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "No employees with documents available"}
            </p>
            {employees.length === 0 && !loading && (
              <button
                onClick={() => fetchAllDocuments(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry Loading
              </button>
            )}
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const filteredDocs =
              statusFilter === "ALL"
                ? employee.documents
                : employee.documents?.filter((doc) => doc.status?.toUpperCase() === statusFilter);

            return (
              <div key={employee.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                {/* Employee Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleEmployee(employee.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {employee.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{employee.name || "Unknown Employee"}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                        <p className="text-sm text-gray-500">ID: {employee.id}</p>
                        {employee.email && (
                          <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full flex-shrink-0">
                      <Package size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">{filteredDocs?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {(filteredDocs?.length || 0) > 0 && (
                      <button
                        onClick={(e) => handleDownloadAll(employee, e)}
                        className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                        title="Download all documents"
                      >
                        <Download size={16} />
                        <span className="hidden md:inline">Download All</span>
                      </button>
                    )}
                    {expandedEmployee === employee.id ? (
                      <ChevronDown size={24} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={24} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Documents List - Expanded */}
                {expandedEmployee === employee.id && (
                  <div className="border-t border-gray-100">
                    {filteredDocs && filteredDocs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#F5F6FB]">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Document Type</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">File Name</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded On</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDocs.map((doc, index) => (
                              <tr key={doc.id || index} className="border-b last:border-b-0 hover:bg-[#F9FAFF] transition">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{doc.documentType || "N/A"}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-gray-700 font-medium">{doc.fileName || "Unknown"}</div>
                                  {doc.fileSize && (
                                    <div className="text-xs text-gray-500 mt-0.5">{doc.fileSize}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                                    {getStatusIcon(doc.status)}
                                    {doc.status || "N/A"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    {doc.uploadedOn || "N/A"}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={(e) => handleViewDocument(doc, e)}
                                      className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
                                      title="View Document"
                                    >
                                      <Eye size={16} className="text-gray-700" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDownload(doc, e)}
                                      className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 transition"
                                      title="Download Document"
                                    >
                                      <Download size={16} className="text-gray-700" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">No documents found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {statusFilter !== "ALL"
                            ? `No ${statusFilter.toLowerCase()} documents for this employee`
                            : "This employee hasn't uploaded any documents yet"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminDocuments;
