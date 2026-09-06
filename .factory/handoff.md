# Review 1 handoff — Session Layout Capsule

## Release status

**FAIL — 8 findings and 10 untested public claims remain.**

Review report: [review-1.md](review-1.md)

- Implementation reviewed: `2acc60473d3f3932224a49ed25f98d27f53116db`
- Documentation reviewed: `83b6050a2a1572f49fdafecf7eb5097f0bb154db`
- Live URL: <https://session-layout-capsule.sociobot.in>
- Live bytes match all 19 public files from the fresh build.
- Product code was not changed by this review.

## What passed

- `npm install`, the documented Chromium install, `npm test` (21 unit and 16
  browser runs), `npm run lint`, and `npm run build` pass from a clean checkout.
- A realistic phone workflow passed for all four item types, persistence, JSON
  export, QR/link handoff, restore, deletion, invalid URL, timer maximum,
  storage recovery, offline reload, reduced motion, and same-origin privacy.
- Axe found zero violations on all sampled live routes. `verify-url.sh` passed.
- Lighthouse scored 100 in Performance, Accessibility, Best Practices, and
  SEO. FCP and LCP were 1.1 s, TBT was 0 ms, and CLS was 0.
- Earlier import validation, unsafe URL, cache, and response-header findings are
  fixed. The manifest MIME observation remains open.

## What remains

1. Add a one-click, populated demo with separate storage, persistent demo
   label, reset, real-mode exit, and `.factory/demo.md`.
2. Add `.factory/claims.json` and one `@claim` test for each of the 10 public
   claims listed in the review.
3. Add real routes, route titles/history/focus announcements, and a designed
   HTTP 404.
4. Rewrite and complete the first screen and landing-page order under the
   plain-words contract; add `.factory/copy-audit.md`.
5. Add required metadata, header navigation, consistent legal-page skeleton,
   footer attribution/build id, and complete sitemap.
6. Increase footer link hit areas to at least 44×44 CSS px.
7. Replace the raw malformed-JSON parser alert with a plain recovery message.
8. Serve the web manifest as `application/manifest+json`.

## Verify after repair

```sh
npm install
npx playwright install chromium
npm test
npm run lint
npm run build
npm run preview
```

Then run every claim command from the isolated demo in fresh contexts and
repeat live phone, desktop, offline, update, accessibility, route, link,
header, and byte-identity checks. Do not declare PASS until both finding and
untested-claim counts are zero.
