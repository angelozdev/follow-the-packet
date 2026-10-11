# engine/network/naming

How a packet's destination is named: EC2 DNS names and their resolution (`dns.ts`: the private and public name of an address in a region, and the address a name stands for from inside or outside a VPC) and the app target placeholder a device resolves to its own destination (`app-target.ts`).

- Names outside a VPC are not here: a device of an office asks its resolver and the zones of the authoritative servers answer (`src/engine/dns/`). `resolveName` returns null for an office, which has no region.
- Not here: the network model, its CIDR math and its actions (`src/engine/network/`), the stage that drops an unresolved name (`src/engine/simulation/stages/`).
- May import: other files of `src/engine/` (`@/engine/network/<file>`).
