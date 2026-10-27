import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import {
  DEFAULT_METRIC_GROUPS,
  getGroupTitle,
  getMetricLabel,
  getMetricUnit,
} from '@reportbd/shared';
import { useTranslation } from '../context/LanguageContext.js';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const SupervisorReportReviewPage: React.FC = () => {
  const { outcomeId } = useParams<{ outcomeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale, direction, formatDate, formatNumber, formatMonthKey } = useTranslation();

  const [reviewAction, setReviewAction] = useState<'acknowledge' | 'return'>('acknowledge');
  const [feedback, setFeedback] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [selectedAdviceId, setSelectedAdviceId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<{ message: string; code?: string } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['supervisor-report-detail', outcomeId],
    queryFn: () => api.getSupervisorReportDetail(outcomeId!),
    enabled: !!outcomeId,
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      setConflictError(null);
      return api.submitSupervisorReview(outcomeId!, {
        action: reviewAction,
        feedback: feedback.trim() || undefined,
        revision: data?.outcome?.revision,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-report-detail', outcomeId] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-queue'] });
      alert(res.message || t('supervisor.reviewSubmittedSuccess'));
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'ALREADY_REVIEWED' || err.code === 'CONFLICT') {
        setConflictError({
          message: err.message || t('supervisor.conflictErrorTitle'),
          code: err.code,
        });
      } else {
        alert(err.message || t('common.error'));
      }
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ adviceId, body }: { adviceId: string; body: string }) => {
      return api.replyAdvice(adviceId, body);
    },
    onSuccess: () => {
      setReplyText('');
      setSelectedAdviceId(null);
      refetch();
    },
    onError: (err: any) => {
      alert(err.message || t('common.error'));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-slate-500 text-sm">
        {t('common.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Link
          to="/supervisor/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" /> {t('supervisor.backToQueue')}
        </Link>
        <div className="p-5 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-200">
          {t('supervisor.reportNotFound')}
        </div>
      </div>
    );
  }

  const { outcome, student, plan, adviceHistory } = data;
  const isReviewed = outcome.status === 'acknowledged';
  const isReturned = outcome.status === 'returned';
  const derivedValues = outcome.derivedValues || {};
  const targets = plan?.targets || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/supervisor/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" />
          <span>{t('supervisor.backToQueue')}</span>
        </Link>
      </div>

      {/* Student & Report Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-xl">
            {student?.name ? student.name.charAt(0) : 'S'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {student?.name}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  outcome.status === 'submitted'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : outcome.status === 'acknowledged'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {outcome.status === 'submitted'
                  ? t('monthlyOutcome.statusSubmitted')
                  : outcome.status === 'acknowledged'
                  ? t('monthlyOutcome.statusApproved')
                  : t('monthlyOutcome.statusReturned')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {student?.email} • {student?.profile?.educationInstitution || t('profile.studentRole')}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {t('supervisor.reportMonthLabel')}{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {formatMonthKey(outcome.monthKey)}
                </strong>
              </span>
              <span>
                {t('supervisor.revisionCount')}: #{formatNumber(outcome.revision || 1)}
              </span>
              {outcome.submittedAt && (
                <span>
                  {t('supervisor.submittedDateLabel')} {formatDate(outcome.submittedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {outcome.reviewedAt && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 block font-medium">
              {t('supervisor.reviewCompletedLabel')}
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {formatDate(outcome.reviewedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Stale snapshot warning */}
      {outcome.isStale && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs space-y-1 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">{t('supervisor.staleWarningTitle')}</span>
            <p>
              {t('supervisor.staleWarningDesc', {
                reason: outcome.staleReason || t('monthlyOutcome.staleDataWarning'),
              })}
            </p>
          </div>
        </div>
      )}

      {/* Plan Targets vs Actual Outcomes Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('supervisor.planVsActualTitle')}
          </h2>
          <span className="text-xs text-slate-500">
            {t('supervisor.frozenSnapshotSubtitle')}
          </span>
        </div>

        <div className="grid gap-6">
          {DEFAULT_METRIC_GROUPS.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {getGroupTitle(group, locale)}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60 text-slate-500">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-start">
                        {t('supervisor.activityHeader')}
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-center">
                        {t('supervisor.targetHeader')}
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-center">
                        {t('supervisor.actualHeader')}
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-center">
                        {t('supervisor.unitHeader')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                    {group.metrics.map((metric) => {
                      const targetVal = targets[metric.id];
                      const actualVal = derivedValues[metric.id];
                      const hasTarget = targetVal !== undefined && targetVal !== null && targetVal !== '';
                      const hasActual = actualVal !== undefined && actualVal !== null;

                      return (
                        <tr key={metric.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100 text-start">
                            {getMetricLabel(metric, locale)}
                          </td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">
                            {hasTarget ? formatNumber(targetVal) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-brand-600 dark:text-brand-400">
                            {hasActual ? formatNumber(actualVal) : formatNumber(0)}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-400 text-[11px]">
                            {getMetricUnit(metric, locale)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Reflections */}
      {outcome.reflections && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('supervisor.reflectionsTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                {t('supervisor.achievementsTitle')}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {outcome.reflections.achievements || t('supervisor.noComments')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                {t('supervisor.challengesTitle')}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {outcome.reflections.challenges || t('supervisor.noComments')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block">
                {t('supervisor.nextMonthTitle')}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {outcome.reflections.nextMonthPriorities || t('supervisor.noComments')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Action Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-brand-200 dark:border-brand-900 shadow-md space-y-5">
        <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-base">
          <ShieldCheck className="h-5 w-5" />
          <span>{t('supervisor.supervisorDecisionTitle')}</span>
        </div>

        {conflictError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{t('supervisor.conflictErrorTitle')}</span>
            </div>
            <p>{conflictError.message}</p>
            <button
              onClick={() => {
                setConflictError(null);
                refetch();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('supervisor.conflictErrorReload')}</span>
            </button>
          </div>
        )}

        {/* Action Radio Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
              reviewAction === 'acknowledge'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
            }`}
          >
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'acknowledge'}
              onChange={() => setReviewAction('acknowledge')}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm block">{t('supervisor.acknowledgeOption')}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {t('supervisor.acknowledgeDesc')}
              </span>
            </div>
          </label>

          <label
            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
              reviewAction === 'return'
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
            }`}
          >
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'return'}
              onChange={() => setReviewAction('return')}
              className="text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="text-sm block">{t('supervisor.returnOption')}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {t('supervisor.returnDesc')}
              </span>
            </div>
          </label>
        </div>

        {/* Written Feedback input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('supervisor.feedbackLabel')}
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('supervisor.feedbackPlaceholder')}
            className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Submit review button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
              reviewAction === 'acknowledge'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            } disabled:opacity-50`}
          >
            {reviewMutation.isPending
              ? t('common.loading')
              : reviewAction === 'acknowledge'
              ? t('supervisor.confirmApprovalBtn')
              : t('supervisor.confirmReturnBtn')}
          </button>
        </div>
      </div>

      {/* Advice and Guidance Conversation History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand-600" />
          <span>
            {t('supervisor.adviceHistoryTitle')} ({formatNumber(adviceHistory.length)})
          </span>
        </h2>

        {adviceHistory.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 text-slate-400 text-xs">
            {t('supervisor.noAdviceHistory')}
          </div>
        ) : (
          <div className="space-y-3">
            {adviceHistory.map((item: any) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {item.authorName} ({item.authorRole})
                  </span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.body}
                </p>

                {/* Replies list */}
                {item.replies && item.replies.length > 0 && (
                  <div className="space-y-2 ps-4 border-s-2 border-brand-200 dark:border-brand-900 pt-2">
                    {item.replies.map((reply: any, rIdx: number) => (
                      <div key={rIdx} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <span>{reply.authorName}</span>
                          <span className="text-[10px] text-slate-400">({reply.authorRole})</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply action */}
                <div className="pt-2 flex items-center justify-end">
                  {selectedAdviceId === item.id ? (
                    <div className="w-full space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('advice.replyPlaceholder')}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAdviceId(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() =>
                            replyMutation.mutate({ adviceId: item.id, body: replyText })
                          }
                          disabled={!replyText.trim() || replyMutation.isPending}
                          className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {replyMutation.isPending ? t('common.loading') : t('advice.sendReplyBtn')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAdviceId(item.id)}
                      className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
                    >
                      {t('supervisor.replyBtn')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
