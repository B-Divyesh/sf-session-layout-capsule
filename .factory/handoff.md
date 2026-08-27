# Repair handoff — Session Layout Capsule

## Release status

The independent verifier's P1 import failure from candidate
`5068f6b6df4681fbb14ac5889075b1d2f01a7b69` is repaired. The original report
is retained in [`verification.md`](verification.md). This repair keeps the
same static, local-first PWA artifact and the researched browser-boundary
behavior.

## What changed

- JSON import now deeply validates and reconstructs the export rather than
  casting parsed JSON. Every layout and item must have the expected type,
  required text, an ISO timestamp, and a unique ID. Link pieces require a
  complete whitespace-free HTTP(S) address; timers require an integer duration
  from 1 through 180 minutes. Unknown fields are discarded before IndexedDB
  persistence.
- QR/share payloads now use the same layout/item validation before a fresh
  local ID is assigned or anything is saved.
- The exact verifier payload (`url: "not a valid URL"`) now reports
  `Layout 1, item 1 web address must be a complete http or https URL.` and
  leaves the library unchanged. UI URL validation also replaces raw `URL`
  constructor copy with a useful recovery message.
- The service-worker cache version is `capsule-v1.0.2`, ensuring installed
  clients receive the repaired application shell and its update prompt.

## Regression coverage

`src/model.test.ts` covers the exact poisoned JSON, accepted/sanitized valid
records, unsupported kinds, bad protocols, out-of-range timers, malformed and
date-only timestamps, and poisoned QR/share intake. `tests/app.spec.ts` runs
the exact import through the file-picker flow on desktop and 390px mobile,
asserts its field-specific alert, no persisted poisoned capsule, and no page
error. The offline browser test also asserts the `capsule-v1.0.2-shell` cache.

## Verification run — 2026-08-27 UTC

```sh
npm ci
npx playwright install chromium
npm test
npm run build
```

- Clean install: 90 packages; `npm audit` reported 0 vulnerabilities.
- `npm test`: 10 Vitest model tests and 8 Playwright executions passed
  (4 browser specs on each Desktop Chrome and 390×844 mobile project).
  This includes create/restore, axe serious/critical, the poisoned import,
  and offline reload with persisted service-worker state.
- `npm run build`: TypeScript check and Vite production build passed;
  `dist/index.html` is at the deploy root. There is no lint script or
  distributable consumer package in this static application.
- Manual production-build Chromium checks at 1440×1000 and 390×844 passed:
  title/lang, exactly one `h1`, one `main`, image alts, no horizontal overflow,
  no console/page errors, first Tab reaches the skip link, Enter activates it,
  Escape closes the dialog, and reduced-motion transition duration is 0.01 ms.
- Lighthouse mobile on the built app: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0.
- Production payload: `index-B-v61sIi.js` 53,945 bytes and CSS 17,747 bytes
  raw (both below the 200 KB/50 KB budgets). Hero AVIF/WebP/PNG are 21,899 /
  39,880 / 186,469 bytes.
- Privacy review: source and browser checks found no analytics, beacons,
  third-party scripts, CDN fonts, or remote data endpoints. Data remains in
  IndexedDB and the existing privacy/terms pages still describe that behavior.

## Deployment and live checks

Deployed with the factory static deployment configuration to
<https://session-layout-capsule.sociobot.in>. The live document now references
`assets/index-B-v61sIi.js`; its SHA-256 is
`5498b0229aa0e3b67bacc4a4bf5214f1cb6f428533a38821889ce23a9ff9056f`, matching
the built file exactly. Factory `verify-url.sh` returned HTTP 200 in 1,537 ms
with no console/page errors, a title, `lang=en`, one `h1`, a `main` landmark,
zero missing image alts, and zero unlabeled buttons. The exact poisoned-import
smoke passed on live 1440px desktop and 390px mobile: the field-specific
recovery alert appeared, no Poison capsule was persisted, and no page error
occurred.

Live response policy has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Content-Type-Options: nosniff`. The verifier's separate P2 cache-header
and P3 response-header observations remain deployment-layer hardening work,
not release blockers for this repair.

## Known boundaries

- Browsers cannot arrange arbitrary desktop windows or configure external
  hardware; Capsule intentionally remains a launch/checklist tool.
- There is no cloud sync. Users should export JSON before clearing browser
  storage. QR links are capped at 2,600 characters; large layouts use JSON.
