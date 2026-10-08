---
paths:
  - "src/**/*.tsx"
---
# Caller controls visibility

A presentational component never decides on its own whether it renders at all based on how empty or trivial its own data is (`if (tools.length === 0) return null;` inside the component body). That decision belongs to whoever is placing the component, not the component itself.

**Why:** a component that silently no-ops on certain inputs surprises whoever composes it — the parent's own layout/spacing assumptions break invisibly, and the condition for "nothing renders here" ends up buried inside a child instead of being visible where the composition decision is actually made.

**How to apply:** if a component's own logic includes an early `return null` (or equivalent) gated on its own props being empty/trivial, move that check to the call site instead — the caller reads the same prop and conditionally renders the component (`{level.tools.length > 0 && <ToolsPanel ... />}`), or renders an alternative (an empty state) in its place. The component itself always renders its content unconditionally once mounted.
