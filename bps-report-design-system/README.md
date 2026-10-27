# Report BD Design System

Heritage-inspired UI system drawing on Bangladesh and Saudi Arabia flag colors and restrained Islamic geometric motifs.

## Contents
- `src/styles/tokens.css` — semantic design tokens and light/dark themes
- `src/styles/global.css` — resets, typography, RTL helpers, accessibility and patterns
- `src/components/ReportBDLogo.tsx` — inline SVG logo mark and wordmark
- `src/components/ReportBDLoader.tsx` — animated branded loading screen
- `src/components/ThemeProvider.tsx` — theme context, persistence, system preference
- `src/components/LanguageProvider.tsx` — locale + document direction helper
- `src/components/ReportBDExample.tsx` — sample responsive dashboard composition

## Install / integrate
1. Copy `src/` into your React + TypeScript app.
2. Import `./styles/tokens.css` and `./styles/global.css` once in your app entry point.
3. Wrap the app with `<ThemeProvider>` and `<LanguageProvider>`.
4. Use `<ReportBDLogo />`, `<ReportBDLoader />`, and the CSS classes as examples.
5. If your app already has a theme or locale system, merge the tokens and reuse its state instead of adding a second provider.

No UI framework is required. The CSS works with ordinary React components and can be adapted to Tailwind.

## Fonts
The stylesheet imports:
- **Noto Sans Bengali** for Bangla
- **Inter** for Latin/English
- **Noto Sans Arabic** for Arabic

For a production deployment with strict CSP or offline requirements, self-host these fonts instead of using Google Fonts. `font-family` is selected per script with `lang` and `dir` attributes.

## Accessibility
- Semantic theme tokens keep contrast consistent across themes.
- Keyboard-visible focus rings are included.
- `prefers-reduced-motion` disables nonessential motion.
- Loading status uses `role="status"` and `aria-live`.
- Never communicate status with color alone.

## Brand rules
- Use deep green for primary actions, red only for meaningful emphasis or destructive actions.
- Keep decorative geometric patterns low contrast and away from dense text.
- Do not recreate either national flag literally inside the logo; the emblem uses abstract geometry, a red circle, and green/white split forms.
