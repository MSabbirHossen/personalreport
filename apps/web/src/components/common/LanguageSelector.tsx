import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Locale } from '../../context/LanguageContext.js';

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locales: { code: Locale; label: string; nativeName: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'bn', label: 'Bangla', nativeName: 'বাংলা', dir: 'ltr' },
    { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr' },
    { code: 'ar', label: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  ];

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-medium text-theme-text-muted hover:text-theme-text bg-theme-surface hover:bg-theme-surface-muted border border-theme-border transition-colors shadow-xs"
      >
        <Globe className="h-4 w-4 text-[var(--primary)]" />
        <span className="font-semibold">{currentLocale.nativeName}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-40 rounded-xl bg-theme-surface border border-theme-border shadow-md py-1 z-50 animate-fadeIn"
        >
          {locales.map((item) => {
            const isSelected = locale === item.code;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-theme-surface-muted text-[var(--primary)] font-bold'
                    : 'text-theme-text hover:bg-theme-surface-muted'
                }`}
                dir={item.dir}
              >
                <span>{item.nativeName}</span>
                <span className="text-[10px] text-theme-text-muted uppercase tracking-wider">
                  {item.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
