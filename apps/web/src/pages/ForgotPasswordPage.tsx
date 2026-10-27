import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
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
      setSuccessMessage(
        'পাসওয়ার্ড রিসেট লিংকটি সফলভাবে পাঠানো হয়েছে! অনুগ্রহ করে আপনার ইমেইল ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন।'
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(
        err.message?.includes('auth/user-not-found')
          ? 'এই ইমেইল অ্যাড্রেস দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।'
          : err.message?.includes('auth/invalid-email')
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।'
          : err.message?.includes('auth/too-many-requests')
          ? 'অতিরিক্ত অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : err.message || 'পাসওয়ার্ড রিসেট লিংক পাঠাতে ব্যর্থ হয়েছে।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-600/30">
            <span className="font-bold text-2xl">রি</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            পাসওয়ার্ড ভুলে গেছেন?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            আপনার অ্যাকাউন্টের নিবন্ধিত ইমেইল দিলে আমরা পাসওয়ার্ড রিসেটের লিংক পাঠিয়ে দেব
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <span>{successMessage}</span>
              <p className="font-normal text-[11px] text-emerald-700 dark:text-emerald-400">
                ইমেইল পেতে কয়েক মিনিট সময় লাগতে পারে। প্রয়োজনে স্প্যাম ফোল্ডার চেক করুন।
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

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>আপনার নিবন্ধিত ইমেইল অ্যাড্রেস</span>
              </label>
              <input
                type="email"
                required
                placeholder="student@bps-report.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              <span>{loading ? 'লিংক পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Back to Login & Register navigation */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>লগইনে ফিরে যান</span>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              কোনো অ্যাকাউন্ট নেই?{' '}
              <Link
                to="/register"
                className="font-semibold text-slate-700 dark:text-slate-300 hover:underline"
              >
                নতুন অ্যাকাউন্ট নিবন্ধন করুন
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400">
          সুরক্ষিত এবং গোপনীয়তা-সম্মত রিপোর্টিং প্ল্যাটফর্ম
        </p>
      </div>
    </div>
  );
};
