import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  CalendarCheck,
  Target,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';
import { QuickLinks } from '../components/navigation/QuickLinks.js';
import { PermissionGate } from '../components/auth/PermissionGate.js';
import { PERMISSIONS } from '@reportbd/shared';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const formattedDate = formatDate(new Date(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Heritage Branded Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#006A4E] via-[#0B6B3A] to-[#0AA879] p-6 sm:p-8 text-white shadow-xl shadow-brand-900/15 border border-white/10 islamic-pattern">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/95 border border-white/20">
            <Clock className="h-3.5 w-3.5 text-white/90" />
            <span>{formattedDate}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('dashboard.greeting')}, {user?.name || t('profile.studentRole')}!
            </h1>
            <p className="text-white/90 max-w-xl text-base sm:text-lg leading-relaxed">
              {t('dashboard.todaySummaryDesc')}
            </p>
          </div>

          {/* Role-Aware Banner Actions */}
          <div className="pt-2 flex flex-wrap gap-3">
            <PermissionGate permission={PERMISSIONS.DAILY_REPORT_WRITE_OWN}>
              <Link
                to={`/app/reports/daily?date=${today}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#006A4E] shadow-md hover:bg-emerald-50 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white"
              >
                <CalendarCheck className="h-5 w-5 text-[#006A4E]" />
                <span>{t('dashboard.enterDailyReportBtn')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.MONTHLY_PLAN_READ_OWN}>
              <Link
                to={`/app/reports/monthly-plan?month=${currentMonth}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-6 py-3 text-xs font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <Target className="h-5 w-5" />
                <span>{t('dashboard.viewMonthlyPlanBtn')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.SUPERVISOR_DASHBOARD_READ}>
              <Link
                to="/supervisor/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 px-4.5 py-3 text-base font-bold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <ClipboardCheck className="h-5 w-5" />
                <span>{t('nav.supervisorQueue')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.ORG_AUDIT_READ}>
              <Link
                to="/organization/audit-log"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-4.5 py-3 text-base font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <ShieldAlert className="h-5 w-5 text-emerald-100" />
                <span>{t('nav.auditLog')}</span>
              </Link>
            </PermissionGate>
          </div>
        </div>

        {/* Decorative background Islamic geometry & glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
      </div>

      {/* Prominent Role-Based Quick Links */}
      <QuickLinks />

      {/* Routine & Guidance Institutional Card */}
      <PermissionGate permission={PERMISSIONS.DAILY_REPORT_READ_OWN}>
        <div className="p-6 rounded-3xl bg-theme-surface islamic-card border border-theme-border shadow-xs space-y-4">
          <h3 className="font-bold text-xl sm:text-2xl text-theme-text flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-[var(--primary)]" />
            <span>{t('dashboard.reportReminderTitle')}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-theme-text-muted">
            <div className="p-4.5 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-2">
              <div className="font-bold text-base text-theme-text flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <span>{t('dashboard.todaySummaryTitle')}</span>
              </div>
              <p className="text-sm leading-relaxed text-theme-text-muted">
                {t('dashboard.reportReminderDesc')}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-2">
              <div className="font-bold text-base text-theme-text flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[var(--info)]" />
                <span>{t('dashboard.quickStatsTitle')}</span>
              </div>
              <p className="text-sm leading-relaxed text-theme-text-muted">
                {t('dashboard.monthlyTargetStatus')}: {t('dashboard.monthlyOutcomeSubtitle')}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-2">
              <div className="font-bold text-base text-theme-text flex items-center gap-1.5">
                <Target className="h-4 w-4 text-[var(--warning)]" />
                <span>{t('dashboard.adviceCardTitle')}</span>
              </div>
              <p className="text-sm leading-relaxed text-theme-text-muted">
                {t('dashboard.adviceCardSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
};
