import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  FileSpreadsheet,
  User,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: '/app/home', label: 'হোম', icon: LayoutDashboard },
    { to: '/app/reports/daily', label: 'দৈনিক', icon: CalendarCheck },
    { to: '/app/reports/monthly-plan', label: 'পরিকল্পনা', icon: Target },
    { to: '/app/reports/monthly-outcome', label: 'ফলাফল', icon: FileSpreadsheet },
    { to: '/app/profile', label: 'প্রোফাইল', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 px-2 py-1.5 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-center min-w-[54px] ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[11px] mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
