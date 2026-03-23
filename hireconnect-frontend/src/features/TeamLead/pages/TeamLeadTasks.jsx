import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Clock,
    Link as LinkIcon,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Send,
    Users,
} from "lucide-react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");

const getTenantContext = () => {
    const tenantCode =
        localStorage.getItem("tenantCode") ||
        localStorage.getItem("tenant_code") ||
        localStorage.getItem("TENANT_CODE") ||
        "";

    const companyId =
        localStorage.getItem("companyId") ||
        localStorage.getItem("company_id") ||
        localStorage.getItem("COMPANY_ID") ||
        "";

    if ((!tenantCode || !companyId) && localStorage.getItem("user")) {
        try {
            const u = JSON.parse(localStorage.getItem("user"));
            return {
                tenantCode: tenantCode || u?.tenantCode || u?.tenant_code || "",
                companyId: companyId || u?.companyId || u?.company_id || "",
            };
        } catch {
            // ignore parse errors
        }
    }

    return { tenantCode, companyId };
};

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const { tenantCode, companyId } = getTenantContext();

    const headers = {};

    if (token) {
        headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    if (tenantCode) {
        headers["X-Tenant-Code"] = tenantCode;
    }
    if (companyId) {
        headers["X-Company-Id"] = companyId;
    }

    return headers;
};

const getTenantParams = () => {
    const { tenantCode, companyId } = getTenantContext();
    return {
        ...(tenantCode ? { tenantCode } : {}),
        ...(companyId ? { companyId } : {}),
    };
};

const normalizeLink = (value) => {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^www\./i.test(raw)) return `https://${raw}`;
    return raw;
};

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    config.headers = {
        ...(config.headers || {}),
        ...getAuthHeaders(),
    };
    return config;
});

const getApiErrorMessage = (err, fallback) => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (typeof err?.response?.data === "string" && err.response.data.trim()) return err.response.data;
    if (err?.message) return err.message;
    return fallback;
};

const STATUS_COLUMNS = [
    { key: "TODO", label: "To-Do" },
    { key: "IN_PROGRESS", label: "In-Progress" },
    { key: "DONE", label: "Done" },
];

const getColumnTheme = (status) => {
    if (status === "TODO") {
        return {
            column: "bg-amber-50 border-amber-200",
            header: "text-amber-800",
            count: "bg-amber-100 text-amber-800",
            card: "border-amber-200",
            select: "border-amber-200 bg-amber-50/50",
        };
    }
    if (status === "IN_PROGRESS") {
        return {
            column: "bg-blue-50 border-blue-200",
            header: "text-blue-800",
            count: "bg-blue-100 text-blue-800",
            card: "border-blue-200",
            select: "border-blue-200 bg-blue-50/50",
        };
    }
    return {
        column: "bg-emerald-50 border-emerald-200",
        header: "text-emerald-800",
        count: "bg-emerald-100 text-emerald-800",
        card: "border-emerald-200",
        select: "border-emerald-200 bg-emerald-50/50",
    };
};

const TeamLeadTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // --- FORM STATE ---
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("LOW");
    const [dueDate, setDueDate] = useState("");
    const [assignType, setAssignType] = useState("ALL");
    const [assigneesInput, setAssigneesInput] = useState("");
    const [linkInput, setLinkInput] = useState("");
    const [links, setLinks] = useState([]);
    const [attachment, setAttachment] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/teamlead/tasks", {
                params: getTenantParams(),
            });
            setTasks(res.data || []);
        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to fetch tasks."));
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const toDateKey = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value.slice(0, 10);
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 10);
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("LOW");
        setDueDate("");
        setAssignType("ALL");
        setAssigneesInput("");
        setLinks([]);
        setLinkInput("");
        setAttachment(null);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAddLink = () => {
        const trimmed = normalizeLink(linkInput);
        if (!trimmed) return;
        if (links.includes(trimmed)) {
            setLinkInput("");
            return;
        }
        setLinks((prev) => [...prev, trimmed]);
        setLinkInput("");
    };

    const buildAssignees = () => {
        if (assignType === "ALL") return [];
        return assigneesInput
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id !== "");
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            alert("Title and description are required");
            return;
        }

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("priority", priority);
        formData.append("dueDate", dueDate || "");
        formData.append("assignType", assignType);
        const pendingLink = normalizeLink(linkInput);
        const normalizedLinks = pendingLink
            ? Array.from(new Set([...links, pendingLink]))
            : links;

        formData.append("links", JSON.stringify(normalizedLinks));

        const assignees = buildAssignees();
        assignees.forEach((id) => formData.append("assignees", id));

        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            const res = editingId
                ? await api.put(`/api/teamlead/tasks/${editingId}`, formData, {
                    params: getTenantParams(),
                })
                : await api.post("/api/teamlead/tasks", formData, {
                    params: getTenantParams(),
                });

            if (res.data?.success === false) {
                throw new Error(res.data.message || "Operation failed");
            }

            await fetchTasks();
            setLinks(normalizedLinks);
            resetForm();
        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to save task."));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (task, nextStatus) => {
        if (task.canEdit === false) return;
        try {
            await api.patch(
                `/api/teamlead/tasks/${task.id}/status`,
                { status: nextStatus },
                { params: getTenantParams() }
            );
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
            );
        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to update status."));
        }
    };

    const handleAddComment = async (taskId, text, isProgress = false) => {
        if (!text.trim()) return;
        const endpoint = isProgress ? "progress" : "comments";
        try {
            const res = await api.post(
                `/api/teamlead/tasks/${taskId}/${endpoint}`,
                { text },
                { params: getTenantParams() }
            );
            const newEntry = res.data || {
                id: `local-${Date.now()}`,
                author: "Team Lead",
                text,
                createdAt: new Date().toISOString(),
            };
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? {
                            ...t,
                            [endpoint]: [...(t[endpoint] || []), newEntry],
                        }
                        : t
                )
            );
        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to add update."));
        }
    };

    const handleEditTask = (task) => {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "LOW");
        setDueDate(toDateKey(task.dueDate));
        setAssignType(task.assignType || (task.assignees?.length ? "SPECIFIC" : "ALL"));
        setAssigneesInput(Array.isArray(task.assignees) ? task.assignees.join(", ") : "");
        setLinks(Array.isArray(task.links) ? task.links : []);
        setAttachment(null);
        setEditingId(task.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const todayISO = new Date().toISOString().slice(0, 10);
    const isOverdue = (task) => {
        const key = toDateKey(task.dueDate);
        return key && key < todayISO && task.status !== "DONE";
    };
    const isDueToday = (task) => toDateKey(task.dueDate) === todayISO;

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch =
                task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            return true;
        });
    }, [tasks, searchTerm]);

    const tasksByStatus = useMemo(() => {
        return STATUS_COLUMNS.reduce((acc, col) => {
            acc[col.key] = filteredTasks.filter((t) => t.status === col.key);
            return acc;
        }, {});
    }, [filteredTasks]);

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-6 lg:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mr-auto space-y-6">
                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <ClipboardList className="w-7 h-7 text-blue-900" />
                                Task & Work Management
                            </h1>
                            <p className="text-slate-500 mt-1 text-sm">
                                Create, assign, and track tasks across your team.
                            </p>
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
                            <AlertTriangle className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* --- LEFT COL: CREATE / EDIT FORM --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {editingId ? (
                                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-blue-600" />
                                    )}
                                    {editingId ? "Edit Task" : "Create Task"}
                                </h2>
                                {editingId && (
                                    <button onClick={resetForm} className="text-xs text-red-500 hover:underline">
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <input
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none font-medium"
                                    placeholder="Task title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <textarea
                                    rows={4}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                                    placeholder="Task description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Priority
                                        </label>
                                        <select
                                            className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Assign To
                                    </label>
                                    <select
                                        className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                                        value={assignType}
                                        onChange={(e) => setAssignType(e.target.value)}
                                    >
                                        <option value="ALL">Entire Team</option>
                                        <option value="SPECIFIC">Specific Employees</option>
                                    </select>
                                </div>

                                {assignType === "SPECIFIC" && (
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Employee IDs: EMP001, EMP002"
                                        value={assigneesInput}
                                        onChange={(e) => setAssigneesInput(e.target.value)}
                                    />
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Links (optional)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                            placeholder="https://"
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                        />
                                        <button
                                            onClick={handleAddLink}
                                            className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-semibold"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {links.map((l) => (
                                            <span key={l} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                                {l}
                                            </span>
                                        ))}
                                    </div>
                                </div>

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
                                        onChange={(e) => setAttachment(e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    {loading ? "..." : "Save Task"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COL: KANBAN BOARD --- */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                className="flex-1 outline-none text-sm"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading && <div className="text-center py-10 text-slate-400">Loading...</div>}

                        {!loading && filteredTasks.length === 0 && (
                            <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
                                No tasks found.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {STATUS_COLUMNS.map((col) => {
                                const theme = getColumnTheme(col.key);
                                return (
                                    <div key={col.key} className={`rounded-2xl p-3 border ${theme.column}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className={`text-sm font-bold ${theme.header}`}>{col.label}</h3>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.count}`}>
                                                {tasksByStatus[col.key]?.length || 0}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {tasksByStatus[col.key]?.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={`bg-white rounded-xl border p-4 shadow-sm ${isOverdue(task) ? "border-red-300 ring-1 ring-red-50" : theme.card
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-[15px] leading-5">{task.title}</h4>
                                                            <p className="text-sm text-slate-700 mt-1.5 line-clamp-2 leading-5">
                                                                {task.description}
                                                            </p>
                                                        </div>
                                                        <select
                                                            className={`text-[10px] border rounded px-1 py-0.5 ${theme.select}`}
                                                            value={task.status}
                                                            onChange={(e) => handleStatusChange(task, e.target.value)}
                                                            disabled={task.canEdit === false}
                                                        >
                                                            {STATUS_COLUMNS.map((s) => (
                                                                <option key={s.key} value={s.key}>
                                                                    {s.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 mt-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 uppercase font-bold">
                                                            {task.priority}
                                                        </span>
                                                        {task.assignType === "ALL" ? (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" /> Entire Team
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" /> {task.assignees?.length || 0} assignees
                                                            </span>
                                                        )}
                                                        {toDateKey(task.dueDate) && (
                                                            <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-600" : ""}`}>
                                                                <Calendar className="w-3 h-3" /> {toDateKey(task.dueDate)}
                                                            </span>
                                                        )}
                                                        {isDueToday(task) && (
                                                            <span className="flex items-center gap-1 text-amber-600">
                                                                <Clock className="w-3 h-3" /> Due Today
                                                            </span>
                                                        )}
                                                    </div>

                                                    {(task.links?.length || 0) > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {task.links.map((l) => (
                                                                <span
                                                                    key={l}
                                                                    className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded flex items-center gap-1 font-medium"
                                                                >
                                                                    <LinkIcon className="w-3 h-3" /> Link
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() => handleEditTask(task)}
                                                            className="text-xs font-semibold text-blue-700"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>

                                                    {/* Comments */}
                                                    <div className="mt-3 border-t pt-3">
                                                        <div className="flex items-center gap-2 text-xs text-slate-700 mb-2 font-semibold">
                                                            <MessageSquare className="w-3 h-3" /> Comments
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(task.comments || []).slice(-2).map((c) => (
                                                                <div key={c.id} className="text-xs text-slate-700">
                                                                    <span className="font-semibold">{c.author}</span> ·{" "}
                                                                    <span className="text-slate-500">
                                                                        {new Date(c.createdAt).toLocaleString()}
                                                                    </span>
                                                                    <div>{c.text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <TaskInlineInput
                                                            placeholder="Add comment..."
                                                            onSubmit={(text) => handleAddComment(task.id, text)}
                                                        />
                                                    </div>

                                                    {/* Progress Updates */}
                                                    <div className="mt-3 border-t pt-3">
                                                        <div className="flex items-center gap-2 text-xs text-slate-700 mb-2 font-semibold">
                                                            <CheckCircle2 className="w-3 h-3" /> Progress Updates
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(task.progress || []).slice(-2).map((p) => (
                                                                <div key={p.id} className="text-xs text-slate-700">
                                                                    <span className="font-semibold">{p.author}</span> ·{" "}
                                                                    <span className="text-slate-500">
                                                                        {new Date(p.createdAt).toLocaleString()}
                                                                    </span>
                                                                    <div>{p.text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <TaskInlineInput
                                                            placeholder="Add progress note..."
                                                            onSubmit={(text) => handleAddComment(task.id, text, true)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskInlineInput = ({ placeholder, onSubmit }) => {
    const [value, setValue] = useState("");
    return (
        <div className="flex items-center gap-2 mt-2">
            <input
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button
                onClick={() => {
                    onSubmit(value);
                    setValue("");
                }}
                className="p-1.5 rounded-lg bg-slate-100"
                title="Send"
            >
                <Send className="w-3 h-3 text-slate-600" />
            </button>
        </div>
    );
};

export default TeamLeadTasks;