import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useTextSize, TextSize } from '../context/TextSizeContext.js';
import { api } from '../services/api.js';
import {
  User,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Type,
  Check,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { textSize, setTextSize, scalePercent } = useTextSize();

  const [name, setName] = useState(user?.name || '');
  const [profile, setProfile] = useState({
    institution: user?.profile?.institution || '',
    department: user?.profile?.department || '',
    academicYear: user?.profile?.academicYear || '',
    bloodGroup: user?.profile?.bloodGroup || '',
    contactNumber: user?.profile?.contactNumber || '',
    address: user?.profile?.address || '',
    bio: user?.profile?.bio || '',
  });

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.updateProfile({
        name,
        profile,
      });
      await refreshUser();
      setStatusMsg({ type: 'success', text: t('common.saved') });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-theme-surface islamic-card p-5 rounded-2xl border border-theme-border shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span>{t('profile.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-theme-surface islamic-card rounded-2xl border border-theme-border shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-base sm:text-lg text-theme-text flex items-center gap-2 border-b border-theme-border pb-3">
            <GraduationCap className="h-5 w-5 text-[var(--primary)]" />
            <span>{t('profile.personalInfoCard')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                {t('profile.nameLabel')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                {t('profile.emailLabel')}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface-muted text-theme-text-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                {t('monthlyPlan.organizationLabel')}
              </label>
              <input
                type="text"
                value={profile.institution}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, institution: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                {t('profile.roleLabel')}
              </label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, department: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                {t('common.date')} / Session
              </label>
              <input
                type="text"
                value={profile.academicYear}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, academicYear: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text">
                Blood Group
              </label>
              <select
                value={profile.bloodGroup}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, bloodGroup: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-semibold text-theme-text">
              {t('common.notes')}
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-theme-border bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Accessibility & Typography Settings Card */}
        <div className="bg-theme-surface islamic-card rounded-2xl border border-theme-border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <h2 className="font-bold text-base sm:text-lg text-theme-text flex items-center gap-2">
              <Type className="h-5 w-5 text-[var(--primary)]" />
              <span>{t('common.textSize')}</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-theme-surface-muted text-[var(--primary)] border border-theme-border">
              {scalePercent}%
            </span>
          </div>

          <p className="text-sm text-theme-text-muted leading-relaxed">
            {t('common.textSizeDescription')}
          </p>

          {/* Size Option Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { id: 'standard' as TextSize, key: 'common.textSizeStandard', percent: '100%' },
                { id: 'large' as TextSize, key: 'common.textSizeLarge', percent: '115%' },
                { id: 'extra-large' as TextSize, key: 'common.textSizeExtraLarge', percent: '130%' },
              ]
            ).map((opt) => {
              const isActive = textSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTextSize(opt.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-start cursor-pointer ${
                    isActive
                      ? 'border-[var(--primary)] bg-[var(--surface-muted)] text-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-xs'
                      : 'border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-muted'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm sm:text-base">
                      {t(opt.key)}
                    </span>
                    <span className="text-xs text-theme-text-muted">
                      {opt.percent}
                    </span>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-[var(--primary)] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Live Interactive Preview Box */}
          <div className="rounded-xl border border-theme-border bg-theme-surface-muted/60 p-4 sm:p-5 space-y-2">
            <div className="text-2xs font-bold tracking-wider uppercase text-theme-text-muted">
              Live Preview
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-theme-text">
              {t('common.textSizePreviewHeading')}
            </h3>
            <p className="text-base text-theme-text-muted leading-relaxed">
              {t('common.textSizePreviewBody')}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-base font-bold shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? t('common.saving') : t('common.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
