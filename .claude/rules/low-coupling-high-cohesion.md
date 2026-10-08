# Low coupling, high cohesion

Every module (function, class, utility, package) groups together what changes together (high cohesion) and exposes a small interface to the rest of the codebase (low coupling) — consumers don't need to know its internals, and its internals can change without breaking consumers.

**How to apply:** before wiring two pieces directly together, ask whether one could change without touching the other. If not, the boundary between them is drawn wrong — usually fixed by passing explicit data/callbacks instead of one module reaching into another's internal state. See [[single-responsibility]].
