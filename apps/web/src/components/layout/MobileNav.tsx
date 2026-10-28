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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-theme-border bg-theme-surface/95 backdrop-blur-md px-2 py-1.5 shadow-lg safe-area-bottom transition-colors duration-200"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.href}
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
                  <span className="text-xs mt-0.5 truncate max-w-[72px]">
                    {t(item.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
