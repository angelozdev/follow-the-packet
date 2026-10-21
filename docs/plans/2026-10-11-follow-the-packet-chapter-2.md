# Sigue el paquete · Capítulo 2 «Puertos y nombres» en catorce subcapítulos: motor, contrato y contenido

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Este plan no trae código: cada tarea dice qué contrato, qué archivos y qué tests nombrados; el código lo escribe quien ejecuta, con TDD.

**Goal:** Agregar el capítulo 2, «Puertos y nombres», con los catorce subcapítulos que el estudiante aprobó, encima del capítulo 1 terminado, sin cambiar lo que el motor calcula para el capítulo 4 ni lo que el capítulo 1 muestra. Llegan:
- lo que le falta al motor: puerto de origen en el paquete, servicios TCP y UDP con dirección de escucha, el aviso Port Unreachable, tablas de rutas con prefijo más largo y routers editables, NAT con puertos y su tabla, NAT entrante y reenvío fijo, un modelo de DNS (resolver, autoritativo, registros A y CNAME, caché con TTL, NXDOMAIN, SERVFAIL, archivo hosts) y una secuencia pura que lleva el estado (la tabla del NAT, el puerto efímero, la caché y el reloj);
- lo que le falta al contrato del incidente y a la sesión: mensajes con puerto (`nc`) y con nombre (`dig`), ajustes más generales (servidor DNS, dirección de escucha), tablas editables de rutas y de registros, un reloj del juego, con su tarjeta propia en el panel, que el jugador adelanta, resultados esperados con respuesta de DNS y casos del 14 con reparación;
- en el sistema de diseño: la tarjeta «Salida» de `nc` y `dig` (que generaliza la de traceroute, con la salida de `dig` plegable), la primitiva `Table` (D-3 A) y un solo estándar para los avisos y los errores de todo el juego (Tarea 18 bis);
- en la escena: servidores de nombres, un cliente de internet, paquetes con puerto (TCP y UDP, cada protocolo con su forma) y la traducción del NAT a la vista (la etiqueta del paquete cambia al cruzar el router);
- los catorce incidentes, en seis bloques, con un revisor de textos por bloque y una sola prueba humana, la del capítulo entero, al final (D-15 = B).

**Architecture:**
1. **Decisiones, estructura y términos (Tareas 0 a 3, con la 2 bis).** Los prototipos y las decisiones visuales (Tarea 0). Cuatro carpetas están en el tope de 12 archivos (`src/ui/`, `src/game/view/cards/`, `src/engine/simulation/` y `tests/e2e/`): una mudanza sin cambio de comportamiento les da espacio (Tarea 1). Los 50 términos nuevos se registran antes de que nada los etiquete (Tareas 2 y 2 bis). El mundo del capítulo 2 parte del final del 01-14 (Tarea 3).
2. **Motor (Tareas 4 a 13).** Un solo motor. Los campos nuevos de la traza son opcionales y ninguna etapa nueva escribe un paso en un mundo del capítulo 1 o del 4: las trazas de la VPC no cambian ni en un campo, y las del capítulo 1 solo ganan campos aparte, nunca pasos.
3. **Contrato, sesión, vista y sistema de diseño (Tareas 14 a 20, con la 18 bis y la 19 bis).** Se amplía el contrato `send`; la sesión lleva el reloj y la secuencia; la vista aprende los puertos, las rutas, la traducción y el DNS; llegan la tarjeta «Salida» (con la salida de `dig` plegable), un solo estándar para los avisos y los errores, las tarjetas de tablas, la tarjeta con pestañas de cada pieza, el reloj del juego y los casos con reparación. La 19 bis no cambia el juego: cambia cómo se prueba (e2e deterministas, un puerto por worktree) y cómo se chequea cada tarea (`pnpm check:fast`).
4. **Escena (Tarea 21).** Servidores de nombres, el cliente de internet, el puerto en el paquete y la traducción a la vista. El estudiante eligió una forma propia para TCP y otra para UDP (D-9 B).
5. **La cadena y el contenido (Tareas 22 a 33).** La Tarea 22 prepara el desbloqueo y los ayudantes; las 23 a 33 traen los catorce incidentes por bloques, cada bloque con la revisión de sus textos por un revisor `sonnet`; la prueba humana es una sola, al final de la Tarea 33.
6. **Cierre (Tareas 34 y 35).** Playwright del capítulo entero y los documentos.

**Tech Stack:** el de hoy (Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, `@radix-ui/react-tabs` 1.1.21, Vitest 5.0.3, Testing Library con user-event, Playwright 1.64, pnpm 11.3.0). **Ninguna dependencia nueva.** Una tabla es HTML; `Table` (D-3 A) no necesita librería.

**Spec:** [`docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md`](../specs/2026-10-11-follow-the-packet-chapter-2-design.md) (los 14, los 53 términos, lo que la simulación enseña, las simplificaciones y las fuentes con fecha). Investigación: [`docs/research/2026-10-10-follow-the-packet-chapter-2-concepts.md`](../research/2026-10-10-follow-the-packet-chapter-2-concepts.md). Del capítulo 1 siguen valiendo su [spec](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) y su [plan](2026-10-10-follow-the-packet-chapter-1-fourteen.md). Donde el código y un plan viejo difieren, manda el código.

## Estado al empezar (2026-10-11)

- **Rama y base.** `feat/chapter-1-fourteen`, HEAD `5fd7c80` (`docs: record chapter 1 in fourteen subchapters`). El capítulo 1 está terminado y no se unió con `main`; el capítulo 2 se implementa encima de este estado. Cambios sin commit del estudiante fuera del juego: `concepts/ami.md` (modificado) y la investigación del capítulo 2 (nueva). Ninguna tarea los toca.
- **Totales al cerrar el capítulo 1** (no se volvieron a medir hoy): Vitest, 1853 tests en 70 archivos; Playwright, 61 tests; `pnpm check` verde. El criterio de cierre de este plan es el mismo: `pnpm check` verde, con los totales que existan entonces.
- **Totales al cerrar el capítulo 2** (medidos el 2026-10-21 en el `pnpm check` completo de la Tarea 34, sobre `0848a8e`; la Tarea 35 solo cambia documentos): Vitest 3670 tests en 130 archivos; jscpd, 0 clones; Vitest en el navegador (`pnpm test:browser`), 268 tests en 20 archivos; Playwright, 7 tests; `golden-traces.json` sin cambios. Contra los 1853 tests y los 61 de Playwright del capítulo 1, la diferencia incluye el plan del mapa 2D, que pasó 143 pruebas de Playwright a las capas de Vitest y dejó 7. El `pnpm check` completo del commit de la Tarea 35 lo corre el orquestador, y su resultado no está escrito aquí.
- **Lo que ya existe y este capítulo usa tal cual.** Reglas de firewall con `tcp` y `udp` y rango de puertos (`ruleWhatSchema`, `matchesWhat`); rutas de router con prefijo más largo (`bestRoute`) y los avisos `net-unreachable` y `host-unreachable`; el resultado `refused`; `NoticeKind`; la etapa `nat` en `StepStage` (la usa la VPC); la mecánica `identify` con bandejas `segmented`; `send.settings` con `setSetting`; la tarjeta de traceroute; `Tabs`; el estilo B; las listas `shown`; `explained-changes.test.ts`.

## Estado del relevo (2026-10-17)

Lo escribió el orquestador que llevó las Tareas 8 a 28 antes de pasar el trabajo a otro. Todo está commiteado en `feat/chapter-2`; nada está a medias en el árbol. El 2026-10-12 el trabajo dejó el worktree y pasó al árbol principal, y el estudiante decidió O-1, O-2, O-3 y O-4. **Actualizado el 2026-10-17 al aterrizar la Tarea 28 bis:** la sesión principal la trajo a `feat/chapter-2` con un avance rápido y borró el worktree y la rama temporales; el capítulo vive otra vez solo en el árbol principal. **Actualizado también el 2026-10-17 al cerrar la Tarea 28 ter** (`efe355b`): es la nueva base B0 de la regla C y lo que sigue es el plan del mapa 2D, desde la Tarea M0. **Actualizado el 2026-10-21 al cerrar la Tarea 35, que cierra el plan:** las Tareas 29 a 35 están hechas y el capítulo 2 tiene sus catorce incidentes. Las viñetas de «Dónde está la rama» describen el estado del 2026-10-17; la base verde más reciente es `0848a8e` (totales en «Estado al empezar»). Lo que queda es del estudiante, la prueba humana del capítulo entero y la revisión de las decididas (página en «Decididas sin el estudiante (para revisar)»), y del orquestador, la revisión final y el `pnpm check` completo del commit de los documentos.

### Dónde está la rama

- **Dónde vive (estado del 2026-10-17):** `feat/chapter-2` está en el árbol principal, `/Users/angelozdev/me/AWS Commit Academy`, y es el único lugar del capítulo: no queda ningún worktree ni la rama `merge/28bis`. El 2026-10-17 la sesión principal aterrizó la Tarea 28 bis con `git merge --ff-only merge/28bis` en el árbol principal (`feat/chapter-2`: `a878d42` → `4fccc95`) y después hizo `git worktree remove /Users/angelozdev/me/aws-commit-academy-28bis` y `git branch -d merge/28bis`. Mientras la 28 bis vivía en su worktree, `feat/chapter-2` se movió de `a4f6e1f` a `a878d42`, con 8 commits de documentos del curso del estudiante (`git log a4f6e1f..a878d42`: `labs/`, `exercises/`, `concepts/`, `syllabus.md`, `README.md` y los planes `2026-10-12-follow-the-packet-2d-map`, `2026-10-15-practice-03-alb-dashboard` y `2026-10-16-lab-05-ha-alb-asg-imdsv2`; ninguno toca un archivo que la 28 bis edite). El paso 12 los trajo a `merge/28bis` con un merge normal (`4fccc95`, solo documentos, sin conflictos).
- **Último commit (estado del 2026-10-17):** `feat/chapter-2` está en `4fccc95` (`Merge branch 'feat/chapter-2' into merge/28bis`). La Tarea 28 bis dejó cinco commits: el merge de `main` (`5110bad`), los documentos del merge (`626a144`), D (`88053a7`, `feat(ui): move the inspection box away from the open card`), el motivo (`c23909b`, `feat(ui): write why the inspection box has no room next to an open card`) y el merge de `feat/chapter-2` en `merge/28bis` (`4fccc95`). Encima vino la Tarea 28 ter (`efe355b`, `fix(copy): say in plain words that a router has no route until net-unreachable is known`), el último commit de código de la rama.
- **Último commit con el `pnpm check` completo en verde (estado del 2026-10-17; la base más reciente es `0848a8e`, ver «Cierre del capítulo», abajo):** `efe355b`, que es la **nueva base B0 de la regla C** y reemplaza a `4fccc95` (y antes a `c23909b` y a `11587fc`: Vitest 2938 tests en 98 archivos, Playwright 126). El `pnpm check` completo corrió el 2026-10-17 sobre `efe355b` en el árbol principal: Vitest 2990 tests en 101 archivos, jscpd 0 clones, Playwright 143 pasaron y `golden-traces.json` sin cambios. Una primera corrida de Playwright tuvo 11 timeouts con la máquina cargada (carga media de unos 89); la corrida repetida de toda la suite e2e pasó 143/143. `4fccc95` también estaba en verde (Vitest 2988 tests en 101 archivos, Playwright 143 tests en 2.9 m, jscpd 0 clones y `golden-traces.json` sin cambios), igual que `c23909b`, que tiene el mismo código bajo `projects/` (log `tarea-28-bis-impl3-check-full-1.log` en el espacio de trabajo del SDD).
- **Cierre del capítulo (2026-10-21):** el último `pnpm check` completo en verde es el de la Tarea 34, sobre `0848a8e`, la base más reciente de la regla C (totales en «Estado al empezar»). La Tarea 35 solo cambia documentos; su `pnpm check` completo lo corre el orquestador sobre su commit.
- **Puerto de Playwright:** el del árbol principal es el 4189 (derivado de la ruta, Tarea 19 bis). El 4190 era el del worktree de la 28 bis, que ya no existe.
- **`main`:** hoy está en `b6eb2ce` e incluye `46c4074` (el pin de la caja) y `b6eb2ce` (los documentos del capítulo 3). Ya está unido en `feat/chapter-2` (`5110bad`, aterrizado en `4fccc95`).

### Tareas hechas (hash)

- **Motor:** 8 (`afe01ce`, guías `6c1cfe8`), 9 (`0f5b044`), 10 (`a6b4c84`), 11 (`bcef414`), 12 (`497b0c2`, `5197049`), 13 (`af7d831`, `de3c8b8`).
- **Contrato, sesión y vista:** 14 (`4dc84fb`, `a2da8eb`), 15 (`6b4c670`, `587b7f1`), 16 (`3346501`, `f33ffee`, `28072e5`), 17 (`ee69cfd`), 18 (`269c83a`), 18 bis (`4655244`), 19 (mudanza `875c27d`, tarea `af90924`), 19 bis (plan `1edede0`, código `940f07a`), 20 (`0537425`, `7be53a2`), 21 (`90becc1`), 22 (`1924162`).
- **Contenido:**
  - Bloque 1: 23 (`9d9cca5`, arreglos `118d9b0`, `56ef126`, `b9c7d1b`, `716606f`, `622bf69`), 24 (`b0188bf`), revisión `603cff9`.
  - Bloque 2: 25 (`5af4dea`), 26 (`281aedf`), revisión `50e7ea0`.
  - Bloque 3: 27 (`a732c16`), revisión `3c098ff`.
  - Bloque 4: 28 (`dcfc04c`), revisión `e0ae23f` y `dc40106`, arreglos de rigor `5c070f1`, `2b6a3e3`, `f12795f`, `34ff5d3` y `6979d43`.
  - Bloque 5: 29 (commit `feat(levels): add chapter 2 incident 10, asking for a name`, `b4820ee`), 30 (commit `feat(levels): add chapter 2 incident 11, the records`, `92d3f50`), 31 (commit `feat(levels): add chapter 2 incident 12, still the old ip`, `3f84f7d`), 32 (commit `feat(levels): add chapter 2 incident 13, it does not resolve`, `8253aef`, que cierra el bloque 5; la regla de la etiqueta demasiado larga que pidió, `feat(scene): cut a one-line piece label that would make the map wider than its screen`, aterrizó antes como `1105d68`).
  - Bloque 6: 33 (commit `feat(levels): add chapter 2 incident 14, on call`, `6991473`, que cierra el bloque 6 y el contenido del capítulo).
  - Cierre del capítulo: 34 (commit `test(e2e): play the fourteen incidents of chapter 2`, `0848a8e`).
  - Documentos: 35 (commit `docs: record chapter 2 in fourteen subchapters`, que cierra el plan; sin hash, porque un commit no puede llevar el suyo: se encuentra por su asunto, con `git log --grep`).
- **Otros commits:**
  - `domain-name` bajo `.example` (`4438275`), nota `@e2e` en `az-rules.json` (`a8e95e0`), cámara sin salto de etiquetas (`4e15c90`).
  - Merge del arreglo de cajas con scroll `b2f5a0d` (`de69ac7`) y su backlog (`a2e8f21`).
  - Tarea 28 bis, aterrizada el 2026-10-17: el merge de `main` (`5110bad`), sus documentos (`626a144`), D (`88053a7`, `feat(ui): move the inspection box away from the open card`), el motivo (`c23909b`, `feat(ui): write why the inspection box has no room next to an open card`) y el merge de `feat/chapter-2` en `merge/28bis` (`4fccc95`, el último commit de la rama).
  - Tarea 28 ter, hecha el 2026-10-17: `efe355b` (`fix(copy): say in plain words that a router has no route until net-unreachable is known`).
  - Decisiones registradas: `526a5a6`, `a23176b` y `6aa44fc`.

### Lo que falta y de qué depende

- **Tarea 28 bis (el merge de `main` y la caja que se aparta, O-1 = D): hecha y aterrizada el 2026-10-17.** Unió `main` en `feat/chapter-2` (trajo `46c4074`, el pin de la caja, y `b6eb2ce`, los documentos del capítulo 3) e hizo que la caja de inspección se aparte de la tarjeta abierta. Pasos 0 a 5 el 2026-10-12 y 6 a 12 el 2026-10-17: el merge es `5110bad`, D es `88053a7`, el motivo es `c23909b` y el merge de la rama movida es `4fccc95`. Las seis mutaciones (M1 a M3 y D1 a D3) y la medida del residuo están en `projects/follow-the-packet/tests/e2e/CLAUDE.md`. La revisión final de `626a144..c23909b` la aprobó: 0 Critical, 0 Important y 8 Minor (el archivo de la revisión queda fuera del repo). Eran 14 conflictos, no 8. **El residuo del 04-01 vale B** (decidida 52; medido el 2026-10-17 a 1280×500: 169.8 px de sala a la izquierda y 92.2 a la derecha): la sesión principal agenda la tarea que le sigue (el lugar de la caja cuenta las marcas, y la prueba del residuo va en `tests/e2e/incidents.spec.ts`; backlog J17), y la 28 bis no la empezó ni la planeó.
- **Lo que sigue, por el orden del estudiante (2026-10-17):** la Tarea 28 ter está hecha (`efe355b`, ver abajo); el paso siguiente es el plan del mapa 2D (`docs/plans/2026-10-12-follow-the-packet-2d-map.md`), desde la Tarea M0, que toma luego la 28 quater, la 28 quinquies y las Tareas 29 a 35.
- **Tarea 28 ter (el aviso de un router sin ruta, en palabras llanas en el capítulo 1, O-3 = A1): hecha el 2026-10-17** en `efe355b` (`fix(copy): say in plain words that a router has no route until net-unreachable is known`). Dejó la base B0 de la regla C (totales arriba). La revisión final la aprobó: 0 Critical, 0 Important y 2 Minor. Lo que se entregó difiere de la frase de O-3 (ver «Lo que se entregó» en la tarea y la decidida 56). No bloqueaba nada.
- **Tarea 28 quater (la consulta DNS de un envío por nombre se dibuja, O-2 = A): hecha el 2026-10-20 como la Tarea M25 del plan del mapa 2D** (`docs/plans/2026-10-12-follow-the-packet-2d-map.md`), en cuatro commits: `721fcdc` (motor), `e379ce9` (vista y textos), `70cc8a6` (escena 2D) y `79debda` (documentos). Reabrió la decidida 4 y partes de las Tareas 4, 5, 12, 13, 16 y 21. O-6 se decidió (A): la marca de la fila entró con el paso de la vista.
- **Tarea 28 quinquies (los sellos en abanico hasta lo que cabe, más «+N», O-4 = G): hecha el 2026-10-20 en el plan del mapa 2D, no con sus cuatro commits.** Nunca aterrizó tal como está escrita: la hicieron M2 (`9f02a08`, el ancho de las etiquetas), M6 (`a0bc730`, el abanico, `placeTags` y `collisions`), M7 (`13b8d54`, `stampOf`, `isProblemStamp` y la lista de la caja), M8 (`5ca09c0`, el barrido y el centinela), M12 (`971e84e`, `StampMore` y el punto de peligro), M16 (`711aa17`, el catálogo) y M18 (`588e51f`, su captura), y la cierra M26 (`0610463`, los pasos de esta tarea y las filas J19 y J20 del backlog; `28fb779`, las tres pruebas de «+N» de la pantalla real de 02-03; y el commit de documentos que lleva esta nota). Destraba las pruebas de solapes del 02-03, del 02-05 y del 02-08, que son el barrido de M8, y la del 02-10 (Tarea 34). Con O-2 = A, cuenta también los sellos de las consultas DNS.
- **Tareas 29 a 33 (bloques 5 y 6, DNS y guardia):** las Tareas 28 quater y 28 quinquies, de las que dependían, ya están hechas (M25 y M26); las hace en 2D la Tarea M27 del plan del mapa 2D. **La Tarea 29 (02-10) está hecha** en el commit `feat(levels): add chapter 2 incident 10, asking for a name`, **la Tarea 30 (02-11) también**, en el commit `feat(levels): add chapter 2 incident 11, the records`, **la Tarea 31 (02-12)**, en el commit `feat(levels): add chapter 2 incident 12, still the old ip`, **la Tarea 32 (02-13)**, en el commit `feat(levels): add chapter 2 incident 13, it does not resolve`, **y la Tarea 33 (02-14)**, en el commit `feat(levels): add chapter 2 incident 14, on call` (`b4820ee`, `92d3f50`, `3f84f7d`, `8253aef` y `6991473`; la 32 dejó antes `1105d68`, la regla de la etiqueta demasiado larga). La 31 (02-12) no cambia con la 28 quater, pero va después de la 29 y la 30 por la cadena del mundo. Las Tareas 29, 30, 31, 32 y 33 escribieron solo la función de juego exportada de su incidente (`playAskingForAName` del 02-10, `playTheRecords` del 02-11, `playStillTheOldIp` del 02-12, `playItDoesNotResolve` del 02-13 y `playOnCallItDoesNotConnect` del 02-14, en `tests/e2e/chapter-2/chapter-2-play.ts`) y no sumaron el incidente a `CHAPTER_2` ni cambiaron `chapter-2.spec.ts`: la Tarea 34 suma las funciones de las Tareas 29 a 33 a `CHAPTER_2` y renombra la prueba del capítulo. La Tarea 30 dibuja también `router-oficina` en el 02-11 (la ficha nombra cuatro piezas): el barrido de `map-sweep.test.ts` exige que el router que traduce esté en el camino de un paquete traducido, y la fila 51514 → 40001 de la ficha necesita su tabla. `CACHE_PIECES` (02-12) parte de esa lista y lo hereda; `FAILURES_PIECES` (02-13) lo recibió, porque el barrido lo exigió, y cualquier lista de piezas posterior lo recibe cuando el barrido lo exija (decidido el 2026-10-20 en la revisión de la Tarea 30, sin nueva consulta). La Tarea 31 deja en el mundo de la cadena `www.lucia.example` apuntando a `servidor-nuevo` (`198.51.100.60`) y la caché inicial de `servidor-dns` (la respuesta vieja, que vence en el segundo 240): las Tareas 32 y 33 parten de ese mundo. Decidido al hacer la Tarea 32: el `setDns` de `servidor-dns` del 02-13 no lleva `cache` (la respuesta vieja venció dentro del 02-12, cuando el jugador esperó más de su TTL), y `servidor-internet` sigue en `198.51.100.50` (la línea del archivo hosts de `tu-laptop` apunta a un servidor vivo); lo que la ficha del 02-14 supone de `servidor-internet` y de `198.51.100.50` tiene su propio cambio. O-7 se decidió (A): la ficha del 02-13 no suma un `ping` por DNS.
- **Tarea 34 (Playwright del capítulo entero): hecha** en el commit `test(e2e): play the fourteen incidents of chapter 2` (`0848a8e`; la sección `### Tarea 34` no tiene casillas que marcar). Es una unidad de pruebas: no cambió código de producción. Cada prueba quedó en la capa que le da M27. **e2e:** `chapter 2 is played from 02-01 to 02-14, each incident opening the next, with 3 stars each` (renombrada; `CHAPTER_2` ya tiene los catorce) y, como paso de esa misma prueba, `04-01 opens after 02-14 has a star`, que también afirma que el 04-01 existe en el roadmap con su enlace (la 33 dejó `04-01 opens once 02-14 has a star` en `progress.spec.ts`: no se repite). **Barrido de `map-sweep.test.ts`:** `in 02-07 the map and its labels fit the area at full size` (nueva: el título que dejó M19, con 900 y 1060 px, no podía tomar 1280 y 1440), los estados del 02-10 dentro de `in 02-09 and 02-10 no label or stamp overlaps, with the stamps that show and the ones that «+N» counts`, `in 02-14 case 1 no label or stamp overlaps after the dig, the ping and the nc by name` (nueva), el 02-04 dibujado dentro de su contorno, la guarda del centinela de «+N» para 02-10 a 02-14 y el caso 5 del 02-14 reparado como estado nuevo, con una prueba propia que el plan no nombra (`the case of a diagnose that has a fix is also swept once its routes are repaired, with the ping and the traceroute arriving`). **Navegador (`src/ui/incident/geometry/`):** `in 02-07 and 02-08 the inspection box of a piece covers no open card, at 1280×800 and at 1440×900`, `the cards of tables, output and services cover no piece of the map`, `in 02-13 at 360 px the incident screen does not scroll sideways` y la escena de la tarjeta de tres pestañas de `tu-laptop` (02-10) en `SCENES` y `MAP_SCENES`. **jsdom:** `in 02-12 waiting from the clock card changes the answer of dig`, `in 02-03 the services card opens from the label of laptop-lucia and switches the address`, `in 02-14 case 5 can be repaired from the routes card` y `the roadmap lists the fourteen incidents of chapter 2 with their stars`. **Pruebas existentes que cambiaron a propósito** (para la Tarea 35): el título de la prueba del capítulo (02-09 pasó a 02-14) y `CHAPTER_2` (cinco entradas); en `map-sweep.test.ts`, `in 02-09 and 02-10 no label or stamp overlaps, with the stamps that show and the ones that «+N» counts` (gana los estados del 02-10), `in 02-04 placing a device inside the block moves the outline by the distance between rows, and moving it out takes it back` (gana que el aparato colocado se dibuja dentro del contorno y fuera al sacarlo), `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N» without showing it` (gana la guarda de 02-10 a 02-14) y `statesOf`, que suma `02-14: case 5, repaired, every combination` a las pruebas del primer `describe`; en `card-layout.browser.test.tsx`, `SCENES` y `MAP_SCENES` ganan `THE_NAMES_TERMINAL`. `incidents.spec.ts` no cambió (ningún nombre cambió); `saved-progress.ts` exporta ahora el id y el título del 04-01, que `progress.spec.ts` y la prueba del capítulo comparten, sin cambiar lo que afirma ninguna de las dos pruebas de `progress.spec.ts`; y `card-layout.spec.ts`, `map-boxes.ts` y `card-boxes.ts` ya no existen (sus sucesores están en `src/ui/incident/geometry/` y `src/testing/`). La prueba del capítulo entero corre en 11 s.
- **Tarea 35 (documentos y totales reales): hecha** en el commit `docs: record chapter 2 in fourteen subchapters` (sin hash, porque un commit no puede llevar el suyo: se encuentra por su asunto, con `git log --grep`; la sección `### Tarea 35` no tiene casillas que marcar). Es una unidad de documentos: no cambió código ni pruebas. Documentos: el `README.md`, el `DESIGN.md` (las pestañas de la tarjeta de cada pieza) y `tests/e2e/CLAUDE.md` del juego; la hoja de ruta (la fila del capítulo 2 pasa a «Hecho» y se suma la de su prueba humana, pendiente); el backlog (bloque K); la hoja de capítulos (la ficha del capítulo 2); el spec (estado); este plan (los totales, la lista de pruebas existentes que cambiaron a propósito en «Global Constraints», reunida desde los cuerpos de los commits y las notas del relevo, las decididas 57 a 63 y la página «para revisar») y el Cierre de la Tarea M27 en el plan del mapa 2D. La prueba humana del capítulo entero (D-15 = B) no se hizo: es del estudiante, y ningún documento dice un resultado suyo.
- **La revisión final y el `pnpm check` completo del capítulo:** al final.

### Decisiones abiertas

Están en la sección «Decisiones abiertas de la noche del 2026-10-11» de este plan. El 2026-10-12 el estudiante decidió O-1, O-2, O-3, O-4, O-6 y O-7 (las dos últimas en la sección «Decisiones abiertas del 2026-10-12»); no queda ninguna abierta. O-5, O-8, O-9 y O-10 se decidieron con la regla del umbral (ver «Reglas de trabajo vigentes que no estaban escritas») y están en «Decididas sin el estudiante (para revisar)», 52 a 55.

| Decisión | Página | Estado | Qué ejecuta o espera |
|---|---|---|---|
| O-1 · la caja de inspección tapa la tarjeta recién abierta | https://claude.ai/artifact/WuUFHfn7Ryzki8f1AbHrST | **Decidida el 2026-10-12: D** (la caja se aparta de la tarjeta abierta) | La Tarea 28 bis: el merge de `main` y la caja que se aparta, con su prueba de `card-layout.spec.ts`. La 19 y la 21 están hechas y no se reabren. Un residuo: a 1280×500 la caja, en su mínimo de 120 px, todavía tapa «Security Group servidor2» en el 04-01 (tras `118d9b0`). Se decidió como O-5 (decidida 52). |
| O-2 · ¿se dibuja la consulta DNS de un `ping` o un `nc` por nombre? | la misma | **Decidida el 2026-10-12: A** (se dibuja) | La Tarea 28 quater y, después, las Tareas 29 a 33. Con A también se reabren la decidida 4, partes de las Tareas 4, 5, 12, 13 y 16 y una adición a la 21: el `nc` por nombre saldría del 51515 |
| O-3 · el capítulo 1 llama «Host» al aviso de un router sin ruta | la misma | **Decidida el 2026-10-12: A1** (palabras llanas hasta conocer el término) | La Tarea 28 ter, la copia del capítulo 1. No bloquea nada |
| O-4 · sellos que no caben entre etiquetas | https://claude.ai/artifact/B7hsCV4ySvrtXhFErM73ZF | **Decidida el 2026-10-12: G** (estudiante; opción nueva: abanico hasta lo que cabe y un sello «+N») | La Tarea 28 quinquies, escrita: destraba las pruebas de solapes del 02-03, del 02-05 y del 02-08, y la del 02-10 (Tarea 34). Medidas en `tests/e2e/chapter-2/CLAUDE.md` |
| O-5 · ¿una etiqueta o un sello decide el lugar de la caja de inspección? | sin página: se decidió con la regla del umbral | **Decidida por el orquestador el 2026-10-12 (decidida 52): B si la medición lo permite; si no, A. Medida el 2026-10-17: vale B** (a 1280×500, 169.8 px de sala a la izquierda y 92.2 a la derecha) | No bloquea. Una tarea nueva, que agenda la sesión principal: el lugar de la caja cuenta las marcas, con la prueba del residuo en `tests/e2e/incidents.spec.ts` (backlog J17) |
| O-6 · cómo se marca la fila de una consulta DNS en la tabla de traducciones | https://claude.ai/artifact/3yLNkFurxLnhSeTfZN2Bap | **Decidida el 2026-10-12: A** (estudiante; la palabra «consulta DNS») | La marca de la fila, en el paso de la vista de la Tarea 28 quater; ya no la bloquea nada |
| O-7 · ¿el 02-13 suma un `ping` por DNS? | https://claude.ai/artifact/3yLNkFurxLnhSeTfZN2Bap | **Decidida el 2026-10-12: A** (estudiante; no se suma) | La ficha del 02-13 (Tarea 32), que no cambia; ya no la bloquea nada |
| O-8 · ¿qué pasa con la etiqueta de un paquete cuyo sello se esconde en un «+N»? | sin página: se decidió con la regla del umbral | **Decidida por el orquestador el 2026-10-12 (decidida 53): A** (la etiqueta sigue a su sello y no se dibuja; se aparta de la página de O-4) | Nada: no bloquea. La Tarea 28 quinquies la implementa desde el principio |
| O-9 · la altura de los sellos de un grupo | sin página: se decidió con la regla del umbral | **Decidida por el orquestador el 2026-10-12 (decidida 54): B** (cada sello conserva la altura de su punto) | Nada: no bloquea. La Tarea 28 quinquies la implementa en sus commits 2 y 3, con una salvaguarda |
| O-10 · si la etiqueta de un paquete no cabe moviéndola solo en horizontal | sin página: se decidió con la regla del umbral | **Decidida por el orquestador el 2026-10-12 (decidida 55): A** (sube o baja lo justo, con tope) | Nada: no bloquea. La Tarea 28 quinquies ya no se detiene en el paso 2 |

El estudiante contestó de a una, a través de la sesión principal. No queda ninguna abierta: O-6 y O-7 se decidieron el 2026-10-12 (sección «Decisiones abiertas del 2026-10-12»).

### Lo que vive fuera de la rama

Todo está en `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/4fb9dddd-09ca-4da4-bcb4-f94c447042db/scratchpad/`, que puede borrarse al reiniciar el equipo.

- **`merge/resolved-merge.patch` y `merge/resolved-files/`:** el merge resuelto de `feat/chapter-1-fourteen`, hecho sobre `940f07a`. El merge de `main` ya está hecho (Tarea 28 bis, `5110bad`, con 14 conflictos): estos archivos solo quedan como guía de cómo se resolvió el de la rama vieja.
- **`02-03-overlap-test.patch` y `zz-measure.spec.ts`:** la prueba de solapes del 02-03 y la spec con que se midió (O-4). La Tarea 28 quinquies reescribe el parche a mano sobre el árbol de entonces.
- **`oracle/oracle-at-the-click.chapter-2.spec.ts`:** el oráculo que mide la caja sobre «Listo» justo después del clic, con el reloj pausado (O-1). Falla 10 de 10 mientras exista el defecto. Está desactualizado (importa `SETTINGS_BUTTON` y `CHAPTER_1_DONE` y recorre 5 escenas; hoy `MAP_SCENES` tiene 12): la Tarea 28 bis lo rehízo en el repo (es la prueba `a card beside a piece keeps its foot in reach right after the click, in a low or narrow window` de `card-layout.spec.ts`). `merge/build_spec.py` tampoco corre hoy: sirve de lista de qué reescribir, no de herramienta.
- **`chapter-2-open-decisions.html` y `chapter-2-decision-o4.html`:** las fuentes de las dos páginas publicadas.
- **`chapter-2-decisions-o6-o7.html`:** la fuente de la página publicada de O-6 y O-7 (https://claude.ai/artifact/3yLNkFurxLnhSeTfZN2Bap). Sus dibujos son SVG calculados, no capturas.
- **`replan/`:** los borradores de las replanificaciones del 2026-10-12 (`o1-merge.md`, `o2-dns.md` y `o4-fan.md`, de donde salió la Tarea 28 quinquies) y sus papeles de trabajo.
- **`chapter-2-prototypes.html`:** los prototipos de las decisiones V10 a V19 y D-6.
- **`nmap793/` y `bind918/`:** las fuentes de `ncat` 7.93 y BIND 9.18.50. `bind918/b.tar.xz` trae el árbol completo.
- **`keep/orchestrator-notes.md`:** las notas del orquestador, tarea por tarea.
- **La rama `wip/task-19`** (`8c97014`): el trabajo de la Tarea 19 antes de la pausa. Ya entró completo en `af90924`. Se puede borrar cuando el estudiante lo apruebe.

### Reglas de trabajo vigentes que no estaban escritas

- **Regla C, con su ajuste (aprobado el 2026-10-11):**
  - en cada tarea, `pnpm check:fast` más las specs que cubren lo que tocó;
  - al cerrar un bloque y antes de cada merge, `pnpm check` completo;
  - la base para decidir si una e2e que falla es de la tarea es el último commit con el `pnpm check` completo en verde, no «HEAD sin los cambios de la tarea»;
  - nunca dos suites e2e a la vez en la misma carpeta.
- **Un revisor `sonnet` de textos por bloque**, después de que el bloque cierra con el `pnpm check` completo:
  - aplica él mismo sus correcciones y las commitea como `fix(levels): plainer and more exact texts for block N of chapter 2`;
  - lo que cambia la mecánica o lo que se aprende lo informa y no lo hace;
  - lo que informa se cierra en commits de arreglo antes del bloque siguiente.
- **Regla de los 30 minutos:** un agente que lleva unos 30 minutos con el mismo problema se detiene e informa. Si el problema no es de la tarea (regla C), va al backlog y se sigue.
- **Git y procesos:**
  - `concepts/ami.md` tiene cambios del estudiante sin commit: nunca se toca, nunca se agrega y nunca se commitea.
  - Cada commit va con rutas explícitas.
  - El servidor del estudiante en el 5180 sirve este mismo árbol y recarga solo cuando un agente edita: no se mata ni se reinicia.
  - Sin `git push` y sin merge a `main`.
  - Nunca `--amend`, `reset`, `update-ref` ni `stash`. La forma del commit: `git commit -m … -m … -- <rutas>`. Nunca `git add .` ni nada de `labs/`. **Excepción:** a mitad de un merge git rechaza las rutas; se agrega cada archivo con `git add <ruta>` y se hace `git commit` sin rutas (Tarea 28 bis).
  - Nada en el 5173 ni en el 5180, y nunca `pkill` ni `killall`.
- **El umbral para abrirle una decisión al estudiante (regla de la sesión principal, 2026-10-12):**
  - Una decisión se abre al estudiante solo si ninguna opción pasa sus tres criterios (rigurosa, visual y entendible), o si dos o más los pasan y cambian de forma importante lo que el jugador aprende o ve.
  - Todo lo demás se decide con la recomendación y va a «Decididas sin el estudiante (para revisar)», con su «por qué no se abre».
  - Al final del capítulo, antes de que el estudiante lo juegue, todas las «para revisar» se juntan en una sola página para que las revise de una vez (Tarea 33).
  - Con esta regla se decidieron O-5, O-8, O-9 y O-10 (decididas 52 a 55). O-6 y O-7 pasaron el criterio de apertura: la sesión principal se las preguntó al estudiante, que las decidió el 2026-10-12 (A en las dos).
- **Subagentes:** siempre con `model` explícito: `sonnet` para implementar, revisar e investigar, `haiku` solo para correr un comando. Nunca `opus`.
- **Lo que una prueba no puede hacer:** prohibidos `waitForTimeout`, `retries`, `skip`, `fixme`, `test.fail` y los filtros que saltan un fallo.
- **Las pruebas nombradas en el plan:** no se quitan. Las pruebas existentes de los capítulos 1 y 4 no se editan, salvo las que el plan lista o una decisión aprueba, y cada edición va en el cuerpo del commit.
- **Cada tarjeta nueva:** el primer incidente registrado que la usa suma su escena a `card-layout.spec.ts` y a `MAP_SCENES`, con tope de alto, scroll del cuerpo y pie al alcance, y la caja de inspección no la tapa (el oráculo de `card-layout.spec.ts` recorre `MAP_SCENES`).

### Trampas, medidas y cosas a vigilar

- **Nunca dos agentes que hagan commits a la vez en el mismo worktree.**
  - Un `--amend` sobre un commit ajeno mezcló dos tareas el 2026-10-11.
  - Durante un `cherry-pick` git rechaza los commits parciales.
  - Hay que esperar el aviso de que un agente terminó antes de lanzar el siguiente.
- **`EVERY_TERM` ya incluye los términos del capítulo 2.**
  - Una prueba del capítulo 1 usa `CHAPTER_1_TERMS`.
  - La escalera se calcula por la posición del incidente, no por el progreso: lo fija `src/game/view/ladder.test.ts`.
- **Carpetas al tope:**
  - `src/game/` está en 12 de 12 archivos planos.
  - `tests/e2e/` en 11.
  - `src/ui/incident/` ya está partida en `side-cards/` y `map-cards/`, y tiene 10 archivos planos tras la 28 bis.
  - `pnpm structure` cuenta archivos, no subcarpetas.
- **DNS (O-2 = A, decidida el 2026-10-12; la ejecuta la Tarea 28 quater):**
  - Hasta que la 28 quater entre, el código sigue como estaba: la consulta de un `ping` o un `nc` por nombre no se dibuja, no gasta puerto y no deja fila.
  - Con la 28 quater: esa consulta es un datagrama UDP al 53 del resolver. Gasta el primer puerto del envío, deja su fila en la tabla de traducciones y va dentro de la traza del envío (`Trace.question`). El paquete que preguntó toma el puerto siguiente (consulta 51514 → 40001, `nc` 51515 → 40002).
  - Si el nombre sale del archivo hosts, o el equipo no tiene `dnsServer`, no hay consulta. Un `dig` es la consulta misma.
  - Toda respuesta del resolver llena su caché.
  - Pedir un alias cuyo destino está vivo en la caché renueva ese destino. No está verificado: el 02-12 solo ofrece `dig www`.
  - Los motivos están en `src/engine/dns/CLAUDE.md`, igual que los valores del SOA con su fuente y `MAX_ALIAS_STEPS` (8).
  - El nombre del 02-01 al 02-14 vive en `shared.ts` (`NAME`, `DOMAIN`, `HOSTNAME`).
- **NAT:**
  - Un solo contador de puertos públicos para TCP y UDP, desde el 40001.
  - Las filas fijas de un reenvío salen primero, marcadas «TCP · fija».
  - Un ping no deja fila; el texto dice que un NAT real traduce el identificador del Echo.
  - La consulta DNS de un envío por nombre deja una fila UDP antes que el paquete (O-2 = A).
  - Un NAT real puede avisar pasados al menos 6 segundos (RFC 5382 REQ-4).
- **La caja:**
  - Cada extremo de un encabezado se escribe `IP:puerto` cuando se conocen `ip-port` y el término de su puerto.
  - El puerto del cliente se oculta hasta `source-port`.
  - Con `nat` conocido, la caja muestra cuatro encabezados (ida y vuelta, local e internet).
  - Una caja nunca tapa una tarjeta abierta: tiene dos lugares, y si ninguno está libre no se abre. Entonces una nota del panel lateral, bajo la tarjeta de Lucía, dice por qué (decididas 42 y 43), y la ayuda gris pierde la frase de la caja fija mientras haya una tarjeta abierta. En ventanas de 600 px de alto o menos la nota queda bajo el borde del panel (backlog J18).
- **Solapes:**
  - Los sellos solo se mueven en horizontal. Los de un lugar se montan en abanico con paso de 25 px (O-4 = G, Tarea 28 quinquies): se ven los que caben en el pasillo entre las etiquetas vecinas, menos uno, y el último es un «+N» que abre la lista en la caja.
  - Dos sellos del mismo abanico pueden solaparse hasta lo que mide el abanico (la caja de un sello mide 36 px; los aros, 32). Es lo único que deja pasar el ayudante `pairsThatOverlap`; sello contra etiqueta nunca.
  - `spreadTags` separa las etiquetas de paquete entre sí, de los nombres de piso, de los sellos que se ven y de las etiquetas de pieza. Los anchos de las etiquetas de pieza salen de un modelo puro (`labelWidth`, `src/scene/marks/label-width.ts`) que una e2e compara con el DOM.
  - Las pruebas de solapes del 02-03, del 02-05 y del 02-08 las escribe la Tarea 28 quinquies; la del 02-10 (y la del 02-13 y la del 02-14 si hace falta) las suma la Tarea 34.
  - Un «+N» que esconde un sello de problema no está diseñado (backlog, la fila que escribe la Tarea 28 quinquies). Un centinela falla el día que un incidente lo produzca.
- **El 02-05 dibuja también `laptop-marta`.** Sin ella la estrella del medio es inalcanzable, porque la batería de sondas ve el ping que su regla del 01-12 deja entrar.
- **Huecos conocidos, sin arreglar:**
  - La pestaña de rutas de solo lectura de `router-oficina` lista `203.0.113.1/32` y `172.16.0.2/32`, IPs de routers que el mapa no dibuja (02-06 y 02-08). `routerRef` y `visibleVia` ya tratan esa IP como nombrar al router.
  - La arista de la losa cruza el nombre «Piso 1», también en el 01-06.
  - A 390 px la tarjeta de clasificar muestra 88 px de un cuerpo de 927.
  - Un lector de pantalla oye dos veces la palabra de un `Message` («Correcto: Correcto.»; backlog J13).
- **Rigor que el estudiante puede querer ver:** `router-proveedor` descarta en silencio un destino privado (decidida 11 y 01-08). RFC 1812 §4.3.3.1 obliga a avisar cuando no hay ninguna ruta, pero un proveedor que filtra direcciones privadas suele callar. Hoy el juego lo presenta como lo que hace internet con una IP privada.
- **El merge de `main` y D están hechos en `feat/chapter-2` (`5110bad` y `88053a7`), aterrizados el 2026-10-17 en `4fccc95`:** la Tarea 28 bis ya no tiene rama ni worktree propios. El reloj en las e2e de `main`, sus mutaciones, la J12 que pasó a J15, J7, los 14 conflictos y D están en la tarea.
- **Tarea 33:**
  - La prueba de la solución de referencia de un caso con `fix` tiene que comprobar también que sus tareas fallan antes de aplicarla. Hecho en la Tarea 33 (`02-14: the fix of case 5 fails before its reference solution and holds after it, and only case 5 has a fix`).
  - `router-destino` va en el `shown` del caso 5. Hecho en la Tarea 33 (`LOOP_FIX_PIECES`).
  - Falta la escena e2e de la tarjeta del caso con su sección de arreglo. Hecho en la Tarea 33, en la capa del navegador que da M27: `card-layout.browser.test.tsx` (`SCENES`, y `THE_PROVIDER_ROUTES` también en `MAP_SCENES`).

## Formato de este plan

- **Sin bloques de código y sin ensayo.** Hay identificadores en línea, tablas y prosa. Los contratos nuevos se describen con nombre, tipo y significado; la forma exacta de cada función la decide quien implementa.
- **Sin totales de tests por tarea.** Nadie ensayó el plan, así que no hay números esperados. El criterio de cierre de cada tarea es el chequeo de «Listo» (Global Constraints) en verde y que existan los tests nombrados. Los totales reales se miden al cerrar el plan y se anotan en la Tarea 35.
- **Los nombres de tests están en inglés y son exactos.** Cada uno dice qué asierta. Quien implementa puede agregar más; no puede cambiar ni quitar estos.
- **Las fichas de los 14 son ideas, no texto final.** La redacción en español (con tildes y ñ) se escribe al ejecutar cada bloque, en lenguaje llano y con una idea por mensaje, y sin nombrar un término que el jugador aún no conoce.
- **Las definiciones de los 53 términos están en el spec** y son propuestas: la prueba `ladder.test.ts` decide.

## Global Constraints

- **Rutas.** Relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Los comandos se corren desde `projects/follow-the-packet/`.
- **Reglas.** Valen las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Pesan sobre todo:
  - `folder-structure`: tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), barrels, alias `@/` y nada de `../`. **Al empezar el plan estaban en 12:** `src/ui/`, `src/game/view/cards/`, `src/engine/simulation/` y `tests/e2e/`. **En 11:** `src/engine/network/`, `src/copy/`, `src/scene/`, `src/scene/entities/` y `src/ui/incident/`. **En 10:** `src/design/primitives/` (antes de su mudanza), `src/game/`, `src/game/view/` y `src/levels/`. La Tarea 1 hace sitio en las cuatro primeras. `src/design/primitives/` llegaba a 12 con `Table` (D-3 A); el estudiante aprobó el 2026-10-11 la mudanza por familias: `card` y `tabs`, con sus tests, pasan a `src/design/primitives/panels/` (con su `CLAUDE.md`) en un commit propio, `refactor(design): split the primitives by family to make room`, que va antes del de la Tarea 17 y es su primer paso; `Table` nace ya en `panels/`. Después, `src/design/primitives/` queda en 6 archivos y `panels/` en 6 (`card`, `tabs` y `table` con sus tests); con `Message` (Tarea 18 bis), `src/design/primitives/` queda en 8. Tras la Tarea 19, `src/game/view/cards/` quedó en 12 de 12 y `src/ui/incident/` se partió en `side-cards/` y `map-cards/` (`875c27d`): hoy tiene 8 archivos planos. Medido el 2026-10-12: con el merge de `main`, `src/ui/` queda en 11 y `tests/e2e/` sigue en 11; la Tarea 28 bis suma 2 archivos a `src/ui/incident/` (10 de 12). Ninguna tarea posterior suma un archivo plano a `src/game/view/cards/` (ver «Lo que el 04 pide al código», en la Tarea 26).
  - `pure-domain-core` y `view-renders-domain-result`: el motor devuelve datos y códigos, sin reloj ni azar; ninguna vista recalcula un resultado. El estado entra al motor como entrada explícita (decidida 5), nunca como lectura escondida.
  - `english-only` y `no-comments`: código, tests, guías y commits en inglés; solo JSDoc. El texto visible va en `src/copy/` y en los archivos de incidente.
  - `rigorous-plain-copy`: nombre oficial, cada término definido donde aparece, frases cortas.
  - `explained-behavior-changes`: cada incidente y cada caso del 14 que cambia el mundo nombra el dispositivo, router o servidor cuya configuración cambió. La Tarea 3 amplía el test a los servidores.
  - `dry` con `jscpd` en umbral 0 (`minLines` 5, `minTokens` 50): los incidentes de un bloque comparten constructores en su `shared.ts`. `pnpm dup` corre en cada tarea.
  - Un estándar por elemento (`DESIGN.md`): toda interfaz nueva reutiliza `Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, `Tabs` y la leyenda. Una apariencia nueva es una variante de su primitiva; una primitiva nueva se justifica por escrito: `Table` en D-3 y la de avisos y errores en la Tarea 18 bis.
- **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE» (estudiante, 2026-10-10). Ninguna opción, recomendada o no, enseña algo inexacto aunque sea más simple: ni un texto, ni una opción de pregunta, ni una ficha, ni una decisión de diseño. Una opción inexacta se marca como tal. Lo que no se pudo verificar se dice o no se afirma (spec, «Sin verificar»).
- **Dependencias.** Ninguna nueva. `pnpm-lock.yaml` no cambia en ninguna tarea, y `package.json` tampoco, salvo la Tarea 19 bis, que toca solo su campo `scripts`.
- **Los capítulos 1 y 4 no cambian lo que calculan ni lo que muestran, salvo lo que este plan lista.**
  - `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibidos `vitest -u`, `--update` y editarlo a mano. Cada tarea de motor lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Si una tarea lo rompe, la tarea se detiene y se le pregunta al estudiante (D-1); no se regenera por cuenta propia.
  - Las pruebas del capítulo 1 y del 4 corren sin editarse en cada tarea. Las únicas que cambian a propósito: la del texto de `host-udp-no-service` (`reasons.test.ts`, Tarea 7), las que leen `listeningTcpPorts` (cambio mecánico, Tarea 6), las que citan el campo «Conexión» (D-8 = A, Tarea 16) y la aserción del caso `host-refused` de `reasons.test.ts` (Tarea 16). Cada una se lista en su tarea. Por decisiones del estudiante del 2026-10-11 cambian además, a propósito:
    - **V15 = B (Tarea 19).** Las que leen el segundo botón de la etiqueta, que solo existe en el 01-07. En `pieces.test.ts`: `a laptop that sends and has settings opens its terminal and its settings card, each from its own entry` y `a send incident with no settings gives no piece a settings entry`. En `piece-label.test.tsx`: `a piece with a settings entry has a second button beside its label that activates the entry and not the piece` e `inspects the piece from its own button and not from the settings entry`. En `terminal-card.test.ts`: `opens from the piece of the device and not from its settings entry`. Todas las de `settings-card.test.ts` (abren la tarjeta con `PIECE_ID.settings`) y la constante `ENTRY` de `settings-card.test.tsx`. En `incident-screen.test.tsx`: `the laptop opens its terminal from its piece and its settings card from its own entry, and the terminal offers no setting` y `setting the gateway on the card makes the ping come back and clears the stamps of before, and Esc gives the focus back to the entry`. En `chapter-1.test.ts`: `01-07: the gateway is set from the Ajustes de red card of the laptop, and its terminal offers no setting`. En Playwright: `SETTINGS_BUTTON` y `fixTheGateway` de `tests/e2e/chapter-1/chapter-1-play.ts`, `in 07 picking the gateway in the Ajustes de red card changes the stamps of the ping` (`chapter-1.spec.ts`) e `in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps` (`card-layout.spec.ts`). Lo que prueban se conserva: cambia por dónde se llega a la tarjeta.
    - **Tarea 18 bis.** Las dos aserciones de `identify-card.test.tsx` (`writes the line of a right chip as a note and the line of a wrong chip as an error`, que pasa a llamarse `writes the line of a right chip as a success message and the line of a wrong chip as an error`) que leen las clases `feedback` y `feedback--wrong`; leerán la variante del estándar (`success` para una ficha correcta, `error` para una incorrecta). Las que leen los roles `status` y `alert` no cambian.
    - **V12 = B (Tarea 21).** En `src/copy/terms.test.ts`: `no term of chapter 2 names an entity of the map or has a short form` (con la excepción declarada de `tcp` y `udp`) y `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded` (renombrada en la Tarea 28 ter) (la lista de variantes suma las cuatro); y `a warning is never an intruder: only the messages a sender sends are listed as an intruder too`, que se amplía porque las cuatro entidades nuevas de TCP y UDP llevan copia de intruso (V19 = B, Tarea 21).
    - **V19 = B (Tarea 21).** El intruso deja de ser un rombo en los capítulos 1 y 4: es la forma de su protocolo con el borde de intruso. La Tarea 21 lista los archivos y las pruebas que se vuelven a correr; la única que se reescribe a propósito es la de `terms.test.ts` de arriba.
    - **D-8 = A (Tarea 16).** Las cuatro pruebas de `src/game/view/inspection.test.ts` que citan el campo «Conexión»: `a device of an office shows no public IP whatever the player knows, because how a packet leaves the office is a black box`, `a laptop of the office says what a device is, and shows its IP and its firewall`, `a laptop with no cable keeps its IP and says it is not part of the network, and the rest of the office says it is connected` y `shows the connection of a device only in an office and once the term network is known`. La constante `INSPECTION_TEXT.connection` (`src/copy/screens/incident-ui.ts`) pasa de «Conexión» a «En la red». Las pruebas de `chapter-1.test.ts` que leen las líneas «Conectado a la red.» y «No está conectado: no forma parte de la red.» (`01-01: marking a connected laptop as outside leaves the task open and the box says it has an IP` y `01-01: the box of laptop-visita keeps its IP and says it is not connected, and marking it Yes says so`) leen el valor del campo y no su nombre: no cambian. Ninguna prueba de Playwright cita el campo.
    - **`host-refused` (Tarea 16).** En `src/copy/reasons.test.ts`, el caso `host-refused` de la tabla `CASES` (hoy cerca de la línea 44), que corre `describes %o` con todos los términos conocidos y fija el texto crudo «Llega, pero ningún programa escucha en el puerto 80: [[servidor2]] lo rechaza.». Solo cambia esa aserción: el texto llano que lee el jugador no cambia y aparecen las marcas de términos. Decidido el 2026-10-11 por la sesión principal (y el estudiante aprobó seguir las recomendaciones técnicas que no cambian lo que se aprende). La Tarea 6 no lo tocó: la lista de archivos de esa tarea lo traía por error y pasa a la Tarea 16.
    - **`Trace.routes` (Tarea 8, opción A, 2026-10-11).** Es un campo nuevo de la traza y dos pruebas lo ven. En `src/game/chapter-1.test.ts`, `the same ping of 01-05 and 01-11 has the same trace and only the words change` compara las dos trazas sin el campo `routes`: el camino y los pasos se siguen comparando, y las rutas difieren por diseño, porque en el 01-11 la laptop ya tiene puerta de enlace y su tabla suma la ruta por defecto. En `src/engine/simulation/ports.test.ts`, `the ICMP branch of the host stage keeps every field it had` suma `routes` a su lista de campos, porque sus tres trazas entregan el paquete a la red y las tres llevan el campo. Lo que prueban se conserva.
    - **O-3 = A1 (2026-10-12, Tarea 28 ter).** Dos pruebas leen cómo se nombra el aviso de un router sin ruta, que hoy el capítulo 1 llama «Destination Host Unreachable» hasta conocer `net-unreachable`. En `src/game/view/ladder.test.ts`: `a router with no route is named Destination Host Unreachable on 01-08 after chapter 2 too, and Destination Net Unreachable only with the term`, que pasa a llamarse `a router with no route is said in plain words on 01-08 after chapter 2 too, and named Destination Net Unreachable only with the term`. En `src/copy/terms.test.ts`: `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded`, que pasa a llamarse `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded, and a router with no route by none until net-unreachable is known` (la Tarea 21 ya la editó por V12 = B; aquí cambia lo que asierta de los avisos). El estudiante aprobó que el capítulo 1 cambie lo que muestra en ese caso, aunque hoy ningún incidente lo muestre. Otras pruebas fijan el mismo comportamiento y cambian por consecuencia; la Tarea 28 ter las lista. Lo que prueban se conserva: un router sin ruta se llama «Destination Net Unreachable» con el término y, antes, se dice en palabras llanas.
    - **46c4074 y O-1 = D (Tarea 28 bis).** Cambian a propósito, en `tests/e2e/card-layout.spec.ts`, cinco pruebas: `a pinned box survives a human-paced trip across another piece and scrolls under the mouse`, `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back`, `with touch, a tap pins the box and a tap outside releases it` y `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` (las cuatro cierran la terminal antes de pasar el mouse, porque con ella abierta no habría caja en las ventanas bajas), y `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` (gana la aserción de que la caja fijada no toca la tarjeta). Cambia también el `GameScene` simulado de `incident-screen.test.tsx`, que es un ayudante y no una prueba. Lo que prueban se conserva. La Tarea 35 completó esta lista (ver «Cierre del plan», abajo).
    - **O-2 = A (Tarea 28 quater, 2026-10-12).** `Trace.question` es un campo nuevo de la traza y la consulta gasta puerto y deja fila, así que cambian estas pruebas. En `src/engine/dns/resolve.test.ts`, `the question in a sequence › does not use up the source port of the sender nor leave a row in the translation table` (pasa a `uses a source port of the sender and leaves a row in the translation table, before the packet that asked`). En `src/engine/simulation/sequence.test.ts`, `a lookup by name fills the cache of the resolver and uses neither a port of its sender nor a row of the table, while the dig that follows has both`. En `src/game/view/inspection.test.ts`, `the dns field of a ping or an nc by name says the device asked its resolver first, or that its hosts file answered`. En `src/game/view/cards/table-card.test.ts`, `the translations card lists the rows of the sent packets in order` (la fila del `dig` gana «consulta DNS», solo si O-6 = A). Lo que prueban se conserva. Ninguna prueba del capítulo 1 ni del 4 cambia: no tienen resolver, y una que falle por el campo nuevo detiene la tarea.
    - **O-4 = G (2026-10-12, Tarea 28 quinquies).** Cambia lo que muestran los capítulos 1 y 4 (los grupos de 2 sellos o más pasan de 43 a 25 px de paso y puede aparecer «+N»; ver «Cambios visibles») y cambian a propósito estas pruebas, sin que cambie lo que prueban:
      - En `src/scene/layout.test.ts`, `paths and stamps`: `chains close points into one group: A near B and B near C spread together, although A is far from C`, `a spread group that comes close to another stamp takes it in, so no two stamps end up closer than the minimum`, `moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device` y `moves apart stamps that are farther than the minimum on the ground and still overlap on the screen, such as the two tests that stay at the doorstep and the one that ends on the road in front of it`. El ayudante `terminalOnMap` y los `describe` `the labels of packets that share a place` y `the labels of packets and the floor names` cambian de firma, no de nombre. Otras pruebas de `layout.test.ts` y de `chapter-2.spec.ts` que miden dónde cae una etiqueta de paquete se corren y cambian solo si fallan por este cambio (lista en la Tarea 28 quinquies).
      - En `tests/e2e/map-boxes.ts`, `pairsThatOverlap` y `overlappingPairs` dejan pasar sello con sello del mismo abanico hasta el solape medido del abanico. Los llaman, sin editarse, siete pruebas de `tests/e2e/chapter-1/chapter-1.spec.ts` (más la que se renombra, abajo), dos de `tests/e2e/incidents.spec.ts` (las del 04-01) y las de solapes de `tests/e2e/chapter-2/chapter-2.spec.ts` por `expectClear` (lista en la Tarea 28 quinquies).
      - Se renombra `after the four tests of case 1 of 14, no stamp overlaps another` (`chapter-1.spec.ts`) a `after the four tests of case 1 of 14, no stamp lies over a label or covers another beyond the step of the fan`.
      - `golden-traces.json` no cambia: ningún archivo de `src/engine/` ni de `src/levels/` cambia.
    - **M24 bis (2026-10-20, plan del mapa 2D, espacio entre cables).** Cambian a propósito dos pruebas que las tareas M4 y M5 del mapa 2D crearon y cuyo contrato cambia el paso de los troncos, de 8 a 16 px (12 px de aire de borde a borde): en `src/scene/layout/arrange/stack.test.ts`, `with two floors their trunks run in parallel, 8 px apart, to the router` pasa a llamarse `with two floors their trunks run in parallel, one pitch apart, to the router` (el cuerpo es el mismo, simbólico, con `TRUNK_PITCH`); y en `src/scene/layout/arrange/groups.test.ts`, `with several floors the trunks run in parallel, 8 px apart, and join at the head` pasa a llamarse `with several floors the trunks run in parallel, one pitch apart, and join at the head`, y su aserción de los carriles, `expect(lanes).toEqual([HEAD[1] - 4, HEAD[1] + 4])`, que escribía el paso viejo como un literal, pasa a `[HEAD[1] - TRUNK_PITCH / 2, HEAD[1] + TRUNK_PITCH / 2]` (el resto del cuerpo no cambia). Las nombra el cuerpo del commit `e37d66b`. La Tarea 35 completó esta lista (ver «Cierre del plan», abajo).
    - **Cierre del plan (Tarea 35, 2026-10-21): lo que cambió a propósito y faltaba en esta lista.** Cada commit nombra las suyas en su cuerpo (`git log --format=%b <hash>`); aquí se juntan por tarea, con el título que existe hoy (cada uno comprobado con `git grep -F` el 2026-10-21). La lista está reunida desde los cuerpos de los commits y las notas del relevo; no se rehízo desde los diffs, así que puede faltar el cambio de un commit sin cuerpo. Ninguna está hoy borrada. Cada una cambia su título, su montaje o lo que afirma por una decisión de este plan o del estudiante (por ejemplo, la 18 para el desbloqueo del 04-01, O-3, la fila fija del reenvío o los términos que el capítulo 4 ya conoce), no por una regresión.
      - **Tarea 16 y sus arreglos de rigor (`3346501`, `28072e5`).** Con `CHAPTER_1_TERMS` en lugar de `EVERY_TERM` (decidida 36), cuatro pruebas del capítulo 1: en `src/game/session.test.ts`, `is part of the result of its run, with the kind of warning and who generated it`; en `src/game/view/inspection.test.ts`, `a packet that came back shows its time after the result, and a warning that came back shows it too`, `the path of a packet names only the routers its incident draws, …` (que además compara la IP entera y no una subcadena, porque `203.0.113.1` está dentro de `203.0.113.10`) y `the header of a trip that leaves the office is labelled as seen in the local network`. Además, en `src/engine/simulation/ports.test.ts`, `a firewall that drops a udp datagram stays silent`: un datagrama que descarta el firewall de salida de su emisor nunca salió y no lista intercambio (punto de rigor 3 de `3346501`).
      - **Tarea 19 bis (`940f07a`).** Tres pruebas de `card-layout.spec.ts` miden en reposo y pasan el tiempo con `page.clock` en lugar de `waitForTimeout`, sin cambiar lo que afirman: `no card is clipped and cards never overlap, at 390 px and at desktop width`, `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` y `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`. Hoy están en `src/ui/incident/geometry/card-layout.browser.test.tsx`.
      - **Tareas 23 y 24, que registran el 02-01 y el 02-02 (`9d9cca5`, `716606f`, `b0188bf`).** El capítulo 2 queda entre el 1 y el 04-01 (decidida 18). Cada incidente, del 02-01 al 02-14, suma su id a la lista de `registers the prototype incidents in game order` (`src/levels/registry.test.ts`) y a la lista exacta de `the rules of a host firewall open with the term rule (01-12), and those of a Security Group with inbound rule (chapter 4)` (`src/levels/ladder.test.ts`): son solo ids, previstos por las guías, y el commit de cada incidente los nombra. En `registry.test.ts`, `brings the base world only when it opens its chapter` deja que el 02-01 abra su capítulo sin base, porque parte de la solución del 01-14 (decidida 1). En `src/game/chapter-1.test.ts`, `01-14: only chapter 4 comes after it, …` pasa a llamarse `01-14: only chapter 2 and chapter 4 come after it, …`. En `src/game/view/inspection.test.ts`, cuatro pruebas que leen la sesión del 04-01 (`an instance shows what an EC2 instance is…`, `later terms add their fields`, `the box of the server of the internet calls its IP IP pública…` y `a laptop of the office says what a device is…`) la leen sin los términos del capítulo 2 (`CHAPTER_2_TERMS`, en `@/testing`), porque el 04-01 lista «Servicios» una vez conocido `service` (decidida 20), y `a device lists its services behind the term service` espera ese campo en el 04-01. El encabezado de un paquete con puertos se escribe `IP:puerto` en cada extremo (`716606f`) y cada puerto sale según su papel en la conexión (`source-port` para el del cliente, `destination-port` para el del servicio) y no según su lugar en el paquete (`b0188bf`): `a tcp packet shows its ports in the header behind the term port` y `the box shows the header in the local network and the header in the internet once nat is known`, en `inspection.test.ts`, y `02-01: the box of the nc shows 192.168.1.11:3000 as the destination`, en `src/game/chapter-2.test.ts`, esperan una línea por encabezado en lugar de las líneas de IP y de puerto por separado. Además, lo que `9d9cca5` cambió en pruebas que siguen en el árbol: en `src/app.test.tsx` (antes e2e de `chapter-1.spec.ts`; `3bed870` las pasó a Testing Library), `chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star` abre ahora el 04-01 con el último incidente construido del capítulo 2 (`LAST_BUILT_OF_CHAPTER_2`) y `04-01 opens after 01-14 has a star` pasa a llamarse `04-01 stays locked after 01-14 has a star and opens after the last built incident of chapter 2 has one`; en `tests/e2e/chapter-1/chapter-1.spec.ts`, `chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each` termina esperando el 04-01 cerrado y el enlace al 02-01; el `beforeEach` de `tests/e2e/incidents.spec.ts`, que usa su única prueba, `04-01 and 04-02 reach 3 stars, and the progress survives a reload`, parte de `CHAPTER_2_DONE` y no de `CHAPTER_1_DONE`, porque el 04-01 abre con el 02-14; en `tests/e2e/roadmap.spec.ts`, `SOON_CHAPTER_COUNT` pasa de 31 a 30. `the inspection box floats inside the window and covers no label or stamp` (hoy en `src/ui/incident/geometry/map-boxes.browser.test.tsx`) quedó con un filtro para una etiqueta en `9d9cca5` y `118d9b0` lo quitó al limitar la caja con la marca más baja del mapa: hoy está como era.
      - **Tarea 25 (`5af4dea`).** En `src/levels/ladder.test.ts`, `a setting chip names its value, and its tray names a term` pide ahora que una ficha de dirección de escucha nombre su dirección con palabras (`127.0.0.1` o `0.0.0.0`), porque su valor es `loopback` o `all` y no puede ser su etiqueta; las fichas de puerta de enlace y de DNS se comprueban igual.
      - **Tarea 28 y sus arreglos de rigor (`dcfc04c`, `e0ae23f`, `dc40106`, `f12795f`).** `packetLabelOutside` salió con la Tarea 28 y con él la prueba `a translated packet is labelled with its private source port before the router and its public source port after it` (`src/copy/packet-labels.test.ts`); `e0ae23f` la devolvió con el mismo nombre sobre `packetPortLabels`, y `a packet that is not translated keeps one label along its whole path` recuperó sus tres aserciones en la forma de `packetPortLabels`. Los arreglos del bloque 4 cambian dos pruebas que otras tareas del capítulo habían escrito: `a translation of a ping has no port in the box and none in the label` (`src/game/view/inspection.test.ts`, el texto «en el juego solo cambia la IP de origen») y `the same trip shows the header in the internet, the route and the translation once the terms of chapter 2 are known, so the check above can fail` (`src/game/view/ladder.test.ts`, la cuenta de campos pasa de 3 a 4 con la respuesta en internet). `2b6a3e3` (la fila fija del reenvío en la tabla de traducciones, sin cuerpo en su commit) cambia en `src/game/chapter-2.test.ts` las aserciones de las filas de `02-09: a packet to the public IP on a port with no row is not delivered to any device` y de `02-09: the forward delivers to laptop-andres and nothing stops it`: de ninguna fila a la fila fija.
      - **Tarea 28 ter (`efe355b`, O-3 = A1).** Además de las dos pruebas de la lista de O-3, cambian por consecuencia, porque un aviso sin término se dice en palabras llanas hasta conocer `net-unreachable`: en `src/copy/packet-labels.test.ts`, `names each notice by its term, and a net unreachable by none until its own term is known` y `names the warning of a router with no route Destination Net Unreachable once that term is known, and by no term before`; en `src/copy/reasons.test.ts`, la fila `forward-no-route` de `HIDDEN_CAUSES` (la oculta `net-unreachable` y no `host-unreachable`); en `src/game/flow-runs.test.ts`, `a router with no route is named Destination Net Unreachable by the run once that term is known, and by no term before`; y, en `src/game/session.test.ts`, la entrada sin ruta de `is part of the result of its run, with the kind of warning and who generated it`, que lleva `term` nulo.
      - **Tarea 28 bis (`5110bad`, el merge de `main` con el pin de la caja `46c4074`).** Una sola entrada por pieza: `inspects the piece from its only button` (`src/scene/overlay/piece-label.test.tsx`: un botón, y el hover llama una vez al `onPointerEnter` de su disparador); `a pinned box whose piece is gone is released` (`src/ui/incident/incident-screen.test.tsx`: llega a los ajustes por la pestaña «Ajustes de red», con el teclado, porque desde V15 = B no hay segunda entrada); y `src/ui/incident/map-cards/piece-card.test.tsx` pasa la prop `trigger`. Las seis pruebas de `main` sobre la caja fijada se reescribieron con `page.clock`, sin `waitForTimeout` y con los nombres que tenían: `a pinned box survives a human-paced trip across another piece and scrolls under the mouse`, `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back`, `with touch, a tap pins the box and a tap outside releases it`, `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` (la del 01-05), `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` y la de la definición de un término. Hoy viven en `src/ui/incident/`, en `geometry/` o en `incident-screen.test.tsx`.
      - **Tarea 29 (`b4820ee`).** `dns` es un término conocido desde el 02-10 y el capítulo 4 va después del 2, así que la caja de una instancia de la VPC del 04-01 lista «Nombres DNS»: `src/ui/incident/incident-screen.test.tsx`, `the inspection box starts with what the piece is and leaves out fields whose term comes later`, pinta la pantalla del 04-01 sobre los incidentes de los capítulos 1 y 4 solamente (la técnica que usa `src/game/view/inspection.test.ts`) y sigue probando lo mismo. Más el id del 02-10 en `registry.test.ts` y en `ladder.test.ts`.
      - **Tareas 30 a 33 (`92d3f50`, `3f84f7d`, `8253aef`, `6991473`).** Solo los ids del 02-11 al 02-14 en `registry.test.ts` y en `ladder.test.ts` (las dos pruebas de arriba); ninguna prueba de términos se rompió. La Tarea 32 suma lo que decidió el estudiante el 2026-10-20: en `src/ui/incident/geometry/label-width.browser.test.tsx`, `the width of every label of every registered incident, those with a lock or an alert included, is never more than the model says and is at most 2 px under it` deja pasar 1 px de más en lugar de 0.5 px, porque los 30 caracteres de `servidor-autoritativo-noticias` miden 216 px en el modelo y la fuente monoespaciada de reserva del navegador de las pruebas avanza 0.602 em frente a los 0.600 em de IBM Plex Mono (dibujó 230.75 px contra 230); el modelo y los mapas no cambian.
      - **Tarea 34 (`0848a8e`).** El título de la prueba del capítulo (02-09 pasó a 02-14) y `CHAPTER_2` (cinco entradas); en `src/ui/incident/map-sweep.test.ts`, `in 02-09 and 02-10 no label or stamp overlaps, with the stamps that show and the ones that «+N» counts`, `in 02-04 placing a device inside the block moves the outline by the distance between rows, and moving it out takes it back`, `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N» without showing it` y el ayudante `statesOf`; en `card-layout.browser.test.tsx`, `SCENES` y `MAP_SCENES` ganan `THE_NAMES_TERMINAL`, que ven las cuatro pruebas que los recorren; `saved-progress.ts` exporta el id y el título del 04-01, que comparten `progress.spec.ts` y la prueba del capítulo.
      - **Lo que la migración al 2D movió.** De las pruebas de Playwright que las Tareas 19 bis a 28 bis editaron, las de `card-layout.spec.ts` y `entities.spec.ts` ya no existen en e2e: M19 a M23 del plan del mapa 2D las pasó de capa (de 143 pruebas de Playwright quedaron 7) y la mayoría conserva su título en el navegador, en jsdom o en el barrido de `map-sweep.test.ts`. `chapter-1.spec.ts`, `incidents.spec.ts` y `roadmap.spec.ts` siguen en e2e con las pruebas que las Tareas 23 y 24 editaron (arriba), salvo las dos de `chapter-1.spec.ts` que pasaron a `src/app.test.tsx`. Las pruebas que cambió a propósito la propia migración (M0 a M24 bis) están en el Cierre de cada Tarea M del [plan del mapa 2D](2026-10-12-follow-the-packet-2d-map.md) y no se copian aquí; las dos de M24 bis están arriba.
  - **Ninguna etapa nueva escribe un paso en una traza del capítulo 1 ni del 4.** Los datos nuevos de esas trazas van en campos aparte. Hay pruebas de steps con `toEqual` en `simulate.test.ts`; un paso nuevo las rompería. Si una prueba existente falla por un campo nuevo de la traza, la tarea se detiene y se le pregunta al estudiante: no se edita la prueba por cuenta propia.
- **Capturas.** Las dos capturas de `#/entidades` (`tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png`) cambian solo en cinco tareas, a propósito y revisando el diff: la 17 (suma el especimen de `Table` a la de la interfaz), la 18 (suma el de la tarjeta «Salida», plegada, a la de la interfaz), la 18 bis (regraba la de la interfaz, con el aspecto «Pestaña» de V18: los especímenes de avisos y errores pasan a la primitiva y se suma uno por variante), la 21 (suma a la de piezas los cuatro especímenes de paquete de TCP y UDP, V12 = B, el del contorno del bloque del 02-04, D-6, y los del intruso con el borde nuevo, V19 = B, que se ven en los capítulos 1, 2 y 4) y la 28 quinquies (suma a la de piezas los dos especímenes de «+N», «+2» y «+12»; la de la interfaz solo cambia si el catálogo gana una fila, y entonces solo por el desplazamiento). Si en la Tarea 21 esos especímenes no caben en celdas libres del catálogo y este gana una fila, la sección de la interfaz baja y la 21 regraba también la de la interfaz, comprobando que el diff sea solo ese desplazamiento (`DESIGN.md`, «Adding a variant instead of a new element», paso 3). Ninguna otra tarea las toca.
- **Fuentes y fechas.** Toda cifra, límite o texto de una herramienta que el juego muestre lleva su fuente y su fecha en el test que lo fija o en la guía de la carpeta. Lo del spec se consultó el 2026-10-10 y el 2026-10-11.
- **"Listo"** (regla del 2026-10-11, Tarea 19 bis; vale desde la Tarea 19, y las Tareas 0 a 18 bis se cerraron con el `pnpm check` completo de antes). `pnpm check:fast` corre tipos, lint, estructura, jscpd y Vitest, sin Playwright; `pnpm check` es `pnpm check:fast` y después toda la suite de Playwright.
  - **En cada tarea:** `pnpm check:fast`, más las specs e2e que nombra la tarea o que cubren lo que tocó (`pnpm e2e <archivo>`; la guía de `tests/e2e/` explica cómo). Lo que su sección llama «Cierre» es lo que se suma.
  - **Al cerrar un bloque de contenido (Tareas 24, 26, 27, 28, 28 bis, 28 quinquies, 32 y 33), en las Tareas 34 y 35 y antes de cada merge:** `pnpm check` completo. La 28 quinquies cambia lo que ven los capítulos 1 y 4.
  - **Una e2e que falla se compara con la base: el último commit cuyo `pnpm check` completo pasó** (el cierre del bloque anterior, o el comienzo del plan). Si falla también en esa base, no es de la tarea ni del bloque: se anota en el backlog (`../../docs/plans/2026-10-08-follow-the-packet-followups.md`) y se avisa, sin perseguirla. Si pasa en esa base, la regresión es del bloque: alguna tarea se cerró con solo `pnpm check:fast` y la dejó pasar, y aparece en el siguiente `pnpm check` completo. Se arregla dentro del bloque. No se compara con «HEAD sin los cambios de la tarea»: la regresión ya está en ese HEAD, falla también ahí y se iría al backlog por error.
  - **Nunca dos suites e2e a la vez en la misma carpeta.** Dos worktrees sí pueden: cada uno usa su puerto (Tarea 19 bis).
  - Si Playwright no encuentra Chromium: `pnpm exec playwright install chromium`.
- **Commits.** Uno por tarea, cuando el estudiante lo aprueba (regla del repo), con `git add` de las rutas que la tarea lista, nunca `git add .`. El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (segundo `-m`). **Nunca se agrega nada de `labs/`.** Sin `git push`.
- **Servidores y procesos.** No se arranca nada en los puertos 5173 y 5180 (los del estudiante): son intocables. Playwright levanta el suyo con su configuración: hasta la Tarea 19 bis en el 4183 y, desde ella, en un puerto de 4183 a 4282 derivado de la ruta del repo (nunca el 5173 ni el 5180; sigue `--strictPort`), para que dos worktrees corran e2e a la vez. Si una tarea deja un proceso, se mata solo ese PID; **prohibido matar procesos por patrón** (`pkill`, `killall`). Para la prueba humana el estudiante usa su propio servidor.
- **Ejecución.** La sesión principal orquesta y cada tarea la hace un subagente con `model` explícito: `sonnet` para explorar, implementar, revisar e investigar en la web, y `haiku` solo para correr un comando y contar su salida; nunca `opus`. Cada subagente recibe solo lo que necesita (el plan, las rutas y la tarea), no la historia. La ejecución ligera es la de siempre: un implementador por tarea, gobernado por los comandos de verificación de la propia tarea (el chequeo de «Listo», regla del 2026-10-11: `pnpm check:fast` y las specs de la tarea; el `pnpm check` completo solo donde ahí se pide), y, para los textos, un revisor `sonnet` por bloque que los lee antes de pasar al siguiente (D-15 = B, 2026-10-11: no hay prueba humana entre bloques): lenguaje llano, escalera de términos, rigor y la causa de cada cambio de comportamiento. Al cerrar un bloque se sugiere `/clear`. Un subagente no corre e2e mientras otro corre las suyas en la misma carpeta.
- **Antes de empezar cualquier tarea de contenido** se confirma que la anterior dejó en verde su chequeo de «Listo» (`pnpm check:fast` y sus specs, o el `pnpm check` completo si cerró un bloque) y que el revisor de los textos del bloque anterior terminó y sus correcciones se aplicaron. La prueba humana no se espera entre bloques: es una sola, al final de la Tarea 33.
- Ningún comando `aws`.

## Decisiones del estudiante (ya tomadas)

El estudiante aprobó los catorce subcapítulos, sus términos y el reparto en bloques; el plan no los cambia. Lo que sigue son las reglas que dio para este capítulo y cómo las aplica el plan.

| Regla del estudiante | Cómo la aplica el plan |
|----------------------|------------------------|
| **Rigor siempre.** | Global Constraints; Review Focus 18; las opciones inexactas se marcan en cada decisión abierta |
| **Ningún cambio de comportamiento sin causa** (`explained-behavior-changes`). | El 07 arranca con `router-oficina` sin rutas y el report lo nombra; el proveedor nunca avisa por una IP privada (decidida 11). El NAT del 08 no cambia el mundo: ya existía y el 08 lo muestra (decidida 3). Tarea 3 y Review Focus 6 |
| **Sin predicciones antes de actuar.** | Ninguna ficha tiene predicción; la comprobación va en la pregunta final a Lucía |
| **Lenguaje simple.** | Las fichas son ideas; la redacción final sigue `rigorous-plain-copy`; el revisor de cada bloque y la prueba humana del capítulo entero lo comprueban |
| **Una sola primitiva de UI por familia.** | Las tarjetas nuevas usan `Card`, `ChipTray`, `Button`, `Choice` y `Tabs`; las primitivas nuevas son `Table` (D-3 A, decidida el 2026-10-11) y `Message`, la de avisos y errores (Tarea 18 bis; V18 = A, 2026-10-11, con el aspecto «Pestaña» y `success` en verde) |
| **Un solo estándar para los avisos y los errores de todo el juego** (2026-10-11, al decidir V17). | Tarea 18 bis: inventario de lo que existe, un estándar con una primitiva (`Message`, V18 = A, con cuatro variantes) y las pruebas que lo guardan. Aspecto: la alternativa 3, «Pestaña», y `success` en verde (2026-10-11) |
| **Una sola entrada por pieza** (V15 = B, 2026-10-11). | Un botón por etiqueta y una tarjeta con pestañas, sin segundo botón (decidida 22; Tarea 19) |
| **Elecciones visuales con prototipos renderizados.** | Tarea 0 |
| **Sintaxis de Linux en la terminal** (D-10 del capítulo 1). | `nc -vz -w 3 <ip> <puerto>`, `dig <nombre>`, `ping -t`, `traceroute -I` |
| **El progreso guardado se puede resetear; sin migraciones.** | Los ids `02-xx` son nuevos; la clave `v2` no cambia; no hay migración (decidida 18) |
| **IPs de RFC 5737 y nombres reservados por RFC 2606:** todos los nombres del juego van bajo `.example` (D-13 = B, 2026-10-11; antes, `example.com`). | Spec, «El mapa que crece» (D-13); Review Focus 19 |
| **El 53 se lista con DNS.** (Reformulada el 2026-10-11 a pedido del estudiante, con D-18.) | `default-port` («puerto por defecto») lista 22, 80, 443, 3306 y 5432, y `well-known-ports` pasó a ser el rango de IANA de 0 a 1023, que no incluye el 3306 ni el 5432; ninguna de las dos lista el 53; `dns` dice «Usa el puerto 53» |
| **Una sola prueba humana, al final del capítulo** (D-15 = B, 2026-10-11, como en el capítulo 1). | La hace el estudiante con su servidor al terminar la Tarea 33 (sección al final de esa tarea); entre bloques, un revisor `sonnet` lee los textos (Global Constraints, «Ejecución»; «Contenido») |
| **Mismo rigor, con menos espera** (2026-10-11): pruebas e2e deterministas y un chequeo rápido por tarea. | Tarea 19 bis: un puerto por worktree, `pnpm check:fast`, ninguna espera fija ni `retries`; la regla de «Listo» en «Global Constraints» y en el Cierre de las Tareas 20 a 35 |
| **Una etiqueta de una línea que no cabe en su pantalla se corta; el nombre completo no se pierde** (2026-10-20, sobre un prototipo dibujado: https://claude.ai/artifact/LHnMUK5woLg2uJ1hKTSnfv). | El mapa corta la etiqueta de una línea que lo haría más ancho que su pantalla a los caracteres que caben y la termina en «…», con su candado; la cantidad la decide el espacio, nunca un número fijo; no baja de 12 caracteres; la de más de una línea (la del firewall) nunca se corta; el nombre accesible y la caja de INSPECCIÓN conservan el nombre completo. Lo pidió el 02-13: `servidor-autoritativo-noticias` (30 caracteres) va con candado y sin tarjeta, como dice su ficha, y a 360 px ensanchaba el mapa a 384 px (Tarea 32, fase A) |
| **El margen de la prueba del ancho de las etiquetas pasa de 0.5 px a 1 px** (2026-10-20, opción (a) del estudiante). | En `label-width.browser.test.tsx`, «nunca más ancha que el modelo» deja pasar 1 px; el texto de la prueba dice que el 1 px cubre la fuente monoespaciada de reserva del navegador de las pruebas (0.602 em frente a los 0.600 em de IBM Plex Mono; la peor deriva, 0.77 px con el nombre de 32 caracteres). Solo cambia esa comprobación de esa prueba: el modelo del ancho, los mapas y la fuente del navegador de las pruebas siguen igual (Tarea 32; en «Global Constraints») |

### Decisiones abiertas ya contestadas (2026-10-11)

El estudiante contestó el 2026-10-11 las dieciocho decisiones abiertas. Aprobó la recomendación del plan en la mayoría; eligió otra opción en D-5 (la B, reformulada con un dato nuevo), D-9, D-13 y D-15, y D-18 no traía recomendación. D-12 y D-17 se habían decidido antes de ese día.

| Decisión | Elección | Nota |
|----------|----------|------|
| D-1 | A, no regenerar | Verificado el 2026-10-11: las 81 trazas de `src/levels/04-iaas/golden-traces.json` son ICMP. Si una tarea lo rompe, se detiene y se pregunta. |
| D-2 | A, movimientos nuevos dentro de `send` (`placeEntry`, `removeEntry`, `wait` y `setSetting` generalizado) | Ninguna mecánica nueva. |
| D-3 | A, una primitiva `Table` (V10 = A) | La Tarea 17 deja de esperar. `src/design/primitives/` llegaba a 12 de 12 archivos; la mudanza por familias, aprobada, lo evita (ver abajo). |
| D-4 | A, la tarjeta «Salida» que generaliza la de traceroute | V11 = B (2026-10-11): se imprime la salida completa de `dig` y se pliega; ver la Tarea 18. |
| D-5 | **B, reformulada con el dato nuevo:** `nc` imita `ncat` 7.93 de Nmap y `dig` imita BIND 9.18 | **No es la recomendación original del plan (A, OpenBSD `nc`).** El `nc` de Amazon Linux 2023 es `ncat` 7.93 (paquete `nmap-ncat`, que no viene en la AMI estándar) y su `dig` es de BIND 9.18 (el repositorio de Amazon Linux 2023 trae la 9.18.50). Fuentes leídas el 2026-10-11: `ncat_connect.c` de nmap-7.93 y `dighost.c` de bind-9.18.50. La salida de `ncat` no lleva `[tcp/...]`: la subpregunta sobre `tcp` antes del 02 ya no aplica. Ver D-5 y la Tarea 18. |
| D-6 | A, `identify` con una tarjeta de clasificar | Segunda excepción declarada a «algo viaja»: en el 04 no viaja nada. Referencia visual: la sección D-6 de la página de prototipos (https://claude.ai/artifact/HC9ersrkMisGqkCwnEF8mH). Lo que el código necesita para dibujarla está en la Tarea 26. |
| D-7 | A, reescribir las definiciones sin mover términos; `nat` con la definición amplia | — |
| D-8 | A, el campo «Conexión» pasa a llamarse «En la red» | Se hace en la Tarea 16. El campo solo existe en la caja de un dispositivo de una oficina (capítulos 1 y 2); la de un dispositivo de una VPC no lo tiene. |
| D-9 | **B,** una forma propia para TCP y otra para UDP, cada una llena (el pedido) y en anillo (la respuesta) (V12 = B) | **No es la recomendación del plan (A).** Costo que el estudiante acepta: cuatro entidades más en el catálogo, que `ENTITY_TERMS` nombra con `tcp` o `udp` (y que `TERM_ENTITY` lleva a esos dos términos), y la captura de piezas regrabada en la Tarea 21. ICMP conserva sus formas. |
| D-10 | A, los servidores DNS son piezas del mapa (variante `internet-server`) | V14 = A, aprobado el 2026-10-11. |
| D-11 | A, un reloj explícito con el movimiento `wait` | V16 = C (2026-10-11): el reloj tiene una tarjeta propia, «Reloj del juego», en el panel del incidente, bajo la de Lucía; ver las Tareas 15 y 19. |
| D-12 | A, el caso 5 del 14 trae `fix` | Decidida antes del 2026-10-11. |
| D-13 | **B,** todos los nombres del juego bajo `.example` (RFC 2606 §2) | **No es la recomendación del plan (A, `example.com`).** `example.com` y `example.org` ya no se usan. Ver D-13. |
| D-14 | A en las dos partes: el paquete sin fila no se entrega (timeout) y la fila fija la da el mundo del 09 | — |
| D-15 | **B,** una sola prueba humana, al final | **No es la recomendación del plan (A, una por bloque).** Como en el capítulo 1. Entre bloques, un revisor `sonnet` lee los textos (Global Constraints, «Ejecución»). |
| D-16 | A, `traceroute -I` se queda | B queda como seguimiento en el backlog. |
| D-17 | A, construir los catorce como están y separar solo si la prueba humana del capítulo entero lo pide | Decidida antes del 2026-10-11. |
| D-18 | **B,** dos términos: `default-port` («puerto por defecto», núcleo, en el 05) y `well-known-ports` («puertos conocidos») redefinido como el rango de IANA de 0 a 1023 | D-18 no traía recomendación. Ver D-18 y la Tarea 2 bis. |
| Mudanza de e2e (Tarea 1) | A, un alias `@e2e/*` → `tests/e2e/*` en `tsconfig.json` y una línea en la regla `folder-structure` | El lint prohíbe `../` en `tests/**` y los tests no tenían alias: sin él, un spec en `tests/e2e/chapter-1/` no podía importar los ayudantes. Contestada el 2026-10-11 por la sesión principal. Ninguna dependencia nueva. |
| Mudanza de `src/design/primitives/` (Tarea 17) | Aprobada: `card` y `tabs`, con sus tests, pasan a `src/design/primitives/panels/` | Aprobada el 2026-10-11 por el estudiante. Un commit propio, `refactor(design): split the primitives by family to make room` (hecho, `8a024d9`), antes del de la Tarea 17; `Table` nace ya en `panels/`. |
| V18 (Tarea 18 bis) | **A,** la primitiva `Message`, con cuatro variantes: `note`, `success`, `warning` y `error`. Aspecto: la alternativa 3, **«Pestaña»** | Decidida el 2026-10-11. El estudiante rechazó la franja izquierda en `note` y `success`, que se parecía a lo que genera una IA; eligió entre tres formas nuevas. El color de `success` es **verde**, apagado, como la tinta de un sello (`--palette-green` y el rol `--color-success`). Ver «Decisiones visuales» y la Tarea 18 bis. |
| V19 (Tarea 21) | **B,** una sola regla para todo paquete: la forma dice el protocolo y un borde rojo de intruso dice el papel | Decidida el 2026-10-11; **no es la recomendación del orquestador (A,** que el intruso conservara el rombo). En el capítulo 2, el intruso TCP del 02-05 es el cuadrado de TCP con el borde de intruso. En los capítulos 1 y 4 desaparece el rombo: el intruso de ICMP es la forma del ping con el mismo borde (cambio visible, Tarea 21). Referencia: la sección V19, opción B, de la página de prototipos. |

No queda ninguna decisión abierta (2026-10-11): ni las dieciocho (D-1 a D-18), ni las visuales de la Tarea 0 (V10 a V17; están en «Decisiones visuales», al final), ni las que abrieron después las Tareas 18 bis y 21: V18 (la primitiva `Message`, el aspecto «Pestaña» y el verde de `success`) y V19 (la forma del intruso).

### Decisiones abiertas ya contestadas (2026-10-12)

El estudiante contestó el 2026-10-12 las cuatro decisiones abiertas la noche del 2026-10-11 (sección siguiente). Aprobó la recomendación del plan en tres; en O-4 eligió una opción nueva, G, que el plan no traía. Su criterio es «rigurosa, visual y entendible». Las decisiones nuevas del 2026-10-12 que siguen abiertas son O-6 y O-7; O-5, O-8, O-9 y O-10 se decidieron con la regla del umbral (decididas 52 a 55).

| Decisión | Elección | Nota |
|----------|----------|------|
| O-1 | **D,** la caja de inspección se aparta de la tarjeta abierta | Tiene dos lugares: abajo a la derecha y abajo a la izquierda. Se abre en el que no toca la tarjeta; si ninguno está libre, no se abre, y una caja fijada se suelta. Porqué: es una sola regla para todas las cajas y todas las tarjetas («una caja nunca tapa una tarjeta abierta»), no muestra nada falso y conserva J7 donde hay caja. La ejecuta la Tarea 28 bis. |
| O-2 | **A,** se dibuja la consulta DNS de un `ping` o un `nc` por nombre | Gasta puerto y deja fila en la tabla de traducciones. Porqué: un equipo que usa un nombre le pregunta antes a su resolver, y A lo dibuja en vez de contarlo en un campo; así un envío que no sale se ve en el mapa y el par del 02-13 se distingue. La ejecuta la Tarea 28 quater. |
| O-3 | **A1,** en el capítulo 1 el aviso de un router sin ruta se dice en palabras llanas hasta que se conozca `net-unreachable` | Porqué: B afirma algo falso («Host» para lo que el router avisa con el código 0, Network Unreachable) aunque hoy ningún incidente lo muestre, y A1 es la más barata de las tres que lo corrigen: no mueve ni agrega términos. La ejecuta la Tarea 28 ter. |
| O-4 | **G,** abanico hasta lo que cabe y un sello «+N» | Opción nueva, que el estudiante pidió al preguntar cómo crece cada opción y cómo lo resuelven otros sistemas; no es la recomendación del plan (C). Si caben todos los sellos del lugar, se ven todos; si no, se ven los que caben menos uno y el último es el sello «+N», que abre la lista de todos. La ejecuta la Tarea 28 quinquies (ver la línea «Decidida» de O-4). |

## Decisiones abiertas de la noche del 2026-10-11

Estas cuatro decisiones (O-1 a O-4) se abrieron la noche del 2026-10-11 (O-4, pasada la medianoche, ya el 2026-10-12), después de contestadas las anteriores: la frase «No queda ninguna decisión abierta (2026-10-11)» de arriba valía hasta esta noche. El 2026-10-12 el estudiante decidió O-1 (D), O-2 (A), O-3 (A1) y O-4 (G): las cuatro están decididas. Cada una trae sus opciones, una recomendación razonada con las reglas del proyecto (rigor, un estándar por elemento y causas a la vista), el porqué, la opción inexacta o que engaña marcada como tal y las tareas que dependen de ella.

Los prototipos renderizados de O-1 y O-2 están en una página publicada el 2026-10-11: https://claude.ai/artifact/WuUFHfn7Ryzki8f1AbHrST. Los dibujos no son capturas: se calcularon con el CSS de `src/styles.css`, las medidas de `src/scene/layout.ts` y el arte de las piezas, porque nadie arrancó la app esa noche. O-3 se decide con el texto. Los de O-4 están en otra página publicada: https://claude.ai/artifact/B7hsCV4ySvrtXhFErM73ZF (su fuente local, temporal, es `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/4fb9dddd-09ca-4da4-bcb4-f94c447042db/scratchpad/chapter-2-decision-o4.html`); esos dibujos se calcularon con un port de las funciones de `layout.ts`, ver «Lo que no se pudo verificar» de O-4.

### O-1. La caja de inspección tapa la tarjeta recién abierta

**Pregunta.** Con una tarjeta abierta, ¿qué hace la caja de inspección de una pieza?

**Recomendación: D.** La caja se aparta de la tarjeta abierta y solo se cierra si no hay sitio. Es la única que da una sola regla a todas las cajas y conserva J7. Para lo más barato hoy, A destraba el merge y deja S2 abierto.

**Qué pasa hoy en `feat/chapter-2`.**

Al pulsar una pieza se abre su tarjeta y el puntero sigue sobre la pieza, así que su caja también se abre, como vista previa del mouse. La caja va abajo a la derecha del mapa, en una capa por encima de las tarjetas, con 22 rem de ancho (352 px) y hasta el 45 % del alto del mapa. Toma el puntero solo cuando su texto no cabe, y se queda abierta mientras el puntero la cruza.

A 1280×360 el mapa mide 900×360 (la ventana menos los 380 px del panel), la caja puede medir 352×162 y la tarjeta del firewall del 01-13 (300 px de ancho, a 110 px de su pieza) queda justo debajo de ella. La caja tapa «Listo». Como su texto no cabe a esa altura, toma el puntero: sigue abierta mientras el puntero está sobre ella y unos 400 ms (la gracia) después de que sale. Según el CSS, la ayuda gris de la esquina, que se dibuja cuando no hay caja, también queda sobre la tarjeta, sin tomar el puntero.

**Qué pasa con el arreglo `46c4074` de la rama del capítulo 1.**

El mismo clic que abre la tarjeta también fija la caja: su banda dice «Fijada» y ofrece «Cerrar». Se queda encima de «Listo» hasta «Cerrar», Escape o un clic fuera de la caja. Esa rama lo pidió por «una sola regla»: todo clic en una pieza fija su caja, tenga o no tarjeta, y dijo que si chocaba con abrir la tarjeta se parara y se informara.

Chocó: a 1280×360 «Listo» queda fuera de alcance y una prueba del juego falla. Por eso el merge de `feat/chapter-1-fourteen` quedó sin hacer hasta decidir O-1 (decidida el 2026-10-12: lo hace la Tarea 28 bis).

En el merge resuelto, la prueba `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window` de `tests/e2e/card-layout.spec.ts` falla con «1280×360, the firewall with its tabs: its foot is out of reach». Falló en las 5 corridas repetidas guardadas en `committed-x5.log`. El plan de esa rama es `docs/plans/2026-10-11-follow-the-packet-floating-box-hover.md`.

**Tres momentos para probar cada opción.**

- **S1.** La pieza cuya tarjeta acaba de abrirse (el clic).
- **S2.** Cualquier otra pieza o sello al que se pasa el mouse con la tarjeta abierta. En el capítulo 2 es lo normal: la terminal no se cierra al enviar y el jugador pasa por los sellos para leer la caja de cada envío.
- **S3.** Una caja que el jugador fijó antes de abrir la tarjeta.

**Qué arregla cada opción.**

| Opción | S1 · el clic | S2 · otra pieza | S3 · lo fijado | J7 · fijar y desplazar | Costo |
|--------|--------------|-----------------|----------------|-----------------------|-------|
| A | Sí | No | En parte | Sí | Pequeño |
| B | Solo quita «Fijada» | No | Sí | Sí | Pequeño |
| C | Solo el puntero | Solo el puntero | Solo el puntero | No donde se solapa | Pequeño |
| D | Sí | Sí | Sí | Sí, donde hay sitio | Lógica nueva entre la caja y la escena |
| E | Sí | Sí | Sí | Sí | El mapa pierde alto |

**Las opciones.**

- **A. Una pieza muestra su tarjeta o su caja, nunca las dos.** El clic que abre la tarjeta no fija la caja y la cierra. Mientras esa tarjeta está abierta, esa pieza no abre caja.
  - Qué arregla: Resuelve S1. No resuelve S2: la caja de otra pieza vuelve a caer sobre «Listo». S3 ya lo cubre en parte el clic fuera de la caja de la rama del capítulo 1 (suelta lo fijado).
  - Cómo crece: La regla es por pieza y no mira dónde está la tarjeta. Con tablas, pestañas, «Salida» y el reloj las tarjetas son más altas y la zona tapada crece. Con mapas de ocho piezas el camino a «Listo» cruza más etiquetas y cada una abre su caja: S2 pasa más veces.
  - Qué pierde: Mientras la tarjeta está abierta no se puede leer la caja de esa pieza (IP, servicios, «En la red»). Hay que cerrar la tarjeta con «Listo».
  - J7 (poder fijar una caja para leerla y hacer scroll): Se conserva: un sello o una pieza sin tarjeta se sigue fijando, leyendo y desplazando.
- **B. Abrir cualquier tarjeta suelta toda caja fijada.** Al abrirse una tarjeta, por clic o por teclado, se liberan las cajas fijadas. La vista previa del mouse no cambia.
  - Qué arregla: Resuelve S3 y quita el «Fijada» de S1. No resuelve la vista previa de S1 (el puntero sigue en la pieza, así que la caja sigue ahí, como hoy) ni S2. Arregla lo que el arreglo 46c4074 agregaría, no lo que pasa hoy.
  - Cómo crece: Igual que hoy: nada mira dónde está la tarjeta. Cada tarjeta nueva y cada pieza nueva repite el problema de hoy.
  - Qué pierde: Nada que hoy tenga. Tampoco arregla lo de hoy.
  - J7 (poder fijar una caja para leerla y hacer scroll): Se conserva.
- **C. Ninguna caja toma el puntero donde pisa una tarjeta abierta.** **Engaña al jugador.** La caja se sigue viendo encima y el clic y la rueda pasan a lo que hay debajo.
  - Engaña: Sí engaña. El jugador ve una caja encima de un botón y un texto que no puede leer ni usar. El botón tapado responde, pero él no lo sabe. Si quiere leer o desplazar la caja en esa zona, el clic y la rueda caen en la tarjeta de abajo: puede elegir una ficha o quitar una regla sin querer, y eso cambia el mundo del incidente. Una caja fijada tendría su «Cerrar» sin respuesta donde la tarjeta la cubre. Y una vista previa que el puntero no puede recorrer incumple WCAG 2.2, 1.4.13 «Hoverable» (nivel AA), en esa zona.
  - Qué arregla: Resuelve el puntero en S1, S2 y S3. No resuelve la vista: la caja sigue tapando «Listo», las fichas y las reglas.
  - Cómo crece: Peor: cuanto más grande la tarjeta, más controles hay bajo la caja.
  - Qué pierde: Leer lo tapado. J7 en la parte solapada: la rueda y el clic no llegan a la caja.
  - J7 (poder fijar una caja para leerla y hacer scroll): Solo fuera de la zona solapada.
- **D. La caja se aparta de la tarjeta abierta y solo se cierra si no hay sitio.** **Recomendada.** La caja tiene dos lugares: abajo a la derecha (el de hoy) y abajo a la izquierda. Se abre en el que no toca la tarjeta. Si ninguno está libre, no se abre y una caja fijada se suelta. Es una sola regla para todas las cajas: una caja nunca tapa una tarjeta abierta.
  - Qué arregla: Resuelve S1, S2 y S3, también la vista.
  - Cómo crece: La regla no depende de lo que tenga la tarjeta: mide la tarjeta que hay, así que sigue valiendo con tablas, pestañas, «Salida» y reloj, y con ocho piezas. Lo que crece es el caso «sin sitio», que depende de dónde esté la tarjeta y del tamaño de la ventana. A 1000×700 el mapa mide 620 px y la tarjeta (300) y la caja (352) no caben una al lado de la otra. Con la tarjeta acoplada abajo a la izquierda y la caja abajo a la derecha hacen falta 674 px de mapa, es decir, una ventana de unos 1054 px. A 900 px o menos la caja ya sale del mapa y no choca.
  - Qué pierde: En ventanas de 901 a unos 1054 px, con una tarjeta acoplada abierta, no hay cajas: hay que cerrar la tarjeta. Cuesta lógica nueva: la caja es hermana de la escena y la tarjeta vive dentro del `Html` de drei y se mueve con la cámara (`useCardSide` escribe su posición en cada frame), así que alguien tiene que medirla y avisar a la caja. Y el sitio libre tiene que contar también las etiquetas de las piezas: `terminalSide` ya hace algo parecido con `avoid` para las tarjetas.
  - J7 (poder fijar una caja para leerla y hacer scroll): Se conserva donde hay caja. Donde no hay sitio, no hay caja que fijar.
- **E. La caja sale del mapa.** (opción agregada) De otra clase que las demás: la caja va siempre en un renglón bajo el mapa, a cualquier ancho, como ya hace el CSS a 900 px o menos. Nunca choca con una tarjeta.
  - Qué arregla: Resuelve S1, S2 y S3 por construcción: la caja y la tarjeta no comparten espacio.
  - Cómo crece: No depende de las tarjetas ni de las piezas. Depende del alto de la ventana.
  - Qué pierde: El mapa pierde ese alto siempre. A 1280×360 la caja ocupa hasta 162 px y el mapa queda de 198 px, menos que la tarjeta más baja que admite el juego (200 px). Si el renglón no tiene alto fijo, el mapa cambia de tamaño con cada caja. Y es un rediseño de la ventana del juego.
  - J7 (poder fijar una caja para leerla y hacer scroll): Se conserva.

**Las que se descartaron.**

- Anclar la caja junto a su pieza, como la tarjeta: ataca la causa de J7 (la caja estaba a 405–650 px de su sello), pero es un rediseño de la caja y puede tapar etiquetas vecinas. D es un primer paso hacia ella.
- Que la tarjeta se aparte de la zona de la caja: cambia dónde abre cada tarjeta del juego y no cabe en ventanas de menos de unos 1054 px.
- Poner la tarjeta por encima de la caja: la caja queda cortada y no se puede leer.

**Por qué D.**

- **Rigor.** D no muestra nada falso ni deja un botón que se ve y no responde (C). Tampoco recorta la caja. E tampoco, pero le quita alto al mapa.
- **Un estándar por elemento.** D es una sola regla para todas las cajas y todas las tarjetas, las de hoy y las que vengan: «una caja nunca tapa una tarjeta abierta». A es una regla de una pieza, B de un clic y C una excepción del puntero.
- **Causas a la vista.** Con D la caja está a la vista, en el otro lugar, o no hay caja y la tarjeta que ocupa el sitio es la causa. Cuando no hay sitio, el motivo debe estar escrito; la tarea decide dónde.
- **J7.** La caja fijada sigue pudiéndose leer y desplazar donde la hay.
- **Para lo más barato hoy:** A. Destraba el merge con un cambio pequeño y deja S2 abierto, que es el caso normal del capítulo 2. D puede llegar después sin deshacer A.

**Qué depende de esta decisión.**

- El merge de `feat/chapter-1-fourteen` en `feat/chapter-2` (lo hace la Tarea 28 bis). El merge resuelto está guardado en `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/4fb9dddd-09ca-4da4-bcb4-f94c447042db/scratchpad/merge/` (`resolved-merge.patch` y `resolved-files/`, siete archivos: `docs/plans/2026-10-08-follow-the-packet-followups.md`, `projects/follow-the-packet/src/ui/CLAUDE.md`, `.../src/ui/incident/CLAUDE.md`, `.../src/ui/incident/incident-screen.tsx`, `.../src/ui/incident/incident-screen.test.tsx`, `.../tests/e2e/CLAUDE.md` y `.../tests/e2e/card-layout.spec.ts`). Esa ruta es temporal: si se borra, el merge se rehace con el commit `46c4074` como base.
- `tests/e2e/card-layout.spec.ts`: la que falla hoy, `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`, y la que fija la regla de la rama del capítulo 1, `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` (A y D la cambian). También se corren `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view`, `a pinned box survives a human-paced trip across another piece and scrolls under the mouse` (J7) y, en `tests/e2e/incidents.spec.ts`, `the inspection box floats inside the window and covers no label or stamp`.
- Con D (decidida): la Tarea 28 bis. La 19 y la 21 están hechas. La caja mide la tarjeta ya dibujada en el DOM (`.map-card`) y la escena solo exporta el selector `MAP_CARD`.

**Lo que no se pudo verificar.**

- Los dibujos no son capturas: nadie arranca la app esta noche. Se calcularon con el CSS de `src/styles.css`, las medidas de `src/scene/layout.ts` y el tamaño del arte de las piezas. La posición de las piezas y la altura natural de la tarjeta del firewall son aproximadas.
- Lo medido por la prueba de la rama (que el centro de «Listo» queda fuera de alcance a 1280×360) se leyó en el log, no se volvió a correr.
- WCAG 2.2, 1.4.13 «Hoverable», leído en `https://www.w3.org/TR/WCAG22/` con `curl` el 2026-10-11.

**Decidida (2026-10-12): D.** La caja de inspección se aparta de la tarjeta abierta. Tiene dos lugares: abajo a la derecha y abajo a la izquierda. Se abre en el que no toca la tarjeta; si ninguno está libre, no se abre, y una caja fijada se suelta. Es la recomendación del plan. Porqué: es una sola regla para todas las cajas y todas las tarjetas, las de hoy y las que vengan («una caja nunca tapa una tarjeta abierta»); no muestra nada falso ni deja un botón que se ve y no responde; y conserva J7 (fijar una caja para leerla y desplazarla) donde hay caja. La ejecuta la Tarea 28 bis, «el merge de `main` y la caja que se aparta (O-1 = D)».

### O-2. La consulta DNS de un `ping` o un `nc` por nombre

**Pregunta.** Cuando el jugador hace `ping` o `nc` a un nombre, ¿se dibuja la consulta que el equipo manda antes a su resolver?

**Recomendación: A.** Dibujarla. Es la que modela la realidad y la que deja ver en el mapa la trampa del archivo hosts y un nombre que no existe. Cuesta motor (gasta un puerto y deja fila) y reabre la decidida 4.

**Qué pasa hoy.**

El motor ya calcula esa consulta como un paquete UDP al puerto 53 del resolver (`sendQuery` en `src/engine/simulation/simulate.ts`): pasa por los firewalls, las rutas y el NAT como cualquier datagrama. Pero la corre desde un estado vacío y la deja fuera del resultado: no se dibuja, no gasta un puerto del contador del emisor y no deja fila en la tabla de traducciones (decidida 4: la tabla muestra solo los envíos del jugador).

La caja del paquete lo cuenta en su campo «DNS»: que el equipo preguntó antes a su resolver o que contestó el archivo hosts. En ninguna opción se dibuja la pregunta del resolver al servidor autoritativo (decidida 13).

**Las opciones.**

- **A. Dibujar la consulta.** **Recomendada.** Un paquete UDP del equipo al resolver y su respuesta, antes del `ping` o del `nc`, con su fila en la tabla de traducciones.
  - Qué cambia:
    - **02-10.** `ping www.lucia.example` muestra la consulta y después el ping. `dig` no cambia: ya es la consulta.
    - **02-11.** El `nc` por nombre manda primero la consulta. La consulta gasta el puerto 51514 y deja la fila 51514 → 40001; el `nc` sale del 51515 y se traduce a 40002 (decididas 4 y 6). Los números que el jugador ya vio se mueven, y la caja tiene que decir por qué.
    - **02-13.** `ping tienda.lucia.example` lee el archivo hosts y no dibuja ninguna consulta, mientras que un `ping` por DNS sí la dibuja. La trampa de hosts se ve en el mapa. `dig tienda.lucia.example` sí dibuja la consulta.
    - **02-14, casos 1 a 3.** En el caso 1 cada prueba por nombre (`dig`, `ping`, `nc`) dibuja su consulta. En el caso 2, el `nc` a `wwww.lucia.example` hoy no mueve nada: con A se ve la consulta y su respuesta NXDOMAIN, y nada más sale. El caso 3 repite el par del 02-13.
    - **02-12** no cambia: solo repite `dig`.
  - Cómo crece: Cada envío por nombre suma dos paquetes y una fila, así que con ocho piezas y varios envíos hay más sellos en el mapa. No toca el capítulo 4: una VPC no tiene resolver dibujado ni `dnsServer`.
  - Qué pierde: Más cosas en el mapa por cada envío. Reabre la decidida 4. Dibuja la mitad del intercambio (equipo y resolver), no la otra mitad (resolver y autoritativo), así que no es la red completa. No se verificó cuántas consultas manda un `ping` real ni en qué orden consulta Amazon Linux el archivo hosts y el DNS (la guía `src/engine/dns/CLAUDE.md` dice que no se verificó).
- **B. Dejarla como hoy.** No se dibuja, no gasta puerto y no deja fila. La caja del paquete lo cuenta.
  - Qué cambia:
    - **02-10, 02-11, 02-12, 02-13 y 02-14.** Nada del motor ni de las fichas cambia.
    - **02-13.** El `ping` por DNS y el `ping` con hosts se ven igual en el mapa. Solo la caja los distingue.
    - **02-14, caso 2.** El `nc` a un nombre que no existe no mueve nada: el jugador ve un envío que no sale, y la causa está solo en la caja.
  - Rigor: No es inexacta: la caja lo dice y nada de lo que muestra es falso. Omite tráfico.
  - Cómo crece: Nada nuevo: no suma paquetes ni filas, con cualquier número de piezas.
  - Qué pierde: El mapa no enseña la consulta cuando el jugador hace `ping` o `nc`, y la trampa de hosts queda en un texto.

**Por qué A.**

- **Rigor.** «Entre una opción más simple y otra que modela la realidad, la segunda.» Un equipo que usa un nombre le pregunta antes a su resolver. A lo dibuja; B lo cuenta en un campo.
- **Causas a la vista.** Con A, un `nc` que no sale por un NXDOMAIN, o un `ping` que no sale porque un firewall descartó la consulta (`dns-resolver-silent`), se ven en el mapa. Con B el jugador ve un envío que no se mueve y tiene que abrir la caja para saber por qué.
- **El par del 02-13** es la mejor lección del capítulo sobre nombres: dos `ping` que parecen iguales y solo uno pregunta al DNS. Con A los dos se ven distintos; con B, iguales.
- **El costo es de motor y no de la lección:** la consulta tiene que gastar un puerto y dejar fila, y la traza de la consulta tiene que llegar a la vista. La guía del motor deja abierto si se mezcla con la del paquete que preguntó.

**Qué depende de esta decisión.**

- Tareas ya hechas que A reabre: 4 (el puerto de origen), 5 (la secuencia pura, `sequence.ts`), 12 y 13 (`sendQuery` y `Resolution.query`), 16 (los textos y el campo «DNS» de la caja, commit `3346501`). Los commits de las Tareas 4, 5, 12 y 13 son `3e8c58c`, `cdf0fe7`, `497b0c2` y `af7d831`.
- Tareas pendientes: 21 (la escena dibuja la consulta y su respuesta, con la forma UDP y la etiqueta «UDP 51514 → 53» que cambia al cruzar el router), 29 (02-10), 30 (02-11), 32 (02-13) y 33 (02-14, casos 1 a 3). La 31 (02-12) no cambia.
- La decidida 4 («La tabla muestra solo los envíos desde el último cambio de mundo») pasa a incluir las consultas.

**Lo que no se pudo verificar.**

- No se verificó cuántas consultas manda un `ping` real ni que lea el archivo hosts antes que el DNS en Amazon Linux. La guía del motor lo dice y esta decisión no lo resuelve.
- Los dibujos no son capturas: la posición de las piezas del mapa es aproximada, los textos de las cajas son de ejemplo con la forma de los reales, y la tarjeta y la caja van a los lados del mapa (no es una ventana del juego) para que se vea el dibujo.
- Que las Tareas 4, 5, 12, 13 y 16 están hechas sale de los mensajes de commit de la rama (`git log`), no de las casillas del plan.

**Decidida (2026-10-12): A.** Se dibuja la consulta DNS de un `ping` o un `nc` por nombre: gasta puerto y deja fila en la tabla de traducciones. Es la recomendación del plan. Porqué: un equipo que usa un nombre le pregunta antes a su resolver, y A lo dibuja en vez de contarlo en un campo; así un envío que no sale por un nombre que no existe o por una consulta descartada se ve en el mapa, y el par del 02-13 (dos `ping` que parecen iguales y solo uno pregunta al DNS) se distingue. La ejecuta la Tarea 28 quater, «la consulta DNS de un envío por nombre se dibuja (O-2 = A)». Las Tareas 29 a 33 esperan a esa.

### O-3. En el capítulo 1, un router sin ruta avisa «Destination Host Unreachable»

**Pregunta.** ¿Se corrige el nombre del aviso de un router sin ruta en el capítulo 1?

**Recomendación: A1.** Decirlo en palabras llanas hasta que se conozca el término. B es la inexacta. Hoy ningún incidente del capítulo 1 lo muestra, así que el cambio es pequeño, pero toca una decisión fijada a propósito y necesita tu visto bueno.

**El hecho.**

- Un router sin ninguna ruta al destino, ni siquiera la ruta por defecto, avisa con ICMP tipo 3, código 0: Network Unreachable. RFC 1812 §4.3.3.1: «If a router cannot forward a packet because it has no routes at all (including no default route) to the destination specified in the packet, then the router MUST generate a Destination Unreachable, Code 0 (Network Unreachable) ICMP message.»
- RFC 1812 §5.2.7.1 define los dos códigos: «0 = Network Unreachable - generated by a router if a forwarding path (route) to the destination network is not available» y «1 = Host Unreachable - generated by a router if a forwarding path (route) to the destination host on a directly connected network is not available (does not respond to ARP)».
- RFC 792 solo nombra los códigos («0 = net unreachable; 1 = host unreachable») y dice que el gateway «may send» el aviso cuando, según sus tablas, la red es inalcanzable. La regla que obliga es la de RFC 1812.
- Consultados con `curl` y `grep` sobre `rfc-editor.org/rfc/rfc1812.txt` y `rfc792.txt` el 2026-10-11.

**Qué muestra el juego.**

- **Lo que muestra el capítulo 1.** `WARNING_TERM` en `src/copy/packet-labels.ts` convierte el aviso `net-unreachable` en el término `host-unreachable` mientras `net-unreachable` no se conoce, y `warningOf` lo aplica. El capítulo 1 lo decidió así: «un término para los dos». Dos pruebas lo fijan a propósito: `a router with no route is named Destination Host Unreachable on 01-08 after chapter 2 too, and Destination Net Unreachable only with the term` (`src/game/view/ladder.test.ts`) y la que espera `host-unreachable, host-unreachable, time-exceeded` para los tres avisos (`src/copy/terms.test.ts`).
- **Lo que hace el capítulo 2.** Desde el 02-07 el término `net-unreachable` se conoce y el aviso se llama «Destination Net Unreachable». Un jugador que vuelve al capítulo 1 con ese término conocido ve el nombre correcto.
- **Hoy no se ve.** Ningún incidente del capítulo 1, tal como está escrito, hace que un router sin ruta avise. Se revisaron las listas `send.to` de los incidentes 01-06 a 01-10 y de los casos del 01-14, y los routers de `src/levels/01-first-day/shared.ts`: los destinos son direcciones de la oficina (las atiende `router-oficina` o el propio equipo), la del servidor (que el proveedor y el router de destino saben alcanzar) y 10.0.0.10 (una IP privada, que el proveedor descarta sin avisar, decidida 11). Desde el 01-08 `router-oficina` tiene ruta por defecto, y el 01-10 le quita el aviso al proveedor (`sendsUnreachable: false`). Solo las pruebas le quitan la ruta a un router a mano.

**Las opciones.**

- **A1. Corregir el capítulo 1: palabras llanas hasta conocer el término.** **Recomendada.** Mientras `net-unreachable` no se conozca, el aviso de un router sin ruta se dice sin nombre de host: «un router avisó que no tiene ruta a esa red». Es lo que ya piden `rigorous-plain-copy` y `explained-behavior-changes`: si el término no llegó, se dice en palabras llanas.
  - Costo: Toca `WARNING_TERM` y `warningOf` (el aviso admitiría «sin término»), los textos de `src/copy/reasons.ts` y `visibleIp` de `src/game/view/revealed-routers.ts`, y reescribe las dos pruebas de arriba. Choca con una decisión fijada a propósito: el Goal del plan («sin cambiar lo que el capítulo 1 muestra») y la prueba de `ladder.test.ts` dicen que el capítulo 1 muestra lo mismo después del capítulo 2. Aunque hoy ningún incidente lo muestre, necesita el visto bueno expreso del estudiante.
- **A2. Corregir el capítulo 1: llamarlo «Destination Unreachable».** Un nombre genérico, el del mensaje ICMP tipo 3 (RFC 792: «Destination Unreachable Message»), hasta que se conozca el término.
  - Costo: Es un término nuevo del registro, con su definición y su lugar en la escalera, o un cambio del nombre de `host-unreachable`, que el 01-05 enseña bien para el aviso del propio equipo. También choca con el Goal.
- **A3. Corregir el capítulo 1: presentar `net-unreachable` antes.** El término se presenta en un incidente del capítulo 1, por ejemplo el 01-08.
  - Costo: Mueve un término de la tabla aprobada de catorce subcapítulos. El precedente es D-7 B (mover términos), que se descartó.
- **B. Dejarlo.** **Inexacta.** Un router sin ruta se llama «Destination Host Unreachable» en el capítulo 1.
  - Costo: Cero hoy: nada cambia en el juego ni en las pruebas.
  - Rigor: Es inexacta: llama «Host» a lo que el router avisa con el código 0, Network Unreachable. Hoy está latente porque ningún incidente lo muestra.

**Por qué A1.**

- **Rigor.** B afirma algo falso aunque hoy no se vea. A1 es la más barata de las tres que lo corrigen y no mueve ni agrega términos.
- **No cambia lo que el jugador ya vio:** hoy ningún incidente lo muestra. A1 sería un commit propio: la Tarea 16 (los textos), que ya tocó estos archivos, está hecha.
- **Hay que decidirla** porque choca con una decisión fijada a propósito (el Goal del plan y una prueba), aunque hoy no se vea.

**Qué depende de esta decisión.**

- El capítulo 1 y su copia: `src/copy/packet-labels.ts` (`WARNING_TERM`, `warningOf`), `src/copy/reasons.ts` (los casos que dicen `warning('host-unreachable')`) y `src/game/view/revealed-routers.ts` (`visibleIp` usa `host-unreachable` para los dos avisos del traceroute).
- Las dos pruebas que cambiarían: `a router with no route is named Destination Host Unreachable on 01-08 after chapter 2 too, and Destination Net Unreachable only with the term` (`src/game/view/ladder.test.ts`) y `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded` (`src/copy/terms.test.ts`).
- La Tarea 27 (02-06 y 02-07, donde se presenta `net-unreachable`) si se elige A3.

**Lo que no se pudo verificar.**

- Qué imprime un `ping` real de Linux o de macOS para el código 0 no se probó: el juego dice el nombre del mensaje ICMP, no la salida de una herramienta.
- Que hoy ningún incidente del capítulo 1 lo muestre sale de leer las listas `send.to` y los routers de `shared.ts`; no se jugó cada combinación ni se corrió el motor sobre ellas.
- RFC 1812 y RFC 792, leídos con `curl` y `grep` el 2026-10-11.

**Decidida (2026-10-12): A1.** En el capítulo 1, el aviso de un router sin ruta se dice en palabras llanas hasta que se conozca el término `net-unreachable`. Es la recomendación del plan. Porqué: B afirma algo falso («Host» para lo que el router avisa con el código 0, Network Unreachable) aunque hoy ningún incidente lo muestre, y A1 es la más barata de las tres que lo corrigen: no mueve ni agrega términos. El estudiante aprobó que el capítulo 1 cambie lo que muestra en ese caso. La ejecuta la Tarea 28 ter, «el aviso de un router sin ruta, en palabras llanas en el capítulo 1 (O-3 = A1)».

### O-4. Los sellos de un mismo lugar no caben entre las etiquetas vecinas

**Pregunta.** En el 02-03, ¿cómo se hace sitio a los tres sellos de `laptop-lucia`, que hoy pisan la etiqueta de `laptop-marta`?

**Recomendación: C.** Los sellos de un lugar se montan en abanico (paso de 25 px en vez de 43), con el arreglo común de las etiquetas de paquete (abajo). El signo de cada sello queda entero, cada sello sigue a la altura de su lugar, cada etiqueta sobre su pieza, y no cambia el tamaño de ningún mapa. Lo que cuesta: tapa 7 px del anillo del sello de al lado y obliga a reescribir qué cuenta como solape (Review Focus 14). Con el `GAP` de hoy (3,2) aguanta 3 sellos en un lugar, con 6 px de holgura; con 3,65, 4. A (más espacio entre equipos) no tapa nada, pero solo cabe hasta `GAP` ≈ 3,65, que deja 0,5 px, porque el 01-08 deja de caber a 1280×800 con más (estimado). B es la que engaña.

**Qué pasa hoy en `feat/chapter-2`.**

A 1280×800 y a 1440×900 (el mismo dibujo corrido 80×50 px), con los cuatro envíos del 02-03, el mapa quieto tiene dos pares que se pisan y el animado, uno. Tienen causas distintas.

- **Los sellos no caben.** Los tres sellos de `laptop-lucia` miden 36 px y están a 43 px uno de otro (`STAMP_SPREAD`, 0,8): ocupan 122 px. Quedan encerrados entre la etiqueta del firewall de `tu-laptop` (termina en x 387) y la de `laptop-marta` (empieza en x 501): un pasillo de 114 px. El tercer sello pisa esa etiqueta 11 px. Aun pegados del todo (paso de 36 px) ocuparían 108 px y sobrarían 6 px para cuatro holguras de 8 px. Pasa con y sin animaciones. Los sellos solo se mueven en horizontal porque su altura dice dónde ocurrió: en `laptop-lucia`, a 1280×800, la puerta está en y 369, el firewall en 383 y el camino en 402.
- **Una etiqueta pisa su sello.** Solo sin animaciones: la etiqueta «TCP 51515 → 3000» pisa su propio sello, el ✕ de `laptop-marta`. Las etiquetas de paquete se apartan de los nombres de piso (`clearOfNames`) y no miran los sellos. Su paso (184 px) no depende de `GAP`.

**El arreglo común a las cuatro opciones.** Ninguna opción arregla sola el segundo par: con A sola, la etiqueta y su sello dejan de pisarse con `GAP` ≈ 5,9 (calculado), y antes la etiqueta de otro envío pisa a `laptop-marta`. Por eso las cuatro llevan lo mismo: la etiqueta de paquete se aparta de los sellos como ya se aparta de los nombres de piso (`clearOfNames` pasa a mirar también los sellos). Con ese arreglo solo queda el primer par. Es una propuesta calculada, no probada en el juego.

**Lo que aguanta cada opción.** El pasillo de `laptop-lucia` en el 02-03, con 8 px de holgura. «Sellos» son los que terminan en un mismo lugar. `GAP` no puede pasar de ≈3,65 (ver A).

| Opción | 3 sellos | 4 sellos | 5 sellos | Capítulos 1 y 4 | Costo |
|--------|----------|----------|----------|-----------------|-------|
| A | `GAP` 3,9 · fuera del tope | `GAP` 4,7 · fuera del tope | `GAP` 5,5 · fuera del tope | Cambian: todo mapa de oficina más ancho, y el 01-08 casi no cabe | Alto para lo que da |
| B | 2 filas | 2 filas | 3 filas | Sin cambio donde caben | Medio |
| C | `GAP` 3,3 · cabe | `GAP` 3,7 · con 3,65 caben con 6 px | `GAP` 4,2 · fuera del tope | Cambian solo los grupos de 2 sellos o más | Medio |
| D | 20 px (y 5) | 41 px (y 26) | 63 px (y 48) | Sin cambio donde no hay solape | Alto |

En D la cifra es cuánto se corre la etiqueta de la derecha (`laptop-marta`) y, entre paréntesis, la de la izquierda (la del firewall de `tu-laptop`). Con A cada sello de más pide 43 px de pasillo, es decir, 0,8 de `GAP`; con C, 25 px.

**Las opciones.**

- **A. Más espacio entre equipos.** `GAP` pasa de 3,2 a 3,65 como máximo: los equipos de una fila quedan 12 px más lejos en horizontal y 7 en vertical (19 y 11 con 3,9).
  - Qué ve el jugador: Los tres sellos caben (122 px en un pasillo de 138) y dejan 0,5 px a `laptop-marta` y 15 a la etiqueta del firewall. Los sellos y las etiquetas son los de siempre. 3,65 es lo mínimo que pasa la prueba y su holgura cambia con la fuente; con 7 px de holgura hay que llegar a 3,9.
  - Cómo crece: Cada sello de más pide 0,8 de `GAP`: 4 piden 4,7 y 5 piden 5,5 (con 8 px). El tamaño de la oficina no depende de lo que se dibuja (regla de `layout.ts`), así que A no se adapta: se fija para 3. Con mapas de 8 piezas, la losa de un piso de 8 equipos mide 876, 973 y 1026 px con `GAP` 3,2, 3,65 y 3,9; a 1280×800 (mapa de 900 px) solo cabe con 3,2. El camino de afuera (routers, internet, servidores) no usa `GAP`.
  - Capítulos 1 y 4: Cambian todos los mapas de oficina con 2 o más equipos en un piso. El más ancho de hoy es el 01-08 (3 equipos en el piso 1 y 1 en el 2, router y servidor; `INTERNET_PIECES`). Por `layOutOffice`, `layOutOutside` y `bounds` mide ≈ 826 px con 3,2, 863 con 3,65 y 883 con 3,9, y la cámara lo centra en sus límites: el vértice derecho de la losa queda a +428, +446 y +456 px del centro, contra +450 que da un mapa de 900 px. Con 3,9 se corta y con 3,65 sobran ≈ 4 px (estimado, ±15 px: hay que medirlo). Las pruebas que lo guardan son las de `tests/e2e/chapter-1/chapter-1.spec.ts` (01-06, 01-08, 01-10 y los siete casos del 01-14) y las del 02-07, a 1280×800 y a 1440×900. `src/levels/04-iaas/golden-traces.json` no cambia: guarda trazas del motor y `layout.ts` no está en ellas.
  - Costo: Alto para lo que da: cambia el tamaño de los mapas ya aprobados, deja casi sin margen al más ancho y aguanta 3 sellos. Pide también una regla de contenido (como mucho 3 envíos que terminen en un mismo lugar) y el arreglo común.
- **B. Una segunda fila para los sellos.** **Engaña al jugador.** Los sellos de un lugar que no caben en una fila bajan a otra.
  - Engaña: La altura de un sello dice dónde ocurrió: puerta, firewall o camino. El tercer sello, que llegó a la puerta, bajaría 43 px (y 414) y quedaría por debajo del camino de `laptop-lucia` (y 402). Con una fila de 36 px la segunda no puede quedar más cerca sin pisar a la primera.
  - Cómo crece: Con 3 sellos, 2 filas; con 5, 3 (a 86 px de la puerta). Si `laptop-lucia` tuviera dibujada la etiqueta de su firewall, la segunda fila caería encima de ella (x 337–483, y 412–432, calculado). En el mapa quieto la fila cae sobre la franja de las etiquetas de paquete y las empuja. Con mapas de 8 piezas actúa por grupo de sellos y no cambia el tamaño del mapa, pero cada grupo baja por su cuenta y su segunda fila puede caer sobre la etiqueta de su firewall o sobre las de otras piezas.
  - Capítulos 1 y 4: Sin cambio donde caben los sellos. Necesita el ancho de las etiquetas vecinas: `layout.ts` solo conoce `LABEL_REACH` (64 px de medio ancho) y la etiqueta del firewall de `laptop-marta` mide 146.
  - Costo: Medio: filas dentro de `spreadStamps`, con el ancho de las etiquetas, y una regla nueva sobre qué significa la altura de un sello.
- **C. Los sellos de un lugar se montan en abanico.** **Recomendada.** Paso de 25 px en vez de 43: cada sello tapa 7 px del anterior y el de más a la derecha queda encima.
  - Qué ve el jugador: Los tres ocupan 86 px y dejan 6 px a `laptop-marta` y 21 a la etiqueta del firewall. El signo (✓, ✕, ? o !) queda entero (mide unos 14 px, estimado); se tapa un trozo del anillo, así que un sello perdido (anillo de rayas) o intruso (anillo doble) se ve con el anillo cortado, pero se sigue leyendo. No engaña, pero tapa información.
  - Qué tapa: La parte del botón que se puede tocar mide 25×32 px. Cumple los 24×24 de WCAG 2.2, criterio 2.5.8 (nivel AA), con poco margen. Si el apilado siguiera el orden de los envíos y no el del abanico, un sello del medio quedaría tapado por los dos lados y mediría 18 px.
  - Cómo crece: 25 px por sello: con `GAP` 3,2 caben 3; 4 piden 3,4 sin holgura y 3,7 con 8 px; 5 piden 3,9 y 4,2. Como `GAP` no puede pasar de ≈3,65, C aguanta 3 con el de hoy (6 px) y 4 con 3,65 (6 px). Con mapas de 8 piezas el abanico es local a cada lugar: el mapa no cambia y, en la variante «siempre», no necesita el ancho de las etiquetas vecinas.
  - Capítulos 1 y 4: Con la variante «siempre» (todo grupo de 2 sellos o más se monta) cambian solo esos grupos: el 01-09 ofrece cinco TTL a un mismo servidor y los más altos terminan juntos. Los mapas no cambian de tamaño. La variante «solo cuando no cabe» deja los capítulos 1 y 4 como están, pero son dos disposiciones para el mismo sello y necesita el ancho de las etiquetas vecinas, como B.
  - Costo: Medio: el paso y el orden de apilado en `spreadStamps`; subir el sello al frente al pasar el mouse o enfocarlo (si no, el foco de uno tapado se ve cortado); y cambiar qué cuenta como solape en las pruebas: `pairsThatOverlap` tendría que dejar pasar sello con sello hasta 7 px y seguir fallando sello con etiqueta. Cambia la letra del Review Focus 14.
- **D. La etiqueta de la pieza vecina se aparta.** La etiqueta de `laptop-marta` se corre 20 px a la derecha y deja 8 px a los sellos, como ya se apartan las etiquetas de paquete de los nombres de piso.
  - Qué ve el jugador: Los sellos no cambian. Con 3 sellos no engaña (20 px); con 5 la etiqueta queda a 63 px de su pieza y, con 119 px de ancho, cuelga junto al sello y no sobre su pieza.
  - Cómo crece: Con 3 sellos, 20 px a la derecha (y 5 a la izquierda); con 4, 41 y 26; con 5, 63 y 48. Con mapas de 8 piezas, cada grupo de sellos empuja a sus dos vecinas.
  - Capítulos 1 y 4: Sin cambio donde no hay solape.
  - Costo: Alto. Hoy la posición de una etiqueta es una función del mapa (`labelPosition`) y la de los sellos sale del tráfico (`Traffic`): hay que llevar los sellos hasta las etiquetas. Las usan también la tarjeta (`cardPlacement`: `avoid`, `labels`, `dockRoom`) y la prueba `pieceUnder` de `tests/e2e/map-boxes.ts`, que supone la etiqueta centrada sobre su pieza.

**Las que se descartaron.**

- Subir las etiquetas de los equipos: la etiqueta de la pieza siguiente de la fila queda 50 px más abajo y 86 px a la derecha; subirla lo bastante para librar los sellos la deja a la altura de la anterior, y las etiquetas (de 100 a 119 px) se pisarían entre sí.
- Un paso de 36 px sin más (sellos pegados): caben 3 en el pasillo de hoy (108 de 114 px) solo si el grupo se corre 7 px a la izquierda de su lugar y queda con 3 px por lado; con 4 no cabe y depende del texto de las etiquetas vecinas.
- Un solo sello con una cuenta (×3): quita la caja de inspección de cada envío, porque cada sello es un botón con la suya, y es un elemento nuevo.

**Por qué C.**

- **Rigor.** C no muestra nada falso: cada sello sigue a la altura de su lugar, cada etiqueta sobre su pieza y el signo de cada sello se ve entero. Pierde un trozo del anillo. A no tapa nada, pero con 3,65 deja 0,5 px y depende de la fuente, y con 3,9 el 01-08 deja de caber. B afirma un lugar falso. D separa la etiqueta de su pieza.
- **Un estándar por elemento.** C es una sola regla para todo grupo de sellos: se montan en abanico (la variante «siempre»). El arreglo común reúsa lo que ya hacen las etiquetas con los nombres de piso. La variante «solo cuando no cabe» serían dos disposiciones para un mismo sello.
- **Causas a la vista.** Con C la altura de un sello sigue diciendo dónde ocurrió y cada sello se puede señalar con el mouse: al pasarlo sube al frente. Con B no.
- **Deciden dos números.** El incidente más lleno que existe pone 3 sellos en un lugar (el 02-03); los demás no están escritos y no se pueden contar. Con O-2 = A cada envío por nombre suma un sello de consulta en el resolver, y eso cuenta. Y A pide 3,9 para tener holgura, que deja al 01-08 sin margen (estimado). C aguanta los 3 sin tocar ningún mapa.
- **Si no aceptas** que un sello tape un trozo del anillo del de al lado, la única que queda es A, hasta 3,65 y con 0,5 px.

**Qué depende de esta decisión.**

- `src/scene/layout.ts` y `layout.test.ts` (`spreadStamps`, `spreadTags` y `clearOfNames`; `GAP` con A). La Tarea 21 ya los toca: el arreglo puede ir en ella o en un commit propio antes de las Tareas 26 en adelante.
- **La prueba de solapes del 02-03**, guardada en un parche: `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/4fb9dddd-09ca-4da4-bcb4-f94c447042db/scratchpad/02-03-overlap-test.patch` (suma a `tests/e2e/chapter-2/chapter-2.spec.ts` `in 02-03 no piece label, floor name, stamp or packet label of the still map overlaps another after the four tests`, sin animaciones, y `in 02-03 no piece label, floor name or stamp of the map overlaps another after the four tests`, con ellas, a 1280×800 y a 1440×900) y la medida que la acompaña, `zz-measure.spec.ts` en la misma carpeta. Esa ruta es temporal: si se borra, la prueba se rehace con los cuatro envíos del 02-03. Hoy falla: 2 pares medidos sin animaciones y 1 con ellas. Debe pasar con la opción que se elija más el arreglo común (con C, tras cambiar qué cuenta como solape: sello con sello puede montarse hasta 7 px, sello con etiqueta nunca).
- **La prueba equivalente del 02-13**, si tiene más envíos (hasta cinco, según el encargo de esta decisión), y las de la Tarea 34 (`in 02-09 and 02-10 no label or stamp overlaps` y `after the pings of 02-07, no label or stamp overlaps`, Review Focus 14).
- Con A: las pruebas de que el mapa cabe (capítulo 1 y 02-07), a 1280×800 y a 1440×900.
- O-2 = A (decidida): la consulta DNS suma sellos de consulta en el resolver. Con G cuentan entre los sellos del lugar que reparte el abanico: el techo de 3 sellos por lugar deja de ser un límite, porque los que no caben van al sello «+N».
- La página de prototipos de O-4: https://claude.ai/artifact/B7hsCV4ySvrtXhFErM73ZF (publicada el 2026-10-12).

**Lo que no se pudo verificar.**

- Los dibujos de las opciones no son capturas: se calcularon con un port a Python de las funciones de `layout.ts` (`spreadStamps`, `spreadTags`, `clearOfNames`) y de la proyección del mapa, calibrado con las cajas que midió Playwright en `before.txt`: reproduce las de hoy con 2 px de diferencia como mucho. El arreglo común es una propuesta y también está calculado, no probado en el juego. El arte de las piezas es simbólico y el dibujo de «hoy» usa las cajas medidas.
- El ancho del 01-08 sale de portar `layOutOffice`, `layOutOutside` y `bounds` y de suponer ±65 px de etiqueta en routers e internet: no se midió, y el error puede ser de ±15 px. Mientras no se mida, «el 01-08 deja de caber con 3,9» es una estimación.
- El ancho de las etiquetas (79, 100, 119, 127 y 146 px) es el medido con las fuentes de esa máquina; con otras, el pasillo cambia.
- No se corrió ninguna prueba ni se arrancó la app.
- Los incidentes 02-04 a 02-14 no están escritos: no se contó cuántos sellos terminan en un mismo lugar. Una combinación igual de fichas reemplaza a la anterior (`lastOfEach` en `src/game/flow-runs.ts`, que `src/game/session.ts` usa para `sent`), así que los sellos por lugar no pasan de las combinaciones distintas que terminan ahí. En los incidentes `send` del capítulo 1, el mayor grupo que se ve en las listas de fichas es el de los TTL altos del 01-09; no se jugó, y no se contaron los flujos de los incidentes `filter` (01-12, 01-13 y el capítulo 4).
- El corredor de los servidores de la calle, con sus etiquetas altas, es otro que el de una fila de equipos: no se calculó. Tampoco el 02-07 completo.
- El tamaño del signo de un sello (unos 14 px) es una estimación. WCAG 2.2, 2.5.8, leído en `https://www.w3.org/TR/WCAG22/` con `curl` el 2026-10-12.

**Decidida (2026-10-12): G.** Es una opción nueva, que el plan no traía: el estudiante la pidió después de preguntar cómo crece cada opción y cómo lo resuelven otros sistemas. No es la recomendación del plan (C). Está descrita y dibujada en la página republicada https://claude.ai/artifact/B7hsCV4ySvrtXhFErM73ZF (fuente local, temporal: `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/4fb9dddd-09ca-4da4-bcb4-f94c447042db/scratchpad/chapter-2-decision-o4.html`). Porqué: su criterio, «rigurosa, visual y entendible», y que aguante el crecimiento: con pocos sellos se ven todos, con muchos el mapa no se rompe, y lo que se esconde queda contado y listado. La regla:
- **Abanico.** Paso de 25 px, en la variante «siempre» (todo grupo de sellos de un lugar se monta).
- **Cuántos se ven.** Si caben todos los sellos en el pasillo libre entre las etiquetas vecinas, se ven todos. Si no, se ven los que caben menos uno, y la última casilla es un sello «+N»: el mismo estándar de sello, distinguido por su texto, encima del abanico. Al pasar el mouse, al enfocarlo o con un toque, abre la caja de inspección con la lista de todos los sellos del lugar, como un caso nuevo de `inspect()` y sin primitiva nueva.
- **Prioridad.** Los sellos de problema (✕, ?, ! e intruso) no entran en «+N» mientras haya sellos sin problema que puedan entrar. Entre iguales, los más antiguos. Si hay más sellos de problema que casillas, entran los más antiguos de ellos.
- **Holgura.** La del dibujo de C y G, sin el mínimo de 8 px. En el 02-03 caben 3 casillas con 6,4 px de sobra. La prueba de solapes deja pasar sello con sello del mismo abanico hasta lo que se solapan sus cajas, falla con sello contra etiqueta y cuenta los sellos que se ven, no los que hay. Los aros se tapan 7 px (el sello mide 32 px y el paso es de 25), pero la prueba mide cajas: la de un sello girado −8° mide 36,1 px (calculado) y las cajas se solapan unos 11 px. La cifra se mide en el primer paso de la Tarea 28 quinquies.
- **Desde 10 escondidos.** El número exacto con letra más chica (14 px cabe, medido), nunca «9+».
- **Abierto, al backlog.** Cómo se ve un «+N» que esconde un sello de problema. Va con una prueba que falla si un incidente registrado llega a esconder uno.
- **Arreglo común.** Las etiquetas de paquete se apartan de los sellos y de las etiquetas de pieza: el 02-05 y el primer par del 02-08 son una etiqueta de paquete sobre la etiqueta de un firewall, no un sello. Si apartarlas solo en horizontal no alcanza, la etiqueta sube o baja lo justo, con tope (decidida 55).
- **Quién la ejecuta.** La Tarea 28 quinquies (escrita el 2026-10-12, en cuatro commits). Destraba las pruebas de solapes del 02-03, del 02-05 y del 02-08, y la del 02-10 (Tarea 34). Con O-2 = A, cuenta también los sellos de las consultas DNS.
- **Lo que G deja sin cerrar.** Cinco puntos que G no cerraba se decidieron sin el estudiante y quedan para revisar, en «Decididas sin el estudiante»: el título de la lista de un «+N» (50, que se aparta del texto de la página), la leyenda de los sellos (51), las etiquetas de paquete de los sellos escondidos (53, O-8, que también se aparta de la página), la altura de los sellos de un grupo encadenado (54, O-9) y la etiqueta que no cabe moviéndola en horizontal (55, O-10).

## Decisiones abiertas del 2026-10-12

**Las dos están decididas (estudiante, 2026-10-12): O-6 = A y O-7 = A. Ninguna bloquea ya nada.** Estas dos decisiones salieron de la replanificación del 2026-10-12 (la Tarea 28 quater y la Tarea 32). Ninguna bloqueaba una tarea entera: O-6 afectaba un paso de la Tarea 28 quater y O-7 una ficha de la Tarea 32. Cada una trae su recomendación y, por opción, qué arregla, qué pierde y cómo crece; la inexacta, si la hay, va marcada. El estudiante contesta de a una, a través de la sesión principal. Su criterio es «rigurosa, visual y entendible». Las otras cuatro que salieron de la misma replanificación (O-5, O-8, O-9 y O-10) no pasaron el umbral para abrirse y están en «Decididas sin el estudiante (para revisar)», 52 a 55.

### O-6. La tabla de traducciones: cómo se marca la fila de una consulta DNS

**Pregunta.** Con O-2 = A, un `ping` o un `nc` por nombre deja en la tabla de traducciones la fila de su consulta antes que la del paquete, y un `dig` deja la suya. Son filas UDP iguales a las demás. ¿Cómo sabe el jugador cuál es de qué?

**Recomendación: A.** Es una palabra, no un color.

**Qué afecta (ya no bloquea nada).** Solo la marca de la fila, en el paso de la vista de la Tarea 28 quater (y la prueba `a row made by a datagram to port 53 wears the words consulta DNS once dns-query is known`). El orden de las filas y la fila «en uso» no dependen de ella.

**Las opciones.**

- **A. La fila hecha por un datagrama al 53 lleva «consulta DNS» en la columna del protocolo** (también la de un `dig`), cuando `dns-query` ya se conoce; antes dice «UDP». **Recomendada.**
  - Qué arregla: dos filas UDP iguales dejan de confundirse.
  - Qué pierde: cambia a propósito la fila del `dig` en una prueba existente, `the translations card lists the rows of the sent packets in order`.
  - Cómo crece: una palabra por fila, con cualquier número de envíos.
- **B. Sin marca.**
  - Qué arregla: nada. Es entendible, pero hay que abrir cada caja para saber cuál fila es cuál.
  - Qué pierde: la tabla muestra dos filas UDP iguales por cada envío por nombre.
  - Cómo crece: peor con cada envío por nombre, que suma una fila igual.
- **C. Una columna «Destino».** **Inexacta.** La fila del NAT no depende del destino (RFC 4787 REQ-1 y RFC 5382 REQ-1, decidida 4); una columna con destino dice lo contrario.
  - Qué arregla: separaría las filas a la vista, pero con una causa falsa.
  - Qué pierde: la exactitud.
  - Cómo crece: una columna más para todas las filas.

**Qué depende de esta decisión.** La Tarea 28 quater, solo el paso de la marca de la fila y las dos pruebas que la nombran.

**Prototipo:** https://claude.ai/artifact/3yLNkFurxLnhSeTfZN2Bap (una sola página para O-6 y O-7; fuente local, temporal: `chapter-2-decisions-o6-o7.html` en el scratchpad). Los dibujos son SVG calculados, no capturas.

**Decidida el 2026-10-12: A (estudiante).** La fila hecha por un datagrama al puerto 53 lleva «consulta DNS», también la de un `dig`. Porqué: la recomendación pasó sus criterios («rigurosa, visual y entendible»). Sin marca, las filas UDP no se distinguen, y una columna «Destino» sería inexacta, porque la fila no depende del destino (RFC 4787 REQ-1, RFC 5382 REQ-1).

### O-7. ¿El 02-13 suma un `ping` por DNS para ver el contraste?

**Pregunta.** La decisión O-2 decía que el 02-13 mostraría el contraste entre un `ping` por DNS (que dibuja la consulta) y un `ping` con archivo hosts (que no dibuja ninguna). La ficha del 02-13 no tiene un `ping` por DNS: manda `dig` de tres nombres y `ping tienda.lucia.example`. El contraste real es otro: `dig tienda` dibuja una consulta y `ping tienda` (archivo hosts) no dibuja ninguna. ¿Se suma un `ping` por DNS a la ficha?

**Recomendación: A.** No sumarlo.

**Qué afecta (ya no bloquea nada).** Solo la ficha del 02-13 (Tarea 32).

**Las opciones.** Ninguna es inexacta.

- **A. No. Recomendada.**
  - Qué arregla: el contraste ya se ve, con `dig` y `ping` del mismo nombre.
  - Qué pierde: el contraste no se hace con el mismo comando.
  - Cómo crece: nada nuevo. El 02-13 ya es denso (cuatro términos y cinco tareas, D-17).
- **B. Sí, una ficha `ping www.lucia.example`.**
  - Qué arregla: muestra las dos cosas con el mismo comando.
  - Qué pierde: cuesta una ficha más, o una tarea más, en un incidente que ya puede partirse.
  - Cómo crece: el 02-13 pesa más, y la prueba humana del capítulo entero es la que decide si hay que partirlo.

**Qué depende de esta decisión.** La Tarea 32 (ficha y tests del 02-13). La nota que la Tarea 32 ya trae vale con A.

**Prototipo:** https://claude.ai/artifact/3yLNkFurxLnhSeTfZN2Bap (una sola página para O-6 y O-7; fuente local, temporal: `chapter-2-decisions-o6-o7.html` en el scratchpad). Los dibujos son SVG calculados, no capturas.

**Decidida el 2026-10-12: A (estudiante).** El 02-13 no suma un `ping` por DNS. Porqué: el contraste ya se ve, porque `dig tienda` dibuja una consulta y `ping tienda` no; además el 02-13 ya es denso.

## Decisiones abiertas

Contestadas (ver «Decisiones abiertas ya contestadas»): las dieciocho, D-1 a D-18. D-12 y D-17 se habían decidido antes del 2026-10-11 y las demás se decidieron el 2026-10-11. Las opciones siguen abajo como registro y cada una cierra con su línea «Decidida».

Eran dieciocho decisiones (D-18 se abrió el 2026-10-11, después de la Tarea 0). Cada una trae sus opciones, una recomendación que sigue la regla de rigor («entre una opción más simple y otra que modela la realidad, la segunda») y el porqué; una opción inexacta se marca como tal. Las que son visuales (D-3, D-4, D-9 y D-10) se las lleva la Tarea 0 con prototipos renderizados. Ninguna tarea de motor espera una decisión visual; las tareas que dependen de una decisión lo dicen en su encabezado.

### D-1. El test dorado del capítulo 4: regenerar o no

El encargo pide decidir si arreglar UDP cambia las trazas del capítulo 4 y qué se hace.

- **Hecho verificado el 2026-10-11:** `src/levels/04-iaas/golden-traces.json` guarda 81 trazas, todas con `"protocol":"icmp"`, y ninguna menciona `udp`. Las únicas reglas del capítulo 4 son ICMP, así que ningún paquete TCP ni UDP de la batería de sondas pasa el firewall ni llega al host. Un cambio en el host para TCP o UDP, en el puerto de origen, en las rutas o en la traducción no puede alterar ese archivo, salvo que toque un camino compartido: `describePacket`, el resumen de `tcpdump`, `route.ts`, la rama ICMP de `host.ts` o `reply.ts`.
- **A. No regenerar.** Cada tarea de motor corre `git diff --exit-code src/levels/04-iaas/golden-traces.json` y la prueba dorada; la rama ICMP y la VPC quedan byte a byte; los campos nuevos de la traza están ausentes en la VPC. Si una tarea lo rompe, se detiene y se pregunta.
- **B. Regenerar a propósito,** con el diff revisado por el estudiante.
- **Recomendación: A.** No hay ningún cambio de rigor en una traza ICMP de la VPC que justifique B. Regenerar sin necesidad pierde la garantía «el capítulo 4 no cambia» que protege todo lo ya jugado. B queda como salida si una tarea descubre un caso que no se previó; entonces lo decide el estudiante con el diff delante.
- **Decidida: A, no regenerar (2026-10-11).**

### D-2. Dónde viven las ediciones de rutas y de registros

El jugador edita una tabla de rutas (07 y el caso 5 del 14) y una zona de DNS (11). El encargo pide decidir cuáles son mecánicas nuevas y cuáles reutilizan `filter`, `send` o `identify`.

- **A. Movimientos nuevos dentro de `send`.** `placeEntry` y `removeEntry` (rutas y registros), `wait` (el reloj, D-11) y `setSetting` generalizado (puerta de enlace, servidor DNS, dirección de escucha). El jugador manda los paquetes desde la terminal y edita la tabla en su tarjeta; cada edición limpia los envíos viejos, como hoy `setSetting`. Las tareas dicen el estado final, no «ver antes» (decidida 27).
- **B. Una mecánica nueva `edit`,** hermana de `filter`, con flujos en vivo.
- **C. Generalizar `filter`** a «tablas» (reglas, rutas y registros).
- **Recomendación: A.** `filter` es de firewall (Type, Source, la batería de sondas y la estrella de «no abrir de más»); generalizarlo mezcla dos ideas. `edit` duplicaría el mecanismo de flujos en vivo que `send` ya cubre con la terminal, y el jugador no tendría que mandar él el paquete: no vería por sí mismo el aviso Net Unreachable ni el NXDOMAIN. Con A no nace ninguna mecánica; las reglas de la 05 siguen siendo `filter`; la 04 sigue siendo `identify`; y el 14 reutiliza las mismas tarjetas con un campo `fix` en el caso.
- **Qué es mecánica y qué no, en resumen.** 05 = `filter` (sin cambios de contrato: ya admite TCP con rango de puertos y orígenes `/32` y `0.0.0.0/0`). 04 = `identify`. Los otros doce = `send`. 14 = `diagnose`.
- **Decidida: A (2026-10-11):** movimientos nuevos dentro de `send` (`placeEntry`, `removeEntry`, `wait` y `setSetting` generalizado); ninguna mecánica nueva.

### D-3. La tabla: una primitiva `Table` o filas de texto

Cuatro tarjetas nuevas muestran filas con columnas: la tabla de rutas, la tabla de traducciones del NAT, los registros de la zona y la caché del resolver.

- **A. Una primitiva `Table`** en `src/design/primitives/`: encabezado de columnas, filas y una acción opcional por fila (quitar). Las cuatro tarjetas la usan.
- **B. Filas de texto con la lista de reglas** (`ul.rules`): una frase por fila, «10.0.0.0/16 → 172.16.0.2».
- **Recomendación: A.** Tres de las cuatro son tablas cuyo nombre de columna es vocabulario (Destino y Siguiente salto; Protocolo, IP:puerto privado e IP:puerto público; Nombre, Tipo, Valor y TTL) y que AWS mostrará igual en el capítulo 6. En una frase se pierden las columnas y cada tarjeta inventaría su formato, que es lo que la regla «un estándar por elemento» prohíbe. Justificación de la primitiva según `DESIGN.md` («Adding a variant instead of a new element»): ninguna primitiva existente dibuja columnas; `Card` es el contenedor, `ChipTray` elige y `Button` quita, y esas se reutilizan. B no es inexacta; es una elección de presentación que repite formato. Costo de A: `src/design/primitives/` llega a 12 de 12 archivos.
- **Decidida: A (2026-10-11),** una primitiva `Table` (V10 = A). `src/design/primitives/` llega a 12 de 12 archivos antes de la mudanza por familias, que el estudiante aprobó el 2026-10-11; `Table` nace ya en `panels/` (Tarea 17).

### D-4. La salida de `nc` y `dig`

- **A. Una tarjeta «Salida»** que generaliza la de traceroute (V2 a del capítulo 1): líneas literales de la herramienta, en letra de código; la de traceroute sigue numerada.
- **B. Una tarjeta propia, con aspecto de terminal,** para `nc` y `dig`.
- **Recomendación: A.** Ya existe una tarjeta que muestra lo que imprimió un comando; una segunda sería un hermano. El prototipo de la Tarea 0 muestra la salida de `nc` (una o dos líneas) y la de `dig` (diez líneas) en la misma tarjeta.
- **Decidida: A (2026-10-11),** la tarjeta «Salida» que generaliza la de traceroute. V11 = B: la salida completa de `dig` se imprime y se pliega (Tarea 18).

### D-5. Qué `nc` y qué `dig` se imitan

**Decidida (2026-10-11): `nc` imita `ncat` 7.93 de Nmap (la antigua B, reformulada con el dato nuevo) y `dig` imita BIND 9.18.** No es la recomendación original del plan (A, OpenBSD `nc`). La subpregunta sobre `tcp` y los nombres de servicio en la salida de los incidentes 01 al 04 **ya no aplica**: la salida de `ncat` no lleva `[tcp/...]`.

- **Las opciones, antes del dato nuevo (registro).** `nc`: A. imitar OpenBSD `nc` con `nc -vz -w 3 <ip> <puerto>`, cuyo código se leyó el 2026-10-11; B. imitar `ncat` de Nmap, cuyo prefijo y cuyo texto de éxito no se habían podido verificar. `dig`: A. BIND 9.18.28; B. BIND 9.16.48, que escribe distinto el tiempo agotado. La recomendación era A en las dos.
- **El dato nuevo (2026-10-11).** El `nc` que trae Amazon Linux 2023 es `ncat` 7.93 de Nmap, en el paquete `nmap-ncat` (no viene en la AMI estándar), y su `dig` es de BIND 9.18: el repositorio de Amazon Linux 2023 trae la 9.18.50. Es un dato de la sesión principal; el repositorio no se volvió a consultar al escribir esta decisión. Con él, imitar `ncat` deja de ser una opción sin fuente: su código está leído. (Amazon Linux 2, en cambio, trae `ncat` 6.40 y BIND 9.11.4 según los metadatos de su repositorio, descargados el 2026-10-11; el juego no los imita.)
- **Lo que imprime `ncat`,** leído en `ncat/ncat_connect.c`, `ncat/ncat_main.c` y `ncat/util.c` de nmap-7.93 (descargado el 2026-10-11). Con `nc -vz -w 3`, todo va a stderr con el prefijo `Ncat: ` (lo pone `loguser`; `loguser_noprefix` no lo pone). Abierto: `Ncat: Version 7.93 ( https://nmap.org/ncat )`, `Ncat: Connected to <ip>:<puerto>.` y `Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.` (el 0.01 es un ejemplo: la herramienta mide el tiempo). Cerrado: `Ncat: Connection refused.` Tiempo agotado: `Ncat: TIMEOUT.` (en `connect_handler` se imprime el nombre del estado de tiempo agotado, `TIMEOUT`; en 7.70 el código imprimía el texto de `ETIMEDOUT` y desde 7.80 imprime `TIMEOUT`, leído en las dos). El texto «Connection refused» no es de `ncat`: lo da `socket_strerror`, es decir la libc del sistema, y la libc de Amazon Linux no se leyó.
- **Lo que imprime `dig` de BIND 9.18,** leído en `bin/dig/dighost.c` y `bin/dig/dig.c` de bind-9.18.50 (2026-10-11). Con un tiempo agotado, una línea `;; communications error to <ip>#53: timed out` por cada intento y, al final, `;; no servers could be reached`; entre las dos, el código imprime también la línea de comando de `dig` (`; <<>> DiG ... <<>> nombre`), cuyo texto exacto la Tarea 18 lee antes de imprimirlo. «timed out» sale de `lib/isc/result.c`. El juego imprime tres intentos: los intentos salen de `resolv.conf` y, si valen 0, `dig` usa 3 (`dighost.c`, líneas 1319 a 1324); el valor por defecto de esa lectura no se leyó.
- **macOS imprime otra cosa en los tres casos.** El `nc` de macOS es otro programa. El 2026-10-11, en este Mac, `nc -vz -w 3 127.0.0.1 9` dio `nc: connectx to 127.0.0.1 port 9 (tcp) failed: Connection refused` y `nc -vz -w 3 -G 2 10.255.255.1 80` dio `nc: connectx to 10.255.255.1 port 80 (tcp) failed: Operation timed out` **[local]**; el caso abierto no se probó. Quien pruebe en su Mac verá esas líneas y no las del juego; el 02-01 se lo dice (Tarea 23).
- **Reglas.** Cada línea que el juego imprime se lee del código de la versión que imita, con su fuente y su fecha en el test que la fija; lo que no se pudo verificar no se imprime (la caja dice «timeout» o «sin respuesta»). Lo que sigue sin verificar está en el spec, «Sin verificar».
- **Si el estudiante comprueba otra versión de `dig`** en su EC2 (`dig -v`), se cambia el texto del tiempo agotado y nada más: BIND 9.16.48 lo escribía «connection timed out; no servers could be reached».

### D-6. El 04 sin que viaje nada

- **A. Mecánica `identify`** con tarjetas de `tu-laptop`, `impresora` y `laptop-andres` (segunda excepción a «algo viaja»; la primera fue el 01-01 del capítulo 1).
- **B. Mecánica `send`** con pings dentro y fuera del bloque.
- **Recomendación: A.** La idea del 04 es leer una notación (`192.168.1.0/24`, su máscara y quién cabe). Un ping solo repetiría el 06 del capítulo 1 y el 02-06 sin mostrar nada nuevo. La excepción se declara en las reglas del spec. No es una cuestión de rigor: las dos son exactas.
- **Decidida: A (2026-10-11).** Referencia visual: la sección D-6 de la página de prototipos (https://claude.ai/artifact/HC9ersrkMisGqkCwnEF8mH). Lo que muestra la opción A: arriba, el bloque `192.168.1.0/24` con su máscara; una fila con los 32 bits de una IP y los 24 primeros marcados; cada IP partida en dos partes, la del bloque llena y la del equipo vacía; las bandejas «Dentro de 192.168.1.0/24» y «Fuera»; y, en el mapa, un contorno alrededor de lo que el jugador ya puso dentro. El prototipo traía el bloque y la máscara como referencia: si la ficha también pide elegirlos con fichas, se conservan. Lo que el código necesita para dibujarlo (contrato, vista y escena) está en la Tarea 26, «Lo que el 04 pide al código», repartido en las Tareas 14, 19 y 21.

### D-7. Las definiciones que no caben en el orden aprobado

El 2026-10-11 se repitió con un script la lógica de `namedTerms` sobre las 52 definiciones de la investigación. Cuatro nombran un término que el jugador aún no conoce: `nc` (TCP, del 02), `closed-port` (UDP del 10 y Port Unreachable del 13), `route` y `default-route` («siguiente salto», del 07).

- **A. Reescribirlas** sin mover ningún término de su subcapítulo (ya hecho en el spec).
- **B. Mover términos** entre subcapítulos (por ejemplo «siguiente salto» al 06): cambia la tabla aprobada.
- **Recomendación: A.** El estudiante aprobó la tabla; si algo no cierra, se arregla el texto. Si `ladder.test.ts` encuentra otro choque en los textos finales, el criterio es el mismo y el estudiante lo ve en la prueba de su bloque.
- **`nat`, una definición amplia o la del router.** Si `nat` dice «un router», el motivo `route-nat` del capítulo 4 (que etiqueta `{{nat}}` para el Internet gateway, que no es un router) pasa a decir algo falso o hay que reescribir un texto del capítulo 4. **Recomendación: amplia** («cambia la IP privada de origen por una pública al salir de la red…»): vale para los dos y no toca el capítulo 4.
- **Decidida: A (2026-10-11),** reescribir las definiciones sin mover términos; `nat` con la definición amplia.

### D-8. El homónimo «Conexión»

La caja de un dispositivo del capítulo 1 tiene un campo «Conexión» («Conectado a la red.» o «No está conectado: no forma parte de la red.»). A partir del 02-02, «conexión» es un término de TCP.

- **A. Renombrar el campo** a «En la red» en todos los incidentes (cambio de texto visible del capítulo 1 y del 4; cambian los tests de inspección que citan la palabra, y la regla `unofficialNames` no se afecta porque el campo no es un término).
- **B. Dejarlo.**
- **Recomendación: A.** Una caja que muestra una «Conexión» de red y, un incidente después, una «conexión» TCP enseña que son lo mismo. Es un cambio de texto, no de comportamiento. Se hace en la Tarea 16; lo lista «Cambios visibles del capítulo 4».
- **Decidida: A (2026-10-11).** El campo «Conexión» de la caja de un dispositivo se llama «En la red». Una corrección al texto de arriba: el campo solo existe en la caja de un dispositivo de una oficina (capítulos 1 y 2); la de un dispositivo de una VPC (capítulo 4) no lo tiene (`src/game/view/CLAUDE.md`; prueba `shows the connection of a device only in an office and once the term network is known`), así que el cambio no se ve en el capítulo 4. Se hace en la Tarea 16, que lista las pruebas que cambian (Global Constraints) y «Cambios visibles» lo recoge.

### D-9. La forma de TCP y UDP en el mapa

El catálogo dibuja el paquete como pedido y respuesta, nombrados por ICMP (`echo-request`, `echo-reply`) y como aviso. La idea del roadmap «Forma de TCP y UDP en el mapa» espera este capítulo. La Tarea 0 prototipa las opciones.

- **A.** Las dos formas de hoy sirven para cualquier protocolo: la forma dice la dirección (pide o contesta), no el protocolo. El protocolo y los puertos van en la etiqueta del paquete («TCP 51514 → 3000») y en su caja. El catálogo suma dos variantes genéricas, `request` y `reply`, con el mismo dibujo y el término `packet`; no hay formas nuevas.
- **B.** Una forma nueva para TCP y otra para UDP.
- **C.** A, más un sello pequeño con el protocolo sobre el paquete.
- **Recomendación: A.** El protocolo no cambia lo que el jugador ve de un paquete en vuelo (va, llega, vuelve); lo que cambia son los puertos, y se leen mejor en la etiqueta que en la silueta. B suma tres entidades al catálogo y regraba la captura de piezas por algo que ninguna lección usa. No es una cuestión de rigor: ninguna forma afirma nada falso.
- **Decidida: B (2026-10-11), no la recomendación.** El estudiante eligió una forma propia para TCP y otra para UDP, cada una llena (el pedido) y en anillo (la respuesta); ICMP conserva las suyas (el punto, el anillo y el aviso). El protocolo y los puertos siguen también en la etiqueta del paquete y en su caja. Costo que se acepta: cuatro entidades más en el catálogo (la recomendación hablaba de tres), nombradas en `ENTITY_TERMS` por `tcp` o `udp` y llevadas por `TERM_ENTITY` a esos dos términos, y la captura de piezas regrabada en la Tarea 21. La opción es exacta: ninguna forma afirma nada falso.

### D-10. Los servidores DNS en el mapa

- **A. Piezas del mapa,** variante `internet-server` de la pieza de dispositivo, como `servidor-internet`. El resolver se dibuja desde el 10 y el autoritativo desde el 11 (cuando su término se conoce).
- **B. No dibujarlos;** la caja del paquete cuenta que «el resolver contestó».
- **Recomendación: A.** La consulta es un paquete que sale y vuelve: si no se ve a quién se le pregunta, el jugador no sabe con quién habla, y la regla «un router que no se dibuja no se nombra» obligaría a esconder también sus textos. Respeta V5 b del capítulo 1 (el servidor es una variante de la pieza de dispositivo, no una entidad nueva).
- **Decidida: A (2026-10-11),** los servidores DNS son piezas del mapa, variante `internet-server` (V14 = A).

### D-11. El tiempo del DNS

El 12 enseña que la respuesta vieja sigue en caché hasta que vence su TTL.

- **A. Un reloj explícito.** El motor recibe `now` (segundos del juego) como entrada; la caché guarda cuándo vence cada respuesta; el jugador adelanta el reloj con fichas «Esperar 1 min» y «Esperar 5 min» (el movimiento `wait`). El TTL que queda baja a la vista en cada `dig`.
- **B. Dos mundos,** «antes» y «después de 5 minutos», que el jugador alterna sin reloj. **Inexacta:** el TTL no se ve bajar y parece que la caché se vacía por una acción, no por el paso del tiempo.
- **C. Mostrar el TTL como un número y no esperar.** **Inexacta** para la lección: sin espera no se ve que la respuesta cambia solo al vencer.
- **Recomendación: A.** Es la única que modela el TTL como lo que es, y conserva la pureza del motor (el tiempo es una entrada, nunca una lectura del reloj; decidida 5).
- **Decidida: A (2026-10-11),** un reloj explícito con el movimiento `wait`. V16 = C: las fichas «Esperar» viven en la tarjeta «Reloj del juego» del panel del incidente (Tareas 15 y 19).

### D-12. El 14 y el arreglo del bucle

El encargo dice que el caso del bucle «el jugador lo encuentra con traceroute y lo arregla».

- **A. El caso 5 trae `fix`:** una tarjeta de rutas de `router-proveedor` con las que se quitan y se agregan; el caso se cierra cuando se nombra la causa y el ping al servidor vuelve. Las rutas se arreglan con el mismo editor del 07.
- **B. El jugador solo nombra la causa,** como en el capítulo 1.
- **Recomendación: A.** B no cumple lo que el estudiante pidió (y el D-13 del capítulo 1 lo anunció). Estrellas: cerrar = los siete casos cerrados (en el 5, causa y reparación); la del medio = ninguna pista en ningún caso; explicar = la causa de los siete a la primera.
- **Decidida: A (antes del 2026-10-11),** el caso 5 del 14 trae `fix`.

### D-13. Nombres e IPs de documentación

- **A. Los del spec original:** `example.com` y sus subdominios (`www`, `blog`, `shop`, un `nope` que no existe) y `example.org` para la zona caída; IPs `198.51.100.x` para los servidores de internet, `192.0.2.77` para `casa-lucia`, `203.0.113.x` para el proveedor (como en el capítulo 1).
- **B. Nombres bajo `.example`** (RFC 2606 §2).
- **Recomendación del plan: A,** como había pedido el estudiante. Costo declarado entonces: `example.com` existe de verdad (RFC 6761 §6.5) y resuelve a servidores de IANA, así que quien corriera `dig www.example.com` en su Mac no vería `198.51.100.50`. B evita el choque pero no era lo que se había pedido.
- **Decidida: B (2026-10-11), no la recomendación.** Todos los nombres del juego van bajo `.example`, que RFC 2606 §2 recomienda «for use in documentation or as examples» (resumen leído el 2026-10-11). `example.com` y `example.org` ya no se usan. Las IPs no cambian (RFC 5737). Los nombres, elegidos por la sesión principal, cortos y legibles en español: la zona principal, `lucia.example` (el sitio de Lucía); `www.example.com` pasa a `www.lucia.example`; `blog.example.com`, a `blog.lucia.example`; `shop.example.com`, a `tienda.lucia.example`; `nope.example.com`, a `noexiste.lucia.example`; el error de tipeo del caso 2 del 14, `wwww.example.com`, a `wwww.lucia.example`; la zona caída (SERVFAIL), `example.org`, a `noticias.example`, con `www.noticias.example`; y la pieza `servidor-autoritativo-org` a `servidor-autoritativo-noticias`. El NXDOMAIN se sigue mostrando con un subdominio inexistente de la zona del juego (`noexiste.lucia.example`) y no con `.invalid`, porque RFC 6761 §6.4 manda contestar `invalid.` al instante sin preguntar a nadie, y eso ocultaría el camino del resolver al autoritativo que enseñan el 11 y el 13.
- **Verificado el 2026-10-11: `.example` no está delegado en la zona raíz.** No aparece en la lista de dominios de primer nivel de IANA (https://data.iana.org/TLD/tlds-alpha-by-domain.txt, versión 2026101001, actualizada el 2026-10-11 a las 07:07 UTC; entre `EVENTS` y `EXCHANGE` no hay `EXAMPLE`), y `a.root-servers.net` contestó NXDOMAIN, con la marca `aa`, a `www.lucia.example` (`dig +norec www.lucia.example @a.root-servers.net`). Es el estado de hoy: el motivo de la elección es lo que RFC 2606 §2 reserva, y el juego no afirma que ese nombre no vaya a resolver nunca.

### D-14. Un paquete de afuera sin traducción, y el reenvío de puertos

- **Qué pasa con el paquete.** A. No se entrega a nadie y el cliente ve un timeout. El texto del juego dice «no lo entrega» y nunca «lo bloquea»; la salvedad de RFC 5382 REQ-4 (un NAT real puede avisar con un ICMP Port Unreachable pasados al menos 6 segundos, y `nc -w 3` se rinde antes) vive en el spec y en la guía de la carpeta del motor. B. Se modela el aviso a los 6 segundos con el reloj de D-11: más fiel, pero con `-w 3` el jugador nunca lo vería. **Recomendación: A.** No es inexacta mientras el texto diga que un NAT real puede avisar; B solo agregaría un plazo que el cliente no alcanza a esperar.
- **Quién crea la fila fija.** A. La da el mundo del 09 y su report nombra a `router-oficina`. B. La crea el jugador (una cuarta tabla editable). **Recomendación: A.** El término es opcional; la fila dada alcanza para ver que NAT traduce y no filtra, sin una tarjeta más.
- **Decidida: A en las dos partes (2026-10-11):** el paquete sin fila no se entrega (timeout) y la fila fija la da el mundo del 09.

### D-15. Cuántas pruebas humanas

- **A. Una al final de cada bloque** (siete, con el bloque 5 partido en dos), como pidió el encargo.
- **B. Una sola, al final,** como decidió el estudiante para el capítulo 1 (2026-10-10).
- **Recomendación: A.** Este capítulo estrena motor con estado (secuencia, DNS, reloj) y cada bloque estrena una tarjeta (salida, rutas, traducciones, registros). Un defecto se encuentra antes de construir encima. Costo: siete paradas. Si el estudiante prefiere B, las secciones de prueba se juntan en una al final de la Tarea 33.
- **Decidida: B (2026-10-11), no la recomendación (A).** Una sola prueba humana, al final del capítulo, como en el capítulo 1. Las siete secciones de prueba se juntaron en una, al final de la Tarea 33, con todas sus preguntas menos la de `tcp` antes del 02, que ya no aplica por D-5. Las Tareas 23 a 33 no esperan una prueba humana entre bloques. Para compensar, un revisor `sonnet` lee los textos de cada bloque antes de pasar al siguiente: lenguaje llano, escalera de términos, rigor y la causa de cada cambio de comportamiento (Global Constraints, «Ejecución»; «Contenido»). Costo que se acepta: un defecto de un bloque se encuentra al final, con los bloques siguientes ya construidos encima.

### D-16. `traceroute -I` después del capítulo 2

- **A. Se queda:** la sonda sigue siendo un Echo Request y la línea dice `-I`.
- **B. Pasa a UDP por defecto,** como el comando de Linux: sondas UDP a puertos altos y el destino contesta Port Unreachable, que este capítulo ya modela.
- **Recomendación: A.** El capítulo 1 justificó `-I` con «UDP y los puertos son del capítulo 2»; ahora la razón desapareció, pero B cambia las trazas, la terminal y las explicaciones de los incidentes 09 y 10 y el caso 5 del 14 del capítulo 1, que hablan de Echo. Las dos son exactas (la línea dice `-I`). Se anota como seguimiento en el backlog.
- **Decidida: A (2026-10-11),** `traceroute -I` se queda; B queda como seguimiento en el backlog.

### D-17. Separar ahora los subcapítulos densos

- **A. Construir los catorce como están,** cada denso en su tarea, y separar solo si la prueba humana del capítulo entero lo pide (D-15 = B).
- **B. Separar ya** el 01, el 02, el 03 y el 10.
- **Recomendación: A.** El estudiante aprobó los catorce y separar un incidente corre los ids siguientes sin costo (no hay progreso que conservar). **Cómo se separarían:** el 01 en «servicio y puerto» y «`nc` e IP:puerto»; el 02 en «el saludo» y «los puertos de ida y de vuelta»; el 03 en «rechazo» (cerrado y dirección de escucha) y «silencio» (filtrado); el 10 en «DNS, consulta y resolver» y «UDP, `dig` y DHCP». Cada separación es un cambio de ids y de `introduces`, sin motor nuevo.
- **Decidida: A (antes del 2026-10-11).**

### D-18. El término «puertos conocidos» y el 3306 y el 5432

- **Problema de rigor (2026-10-11).** «Puertos conocidos» es el nombre formal que IANA da al rango de 0 a 1023: «System Ports, also known as the Well Known Ports» (RFC 6335 §6). El 3306 y el 5432 caen en los «User Ports», de 1024 a 49151. Llamarlos «puertos conocidos» es **inexacto**. La investigación ya lo anota (`docs/research/2026-10-10-follow-the-packet-chapter-2-concepts.md`, línea 289). Además, la regla del estudiante decía que la lista de puertos del 05 es 22, 80, 443, 3306 y 5432, y el plan la ponía en la definición de `well-known-ports`.
- **Provisional (superado por la decisión de abajo).** La Tarea 2 registró el id `well-known-ports` con la definición del spec, a la espera de la respuesta del estudiante.
- **Opciones que se barajaban.** A. Pasar a «puerto por defecto» (el id, el nombre oficial y la definición cambian). B. Mantener «puertos conocidos» con una definición que diga el rango de IANA (de 0 a 1023); el 3306 y el 5432 quedarían fuera, y la definición y la lista del 05 tendrían que decir qué hacen con ellos.
- **Decidida: B (2026-10-11),** con dos términos en el 05 (D-18 no traía recomendación; los dos textos y sus largos, medidos con `len()` de Python, son los de la Tarea 2 bis):
  - **Nuevo: `default-port`, «puerto por defecto»,** núcleo: «El puerto que usa un servicio si nadie lo cambia: 22 para SSH, 80, 443, 3306, 5432. Es costumbre: nada obliga a usarlo.» (119 caracteres).
  - **`well-known-ports`, «puertos conocidos», redefinido:** «Los puertos del 0 al 1023, que IANA reserva para servicios comunes, como el 22 de SSH.» (86 caracteres). Fuente: RFC 6335 §6, «System Ports, also known as the Well Known Ports». Ninguna definición llama «puertos conocidos» al 3306 ni al 5432.
  - Los dos tienen que pasar `ladder.test.ts` (ninguna nombra un término que el jugador no conozca en el 05).
  - El capítulo pasa a 53 términos y 50 ids nuevos; el 05 presenta cuatro: `port-range`, `ssh`, `default-port` y `well-known-ports`.
  - En el 05, la ficha de rango `TCP · 1-1023` se liga con «puertos conocidos» en el texto que la nombra, sin decir que el puerto 0 se permita ni que se prohíba.
  - Tarea 2 bis.

## Decididas sin el estudiante (para revisar)

Cada una tiene una razón técnica y una sola respuesta razonable; si el estudiante no está de acuerdo, se cambia la tarea que la aplica. Desde la 52 son decisiones que se iban a abrir y no pasaron el umbral (ver «Reglas de trabajo vigentes que no estaban escritas»): más de una opción puede pasar los tres criterios, pero la diferencia no cambia de forma importante lo que el jugador aprende o ve. Al final del capítulo, antes de que el estudiante lo juegue, todas se juntan en una sola página para que las revise de una vez (Tarea 33).

1. **El 02-01 parte del mundo del 01-14.** Hoy `worldBeforeChanges` (`src/levels/world.ts`) lanza un error para un incidente con `changes` y sin incidente previo en su capítulo. Cambia así: un incidente con `changes` y sin previo en su capítulo parte de la solución del último incidente del capítulo anterior, en el orden del juego. Con eso, `explained-changes.test.ts` cubre también el salto del 01-14 al 02-01 sin código nuevo, y la continuidad del mundo la fuerza el dato y no una copia. Descartado: un `base` literal compuesto con las constantes del capítulo 1, que duplicaría el mundo y podría divergir sin avisar. Tarea 3.
2. **`changedNames` se amplía en dos cosas.** (a) Mira también a los servidores de internet (actores `server`: servicios y DNS), no solo a dispositivos y routers; sin eso, que el sitio de `servidor-internet` o un registro del autoritativo cambie no exigiría nombrarlo. (b) Una interfaz de router que mira a una pieza que la misma acción agrega no cuenta como cambio de configuración: es el cableado de la pieza nueva y no altera nada de lo que ya pasaba. Cualquier otro cambio de interfaces, rutas o avisos sí cuenta. Razón de (b): agregar un servidor de nombres detrás de `router-destino` obligaría a nombrar un router que el mapa no dibuja. Relaja la regla un poco; _para revisar_. Tarea 3.
3. **El NAT existe siempre en el borde de la oficina; se deriva de la topología; el 08 lo muestra.** El router que da a una LAN y tiene una interfaz con IP no privada hacia afuera (`router-oficina`, `203.0.113.10`, la IP que el capítulo 1 ya declara como `officeUplink`) traduce el origen de todo paquete de un dispositivo de la oficina cuyo siguiente salto sale por esa interfaz. El enlace privado a la otra oficina no traduce (su interfaz es privada). No hay campo nuevo en `Network` ni acción «ahora hay NAT»: el capítulo 1 mostró un ping de `192.168.1.10` llegando a `198.51.100.50`, y un mundo que enciende el NAT en el 08 habría mostrado tráfico imposible. La traducción entra en la traza como un campo aparte, `Trace.translation`, ausente en la VPC y en todo paquete que no sale por esa interfaz; **no escribe pasos ni motivos**, así que `the trip out of the office has no step and no reason that names NAT or the public IP` y las pruebas de `steps` con `toEqual` del capítulo 1 siguen sin editarse. La vista lo muestra cuando `nat` es un término conocido (08). Es una regla del modelo, _para revisar_.
4. **Los números del NAT.** Puertos públicos desde el 40001, en el orden de la secuencia; mapeo independiente del destino (el mismo `IP:puerto` privado usa la misma fila hacia cualquier servidor; RFC 5382 REQ-1 y RFC 4787 REQ-1); sin conservar el puerto de origen (el ejemplo del RFC 3022 también lo cambia); sin tiempo de vida de las filas; el ping no deja fila visible (ICMP no tiene puertos y el identificador es lo que traducen los NAT reales; spec). La tabla muestra los envíos desde el último cambio de mundo y, antes del paquete de cada envío por nombre, la fila de su consulta DNS (O-2 = A, 2026-10-12). Un `ping` por nombre deja la fila de su consulta y ninguna propia; un `nc` por nombre deja dos, la de su consulta y la suya. Si el nombre sale del archivo hosts no hay consulta ni fila.
5. **El estado entra al motor como entrada, no como lectura.** `simulate(net, packet)` sigue siendo la función pura y sin estado de hoy, la que usan el capítulo 1 y el 4. Una función nueva, `simulateSequence(net, sends)`, recibe una lista ordenada de `{ packet, at }` (`at` = segundos del juego) y devuelve una traza por paquete, llevando de uno al siguiente la tabla del NAT, el puerto efímero de cada dispositivo y la caché del resolver. Es determinista: los mismos envíos dan las mismas trazas. La sesión guarda los envíos y el reloj (`Session.clock`, que solo avanza con `wait`). **Reinicio:** un movimiento que cambia el mundo (colocar o quitar una entrada de una tabla, un ajuste) limpia los envíos, como hoy `setSetting`, y con ellos la tabla y la caché que se derivan; el reloj no vuelve atrás y la caché inicial del mundo (decidida 24) se mide contra él. La consulta de un envío por nombre viaja dentro de la traza de ese envío (`Trace.question`), así que sigue habiendo una traza por envío (O-2 = A). Para revisar.
6. **El puerto de origen.** La primera conexión TCP o consulta UDP de cada dispositivo en la secuencia sale del 51514 y cada una nueva del mismo dispositivo sube de a uno (el puerto efímero cambia en cada intercambio nuevo). La consulta DNS de un `ping` o un `nc` por nombre es el primer intercambio de ese envío: toma el puerto antes que el paquete (la consulta el 51514, el `nc` el 51515). Un envío que termina antes de que haya una IP, porque el nombre no se resolvió o porque la dirección no es válida, no abre ningún socket y no gasta puerto propio (un `ncat` real sale en `getaddrinfo` con «Could not resolve hostname», `ncat_main.c:883` de nmap 7.93); la consulta de un nombre que no se resolvió sí gastó el suyo. Antes la guía del motor decía que un envío que nunca sale gastaba un puerto igual; ahora eso vale solo para los que terminan después (sin ruta, un firewall). `PacketSpec.sourcePort` lo fija a mano y gana. Un `simulate` suelto es una secuencia de un envío: el paquete que no pregunta sale del 51514 y, si pregunta, la consulta toma el 51514 y él el 51515. El 51514 cae dentro del rango de IANA (49152 a 65535) y del de Linux (32768 a 60999); ningún texto da un rango como cifra (depende del sistema).
7. **`host.services` reemplaza a `host.listeningTcpPorts`.** En el esquema, en los mundos del capítulo 1 y del 4 (cambio mecánico: `[22]` pasa a un servicio TCP 22 en todas las IPs), en las fixtures y en las pruebas que lo leen. Razón: dos maneras de decir lo mismo. No toca el test dorado.
8. **La dirección de escucha decide por la IP de destino.** Un servicio `loopback` solo acepta un paquete cuyo destino es `127.0.0.1`; uno `all`, cualquier IP del dispositivo. Un paquete a la IP de la red de ese dispositivo, o a otra dirección `127.x`, recibe un RST, también si lo manda el propio equipo. (Corregida el 2026-10-11 por la sesión principal, con el visto bueno del estudiante a las recomendaciones técnicas que no cambian lo que se aprende: el primer commit de la Tarea 6 aceptaba cualquier `127.x.x.x`; el modelo exacto es solo `127.0.0.1`, y el cambio es un commit de seguimiento de la Tarea 6.) **Sin probar:** razonamiento a partir de `ip(7)` (spec, «Sin verificar»). El estudiante puede probarlo en su EC2 cuando quiera; si el comportamiento real difiere, se cambia la regla y esta decisión. Si no lo prueba, queda «sin verificar» en la guía y la Tarea 6 cierra igual.
9. **UDP cerrado avisa.** Un datagrama UDP que llega a un host sin servicio en ese puerto contesta ICMP Port Unreachable (resultado `unreachable`, aviso `port-unreachable`), no silencio (RFC 1122 §4.1.3.1: «UDP SHOULD send an ICMP Port Unreachable message»). Un firewall que descarta sigue en silencio. Sin límite de tasa (el kernel de Linux manda uno por segundo por destino). Reemplaza `host-udp-no-service`. Tarea 7.
10. **Las tablas de rutas.** La tabla de un router o de un dispositivo se deriva: una ruta de red conectada por cada interfaz (para un dispositivo, su LAN), la ruta por defecto (la puerta de enlace de un dispositivo, o la ruta `default` de un router) y las rutas de un router. Un dispositivo no tiene rutas propias (ninguna ficha las necesita; la ruta que el jugador edita en un dispositivo es su puerta de enlace, en «Ajustes de red»). `Route.next` sigue siendo el id de un router, como en el capítulo 1; el siguiente salto que el jugador lee es la IP de la interfaz de ese router que mira a quien envía (`interfaceTowards`). No se admiten dos rutas al mismo destino en una tabla. Sin métricas.
11. **Cómo arranca el 07.** `router-oficina` pierde todas sus rutas (`updateRouter`; el report lo nombra) y gana una interfaz hacia `router-sucursal` (el enlace privado). Sin ninguna ruta que cubra el destino, `router-oficina` avisa Net Unreachable (`sendsUnreachable` es verdadero desde el 01-06). La rama `private` de `onwardFrom` no se toca: con solo la ruta por defecto, el ping a `10.0.0.10` muere en silencio en `router-proveedor`, igual que en el 01-08, y la prueba `a private address is dropped by the first router outside the office, with no warning` sigue sin editarse. Ningún router que callaba en el 01-08 avisa ahora.
12. **El mundo del capítulo** es el de la tabla «El mapa que crece» del spec. Las interfaces de `router-destino` hacia los servidores de nombres y hacia `servidor-nuevo` (`198.51.100.2` a `198.51.100.5`) las agrega la misma acción que agrega cada servidor; por la decidida 2 no piden nombrar al router.
13. **El DNS que el juego modela.** El resolver conoce al autoritativo de cada zona por configuración (`upstreams`); la pregunta del resolver al autoritativo no es un paquete del mapa y la cadena raíz, TLD, autoritativo no existe. Si el autoritativo está caído, el resolver contesta SERVFAIL. El juego no guarda NXDOMAIN en caché (RFC 2308 describe cómo se guarda una respuesta negativa; la definición de `nxdomain` lo dice en general). Se declara en la guía del motor.
14. **Los servidores DNS escuchan en el puerto 53 de TCP y de UDP**, y ninguna consulta del juego usa TCP (spec, «Simplificaciones declaradas»).
15. **La nota del encabezado queda como está** entre el 02-01 y el 02-07: «Fuera de la oficina el encabezado cambia: lo verás en el capítulo 2». El 08 es el primer incidente que la cumple; en él la nota desaparece y la caja muestra los dos encabezados.
16. **Ningún texto del capítulo 2 da una razón de por qué una respuesta pasa** (TCP, UDP o NAT) ni usa «stateful». Una prueba espejo de la del capítulo 1 lo guarda (Review Focus 5).
17. **`casa-lucia` entra por la IP pública.** Un actor cliente de una oficina con routers entra directo al router que es dueño de la IP de destino (`router-oficina`, `203.0.113.10`), sin recorrer los routers del proveedor; el TTL baja una vez. El camino por internet no se modela ni se dibuja. Tarea 11.
18. **Desbloqueo y progreso.** `isUnlocked` usa el orden del juego: al registrarse `02-01`, se abre con el `01-14` y el `04-01` pasa a abrirse con el `02-14`. `CHAPTER_1_DONE` de los tests e2e deja de abrir el 04-01; la Tarea 22 agrega `CHAPTER_2_DONE`. Cuando exista el capítulo 3, el 04-01 pasará a abrirse con su último incidente. No se resetea nada del progreso guardado: los ids son nuevos.
19. **Los rangos de puertos del 05 son detectables.** La batería de sondas prueba TCP 22, 80, 443, 3306 y 5432, UDP 53 e ICMP, y no se toca (cambiarla movería el capítulo 4). Las fichas del 05 solo ofrecen rangos que contienen alguno de esos puertos (por ejemplo 1-1023 y 0-65535), y una prueba lo comprueba; un rango como 20-25 pasaría por «justo» sin serlo.
20. **La caja de un dispositivo gana un campo «Servicios»** (término `service`): lista cada servicio como «TCP 22 · escucha en todas las IPs». Vale para todos los dispositivos, también los del capítulo 4 (cambio visible, listado abajo). Entre el 01 y el 02 el campo no nombra `tcp` hasta que el término se conoce: dice «puerto 3000».
21. **`port` dice «de 1 a 65535».** IANA marca el 0 como reservado (spec).
22. **Una sola entrada por pieza: su etiqueta abre una tarjeta con pestañas (V15 = B, decidida por el estudiante el 2026-10-11).** Hoy la etiqueta de un dispositivo con ajustes tiene un segundo botón, «Ajustes de red de <dispositivo>», con su propio id (`PIECE_ID.settings`); existe solo en el 01-07. Se quita. Cada pieza tiene un solo botón en su etiqueta y ese botón abre una tarjeta con `Tabs`, una pestaña por cada tarjeta de esa pieza: la terminal; «Ajustes de red» y «Servicios» (la dirección de escucha) de un dispositivo; «Tabla de rutas» y «Tabla de traducciones» de un router; «Registros» y «Caché» de un servidor de nombres. Una pieza con una sola tarjeta no lleva pestañas y se abre como hoy. Al abrirse, la pestaña inicial es la que pide la tarea del incidente: el incidente la nombra con un dato opcional (Tarea 14) y, sin él, abre la terminal si la pieza la tiene, luego los ajustes o los servicios y luego las tablas. `PIECE_ID.settings` desaparece y no lo reemplaza nada: ninguna etiqueta tiene más de un botón, así que ninguna tarjeta necesita un id propio y la pieza se abre con el suyo; `PIECE_ID.entry(kind, id)` ya no nace. Razones del estudiante: escala a los capítulos siguientes sin que las etiquetas del mapa crezcan, y la consola de AWS usa el mismo patrón. Consecuencias: (a) Radix monta solo la pestaña elegida, así que lo que una tarjeta tiene a medias vive por encima de las pestañas (`DESIGN.md`, fila de `Tabs`); (b) las pruebas del capítulo 1 que leen el segundo botón se reescriben en la Tarea 19 (lista en «Global Constraints»); (c) la etiqueta de `tu-laptop` en el 01-07 cambia (ver «Cambios visibles»). Donde una ficha dice «la tarjeta «Servicios de laptop-lucia»» o «la tarjeta de rutas de `tu-laptop`», se lee como la pestaña de la tarjeta de esa pieza.
23. **Los encabezados de columna dependen de lo que se conoce.** La columna de la tabla de rutas se llama «Por dónde sale» hasta que `next-hop` se conoce y «Siguiente salto» después; «Destino» siempre.
24. **La caché inicial del 12 es un dato del mundo,** anclado al reloj 0: «le quedan 240 segundos». La caché de las consultas del jugador se llena en la secuencia.
25. **El TTL de los registros es 300 segundos** y el jugador no lo elige. Son números del juego.
26. **El puerto va en la ficha de mensaje** («nc · puerto 3000»), no en una cuarta bandeja de la terminal; el `IP:puerto` se ve en la caja del paquete. Las bandejas siguen siendo origen, destino y mensaje.
27. **Las tareas de un incidente dicen el estado final,** no «ver antes»: como cada edición limpia los envíos, una tarea que pidiera ver un aviso antes de arreglar no podría cumplirse después. El aviso se ve igual (la terminal manda el paquete antes de editar) y la pregunta final lo verifica.
28. **Qué dibuja cada incidente** (`shown`) está en cada ficha. Del 01 al 05 no traen lista y dibujan el mundo entero menos lo que el jugador aún no conoce; el 06 en adelante traen la suya. Un router que el mapa no dibuja no se nombra.
29. **`dig` usa el resolver de «Ajustes de red»,** como el `dig` sin `@servidor`; la forma `dig @servidor` no se ofrece.
30. **La prueba humana** es una sola, al final del capítulo (D-15 = B, 2026-10-11), y la hace el estudiante con su servidor.
31. **Dos pruebas del capítulo 1 cambian a propósito porque `Trace.routes` es un campo nuevo de la traza.** Son `the same ping of 01-05 and 01-11 has the same trace and only the words change` (`src/game/chapter-1.test.ts`) y `the ICMP branch of the host stage keeps every field it had` (`src/engine/simulation/ports.test.ts`). La razón de cada una está en la Tarea 8 (la registra como opción A del 2026-10-11) y las dos se suman a la lista de «Global Constraints», donde faltaban. Tarea 8.
32. **Los puertos del NAT.** Tarea 10.
    - Un solo contador de puertos públicos para TCP y UDP, desde el 40001. Un NAT real puede asignar cualquier puerto libre y el juego no afirma que haya dos espacios de puertos, uno por protocolo.
    - Un paquete que muere después del router de la oficina queda traducido y deja fila. La traducción ocurre al salir de la oficina, antes de que el paquete llegue a donde muere.
    - La traducción de un ping no lleva puertos, porque ICMP no tiene puertos (decidida 4).
33. **El NAT entrante y el reenvío fijo.** Tarea 11.
    - Una IP pública que ningún router tiene termina `lost` con el motivo `route-no-device`: nadie la tiene, así que no hay quien reciba el paquete ni quien conteste.
    - Los puertos públicos de un reenvío fijo nunca se dan a una fila dinámica. Si se dieran, una traducción dinámica podría quitarle al servidor el puerto que el reenvío le promete.
    - Un ping a la IP pública del router lo contesta el router, porque esa IP es la de su propia interfaz.
34. **El DNS del juego.** Tareas 12 y 13.
    - Los valores del SOA y sus fuentes están en `src/engine/dns/CLAUDE.md`. Toda cifra que el juego usa lleva su fuente y su fecha (Global Constraints, «Fuentes y fechas»), y la guía de la carpeta es donde se leen.
    - El motivo `dns-no-address` es para un nombre sin registro A: NOERROR sin dirección, el NODATA de RFC 2308 §2.2. No es NXDOMAIN, que dice que el nombre no existe.
    - Mapa final de motivos, una causa por motivo, para que el texto diga solo la que pasó: `dns-unresolved` es una oficina sin `dnsServer`; `dns-resolver-silent`, la pregunta que no llegó a nadie; `dns-no-resolver`, un equipo que recibió la pregunta y no contestó como resolver.
    - Un resolver sigue hasta 8 alias; con 9 o con un bucle contesta SERVFAIL. Sin un tope, un bucle de alias no terminaría. El 8 es un número del juego y no se verificó contra un resolver real.
    - Toda respuesta del resolver llena su caché, también la de un `ping` o un `nc` por nombre: el resolver no distingue quién preguntó.
    - La consulta de un `ping` o un `nc` por nombre gasta un puerto del emisor y deja su fila en la tabla de traducciones (decididas 4 y 6; O-2 = A). Va dentro de la traza del envío, en `Trace.question`, con su traza completa. Si el nombre sale del archivo hosts no hay consulta.
    - Pedir un alias cuyo destino está vivo en la caché pregunta la cadena entera y renueva ese destino. No se verificó qué hace un resolver real. El 02-12 solo ofrece `dig www`, así que hoy no se dispara.
35. **La sesión.** Tarea 15.
    - `routeProblem` (`no-router`, `destination-has-route`) es hermana de `recordProblem`, para que una ruta repetida diga por qué no se aplicó (V17 y la fila 12 del inventario de la Tarea 18 bis).
    - La lista ordenada de envíos es `Session.history`, y cada envío vuelve a simular toda la historia con `simulateSequence`. El motor sigue puro (decidida 5), así que la tabla del NAT, los puertos y la caché se derivan siempre de los envíos y no pueden quedar desfasados.
    - El traceroute queda fuera de la secuencia. Es una corrida propia con sus sondas y no toma el puerto de origen ni deja fila de la secuencia.
36. **Los términos en las pruebas y la escalera.** Tarea 16.
    - Las cuatro pruebas del capítulo 1 que usaban `EVERY_TERM` pasan a usar `CHAPTER_1_TERMS`, los términos que presentan los incidentes del capítulo 1. `EVERY_TERM` incluye los términos de capítulos posteriores, y con ellos la caja de un viaje mostraría una ruta o una traducción que un jugador del capítulo 1 no conoce. Decidida por la sesión principal el 2026-10-11, opción A.
    - La escalera se calcula por la posición del incidente y no por el progreso del jugador; lo fija `src/game/view/ladder.test.ts`. Así el 01-08 se ve igual en una partida nueva que después de terminar el capítulo 2.
37. **La tarjeta «Salida».** Tarea 18.
    - El plegado de `dig` usa un `Button` pequeño con `aria-expanded`. Es la primitiva que ya hay para un botón (un estándar por elemento), y `aria-expanded` le dice al lector de pantalla si la salida está plegada o desplegada.
    - El viewport de `tests/e2e/entities.spec.ts` sube para que la captura no cambie de fuente.
38. **El estándar de avisos y errores.** Tarea 18 bis.
    - `Message` recibe sus palabras por la prop `words`, porque `src/design/` no importa `src/copy/`.
    - `.chip-card p` excluye `.message`. La regla de la tarjeta de fichas pone `margin: 0` a sus párrafos, y un `Message` es un `p` que lleva su propio margen (el de la pestaña); sin la exclusión lo perdería.
    - El juego no tiene tema oscuro. Los valores oscuros del prototipo (el verde de `success`, la superficie y el texto sobre el relleno) quedan fijados como constante, `PROTOTYPE_DARK` en `src/design/tokens.test.ts`, solo para comprobar su contraste; ningún token oscuro los lee.
39. **Las tarjetas de tablas, de ajustes y de clasificar.** Tarea 19.
    - Una pieza del 02-04 se coloca al soltarla, no al pulsar «Listo»: las bandejas, la línea y el contorno salen de `session.answers`, así que el contorno sigue a la pieza en el momento. Resuelve el «Por decidir al implementar» de esa tarea.
    - `bins[0]` es «Dentro del bloque». Es una convención de la tarjeta y no un campo del contrato: así el modelo sabe cuál bandeja es la de dentro sin sumar un campo al contrato.
    - Los botones «Agregar ruta» y «Agregar registro» colocan la entrada, y se habilitan cuando cada bandeja tiene su ficha. Poner una entrada cambia el mundo y limpia los envíos (decidida 5), así que una entrada a medio armar no cambia nada.
    - Las pestañas «Preguntas» y «Clasificar» se llaman como las dos tarjetas de `tu-laptop` en el 02-04 (decidida 22: las pestañas se llaman como las tarjetas, sin repetir el nombre del dispositivo).
    - La línea «Lo prestó DHCP.» va en «Ajustes de red» cuando el incidente da un servidor DNS sin dejar elegirlo y `dhcp` ya se conoce. Así la tarjeta del 02-10 es de lectura y dice de dónde viene el servidor.
    - Un registro A cuyo valor no es una IP se rechaza con `a-record-needs-ip` («Un registro A guarda una IPv4», RFC 1035 §3.4.1).
    - Un CNAME con una IP como valor se acepta, como un servidor real, y no resuelve.
    - `src/ui/incident/` se partió en `side-cards/` y `map-cards/` (`875c27d`): la carpeta llegaba al tope de 12 archivos de `folder-structure`, y se parte por familia como en la Tarea 1.
40. **Las pruebas e2e deterministas y el chequeo rápido.** Tarea 19 bis.
    - La base de comparación de la regla C es el último commit con el `pnpm check` completo en verde. Lo aprobó la sesión principal. Compararse con «HEAD sin los cambios de la tarea» manda al backlog, por error, una regresión que ya está en ese HEAD.
    - `fullyParallel: true` con los workers por defecto. Con 12 workers la suite es más lenta y con 16 una captura agota el tiempo (medido el 2026-10-11, 16 núcleos).
    - `--only-changed` descartado, porque da falsos verdes: las e2e casi no importan el código del juego, y un cambio en `src/ui` selecciona 0 pruebas y sale con 0.
    - El puerto se deriva de la ruta del repo (de 4183 a 4282, con `--strictPort`), para que dos worktrees corran e2e a la vez sin chocar.
41. **El merge de `46c4074` queda en pausa por O-1.** El arreglo de la rama del capítulo 1 fija la caja de inspección con el clic de la pieza; en el merge resuelto, a 1280×360 «Listo» de la tarjeta recién abierta queda fuera de alcance y una prueba del juego falla. No se une hasta decidir O-1, para no dejar esa prueba rota en `feat/chapter-2`. Levantada el 2026-10-12: O-1 = D, y la Tarea 28 bis hace el merge. El merge resuelto está en el scratchpad de la sesión (ruta temporal; ver O-1, «Qué depende de esta decisión»).
42. **El motivo de una caja sin sitio va en una nota del panel lateral.** Tarea 28 bis (O-1 = D). Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Cuando una tarjeta abierta ocupa los dos lugares de la caja, la pieza no abre caja y el motivo se escribe en una nota (`Message`, variante `note`) bajo la tarjeta de Lucía. Es el único sitio que ninguna tarjeta del mapa puede tapar, y reutiliza el estándar de avisos. Aparece con el primer intento y se queda mientras la tarjeta siga abierta, para no parpadear; empuja una vez las tarjetas de abajo. Descartados: la ayuda gris de la esquina, que a veces tapa una tarjeta (J2 y J8), y un aviso junto a la pieza, que pide una variante nueva del elemento flotante y puede tapar una etiqueta vecina.
43. **El texto del motivo.** Tarea 28 bis. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Dice: «La tarjeta ocupa el sitio de la caja de inspección. Ciérrala con «Listo» o haz más grande la ventana.» Dice la causa y las dos salidas, y es exacta: a 1280×360 falta alto y no ancho, por eso «más grande» y no «más ancha». Un texto con el nombre de la pieza cambiaría por pieza y costaría una prueba por término. El texto queda sujeto al revisor de textos. Además, mientras haya una tarjeta abierta, la ayuda gris (`SCREEN_TEXT.inspectHelp`) pierde la frase que promete dejar la caja fija («Haz clic, o pulsa Enter, para dejar la caja fija»): sin sitio sería falsa, y dejarla enseñaría algo inexacto.
44. **La caja cambia de lado cada vez que tocaría la tarjeta.** Tarea 28 bis. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Con una caja a la vista y una tarjeta que se mueve (el jugador arrastra o acerca el mapa), la caja pasa al otro lugar en cuanto tocaría la tarjeta, porque O-1 = D dice que una caja nunca tapa una tarjeta abierta. Decidir el lugar solo al abrirse la caja o al cambiar la tarjeta dejaría que un arrastre del mapa pusiera la tarjeta sobre la caja. El salto solo ocurre si la caja iba a tapar algo; cuesta una lectura de rectángulos por mutación mientras haya caja y tarjeta.
45. **Una sola consulta, la del registro A.** Tarea 28 quater (O-2 = A). Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Un equipo real manda dos consultas por el mismo puerto (A y AAAA); el juego dibuja la A. Es exacta en lo que el jugador puede comprobar, el puerto y la fila del NAT (las dos reales salen del mismo socket y se traducen con una fila), y omite la AAAA. Dibujar las dos pediría nombrar IPv6 y AAAA, que Review Focus 4 prohíbe, y llenaría el mapa (cuatro paquetes y dos sellos por envío por nombre). Ningún texto afirma que sea una sola, y una prueba lo guarda.
46. **Un envío por nombre que no se resolvió se dibuja quieto en su puerta, con `?` y sin gastar puerto.** Tarea 28 quater. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Cuando el nombre no se resuelve (NXDOMAIN, SERVFAIL, sin dirección, sin resolver o sin respuesta), la consulta se ve y el `nc` o el `ping` se queda en la puerta de su dispositivo, con el sello de siempre para un paquete que no llegó a nadie. No gasta puerto propio: un `ncat` real sale en `getaddrinfo` antes de abrir un socket. Dibujarlo saliendo del edificio, como hace `pathFor` hoy, y gastar un puerto que nunca se usó son inexactos; no dibujarlo deja la causa sin sello al que apuntar. Cambia lo que decía la guía del motor (un envío que nunca sale gasta un puerto).
47. **La consulta se dibuja en cada envío por nombre.** Tarea 28 quater. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Cada `ping` y cada `nc` es un proceso nuevo que pregunta de nuevo, y el resolver contesta de su caché si puede. En el mapa queda la consulta del último envío de cada combinación; la fila de todas queda en la tabla. Dibujarla solo la primera vez, o no dibujarla si el resolver ya la tiene en caché, es inexacto: la pregunta sale antes de que la caché del resolver importe. Modelar una caché en el equipo sería una mecánica nueva y no siempre es cierta.
48. **La consulta deja su propio sello y el paquete sale cuando vuelve la respuesta.** Tarea 28 quater. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. El sello permite abrir la caja de la consulta (puerto, fila, respuesta) y ver si volvió o por qué no. El paquete sale cuando la respuesta llega al emisor porque el equipo necesita la IP para armarlo; que salgan a la vez es inexacto. Sin animaciones se dibujan las dos trayectorias y las dos etiquetas a la vez. Cuesta un sello más por envío en el resolver, que cuenta entre los que reparte O-4 = G.
49. **Lo que el juego omite de una consulta real va solo en la guía y el spec.** Tarea 28 quater. Autorizada por la sesión principal el 2026-10-12: decisión técnica que no cambia lo que se aprende; las otras opciones son inexactas o las prohíbe una regla del plan. Se omiten la consulta AAAA, la consulta inversa de `ping`, los dominios de búsqueda y los reintentos. Se declaran en `src/engine/dns/CLAUDE.md` y en «Simplificaciones declaradas» del spec, no en pantalla: decirlo en pantalla pediría nombrar IPv6, AAAA, consulta inversa o dominios de búsqueda, que no son términos del juego (Review Focus 4), y una nota vaga («un equipo real manda otra pregunta parecida») no pasa la verificación. Ningún texto afirma que la consulta sea la única.
50. **El título de la lista de un «+N» es «N sellos juntos».** Tarea 28 quinquies (O-4 = G). Autorizada por la sesión principal el 2026-10-12: decisión técnica o de copia que no cambia lo que se aprende. Se aparta del texto de la página de O-4 («4 sellos en la puerta de `laptop-lucia`»): un grupo se forma por cercanía en pantalla y puede juntar lugares distintos, y ese texto sería falso. Cada línea de la lista ya dice dónde terminó su paquete. Al estudiante se le avisa antes de su prueba humana.
51. **La leyenda de los sellos no nombra «+N».** Tarea 28 quinquies (O-4 = G). Autorizada por la sesión principal el 2026-10-12: decisión técnica o de copia que no cambia lo que se aprende. `SCREEN_TEXT.stampLegend` («Sellos: ✓ llegó · ✕ lo frenaron · ? se perdió · ! apareció un aviso.…») queda como está: el «+N» dice su cuenta, la ayuda gris ya dice «Pasa el mouse o el foco por una pieza o un sello», y la caja que abre se explica sola con su título. Si la prueba humana muestra que se pierde, nombrarlo es una línea de copia.
52. **O-5 · el lugar de la caja de inspección también lo decide una etiqueta o un sello: B si la medición lo permite; si no, A.** Tarea 28 bis (O-1 = D). Decidida por el orquestador el 2026-10-12 con la regla del umbral de la sesión principal. B: sin tarjeta abierta, la caja va a la derecha, salvo que ahí quede en su mínimo (120 px) y la izquierda tenga más sala. Porqué: el residuo del 04-01 a 1280×500 tapa «Security Group servidor2» con una marca, y B lo arregla sin quitarle información al jugador. Solo cuenta si la sala a la izquierda llega a 120 px o más; si no, queda A (D tal como se aprobó). Por qué no se abre: A deja la caja sobre una etiqueta y C quita la caja, que a veces es lo que el jugador necesita. El paso 11 de la Tarea 28 bis deja de abrir una decisión: sus capturas reales del 04-01 a 1280×500 comprueban la medida y deciden entre B y A. Si la medida dice B, hace falta una tarea nueva después de la 28 bis (el lugar cuenta las marcas) y la prueba del residuo en `tests/e2e/incidents.spec.ts`. **Medida el 2026-10-17 (Tarea 28 bis, paso 11): vale B.** A 1280×500 la sala a la derecha es de 92.2 px y a la izquierda, de 169.8 px (120 o más); la tarea que le sigue la agenda la sesión principal (backlog J17).
53. **O-8 · la etiqueta de un paquete cuyo sello se esconde en un «+N» no se dibuja (A).** Tarea 28 quinquies (O-4 = G). Decidida por el orquestador el 2026-10-12 con la regla del umbral de la sesión principal. La etiqueta sigue a su sello: la del paquete escondido no se dibuja en el mapa quieto, su texto (por ejemplo «TCP 51517 → 3000») va en la lista del «+N» y la línea de su camino sigue dibujada y termina en el «+N». Porqué: nada se pierde, porque el texto está en la lista, y el mapa no se desborda. **Se aparta de la página de O-4**, que dice que en F «cada envío escondido sigue con la suya en el mapa quieto»: el estudiante lo ve al revisar. Por qué no se abre: B crece claramente peor (con 10 envíos son 10 etiquetas de 184 px y salen del mapa) y C es un elemento nuevo que repite el «+N». La Tarea 28 quinquies la implementa desde el principio. Sus dibujos calculados están en https://claude.ai/artifact/FM7oxAKEnGksRfw8BJFLKz (fuente `scratchpad/chapter-2-decisions-o8-o9.html`); esa página las presenta como abiertas y ahora sirve para la revisión final.
54. **O-9 · cada sello de un grupo conserva la altura de su punto (B).** Tarea 28 quinquies (O-4 = G). Decidida por el orquestador el 2026-10-12 con la regla del umbral de la sesión principal. Los sellos de un grupo forman una escalera de unos 14 px (más si el grupo junta el camino y la puerta de dispositivos distintos), `placeGroups` deja de colapsarlos a la media y el «+N» se dibuja a la altura media de los sellos que esconde. Porqué: es la opción exacta (la altura dice dónde terminó el paquete, como dice la página de O-4) y sostiene el argumento de rigor con que se eligió G. Por qué no se abre: A y B pasan los tres criterios, pero la diferencia (unos 14 px) no cambia de forma importante lo que se ve ni lo que se aprende, y la lista ya dice dónde terminó cada sello. **Salvaguarda:** si las pruebas de solapes muestran que la escalera choca con etiquetas vecinas donde A no choca, se queda A (la altura media del grupo), con la frase de la página corregida en `DESIGN.md`, y se informa. La Tarea 28 quinquies implementa B en sus commits 2 y 3. Sus dibujos calculados están en https://claude.ai/artifact/FM7oxAKEnGksRfw8BJFLKz (fuente `scratchpad/chapter-2-decisions-o8-o9.html`); esa página las presenta como abiertas y ahora sirve para la revisión final.
55. **O-10 · si mover la etiqueta de un paquete en horizontal no alcanza, sube o baja lo justo (A).** Tarea 28 quinquies (O-4 = G). Decidida por el orquestador el 2026-10-12 con la regla del umbral de la sesión principal. La etiqueta se mueve en vertical lo que haga falta, con tope, y sigue pegada a su camino. Porqué: una etiqueta de paquete es un rótulo de lo que viaja y su altura no dice dónde ocurrió nada (la del sello sí). Solo hace falta si el paso 2 de la tarea muestra que moverla a un lado no la libra de la etiqueta de pieza (las etiquetas miden de 115 a 176 px y el pasillo, unos 114; no está medido). Por qué no se abre: C (acortar el texto) es inexacta, porque pierde el protocolo o un puerto, y B (cambiarla de lugar a lo largo del camino) crece peor con la traducción del NAT. La tarea ya no se detiene en ese paso.
56. **O-3 · antes de `net-unreachable`, la línea de parada de un router sin ruta dice «No llegó a su destino.», y no la frase de O-3.** Tarea 28 ter (O-3 = A1), commit `efe355b`. Del 01-05 al 02-06 dice el genérico «No llegó a su destino.»; desde el 02-07, con el término conocido, se llama «Destination Net Unreachable». La frase de O-3 («un router avisó que no tiene ruta a esa red») no se escribió porque usa «ruta», un término que la escalera presenta en el 02-06, y el genérico es exacto, no suma ni mueve ningún término y ningún incidente registrado llega a ese estado. El estudiante aceptó dejarlo así el 2026-10-17 y revisarlo en la página «para revisar».
57. **El `status: NXDOMAIN` y el `status: SERVFAIL` que imprime `dig` en el 02-11 se quedan.** Tarea 30. Decidida por el orquestador el 2026-10-20. Es la excepción declarada de D-5 (la salida literal de una herramienta, Review Focus 13): cada caja y cada tarjeta lo dice en palabras llanas y una prueba fija las dos cosas. Si el estudiante lo prefiere, el encabezado se saca del 02-11 y del 02-12, y eso es un cambio de vista.
58. **Los tres servidores de nombres se dibujan con la torre de siempre, sin marca que los distinga.** Tarea 30. Decidida por el orquestador el 2026-10-20. `servidor-autoritativo` usa la torre aprobada del servidor de internet (el conjunto aprobado en M10), igual que `servidor-dns` en el 02-10, así que no nace ninguna entidad. Si hace falta una marca visible para distinguir los tres, es una pregunta de diseño para el estudiante y se hace primero con un prototipo.
59. **La opción correcta de la pregunta del 02-11 no es la de la ficha.** Tarea 30. Decidida por el orquestador el 2026-10-20 con la regla del umbral. La ficha decía «Porque blog.lucia.example no existía todavía», y el enunciado («mientras tenía un registro A») la refuta; ahora dice «Porque su registro A apuntaba a una IP equivocada.», con su retroalimentación, y su largo (61 caracteres) queda entre los de las otras dos (50 y 63). Se aparta de la ficha.
60. **Una sola cuenta de corte para toda etiqueta de una línea.** Tarea 32 (la regla del estudiante del 2026-10-20, fila de «Decisiones del estudiante»). Decidida por el orquestador. La cuenta N es la mayor que hace caber el mapa, desde la etiqueta más larga menos uno hasta 12, y se aplica a toda etiqueta de una línea más larga que N: una etiqueta que habría cabido se corta a la misma N si otra más larga la fuerza. Es el método del prototipo aprobado aplicado a todas, y en ningún mapa registrado se corta otra etiqueta que la del servidor de noticias del 02-13. Si se quiere una cuenta por etiqueta, hace falta otro volcado de los mapas, sus pruebas y la aprobación del estudiante.
61. **Tres decisiones de copia del 02-13.** Tarea 32. Decididas por el orquestador el 2026-10-20. (1) La tarjeta «Ajustes de red» de `laptop-andres` conserva su línea genérica aprobada «Lo prestó DHCP.» (un DHCP puede prestar a un cliente una opción de DNS equivocada, así que no es falsa), y el reporte dice solo el hecho: su servidor DNS es la impresora. (2) El reporte deja el archivo hosts para la pregunta («Alguien cambió la configuración de tu-laptop»), como el 02-12 deja su causa, y la caja del `ping`, la retroalimentación correcta y el resumen lo nombran; nombrarlo en el reporte contestaría la pregunta y repetiría la pista 1. (3) Un `ping www.lucia.example` desde `tu-laptop` (que ofrece el producto cruzado de las fichas) lo contesta `servidor-nuevo` fuera del mapa, como `router-destino` en el 02-11; dibujarlo es el cambio alternativo, de una pieza en `FAILURES_PIECES`.
62. **El caso 1 del 02-14 usa `servidor-nuevo`.** Tarea 33. Decidida por el orquestador el 2026-10-20. «El sitio de `servidor-internet` escucha ahora solo en 127.0.0.1» se aplica al servidor al que apunta `www.lucia.example` en el mundo del 02-13, que es `servidor-nuevo` (`198.51.100.60`) desde el 02-12, dibujado como la torre aprobada. Ningún registro DNS vuelve atrás: la ficha es anterior a la mudanza del 02-12, y apuntar `www` otra vez a `servidor-internet` sería un cambio sin causa a la vista (`explained-behavior-changes`). La lección, un servicio ligado a 127.0.0.1 rechaza a los de afuera con un RST, es la misma.
63. **Las opciones «… está caído» de la ficha del 02-14 se quedan, y dos frases cambian de palabra.** Tarea 33. Decidida por el orquestador el 2026-10-20. «Caído» es un estado que el juego modela desde el 02-13 (el SERVFAIL de un autoritativo caído) y la evidencia de cada caso lo refuta, mientras que la regla del capítulo 1 y su prueba prohíben un dispositivo apagado como reporte o como opción correcta. La revisión de textos pidió dos arreglos de rigor, que entraron en la misma tarea: «bucle», una palabra que el jugador no conoce, pasa a «da vueltas entre dos routers», como dicen el 01-09 y el 01-14, y «Eso lo dice el ping» se acota («si vuelve, lo hay»), igual que la frase gemela del `nc`, porque un firewall puede descartar un `ping` aunque el camino esté bien.

**La página «para revisar»** (Tarea 33, regla del umbral). Está publicada, privada: https://claude.ai/artifact/S47onHqd5VxdpHMUTewZZe, «Decisiones para revisar», con 149 entradas: 139 de la Tarea 33 (las 56 que tenía esta lista, las 18 del spec del mapa 2D, los 15 puntos del relevo del mapa 2D y 50 de los relevos de las Tareas 29 a 33) y 10 de las Tareas 34 y 35 y de la revisión final; las 47 capturas nuevas del capítulo ya construido en `6991473` son de la Tarea 33; marca «se aparta de una página publicada» las 50, 53 y 56, y 12 entradas «se aparta de la ficha». Las 57 a 63 son las decisiones de las Tareas 29 a 33 que cambian lo que el jugador lee o ve o una regla del plan; el resto de las 50 de esas tareas vive en la página y en el libro del relevo (`.superpowers/sdd/2026-10-11-follow-the-packet-chapter-2/`, fuera de git). **Lo que el estudiante cambie** se agrega a la tarea que lo aplicó o al backlog (`../../docs/plans/2026-10-08-follow-the-packet-followups.md`, bloque K). El estudiante no la ha revisado todavía.

## Inventario de mecánicas

Lo que el motor y el contrato saben hacer hoy y lo que falta para los catorce. «Mecánicas hoy»: `filter`, `send`, `identify` y `diagnose`, en `src/levels/contract/incident.ts`. Los huecos del motor van primero y antes del contenido.

| # | Mecánica | Hoy | La piden | Lo que falta | Tarea |
|---|----------|-----|----------|--------------|-------|
| 1 | Puerto de origen en el paquete | `PacketSpec` solo tiene `port`, el de destino | 02, 08, 09, 10, 11, 14 | `sourcePort` opcional; la secuencia lo asigna (decidida 6) y, en un envío por nombre, la consulta DNS toma el primero y el paquete el siguiente (O-2 = A) | 4, 5, 28 quater |
| 2 | Encabezado con puertos y saludo de tres pasos | `Trace.header` lleva IP y TTL, solo en oficinas | 02, 08, 10 | `sourcePort` y `destinationPort` en la ida y en la vuelta (invertidos) y `Trace.exchange` | 4 |
| 3 | Servicios con dirección de escucha | `host.listeningTcpPorts` (solo TCP, sin dirección) | 01, 03, 05 | `host.services` con `listen`, y el RST por dirección equivocada | 6 |
| 4 | Servicios de un servidor de internet | Un actor `server` solo contesta Echo | 08, 10, 14 | `ServerActor.services` | 6 |
| 5 | Reglas con rango de puertos | El esquema y `matchesWhat` ya lo admiten | 05 | Pruebas con servicios nuevos; la batería no se toca (decidida 19) | 6 |
| 6 | Cerrado frente a filtrado | `refused` y `timeout` ya son distintos | 03, 14 | Textos y caja que digan cuál es cuál | 6, 16 |
| 7 | UDP: servicios y Port Unreachable | `host.ts` calla ante todo UDP (`host-udp-no-service`) | 10, 13, 14 | Servicios UDP, el aviso `port-unreachable`, la batería de sondas | 7 |
| 8 | Tabla de rutas de un dispositivo | Decide con su LAN y su puerta de enlace, sin tabla a la vista | 06 | `routingTable` derivada y `Trace.routes` | 8 |
| 9 | Rutas editables de un router y ruta elegida | `updateRouter` reemplaza todas; `bestRoute` ya elige la más específica | 07, 14 | `addRoute` y `removeRoute`; la ruta elegida con las que también cubrían el destino | 9 |
| 10 | Net Unreachable con una tabla sin rutas | `forward-no-route` ya existe | 07, 14 | Prueba de punta a punta y su texto | 9 |
| 11 | NAT con puertos | La oficina no lo modela (la VPC tiene `route-nat`) | 08 | Derivado de la topología; `Trace.translation` sin pasos (decidida 3) | 10 |
| 12 | Tabla de traducciones | No existe | 08, 09, 10, 11, 14 | Filas desde la secuencia, con números del juego (decidida 4), y la fila de cada consulta DNS de un envío por nombre (O-2 = A) | 10, 28 quater |
| 13 | NAT entrante y reenvío fijo | Un actor cliente no envía en una oficina con routers | 09 | Entrada por la IP pública, descarte sin traducción, `Router.forwards` | 11 |
| 14 | DNS: resolver, autoritativo, registros A y CNAME | `resolveName` solo conoce nombres EC2 de una VPC | 10, 11, 13 | `ServerActor.dns`, resolución, NXDOMAIN, SERVFAIL, `Trace.dns`, la regla del CNAME y el SOA de cada zona (lo imprime un NXDOMAIN) | 12 |
| 15 | Caché con TTL y reloj | No existe | 12 | La caché del resolver, `at` por envío, la caché inicial del mundo | 13 |
| 16 | Archivo hosts; `dig` frente al sistema | No existe | 13, 14 | `Device.hosts`; `ping` y `nc` lo leen, `dig` no | 13 |
| 17 | Resolver que no contesta | No existe | 13, 14 | `Device.dnsServer`; UDP 53 sin servicio da Port Unreachable | 13 |
| 18 | Estado puro entre paquetes | `simulate` no lleva nada de un paquete al siguiente | 02, 08, 10, 12 | `simulateSequence` (decidida 5) | 5 |
| 19 | Mundo encadenado entre capítulos | `worldBeforeChanges` falla si no hay previo en el capítulo | 02-01 | Partir de la solución del último incidente del capítulo anterior | 3 |
| 20 | Cambios explicados de servidores | `changedNames` mira dispositivos y routers | todos | Mirar servidores de internet; no contar el cableado de una pieza nueva | 3 |
| 21 | Mensajes con puerto y por nombre | `MessageChip` solo envía ICMP | 01 a 14 | `command: nc` y `dig`, `protocol` y `port`; direcciones que son nombres | 14 |
| 22 | Ajustes generalizados | `settings` solo guarda la puerta de enlace | 03, 10, 13 | `kind`: puerta de enlace, servidor DNS, dirección de escucha | 14, 15 |
| 23 | Tablas editables | No existen | 07, 11, 14 | `send.tables`, `placeEntry` y `removeEntry` (D-2 A) | 14, 15 |
| 24 | Reloj del jugador | No existe | 12 | `send.clock` y `wait` (D-11 A); su tarjeta «Reloj del juego» en el panel del incidente (V16 = C) | 14, 15, 19 |
| 25 | Resultados esperados con respuesta de DNS | `outcome` y `by` | 10 a 13 | `answer` (IP y alias) y `status` | 14 |
| 26 | Casos con reparación | Un caso del 14 no cambia el mundo | 14 | `fix` con tablas y tareas | 14, 20 |
| 27 | Salida de `nc` y de `dig` | La tarjeta de traceroute | 01 a 14 | La tarjeta «Salida», con la salida de `dig` plegable (V11 = B), y los textos con su fuente (D-4, D-5) | 18 |
| 28 | Tarjetas de tablas | No existen | 06 a 13 | `Table` (D-3) y las tarjetas de rutas, traducciones, registros y caché | 17, 19 |
| 29 | Tarjeta de cada pieza | Un segundo botón en la etiqueta («Ajustes de red de tu-laptop», solo en el 01-07) | 03, 06 a 12 | Un solo botón por pieza, que abre una tarjeta con una pestaña por tarjeta de la pieza (decidida 22, V15 = B); se quitan el segundo botón y `PIECE_ID.settings` | 14, 19 |
| 30 | Escena | Sin servidores de nombres, sin cliente de internet, sin puerto en el paquete, sin traducción | 08 a 14 | Piezas, etiquetas y especímenes (D-9 B, D-10): cuatro entidades de paquete (TCP y UDP, pedido y respuesta) y la etiqueta que cambia al cruzar el router (V13 = A); la consulta DNS antes del paquete que preguntó, con su sello (O-2 = A) | 21, 28 quater |
| 31 | Términos | 38 del capítulo 1; `cidr`, `dns` y `nat` esperan al 4 | 01 a 13 | 50 ids nuevos y 3 que se reescriben o cambian de capítulo | 2, 2 bis, 22 a 33 |
| 32 | Carpetas llenas | Cuatro en 12 y cinco en 11 | todas | Mudanza | 1 |
| 33 | Desbloqueo y ayudantes e2e | `CHAPTER_1_DONE` abre el 04-01 | todos | `CHAPTER_2_DONE`; el 04-01 se abre con el 02-14 (decidida 18) | 22 |
| 34 | Campo «Servicios» en la caja y «En la red» (D-8) | Sin campo de servicios; «Conexión» | 01, 02 | Los dos campos | 16 |
| 35 | Prueba espejo de la respuesta | La del capítulo 1 cubre ICMP | todos | TCP, UDP y NAT tampoco dan razón ni nombran «stateful» | 6, 7, 10 |
| 36 | Avisos y errores | Seis lugares con cinco apariencias y tres maneras de anunciarse; ninguna primitiva | todos | Un solo estándar (Tarea 18 bis; V17 y V18) | 18 bis, 19 |

## Contratos nuevos

Nombre, tipo y significado. Toda propiedad nueva es opcional salvo que se diga lo contrario, para que la VPC y las oficinas de hoy sigan validando.

### Modelo de la red (`src/engine/network/` y las carpetas nuevas del motor)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Service` | `{ protocol: 'tcp' \| 'udp', port, listen: 'all' \| 'loopback' }` | Un programa que escucha. `loopback` solo acepta paquetes cuyo destino es `127.0.0.1` (decidida 8) |
| `Device.host.services` | lista de `Service` | Reemplaza a `host.listeningTcpPorts` (decidida 7) |
| `ServerActor.services` | lista de `Service` | Lo que escucha un servidor de internet |
| `ServerActor.dns` | `{ role: 'resolver' \| 'authoritative', upstreams?, zones?, cache?, failing? }` | Un servidor de nombres. `upstreams` es la lista `{ zone, serverId }` de a qué autoritativo pregunta el resolver por cada zona; `zones` es una lista de `{ name, records }`; `cache` son entradas `{ name, type, value, expiresAt }` en segundos del reloj del juego; `failing` hace que conteste SERVFAIL |
| `DnsRecord` | `{ name, type: 'A' \| 'CNAME' \| 'NS' \| 'SOA', value, ttl }` | Un registro. El apex de la zona trae NS y SOA, que la vista esconde bajo «registros propios de la zona»: sirven para que la regla del CNAME los vea. El SOA lleva los siete campos de RFC 1035 §3.3.13 (MNAME, RNAME, SERIAL, REFRESH, RETRY, EXPIRE, MINIMUM) con valores fijos del juego, y un NXDOMAIN lo entrega con el TTL de RFC 2308 §3: el menor entre el TTL del propio SOA y su MINIMUM |
| `Device.dnsServer` | IPv4 | El resolver de «Ajustes de red», el que prestó DHCP |
| `Device.hosts` | lista de `{ name, ip }` | Su archivo hosts |
| `Router.forwards` | lista de `{ protocol, publicPort, toDeviceId, toPort }` | Reenvíos de puertos |
| `PacketSpec.sourcePort` | entero de 1 a 65535 | El puerto desde el que sale. Sin él, la secuencia lo asigna (decidida 6) |
| `PacketSpec.lookup` | `'system' \| 'dig'` | Cómo se resuelve un nombre: `system` lee el archivo hosts y después pregunta al resolver (`ping`, `nc`); `dig` es la consulta misma, un datagrama UDP al puerto 53 del resolver, y no lee hosts |
| Acciones nuevas | `setServices`, `setListenAddress`, `setDns`, `setDnsServer`, `setHosts`, `setForwards`, `addRoute`, `removeRoute`, `addRecord`, `removeRecord` | Cambian el modelo. `setServices` y `setListenAddress` valen para un dispositivo y para un servidor de internet. `addRecord` devuelve la misma red cuando la regla del CNAME lo impide; la función `recordProblem` dice por qué, para que la vista lo muestre |

Reglas del esquema: ninguna IP se repite entre dispositivos, interfaces y servidores (los servidores de nombres cuentan); un nombre con un CNAME no tiene otros registros; cada `upstreams.serverId` de un resolver es un autoritativo que existe; un reenvío apunta a un dispositivo que existe; una VPC no trae `dns`, `forwards` ni `hosts`.

### Traza (`src/engine/simulation/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Trace.header` | `request` y `reply` ganan `sourcePort` y `destinationPort` | Los puertos de la ida y los de la vuelta, invertidos. Solo TCP y UDP; ausentes en ICMP |
| `Trace.exchange` | lista de `{ from: 'client' \| 'server', kind: 'SYN' \| 'SYN-ACK' \| 'ACK' \| 'RST' \| 'query' \| 'response' }` | Lo que se dijeron los dos extremos: el saludo de tres pasos, el rechazo o la consulta UDP |
| `Trace.translation` | `{ protocol, inside: { ip, port }, outside: { ip, port }, isNew, fixed }` | Lo que el NAT hizo con el origen. Un campo aparte, nunca un paso (decidida 3) |
| `Trace.routes` | lista de `{ holderId, route: { to, via? }, kind: 'connected' \| 'default' \| 'static', alsoCovered }` | Una por decisión de reenvío (el emisor y cada router): la ruta elegida y las que también cubrían el destino |
| `Trace.dns` | `{ name, status: 'NOERROR' \| 'NXDOMAIN' \| 'SERVFAIL' \| 'NO-RESOLVER', answers, fromCache, ttlLeft?, usedHostsFile, viaDig }` | Lo que pasó con el nombre. Ausente cuando el destino era una IP. En un NXDOMAIN lleva además el SOA de la zona que contestó |
| `Trace.question` | `{ packet, trace }` | La consulta que un `ping` o un `nc` por nombre mandó a su resolver antes de salir: el datagrama UDP al 53 tal como salió, con su puerto de origen, y su traza completa (encabezado con puertos, `exchange`, `translation`, aviso). Su `dns` es el de `Trace.dns` con `viaDig` en verdadero. Ausente con una IP, con el archivo hosts, sin `dnsServer`, en un `dig`, en una VPC y en el capítulo 1 |
| `NoticeKind` | gana `'port-unreachable'` | El aviso de un puerto UDP sin servicio |
| Códigos de motivo nuevos | `host-wrong-address`, `host-udp-closed` (reemplaza a `host-udp-no-service`), `nat-no-translation`, `nat-forwarded`, `dns-answered`, `dns-cached`, `dns-hosts-file`, `dns-nxdomain`, `dns-servfail`, `dns-no-resolver`, `dns-resolver-silent` | Cada uno trae sus datos (ids, IP, puertos, nombres); `src/copy/` los vuelve texto |
| `simulateSequence(net, sends)` | `sends` = lista de `{ packet, at }` | Una traza por envío, llevando la tabla del NAT, el puerto efímero y la caché de uno al siguiente. Determinista (decidida 5). La consulta de un envío por nombre va dentro de su traza y gasta el primer puerto del envío. |

Los campos nuevos están ausentes en toda traza que el test dorado registra, y ninguna etapa nueva escribe un paso en una traza del capítulo 1 ni del 4. Los pasos nuevos solo los escriben paquetes que el capítulo 2 envía: TCP, UDP, de un actor cliente, o con un nombre de DNS de oficina.

### Contrato del incidente (`src/levels/contract/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `mechanic` | las cuatro de hoy | Ninguna nueva (D-2 A). 04 = `identify`, 05 = `filter`, 14 = `diagnose`, el resto `send` |
| Ficha de mensaje | `{ id, label, command, protocol?, port?, icmpType?, ttl? }` | `command` gana `nc` (pide `protocol: tcp` y `port`) y `dig` (UDP al 53, el nombre es la dirección). `icmpType` ya no es obligatorio: solo lo piden los mensajes ICMP |
| Ficha de dirección | `{ id, address }` | `address` puede ser un nombre (`www.lucia.example`) |
| `send.settings` | lista de `{ id, deviceId, kind, name, chips }` | `kind` es `gateway`, `dns-server` o `listen-address`. Cada ficha lleva un `value` que depende del tipo: una IP o ninguna, o `all` o `loopback` |
| `send.tables` | lista de `{ id, kind: 'routes' \| 'records', ownerId, trays }` | Una tabla que el jugador edita. Una ruta se compone con dos bandejas (destino y siguiente salto); un registro, con tres (nombre, tipo y valor) |
| `send.clock` | `{ steps: [{ id, label, seconds }] }` | Las fichas de «Esperar». Las pinta la tarjeta «Reloj del juego» del panel del incidente (V16 = C), que solo existe en un incidente con reloj |
| `PlayerMove` | gana `placeEntry { tableId, picks }`, `removeEntry { tableId, entryId }` y `wait { seconds }`; `setSetting` se generaliza | Los tres cambian el mundo o el reloj. Un movimiento que cambia el mundo borra los envíos anteriores |
| `SendTask.expect` | gana `answer?: { ip?, alias? }` y `status?` | Lo que debe responder el DNS: la IP, si llegó por un alias, y el estado (`NXDOMAIN`, `SERVFAIL`) |
| `diagnose.cases[]` | gana `fix?: { tables, tasks }` | Un caso con reparación: las tablas que el jugador edita y las tareas que deben cumplirse para cerrarlo |
| `officeLeaks` | función | Un `nc` o un `dig` a una IP fuera de una oficina sin routers sigue siendo una fuga |
| Tarjeta que una pieza abre primero | dato opcional del incidente | Para una pieza con varias tarjetas (V15 = B), cuál abre primero. Sin él abre la terminal si la pieza la tiene, luego los ajustes o los servicios y luego las tablas. El 01-07 no lo necesita |

### Sistema de diseño (`src/design/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Table` (D-3 A) | primitiva nueva | Columnas con encabezado, filas con celdas de texto y una acción opcional por fila (quitar). No acepta `className` ni `style`. Un `<table>` con su `caption`; en estilo B, dentro de una `Card` |
| Estándar de avisos y errores (Tarea 18 bis, V17 y V18) | primitiva nueva `Message` (V18 = A, decidida el 2026-10-11, con el aspecto «Pestaña» y `success` en verde) | Un `p` con las variantes `note`, `success`, `warning` y `error` para todo aviso o error que la interfaz dice. Cada variante lleva una marca o una palabra y su propia forma, no solo un color. No acepta `className` ni `style` y no pone rol: lo pasa su dueño. Hoy lo hacen cuatro clases sueltas de `src/styles.css` |
| Tarjeta «Salida» (D-4 A) | variante de la tarjeta de traceroute | Líneas literales de una herramienta. No suma una primitiva: usa `Card` y el estilo de código que la de traceroute ya tiene. La salida de `dig` se imprime completa y se pliega: las líneas clave a la vista y el resto detrás de «Ver las N líneas restantes» (V11 = B) |
| `ChipTray`, `Choice`, `Button`, `Tabs` | sin cambios | Las bandejas de las tablas son bandejas de siempre |

### Sesión y vista (`src/game/`)

| Nombre | Significado |
|--------|-------------|
| `Session.clock` y `Session.sends` | Los envíos guardan `at`; el reloj solo avanza con `wait` |
| Acciones nuevas | `placeEntry`, `removeEntry`, `wait`; `setSetting` generalizado |
| `TableCard` | Lo que muestra la tarjeta de una tabla: título, columnas, filas (en una editable, también las bandejas y por qué el motor rechazó una entrada) y cuáles filas están en uso. La calcula `game`; la vista no decide nada |
| `OutputCard` | Las líneas que imprimió un `nc`, un `dig` o un traceroute, con su fuente en la guía y en un test. La de `dig` se pliega: las líneas clave a la vista y el resto detrás de «Ver las N líneas restantes» (V11 = B) |
| Tarjeta de una pieza (V15 = B) | Una sola entrada por pieza: su etiqueta tiene un botón que abre una tarjeta con una pestaña por cada tarjeta de la pieza (terminal, ajustes, servicios, tablas, registros, caché), o sin pestañas si tiene una; dice cuál abre primero. Reemplaza a `PIECE_ID.settings` (decidida 22); no nace `PIECE_ID.entry` |
| Tarjeta «Reloj del juego» (V16 = C) | Una tarjeta del panel del incidente, bajo la de Lucía, con `Session.clock` y las fichas de `send.clock`; solo existe en un incidente con reloj |
| `describeReason(reason, net, known)` | Los motivos nuevos, con los términos que el jugador conoce; un motivo cuyo término es desconocido dice solo lo que el jugador vio |
| Campos de la caja | «Servicios», «Encabezado» con puertos, «Saludo», «Ruta que usó», «Traducción» y «DNS», cada uno detrás del término que usa |
| `SentPacket.question` y `drawnSends` | La corrida de la consulta de un envío por nombre (su id, su sello, su caja y su fila) y la lista que dibuja el mapa: por cada envío, su consulta primero y luego el paquete, que la espera |

## Los catorce: fichas

Cada ficha: mecánica, términos, mundo (qué cambia y a quién se nombra, por `explained-behavior-changes`), qué viaja, qué hace el jugador y con qué fichas, tareas, éxito, fallo y causa, la pregunta de Lucía con la idea de la correcta y el error que refleja cada incorrecta, y las dos pistas. Los números del mundo pueden ajustarse al escribir. Los términos de cada incidente salen de la tabla «Los catorce» del spec y sus definiciones, de su tabla de 53. Todas las respuestas correctas cambian de lugar entre incidentes para que no se adivinen. Posición de la correcta: 01 = 2.ª, 02 = 1.ª, 03 = 3.ª, 04 = 2.ª, 05 = 1.ª, 06 = 3.ª, 07 = 2.ª, 08 = 1.ª, 09 = 3.ª, 10 = 2.ª, 11 = 1.ª, 12 = 3.ª, 13 = 2.ª; el 14, por caso, abajo.

El mundo base de cada incidente es la solución del anterior (decidida 1): el 02-01 parte de la oficina tal como la deja el 01-14, con el firewall oculto de `laptop-marta` (ya visible), el de `tu-laptop` con su salida abierta, el tramo del proveedor reparado y `laptop-visita` conectada. El mundo es común; lo que se dibuja no (decidida 28). Una laptop o un router que ya existía y cambia de configuración se nombra en el report, en la explicación correcta o en el takeaway; una pieza que una acción agrega no hace falta nombrarla.

### Bloque 1 · Quién escucha

**02-01 · Un equipo, muchos servicios** · `send` · términos: servicio, puerto, puerto de destino, IP:puerto, escuchar, nc. Denso (seis términos).
- **Mundo:** `setServices` de `laptop-lucia`: su app en el puerto 3000 y su base de datos de pruebas en el 5432, las dos en todas las IPs. El report nombra a `laptop-lucia` («Lucía puso a funcionar dos programas en laptop-lucia»). Dibuja `tu-laptop` y `laptop-lucia`.
- **Qué viaja:** un ping y dos `nc -vz -w 3` a `192.168.1.11`.
- **Jugador y fichas:** origen fijo `tu-laptop`; destino `192.168.1.11`; mensaje: ping, «nc · puerto 3000» y «nc · puerto 5432» (decidida 26).
- **Tareas:** (1) que el ping a `laptop-lucia` vuelva; (2) que el `nc` al 3000 vuelva; (3) que el `nc` al 5432 vuelva.
- **Éxito:** las tres. La caja del `nc` muestra `192.168.1.11:3000` como destino y la tarjeta «Salida» imprime la salida de `ncat` 7.93 (D-5): las líneas Version, Connected y de bytes, con el prefijo `Ncat: `.
- **Fallo y causa:** no hay fallo; el contraste es el ping, que no usa puerto, frente al `nc`, que sí.
- **Pregunta:** «El ping a `laptop-lucia` volvió. ¿Por qué eso no prueba que su app funciona?» Correcta (2.ª): el ping llega al equipo y no usa puertos; la app es un servicio que escucha en un puerto, y hay que probar ese puerto. Incorrectas: «Porque la app tiene su propia IP, distinta de la del equipo» (cree que cada servicio tiene su IP; la IP es del equipo y el puerto distingue el servicio); «Porque el ping no llegó a `laptop-lucia`» (ignora que volvió).
- **Pistas:** (1) un equipo tiene una IP, pero puede tener muchos servicios. (2) el puerto dice cuál servicio; prueba con `nc` en el 3000.
- **Rigor:** ICMP no tiene puertos (el Echo lleva un identificador; RFC 792); el texto dice «el ping no usa puertos» y no más. El `puerto` es de 1 a 65535. **Takeaway (D-5):** dice que en Amazon Linux 2023 `nc` se instala con `sudo dnf install nmap-ncat` (no viene en la AMI estándar) y que en macOS la salida se ve distinta; prueba: `02-01: the takeaway says how to install nc on Amazon Linux 2023 and that macOS prints it differently`.

**02-02 · Abrir una conexión** · `send` · términos: cliente y servidor, TCP, conexión, saludo de tres pasos, puerto de origen, puerto efímero. Denso (seis términos).
- **Mundo:** sin cambios. Dibuja `tu-laptop` y `laptop-lucia`.
- **Qué viaja:** dos `nc` desde `tu-laptop`, uno al 3000 y otro al 5432.
- **La caja:** «Encabezado»: `192.168.1.10:51514 → 192.168.1.11:3000`; la vuelta, `192.168.1.11:3000 → 192.168.1.10:51514`; «Saludo de tres pasos»: 1. SYN, de `tu-laptop` a `laptop-lucia`; 2. SYN-ACK, de vuelta; 3. ACK. El segundo `nc` sale del 51515 (decidida 6).
- **Tareas:** (1) abrir la conexión al 3000; (2) abrir la conexión al 5432.
- **Pregunta:** «¿A qué puerto vuelve la respuesta de `laptop-lucia`?» Correcta (1.ª): al puerto de origen que eligió `tu-laptop`, el efímero: la vuelta invierte origen y destino, también en los puertos. Incorrectas: «Al 3000, el del servicio» (mezcla puerto de origen y de destino); «A un puerto que elige `laptop-lucia` al contestar» (cree que el servidor decide).
- **Pistas:** (1) compara el encabezado de ida con el de vuelta. (2) mira el puerto de origen del segundo `nc`: cambió.
- **Rigor:** cliente y servidor son roles del intercambio (en el siguiente, `laptop-lucia` podría ser cliente); ningún texto da un rango de puertos efímeros como cifra; ningún texto da una razón de por qué la respuesta vuelve (decidida 16).

### Bloque 2 · Rechazo, bloque y regla

**02-03 · Rechazo o silencio** · `send` con la tarjeta «Servicios de laptop-lucia» · términos: puerto cerrado, RST, Connection refused, puerto filtrado, dirección de escucha. Denso (tres causas).
- **Mundo:** `setListenAddress` de la app de `laptop-lucia`: ahora solo escucha en `127.0.0.1`. El report lo nombra («Lucía reinició su app y ahora solo escucha en 127.0.0.1»). `laptop-marta` ya tiene su firewall (visible desde el 01-11). Dibuja `tu-laptop`, `laptop-lucia` y `laptop-marta`.
- **Qué viaja:** `nc` desde `tu-laptop` a `laptop-lucia` (puertos 3000 y 3306) y a `laptop-marta` (puerto 3000); y desde `laptop-lucia` a `127.0.0.1` (puerto 3000).
- **Jugador y fichas:** orígenes `tu-laptop` y `laptop-lucia`; destinos `192.168.1.11`, `192.168.1.12` y `127.0.0.1`; mensajes «nc · puerto 3000» y «nc · puerto 3306». En la tarjeta «Servicios de laptop-lucia», la bandeja «Escucha en» de la app: «Solo este equipo (127.0.0.1)» y «Todas las IPs (0.0.0.0)».
- **Tareas:** (1) el `nc` de `tu-laptop` al 3306 de `laptop-lucia` es rechazado (`refused`, `by` laptop-lucia); (2) el `nc` de `tu-laptop` al 3000 de `laptop-marta` no recibe nada (`timeout`, `by` el firewall de laptop-marta); (3) el `nc` de `laptop-lucia` a `127.0.0.1` en el 3000 vuelve; (4) el `nc` de `tu-laptop` al 3000 de `laptop-lucia` vuelve (se arregla con «Todas las IPs»).
- **Fallo y causa:** antes de arreglar, el `nc` de `tu-laptop` al 3000 de `laptop-lucia` recibe un RST («Connection refused») aunque haya un servicio en el 3000: escucha solo en `127.0.0.1` y el paquete llegó a otra IP del equipo. El rechazo lo manda `laptop-lucia`; el silencio hacia `laptop-marta` lo causa su firewall.
- **Pregunta:** «¿Por qué tu `nc` al 3000 de `laptop-lucia` fue rechazado, si ella tiene un servicio en el 3000?» Correcta (3.ª): ese servicio escuchaba solo en `127.0.0.1`: atiende al propio equipo y rechaza lo que llega a su IP de la red. Incorrectas: «Porque un firewall descartó el paquete» (confunde rechazo con silencio: aquí contestó un RST); «Porque el puerto 3000 estaba cerrado» (cerrado es que nadie escucha; aquí alguien escucha, pero en otra IP).
- **Pistas:** (1) un rechazo lo manda el dispositivo; el silencio es que nadie contesta. (2) compara el `nc` de `laptop-lucia` a `127.0.0.1` con el tuyo.
- **Rigor:** el comportamiento de la dirección de escucha no se probó localmente (decidida 8); el texto del RST no da la razón de por qué el firewall deja o no pasar nada más; el silencio hacia `laptop-marta` imprime `Ncat: TIMEOUT.`, leído en `ncat_connect.c` de Nmap 7.93 (D-5).

**02-04 · ¿Está en mi bloque?** · `identify` (D-6 = A, decidida el 2026-10-11) · términos: bit (apoyo), prefijo, CIDR, máscara de subred.
- **Mundo:** sin cambios. Dibuja `tu-laptop`, `impresora`, `laptop-andres` y `router-oficina`. Nada viaja: segunda excepción a la regla 2 de los subcapítulos.
- **Tarjeta (D-6 = A; referencia visual: la sección D-6 de la página de prototipos):** una sola, la que abre `tu-laptop`. Tiene, de arriba abajo: (1) las dos preguntas con fichas, como antes: «¿Cuál es el bloque de tu red local?» con `192.168.1.0/24`, `192.168.1.0/28` y `192.168.1.0/32`, y «¿Cuál es su máscara de subred?» con `255.255.255.0`, `255.255.0.0` y `255.255.255.255` (el prototipo las traía dadas, como referencia; se conservan como fichas); (2) la fila de los 32 bits de la IP de `tu-laptop`, agrupados en cuatro números, con los 24 primeros marcados (los del bloque) y los 8 últimos vacíos (los del equipo); (3) «Por clasificar»: `impresora` y `laptop-andres`, cada IP partida en dos partes, la del bloque llena y la del equipo vacía (`192.168.1.` y `21`; `192.168.2.` y `15`); (4) dos bandejas, «Dentro de 192.168.1.0/24» y «Fuera», donde el jugador pone cada elemento. En el mapa, un contorno rodea lo que el jugador ya puso dentro; `tu-laptop` está dentro desde el principio. **Por resolver al escribir el texto (no lo decidió el estudiante):** como el bloque y la máscara se eligen en la misma tarjeta, la fila de bits no puede mostrar el /24 ya marcado antes de que el jugador lo elija sin regalar la respuesta; el prototipo traía el bloque dado.
- **Tareas:** (1) el bloque de `tu-laptop` es `192.168.1.0/24`; (2) su máscara es `255.255.255.0`; (3) la impresora cabe (queda en «Dentro»); (4) `laptop-andres` no cabe (queda en «Fuera»).
- **Fallo y causa:** `192.168.1.0/28` llega hasta `192.168.1.15` (la impresora, `192.168.1.21`, está en tu red local y no cabe); `/32` es una sola IP; cada ficha de bloque lo dice en su `feedback` al pulsar «Listo», y la línea de cada elemento clasificado dice por qué cabe o no cabe, con los tres primeros números de su IP y los del bloque.
- **Pregunta:** «¿Por qué `192.168.2.15` no cabe en `192.168.1.0/24`?» Correcta (2.ª): los primeros 24 bits, los tres primeros números, son iguales para todo el bloque, y los de `192.168.2.15` empiezan por `192.168.2`. Incorrectas: «Porque /24 deja solo 24 IPs» (confunde el prefijo con la cantidad de IPs: son 256); «Porque 2 es mayor que 1» (compara números en vez de mirar los bits fijos).
- **Pistas:** (1) /24 significa que los tres primeros números son fijos. (2) compara los tres primeros números de cada IP con los del bloque.
- **Rigor:** 256 direcciones, no 256 equipos; la forma `192.168.1.0/24` es la del bloque, y `192.168.1.10/24` es una IP con su prefijo; un /32 es una IP (RFC 4632 §3.1). Partir la IP en texto solo vale cuando el prefijo cae en un punto (/8, /16, /24); con otro prefijo, la partición se ve solo en la fila de bits.

**02-05 · La regla completa** · `filter` · términos: rango de puertos, SSH, puerto por defecto, puertos conocidos (D-18).
- **Mundo:** `setServices` de `laptop-lucia` suma SSH en el 22 y `addFirewall` le pone un firewall de equipo con la entrada vacía y la salida abierta. El report nombra a `laptop-lucia` («Lucía activó SSH en laptop-lucia y puso un firewall que no deja entrar nada»). Dibuja `tu-laptop`, `laptop-lucia` y `laptop-visita`.
- **Qué viaja (flujos):** `tu-laptop` al puerto 22 de `laptop-lucia` (requerido) y `laptop-visita` al mismo puerto (prohibido).
- **Fichas:** Type: `TCP · 22`, `TCP · 80`, `TCP · 1-1023`, `TCP · 0-65535` e `ICMP · Echo Request`. Source: `[tu-laptop] (IP 192.168.1.10)` (un `/32`), `Cualquier IP de origen` (`0.0.0.0/0`) y `192.168.1.0/24` (el bloque del piso 1). Ningún chip menciona UDP (se presenta en el 10; decidida 19).
- **Tarea:** que `tu-laptop` entre al 22 de `laptop-lucia` y `laptop-visita` no.
- **Éxito:** `TCP · 22` desde `[tu-laptop]`. La estrella del medio es la de «no abrir de más».
- **Fallo y causa:** `TCP · 22` desde `Cualquier IP de origen` deja entrar a la visita (alerta de intruso); `TCP · 1-1023` abre además el 80 y el 443, que la batería de sondas detecta. El texto que nombra ese rango lo liga con «puertos conocidos» sin decir si el puerto 0 se permite o se prohíbe (D-18).
- **Pregunta:** «¿Por qué la regla `TCP · 22` desde `Cualquier IP de origen` deja entrar a la visita?» Correcta (1.ª): `0.0.0.0/0` en una regla significa cualquier origen. Incorrectas: «Porque el 22 es un puerto conocido y cualquiera puede usarlo» (confunde la costumbre con el permiso: lo que permite es la regla); «Porque las reglas TCP no miran el origen» (cree que una regla solo mira el puerto).
- **Pistas:** (1) una regla es protocolo, rango de puertos y origen. (2) abre solo el 22 y solo para `tu-laptop`.
- **Rigor:** el puerto por defecto es una costumbre (22 para SSH, 80, 443, 3306 y 5432; RFC 6335: «Assignment of a service name or port number does not in any way imply an endorsement»), y los puertos conocidos son el rango de IANA del 0 al 1023 (RFC 6335 §6, «System Ports, also known as the Well Known Ports»): el 3306 y el 5432 son puertos por defecto y no son puertos conocidos; el 53 no se lista aquí; el texto avisa que `0.0.0.0/0` en una ruta significa otra cosa, y el 06 lo cumple.

### Bloque 3 · Qué camino

**02-06 · Tu tabla de rutas** · `send` con la tarjeta de rutas de `tu-laptop` (solo lectura) · términos: ruta, tabla de rutas, ruta de red conectada, ruta por defecto.
- **Mundo:** sin cambios. Dibuja `tu-laptop`, `impresora`, `laptop-andres` y `router-oficina`.
- **Tarjeta «Tabla de rutas de tu-laptop»:** `192.168.1.0/24 · directo` y `0.0.0.0/0 · 192.168.1.1`; la fila que usó el último paquete queda marcada. La columna se llama «Por dónde sale» (decidida 23).
- **Qué viaja:** un ping a la impresora y otro a `laptop-andres`. La caja dice «Ruta que usó: 192.168.1.0/24, ruta de red conectada» o «0.0.0.0/0, ruta por defecto».
- **Tareas:** (1) que el ping a la impresora vuelva; (2) que el ping a `laptop-andres` vuelva.
- **Pregunta:** «¿Por qué el ping a `laptop-andres` usó la ruta por defecto?» Correcta (3.ª): ninguna otra fila de la tabla cubre `192.168.2.15`, y la ruta por defecto recibe lo que nada más cubre. Incorrectas: «Porque `laptop-andres` está más lejos» (cree que la distancia elige la ruta); «Porque la ruta por defecto es la primera de la tabla» (cree que el orden elige).
- **Pistas:** (1) mira qué fila de la tabla cubre cada IP. (2) la fila `192.168.1.0/24` solo cubre las IP que empiezan por `192.168.1`.
- **Rigor:** `0.0.0.0/0` en una ruta es «lo que ninguna otra cubre», no «cualquier origen» (el 05); la tabla de una VPC de AWS usa Destination y Target (capítulo 6); la tabla del juego no imita `ip route`.

**02-07 · Un camino a la otra oficina** · `send` con la tarjeta de rutas de `router-oficina` (editable) · términos: siguiente salto, Destination Net Unreachable (apoyo), ruta más específica.
- **Mundo:** `addLan` (la otra oficina, `10.0.0.0/16`), `addDevice` de `impresora-sucursal` (`10.0.0.10`) y `laptop-sucursal` (`10.0.0.20`), `addRouter` de `router-sucursal` (`10.0.0.1` hacia su LAN y `172.16.0.2` hacia `router-oficina`) y `updateRouter` de `router-oficina`: sin rutas y con una interfaz `172.16.0.1` hacia `router-sucursal`. El report nombra a `router-oficina` («Alguien reinició router-oficina y perdió sus rutas: ya no sabe a dónde mandar lo que no es de la oficina. La empresa tiene además un enlace privado con la otra oficina, que usa las IP 10.0.0.x») y nombra solo los routers que el mapa dibuja. Dibuja `tu-laptop`, `router-oficina`, `router-proveedor`, `router-sucursal`, `impresora-sucursal`, `laptop-sucursal`, el globo y `servidor-internet` (lista `ROUTES_PIECES`).
- **Qué viaja:** pings al servidor (`198.51.100.50`), a `10.0.0.10` y a `10.0.0.20`.
- **Fichas:** origen `tu-laptop`; mensaje ping. En la tarjeta de `router-oficina`: Destino: `0.0.0.0/0`, `10.0.0.0/16` y `10.0.0.10/32`; Siguiente salto: `203.0.113.1 (router-proveedor)` y `172.16.0.2 (router-sucursal)`.
- **Tareas:** (1) que el ping al servidor vuelva; (2) que el ping a `10.0.0.10` vuelva (`by` impresora-sucursal); (3) que el ping a `10.0.0.20` vuelva.
- **Éxito:** `0.0.0.0/0 → 203.0.113.1` y `10.0.0.0/16 → 172.16.0.2`.
- **Fallo y causa:** sin rutas, `router-oficina` avisa Destination Net Unreachable (el aviso sale de `192.168.1.1`). Con solo la ruta por defecto, el ping a `10.0.0.x` muere en silencio en `router-proveedor`: es la IP privada que internet no entrega, como en el 01-08 (decidida 11). `10.0.0.10/32 → router-sucursal` arregla una impresora y deja `10.0.0.20` sin camino. `0.0.0.0/0 → router-sucursal` deja al servidor sin camino.
- **Pregunta:** «¿Por qué el ping a `10.0.0.10` va a `router-sucursal` y no a `router-proveedor`, si las dos rutas lo cubren?» Correcta (2.ª): gana la ruta de prefijo más largo; `10.0.0.0/16` es más específica que `0.0.0.0/0`. Incorrectas: «Porque se agregó después» (cree que gana la última ruta); «Porque `0.0.0.0/0` solo se usa cuando falla otra ruta» (cree que la ruta por defecto es de respaldo; cubre siempre y pierde por ser menos específica).
- **Pistas:** (1) el aviso viene de `router-oficina`: ninguna de sus rutas cubre ese destino. (2) cuando dos rutas cubren una IP, gana la de prefijo más largo.
- **Rigor:** un router «puede» avisar (RFC 792); el aviso es el par de Destination Host Unreachable; ningún router que callaba en el 01-08 avisa ahora; el router del proveedor aparece en la caja porque el mapa lo dibuja.

### Bloque 4 · Una IP, muchos equipos

**02-08 · Una IP para toda la oficina** · `send` con la tarjeta «Tabla de traducciones» de `router-oficina` (solo lectura) · términos: NAT, traducción de puertos, tabla de traducciones (apoyo).
- **Mundo:** `setServices` de `servidor-internet`: TCP 80 y 443, solo como números (la web es del capítulo 3). El report nombra a `servidor-internet` y dice que `router-oficina` cambia el remitente de lo que sale a internet **desde que la oficina salió a internet**: no es un cambio, el mapa antes no lo mostraba (decidida 3). Dibuja `tu-laptop`, `laptop-lucia`, `router-oficina`, el globo y `servidor-internet`.
- **Qué viaja:** un `nc` al puerto 80 del servidor desde `tu-laptop` y otro desde `laptop-lucia`. Los dos salen del 51514 (cada dispositivo empieza su secuencia ahí; decidida 6).
- **La caja:** «Encabezado (en tu red local)»: `192.168.1.10:51514 → 198.51.100.50:80`; «Encabezado (en internet)»: `203.0.113.10:40001 → 198.51.100.50:80`; el de `laptop-lucia` sale del `40002`. La nota «Fuera de la oficina el encabezado cambia…» desaparece (decidida 15).
- **Tarjeta «Tabla de traducciones de router-oficina»:** Protocolo, IP:puerto privado, IP:puerto público. `TCP · 192.168.1.10:51514 · 203.0.113.10:40001` y `TCP · 192.168.1.11:51514 · 203.0.113.10:40002`. Las dos filas existen porque el jugador envió los dos `nc`; la tabla muestra lo enviado desde el último cambio de mundo (decidida 4).
- **Tareas:** (1) que el `nc` de `tu-laptop` al puerto 80 vuelva; (2) que el `nc` de `laptop-lucia` al puerto 80 vuelva.
- **Pregunta:** «Las dos laptops salieron con la misma IP pública. ¿Cómo sabe `router-oficina` a cuál devolver cada respuesta?» Correcta (1.ª): por el puerto: cada conexión tiene su fila con su puerto público, y la respuesta busca su fila. Incorrectas: «Por la IP del servidor, que es distinta para cada laptop» (el servidor es el mismo); «Contesta a las dos laptops a la vez» (cree que el router duplica la respuesta).
- **Pistas:** (1) compara los puertos públicos de las dos filas. (2) la respuesta llega al puerto público de su fila.
- **Rigor:** los puertos 40001 y 40002 son del juego; «otros NAT eligen otros números»; el ping también sale traducido y no deja fila (ICMP no tiene puertos); sin tiempos de vida; ningún texto da una razón de por qué la respuesta vuelve más allá de la fila (decidida 16). Con `nat` conocido, el 01-08 se entiende de nuevo: el ping al servidor salía traducido.

**02-09 · Desde afuera** · `send` · término: reenvío de puertos (opcional).
- **Mundo:** `addActor` de `casa-lucia` (un cliente de internet, `192.0.2.77`); `setServices` de `laptop-andres` (su app en el 3000); `setForwards` de `router-oficina`: lo que llega a `203.0.113.10:3000` va a `laptop-andres:3000` (D-14). El report nombra a `router-oficina` y a `laptop-andres`. Dibuja `casa-lucia`, el globo, `router-oficina` y `laptop-andres`.
- **Qué viaja:** `nc` desde `casa-lucia` a `203.0.113.10`, al puerto 40009 (sin fila) y al 3000 (con el reenvío).
- **Fichas:** origen `casa-lucia`; destino `203.0.113.10`; mensajes «nc · puerto 40009» y «nc · puerto 3000».
- **Tareas:** (1) el `nc` al 40009 no llega a nadie (`timeout`, `by` router-oficina); (2) el `nc` al 3000 llega a `laptop-andres` (`replied`, `by` laptop-andres).
- **Fallo y causa:** sin fila, `router-oficina` no sabe a qué equipo entregar el paquete y no lo entrega; el cliente solo espera. Con el reenvío, el paquete llega a quien sea, porque `laptop-andres` no tiene firewall: NAT traduce, no filtra.
- **Pregunta:** «¿Por qué el paquete al puerto 40009 no llegó a ningún equipo?» Correcta (3.ª): no había ninguna fila para ese puerto, y `router-oficina` no sabía a qué equipo entregarlo. Incorrectas: «Porque NAT es un firewall y bloquea lo que viene de afuera» (confunde traducir con filtrar); «Porque ningún equipo tiene el 40009 abierto» (el paquete no llegó a ningún equipo).
- **Pistas:** (1) un paquete de afuera necesita una fila que diga a qué equipo ir. (2) compara el puerto 3000 con el 40009.
- **Rigor:** un NAT real puede avisar con un ICMP Port Unreachable pasados al menos 6 segundos (RFC 5382 REQ-4), y `nc -w 3` se rinde antes; el texto dice «no lo entrega», nunca «lo bloquea»; «NAT no da seguridad por sí solo» (RFC 4864 §2.2); el reenvío de puertos es una fila fija (RFC 3022 §2). El takeaway dice que lo que decide qué entra es un firewall.

### Bloque 5 · Nombres

**02-10 · Preguntar por un nombre** · `send` con la tarjeta «Ajustes de red» de `tu-laptop` (servidor DNS, solo lectura) · términos: nombre de dominio, DNS, consulta DNS, resolver, UDP, dig, DHCP (apoyo). Denso (siete términos).
- **Mundo:** `addActor` de `servidor-dns` (el resolver, `198.51.100.8`, servicios UDP 53 y TCP 53) y de `servidor-autoritativo` (`198.51.100.53`, zona `lucia.example` con `www` A `198.51.100.50`, TTL 300); `setDnsServer` de `tu-laptop`: `198.51.100.8`. El report nombra a `tu-laptop` («En Ajustes de red de tu-laptop apareció el servidor DNS que le prestó DHCP»). Dibuja `tu-laptop`, `router-oficina`, `servidor-dns`, el globo y `servidor-internet`; el autoritativo espera al 11 porque su término aún no se conoce.
- **Qué viaja:** `dig www.lucia.example` y `ping www.lucia.example` desde `tu-laptop`. El `ping` por nombre manda primero su consulta (un datagrama UDP del equipo a `servidor-dns` y su respuesta) y, cuando la respuesta vuelve, sale el ping. El mapa muestra las dos cosas.
- **Los números (O-2 = A):** si el `dig` es el primer envío, sale del 51514 y se traduce al 40001. El `ping` no tiene puerto, pero su consulta sale del 51515 y deja la fila 51515 → 40002; el ping no deja fila. Si el jugador hace el `ping` primero, la consulta toma el 51514 y el `dig` el 51515: la caja de cada uno dice de qué puerto salió y por qué.
- **La caja de la consulta del `ping`:** la de un datagrama UDP al 53, igual a la de un `dig`: «Consulta DNS», «Respuesta», la fila nueva de la tabla de traducciones. Si el `dig` ya había llenado la caché del resolver, la respuesta de la consulta sale de ella.
- **La caja de `dig`:** «Consulta DNS»: UDP, `192.168.1.10:51514 → 198.51.100.8:53`, un mensaje; «Respuesta»: `198.51.100.8:53 → 192.168.1.10:51514`, `www.lucia.example A 198.51.100.50`; «El resolver buscó la respuesta por ti». La tarjeta «Salida» imprime lo que imprime `dig` (D-5), completo y plegado: a la vista el `status` y la respuesta, y el resto detrás de «Ver las N líneas restantes» (V11 = B).
- **Tareas:** (1) que `dig www.lucia.example` vuelva con `198.51.100.50`; (2) que `ping www.lucia.example` vuelva.
- **Pregunta:** «¿Por qué `dig` no hizo el saludo de tres pasos antes de preguntar?» Correcta (2.ª): usa UDP, que manda cada mensaje suelto, sin abrir una conexión. Incorrectas: «Porque DNS no usa puertos» (la consulta va al puerto 53); «Porque el resolver ya tenía una conexión abierta contigo» (UDP no tiene conexión).
- **Pistas:** (1) compara la caja de este `dig` con la de un `nc` del 02. (2) mira cuántos mensajes hay antes de la respuesta.
- **Rigor:** la consulta «suele» ir por UDP; el servidor también escucha en TCP (RFC 7766 §5) y ninguna consulta del juego lo usa; los nombres de `lucia.example` son ficticios y no existen en el DNS real: `.example` no está delegado en la zona raíz (D-13, verificado el 2026-10-11); DHCP es solo una línea de la tarjeta, sin incidente propio; un `ping` o un `nc` reales mandan dos consultas por el mismo puerto (A y AAAA) y el juego dibuja la del registro A (glibc `resolv.conf(5)`, iputils 20211215 y ncat 7.93, leídos el 2026-10-12), mientras que un `dig` manda una sola; IPv6 no se nombra en pantalla (Review Focus 4) y ningún texto dice que el equipo pregunta «una sola vez».

**02-11 · Los registros** · `send` con la tarjeta «Registros de lucia.example» (editable) · términos: servidor autoritativo, registro DNS, registro A, registro CNAME.
- **Mundo:** `setDns` de `servidor-autoritativo`: `www.lucia.example` A `198.51.100.51` (alguien lo cambió a una IP que nadie tiene) y `blog.lucia.example` A `198.51.100.51`. El report nombra a `servidor-autoritativo`. Dibuja `tu-laptop`, `servidor-dns`, `servidor-autoritativo` y `servidor-internet`.
- **Qué viaja:** `nc` al puerto 80 por nombre y `dig` al alias. El `nc` por nombre manda primero su consulta. Si es el primer envío, la consulta sale del 51514 y deja la fila 51514 → 40001; el `nc` sale del 51515 y se traduce al 40002. Después de cada edición de la tarjeta de registros los números vuelven a empezar (el mundo cambió y los envíos se borran). La caja del `nc` dice por qué no es el 51514: la consulta salió antes.
- **Fichas:** dirección: `www.lucia.example` y `blog.lucia.example`; mensajes: «nc · puerto 80» y `dig`. Tarjeta de registros: Nombre: `www.lucia.example`, `blog.lucia.example`, `lucia.example`; Tipo: `A` y `CNAME`; Valor: `198.51.100.50`, `198.51.100.51` y `www.lucia.example`.
- **Tareas:** (1) que el `nc` a `www.lucia.example`, puerto 80, vuelva (corregir el registro A); (2) que `dig blog.lucia.example` vuelva con `198.51.100.50` por un alias (`answer.alias`).
- **Fallo y causa:** crear el CNAME de `blog.lucia.example` mientras tiene su A, o un CNAME en `lucia.example`, lo rechaza la regla del CNAME y la tarjeta dice por qué: un nombre con un CNAME no puede tener otros registros; la zona ya tiene sus propios registros en `lucia.example`. Antes de corregir, el `nc` por nombre recibe Destination Host Unreachable de un router de afuera, que el mapa no dibuja y el texto no nombra. La consulta vuelve bien y trae la IP equivocada: se ve que el DNS contestó y que el fallo viene después.
- **Pregunta:** «¿Por qué no se pudo crear el CNAME de `blog.lucia.example` mientras tenía un registro A?» Correcta (1.ª): un nombre con un CNAME no puede tener otros registros: o es un alias, o tiene datos propios. Incorrectas: «Porque un CNAME solo puede apuntar a una IP» (invierte la regla: apunta a un nombre); «Porque `blog.lucia.example` no existía» (existía).
- **Pistas:** (1) quita el A de `blog.lucia.example` antes de crear el alias. (2) un alias apunta a otro nombre, no a una IP.
- **Rigor:** RFC 1034 §3.6.2 y RFC 2181 §10.1; el apex de la zona y el Alias de Route 53 son del capítulo 17 y no se nombran en pantalla; el TTL de los registros es 300 s, del juego (decidida 25).

**02-12 · Todavía la vieja IP** · `send` con la tarjeta «Reloj del juego» y la tarjeta «Caché» de `servidor-dns` · términos: caché DNS, TTL de DNS.
- **Mundo:** `setDns` de `servidor-autoritativo`: `www.lucia.example` A `198.51.100.60` (Lucía mudó el sitio); `addActor` de `servidor-nuevo` (`198.51.100.60`, TCP 80 y 443); `setDns` de `servidor-dns`: su caché guarda `www.lucia.example A 198.51.100.50` con 240 segundos de vida (decidida 24). El report nombra a `servidor-autoritativo` y a `servidor-dns`. Dibuja `tu-laptop`, `servidor-dns`, `servidor-autoritativo`, `servidor-internet` y `servidor-nuevo`.
- **Qué viaja:** `dig www.lucia.example` repetido; las fichas «Esperar 1 min» y «Esperar 5 min» de la tarjeta «Reloj del juego» (V16 = C) adelantan el reloj (D-11).
- **La caja:** «Respuesta desde la caché de servidor-dns», «TTL: quedan 240 s»; al vencer, «servidor-dns preguntó de nuevo» y el TTL de la nueva respuesta.
- **Tarea:** que `dig www.lucia.example` devuelva `198.51.100.60`.
- **Pregunta:** «¿Por qué `dig` seguía dando la IP vieja aunque el registro ya había cambiado?» Correcta (3.ª): `servidor-dns` guarda la respuesta en caché hasta que vence su TTL. Incorrectas: «Porque el servidor autoritativo todavía no guardó el cambio» (ya lo había guardado); «Porque el TTL de IP todavía no llegó a 0» (confunde el TTL de DNS, en segundos, con el de IP, que cuenta saltos).
- **Pistas:** (1) mira los segundos que quedan en la caja. (2) espera a que venza la caché y repite `dig`.
- **Rigor:** el TTL es un máximo, no una orden (RFC 2181 §8); el juego lo obedece; el reloj solo corre cuando el jugador espera.

**02-13 · No resuelve** · `send` · términos: NXDOMAIN, SERVFAIL (apoyo), Port Unreachable (apoyo), archivo hosts (apoyo). Cuatro términos y cinco tareas: si la prueba humana lo siente pesado, se parte en «tres fallas» y «la trampa de hosts».
- **Mundo:** `addActor` de `servidor-autoritativo-noticias` (`198.51.100.54`, zona `noticias.example`, caído; el resolver lo conoce en `upstreams`); `setDns` de `servidor-dns` (suma a `servidor-autoritativo-noticias` como autoritativo de `noticias.example`); `setHosts` de `tu-laptop` (una línea: `tienda.lucia.example` va a `198.51.100.50`); `setDnsServer` de `laptop-andres`: `192.168.1.21`, la impresora. El report nombra a `tu-laptop`, `laptop-andres`, `servidor-dns` y `servidor-autoritativo-noticias`. Dibuja `tu-laptop`, `laptop-andres`, `impresora`, `servidor-dns`, `servidor-autoritativo`, `servidor-autoritativo-noticias` y `servidor-internet`.
- **Qué viaja:** desde `tu-laptop`, `dig` de `noexiste.lucia.example`, de `www.noticias.example` y de `tienda.lucia.example`, y `ping tienda.lucia.example`; desde `laptop-andres`, `dig www.lucia.example`.
- **Tareas:** (1) `dig noexiste.lucia.example` da NXDOMAIN (`status`); (2) `dig www.noticias.example` da SERVFAIL; (3) `dig tienda.lucia.example` da NXDOMAIN; (4) `ping tienda.lucia.example` vuelve; (5) el `dig` de `laptop-andres` recibe Port Unreachable de la `impresora` (`unreachable`, `by` impresora).
- **Pregunta:** «`dig tienda.lucia.example` dice NXDOMAIN, pero `ping tienda.lucia.example` llega. ¿Por qué?» Correcta (2.ª): `ping` resuelve con el sistema, que lee primero el archivo hosts; `dig` pregunta directo al DNS y no lo lee. Incorrectas: «Porque `ping` usa otro resolver» (el resolver es el mismo; la diferencia es el archivo); «Porque `dig` está roto» (hace lo que debe).
- **Pistas:** (1) el archivo hosts es del dispositivo, no del DNS. (2) fíjate en cuál de los dos comandos lo lee.
- **Rigor:** NXDOMAIN se demuestra con un subdominio inexistente de `lucia.example` y no con `.invalid` (D-13); `dig` no lee hosts **[local]**; qué hace Amazon Linux no se verificó; el aviso del resolver sin servicio sale como «connection refused» en `dig` (D-5, spec «Sin verificar»).

### Bloque 6 · La guardia

**02-14 · Guardia: «no conecta»** · `diagnose` con reparación en el caso 5 · sin términos nuevos (D-12).
- **Mundo:** el del 13 más los cambios de cada caso (cada caso es un cambio sobre ese mundo y no sobre el del caso anterior); cada caso dibuja solo las piezas que usa (`shown` por caso). Un caso que manda por nombre dibuja también `servidor-dns`, que es adonde va la consulta (O-2 = A). El report del 14 dice una vez qué cambió antes de empezar, si algo cambia.
- **Qué viaja:** lo que el jugador elija; el primer caso muestra además la secuencia de tres pruebas en orden: ¿resuelve el nombre (`dig`)?, ¿hay ruta (`ping`)?, ¿contesta el puerto (`nc`)? En el caso 1, por nombre y en ese orden, los números son: `dig` 51514 → 40001, consulta del `ping` 51515 → 40002, consulta del `nc` 51516 → 40003 y `nc` 51517 → 40004. En el resolver quedan tres sellos (el del `dig` y los de las dos consultas). O-4 midió el pasillo del 02-03; el resolver es otro lugar y no se midió, así que este caso es el que lo prueba. Si el jugador prueba el `ping` o el `nc` por la IP que dio el `dig`, no hay consulta.
- **Éxito:** nombrar la causa de cada caso; en el 5, también arreglar el bucle con la tarjeta de rutas de `router-proveedor` (quitar la ruta `0.0.0.0/0` hacia `router-oficina` y poner `198.51.100.0/24` hacia `router-destino`) hasta que el ping al servidor vuelva. En ese caso se dibuja `router-destino`, porque los chips de la reparación lo nombran. Pistas y reporte por caso.

| Caso | Reporte y origen | Qué enseña la evidencia | Causa | Opciones incorrectas (error que reflejan) |
|------|------------------|--------------------------|-------|-------------------------------------------|
| 1, guiado | «Tu `nc` a `www.lucia.example`, puerto 80, no conecta»; origen `tu-laptop`; el sitio de `servidor-internet` escucha ahora solo en `127.0.0.1` | La prueba 1 resuelve, la 2 vuelve, la 3 es rechazada (RST) | El servicio escucha solo en `127.0.0.1` | «El nombre no resuelve» (la prueba 1 volvió); «Un firewall descarta el paquete» (un firewall callaría; aquí llegó un RST) |
| 2 | «Tu `nc` a `wwww.lucia.example`, puerto 80, no conecta»; origen `tu-laptop` | La consulta sale y vuelve con NXDOMAIN; el `nc` se queda en la puerta y nada sale hacia el servidor | El nombre está mal escrito y no existe | «El servidor no contesta en el puerto 80» (nunca llegó a resolver); «`router-oficina` perdió una ruta» (el `nc` no llegó a salir y la consulta sí volvió) |
| 3 | «`ping tienda.lucia.example` no vuelve, pero `dig tienda.lucia.example` da `198.51.100.50`»; origen `tu-laptop`; su hosts apunta a `198.51.100.70` y `servidor-autoritativo` tiene ahora un registro A de `tienda.lucia.example` a `198.51.100.50` (el report nombra a los dos) | `dig` da la IP buena; el ping va a otra y recibe Destination Host Unreachable | Una línea vieja en el archivo hosts de `tu-laptop` | «El resolver tiene la respuesta vieja en caché» (`dig` da la buena); «`servidor-internet` está caído» (la IP buena sí contesta) |
| 4 | «Ningún ping de `tu-laptop` sale de la oficina»; `router-oficina` solo conserva la ruta a `10.0.0.0/16` | El ping al servidor recibe Destination Net Unreachable desde `192.168.1.1`; el de `10.0.0.10` vuelve | Falta la ruta por defecto en `router-oficina` | «`servidor-internet` está caído» (el aviso viene del router, no del servidor); «El firewall de `tu-laptop` no deja salir» (el paquete salió y el router avisó) |
| 5 | «Ningún ping de `tu-laptop` a `servidor-internet` vuelve»; origen `tu-laptop`, con ping, traceroute y TTL 1, 2 y 3; `router-proveedor` devuelve todo lo que recibe a `router-oficina` | Time Exceeded desde dos routers que se alternan; traceroute repite las IP | Un bucle entre dos routers por la configuración de `router-proveedor` | «`servidor-internet` está sobrecargado» (el aviso viene de un router, no del servidor); «`router-oficina` descarta lo que va al servidor» (lo pasa al proveedor, que se lo devuelve) |
| 6 | «Tu `nc` al puerto 3000 de `laptop-lucia` no conecta»; origen `tu-laptop` | El `nc` al 22 vuelve y el del 3000 no recibe nada | El firewall de `laptop-lucia` no deja entrar el 3000 | «Nadie escucha en el 3000» (daría un rechazo, no silencio); «La app escucha solo en `127.0.0.1`» (daría un rechazo) |
| 7 | «`dig www.lucia.example` desde `laptop-andres` no obtiene respuesta»; origen `laptop-andres` | Port Unreachable de la `impresora`, que es su servidor DNS | El servidor DNS de `laptop-andres` es la impresora, que no tiene servicio DNS | «El nombre no existe» (daría NXDOMAIN); «`servidor-autoritativo` está caído» (daría SERVFAIL, desde el resolver) |

La correcta va en la posición 2.ª en el caso 1, 3.ª en el 2, 1.ª en el 3, 3.ª en el 4, 1.ª en el 5, 2.ª en el 6 y 3.ª en el 7. Los siete casos tienen causas distintas. Cada reporte nombra el ping, el `nc` o el `dig` que no vuelve y ningún verbo de la web («abrir», «cargar»).

**Revisión de las opciones.** Las tres opciones de cada caso quedan equilibradas para que la correcta no sea la más larga, y ninguna opción dice que un equipo está apagado (el capítulo 1 lo decidió y sigue valiendo).

## Cambios visibles del capítulo 4

Lo que ve quien juega el 04-01 y el 04-02 con este plan. Las trazas y el test dorado no cambian.
- **Glosario más largo.** Antes de pisar el capítulo 4 el jugador conoce 91 términos (38 del capítulo 1 y 53 de este).
- **`cidr`, `dns` y `nat` dejan de esperar al capítulo 4.** Los presenta el capítulo 2 (04, 10 y 08). El 04-01 y el 04-02 no los presentaban; cuando se escriban el 04-03 a 04-08, no los marcarán «nuevo».
- **`nat` cambia de definición** y ya no nombra al Internet gateway. Es amplia y cubre el NAT uno a uno; el motivo `route-nat` del capítulo 4 sigue diciendo lo mismo.
- **El 04-01 se abre con el 02-14** (hoy, con el 01-14). Quien ya ganó una estrella en el 04-01 lo conserva abierto.
- **Un campo «Servicios» en la caja de `servidor1` y `servidor2`** («SSH · TCP 22 · escucha en todas las IPs»; `ssh` ya es un término). Es lo que muestran todos los dispositivos (decidida 20).
- **Los textos del puerto cerrado** (`host-refused`) usan los términos del capítulo 2 si la traza llega a esa línea; en el 04-01 y el 04-02 no llega porque sus reglas son ICMP. El texto llano es el mismo y solo aparecen las marcas de los términos; por eso cambia a propósito una aserción de `reasons.test.ts` (el caso `host-refused` de `CASES`, Tarea 16).
- **Las capturas de `#/entidades` cambian** en las Tareas 17, 18, 18 bis, 21 y 28 quinquies (el especimen de `Table`, el de la tarjeta «Salida», los de avisos y errores, los de los paquetes de TCP y UDP, los del intruso, el contorno del bloque y los de «+N»), no por algo más del capítulo 4.
- **Las etiquetas del capítulo 4 no cambian por V15 = B.** Ninguna tiene hoy un segundo botón: solo un incidente `send` ofrece ajustes (`settingsDeviceIds` queda vacía para cualquier otra mecánica) y el 04-01 y el 04-02 son `filter`. Cada pieza del capítulo 4 abre una sola tarjeta (la del firewall, con sus pestañas «Entrada» y «Salida» de siempre), así que no lleva pestañas nuevas.
- **Con el estándar de avisos y errores (V18 = A, aspecto «Pestaña»), cuatro mensajes del 04-01 y el 04-02 cambian de apariencia, no de texto, de rol ni de comportamiento:** el aviso de intruso de Lucía («¡Algo raro está entrando!»; hoy, texto en negrita en el color de peligro y sin marco), su respuesta a una solución rechazada («Todavía no se cumple: …» y «Además, algo prohibido está entrando.»; hoy, un marco punteado en el color de peligro) y la retroalimentación de la pregunta de Lucía, que es `error` si la opción es incorrecta («No es eso.» …; hoy, la línea `feedback--wrong`) y `success`, en verde, si es la correcta («Correcto.»; hoy, la línea `feedback`). Cada uno lleva su pestaña («✕ ERROR», «✓ CORRECTO»). Los avisos de la red (el paquete de aviso, el sello «!» y las frases de la caja de inspección) no cambian.
- **El paquete de un intruso cambia de forma (V19 = B).** El atacante del 04-01 y el 04-02 era un rombo rojo; pasa a ser la forma del ping (el punto o el anillo, según sea pedido o respuesta) con el borde rojo de intruso. Es la regla de todo paquete: la forma dice el protocolo y el borde dice el papel. Cambian el mapa, el catálogo y el ícono de la caja de inspección; no cambian el texto ni el comportamiento. Se regraba la captura de piezas de `#/entidades` en la Tarea 21 (y la de la interfaz solo si el catálogo gana una fila: `DESIGN.md`, «Adding a variant instead of a new element», paso 3).
- **El campo «Conexión» no se ve cambiar en el capítulo 4.** D-8 lo renombra «En la red» en las cajas de oficina (capítulos 1 y 2), pero la caja de un dispositivo de una VPC no tiene ese campo (`src/game/view/CLAUDE.md`; prueba `shows the connection of a device only in an office and once the term network is known`).
- **Los sellos de un mismo lugar se montan en abanico (O-4 = G).** El 04-01 y el 04-02 dibujan siempre dos envíos vivos y los dos terminan en `servidor2`, en su puerta o en su Security Group (por medir): los dos sellos pasan de 43 px de paso a 25 y cada uno tapa 7 px del aro del otro, a la altura de su punto (decidida 54). El signo se ve entero. No cambia ningún texto, ningún comportamiento ni el tamaño del mapa. Se regraba la captura de piezas de `#/entidades` por el especimen nuevo «+N» (Tarea 28 quinquies); «+N» no aparece en el 04-01 ni en el 04-02 (por medir).
- **Un campo «Nombres DNS» en la caja de una instancia (02-10).** `dns` deja de esperar al capítulo 4 y el 04-01 y el 04-02 lo conocen desde el 02-10, así que la caja de una instancia de la VPC lista «Nombres DNS», un campo que no mostraba. No cambia ningún texto ni ninguna traza; cambia a propósito la prueba `incident-screen.test.tsx` › `the inspection box starts with what the piece is and leaves out fields whose term comes later` (Tarea 29), y está en la lista de «Global Constraints».
- **Sin cambios de comportamiento:** el código de `04-iaas/shared.ts` cambia mecánicamente (`listeningTcpPorts` pasa a `services`), el test dorado no se edita y la batería de sondas no se toca.

**Cambio visible del capítulo 1 (D-8 = A, decidida el 2026-10-11):** el campo «Conexión» de la caja de un dispositivo de oficina se llama «En la red», en todo incidente de oficina de los capítulos 1 y 2. No cambia nada más (el valor del campo, «Conectado a la red.» o «No está conectado: no forma parte de la red.», es el mismo). Las pruebas que cambian están en «Global Constraints».

**Cambios visibles del capítulo 1 por las decisiones del 2026-10-11:**
- **V15 = B, solo en el 01-07.** Hoy la etiqueta de `tu-laptop` tiene dos botones: «tu-laptop», que abre «Terminal de tu-laptop», y debajo «Ajustes de red de tu-laptop» (`SETTINGS_TEXT.entry`, con el id de DOM `piece-settings-your-laptop`), que abre la tarjeta con ese título. Pasa a tener un solo botón, «tu-laptop», que abre una tarjeta con dos pestañas: «Terminal», que abre primero (como hoy, el jugador manda ahí el ping) y «Ajustes de red», el nombre que el reporte y las pistas del 01-07 ya usan y que no cambian. El título de la tarjeta abierta sigue siendo el de la pestaña elegida («Terminal de tu-laptop» o «Ajustes de red de tu-laptop»). El segundo botón desaparece. En los demás incidentes del capítulo 1 cada pieza tiene un solo botón y una sola tarjeta (terminal, firewall o ficha de identificación): no lleva pestañas y no cambia.
- **Estándar de avisos y errores (V18 = A, aspecto «Pestaña»).** El aviso de intruso, la respuesta de Lucía a una solución rechazada y la retroalimentación de una ficha o de una opción (01-01 y los incidentes con firewall y con pregunta) cambian de apariencia, no de texto, de rol ni de comportamiento: la incorrecta es `error` («✕ ERROR»), la correcta es `success`, en verde («✓ CORRECTO»).
- **El paquete de un intruso (V19 = B).** En los incidentes con un flujo prohibido del capítulo 1, el rombo rojo del intruso desaparece: el paquete es la forma del ping (el punto o el anillo) con el borde rojo de intruso. Cambian el mapa, el catálogo y el ícono de la caja; no cambian el texto ni el comportamiento. La Tarea 21 regraba la captura de piezas por esta razón. La Tarea 18 bis los lista y su captura los muestra.
- **Los sellos de un mismo lugar se montan en abanico (O-4 = G, 2026-10-12).** Donde 2 o más sellos terminan juntos (lista exacta en el cuerpo del commit de la Tarea 28 quinquies), pasan de 43 a 25 px de paso, cada uno a la altura de su punto (decidida 54). Si no caben entre las etiquetas vecinas, los que sobran se cuentan en un «+N» que abre la lista en la caja de inspección. Ningún texto de los incidentes cambia.

## Review Focus

Cada riesgo, con la prueba que lo guarda.

1. **El capítulo 4 no cambia.** Test: `chapter 4 golden traces keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model` (el de hoy, sin tocar) y, en las Tareas 4 a 13, `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Pruebas nuevas: `the new trace fields are absent from every trace of a VPC` y `the ICMP branch of the host stage keeps every field it had`.
2. **El capítulo 1 no cambia.** Sus pruebas corren sin editarse en cada tarea de motor, en particular `the trip out of the office has no step and no reason that names NAT or the public IP`, `a private address is dropped by the first router outside the office, with no warning` y las de `steps` con `toEqual`. Prueba nueva: `the pings of chapter 1 give the same outcome, hops and times in the world chapter 2 starts from`. La nota del encabezado sigue en sus incidentes: `01-08 still says the header changes outside the office and does not name NAT`. Las únicas pruebas que se reescriben a propósito están en «Global Constraints» (V15 = B en la Tarea 19, la Tarea 18 bis y V12 = B en la Tarea 21).
3. **Los 53 términos, cada uno en su incidente.** Tests: `introduces exactly the 53 terms of the approved design, each in its incident` y `no term of the approved design is missing: the ids of the table of the spec equal the ids that 02-01 to 02-14 introduce` (Tarea 22 en adelante, ampliado en cada bloque); `cidr, dns and nat are introduced by chapter 2 and by no incident of chapter 4`; `defines its new terms without naming a term the player does not know yet` (el de hoy, sobre los 53); `registers the 50 new ids of chapter 2 and rewrites cidr, dns and nat` (Tareas 2 y 2 bis, que la renombró) y `every definition of chapter 2 names only terms that are known at its incident, in the approved order` (Tareas 2 y 2 bis).
4. **Nada de lo que viene después.** Test: `names no topic of the chapters that come later, in any text of chapter 2` (HTTP, HTTPS, TLS, certificado, URL, stateful, stateless, NACL, subnet, Route 53, Alias, IPv6, ARP, MAC, VPN). Ningún texto de un incidente nombra, con palabras corrientes, un término que presenta uno posterior del capítulo (`a text of an incident names no term that a later incident of chapter 2 introduces`, Tarea 22); para los incidentes del 01 al 09, ningún texto nombra UDP, DNS ni dig antes del 10; la salida literal de una herramienta es la excepción declarada (D-5) y la fija un test; con `ncat`, la de `nc` ya no la necesita, porque no nombra ningún término posterior.
5. **La respuesta no se bloquea, y ningún texto dice por qué.** Tests: `the reply of a tcp connection is never stopped by a firewall, outbound or inbound` (Tarea 6), `the reply of a udp datagram is never stopped by a firewall, outbound or inbound` (Tarea 7), `the reply through a translation gives no reason beyond its row` (Tarea 10) y `no text says stateful or gives a reason for a reply to come back` (Tarea 16).
6. **Cada cambio de mundo se nombra.** Test: `every change to the world of an incident is explained by naming the device or router it changes` (el de hoy, sin cambiar su nombre; la Tarea 3 lo amplía a servidores con `every change to a server of the internet is explained by naming it`), `a router interface that faces a piece added by the same action is not a configuration change` y `02-07: the report names router-oficina and no router of the provider that the map does not draw`.
7. **Silencio, rechazo y aviso no se confunden.** Tests: `a tcp port nobody listens on answers with a reset and a firewall that drops answers with nothing` (Tarea 6), `a udp port nobody listens on answers with Port Unreachable` (Tarea 7), `a service on the loopback address accepts only a packet to 127.0.0.1` y `a service on the loopback address refuses a packet to the IP of the device on the network` (Tarea 6; la primera, tras su seguimiento del 2026-10-11), `a router with no route that covers the destination warns Destination Net Unreachable` y `with only a default route, a private destination is dropped by the provider with no warning, as in chapter 1` (Tarea 9).
8. **El puerto de origen y el saludo.** Tests: `the first connection of a device leaves from 51514 and each new one adds one`, `the reply header swaps the ports` y `an accepted tcp connection lists SYN, SYN-ACK and ACK`.
9. **El prefijo más largo.** Tests: `the longest prefix wins and the trace lists the routes that also covered the destination` y `rejects a router table with two routes to the same destination`.
10. **El NAT.** Tests: `two laptops with the same source port get two public ports in one table`, `the same private ip and port reuse its row towards any server`, `a packet from outside with no translation is not delivered to any device`, `a fixed forward delivers to the device it names and nothing filters it` y `the link to the other office is not translated`.
11. **El DNS.** Tests: `dig does not read the hosts file and ping does`, `a name with a cname cannot hold another record`, `the resolver answers from its cache until the time to live runs out`, `an authoritative server that fails makes the resolver answer SERVFAIL` y `a resolver with no service on port 53 answers Port Unreachable`.
12. **Pureza.** Tests: `gives the same traces for the same sends` (Tarea 5), `a move that changes the world clears the sends and keeps the clock` (Tarea 15) y la regla de lint de `pure-domain-core`, que prohíbe leer el reloj o un número al azar en el motor (`pnpm lint`).
13. **Las salidas de las herramientas son fieles a su fuente.** Tests: `every line nc prints matches the format of ncat_connect.c of Nmap 7.93`, `every line dig prints matches the format of dig.c and dighost.c of BIND 9.18`, `a timeout prints no line that the source cannot confirm` (Tarea 18) y `the text of a warning quotes no operating system and says only what the player saw` (Tarea 16). Cada uno cita su fuente y su fecha.
14. **Un mapa con más piezas no se amontona.** Tests de Playwright (Tarea 34): `in 02-07 the map and its labels fit the area at full size`, `in 02-09 and 02-10 no label or stamp overlaps` y `the cards of tables, output and services cover no piece of the map`, a 1280×800 y a 1440×900. Con O-4 = G, «no label or stamp overlaps» quiere decir: ninguna etiqueta, nombre o etiqueta de paquete pisa a otra cosa, y dos sellos del mismo abanico solo se tapan lo que mide el abanico (la tolerancia está en `tests/e2e/map-boxes.ts`).
15. **Las capturas cambian solo lo que se quiso** (Tareas 17, 18, 18 bis, 21 y 28 quinquies): el diff muestra solo los especímenes nuevos o rehechos; `entities` de Playwright pasa después.
16. **Carpetas y primitivas.** `pnpm structure` pasa en cada tarea; el tope de 12 no se rompe; las únicas primitivas nuevas son `Table` y la de avisos y errores (Tarea 18 bis), y no nace ningún hermano (`DESIGN.md`).
17. **Los casos del 14 se cuentan bien.** Tests: `the middle star is no hint asked in any case`, `the explained star needs every cause right at the first try`, `02-14: each case starts from the world before the incident plus its own changes, not from the case before` (Tarea 33) y `the case closes only when the cause is named and the tasks of its fix hold` (Tarea 20).
18. **Rigor, sin simplificar a lo falso.** Ninguna opción, recomendada o no, enseña algo inexacto. Tests: `02-05: every port range chip that opens more than 22 is caught by the probe battery`, `the text of an unsolicited packet says it is not delivered and never that NAT blocks it`, `the glossary says a port goes from 1 to 65535`, `the well-known ports go from 0 to 1023 and the definition names neither 3306 nor 5432`, `the default port lists 22, 80, 443, 3306 and 5432 and says it is a custom`, `no text gives a range of ephemeral ports as a number` y la lectura del estudiante en cada prueba humana.
19. **Ejemplos de documentación.** Test: `every public address of chapter 2 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
20. **Texto llano.** La comprobación es el revisor de cada bloque (`sonnet`, antes de pasar al siguiente) y la prueba humana del capítulo entero, una sola: el estudiante juega los catorce y dice si algún mensaje lo pierde.
21. **Un solo estándar para los avisos y los errores.** Tests: `every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it`, `each variant of Message is told apart by a mark or a border shape and not only by colour` `success and error differ by their word and mark, not only by colour` y `takes no className and no style` (Tarea 18 bis); `a rejected entry shows its problem as an error message under the table, in a status region that was already there` (Tarea 19). La guarda es de DOM renderizado y no de CSS ni de lint (`DESIGN.md`, «What guards the standard»).
22. **Una pieza, un botón, una tarjeta con pestañas.** Tests: `a label draws one button however many cards its piece has` (el 01-07 incluido), `a piece with one card opens it with no tabs` y `switching tabs keeps what was picked in the terminal and the lines unfolded in its output` (Tarea 19).
23. **Una regla para todo paquete (V19).** La forma dice el protocolo y un borde rojo de intruso dice el papel. Tests: `every protocol has an intruder version with the intruder border`, `no packet is drawn as a rhombus` y `the packet of an intruder has the shape of its protocol and the intruder border` (Tarea 21).
24. **El 04 sin que viaje nada se dibuja y se contesta (D-6).** Tests: los de la tarjeta de clasificar y del contorno, repartidos en las Tareas 14, 15, 19, 21 y 26 (lista en la Tarea 26, «Lo que el 04 pide al código»).
25. **Pruebas deterministas y chequeo rápido (Tarea 19 bis).** Una prueba de layout o de tiempos da el mismo resultado en cada corrida, y el chequeo de cada tarea es corto sin perder rigor. Tests: `no e2e test waits a fixed time`, `a box is measured only once the scene stands still`, `the port of the e2e server is derived from the path of the repo and stays in 4183-4282` y `check runs check:fast and then the e2e suite, and check:fast runs every step check had except the e2e suite`; y la aceptación con `--repeat-each`. Sin `retries`, sin esperas fijas y sin `skip` ni `fixme` para tapar un fallo.
26. **La caja de inspección nunca tapa una tarjeta abierta.** Tests: `a card beside a piece keeps its foot in reach right after the click, in a low or narrow window`, `the inspection box covers no card of the map, right after the click and at rest, in a low or narrow window`, `takes the left place when the card touches the right one` y `has no place when the card touches both` (Tarea 28 bis).
27. **Un router sin ruta no se llama «Host» mientras no se conozca `net-unreachable`.** Tests: `a router with no route is said in plain words on 01-08 after chapter 2 too, and named Destination Net Unreachable only with the term` (`ladder.test.ts`) y `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded, and a router with no route by none until net-unreachable is known` (`terms.test.ts`) (Tarea 28 ter).
28. **Los sellos de un lugar no se pisan con nada y ninguno se pierde en silencio (O-4 = G).** Tests: `a place whose stamps all fit draws every stamp, 25 px apart along the screen and centered on the place`, `a place whose stamps do not fit draws the casillas that fit less one, and the last casilla is a «+N» that counts the rest`, `a stamp with a problem stays in sight while a stamp with no problem can go into «+N»`, `the list of a «+N» holds every stamp of the place, the drawn ones too`, `in 02-03 the three stamps of laptop-lucia stand in a fan 25 px apart and no «+N» is drawn`, `in 02-03 a fourth stamp at laptop-lucia turns the last casilla into «+2», and hovering it lists the four`, `in 02-05 no piece label, floor name, stamp or packet label of the still map overlaps another`, `in 02-08 no piece label, floor name, stamp or packet label of the still map overlaps another after two nc and a ping`, `the model of the width of a label is never under the width the browser gives it and is at most 4 px over, in 02-03, 02-05 and 02-08` y el centinela `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»` (Tarea 28 quinquies).

## Árbol al terminar (solo lo cambiado)

- `README.md` · `DESIGN.md` (la tarjeta «Salida» con su plegado, `Table`, el estándar de avisos y errores, la tarjeta con pestañas de cada pieza —la etiqueta ya no lleva un segundo botón— y la nueva estructura de `src/design/primitives/`, aprobada el 2026-10-11, el verde de `success` en la paleta y las formas del intruso)
- `docs/` (raíz del repo)
  - `specs/2026-10-11-follow-the-packet-chapter-2-design.md`
  - `plans/2026-10-11-follow-the-packet-chapter-2.md` · `plans/follow-the-packet-roadmap.md` · `plans/2026-10-08-follow-the-packet-followups.md`
  - `research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 2)
- `src/design/`: `tokens.css` y `tokens.test.ts` (el verde de `success`); `primitives/`: `message.tsx` y `message.test.tsx` (nuevos, Tarea 18 bis, V18 = A), `primitives.css`; `primitives/panels/` (nueva, con su `CLAUDE.md`; mudanza aprobada el 2026-10-11): `card`, `tabs` y `table` (nuevo, D-3 A) con sus tests
- `src/engine/`
  - `index.ts`
  - `network/`: `schema.ts`, `types.ts`, `actions.ts`, `services.ts` (nuevo) y sus tests; `addressing/` (nuevo: `cidr`, `topology` y `routing`, mudados, y `routing-table.ts`); `naming/` (sin cambios); `CLAUDE.md`
  - `nat/` (nueva): `translation.ts`, `forwards.ts` y sus tests
  - `dns/` (nueva): `records.ts`, `resolve.ts`, `cache.ts`, `hosts.ts`, `question.test.ts` (Tarea 28 quater) y sus tests
  - `simulation/`: `simulate.ts`, `sequence.ts` (nuevo), `trace.ts`, `context.ts`, `ports.test.ts` y `routing-table.test.ts` (nuevos); `paths/` (nueva: `routers.ts`, `traceroute.ts`, `checkpoints.ts` y sus tests, mudados); `stages/`: `host.ts`, `route.ts`, `forward.ts`, `dns.ts`, `reply.ts`, `nat.ts` (nuevo) y `port.ts` (nuevo, Tarea 28 quater); `CLAUDE.md`
  - `exposure/exposure.test.ts`
- `src/copy/`: `terms.ts`, `reasons.ts`, `packet-labels.ts` y sus tests; `tools/` (nueva: `nc-output.ts` y `dig-output.ts` con sus tests); `screens/`; `CLAUDE.md`
- `src/levels/`
  - `world.ts` y su test; `contract/`: `incident.ts`, `chips.ts`, `changes.ts` y sus tests; `ladder.test.ts`, `registry.test.ts`, `explained-changes.test.ts`
  - `04-iaas/shared.ts` (el cambio mecánico de `services`)
  - `02-ports-and-names/` (nueva): `shared.ts`, `CLAUDE.md`
    - `who-listens/`: `01-one-machine-many-services.ts`, `02-opening-a-connection.ts`, `CLAUDE.md`
    - `ports-and-rules/`: `03-refused-or-silent.ts`, `04-is-it-in-my-block.ts`, `05-the-whole-rule.ts`, `CLAUDE.md`
    - `which-way/`: `06-your-routing-table.ts`, `07-a-way-to-the-other-office.ts`, `CLAUDE.md`
    - `one-address/`: `08-one-address-for-the-whole-office.ts`, `09-from-outside.ts`, `CLAUDE.md`
    - `names/`: `10-asking-for-a-name.ts`, `11-the-records.ts`, `12-still-the-old-ip.ts`, `13-it-does-not-resolve.ts`, `CLAUDE.md`
    - `on-call/`: `14-on-call-it-does-not-connect.ts`, `cases.ts`, `CLAUDE.md`
- `src/game/`: `session.ts`, `flow-runs.ts`, `tasks.ts`, `chapter-2.test.ts` (nuevo), `index.ts`, `CLAUDE.md`
  - `view/`: `pieces.ts`, `piece-id.ts`, `inspection.ts` y sus tests (`piece-id.ts` e `inspection.ts` suman el caso `stamps`, Tarea 28 quinquies)
  - `view/cards/`: `settings-card.ts` (ahora también servicios y DNS), `table-card.ts` y `piece-card.ts` (nuevos: la tarjeta de una pieza con sus pestañas) y sus tests; `terminal/` (nueva: `terminal-card.ts`, `traceroute-lines.ts` y `output-card.ts`, con sus tests); `identify/` (nueva: `classify-card.ts` y su prueba, D-6); `CLAUDE.md`
- `src/scene/`: `layout.ts`, `game-scene.tsx`; `entities/` (`device.tsx`, `packet.tsx` —sin rombo, con el borde del intruso—, `entity-icon.tsx`); el contorno del bloque (D-6); `overlay/piece-label.tsx` (sin segundo botón); `traffic/flow-look.ts`; `catalog/catalog-cells.tsx`; `marks/` (nueva, con su guía): `spread.ts` (mudado de `layout.ts`), `stamp-fan.ts` y `label-width.ts` con sus pruebas (Tarea 28 quinquies); `entities/stamp.tsx` (la variante «+N») y `stamp.test.tsx`
- `src/ui/incident/`: `stamp-fan.test.ts` (el centinela de la Tarea 28 quinquies), `inspection-box.tsx`, `clock-card.tsx` (nuevo: «Reloj del juego»), `lucia-card.tsx` y `explanation-card.tsx` (usan el estándar de avisos); `map-cards/`: `table-card.tsx` y `piece-card.tsx` (nuevos), `settings-card.tsx`, `identify-card.tsx`, `identify/` (nueva: `classify-card.tsx` y su prueba, D-6); `terminal/` (nueva: `terminal-card.tsx` mudada, `output-card.tsx` nuevo, con sus tests)
- `src/ui/catalog/interface-section.tsx` (los especímenes de `Table`, de «Salida» y de avisos y errores)
- `src/ui/notice-page.tsx` y `src/styles.css` (los avisos y errores pasan a la primitiva: salen `.feedback`, `.feedback--wrong`, `.lucia__alert` y la regla `.lucia__reply p`)
- `src/testing/`: `fixtures.ts`, `incidents.ts`
- `tests/e2e/`: `chapter-1/` (nueva: `chapter-1.spec.ts` y `chapter-1-play.ts`, mudados), `chapter-2/` (nueva: `chapter-2.spec.ts` y `chapter-2-play.ts`), `saved-progress.ts`, `entities.spec.ts`, `card-layout.spec.ts` (si hace falta), `map-boxes.ts` (el ayudante de solapes: deja pasar sello con sello del mismo abanico, Tarea 28 quinquies), `snapshots/` (dos capturas, regrabadas en las Tareas 17, 18, 18 bis, 21 y 28 quinquies); el ayudante de la escena quieta (Tarea 19 bis)
- `playwright.config.ts` (el puerto por worktree) · `package.json` (solo `scripts`: `check:fast`) · `eslint.config.js` (sin esperas fijas en `tests/**`) · `scripts/` (`e2e-port.ts`, `e2e-port.test.ts` y `package-scripts.test.ts`; Tarea 19 bis)

---

## Tareas

Cuarenta y tres tareas (0 a 35, más la 2 bis, que va entre la 2 y la 3, la 18 bis, que va entre la 18 y la 19, la 19 bis, que va entre la 19 y la 20, y las 28 bis, 28 ter, 28 quater y 28 quinquies, que van en ese orden después de la 28). Cada una: propósito, archivos, interfaces, tests con nombre, Review Focus, cierre y commit. El orden es el de ejecución, salvo que la 19 bis se ejecuta antes de retomar la 19, que quedó en pausa. Una tarea de contenido no empieza hasta que la anterior dejó en verde su chequeo de «Listo» y, al cerrar un bloque, su revisor terminó y sus correcciones se aplicaron.

### Tarea 0: Prototipos y decisiones del estudiante (sin código del juego)

**Bloqueaba:** las Tareas 2 (D-7), 14 y 15 (D-2 y D-11), 17 y 19 (D-3), 18 (D-4 y D-5), 21 (D-9 y D-10), 26 (D-6) y 33 (D-12). Todas esas decisiones están contestadas (2026-10-11). La Tarea 1 y las de motor (3 a 13) no dependen de ninguna decisión visual; cada una comprueba D-1. Es la única tarea sin código del juego.

Propósito: que el estudiante vea, renderizadas, las opciones visuales y conteste las decisiones abiertas (17 al empezar; D-18 se abrió el 2026-10-11, después de la Tarea 0, y también se contestó).

**Archivos:**
- Modify: este documento (pasa las decisiones tomadas a una sección «Decisiones del estudiante» y escribe las visuales en «Decisiones visuales», al final, como hizo el capítulo 1), `../../docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md` (las decisiones D-5, D-6, D-8, D-13, D-15 y D-18, el SOA y los 53 términos) y `../../docs/plans/follow-the-packet-roadmap.md` (suma la fila del capítulo 2 en catorce, en `en curso`).
- Fuera del repo: una página HTML de prototipos, publicada con la herramienta Artifact. Muestra, con las primitivas reales (colores y tokens de `DESIGN.md`, estilo B) y nunca con dibujos de texto:
  - **V10 · La tabla (D-3):** la tabla de rutas de `router-oficina`, la de traducciones, los registros de la zona y la caché, en una `Table` y en filas de texto.
  - **V11 · La tarjeta «Salida» (D-4):** una línea de `nc` y diez de `dig`, en la tarjeta de traceroute generalizada y en una tarjeta de aspecto de terminal.
  - **V12 · El paquete con puerto (D-9):** las tres opciones en el mapa del 02-02 y el 02-08.
  - **V13 · La traducción a la vista:** la etiqueta del paquete cambia al cruzar `router-oficina` (a) o solo cambia la caja con sus dos encabezados (b).
  - **V14 · Los servidores de nombres (D-10):** como piezas del mapa y sin dibujar, en el 02-10.
  - **V15 · Las entradas de la etiqueta:** una etiqueta con «Ajustes de red», «Servicios de laptop-lucia» y una tabla.
  - **V16 · El reloj (D-11):** las fichas «Esperar» en la terminal o dentro de la tarjeta de la caché.
  - **V17 · El rechazo del CNAME:** la tarjeta de registros cuando el motor rechaza una entrada (una línea bajo la tabla, o un sello).

**Pasos:**
- [x] Preparar la página de prototipos y mostrársela al estudiante.
- [x] Recoger V10 a V17.
- [x] Recoger la respuesta a D-1 a D-18 (las que no son visuales se contestan leyendo la sección «Decisiones abiertas»).
- [x] Si alguna respuesta cambia el plan (por ejemplo D-2, D-3, D-9, D-11 o D-15), reescribir las tareas que toca antes de seguir.
- [x] Escribir las elecciones en «Decisiones visuales» y pasar las decisiones a «Decisiones del estudiante».
- [x] Sumar la fila del capítulo 2 en catorce al roadmap, en `en curso`.

Las dos decisiones visuales que se abrieron después, V18 (la primitiva `Message`, su aspecto y el color de `success`; Tarea 18 bis) y V19 (la forma del intruso; Tarea 21), no son de esta tarea y también están decididas (2026-10-11).

**Cierre:** de esta tarea solo cambian los tres documentos (este plan, el spec y el roadmap; el resto de `git status --short` no es suyo). Commit: `docs: record the decisions for chapter 2`.

---

### Tarea 1: Estructura sin cambio de comportamiento

**Propósito:** darle sitio a lo que viene. Mudanza pura: ni una línea de lógica cambia. Cuatro carpetas están en el tope de 12 (`src/engine/simulation/`, `src/game/view/cards/`, `src/ui/` y `tests/e2e/`) y cinco en 11.

**Archivos:**
- Move: de `src/engine/network/` a `src/engine/network/addressing/`: `cidr.ts`, `cidr.test.ts`, `topology.ts`, `topology.test.ts`, `routing.ts` y `routing.test.ts`. De `src/engine/simulation/` a `src/engine/simulation/paths/`: `routers.ts`, `traceroute.ts`, `traceroute.test.ts`, `checkpoints.ts` y `checkpoints.test.ts`. De `src/game/view/cards/` a `src/game/view/cards/terminal/`: `terminal-card.ts`, `terminal-card.test.ts`, `traceroute-lines.ts` y `traceroute-lines.test.ts`. De `src/ui/incident/map-cards/` a `src/ui/incident/map-cards/terminal/`: `terminal-card.tsx` y `terminal-card.test.tsx`. De `tests/e2e/` a `tests/e2e/chapter-1/`: `chapter-1.spec.ts` y `chapter-1-play.ts`.
- Create: el `CLAUDE.md` de cada carpeta nueva (`addressing/`, `paths/`, `terminal/` en `game/view/cards/` y en `ui/incident/map-cards/`, `chapter-1/`).
- Modify: los imports de todo lo que mude (`@/engine/network/addressing/...`, `@/engine/simulation/paths/...`, `@/game/view/cards/terminal/...`, `./terminal/...`, y los `./closing`, `./cards` de los specs de e2e), las guías `CLAUDE.md` afectadas (`src/engine/network/`, `src/engine/simulation/`, `src/game/view/`, `src/ui/incident/`, `tests/e2e/`) y `DESIGN.md` si cita alguna ruta.
- Los barrels de `@/engine`, `@/game` y `@/ui` siguen exportando lo mismo. Playwright encuentra los specs de subcarpetas porque su `testDir` es `tests/e2e`; la plantilla de las capturas (`{testDir}/snapshots/...`) no cambia.

**Interfaces:** después de la mudanza: `src/engine/simulation/` queda en 7 archivos, `src/engine/network/` en 5, `src/game/view/cards/` en 8, `src/ui/incident/map-cards/` en 7 y `tests/e2e/` en 10. Las tarjetas nuevas (`table-card`, la salida) y los motores nuevos tienen sitio. `src/ui/` (12) y `src/design/primitives/` (10) no se tocan: ninguna tarea suma un archivo directo a `src/ui/`.

**Tests:** ninguno nuevo; todos los de hoy pasan sin cambiar su contenido.
- `git diff -M --stat` muestra solo renombres y cambios de import y de ruta.
- `pnpm check` verde, con las dos capturas de `#/entidades` iguales píxel a píxel. `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida.

**Review Focus:** 1, 2 y 16.

**Commit:** `refactor: make room in the full folders before chapter 2`.

---

### Tarea 2: Los términos nuevos en el registro

**Propósito:** que los motivos y los textos de las tareas siguientes puedan etiquetar los términos de este capítulo. Un término registrado y aún no presentado por ningún incidente es inerte.

**Archivos:**
- Modify: `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/copy/CLAUDE.md`.

**Interfaces:** 49 ids nuevos (con `default-port`, de la Tarea 2 bis, son 50), con el nombre oficial y la definición de la tabla del spec (120 caracteres o menos, sin términos que se presentan después): `service`, `port`, `listen`, `ip-port`, `destination-port`, `nc`, `client-server`, `tcp`, `connection`, `handshake`, `source-port`, `ephemeral-port`, `closed-port`, `rst`, `connection-refused`, `filtered-port`, `listen-address`, `bit`, `prefix`, `subnet-mask`, `port-range`, `ssh`, `well-known-ports`, `route`, `routing-table`, `connected-route`, `default-route`, `next-hop`, `net-unreachable`, `most-specific-route`, `napt`, `translation-table`, `port-forwarding`, `domain-name`, `dns-query`, `resolver`, `udp`, `dig`, `dhcp`, `authoritative-server`, `dns-record`, `a-record`, `cname-record`, `dns-cache`, `dns-ttl`, `nxdomain`, `servfail`, `port-unreachable` y `hosts-file`. Se reescriben las definiciones de `cidr` («IP/prefijo»), `dns` (suma el puerto 53) y `nat` (amplia, D-7). Ningún id nuevo entra en `TERM_ENTITY` ni en `ENTITY_TERMS` (las piezas nuevas usan términos que ya existen). Esto vale para esta tarea y para sus 49 ids, salvo `tcp` y `udp`: con V12 = B (D-9) las cuatro entidades de paquete de TCP y UDP los nombran en `ENTITY_TERMS` y `TERM_ENTITY` los lleva a ellas; lo hace la Tarea 21 y reescribe a propósito la prueba `no term of chapter 2 names an entity of the map or has a short form`. Los incidentes presentan los términos en sus propias tareas.

**Tests:**
- `terms.test.ts`, `registers the 49 new ids of chapter 2 and rewrites cidr, dns and nat`: el conjunto de ids nuevos es exactamente el de arriba y los tres reescritos cambiaron de definición. (Es lo que registró esta tarea; la Tarea 2 bis suma el id 50, `default-port`, y la renombra `registers the 50 new ids of chapter 2 and rewrites cidr, dns and nat`.)
- `every definition of chapter 2 names only terms that are known at its incident, in the approved order`: una tabla de datos de la prueba (id y subchapter) repite la lógica de `namedTerms` sobre las 52 definiciones (53 con la Tarea 2 bis) y contra todo el registro, sin depender de que los incidentes existan; es la prueba del spec hecha código.
- Los de hoy corren sobre los ids nuevos: `%s has a name and a short definition` (120 caracteres o menos), `ids are English kebab-case` y `only the IP address and the Security Group have a short form`.
- `ladder.test.ts`, `a term is introduced by one incident at most`: sigue verde (nadie presenta aún los nuevos).
- `the glossary says a port goes from 1 to 65535`.

**Review Focus:** 3 y 18.

**Cierre:** `pnpm check` verde. **Commit:** `feat(copy): register the terms of chapter 2`.

**Seguimiento de D-13 (2026-10-11).** Esta tarea registró `domain-name` con el ejemplo «como example.com». Con D-13 = B los nombres del juego van bajo `.example`: la definición pasa a «Un nombre legible, como lucia.example, escrito por niveles separados por puntos. Se lee de derecha a izquierda.» (111 caracteres, medidos con `len()` de Python; el tope es 120). Es el único lugar del código que hoy dice `example.com` (se comprobó con `grep` en `src/`, `tests/`, `DESIGN.md` y `README.md`). Cambia `src/copy/terms.ts` y suma a `terms.test.ts` la prueba `the definition of domain name gives its example under .example and not example.com`. Commit de seguimiento (el mensaje lo fija quien lo hace): `fix(copy): give the example of the domain name under .example`. La Tarea 2 bis no lo incluye: se prescribió solo para D-18.

---

### Tarea 2 bis: El puerto por defecto y la nueva definición de los puertos conocidos (D-18)

**Propósito:** que el 05 presente dos ideas distintas con dos términos: la costumbre de que cada servicio use un puerto (`default-port`, «puerto por defecto») y el rango de IANA (`well-known-ports`, «puertos conocidos»). D-18 se contestó el 2026-10-11, con las Tareas 3 a 6 ya hechas, y el estudiante pidió el cambio; por eso se ejecutó después de la 6 aunque va aquí, junto a los demás términos. **Hecha** (`43a54ef`).

**Archivos:**
- Modify: `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/levels/ladder.test.ts`, `src/copy/CLAUDE.md`.

**Interfaces:** un id nuevo, `default-port`, nombre oficial «puerto por defecto», núcleo, que el 05 presenta: «El puerto que usa un servicio si nadie lo cambia: 22 para SSH, 80, 443, 3306, 5432. Es costumbre: nada obliga a usarlo.» (119 caracteres). `well-known-ports`, «puertos conocidos», pasa a la definición «Los puertos del 0 al 1023, que IANA reserva para servicios comunes, como el 22 de SSH.» (86 caracteres), con su fuente (RFC 6335 §6, «System Ports, also known as the Well Known Ports») en un JSDoc. Ninguna definición llama «puertos conocidos» al 3306 ni al 5432. El 05 presenta ahora cuatro términos, en este orden: `port-range`, `ssh`, `default-port` y `well-known-ports`. Con este id, el capítulo tiene 53 términos y 50 ids nuevos.

**Tests:**
- `terms.test.ts`, `registers the 50 new ids of chapter 2 and rewrites cidr, dns and nat` (la de la Tarea 2, que se llamaba `registers the 49 new ids of chapter 2 and rewrites cidr, dns and nat`).
- `every definition of chapter 2 names only terms that are known at its incident, in the approved order` (su tabla suma `default-port` en el 05).
- `the well-known ports go from 0 to 1023 and the definition names neither 3306 nor 5432`.
- `the default port lists 22, 80, 443, 3306 and 5432 and says it is a custom`.
- `ladder.test.ts`: la lista del 05 suma `default-port` y `a term is introduced by one incident at most` sigue verde.

**Review Focus:** 3 y 18.

**Cierre:** `pnpm check` verde. **Commit:** `feat(copy): add the default port and redefine the well-known ports`.

---

### Tarea 3: El mundo parte del capítulo anterior, y los cambios de servidores se explican

**Propósito:** que el 02-01 parta del final del 01-14 (decidida 1) y que `explained-changes.test.ts` mire también a los servidores y no cuente el cableado de una pieza nueva (decidida 2).

**Archivos:**
- Modify: `src/levels/world.ts`, `src/levels/world.test.ts`, `src/levels/contract/changes.ts`, `src/levels/contract/changes.test.ts`, `src/levels/explained-changes.test.ts`, `.claude/rules/explained-behavior-changes.md` (una línea: el test mira también servidores y no cuenta el cableado de una pieza nueva), `src/levels/CLAUDE.md`.

**Interfaces:** `worldBeforeChanges`: un incidente con `changes` y sin previo en su capítulo parte de `solvedWorld` del último incidente del capítulo anterior en el orden del juego; un incidente con `base` parte de su `base`, como hoy. `changedNames`: compara además los actores `server` (todos sus campos) y no cuenta como cambio de un router una interfaz nueva cuya `faces` es una pieza que existe solo en `after`. Cualquier otro cambio de interfaces, rutas o avisos sí cuenta.

**Tests:**
- `world.test.ts`, `an incident with changes and no previous incident in its chapter starts from the solved world of the last incident of the chapter before`.
- `an incident with a base world still starts from its base`.
- `a first incident with changes and nothing before it still fails with a clear message`.
- `changes.test.ts`, `changedNames also lists a server of the internet whose configuration differs`.
- `explained-changes.test.ts`, `every change to a server of the internet is explained by naming it`.
- `a router interface that faces a piece added by the same action is not a configuration change`.
- `a router whose routes differ is listed even when an interface is added at the same time`.
- `a device whose hosts file or dns server differs is listed`.
- Los de hoy de `explained-changes.test.ts` corren sin cambiar su contenido. Cierre: golden sin cambios.

**Review Focus:** 2 y 6.

**Commit:** `feat(levels): chain the worlds across chapters and explain the changes of servers`.

---

### Tarea 4: El puerto de origen y el saludo en la traza

**Propósito:** el 02-02 y el 02-08 necesitan el puerto de origen en el paquete, los puertos en el encabezado, y el saludo de tres pasos como datos.

**Archivos:**
- Modify: `src/engine/network/schema.ts` (`PacketSpec.sourcePort`), `types.ts`, `src/engine/simulation/trace.ts` (`header` con puertos y `exchange`), `simulate.ts` (`headerOf` para TCP y UDP de una oficina), `stages/host.ts` y `stages/reply.ts` (llenan `exchange`), `src/engine/CLAUDE.md` y `src/engine/simulation/CLAUDE.md`.
- Create: `src/engine/simulation/ports.test.ts`.

**Interfaces:** `PacketSpec.sourcePort`, opcional, de 1 a 65535; sin él, `simulate` usa 51514 (decidida 6) (O-2 = A: el paquete que pidió una consulta DNS toma el puerto después de ella; ver Tarea 28 quater). Para un paquete TCP o UDP de una oficina, `Trace.header.request` y `reply` llevan `sourcePort` y `destinationPort`, invertidos en la vuelta. `Trace.exchange` lista los extremos: TCP aceptado, SYN, SYN-ACK y ACK; TCP rechazado, SYN y RST; TCP sin respuesta, SYN; UDP, `query` y `response`. Ningún campo nuevo aparece en un paquete ICMP ni en una VPC; `describePacket` y el resumen de `tcpdump` no cambian.

**Tests:**
- `ports.test.ts`, `a tcp packet of an office carries its source and destination ports in the request header`.
- `the reply header swaps the ports`.
- `an accepted tcp connection lists SYN, SYN-ACK and ACK`.
- `a refused tcp connection lists SYN and RST`.
- `a tcp packet with no answer lists only SYN`.
- `the source port defaults to 51514 and a given one wins`.
- `an icmp packet and a packet of a VPC carry no ports and no exchange`.
- `the new trace fields are absent from every trace of a VPC`.
- `the ICMP branch of the host stage keeps every field it had`.
- Cierre: golden sin cambios; las pruebas del capítulo 1 sin editar.

**Review Focus:** 1, 2 y 8.

**Commit:** `feat(engine): carry the source port and the exchange in the trace`.

---

### Tarea 5: La secuencia pura

**Propósito:** el puerto efímero que cambia, la tabla del NAT y la caché del resolver son estado. Entra al motor como entrada, no como lectura (decidida 5).

**Archivos:**
- Create: `src/engine/simulation/sequence.ts` y `sequence.test.ts`.
- Modify: `src/engine/index.ts` (exporta `simulateSequence`), `src/engine/CLAUDE.md`.

**Interfaces:** `simulateSequence(net, sends)`, con `sends` una lista ordenada de `{ packet, at }`; devuelve una traza por envío. Asigna el puerto de origen a cada paquete TCP o UDP que no trae uno: el primero de cada dispositivo sale del 51514 y cada uno nuevo del mismo dispositivo suma uno. Con O-2 = A la asignación pasa a una etapa del motor (Tarea 28 quater) y la consulta DNS de un envío por nombre toma el suyo antes que el paquete. Deja ganchos para la tabla del NAT (Tarea 10) y la caché del resolver (Tarea 13). `simulate(net, packet)` sigue igual.

**Tests:**
- `sequence.test.ts`, `gives the same traces for the same sends`.
- `the first connection of a device leaves from 51514 and each new one adds one`.
- `two devices each start at 51514`.
- `a given source port wins over the assignment`.
- `a sequence of icmp packets gives the same traces as simulate one by one`.
- `an unrelated send does not change the ports of another device`.
- Cierre: golden sin cambios.

**Review Focus:** 12.

**Commit:** `feat(engine): add the pure sequence that carries state between packets`.

---

### Tarea 6: Servicios y dirección de escucha

**Propósito:** el 01, el 03 y el 05 necesitan servicios con puerto y con dirección de escucha, también en un servidor de internet.

**Archivos:**
- Modify: `src/engine/network/schema.ts` (`Service`, `host.services`, `ServerActor.services`; se quita `listeningTcpPorts`), `types.ts`, `actions.ts` (`setServices`, `setListenAddress`), `src/engine/simulation/context.ts` (`receiverOf` usa los servicios del actor), `stages/host.ts`, `src/engine/exposure/exposure.test.ts`, `src/copy/reasons.ts` y `reasons.test.ts` (`host-wrong-address`; el texto de `host-refused` con los términos nuevos pasó a la Tarea 16), `src/testing/fixtures.ts`, `src/levels/01-first-day/shared.ts` y `src/levels/04-iaas/shared.ts` (el cambio mecánico), las pruebas que leen `listeningTcpPorts` (`actions.test.ts`, `simulate.test.ts`).
- Create: `src/engine/network/services.ts` y `services.test.ts`.

**Interfaces:** ver «Modelo de la red». `host.ts` busca un servicio TCP por puerto y dirección: `all` acepta cualquier IP del dispositivo y `loopback` solo `127.0.0.1`. Sin servicio, o con la dirección equivocada (también otra `127.x`), responde RST (`refused`, con `host-wrong-address` en el segundo caso). Un servidor de internet tiene `services`.

**Tests:**
- `services.test.ts`, `a service on all addresses accepts a packet to any IP of the device`.
- `a service on the loopback address accepts only a packet to 127.0.0.1` (renombrada el 2026-10-11: el primer commit de la tarea la llamaba `... accepts only a packet to 127.x.x.x`).
- `a service on the loopback address refuses a packet to the IP of the device on the network`.
- `simulate`, `a tcp port nobody listens on answers with a reset and a firewall that drops answers with nothing`.
- `a tcp port with a service on the right address is accepted`.
- `a server of the internet accepts a tcp connection on a port it serves`.
- `the reply of a tcp connection is never stopped by a firewall, outbound or inbound`.
- `actions.test.ts`, `setServices replaces the services of a device or server`.
- `setListenAddress changes the address of one service and keeps the rest`.
- `exposure.test.ts`, `the probe battery still finds the extra opening of a tcp rule in an office`.
- `a port range of 1-1023 is caught by the probe battery through the ports 80 and 443`.
- Cambio mecánico, sin cambiar lo que aseguran: las pruebas que leían `listeningTcpPorts`. Cierre: golden sin cambios.
- **No bloquea el cierre:** si el estudiante prueba en su EC2 (un servicio ligado a `127.0.0.1` y un `nc` desde otra máquina) que se rechaza un paquete a la IP de la red, se anota el resultado en la guía de `src/engine/network/`; si no lo prueba, la guía lo registra como «sin verificar» y la tarea cierra igual (decidida 8).

**Review Focus:** 1, 2, 5 y 7.

**Commit:** `feat(engine): model services with a listening address`.

**Seguimiento (2026-10-11).** Un commit aparte corrige el modelo exacto del servicio `loopback`: acepta solo `127.0.0.1`, y un paquete a otra dirección `127.x` recibe un RST, igual que uno a la IP de la red (decidida 8). Cambia `services.ts`, `services.test.ts` (el nombre de la prueba de arriba y sus aserciones) y la guía de `src/engine/network/`, y repite el cierre de la tarea (golden sin cambios, `pnpm check` verde). **Hecho** (`7985fc5`): `fix(engine): accept on a loopback service only what goes to 127.0.0.1`.

---

### Tarea 7: UDP y el aviso Port Unreachable

**Propósito:** el 10 y el 13 necesitan servicios UDP, y un UDP cerrado debe avisar en vez de callar (decidida 9, D-1).

**Archivos:**
- Modify: `src/engine/simulation/stages/host.ts`, `trace.ts` (`NoticeKind` con `port-unreachable`; `host-udp-closed` reemplaza a `host-udp-no-service`), `paths/routers.ts` (el aviso viaja como los otros), `src/copy/reasons.ts` y `reasons.test.ts` (el cambio a propósito), `src/copy/packet-labels.ts`, `src/engine/exposure/exposure.test.ts`, `src/levels/04-iaas/golden-traces.test.ts` (solo la tabla `RECORDED_VALUES`, si el nombre del código cambia en un valor registrado), guías.
- Test: `src/engine/simulation/ports.test.ts`.

**Interfaces:** un datagrama UDP que llega a un host con un servicio UDP en ese puerto se acepta; sin servicio, contesta ICMP Port Unreachable (`unreachable`, `notice.kind = port-unreachable`, `fromId` el host). Un firewall que descarta sigue en silencio. Sin límite de tasa.

**Tests:**
- `a udp port nobody listens on answers with Port Unreachable`.
- `a udp port with a service answers`.
- `a firewall that drops a udp datagram stays silent`.
- `the reply of a udp datagram is never stopped by a firewall, outbound or inbound`.
- `a udp packet to a host past a router warns from the host, not from the router`.
- `exposure.test.ts`, `a udp probe to a host with no service now ends in a warning and still counts as reaching the host`.
- Cambia a propósito: `reasons.test.ts`, el caso de `host-udp-no-service` (su texto pasa al de `host-udp-closed`).
- Cierre: golden sin cambios (D-1); si falla, la tarea se detiene.

**Review Focus:** 1, 5 y 7.

**Commit:** `feat(engine): answer a closed udp port with Port Unreachable`.

---

### Tarea 8: La tabla de rutas de un dispositivo

**Propósito:** el 06 enseña la tabla de `tu-laptop`; el motor decide con ella.

**Archivos:**
- Create: `src/engine/network/addressing/routing-table.ts` y `routing-table.test.ts`, `src/engine/simulation/routing-table.test.ts`.
- Modify: `src/engine/simulation/stages/route.ts` (decide con la tabla), `trace.ts` (`Trace.routes`), `src/copy/reasons.ts`, `src/engine/network/addressing/routing.ts` (comparte el prefijo más largo), guías.

**Interfaces:** `routingTableOf(net, holder)` deriva la ruta de red conectada de cada interfaz (para un dispositivo, su LAN), la ruta por defecto (la puerta de enlace) y las rutas de un router (decidida 10). `route` elige la más específica con la misma regla que ya usan los routers; el resultado para los mundos del capítulo 1 no cambia. `Trace.routes` lista una decisión por emisor y por router, con la ruta elegida y las que también cubrían el destino.

**Tests:**
- `routing-table.test.ts`, `a device table has its connected route and its default route when it has a gateway`.
- `a device with no gateway has no default route`.
- `a router table lists a connected route per interface and its own routes`.
- `the longest prefix wins and the trace lists the routes that also covered the destination`.
- `simulation/routing-table.test.ts`, `the choice of route in the office of chapter 1 gives the same outcome as before`.
- `a destination in the LAN of the device uses the connected route and a destination outside it uses the default route`.
- Cambia a propósito (decisión del estudiante del 2026-10-11, opción A, porque `Trace.routes` es un campo nuevo de la traza): `src/game/chapter-1.test.ts`, `the same ping of 01-05 and 01-11 has the same trace and only the words change`, compara las dos trazas sin el campo `routes` (el camino y los pasos se siguen comparando; las rutas difieren por diseño, porque en el 01-11 la laptop ya tiene puerta de enlace y su tabla suma la ruta por defecto), y `src/engine/simulation/ports.test.ts`, `the ICMP branch of the host stage keeps every field it had`, suma `routes` a su lista de campos (las tres trazas de esa prueba entregan el paquete a la red, así que las tres llevan el campo).
- Cierre: golden sin cambios; el capítulo 1 sin editar, salvo esas dos pruebas.

**Review Focus:** 2 y 9.

**Commit:** `feat(engine): derive the routing table of a device and choose by longest prefix`.

---

### Tarea 9: Rutas editables de un router y Net Unreachable

**Propósito:** el 07 y el caso 5 del 14 editan la tabla de un router; con la tabla vacía, el router avisa Net Unreachable.

**Archivos:**
- Modify: `src/engine/network/actions.ts` (`addRoute`, `removeRoute`), `schema.ts` (una sola ruta por destino en una tabla), `src/engine/simulation/paths/routers.ts` (registra la ruta elegida), `src/copy/reasons.ts`, guías.
- Test: `src/engine/network/actions.test.ts`, `src/engine/simulation/routing-table.test.ts`, `schema.test.ts`.

**Interfaces:** `addRoute { routerId, route }` agrega una ruta; `removeRoute { routerId, to }` quita la de ese destino. Dos rutas al mismo destino no se aceptan. La rama `private` de `onwardFrom` no se toca (decidida 11).

**Tests:**
- `actions.test.ts`, `addRoute adds a route and keeps the others`.
- `addRoute for a destination that already has a route returns the same network`.
- `removeRoute removes the route of one destination`.
- `actions on unknown routers return the same network`.
- `schema.test.ts`, `rejects a router table with two routes to the same destination`.
- `routing-table.test.ts`, `a router with no route that covers the destination warns Destination Net Unreachable`.
- `with only a default route, a private destination is dropped by the provider with no warning, as in chapter 1`.
- `a more specific route beats the default route and the trace says so`.
- Cierre: golden sin cambios; `a private address is dropped by the first router outside the office, with no warning` sin editar.

**Review Focus:** 2, 7 y 9.

**Commit:** `feat(engine): edit the routes of a router and warn when none covers the destination`.

---

### Tarea 10: NAT con puertos y su tabla

**Propósito:** el 08 enseña que muchas IP privadas comparten una pública. El NAT existe siempre en el borde de la oficina; la secuencia lleva su tabla (decididas 3 y 4).

**Archivos:**
- Create: `src/engine/nat/translation.ts` y `translation.test.ts`, `src/engine/simulation/stages/nat.ts`.
- Modify: `src/engine/simulation/paths/routers.ts` (detecta la salida por la interfaz con IP pública), `sequence.ts` (lleva la tabla), `trace.ts` (`Trace.translation`), `simulate.ts`, `src/engine/CLAUDE.md`.

**Interfaces:** al salir un paquete de un dispositivo por la interfaz no privada de un router que da a una LAN, el origen se traduce: protocolo, IP:puerto privado, IP:puerto público (IP = la de esa interfaz; puerto desde el 40001, el siguiente libre de la tabla). El mismo IP:puerto privado reutiliza su fila hacia cualquier destino. ICMP se traduce sin fila visible. `Trace.translation` es un campo aparte: **no escribe ningún paso ni motivo**. Un `simulate` suelto traduce con una tabla vacía. El enlace privado a otra oficina no traduce.

**Tests:**
- `translation.test.ts`, `the public ip is the ip of the interface with a public address of the router that faces a LAN`.
- `two laptops with the same source port get two public ports in one table`.
- `the same private ip and port reuse its row towards any server`.
- `a ping is translated and leaves no row`.
- `the link to the other office is not translated`.
- `a packet of a VPC and a packet that does not leave the office carry no translation`.
- `the trip out of the office has no step and no reason that names NAT or the public IP` (el de hoy, sin tocar).
- `the pings of chapter 1 give the same outcome, hops and times in the world chapter 2 starts from`.
- `the reply through a translation gives no reason beyond its row`.
- Cierre: golden sin cambios; las pruebas de `steps` del capítulo 1 sin editar.

**Review Focus:** 1, 2, 5, 10 y 12.

**Commit:** `feat(engine): translate the source of what leaves the office and keep a table`.

---

### Tarea 11: NAT entrante, descarte sin traducción y reenvío fijo

**Propósito:** el 09 enseña que un paquete de afuera sin fila no sabe a qué equipo ir y que un reenvío fijo lo entrega sin filtrar.

**Archivos:**
- Modify: `src/engine/network/schema.ts` (`Router.forwards`), `actions.ts` (`setForwards`), `src/engine/simulation/stages/route.ts` y `paths/routers.ts` (un actor cliente de una oficina con routers entra al router dueño de la IP de destino; decidida 17), `stages/nat.ts` (busca una fila de la secuencia o un reenvío), `trace.ts` (los motivos `nat-no-translation` y `nat-forwarded`), `src/copy/reasons.ts`, guías.
- Test: `src/engine/nat/translation.test.ts`, `schema.test.ts`, `actions.test.ts`.

**Interfaces:** un paquete TCP o UDP de un actor cliente a la IP pública de un router con NAT busca una fila (de la secuencia o fija); si la hay, la IP y el puerto de destino pasan al dispositivo; si no, no se entrega a nadie (`timeout`). El TTL baja una vez.

**Tests:**
- `a packet from outside with no translation is not delivered to any device`.
- `a fixed forward delivers to the device it names and nothing filters it`.
- `a forward to a device with a firewall is still stopped by that firewall`.
- `a packet from a client actor to a public IP that no router owns is lost`.
- `the text of an unsolicited packet says it is not delivered and never that NAT blocks it`.
- `schema.test.ts`, `rejects a forward to a device that does not exist`.
- Cierre: golden sin cambios; el capítulo 1 sin editar.

**Review Focus:** 1, 2, 10 y 18.

**Commit:** `feat(engine): deliver what comes from outside only to a translation or a forward`.

---

### Tarea 12: DNS, el modelo y la resolución

**Propósito:** el 10, el 11 y el 13 necesitan un resolver, un servidor autoritativo con registros A y CNAME, y los estados NXDOMAIN y SERVFAIL.

**Archivos:**
- Create: `src/engine/dns/records.ts`, `records.test.ts`, `resolve.ts` y `resolve.test.ts`.
- Modify: `src/engine/network/schema.ts` (`ServerActor.dns`, `Device.dnsServer`), `actions.ts` (`setDns`, `setDnsServer`, `addRecord`, `removeRecord`), `src/engine/simulation/stages/dns.ts` (la resolución nueva; los nombres EC2 de una VPC siguen como hoy), `trace.ts` (`Trace.dns` y los motivos `dns-answered`, `dns-nxdomain`, `dns-servfail`, `dns-no-resolver`), `src/copy/reasons.ts`, `src/engine/CLAUDE.md`.

**Interfaces:** `resolve(net, device, name, mode)` envía la consulta al resolver de `Device.dnsServer` como un datagrama UDP al 53 (con las reglas, rutas y servicios del resto del motor), y el resolver, sin red de por medio, consulta a su `upstreams` (decidida 13). La traza de ese datagrama ya no se descarta: va en `Trace.question` (Tarea 28 quater). Sigue un CNAME hasta un A. Sin registro: NXDOMAIN, con el SOA de la zona. Autoritativo caído: SERVFAIL. `recordProblem` dice por qué una entrada no se acepta (un CNAME con otros registros). Un dispositivo de una oficina sin `dnsServer` no resuelve. **El SOA de cada zona es un dato.** El apex trae un SOA con los siete campos de RFC 1035 §3.3.13 (MNAME, RNAME, SERIAL, REFRESH, RETRY, EXPIRE, MINIMUM), con valores fijos del juego y cada uno con su fuente; los que no vengan de una fuente se declaran números del juego, como el TTL de 300 segundos (decidida 25). La traza de un NXDOMAIN lleva el SOA de la zona que contestó, con el TTL que RFC 2308 §3 manda para una respuesta negativa: el menor entre el TTL del propio SOA y su campo MINIMUM. El juego no guarda NXDOMAIN en caché (decidida 13), así que ese TTL se entrega entero. Es lo que la Tarea 18 imprime en la `AUTHORITY SECTION` de `dig`. El spec declaraba el SOA entre lo que el juego no modela («Fuera del capítulo»); esa línea se corrigió el 2026-10-11, en la Tarea 0, y ahora dice que el juego modela el SOA de cada zona como dato.

**Tests:**
- `resolve.test.ts`, `an a record gives its ip and its time to live`.
- `a cname is followed to an a record and the trace says it was an alias`.
- `a name that nobody has answers NXDOMAIN`.
- `an NXDOMAIN carries the SOA of the zone that answered, with the smaller of its ttl and its minimum`.
- `an authoritative server that fails makes the resolver answer SERVFAIL`.
- `records.test.ts`, `a name with a cname cannot hold another record`.
- `every zone has one SOA at its apex with fixed, cited values`.
- `the SOA has the seven fields of RFC 1035 section 3.3.13`.
- `a cname at the top of the zone is rejected because the zone has its own records`.
- `addRecord returns the same network when the cname rule forbids it and recordProblem says why`.
- `simulate`, `the name of an EC2 instance still resolves as in a VPC`.
- `a name in an office with no dns server does not resolve`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2 y 11.

**Commit:** `feat(engine): resolve names with a resolver, an authoritative server and records`.

---

### Tarea 13: DNS, la caché, el reloj, el archivo hosts y el resolver sin servicio

**Propósito:** el 12 y el 13 necesitan la caché con TTL y un reloj, el archivo hosts frente a `dig`, y un resolver que contesta Port Unreachable.

**Archivos:**
- Create: `src/engine/dns/cache.ts`, `cache.test.ts`, `hosts.ts` y `hosts.test.ts`.
- Modify: `src/engine/simulation/sequence.ts` (lleva la caché de un envío al siguiente y mide cada envío contra su `at`), `stages/dns.ts`, `schema.ts` (`PacketSpec.lookup`, `Device.hosts`), `actions.ts` (`setHosts`), `trace.ts` (`dns-cached`, `dns-hosts-file`, `dns-resolver-silent`), `src/copy/reasons.ts`, guías.

**Interfaces:** el resolver guarda cada respuesta con `expiresAt = at + ttl` y la entrega mientras `at` sea menor; la caché inicial de su `dns.cache` se mide contra el mismo reloj. `lookup: system` (ping y `nc`) lee primero el archivo hosts del dispositivo y después pregunta; `lookup: dig` pregunta directo al resolver y no lee hosts. Una consulta a una IP sin servicio UDP 53 recibe Port Unreachable. Con O-2 = A la consulta de un `ping` o un `nc` por nombre corre con la tabla, los puertos y el reloj del envío (Tarea 28 quater); la caché no cambia.

**Tests:**
- `cache.test.ts`, `the resolver answers from its cache until the time to live runs out`.
- `after the time to live the resolver asks again and caches the new answer`.
- `an initial cache entry runs out against the clock of the game`.
- `hosts.test.ts`, `dig does not read the hosts file and ping does`.
- `a line of the hosts file answers before any query is sent`.
- `simulate`, `a resolver with no service on port 53 answers Port Unreachable`.
- `a dig to a device that is not a resolver ends in a warning from that device`.
- `sequence.test.ts`, `the cache of the resolver is carried from one dig to the next`.
- Cierre: golden sin cambios; `no engine file reads the clock or a random number` (lo cubre `pnpm lint`).

**Review Focus:** 1, 2, 11 y 12.

**Commit:** `feat(engine): cache dns answers by time to live and read the hosts file`.

---

### Tarea 14: El contrato del incidente, con puertos, nombres, tablas y reloj

**Propósito:** que un incidente `send` mande un `nc` o un `dig`, ajuste un servidor DNS o una dirección de escucha, edite una tabla, adelante el reloj y pida lo que el DNS responde; y que un caso del 14 traiga su reparación. **Depende de:** D-2 y D-11.

**Archivos:**
- Modify: `src/levels/contract/incident.ts`, `incident.test.ts`, `chips.ts`, `src/levels/registry.test.ts`, `src/levels/CLAUDE.md`, `src/levels/contract/CLAUDE.md`.

**Interfaces:** ver «Contrato del incidente». `packetFromChips` arma el paquete TCP de un `nc` con el puerto de su ficha de mensaje (decidida 26), el datagrama UDP al 53 de un `dig` con `lookup: dig` y el nombre como destino, y el de un ping como hoy. Una ficha de dirección puede ser un nombre. `officeLeaks` cuenta también un `nc` y un `dig` a una IP fuera de una oficina sin routers. Una pieza con varias tarjetas puede nombrar cuál abre primero (un dato opcional del incidente, V15 = B; su nombre y su forma los decide quien implementa); sin él abre la terminal si la tiene, luego los ajustes o los servicios y luego las tablas. El 01-07 no lo usa.

**La tarjeta de clasificar (D-6 = A; ver «Lo que el 04 pide al código», en la Tarea 26).** Un `identify` puede traer una tarjeta que clasifica a otros dispositivos del mundo en dos bandejas con nombre. El contrato guarda: de quién es la tarjeta (el dispositivo que la abre, `tu-laptop`); el bloque CIDR de la comparación (`192.168.1.0/24`; de él salen el prefijo, la máscara y los bits que la vista marca); las dos bandejas, cada una con su id y su nombre («Dentro de 192.168.1.0/24» y «Fuera»); y los elementos por clasificar, que son dispositivos del mundo. La respuesta de cada elemento se guarda como hoy, bajo su propio `deviceId` y un `trayId` común, así que las tareas (`expect` con `deviceId`, `trayId` y `chipId`), `AnswerMove` y la solución de un `identify` no cambian de forma; `checkIdentify` solo tiene que contar como ofrecidas las bandejas de esta tarjeta. Los nombres de los campos los decide quien implementa.

**Tests:**
- `incident.test.ts`, `accepts an nc message with a tcp port and a dig message`.
- `rejects an nc message with no port`.
- `rejects a port on a ping`.
- `rejects an icmp type on an nc message`.
- `an address chip can be a name`.
- `accepts a setting of kind gateway, dns-server or listen-address and rejects a chip value that does not fit its kind`.
- `accepts a table of routes with a destination tray and a next hop tray`.
- `accepts a table of records with a name tray, a type tray and a value tray`.
- `rejects a table whose owner is not a router or a server of the world`.
- `accepts a clock with steps of seconds`.
- `accepts an expected answer and an expected status`.
- `accepts a case with a fix and rejects a fix whose tasks name chips the case does not offer`.
- `accepts the card a piece opens first and rejects a card the piece does not have`.
- `builds the tcp packet of an nc with the port of the message chip`.
- `builds the udp datagram of a dig with the name as destination and lookup dig`.
- `an nc and a dig to an address outside an office with no router are leaks`.
- `accepts an identify incident whose card classifies other devices into two named bins around a CIDR block`.
- `rejects a classify card whose block is not a CIDR block, whose bins repeat an id or whose items repeat a device`.
- `an identify task can expect the bin of a classified item and the solution can answer for it`.
- `registry.test.ts`, `every table owner and every setting device names something in the start world of its incident`.
- `every device a classify card sorts exists in the start world of its incident`.
- Cierre: golden sin cambios.

**Review Focus:** 2, 18 y 24.

**Commit:** `feat(levels): send nc and dig and edit tables and settings from the contract`.

---

### Tarea 15: La sesión, los movimientos y el reloj

**Propósito:** que la sesión lleve los envíos con su hora, el reloj, y aplique los movimientos nuevos con las reglas del plan. **Depende de:** D-2 y D-11, decididas. V16 = C (2026-10-11) no cambia la sesión: el reloj es del juego y no de una pieza, y la tarjeta que pinta las fichas «Esperar» es de la Tarea 19.

**Archivos:**
- Modify: `src/game/session.ts`, `session.test.ts`, `flow-runs.ts` (simula los envíos con `simulateSequence`), `tasks.ts` y `tasks.test.ts`, `src/levels/world.ts` y `world.test.ts` (`applyMove` para `placeEntry`, `removeEntry` y el `setSetting` generalizado), `src/game/index.ts`, `src/game/CLAUDE.md`.

**Interfaces:** ver «Sesión y vista». `placeEntry` y `removeEntry` aplican `addRoute`, `removeRoute`, `addRecord` y `removeRecord`; cuando el motor devuelve la misma red porque la regla lo impide, la sesión guarda el problema (`recordProblem`) para que la tarjeta lo muestre. `setSetting` aplica `setGateway`, `setDnsServer` o `setListenAddress` según el tipo. `wait` suma al reloj. Un movimiento que cambia el mundo limpia los envíos y no toca el reloj (decidida 5). Una tarea con `expect.answer` o `expect.status` mira la traza del último envío de sus fichas. **Respuestas de una tarjeta de clasificar (D-6 = A).** `offeredPicks` (`session.ts`) hoy solo acepta las fichas de una tarjeta del propio dispositivo (`identify.cards.find(...)`): la respuesta de un elemento clasificado, que no tiene tarjeta propia, se descartaría. Pasa a aceptar también la bandeja de un elemento de la tarjeta de clasificar. `initialAnswers` no cambia: un elemento sin respuesta está sin clasificar.

**Tests:**
- `session.test.ts`, `wait advances the clock and keeps the sends`.
- `a move that changes the world clears the sends and keeps the clock`.
- `placeEntry of a route changes the table and clears the sends`.
- `placeEntry of a record that the cname rule forbids leaves the world as it was and keeps the problem`.
- `removeEntry removes the row it names`.
- `setSetting sets the dns server and the listen address of a device`.
- `a sent packet keeps the time it left at`.
- `flow-runs`, `the sends are simulated in sequence so the translation table and the cache carry over`.
- `tasks.test.ts`, `a send task holds when the last dig answers with the expected ip`.
- `an expected alias holds only when the answer came through a cname`.
- `an expected status holds when the dig ended with it`.
- `world.test.ts`, `applyMove returns the same world when an entry is already in the table`.
- `session.test.ts`, `answering for a classified item saves its bin under its own device and a bin the card does not offer is left out`.
- `a classified item has no answer until the player places it`.
- Cierre: golden sin cambios; las pruebas de la sesión del capítulo 1 sin editar.

**Review Focus:** 2, 12 y 17.

**Commit:** `feat(game): keep the clock, apply the table moves and simulate the sends in sequence`.

---

### Tarea 16: Los textos y la caja de inspección

**Propósito:** que la vista diga lo que la traza ya trae (puertos, saludo, ruta usada, traducción, DNS) con los términos que el jugador conoce, y nada más.

**Archivos:**
- Modify: `src/copy/reasons.ts` y `reasons.test.ts`, `packet-labels.ts` y `packet-labels.test.ts`, `src/copy/screens/incident-ui.ts`, `src/game/view/inspection.ts` y `inspection.test.ts`, `src/game/view/pieces.ts`, `src/game/view/CLAUDE.md`, `src/copy/CLAUDE.md`.

**Interfaces:** cada campo de la caja declara el término que usa y se deja fuera mientras no se conozca: «Servicios» (`service`; dice «puerto 3000» hasta que `tcp` se conoce y «TCP 3000» después), «Encabezado» con puertos (`port`), «Saludo de tres pasos» (`handshake`), «Ruta que usó» (`route`), «Encabezado (en internet)» y la tabla de traducciones (`nat`), y «DNS» (`dns`). Con O-2 = A, el campo «DNS» de un `ping` o un `nc` por nombre suma una línea que dice de qué puerto salió la consulta y que se ve en el mapa (Tarea 28 quater); sus dos frases de hoy siguen siendo ciertas. Con `nat` conocido, la nota «Fuera de la oficina el encabezado cambia…» desaparece (decidida 15). Los motivos nuevos se escriben con los términos conocidos; si el término de la causa es desconocido, el texto dice solo lo que el jugador vio. **D-8 = A (decidida el 2026-10-11):** el campo «Conexión» pasa a llamarse «En la red» en todas las cajas de oficina (`INSPECTION_TEXT.connection`); cambian las cuatro pruebas de `inspection.test.ts` que lo citan, listadas en «Global Constraints». **Etiqueta del paquete (V13 = A):** la de un paquete TCP o UDP dice el protocolo y los puertos («TCP 51514 → 80»), y cada parte aparece cuando su término se conoce (`tcp` y `udp`, en el 02-02 y el 02-10); antes dice solo lo que el jugador conoce. Al salir por el router con NAT, la etiqueta pasa al puerto de origen público («TCP 40001 → 80»), tomado de `Trace.translation`; la caja ya da los dos encabezados. La escena lo dibuja en la Tarea 21.

**`host-refused` y el resultado «rechazado» (decidido el 2026-10-11 por la sesión principal).** El caso `host-refused` de `reasons.ts` pasa a llevar las marcas de los términos nuevos que el jugador conozca: el texto llano que lee el jugador no cambia. La aserción de `reasons.test.ts` que fija su texto crudo cambia a propósito (Global Constraints). `OUTCOME_TEXT.refused` («Llegó, pero ningún programa lo estaba esperando.», en `src/copy/packet-labels.ts`) no puede servir a los dos casos de un rechazo con un solo texto: se corrige con un texto exacto para cada uno, nadie escucha en ese puerto o el servicio escucha en otra dirección (`host-wrong-address`). Quien implementa decide si el texto depende del motivo de la traza. Ninguno nombra un sistema operativo ni da una razón de por qué.

**Tests:**
- `inspection.test.ts`, `a device lists its services behind the term service`.
- `a service says its port and not tcp before tcp is known`.
- `a tcp packet shows its ports in the header behind the term port`.
- `the box lists the three steps of the greeting once handshake is known`.
- `the box says which route a packet used behind the term route`.
- `the box shows the header in the local network and the header in the internet once nat is known`.
- `the note that the header changes outside the office goes away once nat is known`.
- `the box of a dig shows one query and one answer once udp is known`.
- `the box of a dig says whether the answer came from the cache once dns-cache is known`.
- `the field Conexión is called En la red`.
- Cambian a propósito las cuatro pruebas de `src/game/view/inspection.test.ts` que citan el campo «Conexión» (D-8): `a device of an office shows no public IP whatever the player knows, because how a packet leaves the office is a black box`, `a laptop of the office says what a device is, and shows its IP and its firewall`, `a laptop with no cable keeps its IP and says it is not part of the network, and the rest of the office says it is connected` y `shows the connection of a device only in an office and once the term network is known`. Lo que aseguran se conserva; cambia el nombre del campo.
- `reasons.test.ts`, `describes host-wrong-address, host-udp-closed, nat-no-translation, nat-forwarded, dns-answered, dns-cached, dns-hosts-file, dns-nxdomain, dns-servfail, dns-no-resolver and dns-resolver-silent with registered terms only`.
- `a reason whose term is unknown says only what the player saw`.
- `no text says stateful or gives a reason for a reply to come back`.
- `the text of a warning quotes no operating system and says only what the player saw`.
- `reasons.test.ts`, el caso `host-refused` de `CASES` (corrido por `describes %o`) cambia a propósito: su texto crudo lleva las marcas de términos y el texto llano es el mismo.
- `packet-labels.test.ts`, `the result of a refusal says whether nobody listens on the port or the service listens on another address`.
- `a tcp packet is labelled with its protocol and ports`.
- `the label of a packet names its protocol only once the term of the protocol is known`.
- `a translated packet is labelled with its private source port before the router and its public source port after it`.
- `a packet that is not translated keeps one label along its whole path`.
- Cierre: golden sin cambios; el 01-08 sigue diciendo que el encabezado cambia afuera y no nombra NAT.

**Review Focus:** 2, 4, 5 y 18.

**Commit:** `feat(copy): write the ports, the greeting, the route, the translation and the dns with the terms the player knows`.

---

### Tarea 17: La primitiva `Table` (D-3 A)

**Propósito:** una sola primitiva para las tablas con columnas. **Depende de:** nada pendiente: D-3 = A y V10 = A están decididas (2026-10-11) y la mudanza de `src/design/primitives/` por familias está aprobada (2026-10-11). Con la mudanza, `src/design/primitives/` queda en 6 archivos y `panels/` en 6 con `Table`: la Tarea 18 bis puede sumar `Message` sin llenar la carpeta.

**Archivos:**
- **Primer paso, en un commit propio** (`refactor(design): split the primitives by family to make room`; **hecho**, `8a024d9`): Move de `src/design/primitives/` a `src/design/primitives/panels/`: `card.tsx`, `card.test.tsx`, `tabs.tsx` y `tabs.test.tsx`. Create: `src/design/primitives/panels/CLAUDE.md`. Modify: las rutas del barrel `src/design/index.ts`, las guías `src/design/CLAUDE.md` y `src/design/primitives/CLAUDE.md`, y `DESIGN.md` (su paso 4 dice «10 de 12»). `primitives.css` se queda donde está, porque `src/styles.css` lo importa; ningún archivo fuera de `src/design/` importa una primitiva por su ruta (comprobado el 2026-10-11). Mudanza pura, sin cambio de comportamiento: `git diff -M --stat` solo muestra renombres y cambios de import, y las dos capturas de `#/entidades` quedan iguales píxel a píxel.
- Create: `src/design/primitives/panels/table.tsx` y `table.test.tsx`.
- Modify: `src/design/primitives/primitives.css`, `src/design/index.ts`, `src/design/CLAUDE.md`, `DESIGN.md` (cuándo usarla y el nuevo recuento de `src/design/primitives/`), `src/ui/catalog/interface-section.tsx` (el especimen), `tests/e2e/snapshots/interface-darwin.png` (se regraba a propósito).

**Interfaces:** `Table` recibe un título que es su `caption`, una lista de columnas `{ id, label }`, una lista de filas `{ id, cells, inUse?, onRemove? }` y un texto para «vacía». No acepta `className` ni `style`. Una fila en uso se marca con una variante y con texto para quien no ve el color. El estilo es el B, dentro de una `Card`.

**Tests:**
- `table.test.tsx`, `renders a caption, the column headers and the rows`.
- `a row action has an accessible name made from its row`.
- `marks the rows in use with text and not only with colour`.
- `shows the empty text when there are no rows`.
- `takes no className and no style`.
- `the remove buttons are reached and used with the keyboard`.
- Playwright `entities.spec.ts`: `the interface specimen of Table is part of the capture`.
- Cierre: la captura de la interfaz cambia solo por el especimen nuevo (se revisa el diff); la de piezas no cambia. `pnpm check` verde.

**Review Focus:** 15 y 16.

**Commit:** `feat(design): add the Table primitive` (después del commit de la mudanza, que es el primer paso de esta tarea).

---

### Tarea 18: `nc` y `dig` en la terminal, y la tarjeta «Salida»

**Propósito:** que la terminal escriba el comando de Linux y la tarjeta muestre la salida tal como la imprime la herramienta, con su fuente. **Depende de:** nada pendiente: D-5 (`ncat` 7.93 y BIND 9.18), D-4 = A y V11 = B están decididas (2026-10-11).

**Archivos:**
- Create: `src/copy/tools/nc-output.ts`, `nc-output.test.ts`, `dig-output.ts`, `dig-output.test.ts` y `CLAUDE.md` (la fuente de cada línea con su etiqueta, su ruta y su fecha); `src/game/view/cards/terminal/output-card.ts` y `output-card.test.ts`; `src/ui/incident/map-cards/terminal/output-card.tsx` y `output-card.test.tsx`.
- Modify: `src/game/view/cards/terminal/terminal-card.ts` y `traceroute-lines.ts` (el traceroute pasa a la tarjeta «Salida» sin cambiar sus líneas), `src/copy/screens/incident-ui.ts` (`TERMINAL_TEXT`), `src/ui/incident/map-cards/terminal/terminal-card.tsx`, `src/ui/catalog/interface-section.tsx` (el especimen de «Salida»), `tests/e2e/snapshots/interface-darwin.png` (se regraba a propósito), guías.

**Interfaces:** la terminal escribe `nc -vz -w 3 <ip> <puerto>` y `dig <nombre>` (Linux, D-10 del capítulo 1; `dig` usa el resolver de «Ajustes de red», decidida 29). La salida de `nc` sigue `ncat_connect.c` de Nmap 7.93 (D-5): con `-vz`, todo va a stderr con el prefijo `Ncat: `; abierto, `Ncat: Version 7.93 ( https://nmap.org/ncat )`, `Ncat: Connected to <ip>:<puerto>.` y `Ncat: 0 bytes sent, 0 bytes received in <t> seconds.`; cerrado, `Ncat: Connection refused.`; tiempo agotado, `Ncat: TIMEOUT.` (leído en el código, que lo imprime desde 7.80). No lleva `[tcp/...]` ni nombre de servicio. La de `dig`, `dig.c` y `dighost.c` de BIND 9.18 (fuentes leídas de la 9.18.50). **Antes de imprimir una línea se lee su origen,** y lo que ya se leyó el 2026-10-11 queda en la guía con su ruta y su fecha: el prefijo `Ncat: ` y las líneas de arriba (`ncat/ncat_connect.c`, `ncat_main.c` y `util.c` de nmap-7.93); las líneas `communications error to` y `no servers could be reached` de `dig`, con la línea de comando que el código imprime entre ellas. **Quedan por leer** antes de imprimir: el texto «Connection refused» (lo da la libc, no `ncat`), las secciones `;; QUESTION SECTION:` y `;; ANSWER SECTION:` (están en `lib/dns/message.c`, que no se descargó), la traducción de `UV_ECONNREFUSED` (`uverr2result.c`) y el número de intentos de `dig` con la configuración de Amazon Linux. Una línea que no se pudo verificar **no se imprime** y la caja dice solo «timeout» o «sin respuesta». El tiempo de la consulta es el RTT del juego, ilustrativo. **Sin bloquear el cierre:** el estudiante puede correr `nc -vz -w 3` contra un puerto cerrado y uno filtrado y `dig` contra un nombre que existe y uno que no, en su EC2 (con `ncat`) y en su Mac (donde `nc` es otro programa y la salida es otra), y pegar las líneas; la tarea las compara con los tests y anota las diferencias en la guía (D-5). Si no las pega, lo que no esté confirmado por el código fuente queda «sin verificar» en la guía de `src/copy/tools/`, no se imprime, y la tarea cierra igual. **Dos datos para el jugador (D-5).** La guía `src/copy/tools/CLAUDE.md` anota, además de la fuente de cada línea, que en Amazon Linux 2023 `nc` se instala con `sudo dnf install nmap-ncat` (no viene en la AMI estándar) y que en macOS la salida se ve distinta (con los dos ejemplos [local] del 2026-10-11 que están en D-5). El juego se lo dice al jugador en el takeaway del 02-01 (Tarea 23), el primer incidente que presenta `nc`.

**Plegado de la salida de `dig` (V11 = B, decidida el 2026-10-11).** La tarjeta imprime la salida completa y real de `dig`, pero por defecto solo se ven las líneas clave, cada una en su sitio: la línea de `status` (`;; ->>HEADER<<-`) y, si la hay, la de la respuesta. Entre ellas una marca dice cuántas líneas hay plegadas en ese tramo (por ejemplo «⋯ 3 líneas plegadas») y un control, «Ver las N líneas restantes», las despliega en su lugar («Ocultar las N líneas restantes» las vuelve a plegar); N es el total de las plegadas. Plegar es ocultar, no dejar de imprimir: las líneas están en la tarjeta y salen completas al desplegar. La salida de `nc` (una o dos líneas) y la de traceroute no se pliegan. Referencia visual: la sección V11 de la página de prototipos (https://claude.ai/artifact/HC9ersrkMisGqkCwnEF8mH). El control es una acción: `DESIGN.md` pide un `Button` para cada una y el glosario de Lucía usa `details`; quien implementa elige y lo justifica en la guía. El especimen del catálogo muestra la tarjeta plegada.

**El SOA de una respuesta negativa.** Un NXDOMAIN real trae el SOA de la zona en la `AUTHORITY SECTION`, así que la salida completa lo imprime: sale de los datos de la Tarea 12, con el TTL de RFC 2308 §3 (el menor entre el TTL del propio SOA y su campo MINIMUM). Lo que el `dig` de BIND 9.18 imprime en la sección de autoridad de otras respuestas (un NOERROR, un SERVFAIL) **no se verificó**: la tarea lo lee de `dig.c`, `dighost.c` y `lib/dns/message.c` antes de imprimir nada ahí, y lo que no confirme no se imprime y la guía lo dice (D-5).

**Tests:**
- `nc-output.test.ts`, `a success prints the Version, Connected and bytes lines of ncat, each with the prefix Ncat: `.
- `a refusal prints Ncat: Connection refused.`.
- `a timeout prints Ncat: TIMEOUT.`.
- `the output of nc has no tcp, no service name and no line that ncat_connect.c does not print`.
- `every line nc prints matches the format of ncat_connect.c of Nmap 7.93`.
- `dig-output.test.ts`, `the header line has the opcode, the status and the id`.
- `an NXDOMAIN answer prints status NXDOMAIN and a SERVFAIL answer prints status SERVFAIL`.
- `an NXDOMAIN prints the SOA of the zone in the authority section with the TTL of RFC 2308`.
- `the authority section of a NOERROR and of a SERVFAIL prints only what the source confirms`.
- `a timeout prints communications error and no servers could be reached, as BIND 9.18 does`.
- `a timeout prints no line that the source cannot confirm`.
- `a refused query prints communications error with connection refused`.
- `the server line has the resolver ip and the port 53`.
- `every line dig prints matches the format of dig.c and dighost.c of BIND 9.18`.
- `terminal-card.test.ts`, `the line of an nc uses -vz and -w 3 in the Linux syntax`.
- `the line of a dig names the name and no server`.
- `output-card.test.ts`, `the card lists the lines of the tool as written` y `a traceroute keeps its numbered list`.
- `the output of dig shows only the status line and the answer until the rest is unfolded`.
- `a mark between the visible lines says how many lines are folded there`.
- `the control says how many lines are hidden and unfolds them in place`.
- `the folded lines are printed, not dropped`.
- `the output of nc and the output of a traceroute are not folded`.
- Playwright `entities.spec.ts`: `the interface specimen of the output card is part of the capture`.
- Cierre: la captura de la interfaz cambia solo por el especimen nuevo, que muestra la tarjeta plegada.

**Review Focus:** 13, 15 y 18.

**Commit:** `feat: print the output of nc and dig the way the tools do`.

---

### Tarea 18 bis: Un solo estándar para los avisos y los errores

**Propósito:** que todo aviso o error que el jugador ve use una sola pieza del sistema de diseño, con una apariencia por tipo y sin que el color sea lo único que lo distinga. Nace de lo que pidió el estudiante el 2026-10-11 al decidir V17 = A: estandarizar los avisos y los errores de todo el juego. **Depende de:** la Tarea 17 (que trae la mudanza de `src/design/primitives/`, aprobada el 2026-10-11, y regraba la captura de la interfaz en orden). V18 está decidida (2026-10-11): la primitiva `Message`, con cuatro variantes, el aspecto «Pestaña» y `success` en verde; ninguna decisión pendiente bloquea esta tarea. La Tarea 19 depende de esta: el rechazo de una entrada de una tabla (V17 = A) se dice con el estándar.

**V18, decidida el 2026-10-11** (la página de prototipos es la de la Tarea 0, sección V18: https://claude.ai/artifact/HC9ersrkMisGqkCwnEF8mH):
- [x] Preparar la página de prototipos, con las primitivas y los tokens reales de `DESIGN.md` (nunca dibujos de texto): cada variante junto a la apariencia de hoy de cada mensaje del inventario, y las opciones.
- [x] Recoger la opción: **A, la primitiva `Message`,** con cuatro variantes (`note`, `success`, `warning` y `error`), y la mudanza de carpetas, aprobada.
- [x] Recoger el aspecto: el estudiante rechazó la franja izquierda en `note` y `success`, que se parecía a lo que genera una IA, y eligió la alternativa 3, **«Pestaña»** (sección V18, bloque «A · Otras formas»).
- [x] Recoger el color de `success`: **verde**, apagado, como la tinta de un sello.

**El aspecto: «Pestaña».** Cada `Message` es texto enmarcado con una pestaña de carpeta que sobresale arriba y dice su tipo: «NOTA», «✓ CORRECTO», «! AVISO» y «✕ ERROR» (mayúsculas por estilo). Sin franja izquierda. Lo fija el prototipo (clases `fo`, `fo__tab` y `fo__text` del HTML de la sección V18, alternativa 3):
- **Marco:** borde de `--stroke-regular`, fondo `--color-surface`, texto en tinta y esquinas redondeadas (`--radius`) salvo la de arriba a la izquierda, donde nace la pestaña.
- **Pestaña:** arriba a la izquierda, pegada al marco, en negrita, mayúsculas y `--text-xs` con `--tracking-caps`, con las esquinas de arriba redondeadas (`--radius-tile`) y sin borde abajo.
- **`note`:** marco y pestaña en `--color-ink-soft`.
- **`success`:** marco en `--color-success` con `--stroke-bold`; pestaña rellena de `--color-success`, con texto `--color-on-fill`, y la marca ✓.
- **`warning`:** marco y pestaña con borde discontinuo, en tinta, y la marca «!».
- **`error`:** marco con borde doble (`--stroke-double`) en `--color-danger`; pestaña rellena de `--color-danger`, con texto `--color-on-fill`, y la marca ✕.
- **Accesibilidad:** la pestaña es decorativa (`aria-hidden`) y una palabra solo para lectores, antes del texto («Nota: », «Correcto: », «Aviso: », «Error: »), dice el tipo.
- **Costo:** la pestaña sobresale y pide un margen arriba; con varios mensajes seguidos hace falta espacio entre ellos (el prototipo usa `margin-top: 1.9rem`).
- **Estructura:** el prototipo arma cada mensaje con un `div` (el marco), un `span` (la pestaña) y un `div` con el texto. `Message` es un `p` (más abajo): la pestaña va dentro del `p`, posicionada fuera de su caja, para que los roles y las pruebas con `.closest('p')` no cambien. Si eso no se puede sin romperlos, quien implementa lo dice y se decide con el estudiante.
- **Contraste medido en el prototipo** (WCAG 2.2, claro / oscuro; mínimo 4.5 para texto y 3 para bordes): texto de la pestaña de error, `--color-on-fill` sobre rojo, 5.26 / 6.74; marco de error, rojo sobre superficie, 5.26 / 5.96 (mínimo 3); texto de la pestaña de nota, tinta suave sobre superficie, 6.45 / 6.61 (el par que el prototipo midió para el sello de nota); texto de aviso, tinta sobre superficie, 13.36 / 12.09.
- **El verde de `success`:** token `--palette-green` (`#3a6b4f` en claro y `#86b896` en los dos bloques oscuros) y rol `--color-success: var(--palette-green)`, copiados del `:root` de la página de prototipos. Contraste: verde sobre la superficie, 5.83 en claro y 6.67 en oscuro; texto de relleno sobre el verde, 5.83 y 7.54 (medidos en el prototipo y recalculados con la fórmula de WCAG el 2026-10-11). Esta tarea suma el color a la paleta de `DESIGN.md`, con su rol y estas cifras, y el par a `src/design/tokens.test.ts`.
- **Verde y rojo casi no se separan con deuteranopía,** así que el color no basta: cada variante se distingue por su palabra y su marca («✓ CORRECTO» frente a «✕ ERROR») y por la forma del borde (grueso, doble). Una prueba lo fija (más abajo).

**Inventario de lo que el jugador ve hoy.** Hecho el 2026-10-11 leyendo `src/ui/`, `src/game/view/`, `src/copy/`, `src/scene/`, `src/design/`, `src/styles.css` y `DESIGN.md`. «Error» es una respuesta o una acción rechazada o equivocada; «aviso» informa sin rechazar nada; «alerta» es un peligro que ocurre ahora.

| # | Mensaje | Dónde se ve | Qué lo dispara | Cómo se ve hoy | Rol | Tipo | ¿Entra? |
|---|---------|-------------|----------------|----------------|-----|------|---------|
| 1 | «¡Algo raro está entrando!» (`LUCIA_TEXT.intrusion`) | tarjeta de Lucía, `src/ui/incident/lucia-card.tsx` | un flujo prohibido llega a su dispositivo (`isIntruding`); se anuncia otra vez en cada episodio (`key={session.alerts}`) | `p.lucia__alert`: texto en negrita en `--color-danger`, sin marco ni fondo | `alert` | alerta | Sí |
| 2 | «Todavía no se cumple: «…»» (una por tarea) y «Además, algo prohibido está entrando.» (`LUCIA_TEXT.failing` e `intruding`) | tarjeta de Lucía, `RejectionReply` en `lucia-card.tsx` | «Enviar solución» con tareas sin cumplir o con un intruso entrando (`submit` guarda `session.rejection`) | un `p` por línea dentro de `div.lucia__reply`: marco punteado de 1,5 px en `--color-danger`, texto en tinta | el contenedor es `status`, siempre presente y vacío hasta el rechazo; una prueba exige que el hijo se vuelva a montar en cada intento | error (solución rechazada) | Sí |
| 3 | Las líneas de la ficha elegida (`lines`) | tarjeta de un dispositivo de un incidente `identify`, `src/ui/incident/map-cards/identify-card.tsx` | «Listo» con una ficha que trae `lines` | `p.feedback` si es correcta (fondo `--color-shade`, borde izquierdo de 4 px en tinta suave) o `p.feedback.feedback--wrong` si no (texto y borde en `--color-danger`; la misma forma de borde) | `status` en cada línea | error (ficha incorrecta) o confirmación (correcta) | Sí |
| 4 | «Correcto.» o «No es eso.» y la retroalimentación de la opción (`EXPLANATION_TEXT.right` y `wrong`) | `OptionList` de `src/ui/incident/explanation-card.tsx`, que usan la pregunta de Lucía y cada caso del 14 (`src/ui/incident/case-card.tsx`) | elegir una opción (`chooseExplanation`, `nameCause`) | `p.feedback` o `p.feedback.feedback--wrong` con la palabra en `<strong>`: aquí hay palabra además del color | ninguno | error (opción incorrecta) o confirmación | Sí |
| 5 | La razón de que el emisor no pudo mandar un traceroute (`route.error`, de `describeOutcome`) | terminal, `RouteOutput` en `src/ui/incident/map-cards/terminal/terminal-card.tsx` (la Tarea 18 lo pasa a la tarjeta «Salida») | un traceroute que el propio dispositivo no puede enviar (`localError`) | `p.muted`: tinta suave, sin marco ni marca | ninguno | aviso | Sí: es texto del juego |
| 6 | «Incidente no encontrado» e «Incidente bloqueado» (`NOTICE_TEXT`) | `src/ui/notice-page.tsx`, abierta por `src/ui/incident-page.tsx` | la URL de un incidente que no existe o que aún no se abre | `h1` y `p` sin estilo propio | ninguno | error (no existe) y aviso (bloqueado) | Sí, el `p` del cuerpo |
| 7 | La marca «!» de una etiqueta y su texto para lectores (`MAP_TEXT.alert`) | `src/scene/overlay/piece-label.tsx`; `.map-button__alert` en `primitives.css` | la pieza está en estado `intruded` | círculo de 15 px en `--color-danger` con «!» en `--color-on-fill` | texto `sr-only` dentro del botón | alerta | No: es el estado de una pieza |
| 8 | Los sellos del paquete: ✓, ✕ («Bloqueado.»), doble anillo («Entró y no debía.»), ? («Perdido.») y ! («Apareció un aviso.»), de `STAMP_TEXT` | `src/scene/entities/stamp.tsx`; `.stamp--*` en `src/styles.css` | cada paquete al terminar | `--color-danger` el bloqueado y el intruso; tinta el que llegó y el aviso; punteado el perdido | botón con el texto del sello | estado del paquete | No |
| 9 | Los avisos de la red simulada: el paquete `warning` (triángulo con «!») y las frases de la caja de inspección (`describeReason`; por ejemplo «El propio dispositivo avisa que no pudo entregar el paquete.») | `src/scene/entities/packet.tsx`, `src/copy/reasons.ts`, `src/ui/incident/inspection-box.tsx` | un router o el propio dispositivo manda un aviso | forma en el mapa; texto normal en la caja | `aria-live` de la caja | contenido de la lección: lo que dice la red | No |
| 10 | El candado (`MAP_TEXT.locked`), «(bloqueado)» y «Próximamente» (`ROADMAP_TEXT`) y la guía «Elige una ficha de cada bandeja.» (`TERMINAL_TEXT.incomplete`) | `piece-label.tsx`, `src/ui/roadmap.tsx`, la terminal | pieza que no se cambia, incidente sin abrir, línea incompleta | estados y un marcador de hueco | — | no son mensajes | No |
| 11 | Llega con el capítulo 2: el rechazo de una entrada de la tabla de registros (la regla del CNAME; `recordProblem`) | `TableCard`, Tarea 19 | `placeEntry` que el motor rechaza | una línea bajo la tabla (V17 = A) | región `status` que ya existía | error | Sí: nace con el estándar |
| 12 | Llega con el capítulo 2: el rechazo de una ruta a un destino que ya tiene ruta (`addRoute` devuelve la misma red, Tarea 9) | tarjeta de rutas, Tarea 19 | `placeEntry` de una ruta repetida | hoy no dice nada | — | error | Sí, si la Tarea 15 guarda el problema como el del CNAME; si no, la tarjeta sigue callando |
| 13 | Llega con el capítulo 2: las líneas de error de `nc` y de `dig` («Connection refused», «connection timed out; no servers could be reached», `status: NXDOMAIN`) | tarjeta «Salida», Tarea 18 | lo que imprime la herramienta | líneas literales en letra de código | — | salida de una herramienta | No: se imprime lo que imprime la herramienta |

- **Resumen.** Seis lugares donde la interfaz habla (filas 1 a 6), con cinco apariencias (las filas 3 y 4 comparten `feedback`) y tres maneras de anunciarse (`alert`, `status`, ninguna); cuatro familias que no son mensajes de la interfaz (7 a 10); tres que llegan con el capítulo 2 (11 a 13).
- **Rechazos que hoy no dicen nada.** Poner una regla de firewall que ya está, elegir un ajuste que ya está puesto y, desde la Tarea 9, repetir una ruta no muestran ningún mensaje: `move` y `setSetting` de `src/game/session.ts` devuelven el mismo estado. Los «rechazos de ajustes» y de rutas que el estudiante pidió inventariar no existen hoy como mensaje. Lo que hoy se llama rechazo de un firewall es la respuesta de Lucía a una solución (fila 2). Si alguno de los silenciosos debe hablar, lo decide el estudiante.
- **Lo que no se pudo determinar.** Si el texto de cada ficha incorrecta de un incidente `identify` dice en palabras que es incorrecta: la fila 3 la distingue de la correcta solo por el color y por la palabra que traiga cada texto (en el 01-01 las incorrectas no traen una palabra fija). El contraste de la apariencia elegida se midió en el prototipo (arriba).

**El estándar (V18 = A).**
- **Decidido: una primitiva nueva, `Message`,** con cuatro variantes: `note` (lo neutro), `success` (un acierto: «Correcto.» y la ficha correcta), `warning` (informa y no rechaza) y `error` (lo rechazado o equivocado, y el peligro que ocurre ahora). Razón, según `DESIGN.md` («Adding a variant instead of a new element»): ninguna primitiva existente puede hacer este papel con una variante. `Button`, `Choice`, `ChipTray`, `Tabs`, `NameTag` y `Table` son controles o rótulos, y `Card` es un panel con franja, título y sombra: un mensaje de una línea dentro de una tarjeta sería una tarjeta dentro de otra. Hoy cuatro clases sueltas de `src/styles.css` hacen el trabajo (`.feedback`, `.feedback--wrong`, `.lucia__alert` y `.lucia__reply p`) y otros dos mensajes (el del traceroute y la página de aviso) usan texto suelto, `muted` o nada: es el elemento hermano que la regla prohíbe.
- **Descartada por V18 = A: una variante de `Card`,** una tarjeta sin franja y de una línea. En contra: `Card` es una sección con su `h2` y su sombra, la variante tendría que esconder lo que la define y cada mensaje sería un panel dentro de otro.

**Qué variante lleva cada mensaje (V18 = A).** El texto de ninguno cambia, y se conserva el rol de cada uno.

| Mensaje | Variante | Rol que se conserva |
|---------|----------|---------------------|
| 1 · aviso de intruso | `error` | `alert`, que pasa el dueño |
| 2 · respuesta de Lucía | `error` | el de su contenedor `status` |
| 3 · ficha del identify | `success` si es correcta, `error` si no | `status` |
| 4 · opción de una pregunta | `success` («Correcto.») o `error` («No es eso.») | ninguno |
| 5 · traceroute que el emisor no pudo mandar | `warning` | ninguno |
| 6 · no encontrado y bloqueado | `error` y `warning` | ninguno |
| 11 y 12 · entrada rechazada | `error` | `status`, en una región que ya existía |

**Fuera del estándar (la lista que el estudiante vio en la sección V18 al elegir A):** los estados de una pieza (la marca de alerta, el candado y los sellos: `DESIGN.md` dice que un sello es un estado del paquete y nunca un elemento hermano), lo que dice la red simulada (el paquete de aviso y las frases de la caja de inspección: son la lección) y la salida literal de `nc` y de `dig` (es lo que imprime la herramienta, no un mensaje del juego).

**Carpeta: mudanza aprobada el 2026-10-11 (se hace en la Tarea 17).** Con `Table`, `src/design/primitives/` llegaba a 12 de 12 y `Message` sumaba `message.tsx` y `message.test.tsx` (14). El estudiante aprobó el remedio que `DESIGN.md` ya preveía: partir la carpeta por familias, en un commit propio, `refactor(design): split the primitives by family to make room`, antes del de la Tarea 17 (hecho: `8a024d9`). `card`, `tabs` y `table`, con sus tests, viven en `src/design/primitives/panels/` (con su `CLAUDE.md`); `primitives.css` se queda donde está porque `src/styles.css` lo importa. `src/design/primitives/` queda en 6 archivos (`button`, `choice`, `name-tag`, `primitives.css` y los tests de los dos primeros) y, con `Message`, en 8. Esta tarea no mueve nada.

**Pasos.** Con el aspecto y el color elegidos no queda ningún tramo que espere una decisión; el orden es el de abajo.
- [ ] La API de `Message` y sus pruebas de comportamiento y de accesibilidad (`message.tsx`, `message.test.tsx`).
- [ ] El CSS de las cuatro variantes («Pestaña»), solo con tokens (`primitives.css`), y el verde de `success` en `tokens.css`, `DESIGN.md` y `tokens.test.ts`.
- [ ] La migración de los seis mensajes a `Message` y el retiro de las clases viejas.
- [ ] Los especímenes del catálogo (uno por variante) y la captura de la interfaz regrabada, revisando el diff.
- [ ] Las pruebas de geometría (la pestaña no tapa el texto del mensaje de arriba) y el `git grep` de cierre.

**Archivos:**
- Create: `src/design/primitives/message.tsx` y `message.test.tsx` (V18 = A).
- Modify: `src/design/primitives/primitives.css` (las variantes, solo con tokens), `src/design/index.ts`, `src/design/CLAUDE.md`, `src/design/primitives/CLAUDE.md`, `DESIGN.md` (una fila en la tabla de primitivas, el paso 4 y el párrafo «What guards the standard»), `src/styles.css` (salen `.feedback`, `.feedback--wrong`, `.lucia__alert` y la regla `.lucia__reply p`; el margen de `.lucia__reply` se queda), `src/ui/incident/lucia-card.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/incident/map-cards/identify-card.tsx`, la salida del traceroute donde la deje la Tarea 18 (`terminal-card.tsx` hoy, la tarjeta «Salida» después), `src/ui/notice-page.tsx`, `src/ui/catalog/interface-section.tsx` y `INTERFACE_TEXT` en `src/copy/screens/ui.ts` (los especímenes `alert`, `reply`, `right` y `wrong` pasan a la primitiva y se suma uno por variante), `src/design/tokens.css` y `src/design/tokens.test.ts` (el verde de `success`: `--palette-green` y `--color-success`), `tests/e2e/entities.spec.ts`, `tests/e2e/snapshots/interface-darwin.png` (se regraba a propósito), las guías `src/ui/CLAUDE.md`, `src/ui/incident/CLAUDE.md` y `src/ui/incident/map-cards/CLAUDE.md`.
- Modify, a propósito: las dos aserciones de `identify-card.test.tsx` (`writes the line of a right chip as a note and the line of a wrong chip as an error`, que pasa a llamarse `writes the line of a right chip as a success message and the line of a wrong chip as an error`) que leen las clases `feedback` y `feedback--wrong`; leerán la variante del estándar. Las pruebas que leen los roles `status` y `alert` (`lucia-card.test.tsx`, `incident-screen.test.tsx`, `identify-card.test.tsx` y `tests/e2e/incidents.spec.ts`) y las que usan `.closest('p')` (`case-card.test.tsx`) no cambian: por eso `Message` es un `p` y no pone rol.

**Interfaces:** `Message` recibe un `variant` (`note` por omisión, `success`, `warning` o `error`) y su contenido; es un `p`; pasa los demás atributos HTML (`role`, `aria-*`, `id`) como lo hace `Button`, sin rol propio, y no acepta `className` ni `style`. Cada variante lleva su pestaña con su palabra y su marca («NOTA», «✓ CORRECTO», «! AVISO», «✕ ERROR») y su forma de borde, además del color (`DESIGN.md`, «Never colour alone»); hoy el aviso de intruso es solo negrita y color. Los colores son roles de `tokens.css`: se suma `--color-success` (verde) y su par entra en `tokens.test.ts`. El aspecto es el de «Pestaña» (arriba).

**Cómo se comprueba que ninguna vista pinta un aviso o un error fuera del estándar.** `DESIGN.md` recoge que el estudiante decidió el 2026-10-09 no tener pruebas sobre el CSS ni reglas de lint para el estándar. Esta tarea no lo cambia: la guarda es una prueba de DOM renderizado, `every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it`, que monta la pantalla de un incidente con firewall (el aviso de intruso y el rechazo), de uno de identificación (una ficha incorrecta), de un caso del 14 (una causa equivocada) y de uno `send` con un traceroute que el emisor no puede mandar, y comprueba que cada texto está dentro de un `Message` de la variante que dice la tabla y que ningún `role="alert"` de la página está fuera de uno. No ve un mensaje nuevo en una vista que la prueba no recorre; ese lo encuentra la revisión, como dice `DESIGN.md`. Además, el Cierre corre `git grep` sobre las clases retiradas. Si el estudiante quiere una guarda que lea el código (una regla de lint o una prueba que lea los archivos), cambia lo que decidió el 2026-10-09 y lo decide él, y `DESIGN.md` se actualiza con lo que decida.

**Tests:**
- `message.test.tsx`, `renders a paragraph with its text and the note variant unless it says otherwise`.
- `renders the success, warning and error variants`.
- `each variant of Message carries its own mark or word, not only a colour`.
- `the success variant shows a check before its text`.
- `success and error differ by their word and mark, not only by colour`.
- `the tab is hidden from assistive technology and a visually hidden word names the kind before the text`.
- `has no role of its own and keeps the role and the aria attributes its owner gives it`.
- `takes no className and no style`.
- Playwright `entities.spec.ts`: `the interface specimens of Message are part of the capture`.
- `each variant of Message is told apart by a mark or a border shape and not only by colour` (mide el estilo computado en un navegador real, la excepción que `DESIGN.md` ya admite para lo que una captura no ve).
- `tokens.test.ts`: `the text of every variant of Message keeps 4.5:1 on its background and its mark keeps 3:1`; `the success green keeps 4.5:1 on the surface and under its fill text, in light and in dark` (el par nuevo: 5.83 y 6.67 sobre la superficie, 5.83 y 7.54 bajo el texto de relleno).
- Playwright `entities.spec.ts`: `the tab of a Message sticks out above its frame without covering the message above it`.
- `lucia-card.test.tsx`: `the intrusion alert is an error message and is still announced as an alert`.
- `the rejection of a solution shows an error message per failing task and one for an intruder, inside the status region that was already there`.
- `identify-card.test.tsx`: `a wrong chip shows its lines as an error message and a right one as a success message`.
- `case-card.test.tsx`: `a wrong cause shows its feedback as an error message that starts with No es eso and the right one as a success message that starts with Correcto`.
- `incident-screen.test.tsx`: `the feedback of a wrong option of the question of Lucía is an error message`.
- `a traceroute the sender cannot send shows its reason as a warning message`.
- `every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it`.
- `app.test.tsx`: `an unknown incident shows its notice as an error message and a locked one as a warning message`.
- Cierre: `pnpm check` verde; `git diff --exit-code src/levels/04-iaas/golden-traces.json`; las pruebas de los capítulos 1 y 4 corren sin editarse, salvo las dos aserciones listadas; `git grep -nE "feedback--wrong|lucia__alert|lucia__reply p" -- src ':!*.test.*'` no devuelve nada; la captura de la interfaz cambia solo por los especímenes de avisos y errores (los de hoy pasan a la primitiva y se suma uno por variante) y la de piezas no cambia.

**Review Focus:** 2, 15, 16 y 21.

**Commit:** `feat(design): give every warning and error one standard`.

---

### Tarea 19: Las tarjetas de tablas y de ajustes, la tarjeta con pestañas de cada pieza y el reloj del juego

**Propósito:** que el jugador abra y edite la tabla de rutas, vea la de traducciones y la caché, edite los registros, cambie la dirección de escucha y el servidor DNS, y adelante el reloj. Cada pieza (dispositivo, router o servidor de nombres) tiene **un solo botón** en su etiqueta; ese botón abre una tarjeta con `Tabs`, una pestaña por cada tarjeta de esa pieza, y una pieza con una sola tarjeta no lleva pestañas (V15 = B). El reloj no vive en ninguna pieza: es una tarjeta «Reloj del juego» del panel del incidente, bajo la de Lucía (V16 = C). **Depende de:** las Tareas 15 (la sesión y el reloj), 17 (`Table`) y 18 bis (el estándar de avisos y errores: el rechazo de una entrada lo usa, V17 = A). V10, V15, V16, V17 y V18 están decididas (2026-10-11); la línea bajo la tabla usa el estándar de la Tarea 18 bis, que va antes. Ninguna decisión pendiente la bloquea.

**Archivos:**
- Create: `src/game/view/cards/table-card.ts` y `table-card.test.ts`; `src/ui/incident/map-cards/table-card.tsx` y `table-card.test.tsx`; la tarjeta de una pieza con pestañas, su modelo en `game` y su vista en `ui` (por ejemplo `src/game/view/cards/piece-card.ts` y `src/ui/incident/map-cards/piece-card.tsx`, con sus tests); la tarjeta «Reloj del juego» (por ejemplo `src/ui/incident/clock-card.tsx`; el texto, «Reloj del juego», «Esperar 1 min» y «0 min 00 s», va en `src/copy/screens/incident-ui.ts`). Con estos archivos `src/game/view/cards/` y `src/ui/incident/` quedan en 12 de 12: la tarjeta del reloj no lleva un test aparte, sus pruebas viven en `incident-screen.test.tsx`; si hace falta otro archivo, se parte la carpeta por familia como en la Tarea 1.
- Modify: `src/game/view/cards/settings-card.ts` y `settings-card.test.ts` (los ajustes y los servicios), `src/game/view/piece-id.ts` (se quita `PIECE_ID.settings` y `PIECE_ID.entry(kind, id)` ya no nace; decidida 22), `pieces.ts` (el campo `settings` de una pieza y `SettingsEntry` desaparecen; una pieza es configurable si tiene al menos una tarjeta), `src/scene/overlay/piece-label.tsx` (la etiqueta pierde su segundo botón) y `primitives.css` (sale `.map-labels`), `src/ui/incident/map-cards/settings-card.tsx` y su test, `src/ui/incident/incident-screen.tsx` (`activate` ya no mira `piece.settings`; pinta la tarjeta de la pieza y, bajo la de Lucía, la del reloj), `SETTINGS_TEXT` de `src/copy/screens/incident-ui.ts` (sale `entry`), `DESIGN.md` (la frase del «segundo botón» de una etiqueta) y las guías `src/game/view/CLAUDE.md`, `src/game/view/cards/CLAUDE.md`, `src/scene/overlay/CLAUDE.md` y `src/ui/incident/map-cards/CLAUDE.md`.
- Modify, a propósito, las pruebas del capítulo 1 que leen el segundo botón (lista cerrada en «Global Constraints»; lo que prueban se conserva, cambia por dónde se llega a la tarjeta): `pieces.test.ts`, `piece-label.test.tsx`, `terminal-card.test.ts`, `settings-card.test.ts`, `settings-card.test.tsx`, `incident-screen.test.tsx`, `chapter-1.test.ts`, `tests/e2e/chapter-1/chapter-1-play.ts`, `tests/e2e/chapter-1/chapter-1.spec.ts` y `tests/e2e/card-layout.spec.ts`.

**Interfaces:** una `TableCard` es el view model de una tabla: título, columnas (la de rutas se llama «Por dónde sale» hasta que `next-hop` se conoce; decidida 23), filas, cuáles están en uso, y, si es editable, las bandejas, el botón de quitar de cada fila y el problema que el motor dio al rechazar una entrada. Ese problema se muestra como una línea bajo la tabla (V17 = A), dicha con el estándar de avisos y errores de la Tarea 18 bis y puesta en una región `status` que ya existía antes del problema, como la respuesta de Lucía. Rutas: de lectura en `tu-laptop` (06) y editable en un router (07 y el caso 5 del 14). Traducciones y caché: de lectura. Registros: editable, y oculta los registros propios de la zona bajo una línea. «Ajustes de red» suma la bandeja del servidor DNS; «Servicios» trae una bandeja de dirección de escucha por servicio.

**La tarjeta de una pieza (V15 = B).** Su modelo lista las tarjetas que la pieza tiene en ese incidente (la terminal, «Ajustes de red», «Servicios», «Tabla de rutas», «Tabla de traducciones», «Registros» y «Caché») y cuál abre primero. Abre primero la que el incidente nombra (un dato opcional del contrato, Tarea 14: la pestaña inicial es la que pide la tarea del incidente) y, sin ese dato, la terminal si la pieza la tiene, luego los ajustes o los servicios y luego las tablas. El 01-07 no necesita el dato: `tu-laptop` abre primero «Terminal», como hoy, y su reporte manda abrir después «Ajustes de red», que es el nombre de la segunda pestaña. Con una sola tarjeta no hay `Tabs` y la tarjeta se abre como hoy. Con varias, la franja lleva el título de la tarjeta de la pestaña elegida («Terminal de tu-laptop», «Ajustes de red de tu-laptop»), como hoy, y el nombre accesible del diálogo lo sigue: así las búsquedas por `dialog` que hacen las pruebas del capítulo 1 en el 01-07 (`/^Terminal de/`, «Terminal de tu-laptop», «Ajustes de red de tu-laptop») siguen valiendo mientras esa pestaña esté elegida. Las pestañas se llaman como las tarjetas («Terminal», «Ajustes de red»…) sin repetir el nombre del dispositivo, y el pie («Enviar», «Listo») es el de la pestaña elegida. Radix monta solo el panel elegido (`DESIGN.md`, fila de `Tabs`): lo que el jugador tiene a medias (las fichas elegidas de la terminal, la bandeja de una ruta, lo que desplegó en la «Salida») vive por encima de las pestañas, y cambiar de pestaña no lo pierde. `PIECE_ID.settings` desaparece y no lo reemplaza nada: ninguna etiqueta tiene más de un botón, así que ninguna tarjeta necesita un id propio y la pieza se abre con el suyo. Escape cierra la tarjeta y devuelve el foco al único botón de la etiqueta.

**«Reloj del juego» (V16 = C).** Una tarjeta del panel del incidente, bajo la de Lucía, con el reloj («0 min 00 s») y las fichas «Esperar 1 min» y «Esperar 5 min» (`Choice` sin `pressed`, como en el prototipo), que mandan `wait`. Solo aparece en un incidente con reloj (`send.clock`). El tiempo es del juego y no de una pieza: ni la terminal ni la tarjeta de la caché llevan fichas de espera. Esperar no borra los envíos ni la última respuesta de la terminal.

**La tarjeta de clasificar (D-6 = A; la usa el 02-04, Tarea 26; ver «Lo que el 04 pide al código»).** La abre la pieza de su dueño (`tu-laptop`), como cualquier tarjeta de pieza (V15 = B); las piezas de los elementos que clasifica (`impresora`, `laptop-andres`) no abren tarjeta propia. El modelo, en `game`, calcula: el bloque con su máscara; la fila de los 32 bits de la IP del dueño, con los primeros bits del prefijo marcados y los demás vacíos, agrupados en cuatro números; cada elemento con su IP partida en la parte del bloque y la parte del equipo (la partición en texto solo vale cuando el prefijo cae en un punto, como en /24; con otro prefijo, la partición se ve solo en la fila de bits); las dos bandejas con los elementos que ya tienen respuesta, y «Por clasificar» con el resto, todo derivado de `session.answers`; y, para cada elemento ya puesto, su línea (cabe o no cabe, con los primeros números de su IP y los del bloque). La vista pinta la fila de bits, los elementos y las dos bandejas con las primitivas que hay (`Card`, `ChipTray`, `Button`); la línea de cada elemento usa `Message` (`success` o `error`). Una pieza puesta dentro lleva la marca «dentro del bloque» en su `PieceView`, que la escena usa para el contorno (Tarea 21); `tu-laptop`, dueña del bloque, está dentro desde el principio. **Carpetas:** `src/game/view/cards/` queda en 12 de 12 con los archivos de esta tarea y `src/ui/incident/map-cards/` casi llena; la regla cuenta archivos y no subcarpetas, así que la tarjeta de clasificar nace en una subcarpeta `identify/` de cada una (`classify-card.ts` y su prueba; `classify-card.tsx` y su prueba; un `CLAUDE.md` por subcarpeta). **Por decidir al implementar (no lo decidió el estudiante):** si una pieza se coloca al soltarla (el contorno la sigue) o al pulsar «Listo» (como hoy en `identify`).

**Tests:**
- `table-card.test.ts`, `the routes card of a device lists its connected route and its default route`.
- `the column of the next hop is called Por dónde sale until next-hop is known`.
- `the row the last packet used is marked`.
- `the translations card lists the rows of the sent packets in order`.
- `the records card hides the records of the zone itself under one muted line`.
- `a rejected entry carries the problem the engine gave`.
- `the cache card lists the answers with the seconds left`.
- `settings-card.test.ts`, `the services card has a tray for the listen address of each service`.
- `the network settings card shows the dns server behind the term dhcp once it is known`.
- `piece-card.test.ts`, `a piece with several cards offers one tab per card and a piece with one card offers none`.
- `a router offers its tables, a device its terminal, its settings and its services, and a server of names its records and its cache`.
- `the first tab is the card the incident names and, when it names none, the terminal`.
- `01-07: the laptop offers the tabs Terminal and Ajustes de red and opens on the terminal`.
- `pieces.test.ts`, `a laptop that sends and has settings opens one card with its terminal and its settings, from its own piece` (reemplaza a `a laptop that sends and has settings opens its terminal and its settings card, each from its own entry`).
- `a send incident with no settings gives no piece more than one card` (reemplaza a `a send incident with no settings gives no piece a settings entry`).
- `piece-label.test.tsx`, `a label draws one button however many cards its piece has`.
- `inspects the piece from its only button`.
- `piece-card.test.tsx`, `a piece with one card opens it with no tabs`.
- `switching tabs keeps what was picked in the terminal and the lines unfolded in its output`.
- `Escape closes the card and the focus goes back to the only button of the label`.
- `classify-card.test.ts`, `the bits row of an IP has its 32 bits in four numbers and marks the first ones the prefix fixes`.
- `an IP is split at the prefix into the part of the block and the part of the device, and only for a prefix that ends at a dot`.
- `an item with no answer waits to be classified and an answered one is in its bin`.
- `the line of a placed item says whether it fits, with the first numbers of its IP and the block`.
- `pieces.test.ts`, `a piece the player placed inside the block carries the mark of being inside, and the owner of the card is inside from the start`.
- `only the owner of a classify card opens it: the pieces of the items open no card`.
- `classify-card.test.tsx`, `shows the block, the mask, the bits row and the two bins`.
- `placing an item in a bin reports the answer of that item`.
- `an item is placed with the keyboard`.
- `the line of a placed item shows as a success or an error message`.
- `table-card.test.tsx`, `placing a route needs both trays and then places it`.
- `removing a row calls the move with that row`.
- `a read-only table has no trays and no buttons`.
- `a rejected entry shows its problem as an error message under the table, in a status region that was already there`.
- `Escape closes the card and the focus goes to the title when it opens`.
- `incident-screen.test.tsx`, `the clock card shows only in an incident that has a clock`.
- `the clock card sits below the card of Lucía`.
- `waiting advances the game clock and the cache measures against it`.
- `waiting keeps the sends and the last answer of the terminal`.
- `the wait chips are reached and used with the keyboard`.
- Playwright `chapter-1.spec.ts`: `in 07 picking the gateway in the Ajustes de red tab changes the stamps of the ping` (reemplaza a `in 07 picking the gateway in the Ajustes de red card changes the stamps of the ping`).
- Cierre: ninguna captura cambia (los especímenes ya existen); las tarjetas del capítulo 4 sin cambiar de contenido; el 01-07 se juega igual, con un botón menos en la etiqueta de `tu-laptop`.

**Review Focus:** 2, 9, 10, 11, 16, 21, 22 y 24.

**Commit:** `feat(ui): open the cards of a piece from one button with tabs and add the clock card`.

---

### Tarea 19 bis: Pruebas e2e deterministas y chequeo rápido por tarea

**Propósito:** que una prueba de layout o de tiempos dé el mismo resultado en cada corrida, y que cada tarea se cierre con un chequeo corto, sin perder rigor: el mismo rigor, con menos espera. La aprobó el estudiante el 2026-10-11. Está escrita después de la 19 porque nace de ella, pero **se ejecuta antes de retomarla**. **Depende de:** la mudanza `875c27d`, que ya está en `feat/chapter-2`; ninguna decisión pendiente la bloquea.

**Por qué (medido en los registros de los agentes).**
- Las tareas del motor tardan de 5 a 30 min.
- Las de pantalla tardan de 30 a 150 min.
- Casi todo ese tiempo es esperar las e2e.
- La Tarea 19 llevaba unas 2,5 h, unas 70 corridas de e2e y unos 91 min en shell, persiguiendo un fallo que solo aparecía a veces.
- La suite completa tarda unos 1,8 min, más `pnpm build` en cada corrida.
- Objetivo: el mismo rigor, con menos espera.

**Estado de la Tarea 19 al abrirse esta.**
- Quedó en pausa, sin commit de tarea.
- Su trabajo está guardado en la rama temporal `wip/task-19` (commit `8c97014`). La mudanza `875c27d` ya está en `feat/chapter-2`.
- Esta tarea se hace sobre `875c27d`. La 19 se retoma encima, con el fallo ya reproducible y con la regla C (más abajo): se cierra con `pnpm check:fast` y las specs que ella nombra o que cubren lo que toca (`tests/e2e/chapter-1/chapter-1.spec.ts`, `tests/e2e/card-layout.spec.ts` e `tests/e2e/incidents.spec.ts`, que miran la etiqueta y las tarjetas de las piezas).
- **El fallo:** `tests/e2e/card-layout.spec.ts`, prueba «a card beside a piece stays inside the map, with its foot in view, in a low or narrow window».
  - A 1280×360, en la tarjeta del firewall con pestañas, la caja de inspección aparece sobre «Listo» justo después del clic.
  - La prueba mide entre 10 y 30 ms después del clic y pasa solo si lo hace antes de que la caja tome el puntero.
  - Con el árbol de la 19 falló 8 de unas 27 corridas completas.
  - HEAD sin sus cambios pasó 11 de 11.

**A. Pruebas deterministas.**
- **Meta:** una prueba de layout o de tiempos da el mismo resultado en cada corrida. Si el defecto existe, falla siempre; si no existe, pasa siempre.
- **Fuentes de tiempo que se controlan:**
  - los temporizadores de la interfaz (por ejemplo, la gracia `LONGER_THAN_THE_GRACE_MS` de `tests/e2e/card-layout.spec.ts`, que hoy usa `waitForTimeout`);
  - las transiciones CSS;
  - el bucle de frames de la escena (React Three Fiber, `requestAnimationFrame`);
  - el viaje del paquete.
- **Candidatos (ninguno está verificado todavía).** Cada uno se verifica contra la documentación de Playwright 1.64 antes de usarlo; la fuente y la fecha quedan en `tests/e2e/CLAUDE.md`:
  - `page.clock`;
  - `use.reducedMotion`. `src/ui/use-still-mode.ts` ya existe: devuelve la elección del jugador y, mientras no haya una, la preferencia de movimiento reducido del sistema; y varias specs ya abren la página con `contextOptions: { reducedMotion: 'reduce' }`. Se revisa qué deja vivo (las transiciones CSS, el bucle de frames, el viaje del paquete) y si basta;
  - un ayudante compartido que espere a que la escena esté quieta antes de medir cajas: sin animaciones vivas, y con una señal de la escena si hace falta.
- **Cambio de producto:** si para esto cambia el comportamiento del juego para el jugador, va en `DESIGN.md` con su causa.
- **Prohibido:**
  - `retries`;
  - esperas fijas: una regla de ESLint en `tests/**` prohíbe `waitForTimeout`, y la que hay (hoy una sola, en `card-layout.spec.ts`, se contó el 2026-10-11) pasa a una espera de estado o a `page.clock`;
  - `skip` o `fixme` para tapar un fallo.

**B. Velocidad.**
- **`pnpm check:fast`:** corre typecheck, lint, structure, dup y test, sin e2e. La guía de `tests/e2e/` explica cómo correr solo algunas specs.
- **`--only-changed` de Playwright:** solo sigue los archivos que importan los tests. Las e2e abren el juego en el navegador y casi no importan su código, así que no sirve como único filtro. Se verifica y, si es así, no se usa.
- **`pnpm build`:** se mide cuánto tarda dentro de cada corrida e2e. Nunca se reutiliza un servidor con una compilación vieja (`reuseExistingServer` sigue en `false`), porque daría un resultado falso. Se optimiza solo lo que mantiene la compilación fresca.
- **`workers` y `fullyParallel`:** hoy `fullyParallel` es `false` y `workers` no está fijado. Se miden cuando las pruebas ya son deterministas, y se suben solo si `--repeat-each=3` sigue en verde.
- **Un puerto por worktree:**
  - el config deriva el puerto de forma estable a partir de la ruta del repo, en el rango 4183–4282;
  - nunca 5173 ni 5180, y se mantiene `--strictPort`;
  - así `feat/chapter-2` y el árbol principal corren e2e a la vez;
  - se actualizan las guías que dicen 4183, como `tests/e2e/CLAUDE.md`;
  - se comprueba que las rutas de esos dos árboles dan puertos distintos; si chocaran, se avisa antes de seguir.

**C. La nueva regla de chequeo.** Va en este plan (Global Constraints, punto «"Listo"», y el Cierre de las Tareas 20 a 35) y en `tests/e2e/CLAUDE.md`.
- **En cada tarea:** `pnpm check:fast`, más las specs e2e que nombra la tarea o que cubren lo que tocó.
- **Al cerrar un bloque y antes de cada merge:** `pnpm check` completo.
- **Una e2e que falla se compara con la base: el último commit cuyo `pnpm check` completo pasó.**
  - Si falla también en esa base, no es de la tarea ni del bloque: se anota en el backlog y se avisa, sin perseguirla dentro de la tarea.
  - Si pasa en esa base, la regresión es del bloque y se arregla dentro de él.
  - **El hueco que cierra:** una regresión que una tarea con solo `pnpm check:fast` dejó pasar aparece en el siguiente `pnpm check` de cierre de bloque. Ahí también falla «en HEAD sin los cambios de la tarea» (la regresión ya está en ese HEAD), y por esa regla antigua se habría ido al backlog por error.
- **Nunca dos suites e2e a la vez en la misma carpeta.**

**Aceptación.**
- `pnpm e2e --repeat-each=3` pasa entero.
- `card-layout.spec.ts --repeat-each=10` pasa.
- El fallo de la Tarea 19 se reproduce siempre mientras exista. Se comprueba en un worktree aparte (nunca en el árbol principal), con el árbol de `wip/task-19` y los cambios de esta tarea: `card-layout.spec.ts --repeat-each=10` falla las 10 veces en la prueba de arriba. Sobre `875c27d` más esta tarea, las 10 pasan.

**Informe al cerrar.**
- Los tiempos antes y después de `pnpm check`, `pnpm check:fast` y la suite e2e (antes de la tarea `check:fast` no existe: su tiempo de antes es el de los cinco primeros pasos de `pnpm check`).
- Los resultados de las corridas `--repeat-each`.

**Pasos.**
- [ ] Medir antes: los tiempos de `pnpm check`, de sus cinco pasos sin e2e y de la suite e2e.
- [ ] Reproducir el fallo en un worktree aparte con el árbol de `wip/task-19`.
- [ ] La regla de lint y su prueba (falla mientras `card-layout.spec.ts` espere un tiempo fijo).
- [ ] Verificar los candidatos de A contra la documentación de Playwright 1.64, con fuente y fecha.
- [ ] El ayudante de la escena quieta y la espera de `card-layout.spec.ts`.
- [ ] El puerto por worktree y su prueba.
- [ ] `check:fast`, la prueba de la forma de `check` y las guías.
- [ ] Medir `workers` y `fullyParallel`, y la aceptación.
- [ ] Medir después y escribir el informe.

**Archivos:**
- Create: `scripts/e2e-port.ts` y `scripts/e2e-port.test.ts` (el puerto; está en `scripts/` porque Vitest solo corre `src/**` y `scripts/**`, y `playwright.config.ts` lo importa); `scripts/package-scripts.test.ts`; el ayudante de la escena quieta (por ejemplo `tests/e2e/still-scene.ts`; con él `tests/e2e/` queda en 11 de 12 archivos planos).
- Modify: `playwright.config.ts` (el puerto, y lo que resulte de medir `workers` y `fullyParallel`), `package.json` (solo `scripts`: `check:fast` y `check`; ninguna dependencia, y `pnpm-lock.yaml` no cambia), `eslint.config.js` (el bloque de `tests/**` con la espera fija prohibida) y `scripts/eslint-config.test.ts`, `tests/e2e/card-layout.spec.ts` (el ayudante y la espera de estado en lugar de `waitForTimeout`), `tests/e2e/CLAUDE.md` (la regla C, el puerto, cómo correr solo algunas specs, el ayudante y las fuentes con fecha), `README.md` (la línea de comandos suma `pnpm check:fast`), `DESIGN.md` solo si cambia algo que el jugador ve, y este plan.

**Interfaces:**
- `scripts/e2e-port.ts` exporta una función pura que recibe la ruta de la raíz del repo y devuelve un entero de 4183 a 4282, el mismo para la misma ruta. `playwright.config.ts` la llama una vez y usa el resultado en `baseURL`, en el comando de `webServer` (con `--strictPort`) y en su `url`.
- `check:fast` es `pnpm typecheck && pnpm lint && pnpm structure && pnpm dup && pnpm test`; `check` es `pnpm check:fast && pnpm e2e`: los mismos pasos y en el mismo orden que hoy.
- La regla de lint cubre `tests/**/*.{ts,tsx}` y dice por qué: la espera es de estado o de `page.clock`, no de tiempo.

**Tests:**
- `e2e-port.test.ts`, `the port of the e2e server is derived from the path of the repo and stays in 4183-4282`.
- `the same path always gives the same port`.
- `the port is never 5173 or 5180`.
- `eslint-config.test.ts`, `no e2e test waits a fixed time` (una espera fija en `tests/e2e/` se rechaza y una espera de estado pasa).
- `package-scripts.test.ts`, `check runs check:fast and then the e2e suite, and check:fast runs every step check had except the e2e suite`.
- Playwright `card-layout.spec.ts`, `a box is measured only once the scene stands still`.
- `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window` (el de hoy, sin cambiar su nombre ni lo que asierta; pasa 10 de 10 sin el defecto).
- Cierre: `pnpm check` completo (esta tarea cambia el chequeo mismo) y la aceptación; las guías vivas ya no dicen que Playwright usa el 4183: solo nombran el rango 4183–4282 (`git grep -n 4183 -- src tests DESIGN.md README.md`); ninguna captura cambia; `git diff --stat` solo lista los archivos de arriba.

**Review Focus:** 25.

**Commit:** `test(e2e): make the layout tests deterministic and add a fast check`.

---

### Tarea 20: Los casos con reparación

**Propósito:** que el caso 5 del 14 se cierre solo cuando la causa está nombrada y el ping al servidor vuelve (D-12).

**Archivos:**
- Modify: `src/game/view/cards/case-card.ts` y `case-card.test.ts`, `src/ui/incident/case-card.tsx` y `case-card.test.tsx`, `src/game/session.ts` y `session.test.ts`, `src/game/stars.ts`, guías.

**Interfaces:** un caso con `fix` muestra, junto a su terminal, la tarjeta de rutas de su `fix`; el caso se cierra cuando se nombra la causa y las tareas del `fix` se cumplen. Una reparación solo vale dentro de su caso: el caso siguiente parte otra vez del mundo del incidente más sus propios cambios.

**Tests:**
- `case-card.test.ts`, `a case with a fix offers the table of its fix next to its terminal`.
- `a case without a fix offers no table`.
- `the case closes only when the cause is named and the tasks of its fix hold`.
- `the reference solution of a case with a fix repairs the world of that case`.
- `session.test.ts`, `the repair of a case does not carry over to the next case`.
- `the middle star is no hint asked in any case` y `the explained star needs every cause right at the first try` (los de hoy, sobre un incidente con un caso reparable).
- Cierre: `pnpm check:fast` y las specs que juegan los casos del 14 del capítulo 1 (`tests/e2e/chapter-1/chapter-1.spec.ts` y `tests/e2e/card-layout.spec.ts`) y la que juega las estrellas del capítulo 4 (`tests/e2e/incidents.spec.ts`); los casos del 14 del capítulo 1 sin cambiar de contenido.

**Review Focus:** 17.

**Commit:** `feat(game): close a case of a diagnose when its cause is named and its fix holds`.

---

### Tarea 21: La escena

**Propósito:** que el mapa dibuje los servidores de nombres, el cliente de internet, los puertos del paquete (cada protocolo con su forma), la traducción (la etiqueta del paquete cambia al cruzar `router-oficina`), el intruso con el borde de intruso (V19 = B) y el contorno del bloque del 02-04 (D-6). **Depende de:** nada pendiente: D-9 = B, D-10 = A, V12 = B, V13 = A, V14 = A y V19 = B están decididas (2026-10-11).

**Archivos:**
- Modify: `src/scene/layout.ts` y `layout.test.ts`, `src/scene/entities/device.tsx` (los servidores de nombres son la variante `internet-server`), `actor.tsx` (el cliente de internet), `packet.tsx` (las cuatro formas nuevas) y `entity-icon.tsx` (su ícono), `src/scene/traffic/` (`flow-look.ts` y su test: qué forma lleva un paquete según su protocolo y su sentido; la etiqueta con protocolo y puertos y su cambio al cruzar el router, V13 = A), `src/scene/catalog/catalog-cells.tsx` (las cuatro celdas), `src/copy/terms.ts` y `terms.test.ts` (`EntityVariants.packet` y `ENTITY_TERMS.packet` suman las cuatro variantes, nombradas por `tcp` y `udp`; `TERM_ENTITY` lleva esos dos términos a la forma de su pedido), `src/copy/screens/ui.ts` (`ENTITY_NAMES.packet` es un registro tipado: lleva los cuatro nombres), `src/game/view/pieces.ts` y `pieces.test.ts`, `src/scene/entities/entity-icon.test.tsx`, `tests/e2e/entities.spec.ts`, `tests/e2e/snapshots/entities-darwin.png` (se regraba a propósito), guías.

**Interfaces:**
- **Piezas.** `pieceViews` dibuja un servidor de nombres como pieza de dispositivo de la variante `internet-server` cuando su término se conoce (`servidor-dns` desde el 10, `servidor-autoritativo` desde el 11) y la lista `shown` lo incluye; dibuja un cliente de internet como pieza de actor. Lo que se dibuja y lo que dice la caja coinciden: un router que no se dibuja no se nombra.
- **Una forma por protocolo (V12 = B).** El catálogo suma cuatro entidades de paquete: TCP y UDP, cada una llena (el pedido) y en anillo (la respuesta). ICMP conserva las suyas (el punto, el anillo y el aviso). El protocolo y los puertos siguen también en la etiqueta del paquete y en su caja. Cada entidad nombra su término en `ENTITY_TERMS`: `tcp` o `udp`. La Tarea 2 (hecha) no puso ningún id nuevo en `ENTITY_TERMS` ni en `TERM_ENTITY`, y eso valía para ella; desde aquí `tcp` y `udp` son los dos únicos ids del capítulo 2 que nombran una entidad, y `TERM_ENTITY` los lleva a la forma de su pedido porque la prueba `every term that names a variant shows the entity of one of the variants it names as its icon` lo exige mientras no se cambie. Dos pruebas de `terms.test.ts` fijan los paquetes de hoy y se reescriben a propósito, y una tercera porque las cuatro llevan copia de intruso (V19 = B; lista en «Global Constraints»). El término nombra la entidad en el catálogo y en el glosario, y no decide si el paquete se dibuja: hoy `entityTerm` solo lo leen `isDrawn` (para piezas) y la caja de inspección (`inspection.ts`, solo para ICMP), así que el primer `nc` del 02-01 sale con la forma de TCP antes de que `tcp` se conozca. En la etiqueta del paquete y en la caja, el protocolo sí espera a su término (Tarea 16).
- **El intruso (V19 = B, decidida el 2026-10-11; no es la recomendación del orquestador, que era conservar el rombo).** Una sola regla para todo paquete: **la forma dice el protocolo y un borde rojo de intruso dice el papel.** En el 02-05, el intruso TCP (`laptop-visita` al puerto 22) es el cuadrado de TCP con el borde de intruso; el aspecto exacto es el de la sección V19, opción B, de la página de prototipos. En los capítulos 1 y 4 **el rombo desaparece:** el intruso de ICMP pasa a ser la forma del ping (el punto lleno o el anillo) con el mismo borde. Es un cambio visible de los dos capítulos (ver «Cambios visibles»). Cada mensaje que un emisor manda (ICMP, TCP y UDP) tiene su versión de intruso con el borde, y un aviso nunca la tiene. `ENTITY_REFS` suma las copias de intruso de las cuatro entidades nuevas de TCP y UDP.
  - **Archivos que cambian por V19** (se buscó `rombo` y `rhombus` en `src/`, `tests/`, `DESIGN.md` y `README.md` el 2026-10-11): `src/scene/entities/packet.tsx` (`PacketGlyph` y `PacketIcon`: salen `RHOMBUS_RADIUS`, `RHOMBUS_SEGMENTS` y el camino `rhombus` de `PACKET_ICON_PATH`, y entra el borde), `src/scene/entities/entity-icon.tsx`, `src/scene/catalog/catalog-cells.tsx` (las celdas de intruso y el rastro de intruso), `src/copy/terms.ts` (`ENTITY_REFS`), `src/scene/entities/CLAUDE.md` (dice «a vermilion rhombus for an intruder»), `DESIGN.md` (la línea 57, «the intruder's rhombus», y la 135, «a vermilion rhombus (an intruder's)») y los comentarios de `packet.tsx`. Ningún texto en español de `src/` dice «rombo»: el catálogo nombra al intruso como «<mensaje> · intruso» (`CATALOG_TEXT.intruder`) y la leyenda de sellos habla del sello («Entró y no debía.»), no de la forma; el sello del intruso (doble anillo, `.stamp--intruder`) es otro elemento y no cambia.
  - **Pruebas existentes que cambian a propósito:** `terms.test.ts`, `a warning is never an intruder: only the messages a sender sends are listed as an intruder too` (hoy espera solo `echo-reply` y `echo-request` como intrusos; se amplía a las cuatro entidades de TCP y UDP). Ninguna prueba nombra el rombo; las que dependen del dibujo y se vuelven a correr, y se editan solo si fallan por este cambio, son `entity-icon.test.tsx` (`tells every variant apart by its shape` y `every packet variant has an icon and every stamp state has its own shape`: sirven mientras el borde haga distinto el SVG de cada intruso) y las de `inspection.test.ts` que comparan el ícono de un paquete de intruso. `flow-look.test.ts` y `stamp-states.test.ts` leen datos y no la forma: no cambian.
- **El contorno del bloque (D-6 = A; el 02-04).** Un contorno alrededor de las piezas que el jugador puso dentro del bloque; `tu-laptop` está dentro desde el principio. Su aspecto es el de la sección D-6 de la página de prototipos. Hoy no hay nada que lo dibuje: `PieceState` es `normal`, `intruded` o `blocking`, y la escena dibuja la losa de cada red o piso y su etiqueta (`layout.floors` y `FloorLabel`), nunca algo que dependa de lo que el jugador respondió. Falta: (a) la marca «dentro del bloque» de la pieza, que calcula `game` desde `session.answers` (Tarea 19); (b) la geometría en `layout.ts`: el rectángulo que rodea los lugares de las piezas marcadas (`DeviceSpot`), sin tapar etiquetas; (c) el dibujo en `game-scene.tsx`: una variante de la losa de red dibujada solo con borde, no un elemento hermano (`DESIGN.md`); si resulta una entidad nueva del catálogo, suma su celda en `catalog-cells.tsx` y regraba la captura de piezas, que esta tarea ya regraba. **No depende de V19.**
- **El catálogo y las capturas.** En `CATALOG_ROWS` la fila de paquetes y la de sellos tienen sus cinco celdas ocupadas; la rejilla es de 5 columnas por 10 filas y quedan 11 celdas libres repartidas en filas de otras familias (se contaron el 2026-10-11). Caso 1: las celdas nuevas (las cuatro de TCP y UDP, las cuatro de sus copias de intruso por V19 y la del contorno por D-6: nueve, frente a 11 libres) caben en celdas libres, aunque queden en filas de otras familias: cambia la captura de piezas y la de la interfaz no. Caso 2: van en una fila nueva: la sección de la interfaz baja y su captura cambia en cada píxel (medido en `DESIGN.md`, «Adding a variant instead of a new element», paso 3), y entonces esta tarea regraba también `interface-darwin.png`, comprobando que el diff sea solo ese desplazamiento. La tarea dice en su commit cuál de los dos casos fue.
- **La traducción a la vista (V13 = A).** La etiqueta de un paquete TCP o UDP dice el protocolo y los puertos. En el 02-08 dice «TCP 51514 → 80» hasta `router-oficina` y «TCP 40001 → 80» después (en el de `laptop-lucia`, 51514 y luego 40002). La escena lo toma de `Trace.translation`, como la Tarea 16. En «Sin animaciones» el dibujo quieto muestra la etiqueta del tramo donde está el paquete. El 40001 es un número del juego. La caja ya muestra los dos encabezados (Tarea 16).
- **O-2 = A (decidida el 2026-10-12).** Lo ejecuta la Tarea 28 quater, no esta. Esta tarea no cambia: la forma de UDP y la etiqueta que cambia al cruzar `router-oficina` (V13) ya valen para la consulta, que es un paquete UDP más.

**Tests:**
- `layout.test.ts`, `places the servers of names on the road behind the globe without covering a label`.
- `places a client of the internet outside the office`.
- `pieces.test.ts`, `a server of names is drawn as a device piece of the variant internet-server once its term is known`.
- `a client of the internet is drawn as an actor piece`.
- `flow-look.test.ts`, `a tcp request is drawn with the filled shape of tcp and its reply with the ring, and a udp datagram with the shapes of udp`.
- `terms.test.ts`, `every protocol has an intruder version with the intruder border`.
- `entity-icon.test.tsx`, `no packet is drawn as a rhombus`.
- `flow-look.test.ts`, `the packet of an intruder has the shape of its protocol and the intruder border`.
- `no text of the game calls the intruder a rhombus`.
- `layout.test.ts`, `the outline of the block surrounds exactly the pieces marked inside and no other piece`.
- `the outline grows when a piece is marked inside and shrinks when it is not`.
- Playwright `entities.spec.ts`: `the specimens of the outline of the block and of the intruders are part of the capture`.
- `a packet with ports is labelled with its protocol and ports`.
- `a translated packet changes its label at the router, from the private source port to the public one`.
- `the still drawing of a translated packet shows the label of the leg where the packet stands`.
- `terms.test.ts`, `tcp and udp name the four packet entities and are the only terms of chapter 2 that name an entity`.
- `a warning is never an intruder: only the messages a sender sends are listed as an intruder too` (se amplía, ver arriba).
- `the icon of tcp and of udp is the request shape of its protocol`.
- `entity-icon.test.tsx`, `every entity and every variant of the catalog has an icon` (y, sin editarse, `tells every variant apart by its shape`, que obliga a que las cuatro formas se distingan entre sí y de las de ICMP).
- Playwright `entities.spec.ts`: la captura de piezas cambia solo por los cuatro especímenes nuevos (y los de los servidores de nombres y el cliente, si ocupan celdas nuevas), por los intrusos con el borde nuevo (V19) y por el contorno del bloque (D-6).
- Cierre: `pnpm check:fast` y las specs que miran el mapa y las capturas (`tests/e2e/entities.spec.ts`, que regraba la de piezas, y `tests/e2e/chapter-1/chapter-1.spec.ts` e `tests/e2e/incidents.spec.ts`, por el borde del intruso en los capítulos 1 y 4); la captura de la interfaz no cambia, salvo en el caso 2 de arriba, donde cambia solo por el desplazamiento.

**Review Focus:** 14, 15 y 23.

**Commit:** `feat(scene): draw the servers of names, the client of the internet, the shapes of tcp and udp and the translation`.

---

### Tarea 22: Preparar la cadena, el desbloqueo y los ayudantes

**Propósito:** que el primer incidente del capítulo 2 se abra con el 01-14 y que el 04-01 se abra con el 02-14, y que el mundo del capítulo tenga sus constantes (decidida 18).

**Archivos:**
- Create: `src/levels/02-ports-and-names/shared.ts` (las constantes del mundo: `IP`, `DEVICE`, `ROUTER`, `SERVER`, `NAME`, `TASK`, las acciones de cada bloque y las listas `shown`) y `CLAUDE.md`; `tests/e2e/chapter-2/chapter-2-play.ts` (el esqueleto) y `CLAUDE.md`; `src/game/chapter-2.test.ts` (el esqueleto).
- Modify: `tests/e2e/saved-progress.ts` (`CHAPTER_2_DONE` lista `02-01` a `02-14`; el 04-01 se abre con ese), `src/storage/progress.test.ts`, `tests/e2e/CLAUDE.md`, `src/levels/CLAUDE.md`.

**Interfaces:** `isUnlocked` no cambia (ya usa el orden del juego). Cada acción de `shared.ts` es una constante nombrada, como en el capítulo 1. `chapter-2.test.ts` crece con cada bloque: comprueba que los incidentes que existen presentan exactamente los términos de su fila de la tabla aprobada, y al llegar el 02-14, que los 53 están y no sobra ninguno.

**Tests:**
- `progress.test.ts`, `the first incident of a chapter opens with the last incident of the chapter before in game order`.
- `an incident with a star stays open even when the one before it has none`.
- `chapter-2.test.ts`, `introduces, incident by incident, the terms of the approved design` (vacío hasta el 02-01; crece por bloque).
- `a text of an incident names no term that a later incident of chapter 2 introduces`: repite `namedTerms` sobre los textos de cada incidente del capítulo con los términos que presentan los incidentes de después, para que un texto de 02-03 no diga `ruta` antes del 06 con palabras corrientes. Lista corta de excepciones, escrita en la prueba y con su razón: «resolver» como verbo, y «conexión» en el campo de la caja si D-8 es B.
- Playwright (humo, sin incidentes aún): `CHAPTER_2_DONE opens 04-01 once chapter 2 exists` se activa en la Tarea 33.
- Cierre: `pnpm check:fast` y las specs que importan `saved-progress.ts` (`tests/e2e/chapter-1/chapter-1.spec.ts`, `tests/e2e/incidents.spec.ts` y `tests/e2e/card-layout.spec.ts`); golden sin cambios.

**Review Focus:** 3 y 16.

**Commit:** `chore(levels): prepare the chain of chapter 2 and its helpers`.

---

### Contenido: lo que comparten las Tareas 23 a 33

- **Cada incidente** es un archivo `NN-<slug>.ts` en la carpeta de su bloque, con `defineIncident`, `chapter: 2`, `role: 'defender'`, su `introduces` (los términos de su fila del spec), sus `changes` (acciones nombradas en `shared.ts`), su lista `shown` (decidida 28), `report`, `tasks`, `hints`, `question`, `explanation` (tres opciones, una correcta en la posición de la ficha), `solution` y `takeaway`. Cita `LESSON` y `CONCEPT` como el capítulo 1 (el choque con la regla de lecciones es el pendiente I1 del backlog).
- **El texto** lo escribe quien ejecuta, en español llano, con una idea por frase, con los términos conocidos etiquetados (`{{puerto}}` y compañía) y con el nombre de cada dispositivo, router o servidor tomado del registro de `shared.ts` (`DEVICE`, `ROUTER`, `SERVER`, `NAME`), nunca como literal.
- **Cada tarea de contenido** suma sus pruebas a `src/game/chapter-2.test.ts`, extiende `tests/e2e/chapter-2/chapter-2-play.ts` con cómo se juega ese incidente con el ratón (un humo por bloque, no un recorrido completo) y deja pasar los genéricos de `incidents.test.ts` y de la escalera de las vistas (`starts with a task to fix`, `its reference solution fixes every task and earns every star but the explanation`, `only uses terms introduced in it or before`, `names each chip after a term, by its official name`).
- **El cierre de cada tarea de contenido** es el de «Listo»: `pnpm check:fast`, la spec de `tests/e2e/chapter-2/` que juega ese incidente (o la que la tarea nombra) y `tests/e2e/roadmap.spec.ts`. El `pnpm check` completo lo llevan solo las que cierran un bloque (24, 26, 27, 28, 32 y 33) y, después, la 34 y la 35.
- **Antes de empezar un bloque,** el implementador relee las fichas de ese bloque, la lista de «Simplificaciones declaradas» del spec y la guía de la carpeta del motor que le toca.
- **Al cerrar un bloque,** un revisor (`sonnet`) lee los textos de ese bloque antes de que empiece el siguiente: lenguaje llano (frases cortas, una idea por frase), escalera de términos (ningún término que el jugador aún no conoce), rigor (cifras, límites y comportamientos con su fuente, y lo no verificado, dicho) y la causa de cada cambio de comportamiento (el report, la explicación correcta o el takeaway nombran lo que cambió). Sus correcciones se aplican antes del bloque siguiente. No hay prueba humana entre bloques: es una sola, al final de la Tarea 33 (D-15 = B). Se sugiere `/clear`.

### Tarea 23: Bloque 1 · 01

**Presenta:** servicio, puerto, puerto de destino, IP:puerto, escuchar, nc (D-5 y D-17; ficha 02-01). Denso: tarea propia.

**Archivos:**
- Create: `src/levels/02-ports-and-names/who-listens/01-one-machine-many-services.ts` y `who-listens/CLAUDE.md`.
- Modify: `shared.ts` (el `setServices` de `laptop-lucia`, los chips de mensaje de `nc` y los de dirección), `src/game/chapter-2.test.ts`, `src/levels/registry.test.ts`, `src/levels/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Interfaces:** `send`, mundo = 01-14 más el `setServices`; `shown` = `tu-laptop` y `laptop-lucia`; tres tareas (ficha). La salida de `nc` es la de la Tarea 18 (`ncat` 7.93, sin `tcp`). **El takeaway (D-5)** dice dos cosas, en palabras llanas y sin nombrar un término posterior: que en Amazon Linux 2023 `nc` se instala con `sudo dnf install nmap-ncat`, y que en macOS la salida de `nc` se ve distinta. Es el primer incidente que presenta `nc`, y los dos datos viven también en la guía `src/copy/tools/CLAUDE.md` (Tarea 18).

**Tests:**
- `chapter-2.test.ts`, `02-01: the ping, the nc to port 3000 and the nc to port 5432 each complete their task`.
- `02-01: the box of the nc shows 192.168.1.11:3000 as the destination`.
- `02-01: the report names laptop-lucia and says what changed`.
- `02-01: draws tu-laptop and laptop-lucia and no other piece`.
- `02-01: introduces service, port, destination port, IP:puerto, escuchar and nc, and uses no later term`.
- `02-01: the takeaway says how to install nc on Amazon Linux 2023 and that macOS prints it differently`.
- `02-01: the output of nc is the one of ncat 7.93, with the Version, Connected and bytes lines and no tcp`.
- `02-01: the ping to laptop-lucia comes back and does not complete the nc tasks`.
- `registry.test.ts`, `registers the prototype incidents in game order` (suma el `02-01`).
- Playwright (humo): `chapter 2 opens at 02-01 once 01-14 has a star and 04-01 stays closed`.
- Cierre: `pnpm check:fast`, el humo de Playwright que nombra la tarea y las specs que abren el 04-01 con el progreso guardado o listan los capítulos (`tests/e2e/chapter-1/chapter-1.spec.ts`, `tests/e2e/incidents.spec.ts` y `tests/e2e/roadmap.spec.ts`); golden sin cambios.

**Review Focus:** 3, 4, 6 y 13.

**Commit:** `feat(levels): add chapter 2 incident 01, one machine and many services`.

---

### Tarea 24: Bloque 1 · 02

**Presenta:** cliente y servidor, TCP, conexión, saludo de tres pasos, puerto de origen, puerto efímero (ficha 02-02). Denso: tarea propia.

**Archivos:**
- Create: `src/levels/02-ports-and-names/who-listens/02-opening-a-connection.ts`.
- Modify: `shared.ts`, `src/game/chapter-2.test.ts`, `registry.test.ts`, `who-listens/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-02: the header of the nc shows the source port 51514 and the destination port 3000`.
- `02-02: the second nc leaves from 51515`.
- `02-02: the reply header swaps the ports`.
- `02-02: the box lists the greeting in three steps`.
- `02-02: both connections must open to close the incident`.
- `02-02: no text gives a range of ephemeral ports as a number`.
- `02-02: no text says why the reply is let through`.
- `02-02: introduces client and server, tcp, connection, greeting, source port and ephemeral port, and uses no later term`.
- Cierre: `pnpm check` completo (cierra el bloque 1); golden sin cambios.

**Review Focus:** 3, 5, 8 y 18.

**Commit:** `feat(levels): add chapter 2 incident 02, opening a connection`.

**Revisión de los textos del bloque 1** (01 y 02) por un revisor `sonnet`, antes del bloque 2 (D-15 = B; ver «Contenido»). Si la prueba humana del capítulo entero siente pesados el 01 o el 02, se separan como dice D-17.

---

### Tarea 25: Bloque 2 · 03

**Presenta:** puerto cerrado, RST, Connection refused, puerto filtrado, dirección de escucha (ficha 02-03). Denso: tarea propia.

**Archivos:**
- Create: `src/levels/02-ports-and-names/ports-and-rules/03-refused-or-silent.ts` y `ports-and-rules/CLAUDE.md`.
- Modify: `shared.ts` (el `setListenAddress`, las fichas de origen y de mensaje), `src/game/chapter-2.test.ts`, `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Interfaces:** `send` con un ajuste `listen-address` (la tarjeta «Servicios de laptop-lucia»); cuatro tareas (ficha). Los orígenes son `tu-laptop` y `laptop-lucia`.

**Tests:**
- `02-03: nc to a port nobody listens on is refused by laptop-lucia`.
- `02-03: the nc to laptop-marta is silent and its firewall is named as the one that dropped it`.
- `02-03: the nc from laptop-lucia to 127.0.0.1 comes back`.
- `02-03: the nc from tu-laptop to port 3000 is refused while the app listens only on 127.0.0.1`.
- `02-03: choosing Todas las IPs in the services card of laptop-lucia makes the nc come back`.
- `02-03: the report names laptop-lucia`.
- `02-03: a refusal and a silence leave different stamps`.
- `02-03: no text says that a closed port and a service on another address are the same`.
- `02-03: the services card opens from the label of laptop-lucia`.
- `02-03: introduces closed port, RST, Connection refused, filtered port and listen address, and uses no later term`.
- Cierre: `pnpm check:fast` y la spec de `tests/e2e/chapter-2/` que juega este incidente con `chapter-2-play.ts` y `tests/e2e/roadmap.spec.ts`; golden sin cambios.

**Review Focus:** 3, 6, 7 y 18.

**Commit:** `feat(levels): add chapter 2 incident 03, refused or silent`.

---

### Tarea 26: Bloque 2 · 04 y 05

**Presenta:** bit, prefijo, CIDR, máscara de subred (04); rango de puertos, SSH, puerto por defecto, puertos conocidos (05) (fichas 02-04 y 02-05). **Depende de:** D-6 y D-18, decididas (2026-10-11), y de lo que el 04 pide al código: las Tareas 14, 15, 19 y 21 (ver abajo).

**Archivos:**
- Create: `src/levels/02-ports-and-names/ports-and-rules/04-is-it-in-my-block.ts` y `05-the-whole-rule.ts`.
- Modify: `shared.ts` (las tarjetas del 04, el `setServices` y el `addFirewall` del 05, los chips de regla con puerto), `src/game/chapter-2.test.ts`, `registry.test.ts`, `ports-and-rules/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Interfaces:** 04 es `identify` con la tarjeta de clasificar de `tu-laptop` (D-6 = A): las dos preguntas con fichas del bloque y de la máscara, la fila de bits, `impresora` y `laptop-andres` por clasificar y las bandejas «Dentro de 192.168.1.0/24» y «Fuera»; 05 es `filter` con fichas de Type y Source (ficha), una tarea y los flujos requerido y prohibido.

**Lo que el 04 pide al código (D-6 = A).** Se comprobó el 2026-10-11 en `src/levels/contract/incident.ts`, `src/game/session.ts`, `src/game/view/cards/identify-card.ts`, `src/ui/incident/map-cards/identify-card.tsx`, `src/game/view/pieces.ts` y `src/scene/`. Hoy:
- **Contrato:** `identify.cards` tiene una tarjeta por dispositivo (`deviceId`, `question` y bandejas); una bandeja es una fila de fichas de la que se elige una (`segmented` si son dos); una tarea espera `{ deviceId, trayId, chipId }` y la respuesta se guarda en `answers[deviceId][trayId]`. No hay una tarjeta que clasifique a otros dispositivos, ni un dato del bloque del que salgan el prefijo y los bits.
- **Sesión:** `offeredPicks` solo acepta las fichas de una tarjeta del mismo dispositivo.
- **Vista:** `identifyCard` arma una tarjeta por pieza de dispositivo; no calcula bits ni partes de una IP.
- **UI:** `IdentifyCard` pinta una `ChipTray` por bandeja y las líneas de la ficha elegida; no hay bandejas donde se coloquen elementos ni fila de bits.
- **Escena:** `PieceState` es `normal`, `intruded` o `blocking`; la escena dibuja la losa de cada red o piso y su etiqueta, y nada que dependa de lo que el jugador respondió. No hay contorno.

Falta, y se reparte así (la infraestructura va antes del contenido):
1. **Contrato (Tarea 14):** la tarjeta de clasificar (dueño, bloque CIDR, dos bandejas con nombre, elementos). Pruebas: `accepts an identify incident whose card classifies other devices into two named bins around a CIDR block`; `rejects a classify card whose block is not a CIDR block, whose bins repeat an id or whose items repeat a device`; `an identify task can expect the bin of a classified item and the solution can answer for it`; `every device a classify card sorts exists in the start world of its incident`.
2. **Sesión (Tarea 15):** que la respuesta de un elemento clasificado se guarde bajo su propio dispositivo. Pruebas: `answering for a classified item saves its bin under its own device and a bin the card does not offer is left out`; `a classified item has no answer until the player places it`.
3. **Vista y UI (Tarea 19):** la fila de bits, la partición de la IP, las bandejas derivadas de `session.answers`, las líneas de cada elemento, la marca «dentro del bloque» de la pieza y la tarjeta, en subcarpetas `identify/` (la regla cuenta archivos y no subcarpetas, y `src/game/view/cards/` queda en 12 de 12). Pruebas: las de `classify-card.test.ts`, `pieces.test.ts` y `classify-card.test.tsx` listadas en la Tarea 19.
4. **Escena (Tarea 21):** el contorno del bloque (marca de la pieza, geometría en `layout.ts` y dibujo en `game-scene.tsx`); lo que cambie las capturas va en esa tarea. Pruebas: `the outline of the block surrounds exactly the pieces marked inside and no other piece`; `the outline grows when a piece is marked inside and shrinks when it is not`; el especimen en la captura de piezas.
5. **Contenido (esta tarea):** el incidente, con `tu-laptop` como dueña de la tarjeta, `impresora` y `laptop-andres` como elementos, y las cuatro tareas; sus pruebas, abajo. Playwright lo cubre en la Tarea 34 (`in 02-04 placing a device inside the block draws it inside the outline and moving it out takes it out`).

**Tests:**
- `02-04: the four answers close the incident`.
- `02-04: 192.168.1.0/28 says the printer does not fit and 192.168.1.0/32 says it is one IP`.
- `02-04: nothing travels and the incident has no flows`.
- `02-04: the card of tu-laptop shows its IP in 32 bits with the first 24 marked as the block`.
- `02-04: the printer placed inside and laptop-andres placed outside close the incident, and placed the other way each line says why`.
- `02-04: the outline of the block surrounds tu-laptop at the start and the printer once it is placed inside`.
- `02-04: introduces bit, prefix, CIDR and subnet mask, and uses no later term`.
- `02-05: TCP 22 from tu-laptop closes the incident and earns the middle star`.
- `02-05: Cualquier IP de origen lets the visit in and raises the intruder alert`.
- `02-05: every port range chip that opens more than 22 is caught by the probe battery`.
- `02-05: the chips offer no udp and no port 53`.
- `02-05: the text that names the range 1-1023 calls it the well-known ports and says nothing about port 0`.
- `02-05: no text calls the port 3306 or the port 5432 a well-known port`.
- `02-05: the report names laptop-lucia`.
- `02-05: introduces port range, SSH, default port and well-known ports, and uses no later term`.
- Cierre: `pnpm check` completo (cierra el bloque 2); golden sin cambios; las pruebas de `filter` del capítulo 1 y del 4 sin editar.

**Review Focus:** 3, 6, 18 y 24.

**Commit:** `feat(levels): add chapter 2 incidents 04 and 05, the block and the whole rule`.

**Revisión de los textos del bloque 2** (03, 04 y 05) por un revisor `sonnet`, antes del bloque 3 (ver «Contenido»).

---

### Tarea 27: Bloque 3 · 06 y 07

**Presenta:** ruta, tabla de rutas, ruta de red conectada, ruta por defecto (06); siguiente salto, Destination Net Unreachable, ruta más específica (07) (fichas 02-06 y 02-07). **Depende de:** D-2 y D-3.

**Archivos:**
- Create: `src/levels/02-ports-and-names/which-way/06-your-routing-table.ts`, `07-a-way-to-the-other-office.ts` y `which-way/CLAUDE.md`.
- Modify: `shared.ts` (la otra oficina, el enlace privado, `updateRouter` de `router-oficina`, las tablas del 07, `ROUTES_PIECES`), `src/game/chapter-2.test.ts`, `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-06: a ping to the printer uses the connected route and a ping to laptop-andres uses the default route`.
- `02-06: the box says which route the ping used`.
- `02-06: the routes card of tu-laptop is read only`.
- `02-06: the text of 0.0.0.0/0 in a route says it is what no other route covers`.
- `02-06: introduces route, routing table, connected route and default route, and uses no later term`.
- `02-07: with no routes router-oficina warns Destination Net Unreachable`.
- `02-07: with only the default route the ping to 10.0.0.10 dies in silence at router-proveedor, as in 01-08`.
- `02-07: 10.0.0.0/16 to router-sucursal and 0.0.0.0/0 to router-proveedor close the incident`.
- `02-07: 10.0.0.10/32 leaves 10.0.0.20 without a way and 0.0.0.0/0 to router-sucursal leaves the server without a way`.
- `02-07: the report names router-oficina and no router of the provider that the map does not draw`.
- `02-07: no router that stayed silent in 01-08 warns now`.
- `02-07: the table of router-oficina accepts one route per destination`.
- `02-07: introduces next hop, Destination Net Unreachable and most specific route, and uses no later term`.
- Cierre: `pnpm check` completo (cierra el bloque 3); golden sin cambios; `a private address is dropped by the first router outside the office, with no warning` sin editar.

**Review Focus:** 3, 6, 7 y 9.

**Commit:** `feat(levels): add chapter 2 incidents 06 and 07, your routing table and a way to the other office`.

**Revisión de los textos del bloque 3** (06 y 07) por un revisor `sonnet`, antes del bloque 4 (ver «Contenido»).

---

### Tarea 28: Bloque 4 · 08 y 09

**Presenta:** NAT, traducción de puertos, tabla de traducciones (08); reenvío de puertos (09) (fichas 02-08 y 02-09). **Depende de:** D-14 y V13.

**Archivos:**
- Create: `src/levels/02-ports-and-names/one-address/08-one-address-for-the-whole-office.ts`, `09-from-outside.ts` y `one-address/CLAUDE.md`.
- Modify: `shared.ts` (los servicios de `servidor-internet` y de `laptop-andres`, `casa-lucia`, `setForwards`), `src/game/chapter-2.test.ts`, `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-08: two laptops with the same source port get two public ports and the table lists both rows`.
- `02-08: the box shows the header in the local network and the header in the internet`.
- `02-08: the note that the header changes outside the office is gone`.
- `02-08: the report says router-oficina did this since the office reached the internet and changes nothing in the world`.
- `02-08: a ping from tu-laptop to the server still comes back and leaves no row`.
- `02-08: introduces NAT, port translation and translation table, and uses no later term`.
- `02-09: a packet to the public IP on a port with no row is not delivered to any device`.
- `02-09: the forward delivers to laptop-andres and nothing stops it`.
- `02-09: no text says NAT blocks or filters`.
- `02-09: the report names router-oficina and laptop-andres`.
- `02-09: introduces port forwarding and uses no later term`.
- `01-08 still says the header changes outside the office and does not name NAT` (el de hoy del capítulo 1, sin editar).
- Cierre: `pnpm check` completo (cierra el bloque 4); golden sin cambios.

**Review Focus:** 2, 5, 6, 10 y 18.

**Commit:** `feat(levels): add chapter 2 incidents 08 and 09, one address for the whole office and from outside`.

**Revisión de los textos del bloque 4** (08 y 09) por un revisor `sonnet`, antes del bloque 5 (ver «Contenido»).

---

### Tarea 28 bis: el merge de `main` y la caja que se aparta (O-1 = D)

**Presenta:** ningún término. **Depende de:** O-1 = D (decidida el 2026-10-12). Va después de la Tarea 28 y no depende de la 28 ter. No cambia lo que enseña ningún incidente.

**Quién autorizó lo técnico.** La sesión principal autorizó el 2026-10-12 decidir lo técnico que no cambia lo que se aprende. Aprobó tres cosas: el worktree temporal de esta tarea, el orden 28 bis → 28 ter → 28 quater → 28 quinquies → 29 a 33, y el commit de merge rojo en una sola prueba conocida, con D en commits propios después. Las decisiones de esta tarea que no cambian lo que se aprende están en «Decididas sin el estudiante» (42 a 44).

**Propósito.**
- Unir `main` en `feat/chapter-2`. Trae `46c4074` (la caja de inspección se fija con un clic o con Enter) y `b6eb2ce` (los documentos del capítulo 3).
- Hacer que una caja nunca tape una tarjeta abierta (D). La caja tiene dos lugares: abajo a la derecha y abajo a la izquierda. Se abre en el que no toca la tarjeta. Si ninguno está libre, no se abre, y una caja fijada se suelta.

**Lo que se midió el 2026-10-12 (solo lectura, sobre `ccb20b3`).**
- **Son 14 conflictos, no 8.** `git merge-tree --write-tree --name-only feat/chapter-2 main` lista, además de los ocho conocidos:
  - `src/scene/game-scene.tsx`, `src/scene/overlay/piece-label.tsx` y `piece-label.test.tsx`, `src/scene/traffic/traffic.tsx`;
  - `src/scene/entities/CLAUDE.md` y `src/scene/overlay/CLAUDE.md`.
  - Vienen de las Tareas 19 y 21, que son posteriores al merge guardado.
- **Git no marca estos arreglos y el merge los exige:**
  - `src/ui/incident/map-cards/piece-card.test.tsx` (línea 119) sigue pasando `onInspect` a `PieceLabel`: pasa a `trigger`.
  - `opensCard`, que `main` define en `incident-screen.tsx`, mira `piece.settings?.id`, y la Tarea 19 quitó `settings`: queda solo `candidate.id === pieceId && candidate.configurable`.
  - `src/scene/catalog/catalog-cells.tsx` se une solo, pero mezcla `ignore` de la rama con el disparador vacío de `main`: lo dice `pnpm typecheck`.
  - `tests/e2e/chapter-1/chapter-1-play.ts` debe exportar `LOST_TO_OTHER_OFFICE`. Git traslada el cambio de `main` porque detecta el renombrado; se comprueba con `git grep -n LOST_TO_OTHER_OFFICE tests/e2e`.
- **La guía del scratchpad es más corta de lo que parece.**
  - `merge/resolved-files/` tiene 7 archivos y es de antes de las Tareas 19 y 21 y de `118d9b0`. Sirve para el backlog, las guías `src/ui/CLAUDE.md`, `src/ui/incident/CLAUDE.md` y `tests/e2e/CLAUDE.md`, `incident-screen.tsx` con su prueba y `card-layout.spec.ts`. No dice nada de `use-inspection.ts`, `game-scene.tsx`, `piece-label*`, `traffic.tsx` ni las guías de la escena.
  - `merge/build_spec.py` no corre hoy. Se probó a solas, en el scratchpad, con los archivos de hoy: su primera aserción muere en la importación `SETTINGS_BUTTON`, que la Tarea 19 cambió por `SETTINGS_TAB`. Sirve de lista de qué reescribir, no de herramienta.
  - `oracle/oracle-at-the-click.chapter-2.spec.ts` es viejo: importa `SETTINGS_BUTTON` y `CHAPTER_1_DONE` y recorre 5 escenas, y `MAP_SCENES` tiene hoy 12. Se rehace en el repo (ver los tests).
  - Las mutaciones M1 a M3 del merge viejo no están guardadas, solo sus registros (`merge/mut-M1.log`: falla al clic, porque el pin no se toma; `mut-M2.log` y `mut-M3.log`: fallan tras el viaje, porque el pin se pierde). Se definen de nuevo, abajo.
- **Carpetas tras la unión** (de un `merge-tree` fresco, archivos planos sin contar `CLAUDE.md`): `src/ui/` 11 (sale `term-tip.tsx`; entra `floating-box/` con 4 archivos), `src/ui/incident/` 8, `src/scene/` 11, `src/scene/overlay/` 7, `tests/e2e/` 11. La frase de «Global Constraints» que dice que `src/ui/incident/` está en 12 de 12 ya no es cierta desde `875c27d`.

**Orden seguro de los pasos.** Base verde (hecha), worktree temporal, merge sin commit, commit de merge con el rojo conocido (una sola prueba), mutaciones del pin, oráculo en rojo, D, oráculo en verde, mutaciones de D, el motivo, las capturas del residuo (decidida 52), cierre y traer la rama.

**Por qué D va en commits propios, después del merge.** D necesita `release()` y el pin que trae `main`: no puede ir antes. Y si fuera dentro del commit de merge, 14 resoluciones quedarían enterradas bajo una función nueva y D no se podría revertir sola. El costo: el commit de merge queda con un rojo conocido (el pin sin D) y no pasa `pnpm check` por sí solo. La sesión principal autorizó ese commit el 2026-10-12, con el rojo limitado a una sola prueba conocida (paso 4) y D en commits propios después. La alternativa es un commit de merge más grande que ya incluya D, verde pero sin ese historial.

- [x] **0. Preparar, sin cambiar nada.**
  - **Hecho el 2026-10-12.** `feat/chapter-2` estaba en `a4f6e1f` y el `merge-tree` dio los mismos 14 conflictos. El worktree `/Users/angelozdev/me/aws-commit-academy-28bis` (rama `merge/28bis`) y `pnpm install --frozen-lockfile` tardaron 1.3 s. El puerto de Playwright del worktree es el 4190.
  - `git status` solo muestra `concepts/ami.md` (no se toca, no se agrega, no se commitea). Repetir el `merge-tree`: si la lista de conflictos cambió, se relee la tabla de abajo.
  - **Worktree temporal** (autorizado por la sesión principal el 2026-10-12): `git worktree add -b merge/28bis /Users/angelozdev/me/aws-commit-academy-28bis feat/chapter-2` y `pnpm install --frozen-lockfile` allí (el tiempo no se midió). Todo el trabajo de la tarea se hace allí.
    - **Para qué sirve.** Solo para no romper la página del 5180, que sirve el árbol principal y recarga sola (14 archivos con marcas de conflicto la romperían; las mutaciones rompen código a propósito), y para no arriesgar `concepts/ami.md` con un merge a medias.
    - **Es temporal.** El estudiante pidió expresamente no tener el capítulo en un worktree. En cuanto el trabajo está listo, en el árbol principal se hace `git merge --ff-only merge/28bis`, y enseguida `git worktree remove /Users/angelozdev/me/aws-commit-academy-28bis` y `git branch -d merge/28bis`. Desde ahí el capítulo vuelve a vivir solo en el árbol principal.
    - **`concepts/ami.md`.** El avance rápido no lo toca: `main` no lo cambió (`git diff --name-only feat/chapter-2...main`, 2026-10-12).
    - El puerto de Playwright sale de la ruta del worktree; si choca con el del árbol principal, `--strictPort` avisa y se cambia el nombre de la carpeta.
  - **Esta sección ya está commiteada en el plan.** Desde ese commit no se hacen más commits en `feat/chapter-2` hasta que la tarea aterrice. Si la rama se mueve igual, esos commits se traen a `merge/28bis` con un merge normal antes del paso 12: el avance rápido ya no valdría y las reglas prohíben reescribir la historia.
- [x] **1. La base de la regla C (hecha el 2026-10-12).** `pnpm check` completo sobre `11587fc` pasó en verde: Vitest 2938 tests en 98 archivos, Playwright 126, jscpd 0 y `golden-traces.json` sin cambios (log: `baseline-11587fc-check.log`, en el scratchpad). Desde entonces solo hubo commits de documentos. **La base B0 de la regla C es `11587fc`** y reemplaza a `dcfc04c`. Cada rojo de los pasos siguientes se compara con B0.
- [x] **2. Merge sin commit.** `git merge --no-ff --no-commit main`.
  - **Hecho el 2026-10-12.** Los 14 conflictos de la tabla, más lo que git no marcaba: `piece-card.test.tsx` (`trigger`), `opensCard` sin `piece.settings`, `LOST_TO_OTHER_OFFICE` (llegó solo) y `catalog-cells.tsx` (se unió solo y pasa `typecheck`). Sin marcas de conflicto; `onInspect|OnInspect|inspect-handlers|inspectHandlers|SETTINGS_BUTTON|settings\?\.id|term-tip` solo lista `floating-box/term-tip`, su clase CSS y su importación.
  - Git rechaza `git commit -- <rutas>` a mitad de un merge. **Esta es la excepción a la regla de las rutas explícitas:** se agrega cada archivo con `git add <ruta>`, se comprueba que `git diff --cached --name-only` no lista `concepts/ami.md` ni nada de `labs/`, y se hace `git commit` sin rutas. Para salir de un merge malo: `git merge --abort` (`reset` sigue prohibido).
  - Resolver los 14 conflictos (tabla de abajo) y los arreglos que git no marca, de una pasada.
  - Comprobar: `git grep -nE "<<<<<<<|>>>>>>>" -- .` vacío; `git grep -nE "onInspect|OnInspect|inspect-handlers|inspectHandlers|SETTINGS_BUTTON|settings\?\.id|term-tip" -- src tests` solo lista `floating-box/term-tip` y nada más; `pnpm typecheck`.
- [x] **3. Reescribir con `page.clock` las e2e de `main`.** Va dentro del merge: el lint prohíbe `waitForTimeout`, y las de `main` lo usan.
  - Las pruebas conservan su nombre. Instalar el reloj antes de cargar la página; esperar a que la escena quede quieta (`standStill`) y congelar el tiempo (`freezeTime`) antes del clic.
  - El viaje del ratón (30 pasos de 30 ms, unos 900 ms) mueve el reloj con `page.clock.runFor(30)` tras cada paso, para que los 900 ms sean de la página y no del equipo. La gracia (400 ms) se pasa con `passTheGrace`, que ya existe en el archivo.
  - Son seis: `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` (01-05: `main` la cambió para fijar con un clic y esperar con `waitForTimeout`; la rama ya usa el reloj; queda con el clic y con `passTheGrace`), `a pinned box survives a human-paced trip across another piece and scrolls under the mouse` (1440×900, 1280×800 y 1000×700), `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back`, `with touch, a tap pins the box and a tap outside releases it`, `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box` y `a term definition can be reached with the mouse, and Escape closes it`.
  - `merge/build_spec.py` muestra cómo se reescribió cada una en el merge viejo (`holdTheClock`, `travel` con `runFor`, `passTheGrace`). Se usa de guía, no se corre.
  - **Hecho el 2026-10-12.** Las seis, con sus nombres y sin `waitForTimeout`. Qué reloj usa cada una está en el cuerpo de `5110bad`. Cuatro adaptaciones a la rama en «Lo que el plan no previó».
- [x] **4. Cerrar el merge.**
  - **Hecho el 2026-10-12: `5110bad`** (`Merge branch 'main' into feat/chapter-2`). `pnpm check:fast` verde: Vitest 2970 tests en 100 archivos (B0: 2938 en 98), jscpd 0. Playwright 133 tests: 131 pasan y 2 fallan (B0: 126). `golden-traces.json` sin cambios; `entities.spec.ts` pasa sin regrabar. Las seis pruebas reescritas y la del 01-05: 80 de 80 en 10 repeticiones.
  - **Los dos rojos del commit, aceptados por la sesión principal el 2026-10-12** (el mismo mecanismo: una caja fijada que tapa «Listo» de una tarjeta abierta; los dos pasan en B0, líneas 169 y 233 de `baseline-11587fc-check.log`; los arregla D). Cada uno con una sola entrada: `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window` (`1280×360, the firewall with its tabs: its foot is out of reach`) y `the last element of every card can be reached by scrolling on a low screen` (`1280×720, the firewall with its tabs`: la caja, de 352×254 en 532,450, tapa «Listo» en 473,441). La segunda no la preveía el plan.
  - `pnpm check:fast` verde.
  - `pnpm e2e` completo. Cada rojo se compara con B0 (`11587fc`).
  - **Rojo conocido y autorizado en este commit: una sola prueba.** `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`, a 1280×360, porque una caja fijada tapa «Listo» o un botón de una tarjeta abierta, y eso pasa en B0. El caso seguro es «the firewall with its tabs: its foot is out of reach» (falló en las 5 corridas del merge viejo). Esa prueba recorre muchas escenas y ventanas: puede fallar en más de una (las escenas del capítulo 2 no estaban en el merge viejo), siempre por ese motivo.
  - **Cualquier otro rojo es un error de la resolución:** otra prueba, o esa misma por otro motivo. Se para, se informa y se arregla antes de commitear.
  - `entities.spec.ts` pasa **sin regrabar** las capturas. Si una cambia, se para y se informa.
  - `git diff --exit-code src/levels/04-iaas/golden-traces.json`.
  - Commit de merge (mensaje en «Commits»), con el rojo conocido en el cuerpo, para que quien haga `bisect` lo reconozca.
- [x] **5. Mutaciones del pin, sobre el commit de merge.** En el worktree, una por una: aplicar, correr la prueba nombrada, ver que falla, `git checkout -- <archivo>` y comprobar que `git status` queda limpio. Se definen contra `src/ui/floating-box/use-floating-box.ts` de `main`:
  - **M1:** `pin` no deja `pinned: true`. Debe fallar `a pinned box survives a human-paced trip across another piece and scrolls under the mouse` al clic, y el Vitest `clicking a stamp pins its box with «Fijada» and «Cerrar», and hovering another piece leaves it`.
  - **M2:** `preview` ya no ignora a un disparador nuevo cuando la caja está fijada (se quita su guardia de `pinned`). Debe fallar la prueba del viaje, después del recorrido.
  - **M3:** el temporizador de la gracia ya no respeta `pinned` (se quita la condición). Debe fallar la prueba del viaje: el recorrido dura más que la gracia.
  - Si una mutación no hace fallar su prueba, la reescritura con el reloj perdió lo que probaba: se arregla la prueba, no la mutación. El resultado va en `tests/e2e/CLAUDE.md`, con fecha.
  - **Hecho el 2026-10-12**, en el árbol que quedó en `5110bad` (corridas antes de commitearlo, con el índice idéntico al commit), una por una, con `git checkout -- src/ui/floating-box/use-floating-box.ts` después y `git status` limpio. La línea que muta cada una: M1, la 62 (`commit({ key, pinned: true, … })` de `pin`); M2, la 54 (`if (latest.current.pinned) return;` de `preview`); M3, la 50 (`&& !latest.current.pinned` del temporizador). Las tres fallan donde se esperaba. Resultados en `tests/e2e/CLAUDE.md`.

    | Mutación | Resultado esperado | Resultado real |
    |---|---|---|
    | M1: `pin` no deja `pinned: true` | falla al clic | las 3 pruebas del viaje fallan en el clic (`toContainText(PINNED)`, línea 633 de `card-layout.spec.ts`); Vitest (`incident-screen.test.tsx` y `src/ui/floating-box`): 18 fallos en 3 archivos, entre ellos `clicking a stamp pins its box with «Fijada» and «Cerrar», and hovering another piece leaves it` |
    | M2: `preview` no ignora a un disparador nuevo con la caja fijada | falla tras el viaje | las 3 fallan después del recorrido (línea 647); no se corrió Vitest |
    | M3: el temporizador de la gracia no respeta `pinned` | falla tras el viaje | las 3 fallan después del recorrido (línea 647); Vitest (los mismos archivos): 3 fallos en 3 archivos |
- [x] **6. El oráculo, en rojo.** Antes de escribir D, agregar a `card-layout.spec.ts` la prueba del oráculo y las de D que no dependen del motivo (lista en «Tests»). Deben fallar; se anota cuántas escenas × ventanas fallan. Es la medida que dice cuántas quedan sin sitio.
- [x] **7. D, con TDD.** (a) `inspectionPlace` y su prueba. (b) El gancho y la pantalla. (c) El CSS. (d) El resto de las pruebas. Los detalles están en «El diseño de D».
- [x] **8. El oráculo, en verde.** `card-layout.spec.ts --repeat-each=10` pasa entera, y con ella `the last element of every card can be reached by scrolling on a low screen` a 1280×720 (el segundo rojo del commit de merge). Las pruebas de `main` que cambian a propósito se ajustan ahora (lista en «Tests»). **Orden vigente desde el 2026-10-17** (decisión de la sesión principal): `--repeat-each=10 --workers=4`, porque la prueba vieja `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`, sola y con 10 copias a 8 procesos, tarda de 2.7 a 3.0 m contra el límite de 180 s (J16 del backlog). Las dos pruebas nuevas pesadas corren una vez por ventana.
- [x] **9. Mutaciones de D.** Igual que el paso 5, ahora con el código de D:
  - **D1:** `inspectionPlace` siempre devuelve `right`. Fallan el oráculo y `with a card open and room beside it, the box of another piece takes the side the card leaves free`.
  - **D2:** la pantalla no suelta la caja fijada cuando no hay lugar. Falla `with a card open and no room beside it, a hover shows no box and a pinned box is released`.
  - **D3:** se quita la espera de la caja del clic que abre una tarjeta. Falla el Vitest `the box of the click that opens a card is not drawn until the card is measured`.
  - **Hecho el 2026-10-17**, sobre `88053a7` con el árbol limpio, una por una y con `git checkout -- <archivo>` después (`git status` vacío). Las tres fallan donde se esperaba. D1 (`inspection-place.ts`, línea 37): 7 de las 8 pruebas de `inspection-place.test.ts`, el oráculo a 1280×360, `the inspection box covers no card of the map…` a 1280×360 y 1000×700, la prueba vieja de la tarjeta junto a una pieza, `the last element of every card can be reached by scrolling on a low screen` y las dos pruebas de los lados. D2 (`use-inspection.ts`, línea 60): `with a card open and no room beside it…` y 2 pruebas de Vitest. D3 (`use-inspection.ts`, línea 114): el Vitest nombrado. `no card is clipped and cards never overlap…` sigue pasando con D1: `cardProblems` no cambió a propósito, y el oráculo y la prueba de solape son los que guardan D. Resultados y líneas en `tests/e2e/CLAUDE.md`.
- [x] **10. El motivo** (decididas 42 y 43). Sin sitio, la caja no se abre y ahora lo dice: una nota (`Message`, variante `note`) en el panel lateral, bajo la tarjeta de Lucía, y la ayuda gris sin la frase que promete la caja fija mientras haya una tarjeta abierta. Los detalles están en «Dónde se dice el motivo». Va en su propio commit (el tercero).
  - **Hecho el 2026-10-17**, en el commit 3. `useInspection` devuelve `noRoom` (empieza con el primer intento de caja sin sitio, se queda mientras la tarjeta siga pedida y termina al cerrarse ella o al hallar sitio una caja); `IncidentScreen` escribe la nota bajo `LuciaCard` con `SCREEN_TEXT.noRoomForTheBox`, la frase de la decidida 43 sin cambios. `SCREEN_TEXT.inspectHelp` queda con su primera frase y la de la caja fija pasa a `SCREEN_TEXT.inspectPinHelp`, que la pantalla dibuja en un `span` solo cuando no hay tarjeta abierta (así las pruebas que leen `inspectHelp` no se editaron). Vitest: la prueba `the reason is written when a piece is inspected and the card takes both places` y otras dos; la e2e `with a card open and no room beside it, a hover shows no box and a pinned box is released` suma la nota, que no tapa la terminal, y la ayuda sin la frase.
- [x] **11. Las capturas del residuo (decidida 52, O-5).** Después de D, con el árbol fusionado: capturas reales de los dos lugares de la caja de `servidor2` a 1280×500 en el 04-01, y la medida de «El residuo del 04-01 a 1280×500». Se guardan en el scratchpad y no se commitean. **La medida decide entre B y A** (decidida 52): si la sala a la izquierda llega a 120 px o más, vale B y el orquestador agenda la tarea que le sigue; si no, vale A y el residuo queda anotado en el backlog. **La tarea no cambia el lugar de la caja por ello.**
  - El lugar derecho es el de siempre. Para ver el izquierdo sin tarjeta, en una captura de prueba fuera del repo se fuerza `data-place='left'` en el contenedor de la caja, o se usa una ventana que lo elija.
  - **Hecho el 2026-10-17** (25 muestras iguales, con el mouse sobre `servidor2`): a 1280×500 la sala que `inspectionRoom` deja a la derecha es de 92.2 px (la caja queda en el mínimo de 120 y tapa «Security Group servidor2») y la que dejaría a la izquierda, de 169.8 px, sin cubrir ninguna marca; a 1280×800, de 242.2 y 319.8 px. **Vale B**: la sala a la izquierda llega a 120 px o más. Capturas en `.superpowers/sdd/2026-10-11-follow-the-packet-chapter-2/captures-28bis/` del árbol principal, sin commitear. Medida en `tests/e2e/CLAUDE.md` y en el backlog (J17).
- [x] **12. Cierre y traer la rama.** `pnpm check` completo en el worktree; luego, en el árbol principal, comprobar que `feat/chapter-2` no se movió (ver el paso 0) y hacer `git merge --ff-only merge/28bis`; `git worktree remove` y `git branch -d merge/28bis`. Hecho el 2026-10-17: `feat/chapter-2` se había movido, así que se trajo a `merge/28bis` con un merge normal (`4fccc95`, solo documentos, sin conflictos); `pnpm check` completo en verde sobre `4fccc95` en el árbol principal; `git merge --ff-only merge/28bis` en el árbol principal (`feat/chapter-2`: `a878d42` → `4fccc95`), `git worktree remove /Users/angelozdev/me/aws-commit-academy-28bis` y `git branch -d merge/28bis`.

**Lo que el plan no previó (2026-10-12, al ejecutar los pasos 2 a 5).**
- **Un segundo rojo**, del mismo tipo que el aceptado (ver el paso 4): `the last element of every card can be reached by scrolling on a low screen` a 1280×720. El paso 8 lo pone en verde con D.
- **La caja del ping perdido queda capada a 141 px** a 1280×800 y 1000×700 cuando ya se conocen los términos del capítulo 2 (el tope de `118d9b0`, con el mínimo de 120 px). Su último campo mide 96 px y el cuerpo, 92. Por eso `isInside` de `tests/e2e/card-boxes.ts` acepta un elemento más alto que su scroller cuando su final se ve; `reachWithWheel` sigue igual.
- **A 1440×900 el camino recto del viaje no cruza ninguna etiqueta de este mapa** (el sello cayó junto a `router-oficina`): `crosses` nombra `router-oficina`, la etiqueta por la que pasa la ruta, y no `impresora`. Lo que el plan dice de «cruza `impresora` a 1440×900» ya no vale en esta rama.
- **El viaje reanuda el reloj antes de la rueda**, porque `reachWithWheel` espera dos cuadros de la página y una página pausada no los dibuja (la prueba se colgaba hasta el límite de tiempo).
- **La prueba del teclado instala el reloj justo antes de Escape**, no antes de cargar: con el reloj instalado desde el inicio, el scroll suave de PageDown no arrancó en 8 de 16 corridas con la máquina cargada (0 de 16 sin reloj, 16 de 16 con la instalación tardía; 2026-10-12). El único temporizador que necesita es la gracia que empieza Escape.
- **`LUCIA` de `main` (el título de la tarjeta de Lucía) pasa a `LUCIA_CARD`** en `card-layout.spec.ts`, porque la rama ya tiene `LUCIA` (`laptop-lucia`).
- **`a pinned box whose piece is gone is released`** (`incident-screen.test.tsx`) llega a los ajustes por la pestaña «Ajustes de red», con el teclado (`ArrowRight` desde la pestaña «Terminal»): ya no hay segunda entrada en la etiqueta (V15 = B). Y `piece-card.test.tsx` pasa `trigger` a `PieceLabel`.

**Lo que el plan no previó (2026-10-17, al ejecutar los pasos 6 a 11).**
- **`feat/chapter-2` se movió** (8 commits de documentos del curso, de `a4f6e1f` a `a878d42`): el avance rápido del paso 12 ya no vale. Ver «Dónde está la rama».
- **La ayuda gris se parte en dos constantes.** `SCREEN_TEXT.inspectHelp` conserva la primera frase y `SCREEN_TEXT.inspectPinHelp` guarda «Haz clic, o pulsa Enter, para dejar la caja fija.». Sin tarjeta abierta se ve el mismo texto de antes.
- **La J16 del backlog ya estaba tomada** por la fila del tiempo límite de la prueba vieja (la escribió el commit 2). El backlog de la 28 bis llega a J18, y las filas de la Tarea 28 quinquies pasan de J16 y J17 a J19 y J20 en su sección.
- **La nota del motivo queda bajo el borde del panel en ventanas bajas** (backlog J18): a 1000×700 está en y = 639…702 y a 1000×600 o menos hay que desplazar el panel. La decidida 42 pide ese lugar, así que se cumplió; moverla cambia lo que el jugador ve y lo decide la sesión principal.

**Cómo se resuelve cada conflicto.** Regla general: lo que la rama cambió se queda como está y se le suma lo que `main` agregó.

| Archivo | Qué choca | Resolución |
|---|---|---|
| `docs/plans/2026-10-08-follow-the-packet-followups.md` | La rama trae J6 a J14; `main` trae una J12 distinta | Se conservan las filas de la rama. La J12 de `main` (el sello «?» del 01-08 a 390×844 queda fuera de la ventana) pasa a **J15**; se anota que `46c4074` y el plan de `main` la llaman J12. J7 pasa a «Resuelta por `46c4074`». J14 sigue pendiente hasta D |
| `src/scene/entities/CLAUDE.md` | El párrafo de los paquetes | El texto de la rama (formas por protocolo, etiquetas con puertos) más la frase de `main`: el sello reparte las props de su disparador, que da la pantalla |
| `src/scene/game-scene.tsx` | La firma de `GameScene` | `blockName = null` de la rama y `inspectTrigger` de `main` en lugar de `onInspect` |
| `src/scene/overlay/CLAUDE.md` | La viñeta de la etiqueta | La de la rama (un botón, sin segunda entrada) más la de `main` (el disparador, `data-pinned` y su anillo). Sale la mención de `inspect-handlers` |
| `src/scene/overlay/piece-label.tsx` | Comentario y firma | La firma de `main` (`trigger: TriggerProps`) y el comentario de la rama (un solo botón). Sin segundo botón |
| `src/scene/overlay/piece-label.test.tsx` | La prueba de pasar el mouse | La de la rama (un solo botón), escrita con el `trigger` de `main`: pasar el mouse sobre `tu-laptop` llama una vez a `onPointerEnter` |
| `src/scene/traffic/traffic.tsx` (2) | Importaciones; firma y `tagsOf` | Las importaciones de la rama (`spreadTags`, `translationDistance`, `PacketTags`, `Vec2`) más el tipo `InspectTrigger` de `main`; `tagsOf` y su comentario de la rama, con `inspectTrigger` en la firma de `Traffic` |
| `src/ui/CLAUDE.md` | El primer párrafo y las viñetas | El primer párrafo de la rama (`map-cards/`, `side-cards/`), con `floating-box/` de `main`; las viñetas de `main` sobre la definición de un término y las cajas flotantes; la de la rama sobre `Message` |
| `src/ui/incident/CLAUDE.md` | Viñetas de tarjetas y estado | La estructura de la rama (la viñeta de la tarjeta del caso ya vive en `side-cards/`); de `main` solo «Fijada» y «Cerrar» en la banda. Se queda «State lives in the session reducer … including the game clock» de la rama |
| `src/ui/incident/incident-screen.test.tsx` | Importaciones | La unión: `OUTCOME_TEXT` y `type SendIncident` de la rama, `INSPECTION_TEXT` de `main`. Los dos `describe` de `main` sobre el pin entran tal cual; se arregla lo que mencione la segunda entrada de una etiqueta |
| `src/ui/incident/incident-screen.tsx` (3) | Importaciones, consts, `activate` | Sin `inspect` en la importación de `@/game`; `piece` y `origins` de la rama; `activate` llama a `opensCard`. `opensCard` sin `piece.settings`. `useInspection(session, opensCard)` de `main`, y `inspectTrigger={trigger}` y `InspectionBox` con `pinned`, `heading` y `onClose` |
| `src/ui/incident/use-inspection.ts` (2) | `main` lo reescribió sobre `useFloatingBox`; la rama le suma el tope de alto | **Se toma el archivo de `main` y se le conserva el tope de la rama.** La capa de layout que escribe `--inspection-room` (`inspectionRoom` con `MAP_MARKS`, tras `118d9b0`) se queda y cambia su dependencia: de `[inspecting]` a `[shown]`. Si se pierde, no falla nada de golpe: lo guardan las dieciocho pruebas `the inspection box of <name> lies inside the window and covers no label or stamp` de `incidents.spec.ts` (nueve piezas del 04-01 en dos ventanas) |
| `tests/e2e/CLAUDE.md` | Viñetas de `card-layout.spec.ts` | Las de la rama más las dos de `main` sobre las cajas flotantes (adaptadas al reloj). «Known gap» se queda: lo cierra D |
| `tests/e2e/card-layout.spec.ts` (6) | Importaciones, constantes, ayudantes, y los bloques de pruebas | Rutas de la rama (`@e2e/chapter-1/chapter-1-play`, `SETTINGS_TAB`), más `LOST_TO_OTHER_OFFICE`. Constantes de `main` (`PINNED`, `CLOSE`, tiempos del viaje…). Ayudantes de `main` con `travel` movido por `page.clock.runFor`. Las pruebas, reescritas (paso 3) |

**El diseño de D.**

*Quién mide la tarjeta.* El gancho `useInspection`, leyendo el DOM: el rectángulo de la tarjeta (`.map-card`) y el del mapa (`.incident__map`). El selector es una constante nueva, `MAP_CARD`, en `src/scene/html-layer.ts`, exportada por el barril de `@/scene` junto a `MAP_MARKS`. Por qué el DOM y no la escena:
- La tarjeta vive dentro del `Html` de drei, que dibuja sus hijos en una raíz de React propia, después del commit del clic (`Html.js` hace `root.render` en un efecto de layout; leído, no medido). Medir solo al abrir la caja se pierde justo el caso que se arregla.
- El DOM tiene lo que el cálculo no: el alto real, el tope `--card-room` y el `clamp` bajo la barra.
- Subir el rectángulo a un estado de `IncidentScreen` lo repintaría en cada fotograma mientras el jugador arrastra el mapa, y cada repintado vuelve a dibujar la tarjeta.
- La escena no importa la UI. Lo que `useCardSide`, `terminalSide` y su `avoid` deciden es el lado de la **tarjeta**, que D no mueve: no se tocan.

*Cómo se avisa a la caja.* No hay aviso: la caja mira.
- Un observador, `useMutationObserverTarget` de `@mantine/hooks` (9.7.1; firma leída en `node_modules`: `(callback, options, target)`), sobre el mapa, con `childList`, `subtree` y `attributes` filtrado a `style` y `class`. Se dispara cuando la tarjeta aparece, cambia de pestaña o de alto, cambia de lado (la clase `map-card--left`, `--right` o `--dock`) y cuando la cámara la mueve (drei escribe `style.transform`).
- Solo actúa si hay una caja a la vista o una tarjeta pedida. Con una tarjeta abierta y una caja a la vista, cuesta tres lecturas de rectángulo por mutación.
- Su callback corre antes de pintar. **Mide y escribe `data-place` y `--inspection-room` sobre el contenedor de la caja en el acto**, como hoy lo hace la capa de layout con el tope, y después avisa a React para soltar el pin y, más adelante, escribir el motivo. Así, entre dos fotogramas, el DOM no se queda con la caja sobre la tarjeta. Eso se puede comprobar en el DOM después de cada fotograma pasado a mano; el orden real de pintado no se puede observar desde la prueba.
- **La caja del clic que abre una tarjeta espera.** `IncidentScreen` le dice al gancho que hay una tarjeta pedida (`card !== null || piece !== null`). Mientras esa tarjeta no esté en el DOM, el contenedor lleva `data-hold` y no se ve (`visibility: hidden`). Cuando el observador la mide, quita la marca y pone el lugar. Sin esto, la vista previa que ya estaba abierta antes del clic se vería encima de la tarjeta durante los fotogramas que tarda en dibujarse.
- Plan B, solo si el oráculo con fotogramas lo exige: `useInterval` de la misma librería a 32 ms o menos. Se justifica por escrito en la guía. No hay un gancho de fotogramas en `@mantine/hooks` (lista de `esm/` revisada el 2026-10-12).

*Cómo se elige el lugar.* Una función pura nueva, `inspectionPlace`, en `src/ui/incident/inspection-place.ts`.
- Entra: el rectángulo del mapa; el ancho de la caja (22 rem, con el tope de `100%` menos dos márgenes) y su alto más grande (45 % del mapa); el margen (`--space-md`); el rectángulo de la tarjeta, o null; y el lugar que la caja tiene.
- Sale: `right`, `left` o `null`.
- Un lugar está libre si el rectángulo de la caja en él, **a su alto más grande**, queda a 8 px o más de la tarjeta. Una tarjeta sin tamaño no toca nada (es el caso de jsdom y el de una tarjeta que aún no se dibujó).
- Entre dos lugares libres gana el que la caja ya tiene; si abre de cero, `right`. Un lugar libre no se cambia nunca por otro: la caja no salta mientras no toque.
- **Solo la tarjeta decide el lugar.** Las etiquetas, los sellos y los nombres de piso siguen como hoy: topan el **alto** después de elegir el lugar, con los bordes del lugar elegido (`inspectionRoom`). El alto más grande no depende de lo que muestra la caja, así que el lugar no cambia de una pieza a otra mientras la tarjeta siga igual.
- Cuando la tarjeta se cierra, la caja se queda donde está hasta que ella misma se cierre. La siguiente caja que se abra de cero vuelve a `right`.
- **Debajo de 901 px D no hace nada.** La caja es entonces un bloque bajo el mapa y no puede tapar una tarjeta. El gancho lo sabe porque el contenedor no queda sobre el mapa (compara los rectángulos); no repite el 900 del CSS. El CSS del lugar izquierdo va dentro de `@media (min-width: 901px)`: una regla con atributo pesa más que la clase sola del bloque de 900 px y la ganaría.

*Qué pasa sin sitio.* Ni el lugar derecho ni el izquierdo están libres:
- Una vista previa (mouse o foco) no se dibuja. Su estado en `useFloatingBox` sigue (la gracia y la salida funcionan igual).
- Una caja fijada se suelta con `release()`: el pin sale, la pieza deja de llevar su anillo y nunca queda «Fijada» a la vista sin caja. Si el foco estaba dentro de la caja, `release()` lo devuelve al disparador.
- La caja no vuelve sola cuando la tarjeta se cierra: el jugador la fija otra vez.
- A qué ventanas toca: una tarjeta acoplada abajo a la izquierda llega a 306 px del borde del mapa (6 de margen y 300 de ancho). Con la separación de 8 px, la caja cabe a la derecha desde un mapa de unos 682 px, es decir, una ventana de unos 1062 px (O-1 decía unos 1054, sin la separación). Entre 901 y ese ancho, con esa tarjeta abierta, no hay caja. La altura también cuenta: a 1280×360 casi todas las tarjetas del mapa tocan los dos lugares.

*Una caja fijada.*
- Fijada, con una tarjeta que aparece después (el clic que abre la tarjeta de su pieza o el de otra): si el lugar que tiene se toca, pasa al otro; si ninguno está libre, se suelta.
- Una tarjeta que cambia de pestaña, de alto o de lado, o que la cámara mueve, vuelve a medirse con la misma regla. Una caja que el jugador fijó y que el arrastre del mapa deja tocando la tarjeta cambia de lado (decidida 44).

*Dónde se dice el motivo* (decididas 42 y 43). El gancho entrega `noRoom` (hay una pieza con la caja pedida y el lugar es `null`); la pantalla lo escribe.
- **Dónde.** En una nota del panel lateral (`Message`, variante `note`), bajo la tarjeta de Lucía. Ninguna tarjeta del mapa la cubre, por construcción. Aparece con el primer intento de caja sin sitio y se queda mientras la tarjeta siga abierta, para no parpadear. Empuja una vez las tarjetas de abajo (reloj, caso, explicación).
- **Qué dice.** «La tarjeta ocupa el sitio de la caja de inspección. Ciérrala con «Listo» o haz más grande la ventana.» Es exacta: a 1280×360 falta alto y no ancho, por eso «más grande» y no «más ancha». El texto queda sujeto al revisor de textos: el siguiente revisor de bloque lo lee con los demás textos visibles y puede corregirlo.
- **La ayuda gris.** El sitio de la ayuda gris de la esquina no sirve de anfitrión: a veces lo tapa una tarjeta (J2, J8 y la revisión «a card over the help of the inspection box» de `cardProblems` lo dicen). Además, `SCREEN_TEXT.inspectHelp` termina con «Haz clic, o pulsa Enter, para dejar la caja fija», que sin sitio es falso. Mientras haya una tarjeta abierta, la ayuda pierde esa frase.

**El residuo del 04-01 a 1280×500.**
- La caja de `servidor2`, en su mínimo de 120 px, tapa «Security Group servidor2». La causa es una marca, no una tarjeta.
- **D, tal como se aprobó, no lo arregla y esta tarea no lo afirma.** Ninguna prueba nueva lo afirma, como hoy.
- Lo que sí hace la tarea (paso 11): medir y capturar. Con el árbol fusionado y D hecha, a 1280×500 y a 1280×800, pasar el mouse por `servidor2` en el 04-01 y anotar, en `tests/e2e/CLAUDE.md` y en el backlog, la sala que `inspectionRoom` deja a la derecha y la que dejaría a la izquierda (el mismo cálculo con los bordes del lugar izquierdo). Con eso, capturas reales de la caja en cada lugar a 1280×500.
- Con esas medidas y capturas se comprueba la decidida 52 (O-5: ¿puede una etiqueta o un sello decidir también el lugar de la caja?): B si la sala a la izquierda llega a 120 px o más; si no, A. **La tarea no cambia el lugar de la caja por ello.** Si vale B, escribir la prueba del residuo y hacer que el lugar cuente las marcas será otra tarea.

**Archivos:**
- Create: `src/ui/incident/inspection-place.ts` y `inspection-place.test.ts`. `src/ui/incident/` queda en 10 de 12 archivos planos.
- Modify, el merge: los 14 de la tabla; `src/ui/incident/map-cards/piece-card.test.tsx`; `src/scene/catalog/catalog-cells.tsx` si `typecheck` lo pide; `tests/e2e/chapter-1/chapter-1-play.ts` si no trae `LOST_TO_OTHER_OFFICE`.
- Modify, D: `src/ui/incident/use-inspection.ts`, `incident-screen.tsx` y `incident-screen.test.tsx` (el `GameScene` simulado dibuja la tarjeta dentro de un `.map-card`, como la escena real; sin eso la caja del clic que abre una tarjeta nunca dejaría de esperar en jsdom); `src/scene/html-layer.ts` y `src/scene/index.ts` (`MAP_CARD`); `src/styles.css` (`[data-place='left']` dentro de `@media (min-width: 901px)` y `[data-hold]`); `src/copy/screens/incident-ui.ts` (el motivo, decidida 43, y la ayuda gris sin la frase de la caja fija); `tests/e2e/card-layout.spec.ts`; `tests/e2e/card-boxes.ts` (`cardProblems` suma la caja de inspección a los pares de cosas que no deben solaparse).
- Sin archivo nuevo en `src/scene/` (11 de 12) ni en `tests/e2e/` (11 de 12): el oráculo va dentro de `card-layout.spec.ts`, donde viven `MAP_SCENES` y `playWithTheClockPaused`.
- Modify, guías y documentos: ver «Guías».

**Tests.** Los nombres están en inglés y son exactos.

*Vitest, `inspection-place.test.ts`:*
- `takes the right place when no card is open`.
- `takes the left place when the card touches the right one`.
- `has no place when the card touches both`.
- `a card that ends above a place leaves it free`.
- `a card closer than the gap to a place touches it`.
- `a card with no size touches no place`.
- `keeps the place it has while the card does not touch it`.
- `measures the place at the tallest the box may be, whatever it shows`.

*Vitest, `incident-screen.test.tsx`, un `describe` nuevo, `the inspection box steps aside from an open card` (los rectángulos se simulan sobre `getBoundingClientRect`):*
- `a box with no card open takes the right place`.
- `a pinned box moves to the other place when the card takes its own`.
- `a pinned box is released, and its piece wears no pin, when the card takes both places`.
- `a preview is not drawn when the card takes both places`.
- `the box of the click that opens a card is not drawn until the card is measured`.
- `the place does not change from one piece to the next while the card stays`.
- `the reason is written when a piece is inspected and the card takes both places` (la nota del panel lateral, decididas 42 y 43; y la ayuda gris sin la frase de la caja fija).

*Playwright, `card-layout.spec.ts`, nuevas:*
- **El oráculo:** `a card beside a piece keeps its foot in reach right after the click, in a low or narrow window`. Es el cuerpo de la prueba que ya existe, `a card beside a piece stays inside the map, with its foot in view, in a low or narrow window`, con `playWithTheClockPaused(page, scene, stepFrame)` en lugar de `playUntilItRests`, sobre las 12 escenas de `MAP_SCENES` y las 4 ventanas de `LOW_MAP_WINDOWS`. Es lo que hace `oracle/make-oracle.py`, sobre el archivo de hoy. **La de hoy se queda con su nombre y su aserción.**
- `the inspection box covers no card of the map, right after the click and at rest, in a low or narrow window`. Mide el solapamiento de la caja con la tarjeta **después de cada fotograma pasado a mano**, desde el clic hasta que la escena queda quieta (un `eachFrame` propio que se le pasa a `standStill`, que además llama a `stepFrame`). Comprueba el DOM tras cada fotograma, no el orden real de pintado.
- `with a card open and room beside it, the box of another piece takes the side the card leaves free` (01-08 a 1440×900, terminal abierta, sin pin).
- `with a card open and no room beside it, a hover shows no box and a pinned box is released` (01-08 a 1000×700, terminal abierta).

*Playwright, existentes que cambian a propósito (todas de `card-layout.spec.ts`; las cinco primeras las trae `main`, ya reescritas en el paso 3, y D les cambia el escenario):*
- `a pinned box survives a human-paced trip across another piece and scrolls under the mouse`, `with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back` y `with touch, a tap pins the box and a tap outside releases it`: el ayudante `sendTheLostPing` cierra la terminal («Listo») antes de devolver el sello. Prueban el pin, no D, y sin tarjeta la caja toma el lugar de siempre (a la derecha) y el viaje conserva la geometría que `main` midió (cruza `impresora` a 1440×900). Con la terminal abierta a 1000×700 no habría caja.
- `an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view` (01-05): cierra la terminal antes de pasar el mouse por el sello, por lo mismo.
- `a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box`: gana la aserción de que la caja fijada no toca la tarjeta (1440×900). Si ahí no hubiera sitio, se elige una ventana con sitio; D no se debilita.
- `tests/e2e/card-boxes.ts › cardProblems` suma la caja: la usa `no card is clipped and cards never overlap, at 390 px and at desktop width`, que conserva su nombre.
- Vitest: el `GameScene` simulado de `incident-screen.test.tsx` (no es una prueba, es su ayudante).

*Lo que se corre:*
- En cada paso: `pnpm check:fast` y la spec que el paso toca.
- `card-layout.spec.ts` (con `--repeat-each=10` al final), `incidents.spec.ts`, `tests/e2e/chapter-1/` y `tests/e2e/chapter-2/`, `entities.spec.ts`.
- Nunca dos suites en la misma carpeta.

**Cierre.**
- `pnpm check` completo en verde; su hash es la nueva base de la regla C.
- `git diff --exit-code src/levels/04-iaas/golden-traces.json`.
- `entities.spec.ts` sin regrabar capturas.
- El chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado: `LINKS OK`.
- El oráculo: rojo antes de D, verde después, con las cifras en el cuerpo del commit.
- Las seis mutaciones (M1 a M3 y D1 a D3) anotadas en `tests/e2e/CLAUDE.md`, con fecha.
- La medida del residuo (paso 11) anotada en `tests/e2e/CLAUDE.md` y en el backlog; las capturas, en el scratchpad.
- Backlog: J7 resuelta por `46c4074`; J14 y, con casi toda seguridad, J9 resueltas por D (J9 se vuelve a medir a 1000×700 con la terminal abierta: no hay caja y la terminal queda libre); J2 y J8 siguen pendientes (la decidida 42 deja la ayuda gris donde está); la J15 nueva.

**Guías `CLAUDE.md` y documentos que se actualizan.**
- `src/ui/incident/CLAUDE.md`: la viñeta larga de la caja (hoy «it is anchored at the bottom right of the map…»): dos lugares, la tarjeta decide, las marcas topan el alto, `data-hold`, el observador, qué pasa sin sitio.
- `src/ui/CLAUDE.md` y `src/ui/floating-box/CLAUDE.md`: que el pin se suelta también cuando no hay sitio.
- `src/scene/CLAUDE.md` y `src/scene/overlay/CLAUDE.md`: `MAP_CARD` junto a `MAP_MARKS`; la tarjeta no sabe de la caja.
- `tests/e2e/CLAUDE.md`: el oráculo y su razón; «Known gap» pasa a «cerrado por la Tarea 28 bis»; el reloj y el viaje; las mutaciones con fecha; el residuo medido.
- `DESIGN.md`: una frase en la viñeta «A card on the map»: una caja de inspección nunca tapa una tarjeta abierta.
- `src/ui/incident/side-cards/CLAUDE.md`: la nota del motivo bajo la tarjeta de Lucía (decidida 42).

**Commits** (en inglés, Conventional Commits, con la línea `Claude-Session:` como segundo `-m`):
1. El merge, con el mensaje que git propone, como en `de69ac7`: `Merge branch 'main' into feat/chapter-2`. Conventional Commits no cubre los merges. El cuerpo lista los conflictos, el rojo conocido y las pruebas editadas.
2. `feat(ui): move the inspection box away from the open card`. Cuerpo: cifras del oráculo, pruebas que cambian a propósito, mutaciones, backlog.
3. `feat(ui): write why the inspection box has no room next to an open card` (decididas 42 y 43). Lleva también las notas del paso 11 en `tests/e2e/CLAUDE.md` y en el backlog.

**Lo que no se pudo verificar.**
- Nada se corrió: ni `pnpm`, ni Vitest, ni Playwright, ni el merge real. Todo sale de leer código, CSS, `node_modules` y registros. La excepción es la base B0 (paso 1), que sí se corrió.
- **Cuánto tarda en existir el DOM de la tarjeta después del clic.** Se leyó que drei dibuja sus hijos en una raíz propia; no se midió. Es lo único que podría cambiar el diseño. Lo contesta a medias la prueba que mide después de cada fotograma pasado a mano (ve el DOM entre fotogramas, no la pintura). Si esa prueba ve un solo fotograma con la caja sobre la tarjeta, entra el plan B (`useInterval`) o se vuelve a pensar la espera.
- Cuántas escenas × ventanas de `MAP_SCENES` quedan sin sitio: no se calculó. Depende de dónde caiga cada tarjeta.
- Que las pruebas del pin pasen a 1000×700 con la terminal cerrada: se espera, no se corrió.
- La sala izquierda a 1280×500 en el 04-01: la mide el paso 11.
- Que los 14 conflictos sean todos: sale de `merge-tree` (el mismo algoritmo), no del merge real. Los arreglos que git no marca salen de `grep`; `typecheck` puede encontrar más.
- Qué línea mutó cada M1 a M3 del merge viejo.
- Que el observador corra antes de pintar en este juego: es el comportamiento de `MutationObserver`; no se probó aquí.
- El tiempo de `pnpm install` en un worktree nuevo.

**Review Focus:** 2, 14, 16, 25 y 26.

---

### Tarea 28 ter: el aviso de un router sin ruta, en palabras llanas en el capítulo 1 (O-3 = A1)

**Presenta:** ningún término. **Depende de:** O-3 = A1 (2026-10-12). No bloquea nada.

Mientras el término `net-unreachable` no se conoce, el aviso de un router sin ruta deja de llamarse «Host» y se dice en palabras llanas: «un router avisó que no tiene ruta a esa red». Con el término conocido sigue llamándose «Destination Net Unreachable». Hoy ningún incidente del capítulo 1 lo muestra: el cambio es de copia y de pruebas. El estudiante aprobó que el capítulo 1 cambie lo que muestra en ese caso.

**Archivos:**
- Modify: `src/copy/packet-labels.ts` (`WARNING_TERM` y `warningOf`: el aviso `net-unreachable` admite «sin término» mientras el término no se conoce); `src/copy/reasons.ts` (los casos que dicen `warning('host-unreachable')` y vienen de un router sin ruta; el aviso de host inalcanzable no cambia); `src/game/view/revealed-routers.ts` (`visibleIp` usa hoy `host-unreachable` para los dos avisos del traceroute); `src/game/flow-runs.ts` (`visibleWarning` lee `warning.term`); `src/copy/CLAUDE.md` (la guía cuenta la excepción de `warningOf`). Si «sin término» alcanza a otro lector de `Warning`, se lista en el cuerpo del commit.
- Modify, pruebas: `src/game/view/ladder.test.ts` y `src/copy/terms.test.ts` (las dos de O-3). Otras fijan el mismo comportamiento y O-3 no las nombra: en `src/copy/packet-labels.test.ts`, `names each notice by its term, and a net unreachable by the host one, which shares its ICMP type` y `names the warning of a router with no route Destination Net Unreachable once that term is known, and Destination Host Unreachable before`; en `src/copy/reasons.test.ts`, la fila `forward-no-route` de la tabla `HIDDEN_CAUSES`; en `src/game/flow-runs.test.ts`, `a router with no route is named Destination Net Unreachable by the run once that term is known, and Destination Host Unreachable before`; en `src/game/session.test.ts`, la entrada `no-route` de `is part of the result of its run, with the kind of warning and who generated it`. La lista sale de buscar `net-unreachable`, `host-unreachable`, `warningOf` y `Destination Host` en `src/` y `tests/` el 2026-10-12; puede no ser completa. Cada edición va en el cuerpo del commit.

**Pasos:**
- [x] Reescribir primero las pruebas de abajo: con el código de hoy fallan.
- [x] En `warningOf`, hacer que un aviso `net-unreachable` sin el término `net-unreachable` conocido no lleve el término `host-unreachable`. El caso sin `known` se comporta como el de antes del término.
- [x] Hacer lo mismo en `reasons.ts` y en `visibleIp`. El aviso de host inalcanzable (el del propio equipo y el de un router que no encuentra el host) conserva su término.
- [x] Decir el aviso sin término con el texto que propone O-3 y ningún otro. **Si la etiqueta del paquete en el mapa necesita un texto visible que O-3 no fija, el implementador se detiene y lo informa:** no inventa texto visible. Hecho sin texto nuevo: ninguna pantalla imprime el nombre del aviso (solo se lee si lo hay y quién lo generó), así que lo llano ya está en los textos que existían. La frase literal de O-3 no se escribió porque «ruta» es del capítulo 2 (`explained-behavior-changes`); mientras no se conoce `net-unreachable`, el texto es el genérico «No llegó a su destino.».
- [x] Correr las pruebas de los capítulos 1 y 4 sin editar más que las listadas. Si otra falla por este cambio, la tarea se detiene y se pregunta (Global Constraints).

**Tests:**
- `a router with no route is said in plain words on 01-08 after chapter 2 too, and named Destination Net Unreachable only with the term` (`ladder.test.ts`; pasa a llamarse así desde `a router with no route is named Destination Host Unreachable on 01-08 after chapter 2 too, and Destination Net Unreachable only with the term`).
- `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded, and a router with no route by none until net-unreachable is known` (`terms.test.ts`; pasa a llamarse así desde la de hoy, que ya editó la Tarea 21).
- Las otras de arriba (`packet-labels.test.ts`, `reasons.test.ts`, `flow-runs.test.ts` y `session.test.ts`) pasan a asertar lo mismo: antes del término, ni el aviso ni la causa oculta de un router sin ruta nombran un host.
- El aviso de host inalcanzable no cambia: las pruebas que lo fijan corren sin editarse.
- Cierre: `pnpm check:fast`, más `pnpm e2e tests/e2e/chapter-1/` si toca lo que el capítulo 1 dibuja.

**Review Focus:** 2, 18 y 27.

**Commit:** `fix(copy): say in plain words that a router has no route until net-unreachable is known`.

**Lo que se entregó (2026-10-17).** Commit `efe355b`. Del 01-05 al 02-06, la línea de parada de un router sin ruta dice el genérico «No llegó a su destino.»; antes decía una frase completa que hablaba del host, y eso era inexacto. Desde el 02-07, con el término `net-unreachable` conocido, se llama «Destination Net Unreachable». Del 01-01 al 01-04, el capítulo 4 y del 02-07 en adelante no cambia. El aviso, la línea del resultado y la línea `!N` del traceroute no cambian, y un aviso sin término sigue siendo una estrella muda hasta que se conoce `host-unreachable` (`FIRST_WARNING_TERM`), como antes. Ningún incidente registrado llega al estado que cambió: el revisor corrió los 25, y solo el 02-07 emite `net-unreachable`, donde el término ya se conoce. La frase de O-3 no se escribió, porque usa «ruta», un término que la escalera presenta en el 02-06. El cuerpo del commit dice «palabras llanas» en un sentido más amplio que lo entregado y no se puede enmendar; esta es la versión precisa.

---

### Tarea 28 quater: la consulta DNS de un envío por nombre se dibuja (O-2 = A)

**Presenta:** ningún término. Los de la ficha 02-10 bastan (`dns-query`, `udp`, `resolver`, `port`, `source-port`) y `knownTerms` incluye los del incidente en curso, así que valen desde el primer envío del 02-10. **Depende de:** O-2 = A (2026-10-12). Va después de la Tarea 28 ter y antes de la 28 quinquies y de las Tareas 29 a 33, que usan lo que deja. Hoy ninguna partida real manda por nombre: no cambia nada de lo que el estudiante ya jugó. Una decisión abierta la toca en un solo paso: O-6, la marca de la fila de una consulta en la tabla de traducciones (paso de la vista). Las decisiones técnicas de esta tarea (una sola consulta, el paquete quieto en su puerta, una consulta por envío, su sello y lo que se omite) están en «Decididas sin el estudiante», 45 a 49.

**Propósito:** que un `ping` o un `nc` por nombre muestre en el mapa lo que hace un equipo de verdad antes de mandar el paquete: preguntarle a su resolver. La consulta es un datagrama UDP del equipo al resolver y su respuesta. Gasta el primer puerto de origen del envío, deja su fila en la tabla de traducciones y sale antes que el paquete. Si el nombre sale del archivo hosts, o el equipo no tiene resolver, no hay consulta. El capítulo 4 no cambia.

**Hallazgos de la lectura (2026-10-12; no se corrió nada).**
1. **El puerto cambia de dueño.** Hoy `withSourcePort` (`sequence.ts`) le da su puerto al paquete antes de `run`. Con la consulta primero, el `nc` tomaría el 51514 y la consulta el 51515: al revés de lo decidido (consulta 51514, `nc` 51515). Hay dos salidas. (a) Pasar el contador a `Carried` y dar el puerto del paquete en una etapa nueva después de `dns`. (b) Que la secuencia adivine si habrá consulta, lo que copia la decisión de la etapa `dns` (hosts, `dnsServer`, `lookup`) en otro lugar y puede divergir. Se elige (a).
2. **Un nombre que no se resuelve no gasta puerto propio.** La guía de `src/engine/simulation/` dice que sí gasta (el contador avanza una vez por envío). Un `ncat` real sale en `getaddrinfo`, antes de abrir un socket (`ncat/ncat_main.c` línea 883, nmap 7.93). Con la etapa `port` después de `dns` pasa solo. Cambia un número que el jugador ve (decidida 46).
3. **«Hoy no mueve nada» no es cierto en la escena.** `pathFor` (`src/scene/layout.ts`) termina en la calle para cualquier paso `dns` descartado: la rama `s.stage === 'route' || s.stage === 'dns'` con `drop` devuelve `[puerta, firewall, calle]`. Hoy un `nc` a un nombre inexistente se dibuja saliendo del edificio (leído en el código, no corrido; decidida 46).
4. **El 02-13 no tiene un `ping` por DNS** (ver la nota de la Tarea 32 y O-7), y **el 02-12 no cambia**: su ficha manda solo `dig` y las fichas de espera, y un `dig` es la consulta misma.
5. **El dibujo aprobado de O-2 era estático.** En el prototipo de A el hexágono, pasado `router-oficina`, lleva la etiqueta «UDP 51514 → 53»; la regla V13 (Tarea 21, hecha) dice «UDP 40001 → 53». La implementación sigue V13. Hay que avisar al estudiante de que el dibujo era estático.
6. **Los incidentes 02-01 a 02-09 no mandan por nombre.** Ninguno usa `HOSTNAME`, `DOMAIN` ni `setDnsServer`, y el capítulo 1 no tiene `dnsServer`. Por eso A no mueve ningún número que el estudiante ya jugó: los que se mueven son los de pruebas unitarias.
7. **Ninguna e2e actual manda por nombre.** `tests/e2e/chapter-2/chapter-2.spec.ts`, `chapter-2-play.ts` y `card-layout.spec.ts` no tienen `www` ni `dig` (solo `entities.spec.ts` imprime una salida de `dig` de un especimen del catálogo). La primera partida real con consulta es la del 02-10; hasta la Tarea 29, la escena de la consulta se prueba con pruebas de unidad.
8. **Nada del catálogo ni de los términos cambia.** El hexágono de UDP y su etiqueta ya existen (Tarea 21). `dns-query`, `udp`, `resolver`, `port`, `source-port` y `translation-table` ya están en el 02-10 o antes. No nace ningún término (la escalera fija 53) ni ninguna entidad: las capturas de `#/entidades` no se regraban.
9. **IPv6 no se puede nombrar.** Review Focus 4 lista IPv6 entre lo que ningún texto del capítulo 2 nombra. Eso descarta decir en pantalla que hay una segunda consulta (decidida 49).
10. **`the new trace fields are absent from every trace of a VPC` ya cubre el campo nuevo.** Usa una lista de campos permitidos (`vpcFields`): cualquier campo que no esté ahí falla. No hay que editarla.
11. **Carpetas.** Al tope (12 de 12, sin archivos planos nuevos): `src/game/`, `src/game/view/`, `src/game/view/cards/`, `src/ui/`. Con sitio: `src/engine/simulation/` (11), `src/engine/simulation/stages/` (9), `src/engine/dns/` (8), `src/scene/` (11), `src/scene/traffic/` (8), `src/copy/` (11), `src/ui/incident/map-cards/` (11), `tests/e2e/` (11). La tarea crea dos archivos: uno en `stages/` y uno en `src/engine/dns/`.

**Archivos** (por commit; los topes de carpeta están en «Hallazgos», punto 11):

Commit 1, motor:
- Create: `src/engine/simulation/stages/port.ts` (la etapa que da su puerto de origen al paquete que no trae uno; `stages/` pasa de 9 a 10), `src/engine/dns/question.test.ts` (`src/engine/dns/` pasa de 8 a 9).
- Modify: `src/engine/simulation/trace.ts` (`Trace.question` y su tipo `Question`), `context.ts` (`SimContext.question` y el contador de puertos), `simulate.ts` (`Carried.nextSourcePort`, `sendQuestion` en lugar de `sendQuery`, la etapa `port` en `PIPELINE` después de `dns`, `finish` suma el campo), `stages/dns.ts` (`createDnsStage` recibe `sendQuestion`; `askResolver` guarda la consulta), `sequence.ts` (`SequenceState` pasa a ser `Carried`; sale `withSourcePort`), `src/engine/index.ts` (exporta `Question`), `src/engine/dns/resolve.ts` (solo el comentario de `Resolution.query`), `sequence.test.ts`, `src/engine/dns/resolve.test.ts`, `src/game/chapter-1.test.ts` (una prueba nueva).
- Guías: `src/engine/CLAUDE.md`, `src/engine/dns/CLAUDE.md`, `src/engine/simulation/CLAUDE.md`, `src/engine/simulation/stages/CLAUDE.md`, `src/engine/nat/CLAUDE.md`.

Commit 2, vista y textos:
- Modify: `src/game/flow-runs.ts` (`SentPacket.question`, `drawnSends`, `hideStopsOutOfSight`), `src/game/index.ts`, `src/game/view/inspection.ts` (`inspect` encuentra la consulta por su id), `src/game/view/packet-fields.ts` (`dnsField`, `translationField`, y el comentario de `dnsField`, que dice «That question is not drawn and leaves no row in the translation table»), `src/game/view/cards/table-card.ts` (filas de las consultas), `src/copy/screens/incident-ui.ts` (`INSPECTION_TEXT.dnsQuestion` y la marca de la fila), sus pruebas (`flow-runs.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/cards/table-card.test.ts`) y las guías `src/game/CLAUDE.md` (la viñeta de la secuencia: «A traceroute stays out of the sequence … asks no resolver» sigue siendo cierta; suma la consulta de un envío por nombre), `src/game/view/CLAUDE.md` (la viñeta del campo «DNS»: «That question is not drawn and leaves no row in the translation table (decided 4)» deja de ser cierta) y `src/copy/CLAUDE.md`.
- Ningún archivo plano nuevo en `src/game/`, `src/game/view/` ni `src/game/view/cards/`: están en 12 de 12.

Commit 3, escena:
- Modify: `src/scene/layout.ts` y `layout.test.ts` (`pathFor`), `src/scene/traffic/traffic.tsx` (`MapSent.after`, la espera), `use-packet-runs.ts` y su prueba (`useSendOnce` con espera), `schedule.ts` y su prueba (`travelSeconds`), `flow-look.test.ts`, `src/ui/incident/incident-screen.tsx` (pasa `drawnSends` al mapa), y las guías `src/scene/traffic/CLAUDE.md`, `src/scene/CLAUDE.md`, `src/ui/incident/CLAUDE.md`.

Commit 4, documentos:
- Modify: `../../docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md`, en «Simplificaciones declaradas»: la fila «El puerto de origen es 51514 y sube de uno en uno por cada conexión nueva del mismo dispositivo» pasa a decir «por cada conexión o consulta nueva», y dos filas nuevas. Una: «La consulta DNS de un `ping` o un `nc` por nombre es una sola, la del registro A» (porqué: un equipo real manda también la AAAA por el mismo puerto, y `ping` una consulta inversa; el puerto y la fila son los mismos; IPv6 queda fuera del capítulo). Otra: «El equipo del juego no guarda la respuesta: pregunta en cada envío y guarda el resolver» (porqué: algunos sistemas tienen una caché local, `nscd` o `systemd-resolved`, que el juego no modela). En «Base de investigación», las fuentes de «Fuentes y rigor», abajo, con su fecha. `tests/e2e/chapter-2/CLAUDE.md` (la consulta cuenta como un sello más en el resolver).

**Interfaces:**

*Traza.*
- `Trace.question`, opcional: `{ packet, trace }`. `packet` es el datagrama UDP al puerto 53 del resolver tal como salió, con su `sourcePort`. `trace` es su traza completa (encabezado con puertos, `exchange` de consulta y respuesta, `translation` con su fila, saltos, aviso). Es lo que hoy se tira: `Resolution.query` lo calcula y `askResolver` lo descarta.
- `question.trace.dns` lleva lo mismo que `Trace.dns` del paquete que preguntó, con `viaDig` en `true`. Es lo que lleva un `dig`: la caja de la consulta reutiliza la función que imprime la caja de un `dig`, y no nace un segundo estándar. En la traza del paquete que preguntó `viaDig` sigue en `false`.
- Existe solo cuando la etapa `dns` mandó la consulta: un `ping` o un `nc` (`lookup: system`) de un dispositivo de oficina, con `dnsServer`, a un nombre que el archivo hosts no contesta. No existe: con una IP de destino, cuando contesta el archivo hosts, cuando el equipo no tiene `dnsServer` (sigue `dns-unresolved`), en un `dig` (él es la consulta), en una VPC, en cualquier traza del capítulo 1 (nadie tiene resolver) ni dentro de otra consulta.
- Qué hay en cada caso:

| Qué pasó con la consulta | `question.trace` | Paquete que preguntó |
|---|---|---|
| Contestó el resolver (también `NXDOMAIN`, `SERVFAIL` o un nombre sin dirección) | `replied`, con su fila | sigue si hay dirección; si no, `unresolved` con `dns-nxdomain`, `dns-servfail` o `dns-no-address` |
| Un firewall la descartó | `timeout`, sin respuesta | `unresolved` con `dns-resolver-silent` |
| Un router o el emisor avisó | `unreachable` o `ttl-exceeded`, con su aviso | `unresolved` con `dns-resolver-silent` |
| Un equipo sin servicio en el 53 la rechazó | `unreachable`, con Port Unreachable de ese equipo | `unresolved` con `dns-no-resolver` |
| Un equipo con servicio en el 53 que no es resolver contestó | `replied`, con `dns.status` `NO-RESOLVER` | `unresolved` con `dns-no-resolver` |

*Puertos y filas (decidida 6, reformulada).*
- `Carried` gana `nextSourcePort` (por emisor). La secuencia ya no asigna puertos: solo pasa el estado de un envío al siguiente.
- La etapa `port` va después de `dns`. Da su puerto al paquete TCP o UDP que no trae uno. Un envío que termina antes (`address`, o `dns` sin resolver) no toma puerto. Un puerto dado a mano gana y no mueve el contador, como hoy.
- La consulta toma el puerto del mismo contador, antes que el paquete: consulta 51514, `nc` 51515. El 51514 es del juego, como siempre.
- `sendQuestion(ctx, packet)` corre la consulta con la tabla del NAT, el contador y el reloj (`ctx.now`) del envío que pregunta, y le devuelve la tabla y el contador. La consulta deja su fila antes que el paquete: consulta 51514 → 40001, `nc` 51515 → 40002. Un `ping` deja la fila de su consulta y ninguna propia.
- Toda respuesta del resolver sigue llenando su caché, también la de la consulta: no cambia nada de `cacheAfter`.
- Un `simulate` suelto es la secuencia de un envío: el paquete que no pregunta sale del 51514 como hoy, y el que pregunta deja el 51514 a su consulta y sale del 51515. No cambia ninguna traza del capítulo 4 (no tiene resolver) ni del 1.
- La consulta no escribe ningún paso, motivo, salto ni tramo en la traza del paquete que preguntó. La traza anidada es independiente: su `tcpdump` es el suyo y no se mezcla con el del paquete (la guía lo dejaba abierto; hoy nada lee `Trace.tcpdump` en la interfaz).
- El traceroute no cambia: corre `simulate` por sonda y no entra en la secuencia. `sendSequence` no dibuja la consulta de un traceroute (ninguna ficha lo manda por nombre).

*Vista.*
- `SentPacket.question`, opcional: la corrida de la consulta, construida con el mismo `runOf` que cualquier paquete. Tiene su id (`<id del envío>-question`), su paquete, su traza, su etiqueta con puertos (la privada antes del router y la pública después, de `Trace.translation`), su aviso, su sello y su caja.
- `drawnSends(sent)` devuelve la lista que dibuja el mapa: por cada envío, su consulta primero y luego el paquete, con `after` = el id de la consulta. Solo el último envío de cada combinación de fichas está en `Session.sent`, así que solo su consulta queda en el mapa; la fila de todos queda en la tabla.
- `hideStopsOutOfSight` recorre también la consulta: un firewall que el jugador no conoce la frena sin bloquearla, como a cualquier paquete.
- `inspect(session, pieceId)` encuentra la consulta por su id. Su caja es la de un datagrama UDP al 53: definición del paquete, campo «DNS» como el de un `dig` (los registros, si salió de la caché, el TTL), encabezado con puertos, traducción con su fila, «Consulta y respuesta», resultado y causa.
- El campo «DNS» del paquete que preguntó conserva sus dos frases (el encabezado «Antes de mandar el paquete, … averigua la IP de …» y la frase del motivo). Todas siguen siendo ciertas. Suma una tercera línea que dice de qué puerto salió la consulta y que se ve en el mapa; y, si el paquete tiene puerto propio, por qué no es el primero. Cada parte espera a su término (`port`, `source-port`). Si la consulta falló, la causa sigue en la línea donde el paquete se detuvo.
- La tabla de traducciones lista las filas de las consultas junto con las de los paquetes, en orden de tiempo: primero la de la consulta, después la del paquete que la pidió. La fila «en uso» es la que tocó el último envío al final: la del paquete si la tiene, si no la de su consulta.
- Una fila hecha por un datagrama al puerto 53 (de una consulta o de un `dig`) lleva la marca «consulta DNS» en la columna del protocolo cuando `dns-query` ya se conoce, igual que una fila fija lleva «fija». Es una palabra y no solo un color. O-6 = A (decidida el 2026-10-12): la marca se hace.

*Escena.*
- `MapSent.after`, opcional: el id del paquete que este espera. El paquete que preguntó sale cuando la respuesta de la consulta vuelve a su emisor (`travelSeconds` de la consulta, sin su fin). `useSendOnce(send)` gana una espera en segundos desde que el número del envío se ve por primera vez. Sin animaciones (el dibujo quieto) se dibujan las dos trayectorias y las dos etiquetas a la vez, sin espera.
- La consulta es un paquete UDP más: hexágono lleno al ir, anillo al volver (V12 = B), etiqueta «UDP 51514 → 53» que pasa a «UDP 40001 → 53» al cruzar el router que traduce (V13). Termina como cualquier paquete: vuelve con ✓, la frena un firewall conocido con ✕, se pierde con ?, o vuelve un aviso con !.
- Deja su sello propio en su lugar (decidida 48). Pasa por `spreadStamps` y `spreadTags`; en el resolver suma un sello por cada envío por nombre. Cuenta entre los sellos de un lugar que O-4 = G reparte: los que caben se ven y el resto va al sello «+N». O-4 midió el pasillo del 02-03; el del resolver no se midió.
- `pathFor`: el paquete cuya búsqueda del nombre falló (`dns-nxdomain`, `dns-servfail`, `dns-no-address`, `dns-no-resolver`, `dns-resolver-silent`) se queda quieto en la puerta de su dispositivo, como uno que nunca salió (`STAYS_IN_DEVICE`). `dns-unresolved` no cambia: es el del capítulo 1. Su sello es el de siempre para un paquete que no llegó a nadie: `?` (decidida 46).
- Un paquete cuyo resolver el incidente no dibuja no queda bien: cada incidente que manda por nombre dibuja `servidor-dns` en su lista `shown`. Una prueba por incidente lo guarda (Tareas 29, 30 y 33).

*Lo que no cambia.* `Trace.dns` de un `dig`. Las salidas de `nc`, `dig` y `ping` de la terminal (no leen la consulta). El campo «DNS» cuando contesta el archivo hosts («No preguntó a nadie»): ahora el mapa también lo muestra. La caché (decidida 34). Las tareas, las estrellas y los `expect` de los incidentes (leen la traza del paquete que preguntó, que no cambia).

**Pasos:**

Commit 1, motor:
- [x] Escribir primero las pruebas nuevas de `question.test.ts` y reescribir las dos existentes de abajo: con el código de hoy fallan.
- [x] Pasar el contador de puertos a `Carried` y sacar `withSourcePort` de `sequence.ts`. La secuencia solo pasa el estado.
- [x] Crear la etapa `port` y registrarla en `PIPELINE` después de `dns`.
- [x] Reemplazar `sendQuery` por `sendQuestion(ctx, packet)`: corre la consulta con la tabla, el contador y el reloj del envío, y los devuelve. `createDnsStage` lo recibe como hoy recibía `sendQuery` (la etapa no importa el `simulate` que la contiene).
- [x] En `askResolver`, mandar la consulta con una función que llame a `sendQuestion` y guarde `{ packet, trace }` en `ctx.question`. `resolve` sigue sin saber del pipeline.
- [x] Armar `question.trace.dns` desde `Resolution.dns` con `viaDig: true`.
- [x] `finish` suma `question` solo si existe.
- [x] Correr todo el motor y el capítulo 1 sin editar más que lo listado. Si otra prueba falla por el campo nuevo, se detiene y se pregunta: el campo está aprobado (O-2 = A), pero una falla en una traza del capítulo 1 o del 4 sería un error.
- [x] Actualizar los comentarios y las guías que dicen la regla vieja. Se buscaron con `grep` el 2026-10-12 (`sendQuery`, `NOTHING_CARRIED`, `empty state`, `uses no source port`, `leaves no row`, `never leaves its sender`, `uses up a port`, `always gets 40001`):
  - `src/engine/simulation/simulate.ts`: el comentario de `sendQuery` («the question is not one of the player's sends, so it neither uses up a source port nor leaves a row»), el de `simulate` («a resolver answers from no cache but its own initial one») y el de `Carried`.
  - `src/engine/simulation/trace.ts`: el comentario de `DnsTrace.viaDig` («says the lookup was a `dig`»): en `Trace.question.trace.dns` también es verdadero.
  - `src/engine/dns/CLAUDE.md`: el final de la viñeta «The cache» («that question still uses no source port of the sender and leaves no row in the table»), «The tcpdump lines and the legs of the question are not merged…» (pasa a decir que no se mezclan porque la consulta tiene su propia traza), «The question of a lookup is not one of the player's sends» (se reescribe entera) y «Sin verificar» (suma lo de «Fuentes y rigor», abajo: AAAA, PTR, `search`, reintentos, caché del equipo, orden de `nsswitch`, con sus fuentes).
  - `src/engine/simulation/CLAUDE.md`: la viñeta de la etapa `dns` (la parte de `sendQuery`, `NOTHING_CARRIED` y «uses no source port of the sender's counter»), la de `simulateSequence` (`Carried` es `{ nat, dnsCache }` y «A TCP or UDP send that never leaves its sender … still uses up a port»: ahora un envío que termina antes de la etapa `port` no toma puerto) y «The source port in a sequence (`withSourcePort`)».
  - `src/engine/simulation/stages/CLAUDE.md`: la viñeta de `dns` («`simulate.ts` hands it `sendQuery`, which runs a packet from an empty state»), el orden de las etapas (suma `port`) y una viñeta para `port`.
  - `src/engine/nat/CLAUDE.md`: «A loose `simulate(net, packet)` … the same packet always gets 40001».
  - `src/engine/CLAUDE.md`: si cuenta la lista de campos de la traza, suma `question`.

Commit 2, vista y textos:
- [x] Pruebas primero (lista abajo).
- [x] `SentPacket.question` y `drawnSends`; `hideStopsOutOfSight` y `inspect` la encuentran.
- [x] `dnsField` elige el constructor de `dig` por `dns.viaDig`, así que la caja de la consulta lo usa sin una bandera aparte. Se actualiza su comentario («That question is not drawn and leaves no row…» deja de ser cierto).
- [x] La tercera línea del campo «DNS» (textos de abajo).
- [x] La tabla: filas de las consultas, orden y fila «en uso».
- [x] La marca de la fila (textos de abajo). O-6 = A (decidida el 2026-10-12): ya no espera nada.

Commit 3, escena:
- [x] Pruebas primero.
- [x] `pathFor`: los cinco motivos de arriba salen a `STAYS_IN_DEVICE`.
- [x] `useSendOnce` con espera y `travelSeconds`. (En el 2D, M25: no hay `useSendOnce`, `schedule.ts` ni `travelSeconds`; la espera la da `answerBackAt` de `flight-plan.ts` y la usan `waitOf` y `sendSeconds` de `traffic.tsx`.)
- [x] `Traffic` lee `after` y lo traduce a la espera; `incident-screen.tsx` pasa `drawnSends(session.sent)`.
- [x] Sin animaciones, comprobar que la consulta y el paquete se dibujan a la vez y que ninguna etiqueta pisa a otra con `spreadTags`.

Commit 4, documentos:
- [x] La fila del puerto del spec, sus dos filas nuevas, las fuentes y la nota de la guía de e2e.

**Textos nuevos** (borrador; la redacción final la hace quien ejecuta, en lenguaje llano y con los términos que el jugador conoce):
- Tercera línea del campo «DNS» de un `ping` o un `nc` por nombre, con `port` conocido: «La consulta salió del {{port|puerto}} 51514 y se ve en el mapa, antes de este {{packet|paquete}}.» Sin `port`: «La consulta se ve en el mapa, antes de este {{packet|paquete}}.»
- Con `source-port` conocido y un paquete TCP o UDP con puerto propio, una cuarta línea: «Este paquete salió del puerto 51515: en este juego cada intercambio nuevo sale de un puerto nuevo, y la consulta fue el primero.»
- Marca de la fila (solo si O-6 = A): «UDP · consulta DNS», con `{{dns-query|consulta DNS}}` si el término se conoce y «UDP» si no.
- Ningún texto dice que el equipo manda «una sola» consulta, «solo una pregunta» o «la única». Ningún texto nombra un sistema operativo ni IPv6.

**Tests:**

Nuevas, `src/engine/dns/question.test.ts`:
- `a ping by name carries the question that went to its resolver: a udp datagram to port 53 with its own source port`.
- `the question carries the answer of the resolver as the trace of a dig does, and the packet that asked keeps its own dns`.
- `a tcp packet by name leaves from the port after the one of its question`.
- `a source port given by hand wins for the packet and the question still takes the counter`.
- `in a sequence each send by name asks again and its question takes a new source port`.
- `the question leaves a row of the translation table before the packet that asked, and the packet takes the next public port`.
- `a ping by name leaves the row of its question and none of its own`.
- `a name answered by the hosts file sends no question, takes no port for one and leaves no row`.
- `a device with no resolver sends no question`.
- `a dig is the question itself and carries no question`.
- `a packet addressed by IP carries no question`.
- `a question carries no question of its own`.
- `a question that a firewall drops ends the packet as unresolved with dns-resolver-silent and the question has no reply`.
- `a name that does not exist leaves the question replied, the packet unresolved and no port taken by the packet`.
- `a resolver with no service on port 53 answers the question with Port Unreachable and the packet is unresolved with dns-no-resolver`.
- `the question is measured against the second of its send and the answer fills the cache of the resolver for the next send`.
- `a loose simulate is the sequence of one send`.
- `the steps of a send by name are the ones they were: the question writes no step in the trace that asked`.

Nueva, `src/game/chapter-1.test.ts`: `no trace of chapter 1 carries a question`.

Nuevas, `src/game/flow-runs.test.ts`:
- `a send by name has a question run with its own id and stamp, and the run of the packet keeps its trace`.
- `the question run is labelled with its ports, the private source port before the router and the public one after it`.
- `a send addressed by IP has no question run`.
- `a firewall the player does not know stops the question without blocking it`.
- `drawnSends puts the question of each send before the packet that asked and makes the packet wait for it`.
- `a traceroute has no question run`.
- `only the last send of each combination keeps its question on the map while every send keeps its row in the history`.

Nuevas, `src/game/view/inspection.test.ts`:
- `the stamp of a question opens the box of a udp datagram to port 53 with the answer printed as the box of a dig prints it`.
- `the dns field of a send by name says which port its question left from and that the question is on the map, each part once its term is known`.
- `no line of the box says the computer asks only once`.

Nuevas, `src/game/view/cards/table-card.test.ts`:
- `the translations card lists the row of a question before the row of the packet that asked`.
- `a row made by a datagram to port 53 wears the words consulta DNS once dns-query is known` (solo si O-6 = A).
- `the row in use is the one the last send touched last: the packet's if it has one, else the one of its question`.

Nuevas, escena:
- `layout.test.ts`: `a packet that stopped at its lookup stays at the doorstep of its sender, as a packet that never left`; `a packet of an office with no resolver keeps the path it had in chapter 1`; `the path of a question runs to the resolver and back`.
- `use-packet-runs.test.ts`: `useSendOnce with a wait says yes once, when the wait has passed since the number grew`.
- `schedule.test.ts`: `a packet that waits for another leaves when the answer of the other is back at its sender`.
- `flow-look.test.ts`: `the question of a send is drawn with the shapes of udp and ends replied, warned or lost like any packet`.

Existentes que cambian a propósito (cada una va en el cuerpo del commit):
- `src/engine/dns/resolve.test.ts`, `the question in a sequence › does not use up the source port of the sender nor leave a row in the translation table`. Pasa a llamarse `uses a source port of the sender and leaves a row in the translation table, before the packet that asked`. Los números pasan: `nc` por nombre 51515 → 40002 (antes 51514 → 40001) y `nc` por IP 51516 → 40003 (antes 51515 → 40002).
- `src/engine/simulation/sequence.test.ts`, `a lookup by name fills the cache of the resolver and uses neither a port of its sender nor a row of the table, while the dig that follows has both`. Pasa a llamarse `a lookup by name fills the cache of the resolver and its question uses a port of the sender and a row of the table, before the packet that asked`. Los números: `tcp` por nombre 51515 → 40002 (la consulta, 51514 → 40001); `dig` 51516 → 40003; `tcp` por IP 51517 → 40004.
- `src/game/view/inspection.test.ts`, `the dns field of a ping or an nc by name says the device asked its resolver first, or that its hosts file answered`. Gana la tercera línea en el caso del resolver y en el del nombre que no existe; el caso del archivo hosts no cambia.
- `src/game/view/cards/table-card.test.ts`, `the translations card lists the rows of the sent packets in order`. La fila del `dig` pasa de «UDP» a «UDP · consulta DNS» (solo si O-6 = A; si no, la prueba no cambia).
- Se corren sin editarse, y se editan solo si fallan por este cambio: `src/game/view/inspection.test.ts` › `tags only the terms the player knows in the fields of a packet with ports, names, routes and a translation, whichever term is missing` (manda `ping` por nombre), `src/engine/dns/hosts.test.ts`, `cache.test.ts`, `simulate.test.ts` (varias mandan `ping`/`tcp` sueltos por nombre con `simulate`) y `src/game/tasks.test.ts` (`ping` por nombre).
- Siguen sin editarse y deben pasar: `the new trace fields are absent from every trace of a VPC`, `the ICMP branch of the host stage keeps every field it had`, `the first connection of a device leaves from 51514 and each new one adds one`, `a sequence of icmp packets gives the same traces as simulate one by one`, `a sequence of the packets of a VPC gives the same traces as simulate one by one`, `dig does not read the hosts file and ping does`, y el dorado.

**Specs e2e que se corren** (no hay una que mande por nombre hasta la Tarea 29): `pnpm e2e tests/e2e/chapter-2/chapter-2.spec.ts`, `tests/e2e/card-layout.spec.ts`, `tests/e2e/chapter-1/chapter-1.spec.ts`, `tests/e2e/incidents.spec.ts` y `tests/e2e/entities.spec.ts`. `Traffic` es común a todos los mapas; ninguno cambia. Las capturas de `tests/e2e/snapshots/` no cambian: `git diff --exit-code tests/e2e/snapshots`.

**Cierre:** `pnpm check:fast`; las specs de arriba; `git diff --exit-code src/levels/04-iaas/golden-traces.json`. La Tarea 29 estrena el primer e2e de la consulta (`in 02-10 a ping by name draws the question first and the ping after it, each with its stamp`, con `page.clock`). Si algo de la escena falla ahí, se arregla en la 29 con un commit `fix(scene)` y no se reabre esta.

**Review Focus:** 1, 2, 8, 11, 12, 14, 16 y 18.

**Rigor** (lo que hace un equipo real, lo que hace el juego y cómo se dice; detalle y fuentes en «Fuentes y rigor», abajo):
- El juego dibuja una consulta (la del registro A) y su respuesta. Un equipo real manda dos (A y AAAA) por el mismo socket, y el NAT las traduce con una fila. Es exacto en el puerto y en la fila. Omite la AAAA, la consulta inversa que hace `ping`, los dominios de búsqueda si el nombre no existe y los reintentos. Ningún texto afirma que es una sola.
- El archivo hosts va antes que el DNS en un sistema con `files dns` (valor por defecto de glibc 2.39). `dig` no lo lee. Qué hace Amazon Linux no se verificó, y ningún texto nombra un sistema.
- El juego repite la consulta en cada envío y el que guarda la respuesta es el resolver. Cada `ping` y cada `nc` es un proceso nuevo que resuelve una vez, pero algunos sistemas tienen una caché en el equipo (`nscd`, `systemd-resolved`). El juego no la modela. Los textos dicen «en este juego».

**Commits** (en inglés, Conventional Commits; cada uno termina con la línea `Claude-Session`):
1. `feat(engine): send the question of a lookup by name as a datagram of the sequence`
2. `feat(game): give the question of a send its own run, stamp, box and translation row`
3. `feat(scene): draw the question of a send before the packet that asked`
4. `docs: declare what the drawn question of a lookup by name leaves out`

**Fuentes y rigor (leídas el 2026-10-12).**

Fecha de lectura: 2026-10-12. Los `man7.org` son man-pages 6.19 (resolv.conf(5) con pie 2026-08-22; nsswitch.conf(5) y nscd(8) con pie 2026-02-08; systemd 262~devel para `systemd-resolved(8)`; render del 2026-09-09). Son las versiones más nuevas, no las del sistema del jugador.

**1. ¿Cuántas consultas manda un `ping` o un `nc` real por nombre?**

**Hecho.** Los dos programas (`ping` de iputils y `ncat`) piden a `getaddrinfo` la familia sin fijar (`AF_UNSPEC`) y sin `AI_ADDRCONFIG`. glibc, entonces, manda la consulta A y la AAAA en paralelo por el mismo socket.

Fuentes:
- iputils, etiqueta `20211215`, `ping/ping.c`: `main()` arma `hints` con `.ai_family = AF_UNSPEC` y `.ai_flags = getaddrinfo_flags` (líneas 257 a 262), y antes de llamar fuerza `hints.ai_family = AF_UNSPEC` (línea 556) y llama `getaddrinfo(target, NULL, &hints, &result)` (línea 558), con un comentario que dice que se hace siempre en modo de doble pila. `getaddrinfo_flags` está en `ping/ping.h` (líneas 45 y 48): `AI_CANONNAME`, más `AI_IDN | AI_CANONIDN` si hay soporte. Ninguna es `AI_ADDRCONFIG`. Descargado de `raw.githubusercontent.com/iputils/iputils/20211215/ping/` el 2026-10-12.
- ncat 7.93 (`scratchpad/nmap793/`): `ncat/ncat_core.c:102`, `o.af = AF_UNSPEC`; `resolve_internal` (líneas 161 a 206), `hints.ai_family = af`, `hints.ai_socktype = SOCK_DGRAM`, `hints.ai_flags |= addl_flags` (0 si no hay `-n`); `ncat/ncat_main.c:883`, una sola llamada, `resolve_multi(o.target, 0, targetaddrs, o.af)`.
- glibc 2.39, `resolv/nss_dns/dns-host.c`, `_nss_dns_gethostbyname4_r` (línea 376): llama `__res_context_search(ctx, name, C_IN, T_QUERY_A_AND_AAAA, …)` (línea 418) salvo que `RES_NOAAAA` esté puesto.
- `resolv.conf(5)` (man7.org): «By default, glibc performs IPv4 and IPv6 lookups in parallel since glibc 2.9» (opción `single-request`) y, en `single-request-reopen`, «The resolver uses the same socket for the A and AAAA requests».

**Además de A y AAAA, un `ping` real hace más**, y ncat no:
- `ping` sin `-n` hace una consulta inversa (PTR) de la IP que contesta: `pr_addr` (iputils `ping/ping.c`, línea 1625) llama `getnameinfo` sin `NI_NUMERICHOST` cuando `!rts->opt_numeric` (líneas 1641 a 1643). El `-n` se activa solo con un único destino que es una IP (líneas 673 a 676). ncat solo usa `getnameinfo` con `NI_NUMERICHOST | NI_NUMERICSERV` (`ncat_core.c:583` y `:612`).
- Si el nombre no existe, un resolver real prueba además los dominios de la lista `search` (`resolv.conf(5)`: `ndots` y `search`). Si nadie contesta, reintenta (`timeout` de 5 s y `attempts` de 2 por defecto, `resolv.conf(5)`).
- Un `dig` manda una consulta, del tipo A por defecto: `make_empty_lookup` de BIND 9.18.50 (`bin/dig/dighost.c`, líneas 617 y 618) arma el `lookup` con `.rdtype = dns_rdatatype_a`. Por eso «`dig` no cambia» es exacto: ya es una consulta, y es la del registro A. Que un `dig` solo mande esa, sin más, sale de leer ese valor por defecto; no leí el resto de `dighost.c`.

**Qué hace el juego.** Dibuja una consulta (la A) y su respuesta. Es **exacto** en lo que el jugador puede comprobar: el puerto de origen es uno y la tabla del NAT tiene una fila. **Omite** la AAAA, la PTR, los dominios de búsqueda y los reintentos.

**Cómo se dice sin enseñar algo falso.** En pantalla, nada afirma que sea una sola consulta (el campo «DNS» dice «preguntó»; la marca de la fila, si O-6 = A, dice «consulta DNS»; ninguna cifra la cuenta). IPv6 no se nombra (Review Focus 4). La omisión se declara en `src/engine/dns/CLAUDE.md` y en el spec («Simplificaciones declaradas», dos filas nuevas). Una prueba busca «una sola», «solo una» y «la única» en los textos del campo.

**2. ¿En qué orden se leen el archivo hosts y el DNS?**

**Hecho.**
- glibc 2.39, `nss/nss_database.c`: la lista por defecto de la base `hosts` es `"files dns"` (`nss_database_default_dns`, líneas 83 y 98, y la asignación en líneas 135 a 137), cuando `/etc/nsswitch.conf` no trae la línea.
- `nsswitch.conf(5)` (man7.org): «The order of the services on the line determines the order in which those services will be queried, in turn, until a result is found». Una respuesta con éxito (`success`) termina la búsqueda (acción por defecto `return`); `notfound` sigue con el servicio siguiente (`continue`).
- Fedora, perfil `sssd` de `authselect`, `profiles/sssd/nsswitch.conf` (GitHub, 2026-10-12): `hosts: files myhostname … resolve [!UNAVAIL=return] dns`. También `files` primero.
- `systemd-resolved(8)`: «The mappings defined in /etc/hosts are resolved to their configured addresses» y las direcciones de `/etc/hosts` «are never routed to the network».
- `dig` (BIND 9.18.50, `scratchpad/bind918/`): no hay ninguna referencia a `/etc/hosts` en `bin/dig`, `lib/isc` ni `lib/dns`, y `dighost.c` lee `resolv.conf` (líneas 1277 y 1327). Esto mejora la marca **[local]** de la ficha 02-13: ahora hay fuente para «`dig` no lee hosts».

**Razonado, sin fuente:** con una línea de hosts que solo trae IPv4, `getaddrinfo` termina en `files` y no manda ni la AAAA (por la regla `success` → `return`). No leí `nss_files` para confirmarlo.

**Qué hace el juego.** `ping` y `nc` leen el archivo hosts primero y, si contesta, no preguntan a nadie y no hay consulta; `dig` no lo lee. **Exacto** para un sistema con `files` antes que `dns`.

**No verificado.** El `nsswitch.conf` de Amazon Linux (AL2 y AL2023) y la versión de glibc de cada una. La documentación de AL2023 consultada (`compare-with-al2` y `networking-service`) no lo trae. Los textos no nombran un sistema (ya lo guarda `the text of a warning quotes no operating system and says only what the player saw`).

**3. ¿Repite el equipo la consulta en cada envío, o la guarda en caché?**

**Hecho.**
- Cada `ping` y cada `nc` es un proceso que resuelve **una vez** al arrancar (`ncat_main.c:883`; `ping.c` línea 558). No hay caché dentro del proceso.
- glibc por sí sola no guarda respuestas de DNS. La guarda un servicio aparte si existe: `nscd(8)` («provides a cache for the most common name service requests», incluye `hosts`) o `systemd-resolved(8)` («implements a caching and validating DNS/DNSSEC stub resolver», con un stub en `127.0.0.53`). Si el equipo del jugador corre alguno, una segunda consulta dentro del TTL puede no salir de la máquina.
- Un reporte de un usuario en AWS re:Post («dns caching in amazon linux 2023», `repost.aws/questions/QUXJ5yuiRpQE2c2Htf4Dc9iA`) dice que AL2023 trae `systemd-resolved` con el stub apagado por defecto (un archivo `resolved-disable-stub-listener.conf`). Solo vi el fragmento de la búsqueda, no la página, y no es una fuente oficial.

**Qué hace el juego.** Pregunta de nuevo en cada envío y el que guarda la respuesta es el resolver. Es **exacto por comando** y **omite** la caché local de algunos sistemas.

**Cómo se dice.** «En este juego…». Ningún texto dice que el equipo «no recuerda» o «no guarda» nada: dice que pregunta y que contesta el resolver, de su caché si la tiene.

**Lo que no se pudo verificar.**

1. **El comportamiento de Amazon Linux.** No se encontró su `/etc/nsswitch.conf`, ni su versión de `iputils`, `glibc` o `nmap-ncat`. La página de paquetes de AL2023.9 no se pudo bajar con `curl` (devolvió 330 bytes); `WebFetch` leyó solo el principio y vio `bind-utils 9.18.50-1.amzn2023.0.3`, lo que cuadra con el BIND 9.18.50 en que se basa el `dig` del juego (no lo releí).
2. **Que el `ping` y el `nc` del jugador sean los leídos.** Se leyeron iputils `20211215` y nmap `7.93`. La estructura de `main()` y de `pr_addr` puede diferir en otras versiones.
3. **El caso de hosts con solo IPv4 (punto 2 de «Fuentes y rigor»).** Razonado, no leído en `nss_files`.
4. **La caché del equipo en AL2023.** Solo un reporte de un usuario (punto 3 de «Fuentes y rigor»).
5. **El dibujo en pantalla.** `pathFor` se leyó, no se corrió: que hoy un paquete con nombre sin resolver salga a la calle sale de leer las ramas del código. Las posiciones del prototipo son aproximadas y la etiqueta sin traducir de su hexágono no sigue V13 («Hallazgos», punto 5). La espera de la escena, el apilado de sellos en el resolver y la ausencia de solapes no se pueden comprobar hasta el e2e de la Tarea 29 y la Tarea 34.
6. **La lista de pruebas que cambian.** Sale de buscar `40001`, `51514`, `51515` y mandar por nombre en `src/` y `tests/` el 2026-10-12. Otras pruebas con `simulate` suelto, `ping` o `tcp` por nombre pueden fallar por el campo nuevo o por los números; quien ejecuta las lista en el cuerpo del commit.
7. **Que el 02-12 mande solo `dig`.** Sale de su ficha; el incidente todavía no existe.

---

### Tarea 28 quinquies: los sellos en abanico hasta lo que cabe, más «+N» (O-4 = G)

**Presenta:** ningún término. **Depende de:** O-4 = G (decidida el 2026-10-12) y de las Tareas 28 bis, 28 ter y 28 quater, en ese orden. Va antes de la 29: desde el 02-10 los incidentes suman sellos a un mismo lugar (con la decidida 48 de la 28 quater, el resolver recibe además el sello de cada consulta DNS). No cambia lo que enseña ningún incidente; sí cambia lo que ven los capítulos 1 y 4 (ver «Cambios visibles»).

**Por qué después de las tres y no antes.** Hay una razón débil para adelantar el modelo puro (commits 1 y 2): no toca nada que las otras tres reescriban. Hay una fuerte para no hacerlo: el cableado (commit 3) toca `traffic.tsx` y `stamp.tsx`, que la 28 bis reescribe (`StampPiece` con `trigger`, `inspectTrigger`), y la 28 quater cambia `traffic.tsx` y `layout.ts` (`pathFor`). Se mantiene el orden del encargo. No se pide cambiarlo.

**Decisiones que la tocan.** Ninguna bloquea la tarea. Cuatro se decidieron con la regla del umbral y la tarea las implementa desde el principio; el estudiante las revisa en la página de «para revisar» (Tarea 33).
- **53 (O-8).** La etiqueta de un paquete cuyo sello se esconde en un «+N» no se dibuja en el mapa quieto; su texto va en la lista del «+N». Se aparta de la página de O-4.
- **54 (O-9).** Cada sello conserva la altura de su punto, y los de un grupo forman una escalera. Salvaguarda: si las pruebas de solapes muestran que la escalera choca con etiquetas vecinas donde la altura media no choca, se queda la altura media (A), con la frase corregida en `DESIGN.md`, y se informa.
- **55 (O-10).** Si apartar una etiqueta de paquete en horizontal no alcanza, sube o baja lo justo, con tope. La tarea no se detiene en el paso 2.
- **50 y 51** (decididas sin el estudiante, para revisar). El título de la lista de un «+N» es «N sellos juntos», y la leyenda de los sellos no cambia.
- **52 (O-5)** toca el lugar de la caja de inspección: lo mide el paso 11 de la Tarea 28 bis. Mientras no se aplique, «+N» se comporta como cualquier sello.

**Propósito.** Que los sellos de un mismo lugar no pisen ninguna etiqueta y que ninguno se pierda en silencio.
- Los sellos de un lugar se montan en abanico, con paso de 25 px (el 43 de hoy sale).
- Si caben todos en el pasillo libre entre las etiquetas vecinas, se ven todos.
- Si no caben, se ven los que caben menos uno, y la última casilla es un sello «+N» con el resto.
- «+N» es el mismo estándar de sello (redondo, mismo aro, tamaño y letra). Lo distingue su texto, no solo su color. Queda encima del abanico.
- Al pasar el mouse, al enfocarlo o con un toque, «+N» abre la caja de inspección que ya existe, con la lista de todos los sellos del lugar. No hay primitiva nueva.
- Las etiquetas de paquete se apartan de los sellos y de las etiquetas de pieza, como ya se apartan de los nombres de piso.
- Cada sello conserva la altura de su punto: los de un grupo encadenado forman una escalera de unos 14 px (decidida 54).
- La etiqueta de un paquete cuyo sello se esconde en un «+N» no se dibuja en el mapa quieto; su texto va en la lista del «+N» (decidida 53).

**La regla, completa y sin huecos.**
- **Casillas.** Un abanico de `n` casillas mide `36 + 25 (n − 1)` px (la caja medida de un sello es de 36 px). El grupo se centra en su lugar. Manda el lado más estrecho del pasillo: caben `n` casillas si `18 + 12,5 (n − 1)` px no pasan de ese lado. Holgura: 0 (la del dibujo de C y G; no el mínimo de 8 px). Con la altura de cada punto (decidida 54) cada casilla tiene su franja de altura: la cuenta de arriba es la de un grupo de un solo punto, y en un grupo encadenado el modelo la calcula casilla por casilla (caben `n` casillas si la caja de cada una, de 36 px, queda libre de las etiquetas de su franja).
- **El pasillo de un lugar.** Entre el borde de la etiqueta más cercana de la izquierda y el de la más cercana de la derecha, solo con las etiquetas que comparten la franja de altura de ese sello, la de su casilla (las de pieza y los nombres de piso; las etiquetas de paquete no cuentan: se apartan después). Sin vecina de un lado, ese lado no limita.
- **Quién se ve.** Si el grupo tiene `k` sellos y caben `n` casillas: si `k ≤ n`, se ven los `k`. Si no, se ven `n − 1` y la casilla `n` es «+N», con `N = k − (n − 1)`. Si solo cabe una casilla (`n = 1`), se ve un «+N» solo, con `N = k`. `N` nunca es menor que 2. Un sello sin vecino cercano no se mueve, no se esconde ni se cuenta (como hoy).
- **Prioridad.** Los sellos de problema (✕ bloqueado, ? perdido, ! aviso e intruso) no entran en «+N» mientras haya sellos sin problema que puedan entrar. Entre iguales, entran los más antiguos. Si hay más sellos de problema que casillas visibles, entran los más antiguos de ellos. «Más antiguo» es el menor número de envío (`send`) del último envío de esa combinación (`lastOfEach` conserva la posición del primero y el `send` del último). Los flujos vivos del incidente no tienen `send`: son más antiguos que todo lo que el jugador manda, y entre ellos manda su orden.
- **Orden y capas.** Los sellos que se ven conservan el orden de la pantalla (x − z). Cada uno tapa el borde del anterior. «+N» es la última casilla y queda encima. El sello bajo el puntero o con el foco sube al frente.
- **Altura.** Cada sello se dibuja a la altura de su punto (decidida 54). «+N» se dibuja a la altura media de los sellos que esconde (el paso 1 lo confirma).
- **El número.** Es la cuenta exacta de los escondidos, nunca «9+». Con letra de 18 px hasta 9 escondidos. Desde 10 escondidos, 14 px (`--text-md`): «+10» mide 29,5 px a 18 px y se sale del aro; a 14 px mide 24,3 y cabe con 0,8 px (medido en Chromium el 2026-10-12, sin la inclinación de −8°). Cota declarada: 99 escondidos. «+100» a 14 px no cabe (extrapolado, no medido); un centinela falla antes de que un incidente registrado llegue ahí.
- **Abierto, sin implementar.** Cómo se ve un «+N» que esconde un sello de problema. Hoy se dibuja igual que cualquier «+N». Va al backlog y tiene un centinela (más abajo).

**Lo que se leyó (2026-10-12, sobre `ccb20b3`) y corrige o completa al encargo.**
1. **El «7 px» no es el solape de las pruebas.**
   - `.stamp` mide 32 px (`box-sizing: border-box`, `src/styles.css`) y se gira −8°. Su caja en pantalla es el cuadrado girado: 32 cos 8° + 32 sen 8° = 36,1 px (calculado; coincide con los 36 px medidos).
   - A 25 px de paso, los aros se tapan 7 px (32 − 25) y las cajas se solapan 11,1 px (36,1 − 25). Las pruebas e2e miden cajas (`getBoundingClientRect`). Con una tolerancia literal de 7, el abanico de 3 falla en su propio camino feliz.
   - La tolerancia de las pruebas se deriva de «caja menos paso», se mide en el paso 1 y vale solo para sello contra sello vecinos del mismo abanico (el paso 1a mide el límite, con la escalera de unos 14 px de la decidida 54). Todo lo demás sigue estricto.
2. **El arreglo común no destraba solo.**
   - Los huecos del 02-05 y del primer par del 02-08 son una etiqueta de paquete sobre una etiqueta de pieza (la del firewall), no contra un sello (guía de `tests/e2e/chapter-2/CLAUDE.md`). `spreadTags` hoy conoce los nombres de piso y a las otras etiquetas de paquete, no a las etiquetas de pieza.
   - Esta tarea suma como obstáculos de `spreadTags` los sellos que se ven y las etiquetas de pieza. Solo toca el capítulo 2: solo los paquetes con puertos llevan etiqueta.
   - Las etiquetas de paquete miden 115 a 176 px y el pasillo de `laptop-lucia` unos 114. Mover solo en horizontal puede no bastar. **No está medido.** El paso 2 lo prueba en rojo; si no basta, la etiqueta sube o baja lo justo, con tope, y sigue pegada a su camino (decidida 55). La tarea no se detiene.
3. **Los anchos de las etiquetas no los conoce `layout.ts`.**
   - Hoy solo tiene `LABEL_REACH` = 64 (medio ancho) y las etiquetas de pieza miden de 79 a 146 px. En el 02-03, «se ven los 3» tiene 6,4 px de holgura: un error de más de 6 px por exceso en el ancho de una etiqueta vecina lo vuelve «2 y +2», y por defecto deja un solape.
   - El ancho sale de un modelo puro (`labelWidth`) calibrado en Chromium y exportado, sobre los caracteres del texto llano, los de los nombres (`NameTag`, mono) y si lleva candado o alerta. Una prueba e2e lo compara con el DOM, para que un cambio de fuente rompa esa prueba y no el mapa en silencio.
4. **Pantalla, no suelo.** El sello flota a `STAMP_Y` (0,9) y las etiquetas a la altura de `labelPosition`. `onScreen` mide solo suelo. La proyección de una altura `y` suma `y · CAMERA_ZOOM · √(2/3)` px hacia arriba (derivado de la cámara isométrica; se comprueba con el ayudante `projection` de `layout.test.ts`).
5. **El argumento de rigor de G se apoya en algo que hoy solo vale para un grupo de un mismo punto.**
   - `placeGroups` pone a todos los sellos de un grupo en `(promedio x + desplazamiento, promedio z − desplazamiento)`: la misma altura de pantalla, la media del grupo.
   - La página de O-4 dice que «cada sello sigue a la altura de su lugar» y descarta B porque «la altura dice dónde ocurrió». Eso es cierto cuando los sellos terminan en el mismo punto. En un grupo encadenado (puerta, firewall y camino de un dispositivo, unos 14 px de diferencia) ya se colapsaba a la media. Es de antes de G, pero G lo hereda y el estudiante eligió por «rigurosa».
   - La tarea escribe `fanStamps` con la altura de cada punto (decidida 54): los sellos de un grupo forman una escalera de unos 14 px (más si el grupo junta el camino y la puerta de dispositivos distintos), `placeGroups` deja de colapsarlos a la media, la franja de altura del pasillo es por sello y no por grupo, y el ayudante e2e compara por par, con la diferencia de altura. El «+N» se dibuja a la altura media de los sellos que esconde.
   - **Salvaguarda.** Si las pruebas de solapes muestran que la escalera choca con etiquetas vecinas donde la altura media no choca, se queda la altura media (A), con la frase de la página corregida en `DESIGN.md` y en el plan, y se informa.
6. **Capas.** El abanico se mueve a `x + z` constante, es decir, a la misma profundidad: `Html` de drei les da el mismo `z-index` y manda el orden del DOM (cálculo, sin medir). Hoy `Traffic` dibuja cada sello dentro del `<group>` de su paquete, así que el orden es el de los paquetes. Con el abanico los sellos se dibujan aparte, en el orden de las casillas, con «+N» al final.
7. **Los escondidos no están en el DOM.** Un sello escondido no es un botón: su nombre accesible vive en la lista de «+N». Los conteos `/^Paquete:/` cuentan solo los que se ven.
8. **Capas del código.**
   - `inspect()` vive en `game` y la escena no puede importarlo. El id de «+N» debe poder resolverlo `game`: un tipo nuevo de `piece-id.ts` que lleva los ids de los envíos del lugar, no un grupo que calcula la escena.
   - El estado de un sello (`stampState`) hoy vive en `flow-look.ts`. Lo necesitan la prioridad (escena) y la lista (`game`): se define una vez, en `@/copy`, junto a `StampState` (`dry`, `view-renders-domain-result`).
   - `StampState` no gana «+N»: no es un resultado de un paquete, y se esparciría por `stampLabel`, el catálogo de iconos y sus pruebas. «+N» es una variante aparte del sello.
9. **El «+N» se puede jugar en el 02-03.** El incidente ofrece 2 orígenes × 3 direcciones × 2 mensajes, y hasta seis combinaciones terminan en `laptop-lucia` (dos desde `tu-laptop` y cuatro desde `laptop-lucia`; por medir). La e2e llega a «+2» mandando una cuarta combinación a `laptop-lucia` después de los cuatro envíos del parche.

**Interfaces (contratos nuevos).**
- **`@/copy` (`packet-labels.ts`).**
  - `stampOf` devuelve el `StampState` de un resultado (`warning`, `reached`, `intruder`, `blocked`): lo que hoy hace `stampState` de `flow-look.ts`, sin cambiar un caso. `flowLook` pasa a usarlo.
  - `isProblemStamp` es verdadero para `blocked`, `lost`, `warned` e `intruder`.
- **Modelo del ancho (`src/scene/marks/label-width.ts`).** `labelWidth` da el ancho en px de una etiqueta a partir de sus hechos (caracteres de texto llano, caracteres de nombres, candado, alerta). `labelSpans` da, para las piezas que el mapa dibuja y los nombres de piso, la caja de pantalla de cada etiqueta (`u`, `v`, ancho, alto) usando `labelPosition` y la proyección de la altura. La prueba e2e lee los hechos de cada etiqueta del DOM (texto llano, caracteres de `.name-tag`, `.map-button__lock`, `.map-button__alert`) y llama a `labelWidth` por el alias `@/scene/marks/label-width`, como `saved-progress.ts` ya importa `@/storage/progress`. Por eso `label-width.ts` no importa React ni three (solo `layout.ts` y tipos).
- **El abanico (`src/scene/marks/stamp-fan.ts`).** Función pura `fanStamps`. Entra, por sello: su punto de suelo, su identificador, si es de problema y su antigüedad. Entran también las cajas de las etiquetas. Sale: para cada sello, si se ve y dónde (suelo, a la altura de su punto, decidida 54); y para cada lugar que desborda, la casilla de «+N» con su posición, cuántos esconde y los identificadores de todos los sellos del lugar. Constantes: `FAN_STEP_PX` (25), `STAMP_BOX_PX` (36), `FAN_CLEARANCE_PX` (0). El paso en suelo sale de `FAN_STEP_PX / (2 · UNIT_PX_X)`, no es un número aparte. `casillasThatFit` da cuántas casillas caben en un lado de pasillo dado. La unión de grupos cuyas casillas quedan cerca sigue como hoy, ahora con las casillas que se ven.
- **Las etiquetas de paquete (`src/scene/marks/spread.ts`).** `spreadTags(paths, obstacles)`: los obstáculos son cajas de pantalla (nombres de piso, etiquetas de pieza y sellos que se ven). `clearOfNames` se generaliza a obstáculos de cualquier tamaño; un nombre de piso es un obstáculo de 31 × 39 px. Si moverla a un lado no libra a una etiqueta de pieza, la etiqueta de paquete sube o baja lo justo, con tope, y sigue pegada a su camino (decidida 55).
- **`game`.** `PIECE_ID.stamps(ids)` y un caso `stamps` en `PieceRef`/`parsePieceId`. `inspect()` gana el caso `stamps`: una `Inspection` con el título «N sellos juntos» (decidida 50: se aparta del texto de la página de O-4, que no vale cuando un grupo junta lugares distintos) y un campo por sello (su etiqueta y cómo terminó, el sello más nuevo primero). `Inspection.entity` pasa a ser opcional (la lista no es una entidad); `InspectionBox` dibuja el ícono solo si existe (`caller-controls-visibility`). Si un identificador ya no nombra ningún envío (el mundo cambió y los envíos se borraron), `inspect()` devuelve null.
- **Textos (`src/copy/screens/incident-ui.ts`, `INSPECTION_TEXT` y `MAP_TEXT`).** El título de la lista, la línea de cada sello (con las palabras de `STAMP_TEXT`: «Llegó.», «Bloqueado.», «Perdido.», «Entró y no debía.», «Apareció un aviso.»; ningún vocabulario nuevo) y el nombre accesible de «+N». Propuesta: «N sellos más. Abre la lista de los T sellos de este lugar.» Quien implementa la fija con `rigorous-plain-copy`. La leyenda de los sellos (`SCREEN_TEXT.stampLegend`) no cambia y no nombra «+N» (decidida 51).
- **Escena (`src/scene/entities/stamp.tsx`).** `StampMore`: variante del sello (clase `stamp--more`; con 10 o más escondidos suma `stamp--tight`, en `src/styles.css`, solo con tokens). Mismo botón, mismos disparadores (`trigger`, `inspectTrigger` de la 28 bis): pasar el mouse, enfocar y tocar (el clic fija la caja, como en `main`). Se exporta el botón sin `Html` para probarlo en jsdom. La caja que abre «+N» es la de siempre: sigue la regla de la 28 bis (no tapa una tarjeta abierta) y, si la decidida 52 (O-5) se aplica (B), lo que ese punto diga de un sello vale también para «+N»; mientras no se aplique, «+N» se comporta como cualquier sello.
- **Catálogo.** «+N» tiene su especimen en `#/entidades`: dos celdas, «+2» (letra de 18 px) y «+12» (letra de 14 px). No tiene `StampIcon` ni entra en `STAMP_STATES`: la lista de íconos no crece.
- **Ayudante e2e (`tests/e2e/map-boxes.ts`).** `pairsThatOverlap` (y `overlappingPairs`, que lo usa) deja pasar sello con sello del mismo abanico hasta la tolerancia medida en el paso 1, por par y con la diferencia de altura entre los dos (sin diferencia se espera 11,1 + 0,5 px de redondeo; con la escalera de la decidida 54 la fija el paso 1a), con una constante propia del ayudante y no importada del modelo (si el paso del modelo se rompe, la prueba lo ve). Sello contra etiqueta, nombre o etiqueta de paquete, o sello de otro abanico: sigue sin dejar pasar nada.

**Archivos (por commit).** Los topes de carpeta están en la tabla de abajo. Todos los nombres son los de después de la 28 bis.

*Commit 1, mudanza sin cambio de comportamiento.*
- Create: `src/scene/marks/spread.ts` (con `CLAUDE.md`).
- Modify: `src/scene/layout.ts` (salen `Footprint`, `distance`, `areNear`, `nearGroups`, `merge`, `placeGroups`, `closePair`, `spreadApart`, `spreadStamps`, `Spot`, `onScreen`, `overName`, `pushOut`, `clearOfNames`, `spreadTags` y las constantes `STAMP_*`, `TAG_*`, `NAME_PX_*` y `UNIT_PX_*`; se quedan `PacketTags`, `translationDistance` y `tagAt`), `src/scene/traffic/traffic.tsx` (los imports), `src/scene/layout.test.ts` (solo los imports: las pruebas de sellos y de etiquetas usan `projection` y `boxAround`, que son locales y las comparten decenas de pruebas, así que se quedan donde están), `src/scene/CLAUDE.md` y `src/scene/traffic/CLAUDE.md`.

*Commit 2, el modelo puro.*
- Create: `src/scene/marks/stamp-fan.ts` y `stamp-fan.test.ts`, `src/scene/marks/label-width.ts` y `label-width.test.ts`.
- Modify: `src/scene/marks/spread.ts` (obstáculos; y `placeGroups`, que deja de poner a todos los sellos de un grupo a la altura media, decidida 54), `src/copy/packet-labels.ts` y `packet-labels.test.ts` (`stampOf`, `isProblemStamp`), `src/copy/index.ts` (el barrel exporta los dos), `src/scene/traffic/flow-look.ts` (usa `stampOf`), `src/scene/layout.test.ts` (las llamadas a `spreadTags` pasan a la firma nueva), `src/copy/CLAUDE.md`, `src/scene/marks/CLAUDE.md`.
- `src/scene/traffic/traffic.tsx` solo adapta su llamada a `spreadTags` (los nombres de piso pasan como obstáculos de 31 × 39 px). Lo que dibuja no cambia: nada que el jugador vea.

*Commit 3, el cableado, «+N», la lista y lo que depende de ellos.*
- Modify, escena: `src/scene/game-scene.tsx` (calcula `labelSpans` y se los pasa a `Traffic`), `src/scene/traffic/traffic.tsx` (llama a `fanStamps`; dibuja los sellos aparte y en orden de casilla; da a `spreadTags` los obstáculos; y no dibuja la etiqueta de paquete de un sello escondido en el mapa quieto, decidida 53), `src/scene/entities/stamp.tsx` (`StampMore`; el botón exportado), `src/scene/entities/index.ts`, `src/styles.css`, `src/scene/catalog/catalog-cells.tsx` (los dos especímenes), `src/scene/layout.test.ts` (las pruebas que cambian a propósito, más abajo).
- Create: `src/scene/entities/stamp.test.tsx` (`src/scene/entities/` queda en 12 de 12).
- Modify, `game` y `copy`: `src/game/view/piece-id.ts`, `src/game/view/inspection.ts` y `inspection.test.ts`, `src/copy/screens/incident-ui.ts`, `src/ui/incident/inspection-box.tsx`.
- Create: `src/ui/incident/stamp-fan.test.ts` (el centinela).
- Modify, e2e: `tests/e2e/map-boxes.ts` (el ayudante), `tests/e2e/chapter-1/chapter-1.spec.ts` (el nombre de una prueba), `tests/e2e/entities.spec.ts` y `tests/e2e/snapshots/entities-darwin.png` (se regraba a propósito; `interface-darwin.png` solo si el catálogo gana una fila).
- Guías: `src/scene/CLAUDE.md`, `src/scene/traffic/CLAUDE.md`, `src/scene/entities/CLAUDE.md`, `src/scene/catalog/CLAUDE.md`, `src/game/view/CLAUDE.md`, `src/ui/incident/CLAUDE.md`, `DESIGN.md` (el sello: el abanico y la variante «+N»; el paso de 25 px entre las medidas de una sola regla), `tests/e2e/CLAUDE.md` (qué deja pasar el ayudante).

*Commit 4, las e2e y la guía del capítulo.*
- Modify: `tests/e2e/chapter-2/chapter-2.spec.ts` y `chapter-2-play.ts` (el parche del 02-03 reescrito a mano sobre el árbol de entonces, más el 02-05, el 02-08, «+2» y el modelo del ancho), `tests/e2e/chapter-2/CLAUDE.md` (los tres «Known gap» —02-03, 02-05 y 02-08— se reemplazan por lo que midieron las pruebas), `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (las filas de abajo).

**Topes de carpeta** (contados el 2026-10-12 sobre `ccb20b3`, archivos planos sin `CLAUDE.md`; el paso 0 los cuenta de nuevo después de la 28 bis a la 28 quater).

| Carpeta | Hoy | Cambio | Queda |
|---|---|---|---|
| `src/scene/` | 11 | ninguno (la carpeta nueva aloja los archivos) | 11 |
| `src/scene/marks/` (nueva, con su guía) | 0 | `spread.ts`, `stamp-fan.ts`, `label-width.ts` y las pruebas de las dos últimas | 5 |
| `src/scene/traffic/` | 8 | ninguno | 8 |
| `src/scene/entities/` | 11 | `stamp.test.tsx` | 12 (llena) |
| `src/scene/catalog/` | 4 | ninguno | 4 |
| `src/copy/` | 11 | ninguno (se edita `packet-labels.ts`) | 11 |
| `src/game/` y `src/game/view/` | 12 y 12 | ninguno, solo se edita en sitio | 12 y 12 |
| `src/ui/incident/` | 8 | `stamp-fan.test.ts` (la 28 bis suma 2 antes) | 11 |
| `tests/e2e/` | 11 | ninguno (el ayudante va en `map-boxes.ts`) | 11 |

- **Por qué una carpeta nueva y no `src/scene/traffic/`.** Allí cabrían (8 + 4 = 12), pero la dejaría llena y la 28 quater, la 29 y siguientes la tocan. `marks/` agrupa lo que flota sobre el mapa y no se debe pisar (sellos, etiquetas de paquete, anchos de etiquetas): `MAP_MARKS` ya usa esa palabra.
- **`src/scene/entities/` queda llena.** Si la 28 bis o la 28 quater le suman un archivo, `stamp.test.tsx` pasa a `src/scene/marks/` (prueba el botón, no el catálogo).

**Pasos.**
- [x] **0. Preparar.** (M0 del plan del mapa 2D preparó la rama. La 28 quater llegó con M25 y el sello de cada consulta DNS entra en `fanStamps` como uno más de su lugar, sin código aparte. No hay pasillos que medir: en el 2D cada marca del layout dice cuántas casillas caben.)
  - `git status` solo muestra `concepts/ami.md` (no se toca). Las Tareas 28 bis, 28 ter y 28 quater están en la rama, y el último `pnpm check` completo en verde es la base de la regla C.
  - `pnpm structure` y contar las carpetas de la tabla.
  - Leer con los nombres de después del merge: `stamp.tsx`, `traffic.tsx`, `src/scene/overlay/inspect-trigger.ts`, `src/ui/floating-box/`, y lo que la 28 quater dejó en `traffic.tsx`.
  - Con la decidida 48 de la 28 quater, la consulta DNS deja su sello propio en el resolver: es un sello más del lugar y entra en `fanStamps` sin código aparte; el paso 4 bis lo cuenta. El pasillo del resolver no se midió (la página de O-4 midió el del 02-03).
- [x] **1. Medir, sin commitear.** Scripts desechables en el scratchpad. Una suite de Playwright a la vez, a 1280×800 y a 1440×900. (Sustituido por M2, M6, M8 y M21. El ancho de las etiquetas, con el candado y el aviso, lo fija `src/ui/incident/geometry/label-width.browser.test.tsx` (M21) y lo modela `labelWidth` de `src/scene/layout/metrics.ts` (M2). Lo que 1a llamaba la tolerancia de dos sellos de un abanico es la excepción de `collisions` (M6) mientras los dos estén dentro de la caja de su abanico. Los abanicos reales de los 25 incidentes los midió M6 en 738 mapas y el barrido de M8 los recorre en 1260. No hay pasillos ni escalera de alturas que medir.)
  - **1a.** Dos sellos montados a 25 px (montando a mano dos botones `.stamp` a 25 px en una página con los estilos del juego): la caja de cada uno y el solape de las cajas, sin diferencia de altura y con una de 14 px (la escalera de la decidida 54). Fija la tolerancia del ayudante (sin diferencia se espera 11,1 px).
  - **1b.** El ancho y el texto de todas las etiquetas de pieza del 02-03, del 02-05 y del 02-08, y de una con candado y una con alerta del capítulo 1. Calibra `labelWidth`. Se esperan 79, 100, 119, 127 y 146 px en el 02-03.
  - **1c.** Los pasillos de cada lugar con sellos en esos tres incidentes: borde izquierdo, borde derecho y centro del grupo. En el 02-03: 49,4 px a la derecha del centro y 64,1 a la izquierda (de la página de O-4; confirmar).
  - **1d.** Confirmar con un script de Vitest desechable (`computeLayout`, `pathFor` y `spreadStamps` de hoy) el grupo de 2 sellos en `servidor2` del 04-01 y el 04-02, y cuántos sellos termina cada lugar de cada incidente registrado de los capítulos 1, 2 y 4 cuando se mandan todas las combinaciones de sus fichas. Eso dice dónde cambia el paso de 43 a 25 px y dónde el «+N» es alcanzable.
- [x] **2. Pruebas en rojo, en local.** Las puras del modelo (tabla de abajo) y las e2e del 02-03 (el parche del scratchpad, reescrito sobre el árbol actual), del 02-05 y del 02-08. Se ven fallar con el árbol sin cambios, salvo el ayudante, que ya lleva la tolerancia del paso 1a (si no, el 02-03 falla por dos sellos del abanico y no por lo que debe). (Sustituido. M6 y M7 escribieron el modelo puro con cascarones rojos primero, y sus Cierres cuentan cuántas pruebas dieron rojo. Las e2e de solapes del 02-03, del 02-05 y del 02-08 son el barrido de M8, `in no registered incident does any label, stamp, packet label, name of a box or piece overlap another, at 360, 390, 768, 900, 1060, 1280 and 1440 px`, que M8 vio fallar contra el código de antes (la etiqueta de `you → ip-loopback` del 02-03 a 360 px sin lugar). La decidida 55 (O-10) la cumplió M8: la etiqueta sube hasta 66 px o baja hasta 44, a la altura exacta que la libra (A'), y la de un paquete que no sale de su equipo y no halla lugar se deja fuera (O-10 = (i), decidido por el estudiante el 2026-10-19).)
  - Hoy el 02-03 falla con 2 pares medidos sin animaciones y 1 con ellas.
  - Para el 02-05 y el primer par del 02-08, la prueba debe mostrar la etiqueta de paquete sobre la etiqueta de pieza (hallazgo 2). Si mover la etiqueta solo en horizontal no la libra, la etiqueta sube o baja lo justo, con tope, y sigue pegada a su camino (decidida 55). La tarea no se detiene.
- [x] **3. Commit 1.** Mudanza. `pnpm check:fast` verde sin editar ninguna prueba salvo los imports. `git diff -M` muestra el código movido y no escrito de nuevo. (Sustituido por M6. La mudanza era la de `spreadStamps` y `spreadTags`, funciones de `layout.ts` del 3D. El 2D escribió `marks/` nueva y M24 (`6a71b40`) borró `layout.ts`, así que nada se mudó.)
- [x] **4. Commit 2.** El modelo puro, con TDD (las pruebas de la tabla, rojo primero). `pnpm check:fast` verde. (Hecho por M6 (`a0bc730`: `fanStamps`, `placeTags` y `collisions`), M7 (`13b8d54`: `stampOf` e `isProblemStamp`) y M2 (`9f02a08`: `labelWidth`), cada uno con sus pruebas en rojo primero y `pnpm check:fast` en verde. `labelSpans` no existe: el layout del 2D trae la caja de cada etiqueta.)
- [x] **4 bis. La tabla de cambios visibles, sin commitear.** Con el modelo ya escrito, un script de Vitest desechable repite el 1d con `labelSpans` y `fanStamps`: para cada incidente registrado de los capítulos 1, 2 y 4, en su estado final y mandando todas las combinaciones de sus fichas, los lugares con 2 o más sellos, cuántas casillas caben, cuántos sellos se esconden y si alguno es de problema. La tabla va al cuerpo del commit 3 y a «Cambios visibles». Si un incidente de los capítulos 1 o 4 llega a «+N», se informa antes de seguir. Con la altura de cada punto (decidida 54), el mismo script compara cada lugar con la altura media: si la escalera choca con una etiqueta vecina donde la media no choca, se aplica la salvaguarda (se queda la media, con la frase corregida en `DESIGN.md`) y se informa. (Sustituido por el barrido de M8: 25 incidentes, 180 estados y 1260 mapas a siete anchos, con los flujos y el último envío de cada combinación. «+N» solo aparece en 02-03 (en `doorstep:lucia-laptop` y, con el punto de peligro, en `firewall:marta-laptop`) y en 02-08 (`door:internet-server`), con todas las combinaciones enviadas; ningún incidente de los capítulos 1 y 4 llega a «+N». La salvaguarda de la decidida 54 no tiene objeto: en el 2D los sellos no tienen altura de punto y el abanico corre a lo ancho del enlace.)
- [x] **5. Commit 3.** El cableado, «+N», la lista, el catálogo, el ayudante. Cuando el abanico existe, las pruebas existentes que cambian a propósito se ajustan (lista de abajo) y se corren las e2e de los capítulos 1, 2 y 4. (Hecho por M7 (`13b8d54`: la lista en `game`), M12 (`971e84e`: `StampMore`, `stampButtons`, el punto y el orden de lectura), M13 y M14 (las etiquetas y los paquetes quietos y en vuelo), M16 (`711aa17`: los especímenes «+2», «+12» y «+2» con punto en el catálogo) y M18 y M22 (las capturas). El sello bajo el puntero o con el foco sube al frente con `z-index: 1`, y lo fija `the stamp under the pointer or with the focus comes to the front and «+N» stays on top otherwise`. El ayudante `tests/e2e/map-boxes.ts` lo sustituyen `collisions` y el barrido de M8, y las e2e de los capítulos 1, 2 y 4 son pruebas puras, de jsdom y del navegador desde M19 a M23 (quedan seis e2e).)
  - El mecanismo para subir al frente el sello bajo el puntero, o con el foco, y para dejar «+N» arriba lo decide quien implementa (cada sello es un `Html` de drei con su propio `z-index`). El resultado lo fija la prueba `…takes the click…` de abajo.
- [x] **6. Mutaciones**, una por una, con `git checkout -- <archivo>` después y `git status` limpio: (sustituido por las mutaciones de los Cierres de M6 (52), M7 (20), M8 (25) y M12 (29), cada una restaurada, que cubren el paso de 25 px, la prioridad de los sellos de problema, los obstáculos de las etiquetas de paquete y el caso `stamps` de `inspect`. La M2 de aquí, `labelSpans` vacío, no tiene objeto porque `labelSpans` no existe, y el resultado no va en `tests/e2e/chapter-2/CLAUDE.md` sino en esos Cierres.)
  - **M1.** Paso del abanico de 25 a 20 px: deben fallar la prueba de los 25 px del 02-03 y `a place whose stamps all fit draws every stamp, 25 px apart along the screen and centered on the place`.
  - **M2.** `labelSpans` devuelve la lista vacía: debe fallar la prueba de solapes del 02-03 y `the corridor beside laptop-lucia in 02-03 holds three casillas…`.
  - **M3.** La prioridad ignora `isProblemStamp`: deben fallar las dos pruebas de prioridad.
  - **M4.** `spreadTags` ignora los sellos: deben fallar las pruebas de solapes del 02-03 (sin animaciones).
  - **M5.** `inspect()` ignora el caso `stamps`: deben fallar las pruebas de la lista y las de «+2».
  - El resultado va en `tests/e2e/chapter-2/CLAUDE.md`, con fecha. Una mutación que no hace fallar su prueba se arregla en la prueba.
- [x] **7. Commit 4.** Las e2e nuevas, la guía y el backlog. Si una prueba de solapes falla por la escalera y pasaba con la altura media, se aplica la salvaguarda de la decidida 54 y se informa. (Sustituido. Las e2e de solapes del 02-03, del 02-05 y del 02-08 son el barrido de M8; los tres «Known gap» de `tests/e2e/chapter-2/CLAUDE.md` los quitó M23 (`0a83b72`) al reescribir la guía; el backlog lo cierra el commit de M26: J19 (el punto de peligro del «+N», resuelta) y J20 (el zoom del jugador, cerrada). Las tres pruebas de «+N» de esa lista (`in 02-03 a fourth stamp at laptop-lucia turns the last casilla into «+2», and hovering it lists the four`, `in 02-03 the list of «+2» opens with the keyboard focus and Escape gives the focus back` e `in 02-03 a tap on «+2» pins the list and a tap outside releases it`) las juega la pantalla real de 02-03 en `src/ui/incident/geometry/pinned-box.browser.test.tsx` (`28fb779`), con su título tal cual.)
- [x] **8. Cierre** (abajo). (Este commit solo cambia documentos. El `pnpm check` completo y `git diff --exit-code src/levels/04-iaas/golden-traces.json` de la 28 quinquies son la puerta del orquestador sobre M26; ver el Cierre de la Tarea M26 del plan del mapa 2D.)

**Tests nuevos** (nombres exactos, en inglés).

*Modelo puro* — `src/scene/marks/stamp-fan.test.ts`:
- `a place whose stamps all fit draws every stamp, 25 px apart along the screen and centered on the place`.
- `the corridor beside laptop-lucia in 02-03 holds three casillas with 6.4 px to spare and not four` (con las cajas medidas en el paso 1).
- `the room of a place is the narrow side of its corridor, taken twice, because the fan is centered on the place`.
- `a label above or below the band of a stamp does not narrow the corridor of its casilla, and one in the band does`.
- `a place with no label beside it draws all its stamps`.
- `a place whose stamps do not fit draws the casillas that fit less one, and the last casilla is a «+N» that counts the rest`.
- `a place where only one casilla fits draws a lone «+N» that holds every stamp of the place`.
- `a lone stamp is never moved, hidden or counted, whatever the labels beside it`.
- `a stamp with a problem stays in sight while a stamp with no problem can go into «+N»`.
- `among stamps of the same kind the oldest go into «+N»`.
- `with more problem stamps than free casillas the oldest problem stamps go into «+N»`.
- `the live flows of an incident are older than every packet the player sent, and a combination sent again is as new as its last send`.
- `the stamps that are drawn keep the order of the screen, whatever the order in which they were chosen`.
- `two places whose casillas would come near are taken in as one place`.
- `the casillas of one place keep the height of their point and move along the screen only`.
- `«+N» stands at the mean height of the stamps it hides`.
- `«+N» is the last casilla of its place and counts at least two stamps`.
- `the list of a «+N» holds every stamp of the place, the drawn ones too`.

*Modelo del ancho* — `src/scene/marks/label-width.test.ts`:
- `the width model gives the widths measured in Chromium for the labels of 02-03, 02-05 and 02-08 to within the tolerance of step 1b`.
- `a label with the lock or the alert is wider than the same label without them`.
- `the span of a label is centered on its point and lies at the height of its label, not at the height of the ground`.

*Etiquetas de paquete* — `src/scene/layout.test.ts`, junto a las de los nombres de piso:
- `a label of a packet moves clear of a stamp that lies over it, along the screen only`.
- `a label of a packet moves clear of the label of a piece that lies over it, along the screen only`.
- `a label that no stamp, name or label touches does not move`.

*Copia* — `src/copy/packet-labels.test.ts`:
- `a stamp is a problem when it is blocked, lost, warned or an intruder, and not when it arrived`.
- `the state of a stamp comes from the result as it did before it moved here: a warning first, then reached, an intruder if it was not meant to, then blocked or lost`.

*Lista, en `game`* — `src/game/view/inspection.test.ts`:
- `the id of a list of stamps reads back into the ids of its packets`.
- `no id of a packet of any registered incident holds the separator of the id of a list of stamps`.
- `a list of stamps shows one field per packet, newest first, with its label and how it ended`.
- `a list of stamps whose packets are gone inspects nothing`.
- `the list of stamps has no entity and its title counts the stamps`.

*El botón* — `src/scene/entities/stamp.test.tsx` (con `user-event`):
- `«+N» is a button with the class of a stamp, its number as text and the name of its list`.
- `«+N» wears the smaller letter from ten hidden stamps and the usual one below`.
- `hovering, focusing and clicking «+N» call the trigger of its list, as a stamp does of its packet`.

*Centinela* — `src/ui/incident/stamp-fan.test.ts` (compone `game` y `scene`, como `stamp-states.test.ts`):
- `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»`: para cada incidente con `send`, manda todas las combinaciones que ofrece; para cada incidente con flujos, mira el mundo de partida y el resuelto; calcula `labelSpans` con `pieceViews` y `fanStamps`; falla si un sello de problema queda en «+N». Es un centinela y no una prueba: un subconjunto de envíos puede formar otro grupo con otro centro. Es la jugada más extrema (en el 02-03 son 12 envíos, y los cuatro que van a `laptop-marta` pueden ser ✕), así que puede disparar con una jugada que nadie hace. **Si falla hoy, la tarea se detiene** en ese punto: la afirmación «ningún incidente lo produce hoy» quedó desmentida por la jugada más fuerte. El informe dice qué incidente, qué lugar, qué sellos y qué envíos los producen, y el orquestador decide con el estudiante si esa jugada cuenta. No se agrega ninguna lista de excepciones al centinela por cuenta propia.
- `in no registered incident does a place hide a hundred stamps or more`: la cota del número.

*Playwright* — `tests/e2e/chapter-2/chapter-2.spec.ts` (cada prueba de geometría, a 1280×800 y a 1440×900):
- `in 02-03 no piece label, floor name, stamp or packet label of the still map overlaps another after the four tests` (el parche; «Sin animaciones»).
- `in 02-03 no piece label, floor name or stamp of the map overlaps another after the four tests` (el parche; «Con animaciones»).
- `in 02-03 the three stamps of laptop-lucia stand in a fan 25 px apart and no «+N» is drawn`.
- `in 02-03 a fourth stamp at laptop-lucia turns the last casilla into «+2», and hovering it lists the four`.
- `in 02-03 the packet label of a hidden stamp is not drawn on the still map, and its text is in the list of «+2»`.
- `in 02-03 the list of «+2» opens with the keyboard focus and Escape gives the focus back`.
- `in 02-03 a tap on «+2» pins the list and a tap outside releases it` (contexto con `hasTouch`).
- `in 02-03 the click lands on the stamp under the pointer, on «+2» over the fan, and on the visible strip of each stamp`: `elementFromPoint` en la franja visible (unos 4 px a la izquierda del centro de cada sello que no es el último).
- `in 02-05 no piece label, floor name, stamp or packet label of the still map overlaps another` (antes de la regla, con la regla y con el intruso).
- `in 02-08 no piece label, floor name, stamp or packet label of the still map overlaps another after two nc and a ping`.
- `the model of the width of a label is never under the width the browser gives it and is at most 4 px over, in 02-03, 02-05 and 02-08`.
- En `tests/e2e/entities.spec.ts`: `the specimens of «+N» are part of the capture and their number fits inside the ring`.

**Pruebas existentes que cambian a propósito** (cada una va en el cuerpo del commit 3).
- `src/scene/layout.test.ts`, en `paths and stamps` (por confirmar corriéndolas; el paso de 0,8 a 0,465 y el solape de aros de 7 px rompen lo que fijan):
  - `chains close points into one group: A near B and B near C spread together, although A is far from C`.
  - `a spread group that comes close to another stamp takes it in, so no two stamps end up closer than the minimum`.
  - `moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device`.
  - `moves apart stamps that are farther than the minimum on the ground and still overlap on the screen, such as the two tests that stay at the doorstep and the one that ends on the road in front of it`.
  - Estas cuatro pasan a la función nueva, con el paso de 25 px y los aros de 32 px que se tapan hasta 7 px. Conservan lo que prueban: dos sellos cercanos no quedan en el mismo sitio.
  - `stamps on the same point spread apart along the screen, the rest stay` y `keeps each spread stamp on its own side of the screen, whatever the order of the points` se vuelven a correr; cambian solo si fallan.
- `src/scene/layout.test.ts`, el ayudante `terminalOnMap` llama a `spreadStamps`: pasa a la función nueva sin vecinos. Lo usan los `describe` `the terminal card in the office with no outside drawn` y `the terminal card in the office with the outside drawn`. Con los sellos más juntos, el número que fija `at 1280×800 the terminal of Casa de Lucía, 495 px tall because its title takes two lines, is 6 px too tall for the free strip: it covers the bottom of the lost stamps and no label` puede cambiar (por confirmar). Si cambia, se informa antes de editarlo.
- `src/scene/layout.test.ts`, los `describe` `the labels of packets that share a place` y `the labels of packets and the floor names`: sus llamadas a `spreadTags(paths, names)` pasan a la firma con obstáculos (mecánico; los nombres no cambian).
- `tests/e2e/map-boxes.ts`, `pairsThatOverlap` y `overlappingPairs` (el cambio de significado: dejan pasar sello con sello del mismo abanico). Los llaman, sin editarse:
  - `tests/e2e/chapter-1/chapter-1.spec.ts`: `in 01-01 the open card of the printer covers none of the pieces the player compares`, `in 01-02 the open terminal covers neither the printer, nor laptop-marta, nor the packet once sent`, `in 05 the warning for 192.168.1.50 appears at your own laptop and does not travel`, `after the pings of 08, no label or stamp overlaps, and the lost ping says why`, `in 01-09 and 01-10 no label or stamp of the map overlaps once the player has sent its messages`, `in 01-10, before the traceroute, no label or stamp of the map overlaps, and the lost ping stands just outside tu-laptop` y `in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps`.
  - `tests/e2e/incidents.spec.ts`: `an intrusion shows its alert inside the label of the device, and no label or stamp overlaps` y `labels and stamps do not overlap, and the open card does not cover its Security Group`. Estas dos son las del 04-01: sus dos envíos vivos terminan, con casi toda seguridad, en un grupo de 2 sellos en `servidor2` (paso 1d).
  - `tests/e2e/chapter-2/chapter-2.spec.ts`, por `expectClear` (que usa `pairsThatOverlap`): `in 02-01 no piece label, floor name, stamp or packet label of the still map overlaps another`, `in 02-02 no piece label, floor name, stamp or packet label of the still map overlaps another once the labels say TCP and both ports`, `in 02-04 no piece label, floor name or name of the outline of the still map overlaps another, with only your laptop inside, with the printer too and with laptop-andres too`, `after the pings of 02-07, no label or stamp overlaps` e `in 02-09 and 02-10 no label or stamp overlaps`. Sus nombres no cambian: la guía de la carpeta explica qué deja pasar el ayudante.
- **Una prueba que se renombra** (`tests/e2e/chapter-1/chapter-1.spec.ts`): `after the four tests of case 1 of 14, no stamp overlaps another` pasa a `after the four tests of case 1 of 14, no stamp lies over a label or covers another beyond the step of the fan`. Su nombre decía algo que el abanico vuelve falso. Su conteo `toHaveCount(WATCH_CASES[0].sends.length)` de `/^Paquete:/` cambia de sentido si el paso 4 bis dice que algún lugar de esos cuatro envíos desborda: entonces cuenta los sellos que se ven más los que cuenta el «+N».
- `tests/e2e/chapter-2/chapter-2.spec.ts`, las pruebas de «Sin animaciones» que miden dónde cae una etiqueta de paquete con el `spreadTags` de hoy (por confirmar corriéndolas; ahora los sellos y las etiquetas de pieza son obstáculos y una etiqueta puede quedar al otro lado de lo que mide la guía de la carpeta). Si fallan por este cambio, se informa antes de editarlas:
  - `in 02-01 the packet of an nc wears the port it goes to on the map, and the ping wears no label`.
  - `in 02-02 the packet of an nc wears TCP and both ports on the map, and the second connection leaves from the next port`.
  - `in 02-03 a refusal leaves the stamp Llegó and a silence leaves Bloqueado, and the four tests wear TCP and both ports on the map`.
  - `the still drawing of a translated packet shows the label of the leg where the packet stands` (la guía mide la etiqueta a la izquierda de la de `router-oficina`: 402 a 517 contra 414 a 529 a 1440×900).
  - `a translated packet changes its label at the router, from the private source port to the public one` se corre; con animaciones la etiqueta sigue al paquete y no usa `spreadTags`.
- `tests/e2e/entities.spec.ts` y `snapshots/entities-darwin.png`: ver «Capturas».
- Se vuelven a correr sin editarse: `flow-look.test.ts`, `stamp-states.test.ts`, `incident-screen.test.tsx` (la escena está simulada), `golden-traces.test.ts`.

**Capturas.** Sí las necesita, y «Global Constraints» ya lo dice.
- «+N» es una variante del sello y `DESIGN.md` («Adding a variant instead of a new element») pide su especimen en el catálogo, con la captura de tolerancia cero. Son dos especímenes porque la letra de 14 px es otro aspecto: «+2» y «+12».
- `entities-darwin.png` (piezas) se regraba a propósito y se revisa que el diff sean solo esos especímenes. Se cuentan las celdas libres de `CATALOG_ROWS` al empezar. Caso 1: caben en celdas libres y la captura de la interfaz no cambia. Caso 2: van en una fila nueva, la sección de la interfaz baja y se regraba también `interface-darwin.png` comprobando que el diff sea solo ese desplazamiento. El commit dice cuál fue.
- Sin `StampIcon` para «+N»: la lista de íconos de `#/entidades` no crece (en la Tarea 21 creció de 24 a 33 y movió la captura de la interfaz).

**Cambios visibles de los capítulos 1 y 4** (están en «Cambios visibles»; los números salen del paso 4 bis y van en el cuerpo del commit).
- **Los grupos de 2 o más sellos en un lugar** pasan de 43 px de paso a 25: cada sello tapa 7 px del aro del vecino y el de más a la derecha queda encima. Cada sello queda a la altura de su punto (hasta unos 14 px más arriba o más abajo que el vecino; decidida 54). Ningún mapa cambia de tamaño. El signo de cada sello se ve entero.
- **Capítulo 4.** El 04-01 y el 04-02 dibujan siempre dos envíos vivos y los dos terminan en `servidor2`: el grupo de 2 se ve más junto (por medir en el paso 1d).
- **Capítulo 1.** Los incidentes con 2 o más sellos juntos: los TTL altos del 01-09 que terminan en el servidor, los envíos repetidos a un mismo destino del 01-08 al 01-10, los casos del 01-14 y los flujos del 01-12 y del 01-13 si terminan cerca (por medir en el paso 4 bis).
- **«+N»** aparece donde un lugar ya no cabe entre sus etiquetas vecinas. Si el paso 4 bis dice que algún incidente de los capítulos 1 o 4 lo produce, se lista aquí con su incidente.
- La etiqueta de un paquete con puertos se aparta de los sellos y de las etiquetas de pieza: solo el capítulo 2 (el capítulo 1 y el 4 no dibujan etiquetas de paquete).

**Specs que se corren** (una suite a la vez, sin reintentos; las de geometría con `--repeat-each=10`):
- `pnpm e2e tests/e2e/chapter-2/chapter-2.spec.ts`
- `pnpm e2e tests/e2e/chapter-1/chapter-1.spec.ts`
- `pnpm e2e tests/e2e/incidents.spec.ts`
- `pnpm e2e tests/e2e/entities.spec.ts` (regraba la de piezas a propósito, una vez, y después pasa sin regrabar)
- `pnpm e2e tests/e2e/card-layout.spec.ts` (se corre porque la caja de inspección ahora puede listar sellos; el mecanismo de caja que no cabe ya está cubierto y no cambia)

**Cierre.**
- `pnpm check:fast` verde en cada commit.
- `pnpm check` completo al final de la tarea. Es una excepción a la regla de «Listo» porque la tarea cambia lo que ven los capítulos 1 y 4; lo que falle se compara con la base de la regla C.
- `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida.
- Ningún archivo de `src/engine/` ni de `src/levels/` cambia: `git diff --name-only <base>..HEAD -- src/engine src/levels` está vacío. El capítulo 4 no cambia lo que calcula; cambia lo que dibuja.
- `concepts/ami.md` no se toca ni se agrega.
- Chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado (`LINKS OK`).

**Backlog** (`../../docs/plans/2026-10-08-follow-the-packet-followups.md`, bloque J, con el siguiente número libre después de la 28 bis; hoy sería J19, porque la 28 bis usó de J16 a J18).
- Fila nueva: `| J19 | Un «+N» que esconde un sello de problema (✕, ?, ! o intruso) se dibuja igual que cualquier «+N»: el jugador no sabe que adentro hay un problema sin abrir la lista. Ningún incidente registrado lo produce; el centinela `in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»` (`src/ui/incident/stamp-fan.test.ts`) falla el día que uno lo haga. Abierta: cómo se ve | Pendiente: decide el estudiante cuando un incidente lo produzca (O-4 = G, Tarea 28 quinquies) |`.
- Fila opcional: `| J20 | El abanico y su pasillo no modelan el zoom que elige el jugador (`MapControls`, 18 a 110; las distancias cambian y las etiquetas no), ni el borde del mapa, ni un tope de ancho: un lugar sin vecinas dibuja todos sus sellos en 36 + 25 (k − 1) px | Pendiente: sin medir (Tarea 28 quinquies) |`.

**Commits** (Conventional Commits, en inglés; cada uno termina con la línea en blanco y el pie de «Global Constraints»; el estudiante aprueba cada uno).
1. `refactor(scene): move the spread of stamps and packet labels to src/scene/marks`
2. `feat(scene): model the room between labels and fan the stamps of a place up to what fits`
3. `feat(scene): draw the fan, the +N stamp and the list of stamps of a place`
4. `test(e2e): no label, stamp or packet label overlaps in 02-03, 02-05 and 02-08, and +N opens its list`

El cuerpo del commit 3 lista las pruebas existentes que cambió, el caso de captura (1 o 2) y la tabla del paso 4 bis.

**Review Focus:** 14, 15 y 28.

**Lo que no se pudo verificar.**
- Nada de esto se corrió. El 36,1 px de la caja girada, el solape de 11,1 px y la altura de proyección `√(2/3)` son cálculo, no medida: el paso 1 los mide.
- El modelo del ancho depende de las fuentes de la máquina del estudiante. «Se ven los 3» en el 02-03 tiene 6,4 px de holgura: con otra fuente podría ser «2 y +2». La prueba que compara el modelo con el DOM lo detecta, pero esa máquina es la única medida.
- Que mover una etiqueta de paquete solo en horizontal libre al 02-05 y al primer par del 02-08 no está medido (hallazgo 2); cuánto tiene que subir o bajar si no basta lo mide el paso 2, que fija el tope (decidida 55).
- Que el 04-01 y el 04-02 formen un grupo de 2 en `servidor2` es probable, no medido. Qué lugares de los capítulos 1 y 4 llegan a «+N» no se calculó.
- Si algún incidente registrado esconde un sello de problema con todas sus combinaciones: lo dice el centinela, que no se corrió.
- El mecanismo de capas de `Html` (el sello al frente, «+N» encima) no se probó; es cálculo.
- «+10» a «+99» a 14 px: solo «+10» está medido. «+100» no cabe (extrapolado).
- El pasillo del resolver (donde la decidida 48 pone el sello de cada consulta) no se midió; lo mide el paso 1c cuando exista el incidente.
- La escalera de unos 14 px (decidida 54), su efecto sobre el pasillo y sobre la tolerancia del ayudante, y la altura del «+N» (la media de los sellos que esconde) no se midieron: el paso 1 y la salvaguarda lo deciden.
- El zoom del jugador, el borde del mapa y el ancho máximo del abanico no están modelados.
- `layout.test.ts` y las e2e que se listan como «por confirmar» no se corrieron: la lista puede ser más larga o más corta.

---

### Tarea 29: Bloque 5 · 10

**Presenta:** nombre de dominio, DNS, consulta DNS, resolver, UDP, dig, DHCP (ficha 02-10). Denso: tarea propia. **Depende de:** la Tarea 28 quater (O-2 = A).

**Archivos:**
- Create: `src/levels/02-ports-and-names/names/10-asking-for-a-name.ts` y `names/CLAUDE.md`.
- Modify: `shared.ts` (los servidores de nombres, la zona, `setDnsServer`), `src/game/chapter-2.test.ts`, `registry.test.ts`, `tests/e2e/chapter-2/chapter-2.spec.ts` y `chapter-2-play.ts`.

**Tests:**
- `02-10: dig sends one query by udp to port 53 of the resolver and gets one answer`.
- `02-10: the box of the dig has no greeting`.
- `02-10: dig and ping both resolve www.lucia.example to 198.51.100.50`.
- `02-10: the settings card of tu-laptop shows the dns server and says DHCP gave it`.
- `02-10: the report names tu-laptop`.
- `02-10: draws the resolver and not the authoritative server`.
- `02-10: every address of the chapter is in a documentation block and every name is under .example`.
- `02-10: introduces domain name, DNS, DNS query, resolver, UDP, dig and DHCP, and uses no later term`.
- `02-10: ping by name draws the question to the resolver first, with its own source port, and the ping after it`.
- `02-10: the question of a ping leaves a row in the translation table and the ping leaves none`.
- `02-10: the ping after a dig gets its answer from the cache of the resolver and still sends its question`.
- `02-10: the incident draws the resolver, so the question has somewhere to go`.
- `02-10: no text says the computer asks only once`.
- Playwright, `in 02-10 a ping by name draws the question first and the ping after it, each with its stamp`.
- Cierre: `pnpm check:fast` y la spec de `tests/e2e/chapter-2/` que juega este incidente con `chapter-2-play.ts` y `tests/e2e/roadmap.spec.ts`; golden sin cambios.

**Review Focus:** 3, 4, 11, 13 y 19.

**Commit:** `feat(levels): add chapter 2 incident 10, asking for a name`.

---

### Tarea 30: Bloque 5 · 11

**Presenta:** servidor autoritativo, registro DNS, registro A, registro CNAME (ficha 02-11). **Depende de:** la Tarea 28 quater (O-2 = A).

**Archivos:**
- Create: `src/levels/02-ports-and-names/names/11-the-records.ts`.
- Modify: `shared.ts` (el `setDns` con los registros equivocados, las bandejas de la tarjeta de registros), `src/game/chapter-2.test.ts`, `registry.test.ts`, `names/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-11: fixing the a record of www makes the nc by name come back`.
- `02-11: a cname for blog is refused while blog has an a record and the card says why`.
- `02-11: a cname at lucia.example is refused and the card says the zone has its own records`.
- `02-11: removing the a record and creating the cname closes the incident with the answer through an alias`.
- `02-11: the report names servidor-autoritativo`.
- `02-11: draws the authoritative server only now`.
- `02-11: the records of the zone itself are hidden under one line`.
- `02-11: introduces authoritative server, DNS record, A record and CNAME record, and uses no later term`.
- `02-11: the nc by name draws its question first and leaves from the next port`.
- `02-11: after a record is placed the numbers start again at the first port and the first public port`.
- `02-11: the question comes back with the wrong address before the nc is warned by a router`.
- Cierre: `pnpm check:fast` y la spec de `tests/e2e/chapter-2/` que juega este incidente con `chapter-2-play.ts` y `tests/e2e/roadmap.spec.ts`; golden sin cambios.

**Review Focus:** 3, 6, 11 y 18.

**Commit:** `feat(levels): add chapter 2 incident 11, the records`.

---

### Tarea 31: Bloque 5 · 12

**Presenta:** caché DNS, TTL de DNS (ficha 02-12). **Depende de:** D-11.

**Archivos:**
- Create: `src/levels/02-ports-and-names/names/12-still-the-old-ip.ts`.
- Modify: `shared.ts` (el `setDns` de los dos servidores, `servidor-nuevo`, la caché inicial, las fichas de espera), `src/game/chapter-2.test.ts`, `registry.test.ts`, `names/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-12: dig answers the old ip from the cache with the seconds left`.
- `02-12: waiting five minutes makes the cache run out and dig gives the new ip`.
- `02-12: a move that changes the world clears the sends and not the clock`.
- `02-12: the text separates the ttl of dns, in seconds, from the ttl of ip, which counts hops`.
- `02-12: the report names servidor-autoritativo and servidor-dns`.
- `02-12: introduces DNS cache and DNS TTL, and uses no later term`.
- `02-12: offers only dig, so no send of the incident asks a question`.
- Cierre: `pnpm check:fast` y la spec de `tests/e2e/chapter-2/` que juega este incidente con `chapter-2-play.ts` y `tests/e2e/roadmap.spec.ts`; golden sin cambios.

**Review Focus:** 3, 6, 11, 12 y 18.

**Commit:** `feat(levels): add chapter 2 incident 12, still the old ip`.

---

### Tarea 32: Bloque 5 · 13

**Presenta:** NXDOMAIN, SERVFAIL, Port Unreachable, archivo hosts (ficha 02-13). Si la prueba humana del capítulo entero lo siente pesado, se parte en «tres fallas» y «la trampa de hosts». **Depende de:** la Tarea 28 quater (O-2 = A).

**O-2 = A.** Nada de lo que se manda en este incidente cambia de número: todo lo que va por DNS es un `dig`, que ya es la consulta. El contraste se ve así: `dig tienda.lucia.example` dibuja un datagrama al resolver y su respuesta NXDOMAIN, y `ping tienda.lucia.example` no dibuja ninguna consulta, porque contestó el archivo hosts. La opción A de O-2 decía que el contraste sería con «un `ping` por DNS»; no vale para este incidente, cuya ficha no tiene un `ping` por DNS. Sumarlo era la decisión O-7, que el estudiante decidió el 2026-10-12 en A: no se suma. Porqué: el contraste ya se ve, porque `dig tienda` dibuja una consulta y `ping tienda` no; además el 02-13 ya es denso.

**Archivos:**
- Create: `src/levels/02-ports-and-names/names/13-it-does-not-resolve.ts`.
- Modify: `shared.ts` (`servidor-autoritativo-noticias`, `setHosts`, el DNS de `laptop-andres`), `src/game/chapter-2.test.ts`, `registry.test.ts`, `names/CLAUDE.md`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-13: dig of a name that does not exist ends in NXDOMAIN`.
- `02-13: dig of a name in the zone whose server fails ends in SERVFAIL`.
- `02-13: dig of tienda.lucia.example ends in NXDOMAIN while ping of the same name comes back`.
- `02-13: the dig from laptop-andres ends in Port Unreachable from the printer`.
- `02-13: no text reads a failed dig as proof that the name does not exist when the hosts file is the cause`.
- `02-13: the report names tu-laptop, laptop-andres, servidor-dns and servidor-autoritativo-noticias`.
- `02-13: the NXDOMAIN demo uses a subdomain that does not exist and not a name under .invalid`.
- `02-13: introduces NXDOMAIN, SERVFAIL, Port Unreachable and hosts file, and uses no later term`.
- `02-13: dig of tienda.lucia.example draws a question to the resolver and ping of the same name draws none`.
- `02-13: every send of the incident that goes by name has the resolver in its shown list`.
- Cierre: `pnpm check` completo (cierra el bloque 5); golden sin cambios.

**Review Focus:** 3, 6, 7, 11 y 18.

**Commit:** `feat(levels): add chapter 2 incident 13, it does not resolve`.

**Revisión de los textos del bloque 5** (10 a 13) por un revisor `sonnet`, antes del bloque 6 (ver «Contenido»).

---

### Tarea 33: Bloque 6 · 14

**Presenta:** ningún término (ficha 02-14). **Depende de:** D-12 y la Tarea 28 quater (O-2 = A).

**Archivos:**
- Create: `src/levels/02-ports-and-names/on-call/14-on-call-it-does-not-connect.ts`, `cases.ts` y `on-call/CLAUDE.md`.
- Modify: `shared.ts` (los cambios de cada caso, `LOOP` y su reparación, las listas `shown` por caso; las de los casos 1 a 3 suman `servidor-dns`, O-2 = A), `src/game/chapter-2.test.ts` (ahora exige los 53 términos), `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`, `src/storage/progress.test.ts`.

**Interfaces:** siete casos (tabla de la ficha), cada uno como un cambio sobre el mundo del 13; `cases.ts` usa constructores para que `jscpd` no vea siete casos casi iguales. El caso 5 trae `fix`.

**Tests:**
- `02-14: case 1 shows the three tests in order and the third is refused`.
- `02-14: case 2 ends in NXDOMAIN, the question goes to the resolver and nothing goes to the server`.
- `02-14: case 3 gets the good ip from dig and sends the ping to the one in the hosts file`.
- `02-14: case 4 warns Destination Net Unreachable from router-oficina`.
- `02-14: case 5 alternates two routers in its Time Exceeded and closes only with the cause named and the fix done`.
- `02-14: case 6 is silent towards one port only and the firewall of laptop-lucia is visible`.
- `02-14: case 7 ends in Port Unreachable from the printer`.
- `02-14: naming the right cause of the seven cases earns three stars`.
- `02-14: each case has a different cause`.
- `02-14: each case starts from the world before the incident plus its own changes, not from the case before`.
- `02-14: no report and no correct option names a switched-off device as the cause`.
- `02-14: every case report names a ping, an nc or a dig that does not come back and none uses a verb of the web`.
- `02-14: every change a case makes is named in its report or in the feedback of its right cause`.
- `02-14: case 1 draws the dig and the question of the ping and of the nc by name, each with its stamp at the resolver`.
- `02-14: case 2 draws the question and its answer and the nc stays at its doorstep without a port`.
- `02-14: case 3 draws a question for the dig and none for the ping, which the hosts file answered`.
- `02-14: every case that sends by name has the resolver in its shown list`.
- `chapter-2.test.ts`, `introduces exactly the 53 terms of the approved design, each in its incident`.
- `no term of the approved design is missing: the ids of the table of the spec equal the ids that 02-01 to 02-14 introduce`.
- `cidr, dns and nat are introduced by chapter 2 and by no incident of chapter 4`.
- `names no topic of the chapters that come later, in any text of chapter 2`.
- `every public address of chapter 2 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
- Playwright: `04-01 opens once 02-14 has a star`.
- Cierre: `pnpm check` completo (cierra el bloque 6); golden sin cambios.

**Review Focus:** 3, 4, 6, 14, 17 y 19.

**Commit:** `feat(levels): add chapter 2 incident 14, on call`.

**Revisión de los textos del bloque 6** (14) por un revisor `sonnet` (ver «Contenido»).

**La página de las decididas «para revisar»** (regla del umbral, 2026-10-12). Antes de que el estudiante juegue el capítulo, el orquestador junta todas las entradas de «Decididas sin el estudiante (para revisar)» en una sola página, para que las revise de una vez. Por entrada: la decisión, el porqué, qué cambia para el jugador si el estudiante elige otra y qué tarea la aplica. Las entradas visuales (50, 52, 53, 54 y 55, entre otras) llevan capturas reales del capítulo ya construido y no dibujos calculados (regla del estudiante «Elecciones visuales con prototipos renderizados»). Las que se apartan de una página publicada (50 y 53) van marcadas. Lo que el estudiante cambie se agrega a la tarea que lo aplica o al backlog. La página la publica el orquestador; no es un archivo de código y no se commitea.

**Prueba humana del capítulo entero** (única; D-15 = B, 2026-10-11). El estudiante la hace con su propio servidor al terminar esta tarea: juega los catorce de seguido y entra después al capítulo 4, y dice si algún mensaje lo pierde. Las Tareas 34 y 35 no se detienen a esperarla; lo que anote se agrega al backlog. Comprueba, por bloque:
1. **Bloque 1 · 01 y 02.** (a) Si el 01 y el 02 se sienten pesados (seis términos cada uno; D-17); (b) si la caja separa bien el ping del `nc`; (c) si «cliente y servidor» se entiende como roles; (d) si el saludo de tres pasos y los puertos invertidos se leen. (La pregunta sobre `tcp` en la salida de `nc` antes del 02 ya no aplica: D-5.)
2. **Bloque 2 · 03, 04 y 05.** (a) Si el 03 se siente pesado (tres causas; D-17); (b) si el rechazo y el silencio se distinguen en el mapa y en la caja; (c) si la tarjeta «Servicios de laptop-lucia» se encuentra; (d) si el 04 sin viaje se entiende (D-6) y si la fila de bits, las bandejas y el contorno ayudan; (e) si «`0.0.0.0/0` es cualquier origen» queda claro en el 05; (f) si las fichas de rango de puertos se entienden.
3. **Bloque 3 · 06 y 07.** (a) Si el mapa del 07, con ocho piezas, no se amontona; (b) si la tabla de rutas se lee y la columna «Por dónde sale» pasa a «Siguiente salto» sin confundir; (c) si el aviso Net Unreachable y la muerte en silencio se distinguen; (d) si el report del 07 explica por qué `router-oficina` perdió sus rutas; (e) si «gana la más específica» se entiende.
4. **Bloque 4 · 08 y 09.** (a) Si la traducción a la vista (V13) es clara; (b) si el 08 cierra la duda del capítulo 1 sobre cómo salía el paquete; (c) si «NAT no es un firewall» se entiende y no se lee como una regla de seguridad; (d) si el reenvío fijo del 09 no confunde; (e) si la tabla de traducciones tiene sentido con dos laptops.
5. **Bloque 5 · 10 a 13.** (a) Si el 10 se siente pesado (siete términos; D-17); (b) si la caja del `dig` se lee; (c) si el resolver «busca por ti» alcanza o falta el autoritativo; (d) si la tarjeta de registros y el rechazo del CNAME se entienden; (e) si esperar con el reloj se entiende (D-11); (f) si el TTL de DNS no se confunde con el de IP; (g) si el 13 se siente pesado y conviene partirlo; (h) si la trampa del archivo hosts queda clara.
6. **Bloque 6 · 14 y el capítulo entero.** (a) Que los siete casos se pueden resolver con lo aprendido; (b) que arreglar el bucle con la tarjeta de rutas es posible; (c) si el capítulo entero se siente largo (veintiocho subcapítulos antes del 04-01): qué se fusiona o se separa; (d) que el capítulo 4 sigue jugable; (e) que nada de la red se siente «mágico»: cada vez que se porta distinto, el juego dice qué cambió.

---

### Tarea 34: Playwright del capítulo entero

**Archivos:**
- Modify: `tests/e2e/chapter-2/chapter-2.spec.ts` (nuevo), `chapter-2-play.ts`, `tests/e2e/saved-progress.ts`, `tests/e2e/incidents.spec.ts` (si algún nombre cambió), `tests/e2e/card-layout.spec.ts` (suma las escenas de las tarjetas nuevas; cada escena nueva entra también en las pruebas de que la caja no tapa la tarjeta: el oráculo recorre `MAP_SCENES`), `tests/e2e/map-boxes.ts` y `card-boxes.ts` (si hace falta), `tests/e2e/CLAUDE.md`.

**Tests:**
- `chapter 2 is played from 02-01 to 02-14, each incident opening the next, with 3 stars each`.
- `the roadmap lists the fourteen incidents of chapter 2 with their stars`.
- `04-01 opens after 02-14 has a star`.
- Dentro de «Sin animaciones»: `in 02-07 the map and its labels fit the area at full size`.
- `in 02-09 and 02-10 no label or stamp overlaps` existe para el 02-09 (Tarea 28). Esta tarea suma a la misma prueba, con el mismo nombre, los estados del 02-10: sin nada enviado, tras el `dig`, tras un `ping` por nombre y tras los dos. Con el ayudante de la Tarea 28 quinquies deja pasar sello con sello del mismo abanico y falla sello contra etiqueta. Además cuenta: los sellos que se ven más los que cuenta cada «+N» son los envíos (la consulta de cada `ping` por nombre es un sello más del resolver, decidida 48).
- `in 02-14 case 1 no label or stamp overlaps after the dig, the ping and the nc by name` (llega a 3 sellos en el resolver, un lugar que O-4 no midió; los que no caben pasan al sello «+N» y la prueba cuenta los que se ven). El centinela de la 28 quinquies (`in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N»`) recorre también los incidentes del capítulo 2 que existan entonces; los estados del 02-10 al 02-14 los suma esta tarea a ese recorrido si el incidente ofrece más combinaciones de las que el centinela ve.
- `in 02-07 and 02-08 the inspection box of a piece covers no open card, at 1280×800 and at 1440×900`.
- `the cards of tables, output and services cover no piece of the map`.
- `in 02-12 waiting from the clock card changes the answer of dig`.
- `in 02-03 the services card opens from the label of laptop-lucia and switches the address`.
- `in 02-04 placing a device inside the block draws it inside the outline and moving it out takes it out`.
- `in 02-14 case 5 can be repaired from the routes card`.
- Cada prueba de geometría corre a 1280×800 y a 1440×900, con el mapa a tamaño completo.
- Cierre: `pnpm check` completo (regla de «Listo»: cierra el capítulo).

**Review Focus:** 14 y 28.

**Commit:** `test(e2e): play the fourteen incidents of chapter 2`.

---

### Tarea 35: Documentos

**Archivos:**
- Modify: `README.md` (el capítulo 2 es de catorce subcapítulos en seis bloques; enlaza el spec y este plan), `DESIGN.md` (se revisa que refleje `Table`, la tarjeta «Salida» y su plegado, el estándar de avisos y errores, la tarjeta con pestañas de cada pieza y la nueva estructura de carpetas), `../../docs/plans/follow-the-packet-roadmap.md` (la fila del capítulo 2 pasa de `en curso` a `hecho` con los commits, y se suma la prueba humana del capítulo 2 si falta alguna), `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (lo que quedó: D-16 `traceroute -I`, las líneas de `nc` y `dig` que no se pudieron verificar, los subcapítulos que la prueba humana del capítulo entero pidió separar o fusionar, I1), `../../docs/research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 2: temas y «qué viaja y qué configura» de los catorce), `../../docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md` (estado; la línea del SOA ya se corrigió en la Tarea 0), este documento (los totales reales y las decisiones tomadas).
- Antes de cerrar, correr el chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado: debe decir `LINKS OK`.

**Tests:** `chapters.test.ts`, `match the chapter map of the chapters doc, in game order` sigue verde (la tabla no cambia).

**Cierre:** `pnpm check` completo en verde (regla de «Listo»: cierra el plan). **Commit:** `docs: record chapter 2 in fourteen subchapters`. Al cerrar el plan se sugiere `/clear`.

---

## Cobertura de los 53 términos

El plan prueba que no falta ninguno de dos maneras: esta tabla, hecha del spec, y el test `no term of the approved design is missing: the ids of the table of the spec equal the ids that 02-01 to 02-14 introduce` (Tarea 33), que además exige `registers the 50 new ids of chapter 2 and rewrites cidr, dns and nat` (Tareas 2 y 2 bis). Los 53 suman 6 + 6 + 5 + 4 + 4 + 4 + 3 + 3 + 1 + 7 + 4 + 2 + 4. Los 50 ids nuevos se registran en las Tareas 2 (49) y 2 bis (`default-port`); `cidr`, `dns` y `nat` ya existen.

| Inc. | Tarea | Ids que presenta | Cuántos |
|------|-------|------------------|---------|
| 01 | 23 | `service`, `port`, `listen`, `ip-port`, `destination-port`, `nc` | 6 |
| 02 | 24 | `client-server`, `tcp`, `connection`, `handshake`, `source-port`, `ephemeral-port` | 6 |
| 03 | 25 | `closed-port`, `rst`, `connection-refused`, `filtered-port`, `listen-address` | 5 |
| 04 | 26 | `bit`, `prefix`, `cidr`, `subnet-mask` | 4 |
| 05 | 26 | `port-range`, `ssh`, `default-port`, `well-known-ports` | 4 |
| 06 | 27 | `route`, `routing-table`, `connected-route`, `default-route` | 4 |
| 07 | 27 | `next-hop`, `net-unreachable`, `most-specific-route` | 3 |
| 08 | 28 | `nat`, `napt`, `translation-table` | 3 |
| 09 | 28 | `port-forwarding` | 1 |
| 10 | 29 | `domain-name`, `dns`, `dns-query`, `resolver`, `udp`, `dig`, `dhcp` | 7 |
| 11 | 30 | `authoritative-server`, `dns-record`, `a-record`, `cname-record` | 4 |
| 12 | 31 | `dns-cache`, `dns-ttl` | 2 |
| 13 | 32 | `nxdomain`, `servfail`, `port-unreachable`, `hosts-file` | 4 |
| 14 | 33 | ninguno | 0 |
| **Total** | | | **53** |

## Cobertura de requisitos

| Pide el encargo o el estudiante | Dónde |
|---------------------------------|-------|
| Spec y plan en español con tildes, en los dos archivos pedidos | Estos dos documentos |
| Los 14 subcapítulos aprobados, tal cual | Spec («Los catorce»); fichas 02-01 a 02-14 |
| 53 términos (52 aprobados y `default-port`, que pidió el estudiante con D-18), con prueba de que no falta ninguno | Spec («Escalera de términos»); Tareas 2, 2 bis y 33; tabla de arriba; Review Focus 3 |
| Bloques 01-02, 03-05, 06-07, 08-09, 10-13 (partible) y 14 | Tareas 23 a 33 |
| Si algo no cierra, decisión abierta | D-7 (cuatro definiciones), D-8 (homónimo), D-5 (qué `nc` y qué `dig`), D-18 (los puertos conocidos); todas contestadas el 2026-10-11 |
| Rigor siempre; la opción inexacta se marca | Global Constraints; cada decisión abierta; Review Focus 18 |
| Ningún cambio de comportamiento sin causa; el 07 no hace avisar a un router que callaba | Decidida 11; Tareas 3, 9 y 27; Review Focus 6 y 7 |
| El NAT del 08 revela algo del capítulo 1; revisar si el capítulo 1 muestra un paquete privado en el servidor | Spec («Lo que el capítulo 2 hereda del capítulo 1», punto 1); decidida 3; Tareas 10 y 28; Review Focus 2 |
| Sin predicciones antes de actuar | Reglas del spec; fichas |
| Lenguaje simple | Formato; fichas; revisor de cada bloque y prueba humana del capítulo entero |
| Una sola primitiva de UI por familia; tarjetas nuevas en estilo B | D-3, D-4; Tareas 17, 18, 18 bis y 19; Review Focus 16 |
| Un solo estándar para los avisos y los errores de todo el juego (2026-10-11) | Tarea 18 bis; V17 y V18 (`Message`, aspecto «Pestaña», `success` en verde); Review Focus 21 |
| Una sola entrada por pieza, con pestañas, y un reloj del juego aparte (2026-10-11) | Decidida 22; Tarea 19; V15 y V16; Review Focus 22 |
| Pruebas e2e deterministas y un chequeo rápido por tarea, con el mismo rigor (2026-10-11) | Tarea 19 bis; «Global Constraints» («"Listo"»); Review Focus 25 |
| Elecciones visuales con prototipos renderizados; Tarea 0 | Tarea 0; «Decisiones visuales» |
| Sintaxis de Linux en la terminal | Tarea 18; D-5 (`ncat` 7.93 y BIND 9.18) |
| El progreso guardado se puede resetear; sin migraciones | Decidida 18 |
| IPs de RFC 5737 y nombres bajo `.example` de RFC 2606 §2, verificados y citados | Spec («El mapa que crece», «Base de investigación»); D-13; Review Focus 19 |
| El 53 se lista con DNS (reformulado con D-18: los cinco puertos son de `default-port`) | Spec («Decisiones del estudiante»); Tareas 2 y 2 bis (`default-port`, `well-known-ports`, `dns`) |
| Huecos del motor primero y antes del contenido | «Inventario de mecánicas»; Tareas 4 a 13 antes de las 14 a 33 |
| Puerto de origen en el paquete | Tareas 4, 5 y 28 quater |
| Servicios UDP y Port Unreachable | Tareas 6 y 7 |
| Dirección de escucha | Tarea 6; decidida 8 |
| Tablas de rutas en dispositivos y routers, editables, con prefijo más largo | Tareas 8 y 9 |
| Net Unreachable | Tarea 9 |
| NAT con puertos y tabla de traducciones | Tareas 10, 11 y 28 quater; decididas 3 y 4 |
| Modelo de DNS con resolver, autoritativo, A, CNAME, caché con TTL, NXDOMAIN, SERVFAIL y archivo hosts | Tareas 12, 13 y 28 quater |
| La consulta DNS de un `ping` o un `nc` por nombre se dibuja (O-2 = A) | Tarea 28 quater; decididas 4, 5, 6 y 34; Tareas 29 a 33; Review Focus 1, 2, 8, 11, 12, 14, 16 y 18 |
| `nc -vz` y `dig` con salidas fieles, con fuente | Tarea 18; D-5; spec («Lo que la simulación enseña») |
| Capítulo 4: regenerar o no el test dorado | D-1; Review Focus 1 |
| Mover `cidr`, `dns` y `nat` del 4 al 2 (`nat` se reescribe) | Tarea 2; D-7; «Cambios visibles del capítulo 4» |
| Todo cambio visible del capítulo 4 | «Cambios visibles del capítulo 4» |
| La forma de todo paquete y del intruso (V19 = B, 2026-10-11) | Tarea 21; Review Focus 23 |
| El 04 sin que viaje nada, con la tarjeta de clasificar y el contorno (D-6 = A, 2026-10-11) | Tareas 14, 15, 19, 21 y 26; Review Focus 24 |
| Mecánicas nuevas: cuáles lo son y cuáles reutilizan `filter`, `send` o `identify` | D-2; «Inventario de mecánicas»; Tarea 14 |
| Subcapítulos densos (01, 02, 03 y 10) con tareas que repartan la carga, y cómo separarlos | Tareas 23, 24, 25 y 29; D-17 |
| Una sola prueba humana, al final del capítulo (D-15 = B, 2026-10-11), con un revisor de textos por bloque | Final de la Tarea 33; «Contenido»; Global Constraints («Ejecución») |
| Formato como el del capítulo 1: sin código, tareas con objetivo, archivos, tests con nombre, Review Focus, un commit propio y `pnpm check` | «Formato de este plan»; cada tarea |
| Global Constraints: commits solo con las rutas de la tarea y el trailer, nada de `labs/`, sin push, puertos 5180 y 5173 intocables, Playwright en el puerto de su worktree (de 4183 a 4282), nada de matar por patrón | «Global Constraints» |
| «Decisiones abiertas» (D-1…) con opciones, recomendación y porqué; «Decididas sin el estudiante» | Las dos secciones |
| Árbol al terminar, cobertura de requisitos | Las dos secciones |

## Decisiones visuales (2026-10-11)

El estudiante eligió el 2026-10-11, con los prototipos renderizados de la Tarea 0 (página: https://claude.ai/artifact/HC9ersrkMisGqkCwnEF8mH), las decisiones V10 a V17. Toda elección visual nueva se le muestra con prototipos renderizados, no con dibujos de texto. La columna «Primitiva que se reutiliza» es la regla de `DESIGN.md`: ninguna elección suma un elemento hermano; el estilo cambia la primitiva. Ninguna decisión de la Tarea 0 queda abierta. Después se decidieron dos más, el 2026-10-11: V18, que abrió la Tarea 18 bis, y V19, que abrió la Tarea 21. No queda ninguna abierta.

| # | Qué se decide | Primitiva que se reutiliza | Decisión del estudiante | Tareas |
|---|---------------|----------------------------|-------------------------|--------|
| V10 | La tabla (D-3): `Table` o filas de texto | `Card`, `ChipTray`, `Button`; `Table` | **A.** Una primitiva `Table` (D-3 = A, la recomendación del plan) | 17, 19 |
| V11 | La tarjeta «Salida» (D-4) y cómo se lee la salida de `dig` | La tarjeta de traceroute | **B.** La tarjeta imprime la salida completa y real de `dig` y la pliega: por defecto se ven solo las líneas clave (la del `status` y la respuesta), cada una en su sitio, con una marca de cuántas líneas hay plegadas en cada tramo, y un control «Ver las N líneas restantes» las despliega en su lugar. Las otras dos eran A (la salida completa con las líneas clave resaltadas) y C (un comando más corto, `+noall +answer`). La de `nc` y la de traceroute no se pliegan. La tarjeta (D-4 = A) ya estaba decidida | 12, 18 |
| V12 | El paquete con puerto (D-9) | El catálogo de paquetes | **B,** no la recomendación del plan (A). Una forma propia para TCP y otra para UDP, cada una llena (el pedido) y en anillo (la respuesta); ICMP conserva las suyas. El protocolo y los puertos siguen en la etiqueta y en la caja. Costo aceptado: cuatro entidades más en el catálogo, que `ENTITY_TERMS` nombra con `tcp` o `udp`, y la captura de piezas regrabada | 21 |
| V13 | La traducción del NAT a la vista | El paquete y la caja de inspección | **A.** La etiqueta del paquete cambia al cruzar `router-oficina`: «TCP 51514 → 80» antes, «TCP 40001 → 80» después. La caja muestra los dos encabezados | 16, 21 |
| V14 | Los servidores de nombres en el mapa (D-10) | La pieza de dispositivo, variante `internet-server` | **A.** Piezas del mapa | 21 |
| V15 | Las entradas de la etiqueta | El botón de la etiqueta y `Tabs` | **B.** Un solo botón por pieza en su etiqueta, que abre una tarjeta con `Tabs`, una pestaña por cada tarjeta de la pieza; una pieza con una sola tarjeta no lleva pestañas. Razones del estudiante: escala a los capítulos siguientes sin que las etiquetas del mapa crezcan, y la consola de AWS usa el mismo patrón. Al abrirse, la pestaña inicial es la que pide la tarea del incidente | 14, 19 |
| V16 | Dónde van las fichas «Esperar» (D-11) | `Card` y `Choice` | **C.** Un reloj del juego aparte: una tarjeta «Reloj del juego» en el panel del incidente, bajo la de Lucía, con las fichas «Esperar 1 min» y «Esperar 5 min». No vive en la terminal ni en la tarjeta de la caché: el tiempo es del juego y no de una pieza. Solo aparece en los incidentes con reloj | 15, 19 |
| V17 | Cómo se dice el rechazo de una entrada (el CNAME) | `Card` y el texto de apoyo | **A.** Una línea bajo la tabla. Además, el estudiante pidió estandarizar los avisos y los errores de todo el juego: Tarea 18 bis | 18 bis, 19 |
| V18 | El estándar de avisos y errores: la primitiva, el aspecto y el color de `success` | `Message` (primitiva nueva) | **A.** La primitiva `Message`, con cuatro variantes: `note`, `success`, `warning` y `error`. Aspecto: la alternativa **3, «Pestaña»** (sección V18, bloque «A · Otras formas»): texto enmarcado con una pestaña de carpeta arriba que dice «NOTA», «✓ CORRECTO», «! AVISO» o «✕ ERROR»; sin franja izquierda, que el estudiante rechazó por parecerse a lo que genera una IA. Color de `success`: **verde**, apagado, como la tinta de un sello (`--palette-green`, rol `--color-success`; contraste 5.83 en claro y 6.67 en oscuro sobre la superficie, y 5.83 y 7.54 el texto de relleno sobre el verde). Cada variante se distingue por su palabra y su marca, no solo por el color (verde y rojo casi no se separan con deuteranopía). La mudanza de `src/design/primitives/` por familias, aprobada | 17, 18 bis, 19 |
| V19 | La forma del intruso TCP del 02-05, y la de todo intruso | El catálogo de paquetes | **B,** no la recomendación del orquestador (A: conservar el rombo). Una regla para todo paquete: la forma dice el protocolo y un borde rojo de intruso dice el papel. El intruso TCP del 02-05 es el cuadrado de TCP con el borde de intruso. En los capítulos 1 y 4 el rombo desaparece: el intruso de ICMP es la forma del ping con el mismo borde (cambio visible, ver «Cambios visibles»). Referencia: la sección V19, opción B, de la página de prototipos | 21 |
