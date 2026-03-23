import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Download, FileCog, RefreshCw } from "lucide-react";
import FinanceModuleShell from "./FinanceModuleShell";
import {
  fetchPayslipRecords,
  fetchPayslipTemplateContext,
  fetchPayrollById,
  generatePayslip,
  generatePayslipBulk,
} from "../services/payslipManagementService";
import {
  downloadPayslipWithTemplate,
  previewPayslipWithTemplate,
} from "../services/payslipPdfTemplateService";

const formatMonth = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PayslipManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [templateContext, setTemplateContext] = useState({
    company: {},
    templateVariant: "template_1",
  });

  const loadTemplateContext = useCallback(async () => {
    try {
      const context = await fetchPayslipTemplateContext();
      setTemplateContext({
        company: context?.company || {},
        templateVariant: context?.templateVariant || "template_1",
      });
    } catch (err) {
      setError(err?.message || "Failed to load payslip template context");
    }
  }, []);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchPayslipRecords({ search, month });
      setRows(data);
      setSelected(new Set());
    } catch (err) {
      setRows([]);
      setError(err?.message || "Failed to load payslip records");
    } finally {
      setLoading(false);
    }
  }, [search, month]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadTemplateContext();
  }, [loadTemplateContext]);

  const selectedCount = selected.size;

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selected.has(row.payrollId)),
    [rows, selected]
  );

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((row) => row.payrollId)));
  };

  const handleToggleSelect = (payrollId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(payrollId)) next.delete(payrollId);
      else next.add(payrollId);
      return next;
    });
  };

  const handleGenerateOne = async (payrollId) => {
    try {
      setBusyId(payrollId);
      await generatePayslip(payrollId);
      await loadRows();
    } catch (err) {
      setError(err?.message || "Failed to generate payslip");
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateSelected = async () => {
    if (!selectedCount) return;
    try {
      setLoading(true);
      setError("");
      await generatePayslipBulk(Array.from(selected));
      await loadRows();
    } catch (err) {
      setError(err?.message || "Failed to generate selected payslips");
      setLoading(false);
    }
  };

  const handlePreview = async (payrollId) => {
    try {
      const payroll = await fetchPayrollById(payrollId);
      await previewPayslipWithTemplate({
        payroll,
        company: templateContext.company,
        templateVariant: templateContext.templateVariant,
      });
    } catch (err) {
      setError(err?.message || "Failed to preview payslip");
    }
  };

  const handleDownload = async (row) => {
    try {
      const payroll = await fetchPayrollById(row.payrollId);
      const fileName = `payslip_${row.employeeId || row.payrollId}_${row.payrollMonth || ""}.pdf`;
      await downloadPayslipWithTemplate({
        payroll,
        company: templateContext.company,
        templateVariant: templateContext.templateVariant,
        fileName,
      });
    } catch (err) {
      setError(err?.message || "Failed to download payslip");
    }
  };

  return (
    <FinanceModuleShell
      title="Payslip Management"
      description="Generate, preview, and manage employee payslips."
      allowedRoles={["CEO", "ADMIN", "MANAGER"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-black">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee ID or name"
            className="min-w-[240px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input  
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={loadRows}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleGenerateSelected}
            disabled={!selectedCount || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <FileCog size={16} />
            Generate Selected ({selectedCount})
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 text-black">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={handleToggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Employee Name</th>
                <th className="px-4 py-3 text-left">Payroll Month</th>
                <th className="px-4 py-3 text-left">Net Salary</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payslip</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading payslip records...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.payrollId} className="border-t border-slate-100 ">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.payrollId)}
                        onChange={() => handleToggleSelect(row.payrollId)}
                      />
                    </td>
                    <td className="px-4 py-3">{row.employeeId || "-"}</td>
                    <td className="px-4 py-3">{row.employeeName || "-"}</td>
                    <td className="px-4 py-3">{formatMonth(row.payrollMonth)}</td>
                    <td className="px-4 py-3">Rs. {formatMoney(row.netSalary)}</td>
                    <td className="px-4 py-3">{row.payrollStatus || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          row.payslipGenerated
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.payslipGenerated ? "Generated" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateOne(row.payrollId)}
                          disabled={busyId === row.payrollId}
                          className="rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {busyId === row.payrollId ? "Generating..." : "Generate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreview(row.payrollId)}
                          disabled={!row.payslipGenerated}
                          className="rounded-md border border-slate-300 p-1 text-slate-700 disabled:opacity-40"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(row)}
                          disabled={!row.payslipGenerated}
                          className="rounded-md border border-slate-300 p-1 text-slate-700 disabled:opacity-40"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FinanceModuleShell>
  );
}
