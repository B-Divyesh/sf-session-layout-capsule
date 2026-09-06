# Session Layout Capsule

Save and restore the side tools around a creative project. Session Layout
Capsule is for home producers and live visualists who rebuild the same setup.

The app saves links, MIDI cues, timers, and notes in an ordered restore
checklist. It does not move desktop windows or configure external hardware.

- Live app: <https://session-layout-capsule.sociobot.in>
- Isolated sample: <https://session-layout-capsule.sociobot.in/demo>

## What it includes

- Local layouts with reorderable links, MIDI cues, timers, and notes.
- A restore checklist with progress and a two-minute target.
- Printable QR handoffs and copied handoff links.
- Versioned JSON export and import for backups.
- IndexedDB persistence across reloads and tabs.
- An installable PWA that works offline after the first visit.
- Clear empty, invalid-input, malformed-file, and storage-error states.
- Keyboard and touch support at a 390 px viewport.
- A free core workflow with no account or payment.

The demo has its own IndexedDB database. Resetting or leaving the demo deletes
sample changes and does not change real layouts. See [.factory/demo.md](.factory/demo.md).

## Run locally

Use Node.js 20 or newer.

```sh
npm install
npm run dev
```

No environment variables or external services are required.

## Test and build

Playwright 1.58.2 is pinned to the browser available in the worker image.

```sh
npm install
npx playwright install chromium
npm test
npm run lint
npm run build
```

Every public product claim has one browser test in
[.factory/claims.json](.factory/claims.json). Run each listed command from a
clean checkout. The production build writes `dist/index.html`.

Preview the production build with:

```sh
npm run preview
```

## Privacy and data ownership

Normal use sends requests only to this site. There are no accounts, analytics,
third-party fonts, runtime CDNs, or remote data stores. Layouts use browser
IndexedDB. Export JSON before clearing browser data. A QR code or handoff link
contains the layout, so share it only with intended recipients.

See [Privacy](public/privacy/index.html) and [Terms](public/terms/index.html).

## Product documents

- [Research brief](.factory/brief.json)
- [Visual system and asset provenance](.factory/design.md)
- [Demo sandbox](.factory/demo.md)
- [Public claim registry](.factory/claims.json)
- [Build handoff](.factory/handoff.md)

## License

MIT. See [LICENSE](LICENSE).
