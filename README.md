# Follow the packet

A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md)

## Run

    npm install
    npx playwright install chromium
    npm run dev

## Check

    npm run check

Runs types, lint (layer boundaries, names, comments), the folder-structure check, the copy-paste detector, unit tests and Playwright. "Done" means it passes entirely.

## Layout

The code lives in layers under `src/`; every folder has a `CLAUDE.md` guide that says what belongs there and what it may import. The rules are in `.claude/rules/`.
