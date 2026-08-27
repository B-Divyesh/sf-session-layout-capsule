# Independent verification 3 — PASS

**Candidate:** `a29d981c21d9f578e0b8e82e5439e99bb0f9cd23` on `main`  
**Production URL:** <https://session-layout-capsule.sociobot.in>  
**Verified:** 2026-08-27 UTC, from a clean checkout.

## Verdict

**PASS — accept this candidate.** The previously reported deployment-only
cache-policy issue and the non-HTTP(S) launch-link validation issue are both
fixed in the live release. The deployed public artifacts match this candidate's
fresh production build.

No P0, P1, P2, or P3 product defects were found. The only non-blocking
observation is that the host returns `application/octet-stream` for
`manifest.webmanifest`; Chromium still recognizes the manifest and the PWA is
installable. Serving it as `application/manifest+json` would be a small
interoperability improvement, not an acceptance failure.

## Defects by severity

| Severity | Findings |
| --- | --- |
| P0 / P1 / P2 / P3 | None |
| P4 (observation) | Manifest MIME type is `application/octet-stream`; installation succeeds in Chromium. |

## Clean-install quality gates

Commands run:

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

Results:

- `npm ci`: 169 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm test`: PASS — 21 Vitest unit/deployment tests and all 16 Playwright
  executions (8 specs on desktop and 390×844 mobile) passed. Coverage includes
  create/restore, malformed imports, unsupported `ftp:`, `mailto:`, `file:`,
  and `javascript:` URLs, axe, and offline reload.
- `npm run lint`: PASS with zero warnings.
- `npm run build`: PASS — TypeScript completed and Vite emitted `dist/`.

This is a static PWA, not a package/CLI or backend; consumer-install, server
concurrency, persistence-server, and health-endpoint checks do not apply.

## Product behavior exercised

On the freshly built production artifact, at 390px, I created a named capsule
and added all four supported pieces: a normalized launch link, MIDI cue,
180-minute timer boundary, and note. The restore checklist completed all four
items and displayed **The stage is ready** with no page errors. An explicit
`ftp://example.com` launch target showed **Use an http or https link.** and was
not added. The native numeric maximum blocks 181 minutes; the 1-minute lower
boundary is covered by the repository's model/browser tests.

I also verified JSON export, a generated 640×640 QR handoff image with its
copy action, layout persistence through reload, malformed-import recovery,
reordering, and the launch-link boundary (`https://example.com/...`,
`target="_blank"`, `rel="noopener"`). The restore copy explicitly explains
that Capsule is a cue sheet, not a window manager or MIDI hardware controller,
which meets the brief's browser-boundary constraint.

## Accessibility, responsive behavior, and browser health

- Fresh live desktop (1440px) and 390px smoke: one `h1`, one `main`,
  `lang="en"`, title, all images have alt attributes, and no horizontal
  overflow.
- Keyboard: first Tab reaches the visible skip link. In the workbench, Tab
  reaches the visually focused radio control and ArrowDown changes the selected
  piece type (`link` → `midi`); the designed sibling focus outline is solid.
- Reduced motion: live 390px `prefers-reduced-motion: reduce` computed a
  `0.01ms` transition. Normal desktop transition is `0s` on the empty shelf.
- Fresh axe-core scans on live desktop and 390px: **0 serious/critical**
  violations. Fresh Lighthouse accessibility was 100.
- Fresh browser captures on both viewports: no console errors or page errors.
- Normal-use request capture contained only
  `https://session-layout-capsule.sociobot.in`.

## PWA, privacy, policies, and deployment identity

- Offline: after `navigator.serviceWorker.ready`, a live full offline reload
  loaded the cached shell (`capsule-v1.0.3-shell`); dispatching the offline
  event displayed **Offline — your saved capsules still work.**
- Update: an isolated local static-server test first served the candidate
  worker and then a byte-revised worker. `registration.update()` made the
  actual app show **A fresh version is ready** and created
  `capsule-v1.0.4-shell`; no console errors occurred. Product sources were not
  modified for this test.
- Manifest: standalone display, versioned start URL, 192/512 and maskable
  icons, and matching cream splash/theme colors are present.
- Local-first/privacy review: IndexedDB is the only application-data store;
  source and live request capture show no analytics, tracking, third-party
  scripts/fonts, or remote data service. Privacy and terms pages load and
  accurately document IndexedDB, export, and QR disclosure.
- Response policies: live HTML and `sw.js` return
  `Cache-Control: public, max-age=30, must-revalidate`; the live hash-named JS
  and CSS both return `public, max-age=31536000, immutable`. HSTS,
  `X-Content-Type-Options: nosniff`, strict-origin referrer policy, local-only
  CSP, and restrictive Permissions-Policy are present.
- Identity: SHA-256 matched all 18 URL-served files in the fresh build to live
  bytes (HTML, worker, manifest, legal pages/CSS, icons, images, and hashed
  JS/CSS). The 19th `dist` file is `staticwebapp.config.json`, deployment
  configuration intentionally not served as a public asset.

## Performance

Fresh live Lighthouse 13.4 mobile:

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP was 0.9 s, LCP 1.1 s, TBT 0 ms, and CLS 0. Fresh build sizes were
54,146 bytes JS (19,394 gzip) and 17,747 bytes CSS (4,810 gzip), below the
200 KB/50 KB raw budgets. AVIF/WebP/PNG hero variants are 21,899 / 39,880 /
186,469 bytes, each below the 300 KB mobile budget.

## Retest notes

No corrective work is required. If the deployment platform permits MIME
overrides, serve `manifest.webmanifest` as `application/manifest+json`.
