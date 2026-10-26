import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_METRIC_GROUPS, MetricGroup, MetricDefinition } from '@reportbd/shared';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Target,
  Save,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Building,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const MonthlyPlanPage: React.FC = () => {
  const { user } = useAuth();
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

  const formatMonthBangla = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-');
    const monthsBn = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    const monthIdx = parseInt(m, 10) - 1;
    const monthName = monthsBn[monthIdx] || yearMonth;
    return `${monthName} ${y}`;
  };

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
      setStatusMsg({ type: 'success', text: 'পরিকল্পনা সফলভাবে সংরক্ষণ করা হয়েছে।' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setIsConflict(true);
        setStatusMsg({
          type: 'error',
          text: 'অন্য ডিভাইসে পরিকল্পনাটি পরিবর্তন হয়েছে। সর্বশেষ তথ্য দেখতে নিচের রিলোড বাটনে চাপ দিন।',
        });
      } else {
        setStatusMsg({ type: 'error', text: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
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
      setStatusMsg({ type: 'success', text: 'পরিকল্পনা দায়িত্বশীলের সাথে শেয়ার করা হয়েছে!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'শেয়ার ব্যর্থ হয়েছে।' });
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    setPrintTimestamp(
      new Date().toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    // Short timeout to guarantee printTimestamp is rendered before browser print dialog activates
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* ==================== A4 PRINT-ONLY HEADER (PLAN-04) ==================== */}
      <div className="print-only border-b-2 border-slate-900 pb-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              ব্যক্তিগত রিপোর্ট ম্যানেজমেন্ট প্ল্যাটফর্ম — Report-BPS
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              মাসিক পরিকল্পনা ও লক্ষ্যমাত্রা বিবরণী (Monthly Plan & Target Sheet)
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-600">
            <div>মাস: <strong>{formatMonthBangla(selectedMonth)}</strong> ({selectedMonth})</div>
            <div>সংস্করণ: Rev.{revision}</div>
          </div>
        </div>

        {/* Student and Organization Meta Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-[11px]">
          <div>
            <span className="text-slate-500 block">শিক্ষার্থীর নাম:</span>
            <strong className="text-slate-900">{userProfile?.name || user?.name || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">ইমেইল / আইডি:</span>
            <span className="font-mono text-slate-800">{userProfile?.email || user?.email || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">অবস্থা (Status):</span>
            <span className="font-bold text-slate-900">
              {planStatus === 'shared' ? 'দায়িত্বশীলের কাছে জমা (Shared)' : 'খসড়া (Draft)'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">সংস্থা (Organization):</span>
            <span className="text-slate-800">{user?.orgId || 'বাংলাদেশ কেন্দ্রীয় শাখা'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">শাখা / দায়িত্ব:</span>
            <span className="text-slate-800">{userProfile?.profile?.responsibility || userProfile?.profile?.branch || 'সাধারণ'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">প্রিন্টের সময়:</span>
            <span className="text-slate-700 font-mono text-[10px]">
              {printTimestamp || new Date().toLocaleString('bn-BD')}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== SCREEN-ONLY PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              মাসিক পরিকল্পনা
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                planStatus === 'shared'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {planStatus === 'shared' ? 'দায়িত্বশীলের কাছে জমা' : 'খসড়া (Draft)'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              rev.{revision}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            চলতি মাসের লক্ষ্যমাত্রা ও টার্গেট নির্ধারণ করুন
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
            title="A4 সাইজে প্রিন্ট বা PDF সংরক্ষণ করুন"
          >
            <Printer className="h-4 w-4" />
            <span>A4 প্রিন্ট / PDF</span>
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
              ডাটা রিলোড করুন
            </button>
          )}
        </div>
      )}

      {/* ==================== TARGET GROUPS (DUAL SCREEN & PRINT A4) ==================== */}
      <div className="space-y-5">
        {DEFAULT_METRIC_GROUPS.map((group: MetricGroup) => {
          const eligibleMetrics = group.metrics.filter(
            (m: MetricDefinition) => m.type !== 'boolean'
          );
          if (eligibleMetrics.length === 0) return null;

          return (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3 print-card"
            >
              {/* Group Heading */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs print:bg-slate-100 print:text-slate-900">
                    {group.order}
                  </span>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                    {group.titleBn} (টার্গেট ও পরিকল্পনা)
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-medium">
                  {eligibleMetrics.length} টি সূচক
                </span>
              </div>

              {/* SCREEN-ONLY: Interactive Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 no-print">
                {eligibleMetrics.map((metric: MetricDefinition) => (
                  <div key={metric.id} className="space-y-1 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-slate-700 dark:text-slate-300 truncate" title={metric.labelBn}>
                        {metric.labelBn}
                      </label>
                      {metric.unitBn && (
                        <span className="text-[11px] text-slate-400 font-normal">({metric.unitBn})</span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="মাসের লক্ষ্যমাত্রা"
                      value={targets[metric.id] ?? ''}
                      onChange={(e) => handleTargetChange(metric.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                ))}
              </div>

              {/* PRINT-ONLY: Clean High-Density A4 Table */}
              <div className="print-only">
                <table className="w-full text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="py-1.5 px-3 text-left w-12 font-bold">ক্রমি</th>
                      <th className="py-1.5 px-3 text-left font-bold">সূচক ও ক্ষেত্র</th>
                      <th className="py-1.5 px-3 text-right w-28 font-bold">নির্ধারিত টার্গেট</th>
                      <th className="py-1.5 px-3 text-left w-24 font-bold">একক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {eligibleMetrics.map((metric: MetricDefinition, idx: number) => {
                      const val = targets[metric.id];
                      return (
                        <tr key={metric.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-900">{metric.labelBn}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-950 font-mono">
                            {val !== undefined && val !== null ? val : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{metric.unitBn || '—'}</td>
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
            বিশেষ লক্ষ্য, ব্যক্তিগত কর্মপরিকল্পনা ও মন্তব্য
          </h2>

          {/* Screen textarea */}
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="এই মাসের বিশেষ কোনো লক্ষ্য বা দায়িত্বশীলের উদ্দেশ্যে কোনো বার্তা থাকলে লিখুন..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 no-print"
          />

          {/* Print readable text */}
          <div className="print-only p-3 bg-slate-50 rounded-lg border border-slate-300 text-xs text-slate-900 whitespace-pre-wrap min-h-16">
            {notes.trim() ? notes : 'কোনো বিশেষ মন্তব্য বা ব্যক্তিগত লক্ষ্যমাত্রা উল্লেখ করা হয়নি।'}
          </div>
        </div>

        {/* ==================== SUPERVISOR ADVICE IN PRINT (PLAN-04) ==================== */}
        {planAdvice.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3 print-card">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <MessageSquare className="h-4 w-4 text-brand-600 print:text-slate-900" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                দায়িত্বশীলের পর্যবেক্ষণ ও পরামর্শ (Supervisor Feedback)
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
                      {adv.authorName} ({adv.authorRole || 'দায়িত্বশীল'})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(adv.createdAt).toLocaleDateString('bn-BD')}
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

        {/* ==================== OFFICIAL PRINT SIGNATURES BLOCK (PLAN-04) ==================== */}
        <div className="print-only print-signatures">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-12">
              <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">
                শিক্ষার্থীর স্বাক্ষর:
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div>নাম: {userProfile?.name || user?.name}</div>
                <div>তারিখ: ....................................................</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">
                দায়িত্বশীল / পর্যালোচকের স্বাক্ষর:
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div>মন্তব্য / অনুমোদন: ........................................</div>
                <div>তারিখ: ....................................................</div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SCREEN ACTION BAR ==================== */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>খসড়া সংরক্ষণ</span>
          </button>

          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>দায়িত্বশীলের সাথে শেয়ার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
