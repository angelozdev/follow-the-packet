# engine

The pure domain core: the network model (an office or an AWS VPC) and the packet simulation. The same input always gives the same output.

- Belongs here: network model (`network/`, with its CIDR math, topology and routing questions in `network/addressing/`), the NAT of the office and its translation table (`nat/`), the names, the zones and records of the DNS servers and what a resolver answers (`dns/`), what a web service answers to an HTTP request (`web/`), simulation and its stages (`simulation/`, with the routers, traceroute and checkpoints in `simulation/paths/`), the exposure probes (`exposure/`).
- Not here: text shown to the player (`src/copy/`), level content (`src/levels/`), anything that draws, stores or reads the clock.
- May import: nothing from other layers. No React, `@mantine/*`, browser storage, `Date.now()` or `Math.random()`.
- Other layers import `@/engine`. Files inside import each other directly (`./x`, or `@/engine/<folder>/x` across folders).
- What differs from one packet to the next (the TTL, the source port) enters as a field of the `PacketSpec`, with a named default; the engine never picks it from a clock or at random.
- What one packet leaves for the next (the ephemeral source port of each sender, the rows of the NAT table, what the resolvers cached, with the TTL of each answer: `src/engine/dns/CLAUDE.md`, and the orders of each app: `src/engine/web/CLAUDE.md`) enters as an explicit value that `simulateSequence(net, sends)` threads from one send to the next, inside the call. `simulate(net, packet)` stays the stateless function and knows nothing of the sends before it. No module keeps state between calls, and the game clock reaches the engine only as the `at` of a send.
