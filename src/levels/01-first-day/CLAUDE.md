# levels/01-first-day

Chapter 1, «Tu primer día» (level 0, Bases), your first day at the office with Lucía: one file per incident (`NN-<slug>.ts`, a default export built with `defineIncident`) and `shared.ts` with the chapter's lesson, the office (`192.168.1.0/24`: your laptop, Lucía's laptop and the printer) and the chips.

- 01-01 brings the base world; every later incident brings only its changes over the reference solution of the one before.
- A device's own name is its hostname (`tu-laptop`, `laptop-lucia`, `impresora`), like the `Name` of an EC2 instance: a proper name with no article, so a generated sentence reads «el firewall de laptop-lucia». The texts written here call the devices in plain Spanish («la laptop de Lucía») and do not mark their names.
- Texts tag their terms (`{{packet|paquete}}`) and use only terms introduced by this incident or an earlier one; no text names an AWS term, which arrive in chapter 4.
- Not here: the incident contract, chips and registry (`src/levels/`), visible UI text (`src/copy/`), network rules (`src/engine/`).
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`.
