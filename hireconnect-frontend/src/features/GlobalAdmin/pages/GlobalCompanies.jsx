
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutGrid, Building2, CreditCard, Users, BarChart3, Headphones,
  ChevronLeft, ChevronRight, Search, Plus, Edit2, Trash2, Eye,
  CheckCircle, XCircle, Download, UserPlus, Database, Calendar,
  AlertCircle, Loader2, X
} from "lucide-react";

// API Configuration
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

const API_BASE_URL = `${getApiBaseUrl()}/api/global-admin/companies`;




// Menu Items
const MENU_ITEMS = [
  { id: "dashboard", label: "Global Dashboard", icon: "dashboard", path: "/global-admin", exact: true },
  { id: "companies", label: "Companies", icon: "company", path: "/global-admin/companies" },
  { id: "billing", label: "Subscriptions & Billing", icon: "billing", path: "/global-admin/billing" },
  { id: "users", label: "User & Role Management", icon: "users", path: "/global-admin/users" },
  { id: "reports", label: "Reports & Analytics", icon: "reports", path: "/global-admin/reports" },
  { id: "support", label: "Support Tickets", icon: "support", path: "/global-admin/support" },
];



function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[70] px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${type === "success" ? "bg-green-500 text-white" : type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
      }`}>
      {type === "success" && <CheckCircle size={20} />}
      {type === "error" && <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
}

function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [statistics, setStatistics] = useState({
    totalCompanies: 0, activeCompanies: 0, suspendedCompanies: 0, totalEmployees: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => setToast({ message, type });

  const getAuthHeader = () => {
    const raw =
      (localStorage.getItem("token") || "").trim() ||
      (sessionStorage.getItem("token") || "").trim();
    if (!raw) return {};
    return { Authorization: /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}` };
  };

  const parseApiResponse = async (response) => {
    const raw = await response.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(raw || `Request failed with status ${response.status}`);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const result = await parseApiResponse(response);
      if (result.success) {
        setCompanies(result.data);
      } else {
        showToast("Failed to fetch companies", "error");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const result = await parseApiResponse(response);
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchStatistics();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = (company.displayName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (company.admin?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (company.adminEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || company.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateCompany = async (payload) => {
    setLoading(true);
    try {
      const companyPayload = payload?.company || payload;
      const logoFile = payload?.logoFile || null;

      const cleanData = {
        ...companyPayload,
        storage: undefined,
        createdDate: undefined,
        updatedDate: undefined
      };

      console.log("Sending data:", cleanData); // Debug log

      let response;
      if (logoFile) {
        const body = new FormData();
        body.append("company", JSON.stringify(cleanData));
        body.append("logo", logoFile);
        response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            ...getAuthHeader(),
          },
          body,
        });
      } else {
        response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify(cleanData),
        });
      }

      const result = await parseApiResponse(response);
      console.log("Response:", result); // Debug log

      if (result.success) {
        showToast("Company created successfully!", "success");
        setShowCreateModal(false);
        await fetchCompanies();
        await fetchStatistics();
      } else {
        showToast(result.message || "Failed to create company", "error");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      showToast("Error creating company: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (id, formData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });
      const result = await parseApiResponse(response);
      if (result.success) {
        showToast("Company updated successfully!", "success");
        setShowEditModal(false);
        setSelectedCompany(null);
        await fetchCompanies();
        await fetchStatistics();
      } else {
        showToast(result.message || "Failed to update company", "error");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      showToast("Error updating company", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });
      const result = await parseApiResponse(response);
      if (result.success) {
        showToast("Company deleted successfully!", "success");
        await fetchCompanies();
        await fetchStatistics();
      } else {
        showToast(result.message || "Failed to delete company", "error");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      showToast("Error deleting company", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
        },
      });
      const result = await parseApiResponse(response);
      if (result.success) {
        showToast("Status updated successfully!", "success");
        await fetchCompanies();
        await fetchStatistics();
      } else {
        showToast(result.message || "Failed to toggle status", "error");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Error toggling status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!filteredCompanies.length) {
      showToast("No companies available to export", "error");
      return;
    }

    try {
      const datePart = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      doc.setFontSize(16);
      doc.text("Company Management Export", 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 58);

      const headers = [[
        "ID",
        "Company Name",
        "Admin",
        "Admin Email",
        "Employees",
        "Plan",
        "Status",
        "Created Date",
      ]];

      const rows = filteredCompanies.map((company) => ([
        String(company.id ?? ""),
        String(company.displayName ?? ""),
        String(company.admin ?? ""),
        String(company.adminEmail ?? ""),
        `${Number(company.employees || 0)} / ${Number(company.employeeLimit || 0)}`,
        String(company.plan ?? ""),
        String(company.status ?? ""),
        String(company.createdDate ?? ""),
      ]));

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 75,
        styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
        headStyles: { fillColor: [0, 0, 139], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`companies-export-${datePart}.pdf`);
      showToast("Companies exported to PDF successfully", "success");
    } catch (error) {
      console.error("Error exporting companies PDF:", error);
      showToast("Failed to export companies PDF", "error");
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-[#00008B] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Company Management</h1>
            <p className="text-blue-100">Manage all tenant companies, set limits, and control access</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="bg-white text-[#00008B] px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
          >
            <Plus size={20} />
            Add New Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Companies", value: statistics.totalCompanies, icon: Building2, color: "blue" },
          { label: "Active Companies", value: statistics.activeCompanies, icon: CheckCircle, color: "green" },
          { label: "Suspended", value: statistics.suspendedCompanies, icon: XCircle, color: "red" },
          { label: "Total Employees", value: statistics.totalEmployees, icon: Users, color: "purple" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
              <stat.icon className={`text-${stat.color}-500`} size={32} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company name, admin, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download size={20} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {!loading && filteredCompanies.length === 0 && (
          <div className="text-center p-8 text-gray-500">No companies found</div>
        )}

        {!loading && filteredCompanies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#00008B] text-white">
                <tr>
                  {["ID", "Company Name", "Admin", "Employees", "Plan", "Status", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-sm font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">{company.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {(company.displayName || "C").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{company.displayName}</p>
                          <p className="text-xs text-gray-500">Created: {company.createdDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{company.admin}</p>
                        <p className="text-xs text-gray-500">{company.adminEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {company.employees} / {company.employeeLimit}
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${company.employeeLimit ? (company.employees / company.employeeLimit) * 100 : 0}%`
                            }}

                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.plan === "Enterprise" ? "bg-purple-100 text-purple-700" :
                        company.plan === "Professional" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                        {company.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(company.id)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${company.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          } disabled:opacity-50`}
                      >
                        {company.status === "active" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {company.status === "active" ? "Active" : "Suspended"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedCompany(company); setShowViewModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => { setSelectedCompany(company); setShowEditModal(true); }}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition"
                          title="Edit Company"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          disabled={loading}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition disabled:opacity-50"
                          title="Delete Company"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateCompanyModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateCompany} loading={loading} />
      )}

      {showViewModal && selectedCompany && (
        <ViewCompanyModal company={selectedCompany} onClose={() => { setShowViewModal(false); setSelectedCompany(null); }} />
      )}

      {showEditModal && selectedCompany && (
        <EditCompanyModal
          company={selectedCompany}
          onClose={() => { setShowEditModal(false); setSelectedCompany(null); }}
          onSubmit={(formData) => handleUpdateCompany(selectedCompany.id, formData)}
          loading={loading}
        />
      )}
    </div>
  );
}
export default CompaniesPage;


function CreateCompanyModal({ onClose, onSubmit, loading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [formData, setFormData] = useState({
    legalName: "",
    displayName: "",
    tenantCode: "",
    organizationType: "",
    industry: "",
    gstNo: "",
    admin: "",
    adminEmail: "",
    mobileNumber: "",
    role: "COMPANY_ADMIN",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    companyOfficialEmail: "",
    companyOfficialPassword: "",
    phoneNumber: "",
    website: "",
    plan: "Basic",
    employees: 0,
    employeeLimit: 50,
    storageLimit: "10 GB",
    billingCycle: "monthly",
    startDate: new Date().toISOString().split("T")[0]
  });

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Admin Details", icon: UserPlus },
    { number: 3, title: "Contact Info", icon: CreditCard },
    { number: 4, title: "Subscription", icon: Calendar }
  ];

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data before submit:", formData); // Debug
    onSubmit({ company: formData, logoFile });
  };

  const updateFormData = (field, value) => {
    const normalizedValue =
      field === "tenantCode" ? String(value || "").toUpperCase() : value;
    setFormData({ ...formData, [field]: normalizedValue });
  };

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setLogoError("");

    if (!file) {
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setLogoError("Only JPG, JPEG, and PNG files are allowed.");
      setLogoFile(null);
      setLogoPreview("");
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setLogoError("Logo size must be 5MB or less.");
      setLogoFile(null);
      setLogoPreview("");
      e.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-[#00008B] p-6 text-white rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Company</h2>
            <p className="text-blue-100 text-sm mt-1">Step {currentStep} of 4: {steps[currentStep - 1].title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isActive ? "bg-[#00008B] text-white ring-4 ring-blue-200" :
                      isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                      {isCompleted ? <CheckCircle size={24} /> : <StepIcon size={24} />}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? "text-[#00008B]" : "text-gray-500"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded transition ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={currentStep === 4 ? handleSubmit : handleNext} className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Legal Name *</label>
                  <input
                    type="text" required value={formData.legalName}
                    onChange={(e) => updateFormData("legalName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter legal company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                  <input
                    type="text" required value={formData.displayName}
                    onChange={(e) => updateFormData("displayName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Code *</label>
                  <input
                    type="text" required value={formData.tenantCode}
                    onChange={(e) => updateFormData("tenantCode", e.target.value)}
                    style={{ textTransform: "uppercase" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., TECH001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type *</label>
                  <select
                    required value={formData.organizationType}
                    onChange={(e) => updateFormData("organizationType", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="LLP">LLP</option>
                  </select>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                    <select
                      required value={formData.industry}
                      onChange={(e) => updateFormData("industry", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select industry</option>
                      {["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Other"].map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST No</label>
                    <input
                      type="text"
                      value={formData.gstNo}
                      onChange={(e) => updateFormData("gstNo", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo (Optional)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Allowed: JPG, JPEG, PNG. Max size: 5MB.</p>
                  {logoError && <p className="text-xs text-red-600 mt-1">{logoError}</p>}
                  {logoPreview && (
                    <div className="mt-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-20 w-20 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Admin Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Full Name *</label>
                  <input
                    type="text" required value={formData.admin}
                    onChange={(e) => updateFormData("admin", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter admin full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
                  <input
                    type="email" required value={formData.adminEmail}
                    onChange={(e) => updateFormData("adminEmail", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    type="tel" required value={formData.mobileNumber}
                    onChange={(e) => updateFormData("mobileNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text" value={formData.role} disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <textarea
                    required value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter complete address" rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text" required value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text" required value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text" required value={formData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    type="text" required value={formData.pincode}
                    onChange={(e) => updateFormData("pincode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Official Email *</label>
                  <input
                    type="email" required value={formData.companyOfficialEmail}
                    onChange={(e) => updateFormData("companyOfficialEmail", e.target.value.trim().toLowerCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Official Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.companyOfficialPassword}
                    onChange={(e) => updateFormData("companyOfficialPassword", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel" required value={formData.phoneNumber}
                    onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 044 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url" value={formData.website}
                    onChange={(e) => updateFormData("website", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type *</label>
                  <select
                    required value={formData.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      updateFormData("plan", plan);
                      const limits = {
                        Basic: { employeeLimit: 50, storageLimit: "10 GB" },
                        Professional: { employeeLimit: 100, storageLimit: "20 GB" },
                        Enterprise: { employeeLimit: 500, storageLimit: "50 GB" }
                      };
                      const selected = limits[plan];
                      if (selected) {
                        setFormData(prev => ({
                          ...prev,
                          plan: plan,
                          employeeLimit: selected.employeeLimit,
                          storageLimit: selected.storageLimit
                        }));
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Limit *</label>
                  <input
                    type="number" required value={formData.employeeLimit}
                    onChange={(e) => updateFormData("employeeLimit", parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle *</label>
                  <select
                    required value={formData.billingCycle}
                    onChange={(e) => updateFormData("billingCycle", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date" required value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Employees *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.employees}
                    onChange={(e) =>
                      updateFormData("employees", Number(e.target.value || 0))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <button
                  type="button" onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button" onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              {currentStep < 4 ? (
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#00008B] text-white rounded-lg hover:bg-[#000070] transition flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit" disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <CheckCircle size={20} />
                  Create Company
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewCompanyModal({ company, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-[#00008B] p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{company.displayName}</h2>
              <p className="text-blue-100 text-sm mt-1">Company Details</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${company.status === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}>
              {company.status === "active" ? "Active" : "Suspended"}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-800">Basic Information</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Legal Name</p>
                  <p className="text-sm font-medium text-gray-800">{company.legalName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tenant Code</p>
                  <p className="text-sm font-medium text-gray-800">{company.tenantCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Industry</p>
                  <p className="text-sm font-medium text-gray-800">{company.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">GST No</p>
                  <p className="text-sm font-medium text-gray-800">{company.gstNo || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-800">Admin Information</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Admin Name</p>
                  <p className="text-sm font-medium text-gray-800">{company.admin}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{company.adminEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="text-sm font-medium text-gray-800">{company.mobileNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="text-purple-600" size={20} />
                <h3 className="font-semibold text-gray-800">Subscription</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Plan Type</p>
                  <p className="text-sm font-medium text-gray-800">{company.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Billing Cycle</p>
                  <p className="text-sm font-medium text-gray-800">{company.billingCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-sm font-medium text-gray-800">{company.startDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-800">Employee Usage</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Current / Limit</p>
                  <p className="text-sm font-medium text-gray-800">
                    {company.employees} / {company.employeeLimit}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${(company.employees / company.employeeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="text-orange-600" size={20} />
                <h3 className="font-semibold text-gray-800">Contact Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-800">{company.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">City, State</p>
                  <p className="text-sm font-medium text-gray-800">{company.city}, {company.state}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-800">{company.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Website</p>
                  <p className="text-sm font-medium text-gray-800">{company.website || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#00008B] text-white rounded-lg hover:bg-[#000070] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCompanyModal({ company, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    legalName: company.legalName || "",
    displayName: company.displayName || "",
    tenantCode: company.tenantCode || "",
    organizationType: company.organizationType || "",
    industry: company.industry || "",
    admin: company.admin || "",
    adminEmail: company.adminEmail || "",
    mobileNumber: company.mobileNumber || "",
    role: company.role || "COMPANY_ADMIN",
    address: company.address || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "",
    pincode: company.pincode || "",
    officialEmail: company.officialEmail || "",
    phoneNumber: company.phoneNumber || "",
    website: company.website || "",
    plan: company.plan || "Basic",
    employeeLimit: company.employeeLimit || 50,
    storageLimit: company.storageLimit || "10 GB",
    billingCycle: company.billingCycle || "monthly",
    startDate: company.startDate || new Date().toISOString().split("T")[0],
    status: company.status || "active",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Company</h2>
            <p className="text-green-100 text-sm mt-1">Update company information and settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name *</label>
              <input
                type="text" required value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
              <input
                type="text" required value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name *</label>
              <input
                type="text" required value={formData.admin}
                onChange={(e) => setFormData({ ...formData, admin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
              <input
                type="email" required value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan *</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Basic">Basic</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Limit *</label>
              <input
                type="number" required value={formData.employeeLimit}
                onChange={(e) => setFormData({ ...formData, employeeLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button" onClick={onClose} disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
