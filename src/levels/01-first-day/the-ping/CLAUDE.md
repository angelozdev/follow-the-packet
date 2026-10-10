# levels/01-first-day/the-ping

Block 2 of chapter 1, «El ping»: the incidents that teach what a ping is, what it takes to answer it, and the two ways it can fail to come back. All three are `send` incidents with one ping message (`MESSAGE.ping`, `command: 'ping'`) sent from your laptop, and all three draw the whole world (no `shown` list).

- `03-are-you-there.ts`: a ping to the printer, with the box showing the Echo Request and the Echo Reply with their headers. It introduces `protocol`, `icmp`, `ping`, `echo-request` and `echo-reply`. The final question asks for the origin and the destination of the Echo Reply (the right answer is the swapped pair); a ping to `laptop-lucia` comes back and does not complete the task.
- `04-ping-yourself.ts`: pings to `localhost`, `127.0.0.1` and the printer, to compare the round trip time in the box. It introduces `loopback`, `localhost` and `rtt`. Both tasks (`127.0.0.1` and the printer) must come back.
- `05-when-it-does-not-come-back.ts`: `HIDDEN_FIREWALL` gives `laptop-marta` a host firewall with nothing allowed in. Its term arrives in 01-11, so no piece, stamp or text names it: the ping to `laptop-marta` ends in silence (`timeout`) and no text says why, and the ping to `192.168.1.50` ends in a warning (`host-unreachable`) that your own laptop generates (it looked for who had the IP and nobody answered). It introduces `timeout` and `host-unreachable`. No text says the silence means a switched-off device, except the wrong option that the feedback refutes.
- The right explanation is in a different place from the incident before (01 had it second, 02 third; 03 first, 04 third, 05 second).
- `solicitud` and `respuesta` are not terms (decision D-7): the definitions of the ping and its messages do not use them as terms, and no text tags them.
- Not here: the chapter's world, chips and the hidden firewall (`../shared.ts`), the contract (`src/levels/contract/`), visible UI text and the reasons the box shows (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels/contract/incident` and `@/levels/01-first-day/shared`.
