# Independent verification — FAIL

**Candidate:** `5068f6b6df4681fbb14ac5889075b1d2f01a7b69` (`main`)

**Production URL:** <https://session-layout-capsule.sociobot.in>

**Verified:** 2026-08-27 UTC, from a clean checkout. This is an independent
verifier report; the prior build handoff was not treated as evidence.

## Release verdict

**FAIL — do not accept this candidate.** A malformed-but-envelope-valid JSON
import is accepted and persisted. Choosing **Edit** on that imported layout
causes an uncaught `Failed to construct 'URL': Invalid URL` page error rather
than rejecting the import or showing a recovery path. Import/export is a core
local-first ownership feature and the acceptance contract requires invalid
input and error recovery.

The production deployment is live and byte-identical to the candidate build,
so this is not a deployment-only failure.

## Blocking defect

### P1 — imported item fields are not validated before persistence

**Reproduction (local production build and live-identical JavaScript):**

1. Open the library and choose **Import JSON**.
2. Import this valid JSON envelope (timestamps may be any ISO strings):

   ```json
   {"format":"session-layout-capsule","version":1,"exportedAt":"2026-08-27T00:00:00.000Z","layouts":[{"id":"invalid-layout","name":"Poison capsule","description":"","createdAt":"2026-08-27T00:00:00.000Z","updatedAt":"2026-08-27T00:00:00.000Z","items":[{"id":"bad-link","kind":"link","title":"Broken link","url":"not a valid URL","detail":"","createdAt":"2026-08-27T00:00:00.000Z"}]}]}
   ```

3. The app reports successful import and displays **Poison capsule**.
4. Select its **Edit** button.

**Observed:** the browser emits an uncaught page error,
`Failed to construct 'URL': Invalid URL`, from rendering the imported item. The
app remains on the library, without a useful explanation or edit/recovery
route. The user can only delete the capsule from the library.

**Expected:** reject the invalid import before clearing/replacing data and say
which field needs correction; alternatively render the invalid item safely and
allow correction. Validate every imported layout and item (kind, required
strings, link protocol/URL, timer bounds, and timestamps) before persistence.

**Evidence:** reproduced with a Playwright Chromium 151 fresh context against
the exact `dist/` build. The console/page-error collector contained only that
intentional reproduction error; normal flows contained none.

## Verification performed

### Clean install, tests, type/build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 90 packages installed; 0 audit vulnerabilities |
| `npx playwright install chromium` | Installed documented Chromium prerequisite |
| `npm test` | PASS — 7 Vitest unit tests; 6 Playwright tests (desktop and 390px mobile), 21.6 s |
| Type check | PASS — `tsc` runs as part of `npm run build` |
| Lint | No lint script/configuration is provided by this repository |
| Exact production build | PASS — `npm run build`; `dist/index.html` produced |

The first test attempt before installing Chromium failed solely because the
fresh container lacked Playwright's browser executable. After the documented
`npx playwright install chromium` step, the unchanged candidate test suite
passed.

### Product workflows and invalid-input paths

In a clean browser context on the production build I created a named capsule
and added a normal launch link, MIDI cue, one-minute timer, and text note. I
reordered a piece, started restore, started the timer, marked all four items
ready, finished the restore, exported JSON, copied a QR/share URL, and closed
the create dialog with Escape. All passed. The launch URL normalized to
`https://example.com/mix` and used `target="_blank" rel="noopener"`.

Malformed JSON (`{not json`) raised an alert and returned to a usable library.
An invalid UI URL (`http://`) stayed in the form and did not create an item;
the displayed message was the technical string `Failed to construct 'URL':
Invalid URL` (non-blocking P3 copy issue). A duration of 181 was blocked by
native validation (`Value must be less than or equal to 180.`); the normal
one-minute timer passed. The semantic-import case above is the blocking
failure.

### Browser, accessibility, responsive, and performance checks

| Check | Result |
| --- | --- |
| Desktop 1440×1000 visual/manual review | PASS — content has no horizontal overflow |
| Mobile 390×844 visual/manual review | PASS — intended stacking, no horizontal overflow (390px client/scroll width) |
| Keyboard | PASS — first Tab reaches skip link; visible coral 3px focus outline; Enter opens create dialog with name focused; Escape closes it |
| Reduced motion | PASS — computed button transition becomes `0.01ms` with `prefers-reduced-motion: reduce` |
| Axe serious/critical, local populated library | PASS — zero findings |
| Axe serious/critical, deployed desktop and 390px | PASS — zero findings |
| Deployment semantic smoke | PASS — title, `lang=en`, exactly one h1, one main landmark, zero images missing `alt`, no console/page errors on normal load |
| Lighthouse 12.8.2 mobile, local production | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0 |
| Initial JavaScript/CSS | PASS — 52.09 KB JS (18.78 KB gzip) and 17.75 KB CSS (4.81 KB gzip), within 200 KB/50 KB raw budgets |
| Hero assets | PASS — AVIF 21.90 KB, WebP 39.88 KB, PNG 186.47 KB; all below 300 KB |

### PWA and local-first behavior

All PWA checks were run against a static server serving the exact `dist/`
output:

- Chrome DevTools `Page.getInstallabilityErrors` returned an empty list for
  both local production and the live deployment.
- The worker installed, claimed the page after reload, and created
  `capsule-v1.0.1-shell` and `capsule-v1.0.1-runtime` caches. The shell cache
  includes the app HTML, offline page, manifest, icons, hero assets, and legal
  pages.
- After creating an `Offline state` capsule, `context.setOffline(true)` plus a
  full reload displayed the cached app and retained the IndexedDB capsule.
- I served a byte-modified worker revision (`capsule-v1.0.2`) without changing
  product source. `registration.update()` activated it and exposed the
  in-app **A fresh version is ready** / **Update now** prompt. No browser
  errors occurred.

### Privacy, requests, deployment identity, and headers

- A normal local product session issued no requests outside its own origin.
  Source inspection found IndexedDB only for user data, no analytics,
  beacons, remote API, third-party font, or runtime CDN.
- Privacy and terms routes return 200 and accurately describe local IndexedDB,
  exports, QR sharing, and the browser/window-management boundary.
- The live root, hashed JS/CSS, worker, manifest, offline page, privacy/terms,
  legal CSS, all three icons, and all three hero formats were downloaded and
  SHA-256-compared to `dist/`; all 15 files matched exactly. The live index
  also references the candidate hashes `index-hvrRGofZ.js` and
  `index-10kpsqOW.css`.
- Live HTTPS uses HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Content-Type-Options: nosniff`. There is no Content-Security-Policy
  or Permissions-Policy (P3 defence-in-depth observation).
- Live hashed JS/CSS are served `Cache-Control: public, must-revalidate,
  max-age=30`, rather than immutable long-lived caching. The service worker
  retains the shell for offline use, but this misses the stated static/PWA
  caching policy and needlessly revalidates versioned assets (P2 deployment
  observation).

## Non-blocking observations

- **P2 — deployment caching:** configure long-lived immutable caching for
  hashed assets while keeping HTML/service-worker update checks short-lived.
- **P3 — response hardening:** add a CSP and a restrictive Permissions-Policy
  suitable for this entirely static, local-first app.
- **P3 — validation copy:** replace raw `URL` constructor text with a
  user-facing message such as “Enter a complete http or https web address.”

## Retest gate

Correct and test deep validation for imported/share capsule item fields, then
rerun the clean install, full test suite, production build, invalid-import
reproduction, offline reload/update, and live byte-identity check. Configure
the deployment cache policy separately before release.
