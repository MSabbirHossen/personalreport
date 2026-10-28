import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Sparkles,
  ExternalLink,
  Code2,
  Heart,
  Copy,
  Check,
  Mail,
  Send,
  Globe,
  Star,
  UserCheck,
  GraduationCap,
  Building2,
  Clock,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export interface SocialLinkItem {
  name: string;
  handle?: string;
  subHandle: string;
  category: 'Direct Chat' | 'Platforms' | 'Ventures';
  role: string;
  description: string;
  link: string | null;
  secondaryLink?: string;
  isEmail?: boolean;
  isUpcoming?: boolean;
  statusText?: string;
  color: string;
  bgBadge: string;
  actionLabel: string;
  icon: React.ReactNode;
  email?: string;
}

export const SOCIAL_LINKS: SocialLinkItem[] = [
  // Direct Contacts
  {
    name: 'WhatsApp',
    handle: '+8801773511874',
    subHandle: 'Direct Chat',
    category: 'Direct Chat',
    role: 'Instant Messaging & Inquiries',
    description: 'Direct WhatsApp channel for project inquiries, rapid consultations, and developer chats.',
    link: 'https://wa.me/+8801773511874',
    color: '#25D366',
    bgBadge: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/25',
    actionLabel: 'Chat on WhatsApp',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.34 1 2.5c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.29s-1.44-.71-1.66-.82c-.22-.11-.38-.16-.54.16s-.63.82-.77.98c-.14.16-.28.18-.53.06s-1.05-.39-2-1.23c-.74-.66-1.24-1.47-1.38-1.72s-.01-.38.11-.5c.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.31-.02-.43s-.54-1.3-.74-1.78c-.2-.47-.4-.41-.55-.42z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    handle: 'sabb1rhossen',
    subHandle: 'Direct Chat',
    category: 'Direct Chat',
    role: 'Real-time Tech & Community',
    description: 'Connect on Telegram for tech discussions, architecture teardowns, and engineering updates.',
    link: 'https://t.me/sabb1rhossen',
    color: '#229ED9',
    bgBadge: 'bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/25',
    actionLabel: 'Open Telegram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    ),
  },
  {
    name: 'Email',
    handle: 'mshossen724@gmail.com',
    email: 'mshossen724@gmail.com',
    subHandle: 'Official Mail',
    category: 'Direct Chat',
    role: 'Formal & Business Correspondence',
    description: 'Direct email for formal partnerships, institutional deployments, and technical consulting.',
    link: 'mailto:mshossen724@gmail.com',
    isEmail: true,
    color: '#EA4335',
    bgBadge: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/25',
    actionLabel: 'Send Email',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },

  // Platforms
  {
    name: 'Portfolio',
    handle: 'msabbirhossen.github.io',
    subHandle: 'Personal Showcase',
    category: 'Platforms',
    role: 'Live Systems & Architecture',
    description: 'Explore live web applications, system design case studies, and engineering solutions.',
    link: 'https://msabbirhossen.github.io/',
    color: '#8B5CF6',
    bgBadge: 'bg-purple-500/10 text-purple-500 border-purple-500/25',
    actionLabel: 'Visit Portfolio',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    name: 'LinkedIn',
    handle: '@sabb1rhossen',
    subHandle: 'Professional Network',
    category: 'Platforms',
    role: 'Professional Network & Career',
    description: 'Connect for collaborations, career connections, and technical insights.',
    link: 'https://www.linkedin.com/in/sabb1rhossen/',
    secondaryLink: 'https://www.linkedin.com/in/sabb1rhossen/',
    color: '#0A66C2',
    bgBadge: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/25',
    actionLabel: 'Connect on LinkedIn',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: '@sabb1rhossen',
    subHandle: 'Growth Documentation',
    category: 'Platforms',
    role: 'Tech Content & Code Teardowns',
    description: 'In-depth programming tutorials, architectural teardowns, and engineering workflows.',
    link: 'https://www.youtube.com/@sabb1rhossen',
    color: '#FF0000',
    bgBadge: 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/25',
    actionLabel: 'Visit YouTube',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    handle: '@MSabbirHossen',
    subHandle: 'Source Code & Repos',
    category: 'Platforms',
    role: 'Open Source & Full-Stack Systems',
    description: 'Explore production-grade repositories, stars, and full-stack personal systems codebases.',
    link: 'https://github.com/MSabbirHossen',
    color: '#6366F1',
    bgBadge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25',
    actionLabel: 'View GitHub',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    handle: '@sabb1rhossen',
    subHandle: 'Community & Thoughts',
    category: 'Platforms',
    role: 'Community Updates & Insights',
    description: 'Community interactions, programming thoughts, release announcements, and dev notes.',
    link: 'https://www.facebook.com/sabb1rhossen/',
    color: '#1877F2',
    bgBadge: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25',
    actionLabel: 'Follow on Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@sabb1rhossen',
    subHandle: 'Visual Stories & Work',
    category: 'Platforms',
    role: 'Creative Highlights & BTS',
    description: 'Behind the scenes snapshots, developer workspace aesthetics, and lifestyle reflections.',
    link: 'https://www.instagram.com/sabb1rhossen/',
    color: '#E4405F',
    bgBadge: 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/25',
    actionLabel: 'Follow on Instagram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },

  // Ventures
  {
    name: 'Exploratory Training Academy',
    subHandle: 'Educational Institute',
    category: 'Ventures',
    role: 'Tech Training & Mentorship',
    description: 'Exploratory Training Academy (ETA) is a complete digital education management platform designed for modern online, physical, or hybrid learning.',
    link: 'https://eta-web-omega.vercel.app/',
    isUpcoming: false,
    statusText: '',
    color: '#0284C7',
    bgBadge: 'bg-sky-500/10 text-sky-500 border-sky-500/25',
    actionLabel: 'Visit ETA',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    name: 'Part-time Coder',
    subHandle: 'Tech Company',
    category: 'Ventures',
    role: 'Software Studio & Products',
    description: 'Engineering scalable software systems, personal productivity suites, and bespoke digital solutions.',
    link: null,
    isUpcoming: true,
    statusText: 'Coming Soon',
    color: '#4F46E5',
    bgBadge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25',
    actionLabel: 'Coming Soon',
    icon: <Building2 className="w-5 h-5" />,
  },
];

export const DeveloperInfoPage: React.FC<{ isCompact?: boolean }> = ({ isCompact = false }) => {
  const { t, isRTL } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleCopyProfile = () => {
    navigator.clipboard.writeText('https://msabbirhossen.github.io/');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmail = (email = 'mshossen724@gmail.com') => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const getWhatsAppUrl = (text: string) => {
    const trimmed = text?.trim();
    return trimmed
      ? `https://wa.me/+8801773511874?text=${encodeURIComponent(trimmed)}`
      : 'https://wa.me/+8801773511874';
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = getWhatsAppUrl(feedbackText);
    window.open(url, '_blank', 'noopener,noreferrer');
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 4000);
  };

  const filteredLinks =
    filterCategory === 'All'
      ? SOCIAL_LINKS
      : SOCIAL_LINKS.filter((item) => item.category === filterCategory);

  // Compact card view (e.g. for widgets or modals)
  if (isCompact) {
    return (
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-700 to-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              MS
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-theme-text">MS Hossen</h4>
              <p className="text-xs text-theme-text-muted font-medium">Part-Time Coder • BPS_Report Creator</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            Creator
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.link || '#'}
              target={s.link ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`p-2 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-theme-text transition-all flex items-center gap-1.5 text-xs font-semibold ${
                !s.link ? 'opacity-60 cursor-default' : 'cursor-pointer'
              }`}
              title={s.name}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.name}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-sm islamic-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>{t('developer.pageCategory')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-text tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-[var(--primary)]" />
            <span>{t('developer.pageTitle')}</span>
          </h1>
          <p className="text-xs text-theme-text-muted leading-relaxed max-w-2xl">
            {t('developer.pageDescription')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleCopyEmail('mshossen724@gmail.com')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-theme-border bg-theme-surface hover:bg-theme-surface-muted text-theme-text transition-colors shadow-xs cursor-pointer"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-theme-text-muted" />}
            <span>{copiedEmail ? t('developer.emailCopied') : t('developer.copyEmail')}</span>
          </button>

          <a
            href="https://msabbirhossen.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-theme-border bg-theme-surface hover:bg-theme-surface-muted text-theme-text transition-colors shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>{t('developer.portfolioBtn')}</span>
          </a>

          <a
            href="https://www.linkedin.com/in/sabb1rhossen/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm shadow-brand-600/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('developer.linkedInBtn')}</span>
          </a>
        </div>
      </div>

      {/* Hero Developer Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600/10 via-emerald-600/5 to-theme-surface border border-brand-500/20 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-emerald-600 to-teal-500 p-0.5 shadow-lg shadow-brand-600/20 flex items-center justify-center">
                <div className="w-full h-full bg-theme-surface rounded-[22px] flex items-center justify-center text-theme-text font-black text-2xl sm:text-3xl tracking-tight">
                  MS
                </div>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-theme-surface flex items-center justify-center animate-pulse"
                title="Active Developer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-theme-text tracking-tight">
                  MS Hossen
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {t('developer.creatorRole')}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {t('developer.availableForHire')}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                {t('developer.creatorTagline')}
              </p>
              <p className="text-xs text-theme-text-muted leading-relaxed max-w-2xl font-medium">
                {t('developer.creatorBio')}
              </p>

              {/* Direct Quick Contact Badges */}
              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs font-semibold">
                <a
                  href="mailto:mshossen724@gmail.com"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text hover:text-brand-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#EA4335]" />
                  <span>mshossen724@gmail.com</span>
                </a>
                <a
                  href="https://wa.me/+8801773511874"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text hover:text-[#25D366] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp: +8801773511874</span>
                </a>
                <a
                  href="https://t.me/sabb1rhossen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text hover:text-[#229ED9] transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span>Telegram: @sabb1rhossen</span>
                </a>
                <a
                  href="https://msabbirhossen.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text hover:text-purple-500 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-purple-500" />
                  <span>msabbirhossen.github.io</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="https://msabbirhossen.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-muted text-xs font-bold text-theme-text transition-colors shadow-xs cursor-pointer"
              >
                <Globe className="w-4 h-4 text-purple-500" />
                <span>{t('developer.portfolioBtn')}</span>
              </button>
            </a>
            <a
              href="https://github.com/MSabbirHossen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-transparent hover:bg-theme-surface-muted text-xs font-bold text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>Star on GitHub</span>
              </button>
            </a>
          </div>
        </div>

        {/* Tech Stack & Core Domains Pill Strip */}
        <div className="mt-6 pt-6 border-t border-theme-border/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-theme-text-muted uppercase tracking-wider mr-1">
            {t('developer.coreToolkit')}
          </span>
          {['React 19', 'TypeScript', 'Node.js', 'Express', 'MongoDB / Prisma', 'Tailwind CSS', 'Vite', 'Multi-Language i18n', 'Arabic RTL'].map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-xl bg-theme-surface/90 border border-theme-border text-theme-text font-semibold text-[11px] shadow-2xs"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Social & Contact Channels Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-theme-text tracking-tight">
              {t('developer.channelsTitle')}
            </h3>
            <p className="text-xs text-theme-text-muted font-medium">
              {t('developer.channelsSubtitle')}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex bg-theme-surface-muted p-1 rounded-xl border border-theme-border self-start sm:self-auto">
            {[
              { id: 'All', label: t('developer.tabAll') },
              { id: 'Direct Chat', label: t('developer.tabDirectChat') },
              { id: 'Platforms', label: t('developer.tabPlatforms') },
              { id: 'Ventures', label: t('developer.tabVentures') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-theme-surface text-theme-text shadow-2xs'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredLinks.map((item) => (
            <div
              key={item.name}
              className="p-5 rounded-2xl bg-theme-surface border border-theme-border hover:border-brand-500/50 transition-all duration-200 shadow-xs flex flex-col justify-between group"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-extrabold text-theme-text tracking-tight truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-semibold text-[var(--primary)] block truncate">
                        {item.handle || item.subHandle}
                      </span>
                    </div>
                  </div>

                  {/* External Link or Copy Action */}
                  <div className="shrink-0 flex items-center">
                    {item.isUpcoming ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-theme-surface-muted text-theme-text-muted">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Soon</span>
                      </span>
                    ) : item.isEmail ? (
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(item.email)}
                        className="p-2 rounded-xl text-theme-text-muted hover:text-brand-600 hover:bg-theme-surface-muted transition-colors cursor-pointer"
                        title="Copy Email Address"
                      >
                        {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    ) : (
                      <a
                        href={item.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-theme-text-muted hover:text-brand-600 hover:bg-theme-surface-muted transition-colors"
                        title={`Open ${item.name}`}
                      >
                        <ExternalLink className={`w-4 h-4 ${isRTL ? 'rtl-flip' : ''}`} />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-theme-surface-muted text-theme-text-muted mb-1.5">
                    {item.role || item.subHandle}
                  </span>
                  <p className="text-xs text-theme-text-muted font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-theme-text-muted">
                  {item.subHandle || item.category}
                </span>
                {item.isUpcoming ? (
                  <span className="text-xs font-bold text-theme-text-muted italic">
                    {item.statusText || 'Coming Soon'}
                  </span>
                ) : item.isEmail ? (
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(item.email)}
                    className="text-xs font-bold text-[var(--primary)] group-hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{copiedEmail ? t('developer.emailCopied') : t('developer.copyEmail')}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                ) : (
                  <a
                    href={item.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[var(--primary)] group-hover:underline flex items-center gap-1"
                  >
                    <span>{item.actionLabel || 'Visit'}</span>
                    <ExternalLink className={`w-3 h-3 ${isRTL ? 'rtl-flip' : ''}`} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collaboration & Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About Vision Card */}
        <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-4 lg:col-span-1 islamic-card">
          <div className="flex items-center gap-2 text-theme-text font-bold text-base">
            <Code2 className="w-5 h-5 text-[var(--primary)]" />
            <span>{t('developer.aboutVisionTitle')}</span>
          </div>
          <p className="text-xs text-[var(--primary)] font-semibold">
            {t('developer.aboutVisionSubtitle')}
          </p>
          <div className="space-y-3 text-xs text-theme-text-muted leading-relaxed font-medium">
            <p>{t('developer.aboutVisionP1')}</p>
            <p>{t('developer.aboutVisionP2')}</p>
            <div className="p-3 bg-theme-surface-muted rounded-xl border border-theme-border space-y-1">
              <span className="text-xs font-bold text-theme-text block">
                Open to Feedback & Collaboration
              </span>
              <span className="text-xs text-theme-text-muted block">
                Got feature suggestions, questions, or ideas for improvement? Reach out on WhatsApp, Telegram, or drop a message.
              </span>
            </div>
          </div>
        </div>

        {/* Quick Connect & Feedback Box */}
        <div className="p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-theme-text font-bold text-base">
            <Mail className="w-5 h-5 text-[var(--primary)]" />
            <span>{t('developer.feedbackTitle')}</span>
          </div>
          <p className="text-xs text-theme-text-muted font-medium">
            {t('developer.feedbackSubtitle')}
          </p>

          {feedbackSent ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in my-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-theme-text">{t('developer.openingWhatsApp')}</h4>
              <p className="text-xs text-theme-text-muted max-w-sm">
                {t('developer.readyToSend')}
              </p>
              <a
                href={getWhatsAppUrl(feedbackText)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>{t('developer.clickIfNotOpened')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-2">
              <div className="flex gap-2 flex-wrap">
                {[
                  '🚀 Feature Suggestion',
                  '🐞 Bug Report',
                  '🤝 Freelance / Hire',
                  '💡 General Feedback',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setFeedbackText((prev) =>
                        prev ? `${prev}\n[Topic: ${tag}] ` : `[Topic: ${tag}] `
                      )
                    }
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-theme-surface-muted hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-theme-text transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider mb-1.5">
                  Message / Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={t('developer.feedbackPlaceholder')}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-theme-border bg-theme-surface-muted/50 focus:ring-2 focus:ring-brand-500 focus:outline-none text-theme-text resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-theme-text-muted font-medium">
                  <UserCheck className="w-4 h-4 text-[var(--primary)]" />
                  <span>{t('developer.directWhatsAppNotice')}</span>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm shadow-brand-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('developer.sendFeedbackBtn')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Developer Attribution Footer Card */}
      <div className="mt-8 pt-6 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-theme-text-muted">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            MS
          </div>
          <span>
            {t('developer.footerCraftedWith')}{' '}
            <a
              href="https://msabbirhossen.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-theme-text hover:text-[var(--primary)] transition-colors underline"
            >
              MS Hossen
            </a>{' '}
            (@sabb1rhossen / @parttimecoder)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span>{t('developer.footerTagline')}</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} {t('developer.footerRights')}</span>
        </div>
      </div>
    </div>
  );
};

export const DeveloperInfo = DeveloperInfoPage;
export default DeveloperInfoPage;
