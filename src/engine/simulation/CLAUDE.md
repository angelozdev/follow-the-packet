# engine/simulation

`simulate(network, packet)` and its trace: the stage pipeline, rule matching and where a packet stops.

- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved` and `lost`. A packet is lost when no device of the network has its IP, or when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP answers itself, past no firewall.
- Not here: the stages themselves (`stages/`), the network model (`src/engine/network/`).
- May import: other files of `src/engine/`.
