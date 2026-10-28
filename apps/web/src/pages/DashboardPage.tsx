import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';
import { QuickLinks } from '../components/navigation/QuickLinks.js';
import { PermissionGate } from '../components/auth/PermissionGate.js';
import { PERMISSIONS, SystemRole } from '@reportbd/shared';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL, formatDate } = useLanguage();
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('dashboard.greeting')}, {user?.name || t('profile.studentRole')}!
            </h1>
            <p className="text-white/90 max-w-xl text-sm leading-relaxed">
              {t('dashboard.todaySummaryDesc')}
            </p>
          </div>

          {/* Role-Aware Banner Actions */}
          <div className="pt-2 flex flex-wrap gap-3">
            <PermissionGate permission={PERMISSIONS.DAILY_REPORT_WRITE_OWN}>
              <Link
                to={`/app/reports/daily?date=${today}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#006A4E] shadow-md hover:bg-emerald-50 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white"
              >
                <CalendarCheck className="h-4 w-4 text-[#006A4E]" />
                <span>{t('dashboard.enterDailyReportBtn')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.MONTHLY_PLAN_READ_OWN}>
              <Link
                to={`/app/reports/monthly-plan?month=${currentMonth}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <Target className="h-4 w-4" />
                <span>{t('dashboard.viewMonthlyPlanBtn')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.SUPERVISOR_DASHBOARD_READ}>
              <Link
                to="/supervisor/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 px-4 py-2.5 text-sm font-bold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>{t('nav.supervisorQueue')}</span>
              </Link>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.ORG_AUDIT_READ}>
              <Link
                to="/organization/audit-log"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <ShieldAlert className="h-4 w-4 text-emerald-100" />
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

      {/* Student Personal Reporting Details Grid (Permission-Guarded) */}
      <PermissionGate permission={PERMISSIONS.DAILY_REPORT_READ_OWN}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Report Tile */}
          <Link
            to="/app/reports/daily"
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface islamic-card border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--primary)] flex items-center justify-center border border-theme-border font-bold">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <ArrowUpRight
                className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--primary)] transition-colors ${
                  isRTL ? 'rtl-flip' : ''
                }`}
              />
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="font-bold text-base text-theme-text">
                {t('nav.dailyReport')}
              </h2>
              <p className="text-xs text-theme-text-muted">
                {t('dailyReport.subtitle')}
              </p>
            </div>
          </Link>

          {/* Monthly Plan Tile */}
          <Link
            to="/app/reports/monthly-plan"
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface islamic-card border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--info)] flex items-center justify-center border border-theme-border font-bold">
                <Target className="h-5 w-5" />
              </div>
              <ArrowUpRight
                className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--info)] transition-colors ${
                  isRTL ? 'rtl-flip' : ''
                }`}
              />
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="font-bold text-base text-theme-text">
                {t('nav.monthlyPlan')}
              </h2>
              <p className="text-xs text-theme-text-muted">
                {t('dashboard.monthlyPlanSubtitle')}
              </p>
            </div>
          </Link>

          {/* Monthly Outcome Tile */}
          <Link
            to="/app/reports/monthly-outcome"
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface islamic-card border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--warning)] flex items-center justify-center border border-theme-border font-bold">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <ArrowUpRight
                className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--warning)] transition-colors ${
                  isRTL ? 'rtl-flip' : ''
                }`}
              />
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="font-bold text-base text-theme-text">
                {t('nav.monthlyOutcome')}
              </h2>
              <p className="text-xs text-theme-text-muted">
                {t('dashboard.monthlyOutcomeSubtitle')}
              </p>
            </div>
          </Link>

          {/* Advice & Mentorship Tile */}
          <Link
            to="/app/advice"
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface islamic-card border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-purple-600 dark:text-purple-400 flex items-center justify-center border border-theme-border font-bold">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <ArrowUpRight
                className={`h-4 w-4 text-theme-text-muted group-hover:text-purple-600 transition-colors ${
                  isRTL ? 'rtl-flip' : ''
                }`}
              />
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="font-bold text-base text-theme-text">
                {t('nav.advice')}
              </h2>
              <p className="text-xs text-theme-text-muted">
                {t('dashboard.adviceCardSubtitle')}
              </p>
            </div>
          </Link>
        </div>

        {/* Routine & Guidance Institutional Card */}
        <div className="p-6 rounded-3xl bg-theme-surface islamic-card border border-theme-border shadow-xs space-y-4">
          <h3 className="font-bold text-lg text-theme-text flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
            <span>{t('dashboard.reportReminderTitle')}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-theme-text-muted">
            <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
              <div className="font-bold text-theme-text flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <span>{t('dashboard.todaySummaryTitle')}</span>
              </div>
              <p className="text-xs leading-relaxed text-theme-text-muted">
                {t('dashboard.reportReminderDesc')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
              <div className="font-bold text-theme-text flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[var(--info)]" />
                <span>{t('dashboard.quickStatsTitle')}</span>
              </div>
              <p className="text-xs leading-relaxed text-theme-text-muted">
                {t('dashboard.monthlyTargetStatus')}: {t('dashboard.monthlyOutcomeSubtitle')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
              <div className="font-bold text-theme-text flex items-center gap-1.5">
                <Target className="h-4 w-4 text-[var(--warning)]" />
                <span>{t('dashboard.adviceCardTitle')}</span>
              </div>
              <p className="text-xs leading-relaxed text-theme-text-muted">
                {t('dashboard.adviceCardSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
};
