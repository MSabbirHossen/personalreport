import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface DurationInputProps {
  id: string;
  value: number | null | undefined; // Total minutes
  onChange: (totalMinutes: number | null) => void;
  maxMinutes?: number;
  disabled?: boolean;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  id,
  value,
  onChange,
  maxMinutes,
  disabled = false,
}) => {
  const { t, formatNumber } = useLanguage();

  // Derive hours and minutes from total minutes
  const initialHours =
    typeof value === 'number' && !isNaN(value) && value >= 0
      ? String(Math.floor(value / 60))
      : '';
  const initialMinutes =
    typeof value === 'number' && !isNaN(value) && value >= 0
      ? String(value % 60)
      : '';

  const [hoursStr, setHoursStr] = useState<string>(initialHours);
  const [minutesStr, setMinutesStr] = useState<string>(initialMinutes);
  const [error, setError] = useState<string | null>(null);

  // Sync with incoming value changes (e.g. date change or reset)
  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      setHoursStr('');
      setMinutesStr('');
      setError(null);
    } else if (value >= 0) {
      const h = Math.floor(value / 60);
      const m = value % 60;
      setHoursStr(String(h));
      setMinutesStr(String(m));
      setError(null);
    } else {
      setError(t('validation.negativeNumberNotAllowed'));
    }
  }, [value, t]);

  const handleUpdate = (newHStr: string, newMStr: string) => {
    setHoursStr(newHStr);
    setMinutesStr(newMStr);

    // If both empty, value is null
    if (newHStr.trim() === '' && newMStr.trim() === '') {
      setError(null);
      onChange(null);
      return;
    }

    const h = newHStr.trim() === '' ? 0 : Number(newHStr);
    const m = newMStr.trim() === '' ? 0 : Number(newMStr);

    if (isNaN(h) || isNaN(m)) {
      setError(t('validation.invalidNumber'));
      return;
    }

    if (h < 0 || m < 0) {
      setError(t('validation.negativeNumberNotAllowed'));
      return;
    }

    if (m > 59) {
      setError(`0 - 59 ${t('common.minutes')}`);
      return;
    }

    const total = h * 60 + m;

    if (maxMinutes && total > maxMinutes) {
      const maxH = Math.floor(maxMinutes / 60);
      const maxM = maxMinutes % 60;
      setError(`${t('common.total')}: max ${formatNumber(maxH)} ${t('common.hours')} ${formatNumber(maxM)} ${t('common.minutes')}`);
      onChange(total);
      return;
    }

    setError(null);
    onChange(total);
  };

  const totalMinutes =
    (hoursStr.trim() === '' ? 0 : Number(hoursStr)) * 60 +
    (minutesStr.trim() === '' ? 0 : Number(minutesStr));

  const hasAnyInput = hoursStr.trim() !== '' || minutesStr.trim() !== '';

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-3.5">
        {/* Hours input */}
        <div>
          <label
            htmlFor={`${id}-hours`}
            className="block text-sm font-semibold text-theme-text mb-1.5"
          >
            {t('common.hours')}
          </label>
          <div className="relative">
            <input
              id={`${id}-hours`}
              type="number"
              min="0"
              step="1"
              disabled={disabled}
              value={hoursStr}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => handleUpdate(e.target.value, minutesStr)}
              className={`w-full px-3.5 py-2.5 pr-14 rtl:pr-3.5 rtl:pl-14 text-base rounded-xl border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                error
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-theme-border focus:border-[var(--primary)]'
              }`}
            />
            <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3 text-sm text-theme-text-muted pointer-events-none">
              {t('common.hours')}
            </span>
          </div>
        </div>

        {/* Minutes input */}
        <div>
          <label
            htmlFor={`${id}-minutes`}
            className="block text-sm font-semibold text-theme-text mb-1.5"
          >
            {t('common.minutes')} (0 - 59)
          </label>
          <div className="relative">
            <input
              id={`${id}-minutes`}
              type="number"
              min="0"
              max="59"
              step="1"
              disabled={disabled}
              value={minutesStr}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => handleUpdate(hoursStr, e.target.value)}
              className={`w-full px-3.5 py-2.5 pr-14 rtl:pr-3.5 rtl:pl-14 text-base rounded-xl border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                error
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-theme-border focus:border-[var(--primary)]'
              }`}
            />
            <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3 text-sm text-theme-text-muted pointer-events-none">
              {t('common.minutes')}
            </span>
          </div>
        </div>
      </div>

      {/* Live duration conversion summary badge */}
      {hasAnyInput && !error && (
        <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300 font-medium bg-brand-50/70 dark:bg-brand-950/40 px-3 py-1.5 rounded-lg">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {t('common.total')}:{' '}
            <strong>
              {Math.floor(totalMinutes / 60) > 0 ? `${formatNumber(Math.floor(totalMinutes / 60))} ${t('common.hours')} ` : ''}
              {formatNumber(totalMinutes % 60)} {t('common.minutes')}
            </strong>{' '}
            ({formatNumber(totalMinutes)} {t('common.minutes')})
          </span>
        </div>
      )}

      {/* Validation error message */}
      {error && (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
