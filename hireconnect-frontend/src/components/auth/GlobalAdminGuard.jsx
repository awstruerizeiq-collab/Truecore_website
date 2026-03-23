import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export default function GlobalAdminGuard({ children }) {
  const location = useLocation();
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  const role = normalizeRole(localStorage.getItem("userRole"));

  if (!token) {
    return <Navigate to="/employee/signin" replace state={{ from: location }} />;
  }

  if (role !== "GLOBAL_ADMIN") {
    return <Navigate to="/employee/home" replace />;
  }

  return children;
}
