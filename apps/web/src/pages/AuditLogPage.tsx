import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useTranslation } from '../context/LanguageContext.js';

export const AuditLogPage: React.FC = () => {
  const { t, formatDate, formatNumber } = useTranslation();
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [actorId, setActorId] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const limit = 25;
  const offset = (page - 1) * limit;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['auditEvents', { from, to, action, entityType, actorId, page }],
    queryFn: () =>
      api.getAuditEvents({
        from: from || undefined,
        to: to || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        actorId: actorId.trim() || undefined,
        limit,
        offset,
      }),
  });

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadge = (actionName: string) => {
    switch (actionName) {
      case 'review.acknowledged':
      case 'invitation.accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            {actionName}
          </span>
        );
      case 'review.returned':
      case 'invitation.revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="h-3 w-3" />
            {actionName}
          </span>
        );
      case 'report.submitted':
      case 'plan.shared':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Send className="h-3 w-3" />
            {actionName}
          </span>
        );
      case 'assignment.created':
      case 'invitation.created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <UserCheck className="h-3 w-3" />
            {actionName}
          </span>
        );
      case 'advice.created':
      case 'advice.replied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <MessageSquare className="h-3 w-3" />
            {actionName}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileCheck className="h-3 w-3" />
            {actionName}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('audit.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('audit.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{t('audit.refreshBtn')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Filter className="h-4 w-4 text-brand-600" />
          <span>{t('audit.filterTitle')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* From Date */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('audit.fromDateLabel')}</span>
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('audit.toDateLabel')}</span>
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('audit.actionHeader')}
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="">{t('audit.allActions')}</option>
              <option value="review.acknowledged">review.acknowledged</option>
              <option value="review.returned">review.returned</option>
              <option value="report.submitted">report.submitted</option>
              <option value="plan.shared">plan.shared</option>
              <option value="assignment.created">assignment.created</option>
              <option value="invitation.created">invitation.created</option>
              <option value="invitation.accepted">invitation.accepted</option>
              <option value="invitation.revoked">invitation.revoked</option>
              <option value="advice.created">advice.created</option>
              <option value="advice.replied">advice.replied</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('audit.targetHeader')}
            </label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="">{t('audit.allEntities')}</option>
              <option value="monthlyOutcome">monthlyOutcome</option>
              <option value="monthlyPlan">monthlyPlan</option>
              <option value="supervisorAssignment">supervisorAssignment</option>
              <option value="invitation">invitation</option>
              <option value="advice">advice</option>
            </select>
          </div>

          {/* Actor Filter */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              <span>{t('audit.actorIdLabel')}</span>
            </label>
            <input
              type="text"
              placeholder={t('audit.actorIdPlaceholder')}
              value={actorId}
              onChange={(e) => {
                setActorId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">{t('audit.loadingRecords')}</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 font-semibold">
              {(error as any)?.message || t('common.error')}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : !data?.events || data.events.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('audit.noEventsFound')}
            </p>
            <p className="text-xs text-slate-400">
              {t('audit.noRecordsDesc')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4 text-start">{t('audit.timestampHeader')}</th>
                  <th className="py-3 px-4 text-start">{t('audit.actionHeader')}</th>
                  <th className="py-3 px-4 text-start">{t('audit.actorHeader')}</th>
                  <th className="py-3 px-4 text-start">{t('audit.targetHeader')}</th>
                  <th className="py-3 px-4 text-end">{t('audit.metadataHeader')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.events.map((ev: any) => (
                  <tr
                    key={ev.id || ev._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs text-start">
                      {formatDate(ev.time)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-start">{getActionBadge(ev.action)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[130px]" title={ev.actorId}>
                          {ev.actorId}
                        </span>
                        {ev.actorRole && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                            {ev.actorRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-start">
                      <div className="space-y-0.5">
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{ev.entityType}</span>
                        <div className="text-xs font-mono text-slate-400 truncate max-w-[150px]" title={ev.entityId}>
                          {ev.entityId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Info className="h-3 w-3" />
                        <span>{t('audit.detailsBtn')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div>
              {t('audit.paginationTotal', {
                from: formatNumber(offset + 1),
                to: formatNumber(Math.min(offset + limit, total)),
                total: formatNumber(total),
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl-flip" />
                <span>{t('audit.prevBtn')}</span>
              </button>

              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {formatNumber(page)} / {formatNumber(totalPages)}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{t('audit.nextBtn')}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl-flip" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safe Metadata Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {t('audit.modalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl font-mono text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block">Event ID:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedEvent.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Organization:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedEvent.orgId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Action:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedEvent.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Time (UTC):</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedEvent.time}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Actor ID:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedEvent.actorId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Actor Role:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedEvent.actorRole || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Entity Type:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedEvent.entityType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Entity ID:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedEvent.entityId}</span>
                </div>
                {selectedEvent.ip && (
                  <div>
                    <span className="text-slate-400 block">IP:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedEvent.ip}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  {t('audit.metadataTitle')}
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto max-h-56">
                  {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                {t('audit.closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
