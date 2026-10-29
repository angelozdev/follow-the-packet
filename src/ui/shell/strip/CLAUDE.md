# ui/shell/strip

The strip across the top of the incident screen. `top-strip.tsx` (`TopStrip`) draws «← Roadmap» (`SCREEN_TEXT.back`, a `text` `Button` that links to `#/`), the title of the incident as the `h1` of the page and the «Sin animaciones» checkbox (`MotionToggle`, at the right).

- The strip is a row of its own, the first zone of `main.incident` (`.incident__strip`), so it floats over nothing and the map box starts under it. It is first in the reading order: strip, Lucía, map, panel and status bar.
- It takes its facts from the caller (the title, whether animations are off and what changes that) and decides nothing about them.
- Not here: the clock and the almanac, which arrive in later tasks of the shell; the Spanish text (`src/copy/`).
- May import: `@/copy`, `@/design`, `@/ui/motion-toggle`.
