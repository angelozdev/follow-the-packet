# Single responsibility

Every unit of code — function, module, utility — has exactly one responsibility.

If it does more than one thing (fetch + transform + present, validate + persist + notify), split it. A unit that orchestrates several single-responsibility pieces still follows this rule; one that mixes responsibilities inside a single function does not. This is how [[low-coupling-high-cohesion]] gets enforced concretely.
