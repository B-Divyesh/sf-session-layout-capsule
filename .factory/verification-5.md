# Verification 5 — Save and restore creative session layouts

## Verdict

**PASS — accept the live product.** There are zero findings at every severity
and zero untested public claims.

- Live URL: <https://session-layout-capsule.sociobot.in>
- Implementation candidate reviewed: `1858cb29d2727147ef091f309d070663839e8152`
- Documentation head reviewed: `fe8499d2d76a8dabcbae73849c716c7d9ccd4edd`
- Verified: 2026-09-06 UTC

`fe8499d` only records repair-four verification documentation. The fresh build
of the implementation candidate matches all 22 live deployable files byte for
byte, so it is the product image reviewed here.

## Job, audience, and first action

Before scrolling, fresh 1440 × 1000 desktop and 390 × 844 phone browsers show:

- Job: save links, MIDI cues, timers, and notes, then restore them in order.
- Audience: home producers and live visualists reopening a project's side tools.
- First action: **Try it with sample data**. The adjacent copy says it opens a
  filled rehearsal checklist and does not change saved layouts.

Both viewports show the three facts before scrolling: **Free to use**, **Stored
in this browser**, and **Works offline after your first visit**. The phone has
no horizontal overflow and no load-time console or page errors.

## Clean checkout and claims

The clean checkout at documentation head `fe8499d` was installed with `npm ci`
(170 packages; 0 audit vulnerabilities). Playwright Chromium was installed as
documented.

| Command | Result |
| --- | --- |
| `npm run lint` | PASS — zero warnings |
| `npm test` | PASS — 23 Vitest tests and 68 Playwright executions |
| `npm run build` | PASS — TypeScript and Vite emitted `dist/index.html` |
| Every exact command in `.factory/claims.json` | PASS — 12/12 commands; each passed desktop and 390 px phone projects |

The separately rerun `free-core` command passed both projects after the route
wait repair. The complete claim-command log has twelve `2 passed` results at
`/work/.evidence/verification-5/claims.log`.

| Claim id | Result |
| --- | --- |
| `local-data` | PASS |
| `layout-items` | PASS |
| `restore-progress` | PASS |
| `qr-handoff` | PASS |
| `json-backup` | PASS |
| `session-persistence` | PASS |
| `installable-pwa` | PASS |
| `offline-reload` | PASS |
| `recovery-states` | PASS |
| `keyboard-touch` | PASS |
| `demo-isolation` | PASS |
| `free-core` | PASS |

No unlisted public claim was found in the landing page, README, or legal copy.

## Live product checks

Fresh browser checks covered desktop and phone profiles. The one-click sample
opens **Rooftop visuals rehearsal** as a populated four-item rehearsal setup.
The persistent **Demo — sample data, nothing is saved** label remains present
while editing and restoring. Reset returns the original sample. The clean
browser suite verifies that a normal-data marker survives demo edit, reset,
and exit, while demo data never appears in normal storage.

The restore path exposes four completion checks and the two-minute timer;
completing all checks shows **Layout restored**. The sample covers a launch
link, Launchpad MIDI cue, two-minute projector timer, and placement note.
Normal creation, all four item types, reordering, reload/new-tab persistence,
JSON export/import, QR/link handoff, and print handling pass in the clean
suite.

Invalid and recovery paths also pass: empty data, malformed JSON, poisoned
import data, forced IndexedDB failure, and explicit `ftp:`, `mailto:`,
`file:`, and `javascript:` launch targets. Timer boundaries accept 1 and 180
minutes; 181 is blocked. Keyboard checks cover skip link, dialog focus,
Escape return, radio arrows, route-heading focus, and 390 px touch use.
Reduced motion is covered by the browser suite.

The demo became service-worker controlled in a fresh phone context. After the
first load, an offline reload retained the populated sample and showed the
offline status. Chromium installability checks pass. The designed unknown URL
page deliberately returns HTTP 404 and offers a way back; this is expected,
not a defect. Root, demo, privacy, terms, offline, and 404 route titles and
links work.

## Accessibility, privacy, headers, and performance

`/opt/fleet/lib/verify-url.sh` passed on the live root: HTTP 200, title,
`lang=en`, one `h1`, `main`, complete image alternatives, labelled buttons,
and no console errors. Fresh Playwright axe scans found zero serious or
critical violations on root, demo, privacy, terms, offline, and 404 in both
desktop and phone contexts. All visible static-page links and buttons measured
at least 44 × 44 CSS px on the phone.

Request capture for normal use contained only the product origin. The live
response has the local-only CSP, `frame-ancestors 'none'`, HSTS, `nosniff`,
strict-origin referrer policy, and restrictive Permissions-Policy. The
manifest is `application/manifest+json`; hash-named assets are immutable.
There are no accounts, payment, analytics, tracking, runtime CDN, third-party
font, remote store, or backend. Backend tenant, health, rate-limit, and
restart checks do not apply to this static local-first PWA.

Fresh live mobile Lighthouse 13.4.1 results:

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP was 0.9 s, LCP 1.1 s, TBT 0 ms, and CLS 0. The fresh build emits 60.61 KB
JavaScript (21.08 KB gzip) and 20.49 KB CSS (5.35 KB gzip). The largest product
image is 186,469 bytes.

## Earlier finding disposition

| Earlier finding or observation | Disposition |
| --- | --- |
| Missing isolated sample/demo storage | Resolved; `/demo`, sample, reset, start-real, and separate namespace pass. |
| Claim registry or outcome coverage missing | Resolved; 12 registered claims, 12 exact commands pass. |
| Routes, titles, route focus, or designed 404 missing | Resolved and exercised live. |
| First-screen plain-language structure incomplete | Resolved on desktop and phone. |
| Metadata and shared site structure incomplete | Resolved. |
| Footer/static-page targets below 44 px | Resolved; every checked phone target meets 44 × 44 px. |
| Raw malformed-JSON error | Resolved with recovery copy. |
| Manifest media type | Resolved as `application/manifest+json`. |
| Poisoned import crash | Resolved by validation before persistence. |
| Explicit non-HTTP(S) URL acceptance | Resolved for all four earlier protocols. |
| Missing immutable hash caching | Resolved live. |
| Missing CSP or Permissions-Policy | Resolved live. |
| `free-core` route-render race | Resolved; independent command passed in both profiles. |

## Evidence

- `/work/.evidence/verification-5/claims.log`
- `/work/.evidence/verification-5/verify.json`
- `/work/.evidence/verification-5/lighthouse-live.json`
- `/work/.evidence/verification-5/live-desktop-root.png`
- `/work/.evidence/verification-5/live-desktop-demo.png`
- `/work/.evidence/verification-5/live-mobile-root.png`

