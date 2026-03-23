import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 🔥 THIS IS THE KEY
});

export default function RedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.get("/api/auth/me");
        const role = res.data?.data?.role;

        if (role === "GLOBAL_ADMIN") {
          navigate("/global-admin/dashboard");
        } else if (role === "SUPER_ADMIN") {
          navigate("/super-admin/dashboard");
        } else if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/employee/home");
        }
      } catch (err) {
         console.error("Redirect auth failed", err);
        navigate("/employee/signin");
      }
    };

    resolve();
  }, [navigate]);

  return null;
}
