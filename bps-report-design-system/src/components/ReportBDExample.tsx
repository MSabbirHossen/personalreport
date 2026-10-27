import React from "react";
import { ReportBDLogo } from "./ReportBDLogo";
import { useLanguage } from "./LanguageProvider";
import { useTheme } from "./ThemeProvider";

const copy = {
  bn: { greeting: "আসসালামু আলাইকুম", subtitle: "আজকের অগ্রগতির সংক্ষিপ্ত বিবরণ", reports: "দৈনিক রিপোর্ট", tasks: "মোট কাজ", done: "সম্পন্ন", pending: "বাকি", action: "নতুন রিপোর্ট তৈরি", theme: "থিম", language: "ভাষা" },
  en: { greeting: "Welcome back", subtitle: "Here is your progress for today", reports: "Daily reports", tasks: "Total tasks", done: "Completed", pending: "Pending", action: "Create daily report", theme: "Theme", language: "Language" },
  ar: { greeting: "السلام عليكم", subtitle: "إليك ملخص تقدمك اليوم", reports: "التقارير اليومية", tasks: "إجمالي المهام", done: "مكتمل", pending: "قيد الانتظار", action: "إنشاء تقرير يومي", theme: "المظهر", language: "اللغة" },
};

export function ReportBDExample() {
  const { locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = copy[locale];

  return (
    <main className="rb-app">
      <div className="rb-container" style={{ paddingBlock: 24 }}>
        <header className="rb-dashboard-header rb-card" style={{ marginBottom: 24 }}>
          <ReportBDLogo size={42} tagline />
          <div className="rb-nav" aria-label="Preferences">
            <label>
              <span className="rb-muted" style={{ marginInlineEnd: 6 }}>{t.language}</span>
              <select className="rb-input" style={{ width: "auto", display: "inline-block" }} value={locale} onChange={e => setLocale(e.target.value as "bn" | "en" | "ar")} aria-label={t.language}>
                <option value="bn">বাংলা</option><option value="en">English</option><option value="ar">العربية</option>
              </select>
            </label>
            <button className="rb-button rb-button--outline" onClick={toggleTheme} type="button">{t.theme}: {theme}</button>
          </div>
        </header>

        <section className="rb-pattern rb-card" style={{ marginBottom: 20, padding: "28px 24px" }}>
          <div className="rb-eyebrow">REPORT BD / OVERVIEW</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: "clamp(1.7rem, 4vw, 2.5rem)", letterSpacing: "-.04em" }}>{t.greeting}</h1>
          <p className="rb-muted" style={{ margin: 0 }}>{t.subtitle}</p>
        </section>

        <section className="rb-grid" aria-label={t.reports}>
          {[
            { label: t.tasks, value: "12", detail: "↑ 2 this week", badge: "rb-badge" },
            { label: t.done, value: "08", detail: "67% complete", badge: "rb-badge rb-badge--success" },
            { label: t.pending, value: "04", detail: "Needs attention", badge: "rb-badge rb-badge--warning" },
            { label: t.reports, value: "06", detail: "Updated today", badge: "rb-badge" },
          ].map(item => (
            <article className="rb-card rb-span-3" key={item.label}>
              <div className="rb-stat">
                <div><div className="rb-muted" style={{ fontSize: ".9rem" }}>{item.label}</div><div className="rb-stat__value" style={{ marginTop: 8 }}>{item.value}</div></div>
                <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--primary)", marginTop: 6 }} />
              </div>
              <div style={{ marginTop: 16 }}><span className={item.badge}>{item.detail}</span></div>
            </article>
          ))}
          <article className="rb-card rb-span-8">
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{t.reports}</h2>
            <p className="rb-muted">A calm, readable surface for report summaries, activity, and data visualizations.</p>
            <div className="rb-skeleton" style={{ height: 12, width: "100%", marginBlock: 10 }} />
            <div className="rb-skeleton" style={{ height: 12, width: "76%", marginBlock: 10 }} />
            <div className="rb-skeleton" style={{ height: 12, width: "58%", marginBlock: 10 }} />
          </article>
          <article className="rb-card rb-span-4">
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{t.action}</h2>
            <p className="rb-muted">Keep primary actions obvious and reserve red for important warnings.</p>
            <button className="rb-button rb-mobile-full" type="button">{t.action} <span aria-hidden="true">↗</span></button>
          </article>
        </section>
        <footer className="rb-muted" style={{ textAlign: "center", paddingBlock: 28, fontSize: ".85rem" }}>Built with faith, knowledge and technology.</footer>
      </div>
    </main>
  );
}
