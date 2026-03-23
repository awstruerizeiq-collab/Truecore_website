import React, { useState, useEffect, useMemo } from "react";
import { UserPlus, Save, Building2, AlertCircle } from "lucide-react";
import { getPayslipConfig } from "../services/payslipConfigService";

/* ---------------- API BASE ---------------- */
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  const fallback = "http://localhost:8080";
  return (fromEnv || fallback).replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

/* ---------------- INITIAL STATE ---------------- */
const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  personalEmail: "",
  password: "",
  confirmPassword: "",
  role: "EMPLOYEE",
  status: "ACTIVE",
  department: "",
  employeeId: "",
  officialEmail: "",
  officialPassword: "",
  confirmOfficialPassword: "",
  designation: "",
  employmentType: "",
  reportingManager: "",
  workLocation: "",
  shiftType: "",
  workType: "",
  experience: "",
  dateOfJoining: "",
  dob: "",
  gender: "",
  personalPhone: "",
  accountPhone: "",
  flatNo: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  permanentFlatNo: "",
  permanentArea: "",
  permanentLandmark: "",
  permanentCity: "",
  permanentState: "",
  permanentPincode: "",
  aadhaar: "",
  pan: "",
  bloodGroup: "",
  maritalStatus: "",
  wifeName: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  fatherName: "",
  motherName: "",
  esiApplicable: "",
  esiNumber: "",
  esiDispensary: "",
  pfApplicable: "",
  pfNumber: "",
  uanNumber: "",
  rejoin: "",
  previousEmployeeId: "",
  remark: "",
  salary: "",
  companyjoindate: "",
  bankName: "",
  branchName: "",
  accountHolderName: "",
  accountNumber: "",
  reAccountNumber: "",
  accountType: "",
  ifscCode: "",
  salaryCreditMethod: "",
  teamLeader: "",
  projectManagerEngineeringManager: "",
  directorCEO: "",
};

const departmentDesignations = {
  "Hospital Department": [
    "Doctor", "Consultant", "Surgeon", "Staff Nurse", "Duty Nurse",
    "Lab Technician", "Pharmacist", "Hospital Administrator", "Receptionist",
    "Billing Executive", "Ward Boy", "ICU Nurse", "Radiology Technician",
    "Ambulance Driver", "Security Guard",
  ],
  "School Department": [
    "Principal", "Vice Principal", "Head Master / Head Mistress", "Teacher",
    "Assistant Teacher", "Lab Assistant", "Librarian",
    "Physical Education Teacher (PET)", "Clerk", "Office Assistant",
  ],
  "College Department": [
    "Principal", "Vice Principal", "Dean", "Head of Department (HOD)",
    "Professor", "Associate Professor", "Assistant Professor", "Lecturer",
    "Lab Assistant", "Librarian", "Examination Officer", "Placement Officer",
    "Administrative Officer", "Accounts Officer", "Office Assistant",
  ],
  "Manufacturing Department": [
    "Production Manager", "Plant Manager", "Manufacturing Engineer",
    "Production Supervisor", "Quality Engineer", "Quality Inspector",
    "Maintenance Engineer", "Machine Operator", "Assembly Line Worker",
    "Store / Inventory Executive", "Purchase Executive", "Supply Chain Executive",
    "Safety Officer", "HR Executive", "Accounts Executive",
  ],
  "Software Department": [
    "Intern", "Trainee", "Junior Executive", "Executive", "Senior Executive",
    "Team_Lead", "Assistant Manager", "Manager", "Senior Manager",
    "Associate Director", "Director", "Delivery Manager", "Program Manager",
    "Chief Executive Officer (CEO)", "Project Lead",
  ],
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const resolveSalaryKeyForConfiguredComponent = (componentName, explicitFieldKey) => {
  const explicit = String(explicitFieldKey || "").trim();
  const fallback = COMPONENT_ALIAS_TO_SALARY_KEY[normalizeText(componentName)];
  return FIELDKEY_TO_SALARY_KEY[explicit] || fallback || null;
};
const makeConfiguredStorageKey = (componentName, normalizedKey) => {
  if (
    normalizedKey &&
    !["salary", "netSalary", "deductions"].includes(normalizedKey)
  ) {
    return normalizedKey;
  }
  const normalizedName = normalizeText(componentName)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalizedName ? `component_${normalizedName}` : null;
};

const FIELDKEY_TO_SALARY_KEY = {
  grossSalary: "salary",
  basicSalary: "basicSalary",
  da: "da",
  hra: "hra",
  conveyanceAllowance: "conveyanceAllowance",
  medicalAllowance: "medicalAllowance",
  lta: "lta",
  specialAllowance: "specialAllowance",
  otherAllowances: "otherAllowances",
  pfEmployee: "pfEmployeeContribution",
  professionalTax: "professionalTax",
  taxDeductions: "taxDeductions",
  otherDeductions: "otherDeductions",
  esic: "esic",
  medicalInsurance: "medicalInsurance",
  deductions: "deductions",
  netSalary: "netSalary",
};

const COMPONENT_ALIAS_TO_SALARY_KEY = {
  "gross salary": "salary",
  "basic pay": "basicSalary",
  "basic salary (basic pay)": "basicSalary",
  "dearness allowance (da)": "da",
  "house rent allowance (hra)": "hra",
  hra: "hra",
  "special allowance": "specialAllowance",
  "conveyance allowance": "conveyanceAllowance",
  "medical allowance": "medicalAllowance",
  "leave travel allowance (lta)": "lta",
  lta: "lta",
  "other allowances": "otherAllowances",
  "employee pf": "pfEmployeeContribution",
  "employee provident fund (epf - deduction)": "pfEmployeeContribution",
  "professional tax": "professionalTax",
  "professional tax (deduction)": "professionalTax",
  "income tax (tds)": "taxDeductions",
  "income tax (tds - deduction)": "taxDeductions",
  "esi": "esic",
  "employee state insurance (esi)": "esic",
  "health insurance": "medicalInsurance",
  "medical insurance": "medicalInsurance",
  insurance: "medicalInsurance",
  "total deductions": "deductions",
  "net salary": "netSalary",
};

const SALARY_FIELD_LABELS = {
  basicSalary: "Basic Salary",
  da: "DA (Dearness Allowance)",
  hra: "HRA",
  conveyanceAllowance: "Conveyance Allowance",
  medicalAllowance: "Medical Allowance",
  lta: "LTA",
  specialAllowance: "Special Allowance",
  otherAllowances: "Other Allowances",
  deductions: "Total Deductions",
  pfEmployeeContribution: "PF Employee Contribution",
  medicalInsurance: "Medical Insurance",
  esic: "ESIC",
  professionalTax: "Professional Tax",
  taxDeductions: "Tax Deductions",
  otherDeductions: "Other Deductions",
  netSalary: "Net Salary",
};

const DEDUCTION_COMPONENT_KEYS = new Set([
  "pfEmployeeContribution",
  "professionalTax",
  "taxDeductions",
  "otherDeductions",
  "esic",
  "medicalInsurance",
]);
const LEGACY_PERCENT_KEYS = new Set(["basicSalary", "da", "hra"]);
const MANAGER_DESIGNATIONS = [
  "Team_Lead", "Project Lead", "Technical Lead", "Module Lead",
  "Assistant Manager", "Engineering Manager", "Project Manager",
  "Manager", "Senior Manager",
];
const DIRECTOR_DESIGNATIONS = [
  "Associate Director", "Director", "Vice President", "Senior Vice President",
  "Head of Department (HOD)", "Chief Executive Officer (CEO)",
  "Delivery Manager", "Program Manager", "HOD", "VP", "SVP", "CTO", "COO",
];
const isTeamLeadDesignation = (designation) =>
  designation === "Team_Lead" || designation === "Team Lead";
const normalizeKey = (value) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
const shouldShowTeamLeaderField = (department, designation) =>
  department === "Software Department" &&
  Boolean(designation) &&
  !isTeamLeadDesignation(designation) &&
  !MANAGER_DESIGNATIONS.includes(designation) &&
  !DIRECTOR_DESIGNATIONS.includes(designation);

export default function AddEmployee({ onSubmit }) {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [extraText, setExtraText] = useState({
    personal: [],
    employee: [],
    account: [],
    salary: [],
  });

  const [salaryComponents, setSalaryComponents] = useState({
    basicSalary: 0,
    da: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    medicalInsurance: 0,
    lta: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    esic: 0,
    deductions: 0,
    pfEmployeeContribution: 0,
    professionalTax: 0,
    taxDeductions: 0,
    otherDeductions: 0,
    netSalary: 0,
  });

  const [tenantInfo, setTenantInfo] = useState({
    tenantCode: "",
    companyName: "Unknown Company",
    companyId: null,
  });
  const [error, setError] = useState("");
  const [success] = useState("");
  const [loading] = useState(false);
  const [configuredSalaryComponents, setConfiguredSalaryComponents] = useState([]);
  const [salaryConfigLoading, setSalaryConfigLoading] = useState(false);
  const [salaryConfigMissing, setSalaryConfigMissing] = useState(false);
  const [salaryConfigError, setSalaryConfigError] = useState("");

  const configuredSalaryFields = useMemo(() => {
    const mapped = (configuredSalaryComponents || [])
      .map((item) => {
        const componentName = String(item?.component || "").trim();
        if (!componentName) return null;
        const normalizedKey = resolveSalaryKeyForConfiguredComponent(
          componentName,
          item?.fieldKey
        );
        const storageKey = makeConfiguredStorageKey(componentName, normalizedKey);
        if (!storageKey) return null;
        const linkedComponents = Array.isArray(item?.linkedComponents)
          ? item.linkedComponents
          : [];
        const linkedPercentagesRaw =
          item?.linkedPercentages && typeof item.linkedPercentages === "object"
            ? item.linkedPercentages
            : {};
        const linkedKeys = linkedComponents
          .map((linkedComponent) =>
            resolveSalaryKeyForConfiguredComponent(linkedComponent, null)
          )
          .filter(Boolean);
        const linkedStorageKeys = linkedComponents
          .map((linkedComponent) => {
            const linkedKey = resolveSalaryKeyForConfiguredComponent(linkedComponent, null);
            return makeConfiguredStorageKey(linkedComponent, linkedKey);
          })
          .filter(Boolean);
        const linkedComponentNames = linkedComponents
          .map((linkedComponent) => String(linkedComponent || "").trim())
          .filter(Boolean);
        const linkedPercentagesByKey = Object.entries(linkedPercentagesRaw).reduce(
          (acc, [linkedComponent, rawValue]) => {
            const linkedKey = resolveSalaryKeyForConfiguredComponent(linkedComponent, null);
            if (!linkedKey) return acc;
            const numeric = Number(rawValue);
            if (!Number.isFinite(numeric)) return acc;
            acc[linkedKey] = numeric;
            return acc;
          },
          {}
        );
        const linkedPercentagesByName = Object.entries(linkedPercentagesRaw).reduce(
          (acc, [linkedComponent, rawValue]) => {
            const linkedName = String(linkedComponent || "").trim();
            if (!linkedName) return acc;
            const numeric = Number(rawValue);
            if (!Number.isFinite(numeric)) return acc;
            acc[linkedName] = numeric;
            return acc;
          },
          {}
        );
        const linkedPercentagesByStorageKey = Object.entries(linkedPercentagesRaw).reduce(
          (acc, [linkedComponent, rawValue]) => {
            const linkedKey = resolveSalaryKeyForConfiguredComponent(linkedComponent, null);
            const linkedStorageKey = makeConfiguredStorageKey(linkedComponent, linkedKey);
            if (!linkedStorageKey) return acc;
            const numeric = Number(rawValue);
            if (!Number.isFinite(numeric)) return acc;
            acc[linkedStorageKey] = numeric;
            return acc;
          },
          {}
        );
        const normalizedCategory = normalizeText(item?.category);
        const isDeduction =
          normalizedCategory === "deduction" ||
          normalizedCategory === "deductions" ||
          DEDUCTION_COMPONENT_KEYS.has(normalizedKey);
        return {
          component: componentName,
          storageKey,
          key: normalizedKey,
          mode:
            ["percentage", "percent"].includes(
              String(item?.mode || "").trim().toLowerCase()
            )
              ? "percentage"
              : "amount",
          value:
            item?.value === null || item?.value === undefined || item?.value === ""
              ? ""
              : Number(item.value),
          isDeduction,
          linkedKeys,
          linkedStorageKeys,
          linkedComponentNames,
          linkedPercentagesByKey,
          linkedPercentagesByName,
          linkedPercentagesByStorageKey,
        };
      })
      .filter(Boolean);

    const seen = new Set();
    return mapped.filter((item) => {
      if (seen.has(item.storageKey)) return false;
      seen.add(item.storageKey);
      return true;
    });
  }, [configuredSalaryComponents]);

  const breakdownFields = useMemo(() => {
    const fallback = [
      { key: "basicSalary", label: "Basic Salary", isDeduction: false },
      { key: "da", label: "DA (Dearness Allowance)", isDeduction: false },
      { key: "hra", label: "HRA", isDeduction: false },
      { key: "conveyanceAllowance", label: "Conveyance Allowance", isDeduction: false },
      { key: "medicalAllowance", label: "Medical Allowance", isDeduction: false },
      { key: "lta", label: "LTA", isDeduction: false },
      { key: "specialAllowance", label: "Special Allowance", isDeduction: false },
      { key: "otherAllowances", label: "Other Allowances", isDeduction: false },
      { key: "deductions", label: "Total Deductions", isDeduction: true },
      { key: "pfEmployeeContribution", label: "PF Employee Contribution", isDeduction: true },
      { key: "medicalInsurance", label: "Medical Insurance", isDeduction: true },
      { key: "esic", label: "ESIC", isDeduction: true },
      { key: "professionalTax", label: "Professional Tax", isDeduction: true },
      { key: "taxDeductions", label: "Tax Deductions", isDeduction: true },
      { key: "otherDeductions", label: "Other Deductions", isDeduction: true },
    ];

    if (!configuredSalaryFields.length) return fallback;

    const dynamic = configuredSalaryFields
      .filter((item) => item.key !== "salary")
      .map((item) => ({
        key: item.storageKey,
        label: item.component || SALARY_FIELD_LABELS[item.key] || item.storageKey,
        isDeduction: Boolean(item.isDeduction),
      }));

    return dynamic.length ? dynamic : fallback;
  }, [configuredSalaryFields]);

  /* ---------------- SALARY CALCULATION ---------------- */
  const calculateSalaryComponents = (totalSalary, monthValue) => {
    const roundTo2 = (value) =>
      Math.round((Number(value) + Number.EPSILON) * 100) / 100;

    const reset = {
      basicSalary: 0, da: 0, hra: 0, conveyanceAllowance: 0, medicalAllowance: 0,
      medicalInsurance: 0, lta: 0, specialAllowance: 0, otherAllowances: 0,
      esic: 0, deductions: 0, pfEmployeeContribution: 0, professionalTax: 0,
      taxDeductions: 0, otherDeductions: 0, netSalary: 0,
    };

    const salary = Number(totalSalary);
    if (!salary || salary <= 0) return reset;

    const monthIndex = monthValue ? new Date(monthValue).getMonth() : null;
    const isFebruary = monthIndex === 1;

    const basicSalary = roundTo2(salary * 0.5);
    const da = roundTo2(basicSalary * 0.1);
    const hra = roundTo2(basicSalary * 0.4);
    const conveyanceAllowance = 0;
    const medicalAllowance = 0;
    const lta = 0;
    const specialAllowance = 0;
    const otherAllowances = 0;
    const pfEmployeeContribution = roundTo2(basicSalary * 0.12);
    const professionalTax = isFebruary ? 300 : 200;
    const esic = salary <= 21000 ? roundTo2(salary * 0.0075) : 0;
    const medicalInsurance = salary > 21000 ? 269 : 0;
    const taxDeductions = 0;
    const otherDeductions = 0;
    const deductions = roundTo2(
      pfEmployeeContribution + professionalTax + esic +
      medicalInsurance + taxDeductions + otherDeductions
    );
    const netSalary = roundTo2(salary - deductions);

    return {
      basicSalary, da, hra, conveyanceAllowance, medicalAllowance, medicalInsurance,
      lta, specialAllowance, otherAllowances, esic, deductions,
      pfEmployeeContribution, professionalTax, taxDeductions, otherDeductions, netSalary,
    };
  };

  useEffect(() => {
    const salary = Number(formData.salary);
    const roundTo2 = (value) =>
      Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    const getPercentageBaseForKey = (key, currentValues) => {
      if (key === "salary") return 0;
      const gross = Number(salary || 0);
      const basic = Number(currentValues?.basicSalary || 0);
      if (key === "basicSalary") return gross > 0 ? gross : 0;
      if (key === "da" || key === "hra" || key === "pfEmployeeContribution") {
        return basic > 0 ? basic : gross;
      }
      return gross > 0 ? gross : 0;
    };
    const baseComponents = calculateSalaryComponents(formData.salary, formData.companyjoindate);

    if (!salary || salary <= 0) {
      setSalaryComponents(baseComponents);
      return;
    }

    if (!configuredSalaryFields.length || salaryConfigMissing) {
      setSalaryComponents(baseComponents);
      return;
    }

    const next = { ...baseComponents };
    configuredSalaryFields.forEach((item) => {
      if (item.key === "salary" || item.key === "netSalary" || item.key === "deductions") {
        return;
      }
      if (item.key === "pfEmployeeContribution") {
        return;
      }

      const rawValue = Number(item.value);
      if (Number.isNaN(rawValue)) return;
      const percentageBase = getPercentageBaseForKey(item.key || item.storageKey, next);
      const isLegacyPercentStyle =
        item.mode === "amount" &&
        LEGACY_PERCENT_KEYS.has(item.key) &&
        rawValue >= 0 &&
        rawValue <= 100 &&
        Number(salary || 0) >= 1000;
      next[item.storageKey] =
        item.mode === "percentage" || isLegacyPercentStyle
          ? roundTo2((percentageBase * rawValue) / 100)
          : rawValue;
    });

    const pfConfig = configuredSalaryFields.find(
      (item) => item.key === "pfEmployeeContribution"
    );
    if (pfConfig) {
      const linkedStorageKeys = Array.isArray(pfConfig.linkedStorageKeys)
        ? pfConfig.linkedStorageKeys
        : [];
      const linkedNames = Array.isArray(pfConfig.linkedComponentNames)
        ? pfConfig.linkedComponentNames
        : [];
      const pairs = linkedNames.map((linkedName, index) => ({
        linkedName,
        linkedStorageKey: linkedStorageKeys[index] || null,
      }));
      const uniquePairs = pairs.filter((pair, index) => {
        const signature = `${normalizeText(pair.linkedName)}::${pair.linkedStorageKey || ""}`;
        return pairs.findIndex((p) => `${normalizeText(p.linkedName)}::${p.linkedStorageKey || ""}` === signature) === index;
      }).filter((pair) => {
        if (pair.linkedStorageKey === "pfEmployeeContribution") return false;
        if (normalizeText(pair.linkedName) === normalizeText(pfConfig.component)) return false;
        return Boolean(pair.linkedName && pair.linkedStorageKey && pair.linkedStorageKey in next);
      });
      const getLinkedAmount = (pair) => Number(next[pair.linkedStorageKey] || 0);

      if (!uniquePairs.length) {
        next.pfEmployeeContribution = 0;
      } else {
        const pctByStorageKey =
          pfConfig.linkedPercentagesByStorageKey &&
          typeof pfConfig.linkedPercentagesByStorageKey === "object"
            ? pfConfig.linkedPercentagesByStorageKey
            : {};
        const pctByName =
          pfConfig.linkedPercentagesByName &&
          typeof pfConfig.linkedPercentagesByName === "object"
            ? pfConfig.linkedPercentagesByName
            : {};
        const hasPct = uniquePairs.some(
          (pair) =>
            Number(
              pctByStorageKey[pair.linkedStorageKey] ??
                pctByName[pair.linkedName] ??
                0
            ) > 0
        );
        next.pfEmployeeContribution = hasPct
          ? roundTo2(
              uniquePairs.reduce((sum, pair) => {
                const amount = getLinkedAmount(pair);
                const pct = Number(
                  pctByStorageKey[pair.linkedStorageKey] ??
                    pctByName[pair.linkedName] ??
                    0
                );
                if (!Number.isFinite(amount) || !Number.isFinite(pct) || pct <= 0) return sum;
                return sum + (amount * pct) / 100;
              }, 0)
            )
          : 0;
      }
    }

    const activeDeductionKeys =
      configuredSalaryFields.length && !salaryConfigMissing
        ? configuredSalaryFields
            .filter((item) => item.key !== "deductions" && item.isDeduction && item.storageKey in next)
            .map((item) => item.storageKey)
        : [
            "pfEmployeeContribution",
            "professionalTax",
            "esic",
            "medicalInsurance",
            "taxDeductions",
            "otherDeductions",
          ];
    const totalDeductions = roundTo2(
      activeDeductionKeys.reduce((sum, key) => sum + Number(next[key] || 0), 0)
    );
    next.deductions = totalDeductions;
    next.netSalary = roundTo2(Number(salary || 0) - totalDeductions);

    setSalaryComponents(next);
  }, [
    formData.salary,
    formData.companyjoindate,
    configuredSalaryFields,
    salaryConfigMissing,
  ]);

 

  /* ---------------- DROPDOWN OPTIONS STATE ---------------- */
  const [shiftOptions, setShiftOptions] = useState([
    { value: "9:00 AM - 6:00 PM", label: "9:00 AM - 6:00 PM" },
    { value: "6:00 AM - 2:00 PM", label: "6:00 AM - 2:00 PM" },
    { value: "8:00 AM - 5:00 PM", label: "8:00 AM - 5:00 PM" },
    { value: "2:00 PM - 10:00 PM", label: "2:00 PM - 10:00 PM" },
    { value: "OTHER", label: "Other" },
  ]);
  const [customShift, setCustomShift] = useState("");
  const [showCustomShift, setShowCustomShift] = useState(false);

  const [workTypeOptions, setWorkTypeOptions] = useState([
    { value: "ONSITE", label: "Onsite" },
    { value: "REMOTE", label: "Remote" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "OTHER", label: "Other" },
  ]);
  const [customWorkType, setCustomWorkType] = useState("");
  const [showCustomWorkType, setShowCustomWorkType] = useState(false);

 const [roleOptions, setRoleOptions] = useState([
  { value: "EMPLOYEE", label: "Employee" },
  { value: "ADMIN", label: "Admin" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "OTHER", label: "Other" },
]);

  const [customRole, setCustomRole] = useState("");
  const [showCustomRole, setShowCustomRole] = useState(false);

  const [statusOptions, setStatusOptions] = useState([
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "OTHER", label: "Other" },
  ]);
  const [customStatus, setCustomStatus] = useState("");
  const [showCustomStatus, setShowCustomStatus] = useState(false);

  const [accountTypeOptions, setAccountTypeOptions] = useState([
    { value: "SAVINGS", label: "Savings" },
    { value: "CURRENT", label: "Current" },
    { value: "SALARY", label: "Salary" },
    { value: "OTHER", label: "Other" },
  ]);
  const [customAccountType, setCustomAccountType] = useState("");
  const [showCustomAccountType, setShowCustomAccountType] = useState(false);

  const [salaryCreditMethodOptions, setSalaryCreditMethodOptions] = useState([
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CHEQUE", label: "Cheque" },
  ]);
  const [customSalaryCreditMethod, setCustomSalaryCreditMethod] = useState("");
  const [showCustomSalaryCreditMethod, setShowCustomSalaryCreditMethod] = useState(false);

  const [customReportingManager, setCustomReportingManager] = useState("");
  const [showCustomReportingManager, setShowCustomReportingManager] = useState(false);

  /* ---- Team Leader: dynamic from DB ---- */
  const [teamLeaderOptions, setTeamLeaderOptions] = useState([
    { value: "", label: "Select Team_Leader" },
    { value: "OTHER", label: "Other" },
  ]);
  const [teamLeaderLoading, setTeamLeaderLoading] = useState(false);
  const [customTeamLeader, setCustomTeamLeader] = useState("");
  const [showCustomTeamLeader, setShowCustomTeamLeader] = useState(false);

  const [customProjectManager, setCustomProjectManager] = useState("");
  const [showCustomProjectManager, setShowCustomProjectManager] = useState(false);

  const [customDirectorCEO, setCustomDirectorCEO] = useState("");
  const [showCustomDirectorCEO, setShowCustomDirectorCEO] = useState(false);

  const baseReportingManagerOptions = [
    { value: "", label: "Select Reporting Manager" },
    { value: "OTHER", label: "Other" },
  ];
  const [reportingManagerOptions, setReportingManagerOptions] = useState(baseReportingManagerOptions);

  const [projectManagerOptions, setProjectManagerOptions] = useState([
    { value: "", label: "Select Manager" },
    { value: "OTHER", label: "Other" },
  ]);
  const [dynamicProjectManagerOptions, setDynamicProjectManagerOptions] = useState([]);
  const [dynamicReportingManagerOptions, setDynamicReportingManagerOptions] = useState([]);
  const [dynamicDirectorCEOOptions, setDynamicDirectorCEOOptions] = useState([]);

  const [directorCEOOptions, setDirectorCEOOptions] = useState([
    { value: "", label: "Select Director / CEO" },
    { value: "OTHER", label: "Other" },
  ]);

  const buildDisplayName = (employeeId, personalByEmployeeId, emp = {}) => {
    const personal = personalByEmployeeId.get(employeeId) || {};
    const fullName =
      [personal.firstName, personal.middleName, personal.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || emp.fullName || emp.name || emp.officialEmail || employeeId;

    return `${fullName} (${employeeId})`;
  };

  const dedupeOptions = (options) => {
    const seen = new Set();
    return options.filter((option) => {
      if (!option || option.value === undefined || option.value === null) return false;
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  };

  /* ---------------- ROLE IS USER-SELECTED ---------------- */


  /* ---------------- REPORTING MANAGER — update on designation change ---------------- */
  useEffect(() => {
    if (!tenantInfo.tenantCode) return;

    const fetchManagerHierarchyOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeader = token
          ? token.startsWith("Bearer ") ? token : `Bearer ${token}`
          : null;

        const headers = {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        };
        const base = API_BASE_URL.replace(/\/+$/, "");

        const [empRes, personalRes] = await Promise.all([
          fetch(
            `${base}/api/employee-details/tenant/${encodeURIComponent(tenantInfo.tenantCode)}`,
            { headers }
          ),
          fetch(
            `${base}/api/personal-details/tenant/${encodeURIComponent(tenantInfo.tenantCode)}`,
            { headers }
          ),
        ]);

        const [empData, personalData] = await Promise.all([empRes.json(), personalRes.json()]);
        const employees = Array.isArray(empData?.data) ? empData.data : [];
        const personalByEmployeeId = new Map(
          (Array.isArray(personalData?.data) ? personalData.data : []).map((p) => [
            p.employeeId,
            p,
          ])
        );

        const employeeById = new Map(
          employees
            .filter((emp) => Boolean(emp?.employeeId))
            .map((emp) => [emp.employeeId, emp])
        );

        const managerDesignationKeys = new Set(MANAGER_DESIGNATIONS.map((d) => normalizeKey(d)));
        const directorDesignationKeys = new Set(DIRECTOR_DESIGNATIONS.map((d) => normalizeKey(d)));

        const managerOptions = dedupeOptions(
          employees
            .filter((emp) => {
              const designationKey = normalizeKey(emp?.designation);
              return (
                managerDesignationKeys.has(designationKey) ||
                designationKey.includes("MANAGER")
              );
            })
            .map((emp) => ({
              value: emp.employeeId,
              label: buildDisplayName(emp.employeeId, personalByEmployeeId, emp),
            }))
        );

        const savedProjectManagerValues = new Set(
          employees
            .map((emp) => String(emp?.projectManagerEngineeringManager || "").trim())
            .filter(Boolean)
        );

        const savedProjectManagerOptions = Array.from(savedProjectManagerValues).map((value) => {
          const mappedEmp = employeeById.get(value);
          if (mappedEmp) {
            return {
              value,
              label: buildDisplayName(value, personalByEmployeeId, mappedEmp),
            };
          }
          return { value, label: value };
        });

        const savedReportingManagerValues = new Set(
          employees
            .map((emp) => String(emp?.reportingManager || "").trim())
            .filter(Boolean)
        );

        const savedReportingManagerOptions = Array.from(savedReportingManagerValues).map((value) => {
          const mappedEmp = employeeById.get(value);
          if (mappedEmp) {
            return {
              value,
              label: buildDisplayName(value, personalByEmployeeId, mappedEmp),
            };
          }
          if (value === "TEAM_LEADER") return { value, label: "Team_Leader" };
          return { value, label: value };
        });

        const directorOptions = dedupeOptions(
          employees
            .filter((emp) => {
              const designationKey = normalizeKey(emp?.designation);
              return (
                directorDesignationKeys.has(designationKey) ||
                designationKey.includes("DIRECTOR") ||
                designationKey.includes("CEO")
              );
            })
            .map((emp) => ({
              value: emp.employeeId,
              label: buildDisplayName(emp.employeeId, personalByEmployeeId, emp),
            }))
        );

        const savedDirectorValues = new Set(
          employees
            .map((emp) => String(emp?.directorCEO || "").trim())
            .filter(Boolean)
        );

        const savedDirectorOptions = Array.from(savedDirectorValues).map((value) => {
          const mappedEmp = employeeById.get(value);
          if (mappedEmp) {
            return {
              value,
              label: buildDisplayName(value, personalByEmployeeId, mappedEmp),
            };
          }
          return { value, label: value };
        });

        setDynamicProjectManagerOptions(
          dedupeOptions([...managerOptions, ...savedProjectManagerOptions])
        );
        setDynamicReportingManagerOptions(dedupeOptions(savedReportingManagerOptions));
        setDynamicDirectorCEOOptions(
          dedupeOptions([...directorOptions, ...savedDirectorOptions])
        );
      } catch (err) {
        console.error("Failed to fetch manager hierarchy options:", err);
        setDynamicProjectManagerOptions([]);
        setDynamicReportingManagerOptions([]);
        setDynamicDirectorCEOOptions([]);
      }
    };

    fetchManagerHierarchyOptions();
  }, [tenantInfo.tenantCode]);

  useEffect(() => {
    setProjectManagerOptions([
      { value: "", label: "Select Manager" },
      ...dynamicProjectManagerOptions,
      { value: "OTHER", label: "Other" },
    ]);
  }, [dynamicProjectManagerOptions]);

  useEffect(() => {
    setDirectorCEOOptions([
      { value: "", label: "Select Director / CEO" },
      ...dynamicDirectorCEOOptions,
      { value: "OTHER", label: "Other" },
    ]);
  }, [dynamicDirectorCEOOptions]);

  useEffect(() => {
    const reportingWithoutTeamLeader = dynamicReportingManagerOptions.filter(
      (option) => option.value !== "TEAM_LEADER"
    );

    if (shouldShowTeamLeaderField(formData.department, formData.designation)) {
      setReportingManagerOptions(
        dedupeOptions([
          { value: "", label: "Select Reporting Manager" },
          { value: "TEAM_LEADER", label: "Team_Leader" },
          ...reportingWithoutTeamLeader,
          { value: "OTHER", label: "Other" },
        ])
      );
      return;
    }

    setReportingManagerOptions(
      dedupeOptions([
        { value: "", label: "Select Reporting Manager" },
        ...dynamicReportingManagerOptions,
        { value: "OTHER", label: "Other" },
      ])
    );
  }, [formData.department, formData.designation, dynamicReportingManagerOptions]);

  /* ---------------- TEAM LEADER — fetch from DB when designation requires it ---------------- */
  useEffect(() => {
    if (!shouldShowTeamLeaderField(formData.department, formData.designation)) {
      // Reset to base options when team leader dropdown is not needed
      setTeamLeaderOptions([
        { value: "", label: "Select Team_Leader" },
        { value: "OTHER", label: "Other" },
      ]);
      return;
    }

    if (!tenantInfo.tenantCode) return;

    const fetchTeamLeads = async () => {
      setTeamLeaderLoading(true);
      try {
        const token = localStorage.getItem("token");
        const authHeader = token
          ? token.startsWith("Bearer ") ? token : `Bearer ${token}`
          : null;

        const headers = {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        };
        const base = API_BASE_URL.replace(/\/+$/, "");

        const [empRes, personalRes] = await Promise.all([
          fetch(
            `${base}/api/employee-details/tenant/${encodeURIComponent(tenantInfo.tenantCode)}`,
            { headers }
          ),
          fetch(
            `${base}/api/personal-details/tenant/${encodeURIComponent(tenantInfo.tenantCode)}`,
            { headers }
          ),
        ]);

        const [empData, personalData] = await Promise.all([empRes.json(), personalRes.json()]);

        if (empData.success && Array.isArray(empData.data) && empData.data.length > 0) {
          const personalByEmployeeId = new Map(
            (Array.isArray(personalData?.data) ? personalData.data : []).map((p) => [
              p.employeeId,
              p,
            ])
          );

          const fetched = empData.data
            .filter((emp) => {
              const d = String(emp?.designation || "").trim().toUpperCase().replace(/\s+/g, "_");
              const r = String(emp?.role || "").trim().toUpperCase().replace(/\s+/g, "_");
              return (
                d === "TEAM_LEAD" ||
                d === "TEAM_LEADER" ||
                r === "TEAM_LEAD" ||
                r === "TEAM_LEADER"
              );
            })
            .map((emp) => {
              const personal = personalByEmployeeId.get(emp.employeeId) || {};
              const displayName =
                [personal.firstName, personal.middleName, personal.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || emp.fullName || emp.name || emp.officialEmail || emp.employeeId;

              return {
                value: emp.employeeId,
                label: `${displayName} (${emp.employeeId})`,
              };
            });

          const unique = [];
          const seen = new Set();
          fetched.forEach((item) => {
            if (!item.value || seen.has(item.value)) return;
            seen.add(item.value);
            unique.push(item);
          });

          if (unique.length === 0) {
            setTeamLeaderOptions([
              { value: "", label: "No Team_Leads found — select Other" },
              { value: "OTHER", label: "Other" },
            ]);
            return;
          }

          setTeamLeaderOptions([
            { value: "", label: "Select Team_Leader" },
            ...unique,
            { value: "OTHER", label: "Other" },
          ]);
        } else {
          setTeamLeaderOptions([
            { value: "", label: "No Team_Leads found — select Other" },
            { value: "OTHER", label: "Other" },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch team_Leads:", err);
        setTeamLeaderOptions([
          { value: "", label: "Select Team_Leader" },
          { value: "OTHER", label: "Other" },
        ]);
      } finally {
        setTeamLeaderLoading(false);
      }
    };

    fetchTeamLeads();
  }, [formData.department, formData.designation, tenantInfo.tenantCode]);

  /* ---------------- STYLES ---------------- */
  const inputBase =
    "w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm " +
    "text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 " +
    "focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";
  const sectionCard = "bg-white rounded-xl border border-gray-200 shadow-sm p-6";
  const errorText = "mt-1 text-xs text-red-500";

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const e = {};

    if (!formData.firstName.trim()) e.firstName = "First name is required";
    if (!formData.lastName.trim()) e.lastName = "Last name is required";
    if (!formData.personalEmail.trim()) {
      e.personalEmail = "Personal email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
      e.personalEmail = "Enter a valid email address";
    }
    if (!formData.department) e.department = "Department is required";
    if (!formData.designation) e.designation = "Designation is required";
    if (shouldShowTeamLeaderField(formData.department, formData.designation) && !formData.teamLeader) {
      e.teamLeader = "Team leader is required";
    }
    if (!formData.employmentType) e.employmentType = "Employment type is required";
    if (!formData.reportingManager) e.reportingManager = "Reporting manager is required";
    if (!formData.workLocation) e.workLocation = "Work location is required";
    if (!formData.shiftType) e.shiftType = "Shift is required";
    if (!formData.role) e.role = "Role is required";
    if (!formData.dob) {
      e.dob = "Date of birth is required";
    } else {
      const today = new Date();
      const birthDate = new Date(formData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) {
        alert("You are under 18 years old");
        e.dob = "You must be at least 18 years old.";
      }
    }
    if (!formData.gender) e.gender = "Gender is required";
    if (!formData.password) e.password = "Password is required";
    if (!formData.confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!formData.workType) e.workType = "Work type is required";
    if (!formData.personalPhone.trim()) {
      e.personalPhone = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.personalPhone)) {
      e.personalPhone = "Enter valid 10-digit mobile number";
    }
    if (!formData.flatNo?.trim()) e.flatNo = "Flat / House number is required";
    if (!formData.area?.trim()) e.area = "Area / Street is required";
    if (!formData.city?.trim()) e.city = "Town / City is required";
    if (!formData.state?.trim()) e.state = "State is required";
    if (!formData.pincode?.trim()) {
      e.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      e.pincode = "Enter a valid 6-digit pincode";
    }
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) e.aadhaar = "Enter valid 12-digit Aadhaar number";
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) e.pan = "Enter valid PAN card number (e.g., AAAAA9999A)";
    if (!formData.permanentFlatNo?.trim()) e.permanentFlatNo = "Permanent flat / house number is required";
    if (!formData.permanentArea?.trim()) e.permanentArea = "Permanent area / street is required";
    if (!formData.permanentCity?.trim()) e.permanentCity = "Permanent town / city is required";
    if (!formData.permanentState?.trim()) e.permanentState = "Permanent state is required";
    if (!formData.permanentPincode?.trim()) {
      e.permanentPincode = "Permanent pincode is required";
    } else if (!/^\d{6}$/.test(formData.permanentPincode)) {
      e.permanentPincode = "Enter a valid 6-digit permanent pincode";
    }
    if (!formData.emergencyContactName.trim()) e.emergencyContactName = "Emergency contact name is required";
    if (!formData.emergencyContactNumber.trim()) {
      e.emergencyContactNumber = "Emergency contact number is required";
    } else if (!/^\d{10}$/.test(formData.emergencyContactNumber)) {
      e.emergencyContactNumber = "Enter valid 10-digit number";
    }
    if (!formData.employeeId.trim()) e.employeeId = "Employee ID is required";
    if (!formData.officialEmail.trim()) {
      e.officialEmail = "Official email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) {
      e.officialEmail = "Enter a valid official email";
    }
    if (!formData.officialPassword.trim()) e.officialPassword = "Official password is required";
    if (!formData.confirmOfficialPassword.trim()) {
      e.confirmOfficialPassword = "Confirm official password is required";
    } else if (formData.officialPassword !== formData.confirmOfficialPassword) {
      e.confirmOfficialPassword = "Official passwords do not match";
    }
    if (!formData.dateOfJoining) e.dateOfJoining = "Date of joining is required";
    if (!formData.salary) {
      e.salary = "Gross salary is required";
    } else if (Number(formData.salary) <= 0) {
      e.salary = "Gross salary must be greater than 0";
    }
    if (formData.esiApplicable === "YES") {
      if (!formData.esiNumber) e.esiNumber = "ESI Number is required";
      if (!formData.esiDispensary) e.esiDispensary = "ESI Dispensary is required";
    }
    if (formData.experience < 0) e.experience = "Experience cannot be negative";
    if (formData.pfApplicable === "YES") {
      if (!formData.pfNumber?.trim()) e.pfNumber = "PF Number is required";
      if (!formData.uanNumber?.trim()) {
        e.uanNumber = "UAN Number is required";
      } else if (!/^\d{12}$/.test(formData.uanNumber)) {
        e.uanNumber = "UAN must be 12 digits";
      }
    }
    if (formData.rejoin === "YES") {
      if (!formData.previousEmployeeId?.trim()) e.previousEmployeeId = "Previous Employee ID is required";
    }
    if (formData.accountPhone && !/^\d{10}$/.test(formData.accountPhone)) e.accountPhone = "Enter valid 10-digit phone number";
    if (formData.accountNumber && formData.reAccountNumber && formData.accountNumber !== formData.reAccountNumber) {
      e.reAccountNumber = "Account numbers do not match";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- TENANT LOAD FROM LOCALSTORAGE ---------------- */
  useEffect(() => {
    try {
      const tenantCode = localStorage.getItem("tenantCode");
      const companyName = localStorage.getItem("companyName");
      const companyId = localStorage.getItem("companyId");

      if (!tenantCode) {
        setError("Tenant code not found. Please log in again.");
        return;
      }
      setTenantInfo({
        tenantCode: tenantCode || "",
        companyName: companyName || "Unknown Company",
        companyId: companyId ? parseInt(companyId, 10) : null,
      });
    } catch (err) {
      console.error("Error reading tenant info from localStorage:", err);
      setError("Failed to load company information. Please log in again.");
    }
  }, []);

  useEffect(() => {
    const loadPayslipConfig = async () => {
      if (!tenantInfo.companyId) return;

      try {
        setSalaryConfigLoading(true);
        setSalaryConfigError("");
        setSalaryConfigMissing(false);

        const token = localStorage.getItem("token") || "";
        const result = await getPayslipConfig(tenantInfo.companyId, token, {
          ...(tenantInfo.tenantCode ? { "X-Tenant-Code": tenantInfo.tenantCode } : {}),
          ...(tenantInfo.companyId ? { "X-Company-Id": String(tenantInfo.companyId) } : {}),
        });

        setConfiguredSalaryComponents(result.components || []);
        setSalaryConfigMissing(Boolean(result.missing));
        setSalaryConfigError(result.message || "");
      } catch (err) {
        setConfiguredSalaryComponents([]);
        setSalaryConfigMissing(false);
        setSalaryConfigError(err.message || "Failed to load payslip configuration.");
      } finally {
        setSalaryConfigLoading(false);
      }
    };

    loadPayslipConfig();
  }, [tenantInfo.companyId, tenantInfo.tenantCode]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === "personalEmail" || name === "officialEmail" ? value.toLowerCase() : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: normalizedValue,
        ...(name === "department" ? { designation: "", teamLeader: "" } : {}),
        ...(name === "designation"
          ? { teamLeader: "", projectManagerEngineeringManager: "", directorCEO: "" }
          : {}),
      };
      if (name === "maritalStatus" && normalizedValue !== "MARRIED") updated.wifeName = "";
      if (name === "esiApplicable" && normalizedValue !== "YES") {
        updated.esiNumber = "";
        updated.esiDispensary = "";
      }
      if (name === "pfApplicable" && normalizedValue !== "YES") {
        updated.pfNumber = "";
        updated.uanNumber = "";
      }
      return updated;
    });

    if (name === "shiftType") {
      setShowCustomShift(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomShift("");
    }
    if (name === "workType") {
      setShowCustomWorkType(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomWorkType("");
    }
    if (name === "role") {
      setShowCustomRole(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomRole("");
    }
    if (name === "status") {
      setShowCustomStatus(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomStatus("");
    }
    if (name === "accountType") {
      setShowCustomAccountType(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomAccountType("");
    }
    if (name === "salaryCreditMethod") {
      setShowCustomSalaryCreditMethod(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomSalaryCreditMethod("");
    }
    if (name === "reportingManager") {
      setShowCustomReportingManager(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomReportingManager("");
    }
    if (name === "teamLeader") {
      setShowCustomTeamLeader(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomTeamLeader("");
    }
    if (name === "projectManagerEngineeringManager") {
      setShowCustomProjectManager(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomProjectManager("");
    }
    if (name === "directorCEO") {
      setShowCustomDirectorCEO(normalizedValue === "OTHER");
      if (normalizedValue !== "OTHER") setCustomDirectorCEO("");
    }
    if (!tenantInfo.tenantCode) {
      setError("Tenant code is missing. Please log in again.");
      return;
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  /* ---------------- CUSTOM OPTION BLUR HANDLERS ---------------- */
  const handleCustomShiftBlur = () => {
    if (customShift.trim()) {
      const val = customShift.trim().toUpperCase().replace(/\s+/g, "_");
      setShiftOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customShift.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, shiftType: val }));
      setCustomShift("");
      setShowCustomShift(false);
    }
  };

  const handleCustomWorkTypeBlur = () => {
    if (customWorkType.trim()) {
      const val = customWorkType.trim().toUpperCase().replace(/\s+/g, "_");
      setWorkTypeOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customWorkType.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, workType: val }));
      setCustomWorkType("");
      setShowCustomWorkType(false);
    }
  };

  const handleCustomRoleBlur = () => {
    if (customRole.trim()) {
      const val = customRole.trim().toUpperCase().replace(/\s+/g, "_");
      setRoleOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customRole.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, role: val }));
      setCustomRole("");
      setShowCustomRole(false);
    }
  };

  const handleCustomStatusBlur = () => {
    if (customStatus.trim()) {
      const val = customStatus.trim().toUpperCase().replace(/\s+/g, "_");
      setStatusOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customStatus.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, status: val }));
      setCustomStatus("");
      setShowCustomStatus(false);
    }
  };

  const handleCustomAccountTypeBlur = () => {
    if (customAccountType.trim()) {
      const val = customAccountType.trim().toUpperCase().replace(/\s+/g, "_");
      setAccountTypeOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customAccountType.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, accountType: val }));
      setCustomAccountType("");
      setShowCustomAccountType(false);
    }
  };

  const handleCustomSalaryCreditMethodBlur = () => {
    if (customSalaryCreditMethod.trim()) {
      const val = customSalaryCreditMethod.trim().toUpperCase().replace(/\s+/g, "_");
      setSalaryCreditMethodOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customSalaryCreditMethod.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, salaryCreditMethod: val }));
      setCustomSalaryCreditMethod("");
      setShowCustomSalaryCreditMethod(false);
    }
  };

  const handleCustomReportingManagerBlur = () => {
    if (customReportingManager.trim()) {
      const val = customReportingManager.trim();
      setReportingManagerOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customReportingManager.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, reportingManager: val }));
      setCustomReportingManager("");
      setShowCustomReportingManager(false);
    }
  };

  const handleCustomTeamLeaderBlur = () => {
    if (customTeamLeader.trim()) {
      const val = customTeamLeader.trim().toUpperCase().replace(/\s+/g, "_");
      const label = customTeamLeader.trim();
      setTeamLeaderOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, teamLeader: val }));
      setCustomTeamLeader("");
      setShowCustomTeamLeader(false);
    }
  };

  const handleCustomProjectManagerBlur = () => {
    if (customProjectManager.trim()) {
      const val = customProjectManager.trim();
      setProjectManagerOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customProjectManager.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, projectManagerEngineeringManager: val }));
      setCustomProjectManager("");
      setShowCustomProjectManager(false);
    }
  };

  const handleCustomDirectorCEOBlur = () => {
    if (customDirectorCEO.trim()) {
      const val = customDirectorCEO.trim();
      setDirectorCEOOptions((prev) => [
        ...prev.filter((o) => o.value !== "OTHER"),
        { value: val, label: customDirectorCEO.trim() },
        { value: "OTHER", label: "Other" },
      ]);
      setFormData((prev) => ({ ...prev, directorCEO: val }));
      setCustomDirectorCEO("");
      setShowCustomDirectorCEO(false);
    }
  };

  /* ---------------- DRAFT HANDLING ---------------- */
  useEffect(() => {
    const savedDraft = localStorage.getItem("employeeDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFormData(draft);
      if (draft.salaryComponents) setSalaryComponents(draft.salaryComponents);
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem("employeeDraft", JSON.stringify(formData));
    alert("Draft saved successfully!");
  };
  const handleSavePersonalDraft = () => {
    localStorage.setItem("personalDetailsDraft", JSON.stringify(formData));
    alert("Personal details draft saved successfully!");
  };
  const handleSaveEmployeeDraft = () => {
    localStorage.setItem("employeeDetailsDraft", JSON.stringify(formData));
    alert("Employee details draft saved successfully!");
  };
  const handleSaveAccountDraft = () => {
    localStorage.setItem("accountDetailsDraft", JSON.stringify(formData));
    alert("Account details draft saved successfully!");
  };
  const handleSaveSalaryDraft = () => {
    const draftData = { ...formData, salaryComponents };
    localStorage.setItem("salaryDetailsDraft", JSON.stringify(draftData));
    alert("Salary details draft saved successfully!");
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.removeItem("employeeDraft");
    localStorage.removeItem("personalDetailsDraft");
    localStorage.removeItem("employeeDetailsDraft");
    localStorage.removeItem("accountDetailsDraft");
    localStorage.removeItem("salaryDetailsDraft");
    if (!validate()) return;

    const fullName = [formData.firstName, formData.middleName, formData.lastName]
      .filter(Boolean).map((p) => p.trim()).filter(Boolean).join(" ");

    // Keep role independent from designation.
    const computedRole = formData.role;

    const payload = {
      user: {
        fullName,
        email: (formData.officialEmail || formData.personalEmail || "").toLowerCase(),
        password: formData.password,
        mobile: formData.personalPhone,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.designation,
        dob: formData.dob,
        joiningDate: formData.dateOfJoining,
        role: computedRole,

        tenantCode: tenantInfo.tenantCode,
        companyId: tenantInfo.companyId,
        companyName: tenantInfo.companyName,
      },
      personalDetails: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: formData.dob,
        personalPhone: formData.personalPhone,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        personalEmail: (formData.personalEmail || "").toLowerCase(),
        flatNo: formData.flatNo,
        area: formData.area,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        permanentFlatNo: formData.permanentFlatNo,
        permanentArea: formData.permanentArea,
        permanentLandmark: formData.permanentLandmark,
        permanentCity: formData.permanentCity,
        permanentState: formData.permanentState,
        permanentPincode: formData.permanentPincode,
        aadhaar: formData.aadhaar,
        pan: formData.pan,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        wifeName: formData.wifeName,
      },
      employeeDetails: {
        officialEmail: (formData.officialEmail || "").toLowerCase(),
        officialPassword: formData.officialPassword,
        confirmOfficialPassword: formData.confirmOfficialPassword,
        dateOfJoining: formData.dateOfJoining,
        employmentType: formData.employmentType,
        workType: formData.workType,
        shiftType: formData.shiftType,
        role: computedRole,
        workLocation: formData.workLocation,
        status: formData.status,
        experience: formData.experience ? Number(formData.experience) : null,
        department: formData.department,
        designation: formData.designation,
        reportingManager: formData.reportingManager,
        teamLeader: formData.teamLeader,
        projectManagerEngineeringManager: formData.projectManagerEngineeringManager,
        directorCEO: formData.directorCEO,
      },
      accountDetails: {
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        reAccountNumber: formData.reAccountNumber,
        accountType: formData.accountType,
        ifscCode: formData.ifscCode,
        salaryCreditMethod: formData.salaryCreditMethod,
        accountPhone: formData.accountPhone,
      },
      grossSalaryDetails: {
        salary: Number(formData.salary),
        companyJoinDate: formData.companyjoindate,
        basicSalary: salaryComponents.basicSalary,
        da: salaryComponents.da,
        hra: salaryComponents.hra,
        conveyanceAllowance: salaryComponents.conveyanceAllowance,
        medicalAllowance: salaryComponents.medicalAllowance,
        medicalInsurance: salaryComponents.medicalInsurance,
        lta: salaryComponents.lta,
        specialAllowance: salaryComponents.specialAllowance,
        otherAllowances: salaryComponents.otherAllowances,
        deductions: salaryComponents.deductions,
        pfEmployeeContribution: salaryComponents.pfEmployeeContribution,
        professionalTax: salaryComponents.professionalTax,
        taxDeductions: salaryComponents.taxDeductions,
        otherDeductions: salaryComponents.otherDeductions,
        esic: salaryComponents.esic,
        netSalary: salaryComponents.netSalary,
        esiApplicable: formData.esiApplicable === "YES",
        esiNumber: formData.esiApplicable === "YES" ? formData.esiNumber : null,
        esiDispensary: formData.esiApplicable === "YES" ? formData.esiDispensary : null,
        pfApplicable: formData.pfApplicable === "YES",
        pfNumber: formData.pfApplicable === "YES" ? formData.pfNumber : null,
        uanNumber: formData.pfApplicable === "YES" ? formData.uanNumber : null,
        rejoin: formData.rejoin === "YES",
        previousEmployeeId: formData.rejoin === "YES" ? formData.previousEmployeeId : null,
        remark: formData.remark || null,
      },
    };

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const authHeader = token
        ? token.startsWith("Bearer ") ? token : `Bearer ${token}`
        : null;
      const endpoint = `${API_BASE_URL.replace(/\/+$/, "")}/api/employees/full-profile`;
      const res = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = text ? { message: text } : null;
      }
      if (!res.ok) {
        console.error("Employee creation failed:", data);
        alert(`Failed to create employee: ${data?.message || "Unknown error"}`);
        return;
      }
      alert("Employee created successfully");
      onSubmit?.(data);
      setFormData(initialForm);
      setErrors({});
    } catch (error) {
      console.error("Employee creation request failed:", error);
      alert(`Server error. Please try again. ${error?.message ? `(${error.message})` : ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- FIELD ERROR COMPONENT ---------------- */
  const FieldError = ({ name }) =>
    errors[name] ? <p className={errorText}>{errors[name]}</p> : null;

  /* ---------------- ADD NOTE COMPONENT ---------------- */
  const AddNote = ({ sectionKey }) => (
    <div className="mt-4">
      {extraText[sectionKey]
        .filter((item) => item.saved)
        .map((item, idx) => (
          <div key={`saved-${idx}`} className="mb-3 grid grid-cols-2 gap-2">
            <input type="text" className={inputBase} value={item.title} readOnly placeholder="Heading" />
            <input type="text" className={inputBase} value={item.info} readOnly placeholder="Info" />
          </div>
        ))}
      {extraText[sectionKey]
        .filter((item) => !item.saved)
        .map((item) => (
          <div key={item.id} className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="text"
              className={inputBase}
              placeholder="Heading"
              value={item.title}
              onChange={(e) =>
                setExtraText((prev) => ({
                  ...prev,
                  [sectionKey]: prev[sectionKey].map((n) =>
                    n.id === item.id ? { ...n, title: e.target.value } : n
                  ),
                }))
              }
            />
            <input
              type="text"
              className={inputBase}
              placeholder="Info"
              value={item.info}
              onChange={(e) =>
                setExtraText((prev) => ({
                  ...prev,
                  [sectionKey]: prev[sectionKey].map((n) =>
                    n.id === item.id ? { ...n, info: e.target.value } : n
                  ),
                }))
              }
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              onClick={() =>
                setExtraText((prev) => ({
                  ...prev,
                  [sectionKey]: prev[sectionKey].map((n) =>
                    n.id === item.id ? { ...n, saved: true } : n
                  ),
                }))
              }
            >
              Save
            </button>
          </div>
        ))}
    </div>
  );

  /* ================================================================
     UI
  ================================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-10 px-4">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Add New Employee</h1>
            <p className="text-sm text-gray-500">Admin-only employee onboarding</p>
          </div>
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Adding employee to:</p>
              <p className="text-xs text-gray-600">
                {tenantInfo.companyName} (Tenant Code:{" "}
                <span className="font-mono font-semibold">{tenantInfo.tenantCode}</span>)
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-xs text-green-600 mt-1">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ==================== PERSONAL DETAILS ==================== */}
          <div className={sectionCard}>
            <h2 className="mb-4 text-lg font-semibold text-black">Personal Details</h2>

            {/* Name */}
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              <div>
                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input required type="text" name="firstName" className={inputBase} value={formData.firstName} onChange={handleChange} />
                <FieldError name="firstName" />
              </div>
              <div>
                <label className={labelClass}>Middle Name</label>
                <input type="text" name="middleName" className={inputBase} value={formData.middleName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input required type="text" name="lastName" className={inputBase} value={formData.lastName} onChange={handleChange} />
                <FieldError name="lastName" />
              </div>
            </div>

            {/* Gender */}
            <div className="mb-5">
              <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
              <div className="flex gap-6 mt-2">
                {[["MALE", "Male"], ["FEMALE", "Female"], ["OTHER", "Other"]].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={value} checked={formData.gender === value} onChange={handleChange} required className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <FieldError name="gender" />
            </div>

            {/* DOB + Phone */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dob" className={inputBase} value={formData.dob} onChange={handleChange} />
                <FieldError name="dob" />
              </div>
              <div>
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <input type="text" name="personalPhone" className={inputBase} value={formData.personalPhone} onChange={handleChange} />
                <FieldError name="personalPhone" />
              </div>
            </div>

            {/* Father / Mother */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Father's Name <span className="text-red-500">*</span></label>
                <input type="text" name="fatherName" className={inputBase} value={formData.fatherName || ""} onChange={handleChange} placeholder="Enter father's name" />
              </div>
              <div>
                <label className={labelClass}>Mother's Name <span className="text-red-500">*</span></label>
                <input type="text" name="motherName" className={inputBase} value={formData.motherName || ""} onChange={handleChange} placeholder="Enter mother's name" />
              </div>
            </div>

            {/* Emergency */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Emergency Contact Name <span className="text-red-500">*</span></label>
                <input required name="emergencyContactName" className={inputBase} placeholder="Full Name" value={formData.emergencyContactName} onChange={handleChange} />
                <FieldError name="emergencyContactName" />
              </div>
              <div>
                <label className={labelClass}>Emergency Contact Number <span className="text-red-500">*</span></label>
                <input required name="emergencyContactNumber" className={inputBase} placeholder="10-digit mobile number" value={formData.emergencyContactNumber} onChange={handleChange} />
                <FieldError name="emergencyContactNumber" />
              </div>
            </div>

            {/* Personal Email + Passwords */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Personal Email <span className="text-red-500">*</span></label>
                <input required type="email" name="personalEmail" className={inputBase} value={formData.personalEmail} onChange={handleChange} />
                <FieldError name="personalEmail" />
              </div>
              <div>
                <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                <input required type="password" name="password" className={inputBase} value={formData.password} onChange={handleChange} />
                <FieldError name="password" />
              </div>
              <div>
                <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" name="confirmPassword" className={inputBase} value={formData.confirmPassword} onChange={handleChange} />
                <FieldError name="confirmPassword" />
              </div>

              {/* Current Address */}
              <div className="col-span-2">
                <h3 className="text-md font-medium text-gray-700 mb-3">Current Address</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Flat / House No. <span className="text-red-500">*</span></label>
                    <input required type="text" name="flatNo" className={inputBase} placeholder="Flat / House No., Building / Company / Apartment" value={formData.flatNo} onChange={handleChange} />
                    <FieldError name="flatNo" />
                  </div>
                  <div>
                    <label className={labelClass}>Area / Street <span className="text-red-500">*</span></label>
                    <input required type="text" name="area" className={inputBase} placeholder="Area, Street, Sector, Village" value={formData.area} onChange={handleChange} />
                    <FieldError name="area" />
                  </div>
                  <div>
                    <label className={labelClass}>Landmark</label>
                    <input type="text" name="landmark" className={inputBase} placeholder="Landmark (Optional)" value={formData.landmark} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Town / City <span className="text-red-500">*</span></label>
                    <input required type="text" name="city" className={inputBase} placeholder="Town / City" value={formData.city} onChange={handleChange} />
                    <FieldError name="city" />
                  </div>
                  <div>
                    <label className={labelClass}>State <span className="text-red-500">*</span></label>
                    <input required type="text" name="state" className={inputBase} placeholder="State" value={formData.state} onChange={handleChange} />
                    <FieldError name="state" />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode <span className="text-red-500">*</span></label>
                    <input required type="text" name="pincode" className={inputBase} placeholder="Pincode" value={formData.pincode} onChange={handleChange} />
                    <FieldError name="pincode" />
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="col-span-2">
                <h3 className="text-md font-medium text-gray-700 mb-3">Permanent Address</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Flat / House No. <span className="text-red-500">*</span></label>
                    <input required type="text" name="permanentFlatNo" className={inputBase} placeholder="Flat / House No., Building / Company / Apartment" value={formData.permanentFlatNo} onChange={handleChange} />
                    <FieldError name="permanentFlatNo" />
                  </div>
                  <div>
                    <label className={labelClass}>Area / Street <span className="text-red-500">*</span></label>
                    <input required type="text" name="permanentArea" className={inputBase} placeholder="Area, Street, Sector, Village" value={formData.permanentArea} onChange={handleChange} />
                    <FieldError name="permanentArea" />
                  </div>
                  <div>
                    <label className={labelClass}>Landmark</label>
                    <input type="text" name="permanentLandmark" className={inputBase} placeholder="Landmark (Optional)" value={formData.permanentLandmark} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Town / City <span className="text-red-500">*</span></label>
                    <input required type="text" name="permanentCity" className={inputBase} placeholder="Town / City" value={formData.permanentCity} onChange={handleChange} />
                    <FieldError name="permanentCity" />
                  </div>
                  <div>
                    <label className={labelClass}>State <span className="text-red-500">*</span></label>
                    <input required type="text" name="permanentState" className={inputBase} placeholder="State" value={formData.permanentState} onChange={handleChange} />
                    <FieldError name="permanentState" />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode <span className="text-red-500">*</span></label>
                    <input required type="text" name="permanentPincode" className={inputBase} placeholder="Pincode" value={formData.permanentPincode} onChange={handleChange} />
                    <FieldError name="permanentPincode" />
                  </div>
                  <div>
                    <label className={labelClass}>Aadhaar Number</label>
                    <input type="text" name="aadhaar" className={inputBase} placeholder="12-digit Aadhaar number" value={formData.aadhaar} onChange={handleChange} />
                    <FieldError name="aadhaar" />
                  </div>
                  <div>
                    <label className={labelClass}>PAN Card Number</label>
                    <input type="text" name="pan" className={inputBase} placeholder="PAN card number (e.g., AAAAA9999A)" value={formData.pan} onChange={handleChange} />
                    <FieldError name="pan" />
                  </div>
                </div>

                {/* Blood Group + Marital Status */}
                <div className="grid md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className={labelClass}>Blood Group</label>
                    <select name="bloodGroup" className={inputBase} value={formData.bloodGroup} onChange={handleChange}>
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Marital Status <span className="text-red-500">*</span></label>
                    <div className="flex gap-6 mt-2">
                      {[["MARRIED", "Married"], ["SINGLE", "Single"]].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="maritalStatus" value={value} checked={formData.maritalStatus === value} onChange={handleChange} required className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                    {formData.maritalStatus === "MARRIED" && (
                      <div className="mt-3">
                        <label className={labelClass}>Wife's Name</label>
                        <input type="text" name="wifeName" className={inputBase} placeholder="Enter wife's name" value={formData.wifeName} onChange={handleChange} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button type="button" onClick={handleSavePersonalDraft} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Save size={16} /> Save Personal Details
              </button>
            </div>
            <AddNote sectionKey="personal" />
          </div>

          {/* ==================== EMPLOYEE DETAILS ==================== */}
          <div className={sectionCard}>
            <h2 className="mb-4 text-lg font-semibold text-black">Employee Details</h2>
            <div className="grid md:grid-cols-2 gap-5">

              {/* Employee ID */}
              <div>
                <label className={labelClass}>Employee ID <span className="text-red-500">*</span></label>
                <input required name="employeeId" className={inputBase} placeholder="EMP-001" value={formData.employeeId} onChange={handleChange} />
                <FieldError name="employeeId" />
              </div>

              {/* Official Email */}
              <div>
                <label className={labelClass}>Official Email <span className="text-red-500">*</span></label>
                <input required type="email" name="officialEmail" className={inputBase} placeholder="name@company.com" value={formData.officialEmail} onChange={handleChange} />
                <FieldError name="officialEmail" />
              </div>

              {/* Official Password */}
              <div>
                <label className={labelClass}>Official Password <span className="text-red-500">*</span></label>
                <input required type="password" name="officialPassword" className={inputBase} placeholder="Enter official password" value={formData.officialPassword} onChange={handleChange} />
                <FieldError name="officialPassword" />
              </div>

              {/* Confirm Official Password */}
              <div>
                <label className={labelClass}>Confirm Official Password <span className="text-red-500">*</span></label>
                <input required type="password" name="confirmOfficialPassword" className={inputBase} placeholder="Confirm official password" value={formData.confirmOfficialPassword} onChange={handleChange} />
                <FieldError name="confirmOfficialPassword" />
              </div>

              {/* Date of Joining */}
              <div>
                <label className={labelClass}>Date of Joining <span className="text-red-500">*</span></label>
                <input required type="date" name="dateOfJoining" className={inputBase} value={formData.dateOfJoining} onChange={handleChange} />
                <FieldError name="dateOfJoining" />
              </div>

              {/* Employment Type */}
              <div>
                <label className={labelClass}>Employment Type <span className="text-red-500">*</span></label>
                <select required name="employmentType" className={inputBase} value={formData.employmentType} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
                <FieldError name="employmentType" />
              </div>

              {/* Work Type */}
              <div>
                <label className={labelClass}>Work Type <span className="text-red-500">*</span></label>
                <select name="workType" className={inputBase} value={formData.workType} onChange={handleChange}>
                  <option value="">Select Work Type</option>
                  {workTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomWorkType && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom work type" value={customWorkType} onChange={(e) => setCustomWorkType(e.target.value)} onBlur={handleCustomWorkTypeBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomWorkTypeBlur()} />
                  </div>
                )}
                <FieldError name="workType" />
              </div>

              {/* Shift Type */}
              <div>
                <label className={labelClass}>Shift Type <span className="text-red-500">*</span></label>
                <select name="shiftType" className={inputBase} value={formData.shiftType} onChange={handleChange} required>
                  <option value="">Select Shift Type</option>
                  {shiftOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomShift && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom shift type" value={customShift} onChange={(e) => setCustomShift(e.target.value)} onBlur={handleCustomShiftBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomShiftBlur()} />
                  </div>
                )}
                <FieldError name="shiftType" />
              </div>

              {/* Role */}
              <div>
                <label className={labelClass}>Role <span className="text-red-500">*</span></label>
                <select required name="role" className={inputBase} value={formData.role} onChange={handleChange}>
                  <option value="">Select Role</option>
                  {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomRole && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom role" value={customRole} onChange={(e) => setCustomRole(e.target.value)} onBlur={handleCustomRoleBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomRoleBlur()} />
                  </div>
                )}
                <FieldError name="role" />
              </div>

              {/* Work Location */}
              <div>
                <label className={labelClass}>Work Location <span className="text-red-500">*</span></label>
                <input required name="workLocation" className={inputBase} value={formData.workLocation} onChange={handleChange} />
                <FieldError name="workLocation" />
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>Employee Status <span className="text-red-500">*</span></label>
                <select name="status" className={inputBase} value={formData.status} onChange={handleChange}>
                  <option value="">Select Status</option>
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomStatus && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom status" value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} onBlur={handleCustomStatusBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomStatusBlur()} />
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className={labelClass}>Experience (Years)</label>
                <input type="number" name="experience" className={inputBase} placeholder="e.g., 3" value={formData.experience || ""} onChange={handleChange} min={0} />
              </div>

              {/* Department */}
              <div>
                <label className={labelClass}>Department <span className="text-red-500">*</span></label>
                <select required name="department" className={inputBase} value={formData.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  <option value="Hospital Department">Hospital Department</option>
                  <option value="School Department">School Department</option>
                  <option value="College Department">College Department</option>
                  <option value="Manufacturing Department">Manufacturing Department</option>
                  <option value="Software Department">Software Department</option>
                  <option value="Other Department">Other Department</option>
                </select>
                <FieldError name="department" />
              </div>

              {/* Designation */}
              <div>
                <label className={labelClass}>Designation <span className="text-red-500">*</span></label>
                <select required name="designation" className={inputBase} value={formData.designation} onChange={handleChange} disabled={!formData.department}>
                  <option value="">Select Designation</option>
                  {(departmentDesignations[formData.department] || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <FieldError name="designation" />
              </div>

              {/* ---- Team Leader (dynamic from DB) ---- */}
              {shouldShowTeamLeaderField(formData.department, formData.designation) && (
                <div>
                  <label className={labelClass}>
                    Team_Leader
                    {teamLeaderLoading && (
                      <span className="ml-2 text-xs text-blue-500 font-normal">Loading...</span>
                    )}
                  </label>
                  <select
                    name="teamLeader"
                    className={inputBase}
                    value={formData.teamLeader}
                    onChange={handleChange}
                    required={shouldShowTeamLeaderField(formData.department, formData.designation)}
                    disabled={teamLeaderLoading}
                  >
                    {teamLeaderLoading ? (
                      <option value="">Loading team leads...</option>
                    ) : (
                      teamLeaderOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))
                    )}
                  </select>
                  {showCustomTeamLeader && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className={inputBase}
                        placeholder="Enter custom team leader"
                        value={customTeamLeader}
                        onChange={(e) => setCustomTeamLeader(e.target.value)}
                        onBlur={handleCustomTeamLeaderBlur}
                        onKeyDown={(e) => e.key === "Enter" && handleCustomTeamLeaderBlur()}
                      />
                    </div>
                  )}
                  <FieldError name="teamLeader" />
                </div>
              )}

              {/* Engineering Manager / Project Manager */}
              {MANAGER_DESIGNATIONS.includes(formData.designation) && (
                <div>
                  <label className={labelClass}>Engineering Manager / Project Manager</label>
                  <select name="projectManagerEngineeringManager" className={inputBase} value={formData.projectManagerEngineeringManager} onChange={handleChange}>
                    {projectManagerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {showCustomProjectManager && (
                    <div className="mt-2">
                      <input type="text" className={inputBase} placeholder="Enter custom project manager" value={customProjectManager} onChange={(e) => setCustomProjectManager(e.target.value)} onBlur={handleCustomProjectManagerBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomProjectManagerBlur()} />
                    </div>
                  )}
                </div>
              )}

              {/* Director / CEO */}
              {DIRECTOR_DESIGNATIONS.includes(formData.designation) && (
                <div>
                  <label className={labelClass}>Director / CEO</label>
                  <select name="directorCEO" className={inputBase} value={formData.directorCEO} onChange={handleChange}>
                    {directorCEOOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {showCustomDirectorCEO && (
                    <div className="mt-2">
                      <input type="text" className={inputBase} placeholder="Enter custom director CEO" value={customDirectorCEO} onChange={(e) => setCustomDirectorCEO(e.target.value)} onBlur={handleCustomDirectorCEOBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomDirectorCEOBlur()} />
                    </div>
                  )}
                </div>
              )}

              {/* Reporting Manager */}
              <div>
                <label className={labelClass}>Reporting Manager <span className="text-red-500">*</span></label>
                <select required name="reportingManager" className={inputBase} value={formData.reportingManager} onChange={handleChange}>
                  {reportingManagerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomReportingManager && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom reporting manager" value={customReportingManager} onChange={(e) => setCustomReportingManager(e.target.value)} onBlur={handleCustomReportingManagerBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomReportingManagerBlur()} />
                  </div>
                )}
                <FieldError name="reportingManager" />
              </div>

            </div>

            <AddNote sectionKey="employee" />
            <div className="flex justify-end mt-4">
              <button type="button" onClick={handleSaveEmployeeDraft} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Save size={16} /> Save Employee Details
              </button>
            </div>
          </div>

          {/* ==================== ACCOUNT DETAILS ==================== */}
          <div className={sectionCard}>
            <h2 className="mb-4 text-lg font-semibold text-black">Account Details</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Bank Name <span className="text-red-500">*</span></label>
                <input type="text" name="bankName" className={inputBase} placeholder="Enter Bank Name" value={formData.bankName || ""} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Branch Name <span className="text-red-500">*</span></label>
                <input type="text" name="branchName" className={inputBase} placeholder="Enter Branch Name" value={formData.branchName || ""} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Account Holder Name <span className="text-red-500">*</span></label>
                <input type="text" name="accountHolderName" className={inputBase} placeholder="Enter Account Holder Name" value={formData.accountHolderName || ""} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Account Number <span className="text-red-500">*</span></label>
                <input type="text" name="accountNumber" className={inputBase} placeholder="Enter Account Number" value={formData.accountNumber || ""} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Re-enter Account Number <span className="text-red-500">*</span></label>
                <input type="text" name="reAccountNumber" className={inputBase} value={formData.reAccountNumber || ""} onChange={handleChange} placeholder="Re-enter account number" />
                <FieldError name="reAccountNumber" />
              </div>
              <div>
                <label className={labelClass}>Account Type <span className="text-red-500">*</span></label>
                <select name="accountType" className={inputBase} value={formData.accountType || ""} onChange={handleChange}>
                  <option value="">Select Account Type</option>
                  {accountTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomAccountType && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom account type" value={customAccountType} onChange={(e) => setCustomAccountType(e.target.value)} onBlur={handleCustomAccountTypeBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomAccountTypeBlur()} />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>IFSC Code <span className="text-red-500">*</span></label>
                <input type="text" name="ifscCode" className={inputBase} placeholder="e.g., SBIN0001234" value={formData.ifscCode || ""} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Salary Credit Method <span className="text-red-500">*</span></label>
                <select name="salaryCreditMethod" className={inputBase} value={formData.salaryCreditMethod || ""} onChange={handleChange}>
                  <option value="">Select Method</option>
                  {salaryCreditMethodOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {showCustomSalaryCreditMethod && (
                  <div className="mt-2">
                    <input type="text" className={inputBase} placeholder="Enter custom salary credit method" value={customSalaryCreditMethod} onChange={(e) => setCustomSalaryCreditMethod(e.target.value)} onBlur={handleCustomSalaryCreditMethodBlur} onKeyDown={(e) => e.key === "Enter" && handleCustomSalaryCreditMethodBlur()} />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <input name="accountPhone" className={inputBase} value={formData.accountPhone} onChange={handleChange} />
                <FieldError name="accountPhone" />
              </div>
            </div>

            <AddNote sectionKey="account" />
            <div className="flex justify-end mt-4">
              <button type="button" onClick={handleSaveAccountDraft} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Save size={16} /> Save Account Details
              </button>
            </div>
          </div>

          {/* ==================== SALARY DETAILS ==================== */}
          <div className={sectionCard}>
            <h2 className="mb-4 text-lg font-semibold text-black">Gross Salary Details</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Gross Salary <span className="text-red-500">*</span></label>
                <input required type="number" name="salary" className={inputBase} placeholder="Enter gross salary" value={formData.salary || ""} onChange={handleChange} min={0} />
                <FieldError name="salary" />
              </div>
              <div>
                <label className={labelClass}>Company Join Date <span className="text-red-500">*</span></label>
                <input type="date" name="companyjoindate" className={inputBase} value={formData.companyjoindate} onChange={handleChange} />
              </div>
            </div>

            {/* Salary Breakdown */}
            {formData.salary && formData.salary > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4">Salary Components Breakdown</h3>
                {salaryConfigLoading && (
                  <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                    Loading payslip generator fields...
                  </p>
                )}
                {salaryConfigError && !salaryConfigMissing && (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {salaryConfigError}
                  </p>
                )}
                {salaryConfigMissing && (
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Payslip Generator is not configured for this company. Showing default salary fields.
                  </p>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {breakdownFields.map(({ key, label, isDeduction }) => (
                    <div key={key} className={`${isDeduction ? "bg-red-50" : "bg-gray-50"} p-3 rounded-lg`}>
                      <label className={`text-sm font-medium ${isDeduction ? "text-red-600" : "text-gray-600"}`}>{label}</label>
                      <input
                        type="number"
                        className={`w-full mt-1 text-lg font-semibold ${isDeduction ? "text-red-800 border-red-300" : "text-gray-800 border-gray-300"} border rounded px-2 py-1`}
                        value={salaryComponents[key] ?? 0}
                        onChange={(e) => setSalaryComponents((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-800">Net Salary</span>
                    <span className="text-xl font-bold text-blue-900">
                      ₹ {Number(salaryComponents.netSalary ?? Number(formData.salary || 0) - salaryComponents.deductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5 mt-5">
              {/* ESI */}
              <div>
                <label className={labelClass}>ESI Applicable <span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-2">
                  {[["YES", "Yes"], ["NO", "No"]].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 text-black">
                      <input type="radio" name="esiApplicable" value={val} checked={formData.esiApplicable === val} onChange={handleChange} />
                      {lbl}
                    </label>
                  ))}
                </div>
                {formData.esiApplicable === "YES" && (
                  <div className="grid md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className={labelClass}>ESI Number <span className="text-red-500">*</span></label>
                      <input type="text" name="esiNumber" className={inputBase} placeholder="Enter ESI Number" value={formData.esiNumber} onChange={handleChange} />
                      <FieldError name="esiNumber" />
                    </div>
                    <div>
                      <label className={labelClass}>ESI Dispensary <span className="text-red-500">*</span></label>
                      <input type="text" name="esiDispensary" className={inputBase} placeholder="Enter ESI Dispensary" value={formData.esiDispensary} onChange={handleChange} />
                      <FieldError name="esiDispensary" />
                    </div>
                  </div>
                )}
              </div>

              {/* PF */}
              <div>
                <label className={labelClass}>PF Applicable <span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-2">
                  {[["YES", "Yes"], ["NO", "No"]].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 text-black">
                      <input type="radio" name="pfApplicable" value={val} checked={formData.pfApplicable === val} onChange={handleChange} />
                      {lbl}
                    </label>
                  ))}
                </div>
                {formData.pfApplicable === "YES" && (
                  <div className="grid md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className={labelClass}>PF Number <span className="text-red-500">*</span></label>
                      <input type="text" name="pfNumber" className={inputBase} placeholder="Enter PF Number" value={formData.pfNumber} onChange={handleChange} />
                      <FieldError name="pfNumber" />
                    </div>
                    <div>
                      <label className={labelClass}>UAN Number <span className="text-red-500">*</span></label>
                      <input type="text" name="uanNumber" className={inputBase} placeholder="Enter 12-digit UAN Number" value={formData.uanNumber} onChange={handleChange} />
                      <FieldError name="uanNumber" />
                    </div>
                  </div>
                )}
              </div>

              {/* Rejoin */}
              <div>
                <label className={labelClass}>Rejoin <span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-2">
                  {[["YES", "Yes"], ["NO", "No"]].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-black">
                      <input type="radio" name="rejoin" value={val} checked={formData.rejoin === val} onChange={handleChange} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
                {formData.rejoin === "YES" && (
                  <div className="mt-4">
                    <label className={labelClass}>Previous Employee ID <span className="text-red-500">*</span></label>
                    <input type="text" name="previousEmployeeId" className={inputBase} placeholder="Enter Previous Employee ID" value={formData.previousEmployeeId} onChange={handleChange} />
                    <FieldError name="previousEmployeeId" />
                  </div>
                )}
              </div>

              {/* Remark */}
              <div className="mt-5">
                <label className={labelClass}>Remark</label>
                <textarea name="remark" rows={3} className={inputBase} placeholder="Enter remark (optional)" value={formData.remark} onChange={handleChange} />
              </div>
            </div>

            <AddNote sectionKey="salary" />
            <div className="flex justify-end mt-4">
              <button type="button" onClick={handleSaveSalaryDraft} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Save size={16} /> Save Salary Details
              </button>
            </div>
          </div>

          {/* ==================== FORM ACTIONS ==================== */}
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={handleSaveDraft} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Save size={18} /> Save Draft
            </button>
            <button type="submit" disabled={submitting || loading || !tenantInfo.tenantCode} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
              <Save size={18} />
              {submitting ? "Submitting..." : "Create Employee"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
