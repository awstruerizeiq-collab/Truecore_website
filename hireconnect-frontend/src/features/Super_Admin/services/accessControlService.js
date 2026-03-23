const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim() ||
    "http://localhost:8080";
  return fromEnv.replace(/\/+$/, "");
};

const API_BASE_URL = getApiBaseUrl();

const safeParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

export const getCompanyContext = () => {
  const localContext = safeParse(localStorage.getItem("companyContext"));
  const sessionContext = safeParse(sessionStorage.getItem("companyContext"));
  const localUser = safeParse(localStorage.getItem("user"));
  const sessionUser = safeParse(sessionStorage.getItem("user"));
  const localAuth = safeParse(localStorage.getItem("auth"));
  const sessionAuth = safeParse(sessionStorage.getItem("auth"));

  const companyIdRaw = String(
    pickFirst(
      localStorage.getItem("companyId"),
      sessionStorage.getItem("companyId"),
      localContext?.companyId,
      sessionContext?.companyId,
      localUser?.companyId,
      sessionUser?.companyId,
      localAuth?.companyId,
      sessionAuth?.companyId,
      localUser?.company_id,
      sessionUser?.company_id
    ) || ""
  ).trim();

  const companyId = Number(companyIdRaw);

  return {
    companyId: Number.isFinite(companyId) && companyId > 0 ? companyId : null,
  };
};

const getAuthHeaders = () => {
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  return token
    ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` }
    : {};
};

const unwrapResponse = (payload) => payload?.data ?? payload;

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }
  return unwrapResponse(payload);
};

export const fetchAccessControlModules = async (companyId) => {
  if (!companyId) {
    throw new Error("companyId is required.");
  }
  return requestJson(`/api/super-admin/access-control/modules?companyId=${encodeURIComponent(companyId)}`);
};

export const saveAccessControlModule = async (moduleKey, payload) => {
  if (!moduleKey) {
    throw new Error("moduleKey is required.");
  }
  return requestJson(`/api/super-admin/access-control/modules/${encodeURIComponent(moduleKey)}`, {
    method: "POST",
    body: payload,
  });
};

export const fetchAccessControlDashboard = async (companyId) => {
  if (!companyId) {
    throw new Error("companyId is required.");
  }
  return requestJson(`/api/super-admin/access-control/dashboard?companyId=${encodeURIComponent(companyId)}`);
};

export const fetchAccessControlActivity = async (companyId) => {
  if (!companyId) {
    throw new Error("companyId is required.");
  }
  return requestJson(`/api/super-admin/access-control/activity?companyId=${encodeURIComponent(companyId)}`);
};
