# Review 2 handoff — Save and restore creative session layouts

## Release status

**FAIL — 2 findings remain: 1 P1 and 1 P2. Zero public claims are untested.**

- Live URL: <https://session-layout-capsule.sociobot.in>
- Demo URL: <https://session-layout-capsule.sociobot.in/demo>
- Implementation candidate: `776fc98665a4758103ffac2d02384193a1662747`
- Documentation HEAD reviewed: `1dbac63c5703d5f33115695c857fa560bae88563`
- Review report: [.factory/review-2.md](review-2.md)

No product code was changed. The 22 deployable files from the fresh candidate
build match the live site byte for byte.

## Findings to repair

1. **P1 — unreliable `free-core` claim command.** Its first exact run from the
   clean checkout passed on phone but failed on desktop. The test queried the
   restore checkboxes before the client-side route finished, received zero,
   skipped all checks, and timed out waiting for **Layout restored**. Wait for
   the restore URL or four visible checkboxes before iterating.
2. **P2 — static-page attribution touch target.** At 390 px, **Built by Param
   Factory** is about 143 × 15 CSS pixels on privacy, terms, offline, and 404
   pages. Give every static footer link a 44 px touch area.

The first issue is a claim-proof race, not a failed live workflow. An unchanged
rerun passed in both projects, 50 additional desktop diagnostic runs passed,
and an independent live run completed all four checks without login or
payment. The strict claims contract still makes the initial required-command
failure release-blocking.

## What passed

- Fresh `npm ci`: 170 packages, zero audit vulnerabilities.
- `npm test`: 23 unit/deployment tests and 60 browser executions passed.
- `npm run lint` and `npm run build` passed; `dist/index.html` was produced.
- Eleven claim commands passed on their first exact run. All 12 claims have
  exactly one tagged test, so the untested claim count is zero.
- Fresh desktop and 390 px phone profiles showed the job, audience, sample
  action, result, and three facts before scrolling.
- The populated four-item sample, persistent demo label, reset, real-data
  isolation, 4/4 restore output, keyboard use, route focus, reduced motion,
  invalid inputs, timer bounds, storage recovery, and same-origin requests
  were exercised.
- Offline reload retained the populated sample. Chromium reported no
  installability errors.
- Root, demo, privacy, terms, offline, and designed 404 routes had the correct
  titles and structure. Internal links passed. The deliberate unknown path
  returned HTTP 404 as expected.
- Live axe scans found no serious or critical issues on all six routes in both
  viewports. The worker URL verifier found no load or semantic errors.
- Live mobile Lighthouse scored 100 in Performance, Accessibility, Best
  Practices, and SEO. FCP was 0.9 s, LCP 1.2 s, TBT 0 ms, and CLS 0.

## Run and verify after repair

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

Run every exact command in `.factory/claims.json` from a clean checkout. Repeat
`npm run test:e2e -- --grep @claim:free-core` enough times to prove the route
wait is stable. Measure every visible link and button on each static page at
390 px. Then repeat the live desktop, phone, offline, accessibility, route, and
candidate-byte checks.

Evidence is under `/work/.evidence/review-2/`. The product has no backend,
shared database, account, payment, analytics, AI call, third-party runtime
script, CLI, library package, or native desktop artifact.
