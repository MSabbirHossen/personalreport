import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';
import { Bell, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BPSReportLogo } from '../common/BPSReportLogo.js';
import { ThemeSelector } from '../common/ThemeSelector.js';
import { LanguageSelector } from '../common/LanguageSelector.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    enabled: !!user && !!user.orgId && (user.roles?.length ?? 0) > 0,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  const getRoleLabel = () => {
    if (user?.roles?.includes('platform_admin')) return t('profile.platformAdminRole');
    if (user?.roles?.includes('org_admin')) return t('profile.orgAdminRole');
    if (user?.roles?.includes('supervisor')) return t('profile.supervisorRole');
    return t('profile.studentRole');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-theme-border bg-theme-surface/90 px-3 sm:px-6 backdrop-blur-md transition-colors duration-200 shadow-2xs">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <Link
          to="/app/home"
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-xl p-1"
        >
          <BPSReportLogo size={36} wordmark={true} />
        </Link>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Multilingual script & direction selector */}
        <LanguageSelector />

        {/* Light / Dark / System theme selector */}
        <ThemeSelector />

        {/* Notifications Link */}
        <Link
          to="/app/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text border border-transparent hover:border-theme-border transition-colors"
          title={t('nav.notifications')}
          aria-label={t('nav.notifications')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 rtl:right-auto rtl:-left-0.5 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-[var(--brand-red)] text-[10px] font-bold text-white ring-2 ring-theme-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User profile dropdown / info */}
        <div className="flex items-center gap-2 pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-theme-border">
          <Link
            to="/app/profile"
            className="flex items-center gap-2 group p-1 rounded-xl hover:bg-theme-surface-muted transition-colors"
            title={t('nav.profile')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[var(--primary)] dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-xs ring-1 ring-[var(--border-strong)]">
              {user?.name ? user.name.charAt(0) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col text-start">
              <span className="text-xs font-semibold text-theme-text group-hover:text-[var(--primary)] transition-colors">
                {user?.name || t('profile.studentRole')}
              </span>
              <span className="text-[10px] text-theme-text-muted">
                {getRoleLabel()}
              </span>
            </div>
          </Link>

          <button
            onClick={logout}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl text-theme-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
          >
            <LogOut className="h-4 w-4 rtl-flip" />
          </button>
        </div>
      </div>
    </header>
  );
};
