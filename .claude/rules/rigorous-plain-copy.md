# Rigorous plain copy

Every AWS service, resource or setting the player reads is called by its official AWS name, exactly as the AWS console shows it in English, and every term is defined where it appears. What stays plain is the sentence around the name.

**Why:** the reader is a student who wants a cloud job, has no networking background and reads Spanish. A friendly stand-in ("puerta" for Security Group) is easier on day one, but it teaches a word that no console, document or interviewer uses. After the first playtest the student asked for the real name, with its definition on hover.

**How to apply:**

- Use the official AWS name, as the English console shows it: `Security Group`, `Internet gateway`, `Anywhere-IPv4`, `Echo Request`, `All ICMP - IPv4`. Never an invented synonym, and never a descriptive phrase in place of the name. Spanish goes around the name: "el Security Group de servidor2".
- Define every term where it appears. Tag it in the text (`{{security-group}}`) so its definition shows on hover, and keep it in Lucía's glossary for keyboard and screen-reader users. A definition is rigorous and short, at most 120 characters, and uses no term the player has not met yet.
- Keep the surrounding copy plain: one idea per screen, panel or message, and short sentences. Cut side notes the player does not need for the next action.
- An analogy may come after the name, never in its place: "Security Group: un firewall virtual de la instancia", never "la puerta".
- Visible text lives in `src/copy/` or in the level files, as [[english-only]] says, so editing copy never means editing logic.
