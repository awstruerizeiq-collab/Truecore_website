import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import GlobalAdminGuard from "../components/auth/GlobalAdminGuard.jsx";
import AccessDeniedPage from "../components/access/AccessDeniedPage.jsx";
import UpgradePlanModal from "../components/access/UpgradePlanModal.jsx";
import { hydrateCompanySubscriptionFromApi } from "../lib/planAccessConfig.js";

/* ===================== PUBLIC PAGES ===================== */
import HomePage from "../features/Home/pages/HomePage.jsx";
import RecruitmentPage from "../features/Home/pages/Recruitment.jsx";
import PayrollPage from "../features/Home/pages/Payroll.jsx";
import AttendancePage from "../features/Home/pages/Attendance.jsx";
import PerformancePage from "../features/Home/pages/Performance.jsx";
import BookDemo from "../features/Home/pages/BookDemo.jsx";
import LoginPage from "../LoginPage.jsx";

/* ===================== LAYOUTS ===================== */
import GlobalAdminLayout from "../features/GlobalAdmin/Layout/GlobalAdminLayout.jsx";
import AdminLayout from "../features/Admin/Layouts/AdminLayout.jsx";
import EmployeeLayout from "../features/Employee/Layouts/EmployeeLayout.jsx";
import SuperAdminLayout from "../features/Super_Admin/Layout/SuperAdminLayout.jsx";

/* ===================== SUPER ADMIN PAGES ===================== */
import EmployeeManagement from "../features/Super_Admin/pages/EmployeeManagement.jsx";
import SuperAdminAdminManagement from "../features/Super_Admin/pages/SuperAdminAdminManagement.jsx";
import SuperAdminDashboard from "../features/Super_Admin/pages/SuperAdminDashboard.jsx";
import SuperAdminPaySlip from "../features/Super_Admin/pages/PaySlip.jsx";
import AccessControlSystem from "../features/Super_Admin/pages/AccessControlSystem.jsx";
import SuperAdminDocuments from "../features/Super_Admin/pages/SuperAdminDocuments.jsx";
import SuperAttendance from "../features/Super_Admin/pages/SuperAttendance.jsx";
import SuperAdminBills from "../features/Super_Admin/pages/SuperAdminBills.jsx";
/* ===================== GLOBAL ADMIN PAGES ===================== */
import GlobalAdminDashboard from "../features/GlobalAdmin/pages/GlobalAdminDashboard.jsx";
import GlobalCompanies from "../features/GlobalAdmin/pages/GlobalCompanies.jsx";
// import SubscriptionsBilling from "../features/GlobalAdmin/pages/SubscriptionsBilling.jsx";
import SubscriptionsBilling from "../features/GlobalAdmin/pages/SubscriptionsBilling.jsx";
import UserRoleManagement from "../features/GlobalAdmin/pages/UserRoleManagement.jsx";
import ReportsAnalytics from "../features/GlobalAdmin/pages/ReportsAnalytics.jsx";
import SecurityCompliance from "../features/GlobalAdmin/pages/SecurityCompliance.jsx";
import SupportPage from "../features/Support/pages/SupportTicketsPage.jsx";
import SystemLogs from "../features/GlobalAdmin/pages/SystemLogs.jsx";
import SystemSettings from "../features/GlobalAdmin/pages/SystemSettings.jsx";
import GlobalAdminManagement from "../features/GlobalAdmin/pages/GlobalAdminManagement.jsx";
import GlobalAdminRegister from "../features/GlobalAdmin/pages/GlobalAdminRegister.jsx";

/* ===================== ADMIN PAGES ===================== */
import AdminDashboard from "../features/Admin/pages/AdminDashboard.jsx";
import AdminManagement from "../features/Admin/pages/AdminManagement.jsx";
import CompanyManagement from "../features/Admin/pages/CompanyManagement.jsx";
import AddEmployee from "../features/Admin/pages/AddEmployee.jsx";
import Financehub from "../features/Admin/pages/Financehub.jsx";
import FinanceOverview from "../features/Admin/pages/FinanceOverview.jsx";
import LeaveManagement from "../features/Admin/pages/LeaveManagement.jsx";
import ManualEntry from "../features/Admin/pages/ManualEntry.jsx";
import PayrollManagement from "../features/Admin/pages/PayrollManagement.jsx";
import PayslipManagement from "../features/Admin/pages/PaysilpManagement.jsx";
import TaxManagement from "../features/Admin/pages/TaxManagement.jsx";
import AdminReimbursements from "../features/Admin/pages/AdminReimburesement.jsx";
import FinanceSettings from "../features/Admin/pages/FinanceSettings.jsx";
import Attendance from "../features/Admin/pages/Attendance.jsx";
import AdminDocuments from "../features/Admin/pages/Documents.jsx";
import AdminNotifications from "../features/Admin/pages/Noifications.jsx";
import PerformanceDashboard from "../features/Admin/pages/PerformanceDashboard.jsx";
import Assets from "../features/Admin/pages/Assets.jsx";
import HierarchyTree from "../features/Admin/pages/HierarchyTree.jsx";
import AdminPolicies from "../features/Admin/pages/AdminPolicies.jsx";
import Compliance from "../features/Admin/pages/Compliance.jsx";
import AutoEntry from "../features/Admin/pages/AutoEntry.jsx";
import AuditLogs from "../features/Admin/pages/AuditLogs.jsx";
/* ===================== EMPLOYEE PAGES ===================== */
import EmployeeDashboard from "../features/Employee/pages/EmployeeDashboard.jsx";
import EmpAttendance from "../features/Employee/pages/Attendance.jsx";
import FinancehubEmp from "../features/Employee/pages/Financehub.jsx";
import Payslip from "../features/Employee/pages/Payslip.jsx";
import Policy from "../features/Employee/pages/Policy.jsx";
import Reimbursements from "../features/Employee/pages/Reimbursements.jsx";
import TaxDeclaration from "../features/Employee/pages/TaxDeclaration.jsx";
import Notifications from "../features/Employee/pages/Notifications.jsx";
import EmpDocuments from "../features/Employee/pages/Documents.jsx";
import EmployeeLeaveManagement from "../features/Employee/pages/EmployeeLeaveManagement.jsx";
import EmployeeAssets from "../features/Employee/pages/EmployeeAssets.jsx";
import EmployeePerformanceDashboard from "../features/Employee/pages/EmployeePerformanceDashboard.jsx";
import EmployeeExit from "../features/Employee/pages/EmployeeExit.jsx";
import EmployeeExitStatus from "../features/Employee/pages/EmployeeExitStatu.jsx";

/* ===================== TEAM LEAD (YOUR FOLDER NAMES) ===================== */
// Layout file is: src/features/TeamLead/Layouts/TeamLeadLayout.jsx
import TeamLeadLayout from "../features/TeamLead/Layouts/TeamLeadLayout.jsx";

/**
 * IMPORTANT:
 * Your TeamLead pages are named:
 * TeamLeadDashboard.jsx, TeamLeadTeam.jsx, TeamLeadPerformance.jsx,
 * TeamLeadAttendance.jsx, TeamLeadTasks.jsx, TeamLeadReports.jsx, TeamLeadSettings.jsx
 *
 * AND your error says "does not provide export named default",
 * so we import them as NAMED exports.
 */
// import TeamLeadLayout from "../features/TeamLead/Layouts/TeamLeadLayout.jsx";

import TeamLeadDashboard from "../features/TeamLead/pages/TeamLeadDashboard.jsx";
import TeamLeadTeam from "../features/TeamLead/pages/TeamLeadTeam.jsx";
import TeamLeadPerformance from "../features/TeamLead/pages/TeamLeadPerformance.jsx";
import TeamLeadAttendance from "../features/TeamLead/pages/TeamLeadAttendance.jsx";
import TeamLeadTasks from "../features/TeamLead/pages/TeamLeadTasks.jsx";
import TeamLeadNotifications from "../features/TeamLead/pages/TeamLeadNotifications.jsx";
import TeamLeadExitDetails from "../features/TeamLead/pages/TeamLeadExitDetails.jsx";
// import TeamLeadSettings from "../features/TeamLead/pages/TeamLeadSettings.jsx";

/* ===================== Auth ===================== */
import ForgotPassword from "../features/Auth/ForgotPassword.jsx";
import ResetPassword from "../features/Auth/ResetPassword.jsx";

const normalizeGlobalAdminEntryPath = () => {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname;
  if (currentPath === "/global admin" || currentPath === "/global%20admin") {
    const nextUrl = `/employee/signin${window.location.search || ""}${window.location.hash || ""}`;
    window.history.replaceState(null, "", nextUrl);
  }
};

/* ===================== APP ===================== */
export default function App() {
  normalizeGlobalAdminEntryPath();
  const [isAccessContextReady, setIsAccessContextReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAccessContext = async () => {
      const token =
        (localStorage.getItem("token") || "").trim() ||
        (sessionStorage.getItem("token") || "").trim();

      if (!token) {
        if (isMounted) setIsAccessContextReady(true);
        return;
      }

      await hydrateCompanySubscriptionFromApi({ force: true });
      if (isMounted) setIsAccessContextReady(true);
    };

    const handleCompanyContextUpdated = () => {
      hydrateCompanySubscriptionFromApi({ force: true });
    };

    bootstrapAccessContext();
    window.addEventListener("company-context-updated", handleCompanyContextUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("company-context-updated", handleCompanyContextUpdated);
    };
  }, []);

  const withProtection = (
    element,
    routeKey = "",
    requiredPermissions = [],
    allowUnauthenticated = false,
    allowUnauthenticatedRoles = [],
  ) => (
    <ProtectedRoute
      routeKey={routeKey}
      requiredPermissions={requiredPermissions}
      allowUnauthenticated={allowUnauthenticated}
      allowUnauthenticatedRoles={allowUnauthenticatedRoles}
    >
      {element}
    </ProtectedRoute>
  );

  if (!isAccessContextReady) {
    return null;
  }

  return (
    <Router>
      <UpgradePlanModal />
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/solutions/recruitment" element={<RecruitmentPage />} />
        <Route path="/solutions/payroll" element={<PayrollPage />} />
        <Route path="/solutions/attendance" element={<AttendancePage />} />
        <Route path="/solutions/performance" element={<PerformancePage />} />
        <Route path="/solutions/bookdemo" element={<BookDemo />} />
        <Route path="/employee/signin" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/employee/signin" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/global-admin/login" element={<Navigate to="/employee/signin" replace />} />
        <Route path="/global admin" element={<Navigate to="/employee/signin" replace />} />

        {/* ========== GLOBAL ADMIN ========== */}
        <Route
          path="/global-admin"
          element={
            <GlobalAdminGuard>
              {withProtection(<GlobalAdminLayout />, "", [], true, ["GLOBAL_ADMIN"])}
            </GlobalAdminGuard>
          }
        >
          <Route index element={<Navigate to="/global-admin/dashboard" replace />} />
          <Route
            path="dashboard"
            element={withProtection(<GlobalAdminDashboard />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="companies"
            element={withProtection(<GlobalCompanies />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="billing"
            element={withProtection(<SubscriptionsBilling />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route path="subscriptions" element={<Navigate to="/global-admin/billing" replace />} />
          <Route
            path="users"
            element={withProtection(<UserRoleManagement />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="reports"
            element={withProtection(<ReportsAnalytics />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="security"
            element={withProtection(<SecurityCompliance />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="support"
            element={withProtection(<SupportPage />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="support/:ticketId"
            element={withProtection(<SupportPage />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="logs"
            element={withProtection(<SystemLogs />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="settings"
            element={withProtection(<SystemSettings />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="management"
            element={withProtection(<GlobalAdminManagement />, "", [], true, ["GLOBAL_ADMIN"])}
          />
          <Route
            path="register"
            element={withProtection(<GlobalAdminRegister />, "", [], true, ["GLOBAL_ADMIN"])}
          />
        </Route>

        {/* ========== ADMIN ========== */}
        <Route path="/admin" element={withProtection(<AdminLayout />)}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={withProtection(<AdminDashboard />, "dashboard")} />
          <Route path="management" element={withProtection(<AdminManagement />, "adminManagement")} />
          <Route path="company" element={withProtection(<CompanyManagement />, "company")} />
          <Route path="add-employee" element={withProtection(<AddEmployee />, "addEmployee")} />
          <Route path="employees" element={withProtection(<EmployeeManagement />, "manageEmployee")} />
          <Route path="finance" element={withProtection(<Financehub />, "financeHub")} />
          <Route path="finance-overview" element={withProtection(<FinanceOverview />, "financeOverview")} />
          <Route path="leave-management" element={withProtection(<LeaveManagement />, "leaveManagement")} />
          <Route path="manualentry" element={withProtection(<ManualEntry />, "manualEntry")} />
          <Route path="payroll-management" element={withProtection(<PayrollManagement />, "payroll")} />
          <Route path="finance/payroll" element={withProtection(<PayrollManagement />, "payroll")} />
          <Route path="finance/payslips" element={withProtection(<PayslipManagement />, "payslipManagement")} />
          <Route path="finance/tax" element={withProtection(<TaxManagement />, "tax")} />
          <Route path="finance/reimbursements" element={withProtection(<AdminReimbursements />, "reimbursements")} />
          <Route path="attendance" element={withProtection(<Attendance />, "attendance")} />
          <Route path="documents" element={withProtection(<AdminDocuments />, "document")} />
          <Route path="support" element={withProtection(<SupportPage />, "support")} />
          <Route path="support/:ticketId" element={withProtection(<SupportPage />, "support")} />
          <Route path="notifications" element={withProtection(<AdminNotifications />, "notifications")} />
          <Route path="performance" element={withProtection(<PerformanceDashboard />, "performance")} />
          <Route path="assets" element={withProtection(<Assets />, "assets")} />
          <Route path="hierarchy" element={withProtection(<HierarchyTree />, "companyHierarchy")} />
          <Route path="policies" element={withProtection(<AdminPolicies />, "policies")} />
          <Route path="finance/compliance" element={withProtection(<Compliance />, "compliance")} />
          <Route path="auto-payroll-entry" element={withProtection(<AutoEntry />, "autoPayroll")} />
          <Route path="audit-logs" element={withProtection(<AuditLogs />, "auditLogs")} />
          <Route path="finance/audit-logs" element={withProtection(<AuditLogs />, "auditLogs")} />
          <Route path="finance/settings" element={withProtection(<FinanceSettings />, "settings")} />
        </Route>

        {/* ========== SUPER ADMIN ========== */}
        <Route path="/super-admin" element={withProtection(<SuperAdminLayout />)}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="add-employee" element={withProtection(<AddEmployee />, "addEmployee")} />
          <Route path="employees" element={withProtection(<EmployeeManagement />, "manageEmployee")} />
          <Route path="admin-management" element={withProtection(<SuperAdminAdminManagement />, "adminManagement")} />
          <Route path="company" element={withProtection(<GlobalCompanies />, "company")} />
          <Route path="dashboard" element={withProtection(<SuperAdminDashboard />, "dashboard")} />
          <Route path="payslip" element={withProtection(<SuperAdminPaySlip />, "payslip")} />
          <Route path="finance" element={withProtection(<SuperAdminDashboard />, "financeHub")} />
          <Route path="attendance" element={withProtection(<SuperAttendance />, "attendance")} />
          <Route path="access-control" element={withProtection(<AccessControlSystem />, "accessControl")} />
          <Route path="bills" element={withProtection(<SuperAdminBills />, "bills")} />
          <Route path="documents" element={withProtection(<SuperAdminDocuments />, "document")} />
          <Route path="support" element={withProtection(<SupportPage />, "support")} />
          <Route path="support/:ticketId" element={withProtection(<SupportPage />, "support")} />
        </Route>

        {/* ========== TEAM LEAD ========== */}
        <Route path="/team-lead" element={withProtection(<TeamLeadLayout />)}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={withProtection(<TeamLeadDashboard />, "teamLeadDashboard")} />
          <Route path="team" element={withProtection(<TeamLeadTeam />, "team")} />
          <Route path="performance" element={withProtection(<TeamLeadPerformance />, "performance")} />
          <Route path="attendance" element={withProtection(<TeamLeadAttendance />, "attendance")} />
          <Route path="tasks" element={withProtection(<TeamLeadTasks />, "tasks")} />
          <Route path="exit-details" element={withProtection(<TeamLeadExitDetails />, "exitDetails")} />
          <Route path="support" element={withProtection(<SupportPage />, "support")} />
          <Route path="support/:ticketId" element={withProtection(<SupportPage />, "support")} />
          <Route path="notifications" element={withProtection(<TeamLeadNotifications />, "notifications")} />
          {/* <Route path="settings" element={<TeamLeadSettings />} /> */}
        </Route>

        {/* ========== EMPLOYEE ========== */}
        <Route path="/employee" element={withProtection(<EmployeeLayout />)}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="home" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={withProtection(<EmployeeDashboard />, "home")} />
          <Route path="attendance" element={withProtection(<EmpAttendance />, "attendance")} />
          <Route path="finance" element={withProtection(<FinancehubEmp />, "financeHub")} />
          <Route path="payslip" element={withProtection(<Payslip />, "payslip")} />
          <Route path="policy" element={withProtection(<Policy />, "policy")} />
          <Route path="reimbursements" element={withProtection(<Reimbursements />, "reimbursements")} />
          <Route path="support" element={withProtection(<SupportPage />, "support")} />
          <Route path="support/:ticketId" element={withProtection(<SupportPage />, "support")} />
          <Route path="tax-declaration" element={withProtection(<TaxDeclaration />, "tax")} />
          <Route path="notifications" element={withProtection(<Notifications />, "notifications")} />
          <Route path="documents" element={withProtection(<EmpDocuments />, "document")} />
          <Route path="leaves" element={withProtection(<EmployeeLeaveManagement />, "leaveManagement")} />
          <Route path="assets" element={withProtection(<EmployeeAssets />, "assets")} />
          <Route path="performance" element={withProtection(<EmployeePerformanceDashboard />, "performance")} />
          <Route path="exit" element={withProtection(<EmployeeExit />, "exit")} />
          <Route path="exit-status" element={withProtection(<EmployeeExitStatus />, "exit")} />
        </Route>

        {/* ========== FALLBACK ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
