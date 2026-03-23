import rbacApi from "../../../lib/rbacApi.js";

const INVOICE_STORE_KEY = "hrms:billing:invoices:v1";
const TAX_RATE = 0.18;

const PLAN_PRICING_MONTHLY = {
  Basic: 39,
  Professional: 59,
  Enterprise: 99,
};

const BILLING_CYCLE_MONTHS = {
  Monthly: 1,
  Quarterly: 3,
  Yearly: 12,
};

const unwrapData = (res) => res?.data?.data ?? res?.data ?? null;

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readInvoiceStore = () =>
  safeParse(localStorage.getItem(INVOICE_STORE_KEY), {});

const writeInvoiceStore = (store) => {
  localStorage.setItem(INVOICE_STORE_KEY, JSON.stringify(store || {}));
};

const normalizePlan = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "standard") return "Professional";
  if (normalized === "professional" || normalized === "growth" || normalized === "pro") {
    return "Professional";
  }
  if (normalized === "enterprise" || normalized === "scale") {
    return "Enterprise";
  }
  return "Basic";
};

const normalizeBillingCycle = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "quarterly") return "Quarterly";
  if (normalized === "yearly" || normalized === "annual") return "Yearly";
  return "Monthly";
};

const normalizeSubscriptionStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "trial") return "Trial";
  if (normalized === "cancelled") return "Cancelled";
  return "Expired";
};

const normalizePaymentStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "paid" || normalized === "success") return "Paid";
  if (normalized === "overdue") return "Overdue";
  if (normalized === "unpaid") return "Unpaid";
  return "Pending";
};

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const isPastDate = (value) => {
  const iso = toIsoDate(value);
  if (!iso) return false;
  const target = new Date(iso);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return target < now;
};

const addMonths = (value, months) => {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return toIsoDate(new Date());
  base.setMonth(base.getMonth() + Number(months || 1));
  return base.toISOString().slice(0, 10);
};

const makeInvoiceId = () =>
  `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const makeInvoiceNumber = (companyId) => {
  const y = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}-${companyId}-${suffix}`;
};

const fetchCompaniesRaw = async () => {
  const res = await rbacApi.get("/api/global-admin/companies");
  const raw = unwrapData(res);
  return Array.isArray(raw) ? raw : [];
};

const fetchUsersRaw = async () => {
  try {
    const res = await rbacApi.get("/api/users");
    const raw = unwrapData(res);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const buildUserCounts = (users) => {
  const counts = {};
  (users || []).forEach((user) => {
    const companyId = String(user?.companyId ?? "").trim();
    if (!companyId) return;
    const status = String(user?.status || "").trim().toLowerCase();
    if (!counts[companyId]) counts[companyId] = { active: 0, inactive: 0 };
    if (status === "active") counts[companyId].active += 1;
    else counts[companyId].inactive += 1;
  });
  return counts;
};

const sortInvoices = (invoices = []) =>
  [...invoices].sort((a, b) => String(b.invoiceDate || "").localeCompare(String(a.invoiceDate || "")));

const buildCompanyRow = (company, userCounts, invoiceStore) => {
  const companyId = Number(company?.id || 0);
  const key = String(companyId);
  const companyName = company?.displayName || company?.legalName || `Company ${key}`;
  const plan = normalizePlan(company?.plan);
  const billingCycle = normalizeBillingCycle(company?.billingCycle);
  const monthMultiplier = BILLING_CYCLE_MONTHS[billingCycle] || 1;
  const activeFromUsers = Number(userCounts?.[key]?.active || 0);
  const inactiveFromUsers = Number(userCounts?.[key]?.inactive || 0);
  const configuredEmployees = Number(company?.employees || 0);
  const hasUserBreakdown = activeFromUsers + inactiveFromUsers > 0;
  const activeEmployees = hasUserBreakdown ? activeFromUsers : configuredEmployees;
  const inactiveEmployees = hasUserBreakdown ? inactiveFromUsers : 0;
  const billableEmployees = Math.max(0, hasUserBreakdown ? activeFromUsers + inactiveFromUsers : configuredEmployees);
  const ratePerEmployee = Number(PLAN_PRICING_MONTHLY[plan] || 0);
  const monthlyAmount = Number((ratePerEmployee * billableEmployees).toFixed(2));
  const billingAmount = Number((monthlyAmount * monthMultiplier).toFixed(2));
  const taxAmount = Number((billingAmount * TAX_RATE).toFixed(2));
  const totalAmount = Number((billingAmount + taxAmount).toFixed(2));
  const registeredDate = toIsoDate(company?.createdDate || company?.startDate) || toIsoDate(new Date());
  const subscriptionStatus = normalizeSubscriptionStatus(company?.status);
  const invoices = sortInvoices(invoiceStore?.[key] || []);
  const sentInvoiceCount =
    invoices.filter((invoice) => Boolean(invoice?.sentAt)).length || invoices.length;
  const latestInvoice = invoices[0] || null;
  let paymentStatus = normalizePaymentStatus(latestInvoice?.paymentStatus);
  if (!latestInvoice) {
    paymentStatus = subscriptionStatus === "Expired" ? "Unpaid" : "Pending";
  } else if (paymentStatus !== "Paid" && isPastDate(latestInvoice?.dueDate)) {
    paymentStatus = "Overdue";
  }

  const nextBillingDate = latestInvoice?.dueDate
    ? (
      paymentStatus === "Paid"
        ? addMonths(latestInvoice.dueDate, monthMultiplier)
        : toIsoDate(latestInvoice.dueDate)
    ) || addMonths(company?.startDate || company?.createdDate || new Date(), monthMultiplier)
    : addMonths(company?.startDate || company?.createdDate || new Date(), monthMultiplier);

  const pendingAmount = latestInvoice
    ? (
      paymentStatus === "Paid"
        ? 0
        : Number(
          latestInvoice?.totalAmount ||
          Number((Number(latestInvoice?.billingAmount || billingAmount) + Number(latestInvoice?.taxAmount || taxAmount)).toFixed(2)),
        )
    )
    : (paymentStatus === "Paid" ? 0 : totalAmount);

  return {
    companyId,
    companyName,
    companyDisplayName: String(company?.displayName || "").trim(),
    companyLegalName: String(company?.legalName || "").trim(),
    tenantCode: String(company?.tenantCode || "").trim(),
    plan,
    billingCycle,
    activeEmployees,
    inactiveEmployees,
    billableEmployees,
    ratePerEmployee,
    monthlyAmount,
    billingAmount,
    taxAmount,
    totalAmount,
    pendingAmount,
    invoiceCount: invoices.length,
    sentInvoiceCount,
    nextBillingDate,
    subscriptionStatus,
    paymentStatus,
    registeredDate,
  };
};

const buildSummary = (rows = []) => {
  const totalCompanies = rows.length;
  const activeSubscriptions = rows.filter((r) => r.subscriptionStatus === "Active").length;
  const expiredSubscriptions = rows.filter((r) => r.subscriptionStatus === "Expired").length;
  const totalMonthlyRevenue = rows.reduce((sum, r) => sum + Number(r.monthlyAmount || 0), 0);
  const totalPendingPayments = rows.reduce((sum, r) => sum + Number(r.pendingAmount || 0), 0);

  return {
    totalCompanies,
    activeSubscriptions,
    expiredSubscriptions,
    totalMonthlyRevenue,
    totalPendingPayments,
  };
};

const getCompanyRowById = async (companyId) => {
  const normalizedId = Number(companyId);
  if (!normalizedId) {
    throw new Error("Invalid company id.");
  }

  const [companies, users] = await Promise.all([fetchCompaniesRaw(), fetchUsersRaw()]);
  const userCounts = buildUserCounts(users);
  const invoiceStore = readInvoiceStore();
  const target = companies.find((company) => Number(company?.id) === normalizedId);

  if (!target) {
    throw new Error("Company not found.");
  }

  return {
    row: buildCompanyRow(target, userCounts, invoiceStore),
    key: String(normalizedId),
    store: invoiceStore,
  };
};

export const fetchBillingCompanies = async () => {
  const [companies, users] = await Promise.all([fetchCompaniesRaw(), fetchUsersRaw()]);
  const userCounts = buildUserCounts(users);
  const invoiceStore = readInvoiceStore();
  const rows = companies.map((company) => buildCompanyRow(company, userCounts, invoiceStore));

  return {
    summary: buildSummary(rows),
    companies: rows,
  };
};

export const fetchCompanyBilling = async (companyId) => {
  const { row, key, store } = await getCompanyRowById(companyId);
  return {
    ...row,
    invoices: sortInvoices(store?.[key] || []),
  };
};

export const generateInvoice = async (companyId) => {
  const { row, key, store } = await getCompanyRowById(companyId);
  const invoiceDate = toIsoDate(new Date());
  const monthMultiplier = BILLING_CYCLE_MONTHS[row.billingCycle] || 1;
  const dueDate = addMonths(invoiceDate, monthMultiplier);
  const billingAmount = Number(row.billingAmount || 0);
  const taxAmount = Number(row.taxAmount || 0);
  const totalAmount = Number(row.totalAmount || 0);

  const invoice = {
    id: makeInvoiceId(),
    companyId: row.companyId,
    invoiceNumber: makeInvoiceNumber(row.companyId),
    invoiceDate,
    dueDate,
    planName: row.plan,
    billingCycle: row.billingCycle,
    employeeCount: Number(row.billableEmployees || 0),
    billingAmount,
    taxAmount,
    totalAmount,
    paymentStatus: "Pending",
    // Generate Invoice should immediately make the bill visible to Super Admin.
    sentAt: new Date().toISOString(),
    paidAt: null,
  };

  const existing = Array.isArray(store[key]) ? store[key] : [];
  store[key] = [invoice, ...existing];
  writeInvoiceStore(store);
  return invoice;
};

export const sendInvoice = async (companyId) => {
  const { key, store } = await getCompanyRowById(companyId);
  let invoices = Array.isArray(store[key]) ? [...store[key]] : [];

  if (invoices.length === 0) {
    await generateInvoice(companyId);
    const refreshed = readInvoiceStore();
    invoices = Array.isArray(refreshed[key]) ? [...refreshed[key]] : [];
  }

  if (invoices.length === 0) {
    throw new Error("No invoice available to send.");
  }

  invoices[0] = {
    ...invoices[0],
    sentAt: new Date().toISOString(),
  };

  store[key] = invoices;
  writeInvoiceStore(store);
  return invoices[0];
};

export const markInvoicePaid = async (invoiceId) => {
  const id = String(invoiceId || "").trim();
  if (!id) throw new Error("Invoice id is required.");

  const store = readInvoiceStore();
  let updatedInvoice = null;

  Object.keys(store).forEach((companyKey) => {
    const invoices = Array.isArray(store[companyKey]) ? store[companyKey] : [];
    store[companyKey] = invoices.map((invoice) => {
      if (String(invoice?.id) !== id) return invoice;
      updatedInvoice = {
        ...invoice,
        paymentStatus: "Paid",
        paidAt: new Date().toISOString(),
      };
      return updatedInvoice;
    });
  });

  if (!updatedInvoice) {
    throw new Error("Invoice not found.");
  }

  writeInvoiceStore(store);
  return updatedInvoice;
};
