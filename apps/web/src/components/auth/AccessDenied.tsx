import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { interpolate } from '../../i18n/index.js';

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  requiredRole,
  fallbackPath,
}) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine intelligent return destination
  const defaultHome = user?.roles?.includes('student')
    ? '/app/home'
    : user?.roles?.includes('supervisor')
    ? '/supervisor/dashboard'
    : user?.roles?.includes('org_admin')
    ? '/organization/audit-log'
    : '/app/home';

  const destination = fallbackPath || defaultHome;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-theme-surface islamic-card border border-theme-border p-6 sm:p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
        {/* Decorative pattern glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[var(--brand-red)] flex items-center justify-center border border-red-200 dark:border-red-900/50 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-theme-text tracking-tight">
            {t('rbac.accessDeniedTitle')}
          </h2>
          <p className="text-sm text-theme-text-muted leading-relaxed">
            {t('rbac.accessDeniedDesc')}
          </p>

          {(requiredPermission || requiredRole) && (
            <div className="inline-block mt-3 px-3 py-1.5 rounded-xl bg-theme-surface-muted border border-theme-border text-xs font-mono text-theme-text-muted">
              {requiredPermission && (
                <span>
                  {interpolate(t('rbac.accessDeniedRequiredPermission'), {
                    permission: requiredPermission,
                  })}
                </span>
              )}
              {!requiredPermission && requiredRole && (
                <span>Role: {requiredRole}</span>
              )}
            </div>
          )}

          <p className="text-xs text-theme-text-muted pt-2 opacity-80">
            {t('rbac.accessDeniedContactAdmin')}
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(destination)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>{t('rbac.accessDeniedBackHome')}</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-theme-surface-muted hover:bg-theme-surface text-theme-text font-medium text-sm border border-theme-border transition-all"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rtl-flip' : ''}`} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
