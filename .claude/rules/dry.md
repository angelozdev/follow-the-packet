# DRY — Don't Repeat Yourself

Don't duplicate logic, types, or structure. If the same piece of logic or the same block shows up twice with minor variations, extract it into a shared unit or module instead of copy-pasting and tweaking.

Don't confuse this with premature abstraction: three similar lines in two places don't warrant an abstraction yet — DRY applies when the duplication is real (same concept, not superficial coincidence) and would drift/break if edited in only one place. See [[kiss]] for the opposite balance.

Enforcement: jscpd with threshold 0 in pnpm check (pnpm dup).
