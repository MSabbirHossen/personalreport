import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CheckCircle2, AlertTriangle, Building2, UserCheck, Clock, ArrowRight, LogIn } from 'lucide-react';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-sm">
        আমন্ত্রণ যাচাই করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none text-center">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              আমন্ত্রণ লিংকটি সক্রিয় নয়
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-sm transition-all cursor-pointer"
              >
                লগইন পাতায় ফিরে যান
              </button>
            </div>
          </div>
        ) : acceptedSuccess ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              স্বাগতম! আমন্ত্রণ গৃহীত হয়েছে
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              আপনার সদস্যপদ সফলভাবে সক্রিয় করা হয়েছে। আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 mb-2">
                <UserCheck className="h-3.5 w-3.5" />
                <span>আমন্ত্রণ পত্র</span>
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {invitationData?.organization?.nameBn || 'Report-BPS প্ল্যাটফর্ম'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {invitationData?.organization?.nameEn}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">আমন্ত্রিত ইমেইল:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {invitationData?.invitation?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">নির্ধারিত দায়িত্ব / রোল:</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400 capitalize">
                  {invitationData?.invitation?.role === 'student' ? 'ছাত্র / রিপোর্টকারী' : 'পর্যবেক্ষক / দায়িত্বশীল'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>মেয়াদ শেষ:</span>
                </span>
                <span className="text-slate-500 text-[11px]">
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
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  আপনি <strong className="text-slate-900 dark:text-slate-200">{user.email}</strong> হিসেবে লগইন আছেন।
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  আমন্ত্রণ গ্রহণ করতে দয়া করে লগইন বা সাইন আপ করুন:
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLoginAndAccept}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-xs transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Google দিয়ে প্রবেশ করে গ্রহণ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-xs transition-all cursor-pointer"
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
