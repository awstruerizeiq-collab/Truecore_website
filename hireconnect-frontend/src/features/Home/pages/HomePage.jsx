
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Clock3,
  CalendarCheck,
  Wallet,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Rocket,
} from "lucide-react";

/* =========================
   ORBIT DATA (FIX)
========================= */
const coreFeatures = [
  { title: "Employee Dashboard", icon: Users },
  { title: "Attendance", icon: Clock3 },
  { title: "Leave Management", icon: CalendarCheck },
  { title: "Payroll Prep", icon: Wallet },
  { title: "Analytics", icon: BarChart3 },
  { title: "Mobile App", icon: Smartphone },
  { title: "Security", icon: ShieldCheck },
  { title: "Onboarding", icon: Rocket },
];

const featureAccents = [
  { badge: "bg-indigo-50", glow: "bg-indigo-400/20", icon: "text-indigo-600" },
  { badge: "bg-sky-50", glow: "bg-sky-400/20", icon: "text-sky-600" },
  { badge: "bg-emerald-50", glow: "bg-emerald-400/20", icon: "text-emerald-600" },
  { badge: "bg-amber-50", glow: "bg-amber-400/20", icon: "text-amber-600" },
  { badge: "bg-purple-50", glow: "bg-purple-400/20", icon: "text-purple-600" },
  { badge: "bg-pink-50", glow: "bg-pink-400/20", icon: "text-pink-600" },
  { badge: "bg-teal-50", glow: "bg-teal-400/20", icon: "text-teal-600" },
  { badge: "bg-slate-50", glow: "bg-slate-400/20", icon: "text-slate-700" },
];

function makeOrbitPositions(count, radius = 36, centerX = 50, centerY = 50) {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / count; // start at top
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // FIX: orbitPositions defined here
  const orbitPositions = useMemo(
    () => makeOrbitPositions(coreFeatures.length, 36, 50, 50),
    []
  );

  const scrollToSection = (id) => {
    const sectionAliases = {
      features: "core-features",
    };
    const resolvedId = sectionAliases[id] || id;
    const element = document.getElementById(resolvedId) || document.getElementById(id);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      scrollToSection("features");
      setIsSearchOpen(false);
      return;
    }

    if (query.includes("pricing")) {
      scrollToSection("pricing");
    } else if (query.includes("feature") || query.includes("solution")) {
      scrollToSection("features");
    } else if (query.includes("core")) {
      scrollToSection("core-features");
    } else if (query.includes("payroll")) {
      navigate("/solutions/payroll");
    } else if (query.includes("attendance")) {
      navigate("/solutions/attendance");
    } else if (query.includes("recruit")) {
      navigate("/solutions/recruitment");
    } else if (query.includes("performance")) {
      navigate("/solutions/performance");
    } else if (query.includes("demo") || query.includes("sales") || query.includes("contact")) {
      navigate("/solutions/bookdemo");
    } else if (query.includes("help") || query.includes("support") || query.includes("resource")) {
      scrollToSection("resources");
    } else if (query.includes("integration")) {
      scrollToSection("integrations");
    } else if (query.includes("privacy")) {
      scrollToSection("privacy-policy");
    } else if (query.includes("terms")) {
      scrollToSection("terms-of-service");
    } else {
      scrollToSection("features");
    }

    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden pt-24 lg:pt-28">
      {/* BACKGROUND ACCENTS */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100 opacity-40 blur-3xl"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-slate-200 opacity-40 blur-3xl"></div>
      </div>

      {/* ======================= NAVBAR======================= */}
      <header className="fixed top-0 left-0 w-full z-[100] bg-white/95 border-b border-slate-200 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-all duration-300">
        <nav className="flex w-full items-center gap-6 lg:gap-10 px-4 sm:px-6 lg:px-8 py-3 relative z-20 bg-white/60">
          <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
            <img
              src="/assets/Logo_Truerize.png"
              alt="Truerize Logo"
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="text-[22px] sm:text-[24px] lg:text-[26px] font-black tracking-tight font-sans text-[#001A7D]">
                TrueCore<span className="text-[#3B82F6]">HR</span>
              </span>
            </div>
          </Link>

          {/* CENTER LINKS */}
          <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-700 font-sans tracking-wide h-full">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-[#000080] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
            >
              Features
            </button>

            {/* SOLUTIONS */}
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1 hover:text-[#000080] transition-colors py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded">
                Solutions
                <svg
                  className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              <div className="absolute top-full -left-4 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 overflow-hidden grid gap-1">
                  <a
                    href="/solutions/recruitment"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:bg-[#000080] group-hover/item:text-white transition-colors">
                      🚀
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Recruitment
                      </div>
                      <div className="text-xs text-slate-500">
                        ATS & Onboarding
                      </div>
                    </div>
                  </a>

                  <a
                    href="/solutions/payroll"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover/item:bg-[#000080] group-hover/item:text-white transition-colors">
                      💰
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Payroll
                      </div>
                      <div className="text-xs text-slate-500">
                        Salary & Taxes
                      </div>
                    </div>
                  </a>

                  <a
                    href="/solutions/attendance"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover/item:bg-[#000080] group-hover/item:text-white transition-colors">
                      ⏰
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Time & Attendance
                      </div>
                      <div className="text-xs text-slate-500">
                        Shifts & Leaves
                      </div>
                    </div>
                  </a>

                  <a
                    href="/solutions/performance"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover/item:bg-[#000080] group-hover/item:text-white transition-colors">
                      📊
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Performance
                      </div>
                      <div className="text-xs text-slate-500">
                        Appraisals & Goals
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-[#000080] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
            >
              Pricing
            </button>

            {/* RESOURCES */}
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1 hover:text-[#000080] transition-colors py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded">
                Resources
                <svg
                  className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              <div className="absolute top-full -left-4 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 overflow-hidden grid gap-1">
                  <a
                    href="#blog"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection("blog");
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <span className="text-lg">📝</span>
                    <span className="text-sm font-medium text-slate-700 group-hover/item:text-[#000080]">
                      Blog
                    </span>
                  </a>
                  <a
                    href="#help-center"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection("help-center");
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <span className="text-lg">💡</span>
                    <span className="text-sm font-medium text-slate-700 group-hover/item:text-[#000080]">
                      Help Center
                    </span>
                  </a>
                  <a
                    href="#api-docs"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection("api-docs");
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-medium text-slate-700 group-hover/item:text-[#000080]">
                      API Docs
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full transition-colors duration-200 hover:text-[#000080] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${isSearchOpen ? "text-[#000080]" : "text-slate-900"
                }`}
            >
              {isSearchOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              )}
            </button>

            <Link
              to="/login"
              className="text-[15px] font-medium hover:text-[#000080] text-slate-900 px-2 py-1 rounded hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>

            <Link
              to="/solutions/bookdemo"
              className="hidden sm:inline-flex rounded-full text-sm font-bold text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              style={{ backgroundColor: "#000080", padding: "10px 24px" }}
            >
              Get started
            </Link>
          </div>
        </nav>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-slate-100 ${isSearchOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
            <form
              className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-300 transition-colors focus-within:ring-2 focus-within:ring-blue-200"
              onSubmit={handleSearchSubmit}
            >
              <input
                type="text"
                placeholder="Search features, pricing, payroll..."
                className="w-full py-3 px-5 text-slate-700 outline-none placeholder:text-slate-400 text-[15px] rounded-full"
                autoFocus={isSearchOpen}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search site content"
              />
              <button
                type="submit"
                className="p-3 text-slate-500 hover:text-[#000080] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ======================= MAIN CONTENT ======================= */}
      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="pt-10 pb-20 px-4 sm:px-6 lg:pt-16 lg:pb-32 relative">
          <div className="mx-auto max-w-7xl lg:flex lg:items-center lg:gap-20">
            <div className="flex-1 text-center lg:text-left mb-12 lg:mb-0">
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8 border border-slate-100 bg-white/80 rounded-2xl px-5 py-3 shadow-sm w-fit">
                <div>
                  <p className="text-xl font-extrabold text-slate-900">2x</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">
                    Faster Hiring
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">0%</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">
                    Payroll Errors
                  </p>
                </div>
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold mb-8 shadow-sm"
                style={{ color: "#000080" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: "#000080" }}
                  ></span>
                </span>
                Trusted by growing teams everywhere
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Put your HR on <br className="hidden lg:block" />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600"
                  style={{ color: "#000080" }}
                >
                  Autopilot.
                </span>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-600 mb-10 leading-relaxed">
                From onboarding to attendance, leave, and payroll, manage your
                entire employee lifecycle in one simple, powerful HRMS.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  to="/solutions/bookdemo"
                  className="rounded-full px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  style={{ backgroundColor: "#000080", pointerEvents: "visible" }}
                >
                  Book a demo
                </Link>
              </div>
            </div>

            {/* HERO DASHBOARD RIGHT */}
            <div className="flex-1 relative h-[520px] lg:h-[560px] overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10"></div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10"></div>

              <div className="flex gap-6 h-full">
                {/* COLUMN 1 */}
                <div className="flex-1 overflow-hidden activity-col">
                  <div className="activity-track activity-track-up flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                      <ActivityCard
                        title="New Hire"
                        desc="Sarah Jenkins joined Design"
                        time="2m ago"
                        icon="🎉"
                        color="bg-green-100"
                      />
                      <ActivityCard
                        title="Payroll Run"
                        desc="₹142k processed successfully"
                        time="1h ago"
                        icon="💰"
                        color="bg-blue-100"
                      />
                      <ActivityCard
                        title="Leave Request"
                        desc="Mike requested 3 days off"
                        time="3h ago"
                        icon="📅"
                        color="bg-orange-100"
                      />
                      <ActivityCard
                        title="Review Cycle"
                        desc="Q4 Reviews started"
                        time="5h ago"
                        icon="📈"
                        color="bg-purple-100"
                      />
                    </div>
                    <div className="flex flex-col gap-4" aria-hidden="true">
                      <ActivityCard
                        title="New Hire"
                        desc="Sarah Jenkins joined Design"
                        time="2m ago"
                        icon="🎉"
                        color="bg-green-100"
                      />
                      <ActivityCard
                        title="Payroll Run"
                        desc="₹142k processed successfully"
                        time="1h ago"
                        icon="💰"
                        color="bg-blue-100"
                      />
                      <ActivityCard
                        title="Leave Request"
                        desc="Mike requested 3 days off"
                        time="3h ago"
                        icon="📅"
                        color="bg-orange-100"
                      />
                      <ActivityCard
                        title="Review Cycle"
                        desc="Q4 Reviews started"
                        time="5h ago"
                        icon="📈"
                        color="bg-purple-100"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN 2 */}
                <div className="flex-1 overflow-hidden activity-col">
                  <div className="activity-track activity-track-down flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                      <ActivityCard
                        title="Expense"
                        desc="Travel reimbursement paid"
                        time="10m ago"
                        icon="💳"
                        color="bg-pink-100"
                      />
                      <ActivityCard
                        title="Attendance"
                        desc="98% On-time today"
                        time="30m ago"
                        icon="⏰"
                        color="bg-indigo-100"
                      />
                      <ActivityCard
                        title="Promotion"
                        desc="Alex promoted to Lead"
                        time="2h ago"
                        icon="⭐"
                        color="bg-yellow-100"
                      />
                      <ActivityCard
                        title="Compliance"
                        desc="Tax documents updated"
                        time="4h ago"
                        icon="🔒"
                        color="bg-teal-100"
                      />
                    </div>
                    <div className="flex flex-col gap-4" aria-hidden="true">
                      <ActivityCard
                        title="Expense"
                        desc="Travel reimbursement paid"
                        time="10m ago"
                        icon="💳"
                        color="bg-pink-100"
                      />
                      <ActivityCard
                        title="Attendance"
                        desc="98% On-time today"
                        time="30m ago"
                        icon="⏰"
                        color="bg-indigo-100"
                      />
                      <ActivityCard
                        title="Promotion"
                        desc="Alex promoted to Lead"
                        time="2h ago"
                        icon="⭐"
                        color="bg-yellow-100"
                      />
                      <ActivityCard
                        title="Compliance"
                        desc="Tax documents updated"
                        time="4h ago"
                        icon="🔒"
                        color="bg-teal-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* END HERO RIGHT */}
          </div>
        </section>

        {/* 2. CORE VALUES SECTION */}
        <section className="py-14 border-y border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
              The Truerize Standard
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                  🚀
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">5-Minute Setup</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No complex training needed.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">
                  🔒
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Secure by Design</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Data encrypted at rest.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Transparent Pricing
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No hidden implementation fees.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Direct Support</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Talk to real humans, not bots.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURE: ATTENDANCE */}
        <section className="py-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/70">
          <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 lg:items-center xl:gap-16">
            <div className="flex-1 lg:pr-2">
              <span className="inline-flex items-center gap-2 font-bold text-xs tracking-[0.28em] uppercase text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                Attendance
              </span>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-4 mb-6 leading-tight">
                A smarter way to track
                <br />
                time and presence.
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                Your team can record attendance, track work hours, monitor
                breaks, and view their entire monthly performance in one place.
                Everything syncs instantly with payroll to ensure complete
                accuracy.
              </p>

              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    ✓
                  </div>
                  <span className="text-slate-700 font-medium leading-snug">
                    Interactive attendance calendar
                  </span>
                </li>

                <li className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    ✓
                  </div>
                  <span className="text-slate-700 font-medium leading-snug">
                    Start/Stop work with a single click
                  </span>
                </li>

                <li className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    ✓
                  </div>
                  <span className="text-slate-700 font-medium leading-snug">
                    Live work-time and break-time tracking
                  </span>
                </li>

                <li className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    ✓
                  </div>
                  <span className="text-slate-700 font-medium leading-snug">
                    Apply leave or request corrections instantly
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex-1">
              <div
                className="relative rounded-3xl p-0"
                style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}
              >
                <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-gradient-to-br from-blue-200/40 via-white/10 to-purple-200/40 blur-2xl"></div>
                <div className="relative flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
                  <video
                    className="relative w-full h-auto max-w-lg sm:max-w-xl md:max-w-2xl"
                    src="/assets/attendance%20overview.mp4"
                    aria-label="Attendance overview dashboard with glassmorphism UI"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURE: PAYROLL */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:flex-row-reverse lg:gap-20">
            <div className="flex-1 mb-12 lg:mb-0">
              <span className="font-bold text-sm tracking-widest uppercase text-blue-600">
                Payroll & Expenses
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-6">
                Payroll that runs itself.
                <br />
                Error-free.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Say goodbye to spreadsheets. Truerize automatically calculates
                taxes, deductions, and bonuses based on attendance data. Run
                payroll in minutes, not days.
              </p>
              <Link
                to="/solutions/payroll"
                className="text-[#000080] font-bold hover:underline flex items-center gap-2"
              >
                Explore Payroll Features
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </Link>
            </div>

            <div className="flex-1 relative">
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div
                className="relative p-0 rotate-0 lg:rotate-1 hover:rotate-0 transition-transform duration-500"
                style={{ contentVisibility: "auto", containIntrinsicSize: "360px" }}
              >
                <div className="relative flex items-center justify-center min-h-[320px] sm:min-h-[360px]">
                  <img
                    className="relative w-full h-auto max-w-none rounded-4xl shadow-lg object-contain"
                    src="/assets/Payrollgif.gif"
                    alt="Automate Payroll Effortlessly banner"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. IMPACT STATS */}
        <section className="relative py-8 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#000080] via-[#07077a] to-[#00004d]"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-6 text-center shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur">
                <p className="text-2xl md:text-3xl font-extrabold mb-1.5">
                  50%
                </p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-blue-200 mb-1.5">
                  Time Savings
                </p>
                <p className="text-xs sm:text-sm text-blue-100">
                  Less time on Admin
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-6 text-center shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur">
                <p className="text-2xl md:text-3xl font-extrabold mb-1.5">
                  100%
                </p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-blue-200 mb-1.5">
                  Accuracy
                </p>
                <p className="text-xs sm:text-sm text-blue-100">
                  Compliance Accuracy
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-6 text-center shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur">
                <p className="text-2xl md:text-3xl font-extrabold mb-1.5">
                  24/7
                </p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-blue-200 mb-1.5">
                  Availability
                </p>
                <p className="text-xs sm:text-sm text-blue-100">
                  Employee Self-Service
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* 6. CORE FEATURES ORBIT (SECOND) - FIXED ID */}
        <section
          id="core-features"
          className="relative py-24 scroll-mt-20 overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-[#F8FAFC]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(15,23,42,0.2)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-80 w-80 rounded-full bg-slate-300/25 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 mb-5 ring-1 ring-sky-100">
                CORE FEATURES
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">
                Everything in one smart dashboard
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                From employee records to payroll prep, TrueCoreHR keeps your
                entire HR workflow connected, automated, and easy to manage.
              </p>
            </div>

            <div className="relative hidden lg:block mb-16">
              <div className="relative h-[470px]">
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div className="absolute inset-0 opacity-[0.6] [background:radial-gradient(circle_at_center,rgba(99,102,241,0.2)_0,transparent_55%)]" />
                  <div className="absolute inset-0 opacity-[0.45] [background-image:radial-gradient(rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:30px_30px]" />
                </div>

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="linkGlow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(124,139,255,0.55)" />
                      <stop
                        offset="100%"
                        stopColor="rgba(167,139,250,0.25)"
                      />
                    </linearGradient>
                  </defs>

                  <g
                    stroke="url(#linkGlow)"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    fill="none"
                  >
                    {orbitPositions.map((pos, idx) => (
                      <line key={idx} x1="50" y1="50" x2={pos.x} y2={pos.y} />
                    ))}
                  </g>

                  <g
                    stroke="rgba(99,102,241,0.6)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    fill="none"
                  >
                    <line x1="50" y1="50" x2="50" y2="14" />
                    <line x1="50" y1="50" x2="50" y2="86" />
                  </g>

                  <g fill="rgba(124,139,255,0.45)">
                    {orbitPositions.map((pos, idx) => (
                      <circle key={idx} cx={pos.x} cy={pos.y} r="1.1" />
                    ))}
                  </g>
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative flex flex-col items-center justify-center rounded-[30px] bg-gradient-to-b from-white to-slate-50/80 px-10 py-9 shadow-[0_24px_60px_rgba(15,23,42,0.16)] ring-1 ring-indigo-100/70">
                    <div className="absolute -inset-10 rounded-[40px] bg-gradient-to-br from-indigo-500/18 via-transparent to-sky-500/12 blur-3xl" />
                    <div className="relative mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600 ring-1 ring-indigo-100 shadow-[0_10px_22px_rgba(99,102,241,0.18)]">
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    </div>
                    <p className="relative text-base font-semibold text-slate-900">
                      TrueCoreHR
                    </p>
                  </div>
                </div>

                {coreFeatures.map((feature, index) => {
                  const pos = orbitPositions[index];
                  const accent = featureAccents[index] || featureAccents[0];
                  const isTopConnector = index === 1;
                  const isBottomConnector = index === 5;
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className="group relative flex items-center gap-4 rounded-[22px] bg-gradient-to-b from-white to-slate-50/80 px-5 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.16)] hover:ring-indigo-200">
                        {isTopConnector && (
                          <span className="pointer-events-none absolute left-1/2 -bottom-3 h-3 w-px -translate-x-1/2 bg-indigo-300/70" />
                        )}
                        {isBottomConnector && (
                          <span className="pointer-events-none absolute left-1/2 -top-3 h-3 w-px -translate-x-1/2 bg-indigo-300/70" />
                        )}

                        <span
                          className={`pointer-events-none absolute -inset-2 rounded-[26px] blur-2xl opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-70 ${accent.glow}`}
                        />

                        <div
                          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-200 transition-all duration-300 ease-out group-hover:scale-[1.06] ${accent.badge}`}
                        >
                          <Icon className={`h-4 w-4 ${accent.icon}`} />
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          {feature.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section
          id="integrations"
          className="py-20 bg-slate-50 border-y border-slate-100 scroll-mt-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-16">
            <div className="flex-1 mb-12 lg:mb-0">
              <span className="text-sm font-bold tracking-widest uppercase text-slate-500">
                Integrations
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-5">
                Connect your HR stack in minutes.
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Sync attendance devices, payroll tools, and collaboration apps
                without manual imports. Your data stays consistent across every
                HR workflow.
              </p>
              <Link
                to="/solutions/bookdemo"
                className="inline-flex items-center gap-2 text-[#000080] font-bold hover:underline"
              >
                Request an integration
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </Link>
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Biometric Devices",
                  description: "Plug in attendance hardware and sync instantly.",
                },
                {
                  title: "Payroll Exports",
                  description: "Generate compliant payroll files on demand.",
                },
                {
                  title: "Communication Tools",
                  description: "Notify teams in Slack, Teams, or email.",
                },
                {
                  title: "Custom APIs",
                  description: "Use secure APIs for tailored workflows.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESOURCES */}
        <section
          id="resources"
          className="py-20 bg-white border-b border-slate-100 scroll-mt-20"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-sm font-bold tracking-widest uppercase text-slate-500">
                Resources
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
                Guides, support, and developer docs.
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to evaluate, launch, and scale with
                confidence.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div
                id="blog"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Blog</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Product updates, HR tips, and compliance insights.
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@truerize.com&su=Blog%20Updates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Subscribe for updates
                </a>
              </div>
              <div
                id="help-center"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Help Center</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Quick answers, setup guides, and live support options.
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@truerize.com&su=Help%20Center%20Request"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Contact support
                </a>
              </div>
              <div
                id="api-docs"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">API Docs</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Secure endpoints for automation and custom workflows.
                </p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@truerize.com&su=API%20Docs%20Request"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Request documentation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* COMPANY */}
        <section id="about" className="py-20 bg-slate-50 border-b border-slate-100 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-sm font-bold tracking-widest uppercase text-slate-500">
                Company
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
                People-first teams deserve people-first tools.
              </h2>
              <p className="text-lg text-slate-600">
                Truerize helps modern HR teams operate with clarity, speed, and
                compliance.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">About Us</h3>
                <p className="text-sm text-slate-600">
                 At Truerize, we are committed to driving business success through innovative solutions, industry expertise, and a client-first approach. As a trusted strategic partner, we specialize in delivering a wide range of services that empower organizations to scale efficiently, adapt swiftly, and lead confidently in today’s competitive landscape.
                </p>
              </div>
              <div
                id="careers"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Careers</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Join a team focused on measurable people impact.
                </p>
                <a
                  href="mailto:support@truerize.com?subject=Careers%20Inquiry"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Send your resume
                </a>
              </div>
              <div
                id="contact"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Contact</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Talk to sales or get help setting up your HR stack.
                </p>
                <Link
                  to="/solutions/bookdemo"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Book a conversation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL */}
        <section className="py-16 bg-white border-b border-slate-100 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div
                id="privacy-policy"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Privacy Policy</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Learn how we collect, protect, and store your data.
                </p>
                <a
                  href="mailto:support@truerize.com?subject=Privacy%20Policy%20Request"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Request the full policy
                </a>
              </div>
              <div
                id="terms-of-service"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-2">Terms of Service</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Review our service commitments and usage guidelines.
                </p>
                <a
                  href="mailto:support@truerize.com?subject=Terms%20of%20Service%20Request"
                  className="text-[#000080] font-semibold hover:underline"
                >
                  Request the full terms
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section
          id="pricing"
          className="py-24 bg-white border-y border-slate-100 scroll-mt-20"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Pricing Strategy
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* BASIC */}
              <div className="relative border border-slate-200 rounded-2xl p-8 flex flex-col bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
                  Basic
                </div>
                <div className="mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Basic HRMS
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      ₹39
                    </span>
                    <span className="text-slate-500 font-medium">
                      /employee/month
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Admin Dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Company Hierarchy &
                    Org Chart
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Employee
                    Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Attendance
                    Management (Manual)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Document
                    Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Basic Notifications
                  </li>
                </ul>
                <Link
                  to="/solutions/bookdemo"
                  className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-[#000080] hover:text-[#000080] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 text-center"
                >
                  Get Started
                </Link>
              </div>

              {/* STANDARD */}
              <div className="relative border border-[#000080] bg-[#000080] rounded-2xl p-8 flex flex-col text-white shadow-2xl transform md:-translate-y-4 ring-2 ring-blue-200/40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Most Popular
                </div>

                <div className="mb-4">
                  <span className="text-sm font-bold text-blue-200 uppercase tracking-wider">
                    Standard HRMS
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ₹59
                    </span>
                    <span className="text-blue-200 text-sm font-medium">
                      /employee/month
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Performance Dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Finance Hub Reports
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Employee Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Attendance Management
                    (Manual/Biometric/Geocoding)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Document Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Leave Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Advanced Payroll (PF,
                    ESI basics)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Asset Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Advanced Notifications
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-50">
                    <span className="text-white">✓</span> Reports & Analytics
                  </li>
                </ul>
                <Link
                  to="/solutions/bookdemo"
                  className="w-full py-3 rounded-xl bg-white font-bold text-[#000080] hover:bg-blue-50 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 text-center"
                >
                  Get Started
                </Link>
              </div>

              {/* ENTERPRISE */}
              <div className="relative border border-slate-200 rounded-2xl p-8 flex flex-col bg-white hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
                  Enterprise
                </div>
                <div className="mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Enterprise HRMS
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      ₹99
                    </span>
                    <span className="text-slate-500 font-medium">
                      /employee/month
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Advanced
                    Performance Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Employee
                    Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Attendance
                    Management (Manual/Biometric)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Document
                    Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Compliance-Ready
                    Payroll (PF, ESI, PT, TDS)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Multi-Location
                    Support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Role-Based Access
                    & Audit Logs
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> API Integrations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Advanced Asset
                    Lifecycle Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> Custom Dashboards
                    & Priority Support
                  </li>
                </ul>
                <Link
                  to="/solutions/bookdemo"
                  className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-[#000080] hover:text-[#000080] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 text-center"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

            <div className="max-w-6xl mx-auto mt-4 text-right">
              <p className="text-xs font-medium text-black">
                * Local taxes (VAT, GST, etc.) will be charged in addition to the
                prices mentioned.
              </p>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-slate-50 -skew-y-3 origin-top-left -z-10 transform scale-110"></div>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
              Ready to upgrade your HR?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-10">
              Join 5,000+ companies streamlining their people operations with
              Truerize.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/solutions/bookdemo"
                className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-xl hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                style={{ backgroundColor: "#000080" }}
              >
                Get Started
              </Link>
              <Link
                to="/solutions/bookdemo"
                className="rounded-full border-2 border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes activity-scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes activity-scroll-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .activity-track-up {
          animation: activity-scroll-up 24s linear infinite;
          will-change: transform;
        }
        .activity-track-down {
          animation: activity-scroll-down 26s linear infinite;
          will-change: transform;
        }
        .activity-col:hover .activity-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .activity-track-up,
          .activity-track-down {
            animation: none;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-6 text-slate-400 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-5 mb-6">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-8 rounded bg-white flex items-center justify-center text-[#000080] font-bold text-[10px]">
                HRMS
              </div>
              <span className="font-bold text-white text-base">
                Truerize Inc.
              </span>
            </div>
            <p className="text-sm max-w-xs">
              Making work life better for everyone.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-2 text-sm">Product</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="#features"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("features");
                  }}
                  className="hover:text-white"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("pricing");
                  }}
                  className="hover:text-white"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("integrations");
                  }}
                  className="hover:text-white"
                >
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-2 text-sm">Company</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="#about"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("about");
                  }}
                  className="hover:text-white"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("careers");
                  }}
                  className="hover:text-white"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("contact");
                  }}
                  className="hover:text-white"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-4 flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a
              href="mailto:support@truerize.com"
              className="text-white font-medium hover:underline"
            >
              truecorehr@truerize.com
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/truerize1?mibextid=wwXIfr&rdid=65WKKDpfe16kx56o&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1A4sYccHf1%2F%3Fmibextid%3DwwXIfr#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a href=" https://x.com/truerize2025?s=21," target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href="https://www.linkedin.com/company/truerizeiq-strategic-solutions-pvt-ltd/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform"
            >
              <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/truerizeiq?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform"
            >
              <svg className="w-5 h-5" fill="#E4405F" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
          <p>(c) {new Date().getFullYear()} Truerize Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a
              href="#privacy-policy"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("privacy-policy");
              }}
              className="hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="#terms-of-service"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("terms-of-service");
              }}
              className="hover:text-white"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- Helper Components --- */
function FeatureCard({ title, description, icon }) {
  return (
    <div className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors duration-300 group-hover:bg-[#000080] group-hover:text-white bg-blue-50 text-blue-900">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-[#000080] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ActivityCard({ title, desc, time, icon, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 transition-all duration-300 hover:shadow-md hover:border-slate-200 cursor-default">
      <div
        className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg shrink-0`}
      >
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm leading-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 mt-1 leading-tight">{desc}</p>
        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{time}</p>
      </div>
    </div>
  );
}

function CandidateCard({ name, role, status, active }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${active ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-[#000080] text-white" : "bg-slate-200 text-slate-600"
            }`}
        >
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600">
        {status}
      </span>
    </div>
  );
}



