# storage

Progress kept in the browser: best stars per incident, and which incidents are open. An incident opens when it is the first one, when the one right before it in game order has a star, or when it has stars itself.

- The stars live under one key (`PROGRESS_KEY`, now `v2`). Loading deletes the progress saved under the key before it (`v1`) and copies nothing from it; when the storage cannot delete, the current progress still loads. A change that breaks what is saved takes a new key, and the old one is deleted on load.
- Not here: anything that decides an outcome or draws.
- May import: `@/engine`, `@/copy`, `@/levels`.
