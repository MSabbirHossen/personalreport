import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

export const ThemeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
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

  const options: { value: Theme; labelKey: string; icon: React.ElementType }[] = [
    { value: 'light', labelKey: 'common.themeLight', icon: Sun },
    { value: 'dark', labelKey: 'common.themeDark', icon: Moon },
    { value: 'system', labelKey: 'common.themeSystem', icon: Monitor },
  ];

  const currentOption = options.find((opt) => opt.value === theme) || options[0];
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text transition-colors border border-transparent hover:border-theme-border"
        title={`${t('common.theme')}: ${t(currentOption.labelKey)}`}
        aria-label={t('common.theme')}
      >
        <CurrentIcon className="h-4 w-4 transition-transform duration-200" />
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.theme')}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-medium text-theme-text-muted hover:text-theme-text bg-theme-surface hover:bg-theme-surface-muted border border-theme-border transition-colors shadow-xs"
      >
        <CurrentIcon className="h-4 w-4 text-[var(--primary)]" />
        <span className="hidden sm:inline">{t(currentOption.labelKey)}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-36 rounded-xl bg-theme-surface border border-theme-border shadow-md py-1 z-50 animate-fadeIn"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-theme-surface-muted text-[var(--primary)] font-bold'
                    : 'text-theme-text hover:bg-theme-surface-muted'
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-[var(--primary)]' : 'opacity-70'}`} />
                <span>{t(opt.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
