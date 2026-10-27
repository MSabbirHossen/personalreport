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

interface DailySummaryCardProps {
  comparison: DailySummaryComparison;
  selectedDate: string;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  comparison,
  selectedDate,
}) => {
  const { categories, yesterdayDateKey, hasYesterdayData } = comparison;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              দৈনিক সারাংশ ও গতকালের সাথে তুলনা
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              ৫টি মূল সূচকের বর্তমান অর্জন এবং পূর্ববর্তী দিনের সাথে তুলনামূলক অগ্রগতি
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>
            গতকাল: <strong>{yesterdayDateKey || 'প্রযোজ্য নয়'}</strong>
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3 font-semibold">মূল সূচক (Metric)</th>
              <th className="py-2.5 px-3 font-semibold text-right">আজকের অর্জন (Today)</th>
              <th className="py-2.5 px-3 font-semibold text-right">গতকালের অর্জন (Yesterday)</th>
              <th className="py-2.5 px-3 font-semibold text-right">পার্থক্য (Difference)</th>
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
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                    {cat.label}
                  </td>

                  {/* Today Value */}
                  <td className="py-3 px-3 text-right text-slate-900 dark:text-slate-100 font-bold">
                    {cat.todayFormatted}
                  </td>

                  {/* Yesterday Value */}
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                    {cat.yesterdayFormatted}
                  </td>

                  {/* Difference Badge */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {noComp ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                        <HelpCircle className="h-3 w-3" />
                        <span>তথ্য নেই</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isIncrease
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                            : isDecrease
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isIncrease && <TrendingUp className="h-3 w-3" />}
                        {isDecrease && <TrendingDown className="h-3 w-3" />}
                        {isSame && <Minus className="h-3 w-3" />}
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
        <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 text-center sm:text-left">
          * গতকালের ({yesterdayDateKey}) কোনো সংরক্ষিত রিপোর্ট পাওয়া যায়নি। তুলনামূলক পার্থক্য উপলব্ধ নয়।
        </p>
      )}
    </div>
  );
};
