import axios from "axios";

const getBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_SUPPORT_API_BASE_URL?.trim() ||
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    "http://localhost:8080";

  return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

export const getCurrentUserMeta = () => {
  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    sessionStorage.getItem("userRole") ||
    "EMPLOYEE";

  return {
    userId:
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      sessionStorage.getItem("id") ||
      "anonymous",
    userName:
      localStorage.getItem("fullName") ||
      sessionStorage.getItem("fullName") ||
      localStorage.getItem("userName") ||
      sessionStorage.getItem("userName") ||
      localStorage.getItem("companyName") ||
      "Unknown User",
    userRole: normalizeRole(role),
    companyName:
      localStorage.getItem("companyName") ||
      sessionStorage.getItem("companyName") ||
      localStorage.getItem("tenantCode") ||
      "",
  };
};

const withHeaders = (extra = {}) => {
  const tenantCode =
    (localStorage.getItem("tenantCode") || "").trim() ||
    (sessionStorage.getItem("tenantCode") || "").trim();
  const companyId =
    (localStorage.getItem("companyId") || "").trim() ||
    (sessionStorage.getItem("companyId") || "").trim();
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  const userRole =
    (localStorage.getItem("role") || "").trim() ||
    (sessionStorage.getItem("role") || "").trim() ||
    (localStorage.getItem("userRole") || "").trim() ||
    (sessionStorage.getItem("userRole") || "").trim();
  return {
    headers: {
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
      ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
      ...(companyId ? { "X-Company-Id": companyId } : {}),
      ...(userRole ? { "X-User-Role": userRole } : {}),
      ...extra,
    },
  };
};

export const supportTicketApi = {
  async createTicket(payload) {
    // Backend accepts JSON TicketRequest (subject, description, category, priority).
    const request = {
      subject: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
    };
    const response = await api.post("/api/tickets", request, withHeaders());
    return response.data;
  },

  async getTickets(filters = {}) {
    const response = await api.get("/api/tickets", {
      ...withHeaders(),
      params: filters,
    });
    return response.data;
  },

  async getTicketById(id) {
    const response = await api.get(`/api/tickets/${id}`, withHeaders());
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put(`/api/tickets/${id}/status`, { status }, withHeaders());
    return response.data;
  },

  async addReply(id, message) {
    const response = await api.post(`/api/tickets/${id}/comment`, { comment: message }, withHeaders());
    return response.data;
  },

  async deleteTicket(id) {
    const response = await api.delete(`/api/support-tickets/${id}`, withHeaders());
    return response.data;
  },

  async getNotifications() {
    const response = await api.get("/api/tickets/notifications", withHeaders());
    return response.data;
  },

  getDownloadUrl(ticketId, fileName) {
    return `${api.defaults.baseURL}/api/tickets/${ticketId}/download/${fileName}`;
  },
};

export const privilegedSupportRoles = [
  "SUPER_ADMIN",
  "GLOBAL_ADMIN",
  "CEO",
  "ADMIN",
  "MANAGER",
  "DIRECTOR",
];

export const isPrivilegedSupportUser = () => {
  const role = getCurrentUserMeta().userRole;
  return privilegedSupportRoles.includes(role);
};
