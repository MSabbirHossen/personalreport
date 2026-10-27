import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CheckCircle2, AlertTriangle, Building2, UserCheck, Clock, ArrowRight, LogIn } from 'lucide-react';
import { BPSReportLoader } from '../components/common/BPSReportLoader.js';
import { BPSReportLogo } from '../components/common/BPSReportLogo.js';
import { ThemeSelector } from '../components/common/ThemeSelector.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loginWithGoogle, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('আমন্ত্রণ লিঙ্কটি অকার্যকর বা অপূর্ণ।');
      setLoading(false);
      return;
    }

    api
      .getInvitation(token)
      .then((res) => {
        setInvitationData(res);
      })
      .catch((err) => {
        setError(err.message || 'আমন্ত্রণ লিঙ্কটির মেয়াদ শেষ হয়েছে অথবা লিংকটি অকার্যকর।');
      })
      .finally(() => setLoading(false));
  }, [token]);

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
      setError(err.message || 'আমন্ত্রণ গ্রহণ করতে ব্যর্থ হয়েছে।');
      setAccepting(false);
    }
  };

  const handleGoogleLoginAndAccept = async () => {
    try {
      await loginWithGoogle();
      // Once logged in, trigger accept
      if (token) {
        handleAccept();
      }
    } catch (err: any) {
      setError(err.message || 'গুগল লগইন সম্পন্ন করা সম্ভব হয়নি।');
    }
  };

  if (loading) {
    return <BPSReportLoader fullScreen={true} label="আমন্ত্রণ যাচাই করা হচ্ছে..." />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg p-4 relative transition-colors duration-200">
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
              আমন্ত্রণ লিংকটি সক্রিয় নয়
            </h1>
            <p className="text-sm text-theme-text-muted">
              {error}
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm transition-all cursor-pointer shadow-md"
              >
                লগইন পাতায় ফিরে যান
              </button>
            </div>
          </div>
        ) : acceptedSuccess ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-theme-text">
              স্বাগতম! আমন্ত্রণ গৃহীত হয়েছে
            </h1>
            <p className="text-sm text-theme-text-muted">
              আপনার সদস্যপদ সফলভাবে সক্রিয় করা হয়েছে। আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...
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
                <span>প্রাতিষ্ঠানিক আমন্ত্রণ পত্র</span>
              </span>
              <h1 className="text-2xl font-bold text-theme-text">
                {invitationData?.organization?.nameBn || 'BPS Report প্ল্যাটফর্ম'}
              </h1>
              <p className="text-xs text-theme-text-muted mt-1 font-latin">
                {invitationData?.organization?.nameEn}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border text-start space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-text-muted">আমন্ত্রিত ইমেইল:</span>
                <span className="font-semibold text-theme-text">
                  {invitationData?.invitation?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-text-muted">নির্ধারিত দায়িত্ব / রোল:</span>
                <span className="font-semibold text-[var(--primary)] capitalize">
                  {invitationData?.invitation?.role === 'student' ? 'ছাত্র / রিপোর্টকারী' : 'পর্যবেক্ষক / দায়িত্বশীল'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-theme-border">
                <span className="text-theme-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>মেয়াদ শেষ:</span>
                </span>
                <span className="text-theme-text-muted text-[11px]">
                  {new Date(invitationData?.invitation?.expiresAt).toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {user ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-theme-text-muted">
                  আপনি <strong className="text-theme-text">{user.email}</strong> হিসেবে লগইন আছেন।
                </p>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                >
                  <span>{accepting ? 'যুক্ত করা হচ্ছে...' : 'আমন্ত্রণ গ্রহণ করে যুক্ত হোন'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-theme-text-muted">
                  আমন্ত্রণ গ্রহণ করতে দয়া করে লগইন বা সাইন আপ করুন:
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLoginAndAccept}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-muted font-medium text-xs transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Google দিয়ে প্রবেশ করে গ্রহণ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                >
                  ইমেইল ও পাসওয়ার্ড দিয়ে লগইন
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
