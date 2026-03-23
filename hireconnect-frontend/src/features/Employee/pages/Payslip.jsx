import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL?.trim() ||
  import.meta.env?.APP_BASE_URL?.trim() ||
  ""
)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const getAuthHeader = () => {
  const raw =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (!raw) return "";
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};

const getCompanyIdFromContext = () => {
  const fromStorage =
    localStorage.getItem("companyId") ||
    localStorage.getItem("company_id") ||
    localStorage.getItem("COMPANY_ID") ||
    sessionStorage.getItem("companyId") ||
    sessionStorage.getItem("company_id") ||
    sessionStorage.getItem("COMPANY_ID");
  if (fromStorage && String(fromStorage).trim()) return String(fromStorage).trim();

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.companyId || user?.company_id || "").trim();
  } catch {
    return "";
  }
};

const formatMoney = (num) => `Rs. ${Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatMoneyUi = (num) => `Rs. ${Number(num || 0).toLocaleString("en-IN")}`;

const getUserId = () => {
  const raw = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed || raw;
  } catch {
    return raw;
  }
};

const fetchImageAsDataUrl = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const normalizeCompany = (companyRaw) => {
  const addressParts = [
    companyRaw?.address,
    companyRaw?.city,
    companyRaw?.state,
    companyRaw?.country,
    companyRaw?.pincode,
  ].filter(Boolean);

  const contactLineParts = [
    companyRaw?.website,
    companyRaw?.officialEmail || companyRaw?.companyOfficialEmail || companyRaw?.adminEmail,
    companyRaw?.phoneNumber || companyRaw?.mobileNumber,
    companyRaw?.gstNo ? `GST: ${companyRaw.gstNo}` : "",
  ].filter(Boolean);

  return {
    name: companyRaw?.legalName || companyRaw?.displayName || "Company",
    address: addressParts.join(", "),
    email: companyRaw?.officialEmail || companyRaw?.companyOfficialEmail || companyRaw?.adminEmail || "",
    phone: companyRaw?.phoneNumber || companyRaw?.mobileNumber || "",
    gstNo: companyRaw?.gstNo || "",
    website: companyRaw?.website || "",
    logoUrl: companyRaw?.logoUrl || "",
    contactLine: contactLineParts.join(" | "),
  };
};

const getPayslipData = (payroll, company) => {
  const employeeName = payroll?.employeeName || payroll?.userName || "N/A";
  const employeeId = payroll?.employeeId || "N/A";
  const month = payroll?.payrollMonth || payroll?.payPeriod || "N/A";
  const payDate = payroll?.payDate || payroll?.paymentDate || payroll?.payrollMonth || "N/A";
  const joiningDate = payroll?.joiningDate
    ? new Date(payroll.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "N/A";

  const earnings = [
    { label: "Basic", value: Number(payroll?.basicSalary || 0) },
    { label: "House Rent Allowance", value: Number(payroll?.hra || 0) },
    { label: "Conveyance", value: Number(payroll?.conveyanceAllowance || 0) },
    { label: "Medical Allowance", value: Number(payroll?.medicalAllowance || 0) },
    { label: "Special Allowance", value: Number(payroll?.otherAllowances || 0) },
  ];
  const deductions = [
    { label: "Income Tax", value: Number(payroll?.taxDeductions || 0) },
    { label: "Provident Fund", value: Number(payroll?.pfEmployee || 0) },
    { label: "Professional Tax", value: Number(payroll?.professionalTax || 0) },
    { label: "Medical Insurance", value: Number(payroll?.medicalInsurance || 0) },
  ];

  const totalEarnings = Number(payroll?.totalEarnings ?? earnings.reduce((sum, item) => sum + item.value, 0));
  const totalDeductions = Number(payroll?.totalDeductions ?? deductions.reduce((sum, item) => sum + item.value, 0));
  const netSalary = Number(payroll?.netSalary ?? totalEarnings - totalDeductions);

  return {
    company,
    employee: {
      name: employeeName,
      id: employeeId,
      month,
      payDate,
      joiningDate,
      payPeriod: payroll?.payPeriod || month,
    },
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,
  };
};

const drawCommonPayslipBody = (doc, data, styles, startY) => {
  const pageWidth = doc.internal.pageSize.width;

  doc.setDrawColor(220, 224, 235);
  doc.line(40, startY, pageWidth - 40, startY);

  const summaryY = startY + 18;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(68, 68, 68);
  doc.setFontSize(11);
  doc.text("EMPLOYEE SUMMARY", 50, summaryY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const summaryRows = [
    ["Employee Name", data.employee.name],
    ["Employee ID", data.employee.id],
    ["Joining Date", data.employee.joiningDate],
    ["Pay Period", data.employee.payPeriod],
    ["Pay Date", data.employee.payDate],
  ];
  let rowY = summaryY + 16;
  summaryRows.forEach(([label, value]) => {
    doc.text(`${label}`, 60, rowY);
    doc.text(`: ${value}`, 175, rowY);
    rowY += 14;
  });

  doc.setFillColor(styles.netPayPanel[0], styles.netPayPanel[1], styles.netPayPanel[2]);
  doc.roundedRect(pageWidth - 220, summaryY + 4, 170, 74, 8, 8, "F");
  doc.setTextColor(styles.accent[0], styles.accent[1], styles.accent[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(formatMoney(data.netSalary), pageWidth - 208, summaryY + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Total Net Pay", pageWidth - 206, summaryY + 56);

  const tableStartY = summaryY + 100;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 40, right: pageWidth / 2 + 12 },
    theme: "grid",
    head: [["EARNINGS", "AMOUNT"]],
    body: [
      ...data.earnings.map((item) => [item.label, formatMoney(item.value)]),
      ["Gross Earnings", formatMoney(data.totalEarnings)],
    ],
    styles: { fontSize: 10, textColor: [45, 45, 45] },
    headStyles: {
      fillColor: [styles.tableHeader[0], styles.tableHeader[1], styles.tableHeader[2]],
      textColor: [255, 255, 255],
    },
    columnStyles: { 1: { halign: "right" } },
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: pageWidth / 2 + 12, right: 40 },
    theme: "grid",
    head: [["DEDUCTIONS", "AMOUNT"]],
    body: [
      ...data.deductions.map((item) => [item.label, formatMoney(item.value)]),
      ["Total Deductions", formatMoney(data.totalDeductions)],
    ],
    styles: { fontSize: 10, textColor: [45, 45, 45] },
    headStyles: {
      fillColor: [styles.tableHeader[0], styles.tableHeader[1], styles.tableHeader[2]],
      textColor: [255, 255, 255],
    },
    columnStyles: { 1: { halign: "right" } },
  });

  const finalTableY = (doc.lastAutoTable?.finalY || tableStartY + 100) + 20;

  doc.setDrawColor(220, 224, 235);
  doc.roundedRect(40, finalTableY, pageWidth - 80, 44, 6, 6, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text("TOTAL NET PAYABLE", 52, finalTableY + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Gross Earnings - Total Deductions", 52, finalTableY + 33);

  doc.setFillColor(styles.netPayPanel[0], styles.netPayPanel[1], styles.netPayPanel[2]);
  doc.roundedRect(pageWidth - 200, finalTableY + 1, 160, 42, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(styles.accent[0], styles.accent[1], styles.accent[2]);
  doc.text(formatMoney(data.netSalary), pageWidth - 188, finalTableY + 26);

  const footerY = finalTableY + 65;
  doc.setDrawColor(220, 224, 235);
  doc.line(40, footerY, pageWidth - 40, footerY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("This is a system-generated document.", pageWidth / 2, footerY + 18, { align: "center" });
};

const renderTemplate1 = (doc, data, logoDataUrl) => {
  const pageWidth = doc.internal.pageSize.width;
  const leftX = logoDataUrl ? 120 : 40;
  const rightBlockRightX = pageWidth - 40;
  const rightBlockLeftX = pageWidth - 200;
  const companyMaxWidth = Math.max(160, rightBlockLeftX - leftX - 16);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 40, 18, 70, 55);
  }

  const companyNameLines = doc
    .splitTextToSize(data.company.name || "Company", companyMaxWidth)
    .slice(0, 2);
  const companyAddressLines = doc
    .splitTextToSize(data.company.address || "-", companyMaxWidth)
    .slice(0, 2);
  const companyContactLines = doc
    .splitTextToSize(data.company.contactLine || "-", companyMaxWidth)
    .slice(0, 1);

  let contentY = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 36, 86);
  doc.text(companyNameLines, leftX, contentY);
  contentY += companyNameLines.length * 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(companyAddressLines, leftX, contentY);
  contentY += companyAddressLines.length * 12;
  doc.text(companyContactLines, leftX, contentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text("Payslip For the Month", rightBlockRightX, 34, { align: "right" });
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(String(data.employee.month), rightBlockRightX, 52, { align: "right" });

  const bodyStartY = Math.max(92, contentY + 18);

  drawCommonPayslipBody(
    doc,
    data,
    {
      accent: [16, 103, 66],
      tableHeader: [19, 84, 122],
      netPayPanel: [234, 245, 238],
    },
    bodyStartY
  );
};

const renderTemplate2 = (doc, data, logoDataUrl) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFillColor(16, 65, 117);
  doc.rect(0, 0, pageWidth, 56, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 40, 9, 48, 38);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(data.company.name || "Company", 96, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Payslip For the Month", pageWidth - 160, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(String(data.employee.month), pageWidth - 160, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(66, 66, 66);
  doc.text(data.company.address || "-", 40, 72, { maxWidth: pageWidth - 80 });
  doc.text(data.company.contactLine || "-", 40, 85, { maxWidth: pageWidth - 80 });

  drawCommonPayslipBody(
    doc,
    data,
    {
      accent: [16, 65, 117],
      tableHeader: [3, 105, 161],
      netPayPanel: [232, 242, 252],
    },
    100
  );
};

const renderTemplate3 = (doc, data, logoDataUrl) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setDrawColor(196, 207, 223);
  doc.roundedRect(30, 18, pageWidth - 60, 74, 8, 8, "S");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 42, 30, 44, 42);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(26, 32, 44);
  doc.text(data.company.name || "Company", 95, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text(data.company.address || "-", 95, 56, { maxWidth: pageWidth - 250 });
  doc.text(data.company.contactLine || "-", 95, 69, { maxWidth: pageWidth - 250 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(86, 86, 86);
  doc.text("PAYSLIP MONTH", pageWidth - 165, 45);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(String(data.employee.month), pageWidth - 165, 61);
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2);
  doc.line(pageWidth - 170, 67, pageWidth - 90, 67);

  drawCommonPayslipBody(
    doc,
    data,
    {
      accent: [79, 70, 229],
      tableHeader: [71, 85, 105],
      netPayPanel: [238, 242, 255],
    },
    106
  );
};

export default function Payslip() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [company, setCompany] = useState(normalizeCompany({}));
  const [templateVariant, setTemplateVariant] = useState("template_1");
  const [resolvedUserId, setResolvedUserId] = useState(() => getUserId());
  const [resolvedCompanyId, setResolvedCompanyId] = useState(() => getCompanyIdFromContext());

  useEffect(() => {
    let cancelled = false;
    const authHeader = getAuthHeader();

    const resolveContext = async () => {
      if (resolvedUserId && resolvedCompanyId) return;
      if (!authHeader) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const me = data?.data || {};
        const uid = me?.id || me?.userId || resolvedUserId;
        const cid = me?.companyId || resolvedCompanyId;
        if (uid) {
          setResolvedUserId(uid);
          localStorage.setItem("userId", String(uid));
        }
        if (cid) {
          setResolvedCompanyId(String(cid));
          localStorage.setItem("companyId", String(cid));
        }
      } catch {
        // keep existing local context if profile lookup fails
      }
    };

    resolveContext();
    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, resolvedCompanyId]);

  useEffect(() => {
    if (!resolvedUserId || !resolvedCompanyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const authHeader = getAuthHeader();

    const fetchPayrolls = async () => {
      try {
        setError("");
        const res = await fetch(`${API_BASE_URL}/api/payroll/user/${resolvedUserId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
            ...(resolvedCompanyId ? { "X-Company-Id": String(resolvedCompanyId) } : {}),
          },
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(data?.message || "Unable to load payslip data.");
        }
        if (cancelled) return;
        setPayrolls(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) {
          setPayrolls([]);
          setError(e?.message || "Unable to load payslip data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPayrolls();
    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, resolvedCompanyId]);

  useEffect(() => {
    if (!resolvedCompanyId) return;

    let cancelled = false;
    const authHeader = getAuthHeader();

    const loadCompanyAndTemplate = async () => {
      try {
        const companyRes = await fetch(`${API_BASE_URL}/api/companies/${resolvedCompanyId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });
        const companyPayload = await companyRes.json().catch(() => ({}));
        if (!cancelled && companyRes.ok && companyPayload?.data) {
          setCompany(normalizeCompany(companyPayload.data));
        }
      } catch {
        // Keep fallback company object if request fails.
      }

      try {
        const templateRes = await fetch(`${API_BASE_URL}/api/payslip-generator/config/${resolvedCompanyId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });
        const templatePayload = await templateRes.json().catch(() => ({}));
        if (!cancelled && templateRes.ok) {
          const variant = String(templatePayload?.data?.templateVariant || "template_1").toLowerCase();
          if (["template_1", "template_2", "template_3"].includes(variant)) {
            setTemplateVariant(variant);
          } else {
            setTemplateVariant("template_1");
          }
        }
      } catch {
        setTemplateVariant("template_1");
      }
    };

    loadCompanyAndTemplate();
    return () => {
      cancelled = true;
    };
  }, [resolvedCompanyId]);

  const downloadPDF = async (payroll) => {
    const doc = new jsPDF("p", "pt", "a4");
    const data = getPayslipData(payroll, company);
    const logoData = await fetchImageAsDataUrl(data.company.logoUrl);

    if (templateVariant === "template_2") {
      renderTemplate2(doc, data, logoData);
    } else if (templateVariant === "template_3") {
      renderTemplate3(doc, data, logoData);
    } else {
      renderTemplate1(doc, data, logoData);
    }

    doc.save(`Payslip_${data.employee.name}_${String(data.employee.month).replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="w-full p-6">
      <h2 className="mb-4 text-xl font-semibold text-[#011A8B]">Payslip</h2>

      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Active Template: {templateVariant.replace("template_", "Template ")} | Company: {company.name || "Company"}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="p-8 text-sm text-gray-600">Loading payroll data...</div>
        ) : !resolvedUserId ? (
          <div className="p-8 text-sm text-red-600">User context missing. Please login again.</div>
        ) : !resolvedCompanyId ? (
          <div className="p-8 text-sm text-red-600">Company context missing. Please login again.</div>
        ) : error ? (
          <div className="p-8 text-sm text-red-600">{error}</div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-sm text-gray-600">No payroll data found for your account yet.</div>
        ) : (
        <table className="min-w-full bg-white">
          <thead className="bg-[#F3F4FF] text-sm font-semibold text-[#011A8B]">
            <tr>
              <th className="px-4 py-3 text-left">Employee Name</th>
              <th className="px-4 py-3 text-left">Employee ID</th>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Net Salary</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {payrolls.map((record) => {
              const netSalary = Number(record?.totalEarnings || 0) - Number(record?.totalDeductions || 0);
              return (
                <tr key={record.id} className="border-t transition hover:bg-gray-50">
                  <td className="px-4 py-3">{record.employeeName || record.userName || "N/A"}</td>
                  <td className="px-4 py-3">{record.employeeId || "N/A"}</td>
                  <td className="px-4 py-3">{record.payrollMonth || "N/A"}</td>
                  <td className="px-4 py-3">{record.source || "Payroll System"}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoneyUi(netSalary)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => downloadPDF(record)} className="transition hover:text-[#011A8B]" title="Download Payslip">
                      <Download size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
