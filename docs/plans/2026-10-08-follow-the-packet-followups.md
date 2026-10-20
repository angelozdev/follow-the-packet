# Sigue el paquete: pendientes tras la revisión

> **Estado (plan 1, `docs/plans/2026-10-08-follow-the-packet-clean-base.md`):** hechos A3, A4, A11, A12, B1-B3, B5-B6 y C1-C9. B4 y B7 pasan al plan 2 (el panel de getent ya no existe; la revisión del texto se hace con los textos nuevos). El destino del resto está en la tabla "Relación con el backlog" del spec de incidentes en vivo.

> **Estado (plan 2, `docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md`):** hechos A6 (escena centrada, etiquetas sin superponerse al empezar el 04-01, con prueba de Playwright), A8 (desbloqueo en orden), A13 (foco de la tarjeta de tarea), B4 (la inspección llega calculada desde `game`) y B7 (textos de los motivos en lenguaje sencillo). A5 lo reemplaza el tráfico vivo. Siguen pendientes A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.

> **Estado (plan 3, `docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md`):** hechos E2 (nombres oficiales de AWS, definición al pasar el mouse, glosario y la regla `rigorous-plain-copy`) y E3 («Enviar solución», sin la barra de 3 s). Siguen pendientes E4 a E10, A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.

> **Estado (capítulo 1, plan 2, `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`):** hechos F1, F2, F3 y E6 (el «!» vive dentro de la etiqueta). E7 queda decidido por la ficha de Actor: un personaje no lleva candado. E5 quedó resuelto con los sellos cercanos (Tarea 10 y arreglo final). Siguen pendientes E4, E8 y E9, F4 a F6 (plan 3), el bloque G, A1, A2 y el bloque D.

> **Estado (capítulo 1, plan 3, `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`):** hechos F4 (los textos de la respuesta y de `route-private` según el tipo de red y de firewall), F5, F6, G3, G4, G5, G7 y G8. E4 sigue pendiente para la tarjeta de tarea del 04-01. La tarjeta terminal ya no lo sufre en el 01-01: se abre en el lado libre (`terminalSide` en `src/scene/layout.ts`) y no tapa la impresora. En el 01-03, con el exterior dibujado, ningún lado queda libre: la terminal se acopla en la esquina inferior izquierda del mapa (la revisión final del plan 3 lo arregló). A 1440×900 o más no tapa etiquetas ni sellos. A 1280×800 y 1366×768 la de Casa de Lucía, que es más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo». G6 también está hecho (`6e5630d`, Tarea 11 del plan 2). Siguen pendientes E4, E8, E9, G1, G2, G9, A1, A2, H1 a H3 y el bloque D.

> **Estado (design system, `docs/plans/2026-10-09-follow-the-packet-design-system.md`):** hecho G1 (las capturas de `#/entidades` no toleran ningún píxel distinto, salvo los bordes que Playwright cuenta como antialiasing). Del bloque D quedan decididas `design-tokens` y `primitive-semantic-tokens`; sigue sin decidir `prefer-radix`. Siguen pendientes E4, E8, E9, G2, G9, A1, A2 y H1 a H3: la migración no toca el código de ninguno. Con las escalas de letra y espacio, la terminal acoplada de Casa de Lucía en el 01-03 crece 8 px (de 495 a 503 de alto): a 1280×800 tapa 15 px de la parte de abajo del sello perdido en vez de 7, y a 1366×768, 31 en vez de 23; el «?» se sigue viendo y a 1440×900 no tapa nada. Sigue siendo el pendiente que anotó el plan 3.

> **Estado (temario de 33 capítulos, `docs/plans/2026-10-10-follow-the-packet-33-chapters.md`):** `CHAPTERS` y el roadmap pasan a los 33 capítulos del juego. Queda abierto I1 (bloque I); I2 lo decidió el estudiante. Siguen pendientes E4, E8, E9, G2, G9, A1, A2 y H1 a H3.

> **Estado (capítulo 1 en catorce subcapítulos, `docs/plans/2026-10-10-follow-the-packet-chapter-1-fourteen.md`):** las Tareas 0 a 28 están hechas. Sigue abierto I1: los catorce incidentes citan la misma lección y la misma nota que los cuatro de antes. El puente del 04-01 se cerró: ya no presenta ningún término del capítulo 1 y un test lo exige. El arreglo de la distribución de las tarjetas (`c8bc2f4`) toca a E8, pero no se cambió su estado. H1 habla del 01-03 de los cuatro incidentes de antes, que el capítulo retiró. Hay que volver a mirarlo en el mapa nuevo, así que sigue pendiente. Lo que quedó del capítulo está en el bloque J. Siguen pendientes E4, E8, E9, G2, G9, A1, A2 y H1 a H3.

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

- `design-tokens` y `primitive-semantic-tokens`: decididas en el plan del design system (2026-10-09). El proyecto sigue su idea (paleta y roles de color; escalas de letra, espacio y línea) y la escribe en `projects/follow-the-packet/DESIGN.md`. No entran como reglas de `.claude/rules/`: el estudiante dejó fuera las guardas (archivo de regla, test sobre el CSS y regla de ESLint).
- `prefer-radix`: sin decidir.
- **Menú de acciones de una pieza (clic derecho), 2026-10-19.** Idea del estudiante: tomar acciones sobre una entidad con clic derecho. Propuesta aprobada por el estudiante: el clic o el toque sigue siendo la entrada principal (abre la tarjeta de la pieza, con un botón «Acciones», como en la consola de AWS); el clic derecho, mantener presionado en el teléfono y la tecla Menú son atajos a esa misma lista; ninguna acción existe solo en el clic derecho, porque el teléfono no lo tiene, no se ve y el teclado y el lector de pantalla necesitan otro camino. Cuándo: solo en el mapa 2D, después de la Tarea M24 (borrar el 3D), y cuando un capítulo lo necesite (p. ej. el 6, VPC, o el 7, balanceador). Falta elegir la primera acción.

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
| G1 | La captura de `#/entidades` tolera un 1 % de píxeles distintos (unos 24 000): si volviera el candado dorado o faltara la alfombra del firewall seleccionado, la prueba pasaría (`tests/e2e/entities.spec.ts:26`) | Hecho en el design system (Tarea 1): las dos capturas de `#/entidades` no toleran ningún píxel distinto ni diferencia de color (`maxDiffPixels: 0`, `threshold: 0`), salvo los bordes que Playwright cuenta como antialiasing |
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
| H1 | Al explorar las 12 combinaciones del 01-03 (el de los cuatro incidentes de antes, ya retirado), seis sellos «perdido» se apilan sobre las etiquetas de «Casa de Lucía» y del router | Pendiente: el 01-03 de hoy es otro incidente (¿Estás ahí?); comprobar si pasa algo parecido en el mapa nuevo |
| H2 | La terminal no da retroalimentación al lector de pantalla después de «Enviar»: falta una línea `aria-live` que diga cómo terminó el paquete | Pendiente |
| H3 | El texto de ayuda de la inspección y la leyenda de los sellos y el candado se leen como un solo bloque gris, y la leyenda omite el sello del intruso (doble anillo ✓) que se ve en el 04-01 | Pendiente |

## Bloque I: lo que dejó el temario de 33 capítulos (2026-10-10)

Lo dejó el plan `docs/plans/2026-10-10-follow-the-packet-33-chapters.md`. Ninguno impide jugar los capítulos 1 y 4.

| # | Hallazgo | Destino |
|---|----------|---------|
| I1 | Cada incidente cita una lección de `syllabus.md` (`src/levels/registry.test.ts`, «cites a lesson of syllabus.md and a concept note that exists»). Los capítulos 3, 17, 20, 24 y del 25 en adelante no tienen lección en el curso: su primer incidente no podrá cumplirlo. Hoy lo cumplen los seis incidentes que existen, de los capítulos 1 y 4 | Pendiente: decidirlo cuando uno de esos capítulos tenga su primer incidente (por ejemplo, que la lección sea opcional si el capítulo no nombra módulos del curso, o que cite un tema de la hoja de ruta de AWS) |
| I2 | 31 de los 33 capítulos son «Próximamente» y usan la tarjeta `soon`, que se desvanece entera con `opacity: 0.5`. Medido sobre el papel de la página: el número en bermellón queda en 2.25:1, el título en 2.98:1 y «Próximamente» en 2.21:1, bajo el 4.5:1 de WCAG 1.4.3; sin desvanecer serían 5.26, 13.36 y 6.45 | Decidido por el estudiante (2026-10-10): se queda el desvanecido («me gustan que estén con opacidad»). Es contenido inactivo, un capítulo que aún no se abre. `DESIGN.md` («Contrast») y la guía de `src/design/` lo anotan con sus cifras, para que nadie lo «arregle» |

## Bloque J: lo que dejó el capítulo 1 en catorce subcapítulos (2026-10-10)

Lo dejaron el plan `docs/plans/2026-10-10-follow-the-packet-chapter-1-fourteen.md` (sus notas de la Tarea 13 y de la Tarea 27), el arreglo de la distribución de las tarjetas (`c8bc2f4`) y el de las cajas flotantes que se desplazan cuando su texto no cabe (`b2f5a0d`). Ninguno impide jugar el capítulo 1. Lo que anote la prueba humana del capítulo entero se agrega aquí después de hacerla. J10 se amplió y J12 a J14 los sumó el plan del capítulo 2 (`2026-10-11-follow-the-packet-chapter-2.md`, Tareas 18 bis, 19 y 19 bis).

| # | Hallazgo | Destino |
|---|----------|---------|
| J1 | A 390 px, una tarjeta acoplada todavía tapa la parte de arriba de una etiqueta del mapa | Pendiente |
| J2 | Entre 901 y unos 1054 px, la ayuda de la caja de inspección todavía puede superponerse a una tarjeta acoplada | Pendiente. La Tarea 28 bis no la toca: la decidida 42 deja la ayuda gris donde está |
| J3 | A 1280×800, la caja de inspección del 04-01 tapa «Security Group servidor2» y dos sellos. A 1440×900 la etiqueta queda libre. Ya pasaba antes del plan y ninguna prueba corre a ese tamaño | Pendiente: es el mismo problema que E4, visto a 1280×800 |
| J4 | Una intermitencia, vista una sola vez, en la prueba e2e `in 06 and 08 the map is at full size: two laptops of a floor stand as far apart as at any window` (1280×800). Pasó al repetirla y en las corridas siguientes. No se halló la causa y no se afirma ninguna | Pendiente: si vuelve a verse, anotar la corrida y el mensaje antes de tocar nada |
| J5 | El ícono `settings` de `CardIcon` (la tarjeta «Ajustes de red») no tiene especimen en `#/entidades`. Tampoco lo tienen `question`, `inspection` y `case`: el catálogo solo muestra `lucia`, `result`, `chapter` y `terminal` (revisado con `grep` sobre `src/ui/catalog/interface-section.tsx`) | Decidido en la Tarea 28: van en la sección «Elementos de la interfaz», junto al especimen del terminal, y se hacen en la primera tarea que regrabe `tests/e2e/snapshots/interface-darwin.png` a propósito. La Tarea 28 es solo de documentos y no las toca. Pendiente |
| J6 | A 390 px, la tarjeta de `laptop-visita` queda 76 px fuera del borde izquierdo. Ya pasaba antes del arreglo de las cajas (`b2f5a0d`) | Pendiente |
| J7 | Con el teclado no se puede hacer scroll dentro de la caja de inspección (accesibilidad). Se vio al arreglar las cajas que se desplazan (`b2f5a0d`) | Resuelta por `46c4074`: una caja fijada con un clic o con Enter lleva el foco a su título y se desplaza con el teclado |
| J8 | A 1280×360, el texto de ayuda pisa las tarjetas | Pendiente. La Tarea 28 bis no la toca: la decidida 42 deja la ayuda gris donde está |
| J9 | A 1000×700, la caja de inspección pisa la terminal | Resuelta por la Tarea 28 bis (D, `feat(ui): move the inspection box away from the open card`), vuelta a medir el 2026-10-17: a 1000×700 con la terminal abierta la caja no se dibuja y la terminal queda libre (`with a card open and no room beside it, a hover shows no box and a pinned box is released`) |
| J10 | En el 01-07, a 900×500, el título intercepta clics. Es más amplio que eso: el `h1` del título tapa la etiqueta de `tu-laptop` a 1280×360, 900×500, 844×460 y 700×600. Pasa también en `940f07a`, antes de la Tarea 19 del capítulo 2 | Pendiente |
| J11 | A 844×390, una tarjeta se pasa 2 px del mapa | Pendiente |
| J12 | En el 01-07, `router-oficina` queda fuera de la ventana a 1280×360, 900×500, 844×460 y 700×600. Pasa también en `940f07a`, antes de la Tarea 19 del capítulo 2 | Pendiente |
| J13 | Un lector de pantalla oye la palabra dos veces en la retroalimentación de una opción: «Correcto: Correcto.» y «Error: No es eso.». La pestaña de `Message` dice el tipo y el texto empieza con la misma palabra (Tarea 18 bis del capítulo 2) | Pendiente |
| J14 | La caja de inspección tapa «Listo» de una tarjeta recién abierta durante la gracia, unos 400 ms, a 1280×360. Lo midió la Tarea 19 bis del capítulo 2 con el reloj pausado | Resuelta por la Tarea 28 bis (O-1 = D, `feat(ui): move the inspection box away from the open card`, 2026-10-17): la caja se aparta de la tarjeta abierta o no se dibuja, y el oráculo `a card beside a piece keeps its foot in reach right after the click, in a low or narrow window` lo comprueba con los fotogramas pasados a mano. Ver [el plan del capítulo 2](2026-10-11-follow-the-packet-chapter-2.md) |
| J15 | En el 01-08, a 390×844, el sello «?» del ping perdido de tu-laptop a 10.0.0.10 queda en x = −45…−9 px, fuera de la ventana: no se puede pasar el mouse ni tocar. Medido el 2026-10-11 con Playwright sobre el build de producción, al investigar las cajas flotantes (`docs/plans/2026-10-11-follow-the-packet-floating-box-hover.md`) | Pendiente. `46c4074` y el plan de `main` la llaman J12; aquí J12 ya era otra fila |
| J16 | La prueba `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window` queda en el borde del tiempo límite (180 s) con `--repeat-each=10` y los 8 procesos por defecto: sola, 10 copias a la vez tardan de 2.7 a 3.0 m (medido el 2026-10-17 en el worktree de la Tarea 28 bis). La Tarea 28 bis corre esa orden con `--workers=4`. Partir esa prueba por ventana, como se hizo con las dos pruebas nuevas, pide el visto bueno de la sesión principal porque el plan la deja entera | Pendiente |
| J17 | A 1280×500, en el 04-01, la caja de inspección de `servidor2`, en su mínimo de 120 px, tapa «Security Group servidor2»: la causa es una marca y no una tarjeta, y D no la arregla. Medido el 2026-10-17 tras la Tarea 28 bis, con el mouse sobre `servidor2` y 25 muestras iguales: la sala que `inspectionRoom` deja a la derecha es de 92.2 px (la caja queda en el mínimo de 120) y la que dejaría a la izquierda, de 169.8 px; a 1280×800, de 242.2 px y de 319.8 px. Las capturas reales de los dos lugares están en el espacio de trabajo del SDD (`.superpowers/sdd/2026-10-11-follow-the-packet-chapter-2/captures-28bis/`, en el árbol principal) y no se commitearon | Pendiente. Vale B de la decidida 52 (la sala a la izquierda llega a 120 px o más): una tarea nueva, que agenda la sesión principal, hace que el lugar de la caja cuente las marcas y escribe la prueba del residuo en `tests/e2e/incidents.spec.ts`. Las medidas están en `projects/follow-the-packet/tests/e2e/CLAUDE.md` |
| J18 | La nota que dice por qué la caja de inspección no tiene sitio (decididas 42 y 43) va bajo la tarjeta de Lucía, en el panel lateral, y en las ventanas bajas queda debajo del borde del panel. Medido el 2026-10-17 en el 01-08 con la terminal abierta: a 1000×700 está en y = 639…702, al borde, y a 1000×600 y a 1000×500 (y = 639) hay que desplazar el panel para verla | Pendiente. La Tarea 28 bis cumplió la decidida 42 tal cual. Que se vea sin desplazar el panel pide cambiar el lugar de la nota, y eso cambia lo que el jugador ve: lo decide la sesión principal |
| J19 | Un «+N» que esconde un sello de problema (✕, ?, ! o intruso) se dibujaba igual que cualquier «+N»: el jugador no sabía que adentro hay un problema sin abrir la lista. Sí se da con los incidentes registrados: en el 02-03, con todas las combinaciones enviadas, `firewall:marta-laptop` junta más sellos de problema que casillas y el «+2» esconde alguno (medido el 2026-10-20 con el barrido de M8: 180 estados y 1260 mapas, y «+N» solo en el 02-03 y el 02-08). El centinela `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N» without showing it` (`src/ui/incident/map-sweep.test.ts`, no `stamp-fan.test.ts` como decía el texto de la 28 quinquies) comprueba que ningún «+N» esconde un problema sin mostrarlo. Origen: Tarea 28 quinquies, O-4 = G (plan del capítulo 2); el texto de la Tarea M26 del plan del mapa 2D la llama J16 | Resuelta por decisión del estudiante (2026-10-19, «J16 = (a)»): un «+N» que esconde al menos un sello de problema lleva un punto pequeño del color de peligro del juego en su borde inferior derecho, con el aro de tinta; uno que esconde solo sellos que llegaron no lleva punto. El modelo puro es la bandera `hidesProblem` (Tarea M8, `5ca09c0`); el dibujo del punto, el especimen del catálogo y el nombre accesible, la Tarea M12 (`971e84e`) y la M16 (`711aa17`); `DESIGN.md` lo describe. La cierra la Tarea M26 del plan del mapa 2D |
| J20 | El abanico y su pasillo no modelan el zoom que elige el jugador (`MapControls`, 18 a 110; las distancias cambian y las etiquetas no), ni el borde del mapa, ni un tope de ancho: un lugar sin vecinas dibuja todos sus sellos en 36 + 25 (k − 1) px. Origen: Tarea 28 quinquies (plan del capítulo 2); el texto de la Tarea M26 del plan del mapa 2D la llama J17 | Cerrada por la Tarea M26 del plan del mapa 2D: el mapa 2D no tiene zoom del jugador (`MapControls` y la escena 3D salieron en la Tarea M24, `6a71b40`, y `git grep -i zoom` sobre `src/` y `tests/` no da nada), así que no hay zoom que modelar. Del ancho solo lo verificado en código y pruebas: una marca del layout guarda como mucho 3 casillas (`CASILLAS` en `src/scene/layout/arrange/geometry.ts`; `every mark says the axis along which its fan opens and how many casillas fit`), o sea un abanico de a lo más 86 px (36 + 25 × 2), y menos donde una caja le estorba (`holds fewer casillas when a box is in the way of its fan, and never less than one`); la cuenta `36 + 25 (k − 1)` ya no vale. El borde no se modela: lo comprueba el barrido de la Tarea M8 (`in every state of every registered incident the drawing is no wider than its width and every label, icon, name, group, stamp and packet lies inside it, at seven widths, but for one shape at 360 px`) |

## Fuera de este backlog (decide el estudiante)

- `git push` de `main` (2 commits: `55dadac`, `6daf19a`) y de la rama.
- Commit de `projects/follow-the-packet/.claude/`.
- Commit de las 4 reglas nuevas en `~/dotfiles` (`claude/.claude/skills/az-rules/rules/`).

## Listo

- `npm run check` pasa entero, incluidos los controles del bloque C.
- Cada error del bloque A tiene un test que fallaba antes del arreglo.
- Revisión final de Codex sin hallazgos altos ni medios, cada uno verificado antes de aplicarlo.
