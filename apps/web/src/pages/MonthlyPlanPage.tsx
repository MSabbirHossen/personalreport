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
  Target,
  Save,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';

export const MonthlyPlanPage: React.FC = () => {
  const { user } = useAuth();
  const { t, locale, isRTL, formatDate, formatNumber, formatMonthKey } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthParam);
  const [targets, setTargets] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<string>('');
  const [planStatus, setPlanStatus] = useState<string>('draft');
  const [revision, setRevision] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isConflict, setIsConflict] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [planAdvice, setPlanAdvice] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [printTimestamp, setPrintTimestamp] = useState<string>('');

  const loadPlan = async () => {
    try {
      const res = await api.getMonthlyPlan(selectedMonth);
      setTargets(res.targets || {});
      setNotes(res.notes || '');
      setPlanStatus(res.status || 'draft');
      setRevision(res.revision || 0);
      setIsConflict(false);
    } catch (err) {
      console.warn('Could not fetch monthly plan:', err);
    }
  };

  const loadMetadata = async () => {
    try {
      const meRes = await api.getMe();
      setUserProfile(meRes.user);
    } catch {
      // Non-critical metadata
    }

    try {
      const adviceRes = await api.getAdvice();
      const relevant = (adviceRes.advice || []).filter(
        (a: any) =>
          a.monthKey === selectedMonth ||
          a.targetType === 'plan' ||
          a.targetId === selectedMonth
      );
      setPlanAdvice(relevant);
    } catch {
      // Non-critical advice
    }
  };

  useEffect(() => {
    loadPlan();
    loadMetadata();
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
    setIsConflict(false);
    try {
      const res = await api.saveMonthlyPlan(selectedMonth, {
        targets,
        notes,
        revision,
      });
      setRevision(res.plan?.revision || revision + 1);
      setStatusMsg({ type: 'success', text: t('monthlyPlan.planSavedSuccess') });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setIsConflict(true);
        setStatusMsg({
          type: 'error',
          text: t('common.error'),
        });
      } else {
        setStatusMsg({ type: 'error', text: err.message || t('common.error') });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setStatusMsg(null);
    try {
      await api.saveMonthlyPlan(selectedMonth, { targets, notes, revision });
      await api.shareMonthlyPlan(selectedMonth);
      setPlanStatus('shared');
      setStatusMsg({ type: 'success', text: t('monthlyPlan.planSharedSuccess') });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    setPrintTimestamp(formatDate(new Date(), { dateStyle: 'long', timeStyle: 'short' }));
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const statusLabel =
    planStatus === 'shared'
      ? t('monthlyPlan.planStatusShared')
      : planStatus === 'reviewed'
      ? t('monthlyPlan.planStatusReviewed')
      : t('monthlyPlan.planStatusDraft');

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* ==================== A4 PRINT-ONLY HEADER ==================== */}
      <div className="print-only border-b-2 border-slate-900 pb-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              {t('monthlyPlan.printHeader')}
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              {t('monthlyPlan.printSubheader')}
            </p>
          </div>
          <div className="text-end text-xs font-mono text-slate-600">
            <div>{t('monthlyPlan.monthSelectLabel')} <strong>{formatMonthKey(selectedMonth)}</strong> ({selectedMonth})</div>
            <div>{t('dailyReport.revisionLabel')} Rev.{formatNumber(revision)}</div>
          </div>
        </div>

        {/* Student and Organization Meta Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs">
          <div>
            <span className="text-slate-500 block">{t('monthlyPlan.studentNameLabel')}</span>
            <strong className="text-slate-900">{userProfile?.name || user?.name || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">{t('auth.emailLabel')}:</span>
            <span className="font-mono text-slate-800">{userProfile?.email || user?.email || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('common.status')}:</span>
            <span className="font-bold text-slate-900">{statusLabel}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('monthlyPlan.organizationLabel')}</span>
            <span className="text-slate-800">{user?.orgId || t('common.appTitle')}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('profile.roleLabel')}:</span>
            <span className="text-slate-800">{userProfile?.profile?.responsibility || userProfile?.profile?.branch || t('profile.studentRole')}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('common.date')}:</span>
            <span className="text-slate-700 font-mono text-xs">
              {printTimestamp || formatDate(new Date())}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== SCREEN-ONLY PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-surface islamic-card p-4 sm:p-5 rounded-2xl border border-theme-border shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>{t('monthlyPlan.title')}</span>
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                planStatus === 'shared'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {statusLabel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              rev.{formatNumber(revision)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('monthlyPlan.subtitle')}
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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={t('common.print')}
          >
            <Printer className="h-4 w-4" />
            <span>{t('common.print')}</span>
          </button>
        </div>
      </div>

      {/* Screen Status banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 no-print ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          {isConflict && (
            <button
              type="button"
              onClick={loadPlan}
              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold text-xs cursor-pointer"
            >
              {t('common.retry')}
            </button>
          )}
        </div>
      )}

      {/* ==================== TARGET GROUPS ==================== */}
      <div className="space-y-5">
        {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => {
          const eligibleMetrics = group.metrics.filter(
            (m: MetricDefinition) => m.type !== 'boolean'
          );
          if (eligibleMetrics.length === 0) return null;

          const groupTitle = getGroupTitle(group, locale);

          return (
            <div
              key={group.id}
              className="bg-theme-surface islamic-card rounded-2xl border border-theme-border shadow-sm p-4 sm:p-5 space-y-3 print-card"
            >
              {/* Group Heading */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs print:bg-slate-100 print:text-slate-900">
                    {formatNumber(group.order)}
                  </span>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 print:text-slate-950">
                    {groupTitle}
                  </h2>
                </div>
                <span className="text-xs text-slate-400 print:text-slate-600 font-medium">
                  {formatNumber(eligibleMetrics.length)} {t('common.actions')}
                </span>
              </div>

              {/* SCREEN-ONLY: Interactive Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 no-print">
                {eligibleMetrics.map((metric: MetricDefinition) => {
                  const mLabel = getMetricLabel(metric, locale);
                  const mUnit = getMetricUnit(metric, locale);
                  return (
                    <div key={metric.id} className="space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-sm">
                        <label className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={mLabel}>
                          {mLabel}
                        </label>
                        {mUnit && (
                          <span className="text-xs text-slate-400 font-normal">({mUnit})</span>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={targets[metric.id] ?? ''}
                        onChange={(e) => handleTargetChange(metric.id, e.target.value)}
                        className="w-full px-3 py-2 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  );
                })}
              </div>

              {/* PRINT-ONLY: Clean Table */}
              <div className="print-only">
                <table className="w-full text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="py-1.5 px-3 text-start w-12 font-bold">#</th>
                      <th className="py-1.5 px-3 text-start font-bold">{t('monthlyPlan.setTargetHeader')}</th>
                      <th className="py-1.5 px-3 text-end w-28 font-bold">{t('monthlyPlan.targetInputLabel')}</th>
                      <th className="py-1.5 px-3 text-start w-24 font-bold">{t('monthlyPlan.unitLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {eligibleMetrics.map((metric: MetricDefinition, idx: number) => {
                      const val = targets[metric.id];
                      return (
                        <tr key={metric.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono text-slate-500">{formatNumber(idx + 1)}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-900">{getMetricLabel(metric, locale)}</td>
                          <td className="py-1.5 px-3 text-end font-bold text-slate-950 font-mono">
                            {val !== undefined && val !== null ? formatNumber(val) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{getMetricUnit(metric, locale) || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Special Notes & Goals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-2.5 print-card">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 print:text-slate-950">
            <FileText className="h-4 w-4 text-brand-600 print:text-slate-900" />
            <span>{t('common.notes')}</span>
          </h2>

          {/* Screen textarea */}
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 no-print"
          />

          {/* Print readable text */}
          <div className="print-only p-3 bg-slate-50 rounded-lg border border-slate-300 text-xs text-slate-900 whitespace-pre-wrap min-h-16">
            {notes.trim() ? notes : t('common.noData')}
          </div>
        </div>

        {/* ==================== SUPERVISOR ADVICE IN PRINT ==================== */}
        {planAdvice.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3 print-card">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <MessageSquare className="h-4 w-4 text-brand-600 print:text-slate-900" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                {t('monthlyOutcome.adviceThreadHeader')}
              </h2>
            </div>

            <div className="space-y-2.5">
              {planAdvice.map((adv: any) => (
                <div
                  key={adv.id || adv._id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {adv.authorName} ({adv.authorRole ? t('profile.supervisorRole') : ''})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(adv.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {adv.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SCREEN ACTION BAR ==================== */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print">
          <PermissionGate permission={PERMISSIONS.MONTHLY_PLAN_WRITE_OWN}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? t('monthlyPlan.savingDraft') : t('monthlyPlan.saveDraftBtn')}</span>
            </button>
          </PermissionGate>

          <PermissionGate permission={PERMISSIONS.MONTHLY_PLAN_SHARE_OWN}>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
            >
              <Send className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
              <span>{sharing ? t('monthlyPlan.sharingPlan') : t('monthlyPlan.shareSupervisorBtn')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};
