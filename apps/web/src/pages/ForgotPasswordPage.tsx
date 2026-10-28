import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BPSReportLogo } from '../components/common/BPSReportLogo.js';
import { ThemeSelector } from '../components/common/ThemeSelector.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await resetPassword(email.trim());
      setSuccessMessage(t('auth.resetEmailSent'));
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(
        err.message?.includes('auth/invalid-email')
          ? t('validation.invalidEmail')
          : err.message || t('common.error')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg p-4 relative transition-colors duration-200 islamic-pattern">
      {/* Top utilities */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <LanguageSelector />
        <ThemeSelector compact={true} />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center">
            <BPSReportLogo size={52} wordmark={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-theme-text tracking-tight font-latin">
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p className="text-xs text-theme-text-muted">
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <p>{successMessage}</p>
              <p className="mt-1 text-emerald-700/80 dark:text-emerald-300/80 font-normal">
                {t('auth.resetEmailCheckSpam')}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Reset Card */}
        <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xl space-y-5 text-theme-text">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-theme-text-muted" />
                <span>{t('auth.emailLabel')}</span>
              </label>
              <input
                type="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all cursor-pointer active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span>{loading ? t('auth.resetting') : t('auth.resetButton')}</span>
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center pt-2 border-t border-theme-border">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-text-muted hover:text-[var(--primary)] transition-colors"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${isRTL ? 'rtl-flip' : ''}`} />
              <span>{t('auth.backToLogin')}</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-theme-text-muted font-medium">
          {t('common.appTitle')} · {t('common.tagline')}
        </p>
      </div>
    </div>
  );
};
