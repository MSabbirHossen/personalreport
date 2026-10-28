import React from 'react';
import { MetricDefinition, getMetricLabel, getMetricUnit } from '@reportbd/shared';
import { DurationInput } from './DurationInput.js';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface CollapsibleMetricCardProps {
  metric: MetricDefinition;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export const CollapsibleMetricCard: React.FC<CollapsibleMetricCardProps> = ({
  metric,
  isExpanded,
  onToggleExpand,
  value,
  onChange,
  disabled = false,
}) => {
  const { t, locale } = useLanguage();
  const isBoolean = metric.type === 'boolean';
  const isDuration = metric.type === 'duration_minutes';
  const isNegative = typeof value === 'number' && (isNaN(value) || value < 0);

  const label = getMetricLabel(metric, locale);
  const unit = getMetricUnit(metric, locale);

  // 1. BOOLEAN METRIC:
  if (isBoolean) {
    const isChecked = isExpanded && !!value;
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-theme-surface-muted border border-theme-border hover:border-[var(--primary)]/40 transition-colors">
        <label
          htmlFor={`metric-check-${metric.id}`}
          className="text-sm font-semibold text-theme-text cursor-pointer flex-1 select-none"
        >
          {label}
        </label>
        <input
          id={`metric-check-${metric.id}`}
          type="checkbox"
          checked={isChecked}
          disabled={disabled}
          onChange={(e) => {
            const nextVal = e.target.checked;
            onToggleExpand(nextVal);
            onChange(nextVal);
          }}
          className="h-5 w-5 rounded border-theme-border text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
        />
      </div>
    );
  }

  // 2. NUMERIC / COUNT / DURATION METRICS:
  return (
    <div className="space-y-2">
      {/* Title & Checkbox row */}
      <div className="flex items-center justify-between text-base">
        <label
          htmlFor={`metric-check-${metric.id}`}
          className="font-medium text-theme-text cursor-pointer flex-1 select-none"
        >
          {label}
        </label>
        <div className="flex items-center gap-2">
          {isExpanded && unit && !isDuration && (
            <span className="text-sm text-theme-text-muted font-normal">
              ({unit})
            </span>
          )}
          <input
            id={`metric-check-${metric.id}`}
            type="checkbox"
            checked={isExpanded}
            disabled={disabled}
            onChange={(e) => onToggleExpand(e.target.checked)}
            className="h-5 w-5 rounded border-theme-border text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
          />
        </div>
      </div>

      {/* Expanded State: input fields & controls */}
      {isExpanded && (
        <div className="pt-2 space-y-2.5">
          {isDuration ? (
            <DurationInput
              id={`duration-${metric.id}`}
              value={typeof value === 'number' ? value : null}
              maxMinutes={metric.max}
              disabled={disabled}
              onChange={(newTotal) => onChange(newTotal)}
            />
          ) : (
            <input
              type="number"
              min={metric.min ?? 0}
              max={metric.max}
              disabled={disabled}
              value={value ?? ''}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                onChange(e.target.value === '' ? null : Number(e.target.value))
              }
              className={`w-full px-3.5 py-2.5 text-base rounded-xl border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                isNegative
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-theme-border focus:border-[var(--primary)]'
              }`}
            />
          )}

          {isNegative && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{t('validation.negativeNumberNotAllowed')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
