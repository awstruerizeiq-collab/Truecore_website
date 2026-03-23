const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (!raw) return "";
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

const getCompanyId = () => {
  const raw =
    localStorage.getItem("companyId") ||
    sessionStorage.getItem("companyId") ||
    "";
  const parsed = Number(String(raw).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }
  const text = await res.text().catch(() => "");
  return { message: text || "Unexpected response" };
};

const buildHeaders = (companyId) => {
  const auth = getAuthHeader();
  return {
    "Content-Type": "application/json",
    ...(auth ? { Authorization: auth } : {}),
    ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
  };
};

export const fetchPayslipRecords = async ({ search = "", month = "" } = {}) => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("companyId is missing in storage.");

  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (month.trim()) params.set("month", month.trim());
  params.set("companyId", String(companyId));

  const res = await fetch(
    `${API_BASE_URL}/api/payslips/management?${params.toString()}`,
    { method: "GET", headers: buildHeaders(companyId) }
  );
  const payload = await parseResponse(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || "Failed to fetch payslip records");
  }
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const generatePayslip = async (payrollId) => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("companyId is missing in storage.");

  const res = await fetch(
    `${API_BASE_URL}/api/payslips/management/${payrollId}/generate?companyId=${companyId}`,
    { method: "POST", headers: buildHeaders(companyId) }
  );
  const payload = await parseResponse(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || "Failed to generate payslip");
  }
  return payload?.data;
};

export const generatePayslipBulk = async (payrollIds) => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("companyId is missing in storage.");

  const res = await fetch(
    `${API_BASE_URL}/api/payslips/management/generate-bulk?companyId=${companyId}`,
    {
      method: "POST",
      headers: buildHeaders(companyId),
      body: JSON.stringify({ payrollIds }),
    }
  );
  const payload = await parseResponse(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || "Failed to generate payslips in bulk");
  }
  return payload?.data || {};
};

export const getPayslipPreviewUrl = (payrollId) =>
  `${API_BASE_URL}/api/payslips/management/${payrollId}/preview`;

export const getPayslipDownloadUrl = (payrollId) =>
  `${API_BASE_URL}/api/payslips/management/${payrollId}/download`;

export const getPayslipRequestHeaders = () => buildHeaders(getCompanyId());

export const getPayslipCompanyId = () => getCompanyId();

export const fetchPayrollById = async (payrollId) => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("companyId is missing in storage.");

  const res = await fetch(
    `${API_BASE_URL}/api/payroll/${payrollId}?companyId=${companyId}`,
    { method: "GET", headers: buildHeaders(companyId) }
  );
  const payload = await parseResponse(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || "Failed to fetch payroll details");
  }
  return payload?.data || null;
};

export const fetchPayslipTemplateContext = async () => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("companyId is missing in storage.");

  const headers = buildHeaders(companyId);
  let company = {};
  let templateVariant = "template_1";

  const companyRes = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
    method: "GET",
    headers,
  });
  const companyPayload = await parseResponse(companyRes);
  if (!companyRes.ok || companyPayload?.success === false) {
    throw new Error(companyPayload?.message || "Failed to fetch company details");
  }
  company = companyPayload?.data || {};

  const templateRes = await fetch(
    `${API_BASE_URL}/api/payslip-generator/config/${companyId}`,
    { method: "GET", headers }
  );
  const templatePayload = await parseResponse(templateRes);
  if (templateRes.ok && templatePayload?.success !== false) {
    const variant = String(templatePayload?.data?.templateVariant || "").trim().toLowerCase();
    if (["template_1", "template_2", "template_3"].includes(variant)) {
      templateVariant = variant;
    }
  }

  return { companyId, company, templateVariant };
};
