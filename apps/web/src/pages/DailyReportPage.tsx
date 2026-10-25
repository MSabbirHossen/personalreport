import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_METRIC_GROUPS, MetricDefinition, MetricGroup } from '@reportbd/shared';
import { api } from '../services/api.js';
import {
  Save,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  FileEdit,
  AlertCircle,
} from 'lucide-react';

export const DailyReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);
  const currentDateParam = searchParams.get('date') || new Date().toISOString().substring(0, 10);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthParam);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateParam);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  // Month's daily records: { "YYYY-MM-DD": { values: { metricId: val } } }
  const [monthReports, setMonthReports] = useState<Record<string, any>>({});
  const [currentDayValues, setCurrentDayValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleValueChange = (metricId: string, val: any) => {
    setCurrentDayValues((prev) => ({
      ...prev,
      [metricId]: val === '' ? null : val,
    }));
  };

  const [isConflict, setIsConflict] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setIsConflict(false);
    try {
      const currentRev = monthReports[selectedDate]?.revision;
      const res = await api.saveDailyReport(selectedDate, {
        values: currentDayValues,
        revision: typeof currentRev === 'number' ? currentRev : undefined,
      });

      // Update local month state with authoritative server record
      setMonthReports((prev) => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          values: res.report.values,
          revision: res.report.revision,
          status: res.report.status,
          lastSavedAt: res.report.lastSavedAt,
        },
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  const allMetrics = DEFAULT_METRIC_GROUPS.flatMap((g: MetricGroup) => g.metrics);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            দৈনিক রিপোর্ট এন্ট্রি
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            নির্দিষ্ট তারিখ নির্বাচন করে দৈনন্দিন আমল ও অধ্যয়নের তথ্য সংরক্ষণ করুন
          </p>
        </div>

        {/* View mode toggle & Month selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span>একক দিন</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>মাসিক গ্রিড</span>
            </button>
          </div>

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
        <div className="flex items-center justify-between bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 p-3 rounded-2xl">
          <button
            onClick={() => navigateDate('prev')}
            disabled={daysArray.indexOf(selectedDate) === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
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
              className="px-3 py-1.5 text-sm font-bold rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-800 text-brand-900 dark:text-brand-100 shadow-sm"
            />
            {monthReports[selectedDate]?.status === 'saved' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                সংরক্ষিত
              </span>
            )}
          </div>

          <button
            onClick={() => navigateDate('next')}
            disabled={daysArray.indexOf(selectedDate) === daysArray.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span className="hidden sm:inline">পরবর্তী দিন</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SINGLE DAY FORM VIEW */}
      {viewMode === 'single' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-7 w-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                    {group.order}
                  </div>
                  <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {group.titleBn}
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {group.metrics.map((metric: MetricDefinition) => {
                    const value = currentDayValues[metric.id];

                    if (metric.type === 'boolean') {
                      return (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                        >
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            {metric.labelBn}
                          </label>
                          <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleValueChange(metric.id, e.target.checked)}
                            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={metric.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-medium text-slate-700 dark:text-slate-300">
                            {metric.labelBn}
                          </label>
                          {metric.unitBn && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({metric.unitBn})
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={metric.min ?? 0}
                          max={metric.max}
                          value={value ?? ''}
                          placeholder="0"
                          onChange={(e) =>
                            handleValueChange(
                              metric.id,
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ডাটা রিলোড করুন
                    </button>
                  )}
                </div>
              )}
              {!saveSuccess && !errorMsg && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  তারিখ: <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong>
                  {typeof monthReports[selectedDate]?.revision === 'number' && (
                    <span className="ml-2 text-slate-400">(রিভিশন #{monthReports[selectedDate].revision})</span>
                  )}
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
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
        /* DENSE MATRIX GRID VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs report-grid border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 bg-slate-100 dark:bg-slate-800 font-bold border-r border-slate-200 dark:border-slate-700 min-w-[100px]">
                    তারিখ
                  </th>
                  {allMetrics.map((m: MetricDefinition) => (
                    <th
                      key={m.id}
                      className="p-2.5 font-semibold min-w-[110px] text-center border-r border-slate-200/60 dark:border-slate-700/60"
                      title={m.labelBn}
                    >
                      <div className="truncate">{m.labelBn}</div>
                      {m.unitBn && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          ({m.unitBn})
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {daysArray.map((dateStr) => {
                  const dayNum = dateStr.split('-')[2];
                  const dayData = monthReports[dateStr]?.values || {};
                  const isCurrentDay = dateStr === selectedDate;

                  return (
                    <tr
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`hover:bg-brand-50/50 dark:hover:bg-brand-950/30 cursor-pointer transition-colors ${
                        isCurrentDay ? 'bg-brand-50/80 dark:bg-brand-950/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                        {dayNum} তারিখ
                      </td>
                      {allMetrics.map((m: MetricDefinition) => {
                        const val = dayData[m.id];
                        return (
                          <td
                            key={m.id}
                            className="p-2 text-center border-r border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-300"
                          >
                            {m.type === 'boolean' ? (
                              val ? '✓' : '-'
                            ) : val !== undefined && val !== null ? (
                              val
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
