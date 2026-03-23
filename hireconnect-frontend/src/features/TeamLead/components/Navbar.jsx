import React from "react";
import { useNavigate } from "react-router-dom";
const TopNav = ({ onLogout }) => {
    const navigate = useNavigate();
    const companyLegalName =
        localStorage.getItem("companyLegalName") ||
        localStorage.getItem("companyName") ||
        "Company";
    const companyLogoUrl = localStorage.getItem("companyLogoUrl") || "";
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

    const normalizeRoleLike = (value) =>
        String(value || "")
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_");

    const canSwitchFromStoredRole = () => {
        const role = normalizeRoleLike(localStorage.getItem("userRole"));
        return role === "ADMIN" || role === "TEAM_LEAD" || role === "TEAM_LEADER";
    };

    const proceedToEmployeeDashboard = () => {
        sessionStorage.setItem("dashboardSwitchTarget", "employee");
        sessionStorage.setItem("dashboardSwitchOrigin", "TEAM_LEADER");
        navigate("/employee/dashboard");
    };

    const handleSwitchToEmployeeDashboard = async () => {
        const token = (localStorage.getItem("token") || "").trim();
        const authHeader = token
            ? token.startsWith("Bearer ")
                ? token
                : `Bearer ${token}`
            : "";
        const base = getApiBaseUrl();
        const endpoint = `${base}/api/auth/dashboard-switch/employee`;

        try {
            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            });

            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                if (data?.data?.allowed) {
                    proceedToEmployeeDashboard();
                    return;
                }
                alert(data?.message || "Only Team Lead users can switch to Employee Dashboard.");
                return;
            }

            if (canSwitchFromStoredRole()) {
                proceedToEmployeeDashboard();
                return;
            }

            alert(data?.message || "Unable to verify switch permission right now.");
        } catch (_error) {
            if (canSwitchFromStoredRole()) {
                proceedToEmployeeDashboard();
                return;
            }
            alert("Unable to switch dashboard right now. Please try again.");
        }
    };

    return (
        <nav className="w-full h-18 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-50">

            {/* LEFT SECTION */}
            <div className="flex items-center gap-4">

                {/* Team Lead Icon */}
                {companyLogoUrl ? (
                    <img
                        src={companyLogoUrl}
                        alt={companyLegalName}
                        className="h-15 rounded-lg object-cover border border-gray-200 bg-white"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-semibold">
                        C
                    </div>
                )}

                {/* Title */}
                <div className="leading-tight">
                    <h1 className="text-3xl font-semibold text-[#011A8B]">
                        {companyLegalName}
                    </h1>
                   
                </div>

            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-3">
                <button
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 transition px-4 py-2 rounded-xl text-[#011A8B] text-sm font-medium shadow-sm border border-blue-200"
                    onClick={handleSwitchToEmployeeDashboard}
                >
                    <svg
                        className="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 7h11m0 0L11 3m4 4l-4 4M20 17H9m0 0l4-4m-4 4l4 4"
                        />
                    </svg>
                    Switch
                </button>

                <button
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 transition px-4 py-2 rounded-xl text-red-600 text-sm font-medium shadow-sm border border-red-200"
                    onClick={onLogout}
                >
                    <svg
                        className="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    Logout
                </button>
            </div>

        </nav>
    );
};

export default TopNav;
