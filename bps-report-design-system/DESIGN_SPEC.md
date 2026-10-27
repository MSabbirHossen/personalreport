# Report BD — Design Specification

## Brand idea
**Better Data · Brighter Future** — a calm, reliable reporting platform with an identity that acknowledges Bangladesh and Saudi Arabia without copying official state emblems.

## Logo concept
A compact geometric shield represents trust and stewardship. Its green split forms reference the two national palettes; the red disc is an abstract Bangladesh-inspired accent; the white seam and nested geometry create a subtle Islamic geometric character. It is intentionally not a literal flag or official emblem.

## Palette
| Role | Light | Dark |
|---|---|---|
| Page | `#F7FAF8` | `#081B17` |
| Surface | `#FFFFFF` | `#102923` |
| Raised surface | `#FFFFFF` | `#16352D` |
| Text | `#102A25` | `#EEF8F3` |
| Muted text | `#536760` | `#C1D3CA` |
| Primary | `#006A4E` | `#10A879` |
| Red accent | `#E63946` | `#FF5966` |
| Border | `#D9E5DF` | `#2B4B41` |

Red should be used sparingly for destructive actions, urgent status, and selected brand accents. Never use color as the only status cue.

## Type
- Bangla: Noto Sans Bengali (400, 500, 600, 700)
- English/Latin: Inter (400, 500, 600, 700, 800)
- Arabic: Noto Sans Arabic (400, 500, 600, 700)
- Base body: 16px / 1.55
- Page title: `clamp(1.7rem, 4vw, 2.5rem)`, 700–800
- Section title: 1.1–1.35rem, 700
- Labels: .875–.95rem, 600–700
- Small metadata: .75–.85rem, 500

## Layout and components
- 8px spacing rhythm with compact 4px micro-spacing.
- Card radius 14px; large hero radius 22px; inputs 10px.
- Content width 1440px; 12-column responsive grid.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`) so Arabic layouts mirror naturally.
- Desktop: sidebar + content; tablet: collapsible navigation and two-column cards; mobile: stacked cards and full-width primary actions.
- Forms: visible labels, helper text, inline validation, and clear required markers.
- Loading: branded spinner for route transitions, skeletons for data surfaces, and progress only when measurable.

## Theme behavior
Use `data-theme="light|dark"` on `<html>`. The included provider persists the selected preference and follows OS preference when set to `system`.

## Localization behavior
Set `<html lang="bn|en|ar" dir="ltr|rtl">`. Arabic is RTL; Bangla and English are LTR. Use `dir="auto"` on user-generated mixed-script text when appropriate. Do not reverse numbers, dates, or phone numbers manually.

## Suggested acceptance checks
- Contrast-check actual rendered text in both themes before release.
- Keyboard-only navigation, visible focus, screen reader labels, and zoom to 200%.
- Test Bangla conjuncts and Arabic shaping on Windows, Android, and iOS.
- Test RTL tables, charts, icons, dates, and form validation.
- Test no-motion mode and slow-network loading.
