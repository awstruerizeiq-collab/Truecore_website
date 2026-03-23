import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, RefreshCw, LogOut, Settings, ChevronDown } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState("");
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const notifications = [
    {
      id: "companies",
      title: "Company list updated",
      description: "Open company management to review the latest tenant records.",
      path: "/global-admin/companies",
    },
    {
      id: "admins",
      title: "Admin roles require review",
      description: "Check global admin access and role assignments.",
      path: "/global-admin/management",
    },
    {
      id: "support",
      title: "Support queue available",
      description: "Review pending support activity from the global admin panel.",
      path: "/global-admin/support",
    },
  ];

  useEffect(() => {
    const roleFromStorage =
      localStorage.getItem("userRole") ||
      localStorage.getItem("role") ||
      "GLOBAL_ADMIN";
    setUserRole(String(roleFromStorage).toUpperCase().replace(/\s+/g, "_"));
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    const keysToClear = [
      "token",
      "role",
      "userRole",
      "userId",
      "employeeId",
      "tenantCode",
      "companyId",
      "companyName",
      "companyLegalName",
      "companyLogoUrl",
      "companyContext",
      "companySubscription",
      "subscription",
      "planType",
      "companyPlanType",
      "companyPlan",
      "subscriptionPlan",
      "plan",
      "dashboardSwitchTarget",
      "dashboardSwitchOrigin",
      "auth",
      "user",
    ];

    keysToClear.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    navigate("/login");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleNotificationClick = (path) => {
    setShowNotifications(false);
    navigate(path);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-end gap-4">
        <div className="relative" ref={notificationMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg hover:bg-slate-50 transition"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-semibold">
              {notifications.length}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Recent global admin alerts and shortcuts
                </p>
              </div>

              <div className="py-1">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item.path)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          title="Refresh current page"
        >
          <RefreshCw
            className={`h-5 w-5 text-slate-600 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>

        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-xs border border-blue-200 text-[#00008B] font-semibold">
          {userRole}
        </span>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-white border shadow-sm flex items-center justify-center">
              <img src="/assets/HRMS_Logo_bg.png" alt="Profile Logo" className="w-7 h-7 object-contain" />
            </div>
            <ChevronDown className="h-4 w-4 text-slate-600" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Global Admin</p>
                <p className="text-xs text-slate-500">admin@truecore.com</p>
              </div>
              <button
                onClick={() => navigate("/global-admin/settings")}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
