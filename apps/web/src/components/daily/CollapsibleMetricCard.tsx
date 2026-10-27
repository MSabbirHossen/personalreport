import React from 'react';
import { MetricDefinition } from '@reportbd/shared';
import { DurationInput } from './DurationInput.js';
import { AlertCircle } from 'lucide-react';

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
  const isBoolean = metric.type === 'boolean';
  const isDuration = metric.type === 'duration_minutes';
  const isNegative = typeof value === 'number' && (isNaN(value) || value < 0);

  // 1. BOOLEAN METRIC:
  // Restores the original compact row layout (p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60)
  // Collapsed: Metric Title [ ]
  // Checked: Metric Title [✓]
  if (isBoolean) {
    const isChecked = isExpanded && !!value;
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
        <label
          htmlFor={`metric-check-${metric.id}`}
          className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex-1 select-none"
        >
          {metric.labelBn}
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
          className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
        />
      </div>
    );
  }

  // 2. NUMERIC / COUNT / DURATION METRICS:
  // Collapsed: Metric Title [ ]
  // Expanded: Metric Title ({unit}) [✓] followed by the original input fields
  return (
    <div className="space-y-1">
      {/* Title & Checkbox row */}
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={`metric-check-${metric.id}`}
          className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex-1 select-none"
        >
          {metric.labelBn}
        </label>
        <div className="flex items-center gap-2">
          {isExpanded && metric.unitBn && !isDuration && (
            <span className="text-[11px] text-slate-400 font-normal">
              ({metric.unitBn})
            </span>
          )}
          <input
            id={`metric-check-${metric.id}`}
            type="checkbox"
            checked={isExpanded}
            disabled={disabled}
            onChange={(e) => onToggleExpand(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Expanded State: original input fields & controls */}
      {isExpanded && (
        <div className="pt-0.5 space-y-1">
          {metric.descriptionBn && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {metric.descriptionBn}
            </p>
          )}

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
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                isNegative
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
              }`}
            />
          )}

          {isNegative && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>নেতিবাচক মান গ্রহণযোগ্য নয় (সর্বনিম্ন ০ হতে হবে)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
