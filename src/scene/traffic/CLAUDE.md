# scene/traffic

Live traffic: each flow sends a packet every few seconds along the path of its trace, a blocked one bursts at the door, a replied one comes back, and a stamp at the end of each path can be inspected. With "Sin animaciones" each path is drawn still.

- The clock lives in `use-packet-runs.ts`; whether a packet gets in comes from the flow's `reached` and `replied`, never from here.
- Not here: deciding whether a packet gets in (`src/engine/`, run by `src/game/`), piece labels and the task card anchor (`src/scene/overlay/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).
