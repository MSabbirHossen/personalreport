import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_METRIC_GROUPS, MetricGroup, MetricDefinition } from '@reportbd/shared';
import { api } from '../services/api.js';
import {
  Target,
  Save,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const MonthlyPlanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthParam);
  const [targets, setTargets] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<string>('');
  const [planStatus, setPlanStatus] = useState<string>('draft');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await api.getMonthlyPlan(selectedMonth);
        setTargets(res.targets || {});
        setNotes(res.notes || '');
        setPlanStatus(res.status || 'draft');
      } catch (err) {
        console.warn('Could not fetch monthly plan:', err);
      }
    };
    loadPlan();
  }, [selectedMonth]);

  const handleTargetChange = (metricId: string, val: any) => {
    setTargets((prev) => ({
      ...prev,
      [metricId]: val === '' ? null : Number(val),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyPlan(selectedMonth, {
        targets,
        notes,
      });
      setStatusMsg({ type: 'success', text: 'পরিকল্পনা সফলভাবে সংরক্ষণ করা হয়েছে।' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyPlan(selectedMonth, { targets, notes });
      await api.shareMonthlyPlan(selectedMonth);
      setPlanStatus('shared');
      setStatusMsg({ type: 'success', text: 'পরিকল্পনা দায়িত্বশীলের সাথে শেয়ার করা হয়েছে!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'শেয়ার ব্যর্থ হয়েছে।' });
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              মাসিক পরিকল্পনা
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                planStatus === 'shared'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {planStatus === 'shared' ? 'দায়িত্বশীলের কাছে জমা' : 'খসড়া (Draft)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            চলতি মাসের লক্ষ্যমাত্রা ও টার্গেট নির্ধারণ করুন
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSearchParams({ month: e.target.value });
            }}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          />

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            title="প্রিন্ট করুন"
          >
            <Printer className="h-4 w-4" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 no-print ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Target Setting Form Groups */}
      <div className="space-y-6">
        {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-6 w-6 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                {group.order}
              </div>
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {group.titleBn} (টার্গেট)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {group.metrics
                .filter((m: MetricDefinition) => m.type !== 'boolean') // Only countable/duration metrics have monthly targets
                .map((metric: MetricDefinition) => (
                  <div key={metric.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {metric.labelBn}
                      </label>
                      {metric.unitBn && (
                        <span className="text-[11px] text-slate-400">({metric.unitBn})</span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="মাসের টার্গেট"
                      value={targets[metric.id] ?? ''}
                      onChange={(e) => handleTargetChange(metric.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Special Notes & Goals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            বিশেষ লক্ষ্য ও ব্যক্তিগত মন্তব্য
          </h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="এই মাসের বিশেষ কোনো লক্ষ্য বা দায়িত্বশীলের উদ্দেশ্যে কোনো বার্তা থাকলে লিখুন..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>খসড়া সংরক্ষণ</span>
          </button>

          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>দায়িত্বশীলের সাথে শেয়ার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
