# Demo sandbox

Open <https://session-layout-capsule.sociobot.in/demo> or `/demo` locally.
The landing page also opens it with **Try it with sample data**.

The demo starts with **Rooftop visuals rehearsal**. Its four ordered items are
a visual-preview link, a Launchpad MIDI cue, a two-minute projector timer, and
a window-placement note. The first demo screen shows the populated layout.

Demo data uses the IndexedDB database `demo:session-layout-capsule`. Real data
uses `session-layout-capsule`. While the demo banner is visible, the app reads
and writes only the demo database.

**Reset demo** clears the demo database and restores the original sample.
**Start for real** clears the demo database before opening `/`. Header and
footer links that leave demo mode also clear the demo database. No demo change
is copied into real data.
