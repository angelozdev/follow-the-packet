# engine

The pure domain core: the network model (an office or an AWS VPC) and the packet simulation. The same input always gives the same output.

- Belongs here: network model (`network/`, with its CIDR math, topology and routing questions in `network/addressing/`), simulation and its stages (`simulation/`, with the routers, traceroute and checkpoints in `simulation/paths/`), the exposure probes (`exposure/`).
- Not here: text shown to the player (`src/copy/`), level content (`src/levels/`), anything that draws, stores or reads the clock.
- May import: nothing from other layers. No React, three, `@react-three/*`, `@mantine/*`, browser storage, `Date.now()` or `Math.random()`.
- Other layers import `@/engine`. Files inside import each other directly (`./x`, or `@/engine/<folder>/x` across folders).
- What differs from one packet to the next (the TTL, the source port) enters as a field of the `PacketSpec`, with a named default; the engine never picks it from a clock or at random.
- What one packet leaves for the next (the ephemeral source port of each sender now; later the NAT table and the cache of the resolver) enters as an explicit value that `simulateSequence(net, sends)` threads from one send to the next, inside the call. `simulate(net, packet)` stays the stateless function and knows nothing of the sends before it. No module keeps state between calls, and the game clock reaches the engine only as the `at` of a send.
