import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { CheckCircle2, AlertTriangle, UserCheck, Clock, ArrowRight, LogIn } from 'lucide-react';
import { BPSReportLoader } from '../components/common/BPSReportLoader.js';
import { BPSReportLogo } from '../components/common/BPSReportLogo.js';
import { ThemeSelector } from '../components/common/ThemeSelector.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loginWithGoogle, refreshUser } = useAuth();
  const { t, isRTL, formatDate } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('auth.inviteInactive'));
      setLoading(false);
      return;
    }

    api
      .getInvitation(token)
      .then((res) => {
        setInvitationData(res);
      })
      .catch((err) => {
        setError(err.message || t('auth.inviteInactive'));
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      await api.acceptInvitation(token);
      await refreshUser();
      setAcceptedSuccess(true);
      setTimeout(() => {
        navigate('/app/home');
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setAccepting(false);
    }
  };

  const handleGoogleLoginAndAccept = async () => {
    try {
      await loginWithGoogle();
      if (token) {
        handleAccept();
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  if (loading) {
    return <BPSReportLoader fullScreen={true} label={t('common.loading')} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg p-4 relative transition-colors duration-200 islamic-pattern">
      {/* Top utilities */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <LanguageSelector />
        <ThemeSelector compact={true} />
      </div>

      <div className="w-full max-w-md bg-theme-surface rounded-3xl border border-theme-border p-8 shadow-xl text-center text-theme-text">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-theme-text">
              {t('auth.inviteInactive')}
            </h1>
            <p className="text-sm text-theme-text-muted">
              {error}
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm transition-all cursor-pointer shadow-md"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </div>
        ) : acceptedSuccess ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-theme-text">
              {t('auth.inviteAccepted')}
            </h1>
            <p className="text-sm text-theme-text-muted">
              {t('auth.inviteAcceptedDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex justify-center">
              <BPSReportLogo size={56} wordmark={false} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-theme-surface-muted text-[var(--primary)] border border-theme-border mb-2">
                <UserCheck className="h-3.5 w-3.5" />
                <span>{t('auth.inviteTitle')}</span>
              </span>
              <h1 className="text-2xl font-bold text-theme-text">
                {invitationData?.organization?.nameBn || t('common.appTitle')}
              </h1>
              <p className="text-xs text-theme-text-muted mt-1 font-latin">
                {invitationData?.organization?.nameEn}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border text-start space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-text-muted">{t('auth.emailLabel')}:</span>
                <span className="font-semibold text-theme-text">
                  {invitationData?.invitation?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-text-muted">{t('auth.inviteRole')}</span>
                <span className="font-semibold text-[var(--primary)] capitalize">
                  {invitationData?.invitation?.role === 'student'
                    ? t('profile.studentRole')
                    : t('profile.supervisorRole')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-theme-border">
                <span className="text-theme-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{t('auth.inviteExpires')}</span>
                </span>
                <span className="text-theme-text-muted text-xs">
                  {invitationData?.invitation?.expiresAt ? formatDate(invitationData.invitation.expiresAt) : '-'}
                </span>
              </div>
            </div>

            {user ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-theme-text-muted">
                  {t('auth.inviteLoggedInAs')} <strong className="text-theme-text">{user.email}</strong>
                </p>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                >
                  <span>{accepting ? t('auth.inviteAccepting') : t('auth.inviteAcceptButton')}</span>
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-theme-text-muted">
                  {t('auth.inviteLoginPrompt')}
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLoginAndAccept}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-muted font-medium text-xs transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t('auth.googleLogin')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                >
                  {t('auth.loginButton')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
