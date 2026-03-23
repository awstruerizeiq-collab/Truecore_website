import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();

  if (fromEnv && !isLocalHost) {
    return fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  if (isLocalHost) {
    return "http://localhost:8080";
  }

  return fromEnv ? fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "") : "";
};

const API_BASE_URL = getApiBaseUrl();

const safeApiUrl = (path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
};

const tryParseJson = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export default function GlobalAdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      (localStorage.getItem("token") || "").trim() ||
      (sessionStorage.getItem("token") || "").trim();
    const role = normalizeRole(localStorage.getItem("userRole"));

    if (token && role === "GLOBAL_ADMIN") {
      navigate("/global-admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password) return "Password is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(safeApiUrl("/api/global-admin/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const raw = await res.text();
      const data = tryParseJson(raw);

      if (!res.ok || !data?.success) {
        setError(data?.message || raw || "Login failed");
        return;
      }

      const token = data?.data?.token;
      const role = normalizeRole(data?.data?.role || "");

      if (role !== "GLOBAL_ADMIN") {
        setError("Invalid credentials");
        return;
      }

      if (!token) {
        setError("Token missing in response");
        return;
      }

      localStorage.setItem(
        "token",
        token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      );
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", data?.data?.userId || data?.data?.id || "");
      localStorage.setItem("employeeName", data?.data?.fullName || "");

      navigate("/global-admin/dashboard", { replace: true });
    } catch (err) {
      if (String(err?.message || "").toLowerCase().includes("failed to fetch")) {
        setError("Cannot connect to backend. Ensure backend is running on http://localhost:8080");
      } else {
        setError(err?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FF]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-6">
        <h2 className="text-xl font-bold text-center text-[#011A8B]">
          Global Admin Login
        </h2>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-[#011A8B] text-white py-2 rounded-lg font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
