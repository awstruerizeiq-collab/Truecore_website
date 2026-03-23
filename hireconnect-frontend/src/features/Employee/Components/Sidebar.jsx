import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Clock4,
  Bell,
  HelpCircle,
  FileText,
  ScrollText,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Laptop,
  LogOut,
} from "lucide-react";
import {
  getAllowedSidebarItems,
  isProfessionalEmployeeSwitchActive,
  PROFESSIONAL_EMPLOYEE_SWITCH_ROUTE_KEYS,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

const MENU_ITEMS = [
  {
    id: "home",
    label: "Home",
    to: "/employee/dashboard",
    base: "/employee/dashboard",
    icon: Home,
    routeKey: "home",
    extra: ["/employee", "/employee/"],
  },
  {
    id: "attendance",
    label: "Attendance",
    to: "/employee/attendance",
    base: "/employee/attendance",
    icon: Clock4,
    routeKey: "attendance",
  },
  {
    id: "performance",
    label: "Performance Dashboard",
    to: "/employee/performance",
    base: "/employee/performance",
    icon: BarChart3,
    routeKey: "performance",
  },
  {
    id: "policy",
    label: "Policy",
    to: "/employee/policy",
    base: "/employee/policy",
    icon: ScrollText,
    routeKey: "policy",
  },
  {
    id: "finance",
    label: "Finance Hub",
    to: "/employee/finance",
    base: "/employee/finance",
    icon: IndianRupee,
    routeKey: "financeHub",
  },
  {
    id: "documents",
    label: "Documents",
    to: "/employee/documents",
    base: "/employee/documents",
    icon: FileText,
    routeKey: "document",
  },
  {
    id: "assets",
    label: "Assets",
    to: "/employee/assets",
    base: "/employee/assets",
    icon: Laptop,
    routeKey: "assets",
  },
  {
    id: "notifications",
    label: "Notifications",
    to: "/employee/notifications",
    base: "/employee/notifications",
    icon: Bell,
    routeKey: "notifications",
  },
  {
    id: "support",
    label: "Support",
    to: "/employee/support",
    base: "/employee/support",
    icon: HelpCircle,
    routeKey: "support",
  },
  {
    id: "exit",
    label: "Exit", // Navigates to /employee/exit
    to: "/employee/exit",
    base: "/employee/exit",
    icon: LogOut,
    routeKey: "exit",
  },
];

export default function EmployeeSidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const accessContext = resolveAccessContext();
  const isProfessionalEmployeeSwitch = isProfessionalEmployeeSwitchActive(
    accessContext,
    pathname,
  );
  const baseMenuItems = isProfessionalEmployeeSwitch
    ? MENU_ITEMS.filter((item) =>
        PROFESSIONAL_EMPLOYEE_SWITCH_ROUTE_KEYS.includes(item.routeKey),
      )
    : MENU_ITEMS;
  const allowedMenuItems = isProfessionalEmployeeSwitch
    ? baseMenuItems
    : getAllowedSidebarItems(accessContext.role, accessContext.plan, baseMenuItems);

  const currentPath = pathname.toLowerCase();

  const isActive = (item) =>
    item.extra?.includes(currentPath) ||
    currentPath.startsWith(item.base.toLowerCase());

  return (
    <aside
      className={`sticky top-0 h-screen bg-white shadow-md flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      {/* HEADER */}
      <div className="flex items-center px-4 py-4">
        <div
          className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-2"
            }`}
        >
          <img
            src="/assets/HRMS_Logo_bg.png"
            alt="Logo"
            className="h-14 w-14 object-contain"
          />

          {!collapsed && (
            <span className="text-[25px] font-black leading-none text-[#001A7D]">
              TrueCore<span className="text-[#3B82F6]">HR</span>
            </span>
          )}
        </div>
      </div>

      {/* COLLAPSE BUTTON */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-[70%] -right-3 bg-[#011A8B] text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center hover:bg-[#02106A]"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* MENU */}
      <nav
        className="flex-1 overflow-y-auto mt-3 px-2"
        style={{ maxHeight: "calc(100vh - 140px)" }} // Prevents hidden items
      >
        <ul className="space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${collapsed ? "justify-center px-0" : ""
                    } ${active
                      ? "bg-[#011A8B] text-white shadow-md"
                      : "text-gray-700 hover:bg-[#EEF2FF] hover:text-[#011A8B]"
                    }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
