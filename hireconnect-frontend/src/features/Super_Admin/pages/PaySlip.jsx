import React, { useMemo, useState, useEffect } from "react";

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

const getAuthHeader = () => {
  const raw = (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    ""
  ).trim();
  if (!raw) return "";
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};

const getContextHeaders = () => {
  const tenantCode = (localStorage.getItem("tenantCode") || sessionStorage.getItem("tenantCode") || "").trim();
  const companyId = (localStorage.getItem("companyId") || sessionStorage.getItem("companyId") || "").trim();
  return {
    ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
    ...(companyId ? { "X-Company-Id": companyId } : {}),
  };
};

const BROAD_CLASSIFICATION = [
  {
    title: "Earnings Components",
    items: [
      "Basic Pay",
      "HRA",
      "Special Allowance",
      "Bonus",
      "Incentives",
      "Overtime",
      "Allowances (various types)",
    ],
  },
  {
    title: "Employer Contributions",
    items: ["Gratuity", "Insurance", "Superannuation"],
  },
  {
    title: "Deductions",
    items: ["Employee PF", "ESI", "Professional Tax", "Income Tax (TDS)"],
  },
  {
    title: "Salary Components",
    items:["Arrears", "Attendance Allowance", "Additional Allowance", "Basic Salary (Basic Pay)", "Bonus (Performance / Annual / Festival)", "Broadband / Internet Reimbursement", "Conveyance Allowance", "City Compensatory Allowance (CCA)", "Commission", "Cost to Company (CTC)", "Children Education Allowance", "Dearness Allowance (DA)", "Deputation Allowance", "Dress Allowance", "Daily Allowance (DA & Travel)", "Employee Provident Fund (EPF & Deduction)", "Employer Provident Fund Contribution", "Employee State Insurance (ESI)", "Encashment (Leave Encashment)", "Education Allowance", "Food Allowance / Meal Coupons", "Festival Allowance", "Fuel Allowance", "Gratuity", "Gift Voucher (Taxable/Non-taxable)", "House Rent Allowance (HRA)", "Health Insurance", "Hardship Allowance", "Holiday Pay", "Incentives", "Income Tax (TDS& Deduction)", "Internet Allowance", "Joining Bonus", "Job Allowance", "Leave Travel Allowance (LTA)", "Leave Encashment", "Loyalty Bonus", "Medical Allowance", "Mobile Reimbursement", "Meal Allowance", "Mileage Reimbursement", "Night Shift Allowance", "Non-Practicing Allowance (NPA & for doctors)", "Overtime Pay", "On-call Allowance", "Other Allowances", "Professional Tax (Deduction)", "Performance Bonus", "Petrol Allowance", "Provident Fund (PF)", "Retention Bonus", "Reimbursement (Travel/Medical/Internet)", "Relocation Allowance", "Special Allowance", "Shift Allowance", "Sales Incentive", "Statutory Bonus", "Superannuation Contribution", "Travel Allowance", "Telephone Allowance", "Transport Allowance", "Training Allowance", "Uniform Allowance", "Utility Allowance", "Variable Pay", "Vehicle Allowance", "Washing Allowance"],
  
  },
];

const COMPONENT_TO_FIELD = {
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
  "gross salary": "grossSalary",
  "overtime pay": "overtimeHours",
  overtime: "overtimeHours",
};

const FIELD_CATEGORY = {
  basicSalary: "earnings",
  da: "earnings",
  hra: "earnings",
  conveyanceAllowance: "earnings",
  medicalAllowance: "earnings",
  lta: "earnings",
  specialAllowance: "earnings",
  otherAllowances: "earnings",
  grossSalary: "earnings",
  pfEmployee: "deductions",
  professionalTax: "deductions",
  taxDeductions: "deductions",
  otherDeductions: "deductions",
  esic: "deductions",
  medicalInsurance: "deductions",
  overtimeHours: "meta",
};

const SECTION_STYLES = [
  {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
    legend: "text-sky-800",
    chipChecked:
      "peer-checked:border-sky-500 peer-checked:bg-sky-100 peer-checked:text-sky-800",
  },
  {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    legend: "text-emerald-800",
    chipChecked:
      "peer-checked:border-emerald-500 peer-checked:bg-emerald-100 peer-checked:text-emerald-800",
  },
  {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
    legend: "text-rose-800",
    chipChecked:
      "peer-checked:border-rose-500 peer-checked:bg-rose-100 peer-checked:text-rose-800",
  },
  {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
    legend: "text-violet-800",
    chipChecked:
      "peer-checked:border-violet-500 peer-checked:bg-violet-100 peer-checked:text-violet-800",
  },
];

const toId = (componentName) =>
  `salary-component-${componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const normalizeMode = (mode) =>
  ["percentage", "percent"].includes(String(mode || "").trim().toLowerCase())
    ? "percentage"
    : "amount";

const resolveFieldKey = (component) => COMPONENT_TO_FIELD[normalize(component)] || null;
const isEmployeePfComponent = (component) => {
  const normalized = normalize(component);
  if (resolveFieldKey(component) === "pfEmployee") return true;
  return normalized.includes("employee pf")
    || normalized.includes("provident fund")
    || normalized.includes("epf");
};

const PAYSLIP_TEMPLATE_OPTIONS = [
  {
    id: "template_1",
    name: "Template 1",
    description: "Classic header with compact summary and standard earnings/deductions table.",
  },
  {
    id: "template_2",
    name: "Template 2",
    description: "Two-tone standard layout with highlighted net pay panel.",
  },
  {
    id: "template_3",
    name: "Template 3",
    description: "Bordered standard slip with section cards and subtle accent line.",
  },
];

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `Rs. ${numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function SuperAdminPaySlip() {
  const currentCompanyId = (localStorage.getItem("companyId") || "").trim();
  const currentTenantCode = (localStorage.getItem("tenantCode") || "").trim();

  const [selectedComponents, setSelectedComponents] = useState([]);
  const [isGeneratedFormOpen, setIsGeneratedFormOpen] = useState(false);
  const [generatedFields, setGeneratedFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectionError, setSelectionError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template_1");
  const [modalStep, setModalStep] = useState("components");
  const [companyProfile, setCompanyProfile] = useState({
    legalName: "",
    address: "",
    officialEmail: "",
    phoneNumber: "",
    gstNo: "",
    logoUrl: "",
  });

  const selectedSet = useMemo(
    () => new Set(selectedComponents),
    [selectedComponents]
  );

  const getComponentEnteredValue = (component, fields = generatedFields) => {
    const rawValue = fields?.[component]?.value;
    const value = Number(rawValue || 0);
    return Number.isFinite(value) ? value : 0;
  };

  const getPfCalculatedAmount = (pfComponent, fields = generatedFields) => {
    const pfEntry = fields?.[pfComponent] || {};
    const linked = Array.isArray(pfEntry.linkedComponents) ? pfEntry.linkedComponents : [];
    const percentages =
      pfEntry.linkedPercentages && typeof pfEntry.linkedPercentages === "object"
        ? pfEntry.linkedPercentages
        : {};
  const linkedAmounts = linked
      .filter((linkedComponent) => linkedComponent !== pfComponent)
      .map((linkedComponent) => ({
        linkedComponent,
        amount: getComponentEnteredValue(linkedComponent, fields),
      }));
    if (!linkedAmounts.length) return 0;

    const hasLinkedPercentages = linked.some((linkedComponent) => {
      const pct = Number(percentages[linkedComponent] || 0);
      return Number.isFinite(pct) && pct > 0;
    });
    if (hasLinkedPercentages) {
      return linked.reduce((sum, linkedComponent) => {
        if (linkedComponent === pfComponent) return sum;
        const componentAmount = getComponentEnteredValue(linkedComponent, fields);
        const pct = Number(percentages[linkedComponent] || 0);
        if (!Number.isFinite(componentAmount) || !Number.isFinite(pct) || pct <= 0) return sum;
        return sum + (componentAmount * pct) / 100;
      }, 0);
    }
    return 0;
  };

  const getComponentCalculatedAmount = (component, fields = generatedFields) => {
    if (isEmployeePfComponent(component)) {
      return getPfCalculatedAmount(component, fields);
    }
    return getComponentEnteredValue(component, fields);
  };

  const payslipPreviewData = useMemo(() => {
    const companyName =
      companyProfile.legalName ||
      localStorage.getItem("companyLegalName") ||
      localStorage.getItem("companyName") ||
      `Company ${currentCompanyId || ""}`.trim() ||
      "Company Name";
    const companyAddress =
      companyProfile.address ||
      localStorage.getItem("companyAddress") ||
      localStorage.getItem("address") ||
      "Company Address";
    const companyEmail =
      companyProfile.officialEmail ||
      localStorage.getItem("companyOfficialEmail") ||
      localStorage.getItem("officialEmail") ||
      "info@company.com";
    const companyPhone =
      companyProfile.phoneNumber ||
      localStorage.getItem("companyPhone") ||
      localStorage.getItem("phoneNumber") ||
      "+91 XXXXX XXXXX";
    const companyGst =
      companyProfile.gstNo ||
      localStorage.getItem("companyGst") ||
      localStorage.getItem("gstNo") ||
      "GST No";

    const componentRows = selectedComponents.map((component) => {
      const rawValue = generatedFields[component]?.value;
      const mode = generatedFields[component]?.mode || "amount";
      const value = getComponentCalculatedAmount(component);
      const fieldKey = resolveFieldKey(component);
      const category = fieldKey ? FIELD_CATEGORY[fieldKey] || "earnings" : "earnings";
      return { component, mode, value, rawValue, category };
    });

    const earnings = componentRows.filter((row) => row.category !== "deductions");
    const deductions = componentRows.filter((row) => row.category === "deductions");
    const grossEarnings = earnings.reduce((sum, row) => sum + row.value, 0);
    const totalDeductions = deductions.reduce((sum, row) => sum + row.value, 0);
    const netPay = grossEarnings - totalDeductions;

    return {
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      companyGst,
      logoUrl: companyProfile.logoUrl || "",
      employeeName: "Employee Name",
      employeeId: "EMP-0001",
      payPeriod: "October 2025",
      payDate: "07/11/2025",
      earnings,
      deductions,
      grossEarnings,
      totalDeductions,
      netPay,
    };
  }, [selectedComponents, generatedFields, currentCompanyId, companyProfile]);

  const fetchCompanyConfig = async (companyId) => {
    if (!companyId) return;
    setLoadingConfig(true);
    setSelectionError("");
    setSubmitMessage("");
    try {
      const baseUrl = getApiBaseUrl();
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/api/payslip-generator/config/${companyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...getContextHeaders(),
        },
      });

      const payload = await res.json().catch(() => ({}));
      const msg = payload?.message || "";

      if (!res.ok || payload?.success === false) {
        if (msg.includes("not configured")) {
          setSelectedComponents([]);
          setGeneratedFields({});
          setSelectedTemplate("template_1");
          return;
        }
        throw new Error(msg || "Failed to load payslip generator configuration");
      }

      const components = Array.isArray(payload?.data?.components)
        ? payload.data.components
        : [];

      const nextSelected = components
        .map((item) => String(item?.component || "").trim())
        .filter(Boolean);
      const nextFields = {};
      components.forEach((item) => {
        const name = String(item?.component || "").trim();
        if (!name) return;
        nextFields[name] = {
          mode: normalizeMode(item?.mode),
          value:
            item?.value === null || item?.value === undefined
              ? ""
              : String(item.value),
          linkedComponents: Array.isArray(item?.linkedComponents) ? item.linkedComponents : [],
          linkedPercentages:
            item?.linkedPercentages && typeof item.linkedPercentages === "object"
              ? item.linkedPercentages
              : {},
        };
      });
      setSelectedComponents(nextSelected);
      setGeneratedFields(nextFields);
      setSelectedTemplate(payload?.data?.templateVariant || "template_1");
    } catch (error) {
      setSelectionError(error.message || "Failed to load existing config.");
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (currentCompanyId) {
      fetchCompanyConfig(currentCompanyId);
    } else {
      setSelectedComponents([]);
      setGeneratedFields({});
      setSelectedTemplate("template_1");
      setSelectionError("");
      setSubmitMessage("");
    }
  }, [currentCompanyId]);

  useEffect(() => {
    if (!currentCompanyId) return;

    const fetchCompanyProfile = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const authHeader = getAuthHeader();
        const res = await fetch(`${baseUrl}/api/companies/${currentCompanyId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
            ...getContextHeaders(),
          },
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload?.success === false || !payload?.data) return;

        const company = payload.data;
        setCompanyProfile({
          legalName: company?.legalName || company?.displayName || "",
          address: [company?.address, company?.city, company?.state, company?.pincode]
            .filter(Boolean)
            .join(", "),
          officialEmail: company?.officialEmail || company?.companyOfficialEmail || "",
          phoneNumber: company?.phoneNumber || company?.mobileNumber || "",
          gstNo: company?.gstNo || "",
          logoUrl: company?.logoUrl || "",
        });
      } catch {
        // Keep localStorage fallback values when profile request fails.
      }
    };

    fetchCompanyProfile();
  }, [currentCompanyId]);

  const handleToggleComponent = (component) => {
    setSelectionError("");
    setSubmitMessage("");
    setSelectedComponents((prev) =>
      prev.includes(component)
        ? prev.filter((item) => item !== component)
        : [...prev, component]
    );
  };

  const handleSaveSelection = (event) => {
    event.preventDefault();
    if (!currentCompanyId) {
      setSelectionError("Company context is missing. Please log in again.");
      return;
    }
    if (!selectedComponents.length) {
      setSelectionError("Select at least one component to continue.");
      return;
    }

    const nextFields = {};
    selectedComponents.forEach((component) => {
      nextFields[component] = generatedFields[component] || {
        mode: "amount",
        value: "",
        linkedComponents: [],
        linkedPercentages: {},
      };
    });

    setGeneratedFields(nextFields);
    setFieldErrors({});
    setSelectionError("");
    setModalStep("components");
    setIsGeneratedFormOpen(true);
  };

  const handleFieldChange = (component, key, value) => {
    setGeneratedFields((prev) => {
      return {
        ...prev,
        [component]: {
          ...prev[component],
          [key]: value,
        },
      };
    });
    setFieldErrors((prev) => ({
      ...prev,
      [component]: "",
    }));
  };

  const handleLinkedComponentToggle = (component, option) => {
    setGeneratedFields((prev) => {
      const current = Array.isArray(prev[component]?.linkedComponents)
        ? prev[component].linkedComponents
        : [];
      const currentMap =
        prev[component]?.linkedPercentages && typeof prev[component].linkedPercentages === "object"
          ? prev[component].linkedPercentages
          : {};
      const updatedLinks = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      const normalizedOption = normalize(option);
      const shouldDefaultBasicPayPct =
        !current.includes(option) &&
        (normalizedOption === "basic pay" || normalizedOption === "basic salary (basic pay)") &&
        (currentMap[option] === undefined || currentMap[option] === null || currentMap[option] === "");
      const next = {
        ...prev,
        [component]: {
          ...prev[component],
          linkedComponents: updatedLinks,
          linkedPercentages: shouldDefaultBasicPayPct
            ? { ...currentMap, [option]: "12" }
            : currentMap,
        },
      };
      return next;
    });
  };

  const handleLinkedComponentPercentageChange = (component, option, value) => {
    setGeneratedFields((prev) => {
      const currentMap =
        prev[component]?.linkedPercentages && typeof prev[component].linkedPercentages === "object"
          ? prev[component].linkedPercentages
          : {};
      const next = {
        ...prev,
        [component]: {
          ...prev[component],
          linkedPercentages: {
            ...currentMap,
            [option]: value,
          },
        },
      };
      return next;
    });
  };

  const getDisplayedAmount = (component) =>
    Number(getComponentCalculatedAmount(component) || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const validateGeneratedFields = () => {
    const nextErrors = {};
    selectedComponents.forEach((component) => {
      if (isEmployeePfComponent(component)) {
        return;
      }
      const entry = generatedFields[component];
      const rawValue = entry?.value?.toString().trim();
      const numericValue = Number(rawValue);
      if (!rawValue || Number.isNaN(numericValue)) {
        nextErrors[component] = "Enter a valid number.";
      }
    });
    return nextErrors;
  };

  const handleNextToPayslipFormat = () => {
    const nextErrors = validateGeneratedFields();
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setModalStep("format");
  };

  const handleGeneratedFormSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateGeneratedFields();

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      setSavingConfig(true);
      setSelectionError("");
      const baseUrl = getApiBaseUrl();
      const authHeader = getAuthHeader();
      const payload = {
        companyId: Number(currentCompanyId),
        tenantCode: currentTenantCode,
        templateVariant: selectedTemplate,
        components: selectedComponents.map((component) => {
          const fieldKey = resolveFieldKey(component);
          const linkedComponents = Array.isArray(generatedFields[component]?.linkedComponents)
            ? generatedFields[component].linkedComponents
            : [];
          const linkedSet = new Set(linkedComponents);
          const rawLinkedPercentages =
            generatedFields[component]?.linkedPercentages &&
            typeof generatedFields[component].linkedPercentages === "object"
              ? generatedFields[component].linkedPercentages
              : {};
          const linkedPercentages = Object.entries(rawLinkedPercentages).reduce(
            (acc, [linkedName, raw]) => {
              if (!linkedSet.has(linkedName)) return acc;
              const numeric = Number(raw);
              if (!Number.isFinite(numeric)) return acc;
              acc[linkedName] = numeric;
              return acc;
            },
            {}
          );
          return {
            component,
            mode: normalizeMode(generatedFields[component].mode),
            value: Number(generatedFields[component].value),
            fieldKey,
            category: fieldKey ? FIELD_CATEGORY[fieldKey] || null : null,
            linkedComponents,
            linkedPercentages,
          };
        }),
      };

      const res = await fetch(`${baseUrl}/api/payslip-generator/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...getContextHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text().catch(() => "");
      let response = {};
      try {
        response = responseText ? JSON.parse(responseText) : {};
      } catch {
        response = { message: responseText };
      }
      if (!res.ok || response?.success === false) {
        throw new Error(response?.message || "Failed to save configuration");
      }

      setFieldErrors({});
      setSubmitMessage("Payslip configuration saved successfully.");
      setModalStep("components");
      setIsGeneratedFormOpen(false);
    } catch (error) {
      setSelectionError(error.message || "Failed to save configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#F4F7FF] via-[#FFF7ED] to-[#F0FDFA] px-4 py-5 md:px-6">
      <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1B8F] via-[#1D4ED8] to-[#0F766E] px-6 py-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">
              Payslip Generator
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Configure salary components with a cleaner and faster workflow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Selected: {selectedComponents.length}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Company: {currentCompanyId || "N/A"}
            </span>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSaveSelection}
        className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-md backdrop-blur md:p-6"
      >
        <h2 className="mb-6 text-lg font-semibold text-slate-900 md:text-xl">
          Broad Classification
        </h2>

        {loadingConfig ? (
          <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Loading saved configuration...
          </p>
        ) : null}

        <div className="space-y-5">
          {BROAD_CLASSIFICATION.map((section, sectionIndex) => {
            const theme = SECTION_STYLES[sectionIndex % SECTION_STYLES.length];
            return (
            <fieldset
              key={section.title}
              className={`rounded-2xl border p-4 md:p-5 ${theme.card}`}
            >
              <legend className={`mb-3 px-2 text-sm font-bold md:text-base ${theme.legend}`}>
                {section.title}
              </legend>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {section.items.map((component) => {
                  const id = toId(`${section.title}-${component}`);
                  const checked = selectedSet.has(component);

                  return (
                    <div key={component}>
                      <input
                        id={id}
                        type="checkbox"
                        name="salary_components[]"
                        value={component}
                        checked={checked}
                        onChange={() => handleToggleComponent(component)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={id}
                        className={`flex min-h-[56px] cursor-pointer items-center rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 ${theme.chipChecked} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#011A8B]`}
                      >
                        {component}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )})}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-blue-200 bg-slate-50 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedComponents.length} component
                  {selectedComponents.length === 1 ? "" : "s"} selected
                </p>
                <p className="text-xs text-slate-500">
                  Save to configure values for selected payroll components.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig || loadingConfig}
                className="rounded-xl bg-[#0B3AAE] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#082D8B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingConfig ? "Saving..." : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
        {selectionError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {selectionError}
          </p>
        ) : null}
        {submitMessage ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {submitMessage}
          </p>
        ) : null}
      </form>

      {isGeneratedFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
          </div>
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-[0_30px_80px_-25px_rgba(15,23,42,0.6)] ring-1 ring-blue-100/70 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                {modalStep === "components" ? "Component Values" : "Payslip Format"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsGeneratedFormOpen(false);
                  setModalStep("components");
                  setFieldErrors({});
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleGeneratedFormSubmit}>
              {modalStep === "components" ? (
                <>
                  <div className="space-y-4">
	                    {selectedComponents.map((component) => (
	                      <div
	                        key={component}
	                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
	                      >
                        <label className="mb-3 block text-sm font-semibold text-slate-800">
                          {component}
                        </label>
	                        <div
	                          className={`grid grid-cols-1 gap-3 ${
	                            isEmployeePfComponent(component) ? "" : "md:grid-cols-2"
	                          }`}
	                        >
	                          <select
	                            value={generatedFields[component]?.mode || "amount"}
	                            onChange={(event) =>
	                              handleFieldChange(component, "mode", event.target.value)
	                            }
	                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
	                          >
	                            <option value="amount">Amount</option>
	                            <option value="percentage">Percentage</option>
	                          </select>
	                          {!isEmployeePfComponent(component) ? (
	                            <input
	                              type="number"
	                              step="any"
	                              value={generatedFields[component]?.value ?? ""}
	                              onChange={(event) =>
	                                handleFieldChange(component, "value", event.target.value)
	                              }
	                              placeholder={
	                                generatedFields[component]?.mode === "percentage"
	                                  ? "Enter 0 to 100"
	                                  : "Enter amount"
	                              }
	                              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
	                            />
	                          ) : null}
	                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          Calculated Amount: {getDisplayedAmount(component)}
                        </p>
                        {fieldErrors[component] ? (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            {fieldErrors[component]}
                          </p>
                        ) : null}

                        {isEmployeePfComponent(component) ? (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <p className="mb-2 text-xs font-semibold text-blue-800">
                              Select Components for Employee PF
                            </p>
                            <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                              {selectedComponents
                                .filter((option) => option !== component)
                                .map((option) => {
                                const checked = Array.isArray(generatedFields[component]?.linkedComponents)
                                  ? generatedFields[component].linkedComponents.includes(option)
                                  : false;
                                const pctValue =
                                  generatedFields[component]?.linkedPercentages &&
                                  typeof generatedFields[component].linkedPercentages === "object"
                                    ? generatedFields[component].linkedPercentages[option] ?? ""
                                    : "";
                                return (
                                  <label
                                    key={`${component}-${option}-pf-link`}
                                    className="flex items-center gap-2 rounded-md bg-white px-2 py-1 text-xs text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleLinkedComponentToggle(component, option)}
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="min-w-0 flex-1 truncate">{option}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={pctValue}
                                      onChange={(event) =>
                                        handleLinkedComponentPercentageChange(
                                          component,
                                          option,
                                          event.target.value
                                        )
                                      }
                                      disabled={!checked}
                                      placeholder="%"
                                      className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

	                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGeneratedFormOpen(false);
                        setModalStep("components");
                        setFieldErrors({});
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
	                    <button
	                      type="button"
	                      onClick={handleNextToPayslipFormat}
                      className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
                    >
                      Next
	                    </button>
	                  </div>
	                  {selectionError ? (
	                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
	                      {selectionError}
	                    </p>
	                  ) : null}
	                </>
	              ) : (
	                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-800">Select Payslip Template</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {PAYSLIP_TEMPLATE_OPTIONS.map((template) => {
                        const active = selectedTemplate === template.id;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`rounded-xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-800"}`}>
                              {template.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">{template.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Payslip Format Page (All 3 Formats)
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      All templates are displayed below. Click any format to select it.
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                      {PAYSLIP_TEMPLATE_OPTIONS.map((template, index) => {
                        const active = selectedTemplate === template.id;
                        return (
                          <button
                            key={`preview-${template.id}`}
                            type="button"
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`rounded-xl border bg-white p-3 text-left transition ${
                              active
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`rounded-lg border p-2 text-[10px] ${
                                index === 0
                                  ? "border-slate-200 bg-slate-50"
                                  : index === 1
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-indigo-200 bg-indigo-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1">
                                <div className="flex min-w-0 items-start gap-2">
                                  {payslipPreviewData.logoUrl ? (
                                    <img
                                      src={payslipPreviewData.logoUrl}
                                      alt="Company Logo"
                                      className="h-7 w-7 flex-shrink-0 rounded border border-slate-200 bg-white object-contain"
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-[9px] font-bold text-slate-600">
                                      {String(payslipPreviewData.companyName || "CO")
                                        .trim()
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-800">{payslipPreviewData.companyName}</p>
                                    <p className="truncate text-slate-600">{payslipPreviewData.companyAddress}</p>
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-700">{payslipPreviewData.payPeriod}</span>
                              </div>

                              <div className="mt-1 text-slate-600">
                                <p>{payslipPreviewData.companyEmail}</p>
                                <p>{payslipPreviewData.companyPhone} | {payslipPreviewData.companyGst}</p>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-1 rounded border border-slate-200 bg-white p-1.5 text-slate-700">
                                <p><span className="font-semibold">Emp:</span> {payslipPreviewData.employeeName}</p>
                                <p><span className="font-semibold">ID:</span> {payslipPreviewData.employeeId}</p>
                                <p><span className="font-semibold">Period:</span> {payslipPreviewData.payPeriod}</p>
                                <p><span className="font-semibold">Date:</span> {payslipPreviewData.payDate}</p>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-1">
                                <div className="rounded border border-slate-200 bg-white p-1.5">
                                  <p className="font-semibold text-slate-700">Earnings</p>
                                  <div className="mt-1 max-h-20 overflow-y-auto text-slate-600">
                                    {payslipPreviewData.earnings.length ? (
                                      payslipPreviewData.earnings.map((item) => (
                                        <p key={`${template.id}-e-${item.component}`} className="flex justify-between gap-2">
                                          <span className="truncate">{item.component}</span>
                                          <span>{item.mode === "percentage" ? `${item.value}%` : formatCurrency(item.value)}</span>
                                        </p>
                                      ))
                                    ) : (
                                      <p>No earnings selected</p>
                                    )}
                                  </div>
                                </div>
                                <div className="rounded border border-slate-200 bg-white p-1.5">
                                  <p className="font-semibold text-slate-700">Deductions</p>
                                  <div className="mt-1 max-h-20 overflow-y-auto text-slate-600">
                                    {payslipPreviewData.deductions.length ? (
                                      payslipPreviewData.deductions.map((item) => (
                                        <p key={`${template.id}-d-${item.component}`} className="flex justify-between gap-2">
                                          <span className="truncate">{item.component}</span>
                                          <span>{item.mode === "percentage" ? `${item.value}%` : formatCurrency(item.value)}</span>
                                        </p>
                                      ))
                                    ) : (
                                      <p>No deductions selected</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 p-1.5 text-slate-700">
                                <p className="flex justify-between"><span>Gross Earnings</span><span>{formatCurrency(payslipPreviewData.grossEarnings)}</span></p>
                                <p className="flex justify-between"><span>Total Deductions</span><span>{formatCurrency(payslipPreviewData.totalDeductions)}</span></p>
                                <p className="mt-1 flex justify-between font-bold text-emerald-700"><span>Net Pay</span><span>{formatCurrency(payslipPreviewData.netPay)}</span></p>
                              </div>
                            </div>

                            <p className="mt-2 text-sm font-semibold text-slate-800">{template.name}</p>
                            <p className="mt-1 text-xs text-slate-600">{template.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

	                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep("components")}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Back
                    </button>
	                    <button
	                      type="submit"
	                      disabled={savingConfig}
                      className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingConfig ? "Submitting..." : "Submit"}
	                    </button>
	                  </div>
	                  {selectionError ? (
	                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
	                      {selectionError}
	                    </p>
	                  ) : null}
	                </>
	              )}
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
