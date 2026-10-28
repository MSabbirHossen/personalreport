import React from 'react';
import { DailySummaryComparison } from '@reportbd/shared';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface DailySummaryCardProps {
  comparison: DailySummaryComparison;
  selectedDate: string;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  comparison,
  selectedDate,
}) => {
  const { t, formatDate } = useLanguage();
  const { categories, yesterdayDateKey, hasYesterdayData } = comparison;

  return (
    <div className="bg-theme-surface islamic-card rounded-2xl border border-theme-border shadow-sm p-5 sm:p-6 space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-2.5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-200">
              {t('dailyReport.summaryTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('dailyReport.summarySubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            {t('dailyReport.previousDay')}:{' '}
            <strong>{yesterdayDateKey ? formatDate(yesterdayDateKey) : t('common.unrecorded')}</strong>
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm sm:text-base border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              <th className="py-3 px-3.5 font-semibold text-start">{t('common.status')}</th>
              <th className="py-3 px-3.5 font-semibold text-end">{t('dailyReport.todayBadge')}</th>
              <th className="py-3 px-3.5 font-semibold text-end">{t('dailyReport.previousDay')}</th>
              <th className="py-3 px-3.5 font-semibold text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {categories.map((cat) => {
              const isIncrease = cat.status === 'increase';
              const isDecrease = cat.status === 'decrease';
              const isSame = cat.status === 'same';
              const noComp = cat.status === 'no_comparison';

              return (
                <tr
                  key={cat.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Category Title */}
                  <td className="py-3.5 px-3.5 text-slate-800 dark:text-slate-200 font-semibold text-start">
                    {cat.label}
                  </td>

                  {/* Today Value */}
                  <td className="py-3.5 px-3.5 text-end text-slate-900 dark:text-slate-100 font-bold">
                    {cat.todayFormatted}
                  </td>

                  {/* Yesterday Value */}
                  <td className="py-3.5 px-3.5 text-end text-slate-600 dark:text-slate-300">
                    {cat.yesterdayFormatted}
                  </td>

                  {/* Difference Badge */}
                  <td className="py-3.5 px-3.5 text-end whitespace-nowrap">
                    {noComp ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-400 font-normal">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>{t('common.noData')}</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                          isIncrease
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                            : isDecrease
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isIncrease && <TrendingUp className="h-4 w-4" />}
                        {isDecrease && <TrendingDown className="h-4 w-4" />}
                        {isSame && <Minus className="h-4 w-4" />}
                        <span>{cat.diffFormatted}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasYesterdayData && (
        <p className="text-sm text-slate-400 dark:text-slate-500 pt-1 text-center sm:text-start">
          * {t('dailyReport.comparisonNoYesterday')}
        </p>
      )}
    </div>
  );
};
