# Sigue el paquete · Cajas flotantes: clic para fijar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Este plan no trae código: cada tarea dice qué contrato, qué archivos y qué tests nombrados; el código lo escribe quien ejecuta, con TDD.

**Goal:** Que las cajas flotantes del juego, la de inspección y la definición de un término, se puedan alcanzar con el mouse, con el teclado y con el dedo. Pasar el puntero o el foco sigue siendo una vista previa; un clic, un toque, Enter o Espacio la fija hasta que el jugador la suelta. Cumple WCAG 1.4.13 (hoverable, dismissible) y resuelve J7 de `feat/chapter-2` (scroll con teclado en la caja de inspección).

**Architecture:**
1. **Un solo código del comportamiento.** Carpeta nueva `src/ui/floating-box/` con su `CLAUDE.md`, porque `src/ui/` y `src/ui/incident/` ya tienen 12 archivos (el tope de `scripts/check-structure.ts`):
   - `use-floating-box.ts`: genérico por clave. Lleva el estado (`shown`, `pinned`), el margen de 400 ms (`useTimeout`), Esc (`useWindowEvent`) y el `pointerdown` fuera (`useClickOutside`), los tres de `@mantine/hooks`. Devuelve `trigger(key)` (las props de un disparador: `onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur`, `onClick`, `data-pinned`), `box` (las props del contenedor: `ref`, `onPointerEnter`, `onPointerLeave`), `shown`, `pinned`, `release()` y si el último pin fue con teclado.
   - Su test, y `term-tip.tsx` movido desde `src/ui/` con su test.
2. **La caja de inspección.** `src/ui/incident/use-inspection.ts` se construye sobre `useFloatingBox` y conserva solo lo propio de la caja: `data-scrolls` (el `ResizeObserver`) y soltar el pin cuando la pieza ya no tiene inspección (derivado del estado, sin efecto, si se puede). `InspectionBox` recibe si está fijada y cómo cerrarla; fijada, el `meta` de su `Card` lleva «Fijada» y un `Button` `small` «Cerrar»; enfoca su `h2` cuando el pin fue con teclado.
3. **La escena** (`src/scene/`). `src/scene/overlay/inspect-handlers.ts` deja de construir handlers. La escena declara el tipo de las props de un disparador y recibe de la UI una función `(pieceId) => props` en lugar de `onInspect` (la escena no importa la UI). `PieceLabel` une su `onClick` (abrir la tarjeta) con el del disparador; `StampPiece` usa las props tal cual. `src/scene/catalog/catalog-cells.tsx` pasa un disparador vacío. Las capturas de `#/entidades` no cambian; si cambian, se para y se informa.
4. **Copia** (`src/copy/screens/incident-ui.ts`). `INSPECTION_TEXT.pinned = 'Fijada'` e `INSPECTION_TEXT.close = 'Cerrar'`, justo después de `type` (lejos de las líneas que cambia `feat/chapter-2`). `SCREEN_TEXT.inspectHelp` = «Pasa el mouse o el foco por una pieza o un sello para ver qué es y cómo está. Haz clic, o pulsa Enter, para dejar la caja fija.»
5. **CSS.** Anillo de `[data-pinned]` en `.stamp` (`src/styles.css`) y en `.map-button` (`src/design/primitives/primitives.css`); «Cerrar» con `pointer-events: auto`; `.term-tip` sin `pointer-events: none`. `src/design/` no cambia en nada más.

**Tech Stack:** el de hoy (`package.json`), **sin dependencias nuevas**: `@mantine/hooks` 9.7.1 ya da `useTimeout`, `useWindowEvent` y `useClickOutside`; `@floating-ui/react-dom` 2.1.9 sigue posicionando la definición.

## Estado al cerrar (2026-10-11)

`pnpm check` verde: typecheck, lint, estructura y jscpd sin duplicados; Vitest, 1890 tests en 72 archivos; Playwright, 70 pasaron, 0 fallaron, 0 intermitentes; las capturas de `#/entidades` sin cambios.

**Desvíos del plan**, cada uno con su porqué:

- El anillo de la pieza fijada es una sola regla en `src/styles.css` para `.stamp` y `.map-button` (un anillo de tinta separado de la pieza por una línea de papel, con un `outline` en `forced-colors`), no una regla en `primitives.css` como decía la Arquitectura, punto 5: sirve a los dos y `primitives.css` tiene cambios sin commit en `feat/chapter-2`.
- `useFloatingBox` recibe un `scope` (las cajas de un mismo ámbito se pasan la vista previa al instante: una sola definición a la vez) y un `onPin(key, fromKeyboard)` opcional: la decisión de llevar el foco al `h2` se toma una sola vez, al fijar, porque recalcularla en cada render robaba el foco a una tarjeta nueva al cambiar de fase.
- `inspect-handlers.ts` pasó a `src/scene/overlay/inspect-trigger.ts` (solo tipos: `TriggerProps` e `InspectTrigger`).
- `src/ui/tagged-text.tsx` importa `./floating-box/term-tip` y no `@/ui/floating-box/term-tip`: la regla de carpetas pide, dentro de una capa, el archivo directo y sin `../`.
- «Cerrar» tiene el nombre accesible «Cerrar la caja de inspección» (`INSPECTION_TEXT.closeLabel`), para que quien oye el botón sepa qué cierra; el texto visible sigue siendo «Cerrar».
- Un término dentro de un botón o un enlace no fija su definición (el clic es del botón o del enlace); pasar el puntero de la definición de vuelta al término no la cierra.
- Con el teclado, desde el `h2`, Shift+Tab se detiene primero en el cuerpo con scroll (Chrome lo hace parada de Tab) y después llega a «Cerrar».
- Tests extra además de los del plan:
  - En Vitest: `a box pinned with the keyboard on a piece that opens a card does not take the focus when the phase changes` y `a pointer that goes from the definition back onto its term keeps it, and leaving the term closes it after the grace`.
  - En Playwright: `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` (con mouse y con Enter).
  - El test del 01-05 comprueba primero la vista previa sin fijar (se queda sobre la caja, sin «Fijada») y después fija con un clic.
  - `tests/e2e/chapter-1-play.ts` exporta `LOST_TO_OTHER_OFFICE`.

**Hallazgo que queda abierto**, sin arreglar aquí: a 1000×700, con la terminal abierta, una caja fijada que se desplaza (la del sello del ping perdido del 01-08) tapa el 14 % del borde derecho de «Enviar» y «Listo» de la terminal y toma el puntero ahí; sus centros quedan libres. Es el solapamiento de la caja con la terminal a ese tamaño que ya existía (J9 de `feat/chapter-2`). Antes la caja se iba al salir el puntero; ahora se queda hasta un clic fuera, «Cerrar» o Esc. Con una caja que cabe, los clics pasan.

## Problema (medido el 2026-10-11 con Playwright, build de producción, Chrome headless)

- La caja de inspección (`.incident__inspection`) vive solo mientras el puntero o el foco están en el sello o la pieza, y está fija abajo a la derecha del mapa. Al salir del disparador hay 400 ms para llegar a ella (`src/ui/incident/use-inspection.ts`, commit `b2f5a0d`), y cualquier otra pieza cruzada en el camino se queda con la caja al instante.
- 01-08 («La red de redes»), ping perdido de `tu-laptop` a 10.0.0.10, 1440×900: la caja está a 405–650 px del sello «?». Un viaje recto de 600 ms la alcanza 1 de 3 veces; de 900 ms, 0 de 3. Apuntando a la esquina más cercana se cruza «impresora» en 12 de 12 intentos. En el 01-14 (caso 4) la línea recta cruza «firewall tu-laptop» y falla a cualquier velocidad.
- Teclado: el foco abre la caja; Tab entra al cuerpo (Chrome hace enfocables los contenedores con scroll), pero la caja se cierra ~400 ms después porque no sigue el foco (el pendiente J7 de `feat/chapter-2`).
- Táctil: no hay hover; nada está diseñado para el dedo.
- La definición de un término (`src/ui/term-tip.tsx`) se abre solo con hover, tiene `pointer-events: none`, se cierra al salir y no se cierra con Esc: no cumple WCAG 1.4.13 (hoverable, dismissible).
- La prueba e2e actual pasaba porque el mouse de Playwright salta de golpe.

## Decisión (2026-10-11)

El estudiante eligió la **opción A, «Clic para fijar»**, tras probar un prototipo con cinco modos (no versionado). Decisiones del coordinador:

1. En una pieza que ya abre tarjeta con un clic (terminal, firewall, identificar), el mismo clic también fija su caja: una sola regla. Si al implementar se ve que confunde o choca con abrir la tarjeta, se para y se informa, sin improvisar.
2. Las definiciones de términos usan la misma lógica y el mismo código, para cumplir WCAG 1.4.13.
3. El sello «?» fuera de pantalla a 390×844 en el 01-08 no se arregla aquí: entra al [backlog](2026-10-08-follow-the-packet-followups.md) como J12 (J6–J11 ya existen en `feat/chapter-2`).
4. El puerto 4183 lo comparte el Playwright de `feat/chapter-2`: si está ocupado, esperar y reintentar; nunca matar un proceso ajeno.
5. Textos al jugador en español, llanos y cortos.

**Fuentes de la investigación** (consultadas el 2026-10-11):
- WCAG 2.1, 1.4.13: https://www.w3.org/TR/WCAG21/#content-on-hover-or-focus
- APG, patrón tooltip: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
- Radix issue #955 (para un «?» con información, Popover y no Tooltip): https://github.com/radix-ui/primitives/issues/955
- Radix HoverCard, «intended for sighted users only»: https://www.radix-ui.com/primitives/docs/components/hover-card
- Floating UI `useHover` y `safePolygon`: https://floating-ui.com/docs/useHover

Radix no se adopta aquí: Popover se ancla junto a un único disparador, y nuestra caja vive en un lugar fijo y la abren muchos disparadores. Lo que hace falta (Esc, clic fuera, temporizador) ya lo da `@mantine/hooks`.

## Comportamiento (el contrato)

### Vista previa (igual que hoy)

- Hover (mouse o lápiz) o foco en un disparador muestra su caja. Al salir, la caja espera 400 ms; se queda mientras el puntero esté sobre ella; otro disparador la toma al instante.
- Con el dedo (`pointerType === 'touch'`) no hay vista previa.
- Esc cierra la vista previa (WCAG 1.4.13, descartable). Tras Esc, la caja no se reabre por el foco que vuelve al disparador; vuelve con un hover o foco nuevo después de salir.

### Fijar

- Clic, toque, Enter o Espacio en un disparador fija su caja. La banda muestra «Fijada» y un botón «Cerrar» (un `Button` `small` en el `meta` del `Card`; la banda ya tiene `--focus-ring-on-ink`). El disparador lleva `data-pinned` y un anillo que no es solo color y no se confunde con el anillo de foco.
- Fijada, el hover y el foco en otros disparadores no la cambian. Un clic en otro disparador fija ese.
- Se suelta:
  - con «Cerrar»;
  - con Esc en cualquier parte de la página;
  - con un `pointerdown` fuera de la caja (en el mapa, en una tarjeta, en otro disparador: este último suelta y su clic fija el nuevo);
  - cuando lo que muestra deja de existir (la pieza ya no tiene inspección, por ejemplo en el caso siguiente de un diagnóstico).
- Puntero: la caja fijada toma el mouse solo si su texto no cabe (`data-scrolls`, como hoy); «Cerrar» siempre lo toma. Una caja fijada que cabe no se interpone entre el puntero y lo que hay debajo: un clic ahí la suelta y actúa sobre lo de abajo.

### Teclado

- Enter o Espacio en un sello o una pieza (un clic con `detail === 0`) fija la caja y lleva el foco a su `h2` (`tabIndex={-1}`), desde donde ↑, ↓ y AvPág desplazan el cuerpo. Shift+Tab llega a «Cerrar». Esc la suelta y, si el foco estaba dentro de la caja, lo devuelve al disparador.
- Excepción: si el mismo clic abre una tarjeta, la tarjeta se queda con el foco, como hoy; la caja queda fijada y se alcanza con Tab. Esc dentro de la tarjeta cierra la tarjeta (como hoy) y también suelta la caja: las dos salieron del mismo clic.

### Términos (`TermTip`)

- Misma lógica y mismo código. Hover con mouse muestra la definición. El puntero puede pasar a la definición sin que se cierre: deja de tener `pointer-events: none`, está a 6 px y el margen de 400 ms la cubre. Clic o toque en el término la fija; Esc o un `pointerdown` fuera la sueltan.
- Los términos siguen sin ser parada de Tab (decisión vigente en `src/ui/CLAUDE.md`): con teclado, la definición está en el glosario.
- Dentro de la caja de inspección los términos siguen sin definición flotante (`tips={false}`).

## Restricciones

- **Rama y árbol.** Árbol principal, rama `feat/chapter-1-fourteen`. No tocar `concepts/ami.md`, los cuatro documentos del capítulo 3 sin seguimiento, ni nada en `labs/`.
- **Rutas.** Las que empiezan por `src/` o `tests/` son relativas a `projects/follow-the-packet/`, donde se corren los comandos; las que empiezan por `docs/` o `projects/` son de la raíz del repo.
- **Puertos.** El 5180 y el 5173 son intocables (el estudiante juega en el 5180, servido desde este árbol: verá los cambios por recarga en caliente). Playwright usa el 4183 (ver la decisión 4).
- **Procesos.** Matar solo procesos propios, por PID. Nunca `pkill` ni `killall`.

## Tareas

- [x] **Tarea 0. Este plan** (este archivo), antes de cualquier cambio de código.
- [x] **Tarea 1. Hook compartido y `TermTip` (TDD).** `src/ui/floating-box/` con `use-floating-box.ts`, `term-tip.tsx` movido, sus tests y su `CLAUDE.md` (Arquitectura, punto 1). `src/ui/tagged-text.tsx` importa `@/ui/floating-box/term-tip`. Tests con nombre:
  - `a hover shows the box and leaving the trigger hides it after the grace`
  - `a click pins the box: leaving the trigger and hovering another one do not change it`
  - `Escape, a pointerdown outside and release unpin it`
  - `Escape closes a preview and the focus that comes back does not reopen it`
  - `a touch pointer shows no preview, and a tap pins`
  - `a term definition stays while the pointer moves onto it, a click pins it and Escape closes it`
- [x] **Tarea 2. Escena, caja de inspección, copia y CSS (TDD).** Arquitectura, puntos 2 a 5. Tests en `src/ui/incident/incident-screen.test.tsx`; los tests existentes del margen de 400 ms siguen valiendo:
  - `clicking a stamp pins its box with «Fijada» and «Cerrar», and hovering another piece leaves it`
  - `Enter on a stamp pins its box and puts the focus on its heading; Escape gives the focus back to the stamp`
  - `clicking a piece that opens a card opens it, keeps the focus in it and pins the piece's box`
  - `«Cerrar» unpins the box`
  - `a pinned box whose piece is gone is released`
- [x] **Tarea 3. Playwright en `tests/e2e/card-layout.spec.ts`.** `tests/e2e/` ya tiene 12 archivos: no se crea ninguno. Tests nuevos:
  - `a pinned box survives a human-paced trip across another piece and scrolls under the mouse`: 01-08, ping perdido a 10.0.0.10, a 1440×900, 1280×800 y 1000×700. Un viaje de unos 900 ms (30 pasos con espera) hacia la esquina más cercana de la caja, que a 1440×900 cruza «impresora». Al llegar, la caja muestra el ping y «Fijada»; la rueda lleva su última línea a la vista; Esc la cierra.
  - `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back`
  - `with touch, a tap pins the box and a tap outside releases it` (contexto con `hasTouch`)
  - `a term definition can be reached with the mouse, and Escape closes it`

  El test existente `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` (01-05) fija con un clic en vez de saltar dentro de los 400 ms, y conserva sus ventanas y comprobaciones.
- [x] **Tarea 4. Guías y documentos.**
  - `projects/follow-the-packet/DESIGN.md`: solo el párrafo de las medidas de una sola regla que describe la caja de inspección (hoy cerca de la línea 104). No tocar la tabla de primitivas, el párrafo «A card never clips» ni el paso 4 de «Adding a variant», que cambia `feat/chapter-2`.
  - `src/ui/CLAUDE.md`; `src/ui/incident/CLAUDE.md` (la viñeta de la caja); `src/ui/floating-box/CLAUDE.md`; la guía de `src/scene/overlay/` y la de `src/scene/` si nombran `inspect-handlers` u `onInspect`; `tests/e2e/CLAUDE.md`.
  - Fila J12 del [backlog](2026-10-08-follow-the-packet-followups.md), con lo medido: en el 01-08, a 390×844, el sello «?» del ping perdido a 10.0.0.10 queda en x = −45…−9 px, fuera de la ventana, y no se puede pasar el mouse ni tocar. Medido el 2026-10-11 con Playwright sobre el build de producción. Destino: «Pendiente».
- [ ] **Tarea 5. Cierre.** `pnpm check` verde (typecheck, lint, estructura, jscpd, Vitest y Playwright en el 4183). Revisión del diff por un subagente. Un commit en `feat/chapter-1-fourteen`, con rutas explícitas, sin push y sin merge.

## Al unir con `feat/chapter-2` (para el coordinador)

- `feat/chapter-2` ya incluye `b2f5a0d` y no cambia `use-inspection.ts`, `term-tip.tsx`, `tagged-text.tsx`, `inspect-handlers.ts`, `stamp.tsx`, `piece-label.tsx` ni `inspection-box.tsx`. Cambia `src/styles.css` en otras líneas (agrega `.output`, borra `.lucia__alert` y `.feedback`): git las une sin conflicto (comprobado con `git merge-file` el 2026-10-11).
- `src/ui/` gana la carpeta `floating-box/` y `term-tip.tsx` pasó a ella; `feat/chapter-2` no toca `term-tip.tsx` ni `tagged-text.tsx`.
- Conflictos esperables y pequeños:
  - `incident-screen.tsx` y `card-layout.spec.ts`: allá cambian una ruta de import (`map-cards/terminal/terminal-card` y `@e2e/chapter-1/chapter-1-play`).
  - `tests/e2e/chapter-1-play.ts`: aquí se agrega un `export` (`LOST_TO_OTHER_OFFICE`); allá el archivo pasó a `tests/e2e/chapter-1/chapter-1-play.ts`. La detección de renombrados de git debería llevar el cambio; comprobado el 2026-10-11: la detecta (99 % de parecido) y la unión de ese archivo no da conflicto.
  - `game-scene.tsx`: allá cambia la línea de `MapCanvas`.
  - `tests/e2e/CLAUDE.md`.
  - `src/scene/overlay/CLAUDE.md`, `src/scene/entities/CLAUDE.md`, `src/ui/CLAUDE.md` y `src/ui/incident/CLAUDE.md`: allá cambia su primer párrafo; aquí, la viñeta de la caja y los imports.
  - `DESIGN.md`: allá, cambios sin commit para `Table`; aquí solo cambia el párrafo de las medidas de una sola regla (cerca de la línea 104).
  - `src/copy/screens/incident-ui.ts`.
  - La tabla J del backlog: allá J6–J11 van después de J5, aquí J12 va después de J5; conservar las dos, con J12 al final. La frase de entrada del «Bloque J» no se toca aquí.
- Este cambio resuelve J7 de `feat/chapter-2` (scroll con teclado en la caja de inspección).
