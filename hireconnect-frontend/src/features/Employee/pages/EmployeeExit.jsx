import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

const TEAM_LEAD_NOTIFICATION_ENDPOINTS = [
    "/api/teamlead/notifications",
    "/api/team-lead/notifications",
];
const TEAM_LEAD_TASK_ENDPOINTS = ["/api/teamlead/tasks"];

export default function EmployeeExit() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        exitType: "Resignation",
        reason: "Better opportunity",
        otherReason: "",
        comments: "",
    });

    // 🔹 Function to calculate today + 30 days
    const calculateLastWorkingDay = () => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split("T")[0];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "reason" && value !== "Other"
                ? { otherReason: "" }
                : {}),
        }));
    };

    const buildExitData = () => ({
        employeeName:
            localStorage.getItem("employeeName") ||
            localStorage.getItem("name") ||
            "Employee",
        employeeId:
            localStorage.getItem("userId") ||
            localStorage.getItem("employeeId") ||
            "",
        role: localStorage.getItem("userRole") || "Employee",
        exitType: formData.exitType,
        reason:
            formData.reason === "Other"
                ? formData.otherReason
                : formData.reason,
        noticePeriod: "30 days",
        appliedOn: new Date().toLocaleDateString(),
        lastWorkingDay: calculateLastWorkingDay(),
        comments: formData.comments,
        currentStatus: "SUBMITTED",
    });

    const cleanStorageValue = (value) => {
        const v = String(value ?? "").trim();
        if (!v || v.toLowerCase() === "null" || v.toLowerCase() === "undefined") return "";
        return v;
    };

    const toBackendDateTime = (date) => {
        // Keep format compatible with LocalDateTime.parse on backend.
        return new Date(date).toISOString().slice(0, 19);
    };

    const getRequestHeaders = () => {
        const token = cleanStorageValue(localStorage.getItem("token") || sessionStorage.getItem("token"));
        let tenantCode = cleanStorageValue(
            localStorage.getItem("tenantCode") ||
            localStorage.getItem("tenant_code") ||
            localStorage.getItem("TENANT_CODE") ||
            sessionStorage.getItem("tenantCode") ||
            sessionStorage.getItem("tenant_code") ||
            sessionStorage.getItem("TENANT_CODE") ||
            ""
        );
        let companyId = cleanStorageValue(
            localStorage.getItem("companyId") ||
            localStorage.getItem("company_id") ||
            localStorage.getItem("COMPANY_ID") ||
            sessionStorage.getItem("companyId") ||
            sessionStorage.getItem("company_id") ||
            sessionStorage.getItem("COMPANY_ID") ||
            ""
        );

        if ((!tenantCode || !companyId) && localStorage.getItem("user")) {
            try {
                const user = JSON.parse(localStorage.getItem("user"));
                tenantCode = tenantCode || cleanStorageValue(user?.tenantCode || user?.tenant_code || "");
                companyId = companyId || cleanStorageValue(user?.companyId || user?.company_id || "");
            } catch (err) {
                console.warn("Could not parse localStorage user object", err);
            }
        }

        return {
            ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
            ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
            ...(companyId ? { "X-Company-Id": companyId } : {}),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const exitData = buildExitData();

        try {
            const headers = getRequestHeaders();
            if (!headers["X-Tenant-Code"] || !headers["X-Company-Id"]) {
                throw new Error("Tenant/company context missing. Please log out and log in again.");
            }

            const messageLines = [
                `Employee: ${exitData.employeeName}${exitData.employeeId ? ` (${exitData.employeeId})` : ""}`,
                `Role: ${exitData.role}`,
                `Exit Type: ${exitData.exitType}`,
                `Reason: ${exitData.reason}`,
                `Applied On: ${exitData.appliedOn}`,
                `Last Working Day: ${exitData.lastWorkingDay}`,
                `Comments: ${exitData.comments || "N/A"}`,
            ];
            const taskForm = new FormData();
            taskForm.append("title", `Exit Request - ${exitData.employeeName}`);
            taskForm.append("description", messageLines.join("\n"));
            taskForm.append("priority", "HIGH");
            taskForm.append("assignType", "ALL");
            taskForm.append("dueDate", exitData.lastWorkingDay);
            taskForm.append("links", "[]");

            let submitted = false;
            let lastError = null;

            for (const endpoint of TEAM_LEAD_TASK_ENDPOINTS) {
                try {
                    await api.post(endpoint, taskForm, { headers });
                    submitted = true;
                    break;
                } catch (err) {
                    lastError = err;
                    if (err?.response?.status !== 404) {
                        throw err;
                    }
                }
            }

            if (!submitted) {
                const notificationForm = new FormData();
                notificationForm.append("title", `Exit request submitted by ${exitData.employeeName}`);
                notificationForm.append("message", messageLines.join("\n"));
                notificationForm.append("priority", "HIGH");
                notificationForm.append("status", "PUBLISHED");
                notificationForm.append("pinned", "false");
                notificationForm.append("reqAck", "false");
                notificationForm.append("sendEmail", "false");
                notificationForm.append("sendPush", "false");
                notificationForm.append("targetType", "ALL");
                notificationForm.append("scheduledAt", toBackendDateTime(new Date()));

                for (const endpoint of TEAM_LEAD_NOTIFICATION_ENDPOINTS) {
                    try {
                        await api.post(endpoint, notificationForm, { headers });
                        submitted = true;
                        break;
                    } catch (err) {
                        lastError = err;
                        if (err?.response?.status !== 404) {
                            throw err;
                        }
                    }
                }
            }

            if (!submitted) {
                throw lastError || new Error("No Team Lead endpoint is available.");
            }

            alert("Exit request submitted successfully! Team Lead has been notified.");
            console.log("Exit Request Payload:", exitData);
        } catch (error) {
            console.error("Failed to submit exit request notification:", error);
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data === "string" ? error.response.data : "");
            alert(
                backendMessage ||
                error?.message ||
                "Exit request submitted, but Team Lead notification failed."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewStatus = () => {
        navigate("/employee/exit-status", {
            state: buildExitData(),
        });
    };

    return (
        <div className="p-6 w-full min-h-screen bg-[#F5F7FB]">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                Employee Exit Request
            </h1>

            <div className="bg-white rounded-xl shadow-md p-6 w-full">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Exit Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exit Type
                        </label>
                        <select
                            name="exitType"
                            value={formData.exitType}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option>Resignation</option>
                            <option>Termination</option>
                            <option>Retirement</option>
                        </select>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Exit
                        </label>
                        <select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option>Better opportunity</option>
                            <option>Personal reasons</option>
                            <option>Health issues</option>
                            <option>Relocation</option>
                            <option>Other</option>
                        </select>
                    </div>

                    {/* Other Reason */}
                    {formData.reason === "Other" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Please specify your reason
                            </label>
                            <input
                                type="text"
                                name="otherReason"
                                value={formData.otherReason}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                    )}

                    {/* Last Working Day (AUTO 30 DAYS) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Working Day
                        </label>
                        <input
                            type="date"
                            value={calculateLastWorkingDay()}
                            readOnly
                            className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            *Automatically calculated as 30 days from today.
                        </p>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comments
                        </label>
                        <textarea
                            name="comments"
                            value={formData.comments}
                            onChange={handleChange}
                            rows="4"
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            type="button"
                            onClick={handleViewStatus}
                            className="px-4 py-2 border rounded-lg text-blue-600 hover:bg-gray-100"
                        >
                            View Exit Status →
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}