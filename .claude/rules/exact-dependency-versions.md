# Exact dependency versions

Every dependency the project adds is pinned to an exact version — no `^` or `~` range. The package manager is pnpm (`pnpm-lock.yaml`, `packageManager` in `package.json`), and `pnpm-workspace.yaml` in this project sets `saveExact: true`, so `pnpm add <pkg>` and `pnpm add -D <pkg>` already pin correctly. Never hand-edit a version number into `package.json`, and never add a range back in.

**Why:** a caret range means the actual installed version silently drifts between machines and CI runs on every fresh install — exact versions make what's running reproducible and every upgrade an explicit, reviewable diff.

**How to apply:** adding a new dependency is always `pnpm add` (with `-D` for dev dependencies), never a manual manifest edit with a guessed version number. pnpm runs no dependency install script unless it is allowed in `pnpm-workspace.yaml`: a dependency whose install script must run is approved explicitly, one package at a time, before it is added.

Enforcement: pnpm-workspace.yaml with saveExact: true; package.json has no ^ or ~ ranges.
