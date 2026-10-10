# engine/network

The network model as zod schemas and types: an office or a VPC (`kind`), its range, its devices (laptop, printer, EC2 instance), its firewalls (host firewall or Security Group), its edge (router or Internet gateway) and the actors on the internet. Also CIDR math with the private ranges of RFC 1918, the loopback range of RFC 1122 and actions that change a network. EC2 DNS names and app targets live in `naming/`.

- `networkSchema` checks each kind: a VPC has a region, subnets, a Security Group on every device and an Internet gateway as its edge; an office has no region, no subnets and no public IPs, and its edge is a router. Both kinds use a private range (RFC 1918) and give each device its own private IP. A Security Group source (`sg`) only exists on a Security Group and points at one.
- An action changes a network: it adds or removes an inbound rule, sets an app target or the host's echo setting, adds an actor on the internet, or adds a firewall and puts it on its device.

- Not here: anything that moves a packet (`src/engine/simulation/`).
- May import: `zod` and other files of `src/engine/`.
