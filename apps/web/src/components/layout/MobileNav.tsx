import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { getVisibleMobileNavItems } from '../../config/navigation.js';
import { SystemRole } from '@reportbd/shared';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const userRoles = (user?.roles || []) as SystemRole[];
  const navItems = getVisibleMobileNavItems(userRoles);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-theme-border bg-theme-surface/95 backdrop-blur-md px-1.5 py-1.5 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-colors duration-200"
    >
      <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={({ isActive }) =>
                `group relative flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all duration-200 text-center min-w-[58px] flex-1 active:scale-95 ${
                  isActive
                    ? 'text-[var(--primary)] font-bold bg-[var(--primary)]/10 dark:bg-[var(--primary)]/15 shadow-2xs'
                    : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-muted/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2 group-hover:scale-105'
                    }`}
                  />
                  <span
                    className={`text-[11px] mt-1 leading-tight tracking-tight truncate max-w-[76px] ${
                      isActive ? 'font-bold text-[var(--primary)]' : 'font-medium'
                    }`}
                  >
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-[var(--primary)] shadow-xs animate-fadeIn" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
