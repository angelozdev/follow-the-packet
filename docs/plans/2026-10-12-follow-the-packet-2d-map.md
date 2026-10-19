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
    - Las pruebas del navegador se tipan en su propio `tsconfig`. Al principio `tsconfig.json` listaba `src/testing/setup.ts` primero en `include`, porque `vitest/browser` declara los comparadores del navegador para todo el programa de tipos y, junto a los de jest-dom, ganaba el primero en entrar: sin ese orden `expect(...).toHaveTextContent(/.../)` de `table-card.test.tsx` dejaba de compilar. Ese truco se quitó en la ronda de arreglos (hallazgo 1 de la revisión de M1): `tsconfig.json` excluye `src/**/*.browser.test.*` y `vite.config.ts` pasa a `tsconfig.browser.json`, que incluye los archivos `*.browser.test.*`, `src/testing/browser-setup.ts` y `vite.config.ts`; `typecheck` corre `tsc --noEmit && tsc --noEmit -p tsconfig.browser.json`. Cada programa ve solo sus comparadores. En el navegador `expect.element(...).toHaveTextContent('x')` compara el texto entero (falla con `hello world`), una `RegExp` ahora es un error de tipos (y en ejecución nunca se cumpliría), y negado con un texto que no es el entero no comprueba nada; para una parte o un patrón se usa `toMatchTextContent`. Comprobado en Chromium el 2026-10-17 con pruebas desechables. Un ayudante que importe `vitest/browser` se agrega al `include` de `tsconfig.browser.json` y al `exclude` de `tsconfig.json`. Anotado en `src/testing/CLAUDE.md`.
    - `.vitest/` entra en `.gitignore`: una prueba del navegador que falla deja ahí su captura.
    - El mensaje de la regla de espera fija ya no manda solo a `page.clock` (que no existe en el modo navegador): nombra `expect.poll`, `expect.element` y `vi.advanceTimersByTime`.
    - La regla de lint de las esperas fijas y su prueba cubren `src/**/*.browser.test.{ts,tsx}` y conservan la prohibición de la importación dinámica; `README.md` y `tests/e2e/CLAUDE.md` dicen ahora que `pnpm check` corre `pnpm test:browser` antes de Playwright.
- **Cierre de la Tarea M2 (2026-10-17).** Medido en `feat/chapter-2`; la tarea es el commit `9f02a08`, sobre `edd91e6`. Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `src/scene/map2d/` y `layout/`, cada una con su `CLAUDE.md`, más `layout/metrics.ts` y `metrics.test.ts` (12 pruebas: las 7 del plan y 5 más). `git diff --name-only edd91e6..HEAD -- src/engine src/levels` está vacío, los archivos 3D no cambian y `golden-traces.json` tampoco.
  - **Rojo primero.** Sin `metrics.ts` el archivo no cargaba («Cannot find module './metrics'»). Con una versión que devolvía ceros fallaron 10 de las 12 por su valor (las 2 que pasaron comparan dos anchos entre sí, y con ceros son iguales). Después, cuatro mutaciones sobre el código terminado: redondear en vez de subir (cae solo la de los 245 px), NFD en vez de NFC (cae solo la de la tilde), un tope de 29 (cae la de los nombres, con `servidor-autoritativo-noticias`) y el recorrido de los mundos registrados vacío (caen la de los nombres y la de los firewalls).
  - **Totales con M2.** Vitest 3007 pruebas en 102 archivos (2995 en 101 antes: 12 pruebas y un archivo más); `pnpm check:fast` en verde (typecheck, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: M2 no toca ninguno de los dos.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M2.** Ninguna cambia lo que el jugador ve ni lo que aprende:
    - Los anchos suben a píxeles enteros: `ceil(caracteres × 7,2) + 14`, más el candado y el aviso. Porque la prueba del plan lo exige: 32 × 7,2 + 14 = 244,4 y la prueba dice 245. Así también salen los 115 px de «Security Group» y los 79 px de «servidor2» del spec, y el modelo se equivoca por ancho y no por estrecho frente a la celda de 7,2 px.
    - `labelWidth` recibe el texto con sus marcas (`TermText`) y mide lo que el jugador lee (`toPlainText`), para que M4 y M11 le pasen `piece.label` tal como viene. Un texto sin marcas pasa igual.
    - `characterCount` cuenta puntos de código tras normalizar a NFC: una letra con tilde ocupa una celda, compuesta o no, y la flecha `→` también una.
    - `labelLines` parte en el primer nombre de recurso (`[[…]]`), no en un espacio, así que no depende de cómo estén escritos el término ni el nombre. Un texto sin nombre, o que es solo un nombre, queda en una línea.
    - `labelBox(líneas)` no cuenta el candado ni el aviso. El spec no dice en qué línea de una etiqueta de dos líneas van, y la etiqueta de un firewall suele tener candado: lo deciden M4 y M11 (por ejemplo, el mayor `labelWidth(línea, { locked })`).
    - `LINE_HEIGHT` es 16 px: es el paso que falta entre los 20 px de una línea y los 36 px de dos (`LABEL_HEIGHT + LINE_HEIGHT`). Los 20 y los 36 vienen del plan; ni ellos ni el 16 se midieron contra el DOM.
    - La prueba de los nombres recorre también `officeWithNames()`, que no es un mundo registrado. El nombre más largo que existe, `servidor-autoritativo-noticias` (30 caracteres), está en `src/levels/02-ports-and-names/shared.ts` y en esa fixture, pero en ningún mundo registrado todavía (el 02-10 y los siguientes no están registrados; el más largo registrado hoy es `impresora-sucursal`, de 18). Sin la fixture el tope de 32 no cubriría el nombre que cita el spec. Una guarda exige al menos dos mundos por incidente en el recorrido registrado, para que la fixture sola no la haga pasar. Recorre el `name` de dispositivos, firewalls, routers, actores y LAN, en el mundo de partida, el resuelto y cada caso de un diagnóstico.
    - Cinco pruebas más que las 7 del plan: la tilde compuesta o no, que se mide lo que el jugador lee y no las marcas, la caja de una línea (20 px), una etiqueta sin nombre de recurso y el barrido de los firewalls de todos los mundos registrados.
    - La prueba de los 245 px usa un `32` literal y no `MAX_NAME_LENGTH`, como dice su título.
  - **Abiertas.**
    - Los 26 px del candado y los 22 px del aviso siguen sin medir. M21 los mide y los corrige, y entonces cambia a propósito la prueba `a locked label is as wide as its text plus the lock, and a label with the alert as wide as its text plus the alert` (fija esos dos valores como números); el encargo de M21 la nombra. Nada compara todavía el modelo con el DOM.
    - En qué línea de una etiqueta de dos líneas van el candado y el aviso: lo decide M4 o M11.
    - `src/scene/CLAUDE.md` no apunta a `src/scene/map2d/` (M2 solo crea archivos nuevos). Lo agrega M9 o M24.
- **Cierre de la Tarea M3 (2026-10-17).** Medido en `feat/chapter-2` sobre `31c9df1` con los cambios de M3 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `layout/graph.ts` y `graph.test.ts` (16 pruebas: las 4 del plan y 12 más), `layout/stations.ts` y `stations.test.ts` (38 pruebas: 30 portadas de `pathFor`, 2 del plan y 6 más) y la guía de `layout/` al día (el vocabulario de estaciones). M3 no tiene casillas `- [ ]`. `src/scene/layout.ts` y su prueba no cambian; `git diff --name-only efe355b -- src/engine src/levels` está vacío (B0), el `git diff --stat efe355b` de los archivos 3D de «Global Constraints» también, y `git diff --exit-code src/levels/04-iaas/golden-traces.json` sale con 0. Los archivos planos de `layout/` pasan de 2 a 6 de 12.
  - **Las portadas son 30, no «unas 35».** Los seis `describe` de `layout.test.ts` suman 4 (`pathFor`) + 6 (`pathFor in an office`) + 3 (`pathFor when a firewall the player does not know stops the packet`) + 14 (`pathFor in an office with routers`) + 2 (`a packet that dies at the NAT of the office`) + 1 (`pathFor of a datagram that gets a Port Unreachable`). Se portaron con el mismo nombre de `describe` y de `it`, en el mismo orden (un script comparó los títulos).
  - **Rojo primero.** Con un `route` que devolvía vacío y sin lanzar, un `lengthOf` vacío y un `positionAt` fijo en `[0, 0]`, fallaron las 16 de `graph.test.ts`, las de lanzar porque el stub no lanza. Con un `stationsFor` que devolvía vacío fallaron 37 de las 38 de `stations.test.ts`; la que pasó (`changes nothing for a packet that no firewall stopped`) compara dos listas vacías. Después, mutaciones sobre el código terminado: preferir el nodo mayor en el desempate (caen 4), quitar la regla de desempate (cae la de «aunque el otro camino llegue antes a su último enlace»), no contar los codos en la longitud (cae la del camino más recto) o no invertirlos al volver (cae la del codo), no quitar las repeticiones, tomar otro bus en `bus-end`, quitar el cabo `line-end`, empujar siempre el borde, ignorar `hiddenStop` en la llegada, cruzar routers que no se dibujan, no contar las pasarelas y partir siempre el `mid` del camino del equipo (cada una cae por al menos una prueba).
  - **Contra el 3D.** Un script desechable (no entra al commit) comparó `stationsFor` con `pathFor` en 1332 pares: todos los mundos de los capítulos 1 y 4, las salidas de partida y resuelta de los incidentes del capítulo 2 con sus flujos, el mapa entero con y sin exterior más 4 recortes al azar (con semilla) por mundo, y `hiddenStop` en falso y en verdadero. 1282 coinciden punto por punto (tras unir puntos repetidos), 50 coinciden una vez que se quitan los puntos de piezas que no se dibujan (el borde o el globo), ninguno queda sin explicar; aparte, 180 combinaciones de paquete y mapa no se comparan porque el mapa no dibuja al remitente. Los `mid` se comprobaron por estructura: el 3D tiene un punto más que las estaciones. Aparte, `lengthOf` y `positionAt` dieron lo mismo que `cumulativeLengths` y `pointAt` en más de 10 000 comparaciones.
  - **Totales con M3.** Vitest 3061 pruebas en 104 archivos (3007 en 102 antes, medido antes de escribir: 54 pruebas y 2 archivos más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: M3 no toca ninguno de los dos.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M3.** Las dos primeras cambian lo que el jugador verá en un caso poco frecuente; ninguna cambia lo que aprende:
    - Sin nada dibujado más allá de la última parada que el paquete cruzó, el paquete que muere en un router que el mapa no dibuja termina en `mid:<a>-line-end`: un cabo que M4 debe dar a la línea principal más allá de su última parada (el 3D lo ponía a mitad de camino hasta el borde del mapa). Desde el camino del equipo, el `mid` parte de su bus (`mid:bus:<piso>-<primera parada>`) y no del punto del equipo. La otra opción, terminar en la última parada, diría «se perdió en el camino de su red» o «murió en internet» de algo que murió en un router fuera de la vista, y eso no es riguroso.
    - Un paquete de un cliente de internet a una IP pública que ningún router tiene termina en `internet`, no en el final del camino de la oficina como en el 3D: ese paquete no tiene un bus propio y «se perdió en internet» es lo que el mapa ya dice de una IP privada. Ningún paquete de los incidentes registrados lo ejerce (el barrido no lo vio).
    - Una estación se nombra solo si el mapa dibuja su pieza. El 3D pasaba por puntos vacíos (el borde o el globo sin dibujar; 50 de los 1332 pares) y en 2D `route` lanza ante una estación sin nodo.
    - `Drawn`, el tercer argumento de `stationsFor`: lo que el mapa dibuja por id (cada equipo con el id de su bus, los clientes, los servidores, los routers de la línea principal en orden desde la oficina, las pasarelas de otra oficina, el borde suelto y el globo). `stationsFor` no recibe el mundo ni el layout, y M4 lo construye de sus piezas. El nombre del bus de una oficina sin pisos ni subredes lo da el layout.
    - El borde suelto de un mundo sin routers se llama `edge` (la tabla del spec no lo nombra) y solo se agrega cuando se dibuja; con routers, el borde es el primer router y ya sale de `Trace.hops`. Las estaciones no se repiten seguidas (un tramo de longitud cero no dice nada), y un remitente que el mapa no dibuja da `[]` en vez del punto suelto al final del camino; `startsOnMap(paquete, drawn)` sustituye al de `layout.ts` y la prueba portada lo usa.
    - El desempate de `route`: entre dos caminos de la misma longitud (tolerancia de 1e-9) gana el que pasa por el nodo que va antes en `nodes`, en cada enlace del camino y sin que importe el orden de las aristas. «El orden de los nodos» admite también «el que se asienta primero»; se eligió el índice porque no depende de las distancias.
    - `lengthOf` y `positionAt` son `cumulativeLengths` y `pointAt` con otra forma y la misma lógica, porque `jscpd` (umbral 0) marca una copia mientras convivan el 3D y el 2D. Usan `Point`, un tipo propio, para no importar `layout.ts`, que M24 borra.
    - En las portadas se comparan listas de nombres, y a veces la lista entera donde el original miraba solo el último punto (`step 3`, `step 5`). La única afirmación que se pierde es la de `a ping to its own IP stays at its own doorstep…` (`doorstep` más cerca del origen que `firewall`), porque es de geometría: los 62 px los prueba M4.
  - **Abiertas.**
    - M4 construye `Drawn` y da a su grafo un nodo por cada estación que `stationsFor` pueda nombrar: las del vocabulario de `layout/CLAUDE.md`, `bus:<bus>` y `line-end` incluidos, y un `mid:<a>-<b>` por cada par de paradas seguidas (desde cada bus a la primera parada y desde la última al `line-end`). M8 lo comprueba con el barrido de todos los incidentes.
    - Dónde van a mitad del enlace el `mid` y el `line-end` queda a M4; el spec dice «un cabo de 40 px» solo para el `bus-end`.
- **Cierre de la Tarea M4 (2026-10-17).** Medido en `feat/chapter-2` sobre `211f3f7` con los cambios de M4 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `layout/arrange/` con su guía y nueve archivos planos: `geometry.ts` (tipos y medidas con nombre), `pieces.ts` y `pieces.test.ts`, `groups.ts` y `groups.test.ts` (pisos, filas, buses y troncos), `assemble.ts` y `assemble.test.ts` (el grafo, las mitades y las marcas) y `row.ts` y `row.test.ts` (`layoutRow`). `stations.ts` exporta `mainLine` (una palabra; ninguna prueba de M2 ni de M3 cambia) y la guía de `layout/` apunta a `arrange/`. Los archivos planos de `arrange/` son 9 de 12: M5 suma `stack.ts` y su prueba. M4 no tiene casillas `- [ ]`. `git diff --name-only efe355b -- src/engine src/levels` está vacío, el `git diff --stat efe355b` de los archivos 3D de «Global Constraints» también y `golden-traces.json` no cambia.
  - **Las pruebas.** 146: 13 de `pieces`, 16 de `groups`, 10 de `assemble` y 107 de `row` (nueve mapas, cada uno en las dos densidades, pasan por ocho pruebas de barrido). Están las 18 del plan con su título exacto. De M3 están las tres pruebas de geometría que sus portadas perdieron (`the doorstep stands 62 px from the edge of its device, on its link, nearer than its firewall`, `each mid stands half way between its two stops, on the line` y `the stub at the end of the line stands inside the map and is drawn`) y una que une M3 con M4: para cada remitente dibujado y cada IP del mundo, `stationsFor` (con `hiddenStop` en falso y en verdadero) y `route` sobre el grafo del layout no lanzan, en nueve mapas (la oficina del capítulo 1, la VPC del 4, dos pisos con todo el camino y con los routers fuera de vista, la oficina sola, la oficina con un servidor y sin internet, los nombres del capítulo 2 con un cliente, la otra oficina del 02-07 y un camino sin oficina). Aparte, un script desechable (no entra al commit) corrió `layoutRow` sobre las 5184 combinaciones de piezas de cinco mapas, en las dos densidades, sin que fallara ni dejara una estación con coordenada negativa.
  - **Rojo primero.** Con las funciones como cascarones de su firma final que devolvían vacío (`classify` sin dispositivos, `floorsOf` sin pisos, `assemble` sin nodos, `layoutRow` sin grupos), `pieces.test.ts` falló 13 de 13, `groups.test.ts` 15 de 16, `assemble.test.ts` 10 de 10 y `row.test.ts` 38 de las 84 de entonces, todas por su valor; las otras 46 recorren colecciones que con el cascarón están vacías y pasaron en vacío, así que no se contaron hasta verlas caer con una mutación. Después, unas 40 mutaciones sobre el código terminado, cada una restaurada: el tamaño de las filas, el retroceso de las marcas, su separación, el paso entre paradas, la mitad de cada `mid`, el ajuste de las casillas, el eje, el recorrido de los troncos, el orden de los routers, las pasarelas, el cable suelto, el hueco hacia los servidores, la etiqueta de la última parada, el borde del grupo de la otra oficina y el segmento de longitud cero de `isOnSegment` (cada una cae por al menos una prueba). Cuatro no caían y se agregó la prueba: el bus de los servidores frente a la etiqueta de la última parada, el borde del grupo de la otra oficina, el hueco hacia el primer servidor y el paso entre paradas cuando lo manda una etiqueta larga.
  - **Con las piezas reales.** Un script desechable (no entra al commit) corrió `layoutRow` con `pieceViews` de los 25 incidentes registrados, al empezar y con todos los términos conocidos, en las dos densidades: no lanza, ninguna etiqueta ni icono se pisan, ningún abanico cubre una etiqueta ni un icono (salvo las mitades `mid:bus:` de un mapa con dos buses), ningún abanico pisa a otro (salvo los de los límites de abajo) y `stationsFor` con `route` no lanzan para ningún ping de un remitente dibujado a una IP del mundo, con `hiddenStop` en falso y en verdadero. `MapPiece` y `PieceView` se asignan a `RowPiece` (comprobado con `tsc`).
  - **Ronda de arreglos 1** (la revisión de M4 halló tres Important): el tramo del bus a la primera parada (los 104 y 116 px de arriba), las etiquetas de las paradas sobre el abanico, y las pruebas de `two marks of one link are at least 40 px apart` y de los abanicos sin la lista ancha de excepciones (ahora entra el tronco, y solo se exime por nombre lo de «Abiertas»). Pruebas nuevas: `the first stop of the line stands 172 px from the bus, whatever the density` y `every stop of the line, and the middle between two of them, holds three casillas` (en nueve mapas); `the compact row differs from the normal one only in the trunk and in the lane` pasa a `the compact row differs from the normal one only in the lane: the trunk shortens a cable that the first stop keeps 172 px from the bus` (prueba que M4 creó y cuyo contrato cambia: el tronco ya no ensancha el mapa), y las de la etiqueta de una parada (`the label of a device stands left of its icon, ...`) miden ahora los 47 px. Con las mutaciones: sin el tramo (`firstCenter` pegada al tronco) caen 18 pruebas, con la etiqueta pegada al icono caen 8.
  - **Totales con M4.** Vitest 3207 pruebas en 108 archivos (3061 en 104 antes: 146 pruebas y 4 archivos más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: M4 no toca ninguno de los dos.
  - **Los anchos que salen** (ronda de arreglos 1, con el tramo de 172 px del bus a la primera parada). Medidos con las piezas reales de cada incidente al empezar (`pieceViews`, con los candados), en fila y en fila compacta: 01-08 1049 y 1035 px (el spec, con etiquetas sin candado, 845 y 819), 02-03 594 (484), 02-09 958 y 944, 04-01 1098 y 1084, 01-14 1139 y 1125, 01-09 1152 y 1138, 02-08 1157 y 1143 y 02-07 1376 y 1362. Del 02-13 no hay incidente registrado. En 01-08, midiendo una cosa a la vez (fila / compacta): 1049 / 1035 con candados y los 172 px; 997 / 983 sin candados (los dos candados son 52 y 56 px: `LOCK_WIDTH`, sin medir hasta M21); 859 / 845 sin candados y con el primer tramo y el paso entre paradas que mandan solo las etiquetas (el mínimo de 172 px, `STOP_PITCH` de `geometry.ts`, suma 138 px). Quedan 14 px en fila y 26 en la compacta contra el spec, que no se explican con lo que hay en el repositorio (el prototipo no está). El tramo del bus a la primera parada suma 104 px en fila y 116 en la compacta sobre la primera entrega de M4 (945 y 923 en 01-08), y la fila compacta ya no ahorra nada en el tronco: solo en el carril. A 1280 px (un mapa de 900) 01-08 no cabe en fila ni en la compacta: M5 le dará la serpiente, igual que a casi todos los mapas con un router y un servidor.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M4.** Las ocho primeras y la de las casillas cambian lo que el jugador verá; ninguna cambia lo que aprende:
    - Los equipos sin cable van debajo de las cajas, en la columna de los demás, y no «a la derecha de la última» como dice el spec: a la derecha de la última caja pasan el tronco, el router y el cabo del final de la línea, y el equipo caería sobre ellos. Cada uno tiene su cable corto (`kind: 'unplugged'`) que no llega a ningún bus.
    - El cabo del final de la línea (`line-end`) se dibuja en cada mapa, como pidió la revisión de M3: 92 px más allá de la última parada, o 92 px bajo el último carril si hay servidores o clientes, y los troncos terminan en él si no hay nada en la línea. Es un tramo nuevo de camino que ningún mapa tenía.
    - Las medidas que el spec no da y que M4 fija (valores de partida, todos con nombre en `geometry.ts`): márgenes de 16 px y relleno de grupo de 14, nombre del grupo en una franja de 18 px, 14 px entre cajas, icono de 48 px, etiqueta a 6 px del icono, barra de 6 px por 40 px a 87 px de la puerta, enlace de 102 px de la puerta al bus (62 + 40) o el que pida la etiqueta del firewall más ancho, cabos de 40 px en los buses, 172 px como mínimo entre paradas y 72 px de la última parada al bus de los servidores. Las etiquetas del router, del borde y del internet van encima del icono y centradas (la del primer router empieza a 47 px del bus), las de los servidores y clientes a la derecha de su icono y la de un firewall bajo el enlace, pasada la barra. Con ellas, un piso de 8 equipos da un mapa de 878 px de alto, la cifra que el spec midió en el prototipo (prueba `a floor of eight devices makes a map 878 px tall, as the prototype of the spec measured`).
    - La marca de un firewall queda del lado del bus (22 px antes de la barra, por donde llega a un equipo un paquete que lo busca) y la de un router, del internet o del borde del lado de la oficina; un paquete que un firewall de salida frena también muestra su sello del lado del bus.
    - El primer router (o el borde suelto) queda sobre el borde derecho de la caja de la oficina, como dice el spec; el router de la otra oficina queda debajo de él, en la misma `x`, y el enlace privado baja por esa línea, encima del borde punteado de la caja.
    - Los troncos de varios pisos salen del punto de cada bus más cercano a su carril (el carril, a 8 px de los otros y centrado en la línea principal), dan un codo de 8 px y se juntan en un punto antes del primer router; con un solo piso el tronco sale recto.
    - El primer router (o el borde suelto, o el internet si no hay router) queda a 172 px del bus de la oficina, 104 px (116 en la compacta) más lejos que con un tronco de 44 o 32 px que termina en su icono: los troncos se juntan en un punto a 44 o 32 px del bus y una línea llana sigue de ahí al icono. Con eso la marca de `road`, la mitad del primer tramo (`mid:bus:<bus>-<parada>`) y la marca de la primera parada quedan a 40 px o más, que es la regla 2 del spec; con un tronco que termina en el icono no cabían. Sale más ancho (los anchos de arriba) y la fila compacta solo ahorra en el carril.
    - Las etiquetas del router, del borde y del internet suben hasta quedar a 47 px de la línea (el abanico de 3 casillas llega a 43), 17 px más que pegadas al icono: con la etiqueta pegada, el abanico de la propia parada y el de la mitad hasta la siguiente quedaban en 1 casilla. Ahora cada parada de la línea y cada mitad entre dos paradas tienen 3.
    - El candado de una etiqueta de dos líneas va al final de la última línea y el aviso al principio de la primera, que es el orden del botón; la caja es tan ancha como la línea más ancha con lo que lleva (M2 lo dejó abierto).
    - Los nombres de los grupos son partes con el término que las libera (`{ text, term? }`): el nombre del piso siempre y su bloque con `cidr`, el de una subred con `vpc` y su bloque con `cidr`, y un filtro puro (`shownParts`) que recibe los términos conocidos. M4 no escribe ningún texto: «Oficina», «VPC» y cómo se unen las partes son de M11. Una caja con un solo piso es la de la oficina y lleva el nombre del piso; qué dice su título lo decide M11.
    - El bus de una oficina o una VPC sin pisos ni subredes se llama como el tipo del mundo (`office` o `vpc`). Una subred va siempre dentro de la caja de su VPC, aun sola.
    - Las casillas de una marca (hasta 3) bajan cuando una etiqueta, un icono o el abanico de una marca puesta antes le estorba, y nunca a menos de 1; lo que se ve es cuántos sellos caben antes del «+N». Las marcas se ponen en este orden: por cada piso, las de sus equipos y el final de su bus; después las paradas, los carriles, el final de la línea y la otra oficina; y al final las mitades.
    - `RowPiece` es el tipo estructural de lo que la escena recibe (`MapPiece` se le asigna): `arrange/` no importa ni `LayoutPiece` de `layout.ts` ni `MapPiece` de `piece-label.tsx`, que la guía de `layout/` no permite.
  - **Abiertas.**
    - Lo que las medidas del spec no resuelven, que M4 deja nombrado en la guía de `arrange/` («Known limits») y exento por su nombre en `row.test.ts`, y nada más: (1) con dos buses que comparten tronco (las subredes de una VPC, la otra oficina), las dos mitades `mid:bus:<bus>-<parada>` quedan en carriles a 8 px y el codo del tronco de un piso de arriba o de abajo corre a 8 px del bus, así que sus marcas se acercan a menos de 40 px y sus abanicos se pisan (con un solo bus el tramo queda libre); (2) el abanico de `bus-end`, un cabo de 40 px, toca el de `road` de la última fila; (3) sobre el bus de los carriles, el carril deja 44 px (30 en la compacta) hasta la marca de su puerta, menos que un abanico, y las marcas de ese bus (las mitades hacia un servidor o hacia el final de la línea, entre dos servidores, y `line-end` de un mapa con carriles, que cuelga 92 px bajo el último) pueden quedar en 1 casilla y tocar la de una puerta. El barrido de M8 dirá si algún estado de un incidente registrado pone dos sellos ahí; si lo hace, lo que cambia son el tronco, el cabo (`STUB`) o el carril, no la estructura.
    - M5 usa el ancho natural de `layoutRow` para elegir el modo; con los anchos de arriba, 01-08 ya no cabe en fila a 1280 px, y el 02-13 del spec, que no está registrado, quedaría igual de justo o peor.
    - M11 decide qué título lleva la caja de un solo piso, cómo se unen las partes de un nombre y el título del contorno del bloque (el layout da la caja y la esquina, no el texto).
    - El spec dice, en la fila de `mid`, «entre dos paradas dibujadas»: ahora también es entre el bus de un equipo y la primera parada, y entre la última parada y el cabo de la línea (hallazgo 9 de la revisión de M3). Y dice que los equipos sin cable van «a la derecha de la última»: van debajo. Se corrige cuando el spec se edite.
- **Cierre de la Tarea M5 (2026-10-17).** Medido en `feat/chapter-2` sobre `6ac3bd4` con los cambios de M5 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `layout/map-layout.ts` (`layoutMap(world, pieces, { width })`: la fila normal, la compacta o la serpiente, la primera cuyo ancho natural cabe; un ancho menor de 360 cuenta como 360; devuelve un `MapLayout`, el `RowLayout` más su `mode`: `row`, `row-compact` o `stack`) y `layout/arrange/stack.ts` (`layoutStack(world, pieces, width)`), con sus pruebas. `geometry.ts` suma `MIN_WIDTH`, `LINE_PITCH`, `NAME_ABOVE`, `DROP_GAP`, `GATEWAY_DROP`, `RowExtent`, `MapMode` y `MapLayout`; `stackFloors` (`groups.ts`) acepta la altura de cada fila (`row`) y da lo de siempre cuando no se la dan; `row.ts` exporta lo que la serpiente reutiliza (`surveyOf`, `placeDevices` y `placeBus` con su colocación de etiquetas y su codo, `placeLanes` con su lado, `joinGateway`, `stopsNamed`, `lanesOf`, `legsOf`, `branchesOf`). Antes de tocar nada se guardó la salida de `layoutRow` de los 25 incidentes registrados (al empezar y con todos los términos conocidos, las dos densidades, con `pieceViews`, en un script desechable) y se comparó con un hash después del refactor: es la misma, y las pruebas de M4 no cambian. Guías: `layout/CLAUDE.md` y `arrange/CLAUDE.md` (sección «The snake»). Archivos planos: `arrange/` 11 de 12, `layout/` 8 de 12. M5 no tiene casillas `- [ ]`.
  - **Las pruebas.** 21 nuevas: 10 en `map-layout.test.ts` y 11 en `stack.test.ts`. Están las 9 del plan con su título exacto (siete en `map-layout.test.ts`; `the snake runs the way out from right to left under the office` y `with two floors their trunks run in parallel, 8 px apart, to the router` en `stack.test.ts`). Además: barridos de diez mapas (los nueve de M4 más la otra oficina sola) en la serpiente a 360, 390, 768, 900, 1060, 1280 y 1440 px (nada fuera del mapa, etiquetas e iconos sin pisarse, abanicos sin cubrirlos, marcas a 40 px o más, tres casillas en cada parada y en cada mitad, y `stationsFor` con `route` sin lanzar para cada ping), el mismo barrido sobre los incidentes registrados dibujados enteros (candados y avisos en todo), a 360 px (la prueba del plan) y de 390 a 1440 px en cualquier modo, la sonda de un nombre de 30 caracteres, y pruebas de la fila de un equipo, del plegado de la línea, del lado de los carriles, del contorno del bloque, del mismo conjunto de estaciones que la fila y de la otra oficina.
  - **Rojo primero.** Con `layoutStack` como cascarón de su firma final (el tamaño pedido, la clasificación de las piezas y nada más) y `layoutMap` que siempre devolvía la serpiente, `stack.test.ts` falló 8 de 8 por su valor (iconos y estaciones sin definir, alto 0) y `map-layout.test.ts` 5 de 8; las otras 3 pasaban en vacío, así que se les agregó que cada capa trae marcas, que cada pieza tiene icono y etiqueta y una fila que cabe en 360 px a 100 px de ancho. Después, unas 24 mutaciones distintas del código terminado, cada una restaurada: la serpiente sin muros, con troncos que no son concéntricos, con las filas a 100 px, con los carriles siempre a la derecha, con las paradas a 100 px, sin holgura del primer tramo, sin el mínimo de 360, con el ajuste estricto de la fila, sin separación de etiquetas, con el carril de 66, con la puerta de enlace a otra altura o a otra `x`, y las extensiones del contorno cambiadas, entre otras. Siete no caían y se agregó la prueba: el mínimo de 360 en `layoutMap`, la altura de la puerta de enlace, la extensión del contorno del bloque, la separación de etiquetas de dos paradas, el enlace mínimo, y el hueco de un nombre largo y de la etiqueta de un firewall hasta el contorno.
  - **Totales con M5.** Vitest 3228 pruebas en 110 archivos (3207 en 108 antes: 21 pruebas y 2 archivos más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: M5 es pura. Durante la sesión la máquina fue unas diez veces más lenta durante un rato (el primer test de muchos archivos tardaba 25 s y agotaba sus 5000 ms, en archivos que no importan `map2d`, y una vez un trabajador de Vitest no respondió); la corrida que cierra la tarea tardó 7,5 s y pasó entera. Por eso las pruebas de barrido de M5 son baratas (la del modo recorre 15 anchos y los bordes, 0,2 s).
  - **Los puntos de cambio del modo.** Son los anchos naturales de la fila: la serpiente por debajo del ancho de la fila compacta, la fila compacta desde ese ancho hasta el de la fila normal, y la fila normal desde ahí; si los dos son iguales no hay fila compacta. Medidos con las piezas reales de cada incidente al empezar (fila normal y compacta): 01-01 439 y 439, 01-05 446 y 446, 01-06 632 y 632, 02-03 594 y 594, 02-04 765 y 765, 01-08 1049 y 1035, 02-09 958 y 944, 04-01 1098 y 1084, 01-14 1139 y 1125, 01-09 1152 y 1138, 02-08 1157 y 1143 y 02-07 1376 y 1362. Así, 04-01 cambia de serpiente a fila compacta en 1084 px y a fila normal en 1098, y 02-07 en 1362 y 1376. Con el ancho del contenedor a 1280 px de ventana (900 px) la serpiente es el modo de 01-08, 01-09, 01-14, 02-07, 02-08, 02-09 y 04-01. La serpiente a 360 px mide de 629 px de alto (02-09) a 1250 (02-07); a 900 px, para los mapas que son serpiente a ese ancho, de 515 (01-09 y 02-09) a 979 (01-08), con 563 (01-14), 721 (02-08), 863 (04-01) y 908 (02-07) en medio. La prueba `the mode flips only where the natural width of the row is` mira que el modo no cambie en ningún otro ancho (15 anchos y los bordes de cada mapa).
  - **Con las piezas reales.** Un script desechable (no entra al commit) corrió `layoutMap` con `pieceViews` de los 25 incidentes, en sus mundos de partida, resuelto y de cada caso, al empezar y con todos los términos conocidos, a los siete anchos: 798 mapas sin ningún problema de los que barren las pruebas (los barridos del commit usan las piezas «dibujadas enteras» de cada mundo, que es el caso más ancho, porque una prueba de `scene/` no puede importar `@/game`; el barrido con `pieceViews` es el de M8).
  - **Ronda de arreglos 1** (la revisión de M5 halló un Important): el nombre de 30 caracteres no cabía en 360 px aunque el spec dice que sí (`24 + 48 + 44 + 6 + 230 = 352`, con 8 px de margen). La serpiente toma las cifras del spec en los cuatro sitios que la ensanchaban: el carril de 44 px (`SNAKE_LANE`; eran los 52 del carril compacto, en el alcance y en `placeLanes`), el bus de los carriles a 24 px del muro del final de la línea (`SNAKE_BUS_WALL`; eran 38: los 16 de `OUTER` y los 22 de holgura delante del bus) y el margen de 8 px (`SNAKE_LABEL_WALL`; eran 16) entre el final de la etiqueta de un carril y el muro, en la regla de dónde puede ir el bus y en `extentOf`, y en los dos lados, según hacia dónde cuelguen los carriles. No cambian `STOP_PITCH`, `SERVERS_GAP`, nada de `row.ts` ni las tres excepciones de `row.test.ts`. Medido a 360 px con `officeWithNames()`: el nombre de 30 caracteres sin candado (etiqueta de 230 px) mide 360 px de ancho (antes 392) y con candado (256 px) 392 px (antes 416). Lo que cambia en el 2D (la comparación fue de 564 mapas de la serpiente: diez escenas y los 25 incidentes, a doce anchos de 360 a 1440 px): todo mapa con servidores cambia (444 de 564; los 120 sin servidores quedan idénticos) porque el carril es 8 px más corto; en 31 el bus de los carriles cabe una línea antes y el mapa pierde 114 px de alto (el 01-08 a 390 px pasa de 1597 a 1483) y en 12 pierde 16 px; ninguno cambia de ancho; y la etiqueta del carril puede quedar a 8 px del muro, no a 16. Pruebas nuevas (2, en `map-layout.test.ts`): `a name of 30 characters, in the server of names that opens a card, fits the snake at 360 px: 24 + 48 + 44 + 6 + 230, and 8 px to the wall` y `the lane of a name of 30 characters comes within 8 px of the wall on whichever side it hangs, and the snake holds at every width`. Pruebas de M5 que cambian de contrato, a propósito: `the lanes hang from their bus on the side where the line comes from, with the name of the server on the far side of its icon` (`stack.test.ts`: la puerta a `SNAKE_LANE` y no a `COMPACT.lane`, la etiqueta a 8 px del muro y no a 16, y el caso de los carriles hacia la izquierda pasa de 360 a 400 px, porque a 360 la otra oficina ya cabe en una línea menos y cuelga a la derecha), `the longest name of the registered worlds fits a lane of the snake at 360 px` (`map-layout.test.ts`: la etiqueta a 8 px del muro y no a 16; mismo título) y `a name of 30 characters, which no registered world has, widens the snake past 360 px instead of leaving the map` (`map-layout.test.ts`), que pasa a llamarse `a name of 30 characters with its lock, which no registered world has, widens the snake past 360 px instead of leaving the map` porque sin candado ya cabe. Once mutaciones de las cifras (carril de 52 y de 40, bus a 38 y a 16, margen de 16 y de 0, el margen de `extentOf`, el de la regla del bus por cada lado, y la longitud y el alcance del carril): una sobrevivía al principio (el margen del lado izquierdo de la regla del bus) y por eso existe la segunda prueba nueva; ahora caen las once. Totales: Vitest 3230 pruebas en 110 archivos (3228 antes: 2 pruebas más); `pnpm check:fast` en verde (0 clones). No se corrió el modo navegador ni la e2e: el 2D aún no se ve en el juego.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M5.** Todas cambian lo que el jugador verá en el teléfono y en las ventanas estrechas (el mapa 2D aún no se ve en el juego); ninguna cambia lo que aprende:
    - La serpiente mide el ancho que se le da: el bus de la oficina queda en el borde derecho y los enlaces de los equipos se alargan, en vez de dejar el dibujo angosto y vacío a la derecha. Más ancho no la acorta: deja entrar más paradas en una línea.
    - El nombre de un equipo va encima de su icono, alineado a la izquierda con él, a 47 px de su enlace (donde acaba el abanico de 3 casillas); una fila mide 118 px (158 con firewall), no 100. La etiqueta de un firewall va 47 px bajo el enlace, centrada bajo la barra y sin pasar del contorno del bloque: con el enlace de 283 px de la fila no cabía en 360 px.
    - Las etiquetas de las paradas (router, borde, internet) van bajo la línea en la serpiente, no encima, y el router de la oficina no queda sobre el borde de su caja: la segunda línea corre por todo el ancho y se montaría sobre el borde punteado, y una puerta de enlace de otra oficina baja desde arriba hasta el primer router, que no puede tener su etiqueta encima.
    - Los troncos salen del último equipo de cada bus, giran a la derecha hasta un canal fuera de las cajas y bajan por él; con varios pisos van en paralelo a 8 px (el spec), el piso de más arriba por fuera, así que ninguno cruza a otro. La última bajada queda a 43 px del muro derecho para que quepa el abanico de una marca. La línea queda lo bastante abajo de la oficina para que la mitad del primer tramo no caiga en la esquina, sobre el cabo del bus ni sobre un equipo sin cable.
    - Cuando una parada no cabe en la línea, la línea sigue en la siguiente, que corre al revés, a 114 px; una parada va en el primer lugar que guarda los 172 px, 8 px entre etiquetas, su marca y la mitad de su tramo sobre un tramo recto. A 360 px con tres routers y el internet salen varias líneas y alguna queda sin parada (un enlace largo): el spec solo describe dos líneas.
    - Los carriles de servidores y clientes cuelgan del bus del final de la línea hacia dentro del mapa: a la derecha del bus si la línea corre de derecha a izquierda (como dice el spec) y a la izquierda, con el nombre a la izquierda del icono, si corre de izquierda a derecha. Miden 44 px del bus a la puerta (`SNAKE_LANE`, el del spec; los carriles de la fila miden 66 y 52), el bus queda a 24 px del muro del final de la línea (`SNAKE_BUS_WALL`) y el final del nombre más largo a 8 px del otro muro (`SNAKE_LABEL_WALL`, como en la suma del spec y no los 16 px que guarda el resto del mapa), y el primero queda a 114 px bajo la línea.
    - La otra oficina queda bajo la primera con su puerta de enlace en una fila propia bajo sus cajas, sobre el primer router en la misma `x`, unida por el enlace privado (vertical, 114 px) y con su nombre a la izquierda del icono; el primer router se corre a la izquierda lo que haga falta para que la mitad del tramo desde el bus de esa oficina (que pasa por la puerta de enlace) no caiga sobre su icono.
    - Un nombre demasiado largo para su carril ensancha la serpiente (de 8 en 8 px) en vez de salirse del mapa: el de 30 caracteres de `officeWithNames()` (`servidor-autoritativo-noticias`) cabe a 360 px sin candado, que es como lo dibuja el juego (un servidor de nombres abre una tarjeta), y con el candado de las pruebas (etiqueta de 256 px) pide 392 px. Ningún mundo registrado tiene un nombre así; el más largo de los registrados cabe a 360 px.
    - En `layoutMap`, a igual ancho natural la fila normal gana a la compacta, un ancho menor de 360 cuenta como 360, y los modos de fila devuelven su ancho natural (el dibujo se centra en su caja) mientras que la serpiente devuelve el ancho dado.
  - **Abiertas.**
    - La fila de M4 con cinco carriles (los nombres del capítulo 2 con todos los routers dibujados) deja `mid:internet-door:<servidor>` a 28 px (35 en la compacta) de `mid:door:<servidor>-door:<siguiente>` sobre el bus de los carriles, a menos de los 40 px de la regla 2; ninguna prueba de la fila cubre ese mapa y ningún incidente registrado tiene cinco carriles, así que lo dirá el barrido de M8 si algún estado lo pone. Quedó anotado en «Known limits» de `arrange/CLAUDE.md`.
    - Las alturas de la serpiente (de 629 a 1250 px a 360) y las líneas sin parada son consecuencia de las reglas de arriba; si el estudiante las ve largas, lo que se afloja es el paso de 114 px o la regla de la mitad del tramo, no la estructura.
    - `layoutStack` lanza `NoRoomError` cuando una parada no cabe tras ensancharse 400 px o usar 24 líneas, mientras que `layoutRow` nunca lanza, y la Tarea M9 llamará a `layoutMap` mientras dibuja. Ningún mundo registrado llega a ese límite y ninguna prueba lo cubre; se anota y no se arregla aquí.
    - `LOCK_WIDTH` y `ALERT_WIDTH` siguen sin medir (M21): las pruebas de M5 leen `labelWidth`, salvo la de la etiqueta de un firewall ancha, que fija 170 px con el candado de 26.
- **Cierre de la Tarea M6 (2026-10-18).** Medido en `feat/chapter-2` sobre `de11352` con los cambios de M6 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `src/scene/map2d/marks/` con su guía y ocho archivos planos de 12: `stamp-fan.ts` (`fanStamps`), `packet-tags.ts` (`placeTags` y `separateGlyphs`), `collisions.ts` (`collisions`), `boxes.ts` (`crowds` y `holds`, el séptimo archivo, que el plan no nombra) y las pruebas de los cuatro. La guía de `map2d/` nombra la carpeta nueva. No se tocó `layout/`, ni `engine/` ni `levels/` ni el 3D (el `git diff --stat efe355b..HEAD` de los archivos 3D y el `git diff --name-only efe355b -- src/engine src/levels` salen vacíos y `golden-traces.json` no cambia). La Tarea 28 quinquies nunca aterrizó: no hay nada que portar y su texto fue solo contexto de lo que significan la prioridad, la antigüedad y «+N». M6 no tiene casillas `- [ ]`.
  - **Las pruebas.** 31 nuevas: 11 en `stamp-fan.test.ts`, 8 en `packet-tags.test.ts`, 8 en `collisions.test.ts` y 4 en `boxes.test.ts`. Están las 15 del plan con su título exacto: nueve en `stamp-fan.test.ts`; cuatro en `packet-tags.test.ts` (la etiqueta que se aparta, la que nada toca, la del sello escondido y las dos formas en un punto); y dos en `collisions.test.ts`, la de la colisión y `two stamps of different marks of one link never come closer than their own boxes`, que necesita mapas de verdad y por eso vive allí. Además: la prueba de que un lugar sin marca lanza, la del orden de los abanicos, las de subir y bajar de la etiqueta (por un camino horizontal, por uno que baja y por uno con codo), tres formas en un punto, el mismo abanico de `collisions` fuera de su caja, y cinco barridos sobre 112 mapas (los mundos de partida de los 25 incidentes, la oficina de dos pisos y la de los nombres, dibujados enteros, y la otra oficina del 02-07 con las piezas de `row.test.ts`; en la fila, la fila compacta y la serpiente a 390 y 900 px). Uno de los barridos pone en cada marca un abanico lleno (una casilla más que las que caben) y exige que `collisions` no dé ningún par fuera de los tres lugares que M4 exime, con sus nombres, y que dé al menos uno en cada lugar; otro mira que todo lugar donde termina un ping (10 676 finales, con `hiddenStop` en falso y en verdadero) tiene marca, que es lo que permite que `fanStamps` lance en lugar de perder un sello.
  - **Rojo primero.** Con las cuatro funciones como cascarones de su firma final que devolvían vacío (`fanStamps` sin abanicos, `placeTags` y `separateGlyphs` sin nada, `collisions` sin pares), las 25 pruebas de entonces dieron 24 rojas (con un valor de menos o con un `TypeError` al leer lo que el cascarón vacío no devuelve) y 1 que pasaba en vacío (que un abanico lleno no cubre una etiqueta ni un icono, que recorre una colección vacía): se le añadió que lo recorrido no esté vacío, y eso pidió la otra oficina del 02-07 con sus piezas, porque con todo dibujado el abanico de `mid:bus` no llega al icono del router de la sucursal. Se escribieron después del código `every place where a ping can end has a mark`, que describe lo que ya hacían M3 y M4 (no puede estar en rojo con un cascarón de M6), y lo que salió de mutaciones que sobrevivían (abajo). Después, 52 mutaciones distintas sobre el código terminado, cada una restaurada: el paso de 25 px, la prioridad de los problemas, el orden de la antigüedad, los flujos vivos, la cuenta de `N`, la lista de «+N», el centrado, el sentido de subir y bajar, el paso de 22, tres arriba y dos abajo, los obstáculos y las etiquetas ya puestas, el desempate hacia delante, los cruces en `x` y en `y`, el paso de 12 de las formas y su retroceso, la excepción de un mismo abanico y su caja, cada tipo de caja de `collisions` y los dos criterios de `boxes.ts`. Con las primeras 48 sobrevivían cinco, y una de ellas era equivalente: los vértices del camino no hacen falta, porque el lugar libre más cercano es siempre el medio o un roce de bordes, y se quitaron del código (comparado con un barrido cada 0,5 px sobre 1416 etiquetas de 300 mapas, ninguna tenía un lugar mejor). Las otras cuatro dieron pruebas: el id de «+N», los dos extremos de `crowds` y de `holds`, y la etiqueta que se desliza por un camino vertical y sube o baja desde el final de la hoja que la bloquea. Con ellas y las pruebas nuevas caen las 52 (se corrieron otra vez sobre el árbol final, con `moreId` ya sin exportar).
  - **Totales con M6.** Vitest 3261 pruebas en 114 archivos (3230 en 110 antes: 31 pruebas y 4 archivos más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: M6 es pura. `collisions.test.ts` tarda unos 0,8 s, casi todo en dibujar los 112 mapas.
  - **Qué hacen los abanicos reales en los tres lugares que M4 exime.** Medido con un script desechable (no entra al commit) sobre 738 mapas: los 25 incidentes al empezar (sin y con todos los términos conocidos), resueltos y en cada caso, con las piezas de `pieceViews`, en la fila, la fila compacta y la serpiente a 360, 390, 768, 900, 1060, 1280 y 1440 px, con un abanico lleno en cada marca. `collisions` da pares en los tres lugares y en ningún otro (0 pares sin clasificar), y no se ensanchó ninguna excepción:
    - **`bus-end` contra `road`:** `road:<último equipo del bus>` (3 casillas) y `bus-end:<bus>` (1) a 40 px, en los 738 mapas. Chocan con 2 sellos en el camino y 1 en el cabo.
    - **`mid:bus:*` de buses con tronco común:** en la VPC del capítulo 4 (04-01 y 04-02, en la fila: 12 mapas) las dos `mid:bus` coinciden (0 px) y chocan con 1 sello cada una; `road:<equipo>` contra `mid:bus:*` a 11, 28 o 42 px (51 mapas de 01-06, 01-07, 01-08, 02-04, 02-06 y 02-07, en los tres modos), `bus-end:<bus>` contra `mid:bus:*` a 26 px (02-04 y 02-06 en la fila: 12 mapas) y `router:<sucursal>` contra `mid:bus:*` a 27 px (02-07 en la fila: 6 mapas), todos con 1 sello cada una; y en esos 6 mapas del 02-07 un solo sello de `mid:bus:branch-lan-router:office-router` cubre el icono del router de la sucursal (a 19 px de su centro).
    - **Marcas del bus de los carriles:** `mid:internet-door:<servidor>` contra `mid:door:<servidor>-line-end` a 13 o 22 px (50 mapas de 01-08, 01-09, 01-10, 01-14, 02-07 y 02-08, en la fila), `door:<servidor>` contra `mid:door:<servidor>-line-end` a 33 o 36 px (200 mapas de los mismos, en la fila compacta y la serpiente), y `door:<carril>` contra `mid:<parada>-line-end` a 32 px con 1 sello cada una o a 52 px con 2 y 1 (63 mapas de 02-09, 04-01 y 04-02, en la fila compacta y la serpiente).
    - **Los flujos de los incidentes** (lo que cada uno corre solo) puestos como sellos en los 450 mapas de los estados de partida no chocan en ninguno y ninguno necesita un «+N»: el barrido de M8, con los envíos del jugador, dirá si algún estado pone dos sellos en uno de esos lugares. La tabla completa está en la guía de `marks/` («Known limits»).
  - **Con las piezas reales.** Otro script desechable (tampoco entra al commit) puso, en 300 mapas (los 25 incidentes al empezar y resueltos, en la fila, la fila compacta y la serpiente a 360, 390, 900 y 1440 px), una etiqueta de 130 px (`TCP 51514 → 3000`) por cada uno de 4 u 8 pings repartidos entre los remitentes y las IP de su mundo, con un sello en cada final: `placeTags` no lanza y cada llamada tarda menos de 400 ms; comparada con un barrido cada 0,5 px de todo el camino en las seis alturas, ninguna etiqueta tenía un lugar mejor que el que eligió ni uno libre donde dice `clear: false`. Con 4 etiquetas a la vez, 280 de 768 no encuentran lugar (36 %), y con 8, 436 de 1416 (31 %): es una carga de estrés (ningún incidente tiene tantas etiquetas de paquete a la vez), y las 24 etiquetas de los flujos con puertos de esos mapas quedan todas libres y sin ninguna colisión. Ningún final de ningún ping de los 25 incidentes (38 880 combinaciones de ping, mapa y `hiddenStop`) queda sin marca.
  - **Ronda de arreglos 1** (la revisión de M6 pidió que `placeTags` cumpla por sí sola el contrato del plan, sin depender de que quien llama aplique antes otra función): el filtro de O-8, que era `stillTags` exportada, pasa dentro de `placeTags`, que recibe los abanicos como tercer argumento (por defecto, ninguno) y no coloca la etiqueta de un sello escondido; `stillTags` queda privada. Cambia de contrato, a propósito, la prueba `the label of a hidden stamp is not drawn on the still map and its text is in the list` (`packet-tags.test.ts`; mismo título, ahora llama a `placeTags(etiquetas, [], [abanico])` y comprueba además que la etiqueta escondida no empuja a las otras). Las cuentas no cambian (31 pruebas, 3261 en 114 archivos).
  - **Decididas sin el estudiante (para revisar), más allá del texto de M6.** Las cuatro primeras cambian lo que el jugador verá; ninguna cambia lo que aprende:
    - Los sellos que se ven quedan en el orden en que se dan (quien llama lo decide, M12), del extremo bajo del eje (`y` hacia abajo, `x` hacia la derecha) al alto, y «+N» en la última casilla. Un abanico de menos sellos que casillas se centra en la marca con tantas casillas como sellos, y solo uno lleno (o con «+N») usa todas las de la marca.
    - La etiqueta de un paquete: primero sobre su camino y no más lejos de lo que hace falta (el lugar libre más cercano al medio, hacia delante si hay empate); si ningún lugar del camino está libre, sube 22 px y prueba otra vez todo el camino, luego baja 22, sube 44, baja 44 y sube 66 (arriba es hacia `y` menor; tres arriba y dos abajo, como dice el plan). Cada etiqueta puesta es un obstáculo para las siguientes, en el orden en que se dan: la primera nunca se mueve por las otras. El plan no daba el paso a lo largo ni el desempate; los lugares que se prueban son los roces de bordes con los obstáculos, no un paso en píxeles.
    - Una etiqueta que ninguna altura libra se queda en el medio de su camino y dice `clear: false`; `collisions` la lista. No se esconde ni se acorta.
    - Tres o más formas de paquete en un punto: cada una se corre otros 12 px, la tercera 24; cerca del final de un camino la forma se corre hacia atrás. «Mismo punto» es a menos de 1e-6 px.
    - `StampSource` es estructural (un id, si es de problema y su `send` o ninguno), porque la escena no puede importar `@/game` ni el `isProblemStamp` que trae M7; la lista de «+N» (`more.ids`) va en el orden en que se dieron los sellos, y que el sello más nuevo vaya primero es cosa de M7 (el juego conoce el `send`).
    - `fanStamps` lanza si un lugar con sellos no tiene marca, en lugar de perder el sello en silencio; el barrido de arriba muestra que no pasa con ningún final de ningún ping.
    - O-8 lo hace `placeTags` con su tercer argumento, los abanicos (`placeTags(etiquetas, obstáculos, abanicos)`): no coloca la etiqueta del paquete cuyo sello se esconde en un «+N», y esa etiqueta tampoco empuja a las demás; la etiqueta de un paquete sin sello se coloca siempre. El tamaño de la caja de cada etiqueta lo da quien llama (M13 con `labelWidth`).
    - `collisions` revisa etiquetas de pieza, iconos, sellos («+N» incluido) y etiquetas de paquete, y deja pasar dos sellos de un mismo abanico mientras los dos estén dentro de su caja. Usa un ruido de 1e-6 px (`boxes.ts`) para que un decimal de más no sea una colisión.
  - **Abiertas.**
    - El spec pone el nombre de un grupo entre lo que no se debe pisar, pero el layout no tiene la caja de ese nombre (M11 decide dónde va): `collisions` y los obstáculos de `placeTags` no lo cubren todavía. M11 (o M8, que barre) debe sumarlo.
    - Si el barrido de M8 encuentra etiquetas de paquete sin lugar (`clear: false`), lo que se afloja es el alcance de subir y bajar (tres y dos, la O-10 = A) o dejar que la etiqueta salga de su camino; no se decide aquí.
    - Las marcas de una casilla (medido en 450 mapas, 25 incidentes empezando y resueltos en la fila, la compacta y la serpiente a siete anchos: `bus-end` 594 de 594, `mid:bus:*` 158 de 594, `mid:<parada>-line-end` 156 de 324, `line-end` 2 de 450 y otras `mid` 2 de 378) convierten dos sellos cualesquiera en un «+2» solo. Todo sello que termina ahí es de un paquete que murió (nadie tiene la IP, o lo tiró un router que el mapa no dibuja), o sea de problema: dos envíos a IP que nadie tiene en un mismo bus esconden dos sellos de problema. El centinela de J16 de M8 (`in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»`) fallará si algún incidente ofrece dos combinaciones que terminan en una misma marca de una casilla; en ese caso M8 se detiene y lo informa, sin agregar excepciones ni tocar las marcas de M4.
    - Quien dibuje los sellos (M12) debe mandar a `fanStamps` el `send` de la última vez que se mandó cada combinación (`lastOfEach` ya lo guarda) y nada del primero.
- **Cierre de la Tarea M7 (2026-10-18).** Medido en `feat/chapter-2` sobre `66347ae` con los cambios de M7 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** En `src/copy/`: `stampOf` e `isProblemStamp` en `packet-labels.ts` (con el tipo estructural `StampResult` y `STAMP_TEXT` exportado) y en el barrel; `INSPECTION_TEXT.stampsTitle` y `INSPECTION_TEXT.stampLine`, y `MAP_TEXT.moreStamps`, en `incident-ui.ts`. En `src/game/view/`: `PIECE_ID.stamps(ids)`, `STAMPS_SEPARATOR` y el caso `stamps` de `PieceRef` y `parsePieceId` (`piece-id.ts`); el caso `stamps` de `inspect` y `Inspection.entity` opcional (`inspection.ts`). `InspectionBox` dibuja el icono solo si hay entidad. `flowLook` usa `stampOf` y su `stampState` privado salió (mismo orden de casos). Las guías de `copy/`, `game/view/` y `ui/incident/` lo cuentan. Ningún archivo plano nuevo en `src/game/`, `src/game/view/`, `src/copy/` ni `src/ui/incident/`. El único archivo del 3D que cambia es `flow-look.ts` (`git diff --stat efe355b..HEAD` de los archivos 3D lo lista solo a él), `src/engine/` y `src/levels/` no cambian y `golden-traces.json` sale limpio. La Tarea 28 quinquies nunca aterrizó: no había nada que portar. M7 no tiene casillas `- [ ]`. El revisor de textos de la viñeta de M7 (el título y el nombre accesible) no lo corre quien implementa: va aparte.
  - **Las pruebas.** 8 nuevas: las 7 de M7 con su título exacto (2 en `packet-labels.test.ts` y 5 en `inspection.test.ts`) y una más en `packet-labels.test.ts` que fija el orden de los dos números del nombre accesible, `MAP_TEXT.moreStamps(escondidos, total)`, porque se pasan por posición y es fácil cambiarlos. Ninguna prueba existente cambia (las de `flow-look.test.ts` y `stamp-states.test.ts` siguen iguales y verdes). La del separador toma los ids de los datos de verdad: los `id` de los flujos de cada incidente y el `id` de la corrida de cada combinación de cada incidente `send` y de cada caso de un `diagnose` (`sendPacket`), no una plantilla escrita a mano.
  - **Rojo primero.** Con cascarones de la firma final (`stampOf` que devolvía siempre `arrived`, `isProblemStamp` siempre falso, `PIECE_ID.stamps` que devolvía `stamps:` sin ids, `inspect` que devolvía null para `stamps` y los tres textos vacíos), los dos archivos dieron 7 rojas y 125 verdes de 132. La que pasaba con el cascarón es la del separador, que ya tenía `|`: se comprobó con mutaciones. Con el separador en `-` sale roja; con `:`, `,`, `.`, espacio, `+`, `;`, `_`, `#`, `~`, `@` o `|` sale verde, porque los 91 ids de los 25 incidentes (50 distintos) solo tienen `-`, dígitos y las letras `abcdefghiklmnoprstuvwy` (medido con un script desechable que no entra al commit). Después, 20 mutaciones sobre el código terminado, cada una restaurada, y las 20 cayeron: el orden de `stampOf` (aviso antes de llegó, el intruso, el bloqueado), cada una de las cinco entradas de `isProblemStamp`, el orden de los enviados, el de los flujos, los flujos después de los enviados, la lista parcial, la lista vacía, la cuenta del título, la línea que ignora el estado, la entidad que reaparece, la etiqueta, la lista vacía que se lee como `['']`, los demás tipos de id que dejan de leerse y los dos números de `moreStamps` cambiados.
  - **El separador.** `|` (`STAMPS_SEPARATOR`). El id de «+N» es `stamps:` y los ids de los paquetes (`PacketRun.id`, no su `pieceId`) unidos por `|`; `parsePieceId` lo lee de vuelta a `{ kind: 'stamps', ids }`, y `stamps:` sin nada se lee `[]`. Ninguno de los ids de hoy lo tiene y la prueba `no id of a packet of any registered incident holds the separator of the id of a list of stamps` falla si un incidente nuevo lo trae.
  - **Totales con M7.** Vitest 3269 pruebas en 114 archivos (3261 antes: 8 más y ningún archivo más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones). No se corrió el modo navegador ni la e2e: las puertas del orquestador las cubren. Ningún texto ni dibujo de hoy cambia, y las pruebas de la caja de `incident-screen.test.tsx` pasan sin tocarlas.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M7.** Ninguna cambia un texto de hoy (el 3D no dibuja «+N»); las tres primeras cambian lo que el jugador verá cuando M12 dibuje «+N», y ninguna cambia lo que aprende:
    - El orden de la lista, «el sello más nuevo primero»: lo que el jugador mandó, del último envío al primero (`send` de mayor a menor), y después los flujos del incidente, del último del incidente al primero, porque un flujo no tiene `send` y es más antiguo que todo lo que el jugador manda (la misma antigüedad de M6, al revés). El orden en que se dan los ids no cuenta.
    - La lista es todo o nada: `inspect` da null si algún id ya no nombra un envío (el mundo cambió y los envíos se borraron) o si no hay ids, no solo si ninguno existe. Así la caja fijada se suelta, como la de cualquier pieza que ya no existe, en lugar de quedarse con una lista más corta cuyo título cuenta menos sellos que los del «+N».
    - La línea de cada sello es la frase de su sello (`STAMP_TEXT`: «Llegó.», «Bloqueado.», «Perdido.», «Entró y no debía.», «Apareció un aviso.»), sacada de `stampOf(corrida)`: dice lo que dice el sello que el jugador ve, con la misma regla de `known`. No hay texto nuevo en la línea. El título es «N sellos juntos» (decidida 50 de la 28 quinquies) y el nombre accesible la propuesta del plan, «N sellos más. Abre la lista de los T sellos de este lugar.», con N los escondidos y T todos los del lugar. El título cuenta los ids de la lista: con un solo id diría «1 sellos juntos», y no se puede llegar a eso desde un «+N», que esconde al menos 2.
    - `StampResult` es un tipo estructural de `@/copy` (`warning`, `reached`, `intruder`, `blocked`), porque `copy` no puede importar `FlowResult` de la escena; `FlowResult` y `PacketRun` lo cumplen sin convertirse. No cambia lo que se ve.
    - La clave de cada campo de `InspectionBox` pasó de la etiqueta a su posición y su etiqueta: dos paquetes de una lista pueden tener la misma etiqueta («ping de tu-laptop a printer» sale dos veces en la prueba, uno de un flujo y uno enviado) y React avisaba de claves repetidas. No cambia lo que se ve.
  - **Abiertas.**
    - `InspectionBox` sin entidad no tiene prueba propia: ningún archivo que M7 nombre la aloja, y `src/ui/incident/` ya tiene 10 de 12 archivos con tres más planeados (M8, M21). Se comprobó con una prueba desechable (rojo con el código anterior, con un `TypeError` al leer `kind`; verde con el nuevo, sin icono en el título; y con la clave de antes, el aviso de claves repetidas) que no entra al commit. Queda sin cubrir hasta una prueba de pantalla con un «+N» (M20 toca `incident-screen.test.tsx`).
    - Quien dibuje los sellos (M12) debe mandar a `PIECE_ID.stamps` los `id` de los paquetes del lugar (los de `fanStamps`, `more.ids`), no sus `pieceId`, y a `fanStamps` `isProblemStamp(stampOf(corrida))` como `problem`.
- **Cierre de la Tarea M8 (2026-10-19).** Medido en `feat/chapter-2` sobre `fbe931d` con los cambios de M8 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `src/scene/map2d/cards/` con su guía: `placement.ts` (`terminalSide`, `dockOffset`, `cardTop`, `sideHeight`, `dockHeight`, `dockRoom` y `cardSpan`, portadas con las mismas constantes y las mismas reglas en otra forma porque jscpd no admite una copia mientras convivan, y `cardPlacement`, que sale de las cajas del layout y no de una cámara) y `placement.test.ts`. `layout/captions.ts` y su prueba (`captionBoxes`, la caja del nombre de cada grupo, que la decisión de M6 pedía a M8). `marks/reading-order.ts` y su prueba (`readingOrder`). `marks/collisions.ts` acepta los nombres de grupo (`captions`, opcional) y lista el «+N» por su `id`. `marks/stamp-fan.ts`: el «+N» (`MoreStamp`) trae su `id` (`more:<estación>`) y `hidesProblem`. `marks/packet-tags.ts`: las alturas exactas y `PacketTag.staysInDevice`. `src/ui/incident/map-sweep.test.ts`. Las guías de `map2d/`, `layout/`, `marks/` y `cards/` lo cuentan. No cambian `src/scene/layout.ts` (3D), `layoutMap`, `MapLayout`, `src/engine`, `src/levels` ni `golden-traces.json`; el `git diff --stat efe355b..HEAD` de los archivos 3D lista solo `src/scene/traffic/flow-look.ts`, que es de M7. M8 no tiene casillas `- [ ]`.
  - **Las pruebas.** 66 nuevas: 37 en `placement.test.ts` (los 31 de los cuatro `describe` de tarjetas de `layout.test.ts` portados con su nombre y con las cajas del layout, los 3 del plan y 3 más), 5 en `captions.test.ts`, 6 en `reading-order.test.ts`, 1 en `collisions.test.ts`, 3 en `stamp-fan.test.ts`, 5 en `packet-tags.test.ts` y 9 en `map-sweep.test.ts` (4 del plan). Están todas las del plan con su título exacto, salvo el centinela de J16, que el estudiante aprobó renombrar (abajo). **Cambian a propósito:** el centinela, de `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»` a `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N» without showing it`; en `packet-tags.test.ts`, `the label of a packet moves clear of a stamp, of the label of a piece, of a box and of another label, along its link first and then up or down` (del plan, mismo título; los lugares de la etiqueta sobre una pared cambian de 56, 144 y 34 a 70, 130 y 36 con las alturas exactas) y `slides along the path before it climbs, and climbs before it falls: three steps of 22 px up and two down` (ahora `slides along the path before it climbs or falls, and climbs or falls only as far as the first height that clears`; el cuerpo no cambia); y en `collisions.test.ts` una prueba añadida (el contrato de `collisions` suma `captions`).
  - **Rojo primero.** De lo que entró en esta vuelta (el «+N» con su `id` y su `hidesProblem`, las alturas exactas, `staysInDevice` y el barrido con las etiquetas de paquete): las pruebas se escribieron antes que el código y, con el código de antes, `stamp-fan.test.ts`, `packet-tags.test.ts` y `map-sweep.test.ts` dieron 9 rojas y 26 verdes de 35 (`hidesProblem` e `id`, la altura sobre la pared, la etiqueta que no sale de su equipo, y en el barrido la etiqueta de `you → ip-loopback` de 02-03 a 360 px sin lugar, la cuenta de las etiquetas dejadas fuera y el centinela). Las nuevas que pasaban entonces (el alcance de 66 y 44 px, la etiqueta que sí tiene lugar) se comprobaron con mutaciones. Lo anterior de M8 (`placement.ts`, `captions.ts`, `reading-order.ts`) se escribió después del código y se comprobó con mutaciones sobre el código terminado, cada una restaurada: el `avoid` con solo el centro de cada etiqueta sobrevivía y por eso existe `a card keeps clear of the whole box of a label wider than twice the reach, and not only of its middle`; las demás (el paso de `reachPoints`, los abanicos de `pieces`, los lados, el ancla, el hueco del firewall, el ancho por carácter y la `y` del nombre, el orden de lectura, los nombres en `collisions`, `MARK_SPACING`) caen. Sobre el código nuevo de esta vuelta, 25 mutaciones, cada una restaurada: el alcance (66 a 88 o a 65, 44 a 66 o a 43, los extremos excluidos), el desempate (hacia abajo, siempre hacia arriba, el más lejos primero), los roces (un píxel de más o de menos arriba y abajo), los anclajes de las alturas (sin los vértices del camino, sin los cruces en `x`), la bandera de las etiquetas que no salen (siempre, nunca, invertida), `hidesProblem` (siempre falso, siempre verdadero, el que cuenta los problemas listados, el que cuenta cualquier escondido), el `id` del «+N» y la bandera del barrido (nunca, o con `door:`, o con las etiquetas de tres alturas): todas caen menos una, la bandera del barrido siempre encendida, que es equivalente con los datos de hoy (ninguna etiqueta de un paquete que sale de su equipo se queda sin lugar; si alguna lo hiciera, la prueba compara la estación con `[door, doorstep]` y cae). Contra una búsqueda de fuerza bruta (cada 0,5 px del camino y de la altura) en 40 000 caminos al azar, 20 000 rectos y 20 000 oblicuos, con 1 a 6 cajas: `placeTags` nunca deja de ver un lugar, nunca pone la etiqueta sobre una caja y nunca usa más altura que la menor; y lo mismo en las 107 etiquetas del barrido que se mueven o se quedan fuera (el script se desechó, no entra al commit). Esa búsqueda halló que los vértices del camino no bastan en un camino oblicuo (33 de 3000 no eran mínimos), y se sumaron los cruces en `x` (`on a slanted path it climbs from the place where its box meets the side of what is in the way`, escrita después, cae sin ellos); ninguna ruta del layout es oblicua (3436 tramos de las etiquetas del barrido, 0 oblicuos), así que esto es rigor y no cambia lo que el jugador ve.
  - **Totales con M8.** Vitest 3336 pruebas en 118 archivos (3270 en 114 antes: 66 pruebas y 4 archivos más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure y jscpd con 0 clones); `pnpm test:browser` 4 pruebas en 1 archivo. No se corrió la e2e ni `pnpm check` completo: son la puerta del orquestador.
  - **El barrido.** 25 incidentes, 180 estados y 1260 mapas (los siete anchos). Los estados: el de partida de los 25; el resuelto de 24 (el diagnóstico 01-14 no cambia el mundo); 10 de regla equivocada en los incidentes de filtro (01-12, 02-05, 04-01 y 04-02: cada regla de las fichas que deja entrar al intruso, para tener piezas con la alerta, cuya etiqueta es 22 px más ancha); y 121 con envíos (cada combinación de fichas sola, en el mundo de partida de cada incidente `send` y en cada caso del diagnóstico, y todas las combinaciones juntas, en la partida y, en los `send`, en el resuelto). Los flujos de los incidentes que los tienen entran en todos como sellos, y los envíos como el último de cada combinación, con `isProblemStamp(stampOf(…))`. **Tarda 0,56 s el recorrido entero** (con las etiquetas de paquete puestas) y 1,06 s el archivo de pruebas. Lo que encontró: ningún solape (etiquetas de pieza, iconos, nombres de grupo, sellos y etiquetas de paquete) ni lugar sin marca en ningún estado, sin excepciones. De las 532 etiquetas de paquete con puertos, 70 van dentro de un «+N» (O-8), 416 tienen lugar (52 de paquetes que no salen de su equipo) y 46 se dejan fuera por O-10 (i): todas de paquetes que no salen de su equipo, en 02-03 con todas las combinaciones enviadas (partida y resuelto, 14 mapas). Los sellos reales caen solo en `door`, `doorstep`, `router`, `firewall` y algunos `mid`, todos de tres casillas: ningún incidente registrado ejerce los tres límites que M4 exime ni una marca de una casilla.
  - **Lo que se paró, y lo que se decidió.** El implementador anterior paró en dos casos que el encargo mandaba informar sin excepciones, ambos en 02-03. **Decidido por el estudiante (2026-10-19):** (J16) un «+N» que esconde al menos un sello con problema lleva un punto pequeño del color de peligro del juego en su borde inferior derecho (el aro sigue siendo de tinta; un «+N» que esconde solo sellos que llegaron no lleva punto), y el centinela pasa a ser que ningún «+N» esconde un problema sin mostrarlo (de ahí su título nuevo); (O-10 = (i)) la etiqueta de un paquete que no sale de su equipo (su camino acaba en su propio umbral) y no encuentra lugar libre no se dibuja en el mapa quieto y su texto aparece al inspeccionar su sello, como O-8 hace con los escondidos; toda otra etiqueta de paquete tiene que encontrar lugar, y el barrido falla si una no lo encuentra. **Decidido por la sesión principal bajo el «Umbral»:** (O-10 = A') las etiquetas de paquete suben o bajan a alturas exactas (el primer píxel en que su caja deja libre lo que estorba) en lugar de pasos de 22 px, con el mismo alcance (tres arriba y dos abajo) medido en píxeles, 66 y 44: arregla los 12 envíos solos de 360 y 390 px de 02-03, y manda sobre «de 22 en 22 px» del texto de M6 (la línea de `placeTags` más arriba) y del spec («Los paquetes y su etiqueta»), que no se editan. M8 pone solo el modelo puro de J16 (la bandera `hidesProblem`); **dibujar el punto, su muestra en el catálogo y su nombre accesible (las palabras, en `src/copy/`) son de M12.**
  - **Decididas sin el estudiante (para revisar), más allá del texto de M8.** Las siete primeras cambian lo que el jugador verá; ninguna cambia lo que aprende:
    - **El ancla de la tarjeta en 2D** es el centro del icono de la pieza, y los huecos de 70 px (terminal) y 110 px (firewall) se miden desde ahí, como en el 3D se medían desde el punto donde está la pieza: con 70 px la tarjeta de un terminal abre justo después del sello de la puerta (24 de medio icono, 22, 18 de medio sello y 6 de holgura). El spec dice «se ancla al cuadro de la etiqueta», pero en la fila la etiqueta está a la izquierda del icono y una tarjeta medida desde ella taparía el icono y el sello de la puerta. Las etiquetas entran como lo que se debe evitar.
    - **Etiquetas anchas.** `LABEL_REACH` (64) se lee como 64 px a cada lado de cada `x`; una etiqueta de 2D mide 7,2 px por carácter (170 con candado en 18 caracteres, 245 con 32), y `cardPlacement` da a `terminalSide` y a `dockRoom` los `x` que hacen falta (`reachPoints`) para que esos 64 px cubran la caja entera. Las firmas portadas no cambian.
    - **La tarjeta acoplada esquiva también los sellos posibles**, además de etiquetas e iconos (`cardPlacement.pieces` lista los abanicos de `marks`): en el 3D la esquina quedaba libre por la geometría de la banda; en 2D los enlaces corren a la derecha de los iconos.
    - **Una tarjeta al lado de su pieza tapa los sellos de los enlaces que quedan bajo ella.** `avoid` es solo de etiquetas, como en el 3D y como pide el plan; si el estudiante quiere que no los tape, `avoid` incluye los abanicos y casi toda tarjeta de un equipo de la oficina se acopla.
    - **El nombre de un grupo** es una caja en la esquina superior izquierda del grupo, a 14 px de ambos bordes y de 18 px de alto, dentro de la franja que el grupo ya reserva sobre su primera fila (`HEADER` = 14 + 18); su ancho es todos los trozos del nombre unidos por un espacio por 10 px por carácter (un techo: negrita mayúscula con 0,06 em de tracking). No se guarda en `MapLayout`: `captionBoxes(layout.groups)`. M11 decide el texto real («Oficina», «VPC», cómo se unen) y, si añade palabras, ajusta `captionBoxes`; el barrido lo vigila.
    - **`readingOrder`**, que M8 no nombraba: las piezas de arriba abajo y de izquierda a derecha por el centro de su icono; tras cada una, los abanicos más cercanos a su icono, de arriba abajo, y cada abanico en su orden, con el «+N» al final. M11 y M12 dibujan los botones en ese orden.
    - **Las alturas exactas de las etiquetas de paquete (O-10 = A')**, decididas por la sesión principal bajo el «Umbral», no por el estudiante: cuando una etiqueta no tiene lugar sobre su camino, sube o baja hasta el primer píxel en que su caja deja libre lo que estorba, en lugar de pasos de 22 px, con los mismos extremos (66 px arriba y 44 abajo: los tres pasos arriba y dos abajo de antes, medidos en píxeles). **Cambia lo que el jugador verá:** la etiqueta que se aparta de una pared pasa de 56, 144 y 34 px a 70, 130 y 36 en la prueba del plan, y las 12 etiquetas de un envío solo de 02-03 a 360 y 390 px, que la malla de 22 px dejaba sin lugar, quedan a 34 px sobre su camino. No cambia lo que aprende. Amplía las alturas que una etiqueta puede tomar dentro del mismo alcance (los 34 px arriba no estaban en la malla), así que el estudiante puede revocarla: es aflojar `placeTags`, que el encargo le reservaba. Manda sobre «de 22 en 22 px, hasta tres pasos arriba y dos abajo» del spec («Los paquetes y su etiqueta») y sobre la línea de `placeTags` del texto de M6 y de su Cierre, que no se editan. Su porqué: la malla de 22 px no es rigurosa (deja 12 etiquetas de 02-03 sin lugar) y las alturas exactas son la única opción que pasa los tres criterios sin mover los extremos.
    - `collisions` acepta `captions` (opcional) y lista el «+N» por su `id`; el `id` del «+N» es `more:<estación>`; `hidesProblem` es verdadera solo cuando un sello escondido es de problema, no cuando uno de problema está en su lista; `PacketTag.staysInDevice` es un booleano opcional que pone quien llama a partir de las estaciones (la última empieza con `doorstep:`), nunca por el largo del camino ni por haber fallado; y una etiqueta que se deja fuera por O-10 (i) no empuja a las demás, como las de O-8. Los estados del barrido y el tamaño de la etiqueta de paquete que usa (la caja de su texto más largo entre los tramos, pedido y respuesta, de 20 px de alto) son míos; cuando M13 decida cuál tramo está en el medio, el barrido puede afinarse y solo dará más lugares libres.
  - **Abiertas.**
    - **M12** debe mandar a `fanStamps` el último envío de cada combinación (`lastOfEach`) y `isProblemStamp(stampOf(corrida))` como `problem`, a `placeTags(caminos, obstáculos, abanicos)` los abanicos, y dibujar el punto de peligro de los «+N» con `hidesProblem` (más su muestra en el catálogo y su nombre accesible con palabras de `src/copy/`). **M13** debe poner `staysInDevice` desde las estaciones. Que la caja de inspección del sello de un paquete cuya etiqueta se deja fuera baste como «su texto» (trae sus encabezados con los puertos) lo confirma quien dibuje los sellos; M8 no lo toca. La Tarea que cierra las filas J16 y J17 del backlog dice hoy que J16 se mantiene: con esta decisión J16 queda respondida (el punto), y esa Tarea la cierra también.
    - **Títulos portados que dicen cosas del 3D (para M24).** Se mantienen tal cual (el plan dice «portados con su nombre»), con cuerpos que prueban lo que es cierto en 2D; cuatro cambian de sentido, y M24, que borra las del 3D, puede renombrarlos: `at $window it opens to the left of tu-laptop: inside the map, clear of every label and every possible stamp` (en 2D abre a la derecha: la oficina es una columna a la izquierda del dibujo; y la tarjeta sí tapa los sellos de los enlaces bajo ella), `at $window the right side, where a card opens today, would cover the laptop-lucia and the impresora` (en 2D es el lado izquierdo el que taparía la etiqueta propia y la de laptop-lucia), `at 1280×800 the terminal of Casa de Lucía, 495 px tall because its title takes two lines, is 6 px too tall for the free strip: it covers the bottom of the lost stamps and no label` (en 2D la tarjeta de 495 px sobrepasa el hueco que deja `dockRoom` y, sin recortar, tapa etiquetas; recortada no tapa nada) y `at 1920×1080 the terminal of Casa de Lucía does not open to its left, where it would cover the label of the house: it docks` (en 2D la izquierda tapa otras etiquetas, no la de la casa).
    - **La altura de la capa para el acople.** Para que el dock encuentre sus 200 px hace falta que la capa deje 222 px bajo la pieza más baja (200 + 6 + 16); en una serpiente más alta que su caja (979 px a 900) la tarjeta cae sobre los carriles y los servidores. La prueba `at $window a terminal docked in the map where 01-10 draws the road...` supone esos 222 px (`ROOM_UNDER_THE_DRAWING`). Es de M9 y M15.
    - `ui/incident/CLAUDE.md` y `src/scene/CLAUDE.md` siguen diciendo que `cardPlacement` vive en `layout.ts` (3D): es verdad hasta M15. El texto real de los nombres de grupo es de M11. No se barrió la consulta DNS dibujada (la 28 quater no aterrizó): sus sellos en la puerta del resolver no existen todavía.
- **Cierre de la Tarea M9 (2026-10-19).** Medido en `feat/chapter-2` sobre `080e221` con los cambios de M9 (la tarea es el commit que sigue a ese). Lo que sigue completa las viñetas de arriba y, donde difiere, manda.
  - **Qué entró.** `src/scene/renderer.ts` (`MAP_RENDERER`, `3d` salvo que `VITE_MAP_RENDERER` diga `2d`; es el archivo 12 de 12 de `src/scene/`), y el barril `src/scene/index.ts`, que elige entre el `GameScene` 3D de siempre y `GameScene2D`. En `src/scene/map2d/`: `map-stage.tsx` (`MapStage`: mide su hoja con `useElementSize`, no dibuja nada hasta que el ancho es finito y mayor que 0, llama a `layoutMap` con ese ancho y dibuja un `svg` `aria-hidden` con el `viewBox` del layout, a un píxel por unidad, y la `.html-layer` encima), `frame.ts` (`frameOf`: el dibujo centrado a píxel entero y a `TITLE_BAR` del borde de arriba), `game-scene.tsx` (`GameScene2D`), `entities/group-boxes.tsx` y `entities/links.tsx` (las cajas punteadas de los grupos, los enlaces de todos los tipos con el cabo de `line-end`, y un punto en cada marca), `overlay/group-captions.tsx` (el nombre de cada grupo en la caja de `captionBoxes`), y las guías de `entities/` y `overlay/`. `src/styles.css` suma `.map-stage`, `.map-group`, `.map-link`, `.map-mark` y `.incident--map2d` (a 900 px y menos, la fila del mapa en `auto` y la columna en `minmax(0, 1fr)`; esto último es de la ronda de arreglos 1); `incident-screen.tsx` pone la clase `incident--map2d` cuando el mapa es 2D y pasa `known={session.known}`. Las guías de `src/scene/`, `map2d/`, `src/ui/incident/` y `tests/e2e/` y el `README.md` del proyecto lo cuentan. No cambian los archivos 3D (`git diff --stat efe355b -- <los archivos 3D>` lista solo `src/scene/traffic/flow-look.ts`, de M7), `src/engine`, `src/levels` (0 archivos), `golden-traces.json` ni `package.json` y `pnpm-lock.yaml`. M9 no tiene casillas `- [ ]`.
  - **Las pruebas.** Las del plan, con su título exacto, en `src/scene/map2d/map-stage.browser.test.tsx` (navegador, 8 pruebas en el commit de M9 y 3 más en la ronda de arreglos 1, ver más abajo: las 4 de las simples, la (c) `at 390 px the map is as wide as its container and the page does not scroll sideways`, que el plan marca como prueba del navegador y que el «Review Focus» 6 llama «M9, navegador», y 3 más: los enlaces y las marcas dibujados tal como el layout los da, que por debajo de 360 px el dibujo guarda 360 px y la caja se desplaza de lado, y que no hay `svg` antes de medir el contenedor), `src/scene/map2d/frame.test.ts` (3, de `frameOf`), una prueba nueva en `src/ui/incident/incident-screen.test.tsx` (`gives the map the terms the player knows at this incident`; el mock de la escena gana un atributo `data-known`, ninguna prueba existente cambia) y `tests/e2e/phone-map.spec.ts` (la misma (c) con el mismo título, como pidió el encargo de la tarea: a 390×844, en 01-01, 01-08, 02-04 y 04-01, el dibujo, sea el lienzo del 3D o el `svg` del 2D, y la `.html-layer` miden lo que `.incident__map`, que mide los 390 px de la ventana, y la página no se desplaza de lado; vale con los dos renderers y se corre con los dos).
  - **Rojo primero.** Antes del código, `frame.test.ts` y el archivo del navegador no cargaban (`Failed to resolve import "./frame"` y `"./map-stage"`), y en esa corrida la prueba de la rueda de M1 se agotó a los 15 s (el otro archivo no cargaba); con el código, las 11 del navegador pasan y se repitieron 6 veces seguidas sin fallar (la octava de M9 se añadió después y pasa). Con el código terminado, 13 mutaciones (cada una restaurada) sobre las pruebas del navegador: sin centrar el dibujo, sin la barra del título, el `svg` sin `aria-hidden`, el `viewBox` un píxel más ancho, el layout a un ancho fijo en vez del del contenedor, sin la guarda del ancho 0 (cae 6 de 7), los nombres sin mirar `known`, los nombres sin el corrimiento del marco, sin el cabo de `line-end`, sin las rayas, sin `display: flow-root` en la hoja, la fila del teléfono sin `auto`: las doce caen donde deben; la trece, quitar `position: relative` de la hoja, es equivalente (la capa se ancla en `.map-stage`, que ocupa la misma caja). Sin `known={session.known}` en la pantalla cae la prueba nueva de `incident-screen.test.tsx`. La e2e, que pasa con los dos renderers, no podía estar en rojo por «el 2D no existe»: su rojo fue una carrera en el 3D (el lienzo mide 300 px un instante antes de que r3f lo ajuste), que se arregló esperando con `expect.poll`; para el 2D, un `svg` 20 px más ancho que su hoja la hace fallar (`Expected: 390, Received: 410`).
  - **Totales con M9.** Vitest 3340 pruebas en 119 archivos (3336 en 118 antes: 4 pruebas y un archivo más); `pnpm check:fast` en verde (typecheck de los dos programas, lint, structure, jscpd con 0 clones); `pnpm test:browser` 12 pruebas en 2 archivos (4 en 1 antes; 15 tras la ronda de arreglos 1); `pnpm structure` en verde con `src/scene/` en 12 de 12; `phone-map.spec.ts` sola pasa con la compilación 3D (4,8 s) y con `VITE_MAP_RENDERER=2d` (4,3 s). No se corrió la e2e entera ni `pnpm check` completo (regla del estudiante del 2026-10-17: solo en M1, M8, M16, M17, M18, M23, M24, M25).
  - **Ronda de arreglos 1** (la revisión de M9 halló un Important): en el teléfono la columna `1fr` de `.incident` (que es `minmax(auto, 1fr)`) crecía hasta el ancho del `svg`, porque el mínimo automático de la caja del mapa es su ancho de contenido, así que el mapa no volvía a achicarse al estrechar la ventana (844 → 390 se quedaba en 844; 1280 → 800, en 900) y por debajo de 360 px se desplazaba la página y no la caja del mapa. Arreglo, solo en el camino 2D: `.incident--map2d { grid-template-columns: minmax(0, 1fr) }` en el bloque de 900 px (el 3D no cambia). Tres pruebas nuevas en `map-stage.browser.test.tsx`, que antes del arreglo fallaban con las cifras de la revisión (844 contra 390, 360 contra 320, 900 contra 800) y después pasan en 3 de 3 corridas: `on a phone the map follows its column when the window narrows, and the page does not scroll sideways`, `on a phone narrower than 360 px the stage scrolls sideways and the page does not` y `on a desktop the map follows its box when the window narrows past 900 px`. El montaje de la pantalla (`main.incident.incident--map2d` con el mapa y el panel) es un ayudante compartido con la prueba (c), que sigue pasando. Los hallazgos Minor 2 a 6 de la revisión quedan sin tocar.
  - **La comprobación a mano, `VITE_MAP_RENDERER=2d`.** Servidor de Vite en el puerto 5391 (ya detenido, solo ese PID), con los 28 incidentes de los dos primeros capítulos con tres estrellas guardadas, capturas en el espacio de trabajo de la ejecución (`m9-<incidente>-<ancho>.png`). Se vio: 01-08 a 390 px, una serpiente de 390 × 979 px bajo la barra del título (la caja del mapa mide 56 + 979) y la página sin desplazamiento lateral; la misma a 1280×800, de 900 × 979 px en una caja de 800, que se desplaza hacia abajo con la barra del título quieta; 02-03 a 1280 con «PISO 1» sin bloque (aún no se conoce `cidr`) y 02-04 con «PISO 1 192.168.1.0/24», «PISO 2 192.168.2.0/24» y la caja de la oficina que solo dice «192.168.0.0/16»; 02-07 con la sucursal como segundo grupo; 04-01 con las dos subredes y el bloque del VPC. Sin errores de consola ni lienzos de 3D. Todavía no hay piezas, etiquetas, sellos ni tarjetas: el 2D no se puede jugar hasta M15 y por eso la bandera sigue en `3d`.
  - **Decididas sin el estudiante (para revisar), más allá del texto de M9.** Las cuatro primeras (el aspecto, los nombres, `known` y el desplazamiento) cambian lo que el jugador verá en el mapa 2D cuando sea el mapa; ninguna cambia lo que aprende:
    - **El aspecto.** Las cajas de los grupos son punteadas (6 px de raya y 4 de hueco), de tinta suave y 1,5 px, con esquinas de 14 px; el contorno de un bloque es igual pero de tinta plena, para distinguirlo de un piso; los enlaces, de todos los tipos y con el cabo de `line-end`, son una línea de tinta suave de 4 px (`--stroke-double`), y cada marca un punto de tinta suave de 3 px de radio. Todo sale de las fichas de color y de línea; el spec dice «línea gruesa de tinta suave» y «un punto de tinta suave» sin cifras. Los 6 y 4 px y los 3 px de radio son míos.
    - **Los nombres de grupo, hasta M11.** Cada nombre son las partes de `Group.name` cuyo término conoce el jugador (`shownParts`) unidas por un espacio, como texto plano `.caption` en la caja de `captionBoxes`; un grupo sin partes que mostrar no lleva nombre. Faltan «Oficina» y «VPC» (son de M11): hoy la caja de la oficina no dice nada hasta que se conoce `cidr` y entonces solo dice su bloque, y la del VPC dice su bloque. El nombre del contorno de un bloque (`blockName`) no tiene caja ni dueño todavía: lo da M11.
    - **`GameScene2D` recibe `known`** (los términos que el jugador conoce), una prop más que la del 3D, que la ignora: `GameSceneProps` no trae términos y el nombre de un grupo solo debe decir lo que el jugador ya conoce. `incident-screen.tsx` la pasa desde la sesión; sin ella no se conoce ningún término (la opción rigurosa). No se tocó `game-scene.tsx` (3D): el tipo es `GameScene2DProps extends GameSceneProps`.
    - **El mapa se desplaza hacia abajo, dentro de su caja.** Con más de 900 px de ventana, `.incident--map2d .map-stage` llena `.incident__map` y se desplaza hacia abajo cuando el dibujo es más alto (la serpiente de 01-08 mide 979 px y la caja 800 a 1280×800); la barra del título no se mueve y nunca hay desplazamiento lateral, salvo por debajo de 360 px, donde el dibujo guarda 360 px. La ayuda de la caja de inspección sigue flotando abajo a la derecha del mapa, encima del dibujo, como antes: en 02-07 a 1280×800 queda sobre un tramo de enlace (todavía no hay piezas ni etiquetas que pueda tapar; M11 a M15 lo vigilan).
    - **En el teléfono, sin lugar para el acople todavía.** A 900 px y menos la caja del mapa mide su dibujo (56 + el alto del layout) y la página se desplaza; no se añaden los 222 px bajo el dibujo que pide un acople (ver Abiertas).
    - **La prueba (c) existe dos veces**, en el navegador (la capa que el plan le da) y en la e2e (la que pidió el encargo), con el mismo título; la e2e dice solo lo que vale en los dos renderers, así que corre en la suite normal sobre el 3D y con la bandera sobre el 2D.
    - **Dos carpetas con archivos de otras tareas.** `entities/` (que el plan solo abre con su guía) lleva `group-boxes.tsx` y `links.tsx`, y `overlay/` (que M11 crea) nace aquí con su guía y `group-captions.tsx`, porque el nombre de cada grupo lo dibuja M9. M10 y M11 los reutilizan o los mueven.
    - **`frame.ts` y su prueba** (el corrimiento del dibujo en su caja, a píxel entero) y el párrafo del `README.md` del proyecto sobre la bandera no estaban en el texto de M9.
  - **Abiertas.**
    - **M15:** el escenario termina en el dibujo: para el acople hacen falta 222 px bajo la pieza más baja (`ROOM_UNDER_THE_DRAWING`) y el escenario no los deja; hay que sumarlos bajo la hoja mientras una tarjeta esté abierta (o siempre) y que la capa los siga cubriendo, y sumar `frameOf` a las posiciones de las tarjetas. Lo dice `src/scene/map2d/CLAUDE.md`.
    - **M11:** el texto real de los nombres («Oficina», «VPC», cómo se unen), el nombre del contorno del bloque y, sobre todo, una prueba de `known` por la pantalla de verdad: la de `incident-screen.test.tsx` solo comprueba que el valor llega a la escena (con la escena de mentira), y las de `map-stage.browser.test.tsx` le dan el conjunto a mano.
    - **M17 y M23:** `phone-map.spec.ts` ya corre con la bandera (`VITE_MAP_RENDERER=2d pnpm e2e tests/e2e/phone-map.spec.ts`); M23 lo funde en `phone.spec.ts`. `src/scene/renderer.ts` no tiene prueba propia, porque `src/scene/` está en 12 de 12 y una `renderer.test.ts` sería el archivo 13: lo guarda la e2e y las pruebas de `incident-screen` (el valor por defecto `3d` es lo que hace que sigan pasando con el mock del 3D).
    - **Cuando el 2D tenga piezas**, la ayuda del mapa (`.incident__inspection`, abajo a la derecha y encima del dibujo) puede tapar una etiqueta o un sello: M11 a M15 lo miden en el navegador.

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
