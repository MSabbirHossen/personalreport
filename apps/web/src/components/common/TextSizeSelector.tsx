import React, { useState, useRef, useEffect } from 'react';
import { Type, ChevronDown, Check } from 'lucide-react';
import { useTextSize, TextSize } from '../../context/TextSizeContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

export const TextSizeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { textSize, setTextSize, cycleTextSize } = useTextSize();
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

  const options: { value: TextSize; labelKey: string; scaleLabel: string }[] = [
    { value: 'standard', labelKey: 'common.textSizeStandard', scaleLabel: '100%' },
    { value: 'large', labelKey: 'common.textSizeLarge', scaleLabel: '115%' },
    { value: 'extra-large', labelKey: 'common.textSizeExtraLarge', scaleLabel: '130%' },
  ];

  const currentOption = options.find((opt) => opt.value === textSize) || options[0];

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycleTextSize}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-theme-text-muted hover:bg-theme-surface-muted hover:text-theme-text transition-colors border border-transparent hover:border-theme-border"
        title={`${t('common.textSize')}: ${t(currentOption.labelKey)}`}
        aria-label={t('common.textSize')}
      >
        <span className="font-bold text-xs tracking-tighter select-none flex items-baseline gap-0.5">
          <span className="text-[11px]">A</span>
          <span className="text-sm">A</span>
        </span>
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
        aria-label={t('common.textSize')}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-medium text-theme-text-muted hover:text-theme-text bg-theme-surface hover:bg-theme-surface-muted border border-theme-border transition-colors shadow-xs"
      >
        <div className="flex items-baseline gap-0.5 font-bold text-[var(--primary)] leading-none select-none">
          <span className="text-[10px]">A</span>
          <span className="text-sm">A</span>
        </div>
        <span className="hidden sm:inline">{currentOption.scaleLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-44 rounded-xl bg-theme-surface border border-theme-border shadow-md py-1 z-50 animate-fadeIn"
        >
          <div className="px-3 py-1.5 border-b border-theme-border/60 text-[11px] font-semibold text-theme-text-muted uppercase tracking-wider">
            {t('common.textSize')}
          </div>
          {options.map((opt) => {
            const isSelected = textSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTextSize(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-theme-surface-muted text-[var(--primary)] font-bold'
                    : 'text-theme-text hover:bg-theme-surface-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Type className={`h-3.5 w-3.5 ${isSelected ? 'text-[var(--primary)]' : 'opacity-60'}`} />
                  <span>{t(opt.labelKey)}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

