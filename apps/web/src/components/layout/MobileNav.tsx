import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();

  const navItems = [
    {
      to: '/app/home',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
    },
    {
      to: '/app/reports/daily',
      label: t('nav.dailyReport'),
      icon: CalendarCheck,
    },
    {
      to: '/app/reports/monthly-plan',
      label: t('nav.monthlyPlan'),
      icon: Target,
    },
    {
      to: '/app/reports/monthly-outcome',
      label: t('nav.monthlyOutcome'),
      icon: FileSpreadsheet,
    },
    {
      to: '/app/profile',
      label: t('nav.profile'),
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-theme-border bg-theme-surface/95 backdrop-blur-md px-2 py-1.5 shadow-lg safe-area-bottom transition-colors duration-200"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors text-center min-w-[54px] ${
                  isActive
                    ? 'text-[var(--primary)] font-bold'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[11px] mt-0.5 truncate max-w-[65px]">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
