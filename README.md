# Follow the packet

A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, is on the `#/entidades` page, which the roadmap does not link to.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md)

## Run

    npm install
    npx playwright install chromium
    npm run dev

## Check

    npm run check

Runs types, lint (layer boundaries, names, comments), the folder-structure check, the copy-paste detector, unit tests and Playwright. "Done" means it passes entirely.

## Layout

The code lives in layers under `src/`; every folder has a `CLAUDE.md` guide that says what belongs there and what it may import. The rules are in `.claude/rules/`.
