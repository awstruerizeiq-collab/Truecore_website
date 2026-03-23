'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  X,
  Pin,
  Download,
  Eye,
  FileText,
  Search,
  Link as LinkIcon
} from 'lucide-react';

import axios from "axios";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ---------- LocalStorage helpers ----------
const ls = (k) => (localStorage.getItem(k) || "").trim();

const getCompanyId = () => ls("companyId");
const getTenantCode = () => ls("tenantCode");

// ✅ your screenshot has userId only
const getEmpId = () => ls("employeeId") || ls("empId") || ls("userId");

// dept not in your localstorage screenshot, keep optional
const getDept = () => ls("department") || ls("dept") || "";

// ✅ attach headers + token to every request
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  const companyId = getCompanyId();
  const tenantCode = getTenantCode();

  if (companyId) config.headers["X-Company-Id"] = companyId;
  if (tenantCode) config.headers["X-Tenant-Code"] = tenantCode;

  const token = ls("token");
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  return config;
});

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const companyId = getCompanyId();
      const tenantCode = getTenantCode();
      const empId = getEmpId();
      const dept = getDept();

      if (!companyId || !tenantCode) {
        throw new Error("companyId / tenantCode missing in localStorage. Please login again.");
      }
      if (!empId) {
        throw new Error("userId missing in localStorage. Please login again.");
      }

      const res = await api.get("/api/employee/notifications", {
        params: { empId, dept }
      });

      const data = res.data || [];

      // normalize
      const normalized = data.map((n) => ({
        ...n,
        pinned: !!n.pinned,
        read: !!n.read,
        acknowledged: !!n.acknowledged,
        reqAck: !!n.reqAck,
      }));

      // sort
      const sorted = [...normalized].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.read !== b.read) return a.read ? 1 : -1;
        if (a.reqAck !== b.reqAck) return a.reqAck ? -1 : 1;
        if (a.reqAck && b.reqAck && a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sorted);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ---------- ACTIONS ----------
  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.put(`/api/employee/notifications/${id}/read`, null, {
        params: { empId: getEmpId() }
      });
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    if (!notifications.some(n => !n.read)) return;

    const old = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await api.put(`/api/employee/notifications/read-all`, null, {
        params: { empId: getEmpId() }
      });
    } catch (e) {
      console.error(e);
      setError("Failed to mark all read");
      setNotifications(old);
    }
  };

  const handleAcknowledge = async (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true, read: true } : n));

    try {
      await api.put(`/api/employee/notifications/${id}/acknowledge`, null, {
        params: { empId: getEmpId() }
      });
    } catch (e) {
      console.error(e);
      setError("Failed to acknowledge");
    }
  };

  const handleDownload = (n, e) => {
    e.stopPropagation();
    if (n.attachmentUrl) window.open(n.attachmentUrl, "_blank");
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Remove this notification?")) return;

    const old = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await api.delete(`/api/employee/notifications/${id}`, {
        params: { empId: getEmpId() }
      });
    } catch (e2) {
      console.error(e2);
      setError("Could not remove notification.");
      setNotifications(old);
    }
  };

  // ---------- COMPUTED ----------
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const actionRequiredCount = useMemo(() =>
    notifications.filter(n => n.reqAck && !n.acknowledged).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const filterMatch =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && !n.read) ||
        (activeFilter === 'action' && n.reqAck && !n.acknowledged);

      if (!filterMatch) return false;

      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.message || "").toLowerCase().includes(q) ||
        (n.priority || "").toLowerCase().includes(q)
      );
    });
  }, [notifications, activeFilter, searchTerm]);

  const getIcon = (priority) => {
    if (priority === 'HIGH') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (priority === 'LOW') return <Info className="w-5 h-5 text-slate-500" />;
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  const getPriorityBorder = (priority, read) => {
    if (read) return 'border-slate-200';
    if (priority === 'HIGH') return 'border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100';
    return 'border-l-4 border-l-blue-600 border-y-slate-100 border-r-slate-100';
  };

  const formatTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const renderMessageWithLinks = (message) => {
    const text = message || "";
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, idx) => {
      if (part.startsWith("http://") || part.startsWith("https://") || part.startsWith("www.")) {
        const href = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={`link-${idx}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-700 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={`txt-${idx}`}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FC] font-sans text-slate-800">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-6">

        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl shadow-sm border border-blue-900 p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Notifications</h1>
              <p className="text-blue-100 text-sm">Track updates, files, links, and required actions.</p>
            </div>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unread</p>
              <h3 className="text-2xl font-bold text-slate-800">{unreadCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Required</p>
              <h3 className="text-2xl font-bold text-slate-800">{actionRequiredCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Quick Filter</span>
              <button onClick={markAllRead} className="text-xs text-blue-600 font-semibold hover:underline">
                Mark all read
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, message, priority..."
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'unread', 'action'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${activeFilter === filter
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Action"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </span>
            <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Recent Alerts
                {loading && <span className="font-normal text-slate-400">Loading...</span>}
              </h2>
              {!loading && (
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                  {filteredNotifications.length} items
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="p-6 space-y-3">
              <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No notifications found.</p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`group flex flex-col md:flex-row gap-5 p-5 bg-white transition-all duration-200 ${getPriorityBorder(n.priority, n.read)} hover:bg-slate-50/60 ${!n.read ? "ring-1 ring-inset ring-blue-50" : ""} cursor-pointer`}
              >
              <div className="flex flex-1 gap-5 overflow-hidden">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${!n.read ? 'bg-slate-100' : 'bg-slate-50'}`}>
                  {getIcon(n.priority)}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base md:text-[17px] font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${n.priority === "HIGH" ? "bg-red-100 text-red-700" : n.priority === "LOW" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                      {n.priority || "MEDIUM"}
                    </span>

                    {n.pinned && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}

                    {!n.read && (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">New</span>
                    )}

                    {n.reqAck && !n.acknowledged && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="text-[15px] font-medium text-slate-600 whitespace-pre-wrap leading-7 max-w-3xl">
                    {renderMessageWithLinks(n.message)}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    {formatTime(n.createdAt)}
                  </p>

                  {(n.links?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {n.links.map((l, i) => (
                        <a
                          key={`${n.id}-link-${i}`}
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 hover:bg-blue-100"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Open Link {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {n.attachmentName && (
                    <div
                      onClick={(e) => handleDownload(n, e)}
                      className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg w-fit mt-2 hover:bg-slate-100 transition-colors"
                    >
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">{n.attachmentName}</p>
                        <p className="text-[10px] text-slate-400 break-all">
                          {n.attachmentUrl || "Click to download"}
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 ml-2" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 md:min-w-[180px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {n.reqAck && !n.acknowledged ? (
                    <button
                      onClick={(e) => handleAcknowledge(n.id, e)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> Acknowledge
                    </button>
                  ) : !n.read ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark Read
                    </button>
                  ) : (
                    <div className="text-slate-300 text-xs font-medium px-2">
                      {n.acknowledged ? "Ack'd" : "Read"}
                    </div>
                  )}
                </div>
              </div>

              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}