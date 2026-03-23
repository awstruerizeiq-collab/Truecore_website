import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../public/assets/Logo_Truerize.png";
import { hydrateCompanySubscriptionFromApi } from "./lib/planAccessConfig.js";
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
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const PARTICLES = [
  { id: 1, left: "8%", bottom: "-10%", size: 6, duration: 18, delay: 0 },
  { id: 2, left: "18%", bottom: "-15%", size: 8, duration: 22, delay: 4 },
  { id: 3, left: "28%", bottom: "-12%", size: 5, duration: 16, delay: 2 },
  { id: 4, left: "38%", bottom: "-18%", size: 7, duration: 24, delay: 6 },
  { id: 5, left: "48%", bottom: "-10%", size: 4, duration: 20, delay: 1 },
  { id: 6, left: "58%", bottom: "-14%", size: 9, duration: 26, delay: 3 },
  { id: 7, left: "68%", bottom: "-16%", size: 6, duration: 21, delay: 5 },
  { id: 8, left: "78%", bottom: "-12%", size: 5, duration: 19, delay: 7 },
  { id: 9, left: "88%", bottom: "-18%", size: 7, duration: 23, delay: 2.5 },
  { id: 10, left: "15%", bottom: "-20%", size: 4, duration: 27, delay: 8 },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    companyKey: "",
    tenantCode: "",
    companyOfficialEmail: "",
    companyOfficialPassword: "",
  });
  const [activeTab, setActiveTab] = useState("employee");
  const [submitting, setSubmitting] = useState(false);
  const [showDashboardChoice, setShowDashboardChoice] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginClick = () => setShowForm(true);
  const handleReturnHome = () => navigate("/");

  const handleForgotPassword = () => {
    const role = activeTab === "company" ? "ADMIN" : "EMPLOYEE";
    navigate(`/forgot-password?role=${role}`);
  };

  const getLoginApi = () => {
    const base = API_BASE_URL.replace(/\/+$/, "");
    if (activeTab === "company") {
      return base ? `${base}/api/auth/company-login` : "/api/auth/company-login";
    }
    return base ? `${base}/api/auth/login` : "/api/auth/login";
  };

  const resolveLogoUrl = (logoUrlOrPath) => {
    if (!logoUrlOrPath) return "";
    const isLocalHost =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname);

    const localBase = "http://localhost:8080";
    const base = (isLocalHost ? localBase : API_BASE_URL).replace(/\/+$/, "");

    // Handle malformed comma-separated values coming from backend config mistakes.
    const candidates = String(logoUrlOrPath)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const raw =
      candidates.find((c) => isLocalHost && /localhost|127\.0\.0\.1/i.test(c)) ||
      candidates[0] ||
      "";

    if (/^https?:\/\//i.test(raw)) {
      if (!isLocalHost) return raw;
      try {
        const parsed = new URL(raw);
        return `${localBase}${parsed.pathname}`;
      } catch {
        return raw;
      }
    }

    let normalized = raw;
    if (!normalized.startsWith("/")) {
      normalized = normalized.startsWith("uploads/")
        ? `/${normalized}`
        : `/uploads/company-logos/${normalized}`;
    }
    return base ? `${base}${normalized}` : normalized;
  };

  const getTitle = () => {
    return activeTab === "company" ? "Company Sign In" : "Employee Sign In";
  };

  const normalizeRoleLike = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

  const isTeamLeadLike = (value) => {
    const v = normalizeRoleLike(value);
    return v === "TEAM_LEADER" || v === "TEAM_LEAD" || v === "TL" || v === "TEAMLEAD";
  };

  const shouldShowTeamLeadDashboardChoice = ({ role, designation, position }) => {
    const normalizedRole = normalizeRoleLike(role);
    if (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN" || normalizedRole === "COMPANY_ADMIN") {
      return false;
    }
    return isTeamLeadLike(role) || isTeamLeadLike(designation) || isTeamLeadLike(position);
  };

  const redirectByRole = (role) => {
    const r = normalizeRoleLike(role);
    const isTeamLead = isTeamLeadLike(r);

    if (r === "GLOBAL_ADMIN" || r === "GLOBALADMIN") {
      window.location.href = "/global-admin/dashboard";
      return;
    }
    if (isTeamLead) {
      window.location.href = "/team-lead/dashboard";
      return;
    }
    if (r === "ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    }
    window.location.href = "/employee/home";
  };

  const handleDashboardSelection = (dashboard) => {
    setShowDashboardChoice(false);
    if (dashboard === "TEAM_LEAD") {
      window.location.href = "/team-lead/dashboard";
      return;
    }
    window.location.href = "/employee/home";
  };

  const tryParseJson = (text) => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const isCompany = activeTab === "company";
    const companyTenantCode = (loginData.companyKey || "").trim();

    if (isCompany && (!companyTenantCode || companyTenantCode !== companyTenantCode.toUpperCase())) {
      alert("Tenant Code must be entered in uppercase.");
      return;
    }

    const payload = isCompany
      ? {
        companyOfficialEmail: loginData.email,
        companyOfficialPassword: loginData.companyOfficialPassword,
        tenantCode: companyTenantCode,
      }
      : {
        email: loginData.email,
        password: loginData.password,
      };

    try {
      setSubmitting(true);

      const res = await fetch(getLoginApi(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      const data = tryParseJson(raw);
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok || !data?.success) {
        const fallbackMessage =
          raw?.trim() ||
          `Login failed (status ${res.status})`;
        alert("Error: " + (data?.message || fallbackMessage));
        return;
      }

      const token = data?.data?.token ?? null;
      if (!token) {
        alert("Login succeeded but token is missing");
        return;
      }

      // Save token (always)
      const bearerToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      localStorage.setItem("token", bearerToken);

      if (isCompany) {
        // ========== COMPANY ADMIN LOGIN ==========
        localStorage.setItem("companyId", String(data?.data?.companyId || ""));
        localStorage.setItem("companyName", data?.data?.displayName || "");
        localStorage.setItem(
          "companyLegalName",
          data?.data?.companyLegalName || data?.data?.legalName || data?.data?.displayName || ""
        );
        localStorage.setItem(
          "companyLogoUrl",
          resolveLogoUrl(data?.data?.logoUrl || data?.data?.logoPath || "")
        );
        localStorage.setItem("tenantCode", data?.data?.tenantCode || "");
        localStorage.setItem("userRole", "COMPANY_ADMIN");
        await hydrateCompanySubscriptionFromApi({
          token: bearerToken,
          companyId: data?.data?.companyId,
          seedData: data?.data,
          force: true,
        });
        window.dispatchEvent(new Event("company-context-updated"));
        window.location.href = "/super-admin/dashboard";
        return;
      }

      // ========== EMPLOYEE / ADMIN / TEAM LEAD LOGIN ==========
      let userRoleRaw = data?.data?.role || "EMPLOYEE";
      let userRole = String(userRoleRaw).toUpperCase();
      let userDesignation = data?.data?.designation || data?.data?.position || "";

      let userId = data?.data?.userId || data?.data?.id || "";
      let tenantCode = data?.data?.tenantCode || "";
      let companyId = data?.data?.companyId || "";
      let companyName = data?.data?.companyName || "";
      let companyLegalName = data?.data?.companyLegalName || "";
      let companyLogoUrl = data?.data?.logoUrl || data?.data?.logoPath || "";
      let meProfile = null;

      let employeeId = data?.data?.employeeId || "";
      let fullName = data?.data?.fullName || data?.data?.name || "";

      // Fallback: if login payload misses userId, resolve from /api/users/me.
      if (!userId) {
        try {
          const meBase = API_BASE_URL.replace(/\/+$/, "");
          const meEndpoint = meBase ? `${meBase}/api/users/me` : "/api/users/me";
          const meRes = await fetch(meEndpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: bearerToken,
            },
          });

          if (meRes.ok) {
            const meJson = await meRes.json();
            const me = meJson?.data || {};
            meProfile = me;

            userId = me?.id || me?.userId || userId;
            tenantCode = tenantCode || me?.tenantCode || "";
            companyId = companyId || me?.companyId || "";
            companyName = companyName || me?.companyName || "";
            companyLegalName = companyLegalName || me?.companyLegalName || me?.legalName || "";
            companyLogoUrl = companyLogoUrl || me?.logoUrl || me?.logoPath || "";
            employeeId = employeeId || me?.employeeId || "";
            fullName = fullName || me?.fullName || me?.name || "";
            userDesignation = userDesignation || me?.designation || me?.position || "";
            if (!data?.data?.role && me?.role) {
              userRoleRaw = me?.role;
              userRole = String(me?.role).toUpperCase();
            }
          }
        } catch (profileErr) {
          console.warn("Failed to resolve user profile after login:", profileErr);
        }
      }

      if (!userId) {
        alert("Login succeeded, but userId is missing. Please contact admin.");
        return;
      }

      // Store common user info
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("employeeName", fullName);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userDesignation", String(userDesignation));

      // Store tenant info for ALL roles (ADMIN/TEAM_LEAD/EMPLOYEE)
      localStorage.setItem("tenantCode", tenantCode);
      localStorage.setItem("companyId", String(companyId));
      localStorage.setItem("companyName", companyName);
      localStorage.setItem("companyLegalName", companyLegalName || companyName || "");
      localStorage.setItem("companyLogoUrl", resolveLogoUrl(companyLogoUrl));
      await hydrateCompanySubscriptionFromApi({
        token: bearerToken,
        companyId,
        seedData: {
          ...(data?.data || {}),
          ...(meProfile || {}),
          companyId,
          tenantCode,
        },
        force: true,
      });
      window.dispatchEvent(new Event("company-context-updated"));

      // Store employeeId (needed to fetch team members)
      if (employeeId) localStorage.setItem("employeeId", employeeId);

      if (
        shouldShowTeamLeadDashboardChoice({
          role: userRole,
          designation: userDesignation,
          position: data?.data?.position,
        })
      ) {
        setShowDashboardChoice(true);
        return;
      }

      // ✅ Redirect
      redirectByRole(userRole);
    } catch (error) {
      alert("Login error: " + (error?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-900">
      {/* LEFT PANEL */}
      <div className="hidden md:flex md:w-[30%] lg:w-[32%] relative overflow-hidden text-white">
        <style>{`
          @keyframes particle-float-up {
            0% { transform: translate3d(0, 0, 0); opacity: 0; }
            15% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate3d(0, -140vh, 0); opacity: 0; }
          }
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            50% { opacity: 0.7; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(150%); }
          }
        `}</style>

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#011A8B] to-[#020617]" />
        <div className="absolute -top-24 -left-16 h-56 w-56 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-16 h-64 w-64 bg-cyan-400/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] left-10 h-72 w-72 bg-indigo-500/30 rounded-full blur-3xl" />

        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-cyan-200/70 shadow-[0_0_15px_rgba(56,189,248,0.6)]"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `particle-float-up ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col px-8 py-8 w-full">
          <div className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-blue-500/10 rounded-xl blur-md group-hover:bg-blue-500/20 transition duration-500"></div>
              <div className="relative h-24 w-24 bg-white rounded-xl shadow-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div
                    className="w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"
                    style={{
                      position: "relative",
                      bottom: 75,
                      animation: "scan 4s linear infinite",
                    }}
                  />
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    style={{ animation: "shimmer 3s ease-in-out infinite" }}
                  />
                </div>
                <img
                  src={logo}
                  alt="Truerize Logo"
                  className="relative z-12 h-18 w-18 object-contain filter drop-shadow-sm transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500/30 rounded-tl-sm"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500/30 rounded-br-sm"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center px-2">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/10">
                <img
                  src="/assets/HRMS_Logo_bg.png"
                  alt="Brand Icon"
                  className="h-15 w-15 rounded-full object-contain"
                />
              </div>
              <p className="text-sm leading-relaxed text-blue-50 max-w-xs">
                &quot;With TrueCoreHR, our team can check in, track leaves and view
                payslips from anywhere. HR work feels lighter and paydays are
                smoother.&quot;
              </p>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] uppercase text-blue-100">
                HR PARTNER, CLIENT ORGANIZATION
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-[#F5F7FF] relative">
        {/* BACK BUTTON - TOP LEFT */}
        <div className="absolute top-6 left-6 z-10">
          <button
            type="button"
            onClick={handleReturnHome}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#011A8B] hover:text-[#010E5C] hover:bg-white/50 rounded-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 px-4 pt-20">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/assets/HRMS_Logo_name.png"
                alt="Brand Icon"
                className="h-[200px] w-[200px] object-contain"
              />
            </div>

            <div className="text-center mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Log in to access TrueCoreHR
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeTab === "company"
                  ? "Use your registered company email and company key to sign in."
                  : "Use your registered email and password to sign in."}
              </p>
            </div>

            {!showForm ? (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="w-full max-w-xs py-3 rounded-full bg-[#F04438] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:bg-[#D9372C] transition"
                >
                  SIGN IN
                </button>
                <p className="mt-6 text-xs text-slate-500">
                  Don&apos;t have an account?{" "}
                  <span className="text-[#011A8B] font-medium">
                    Contact your HR team
                  </span>
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-6 py-6">
                <div className="flex items-center justify-center mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("employee")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === "employee"
                      ? "border-[#011A8B] text-[#011A8B]"
                      : "border-transparent text-slate-500"
                      }`}
                  >
                    Employee Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("company")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 ml-4 ${activeTab === "company"
                      ? "border-[#011A8B] text-[#011A8B]"
                      : "border-transparent text-slate-500"
                      }`}
                  >
                    Company Sign In
                  </button>
                </div>

                <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">
                  {getTitle()}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      {activeTab === "company" ? "Company Official Email" : "Email"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder={
                        activeTab === "company"
                          ? "you@organization.com"
                          : "you@company.com"
                      }
                      value={loginData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                    />
                  </div>

                  {activeTab === "company" && (
                    <>
                      <div>
                        <label className="block text-xs mb-1.5 text-slate-600">
                          Company Official Password
                        </label>
                        <input
                          type="password"
                          name="companyOfficialPassword"
                          placeholder="Enter company official password"
                          value={loginData.companyOfficialPassword}
                          onChange={handleChange}
                          required
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5 text-slate-600">
                          Tenant Code
                        </label>
                        <input
                          type="text"
                          name="companyKey"
                          placeholder="Enter your tenant code"
                          value={loginData.companyKey}
                          onChange={handleChange}
                          required
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                        />
                      </div>
                    </>
                  )}

                  {activeTab !== "company" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-2.5 rounded-full bg-[#011A8B] text-white font-semibold text-sm shadow-md hover:bg-[#010E5C] transition disabled:opacity-60"
                  >
                    {submitting ? "Logging in..." : "Log in"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-slate-500 hover:text-[#011A8B] transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mt-4 w-full text-center text-xs text-slate-500 hover:text-[#011A8B] transition"
                >
                  ← Back to sign-in screen
                </button>
              </div>
            )}

            <p className="mt-10 text-[11px] text-slate-400 text-center">
              By logging in, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <footer className="w-full bg-[#F8F4E7] py-3 text-center border-t border-gray-300">
          <p className="text-[11px] text-gray-700">
            © {new Date().getFullYear()} Truerize IQ Strategic Solutions Pvt Ltd.
            All rights reserved.
          </p>
        </footer>
      </div>

      {showDashboardChoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Choose Dashboard</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have access to both dashboards. Select where you want to continue.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => handleDashboardSelection("EMPLOYEE")}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-left font-medium text-slate-800 hover:bg-slate-50"
              >
                Employee Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleDashboardSelection("TEAM_LEAD")}
                className="w-full rounded-lg bg-[#011A8B] px-4 py-3 text-left font-medium text-white hover:bg-[#021D9B]"
              >
                Team Lead Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
