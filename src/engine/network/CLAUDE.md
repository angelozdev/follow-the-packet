# engine/network

The network model as zod schemas and types: an office or a VPC (`kind`), its range, its devices (laptop, printer, EC2 instance), its firewalls (host firewall or Security Group), its edge (router or Internet gateway) and the actors on the internet. Also CIDR math with the private ranges of RFC 1918, EC2 DNS names, actions that change a network, and app targets.

- `networkSchema` checks each kind: a VPC has a region, subnets, a Security Group on every device and an Internet gateway as its edge; an office has no region, no subnets and no public IPs, its range is private and its edge is a router. A Security Group source (`sg`) only exists on a Security Group and points at one.

- Not here: anything that moves a packet (`src/engine/simulation/`).
- May import: `zod` and other files of `src/engine/`.
