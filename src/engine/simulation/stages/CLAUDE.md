# engine/simulation/stages

One file per pipeline stage: `address`, `dns`, `route`, `firewall-out`, `firewall-in`, `host`, `reply`. A stage reads and extends the simulation context and says whether the packet continues.

- A new network mechanic (for example NACL) adds a stage here and registers it in the pipeline of `src/engine/simulation/simulate.ts`.
- May import: other files of `src/engine/`.
