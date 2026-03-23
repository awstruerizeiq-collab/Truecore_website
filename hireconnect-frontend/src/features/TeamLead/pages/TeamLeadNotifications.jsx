import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    AlertTriangle,
    Archive,
    Bell,
    Calendar,
    Check,
    CheckCircle,
    ChevronDown,
    Clock,
    Edit3,
    Eye,
    Mail,
    Paperclip,
    Pin,
    Save,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";

// ENV Variable for API Base URL
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // always send cookies
});

const NOTIFICATION_TYPES = [
    { value: "TASK", label: "Task Assignments" },
    { value: "ATTENDANCE", label: "Attendance Reminders" },
    { value: "LEAVE", label: "Leave Approvals" },
    { value: "PERFORMANCE", label: "Performance Review Updates" },
    { value: "POLICY", label: "Policy / Internal Announcements" },
    { value: "URGENT", label: "Urgent Alerts" },
];

const TEAM_TARGETS = [
    { value: "ALL", label: "Entire Team" },
    { value: "SPECIFIC", label: "Specific Employees" },
];

export default function TeamLeadNotifications() {
    const [notifications, setNotifications] = useState([]);

    // --- FORM STATE ---
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("TASK");
    const [isUrgent, setIsUrgent] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [targetType, setTargetType] = useState("ALL");
    const [targetEmployeeIds, setTargetEmployeeIds] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [channels, setChannels] = useState({ email: false, push: false });
    const [attachment, setAttachment] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // --- UI STATE ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("PUBLISHED");
    const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    // ---------- LOAD DATA ----------
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/teamlead/notifications");
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
                setIsTargetDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---------- HANDLERS ----------
    const handleFileChange = (e) => {
        if (e.target.files[0]) setAttachment(e.target.files[0]);
    };

    const handleSubmit = async (saveAsDraft = false) => {
        if (!title.trim() || !message.trim()) {
            alert("Title and message are required");
            return;
        }

        setLoading(true);
        setError("");

        // 1. Determine Status logic
        let calculatedStatus = saveAsDraft ? "DRAFT" : "PUBLISHED";
        if (!saveAsDraft && publishDate && new Date(publishDate) > new Date()) {
            calculatedStatus = "SCHEDULED";
        }

        // 2. Build FormData (backend-safe)
        const formData = new FormData();
        formData.append("title", title);
        formData.append("message", message);
        formData.append("type", type);
        formData.append("urgent", isUrgent);
        formData.append("status", calculatedStatus);
        formData.append("pinned", isPinned);
        formData.append("sendEmail", channels.email);
        formData.append("sendPush", channels.push);
        formData.append("targetType", targetType);

        const ids = targetEmployeeIds
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id !== "");
        ids.forEach((id) => formData.append("targetEmployeeIds", id));

        formData.append("scheduledAt", publishDate || new Date().toISOString());
        formData.append("expiresAt", expiryDate || "");

        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            const res = editingId
                ? await api.put(`/api/teamlead/notifications/${editingId}`, formData)
                : await api.post("/api/teamlead/notifications", formData);

            if (res.data?.success === false) {
                throw new Error(res.data.message || "Operation failed");
            }

            await fetchNotifications();
            resetForm();
            setActiveTab(calculatedStatus);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to save notification");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Permanently delete this notification?")) return;

        try {
            await api.delete(`/api/teamlead/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error(err);
            setError("Could not delete notification.");
        }
    };

    const handleArchive = async (id) => {
        if (!confirm("Move this notification to archive?")) return;

        try {
            await api.patch(`/api/teamlead/notifications/${id}/archive`);
            await fetchNotifications();
        } catch (err) {
            console.error(err);
            setError("Could not archive notification.");
        }
    };

    const resetForm = () => {
        setTitle("");
        setMessage("");
        setType("TASK");
        setIsUrgent(false);
        setIsPinned(false);
        setTargetType("ALL");
        setTargetEmployeeIds("");
        setPublishDate("");
        setExpiryDate("");
        setChannels({ email: false, push: false });
        setAttachment(null);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (n) => {
        setTitle(n.title);
        setMessage(n.message);
        setType(n.type || "TASK");
        setIsUrgent(Boolean(n.urgent));
        setIsPinned(Boolean(n.pinned));

        setPublishDate(n.scheduledAt ? n.scheduledAt.slice(0, 16) : "");
        setExpiryDate(n.expiresAt ? n.expiresAt.slice(0, 16) : "");
        setChannels({ email: n.sendEmail || false, push: n.sendPush || false });

        setAttachment(n.attachmentName ? { name: n.attachmentName } : null);

        if (n.targetEmployeeIds && n.targetEmployeeIds.length > 0) {
            setTargetType("SPECIFIC");
            setTargetEmployeeIds(
                Array.isArray(n.targetEmployeeIds) ? n.targetEmployeeIds.join(", ") : ""
            );
        } else {
            setTargetType("ALL");
        }

        setEditingId(n.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ---------- FILTERS ----------
    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            const matchesSearch =
                n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = n.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [notifications, searchTerm, activeTab]);

    const getReadStats = (n) => {
        if (typeof n.readCount === "number" && typeof n.unreadCount === "number") {
            return { read: n.readCount, unread: n.unreadCount };
        }
        if (Array.isArray(n.readBy)) {
            return { read: n.readBy.length, unread: n.unreadCount ?? 0 };
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-6 lg:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mr-auto space-y-6">
                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Bell className="w-7 h-7 text-blue-900" />
                                Team Notifications
                            </h1>
                            <p className="text-slate-500 mt-1 text-sm">
                                Send announcements to your team or specific employees.
                            </p>
                        </div>

                        {/* TABS */}
                        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
                            {["PUBLISHED", "SCHEDULED", "DRAFT", "ARCHIVED"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-white text-blue-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
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
                    {/* --- LEFT COL: EDITOR FORM --- */}
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
                                {/* 1. CONTENT SECTION */}
                                <div className="space-y-3">
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none font-medium"
                                        placeholder="Notification Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />

                                    <div className="relative">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-b-0 border-slate-300 rounded-t-lg">
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
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* 2. TYPE / TARGETING / URGENCY */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Type
                                        </label>
                                        <select
                                            className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                                            value={type}
                                            onChange={(e) => {
                                                const nextType = e.target.value;
                                                setType(nextType);
                                                setIsUrgent(nextType === "URGENT");
                                            }}
                                        >
                                            {NOTIFICATION_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative" ref={dropdownRef}>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Audience
                                        </label>
                                        <button
                                            onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                                            className="w-full mt-1 flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white text-left"
                                        >
                                            <span className="text-slate-800">
                                                {TEAM_TARGETS.find((t) => t.value === targetType)?.label}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </button>
                                        {isTargetDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2">
                                                {TEAM_TARGETS.map((t) => (
                                                    <div
                                                        key={t.value}
                                                        onClick={() => {
                                                            setTargetType(t.value);
                                                            setIsTargetDropdownOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded"
                                                    >
                                                        <div
                                                            className={`w-4 h-4 border rounded flex items-center justify-center ${targetType === t.value
                                                                ? "bg-blue-600 border-blue-600"
                                                                : "border-slate-300"
                                                                }`}
                                                        >
                                                            {targetType === t.value && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className="text-xs">{t.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {targetType === "SPECIFIC" && (
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Employee IDs: EMP001, EMP002"
                                        value={targetEmployeeIds}
                                        onChange={(e) => setTargetEmployeeIds(e.target.value)}
                                    />
                                )}

                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isUrgent}
                                            onChange={() => setIsUrgent(!isUrgent)}
                                            className="rounded text-blue-900"
                                        />
                                        Mark as Urgent
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        Urgent notifications are highlighted for recipients
                                    </span>
                                </div>

                                <hr className="border-slate-100" />

                                {/* 3. SCHEDULING & EXPIRY */}
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

                                {/* 4. DELIVERY CHANNELS */}
                                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-700">
                                            In-app delivery
                                        </span>
                                        <span className="text-[10px] text-slate-500">Always on</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={channels.email}
                                                onChange={() =>
                                                    setChannels({ ...channels, email: !channels.email })
                                                }
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
                                                checked={channels.push}
                                                onChange={() =>
                                                    setChannels({ ...channels, push: !channels.push })
                                                }
                                                className="rounded text-blue-900"
                                            />
                                            Push Notifications (future-ready)
                                        </label>
                                        <Bell className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isPinned}
                                                onChange={() => setIsPinned(!isPinned)}
                                                className="rounded text-blue-900"
                                            />
                                            Pin to Team Dashboard
                                        </label>
                                        <Pin className="w-3 h-3 text-slate-400" />
                                    </div>
                                </div>

                                {/* 5. ACTION BUTTONS */}
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

                    {/* --- RIGHT COL: NOTIFICATION LIST --- */}
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
                                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">
                                    No {activeTab.toLowerCase()} items found.
                                </p>
                            </div>
                        )}

                        {loading && <div className="text-center py-10 text-slate-400">Loading...</div>}

                        {/* List */}
                        <div className="space-y-4">
                            {filteredNotifications.map((n) => {
                                const stats = getReadStats(n);
                                return (
                                    <div
                                        key={n.id}
                                        className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md group ${n.pinned ? "border-blue-200 shadow-sm ring-1 ring-blue-50" : "border-slate-200"
                                            }`}
                                    >
                                        {/* Badges */}
                                        {n.pinned && (
                                            <div className="absolute -top-3 -left-1">
                                                <span className="bg-blue-900 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-r-md shadow-sm flex items-center gap-1">
                                                    <Pin className="w-3 h-3 fill-white" /> Pinned
                                                </span>
                                            </div>
                                        )}

                                        {n.urgent && (
                                            <div className="absolute top-4 right-4">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                    <AlertTriangle className="w-3 h-3" /> Urgent
                                                </span>
                                            </div>
                                        )}

                                        {n.status === "SCHEDULED" && (
                                            <div className="absolute top-4 right-4">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                    <Clock className="w-3 h-3" />{" "}
                                                    {new Date(n.scheduledAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap pr-20">
                                                    <h3 className="font-bold text-lg text-slate-900">{n.title}</h3>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide bg-slate-100 text-slate-600 border-slate-200">
                                                        {n.type || "GENERAL"}
                                                    </span>
                                                </div>

                                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                                    {n.message}
                                                </p>

                                                {/* Footer Metadata */}
                                                <div className="flex flex-wrap items-center gap-3 pt-3">
                                                    {n.attachmentName && (
                                                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                                            <Paperclip className="w-3 h-3" /> {n.attachmentName}
                                                        </span>
                                                    )}
                                                    {stats && (
                                                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                                            <Eye className="w-3 h-3" /> {stats.read} read ·{" "}
                                                            {stats.unread} unread
                                                        </span>
                                                    )}
                                                    {n.expiresAt && (
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Expires:{" "}
                                                            {new Date(n.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
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
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}