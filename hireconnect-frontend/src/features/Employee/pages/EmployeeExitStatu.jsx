import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
  baseURL: API_BASE_URL,
});

const getTenantContext = () => {
  let tenantCode =
    localStorage.getItem("tenantCode") ||
    localStorage.getItem("tenant_code") ||
    localStorage.getItem("TENANT_CODE") ||
    "";

  let companyId =
    localStorage.getItem("companyId") ||
    localStorage.getItem("company_id") ||
    localStorage.getItem("COMPANY_ID") ||
    "";

  if ((!tenantCode || !companyId) && localStorage.getItem("user")) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      tenantCode = tenantCode || user?.tenantCode || user?.tenant_code || "";
      companyId = companyId || user?.companyId || user?.company_id || "";
    } catch {
      // ignore parse errors
    }
  }

  return { tenantCode, companyId };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const { tenantCode, companyId } = getTenantContext();
  return {
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
    ...(companyId ? { "X-Company-Id": companyId } : {}),
  };
};

const getTenantParams = () => {
  const { tenantCode, companyId } = getTenantContext();
  return {
    ...(tenantCode ? { tenantCode } : {}),
    ...(companyId ? { companyId } : {}),
  };
};

const extractLineValue = (description, key) => {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, "mi");
  return description?.match(regex)?.[1]?.trim() || "";
};

const parseEmployee = (description) => {
  const employee = extractLineValue(description, "Employee");
  if (!employee) return { employeeName: "N/A", employeeId: "N/A" };

  const match = employee.match(/^(.*)\((.*)\)$/);
  if (!match) return { employeeName: employee.trim(), employeeId: "N/A" };

  return {
    employeeName: match[1].trim(),
    employeeId: match[2].trim(),
  };
};

const toDisplayDate = (value) => {
  if (!value || value === "N/A") return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const mapTaskToTimelineStatus = (taskStatus) => {
  if (taskStatus === "DONE") return "COMPLETED";
  if (taskStatus === "IN_PROGRESS") return "TL_APPROVED";
  return "SUBMITTED";
};

export default function EmployeeExitStatus() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [exitData, setExitData] = useState(
    location.state || {
      employeeName: localStorage.getItem("employeeName") || localStorage.getItem("name") || "N/A",
      role: localStorage.getItem("userRole") || "N/A",
      reason: "N/A",
      noticePeriod: "30 days",
      appliedOn: "N/A",
      lastWorkingDay: "N/A",
      currentStatus: "SUBMITTED",
    }
  );

  useEffect(() => {
    const fetchLatestExitStatus = async () => {
      setLoading(true);
      setError("");
      try {
        const currentEmployeeId =
          localStorage.getItem("userId") || localStorage.getItem("employeeId") || "";
        const currentEmployeeName =
          localStorage.getItem("employeeName") || localStorage.getItem("name") || "";

        const res = await api.get("/api/teamlead/tasks", {
          headers: getAuthHeaders(),
          params: getTenantParams(),
        });

        const tasks = Array.isArray(res.data) ? res.data : [];
        const exitTasks = tasks.filter((t) =>
          (t?.title || "").toLowerCase().startsWith("exit request")
        );

        const matched = exitTasks
          .filter((task) => {
            const desc = task?.description || "";
            if (currentEmployeeId && desc.includes(`(${currentEmployeeId})`)) return true;
            if (currentEmployeeName && desc.toLowerCase().includes(currentEmployeeName.toLowerCase())) return true;
            return false;
          })
          .sort(
            (a, b) =>
              new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
          )[0];

        if (!matched) return;

        const description = matched.description || "";
        const parsedEmployee = parseEmployee(description);
        const status = mapTaskToTimelineStatus(matched.status);

        setExitData((prev) => ({
          employeeName: parsedEmployee.employeeName || prev.employeeName,
          employeeId: parsedEmployee.employeeId || currentEmployeeId || "",
          role: extractLineValue(description, "Role") || prev.role || "N/A",
          reason: extractLineValue(description, "Reason") || prev.reason || "N/A",
          noticePeriod: "30 days",
          appliedOn:
            extractLineValue(description, "Applied On") ||
            (matched.createdAt ? toDisplayDate(matched.createdAt) : prev.appliedOn),
          lastWorkingDay:
            extractLineValue(description, "Last Working Day") ||
            (matched.dueDate ? toDisplayDate(matched.dueDate) : prev.lastWorkingDay),
          comments: extractLineValue(description, "Comments") || "",
          currentStatus: status,
          tlApprovedOn: status === "TL_APPROVED" || status === "COMPLETED" ? toDisplayDate(matched.updatedAt) : "",
          managerApprovedOn: status === "COMPLETED" ? toDisplayDate(matched.updatedAt) : "",
          completedOn: status === "COMPLETED" ? toDisplayDate(matched.updatedAt) : "",
        }));
      } catch (err) {
        console.error(err);
        setError("Could not refresh timeline from server. Showing latest local state.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestExitStatus();
  }, []);

  const statusOrder = ["SUBMITTED", "TL_APPROVED", "MANAGER_APPROVED", "COMPLETED"];
  const isApproved = (step) => statusOrder.indexOf(exitData.currentStatus) >= statusOrder.indexOf(step);

  const timelineSteps = useMemo(
    () => [
      {
        key: "SUBMITTED",
        title: "Exit Submitted",
        description: `${exitData.noticePeriod} notice period (LWD: ${exitData.lastWorkingDay})`,
        date: exitData.appliedOn,
      },
      {
        key: "TL_APPROVED",
        title: "TL Approval",
        description: "Pending TL approval",
        date: exitData.tlApprovedOn || "",
      },
      {
        key: "MANAGER_APPROVED",
        title: "Manager Approval",
        description: "Pending manager approval",
        date: exitData.managerApprovedOn || "",
      },
      {
        key: "COMPLETED",
        title: "Exit Completed",
        description: "All approvals completed",
        date: exitData.completedOn || "",
      },
    ],
    [exitData]
  );

  return (
    <div className="p-6 w-full bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Exit Request Status</h1>

      {error && (
        <div className="max-w-4xl mb-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 max-w-4xl">
        <div className="space-y-3 text-sm">
          <Detail label="Employee" value={`${exitData.employeeName} - ${exitData.role}`} />
          <Detail label="Reason" value={exitData.reason} />
          <Detail label="Notice Period" value={exitData.noticePeriod} />
          <Detail label="Applied On" value={exitData.appliedOn} />
          <Detail label="Last Working Day" value={exitData.lastWorkingDay} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Approval Timeline</h2>
          {loading && <span className="text-xs text-gray-500">Refreshing...</span>}
        </div>

        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const approved = isApproved(step.key);
            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${
                      approved ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    {approved ? "OK" : "..."}
                  </div>

                  {index !== timelineSteps.length - 1 && <div className="h-10 w-px bg-gray-300 mt-1"></div>}
                </div>

                <div>
                  <h3 className="font-medium text-gray-800">{step.title}</h3>
                  {step.date && <p className="text-xs text-gray-500">{step.date}</p>}
                  <p className="text-sm text-gray-600 mt-1">{approved ? "Approved" : step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);