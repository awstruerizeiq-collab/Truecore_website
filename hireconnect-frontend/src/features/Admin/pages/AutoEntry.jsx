import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Eye, FileText, Save, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SalaryComponentsForm from "../components/SalaryComponentsForm";
import { getPayslipConfig } from "../services/payslipConfigService";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
// Safe API base URL resolver (works for localhost + prod, no `process` crash)
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

// Read tenant/company context from localStorage
const getTenantContext = () => {
    const tenantCode = (localStorage.getItem("tenantCode") || "").trim();
    const companyIdRaw = (localStorage.getItem("companyId") || "").trim();

    const companyId =
        companyIdRaw && companyIdRaw !== "null" && companyIdRaw !== "undefined"
            ? Number(companyIdRaw)
            : null;

    return { tenantCode, companyId };
};

// Build headers (tenantCode + companyId)
const getTenantHeaders = () => {
    const { tenantCode, companyId } = getTenantContext();
    return {
        ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
        ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
    };
};

const FIELD_META = {
    grossSalary: { label: "Gross Salary", category: "earnings" },
    basicSalary: { label: "Basic Salary", category: "earnings" },
    da: { label: "DA (Dearness Allowance)", category: "earnings" },
    hra: { label: "HRA", category: "earnings" },
    conveyanceAllowance: { label: "Conveyance Allowance", category: "earnings" },
    medicalAllowance: { label: "Medical Allowance", category: "earnings" },
    lta: { label: "LTA", category: "earnings" },
    specialAllowance: { label: "Special Allowance", category: "earnings" },
    otherAllowances: { label: "Other Allowances", category: "earnings" },
    pfEmployee: { label: "PF Employee Contribution", category: "deductions" },
    professionalTax: { label: "Professional Tax", category: "deductions" },
    taxDeductions: { label: "Tax Deductions", category: "deductions" },
    otherDeductions: { label: "Other Deductions", category: "deductions" },
    esic: { label: "ESIC", category: "deductions" },
    medicalInsurance: { label: "Medical Insurance", category: "deductions" },
};

const COMPONENT_ALIAS_TO_FIELD = {
    "basic pay": "basicSalary",
    "basic salary (basic pay)": "basicSalary",
    "house rent allowance (hra)": "hra",
    hra: "hra",
    "dearness allowance (da)": "da",
    "special allowance": "specialAllowance",
    "conveyance allowance": "conveyanceAllowance",
    "medical allowance": "medicalAllowance",
    "leave travel allowance (lta)": "lta",
    lta: "lta",
    "other allowances": "otherAllowances",
    "employee pf": "pfEmployee",
    "employee provident fund (epf - deduction)": "pfEmployee",
    "professional tax": "professionalTax",
    "professional tax (deduction)": "professionalTax",
    "income tax (tds)": "taxDeductions",
    "income tax (tds - deduction)": "taxDeductions",
    "esi": "esic",
    "employee state insurance (esi)": "esic",
    "health insurance": "medicalInsurance",
    "medical insurance": "medicalInsurance",
    insurance: "medicalInsurance",
    "gross salary": "grossSalary",
};

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const normalizeRole = (role) =>
    String(role || "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

const ALLOWED_EMPLOYEE_SELECTION_ROLES = new Set([
    "EMPLOYEE",
    "ADMIN",
    "HR_MANAGER",
    "HRMANAGER",
    "TEAM_LEAD",
    "TEAMLEAD",
]);

const normalizeConfiguredFieldKey = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    if (FIELD_META[raw]) return raw;

    const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    const aliasByCompact = {
        grosssalary: "grossSalary",
        gross: "grossSalary",
        basicsalary: "basicSalary",
        basicpay: "basicSalary",
        da: "da",
        hra: "hra",
        conveyanceallowance: "conveyanceAllowance",
        medicalallowance: "medicalAllowance",
        lta: "lta",
        leavetravelallowance: "lta",
        specialallowance: "specialAllowance",
        otherallowances: "otherAllowances",
        pfemployee: "pfEmployee",
        pfemployeecontribution: "pfEmployee",
        employeepf: "pfEmployee",
        employeeprovidentfund: "pfEmployee",
        professionaltax: "professionalTax",
        taxdeductions: "taxDeductions",
        taxdeduction: "taxDeductions",
        incometax: "taxDeductions",
        tds: "taxDeductions",
        otherdeductions: "otherDeductions",
        esi: "esic",
        esic: "esic",
        medicalinsurance: "medicalInsurance",
        healthinsurance: "medicalInsurance",
        insurance: "medicalInsurance",
    };

    return aliasByCompact[compact] || null;
};

const canonicalizeComponentName = (value) =>
    normalizeText(value)
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const inferFieldKeyFromComponent = (componentName) => {
    const normalized = normalizeText(componentName);
    if (COMPONENT_ALIAS_TO_FIELD[normalized]) {
        return COMPONENT_ALIAS_TO_FIELD[normalized];
    }

    const text = canonicalizeComponentName(componentName);
    if (!text) return null;

    if (text.includes("gross salary")) return "grossSalary";
    if (text.includes("basic pay") || text.includes("basic salary")) return "basicSalary";
    if (text.includes("dearness allowance") || text === "da" || /\bda\b/.test(text)) return "da";
    if (text.includes("house rent allowance") || /\bhra\b/.test(text)) return "hra";
    if (text.includes("conveyance allowance")) return "conveyanceAllowance";
    if (text.includes("medical allowance")) return "medicalAllowance";
    if (text.includes("leave travel allowance") || /\blta\b/.test(text)) return "lta";
    if (text.includes("special allowance")) return "specialAllowance";
    if (text.includes("other allowances")) return "otherAllowances";
    if (
        text.includes("employee provident fund") ||
        text.includes("employee pf") ||
        /\bepf\b/.test(text) ||
        (/\bpf\b/.test(text) && !text.includes("employer"))
    ) {
        return "pfEmployee";
    }
    if (text.includes("professional tax")) return "professionalTax";
    if (text.includes("income tax") || /\btds\b/.test(text)) return "taxDeductions";
    if (
        text.includes("employee state insurance") ||
        /\besi\b/.test(text) ||
        /\besic\b/.test(text)
    ) {
        return "esic";
    }
    if (text.includes("medical insurance") || text.includes("health insurance")) {
        return "medicalInsurance";
    }
    if (text.includes("other deductions")) return "otherDeductions";

    return null;
};

const inferCategoryFromComponent = (componentName, explicitCategory, fieldKey) => {
    if (fieldKey && FIELD_META[fieldKey]?.category) {
        return FIELD_META[fieldKey].category;
    }
    if (explicitCategory) return explicitCategory;

    const text = canonicalizeComponentName(componentName);
    if (!text) return "earnings";
    if (
        text.includes("deduction") ||
        text.includes("tax") ||
        /\btds\b/.test(text) ||
        /\bpf\b/.test(text) ||
        /\bepf\b/.test(text) ||
        /\besi\b/.test(text) ||
        /\besic\b/.test(text) ||
        text.includes("insurance")
    ) {
        return "deductions";
    }
    return "earnings";
};

const resolveConfiguredFieldKey = (item) => {
    const explicit = normalizeConfiguredFieldKey(item?.fieldKey);
    if (explicit) return explicit;
    return inferFieldKeyFromComponent(item?.component);
};

const normalizeValueType = (valueType) =>
    ["percentage", "percent"].includes(
        String(valueType || "").trim().toLowerCase()
    )
        ? "percentage"
        : "amount";

const isGrossSalaryComponent = (componentName) => normalizeText(componentName) === "gross salary";
const GROSS_BREAKUP_FIELDS = new Set([
    "basicSalary",
    "da",
    "hra",
    "conveyanceAllowance",
    "medicalAllowance",
    "lta",
]);
const LEGACY_PERCENT_FIELDS = new Set(["basicSalary", "da", "hra"]);

export default function AutoEntry({ _onBack, token }) {
    const navigate = useNavigate();
    const payrollMonthInputRef = useRef(null);

    const [formData, setFormData] = useState({
        userId: "",
        username: "",
        payrollMonth: "",
        grossSalary: "",
        basicSalary: "",
        da: "",
        hra: "",
        conveyanceAllowance: "",
        medicalAllowance: "",
        lta: "",
        otherAllowances: "",
        specialAllowance: "",
        pfEmployee: "",
        professionalTax: "",
        taxDeductions: "",
        otherDeductions: "",
        esic: "",
        medicalInsurance: "",
        lopDays: 0,
        overtimeHours: 0,
        notes: "",
        autoGenerated: false,
        totalEarnings: 0,
        totalDeductions: 0,
    });

    const [netSalary, setNetSalary] = useState(0);
    const [baseGrossSalary, setBaseGrossSalary] = useState("");

    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState("");

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [configuredComponents, setConfiguredComponents] = useState([]);
    const [configLoading, setConfigLoading] = useState(false);
    const [configError, setConfigError] = useState("");
    const [configMissing, setConfigMissing] = useState(false);
    const [salaryComponentValues, setSalaryComponentValues] = useState({});
    const [salaryComponentErrors, setSalaryComponentErrors] = useState({});

    const configuredFields = useMemo(() => {
        const fields = configuredComponents
            .map((item) => {
                const key = resolveConfiguredFieldKey(item);
                return {
                    component: item.component,
                    key,
                    category: inferCategoryFromComponent(item.component, item.category, key),
                    mode: normalizeValueType(item.mode),
                    linkedComponents: Array.isArray(item.linkedComponents) ? item.linkedComponents : [],
                    linkedPercentages:
                        item?.linkedPercentages && typeof item.linkedPercentages === "object"
                            ? item.linkedPercentages
                            : {},
                };
            })
            .filter((item) => item.component);

        const hasGrossSalary = fields.some(
            (item) => item.key === "grossSalary" || normalizeText(item.component) === "gross salary"
        );
        if (!hasGrossSalary) {
            fields.unshift({
                component: "Gross Salary",
                key: "grossSalary",
                category: FIELD_META.grossSalary.category,
            });
        }

        return fields;
    }, [configuredComponents]);

    const visibleKnownFields = useMemo(
        () => configuredFields.filter((item) => item.key && FIELD_META[item.key]),
        [configuredFields]
    );

    const visibleKnownFieldSet = useMemo(
        () => new Set(visibleKnownFields.map((item) => item.key)),
        [visibleKnownFields]
    );

    const mappedComponents = useMemo(
        () =>
            configuredFields.map((item) => ({
                id: item.key || normalizeText(item.component),
                componentName: item.component,
                fieldKey: item.key || null,
                category: item.category || null,
                mode: item.mode || "amount",
                linkedComponents: item.linkedComponents || [],
                linkedPercentages: item.linkedPercentages || {},
            })),
        [configuredFields]
    );

    // -----------------------------
    // FETCH EMPLOYEES (tenant + company filtered)
    // -----------------------------
    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");

            const { tenantCode, companyId } = getTenantContext();

            // Optional: block request if missing tenant/company
            if (!tenantCode || !companyId) {
                setEmployees([]);
                setEmployeesError("Tenant Code / Company ID missing in localStorage.");
                return;
            }

            const authHeader =
                token && token.startsWith("Bearer ")
                    ? token
                    : token
                        ? `Bearer ${token}`
                        : null;

            const baseUrl = getApiBaseUrl();

            const res = await fetch(`${baseUrl}/api/users/tenant`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                    ...getTenantHeaders(),
                },
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.success === false) {
                throw new Error(
                    json.message || `Failed to load employees (status ${res.status})`
                );
            }

            const list = Array.isArray(json.data) ? json.data : [];

            // ✅ FRONTEND FILTER by companyId (no backend change)
            const filtered = list.filter((u) => {
                const normalizedRole = normalizeRole(
                    u.role || u.userRole || u.adminRole || u.position
                );
                return (
                    Number(u.companyId) === Number(companyId) &&
                    ALLOWED_EMPLOYEE_SELECTION_ROLES.has(normalizedRole)
                );
            });

            setEmployees(filtered);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
            setEmployeesError(err.message || "Failed to load employees.");
            toast.error("Failed to load employees list.");
        } finally {
            setEmployeesLoading(false);
        }
    };

    const fetchPayslipConfig = async () => {
        const { companyId } = getTenantContext();

        try {
            setConfigLoading(true);
            setConfigError("");
            setConfigMissing(false);
            const result = await getPayslipConfig(companyId, token, getTenantHeaders());
            setConfigMissing(result.missing);
            setConfigError(result.message || "");
            setConfiguredComponents(result.components || []);

            const nextValues = {};
            (result.components || []).forEach((item) => {
                const fieldKey = resolveConfiguredFieldKey(item) || normalizeText(item.component);
                nextValues[fieldKey] = {
                    valueType: normalizeValueType(item.mode),
                    value:
                        item.value === null || item.value === undefined
                            ? ""
                            : String(item.value),
                };
            });
            setSalaryComponentValues(nextValues);
            setSalaryComponentErrors({});
            setFormData((prev) => {
                const next = { ...prev };
                Object.entries(nextValues).forEach(([fieldKey, entry]) => {
                    if (FIELD_META[fieldKey]) {
                        const meta = mappedComponents.find((item) => item.fieldKey === fieldKey || item.id === fieldKey);
                        next[fieldKey] = meta
                            ? resolveComponentAmount(meta, nextValues, next)
                            : (entry.value === "" ? "" : Number(entry.value));
                    }
                });
                const totals = computeTotals(next, nextValues);
                setNetSalary(totals.netSalary);
                return {
                    ...next,
                    ...totals.computedFieldValues,
                    totalEarnings: totals.totalEarnings,
                    totalDeductions: totals.totalDeductions,
                };
            });
        } catch (err) {
            setConfigMissing(false);
            setConfigError(err.message || "Failed to load payslip configuration.");
        } finally {
            setConfigLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchPayslipConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const refresh = () => fetchPayslipConfig();
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -----------------------------
    // HANDLE EMPLOYEE SELECTION
    // -----------------------------
    const handleEmployeeChange = (e) => {
        const userId = e.target.value;

        const selectedEmp = employees.find(
            (emp) => String(emp.id) === String(userId)
        );

        setFormData((prev) => ({
            ...prev,
            userId,
            username: selectedEmp?.email || selectedEmp?.fullName || "",
        }));

        setSelectedEmployee(selectedEmp || null);
    };

    // -----------------------------
    // HANDLE FORM INPUT
    // -----------------------------
    const numericFields = [
        "grossSalary",
        "basicSalary",
        "da",
        "hra",
        "conveyanceAllowance",
        "medicalAllowance",
        "lta",
        "otherAllowances",
        "specialAllowance",
        "pfEmployee",
        "professionalTax",
        "taxDeductions",
        "otherDeductions",
        "esic",
        "medicalInsurance",
        "lopDays",
        "overtimeHours",
    ];

    const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

    const getEffectiveGrossAmount = (valuesMap, data) => {
        const grossComponent = mappedComponents.find(
            (component) => component.fieldKey === "grossSalary"
        );
        if (grossComponent) {
            const grossEntry = valuesMap?.[grossComponent.id];
            const hasGrossValue =
                grossEntry?.value !== undefined &&
                grossEntry?.value !== null &&
                String(grossEntry.value).trim() !== "";
            const rawGross = Number(grossEntry?.value);
            if (hasGrossValue && !Number.isNaN(rawGross)) {
                return round2(rawGross);
            }
        }
        return round2(Number(data.grossSalary) || 0);
    };

    const getCalculatedBasicAmount = (valuesMap, data) => {
        const gross = getEffectiveGrossAmount(valuesMap, data);
        const basicComponent = mappedComponents.find(
            (component) => component.fieldKey === "basicSalary"
        );
        if (!basicComponent) {
            const basicFromData = Number(data.basicSalary) || 0;
            return basicFromData > 0 ? basicFromData : 0;
        }

        const entry = valuesMap?.[basicComponent.id];
        if (!entry) {
            const basicFromData = Number(data.basicSalary) || 0;
            return basicFromData > 0 ? basicFromData : 0;
        }

        const raw = Number(entry.value);
        if (Number.isNaN(raw)) return 0;
        const isLegacyPercentStyle =
            normalizeValueType(entry.valueType) === "amount" &&
            raw >= 0 &&
            raw <= 100 &&
            gross >= 1000;
        if (normalizeValueType(entry.valueType) === "percentage" || isLegacyPercentStyle) {
            return round2((gross * raw) / 100);
        }
        return round2(Math.max(raw, 0));
    };

    const getPercentageBase = (fieldKey, valuesMap, data) => {
        if (fieldKey === "grossSalary") {
            return 0;
        }
        const gross = getEffectiveGrossAmount(valuesMap, data);
        const basic = getCalculatedBasicAmount(valuesMap, data);

        // Statutory/default behavior:
        // - Basic Salary % is based on Gross Salary
        // - DA, HRA and PF % are based on Basic Salary when available
        if (fieldKey === "basicSalary") {
            return gross > 0 ? gross : 0;
        }
        if (fieldKey === "da" || fieldKey === "hra" || fieldKey === "pfEmployee") {
            if (basic > 0) return basic;
            return gross > 0 ? gross : 0;
        }

        // Fallback for all other percentage components
        return gross > 0 ? gross : 0;
    };

    const findComponentMetaForPfLink = (linkedName) => {
        const normalized = normalizeText(linkedName);
        if (!normalized) return null;
        const byName = mappedComponents.find(
            (item) => normalizeText(item.componentName) === normalized
        );
        if (byName) return byName;
        const linkedFieldKey = resolveConfiguredFieldKey({ component: linkedName }) || null;
        if (!linkedFieldKey) return null;
        return mappedComponents.find((item) => item.fieldKey === linkedFieldKey) || null;
    };

    const resolveComponentAmount = (component, valuesMap, data, visited = new Set()) => {
        const componentId = component?.id || component?.fieldKey || "";
        if (visited.has(componentId)) return 0;
        const nextVisited = new Set(visited);
        nextVisited.add(componentId);

        if (component?.fieldKey === "pfEmployee") {
            const linkedNames = Array.isArray(component.linkedComponents)
                ? component.linkedComponents
                : [];
            const resolvedLinks = linkedNames
                .map((name) => ({ name, meta: findComponentMetaForPfLink(name) }))
                .filter(
                    ({ meta }) =>
                        meta &&
                        meta.id !== componentId &&
                        meta.fieldKey !== "pfEmployee"
                );
            if (!resolvedLinks.length) return 0;

            const linkedPctMap =
                component.linkedPercentages && typeof component.linkedPercentages === "object"
                    ? component.linkedPercentages
                    : {};
            const hasPct = resolvedLinks.some(
                (link) => Number(linkedPctMap[link.name] || 0) > 0
            );
            if (!hasPct) return 0;

            return round2(
                resolvedLinks.reduce((sum, link) => {
                    const amount = resolveComponentAmount(link.meta, valuesMap, data, nextVisited);
                    const pct = Number(linkedPctMap[link.name] || 0);
                    if (!Number.isFinite(amount) || !Number.isFinite(pct) || pct <= 0) return sum;
                    return sum + (amount * pct) / 100;
                }, 0)
            );
        }

        const entry = valuesMap?.[component.id];
        if (!entry) {
            return component.fieldKey ? round2(Number(data[component.fieldKey]) || 0) : 0;
        }
        if (
            component.fieldKey === "grossSalary" &&
            (entry.value === undefined || entry.value === null || String(entry.value).trim() === "")
        ) {
            return round2(Number(data.grossSalary) || 0);
        }
        const rawValue = Number(entry.value);
        if (Number.isNaN(rawValue)) return 0;
        const base = getPercentageBase(component.fieldKey, valuesMap, data);
        const isLegacyPercentStyle =
            normalizeValueType(entry.valueType) === "amount" &&
            LEGACY_PERCENT_FIELDS.has(component.fieldKey) &&
            rawValue >= 0 &&
            rawValue <= 100 &&
            Number(getEffectiveGrossAmount(valuesMap, data) || 0) >= 1000;
        if (normalizeValueType(entry.valueType) === "percentage" || isLegacyPercentStyle) {
            if (base <= 0) return 0;
            if (rawValue < 0) return 0;
            return round2((base * rawValue) / 100);
        }
        return round2(Math.max(rawValue, 0));
    };

    const getComponentCalculatedAmount = (component) => {
        return resolveComponentAmount(component, salaryComponentValues, formData);
    };

    const getPayrollMonthNumber = (payrollMonth) => {
        if (!payrollMonth) return null;
        const parts = String(payrollMonth).split("-");
        if (parts.length < 2) return null;
        const month = Number(parts[1]);
        return Number.isNaN(month) ? null : month;
    };

    const getDaysInPayrollMonth = (payrollMonth) => {
        if (!payrollMonth) return null;
        const parts = String(payrollMonth).split("-");
        if (parts.length < 2) return null;
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12)
            return null;
        return new Date(year, month, 0).getDate();
    };

    const formatPayrollMonthDisplay = (payrollMonth) => {
        if (!payrollMonth) return "";
        const parts = String(payrollMonth).split("-");
        if (parts.length < 3) return "";
        const [year, month, day] = parts;
        if (!year || !month || !day) return "";
        return `${day}-${month}-${year}`;
    };

    const computeTotals = (data, valuesMap = salaryComponentValues) => {
        if (!mappedComponents.length) {
            return {
                computedFieldValues: {},
                totalEarnings: 0,
                totalDeductions: 0,
                netSalary: 0,
            };
        }

        const computedFieldValues = {};
        let grossAmount = round2(Number(data.grossSalary) || 0);
        let additiveEarnings = 0;
        let fallbackEarnings = 0;
        let totalDeductions = 0;

        mappedComponents.forEach((component) => {
            const amount = resolveComponentAmount(component, valuesMap, data);
            if (component.fieldKey && FIELD_META[component.fieldKey]) {
                computedFieldValues[component.fieldKey] = amount;
            }
            if (component.fieldKey === "grossSalary") {
                grossAmount = amount;
                return;
            }

            const category =
                inferCategoryFromComponent(
                    component.componentName,
                    component.category,
                    component.fieldKey
                );

            if (category === "deductions") {
                totalDeductions += amount;
            } else {
                if (!component.fieldKey || !GROSS_BREAKUP_FIELDS.has(component.fieldKey)) {
                    additiveEarnings += amount;
                }
                fallbackEarnings += amount;
            }
        });

        const totalEarnings = grossAmount > 0 ? grossAmount + additiveEarnings : fallbackEarnings;

        return {
            computedFieldValues,
            totalEarnings: round2(totalEarnings),
            totalDeductions: round2(totalDeductions),
            netSalary: round2(totalEarnings - totalDeductions),
        };
    };

    const computeFromGross = (grossSalary, payrollMonth) => {
        const gross = Number(grossSalary) || 0;
        const basicRaw = gross * 0.5;
        const daRaw = basicRaw * 0.1;
        const hraRaw = basicRaw * 0.4;

        const pfRaw = basicRaw * 0.12;
        const pfEmployee = pfRaw > 1800 ? 1800 : round2(pfRaw);
        const month = getPayrollMonthNumber(payrollMonth);
        const professionalTax = month === 2 ? 300 : 200;

        let esic = 0;
        let medicalInsurance = 0;

        if (gross > 0 && gross <= 21000) {
            esic = round2(gross * 0.0075);
            medicalInsurance = 0;
        } else if (gross > 21000) {
            esic = 0;
            medicalInsurance = 269;
        }

        const derived = {
            basicSalary: round2(basicRaw),
            da: round2(daRaw),
            hra: round2(hraRaw),
            conveyanceAllowance: 0,
            medicalAllowance: 0,
            lta: 0,
            specialAllowance: 0,
            otherAllowances: 0,
            pfEmployee,
            professionalTax,
            taxDeductions: 0,
            otherDeductions: 0,
            esic,
            medicalInsurance,
        };

        const totals = computeTotals({
            ...derived,
            grossSalary: gross,
        });

        return {
            ...derived,
            ...totals.computedFieldValues,
            totalEarnings: totals.totalEarnings,
            totalDeductions: totals.totalDeductions,
            netSalary: totals.netSalary,
        };
    };

    const applyGrossCalculations = (grossSalary, payrollMonth, extra = {}) => {
        const derived = computeFromGross(grossSalary, payrollMonth);
        const nextValues = { grossSalary, ...derived, ...extra };
        setFormData((prev) => {
            const next = { ...prev, ...nextValues };
            const keys = Object.keys(nextValues);
            const hasChanges = keys.some((key) => prev[key] !== next[key]);
            return hasChanges ? next : prev;
        });
        setNetSalary((prevNet) => {
            const nextNet = derived.netSalary;
            return prevNet === nextNet ? prevNet : nextNet;
        });
    };

    const computeFinalGross = (grossSalary, payrollMonth, lopDays, otHours) => {
        const baseGross = Number(grossSalary) || 0;
        if (baseGross <= 0) {
            return round2(0);
        }

        const workingDays = getDaysInPayrollMonth(payrollMonth);
        if (!workingDays) {
            return round2(baseGross);
        }

        const lop = Math.max(0, Number(lopDays) || 0);
        const perDaySalary = baseGross / workingDays;
        const lopAmount = perDaySalary * lop;

        const ot = Math.max(0, Number(otHours) || 0);
        const hoursPerDay = 8;
        const perHourRate = baseGross / (workingDays * hoursPerDay);
        const otAmount = perHourRate * ot;

        let finalGross = baseGross - lopAmount + otAmount;
        if (finalGross < 0) finalGross = 0;
        return round2(finalGross);
    };

    const setGrossAndRecalculate = (finalGross, payrollMonth, extra = {}) => {
        applyGrossCalculations(finalGross, payrollMonth, extra);
    };

    const applyPayrollMonthChange = (nextPayrollMonth, nextFormData) => {
        const base =
            baseGrossSalary !== "" ? baseGrossSalary : nextFormData.grossSalary;
        if (base !== "") {
            const finalGross = computeFinalGross(
                base,
                nextPayrollMonth,
                nextFormData.lopDays,
                nextFormData.overtimeHours
            );
            setGrossAndRecalculate(finalGross, nextPayrollMonth, {
                payrollMonth: nextPayrollMonth,
            });
        } else {
            setFormData((prev) =>
                prev.payrollMonth === nextPayrollMonth
                    ? prev
                    : { ...prev, payrollMonth: nextPayrollMonth }
            );
        }
    };

    const handlePayrollMonthChange = (nextPayrollMonth) => {
        const updated = { ...formData, payrollMonth: nextPayrollMonth };
        setFormData(updated);
        applyPayrollMonthChange(nextPayrollMonth, updated);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // string fields
        if (!numericFields.includes(name)) {
            const updated = { ...formData, [name]: value };
            setFormData(updated);
            return;
        }

        // numeric fields
        const cleaned = value === "" ? "" : Number(value);
        const updated = { ...formData, [name]: cleaned };
        setFormData(updated);

        if (name === "grossSalary") {
            setBaseGrossSalary(cleaned);
            const finalGross = computeFinalGross(
                cleaned,
                updated.payrollMonth,
                updated.lopDays,
                updated.overtimeHours
            );
            setGrossAndRecalculate(finalGross, updated.payrollMonth);
            return;
        }

        if (name === "lopDays" || name === "overtimeHours") {
            const base = baseGrossSalary !== "" ? baseGrossSalary : updated.grossSalary;
            const finalGross = computeFinalGross(
                base,
                updated.payrollMonth,
                updated.lopDays,
                updated.overtimeHours
            );
            setGrossAndRecalculate(finalGross, updated.payrollMonth);
            return;
        }

        const totals = computeTotals(updated);
        setFormData((prev) => ({
            ...prev,
            ...totals.computedFieldValues,
            totalEarnings: totals.totalEarnings,
            totalDeductions: totals.totalDeductions,
        }));
        setNetSalary(totals.netSalary);
    };

    const handleSalaryComponentChange = (componentId, key, value) => {
        setSalaryComponentValues((prev) => {
            const normalizedValue =
                key === "value"
                    ? (value === "" ? "" : Math.max(Number(value) || 0, 0))
                    : value;
            const next = {
                ...prev,
                [componentId]: {
                    valueType: normalizeValueType(prev[componentId]?.valueType),
                    value: prev[componentId]?.value ?? "",
                    [key]: key === "valueType" ? normalizeValueType(value) : normalizedValue,
                },
            };

            const meta = mappedComponents.find((item) => item.id === componentId);
            if (meta?.fieldKey && (key === "value" || key === "valueType")) {
                const numericValue = resolveComponentAmount(meta, next, formData);
                if (meta.fieldKey === "grossSalary") {
                    setBaseGrossSalary(numericValue);
                    const finalGross = computeFinalGross(
                        numericValue,
                        formData.payrollMonth,
                        formData.lopDays,
                        formData.overtimeHours
                    );
                    setGrossAndRecalculate(finalGross, formData.payrollMonth);
                    return next;
                }
                setFormData((current) => {
                    const updated = { ...current, [meta.fieldKey]: numericValue };
                    const totals = computeTotals(updated, next);
                    setNetSalary(totals.netSalary);
                    return {
                        ...updated,
                        ...totals.computedFieldValues,
                        totalEarnings: totals.totalEarnings,
                        totalDeductions: totals.totalDeductions,
                    };
                });
            }
            return next;
        });
        setSalaryComponentErrors((prev) => ({ ...prev, [componentId]: "" }));
    };

    useEffect(() => {
        const totals = computeTotals(formData);
        setFormData((prev) => ({
            ...prev,
            ...totals.computedFieldValues,
            totalEarnings: totals.totalEarnings,
            totalDeductions: totals.totalDeductions,
        }));
        setNetSalary(totals.netSalary);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configuredFields, salaryComponentValues]);

    // -----------------------------
    // VALIDATION
    // -----------------------------
    const validateForm = () => {
        const errors = [];
        const componentErrors = {};
        const hasEsic = visibleKnownFieldSet.has("esic");
        const hasMedicalInsurance = visibleKnownFieldSet.has("medicalInsurance");
        const esicValue = hasEsic ? Number(formData.esic) || 0 : 0;
        const medicalInsuranceValue = hasMedicalInsurance
            ? Number(formData.medicalInsurance) || 0
            : 0;

        if (configMissing) {
            errors.push("Payslip Generator not configured for this company.");
            return errors;
        }
        if (configError && !configMissing) {
            errors.push(configError);
            return errors;
        }

        if (!formData.userId) errors.push("Please select an employee.");
        if (!formData.payrollMonth) errors.push("Please select payroll month.");
        if (
            visibleKnownFieldSet.has("grossSalary") &&
            (!formData.grossSalary || Number(formData.grossSalary) <= 0)
        )
            errors.push("Gross salary must be greater than 0.");
        if (esicValue > 0 && medicalInsuranceValue > 0)
            errors.push("ESIC and Medical Insurance cannot both be applied.");
        if (Number.isNaN(netSalary)) errors.push("Net salary calculation is invalid.");

        mappedComponents.forEach((component) => {
            if (!isGrossSalaryComponent(component.componentName)) {
                return;
            }
            const entry = salaryComponentValues[component.id];
            const raw = entry?.value?.toString().trim();
            const numeric = Number(raw);
            if (!raw || Number.isNaN(numeric)) {
                componentErrors[component.id] = "Enter a valid number.";
                return;
            }
            if (normalizeValueType(entry?.valueType) !== "percentage" && numeric < 0) {
                componentErrors[component.id] = "Amount must be 0 or greater.";
                return;
            }
            if (normalizeValueType(entry?.valueType) === "percentage" && (numeric < 0 || numeric > 100)) {
                componentErrors[component.id] = "Percentage must be between 0 and 100.";
            }
        });

        setSalaryComponentErrors(componentErrors);
        if (Object.keys(componentErrors).length) {
            errors.push("Fix salary component values before saving.");
        }

        return errors;
    };

    // -----------------------------
    // SAVE PAYROLL (REAL API)
    // -----------------------------
    const handleSavePayroll = async () => {
        if (configLoading) {
            toast.info("Loading payslip configuration. Please wait.");
            return;
        }
        const errors = validateForm();
        if (errors.length > 0) {
            toast.error(errors[0], {
                position: "top-right",
                autoClose: 2000,
                theme: "colored",
            });
            return;
        }

        const payload = {
            esic:
                visibleKnownFieldSet.has("esic")
                    ? Number(formData.esic) || 0
                    : 0,
            medicalInsurance:
                visibleKnownFieldSet.has("medicalInsurance")
                    ? Number(formData.medicalInsurance) || 0
                    : 0,
            userId: Number(formData.userId),
            username: formData.username,
            payrollMonth: formData.payrollMonth,

            grossSalary: Number(formData.grossSalary) || 0,
            basicSalary: Number(formData.basicSalary) || 0,
            da: Number(formData.da) || 0,
            hra: Number(formData.hra) || 0,
            conveyanceAllowance: Number(formData.conveyanceAllowance) || 0,
            medicalAllowance: Number(formData.medicalAllowance) || 0,
            lta: Number(formData.lta) || 0,
            otherAllowances: Number(formData.otherAllowances) || 0,

            pfEmployee: Number(formData.pfEmployee) || 0,
            professionalTax: Number(formData.professionalTax) || 0,
            taxDeductions: Number(formData.taxDeductions) || 0,
            otherDeductions: Number(formData.otherDeductions) || 0,

            totalEarnings: formData.totalEarnings || 0,
            totalDeductions: formData.totalDeductions || 0,
            netSalary: netSalary || 0,

            specialAllowance: Number(formData.specialAllowance) || 0,
            lopDays: Number(formData.lopDays) || 0,
            overtimeHours: Number(formData.overtimeHours) || 0,

            notes: formData.notes,
            autoGenerated: false,
            entryType: "auto",
            salaryComponents: mappedComponents.map((component) => {
                const entry = salaryComponentValues[component.id] || {
                    valueType: "amount",
                    value: "",
                };
                return {
                    componentName: component.componentName,
                    valueType: normalizeValueType(entry.valueType),
                    value: entry.value === "" ? 0 : Number(entry.value),
                };
            }),
        };

        console.log("📤 Sending payroll payload:", payload);

        try {
            const authHeader =
                token && token.startsWith("Bearer ")
                    ? token
                    : token
                        ? `Bearer ${token}`
                        : null;

            const baseUrl = getApiBaseUrl();

            const res = await fetch(`${baseUrl}/api/payroll/auto-entry`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));
            console.log("📥 Save payroll response:", data);

            if (!res.ok || data.success === false) {
                throw new Error(data.message || "Failed to save payroll entry");
            }

            toast.success("Payroll entry saved successfully!", {
                position: "top-right",
                autoClose: 2000,
                theme: "colored",
            });
        } catch (error) {
            console.error("Save payroll error:", error);
            toast.error(
                "Something went wrong: " + (error.message || "Unknown error"),
                {
                    position: "top-right",
                    autoClose: 2000,
                    theme: "colored",
                }
            );
        }
    };

    return (
        <div className="w-full h-full bg-[#F9FAFF] p-6">
            {/* HEADER */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <button
                    className="flex items-center gap-2 text-[#011A8B] text-sm font-medium"
                    onClick={() => navigate("/admin/finance")}
                >
                    <ArrowLeft size={18} /> Back to Finance Dashboard
                </button>


                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#011A8B]">
                            Auto Payroll Entry
                        </h1>
                        <p className="text-sm text-gray-500">Individual salary entry system</p>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
                            <Eye size={18} /> Preview Mode
                        </button>

                        <button
                            onClick={() => navigate("/admin/payroll-management")}
                            className="flex items-center gap-2 rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#020f5d]"
                        >
                            <FileText size={18} /> View All Payrolls
                        </button>
                    </div>
                </div>
            </div>

            {/* FORM GRID */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN - EMPLOYEE SELECTION */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 bg-[#F3F4FF] px-6 py-3 rounded-t-2xl">
                        <h3 className="text-sm font-semibold text-[#011A8B]">
                            Employee Selection
                        </h3>
                    </div>

                    <div className="p-6 bg-[#F9FAFF] rounded-b-2xl space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-600">
                                Select Employee
                            </label>
                            <select
                                name="userId"
                                className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:ring-[#011A8B] focus:border-[#011A8B] text-gray-900"
                                value={formData.userId}
                                onChange={handleEmployeeChange}
                            >
                                <option value="">
                                    {employeesLoading ? "Loading employees..." : "Choose an employee"}
                                </option>

                                {employeesError && (
                                    <option disabled value="">
                                        {employeesError}
                                    </option>
                                )}

                                {employees.length === 0 && !employeesLoading && !employeesError && (
                                    <option disabled value="">
                                        No employees found
                                    </option>
                                )}

                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.fullName || emp.name || emp.email || `Emp #${emp.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected employee info */}
                        {selectedEmployee && (
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-800 font-medium">
                                    Selected:{" "}
                                    {selectedEmployee.fullName ||
                                        selectedEmployee.name ||
                                        selectedEmployee.email}
                                </p>
                                {formData.username && (
                                    <p className="text-xs text-blue-700">
                                        Username: {formData.username}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-600">
                                Payroll Month
                            </label>
                            <div className="relative mt-1">
                                <input
                                    type="text"
                                    readOnly
                                    value={formatPayrollMonthDisplay(formData.payrollMonth)}
                                    onClick={() => {
                                        const input = payrollMonthInputRef.current;
                                        if (!input) return;
                                        if (typeof input.showPicker === "function") {
                                            input.showPicker();
                                        } else {
                                            input.focus();
                                            input.click();
                                        }
                                    }}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:ring-[#011A8B] focus:border-[#011A8B] text-gray-900 cursor-pointer"
                                    placeholder="DD-MM-YYYY"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = payrollMonthInputRef.current;
                                        if (!input) return;
                                        if (typeof input.showPicker === "function") {
                                            input.showPicker();
                                        } else {
                                            input.focus();
                                            input.click();
                                        }
                                    }}
                                    className="absolute right-3 top-2.5 text-gray-400"
                                    aria-label="Open calendar"
                                >
                                    <Calendar size={18} />
                                </button>
                                <input
                                    ref={payrollMonthInputRef}
                                    type="date"
                                    value={formData.payrollMonth}
                                    onChange={(e) => handlePayrollMonthChange(e.target.value)}
                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-600">
                                    LOP Days
                                </label>
                                <input
                                    type="number"
                                    name="lopDays"
                                    value={formData.lopDays}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:ring-[#011A8B] focus:border-[#011A8B] text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600">
                                    Overtime Hours
                                </label>
                                <input
                                    type="number"
                                    name="overtimeHours"
                                    value={formData.overtimeHours}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:ring-[#011A8B] focus:border-[#011A8B] text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-600">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm h-24 focus:ring-[#011A8B] focus:border-[#011A8B] text-gray-900"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN - SALARY COMPONENTS */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 bg-[#F3F4FF] px-6 py-3 rounded-t-2xl">
                        <h3 className="text-sm font-semibold text-[#011A8B]">
                            Salary Components
                        </h3>
                    </div>

                    <div className="p-6 bg-[#F9FAFF] rounded-b-2xl space-y-4">
                        
                        <SalaryComponentsForm
                            components={mappedComponents}
                            values={salaryComponentValues}
                            errors={salaryComponentErrors}
                            onChange={handleSalaryComponentChange}
                            getCalculatedAmount={getComponentCalculatedAmount}
                            isEditableComponent={(item) =>
                                isGrossSalaryComponent(item.componentName)
                            }
                            loading={configLoading}
                            errorMessage={configError && !configMissing ? configError : ""}
                            missingMessage={configMissing ? "Payslip Generator not configured for this company." : ""}
                            
                        />
                        
                    </div>
                    
                </div>

                {/* RIGHT COLUMN - SUMMARY */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#011A8B] mb-4">
                        Salary Summary
                    </h3>

                    <p className="text-sm text-gray-600">
                        Total Earnings:
                        <span className="font-semibold text-gray-900">
                            {" "}
                            ₹{(formData.totalEarnings || 0).toLocaleString("en-IN")}
                        </span>
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                        Total Deductions:
                        <span className="font-semibold text-gray-900">
                            {" "}
                            ₹{(formData.totalDeductions || 0).toLocaleString("en-IN")}
                        </span>
                    </p>

                    <div className="mt-6 rounded-2xl bg-[#EEF0FF] p-6 text-center text-3xl font-bold text-[#011A8B] shadow-inner">
                        ₹{netSalary.toLocaleString("en-IN")}
                    </div>

                    <button
                        disabled={configLoading || configMissing}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#011A8B] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#020f5d] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleSavePayroll}
                    >
                        <Save size={18} />
                        Save Payroll Entry
                    </button>

                    <button
                        className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        onClick={() => navigate("/admin/payroll-management")}
                    >
                        View All Payrolls
                    </button>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
}
