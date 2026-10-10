# Sigue el paquete · Design system: un estándar por elemento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el juego tenga un solo estándar por elemento de la interfaz: un botón, una ficha, una tarjeta, una etiqueta de nombre y una leyenda, cada uno con sus variantes. Todo se apoya en tokens que viven en un solo lugar, y el mapa 3D los lee de la misma fuente. Lo pidió el estudiante: «que no creemos 5 versiones de un button, sino que mantengamos un estándar».

**Architecture:**
1. **Primero, la red de seguridad.** Una sección nueva de `#/entidades`, «Elementos de la interfaz», dibuja cada elemento en cada variante y estado, tal como lo dibujan hoy las pantallas, también los que trajo el plan 3. Su captura de Playwright y la de «Piezas del mapa» no toleran ni un píxel distinto (cierra G1). Desde ahí, cada tarea muestra qué píxeles mueve.
2. **Una capa nueva, `src/design/`,** guarda el design system. La importan `ui` y `scene`; ella no importa ninguna capa.
3. **Los tokens viven en `src/design/tokens.css`:** una paleta (qué color es) y roles (para qué sirve). El bermellón pasa a tres roles con el mismo valor: peligro, énfasis y foco. `src/scene/theme.ts` lee ese mismo archivo: el mapa y la interfaz tienen una sola fuente.
4. **Escalas:** letra de 8 pasos, espacios de 4 px, líneas, radios, sombras y un solo anillo de foco. Los pesos de letra son los que carga `index.html`, que deja de pedir Plex Mono 500; Newsreader 600 sigue sin cargarse.
5. **Un componente por familia, con variantes:** `Button` (botón o enlace), `Choice` y `ChipTray` (fichas, opciones y bandejas), `Card`, `NameTag` (lo usan `ui` y `scene`) y la clase `caption`. Cada uso actual migra, también los del plan 3: la tarjeta de tarea y la terminal (`ChipCard`), sus bandejas, «Listo», «Enviar» y su estado deshabilitado, y la ficha elegida con un nombre. Ningún primitivo acepta `className`.
6. **`DESIGN.md`,** en la raíz del proyecto, explica los tokens, los primitivos, cuándo usar cada uno, la regla del bermellón y cómo sumar una variante en vez de un elemento nuevo.

**Tech Stack:** Vite 8.3.3 (con la importación `?raw`), TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, Vitest 5.0.3, Testing Library + user-event, Playwright 1.64 (`toHaveScreenshot`). Sin dependencias nuevas: `pnpm-lock.yaml` no cambia.

**Origen:**
- La fila «Design system del juego» de la hoja de ruta (`docs/plans/follow-the-packet-roadmap.md`).
- El backlog (`docs/plans/2026-10-08-follow-the-packet-followups.md`): el bloque D (reglas `design-tokens` y `primitive-semantic-tokens` sin decidir) y la fila G1 (la captura tolera un 1 %).
- Lo que trajo el plan 3 (`docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`, ejecutado hasta `c17d9cd`): las dos tarjetas que se abren junto a una pieza del mapa (la de tarea de un firewall y la terminal de un origen), hechas con `ChipCard` y `ChipTray` de `src/ui/incident/map-cards/chip-card.tsx`; el botón «Enviar» con su estado deshabilitado (`.btn:disabled`); la grilla `.chip-card` (antes `.task-card`); la línea de la terminal (`code` dentro de `.slot`); el arreglo de `c17d9cd` para leer un nombre dentro de una ficha elegida; la ayuda de inspección con la leyenda de sellos y candado; y las variables CSS con que `card-anchor.tsx` y `use-card-side.ts` colocan una tarjeta en el mapa. Este plan no construye nada del plan 3: lo migra como lo demás (ver «Rebase sobre el plan 3»).
- Plan anterior, ya implementado: `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md` (plan 2). Donde el código y los planes viejos difieren, manda el código.

> **Decisiones del estudiante (2026-10-09), aplicadas en el rebase sobre el plan 3:**
> - **Bermellón:** se queda como hoy (opción A). El bermellón sigue en «Enviar solución», «NUEVO», el número del capítulo y las estrellas; los tres roles (peligro, énfasis, foco) mantienen el mismo valor (decisión 4).
> - **Escalas de letra y espacio:** aceptadas tal como están en la Tarea 3 (decisión 5).
> - **Newsreader 600:** no se carga (opción B, captura `15` del primer ensayo). La Tarea 3 ya no lo pide en `index.html`, `DESIGN.md` lo dice, la tabla «Cambios visibles» no tiene su fila, y los títulos se ven como hoy: el de la tarjeta del Security Group cabe en una línea (decisión 6).
>
> **Decisiones tomadas sin el estudiante (2026-10-09, noche):** las decisiones 20 a 24, marcadas «Decidido sin el estudiante». Ninguna mueve un píxel salvo la 24, que solo anota uno. Para revisar antes de ejecutar.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` (raíz del repo). Todos los comandos se corren desde `projects/follow-the-packet/`.
- **Rama.** `feat/live-incidents`. No se crea otra.
- **Punto de partida verificado (2026-10-09, commit `c17d9cd`, con el plan 3):** `pnpm check` pasa entero, con **712 tests de Vitest en 48 archivos**, 21 tests de Playwright y `Found 0 clones`. Al cerrar cada tarea: Tarea 1, 713 en 48 (Playwright, 22); Tarea 2, 719 en 49; Tarea 3, 719 en 49; Tarea 4, 721 en 50; Tarea 5, 723 en 51; Tareas 6 y 7, 723 en 51. Desde la Tarea 1, Playwright tiene 22 tests.
- **Plan ensayado (Tareas 1 a 7), rebasado sobre el plan 3.** Las tareas se implementaron en orden sobre una copia limpia del proyecto en `c17d9cd`, con un commit por tarea. Los bloques de código de este documento salen de esos commits. Después se volvieron a aplicar, tal cual, sobre otra copia limpia en `c17d9cd`: al cerrar cada tarea pasaron `tsc`, ESLint, la estructura, jscpd, Vitest y Playwright con los números de arriba, `golden-traces.json` no cambió, y cada commit quedó con el mismo árbol que el del ensayo, capturas incluidas. El primer ensayo, sobre `58c548e` y sin el plan 3, queda superado.
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: capas, barrels, alias `@/` y nada de `../`. Este plan suma una capa, `design`, con su fila en la tabla de capas (Tarea 2). Tope de 12 archivos por carpeta (sin contar `CLAUDE.md`): `src/design/` termina con 11; `src/ui/` sigue en 11, `src/ui/incident/` en 9, `src/ui/incident/map-cards/` en 5, `src/scene/` en 11, `src/scene/entities/` en 11 y `src/ui/catalog/` sube a 3.
  - `view-renders-domain-result`: nada cambia en lo que la vista calcula.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. El texto visible nuevo vive en `src/copy/ui.ts` (`INTERFACE_TEXT`).
  - `no-raw-effects`, `user-event-for-interactions` y `caller-controls-visibility`: los primitivos no tienen efectos, los tests de interacción usan `userEvent.setup()`, y ningún primitivo decide si se dibuja.
  - `dry`: jscpd con umbral 0 (`pnpm dup`).
  - `exact-dependency-versions` y `prefer-established-libraries`: no se agrega ninguna dependencia.
- **El capítulo 4 no cambia lo que calcula ni lo que dice.** `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibido `vitest -u`, `--update` y editarlo a mano. Cada tarea lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Ningún texto de un capítulo cambia (ni del 1 ni del 4).
- **Cambios visibles.** Cada píxel que se mueve está en la tabla «Cambios visibles», con su motivo. Solo las Tareas 2, 3 y 6 regraban capturas.
- **Scripts de edición.** Los cambios en archivos que ya existen llegan como scripts de Python 3 que se pegan tal cual en la terminal (`python3 - <<'EOF' … EOF`). Cada reemplazo exige encontrar exactamente una vez el texto viejo y, si no, el script se detiene con `expected 1 match`. Si eso pasa, el árbol no es el que el plan supone: se para y se avisa, sin arreglar a mano. Un archivo nuevo, o uno que cambia casi entero, llega como «Contenido completo de `ruta`»: se escribe tal cual.
- **"Listo"** = `pnpm check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea termina con `pnpm check` en verde.
- **Commits.** Un commit por tarea, con `git add` de las rutas que la tarea lista. Nunca se agrega nada de `labs/03-ping-connectivity/`.
- **Capturas.** Hay dos: `tests/e2e/snapshots/entities-darwin.png` (las piezas del mapa) e `interface-darwin.png` (nueva, los elementos de la interfaz). Se regraban solo a propósito, con `pnpm exec playwright test entities --update-snapshots=all`, y antes se mira la diferencia: Playwright la deja en `test-results/<test>/<captura>-diff.png`.
- **Servidores.** No se arranca `pnpm dev` ni nada en los puertos 5173 y 5180: ahí corre el servidor del estudiante. Playwright levanta su propio servidor en el 4183.
- Ningún comando `aws`.

## Decisiones (para revisar antes de ejecutar)

1. **Dónde vive el design system: una capa nueva, `src/design/`.** `NameTag` lo usan `ui` (el texto) y `scene` (las etiquetas del mapa), y `scene` no puede importar `ui`. La capa nueva está al lado de la línea de capas: solo `ui` y `scene` la importan, y ella no importa ninguna. La Tarea 2 la suma a la tabla de `eslint.config.js` (con sus casos en `scripts/eslint-config.test.ts`), a la regla `folder-structure` (lugar 6 de la lista de ubicación) y a las guías.
2. **Una sola fuente para los colores del mapa.** `src/scene/theme.ts` lee `src/design/tokens.css` con la importación `?raw` de Vite y sigue las referencias `var()` hasta el valor (`token`, `tokenPx`). Para que Vitest no entregue ese CSS vacío, `vite.config.ts` suma una línea: `css: { include: [/\/design\/tokens\.css/] }`. Fue simple, así que `theme.ts` ya no repite ningún color. Las líneas del mapa (`lineWidth`) también salen de la escala de líneas (`LINE`), también el techo de la casa que trajo el plan 3 (`actor.tsx`).
3. **Paleta y roles (`primitive-semantic-tokens`): sí, para el color.** La paleta (`--palette-*`) dice qué color es; los roles (`--color-*`), para qué sirve. Los estilos y el mapa usan roles. Las escalas (letra, espacio, línea, radio, sombra) tienen una sola capa. Ni esta regla ni `design-tokens` entran a `.claude/rules/` (ver la decisión 17): su idea queda escrita en `DESIGN.md`.
4. **El bermellón, en tres roles con el mismo valor.** `--color-danger` (bloqueado, intruso, alerta, solución rechazada, respuesta incorrecta), `--color-emphasis` (botón principal, número de capítulo, estrellas, marca «nuevo», sombra del tooltip) y `--color-focus` (anillo de foco). Hoy los tres valen `#e4572e`: no cambia nada. La alternativa era sacar el bermellón de los cinco usos que no son peligro, como pide «bermellón solo para el peligro» (`src/scene/entities/CLAUDE.md`), con una línea en `tokens.css`: `--color-emphasis: var(--palette-ink);`. **Decidido (2026-10-09):** opción A, el bermellón se queda como hoy; los tres roles mantienen el mismo valor y `--color-emphasis` no cambia.
5. **Escala de letra de 8 pasos y espacios de 4 px.** Había 12 tamaños de letra en rem, 4 en px y ninguna escala de espacios. Cada valor pasa al paso más cercano: casi todo se mueve entre 0.4 y 1.6 px; dos cosas, 3.2 px (la tabla «Cambios visibles» lista cada una). Los tamaños del mapa (13, 12 y 11 px, y el sello de 18 px) caen justo en la escala y no se mueven: las pruebas de etiquetas encimadas siguen igual. **Decidido (2026-10-09):** escalas aceptadas tal como están en la Tarea 3.
6. **Pesos de letra: solo los que se cargan.** El CSS pedía Plex Sans 500 y 700 y Newsreader 600 y 700, que `index.html` no cargaba; el navegador dibujaba 400, 600 y una negrita sintética. Quedan tres pesos: 400, 600 y 500 (títulos). `index.html` deja de pedir Plex Mono 500, que nadie usa. **Decidido (2026-10-09):** opción B, Newsreader 600 no se carga. Los sellos y los términos en negrita dentro de un título piden 600 y el navegador los dibuja con la negrita sintética desde 500, como hoy, y el título «Security Group servidor2» de la tarjeta de tarea cabe en una línea. En las capturas cambian las etiquetas del mapa, el «!» y `strong`, porque Playwright bloquea Google Fonts y usa las fuentes del sistema, que sí tienen 500 y 700.
7. **Un solo color de texto sobre fondo de color.** El botón principal tenía texto `#fff`; las fichas elegidas, el tooltip y la marca de alerta, papel claro (`#fbf8f2`). Queda uno: `--color-on-fill`, papel claro.
8. **Un solo anillo de foco.** La misma regla, `outline: 2px solid` bermellón a 2 px, estaba copiada 8 veces (la del plan 3 para el título de `.chip-card` incluida), y las opciones de la explicación no la tenían: mostraban el anillo azul del navegador. Queda una regla, `:focus-visible`, para todo.
9. **`Button`, con cuatro variantes.** `primary` (la acción principal de una pantalla), `secondary` (por defecto), `small` y `text` (navegación que se lee como enlace). Con `href` es un `<a>`; sin `href`, un `<button type="button">`. Los enlaces sueltos (los incidentes del roadmap, «← Roadmap» y «Volver al roadmap» del aviso) pasan a la variante `text`, con el mismo aspecto. «Listo» y «Enviar», los botones de las tarjetas del mapa, son `secondary` (decisión 20), y el estado deshabilitado de «Enviar» es el atributo `disabled` (decisión 21).
10. **`Choice`: un solo componente para fichas y opciones.** `.chip` y `.option` hacían lo mismo (un interruptor con `aria-pressed`) con dos formas. Quedan como dos variantes de un componente. Sin `pressed` es una acción con forma de ficha: la ficha del hueco que vuelve a su bandeja. `ChipTray` (una bandeja con nombre donde se elige una ficha) sale de `src/ui/incident/map-cards/chip-card.tsx`, donde el plan 3 la dejó para compartirla entre la tarjeta de tarea y la terminal, a `src/design/choice.tsx`: toda bandeja de fichas del juego es esa (jscpd exige cero copias). Las tarjetas convierten sus textos en fichas con `trayChips` (decisión 22). El arreglo de `c17d9cd` (la etiqueta de nombre dentro de una ficha elegida pierde el sombreado y toma el color de la ficha) es parte de la ficha y pasa con ella a `primitives.css`.
11. **`Card`, con la variante `soon`.** `.chapter` era idéntica a `.card`. `Card` es un `section` o, con `as="li"`, un ítem de lista; `soon` es el capítulo que aún no se abre. El diseño de adentro es del contenido: la grilla de las tarjetas del mapa (`.chip-card`, antes `.task-card`) pasa a un `div` interior de `ChipCard`, que comparten la tarjeta de tarea y la terminal. `.slot` (también la línea de la terminal), `.term-tip`, `.lucia__reply p` y `.catalog__canvas` siguen siendo distintos a propósito; usan los tokens.
12. **`NameTag` y las etiquetas del mapa.** `NameTag` reemplaza el `<span className="name-tag">` copiado en `tagged-text.tsx` y `piece-label.tsx`. La etiqueta del mapa sigue siendo `PieceLabel` (`src/scene/overlay/`): no es un `Button`, porque tiene su propio tamaño, su candado, su alerta y su forma de solo nombre. Su estilo (`map-button`) pasa a `primitives.css`, y la etiqueta que es solo un nombre usa el marco de `NameTag` en una sola regla (`.name-tag, .map-button--name`), en vez de redibujarlo. Los sellos siguen siendo una entidad del catálogo (`src/scene/entities/stamp.tsx`).
13. **Una leyenda: la clase `caption`.** `h3`, el «Glosario», el nombre de una bandeja (también «Origen», «Destino» y «Mensaje» de la terminal), las leyendas de la caja de inspección y el rol del roadmap eran casi iguales. Queda `caption` (todo `h3` lo es) y `caption caption--soft` para las leyendas de un campo, una bandeja o un rol. El rol pasa de peso 400 a 600, y las leyendas de bandeja y de campo, de interlineado normal a 1.2.
14. **`.feedback--right` no tenía estilo.** Se quita la clase: la respuesta correcta conserva el color del texto, y solo la incorrecta va en bermellón (es un error). La diferencia no depende del color: «Correcto.» y «No es eso.» lo dicen.
15. **El catálogo de la interfaz es una sección de `#/entidades`, no otra página.** Lo pidió la fila de la hoja de ruta: una sola página de revisión de diseño. La sección tiene su propia región («Elementos de la interfaz») y su propia captura. Las etiquetas del mapa y los sellos no se repiten ahí: ya están, en todos sus estados, en la captura de «Piezas del mapa».
16. **Tolerancia cero en las dos capturas (G1).** `maxDiffPixels: 0` y `threshold: 0`: ni un píxel distinto ni una diferencia de color dentro de un píxel. Con el umbral de color por defecto (0.2), el cambio de `#fff` a papel claro del botón principal pasaba sin aviso. El lienzo WebGL (SwiftShader) dio la misma imagen en todas las corridas de los dos ensayos.
17. **Guardas que quedan fuera, por decisión del estudiante (2026-10-09).** Solo queda el catálogo con su captura. Si se quiere volver a ellas:
    - un test de Vitest sobre el CSS habría atrapado un color o un tamaño escrito a mano fuera de `tokens.css` (el desfase entre `theme.ts` y el CSS ya no puede pasar: `theme.ts` lee el CSS);
    - una regla de ESLint contra `<button>` y `<a className>` sueltos fuera de `src/design/` habría atrapado un sexto botón al escribirlo;
    - un archivo de regla en `.claude/rules/` habría dicho el estándar a cada agente en cada sesión.
    Lo que sí lo cuida: las dos capturas, TypeScript (un primitivo no acepta `className`), las guías de cada carpeta y `DESIGN.md`.
18. **Medidas de una sola regla.** Lo que pertenece a un solo elemento queda en su regla: el panel lateral (380 px), la caja de inspección (22 rem), el sello (32 px), la marca de alerta (15 px), el relleno de una etiqueta del mapa (1 px 6 px) y de una etiqueta de nombre (0.35 em). El interlineado también queda con cada elemento. La tarjeta del mapa ya no es una de ellas: desde el plan 3, su ancho (`CARD_WIDTH`, 300 px) y su distancia a la pieza (110 px junto a un firewall, 68 px junto a un origen) los decide `src/scene/layout.ts`, que los necesita para elegir el lado, y llegan a `.map-card` como variables CSS (`--card-width`, `--card-gap` y, si se acopla en la esquina, `--card-x` y `--card-y`, que escribe `use-card-side.ts`). No son tokens, y ni `card-anchor.tsx` ni `use-card-side.ts` cambian; la guía de `src/design/` y `DESIGN.md` lo dicen.
19. **`.mono` se va; `code` se queda.** Ningún componente usaba `.mono`. `code` sí: la línea de la terminal del plan 3 (`ping 192.168.1.20`). Su regla pasa a tokens con el mismo tamaño (`--font-mono`, `--text-md`, 14 px).
20. **«Enviar» es un `Button` `secondary`.** **Decidido sin el estudiante (2026-10-09, noche):** el plan dejaba al estudiante elegir entre `secondary` y `primary`. Queda `secondary`, como «Listo» a su lado y como hoy: la acción principal de la pantalla ya es «Enviar solución», y un `primary` en la terminal sumaría un segundo botón bermellón, contra la opción A de la decisión 4 («el bermellón se queda como hoy»). No mueve ningún píxel. Si se quiere `primary`, es cambiar `<Button disabled={!line} …>` por `<Button variant="primary" disabled={!line} …>` en `terminal-card.tsx` y regrabar la captura.
21. **Deshabilitado es un estado, no una variante.** **Decidido sin el estudiante (2026-10-09, noche):** `Button` no suma una variante `disabled`: el atributo nativo `disabled` ya dice el estado al lector de pantalla y al teclado, y una variante permitiría el aspecto gris en un botón que sí responde. La regla `.btn:disabled` del plan 3 pasa tal cual, con tokens (`--color-shade`, `--color-ink-soft`), a `primitives.css`; el catálogo la muestra en el espécimen «deshabilitado». No mueve ningún píxel.
22. **`trayChips` vive en `chip-card.tsx`.** **Decidido sin el estudiante (2026-10-09, noche):** `ChipTray` de `@/design` recibe la etiqueta de cada ficha ya dibujada (`ReactNode`), porque el design system no importa ninguna capa y no conoce los términos de `@/copy`. Las dos tarjetas del mapa traen sus fichas como texto con términos (`TermText`); el paso de una a otra (`<TaggedText text={label} />`) es una función, `trayChips`, en el archivo que ya comparten las dos (`chip-card.tsx`), en vez de repetirla en cada tarjeta (jscpd) o de volver a envolver `ChipTray` con otro componente del mismo nombre.
23. **Los especímenes del plan 3 se dibujan con sus clases, no con sus componentes.** **Decidido sin el estudiante (2026-10-09, noche):** el catálogo suma «deshabilitado» (botones), «ficha elegida con nombre» (fichas), «tarjeta terminal» (con su línea, una bandeja, «Enviar» y «Listo») y «texto secundario» (la leyenda de los sellos y el candado), y queda con 30 especímenes. `TerminalCard` y `ChipCard` no sirven ahí: son diálogos que se llevan el foco al abrirse. Como los demás especímenes, se dibujan con las clases de hoy y pasan a los primitivos en la tarea que migra su familia. Los textos de muestra viven en `INTERFACE_TEXT.sample`.
24. **La terminal acoplada del 01-03 crece 8 px y tapa un poco más del sello perdido.** **Decidido sin el estudiante (2026-10-09, noche):** con las escalas de la Tarea 3 (botones de 16 px, fichas de 14 px, sus rellenos), la terminal de Casa de Lucía pasa de 495 a 503 px de alto. El plan 3 ya dejó anotado que, acoplada en la esquina, tapa la parte de abajo del sello perdido a 1280×800 y 1366×768: el solape pasa de 36×7 a 36×15 px y de 36×23 a 36×31 px; el «?» se sigue viendo y a 1440×900 no tapa nada (capturas `13` y `14`). Las pruebas del capítulo 1 pasan. No se arregla aquí: es el pendiente abierto del plan 3, y arreglarlo pide tocar `src/scene/layout.ts`, que este plan no toca, o achicar la escala que el estudiante aceptó. La Tarea 7 lo anota en el estado del backlog.

## Rebase sobre el plan 3

El plan 3 (capítulo 1) se ejecutó antes que este, sobre `feat/live-incidents`, hasta `c17d9cd`. Este plan se ensayó primero sobre `58c548e`, sin el plan 3, y después se rebasó sobre `c17d9cd` y se volvió a ensayar: los bloques, los números de tests y las capturas de este documento son los del segundo ensayo. Lo que sumó cada tarea:

- **Tarea 1:** cuatro especímenes nuevos, grabados antes de migrar nada (decisión 23): el botón deshabilitado, la ficha elegida con un nombre, la tarjeta terminal y el texto secundario. El test de la página cuenta cuatro elecciones apretadas (tres fichas y una opción) y los dos «Enviar», uno deshabilitado.
- **Tarea 2:** los estilos del plan 3 pasan a tokens como el resto: `.btn:disabled`, `.chip-card`, la ficha elegida con un nombre y las reglas de `.map-card` con sus variables. Su anillo de foco (`.chip-card h2:focus-visible`) se va con los otros siete. El techo de la casa (`actor.tsx`) usa `LINE.thin`.
- **Tarea 3:** `code` se queda (decisión 19); el resto del plan 3 entra a las escalas sin reglas propias.
- **Tarea 4:** «×» (en `map-cards/task-card.tsx`), «Listo» (en `ChipCard`) y «Enviar» (en `terminal-card.tsx`) son `Button`; `.btn:disabled` pasa a `primitives.css` (decisiones 20 y 21).
- **Tarea 5:** `ChipTray` de `map-cards/chip-card.tsx` se va; las dos tarjetas usan la de `@/design` con `trayChips` (decisión 22), y la ficha del hueco es un `Choice`. El arreglo de la ficha elegida con un nombre pasa a `primitives.css`.
- **Tarea 6:** `ChipCard` es un `Card` con la grilla `chip-card` en un `div` interior: así quedan la tarjeta de tarea y la terminal. Los nombres de bandeja de la terminal son leyendas.
- **Tarea 7:** `DESIGN.md` nombra lo del plan 3; la hoja de ruta pone el design system «en curso» junto al capítulo 1, y el backlog anota su estado después del del plan 3.

Lo que el plan 3 dejó abierto y este plan no toma, porque ninguna tarea toca ese código:
- La caja de inspección tapa piezas del mapa (E4 y la revisión del plan 3): no cambia de lugar ni de tamaño (`22rem`, a `--space-md` del borde, que vale lo mismo que el `1rem` de hoy).
- El solape residual del 01-03: se mide y se anota (decisión 24), sin arreglarlo.
- H1 (sellos «perdido» apilados), H2 (`aria-live` de la terminal) y H3 (la ayuda y la leyenda se leen como un solo bloque gris): la ayuda y la leyenda siguen siendo dos `p.muted` con margen 0; el catálogo muestra la leyenda como «texto secundario», tal como se ve hoy.
- `use-card-side.ts` y `card-anchor.tsx` no cambian (decisión 18).

## Cambios visibles (cada píxel que se mueve)

«App» es el juego con sus fuentes. «Captura» es lo que ven las pruebas de Playwright, con las fuentes del sistema.

| Tarea | Dónde | Antes → después | Por qué |
|-------|-------|-----------------|---------|
| 1 | `#/entidades` | Aparece la sección «Elementos de la interfaz» al final de la página, con 30 especímenes | La red de seguridad (decisiones 15 y 23) |
| 2 | Opciones de la explicación, con el foco | Anillo azul del navegador → anillo bermellón de 2 px | Un solo anillo de foco (decisión 8) |
| 2 | Botón principal («Enviar solución», «Ver resultado», «Siguiente incidente») | Texto `#fff` → `#fbf8f2` | Un solo color sobre fondo de color (decisión 7) |
| 3 | Marca «nuevo» | 10.4 → 11 px | Escala de letra (decisión 5) |
| 3 | «Tareas», «Lo que te llevas», «Glosario» | 12.8 → 12 px; espacio entre letras 0.08 → 0.06 em | Escala de letra; una sola leyenda |
| 3 | Botones pequeños («¿Alguna pista?», «×») | 12.8 → 13 px | Escala de letra |
| 3 | Fichas, hueco vacío, contador del capítulo, tooltip | 13.6 → 14 px | Escala de letra |
| 3 | «Sin animaciones», explicación de una respuesta | 14.4 → 14 px | Escala de letra |
| 3 | Botones (también «Listo» y «Enviar» de las tarjetas del mapa) y opciones | 15.2 → 16 px | Escala de letra |
| 3 | Entrada del roadmap y del catálogo (lede) | 17.6 → 18 px | Escala de letra |
| 3 | Título del incidente | 24 → 22.4 px (el tamaño de `h2`) | Escala de letra |
| 3 | Rellenos verticales de botones pequeños y fichas; margen de «nuevo» | 3.2 → 4 px | Espacios de 4 px |
| 3 | Separación de las reglas; relleno vertical del hueco y de la línea de la terminal; margen de la explicación | 4.8 → 4 px | Espacios de 4 px |
| 3 | Separación entre incidentes del roadmap | 5.6 → 4 px | Espacios de 4 px |
| 3 | Hueco y bandejas; márgenes de la respuesta de Lucía, del glosario y de las pistas; relleno del tooltip; cabecera del catálogo | 6.4 → 8 px | Espacios de 4 px |
| 3 | Debajo de `h3` y del «Glosario»; grilla de las tarjetas del mapa (tarea y terminal); botones del resultado; relleno horizontal del tooltip y de la respuesta de Lucía; arriba de la lista de incidentes; lista de íconos del catálogo | 9.6 → 8 px | Espacios de 4 px |
| 3 | Relleno horizontal de fichas y opciones | 11.2 → 12 px | Espacios de 4 px |
| 3 | Cabecera del capítulo y fila del incidente; debajo de las tareas y del glosario; barra del incidente; debajo de los títulos del catálogo | 12.8 → 12 px | Espacios de 4 px |
| 3 | Relleno vertical de tarjetas y capítulos; relleno horizontal de botones; separación entre capítulos | 14.4 → 16 px | Espacios de 4 px |
| 3 | Sangría de la lista de incidentes | 38.4 → 40 px | Espacios de 4 px |
| 3 | Separación horizontal de los íconos y de los especímenes del catálogo | 19.2 → 16 px | Espacios de 4 px |
| 3 | Terminal acoplada de Casa de Lucía (01-03), por la suma de lo anterior | 495 → 503 px de alto; a 1280×800 tapa 15 px del sello perdido en vez de 7 (a 1366×768, 31 en vez de 23) | Escalas (decisión 24) |
| 3 | Etiquetas del mapa, «!» de alerta y `strong` (solo captura) | 500 → 400; 700 → 600; 700 → 600 | Pesos que se cargan: en la app ya se veían así |
| 6 | Rol del roadmap («Defensor», «Atacante») | Peso 400 → 600; interlineado 1.5 → 1.2 (la fila no cambia de alto) | Una sola leyenda (decisión 13) |
| 6 | Nombre de bandeja («Type», «Source», «Origen», «Destino», «Mensaje») y leyendas de la caja de inspección | Interlineado normal → 1.2: alrededor de 1 px menos de alto, y lo de abajo sube | Una sola leyenda |
| 6 | `#/entidades`, espécimen del rol | Pierde su fila envolvente del roadmap | Ya no la necesita para tener su estilo |

Las Tareas 4, 5 y 7 no mueven ningún píxel: las dos capturas pasan sin regrabar. Newsreader 600 no se carga (decisión 6): los términos de los títulos y el «?» del sello «perdido» se ven como hoy.

## Review Focus

1. **Las capturas son estables con tolerancia cero.** Cada tarea corre la de `entities` al menos dos veces. Si una falla sin un cambio de código, parar y avisar; no subir la tolerancia.
2. **El contrato de las bandejas, que ya usan la tarjeta de tarea y la terminal.** `ChipTray({ name, chips: TrayChip[], picked, onPick })` con `TrayChip = { id, label: ReactNode }`, y `trayChips` en `map-cards/chip-card.tsx`. Tests: Tarea 5 (`in a tray, names the group, presses only the picked chip and reports the chip the player picks`), y los de `task-card.test.tsx` y `terminal-card.test.tsx`, que no cambian.
3. **El mapa lee los tokens.** Si Vitest vuelve a entregar el CSS vacío, `token()` falla con `Unknown design token`. Test: Tarea 2 (`follows a role down to the raw colour of its palette entry`).
4. **Las tarjetas del mapa con su `div` interior (`ChipCard`).** El foco y Escape siguen funcionando, en la tarjeta de tarea y en la terminal. Tests: Playwright `focus goes to the card heading when a Security Group opens, and back to it on Escape`; Vitest `task-card.test.tsx` y `terminal-card.test.tsx`.
5. **El 04-01 y el capítulo 1 con letras y espacios nuevos.** Ninguna etiqueta ni sello se enciman, y las tarjetas no tapan lo que deben dejar ver. Tests de Playwright: `labels and stamps do not overlap, and the open card does not cover its Security Group`, `an intrusion shows its alert inside the label of the device, and no label or stamp overlaps`, `in 01-01 the open terminal covers neither the printer, nor its stamp, nor the laptop of Lucía` e `in 01-03 the open terminal covers neither the lost ping, nor the router, nor the internet, for any origin`.
6. **El solape anotado del 01-03 (decisión 24).** A 1280×800 la terminal acoplada de Casa de Lucía tapa 15 px del sello perdido; ninguna prueba lo mide a ese tamaño.

## Árbol al terminar (solo lo nuevo o cambiado)

```
DESIGN.md (nuevo)  README.md  index.html  eslint.config.js  vite.config.ts
.claude/           az-rules.json  rules/{folder-structure.md, no-magic-strings.md}
scripts/           eslint-config.test.ts
src/               CLAUDE.md styles.css
│   design/        (nuevo) CLAUDE.md index.ts tokens.css tokens.ts tokens.test.ts primitives.css button.tsx button.test.tsx choice.tsx choice.test.tsx card.tsx name-tag.tsx
│   copy/          index.ts ui.ts
│   scene/         CLAUDE.md theme.ts ink.tsx road.tsx
│   │   entities/  CLAUDE.md actor.tsx device.tsx edge.tsx firewall.tsx internet.tsx network.tsx packet.tsx
│   │   overlay/   CLAUDE.md piece-label.tsx
│   ui/            CLAUDE.md roadmap.tsx notice-page.tsx tagged-text.tsx
│   │   catalog/   CLAUDE.md entities-page.tsx entities-page.test.tsx interface-section.tsx (nuevo)
│   │   incident/  CLAUDE.md incident-screen.tsx lucia-card.tsx inspection-box.tsx explanation-card.tsx result-card.tsx
│   │   │   map-cards/  CLAUDE.md chip-card.tsx task-card.tsx terminal-card.tsx
tests/e2e/         CLAUDE.md entities.spec.ts roadmap.spec.ts
│   snapshots/     CLAUDE.md entities-darwin.png interface-darwin.png (nueva)
docs/plans/follow-the-packet-roadmap.md
docs/plans/2026-10-08-follow-the-packet-followups.md
```

---

### Task 1: La red de seguridad: los elementos de la interfaz en `#/entidades`, con tolerancia cero (G1)

Antes de tocar un solo estilo, una sección nueva de `#/entidades` dibuja cada elemento de la interfaz en cada variante y estado, con las clases que usan hoy las pantallas: botones (también el deshabilitado de «Enviar»), enlaces, fichas (también la elegida con un nombre), bandeja, hueco, opciones, explicación, tarjetas (también la terminal, con su línea), leyendas, texto con término, texto secundario (la leyenda de los sellos), estrellas, alerta y respuesta de Lucía. Cada espécimen lleva su leyenda. Playwright la compara con una captura propia, con el foco en una opción. Las dos capturas de la página dejan de tolerar el 1 %: no aceptan ni un píxel distinto (G1). La captura de esta tarea muestra el problema del foco: la opción tiene el anillo azul del navegador.

**Files:**
- Create: `src/ui/catalog/interface-section.tsx`, `tests/e2e/snapshots/interface-darwin.png` (la escribe Playwright)
- Modify: `src/copy/ui.ts`, `src/copy/index.ts`, `src/ui/catalog/entities-page.tsx`, `src/styles.css`, `src/ui/catalog/CLAUDE.md`, `tests/e2e/CLAUDE.md`, `tests/e2e/snapshots/CLAUDE.md`
- Test: `src/ui/catalog/entities-page.test.tsx`, `tests/e2e/entities.spec.ts`

**Interfaces:**
- Consumes: `EntitiesPage` y `entities.spec.ts` del plan 2; `Stars` y `TaggedText` de `src/ui/`; los textos de `@/copy`, también `TERMINAL_TEXT` y `SCREEN_TEXT.stampLegend` del plan 3.
- Produces:
  - `INTERFACE_TEXT` en `@/copy`: `title`, `family`, `variant` (la leyenda de cada espécimen) y `sample` (textos de muestra: fichas, la ficha con nombre, el origen y las direcciones de la terminal, el texto, las opciones y la explicación).
  - `InterfaceSection()` en `src/ui/catalog/interface-section.tsx`, dibujada al final de `EntitiesPage`, con la región «Elementos de la interfaz».
  - Las dos capturas con `{ maxDiffPixels: 0, threshold: 0 }`.

- [ ] **Step 1: Comprobar el punto de partida**

```bash
git status --short
git log --oneline -1
pnpm exec vitest run
```

Expected: `git status` solo muestra lo que ya estaba fuera de esta tarea: el trabajo de otras sesiones (`../../syllabus.md`, `../../labs/…`, `../../docs/research/`, `../../docs/specs/…`, `../../docs/plans/…`), `../../.claude/` y este plan, `../../docs/plans/2026-10-09-follow-the-packet-design-system.md`, si todavía no tiene commit. Nada bajo `src/` ni `tests/`. El último commit es `c17d9cd fix: keep the 01-03 experiment visible with the terminal open, and make a picked name chip readable`. Vitest: `Test Files 48 passed (48)` y `Tests 712 passed (712)`. Si Playwright no encuentra Chromium más adelante, correr `pnpm exec playwright install chromium`.

- [ ] **Step 2: Escribir los tests**

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/ui/catalog/entities-page.test.tsx',
    (
        r"""import { CATALOG_TEXT, ENTITY_REFS, SCREEN_TEXT, entityName, toPlainText } from '@/copy';""",
        r"""import { CATALOG_TEXT, ENTITY_REFS, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, SCREEN_TEXT, TERMINAL_TEXT, entityName, toPlainText } from '@/copy';""",
    ),
    (
        r"""    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons })).getAllByRole('listitem');
    expect(icons).toHaveLength(ENTITY_REFS.length + 4);
    for (const entity of ENTITY_REFS) expect(screen.getByText(toPlainText(entityName(entity))).closest('li')).toContainHTML('<svg');""",
        r"""    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons }));
    expect(icons.getAllByRole('listitem')).toHaveLength(ENTITY_REFS.length + 4);
    for (const entity of ENTITY_REFS) expect(icons.getByText(toPlainText(entityName(entity))).closest('li')).toContainHTML('<svg');""",
    ),
    (
        r"""    expect(screen.getByText('Casa de Lucía')).toHaveClass('name-tag');
  });""",
        r"""    expect(screen.getByText('Casa de Lucía')).toHaveClass('name-tag');
  });

  it('shows every element of the interface in its own region, each in its variants and states', () => {
    render(<EntitiesPage />);
    const elements = within(screen.getByRole('region', { name: INTERFACE_TEXT.title }));
    expect(elements.getByRole('button', { name: LUCIA_TEXT.submit })).toBeInTheDocument();
    expect(elements.getByRole('link', { name: RESULT_TEXT.next })).toHaveAttribute('href', '#/');
    expect(elements.getByRole('link', { name: SCREEN_TEXT.back })).toHaveAttribute('href', '#/');
    expect(elements.getAllByRole('button', { pressed: true })).toHaveLength(4);
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.chosen })).toBeDisabled();
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.option })).toBeEnabled();
    const [disabledSend, terminalSend] = elements.getAllByRole('button', { name: TERMINAL_TEXT.send });
    expect(disabledSend).toBeDisabled();
    expect(terminalSend).toBeEnabled();
    expect(elements.getByText(SCREEN_TEXT.stampLegend)).toHaveClass('muted');
  });""",
    ),
)


edit(
    'tests/e2e/entities.spec.ts',
    (
        r"""const LAST_CAPTION = 'intruso';""",
        r"""const INTERFACE = 'Elementos de la interfaz';
const FOCUSED_OPTION = 'Una respuesta posible';
const LAST_CAPTION = 'intruso';""",
    ),
    (
        r"""    await expect(pieces).toHaveScreenshot('entities.png', { maxDiffPixelRatio: 0.01 });""",
        r"""    await expect(pieces).toHaveScreenshot('entities.png', { maxDiffPixels: 0, threshold: 0 });
    expect(errors).toEqual([]);
  });

  test('the interface elements are drawn in every variant and state as recorded, with the focus ring on an option', async ({ page }) => {
    const errors = collectErrors(page);
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    await elements.getByRole('button', { name: FOCUSED_OPTION }).focus();
    await expect(elements).toHaveScreenshot('interface.png', { maxDiffPixels: 0, threshold: 0 });""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/ui/catalog
```

Expected: `Test Files 1 failed (1)` y `Tests 1 failed | 3 passed (4)`. Falla `shows every element of the interface in its own region, each in its variants and states`, con `TypeError: Cannot read properties of undefined (reading 'title')`: todavía no existe `INTERFACE_TEXT`.

- [ ] **Step 4: Implementar**

Contenido completo de `src/ui/catalog/interface-section.tsx`:

```tsx
import type { ReactNode } from 'react';
import { EXPLANATION_TEXT, INSPECTION_TEXT, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, type TermId } from '@/copy';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';

const VARIANT = INTERFACE_TEXT.variant;
const SAMPLE = INTERFACE_TEXT.sample;
const [FIRST_CHIP, SECOND_CHIP] = SAMPLE.chips;
const [FIRST_ADDRESS, SECOND_ADDRESS] = SAMPLE.addresses;
const SAMPLE_STARS = 2;
const NEW_TERMS = new Set<TermId>(['security-group']);

function Specimen({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }) {
  return (
    <figure className={wide ? 'catalog__specimen catalog__specimen--wide' : 'catalog__specimen'}>
      {children}
      <figcaption className="catalog__caption">{caption}</figcaption>
    </figure>
  );
}

function Family({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="catalog__family">
      <h3>{name}</h3>
      <div className="catalog__specimens">{children}</div>
    </div>
  );
}

/** Every element of the interface in every variant and state, drawn with the classes the screens use, so its capture shows any change to how one looks. */
export function InterfaceSection() {
  return (
    <section aria-labelledby="catalog-interface" className="catalog__section">
      <h2 id="catalog-interface">{INTERFACE_TEXT.title}</h2>
      <Family name={INTERFACE_TEXT.family.buttons}>
        <Specimen caption={VARIANT.primary}>
          <button type="button" className="btn btn--primary">
            {LUCIA_TEXT.submit}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.secondary}>
          <button type="button" className="btn">
            {TASK_CARD_TEXT.done}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.small}>
          <button type="button" className="btn btn--small">
            {LUCIA_TEXT.askHint}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.disabled}>
          <button type="button" className="btn" disabled>
            {TERMINAL_TEXT.send}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.primaryLink}>
          <a className="btn btn--primary" href="#/">
            {RESULT_TEXT.next}
          </a>
        </Specimen>
        <Specimen caption={VARIANT.link}>
          <a className="btn" href="#/">
            {RESULT_TEXT.back}
          </a>
        </Specimen>
        <Specimen caption={VARIANT.textLink}>
          <a href="#/">{SCREEN_TEXT.back}</a>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.choices}>
        <Specimen caption={VARIANT.chip}>
          <button type="button" className="chip" aria-pressed={false}>
            <TaggedText text={FIRST_CHIP} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.chipPressed}>
          <button type="button" className="chip" aria-pressed>
            <TaggedText text={FIRST_CHIP} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.chipNamePressed}>
          <button type="button" className="chip" aria-pressed>
            <TaggedText text={SAMPLE.namedChip} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.tray}>
          <div role="group" aria-label={TASK_CARD_TEXT.what} className="tray">
            <span className="tray__name" aria-hidden="true">
              {TASK_CARD_TEXT.what}
            </span>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={FIRST_CHIP} />
            </button>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={SECOND_CHIP} />
            </button>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.slotEmpty}>
          <div className="slot">
            <span className="slot__empty">{TASK_CARD_TEXT.what}</span>
            <span aria-hidden="true">←</span>
            <span className="slot__empty">{TASK_CARD_TEXT.from}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.slotFull}>
          <div className="slot">
            <button type="button" className="chip">
              <TaggedText text={FIRST_CHIP} />
            </button>
            <span aria-hidden="true">←</span>
            <span className="slot__empty">{TASK_CARD_TEXT.from}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.option} wide>
          <button type="button" className="option" aria-pressed={false}>
            {SAMPLE.option}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.optionChosen} wide>
          <button type="button" className="option" aria-pressed disabled>
            {SAMPLE.chosen}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.optionClosed} wide>
          <button type="button" className="option" aria-pressed={false} disabled>
            {SAMPLE.closed}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.right} wide>
          <p className="feedback feedback--right">
            <strong>{EXPLANATION_TEXT.right}</strong> {SAMPLE.feedback}
          </p>
        </Specimen>
        <Specimen caption={VARIANT.wrong} wide>
          <p className="feedback feedback--wrong">
            <strong>{EXPLANATION_TEXT.wrong}</strong> {SAMPLE.feedback}
          </p>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.cards}>
        <Specimen caption={VARIANT.card} wide>
          <section className="card">
            <h2>{LUCIA_TEXT.name}</h2>
            <p>
              <TaggedText text={SAMPLE.text} newTerms={NEW_TERMS} />
            </p>
          </section>
        </Specimen>
        <Specimen caption={VARIANT.cardSoon} wide>
          <div className="chapter chapter--soon">
            <h2>{ROADMAP_TEXT.soon}</h2>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.terminal} wide>
          <section className="card chip-card">
            <h2>
              <TaggedText text={TERMINAL_TEXT.title(SAMPLE.origin)} />
            </h2>
            <p className="slot">
              <code>
                <TaggedText text={TERMINAL_TEXT.ping(FIRST_ADDRESS)} />
              </code>
            </p>
            <div role="group" aria-label={TERMINAL_TEXT.trays.to} className="tray">
              <span className="tray__name" aria-hidden="true">
                {TERMINAL_TEXT.trays.to}
              </span>
              <button type="button" className="chip" aria-pressed>
                {FIRST_ADDRESS}
              </button>
              <button type="button" className="chip" aria-pressed={false}>
                {SECOND_ADDRESS}
              </button>
            </div>
            <button type="button" className="btn">
              {TERMINAL_TEXT.send}
            </button>
            <button type="button" className="btn">
              {TASK_CARD_TEXT.done}
            </button>
          </section>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.text}>
        <Specimen caption={VARIANT.caption}>
          <h3>{LUCIA_TEXT.tasks}</h3>
        </Specimen>
        <Specimen caption={VARIANT.caption}>
          <details className="lucia__glossary">
            <summary>{LUCIA_TEXT.glossary}</summary>
          </details>
        </Specimen>
        <Specimen caption={VARIANT.fieldCaption}>
          <div className="inspection">
            <dl>
              <dt>{INSPECTION_TEXT.whatIs}</dt>
            </dl>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.roleCaption}>
          <div className="level-item">
            <span className="role">{ROADMAP_TEXT.role.defender}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.text} wide>
          <p>
            <TaggedText text={SAMPLE.text} newTerms={NEW_TERMS} />
          </p>
        </Specimen>
        <Specimen caption={VARIANT.muted} wide>
          <p className="muted">{SCREEN_TEXT.stampLegend}</p>
        </Specimen>
        <Specimen caption={VARIANT.stars}>
          <Stars count={SAMPLE_STARS} />
        </Specimen>
        <Specimen caption={VARIANT.alert}>
          <p className="lucia__alert">{LUCIA_TEXT.intrusion}</p>
        </Specimen>
        <Specimen caption={VARIANT.reply} wide>
          <div className="lucia__reply">
            <p>{LUCIA_TEXT.intruding}</p>
          </div>
        </Specimen>
      </Family>
    </section>
  );
}
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/copy/ui.ts',
    (
        r"""/** Returns the name of an entity in this variant, as the catalog shows it; an actor is a character, so its name is marked as a name, and an intruder's packet says so. */""",
        r"""export const INTERFACE_TEXT = {
  title: 'Elementos de la interfaz',
  family: { buttons: 'Botones', choices: 'Fichas y opciones', cards: 'Tarjetas', text: 'Textos y etiquetas' },
  variant: {
    primary: 'principal',
    secondary: 'secundario',
    small: 'pequeño',
    disabled: 'deshabilitado',
    primaryLink: 'enlace principal',
    link: 'enlace',
    textLink: 'enlace de texto',
    chip: 'ficha',
    chipPressed: 'ficha elegida',
    chipNamePressed: 'ficha elegida con nombre',
    tray: 'bandeja',
    slotEmpty: 'hueco vacío',
    slotFull: 'hueco con ficha',
    option: 'opción',
    optionChosen: 'opción elegida',
    optionClosed: 'opción cerrada',
    right: 'respuesta correcta',
    wrong: 'respuesta incorrecta',
    card: 'tarjeta',
    cardSoon: 'tarjeta próxima',
    terminal: 'tarjeta terminal',
    caption: 'leyenda',
    fieldCaption: 'leyenda de un campo',
    roleCaption: 'leyenda del rol',
    text: 'texto con término, término nuevo y nombre propio',
    muted: 'texto secundario',
    stars: 'estrellas',
    alert: 'alerta',
    reply: 'respuesta de Lucía',
  },
  sample: {
    chips: ['{{icmp}} · {{echo-request}}', '{{icmp}} · {{echo-reply}}'],
    namedChip: `${nameTag('tu-laptop')} ({{ip-address|IP}} 192.168.1.10)`,
    origin: nameTag('tu-laptop'),
    addresses: ['192.168.1.20', '192.168.1.11'],
    text: `El {{security-group}} de ${nameTag('servidor2')} no deja entrar el {{ping}}.`,
    option: 'Una respuesta posible',
    chosen: 'La respuesta elegida',
    closed: 'Una respuesta que ya no se puede elegir',
    feedback: 'Por qué la respuesta es así.',
  },
} as const;

/** Returns the name of an entity in this variant, as the catalog shows it; an actor is a character, so its name is marked as a name, and an intruder's packet says so. */""",
    ),
)


edit(
    'src/copy/index.ts',
    (
        r"""export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';""",
        r"""export { CATALOG_TEXT, INTERFACE_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';""",
    ),
)


edit(
    'src/ui/catalog/entities-page.tsx',
    (
        r"""import { useStillMode } from '@/ui/use-still-mode';
""",
        r"""import { useStillMode } from '@/ui/use-still-mode';
import { InterfaceSection } from './interface-section';
""",
    ),
    (
        r"""/** The design review page of the entity catalog: every piece in every variant and state on one canvas, and every icon with its name. */""",
        r"""/** The design review page of the entity catalog: every piece in every variant and state on one canvas, every icon with its name, and every element of the interface. */""",
    ),
    (
        r"""    </main>""",
        r"""      <InterfaceSection />
    </main>""",
    ),
)


edit(
    'src/styles.css',
    (
        r""".catalog__icons li { display: flex; align-items: center; }""",
        r""".catalog__icons li { display: flex; align-items: center; }
.catalog__family { margin-bottom: 1.5rem; }
.catalog__specimens { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.2rem 1.5rem; }
.catalog__specimen { margin: 0; display: grid; justify-items: start; gap: 0.4rem; }
.catalog__specimen--wide { width: 20rem; justify-items: stretch; }""",
    ),
)


edit(
    'src/ui/catalog/CLAUDE.md',
    (
        r"""The `#/entidades` page: the entity catalog for design review, with every piece on one canvas (`src/scene/catalog/`) and every icon with its name. The roadmap does not link to it.

- Not here: the pieces, the icons and the canvas (`src/scene/`), the names of the variants (`src/copy/ui.ts`).""",
        r"""The `#/entidades` page: the entity catalog for design review, with every piece on one canvas (`src/scene/catalog/`), every icon with its name, and every element of the interface in every variant and state (`interface-section.tsx`). The roadmap does not link to it.

- The interface section draws each element the way the screens draw it. When a screen gains an element, a variant or a state, the section gains its specimen, so the capture covers it.
- Not here: the pieces, the icons and the canvas (`src/scene/`), the names of the variants and the sample texts (`src/copy/ui.ts`).""",
    ),
)


edit(
    'tests/e2e/CLAUDE.md',
    (
        r"""- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.""",
        r"""- `entities.spec.ts` compares two regions of the `/entidades` page with their captures in `snapshots/`: the map pieces and the interface elements, with the focus ring on one option. Both are taken still, at a fixed window size and pixel ratio, with web fonts blocked so the captures do not depend on the network. They tolerate no different pixel, and no difference of colour within a pixel.""",
    ),
)


edit(
    'tests/e2e/snapshots/CLAUDE.md',
    (
        r"""- A capture changes only on purpose: when a task changes how an entity looks, it records the new capture with `pnpm exec playwright test entities --update-snapshots=all` and commits it with the change.""",
        r"""- A capture changes only on purpose: when a task changes how an entity or an interface element looks, it records the new captures with `pnpm exec playwright test entities --update-snapshots=all` and commits them with the change. The comparison tolerates no different pixel and no difference of colour within a pixel (`maxDiffPixels: 0`, `threshold: 0`).""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verificar los tests unitarios**

```bash
pnpm exec vitest run
```

Expected: `Tests 713 passed (713)` en 48 archivos.

- [ ] **Step 6: Grabar la captura nueva**

```bash
pnpm exec playwright test entities --update-snapshots=missing
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: la primera corrida dice `A snapshot doesn't exist at …/tests/e2e/snapshots/interface-darwin.png, writing actual.` y `4 passed`; las otras dos, `4 passed` sin escribir nada. La captura de «Piezas del mapa» pasa sin regrabar, ya con tolerancia cero. Abrir `tests/e2e/snapshots/interface-darwin.png`: 1232 × 1049 px, cuatro familias («Botones», «Fichas y opciones», «Tarjetas», «Textos y etiquetas») y 30 especímenes, cada uno con su leyenda: 7 botones (con «deshabilitado»), 11 fichas y opciones (con «ficha elegida con nombre»), 3 tarjetas (con «tarjeta terminal») y 9 textos (con «texto secundario»). La opción «Una respuesta posible» tiene el anillo de foco azul del navegador: es el estado de hoy, y la Tarea 2 lo corrige. Si falta un espécimen o una leyenda, parar y avisar.

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones`, `Tests 713 passed (713)` y 22 tests de Playwright.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "test(ui): show every interface element on #/entidades with a zero-tolerance capture"
```

---

### Task 2: La capa `src/design/` y los tokens en un solo lugar

Refactor de los estilos: los colores, las fuentes, las líneas, los radios, las sombras y el foco pasan a tokens en `src/design/tokens.css`, con los valores de hoy. El bermellón se parte en tres roles (peligro, énfasis y foco) con el mismo valor. `src/scene/theme.ts` lee ese archivo, así que el mapa usa los mismos colores y la misma escala de líneas (`LINE`) sin repetirlos; `ACCENT` pasa a llamarse `DANGER`, porque en el mapa el bermellón solo marca peligro. Los estilos que trajo el plan 3 (`.btn:disabled`, `.chip-card`, la ficha elegida con un nombre y `.map-card` con sus variables) pasan a tokens como los demás, y el techo de la casa usa la escala de líneas. La capa nueva entra a la tabla de capas. Dos cambios se ven, en la captura de la interfaz: el anillo de foco único (la opción deja el azul del navegador) y el texto del botón principal en papel claro. La captura de «Piezas del mapa» no cambia: el mapa se dibuja igual, píxel por píxel.

**Files:**
- Create: `src/design/CLAUDE.md`, `src/design/index.ts`, `src/design/tokens.css`, `src/design/tokens.ts`, `src/design/primitives.css`
- Modify: `src/styles.css` (casi entero), `src/scene/theme.ts` (entero), `eslint.config.js`, `vite.config.ts`, `src/scene/ink.tsx`, `src/scene/road.tsx`, `src/scene/entities/{actor,device,edge,firewall,internet,network,packet}.tsx`, `src/scene/entities/CLAUDE.md`, `src/scene/CLAUDE.md`, `src/ui/CLAUDE.md`, `src/CLAUDE.md`, `.claude/rules/folder-structure.md`, `.claude/az-rules.json`, `tests/e2e/snapshots/interface-darwin.png` (se regraba)
- Test: `src/design/tokens.test.ts`, `scripts/eslint-config.test.ts`

**Interfaces:**
- Consumes: la tabla `LAYER_IMPORTS` de `eslint.config.js`; los colores de `src/scene/theme.ts`; la captura de la Tarea 1.
- Produces:
  - `@/design`: `token(name: string): string` (sigue las referencias `var()` hasta el valor; lanza `Unknown design token: <name>`) y `tokenPx(name: string): number` (lanza `Design token <name> is not in pixels`).
  - `src/design/tokens.css`: `--palette-*`, `--color-page`, `--color-surface`, `--color-shade`, `--color-ink`, `--color-ink-soft`, `--color-on-fill`, `--color-danger`, `--color-emphasis`, `--color-focus`, `--font-*`, `--stroke-thin|regular|bold|heavy|double`, `--radius`, `--radius-pill`, `--radius-round`, `--shadow-sm|md|tip`, `--focus-ring`, `--focus-offset`, `--grain`.
  - `src/design/primitives.css` con la única regla de foco; `src/styles.css` la importa primero, después de los tokens.
  - `src/scene/theme.ts`: `INK`, `PAPER_FILL`, `PAPER_SHADE`, `DANGER` (antes `ACCENT`) y `LINE = { thin, regular, bold, heavy }`.
  - La capa `design` en `LAYER_IMPORTS`: `design: []`; `scene` y `ui` la pueden importar.

- [ ] **Step 1: Comprobar que se parte de la Tarea 1**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 713 passed (713)` en 48 archivos.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/design/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { token, tokenPx } from './tokens';

describe('design tokens', () => {
  it('follows a role down to the raw colour of its palette entry', () => {
    expect(token('--color-danger')).toBe(token('--palette-vermilion'));
    expect(token('--color-danger')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('reads a length in pixels as a number', () => {
    expect(tokenPx('--stroke-regular')).toBe(1.5);
  });

  it('throws for an unknown token, and for a token that is not in pixels', () => {
    expect(() => token('--color-nowhere')).toThrow('Unknown design token: --color-nowhere');
    expect(() => tokenPx('--color-ink')).toThrow('is not in pixels');
  });
});
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'scripts/eslint-config.test.ts',
    (
        r"""      ['scene imports a peer', 'src/scene/probe.ts', "import { loadProgress } from '@/storage';\nexport const load = loadProgress;\n"],""",
        r"""      ['the design system imports another layer', 'src/design/probe.ts', "import { TERMS } from '@/copy';\nexport const terms = TERMS;\n"],
      ['the engine imports the design system', 'src/engine/network/probe.ts', "import { token } from '@/design';\nexport const read = token;\n"],
      ['scene imports a peer', 'src/scene/probe.ts', "import { loadProgress } from '@/storage';\nexport const load = loadProgress;\n"],""",
    ),
    (
        r"""    it('allows tests to import testing helpers', async () => {""",
        r"""    it('allows the map and the panels to import the design system', async () => {
      const code = "import { token } from '@/design';\nexport const read = token;\n";
      expect(await ruleIdsFor('src/scene/probe.ts', code)).toEqual([]);
      expect(await ruleIdsFor('src/ui/probe.ts', code)).toEqual([]);
    });

    it('allows tests to import testing helpers', async () => {""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/design scripts/eslint-config.test.ts
```

Expected: `Test Files 2 failed (2)` y `Tests 2 failed | 43 passed (45)`. `tokens.test.ts` no carga (`Cannot find module './tokens'`), y fallan `rejects: the design system imports another layer` y `rejects: the engine imports the design system` (`expected [] to include 'no-restricted-imports'`): la capa `design` todavía no está en la tabla.

- [ ] **Step 4: Implementar**

Contenido completo de `src/design/tokens.css`:

```css
:root {
  --palette-paper: #f6f1e7;
  --palette-paper-light: #fbf8f2;
  --palette-paper-dark: #efe8da;
  --palette-ink: #2b2b2b;
  --palette-ink-light: #5f5a52;
  --palette-vermilion: #e4572e;

  --color-page: var(--palette-paper);
  --color-surface: var(--palette-paper-light);
  --color-shade: var(--palette-paper-dark);
  --color-ink: var(--palette-ink);
  --color-ink-soft: var(--palette-ink-light);
  --color-on-fill: var(--palette-paper-light);
  --color-danger: var(--palette-vermilion);
  --color-emphasis: var(--palette-vermilion);
  --color-focus: var(--palette-vermilion);

  --font-display: 'Newsreader', Georgia, serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --stroke-thin: 1px;
  --stroke-regular: 1.5px;
  --stroke-bold: 2px;
  --stroke-heavy: 2.5px;
  --stroke-double: 4px;

  --radius: 3px;
  --radius-pill: 999px;
  --radius-round: 50%;

  --shadow-sm: 2px 2px 0 var(--color-ink);
  --shadow-md: 3px 3px 0 var(--color-ink);
  --shadow-tip: 2px 2px 0 var(--color-emphasis);

  --focus-ring: var(--stroke-bold) solid var(--color-focus);
  --focus-offset: 2px;

  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 .06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Contenido completo de `src/design/tokens.ts`:

```ts
import TOKENS_CSS from './tokens.css?raw';

const DECLARATION = /(--[a-z0-9-]+):\s*([^;]+);/g;
const REFERENCE = /^var\((--[a-z0-9-]+)\)$/;
const PIXELS = /^(\d+(?:\.\d+)?)px$/;
const TOKENS = new Map(Array.from(TOKENS_CSS.matchAll(DECLARATION), ([, name, value]) => [name, value.trim()]));

/** Returns the value of a token of tokens.css, following var() references down to the raw value; throws for an unknown token. */
export function token(name: string): string {
  const value = TOKENS.get(name);
  if (value === undefined) throw new Error(`Unknown design token: ${name}`);
  const reference = REFERENCE.exec(value)?.[1];
  return reference === undefined ? value : token(reference);
}

/** Returns a token measured in pixels as a number, such as a line width of the 3D map; throws when the token is not in pixels. */
export function tokenPx(name: string): number {
  const pixels = PIXELS.exec(token(name))?.[1];
  if (pixels === undefined) throw new Error(`Design token ${name} is not in pixels`);
  return Number(pixels);
}
```

Contenido completo de `src/design/index.ts`:

```ts
export { token, tokenPx } from './tokens';
```

Contenido completo de `src/design/primitives.css`:

```css
:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }
```

Contenido completo de `src/design/CLAUDE.md`:

```markdown
# design

The game's design system: every colour, font, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), and the styles every screen shares (`primitives.css`, which holds the one focus ring).

- `tokens.css` has two layers of colour: the palette (`--palette-*`, raw colours named after what they are) and the roles (`--color-*`, named after what they are for). Styles and the map use roles, never the palette. The other tokens (`--font-*`, `--stroke-*`, `--radius*`, `--shadow-*`, `--focus-*`) have one layer.
- Vermilion has three roles, today with the same value: `--color-danger` (blocked, intruder, alert, a rejected solution, a wrong answer), `--color-emphasis` (the primary button, the chapter numbers, the stars, the "nuevo" mark, the tooltip shadow) and `--color-focus` (the focus ring).
- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.
- Not here: screens and panels (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).
- May import: no layer. `src/ui/` and `src/scene/` import it through `index.ts` (`@/design`); `src/styles.css` imports its stylesheets.
```

Contenido completo de `src/styles.css`:

```css
@import './design/tokens.css';
@import './design/primitives.css';

* { box-sizing: border-box; }
body { margin: 0; background: var(--color-page) var(--grain); color: var(--color-ink); font: 16px/1.5 var(--font-body); }
h1 { font: 500 2.25rem/1.1 var(--font-display); margin: 0 0 0.5rem; }
h2 { font: 500 1.4rem/1.2 var(--font-display); margin: 0; }
h3 { font: 600 0.8rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.6rem; }
a { color: var(--color-ink); text-underline-offset: 3px; }
code, .mono { font-family: var(--font-mono); font-size: 0.875rem; }
.muted { color: var(--color-ink-soft); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.btn { font: 600 0.95rem var(--font-body); background: var(--color-surface); color: var(--color-ink); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius); padding: 0.5rem 0.9rem; cursor: pointer; text-decoration: none; display: inline-block; box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--color-emphasis); color: var(--color-on-fill); }
.btn--small { padding: 0.2rem 0.5rem; font-size: 0.8rem; box-shadow: none; }
.btn:disabled { color: var(--color-ink-soft); background: var(--color-shade); border-color: var(--color-ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }

.page { max-width: 880px; margin: 0 auto; padding: 2.5rem 1.5rem; }
.lede { color: var(--color-ink-soft); font-size: 1.1rem; }
.chapters { list-style: none; padding: 0; display: grid; gap: 0.9rem; }
.chapter { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: 0.9rem 1rem; box-shadow: var(--shadow-md); }
.chapter--soon { opacity: 0.5; box-shadow: none; border-style: dashed; }
.chapter__head { display: flex; align-items: baseline; gap: 0.8rem; }
.chapter__num { font: 500 1.4rem var(--font-display); color: var(--color-emphasis); min-width: 1.6rem; }
.chapter__meta { margin-left: auto; font-size: 0.85rem; color: var(--color-ink-soft); }
.levels { list-style: none; padding: 0.6rem 0 0 2.4rem; margin: 0; display: grid; gap: 0.35rem; }
.level-item { display: flex; gap: 0.8rem; align-items: baseline; }
.level-item .role { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-soft); }
.stars-inline { margin-left: auto; color: var(--color-emphasis); }
.locked { color: var(--color-ink-soft); }

.html-layer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }

.map-button { pointer-events: auto; font: 500 13px var(--font-body); color: var(--color-ink); background: var(--color-surface); border: var(--stroke-thin) solid var(--color-ink); padding: 1px 6px; white-space: nowrap; cursor: pointer; }
.map-button--name { border-color: var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); }
.map-button--name .name-tag { border: 0; padding: 0; background: none; font-size: 12px; }
.map-button--locked { border-style: dashed; color: var(--color-ink-soft); }
.map-button__alert { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: var(--radius-round); font: 700 11px var(--font-body); color: var(--color-on-fill); background: var(--color-danger); vertical-align: 1px; }
.map-button__lock .entity-icon { margin-right: 0; }
.map-card { pointer-events: auto; width: var(--card-width); }
.map-card--right { transform: translate(var(--card-gap), -50%); }
.map-card--left { transform: translate(calc(-100% - var(--card-gap)), -50%); }
.map-card--dock { transform: translate(var(--card-x), calc(var(--card-y) - 100%)); }
.stamp { pointer-events: auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; font: 700 18px var(--font-display); background: var(--color-surface); border: var(--stroke-heavy) solid currentColor; border-radius: var(--radius-round); transform: rotate(-8deg); }
.stamp--arrived { color: var(--color-ink); }
.stamp--blocked { color: var(--color-danger); }

@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}

.card { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: 0.9rem 1rem; box-shadow: var(--shadow-md); }
.term { font-weight: 600; }
.term--tip { text-decoration: underline dotted; text-underline-offset: 3px; cursor: help; }
.name-tag { font-family: var(--font-mono); font-weight: 400; font-size: 0.82em; line-height: 1.35; border: var(--stroke-thin) solid var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); padding: 0 0.35em; white-space: nowrap; }
.term-tip { z-index: 100; width: max-content; max-width: min(18rem, calc(100vw - 16px)); padding: 0.4rem 0.6rem; font: 400 0.85rem/1.4 var(--font-body); color: var(--color-on-fill); background: var(--color-ink); border-radius: var(--radius); box-shadow: var(--shadow-tip); pointer-events: none; text-align: left; text-transform: none; letter-spacing: normal; }
.term__new { margin-left: 0.2rem; font: 600 0.65rem var(--font-body); color: var(--color-emphasis); text-transform: uppercase; letter-spacing: 0.06em; vertical-align: super; }
.lucia__alert { margin: 0.5rem 0; color: var(--color-danger); font-weight: 600; }
.lucia__reply { margin: 0.4rem 0 0.8rem; }
.lucia__reply p { margin: 0.4rem 0; padding: 0.4rem 0.6rem; border: var(--stroke-regular) dashed var(--color-danger); }
.tasks { list-style: none; padding: 0; margin: 0 0 0.8rem; display: grid; gap: 0.5rem; }
.glossary { margin: 0 0 0.8rem; }
.glossary dt { font-weight: 600; }
.entity-icon { width: 1.2em; height: 1.2em; margin-right: 0.35em; vertical-align: -0.22em; }
.glossary dd { margin: 0 0 0.4rem; color: var(--color-ink-soft); }
.lucia__glossary { margin: 0 0 0.8rem; }
.lucia__glossary summary { cursor: pointer; font: 600 0.8rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: 0.08em; }
.lucia__glossary[open] summary { margin-bottom: 0.6rem; }
.hint { margin: 0.4rem 0; }

.chip-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.6rem; }
.rules { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
.rules li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.rules__text { min-width: 0; }
.slot { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; min-height: 2.2rem; padding: 0.3rem 0.5rem; border: var(--stroke-regular) dashed var(--color-ink-soft); }
.slot__empty { color: var(--color-ink-soft); font-size: 0.85rem; }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
.tray__name { width: 100%; font: 600 0.75rem var(--font-body); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-soft); }
.chip { font: 600 0.85rem var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius-pill); padding: 0.2rem 0.7rem; cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--color-ink); color: var(--color-on-fill); }
.chip[aria-pressed='true'] .name-tag { background: transparent; border-color: currentColor; }
.stamp--intruder { color: var(--color-danger); border-style: double; border-width: var(--stroke-double); }
.stamp--lost { color: var(--color-ink-soft); border-style: dashed; }
button.stamp { cursor: help; }

.incident { display: grid; grid-template-columns: minmax(0, 1fr) 380px; height: 100vh; }
.incident__map { position: relative; min-height: 0; }
.incident__bar { position: absolute; inset: 0 0 auto 0; z-index: 40; display: flex; align-items: baseline; gap: 1rem; padding: 0.8rem 1rem; pointer-events: none; }
.incident__bar > * { pointer-events: auto; }
.incident__bar h1 { font-size: 1.5rem; margin: 0; }
.incident__motion { margin-left: auto; font-size: 0.9rem; }
.incident__side { display: grid; align-content: start; gap: 1rem; padding: 1rem; overflow-y: auto; background: var(--color-page); border-left: var(--stroke-regular) solid var(--color-ink); }
.incident__inspection { position: absolute; right: 1rem; bottom: 1rem; z-index: 35; display: flex; flex-direction: column; width: 22rem; max-width: calc(100% - 2rem); max-height: 45%; pointer-events: none; }
.incident__inspection .inspection { min-height: 0; overflow-y: auto; }
.incident__inspection > p { margin: 0; }
.inspection dl { margin: 0; }
.inspection dt { margin-top: 0.5rem; font: 600 0.75rem var(--font-body); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-soft); }
.inspection dd { margin: 0; }
.options { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.option { width: 100%; text-align: left; font: 0.95rem/1.4 var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); padding: 0.5rem 0.7rem; cursor: pointer; }
.option[aria-pressed='true'] { background: var(--color-shade); }
.option:disabled { cursor: default; }
.feedback { margin: 0.3rem 0 0; font-size: 0.9rem; }
.feedback--wrong { color: var(--color-danger); }
.result__list { list-style: none; padding: 0; }
.result__nav { display: flex; gap: 0.6rem; flex-wrap: wrap; }
@media (max-width: 900px) {
  .incident { grid-template-columns: 1fr; grid-template-rows: 65vh auto; height: auto; }
  .incident__side { border-left: none; border-top: var(--stroke-regular) solid var(--color-ink); }
}

.catalog { padding: 2rem 1.5rem 3rem; }
.catalog__head { max-width: 880px; display: grid; gap: 0.4rem; margin-bottom: 1.5rem; }
.catalog__head .lede { margin: 0; }
.catalog__motion { font-size: 0.9rem; }
.catalog__section { margin-bottom: 2rem; }
.catalog__section h2 { margin-bottom: 0.8rem; }
.catalog__canvas { position: relative; border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); }
.catalog__caption { margin: 0; font: 400 12px var(--font-body); color: var(--color-ink-soft); white-space: nowrap; }
.catalog__icons { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.6rem 1.2rem; }
.catalog__icons li { display: flex; align-items: center; }
.catalog__family { margin-bottom: 1.5rem; }
.catalog__specimens { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.2rem 1.5rem; }
.catalog__specimen { margin: 0; display: grid; justify-items: start; gap: 0.4rem; }
.catalog__specimen--wide { width: 20rem; justify-items: stretch; }
```

Contenido completo de `src/scene/theme.ts`:

```ts
import { token, tokenPx } from '@/design';

export const INK = token('--color-ink');
export const PAPER_FILL = token('--color-surface');
export const PAPER_SHADE = token('--color-shade');
export const DANGER = token('--color-danger');

/** The map's line widths in pixels: the same stroke scale as the borders of the interface. */
export const LINE = {
  thin: tokenPx('--stroke-thin'),
  regular: tokenPx('--stroke-regular'),
  bold: tokenPx('--stroke-bold'),
  heavy: tokenPx('--stroke-heavy'),
} as const;
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'eslint.config.js',
    (
        r"""  copy: ['engine'],""",
        r"""  design: [],
  copy: ['engine'],""",
    ),
    (
        r"""  scene: ['engine', 'copy', 'levels'],
  storage: ['engine', 'copy', 'levels'],
  ui: ['engine', 'copy', 'levels', 'game', 'scene', 'storage'],""",
        r"""  scene: ['engine', 'copy', 'levels', 'design'],
  storage: ['engine', 'copy', 'levels'],
  ui: ['engine', 'copy', 'levels', 'game', 'scene', 'storage', 'design'],""",
    ),
)


edit(
    'vite.config.ts',
    (
        r"""  },""",
        r"""    css: { include: [/\/design\/tokens\.css/] },
  },""",
    ),
)


edit(
    'src/scene/ink.tsx',
    (
        r"""import { INK, PAPER_FILL } from './theme';""",
        r"""import { INK, LINE, PAPER_FILL } from './theme';""",
    ),
    (
        r"""export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = 1.5 }: { size: Vec3; position: Vec3; fill?: string; lineWidth?: number }) {""",
        r"""export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = LINE.regular }: { size: Vec3; position: Vec3; fill?: string; lineWidth?: number }) {""",
    ),
)


edit(
    'src/scene/road.tsx',
    (
        r"""import { INK, PAPER_SHADE } from './theme';""",
        r"""import { INK, LINE, PAPER_SHADE } from './theme';""",
    ),
    (
        r"""      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={1} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={1} />""",
        r"""      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={LINE.thin} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={LINE.thin} />""",
    ),
)


edit(
    'src/scene/entities/actor.tsx',
    (
        r"""import { INK, PAPER_FILL, PAPER_SHADE } from '@/scene/theme';""",
        r"""import { INK, LINE, PAPER_FILL, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""          <InkBox size={[0.36, 0.05, 0.62]} position={[0, 0, 0]} fill={PAPER_SHADE} lineWidth={1} />""",
        r"""          <InkBox size={[0.36, 0.05, 0.62]} position={[0, 0, 0]} fill={PAPER_SHADE} lineWidth={LINE.thin} />""",
    ),
)


edit(
    'src/scene/entities/device.tsx',
    (
        r"""import { INK, PAPER_SHADE } from '@/scene/theme';""",
        r"""import { INK, LINE, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />""",
        r"""      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={LINE.thin} />""",
    ),
    (
        r"""      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={1} />""",
        r"""      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={LINE.thin} />""",
    ),
    (
        r"""      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={1} />""",
        r"""      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={LINE.thin} />""",
    ),
    (
        r"""      <Line points={boxEdgePoints(w, h, d)} segments color={INK} lineWidth={1.5} />""",
        r"""      <Line points={boxEdgePoints(w, h, d)} segments color={INK} lineWidth={LINE.regular} />""",
    ),
    (
        r"""      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={1} />}""",
        r"""      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={LINE.thin} />}""",
    ),
)


edit(
    'src/scene/entities/edge.tsx',
    (
        r"""import { PAPER_SHADE } from '@/scene/theme';""",
        r"""import { LINE, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z - 0.45]} lineWidth={1} />
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z + 0.45]} lineWidth={1} />""",
        r"""          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z - 0.45]} lineWidth={LINE.thin} />
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z + 0.45]} lineWidth={LINE.thin} />""",
    ),
)


edit(
    'src/scene/entities/firewall.tsx',
    (
        r"""import { ACCENT, INK, PAPER_SHADE } from '@/scene/theme';""",
        r"""import { DANGER, INK, LINE, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={1} />}""",
        r"""      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={LINE.thin} />}""",
    ),
    (
        r"""        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={blocking ? ACCENT : PAPER_SHADE} lineWidth={1} />
        {variant === 'host-firewall' && <Line points={BRICK_JOINTS} segments color={INK} lineWidth={1} />}""",
        r"""        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={blocking ? DANGER : PAPER_SHADE} lineWidth={LINE.thin} />
        {variant === 'host-firewall' && <Line points={BRICK_JOINTS} segments color={INK} lineWidth={LINE.thin} />}""",
    ),
)


edit(
    'src/scene/entities/internet.tsx',
    (
        r"""import { INK, PAPER_FILL } from '@/scene/theme';""",
        r"""import { INK, LINE, PAPER_FILL } from '@/scene/theme';""",
    ),
    (
        r"""      <Line points={EQUATOR} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_X} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_Z} color={INK} lineWidth={1} />
      <Billboard>
        <Line points={OUTLINE} color={INK} lineWidth={1.5} />""",
        r"""      <Line points={EQUATOR} color={INK} lineWidth={LINE.thin} />
      <Line points={MERIDIAN_X} color={INK} lineWidth={LINE.thin} />
      <Line points={MERIDIAN_Z} color={INK} lineWidth={LINE.thin} />
      <Billboard>
        <Line points={OUTLINE} color={INK} lineWidth={LINE.regular} />""",
    ),
)


edit(
    'src/scene/entities/network.tsx',
    (
        r"""import { PAPER_SHADE } from '@/scene/theme';""",
        r"""import { LINE, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""      <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={2} />""",
        r"""      <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={LINE.bold} />""",
    ),
)


edit(
    'src/scene/entities/packet.tsx',
    (
        r"""import { ACCENT, INK } from '@/scene/theme';""",
        r"""import { DANGER, INK, LINE } from '@/scene/theme';""",
    ),
    (
        r"""const TRACE_LINE_WIDTH = 2.5;
""",
        r"""""",
    ),
    (
        r"""        <meshBasicMaterial color={intruder ? ACCENT : INK} />""",
        r"""        <meshBasicMaterial color={intruder ? DANGER : INK} />""",
    ),
    (
        r"""          <meshBasicMaterial color={ACCENT} />""",
        r"""          <meshBasicMaterial color={DANGER} />""",
    ),
    (
        r"""      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? ACCENT : INK} lineWidth={TRACE_LINE_WIDTH} dashed={end === 'lost'} {...DASH} />""",
        r"""      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? DANGER : INK} lineWidth={LINE.heavy} dashed={end === 'lost'} {...DASH} />""",
    ),
)


edit(
    'src/scene/entities/CLAUDE.md',
    (
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.""",
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`), as wide as the stroke scale says (`LINE`); vermilion (`DANGER`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.""",
    ),
)


edit(
    'src/scene/CLAUDE.md',
    (
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the cards that open beside a piece on an HTML layer (`overlay/`), live traffic (`traffic/`) and the canvas of the `/entidades` page (`catalog/`). `map-canvas.tsx` is the canvas both maps are drawn on; `ink.tsx` holds the paper box with ink edges that every piece is built from and the frame of every icon.""",
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the cards that open beside a piece on an HTML layer (`overlay/`), live traffic (`traffic/`) and the canvas of the `/entidades` page (`catalog/`). `map-canvas.tsx` is the canvas both maps are drawn on; `ink.tsx` holds the paper box with ink edges that every piece is built from and the frame of every icon; `theme.ts` names the colours and line widths the map takes from the design tokens (`@/design`).""",
    ),
    (
        r"""- May import: `@/levels`, `@/copy`, and only types from `@/engine`.""",
        r"""- May import: `@/levels`, `@/copy`, `@/design`, and only types from `@/engine`.""",
    ),
)


edit(
    'src/ui/CLAUDE.md',
    (
        r"""- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.""",
        r"""- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, `@/design`, and only types from `@/engine`.""",
    ),
)


edit(
    'src/CLAUDE.md',
    (
        r"""- Layers, top to bottom: `ui` → `game` · `scene` · `storage` → `levels` → `copy` → `engine`. A layer imports only layers below it, never a peer, and only through their barrel (`@/engine`).""",
        r"""- Layers, top to bottom: `ui` → `game` · `scene` · `storage` → `levels` → `copy` → `engine`. A layer imports only layers below it, never a peer, and only through their barrel (`@/engine`). The design system (`design/`) sits beside them: `ui` and `scene` import it, and it imports no layer; `styles.css` imports its stylesheets first.""",
    ),
)


edit(
    '.claude/rules/folder-structure.md',
    (
        r"""6. Does it draw the 3D map? → `src/scene/`
7. Is it a panel, screen or control? → `src/ui/`
8. Is it only for tests (fixtures, repo helpers)? → `src/testing/`""",
        r"""6. Is it a design token, or an interface element that screens share (a button, a choice, a card, a name tag)? → `src/design/`
7. Does it draw the 3D map? → `src/scene/`
8. Is it a panel, screen or control? → `src/ui/`
9. Is it only for tests (fixtures, repo helpers)? → `src/testing/`""",
    ),
    (
        r"""- Each layer has a barrel (`index.ts`) with named re-exports only (`export { X } from './x'`, `export type { T } from './t'`), never `export *`, exporting exactly what other layers use.""",
        r"""  The design system, `src/design/`, sits beside that line: only `ui` and `scene` import it, and it imports no layer.
- Each layer has a barrel (`index.ts`) with named re-exports only (`export { X } from './x'`, `export type { T } from './t'`), never `export *`, exporting exactly what other layers use.""",
    ),
)


edit(
    '.claude/az-rules.json',
    (
        r"""        "axis by layer: engine, levels, copy, game, storage, scene, ui, testing",
        "import direction: app -> ui -> game, scene, storage -> levels -> copy -> engine; no peers",""",
        r"""        "axis by layer: engine, levels, copy, game, storage, scene, ui, testing, design",
        "import direction: app -> ui -> game, scene, storage -> levels -> copy -> engine; no peers; ui and scene -> design, which imports no layer",""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verificar los tests unitarios**

```bash
pnpm exec vitest run
grep -rn "ACCENT\|lineWidth={[0-9]" src
```

Expected: `Tests 719 passed (719)` en 49 archivos; `grep` sin salida.

- [ ] **Step 6: Ver qué cambia en las capturas y regrabar la de la interfaz**

```bash
pnpm exec playwright test entities
```

Expected: `1 failed` y `3 passed`. Falla la captura de la interfaz (`4451 pixels (ratio 0.01 of all image pixels) are different`). La de «Piezas del mapa» pasa: el mapa, que ahora lee los tokens, se dibuja igual, píxel por píxel. Abrir `test-results/entities-Sin-animaciones-t-e22e5-the-focus-ring-on-an-option/interface-diff.png`: lo rojo es solo el anillo de foco de «Una respuesta posible» y el texto de los dos botones principales. Si hay rojo en otro lado, parar y avisar.

```bash
pnpm exec playwright test entities --update-snapshots=all
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: `4 passed` las tres veces; solo cambia `tests/e2e/snapshots/interface-darwin.png` (`git status --short tests`).

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: estructura sin quejas (`src/design/` tiene su `CLAUDE.md`), `Found 0 clones`, `Tests 719 passed (719)` y 22 tests de Playwright.

- [ ] **Step 8: Commit**

```bash
git add .claude eslint.config.js vite.config.ts scripts src tests
git commit -m "refactor(design): move colours, lines, radii, shadows and focus into design tokens shared by the map"
```

---

### Task 3: Escalas de letra y de espacios, y los pesos que se cargan

Los tamaños de letra pasan a una escala de 8 pasos (`--text-2xs` a `--text-2xl`) y los márgenes, rellenos y separaciones a una escala de 4 px (`--space-2xs` a `--space-3xl`). Cada valor va al paso más cercano; la tabla «Cambios visibles» lista cada cambio. Los pesos quedan en tres (`--weight-regular`, `--weight-bold`, `--weight-display`) y `index.html` deja de pedir Plex Mono 500, que nadie usa; Newsreader 600 sigue sin cargarse (decisión 6). `strong` pasa a 600, el peso que ya se veía. Se va `.mono`, que nadie usaba; `code` se queda con tokens, porque lo usa la línea de la terminal (decisión 19). Las tarjetas del mapa entran a las escalas con lo demás: la terminal acoplada del 01-03 crece 8 px (decisión 24). Las dos capturas cambian: la de la interfaz por las escalas, y la de las piezas por los pesos de las etiquetas (en las fuentes del sistema) y un margen del título de la sección.

**Files:**
- Modify: `src/styles.css` (casi entero), `src/design/tokens.css`, `src/design/CLAUDE.md`, `index.html`, `tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png` (se regraban)

**Interfaces:**
- Consumes: los tokens de la Tarea 2.
- Produces: `--weight-regular` (400), `--weight-bold` (600), `--weight-display` (500); `--text-2xs` (0.6875 rem), `--text-xs` (0.75), `--text-sm` (0.8125), `--text-md` (0.875), `--text-base` (1), `--text-lg` (1.125), `--text-xl` (1.4), `--text-2xl` (2.25); `--tracking-caps` (0.06 em); `--underline-offset` (3 px); `--space-2xs` (0.25 rem), `--space-xs` (0.5), `--space-sm` (0.75), `--space-md` (1), `--space-lg` (1.5), `--space-xl` (2), `--space-2xl` (2.5), `--space-3xl` (3).

- [ ] **Step 1: Comprobar que se parte de la Tarea 2**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 719 passed (719)` en 49 archivos.

- [ ] **Step 2: Implementar**

Contenido completo de `src/styles.css`:

```css
@import './design/tokens.css';
@import './design/primitives.css';

* { box-sizing: border-box; }
body { margin: 0; background: var(--color-page) var(--grain); color: var(--color-ink); font: var(--weight-regular) var(--text-base)/1.5 var(--font-body); }
h1 { font: var(--weight-display) var(--text-2xl)/1.1 var(--font-display); margin: 0 0 var(--space-xs); }
h2 { font: var(--weight-display) var(--text-xl)/1.2 var(--font-display); margin: 0; }
h3 { font: var(--weight-bold) var(--text-xs)/1.2 var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); margin: 0 0 var(--space-xs); }
strong { font-weight: var(--weight-bold); }
a { color: var(--color-ink); text-underline-offset: var(--underline-offset); }
code { font-family: var(--font-mono); font-size: var(--text-md); }
.muted { color: var(--color-ink-soft); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.btn { font: var(--weight-bold) var(--text-base) var(--font-body); background: var(--color-surface); color: var(--color-ink); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius); padding: var(--space-xs) var(--space-md); cursor: pointer; text-decoration: none; display: inline-block; box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--color-emphasis); color: var(--color-on-fill); }
.btn--small { padding: var(--space-2xs) var(--space-xs); font-size: var(--text-sm); box-shadow: none; }
.btn:disabled { color: var(--color-ink-soft); background: var(--color-shade); border-color: var(--color-ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }

.page { max-width: 880px; margin: 0 auto; padding: var(--space-2xl) var(--space-lg); }
.lede { color: var(--color-ink-soft); font-size: var(--text-lg); }
.chapters { list-style: none; padding: 0; display: grid; gap: var(--space-md); }
.chapter { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: var(--space-md); box-shadow: var(--shadow-md); }
.chapter--soon { opacity: 0.5; box-shadow: none; border-style: dashed; }
.chapter__head { display: flex; align-items: baseline; gap: var(--space-sm); }
.chapter__num { font: var(--weight-display) var(--text-xl) var(--font-display); color: var(--color-emphasis); min-width: 1.6rem; }
.chapter__meta { margin-left: auto; font-size: var(--text-md); color: var(--color-ink-soft); }
.levels { list-style: none; padding: var(--space-xs) 0 0 var(--space-2xl); margin: 0; display: grid; gap: var(--space-2xs); }
.level-item { display: flex; gap: var(--space-sm); align-items: baseline; }
.level-item .role { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.stars-inline { margin-left: auto; color: var(--color-emphasis); }
.locked { color: var(--color-ink-soft); }

.html-layer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }

.map-button { pointer-events: auto; font: var(--weight-regular) var(--text-sm) var(--font-body); color: var(--color-ink); background: var(--color-surface); border: var(--stroke-thin) solid var(--color-ink); padding: 1px 6px; white-space: nowrap; cursor: pointer; }
.map-button--name { border-color: var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); }
.map-button--name .name-tag { border: 0; padding: 0; background: none; font-size: var(--text-xs); }
.map-button--locked { border-style: dashed; color: var(--color-ink-soft); }
.map-button__alert { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: var(--radius-round); font: var(--weight-bold) var(--text-2xs) var(--font-body); color: var(--color-on-fill); background: var(--color-danger); vertical-align: 1px; }
.map-button__lock .entity-icon { margin-right: 0; }
.map-card { pointer-events: auto; width: var(--card-width); }
.map-card--right { transform: translate(var(--card-gap), -50%); }
.map-card--left { transform: translate(calc(-100% - var(--card-gap)), -50%); }
.map-card--dock { transform: translate(var(--card-x), calc(var(--card-y) - 100%)); }
.stamp { pointer-events: auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; font: var(--weight-bold) var(--text-lg) var(--font-display); background: var(--color-surface); border: var(--stroke-heavy) solid currentColor; border-radius: var(--radius-round); transform: rotate(-8deg); }
.stamp--arrived { color: var(--color-ink); }
.stamp--blocked { color: var(--color-danger); }

@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}

.card { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: var(--space-md); box-shadow: var(--shadow-md); }
.term { font-weight: var(--weight-bold); }
.term--tip { text-decoration: underline dotted; text-underline-offset: var(--underline-offset); cursor: help; }
.name-tag { font-family: var(--font-mono); font-weight: var(--weight-regular); font-size: 0.82em; line-height: 1.35; border: var(--stroke-thin) solid var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); padding: 0 0.35em; white-space: nowrap; }
.term-tip { z-index: 100; width: max-content; max-width: min(18rem, calc(100vw - 16px)); padding: var(--space-xs); font: var(--weight-regular) var(--text-md)/1.4 var(--font-body); color: var(--color-on-fill); background: var(--color-ink); border-radius: var(--radius); box-shadow: var(--shadow-tip); pointer-events: none; text-align: left; text-transform: none; letter-spacing: normal; }
.term__new { margin-left: var(--space-2xs); font: var(--weight-bold) var(--text-2xs) var(--font-body); color: var(--color-emphasis); text-transform: uppercase; letter-spacing: var(--tracking-caps); vertical-align: super; }
.lucia__alert { margin: var(--space-xs) 0; color: var(--color-danger); font-weight: var(--weight-bold); }
.lucia__reply { margin: var(--space-xs) 0 var(--space-sm); }
.lucia__reply p { margin: var(--space-xs) 0; padding: var(--space-xs); border: var(--stroke-regular) dashed var(--color-danger); }
.tasks { list-style: none; padding: 0; margin: 0 0 var(--space-sm); display: grid; gap: var(--space-xs); }
.glossary { margin: 0 0 var(--space-sm); }
.glossary dt { font-weight: var(--weight-bold); }
.entity-icon { width: 1.2em; height: 1.2em; margin-right: 0.35em; vertical-align: -0.22em; }
.glossary dd { margin: 0 0 var(--space-xs); color: var(--color-ink-soft); }
.lucia__glossary { margin: 0 0 var(--space-sm); }
.lucia__glossary summary { cursor: pointer; font: var(--weight-bold) var(--text-xs)/1.2 var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); }
.lucia__glossary[open] summary { margin-bottom: var(--space-xs); }
.hint { margin: var(--space-xs) 0; }

.chip-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-xs); }
.rules { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-2xs); }
.rules li { display: flex; align-items: center; justify-content: space-between; gap: var(--space-xs); }
.rules__text { min-width: 0; }
.slot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); min-height: 2.2rem; padding: var(--space-2xs) var(--space-xs); border: var(--stroke-regular) dashed var(--color-ink-soft); }
.slot__empty { color: var(--color-ink-soft); font-size: var(--text-md); }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); }
.tray__name { width: 100%; font: var(--weight-bold) var(--text-xs) var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.chip { font: var(--weight-bold) var(--text-md) var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius-pill); padding: var(--space-2xs) var(--space-sm); cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--color-ink); color: var(--color-on-fill); }
.chip[aria-pressed='true'] .name-tag { background: transparent; border-color: currentColor; }
.stamp--intruder { color: var(--color-danger); border-style: double; border-width: var(--stroke-double); }
.stamp--lost { color: var(--color-ink-soft); border-style: dashed; }
button.stamp { cursor: help; }

.incident { display: grid; grid-template-columns: minmax(0, 1fr) 380px; height: 100vh; }
.incident__map { position: relative; min-height: 0; }
.incident__bar { position: absolute; inset: 0 0 auto 0; z-index: 40; display: flex; align-items: baseline; gap: var(--space-md); padding: var(--space-sm) var(--space-md); pointer-events: none; }
.incident__bar > * { pointer-events: auto; }
.incident__bar h1 { font-size: var(--text-xl); margin: 0; }
.incident__motion { margin-left: auto; font-size: var(--text-md); }
.incident__side { display: grid; align-content: start; gap: var(--space-md); padding: var(--space-md); overflow-y: auto; background: var(--color-page); border-left: var(--stroke-regular) solid var(--color-ink); }
.incident__inspection { position: absolute; right: var(--space-md); bottom: var(--space-md); z-index: 35; display: flex; flex-direction: column; width: 22rem; max-width: calc(100% - 2 * var(--space-md)); max-height: 45%; pointer-events: none; }
.incident__inspection .inspection { min-height: 0; overflow-y: auto; }
.incident__inspection > p { margin: 0; }
.inspection dl { margin: 0; }
.inspection dt { margin-top: var(--space-xs); font: var(--weight-bold) var(--text-xs) var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.inspection dd { margin: 0; }
.options { list-style: none; padding: 0; display: grid; gap: var(--space-xs); }
.option { width: 100%; text-align: left; font: var(--weight-regular) var(--text-base)/1.4 var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); padding: var(--space-xs) var(--space-sm); cursor: pointer; }
.option[aria-pressed='true'] { background: var(--color-shade); }
.option:disabled { cursor: default; }
.feedback { margin: var(--space-2xs) 0 0; font-size: var(--text-md); }
.feedback--wrong { color: var(--color-danger); }
.result__list { list-style: none; padding: 0; }
.result__nav { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
@media (max-width: 900px) {
  .incident { grid-template-columns: 1fr; grid-template-rows: 65vh auto; height: auto; }
  .incident__side { border-left: none; border-top: var(--stroke-regular) solid var(--color-ink); }
}

.catalog { padding: var(--space-xl) var(--space-lg) var(--space-3xl); }
.catalog__head { max-width: 880px; display: grid; gap: var(--space-xs); margin-bottom: var(--space-lg); }
.catalog__head .lede { margin: 0; }
.catalog__motion { font-size: var(--text-md); }
.catalog__section { margin-bottom: var(--space-xl); }
.catalog__section h2 { margin-bottom: var(--space-sm); }
.catalog__canvas { position: relative; border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); }
.catalog__caption { margin: 0; font: var(--weight-regular) var(--text-xs) var(--font-body); color: var(--color-ink-soft); white-space: nowrap; }
.catalog__icons { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: var(--space-xs) var(--space-md); }
.catalog__icons li { display: flex; align-items: center; }
.catalog__family { margin-bottom: var(--space-lg); }
.catalog__specimens { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--space-md) var(--space-lg); }
.catalog__specimen { margin: 0; display: grid; justify-items: start; gap: var(--space-xs); }
.catalog__specimen--wide { width: 20rem; justify-items: stretch; }
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/design/tokens.css',
    (
        r"""  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
""",
        r"""  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --weight-regular: 400;
  --weight-bold: 600;
  --weight-display: 500;

  --text-2xs: 0.6875rem;
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-md: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.4rem;
  --text-2xl: 2.25rem;
  --tracking-caps: 0.06em;
  --underline-offset: 3px;

  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 2.5rem;
  --space-3xl: 3rem;
""",
    ),
)


edit(
    'index.html',
    (
        r'''      href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap"''',
        r'''      href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap"''',
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""The game's design system: every colour, font, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), and the styles every screen shares (`primitives.css`, which holds the one focus ring).

- `tokens.css` has two layers of colour: the palette (`--palette-*`, raw colours named after what they are) and the roles (`--color-*`, named after what they are for). Styles and the map use roles, never the palette. The other tokens (`--font-*`, `--stroke-*`, `--radius*`, `--shadow-*`, `--focus-*`) have one layer.""",
        r"""The game's design system: every colour, font, size, space, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), and the styles every screen shares (`primitives.css`, which holds the one focus ring).

- `tokens.css` has two layers of colour: the palette (`--palette-*`, raw colours named after what they are) and the roles (`--color-*`, named after what they are for). Styles and the map use roles, never the palette. The other tokens are scales with one layer: fonts and their three weights (`--font-*`, `--weight-*`), sizes of text (`--text-2xs` to `--text-2xl`), spaces on a 4 px grid (`--space-2xs` to `--space-3xl`), lines (`--stroke-*`), radii, shadows and the focus ring. Every size, space and line comes from a scale; a one-off measure that belongs to a single rule (a panel width, the size of a stamp) stays in that rule. The width and the gap of a card on the map are not tokens either: `src/scene/layout.ts` needs them to place the card, and the anchor hands them to `.map-card` as CSS variables (`--card-width`, `--card-gap`, `--card-x`, `--card-y`).
- The weights are the ones `index.html` loads: Plex Sans 400 and 600, Newsreader 500, Plex Mono 400. Newsreader 600 is not loaded: a stamp and a term inside a title ask for 600 and get the browser's bold drawn from 500.""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verificar los tests unitarios**

```bash
pnpm exec vitest run
```

Expected: `Tests 719 passed (719)` en 49 archivos.

- [ ] **Step 4: Ver qué cambia en las capturas y regrabarlas**

```bash
pnpm exec playwright test entities
```

Expected: `2 failed` y `2 passed`. La captura de las piezas cambia de alto (`Expected an image 1232px by 1961px, received 1232px by 1960px`): el título de la sección sube 0.8 px, y con él el lienzo y la textura del papel, así que casi toda la imagen se marca distinta; además, en las fuentes del sistema, las etiquetas del mapa pasan a 400 y el «!» a 600. La de la interfaz crece (`Expected an image 1232px by 1049px, received 1232px by 1076px`) por los tamaños y los espacios nuevos; la opción cerrada pasa a dos líneas. Comparar las dos `*-diff.png` de `test-results/` con la tabla «Cambios visibles», filas de la Tarea 3.

```bash
pnpm exec playwright test entities --update-snapshots=all
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: `4 passed` las tres veces; cambian `entities-darwin.png` e `interface-darwin.png`.

- [ ] **Step 5: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones`, `Tests 719 passed (719)` y 22 tests de Playwright. Las pruebas de etiquetas encimadas del 04-01 y las de la terminal del 01-01 y del 01-03 siguen pasando: el mapa no cambia de tamaños, y las tarjetas, más altas, siguen sin tapar lo que esas pruebas miran.

- [ ] **Step 6: Commit**

```bash
git add index.html src tests
git commit -m "feat(design): add a type scale, a 4 px spacing scale and three font weights, and load only those weights"
```

---

### Task 4: `Button`, el único botón y enlace

`Button` dibuja cada acción y cada enlace: un `<button type="button">` o, con `href`, un `<a>`. Su aspecto sale solo de su variante (`primary`, `secondary`, `small`, `text`) y no acepta `className`. Todos los botones y enlaces de `src/ui/` migran, también los enlaces sueltos (variante `text`) y los de las tarjetas del mapa del plan 3: «×», «Listo» y «Enviar», que sigue `secondary` y deshabilitado hasta que la línea está completa (decisiones 20 y 21). Los estilos de `.btn`, también `.btn:disabled`, pasan a `primitives.css`, con `.link` para la variante de texto, y se va la regla global de `a`. No se mueve ningún píxel.

**Files:**
- Create: `src/design/button.tsx`
- Modify: `src/design/primitives.css` (entero), `src/design/index.ts`, `src/styles.css`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/map-cards/{task-card,chip-card,terminal-card}.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/incident/result-card.tsx`, `src/ui/notice-page.tsx`, `src/ui/incident/incident-screen.tsx`, `src/ui/roadmap.tsx`, `src/ui/catalog/interface-section.tsx`, `src/design/CLAUDE.md`, `src/ui/CLAUDE.md`, `src/ui/incident/map-cards/CLAUDE.md`, `src/ui/incident/CLAUDE.md`, `src/ui/catalog/CLAUDE.md`
- Test: `src/design/button.test.tsx`

**Interfaces:**
- Consumes: `primitives.css` y los tokens de las Tareas 2 y 3.
- Produces: `Button` por `@/design`, con `ButtonProps = (ActionProps | LinkProps) & { variant?: 'primary' | 'secondary' | 'small' | 'text'; children: ReactNode }`. `ActionProps` son las props de `<button>` sin `className` ni `type`; `LinkProps`, las de `<a>` sin `className` y con `href`. `ref` llega al elemento (React 19). `disabled` es una prop de `<button>`, no una variante (decisión 21).

**Usos que migra (hoy, en `c17d9cd`):**
- `src/ui/incident/lucia-card.tsx`: «Enviar solución» (`primary`) y «¿Alguna pista?» (`small`).
- `src/ui/incident/map-cards/task-card.tsx`: «×», quitar una regla (`small`, con `aria-label`).
- `src/ui/incident/map-cards/chip-card.tsx`: «Listo» de `ChipCard`, en la tarjeta de tarea y en la terminal (`secondary`).
- `src/ui/incident/map-cards/terminal-card.tsx`: «Enviar» (`secondary`, con `disabled` mientras falte una ficha; decisiones 20 y 21).
- `src/ui/incident/explanation-card.tsx`: «Ver resultado» (`primary`, con `ref` para el foco).
- `src/ui/incident/result-card.tsx`: «Siguiente incidente» (`primary`, enlace) y «Volver al roadmap» (`secondary`, enlace).
- `src/ui/incident/incident-screen.tsx`: «← Roadmap» (`text`, enlace).
- `src/ui/notice-page.tsx`: «Volver al roadmap» (`text`, enlace).
- `src/ui/roadmap.tsx`: cada incidente abierto (`text`, enlace).
- `src/ui/catalog/interface-section.tsx`: los siete especímenes de «Botones» (también «deshabilitado») y «Enviar» y «Listo» de la tarjeta terminal.
- Estilos: `.btn`, `.btn--primary`, `.btn--small`, `.btn:active`, `.btn:disabled`, `.btn:disabled:active` y la regla global de `a` (ahora `.link`), de `src/styles.css` a `src/design/primitives.css`.
- Guías: `src/design/CLAUDE.md` y `src/ui/CLAUDE.md` dicen el estándar; las de `src/ui/incident/`, `src/ui/incident/map-cards/` y `src/ui/catalog/` suman `@/design` a lo que pueden importar.
- No migran, a propósito: la etiqueta del mapa (`PieceLabel`, decisión 12), el sello (una entidad) y la casilla «Sin animaciones» (un `input`).

- [ ] **Step 1: Comprobar que se parte de la Tarea 3**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 719 passed (719)` en 49 archivos.

- [ ] **Step 2: Escribir el test**

Contenido completo de `src/design/button.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('is a button that does not submit a form, with the secondary look unless it says otherwise', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Listo</Button>);
    const button = screen.getByRole('button', { name: 'Listo' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('btn', { exact: true });
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is a link once it has an href, with the look of its variant', () => {
    render(
      <>
        <Button variant="primary" href="#/level/04-02">
          Siguiente
        </Button>
        <Button variant="text" href="#/">
          Volver
        </Button>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveClass('btn btn--primary', { exact: true });
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveClass('link', { exact: true });
  });
});
```

- [ ] **Step 3: Verlo fallar**

```bash
pnpm exec vitest run src/design
```

Expected: `Test Files 1 failed | 1 passed (2)` y `Tests 3 passed (3)`: `button.test.tsx` no carga (`Failed to resolve import "./button"`).

- [ ] **Step 4: Implementar**

Contenido completo de `src/design/button.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'small' | 'text';

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn btn--primary',
  secondary: 'btn',
  small: 'btn btn--small',
  text: 'link',
};

type ActionProps = Omit<ComponentProps<'button'>, 'className' | 'type'> & { href?: undefined };
type LinkProps = Omit<ComponentProps<'a'>, 'className'> & { href: string };

export type ButtonProps = (ActionProps | LinkProps) & { variant?: ButtonVariant; children: ReactNode };

/** The one button of the game: a button that does not submit, or a link when it has an href. Its look comes only from its variant: primary for the main action of a screen, secondary, small, or text for navigation that reads as a link. */
export function Button({ variant = 'secondary', ...props }: ButtonProps) {
  const className = BUTTON_CLASS[variant];
  if (props.href === undefined) return <button type="button" className={className} {...(props as ActionProps)} />;
  return <a className={className} {...(props as LinkProps)} />;
}
```

Contenido completo de `src/design/primitives.css`:

```css
:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }

.btn { font: var(--weight-bold) var(--text-base) var(--font-body); background: var(--color-surface); color: var(--color-ink); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius); padding: var(--space-xs) var(--space-md); cursor: pointer; text-decoration: none; display: inline-block; box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--color-emphasis); color: var(--color-on-fill); }
.btn--small { padding: var(--space-2xs) var(--space-xs); font-size: var(--text-sm); box-shadow: none; }
.btn:disabled { color: var(--color-ink-soft); background: var(--color-shade); border-color: var(--color-ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }
.link { font: inherit; color: var(--color-ink); background: none; border: 0; padding: 0; text-decoration: underline; text-underline-offset: var(--underline-offset); cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/design/index.ts',
    (
        r"""export { token, tokenPx } from './tokens';""",
        r"""export { Button } from './button';
export { token, tokenPx } from './tokens';""",
    ),
)


edit(
    'src/styles.css',
    (
        r"""a { color: var(--color-ink); text-underline-offset: var(--underline-offset); }
""",
        r"""""",
    ),
    (
        r"""
.btn { font: var(--weight-bold) var(--text-base) var(--font-body); background: var(--color-surface); color: var(--color-ink); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius); padding: var(--space-xs) var(--space-md); cursor: pointer; text-decoration: none; display: inline-block; box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--color-emphasis); color: var(--color-on-fill); }
.btn--small { padding: var(--space-2xs) var(--space-xs); font-size: var(--text-sm); box-shadow: none; }
.btn:disabled { color: var(--color-ink-soft); background: var(--color-shade); border-color: var(--color-ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }
""",
        r"""""",
    ),
    (
        r"""
@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}
""",
        r"""""",
    ),
)


edit(
    'src/ui/incident/lucia-card.tsx',
    (
        r"""import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';""",
        r"""import { Button } from '@/design';
import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';""",
    ),
    (
        r"""        <button type="button" className="btn btn--primary" onClick={onSubmit}>
          {LUCIA_TEXT.submit}
        </button>""",
        r"""        <Button variant="primary" onClick={onSubmit}>
          {LUCIA_TEXT.submit}
        </Button>""",
    ),
    (
        r"""        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>""",
        r"""        <Button variant="small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </Button>""",
    ),
)


edit(
    'src/ui/incident/map-cards/task-card.tsx',
    (
        r"""import { rowText, type FirewallCard } from '@/game';""",
        r"""import { Button } from '@/design';
import { rowText, type FirewallCard } from '@/game';""",
    ),
    (
        r"""              <button type="button" className="btn btn--small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => remove(row.id)}>
                ×
              </button>""",
        r"""              <Button variant="small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => remove(row.id)}>
                ×
              </Button>""",
    ),
)


edit(
    'src/ui/incident/map-cards/chip-card.tsx',
    (
        r"""import { TaggedText } from '@/ui/tagged-text';""",
        r"""import { Button } from '@/design';
import { TaggedText } from '@/ui/tagged-text';""",
    ),
    (
        r"""      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>""",
        r"""      <Button onClick={onClose}>{TASK_CARD_TEXT.done}</Button>""",
    ),
)


edit(
    'src/ui/incident/map-cards/terminal-card.tsx',
    (
        r"""import type { SendPicks, SendTrayName, TerminalCard as Terminal } from '@/game';""",
        r"""import { Button } from '@/design';
import type { SendPicks, SendTrayName, TerminalCard as Terminal } from '@/game';""",
    ),
    (
        r"""      <button type="button" className="btn" disabled={!line} onClick={send}>
        {TERMINAL_TEXT.send}
      </button>""",
        r"""      <Button disabled={!line} onClick={send}>
        {TERMINAL_TEXT.send}
      </Button>""",
    ),
)


edit(
    'src/ui/incident/explanation-card.tsx',
    (
        r"""import type { ExplanationOption } from '@/levels';""",
        r"""import { Button } from '@/design';
import type { ExplanationOption } from '@/levels';""",
    ),
    (
        r"""    <button ref={button} type="button" className="btn btn--primary" onClick={onContinue}>
      {EXPLANATION_TEXT.seeResult}
    </button>""",
        r"""    <Button ref={button} variant="primary" onClick={onContinue}>
      {EXPLANATION_TEXT.seeResult}
    </Button>""",
    ),
)


edit(
    'src/ui/incident/result-card.tsx',
    (
        r"""import { countStars, type Stars as EarnedStars } from '@/game';""",
        r"""import { Button } from '@/design';
import { countStars, type Stars as EarnedStars } from '@/game';""",
    ),
    (
        r"""          <a className="btn btn--primary" href={`#/level/${nextId}`}>
            {RESULT_TEXT.next}
          </a>
        )}
        <a className="btn" href="#/">
          {RESULT_TEXT.back}
        </a>""",
        r"""          <Button variant="primary" href={`#/level/${nextId}`}>
            {RESULT_TEXT.next}
          </Button>
        )}
        <Button href="#/">{RESULT_TEXT.back}</Button>""",
    ),
)


edit(
    'src/ui/notice-page.tsx',
    (
        r"""import { NOTICE_TEXT } from '@/copy';
""",
        r"""import { NOTICE_TEXT } from '@/copy';
import { Button } from '@/design';
""",
    ),
    (
        r"""      <a href="#/">{NOTICE_TEXT.back}</a>""",
        r"""      <Button variant="text" href="#/">
        {NOTICE_TEXT.back}
      </Button>""",
    ),
)


edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf, terminalCard, terminalLine } from '@/game';""",
        r"""import { Button } from '@/design';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf, terminalCard, terminalLine } from '@/game';""",
    ),
    (
        r"""          <a href="#/">{SCREEN_TEXT.back}</a>""",
        r"""          <Button variant="text" href="#/">
            {SCREEN_TEXT.back}
          </Button>""",
    ),
)


edit(
    'src/ui/roadmap.tsx',
    (
        r"""import { CHAPTERS, type LevelEntry } from '@/levels';""",
        r"""import { Button } from '@/design';
import { CHAPTERS, type LevelEntry } from '@/levels';""",
    ),
    (
        r"""                          <a href={`#/level/${level.id}`}>{label}</a>""",
        r"""                          <Button variant="text" href={`#/level/${level.id}`}>
                            {label}
                          </Button>""",
    ),
)


edit(
    'src/ui/catalog/interface-section.tsx',
    (
        r"""import { Stars } from '@/ui/stars';""",
        r"""import { Button } from '@/design';
import { Stars } from '@/ui/stars';""",
    ),
    (
        r"""          <button type="button" className="btn btn--primary">
            {LUCIA_TEXT.submit}
          </button>""",
        r"""          <Button variant="primary">{LUCIA_TEXT.submit}</Button>""",
    ),
    (
        r"""          <button type="button" className="btn">
            {TASK_CARD_TEXT.done}
          </button>""",
        r"""          <Button>{TASK_CARD_TEXT.done}</Button>""",
    ),
    (
        r"""          <button type="button" className="btn btn--small">
            {LUCIA_TEXT.askHint}
          </button>""",
        r"""          <Button variant="small">{LUCIA_TEXT.askHint}</Button>""",
    ),
    (
        r"""          <button type="button" className="btn" disabled>
            {TERMINAL_TEXT.send}
          </button>""",
        r"""          <Button disabled>{TERMINAL_TEXT.send}</Button>""",
    ),
    (
        r"""          <a className="btn btn--primary" href="#/">
            {RESULT_TEXT.next}
          </a>""",
        r"""          <Button variant="primary" href="#/">
            {RESULT_TEXT.next}
          </Button>""",
    ),
    (
        r"""          <a className="btn" href="#/">
            {RESULT_TEXT.back}
          </a>""",
        r"""          <Button href="#/">{RESULT_TEXT.back}</Button>""",
    ),
    (
        r"""          <a href="#/">{SCREEN_TEXT.back}</a>""",
        r"""          <Button variant="text" href="#/">
            {SCREEN_TEXT.back}
          </Button>""",
    ),
    (
        r"""            <button type="button" className="btn">
              {TERMINAL_TEXT.send}
            </button>
            <button type="button" className="btn">
              {TASK_CARD_TEXT.done}
            </button>""",
        r"""            <Button>{TERMINAL_TEXT.send}</Button>
            <Button>{TASK_CARD_TEXT.done}</Button>""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""The game's design system: every colour, font, size, space, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), and the styles every screen shares (`primitives.css`, which holds the one focus ring).""",
        r"""The game's design system: every colour, font, size, space, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), the interface primitives, one file each, and their styles with the one focus ring (`primitives.css`).""",
    ),
    (
        r"""- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
        r"""- `Button` (`button.tsx`) is every action and every link: a `<button type="button">`, or an `<a>` when it has an `href`. Its variant is its look: `primary` (the main action of a screen), `secondary`, `small` and `text` (navigation that reads as a link); `disabled` greys it out and drops its shadow. A primitive takes no `className`: a new look is a new variant here, never a class at the call site.
- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
    ),
)


edit(
    'src/ui/CLAUDE.md',
    (
        r"""- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.""",
        r"""- Every button and link is a `Button` of `@/design`; this folder writes no `<button>` or `<a>` of its own.
- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.""",
    ),
)


edit(
    'src/ui/incident/map-cards/CLAUDE.md',
    (
        r"""- Both use the same classes: `card chip-card`, `tray`, `chip`, `slot` and `btn`. A new card reuses them before adding any.
- Not here: the screen that opens a card (`src/ui/incident/incident-screen.tsx`), the anchor that keeps it beside its piece (`src/scene/overlay/`).
- May import: `@/game`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`, `@/ui/incident/use-focus-on-mount`), and only types from `@/engine`.""",
        r"""- Both use the same classes, `card chip-card`, `tray`, `chip` and `slot`, and the `Button` of `@/design` («×», «Listo» and «Enviar», which stays disabled until the line is complete). A new card reuses them before adding any.
- Not here: the screen that opens a card (`src/ui/incident/incident-screen.tsx`), the anchor that keeps it beside its piece (`src/scene/overlay/`).
- May import: `@/game`, `@/levels`, `@/copy`, `@/design`, other files of `src/ui/` (`@/ui/<file>`, `@/ui/incident/use-focus-on-mount`), and only types from `@/engine`.""",
    ),
)


edit(
    'src/ui/incident/CLAUDE.md',
    (
        r"""- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.""",
        r"""- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, `@/design`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.""",
    ),
)


edit(
    'src/ui/catalog/CLAUDE.md',
    (
        r"""- May import: `@/scene`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.""",
        r"""- May import: `@/scene`, `@/copy`, `@/design`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verificar los tests unitarios y que no queda un botón suelto en la interfaz**

```bash
pnpm exec vitest run
grep -rn "<a \|className=\"btn\|className=\"link" src/ui --include='*.tsx' --exclude='*.test.tsx'
```

Expected: `Tests 721 passed (721)` en 50 archivos; `grep` sin salida.

- [ ] **Step 6: Comprobar que no se mueve ningún píxel**

```bash
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: `4 passed` las dos veces, sin regrabar nada.

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones`, `Tests 721 passed (721)` y 22 tests de Playwright.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(design): add Button, the one button and link of the game, and use it on every screen"
```

---

### Task 5: `Choice` y `ChipTray`: una ficha, una opción y una bandeja

`Choice` dibuja cada elección: una ficha (`chip`) o una opción (`option`). Con `pressed` es un interruptor (`aria-pressed`); sin `pressed`, una acción con forma de ficha, como la ficha del hueco que vuelve a su bandeja. `ChipTray` sale de `src/ui/incident/map-cards/chip-card.tsx`, donde la dejó el plan 3, a `src/design/choice.tsx`: una bandeja con nombre, donde se elige a lo sumo una ficha. En `chip-card.tsx` queda `trayChips`, que convierte las fichas de una tarjeta (texto con términos) en fichas de bandeja (decisión 22). La tarjeta de tarea, la terminal, la explicación y el catálogo migran, y el arreglo de la ficha elegida con un nombre pasa con la ficha a `primitives.css`. No se mueve ningún píxel.

**Files:**
- Create: `src/design/choice.tsx`
- Modify: `src/design/index.ts`, `src/design/primitives.css`, `src/styles.css`, `src/ui/incident/map-cards/{chip-card,task-card,terminal-card}.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/catalog/interface-section.tsx`, `src/design/CLAUDE.md`, `src/ui/incident/map-cards/CLAUDE.md`
- Test: `src/design/choice.test.tsx`

**Interfaces:**
- Consumes: `primitives.css` de la Tarea 4.
- Produces, por `@/design`:
  - `Choice({ variant?: 'chip' | 'option', pressed?: boolean, children, ...props de <button> sin className, type ni aria-pressed })`.
  - `ChipTray({ name: string; chips: TrayChip[]; picked: string | null; onPick: (chipId: string) => void })` y `type TrayChip = { id: string; label: ReactNode }`. Quien la usa convierte su texto en nodo.
- Produces, en `src/ui/incident/map-cards/chip-card.tsx`: `trayChips(chips: { id: string; label: TermText }[]): TrayChip[]`, que pasa cada etiqueta por `TaggedText`; lo usan la tarjeta de tarea y la terminal.

**Usos que migra (hoy, en `c17d9cd`):**
- `src/ui/incident/map-cards/chip-card.tsx`: el `ChipTray` que compartían las dos tarjetas se va; queda `trayChips`.
- `src/ui/incident/map-cards/task-card.tsx`: las dos bandejas, «Type» y «Source» (`ChipTray` de `@/design`), y la ficha del hueco que vuelve a su bandeja (`SlotChip`: `Choice` sin `pressed`).
- `src/ui/incident/map-cards/terminal-card.tsx`: las bandejas «Origen», «Destino» y «Mensaje» (`ChipTray` de `@/design`).
- `src/ui/incident/explanation-card.tsx`: cada opción de «¿Qué pasó?» (`Choice variant="option"`).
- `src/ui/catalog/interface-section.tsx`: ficha, ficha elegida, ficha elegida con nombre, bandeja, hueco con ficha, las tres opciones y la bandeja de la tarjeta terminal.
- Estilos: `.chip`, `.chip[aria-pressed='true']`, `.chip[aria-pressed='true'] .name-tag` (el arreglo de `c17d9cd`), `.option`, `.option[aria-pressed='true']`, `.option:disabled`, `.tray` y `.tray__name`, de `src/styles.css` a `src/design/primitives.css`. El hueco (`.slot`, `.slot__empty`) sigue en `src/styles.css`: es parte de las tarjetas del mapa (el de la tarjeta de tarea y la línea de la terminal).

- [ ] **Step 1: Comprobar que se parte de la Tarea 4**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 721 passed (721)` en 50 archivos.

- [ ] **Step 2: Escribir el test**

Contenido completo de `src/design/choice.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChipTray, Choice } from './choice';

describe('Choice', () => {
  it('is a toggle when it says whether it is pressed, and a plain action when it does not', () => {
    render(
      <>
        <Choice pressed>Echo Request</Choice>
        <Choice variant="option" pressed={false}>
          Una respuesta
        </Choice>
        <Choice>Devolver</Choice>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Echo Request' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Una respuesta' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Una respuesta' })).toHaveClass('option', { exact: true });
    expect(screen.getByRole('button', { name: 'Devolver' })).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: 'Devolver' })).toHaveClass('chip', { exact: true });
  });

  it('in a tray, names the group, presses only the picked chip and reports the chip the player picks', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<ChipTray name="Type" chips={[{ id: 'request', label: 'Echo Request' }, { id: 'reply', label: 'Echo Reply' }]} picked="request" onPick={onPick} />);
    const tray = within(screen.getByRole('group', { name: 'Type' }));
    expect(tray.getAllByRole('button', { pressed: true }).map((chip) => chip.textContent)).toEqual(['Echo Request']);
    await user.click(tray.getByRole('button', { name: 'Echo Reply' }));
    expect(onPick).toHaveBeenCalledWith('reply');
  });
});
```

- [ ] **Step 3: Verlo fallar**

```bash
pnpm exec vitest run src/design
```

Expected: `Test Files 1 failed | 2 passed (3)` y `Tests 5 passed (5)`: `choice.test.tsx` no carga (`Failed to resolve import "./choice"`).

- [ ] **Step 4: Implementar**

Contenido completo de `src/design/choice.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

export type ChoiceVariant = 'chip' | 'option';

export interface TrayChip {
  id: string;
  label: ReactNode;
}

type ChoiceProps = Omit<ComponentProps<'button'>, 'className' | 'type' | 'aria-pressed'> & {
  variant?: ChoiceVariant;
  pressed?: boolean;
  children: ReactNode;
};

/** The one choice of the game: a chip (a short value, in a tray or a slot) or an option (a whole sentence, one per line). With pressed it is a toggle the screen reader hears as pressed or not; without it, a plain action drawn as a choice, such as a chip given back to its tray. */
export function Choice({ variant = 'chip', pressed, ...props }: ChoiceProps) {
  return <button type="button" className={variant} aria-pressed={pressed} {...props} />;
}

/** A named tray of chips where at most one is picked: the name shows above the chips and names the group for screen readers, and picking a chip reports its id. */
export function ChipTray({ name, chips, picked, onPick }: { name: string; chips: TrayChip[]; picked: string | null; onPick: (chipId: string) => void }) {
  return (
    <div role="group" aria-label={name} className="tray">
      <span className="tray__name" aria-hidden="true">
        {name}
      </span>
      {chips.map((chip) => (
        <Choice key={chip.id} pressed={picked === chip.id} onClick={() => onPick(chip.id)}>
          {chip.label}
        </Choice>
      ))}
    </div>
  );
}
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/design/index.ts',
    (
        r"""export { token, tokenPx } from './tokens';""",
        r"""export { ChipTray, Choice } from './choice';
export type { TrayChip } from './choice';
export { token, tokenPx } from './tokens';""",
    ),
)


edit(
    'src/design/primitives.css',
    (
        r""".link { font: inherit; color: var(--color-ink); background: none; border: 0; padding: 0; text-decoration: underline; text-underline-offset: var(--underline-offset); cursor: pointer; }""",
        r""".chip { font: var(--weight-bold) var(--text-md) var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius-pill); padding: var(--space-2xs) var(--space-sm); cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--color-ink); color: var(--color-on-fill); }
.chip[aria-pressed='true'] .name-tag { background: transparent; border-color: currentColor; }
.option { width: 100%; text-align: left; font: var(--weight-regular) var(--text-base)/1.4 var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); padding: var(--space-xs) var(--space-sm); cursor: pointer; }
.option[aria-pressed='true'] { background: var(--color-shade); }
.option:disabled { cursor: default; }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); }
.tray__name { width: 100%; font: var(--weight-bold) var(--text-xs) var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.link { font: inherit; color: var(--color-ink); background: none; border: 0; padding: 0; text-decoration: underline; text-underline-offset: var(--underline-offset); cursor: pointer; }""",
    ),
)


edit(
    'src/styles.css',
    (
        r""".tray { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); }
.tray__name { width: 100%; font: var(--weight-bold) var(--text-xs) var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.chip { font: var(--weight-bold) var(--text-md) var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius-pill); padding: var(--space-2xs) var(--space-sm); cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--color-ink); color: var(--color-on-fill); }
.chip[aria-pressed='true'] .name-tag { background: transparent; border-color: currentColor; }
""",
        r"""""",
    ),
    (
        r""".option { width: 100%; text-align: left; font: var(--weight-regular) var(--text-base)/1.4 var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); padding: var(--space-xs) var(--space-sm); cursor: pointer; }
.option[aria-pressed='true'] { background: var(--color-shade); }
.option:disabled { cursor: default; }
""",
        r"""""",
    ),
)


edit(
    'src/ui/incident/map-cards/chip-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, type TrayChip } from '@/design';""",
    ),
    (
        r"""}

interface ChipTrayProps {
  name: string;
  chips: { id: string; label: TermText }[];
  picked: string | null;
  onPick: (chipId: string) => void;
""",
        r"""""",
    ),
    (
        r"""/** A named tray of chips, the picked one pressed; a click or Enter picks a chip. */
export function ChipTray({ name, chips, picked, onPick }: ChipTrayProps) {
  return (
    <div role="group" aria-label={name} className="tray">
      <span className="tray__name" aria-hidden="true">
        {name}
      </span>
      {chips.map((chip) => (
        <button key={chip.id} type="button" className="chip" aria-pressed={picked === chip.id} onClick={() => onPick(chip.id)}>
          <TaggedText text={chip.label} />
        </button>
      ))}
    </div>
  );""",
        r"""/** Returns a card's chips as the chips of a tray, each label with its terms tagged. */
export function trayChips(chips: { id: string; label: TermText }[]): TrayChip[] {
  return chips.map(({ id, label }) => ({ id, label: <TaggedText text={label} /> }));""",
    ),
)


edit(
    'src/ui/incident/map-cards/task-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, ChipTray, Choice } from '@/design';""",
    ),
    (
        r"""import { ChipCard, ChipTray } from './chip-card';""",
        r"""import { ChipCard, trayChips } from './chip-card';""",
    ),
    (
        r"""    <button type="button" className="chip" aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} />
    </button>""",
        r"""    <Choice aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} />
    </Choice>""",
    ),
    (
        r"""      <ChipTray name={TASK_CARD_TEXT.what} chips={chips.what} picked={slot.what} onPick={(chipId) => toggle('what', chipId)} />
      <ChipTray name={TASK_CARD_TEXT.from} chips={chips.from} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />""",
        r"""      <ChipTray name={TASK_CARD_TEXT.what} chips={trayChips(chips.what)} picked={slot.what} onPick={(chipId) => toggle('what', chipId)} />
      <ChipTray name={TASK_CARD_TEXT.from} chips={trayChips(chips.from)} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />""",
    ),
)


edit(
    'src/ui/incident/map-cards/terminal-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, ChipTray } from '@/design';""",
    ),
    (
        r"""import { ChipCard, ChipTray } from './chip-card';""",
        r"""import { ChipCard, trayChips } from './chip-card';""",
    ),
    (
        r"""        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={tray.chips} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />""",
        r"""        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={trayChips(tray.chips)} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />""",
    ),
)


edit(
    'src/ui/incident/explanation-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, Choice } from '@/design';""",
    ),
    (
        r"""            <button type="button" className="option" disabled={choice !== null} aria-pressed={choice === index} onClick={() => onChoose(index)}>
              <TaggedText text={option.text} />
            </button>""",
        r"""            <Choice variant="option" disabled={choice !== null} pressed={choice === index} onClick={() => onChoose(index)}>
              <TaggedText text={option.text} />
            </Choice>""",
    ),
)


edit(
    'src/ui/catalog/interface-section.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, ChipTray, Choice } from '@/design';""",
    ),
    (
        r"""const [FIRST_CHIP, SECOND_CHIP] = SAMPLE.chips;
const [FIRST_ADDRESS, SECOND_ADDRESS] = SAMPLE.addresses;""",
        r"""const [FIRST_CHIP] = SAMPLE.chips;
const [FIRST_ADDRESS] = SAMPLE.addresses;""",
    ),
    (
        r"""const NEW_TERMS = new Set<TermId>(['security-group']);
""",
        r"""const NEW_TERMS = new Set<TermId>(['security-group']);
const TRAY_CHIPS = SAMPLE.chips.map((label) => ({ id: label, label: <TaggedText text={label} /> }));
const ADDRESS_CHIPS = SAMPLE.addresses.map((address) => ({ id: address, label: address }));
const noPick = () => {};
""",
    ),
    (
        r"""          <button type="button" className="chip" aria-pressed={false}>
            <TaggedText text={FIRST_CHIP} />
          </button>""",
        r"""          <Choice pressed={false}>
            <TaggedText text={FIRST_CHIP} />
          </Choice>""",
    ),
    (
        r"""          <button type="button" className="chip" aria-pressed>
            <TaggedText text={FIRST_CHIP} />
          </button>""",
        r"""          <Choice pressed>
            <TaggedText text={FIRST_CHIP} />
          </Choice>""",
    ),
    (
        r"""          <button type="button" className="chip" aria-pressed>
            <TaggedText text={SAMPLE.namedChip} />
          </button>""",
        r"""          <Choice pressed>
            <TaggedText text={SAMPLE.namedChip} />
          </Choice>""",
    ),
    (
        r"""          <div role="group" aria-label={TASK_CARD_TEXT.what} className="tray">
            <span className="tray__name" aria-hidden="true">
              {TASK_CARD_TEXT.what}
            </span>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={FIRST_CHIP} />
            </button>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={SECOND_CHIP} />
            </button>
          </div>""",
        r"""          <ChipTray name={TASK_CARD_TEXT.what} chips={TRAY_CHIPS} picked={null} onPick={noPick} />""",
    ),
    (
        r"""            <button type="button" className="chip">
              <TaggedText text={FIRST_CHIP} />
            </button>""",
        r"""            <Choice>
              <TaggedText text={FIRST_CHIP} />
            </Choice>""",
    ),
    (
        r"""          <button type="button" className="option" aria-pressed={false}>
            {SAMPLE.option}
          </button>""",
        r"""          <Choice variant="option" pressed={false}>
            {SAMPLE.option}
          </Choice>""",
    ),
    (
        r"""          <button type="button" className="option" aria-pressed disabled>
            {SAMPLE.chosen}
          </button>""",
        r"""          <Choice variant="option" pressed disabled>
            {SAMPLE.chosen}
          </Choice>""",
    ),
    (
        r"""          <button type="button" className="option" aria-pressed={false} disabled>
            {SAMPLE.closed}
          </button>""",
        r"""          <Choice variant="option" pressed={false} disabled>
            {SAMPLE.closed}
          </Choice>""",
    ),
    (
        r"""            <div role="group" aria-label={TERMINAL_TEXT.trays.to} className="tray">
              <span className="tray__name" aria-hidden="true">
                {TERMINAL_TEXT.trays.to}
              </span>
              <button type="button" className="chip" aria-pressed>
                {FIRST_ADDRESS}
              </button>
              <button type="button" className="chip" aria-pressed={false}>
                {SECOND_ADDRESS}
              </button>
            </div>""",
        r"""            <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
        r"""- `Choice` (`choice.tsx`) is every choice: a `chip` (a short value) or an `option` (a whole sentence). With `pressed` it is a toggle (`aria-pressed`); without it, an action drawn as a choice, such as a chip given back to its tray. A pressed chip keeps a name inside it readable: the name tag loses its shade and takes the chip's colour. `ChipTray` is a named tray of chips where at most one is picked; every screen that picks values with chips uses it.
- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
    ),
)


edit(
    'src/ui/incident/map-cards/CLAUDE.md',
    (
        r"""The cards that open beside a piece of the map, both built from `chip-card.tsx` (`ChipCard`: the dialog with its title, Escape and "Listo"; `ChipTray`: a named tray of chips): the task card of a firewall (`task-card.tsx`, rules from Type and Source chips) and the terminal of an origin (`terminal-card.tsx`, a packet from origin, address and message chips, its line and "Enviar").""",
        r"""The cards that open beside a piece of the map, both built from `chip-card.tsx` (`ChipCard`: the dialog with its title, Escape and "Listo"; `trayChips`: the card's chips, with their terms, for the `ChipTray` of `@/design`): the task card of a firewall (`task-card.tsx`, rules from Type and Source chips) and the terminal of an origin (`terminal-card.tsx`, a packet from origin, address and message chips, its line and "Enviar").""",
    ),
    (
        r"""- Both use the same classes, `card chip-card`, `tray`, `chip` and `slot`, and the `Button` of `@/design` («×», «Listo» and «Enviar», which stays disabled until the line is complete). A new card reuses them before adding any.""",
        r"""- Both use the same classes, `card chip-card` and `slot`, and the `Button`, `ChipTray` and `Choice` of `@/design` («×», «Listo» and «Enviar», which stays disabled until the line is complete; the trays; the chip given back from the slot). A new card that picks values with chips uses the same tray, and reuses them before adding any.""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verificar los tests unitarios y que no queda una ficha suelta**

```bash
pnpm exec vitest run
grep -rn "<button" src/ui --include='*.tsx' --exclude='*.test.tsx'
```

Expected: `Tests 723 passed (723)` en 51 archivos; `grep` sin salida. Los únicos `<button>` que quedan fuera de `src/design/` son la etiqueta del mapa (`src/scene/overlay/piece-label.tsx`) y el sello (`src/scene/entities/stamp.tsx`).

- [ ] **Step 6: Comprobar que no se mueve ningún píxel**

```bash
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: `4 passed` las dos veces, sin regrabar nada.

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones`, `Tests 723 passed (723)` y 22 tests de Playwright.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(design): add Choice and ChipTray, the one chip, option and tray of the game"
```

---

### Task 6: `Card`, `NameTag` y una sola leyenda

`Card` es cada panel: la tarjeta de Lucía, las tarjetas del mapa (`ChipCard`: la de tarea y la terminal, con su grilla `chip-card` en un `div` interior), la caja de inspección, la explicación, el resultado y cada capítulo del roadmap (`as="li"`; los próximos, `variant="soon"`). `NameTag` reemplaza la etiqueta de nombre copiada en `tagged-text.tsx` y en `piece-label.tsx`: la usan `ui` y `scene`. El estilo de la etiqueta del mapa pasa a `primitives.css`, y la etiqueta que es solo un nombre comparte el marco de `NameTag` en una regla. La clase `caption` reemplaza cinco leyendas casi iguales, también los nombres de las bandejas de la terminal. Se quita `feedback--right`, que no tenía estilo. La captura de la interfaz cambia por la leyenda; la de las piezas no.

**Files:**
- Create: `src/design/card.tsx`, `src/design/name-tag.tsx`
- Modify: `src/design/primitives.css` (entero), `src/design/index.ts`, `src/design/choice.tsx`, `src/styles.css`, `src/ui/roadmap.tsx`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/map-cards/chip-card.tsx`, `src/ui/incident/inspection-box.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/incident/result-card.tsx`, `src/ui/tagged-text.tsx`, `src/scene/overlay/piece-label.tsx`, `src/ui/catalog/interface-section.tsx`, `src/design/CLAUDE.md`, `src/scene/overlay/CLAUDE.md`, `src/ui/CLAUDE.md`, `src/ui/incident/map-cards/CLAUDE.md`, `tests/e2e/snapshots/interface-darwin.png` (se regraba)
- Test: `tests/e2e/roadmap.spec.ts`

**Interfaces:**
- Consumes: `Choice` y `ChipTray` (Tarea 5); los tests que buscan `.name-tag`, `.map-button` y `.map-button--name`, que no cambian.
- Produces, por `@/design`:
  - `Card({ as?: 'section' | 'li'; variant?: 'default' | 'soon'; children; ...props de <section> sin className ni ref })`, con las clases `card` y `card--soon`.
  - `NameTag({ children })`, que dibuja `<span className="name-tag">`.
  - Las clases `caption` y `caption--soft`; `h3` se ve como `caption`.
  - En `src/styles.css`, `.inspection__fields` (antes `.inspection dl`) y `.incident__inspection > .card`.

**Usos que migra (hoy, después de la Tarea 5 sobre `c17d9cd`):**
- `Card`: los capítulos de `src/ui/roadmap.tsx` (`li.chapter` y `li.chapter--soon` → `Card as="li"`, `variant="soon"`); las tarjetas de `lucia-card.tsx`, `map-cards/chip-card.tsx` (`ChipCard`, el diálogo de la tarjeta de tarea y de la terminal: su grilla `chip-card` pasa a un `div` interior), `inspection-box.tsx`, `explanation-card.tsx` y `result-card.tsx`; los tres especímenes de «Tarjetas» (la terminal, también con su `div.chip-card`).
- `NameTag`: `src/ui/tagged-text.tsx` y `src/scene/overlay/piece-label.tsx`; el marco de `.map-button--name` se comparte con `.name-tag`.
- `caption`: todo `h3`; el «Glosario» (`summary` de `lucia-card.tsx`); el nombre de bandeja (`ChipTray`: «Type», «Source», «Origen», «Destino», «Mensaje»); las leyendas de `inspection-box.tsx` (`dt`); el rol de `roadmap.tsx`; sus especímenes.
- `feedback--right`: `explanation-card.tsx` y su espécimen.
- Estilos: `.card`, `.chapter`, `.chapter--soon`, `.name-tag`, `.map-button*`, `h3`, `.lucia__glossary summary`, `.inspection dt` y `.level-item .role`, de `src/styles.css` a `src/design/primitives.css` (o a `caption`). `.map-card` y sus variables se quedan en `src/styles.css` (decisión 18).
- No migran, a propósito: la ayuda de inspección y la leyenda de sellos y candado siguen siendo dos `p.muted` dentro de `.incident__inspection` (H3 queda pendiente), y la línea de la terminal sigue siendo un `.slot` con `code`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 5**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 723 passed (723)` en 51 archivos.

- [ ] **Step 2: Cambiar el test del roadmap**

Los capítulos próximos pasan de `li.chapter--soon` a `li.card--soon`.

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'tests/e2e/roadmap.spec.ts',
    (
        r"""  await expect(page.locator('li.chapter--soon')).toHaveCount(SOON_CHAPTER_COUNT);""",
        r"""  await expect(page.locator('li.card--soon')).toHaveCount(SOON_CHAPTER_COUNT);""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verlo fallar**

```bash
pnpm exec playwright test roadmap
```

Expected: `1 failed` y `1 passed`. Falla `the roadmap loads every chapter without console errors` (`Expected: 18`, `Received: 0`): los capítulos todavía usan `chapter--soon`.

- [ ] **Step 4: Implementar**

Contenido completo de `src/design/card.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

export type CardVariant = 'default' | 'soon';

type CardProps = Omit<ComponentProps<'section'>, 'className' | 'ref'> & {
  as?: 'section' | 'li';
  variant?: CardVariant;
  children: ReactNode;
};

/** The one card of the game: a paper panel with an ink border and a shadow, as a section or as an item of a list. A soon card holds what is not open yet: faded, dashed and without shadow. */
export function Card({ as: Element = 'section', variant = 'default', ...props }: CardProps) {
  return <Element className={variant === 'soon' ? 'card card--soon' : 'card'} {...props} />;
}
```

Contenido completo de `src/design/name-tag.tsx`:

```tsx
import type { ReactNode } from 'react';

/** A resource's or an actor's own name, drawn apart from the entity it names: monospace in a shaded box, like the value of the Name tag in AWS. */
export function NameTag({ children }: { children: ReactNode }) {
  return <span className="name-tag">{children}</span>;
}
```

Contenido completo de `src/design/primitives.css`:

```css
:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }

.btn { font: var(--weight-bold) var(--text-base) var(--font-body); background: var(--color-surface); color: var(--color-ink); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius); padding: var(--space-xs) var(--space-md); cursor: pointer; text-decoration: none; display: inline-block; box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--color-emphasis); color: var(--color-on-fill); }
.btn--small { padding: var(--space-2xs) var(--space-xs); font-size: var(--text-sm); box-shadow: none; }
.btn:disabled { color: var(--color-ink-soft); background: var(--color-shade); border-color: var(--color-ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }
.chip { font: var(--weight-bold) var(--text-md) var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); border-radius: var(--radius-pill); padding: var(--space-2xs) var(--space-sm); cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--color-ink); color: var(--color-on-fill); }
.chip[aria-pressed='true'] .name-tag { background: transparent; border-color: currentColor; }
.option { width: 100%; text-align: left; font: var(--weight-regular) var(--text-base)/1.4 var(--font-body); color: var(--color-ink); background: var(--color-page); border: var(--stroke-regular) solid var(--color-ink); padding: var(--space-xs) var(--space-sm); cursor: pointer; }
.option[aria-pressed='true'] { background: var(--color-shade); }
.option:disabled { cursor: default; }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); }
.tray__name { width: 100%; }
.link { font: inherit; color: var(--color-ink); background: none; border: 0; padding: 0; text-decoration: underline; text-underline-offset: var(--underline-offset); cursor: pointer; }
.card { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: var(--space-md); box-shadow: var(--shadow-md); }
.card--soon { opacity: 0.5; box-shadow: none; border-style: dashed; }
h3, .caption { font: var(--weight-bold) var(--text-xs)/1.2 var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); }
.caption--soft { color: var(--color-ink-soft); }

.map-button { pointer-events: auto; font: var(--weight-regular) var(--text-sm) var(--font-body); color: var(--color-ink); background: var(--color-surface); border: var(--stroke-thin) solid var(--color-ink); padding: 1px 6px; white-space: nowrap; cursor: pointer; }
.name-tag, .map-button--name { border: var(--stroke-thin) solid var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); }
.name-tag { font-family: var(--font-mono); font-weight: var(--weight-regular); font-size: 0.82em; line-height: 1.35; padding: 0 0.35em; white-space: nowrap; }
.map-button--name .name-tag { border: 0; padding: 0; background: none; font-size: var(--text-xs); }
.map-button--locked { border-style: dashed; color: var(--color-ink-soft); }
.map-button__alert { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: var(--radius-round); font: var(--weight-bold) var(--text-2xs) var(--font-body); color: var(--color-on-fill); background: var(--color-danger); vertical-align: 1px; }
.map-button__lock .entity-icon { margin-right: 0; }

@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}
```

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'src/design/index.ts',
    (
        r"""export { ChipTray, Choice } from './choice';""",
        r"""export { Card } from './card';
export { ChipTray, Choice } from './choice';""",
    ),
    (
        r"""export { token, tokenPx } from './tokens';""",
        r"""export { NameTag } from './name-tag';
export { token, tokenPx } from './tokens';""",
    ),
)


edit(
    'src/design/choice.tsx',
    (
        r"""      <span className="tray__name" aria-hidden="true">""",
        r"""      <span className="tray__name caption caption--soft" aria-hidden="true">""",
    ),
)


edit(
    'src/styles.css',
    (
        r"""h3 { font: var(--weight-bold) var(--text-xs)/1.2 var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); margin: 0 0 var(--space-xs); }""",
        r"""h3 { margin: 0 0 var(--space-xs); }""",
    ),
    (
        r""".chapter { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: var(--space-md); box-shadow: var(--shadow-md); }
.chapter--soon { opacity: 0.5; box-shadow: none; border-style: dashed; }
""",
        r"""""",
    ),
    (
        r""".level-item .role { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
""",
        r"""""",
    ),
    (
        r""".map-button { pointer-events: auto; font: var(--weight-regular) var(--text-sm) var(--font-body); color: var(--color-ink); background: var(--color-surface); border: var(--stroke-thin) solid var(--color-ink); padding: 1px 6px; white-space: nowrap; cursor: pointer; }
.map-button--name { border-color: var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); }
.map-button--name .name-tag { border: 0; padding: 0; background: none; font-size: var(--text-xs); }
.map-button--locked { border-style: dashed; color: var(--color-ink-soft); }
.map-button__alert { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: var(--radius-round); font: var(--weight-bold) var(--text-2xs) var(--font-body); color: var(--color-on-fill); background: var(--color-danger); vertical-align: 1px; }
.map-button__lock .entity-icon { margin-right: 0; }
""",
        r"""""",
    ),
    (
        r""".card { border: var(--stroke-regular) solid var(--color-ink); background: var(--color-surface); padding: var(--space-md); box-shadow: var(--shadow-md); }
""",
        r"""""",
    ),
    (
        r""".name-tag { font-family: var(--font-mono); font-weight: var(--weight-regular); font-size: 0.82em; line-height: 1.35; border: var(--stroke-thin) solid var(--color-ink-soft); border-radius: var(--radius); background: var(--color-shade); padding: 0 0.35em; white-space: nowrap; }
""",
        r"""""",
    ),
    (
        r""".lucia__glossary summary { cursor: pointer; font: var(--weight-bold) var(--text-xs)/1.2 var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); }""",
        r""".lucia__glossary summary { cursor: pointer; }""",
    ),
    (
        r""".incident__inspection .inspection { min-height: 0; overflow-y: auto; }
.incident__inspection > p { margin: 0; }
.inspection dl { margin: 0; }
.inspection dt { margin-top: var(--space-xs); font: var(--weight-bold) var(--text-xs) var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--color-ink-soft); }
.inspection dd { margin: 0; }""",
        r""".incident__inspection > .card { min-height: 0; overflow-y: auto; }
.incident__inspection > p { margin: 0; }
.inspection__fields { margin: 0; }
.inspection__fields dt { margin-top: var(--space-xs); }
.inspection__fields dd { margin: 0; }""",
    ),
)


edit(
    'src/ui/roadmap.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, Card } from '@/design';""",
    ),
    (
        r"""            <li key={chapter.number} className={own.length > 0 ? 'chapter' : 'chapter chapter--soon'}>""",
        r"""            <Card as="li" key={chapter.number} variant={own.length > 0 ? 'default' : 'soon'}>""",
    ),
    (
        r"""                        <span className="role">{ROADMAP_TEXT.role[level.role]}</span>""",
        r"""                        <span className="caption caption--soft">{ROADMAP_TEXT.role[level.role]}</span>""",
    ),
    (
        r"""            </li>
          );""",
        r"""            </Card>
          );""",
    ),
)


edit(
    'src/ui/incident/lucia-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, Card } from '@/design';""",
    ),
    (
        r"""    <section className="card lucia" aria-labelledby="lucia-title">""",
        r"""    <Card aria-labelledby="lucia-title">""",
    ),
    (
        r"""        <summary>{LUCIA_TEXT.glossary}</summary>""",
        r"""        <summary className="caption">{LUCIA_TEXT.glossary}</summary>""",
    ),
    (
        r"""    </section>""",
        r"""    </Card>""",
    ),
)


edit(
    'src/ui/incident/map-cards/chip-card.tsx',
    (
        r"""import { Button, type TrayChip } from '@/design';""",
        r"""import { Button, Card, type TrayChip } from '@/design';""",
    ),
    (
        r"""    <section role="dialog" aria-label={toPlainText(title)} className="card chip-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={title} />
      </h2>
      {children}
      <Button onClick={onClose}>{TASK_CARD_TEXT.done}</Button>
    </section>""",
        r"""    <Card role="dialog" aria-label={toPlainText(title)} onKeyDown={closeOnEscape}>
      <div className="chip-card">
        <h2 ref={heading} tabIndex={-1}>
          <TaggedText text={title} />
        </h2>
        {children}
        <Button onClick={onClose}>{TASK_CARD_TEXT.done}</Button>
      </div>
    </Card>""",
    ),
)


edit(
    'src/ui/incident/inspection-box.tsx',
    (
        r"""import type { Inspection } from '@/game';""",
        r"""import { Card } from '@/design';
import type { Inspection } from '@/game';""",
    ),
    (
        r"""    <section className="card inspection" aria-labelledby="inspection-title">""",
        r"""    <Card aria-labelledby="inspection-title">""",
    ),
    (
        r"""      <dl>""",
        r"""      <dl className="inspection__fields">""",
    ),
    (
        r"""            <dt>""",
        r"""            <dt className="caption caption--soft">""",
    ),
    (
        r"""    </section>""",
        r"""    </Card>""",
    ),
)


edit(
    'src/ui/incident/explanation-card.tsx',
    (
        r"""import { Button, Choice } from '@/design';""",
        r"""import { Button, Card, Choice } from '@/design';""",
    ),
    (
        r"""    <section className="card explanation" aria-labelledby="explanation-title">""",
        r"""    <Card aria-labelledby="explanation-title">""",
    ),
    (
        r"""              <p className={option.correct ? 'feedback feedback--right' : 'feedback feedback--wrong'}>""",
        r"""              <p className={option.correct ? 'feedback' : 'feedback feedback--wrong'}>""",
    ),
    (
        r"""    </section>""",
        r"""    </Card>""",
    ),
)


edit(
    'src/ui/incident/result-card.tsx',
    (
        r"""import { Button } from '@/design';""",
        r"""import { Button, Card } from '@/design';""",
    ),
    (
        r"""    <section className="card result" aria-labelledby="result-title">""",
        r"""    <Card aria-labelledby="result-title">""",
    ),
    (
        r"""    </section>""",
        r"""    </Card>""",
    ),
)


edit(
    'src/ui/tagged-text.tsx',
    (
        r"""import { TermTip } from './term-tip';""",
        r"""import { NameTag } from '@/design';
import { TermTip } from './term-tip';""",
    ),
    (
        r"""        if (segment.kind === 'name') {
          return (
            <span key={index} className="name-tag">
              {segment.text}
            </span>
          );
        }""",
        r"""        if (segment.kind === 'name') return <NameTag key={index}>{segment.text}</NameTag>;""",
    ),
)


edit(
    'src/scene/overlay/piece-label.tsx',
    (
        r"""import { InkIcon } from '@/scene/ink';""",
        r"""import { NameTag } from '@/design';
import { InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""          <span key={index} className="name-tag">
            {segment.text}
          </span>""",
        r"""          <NameTag key={index}>{segment.text}</NameTag>""",
    ),
)


edit(
    'src/ui/catalog/interface-section.tsx',
    (
        r"""import { Button, ChipTray, Choice } from '@/design';""",
        r"""import { Button, Card, ChipTray, Choice } from '@/design';""",
    ),
    (
        r"""          <p className="feedback feedback--right">""",
        r"""          <p className="feedback">""",
    ),
    (
        r"""          <section className="card">""",
        r"""          <Card>""",
    ),
    (
        r"""            </p>
          </section>
        </Specimen>""",
        r"""            </p>
          </Card>
        </Specimen>""",
    ),
    (
        r"""          <div className="chapter chapter--soon">
            <h2>{ROADMAP_TEXT.soon}</h2>
          </div>""",
        r"""          <Card variant="soon">
            <h2>{ROADMAP_TEXT.soon}</h2>
          </Card>""",
    ),
    (
        r"""          <section className="card chip-card">
            <h2>
              <TaggedText text={TERMINAL_TEXT.title(SAMPLE.origin)} />
            </h2>
            <p className="slot">
              <code>
                <TaggedText text={TERMINAL_TEXT.ping(FIRST_ADDRESS)} />
              </code>
            </p>
            <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />
            <Button>{TERMINAL_TEXT.send}</Button>
            <Button>{TASK_CARD_TEXT.done}</Button>
          </section>""",
        r"""          <Card>
            <div className="chip-card">
              <h2>
                <TaggedText text={TERMINAL_TEXT.title(SAMPLE.origin)} />
              </h2>
              <p className="slot">
                <code>
                  <TaggedText text={TERMINAL_TEXT.ping(FIRST_ADDRESS)} />
                </code>
              </p>
              <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />
              <Button>{TERMINAL_TEXT.send}</Button>
              <Button>{TASK_CARD_TEXT.done}</Button>
            </div>
          </Card>""",
    ),
    (
        r"""            <summary>{LUCIA_TEXT.glossary}</summary>""",
        r"""            <summary className="caption">{LUCIA_TEXT.glossary}</summary>""",
    ),
    (
        r"""          <div className="inspection">
            <dl>
              <dt>{INSPECTION_TEXT.whatIs}</dt>
            </dl>
          </div>""",
        r"""          <dl className="inspection__fields">
            <dt className="caption caption--soft">{INSPECTION_TEXT.whatIs}</dt>
          </dl>""",
    ),
    (
        r"""          <div className="level-item">
            <span className="role">{ROADMAP_TEXT.role.defender}</span>
          </div>""",
        r"""          <span className="caption caption--soft">{ROADMAP_TEXT.role.defender}</span>""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
        r"""- `Card` (`card.tsx`) is every panel: a `section` or, with `as="li"`, an item of a list; the `soon` variant holds what is not open yet. Inner layout belongs to the content, not to the card.
- `NameTag` (`name-tag.tsx`) draws a resource's or an actor's own name. The panels (`TaggedText`) and the map labels (`PieceLabel`) both use it. The map labels' look lives in `primitives.css` too: a label that is only a name wears the name tag's frame, written once for both.
- A caption is the class `caption` (with `caption--soft` for the label of a field, a tray or a role); every `h3` looks like one.
- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.""",
    ),
)


edit(
    'src/scene/overlay/CLAUDE.md',
    (
        r"""- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed. It shows the lock of a fixed piece and the alert «!» of a device under attack, both also read as text, so neither can cover another label. A resource's own name in the label (`[[servidor2]]`) is drawn as a name tag, apart from the entity.
- Not here: the cards themselves and every other panel (`src/ui/incident/`, `src/ui/incident/map-cards/`), moving packets and stamps (`src/scene/traffic/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).""",
        r"""- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed. It shows the lock of a fixed piece and the alert «!» of a device under attack, both also read as text, so neither can cover another label. A resource's own name in the label (`[[servidor2]]`) is drawn as a name tag (`NameTag` of `@/design`), apart from the entity; the label's look (`map-button`) is in the design system's stylesheet.
- Not here: the cards themselves and every other panel (`src/ui/incident/`, `src/ui/incident/map-cards/`), moving packets and stamps (`src/scene/traffic/`).
- May import: `@/copy`, `@/levels`, `@/design`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).""",
    ),
)


edit(
    'src/ui/CLAUDE.md',
    (
        r"""- Every button and link is a `Button` of `@/design`; this folder writes no `<button>` or `<a>` of its own.""",
        r"""- Every button and link is a `Button` of `@/design`, every chip and option a `Choice`, every panel a `Card`, and every name a `NameTag`; this folder writes no `<button>` or `<a>` of its own and adds no look of its own to them.""",
    ),
)


edit(
    'src/ui/incident/map-cards/CLAUDE.md',
    (
        r"""- Both use the same classes, `card chip-card` and `slot`, and the `Button`, `ChipTray` and `Choice` of `@/design` («×», «Listo» and «Enviar», which stays disabled until the line is complete; the trays; the chip given back from the slot). A new card that picks values with chips uses the same tray, and reuses them before adding any.""",
        r"""- Both are a `Card` of `@/design` with the grid `chip-card` inside, and use the class `slot` and the `Button`, `ChipTray` and `Choice` of `@/design` («×», «Listo» and «Enviar», which stays disabled until the line is complete; the trays; the chip given back from the slot). A new card that picks values with chips uses the same tray, and reuses them before adding any.""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verificar los tests unitarios**

```bash
pnpm exec vitest run
grep -rn "className=\"name-tag\|className=\"card\|chapter--soon\|feedback--right" src
```

Expected: `Tests 723 passed (723)` en 51 archivos; `grep` solo encuentra `src/design/name-tag.tsx`: la etiqueta de nombre y la tarjeta ya solo se escriben en `src/design/`.

- [ ] **Step 6: Ver qué cambia en las capturas y regrabar la de la interfaz**

```bash
pnpm exec playwright test entities
```

Expected: `1 failed` y `3 passed`. La captura de la interfaz pierde 1 px de alto (`Expected an image 1232px by 1076px, received 1232px by 1075px`, 39 318 píxeles distintos). La de las piezas pasa sin cambios. En `interface-diff.png`, lo rojo es el nombre de la bandeja «Type» y lo que está debajo (sube alrededor de 1 px), «DESTINO» de la terminal y lo que sigue, «QUÉ ES» y «DEFENSOR» (peso 600). Si hay rojo en otro lado, parar y avisar.

```bash
pnpm exec playwright test entities --update-snapshots=all
pnpm exec playwright test entities
pnpm exec playwright test entities
```

Expected: `4 passed` las tres veces; solo cambia `interface-darwin.png`.

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: estructura sin quejas (`src/design/` con 11 archivos), `Found 0 clones`, `Tests 723 passed (723)` y 22 tests de Playwright.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat(design): add Card, NameTag and one caption style, shared by the panels and the map labels"
```

---

### Task 7: `DESIGN.md` y la documentación

`DESIGN.md`, en la raíz del proyecto, explica el design system para personas: los tokens y sus valores, las escalas, los primitivos y cuándo usar cada uno, la regla del bermellón, cómo sumar una variante en vez de un elemento nuevo, y qué cuida el estándar. El README lo enlaza. La regla `no-magic-strings` nombra los tokens donde nombraba `theme.ts`. `DESIGN.md` nombra lo que trajo el plan 3: «Enviar» y su estado deshabilitado, las bandejas de la terminal, la ficha elegida con un nombre, la línea de la terminal (`code`), el texto secundario y las medidas de una tarjeta del mapa, que decide `layout.ts`; y dice que Newsreader 600 no se carga. La hoja de ruta pasa la fila «Design system del juego» de «Siguiente» a «En curso», junto al capítulo 1. El backlog anota, después del estado del plan 3, G1 hecho, el bloque D decidido, lo que sigue pendiente (E4, E8, E9, G2, G9, A1, A2 y H1 a H3) y el solape del 01-03 (decisión 24). No cambia ningún píxel.

**Files:**
- Create: `DESIGN.md`
- Modify: `README.md`, `src/design/CLAUDE.md`, `.claude/rules/no-magic-strings.md`, `.claude/az-rules.json`, `docs/plans/follow-the-packet-roadmap.md`, `docs/plans/2026-10-08-follow-the-packet-followups.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: `DESIGN.md`; la fila «Design system del juego» en «En curso»; G1 «Hecho»; el bloque D con `prefer-radix` como única regla sin decidir; el estado del design system en el backlog.

- [ ] **Step 1: Comprobar que se parte de la Tarea 6**

```bash
git status --short src tests
pnpm exec vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 723 passed (723)` en 51 archivos.

- [ ] **Step 2: Escribir `DESIGN.md`**

Contenido completo de `DESIGN.md`:

```markdown
# Design system

How "Sigue el paquete" looks, in one place: the tokens, the scales, the primitives and the rules for using them. The code lives in `src/design/`. The review page is `#/entidades`: its section "Elementos de la interfaz" shows every primitive in every variant and state, and its section "Piezas del mapa" shows every map piece with its label and stamp. Playwright compares both with a capture that tolerates no changed pixel.

## Principles

- **Paper and ink.** Text and lines are ink on paper. Vermilion means danger.
- **Never colour alone.** A state also changes a shape or a text: a dashed border, a double ring, a word.
- **One standard per element.** Every action or link is a `Button`, every chip or option a `Choice`, every tray of chips a `ChipTray`, every panel a `Card`, every own name a `NameTag`, every small heading a caption. A new look is a new variant of its primitive, never a sibling element and never a class added at the call site.

## Colour

`tokens.css` has two layers. The palette names a colour by what it is; only `tokens.css` uses it. The roles name a colour by what it is for; styles and the 3D map use only roles.

| Palette | Value |
|---------|-------|
| `--palette-paper` | `#f6f1e7` |
| `--palette-paper-light` | `#fbf8f2` |
| `--palette-paper-dark` | `#efe8da` |
| `--palette-ink` | `#2b2b2b` |
| `--palette-ink-light` | `#5f5a52` |
| `--palette-vermilion` | `#e4572e` |

| Role | Palette | For |
|------|---------|-----|
| `--color-page` | paper | the page, chips and options |
| `--color-surface` | paper light | cards, buttons, map labels, stamps, map pieces (`PAPER_FILL`) |
| `--color-shade` | paper dark | name tags, a chosen option, a disabled button, the shaded parts of map pieces (`PAPER_SHADE`) |
| `--color-ink` | ink | text, borders, shadows, map lines (`INK`) |
| `--color-ink-soft` | ink light | secondary text, captions of fields, a disabled button, dashed and soft borders |
| `--color-on-fill` | paper light | text on a filled background: a pressed chip, the primary button, a tooltip, the alert mark |
| `--color-danger` | vermilion | blocked, intruder, alert, a rejected solution, a wrong answer (`DANGER` on the map) |
| `--color-emphasis` | vermilion | the primary button, chapter numbers, stars, the "nuevo" mark, the tooltip shadow |
| `--color-focus` | vermilion | the focus ring |

### The vermilion rule

Vermilion is for danger. Emphasis and focus share its value today, but they are separate roles: either can change in one line of `tokens.css` without touching danger. A new use of vermilion picks the role it means; nothing outside `tokens.css` names `--palette-vermilion`.

## Type

- **Fonts:** `--font-display` (Newsreader: `h1`, `h2`, chapter numbers, stamps), `--font-body` (IBM Plex Sans: everything else), `--font-mono` (IBM Plex Mono: name tags and the terminal line, `code`).
- **Weights:** `--weight-regular` (400), `--weight-bold` (600), `--weight-display` (500). `index.html` loads Plex Sans 400 and 600, Newsreader 500 and Plex Mono 400. Newsreader 600 is not loaded, on the student's choice (2026-10-09): a stamp and a term inside a title ask for bold, and the browser draws it from 500. A new weight is loaded there first.

| Size | Value | For |
|------|-------|-----|
| `--text-2xs` | 11 px | the "nuevo" mark, the alert mark on the map |
| `--text-xs` | 12 px | captions, a name on the map, catalog captions |
| `--text-sm` | 13 px | map labels, small buttons |
| `--text-md` | 14 px | chips, tooltips, feedback, secondary lines, the terminal line |
| `--text-base` | 16 px | body text, buttons, options |
| `--text-lg` | 18 px | the lede, stamps |
| `--text-xl` | 22.4 px | `h2`, chapter numbers, the incident title |
| `--text-2xl` | 36 px | `h1` |

- **Caption:** the class `caption` (bold, `--text-xs`, uppercase, `--tracking-caps`) for the heading of a list; `caption caption--soft` for the label of a field, a tray or a role. Every `h3` is a caption.
- **Secondary text:** the class `muted` (`--color-ink-soft`): Lucía's role, a card with no rules, the inspect help and the legend of the stamps and the lock.
- **Letters:** `--tracking-caps` (0.06 em) spaces every uppercase text; `--underline-offset` (3 px) lowers the line under links and terms.
- **Line height** stays with the element: 1.5 for body text, 1.2 for headings and captions, 1.4 for options and tooltips, 1.1 for `h1`.

## Space

A 4 px grid. Every margin, padding and gap uses a step.

| Step | Value |
|------|-------|
| `--space-2xs` | 4 px |
| `--space-xs` | 8 px |
| `--space-sm` | 12 px |
| `--space-md` | 16 px |
| `--space-lg` | 24 px |
| `--space-xl` | 32 px |
| `--space-2xl` | 40 px |
| `--space-3xl` | 48 px |

## Lines, radii, shadows and focus

- **Lines** are one scale for the borders of the interface and the lines of the 3D map (`LINE` in `src/scene/theme.ts` reads the same tokens): `--stroke-thin` 1 px (map labels, name tags, details of map pieces), `--stroke-regular` 1.5 px (buttons, cards, chips, the ink edges of map pieces), `--stroke-bold` 2 px (the focus ring, the network slab), `--stroke-heavy` 2.5 px (the stamp ring, a packet's trace), `--stroke-double` 4 px (the intruder stamp's double ring).
- **Radii:** `--radius` 3 px (buttons, name tags, tooltips), `--radius-pill` (chips), `--radius-round` (stamps, the alert mark).
- **Shadows:** `--shadow-sm` (buttons), `--shadow-md` (cards), `--shadow-tip` (the tooltip, in emphasis).
- **Focus:** one rule for every element, `:focus-visible` with `--focus-ring` at `--focus-offset`. No element sets its own outline.
- **One-off measures** that belong to a single rule stay in it: the side panel (380 px), the inspection box (22 rem), the stamp (32 px), the alert mark (15 px), the padding of a map label (1 px 6 px) and of a name tag (0.35 em).
- **A card on the map** takes its width and its gap from its piece from `src/scene/layout.ts`, which needs them to pick the card's side: the anchor hands them to `.map-card` as `--card-width` and `--card-gap`, and a card docked in the corner of the map also gets `--card-x` and `--card-y`. They are not tokens.

## Primitives

All in `src/design/`, imported through `@/design`. A primitive takes no `className`: its look comes from its variant, and where it sits is its parent's business (a gap, a grid, a wrapper inside a card).

| Primitive | Variants | Use it for |
|-----------|----------|------------|
| `Button` | `primary`, `secondary` (default), `small`, `text`; with `href` it is a link; `disabled` greys it out and drops its shadow | every action and every link. One `primary` per screen, its main action («Enviar solución»); the actions of a card on the map («Listo», «Enviar») are `secondary` |
| `Choice` | `chip` (default), `option`; `pressed` makes it a toggle | a short value to pick (`chip`) or a sentence to choose (`option`); without `pressed`, an action drawn as a chip (giving a chip back). A pressed chip keeps a name inside it readable |
| `ChipTray` | — | a named row of chips where at most one is picked: the trays of the task card and of the terminal, and of any card that picks values with chips |
| `Card` | `default`, `soon`; a `section` or, with `as="li"`, a list item | every panel, the cards beside a piece of the map included (the task card and the terminal); `soon` for what is not open yet |
| `NameTag` | — | a resource's or an actor's own name (`servidor2`, `Atacante`), in text and in map labels |
| `caption` (class) | `caption`, `caption--soft` | the heading of a list; the label of a field, a tray or a role |

The map has its own pieces, drawn by the entity catalog (`src/scene/entities/`) with the same tokens. Their labels (`PieceLabel`, `src/scene/overlay/`) take their look from `primitives.css`: a label that is only a name wears the name tag's frame, written once for both.

## Adding a variant instead of a new element

1. Find the primitive that does the job in the table above. If one does, the new look is a variant: add it to the variant type and the class map of its file, and its rule to `primitives.css`, with tokens only.
2. Add its specimen to `src/ui/catalog/interface-section.tsx`, with its caption in `INTERFACE_TEXT`.
3. Record the captures on purpose, `pnpm exec playwright test entities --update-snapshots=all`, and check that the difference is only the new specimen.
4. A new primitive is only for a role no primitive can take with a variant. It gets its file in `src/design/`, its test, its specimen and a row in the table above that says why.
5. A new token is only for a role no token serves: a colour enters the palette and gets a role; a size, a space or a line joins its scale.

## What guards the standard

The two zero-tolerance captures of `#/entidades` show any pixel that moves, and TypeScript rejects a `className` on a primitive. On the student's choice (2026-10-09) there is no test over the CSS, no lint rule against a raw `<button>` or `<a>`, and no rule file for the standard: a review finds a sixth button.
```

- [ ] **Step 3: Actualizar las guías, la hoja de ruta y el backlog**

```bash
python3 - <<'EOF'
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


edit(
    'README.md',
    (
        r"""A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module. Chapter 1 is playable: four incidents at the office with Lucía, where the player sends packets from a terminal (IP address, ping, Echo Request and Echo Reply, private IPs and the internet) and opens a host firewall. Chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, is on the `#/entidades` page, which the roadmap does not link to.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md) · [chapter 1](../../docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md)""",
        r"""A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module. Chapter 1 is playable: four incidents at the office with Lucía, where the player sends packets from a terminal (IP address, ping, Echo Request and Echo Reply, private IPs and the internet) and opens a host firewall. Chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, and every element of the interface are on the `#/entidades` page, which the roadmap does not link to. How the game looks (tokens, scales and the one component for each element) is in [DESIGN.md](DESIGN.md).

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md) · [chapter 1](../../docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md) · [design system](../../docs/plans/2026-10-09-follow-the-packet-design-system.md)""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""- Not here: screens and panels (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).""",
        r"""- `DESIGN.md` at the project root is the guide for people: every token and primitive, when to use each, and how to add a variant instead of a new element. A change here updates it.
- Not here: screens and panels (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).""",
    ),
)


edit(
    '.claude/rules/no-magic-strings.md',
    (
        r"""In this project the recurring values are IPs, CIDRs, AWS names and the lesson reference (in each chapter's `shared.ts` once levels exist, and in `src/testing/fixtures.ts` for tests), scene colors (`src/scene/theme.ts`), the progress storage key (`src/storage/progress.ts`) and visible Spanish text maps (`src/copy/`).""",
        r"""In this project the recurring values are IPs, CIDRs, AWS names and the lesson reference (in each chapter's `shared.ts` once levels exist, and in `src/testing/fixtures.ts` for tests), colours, sizes, spaces and lines (the design tokens in `src/design/tokens.css`, which `src/scene/theme.ts` reads for the map), the progress storage key (`src/storage/progress.ts`) and visible Spanish text maps (`src/copy/`).""",
    ),
)


edit(
    '.claude/az-rules.json',
    (
        r'''        "constants: chapter shared.ts once levels exist, src/scene/theme.ts, src/storage/progress.ts (PROGRESS_KEY, MAX_STARS), src/copy/"''',
        r'''        "constants: chapter shared.ts once levels exist, design tokens in src/design/tokens.css (read by src/scene/theme.ts), src/storage/progress.ts (PROGRESS_KEY, MAX_STARS), src/copy/"''',
    ),
)


edit(
    '../../docs/plans/follow-the-packet-roadmap.md',
    (
        r"""| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 3](2026-10-09-follow-the-packet-chapter-1-send.md). Tareas 1 a 11 hechas (`20bc9be..1b5010f`, el commit de los documentos y el commit de la revisión final). Falta la prueba humana (fila «Prueba humana del capítulo 1», en «Siguiente») |
""",
        r"""| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 3](2026-10-09-follow-the-packet-chapter-1-send.md). Tareas 1 a 11 hechas (`20bc9be..1b5010f`, el commit de los documentos y el commit de la revisión final). Falta la prueba humana (fila «Prueba humana del capítulo 1», en «Siguiente») |
| **Design system del juego.** Tokens en un solo lugar (paleta y roles, escala tipográfica y de espacios, líneas, radios, sombras y foco), un componente por elemento con sus variantes (`Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, leyenda) y `DESIGN.md`. Incluye lo que trajo el plan 3: la tarjeta terminal, el botón «Enviar» y su estado deshabilitado, y la ficha elegida con un nombre. La sección «Elementos de la interfaz» de `#/entidades` y su captura de Playwright, sin tolerancia, avisan si algo cambia sin querer | «Que no creemos 5 versiones de un button, sino que mantengamos un estándar». Los colores vivían en `src/styles.css` y se repetían en `src/scene/theme.ts`; los tamaños se elegían caso por caso | Pregunta del estudiante, 2026-10-09. Cierra G1 y decide el bloque D del backlog | `en curso`: [plan](2026-10-09-follow-the-packet-design-system.md). Tareas 1 a 7 hechas |
""",
    ),
    (
        r"""| **Design system del juego.** Un `DESIGN.md` con los colores, las letras, la escala tipográfica y de espacios y las reglas visuales. Una sección nueva en `#/entidades` con cada elemento de la interfaz en vivo (botones, fichas, tarjetas, etiquetas del mapa, nombre propio y sellos), dentro de la captura de Playwright | Hoy los colores viven en `src/styles.css` y se repiten en `src/scene/theme.ts`. Las reglas están repartidas en dos specs y los tamaños se eligieron caso por caso. Con un catálogo, un cambio sin querer rompe la prueba | Pregunta del estudiante, 2026-10-09. Relacionado con el bloque D del backlog (reglas `design-tokens` y `primitive-semantic-tokens` sin decidir) | `siguiente`: después del plan 2 |
""",
        r"""""",
    ),
)


edit(
    '../../docs/plans/2026-10-08-follow-the-packet-followups.md',
    (
        r"""> **Estado (capítulo 1, plan 3, `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`):** hechos F4 (los textos de la respuesta y de `route-private` según el tipo de red y de firewall), F5, F6, G3, G4, G5, G7 y G8. E4 sigue pendiente para la tarjeta de tarea del 04-01. La tarjeta terminal ya no lo sufre en el 01-01: se abre en el lado libre (`terminalSide` en `src/scene/layout.ts`) y no tapa la impresora. En el 01-03, con el exterior dibujado, ningún lado queda libre: la terminal se acopla en la esquina inferior izquierda del mapa (la revisión final del plan 3 lo arregló). A 1440×900 o más no tapa etiquetas ni sellos. A 1280×800 y 1366×768 la de Casa de Lucía, que es más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo». G6 también está hecho (`6e5630d`, Tarea 11 del plan 2). Siguen pendientes E4, E8, E9, G1, G2, G9, A1, A2, H1 a H3 y el bloque D.
""",
        r"""> **Estado (capítulo 1, plan 3, `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`):** hechos F4 (los textos de la respuesta y de `route-private` según el tipo de red y de firewall), F5, F6, G3, G4, G5, G7 y G8. E4 sigue pendiente para la tarjeta de tarea del 04-01. La tarjeta terminal ya no lo sufre en el 01-01: se abre en el lado libre (`terminalSide` en `src/scene/layout.ts`) y no tapa la impresora. En el 01-03, con el exterior dibujado, ningún lado queda libre: la terminal se acopla en la esquina inferior izquierda del mapa (la revisión final del plan 3 lo arregló). A 1440×900 o más no tapa etiquetas ni sellos. A 1280×800 y 1366×768 la de Casa de Lucía, que es más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo». G6 también está hecho (`6e5630d`, Tarea 11 del plan 2). Siguen pendientes E4, E8, E9, G1, G2, G9, A1, A2, H1 a H3 y el bloque D.

> **Estado (design system, `docs/plans/2026-10-09-follow-the-packet-design-system.md`):** hecho G1 (las capturas de `#/entidades` no toleran ningún píxel distinto). Del bloque D quedan decididas `design-tokens` y `primitive-semantic-tokens`; sigue sin decidir `prefer-radix`. Siguen pendientes E4, E8, E9, G2, G9, A1, A2 y H1 a H3: la migración no toca el código de ninguno. Con las escalas de letra y espacio, la terminal acoplada de Casa de Lucía en el 01-03 crece 8 px (de 495 a 503 de alto): a 1280×800 tapa 15 px de la parte de abajo del sello perdido en vez de 7, y a 1366×768, 31 en vez de 23; el «?» se sigue viendo y a 1440×900 no tapa nada. Sigue siendo el pendiente que anotó el plan 3.
""",
    ),
    (
        r"""- Reglas del almacén aún sin decidir: `prefer-radix`, `design-tokens`, `primitive-semantic-tokens`.""",
        r"""- `design-tokens` y `primitive-semantic-tokens`: decididas en el plan del design system (2026-10-09). El proyecto sigue su idea (paleta y roles de color; escalas de letra, espacio y línea) y la escribe en `projects/follow-the-packet/DESIGN.md`. No entran como reglas de `.claude/rules/`: el estudiante dejó fuera las guardas (archivo de regla, test sobre el CSS y regla de ESLint).
- `prefer-radix`: sin decidir.""",
    ),
    (
        r"""| G1 | La captura de `#/entidades` tolera un 1 % de píxeles distintos (unos 24 000): si volviera el candado dorado o faltara la alfombra del firewall seleccionado, la prueba pasaría (`tests/e2e/entities.spec.ts:26`) | Design system (hoja de ruta): bajar la tolerancia o sumar comprobaciones de la página |""",
        r"""| G1 | La captura de `#/entidades` tolera un 1 % de píxeles distintos (unos 24 000): si volviera el candado dorado o faltara la alfombra del firewall seleccionado, la prueba pasaría (`tests/e2e/entities.spec.ts:26`) | Hecho en el design system (Tarea 1): las dos capturas de `#/entidades` no toleran ningún píxel distinto ni diferencia de color (`maxDiffPixels: 0`, `threshold: 0`) |""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 4: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones`, `Tests 723 passed (723)` y 22 tests de Playwright.

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md README.md .claude src ../../docs/plans/follow-the-packet-roadmap.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md
git commit -m "docs: add DESIGN.md and record the design system in the roadmap and the backlog"
```

---

## Cobertura del pedido

| Pedido | Dónde |
|--------|-------|
| Red de seguridad antes de migrar: una sección con cada primitivo en cada variante y estado, con su captura propia, grabada antes de cualquier migración; G1 | Tarea 1 (decisiones 15 y 16) |
| Tokens en un solo lugar: colores, fuentes, escala de letra, escala de espacios, líneas, radios, sombras y foco; paleta y roles; el bermellón en tres roles con el valor de hoy; `theme.ts` con una sola fuente | Tareas 2 y 3 (decisiones 2 a 8) |
| Un primitivo por familia, con variantes; cada uso migra; los pesos y `.feedback--right` corregidos | Tareas 4, 5 y 6 (decisiones 9 a 14) |
| Guardas para que no aparezca un sexto botón | Solo el catálogo y su captura, por decisión del estudiante (decisión 17) |
| `DESIGN.md` | Tarea 7 |
| Documentación: hoja de ruta, backlog (bloque D y G1), README y guías | Tarea 7; las guías de cada carpeta, en la tarea que cambia su carpeta |
| Lo que trajo el plan 3: las tarjetas del mapa (`ChipCard`), sus bandejas, «Listo», «Enviar» y su estado deshabilitado, la ficha elegida con un nombre, la línea de la terminal, la leyenda de sellos y las medidas de la tarjeta del mapa | Especímenes en la Tarea 1 (decisión 23); `Button`, `ChipTray` y `Choice`, `Card` (Tareas 4 a 6; decisiones 18 a 22); «Rebase sobre el plan 3» |
| Las decisiones del estudiante: bermellón (A), escalas aceptadas, Newsreader 600 sin cargar (B) | Decisiones 4 a 6, aplicadas en las Tareas 2, 3 y 7 |

## Capturas del ensayo

Renders a 1280×800, en modo «Sin animaciones», con las fuentes del juego: antes, en `c17d9cd`, y después, al final de la copia que volvió a aplicar el plan tal cual. Están en el scratchpad de la sesión que rebasó este plan (en el scratchpad temporal de la sesión), que es temporal: si se borró, se rehacen con el plan ya ejecutado.

| Archivo | Qué muestra |
|---------|-------------|
| `01-components-catalog.png` | La sección «Elementos de la interfaz» al final del plan: botones (con «deshabilitado»), fichas y opciones (con «ficha elegida con nombre»), tarjetas (con «tarjeta terminal») |
| `02-components-catalog-lower.png` | La misma sección, más abajo: textos y etiquetas (con «texto secundario») |
| `03-roadmap-before.png` · `04-roadmap-after.png` | El roadmap con el capítulo 1 hecho, antes y después: escalas (decisión 5) y el rol en 600 (decisión 13) |
| `05-incident-04-01-card-inspection-before.png` · `06-…-after.png` | El 04-01 con la tarjeta del Security Group abierta, una ficha elegida y la caja de inspección: escalas; el título de la tarjeta cabe en una línea (decisión 6, opción B) |
| `07-incident-01-01-terminal-sent-before.png` · `08-…-after.png` | El 01-01 con la terminal abierta después de «Enviar», y la ayuda con la leyenda de sellos: escalas en la terminal |
| `09-incident-01-04-firewall-card-before.png` · `10-…-after.png` | El 01-04 con la tarjeta del firewall abierta y la ficha «tu-laptop» elegida en su bandeja: la ficha elegida con un nombre |
| `11-entities-before.png` · `12-entities-after.png` | El comienzo de `#/entidades`: cabecera y piezas del mapa |
| `13-incident-01-03-docked-terminal-before.png` · `14-…-after.png` | El 01-03 con la terminal de Casa de Lucía acoplada después de «Enviar»: crece 8 px y tapa algo más del sello perdido (decisión 24) |

Las capturas de las decisiones del estudiante (`09` a `15`: el bermellón en tinta y Newsreader 600 sin cargar) son del primer ensayo, sobre `58c548e`, en el scratchpad temporal de la sesión.
