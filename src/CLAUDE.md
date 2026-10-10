# src

Entry point and layers. `main.tsx` mounts `app.tsx`, which routes between screens; `styles.css` holds the global styles.

- Layers, top to bottom: `ui` → `game` · `scene` · `storage` → `levels` → `copy` → `engine`. A layer imports only layers below it, never a peer, and only through their barrel (`@/engine`). The design system (`design/`) sits beside them: `ui` and `scene` import it, and it imports no layer; `styles.css` imports its stylesheets first.
- `testing/` is for tests only.
- New code goes to the layer that `.claude/rules/folder-structure.md` picks, never to this folder.
- May import: every layer's barrel.
