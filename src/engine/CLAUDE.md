# engine

The pure domain core: the network model (an office or an AWS VPC) and the packet simulation. The same input always gives the same output.

- Belongs here: network model (`network/`), simulation and its stages (`simulation/`), the exposure probes (`exposure/`).
- Not here: text shown to the player (`src/copy/`), level content (`src/levels/`), anything that draws, stores or reads the clock.
- May import: nothing from other layers. No React, three, `@react-three/*`, `@mantine/*`, browser storage, `Date.now()` or `Math.random()`.
- Other layers import `@/engine`. Files inside import each other directly (`./x`, or `@/engine/<folder>/x` across folders).
