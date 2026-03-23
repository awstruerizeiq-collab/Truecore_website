import React, { useEffect, useMemo, useState } from "react";
import { Headphones, RefreshCw, Search, Send } from "lucide-react";

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};
const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = () => {
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
  };
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const parseComments = (commentsJson) => {
  if (!commentsJson) return [];
  try {
    const parsed = JSON.parse(commentsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");

const toBackendStatus = (status) =>
  String(status || "")
    .toUpperCase()
    .replace(/-/g, "_");

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const payload = await safeJson(res);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to load support tickets");
      }
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const normalized = list.map((ticket) => ({
        ...ticket,
        ticketId: ticket.ticketId || `TKT-${ticket.id}`,
        status: normalizeStatus(ticket.status),
        commentsParsed: parseComments(ticket.comments),
      }));
      setTickets(normalized);
      if (!selectedTicketId && normalized.length > 0) {
        setSelectedTicketId(normalized[0].id);
      }
      if (selectedTicketId && !normalized.some((ticket) => ticket.id === selectedTicketId)) {
        setSelectedTicketId(normalized[0]?.id || null);
      }
    } catch (e) {
      setError(e?.message || "Unable to fetch support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${ticket.ticketId} ${ticket.subject} ${ticket.employeeName} ${ticket.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [tickets, search, statusFilter]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ticket.status === "open").length;
    const inProgress = tickets.filter((ticket) => ticket.status === "in-progress").length;
    const resolved = tickets.filter((ticket) => ticket.status === "resolved").length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: toBackendStatus(nextStatus) }),
      });
      const payload = await safeJson(res);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to update ticket status");
      }
      await fetchTickets();
    } catch (e) {
      setError(e?.message || "Failed to update status.");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      setReplying(true);
      const res = await fetch(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/comment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment: reply.trim() }),
      });
      const payload = await safeJson(res);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to send reply");
      }
      setReply("");
      await fetchTickets();
    } catch (e) {
      setError(e?.message || "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-5">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 inline-flex items-center justify-center">
              <Headphones size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
              <p className="text-slate-500">Manage and respond to customer support requests</p>
            </div>
          </div>
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Open" value={stats.open} />
        <StatCard title="In Progress" value={stats.inProgress} />
        <StatCard title="Resolved" value={stats.resolved} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, subject, employee..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="max-h-[520px] overflow-auto divide-y divide-slate-100">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No support tickets found.</div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                    selectedTicketId === ticket.id ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{ticket.subject || "-"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {ticket.ticketId} • {ticket.employeeName || "Unknown"} • {ticket.category || "General"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600 capitalize">
                      {ticket.status.replace(/-/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{ticket.description || "-"}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          {!selectedTicket ? (
            <p className="text-sm text-slate-500">Select a ticket to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">{selectedTicket.ticketId}</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedTicket.subject}</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, "in-progress")}
                  className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                  className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                  Resolve
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Comments</p>
                <div className="max-h-40 overflow-auto space-y-2">
                  {selectedTicket.commentsParsed.length === 0 ? (
                    <p className="text-xs text-slate-500">No comments yet.</p>
                  ) : (
                    selectedTicket.commentsParsed.map((comment, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">
                          {comment.authorName || comment.from || "Unknown"} •{" "}
                          {comment.createdAt || comment.at || "-"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                          {comment.comment || comment.text || "-"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Write reply..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={replying || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0b2ba9] px-3 py-2 text-xs font-semibold text-white hover:bg-[#092186] disabled:opacity-60"
                  >
                    {replying ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {replying ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
