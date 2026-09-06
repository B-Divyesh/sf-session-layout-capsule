# Review 2 — Save and restore creative session layouts

## Verdict

**FAIL — 2 findings remain: 1 P1 and 1 P2. Zero public claims are
untested.**

The live product works for the main job, and all 22 deployed files match the
implementation candidate. It cannot pass this strict review because one exact
claim command failed from the clean checkout and one link on the static pages
still misses the required touch size.

- Live URL: <https://session-layout-capsule.sociobot.in>
- Implementation candidate: `776fc98665a4758103ffac2d02384193a1662747`
- Documentation HEAD reviewed: `1dbac63c5703d5f33115695c857fa560bae88563`
- Review date: 6 September 2026 UTC

The commits after `776fc98` change only `.factory` reports and evidence. A
fresh production build matched all 22 live files byte for byte. The remaining
23rd build file is `staticwebapp.config.json`, which is deployment
configuration and is not served as a public file.

## Job, audience, and first action before scrolling

- Job: save links, MIDI cues, timers, and notes, then restore them as one
  ordered checklist.
- Audience: home producers and live visualists reopening a project's side
  tools.
- First action: **Try it with sample data**. The next line says the sample
  opens a filled checklist without changing saved layouts.

Desktop at 1440 × 1000 and phone at 390 × 844 showed the job, audience,
sample action, result, and three facts before scrolling. The facts are **Free
to use**, **Stored in this browser**, and **Works offline after your first
visit**.

## Findings

### P1 — The `free-core` claim command can skip the restore checks and fail

From the clean checkout, the exact registered command failed on its first run:

```sh
npm run test:e2e -- --grep @claim:free-core
```

The phone execution passed. The desktop execution timed out waiting for the
**Layout restored** heading. Its retained trace showed this sequence:

1. The test clicked **Restore** on `/demo`.
2. It immediately queried the restore checkboxes and received a count of zero.
3. No checkbox action ran.
4. The route then finished rendering at **0 of 4 ready**.
5. The final heading assertion timed out after five seconds.

The race is in `completeSampleRestore`: after the client-side route click, it
calls `getByRole('checkbox').all()` without first waiting for the restore route
or its four checkboxes. The empty locator array makes the loop succeed without
checking anything.

An unchanged rerun passed in both projects, and additional 10-run and 40-run
desktop diagnostics passed. A separate live run also reached **4 of 4 ready**
without an account or payment. Those results show that the public behavior is
working, but they do not erase the failed required command. The claims contract
says any exact claim-command failure prevents acceptance.

Required correction: wait for the restore URL or assert four visible
checkboxes before iterating. Then run the exact command repeatedly from a
fresh checkout.

### P2 — The attribution link is only 15 px high on static phone pages

At 390 px, **Built by Param Factory** measured about `143 × 15` CSS pixels on
each of these live pages:

- `/privacy/`
- `/terms/`
- `/offline.html`
- `/404.html`

The required minimum is 44 × 44 CSS pixels. The earlier footer-link finding is
only partly resolved: `public/legal.css` gives the 44 px height to header links,
footer navigation links, and main links, but not to the attribution link inside
the footer paragraph. The same link in the app shell is 44 px high.

Required correction: give every static-page footer link a 44 px touch area,
then measure all visible links and buttons at 390 px.

## Public claims

All 12 registered claims have exactly one matching `@claim:<id>` test. No
unlisted public claim was found in the landing page, README, privacy page, or
terms page. Untested claim count: **0**.

| Claim | First exact command result |
| --- | --- |
| `local-data` | PASS — desktop and phone |
| `layout-items` | PASS — desktop and phone |
| `restore-progress` | PASS — desktop and phone |
| `qr-handoff` | PASS — desktop and phone |
| `json-backup` | PASS — desktop and phone |
| `session-persistence` | PASS — desktop and phone |
| `installable-pwa` | PASS — desktop and phone |
| `offline-reload` | PASS — desktop and phone |
| `recovery-states` | PASS — desktop and phone |
| `keyboard-touch` | PASS — desktop and phone |
| `demo-isolation` | PASS — desktop and phone |
| `free-core` | **FAIL — phone passed; desktop hit the route-render race** |

## Clean checkout quality gates

The clean checkout was made at documentation HEAD `1dbac63`. The documented
prerequisite was installed before browser tests.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 170 packages, 0 audit vulnerabilities |
| `npx playwright install chromium` | PASS |
| `npm test` | PASS — 23 unit/deployment tests and 60 browser executions |
| `npm run lint` | PASS — zero warnings |
| `npm run build` | PASS — `dist/index.html` produced |
| Every command in `.factory/claims.json` | **FAIL — 11 commands passed; `free-core` failed once** |

The aggregate suite passing does not override the later failure of an exact
declared command.

## Live product verification

### Sample and data isolation

The one-click sample opened **Rooftop visuals rehearsal** with one launch link,
one MIDI cue, one two-minute timer, and one placement note. The persistent
**Demo — sample data, nothing is saved** label, **Reset demo**, and **Start for
real** remained available.

A disposable real-data marker was created in a fresh browser profile. The
sample was renamed, reset, and exited. Reset restored the original sample, the
temporary sample name disappeared, and the real marker remained unchanged.
The marker was then deleted. No existing visitor data was read or changed.

A separate fresh profile completed all four restore checks and showed **4 of 4
ready** and **Layout restored**. The sample label remained visible. Request
capture during the flow contained only the product origin.

### Normal, invalid, boundary, and recovery paths

- The clean browser suite passed creation and restore for all four item types,
  reordering, reload and new-tab persistence, JSON export/import, QR/link
  handoff, and the empty state.
- Malformed JSON and a semantically poisoned import were rejected without a
  write or page error. Forced IndexedDB failure showed a recovery screen and
  **Try again**.
- `ftp:`, `mailto:`, `file:`, and `javascript:` launch links were rejected.
  A live phone check showed **Use an http or https link.**
- Live timer checks accepted 1 and 180 minutes. A value of 181 showed the
  browser message **Value must be less than or equal to 180.**

### Keyboard, focus, motion, and accessibility

- First Tab focused the visible skip link with a 3 px outline.
- Dialog focus moved to the name field, and the clean suite verified Escape
  returned focus to the opener.
- Route changes moved focus to the new `h1` and updated the polite live region.
- ArrowDown changed the item type radio selection. Touch actions worked at
  390 px without horizontal overflow.
- Reduced motion produced a `0.00001s` transition.
- The worker URL verifier passed: HTTP 200, title, `lang=en`, one `h1`, one
  `main`, all image alt attributes present, no unlabeled buttons, and no load
  errors.
- Fresh live axe scans found zero serious or critical issues on root, demo,
  privacy, terms, offline, and 404 pages in desktop and phone profiles. The
  touch-size defect is not detected by axe.

### Offline, installability, routes, and privacy

- A fresh `/demo` profile became service-worker controlled, then reloaded
  offline with its populated sample and offline status visible.
- Chromium reported zero installability errors. `registration.update()`
  completed against the live worker without an error.
- Root, demo, privacy, terms, offline, and 404 titles were correct. All found
  internal links returned HTTP 200.
- An unknown URL deliberately returned HTTP 404 with **This layout page does
  not exist** and a way back. Its browser 404 resource message is expected and
  is not a product defect.
- The live response has a local-only CSP, `frame-ancestors 'none'`, HSTS,
  `nosniff`, a strict-origin referrer policy, and a restrictive
  Permissions-Policy. Hashed assets are immutable. The manifest uses
  `application/manifest+json`.
- Source and request review found IndexedDB only for product data, no account,
  analytics, tracking, payment, third-party font/script, or remote data store.

### Performance

Fresh live mobile Lighthouse results:

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP was 0.9 s, LCP 1.2 s, TBT 0 ms, and CLS 0. The fresh build emitted 60,606
bytes of JavaScript (21.08 kB gzip) and 20,490 bytes of CSS (5.35 kB gzip).
The largest responsive product image is 186,469 bytes. These are within the
declared static PWA budgets.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Missing isolated sample and separate storage | Resolved; independently exercised live. |
| Missing claim registry and tests | Registry and 12 tests exist, but the `free-core` command is unreliable; new P1 finding. |
| Missing routes, titles, history, focus, and designed 404 | Resolved. |
| First-screen job, audience, action, facts, and page order | Resolved on desktop and phone. |
| Missing metadata and shared page structure | Resolved. |
| Footer/legal touch targets below 44 px | **Partly resolved; attribution link remains 15 px high on four static pages.** |
| Raw malformed-JSON error | Resolved. |
| Manifest MIME type | Resolved live. |
| Poisoned import crash | Resolved. |
| Explicit non-HTTP(S) URL acceptance | Resolved. |
| Hash asset cache policy | Resolved live. |
| Missing CSP and Permissions-Policy | Resolved live. |

This is a static local-first PWA. Backend tenant isolation, restart
persistence, health, 429/Retry-After, CLI/library consumer installation, and
native desktop checks do not apply. AI does not add an obvious missing step to
this local restore checklist; JSON and QR already cover the brief's handoff
need.

## Evidence

- Fresh browser evidence: `/work/.evidence/review-2/`
- Live browser summary: `/work/.evidence/review-2/live-review.json`
- Fresh Lighthouse JSON: `/work/.evidence/review-2/lighthouse.json`
- Worker URL verification: `/work/.evidence/review-2/verify.json`
- Candidate/live comparison: 22 files checked, 22 byte matches
