# engine/simulation

`simulate(network, packet)` and its trace: the stage pipeline, rule matching and where a packet stops.

- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved`, `invalid-address`, `no-route`, `unreachable` and `lost`. In a VPC a packet is lost when no instance has its IP; anywhere it is lost when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP, or to any `127.x.x.x` loopback address (RFC 1122, §3.2.1.3), answers itself, past no firewall.
- The `address` stage runs first. Four numbers that are not an IPv4 address (one above 255) end as `invalid-address` before any lookup; `192.168.1`, with the wrong number of groups, is a name and goes on to `dns`. The name `localhost` becomes `127.0.0.1` with no lookup (RFC 6761, §6.3). A valid address or a name writes no step there, so a trace that does not use them is the same as before.
- In an office, a device that cannot send ends as `no-route` with no warning: it has no cable (`route-not-connected`) or no default gateway for an IP outside its LAN (`route-no-gateway`). An IP that nobody connected has in the sender's LAN, or a gateway that nobody has, ends as `unreachable`: the sender's own device warns, and `Trace.notice` says `host-unreachable` from the sender (`forward-no-owner`). A gateway that is not a router drops the packet in silence, so it ends as `timeout` (`route-gateway-not-a-router`). The sender's outbound firewall comes first: it silences a packet to an IP nobody has, and then no warning comes back.
- `Trace.notice` is optional: it is absent, not `null`, in every trace without a warning, and so are the traces of a VPC. A stage that has nothing to say writes no step.
- A step's `at` names where it happened: a device id, the network (`office` or `vpc`), its edge (`router` or `internet-gateway`) or `internet`. A step of `forward` stops at the sender or at the device that dropped the packet.
- `firewall-check.ts` filters a packet through a device's firewalls for both firewall stages and names their kind in the step. A device without firewalls is not filtered and gets no step.
- Not here: the stages themselves (`stages/`), the network model (`src/engine/network/`).
- May import: other files of `src/engine/`.
