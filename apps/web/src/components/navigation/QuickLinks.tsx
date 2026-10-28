import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { getVisibleQuickLinks, QuickLinkItem } from '../../config/navigation.js';
import { SystemRole } from '@reportbd/shared';

const THEME_STYLES: Record<
  QuickLinkItem['themeVariant'],
  { bg: string; text: string; hoverBorder: string; iconBg: string }
> = {
  emerald: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/50',
    iconBg: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-sky-50/50 dark:bg-sky-950/20',
    text: 'text-sky-700 dark:text-sky-400',
    hoverBorder: 'hover:border-sky-500/50',
    iconBg: 'bg-sky-100/70 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  },
  amber: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/50',
    iconBg: 'bg-amber-100/70 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  purple: {
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-500/50',
    iconBg: 'bg-purple-100/70 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  rose: {
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    hoverBorder: 'hover:border-rose-500/50',
    iconBg: 'bg-rose-100/70 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

export const QuickLinks: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const userRoles = (user?.roles || []) as SystemRole[];
  const quickLinks = getVisibleQuickLinks(userRoles);

  if (quickLinks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="quick-links-heading">
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="quick-links-heading"
            className="text-lg sm:text-xl font-bold text-theme-text flex items-center gap-2"
          >
            <Zap className="h-5 w-5 text-[var(--primary)]" />
            <span>{t('rbac.quickLinksTitle')}</span>
          </h2>
          <p className="text-sm text-theme-text-muted mt-1 leading-relaxed">
            {t('rbac.quickLinksSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          const style = THEME_STYLES[item.themeVariant] || THEME_STYLES.emerald;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-theme-surface islamic-card border border-theme-border shadow-xs hover:shadow-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[160px] ${style.hoverBorder}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold border border-theme-border shadow-2xs transition-transform duration-200 group-hover:scale-105 ${style.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight
                  className={`h-4 w-4 text-theme-text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${style.text} ${
                    isRTL ? 'rtl-flip' : ''
                  }`}
                />
              </div>

              <div className="mt-4 space-y-1.5">
                <h3 className="font-bold text-base sm:text-lg text-theme-text group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm text-theme-text-muted leading-relaxed">
                  {t(item.descriptionKey)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

