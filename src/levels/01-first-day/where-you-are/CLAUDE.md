# levels/01-first-day/where-you-are

Block 1 of chapter 1, «Dónde estás»: the incidents that show what a network is and what a packet carries, before anything is pinged.

- `01-the-office.ts` (`identify`): nothing travels. The player marks which laptop is not on the network (`laptop-visita` has no cable; its box keeps its IP and says it is not connected, because a network is its connected devices and not whoever has an IP; `laptop-lucia`, connected, has the same card as a counter-example) and picks the IP of the printer on its card; Lucía's note gives `192.168.1.300`, a chip that starts picked, and the rule of the note shows on «Listo» by the three paths of the printer's card. It introduces `network`, `device`, `ip-address` and `ipv4`.
- `02-the-envelope.ts` (`send`): `laptop-visita` is connected (`connectDevice`). The terminal sends a packet (`command: 'packet'`, no ping) from your laptop to the printer or to `laptop-marta`, and the box of the packet shows its header. It introduces `packet`, `header`, `source-ip` and `destination-ip`.
- Both draw the whole world (no `shown` list). The right explanation is not in the same place in the two.
- No text names `ping`, `ICMP`, `Echo Request` or any term of a later incident, tagged or not: `src/levels/ladder.test.ts` checks the plain words of these two incidents. The packet is called `paquete` in the stamp and in the box, because `src/copy/packet-labels.ts` names a packet by the term of its message only once the player knows it.
- Not here: the chapter's world and chips (`../shared.ts`), the contract (`src/levels/contract/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels/contract/incident` and `@/levels/01-first-day/shared`.
