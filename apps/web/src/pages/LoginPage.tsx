import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { BPSReportLogo } from '../components/common/BPSReportLogo.js';
import { ThemeSelector } from '../components/common/ThemeSelector.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';
import { useLanguage } from '../context/LanguageContext.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, loginDemo } = useAuth();
  const { locale, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithEmail(email, password);
      navigate('/app/home');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err.message?.includes('auth/invalid-credential')
          ? 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে।'
          : err.message?.includes('Firebase Auth is not configured')
          ? 'ফায়ারবেজ এখনও কনফিগার করা হয়নি। নিচের ডেমো বাটনে ক্লিক করুন।'
          : err.message || 'লগইন ব্যর্থ হয়েছে।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      navigate('/app/home');
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(
        err.message?.includes('Firebase Google Auth is not configured')
          ? 'গুগল অথ এখনও কনফিগার করা হয়নি। নিচের ডেমো বাটনে ক্লিক করুন।'
          : err.message || 'গুগল লগইন ব্যর্থ হয়েছে।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginDemo();
      navigate('/app/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'ডেমো লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg p-4 relative transition-colors duration-200">
      {/* Top right quick utilities */}
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
            BPS <span className="text-[var(--primary)]">Report</span>
          </h1>
          <p className="text-xs text-theme-text-muted font-medium">
            {locale === 'ar'
              ? 'بيانات أفضل · مستقبل أكثر إشراقاً · منصة التقارير المؤسسية'
              : locale === 'en'
              ? 'Better Data · Brighter Future · Institutional Reporting Portal'
              : 'ব্যক্তিগত রিপোর্ট ও সামগ্রিক মূল্যায়ন প্ল্যাটফর্ম'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xl space-y-5 text-theme-text">
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-theme-border bg-theme-surface text-theme-text font-semibold text-xs hover:bg-theme-surface-muted transition-colors shadow-2xs cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {locale === 'ar'
                ? 'الدخول بحساب Google'
                : locale === 'en'
                ? 'Sign in with Google'
                : 'Google অ্যাকাউন্ট দিয়ে প্রবেশ করুন'}
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-theme-border w-full" />
            <span className="bg-theme-surface px-3 text-[11px] text-theme-text-muted uppercase font-medium absolute">
              {locale === 'ar' ? 'أو عبر البريد الإلكتروني' : locale === 'en' ? 'Or with email' : 'অথবা ইমেইল দিয়ে'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-text flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-theme-text-muted" />
                <span>
                  {locale === 'ar' ? 'عنوان البريد الإلكتروني' : locale === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                </span>
              </label>
              <input
                type="email"
                required
                placeholder="user@bps-report.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-theme-text flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-text-muted" />
                  <span>{locale === 'ar' ? 'كلمة المرور' : locale === 'en' ? 'Password' : 'পাসওয়ার্ড'}</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-[var(--primary)] hover:underline cursor-pointer"
                >
                  {locale === 'ar' ? 'نسيت كلمة المرور؟' : locale === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-sm rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer p-0.5"
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all cursor-pointer active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span>
                {loading
                  ? locale === 'ar' ? 'جارٍ تسجيل الدخول...' : locale === 'en' ? 'Signing in...' : 'লগইন হচ্ছে...'
                  : locale === 'ar' ? 'تسجيل الدخول' : locale === 'en' ? 'Sign In' : 'লগইন করুন'}
              </span>
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
            </button>
          </form>

          {/* Create an account link */}
          <div className="text-center pt-2 border-t border-theme-border">
            <p className="text-xs text-theme-text-muted">
              {locale === 'ar' ? 'ليس لديك حساب؟ ' : locale === 'en' ? 'Don’t have an account? ' : 'কোনো অ্যাকাউন্ট নেই? '}
              <Link
                to="/register"
                className="font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
              >
                {locale === 'ar' ? 'إنشاء حساب جديد' : locale === 'en' ? 'Register now' : 'নিবন্ধন করুন'}
              </Link>
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="relative flex items-center justify-center border-t border-theme-border pt-4">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs font-semibold hover:bg-brand-100/70 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>ডেমো অ্যাকাউন্ট দিয়ে দ্রুত প্রবেশ করুন (Development Only)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-theme-text-muted font-medium">
          BPS Report · Better Data · Brighter Future
        </p>
      </div>
    </div>
  );
};
