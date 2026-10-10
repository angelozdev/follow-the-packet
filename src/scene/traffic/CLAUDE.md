# scene/traffic

Traffic: each live flow sends a packet every few seconds along the path of its trace, each packet the player sent travels once per send, and every one leaves a stamp at the end of its path, all drawn with the catalog (`@/scene/entities`). With "Sin animaciones" each path is drawn still. The stamps of flows and sent packets are spread together.

- The clock lives in `use-packet-runs.ts`: a live flow leaves on its schedule, a sent packet once for each new send number. `flow-look.ts` turns each packet's result (`intruder`, `reached`, `replied`, `blocked`) into its look (its message, whether it is an intruder, how its run ends) and the state of its stamp. Only a firewall blocks: a packet that reaches no device and that no firewall stopped is lost. Nothing here decides whether a packet gets in.
- Not here: deciding whether a packet gets in (`src/engine/`, run by `src/game/`), the shape of a packet or a stamp (`src/scene/entities/`), piece labels and the task card anchor (`src/scene/overlay/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
