# Sigue el paquete: pendientes tras la revisión

> **Estado (plan 1, `docs/plans/2026-10-08-follow-the-packet-clean-base.md`):** hechos A3, A4, A11, A12, B1-B3, B5-B6 y C1-C9. B4 y B7 pasan al plan 2 (el panel de getent ya no existe; la revisión del texto se hace con los textos nuevos). El destino del resto está en la tabla "Relación con el backlog" del spec de incidentes en vivo.

> **Estado (plan 2, `docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md`):** hechos A6 (escena centrada, etiquetas sin superponerse al empezar el 04-01, con prueba de Playwright), A8 (desbloqueo en orden), A13 (foco de la tarjeta de tarea), B4 (la inspección llega calculada desde `game`) y B7 (textos de los motivos en lenguaje sencillo). A5 lo reemplaza el tráfico vivo. Siguen pendientes A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.

> **Estado (plan 3, `docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md`):** hechos E2 (nombres oficiales de AWS, definición al pasar el mouse, glosario y la regla `rigorous-plain-copy`) y E3 («Enviar solución», sin la barra de 3 s). Siguen pendientes E4 a E10, A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.

> **Estado (capítulo 1, plan 2, `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`):** hechos F1, F2, F3 y E6 (el «!» vive dentro de la etiqueta). E7 queda decidido por la ficha de Actor: un personaje no lleva candado. E5 quedó resuelto con los sellos cercanos (Tarea 10 y arreglo final). Siguen pendientes E4, E8 y E9, F4 a F6 (plan 3), el bloque G, A1, A2 y el bloque D.

> **Estado (capítulo 1, plan 3, `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`):** hechos F4 (los textos de la respuesta y de `route-private` según el tipo de red y de firewall), F5, F6, G3, G4, G5, G7 y G8. E4 sigue pendiente para la tarjeta de tarea del 04-01. La tarjeta terminal ya no lo sufre en el 01-01: se abre en el lado libre (`terminalSide` en `src/scene/layout.ts`) y no tapa la impresora. En el 01-03, con el exterior dibujado, ningún lado queda libre: la terminal se acopla en la esquina inferior izquierda del mapa (la revisión final del plan 3 lo arregló). A 1440×900 o más no tapa etiquetas ni sellos. A 1280×800 y 1366×768 la de Casa de Lucía, que es más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo». G6 también está hecho (`6e5630d`, Tarea 11 del plan 2). Siguen pendientes E4, E8, E9, G1, G2, G9, A1, A2, H1 a H3 y el bloque D.

Las ideas y el rumbo del juego van en la [hoja de ruta](follow-the-packet-roadmap.md).

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
- **B7 `plain-language-copy`.** Revisar los textos de `src/copy/` con la lista: una idea por mensaje, términos definidos, frases cortas (la regla se reemplazó por `rigorous-plain-copy` en el plan 3).

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

## Bloque E: primera prueba humana del prototipo (2026-10-08)

| # | Feedback o hallazgo | Destino |
|---|---------------------|---------|
| E1 | El cuadro de inspección salía cortado al final del panel | Hecho en `53c0489`: flota en la esquina inferior derecha del mapa |
| E2 | «Puerta debe llamarse explícitamente Security Group y al hacerle hover sí se muestre una descripción de lo que es» | Hecho en el plan 3 |
| E3 | «Prefiero un button que me diga: Enviar solución», para seguir probando si quedó algo abierto | Hecho en el plan 3 |
| E4 | La tarjeta de tarea tapa la otra instancia: en servidor2 tapa servidor1 y el camino; en servidor1 tapa servidor2 y sus sellos | Pendiente para la tarjeta de tarea del 04-01 (revisión del plan 2). La terminal del capítulo 1 ya no lo sufre: se abre en el lado libre y, en el 01-03, se acopla en la esquina inferior izquierda (`terminalSide` y `dockOffset` en `src/scene/layout.ts`) |
| E5 | Con el ping resuelto, los sellos ✓ y ✕ junto al Security Group de servidor2 se tocan unos 8×18 px; la prueba de superposición solo mira el inicio del 04-01 | Hecho en el capítulo 1, plan 2 (`f1aeecf`, `f2fee1e`): los sellos cercanos se separan según su lugar en la pantalla |
| E6 | En «Sin animaciones», el «!» de intrusión tapa la etiqueta de servidor2 | Hecho en el capítulo 1, plan 2 (Tarea 6): el «!» va dentro de la etiqueta |
| E7 | El atacante se dibuja sin candado; el spec dice que una pieza fija lleva candado | Decidido en el capítulo 1, plan 2: la ficha de Actor no lleva candado (es un personaje) |
| E8 | Pantallas bajas en horizontal: el cuadro de inspección se corta; a 390 px la tarjeta queda fuera de pantalla y a 320 px «Roadmap» pisa una etiqueta | Pendiente |
| E9 | Menores de la revisión: las estrellas se guardan solo al pulsar «Ver resultado»; tras el cierre los Security Groups parecen editables pero no responden; Esc solo cierra la tarjeta con el foco dentro; el bermellón tiene contraste de unos 3.5:1 | Pendiente |
| E10 | `projects/follow-the-packet/` tiene `pnpm-lock.yaml` y `pnpm-workspace.yaml` sin seguimiento; el proyecto usa npm | Hecho (2026-10-09): el proyecto usa solo pnpm 11.3.0; se borraron `package-lock.json` y `.npmrc`, y `saveExact` pasó a `pnpm-workspace.yaml` porque pnpm 11 no lo lee de `.npmrc`. |

## Bloque F: lo que dejó el modelo genérico (capítulo 1, plan 1, 2026-10-09)

Todo es inalcanzable desde el juego de hoy. Lo encontraron las revisiones del plan `docs/plans/2026-10-09-follow-the-packet-generic-model.md` (commits `8f916a9..1a84c42`). El detalle completo está en `.superpowers/sdd/2026-10-09-follow-the-packet-generic-model/progress.md`, que git ignora.

| # | Hallazgo | Destino |
|---|----------|---------|
| F1 | Los dispositivos de una red `office` no tienen posición en el mapa (`scene/layout.ts`): etiquetas, tarjetas y `Building` fallarían al dibujar una oficina | Hecho en el plan 2 (Tarea 5) |
| F2 | `edge` (`router` o `internet-gateway`) no se usa ni se valida contra el `kind` de la red; la etapa `route` escribe `igw` aunque la red sea una oficina | Hecho en el plan 2 (Tareas 1 y 5) |
| F3 | Faltan tests de escena para el ping a la propia IP y para la IP que nadie tiene | Hecho en el plan 2 (Tarea 5) |
| F4 | Los textos de la respuesta y de `route-private` todavía nombran el Security Group y la VPC, también en una oficina | Hecho en el capítulo 1, plan 3 (Tarea 9): la red de la oficina y el firewall de la laptop tienen sus textos. Los textos nuevos de `route-private` y de la respuesta aún no se dibujan: la caja de inspección muestra solo el paso en que el paquete se detuvo (`stopStep`) |
| F5 | El esquema acepta dos dispositivos con la misma IP privada | Hecho en el capítulo 1, plan 3 (Tarea 1) |
| F6 | Una VPC con rango no privado (por ejemplo `100.64.0.0/16`) deja que un actor de internet llegue a una IP privada; antes del plan 1 se bloqueaba. El spec dice que en el juego toda VPC usa rangos de RFC 1918 | Hecho en el capítulo 1, plan 3 (Tarea 1): el esquema exige un rango de RFC 1918 en toda red |

## Bloque G: lo que dejó el catálogo de entidades (capítulo 1, plan 2, 2026-10-09)

Lo encontraron las revisiones del plan `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md` (commits `91f30b1..f2fee1e`). Ninguno rompe el capítulo 4 de hoy. El detalle está en `.superpowers/sdd/2026-10-09-follow-the-packet-entity-catalog/progress.md`, que git ignora.

| # | Hallazgo | Destino |
|---|----------|---------|
| G1 | La captura de `#/entidades` tolera un 1 % de píxeles distintos (unos 24 000): si volviera el candado dorado o faltara la alfombra del firewall seleccionado, la prueba pasaría (`tests/e2e/entities.spec.ts:26`) | Design system (hoja de ruta): bajar la tolerancia o sumar comprobaciones de la página |
| G2 | La lógica de cada cuadro de `PacketRun` no tiene test unitario (`src/scene/entities/packet.tsx:56`): si el arreglo del paquete perdido se rompiera, solo se vería en el mapa animado | Pendiente |
| G3 | Todo `timeout` que no es «perdido» se dibuja como un bloqueo de firewall, con ✕ y estallido (`src/scene/traffic/flow-look.ts`): un `timeout` de ruta o de DNS parecería un firewall que dice no | Hecho en el capítulo 1, plan 3 (Tarea 5): solo un firewall bloquea; lo demás se dibuja como perdido |
| G4 | En una oficina sin nadie afuera, un paquete a una IP pública suma el punto del borde, que no se dibuja: el paquete viajaría a un lugar invisible (`src/scene/layout.ts`, `pathFor`) | Hecho en el capítulo 1, plan 3 (Tarea 5) |
| G5 | `spreadStamps` no tiene test del encadenamiento (A cerca de B, B cerca de C, A lejos de C) y no compara grupos entre sí: `[[0,0],[0,0],[1,0]]` deja dos sellos a 0.72, bajo el mínimo de 0.8 (`src/scene/layout.ts`) | Hecho en el capítulo 1, plan 3 (Tarea 5): dos grupos que se acercan se unen |
| G6 | La etiqueta del actor tapa la mitad de abajo de su cubo (`LABEL_OFFSET.actor` en `src/scene/layout.ts`) | Hecho en el capítulo 1, plan 2 (Tarea 11, `6e5630d`) |
| G7 | `inspect()` devuelve la inspección del borde y de internet aunque nadie esté afuera y esas piezas no se dibujen (`src/game/view/inspection.ts:131-132`); hoy la interfaz no llega ahí | Hecho en el capítulo 1, plan 3 (Tarea 6) |
| G8 | El lector de pantalla no dice el estado del sello: ✓, ✕ y ? suenan igual (`src/scene/entities/stamp.tsx`). Viene de antes del plan 2 | Hecho en el capítulo 1, plan 3 (Tarea 5): el sello dice su paquete y cómo terminó |
| G9 | La prueba animada del catálogo espera 7 s calculados a mano (`WATCH_MS` en `tests/e2e/entities.spec.ts:7`): si el horario crece, deja de cubrir el último paquete sin avisar | Pendiente: calcularlo desde el horario |

## Bloque H: lo que dejó el capítulo 1 jugable (capítulo 1, plan 3, 2026-10-09)

Lo encontró la revisión final del plan `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md` (revisión final del plan 3, 2026-10-09). Ninguno impide jugar el capítulo 1.

| # | Hallazgo | Destino |
|---|----------|---------|
| H1 | Al explorar las 12 combinaciones del 01-03, seis sellos «perdido» se apilan sobre las etiquetas de «Casa de Lucía» y del router | Pendiente |
| H2 | La terminal no da retroalimentación al lector de pantalla después de «Enviar»: falta una línea `aria-live` que diga cómo terminó el paquete | Pendiente |
| H3 | El texto de ayuda de la inspección y la leyenda de los sellos y el candado se leen como un solo bloque gris, y la leyenda omite el sello del intruso (doble anillo ✓) que se ve en el 04-01 | Pendiente |

## Fuera de este backlog (decide el estudiante)

- `git push` de `main` (2 commits: `55dadac`, `6daf19a`) y de la rama.
- Commit de `projects/follow-the-packet/.claude/`.
- Commit de las 4 reglas nuevas en `~/dotfiles` (`claude/.claude/skills/az-rules/rules/`).

## Listo

- `npm run check` pasa entero, incluidos los controles del bloque C.
- Cada error del bloque A tiene un test que fallaba antes del arreglo.
- Revisión final de Codex sin hallazgos altos ni medios, cada uno verificado antes de aplicarlo.
