import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { PERMISSIONS } from '@reportbd/shared';
import { DashboardPage } from './pages/DashboardPage.js';
import { DailyReportPage } from './pages/DailyReportPage.js';
import { MonthlyPlanPage } from './pages/MonthlyPlanPage.js';
import { MonthlyOutcomePage } from './pages/MonthlyOutcomePage.js';
import { AdvicePage } from './pages/AdvicePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { InvitePage } from './pages/InvitePage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { SupervisorDashboardPage } from './pages/SupervisorDashboardPage.js';
import { SupervisorReportReviewPage } from './pages/SupervisorReportReviewPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <LanguageProvider defaultLocale="bn">
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public / Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/invite/:token" element={<InvitePage />} />

                {/* Protected General App Routes */}
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
                  <Route
                    path="reports/daily"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.DAILY_REPORT_READ_OWN}>
                        <DailyReportPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/monthly-plan"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.MONTHLY_PLAN_READ_OWN}>
                        <MonthlyPlanPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/monthly-outcome"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.MONTHLY_OUTCOME_READ_OWN}>
                        <MonthlyOutcomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="advice"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.ADVICE_READ_OWN}>
                        <AdvicePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.NOTIFICATIONS_READ_OWN}>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.PROFILE_READ_OWN}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Protected Supervisor Routes */}
                <Route
                  path="/supervisor"
                  element={
                    <ProtectedRoute
                      anyPermission={[
                        PERMISSIONS.SUPERVISOR_DASHBOARD_READ,
                        PERMISSIONS.SUPERVISOR_QUEUE_READ,
                        PERMISSIONS.SUPERVISOR_STUDENTS_READ,
                        PERMISSIONS.SUPERVISOR_REPORT_READ,
                      ]}
                    >
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SUPERVISOR_DASHBOARD_READ}>
                        <SupervisorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SUPERVISOR_STUDENTS_READ}>
                        <SupervisorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students/:studentId/reports"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SUPERVISOR_REPORT_READ}>
                        <SupervisorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/:outcomeId"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.SUPERVISOR_REPORT_READ}>
                        <SupervisorReportReviewPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Protected Organization Administration Routes */}
                <Route
                  path="/organization"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.ORG_AUDIT_READ}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/organization/audit-log" replace />} />
                  <Route
                    path="audit-log"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.ORG_AUDIT_READ}>
                        <AuditLogPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="/" element={<Navigate to="/app/home" replace />} />
                <Route path="*" element={<Navigate to="/app/home" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
