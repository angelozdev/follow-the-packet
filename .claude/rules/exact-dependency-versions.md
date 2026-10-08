# Exact dependency versions

Every dependency the project adds is pinned to an exact version — no `^` or `~` range. The package manager is npm (`package-lock.json`), and `.npmrc` in this project sets `save-exact=true`, so `npm install <pkg>` and `npm install -D <pkg>` already pin correctly. Never hand-edit a version number into `package.json`, and never add a range back in.

**Why:** a caret range means the actual installed version silently drifts between machines and CI runs on every fresh install — exact versions make what's running reproducible and every upgrade an explicit, reviewable diff.

**How to apply:** adding a new dependency is always `npm install` (with `-D` for dev dependencies), never a manual manifest edit with a guessed version number. npm does not gate install scripts per package: a dependency whose install script must run is approved explicitly, one package at a time, before it is added.

Enforcement: .npmrc with save-exact=true; package.json has no ^ or ~ ranges.
