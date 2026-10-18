# Follow the packet

A study game about AWS. On screen it is called "Sigue el paquete". It has 33 chapters in five levels, from zero to AWS specialist, as the [chapters doc](../../docs/research/2026-10-09-follow-the-packet-chapters.md) cuts them: a chapter's number is its place in the game, not a course module, and each chapter names the course modules it plays, if any. Chapter 1, "Tu primer día", is playable: fourteen subchapters in five blocks (where you are, the ping, leaving the office, the guard, the first watch), each with one new idea, at the office with Lucía. The player marks devices and picks IPs with chips, sends packets, pings and traceroutes from a terminal, sets the default gateway of a laptop in its own card, writes inbound and outbound firewall rules on tabs, and ends by diagnosing seven cases alone. Its human test is one playthrough of the whole chapter by the student, still to do. Chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office with floors, routers, a default gateway and a server of the internet, or a VPC, with devices and firewalls by kind. Saved progress lives under one versioned key in the browser (`v2`); the old key is removed on load and nothing is migrated. Every entity of the map, in every variant and state, and every element of the interface are on the `#/entidades` page, which the roadmap does not link to. How the game looks (tokens, scales and the one component for each element) is in [DESIGN.md](DESIGN.md).

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) (its entity catalog, generic model and `send` mechanic still hold) · [chapter 1 in fourteen subchapters spec](../../docs/specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) (replaces its four incidents) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md) · [chapter 1, four incidents](../../docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md) · [chapter 1 in fourteen subchapters](../../docs/plans/2026-10-10-follow-the-packet-chapter-1-fourteen.md) · [design system](../../docs/plans/2026-10-09-follow-the-packet-design-system.md) · [33 chapters](../../docs/plans/2026-10-10-follow-the-packet-33-chapters.md)

## Run

    pnpm install
    pnpm exec playwright install chromium
    pnpm dev

## Check

    pnpm check:fast
    pnpm check

`pnpm check:fast` runs types, lint (layer boundaries, names, comments), the folder-structure check, the copy-paste detector and unit tests, with no browser (about 10 seconds). `pnpm test:browser` runs the browser tests (`src/**/*.browser.test.tsx`) in headless Chromium. `pnpm check` is `pnpm check:fast`, then `pnpm test:browser`, then Playwright. "Done" for a task means `pnpm check:fast` plus `pnpm test:browser` when the task touches geometry or CSS and the end-to-end specs that cover what it touched; closing a block and merging need the whole `pnpm check` (see `tests/e2e/CLAUDE.md`).

## Layout

The code lives in layers under `src/`; every folder has a `CLAUDE.md` guide that says what belongs there and what it may import. The rules are in `.claude/rules/`.
