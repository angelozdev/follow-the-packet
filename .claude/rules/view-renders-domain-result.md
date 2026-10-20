# The view renders the domain's result

The views — the map in `src/scene/` and the panels in `src/ui/` — draw what the engine already computed; they never re-derive a domain decision. Whether a packet passes, where it dies and why are read from the engine's `Trace` and from the level evaluations held in the game state, never from a view's own copy of the rules.

**Why:** a view that re-checks the rules becomes a second implementation of the engine. The day the engine learns something new (NACL in chapter 9), the two disagree and the map shows a packet crossing that the engine dropped — and what the map shows is what the player remembers.

**How to apply:**

- Every outcome a view shows (state, reason, place) is a field of the trace or the evaluation.
- When a view needs a fact the result does not carry, add it to the engine's result instead of computing it in the view.
- View-only computation stays in the view: layout, positions, animation timing and formatting are fine there; outcomes are not.
- Views import the engine's types and its results, never the functions that compute outcomes (simulation, rule matching, stages, DNS resolution). Player tools such as `getent` and `tcpdump` get their answers through the game state.

Enforcement: @typescript-eslint/no-restricted-imports lets src/scene/** and src/ui/** import only types from @/engine.
