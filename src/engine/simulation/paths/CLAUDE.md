# engine/simulation/paths

How a packet travels past its sender's LAN, and what is read from the path it took: the routers (`routers.ts`: `arriveAt`, `sendNotice` and `enterRouter` take a packet through the routers of an office, take 1 from the TTL, add `Trace.hops`, record the route each router picked in `Trace.routes`, warn and, when the next stop leaves the office by a public interface, ask `stages/nat.ts` to translate the source; for a TCP or UDP packet that a client actor sends to a public IP of the NAT router, `pass` does not answer for the router but takes 1 from the TTL and, once it has asked `stages/nat.ts` where the packet goes, writes `nat-forwarded` and goes on, or writes `nat-no-translation` and stops), `traceroute` (`traceroute.ts`: one Echo Request per TTL, built on `simulate`) and the checkpoints of a trace (`checkpoints.ts`: `stopStep` and `deathPoint`, where a packet stopped).

- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
- Not here: the pipeline, the context and the trace (`src/engine/simulation/`), the stages that call `routers.ts` (`src/engine/simulation/stages/`), the network model and the questions a router asks of it (`src/engine/network/`).
- May import: `@/engine/simulation/<file>`, `@/engine/simulation/stages/nat`, `@/engine/network/<file>` and other files of `src/engine/`.
