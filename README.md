# Follow the packet

A study game about AWS. On screen it is called "Sigue el paquete". It has 33 chapters in five levels, from zero to AWS specialist, as the [chapters doc](../../docs/research/2026-10-09-follow-the-packet-chapters.md) cuts them: a chapter's number is its place in the game, not a course module, and each chapter names the course modules it plays, if any. Chapter 1 is playable: four incidents at the office with Lucía, where the player sends packets from a terminal (IP address, ping, Echo Request and Echo Reply, private IPs and the internet) and opens a host firewall. Chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, and every element of the interface are on the `#/entidades` page, which the roadmap does not link to. How the game looks (tokens, scales and the one component for each element) is in [DESIGN.md](DESIGN.md).

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md) · [chapter 1](../../docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md) · [design system](../../docs/plans/2026-10-09-follow-the-packet-design-system.md) · [33 chapters](../../docs/plans/2026-10-10-follow-the-packet-33-chapters.md)

## Run

    pnpm install
    pnpm exec playwright install chromium
    pnpm dev

## Check

    pnpm check

Runs types, lint (layer boundaries, names, comments), the folder-structure check, the copy-paste detector, unit tests and Playwright. "Done" means it passes entirely.

## Layout

The code lives in layers under `src/`; every folder has a `CLAUDE.md` guide that says what belongs there and what it may import. The rules are in `.claude/rules/`.
