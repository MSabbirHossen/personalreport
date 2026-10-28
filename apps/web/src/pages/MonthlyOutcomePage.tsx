import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_METRIC_GROUPS,
  MetricGroup,
  MetricDefinition,
  getMetricLabel,
  getGroupTitle,
  getMetricUnit,
  PERMISSIONS,
} from '@reportbd/shared';
import { PermissionGate } from '../components/auth/PermissionGate.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
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
  const { t, locale, isRTL, formatDate, formatNumber, formatMonthKey } = useLanguage();

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
  const [isStale, setIsStale] = useState<boolean>(false);
  const [staleReason, setStaleReason] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [revision, setRevision] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOutcome = async () => {
    try {
      const res = await api.getMonthlyOutcome(selectedMonth);
      setDerivedValues(res.derivedValues || {});
      setManualValues(res.manualValues || {});
      setTargets(res.targets || {});
      setReflections(res.reflections || {});
      setOutcomeStatus(res.status || 'draft');
      setSubmittedAt(res.submittedAt || null);
      setIsStale(Boolean(res.isStale));
      setStaleReason(res.staleReason || null);
      setSnapshot(res.snapshot || null);
      setRevision(res.revision || 0);
    } catch (err) {
      console.warn('Could not fetch monthly outcome:', err);
    }
  };

  useEffect(() => {
    loadOutcome();
  }, [selectedMonth]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.saveMonthlyOutcome(selectedMonth, {
        manualValues,
        reflections,
        revision,
      });
      setRevision(res.outcome?.revision || revision + 1);
      setStatusMsg({ type: 'success', text: t('common.saved') });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    const isResubmit = outcomeStatus === 'returned';
    const confirmText = isResubmit
      ? t('monthlyOutcome.resubmitConfirmText')
      : t('monthlyOutcome.submitConfirmText');

    if (!window.confirm(confirmText)) {
      return;
    }
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyOutcome(selectedMonth, { manualValues, reflections, revision });
      await api.submitMonthlyOutcome(selectedMonth);
      await loadOutcome();
      setStatusMsg({
        type: 'success',
        text: isResubmit
          ? t('monthlyOutcome.outcomeResubmittedSuccess')
          : t('monthlyOutcome.outcomeSubmittedSuccess'),
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    if (outcomeStatus === 'acknowledged') {
      return {
        label: t('monthlyOutcome.statusApproved'),
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      };
    }
    if (outcomeStatus === 'submitted') {
      return {
        label: t('monthlyOutcome.statusSubmitted'),
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      };
    }
    if (outcomeStatus === 'returned') {
      return {
        label: t('monthlyOutcome.statusReturned'),
        className: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      };
    }
    return {
      label: t('monthlyOutcome.statusDraft'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    };
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-surface islamic-card p-4 sm:p-5 rounded-2xl border border-theme-border shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>{t('monthlyOutcome.title')}</span>
            </h1>
            <span className={`text-sm px-3 py-1 rounded-full font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('monthlyOutcome.subtitle')}
          </p>
        </div>

        {/* Month Selector & Print */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSearchParams({ month: e.target.value });
            }}
            className="px-4 py-2.5 text-base font-semibold rounded-xl border border-theme-border bg-theme-surface text-theme-text min-h-[44px]"
          />

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-base font-bold rounded-xl bg-theme-surface hover:bg-theme-surface-muted text-theme-text border border-theme-border transition-colors cursor-pointer min-h-[44px] shadow-xs"
          >
            <Printer className="h-4.5 w-4.5" />
            <span>{t('common.print')}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 no-print ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Stale Snapshot Warning */}
      {isStale && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 flex items-start gap-3 no-print">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold">{t('monthlyOutcome.staleDataWarning')}</p>
            {staleReason && <p className="text-amber-700 dark:text-amber-300">{staleReason}</p>}
          </div>
        </div>
      )}

      {/* Snapshot Information Banner */}
      {snapshot && ['submitted', 'in_review', 'acknowledged'].includes(outcomeStatus) && (
        <div className="px-4.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm flex items-center justify-between no-print">
          <span>{t('monthlyOutcome.frozenSnapshotNotice')} ({formatDate(snapshot.calculatedAt)})</span>
          <span className="font-medium text-slate-500">{t('common.total')}: {formatNumber(snapshot.dailyReportsCount || 0)}</span>
        </div>
      )}

      {/* Printable Header details */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">{t('common.appTitle')} — {t('monthlyOutcome.title')}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {t('monthlyPlan.studentNameLabel')} {user?.name} | {t('monthlyPlan.monthSelectLabel')} {formatMonthKey(selectedMonth)}
        </p>
      </div>

      {/* Plan vs Actual Comparison Table */}
      <div className="bg-theme-surface islamic-card rounded-2xl border border-theme-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <span>{t('monthlyOutcome.title')}</span>
          </h2>
          <span className="text-sm text-slate-500">{t('monthlyPlan.monthSelectLabel')}: {formatMonthKey(selectedMonth)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm sm:text-base border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 font-semibold text-start">{t('monthlyPlan.setTargetHeader')}</th>
                <th className="py-3 px-3.5 font-semibold text-center">{t('monthlyPlan.unitLabel')}</th>
                <th className="py-3 px-3.5 font-semibold text-center">{t('monthlyPlan.targetInputLabel')}</th>
                <th className="py-3 px-3.5 font-semibold text-center">{t('common.actions')}</th>
                <th className="py-3 px-3.5 font-semibold text-center">{t('dashboard.monthlyTargetStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => (
                <React.Fragment key={group.id}>
                  {/* Group heading row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                    <td colSpan={5} className="py-3 px-3.5 font-bold text-base text-brand-700 dark:text-brand-400 text-start">
                      {getGroupTitle(group, locale)}
                    </td>
                  </tr>

                  {group.metrics.map((metric: MetricDefinition) => {
                    const targetVal = targets[metric.id];
                    const actualVal = derivedValues[metric.id];

                    let diffStr = '-';
                    let progressPercent: number | null = null;

                    if (typeof targetVal === 'number' && typeof actualVal === 'number') {
                      const diff = actualVal - targetVal;
                      diffStr = (diff >= 0 ? '+' : '') + formatNumber(diff);
                      if (targetVal > 0) {
                        progressPercent = Math.min(100, Math.round((actualVal / targetVal) * 100));
                      }
                    }

                    return (
                      <tr key={metric.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200 ps-6 text-start">
                          {getMetricLabel(metric, locale)}
                        </td>
                        <td className="py-3 px-3.5 text-center text-slate-500">
                          {getMetricUnit(metric, locale) || (metric.type === 'boolean' ? t('common.actions') : '')}
                        </td>
                        <td className="py-3 px-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {targetVal !== undefined && targetVal !== null ? formatNumber(targetVal) : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center font-bold text-brand-600 dark:text-brand-400">
                          {actualVal !== null && actualVal !== undefined ? formatNumber(actualVal) : formatNumber(0)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {progressPercent !== null ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-brand-500 h-full rounded-full"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                                {formatNumber(progressPercent)}%
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Award className="h-5 w-5 text-brand-600" />
          <span>{t('monthlyOutcome.subtitle')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('common.notes')} (1)
            </label>
            <textarea
              rows={4}
              value={reflections.achievements || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, achievements: e.target.value }))
              }
              placeholder="..."
              className="w-full p-3.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('common.notes')} (2)
            </label>
            <textarea
              rows={4}
              value={reflections.challenges || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, challenges: e.target.value }))
              }
              placeholder="..."
              className="w-full p-3.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('common.notes')} (3)
            </label>
            <textarea
              rows={4}
              value={reflections.nextMonthPriorities || ''}
              onChange={(e) =>
                setReflections((prev) => ({ ...prev, nextMonthPriorities: e.target.value }))
              }
              placeholder="..."
              className="w-full p-3.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
        <div className="text-sm text-slate-500">
          {submittedAt ? (
            <div className="space-y-0.5">
              <span>{t('supervisor.submittedAtHeader')}: <strong>{formatDate(submittedAt)}</strong></span>
              {outcomeStatus === 'acknowledged' && (
                <span className="block text-emerald-600 dark:text-emerald-400 font-semibold">{t('monthlyOutcome.approvedBanner')}</span>
              )}
              {outcomeStatus === 'returned' && (
                <span className="block text-rose-600 dark:text-rose-400 font-semibold">{t('monthlyOutcome.returnedBanner')}</span>
              )}
            </div>
          ) : (
            <span>{t('monthlyOutcome.statusDraft')}</span>
          )}
        </div>

        <div className="flex items-center gap-3.5 flex-wrap">
          {outcomeStatus !== 'submitted' && outcomeStatus !== 'acknowledged' ? (
            <>
              <PermissionGate permission={PERMISSIONS.MONTHLY_OUTCOME_WRITE_OWN}>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || submitting}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-theme-border bg-theme-surface text-theme-text text-base font-semibold hover:bg-theme-surface-muted transition-all cursor-pointer disabled:opacity-50 min-h-[48px] shadow-xs"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? t('monthlyPlan.savingDraft') : t('monthlyPlan.saveDraftBtn')}</span>
                </button>
              </PermissionGate>

              <PermissionGate permission={PERMISSIONS.MONTHLY_OUTCOME_SUBMIT_OWN}>
                <button
                  onClick={handleSubmitReport}
                  disabled={submitting || saving}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-base font-bold shadow-lg shadow-brand-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  <Send className={`h-5 w-5 ${isRTL ? 'rtl-flip' : ''}`} />
                  <span>
                    {submitting
                      ? t('monthlyOutcome.submittingOutcome')
                      : outcomeStatus === 'returned'
                      ? t('monthlyOutcome.resubmitOutcomeBtn')
                      : t('monthlyOutcome.submitOutcomeBtn')}
                  </span>
                </button>
              </PermissionGate>
            </>
          ) : (
            <div className="text-sm text-slate-500 italic">
              {t('monthlyOutcome.lockedNotice')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
