import { MetricDefinition } from '../constants/metrics.js';

export interface DailyValuesByDate {
  [dateKey: string]: Record<string, number | boolean | string | null>;
}

export function calculateMetricAggregate(
  metric: MetricDefinition,
  dailyValues: DailyValuesByDate,
  calendarDaysInMonth: number
): number | null {
  const dates = Object.keys(dailyValues).filter((d) => {
    const parts = d.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      if (isNaN(day) || day < 1 || day > calendarDaysInMonth) return false;
    }
    return true;
  });
  if (dates.length === 0) return null;

  const validValues: number[] = [];
  let trueCount = 0;
  let hasAnyInput = false;

  for (const dateKey of dates) {
    const dayData = dailyValues[dateKey];
    if (!dayData) continue;

    const val = dayData[metric.id];
    if (val !== undefined && val !== null) {
      hasAnyInput = true;
      if (typeof val === 'number' && !isNaN(val)) {
        validValues.push(val);
      } else if (typeof val === 'boolean') {
        if (val) trueCount++;
      }
    }
  }

  if (!hasAnyInput) return null;

  switch (metric.aggregation) {
    case 'sum': {
      if (validValues.length === 0) return 0;
      return validValues.reduce((acc, curr) => acc + curr, 0);
    }

    case 'count_active_days': {
      if (metric.type === 'boolean') {
        return trueCount;
      }
      return validValues.filter((v) => v > 0).length;
    }

    case 'avg_answered_days': {
      if (validValues.length === 0) return null;
      const sum = validValues.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / validValues.length;
      return Math.round(avg * 10) / 10;
    }

    case 'avg_calendar_days': {
      if (calendarDaysInMonth <= 0) return null;
      const sum = validValues.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / calendarDaysInMonth;
      return Math.round(avg * 10) / 10;
    }

    case 'last_value': {
      const sortedDates = [...dates].sort();
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const lastVal = dailyValues[sortedDates[i]]?.[metric.id];
        if (typeof lastVal === 'number') return lastVal;
      }
      return null;
    }

    case 'none':
    default:
      return null;
  }
}

export function calculateMonthlyAggregates(
  metrics: MetricDefinition[],
  dailyValues: DailyValuesByDate,
  calendarDaysInMonth: number
): Record<string, number | null> {
  const results: Record<string, number | null> = {};
  for (const metric of metrics) {
    results[metric.id] = calculateMetricAggregate(metric, dailyValues, calendarDaysInMonth);
  }
  return results;
}
