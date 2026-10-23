import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_METRIC_GROUPS, MetricGroup, MetricDefinition } from '@reportbd/shared';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FileSpreadsheet,
  Printer,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
} from 'lucide-react';

export const MonthlyOutcomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);

  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthParam);
  const [derivedValues, setDerivedValues] = useState<Record<string, number | null>>({});
  const [manualValues, setManualValues] = useState<Record<string, any>>({});
  const [targets, setTargets] = useState<Record<string, any>>({});
  const [reflections, setReflections] = useState<{
    achievements?: string;
    challenges?: string;
    nextMonthPriorities?: string;
  }>({});
  const [outcomeStatus, setOutcomeStatus] = useState<string>('draft');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadOutcome = async () => {
      try {
        const res = await api.getMonthlyOutcome(selectedMonth);
        setDerivedValues(res.derivedValues || {});
        setManualValues(res.manualValues || {});
        setTargets(res.targets || {});
        setReflections(res.reflections || {});
        setOutcomeStatus(res.status || 'draft');
        setSubmittedAt(res.submittedAt || null);
      } catch (err) {
        console.warn('Could not fetch monthly outcome:', err);
      }
    };
    loadOutcome();
  }, [selectedMonth]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyOutcome(selectedMonth, {
        manualValues,
        reflections,
      });
      setStatusMsg({ type: 'success', text: 'ফলাফল খসড়া সংরক্ষিত হয়েছে।' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে মাসিক রিপোর্টটি দায়িত্বশীলের মূল্যায়নের জন্য জমা দিতে চান?')) {
      return;
    }
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyOutcome(selectedMonth, { manualValues, reflections });
      await api.submitMonthlyOutcome(selectedMonth);
      setOutcomeStatus('submitted');
      setSubmittedAt(new Date().toISOString());
      setStatusMsg({ type: 'success', text: 'মাসিক রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'রিপোর্ট জমা ব্যর্থ হয়েছে।' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const allMetrics = DEFAULT_METRIC_GROUPS.flatMap((g: MetricGroup) => g.metrics);

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              মাসিক ফলাফল ও রিপোর্ট
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                outcomeStatus === 'acknowledged'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : outcomeStatus === 'submitted'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {outcomeStatus === 'acknowledged'
                ? 'অনুমোদিত ও পর্যালোচিত'
                : outcomeStatus === 'submitted'
                ? 'জমা দেওয়া হয়েছে'
                : 'খসড়া'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            পরিকল্পনার বিপরীতে দৈনিক অর্জনের স্বয়ংক্রিয় হিসাব ও আত্মমূল্যায়ন
          </p>
        </div>

        {/* Month Selector & Print */}
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
          >
            <Printer className="h-4 w-4" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Printable Header details */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">ব্যক্তিগত রিপোর্ট ও মাসিক মূল্যায়ন</h1>
        <p className="text-sm text-slate-600 mt-1">
          ছাত্রের নাম: {user?.name} | মাস: {selectedMonth}
        </p>
      </div>

      {/* Plan vs Actual Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            পরিকল্পনা ও অর্জনের তুলনামূলক ছক
          </h2>
          <span className="text-xs text-slate-500">মাস: {selectedMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 font-semibold">কার্যক্রমের বিষয়</th>
                <th className="p-3 font-semibold text-center">একক</th>
                <th className="p-3 font-semibold text-center">পরিকল্পনা (Target)</th>
                <th className="p-3 font-semibold text-center">বাস্তবায়ন (Actual)</th>
                <th className="p-3 font-semibold text-center">পার্থক্য / অগ্রগতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => (
                <React.Fragment key={group.id}>
                  {/* Group heading row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td colSpan={5} className="p-2.5 font-bold text-brand-700 dark:text-brand-400">
                      {group.titleBn}
                    </td>
                  </tr>

                  {group.metrics.map((metric: MetricDefinition) => {
                    const targetVal = targets[metric.id];
                    const actualVal = derivedValues[metric.id];

                    let diffStr = '-';
                    let progressPercent: number | null = null;

                    if (typeof targetVal === 'number' && typeof actualVal === 'number') {
                      const diff = actualVal - targetVal;
                      diffStr = (diff >= 0 ? '+' : '') + diff;
                      if (targetVal > 0) {
                        progressPercent = Math.min(100, Math.round((actualVal / targetVal) * 100));
                      }
                    }

                    return (
                      <tr key={metric.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200 pl-6">
                          {metric.labelBn}
                        </td>
                        <td className="p-3 text-center text-slate-500">
                          {metric.unitBn || (metric.type === 'boolean' ? 'দিন' : '')}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {targetVal !== undefined && targetVal !== null ? targetVal : '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-brand-600 dark:text-brand-400">
                          {actualVal !== null && actualVal !== undefined ? actualVal : 0}
                        </td>
                        <td className="p-3 text-center">
                          {progressPercent !== null ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-brand-500 h-full rounded-full"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-300">
                                {progressPercent}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">{diffStr}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Self-Reflection & Evaluation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-600" />
          আত্মসমালোচনা ও মূল্যায়ন
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              এ মাসের উল্লেখযোগ্য অর্জনসমূহ
            </label>
            <textarea
              rows={4}
              value={reflections.achievements || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, achievements: e.target.value }))
              }
              placeholder="কোন বিষয়ে সবচেয়ে ভালো অগ্রগতি হয়েছে..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              সীমাবদ্ধতা ও ঘাটতিসমূহ
            </label>
            <textarea
              rows={4}
              value={reflections.challenges || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, challenges: e.target.value }))
              }
              placeholder="কোন ক্ষেত্রে ঘাটতি হয়েছে এবং কারণ কী..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              আগামী মাসের অগ্রাধিকার
            </label>
            <textarea
              rows={4}
              value={reflections.nextMonthPriorities || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, nextMonthPriorities: e.target.value }))
              }
              placeholder="পরবর্তী মাসে যেসব বিষয়ে বিশেষ জোর দিতে চান..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
        <div className="text-xs text-slate-500">
          {submittedAt ? (
            <span>জমা দেওয়ার সময়: {new Date(submittedAt).toLocaleString('bn-BD')}</span>
          ) : (
            <span>খসড়া হিসেবে সংরক্ষিত রয়েছে</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>খসড়া সংরক্ষণ</span>
          </button>

          <button
            onClick={handleSubmitReport}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>মাসিক রিপোর্ট ফাইনাল জমা দিন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
