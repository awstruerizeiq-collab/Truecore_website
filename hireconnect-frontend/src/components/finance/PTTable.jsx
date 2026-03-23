import React, { useMemo } from "react";
import { Download } from "lucide-react";

const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

export default function PTTable({ rows, onDownloadReport, disableDownload }) {
    const groupedByDepartment = useMemo(() => {
        const map = new Map();
        rows.forEach((row) => {
            const amount = map.get(row.department) || 0;
            map.set(row.department, amount + (row.ptAmount ?? 0));
        });
        return Array.from(map.entries()).map(([department, total]) => ({
            department,
            total,
        }));
    }, [rows]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[#011A8B]">Professional Tax Summary</h3>
                <button
                    onClick={onDownloadReport}
                    disabled={disableDownload}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Download size={14} />
                    Download
                </button>
            </div>

            {groupedByDepartment.length ? (
                <div className="space-y-3">
                    {groupedByDepartment.map((item) => (
                        <div
                            key={item.department}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#F6F8FF] px-3 py-2"
                        >
                            <span className="text-sm font-medium text-gray-700">{item.department}</span>
                            <span className="text-sm font-semibold text-[#011A8B]">{formatInr(item.total)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">No PT data available for the selected period.</p>
            )}
        </div>
    );
}