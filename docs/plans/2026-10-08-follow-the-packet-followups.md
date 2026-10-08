# Sigue el paquete: pendientes tras la revisión

Backlog, no plan. La próxima sesión lo convierte en plan en plan mode (Opus diseña; subagentes Sonnet implementan; revisión final con Codex `gpt-6.1-sol` `high`).

- **Rama base:** `feat/follow-the-packet` (13 commits, `5aff501…712c076`, sin push).
- **Spec:** `docs/specs/2026-10-07-follow-the-packet-design.md`. **Plan original:** `docs/plans/2026-10-07-follow-the-packet.md`.
- **Reglas del proyecto:** `projects/follow-the-packet/.claude/rules/` (19) y `.claude/az-rules.json`. Sin commit todavía.
- **Estado verificado (2026-10-07):** `npm run check` pasa entero (134 unitarios en 20 archivos, 3 e2e de Playwright en el puerto 4183).
- Rutas relativas a `projects/follow-the-packet/` salvo que empiecen por la raíz del repo.

## Orden sugerido

1. **Bloque A, errores:** el juego hoy enseña algo falso (toda la VPC da 3 estrellas). Cada arreglo entra con el test que lo reproduce; esos tests protegen el refactor de después.
2. **Bloque B, refactor a las reglas:** primero `folder-structure` (mueve casi todo), luego el resto.
3. **Bloque C, controles:** cada control entra justo después del refactor que lo hace pasar, nunca antes.
4. **Bloque D, decisiones pendientes:** reglas sin decidir.

## Bloque A: errores

### Revisión de Codex (veredicto "request changes"; los 5 reproducidos, ningún falso positivo)

Salida completa: `codex-review.txt` en el scratchpad de la sesión `0022eab1` (temporal; lo esencial está aquí).

| # | Gravedad | Problema | Dónde | Arreglo propuesto |
|---|----------|----------|-------|-------------------|
| A1 | Alta | Echo Request desde toda la VPC (`172.31.0.0/16`) da 3 estrellas en 04-02 y 04-06 ("Sin abrir de más"). Las sondas solo cubren instancias que existen; ninguna delata el rango ancho. | `src/engine/exposure.ts:25`, niveles `02-open-just-enough.ts` y `06-doorman-or-owner.ts` | Agregar a esos niveles una instancia privada ajena, en otro SG, e incluirla en las sondas. |
| A2 | Media | tcpdump no registra nada en la instancia que envía: ni el request que sale ni el reply que vuelve. | `src/engine/stages/linux.ts:7`, `src/engine/stages/reply.ts:7` | Registrar en el origen el request saliente y el reply o RST entrante, con las direcciones que ve cada máquina. |
| A3 | Media | `extraOpenings` usa la misma clave para el camino privado y el público (IP pública vía NAT del IGW): una apertura extra pasa como `[]`. | `src/engine/exposure.ts:46` | Incluir en la clave la dirección de destino resuelta y el origen efectivo; un nombre DNS sigue valiendo lo mismo que la IP a la que resuelve. |
| A4 | Media | Con el almacenamiento bloqueado, `saveStars` relee el almacenamiento vacío y pisa el progreso en memoria; además baja el récord al rejugar. | `src/storage/progress.ts:39`, `src/App.tsx:46` | Fusionar cada resultado con el progreso en memoria (máximo de estrellas por nivel) y persistir lo fusionado cuando se pueda. |
| A5 | Baja | Marcar "Sin animaciones" no detiene un `PacketRun` en curso: `reducedMotion` solo inicializa `arrived`. | `src/scene/PacketRun.tsx:18` | Al pasar a `true`, colocar el paquete en su destino y marcarlo como llegado. |

### Pendientes del orquestador

| # | Problema |
|---|----------|
| A6 | Escena descentrada y etiquetas del mapa encimadas. |
| A7 | 04-07 (atacante) se gana adivinando dentro de los 2 intentos. |
| A8 | Los niveles bloqueados se abren escribiendo su URL. |
| A9 | Tras reintentar, tcpdump muestra el intento anterior. |
| A10 | El botón de pista sigue visible después de ganar. |
| A11 | `parseCidr` acepta `10.0.0.0/` como `/0` (error que venía del plan). |
| A12 | Un solo dato malo en el progreso guardado borra todo el progreso. |
| A13 | El foco del teclado se pierde al cambiar de fase. |
| A14 | Faltan estilos para `.radio`, `.check`, `.rule-form`, `.tool-block`, `.details` y `.result`. |

## Bloque B: refactor a las reglas

Cada punto cita la regla de `.claude/rules/` que lo exige. Lo que hoy no cumple se comprobó con grep el 2026-10-08.

- **B1 `folder-structure` (primero).** Capas `engine`, `levels`, `copy`, `game`, `storage`, `scene`, `ui`, `testing`. Dirección de imports: `app → ui → game · scene · storage → levels → copy → engine`, sin imports entre pares.
  - Alias `@/` → `src/` en `tsconfig.json`, `vite.config.ts` y Vitest; eliminar todos los `../`.
  - Un barrel `index.ts` por capa, solo con re-exports nombrados.
  - Tope de 12 archivos por carpeta (tests y barrel incluidos). `src/engine/` tiene hoy 19 archivos más `stages/`: partirlo en subconceptos (p. ej. `network/`, `rules/`, `simulation/`, `scoring/`).
  - Crear `src/testing/` y mover allí `src/test-utils/` y `src/engine/fixtures.ts`.
  - Ubicar `src/format.ts` con la regla de ubicación de la regla.
  - Un `CLAUDE.md` corto en inglés por carpeta.
- **B2 `kebab-case-filenames`.** Renombrar los `.tsx` en PascalCase (`App.tsx`, `GameScene.tsx`, `PacketRun.tsx`, todo `src/ui/**`), `htmlLayer.ts` y `usePrefersReducedMotion.ts`.
- **B3 `pure-domain-core` + `english-only`.** 13 archivos de `src/engine/` tienen texto en español. El motor devuelve códigos de motivo; el texto visible vive en `src/copy/`.
- **B4 `view-renders-domain-result`.** La herramienta getent de `src/ui/shared/ToolsPanel.tsx:78` llama directo a `resolveName` del motor. La respuesta debe llegar ya calculada desde fuera de la vista.
- **B5 `prefer-established-libraries` + `no-raw-effects`.**
  - Reemplazar `usePrefersReducedMotion` por `useReducedMotion` de `@mantine/hooks` 9.7.1. Verificar antes con `npm view @mantine/hooks version time.modified peerDependencies`.
  - Llevar los `useEffect` de `src/App.tsx` y `src/ui/shared/LevelScreen.tsx` a hooks en archivos `use-*.ts`.
- **B6 `exact-dependency-versions`.** Quitar los `^` de `package.json`. `typescript` queda en una versión exacta 6.0.x, porque typescript-eslint 8.71 solo acepta TypeScript menor que 6.1.
- **B7 `plain-language-copy`.** Revisar los textos de `src/copy/` con la lista: una idea por mensaje, términos definidos, frases cortas.

## Bloque C: controles aceptados (sin implementar)

| # | Control | Hace cumplir | Va después de |
|---|---------|--------------|---------------|
| C1 | jscpd en `npm run check` | `dry` | — |
| C2 | `.npmrc` con `save-exact=true` | `exact-dependency-versions` | B6 |
| C3 | Plugin de ESLint para nombres de archivos y carpetas en kebab-case | `kebab-case-filenames` | B2 |
| C4 | Lint que rechaza comentarios que no sean JSDoc ni directivas (`// @vitest-environment jsdom` permitido) | `no-comments` | — |
| C5 | Prohibir `fireEvent` en tests (hoy no hay ninguno) | `user-event-for-interactions` | — |
| C6 | `eslint-plugin-boundaries` con la tabla de capas, más un script que revisa el tope de 12 archivos y el `CLAUDE.md` de cada carpeta | `folder-structure` | B1 |
| C7 | Prohibir `useEffect` fuera de `use-*.ts` | `no-raw-effects` | B5 |
| C8 | Imports y sintaxis restringidos en el motor: sin react, three ni `@react-three/*`, sin `Date.now()` ni `Math.random()` | `pure-domain-core` | B3 |
| C9 | Imports restringidos en `scene/` y `ui/`: solo tipos y resultados del motor | `view-renders-domain-result` | B4 |

## Bloque D: decisiones pendientes

- Reglas del almacén aún sin decidir: `prefer-radix`, `design-tokens`, `primitive-semantic-tokens`.

## Fuera de este backlog (decide el estudiante)

- `git push` de `main` (2 commits: `55dadac`, `6daf19a`) y de la rama.
- Commit de `projects/follow-the-packet/.claude/`.
- Commit de las 4 reglas nuevas en `~/dotfiles` (`claude/.claude/skills/az-rules/rules/`).

## Listo

- `npm run check` pasa entero, incluidos los controles del bloque C.
- Cada error del bloque A tiene un test que fallaba antes del arreglo.
- Revisión final de Codex sin hallazgos altos ni medios, cada uno verificado antes de aplicarlo.
