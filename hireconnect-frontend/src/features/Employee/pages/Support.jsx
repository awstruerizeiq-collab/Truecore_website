'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

// API Configuration
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }),
  };
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTicket, setViewingTicket] = useState(null);

  // Create form fields
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  // Fetch tickets from API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/tickets/my-tickets`, {
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

  // Parse comments from JSON string
  const parseComments = (comments) => {
    if (!comments) return [];

    try {
      const parsed = typeof comments === 'string'
        ? JSON.parse(comments)
        : comments;

      return parsed.map(c => {
        const rawDate = c.createdAt || c.at;

        const dateObj = rawDate ? new Date(rawDate) : null;

        return {
          from: c.authorName || 'Unknown',
          text: c.comment || '',
          at: dateObj && !isNaN(dateObj.getTime())
            ? dateObj.toISOString()
            : null,
        };
      });
    } catch (err) {
      console.error('parseComments error:', err);
      return [];
    }
  };


  useEffect(() => {
    fetchTickets();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(tickets.map((t) => t.category).filter(Boolean))),
    [tickets],
  );

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== 'all' && t.status !== activeTab) return false;

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${t.ticketId} ${t.subject} ${t.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [tickets, activeTab, categoryFilter, search]);

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      alert('Subject and description are required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subject: newSubject.trim(),
          description: newDescription.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const _result = await response.json();

      // Refresh tickets
      await fetchTickets();

      setShowCreateModal(false);
      setNewSubject('');
      setNewDescription('');
      setNewCategory('General');
      setNewPriority('MEDIUM');

      alert('Ticket created successfully!');
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Failed to create ticket: ' + err.message);
    }
  };

  const openView = (ticket) => {
    setViewingTicket(ticket);
    setShowViewModal(true);
  };

  const priorityBadgeClass = (p) => {
    const pp = (p || '').toLowerCase();
    if (pp === 'urgent') return 'bg-red-50 text-red-700 border border-red-200';
    if (pp === 'high') return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (pp === 'medium') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (pp === 'low') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const statusBadgeClass = (s) => {
    if (s === 'open') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (s === 'in-progress') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (s === 'resolved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

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
                My Support Tickets
              </h1>
              <p className="text-sm text-gray-600">
                Track the tickets you raised and interact with support.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#011A8B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#02106a]"
            >
              <Plus className="w-4 h-4" />
              Create New Ticket
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {/* Small help note */}
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-[#F3F4FF] px-4 py-2 text-xs text-gray-600">
          <HelpCircle className="h-4 w-4 text-[#011A8B]" />
          <span>
            For urgent issues, please call your HR / IT contact in addition to raising a ticket.
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Tickets' },
            { key: 'open', label: 'Open' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${activeTab === tab.key
                ? 'bg-[#011A8B] text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + category filter */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your tickets..."
              className="w-full rounded-full border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading && tickets.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#011A8B]"></div>
            <p className="mt-3 text-sm text-gray-600">Loading tickets...</p>
          </div>
        )}

        {/* Ticket cards grid */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => openView(t)}
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                          t.status,
                        )}`}
                      >
                        <Clock className="h-3 w-3" />
                        {t.status}
                      </span>
                      <span className="text-[11px] text-gray-400">{t.ticketId}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">
                      {t.subject}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {t.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClass(
                          t.priority,
                        )}`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-400">
                    <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                    <div className="mt-2">{t.comments?.length || 0} comments</div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 text-xs text-gray-600">
                  {t.description}
                </p>
              </button>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                No tickets found for the selected filters.
              </div>
            )}
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Create Ticket
                </h2>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Subject *
                  </label>
                  <input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
                    >
                      <option>General</option>
                      <option>Access</option>
                      <option>Payroll</option>
                      <option>Hardware</option>
                      <option>HR</option>
                      <option>IT_SUPPORT</option>
                    </select>
                  </div>

                  <div className="sm:w-40">
                    <label className="text-xs font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/40"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createTicket}
                    className="inline-flex items-center gap-1 rounded-full bg-[#011A8B] px-4 py-2 text-xs font-medium text-white hover:bg-[#02106a]"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Create Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Ticket Modal */}
        {showViewModal && viewingTicket && (
          <ViewTicketModal
            ticket={viewingTicket}
            onClose={() => {
              setShowViewModal(false);
              setViewingTicket(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* View Ticket Modal - Read Only for Employees */
function ViewTicketModal({ ticket, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-gray-400">{ticket.ticketId}</div>
            <h2 className="text-lg font-semibold text-gray-900">
              {ticket.subject}
            </h2>
            <div className="mt-1 text-xs text-gray-500">
              Category: {ticket.category} · Created: {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-700">{ticket.description}</p>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Comments
          </h3>
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {(!ticket.comments || ticket.comments.length === 0) && (
              <div className="text-xs text-gray-400">No comments yet.</div>
            )}
            {ticket.comments && ticket.comments.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="text-[11px] text-gray-500">
                  {c.from} · {c.at
                    ? new Date(c.at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : '—'}

                </div>
                <div className="mt-1 text-xs text-gray-800">{c.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
