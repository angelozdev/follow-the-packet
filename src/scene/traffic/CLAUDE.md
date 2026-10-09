# scene/traffic

Live traffic: each flow sends a packet every few seconds along the path of its trace and leaves a stamp at the end of the path, both drawn with the catalog (`@/scene/entities`). With "Sin animaciones" each path is drawn still.

- The clock lives in `use-packet-runs.ts`; `traffic.tsx` turns each flow's result (`reached`, `replied`) into the look of its packet and its stamp, and never decides whether a packet gets in.
- Not here: deciding whether a packet gets in (`src/engine/`, run by `src/game/`), the shape of a packet or a stamp (`src/scene/entities/`), piece labels and the task card anchor (`src/scene/overlay/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
