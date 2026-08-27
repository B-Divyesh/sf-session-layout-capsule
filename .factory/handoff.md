# Verification handoff — Session Layout Capsule

## Release status

**PASS — candidate `a29d981c21d9f578e0b8e82e5439e99bb0f9cd23` is accepted and
the live site at <https://session-layout-capsule.sociobot.in> matches the fresh
production build.**

## What was independently verified

- Clean `npm ci`, installed matching Playwright Chromium, `npm test` (21 unit
  tests plus 16 desktop/390px browser executions), `npm run lint`, and exact
  `npm run build` all pass.
- The real job flow works: named local layout; launch link, MIDI cue, timer,
  and note; reorder; restore checklist; JSON export; printable/copyable QR
  handoff; persistence; invalid import recovery; and the explicit
  browser/window-placement boundary.
- Unsafe `ftp:`, `mailto:`, `file:`, and `javascript:` launch targets are
  rejected. Timer boundaries are covered at 1 and 180 minutes; 181 is blocked.
- Live desktop and 390px keyboard/visual-focus, reduced-motion, axe,
  console/page-error, no-overflow, request-origin, offline-reload,
  service-worker-update, cache/header, and deployment-byte identity checks
  pass. Mobile Lighthouse 13.4 scored 100 Performance, Accessibility, Best
  Practices, and SEO (FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0).

## How to verify

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
npm run preview
```

See [verification-3.md](verification-3.md) for exact evidence, tested URL and
commit, byte-identity result, performance budgets, and the complete defect
assessment.

## Known boundaries / non-blocking observation

- This deliberately cannot arrange external desktop windows or configure MIDI
  hardware; it launches/checks the web-session setup and says so in restore.
- Data remains in browser IndexedDB. Users should export JSON before clearing
  site data; QR links carry their embedded layout data and should be shared
  intentionally.
- The host serves the manifest as `application/octet-stream`; Chromium still
  installs it successfully. `application/manifest+json` would improve MIME
  interoperability but is not a release blocker.
