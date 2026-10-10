# engine/simulation/stages

One file per pipeline stage, in this order: `address`, `dns`, `route`, `firewall-out`, `forward`, `firewall-in`, `host`, `reply`. A stage reads and extends the simulation context and says whether the packet continues.

- `route` decides, before any firewall, where a packet from an office device goes (RFC 1122, §3.3.1.1): to the device itself (loopback, its own IP), straight into its own LAN, or to its default gateway when the destination is in another LAN of the office. A device with no cable, or with no gateway for a destination outside its LAN, ends as `no-route` with no warning. In a VPC, and for an actor, `route` also settles the destination, as before.
- `forward` delivers what `route` handed over (`ctx.delivery`), after the sender's outbound firewall. It finds a connected owner of the IP in the sender's LAN. Nobody owns it: the sender's own device warns (`unreachable`, a `host-unreachable` notice from the sender), unless an outbound firewall silenced the packet first. The gateway is a router: the packet goes on to the LAN of the destination if that router has an interface there. The gateway is any other device: it drops the packet in silence (`timeout`). A packet `route` already settled passes through, and `forward` writes a step only when it stops the packet.
- A router that must answer a ping to its own interface, or forward beyond the LANs it faces, is not modelled yet: that packet ends as `lost`.

- A new network mechanic (for example NACL) adds a stage here and registers it in the pipeline of `src/engine/simulation/simulate.ts`.
- May import: other files of `src/engine/`.
