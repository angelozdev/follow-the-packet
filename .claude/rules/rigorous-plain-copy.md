# Rigorous plain copy

Every AWS service, resource or setting the player reads is called by its official AWS name, exactly as the AWS console shows it in English, and every term is defined where it appears. What stays plain is the sentence around the name.

**Why:** the reader is a student who wants a cloud job, has no networking background and reads Spanish. A friendly stand-in ("puerta" for Security Group) is easier on day one, but it teaches a word that no console, document or interviewer uses. After the first playtest the student asked for the real name, with its definition on hover.

**How to apply:**

- Use the official AWS name, as the English console shows it: `Security Group`, `Internet gateway`, `Anywhere-IPv4`, `Echo Request`, `All ICMP - IPv4`. Never an invented synonym, and never a descriptive phrase in place of the name. Spanish goes around the name: "el Security Group de servidor2".
- Where the design spec's name table says so (`docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`, the table with the columns "Antes (plan 2)" and "Nombre oficial"), a Spanish generic noun is the registry name on purpose: `instancia EC2` and `regla de entrada`. They are not unofficial synonyms to "correct" to "EC2 instance" or "Inbound rule". Their definition then gives the console name or the service ("Inbound rule en la consola", "Amazon EC2").
- Define every term where it appears. Tag it in the text (`{{security-group}}`) so its definition shows on hover, and keep it in Lucía's glossary for keyboard and screen-reader users. A definition is rigorous and short, at most 120 characters, and uses no term the player has not met yet.
- Keep the surrounding copy plain: one idea per screen, panel or message, and short sentences. Cut side notes the player does not need for the next action.
- An analogy may come after the name, never in its place: "Security Group: un firewall virtual de la instancia", never "la puerta".
- Visible text lives in `src/copy/` or in the level files, as [[english-only]] says, so editing copy never means editing logic.

Enforcement:
- `unofficialNames` (`src/copy/term-text.ts`) rejects a piece or a chip that shows a term with words other than its official name or short form, in `src/levels/ladder.test.ts` (chips) and `src/game/view/ladder.test.ts` (pieces).
- `src/game/view/ladder.test.ts` also rejects the plain names the first playtest retired.
- `src/copy/terms.test.ts` checks that every term has a definition of at most 120 characters.
- `src/levels/ladder.test.ts` rejects a definition that names a term the player does not know yet.
