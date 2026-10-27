import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  User,
  ShieldAlert,
  Bell,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface NavItem {
  to: string;
  key: string;
  labelBn: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { locale, isRTL } = useLanguage();
  const isSupervisor = user?.roles?.some((r) => ['supervisor', 'org_admin'].includes(r));

  const navItems: NavItem[] = [
    { to: '/app/home', key: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
    { to: '/app/reports/daily', key: 'dailyReport', labelBn: 'দৈনিক রিপোর্ট', labelEn: 'Daily Entry', labelAr: 'التقرير اليومي', icon: CalendarCheck },
    { to: '/app/reports/monthly-plan', key: 'monthlyPlan', labelBn: 'মাসিক পরিকল্পনা', labelEn: 'Monthly Plan', labelAr: 'الخطة الشهرية', icon: Target },
    { to: '/app/reports/monthly-outcome', key: 'monthlyOutcome', labelBn: 'মাসিক ফলাফল', labelEn: 'Monthly Report', labelAr: 'النتائج الشهرية', icon: FileSpreadsheet },
    { to: '/app/advice', key: 'advice', labelBn: 'পরামর্শ ও মন্তব্য', labelEn: 'Advice', labelAr: 'النصائح والملاحظات', icon: MessageSquareQuote },
    { to: '/app/notifications', key: 'notifications', labelBn: 'বিজ্ঞপ্তি', labelEn: 'Notifications', labelAr: 'الإشعارات', icon: Bell },
    { to: '/app/profile', key: 'profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', labelAr: 'الملف الشخصي', icon: User },
  ];

  const getLabel = (item: NavItem) => {
    if (locale === 'ar') return item.labelAr;
    if (locale === 'en') return item.labelEn;
    return item.labelBn;
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r rtl:border-r-0 rtl:border-l border-theme-border bg-theme-surface p-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Navigation Groups */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold tracking-wider text-theme-text-muted uppercase">
          {locale === 'ar' ? 'القائمة الرئيسية' : locale === 'en' ? 'Main Menu' : 'মূল মেনু'}
        </p>
        <div className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[var(--primary)]' : 'opacity-70'} ${isRTL ? 'rtl-flip' : ''}`} />
                    <span className="truncate">{getLabel(item)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Supervisor & Admin section if applicable */}
      {(isSupervisor || user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r))) && (
        <div className="space-y-1 pt-4 border-t border-theme-border">
          <p className="px-3 text-[11px] font-bold tracking-wider text-theme-text-muted uppercase">
            {locale === 'ar' ? 'المشرف والإدارة' : locale === 'en' ? 'Administration' : 'দায়িত্বশীল ও প্রশাসন'}
          </p>
          <div className="space-y-1 pt-2">
            {isSupervisor && (
              <NavLink
                to="/supervisor/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                <ClipboardCheck className="h-4 w-4 text-[var(--primary)] shrink-0" />
                <span className="truncate">
                  {locale === 'ar' ? 'قائمة مراجعة التقارير' : locale === 'en' ? 'Review Queue' : 'রিপোর্ট পর্যালোচনা কিউ'}
                </span>
              </NavLink>
            )}

            {user?.roles?.some((r) => ['org_admin', 'platform_admin'].includes(r)) && (
              <NavLink
                to="/organization/audit-log"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-theme-surface-muted text-[var(--primary)] font-bold shadow-2xs border border-[var(--border)]'
                      : 'text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text'
                  }`
                }
              >
                <ShieldAlert className="h-4 w-4 text-[var(--info)] shrink-0" />
                <span className="truncate">
                  {locale === 'ar' ? 'سجل التدقيق والأمان' : locale === 'en' ? 'Audit & Security Logs' : 'অডিট ও নিরাপত্তা লগ'}
                </span>
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Quick Summary card with Islamic geometric pattern */}
      <div className="mt-auto p-3.5 rounded-2xl bg-theme-surface-muted border border-theme-border text-xs text-theme-text-muted space-y-2 relative overflow-hidden islamic-pattern">
        <div className="flex items-center justify-between font-semibold text-theme-text relative z-10">
          <span>
            {locale === 'ar' ? 'موعد التقرير اليومي' : locale === 'en' ? 'Daily Report Window' : 'দৈনিক রিপোর্ট সময়'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border font-bold text-[var(--primary)]">
            {locale === 'ar' ? 'اليوم' : locale === 'en' ? 'Today' : 'আজ'}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-theme-text-muted relative z-10">
          {locale === 'ar'
            ? 'سجّل تقريرك اليومي في وقته لبناء عادات إيجابية مستمرة.'
            : locale === 'en'
            ? 'Keep your daily report updated on time to foster continuous positive habits.'
            : 'প্রতিদিনের রিপোর্ট যথাসময়ে সংরক্ষণ করুন এবং ইতিবাচক অভ্যাস গড়ে তুলুন।'}
        </p>
      </div>
    </aside>
  );
};
