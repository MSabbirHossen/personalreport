import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { getVisibleNavigationGroups } from '../../config/navigation.js';
import { SystemRole, PERMISSIONS, hasPermission } from '@reportbd/shared';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const userRoles = (user?.roles || []) as SystemRole[];
  const navigationGroups = getVisibleNavigationGroups(userRoles);
  const canWriteDailyReport = hasPermission(userRoles, PERMISSIONS.DAILY_REPORT_WRITE_OWN);

  return (
    <aside className="hidden lg:flex flex-col w-72 border-r rtl:border-r-0 rtl:border-l border-theme-border bg-theme-surface p-4 sm:p-5 space-y-6 shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Navigation Groups */}
      <div className="space-y-6">
        {navigationGroups.map((group, groupIdx) => (
          <div
            key={group.id}
            className={`space-y-1.5 ${
              groupIdx > 0 ? 'pt-4 border-t border-theme-border' : ''
            }`}
          >
            <p className="px-3 text-xs font-bold tracking-wider text-theme-text-muted uppercase">
              {t(group.groupTitleKey)}
            </p>
            <div className="space-y-1 pt-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-base transition-all duration-150 ${
                        isActive
                          ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                          : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-5 w-5 shrink-0 ${
                            isActive ? 'text-[var(--primary)]' : 'opacity-70'
                          } ${isRTL ? 'rtl-flip' : ''}`}
                        />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Summary card with Islamic geometric pattern (for reporting roles) */}
      {canWriteDailyReport && (
        <div className="mt-auto p-4 space-y-2.5 rounded-2xl bg-theme-surface-muted border border-theme-border text-sm text-theme-text-muted relative overflow-hidden islamic-pattern">
          <div className="flex items-center justify-between font-bold text-sm text-theme-text relative z-10">
            <span>{t('dashboard.reportReminderTitle')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-theme-surface border border-theme-border font-bold text-[var(--primary)]">
              {t('dailyReport.todayBadge')}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-theme-text-muted relative z-10">
            {t('dashboard.reportReminderDesc')}
          </p>
        </div>
      )}
    </aside>
  );
};
