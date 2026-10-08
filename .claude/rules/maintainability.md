# Maintainability & scalability

Code must be maintainable and scalable: someone new understands it by reading names and interfaces, without tracing the whole codebase; and adding a new case shouldn't require rewriting what already exists, only adding to it.

In this project "one more case" is one of two things:

- **One more level:** a single level file in `src/levels/NN-<chapter>/` built with `defineLevel`. Nothing else is touched; the per-level tests validate it.
- **One more network mechanic** (NACL, connection timing, blast radius): a new stage in the engine's simulation pipeline with its own tests. Existing stages and levels don't change.

This is achieved by combining the rest of the rules — [[dry]], [[kiss]], [[low-coupling-high-cohesion]], and [[single-responsibility]] — this file doesn't add a new rule, it's the goal the other four serve.
