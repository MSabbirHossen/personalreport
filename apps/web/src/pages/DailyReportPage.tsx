import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_METRIC_GROUPS,
  MetricDefinition,
  MetricGroup,
  calculateDailySummary,
  compareDailySummaries,
  getPreviousDateKey,
} from '@reportbd/shared';
import { api } from '../services/api.js';
import {
  Save,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  LayoutGrid,
  FileEdit,
  AlertCircle,
  Clock,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { DurationInput } from '../components/daily/DurationInput.js';
import { DailySummaryCard } from '../components/daily/DailySummaryCard.js';
import { formatReportTimestamp, getReportSaveInfo } from '../components/daily/timestampUtils.js';

export const DailyReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);
  const currentDateParam = searchParams.get('date') || new Date().toISOString().substring(0, 10);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthParam);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateParam);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  // Month's daily records: { "YYYY-MM-DD": { values: { metricId: val }, lastSavedAt, updatedAt, revision, status } }
  const [monthReports, setMonthReports] = useState<Record<string, any>>({});
  // Cache for yesterday reports that cross month boundaries (e.g. 1st of month)
  const [crossMonthReports, setCrossMonthReports] = useState<Record<string, any>>({});

  const [currentDayValues, setCurrentDayValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  // Current calendar date in reporting timezone (Asia/Dhaka)
  const todayDateKey = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date());
    } catch {
      return new Date().toISOString().substring(0, 10);
    }
  }, []);

  const isToday = selectedDate === todayDateKey;

  // Collapsible card state: only the clicked card is open, rest of cards remain closed
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  // Calculate days in the selected month
  const getDaysInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month, 0);
    return date.getDate();
  };

  const totalDays = getDaysInMonth(selectedMonth);
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `${selectedMonth}-${day}`;
  });

  // Load monthly reports
  useEffect(() => {
    const loadMonthData = async () => {
      try {
        const res = await api.getDailyReportsForMonth(selectedMonth);
        setMonthReports(res.reports || {});
      } catch (err) {
        console.warn('Could not fetch daily reports:', err);
      }
    };
    loadMonthData();
  }, [selectedMonth]);

  // Sync selected date with monthReports
  useEffect(() => {
    if (monthReports[selectedDate]) {
      setCurrentDayValues(monthReports[selectedDate].values || {});
    } else {
      setCurrentDayValues({});
    }
    setSaveSuccess(false);
    setErrorMsg(null);
  }, [selectedDate, monthReports]);

  // All metrics list
  const allMetrics = useMemo(
    () => DEFAULT_METRIC_GROUPS.flatMap((g: MetricGroup) => g.metrics),
    []
  );

  // Fetch yesterday's report across month boundary if needed
  const yesterdayDateKey = useMemo(() => getPreviousDateKey(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!yesterdayDateKey) return;
    if (monthReports[yesterdayDateKey]) return;
    const yesterdayMonth = yesterdayDateKey.substring(0, 7);
    if (yesterdayMonth === selectedMonth) return;
    if (crossMonthReports[yesterdayDateKey]) return;

    let cancelled = false;
    api
      .getDailyReportForDate(yesterdayDateKey)
      .then((res) => {
        if (!cancelled && res) {
          setCrossMonthReports((prev) => ({
            ...prev,
            [yesterdayDateKey]: res,
          }));
        }
      })
      .catch(() => {
        // Ignore missing previous report
      });

    return () => {
      cancelled = true;
    };
  }, [yesterdayDateKey, monthReports, selectedMonth, crossMonthReports]);

  // Live Daily Summary calculations
  const todayTotals = useMemo(() => {
    return calculateDailySummary(currentDayValues);
  }, [currentDayValues]);

  const yesterdayReport = monthReports[yesterdayDateKey] || crossMonthReports[yesterdayDateKey];
  const yesterdayTotals = useMemo(() => {
    if (!yesterdayReport || yesterdayReport.status === 'empty' || !yesterdayReport.values) {
      return null;
    }
    return calculateDailySummary(yesterdayReport.values);
  }, [yesterdayReport]);

  const summaryComparison = useMemo(() => {
    return compareDailySummaries(todayTotals, yesterdayTotals, yesterdayDateKey, 'bn');
  }, [todayTotals, yesterdayTotals, yesterdayDateKey]);

  // Client-side validation: detect any invalid or negative values, and enforce business rules
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    for (const metric of allMetrics) {
      const val = currentDayValues[metric.id];
      if (val === undefined || val === null || val === '') continue;

      if (typeof val === 'number') {
        if (isNaN(val)) {
          errors[metric.id] = 'অকার্যকর সংখ্যা';
        } else if (val < 0) {
          errors[metric.id] = 'নেতিবাচক মান গ্রহণযোগ্য নয়';
        } else if (metric.type === 'count' && metric.id !== 'routine_sleep_hours' && !Number.isInteger(val)) {
          errors[metric.id] = 'পূর্ণসংখ্যা প্রয়োজন';
        }
      } else if (typeof val === 'string') {
        if (metric.type === 'count' || metric.type === 'duration_minutes') {
          const num = Number(val);
          if (isNaN(num)) {
            errors[metric.id] = 'অকার্যকর সংখ্যা';
          } else if (num < 0) {
            errors[metric.id] = 'নেতিবাচক মান গ্রহণযোগ্য নয়';
          }
        }
      }
    }

    // Card 5 Validation: classes attended must not exceed total classes held
    const totalClasses = currentDayValues['class_total_count'];
    const attendedClasses = currentDayValues['class_attended_count'];
    if (
      typeof totalClasses === 'number' &&
      typeof attendedClasses === 'number' &&
      !isNaN(totalClasses) &&
      !isNaN(attendedClasses) &&
      attendedClasses > totalClasses
    ) {
      errors['class_attended_count'] = 'উপস্থিত ক্লাসের সংখ্যা মোট ক্লাসের সংখ্যার চেয়ে বেশি হতে পারে না';
    }

    return errors;
  }, [currentDayValues, allMetrics]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleValueChange = (metricId: string, val: any) => {
    setCurrentDayValues((prev) => ({
      ...prev,
      [metricId]: val === '' ? null : val,
    }));
  };

  const handleSave = async () => {
    if (hasValidationErrors) {
      setErrorMsg('ফর্মটিতে কিছু ভুল বা অসঙ্গতি রয়েছে। ত্রুটিযুক্ত ফিল্ডগুলো সংশোধন করে পুনরায় সংরক্ষণ করুন।');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setIsConflict(false);
    try {
      const currentRev = monthReports[selectedDate]?.revision;
      const res = await api.saveDailyReport(selectedDate, {
        values: currentDayValues,
        revision: typeof currentRev === 'number' ? currentRev : undefined,
      });

      // Update local month state with authoritative server record including timestamps
      setMonthReports((prev) => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          values: res.report.values,
          revision: res.report.revision,
          status: res.report.status,
          lastSavedAt: res.report.lastSavedAt,
          updatedAt: res.report.updatedAt,
          createdAt: res.report.createdAt,
        },
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setIsConflict(true);
        setErrorMsg('অন্য ডিভাইসে পরিবর্তন হয়েছে: সার্ভারে নতুন তথ্য বিদ্যমান। প্রতিস্থাপন না করে সর্বশেষ ডাটা দেখতে রিলোড করুন।');
      } else {
        setErrorMsg(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    try {
      setSaving(true);
      const res = await api.getDailyReportForDate(selectedDate);
      setCurrentDayValues(res.values || {});
      setMonthReports((prev) => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          values: res.values || {},
          revision: res.revision,
          status: res.status,
          lastSavedAt: res.lastSavedAt,
          updatedAt: res.updatedAt,
          createdAt: res.createdAt,
        },
      }));
      setIsConflict(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'রিলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = daysArray.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex > 0) {
      const newDate = daysArray[currentIndex - 1];
      setSelectedDate(newDate);
      setSearchParams({ month: selectedMonth, date: newDate });
    } else if (direction === 'next' && currentIndex < daysArray.length - 1) {
      const newDate = daysArray[currentIndex + 1];
      setSelectedDate(newDate);
      setSearchParams({ month: selectedMonth, date: newDate });
    }
  };

  // Authoritative timestamp info for current selected report
  const currentReport = monthReports[selectedDate];
  const saveInfo = getReportSaveInfo(currentReport, 'bn');

  // Distribute groups into columns according to sequence so remaining empty space is packed with the rest of the card titles
  const getColumnLayout = (groups: MetricGroup[], expandedId: string | null, colCount: number) => {
    if (colCount <= 1) return [groups];

    const cols: MetricGroup[][] = Array.from({ length: colCount }, () => []);

    // When all cards are collapsed, round-robin ensures 1, 2, 3 across the top, 4, 5, 6 in middle, 7, 8, 9 at bottom
    if (!expandedId) {
      groups.forEach((g, i) => {
        cols[i % colCount].push(g);
      });
      return cols;
    }

    // When one card is expanded, pack columns by current height so the rest of the card titles fill into the empty space in sequence
    const colHeights = new Array(colCount).fill(0);

    for (const group of groups) {
      const isExpanded = group.id === expandedId;
      // An expanded card has multiple fields (~360px), while a collapsed card is just a single header row (~64px)
      const estimatedHeight = isExpanded ? 360 : 64;

      // Find the column with the least height
      let minCol = 0;
      let minH = colHeights[0];
      for (let c = 1; c < colCount; c++) {
        if (colHeights[c] < minH) {
          minH = colHeights[c];
          minCol = c;
        }
      }

      cols[minCol].push(group);
      colHeights[minCol] += estimatedHeight;
    }

    return cols;
  };

  const desktopColumns = useMemo(
    () => getColumnLayout(DEFAULT_METRIC_GROUPS, expandedGroupId, 3),
    [expandedGroupId]
  );

  const tabletColumns = useMemo(
    () => getColumnLayout(DEFAULT_METRIC_GROUPS, expandedGroupId, 2),
    [expandedGroupId]
  );

  const renderCard = (group: MetricGroup) => {
    const isExpanded = expandedGroupId === group.id;

    return (
      <div
        key={group.id}
        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm ${isExpanded
            ? 'border-brand-300 dark:border-brand-800/80 ring-1 ring-brand-500/10'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
      >
        {/* Phase 2: Default Collapsed Card Header */}
        <div
          onClick={() => toggleGroup(group.id)}
          className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls={`group-fields-${group.id}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleGroup(group.id);
            }
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Numbered Badge (Preserving existing style) */}
            <div className="h-7 w-7 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              {group.order}
            </div>

            {/* Title */}
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
              {group.titleBn}
            </h2>
          </div>

          {/* Primary Toggle: Checkbox & Synchronized Chevron */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              id={`group-checkbox-${group.id}`}
              aria-label={`${group.titleBn} বিস্তারিত তথ্য উন্মুক্ত করুন`}
              checked={isExpanded}
              onChange={() => toggleGroup(group.id)}
              className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
            />
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-label={isExpanded ? 'সংকুচিত করুন' : 'উন্মুক্ত করুন'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content - Hidden by default */}
        {isExpanded && (
          <div
            id={`group-fields-${group.id}`}
            className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn"
          >
            {group.metrics.map((metric: MetricDefinition) => {
              const value = currentDayValues[metric.id];
              const fieldError = validationErrors[metric.id];

              // Card 9 Date-Restricted Checkbox: 'রিপোর্ট সংরক্ষণ'
              if (metric.id === 'routine_report_confirmed') {
                return (
                  <div
                    key={metric.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${!isToday
                        ? 'bg-slate-100/70 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-700/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800/80'
                      }`}
                    title={!isToday ? 'Only editable on current date' : undefined}
                  >
                    <div className="space-y-0.5 pr-2">
                      <label
                        htmlFor={`field-${metric.id}`}
                        className={`text-xs font-medium cursor-pointer ${!isToday
                            ? 'text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {metric.labelBn}
                      </label>
                      {!isToday && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
                          Only editable on current date
                        </p>
                      )}
                    </div>
                    <input
                      id={`field-${metric.id}`}
                      type="checkbox"
                      disabled={!isToday}
                      title={!isToday ? 'Only editable on current date' : undefined}
                      aria-label={`${metric.labelBn} ${!isToday ? '(Only editable on current date)' : ''}`}
                      checked={!!value}
                      onChange={(e) => handleValueChange(metric.id, e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                );
              }

              // Boolean Field (e.g. পারিবারিক বৈঠক, তাহাজ্জুদ, মুহাসাবা)
              if (metric.type === 'boolean') {
                return (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80"
                  >
                    <label
                      htmlFor={`field-${metric.id}`}
                      className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {metric.labelBn}
                    </label>
                    <input
                      id={`field-${metric.id}`}
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => handleValueChange(metric.id, e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
                    />
                  </div>
                );
              }

              // Text Field (Card 2: হাদিসের ব্যাখ্যা)
              if (metric.type === 'text') {
                return (
                  <div key={metric.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`field-${metric.id}`}
                        className="font-medium text-slate-700 dark:text-slate-300"
                      >
                        {metric.labelBn}
                      </label>
                    </div>
                    <textarea
                      id={`field-${metric.id}`}
                      rows={2}
                      value={value ?? ''}
                      placeholder="হাদিসের ব্যাখ্যা বা শিক্ষা লিপিবদ্ধ করুন..."
                      onChange={(e) => handleValueChange(metric.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-y min-h-[58px]"
                    />
                  </div>
                );
              }

              // Duration Field (Phase 4 UX: Hours and Minutes Dual Input)
              if (metric.type === 'duration_minutes') {
                return (
                  <div key={metric.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`duration-${metric.id}`}
                        className="font-medium text-slate-700 dark:text-slate-300"
                      >
                        {metric.labelBn}
                      </label>
                      {metric.unitBn && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({metric.unitBn})
                        </span>
                      )}
                    </div>
                    <DurationInput
                      id={`duration-${metric.id}`}
                      value={value}
                      onChange={(totalMinutes) => handleValueChange(metric.id, totalMinutes)}
                      maxMinutes={metric.max}
                      disabled={saving}
                    />
                    {fieldError && (
                      <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              }

              // Count / Regular Numeric Field (Phase 3: Prevention of negative numbers)
              const isDecimal = metric.id === 'routine_sleep_hours';

              return (
                <div key={metric.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`field-${metric.id}`}
                      className="font-medium text-slate-700 dark:text-slate-300"
                    >
                      {metric.labelBn}
                    </label>
                    {metric.unitBn && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({metric.unitBn})
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id={`field-${metric.id}`}
                      type="number"
                      min={metric.min ?? 0}
                      max={metric.max}
                      step={isDecimal ? 0.5 : 1}
                      value={value ?? ''}
                      placeholder="0"
                      onKeyDown={(e) => {
                        // Prevent negative sign, exponential 'e', and '+' sign
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (text.includes('-') || isNaN(Number(text)) || Number(text) < 0) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          handleValueChange(metric.id, null);
                          return;
                        }
                        const parsed = Number(raw);
                        handleValueChange(metric.id, parsed);
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${fieldError
                          ? 'border-red-400 dark:border-red-700 focus:ring-red-400/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500/20 focus:border-brand-500'
                        }`}
                    />
                  </div>
                  {fieldError && (
                    <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header & Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            দৈনিক রিপোর্ট এন্ট্রি
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            নির্দিষ্ট তারিখ নির্বাচন করে দৈনন্দিন আমল, শিক্ষা ও সাংগঠনিক কাজের তথ্য লিপিবদ্ধ করুন
          </p>
        </div>

        {/* View mode toggle, Print Button & Month selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${viewMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span>একক দিন</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>মাসিক গ্রিড</span>
            </button>
          </div>

          {/* Print button when in Monthly Grid mode */}
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all cursor-pointer"
              title="A4 ল্যান্ডস্কেপ ফরম্যাটে মাসিক গ্রিড প্রিন্ট করুন"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
          )}

          {/* Month input */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDate(`${e.target.value}-01`);
              setSearchParams({ month: e.target.value, date: `${e.target.value}-01` });
            }}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Date Carousel Navigation (for Single Day Mode) */}
      {viewMode === 'single' && (
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 p-3 rounded-2xl">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              onClick={() => navigateDate('prev')}
              disabled={daysArray.indexOf(selectedDate) === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">পূর্ববর্তী দিন</span>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                min={`${selectedMonth}-01`}
                max={`${selectedMonth}-${String(totalDays).padStart(2, '0')}`}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSearchParams({ month: selectedMonth, date: e.target.value });
                }}
                className="px-3 py-1.5 text-sm font-bold rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-800 text-brand-900 dark:text-brand-100 shadow-sm cursor-pointer"
              />
              {saveInfo.isSaved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>সংরক্ষিত</span>
                </span>
              )}
            </div>

            <button
              onClick={() => navigateDate('next')}
              disabled={daysArray.indexOf(selectedDate) === daysArray.length - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">পরবর্তী দিন</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Collapse Indicator */}
          {expandedGroupId && (
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setExpandedGroupId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium transition-colors cursor-pointer"
                title="উন্মুক্ত কার্ডটি সংকুচিত করুন"
              >
                <ChevronsUp className="h-3.5 w-3.5 text-slate-500" />
                <span>কার্ড বন্ধ করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SINGLE DAY FORM VIEW */}
      {viewMode === 'single' ? (
        <div className="space-y-6">
          {/* Validation Warning Alert (if any negative or invalid numbers exist) */}
          {hasValidationErrors && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-800 dark:text-red-200 text-xs">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="flex-1">
                <strong>মনোযোগ দিন:</strong> ফর্মে নেতিবাচক বা অকার্যকর সংখ্যা রয়েছে। ত্রুটিযুক্ত ফিল্ডগুলো চিহ্নিত করা হয়েছে এবং সংরক্ষণ সাময়িকভাবে স্থগিত রাখা হয়েছে।
              </div>
            </div>
          )}

          {/* Responsive Packed Columns (Desktop 3-column, Tablet 2-column, Mobile 1-column) */}
          {/* Desktop (lg: 3 columns) */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
            {desktopColumns.map((colGroups, colIndex) => (
              <div key={colIndex} className="space-y-6">
                {colGroups.map((group) => renderCard(group))}
              </div>
            ))}
          </div>

          {/* Tablet (md: 2 columns) */}
          <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-6 items-start">
            {tabletColumns.map((colGroups, colIndex) => (
              <div key={colIndex} className="space-y-6">
                {colGroups.map((group) => renderCard(group))}
              </div>
            ))}
          </div>

          {/* Mobile (1 column) */}
          <div className="space-y-6 md:hidden">
            {DEFAULT_METRIC_GROUPS.map((group) => renderCard(group))}
          </div>

          {/* Phase 5: Daily Summary & Yesterday Comparison Card */}
          <DailySummaryCard comparison={summaryComparison} selectedDate={selectedDate} />

          {/* Phase 6: Authoritative Saved-at / Last-updated Timestamp Banner */}
          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {saveInfo.isSaved ? saveInfo.full : 'এখনও সংরক্ষণ করা হয়নি (Not saved yet)'}
                </span>
                {typeof currentReport?.revision === 'number' && (
                  <span className="ml-2 text-slate-400 text-[11px]">
                    (রিভিশন #{currentReport.revision})
                  </span>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              তারিখ: <strong className="text-slate-700 dark:text-slate-300">{selectedDate}</strong>
            </div>
          </div>

          {/* Sticky Save Action Bar */}
          <div className="sticky bottom-16 lg:bottom-4 z-30 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  {isConflict && (
                    <button
                      type="button"
                      onClick={handleReload}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>ডাটা রিলোড করুন</span>
                    </button>
                  )}
                </div>
              )}
              {!saveSuccess && !errorMsg && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {saveInfo.full}
                  </span>
                  {hasValidationErrors && (
                    <span className="text-red-500 font-semibold">(ত্রুটি রয়েছে)</span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || hasValidationErrors}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {saving ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>রিপোর্ট সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* DENSE MATRIX GRID VIEW WITH PRINT SUPPORT */
        <div className="space-y-4">
          {/* Print-only Document Header */}
          <div className="hidden print:block mb-3 border-b-2 border-slate-800 pb-2 text-slate-900">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl font-bold tracking-tight">ব্যক্তিগত মাসিক রিপোর্ট গ্রিড</h1>
                <p className="text-xs text-slate-700 mt-0.5">
                  মাস: <strong className="font-bold">{selectedMonth}</strong> (মোট {totalDays} দিন)
                </p>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                মুদ্রণ সময়: {formatReportTimestamp(new Date().toISOString(), 'bn')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden report-grid-container">
            <div className="overflow-x-auto max-h-[72vh] print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-xs report-grid border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="p-2.5 bg-slate-100 dark:bg-slate-800 font-bold border-r border-slate-200 dark:border-slate-700 min-w-[100px] sticky left-0 z-10 print:static">
                      তারিখ
                    </th>
                    {allMetrics.map((m: MetricDefinition) => (
                      <th
                        key={m.id}
                        className="p-2 font-semibold min-w-[115px] text-center border-r border-slate-200/60 dark:border-slate-700/60 text-[11px]"
                        title={m.labelBn}
                      >
                        <div className="line-clamp-2">{m.labelBn}</div>
                        {m.unitBn && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({m.unitBn})
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="p-2.5 bg-slate-100 dark:bg-slate-800 font-bold text-center min-w-[130px] no-print">
                      সর্বশেষ সংরক্ষণ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                  {daysArray.map((dateStr) => {
                    const dayNum = dateStr.split('-')[2];
                    const dayReport = monthReports[dateStr];
                    const dayData = dayReport?.values || {};
                    const isCurrentDay = dateStr === selectedDate;
                    const dayTimestamp = formatReportTimestamp(
                      dayReport?.updatedAt || dayReport?.lastSavedAt || dayReport?.createdAt,
                      'bn'
                    );

                    return (
                      <tr
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`hover:bg-brand-50/50 dark:hover:bg-brand-950/30 cursor-pointer transition-colors ${isCurrentDay ? 'bg-brand-50/80 dark:bg-brand-950/60 font-semibold' : ''
                          }`}
                      >
                        <td className="p-2.5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200 sticky left-0 z-10 print:static print:bg-white print:text-black">
                          <div>{dayNum} তারিখ</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 no-print">
                            {dayTimestamp ? 'সংরক্ষিত' : 'খালি'}
                          </div>
                        </td>
                        {allMetrics.map((m: MetricDefinition) => {
                          const val = dayData[m.id];
                          return (
                            <td
                              key={m.id}
                              className="p-1.5 text-center border-r border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-xs print:text-black"
                            >
                              {m.type === 'boolean' ? (
                                val === true ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold print:text-black">
                                    হ্যাঁ
                                  </span>
                                ) : val === false ? (
                                  <span className="text-slate-400 dark:text-slate-500 print:text-slate-600">
                                    না
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">-</span>
                                )
                              ) : val !== undefined && val !== null ? (
                                m.type === 'duration_minutes' && typeof val === 'number' ? (
                                  `${Math.floor(val / 60)}ঘ ${val % 60}মি`
                                ) : (
                                  <span title={String(val)} className="truncate block max-w-[120px] mx-auto">
                                    {val}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center text-[11px] text-slate-500 dark:text-slate-400 no-print">
                          {dayTimestamp ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              {dayTimestamp}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">সংরক্ষিত নয়</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Styles for A4 Landscape Output */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 8px !important;
          }
          .no-print,
          nav,
          header,
          aside {
            display: none !important;
          }
          .report-grid-container {
            overflow: visible !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          table.report-grid {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 7.5px !important;
          }
          table.report-grid th,
          table.report-grid td {
            border: 0.5pt solid #94a3b8 !important;
            padding: 2px 2.5px !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          table.report-grid thead {
            display: table-header-group !important;
          }
          table.report-grid thead th {
            background: #f1f5f9 !important;
            font-weight: bold !important;
          }
          table.report-grid tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
