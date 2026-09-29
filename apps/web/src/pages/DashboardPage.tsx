import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  // Bengali current date display
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('bn-BD', dateOptions);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-brand-100">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            আসসালামু আলাইকুম, {user?.name || 'ব্যবহারকারী'}!
          </h1>
          <p className="text-brand-100 max-w-xl text-sm leading-relaxed">
            দৈনন্দিন আমল ও পড়াশোনার হিসাব সংরক্ষণ করুন। আজকের রিপোর্টের কাজ সমাপ্ত করতে নিচের বাটনে ক্লিক করুন।
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to={`/app/reports/daily?date=${today}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-md hover:bg-brand-50 transition-all active:scale-[0.98]"
            >
              <CalendarCheck className="h-4 w-4 text-brand-600" />
              <span>আজকের দৈনিক রিপোর্ট দিন</span>
            </Link>
            <Link
              to={`/app/reports/monthly-plan?month=${currentMonth}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white transition-all"
            >
              <Target className="h-4 w-4" />
              <span>মাসিক পরিকল্পনা দেখুন</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/app/reports/daily"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-semibold text-base text-slate-800 dark:text-slate-100">দৈনিক রিপোর্ট</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              নামাজ, কুরআন, হাদিস ও অধ্যয়নের তারিখভিত্তিক এন্ট্রি
            </p>
          </div>
        </Link>

        <Link
          to="/app/reports/monthly-plan"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-semibold text-base text-slate-800 dark:text-slate-100">মাসিক পরিকল্পনা</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মাসের শুরুতেই লক্ষ্য ও টার্গেট নির্ধারণ করুন
            </p>
          </div>
        </Link>

        <Link
          to="/app/reports/monthly-outcome"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-semibold text-base text-slate-800 dark:text-slate-100">মাসিক ফলাফল ও রিপোর্ট</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              পরিকল্পনার সাথে বাস্তবায়ন তুলনা ও প্রিন্ট ফরম্যাট
            </p>
          </div>
        </Link>

        <Link
          to="/app/advice"
          className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <div className="mt-4 space-y-1">
            <h2 className="font-semibold text-base text-slate-800 dark:text-slate-100">পরামর্শ ও মূল্যায়ন</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              দায়িত্বশীল ও পর্যবেক্ষকদের দেওয়া দিকনির্দেশনা
            </p>
          </div>
        </Link>
      </div>

      {/* Routine & Motivation Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          রিপোর্ট জমা দেওয়ার নিয়মাবলী ও পরামর্শ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">১. নিয়মিত এন্ট্রি</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              প্রতিদিনের কাজ শেষ করে রাতে ৩ মিনিটের মধ্যে রিপোর্ট পূরণ করার অভ্যাস গড়ে তুলুন।
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">২. সঠিক তথ্য প্রদান</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              সততা ও আন্তরিকতার সাথে প্রতিটি ঘরে বাস্তব সংখ্যা ও মিনিট লিপিবদ্ধ করুন।
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">৩. মাসিক পর্যালোচনা</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              মাস শেষে সম্পূর্ণ রিপোর্ট পর্যালোচনার জন্য জমা দিন এবং দায়িত্বশীলের পরামর্শ গ্রহণ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
