# Build handoff — Session Layout Capsule

## Shipped

Finished v1 of the local-first PWA for saving and restoring the auxiliary tools
around a creative session. Users can create named capsules; add, edit, remove,
and explicitly reorder launch links, MIDI cues, timers, and notes; run a timed
restore checklist; and mark each stage piece ready. The editor states the
browser boundary clearly: it launches web links and remembers setup intent but
does not claim to arrange desktop windows or configure hardware.

Data persists in IndexedDB. JSON export/import provides backup and last-write-
wins merging. Each reasonably sized capsule can become a self-contained share
URL and printable QR handoff; no backend is involved. The app has empty,
validation, storage-error, completion, online/offline, and update states.

The paper-cut rehearsal-diorama system is documented in `design.md`. The hero
was generated specifically for this product, reviewed for artifacts, and ships
as 22 KB AVIF, 39 KB WebP, and 183 KB indexed PNG. PWA icons are original,
hand-authored artwork.

## Run and verify

```sh
npm install
npx playwright install chromium
npm test
npm run build
```

`npm test` passes 7 model tests and 6 Playwright checks across desktop and a
390×844 mobile viewport. Browser tests cover creation through completed restore,
axe serious/critical accessibility rules, and a true offline page reload using
`context.setOffline(true)`. `npm run build` reproducibly produces `dist/` with
`index.html` at its root.

Additional verification on 2026-08-27:

- Factory `verify-url.sh`: HTTP 200; title and `lang` present; exactly one `h1`;
  main landmark present; zero missing image alts; zero unlabeled buttons; zero
  console/page errors; measured local load 563 ms.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100.
- Lighthouse lab metrics: FCP 1.1 s, LCP 1.2 s, CLS 0, total blocking time 0 ms,
  speed index 1.1 s.
- Production payload: 52.09 KB JavaScript and 17.75 KB CSS uncompressed
  (18.78 KB and 4.81 KB gzip), below the 200 KB / 50 KB budgets.
- Hero image: 22 KB AVIF, 39 KB WebP, 183 KB fallback PNG, all below 300 KB.
- Manual visual review completed at 1440×1000 and 390×844. Focus states,
  reduced motion, legal routes, responsive stacking, and touch-size controls
  are implemented.

Evidence files are in `.factory/evidence/` (`verify.json`, screenshots, and the
Lighthouse JSON report).

## Known boundaries

- Browser security prevents arbitrary desktop window placement and external
  hardware configuration. This is intentionally a restore checklist, not OS
  automation or DAW parsing.
- There is no cloud sync. Clearing site data removes unexported capsules.
- Self-contained QR handoffs are capped at 2,600 URL characters for dependable
  scanning. Larger layouts remain portable through JSON export.
- A launch link can open a destination, but the destination’s availability and
  privacy behavior are outside this static app.

## Suggested next study

Run the brief’s five-session diary study: record restore time and the number of
manual placement steps. Add templates only after the study identifies repeated
piece patterns; do not expand into misleading desktop automation.
