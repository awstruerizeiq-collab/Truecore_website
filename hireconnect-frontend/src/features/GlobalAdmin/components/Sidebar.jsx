import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  UserCog,
  BarChart3,
  Lock,
  Headphones,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "dashboard",
      label: "Global Dashboard",
      icon: LayoutDashboard,
      path: "/global-admin/dashboard",
    },
    {
      id: "companies",
      label: "Companies",
      icon: Building2,
      path: "/global-admin/companies",
    },
    {
      id: "subscriptions",
      label: "Subscriptions & Billing",
      icon: CreditCard,
      path: "/global-admin/billing",
    },
    {
      id: "users",
      label: "User & Role Management",
      icon: UserCog,
      path: "/global-admin/users",
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: BarChart3,
      path: "/global-admin/reports",
    },
    {
      id: "security",
      label: "Security & Compliance",
      icon: Lock,
      path: "/global-admin/security",
    },
    {
      id: "support",
      label: "Support Tickets",
      icon: Headphones,
      path: "/global-admin/support",
    },
    {
      id: "logs",
      label: "System Logs",
      icon: FileText,
      path: "/global-admin/logs",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: Settings,
      path: "/global-admin/settings",
    },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative`}
    >
      {/* LOGO */}
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <NavLink
          to="/global-admin/dashboard"
          className="flex items-center gap-2"
        >
          <img
            src="/assets/HRMS_Logo_bg.png"
            alt="TrueCoreHR"
            className="h-10 w-10 object-contain"
          />
          {!collapsed && (
            <span className="font-bold text-lg text-slate-900">
              TrueCoreHR
            </span>
          )}
        </NavLink>
      </div>

      {/* COLLAPSE BUTTON */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 hover:bg-slate-50 z-10"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDashboard = item.path === "/global-admin/dashboard";
          const isActive = isDashboard
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-[#00008B] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : ""}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">Version 2.0.1</p>
          <p className="text-xs text-slate-400 mt-1">
            © 2025 TrueCoreHR
          </p>
        </div>
      )}
    </aside>
  );
}
