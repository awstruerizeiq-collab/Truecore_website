'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  BookOpen,
  HelpCircle,
  FileText,
  Send,
  RefreshCw,
} from 'lucide-react';

// API Configuration
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tenantCode = localStorage.getItem('tenantCode');
  const companyId = localStorage.getItem('companyId');

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }),
    ...(tenantCode && { 'X-Tenant-Code': tenantCode }),
    ...(companyId && { 'X-Company-Id': companyId }),
  };
};


const statusDot = (status) => {
  if (status === 'open') return 'bg-blue-500';
  if (status === 'in-progress') return 'bg-yellow-500';
  if (status === 'resolved') return 'bg-green-500';
  if (status === 'closed') return 'bg-gray-500';
  return 'bg-slate-400';
};

const priorityClass = (priority) => {
  const p = (priority || '').toLowerCase();
  if (p === 'urgent') return 'text-red-500';
  if (p === 'high') return 'text-orange-500';
  if (p === 'medium') return 'text-yellow-500';
  if (p === 'low') return 'text-green-500';
  return 'text-slate-400';
};

export default function SupportCenter() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');

  // Parse comments from JSON string
  const parseComments = (commentsJson) => {
    if (!commentsJson) return [];
    try {
      const parsed = JSON.parse(commentsJson);
      return parsed.map(c => ({
        from: c.authorName || c.from || 'Unknown',
        text: c.comment || c.text || '',
        at: c.createdAt || c.at || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  };

  // Fetch all tickets from API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const result = await response.json();
      const ticketsData = result.data || [];

      // Transform backend data to match frontend format
      const transformedTickets = ticketsData.map(ticket => ({
        ...ticket,
        ticketId: ticket.ticketId || `TKT-${ticket.id}`,
        status: (ticket.status || '').toLowerCase().replace('_', '-'),
        priority: ticket.priority || 'MEDIUM',
        comments: parseComments(ticket.comments),
      }));

      setTickets(transformedTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inprogress = tickets.filter((t) => t.status === 'in-progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    return { total, open, inprogress, resolved };
  }, [tickets]);

  // Filtered list
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${t.ticketId || ''} ${t.subject || ''} ${t.employeeName || ''} ${t.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && (t.priority || '').toLowerCase() !== filterPriority)
        return false;
      if (filterCategory !== 'all' && (t.category || '').toLowerCase() !== filterCategory)
        return false;
      return true;
    });
  }, [tickets, search, filterStatus, filterPriority, filterCategory]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(
      tickets
        .map((t) => (t.category || '').toLowerCase())
        .filter((c) => c && c.trim().length > 0),
    );
    return Array.from(set);
  }, [tickets]);

  // Change ticket status
  const changeTicketStatus = async (ticketId, status) => {
    try {
      const ticket = tickets.find(t => t.ticketId === ticketId);
      if (!ticket) return;

      // Convert frontend status format to backend format
      const backendStatus = status.toUpperCase().replace('-', '_');

      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: backendStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      // Refresh tickets
      await fetchTickets();

      // Update selected ticket if it's the current one
      if (selectedTicket?.id === ticket.id) {
        const updatedTicket = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
          headers: getAuthHeaders(),
        }).then(r => r.json());

        if (updatedTicket.data) {
          const transformed = {
            ...updatedTicket.data,
            ticketId: updatedTicket.data.ticketId || `TKT-${updatedTicket.data.id}`,
            status: (updatedTicket.data.status || '').toLowerCase().replace('_', '-'),
            comments: parseComments(updatedTicket.data.comments),
          };
          setSelectedTicket(transformed);
        }
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert('Failed to update ticket status: ' + err.message);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedTicket) return;
    if (!reply.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/comment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          comment: reply.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      // Refresh tickets
      await fetchTickets();

      // Update selected ticket
      const updatedResponse = await fetch(`${API_BASE_URL}/api/tickets/${selectedTicket.id}`, {
        headers: getAuthHeaders(),
      });

      if (updatedResponse.ok) {
        const result = await updatedResponse.json();
        if (result.data) {
          const transformed = {
            ...result.data,
            ticketId: result.data.ticketId || `TKT-${result.data.id}`,
            status: (result.data.status || '').toLowerCase().replace('_', '-'),
            comments: parseComments(result.data.comments),
          };
          setSelectedTicket(transformed);
        }
      }

      setReply('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment: ' + err.message);
    }
  };

  // Select default ticket when filtered list changes
  useEffect(() => {
    if (!selectedTicket && filtered.length) {
      setSelectedTicket(filtered[0]);
    }
    if (filtered.length === 0) setSelectedTicket(null);
  }, [filtered]);

  return (
    <div className="w-full min-h-screen bg-[#F5F7FF]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#011A8B]/15 blur-md" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#011A8B] shadow-md">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#011A8B]">
                Support Center
              </h1>
              <p className="text-sm text-gray-600">
                Manage employee tickets and resolve issues faster.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm text-sm">
                <Phone className="w-4 h-4 text-[#011A8B]" />
                <span className="text-gray-700">+1 (91) 123-4567</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm text-sm">
                <Mail className="w-4 h-4 text-[#011A8B]" />
                <span className="text-gray-700">support@hirecorehr.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E0E5FF]">
                    <BookOpen className="w-4 h-4 text-[#011A8B]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Knowledge Base
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Search internal articles</p>
              </div>
              <FileText className="w-7 h-7 text-gray-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFEDE5]">
                    <HelpCircle className="w-4 h-4 text-[#F97316]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">FAQs</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Common support answers</p>
              </div>
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E5F6FF]">
                    <FileText className="w-4 h-4 text-[#0284C7]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Documentation
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Guides & API docs</p>
              </div>
              <HelpCircle className="w-7 h-7 text-gray-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4E5]">
                    <Clock className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Avg Response
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">2.3 hours</p>
              </div>
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">Total Tickets</div>
            <div className="mt-1 text-2xl font-semibold text-[#011A8B]">
              {stats.total}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">Open</div>
            <div className="mt-1 text-2xl font-semibold text-[#0B82F6]">
              {stats.open}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="mt-1 text-2xl font-semibold text-[#D97706]">
              {stats.inprogress}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">Resolved</div>
            <div className="mt-1 text-2xl font-semibold text-[#16A34A]">
              {stats.resolved}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:gap-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket id, subject, employee..."
                className="w-full rounded-full border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/50"
              />
            </div>
            <button
              title="Filters"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
            >
              <option value="all">All status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
            >
              <option value="all">All priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ticket list */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">Tickets</h2>

              {loading ? (
                <div className="py-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#011A8B]"></div>
                  <p className="mt-3 text-sm text-gray-600">Loading tickets...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No tickets match the selected filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${selectedTicket?.id === t.id
                        ? 'border-[#011A8B] bg-[#F3F4FF]'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${statusDot(
                              t.status,
                            )}`}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {t.subject}
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                {t.ticketId}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {t.employeeName} · {t.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${priorityClass(t.priority)}`}>
                            {t.priority}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket details */}
          <div>
            <div className="min-h-[260px] rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              {selectedTicket ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-gray-400">
                        {selectedTicket.ticketId}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {selectedTicket.subject}
                      </h3>
                      <div className="mt-1 text-xs text-gray-500">
                        {selectedTicket.employeeName} · {selectedTicket.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${selectedTicket.status === 'open'
                          ? 'bg-blue-50 text-blue-700'
                          : selectedTicket.status === 'in-progress'
                            ? 'bg-amber-50 text-amber-700'
                            : selectedTicket.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                      >
                        <span
                          className={`mr-1 h-1.5 w-1.5 rounded-full ${statusDot(
                            selectedTicket.status,
                          )}`}
                        />
                        {selectedTicket.status}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {new Date(selectedTicket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    {selectedTicket.description}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        changeTicketStatus(selectedTicket.ticketId, 'in-progress')
                      }
                      className="flex-1 rounded-full bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() =>
                        changeTicketStatus(selectedTicket.ticketId, 'resolved')
                      }
                      className="flex-1 rounded-full bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                    >
                      Resolve
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold text-gray-800">
                      Comments
                    </div>
                    <div className="max-h-40 space-y-2 overflow-auto pr-1">
                      {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                        <div className="text-xs text-gray-400">No comments yet.</div>
                      )}
                      {selectedTicket.comments && selectedTicket.comments.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2"
                        >
                          <div className="text-[11px] text-gray-500">
                            {c.from} · {new Date(c.at).toLocaleString()}
                          </div>
                          <div className="mt-1 text-xs text-gray-800">{c.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply box */}
                  <div className="mt-4">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={sendReply}
                        className="inline-flex items-center gap-1 rounded-full bg-[#011A8B] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#02106a]"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E5FF]">
                    <MessageSquare className="h-5 w-5 text-[#011A8B]" />
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    Select a ticket to view details
                  </div>
                  <div className="text-xs text-gray-500">
                    Click on a ticket from the list to see full information here.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}