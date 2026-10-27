import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Bell, CheckCircle2, Clock, ArrowRight, CheckCheck, AlertCircle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { t, isRTL, formatDate, formatNumber } = useLanguage();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('notifications.title')}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 text-xs font-semibold">
                {formatNumber(unreadCount)} {t('notifications.filterUnread')}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('notifications.subtitle')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="h-4 w-4 text-brand-600" />
            <span>{t('notifications.markAllReadBtn')}</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center text-slate-500 text-sm">
          {t('common.loading')}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{t('common.error')}</span>
          </div>
          <button onClick={() => refetch()} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t('notifications.emptyTitle')}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('notifications.emptyDesc')}
          </p>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-3">
        {notifications.map((item: any) => {
          const isUnread = !item.isRead;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all duration-150 ${
                isUnread
                  ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/80 dark:border-brand-900/60 shadow-sm'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.type === 'report_acknowledged'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.type === 'report_returned'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-brand-600 ring-2 ring-brand-100 dark:ring-brand-900" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {item.actorName && <span>{item.actorName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => {
                        if (isUnread) markReadMutation.mutate(item.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                    >
                      <span>{t('common.edit')}</span>
                      <ArrowRight className={`h-3.5 w-3.5 ${isRTL ? 'rtl-flip' : ''}`} />
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => markReadMutation.mutate(item.id)}
                      title={t('common.confirm')}
                      aria-label={t('common.confirm')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
