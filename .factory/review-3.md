# Review 3 — Save and restore creative session layouts

## Verdict

**PASS — accept the live product.** There are zero findings at every severity
and zero untested public claims.

- Live URL: <https://session-layout-capsule.sociobot.in>
- Implementation candidate reviewed: `1858cb29d2727147ef091f309d070663839e8152`
- Documentation head reviewed: `0b125ced5e29f8ca81f3e831f24e7db252960975`
- Reviewed: 2026-09-06 UTC

The commits after `1858cb2` change only `.factory` verification and handoff
documents. A fresh build of the implementation candidate matched every one of
the 22 publicly served build files byte-for-byte. `staticwebapp.config.json`
is deployment configuration and deliberately returns 404 as a public URL.

## Job, audience, and first action

Before scrolling, fresh 1440 × 1000 desktop and 390 × 844 touch browser
profiles show:

- Job: save links, MIDI cues, timers, and notes, then restore them in order.
- Audience: home producers and live visualists reopening a project's side
  tools.
- First action: **Try it with sample data**. The adjacent copy says it opens a
  filled rehearsal checklist without changing saved layouts.

Both profiles show **Free to use**, **Stored in this browser**, and **Works
offline after your first visit** on the first screen. Neither profile had
horizontal overflow, console errors, or page errors.

## Clean checkout and claims

A detached clean clone at documentation head `0b125ce` was installed with
`npm ci` (170 packages; 0 audit vulnerabilities). Playwright Chromium 1.58.2
was installed as documented.

| Command | Result |
| --- | --- |
| `npm run lint` | PASS — zero warnings |
| `npm test` | PASS — 23 Vitest tests and 68 Playwright executions |
| `npm run build` | PASS — emitted `dist/index.html` |
| Every exact command in `.factory/claims.json` | PASS — 12/12 commands; each passed desktop and 390 px phone projects |

Each claim has exactly one matching `@claim:<id>` outcome test. The complete
first-run command log is at `/work/.evidence/review-3/claims.log`.

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

The landing, README, privacy, and terms copy has no unlisted product claim.

## Live product checks

The one-click sample opens **Rooftop visuals rehearsal**, a populated setup
with one web link, Launchpad MIDI cue, two-minute projector timer, and window
placement note. **Demo — sample data, nothing is saved**, **Reset demo**, and
**Start for real** remain present in both the library and restore flow. Reset
restored the original sample.

In a disposable live browser profile, a temporary normal layout stayed intact
after entering and resetting the demo; after **Start for real**, the normal
layout was present and the sample was absent. The temporary layout was deleted
before that profile was closed. No existing visitor data was accessed.

The live restore route has four completion controls and the visible
**Target: under 02:00** target. The clean browser suite also passed normal
creation, all item types, reordering, reload/new-tab persistence, JSON backup
and import, QR/link handoff and print, malformed and poisoned imports, blocked
storage, rejected `ftp:`, `mailto:`, `file:`, and `javascript:` links, 1/180
minute boundaries, keyboard and touch controls, dialog focus, route focus, and
reduced motion.

A fresh phone demo context became service-worker controlled. After the first
visit it reloaded offline with the populated sample and the offline status.
Chromium reported no installability errors. A live service-worker update check
completed with an active worker and no errors. Root, demo, privacy, terms,
offline, and the designed 404 pages have the correct route titles; an unknown
URL deliberately returns HTTP 404 and provides a way back.

## Accessibility, privacy, headers, and performance

`verify-url.sh` passed on the live root: HTTP 200, title, `lang=en`, one `h1`,
one `main`, complete image alternatives, labelled buttons, and no page or
console errors. Fresh axe scans found zero serious or critical violations on
root, demo, privacy, terms, offline, and 404 pages in desktop and phone
profiles. Every visible link and button on those phone pages measured at least
44 × 44 CSS px.

Normal demo use captured requests only to the product origin. The live
responses have a local-only CSP with `frame-ancestors 'none'`, HSTS, `nosniff`,
strict-origin referrer policy, and a restrictive Permissions-Policy. The
manifest is `application/manifest+json`; hash-named assets are immutable.
There are no accounts, payment, analytics, tracking, runtime CDN, third-party
font, remote store, or backend. Backend tenant, health, restart, and rate-limit
checks do not apply to this static local-first PWA.

The fresh build contains 60.61 KB JavaScript (21.08 KB gzip) and 20.49 KB CSS
(5.35 KB gzip). The largest product image is 186,469 bytes, within the stated
budgets. Fresh live mobile Lighthouse 13.4.1 scored 100 for Performance,
Accessibility, Best Practices, and SEO (FCP 1.0 s, LCP 1.3 s, TBT 0 ms,
CLS 0).

## Earlier finding disposition

| Earlier finding or observation | Current disposition |
| --- | --- |
| Malformed or poisoned imports could crash editing | Resolved; import validation and recovery tests pass. |
| Explicit non-HTTP(S) launch targets were accepted | Resolved; all four earlier protocols are rejected. |
| Hash assets lacked immutable caching | Resolved live. |
| CSP or Permissions-Policy was absent | Resolved live. |
| Manifest MIME type was wrong | Resolved as `application/manifest+json`. |
| Isolated demo storage was absent | Resolved; `/demo`, sample, reset/start-real, and distinct `demo:` IndexedDB storage pass. |
| Claim registry or outcome coverage was absent | Resolved; 12 registered claims and 12 first-run command passes. |
| Routes, titles, focus, history, or designed 404 were incomplete | Resolved and exercised live. |
| First-screen plain-language structure or shared page structure was incomplete | Resolved on desktop and phone. |
| Static footer targets were below 44 px | Resolved; all scanned visible phone controls meet the minimum. |
| Malformed JSON showed raw parser text | Resolved with a plain recovery instruction. |
| `free-core` claim had a route-render race | Resolved; its independent desktop and phone command passed. |

## Evidence

- `/work/.evidence/review-3/claims.log`
- `/work/.evidence/review-3/verify-url/verify.json`
- `/work/.evidence/review-3/routes.json`
- `/work/.evidence/review-3/axe-touch.json`
- `/work/.evidence/review-3/offline-installability.json`
- `/work/.evidence/review-3/update-check.json`
- `/work/.evidence/review-3/lighthouse-live`
- `/work/.evidence/review-3/live-byte-identity.json` plus the verified public
  source-map response
