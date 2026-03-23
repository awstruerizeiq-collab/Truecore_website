import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import EmployeeSidebar from "../Components/Sidebar.jsx";
import EmployeeNavbar from "../Components/Navbar.jsx";


const EmployeeLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("dashboardSwitchTarget");
    sessionStorage.removeItem("dashboardSwitchOrigin");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#F5F6FB] text-gray-800">
      
      {/* Sidebar stays fixed */}
      <EmployeeSidebar />

      {/* Right section */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Navbar */}
        <EmployeeNavbar onLogout={handleLogout} />

        {/* Page content */}
        <main className="flex-1 px-4 md:px-6 py-4 overflow-y-auto">

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
