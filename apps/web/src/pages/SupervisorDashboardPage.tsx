import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Users,
  ClipboardList,
  CheckCircle,
  RotateCcw,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  UserCheck,
} from 'lucide-react';

export const SupervisorDashboardPage: React.FC = () => {
  const { t, isRTL, formatDate, formatNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<'queue' | 'students'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('submitted');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // 1. Dashboard summary stats
  const {
    data: dashboardData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['supervisor-dashboard'],
    queryFn: () => api.getSupervisorDashboard(),
    refetchInterval: 20000,
  });

  // 2. Review queue
  const {
    data: queueData,
    isLoading: isQueueLoading,
    error: queueError,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['supervisor-queue', statusFilter, selectedMonth],
    queryFn: () =>
      api.getSupervisorQueue({
        status: statusFilter,
        monthKey: selectedMonth || undefined,
        limit: 50,
      }),
    refetchInterval: 20000,
  });

  // 3. Students list
  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['supervisor-students'],
    queryFn: () => api.getSupervisorStudents(),
  });

  const summary = dashboardData?.summary;
  const queueItems = queueData?.queue || [];
  const students = studentsData?.students || [];

  // Filter queue by student search
  const filteredQueue = queueItems.filter((item: any) => {
    if (!searchStudent) return true;
    const term = searchStudent.toLowerCase();
    return (
      item.studentName?.toLowerCase().includes(term) ||
      item.studentEmail?.toLowerCase().includes(term) ||
      item.monthKey?.includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('supervisor.dashboardTitle')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('supervisor.dashboardSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchSummary();
                refetchQueue();
              }}
              className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              {t('audit.refreshBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{t('supervisor.assignedStudentsTitle')}</span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isSummaryLoading ? '...' : formatNumber(summary?.assignedStudentsCount ?? 0)}
          </div>
          <span className="text-[11px] text-slate-400">{t('profile.studentRole')}</span>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">{t('supervisor.pendingReviewsCount')}</span>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isSummaryLoading ? '...' : formatNumber(summary?.pendingReviewsCount ?? 0)}
          </div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">{t('monthlyOutcome.statusSubmitted')}</span>
        </div>

        {/* Card 3: Approved */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-medium">{t('supervisor.approvedCount')}</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isSummaryLoading ? '...' : formatNumber(summary?.acknowledgedThisMonthCount ?? 0)}
          </div>
          <span className="text-[11px] text-slate-400">{t('monthlyOutcome.statusApproved')}</span>
        </div>

        {/* Card 4: Returned */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{t('supervisor.returnedCount')}</span>
            <RotateCcw className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {isSummaryLoading ? '...' : formatNumber(summary?.returnedThisMonthCount ?? 0)}
          </div>
          <span className="text-[11px] text-slate-400">{t('monthlyOutcome.statusReturned')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>{t('supervisor.reviewQueueTitle')}</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{t('supervisor.assignedStudentsTitle')} ({formatNumber(students.length)})</span>
        </button>
      </div>

      {/* Tab Content: Review Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 shrink-0 mx-1" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>{t('common.status')}:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="submitted">{t('monthlyOutcome.statusSubmitted')}</option>
                <option value="all">{t('common.all')}</option>
                <option value="acknowledged">{t('monthlyOutcome.statusApproved')}</option>
                <option value="returned">{t('monthlyOutcome.statusReturned')}</option>
              </select>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {isQueueLoading && (
            <div className="p-12 text-center text-slate-500 text-sm">
              {t('common.loading')}
            </div>
          )}

          {/* Error */}
          {queueError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between text-sm">
              <span>{t('common.error')}</span>
              <button onClick={() => refetchQueue()} className="underline font-semibold cursor-pointer">
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Empty */}
          {!isQueueLoading && !queueError && filteredQueue.length === 0 && (
            <div className="p-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-2">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {t('supervisor.noPendingReviews')}
              </h3>
            </div>
          )}

          {/* Queue List Cards */}
          <div className="grid gap-3">
            {filteredQueue.map((item: any) => {
              const statusBadge =
                item.status === 'submitted'
                  ? { label: t('monthlyOutcome.statusSubmitted'), bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' }
                  : item.status === 'acknowledged'
                  ? { label: t('monthlyOutcome.statusApproved'), bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                  : item.status === 'returned'
                  ? { label: t('monthlyOutcome.statusReturned'), bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' }
                  : { label: item.status, bg: 'bg-slate-100 text-slate-800' };

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {item.studentName}
                      </span>
                      <span className="text-xs text-slate-400">({item.studentEmail})</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      {item.isStale && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{t('monthlyOutcome.staleDataWarning')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('common.date')}: <strong className="font-semibold text-slate-700 dark:text-slate-300">{item.monthKey}</strong>
                      </span>
                      {item.submittedAt && (
                        <span>
                          {t('supervisor.submittedAtHeader')}: {formatDate(item.submittedAt, { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span>rev.#{formatNumber(item.revision)}</span>
                    </div>

                    {item.isStale && item.staleReason && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400/90 pt-0.5">
                        ⚠️ {item.staleReason}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/supervisor/reports/${item.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm shadow-brand-500/20 shrink-0"
                  >
                    <span>{t('supervisor.reviewReportBtn')}</span>
                    <ArrowRight className={`h-3.5 w-3.5 ${isRTL ? 'rtl-flip' : ''}`} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Assigned Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {isStudentsLoading && (
            <div className="p-12 text-center text-slate-500 text-sm">
              {t('common.loading')}
            </div>
          )}

          {!isStudentsLoading && students.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 text-slate-500 text-sm">
              {t('supervisor.noAssignedStudents')}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student: any) => (
              <div
                key={student.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-base">
                    {student.name ? student.name.charAt(0) : 'S'}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {student.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {student.email}
                    </p>
                    {student.profile?.institution && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {student.profile.institution}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {t('profile.studentRole')}
                  </span>
                  <Link
                    to={`/supervisor/students/${student.id}/reports`}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>{t('nav.monthlyOutcome')}</span>
                    <ArrowRight className={`h-3 w-3 ${isRTL ? 'rtl-flip' : ''}`} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
