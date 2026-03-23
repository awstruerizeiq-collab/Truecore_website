export const DEFAULT_COMPANY_SUBSCRIPTION = {
  plan: "Basic",
  employeeLimit: 50,
  storageLimit: "10 GB",
  billingCycle: "monthly",
};

export const UPGRADE_MODAL_EVENT = "hrms:upgrade-plan";

const BASIC = "BASIC";
const PROFESSIONAL = "PROFESSIONAL";
const ENTERPRISE = "ENTERPRISE";
const NO_ACCESS = new Set();

const PLAN_ALIASES = {
  BASIC,
  STARTER: BASIC,
  PRO: PROFESSIONAL,
  PROF: PROFESSIONAL,
  PRO_PLAN: PROFESSIONAL,
  PROFESSIONAL_PLAN: PROFESSIONAL,
  PROFESSIONAL,
  GROWTH: PROFESSIONAL,
  ENTERPRISE,
  SCALE: ENTERPRISE,
};

const ROLE_ALIASES = {
  TEAM_LEAD: "TEAM_LEADER",
  TEAMLEAD: "TEAM_LEADER",
  TL: "TEAM_LEADER",
  COMPANY_ADMIN: "SUPER_ADMIN",
  GLOBALADMIN: "GLOBAL_ADMIN",
  GLOBAL_ADMINISTRATOR: "GLOBAL_ADMIN",
  SUPERADMIN: "SUPER_ADMIN",
};

const COMPANY_ROLES = new Set([
  "EMPLOYEE",
  "ADMIN",
  "SUPER_ADMIN",
  "TEAM_LEADER",
]);

const ROLE_SAFE_DEFAULT_PATHS = {
  SUPER_ADMIN: "/super-admin/dashboard",
  ADMIN: "/admin/dashboard",
  TEAM_LEADER: "/team-lead/dashboard",
  EMPLOYEE: "/employee/dashboard",
  GLOBAL_ADMIN: "/global-admin/dashboard",
};

export const PROFESSIONAL_EMPLOYEE_SWITCH_ROUTE_KEYS = [
  "home",
  "attendance",
  "financeHub",
  "document",
];

const BASIC_ROUTE_ACCESS = {
  EMPLOYEE: new Set(["home", "attendance", "document"]),
  ADMIN: new Set([
    "home",
    "dashboard",
    "addEmployee",
    "companyHierarchy",
    "manageEmployee",
    "attendance",
    "document",
  ]),
  SUPER_ADMIN: new Set([
    "dashboard",
    "addEmployee",
    "adminManagement",
    "manageEmployee",
    "payslip",
    "bills",
    "document",
  ]),
  TEAM_LEADER: new Set(["teamLeadDashboard", "home", "attendance", "document"]),
};

const PROFESSIONAL_ROUTE_ACCESS = {
  SUPER_ADMIN: new Set([
    "dashboard",
    "addEmployee",
    "adminManagement",
    "manageEmployee",
    "payslip",
    "bills",
    "document",
    "attendance",
    "accessControl",
  ]),
  ADMIN: new Set([
    "dashboard",
    "adminManagement",
    "companyHierarchy",
    "manageEmployee",
    "addEmployee",
    "financeHub",
    "financeOverview",
    "payroll",
    "payslipManagement",
    "tax",
    "reimbursements",
    "compliance",
    "auditLogs",
    "manualEntry",
    "autoPayroll",
    "settings",
    "attendance",
  ]),
  TEAM_LEADER: new Set(["teamLeadDashboard", "team", "attendance", "adminManagement"]),
  EMPLOYEE: new Set(["home", "attendance", "financeHub", "document", "payslip"]),
};

const BASIC_FEATURE_ACCESS = {
  SUPER_ADMIN: NO_ACCESS,
  ADMIN: new Set(["dashboardTotalEmployees", "dashboardPendingApprovals", "dashboardLiveAttendance"]),
  TEAM_LEADER: NO_ACCESS,
  EMPLOYEE: NO_ACCESS,
};

const PROFESSIONAL_FEATURE_ACCESS = {
  SUPER_ADMIN: NO_ACCESS,
  ADMIN: new Set(["dashboardTotalEmployees", "dashboardPendingApprovals"]),
  TEAM_LEADER: NO_ACCESS,
  EMPLOYEE: NO_ACCESS,
};

const BASIC_ATTENDANCE_TAB_ACCESS = {
  SUPER_ADMIN: NO_ACCESS,
  ADMIN: new Set(["dashboard", "employee"]),
  TEAM_LEADER: new Set(["dashboard", "employee"]),
  EMPLOYEE: new Set(["employeeAttendance"]),
};

const PROFESSIONAL_ATTENDANCE_TAB_ACCESS = {
  SUPER_ADMIN: new Set(["holidaysUpdate"]),
  ADMIN: new Set(["dashboard", "employee", "calendar", "leave", "assign"]),
  TEAM_LEADER: new Set(["dashboard", "employee", "calendar", "leave", "assign"]),
  EMPLOYEE: new Set(["employeeAttendance"]),
};

const BASIC_DASHBOARD_WIDGET_ACCESS = {
  SUPER_ADMIN: new Set(["ceoDashboard"]),
  ADMIN: new Set(["totalEmployees", "pendingApprovals"]),
  TEAM_LEADER: new Set(["teamLeadDashboard"]),
  EMPLOYEE: new Set(["applyLeave", "payslip", "attendance", "profile"]),
};

const PROFESSIONAL_DASHBOARD_WIDGET_ACCESS = {
  SUPER_ADMIN: new Set(["ceoDashboard"]),
  ADMIN: new Set([
    "totalEmployees",
    "pendingApprovals",
    "teamleaderManagement",
    "todayAttendanceSummary",
  ]),
  TEAM_LEADER: new Set(["teamLeadDashboard"]),
  EMPLOYEE: new Set(["attendance", "payslip"]),
};

const BASIC_QUICK_ACTION_ACCESS = {
  SUPER_ADMIN: NO_ACCESS,
  ADMIN: NO_ACCESS,
  TEAM_LEADER: NO_ACCESS,
  EMPLOYEE: NO_ACCESS,
};

const PROFESSIONAL_QUICK_ACTION_ACCESS = {
  SUPER_ADMIN: NO_ACCESS,
  ADMIN: NO_ACCESS,
  TEAM_LEADER: NO_ACCESS,
  EMPLOYEE: new Set(["attendance", "payslip"]),
};

const BASIC_ACTION_ACCESS = {
  SUPER_ADMIN: {
    manageEmployee: new Set(["*"]),
  },
  ADMIN: {
    manageEmployee: new Set(["*"]),
  },
  TEAM_LEADER: {
    manageEmployee: NO_ACCESS,
  },
  EMPLOYEE: {
    manageEmployee: NO_ACCESS,
  },
};

const PROFESSIONAL_ACTION_ACCESS = {
  SUPER_ADMIN: {
    manageEmployee: new Set(["*"]),
  },
  ADMIN: {
    manageEmployee: new Set(["*"]),
  },
  TEAM_LEADER: {
    manageEmployee: NO_ACCESS,
  },
  EMPLOYEE: {
    manageEmployee: NO_ACCESS,
  },
};

const PLAN_ACCESS_CONFIG = {
  [BASIC]: {
    routes: BASIC_ROUTE_ACCESS,
    features: BASIC_FEATURE_ACCESS,
    attendanceTabs: BASIC_ATTENDANCE_TAB_ACCESS,
    dashboardWidgets: BASIC_DASHBOARD_WIDGET_ACCESS,
    quickActions: BASIC_QUICK_ACTION_ACCESS,
    actions: BASIC_ACTION_ACCESS,
  },
  [PROFESSIONAL]: {
    routes: PROFESSIONAL_ROUTE_ACCESS,
    features: PROFESSIONAL_FEATURE_ACCESS,
    attendanceTabs: PROFESSIONAL_ATTENDANCE_TAB_ACCESS,
    dashboardWidgets: PROFESSIONAL_DASHBOARD_WIDGET_ACCESS,
    quickActions: PROFESSIONAL_QUICK_ACTION_ACCESS,
    actions: PROFESSIONAL_ACTION_ACCESS,
  },
};

const PLAN_MODULE_BUCKETS = {
  ROUTE: "routes",
  ROUTES: "routes",
  FEATURE: "features",
  FEATURES: "features",
  ATTENDANCE_TAB: "attendanceTabs",
  ATTENDANCE_TABS: "attendanceTabs",
  DASHBOARD_WIDGET: "dashboardWidgets",
  DASHBOARD_WIDGETS: "dashboardWidgets",
  QUICK_ACTION: "quickActions",
  QUICK_ACTIONS: "quickActions",
  ACTION: "actions",
  ACTIONS: "actions",
};

const FEATURE_LABELS = {
  dashboardTotalEmployees: "Total Employees",
  dashboardPendingApprovals: "Pending Approvals",
  dashboardLiveAttendance: "Live Attendance",
};

const ROUTE_LABELS = {
  home: "Home",
  dashboard: "Dashboard",
  attendance: "Attendance",
  document: "Documents",
  addEmployee: "Add Employee",
  companyHierarchy: "Company Hierarchy",
  manageEmployee: "Manage Employee",
  adminManagement: "Admin Management",
  payslip: "Payslip",
  bills: "Bills",
  teamLeadDashboard: "Team Lead Dashboard",
  financeHub: "Finance Hub",
  financeOverview: "Finance Overview",
  payroll: "Payroll",
  manualEntry: "Manual Entry",
  autoPayroll: "Auto Payroll",
  payslipManagement: "Payslip Management",
  tax: "Tax",
  reimbursements: "Reimbursements",
  compliance: "Compliance",
  auditLogs: "Audit Logs",
  profile: "Profile",
  support: "Support",
  notifications: "Notifications",
  performance: "Performance",
  assets: "Assets",
  policies: "Policies",
  leaveManagement: "Leave Management",
  timesheet: "Timesheet",
  reports: "Reports",
  settings: "Settings",
  team: "Team",
  tasks: "Tasks",
  exitDetails: "Exit Details",
  accessControl: "Access Control",
  company: "Company",
};

const ROUTE_KEY_PATH_MATCHERS = [
  { routeKey: "dashboard", paths: ["/admin/dashboard", "/admin", "/super-admin/dashboard"] },
  { routeKey: "teamLeadDashboard", paths: ["/team-lead/dashboard", "/team-lead"] },
  { routeKey: "home", paths: ["/employee/dashboard", "/employee"] },
  { routeKey: "attendance", paths: ["/admin/attendance", "/team-lead/attendance", "/super-admin/attendance", "/employee/attendance"] },
  { routeKey: "adminManagement", paths: ["/admin/management", "/super-admin/admin-management", "/team-lead/management"] },
  { routeKey: "manageEmployee", paths: ["/admin/employees", "/super-admin/employees"] },
  { routeKey: "payslip", paths: ["/super-admin/payslip", "/employee/payslip"] },
  { routeKey: "bills", paths: ["/super-admin/bills"] },
  { routeKey: "document", paths: ["/admin/documents", "/super-admin/documents", "/employee/documents"] },
  { routeKey: "accessControl", paths: ["/super-admin/access-control"] },
  { routeKey: "companyHierarchy", paths: ["/admin/hierarchy"] },
  { routeKey: "financeHub", paths: ["/admin/finance", "/employee/finance"] },
  { routeKey: "team", paths: ["/team-lead/team"] },
];

const STORAGE_PLAN_KEYS = [
  "planType",
  "companyPlanType",
  "companyPlan",
  "subscriptionPlan",
  "plan",
];

const STORAGE_ROLE_KEYS = ["userRole", "role", "user_role"];

const JSON_STORAGE_KEYS = [
  "companySubscription",
  "subscription",
  "company",
  "companyContext",
  "auth",
  "user",
];

const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim() ||
    "";
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  return (fromEnv || fallbackOrigin || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
};

const buildApiUrl = (path) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

const normalizeString = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const readFromStorage = (storage, key) => {
  try {
    return storage?.getItem?.(key) ?? "";
  } catch {
    return "";
  }
};

const writeToStorage = (storage, key, value) => {
  try {
    if (!storage?.setItem) return;
    storage.setItem(key, value);
  } catch {
    // no-op
  }
};

const writeJsonToStorage = (storage, key, value) => {
  try {
    writeToStorage(storage, key, JSON.stringify(value));
  } catch {
    // no-op
  }
};

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const readStructuredValues = () => {
  const records = [];

  JSON_STORAGE_KEYS.forEach((key) => {
    [localStorage, sessionStorage].forEach((storage) => {
      const parsed = safeParse(readFromStorage(storage, key));
      if (parsed && typeof parsed === "object") {
        records.push(parsed);
      }
    });
  });

  return records;
};

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const getNestedCandidate = (record, keys) => {
  for (const key of keys) {
    if (record && typeof record === "object" && key in record) {
      return record[key];
    }
  }
  return undefined;
};

const extractRawStoredPlan = () =>
  pickFirst(
    ...STORAGE_PLAN_KEYS.flatMap((key) => [
      readFromStorage(localStorage, key),
      readFromStorage(sessionStorage, key),
    ]),
    ...readStructuredValues().flatMap((record) => [
      getNestedCandidate(record, ["planType", "plan", "subscriptionPlan"]),
      getNestedCandidate(record?.subscription, ["planType", "plan"]),
      getNestedCandidate(record?.company, ["planType", "plan"]),
    ]),
  );

const hasExplicitStoredPlan = () =>
  String(extractRawStoredPlan() || "").trim().length > 0;

export const normalizePlan = (planType) => {
  const normalized = normalizeString(planType).replace(/_PLAN$/, "");
  return PLAN_ALIASES[normalized] || BASIC;
};

export const normalizeRole = (roleLike) => {
  const normalized = normalizeString(roleLike);
  return ROLE_ALIASES[normalized] || normalized;
};

const toPlanLabel = (planLike) => {
  const normalized = normalizePlan(planLike);
  if (normalized === BASIC) return "Basic";
  if (normalized === PROFESSIONAL) return "Professional";
  return "Enterprise";
};

export const persistCompanySubscriptionContext = (source = {}) => {
  const planType = pickFirst(
    source?.planType,
    source?.plan,
    source?.subscriptionPlan,
    source?.subscription?.planType,
    source?.subscription?.plan,
    source?.company?.planType,
    source?.company?.plan,
  );

  if (!String(planType || "").trim()) {
    return null;
  }

  const normalizedPlan = normalizePlan(planType);
  const normalizedPlanLabel = toPlanLabel(normalizedPlan);
  const employeeLimit = Number(
    pickFirst(
      source?.employeeLimit,
      source?.subscription?.employeeLimit,
      source?.company?.employeeLimit,
    ),
  ) || DEFAULT_COMPANY_SUBSCRIPTION.employeeLimit;
  const storageLimit = String(
    pickFirst(
      source?.storageLimit,
      source?.subscription?.storageLimit,
      source?.company?.storageLimit,
    ) || DEFAULT_COMPANY_SUBSCRIPTION.storageLimit,
  );
  const billingCycle = String(
    pickFirst(
      source?.billingCycle,
      source?.subscription?.billingCycle,
      source?.company?.billingCycle,
    ) || DEFAULT_COMPANY_SUBSCRIPTION.billingCycle,
  ).toLowerCase();

  const subscriptionPayload = {
    plan: normalizedPlanLabel,
    planType: normalizedPlan,
    employeeLimit,
    storageLimit,
    billingCycle,
  };

  const companyPayload = {
    companyId: pickFirst(source?.companyId, source?.id, source?.company?.id),
    tenantCode: pickFirst(source?.tenantCode, source?.company?.tenantCode),
    plan: normalizedPlanLabel,
    planType: normalizedPlan,
    employeeLimit,
    storageLimit,
    billingCycle,
  };

  [localStorage, sessionStorage].forEach((storage) => {
    writeToStorage(storage, "planType", normalizedPlan);
    writeToStorage(storage, "companyPlanType", normalizedPlan);
    writeToStorage(storage, "companyPlan", normalizedPlanLabel);
    writeToStorage(storage, "subscriptionPlan", normalizedPlanLabel);
    writeToStorage(storage, "plan", normalizedPlanLabel);
    writeJsonToStorage(storage, "companySubscription", subscriptionPayload);
    writeJsonToStorage(storage, "subscription", subscriptionPayload);
    writeJsonToStorage(storage, "companyContext", companyPayload);
  });

  return normalizedPlan;
};

export const hydrateCompanySubscriptionFromApi = async (overrides = {}) => {
  try {
    const seededPlan = persistCompanySubscriptionContext(
      overrides?.seedData || overrides?.company || overrides || {},
    );
    if (seededPlan) {
      return seededPlan;
    }

    if (hasExplicitStoredPlan() && !overrides?.force) {
      return normalizePlan(extractRawStoredPlan());
    }

    const rawToken =
      (overrides?.token || "").trim() ||
      (readFromStorage(localStorage, "token") || "").trim() ||
      (readFromStorage(sessionStorage, "token") || "").trim();
    const companyId = String(
      pickFirst(
        overrides?.companyId,
        readFromStorage(localStorage, "companyId"),
        readFromStorage(sessionStorage, "companyId"),
      ) || "",
    ).trim();

    if (!rawToken || !companyId) {
      return null;
    }

    const authorization = /^Bearer\s+/i.test(rawToken)
      ? rawToken
      : `Bearer ${rawToken}`;

    const endpoints = [
      buildApiUrl(`/api/companies/${companyId}`),
      buildApiUrl(`/api/global-admin/companies/${companyId}`),
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
        });

        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const companyData = payload?.data || payload;
        const hydratedPlan = persistCompanySubscriptionContext(companyData);
        if (hydratedPlan) {
          return hydratedPlan;
        }
      } catch {
        // continue to next endpoint
      }
    }
  } catch {
    // no-op
  }

  return null;
};

export const isCompanyRole = (roleLike) => COMPANY_ROLES.has(normalizeRole(roleLike));

export const getDefaultRouteForRole = (roleLike) =>
  ROLE_SAFE_DEFAULT_PATHS[normalizeRole(roleLike)] || "/";

const getPlanConfig = (planLike) => PLAN_ACCESS_CONFIG[normalizePlan(planLike)] || null;

const normalizeAccessModule = (moduleLike) =>
  PLAN_MODULE_BUCKETS[normalizeString(moduleLike)] || "";

const getRoleAccessSet = (planLike, roleLike, bucketKey) => {
  const planConfig = getPlanConfig(planLike);
  if (!planConfig) return null;

  const role = normalizeRole(roleLike);
  const roleMap = planConfig[bucketKey];
  if (!roleMap) return null;

  return roleMap[role] || NO_ACCESS;
};

const normalizeActionName = (value) => String(value || "").trim().toLowerCase();

const resolveRouteKeyByPath = (pathLike) => {
  const path = String(pathLike || "").trim().toLowerCase();
  if (!path) return "";

  for (const entry of ROUTE_KEY_PATH_MATCHERS) {
    const matched = entry.paths.some((prefix) => {
      const base = prefix.toLowerCase();
      return path === base || path.startsWith(`${base}/`);
    });
    if (matched) return entry.routeKey;
  }

  return "";
};

export const resolveAccessContext = (overrides = {}) => {
  const records = readStructuredValues();
  const companyRecord = records.find((record) => record?.plan || record?.planType || record?.subscription) || {};
  const subscriptionRecord =
    records.find((record) => record?.employeeLimit || record?.storageLimit || record?.billingCycle) || {};

  const storedPlan = pickFirst(
    overrides.planType,
    overrides.plan,
    ...STORAGE_PLAN_KEYS.flatMap((key) => [
      readFromStorage(localStorage, key),
      readFromStorage(sessionStorage, key),
    ]),
    getNestedCandidate(overrides.company, ["planType", "plan", "subscriptionPlan"]),
    getNestedCandidate(overrides.subscription, ["planType", "plan"]),
    ...records.flatMap((record) => [
      getNestedCandidate(record, ["planType", "plan", "subscriptionPlan"]),
      getNestedCandidate(record?.subscription, ["planType", "plan"]),
      getNestedCandidate(record?.company, ["planType", "plan"]),
    ]),
  );

  const storedRole = pickFirst(
    overrides.role,
    overrides.userRole,
    ...STORAGE_ROLE_KEYS.flatMap((key) => [
      readFromStorage(localStorage, key),
      readFromStorage(sessionStorage, key),
    ]),
    getNestedCandidate(overrides.user, ["role", "userRole"]),
    ...records.flatMap((record) => [
      getNestedCandidate(record, ["role", "userRole"]),
      getNestedCandidate(record?.user, ["role", "userRole"]),
    ]),
  );

  const normalizedPlan = normalizePlan(storedPlan);
  const normalizedRole = normalizeRole(storedRole);

  return {
    role: normalizedRole,
    plan: normalizedPlan,
    isBasicPlan: normalizedPlan === BASIC,
    companySubscription: {
      plan: normalizedPlan === BASIC ? "Basic" : normalizedPlan === PROFESSIONAL ? "Professional" : "Enterprise",
      employeeLimit:
        Number(
          pickFirst(
            overrides.employeeLimit,
            overrides.company?.employeeLimit,
            overrides.subscription?.employeeLimit,
            subscriptionRecord.employeeLimit,
            companyRecord.employeeLimit,
          ),
        ) || DEFAULT_COMPANY_SUBSCRIPTION.employeeLimit,
      storageLimit:
        pickFirst(
          overrides.storageLimit,
          overrides.company?.storageLimit,
          overrides.subscription?.storageLimit,
          subscriptionRecord.storageLimit,
          companyRecord.storageLimit,
        ) || DEFAULT_COMPANY_SUBSCRIPTION.storageLimit,
      billingCycle:
        String(
          pickFirst(
            overrides.billingCycle,
            overrides.company?.billingCycle,
            overrides.subscription?.billingCycle,
            subscriptionRecord.billingCycle,
            companyRecord.billingCycle,
          ) || DEFAULT_COMPANY_SUBSCRIPTION.billingCycle,
        ).toLowerCase(),
    },
  };
};

export const hasPlanAccess = (planLike, roleLike, moduleLike, subFeature = "") => {
  const role = normalizeRole(roleLike);
  if (!isCompanyRole(role)) return true;

  const plan = normalizePlan(planLike);
  const planConfig = getPlanConfig(plan);
  if (!planConfig) return true;

  const bucket = normalizeAccessModule(moduleLike);
  if (!bucket) return true;

  if (bucket === "actions") {
    const roleActions = planConfig.actions?.[role] || {};
    const [actionModule = "", actionName = ""] = String(subFeature || "").split(".");
    if (!actionModule) return false;

    const allowedActions = roleActions[actionModule] || NO_ACCESS;
    if (!actionName) return allowedActions.size > 0;

    const normalizedAction = normalizeActionName(actionName);
    return allowedActions.has("*") || allowedActions.has(normalizedAction);
  }

  const allowedSet = getRoleAccessSet(plan, role, bucket);
  if (!allowedSet) return true;

  const key = String(subFeature || "").trim();
  if (!key) return true;

  return allowedSet.has(key);
};

export const hasRouteAccess = (roleLike, planType, routeKey) => {
  if (!routeKey) return true;
  return hasPlanAccess(planType, roleLike, "routes", routeKey);
};

export const isProfessionalEmployeeSwitchActive = (accessContext = {}, pathLike = "") => {
  const role = normalizeRole(accessContext.role);
  const plan = normalizePlan(accessContext.plan);
  const path =
    String(pathLike || "").trim().toLowerCase() ||
    (typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "");
  const switchTarget =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("dashboardSwitchTarget") || ""
      : "";
  const switchOrigin =
    typeof sessionStorage !== "undefined"
      ? (sessionStorage.getItem("dashboardSwitchOrigin") || "").trim().toUpperCase()
      : "";

  return (
    plan === PROFESSIONAL &&
    path.startsWith("/employee") &&
    switchTarget === "employee" &&
    (role === "ADMIN" || role === "TEAM_LEADER") &&
    (switchOrigin === "" || switchOrigin === "ADMIN" || switchOrigin === "TEAM_LEADER")
  );
};

export const canAccessProfessionalEmployeeSwitchRoute = (
  accessContext = {},
  routeKey = "",
  pathLike = "",
) => {
  if (!isProfessionalEmployeeSwitchActive(accessContext, pathLike)) {
    return false;
  }

  if (!routeKey) {
    return true;
  }

  return PROFESSIONAL_EMPLOYEE_SWITCH_ROUTE_KEYS.includes(String(routeKey).trim());
};

export const hasFeatureAccess = (roleLike, planType, featureKey) => {
  if (!featureKey) return true;
  return hasPlanAccess(planType, roleLike, "features", featureKey);
};

export const canAccessRoute = (planLike, roleLike, pathLike) => {
  const routeKey = resolveRouteKeyByPath(pathLike);
  if (!routeKey) return true;
  return hasRouteAccess(roleLike, planLike, routeKey);
};

const filterByAccessSet = (items = [], allowedSet = null, keyName = "id") => {
  if (!Array.isArray(items)) return [];
  if (!allowedSet) return items;
  if (allowedSet.has("*")) return items;

  return items.filter((item) => allowedSet.has(String(item?.[keyName] || "").trim()));
};

export const getVisibleSidebarItems = (planLike, roleLike, items = []) => {
  if (!Array.isArray(items)) return [];

  const deepFilter = (menuItems) =>
    menuItems
      .map((item) => {
        if (!hasRouteAccess(roleLike, planLike, item.routeKey)) {
          return null;
        }

        if (!Array.isArray(item.children)) {
          return item;
        }

        const children = deepFilter(item.children);
        return { ...item, children };
      })
      .filter(Boolean);

  return deepFilter(items);
};

export const getAllowedSidebarItems = (roleLike, planType, items = []) =>
  getVisibleSidebarItems(planType, roleLike, items);

export const getVisibleAttendanceTabs = (planLike, roleLike, tabs = []) => {
  const allowedSet = getRoleAccessSet(planLike, roleLike, "attendanceTabs");
  return filterByAccessSet(tabs, allowedSet, "id");
};

export const getVisibleDashboardWidgets = (planLike, roleLike, widgets = []) => {
  const allowedSet = getRoleAccessSet(planLike, roleLike, "dashboardWidgets");
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return allowedSet ? Array.from(allowedSet) : [];
  }

  return filterByAccessSet(widgets, allowedSet, "id");
};

export const getVisibleQuickActions = (planLike, roleLike, actions = []) => {
  const allowedSet = getRoleAccessSet(planLike, roleLike, "quickActions");
  return filterByAccessSet(actions, allowedSet, "id");
};

export const hasActionAccess = (roleLike, planLike, moduleKey, actionKey) => {
  const module = String(moduleKey || "").trim();
  const action = normalizeActionName(actionKey);
  if (!module || !action) return false;
  return hasPlanAccess(planLike, roleLike, "actions", `${module}.${action}`);
};

export const getUpgradeState = (roleLike, planType, targetKey) => {
  const role = normalizeRole(roleLike);
  const plan = normalizePlan(planType);
  const targetLabel = FEATURE_LABELS[targetKey] || ROUTE_LABELS[targetKey] || "this feature";

  if (plan !== BASIC || !isCompanyRole(role)) {
    return {
      title: "Access Restricted",
      message: `You do not currently have access to ${targetLabel}.`,
      ctaLabel: "Update Your Plan",
      targetLabel,
    };
  }

  return {
    title: "Access Denied",
    message: `${targetLabel} is not available for the ${role.replace(/_/g, " ")} role on the Basic plan.`,
    ctaLabel: "Update Your Plan",
    targetLabel,
  };
};

export const openUpgradeModal = (targetKey, context = {}) => {
  if (typeof window === "undefined") return;

  const detail = {
    ...resolveAccessContext(context),
    targetKey,
  };

  window.dispatchEvent(new CustomEvent(UPGRADE_MODAL_EVENT, { detail }));
};
