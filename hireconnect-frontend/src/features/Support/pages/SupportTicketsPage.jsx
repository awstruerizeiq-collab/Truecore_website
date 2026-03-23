import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCcw,
  Send,
  Trash2,
} from "lucide-react";
import {
  getCurrentUserMeta,
  isPrivilegedSupportUser,
  supportTicketApi,
} from "../services/supportTicketApi";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function SupportTicketsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUserMeta();
  const canManage = isPrivilegedSupportUser();
  const isGlobalAdminSupportRoute = location.pathname.startsWith("/global-admin/support");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [reply, setReply] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "MEDIUM",
    attachment: null,
  });
  const [creating, setCreating] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    fromDate: "",
    toDate: "",
    userName: "",
  });

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => String(value || "").trim() !== ""),
    [filters]
  );

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
        ...(filters.toDate ? { toDate: filters.toDate } : {}),
        ...(filters.userName ? { userName: filters.userName } : {}),
      };

      const response = await supportTicketApi.getTickets(params);
      setTickets(Array.isArray(response?.data) ? response.data : []);
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || fetchError.message || "Failed to load tickets.");
      setNotice("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (hasActiveFilters) {
        loadTickets();
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [filters]);

  useEffect(() => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }

    const findLocal = tickets.find((ticket) => ticket.id === ticketId || ticket.ticketId === ticketId);
    if (findLocal) {
      setSelectedTicket(findLocal);
      return;
    }

    const fetchById = async () => {
      try {
        const response = await supportTicketApi.getTicketById(ticketId);
        setSelectedTicket(response?.data || null);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Unable to load ticket details.");
      }
    };

    fetchById();
  }, [ticketId, tickets]);

  const openDetails = (ticket) => {
    setSelectedTicket(ticket);
    navigate(ticket.id, { replace: false });
  };

  const closeDetails = () => {
    setSelectedTicket(null);
    const pathPrefix = window.location.pathname.split("/").slice(0, 3).join("/");
    navigate(pathPrefix, { replace: true });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setNotice("");
      await supportTicketApi.createTicket(form);
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        category: "General",
        priority: "MEDIUM",
        attachment: null,
      });
      await loadTickets();
    } catch (createError) {
      setError(createError?.response?.data?.message || createError.message || "Failed to create ticket.");
      setNotice("");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedTicket) return;

    try {
      setError("");
      setNotice("");
      await supportTicketApi.updateStatus(selectedTicket.id, nextStatus);
      await loadTickets();
      const updated = await supportTicketApi.getTicketById(selectedTicket.id);
      setSelectedTicket(updated?.data || null);
    } catch (statusError) {
      setError(statusError?.response?.data?.message || statusError.message || "Failed to update status.");
      setNotice("");
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;

    try {
      setSubmittingReply(true);
      setError("");
      setNotice("");
      await supportTicketApi.addReply(selectedTicket.id, reply.trim());
      setReply("");
      const updated = await supportTicketApi.getTicketById(selectedTicket.id);
      setSelectedTicket(updated?.data || null);
      await loadTickets();
    } catch (replyError) {
      setError(replyError?.response?.data?.message || replyError.message || "Failed to send reply.");
      setNotice("");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTicket || !canManage || deletingTicketId) return;
    setDeleteTarget(selectedTicket);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canManage || deletingTicketId) return;

    const target = deleteTarget;
    try {
      setDeletingTicketId(target.id);
      setError("");
      setNotice("");
      await supportTicketApi.deleteTicket(target.id);
      setTickets((prev) => prev.filter((item) => item.id !== target.id));
      if (selectedTicket?.id === target.id) {
        closeDetails();
      }
      setDeleteTarget(null);
      setNotice("Ticket deleted successfully");
      await loadTickets();
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || deleteError.message || "Failed to delete ticket.");
      setNotice("");
    } finally {
      setDeletingTicketId(null);
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-5 text-slate-900">
      <div className="rounded-2xl bg-[#0b2ba9] px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-blue-100 mt-1">
          Create, track, and manage support issues across all HRMS roles.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {toTitleCase(status)}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="">All Priority</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {toTitleCase(priority)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          />

          <input
            type="text"
            value={filters.userName}
            onChange={(e) => setFilters((prev) => ({ ...prev, userName: e.target.value }))}
            placeholder="Search by user name"
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 flex-1 min-w-[200px]"
          />

          <button
            type="button"
            onClick={loadTickets}
            className="h-10 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>

          {!isGlobalAdminSupportRoute && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="h-10 inline-flex items-center gap-2 rounded-lg bg-[#0b2ba9] px-4 text-sm font-semibold text-white"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-[#0b2ba9] text-white text-sm">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ticket ID</th>
                <th className="text-left px-4 py-3 font-semibold">User Name</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Priority</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Created Date</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading tickets...
                    </span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-3 text-slate-700">{ticket.ticketId}</td>
                    <td className="px-4 py-3 text-slate-700">{ticket.userName}</td>
                    <td className="px-4 py-3 text-slate-700">{ticket.category}</td>
                    <td className="px-4 py-3 text-slate-700">{toTitleCase(ticket.priority)}</td>
                    <td className="px-4 py-3 text-slate-700">{toTitleCase(ticket.status)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(ticket)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ticket)}
                            disabled={Boolean(deletingTicketId)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingTicketId === ticket.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
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

      {selectedTicket && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">{selectedTicket.ticketId}</p>
              <h2 className="text-lg font-semibold text-slate-900">{selectedTicket.title}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedTicket.userName} ({selectedTicket.userRole}) - {selectedTicket.companyName || "N/A"}
              </p>
            </div>
            <button type="button" onClick={closeDetails} className="text-sm text-[#0b2ba9]">
              Close
            </button>
          </div>

          <p className="text-sm text-slate-700">{selectedTicket.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Category</p>
              <p className="font-semibold text-slate-800">{selectedTicket.category}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Priority</p>
              <p className="font-semibold text-slate-800">{toTitleCase(selectedTicket.priority)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-800">{toTitleCase(selectedTicket.status)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Created</p>
              <p className="font-semibold text-slate-800">{formatDate(selectedTicket.createdAt)}</p>
            </div>
          </div>

          {Array.isArray(selectedTicket.attachments) && selectedTicket.attachments.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Attachments</p>
              <div className="space-y-2">
                {selectedTicket.attachments.map((attachment) => (
                  <a
                    key={attachment.fileName}
                    href={supportTicketApi.getDownloadUrl(selectedTicket.id, attachment.fileName)}
                    className="inline-flex items-center gap-2 text-sm text-[#0b2ba9]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" /> {attachment.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">Conversation</p>
            <div className="max-h-52 overflow-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                <p className="text-xs text-slate-500">No replies yet.</p>
              ) : (
                selectedTicket.replies.map((item, idx) => (
                  <div key={`${item.createdAt}-${idx}`} className="rounded-lg bg-white border border-slate-200 p-2">
                    <p className="text-xs text-slate-500">
                      {item.senderName} ({item.senderRole}) - {formatDate(item.createdAt)}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReply}
                disabled={submittingReply || !reply.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0b2ba9] px-4 py-2 text-white text-sm disabled:opacity-60"
              >
                {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Reply
              </button>

              {canManage && STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  {toTitleCase(status)}
                </button>
              ))}

              {canManage && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={Boolean(deletingTicketId)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingTicketId === selectedTicket.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!deletingTicketId) setDeleteTarget(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Delete Support Ticket</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this support ticket?
              {deleteTarget.ticketId ? (
                <>
                  {" "}
                  <span className="font-semibold text-slate-800">({deleteTarget.ticketId})</span>
                </>
              ) : null}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingTicketId)}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingTicketId)}
                className="h-10 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {Boolean(deletingTicketId) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && !isGlobalAdminSupportRoute && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <form
            onSubmit={handleCreate}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Support Ticket</h3>
              <button type="button" className="text-sm text-slate-500" onClick={() => setShowCreate(false)}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {toTitleCase(priority)}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] || null }))}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm py-1.5"
              />
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              User: <strong>{currentUser.userName}</strong> ({currentUser.userRole})
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="h-10 rounded-lg bg-[#0b2ba9] px-4 text-sm text-white inline-flex items-center gap-2 disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
