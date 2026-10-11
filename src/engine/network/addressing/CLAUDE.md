# engine/network/addressing

The questions the engine asks of a network model, answered without moving a packet: CIDR math (`cidr.ts`: parse a range, whether an IP is inside it, the private ranges of RFC 1918 and the loopback range of RFC 1122), the topology of an office (`topology.ts`: its LANs, the LAN of a device, whether a device has its cable and whether an actor is a client of the internet) and what a router asks of its interfaces and routes (`routing.ts`).

- `routing.ts` answers the questions a router asks about the model: the `interfaceTowards` a LAN, router or server, whether it `ownsIp`, whether it `facesALan` (an office router) or belongs to the road to the internet, the `bestRoute` (longest range first, `default` last) and `onwardFrom`, where it sends a packet next. The link between a router and a server is the /24 of the router's interface, because an interface has no mask; a private IP at a router that faces no LAN and has it nowhere connected is `private` (RFC 1918, §3).
- Not here: the schemas, types and actions of the network (`src/engine/network/`), anything that moves a packet or writes a step (`src/engine/simulation/`).
- May import: `@/engine/network/schema`, `@/engine/network/types` and other files of `src/engine/`.
