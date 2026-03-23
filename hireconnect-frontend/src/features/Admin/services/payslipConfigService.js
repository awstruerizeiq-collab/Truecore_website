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

const getAuthHeader = (token) => {
  const raw =
    (token || "").trim() ||
    (localStorage.getItem("token") || "").trim();
  if (!raw) return "";
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};

export const getPayslipConfig = async (companyId, token, extraHeaders = {}) => {
  if (!companyId) {
    return {
      missing: true,
      message: "Payslip Generator not configured for this company.",
      components: [],
      templateVariant: "template_1",
    };
  }

  const baseUrl = getApiBaseUrl();
  const authHeader = getAuthHeader(token);

  const res = await fetch(`${baseUrl}/api/payslip-generator/config/${companyId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...extraHeaders,
    },
  });

  const payload = await res.json().catch(() => ({}));
  const message = payload?.message || "";

  if (!res.ok || payload?.success === false) {
    if (message.toLowerCase().includes("not configured")) {
      return {
        missing: true,
        message: "Payslip Generator not configured for this company.",
        components: [],
        templateVariant: "template_1",
      };
    }
    throw new Error(message || "Failed to load payslip configuration");
  }

  const components = Array.isArray(payload?.data?.components)
    ? payload.data.components
    : [];

  if (!components.length) {
    return {
      missing: true,
      message: "Payslip Generator not configured for this company.",
      components: [],
      templateVariant: "template_1",
    };
  }

  return {
    missing: false,
    message: "",
    components,
    templateVariant: payload?.data?.templateVariant || "template_1",
  };
};
