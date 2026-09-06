# Repair 3 handoff — Session Layout Capsule

## Release status

**PASS — all eight Review 1 findings are resolved and all public claims are tested.**

- Live URL: <https://session-layout-capsule.sociobot.in>
- Demo URL: <https://session-layout-capsule.sociobot.in/demo>
- Implementation SHA: `776fc98665a4758103ffac2d02384193a1662747`
- Final deployment: `886ca03c-6f0c-4b92-95b9-64f4dcc5faf6`
- Documentation/evidence SHA: recorded in the report-only commit after this handoff
- Review date: 2026-09-06 UTC

The implementation was pushed and deployed. All 22 public files in the final
build match the live HTTPS bytes. Later documentation-only commits do not
require a new product image.

## Product outcome

The first screen now states the job, audience, and first action without
scrolling. A home producer or live visualist can save links, MIDI cues, timers,
and notes, then restore them as a checklist. The app does not claim to position
desktop windows or control hardware.

The one-click demo opens a populated **Rooftop visuals rehearsal** layout. It
contains a visual link, a Launchpad MIDI cue, a two-minute projector timer, and
a placement note. The persistent banner says **Demo — sample data, nothing is
saved** and provides **Reset demo** and **Start for real**. Demo data uses the
IndexedDB namespace `demo:session-layout-capsule`; normal data uses
`session-layout-capsule`. Resetting or leaving the demo clears only demo data.

## Review 1 disposition

1. **Demo and isolation:** resolved with `/demo`, realistic seeded data,
   separate storage, persistent status/actions, and `.factory/demo.md`.
2. **Missing claim contract:** resolved with `.factory/claims.json` and exactly
   one outcome-based `@claim` test for each of 12 public claims.
3. **Routes and 404:** resolved with deep-linked edit/restore routes, History
   API navigation, route titles, focus and live announcements, plus a designed
   HTTP 404 response.
4. **First screen and copy:** resolved with plain job/audience/action copy,
   three facts, the live product, three steps, the browser boundary, and
   `.factory/copy-audit.md`.
5. **Metadata and shared structure:** resolved on app, legal, offline, and 404
   pages with canonical/social metadata, product artwork, navigation, footer,
   build id, contact link, and a complete sitemap.
6. **Touch targets:** resolved for footer and legal-page links at 44 px or more.
7. **Malformed JSON:** resolved with a plain recovery message and no write.
8. **Manifest MIME:** resolved; live response is
   `application/manifest+json`.

Earlier semantic-import, unsafe-URL, cache, CSP, and Permissions-Policy fixes
remain in place. Regression checks cover poisoned JSON and explicit `ftp:`,
`mailto:`, `file:`, and `javascript:` input.

## Claims and quality gates

From a clean checkout of implementation SHA `776fc98`:

| Check | Result |
| --- | --- |
| Every command in `.factory/claims.json` | PASS — 12/12 claims; 24 desktop/phone browser executions |
| `npm test` | PASS — 23 Vitest tests and 60 Playwright executions |
| `npm run lint` | PASS — zero warnings |
| `npm run build` | PASS — `dist/index.html` produced |
| Playwright axe scans | PASS — no serious/critical issues on app, demo, legal, offline, or 404 pages |
| `verify-url.sh` | PASS — 638 ms load, no console errors, one h1/main/lang/alt/button checks pass |

The browser suite covers normal, invalid, boundary, and recovery paths;
keyboard and phone use; dialog focus; reduced motion; storage persistence;
demo isolation; privacy requests; offline reload; PWA installability; route
history and titles; legal pages; and the designed 404.

Build budgets: JavaScript is 60,606 bytes raw / 21.08 kB gzip; CSS is 20,490
bytes raw / 5.35 kB gzip. The largest responsive hero image is 186,469 bytes.

Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0.

## Live verification

- Fresh desktop and 390 px phone contexts showed the job, audience, sample
  action, and facts before scrolling with no horizontal overflow.
- The live demo displayed all four sample types, reordered them, completed the
  restore checklist to **4 of 4 ready**, and retained its demo label.
- A real-data marker survived demo entry, edits, reset, and exit; sample data
  never appeared in the real namespace.
- The complete demo flow sent requests only to the product origin.
- Root, demo, edit, restore, privacy, terms, offline, and 404 route titles were
  checked. An unknown path returned HTTP 404 with the designed page.
- A warmed `/demo` reloaded offline with its populated sample. The activated
  service worker used `capsule-v1.1.1-shell`.
- Live response headers include CSP, Permissions-Policy, HSTS, `nosniff`, and
  strict-origin referrer policy. Hashed assets are immutable.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm run preview
```

Run an individual declared claim using its exact command in
`.factory/claims.json`. The catalog description is in
`.factory/catalog-description.txt` and is copied to the worker evidence path.

## Scope and remaining limits

There is no backend, shared database, account, payment, analytics, AI call, or
third-party runtime script. Backend tenant, restart, health, 429, paid
entitlement, CLI, library, and native-app checks do not apply. The researched
brief says the product is free, so no billing offer metadata is required.

The only intentional limit is the browser boundary: external links still need
the user to place their application windows and connect their own hardware.
This is stated in the product. No unresolved repair finding remains.

The requested `/work/.evidence/qa-result.json` was not present in this worker.
The repository's complete verification and review history was inspected, and
the new evidence is stored under `.factory/evidence/`.
