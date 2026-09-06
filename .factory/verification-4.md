# Verification 4 — Save and restore creative session layouts

## Verdict

**PASS — accept the live product.** Zero findings were found and zero public
claims are untested.

- Job: save links, MIDI cues, timers, and notes, then restore them as one
  ordered checklist.
- Audience: home producers and live visualists reopening a project's side
  tools.
- First action before scrolling: **Try it with sample data**. It says that it
  opens a filled rehearsal checklist without changing the visitor's layouts.
- Live URL: <https://session-layout-capsule.sociobot.in>
- Implementation candidate reviewed: `776fc98665a4758103ffac2d02384193a1662747`
- Documentation/evidence HEAD: `93f9b22921a64ca702f47061178ee593e434e775`
- Verified: 2026-09-06 UTC

`93f9b22` changes only factory evidence and the handoff after the candidate.
It does not change product code. A fresh build of the candidate matched the
22 live deployable files byte for byte; `staticwebapp.config.json` is the one
build file not served as a public artifact.

## Clean checkout

A new local clone at `93f9b22` was installed with `npm ci` (170 packages,
zero audit vulnerabilities). It was clean before installation.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 23 Vitest tests and 60 Playwright executions passed. |
| `npm run lint` | PASS — zero warnings. |
| `npm run build` | PASS — TypeScript and Vite built `dist/index.html`. |

The production build was 60,606 bytes of JavaScript (21.08 kB gzip) and
20,490 bytes of CSS (5.35 kB gzip), within the static-product budgets.

## Public claims

Every exact command in `.factory/claims.json` was run from the clean checkout.
Each passed in the desktop and 390 px phone projects. Claim result: **12/12
passed, 0 untested**.

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

## Live browser verification

Fresh desktop (1440 × 1000) and phone (390 × 844 touch) profiles loaded the
live root without console or page errors, cross-origin requests, or horizontal
overflow. The title, one `h1`, `main`, language, and visible first action were
present in both profiles.

The one-click sample opened **Rooftop visuals rehearsal** with a launch link,
Launchpad MIDI cue, two-minute projector timer, and placement note. The
persistent **Demo — sample data, nothing is saved** label, **Reset demo**, and
**Start for real** controls remained visible. Reordering persisted after a
reload; the restore timer and all four completion checks produced **Layout
restored**. Reset restored the original sample. In a separate fresh profile, a
normal-data marker survived demo edit, reset, and exit, while sample data did
not appear in normal storage.

The warmed live `/demo` was controlled by its service worker and reloaded with
the populated sample after `context.setOffline(true)`. An unknown live URL
returned HTTP 404 and its designed **This layout page does not exist** page.
Privacy, terms, offline, and 404 titles were correct. All discovered internal
links returned HTTP 200; the intentional unknown URL returned HTTP 404.

Normal, invalid, boundary, and recovery paths are covered by the passing clean
browser suite: all four item types, reordering, JSON backup/import, QR
handoff, reload/tab persistence, malformed JSON, poisoned imported URLs,
explicit `ftp:`, `mailto:`, `file:`, and `javascript:` rejection, empty data,
storage failure, 1/180-minute timer boundaries, keyboard, touch, dialog focus,
reduced motion, offline reload, PWA installability, route history, and demo
isolation. A live phone check also showed the invalid-link message **Use an
http or https link.**, `Edit layout — Session Layout Capsule`, focus on the
new heading, a `0.00001s` reduced-motion transition, and Escape returning
focus to its opener.

## Accessibility, privacy, and policies

`/opt/fleet/lib/verify-url.sh` passed against the live root: HTTP 200, title,
`lang=en`, one `h1`, `main`, zero images missing `alt`, zero unlabeled
buttons, 597 ms load, and no console errors. The repository's Playwright axe
integration passed serious/critical scans for root, demo, privacy, terms,
offline, and 404 in both desktop and phone projects.

`npx @axe-core/cli` was also attempted. Its Selenium launcher cannot start a
system Chrome binary in this worker, including when pointed at Playwright's
Chromium. This did not leave an accessibility check unrun: the equivalent
Playwright axe integration is installed, executed in the clean `npm test`, and
passed on the same routes and viewports.

The live response uses local-only CSP, `frame-ancestors 'none'`, HSTS,
`nosniff`, strict-origin referrer policy, and a restrictive Permissions-Policy.
Hash-named JavaScript has `max-age=31536000, immutable`. The manifest response
is now `application/manifest+json`. Request capture during the sample flow saw
only the product origin. There are no accounts, analytics, tracking, payment,
backend, or third-party runtime resources.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing isolated sample demo | Resolved: `/demo`, realistic four-item sample, persistent label, reset/start-real controls, separate `demo:` IndexedDB namespace. |
| Missing claim registry and tests | Resolved: 12 registered claims, each with one outcome test; all commands passed. |
| Missing routes, titles, history, route focus, and 404 | Resolved: deep URLs, History API behavior, focus/live announcement coverage, route titles, and designed HTTP 404. |
| First-screen and plain-copy defects | Resolved: job, audience, action, result, three facts, three-step explanation, and browser boundary are visible. |
| Missing metadata and shared shell | Resolved: canonical/social metadata, Apple icon, consistent header/footer, legal links, sitemap, build id, and contact link. |
| Footer/legal touch targets below 44 px | Resolved and covered by the phone workflow. |
| Raw malformed-JSON parser message | Resolved: plain recovery message tells the visitor to choose a valid export. |
| Manifest MIME type | Resolved live: `application/manifest+json`. |
| Poisoned import crash | Resolved: deep import validation rejects it without a write or page error. |
| Explicit non-HTTP(S) URL accepted | Resolved: `ftp:`, `mailto:`, `file:`, and `javascript:` are rejected. |
| Hash asset cache policy | Resolved: immutable cache policy is live for hash-named assets. |
| CSP and Permissions-Policy absent | Resolved in live response headers. |

The product is a static local-first PWA. Backend tenant isolation, restart
persistence, health endpoint, 429/Retry-After, CLI/library consumer install,
and desktop-artifact checks do not apply.

## Evidence

- Clean full-suite output: `/work/.evidence/verification-4/npm-test-verify4.log`
- Live URL checker output and screenshots: `/work/.evidence/verification-4/`
- Candidate/live file comparison: 22 checked, 0 mismatches.

