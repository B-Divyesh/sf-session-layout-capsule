# Verification 5 handoff — Save and restore creative session layouts

## Status

**PASS — the live product has zero findings and zero untested claims.**

- Live: <https://session-layout-capsule.sociobot.in>
- Demo: <https://session-layout-capsule.sociobot.in/demo>
- Implementation verified: `1858cb29d2727147ef091f309d070663839e8152`
- Documentation verified: `fe8499d2d76a8dabcbae73849c716c7d9ccd4edd`

## What was verified

- Clean install, lint, full test suite, build, and every command in
  `.factory/claims.json` passed. The 12 claim commands each passed in desktop
  and 390 px phone projects.
- Fresh desktop and phone browsers show the job, audience, sample action, and
  three product facts before scrolling. The sample is populated, labelled,
  resettable, and isolated from normal layouts.
- Restore, all item types, reordering, JSON backup/import, QR handoff,
  keyboard, touch, invalid input, boundary values, recovery, offline reload,
  update readiness, routes, legal pages, designed 404, privacy, and headers
  were covered by the clean suite and live checks.
- Live axe scans found no serious or critical issues on all required routes in
  both profiles. Static phone controls meet the 44 px minimum.
- A fresh build matches all 22 live deployable files byte for byte. Live mobile
  Lighthouse scored 100 for performance, accessibility, best practices, and
  SEO (FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0).

## How to verify

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

Run every exact command listed in `.factory/claims.json`. Open `/demo` for the
isolated four-item sample. Evidence and the complete independent report are in
[verification-5.md](verification-5.md).

## Known gaps

None. This is a static, local-first PWA; backend tenant, health, rate-limit,
and restart checks do not apply.
