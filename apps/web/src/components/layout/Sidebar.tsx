import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  User,
  ShieldAlert,
  Bell,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface NavItem {
  to: string;
  translationKey: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const isSupervisor = user?.roles?.some((r) => ['supervisor', 'org_admin'].includes(r));

  const navItems: NavItem[] = [
    { to: '/app/home', translationKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/reports/daily', translationKey: 'nav.dailyReport', icon: CalendarCheck },
    { to: '/app/reports/monthly-plan', translationKey: 'nav.monthlyPlan', icon: Target },
    { to: '/app/reports/monthly-outcome', translationKey: 'nav.monthlyOutcome', icon: FileSpreadsheet },
    { to: '/app/advice', translationKey: 'nav.advice', icon: MessageSquareQuote },
    { to: '/app/notifications', translationKey: 'nav.notifications', icon: Bell },
    { to: '/app/profile', translationKey: 'nav.profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r rtl:border-r-0 rtl:border-l border-theme-border bg-theme-surface p-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Navigation Groups */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold tracking-wider text-theme-text-muted uppercase">
          {t('nav.mainMenu')}
        </p>
        <div className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[var(--primary)]' : 'opacity-70'} ${isRTL ? 'rtl-flip' : ''}`} />
                    <span className="truncate">{t(item.translationKey)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Supervisor & Admin section if applicable */}
      {(isSupervisor || user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r))) && (
        <div className="space-y-1 pt-4 border-t border-theme-border">
          <p className="px-3 text-[11px] font-bold tracking-wider text-theme-text-muted uppercase">
            {t('nav.supervisorMenu')}
          </p>
          <div className="space-y-1 pt-2">
            {isSupervisor && (
              <NavLink
                to="/supervisor/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                <ClipboardCheck className="h-4 w-4 text-[var(--primary)] shrink-0" />
                <span className="truncate">
                  {t('nav.supervisorQueue')}
                </span>
              </NavLink>
            )}

            {user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r)) && (
              <NavLink
                to="/organization/audit-log"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                <ShieldAlert className="h-4 w-4 text-[var(--info)] shrink-0" />
                <span className="truncate">
                  {t('nav.auditLog')}
                </span>
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Quick Summary card with Islamic geometric pattern */}
      <div className="mt-auto p-3.5 rounded-2xl bg-theme-surface-muted border border-theme-border text-xs text-theme-text-muted space-y-2 relative overflow-hidden islamic-pattern">
        <div className="flex items-center justify-between font-semibold text-theme-text relative z-10">
          <span>{t('dashboard.reportReminderTitle')}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border font-bold text-[var(--primary)]">
            {t('dailyReport.todayBadge')}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-theme-text-muted relative z-10">
          {t('dashboard.reportReminderDesc')}
        </p>
      </div>
    </aside>
  );
};
