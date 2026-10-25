import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    enabled: !!user && !!user.orgId && (user.roles?.length ?? 0) > 0,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <Link to="/app/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/20">
            <span className="font-bold text-lg">রি</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
              Report<span className="text-brand-600 dark:text-brand-400">BD</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">
              ব্যক্তিগত রিপোর্ট প্ল্যাটফর্ম
            </span>
          </div>
        </Link>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          title="থিম পরিবর্তন"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Link */}
        <Link
          to="/app/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          title="বিজ্ঞপ্তি ও আপডেট"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User profile dropdown / info */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Link
            to="/app/profile"
            className="flex items-center gap-2 group p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold text-xs ring-1 ring-brand-500/30">
              {user?.name ? user.name.charAt(0) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors">
                {user?.name || 'ব্যবহারকারী'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {user?.roles?.includes('supervisor') ? 'পর্যবেক্ষক' : 'ছাত্র'}
              </span>
            </div>
          </Link>

          <button
            onClick={logout}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
            title="লগআউট"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
