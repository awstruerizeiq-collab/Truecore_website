import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PTTable from "../../../components/finance/PTTable";

const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthKeyToLabel = (monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });
};

const sampleComplianceData = [
    {
        employeeId: "EMP001",
        employeeName: "Aarav Sharma",
        department: "Engineering",
        pfAmount: 2500,
        tdsAmount: 5400,
        ptAmount: 1800,
        netSalary: 45000,
        complianceStatus: "Completed",
        month: "January 2026",
    },
    {
        employeeId: "EMP002",
        employeeName: "Nisha Verma",
        department: "Operations",
        pfAmount: 2200,
        tdsAmount: 3900,
        ptAmount: 2000,
        netSalary: 42000,
        complianceStatus: "Completed",
        month: "January 2026",
    },
    {
        employeeId: "EMP003",
        employeeName: "Rohan Patel",
        department: "Sales",
        pfAmount: 2600,
        tdsAmount: 4600,
        ptAmount: 2200,
        netSalary: 47000,
        complianceStatus: "Completed",
        month: "January 2026",
    },
    {
        employeeId: "EMP004",
        employeeName: "Priya Iyer",
        department: "Finance",
        pfAmount: 2400,
        tdsAmount: 5100,
        ptAmount: 1900,
        netSalary: 44000,
        complianceStatus: "Pending",
        month: "January 2026",
    },
    {
        employeeId: "EMP005",
        employeeName: "Karthik Rao",
        department: "Product",
        pfAmount: 2780,
        tdsAmount: 6200,
        ptAmount: 2100,
        netSalary: 52000,
        complianceStatus: "Completed",
        month: "December 2025",
    },
    {
        employeeId: "EMP006",
        employeeName: "Sneha Menon",
        department: "HR",
        pfAmount: 2050,
        tdsAmount: 3500,
        ptAmount: 1750,
        netSalary: 40000,
        complianceStatus: "Completed",
        month: "December 2025",
    },
    {
        employeeId: "EMP007",
        employeeName: "Dev Khanna",
        department: "Engineering",
        pfAmount: 2900,
        tdsAmount: 6800,
        ptAmount: 2300,
        netSalary: 56000,
        complianceStatus: "Pending",
        month: "November 2025",
    },
    {
        employeeId: "EMP008",
        employeeName: "Meera Joshi",
        department: "Marketing",
        pfAmount: 2140,
        tdsAmount: 3700,
        ptAmount: 1850,
        netSalary: 41000,
        complianceStatus: "Completed",
        month: "October 2025",
    },
];

const pageSize = 4;

const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

const StatCard = ({ title, value }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-[#011A8B]">{value}</p>
    </div>
);

const ReportsList = ({ title, items }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#011A8B]">{title}</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {items.map((item) => (
                <li key={item} className="rounded-lg bg-[#F6F8FF] px-3 py-2">
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

const ComplianceTable = ({ title, rows, amountKey, currentPage, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const currentRows = rows.slice(start, start + pageSize);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[#011A8B]">{title}</h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-[#EEF2FF]">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Employee ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Employee Name</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Department</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {currentRows.length > 0 ? (
                            currentRows.map((row) => (
                                <tr key={`${title}-${row.employeeId}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{row.employeeId}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.employeeName}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.department}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatInr(row[amountKey])}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#011A8B] px-3 py-2 text-xs font-medium text-white hover:bg-[#02105f]"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    No records for selected payroll period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Page {Math.min(currentPage, totalPages)} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-2 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-2 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const buildWorkbookBuffer = (sheetConfigs) => {
    const workbook = XLSX.utils.book_new();
    sheetConfigs.forEach(({ name, data }) => {
        const sheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, sheet, name);
    });
    return XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
};

export default function Compliance() {
    const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey());
    const [pfPage, setPfPage] = useState(1);
    const [tdsPage, setTdsPage] = useState(1);
    const [complianceData] = useState(sampleComplianceData);
    const [downloadState, setDownloadState] = useState(null); // 'report' | 'all' | null

    const selectedMonthLabel = useMemo(() => monthKeyToLabel(selectedMonthKey), [selectedMonthKey]);

    const filteredRows = useMemo(
        () => complianceData.filter((row) => row.month === selectedMonthLabel),
        [complianceData, selectedMonthLabel]
    );

    const totals = useMemo(
        () =>
            filteredRows.reduce(
                (acc, row) => {
                    acc.pf += row.pfAmount;
                    acc.tds += row.tdsAmount;
                    acc.pt += row.ptAmount;
                    return acc;
                },
                { pf: 0, tds: 0, pt: 0 }
            ),
        [filteredRows]
    );

    const hasAnyData = complianceData.length > 0;
    const hasFilteredData = filteredRows.length > 0;
    const isGenerating = downloadState !== null;

    const downloadExcel = (buffer, fileName) => {
        const fileBlob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(fileBlob, fileName);
    };

    const handleDownloadReport = () => {
        if (!hasFilteredData || isGenerating) return;
        setDownloadState("report");
        setTimeout(() => {
            const reportData = filteredRows.map((row) => ({
                "Employee Name": row.employeeName,
                "Employee ID": row.employeeId,
                Department: row.department,
                "PF Contribution": row.pfAmount,
                "TDS Deduction": row.tdsAmount,
                "Net Salary": row.netSalary,
                "Compliance Status": row.complianceStatus,
                Month: row.month,
            }));
            const buffer = buildWorkbookBuffer([{ name: "Compliance Report", data: reportData }]);
            downloadExcel(buffer, `compliance-report-${selectedMonthKey}.xlsx`);
            setDownloadState(null);
        }, 50);
    };

    const handleDownloadAll = () => {
        if (!hasAnyData || isGenerating) return;
        setDownloadState("all");
        setTimeout(() => {
            const sheets = [
                {
                    name: "Name",
                    data: complianceData.map((row) => ({ "Employee Name": row.employeeName })),
                },
                {
                    name: "Employee ID",
                    data: complianceData.map((row) => ({ "Employee ID": row.employeeId })),
                },
                {
                    name: "PF Data",
                    data: complianceData.map((row) => ({
                        "Employee ID": row.employeeId,
                        "Employee Name": row.employeeName,
                        "PF Contribution": row.pfAmount,
                        Month: row.month,
                    })),
                },
                {
                    name: "TDS Data",
                    data: complianceData.map((row) => ({
                        "Employee ID": row.employeeId,
                        "Employee Name": row.employeeName,
                        "TDS Deduction": row.tdsAmount,
                        Month: row.month,
                    })),
                },
            ];
            const buffer = buildWorkbookBuffer(sheets);
            downloadExcel(buffer, "compliance-all-data.xlsx");
            setDownloadState(null);
        }, 50);
    };

    return (
        <div className="min-h-screen bg-[#F9FAFF] p-4 md:p-6">
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mt-1 text-2xl font-bold text-[#011A8B]">Compliance</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div>
                            <input
                                type="month"
                                value={selectedMonthKey}
                                onChange={(event) => {
                                    setSelectedMonthKey(event.target.value);
                                    setPfPage(1);
                                    setTdsPage(1);
                                }}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#011A8B] focus:outline-none"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleDownloadReport}
                            disabled={!hasFilteredData || isGenerating}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {downloadState === "report" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {downloadState === "report" ? "Generating..." : "Download Report"}
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadAll}
                            disabled={!hasAnyData || isGenerating}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#011A8B] px-4 py-2 text-sm font-medium text-white hover:bg-[#02105f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {downloadState === "all" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {downloadState === "all" ? "Generating..." : "Download All"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total PF" value={formatInr(totals.pf)} />
                <StatCard title="Total TDS" value={formatInr(totals.tds)} />
                <StatCard title="Total PT" value={formatInr(totals.pt)} />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-4">
                <div className="space-y-5 xl:col-span-3">
                    <ComplianceTable
                        title="Provident Fund Table"
                        rows={filteredRows}
                        amountKey="pfAmount"
                        currentPage={pfPage}
                        onPageChange={setPfPage}
                    />
                    <ComplianceTable
                        title="TDS Table"
                        rows={filteredRows}
                        amountKey="tdsAmount"
                        currentPage={tdsPage}
                        onPageChange={setTdsPage}
                    />
                    <PTTable rows={filteredRows} onDownloadReport={handleDownloadReport} disableDownload={!hasFilteredData || isGenerating} />
                </div>

                <aside className="space-y-4 xl:col-span-1">
                    <ReportsList
                        title="PF Reports"
                        items={["PF Monthly Summary", "PF Employee Register", "PF Challan Status"]}
                    />
                    <ReportsList
                        title="TDS Reports"
                        items={["TDS Deduction Sheet", "Quarterly TDS Snapshot", "PAN Validation Status"]}
                    />
                    <ReportsList
                        title="PT Reports"
                        items={["PT State Summary", "PT Employee Ledger", "PT Payment Status"]}
                    />

                    <button
                        type="button"
                        onClick={handleDownloadReport}
                        disabled={!hasFilteredData || isGenerating}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {downloadState === "report" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                        {downloadState === "report" ? "Generating..." : "Download PF.xlsx"}
                    </button>
                </aside>
            </div>
        </div>
    );
}