import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAllowedSidebarItems,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

// MENU CONFIG
const MENU_ITEMS = [
  {
    id: "home",
    label: "CEO Dashboard",
    icon: "grid",
    path: "/super-admin/dashboard",
    exact: true,
    routeKey: "dashboard",
  },
  {
    id: "employees",
    label: "Manage Employees",
    icon: "users",
    path: "/super-admin/employees",
    routeKey: "manageEmployee",
  },
  {
    id: "payslips",
    label: "Pay Slip",
    icon: "dollar",
    path: "/super-admin/payslip",
    routeKey: "payslip",
  },
  {
    id: "bills",
    label: "Bills",
    icon: "dollar",
    path: "/super-admin/bills",
    routeKey: "bills",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: "calendar",
    path: "/super-admin/attendance",
    routeKey: "attendance",
  },
  {
    id: "accessControl",
    label: "Access Control System",
    icon: "lock",
    path: "/super-admin/access-control",
    routeKey: "accessControl",
  },

  {
    id: "documents",
    label: "Documents",
    icon: "file",
    path: "/super-admin/documents",
    routeKey: "document",
  },
  {
    id: "support",
    label: "Support",
    icon: "help",
    path: "/super-admin/support",
    routeKey: "support",
  },
];

// INLINE SVG ICON COMPONENT
const Icon = ({ name, className }) => {
  const icons = {
    grid: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6A2 2 0 014 8V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    users: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.5a3.5 3.5 0 11-3.5 3.5A3.5 3.5 0 0112 4.5zm0 7c-3.038 0-5.5 1.79-5.5 4v.5A1.5 1.5 0 008 17.5h8a1.5 1.5 0 001.5-1.5V15.5c0-2.21-2.462-4-5.5-4z"
        />
      </svg>
    ),
    dollar: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    calendar: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    lock: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10V8a4 4 0 118 0v2m-9 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z"
        />
      </svg>
    ),
    file: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L18.707 7.7a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    help: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 18h.01M8.228 9a4 4 0 017.544 1.5c0 1.657-1.343 2.5-2.5 3s-1 1-1 2m0 3a9 9 0 110-18 9 9 0 010 18z"
        />
      </svg>
    ),
  };

  return icons[name] || null;
};

export default function AdminSidebar() {
  const rawLocation = useLocation();
  const location = {
    ...rawLocation,
    pathname: rawLocation.pathname.toLowerCase(),
  };
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const accessContext = resolveAccessContext();
  const allowedMenuItems = getAllowedSidebarItems(accessContext.role, accessContext.plan, MENU_ITEMS);

  // Shared classes
  const base =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-[#EEF2FF] hover:text-[#011A8B] transition";
  const active =
    "bg-[#011A8B] text-white hover:bg-[#011A8B] shadow-md";

  const isActive = (item) => {
    const current = location.pathname;
    const path = item.path.toLowerCase();

    if (item.id === "home") {
      return (
        current === "/super-admin" ||


        current === "/super-admin/" ||
        current === "/admin/dashboard" ||
        current === "/admin/dashboard/"
      );
    }

    if (item.exact) {
      return current === path || current === path + "/";
    }

    return current.startsWith(path);
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      {/* HEADER */}
      <div className="flex items-center px-4 py-4">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""
            }`}
        >
          <img
            src="/assets/HRMS_Logo_bg.png"
            alt="Logo"
            className="h-13 w-13 object-contain rounded-xl"
          />

          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-black tracking-tight font-sans text-[#001A7D]">
                TrueCore<span className="text-[#3B82F6]">HR</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute top-[70%] -right-3 bg-[#011A8B] text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1 hover:bg-[#02106A] transition"
      >
        {collapsed ? (
          <>
            <span className="inline-block rotate-180 text-sm">➤</span>
            <span className="hidden md:inline">Expand</span>
          </>
        ) : (
          <>
            <span className="hidden md:inline">Collapse</span>
            <span className="inline-block text-sm">➤</span>
          </>
        )}
      </button>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto mt-3">
        <ul className="space-y-1 px-2">
          {allowedMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full ${base} ${isActive(item) ? active : ""} ${collapsed ? "justify-center px-0" : ""
                  }`}
              >
                <span className="w-6 h-6 flex justify-center">
                  <Icon name={item.icon} className="w-5 h-5" />
                </span>

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-100">
        <button
          className={`w-full text-left text-xs text-gray-400 hover:text-[#011A8B] transition ${collapsed ? "text-center" : ""
            }`}
          onClick={() => alert("Admin help coming soon")}
        >
          {!collapsed ? "Help & Support" : "Help"}
        </button>
      </div>
    </aside>
  );
}
