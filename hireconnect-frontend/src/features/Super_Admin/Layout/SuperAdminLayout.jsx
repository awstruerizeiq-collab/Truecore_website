import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/Navbar.jsx";

const SuperAdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopNav onLogout={handleLogout} />

        <main className="flex-1 bg-[#F5F6FB] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;