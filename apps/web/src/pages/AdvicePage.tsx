import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  User,
  Check,
} from 'lucide-react';

export const AdvicePage: React.FC = () => {
  const [adviceList, setAdviceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdvice = async () => {
    try {
      const res = await api.getAdvice();
      setAdviceList(res.advice || []);
    } catch (err) {
      console.warn('Could not fetch advice:', err);
      // Demo fallback
      setAdviceList([
        {
          id: 'adv_1',
          authorName: 'হাফেজ মাহমুদ হাসান',
          authorRole: 'শাখা দায়িত্বশীল',
          monthKey: '2026-09',
          body: 'মাশাআল্লাহ, কুরআন অধ্যয়ন এবং পাঠ্যবই অধ্যয়নে ধারাবাহিকতা প্রশংসনীয়। তাহাজ্জুদ ও জামায়াতে নামাজে আরও যত্নবান হওয়ার পরামর্শ রইল।',
          isAcknowledged: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvice();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAdvice(id);
      setAdviceList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isAcknowledged: true } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge advice:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            পরামর্শ ও দিকনির্দেশনা
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            মাসিক রিপোর্ট ও পরিকল্পনার প্রেক্ষিতে দায়িত্বশীলদের মূল্যবান মতামত
          </p>
        </div>
      </div>

      {/* Advice List */}
      <div className="space-y-4">
        {adviceList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <MessageSquareQuote className="h-10 w-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              এখনও কোনো পরামর্শ আসেনি
            </div>
            <p className="text-xs text-slate-500">
              মাসিক রিপোর্ট জমা দিলে দায়িত্বশীল পর্যালোচনার পর এখানে পরামর্শ লিপিবদ্ধ করবেন।
            </p>
          </div>
        ) : (
          adviceList.map((item) => (
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
                    {item.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {item.authorName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.authorRole} {item.monthKey && `• মাস: ${item.monthKey}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(item.createdAt).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {item.body}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {item.isAcknowledged ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      পরামর্শটি পড়া ও গ্রহণ করা হয়েছে
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      নতুন পরামর্শ
                    </span>
                  )}
                </div>

                {!item.isAcknowledged && (
                  <button
                    onClick={() => handleAcknowledge(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>গ্রহণ করলাম</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
