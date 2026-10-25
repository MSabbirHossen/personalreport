import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { DailyReportPage } from './pages/DailyReportPage.js';
import { MonthlyPlanPage } from './pages/MonthlyPlanPage.js';
import { MonthlyOutcomePage } from './pages/MonthlyOutcomePage.js';
import { AdvicePage } from './pages/AdvicePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { InvitePage } from './pages/InvitePage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { SupervisorDashboardPage } from './pages/SupervisorDashboardPage.js';
import { SupervisorReportReviewPage } from './pages/SupervisorReportReviewPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-sm">
        লোড হচ্ছে...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* Protected App Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/home" replace />} />
            <Route path="home" element={<DashboardPage />} />
            <Route path="reports/daily" element={<DailyReportPage />} />
            <Route path="reports/monthly-plan" element={<MonthlyPlanPage />} />
            <Route path="reports/monthly-outcome" element={<MonthlyOutcomePage />} />
            <Route path="advice" element={<AdvicePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Protected Supervisor Routes */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="dashboard" element={<SupervisorDashboardPage />} />
            <Route path="students" element={<SupervisorDashboardPage />} />
            <Route path="students/:studentId/reports" element={<SupervisorDashboardPage />} />
            <Route path="reports/:outcomeId" element={<SupervisorReportReviewPage />} />
          </Route>

          {/* Protected Organization Routes */}
          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/organization/audit-log" replace />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/app/home" replace />} />
          <Route path="*" element={<Navigate to="/app/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
