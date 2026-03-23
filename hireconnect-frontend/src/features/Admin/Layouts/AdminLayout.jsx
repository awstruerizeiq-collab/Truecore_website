import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";   
import TopNav from "../components/Navbar.jsx";     

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // clear auth if you want
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("dashboardSwitchTarget");
    sessionStorage.removeItem("dashboardSwitchOrigin");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-white">
      {/* Sidebar stays constant */}
      <Sidebar />

      {/* Right side: navbar + page content */}
      <div className="flex-1 flex flex-col">
        {/* Top nav stays constant */}
        <TopNav onLogout={handleLogout} />

        {/* Page content changes here */}
        
        <main className="flex-1 bg-[#F5F6FB] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
