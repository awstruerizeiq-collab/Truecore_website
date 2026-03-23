import {
  fetchBillingCompanies,
  fetchCompanyBilling,
} from "../../GlobalAdmin/services/billingService.js";

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getScopedCompanyContext = () => {
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
      sessionUser?.company_id,
    ) || "",
  ).trim();
  const companyId = Number(companyIdRaw);

  const tenantCode = String(
    pickFirst(
      localStorage.getItem("tenantCode"),
      sessionStorage.getItem("tenantCode"),
      localContext?.tenantCode,
      sessionContext?.tenantCode,
      localUser?.tenantCode,
      sessionUser?.tenantCode,
      localAuth?.tenantCode,
      sessionAuth?.tenantCode,
    ) || "",
  ).trim();

  const companyName = String(
    pickFirst(
      localStorage.getItem("companyName"),
      sessionStorage.getItem("companyName"),
      localUser?.companyName,
      sessionUser?.companyName,
      localUser?.displayName,
      sessionUser?.displayName,
      localContext?.companyName,
      sessionContext?.companyName,
    ) || "",
  ).trim();

  const companyLegalName = String(
    pickFirst(
      localStorage.getItem("companyLegalName"),
      sessionStorage.getItem("companyLegalName"),
      localUser?.companyLegalName,
      sessionUser?.companyLegalName,
      localUser?.legalName,
      sessionUser?.legalName,
      localContext?.companyLegalName,
      sessionContext?.companyLegalName,
    ) || "",
  ).trim();

  return {
    companyId: Number.isFinite(companyId) && companyId > 0 ? companyId : null,
    tenantCode,
    companyName,
    companyLegalName,
  };
};

const isCompanyScopeMatch = (row, scope) => {
  const rowCompanyId = Number(row?.companyId || 0);
  const scopeId = Number(scope?.companyId || 0);
  if (scopeId > 0 && rowCompanyId === scopeId) return true;

  const rowTenantCode = normalizeText(row?.tenantCode);
  const scopeTenantCode = normalizeText(scope?.tenantCode);
  if (scopeTenantCode && rowTenantCode && rowTenantCode === scopeTenantCode) return true;

  const candidates = [
    row?.companyName,
    row?.companyDisplayName,
    row?.companyLegalName,
  ].map(normalizeText);

  const scopeName = normalizeText(scope?.companyName);
  const scopeLegal = normalizeText(scope?.companyLegalName);

  if (scopeName && candidates.includes(scopeName)) return true;
  if (scopeLegal && candidates.includes(scopeLegal)) return true;

  return false;
};

export const fetchBills = async () => {
  const context = getScopedCompanyContext();
  const billing = await fetchBillingCompanies();
  const rows = Array.isArray(billing?.companies) ? billing.companies : [];

  const scopedRow = rows.find((row) => isCompanyScopeMatch(row, context));
  const matchedRow = scopedRow || (rows.length === 1 ? rows[0] : null);
  const fallbackName =
    context.companyLegalName ||
    context.companyName ||
    matchedRow?.companyName ||
    "Your Company";

  if (!matchedRow?.companyId) {
    return {
      companyName: fallbackName,
      plan: "Basic",
      billingCycle: "Monthly",
      invoices: [],
    };
  }

  const detail = await fetchCompanyBilling(matchedRow.companyId);
  const invoices = Array.isArray(detail?.invoices) ? detail.invoices : [];
  const sentInvoices = invoices.filter((invoice) => Boolean(invoice?.sentAt));
  const visibleInvoices = sentInvoices.length > 0 ? sentInvoices : invoices;

  return {
    companyId: matchedRow.companyId,
    companyName: fallbackName,
    plan: detail?.plan || matchedRow.plan || "Basic",
    billingCycle: detail?.billingCycle || matchedRow.billingCycle || "Monthly",
    invoices: visibleInvoices,
  };
};
