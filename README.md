# Session Layout Capsule

Session Layout Capsule is an offline-first cue sheet for home producers and
live visualists. It saves the browser links, MIDI settings, setup timers, and
notes that sit around a main creative project, then walks through them in order
when it is time to restore the session.

It is intentionally not a desktop window manager: browsers cannot reliably
place external application windows or configure hardware. Capsule preserves
the setup’s intent, launches web tools, and makes the remaining placement work
visible and checkable.

Live: <https://session-layout-capsule.sociobot.in>

## What it includes

- Named, reorderable local layouts with launch links, MIDI cues, timers, and notes
- A timed restore checklist with explicit progress and a two-minute target
- Printable QR handoffs that carry the layout data without a cloud service
- Versioned JSON export/import for backups and data ownership
- IndexedDB persistence and an installable service-worker-backed PWA
- Purpose-built offline, empty, validation, and storage-error states
- Responsive keyboard/touch UI tested at a 390px viewport
- Static privacy and terms pages

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables or external
services are required at runtime.

## Test and build

Install Playwright’s browser once, then run the complete unit, browser,
accessibility, mobile, and offline suite:

```sh
npx playwright install chromium
npm test
npm run lint
npm run build
```

The production command is exactly `npm run build`. It writes the static site
to `dist/`, with `dist/index.html` at the deploy root. Preview it with:

```sh
npm run preview
```

## Privacy and data ownership

There are no accounts, analytics, third-party fonts, runtime CDNs, or remote
data stores. Layouts stay in browser IndexedDB. Export JSON for a durable
backup before clearing browser data. A QR or copied handoff URL contains the
layout itself, so only share it with intended recipients.

See [`public/privacy/index.html`](public/privacy/index.html) and
[`public/terms/index.html`](public/terms/index.html).

## Product and visual documentation

- [Research brief](.factory/brief.json)
- [Paper-cut visual system and asset provenance](.factory/design.md)
- [Build handoff and verification](.factory/handoff.md)

## License

MIT — see [LICENSE](LICENSE).
