# Repair 4 handoff — Save and restore creative session layouts

## Release status

**PASS — both Review 2 findings are resolved. No known product gaps remain.**

- Live: <https://session-layout-capsule.sociobot.in>
- Demo: <https://session-layout-capsule.sociobot.in/demo>
- Implementation SHA: `1858cb29d2727147ef091f309d070663839e8152`
- Review source: [review-2.md](review-2.md)
- Deployed: 6 September 2026 UTC

The separately named `factory-evidence/session-layout-capsule-review-2/qa-report.md`
and `/work/.evidence/qa-report.md` were not present in this worker. The complete
committed Review 2 report and every earlier review and verification report were
read before the repair.

## What changed

- Restore claim helpers now wait for the restore URL and exactly four rendered
  checkboxes before completing them. Editor claim helpers also wait for the
  editor URL and heading, removing the same route-settling weakness.
- Every link in a static-page footer now has a 44 px minimum rendered height.
- Browser regressions measure every visible link and button at 390 px on
  privacy, terms, offline, and 404 pages. They assert rendered dimensions, not
  stylesheet text.
- The offline shell cache advanced to `capsule-v1.1.2`, so returning visitors
  receive the corrected static stylesheet.

## Clean verification

A fresh local clone of `1858cb2` was installed with `npm ci` (170 packages,
zero audit vulnerabilities).

| Check | Result |
| --- | --- |
| `npm test` | PASS — 23 unit/deployment tests and 68 browser executions |
| `npm run lint` | PASS — zero warnings |
| `npm run build` | PASS — `dist/index.html` produced |
| All 12 exact commands in `claims.json` | PASS in desktop and 390 px phone projects |
| `free-core` stability loop | PASS — 10 consecutive commands, 20 browser executions |

The build emits 60,606 bytes of JavaScript (21.08 kB gzip) and 20,490 bytes
of CSS (5.35 kB gzip). The largest responsive product image is 186,469 bytes.

## Live verification

- The deployment completed successfully. All 22 served build files match the
  implementation build byte for byte.
- Fresh 1440 × 1000 desktop and 390 × 844 phone profiles show the job,
  audience, sample action, its result, and the three product facts before any
  scroll.
- The one-click sample shows four realistic item types. Restore displays all
  four named items, reaches **4 of 4 ready**, and keeps **Demo — sample data,
  nothing is saved** visible.
- Reset restores **Rooftop visuals rehearsal**. A disposable real-data marker
  survived sample edit, reset, and exit; sample data did not enter real
  storage. The marker was deleted before closing the fresh profile.
- Every visible link and button on privacy, terms, offline, and 404 measured at
  least 44 × 44 CSS px in both checked viewports.
- Live axe scans found zero serious or critical issues on root, demo, privacy,
  terms, offline, and 404 in desktop and phone profiles.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, title, `lang=en`, one `h1`,
  `main`, complete image alternatives, labelled buttons, and no console errors.
- A fresh phone profile installed `capsule-v1.1.2-shell`, reported no Chromium
  installability errors, completed `registration.update()`, and reloaded the
  populated sample offline.
- Normal sample use made same-origin requests only. Response checks confirmed
  the local-only CSP, security headers, correct manifest media type, and
  immutable caching for content-hashed assets.
- An unknown route returned the designed page with deliberate HTTP 404.
- Reduced-motion controls computed a `0.00001s` transition.

Fresh live mobile Lighthouse 13.0.1:

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP was 0.9 s, LCP 1.2 s, TBT 0 ms, and CLS 0.

## Earlier finding disposition

| Finding | Current disposition |
| --- | --- |
| Isolated one-click sample and separate storage missing | Resolved and exercised live. |
| Claim registry and claim tests missing | Resolved; 12/12 exact commands pass. |
| Routes, titles, history, route focus, and designed 404 missing | Resolved; clean browser suite and live routes pass. |
| First-screen job, audience, next action, facts, and page order incomplete | Resolved in both live viewports. |
| Metadata and shared page structure incomplete | Resolved; live route checks pass. |
| Footer and legal touch targets below 44 px | Resolved; all static targets now measure at least 44 × 44 px. |
| Malformed JSON exposed parser text | Resolved; plain recovery copy passes. |
| Manifest media type incorrect | Resolved live as `application/manifest+json`. |
| Poisoned import could persist and crash | Resolved; deep validation and recovery tests pass. |
| Explicit non-HTTP(S) URL accepted | Resolved for `ftp:`, `mailto:`, `file:`, and `javascript:`. |
| Hashed assets lacked immutable caching | Resolved live. |
| CSP and Permissions-Policy absent | Resolved live. |
| `free-core` route-render race | Resolved with explicit URL/render waits and 20 browser executions. |
| Static attribution link was 15 px high | Resolved and measured at 44 px. |

This remains a free static local-first PWA. It has no backend, account,
payment, analytics, tracking, external AI call, shared database, CLI, library,
or native desktop artifact. Backend and paid-offer checks do not apply.

## Evidence

- Live screenshots, URL verification, and Lighthouse:
  `/work/.evidence/repair-4/`
- Catalog description: `/work/.evidence/catalog-description.txt`
