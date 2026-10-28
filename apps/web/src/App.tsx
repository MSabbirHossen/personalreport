import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { TextSizeProvider } from './context/TextSizeContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { BPSReportLoader } from './components/common/BPSReportLoader.js';
import { PERMISSIONS } from '@reportbd/shared';

// Lazy-loaded route components for performance, code-splitting, and minimal initial chunk size
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })));
const DailyReportPage = lazy(() => import('./pages/DailyReportPage.js').then((m) => ({ default: m.DailyReportPage })));
const MonthlyPlanPage = lazy(() => import('./pages/MonthlyPlanPage.js').then((m) => ({ default: m.MonthlyPlanPage })));
const MonthlyOutcomePage = lazy(() => import('./pages/MonthlyOutcomePage.js').then((m) => ({ default: m.MonthlyOutcomePage })));
const AdvicePage = lazy(() => import('./pages/AdvicePage.js').then((m) => ({ default: m.AdvicePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js').then((m) => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage })));
const InvitePage = lazy(() => import('./pages/InvitePage.js').then((m) => ({ default: m.InvitePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.js').then((m) => ({ default: m.NotificationsPage })));
const SupervisorDashboardPage = lazy(() => import('./pages/SupervisorDashboardPage.js').then((m) => ({ default: m.SupervisorDashboardPage })));
const SupervisorReportReviewPage = lazy(() => import('./pages/SupervisorReportReviewPage.js').then((m) => ({ default: m.SupervisorReportReviewPage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage.js').then((m) => ({ default: m.AuditLogPage })));
const DeveloperInfoPage = lazy(() => import('./pages/DeveloperInfoPage.js').then((m) => ({ default: m.DeveloperInfoPage })));

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
        <TextSizeProvider defaultSize="standard">
          <LanguageProvider defaultLocale="bn">
            <AuthProvider>
              <BrowserRouter>
                <Suspense fallback={<BPSReportLoader fullScreen={true} />}>
                  <Routes>
                {/* Public / Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route path="/developer" element={<DeveloperInfoPage />} />
                <Route path="/developer-info" element={<Navigate to="/developer" replace />} />

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
                  <Route path="developer" element={<DeveloperInfoPage />} />
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
            </Suspense>
          </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TextSizeProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};
