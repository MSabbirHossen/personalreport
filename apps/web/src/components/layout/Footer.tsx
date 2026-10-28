import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';
import { BPSReportLogo } from '../common/BPSReportLogo.js';
import {
  Code2,
  Heart,
  Globe,
  ExternalLink,
  Github,
  Linkedin,
  MessageCircle,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const location = useLocation();

  // If user is inside `/app` or `/supervisor` or `/organization`, link to `/app/developer`, otherwise `/developer`
  const developerPath = location.pathname.startsWith('/app')
    ? '/app/developer'
    : '/developer';

  return (
    <footer className="w-full border-t border-theme-border bg-theme-surface/80 backdrop-blur-xs transition-colors duration-200 mt-auto">
      <div className="w-full max-w-[var(--content-width,100%)] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Platform Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <BPSReportLogo size={32} wordmark={true} />
            </div>
            <p className="text-sm text-theme-text-muted leading-relaxed max-w-md">
              {t('common.tagline') || 'বাংলা-ফার্স্ট ও বহুভাষিক প্রাতিষ্ঠানিক ব্যক্তিগত রিপোর্ট ও মূল্যায়ন প্ল্যাটফর্ম — Better Data · Brighter Future'}
            </p>
            <div className="flex items-center gap-2 text-xs text-theme-text-muted pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>v1.0.0 Production</span>
              </span>
              <span>•</span>
              <span className="text-xs">Bangla · English · Arabic</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-theme-text">
              {t('nav.mainMenu')}
            </h4>
            <ul className="space-y-2 text-sm text-theme-text-muted">
              <li>
                <Link
                  to="/app/home"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link
                  to="/app/reports/daily"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {t('nav.dailyReport')}
                </Link>
              </li>
              <li>
                <Link
                  to="/app/reports/monthly-plan"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {t('nav.monthlyPlan')}
                </Link>
              </li>
              <li>
                <Link
                  to="/app/reports/monthly-outcome"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {t('nav.monthlyOutcome')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer & Creator Hub Spotlight */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{t('developer.pageCategory')}</span>
            </h4>
            <p className="text-sm text-theme-text-muted leading-relaxed">
              {t('developer.aboutVisionSubtitle')}
            </p>
            <div>
              <Link
                to={developerPath}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold bg-theme-surface-muted hover:bg-theme-surface border border-theme-border hover:border-brand-500/40 text-theme-text transition-all shadow-2xs group cursor-pointer"
              >
                <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-600 flex items-center justify-center text-white text-xs font-black group-hover:scale-105 transition-transform">
                  MS
                </div>
                <span>{t('nav.developerInfo')}</span>
                <Code2 className={`w-3.5 h-3.5 text-[var(--primary)] ${isRTL ? 'rtl-flip' : ''}`} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 border-t border-theme-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-theme-text-muted">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-start">
            <span>
              {t('developer.footerCraftedWith')}{' '}
              <Link
                to={developerPath}
                className="font-bold text-theme-text hover:text-[var(--primary)] transition-colors underline decoration-dotted"
              >
                MS Hossen
              </Link>{' '}
              (@sabb1rhossen)
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-xs font-medium text-theme-text-muted">
              {t('developer.footerTagline')}
            </span>
          </div>

          {/* Direct Social Shortcuts */}
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/+8801773511874"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-[#25D366] transition-colors"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://msabbirhossen.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-purple-500 transition-colors"
              title="Visit Portfolio"
            >
              <Globe className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/MSabbirHossen"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-indigo-500 transition-colors"
              title="GitHub Profile"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/sabb1rhossen/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-[#0A66C2] transition-colors"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <Link
              to={developerPath}
              className="p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-[var(--primary)] transition-colors"
              title={t('nav.developerInfo')}
            >
              <Code2 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
