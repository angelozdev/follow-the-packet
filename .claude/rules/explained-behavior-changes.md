# Explained behavior changes

When an incident's network behaves differently from what the player already saw, the game says why. The cause is never implicit: the player never has to guess it. It comes at one of these moments:

- At the start: the report says what changed.
- As a configuration change someone made, told in the report (for example «Alguien cambió la configuración de router-proveedor»).
- When finding the cause is the incident's challenge (a hidden cause, like the firewall of 01-05 and 01-11 or the broken stretch of 01-10), at the latest in the feedback of the right explanation or in the takeaway.

The cause is named as what it is: a configuration, a failure, or a switched-off device. Never as if a device "got confused", "decided" or "forgot".

**Why:** in 01-09 the routers passed the packet back and forth and no text said what had changed. The student wrote on 2026-10-10: "I found it very magical that in some scenarios it works and in others there is a kind of loop." A network that behaves differently for no stated reason teaches that networks are unpredictable, and the course teaches the opposite: every behavior has a cause someone can name.

**How to apply:**

- Before writing an incident that changes the world, list which devices and routers change and how (a rule added or removed, a gateway, a cable, a route, a router that stops warning, a firewall added). Each one is named in the report, in the feedback of the right explanation or in the takeaway, with the change in plain words: «router-proveedor ahora devuelve todo lo que recibe».
- Use the name the texts use for the device or router, from the chapter's registry (`DEVICE`, `ROUTER` in chapter 1's `shared.ts`; `S1`, `S2` in chapter 4's), never a literal. A sentence that says «tu laptop» does not name `tu-laptop`.
- A change that reaches every device of a floor (a LAN with two devices or more) may be told by naming the floor, from the registry (`FLOOR`): «Cada dispositivo del Piso 1 y del Piso 2 le manda a router-oficina lo que va a otra red local». A floor with one device is named by the device.
- A change the player makes with a move (a rule, a setting) needs no explanation: it is the player's own move.
- A piece an action only adds (a floor, a device, a router, a server) is shown on the map from then on, so it needs no name; the change it makes to the pieces that already existed does, except the new interface of a router that faces the added piece, which is only the wiring of that piece.
- A case of a diagnose is a world of its own: its report, or the feedback of its right cause, names what its own changes did.
- Use only terms the player already knows ([[rigorous-plain-copy]]). If the term has not arrived, say it in plain words. «Ruta» is chapter 2, so in chapter 1 the text says where the router sends what it receives, not its route.

Enforcement: `src/levels/explained-changes.test.ts` ("every change to the world of an incident is explained by naming the device or router it changes") compares the world before and after the changes of every incident and of every case of a diagnose, with `changedNames` in `src/levels/contract/changes.ts`, and asks that the report, the feedback of the right explanation or the takeaway (for a case, its report or the feedback of its right cause) name each device or router whose configuration differs. It reads the difference between worlds, so every kind of action is covered, a piece an action only adds is exempt, and the name of a floor on which every device changed (`changedFloors`) stands for its devices. It looks at the servers of the internet too (any field of one that differs must be named) and does not count the wiring of a new piece (a router interface that faces a piece the changes add), though any other change to that router still counts. A gap not yet fixed may only be listed in `UNEXPLAINED_CHANGES_PENDING` in that file, which the test asserts is exactly the set of gaps. The test cannot check that the text says the change in plain words, that it comes soon enough, or that it uses no term the player does not know yet (the last is `src/levels/ladder.test.ts`); those are review.
