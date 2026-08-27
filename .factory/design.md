# Session Layout Capsule — visual thesis

## Direction: paper-cut rehearsal diorama

A session is a small stage that has to be reset before every performance. The
interface treats each saved layout as a labelled paper set: warm fibre stock,
ink-dark type, offset coral tabs, clipped corners, and shallow physical layers.
The metaphor explains the product—individual tools become moveable cue cards,
and a restore is a deliberate walk through the stage—without suggesting that
the browser can position desktop windows.

This is intentionally a focused light treatment. The warm paper field is the
product's material, not a generic theme; there is no dark-mode surface because
the paper-cut depth and print handoff rely on one stable, high-contrast palette.

## Tokens

- `paper`: `#F5EEDB` — uncoated rehearsal notebook stock.
- `paper-raised`: `#FFF9EA` — the face of a card under stage light.
- `ink`: `#17241F` — near-black green ink; primary text.
- `ink-soft`: `#4E5B54` — pencil annotation; secondary text (7.1:1 on paper).
- `coral`: `#C84630` — a stage-manager's grease pencil; primary actions.
- `coral-dark`: `#8E2C1C` — action hover and link text.
- `mustard`: `#D59D1D` — taped markers and timer panels.
- `teal`: `#1D6B64` — MIDI and successful restore states.
- `danger`: `#A32D2D` — destructive state, always paired with a label/icon.
- Shadows use hard ink offsets (`4px 5px 0 rgba(23,36,31,.18)`), like stacked
  paper rather than soft SaaS elevation.

All body text/color combinations target WCAG AA at 4.5:1 or better. Spacing is
an 8px rhythm with 4px optical adjustments: 4, 8, 12, 16, 24, 32, 48, 64.
Controls are at least 44px tall with 8px between neighboring targets.

## Type

- Display: Georgia, `Times New Roman`, serif. Its editorial, slightly theatrical
  voice labels layouts as scenes, without downloading a font.
- Utility/body: `Arial`, `Helvetica Neue`, sans-serif for fast scanning and
  dependable offline rendering. Numeric timers use tabular figures.
- Scale: 14px label, 16px body, 20px card title, 28px section, fluid 40–64px h1.

## Layout and interaction grammar

The landing view is split between the saved capsule library and a compact
paper-stage illustration. Layout cards use a small colored registration tab
and one hard shadow. Editing happens on a wide workbench where items sit in
four clearly labelled lanes: Launch links, MIDI cues, Timers, Notes. Cards can
be reordered with explicit up/down controls (keyboard and touch reliable), not
drag-only gestures. Restore mode becomes a linear cue sheet: one large item at
a time, an elapsed timer, a complete checkbox, and an honest “browser boundary”
note. A 390px view stacks the scene, removes decorative edge scraps, and keeps
the primary action sticky only when it cannot cover content.

Feedback uses stamped language: Saved, Copied, Restored. Empty and error states
keep the same stage metaphor but always name a concrete next action.

## Motion

Paper elements enter from their implied stack with a 6px translate and opacity
over 180–240ms. Buttons press down 2px; checkmarks appear once. No element loops.
With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are
removed and state changes are instant; hierarchy remains through position,
shape, labels, and contrast.

## Original asset plan and prompt sheet

One hero image shows a miniature rehearsal desk assembled from cut paper: a
small timer card, a grid-pad card, a browser-tab strip, a handwritten cue slip,
and colored cable-like ribbons arranged as a tidy stage. It clarifies the
saved-arrangement metaphor but includes no UI promises or functional labels.
It is cropped responsively, exported as WebP, and kept below 300 KB. PWA icons
are authored in-repo as original SVG/pixel exports: a coral capsule containing
four staggered paper layers.

Prompt sheet: “Editorial paper-cut diorama of a home music rehearsal control
desk viewed in gentle three-quarter isometric perspective; layered uncoated
cream paper, dark forest ink edges, coral red registration tabs, mustard tape,
deep teal grid-pad accents; miniature timer card, abstract MIDI pad, browser
tab strips, note slip, and looping paper cable ribbons arranged into a compact
stage; tactile fibres, crisp hand-cut edges, long shallow shadows, quiet warm
studio light, 50mm product photography, generous empty cream area, sophisticated
printmaking composition. No people, no hands, no legible text, no letters, no
numbers, no logos, no brands, no watermark, no gradients, no glossy plastic,
no photoreal electronics, no UI screenshot.”

Asset provenance: generated specifically for this product with the factory
Azure OpenAI image deployment (`factory-image`) on 2026-08-27. Generated output
is product-original and disclosed in the footer. Icon assets are hand-authored
SVG by the product builder on the same date. Source prompt metadata lives beside
the retained image candidate in `assets/src/`.
