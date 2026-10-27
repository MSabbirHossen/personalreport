import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  Check,
  Send,
  MessageCircle,
} from 'lucide-react';

export const AdvicePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { t, isRTL, formatDate, formatMonthKey } = useLanguage();
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['advice-list'],
    queryFn: () => api.getAdvice(),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => api.acknowledgeAdvice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-list'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.replyAdvice(id, body),
    onSuccess: (_, variables) => {
      setReplyTextMap((prev) => ({ ...prev, [variables.id]: '' }));
      setActiveReplyId(null);
      queryClient.invalidateQueries({ queryKey: ['advice-list'] });
    },
    onError: (err: any) => {
      alert(err.message || t('common.error'));
    },
  });

  const adviceList = data?.advice || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span>{t('advice.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('advice.subtitle')}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-slate-500 text-sm">
          {t('common.loading')}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between text-sm">
          <span>{t('common.error')}</span>
          <button onClick={() => refetch()} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Advice List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {adviceList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <MessageSquareQuote className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('advice.noThreadsTitle')}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t('advice.noThreadsDesc')}
              </p>
            </div>
          ) : (
            adviceList.map((item: any) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.isAcknowledged
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    : 'bg-brand-50/40 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                      {item.authorName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {item.authorName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.authorRole || t('profile.supervisorRole')} {item.monthKey && `• ${t('monthlyPlan.monthSelectLabel')} ${formatMonthKey(item.monthKey)}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(item.createdAt, { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {item.body}
                </p>

                {/* Thread Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 ps-4 border-inline-start-2 border-brand-200 dark:border-brand-900">
                    {item.replies.map((reply: any, rIdx: number) => (
                      <div key={rIdx} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <span>{reply.authorName}</span>
                          <span className="text-[10px] text-slate-400">({reply.authorRole})</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDate(reply.createdAt, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {activeReplyId === item.id ? (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <textarea
                      rows={2}
                      value={replyTextMap[item.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder={t('advice.replyPlaceholder')}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() =>
                          replyMutation.mutate({ id: item.id, body: replyTextMap[item.id] || '' })
                        }
                        disabled={
                          !replyTextMap[item.id]?.trim() || replyMutation.isPending
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <Send className={`h-3.5 w-3.5 ${isRTL ? 'rtl-flip' : ''}`} />
                        <span>{t('advice.sendReplyBtn')}</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.isAcknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('advice.statusRead')}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {t('advice.statusUnread')}
                      </span>
                    )}

                    {activeReplyId !== item.id && (
                      <button
                        onClick={() => setActiveReplyId(item.id)}
                        className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{t('advice.sendReplyBtn')}</span>
                      </button>
                    )}
                  </div>

                  {!item.isAcknowledged && (
                    <button
                      onClick={() => acknowledgeMutation.mutate(item.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('common.confirm')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
