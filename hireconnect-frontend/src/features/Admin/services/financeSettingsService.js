const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();

  if (fromEnv && !isLocalHost) {
    return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  if (isLocalHost) {
    return "http://localhost:8080";
  }

  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const url = (path) => {
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  const clean = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${clean}` : `/${clean}`;
};

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();

  if (!raw) return "";
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

const getCompanyId = () => {
  const raw =
    (localStorage.getItem("companyId") || "").trim() ||
    (sessionStorage.getItem("companyId") || "").trim();

  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getTenantCode = () =>
  (localStorage.getItem("tenantCode") || "").trim() ||
  (sessionStorage.getItem("tenantCode") || "").trim() ||
  "";

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const parseError = async (res, payload) => {
  if (payload?.message) return payload.message;
  try {
    const text = await res.text();
    if (text && text.trim()) return text;
  } catch {
    // ignore
  }
  return `Request failed (HTTP ${res.status})`;
};

const baseHeaders = () => {
  const auth = getAuthHeader();
  const companyId = getCompanyId();
  const tenantCode = getTenantCode();

  if (!companyId) {
    throw new Error("companyId missing in storage. Please login again.");
  }

  return {
    "Content-Type": "application/json",
    ...(auth ? { Authorization: auth } : {}),
    "X-Company-Id": String(companyId),
    ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
  };
};

export const fetchFinanceSettings = async () => {
  const res = await fetch(url("/api/finance/settings"), {
    method: "GET",
    headers: baseHeaders(),
  });
  const payload = await safeJson(res);

  if (!res.ok || payload?.success === false) {
    throw new Error(await parseError(res, payload));
  }

  return payload?.data || null;
};

export const updateFinanceSettings = async (settingsPayload) => {
  const companyId = getCompanyId();
  const tenantCode = getTenantCode();

  const body = {
    ...settingsPayload,
    ...(companyId ? { companyId } : {}),
    ...(tenantCode ? { tenantCode } : {}),
  };

  const res = await fetch(url("/api/finance/settings"), {
    method: "PUT",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });
  const payload = await safeJson(res);

  if (!res.ok || payload?.success === false) {
    throw new Error(await parseError(res, payload));
  }

  return payload?.data || null;
};
