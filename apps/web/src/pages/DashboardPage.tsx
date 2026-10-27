import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { locale, isRTL } = useLanguage();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  // Formatted date according to active locale
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const localeString = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD';
  const formattedDate = new Date().toLocaleDateString(localeString, dateOptions);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Heritage Branded Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#006A4E] via-[#0B6B3A] to-[#0AA879] p-6 sm:p-8 text-white shadow-xl shadow-brand-900/15 border border-white/10 islamic-pattern">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/95 border border-white/20">
            <Clock className="h-3.5 w-3.5 text-white/90" />
            <span>{formattedDate}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {locale === 'ar'
                ? `السلام عليكم ورحمة الله، ${user?.name || 'مرحباً بك'}!`
                : locale === 'en'
                ? `Welcome, ${user?.name || 'User'}!`
                : `আসসালামু আলাইকুম, ${user?.name || 'ব্যবহারকারী'}!`}
            </h1>
            <p className="text-white/90 max-w-xl text-sm leading-relaxed">
              {locale === 'ar'
                ? 'حافظ على متابعة عبادتك ودراستك اليومية بانتظام. انقر على الزر أدناه لتعبئة تقرير اليوم.'
                : locale === 'en'
                ? 'Record and track your daily spiritual deeds and studies. Click below to complete today’s entry.'
                : 'দৈনন্দিন আমল ও পড়াশোনার হিসাব সংরক্ষণ করুন। আজকের রিপোর্টের কাজ সমাপ্ত করতে নিচের বাটনে ক্লিক করুন।'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to={`/app/reports/daily?date=${today}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#006A4E] shadow-md hover:bg-emerald-50 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarCheck className="h-4 w-4 text-[#006A4E]" />
              <span>
                {locale === 'ar'
                  ? 'إدخال تقرير اليوم'
                  : locale === 'en'
                  ? 'Submit Today’s Daily Report'
                  : 'আজকের দৈনিক রিপোর্ট দিন'}
              </span>
            </Link>
            <Link
              to={`/app/reports/monthly-plan?month=${currentMonth}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-white"
            >
              <Target className="h-4 w-4" />
              <span>
                {locale === 'ar'
                  ? 'عرض الخطة الشهرية'
                  : locale === 'en'
                  ? 'View Monthly Plan'
                  : 'মাসিক পরিকল্পনা দেখুন'}
              </span>
            </Link>
          </div>
        </div>

        {/* Decorative background Islamic geometry & glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Report Tile */}
        <Link
          to="/app/reports/daily"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--primary)] flex items-center justify-center border border-theme-border font-bold">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <ArrowUpRight className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--primary)] transition-colors ${isRTL ? 'rtl-flip' : ''}`} />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-bold text-base text-theme-text">
              {locale === 'ar' ? 'التقرير اليومي' : locale === 'en' ? 'Daily Report' : 'দৈনিক রিপোর্ট'}
            </h2>
            <p className="text-xs text-theme-text-muted">
              {locale === 'ar'
                ? 'الصلاة، القرآن، الحديث، والدراسة اليومية'
                : locale === 'en'
                ? 'Salah, Quran, Hadith, and study log'
                : 'নামাজ, কুরআন, হাদিস ও অধ্যয়নের তারিখভিত্তিক এন্ট্রি'}
            </p>
          </div>
        </Link>

        {/* Monthly Plan Tile */}
        <Link
          to="/app/reports/monthly-plan"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--info)] flex items-center justify-center border border-theme-border font-bold">
              <Target className="h-5 w-5" />
            </div>
            <ArrowUpRight className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--info)] transition-colors ${isRTL ? 'rtl-flip' : ''}`} />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-bold text-base text-theme-text">
              {locale === 'ar' ? 'الخطة الشهرية' : locale === 'en' ? 'Monthly Plan' : 'মাসিক পরিকল্পনা'}
            </h2>
            <p className="text-xs text-theme-text-muted">
              {locale === 'ar'
                ? 'تحديد الأهداف والغايات في بداية كل شهر'
                : locale === 'en'
                ? 'Set monthly goals and study benchmarks'
                : 'মাসের শুরুতেই লক্ষ্য ও টার্গেট নির্ধারণ করুন'}
            </p>
          </div>
        </Link>

        {/* Monthly Outcome Tile */}
        <Link
          to="/app/reports/monthly-outcome"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-[var(--warning)] flex items-center justify-center border border-theme-border font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <ArrowUpRight className={`h-4 w-4 text-theme-text-muted group-hover:text-[var(--warning)] transition-colors ${isRTL ? 'rtl-flip' : ''}`} />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-bold text-base text-theme-text">
              {locale === 'ar' ? 'النتائج الشهرية' : locale === 'en' ? 'Monthly Outcome' : 'মাসিক ফলাফল ও রিপোর্ট'}
            </h2>
            <p className="text-xs text-theme-text-muted">
              {locale === 'ar'
                ? 'مقارنة الإنجاز بالخطة وطباعة التقرير'
                : locale === 'en'
                ? 'Plan vs actual comparison & printable A4 sheets'
                : 'পরিকল্পনার সাথে বাস্তবায়ন তুলনা ও প্রিন্ট ফরম্যাট'}
            </p>
          </div>
        </Link>

        {/* Advice & Mentorship Tile */}
        <Link
          to="/app/advice"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-theme-surface border border-theme-border hover:border-[var(--primary)] shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-theme-surface-muted text-purple-600 dark:text-purple-400 flex items-center justify-center border border-theme-border font-bold">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <ArrowUpRight className={`h-4 w-4 text-theme-text-muted group-hover:text-purple-600 transition-colors ${isRTL ? 'rtl-flip' : ''}`} />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-bold text-base text-theme-text">
              {locale === 'ar' ? 'النصائح والملاحظات' : locale === 'en' ? 'Advice & Feedback' : 'পরামর্শ ও মূল্যায়ন'}
            </h2>
            <p className="text-xs text-theme-text-muted">
              {locale === 'ar'
                ? 'توجيهات المشرفين والملاحظات التربوية'
                : locale === 'en'
                ? 'Supervisor feedback and actionable advice'
                : 'দায়িত্বশীল ও পর্যবেক্ষকদের দেওয়া দিকনির্দেশনা'}
            </p>
          </div>
        </Link>
      </div>

      {/* Routine & Guidance Institutional Card */}
      <div className="p-6 rounded-3xl bg-theme-surface border border-theme-border shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-theme-text flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
          <span>
            {locale === 'ar'
              ? 'إرشادات وقواعد حفظ التقارير'
              : locale === 'en'
              ? 'Institutional Reporting Guidelines'
              : 'রিপোর্ট জমা দেওয়ার নিয়মাবলী ও পরামর্শ'}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-theme-text-muted">
          <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
            <div className="font-bold text-theme-text flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              <span>
                {locale === 'ar' ? '١. الانتظام اليومي' : locale === 'en' ? '1. Daily Consistency' : '১. নিয়মিত এন্ট্রি'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-theme-text-muted">
              {locale === 'ar'
                ? 'احرص على تعبئة التقرير في نهاية اليوم خلال ۳ دقائق لبناء الالتزام.'
                : locale === 'en'
                ? 'Build consistency by taking 3 minutes each evening to record your daily tasks.'
                : 'প্রতিদিনের কাজ শেষ করে রাতে ৩ মিনিটের মধ্যে রিপোর্ট পূরণ করার অভ্যাস গড়ে তুলুন।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
            <div className="font-bold text-theme-text flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--info)]" />
              <span>
                {locale === 'ar' ? '٢. دقة البيانات' : locale === 'en' ? '2. Accurate Data' : '২. সঠিক তথ্য প্রদান'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-theme-text-muted">
              {locale === 'ar'
                ? 'سجل الأرقام والدقائق بصدق وشفافية لضمان تقييم حقيقي ودقيق.'
                : locale === 'en'
                ? 'Record numbers and minutes with sincerity and precision for truthful evaluation.'
                : 'সততা ও আন্তরিকতার সাথে প্রতিটি ঘরে বাস্তব সংখ্যা ও মিনিট লিপিবদ্ধ করুন।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-theme-surface-muted border border-theme-border space-y-1.5">
            <div className="font-bold text-theme-text flex items-center gap-1.5">
              <Target className="h-4 w-4 text-[var(--warning)]" />
              <span>
                {locale === 'ar' ? '٣. المراجعة الشهرية' : locale === 'en' ? '3. Monthly Review' : '৩. মাসিক পর্যালোচনা'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-theme-text-muted">
              {locale === 'ar'
                ? 'في نهاية كل شهر، راجع الخطة وقارنها بالنتائج مع المشرف المعني.'
                : locale === 'en'
                ? 'Submit your completed monthly report for review and constructive mentorship.'
                : 'মাস শেষে সম্পূর্ণ রিপোর্ট পর্যালোচনার জন্য জমা দিন এবং দায়িত্বশীলের পরামর্শ গ্রহণ করুন।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
