# Review 3 handoff — Save and restore creative session layouts

## Status

**PASS — the live product has zero findings and zero untested claims.**

- Live: <https://session-layout-capsule.sociobot.in>
- Demo: <https://session-layout-capsule.sociobot.in/demo>
- Implementation reviewed: `1858cb29d2727147ef091f309d070663839e8152`
- Documentation reviewed: `0b125ced5e29f8ca81f3e831f24e7db252960975`

## What was verified

- A detached clean checkout passed `npm ci`, lint, the 23-unit/68-browser test
  suite, and the production build. Every exact command in `.factory/claims.json`
  passed on its first independent run; all 12 passed in desktop and 390 px
  phone projects.
- Fresh desktop and phone browsers show the job, audience, sample action, and
  three product facts before scrolling. The sample is populated, labelled,
  resettable, and isolated from normal layouts.
- Restore, all item types, reordering, JSON backup/import, QR handoff,
  keyboard, touch, invalid input, boundary values, recovery, offline reload,
  update readiness, routes, legal pages, designed 404, privacy, and headers
  were covered by the clean suite and live checks.
- Fresh live axe scans found no serious or critical issues on all required
  routes in both profiles. All scanned visible phone links and buttons meet the
  44 px minimum.
- A fresh build matches the 22 publicly served product files byte for byte.
  Fresh live mobile Lighthouse scored 100 for performance, accessibility,
  best practices, and SEO (FCP 1.0 s, LCP 1.3 s, TBT 0 ms, CLS 0).

## How to verify

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

Run every exact command listed in `.factory/claims.json`. Open `/demo` for the
isolated four-item sample. The complete strict review is in
[review-3.md](review-3.md).

## Known gaps

None. This is a static, local-first PWA; backend tenant, health, rate-limit,
and restart checks do not apply.
