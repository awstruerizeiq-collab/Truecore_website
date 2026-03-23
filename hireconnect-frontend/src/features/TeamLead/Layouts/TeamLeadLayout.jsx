import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { getDefaultRouteForRole, resolveAccessContext } from "../../../lib/planAccessConfig.js";

const TeamLeadLayout = () => {
    const navigate = useNavigate();

    const normalizeRoleLike = (value) =>
        String(value || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");

    const isTeamLeadLike = (value) => {
        const v = normalizeRoleLike(value);
        return v === "TEAM_LEADER" || v === "TEAM_LEAD" || v === "TL" || v === "TEAMLEAD";
    };

    React.useEffect(() => {
        const token =
            (localStorage.getItem("token") || "").trim() ||
            (sessionStorage.getItem("token") || "").trim();
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const accessContext = resolveAccessContext();
        const role = accessContext.role;
        const designation =
            localStorage.getItem("userDesignation") || localStorage.getItem("position") || "";
        const isTeamLead = isTeamLeadLike(role) || (!role && isTeamLeadLike(designation));

        if (!isTeamLead) {
            const safePath = getDefaultRouteForRole(role) || "/login";
            navigate(safePath, { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex bg-[#020617] text-white">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Navbar onLogout={handleLogout} />

                <main className="flex-1 bg-[#F5F6FB] p-6 text-black">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TeamLeadLayout;
