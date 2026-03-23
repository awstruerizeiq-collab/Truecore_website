const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

export const HOLIDAY_UPDATE_EVENT = "hrms:holidays-updated";
export const HOLIDAY_UPDATE_STORAGE_KEY = "hrms:holidays-updated-at";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return token.startsWith("Bearer ")
    ? { Authorization: token }
    : { Authorization: `Bearer ${token}` };
};

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
      const user = JSON.parse(localStorage.getItem("user"));
      return {
        tenantCode: tenantCode || user?.tenantCode || user?.tenant_code || "",
        companyId: companyId || user?.companyId || user?.company_id || "",
      };
    } catch {
      return { tenantCode, companyId };
    }
  }

  return { tenantCode, companyId };
};

const getTenantHeaders = () => {
  const { tenantCode, companyId } = getTenantContext();
  return {
    ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
    ...(companyId ? { "X-Company-Id": companyId } : {}),
  };
};

const buildQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.append(key, String(value));
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

const unwrapData = (payload) => payload?.data ?? payload ?? [];

export const toHolidayDateKey = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  const isoPrefixMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefixMatch) return isoPrefixMatch[1];

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeHoliday = (holiday) => ({
  id: holiday?.id ?? null,
  name: String(holiday?.name || "").trim(),
  date: toHolidayDateKey(holiday?.date),
  tags: Array.isArray(holiday?.tags)
    ? holiday.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [],
  updatedAt: holiday?.updatedAt ?? null,
});

export const normalizeHolidayFile = (file) => ({
  id: file?.id ?? null,
  fileName: String(file?.fileName || "").trim(),
  originalFileName: String(file?.originalFileName || "").trim(),
  fileType: String(file?.fileType || "").trim(),
  uploadedBy: String(file?.uploadedBy || "").trim(),
  uploadedAt: file?.uploadedAt ?? file?.uploadDate ?? null,
  filePath: String(file?.filePath || "").trim(),
  fileUrl: String(file?.fileUrl || "").trim(),
});

const fetchJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      "Holiday API request failed";
    throw new Error(message);
  }

  return payload;
};

export const fetchHolidays = async ({ year, month } = {}) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId, year, month });
  const payload = await fetchJson(`/api/holidays${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
  });
  return unwrapData(payload).map(normalizeHoliday);
};

export const createHoliday = async (holidayPayload) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  const payload = await fetchJson(`/api/holidays${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
    body: JSON.stringify(holidayPayload),
  });
  return normalizeHoliday(unwrapData(payload));
};

export const updateHoliday = async (holidayId, holidayPayload) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  const payload = await fetchJson(`/api/holidays/${holidayId}${query}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
    body: JSON.stringify(holidayPayload),
  });
  return normalizeHoliday(unwrapData(payload));
};

export const deleteHoliday = async (holidayId) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  await fetchJson(`/api/holidays/${holidayId}${query}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
  });
};

export const buildHolidayMapByDate = (holidayList) => {
  const map = {};
  (holidayList || []).forEach((holiday) => {
    const dateKey = toHolidayDateKey(holiday?.date);
    if (!dateKey) return;
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push({
      ...holiday,
      date: dateKey,
    });
  });
  return map;
};

export const emitHolidayUpdatedEvent = () => {
  const updatedAt = Date.now();
  if (typeof window !== "undefined") {
    try {
      window.localStorage?.setItem(HOLIDAY_UPDATE_STORAGE_KEY, String(updatedAt));
    } catch {
      // ignore storage write failures (private mode/quota/etc)
    }
  }
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOLIDAY_UPDATE_EVENT, { detail: { updatedAt } }));
};

export const fetchHolidayFiles = async () => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  const payload = await fetchJson(`/api/holidays/files${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
  });
  return unwrapData(payload).map(normalizeHolidayFile);
};

export const uploadHolidayFile = async (file) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/holidays/files/upload${query}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || "Failed to upload holiday file";
    throw new Error(message);
  }

  const data = unwrapData(payload);
  if (data?.file) {
    return {
      file: normalizeHolidayFile(data.file),
      importedHolidays: Array.isArray(data.importedHolidays) ? data.importedHolidays.map(normalizeHoliday) : [],
      importedCount: Number(data.importedCount) || 0,
      duplicateCount: Number(data.duplicateCount) || 0,
      duplicateMessages: Array.isArray(data.duplicateMessages) ? data.duplicateMessages : [],
    };
  }
  return normalizeHolidayFile(data);
};

export const deleteHolidayFile = async (fileId) => {
  const { tenantCode, companyId } = getTenantContext();
  const query = buildQuery({ tenantCode, companyId });
  await fetchJson(`/api/holidays/files/${fileId}${query}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getTenantHeaders(),
    },
  });
};