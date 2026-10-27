# Sigue el paquete: el casco fijo de la interfaz

Fecha: 2026-10-26 · Estado: aprobado por el estudiante el 2026-10-26. El estudiante decidió ocho puntos el 2026-10-26 (ver «Decisiones del estudiante»). Lo demás sale del prototipo S2 que vio o son llamadas mías, y está en «Decididas sin el estudiante (para revisar)»: el estudiante las revisa cuando se le entregue este documento, y una vez aprobado el documento esas llamadas quedan resueltas para planear. Dos puntos siguen abiertos y se deciden con un prototipo dibujado: «Abierto, para el estudiante». Se escribió leyendo `feat/chapter-3` en `ce44cb3`. El plan de implementación se escribe cuando termine la segunda tanda del bloque 3 (T0a, T0b y T1 hechas): su base es ese commit y lee el código de ahí (T0b agrega una línea de papeles al marco de la tarjeta de pieza, en `piece-card.tsx`). Prototipos: S1, la barra de estado (https://claude.ai/artifact/3LRHd1ZyksDbvCvJejzyNv, se decidió la opción D) y S2, el casco entero (https://claude.ai/artifact/8oisrSv9wq8UaHFKoZyVzE). Registro de la conversación: `.superpowers/sdd/2026-10-25-follow-the-packet-fixed-shell-brainstorm/progress.md`.

Marcas: **(R)** lo decidió el estudiante. **(P)** lo propuso el prototipo S2 y el estudiante lo vio, pero no lo decidió por separado. Todo (P) y toda llamada mía se repite en «Decididas sin el estudiante».

## Resumen

1. Un solo casco para todos los capítulos, con ocho lugares fijos. Un capítulo agrega contenido dentro de ellos; no agrega lugares.
2. Disposición A (R): Lucía y el panel de la pieza elegida van en una columna fija a la derecha. El estudiante oyó «nada flota sobre el mapa». La **única excepción** es la vista previa de la caja de inspección al pasar el mouse (P); repite la pestaña «Estado», así que ninguna información es solo de mouse.
3. El panel de una pieza tiene seis pestañas fijas, siempre en el mismo orden (R). Lo que crece va en fichas dentro de «Tablas».
4. Lo que el incidente no ofrece se esconde (R). Solo un botón de acción (Enviar, Agregar …, Aplicar) se desactiva, con la razón escrita al lado. Pestañas, fichas, secciones, herramientas y filas del menú se muestran o se esconden, nunca se desactivan.
5. Una barra de estado siempre visible, en todo incidente, dice la línea más nueva del registro y su porqué; «Registro (N)» abre todas (R). El aviso «Cambiaste …» se muda allí con las mismas palabras (R).
6. Dos primitivas nuevas, `Menu` y `Dialog`, con Radix (R). El menú de la pieza es un atajo: no hace nada que el panel no haga.
7. El motor lee una sola tabla de «qué es cada cosa del casco» en vez de los `known.has` de lugar y de los dos `switch` de 11 casos de `piece-card.tsx`.
8. Cuesta: 12 archivos de nivel que nombran una pestaña o tarjeta, unos 26 archivos de prueba que hablan de tarjetas como `dialog`, y la V33 del bloque 3, que se vuelve a cortar. El bloque 3 se pausa después de T1 (R).
9. Abiertos: las hojas a 360 px y la definición de un término dentro de un control.

## Por qué

- **Lo que pidió el estudiante (2026-10-25).** Un solo motor y un solo casco para todos los capítulos, como en The Sims, Cities: Skylines y, dijo, «Incluso como Trópico» (Tropico). Cada capítulo agrega solo contenido y esconde o desactiva lo que no aplica. De esos juegos le gusta que «todo está muy bien organizado»: cada tipo de cosa tiene su sitio fijo. Dio como ideas el clic derecho, las ventanas de ajustes y una barra de estado. Ante una maqueta que solo trataba la barra de estado preguntó: «¿No íbamos a mirar la UI en general?».
- **El dolor (jugando 02-06).** La ruta que usó el paquete solo se ve en la pestaña de la tabla de rutas. La consecuencia queda donde el jugador no mira.
- **Dos principios que confirmó.** (1) Toda consecuencia de una acción llega a un sitio que siempre se ve. (2) El detalle completo está a un clic, nunca escondido.
- **Hoy** no hay menú contextual, ventana modal ni barra de estado. Lo que el jugador puede usar se decide por término enseñado en varios sitios. Una clase nueva de tabla tocó unos 40 archivos (cifra del registro de la conversación; no se midió de nuevo).
- **De Tropico** se tomaron tres ideas, dichas en general: el consejero en una esquina fija (la ranura de Lucía), el almanaque y el panel de un edificio con sus ajustes (la pestaña «Ajustes»).

## Metas, no metas y antimetas

**Metas**

1. Los mismos ocho lugares, en el mismo sitio y con la misma forma, en todos los incidentes.
2. Cumplir los dos principios en cada incidente.
3. Un incidente nuevo es contenido: su archivo de nivel y sus textos. Solo una clase nueva de contenido pide además una entrada en la tabla del motor.
4. Acción directa: clic elige, menú de la pieza, ventana para cambiar un ajuste.
5. Se juega a 360 px, con teclado y con toque.

**No metas**

- No es un sandbox. El curso va en orden y el roadmap ya muestra lo que viene («Próximamente»); el casco no muestra lo futuro.
- El motor puede ganar campos nuevos y aditivos en su resultado, solo si la barra de estado necesita un dato que la traza no trae. El dorado `src/levels/04-iaas/golden-traces.json` nunca se edita: un campo nuevo se tolera con `ADDED_KEYS` en `src/levels/04-iaas/golden-traces.test.ts` (hoy `new Set(['firewallKind'])`; la función `recorded` quita esas claves de la traza antes de compararla con el archivo). Precedente: `firewallKind`, agregado en el commit `0f936a6`. Para «Ver fila» no hace falta ningún campo (ver «La barra de estado y el registro»).
- No cambia cómo se dibuja el mapa (`src/scene/layout/`), solo se retira lo que ponía tarjetas junto a las piezas.
- No cambia los tokens ni el aspecto: un solo tema claro.
- No hay sección «Piezas» en el almanaque (R), ni «Más» en las herramientas, ni zoom.
- No cambia el roadmap (`#/`), la pantalla de aviso ni el catálogo (`#/entidades`).
- No migra progreso guardado.

**Antimetas (si pasa, el casco falló)**

- Un capítulo que necesita un lugar nuevo, una primitiva nueva o una séptima pestaña. Eso reabre este diseño; no se resuelve dentro del capítulo.
- Información que solo aparece al pasar el mouse.
- Una pestaña, ficha, sección, herramienta o fila de menú desactivada (se muestra o se esconde), o un botón desactivado cuya razón enseña un término todavía no enseñado.
- Una consecuencia que solo se ve en un sitio donde el jugador no está mirando.
- Código del casco que pregunte por capítulo o por incidente (`if (chapter === 3)`): el casco se declara con datos.
- Una caja flotante, una definición o un menú que tape un control.
- Un texto de la barra de estado que la traza no traiga: se agrega al resultado del motor, no se calcula en la vista.
- Un texto de nivel que nombre una pestaña, tarjeta o caja que ya no existe, aunque sea entre dos rebanadas.

## Restricciones

- **Reglas del repositorio** (`projects/follow-the-packet/.claude/rules/`): `english-only` (código, nombres, pruebas y guías en inglés; el español solo en `src/copy/` y en los archivos de nivel); `no-comments` (solo JSDoc de entrada y salida); `exact-dependency-versions` (`pnpm add`, sin `^` ni `~`); `prefer-established-libraries` (Radix para estas dos primitivas, `@floating-ui/react-dom` sigue para las definiciones); `folder-structure` (tope de 12 archivos por carpeta, guía `CLAUDE.md` en cada carpeta nueva, capas `app → ui → game · scene · storage → levels → copy → engine`); `view-renders-domain-result`; `caller-controls-visibility` (quien coloca un componente decide si se dibuja: lo oculto se decide en la pantalla, no dentro del componente); `no-raw-effects` (efectos solo en `use-*.ts`); `dry` (`jscpd` en 0); `no-magic-strings`.
- **Una norma por elemento** (`DESIGN.md`): una primitiva nueva solo para un papel que ninguna variante cumple; lleva archivo, prueba, espécimen en `src/ui/catalog/interface-section.tsx` y fila en la tabla de `DESIGN.md`; las dos capturas de tolerancia cero del catálogo se regraban a propósito. Una primitiva no recibe `className` ni `style`.
- **`rigorous-plain-copy`.** Nombres oficiales de AWS, cada término definido donde aparece (máximo 120 caracteres), frases cortas. Un texto del casco (nombre de pestaña, fila de menú, razón de un botón desactivado, línea vacía de la barra) nunca nombra un término antes de enseñarlo: se escribe con `word(known, término, palabra llana)`.
- **`explained-behavior-changes`.** El casco nunca esconde la causa de un cambio: el aviso «Cambiaste …» y el aviso de la ventana de ajustes la nombran.
- **El progreso se puede reiniciar.** Las estrellas guardadas se reinician, nunca se migran: si algo del casco obliga a cambiar el formato, se sube la clave (hoy `follow-the-packet:progress:v2`) y la vieja se borra sin copiarse, como ya hace `loadProgress`. El casco, como está diseñado, no cambia el formato.
- **360 px.** Sin desplazamiento lateral de la página; el mapa se desplaza dentro de su caja, como hoy.
- **Accesibilidad.** Todo lo que hace el clic derecho tiene un equivalente de teclado y de toque, que es la pestaña del panel. Una razón de «desactivado» es texto visible, no globo. Foco visible, foco devuelto al cerrar, `prefers-reduced-motion` y «Sin animaciones» respetados por cualquier movimiento nuevo.
- **Pruebas.** Primero la prueba que falla (jsdom y modo navegador de Vitest; Playwright solo para jugar un capítulo entero). Sin esperas fijas, `retries`, `skip` ni `fixme`. No se debilita una prueba para que pase.

## Decisiones del estudiante (2026-10-26)

1. **(R) Disposición A.** «Vamos con la A». Lucía y el panel de la pieza elegida comparten una columna fija a la derecha; nada flota sobre el mapa.
2. **(R) Seis pestañas fijas.** «perfecto». Estado · Ajustes · Tablas · Terminal · Navegador · Preguntas, en ese orden. Una pestaña que la pieza no tiene no se dibuja y las demás conservan su orden. El crecimiento de un capítulo entra como fichas dentro de «Tablas», nunca como séptima pestaña.
3. **(R) Esconder o desactivar.** «Ok». Se esconde lo que el incidente no ofrece (así no se adelanta ningún término). Se desactiva solo lo que ofrece y hoy no se puede usar, con la razón como texto visible al lado: sin globo que solo sale al pasar el mouse, y legible en el teléfono. Qué se desactiva, en concreto, está en «Decididas», llamada 9.
4. **(R) Barra de estado y registro.** «Sí, me sirve» (opción D de S1). Cerrada, muestra el último envío o cambio con su porqué, siempre a la vista. «Ver fila» abre el detalle con la fila marcada. «Registro (N)» lista todos los envíos; los idénticos van juntos y se pliegan (la regla de la V32 del bloque 3).
5. **(R) El aviso de cambio se muda.** «AH sí, me parece» (tras una explicación llana). `RESTART_TEXT.notice` (`src/copy/screens/incident-ui.ts`) sale de la tarjeta de Lucía y va a la barra de estado, con las mismas palabras. La ranura de Lucía queda solo para su consejo (pistas y respuestas).
6. **(R) Almanaque.** «perfecto». Octavo lugar, se abre desde la barra superior. Dos secciones: **Términos** (el glosario de hoy, movido) y **Lecciones** (el `takeaway` que cada incidente resuelto ya tiene). Solo lo que el jugador ya vio. **Piezas** queda para después (hay texto nuevo que escribir y verificar).
7. **(R) `Menu` y `Dialog` con Radix.** «A». Misma familia que `Tabs`, para que menú, ventana y pestañas no se pisen en capas y foco. Las versiones exactas se comprueban al implementar con `pnpm view` y la regla de 14 días. Esto resuelve `prefer-radix` solo para estas dos.
8. **(R) El orden.** «1». Se termina la primera tanda del bloque 3 (T0a, T0b, T1: trabajo de mapa, motor y nivel que no depende del casco). Luego el bloque 3 se pausa, se escribe este diseño, se construye el casco, y T2 a T7 se vuelven a planear sobre él.

## Los lugares del casco

Los números son los de S2. El menú de la pieza (3) y la ventana de ajustes (5) no ocupan espacio: aparecen encima cuando se piden.

| Lugar | Qué guarda | Hoy (verificado en el código) |
|---|---|---|
| 1 Barra superior | Título del incidente (`h1`), «← Roadmap», «Sin animaciones», botón «Almanaque» (R). El reloj del juego solo si el incidente tiene reloj (P). | `header.incident__bar` flota sobre los 56 px de arriba del mapa (`src/ui/incident/incident-screen.tsx`). El reloj es `ClockCard` («Reloj del juego», `CLOCK_TEXT.title`) en el panel lateral, solo si `clockSteps(session)` no está vacío. |
| 2 Herramientas (P) | Una fila de botones: **Terminal** y **Navegador**. Cada uno abre la pestaña del mismo nombre de la pieza que la tiene; con varios orígenes, la del último origen usado o, al empezar, la del primero de `send.from`. Una herramienta que ninguna pieza del incidente ofrece no se dibuja, y terminado el incidente ninguna se dibuja. | No existe: la terminal y el navegador son pestañas de la tarjeta de una pieza. |
| 3 Mapa | Piezas, etiquetas, sellos, paquetes y tubos como hoy. Clic, Enter o Espacio **elige** (R). Clic derecho, la tecla de menú, Mayús+F10 o pulsación larga abren el menú de la pieza (P). La vista previa al pasar el mouse sigue flotando (P). | Un clic abre la tarjeta de la pieza si tiene una y, si no, fija su caja. El menú no existe. |
| 4 Panel de lo elegido (R) | La pieza elegida, con sus pestañas (ver abajo), o el sello o paquete fijado en «modo paquete» (los campos de la caja de inspección). Sin nada elegido: la nota de ayuda y la leyenda de sellos (P). | Tarjetas que flotan junto a la pieza (`overlay` de `GameScene`, ubicadas por `src/scene/cards/`) y la caja de inspección fijada. |
| 5 Ventana de ajustes (P) | Un ajuste que cambia la red: fichas, «Ahora → Al aplicar», el aviso de lo que se borra, «Aplicar» y «Cancelar». | Elegir una ficha en la tarjeta aplica al instante (`setSetting`). |
| 6 Panel de Lucía (R) | Ranura «Mensaje de Lucía», informe, tareas, «Enviar solución». Debajo, como hoy: tarjeta de caso, pregunta de explicación y resultado. | La tarjeta de Lucía (`side-cards/lucia-card.tsx`), con las pistas, la respuesta a una solución rechazada y la alerta en tres sitios distintos. |
| 7 Barra de estado y registro (R) | Ver la decisión 4 y «La barra de estado y el registro». Siempre visible, abajo, en todo incidente. | No existe. |
| 8 Almanaque (R) | Términos y Lecciones, en una `Dialog` con `Tabs`. | `details.lucia__glossary` («Glosario») dentro de la tarjeta de Lucía. |

**La columna (escritorio, más de 900 px) (P).** El casco llena la altura de la ventana y la página no se desplaza. La barra superior y la de estado son fijas; el mapa va a la izquierda. A la derecha, Lucía arriba (la ranura «Mensaje de Lucía» fija en su parte alta, su cuerpo con desplazamiento propio y un tope de una parte del alto) y el panel de la pieza debajo, con el resto del alto y su propio desplazamiento. Sin botón para plegar a Lucía en esta versión. Las alturas exactas son del constructor y se comprueban con pruebas en modo navegador. A 900 px o menos se queda el apilado de hoy (`@media (max-width: 900px)` en `src/styles.css`), con la barra de estado fija abajo de la ventana para que la consecuencia se vea siempre; las hojas de S2 están abiertas.

**El panel de una pieza (4).** La franja lleva el nombre de la pieza. Las seis pestañas salen de las 11 clases de contenido de hoy (`PieceTabId` en `src/game/view/cards/piece-card.ts`):

| Pestaña | Contenido de hoy que recibe |
|---|---|
| Estado | Los campos de la caja de inspección de la pieza (`inspect`, `InspectionFields`): qué es, IP, servicios, firewall. Siempre existe. |
| Ajustes | `settings` («Ajustes de red») y `services` («Servicios») como **secciones** una bajo otra; cada ajuste muestra su valor y «Cambiar…», que abre la ventana (5). La línea del DNS que presta DHCP queda de solo lectura. |
| Tablas | `routes`, `translations`, `records`, `cache` y `sites`, una **ficha** cada una, con el nombre de hoy. Las reglas de un firewall (`TaskCard`) entran aquí con sus dos fichas de sentido (`TASK_CARD_TEXT.tabs`: `entrada` y `salida` en un firewall de host, `regla de entrada` y `regla de salida` en un Security Group). |
| Terminal | `terminal`, con sus bandejas, su «Enviar» y su «Salida». |
| Navegador | `browser`. |
| Preguntas | `identify` y `classify`: una pestaña, con dos fichas cuando la pieza tiene las dos. |

Una pieza con candado (`locked`) se elige igual y su panel solo tiene «Estado». Terminado el incidente (`session.phase` distinto de `playing`), hoy ninguna tarjeta abre (`opensCard` exige `playing`); en el casco la pieza se elige igual, su panel muestra solo «Estado» y las herramientas se esconden.

## Dónde va todo lo de hoy

Solo lo que cambia de sitio o de forma. Lo que no aparece sigue igual (mapa, etiquetas, candado, sellos, tubos; tarjeta de caso, pregunta de explicación y resultado, en el panel de Lucía; `TaggedText`, que es un comportamiento y no un lugar).

| Hoy | En el casco |
|---|---|
| Tarjeta de pieza junto a la pieza (`PieceCard`, `TaskCard`) | Panel (4). `Single` y `frameOf` desaparecen: una pieza siempre muestra pestañas. |
| Terminal y navegador como pestañas de la tarjeta | Pestañas del panel y, además, atajos en las herramientas (2). |
| Caja de inspección de una pieza, al pasar el mouse | Sigue como vista previa (P) y, con un clic, es la pestaña «Estado». |
| Caja fijada de un sello o paquete | Panel en modo paquete, con su botón «Cerrar». |
| `InspectHelp` (nota de ayuda y leyenda de sellos) | Panel (4) cuando no hay nada elegido (P). |
| `SCREEN_TEXT.noRoomForTheBox` («La tarjeta ocupa el sitio de la caja…») | Se borra: sin tarjetas junto a la pieza, la caja ya no disputa sitio con ellas. |
| `ClockCard` | Barra superior (P). |
| Glosario desplegable | Almanaque, «Términos». Los términos nuevos del incidente siguen primero y con su marca «nuevo». |
| Aviso «Cambiaste …». Hoy sale en **dos** sitios: la respuesta de Lucía (`lucia-card.tsx`) y bajo el informe de la tarjeta de caso (`case-card.ts`, campo `restart`) | Una línea del registro, que la barra muestra mientras sea la más nueva, en un `Message` de variante `note` con el texto de `RESTART_TEXT.notice` tal cual. |
| Pistas, respuesta a una solución rechazada y alerta «¡Algo raro está entrando!» (tres sitios de la tarjeta de Lucía) | Una ranura fija «Mensaje de Lucía» en la franja de su panel (P). |
| Rechazo de una entrada de tabla (`TABLE_TEXT`: «No se pudo agregar. …»; `Session.entryProblem`) | Sigue bajo la tabla, y además es una línea del registro. |
| Último envío (sello y caja) y lista de envíos | Barra de estado y «Registro (N)». |
| Elegir una ficha de ajuste aplica al instante | Ventana (5) con «Aplicar» (P). Los cambios de tabla y de reglas («Agregar ruta», «Agregar registro», «Agregar sitio») no usan la ventana: su botón ya es el «Aplicar». |

**La barra de estado y el registro, con precisión.**

- **Qué es una línea.** (a) Todo paquete o sello que el mapa muestra: un envío del jugador o un flujo vivo del incidente (`session.runs`). (b) El cambio que vació los envíos, con su aviso. (c) Un rechazo de una entrada de tabla. La barra muestra la línea más nueva y el título «Registro (N)» cuenta todas. Al empezar, sin líneas, la barra muestra **una línea vacía** (el texto lo fija el plan, con `rigorous-plain-copy`: sin términos todavía no enseñados).
- **Mecánicas sin envíos.** Los incidentes `filter` (01-12, 01-13, 02-05, 04-01, 04-02) no tienen envíos del jugador: el mapa dibuja sus flujos vivos con sello, y cada flujo es una línea, en el orden con que `inspect` ya los lista. Un `identify` (01-01, 02-04) tiene las líneas de sus flujos, si los tiene (01-01 declara `flows: []`: ve la línea vacía). Un `diagnose` (01-14, 02-14) tiene envíos en cada caso, y el registro empieza de nuevo con cada caso (el caso nuevo vacía `sent` y `history`). Una regla puesta en un `filter` llega, como hoy, a los sellos del mapa y a las tareas de Lucía; no deja línea de cambio, porque no vació envíos.
- **Cada línea se arma con los constructores de vista que ya existen** (`inspect`, `routeField`, `headerFields`, `describeResult`); la barra no escribe frases propias. Si le falta un dato a la traza, se agrega un campo aditivo (ver «No metas»).
- **«Ver fila» no necesita campo nuevo.** `history` guarda cada envío como `SentPacket`, que lleva su `trace` completo, y `Trace.routes` (opcional) trae la decisión de ruta de cada router del camino. Un envío que nunca salió (IP inválida, sin cable, a sí mismo) no tiene `routes` y su línea no lleva «Ver fila». Lo que falta es de la vista: `routesCard` hoy marca la fila del último paquete y debe recibir el número de envío que se marca.
- **La sesión guarda las líneas.** `Session.restart` se pone en `null` con el siguiente envío (`session.ts`) y un rechazo (`Session.entryProblem`) no está en `history`, así que ninguno de los dos alcanza para el registro. La forma de guardarlas es del constructor.
- **El registro lista lo que ocurrió desde que el mundo cambió por última vez.** Un cambio vacía `sent` y `history` (`src/game/session.ts`), y los envíos de antes eran con la red anterior. El cambio que los vació queda como primera línea, con su aviso; los rechazos de antes se van con el resto. Un cambio que no vacía envíos no deja línea (como hoy no deja aviso).
- **El texto del aviso es una sola frase con dos puntos** («Cambiaste la puerta de enlace predeterminada de tu-laptop: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.»). S2 la dibuja partida en dos líneas; manda lo decidido: las mismas palabras, sin partir ni cambiar mayúsculas.

## Lo que necesita el motor

Hoy lo que el jugador puede usar se decide en sitios repartidos (verificado):

- **Por término, en las vistas.** `session.known.has(…)` de lugar en `src/game/view/cards/table-card.ts` (siete lecturas: `routing-table`, `next-hop`, `dns-query`, `translation-table`, dos de `dns-ttl`, `dns-cache`), `settings-card.ts` (`dhcp`), `web/browser-card.ts` (`cookie`), `src/levels/ladder.ts` (`configurableParts`, que abre las reglas de un firewall por `RULES_TERM`), `pieces.ts` (`isDrawn`) y `inspection.ts` (`visible`, por el `term` de cada campo). El prototipo S2 nombraba también `piece-card.ts`; ese archivo no tiene `known.has`, decide por el contrato.
- **Por contrato.** `PIECE_CARDS` (7 clases), `cardsOfPiece`, `firstCardOf`, `shown`, `SETTING_KINDS` y `send.opensFirst` en `src/levels/contract/incident.ts`.
- **Por dos `switch` de 11 casos** en `src/ui/incident/map-cards/piece-card.tsx` (`Single` y `frameOf`), más `tabs()`, `OPENS_FIRST` y `firstOf` en `src/game/view/cards/piece-card.ts`.

**Lo que el casco agrega:**

1. **Una tabla única de contenido** (en una carpeta nueva bajo `src/game/view/`, porque esa carpeta está llena). Una entrada por clase de contenido: en qué pestaña (y ficha o sección) vive, qué dice el contrato que la ofrece, qué término la abre (o ninguno) y cómo se arma su marco (`CardFrame`: título, icono, cuerpo, acciones). Agregar una clase es una entrada, no dos cambios de `switch`. Reemplaza los `known.has` de lugar y los dos `switch`.
2. **Un resolvedor puro** `shellOf(session)` que dice qué se **ve** (ofrecido y enseñado) y qué se **esconde** (no ofrecido o no enseñado) para herramientas, pestañas, fichas y secciones de cada pieza, filas del menú y ajustes, y qué **botones de acción** se desactivan ahora. No se escribe a mano para los 36 incidentes: sale del contrato y de la escalera de términos.
3. **Razones de «desactivado»** como datos en `src/copy/`: un texto por clase de razón, como función de `known`, solo para botones de acción. Las que ya existen o salen de S2: `TERMINAL_TEXT.incomplete` («Elige una ficha de cada bandeja.») para «Enviar» y para «Agregar …» sin fichas elegidas, y «Elige otro valor para aplicar.» para «Aplicar» sin cambio (P). Una prueba recorre todos los incidentes y exige que ninguna razón nombre un término no enseñado.
4. **La pestaña con que abre una pieza** sigue una precedencia fija, traducida a seis: Preguntas, Terminal, Navegador, Ajustes, Tablas y, por último, Estado. Ningún nivel fija `opensFirst` hoy (solo lo usan pruebas y `src/testing/incidents.ts`), así que se borra del contrato, con su revisión en `incident.ts`, `firstCardOf`, `OPENS_FIRST` y `firstOf`, en la rebanada de la tabla de contenido, salvo que un nivel lo fije al escribir el plan.

El resolvedor **no** reemplaza: el contenido de cada pestaña (escribir una tabla nueva sigue siendo trabajo), `shown`, la elección de palabras según el término (`word(known, …)`, que es redacción y no lugar), ni los guardianes de la escalera (`src/levels/ladder.test.ts`, `unofficialNames`).

## Primitivas nuevas

| Primitiva | Para qué | Notas |
|---|---|---|
| `Menu` | Menú de la pieza: `role="menu"`, flechas, Esc, devuelve el foco. | Radix `ContextMenu` (clic derecho y pulsación larga). Archivo en `src/design/primitives/`, que hoy tiene 9 de 12 archivos: con su prueba queda en 11. |
| `Dialog` | Ventana de ajustes y almanaque: velo, foco atrapado, Esc, fondo inerte. Se viste con `Card`. | Radix `Dialog`. Va en `src/design/primitives/panels/` (7 de 12 hoy). |

- Las dos justifican primitiva y no variante: ninguna otra cumple el papel (`DESIGN.md`, regla «una norma por elemento»). Cada una trae espécimen en el catálogo y se regraban a propósito las dos capturas.
- «Desactivado con razón» no es una primitiva: es `Button` con la razón como texto al lado, el control enfocable (`aria-disabled`, no `disabled`) y la razón enlazada con `aria-describedby`, con el mismo aspecto de hoy. Es un cambio de comportamiento de `Button`, con su prueba.
- Se actualiza `prefer-established-libraries.md`: Radix para `Menu` y `Dialog`, con versión y fecha; `prefer-radix` queda resuelto solo para estas dos.

## Choques y costos conocidos

**V33 del bloque 3.** El plan (`docs/plans/2026-10-25-follow-the-packet-chapter-3-block-3.md`, T5 y T6) y la decisión V33 C del estudiante dan a `servidor-app` una pestaña «Servicios» en el 03-09, con dos pestañas «Ajustes» y «Servicios» que caben en 272 px, y a `servidor-nuevo` las pestañas «Sitios» y «Orígenes». En el casco: «Servicios» (la bandeja «El programa de la app · TCP 3000») y los ajustes de la app («IP del cliente», «Idle timeout») pasan a **secciones de «Ajustes»**, y «Sitios» y «Orígenes» a **fichas de «Tablas»**. Hoy «Servicios» ya es una pestaña de los dispositivos (02-03), y también se pliega. Las pruebas de T6 `the tabs of servidor-app are called Ajustes and Servicios` y `at 360 px the two tabs of servidor-app fit without scrolling the tab bar` se reescriben al volver a planear T5 y T6. Los avisos nuevos del bloque (`process`, la IP del cliente, el idle timeout) ya van a la barra de estado.

**Textos que nombran una pestaña, una tarjeta o la terminal por su lugar** (búsqueda con `git grep` en `src/levels` y `src/copy`, 12 archivos de nivel):

- `src/levels/01-first-day/where-you-are/01-the-office.ts` («abre su tarjeta»)
- `src/levels/01-first-day/where-you-are/02-the-envelope.ts` («abre su terminal»)
- `src/levels/01-first-day/the-ping/03-are-you-there.ts` («abre su terminal»)
- `src/levels/01-first-day/leaving-the-office/07-who-gets-whats-outside.ts` («Ajustes de red», dos veces; una dice «Elígela», que con la ventana pasa a «Cámbiala … y aplícala»)
- `src/levels/01-first-day/the-guard/13-in-and-out.ts` (pista: «pestaña «salida»», la ficha de sentido del firewall)
- `src/levels/02-ports-and-names/ports-and-rules/03-refused-or-silent.ts` («pestaña «Servicios»»)
- `src/levels/02-ports-and-names/ports-and-rules/04-is-it-in-my-block.ts` («Clasificar» y «Preguntas»)
- `src/levels/02-ports-and-names/which-way/06-your-routing-table.ts` («pestaña «Tabla de rutas»»)
- `src/levels/02-ports-and-names/one-address/08-one-address-for-the-whole-office.ts` («pestaña «Tabla de traducciones»»)
- `src/levels/02-ports-and-names/names/10-asking-for-a-name.ts` («pestaña «Ajustes de red»»)
- `src/levels/02-ports-and-names/names/12-still-the-old-ip.ts` («Reloj del juego» y «La tarjeta de {resolver}»)
- `src/levels/03-the-web-inside/asking-for-a-page/04-one-server-many-sites.ts` («tarjeta «Sitios»»)

Con el casco, esos nombres pasan a ser una pestaña del panel (Ajustes, Tablas, Terminal, Preguntas), una ficha o sección dentro de ella, o una barra distinta (el reloj). **Cada texto se corrige en la rebanada que cambia lo que nombra** (ver «Migración y pruebas»), sin adelantar términos. Además, **24 archivos de nivel** dicen «la caja» (la caja de inspección; p. ej. `src/levels/01-first-day/first-watch/cases.ts`, `src/levels/02-ports-and-names/names/10-asking-for-a-name.ts`). Se conserva el nombre: el modo paquete del panel y la vista previa siguen llamándose «Inspección» y esos textos no cambian. Una prueba de barrido, «toda pestaña, tarjeta o caja nombrada existe en el casco», llega con la primera rebanada.

**La vista previa de la caja de inspección.** Es la única excepción a «nada flota sobre el mapa». Sigue abajo a la derecha del mapa (`.incident__inspection`), y `use-inspection.ts` sigue evitando las marcas del mapa (`inspectionPlace`, `inspectionRoom`). Se va lo que existía por la tarjeta: el segundo lugar de la caja, `noRoom` y su nota. Solo la caja **fijada** tiene lugar fijo (el panel).

**El defecto de la definición que tapa un control** (hallado en T0a el 2026-10-26). Al elegir una ficha de dirección en la terminal, la «Salida» del envío anterior desaparece y las bandejas suben bajo un mouse quieto. El mouse cae sobre el «puerto» de una ficha, se abre su definición (`TermTip`) y tapa la ficha siguiente (`nc · puerto 3000`, en `pinned-box.browser.test.tsx`, helper `sendNc`). En la base solo se salvaba por 1 px. El estudiante lo dio por defecto del producto: **el casco no puede dejar que una definición al pasar el mouse tape un control.** Cómo se logra está abierto (punto 2 de «Abierto, para el estudiante»); hasta entonces queda el comportamiento de hoy. Criterio de aceptación para lo que se elija: una prueba en modo navegador recorre cada término de cada estado del panel, pasa el mouse (y el foco) y falla si la caja de la definición se cruza con un control que no sea el suyo. La causa de fondo (el diseño se corre bajo un puntero quieto) no se arregla aquí; se descartó ignorar el `pointerenter` sin movimiento porque las pruebas del navegador no distinguen un mouse real (`t0a-report.md`, ronda 0).

## Migración y pruebas

**Capítulos existentes.** Los 36 incidentes registrados (14 del capítulo 1, 14 del 2, 6 del 3 y 2 del 4, contados por archivo) pasan al casco a la vez: el casco es uno y no hay bandera. Sin declarar nada, cada incidente obtiene el casco que su contrato y su escalera de términos dan. Lo único a mano son los 12 textos de arriba.

**Qué pruebas toca** (por clase; no se corrió ninguna):

- **Ayudantes que hablan de tarjetas como `dialog`**: `card()`, `openCard()` y `openTerminal()` de `src/testing/browser-play.ts` y de `tests/e2e/cards.ts` (`getByRole('dialog', { name })`). El panel no es un `dialog`: es una región con nombre. El único `dialog` real es el modal. Unos 26 archivos usan esos ayudantes o el rol: `src/ui/incident/map-cards/**` (12 pruebas), `src/ui/incident/geometry/**` (6), `incident-screen.test.tsx`, `code-style.browser.test.tsx`, y `tests/e2e/{cards,chapter-1/chapter-1-play,chapter-2/chapter-2-play,incidents.spec,phone.spec}`.
- **Geometría de tarjetas junto a la pieza**, que ya no existe: `src/scene/cards/` (`placement.ts`, `slot.ts` y sus pruebas), `src/scene/overlay/card/` (`card-anchor`), `MAP_CARD` en `src/scene/html-layer.ts`, el `overlay` de `GameScene`, `inspection-beside-cards.browser.test.tsx` y la parte de `card-layout.browser.test.tsx` y `map-boxes.browser.test.tsx` que mide esas tarjetas. Se borran en la misma tarea que las reemplaza; «ninguna tarjeta tapa una pieza» pasa a «el panel no se sale de la columna».
- **`opensFirst`**: `src/levels/contract/incident.test.ts` (líneas 764 a 789 y 1192 a 1194), `src/game/view/cards/piece-card.test.ts` y `src/testing/incidents.ts` (línea 418).
- **Pruebas nuevas por rebanada**: selección y pestañas fijas (jsdom); la barra de estado con sus líneas (envío, flujo, cambio, rechazo, vacía) en un incidente de cada mecánica; «Ver fila» marcando la fila del envío que toca; menú con teclado y toque; ventana con «Aplicar» y «Cancelar»; razones de desactivado sin términos futuros; el barrido de textos; el barrido de definiciones; alturas de la columna y 360 px (modo navegador).
- **Se actualizan a propósito**: `src/ui/incident/incident-screen.test.tsx` («the incidents of the chapters on the 2D map»), `src/levels/ladder.test.ts` si cambia qué lee, y las dos capturas del catálogo (por `Menu` y `Dialog`).
- **No cambian**: el dorado del capítulo 4, `map-sweep.test.ts` y las pruebas del mapa. El motor solo cambia si la barra necesita un campo aditivo.
- **E2E**: solo se tocan los ayudantes de arriba y, al cierre de un bloque, la corrida completa por el orquestador (los implementadores no la corren).

**Rebanadas sugeridas** (cada una termina en algo que se abre y se prueba desde la pantalla; la primera es la más delgada). **Cada rebanada deja verdadero todo texto visible:** la que renombra o mueve una pestaña o tarjeta corrige en la misma rebanada los textos de nivel que la nombran. El plan las afina y nombra sus excepciones.

1. Columna fija con Lucía y el panel de la pieza, con las seis pestañas en orden fijo y la columna que llena la altura (sin menú, ventana ni barra). Reemplaza las tarjetas junto a la pieza en todos los incidentes, migra los ayudantes de prueba, corrige los textos de nivel de pestañas y tarjetas (11 de los 12; el del reloj va en la 6) y trae el barrido «toda pestaña, tarjeta o caja nombrada existe en el casco».
2. Barra de estado y registro, con el aviso «Cambiaste …», «Ver fila», las líneas de flujos y la línea vacía; fija abajo también a 900 px o menos.
3. `Menu` y el menú de la pieza.
4. `Dialog` y la ventana de ajustes con «Aplicar» (corrige «Elígela» del 01-07).
5. La tabla de contenido y `shellOf`, con la razón de «desactivado»; se borran `Single`, `frameOf`, `OPENS_FIRST`, `send.opensFirst` y los `known.has` de lugar.
6. Almanaque, reloj en la barra superior (corrige el texto del 02-12) y herramientas.
7. La regla de las definiciones, cuando el estudiante decida el punto 2 de «Abierto».
8. Las hojas a 360 px, la última, cuando el estudiante decida el punto 1 de «Abierto».

Excepción nombrada: la rebanada 5 es de capas (motor del casco) y se corta solo si 1 a 4 ya usan una tabla provisional.

## Lo que queda al constructor

- Los nombres y la carpeta: `src/ui/` y `src/ui/incident/` están llenas (12 de 12) y también `src/game/view/` y `src/game/view/cards/`. El casco va en carpetas nuevas con su guía (`src/ui/shell/`, una carpeta bajo `src/game/view/`), partidas por concepto.
- La forma exacta de `shellOf`, de la tabla de contenido, del estado de selección (pieza o paquete) y de las líneas que guarda la sesión.
- Las alturas de la columna y el tope de Lucía, y el relleno inferior de la página a 900 px o menos para que la barra fija no tape el último control.
- Cómo se guarda el último origen de la terminal.
- Si el panel conserva un botón «Listo» en las pestañas sin salida propia (`CardFrame.onDone` sigue en las que lo tienen, como `identify`).
- Cómo se agrupan en el registro los envíos idénticos (la regla de la V32 está en el plan del bloque 3: se juntan solo las respuestas con las mismas líneas impresas).
- El orden de lectura y el foco: Tab recorre barra superior, herramientas, mapa, columna, barra de estado; al cerrar la ventana o el menú el foco vuelve a la pieza.
- Cómo se evita que `TermTip` (portal en `document.body`) cierre la ventana de Radix al pulsar su definición, o quede sin puntero bajo un fondo inerte: no se verificó.
- Las versiones exactas de Radix y su fecha (regla de 14 días), y las pruebas de la pulsación larga.
- Actualizar `DESIGN.md`, las guías (`src/ui/incident/CLAUDE.md`, `map-cards/`, `side-cards/`, `src/scene/CLAUDE.md`, `src/scene/cards/`, `src/ui/floating-box/CLAUDE.md`, `src/testing/CLAUDE.md`, `src/levels/contract/CLAUDE.md`) y `README.md` del proyecto.

## Abierto, para el estudiante

Se deciden con un prototipo dibujado y renderizado antes de la rebanada que los toca. Hasta entonces, el comportamiento de hoy.

1. **Las hojas a 360 px.** S2 dibujó la barra de estado fija y una fila de tres botones (Lucía, la pieza elegida, Registro) que abre una hoja a la vez, con el mapa desplazándose de lado dentro de su caja. El estudiante no lo decidió. Hasta entonces, a 900 px o menos queda el apilado de hoy con la barra de estado fija abajo. Opciones a dibujar: (a) las hojas de S2; (b) el apilado de hoy con la barra fija. Se decide antes de la última rebanada.
2. **La definición de un término dentro de un control** (ficha, pestaña, botón). `rigorous-plain-copy` registra que, tras la primera prueba de juego, el estudiante pidió la definición al pasar el mouse; quitarla de los controles es decisión suya. Opciones a dibujar: (a) la definición flotante se queda y se coloca para no tapar ningún otro control; (b) la definición del término bajo el mouse o el foco, dentro de un control, sale en una línea fija del panel (por ejemplo, el rótulo de la bandeja); (c) sin definición en los controles, solo en «Términos». Para cualquiera vale el criterio de aceptación de «El defecto…».

## Decididas sin el estudiante (para revisar)

El estudiante las revisa cuando se le entregue el documento; aprobado el documento, quedan resueltas para planear.

**Del prototipo, sin regla propia (P):**

1. **La vista previa de la caja sigue flotando.** Por qué: una columna fija no puede saltar al pasar el mouse. Si está mal: se muestra en el panel (salta con cada pieza y tapa la elegida) o se quita; es la única excepción a lo que el estudiante oyó, «nada flota sobre el mapa».
2. **Herramientas Terminal y Navegador, sin «Inspección» ni «Más».** S2 dibujaba «Inspección» y no dice qué hace (inspeccionar ya es pasar el mouse o hacer clic), y «Más» solo hace falta con tres herramientas. Si está mal: el estudiante dice qué hace «Inspección» y se agrega.
3. **El reloj va a la barra superior.** Por qué: es del juego y no de una pieza. Si está mal: vuelve bajo Lucía (la columna pierde alto).
4. **Ajustes en la ventana con «Aplicar».** Todo ajuste cuyo cambio vacía los envíos (clase de `RESTART_CHANGED`: `gateway`, `dns-server`, `listen-address` y los nuevos del bloque 3 cuando lleguen) pasa por la ventana, una por ajuste, incluidas las bandejas de «Servicios» que son ajustes. Muestra «Ahora → Al aplicar» y, si `history` no está vacío, «Al aplicar se borran N envíos: eran con la red anterior» (N es el largo de `history`). Los cambios de tabla y de reglas (`routes`, `records`, `sites`, `rule`) actúan directo: su botón es el «Aplicar». Si está mal: el valor se aplica al elegir, como hoy, y se pierde el paso intermedio.
5. **Secciones en «Ajustes», fichas en «Tablas» y «Preguntas».** Respeta «nunca una séptima pestaña». Si está mal: «Ajustes» también usa fichas (más clics, mismo orden).
6. **Ranura única de Lucía** para pistas, rechazo y alerta de intrusión, y la nota de ayuda en el panel sin elección. Si está mal: la alerta vuelve a su sitio de hoy.
7. **Menú de la pieza.** Filas = destinos del panel (pestaña o ficha), con «Ver qué es» para Estado. Equivalencia de teclado: la pestaña del panel. Mayús+F10, tecla de menú y pulsación larga dependen del navegador y de Radix: no se verificó.
8. **La columna.** Alto completo de la ventana, sin desplazar la página, Lucía con tope y desplazamiento propio, sin botón de plegar. Por qué: el tope evita que Lucía se coma al panel sin medir alturas que no tengo. Si está mal: un botón de plegar es un cambio pequeño.

**Llamadas mías:**

9. **Disabled solo en botones de acción** (Enviar, Agregar …, Aplicar). Una pestaña que el incidente ofrece siempre se puede abrir, y una pieza o herramienta que no se ofrece no se dibuja. Por qué: así se cumple «escondido si no se ofrece» sin una pestaña gris que anuncia algo que no hay. Si está mal: el estudiante quiere ver pestañas grises con razón y se agrega esa variante a `Tabs`. Terminado el incidente, las herramientas se esconden y el panel de una pieza muestra solo «Estado».
10. **El motor puede ganar campos aditivos** (ver «No metas»). Por qué: la barra no debe calcular lo que el motor ya sabe. Si está mal: ningún campo cambia el dorado, que no se edita; un campo mal tolerado hace fallar `golden-traces.test.ts` y se corrige con `ADDED_KEYS`.
11. **La barra existe en todo incidente y cada paquete o sello del mapa tiene una línea.** En un `filter` las líneas son los flujos vivos; en un `identify` sin flujos, la línea vacía; un `diagnose` empieza el registro con cada caso. Si está mal: la barra se esconde en los incidentes sin envíos y el casco pierde un lugar fijo.
12. **El registro** lista envíos, flujos, el cambio que los vació (con su aviso) y los rechazos de tabla; N cuenta todas las líneas; es lo que pasó **desde el último cambio**, no un historial que lo sobrevive. Por qué: el juego vacía `sent` y `history` a propósito («las pruebas de antes eran con la red anterior»). Si está mal: se agrega un registro aparte que no se vacía, con las líneas marcadas «con la red anterior».
13. **Cada rebanada deja verdadero todo texto visible**, y el barrido de textos llega con la primera. Por qué: un texto que nombra una pestaña que no existe contradice `rigorous-plain-copy`. Si está mal: la rebanada 1 es más corta y los textos se corrigen al final.
14. **A 900 px o menos se queda el apilado de hoy**, con la barra de estado fija abajo, hasta que el estudiante decida las hojas. Si está mal: la barra fija tapa el último control si falta el relleno inferior.
15. **El almanaque es una `Dialog` modal con `Tabs`** (Términos y Lecciones), sin primitiva nueva. Si está mal: mientras se lee, el mapa no se opera; pasar a un panel lateral pide otra primitiva.
16. **«Lecciones» muestra el `takeaway` de los incidentes con al menos una estrella y anteriores o iguales al que se juega** (orden del curso). Por qué: uno posterior usaría términos aún no enseñados. Si está mal: al repetir un incidente viejo se ven menos lecciones. Pide pasar `progress` a `IncidentScreen` (hoy `IncidentPage` no se lo pasa).
17. **Se borra `send.opensFirst`** (ningún nivel lo fija) y la pestaña inicial sigue una precedencia fija: Preguntas, Terminal, Navegador, Ajustes, Tablas, Estado. Si está mal: un nivel que quiera abrir una pieza en otra pestaña necesita el campo de vuelta, un cambio pequeño; y abrir en «Estado» costaría un clic más en cada pieza que envía.
18. **Lo que se ve y se esconde se calcula por defecto**, sin declararlo por incidente. Si está mal: un incidente que debe esconder algo que ofrece necesita un campo nuevo en el contrato.
19. **El panel no es un `dialog`**: es una región con nombre. Si está mal: los ayudantes de prueba cambian de rol, nada más.
20. **Todo el casco entra a la vez, sin bandera** (a diferencia de `VITE_MAP_RENDERER` en el mapa 2D), y las rebanadas 1 a 4 corren sobre una tabla de contenido provisional hasta la 5. Si está mal: la rebanada 1 se parte por capítulo.

## Lo que no se verificó

- No se corrió el juego ni ninguna prueba. Las alturas de la columna y el tope de Lucía no están medidos (la cuenta de S2 era de un prototipo, no del juego).
- S2 es un dibujo: la disposición de 02-06 y la de 03-04 son aproximadas (la de 03-04 es inventada).
- Las pestañas de cada pieza por incidente salen de leer los constructores de `pieceCard`, no de abrir las tarjetas; el propio prototipo duda de la «Tabla de traducciones» de `router-oficina` en el 03-04. Verifiqué que las 11 clases de hoy caben en las seis pestañas (`PieceTabId`), no cada incidente.
- Si todo flujo de `session.runs` (incluidos los `ambient`) se dibuja con sello en el mapa, y por tanto tendría línea de registro; y qué flujos tienen 02-04 y los incidentes `filter`: se leyó el esquema, no los niveles uno por uno.
- Los nombres `@radix-ui/react-context-menu` y `@radix-ui/react-dialog`, sus versiones y fechas, el abrir con Mayús+F10 o la tecla de menú y la pulsación larga: de memoria; sin `pnpm view` por orden de esta tarea.
- Que `aria-disabled` con `aria-describedby` se lea bien en lectores de pantalla, y la interacción de `TermTip` (portal en `document.body`) con una `Dialog` modal de Radix.
- Las cifras del registro de la conversación («unos 40 archivos» tocó una clase de tabla nueva; «7 primitivas») no se volvieron a medir. En el código hay 8 primitivas exportadas (`Button`, `Choice`, `ChipTray`, `Card`, `Tabs`, `Table`, `Message`, `NameTag`) en 7 archivos; `ChipTray` vive en `choice.tsx`.
- Que cada «caja» de los 24 archivos de nivel sea la caja de inspección: se contó la palabra. Los 26 archivos de prueba salen de buscar `openCard`, `openTerminal` y el rol `dialog`; no se sabe cuántas de sus pruebas fallan.
- Cuántos envíos borra un cambio de ajuste en cada incidente (la «N» de la ventana): el código vacía `sent` y `history`, pero no recorrí los incidentes.
- El estado del código tras T0b y T1 (el plan se lee sobre ese commit). No pude leer la captura `s2-fixed-shell-1280.png` (1280×21379, ilegible al reducirla): usé el texto extraído y el HTML.

## Fuentes

- Registro de la conversación, prototipos S1 y S2 (rutas arriba) y `s2-text.txt` en el scratchpad de la sesión. Plan del bloque 3 (T0b, T5, T6, V32, V33) y `.superpowers/sdd/2026-10-25-follow-the-packet-chapter-3-block-3/progress.md` con `t0a-report.md` (ronda 0).
- Código leído el 2026-10-26 en `projects/follow-the-packet` (`src/ui/incident/`, `src/game/view/cards/`, `src/game/session.ts`, `src/levels/contract/incident.ts`, `src/levels/04-iaas/golden-traces.test.ts`, `src/copy/screens/incident-ui.ts`, `src/ui/floating-box/`, `src/design/`, `src/styles.css`), `DESIGN.md` y `.claude/rules/*.md`. Formato y voz: `docs/specs/2026-10-12-follow-the-packet-2d-map-design.md`.
