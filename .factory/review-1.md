# Review 1 — Save and restore creative session layouts

## Verdict

**FAIL — 8 findings remain, including 2 P1 findings. There are 10 untested
public claims.**

This is a strict review of the live product at
<https://session-layout-capsule.sociobot.in> on 2026-09-06 UTC. A successful
build and working main workflow do not make this a product PASS.

- Implementation reviewed: `2acc60473d3f3932224a49ed25f98d27f53116db`
- Documentation HEAD reviewed: `83b6050a2a1572f49fdafecf7eb5097f0bb154db`
- Live result: all 19 public files match a fresh production build byte for
  byte. The two later commits are documentation-only.

## Job, audience, and first action before scrolling

- Job: save the links, MIDI cues, timers, and notes around a creative project,
  then use them as a restore checklist.
- Audience: home producers and live visualists reopening a project.
- First action shown: **Make a capsule**. The required **Try it with sample
  data** action is not present.

The main job is understandable. The audience is not named on the first screen,
and the first action starts real local data instead of an isolated sample.

## Findings

### P1 — The required sample demo and isolated storage do not exist

The root page has no **Try it with sample data** action. `/demo` returns the
same empty real-data app with the landing title. It has no realistic sample,
no persistent **Demo — sample data, nothing is saved** label, no **Reset demo**,
and no **Start for real** action. `.factory/demo.md` is also absent.

In a fresh context, a capsule created at `/demo` appeared at `/` and the only
database was `session-layout-capsule`. This proves that `/demo` uses the real
storage namespace. The review context was then closed, so no visitor data was
read or retained.

Expected: one click opens a populated rehearsal layout in a separate demo
namespace, with the required persistent controls and documented reset path.

### P1 — Ten public claims have no claim registry or claim tests

`.factory/claims.json` is absent and `rg '@claim:'` finds no tests. Therefore
there are no declared claim commands to run. The following ten distinct public
claims in the landing page, README, and legal copy lack the required one-test
mapping and clean-demo sandbox:

1. Data stays on the device with no cloud or outbound product requests.
2. Named local layouts save and reorder links, MIDI cues, timers, and notes.
3. The restore checklist tracks progress toward a two-minute target.
4. A printable QR/link handoff carries a layout without a cloud service.
5. Versioned JSON export and import provide a backup path.
6. IndexedDB data persists across reloads and browser sessions.
7. The product is an installable PWA.
8. The product works offline after the first visit.
9. Empty, invalid-input, and storage-error recovery states work.
10. Keyboard and touch use work at a 390 px viewport.

Manual review confirmed many of these behaviors, but that does not replace the
required `@claim:<id>` tests. Claim count for this verdict: **10 untested**.

### P2 — URLs, browser history, route titles, and the 404 path are incomplete

An unknown URL such as `/definitely-missing-review-1` returns HTTP 200 and the
normal home screen. There is no designed 404 response or route. Editor and
restore views remain at `/`, do not update `document.title`, and cannot be
opened by a deep link. Browser back does not represent those view changes.

After creating a layout, focus was on `BODY`; the new `<h1>` was not focused,
and the polite live region remained empty. This misses the route-change focus
and announcement requirement. `/demo` also keeps the landing title instead of
`Demo — Session Layout Capsule`.

### P2 — The landing page does not meet the required first screen or page order

The first screen does not name home producers or live visualists, explain what
happens next to the primary action, or show three short privacy/offline/price
facts. It has no sample action. The landing page also omits the required
three-step **How it works** section and a clear browser-boundary/privacy section
after the product preview.

The copy repeatedly uses stage, shelf, orbit, quiet, and rehearsal-set language
instead of plain task words. The document title, “reset your creative stage,”
does not name the job in plain words. The direct offline page uses “The stage
door is closed.” `.factory/copy-audit.md` is absent, so the required sentence
and terminology audit was not performed.

### P2 — Required metadata and the shared site skeleton are incomplete

The root, privacy, and terms pages have no canonical URL, Open Graph image,
Twitter card, or Apple touch icon declaration. The root header has no Demo or
Privacy navigation and uses a button, not a home link, for the wordmark. The
footer omits **Built by Param Factory** and a version/build id. The legal pages
do not use the same header/navigation/footer and do not link to each other.
`sitemap.xml` lists only root, privacy, and terms, with no demo or 404 page.

The privacy page says questions can be raised through a repository linked from
the product documentation, but the live page provides no such link.

### P2 — Some mobile links are below the 44 px touch-target minimum

At 390 px, the root footer's Privacy link measured 41×19 CSS px and Terms
measured 34×19 CSS px. They have no padding that provides a 44×44 hit area.
The rest of the sampled primary controls met the minimum. Axe and Lighthouse
do not detect this geometry failure.

### P3 — Malformed JSON shows a parser error without a recovery instruction

Importing `{` shows Chromium's raw message:
`Expected property name or '}' in JSON at position 1 (line 1 column 2)`.
It does not say that the file is invalid or tell the user to choose a valid
Session Layout Capsule JSON export. The app remains usable, but the message
does not meet the plain error-copy contract.

### P3 — The manifest still has the wrong MIME type

`/manifest.webmanifest` returns `application/octet-stream`, not
`application/manifest+json`. Chromium 151 reports zero installability errors,
so this is an interoperability defect rather than a broken install path. This
was the only open observation in the previous verification and remains open.

## Working paths and evidence

The following checks passed and are not findings:

- Fresh phone and desktop contexts: one `<h1>`, one `<main>`, `lang="en"`, no
  missing image alt, no horizontal overflow, and no console or page errors.
- Realistic live workflow: created a four-piece rehearsal layout with a web
  link, MIDI cue, 180-minute timer, and note; reloaded it; exported one-layout
  JSON; generated a 640×640 QR; copied its handoff link; completed all restore
  steps; and deleted the layout.
- Isolation of the review: all live state was created in disposable browser
  profiles. No existing data was read. The normal-flow layout was deleted, and
  all contexts were closed.
- Invalid and recovery paths: `http://` produced “Enter a complete http or
  https web address.” and added nothing; 181 minutes was blocked by the native
  maximum; poisoned imports and unsafe schemes pass the repository regression
  tests; a forced IndexedDB-open failure showed a usable error page and **Try
  again**.
- Keyboard and focus: first Tab reached the visible skip link with a 3 px
  outline; the create dialog focused its name input after opening; Escape
  returned focus to the opener; native radio arrow behavior worked in the
  existing browser suite. The view-change focus failure is reported above.
- Reduced motion: the media query matched and animation/transition durations
  computed to `0.01ms`.
- Accessibility: axe scans of root desktop, root phone, demo, unknown route,
  privacy, and terms found zero violations. The worker `verify-url.sh` passed.
- Privacy: the complete live workflow made no cross-origin requests. Source
  review found IndexedDB only, no analytics, third-party script/font, beacon,
  or remote data store. Delete instructions are present on `/privacy/`.
- Offline: a fresh first visit followed directly by an offline reload worked.
  The worker installed and used `capsule-v1.0.3-shell`; a warmed reload also
  used the runtime cache and showed the offline status. `registration.update()`
  completed with an activated worker and no waiting worker. The prior synthetic
  update-toast proof still applies because product code and live bytes are
  unchanged.
- Installability: Chrome DevTools returned zero installability errors.
- Links: every actual live internal link resolved successfully. The missing
  required links and routes are findings above.
- AI leverage: no AI feature is warranted for this local checklist. JSON and
  QR handoff already address the brief's useful portability need.
- Backend, tenant, health, restart, 429, CLI, library, and desktop-install tests
  do not apply to this static PWA.

## Clean checkout commands

Run from a detached clean checkout of documentation commit `83b6050` after
installing the documented Chromium prerequisite:

| Command | Result |
| --- | --- |
| `npm install` | PASS — 170 packages audited, 0 vulnerabilities |
| `npx playwright install chromium` | PASS — Chromium 151 for Playwright 1.62.1 installed |
| `npm test` | PASS — 21 Vitest tests and 16 Playwright runs |
| `npm run lint` | PASS — zero warnings |
| `npm run build` | PASS — `dist/index.html` produced |

There were no claim commands to run because the required claims file is
missing; that absence is the P1 finding above.

## Performance and deployment

- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0.
- Fresh build: JavaScript 54,146 bytes raw / 19,394 bytes gzip; CSS 17,747
  bytes raw / 4,810 bytes gzip. Hero AVIF/WebP/PNG are 21,899 / 39,880 /
  186,469 bytes.
- Live hashed JS and CSS use `public, max-age=31536000, immutable`; documents
  and `sw.js` use 30-second revalidation. CSP, Permissions-Policy, HSTS,
  `nosniff`, and strict-origin referrer policy are present.
- All 19 served build files match the live bytes. This proves the reviewed live
  implementation is `2acc604`; later commits only changed reports and docs.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Semantic invalid import could persist and crash Edit | Fixed; deep validation unit/browser tests pass and live matches the build. |
| Explicit `ftp:`, `mailto:`, `file:`, and `javascript:` input was accepted | Fixed; all four unit and desktop/phone browser regressions pass. |
| Raw invalid-URL constructor message | Fixed; live now shows a plain HTTP/HTTPS instruction. |
| Hashed assets lacked immutable caching | Fixed in live response headers. |
| CSP and Permissions-Policy were absent | Fixed in live response headers. |
| Manifest served as `application/octet-stream` | Still open; finding P3 above. |

## Retest gate

Implement the isolated sample demo and formal claim tests first. Then complete
the route/404, first-screen, metadata, shared-shell, touch-target, error-copy,
and manifest fixes. Re-run every claim command from `/demo` in fresh contexts,
the clean quality gates, full phone/desktop flow, offline/update checks,
accessibility scans, and live byte comparison. PASS requires zero findings and
zero untested claims.
