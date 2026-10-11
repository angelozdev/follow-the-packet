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
3. **Contrato, sesión, vista y sistema de diseño (Tareas 14 a 20, con la 18 bis).** Se amplía el contrato `send`; la sesión lleva el reloj y la secuencia; la vista aprende los puertos, las rutas, la traducción y el DNS; llegan la tarjeta «Salida» (con la salida de `dig` plegable), un solo estándar para los avisos y los errores, las tarjetas de tablas, la tarjeta con pestañas de cada pieza, el reloj del juego y los casos con reparación.
4. **Escena (Tarea 21).** Servidores de nombres, el cliente de internet, el puerto en el paquete y la traducción a la vista. El estudiante eligió una forma propia para TCP y otra para UDP (D-9 B).
5. **La cadena y el contenido (Tareas 22 a 33).** La Tarea 22 prepara el desbloqueo y los ayudantes; las 23 a 33 traen los catorce incidentes por bloques, cada bloque con la revisión de sus textos por un revisor `sonnet`; la prueba humana es una sola, al final de la Tarea 33.
6. **Cierre (Tareas 34 y 35).** Playwright del capítulo entero y los documentos.

**Tech Stack:** el de hoy (Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, `@radix-ui/react-tabs` 1.1.21, Vitest 5.0.3, Testing Library con user-event, Playwright 1.64, pnpm 11.3.0). **Ninguna dependencia nueva.** Una tabla es HTML; `Table` (D-3 A) no necesita librería.

**Spec:** [`docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md`](../specs/2026-10-11-follow-the-packet-chapter-2-design.md) (los 14, los 53 términos, lo que la simulación enseña, las simplificaciones y las fuentes con fecha). Investigación: [`docs/research/2026-10-10-follow-the-packet-chapter-2-concepts.md`](../research/2026-10-10-follow-the-packet-chapter-2-concepts.md). Del capítulo 1 siguen valiendo su [spec](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) y su [plan](2026-10-10-follow-the-packet-chapter-1-fourteen.md). Donde el código y un plan viejo difieren, manda el código.

## Estado al empezar (2026-10-11)

- **Rama y base.** `feat/chapter-1-fourteen`, HEAD `5fd7c80` (`docs: record chapter 1 in fourteen subchapters`). El capítulo 1 está terminado y no se unió con `main`; el capítulo 2 se implementa encima de este estado. Cambios sin commit del estudiante fuera del juego: `concepts/ami.md` (modificado) y la investigación del capítulo 2 (nueva). Ninguna tarea los toca.
- **Totales al cerrar el capítulo 1** (no se volvieron a medir hoy): Vitest, 1853 tests en 70 archivos; Playwright, 61 tests; `pnpm check` verde. El criterio de cierre de este plan es el mismo: `pnpm check` verde, con los totales que existan entonces.
- **Lo que ya existe y este capítulo usa tal cual.** Reglas de firewall con `tcp` y `udp` y rango de puertos (`ruleWhatSchema`, `matchesWhat`); rutas de router con prefijo más largo (`bestRoute`) y los avisos `net-unreachable` y `host-unreachable`; el resultado `refused`; `NoticeKind`; la etapa `nat` en `StepStage` (la usa la VPC); la mecánica `identify` con bandejas `segmented`; `send.settings` con `setSetting`; la tarjeta de traceroute; `Tabs`; el estilo B; las listas `shown`; `explained-changes.test.ts`.

## Formato de este plan

- **Sin bloques de código y sin ensayo.** Hay identificadores en línea, tablas y prosa. Los contratos nuevos se describen con nombre, tipo y significado; la forma exacta de cada función la decide quien implementa.
- **Sin totales de tests por tarea.** Nadie ensayó el plan, así que no hay números esperados. El criterio de cierre de cada tarea es `pnpm check` verde y que existan los tests nombrados. Los totales reales se miden al cerrar el plan y se anotan en la Tarea 35.
- **Los nombres de tests están en inglés y son exactos.** Cada uno dice qué asierta. Quien implementa puede agregar más; no puede cambiar ni quitar estos.
- **Las fichas de los 14 son ideas, no texto final.** La redacción en español (con tildes y ñ) se escribe al ejecutar cada bloque, en lenguaje llano y con una idea por mensaje, y sin nombrar un término que el jugador aún no conoce.
- **Las definiciones de los 53 términos están en el spec** y son propuestas: la prueba `ladder.test.ts` decide.

## Global Constraints

- **Rutas.** Relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Los comandos se corren desde `projects/follow-the-packet/`.
- **Reglas.** Valen las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Pesan sobre todo:
  - `folder-structure`: tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), barrels, alias `@/` y nada de `../`. **Hoy están en 12:** `src/ui/`, `src/game/view/cards/`, `src/engine/simulation/` y `tests/e2e/`. **En 11:** `src/engine/network/`, `src/copy/`, `src/scene/`, `src/scene/entities/` y `src/ui/incident/`. **En 10:** `src/design/primitives/` (antes de su mudanza), `src/game/`, `src/game/view/` y `src/levels/`. La Tarea 1 hace sitio en las cuatro primeras. `src/design/primitives/` llegaba a 12 con `Table` (D-3 A); el estudiante aprobó el 2026-10-11 la mudanza por familias: `card` y `tabs`, con sus tests, pasan a `src/design/primitives/panels/` (con su `CLAUDE.md`) en un commit propio, `refactor(design): split the primitives by family to make room`, que va antes del de la Tarea 17 y es su primer paso; `Table` nace ya en `panels/`. Después, `src/design/primitives/` queda en 6 archivos y `panels/` en 6 (`card`, `tabs` y `table` con sus tests); con `Message` (Tarea 18 bis), `src/design/primitives/` queda en 8. Tras la Tarea 19 quedan en 12 de 12 `src/game/view/cards/` y `src/ui/incident/`: ninguna tarea posterior suma un archivo plano a esas dos carpetas (ver «Lo que el 04 pide al código», en la Tarea 26).
  - `pure-domain-core` y `view-renders-domain-result`: el motor devuelve datos y códigos, sin reloj ni azar; ninguna vista recalcula un resultado. El estado entra al motor como entrada explícita (decidida 5), nunca como lectura escondida.
  - `english-only` y `no-comments`: código, tests, guías y commits en inglés; solo JSDoc. El texto visible va en `src/copy/` y en los archivos de incidente.
  - `rigorous-plain-copy`: nombre oficial, cada término definido donde aparece, frases cortas.
  - `explained-behavior-changes`: cada incidente y cada caso del 14 que cambia el mundo nombra el dispositivo, router o servidor cuya configuración cambió. La Tarea 3 amplía el test a los servidores.
  - `dry` con `jscpd` en umbral 0 (`minLines` 5, `minTokens` 50): los incidentes de un bloque comparten constructores en su `shared.ts`. `pnpm dup` corre en cada tarea.
  - Un estándar por elemento (`DESIGN.md`): toda interfaz nueva reutiliza `Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, `Tabs` y la leyenda. Una apariencia nueva es una variante de su primitiva; una primitiva nueva se justifica por escrito: `Table` en D-3 y la de avisos y errores en la Tarea 18 bis.
- **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE» (estudiante, 2026-10-10). Ninguna opción, recomendada o no, enseña algo inexacto aunque sea más simple: ni un texto, ni una opción de pregunta, ni una ficha, ni una decisión de diseño. Una opción inexacta se marca como tal. Lo que no se pudo verificar se dice o no se afirma (spec, «Sin verificar»).
- **Dependencias.** Ninguna nueva. `package.json` y `pnpm-lock.yaml` no cambian en ninguna tarea.
- **Los capítulos 1 y 4 no cambian lo que calculan ni lo que muestran, salvo lo que este plan lista.**
  - `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibidos `vitest -u`, `--update` y editarlo a mano. Cada tarea de motor lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Si una tarea lo rompe, la tarea se detiene y se le pregunta al estudiante (D-1); no se regenera por cuenta propia.
  - Las pruebas del capítulo 1 y del 4 corren sin editarse en cada tarea. Las únicas que cambian a propósito: la del texto de `host-udp-no-service` (`reasons.test.ts`, Tarea 7), las que leen `listeningTcpPorts` (cambio mecánico, Tarea 6), las que citan el campo «Conexión» (D-8 = A, Tarea 16) y la aserción del caso `host-refused` de `reasons.test.ts` (Tarea 16). Cada una se lista en su tarea. Por decisiones del estudiante del 2026-10-11 cambian además, a propósito:
    - **V15 = B (Tarea 19).** Las que leen el segundo botón de la etiqueta, que solo existe en el 01-07. En `pieces.test.ts`: `a laptop that sends and has settings opens its terminal and its settings card, each from its own entry` y `a send incident with no settings gives no piece a settings entry`. En `piece-label.test.tsx`: `a piece with a settings entry has a second button beside its label that activates the entry and not the piece` e `inspects the piece from its own button and not from the settings entry`. En `terminal-card.test.ts`: `opens from the piece of the device and not from its settings entry`. Todas las de `settings-card.test.ts` (abren la tarjeta con `PIECE_ID.settings`) y la constante `ENTRY` de `settings-card.test.tsx`. En `incident-screen.test.tsx`: `the laptop opens its terminal from its piece and its settings card from its own entry, and the terminal offers no setting` y `setting the gateway on the card makes the ping come back and clears the stamps of before, and Esc gives the focus back to the entry`. En `chapter-1.test.ts`: `01-07: the gateway is set from the Ajustes de red card of the laptop, and its terminal offers no setting`. En Playwright: `SETTINGS_BUTTON` y `fixTheGateway` de `tests/e2e/chapter-1/chapter-1-play.ts`, `in 07 picking the gateway in the Ajustes de red card changes the stamps of the ping` (`chapter-1.spec.ts`) e `in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps` (`card-layout.spec.ts`). Lo que prueban se conserva: cambia por dónde se llega a la tarjeta.
    - **Tarea 18 bis.** Las dos aserciones de `identify-card.test.tsx` (`writes the line of a right chip as a note and the line of a wrong chip as an error`, que pasa a llamarse `writes the line of a right chip as a success message and the line of a wrong chip as an error`) que leen las clases `feedback` y `feedback--wrong`; leerán la variante del estándar (`success` para una ficha correcta, `error` para una incorrecta). Las que leen los roles `status` y `alert` no cambian.
    - **V12 = B (Tarea 21).** En `src/copy/terms.test.ts`: `no term of chapter 2 names an entity of the map or has a short form` (con la excepción declarada de `tcp` y `udp`) y `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded` (la lista de variantes suma las cuatro); y `a warning is never an intruder: only the messages a sender sends are listed as an intruder too`, que se amplía porque las cuatro entidades nuevas de TCP y UDP llevan copia de intruso (V19 = B, Tarea 21).
    - **V19 = B (Tarea 21).** El intruso deja de ser un rombo en los capítulos 1 y 4: es la forma de su protocolo con el borde de intruso. La Tarea 21 lista los archivos y las pruebas que se vuelven a correr; la única que se reescribe a propósito es la de `terms.test.ts` de arriba.
    - **D-8 = A (Tarea 16).** Las cuatro pruebas de `src/game/view/inspection.test.ts` que citan el campo «Conexión»: `a device of an office shows no public IP whatever the player knows, because how a packet leaves the office is a black box`, `a laptop of the office says what a device is, and shows its IP and its firewall`, `a laptop with no cable keeps its IP and says it is not part of the network, and the rest of the office says it is connected` y `shows the connection of a device only in an office and once the term network is known`. La constante `INSPECTION_TEXT.connection` (`src/copy/screens/incident-ui.ts`) pasa de «Conexión» a «En la red». Las pruebas de `chapter-1.test.ts` que leen las líneas «Conectado a la red.» y «No está conectado: no forma parte de la red.» (`01-01: marking a connected laptop as outside leaves the task open and the box says it has an IP` y `01-01: the box of laptop-visita keeps its IP and says it is not connected, and marking it Yes says so`) leen el valor del campo y no su nombre: no cambian. Ninguna prueba de Playwright cita el campo.
    - **`host-refused` (Tarea 16).** En `src/copy/reasons.test.ts`, el caso `host-refused` de la tabla `CASES` (hoy cerca de la línea 44), que corre `describes %o` con todos los términos conocidos y fija el texto crudo «Llega, pero ningún programa escucha en el puerto 80: [[servidor2]] lo rechaza.». Solo cambia esa aserción: el texto llano que lee el jugador no cambia y aparecen las marcas de términos. Decidido el 2026-10-11 por la sesión principal (y el estudiante aprobó seguir las recomendaciones técnicas que no cambian lo que se aprende). La Tarea 6 no lo tocó: la lista de archivos de esa tarea lo traía por error y pasa a la Tarea 16.
  - **Ninguna etapa nueva escribe un paso en una traza del capítulo 1 ni del 4.** Los datos nuevos de esas trazas van en campos aparte. Hay pruebas de steps con `toEqual` en `simulate.test.ts`; un paso nuevo las rompería. Si una prueba existente falla por un campo nuevo de la traza, la tarea se detiene y se le pregunta al estudiante: no se edita la prueba por cuenta propia.
- **Capturas.** Las dos capturas de `#/entidades` (`tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png`) cambian solo en cuatro tareas, a propósito y revisando el diff: la 17 (suma el especimen de `Table` a la de la interfaz), la 18 (suma el de la tarjeta «Salida», plegada, a la de la interfaz), la 18 bis (regraba la de la interfaz, con el aspecto «Pestaña» de V18: los especímenes de avisos y errores pasan a la primitiva y se suma uno por variante) y la 21 (suma a la de piezas los cuatro especímenes de paquete de TCP y UDP, V12 = B, el del contorno del bloque del 02-04, D-6, y los del intruso con el borde nuevo, V19 = B, que se ven en los capítulos 1, 2 y 4). Si en la Tarea 21 esos especímenes no caben en celdas libres del catálogo y este gana una fila, la sección de la interfaz baja y la 21 regraba también la de la interfaz, comprobando que el diff sea solo ese desplazamiento (`DESIGN.md`, «Adding a variant instead of a new element», paso 3). Ninguna otra tarea las toca.
- **Fuentes y fechas.** Toda cifra, límite o texto de una herramienta que el juego muestre lleva su fuente y su fecha en el test que lo fija o en la guía de la carpeta. Lo del spec se consultó el 2026-10-10 y el 2026-10-11.
- **"Listo"** = `pnpm check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea cierra con eso; lo que su sección llama «Cierre» es lo que se suma. Si Playwright no encuentra Chromium: `pnpm exec playwright install chromium`.
- **Commits.** Uno por tarea, cuando el estudiante lo aprueba (regla del repo), con `git add` de las rutas que la tarea lista, nunca `git add .`. El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (segundo `-m`). **Nunca se agrega nada de `labs/`.** Sin `git push`.
- **Servidores y procesos.** No se arranca nada en los puertos 5173 y 5180 (los del estudiante): son intocables. Playwright levanta el suyo en el 4183 con su configuración. Si una tarea deja un proceso, se mata solo ese PID; **prohibido matar procesos por patrón** (`pkill`, `killall`). Para la prueba humana el estudiante usa su propio servidor.
- **Ejecución.** La sesión principal orquesta y cada tarea la hace un subagente con `model` explícito: `sonnet` para explorar, implementar, revisar e investigar en la web, y `haiku` solo para correr un comando y contar su salida; nunca `opus`. Cada subagente recibe solo lo que necesita (el plan, las rutas y la tarea), no la historia. La ejecución ligera es la de siempre: un implementador por tarea, gobernado por los comandos de verificación de la propia tarea, y, para los textos, un revisor `sonnet` por bloque que los lee antes de pasar al siguiente (D-15 = B, 2026-10-11: no hay prueba humana entre bloques): lenguaje llano, escalera de términos, rigor y la causa de cada cambio de comportamiento. Al cerrar un bloque se sugiere `/clear`.
- **Antes de empezar cualquier tarea de contenido** se confirma que la anterior dejó `pnpm check` verde y que el revisor de los textos del bloque anterior terminó y sus correcciones se aplicaron. La prueba humana no se espera entre bloques: es una sola, al final de la Tarea 33.
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

Cada una tiene una razón técnica y una sola respuesta razonable; si el estudiante no está de acuerdo, se cambia la tarea que la aplica.

1. **El 02-01 parte del mundo del 01-14.** Hoy `worldBeforeChanges` (`src/levels/world.ts`) lanza un error para un incidente con `changes` y sin incidente previo en su capítulo. Cambia así: un incidente con `changes` y sin previo en su capítulo parte de la solución del último incidente del capítulo anterior, en el orden del juego. Con eso, `explained-changes.test.ts` cubre también el salto del 01-14 al 02-01 sin código nuevo, y la continuidad del mundo la fuerza el dato y no una copia. Descartado: un `base` literal compuesto con las constantes del capítulo 1, que duplicaría el mundo y podría divergir sin avisar. Tarea 3.
2. **`changedNames` se amplía en dos cosas.** (a) Mira también a los servidores de internet (actores `server`: servicios y DNS), no solo a dispositivos y routers; sin eso, que el sitio de `servidor-internet` o un registro del autoritativo cambie no exigiría nombrarlo. (b) Una interfaz de router que mira a una pieza que la misma acción agrega no cuenta como cambio de configuración: es el cableado de la pieza nueva y no altera nada de lo que ya pasaba. Cualquier otro cambio de interfaces, rutas o avisos sí cuenta. Razón de (b): agregar un servidor de nombres detrás de `router-destino` obligaría a nombrar un router que el mapa no dibuja. Relaja la regla un poco; _para revisar_. Tarea 3.
3. **El NAT existe siempre en el borde de la oficina; se deriva de la topología; el 08 lo muestra.** El router que da a una LAN y tiene una interfaz con IP no privada hacia afuera (`router-oficina`, `203.0.113.10`, la IP que el capítulo 1 ya declara como `officeUplink`) traduce el origen de todo paquete de un dispositivo de la oficina cuyo siguiente salto sale por esa interfaz. El enlace privado a la otra oficina no traduce (su interfaz es privada). No hay campo nuevo en `Network` ni acción «ahora hay NAT»: el capítulo 1 mostró un ping de `192.168.1.10` llegando a `198.51.100.50`, y un mundo que enciende el NAT en el 08 habría mostrado tráfico imposible. La traducción entra en la traza como un campo aparte, `Trace.translation`, ausente en la VPC y en todo paquete que no sale por esa interfaz; **no escribe pasos ni motivos**, así que `the trip out of the office has no step and no reason that names NAT or the public IP` y las pruebas de `steps` con `toEqual` del capítulo 1 siguen sin editarse. La vista lo muestra cuando `nat` es un término conocido (08). Es una regla del modelo, _para revisar_.
4. **Los números del NAT.** Puertos públicos desde el 40001, en el orden de la secuencia; mapeo independiente del destino (el mismo `IP:puerto` privado usa la misma fila hacia cualquier servidor; RFC 5382 REQ-1 y RFC 4787 REQ-1); sin conservar el puerto de origen (el ejemplo del RFC 3022 también lo cambia); sin tiempo de vida de las filas; el ping no deja fila visible (ICMP no tiene puertos y el identificador es lo que traducen los NAT reales; spec). La tabla muestra solo los envíos desde el último cambio de mundo.
5. **El estado entra al motor como entrada, no como lectura.** `simulate(net, packet)` sigue siendo la función pura y sin estado de hoy, la que usan el capítulo 1 y el 4. Una función nueva, `simulateSequence(net, sends)`, recibe una lista ordenada de `{ packet, at }` (`at` = segundos del juego) y devuelve una traza por paquete, llevando de uno al siguiente la tabla del NAT, el puerto efímero de cada dispositivo y la caché del resolver. Es determinista: los mismos envíos dan las mismas trazas. La sesión guarda los envíos y el reloj (`Session.clock`, que solo avanza con `wait`). **Reinicio:** un movimiento que cambia el mundo (colocar o quitar una entrada de una tabla, un ajuste) limpia los envíos, como hoy `setSetting`, y con ellos la tabla y la caché que se derivan; el reloj no vuelve atrás y la caché inicial del mundo (decidida 24) se mide contra él. Para revisar.
6. **El puerto de origen.** La primera conexión TCP o consulta UDP de cada dispositivo en la secuencia sale del 51514 y cada una nueva del mismo dispositivo sube de a uno (el puerto efímero cambia en cada intercambio nuevo). `PacketSpec.sourcePort` lo fija a mano y gana. Un `simulate` suelto usa el 51514. El 51514 cae dentro del rango de IANA (49152 a 65535) y del de Linux (32768 a 60999); ningún texto da un rango como cifra (depende del sistema).
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

## Inventario de mecánicas

Lo que el motor y el contrato saben hacer hoy y lo que falta para los catorce. «Mecánicas hoy»: `filter`, `send`, `identify` y `diagnose`, en `src/levels/contract/incident.ts`. Los huecos del motor van primero y antes del contenido.

| # | Mecánica | Hoy | La piden | Lo que falta | Tarea |
|---|----------|-----|----------|--------------|-------|
| 1 | Puerto de origen en el paquete | `PacketSpec` solo tiene `port`, el de destino | 02, 08, 09, 10 | `sourcePort` opcional; la secuencia lo asigna (decidida 6) | 4, 5 |
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
| 12 | Tabla de traducciones | No existe | 08, 09 | Filas desde la secuencia, con números del juego (decidida 4) | 10 |
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
| 30 | Escena | Sin servidores de nombres, sin cliente de internet, sin puerto en el paquete, sin traducción | 08 a 14 | Piezas, etiquetas y especímenes (D-9 B, D-10): cuatro entidades de paquete (TCP y UDP, pedido y respuesta) y la etiqueta que cambia al cruzar el router (V13 = A) | 21 |
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
| `NoticeKind` | gana `'port-unreachable'` | El aviso de un puerto UDP sin servicio |
| Códigos de motivo nuevos | `host-wrong-address`, `host-udp-closed` (reemplaza a `host-udp-no-service`), `nat-no-translation`, `nat-forwarded`, `dns-answered`, `dns-cached`, `dns-hosts-file`, `dns-nxdomain`, `dns-servfail`, `dns-no-resolver`, `dns-resolver-silent` | Cada uno trae sus datos (ids, IP, puertos, nombres); `src/copy/` los vuelve texto |
| `simulateSequence(net, sends)` | `sends` = lista de `{ packet, at }` | Una traza por envío, llevando la tabla del NAT, el puerto efímero y la caché de uno al siguiente. Determinista (decidida 5) |

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
- **Qué viaja:** `dig www.lucia.example` y `ping www.lucia.example` desde `tu-laptop`.
- **La caja de `dig`:** «Consulta DNS»: UDP, `192.168.1.10:51514 → 198.51.100.8:53`, un mensaje; «Respuesta»: `198.51.100.8:53 → 192.168.1.10:51514`, `www.lucia.example A 198.51.100.50`; «El resolver buscó la respuesta por ti». La tarjeta «Salida» imprime lo que imprime `dig` (D-5), completo y plegado: a la vista el `status` y la respuesta, y el resto detrás de «Ver las N líneas restantes» (V11 = B).
- **Tareas:** (1) que `dig www.lucia.example` vuelva con `198.51.100.50`; (2) que `ping www.lucia.example` vuelva.
- **Pregunta:** «¿Por qué `dig` no hizo el saludo de tres pasos antes de preguntar?» Correcta (2.ª): usa UDP, que manda cada mensaje suelto, sin abrir una conexión. Incorrectas: «Porque DNS no usa puertos» (la consulta va al puerto 53); «Porque el resolver ya tenía una conexión abierta contigo» (UDP no tiene conexión).
- **Pistas:** (1) compara la caja de este `dig` con la de un `nc` del 02. (2) mira cuántos mensajes hay antes de la respuesta.
- **Rigor:** la consulta «suele» ir por UDP; el servidor también escucha en TCP (RFC 7766 §5) y ninguna consulta del juego lo usa; los nombres de `lucia.example` son ficticios y no existen en el DNS real: `.example` no está delegado en la zona raíz (D-13, verificado el 2026-10-11); DHCP es solo una línea de la tarjeta, sin incidente propio.

**02-11 · Los registros** · `send` con la tarjeta «Registros de lucia.example» (editable) · términos: servidor autoritativo, registro DNS, registro A, registro CNAME.
- **Mundo:** `setDns` de `servidor-autoritativo`: `www.lucia.example` A `198.51.100.51` (alguien lo cambió a una IP que nadie tiene) y `blog.lucia.example` A `198.51.100.51`. El report nombra a `servidor-autoritativo`. Dibuja `tu-laptop`, `servidor-dns`, `servidor-autoritativo` y `servidor-internet`.
- **Qué viaja:** `nc` al puerto 80 por nombre y `dig` al alias.
- **Fichas:** dirección: `www.lucia.example` y `blog.lucia.example`; mensajes: «nc · puerto 80» y `dig`. Tarjeta de registros: Nombre: `www.lucia.example`, `blog.lucia.example`, `lucia.example`; Tipo: `A` y `CNAME`; Valor: `198.51.100.50`, `198.51.100.51` y `www.lucia.example`.
- **Tareas:** (1) que el `nc` a `www.lucia.example`, puerto 80, vuelva (corregir el registro A); (2) que `dig blog.lucia.example` vuelva con `198.51.100.50` por un alias (`answer.alias`).
- **Fallo y causa:** crear el CNAME de `blog.lucia.example` mientras tiene su A, o un CNAME en `lucia.example`, lo rechaza la regla del CNAME y la tarjeta dice por qué: un nombre con un CNAME no puede tener otros registros; la zona ya tiene sus propios registros en `lucia.example`. Antes de corregir, el `nc` por nombre recibe Destination Host Unreachable de un router de afuera, que el mapa no dibuja y el texto no nombra.
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
- **Mundo:** el del 13 más los cambios de cada caso (cada caso es un cambio sobre ese mundo y no sobre el del caso anterior); cada caso dibuja solo las piezas que usa (`shown` por caso). El report del 14 dice una vez qué cambió antes de empezar, si algo cambia.
- **Qué viaja:** lo que el jugador elija; el primer caso muestra además la secuencia de tres pruebas en orden: ¿resuelve el nombre (`dig`)?, ¿hay ruta (`ping`)?, ¿contesta el puerto (`nc`)?
- **Éxito:** nombrar la causa de cada caso; en el 5, también arreglar el bucle con la tarjeta de rutas de `router-proveedor` (quitar la ruta `0.0.0.0/0` hacia `router-oficina` y poner `198.51.100.0/24` hacia `router-destino`) hasta que el ping al servidor vuelva. En ese caso se dibuja `router-destino`, porque los chips de la reparación lo nombran. Pistas y reporte por caso.

| Caso | Reporte y origen | Qué enseña la evidencia | Causa | Opciones incorrectas (error que reflejan) |
|------|------------------|--------------------------|-------|-------------------------------------------|
| 1, guiado | «Tu `nc` a `www.lucia.example`, puerto 80, no conecta»; origen `tu-laptop`; el sitio de `servidor-internet` escucha ahora solo en `127.0.0.1` | La prueba 1 resuelve, la 2 vuelve, la 3 es rechazada (RST) | El servicio escucha solo en `127.0.0.1` | «El nombre no resuelve» (la prueba 1 volvió); «Un firewall descarta el paquete» (un firewall callaría; aquí llegó un RST) |
| 2 | «Tu `nc` a `wwww.lucia.example`, puerto 80, no conecta»; origen `tu-laptop` | NXDOMAIN; nada salió hacia el servidor | El nombre está mal escrito y no existe | «El servidor no contesta en el puerto 80» (nunca llegó a resolver); «`router-oficina` perdió una ruta» (el paquete no llegó a salir) |
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
- **Las capturas de `#/entidades` cambian** en las Tareas 17, 18, 18 bis y 21 (el especimen de `Table`, el de la tarjeta «Salida», los de avisos y errores, los de los paquetes de TCP y UDP, los del intruso y el contorno del bloque), no por algo más del capítulo 4.
- **Las etiquetas del capítulo 4 no cambian por V15 = B.** Ninguna tiene hoy un segundo botón: solo un incidente `send` ofrece ajustes (`settingsDeviceIds` queda vacía para cualquier otra mecánica) y el 04-01 y el 04-02 son `filter`. Cada pieza del capítulo 4 abre una sola tarjeta (la del firewall, con sus pestañas «Entrada» y «Salida» de siempre), así que no lleva pestañas nuevas.
- **Con el estándar de avisos y errores (V18 = A, aspecto «Pestaña»), cuatro mensajes del 04-01 y el 04-02 cambian de apariencia, no de texto, de rol ni de comportamiento:** el aviso de intruso de Lucía («¡Algo raro está entrando!»; hoy, texto en negrita en el color de peligro y sin marco), su respuesta a una solución rechazada («Todavía no se cumple: …» y «Además, algo prohibido está entrando.»; hoy, un marco punteado en el color de peligro) y la retroalimentación de la pregunta de Lucía, que es `error` si la opción es incorrecta («No es eso.» …; hoy, la línea `feedback--wrong`) y `success`, en verde, si es la correcta («Correcto.»; hoy, la línea `feedback`). Cada uno lleva su pestaña («✕ ERROR», «✓ CORRECTO»). Los avisos de la red (el paquete de aviso, el sello «!» y las frases de la caja de inspección) no cambian.
- **El paquete de un intruso cambia de forma (V19 = B).** El atacante del 04-01 y el 04-02 era un rombo rojo; pasa a ser la forma del ping (el punto o el anillo, según sea pedido o respuesta) con el borde rojo de intruso. Es la regla de todo paquete: la forma dice el protocolo y el borde dice el papel. Cambian el mapa, el catálogo y el ícono de la caja de inspección; no cambian el texto ni el comportamiento. Se regraba la captura de piezas de `#/entidades` en la Tarea 21 (y la de la interfaz solo si el catálogo gana una fila: `DESIGN.md`, «Adding a variant instead of a new element», paso 3).
- **El campo «Conexión» no se ve cambiar en el capítulo 4.** D-8 lo renombra «En la red» en las cajas de oficina (capítulos 1 y 2), pero la caja de un dispositivo de una VPC no tiene ese campo (`src/game/view/CLAUDE.md`; prueba `shows the connection of a device only in an office and once the term network is known`).
- **Sin cambios de comportamiento:** el código de `04-iaas/shared.ts` cambia mecánicamente (`listeningTcpPorts` pasa a `services`), el test dorado no se edita y la batería de sondas no se toca.

**Cambio visible del capítulo 1 (D-8 = A, decidida el 2026-10-11):** el campo «Conexión» de la caja de un dispositivo de oficina se llama «En la red», en todo incidente de oficina de los capítulos 1 y 2. No cambia nada más (el valor del campo, «Conectado a la red.» o «No está conectado: no forma parte de la red.», es el mismo). Las pruebas que cambian están en «Global Constraints».

**Cambios visibles del capítulo 1 por las decisiones del 2026-10-11:**
- **V15 = B, solo en el 01-07.** Hoy la etiqueta de `tu-laptop` tiene dos botones: «tu-laptop», que abre «Terminal de tu-laptop», y debajo «Ajustes de red de tu-laptop» (`SETTINGS_TEXT.entry`, con el id de DOM `piece-settings-your-laptop`), que abre la tarjeta con ese título. Pasa a tener un solo botón, «tu-laptop», que abre una tarjeta con dos pestañas: «Terminal», que abre primero (como hoy, el jugador manda ahí el ping) y «Ajustes de red», el nombre que el reporte y las pistas del 01-07 ya usan y que no cambian. El título de la tarjeta abierta sigue siendo el de la pestaña elegida («Terminal de tu-laptop» o «Ajustes de red de tu-laptop»). El segundo botón desaparece. En los demás incidentes del capítulo 1 cada pieza tiene un solo botón y una sola tarjeta (terminal, firewall o ficha de identificación): no lleva pestañas y no cambia.
- **Estándar de avisos y errores (V18 = A, aspecto «Pestaña»).** El aviso de intruso, la respuesta de Lucía a una solución rechazada y la retroalimentación de una ficha o de una opción (01-01 y los incidentes con firewall y con pregunta) cambian de apariencia, no de texto, de rol ni de comportamiento: la incorrecta es `error` («✕ ERROR»), la correcta es `success`, en verde («✓ CORRECTO»).
- **El paquete de un intruso (V19 = B).** En los incidentes con un flujo prohibido del capítulo 1, el rombo rojo del intruso desaparece: el paquete es la forma del ping (el punto o el anillo) con el borde rojo de intruso. Cambian el mapa, el catálogo y el ícono de la caja; no cambian el texto ni el comportamiento. La Tarea 21 regraba la captura de piezas por esta razón. La Tarea 18 bis los lista y su captura los muestra.

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
14. **Un mapa con más piezas no se amontona.** Tests de Playwright (Tarea 34): `in 02-07 the map and its labels fit the area at full size`, `in 02-09 and 02-10 no label or stamp overlaps` y `the cards of tables, output and services cover no piece of the map`, a 1280×800 y a 1440×900.
15. **Las capturas cambian solo lo que se quiso** (Tareas 17, 18, 18 bis y 21): el diff muestra solo los especímenes nuevos o rehechos; `entities` de Playwright pasa después.
16. **Carpetas y primitivas.** `pnpm structure` pasa en cada tarea; el tope de 12 no se rompe; las únicas primitivas nuevas son `Table` y la de avisos y errores (Tarea 18 bis), y no nace ningún hermano (`DESIGN.md`).
17. **Los casos del 14 se cuentan bien.** Tests: `the middle star is no hint asked in any case`, `the explained star needs every cause right at the first try`, `02-14: each case starts from the world before the incident plus its own changes, not from the case before` (Tarea 33) y `the case closes only when the cause is named and the tasks of its fix hold` (Tarea 20).
18. **Rigor, sin simplificar a lo falso.** Ninguna opción, recomendada o no, enseña algo inexacto. Tests: `02-05: every port range chip that opens more than 22 is caught by the probe battery`, `the text of an unsolicited packet says it is not delivered and never that NAT blocks it`, `the glossary says a port goes from 1 to 65535`, `the well-known ports go from 0 to 1023 and the definition names neither 3306 nor 5432`, `the default port lists 22, 80, 443, 3306 and 5432 and says it is a custom`, `no text gives a range of ephemeral ports as a number` y la lectura del estudiante en cada prueba humana.
19. **Ejemplos de documentación.** Test: `every public address of chapter 2 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
20. **Texto llano.** La comprobación es el revisor de cada bloque (`sonnet`, antes de pasar al siguiente) y la prueba humana del capítulo entero, una sola: el estudiante juega los catorce y dice si algún mensaje lo pierde.
21. **Un solo estándar para los avisos y los errores.** Tests: `every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it`, `each variant of Message is told apart by a mark or a border shape and not only by colour` `success and error differ by their word and mark, not only by colour` y `takes no className and no style` (Tarea 18 bis); `a rejected entry shows its problem as an error message under the table, in a status region that was already there` (Tarea 19). La guarda es de DOM renderizado y no de CSS ni de lint (`DESIGN.md`, «What guards the standard»).
22. **Una pieza, un botón, una tarjeta con pestañas.** Tests: `a label draws one button however many cards its piece has` (el 01-07 incluido), `a piece with one card opens it with no tabs` y `switching tabs keeps what was picked in the terminal and the lines unfolded in its output` (Tarea 19).
23. **Una regla para todo paquete (V19).** La forma dice el protocolo y un borde rojo de intruso dice el papel. Tests: `every protocol has an intruder version with the intruder border`, `no packet is drawn as a rhombus` y `the packet of an intruder has the shape of its protocol and the intruder border` (Tarea 21).
24. **El 04 sin que viaje nada se dibuja y se contesta (D-6).** Tests: los de la tarjeta de clasificar y del contorno, repartidos en las Tareas 14, 15, 19, 21 y 26 (lista en la Tarea 26, «Lo que el 04 pide al código»).

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
  - `dns/` (nueva): `records.ts`, `resolve.ts`, `cache.ts`, `hosts.ts` y sus tests
  - `simulation/`: `simulate.ts`, `sequence.ts` (nuevo), `trace.ts`, `context.ts`, `ports.test.ts` y `routing-table.test.ts` (nuevos); `paths/` (nueva: `routers.ts`, `traceroute.ts`, `checkpoints.ts` y sus tests, mudados); `stages/`: `host.ts`, `route.ts`, `forward.ts`, `dns.ts`, `reply.ts` y `nat.ts` (nuevo); `CLAUDE.md`
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
  - `view/`: `pieces.ts`, `piece-id.ts`, `inspection.ts` y sus tests
  - `view/cards/`: `settings-card.ts` (ahora también servicios y DNS), `table-card.ts` y `piece-card.ts` (nuevos: la tarjeta de una pieza con sus pestañas) y sus tests; `terminal/` (nueva: `terminal-card.ts`, `traceroute-lines.ts` y `output-card.ts`, con sus tests); `identify/` (nueva: `classify-card.ts` y su prueba, D-6); `CLAUDE.md`
- `src/scene/`: `layout.ts`, `game-scene.tsx`; `entities/` (`device.tsx`, `packet.tsx` —sin rombo, con el borde del intruso—, `entity-icon.tsx`); el contorno del bloque (D-6); `overlay/piece-label.tsx` (sin segundo botón); `traffic/flow-look.ts`; `catalog/catalog-cells.tsx`
- `src/ui/incident/`: `inspection-box.tsx`, `clock-card.tsx` (nuevo: «Reloj del juego»), `lucia-card.tsx` y `explanation-card.tsx` (usan el estándar de avisos); `map-cards/`: `table-card.tsx` y `piece-card.tsx` (nuevos), `settings-card.tsx`, `identify-card.tsx`, `identify/` (nueva: `classify-card.tsx` y su prueba, D-6); `terminal/` (nueva: `terminal-card.tsx` mudada, `output-card.tsx` nuevo, con sus tests)
- `src/ui/catalog/interface-section.tsx` (los especímenes de `Table`, de «Salida» y de avisos y errores)
- `src/ui/notice-page.tsx` y `src/styles.css` (los avisos y errores pasan a la primitiva: salen `.feedback`, `.feedback--wrong`, `.lucia__alert` y la regla `.lucia__reply p`)
- `src/testing/`: `fixtures.ts`, `incidents.ts`
- `tests/e2e/`: `chapter-1/` (nueva: `chapter-1.spec.ts` y `chapter-1-play.ts`, mudados), `chapter-2/` (nueva: `chapter-2.spec.ts` y `chapter-2-play.ts`), `saved-progress.ts`, `entities.spec.ts`, `card-layout.spec.ts` (si hace falta), `snapshots/` (dos capturas, regrabadas en las Tareas 17, 18, 18 bis y 21)

---

## Tareas

Treinta y ocho tareas (0 a 35, más la 2 bis, que va entre la 2 y la 3, y la 18 bis, que va entre la 18 y la 19). Cada una: propósito, archivos, interfaces, tests con nombre, Review Focus, cierre y commit. El orden es el de ejecución. Una tarea de contenido no empieza hasta que la anterior dejó `pnpm check` verde y, al cerrar un bloque, su revisor terminó y sus correcciones se aplicaron.

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

**Interfaces:** `PacketSpec.sourcePort`, opcional, de 1 a 65535; sin él, `simulate` usa 51514 (decidida 6). Para un paquete TCP o UDP de una oficina, `Trace.header.request` y `reply` llevan `sourcePort` y `destinationPort`, invertidos en la vuelta. `Trace.exchange` lista los extremos: TCP aceptado, SYN, SYN-ACK y ACK; TCP rechazado, SYN y RST; TCP sin respuesta, SYN; UDP, `query` y `response`. Ningún campo nuevo aparece en un paquete ICMP ni en una VPC; `describePacket` y el resumen de `tcpdump` no cambian.

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

**Interfaces:** `simulateSequence(net, sends)`, con `sends` una lista ordenada de `{ packet, at }`; devuelve una traza por envío. Asigna el puerto de origen a cada paquete TCP o UDP que no trae uno: el primero de cada dispositivo sale del 51514 y cada uno nuevo del mismo dispositivo suma uno. Deja ganchos para la tabla del NAT (Tarea 10) y la caché del resolver (Tarea 13). `simulate(net, packet)` sigue igual.

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
- Cierre: golden sin cambios; el capítulo 1 sin editar.

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

**Interfaces:** `resolve(net, device, name, mode)` envía la consulta al resolver de `Device.dnsServer` como un datagrama UDP al 53 (con las reglas, rutas y servicios del resto del motor), y el resolver, sin red de por medio, consulta a su `upstreams` (decidida 13). Sigue un CNAME hasta un A. Sin registro: NXDOMAIN, con el SOA de la zona. Autoritativo caído: SERVFAIL. `recordProblem` dice por qué una entrada no se acepta (un CNAME con otros registros). Un dispositivo de una oficina sin `dnsServer` no resuelve. **El SOA de cada zona es un dato.** El apex trae un SOA con los siete campos de RFC 1035 §3.3.13 (MNAME, RNAME, SERIAL, REFRESH, RETRY, EXPIRE, MINIMUM), con valores fijos del juego y cada uno con su fuente; los que no vengan de una fuente se declaran números del juego, como el TTL de 300 segundos (decidida 25). La traza de un NXDOMAIN lleva el SOA de la zona que contestó, con el TTL que RFC 2308 §3 manda para una respuesta negativa: el menor entre el TTL del propio SOA y su campo MINIMUM. El juego no guarda NXDOMAIN en caché (decidida 13), así que ese TTL se entrega entero. Es lo que la Tarea 18 imprime en la `AUTHORITY SECTION` de `dig`. El spec declaraba el SOA entre lo que el juego no modela («Fuera del capítulo»); esa línea se corrigió el 2026-10-11, en la Tarea 0, y ahora dice que el juego modela el SOA de cada zona como dato.

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

**Interfaces:** el resolver guarda cada respuesta con `expiresAt = at + ttl` y la entrega mientras `at` sea menor; la caché inicial de su `dns.cache` se mide contra el mismo reloj. `lookup: system` (ping y `nc`) lee primero el archivo hosts del dispositivo y después pregunta; `lookup: dig` pregunta directo al resolver y no lee hosts. Una consulta a una IP sin servicio UDP 53 recibe Port Unreachable.

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

**Interfaces:** cada campo de la caja declara el término que usa y se deja fuera mientras no se conozca: «Servicios» (`service`; dice «puerto 3000» hasta que `tcp` se conoce y «TCP 3000» después), «Encabezado» con puertos (`port`), «Saludo de tres pasos» (`handshake`), «Ruta que usó» (`route`), «Encabezado (en internet)» y la tabla de traducciones (`nat`), y «DNS» (`dns`). Con `nat` conocido, la nota «Fuera de la oficina el encabezado cambia…» desaparece (decidida 15). Los motivos nuevos se escriben con los términos conocidos; si el término de la causa es desconocido, el texto dice solo lo que el jugador vio. **D-8 = A (decidida el 2026-10-11):** el campo «Conexión» pasa a llamarse «En la red» en todas las cajas de oficina (`INSPECTION_TEXT.connection`); cambian las cuatro pruebas de `inspection.test.ts` que lo citan, listadas en «Global Constraints». **Etiqueta del paquete (V13 = A):** la de un paquete TCP o UDP dice el protocolo y los puertos («TCP 51514 → 80»), y cada parte aparece cuando su término se conoce (`tcp` y `udp`, en el 02-02 y el 02-10); antes dice solo lo que el jugador conoce. Al salir por el router con NAT, la etiqueta pasa al puerto de origen público («TCP 40001 → 80»), tomado de `Trace.translation`; la caja ya da los dos encabezados. La escena lo dibuja en la Tarea 21.

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
- Cierre: los casos del 14 del capítulo 1 sin cambiar de contenido.

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
- Cierre: la captura de la interfaz no cambia, salvo en el caso 2 de arriba, donde cambia solo por el desplazamiento.

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
- Cierre: `pnpm check` verde; golden sin cambios.

**Review Focus:** 3 y 16.

**Commit:** `chore(levels): prepare the chain of chapter 2 and its helpers`.

---

### Contenido: lo que comparten las Tareas 23 a 33

- **Cada incidente** es un archivo `NN-<slug>.ts` en la carpeta de su bloque, con `defineIncident`, `chapter: 2`, `role: 'defender'`, su `introduces` (los términos de su fila del spec), sus `changes` (acciones nombradas en `shared.ts`), su lista `shown` (decidida 28), `report`, `tasks`, `hints`, `question`, `explanation` (tres opciones, una correcta en la posición de la ficha), `solution` y `takeaway`. Cita `LESSON` y `CONCEPT` como el capítulo 1 (el choque con la regla de lecciones es el pendiente I1 del backlog).
- **El texto** lo escribe quien ejecuta, en español llano, con una idea por frase, con los términos conocidos etiquetados (`{{puerto}}` y compañía) y con el nombre de cada dispositivo, router o servidor tomado del registro de `shared.ts` (`DEVICE`, `ROUTER`, `SERVER`, `NAME`), nunca como literal.
- **Cada tarea de contenido** suma sus pruebas a `src/game/chapter-2.test.ts`, extiende `tests/e2e/chapter-2/chapter-2-play.ts` con cómo se juega ese incidente con el ratón (un humo por bloque, no un recorrido completo) y deja pasar los genéricos de `incidents.test.ts` y de la escalera de las vistas (`starts with a task to fix`, `its reference solution fixes every task and earns every star but the explanation`, `only uses terms introduced in it or before`, `names each chip after a term, by its official name`).
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
- Cierre: golden sin cambios.

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
- Cierre: golden sin cambios.

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
- Cierre: golden sin cambios.

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
- Cierre: golden sin cambios; las pruebas de `filter` del capítulo 1 y del 4 sin editar.

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
- Cierre: golden sin cambios; `a private address is dropped by the first router outside the office, with no warning` sin editar.

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
- Cierre: golden sin cambios.

**Review Focus:** 2, 5, 6, 10 y 18.

**Commit:** `feat(levels): add chapter 2 incidents 08 and 09, one address for the whole office and from outside`.

**Revisión de los textos del bloque 4** (08 y 09) por un revisor `sonnet`, antes del bloque 5 (ver «Contenido»).

---

### Tarea 29: Bloque 5 · 10

**Presenta:** nombre de dominio, DNS, consulta DNS, resolver, UDP, dig, DHCP (ficha 02-10). Denso: tarea propia.

**Archivos:**
- Create: `src/levels/02-ports-and-names/names/10-asking-for-a-name.ts` y `names/CLAUDE.md`.
- Modify: `shared.ts` (los servidores de nombres, la zona, `setDnsServer`), `src/game/chapter-2.test.ts`, `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`.

**Tests:**
- `02-10: dig sends one query by udp to port 53 of the resolver and gets one answer`.
- `02-10: the box of the dig has no greeting`.
- `02-10: dig and ping both resolve www.lucia.example to 198.51.100.50`.
- `02-10: the settings card of tu-laptop shows the dns server and says DHCP gave it`.
- `02-10: the report names tu-laptop`.
- `02-10: draws the resolver and not the authoritative server`.
- `02-10: every address of the chapter is in a documentation block and every name is under .example`.
- `02-10: introduces domain name, DNS, DNS query, resolver, UDP, dig and DHCP, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4, 11, 13 y 19.

**Commit:** `feat(levels): add chapter 2 incident 10, asking for a name`.

---

### Tarea 30: Bloque 5 · 11

**Presenta:** servidor autoritativo, registro DNS, registro A, registro CNAME (ficha 02-11).

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
- Cierre: golden sin cambios.

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
- Cierre: golden sin cambios.

**Review Focus:** 3, 6, 11, 12 y 18.

**Commit:** `feat(levels): add chapter 2 incident 12, still the old ip`.

---

### Tarea 32: Bloque 5 · 13

**Presenta:** NXDOMAIN, SERVFAIL, Port Unreachable, archivo hosts (ficha 02-13). Si la prueba humana del capítulo entero lo siente pesado, se parte en «tres fallas» y «la trampa de hosts».

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
- Cierre: golden sin cambios.

**Review Focus:** 3, 6, 7, 11 y 18.

**Commit:** `feat(levels): add chapter 2 incident 13, it does not resolve`.

**Revisión de los textos del bloque 5** (10 a 13) por un revisor `sonnet`, antes del bloque 6 (ver «Contenido»).

---

### Tarea 33: Bloque 6 · 14

**Presenta:** ningún término (ficha 02-14). **Depende de:** D-12.

**Archivos:**
- Create: `src/levels/02-ports-and-names/on-call/14-on-call-it-does-not-connect.ts`, `cases.ts` y `on-call/CLAUDE.md`.
- Modify: `shared.ts` (los cambios de cada caso, `LOOP` y su reparación, las listas `shown` por caso), `src/game/chapter-2.test.ts` (ahora exige los 53 términos), `registry.test.ts`, `tests/e2e/chapter-2/chapter-2-play.ts`, `src/storage/progress.test.ts`.

**Interfaces:** siete casos (tabla de la ficha), cada uno como un cambio sobre el mundo del 13; `cases.ts` usa constructores para que `jscpd` no vea siete casos casi iguales. El caso 5 trae `fix`.

**Tests:**
- `02-14: case 1 shows the three tests in order and the third is refused`.
- `02-14: case 2 ends in NXDOMAIN and nothing leaves the laptop`.
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
- `chapter-2.test.ts`, `introduces exactly the 53 terms of the approved design, each in its incident`.
- `no term of the approved design is missing: the ids of the table of the spec equal the ids that 02-01 to 02-14 introduce`.
- `cidr, dns and nat are introduced by chapter 2 and by no incident of chapter 4`.
- `names no topic of the chapters that come later, in any text of chapter 2`.
- `every public address of chapter 2 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
- Playwright: `04-01 opens once 02-14 has a star`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4, 6, 17 y 19.

**Commit:** `feat(levels): add chapter 2 incident 14, on call`.

**Revisión de los textos del bloque 6** (14) por un revisor `sonnet` (ver «Contenido»).

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
- Modify: `tests/e2e/chapter-2/chapter-2.spec.ts` (nuevo), `chapter-2-play.ts`, `tests/e2e/saved-progress.ts`, `tests/e2e/incidents.spec.ts` (si algún nombre cambió), `tests/e2e/card-layout.spec.ts` (suma las escenas de las tarjetas nuevas), `tests/e2e/map-boxes.ts` y `card-boxes.ts` (si hace falta), `tests/e2e/CLAUDE.md`.

**Tests:**
- `chapter 2 is played from 02-01 to 02-14, each incident opening the next, with 3 stars each`.
- `the roadmap lists the fourteen incidents of chapter 2 with their stars`.
- `04-01 opens after 02-14 has a star`.
- Dentro de «Sin animaciones»: `in 02-07 the map and its labels fit the area at full size`.
- `after the pings of 02-07, no label or stamp overlaps`.
- `in 02-09 and 02-10 no label or stamp overlaps`.
- `the cards of tables, output and services cover no piece of the map`.
- `in 02-12 waiting from the clock card changes the answer of dig`.
- `in 02-03 the services card opens from the label of laptop-lucia and switches the address`.
- `in 02-04 placing a device inside the block draws it inside the outline and moving it out takes it out`.
- `in 02-14 case 5 can be repaired from the routes card`.
- Cada prueba de geometría corre a 1280×800 y a 1440×900, con el mapa a tamaño completo.
- Cierre: `pnpm check` completo.

**Review Focus:** 14.

**Commit:** `test(e2e): play the fourteen incidents of chapter 2`.

---

### Tarea 35: Documentos

**Archivos:**
- Modify: `README.md` (el capítulo 2 es de catorce subcapítulos en seis bloques; enlaza el spec y este plan), `DESIGN.md` (se revisa que refleje `Table`, la tarjeta «Salida» y su plegado, el estándar de avisos y errores, la tarjeta con pestañas de cada pieza y la nueva estructura de carpetas), `../../docs/plans/follow-the-packet-roadmap.md` (la fila del capítulo 2 pasa de `en curso` a `hecho` con los commits, y se suma la prueba humana del capítulo 2 si falta alguna), `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (lo que quedó: D-16 `traceroute -I`, las líneas de `nc` y `dig` que no se pudieron verificar, los subcapítulos que la prueba humana del capítulo entero pidió separar o fusionar, I1), `../../docs/research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 2: temas y «qué viaja y qué configura» de los catorce), `../../docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md` (estado; la línea del SOA ya se corrigió en la Tarea 0), este documento (los totales reales y las decisiones tomadas).
- Antes de cerrar, correr el chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado: debe decir `LINKS OK`.

**Tests:** `chapters.test.ts`, `match the chapter map of the chapters doc, in game order` sigue verde (la tabla no cambia).

**Cierre:** `pnpm check` verde. **Commit:** `docs: record chapter 2 in fourteen subchapters`. Al cerrar el plan se sugiere `/clear`.

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
| Elecciones visuales con prototipos renderizados; Tarea 0 | Tarea 0; «Decisiones visuales» |
| Sintaxis de Linux en la terminal | Tarea 18; D-5 (`ncat` 7.93 y BIND 9.18) |
| El progreso guardado se puede resetear; sin migraciones | Decidida 18 |
| IPs de RFC 5737 y nombres bajo `.example` de RFC 2606 §2, verificados y citados | Spec («El mapa que crece», «Base de investigación»); D-13; Review Focus 19 |
| El 53 se lista con DNS (reformulado con D-18: los cinco puertos son de `default-port`) | Spec («Decisiones del estudiante»); Tareas 2 y 2 bis (`default-port`, `well-known-ports`, `dns`) |
| Huecos del motor primero y antes del contenido | «Inventario de mecánicas»; Tareas 4 a 13 antes de las 14 a 33 |
| Puerto de origen en el paquete | Tareas 4 y 5 |
| Servicios UDP y Port Unreachable | Tareas 6 y 7 |
| Dirección de escucha | Tarea 6; decidida 8 |
| Tablas de rutas en dispositivos y routers, editables, con prefijo más largo | Tareas 8 y 9 |
| Net Unreachable | Tarea 9 |
| NAT con puertos y tabla de traducciones | Tareas 10 y 11; decididas 3 y 4 |
| Modelo de DNS con resolver, autoritativo, A, CNAME, caché con TTL, NXDOMAIN, SERVFAIL y archivo hosts | Tareas 12 y 13 |
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
| Global Constraints: commits solo con las rutas de la tarea y el trailer, nada de `labs/`, sin push, puertos 5180 y 5173 intocables, Playwright en 4183, nada de matar por patrón | «Global Constraints» |
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
