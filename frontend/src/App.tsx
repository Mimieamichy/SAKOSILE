
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SupervisorDashboardShell from "./pages/supervisor/SupervisorDashboardShell";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import MyStudentsPage from "./pages/supervisor/MyStudentsPage";
import SignIn from "./pages/SignIn";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import StudentDashboardShell from "./pages/student/StudentDashboardShell";
import StudentDashboard from "./pages/student/StudentDashboard";
import UploadWorkPage from "./pages/student/UploadWorkPage";
import StudentHelpPage from "./pages/student/StudentHelpPage";
import DashboardShell from "./pages/DashboardShell";
import DeanDashboardShell from "./pages/dean/DeanDashboardShell";
import DeanDashboard from "./pages/dean/DeanDashboard";
import DeanFacultyTab from "./pages/dean/DeanFacultyTab";
import ResetPassword from "./pages/ResetPassword";
import ForgetPassword from "./pages/ForgetPassword";
import DefenseDayPage from "./pages/DefenseDayPage";
import OddDashboardShell from "./pages/OddDashboardShell";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Role } from "./config/roles";

import HodDashboardOverview from "./pages/provost&co/HodDashboardOverview";
import ProvostDashboardOverview from "./pages/provost&co/ProvostDashboard";
import PgLecturerManagement from "./pages/provost&co/PgLecturerManagement";
import StudentSessionManagement from "./pages/provost&co/StudentSessionManagement";
import ProvostActivityLog from "./pages/provost&co/ProvostActivityLog";
import NotificationCenter from "./pages/NotificationCenter";
import FacultyScoreSheets from "./pages/faculty/FacultyScoreSheets";
import SuperAdminDashboardShell from "./pages/superadmin/SuperAdminDashboardShell";
import SuperAdminOverview from "./pages/superadmin/SuperAdminOverview";
import SchoolsManagement from "./pages/superadmin/SchoolsManagement";
import Users from "./pages/superadmin/Users";
import Analytics from "./pages/superadmin/Analytics";
import AuditLogs from "./pages/superadmin/AuditLogs";
import PGAdminDashboardShell from "./pages/pg_admin/PGAdminDashboardShell";
import PGAdminDashboard from "./pages/pg_admin/PGAdminDashboard";
import PGAdminChecklist from "./pages/pg_admin/PGAdminChecklist";
import PGAdminNotifications from "./pages/pg_admin/PGAdminNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <Admin />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                <SuperAdminDashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SuperAdminOverview />} />
            <Route path="schools" element={<SchoolsManagement />} />
            <Route path="users" element={<Users />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          <Route
            path="/pg_admin"
            element={
              <ProtectedRoute allowedRoles={[Role.PG_ADMIN]}>
                <PGAdminDashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PGAdminDashboard />} />
            <Route path="checklist" element={<PGAdminChecklist />} />
            <Route path="readiness" element={<PGAdminChecklist />} />
            <Route path="notifications" element={<PGAdminNotifications />} />
          </Route>
          
          <Route 
            path="/portal" 
            element={
              <ProtectedRoute allowedRoles={[Role.HOD, Role.PG_COORDINATOR, Role.PROVOST, Role.FACULTY_PG_REP]}>
                <DashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<HodDashboardOverview />} />
            <Route path="provost-overview" element={<ProvostDashboardOverview />} />
            <Route path="pg-lecturers" element={<PgLecturerManagement />} />
            <Route path="external-examiners" element={<PgLecturerManagement />} />
            <Route path="student-management" element={<StudentSessionManagement />} />
            <Route path="my-students" element={<MyStudentsPage />} />
            <Route path="activity-log" element={<ProvostActivityLog />} />
            <Route path="defense-day" element={<DefenseDayPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="faculty-score-sheets" element={<FacultyScoreSheets />} />
          </Route>
          
          <Route 
            path="/supervisor" 
            element={
              <ProtectedRoute allowedRoles={[Role.SUPERVISOR, Role.FACULTY_PG_REP]}>
                <SupervisorDashboardShell />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SupervisorDashboard />} />
            <Route path="my-students" element={<MyStudentsPage />} />
            <Route path="defense-day" element={<DefenseDayPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="faculty-score-sheets" element={<FacultyScoreSheets />} />
          </Route>
          
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={[Role.STUDENT]}>
                <StudentDashboardShell />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<StudentDashboard />} />
            <Route path="upload-work" element={<UploadWorkPage />} />
            <Route path="help" element={<StudentHelpPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>
          
          <Route 
            path="/dean" 
            element={
              <ProtectedRoute allowedRoles={[Role.DEAN]}>
                <DeanDashboardShell />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DeanDashboard />} />
            <Route path="faculty-lecturers" element={<DeanFacultyTab />} />
            <Route path="student-management" element={<StudentSessionManagement />} />
            <Route path="my-students" element={<MyStudentsPage />} />
            <Route path="defense-day" element={<DefenseDayPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>
          
          <Route 
            path="/defense-day" 
            element={
              <ProtectedRoute allowedRoles={[
                Role.PANEL_MEMBER, 
                Role.INTERNAL_EXAMINER, 
                Role.FACULTY_PG_REP, 
                Role.EXTERNAL_EXAMINER,
                Role.LECTURER
              ]}>
                <OddDashboardShell />
              </ProtectedRoute>
            } 
          />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forget-password" element={<ForgetPassword />} />

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
