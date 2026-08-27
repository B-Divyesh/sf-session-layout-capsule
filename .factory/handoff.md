# Repair handoff — Session Layout Capsule

## Release status

**PASS — repair commit `2acc60473d3f3932224a49ed25f98d27f53116db` is pushed to
`main` and deployed to <https://session-layout-capsule.sociobot.in>.** It
repairs both P2 findings in independent verification 2 without changing the
researched local-first PWA scope or the browser/window-placement boundary.

## What changed

- Launch-link normalization now identifies an explicitly supplied URI scheme
  before supplying `https://` to a bare hostname. Only `http:` and `https:`
  are accepted. `ftp:`, `mailto:`, `file:`, and `javascript:` now produce the
  recovery message “Use an http or https link.” and are not saved. Imported
  and QR-layout data continue to use the same validation boundary.
- `public/staticwebapp.config.json` is now deployed with the static app. HTML
  and `sw.js` retain `Cache-Control: public, max-age=30, must-revalidate`; Vite
  content-hashed `assets/index-*.{js,css}` receive
  `public, max-age=31536000, immutable`.
- The configuration also makes the existing response policy explicit:
  `nosniff`, strict-origin referrer policy, a local-only CSP (with `data:` only
  for the generated QR image), and a restrictive Permissions-Policy. The
  storage-recovery button was converted from an inline event handler to a
  normal listener so it remains functional under that CSP.
- Service-worker cache version is `capsule-v1.0.3`, so clients on the rejected
  candidate receive the new shell and the existing update notification.
- Added a real ESLint gate (`npm run lint`) for `src/` and `tests/`.

## Exact regression coverage

- `src/model.test.ts`: each of `ftp://example.com`,
  `mailto:stage@example.com`, `file:///tmp/cues.txt`, and
  `javascript:alert(1)` is rejected both at direct normalization and at JSON
  import; valid bare and explicit HTTP(S) links remain accepted.
- `tests/app.spec.ts`: each unsupported scheme is submitted through the actual
  workbench at desktop and 390px, asserts the field alert, and asserts that no
  piece is added. The existing offline browser test now asserts the repaired
  `capsule-v1.0.3-shell` cache.
- `src/deployment.test.ts`: locks the short document/worker policy, immutable
  hashed-bundle route, and CSP requirements in the source deployment config.

## Verification — 2026-08-27 UTC

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

- Clean install: 169 packages added; `npm audit` reported 0 vulnerabilities.
- `npm test`: 21 Vitest tests passed and 16 Playwright executions passed (8
  browser specifications on each desktop Chrome and 390×844 mobile project).
  This includes create/restore, axe serious/critical, malformed import, all
  four unsupported-scheme paths, and offline reload.
- `npm run lint` passed with zero warnings; `npm run build` passed TypeScript
  and produced `dist/index.html` at the static deploy root.
- Production bundle sizes: JS `54,146` bytes (`19,394` gzip) and CSS `17,747`
  bytes (`4,810` gzip), under the 200 KB/50 KB raw budgets. The existing hero
  AVIF/WebP/PNG remain 21,899 / 39,880 / 186,469 bytes.
- Live desktop (1440px) and mobile (390px) browser smoke: first Tab reaches
  the skip link, no horizontal overflow, no console/page errors, zero Axe
  serious/critical findings, and no requests leave the product origin. The
  live `ftp:` workbench path shows the expected recovery message and saves no
  unsafe piece.
- Offline: after the worker was ready, an offline reload opened the cached
  live shell; the expected `capsule-v1.0.3-shell` cache was present.
- Update: a local static-server check first served `v1.0.2`, then served this
  `v1.0.3` worker to `registration.update()`. It displayed “A fresh version is
  ready” with no console errors.
- Factory `verify-url.sh` against production: HTTP 200, 909 ms load, no
  console/page errors, title, `lang=en`, one `h1`, one `main`, zero missing
  image alts, and zero unlabeled buttons. Its current artifacts are in
  `.factory/evidence/`.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0.
- Live response policy: root and `sw.js` return
  `public, max-age=30, must-revalidate`; both deployed content-hashed bundles
  return `public, max-age=31536000, immutable`. HSTS, referrer policy,
  `nosniff`, CSP, and Permissions-Policy are present.
- Live identity: SHA-256 matched every checked deployed artifact to the final
  `dist/` output (19 files, including HTML, worker, manifest, legal routes,
  icons, all assets, and the hashed JS/CSS bundles).

## Deployment

Deployed the final `dist/` through the supplied Azure Static Web Apps static
deployment configuration. The deployment completed successfully and the custom
domain is serving the exact built artifact.

## Known product boundaries

- Browsers cannot place arbitrary desktop windows or configure external MIDI
  hardware; Capsule intentionally remains an honest launch/checklist tool.
- There is no cloud sync. Layouts live in IndexedDB; users should export JSON
  before clearing browser storage. QR handoffs are capped at 2,600 characters;
  larger layouts use JSON export.
