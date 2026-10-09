# Pure domain core

`src/engine/` holds the network rules — the part that decides what happens to a packet. It imports no UI, rendering or framework code (`react`, `react-dom`, `three`, `@react-three/*`) and does no I/O (no `localStorage`, no network). Its functions are deterministic: the same network and packet always give the same trace. Time and randomness reach it only as explicit inputs, never as hidden reads.

**Why:** a pure engine is tested in milliseconds without a browser, and the AWS behavior it teaches cannot be broken by a change in how the map is drawn.

**How to apply:**

- Never call `Date.now()`, `Math.random()` or read storage inside `src/engine/`: take the value as a parameter.
- A function may build and mutate local state internally (like the simulation context), as long as its callers see a pure function.
- The engine returns data (codes and values), never display text: `src/copy/` turns that data into Spanish (see [[english-only]]).

Enforcement: no-restricted-imports, no-restricted-globals and no-restricted-syntax on src/engine/** in pnpm lint.
