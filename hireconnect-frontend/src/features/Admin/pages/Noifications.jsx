import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";

import {
  Bell,
  Search,
  Trash2,
  Edit3,
  Pin,
  Filter,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  Check,
  Calendar,
  Clock,
  Paperclip,
  Mail,
  Eye,
  Save,
  Send,
  Archive,
} from "lucide-react";

// ENV Variable for API Base URL
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ helpers
const getCompanyId = () => (localStorage.getItem("companyId") || "").trim();
const getTenantCode = () => (localStorage.getItem("tenantCode") || "").trim();

// ✅ attach tenant headers automatically for every request
api.interceptors.request.use((config) => {
  const companyId = getCompanyId();
  const tenantCode = getTenantCode();

  config.headers = config.headers || {};
  if (companyId) config.headers["X-Company-Id"] = companyId;
  if (tenantCode) config.headers["X-Tenant-Code"] = tenantCode;

  // if you also use token auth
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  return config;
});

const DEPARTMENTS = [
  "IT & Engineering",
  "HR & Admin",
  "Finance",
  "Sales & Marketing",
  "Operations",
  "Legal",
];

// ✅ datetime-local -> ISO
const toIsoOrNull = (dtLocal) => {
  if (!dtLocal) return null;
  // dtLocal looks like: "2026-02-09T18:30"
  const date = new Date(dtLocal);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  // --- FORM STATE ---
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("LOW");
  const [isPinned, setIsPinned] = useState(false);

  // Targeting
  const [targetType, setTargetType] = useState("ALL");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [targetEmployeeIds, setTargetEmployeeIds] = useState("");

  // Advanced Features State
  const [publishDate, setPublishDate] = useState(""); // datetime-local
  const [expiryDate, setExpiryDate] = useState(""); // datetime-local
  const [reqAck, setReqAck] = useState(false);
  const [channels, setChannels] = useState({ email: false, push: false });
  const [attachment, setAttachment] = useState(null);

  const [editingId, setEditingId] = useState(null);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("PUBLISHED");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-clear error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // ✅ headers automatically attached by interceptor
      const res = await api.get("/api/admin/notifications");

      const data = res.data || [];

      const sorted = data.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDeptDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- HANDLERS ----------
  const handleFileChange = (e) => {
    if (e.target.files[0]) setAttachment(e.target.files[0]);
  };

  const toggleDept = (dept) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const handleSubmit = async (saveAsDraft = false) => {
    if (!title.trim() || !message.trim()) {
      alert("Title and message are required");
      return;
    }

    const companyId = getCompanyId();
    const tenantCode = getTenantCode();

    if (!companyId || !tenantCode) {
      setError("companyId / tenantCode missing. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    // 1) Status logic
    let calculatedStatus = saveAsDraft ? "DRAFT" : "PUBLISHED";
    if (!saveAsDraft && publishDate && new Date(publishDate) > new Date()) {
      calculatedStatus = "SCHEDULED";
    }

    // 2) Build FormData
    const formData = new FormData();

    // ✅ tenant/company
    formData.append("companyId", companyId);
    formData.append("tenantCode", tenantCode);

    formData.append("title", title);
    formData.append("message", message);
    formData.append("priority", priority);
    formData.append("status", calculatedStatus);

    formData.append("pinned", String(isPinned));
    formData.append("reqAck", String(reqAck));
    formData.append("sendEmail", String(channels.email));
    formData.append("sendPush", String(channels.push));

    formData.append("targetType", targetType);

    // Arrays
    selectedDepts.forEach((d) => formData.append("targetDepts", d));

    const ids = targetEmployeeIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== "");

    ids.forEach((id) => formData.append("targetEmployeeIds", id));

    // ✅ scheduledAt + expiresAt
    // If publishDate empty -> send now
    const scheduledIso = toIsoOrNull(publishDate) || new Date().toISOString();
    formData.append("scheduledAt", scheduledIso);

    // ❌ do NOT send expiresAt = "" (causes 500 sometimes)
    const expiresIso = toIsoOrNull(expiryDate);
    if (expiresIso) formData.append("expiresAt", expiresIso);

    if (attachment && attachment?.name) {
      // if in edit mode you set attachment as {name:..} we shouldn't send that fake object
      // only send if it's a File
      if (attachment instanceof File) formData.append("attachment", attachment);
    } else if (attachment instanceof File) {
      formData.append("attachment", attachment);
    }

    try {
      const res = editingId
        ? await api.put(`/api/admin/notifications/${editingId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/api/admin/notifications", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      // Refresh Data
      await fetchNotifications();
      resetForm();
      setActiveTab(calculatedStatus);

      return res.data;
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save notification";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this notification?")) return;

    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
      setError("Could not delete notification.");
    }
  };

  const handleArchive = async (id) => {
    if (!confirm("Move this notification to archive?")) return;

    try {
      await api.patch(`/api/admin/notifications/${id}/archive`);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
      setError("Could not archive notification.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setPriority("LOW");
    setTargetType("ALL");
    setSelectedDepts([]);
    setTargetEmployeeIds("");
    setIsPinned(false);
    setPublishDate("");
    setExpiryDate("");
    setReqAck(false);
    setChannels({ email: false, push: false });
    setAttachment(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (n) => {
    setTitle(n.title || "");
    setMessage(n.message || "");
    setPriority(n.priority || "LOW");
    setIsPinned(!!n.pinned);

    // Convert ISO -> datetime-local
    setPublishDate(n.scheduledAt ? n.scheduledAt.slice(0, 16) : "");
    setExpiryDate(n.expiresAt ? n.expiresAt.slice(0, 16) : "");

    setReqAck(!!n.reqAck);
    setChannels({ email: !!n.sendEmail, push: !!n.sendPush });

    // Do NOT set fake file object for attachment (backend needs File only on update)
    setAttachment(null);

    if (n.targetEmployeeIds && n.targetEmployeeIds.length > 0) {
      setTargetType("SPECIFIC");
      setTargetEmployeeIds(Array.isArray(n.targetEmployeeIds) ? n.targetEmployeeIds.join(", ") : "");
    } else if (n.targetDepts && n.targetDepts.length > 0) {
      setTargetType("DEPT");
      setSelectedDepts(n.targetDepts);
    } else {
      setTargetType("ALL");
    }

    setEditingId(n.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- FILTERS ----------
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch = (n.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = n.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [notifications, searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mr-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Bell className="w-7 h-7 text-blue-900" />
                Notification Center
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Create, schedule, and manage organization-wide announcements.
              </p>
            </div>

            {/* TABS */}
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
              {["PUBLISHED", "SCHEDULED", "DRAFT", "ARCHIVED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    activeTab === tab ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
            <button onClick={() => setError("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COL */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? (
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                  {editingId ? "Edit Notification" : "Compose Notification"}
                </h2>
                {editingId && (
                  <button onClick={resetForm} className="text-xs text-red-500 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {/* CONTENT */}
                <div className="space-y-3">
                  <input
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none font-medium"
                    placeholder="Notification Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-b-0 border-slate-300 rounded-t-lg">
                      <button className="p-1 hover:bg-slate-200 rounded text-xs font-bold font-serif">B</button>
                      <button className="p-1 hover:bg-slate-200 rounded text-xs italic font-serif">I</button>
                      <div className="h-4 w-px bg-slate-300 mx-1"></div>
                      <span className="text-[10px] text-slate-400">Plain Text Mode</span>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full border border-slate-300 rounded-b-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {/* Attachment */}
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                      {attachment ? "Change File" : "Add Attachment"}
                    </button>
                    <span className="text-xs truncate max-w-[150px]">
                      {attachment ? attachment.name : "No file chosen"}
                    </span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* PRIORITY + AUDIENCE */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                    <select
                      className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium(Grey)</option>
                      <option value="HIGH">High(Red)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audience</label>
                    <select
                      className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                    >
                      <option value="ALL">All Employees</option>
                      <option value="DEPT">Specific Depts</option>
                      <option value="SPECIFIC">Specific IDs</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Inputs */}
                {targetType === "DEPT" && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                      className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white text-left"
                    >
                      <span className={selectedDepts.length ? "text-slate-800" : "text-slate-400"}>
                        {selectedDepts.length ? `${selectedDepts.length} Selected` : "Select Departments"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    {isDeptDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                        {DEPARTMENTS.map((d) => (
                          <div
                            key={d}
                            onClick={() => toggleDept(d)}
                            className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded"
                          >
                            <div
                              className={`w-4 h-4 border rounded flex items-center justify-center ${
                                selectedDepts.includes(d) ? "bg-blue-600 border-blue-600" : "border-slate-300"
                              }`}
                            >
                              {selectedDepts.includes(d) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {targetType === "SPECIFIC" && (
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="IDs: EMP001, EMP002"
                    value={targetEmployeeIds}
                    onChange={(e) => setTargetEmployeeIds(e.target.value)}
                  />
                )}

                <hr className="border-slate-100" />

                {/* DATES */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires On
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* SETTINGS */}
                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reqAck}
                        onChange={() => setReqAck(!reqAck)}
                        className="rounded text-blue-900"
                      />
                      Require Acknowledgement
                    </label>
                    <Eye className="w-3 h-3 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.email}
                        onChange={() => setChannels({ ...channels, email: !channels.email })}
                        className="rounded text-blue-900"
                      />
                      Send via Email
                    </label>
                    <Mail className="w-3 h-3 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={() => setIsPinned(!isPinned)}
                        className="rounded text-blue-900"
                      />
                      Pin to Dashboard
                    </label>
                    <Pin className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleSubmit(true)}
                    className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>

                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    {loading ? "..." : (
                      <>
                        <Send className="w-4 h-4" /> {editingId ? "Update" : "Publish"}
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="lg:col-span-7 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()} notifications...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 shadow-sm bg-white"
              />
            </div>

            {/* Empty State */}
            {!loading && filteredNotifications.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} items found.</p>
              </div>
            )}

            {loading && <div className="text-center py-10 text-slate-400">Loading...</div>}

            {/* List */}
            <div className="space-y-4">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md group ${
                    n.pinned ? "border-blue-200 shadow-sm ring-1 ring-blue-50" : "border-slate-200"
                  }`}
                >
                  {n.pinned && (
                    <div className="absolute -top-3 -left-1">
                      <span className="bg-blue-900 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-r-md shadow-sm flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-white" /> Pinned
                      </span>
                    </div>
                  )}

                  {n.status === "SCHEDULED" && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        <Clock className="w-3 h-3" /> {new Date(n.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap pr-20">
                        <h3 className="font-bold text-lg text-slate-900">{n.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${
                            n.priority === "HIGH"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : n.priority === "LOW"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-blue-800 border-blue-100"
                          }`}
                        >
                          {n.priority}
                        </span>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{n.message}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-3">
                        {n.attachmentName && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                            <Paperclip className="w-3 h-3" /> {n.attachmentName}
                          </span>
                        )}
                        {n.reqAck && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
                            <Eye className="w-3 h-3" /> Ack Required
                          </span>
                        )}
                        {n.expiresAt && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expires: {new Date(n.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(n)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {activeTab === "PUBLISHED" && (
                        <button
                          onClick={() => handleArchive(n.id)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}






// import React, { useEffect, useState, useMemo, useRef } from "react";
// import axios from "axios";

// import { 
//   Bell, 
//   Search, 
//   Trash2, 
//   Edit3, 
//   Pin, 
//   Filter, 
//   CheckCircle,
//   AlertTriangle,
//   X,
//   ChevronDown,
//   Check,
//   Calendar,
//   Clock,
//   Paperclip,
//   FileText,
//   Mail,
//   Eye,
//   Save,
//   Send,
//   Archive
// } from "lucide-react";

// // ENV Variable for API Base URL
// \

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // 🔥 always send cookies
// });


// const DEPARTMENTS = [
//   "IT & Engineering", "HR & Admin", "Finance", 
//   "Sales & Marketing", "Operations", "Legal"
// ];

// export default function AdminNotifications() {
//   const [notifications, setNotifications] = useState([]);
  
//   // --- FORM STATE ---
//   const [title, setTitle] = useState("");
//   const [message, setMessage] = useState(""); 
//   const [priority, setPriority] = useState("LOW");
//   const [isPinned, setIsPinned] = useState(false);
  
//   // Targeting
//   const [targetType, setTargetType] = useState("ALL"); 
//   const [selectedDepts, setSelectedDepts] = useState([]); 
//   const [targetEmployeeIds, setTargetEmployeeIds] = useState(""); 

//   // Advanced Features State
//   const [publishDate, setPublishDate] = useState("");
//   const [expiryDate, setExpiryDate] = useState("");
//   const [reqAck, setReqAck] = useState(false);
//   const [channels, setChannels] = useState({ email: false, push: false });
//   const [attachment, setAttachment] = useState(null);

//   const [editingId, setEditingId] = useState(null);

//   // --- UI STATE ---
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeTab, setActiveTab] = useState("PUBLISHED"); 
//   const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  
//   const dropdownRef = useRef(null);
//   const fileInputRef = useRef(null);

//   // ---------- LOAD DATA ----------

//   // Auto-clear error messages
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(""), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

// const fetchNotifications = async () => {
//   setLoading(true);
//   try {
// const res = await api.get("/api/admin/notifications");


//     const data = res.data || [];

//     const sorted = data.sort((a, b) => {
//       if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
//       return new Date(b.createdAt) - new Date(a.createdAt);
//     });

//     setNotifications(sorted);
//   } catch (err) {
//     console.error(err);
//     setError("Failed to fetch data from server.");
//   } finally {
//     setLoading(false);
//   }
// };

// useEffect(() => {
//     fetchNotifications();

//         // Click outside listener for dropdown
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDeptDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ---------- HANDLERS ----------

//   const handleFileChange = (e) => {
//     if (e.target.files[0]) setAttachment(e.target.files[0]);
//   };

//   const toggleDept = (dept) => {
//     if (selectedDepts.includes(dept)) {
//       setSelectedDepts(selectedDepts.filter(d => d !== dept));
//     } else {
//       setSelectedDepts([...selectedDepts, dept]);
//     }
//   };

//   const handleSubmit = async (saveAsDraft = false) => {
//     if (!title.trim() || !message.trim()) {
//       alert("Title and message are required");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     // 1. Determine Status logic
//     let calculatedStatus = saveAsDraft ? "DRAFT" : "PUBLISHED";
//     if (!saveAsDraft && publishDate && new Date(publishDate) > new Date()) {
//       calculatedStatus = "SCHEDULED";
//     }

// // 2. Build FormData (BACKEND-SAFE)
// const formData = new FormData();

// formData.append("title", title);
// formData.append("message", message);
// formData.append("priority", priority);
// formData.append("status", calculatedStatus);
// formData.append("pinned", isPinned);
// formData.append("reqAck", reqAck);
// formData.append("sendEmail", channels.email);
// formData.append("sendPush", channels.push);
// formData.append("targetType", targetType);


// // Arrays (NO [] in key names)
// selectedDepts.forEach(d => formData.append("targetDepts", d));

// const ids = targetEmployeeIds
//   .split(",")
//   .map(id => id.trim())
//   .filter(id => id !== "");

// ids.forEach(id => formData.append("targetEmployeeIds", id));

// formData.append("scheduledAt", publishDate || new Date().toISOString());
// formData.append("expiresAt", expiryDate || "");

// if (attachment) {
//   formData.append("attachment", attachment);
// }


//     try {
// const res = editingId
//   ? await api.put(`/api/admin/notifications/${editingId}`, formData)
//   : await api.post("/api/admin/notifications", formData);



// if (res.data?.success === false) {
//   throw new Error(res.data.message || "Operation failed");
// }


//       // Refresh Data
//       await fetchNotifications();
//       resetForm();
//       setActiveTab(calculatedStatus);

//     } catch (err) {
//       console.error(err);
//       setError(err.message || "Failed to save notification");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm("Permanently delete this notification?")) return;
    
//     try {
//    await api.delete(`/api/admin/notifications/${id}`);

//       // Update UI
//       setNotifications(prev => prev.filter(n => n.id !== id));

//     } catch (err) {
//       console.error(err);
//       setError("Could not delete notification.");
//     }
//   };

//   const handleArchive = async (id) => {
//     if (!confirm("Move this notification to archive?")) return;

//     try {
//      await api.patch(`/api/admin/notifications/${id}/archive`);


// await fetchNotifications();

//     } catch (err) {
//       console.error(err);
//       setError("Could not archive notification.");
//     }
//   };

//   const resetForm = () => {
//     setTitle("");
//     setMessage("");
//     setPriority("LOW");
//     setTargetType("ALL");
//     setSelectedDepts([]);
//     setTargetEmployeeIds("");
//     setIsPinned(false);
//     setPublishDate("");
//     setExpiryDate("");
//     setReqAck(false);
//     setChannels({ email: false, push: false });
//     setAttachment(null);
//     setEditingId(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleEdit = (n) => {
//     setTitle(n.title);
//     setMessage(n.message);
//     setPriority(n.priority);
//     setIsPinned(n.pinned);

//     setPublishDate(n.scheduledAt ? n.scheduledAt.slice(0, 16) : "");
//     setExpiryDate(n.expiresAt ? n.expiresAt.slice(0, 16) : "");
//     setReqAck(n.reqAck || false);
//     setChannels({ email: n.sendEmail || false, push: n.sendPush || false });

//     setAttachment(n.attachmentName ? { name: n.attachmentName } : null);
    
//     if (n.targetEmployeeIds && n.targetEmployeeIds.length > 0) {
//       setTargetType("SPECIFIC");
//       setTargetEmployeeIds(Array.isArray(n.targetEmployeeIds) ? n.targetEmployeeIds.join(", ") : "");
//     } else if (n.targetDepts && n.targetDepts.length > 0) {
//       setTargetType("DEPT");
//       setSelectedDepts(n.targetDepts);
//     } else {
//       setTargetType("ALL");
//     }

//     setEditingId(n.id);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // ---------- FILTERS ----------
//   const filteredNotifications = useMemo(() => {
//     return notifications.filter(n => {
//       const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesTab = n.status === activeTab;
//       return matchesSearch && matchesTab;
//     });
//   }, [notifications, searchTerm, activeTab]);

//   return (
//     <div className="min-h-screen bg-[#F8F9FC] p-6 lg:p-10 font-sans text-slate-800">
//       <div className="max-w-9xl mr-auto space-y-6">
        
//         {/* HEADER */}
//         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
//                 <Bell className="w-7 h-7 text-blue-900" />
//                 Notification Center
//               </h1>
//               <p className="text-slate-500 mt-1 text-sm">
//                 Create, schedule, and manage organization-wide announcements.
//               </p>
//             </div>
            
//             {/* TABS */}
//             <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
//               {['PUBLISHED', 'SCHEDULED', 'DRAFT', 'ARCHIVED'].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
//                     activeTab === tab 
//                       ? 'bg-white text-blue-900 shadow-sm' 
//                       : 'text-slate-500 hover:text-slate-700'
//                   }`}
//                 >
//                   {tab.charAt(0) + tab.slice(1).toLowerCase()}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* ERROR BANNER */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm justify-between">
//              <div className="flex items-center gap-2">
//                <AlertTriangle className="w-4 h-4" /> {error}
//              </div>
//              <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
//           {/* --- LEFT COL: EDITOR FORM (5 Cols) --- */}
//           <div className="lg:col-span-5 space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
//                   {editingId ? <Edit3 className="w-5 h-5 text-blue-600"/> : <CheckCircle className="w-5 h-5 text-blue-600"/>}
//                   {editingId ? "Edit Notification" : "Compose Notification"}
//                 </h2>
//                 {editingId && (
//                   <button onClick={resetForm} className="text-xs text-red-500 hover:underline">
//                     Cancel
//                   </button>
//                 )}
//               </div>

//               <div className="space-y-5">
                
//                 {/* 1. CONTENT SECTION */}
//                 <div className="space-y-3">
//                   <input
//                     className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none font-medium"
//                     placeholder="Notification Title"
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                   />
                  
//                   <div className="relative">
//                     {/* Simulated Toolbar */}
//                     <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-b-0 border-slate-300 rounded-t-lg">
//                       <button className="p-1 hover:bg-slate-200 rounded text-xs font-bold font-serif">B</button>
//                       <button className="p-1 hover:bg-slate-200 rounded text-xs italic font-serif">I</button>
//                       <div className="h-4 w-px bg-slate-300 mx-1"></div>
//                       <span className="text-[10px] text-slate-400">Plain Text Mode</span>
//                     </div>
//                     <textarea
//                       rows={5}
//                       className="w-full border border-slate-300 rounded-b-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none resize-none"
//                       placeholder="Type your message here..."
//                       value={message}
//                       onChange={(e) => setMessage(e.target.value)}
//                     />
//                   </div>

//                   {/* Attachment */}
//                   <div className="flex items-center gap-2 text-sm text-slate-500">
//                     <button 
//                       onClick={() => fileInputRef.current.click()}
//                       className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                     >
//                       <Paperclip className="w-4 h-4" /> 
//                       {attachment ? "Change File" : "Add Attachment"}
//                     </button>
//                     <span className="text-xs truncate max-w-[150px]">{attachment ? attachment.name : "No file chosen"}</span>
//                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
//                   </div>
//                 </div>

//                 <hr className="border-slate-100" />

//                 {/* 2. TARGETING & PRIORITY */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
//                     <select
//                       className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
//                       value={priority}
//                       onChange={(e) => setPriority(e.target.value)}
//                     >
//                       <option value="LOW">Low</option>
//                       <option value="MEDIUM">Medium(Grey)</option>
//                       <option value="HIGH">High(Red)</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audience</label>
//                     <select
//                       className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
//                       value={targetType}
//                       onChange={(e) => setTargetType(e.target.value)}
//                     >
//                       <option value="ALL">All Employees</option>
//                       <option value="DEPT">Specific Depts</option>
//                       <option value="SPECIFIC">Specific IDs</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Dynamic Inputs */}
//                 {targetType === "DEPT" && (
//                   <div className="relative" ref={dropdownRef}>
//                     <button 
//                       onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
//                       className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white text-left"
//                     >
//                       <span className={selectedDepts.length ? "text-slate-800" : "text-slate-400"}>
//                         {selectedDepts.length ? `${selectedDepts.length} Selected` : "Select Departments"}
//                       </span>
//                       <ChevronDown className="w-4 h-4 text-slate-400" />
//                     </button>
//                     {isDeptDropdownOpen && (
//                       <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
//                         {DEPARTMENTS.map(d => (
//                           <div key={d} onClick={() => toggleDept(d)} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded">
//                             <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedDepts.includes(d) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
//                               {selectedDepts.includes(d) && <Check className="w-3 h-3 text-white" />}
//                             </div>
//                             <span className="text-xs">{d}</span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
                
//                 {targetType === "SPECIFIC" && (
//                    <input
//                     className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
//                     placeholder="IDs: EMP001, EMP002"
//                     value={targetEmployeeIds}
//                     onChange={(e) => setTargetEmployeeIds(e.target.value)}
//                   />
//                 )}

//                 <hr className="border-slate-100" />

//                 {/* 3. SCHEDULING & EXPIRY */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
//                       <Calendar className="w-3 h-3"/> Publish Date
//                     </label>
//                     <input 
//                       type="datetime-local" 
//                       className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
//                       value={publishDate}
//                       onChange={(e) => setPublishDate(e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
//                       <Clock className="w-3 h-3"/> Expires On
//                     </label>
//                     <input 
//                       type="datetime-local" 
//                       className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
//                       value={expiryDate}
//                       onChange={(e) => setExpiryDate(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 {/* 4. SETTINGS */}
//                 <div className="bg-slate-50 p-3 rounded-lg space-y-2">
//                    <div className="flex items-center justify-between">
//                       <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
//                         <input type="checkbox" checked={reqAck} onChange={() => setReqAck(!reqAck)} className="rounded text-blue-900" />
//                         Require Acknowledgement
//                       </label>
//                       <Eye className="w-3 h-3 text-slate-400" />
//                    </div>
//                    <div className="flex items-center justify-between">
//                       <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
//                         <input type="checkbox" checked={channels.email} onChange={() => setChannels({...channels, email: !channels.email})} className="rounded text-blue-900" />
//                         Send via Email
//                       </label>
//                       <Mail className="w-3 h-3 text-slate-400" />
//                    </div>
//                    <div className="flex items-center justify-between">
//                       <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
//                         <input type="checkbox" checked={isPinned} onChange={() => setIsPinned(!isPinned)} className="rounded text-blue-900" />
//                         Pin to Dashboard
//                       </label>
//                       <Pin className="w-3 h-3 text-slate-400" />
//                    </div>
//                 </div>

//                 {/* 5. ACTION BUTTONS */}
//                 <div className="flex gap-3 pt-2">
//                   <button 
//                     onClick={() => handleSubmit(true)}
//                     className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2"
//                   >
//                     <Save className="w-4 h-4" /> Save Draft
//                   </button>
//                   <button
//                     onClick={() => handleSubmit(false)}
//                     disabled={loading}
//                     className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
//                   >
//                     {loading ? "..." : <><Send className="w-4 h-4" /> {editingId ? "Update" : "Publish"}</>}
//                   </button>
//                 </div>

//               </div>
//             </div>
//           </div>

//           {/* --- RIGHT COL: NOTIFICATION LIST (7 Cols) --- */}
//           <div className="lg:col-span-7 space-y-6">
            
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
//               <input 
//                 type="text" 
//                 placeholder={`Search ${activeTab.toLowerCase()} notifications...`} 
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 shadow-sm bg-white"
//               />
//             </div>

//             {/* Empty State */}
//             {!loading && filteredNotifications.length === 0 && (
//               <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
//                 <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
//                 <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} items found.</p>
//               </div>
//             )}
            
//             {loading && <div className="text-center py-10 text-slate-400">Loading...</div>}

//             {/* List */}
//             <div className="space-y-4">
//               {filteredNotifications.map((n) => (
//                 <div
//                   key={n.id}
//                   className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md group ${n.pinned ? 'border-blue-200 shadow-sm ring-1 ring-blue-50' : 'border-slate-200'}`}
//                 >
//                   {/* Badges */}
//                   {n.pinned && (
//                     <div className="absolute -top-3 -left-1">
//                        <span className="bg-blue-900 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-r-md shadow-sm flex items-center gap-1">
//                          <Pin className="w-3 h-3 fill-white" /> Pinned
//                        </span>
//                     </div>
//                   )}

//                   {n.status === 'SCHEDULED' && (
//                     <div className="absolute top-4 right-4">
//                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
//                          <Clock className="w-3 h-3" /> {new Date(n.scheduledAt).toLocaleDateString()}
//                        </span>
//                     </div>
//                   )}

//                   <div className="flex justify-between items-start gap-4">
//                     <div className="space-y-2 flex-1">
//                       <div className="flex items-center gap-2 flex-wrap pr-20">
//                         <h3 className="font-bold text-lg text-slate-900">{n.title}</h3>
//                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide 
//                           ${n.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-100' : 
//                             n.priority === 'LOW' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
//                             'bg-blue-50 text-blue-800 border-blue-100'}`}>
//                           {n.priority}
//                         </span>
//                       </div>
                      
//                       <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
//                         {n.message}
//                       </p>

//                       {/* Footer Metadata */}
//                       <div className="flex flex-wrap items-center gap-3 pt-3">
//                          {n.attachmentName && (
//                            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
//                               <Paperclip className="w-3 h-3" /> {n.attachmentName}
//                            </span>
//                          )}
//                          {n.reqAck && (
//                            <span className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
//                               <Eye className="w-3 h-3" /> Ack Required
//                            </span>
//                          )}
//                          {n.expiresAt && (
//                            <span className="text-xs text-slate-400 flex items-center gap-1">
//                              <Clock className="w-3 h-3" /> Expires: {new Date(n.expiresAt).toLocaleDateString()}
//                            </span>
//                          )}
//                       </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button onClick={() => handleEdit(n)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
//                         <Edit3 className="w-4 h-4" />
//                       </button>
                      
//                       {activeTab === 'PUBLISHED' && (
//                         <button onClick={() => handleArchive(n.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Archive">
//                           <Archive className="w-4 h-4" />
//                         </button>
//                       )}
                      
//                       <button onClick={() => handleDelete(n.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }