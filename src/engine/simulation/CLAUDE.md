# engine/simulation

`simulate(network, packet)` and its trace: the stage pipeline, rule matching and where a packet stops.

- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved` and `lost`. A packet is lost when no device of the network has its IP, or when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP answers itself, past no firewall.
- A step's `at` names where it happened: a device id, the network (`office` or `vpc`), its edge (`router` or `internet-gateway`) or `internet`.
- `firewall-check.ts` filters a packet through a device's firewalls for both firewall stages and names their kind in the step. A device without firewalls is not filtered and gets no step.
- Not here: the stages themselves (`stages/`), the network model (`src/engine/network/`).
- May import: other files of `src/engine/`.
