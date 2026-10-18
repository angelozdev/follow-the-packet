# Sigue el paquete · El mapa en 2D: layout puro, piezas en SVG, pruebas por capas y adiós a three

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Este plan no trae código: cada tarea dice qué contrato, qué archivos y qué tests nombrados; el código lo escribe quien ejecuta, con TDD.

**Goal:** Migrar el mapa del juego de 3D (three.js con React Three Fiber) a 2D (SVG), sin cambiar el motor, el contrato, los niveles, los textos ni las tarjetas, y con los capítulos 1, 2 (del 02-01 al 02-09) y 4 jugándose igual en cada paso. Llegan:
- un layout puro (filas, carriles y un grafo de enlaces) que se prueba sin navegador y calcula las colisiones;
- las piezas, los sellos en abanico con «+N», los paquetes en vuelo (SMIL) y la consulta DNS dibujada, todo en 2D;
- una estrategia de pruebas de cuatro capas: funciones puras, Testing Library en jsdom, Vitest en modo navegador y 6 pruebas e2e en lugar de 126;
- el borrado de `three`, `@react-three/fiber`, `@react-three/drei`, la cámara y `swiftshader`;
- la retoma del capítulo 2: las Tareas 28 quater y 28 quinquies ya en 2D, y después la 29 a la 35.

**Architecture:**
1. **Antes de empezar (Tarea M1).** El modo navegador de Vitest: la dependencia, los proyectos y los scripts.
2. **El layout puro (M2 a M8).** Todo lo que decide dónde va algo, sin React ni DOM. Se prueba con Vitest, con barridos sobre todos los incidentes registrados.
3. **Piezas y tráfico en SVG (M9 a M16).** Detrás de una bandera de compilación: el 3D sigue siendo el mapa hasta la paridad.
4. **Paridad y cambio (M17 y M18).** Se corre la suite e2e entera con el 2D, se arreglan los defectos y se cambia el mapa por defecto.
5. **Las pruebas pasan de capa (M19 a M23).** Cada prueba e2e se mueve a la capa que la prueba mejor y se borra de e2e en el mismo commit.
6. **Borrar el 3D (M24).** Dependencias, archivos, configuración, reglas y guías; el código nuevo sube a `src/scene/`.
7. **Retomar el capítulo 2 (M25 a M28).** 28 quater, 28 quinquies, 29 a 35.

**Tech Stack:** el de hoy (Vite 8.3.3, TypeScript 6.0.3, React 19.3, zod 4.6.5, `@mantine/hooks` 9.7.1, `@radix-ui/react-tabs` 1.1.21, Vitest 5.0.3, Testing Library con user-event, Playwright 1.64, pnpm 11.3.0). **Una dependencia nueva:** `@vitest/browser-playwright` 5.0.3, exacta (Tarea M1, no antes del 2026-10-14). **Cuatro que salen:** `three` 0.186.1, `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9 y `@types/three` 0.186.0 (Tarea M24).

**Spec:** [`docs/specs/2026-10-12-follow-the-packet-2d-map-design.md`](../specs/2026-10-12-follow-the-packet-2d-map-design.md): el modelo de dibujo, el layout, la escala, lo que se borra, el aspecto, la estrategia de pruebas (con la lista de las 126 e2e) y las decididas sin el estudiante. **Prototipos:** una página HTML con mapas calculados (no capturas), `2d-map-prototypes.html` en el scratchpad de la sesión; la publica la sesión principal. **Plan del capítulo 2:** [`2026-10-11-follow-the-packet-chapter-2.md`](2026-10-11-follow-the-packet-chapter-2.md), del que este plan toma sus tareas 28 quater, 28 quinquies y 29 a 35.

## Estado al empezar

- **Rama y base.** `feat/chapter-2`. Este plan se escribió sobre `a4f6e1f` (HEAD de la rama el 2026-10-12). **No empieza hasta que la Tarea 28 bis haya aterrizado:** otro agente la hace en el worktree `/Users/angelozdev/me/aws-commit-academy-28bis` (rama `merge/28bis`) y la trae con `git merge --ff-only`. Trae los nombres nuevos de la escena (`inspectTrigger`, `trigger`), la carpeta `src/ui/floating-box/` y la caja que se aparta de la tarjeta. Los archivos de `src/scene/` que este plan nombra se vuelven a leer en la punta nueva antes de cada tarea.
- **La base de este plan (B0).** El último commit con `pnpm check` completo en verde, que anota la Tarea M0. Todo rojo se compara con B0 (regla C).
- **Tareas hechas del capítulo 2:** 8 a 28 (el bloque 4 cerrado). Pendientes: 28 bis (en curso en otro worktree), 28 ter, 28 quater, 28 quinquies y 29 a 35.
- **Totales de B0 (2026-10-12, sobre `11587fc`, antes de 28 bis):** Vitest 2938 pruebas en 98 archivos (5,9 s); `pnpm check:fast` 11,3 s; Playwright 126 pruebas en 2,1 min con 8 trabajadores y 835 s de tiempo de prueba; `dist/assets/index-*.js` de 1 660 629 bytes (463 744 con gzip).
- **Cierre de la Tarea M0 (2026-10-17).** Medido en `feat/chapter-2`, con HEAD en `05456ce`, que sobre B0 solo suma dos archivos de documentación (`docs/plans/2026-10-11-follow-the-packet-chapter-2.md` y `src/copy/CLAUDE.md`). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **B0 = `efe355b`** (`fix(copy): say in plain words that a router has no route until net-unreachable is known`, 2026-10-17 18:01): el último commit con `pnpm check` completo en verde ese día. Cada `<B0>` de este plan es `efe355b`. La 28 bis aterrizó en `4fccc95` (merge) y la 28 ter cerró en `05456ce`; la viñeta «Tareas hechas del capítulo 2» de arriba es anterior a eso. `git worktree list` solo lista el worktree principal y no existe ninguna rama `merge/*`. `git status --short` solo mostró rutas del estudiante (`README.md`, `exercises/03-alb-health-checks/app/package.json` y `pnpm-lock.yaml`, `labs/05-ha-alb-asg-imdsv2/` con su `README.md` y archivos nuevos); `concepts/ami.md` ya no tiene cambios.
  - **`pnpm check` completo sobre HEAD** (desde `projects/follow-the-packet/`): `check:fast` en verde (typecheck, lint, structure, jscpd con 0 clones y **Vitest 2990 pruebas en 101 archivos**, 8,9 s). **Playwright: 143 pruebas**; en la corrida completa, con 8 trabajadores, pasaron 140 y 3 fallaron por tiempo (6,7 min): `card-layout.spec.ts`, dos pruebas que llegaron a los 180 s, y `entities.spec.ts`, la captura de la interfaz, que esperó 5 s a que el elemento estuviera estable. La máquina estaba cargada por otras sesiones (carga de 20 al empezar y de 109 al terminar). Vuelto a correr cada archivo solo: `card-layout.spec.ts` con `--workers=4` pasó 27 de 27 (3,4 min); `entities.spec.ts` con los trabajadores por defecto falló 3 de 17 (la misma captura y dos pruebas que no vieron la leyenda «intruso» en 5 s, con carga de unas 40) y con `--workers=2` pasó 17 de 17 (34 s). HEAD solo suma documentación sobre B0, así que no es una regresión de código: con los trabajadores por defecto la e2e es sensible a la carga en esta máquina (`tests/e2e/CLAUDE.md`, «Port and parallel suites»). No hay una corrida completa limpia sobre HEAD. Los tiempos de esta corrida (6,7 min de Playwright, 8,9 s de Vitest) se tomaron bajo carga y no son comparables con los 2,1 min y los 5,9 s de la línea de B0 del 2026-10-12.
  - **Carpetas** (archivos planos sin contar `CLAUDE.md` ni los ocultos; `pnpm structure` no imprime cifras cuando pasa, así que los conteos salen de un script con el mismo filtro que `scripts/check-structure.ts`): `src/scene/` 11, `src/scene/entities/` 11, `src/ui/incident/` 10 y `tests/e2e/` 11, contra un tope de 12. `src/game/`, `src/game/view/` y `src/game/view/cards/` ya están en 12 de 12.
  - **E2E: 143 = 126 + 17**, todas las nuevas en `card-layout.spec.ts` (de 10 a 27); los otros cinco archivos no cambian (`chapter-1` 41, `chapter-2` 28, `entities` 17, `incidents` 27, `roadmap` 3). Vienen de dos commits: 7 de `46c4074` (el pin de la caja con un clic) y 10 de `88053a7` (la caja se aparta de la tarjeta, con el oráculo). Su capa, según la tabla del spec («Qué pasa con las 126 e2e de hoy»):
    - **(c), con la rueda** (como `an inspection box that does not fit scrolls under the mouse...`): `a pinned box survives a human-paced trip across another piece and scrolls under the mouse` (3 ventanas). Usa `page.clock`, que el modo navegador no tiene (allí serían los relojes falsos de Vitest): la tarea que la mueva lo resuelve.
    - **(c)**, sin pareja en la tabla, colocadas por las definiciones de capa: `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back` (necesita el desplazamiento real del cuerpo de la caja, que jsdom no tiene) y `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` (comprueba con `inspectionBoxOverCards` que la caja fijada no tapa ninguna tarjeta).
    - **(c)**, con `a card beside a piece stays inside the map, with its foot in view...` (mismo cuerpo, `problemsOfTheCardsOfTheMap`): el oráculo `a card beside a piece keeps its foot in reach right after the click...` (4 ventanas) y `the inspection box covers no card of the map, right after the click and at rest...` (4 ventanas).
    - **(c)**, sin pareja exacta: `with a card open and room beside it, the box of another piece takes the side the card leaves free` (mide el lado de la caja contra la tarjeta; el cálculo, `inspectionPlace`, ya es puro y está probado en (a)) y `with a card open and no room beside it, a hover shows no box and a pinned box is released` (el «sin lugar» sale de la geometría; la liberación del pin ya la prueban dos pruebas de `incident-screen.test.tsx`).
    - **(b)**, sin pareja en la tabla: `with touch, a tap pins the box and a tap outside releases it` (el pin y su liberación no necesitan geometría) y `a term definition can be reached with the mouse, and Escape closes it` (la gracia de 400 ms y el Escape de la definición; no mide la ventana, a diferencia de `a term shows its definition inside the window...`, que sigue en (c)).
    - **Nuevo reparto de las 143:** (a) 30, (b) 24, (c) 70, se borran 7 y 12 se quedan en (d) o se funden; 30 + 24 + 70 + 7 + 12 = 143 (los de antes sumaban 126 con (b) 22 y (c) 55). Hasta 8 de las 70 de (c) vuelven a (d) si falla la prueba de la rueda de M1: las 5 del spec y las 3 ventanas del viaje de la caja fijada. Entonces la línea «Serían 11» del spec pasa a 12 pruebas por título (el viaje cuenta como una, aunque corre en 3 ventanas).
  - **Los nombres, leídos en la punta nueva.** `inspectTrigger` (tipo `InspectTrigger`, en `src/scene/overlay/inspect-trigger.ts`) es una prop de `GameScene` y de `Traffic`, y también la recibe `PieceAnchor`. `trigger` (tipo `TriggerProps`) es la prop de `PieceLabel` y de `StampPiece`, y `Traffic` la llena con `inspectTrigger(packet.pieceId)`. En la UI, `useInspection` devuelve `trigger` y la pantalla se lo pasa a la escena como `inspectTrigger`. **`MAP_CARD` (`.map-card`) no está en esos cuatro archivos:** vive en `src/scene/html-layer.ts`, junto a `MAP_MARKS`, se reexporta en `src/scene/index.ts` y `src/ui/incident/use-inspection.ts` lo lee con `@/scene`; la clase se la pone al contenedor de la tarjeta `overlay/card-anchor.tsx`.
  - **Peso del paquete** (`pnpm build` sobre HEAD): `dist/assets/index-*.js` de 1 666 108 bytes, 471,42 kB con gzip (la cifra que imprime Vite); en B0 eran 1 660 629 y 463 744.
- **Cierre de la Tarea M1 (2026-10-17).** Medido en `feat/chapter-2` sobre `8c32cd8` con los cambios de M1. Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **La dependencia.** `pnpm view @vitest/browser-playwright@5.0.3 version time peerDependencies` (2026-10-17): versión 5.0.3, publicada el 2026-09-30 (17 días), pares `vitest` 5.0.3 y `playwright` `*`. Siguen sin los 14 días la 5.0.4 (2026-10-12) y la 5.0.5 (2026-10-15): `vitest` y el proveedor se quedan en 5.0.3, como decidió el estudiante. `pnpm add -D` no pidió `playwright` como par (el árbol ya trae el 1.64.0 por `@playwright/test`), `pnpm-workspace.yaml` no cambió y ningún script de instalación pidió permiso. El lock suma 14 entradas del árbol del proveedor (`@vitest/browser`, `@vitest/ui`, `@vitest/utils` y otros) y no cambia la versión de ningún otro.
  - **Rojo primero.** Antes de configurar, el archivo del navegador falló en el proyecto de Node con «vitest/browser can be imported only inside the Browser Mode», y tres pruebas de `scripts/` fallaron por lo que debían: `check` sin `test:browser`, `test` sin `--project unit` y la regla de lint que no veía la espera fija.
  - **La rueda: desplaza.** `userEvent.wheel(elemento, { delta: { y: 100 } })` de `vitest/browser` mueve un contenedor `overflow: auto` dentro del iframe: un solo evento `wheel` de confianza (`isTrusted`, `deltaY` 100), `scrollTop` de 0 a 100 (a 400 con tres pasos más) y `scrollIntoView` sin llamarse. No hizo falta ninguna orden propia: `src/testing/browser-commands.ts` no existe. **Las cinco pruebas con rueda del spec se quedan en (c)**: la rueda no las devuelve a (d). Lo que el experimento no decide es el viaje de la caja fijada (`a pinned box survives a human-paced trip...`), que además usa `page.clock`, y las cuentas de «hasta 8 de las 70» y de «serían 11 e2e»: las resuelve la tarea que mueva esas pruebas. Resultado anotado en `src/testing/CLAUDE.md`.
  - **El ancho: cambia.** Tras `page.viewport(1280, 800)`, `window.innerWidth` es 1280, `(max-width: 900px)` no se cumple y `.incident` tiene dos columnas (`900px 380px`); tras `page.viewport(390, 844)` el ancho es 390, la consulta se cumple y `.incident` tiene una (`390px`). Las pruebas de 390 px usan `page.viewport`, sin iframe propio. **El ancho por defecto del iframe es 414 px, ya menor que 900:** una prueba del escritorio fija `page.viewport(1280, 800)` primero.
  - **Tiempo de `pnpm test:browser`** (la primera medida real del modo navegador): 4 pruebas en 1 archivo; Vitest dice 0,80 a 0,91 s (0,86 s dentro de `pnpm check`) y el reloj de pared de `pnpm test:browser` es de 1,3 a 1,45 s, con Chromium arrancando en cada corrida (carga de la máquina de 2 a 5). La prueba de la rueda tarda unos 115 ms y las otras tres, de 1 a 8 ms. Es el piso: cada archivo nuevo suma su propio iframe y su importación.
  - **Totales con M1.** Vitest 2995 pruebas en 101 archivos (las 2990 de antes más 5: una de `package-scripts.test.ts`, tres de `eslint-config.test.ts` y la línea de `package-versions.test.ts` para la dependencia nueva), navegador 4 pruebas en 1 archivo, Playwright 143 de 143 en 2,9 min con 8 trabajadores (carga de la máquina de 5 al empezar y de 72 al terminar), jscpd 0 clones y `golden-traces.json` sin cambios. `git diff --stat efe355b -- src/engine src/levels` está vacío.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M1:**
    - Un archivo más, `src/testing/browser-setup.ts`, que carga `@/styles.css` (tokens y primitivos) y hace `cleanup` de Testing Library tras cada prueba; así el proyecto `browser` trae el CSS del juego y las pruebas usan el `render` de Testing Library como en jsdom. La otra opción, importar el CSS en cada prueba, se repetiría en cada archivo desde M9.
    - `tsconfig.json` lista `src/testing/setup.ts` primero en `include`. Sin eso, los tipos de los comparadores del navegador (que `vitest/browser` declara en todo el programa de tipos) ganan a los de jest-dom y `expect(...).toHaveTextContent(/.../)` de `table-card.test.tsx` deja de compilar. El costo: en una prueba del navegador, `expect.element(...).toHaveTextContent` acepta una `RegExp` en los tipos pero no en la ejecución (el comparador del navegador nunca se cumple y la prueba termina por tiempo). La otra opción es un `tsconfig` aparte para `*.browser.test.*` y `vite.config.ts`, con `typecheck` en dos pasos: más exacta, más maquinaria. Está anotado en `src/testing/CLAUDE.md`.
    - `.vitest/` entra en `.gitignore`: una prueba del navegador que falla deja ahí su captura.
    - El mensaje de la regla de espera fija ya no manda solo a `page.clock` (que no existe en el modo navegador): nombra `expect.poll`, `expect.element` y `vi.advanceTimersByTime`.
    - La regla de lint de las esperas fijas y su prueba cubren `src/**/*.browser.test.{ts,tsx}` y conservan la prohibición de la importación dinámica; `README.md` y `tests/e2e/CLAUDE.md` dicen ahora que `pnpm check` corre `pnpm test:browser` antes de Playwright.

## Qué decide el estudiante y qué no

- **Decidido por el estudiante (2026-10-12):** migrar a 2D, por las razones medidas (el 3D y sus pruebas inestables, cerca del 21 % del tiempo de agentes; 6 de 10 decisiones de la noche, cosas que se pisan en el mapa; el SVG se reacomoda al móvil y el 3D se recorta; los diagramas de AWS son 2D) y reducir las e2e para apoyarse en Vitest y Testing Library.
- **Abierta, la única:** el aspecto, claro (A, papel y tinta, recomendada) u oscuro (B, como la referencia). Está en el spec, «El aspecto», con prototipos en los dos. **No bloquea nada hasta la Tarea M18.** Si el estudiante no ha contestado cuando llega M18, M18 se hace con A (es lo que ya existe) y el aspecto oscuro, si se elige después, es la Tarea M18 bis.
- **Decididas sin el estudiante (para revisar):** las 18 del spec, «Decididas sin el estudiante». Antes de su prueba humana, la Tarea 33 del plan del capítulo 2 las junta en una sola página, como las demás.
- **Umbral:** una decisión se abre al estudiante solo si ninguna opción pasa sus tres criterios (rigurosa, visual y entendible) o si dos o más los pasan y cambian de forma importante lo que se aprende o se ve. Lo demás va a «Decididas sin el estudiante» con su porqué.

## Global Constraints

- **Rutas.** Relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Los comandos se corren desde `projects/follow-the-packet/`.
- **Reglas.** Valen las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Pesan sobre todo:
  - `folder-structure`: tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), barrels, alias `@/` y nada de `../`. Medido el 2026-10-12 sobre `a4f6e1f`: `src/scene/` tiene 11 archivos planos, `src/scene/entities/` 11, `src/ui/incident/` 8 (con la 28 bis, 10), `tests/e2e/` 11. Por eso **el código nuevo vive en una carpeta temporal, `src/scene/map2d/`, con las subcarpetas finales** (`layout/`, `layout/arrange/`, `marks/`, `cards/`, `entities/`, `overlay/`, `traffic/`, `catalog/`), cada una con su `CLAUDE.md`; la Tarea M24 la sube a `src/scene/`. La bandera (M9) suma un archivo a la raíz de `src/scene/`, que queda en 12 de 12 hasta M24.
  - `pure-domain-core` y `view-renders-domain-result`: el motor no cambia; la escena dibuja lo que la vista le pasa y nunca decide un resultado. El layout es cálculo de vista, permitido.
  - `english-only` y `no-comments`: código, pruebas, guías y commits en inglés, solo JSDoc. El texto visible va en `src/copy/`.
  - `rigorous-plain-copy`: los nombres de los grupos dicen solo lo que el jugador conoce (spec, «Grupos»).
  - `prefer-established-libraries` y `exact-dependency-versions`: una sola dependencia nueva (M1), exacta, con su fecha en la regla.
  - `dry` con `jscpd` en umbral 0: los especímenes y las piezas de un mismo tipo comparten constructores.
  - Un estándar por elemento (`DESIGN.md`): las etiquetas, los sellos y las tarjetas son los primitivos y las clases de hoy; la capa HTML no estrena un botón.
- **El 3D no se toca hasta la Tarea M24.** Desde M2 hasta M18, `git diff --stat <B0>..HEAD -- src/scene/game-scene.tsx src/scene/map-canvas.tsx src/scene/road.tsx src/scene/ink.tsx src/scene/layout.ts src/scene/entities src/scene/traffic src/scene/overlay src/scene/catalog` solo muestra los archivos que la tarea nombra (los que son puros y se comparten, como `flow-look.ts`). Es lo que mantiene los capítulos jugables.
- **La bandera.** `VITE_MAP_RENDERER` (`3d` por defecto, `2d`), que lee `src/scene/renderer.ts` al compilar; el barril `src/scene/index.ts` elige entre `GameScene3D` y `GameScene2D` (y entre los dos catálogos). Para jugar el 2D a mano: `VITE_MAP_RENDERER=2d pnpm dev` en un puerto que no sea el 5173 ni el 5180. Para correr las e2e con él: `VITE_MAP_RENDERER=2d pnpm e2e`. Por qué una bandera y no una migración por pieza: una pieza 3D y una 2D no pueden compartir una misma vista, así que el cambio es de todo el mapa a la vez.
- **Dependencias.** Una nueva (`@vitest/browser-playwright` 5.0.3, exacta, publicada el 2026-09-30, de al menos 14 días el 2026-10-14) y cuatro que salen en M24. `pnpm-lock.yaml` solo cambia en M1 y M24. Se instala con `pnpm add -D`, nunca editando `package.json` a mano. Si `pnpm` exige `playwright` como par explícito, es `playwright` 1.64.0, ya excluido de `minimumReleaseAge` en `pnpm-workspace.yaml`.
- **Los capítulos 1, 2 y 4 no cambian lo que calculan ni lo que muestran, salvo lo que el spec lista** (el mapa deja de ser 3D; las etiquetas pasan a monoespaciada; sin zoom ni paneo; en el teléfono la fila del mapa es `auto`).
  - `src/levels/04-iaas/golden-traces.json` no se edita nunca. Cada tarea comprueba `git diff --exit-code src/levels/04-iaas/golden-traces.json`.
  - Ningún archivo de `src/engine/` ni de `src/levels/` cambia en ninguna tarea de este plan: `git diff --name-only <B0>..HEAD -- src/engine src/levels` está vacío hasta M25.
  - Las pruebas de los capítulos 1 y 4 de `src/` corren sin editarse. Las únicas que cambian a propósito son las de `src/scene/` (las de `layout.test.ts`, `use-packet-runs.test.ts`, `edges.test.ts`, `catalog-grid.test.ts`) y `scripts/package-scripts.test.ts` (M1). Cada una va en el cuerpo de su commit.
- **Capturas.** `entities-darwin.png` e `interface-darwin.png` cambian solo en M18 (y en M18 bis si el estudiante elige el oscuro), a propósito y revisando el diff; en M22 pasan a las del modo navegador. Ninguna otra tarea las toca.
- **"Listo"** (regla C del plan del capítulo 2, con su ajuste):
  - en cada tarea, `pnpm check:fast` más las pruebas de la tarea (y `pnpm test:browser`, desde M1, cuando la tarea toca el navegador);
  - al cerrar un bloque o una tarea que toca `game`, `copy` o `ui` (M1, M7, M8, M16, M18, M23 y M24) y antes de cada merge, `pnpm check` completo;
  - una e2e que falla se compara con B0, no con «HEAD sin los cambios de la tarea»;
  - nunca dos suites e2e a la vez en la misma carpeta.
- **Pruebas deterministas.** Nada de `waitForTimeout`, `setTimeout`, `setInterval`, `retries`, `skip`, `fixme`, ni `test.fail`. En el navegador se espera con `expect.element`. Una animación se prueba con `pauseAnimations()` y `setCurrentTime(t)`. M1 extiende la regla de lint a los `*.browser.test.*` de `src/`.
- **Las pruebas nombradas en el plan:** no se quitan ni se renombran. Los nombres están en inglés y son exactos; quien implementa puede agregar más.
- **Commits.** Uno por tarea (o los que la tarea dice), cuando el estudiante lo aprueba (regla del repo), con rutas explícitas (`git commit -m … -m … -- <rutas>`), nunca `git add .` ni nada de `labs/`. El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (segundo `-m`). Sin `git push`, sin merge a `main`, sin `--amend`, `reset`, `update-ref` ni `stash`. **`concepts/ami.md` tiene cambios del estudiante sin commit: nunca se toca, nunca se agrega.**
- **Procesos.** No se arranca nada en los puertos 5173 y 5180 (los del estudiante). Playwright usa el suyo (4183 a 4282, derivado de la ruta). Si una tarea deja un proceso, se detiene solo ese PID; nunca `pkill` ni `killall`.
- **Ejecución.** La sesión principal orquesta y cada tarea la hace un subagente con `model` explícito: `sonnet` para explorar, implementar, revisar e investigar; `haiku` solo para correr un comando y contar su salida; nunca `opus`. Cada subagente recibe solo el plan, las rutas y la tarea. Nunca dos agentes que hagan commits a la vez en el mismo worktree. Un revisor `sonnet` lee los textos nuevos de `src/copy/` antes de cerrar el bloque que los trae (M7 y M11).
- Ningún comando `aws`.

## Cómo siguen jugables los capítulos 1 y 2 en cada paso

- **De M1 a M16** el mapa es el 3D, sin un solo cambio. La bandera tiene el valor `3d` y los archivos 3D no cambian, así que `pnpm check` da el mismo resultado que en B0 (se comprueba con el `git diff --stat` de arriba). Lo nuevo se ve en el 2D con `VITE_MAP_RENDERER=2d`.
- **M17 (paridad)** corre las 126 e2e con el 2D y las compara con B0. Primero se hace neutro al renderer el único ayudante que lee el lienzo (`drawnBox`). Después solo pueden fallar las 7 que el spec marca como «se borran», las capturas de `#/entidades` y las que leen la etiqueta de un paquete en vuelo (que M14 reemplaza); cualquier otra es un defecto del 2D y se arregla ahí. Ninguna prueba se edita: se editó un ayudante.
- **M18** cambia el valor por defecto a `2d` solo cuando M17 quedó en verde. Es un commit de una línea y se revierte con otra. Desde ahí el 3D ya no se juega, pero su código sigue hasta M24.
- **De M19 a M23** las pruebas pasan de capa con el 2D ya como mapa por defecto. Cada tarea deja `pnpm check` en verde.
- **M24** borra el 3D. No hay un solo paso en el que el capítulo 1 o el 2 se queden sin mapa.
- **Los capítulos 1, 2 y 4** se juegan igual: la parte que cambia (cómo se dibuja) no toca lo que se enseña, y cada incidente sigue pasando por sus tres estrellas en la e2e de su capítulo, antes y después del cambio.

## Árbol al terminar (solo lo cambiado)

`src/scene/` queda con estos archivos y carpetas (cada una con su `CLAUDE.md`, y ninguna con más de 12 archivos):

| Ruta | Contenido |
|---|---|
| `src/scene/` | `index.ts`, `game-scene.tsx`, `map-stage.tsx` (la capa SVG y la capa HTML, con el tamaño del contenedor), `html-layer.ts` (los selectores `MAP_MARKS` y `MAP_CARD`) |
| `src/scene/layout/` | `metrics.ts`, `graph.ts`, `stations.ts`, `map-layout.ts`, con sus pruebas |
| `src/scene/layout/arrange/` | `row.ts`, `stack.ts`, `groups.ts`, con sus pruebas |
| `src/scene/marks/` | `stamp-fan.ts`, `packet-tags.ts`, `collisions.ts`, con sus pruebas |
| `src/scene/cards/` | `placement.ts` y su prueba |
| `src/scene/entities/` | las piezas en SVG, sus iconos y el catálogo: `actor`, `device`, `edge`, `entity-icon` (con prueba), `firewall`, `internet`, `network`, `packet`, `stamp` (con prueba) e `index.ts` |
| `src/scene/overlay/` | `piece-label.tsx` (con prueba), las etiquetas y nombres de grupo posicionados, `card-anchor.tsx`, `inspect-trigger.ts` |
| `src/scene/traffic/` | `flow-look.ts`, `flight-plan.ts`, `still-trace.tsx`, `flight.tsx`, `packet-tag.tsx`, `traffic.tsx`, con sus pruebas |
| `src/scene/catalog/` | `catalog-cells.tsx` y `catalog-scene.tsx` |
| `src/ui/incident/map-sweep.test.ts` | el barrido de todos los incidentes (colisiones, «+N», orden de lectura) |
| `src/**/*.browser.test.tsx` | las pruebas del modo navegador, al lado de lo que prueban |
| `tests/e2e/` | `chapter-1/`, `chapter-2/`, `incidents.spec.ts`, `roadmap.spec.ts` y los ayudantes que quedan; sin `still-scene.ts` ni `card-layout.spec.ts` ni `entities.spec.ts` ni las capturas |

## Tareas

### Tarea M0: Preparar, sin cambiar nada

**Depende de:** que la Tarea 28 bis haya aterrizado en `feat/chapter-2`.

- [x] `git status` solo muestra `concepts/ami.md`. `git log` muestra los commits de la 28 bis. `git worktree list` no lista `merge/28bis`.
- [x] Anotar el hash B0 y correr `pnpm check` completo sobre él; si no está en verde, se para y se informa.
- [x] Contar las e2e (`pnpm exec playwright test --list`) y volver a clasificar las que trae la 28 bis (las del pin de la caja y el oráculo) con la tabla del spec: van a la misma capa que las de `card-layout.spec.ts` que prueban lo mismo. Anotar el total nuevo.
- [x] Contar los archivos planos de `src/scene/`, `src/scene/entities/`, `src/ui/incident/` y `tests/e2e/` con `pnpm structure`.
- [x] Leer en la punta nueva `src/scene/overlay/piece-label.tsx`, `entities/stamp.tsx`, `traffic/traffic.tsx` y `game-scene.tsx`: los nombres que este plan usa (`inspectTrigger`, `trigger`, `MAP_CARD`) son los de ahí.

**Cierre:** el hash B0, el total de e2e y de Vitest, y los conteos de carpetas, anotados en la sección «Estado al empezar» de este plan. No hay commit de código.

---

### Tarea M1: El modo navegador de Vitest

**Presenta:** la capa (c) de pruebas. **Depende de:** M0 y de que sea el 2026-10-14 o después (la dependencia necesita 14 días). Vale la pena adelantarla: el barrido de colisiones y los demás bloques no la necesitan, pero M9 en adelante sí.

**Archivos:**
- Modify: `package.json` (la dependencia de desarrollo y los scripts `test`, `test:browser` y `check`), `pnpm-lock.yaml`, `vite.config.ts` (dos proyectos con nombre: `unit`, con la configuración de hoy, y `browser`, con `provider: playwright()`, `instances: [{ browser: 'chromium' }]`, `headless: true`, el CSS del juego y los tokens), `eslint.config.js` (la regla de `NO_FIXED_WAIT` también para `src/**/*.browser.test.{ts,tsx}`), `scripts/package-scripts.test.ts` (cambia a propósito), `scripts/eslint-config.test.ts`, `.claude/rules/prefer-established-libraries.md` (la elección, con su fecha y la consulta de `pnpm view`), `src/testing/CLAUDE.md`, `tests/CLAUDE.md`.
- Create: `src/testing/browser.browser.test.tsx` (las pruebas del montaje) y, si hace falta, `src/testing/browser-commands.ts` (la orden de la rueda).

**Pasos:**
- [x] `pnpm view @vitest/browser-playwright@5.0.3 version time peerDependencies` otra vez, el día en que se hace: la versión es exacta, igual a la de `vitest` instalada, y tiene al menos 14 días. Si salió una versión nueva de Vitest, se pregunta antes de subirla.
- [x] `pnpm add -D @vitest/browser-playwright@5.0.3`. Comprobar que `pnpm-workspace.yaml` no necesita permiso de ningún script de instalación.
- [x] Escribir las pruebas de abajo en rojo y ver cómo fallan por lo que deben.
- [x] Configurar los proyectos. Los scripts: `test` corre `vitest run --project unit`; `test:browser`, `vitest run --project browser`; `check` es `pnpm check:fast && pnpm test:browser && pnpm e2e`. `check:fast` no cambia sus pasos: sigue sin navegador.
- [x] **El experimento de la rueda.** El código del proveedor de 5.0.3 hace `hover` y luego `context.page.mouse.wheel` (spec, «Lo que se verificó del modo navegador»), así que `userEvent.wheel` debería desplazar como la rueda real. Se prueba con un contenedor `overflow: auto` dentro del iframe; solo si no desplaza, se escribe una orden propia (`browser.commands`) con `page.mouse.wheel`. Anotar el resultado en `src/testing/CLAUDE.md`, con fecha: si ninguna desplaza, las cinco pruebas con rueda de la lista del spec se quedan en e2e (11 e2e en lugar de 6).
- [x] **El experimento del ancho.** Con `page.viewport(390, 844)` una `@media (max-width: 900px)` debe cambiar de valor; si no, las pruebas de 390 px usan un iframe de ese ancho puesto por la prueba.
- [x] Extender la regla de lint y su prueba.

**Tests:**
- `src/testing/browser.browser.test.tsx`: `measures the real box of an element, which jsdom cannot`.
- `src/testing/browser.browser.test.tsx`: `page.viewport changes the width that the media queries of the game read`.
- `src/testing/browser.browser.test.tsx`: `a wheel over a scroller moves it by the wheel and not by scrollIntoView`.
- `src/testing/browser.browser.test.tsx`: `the stylesheet and the tokens of the game are loaded in the browser project`.
- `scripts/package-scripts.test.ts`: `check runs check:fast, then the browser tests, then the e2e suite, and check:fast has no browser step`.
- `scripts/eslint-config.test.ts`: `a browser test that waits a fixed time is rejected`.

**Cierre:** `pnpm check` completo en verde. `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Anotar el tiempo de `pnpm test:browser` con estas pruebas (es la primera medida real del modo navegador). **Commit:** `test: run the browser tests of Vitest in Chromium beside the unit tests`.

---

### Tarea M2: Métricas de las etiquetas

**Presenta:** `src/scene/map2d/` y `layout/`. **Depende de:** M0.

**Archivos:**
- Create: `src/scene/map2d/CLAUDE.md`, `src/scene/map2d/layout/CLAUDE.md`, `layout/metrics.ts` y `metrics.test.ts`.

**Contrato:** `CELL` (7,2 px: 0,6 em con 12 px), `LABEL_PAD` (14), `LABEL_HEIGHT` (20), `labelWidth(texto, { locked, alert })` (el candado suma 26 px y el aviso 22, valores de partida derivados del CSS que M21 mide y corrige), `labelLines(texto de un firewall)` (parte en el nombre del término y el nombre del recurso) y la caja de una etiqueta de dos líneas. La guía de la carpeta cita la fuente de los 0,6 em (el archivo de Plex Mono v20 leído con `fontTools` el 2026-10-12, spec «El ancho de las etiquetas») y los 0,602 y 0,618 de Menlo y SF Mono.

**Tests:**
- `a label is as wide as its characters times 7.2 px plus 14 px`.
- `an arrow takes one character`.
- `a locked label is as wide as its text plus the lock, and a label with the alert as wide as its text plus the alert`.
- `a label of two lines is as wide as its longer line and 36 px tall`.
- `the label of a firewall splits into the name of its term and the name of its resource`.
- `every name of every registered world and incident is at most 32 characters`.
- `the label of 32 characters is 245 px wide`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): measure the labels of the 2D map from the width of a monospaced character`.

---

### Tarea M3: El grafo de enlaces y las estaciones

**Presenta:** `stationsFor`, el sustituto de `pathFor`. **Depende de:** M2.

**Archivos:**
- Create: `layout/graph.ts`, `graph.test.ts`, `stations.ts`, `stations.test.ts`.
- Not modified: `src/scene/layout.ts` (el 3D sigue usando su `pathFor`).

**Contrato:**
- `Graph` (nodos con nombre y punto; aristas con codos opcionales), `route(grafo, estaciones)` con el camino más corto y desempate por el orden de los nodos, y `positionAt` y `lengthOf` (los de `pointAt` y `cumulativeLengths`, que se portan sin cambio de lógica).
- `stationsFor(trace, packet, drawn, { hiddenStop })`: las mismas ramas que `pathFor` de hoy, con una estación donde hay un punto (tabla del spec, «Piezas, enlaces y estaciones»), y las estaciones nuevas `bus-end` y `mid`.

**Tests:**
- Las unas 35 pruebas de `pathFor` de `src/scene/layout.test.ts` (los `describe` `pathFor`, `pathFor in an office`, `pathFor when a firewall the player does not know stops the packet`, `pathFor in an office with routers`, `a packet that dies at the NAT of the office` y `pathFor of a datagram that gets a Port Unreachable`) **se portan con su mismo nombre** y comparan listas de estaciones en lugar de puntos. Se listan con `grep -n "pathFor" src/scene/layout.test.ts` al empezar.
- `route finds the shortest way between two stations along the links`.
- `route breaks a tie by the order of the nodes, so the same graph gives the same way`.
- `a bend of a link is part of the route`.
- `a route to a station that does not exist throws`.
- `a packet to an IP that no device has runs to the end of the bus of its network`.
- `a packet that a router the map does not draw dropped ends half way between the two stops around it`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): name where a packet stops in the 2D map by stations along a graph of links`.

---

### Tarea M4: La fila

**Depende de:** M2, M3.

**Archivos:**
- Create: `layout/arrange/CLAUDE.md`, `arrange/groups.ts` y `groups.test.ts` (pisos, filas, buses y troncos), `arrange/row.ts` y `row.test.ts` (la oficina, el router, internet, los carriles de servidores y clientes).

**Contrato:** `layoutRow(world, pieces, densidad)` con las constantes del spec (tabla de valores de partida del prototipo: fila de 100 px, carril de 100 px, tronco de 44 o 32 px, hueco entre router e internet derivado del ancho de las etiquetas, carril de 66 o 52 px, relleno de grupos). Da grupos, enlaces, nodos, estaciones, marcas (con su eje y sus casillas), cajas de etiquetas y de piezas. **No lee los envíos del jugador.**

**Tests** (los portados de `layout.test.ts` que hablan de disposición, con su nombre; unas 40):
- `lays out one column per LAN that has a drawn piece` (ahora, una caja de piso).
- `puts a box under each floor, with a gap between boxes, and the box of the office around them when there are two or more`.
- `lays out the drawn routers along the main line between the office and the internet, in order`.
- `orders the routers from the one the pieces say is in the office outward, whatever order the world lists them`.
- `a server of the internet stands past the last drawn router`.
- `a device that is not connected stands outside the boxes`.
- `gives a spot only to the pieces it is given`.
- `a floor with no drawn piece has no box and no name`.
- `the name of a floor shows its block only when cidr is known`.
- `the size of the office does not depend on what is drawn on it`.
- `the place of the office depends only on the pieces its incident draws`.
- `a router after the first that faces a box the map draws stands in a second group below the office`.
- `the outline of the block surrounds exactly the rows marked inside and no other row`.
- `the outline grows when a piece is marked inside and shrinks when it is not`.
- `servers and clients are lanes of 100 px centered on the main line`.
- Nuevas: `a mark stands 22 px before the piece where a packet ends and on the point where it ends on a link`, `two marks of one link are at least 40 px apart`, `every mark says the axis along which its fan opens and how many casillas fit`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): lay out the 2D map in a row with floors, a main line and lanes`.

---

### Tarea M5: La serpiente y el modo

**Depende de:** M4.

**Archivos:**
- Create: `arrange/stack.ts` y `stack.test.ts`, `layout/map-layout.ts` y `map-layout.test.ts`.

**Contrato:** `layoutStack(world, pieces, ancho)` (spec, «La serpiente») y `layoutMap(world, pieces, { width })`, que elige fila normal, compacta o serpiente por lo que cabe y devuelve el modo.

**Tests:**
- `chooses the row when its natural width fits, the compact row when only that fits and the snake otherwise`.
- `the same world and the same width give the same layout`.
- `the snake runs the way out from right to left under the office`.
- `with two floors their trunks run in parallel, 8 px apart, to the router`.
- `at 360 px no label, piece, box or mark of any registered incident leaves the map`.
- `the longest name of the registered worlds fits a lane of the snake at 360 px`.
- `a world drawn whole keeps the size and the place of everything else`.
- `below 360 px the layout keeps 360 px wide`.
- `the mode flips only where the natural width of the row is`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): wrap the 2D map into a snake when the row does not fit and choose the mode by what fits`.

---

### Tarea M6: El abanico, las etiquetas de paquete y las colisiones

**Presenta:** O-4 = G en 2D. **Depende de:** M4, M5. Sustituye la parte de escena de la Tarea 28 quinquies (commits 1, 2 y el modelo del ancho).

**Archivos:**
- Create: `marks/CLAUDE.md`, `marks/stamp-fan.ts` y `stamp-fan.test.ts`, `marks/packet-tags.ts` y `packet-tags.test.ts`, `marks/collisions.ts` y `collisions.test.ts`.

**Contrato:**
- `fanStamps(sellos por lugar, marcas)`: cuántas casillas caben, cuáles se ven, dónde está cada uno y el «+N»; con la prioridad de los sellos con problema y el orden por antigüedad (`send`); los flujos vivos son más antiguos que todo lo que el jugador manda.
- `placeTags(caminos, obstáculos)`: la etiqueta de un paquete, sobre su camino y fuera de sellos, etiquetas de pieza, cajas y otras etiquetas, subiendo o bajando de 22 en 22 px (tres arriba y dos abajo). La etiqueta de un sello escondido en un «+N» no se dibuja quieta (O-8).
- `collisions(layout, sellos, etiquetas)`: los pares que se pisan, con la excepción de dos sellos del mismo abanico.
- `separateGlyphs`: dos formas de paquete en un mismo punto se corren 12 px a lo largo de su camino.

**Tests** (los de `src/scene/marks/stamp-fan.test.ts` de la Tarea 28 quinquies, con su nombre, adaptados al abanico a lo ancho del enlace; los que hablaban de la altura de cada punto y del pasillo entre etiquetas vecinas se reemplazan por estos):
- `a place whose stamps all fit draws every stamp, 25 px apart across the link and centered on its mark`.
- `a mark holds three casillas and a stamp of a fourth makes the last casilla a «+N» that counts the rest`.
- `a lone stamp is never moved, hidden or counted`.
- `a stamp with a problem stays in sight while a stamp with no problem can go into «+N»`.
- `among stamps of the same kind the oldest go into «+N»`.
- `with more problem stamps than casillas the oldest problem stamps go into «+N»`.
- `the live flows of an incident are older than every packet the player sent, and a combination sent again is as new as its last send`.
- `«+N» is the last casilla of its mark and counts at least two stamps`.
- `the list of a «+N» holds every stamp of the place, the drawn ones too`.
- `two stamps of different marks of one link never come closer than their own boxes`.
- `the label of a packet moves clear of a stamp, of the label of a piece, of a box and of another label, along its link first and then up or down`.
- `a label that nothing touches does not move`.
- `the label of a hidden stamp is not drawn on the still map and its text is in the list`.
- `two glyphs on one point are 12 px apart along their path`.
- `collisions lists a stamp over a label and ignores two stamps of one fan`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): fan the stamps of a place across its link up to what fits, with +N, and keep the labels of packets clear`.

---

### Tarea M7: La mitad de `game` y `copy` de «+N»

**Presenta:** lo que la Tarea 28 quinquies hacía en `copy` y en `game` (commit 3, sin la escena). **Depende de:** M0; no depende del layout. Va aquí para que M12 la use.

**Archivos:**
- Modify: `src/copy/packet-labels.ts` y `packet-labels.test.ts` (`stampOf`, `isProblemStamp`), `src/copy/index.ts`, `src/copy/screens/incident-ui.ts` (el título de la lista, la línea de cada sello, el nombre accesible de «+N»), `src/game/view/piece-id.ts` (`PIECE_ID.stamps(ids)` y su lectura), `src/game/view/inspection.ts` y `inspection.test.ts` (el caso `stamps`; `Inspection.entity` opcional), `src/ui/incident/inspection-box.tsx` (dibuja el icono solo si existe), `src/scene/traffic/flow-look.ts` (usa `stampOf`; es puro y lo comparten el 3D y el 2D), `src/copy/CLAUDE.md`, `src/game/view/CLAUDE.md`, `src/ui/incident/CLAUDE.md`.
- Folder caps: no suma archivos planos a `src/game/`, `src/game/view/` ni `src/copy/`.

**Tests** (los de la 28 quinquies, con su nombre):
- `a stamp is a problem when it is blocked, lost, warned or an intruder, and not when it arrived`.
- `the state of a stamp comes from the result as it did before it moved here: a warning first, then reached, an intruder if it was not meant to, then blocked or lost`.
- `the id of a list of stamps reads back into the ids of its packets`.
- `no id of a packet of any registered incident holds the separator of the id of a list of stamps`.
- `a list of stamps shows one field per packet, newest first, with its label and how it ended`.
- `a list of stamps whose packets are gone inspects nothing`.
- `the list of stamps has no entity and its title counts the stamps`.
- Revisor `sonnet` de textos: el título («N sellos juntos», decidida 50 de la Tarea 28 quinquies) y el nombre accesible.

**Cierre:** `pnpm check` completo (cambia lo que dice la caja solo si hay un «+N», que el 3D no dibuja: ningún texto de hoy cambia). `git diff --exit-code src/levels/04-iaas/golden-traces.json`. **Commit:** `feat(game): list the stamps of a place for the +N stamp`.

---

### Tarea M8: Las tarjetas en píxeles y el barrido de todos los incidentes

**Depende de:** M5, M6, M7.

**Archivos:**
- Create: `cards/CLAUDE.md`, `cards/placement.ts` y `placement.test.ts`, `src/ui/incident/map-sweep.test.ts`.
- Not modified: `src/scene/layout.ts` (sigue siendo la del 3D).

**Contrato:**
- `cards/placement.ts` porta las funciones que ya trabajan en píxeles (`terminalSide`, `dockOffset`, `cardTop`, `sideHeight`, `dockHeight`, `dockRoom`, `cardSpan`) y escribe `cardPlacement` desde las cajas del layout, no desde una proyección de la cámara. Las constantes (`CARD_WIDTH` 300, `LABEL_REACH`, `TITLE_BAR` 56, los márgenes) pasan sin cambio.
- `map-sweep.test.ts` compone `game` y `scene` como `stamp-states.test.ts`.

**Tests:**
- Los de `layout.test.ts` de las tarjetas (los `describe` `the terminal card in the office with no outside drawn`, `... with the outside drawn`, `the room of a card docked in the corner` y `where a card opens`, unas 20), portados con su nombre y con las cajas del layout.
- `placement.test.ts`: `a card opens on the side with more room and never covers a label`, `a card docks in the corner when neither side keeps it inside the map`, `the card of a firewall keeps its wide gap and its width`.
- `src/ui/incident/map-sweep.test.ts`: `in no registered incident does any label, stamp, packet label, name of a box or piece overlap another, at 360, 390, 768, 900, 1060, 1280 and 1440 px` (para cada incidente con `send`, cada combinación que ofrecen sus fichas, y para los que tienen flujos, el mundo de partida y el resuelto).
- `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»` (el centinela de J16; **si falla hoy, se para y se informa**: no se agrega ninguna excepción por cuenta propia).
- `in no registered incident does a place hide a hundred stamps or more`.
- `the reading order of the map is top to bottom and left to right, by piece, with its stamps beside it`.

**Cierre:** `pnpm check` completo (cierra el bloque del layout puro, M2 a M8). Anotar cuántos incidentes y estados recorre el barrido y cuánto tarda. **Commit:** `feat(scene): place the cards of the 2D map in pixels and sweep every incident for overlaps`.

---

### Tarea M9: La bandera, la capa y los grupos con sus enlaces

**Presenta:** `GameScene2D`. **Depende de:** M5.

**Archivos:**
- Create: `src/scene/renderer.ts`, `src/scene/map2d/map-stage.tsx` y su prueba, `src/scene/map2d/game-scene.tsx`, `src/scene/map2d/entities/CLAUDE.md`.
- Modify: `src/scene/index.ts` (elige entre `GameScene3D` y `GameScene2D`; los 3D siguen siendo los de hoy, sin tocar), `src/ui/incident/incident-screen.tsx` (una clase `incident--map2d` cuando el mapa es 2D), `src/styles.css` (`.map-stage` y `.incident--map2d` con la fila del mapa en `auto` en el teléfono; la capa HTML es la misma `.html-layer`, con `overflow: clip`), `src/scene/CLAUDE.md`.
- Folder caps: `src/scene/` queda en 12 de 12.

**Contrato:** `MapStage` mide su contenedor (con `useElementSize` de `@mantine/hooks`), llama a `layoutMap` con ese ancho, dibuja un `<svg aria-hidden>` con el `viewBox` del layout y una capa HTML `.html-layer` encima, y se centra bajo la barra del título. **La capa conserva las clases que leen los ayudantes de e2e y la caja de inspección** (`.html-layer`, `.map-button`, `button.stamp`, `.caption`, `.map-card`, y `.packet-tag` en el grupo SVG de la etiqueta de un paquete: M13). Esta tarea dibuja los grupos con su nombre, los enlaces y las marcas. Ningún otro renderer de `GameSceneProps` cambia.

**Tests:**
- `the svg is hidden from screen readers and the overlay is what they read`.
- `the viewBox is the size of the layout and the layout takes the width of its container`.
- `a group is a dashed box with its name, and the name shows the block only when cidr is known`.
- `the map is centered in its box and drawn under the title bar`.
- (c) `at 390 px the map is as wide as its container and the page does not scroll sideways`.

**Cierre:** `pnpm check:fast`; el mismo `pnpm check` que B0 con la bandera en `3d`; a mano, `VITE_MAP_RENDERER=2d` en un puerto propio. **Commit:** `feat(scene): draw the groups and links of the 2D map behind a build flag`.

---

### Tarea M10: Las piezas en SVG

**Depende de:** M9.

**Archivos:**
- Create: `src/scene/map2d/entities/{device,firewall,edge,internet,actor,network}.tsx` y sus pruebas donde el estado lo pida.
- Reusa `EntityIcon` y los iconos del catálogo (`src/scene/entities/`, sin tocarlos): la pieza es el icono más grande, con `vector-effect: non-scaling-stroke`. **Nuevo:** el frente del router (caja con antenas) y del Internet gateway (caja sin antenas).

**Tests:**
- `every entity of the catalog has a 2D piece in every variant`.
- `a firewall bar turns to danger while it blocks and keeps its shape`.
- `a selected firewall draws a thicker bar without animations and pulses with them`.
- `a device with a forbidden packet drawn without animations has a double border`.
- `a device with a forbidden packet shakes with animations`.
- `a selected device stands on a shaded mat`.
- `the router and the Internet gateway differ by their antennas`.
- `every piece is hidden from screen readers: its label is what they read`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): draw the pieces of the 2D map as the icons of the catalog, larger`.

---

### Tarea M11: Etiquetas y nombres de grupo

**Depende de:** M10, M7.

**Archivos:**
- Create: `src/scene/map2d/overlay/CLAUDE.md`, `map-labels.tsx`, `group-captions.tsx` y sus pruebas.
- Reusa `src/scene/overlay/piece-label.tsx` (`PieceLabel` y `MapPiece`), sin tocarlo.
- Modify: `src/copy/screens/incident-ui.ts` (`MAP_TEXT.groups`: el nombre de la oficina, de un piso y de un VPC, cada parte con su término), `src/copy/CLAUDE.md`, y `src/styles.css`: `.map-stage { --font-mono: 'IBM Plex Mono', Menlo, Consolas, monospace }`, que redefine el token solo dentro del mapa. **`tokens.css` no cambia:** las capturas de tolerancia cero del catálogo y las líneas de código de las tarjetas siguen igual hasta M18.

**Tests:**
- `a label stands where the layout puts it, with its width`.
- `the label of a firewall is in two lines: its term and its resource`.
- `every label is a button with the name, the lock and the alert it has today`.
- `the names of the groups say only what the player knows`.
- `the reading order of the buttons is the order of the map`.
- `the monospaced font of the map has no ui-monospace and the global token is the one it was`.
- Las de `piece-label.test.tsx` corren sin editarse.
- Revisor `sonnet` de textos: los nombres de los grupos.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): place the labels and names of groups of the 2D map from the layout`.

---

### Tarea M12: Los sellos

**Depende de:** M6, M7, M11.

**Archivos:**
- Create: `src/scene/map2d/entities/stamp.tsx` (el botón del sello y `StampMore`; se exporta el botón sin capa para probarlo en jsdom) y `stamp.test.tsx`, `src/scene/map2d/overlay/map-stamps.tsx` y su prueba.
- Modify: `src/styles.css` (`.stamp--more` y `.stamp--tight`, solo con tokens).

**Contrato:** `MapStamps` recibe los sellos que ya computa el tráfico, los reparte con `fanStamps` y los pone con `trigger(pieceId)`; «+N» usa `PIECE_ID.stamps`. El sello bajo el puntero o con el foco sube al frente.

**Tests** (los de la Tarea 28 quinquies para el botón, con su nombre):
- `«+N» is a button with the class of a stamp, its number as text and the name of its list`.
- `«+N» wears the smaller letter from ten hidden stamps and the usual one below`.
- `hovering, focusing and clicking «+N» call the trigger of its list, as a stamp does of its packet`.
- `three stamps of one place stand 25 px apart across the link and a fifth makes «+3»`.
- `the stamp under the pointer or with the focus comes to the front and «+N» stays on top otherwise`.
- `a stamp tells a screen reader its packet and how it ended`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): draw the stamps of the 2D map in a fan with a +N stamp`.

---

### Tarea M13: Los paquetes quietos y sus etiquetas

**Depende de:** M6, M10.

**Archivos:**
- Create: `src/scene/map2d/traffic/CLAUDE.md`, `still-trace.tsx` y su prueba, `packet-tag.tsx` y su prueba.
- Reusa `src/scene/traffic/flow-look.ts` (puro) y los trazados de `PACKET_ICON_PATH` y de la forma del aviso.

**Tests:**
- `a still scene draws the trace of every packet, with its shape halfway and a ring near its start when it was answered`.
- `a blocked trace is in danger, a lost one is dashed and a warning of the sender stands at the end of the path`.
- `the shape of a packet says its protocol and its border says its role`.
- `a packet with ports wears a label in SVG, in a group with the class packet-tag, whose text length is its computed width`.
- `a still scene draws one packet-tag per packet with ports: the one of the leg where it stands`.
- `the label of a packet is the one of the leg where the packet stands`.
- (c) `the label of a packet is as wide as the model says whatever font draws the arrow`.

**Cierre:** `pnpm check:fast`. **Commit:** `feat(scene): draw the still traces of the packets of the 2D map and their labels`.

---

### Tarea M14: Los paquetes en vuelo

**Depende de:** M13.

**Archivos:**
- Create: `src/scene/map2d/traffic/flight-plan.ts` y su prueba, `flight.tsx` y su prueba, `traffic.tsx`.

**Pasos:**
- [ ] **Antes de seguir**, una prueba mínima en jsdom que monte un `animateMotion` con `keyPoints`, `keyTimes`, `calcMode` y `repeatCount` desde React y mire los atributos del DOM. Si React 19 no los pasa tal cual, se para y se informa (riesgo del spec).
- [ ] El plan puro primero, con TDD; el componente después.

**Contrato:** `flightPlan(camino, final, espera)` da la duración, los `keyTimes`, el instante del cambio de etiqueta y los finales; la velocidad es 120 px/s; un flujo cuyo viaje dura más que su período dibuja `ceil(viaje / 3,5)` copias; cada envío es un grupo con `key` igual a su número de envío y `begin` igual a su espera. Con `still` no hay elementos de animación.

**Tests:**
- `a packet travels its path at 120 px per second`.
- `an answered packet comes back as the ring of its protocol along the same path`.
- `a warning from a router comes back along the path from that router`.
- `a warning that the sender's own device generates does not travel and appears at the end of the path`.
- `a blocked packet bursts for half a second`.
- `a lost packet shrinks away for half a second`.
- `the label of a translated packet changes where the router that translates stands on the path, and the reply wears the ports swapped`.
- `a flow whose trip lasts longer than its period draws one copy more, shifted by the period`.
- `a send that waits for another begins when the answer of the other is back at its sender`.
- `without animations nothing is animated`.
- (c) `at an exact instant the packet is where the plan says, to half a pixel` (con `pauseAnimations()` y `setCurrentTime(t)`).
- (c) `the label of a translated packet changes at the router` (la de `chapter-2.spec.ts`).

**Cierre:** `pnpm check:fast` y `pnpm test:browser`. **Commit:** `feat(scene): fly the packets of the 2D map with SMIL and plan their times in a pure function`.

---

### Tarea M15: Las tarjetas y la pantalla

**Depende de:** M8, M9, M11.

**Archivos:**
- Create: `src/scene/map2d/overlay/card-anchor.tsx` y su prueba.
- Modify: `src/ui/incident/incident-screen.tsx` si hace falta (el nombre de lo que pasa a la escena no cambia), `src/styles.css`.

**Contrato:** `CardAnchor` pone la tarjeta en píxeles con las variables CSS de hoy (`--card-gap`, `--card-width`, `--card-x`, `--card-y`, `--card-top`, `--card-room`), una vez por layout. `MAP_MARKS` y `MAP_CARD` siguen existiendo para la caja de inspección.

**Tests:**
- `the card of a piece opens beside its label on the side with more room`.
- `the card docks in the corner when neither side keeps it inside the map`.
- `the card never covers the label of a piece the player compares`.
- `the card keeps its place when the container changes size and the layout changes mode`.
- (c) `a card opened on a narrow map never scrolls the layer of the labels`.
- (c) `a card beside a piece stays inside the map, with its foot in view, at 390 px and at 1280×360`.

**Cierre:** `pnpm check:fast` y `pnpm test:browser`. **Commit:** `feat(scene): anchor the cards of the 2D map in pixels`.

---

### Tarea M16: El catálogo

**Depende de:** M10, M12, M13.

**Archivos:**
- Create: `src/scene/map2d/catalog/catalog-cells.tsx` y `catalog-scene.tsx`.
- Modify: `src/scene/index.ts` (el catálogo también cambia con la bandera), `src/ui/catalog/entities-page.tsx` si hace falta.

**Contrato:** una cuadrícula de 5 columnas de especímenes en SVG con su leyenda; los especímenes nuevos («+2» y «+12») entran aquí.

**Tests:**
- `the catalog draws every entity in every variant and state with its caption`.
- `the specimens of «+2» and «+12» are in the catalog`.
- `every specimen of the 2D catalog is hidden from screen readers and its caption is its name`.
- Las de `src/ui/catalog/entities-page.test.tsx` corren sin editarse.

**Cierre:** `pnpm check` completo (cierra el bloque de las piezas, M9 a M16). **Commit:** `feat(scene): draw the entity catalog in 2D behind the flag`.

---

### Tarea M17: La paridad

**Depende de:** M16.

**Pasos:**
- [ ] **Paso 0: el ayudante que lee el lienzo.** `tests/e2e/map-boxes.ts` tiene `drawnBox`, que hace `page.locator('canvas')` y cuenta los píxeles opacos; es el único lugar de `tests/` que lo hace (`grep -rn canvas tests` lo comprueba) y lo usan `outsideTheArea` y, por él, las pruebas de «el mapa cabe». Con el 2D no hay lienzo y esas pruebas fallarían por el ayudante y no por un defecto. Se edita `drawnBox` para que, cuando la página no tenga `canvas`, mida el contenido del SVG del mapa (su `getBBox` llevado a la página) y diga que está cortado si toca el borde del SVG. Es un cambio de un ayudante, no de una prueba, y va en su propio commit, con la bandera en `3d` (con el 3D se comporta igual).
- [ ] `VITE_MAP_RENDERER=2d pnpm e2e` sobre el árbol de M16. Se guarda el log. Nunca dos suites a la vez.
- [ ] Cada rojo se clasifica: (1) una de las 7 pruebas que el spec marca como «se borran», una captura de `#/entidades`, o una que lee la etiqueta de un paquete **en vuelo** (`a translated packet changes its label at the router, from the private source port to the public one` y la del tramo de la respuesta: en el DOM del 2D están las dos etiquetas de tramo y SMIL muestra una, así que el conteo y el texto de `.packet-tag` cambian; M14 las reemplaza por una del navegador); (2) un defecto del 2D. Una prueba que mide una cosa de 3D y no es de esas se anota y se pregunta, no se edita.
- [ ] Los defectos del 2D se arreglan en el código del 2D, con una prueba de la capa que lo atrape (pura, jsdom o navegador).
- [ ] Un recorrido a mano con capturas reales, a 390 px y a 1280×800, de 01-08, 02-03 con 5 sellos, 02-07, 02-09 y 04-01 (la sesión principal las usa en la página de las «para revisar»).
- [ ] Con la bandera en `3d`, `pnpm check` sigue en verde.

**Cierre:** el log de la paridad, la lista de las pruebas que fallaron y por qué, y las capturas, guardados en el scratchpad (no se commitean). Los arreglos van en commits `fix(scene): …`. No hay commit propio de la tarea.

---

### Tarea M18: El cambio

**Depende de:** M17 en verde. La decisión del aspecto (si ya existe).

**Archivos:**
- Modify: `src/scene/renderer.ts` (el valor por defecto pasa a `2d`), `tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png` (se regraban a propósito), `DESIGN.md` (las menciones del mapa), `README.md`.

**Pasos:**
- [ ] Cambiar el valor por defecto en un commit de una línea.
- [ ] Regrabar las dos capturas con `pnpm exec playwright test entities --update-snapshots=all` y revisar el diff: la de piezas cambia por completo (es otro arte); la de la interfaz solo cambia si el catálogo ganó o perdió una fila.
- [ ] `pnpm check` completo: pasa sin las 7 pruebas que el spec marca como «se borran», que ya no pasan y se borran en M19 a M23.

**Cierre:** `pnpm check` completo con esas 7 como único rojo conocido, anotado en el cuerpo del commit para quien haga `bisect`. **Commits:** `feat(scene): make the 2D map the one the game draws` y `test(e2e): record the captures of the 2D catalog`.

### Tarea M18 bis: El aspecto oscuro (solo si el estudiante elige B)

**Depende de:** la decisión del estudiante.

**Archivos:** `src/design/tokens.css` (un bloque oscuro con los valores del spec, bajo `prefers-color-scheme` y `data-theme`), `src/design/tokens.test.ts` (los pares de contraste del spec, en el oscuro), `DESIGN.md` (la decisión de «un solo tema» pasa a «dos temas»), las capturas del catálogo en oscuro.

**Tests:** `every colour role has a dark value and every text and non-text pair reaches its contrast in the dark theme`, `the map and the cards read the same roles in both themes`. **Commit:** `feat(design): add the dark theme with the same colour roles`.

---

### Tarea M19: Las pruebas puras (capa a)

**Depende de:** M18.

**Archivos:**
- Create: casos nuevos en `src/ui/incident/map-sweep.test.ts` y pruebas en `src/scene/map2d/layout/`.
- Delete: de `tests/e2e/chapter-1/chapter-1.spec.ts` y `tests/e2e/chapter-2/chapter-2.spec.ts`, las 30 pruebas de la capa (a) del spec: `in 10 the question about the broken stretch cannot be answered from the map before a traceroute...`, las cinco de solapes de cada ventana del capítulo 1 y las tres de que el mapa cabe (unas 16), `in 02-04 placing a device inside the block draws it inside the outline...`, y las seis de solapes del capítulo 2 en dos ventanas (12).

**Tests:** cada prueba borrada tiene su equivalente en el barrido de M8 o en una prueba nombrada de abajo, que se escribe **antes** de borrar la e2e, con el mismo nombre acabado en el estado que prueba:
- `in 05 the warning for 192.168.1.50 appears at the doorstep of your own laptop and does not travel`.
- `after the pings of 08 the lost ping stands between the router and the internet, and no label or stamp overlaps`.
- `after the four tests of case 1 of 14 no stamp lies over a label or covers another beyond the step of the fan`.
- `in 01-10, before the traceroute, the lost ping stands at the doorstep of tu-laptop and the routers wait for a traceroute`.
- `in 02-04 placing a device inside the block moves the outline by the distance between rows, and moving it out takes it back`.
- `in 02-07 the map fits the area at 1060 px and at 900 px, with nothing sent and with the three pings`.
- `in 02-09 and 02-10 no label or stamp overlaps, with the stamps that show and the ones that «+N» counts`.

**Cierre:** `pnpm check:fast`; `pnpm e2e` (las que quedan). **Commit:** `test(scene): replace the geometry e2e tests of the chapters with pure ones`.

---

### Tarea M20: Las pruebas de componentes (capa b)

**Depende de:** M18.

**Archivos:**
- Create/Modify: `src/ui/incident/incident-screen.test.tsx`, `src/app.test.tsx`, `src/ui/roadmap.test.tsx`, `src/ui/catalog/entities-page.test.tsx`, `src/scene/map2d/entities/stamp.test.tsx`.
- Delete: de e2e, las 22 pruebas de la capa (b) del spec.

**Tests** (nombres exactos, en jsdom con Testing Library y user-event; cada una con el nombre de la e2e que reemplaza cuando no se repite):
- `the roadmap lists the fourteen incidents of chapter 1 with their stars`.
- `chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star`.
- `04-01 stays locked after 01-14 has a star and opens after the last built incident of chapter 2 has one`.
- `04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it`.
- `in 05 the stamp of the ping to laptop-marta tells a screen reader that it was lost, not blocked`.
- `in 11 the stamp of the ping to laptop-marta tells a screen reader that the firewall blocked it`.
- `in 07 picking the gateway in the Ajustes de red tab changes the stamps of the ping`.
- `in 13 the tabs Entrada and Salida of the firewall card are reached and switched with the keyboard`.
- `chapter 2 opens at 02-01 once 01-14 has a star and 04-01 stays closed`.
- `in 02-01 the packet of an nc wears the port it goes to, and the ping wears no label`.
- `in 02-02 the packet of an nc wears TCP and both ports, and the second connection leaves from the next port`.
- `in 02-03 a refusal leaves the stamp Llegó and a silence leaves Bloqueado, and the four tests wear TCP and both ports`.
- `the still drawing of a translated packet shows the label of the leg where the packet stands`.
- `starts checked from the system preference, and both incidents still reach 3 stars`.
- `an intrusion shows its alert inside the label of the device`.
- `a locked incident does not open from its URL`.
- `focus goes to the card heading when a Security Group opens, and back to it on Escape`.
- `sending with Anywhere-IPv4 open gets Lucía's reply, and with the card still open the fix closes it and focuses the question`.
- `an unknown incident leads back to the roadmap`.
- `the specimens of the outline of the block and of the intruders are in the catalog`.
- `the entity catalog also runs with its animations, without errors`.
- `the roadmap does not link to the entity catalog`.

**Cierre:** `pnpm check:fast`; `pnpm e2e`. **Commit:** `test(ui): move the behaviour tests of the incident screens from e2e to Testing Library`.

---

### Tarea M21: Las pruebas del navegador del juego (capa c, primera parte)

**Depende de:** M1, M18.

**Archivos:**
- Create: `src/ui/incident/card-layout.browser.test.tsx` (las escenas de tarjetas; el montaje `renderScene(incidente, jugadas)` monta `IncidentScreen` con el CSS real y juega las jugadas con el mouse, sin red ni compilación), `src/ui/incident/map-boxes.browser.test.tsx`, `src/scene/map2d/layout/label-width.browser.test.tsx`, `src/ui/roadmap.browser.test.tsx`.
- Delete: de `card-layout.spec.ts`, las 7 pruebas de la capa (c) (y las 3 de `standStill`, ya sin objeto); de `chapter-1.spec.ts`, las 11; de `incidents.spec.ts`, las 21; de `chapter-2.spec.ts`, la de la etiqueta que cambia (ya cubierta en M14); de `roadmap.spec.ts`, la del teléfono.
- Modify/Delete después: `tests/e2e/card-boxes.ts` y `tests/e2e/map-boxes.ts` pasan a `src/testing/` (ayudantes del navegador) o se borran.

**Tests** (las de hoy, con su nombre y sus escenas `MAP_SCENES`; `it.each` por ventana de 390, 1000×700, 700×600, 844×460, 1280×360, 1280×720 y 1440×900):
- `no card is clipped and cards never overlap, at 390 px and at desktop width`.
- `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`.
- `the tab of a Message in the cards of the game covers nothing of the element above it`.
- `the last element of every card can be reached by scrolling on a low screen` (con la rueda, o con el trazo del contenedor si M1 dijo que la rueda no sirve).
- `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view`.
- `the body of the card that classifies scrolls to its last bin, under the mouse, and its foot stays in view`.
- `in 01-01 the open card of the printer covers none of the pieces the player compares`.
- `in 01-02 the open terminal covers neither the printer, nor laptop-marta, nor the packet once sent`.
- `in 01-07 the open settings card covers none of the pieces of the office`.
- `at 1280×800, after a traceroute, the terminal keeps Enviar and Listo in view`.
- `in 06 the open terminal covers neither the router nor the labels of the second floor`.
- `in 10 the open terminal, with the traceroute listed, covers neither the globe nor the server`.
- `the inspection box of <piece> lies inside the window and covers no label or stamp` (las 18 de `incidents.spec.ts`, una prueba con 18 casos).
- `labels and stamps do not overlap, and the open card does not cover its Security Group`.
- `the inspection box floats inside the window and covers no label or stamp`.
- `a term shows its definition inside the window, also from a chip of the open card`.
- `the roadmap fits a phone screen, without a horizontal scroll`.
- `the width of every label of every registered incident, those with a lock or an alert included, is never more than the model says and is at most 2 px under it` (aquí se miden y se fijan los 26 px del candado y los 22 del aviso).
- `the font of the labels of the map advances 0.6 em in the browser of the tests`.

**Cierre:** `pnpm check:fast`, `pnpm test:browser` y `pnpm e2e`. Anotar el tiempo de `pnpm test:browser` con estas pruebas. **Commit:** `test(browser): move the geometry tests of the cards and the map from e2e to Vitest in the browser`.

---

### Tarea M22: Las pruebas del navegador del sistema de diseño (capa c, segunda parte)

**Depende de:** M21.

**Archivos:**
- Create: `src/ui/catalog/entities.browser.test.tsx` y `src/design/primitives/primitives.browser.test.tsx`.
- Delete: `tests/e2e/entities.spec.ts` y `tests/e2e/snapshots/` (las capturas pasan a `__screenshots__` junto a las pruebas, con tolerancia cero: `allowedMismatchedPixelRatio` y `allowedMismatchedPixels` en 0).

**Tests** (las 14 de `entities.spec.ts` de la capa (c), con su nombre):
- `the entity catalog draws every entity in every variant and state as recorded`.
- `the interface elements are drawn in every variant and state as recorded, with the focus ring on an option`.
- `the primary button looks like a stamp and does not move when pressed under reduced motion`, `the disabled primary button keeps the tilt of the stamp and does not move when pressed`, `without reduced motion the pressed primary button moves 2 px down and keeps its tilt`.
- `the options of the interface specimen show the letters A, B and C and keep their sentence as their accessible name`.
- `the interface specimen of Table is part of the capture`, `the focus ring of a remove button fits inside the wrapper of the Table`, `a long Table in a card on the map stays inside the card and scrolls there`.
- `the interface specimen of the output card is part of the capture`, `an unfolded output in a card on the map stays inside the card, scrolls in its body and keeps the foot in view`.
- `the interface specimens of Message are part of the capture`, `each variant of Message is told apart by a mark or a border shape and not only by colour`, `the tab of a Message sticks out above its frame without covering the message above it`.

**Cierre:** `pnpm check:fast`, `pnpm test:browser`, `pnpm e2e`. **Commit:** `test(browser): move the design system tests and the captures from e2e to Vitest in the browser`.

---

### Tarea M23: Las 6 e2e

**Depende de:** M19 a M22.

**Archivos:**
- Modify: `tests/e2e/chapter-1/chapter-1.spec.ts` (queda la del capítulo entero), `tests/e2e/chapter-2/chapter-2.spec.ts` (nueva: el capítulo 2 entero; hoy del 02-01 al 02-09 y el 02-14 se suma con la Tarea 34), `tests/e2e/incidents.spec.ts` (queda la del capítulo 4 con su recarga), `tests/e2e/roadmap.spec.ts` (queda la de la carga), `tests/e2e/saved-progress.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`, `tests/e2e/chapter-1/chapter-1-play.ts`, `playwright.config.ts`, `tests/e2e/CLAUDE.md` (pasa de 28 KB a una página: lo que de verdad queda), y las guías de `chapter-1/` y `chapter-2/`.
- Create: `tests/e2e/progress.spec.ts` y `tests/e2e/phone.spec.ts`.
- Delete: `tests/e2e/card-layout.spec.ts`, `tests/e2e/still-scene.ts`, los ayudantes que ya no usa nadie (`card-boxes.ts`, `map-boxes.ts`, `cards.ts` si ya no sirve) y las pruebas de los nueve «02-0X is played». Un ayudante se borra solo si `grep` dice que nadie lo importa.

**Tests (las 6):**
- `chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each`.
- `chapter 2 is played from 02-01 to 02-09, each incident opening the next, with 3 stars each`.
- `04-01 and 04-02 reach 3 stars, and the progress survives a reload`.
- `the roadmap loads every chapter, grouped by level, without console errors`.
- `the stars saved in the browser come back after a reload and open what they should`.
- `the first incident is played with a touch at 390×844: no horizontal scroll and every piece within reach`.

**Cierre:** `pnpm check` completo en verde. Medir el tiempo de `pnpm check` y de la e2e, y compararlo con B0 (2 min 20 s y 2,1 min); anotarlo en el cuerpo del commit y en el spec. **Commit:** `test(e2e): keep six end to end tests that play the chapters, the roadmap and the saved progress`.

---

### Tarea M24: Borrar el 3D

**Depende de:** M23.

**Archivos (lista por borrar y por mover; todos con `git grep` previo que demuestre que nadie los importa):**
- Delete: `src/scene/{game-scene,map-canvas,road,ink,edges,theme,html-layer,layout}.ts*` y sus pruebas, `src/scene/entities/*` de 3D, `src/scene/traffic/{traffic,flow-traffic,use-packet-runs}.ts*` y sus pruebas, `src/scene/overlay/{use-card-side,card-anchor,piece-anchor,floor-label}.ts*`, `src/scene/catalog/{catalog-grid,catalog-scene}.ts*` y sus pruebas, `src/scene/renderer.ts`.
- Modify: `package.json` (sin las cuatro dependencias), `pnpm-lock.yaml`, `playwright.config.ts` (sin `launchOptions` de `swiftshader`), `eslint.config.js` (`ENGINE_PACKAGES` sin `three` ni `@react-three/*`), `.claude/rules/pure-domain-core.md`, `.claude/rules/prefer-established-libraries.md` (la línea de 3D pasa a «mapa 2D: SVG a mano; animación: SMIL, un estándar del navegador»), `DESIGN.md`, `README.md`, `src/design/index.ts` y `tokens.ts` (`token()` y `tokenPx()` salen si nadie más los lee), `src/engine/CLAUDE.md`, las guías de `src/scene/`, `src/ui/`, `tests/e2e/`.
- Move: `src/scene/map2d/**` sube a `src/scene/` con `git mv` y los imports se reescriben en un commit propio, sin cambios de lógica (`git diff -M` lo muestra como movimiento).

**Pasos:**
- [ ] `git grep -nE "from 'three'|@react-three|swiftshader|useFrame|Billboard" -- src tests scripts` solo lista lo que se va a borrar.
- [ ] Commit 1: borrar el 3D y su configuración. `pnpm install` actualiza el lock. `pnpm check` completo.
- [ ] Commit 2: subir `map2d/` a `src/scene/` (`git mv`) y reescribir los imports. `pnpm check` completo.
- [ ] Medir otra vez el paquete (`pnpm build`) y comparar con 1 660 629 bytes (463 744 con gzip); anotarlo.
- [ ] Comprobar que ningún `CLAUDE.md` nombra three, la cámara o `swiftshader` (`git grep -n -i "three\|swiftshader\|camera" -- '*.md'` solo debe dar palabras comunes del texto).

**Tests:** `scripts/eslint-config.test.ts` y `scripts/package-versions.test.ts` corren sin editarse (el segundo deja de ver las cuatro dependencias).

**Cierre:** `pnpm check` completo en verde; `git diff --exit-code src/levels/04-iaas/golden-traces.json`; el chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado: `LINKS OK`. **Commits:** `chore(scene): delete the 3D map, three and the camera` y `refactor(scene): move the 2D map up to src/scene`.

---

### Tarea M25: Retomar el capítulo 2: 28 quater, la consulta DNS (O-2 = A)

**Depende de:** M24. **Lo que cambia respecto a la Tarea 28 quater del plan del capítulo 2:** los commits 1 (motor), 2 (vista y textos) y 4 (documentos) se hacen **tal como están escritos**: ninguno depende del renderer. El commit 3 (escena) se escribe en 2D:

- `stationsFor` termina en `doorstep:<equipo>` los cinco motivos de búsqueda fallida (`dns-nxdomain`, `dns-servfail`, `dns-no-address`, `dns-no-resolver`, `dns-resolver-silent`); `dns-unresolved` no cambia.
- `Traffic` lee `MapSent.after` y se lo pasa a `flightPlan` como `espera`; sin animaciones, la consulta y el paquete se dibujan a la vez.
- La consulta es un paquete UDP más: hexágono, etiqueta del tramo, su sello en la puerta del resolver. Cuenta entre los sellos de su lugar (`fanStamps`, sin código aparte).
- `incident-screen.tsx` pasa `drawnSends(session.sent)`.
- **O-6** (la marca de la fila «consulta DNS») sigue abierta y bloquea solo el paso de la vista, como en el plan.

**Tests del commit 3** (los de la 28 quater de «Nuevas, escena», con su nombre): `a packet that stopped at its lookup stays at the doorstep of its sender, as a packet that never left`, `a packet of an office with no resolver keeps the path it had in chapter 1`, `the path of a question runs to the resolver and back`, `a packet that waits for another leaves when the answer of the other is back at its sender` (ahora de `flightPlan`) y `the question of a send is drawn with the shapes of udp and ends replied, warned or lost like any packet`. La prueba `a ping by name draws the question to the resolver first, and the ping by hosts draws none` es del navegador (capa c), con `setCurrentTime`.

**Cierre y commits:** los cuatro de la 28 quater. `pnpm check` completo.

### Tarea M26: Retomar el capítulo 2: 28 quinquies, lo que queda

**Depende de:** M25. **Lo que cambia:** el commit 1 (mudanza de `spreadStamps` y `spreadTags`), el 2 (el modelo puro) y la parte de escena del 3 ya se hicieron en M6, M7 y M12; el modelo de ancho de etiquetas (`labelWidth`, `labelSpans`) se reemplazó por M2.

- [ ] Comprobar contra la lista «Tests nuevos» de la 28 quinquies que cada prueba nombrada existe, en M6, M7, M8 o M12, o que la sustituye una de este plan (el abanico a lo ancho, el centinela y el barrido de M8).
- [ ] Las e2e de solapes del 02-03, del 02-05 y del 02-08 que la 28 quinquies escribía ya son barridos de M8. Los «Known gap» de `tests/e2e/chapter-2/CLAUDE.md` desaparecen con esa guía.
- [ ] Las filas J16 y J17 del backlog (`docs/plans/2026-10-08-follow-the-packet-followups.md`): J16 se mantiene; J17 (el zoom del jugador no está modelado) se cierra, porque ya no hay zoom.
- [ ] La captura del catálogo con «+2» y «+12» ya se regrabó en M18; si falta algo, `entities.browser.test.tsx` lo dice.

**Cierre:** `pnpm check` completo; `git diff --exit-code src/levels/04-iaas/golden-traces.json`. **Commit:** `docs: close task 28 quinquies with the 2D fan and the sweep`.

### Tarea M27: Retomar el capítulo 2: Tareas 29 a 35

**Depende de:** M26. Cada tarea se hace **tal como está escrita** en el plan del capítulo 2, con estos cambios, que no tocan su contenido:

- **Las pruebas de Playwright que nombran las Tareas 29 a 34 se escriben en la capa que dice el spec:** lo que prueba qué se dibuja es una prueba pura o de jsdom; lo que mide una caja es del navegador; solo `chapter 2 is played from 02-01 to 02-14, each incident opening the next, with 3 stars each` y la del desbloqueo del 04-01 tras el 02-14 son e2e.
  - Tarea 29: `in 02-10 a ping by name draws the question first and the ping after it, each with its stamp` es del navegador (con `setCurrentTime`).
  - Tarea 32: `02-13: dig of tienda.lucia.example draws a question to the resolver and ping of the same name draws none` es de `game` y de la escena en jsdom.
  - Tarea 34: `in 02-07 the map and its labels fit the area at full size`, `in 02-09 and 02-10 no label or stamp overlaps`, `in 02-14 case 1 no label or stamp overlaps after the dig, the ping and the nc by name` y `in 02-04 placing a device inside the block draws it inside the outline and moving it out takes it out` son del barrido de M8 (se suman los estados nuevos de cada incidente); `in 02-07 and 02-08 the inspection box of a piece covers no open card...` y `the cards of tables, output and services cover no piece of the map` son del navegador; `in 02-12 waiting from the clock card changes the answer of dig`, `in 02-03 the services card opens from the label of laptop-lucia and switches the address`, `in 02-14 case 5 can be repaired from the routes card` y `the roadmap lists the fourteen incidents of chapter 2 with their stars` son de jsdom.
- **Cada tarjeta nueva** suma su escena a la lista de escenas de `card-layout.browser.test.tsx` y a la de `MAP_SCENES`, no a `card-layout.spec.ts`, que ya no existe.
- **La Tarea 34** no escribe el capítulo 2 entero desde cero: amplía la e2e de M23 del 02-09 al 02-14 (más largos, más lentos) y comprueba que el 04-01 abre después del 02-14.
- **La Tarea 35** suma a su lista de documentos: `DESIGN.md` (el mapa en 2D, ya hecho en M18 y M24; se revisa), `tests/e2e/CLAUDE.md`, los totales reales de este plan y la lista de las pruebas existentes que cambiaron a propósito.
- **La página de las «para revisar»** de la Tarea 33 suma las 18 decididas del spec, con las capturas reales de M17.

**Cierre:** el de cada tarea; `pnpm check` completo al cerrar los bloques 5 y 6 y en las Tareas 34 y 35.

## Estimación gruesa por bloque

**Es una estimación, no una medida.** Se deriva de que las Tareas 8 a 28 del capítulo 2 (23 tareas, con sus revisiones) tardaron 20 h 7 min entre el commit de la 8 (`afe01ce`, 2026-10-11 10:45) y el del último arreglo del bloque 4 (`6979d43`, 2026-10-12 06:52): unos 52 min por tarea. Estas tareas son más pesadas (un layout nuevo, SMIL, y mover 126 pruebas), así que se multiplica por 1,5 a 2 y se redondea.

| Bloque | Tareas | Horas de agente (estimadas) |
|---|---|---|
| Antes de empezar | M0, M1 | 2 a 3 |
| El layout puro | M2 a M8 | 8 a 11 |
| Piezas y tráfico en SVG | M9 a M16 | 9 a 13 |
| Paridad y cambio | M17, M18 (y M18 bis si el estudiante elige el oscuro: 1 a 2 más) | 3 a 5 |
| Las pruebas pasan de capa | M19 a M23 | 8 a 12 |
| Borrar el 3D | M24 | 2 a 3 |
| **La migración, de M0 a M24** | | **32 a 47** |
| Retomar el capítulo 2: 28 quater y 28 quinquies | M25, M26 | 3 a 5 |
| Las Tareas 29 a 35 (del plan del capítulo 2, no de la migración) | M27 | sin estimar aquí |

Con un solo agente a la vez, como en el capítulo 2, son de tres a cinco días de trabajo. Un bloque se puede adelantar si el estudiante lo aprueba: M1, M2 a M4 y M7 no dependen de nada del 2D y pueden ir primero. Lo que sí es el camino crítico: M1 (por la fecha del 2026-10-14), M5, M6, M9 a M14 y M17.

## Review Focus

Cada riesgo, con la prueba que lo guarda.

1. **Los capítulos 1, 2 y 4 se juegan igual.** Las e2e `chapter 1 is played...`, `chapter 2 is played...` y `04-01 and 04-02 reach 3 stars...` pasan antes, durante (con la bandera) y después del cambio. `git diff --name-only <B0>..HEAD -- src/engine src/levels` está vacío y el dorado no cambia.
2. **El 3D no se toca antes de M24.** El `git diff --stat` de «Global Constraints» en cada tarea de M2 a M18.
3. **Un sello dice su lugar sin engañar.** Pruebas de M6: `a place whose stamps all fit draws every stamp, 25 px apart across the link and centered on its mark`, `two marks of one link are at least 40 px apart` y `two stamps of different marks of one link never come closer than their own boxes`.
4. **Nada se pisa, en ningún incidente ni ancho.** El barrido de M8 (`in no registered incident does any label, stamp, packet label, name of a box or piece overlap another, at 360, 390, 768, 900, 1060, 1280 and 1440 px`), más el del navegador de M21 que compara el ancho del modelo con el del DOM.
5. **Ningún sello con problema se esconde en un «+N».** El centinela de M8.
6. **El mapa cabe de 360 a 1440 px y no se desplaza de lado.** `at 360 px no label, piece, box or mark of any registered incident leaves the map` (M5), `at 390 px the map is as wide as its container and the page does not scroll sideways` (M9, navegador) y la e2e del teléfono (M23).
7. **Los nombres de grupo no adelantan un término.** `the names of the groups say only what the player knows` (M11), y la escalera del `ladder.test.ts` corre sin editarse.
8. **El ancho de las etiquetas no depende de la fuente.** `the label of a packet is as wide as the model says whatever font draws the arrow` (M13), `the stack of the monospaced font has no ui-monospace` (M11) y la comparación de M21.
9. **La animación se prueba sin esperar.** `a packet travels its path at 120 px per second` (M14, pura) y `at an exact instant the packet is where the plan says, to half a pixel` (M14, navegador).
10. **Ninguna espera fija, `retries`, `skip` ni `fixme`.** La regla de lint de M1 y su prueba; las repeticiones `--repeat-each=10` de las pruebas del navegador que miden cajas, en el cierre de M21.
11. **Carpetas y primitivas.** `pnpm structure` pasa en cada tarea; el tope de 12 se respeta con la carpeta temporal (la bandera deja `src/scene/` en 12 de 12 hasta M24); no nace ningún primitivo nuevo de interfaz.
12. **Una sola dependencia nueva, exacta y de 14 días.** `scripts/package-versions.test.ts` y la regla `prefer-established-libraries` con su fecha, en M1; y cuatro que salen en M24.
13. **Las capturas cambian solo lo que se quiso.** M18 (y M18 bis): el diff de la de piezas es entero y el de la interfaz solo se desplaza si el catálogo cambió de filas.
14. **Rigor.** Ninguna opción, recomendada o no, enseña algo inexacto: el lugar de un sello es un hecho de la traza (`stationsFor` lo toma del `Trace`), nunca de la vista.

## Lo que no se pudo verificar

- **Nada de este plan se corrió.** Los prototipos del spec son un script de JavaScript suelto, no código del repositorio, y no pasaron por React. Se corrieron en Chromium de Playwright 1.64.0: el barrido de anchos, el movimiento por `setCurrentTime` y el desbordamiento de la página a 390 y a 1280 px.
- **El modo navegador no está instalado.** Que `@vitest/browser-playwright` 5.0.3 arranque en este proyecto, cuánto tarda y cómo reparte los archivos entre páginas son supuestos que M1 comprueba. Del código del proveedor (tarball de 5.0.3, leído fuera del proyecto) se leyó que la rueda es `page.mouse.wheel` y que `page.viewport` cambia el tamaño de la página; no se ejecutó. La documentación se leyó con un resumidor.
- **React 19 y SMIL.** Que pase `keyPoints`, `keyTimes`, `calcMode` y `repeatCount` sin cambios no se comprobó: M14 lo hace antes de seguir.
- **El 02-07 con su sucursal, un VPC con subredes, un piso de cinco equipos y tres pisos en serpiente no se prototiparon.** Sus reglas están en el spec; las pruebas de M4, M5 y M8 las fijan.
- **Los nombres que cambia la 28 bis** se leyeron en `626a144` de la rama `merge/28bis`, antes de los commits de la caja que se aparta. M0 los vuelve a leer.
- **Las cifras de tiempo después de la migración** son derivaciones. Las medidas de B0 son las del log del 2026-10-12.
- **Las horas** son una estimación a partir de los tiempos de los commits.
- **La lista de las 126 e2e** (spec, «Qué pasa con las 126 e2e de hoy») sale de los títulos de `playwright --list`; los 4 o 5 de la 28 bis no se contaron. Pueden cambiar de capa las que hoy no se leyeron a fondo, como `in 06 the open terminal covers neither the router nor the labels of the second floor`.
