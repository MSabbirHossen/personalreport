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

interface NavItem {
  to: string;
  labelBn: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isSupervisor = user?.roles?.some((r) => ['supervisor', 'org_admin'].includes(r));

  const navItems: NavItem[] = [
    { to: '/app/home', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/reports/daily', labelBn: 'দৈনিক রিপোর্ট', labelEn: 'Daily Entry', icon: CalendarCheck },
    { to: '/app/reports/monthly-plan', labelBn: 'মাসিক পরিকল্পনা', labelEn: 'Monthly Plan', icon: Target },
    { to: '/app/reports/monthly-outcome', labelBn: 'মাসিক ফলাফল', labelEn: 'Monthly Report', icon: FileSpreadsheet },
    { to: '/app/advice', labelBn: 'পরামর্শ ও মন্তব্য', labelEn: 'Advice', icon: MessageSquareQuote },
    { to: '/app/notifications', labelBn: 'বিজ্ঞপ্তি', labelEn: 'Notifications', icon: Bell },
    { to: '/app/profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Groups */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          মূল মেনু
        </p>
        <div className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950/60 dark:text-brand-300 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    <span>{item.labelBn}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Supervisor & Admin section if applicable */}
      {(isSupervisor || user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r))) && (
        <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            দায়িত্বশীল ও প্রশাসন
          </p>
          <div className="space-y-1 pt-2">
            {isSupervisor && (
              <NavLink
                to="/supervisor/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>রিপোর্ট পর্যালোচনা কিউ</span>
              </NavLink>
            )}

            {user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r)) && (
              <NavLink
                to="/organization/audit-log"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>অডিট ও নিরাপত্তা লগ</span>
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Quick Summary card */}
      <div className="mt-auto p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900 border border-brand-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
          <span>দৈনিক রিপোর্ট সময়</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
            আজ
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          প্রতিদিনের রিপোর্ট যথাসময়ে সংরক্ষণ করুন এবং ইতিবাচক অভ্যাস গড়ে তুলুন।
        </p>
      </div>
    </aside>
  );
};
