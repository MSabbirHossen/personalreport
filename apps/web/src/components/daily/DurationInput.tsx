import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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
      setError('নেতিবাচক সময় গ্রহণযোগ্য নয়');
    }
  }, [value]);

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
      setError('অনুগ্রহ করে সঠিক সংখ্যা লিখুন');
      return;
    }

    if (h < 0 || m < 0) {
      setError('ঘণ্টা বা মিনিট নেতিবাচক হতে পারবে না');
      return;
    }

    if (m > 59) {
      setError('মিনিট অবশ্যই ০ থেকে ৫৯ এর মধ্যে হতে হবে');
      return;
    }

    const total = h * 60 + m;

    if (maxMinutes && total > maxMinutes) {
      setError(`সর্বোচ্চ সময়সীমা ${Math.floor(maxMinutes / 60)} ঘণ্টা ${maxMinutes % 60} মিনিট`);
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

  const toBn = (num: number) =>
    String(num).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Hours input */}
        <div>
          <label
            htmlFor={`${id}-hours`}
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            ঘণ্টা (Hours)
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
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                error
                  ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
              }`}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
              ঘণ্টা
            </span>
          </div>
        </div>

        {/* Minutes input */}
        <div>
          <label
            htmlFor={`${id}-minutes`}
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            মিনিট (0 - 59)
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
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                error
                  ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
              }`}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
              মিনিট
            </span>
          </div>
        </div>
      </div>

      {/* Live duration conversion summary badge */}
      {hasAnyInput && !error && (
        <div className="flex items-center gap-1.5 text-[11px] text-brand-700 dark:text-brand-300 font-medium bg-brand-50/70 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            মোট সময়:{' '}
            <strong>
              {Math.floor(totalMinutes / 60) > 0 ? `${toBn(Math.floor(totalMinutes / 60))}ঘ ` : ''}
              {toBn(totalMinutes % 60)}মি
            </strong>{' '}
            ({toBn(totalMinutes)} মিনিট)
          </span>
        </div>
      )}

      {/* Validation error message */}
      {error && (
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
