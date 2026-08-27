# Independent verification 2 — FAIL

**Candidate:** `82d3b8f95af2253a3b6cc49ec372389bcfff8e95` (`main`)

**Production URL:** <https://session-layout-capsule.sociobot.in>

**Verified:** 2026-08-27 UTC from a detached clean checkout of the candidate.

## Release verdict

**FAIL — do not accept this candidate as fully meeting the factory contract.**
The live deployment is the exact candidate artifact and the previously reported
P1 malformed-import crash is fixed. However, two P2 acceptance defects remain:
the host does not give content-hashed assets immutable caching, and explicitly
non-web launch URLs are silently transformed into unusable HTTPS-looking links
instead of being rejected with a recovery message.

## Defects

### P2 — immutable cache policy is absent on the live static deployment

The product's PWA/performance contract requires long-lived immutable caching
for content-hashed assets. Fresh live `HEAD` requests returned:

```
GET /assets/index-B-v61sIi.js
Cache-Control: public, must-revalidate, max-age=30
```

The root document and `sw.js` have the same 30-second policy. The JS filename
is content-hashed, so it should have a long immutable lifetime while HTML and
the worker retain a short update-check lifetime. The service worker does provide
offline caching, but it does not satisfy the required HTTP cache policy and
causes unnecessary revalidation. This is deployment configuration work, not a
source-artifact mismatch.

### P2 — a supplied non-HTTP(S) URL is accepted as a corrupted launch link

**Reproduction, local production build:**

1. Create a capsule, add a **Launch link**, and use `ftp://example.com` as the
   web address.
2. Submit **Add piece**.

**Observed:** no validation message is shown; the piece is saved and displays
host `ftp`. The normalizer prepends `https://` before detecting an existing
scheme, effectively producing an HTTPS-looking malformed target rather than a
usable FTP link or a field error.

**Expected:** reject explicitly supplied non-HTTP(S) schemes such as `ftp:`,
`mailto:`, `file:`, and `javascript:` with the existing useful recovery copy.
The product promises HTTP(S) launch links; accepting malformed input defeats
the restore checklist's launch action.

## Fresh verification evidence

### Clean checkout and quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 90 packages installed; 0 audit vulnerabilities |
| Playwright Chromium install | PASS — installed for Playwright 1.62.1 |
| `npm test` | PASS — 10 Vitest tests and 8 Playwright tests (desktop + 390px) |
| TypeScript | PASS — `tsc` runs within the exact build command |
| Lint | No lint script or lint configuration is present |
| `npm run build` | PASS — production `dist/` built from the candidate |

The repository is a static PWA, not a library/CLI or backend; package-consumer,
concurrency, persistence-server, and health-endpoint checks do not apply.

### End-to-end behavior and recovery

On the built production artifact I independently created a named rehearsal
capsule with a normalized launch link, MIDI cue, one-minute timer, and note;
reordered a piece; started and completed restore; exported JSON; generated and
copied the QR handoff; and verified the copied handoff imported into a fresh
browser page. The launched link was `https://example.com/mix` with
`target="_blank" rel="noopener"`.

Valid JSON imported successfully. The exact prior poisoned-import payload
(`url: "not a valid URL"`) produced
`Layout 1, item 1 web address must be a complete http or https URL.`, persisted
no poisoned capsule, and produced no page error. UI input `http://` likewise
showed a useful error and added no item. A one-minute timer worked; 180 minutes
is within the control's range and 181 is blocked by native maximum validation.
The explicit `ftp:` case above is the remaining recovery failure.

### Browser, accessibility, responsive, and performance

| Check | Result |
| --- | --- |
| Desktop 1440px and mobile 390px live smoke | PASS — no horizontal overflow, one `h1`, one `main`, `lang=en`, title, and zero missing image alts |
| Keyboard and focus | PASS — first Tab reaches the visible skip link with a coral focus outline; dialogs accept keyboard focus and Escape closes them |
| Reduced motion | PASS — computed transition duration is `0.01ms` |
| Axe serious/critical, deployed desktop and 390px | PASS — zero findings |
| Console/page errors on normal local and live paths | PASS — none |
| Lighthouse 13.4 mobile performance, exact built artifact | PASS — Performance 97; FCP 2.1 s, LCP 2.1 s, TBT 0 ms, CLS 0 |
| Initial JS/CSS | PASS — JS 53,945 bytes (19,058 gzip); CSS 17,747 bytes (4,819 gzip), under 200/50 KB raw budgets |
| Hero assets | PASS — AVIF/WebP/PNG 21,899 / 39,880 / 186,469 bytes, each under 300 KB |

### PWA, privacy, deployment, and policies

- PWA installability: PASS. Chrome DevTools returned no installability errors
  on the live deployment. The manifest has standalone display, valid 192/512
  and maskable icons, and the versioned start URL.
- Offline: PASS. After the worker became ready and a capsule was created,
  a full `context.setOffline(true)` reload opened the cached shell, retained
  the IndexedDB capsule, and showed the offline status banner.
- Update: PASS. A separate test server served an otherwise identical temporary
  worker revision. `registration.update()` activated it, created the new
  versioned cache, and showed **A fresh version is ready** with **Update now**;
  no errors occurred. No product source was changed for this test.
- Privacy/outbound requests: PASS for normal use. Fresh browser request
  capture contained only the product origin. Source and runtime review found
  IndexedDB local data, no analytics, beacons, third-party scripts, CDN fonts,
  or remote data API. Privacy and terms routes load and describe the local/QR
  boundary accurately.
- Deployment identity: PASS. SHA-256 comparison matched all 16 checked live
  files to `dist/`: index, worker, manifest, offline and legal pages/CSS,
  four icon files, hash-named JS/CSS, and all three hero formats.
- Response hardening: HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Content-Type-Options: nosniff` are present. There is no
  `Content-Security-Policy` or `Permissions-Policy` (P3 defense-in-depth
  observation). The live manifest is served as `application/octet-stream`,
  though Chrome still reported it installable (P3 interoperability observation).

## Retest gate

1. Reject an explicit non-HTTP(S) scheme before prefixing bare host names, and
   add UI/browser regression coverage for `ftp:`, `mailto:`, `file:`, and
   `javascript:` inputs.
2. Configure immutable long-lived caching for hash-named assets, retaining a
   short cache policy for HTML and `sw.js`.
3. Re-run the clean install, full test suite, exact production build, URL
   boundary regression, offline/update checks, live byte-identity comparison,
   and response-header check.
