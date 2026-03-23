import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  Bell,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAllowedSidebarItems,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

const iconMap = {
  dashboard: LayoutGrid,
  team: Users,
  performance: BarChart3,
  attendance: Calendar,
  tasks: CheckSquare,
  notifications: Bell,
  support: HelpCircle,
  exitDetails: FileText,
  management: Settings,
};

const TEAM_LEAD_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/team-lead/dashboard", exact: true, routeKey: "teamLeadDashboard" },
  { id: "management", label: "Team Leader Management", icon: "management", path: "/team-lead/management", routeKey: "adminManagement" },
  { id: "team", label: "Team", icon: "team", path: "/team-lead/team", routeKey: "team" },
  { id: "performance", label: "Performance", icon: "performance", path: "/team-lead/performance", routeKey: "performance" },
  { id: "attendance", label: "Attendance", icon: "attendance", path: "/team-lead/attendance", routeKey: "attendance" },
  { id: "tasks", label: "Tasks", icon: "tasks", path: "/team-lead/tasks", routeKey: "tasks" },
  { id: "exitDetails", label: "Exit Details", icon: "exitDetails", path: "/team-lead/exit-details", routeKey: "exitDetails" },
  { id: "support", label: "Support", icon: "support", path: "/team-lead/support", routeKey: "support" },
  { id: "notifications", label: "Notifications", icon: "notifications", path: "/team-lead/notifications", routeKey: "notifications" },
];

export default function TeamLeadSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const accessContext = resolveAccessContext();
  const allowedMenuItems = getAllowedSidebarItems(accessContext.role, accessContext.plan, TEAM_LEAD_MENU);

  const isActive = (item) => {
    const p = pathname.toLowerCase();
    const base = item.path.toLowerCase();
    return item.exact ? p === base : p.startsWith(base);
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white shadow-md flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}
    >
      <div className="flex items-center px-4 py-4 border-b">
        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-2"}`}>
          <img src="/assets/HRMS_Logo_bg.png" alt="Logo" className="h-14 w-14 object-contain" />

          {!collapsed && (
            <div className="leading-tight">
              <span className="text-[22px] font-black leading-none text-[#001A7D]">
                TrueCore<span className="text-[#3B82F6]">HR</span>
              </span>
              <div className="text-xs text-gray-500 mt-1">Team Lead Panel</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-[70%] -right-3 bg-[#011A8B] text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10"
        aria-label="Toggle sidebar"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 overflow-y-auto mt-3 px-2">
        <ul className="space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item);

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    active
                      ? "bg-[#011A8B] text-white shadow-md"
                      : "text-gray-700 hover:bg-[#EEF2FF] hover:text-[#011A8B]"
                  } ${collapsed ? "justify-center px-2 py-3" : ""}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && <div className="border-t p-3 text-xs text-gray-500">Powered by TrueCoreHR</div>}
    </aside>
  );
}
