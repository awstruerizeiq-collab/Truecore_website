import React from "react";
import {
  Plus,
  RefreshCw,
  ClipboardList,
  BarChart3,
  IndianRupee,
  FileText,
  Receipt,
  Banknote,
  Shield,
  ScrollText,
  Settings,
  TrendingUp,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  hasRouteAccess,
  openUpgradeModal,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

const FinanceHub = ({ onBack }) => {
  const navigate = useNavigate();
  const accessContext = resolveAccessContext();

  const quickActions = [
    {
      id: "manual-payroll",
      title: "Manual Payroll",
      description: "Select employee -> Input details -> Save",
      icon: <Plus size={18} />,
      route: "/admin/manualentry",
      routeKey: "manualEntry",
    },
    {
      id: "auto-generate",
      title: "Auto Generate",
      description: "Auto-calculates payroll using attendance",
      icon: <RefreshCw size={18} />,
      route: "/admin/auto-payroll-entry",
      routeKey: "autoPayroll",
    },
    {
      id: "tax-review",
      title: "Tax Review",
      description: "View pending declarations",
      icon: <ClipboardList size={18} />,
      route: "/admin/finance/tax",
      routeKey: "tax",
    },
    {
      id: "reimbursements-quick",
      title: "Reimbursements",
      description: "View pending claims",
      icon: <IndianRupee size={18} />,
      route: "/admin/finance/reimbursements",
      routeKey: "reimbursements",
    },
  ];

  const featureCards = [
    {
      id: "overview",
      title: "Overview",
      description: "Stats, graphs, employee count, payroll trends",
      icon: <BarChart3 size={28} />,
      route: "/admin/finance-overview",
      routeKey: "financeOverview",
    },
    {
      id: "payroll-management",
      title: "Payroll Management",
      description: "Manual + Auto payroll generation",
      icon: <IndianRupee size={28} />,
      route: "/admin/finance/payroll",
      routeKey: "payroll",
    },
    {
      id: "payslip-management",
      title: "Payslip Management",
      description: "Generate & download payslips",
      icon: <FileText size={28} />,
      route: "/admin/finance/payslips",
      routeKey: "payslipManagement",
    },
    {
      id: "tax-management",
      title: "Tax Management",
      description: "Review & approve declarations",
      icon: <Receipt size={28} />,
      route: "/admin/finance/tax",
      routeKey: "tax",
    },
    {
      id: "reimbursements",
      title: "Reimbursements",
      description: "Approve / reject reimbursement claims",
      icon: <Banknote size={28} />,
      route: "/admin/finance/reimbursements",
      routeKey: "reimbursements",
    },
    {
      id: "compliance",
      title: "Compliance",
      description: "PF, TDS, PT monthly reports",
      icon: <Shield size={28} />,
      route: "/admin/finance/compliance",
      routeKey: "compliance",
    },
    {
      id: "audit-logs",
      title: "Audit & Logs",
      description: "Track payroll actions",
      icon: <ScrollText size={28} />,
      route: "/admin/finance/audit-logs",
      routeKey: "auditLogs",
    },
    {
      id: "manual-entry",
      title: "Manual Entry",
      description: "Individual salary entry system",
      icon: <TrendingUp size={28} />,
      route: "/admin/manualentry",
      routeKey: "manualEntry",
    },
    {
      id: "auto-entry",
      title: "Auto Entry",
      description: "Individual salary entry system",
      icon: <Zap size={28} />,
      route: "/admin/auto-payroll-entry",
      routeKey: "autoPayroll",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Templates & pay cycle settings",
      icon: <Settings size={28} />,
      route: "/admin/finance/settings",
      routeKey: "settings",
    },
  ];

  const handleRoute = (id, route, routeKey) => {
    if (!hasRouteAccess(accessContext.role, accessContext.plan, routeKey)) {
      openUpgradeModal(routeKey || id, accessContext);
      return;
    }
    if (route) navigate(route);
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-4">
      <div className="rounded-2xl bg-blue-900 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Finance Hub</h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
            Central place to manage payroll, taxes, and compliance.
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-900 border border-blue-900 text-sm font-medium hover:bg-blue-50 shadow-sm"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900 mb-3">
          Quick Actions
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleRoute(action.id, action.route, action.routeKey)}
              className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-100 text-blue-900">
                {action.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">{action.title}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900 mb-3">
          Finance Modules
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleRoute(card.id, card.route, card.routeKey)}
              className="group relative flex flex-col justify-between rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold mb-1 text-blue-900 group-hover:underline">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs">{card.description}</p>
                </div>
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-100 text-blue-900 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-600 border border-blue-600 pointer-events-none">
                  Manage
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FinanceHub;
