# Sigue el paquete · Capítulo 1 en catorce subcapítulos: motor, contrato y contenido

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Este plan no trae código: cada tarea dice qué contrato, qué archivos y qué tests nombrados; el código lo escribe quien ejecuta, con TDD.

**Goal:** Reemplazar los cuatro incidentes del capítulo 1, «Tu primer día», por los catorce subcapítulos que el estudiante aprobó el 2026-10-10, sin cambiar lo que el motor calcula para el capítulo 4 (sí cambia cómo se ven sus tarjetas, por el estilo B). Llegan:
- lo que le falta al motor: direcciones inválidas y loopback, varias redes locales, puerta de enlace, routers con TTL, saltos y avisos, internet con un servidor que contesta, cabecera y RTT, traceroute y reglas de salida;
- lo que le falta al contrato del incidente y a la sesión: resultados esperados más ricos, mensajes con TTL y traceroute, la mecánica de identificar (01), la tarjeta «Ajustes de red» con la puerta de enlace (07), los casos (14) y la tarjeta del firewall con las pestañas «Entrada» y «Salida» (13);
- en el sistema de diseño: un estilo nuevo para todas las tarjetas del juego, también las del capítulo 4 (el estilo B, con el botón primario como sello), y la primitiva `Tabs`, hecha con Radix, que es la única dependencia nueva;
- una regla que oculta lo que el jugador aún no conoce (el firewall del 05 no se ve hasta el 11);
- los catorce incidentes, en cinco bloques, cada uno con una prueba humana.

**Architecture:**
1. **Decisiones, estructura y términos (Tareas 0 a 2).** Los prototipos y las decisiones del estudiante (Tarea 0). `src/levels/` y otras carpetas están en el tope de 12 archivos o cerca de él: una mudanza sin cambio de comportamiento les da espacio y los incidentes se reparten en una carpeta por bloque (Tarea 1); otra mudanza hace sitio en `src/design/` para la primitiva nueva (Tarea 1a). Los términos nuevos se registran antes de que nada los etiquete (Tarea 2).
2. **Motor (Tareas 3 a 9).** Un solo motor. Dos etapas nuevas, `address` y `forward`, y campos nuevos y opcionales en el modelo y en la traza que solo llenan las redes de oficina; las trazas de la VPC del capítulo 4 no cambian ni en un campo.
3. **Contrato, sistema de diseño y juego (Tareas 10 a 15).** Se amplía el contrato `send`. El sistema de diseño estrena el estilo B para todas las tarjetas, con el botón primario como sello (Tarea 11a), y la primitiva `Tabs` (Tarea 11b). Después se suman dos mecánicas pequeñas (`identify` y `diagnose`), el ajuste de la puerta de enlace como una tarjeta propia, «Ajustes de red», y la tarjeta del firewall gana la dirección con las pestañas «Entrada» y «Salida». No hay predicción: la comprensión se verifica con la pregunta final a Lucía. Todo reutiliza las primitivas de `@/design`, y las tarjetas nuevas nacen en el estilo B.
4. **Escena (Tareas 16 a 18).** Pisos, routers y servidor; el aviso como paquete y sello; el RTT y la salida de traceroute. Las decisiones visuales de la 16 (V6: el mapa sigue la historia, opción b), la 17 y la 18 ya están tomadas.
5. **Contenido (Tareas 19 a 26).** Los catorce incidentes por bloques. Un «puente» temporal en el 04-01 mantiene verde el capítulo 4 mientras se construye.
6. **Cierre (Tareas 27 y 28).** Playwright del capítulo entero y los documentos.

**Tech Stack:** el de hoy (Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, Vitest 5.0.3, Testing Library con user-event, Playwright 1.64, pnpm 11.3.0) más una dependencia nueva, `@radix-ui/react-tabs`, con versión exacta (Tarea 11b; candidata el 2026-10-10: 1.1.21). `package.json` y `pnpm-lock.yaml` cambian solo en esa tarea.

**Spec:** `docs/specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md` (los 14, las decisiones tomadas, lo que queda fuera y las fuentes con fecha). Del spec `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md` siguen valiendo el catálogo de entidades, el modelo genérico, la mecánica `send`, la escalera de términos y el progreso. Donde el código y un plan viejo difieren, manda el código.

## Formato de este plan

- **Sin bloques de código y sin ensayo.** Hay identificadores en línea, tablas y prosa. Los contratos nuevos se describen con nombre, tipo y significado; la forma exacta de cada función la decide quien implementa.
- **Sin totales de tests por tarea.** Nadie ensayó el plan, así que no hay números esperados. El criterio de cierre de cada tarea es `pnpm check` verde y que existan los tests nombrados.
- **Los nombres de tests están en inglés y son exactos.** Cada uno dice qué asierta. Quien implementa puede agregar más; no puede cambiar ni quitar estos.
- **Las fichas de los 14 son ideas, no texto final.** La redacción en español (con tildes y ñ) se escribe al ejecutar cada bloque, en lenguaje llano y con una idea por mensaje.

## Global Constraints

- **Rutas.** Relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Los comandos se corren desde `projects/follow-the-packet/`.
- **Punto de partida verificado el 2026-10-10** sobre `e5054ee` (rama `main`): `pnpm exec vitest run` pasa con **743 tests en 51 archivos**. Playwright tiene **23 tests**: la cifra viene del plan de 33 capítulos y **no se volvió a medir**, porque Playwright levanta un servidor en el 4183. `pnpm check` completo tampoco se corrió al escribir este plan.
- **Reglas.** Valen las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Pesan sobre todo:
  - `folder-structure`: tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), barrels, alias `@/` y nada de `../`. Hoy `src/levels/` tiene 12, y `src/engine/network/`, `src/copy/`, `src/scene/`, `src/scene/entities/`, `src/ui/` y `src/design/`, 11. La Tarea 1 hace sitio, y la Tarea 1a hace sitio en `src/design/` (la primitiva `Tabs` con su test lo llevaría a 13).
  - `pure-domain-core` y `view-renders-domain-result`: el motor devuelve datos y códigos; ninguna vista recalcula un resultado. Lo que el jugador puede ver según lo que conoce lo calcula `game`.
  - `english-only` y `no-comments`: código, tests, guías y commits en inglés; solo JSDoc. El texto visible va en `src/copy/` y en los archivos de incidente.
  - `rigorous-plain-copy`: nombre oficial, cada término definido donde aparece, frases cortas.
  - `dry` con `jscpd` en umbral 0 (`minLines` 5, `minTokens` 50): los incidentes de un bloque comparten constructores en su `shared.ts` en vez de repetir la forma de un objeto. `pnpm dup` corre en cada tarea.
  - Un estándar por elemento (`DESIGN.md`): toda interfaz nueva reutiliza `Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, `Tabs` (desde la Tarea 11b) y la leyenda; una apariencia nueva es una variante de su primitiva, nunca un hermano. El estilo B (Tarea 11a) cambia las primitivas que ya existen y no suma ninguna hermana.
- **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE» (estudiante, 2026-10-10; D-11). Ninguna opción, recomendada o no, enseña algo inexacto aunque sea más simple: ni un texto, ni una opción de pregunta, ni el nombre de una ficha, ni una decisión de diseño. Lo que no se pudo verificar se dice o no se afirma. Las fichas 07, 13 y 14 llevan pruebas concretas (Review Focus 15).
- **Dependencias.** La única dependencia nueva de todo el plan es `@radix-ui/react-tabs` (Tarea 11b). Sigue las reglas `prefer-established-libraries` y `exact-dependency-versions` (`.claude/rules/`): versión exacta (`pnpm add` con `saveExact: true`, sin `^` ni `~`), publicada al menos 14 días antes del día en que se instala (requisito del estudiante, 2026-10-10) y anotada con su fecha en «Choices so far» de la primera. `package.json` y `pnpm-lock.yaml` no cambian en ninguna otra tarea.
- **El capítulo 4 no cambia lo que calcula.** `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibidos `vitest -u`, `--update` y editarlo a mano. Cada tarea de motor lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Los campos y etapas nuevos son opcionales y solo los llena una oficina; el test dorado serializa la traza entera, así que un campo nuevo en una traza de la VPC lo rompería. Una etapa nueva solo escribe un paso cuando actúa.
- **Capturas.** Las dos capturas de `#/entidades` (`tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png`) cambian solo en cuatro tareas, a propósito y revisando el diff: la 11a (el estilo B repinta todas las tarjetas, también las del capítulo 4, y el botón primario pasa a ser el sello: el diff de la interfaz es ese cambio, que el estudiante aprobó el 2026-10-10 contra el prototipo del inventario; ese inventario no toca el sello ni las etiquetas del mapa, así que la captura de piezas no cambia en esta tarea), la 11b (solo suma el especimen de `Tabs` a la de la interfaz), la 16 (solo suma el especimen del servidor de internet a la de piezas) y la 17 (solo suma los especímenes del aviso y de su sello a la de piezas). La 1a es una mudanza y no las toca. Las Tareas 12 a 15 tampoco. Sus tarjetas se arman con primitivas y contenido que `#/entidades` ya fotografía; si una suma un elemento de contenido sin especimen, lo suma y regraba a propósito, como dice «Adding a variant instead of a new element» de `DESIGN.md`.
- **"Listo"** = `pnpm check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea cierra con eso; lo que su sección llama «Cierre» es lo que se suma. Si Playwright no encuentra Chromium: `pnpm exec playwright install chromium`.
- **Commits.** Uno por tarea, cuando el estudiante lo aprueba (regla del repo), con `git add` de las rutas que la tarea lista, nunca `git add .`. El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (segundo `-m`). Nunca se agrega nada de `labs/03-ping-connectivity/` (tiene cambios sin commit del estudiante). Sin `git push` hasta que el estudiante lo pida.
- **Servidores y procesos.** No se arranca nada en los puertos 5173 y 5180 (el servidor del estudiante). Playwright levanta el suyo en el 4183. Si una tarea deja un proceso, se mata solo ese PID; nunca `pkill` por patrón. Para las pruebas humanas el estudiante usa su propio servidor.
- **Ejecución.** La sesión principal orquesta y cada tarea la hace un subagente con `model: sonnet` explícito; la ejecución ligera es la de siempre: un implementador por tarea, gobernado por los comandos de verificación de la propia tarea, y un revisor solo al final y en lo que el estudiante seguirá en vivo (los textos de los catorce y el 14). Al cerrar un bloque se sugiere `/clear`.
- Ningún comando `aws`.

## Decisiones del estudiante (2026-10-10)

Lo que este plan dejaba abierto lo decidió el estudiante el 2026-10-10. Las tareas aplican estas decisiones; ya no dicen «supone».

| # | Decisión | Qué implica |
|---|----------|-------------|
| D-1 | **Ninguna migración: todo el progreso guardado se resetea, también el del capítulo 4.** «Estamos creando. Todo se puede resetear.» | La clave de `localStorage` pasa a `v2` y la clave `v1` se borra al cargar; no se copia ninguna estrella. No hay tests de migración ni de «el progreso sobrevive». La regla de desbloqueo no cambia: el 04-01 se abre cuando el 01-14 tiene una estrella, así que quien empieza de cero no entra al capítulo 4 hasta terminar el 1. Separar un incidente después (el 03 o el 12) corre los ids sin costo, porque no hay progreso que conservar |
| D-2 | **A.** Mecánica `identify` en el 01 | Excepción declarada a «algo viaja»: en el 01 nada viaja (Tarea 12) |
| D-3 | **A.** La impresora de otra oficina es `10.0.0.10` | La IP del diseño (`192.168.1.10`) está en la red del jugador y es la de `tu-laptop` en el mundo de hoy; `10.0.0.10` es otro rango de RFC 1918 |
| D-4 | **A.** Un solo id `01-14` con siete casos | Estrellas: cerrar = los siete casos cerrados; la del medio = ninguna pista pedida en ningún caso; explicar = la causa de los siete a la primera. El caso guiado y el tercero comparten «sin puerta de enlace», a propósito: primero con la secuencia de pruebas, luego sin ella y desde el otro piso |
| D-5 | **A.** Aceptar que `public-ip` se conozca desde el 04-01 | La caja de inspección de `servidor1`, `servidor2`, `Tu Mac` y `Atacante` muestra su IP pública. Las trazas no cambian |
| D-7 | **B.** Quitar `request` y `response`; mantener `traffic` | El 03 queda en 5 términos. Las definiciones de ping, Echo Request y Echo Reply dejan de nombrar «solicitud» y «respuesta». `traffic` se presenta en el 11 |
| D-8 | **A.** «Host» como alias en la definición de dispositivo | No hay un término nuevo |
| D-9 | **Sin predicción.** «NO quiero predecir. Me gusta explicar a Lucía al final.» | No hay campo `prediction`, ni tarjeta, ni tarea, ni tests. Lo que el 03, el 06 y el 09 iban a predecir pasa a su pregunta final a Lucía |
| D-10 | **B.** Sintaxis de Linux en la terminal | `ping -t 3 …` y `traceroute -I <ip>` (el traceroute del juego usa ICMP Echo). En el Mac del estudiante `-t` es un tiempo límite y no el TTL, así que esa línea no se copia tal cual allí; las instancias EC2 de los labs sí son Linux |
| D-11 | **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE.» | Ninguna opción, recomendada o no, enseña algo inexacto aunque sea más simple (Global Constraints, «Rigor siempre»). Una opción más simple pero inexacta no se ofrece; si la exacta pesa, se divide o se explica mejor |
| D-12 | **Fichas.** El 01 se resuelve solo eligiendo fichas; nada se escribe. (Detalle abajo, en «Decisiones abiertas», D-12) | La tarjeta de la impresora pregunta «¿Cuál es su dirección IP?» con tres fichas: `192.168.1.21`, `192.168.1.300` y `192.168.1.12`. Lucía le da al jugador una nota con la IP de la impresora anotada mal, `192.168.1.300`, y esa ficha llega ya elegida; al pulsar «Listo» aparece «No es IPv4: cada uno de los cuatro números va de 0 a 255.». La IP real se lee en la caja de inspección de la impresora. La tarjeta de `laptop-visita` conserva «¿Está en la red?» Sí / No (variante `segmented`). Tarea 12 y ficha 01-01 |

## Decisiones abiertas

**No queda ninguna decisión abierta** (2026-10-10). El estudiante decidió **D-12** (cómo da el 01 la IP de la impresora: fichas), aprobó el inventario de tarjetas en estilo B completo (fila «V8 · inventario») y eligió el botón primario como sello (fila «Botón primario · sello»). **V6** (el mapa que crece) la decidió ese mismo día: la opción **b**, «el mapa sigue la historia». Esta sección guarda el detalle de las decisiones que lo necesitaron, D-6 y D-12; la Tarea 0 queda cerrada y ninguna tarea espera al estudiante.

### D-6. Elecciones visuales (prototipos renderizados, no ASCII)

Toda elección visual nueva se le muestra al estudiante con prototipos renderizados, no con dibujos de texto. La columna «Primitiva que se reutiliza» es la regla de `DESIGN.md`: ninguna elección suma un elemento hermano; el estilo cambia la primitiva. Lo decidido el 2026-10-10 también está en «Decisiones visuales aprobadas», al final.

| # | Qué se decide | Primitiva que se reutiliza | Decisión del estudiante (2026-10-10) | Tareas |
|---|---------------|----------------------------|--------------------------------------|--------|
| V1 | Cómo se ve el RTT (`time=`) de un ping | La caja de inspección (`dt`/`dd`) | **a.** Un campo «Tiempo de ida y vuelta» en la caja. La línea de salida del ping en la terminal no lleva el tiempo | 18 |
| V2 | La salida de traceroute | `Card` y la lista de la terminal | **a.** Lista numerada en la tarjeta | 18 |
| V3 | El ajuste de la puerta de enlace | `ChipTray` dentro de una tarjeta de fichas | **b.** Una tarjeta aparte de la laptop, «Ajustes de red», y no una bandeja dentro de la terminal. La puerta de enlace es un ajuste guardado del dispositivo y no parte de un comando; en macOS, `networksetup -getinfo Wi-Fi` la llama «Router» (verificado por el copiloto en el Mac del estudiante el 2026-10-10) | 13, 22, 27 |
| V4 | El aviso (Destination Host Unreachable, Time Exceeded) como paquete y su sello | El catálogo de paquetes y sellos | **a.** Un paquete con forma propia y un sello nuevo | 17 |
| V5 | El servidor de internet | La pieza de dispositivo | **b.** Una variante de la pieza de dispositivo, no de la de actor. El modelo no cambia (ver «Decididas sin el estudiante», punto 2) | 16 |
| V6 | Un mapa que crece: dos pisos y los routers | La losa de la red y la columna del layout | **b.** El mapa sigue la historia: cada pantalla se dibuja a tamaño completo (100 %) y solo con las piezas que ese subcapítulo usa; la oficina puede cambiar de sitio de un subcapítulo a otro (en el 10, de los dispositivos de la oficina solo queda `tu-laptop`). Ver «V6 en detalle» | 16, 18, 22, 23, 27 |
| V7 | Dónde termina un paquete cuya causa está oculta | El sello de perdido | **a.** Se detiene en la puerta del equipo, con «?» | 11 |
| V8 | El aspecto de las tarjetas, las de identificar (01) y de casos (14) incluidas | `Card`, `Choice`, `ChipTray` y `ChipCard` | **B del prototipo de estilos, como el estilo NUEVO de TODAS las tarjetas del juego, también las del capítulo 4:** franja de título oscura con icono y tipo, esquinas redondeadas, borde grueso, sombra, interruptor, opciones con letra y sello. No son tarjetas propias de cada mecánica: sigue siendo UNA primitiva por familia y el estilo cambia la primitiva, nunca suma hermanas. El estudiante aprobó el inventario de tarjetas completo (fila «V8 · inventario» de «Decisiones visuales aprobadas»): la bandeja `ChipTray` gana la variante `segmented` para Sí / No, la letra de las opciones sale de un contador de CSS y el botón primario pasa a ser el sello en todas las tarjetas | 11a, y por ella 12 a 15 |
| V9 | La tarjeta del firewall con entrada y salida | `TaskCard` y `ChipTray` | **b, con Radix.** Pestañas «Entrada» y «Salida» con `@radix-ui/react-tabs` (versión exacta, publicada al menos dos semanas antes), envuelto como la primitiva `Tabs` de `src/design/` con los tokens del juego. Servirá también para la entrada y la salida del Security Group y de la NACL en capítulos posteriores | 11b, 15 |

**V6 en detalle (decidida: b, 2026-10-10).** Las dos opciones anteriores (una losa por piso lado a lado, o los pisos apilados) se veían saturadas. Idea aprobada: el mapa crece y cada subcapítulo muestra solo las piezas que usa. El copiloto prototipó dos opciones para el 06, el 08 y el 10: la **a**, un solo mapa con la cámara fija que crece hacia el espacio vacío (todo se veía al 77 % desde el 06), y la **b**, el mapa que sigue la historia. El estudiante eligió la **b**: cada pantalla se dibuja a tamaño completo (100 %, es decir, con el mismo zoom `CAMERA_ZOOM` en todos los incidentes) y solo con las piezas que ese subcapítulo usa; la oficina puede cambiar de sitio de un subcapítulo al siguiente. Lo que se paga, y el estudiante aceptó al elegir: la oficina se mueve, y el router donde muere el ping a `10.0.0.10` en el 08 todavía no se dibuja, así que el sello de ese ping no puede ir en él. Lo que muestra el prototipo (opción b):
- **06:** el piso 1 con `tu-laptop`, `laptop-lucia` e `impresora`, y el piso 2 con `laptop-andres` y `router-oficina`. El ping a la impresora va directo; el de `laptop-andres` pasa por el router. No hay internet ni routers del proveedor. `laptop-marta` y `laptop-visita` están en el mundo y no se dibujan.
- **08:** la oficina del 06 más el globo `internet` y `servidor-internet`. Los routers del proveedor no se dibujan. El ping al servidor vuelve; el ping a `10.0.0.10` se pierde sin aviso y su sello «?» queda en el camino entre `router-oficina` y el globo, porque el router de afuera que lo descarta no se dibuja. Es exacto: el ping murió afuera de la oficina, antes de llegar al servidor.
- **10:** de los dispositivos de la oficina solo queda `tu-laptop` (en su losa del piso 1): `laptop-lucia`, `impresora` y `laptop-andres` no se dibujan porque este ping no las usa. Se dibujan además `router-oficina` (el salto 1 del traceroute), los dos routers del proveedor (`203.0.113.1` y `203.0.113.2`), el globo y `servidor-internet`. El tramo roto está entre `203.0.113.1` y `203.0.113.2`, y el sello «?» queda justo después de `203.0.113.1`. La terminal de `tu-laptop` muestra `traceroute -I 198.51.100.50` con 1 `192.168.1.1`, 2 `203.0.113.1`, 3 `*` y 4 `*`.

Qué cambia en el plan:
- **Tarea 16:** la distribución coloca solo las piezas que el incidente dibuja, a tamaño completo y sin una cámara común. Qué piezas usa cada incidente lo dice una lista propia del incidente (punto 20 de «Decididas sin el estudiante», _para revisar_). Inventario, fila 26.
- **Tarea 11:** su regla de piezas queda como está (una pieza se dibuja cuando su término es conocido). El término `router` es uno solo para el de la oficina y los del proveedor, así que esa regla no alcanza para mostrar uno en el 06 y los otros en el 09 y el 10: la Tarea 16 le suma la lista del incidente (una pieza se dibuja si el incidente la lista y su término es conocido).
- **Tareas 22 y 23 y las fichas 06 a 10:** cada incidente trae su lista. El mundo no cambia por eso: el 08 conserva en el modelo los routers del proveedor, porque el ping a `10.0.0.10` necesita uno que lo descarte; cambia lo que se dibuja. El 07 y el 09 no se prototiparon; sus mapas se deducen de la misma regla y se revisan en la prueba humana del bloque 3.
- **Rigor:** lo que se dibuja y lo que dice la caja deben coincidir. Un router que no se dibuja no lo nombra el campo «Pasó por» (Tarea 18), ni el motivo del paquete que muere afuera de la oficina (08), ni una línea de traceroute: el motivo dice que el ping murió afuera de la oficina, sin nombrar el router. Los routers que avisan (09) o que contestan un traceroute (10) sí se dibujan.
- **Tarea 27 y Review Focus 11:** las pruebas de geometría del 06 y del 08 conservan su nombre y miden el mapa a tamaño completo; se suma una de ajuste para el 06, el 08 y el 10.
- **Tarea 0:** no esperó a V6; V6 quedó escrita en «Decisiones visuales aprobadas» y la tarea está cerrada.

**D-12. Cómo da el 01 la IP de la impresora (decidida el 2026-10-10: fichas).** Nada se escribe en el 01: todo se resuelve eligiendo fichas, así que `@/design` no necesita ninguna primitiva nueva por esto.
- **Tarjeta de la impresora:** pregunta «¿Cuál es su dirección IP?» con tres fichas: `192.168.1.21`, `192.168.1.300` y `192.168.1.12`.
- **La nota de Lucía:** Lucía le da al jugador una nota con la IP de la impresora anotada mal, `192.168.1.300`, y esa ficha llega ya elegida. Al pulsar «Listo» aparece «No es IPv4: cada uno de los cuatro números va de 0 a 255.». La intención del estudiante: que todo jugador vea la regla, aunque él solo no se hubiera equivocado. Lo que esto no garantiza está en el punto 22 de «Decididas sin el estudiante».
- **La IP verdadera** se lee en la caja de inspección de la impresora, y el jugador elige la ficha que coincide.
- **La otra ficha válida** es la IP de otro dispositivo (`192.168.1.12` es la de `laptop-marta`) o una IP plausible que no es la de la impresora; nunca una arbitraria.
- **Tarjeta de `laptop-visita`:** conserva «¿Está en la red?» con Sí / No, ahora con la variante `segmented` de `ChipTray`.
- **Qué cambia:** la Tarea 12 (una bandeja puede arrancar con una ficha elegida y la línea de la ficha sale al pulsar «Listo»), la ficha 01-01 y los tests `01-01:` de la Tarea 20.

Todo lo decidido está escrito en este documento (sección «Decisiones visuales aprobadas», al final). Con ello, las capturas de `#/entidades` cambian en las Tareas 11a, 11b, 16 y 17 (ver «Capturas» en Global Constraints).

## Decididas sin el estudiante (para revisar)

1. **El puente temporal en el 04-01.** Los ids se reutilizan y los términos viejos se mudan; mientras no esté el capítulo entero, el 04-01 los «presenta» temporalmente para que la escalera del capítulo 4 siga verde. Cada bloque saca del puente los términos que le tocan; al cerrar la Tarea 26 el puente está vacío y un test lo exige.
2. **Un servidor de internet sigue siendo un actor de tipo `server` en el modelo; solo cambia cómo se dibuja (V5 b).** _Para revisar._ Un actor ya es «lo que está fuera de la red»; el servidor contesta Echo Request y no tiene firewall. No puede ser un `Device`: la regla del esquema «cada dispositivo está en el rango de su LAN» (Tarea 4) no se cumple con `198.51.100.50`, y exentarlo sumaría un caso especial en todo lo que recorre los dispositivos de la oficina (la batería de sondas, `officeLeaks`). El estudiante eligió dibujarlo como una variante de la pieza de dispositivo: un servidor es un equipo que contesta, y la definición de `device` de hoy ya nombra a un servidor. Por eso `pieceViews` convierte un actor `server` en una pieza de dispositivo de la variante nueva `internet-server` (Tarea 16), y el modelo y el motor (Tareas 4 a 8) no cambian por eso. Lo que sí cambia son los tipos de la vista que son exhaustivos sobre `Actor['kind']` (en `src/copy/terms.ts`, `src/copy/screens/incident-ui.ts`, `src/scene/catalog/catalog-cells.tsx`, `src/scene/entities/actor.tsx`, `src/game/view/pieces.ts` y `src/game/view/inspection.ts`): dejarían de compilar al sumar `server` en la Tarea 4, y la Tarea 4 los estrecha. Si prefieres que el modelo también lo trate como dispositivo, cambian el esquema y esas tareas; no se recomienda.
3. **Los routers y las rutas están en el modelo y no se muestran.** La tabla de rutas es del capítulo 2; en el capítulo 1 el mundo las trae dadas y el jugador no las edita.
4. **El orden de etapas copia el de un sistema real.** Dirección, decisión de ruta (aquí falla «sin puerta de enlace»), firewall de salida, entrega (aquí falla «IP sin dueño», y viajan los routers con su TTL), firewall de entrada, equipo, respuesta. Así un firewall de salida calla un paquete a una IP sin dueño y el aviso nunca llega.
5. **La respuesta de un ping nunca la frena un firewall, y ningún texto del capítulo 1 dice por qué.** Ni en el capítulo 1 ni hoy en el motor la frena; un test lo fija. La razón real es que el firewall es stateful (capítulo 4), y adelantarla o dar otra (como «recuerda la conversación» o «vuelve por el mismo camino») sería falso o prematuro. El texto del paso de la respuesta de un firewall de laptop afirma el hecho («Llega la respuesta») y no da ninguna razón; un test lo fija.
6. **traceroute usa Echo Request (como `tracert`), no UDP.** UDP y puertos son del capítulo 2. Con la sintaxis de Linux (D-10: B), la terminal muestra `traceroute -I <ip>`, cuya opción `-I` («Use ICMP ECHO for probes») está en la página de `traceroute(8)` de Linux (spec, tabla de fuentes). El máximo de saltos del juego es una cifra del juego (8), no la de ningún sistema.
7. **`officeLeaks` se acota, no se borra.** Un paquete que sale de una oficina sin routers sigue siendo una fuga; con routers hay un camino modelado y está permitido.
8. **Los 14 citan la misma lección y la misma nota que hoy** (`Lab: Comprobación de Conectividad entre Instancias EC2 usando PING`, `concepts/security-groups.md`), como hoy; el choque con la regla de lecciones es el pendiente I1 del backlog.
9. **Las fichas de origen del 12 se llaman «Cualquier IP de origen»** (con el término `source-ip`) y `[laptop-lucia] (IP 192.168.1.11)`. Así no hace falta un término nuevo y cada ficha nombra un término por su nombre oficial.
10. **Un único `placeRule`.** Las reglas de salida se agregan con un campo `direction` y una ficha de destino; el capítulo 4 sigue usando `fromId` y entrada sin cambios.
11. **Las pruebas humanas son del estudiante, con su servidor.**
12. **Cómo se resetea el progreso (D-1).** Clave nueva `v2` y borrado de la `v1` al cargar: lo más simple que deja el almacenamiento limpio, sin copiar nada.
13. **Las pestañas solo aparecen cuando la tarjeta tiene las dos direcciones.** _Para revisar._ Un firewall que solo tiene reglas de entrada (el de una laptop hasta el 13 y el Security Group del capítulo 4) muestra su lista como hoy, sin pestañas: una sola pestaña no enseña nada y los tests de la tarjeta del capítulo 4 siguen sin cambiar de contenido. Las pestañas llegan con las reglas de salida (el 13 y, más adelante, el Security Group y la NACL).
14. **Por dónde se abre «Ajustes de red».** _Para revisar._ El código de hoy abre una sola tarjeta por pieza, así que la laptop que envía y además tiene ajustes necesita una entrada nueva. El plan no la decide (Tarea 13); quien implementa elige la más simple que no sume una entidad al catálogo y la anota aquí.
15. **`src/design/` se divide en `primitives/`, sin mover los tokens.** _Para revisar._ Mover solo las primitivas (botón, tarjeta, elección, etiqueta, sus tests y su hoja de estilos) no toca nada de lo que lee los tokens: la expresión `css.include` de `vite.config.ts`, el import `?raw` de `tokens.ts` y la ruta de `tokens.css` que citan `.claude/rules/no-magic-strings.md` y `.claude/az-rules.json`. La raíz queda con 4 archivos y `primitives/` con 7; `Tabs` y su test lo llevan a 9. `DESIGN.md` sugiere como ejemplo la división entera en `tokens/` y `primitives/`; sería más movimiento sin ganar espacio.
16. **Un aviso que genera la propia laptop no tiene RTT.** Decidida al implementar las Tareas 3 a 9 (2026-10-10). `Trace.rttMs` queda ausente para un `host-unreachable` cuyo emisor es quien avisa, igual que para el silencio. Razón: en Linux ese aviso aparece después de esperar a que alguien conteste por esa IP, no al instante, y `ping` no imprime `time=` en una línea de «Destination Host Unreachable». Darle el tiempo del loopback (0,05 ms) enseñaría que es instantáneo. El loopback, `localhost` y la propia IP sí tienen 0,05 ms. Los avisos de un router conservan su tiempo.
17. **traceroute termina en el primer aviso de inalcanzable.** Esa línea lleva la IP que avisó y `unreachable: 'host' | 'net'`, con su tiempo si avisó un router y sin tiempo si avisó el propio emisor. Fuente: `traceroute(8)` de FreeBSD (ya en la tabla de fuentes del spec): si las sondas reciben un inalcanzable, traceroute se rinde. Antes el plan solo decía «termina al llegar al destino o al máximo».
18. **Dos motivos más de los que listaba el plan.** `route-leaves-office` (el destino está fuera del rango de la oficina y el paquete va a la puerta de enlace; `route-private` decía «por dentro de la red de la oficina», falso para un paquete que sale) y `forward-no-host` (un router tiene conectada la red del destino pero ningún dispositivo tiene esa IP).
19. **Simplificación del modelo.** El enlace de un router con un servidor es el /24 de la IP de su interfaz, porque una interfaz no tiene máscara. No se muestra.
20. **Qué piezas dibuja un incidente (V6 b).** _Para revisar._ Una lista explícita y opcional en el incidente, `shown`, con los ids del mundo (dispositivos, routers y actores) que dibuja; sin ella dibuja todo el mundo, como hoy. Se descartó derivarla de lo que nombran las fichas y las tareas de envío o de los saltos de las trazas: en el 08 el prototipo dibuja `laptop-lucia` y `laptop-andres`, que ni las fichas ni las tareas de ese incidente nombran, y en el 10 dibuja los dos routers del proveedor, que tampoco nombran; y los saltos dependen de lo que el jugador envíe, así que el mapa cambiaría a media partida. La lista es un dato más del incidente, junto a su mundo (`base` y `changes`), y un test del registro comprueba que cada id exista en ese mundo. Quedan por decidir al escribir sus bloques: el 07 y el 09, que se dedujeron sin prototipo, y del 11 al 14, que con el mundo entero pueden no caber a tamaño completo (la opción a del prototipo lo mostraba al 77 %); mientras no traigan lista dibujan el mundo entero.
21. **Un incidente que ofrece traceroute dibuja todos los routers que cruzan sus sondas.** Decidida el 2026-10-10. Razón: el traceroute real imprime la IP de cada router que avisa; una línea que dijera «fuera de la oficina» en vez de la IP no sería fiel a lo que muestra el comando. La regla de la Tarea 18 (no nombrar un router que no se dibuja) queda para los pings, como el de `10.0.0.10` en el 08.
22. **Cómo arranca una bandeja del 01 y cuándo sale la línea de una ficha (D-12).** _Para revisar._ Una bandeja de `identify.cards` gana dos campos opcionales: `initialPick` (el id de una de sus fichas, que llega elegida) y `segmented` (la dibuja con la variante `segmented` de `ChipTray`, para Sí / No; el contrato la lleva porque la vista no tiene otra forma de saber que una bandeja de dos fichas es un Sí / No). `initialPick` es de la bandeja y no de la ficha, porque la elección es de la bandeja (una ficha por bandeja); el esquema rechaza un `initialPick` que la bandeja no ofrece. La sesión nace con esas fichas elegidas (`Session.answers`) y volver a empezar el incidente las repone. Una ficha elegida de partida no cumple ninguna tarea por sí sola. La línea `feedback` de una ficha sale cuando el jugador pulsa «Listo» con esa ficha elegida, y no al elegirla: la ficha de la nota llega elegida y no hay ninguna elección que la dispare. «Listo» es el botón propio de la tarjeta (`ChipCard`), que hoy solo la cierra; en la tarjeta de identificar, con una ficha elegida que trae `feedback`, «Listo» muestra la línea y deja la tarjeta abierta, y sin esa línea cierra como siempre. Elegir otra ficha esconde la línea. Escape cierra la tarjeta siempre, con o sin línea. Que la línea ya salió es estado local de la tarjeta y no de la sesión. **Lo que esto no garantiza:** un jugador que cambie la ficha de la nota por la que coincide con la caja antes de pulsar «Listo» no ve la línea; la regla de 0 a 255 le llega entonces por la pregunta final de Lucía y por la pista 2, que hablan de una ficha que sí vio, la de la nota.
23. **Tres pruebas de Playwright miden estilo calculado.** _Para revisar._ `DESIGN.md` guarda la elección del estudiante del 2026-10-09: no hay pruebas sobre las reglas de CSS. Las pruebas del sello del botón primario y de las letras de las opciones (Tarea 11a) no leen el texto del CSS: miden el estilo calculado en un navegador real, porque jsdom no ve el movimiento ni `::before`, y una captura quieta no ve que el botón se mueva al pulsarlo. Lo demás del aspecto lo sigue guardando la captura de `#/entidades`.

## Inventario de mecánicas

Lo que el motor y el contrato saben hacer hoy y lo que falta para los catorce. «Mecánicas hoy»: `filter` y `send`, en `src/levels/incident.ts`.

| # | Mecánica | Hoy | La piden | Lo que falta | Tarea |
|---|----------|-----|----------|--------------|-------|
| 1 | Dirección IPv4 inválida | `isIpv4` acepta o no; un literal como `192.168.1.300` cae en la búsqueda de un nombre y sale con el texto del DNS y de la VPC | 01, 02, 14 | Un resultado propio que no sale de la laptop ni habla de DNS | 3 |
| 2 | Loopback y `localhost` | Solo la propia IP del dispositivo (`route-self`) | 04, 14 | Todo `127.x.x.x` y el nombre `localhost`, sin firewalls y con RTT casi cero | 3 |
| 3 | Dispositivo sin conexión | No existe | 01, 02 | `connected` y la acción `connectDevice` | 4 |
| 4 | Varias redes locales (pisos) | Una oficina tiene un solo rango | 06, 07, 14 | `lans`, `lanId`, las acciones `addLan` y `addDevice` | 4 |
| 5 | Routers con IP | El borde es una etiqueta (`edge: router`), sin IP | 06 a 10, 14 | `routers` con interfaces, rutas y latencia; `addRouter` y `updateRouter` | 4 |
| 6 | Puerta de enlace | No existe | 07, 14 | `gateway` y `setGateway`; decisión local o remota | 4, 5 |
| 7 | IP sin dueño en la red local | `route-no-device` termina en `lost` | 02, 05, 14 | Un aviso de la propia laptop (`unreachable`) en la etapa de entrega, después del firewall de salida | 5 |
| 8 | Sin puerta de enlace o desconectado | No existe | 07, 14 | El resultado `no-route`, local, sin aviso | 5 |
| 9 | Reenvío por routers, TTL y saltos | No existe | 06, 09, 10 | La etapa `forward`: cada router resta 1, `Trace.hops` | 6 |
| 10 | Time Exceeded y bucles | No existe | 09, 10, 14 | El aviso `ttl-exceeded` desde la interfaz del lado de quien envía; un bucle sale de las rutas | 6 |
| 11 | Un servidor de internet que contesta | Un actor solo envía; `destinationId` es un `Device` | 08, 10, 14 | Actor `server` como destino, con `latencyMs` | 4, 6 |
| 12 | IP privada hacia internet | Solo se pierde si viene de afuera; un dispositivo de oficina hacia una IP pública da `timeout` con texto de `{{public-ip}}` | 08, 14 | El primer router fuera de la oficina descarta sin aviso; ningún paso nombra NAT ni IP pública | 6 |
| 13 | Un router contesta el ping | No existe | 14 | Echo Request a una interfaz del router | 6 |
| 14 | Encabezado y respuesta invertida | Hay `tcpdump` suelto, sin TTL | 02, 03 | `Trace.header` con origen, destino y TTL, y la respuesta invertida | 7 |
| 15 | RTT | No existe | 04, 10 | `Trace.rttMs` por suma de latencias; cifras ilustrativas | 7 |
| 16 | traceroute | No existe | 10, 14 | Una función del motor que corre sondas con TTL 1, 2, 3… | 8 |
| 17 | Reglas de salida de un firewall de equipo | El motor las evalúa (`firewall-out`) pero `addRule` y `removeRule` solo tocan la entrada | 13 | `direction` en la acción | 9 |
| 18 | Un resultado esperado más rico | `replied` o `any` | 02 a 14 | `reached`, silencio, aviso, error local y quién avisa | 10 |
| 19 | Mensajes con TTL y comando | Solo `icmpType` 0 u 8 | 02, 09, 10 | `command` (paquete, ping, traceroute) y `ttl` | 10 |
| 20 | `officeLeaks` | Prohíbe todo paquete de una oficina hacia afuera | 08, 09, 10, 14 | Permitirlo cuando el mundo tiene routers | 10 |
| 21 | Piezas, sellos y motivos según lo que el jugador conoce | Un firewall se dibuja siempre, su sello dice «Bloqueado» y su motivo lo nombra; el borde y internet dependen de que haya un actor | 05 a 11 | Piezas por término conocido; sello de perdido y texto de silencio mientras el término no se conozca | 11 |
| 22 | Identificar (marcar y elegir) | No existe | 01 | Mecánica `identify` con fichas; una bandeja puede arrancar con una ficha elegida y la línea de una ficha sale al pulsar «Listo» (D-12) | 12 |
| 23 | Ajustar la puerta de enlace | Un movimiento de envío nunca cambia el mundo | 07 | `settings` en `send`, que el jugador cambia en la tarjeta «Ajustes de red» de la laptop (no en su terminal), y el movimiento `setSetting`; limpia los envíos viejos | 13 |
| 24 | Casos | Un incidente es un mundo | 14 | Mecánica `diagnose` con `caseIndex` | 14 |
| 25 | Regla con dirección | La tarjeta solo tiene reglas de entrada | 13 | Las pestañas «Entrada» y «Salida» (la primitiva `Tabs`) cuando la tarjeta tiene las dos; `configurableParts.outboundRules` por tipo de firewall | 11b, 15 |
| 26 | Pisos, routers y servidor en el mapa | `computeLayout` hace una columna por subred de una VPC o una fila para una oficina; el camino es fijo | 06 a 10 | Una columna por LAN, routers a lo largo del camino y el camino por los saltos; cada incidente dibuja solo las piezas que usa, a tamaño completo (V6 b); el servidor, como variante de la pieza de dispositivo (V5 b) | 16 |
| 27 | El aviso en el mapa | Dos paquetes (Echo Request y Echo Reply) y cuatro sellos | 05, 09, 10 | Un paquete con forma propia y un sello nuevo (V4 a) | 17 |
| 28 | RTT y traceroute en la vista | No existe | 04, 10 | Un campo «Tiempo de ida y vuelta» en la caja (V1 a) y la salida de la sonda como lista numerada en la tarjeta (V2 a) | 18 |
| 29 | Términos | 18 del capítulo 1 en cuatro incidentes | 01 a 13 | 20 ids nuevos (18 en la Tarea 2 y 2 en la 20); los viejos cambian de incidente | 2, 20 a 26 |
| 30 | Progreso | Clave `v1` por id | todos | Clave nueva `v2` y borrado de la `v1` al cargar; nada se migra (D-1) | 19 |
| 31 | Carpetas llenas | `src/levels/` en 12, `src/game/view/` crecería a 13 y `src/design/` en 11 no admitiría la primitiva `Tabs` con su test | las Tareas 10, 11b y 14 | Mudanza | 1 y 1a |
| 32 | La batería de sondas (`extraOpenings`) | Funciona con dispositivos y actores | 12 | Comprobar que sigue distinguiendo «cualquier IP» de «solo soporte» en una oficina con dos pisos | 6 |
| 33 | `least-privilege` | Lo presenta el 04-02 | 12 | Mudarlo al 01-12 | 25 |
| 34 | Pestañas | Ninguna primitiva cambia entre paneles con el teclado y los roles de una pestaña | 13 | La primitiva `Tabs`, hecha con Radix | 11b |
| 35 | Un estilo para todas las tarjetas | Cada tarjeta lleva el aspecto de hoy (`Card` con borde y sombra) | todos | El estilo B del prototipo, en las primitivas que ya existen: el botón primario como sello, la variante `segmented` de `ChipTray` y la letra de las opciones | 11a |

## Contratos nuevos

Nombre, tipo y significado. Toda propiedad nueva es opcional salvo que se diga lo contrario, para que la VPC y las oficinas de hoy sigan validando.

### Modelo de la red (`src/engine/network/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Network.lans` | lista de `{ id, name, cidr, latencyMs }` | Las redes locales (pisos) de una oficina. Sin la lista hay una sola, la de `cidr`. El `cidr` es un detalle del modelo y nunca se muestra |
| `Device.lanId` | id de una LAN | En qué red local está. Por defecto, la única |
| `Device.gateway` | dirección IPv4 | Su puerta de enlace predeterminada. Sin ella no saca nada de su red local |
| `Device.connected` | booleano, por defecto verdadero | Un dispositivo desconectado ni envía ni recibe, y el mapa lo dibuja fuera de la red |
| `Network.routers` | lista de `Router` | Los routers de la oficina y del camino a internet |
| `Router` | `{ id, name, interfaces, routes, latencyMs, sendsUnreachable }` | `interfaces` es una lista de `{ ip, faces }` donde `faces` es el id de una LAN, de otro router o de un servidor; `routes` es una lista de `{ to, next }` donde `to` es un rango (solo del modelo) o `default` y `next` el id de un router; `latencyMs` es el tiempo de un tramo; `sendsUnreachable` dice si avisa cuando no tiene ruta o si calla |
| `Actor.kind = 'server'` | variante | Un servidor de internet que contesta Echo Request. Lleva `latencyMs` y está detrás de la interfaz de un router que lo nombra. En el mapa se dibuja como una variante de la pieza de dispositivo (V5 b); el modelo no cambia por eso |
| `PacketSpec.ttl` | entero de 1 a 255 | El TTL con el que sale. Por defecto 64 (lo recomienda IANA y lo usa Linux) |
| Acciones nuevas | `connectDevice`, `setGateway`, `addLan`, `addDevice`, `addRouter`, `updateRouter` | Cambian el modelo; `addRule` y `removeRule` ganan `direction` (`inbound` por defecto) |

Reglas del esquema: ninguna IP se repite entre dispositivos, interfaces de routers y servidores; cada dispositivo está en el rango de su LAN; cada interfaz y cada ruta nombran algo que existe; una VPC no trae `lans` ni `routers`.

### Traza (`src/engine/simulation/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| Etapas nuevas | `address` y `forward` | `address` valida el literal y resuelve `localhost`; `forward` entrega en la red local o por los routers. El orden es: `address`, `dns`, `route`, `firewall-out`, `forward`, `firewall-in`, `host`, `reply` |
| `Outcome` nuevos | `invalid-address`, `no-route`, `unreachable`, `ttl-exceeded` | Dirección inválida; el emisor no tiene por dónde sacarlo (sin puerta de enlace o desconectado); un aviso de destino inalcanzable; un aviso de Time Exceeded. El silencio sigue siendo `timeout` |
| `Trace.header` | `{ request: { source, destination, ttl }, reply?: { source, destination } }` | El encabezado de la ida y el de la vuelta, con origen y destino invertidos. El origen es siempre el privado (la salida de la oficina es una caja negra) |
| `Trace.hops` | lista de `{ routerId, ip, ttlLeft }` | Los routers que cruzó, con la IP de la interfaz del lado de quien envía |
| `Trace.notice` | `{ kind: 'host-unreachable' \| 'net-unreachable' \| 'time-exceeded', fromId, fromIp }` | El aviso que volvió y quién lo generó |
| `Trace.rttMs` | número | La suma de las latencias de los tramos recorridos, ida y vuelta. Cifras ilustrativas. Ausente para el silencio y para un aviso que genera el propio emisor (punto 16 de «Decididas sin el estudiante»); un aviso de un router conserva su tiempo |
| Códigos de motivo nuevos | `address-invalid`, `address-localhost`, `route-loopback`, `route-no-gateway`, `route-not-connected`, `route-gateway-not-a-router`, `route-leaves-office`, `forward-no-owner`, `forward-no-host`, `forward-hop`, `forward-ttl-exceeded`, `forward-no-route`, `forward-private-dropped`, `forward-router-replies` | Cada uno trae sus datos (ids e IP); `src/copy/` los vuelve texto |

Los campos nuevos de la traza están ausentes (no `null`) en toda traza que el test dorado registra, y ninguna etapa nueva escribe un paso en ellas.

### Contrato del incidente (`src/levels/contract/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `mechanic` | `filter` \| `send` \| `identify` \| `diagnose` | Dos nuevas |
| `expect.outcome` (en `send`) | cualquier `Outcome` o `any` | Lo que debe verse: respuesta (`replied`), silencio (`timeout`), aviso (`unreachable`, `ttl-exceeded`), error local (`no-route`) o dirección inválida |
| `expect.by` | id opcional | Quién debe contestar, avisar o descartar (un dispositivo, un router, un actor o un firewall) |
| `expect.outcome = reached` | variante | El paquete llegó al destino con o sin respuesta |
| Ficha de mensaje | `{ id, label, command, ttl? }` | `command` es `packet`, `ping` o `traceroute`; `ttl` solo para `ping`. `icmpType` sigue siendo 8 o 0 |
| `send.settings` | lista de `{ id, deviceId, name, chips }` | Un ajuste guardado del dispositivo, que el jugador cambia en la tarjeta «Ajustes de red» de ese dispositivo y no en su terminal: la bandeja de la puerta de enlace predeterminada con fichas `{ id, label, value }` donde `value` es una IP o `null` (ninguna). El contrato no cambia por V3 b; cambia dónde se muestra |
| `SetSetting` | movimiento `{ deviceId, settingId, chipId }` | Cambia el mundo y borra los envíos anteriores |
| `identify.cards` | lista de `{ deviceId, trays }` | Una tarjeta por dispositivo con bandejas de fichas `{ id, label, feedback? }`; las tareas son `{ id, text, expect: { deviceId, trayId, chipId } }`. Una bandeja puede traer `initialPick` (el id de una de sus fichas, que arranca elegida; en el 01, la `192.168.1.300` que anotó Lucía) y `segmented` (para Sí / No). La `feedback` de una ficha sale al pulsar «Listo» con esa ficha elegida, no al elegirla (D-12; punto 22 de «Decididas sin el estudiante», _para revisar_) |
| `diagnose.cases` | lista de casos | Cada caso: `changes` sobre el mundo de inicio del incidente (no sobre el caso anterior), `report`, fichas de envío, dos pistas y una pregunta de causa con tres opciones y una correcta |
| `placeRule` | `{ firewallId, whatId, fromId?, toId?, direction? }` | Con `direction` de salida lleva una ficha de destino (`chips.to`); sin `direction` es de entrada, como hoy |
| `officeLeaks` | función | Un paquete que sale de una oficina sin routers sigue siendo una fuga |

### Sistema de diseño (`src/design/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Tabs` | primitiva nueva, envuelve `@radix-ui/react-tabs` | Una lista con nombre de pestañas `{ id, label, panel }`; se ve el panel de la elegida. No acepta `className` ni `style`. Radix monta solo el panel de la pestaña elegida: lo que un llamador guarda dentro de un panel se pierde al cambiar de pestaña, así que guarda su estado por encima. La forma exacta de las props la decide quien implementa |
| `Card` y `Choice` (estilo B) | primitivas que ya existen | `Card` gana, de forma opcional, una cabecera con título, icono y tipo (la franja oscura); `Choice` gana el interruptor y la opción con letra. El detalle exacto es el del prototipo del inventario que el estudiante aprobó completo el 2026-10-10. La letra de la opción sale de un contador de CSS, sin props nuevas. El título sigue siendo el `h2` que nombra la tarjeta; la letra y el interruptor son marcas visuales y no cambian el nombre accesible ni `aria-pressed`. Si la cabecera necesita un componente, vive en `card.tsx`, como `ChipTray` vive en `choice.tsx` |
| `ChipTray` (variante `segmented`) | variante de una primitiva que ya existe | Para Sí / No: dos fichas dentro de una sola pastilla partida en dos. Es una variante de la bandeja de siempre y no una bandeja hermana; el nombre accesible, `aria-pressed` y el teclado de cada ficha no cambian |
| `Button` (variante `primary`, el sello) | variante de una primitiva que ya existe | Decidido por el estudiante el 2026-10-10 para todas las tarjetas: fondo `surface`, texto y borde discontinuo (`dashed`, como en el prototipo) en `emphasis`, forma de pastilla, mayúsculas con `tracking-caps`, inclinación fija de `rotate(-2deg)` y `translateY(2px)` al pulsar. Con `prefers-reduced-motion` y deshabilitado no se mueve al pulsar (se pierde el `translateY(2px)`), pero la inclinación fija se queda. Sigue siendo `Button`, con sus clases de hoy |

### Sesión y vista (`src/game/`)

| Nombre | Significado |
|--------|-------------|
| `Session.answers` | Lo elegido en cada tarjeta de un incidente `identify`. Arranca con el `initialPick` de cada bandeja que lo trae |
| `Session.caseIndex` y `Session.caseResults` | En qué caso va el `diagnose` y cómo salió cada uno |
| Acciones nuevas | `answerCard`, `setSetting`, `nameCause`, `nextCase` |
| `describeReason(reason, net, known)` | El motivo se escribe con los términos que el jugador conoce; si el término de la causa es desconocido, el texto dice solo que no volvió nada |
| `pieceViews(session)` | Una pieza se dibuja cuando su término es conocido; el firewall, el router y internet dejan de depender de que haya un actor |
| `blocked` de un paquete | Verdadero solo si el firewall que lo frenó es un término conocido; si no, el sello es el de perdido |
| `SettingsCard` | Lo que muestra la tarjeta «Ajustes de red» de una laptop: sus ajustes y, de cada uno, la ficha que coincide con el mundo. La calcula `game`; la vista no decide nada |

## Los catorce: fichas

Cada ficha: mecánica, términos, mundo, qué viaja, qué hace el jugador y con qué fichas, éxito, fallo y causa, pregunta de Lucía con la idea de la correcta y el error que refleja cada incorrecta, y las dos pistas. Los números del mundo pueden ajustarse al escribir. Los términos de cada incidente salen de la tabla «Los catorce» del spec. Todas las respuestas correctas cambian de lugar entre incidentes para que no se adivinen.

El mundo base, común a todas: piso 1 en `192.168.1.x` con `tu-laptop` (.10), `laptop-lucia` (.11), `laptop-marta` (.12), `impresora` (.21) y `laptop-visita` (.30, sin cable). Ninguna tiene firewall: el de `laptop-marta` llega en el 05 y no se ve hasta el 11. El mundo crece con las acciones que cada ficha nombra. El mundo es común; lo que se dibuja no: del 06 al 10 cada incidente dibuja solo las piezas que usa (V6 b, punto 20 de «Decididas sin el estudiante»), y el mundo base no se ve entero en todos.

### Bloque 1 · Dónde estás

**01-01 · La oficina** · `identify` · términos: red, dispositivo (host), dirección IP, IPv4 (D-2 y D-8, decididas)
- **Mundo:** el base. La pieza de `laptop-visita` se dibuja fuera de la losa. No hay router, internet ni actores.
- **Qué viaja:** nada. Excepción declarada.
- **La nota de Lucía:** Lucía le da al jugador una nota con la IP de la impresora anotada mal: `192.168.1.300`. Esa ficha llega ya elegida en la tarjeta de la impresora (`initialPick`).
- **Jugador y fichas:** pasa el mouse por las piezas para ver qué son y qué IP tienen; la IP verdadera de la impresora se lee en su caja de inspección. Abre la tarjeta de `laptop-visita` (bandeja «¿Está en la red?» con «Sí» y «No», variante `segmented`) y la de la impresora (pregunta «¿Cuál es su dirección IP?», bandeja «Dirección IP» con `192.168.1.21`, `192.168.1.300` ya elegida y `192.168.1.12`) y elige la ficha que coincide con la caja. La `192.168.1.12` es la IP de `laptop-marta`: otra IP válida de la oficina, nunca una arbitraria.
- **Tareas:** (1) que `laptop-visita` quede marcada como fuera de la red; (2) que la impresora tenga su IP (la ficha que coincide con su caja).
- **Éxito:** las dos tareas se cumplen y se envía la solución.
- **Fallo y causa:** marcar «No» a una laptop conectada → la caja dice que tiene IP y está en la red. `192.168.1.300` (la de la nota, ya elegida) → al pulsar «Listo» aparece «No es IPv4: cada uno de los cuatro números va de 0 a 255.» (`feedback` de la ficha); la tarjeta sigue abierta y la tarea sigue pendiente. `192.168.1.12` → al pulsar «Listo» dice que es la IP de `laptop-marta`, que se ve en su caja (`feedback` de la ficha).
- **Pregunta:** «¿Por qué `192.168.1.300` no puede ser la IP de la impresora?» Correcta: en IPv4 cada uno de los cuatro números va de 0 a 255. Incorrectas: «ya la usa otro dispositivo» (confunde una IP inválida con una repetida); «está fuera del rango de la oficina» (confunde validez con pertenecer a la red).
- **Pistas:** (1) cada dispositivo tiene su IP; pasa el mouse por la impresora. (2) un número de una IP no pasa de 255.
- **Decidido (D-12, 2026-10-10):** el 01 se resuelve con fichas. Lo que esto no garantiza: un jugador que cambie la ficha de la nota por la que coincide con la caja antes de pulsar «Listo» no ve la línea de `192.168.1.300`; para él la regla llega por la pregunta final y por la pista 2, que hablan de una ficha que sí vio, la de la nota (punto 22 de «Decididas sin el estudiante», _para revisar_).

**01-02 · El sobre** · `send` · términos: paquete, encabezado, IP de origen, IP de destino
- **Mundo:** `connectDevice` de `laptop-visita`.
- **Qué viaja:** un paquete de `tu-laptop` a la impresora. No se muestra ningún comando; la terminal escribe «paquete de 192.168.1.10 a 192.168.1.21».
- **Jugador y fichas:** en la terminal solo se elige el destino: `192.168.1.21`, `192.168.1.12`. El origen y el mensaje son fijos.
- **Tarea:** que el paquete llegue a la impresora (`expect.outcome = reached`, `by` la impresora).
- **Éxito:** el paquete llega a la impresora; la caja muestra su encabezado con las dos IP. La vuelta se dibuja en el mapa sin nombre (el Echo Reply se presenta en el 03) y el resultado dice solo «Llegó».
- **Fallo y causa:** destino `192.168.1.12` → llega a `laptop-marta` (sello ✓ en su laptop) y la tarea sigue pendiente.
- **Pregunta:** «¿Por qué tu paquete llegó a `laptop-marta`?» Correcta: el encabezado llevaba su IP como destino y la red entrega al dispositivo que tiene esa IP. Incorrectas: «la red lo adivinó por el nombre» (los nombres son del capítulo 2); «la IP de origen era la de ella» (confunde origen y destino).
- **Pistas:** (1) mira la IP de destino del encabezado. (2) la impresora tiene la `192.168.1.21`.

### Bloque 2 · El ping

**01-03 · ¿Estás ahí?** · `send` · términos: protocolo, ICMP, ping, Echo Request, Echo Reply (D-7: B). El más denso.
- **Mundo:** sin cambios.
- **Qué viaja:** `ping 192.168.1.21` de `tu-laptop` a la impresora, con su vuelta.
- **Jugador y fichas:** envía el ping y mira, en la caja, los dos mensajes: el de ida y el de vuelta, cada uno con su encabezado. Destino: `192.168.1.21` y `192.168.1.11`; el mensaje es fijo (ping).
- **Tarea:** que tu ping a la impresora vuelva con respuesta.
- **Fallo y causa:** ping a `192.168.1.11`: vuelve, pero no es lo pedido («esa es mi laptop»).
- **Pregunta:** «El Echo Reply que volvió a tu laptop, ¿qué origen y qué destino lleva?» Correcta: el origen es la impresora y el destino, `tu-laptop` (invertidos, porque la respuesta vuelve a quien preguntó). Incorrectas: «los mismos que la ida» (cree que el paquete no cambia); «solo lleva destino» (cree que el encabezado no siempre trae los dos).
- **Pistas:** (1) un mensaje pide, el otro contesta; compara sus encabezados en la caja. (2) envía el ping a la `192.168.1.21`.

**01-04 · Ping a ti mismo** · `send` · términos: loopback, localhost, RTT
- **Mundo:** sin cambios.
- **Qué viaja:** `ping localhost`, `ping 127.0.0.1` y `ping 192.168.1.21`.
- **Jugador y fichas:** destino: `localhost`, `127.0.0.1`, `192.168.1.21`. Compara el tiempo de ida y vuelta de la caja (V1).
- **Tareas:** (1) que el ping a `127.0.0.1` vuelva; (2) que el ping a la impresora vuelva.
- **Fallo y causa:** ninguna; si falta una de las dos, la tarea queda pendiente.
- **Pregunta:** «¿Por qué el ping a `127.0.0.1` tarda casi nada?» Correcta: no sale de tu equipo; la dirección loopback es siempre tú. Incorrectas: «`127.0.0.1` es la IP más rápida de la red» (cree que el número da velocidad); «la respuesta no hace falta» (cree que el loopback no contesta).
- **Pistas:** (1) compara los dos tiempos. (2) `127.0.0.1` siempre eres tú.

**01-05 · Cuando no vuelve** · `send` · términos: timeout, Destination Host Unreachable
- **Mundo:** `addFirewall` a `laptop-marta`, con la entrada vacía y la salida abierta. No se dibuja, ni se nombra, hasta que el término `firewall` se presente en el 11.
- **Qué viaja:** dos pings que no vuelven.
- **Jugador y fichas:** destino: `192.168.1.12`, `192.168.1.50`, `192.168.1.21`.
- **Tareas:** (1) probar un ping a `laptop-marta` y ver el timeout (`expect.outcome = timeout`); (2) probar un ping a `192.168.1.50` y ver el aviso (`expect.outcome = unreachable`, `by` tu laptop).
- **Éxito:** los dos resultados vistos.
- **Fallo y causa:** caso A, silencio: marta está encendida y nada vuelve; la causa no se muestra (misterio del 11). Caso B, aviso: ningún dispositivo tiene `192.168.1.50`; tu laptop buscó quién tenía esa IP y nadie contestó.
- **Pregunta:** «¿Qué diferencia hay entre no recibir nada y recibir el aviso?» Correcta: con el aviso, alguien (aquí tu propia laptop) te dice que no pudo entregar; con el silencio nadie dice nada y no sabes por qué. Incorrectas: «el silencio significa que el equipo está apagado» (la creencia que este capítulo desmonta); «el aviso significa que el equipo rechazó el ping» (confunde el aviso con una respuesta del destino).
- **Pistas:** (1) fíjate de quién viene cada resultado. (2) prueba `192.168.1.50` y `192.168.1.12`.

### Bloque 3 · Salir de la oficina

**01-06 · Tu red y el router** · `send` · términos: red local (LAN), router
- **Mundo:** `addLan` del piso 2 (`192.168.2.x`), `addDevice` `laptop-andres` (`192.168.2.15`), `addRouter` `router-oficina` (interfaces `192.168.1.1` y `192.168.2.1`) y la puerta de enlace de cada dispositivo (`192.168.1.1` en el piso 1 y `192.168.2.1` en el piso 2). El router se dibuja ahora.
- **Qué viaja:** un ping dentro del piso 1 y otro al piso 2.
- **Jugador y fichas:** la regla viene dada: «aquí la red es 192.168.1.x». Destino: `192.168.1.21`, `192.168.2.15`, `192.168.1.11`.
- **Tareas:** que vuelvan el ping a la impresora y el ping a `laptop-andres`.
- **Pregunta:** «¿Por qué el ping a `laptop-andres` pasó por el router y el de la impresora no?» Correcta: `laptop-andres` está en otra red local y lo que sale de tu red local pasa por el router. Incorrectas: «el router es más rápido que el cable» (confunde su función con velocidad); «todo pasa por el router, también dentro del piso» (cree que el router media todo, aunque el ping a la impresora fue directo).
- **Pistas:** (1) mira qué empieza igual que tu IP. (2) los de otra red local pasan por el router.
- **Mapa (V6 b, decidida el 2026-10-10):** a tamaño completo y solo con lo que usa este incidente: el piso 1 con `tu-laptop`, `laptop-lucia` e `impresora`, y el piso 2 con `laptop-andres` y `router-oficina`. `laptop-marta` y `laptop-visita` siguen en el mundo y no se dibujan. No hay internet ni routers del proveedor. El ping a la impresora va directo y el de `laptop-andres` pasa por el router (prototipo, opción b, 06). El incidente trae esa lista en `shown`.

**01-07 · A quién mandas lo de afuera** · `send` con ajuste · término: puerta de enlace predeterminada (V3 b, decidida)
- **Mundo:** `setGateway` de `tu-laptop` a ninguna («reinstalaron tu laptop»).
- **Qué viaja:** un ping al piso 2, antes y después de configurar.
- **Jugador y fichas:** en la tarjeta «Ajustes de red» de tu laptop, la bandeja «Puerta de enlace predeterminada» (ninguna, `192.168.1.1`, `192.168.1.21`, `192.168.1.50`); en la terminal, solo el destino `192.168.2.15`, `192.168.1.21`. La puerta de enlace no va en la terminal porque es un ajuste guardado del dispositivo y no parte de un comando.
- **Tarea:** que tu ping a `laptop-andres` vuelva.
- **Éxito:** `192.168.1.1` y luego el ping.
- **Fallo y causa:** sin puerta de enlace → el ping no sale y el mapa lo marca (`no-route`). `192.168.1.21` (la impresora) → el paquete llega a la impresora, que no sabe reenviarlo, y no vuelve nada. `192.168.1.50` → nadie la tiene y tu laptop avisa.
- **Pregunta:** «¿Por qué tu ping no salió de tu laptop?» Correcta: para lo que está fuera de su red local, la laptop necesita saber a quién entregarlo: la puerta de enlace. Incorrectas: «el router estaba apagado» (culpa al router y el mapa muestra que el paquete ni salió); «`laptop-andres` no tiene IP» (ignora que tiene una).
- **Pistas:** (1) la puerta de enlace es el router de tu piso. (2) elige `192.168.1.1`.
- **Nota de texto (rigor):** en macOS el mismo ajuste se llama «Router» (`networksetup -getinfo Wi-Fi`, verificado por el copiloto en el Mac del estudiante el 2026-10-10); en los demás sistemas no se verificó. El texto del juego usa el término puerta de enlace predeterminada y no cita el nombre de ningún sistema; si la definición lo hiciera, diría solo lo verificado.

**01-08 · La red de redes** · `send` · términos: internet, IP privada, IP pública (D-3 y D-5, decididas)
- **Mundo:** `addRouter` del proveedor y de destino, `addActor` del servidor de internet (`198.51.100.50`), con direcciones de documentación. Aparecen internet y el servidor; los routers del proveedor existen en el mundo (el ping a `10.0.0.10` necesita uno que lo descarte) y el mapa no los dibuja hasta el 09 (V6 b). La salida de la oficina es una caja negra.
- **Qué viaja:** dos pings: al servidor de internet y a la impresora de otra oficina (`10.0.0.10`).
- **Jugador y fichas:** destino: `198.51.100.50`, `10.0.0.10`, `192.168.1.21`.
- **Tareas:** (1) que el ping al servidor vuelva; (2) probar el ping a `10.0.0.10` y ver que no vuelve (`expect.outcome = timeout`).
- **Fallo y causa:** `10.0.0.10` muere en el primer router fuera de la oficina, sin aviso: miles de redes usan esa IP y internet no la enruta.
- **Pregunta:** «¿Por qué el ping a la impresora de otra oficina no llegó?» Correcta: `10.0.0.10` es una IP privada y internet no la enruta. Incorrectas: «el servidor de internet bloqueó el ping» (el ping murió antes de llegar a él); «tu router no deja salir pings» (el otro ping sí salió).
- **Pistas:** (1) compara a dónde llegó cada ping. (2) una IP privada no se entrega fuera de su red.
- **Mapa (V6 b, decidida el 2026-10-10):** la oficina del 06 (los dos pisos y el router) más el globo `internet` y `servidor-internet`, a tamaño completo. Los routers del proveedor no se dibujan. El ping a `10.0.0.10` muere en el primer router de afuera, que no se dibuja: su sello «?» queda en el camino entre `router-oficina` y el globo, y ni la caja ni el motivo nombran ese router; dicen que el ping murió afuera de la oficina, antes de llegar al servidor (prototipo, opción b, 08).

**01-09 · Contar saltos** · `send` · términos: salto (hop), TTL, Time Exceeded
- **Mundo:** `updateRouter` del proveedor: su ruta por defecto apunta de vuelta al router de la oficina (un bucle, dado). El jugador no configura rutas.
- **Qué viaja:** pings al servidor con un TTL elegido.
- **Jugador y fichas:** mensaje: ping con TTL 1, 2, 3, 5 y 64 (`ping -t 3 198.51.100.50`); destino: `198.51.100.50`. Con TTL 1 y 2 el jugador ve que avisan los dos routers en orden; con 3, que vuelve a avisar el primero.
- **Tareas:** (1) que un ping con TTL 3 reciba Time Exceeded desde el router de la oficina; (2) que el ping con TTL 64 también reciba Time Exceeded.
- **Fallo y causa:** con TTL 64 el paquete da vueltas entre los dos routers hasta que el TTL llega a 0.
- **Pregunta:** «¿Por qué el ping con TTL 64 no llegó al servidor?» Correcta: en el bucle el paquete pasa una y otra vez por los mismos routers; cada salto resta 1 hasta llegar a 0 y el router lo descarta y avisa. Incorrectas: «el servidor lo bloqueó»; «64 es demasiado alto para internet».
- **Pistas:** (1) cada router resta 1. (2) prueba TTL 1 y TTL 2 y mira quién avisa.
- **Mapa (V6 b; no se prototipó, se deduce de la misma regla y se revisa en la prueba humana del bloque 3):** `tu-laptop`, los dos routers del bucle (`router-oficina` y el del proveedor, que se dibuja desde aquí), el globo `internet` y `servidor-internet`, que es el destino de todos los pings aunque ninguno llegue. No se dibujan las demás laptops ni la impresora, ni el router de destino del proveedor, que ningún paquete cruza. Cada Time Exceeded vuelve desde un router dibujado.

**01-10 · Ver el camino** · `send` con traceroute · término: traceroute
- **Mundo:** `updateRouter` quita el bucle y deja un tramo roto sin aviso detrás del segundo router (`sendsUnreachable` falso).
- **Qué viaja:** un ping al servidor (silencio) y un traceroute.
- **Jugador y fichas:** mensaje: ping y traceroute (`traceroute -I 198.51.100.50`); destino: `198.51.100.50`.
- **Tareas:** (1) ver el silencio del ping (`timeout`); (2) correr traceroute al servidor.
- **Éxito:** la salida lista los saltos 1 y 2 con la IP de cada router y luego asteriscos.
- **Fallo y causa:** el problema está justo después del último router que contestó.
- **Pregunta:** «¿Dónde está el tramo roto?» Correcta: después del último router que contestó, el segundo. Incorrectas: «en tu laptop» (el primer salto contestó); «en el servidor» (los saltos 3 y siguientes también callan, así que el problema empieza antes).
- **Pistas:** (1) cada línea es un router que avisó. (2) fíjate en dónde empiezan los asteriscos.
- **Mapa (V6 b, decidida el 2026-10-10):** de los dispositivos de la oficina solo queda `tu-laptop`, en su losa del piso 1; `laptop-lucia`, `impresora` y `laptop-andres` no se dibujan porque este ping no las usa. Se dibujan además `router-oficina` (el salto 1), los dos routers del proveedor (`203.0.113.1` y `203.0.113.2`), el globo `internet` y `servidor-internet`. El tramo roto queda entre `203.0.113.1` y `203.0.113.2`, y el sello «?» justo después de `203.0.113.1`. La salida de traceroute (lista numerada, V2 a) nombra solo routers dibujados: `192.168.1.1`, `203.0.113.1` y luego asteriscos (prototipo, opción b, 10).

### Bloque 4 · El guardia

**01-11 · El guardia** · `send` · términos: firewall, tráfico, descartar (D-7: B)
- **Mundo:** `updateRouter` repara el tramo roto del 10 (el proveedor lo arregló); el firewall de `laptop-marta` se ve por primera vez porque el término ya se conoce. Los routers siguen en el mapa.
- **Qué viaja:** el ping a `laptop-marta` del 05 y otro a `laptop-lucia`.
- **Jugador y fichas:** destino: `192.168.1.12`, `192.168.1.11`. Se puede inspeccionar el firewall (su definición; sin candado de reglas todavía).
- **Tareas:** (1) probar el ping a `laptop-marta` y ver que lo descartó su firewall (`expect.outcome = timeout`, `by` el firewall de `laptop-marta`); (2) que el ping a `laptop-lucia` vuelva.
- **Fallo y causa:** el firewall de `laptop-marta` descarta sin avisar. El sello es ahora ✕ en su laptop y el motivo lo dice.
- **Pregunta:** «¿Por qué no recibiste ningún aviso?» Correcta: su firewall descartó el paquete y no avisó (descartar es tirar el paquete; quien lo tira puede avisar o callar, y este calla). Incorrectas: «el ping nunca salió de tu laptop» (el sello muestra que viajó); «`laptop-marta` estaba apagada» (llegó hasta su firewall).
- **Pistas:** (1) mira el sello del ping a `laptop-marta`. (2) inspecciona su firewall.

**01-12 · Tu primera regla** · `filter` · términos: regla, permitir, denegar, denegación por defecto, mínimo privilegio. El segundo más denso.
- **Mundo:** sin cambios; el firewall de `laptop-marta` se puede editar. `laptop-visita` es un flujo prohibido.
- **Qué viaja:** el ping de soporte (`laptop-lucia`) a `laptop-marta` (requerido) y el de la visita (prohibido).
- **Jugador y fichas:** Type: Echo Request. Source: «Cualquier IP de origen» y `[laptop-lucia] (IP 192.168.1.11)`.
- **Tarea:** que el ping de `laptop-lucia` a `laptop-marta` vuelva y que el de la visita no entre.
- **Éxito:** Echo Request ← `laptop-lucia`. Abre solo lo justo (estrella del medio).
- **Fallo y causa:** «Cualquier IP de origen» deja entrar a la visita (alerta de intruso).
- **Pregunta:** «¿Por qué el ping de la visita sigue bloqueado si no escribiste ninguna regla contra ella?» Correcta: lo que ninguna regla permite queda denegado por defecto. Incorrectas: «el firewall reconoce a las visitas» (cree que adivina quién es quién); «la regla de Lucía también la prohíbe» (cree que una regla niega a los demás).
- **Pistas:** (1) un firewall solo deja pasar lo que una regla permite. (2) permite el Echo Request solo desde `laptop-lucia`.

**01-13 · Entrar y salir** · `filter` con dirección · términos: entrada, salida
- **Mundo:** `addFirewall` a `tu-laptop` con la salida cerrada y la entrada vacía. La salida está cerrada porque alguien configuró esa laptop así; no porque un firewall la cierre por defecto.
- **Qué viaja:** el ping de `tu-laptop` a `laptop-lucia`.
- **Jugador y fichas:** la tarjeta del firewall de tu laptop con las pestañas «Entrada» y «Salida» (la primitiva `Tabs`); Type: Echo Request; Source (entrada): `[laptop-lucia]`, `[impresora]`; Destination (salida): `[laptop-lucia]`, `[impresora]`.
- **Tarea:** que tu ping a `laptop-lucia` vuelva.
- **Éxito:** regla de salida Echo Request → `laptop-lucia`.
- **Fallo y causa:** una regla de entrada no lo arregla: el ping muere en el firewall de tu laptop al salir.
- **Pregunta:** «¿Por qué la regla de entrada no dejó salir el ping?» Correcta: una regla de entrada controla lo que llega a la laptop; lo que sale lo controla una de salida. Incorrectas: «tu laptop no tiene firewall» (el sello ✕ está en ella); «el ping se bloqueó en `laptop-lucia`» (nunca salió de tu laptop).
- **Pistas:** (1) mira dónde está el ✕. (2) agrega la regla en la pestaña «Salida».
- **Nota de texto (rigor, estudiante 2026-10-10):** ningún texto de este incidente (reporte, ficha, motivo, pista, opción de la pregunta ni lista vacía de la tarjeta) puede sugerir que una salida cerrada es lo normal de un firewall ni su valor por defecto. Esa laptop la tiene cerrada porque alguien la configuró así, y el texto lo dice así. Lo guarda una prueba con nombre en la Tarea 25.

### Bloque 5 · Tu primera guardia

**01-14 · Guardia final** · `diagnose` · sin términos nuevos (D-4, decidida)
- **Mundo:** cada caso es un cambio sobre el mundo del 13.
- **Qué viaja:** los pings, traceroutes y el TTL que el jugador elija.
- **Jugador y fichas:** una terminal con el origen de cada caso y sus destinos; el botón «Ya sé la causa» abre la pregunta del caso. El primer caso muestra además la secuencia de cuatro pruebas (loopback, tu IP, la puerta de enlace, internet) como fichas. No es la escalera de términos de `ladder.ts`.
- **Éxito:** nombrar la causa de cada caso. Las pistas y el reporte son por caso.

| Caso | Reporte y origen | Qué enseña la evidencia | Causa | Opciones incorrectas (error que reflejan) |
|------|------------------|--------------------------|-------|-------------------------------------------|
| 1, guiado | Tu ping al servidor de internet no vuelve | Las pruebas 1, 2 y 3 vuelven; la 4 ni sale (`no-route`) | Sin puerta de enlace | «El servidor de internet está caído» (culpa al lejano y el paquete ni salió); «tu laptop no tiene IP» (ignora que la prueba 2 volvió) |
| 2 | Lucía anotó `192.168.1.22` para la impresora y el ping a esa IP no vuelve | `192.168.1.22` da aviso de tu propia laptop; `192.168.1.21` vuelve | IP mal escrita | «La impresora está apagada» (el aviso viene de tu laptop, no del destino); «el firewall de la impresora la bloquea» (un firewall callaría, no avisaría) |
| 3 | El ping de `laptop-andres` al piso 1 no vuelve | Su loopback, su IP y el router `192.168.2.1` vuelven; el piso 1 no sale | Sin puerta de enlace, sin la secuencia | «El router no reenvía entre pisos» (el router contestó); «el piso 1 está apagado» (nada llegó a salir) |
| 4 | El ping de Contabilidad a la impresora de la sucursal (`10.0.0.10`) no vuelve | El servidor de internet vuelve; `10.0.0.10` calla | IP privada hacia internet | «El servidor bloquea el ping» (otro ping al servidor volvió); «falta la puerta de enlace» (el otro destino pasó por ella) |
| 5 | Ningún ping del piso 1 al servidor de internet vuelve | Time Exceeded desde dos routers que se alternan; traceroute repite las IP | Bucle entre routers | «El servidor está sobrecargado» (confunde el aviso con el silencio); «la IP del servidor está mal escrita» (eso daría Destination Host Unreachable) |
| 6 | Los pings a `laptop-lucia` no vuelven; los demás sí | Un solo destino calla y su firewall se ve | Firewall de entrada | «El router lo descarta» (el router contesta y el resto pasa); «`laptop-lucia` está apagada» (el sello llega a su firewall) |
| 7 | Ningún ping de tu laptop vuelve | Loopback y tu IP vuelven; ni el router contesta; el ✕ está en tu laptop | Firewall de salida | «El router está caído» (el paquete murió en tu laptop); «falta la puerta de enlace» (con ella el ping ni siquiera sale del firewall) |

**Nota de texto (estudiante, 2026-10-10).** El reporte de cada caso habla del ping que no vuelve (por ejemplo «Tu ping al servidor de internet no vuelve»), no de «abrir» ni de «entrar»: «no abre el servidor» suena a la web, que es del capítulo 3. Se revisaron los siete reportes con ese criterio: el 1 decía «no abre el servidor», el 4 «quiere la impresora», el 2 solo contaba qué anotó Lucía, y el 3, el 5, el 6 y el 7 hablaban de «llegar», «contestar» o «sacar» sin decir qué viaja. Los siete nombran ahora el ping. Los textos finales se escriben al ejecutar la Tarea 26 con el mismo criterio, y una prueba lo guarda (`01-14: every case report names a ping that does not come back and none uses a verb of the web`).

## Cambios visibles del capítulo 4

Lo que ve quien juega el 04-01 y el 04-02 con este plan. Las trazas y el test dorado no cambian.
- **Glosario más largo.** Antes de pisar el capítulo 4 el jugador conoce los términos del capítulo 1 (38 en lugar de 18).
- **El 04-02 deja de presentar `least-privilege`.** Su insignia «nuevo» desaparece; el texto no cambia.
- **Por D-5:** la caja de `servidor1`, `servidor2`, `Tu Mac` y `Atacante` suma su IP pública.
- **Las piezas dependen de los términos que se conocen, no de que haya un actor.** El borde y internet se dibujan en el 04-01 como hoy (`internet-gateway` y `internet` ya se conocen), y los tests de piezas lo fijan.
- **Progreso reseteado (D-1).** Todas las estrellas guardadas, también las del 04-01 y el 04-02, desaparecen. El 04-01 se abre cuando el 01-14 tiene una estrella.
- **El texto del firewall de una laptop** (solo el capítulo 1) deja de decir que «recuerda la conversación» y no da ninguna razón de por qué la respuesta pasa.
- **Todas las tarjetas cambian de aspecto (Tarea 11a).** Las del 04-01 y el 04-02 también pasan al estilo B: franja de título oscura con icono y tipo, esquinas redondeadas, borde grueso, sombra, interruptor, opciones con letra y el botón primario como sello. Lo que dicen y lo que calculan no cambia, y sus tests siguen sin cambiar de contenido; las capturas de `#/entidades` sí cambian, a propósito.
- **Sin pestañas todavía.** La tarjeta del Security Group sigue sin pestañas mientras no tenga reglas de salida abiertas (Tarea 15).
- **El botón primario pasa a ser el sello.** «Enviar solución», «Enviar», «Ver resultado» y «Siguiente incidente» dejan de ser un botón relleno: son una pastilla sin relleno, con borde discontinuo, en mayúsculas y un poco inclinada; al pulsarla baja 2 px, salvo con movimiento reducido. Su nombre accesible no cambia (decisión del estudiante, 2026-10-10).

## Review Focus

Cada riesgo, con la prueba que lo guarda.

1. **El capítulo 4 no cambia.** Test: `chapter 4 golden traces keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model` (el de hoy, sin tocar) y, en las Tareas 3 a 9, `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Un test más: `the new trace fields are absent from every trace of a VPC`.
2. **El firewall del 05 no se nombra antes del 11.** Tests: `shows no firewall, in any text or piece, before the incident that introduces it` (Tarea 11, ampliado en la 24) y `a packet dropped by a firewall the player does not know yet leaves a lost stamp, not a blocked one`. Cubre piezas, sellos, motivos, etiquetas y los textos de los saltos 6 a 10.
3. **Nada de lo que viene después.** Test: `names no topic of the chapters that come later, in any text of chapter 1` (Tarea 20): puerto, TCP, UDP, CIDR, máscara, NAT, DNS, ARP, MAC, switch, IPv6, HTTP, cliente, servidor como rol, stateful y stateless. La salida de la oficina no nombra NAT ni IP pública: `the trip out of the office has no step and no reason that names NAT or the public IP`.
4. **El silencio y el aviso no se confunden.** Tests: `an outbound firewall silences a packet to an IP nobody has, so the sender never warns` y `a private address is dropped by the first router outside the office, with no warning`.
5. **El TTL cuenta bien.** Tests: `in a loop between two routers the router that discards alternates with the TTL` y `with TTL 1 the first router warns; with TTL 2 the second`. La explicación del 09 se apoya en esa cuenta.
6. **La respuesta no se bloquea, y ningún texto dice por qué.** Tests: `the reply of a ping is never stopped by a firewall, outbound or inbound` y `the reply through the firewall of a laptop gives no reason for letting it through`.
7. **Cada término, en su incidente, sin adelantos.** Tests: los de la escalera de hoy sobre los 14 (`only uses terms introduced in it or before`, `names each chip after a term, by its official name`), más `introduces, incident by incident, the terms of the approved design` (Tarea 20 en adelante) y `04-01 bridges exactly the chapter 1 terms that no chapter 1 incident introduces yet` (Tarea 20), que en la 26 exige un puente vacío.
8. **Los casos del 14 se cuentan bien.** Tests: `the middle star is no hint asked in any case`, `the explained star needs every cause right at the first try` y `each case starts from the world before the incident plus its own changes, not from the case before`.
9. **Un almacenamiento limpio.** Test: `starts empty and removes the progress saved under the old key`. No hay migración (D-1).
10. **Un texto de aviso no cita el de ningún sistema.** Test: `the text of a warning quotes no operating system and says only what the player saw`.
11. **Un mapa con más piezas no se amontona.** Tests de Playwright (Tarea 27): `after the pings of 08, no label or stamp overlaps`, `in 06 the open terminal covers neither the router nor the labels of the second floor` y `in 06, 08 and 10 the whole map and its labels fit the area of the map at full size`, a 1280×800 y a 1440×900. Con V6 b cada incidente dibuja solo lo que usa y a tamaño completo; el ajuste lo prueba la Tarea 27 y el sitio de cada pieza, la 16.
12. **Las capturas cambian solo lo que se quiso.** Cada vez que se regraban (Tareas 11a, 11b, 16 y 17): en la 11a el diff es el repintado de las tarjetas y del botón primario como sello, que el estudiante aprobó en el prototipo del inventario, y nada más se mueve (la captura de piezas no cambia); en la 11b, la 16 y la 17 el diff muestra solo los especímenes nuevos. Playwright `entities` pasa después.
13. **Carpetas.** `pnpm structure` pasa en cada tarea; el tope de 12 no se rompe.
14. **Texto llano.** Los hitos de prueba humana (Tareas 20, 21, 23, 25 y 26) son la comprobación: el estudiante lee cada bloque y dice si algún mensaje lo pierde.
15. **Rigor, sin simplificar a lo falso (D-11).** Ninguna opción, recomendada o no, enseña algo inexacto. Tests: `01-13: no text of the incident says or suggests that a firewall closes its outbound side by default`, `the empty outbound list of a host firewall never says that a closed outbound side is the default of a firewall`, `calls the setting by its term, the default gateway, and not by the label of any operating system`, `the reply through the firewall of a laptop gives no reason for letting it through`, `the text of a warning quotes no operating system and says only what the player saw` y `01-14: every case report names a ping that does not come back and none uses a verb of the web`. Y la lectura del estudiante en las pruebas humanas.
16. **La dependencia nueva.** Los tests de `Tabs` (teclado con `user-event`, la pestaña elegida y las clases del sistema de diseño) y el cierre de la Tarea 11b: `package.json` con la versión exacta, sin `^` ni `~`, y `pnpm-lock.yaml` que solo agrega paquetes `@radix-ui/*`. Ninguna otra tarea toca esos dos archivos.
17. **Un estilo, una primitiva por familia.** En la Tarea 11a los tests de hoy de las primitivas y de las tarjetas del capítulo 4 pasan sin cambiar de contenido, el estudiante revisa el diff de las capturas contra el prototipo aprobado y no nace ninguna primitiva hermana (`DESIGN.md`). El botón primario sigue siendo `Button` `primary`; que sea un sello y que no se mueva con `prefers-reduced-motion` lo guarda la prueba `the primary button looks like a stamp and does not move when pressed under reduced motion` (Playwright, estilo calculado; punto 23 de «Decididas sin el estudiante»).
18. **La línea de una ficha sale al pulsar «Listo».** Tests de la Tarea 12: `pressing Listo with the wrong IP picked shows its feedback and leaves the task open`, `picking another chip hides the feedback line` y `Escape closes the card even when the chip picked has a feedback line`. Punto 22 de «Decididas sin el estudiante»: el jugador que cambia la ficha antes de pulsar «Listo» no la ve.

## Árbol al terminar (solo lo cambiado)

- `README.md` · `DESIGN.md` (el estilo B con el botón primario como sello, `Tabs`, la nueva estructura de `src/design/`, las variantes de V4 y V5 y las pruebas de estilo calculado)
- `package.json` y `pnpm-lock.yaml` (solo la Tarea 11b) · `.claude/rules/prefer-established-libraries.md` («Choices so far»)
- `docs/` (raíz del repo)
  - `specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md` · `specs/2026-10-09-follow-the-packet-chapter-1-design.md` (nota al inicio)
  - `plans/2026-10-10-follow-the-packet-chapter-1-fourteen.md` · `plans/follow-the-packet-roadmap.md` · `plans/2026-10-08-follow-the-packet-followups.md`
  - `research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 1)
- `src/design/`
  - `index.ts` y los tokens (`tokens.css`, `tokens.ts` y `tokens.test.ts`, sin mudar)
  - `primitives/` (nueva): `button.tsx`, `card.tsx`, `choice.tsx`, `name-tag.tsx`, `primitives.css` y los tests de botón y elección (mudados); `tabs.tsx`, `tabs.test.tsx` y `card.test.tsx` (nuevos); `CLAUDE.md`
- `src/engine/`
  - `index.ts`
  - `network/`: `schema.ts`, `types.ts`, `actions.ts` y sus tests; `naming/` (nuevo: `dns.ts`, `app-target.ts` y sus tests, mudados); `CLAUDE.md`
  - `simulation/`: `simulate.ts`, `context.ts`, `trace.ts`, `firewall-check.ts`, `traceroute.ts` (nuevo) y `traceroute.test.ts`, `simulate.test.ts`; `stages/`: `address.ts`, `forward.ts`, `route.ts` (nuevos o cambiados) y `CLAUDE.md`
  - `exposure/exposure.test.ts`
- `src/copy/`: `terms.ts`, `reasons.ts`, `packet-labels.ts`, `index.ts` y sus tests; `screens/` (nuevo: `ui.ts` e `incident-ui.ts`, mudados); `CLAUDE.md`
- `src/levels/`
  - `contract/` (nuevo): `incident.ts`, `incident.test.ts`, `chips.ts` (mudados y ampliados)
  - `index.ts`, `registry.ts`, `registry.test.ts`, `ladder.ts`, `ladder.test.ts`, `world.ts`, `world.test.ts`, `CLAUDE.md`
  - `04-iaas/`: `01-the-first-ping.ts` (el puente), `02-open-just-enough.ts` (sin `least-privilege`)
  - `01-first-day/`: `shared.ts`, `CLAUDE.md`
    - `where-you-are/`: `01-the-office.ts`, `02-the-envelope.ts`, `CLAUDE.md`
    - `the-ping/`: `03-are-you-there.ts`, `04-ping-yourself.ts`, `05-when-it-does-not-come-back.ts`, `CLAUDE.md`
    - `leaving-the-office/`: `06-your-network-and-the-router.ts`, `07-who-gets-whats-outside.ts`, `08-the-network-of-networks.ts`, `09-counting-hops.ts`, `10-seeing-the-path.ts`, `CLAUDE.md`
    - `the-guard/`: `11-the-guard.ts`, `12-your-first-rule.ts`, `13-in-and-out.ts`, `CLAUDE.md`
    - `first-watch/`: `14-final-watch.ts`, `cases.ts`, `CLAUDE.md`
    - Se borran los cuatro archivos de hoy (`01-the-address.ts` a `04-the-firewall.ts`)
- `src/game/`: `session.ts`, `tasks.ts`, `stars.ts`, `flow-runs.ts`, `incidents.test.ts`, `chapter-1.test.ts` (nuevo), `index.ts`, `CLAUDE.md`
  - `view/`: `pieces.ts`, `inspection.ts` y sus tests
  - `view/cards/` (nueva): `terminal-card.ts` y `firewall-card.ts` (mudados), `identify-card.ts`, `settings-card.ts` y `case-card.ts` (nuevos) y sus tests; `CLAUDE.md`
- `src/scene/`: `layout.ts`, `layout.test.ts`, `game-scene.tsx`; `entities/` (`device.tsx`, `packet.tsx`, `stamp.tsx`, `entity-icon.test.tsx`); `catalog/catalog-cells.tsx`; `traffic/flow-look.ts`
- `src/ui/incident/`: `incident-screen.tsx`, `explanation-card.tsx`, `inspection-box.tsx`, `result-card.tsx`, `case-card.tsx` y su test (nuevos); `lucia-card.tsx` (estilo B)
  - `map-cards/`: `chip-card.tsx` (estilo B; «Listo» con su propia salida, aparte de Escape), `terminal-card.tsx`, `task-card.tsx`, `identify-card.tsx` y `settings-card.tsx` con sus tests (los dos últimos, nuevos)
- `src/ui/`: `roadmap.tsx` (estilo B) y `catalog/interface-section.tsx` (estilo B y el especimen de `Tabs`)
- `src/storage/`: `progress.ts`, `progress.test.ts`
- `src/testing/`: `fixtures.ts`, `incidents.ts`, `index.ts`
- `tests/e2e/`: `chapter-1.spec.ts`, `entities.spec.ts` (las pruebas del sello y de las letras, Tarea 11a), `saved-progress.ts`, `incidents.spec.ts`, `roadmap.spec.ts` (solo si cambia algún nombre), `snapshots/` (dos capturas, regrabadas)

---

### Tarea 0: Prototipos y decisiones visuales (sin código del juego)

**Cerrada el 2026-10-10.** **Bloquea:** nada. Todo lo visual está decidido y escrito en «Decisiones visuales aprobadas»: V1 a V9 (en V6 el estudiante eligió la b), el inventario de tarjetas en estilo B (aprobado completo), el botón primario como sello y D-12 (fichas). Ninguna tarea del plan espera ya una elección del estudiante.

Propósito: que el estudiante vea, renderizadas, las opciones de lo que estaba abierto y elija. El 2026-10-10 eligió V1 a V9, aprobó el inventario completo del estilo B, eligió el botón primario como sello y decidió D-12. Es la única tarea de este plan sin código del juego.

**Archivos:**
- Modify: este documento (la sección «Decisiones visuales aprobadas», al final) y `../../docs/plans/follow-the-packet-roadmap.md` (suma la fila del capítulo 1 en catorce, en `en curso`).
- Fuera del repo: una página HTML de prototipos, publicada con la herramienta Artifact. Muestra, con las primitivas reales (colores y tokens de `DESIGN.md`) y no con dibujos de texto, las dos opciones nuevas de V6 en el 06, el 08 y el 10, el inventario de tarjetas en estilo B con el botón primario como sello junto al botón de hoy, y la tarjeta del 01.

**Pasos:**
- [x] Preparar la página de prototipos y mostrársela al estudiante (2026-10-10: V1 a V5 y V7 a V9 elegidas).
- [x] V6: mostrar las dos opciones del mapa que crece para el 06, el 08 y el 10; recoger una (2026-10-10: b, el mapa sigue la historia).
- [x] Inventario de tarjetas en estilo B y botón primario como sello: mostrarlos junto al botón de hoy y recoger la decisión (2026-10-10: inventario aprobado completo; sello elegido).
- [x] D-12: mostrar cómo da el 01 la IP de la impresora y recoger la elección (2026-10-10: fichas).
- [x] Escribir las elecciones en «Decisiones visuales aprobadas» y en «Decisiones abiertas» (que dice que no queda nada abierto). Si el estudiante pide un aspecto nuevo para un elemento, la tarea correspondiente suma una variante a su primitiva (`DESIGN.md`, «Adding a variant instead of a new element») y esa tarea cambia la captura de la interfaz a propósito.
- [x] Sumar la fila del capítulo 1 en catorce al roadmap, en `en curso`.

**Cierre:** de esta tarea solo cambian los dos documentos (el resto de `git status --short` no es suyo). Commit: `docs: record the visual decisions for the fourteen subchapters`.

---

### Tarea 1: Estructura sin cambio de comportamiento

**Propósito:** darle sitio a lo que viene. Mudanza pura: ni una línea de lógica cambia.

**Archivos:**
- Modify: el registro (`src/levels/registry.ts`, y su glob para ver los archivos de las carpetas de bloque), los imports de todo lo que mude, las guías `CLAUDE.md` afectadas.
- Move: `src/levels/incident.ts`, `incident.test.ts` y `chips.ts` a `src/levels/contract/`; `src/engine/network/dns.ts`, `dns.test.ts`, `app-target.ts` y `app-target.test.ts` a `src/engine/network/naming/`; `src/copy/ui.ts` y `src/copy/incident-ui.ts` a `src/copy/screens/`; `src/game/view/firewall-card.ts`, `terminal-card.ts` y `terminal-card.test.ts` a `src/game/view/cards/`.
- Create: `CLAUDE.md` de cada carpeta nueva (`contract/`, `naming/`, `screens/`, `cards/`).
- Los imports de los archivos de incidente pasan de `@/levels/incident` a `@/levels/contract/incident`; los barrels de `@/levels`, `@/engine`, `@/copy` y `@/game` siguen exportando lo mismo.

**Interfaces:** el glob del registro pasa a ver archivos de capítulo y de una carpeta de bloque debajo de él. Después de la mudanza: `src/levels/` queda en 9 archivos, `src/engine/network/` en 7, `src/copy/` en 9 y `src/game/view/` en 6. Las tarjetas nuevas (`identify-card`, `settings-card`, `case-card`) y el test de `firewall-card` irán a `src/game/view/cards/`, que queda en 3 y llega a 10.

**Tests:** ninguno nuevo; el criterio es que **todos los de hoy pasen sin cambiar su contenido**. El glob nuevo se prueba de verdad en la Tarea 20, cuando entran las carpetas de bloque.
- `git diff -M --stat` muestra solo renombres y cambios de import.
- `pnpm check` verde. `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida.

**Commit:** `refactor: make room in the full folders and add the block folders of chapter 1`.

---

### Tarea 1a: Sitio en `src/design/`

**Propósito:** `src/design/` tiene 11 archivos de los 12 que permite `folder-structure`; la primitiva `Tabs` con su test lo llevaría a 13. Mudanza pura, sin cambio de comportamiento, y antes del estilo B (Tarea 11a): así el diff de esa tarea, que reescribe el CSS de las primitivas, no queda enterrado entre renombres. Es la división que `DESIGN.md` pide para este caso (paso 4 de «Adding a variant instead of a new element»). **Bloquea:** 11a y 11b.

**Archivos:**
- Move: de `src/design/` a `src/design/primitives/`: `button.tsx`, `button.test.tsx`, `card.tsx`, `choice.tsx`, `choice.test.tsx`, `name-tag.tsx` y `primitives.css`.
- Create: `src/design/primitives/CLAUDE.md` (el chequeo de estructura exige la guía de cada carpeta).
- Modify: `src/design/index.ts` (las rutas de los re-exports; exporta lo mismo), `src/styles.css` (el `@import` de `primitives.css`), `src/design/CLAUDE.md` (qué queda en la raíz y qué en `primitives/`), `DESIGN.md` (la frase «holds 11 of the 12 files» y las rutas que cita).
- No se tocan: `tokens.css`, `tokens.ts` y `tokens.test.ts` se quedan en la raíz de `src/design/`. Así no cambian el `css.include` de `vite.config.ts` (que busca `/design/tokens.css`), el import `?raw` de `tokens.ts` ni la ruta que citan `.claude/rules/no-magic-strings.md` y `.claude/az-rules.json`.

**Interfaces:** después de la mudanza, `src/design/` queda con 4 archivos (`index.ts` y los tres de los tokens) y `primitives/` con 7. `Tabs` y su test llevan `primitives/` a 9; si el estilo B suma un test de `Card`, a 10; quedan dos de margen. Los consumidores siguen importando `@/design`.

**Tests:** ninguno nuevo; todos los de hoy pasan sin cambiar su contenido (los de `button`, `choice` y `tokens` y los de las pantallas).
- `git diff -M --stat` muestra solo renombres, las rutas de los re-exports y el `@import`.
- `pnpm check` verde, con las dos capturas de `#/entidades` iguales píxel a píxel (esta tarea no las toca). `pnpm lint` y `scripts/eslint-config.test.ts` siguen verdes: la regla de capas cubre las subcarpetas de `src/design/` (el diseño no importa otra capa). `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida.

**Commit:** `refactor: move the design primitives to their own folder to make room for Tabs`.

---

### Tarea 2: Los términos nuevos en el registro

**Propósito:** que los motivos y los textos de las tareas siguientes puedan etiquetar los términos nuevos. Un término registrado y aún no presentado por ningún incidente es inerte: ningún test exige que lo presente alguien.

**Archivos:**
- Modify: `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/copy/CLAUDE.md`.

**Interfaces:** ids nuevos (nombre oficial entre paréntesis, definición de 120 caracteres o menos, sin términos que se presentan después): `header` (encabezado), `loopback` (loopback), `localhost` (localhost), `rtt` (RTT, tiempo de ida y vuelta), `timeout` (timeout), `host-unreachable` (Destination Host Unreachable), `lan` (red local, LAN), `default-gateway` (puerta de enlace predeterminada), `hop` (salto), `ttl` (TTL), `time-exceeded` (Time Exceeded), `traceroute` (traceroute), `drop` (descartar), `allow` (permitir), `deny` (denegar), `default-deny` (denegación por defecto), `inbound` (entrada), `outbound` (salida): 18 ids. `source-ip` (IP de origen) y `destination-ip` (IP de destino) se registran en la Tarea 20: la definición de hoy de `packet` («con la dirección IP de origen y la de destino») y la de `router` («según su dirección IP de destino») las nombran, el test de la escalera lo rechazaría mientras esos dos términos sean de los incidentes de hoy, y la Tarea 20 reescribe `packet`. Las definiciones de los ids que ya existen, y el retiro de `request` y `response` (D-7: B) y la nota «(host)» de `device` (D-8: A), cambian en la tarea del incidente que los presenta, no aquí: los incidentes de hoy siguen en el registro hasta la Tarea 19 y los usan.

**Tests:**
- `terms.test.ts`, `registers the terms the engine and the cards need from the start`: los 18 ids de arriba existen en `TERMS`.
- Los tests de hoy corren sobre los ids nuevos sin cambiar: `%s has a name and a short definition` (120 caracteres o menos), `ids are English kebab-case` y `only the IP address and the Security Group have a short form`.
- `ladder.test.ts`, `a term is introduced by one incident at most`: sigue verde, porque ningún término nuevo lo presenta aún ningún incidente.
- `ladder.test.ts`, `defines its new terms without naming a term the player does not know yet`: sigue verde. Se comprobó a mano que ninguna definición de hoy contiene el nombre de los 18 ids (salvo «IP de origen» y «IP de destino», que son los dos que se mudan a la Tarea 20).

**Cierre:** `pnpm check` verde. **Commit:** `feat(copy): register the terms of the fourteen subchapters`.

---

### Tarea 3: Direcciones inválidas, `localhost` y loopback

**Propósito:** el 01 y el 02 necesitan una IP inválida que no sale; el 04, el loopback.

**Archivos:**
- Create: `src/engine/simulation/stages/address.ts`.
- Modify: `src/engine/simulation/simulate.ts` (registra la etapa), `src/engine/simulation/trace.ts` (resultado y motivos nuevos), `src/engine/simulation/stages/route.ts` (loopback), `src/copy/reasons.ts`, `src/copy/packet-labels.ts` (`OUTCOME_TEXT`), `src/engine/CLAUDE.md` y `src/engine/simulation/stages/CLAUDE.md`.
- Test: `src/engine/simulation/simulate.test.ts`, `src/copy/reasons.test.ts`, `src/copy/packet-labels.test.ts`.

**Interfaces:** `address` va antes de `dns`. Un literal de cuatro grupos numéricos que no es IPv4 (un número mayor que 255) termina en `invalid-address` con el motivo `address-invalid`, sin pasar por el DNS. `localhost` resuelve a `127.0.0.1` con `address-localhost`, sin consulta. Cualquier `127.x.x.x` (RFC 1122) se entrega al propio dispositivo con `route-loopback`, sin firewalls de salida ni de entrada, y responde.

**Tests:**
- `an address with a number above 255 never leaves the device and is not looked up as a name`: resultado `invalid-address`, un solo paso, ninguno de DNS.
- `an address with the wrong number of groups is a name, not an invalid address`: `192.168.1` sigue como un nombre y termina en `unresolved`.
- `localhost resolves to loopback without asking the DNS`: el primer paso es `address-localhost` y el siguiente `route-loopback`.
- `127.0.0.1 and any other 127 address answer from the same device`: `127.5.5.5` responde.
- `a loopback ping skips both firewalls of the device`: un dispositivo con firewall sin reglas recibe respuesta; no hay pasos de firewall.
- `the steps of a ping to your own IP stay as they were`: la prueba de hoy sobre `route-self` sigue verde.
- `reasons.test.ts`, `describes address-invalid, address-localhost and route-loopback with registered terms only`.
- `packet-labels.test.ts`, `says that an invalid address never left the device`.
- Cierre: `git diff --exit-code src/levels/04-iaas/golden-traces.json`.

**Commit:** `feat(engine): validate IPv4 literals and answer loopback and localhost`.

---

### Tarea 4: El modelo de la oficina

**Propósito:** pisos, routers, puerta de enlace, dispositivos sin conexión y un servidor de internet, solo como datos.

**Archivos:**
- Modify: `src/engine/network/schema.ts`, `types.ts`, `actions.ts`, `src/engine/index.ts`, `src/engine/network/CLAUDE.md`, `src/testing/fixtures.ts` (una oficina de dos pisos con router, proveedor y servidor, `officeTwoFloorsNet`).
- Modify, solo tipos, para que `pnpm typecheck` siga verde al sumar `Actor.kind = 'server'`: `src/copy/terms.ts` (`EntityVariants.actor`), `src/copy/screens/incident-ui.ts` (`ACTOR_ROLE_TEXT`), `src/scene/catalog/catalog-cells.tsx` (`actorCell`), `src/scene/entities/actor.tsx`, `src/game/view/pieces.ts` y `src/game/view/inspection.ts` (su `actor(...)` indexa `ACTOR_ROLE_TEXT` con el tipo del actor). Un actor `server` no se dibuja ni se inspecciona como actor (V5 b): esos sitios pasan a tomar el tipo de los actores que sí lo son, sin `server`, y `pieceViews` no dibuja un actor `server` hasta la Tarea 16.
- Test: `src/engine/network/schema.test.ts`, `src/engine/network/actions.test.ts`, `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts`.

**Interfaces:** ver «Modelo de la red». Esta tarea no cambia la simulación.

**Tests:**
- `schema.test.ts`, `accepts an office with two LANs, a router between them and a server of the internet`.
- `rejects a device whose IP is outside its LAN`.
- `rejects a gateway that is not an IPv4 address`.
- `rejects two interfaces or devices with the same IP, even on different routers`.
- `rejects a router interface that faces an unknown LAN, router or server`.
- `rejects a route through an unknown router`.
- `keeps accepting the chapter 1 office of today, with one range and no routers`.
- `rejects a VPC that declares LANs or routers`.
- `actions.test.ts`, `connectDevice plugs a device into the network`.
- `setGateway sets and clears the gateway of a device`.
- `addLan, addDevice and addRouter grow an office and keep it valid`.
- `updateRouter replaces the routes and the unreachable behavior of a router`.
- `actions on unknown ids return the same network`.
- `pieces.test.ts`, `an actor of kind server is not drawn as an actor piece` (la Tarea 16 lo reemplaza por el dibujo como pieza de dispositivo).
- `inspection.test.ts`, `an actor of kind server is not inspected as an actor` (la Tarea 16 lo reemplaza por la caja de un dispositivo).
- Cierre: golden sin cambios.

**Commit:** `feat(engine): model floors, routers, gateways and servers of the internet`.

---

### Tarea 5: Entrega en la red local y por la puerta de enlace

**Propósito:** la decisión local o remota (RFC 1122), el aviso de la propia laptop ante una IP sin dueño y el error local sin puerta de enlace.

**Archivos:**
- Create: `src/engine/simulation/stages/forward.ts`.
- Modify: `src/engine/simulation/stages/route.ts`, `simulate.ts`, `trace.ts` (resultados `no-route` y `unreachable`, `Trace.notice`, motivos), `context.ts`, `src/copy/reasons.ts`, `src/copy/packet-labels.ts`, `src/engine/simulation/stages/CLAUDE.md`.
- Test: `src/engine/simulation/simulate.test.ts`, `src/copy/reasons.test.ts`.

**Interfaces:** el orden de etapas es el de «Traza». `route` decide: loopback, la propia IP, red local (directo) o remoto (puerta de enlace). Sin puerta de enlace para un destino remoto, o desconectado, termina en `no-route` y no hay aviso. `forward` entrega: en la red local busca un dispositivo conectado con esa IP y, si no hay, la propia laptop avisa (`unreachable`, `notice.kind = host-unreachable`, `fromId` el emisor). Si la puerta de enlace es un dispositivo que no es un router, el paquete llega a él y se pierde en silencio (`timeout`). El comportamiento de la VPC no se toca.

**Tests:**
- `a device on the same LAN is reached directly, with no router and no hop`.
- `an IP no device of the LAN has gives a host-unreachable warning from the sender itself`.
- `an IP of another LAN with no gateway set stops at the sender with no-route and no warning`.
- `a device that is not connected neither sends nor receives`.
- `a gateway IP that no device has gives a host-unreachable warning from the sender`.
- `a gateway that is a printer receives the packet and drops it, so nothing comes back`.
- `an outbound firewall silences a packet to an IP nobody has, so the sender never warns`.
- `a packet to a device of another LAN goes through the router of its gateway`.
- `the VPC keeps saying lost for an IP no instance has`.
- Cambia a propósito (el comportamiento anterior pasa a este): `simulate.test.ts`, `an IP of the office that no device has: the packet is lost in the network` → `an IP of the office that no device has gives a host-unreachable warning from the sender`.
- `reasons.test.ts`, `describes route-no-gateway, route-not-connected, route-gateway-not-a-router and forward-no-owner with registered terms only`.
- Cierre: golden sin cambios.

**Commit:** `feat(engine): deliver in the local network and through the default gateway`.

---

### Tarea 6: Saltos, TTL, avisos, bucles e internet

**Propósito:** los routers restan 1 al TTL; con 0 descartan y avisan; el camino a internet con un servidor que contesta; la IP privada que internet no enruta.

**Archivos:**
- Modify: `src/engine/simulation/stages/forward.ts`, `route.ts`, `reply.ts`, `host.ts`, `context.ts`, `trace.ts` (`Trace.hops`, `ttl-exceeded`, motivos), `src/engine/exposure/exposure.test.ts`, `src/copy/reasons.ts`, `src/engine/simulation/CLAUDE.md`.
- Test: `src/engine/simulation/simulate.test.ts`, `src/engine/exposure/exposure.test.ts`, `src/copy/reasons.test.ts`.

**Interfaces:** cada router que cruza el paquete le resta 1 al TTL; si queda en 0, lo descarta y avisa con Time Exceeded desde su interfaz del lado de quien envía, y el resultado es `ttl-exceeded` (RFC 1812, §5.3.1 y §4.3.2.4). El siguiente salto sale de las rutas del router; un bucle es dos rutas que se apuntan. Un router sin ruta calla o avisa según `sendsUnreachable`. Un router que ve una dirección privada de destino y no tiene esa red conectada la descarta sin aviso (`forward-private-dropped`), y la salida de la oficina no escribe ningún paso de NAT ni de IP pública. Un actor `server` detrás de la última interfaz contesta. Un router contesta un Echo Request dirigido a una de sus interfaces. La respuesta no atraviesa ningún firewall.

**Tests:**
- `each router the packet crosses takes one from the TTL`.
- `a packet whose TTL reaches zero at a router is discarded and that router warns with Time Exceeded from its interface towards the sender`.
- `with TTL 1 the first router warns; with TTL 2 the second`.
- `in a loop between two routers the router that discards alternates with the TTL`.
- `a ping to a server of the internet crosses every router and the server answers`.
- `a private address is dropped by the first router outside the office, with no warning`.
- `a router with no route stays silent or warns, depending on its setting`.
- `an IP no server has, behind the last router, gets a host-unreachable warning from that router`.
- `the trip out of the office has no step and no reason that names NAT or the public IP`.
- `a router answers the ping sent to one of its own interfaces`.
- `the reply of a ping is never stopped by a firewall, outbound or inbound`.
- `a packet from the internet to a private address of the office is still lost in the internet`.
- `exposure.test.ts`, `the probe battery still finds the extra opening of an open rule in an office with two LANs`.
- `reasons.test.ts`, `describes forward-hop, forward-ttl-exceeded, forward-no-route, forward-private-dropped and forward-router-replies with registered terms only`.
- Cierre: golden sin cambios.

**Commit:** `feat(engine): forward through routers with TTL, warnings and loops`.

---

### Tarea 7: Cabecera, respuesta invertida y RTT

**Propósito:** el 02 y el 03 enseñan el encabezado; el 04 y el 10, el tiempo.

**Archivos:**
- Modify: `src/engine/simulation/simulate.ts`, `trace.ts` (`Trace.header`, `Trace.rttMs`), `context.ts`, `stages/reply.ts`, `src/engine/network/schema.ts` (`PacketSpec.ttl`), `src/engine/CLAUDE.md`.
- Test: `src/engine/simulation/simulate.test.ts`.

**Interfaces:** ver «Traza». El origen del encabezado es el privado aunque el paquete salga de la oficina. El RTT suma las latencias de los tramos recorridos, ida y vuelta; el de un loopback es el más pequeño de todos. Un aviso cuenta solo hasta quien avisó.

**Tests:**
- `the request header carries the IP of the sender, the IP of the destination and the TTL it left with`.
- `the reply header swaps source and destination`.
- `the header keeps the private source across the router`.
- `the round trip time adds the latency of every leg, there and back`.
- `a loopback round trip is the smallest of all`.
- `a warning's time counts only up to the device that warned`.
- `the new trace fields are absent from every trace of a VPC`.
- Cierre: golden sin cambios.

**Commit:** `feat(engine): carry the header and the round trip time in the trace`.

---

### Tarea 8: traceroute en el motor

**Propósito:** la salida del 10 sale de una sola función pura del motor.

**Archivos:**
- Create: `src/engine/simulation/traceroute.ts` y `traceroute.test.ts`.
- Modify: `src/engine/index.ts`, `src/engine/simulation/CLAUDE.md`.

**Interfaces:** una función que, dado un dispositivo de origen, un destino y un máximo de saltos (8 en el juego), corre una sonda por cada TTL de 1 hacia arriba y devuelve una lista de líneas: número de salto, la IP que avisó o ninguna, el RTT, y si llegó al destino. Termina al llegar al destino, al máximo o en el primer aviso de inalcanzable (punto 17 de «Decididas sin el estudiante»). Esa línea lleva la IP que avisó y `unreachable: 'host' | 'net'`, con su tiempo si avisó un router y sin tiempo si avisó el propio emisor.

**Tests:**
- `traceroute lists one line per router, in order, with the IP that warned and its time`.
- `traceroute ends with the destination when it answers`.
- `a router that stays silent gives a line with no IP`.
- `traceroute in a loop alternates the two routers until the maximum of hops`.
- `traceroute stops at the maximum of hops`.
- `traceroute from a device with no gateway gives no lines and the local error`.
- Cierre: golden sin cambios.

**Commit:** `feat(engine): add traceroute as a pure function of the engine`.

---

### Tarea 9: Reglas de salida del firewall de un equipo, en el motor

**Propósito:** el 13 necesita agregar y quitar reglas de salida.

**Archivos:**
- Modify: `src/engine/network/actions.ts`, `schema.ts` (la acción), `src/engine/network/CLAUDE.md`.
- Test: `src/engine/network/actions.test.ts`, `src/engine/simulation/simulate.test.ts`.

**Interfaces:** `addRule` y `removeRule` aceptan `direction`; sin él, entrada, como hoy. Nota de la implementación: `direction` en `addRule` y `removeRule` y su esquema ya aterrizaron en la Tarea 4, así que esta tarea solo agregó las pruebas con nombre y la guía.

**Tests:**
- `addRule with direction outbound adds the rule to the outbound list`.
- `addRule without direction adds an inbound rule, as before`.
- `removeRule with direction outbound removes it`.
- `an outbound rule for the destination lets the ping leave and the reply is not filtered`.
- `an inbound rule on the sender does not let the packet out`.
- Cierre: golden sin cambios.

**Commit:** `feat(engine): add and remove outbound rules`.

---

### Tarea 10: El contrato del incidente y las tareas de envío

**Propósito:** que un incidente `send` pida el resultado que cada subcapítulo quiere y mande mensajes con TTL, traceroute o un paquete sin nombre.

**Archivos:**
- Modify: `src/levels/contract/incident.ts`, `incident.test.ts`, `chips.ts`, `src/levels/registry.test.ts`, `src/game/flow-runs.ts`, `src/game/tasks.ts`, `src/game/view/cards/terminal-card.ts`, `src/copy/screens/incident-ui.ts`, `src/levels/CLAUDE.md`, `src/levels/contract/CLAUDE.md`, `src/game/view/CLAUDE.md`.
- Test: `src/levels/contract/incident.test.ts`, `src/game/tasks.test.ts`, `src/game/view/cards/terminal-card.test.ts`, `src/levels/registry.test.ts`.

**Interfaces:** ver «Contrato del incidente». `officeLeaks` solo señala una fuga cuando el mundo de la oficina no tiene routers. La terminal escribe la sintaxis de Linux (D-10: B): `ping -t 3 <ip>` para un TTL (`-t` es la opción de TTL de iputils), `traceroute -I <ip>` para el traceroute (el motor envía ICMP Echo, y `-I` es la opción que lo pide) y «paquete de A a B» para `command: packet`. En el Mac del estudiante `-t` es otra cosa (un tiempo límite), así que la línea no se copia tal cual allí.

**Tests:**
- `incident.test.ts`, `accepts an expected outcome that is a warning, a silence or a local error`.
- `rejects a ping with a TTL outside 1 to 255`.
- `rejects a TTL on a message that is not a ping`.
- `builds the packet of three chips with the TTL of the message chip`.
- `a traceroute message builds no single packet`.
- `a packet that leaves an office with no router is a leak; with a router it is allowed`.
- `tasks.test.ts`, `a send task holds when the last packet with its chips ends in the expected outcome and by the expected id`.
- `an expected outcome of reached holds when the packet got to the destination, with or without a reply`.
- `a task that expects silence does not hold when something came back`.
- `terminal-card.test.ts`, `the line of a ping with a TTL uses the option -t of Linux`.
- `the line of a traceroute is the Linux command with -I, because the engine sends ICMP Echo`.
- `the line of a packet message does not say ping`.
- `registry.test.ts`, `every expected id names something in the start world of its incident`.
- Los tests de hoy de `officeLeaks` se actualizan a este comportamiento; los demás siguen.

**Commit:** `feat(levels): ask for richer results and send messages with a TTL or a traceroute`.

---

### Tarea 11: Causas ocultas por lo que el jugador conoce

**Desbloqueada: V7 (a) está decidida.** Propósito: el firewall del 05 no se ve, no se nombra y no deja un sello de «Bloqueado» hasta que el término `firewall` se presente. Mientras tanto, el paquete que frena queda en la puerta del equipo con el sello de perdido, la «?» (V7 a, 2026-10-10).

**Archivos:**
- Modify: `src/game/view/pieces.ts` (una pieza se dibuja cuando su término es conocido; reemplaza la regla de «hay un actor»), `src/game/flow-runs.ts` (`blocked` solo si el firewall que frenó es un término conocido), `src/game/view/inspection.ts`, `src/game/session.ts` (pasa lo conocido), `src/copy/reasons.ts` (`describeReason` con lo conocido; y el texto del paso de la respuesta de un firewall de laptop, que deja de decir que «recuerda la conversación» y no da ninguna razón de por qué la respuesta pasa: «Llega la respuesta»), `src/copy/packet-labels.ts`, `src/game/view/CLAUDE.md`, `src/copy/CLAUDE.md`; `src/scene/layout.ts` y su test, solo si el final del recorrido de un paquete perdido se calcula allí.
- Test: `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/ladder.test.ts`, `src/game/flow-runs` (en `session.test.ts`), `src/copy/reasons.test.ts`.

**Interfaces:** `describeReason(reason, net, known)`: si el término que nombra la causa es desconocido, el texto dice solo que no volvió nada («No volvió ninguna respuesta»). Con `firewall` conocido y `rule` desconocido, dice que el firewall lo descartó sin avisar, sin hablar de reglas. Con ambos, el texto de hoy. Lo mismo para el aviso de una IP sin dueño mientras `host-unreachable` sea desconocido. El resultado del paquete es el mismo; solo cambia lo que se muestra. Dónde termina el recorrido de un paquete que frena un firewall desconocido lo fija V7 (a): en la puerta del equipo que lo tiene y con el sello de perdido, no en el camino antes de la puerta.

**Tests:**
- `does not draw a firewall piece until its term is known`.
- `draws the router and the internet once their terms are known, with or without an actor`.
- `still draws the edge and the internet of chapter 4 in 04-01`.
- `a packet dropped by a firewall the player does not know yet leaves a lost stamp, not a blocked one`.
- `a packet dropped by a firewall the player does not know yet says only that nothing came back`.
- `a packet stopped by a firewall the player does not know yet ends at the door of its device, with the lost stamp`.
- `the device does not list its firewall until the firewall is known`.
- `describes a reason with the terms the player knows`.
- `the outcome text of a packet says only that it arrived while Echo Reply is not a known term`.
- `reasons.test.ts`, `the reply through the firewall of a laptop gives no reason for letting it through`: el texto no contiene «conversación», «recuerda», «mismo camino», «porque» ni «stateful».
- `shows no firewall, in any text or piece, before the incident that introduces it` (con un incidente de prueba por ahora; la Tarea 24 lo amplía a los reales).
- Los de hoy de la escalera siguen verdes; el golden no cambia.

**Commit:** `feat(game): show pieces, stamps and reasons only as far as the player knows`.

---

### Tarea 11a: El estilo B en todas las tarjetas del juego

**Desbloqueada.** El 2026-10-10 el estudiante aprobó el inventario de tarjetas en estilo B completo y eligió el botón primario como sello (filas «V8 · inventario» y «Botón primario · sello» de «Decisiones visuales aprobadas»). Necesita la Tarea 1a. **Bloquea:** 11b, 12, 13, 14 y 15, para que las tarjetas nuevas se construyan ya en el estilo B.

Propósito: V8, decidida el 2026-10-10. El estilo B del prototipo aprobado es el estilo NUEVO de todas las tarjetas del juego, también las del capítulo 4: franja de título oscura con icono y tipo, esquinas de 14 px, borde grueso, sombra hacia abajo, interruptor, opciones con letra y el botón primario como sello. Es una tarea del sistema de diseño: sigue habiendo UNA primitiva por familia; el estilo cambia la primitiva y nunca suma hermanas (`DESIGN.md`). Se escribe a nivel de contrato y en el detalle visual manda el prototipo aprobado (sección V8 de la página de la Tarea 0).

**Archivos:**
- Modify: las primitivas `Card`, `Choice` (con `ChipTray`) y `Button` (`src/design/primitives/card.tsx`, `choice.tsx` y, solo si la variante necesita algo más que su clase, `button.tsx`) y `primitives.css`. `src/design/tokens.css`: el radio de 14 px de la tarjeta, el de las fichas y las opciones y la sombra hacia abajo no tienen token hoy; entran con su papel y los valores del prototipo (`--radius-card`, `--radius-tile` y `--shadow-card`). Un par de color nuevo, como el texto sobre la franja oscura, se afirma en `tokens.test.ts` antes de salir; el texto `emphasis` sobre `surface` del sello ya lo afirma ese test (`--color-emphasis as text on surface`), así que no hace falta un par nuevo.
- Modify: los consumidores de `Card` que hoy dibujan tarjetas: `src/ui/roadmap.tsx` (las tarjetas de los capítulos), `src/ui/incident/lucia-card.tsx`, `explanation-card.tsx`, `inspection-box.tsx`, `result-card.tsx` y `map-cards/chip-card.tsx` (de la que cuelgan `task-card.tsx` y `terminal-card.tsx`). El inventario aprobado trae 11 tipos de tarjeta (12 con la variante «próximamente»): los siete de hoy (Lucía, explicación, resultado, caja de inspección, terminal, tarjeta de tareas de un firewall o Security Group, y capítulo del roadmap) y cuatro que llegan con las Tareas 12 a 15 (identificar, caso, Ajustes de red y firewall con pestañas).
- Modify: `src/ui/catalog/interface-section.tsx` y su texto en `src/copy/screens/ui.ts` (los especímenes: se suman el de `ChipTray` `segmented` con Sí / No y el de las opciones con letra; los del botón primario, deshabilitado y como enlace ya existen y se repintan), `src/design/CLAUDE.md`, `DESIGN.md` (el estilo B, el sello y, en «What guards the standard», que tres pruebas de Playwright miden estilo calculado: punto 23 de «Decididas sin el estudiante») y `tests/e2e/snapshots/interface-darwin.png`. `entities-darwin.png` no cambia: el inventario aprobado no toca el sello ni las etiquetas del mapa (el «sello» del estilo B es el botón primario).
- Modify: `tests/e2e/entities.spec.ts` (las tres pruebas de estilo calculado, abajo).
- Create: `src/design/primitives/card.test.tsx` (`Card` no tiene test hoy y gana estructura).
- Modify: `src/copy/screens/incident-ui.ts` y `src/ui/incident/incident-screen.test.tsx`: la leyenda de sellos (`SCREEN_TEXT.stampLegend`, que se muestra en la pantalla del incidente y en `#/entidades`) suma el sello del aviso, por ejemplo «! apareció un aviso», con palabras que no necesiten ningún término. La Tarea 17 la dejó sin cambiar porque el plan le prohibía tocar la captura de la interfaz; esta tarea ya la regraba, así que la leyenda entra aquí.
- No entra aquí: el especimen de `self-warned` (el aviso que genera el propio emisor y se queda en su puerta, que hoy no tiene especimen) iría en `src/scene/catalog/catalog-cells.tsx` y cambiaría `entities-darwin.png`; el inventario aprobado no trae fila de sello del mapa, así que esta tarea no lo suma.

**Interfaces:** ver «Sistema de diseño».
- `Card` gana, de forma opcional, una cabecera con título, icono y tipo. Quien no la pasa no la dibuja (`caller-controls-visibility`). El título sigue siendo el `h2` que nombra la tarjeta para los lectores de pantalla, y los `aria-labelledby` y los `role="dialog"` de hoy no cambian. El icono y el tipo son decorativos: quedan fuera del nombre accesible del `h2` (si el tipo aporta información, se lee aparte y no dentro del título), para que las búsquedas por encabezado de los tests de hoy sigan encontrándolo sin cambiar.
- `Choice`: la ficha como interruptor y la opción con letra. La letra sale de un contador de CSS (`counter-reset` en la lista de opciones, `counter-increment` en cada opción y la letra en `::before`): sin props nuevas y sin la letra en el texto de la página. La letra y el interruptor son marcas visuales: no cambian el nombre accesible ni `aria-pressed`. Las opciones con letra de la pregunta de Lucía y de los casos no delatan la correcta: la correcta cambia de lugar entre incidentes, como ya exige el plan.
- `ChipTray` gana la variante `segmented`, para Sí / No: dos fichas dentro de una sola pastilla partida en dos. Es una variante de la bandeja de siempre (en su variante y su mapa de clases), no una bandeja hermana, y no cambia el nombre accesible, `aria-pressed` ni el teclado de cada ficha. La pide el llamador; la Tarea 12 la pasa desde la marca `segmented` del contrato.
- **Botón primario como sello (decidido por el estudiante el 2026-10-10, en todas las tarjetas).** `Button` `primary` toma, como en el prototipo: fondo `surface`; texto y borde discontinuo (`dashed`, del grosor `stroke-bold`) en `emphasis`; forma de pastilla (`radius-pill`); mayúsculas con `tracking-caps`; inclinación fija de `rotate(-2deg)`; y `translateY(2px)` al pulsarlo. Sigue siendo la variante `primary`, con las clases `btn btn--primary`: no nace un botón hermano. Vale también para el primario como enlace (`href`). Estados: con `prefers-reduced-motion: reduce` no se mueve al pulsar, y el primario deshabilitado conserva la forma y la inclinación con los colores deshabilitados de hoy. Cuidado con dos reglas de hoy, `.btn:active { transform: none }` bajo `prefers-reduced-motion` y `.btn:disabled:active { transform: none }`: también quitarían la inclinación fija al pulsar; para el primario esos dos estados quitan solo el `translateY(2px)` y dejan `rotate(-2deg)`. El botón secundario y el pequeño toman las esquinas redondeadas y el borde grueso del inventario.
- La variante `soon` de `Card` sigue a media opacidad y su bajo contraste sigue siendo deliberado (`DESIGN.md`, «Contrast»).
- Lo que dice cada tarjeta y lo que calcula no cambia: solo cómo se ve. El tipo de cada tarjeta (el texto de la franja) sale de `src/copy/screens/` y nombra cada cosa por su nombre oficial (`rigorous-plain-copy`).

**Tests:**
- `card.test.tsx`, `shows the title, the icon and the type of the card in its header`.
- `names the card for a screen reader with its title`.
- `a card without a header draws no stripe`.
- `choice.test.tsx`, `an option keeps its sentence as its name and puts no letter in the page text` (jsdom no ve `::before`; la letra se prueba abajo, en el navegador).
- `a pressed chip is still announced as pressed, whatever it looks like`.
- `a segmented tray wears the class of its variant and keeps each chip announced as pressed or not`.
- `tokens.test.ts`, `keeps 4.5 to 1 for the text on the title stripe`, solo si el estilo suma ese par de colores.
- `incident-screen.test.tsx`, `the stamp legend names every stamp state, the warning included` (la misma leyenda de `#/entidades` la cubre `entities-page.test.tsx`).
- Playwright `entities` (`tests/e2e/entities.spec.ts`, con el especimen de la interfaz; miden estilo calculado y no el texto del CSS: punto 23 de «Decididas sin el estudiante»):
  - dentro de «Sin animaciones»: `the primary button looks like a stamp and does not move when pressed under reduced motion` (mayúsculas, borde discontinuo en `emphasis`, pastilla y la inclinación de `rotate(-2deg)`, igual en reposo y con el mouse pulsado).
  - en un grupo sin `reducedMotion`: `without reduced motion the pressed primary button moves 2 px down and keeps its tilt` (para que la anterior no pase por medir nada).
  - `the options of the interface specimen show the letters A, B and C and keep their sentence as their accessible name`.
- Los tests de hoy de `Button` (el primario sigue siendo `btn btn--primary`), `Choice`, `tokens`, de `task-card`, `terminal-card`, `lucia-card`, `incident-screen` y `roadmap` pasan sin cambiar su contenido: es lo que dice que las tarjetas del capítulo 4 siguen funcionando.
- Las capturas de `#/entidades`: solo `interface-darwin.png` se regraba **a propósito** con `pnpm exec playwright test entities --update-snapshots=all`. El diff de la interfaz es el repintado de todas las tarjetas y del botón primario como sello, que el estudiante revisa contra el prototipo aprobado; nada más se mueve, y `entities-darwin.png` no cambia. `pnpm check` verde; `incidents.spec.ts` y el humo del 01 siguen verdes.

**Commit:** `feat(design): restyle every card of the game in style B`.

---

### Tarea 11b: La primitiva `Tabs` con Radix

**Necesita las Tareas 1a y 11a** (nace en el estilo B). V9, decidida el 2026-10-10. **Bloquea:** 15.

Propósito: las pestañas «Entrada» y «Salida» de la tarjeta del firewall. La misma primitiva servirá después para la entrada y la salida del Security Group y de la NACL. Se hace con Radix (`@radix-ui/react-tabs`) porque el teclado de unas pestañas (las flechas, Inicio y Fin, un solo tope en el orden del Tab y los roles `tablist`, `tab` y `tabpanel`) es infraestructura genérica con casos borde que una librería ya resolvió (`prefer-established-libraries`).

**La versión (reglas `exact-dependency-versions` y `prefer-established-libraries`, y el requisito del estudiante).** Exacta, sin `^` ni `~`, y publicada al menos 14 días antes del día en que se instala. Quien implementa la elige ese día con `pnpm view @radix-ui/react-tabs time --json` (la última versión estable cuya fecha tenga 14 días o más) y comprueba, como pide la primera regla, `pnpm view @radix-ui/react-tabs version time.modified peerDependencies`. Se instala con la versión explícita, `pnpm add @radix-ui/react-tabs@<versión>` (con `saveExact: true`), sin confiar en la política de edad de pnpm para evitar una versión nueva. Comprobado el 2026-10-10: la última estable, 1.1.22, se publicó el 2026-10-05 (5 días antes) y no vale; la candidata es **1.1.21, publicada el 2026-07-24**, con sus ocho dependencias directas fijadas en versiones del 22 y el 24 de julio de 2026, tipos propios (`dist/index.d.ts`) y `react` 16.8 a 19 como peer (el proyecto usa 19.3.0). La 1.1.22 cumple los 14 días desde el 2026-10-19: si la tarea corre desde esa fecha, se vuelve a elegir. La etiqueta `next` (1.2.0, prerrelease) no se usa.

**Archivos:**
- Create: `src/design/primitives/tabs.tsx` y `tabs.test.tsx`.
- Modify: `package.json` y `pnpm-lock.yaml` (solo en esta tarea de todo el plan), `src/design/index.ts` (exporta `Tabs`), `src/design/primitives/primitives.css` (las reglas, con tokens y en estilo B), `src/design/CLAUDE.md` y `src/design/primitives/CLAUDE.md`.
- Modify: `DESIGN.md` (la fila de `Tabs` en la tabla de primitivas, con el porqué: ninguna primitiva cambia entre paneles con el teclado y los roles de una pestaña, así que no cabe como variante), `src/ui/catalog/interface-section.tsx` y `src/copy/screens/ui.ts` (el especimen y su leyenda), `tests/e2e/snapshots/interface-darwin.png`.
- Modify: `.claude/rules/prefer-established-libraries.md`, «Choices so far»: la librería, la versión, su fecha de publicación y la fecha de la comprobación. `prefer-radix` sigue sin decidirse y esto no adopta Radix Tooltip.

**Interfaces:** ver «Sistema de diseño». Radix monta solo el panel de la pestaña elegida (`Presence`) y por defecto activa la pestaña al enfocarla con las flechas; quien la usa guarda su estado por encima del panel (Tarea 15).

**Tests** (`tabs.test.tsx`, con `user-event`, cada interacción con `await`):
- `renders only the panel of the selected tab`.
- `marks the selected tab with aria-selected and the others without it`.
- `selects a tab when it is clicked and reports its id`.
- `moves the selection with the arrow keys, from the last tab to the first`.
- `goes to the first tab with Home and to the last with End`.
- `puts one tab in the tab order and the panel of the selected tab right after it`.
- `names the tab list for screen readers`.
- `wears the classes of the design system and no inline style`.
- Sin test sobre las reglas de CSS (elección del estudiante, 2026-10-09, `DESIGN.md`): lo que cuida los tokens es la captura de `#/entidades`, y TypeScript rechaza `className` y `style`.
- Playwright `entities`: la captura de la interfaz se regraba **a propósito** y el diff muestra solo el especimen de `Tabs`.
- Cierre: `git diff package.json` es una línea con la versión exacta, sin `^` ni `~`; el diff de `pnpm-lock.yaml` solo agrega paquetes `@radix-ui/*` y no cambia la versión de ninguna entrada que ya estaba; `pnpm check` verde.

**Commit:** `feat(design): add the Tabs primitive on Radix`.

---

### Tarea 12: La mecánica `identify` (01)

**Bloqueada por la Tarea 11a** (las tarjetas nuevas nacen en el estilo B, con la variante `segmented`). D-2 (A) y D-12 (fichas) están decididas.

**Archivos:**
- Create: `src/game/view/cards/identify-card.ts` y `identify-card.test.ts`, `src/ui/incident/map-cards/identify-card.tsx` y `identify-card.test.tsx`.
- Modify: `src/levels/contract/incident.ts` y su test, `src/game/session.ts`, `tasks.ts`, `stars.ts`, `view/pieces.ts`, `index.ts`, `src/ui/incident/incident-screen.tsx`, `src/ui/incident/map-cards/chip-card.tsx` (el botón «Listo» gana una salida propia, separada de Escape; las demás tarjetas siguen cerrando con las dos), `src/copy/screens/incident-ui.ts`, las guías de `game/`, `game/view/cards/` y `ui/incident/map-cards/`, `src/testing/incidents.ts`.

**Interfaces:** ver «Contrato del incidente», `identify.cards`, y el punto 22 de «Decididas sin el estudiante» (_para revisar_). La tarjeta es un `ChipCard` con una o más `ChipTray`. Las estrellas son las de `send`.
- **Cómo arranca.** Una bandeja puede traer `initialPick` (una de sus fichas, que llega elegida) y `segmented` (Sí / No). La sesión nace con esas fichas elegidas en `Session.answers`, y volver a empezar el incidente las repone. Una ficha elegida de partida no cumple una tarea por sí sola: la tarea se cumple cuando la ficha elegida es la que espera.
- **Cuándo sale la línea.** Una ficha puede traer una línea de `feedback`. Al pulsar «Listo» con una ficha elegida que la trae, la tarjeta muestra la línea (la de cada bandeja que la tenga) y sigue abierta; sin esa línea, «Listo» cierra como siempre. Elegir otra ficha esconde la línea. Escape cierra siempre. Que la línea ya salió es estado local de la tarjeta; el texto de la línea y qué ficha está elegida lo calcula `game` (`view-renders-domain-result`).

**Tests:**
- `incident.test.ts`, `accepts an identify incident`.
- `rejects an identify task whose chip the card does not offer`.
- `rejects two cards for the same device`.
- `accepts a tray that starts with a chip already picked`.
- `rejects an initial pick that names no chip of its tray`.
- `session.test.ts`, `a tray can start with a chip already picked`.
- `a task whose chip is not the one picked from the start stays open`.
- `starting the incident again puts the initial picks back`.
- `answering a card keeps the chip picked for that device and tray`.
- `a task holds when its chip is the one picked`.
- `picking another chip changes the answer`.
- `the incident closes only with every card task done, and asking a hint costs the middle star`.
- `answers are ignored once the incident is closed`.
- `pieces.test.ts`, `in an identify incident the devices with a card open it and have no lock`.
- `identify-card.test.ts`, `lists the trays of the device, the chip picked from the start and the feedback of the chip picked`.
- `lists a tray marked segmented as segmented`.
- `identify-card.test.tsx`, `shows the trays of the device and reports a pick`.
- `a tray starts with the chip already picked and announces it as pressed`.
- `shows no feedback line when a chip is picked, only after pressing Listo`.
- `pressing Listo with the wrong IP picked shows its feedback and leaves the task open`: la tarjeta sigue abierta, la ficha sigue elegida y la tarea no se cumple.
- `pressing Listo with a chip that has no feedback closes the card`.
- `picking another chip hides the feedback line`.
- `Escape closes the card even when the chip picked has a feedback line`.
- El genérico `starts with a task to fix` (`incidents.test.ts`) cubre que la ficha de partida no cumple ninguna tarea.

**Commit:** `feat(game): add the identify mechanic`.

---

### Tarea 13: La tarjeta «Ajustes de red» de la laptop (07)

**Bloqueada por la Tarea 11a** (las tarjetas nuevas nacen en el estilo B). V3 b, decidida el 2026-10-10: la puerta de enlace predeterminada es un ajuste guardado del dispositivo y no parte de un comando (en macOS, `networksetup -getinfo Wi-Fi` la llama «Router»; verificado por el copiloto en el Mac del estudiante el 2026-10-10). Por eso va en una tarjeta propia de la laptop y no en una bandeja dentro de su terminal.

**Archivos:**
- Create: `src/game/view/cards/settings-card.ts` y `settings-card.test.ts`, `src/ui/incident/map-cards/settings-card.tsx` y `settings-card.test.tsx`.
- Modify: `src/levels/contract/incident.ts` y su test, `src/levels/world.ts` y su test, `src/game/session.ts`, `src/game/view/pieces.ts` y su test (el punto de entrada, abajo), `src/ui/incident/incident-screen.tsx`, `src/game/view/cards/terminal-card.ts` y su test (la terminal no lleva ajustes), `src/copy/screens/incident-ui.ts`, `src/levels/ladder.test.ts`, las guías.

**Interfaces:** ver `send.settings`, `SetSetting` y `SettingsCard`. El contrato `send.settings` / `SetSetting` no cambia: cambia dónde se muestra. La tarjeta es una `ChipCard` (en el estilo B) con una `ChipTray` por ajuste, la misma bandeja de siempre; no suma ninguna apariencia nueva. La terminal no sabe de ajustes. Cambiar la puerta de enlace cambia el mundo y borra los envíos anteriores (sus sellos describían el mundo viejo). La tarjeta y su bandeja nombran el ajuste por su término (`default-gateway`, puerta de enlace predeterminada) y no copian la etiqueta de ningún sistema operativo.

**Cómo se abre (para revisar).** El código de hoy abre una sola tarjeta por pieza (`cardPieceId` en `incident-screen.tsx`; `configurable` es un solo indicador de `PieceView`), y el firewall de un equipo es una pieza propia anclada a su dispositivo (`PIECE_ID.firewall`). Una laptop que envía y además tiene ajustes necesita dos entradas. El plan no decide cuál: puede ser (i) un id de pieza nuevo, anclado a la laptop como lo está su firewall, con una etiqueta con botón en el mapa y sin entidad 3D nueva (una entidad nueva cambiaría la captura de piezas), o (ii) dos botones en la etiqueta de la pieza del dispositivo. Quien implementa elige la más simple que no sume una entidad ni un elemento de interfaz, y la anota en «Decididas sin el estudiante», punto 14.

**Tests:**
- `incident.test.ts`, `accepts a gateway setting with its chips`.
- `incident.test.ts`, `rejects a setting for a device that is not an origin`.
- `world.test.ts`, `a setting move sets the gateway of the device and nothing else`.
- `session.test.ts`, `changing the gateway clears the packets sent before, so the stamps never show the old world`.
- `session.test.ts`, `a send after the setting uses the new gateway`.
- `settings-card.test.ts`, `lists the settings the incident offers for the device, each with its chips and the one that matches the world`.
- `settings-card.test.ts`, `a device with no settings has no settings card`.
- `terminal-card.test.ts`, `the terminal of a device shows no setting tray, even when the incident offers settings for it`.
- `settings-card.test.tsx`, `shows the gateway tray in the card and reports the pick`.
- `settings-card.test.tsx`, `calls the setting by its term, the default gateway, and not by the label of any operating system`.
- `pieces.test.ts`, `a laptop that sends and has settings opens its terminal and its settings card, each from its own entry`.
- `ladder.test.ts`, `a setting chip names its value, and its tray names a term`.

**Commit:** `feat(game): let a send incident set the gateway of a device from its own card`.

---

### Tarea 14: Los casos del 14

**Bloqueada por la Tarea 11a** (las tarjetas nuevas nacen en el estilo B). D-4: A, decidida.

**Archivos:**
- Create: `src/game/view/cards/case-card.ts` y `case-card.test.ts`, `src/ui/incident/case-card.tsx` y `case-card.test.tsx`.
- Modify: `src/levels/contract/incident.ts` y su test, `src/levels/world.ts` y su test, `src/game/session.ts`, `tasks.ts`, `stars.ts` y sus tests, `src/game/view/cards/terminal-card.ts`, `src/ui/incident/incident-screen.tsx`, `result-card.tsx`, `src/copy/screens/incident-ui.ts`, las guías.

**Interfaces:** ver `diagnose.cases`, `Session.caseIndex` y `Session.caseResults`. «Ya sé la causa» abre la pregunta del caso; una respuesta incorrecta da la retroalimentación de su opción y deja intentar de nuevo; la primera respuesta es la que cuenta para la estrella de explicar. Los envíos y las pistas pertenecen al caso en que se hicieron. La pregunta de causa usa las opciones con letra del estilo B; la letra no delata la correcta, que cambia de lugar entre casos.

**Tests:**
- `incident.test.ts`, `accepts a diagnose incident with seven cases`.
- `rejects a case without a cause question`.
- `rejects a case with two correct causes`.
- `world.test.ts`, `each case starts from the world before the incident plus its own changes, not from the case before`.
- `session.test.ts`, `starts at the first case`.
- `the player can send tests in the case`.
- `naming the cause right closes the case and opens the next`.
- `naming it wrong gives the feedback of the option and lets the player try again`.
- `the last case closed closes the incident`.
- `sends and hints belong to the case they were made in`.
- `stars.test.ts`, `the middle star is no hint asked in any case`.
- `the explained star needs every cause right at the first try`.
- `case-card.test.ts`, `shows the report of the case and the tests the origin can send`.
- `case-card.test.tsx`, `a case asks one question`.
- `the result card tells which cases failed the first time`.

**Commit:** `feat(game): add the diagnose mechanic with cases`.

---

### Tarea 15: La tarjeta del firewall con las pestañas «Entrada» y «Salida»

**Bloqueada por las Tareas 11a y 11b** (el estilo B y la primitiva `Tabs`). V9 b, decidida el 2026-10-10: pestañas «Entrada» y «Salida» hechas con la primitiva `Tabs`.

**Archivos:**
- Modify: `src/levels/contract/incident.ts` y su test, `chips.ts`, `src/levels/world.ts` y su test, `src/levels/ladder.ts` y su test (`configurableParts.outboundRules` pasa a ser por tipo de firewall), `src/game/session.ts`, `src/game/view/cards/firewall-card.ts` y su test (hoy dentro de `pieces.test.ts`; esta tarea lo mueve a `cards/firewall-card.test.ts`), `view/inspection.ts`, `src/ui/incident/map-cards/task-card.tsx` y su test, `src/copy/screens/incident-ui.ts`, las guías.

**Interfaces:** ver `placeRule` con `direction`.
- Cuando la tarjeta tiene reglas de salida abiertas, muestra dos pestañas con `Tabs`: «Entrada» (las reglas de entrada, con fichas de Source) y «Salida» (las de salida, con fichas de Destination), y empieza en «Entrada». Cuando no las tiene (el Security Group del capítulo 4 y el firewall de una laptop hasta el 13), muestra su lista como hoy, sin pestañas: una sola pestaña no enseña nada y los tests de la tarjeta del capítulo 4 siguen sin cambiar de contenido.
- La etiqueta de cada pestaña es el nombre oficial de su término: `entrada` y `salida` en un firewall de equipo; `regla de entrada` y `regla de salida` en un Security Group. Las reglas de salida de un firewall de equipo se abren con el término `outbound`; las del Security Group, con `outbound-rule`.
- `Tabs` monta solo el panel elegido, así que lo que el jugador va eligiendo en una ranura (qué, y desde o hacia dónde) vive en la tarjeta, por encima de las pestañas, y no dentro del panel: si no, cambiar de pestaña lo borraría.
- El texto de una lista de salida vacía no sugiere que una salida cerrada sea lo normal de un firewall (ver la nota de rigor de la ficha 01-13).

**Tests:**
- `incident.test.ts`, `accepts outbound chips and a placeRule with a direction`.
- `incident.test.ts`, `rejects an outbound move without a destination chip`.
- `world.test.ts`, `places an outbound rule on the firewall`.
- `world.test.ts`, `a rule that already exists in the other direction is not a duplicate`.
- `ladder.test.ts`, `outbound rules open with the term outbound for a host firewall and with outbound-rule for a Security Group`.
- `ladder.test.ts`, `a tab is named after a term by its official name: entrada and salida for a host firewall, regla de entrada and regla de salida for a Security Group`.
- `firewall-card.test.ts`, `names the outbound rules with the destination chips`.
- `firewall-card.test.ts`, `words the empty outbound list of a host firewall`.
- `firewall-card.test.ts`, `the empty outbound list of a host firewall never says that a closed outbound side is the default of a firewall`.
- `task-card.test.tsx`, `shows the tabs Entrada and Salida and places a rule in the tab selected`.
- `task-card.test.tsx`, `starts on the Entrada tab`.
- `task-card.test.tsx`, `shows no tabs while the firewall has no outbound rules open`.
- `task-card.test.tsx`, `switching tabs keeps what was picked in the other tab`.
- `session.test.ts`, `a rule placed in the wrong direction changes nothing for the flow`.
- Los tests de la tarjeta del capítulo 4 siguen sin cambiar de contenido.

**Commit:** `feat(game): place rules in either direction on the firewall card with tabs`.

---

### Tarea 16: Escena: pisos, routers y servidor de internet

**Desbloqueada: V6 (b) está decidida (2026-10-10). Cambia la captura de entidades.** V5 b, decidida el 2026-10-10: el servidor de internet se dibuja como una variante de la pieza de dispositivo, no de la de actor. El modelo conserva el actor `server` («Decididas sin el estudiante», punto 2, _para revisar_).

**Archivos:**
- Modify: `src/scene/layout.ts` y su test, `game-scene.tsx`, `entities/device.tsx` (la variante nueva `internet-server` de la pieza de dispositivo; sus tablas, hoy exhaustivas sobre `Device['kind']`, la suman), `entities/entity-icon.test.tsx`, `entities/index.ts`, `catalog/catalog-cells.tsx` (una celda de dispositivo para la variante), `src/game/view/pieces.ts` y su test (un actor `server` se convierte en una pieza de dispositivo de esa variante; su id sigue siendo el de un actor; y calcula el conjunto de ids que se dibujan según la lista del incidente, V6 b), `src/game/view/inspection.ts` y su test (la caja del servidor es la de un dispositivo: lo que es y su IP, no el «Quién es» de un actor), `src/copy/terms.ts`, `src/levels/contract/incident.ts` y `incident.test.ts` (el campo `shown`, V6 b), `src/levels/registry.test.ts`, `src/levels/contract/CLAUDE.md`, `src/game/view/CLAUDE.md`, `src/scene/CLAUDE.md`, `src/scene/entities/CLAUDE.md`, `DESIGN.md` (solo si suma una variante), `tests/e2e/snapshots/entities-darwin.png`.
- `src/copy/terms.ts`: `EntityVariants.device` suma `internet-server` a `Device['kind']`; `ENTITY_TERMS.device['internet-server']` es `device` (un servidor es un dispositivo); `TERM_ENTITY` no cambia.

**Interfaces:** una columna por LAN que tenga una pieza dibujada; los routers dibujados a lo largo del camino a la izquierda, en orden, y el servidor pasado el último; el camino de un paquete pasa por los saltos de su traza que se dibujan y se detiene en el router que lo descarta, si ese router se dibuja. La pieza de un dispositivo desconectado se dibuja fuera de la losa. Esta tarea recibe los saltos ya calculados en la traza (`Trace.hops`). El especimen del servidor de internet se distingue del de `ec2-instance`, que ya dibuja un servidor: el estudiante lo compara en el diff de la captura.

**El mapa sigue la historia (V6 b, decidida el 2026-10-10).** Cada incidente dibuja solo las piezas que usa, a tamaño completo, y la oficina puede quedar en otro sitio que en el incidente anterior:
- **Qué piezas usa un incidente (_para revisar_, punto 20 de «Decididas sin el estudiante»).** El incidente gana un campo opcional, `shown`: la lista de ids del mundo (dispositivos, routers y actores) que dibuja. Sin la lista dibuja todo el mundo, como hoy; así el capítulo 4 y todo incidente que no la traiga no cambian. Con la lista, una pieza se dibuja si está en ella y su término es conocido (la regla de la Tarea 11). Un firewall se dibuja con su dispositivo; una losa de piso, si alguna de sus piezas se dibuja; el globo de internet y el borde no llevan id y siguen solo la regla de términos.
- **Quién lo calcula.** `game` (`pieceViews`) calcula una sola vez el conjunto de ids que se dibujan y se lo pasa a `computeLayout`; el layout no lee la lista ni decide qué se ve (`view-renders-domain-result`). La forma exacta de la firma la decide quien implementa.
- **Tamaño y sitio.** El zoom del mapa (`CAMERA_ZOOM`) y el tamaño de cada pieza no cambian de un incidente a otro: nada se reduce para que quepa. Cada incidente se coloca solo con sus piezas, así que la oficina cambia de sitio cuando cambian las piezas. Que el mapa cabe en el ancho que le queda (900 px en 1280×800, con el panel de 380 px a la derecha) lo prueba la Tarea 27.
- **Un router que no se dibuja.** El mundo lo conserva (el ping a `10.0.0.10` del 08 necesita uno que lo descarte); el mapa no. El camino se traza directo entre las piezas dibujadas que lo rodean, y un paquete que muere en él termina en el tramo entre la última pieza dibujada que cruzó y la siguiente (en el 08, entre `router-oficina` y el globo), con el sello de perdido. Ningún texto nombra ese router (Tarea 18).
- **Qué incidentes la traen.** El 06, el 08 y el 10 (prototipados) y, deducidos de la misma regla y sin prototipo, el 07 (el mismo mapa que el 06) y el 09. Del 01 al 05 y del 11 al 14 no se decide aquí: sin lista dibujan el mundo entero (la ficha 11 dice que los routers siguen en el mapa) y cada uno puede traer la suya al escribirse su bloque. _Para revisar._

**Notas de la implementación (Tareas 3 a 9, 2026-10-10):**
- `pathFor` en `src/scene/layout.ts` solo reconoce `route-self`. Una traza de loopback (`route-loopback`, también por `localhost`) y una de `invalid-address` dibujarían un camino que sale por la puerta; el layout debe dejarlas dentro del dispositivo.
- `layout.ts` ya recibe los actores `server` (la Tarea 4 los sacó de las piezas de actor y de la inspección); aquí se dibujan como la variante de dispositivo (V5 b).

**Tests:**
- `layout.test.ts`, `lays out one column per LAN that has a drawn piece`.
- `layout.test.ts`, `lays out the drawn routers along the road between the office and the internet, in order`.
- `layout.test.ts`, `a server of the internet stands past the last drawn router`.
- `layout.test.ts`, `a device that is not connected stands outside the slab`.
- `layout.test.ts`, `the path of a packet goes through the drawn routers it crossed, in order`.
- `layout.test.ts`, `a packet that dies at a drawn router ends at that router`.
- `layout.test.ts`, `a packet that dies at a router that is not drawn ends between the last drawn piece it crossed and the next one`.
- `layout.test.ts`, `the labels of two floors do not overlap`.
- `layout.test.ts`, `a loopback ping and an invalid address never draw a path out of the device`.
- `layout.test.ts`, `gives a spot only to the pieces it is given`.
- `layout.test.ts`, `a floor with no drawn piece has no slab and no label`.
- `layout.test.ts`, `the office keeps full size in every incident, whichever pieces it draws`: el zoom (`CAMERA_ZOOM`) y el tamaño de una pieza son los mismos con la oficina entera y con una sola pieza.
- `layout.test.ts`, `the place of the office depends only on the pieces its incident draws`.
- `layout.test.ts`, `when only the sender of the office is drawn, no other device of the office gets a spot and the office router keeps its own, as in 10`.
- `pieces.test.ts`, `each incident draws only the pieces it uses`: con una lista, solo las piezas que están en ella y cuyo término se conoce.
- `pieces.test.ts`, `an incident with no list draws every piece of its world, as before`.
- `pieces.test.ts`, `the firewall of a device that is not drawn is not drawn`.
- `incident.test.ts`, `accepts an incident with a list of shown ids and one without it`.
- `incident.test.ts`, `rejects a list of shown ids with a repeated id`.
- `registry.test.ts`, `every id in the list of shown pieces of an incident names something in its world`.
- `registry.test.ts`, `the list of shown pieces of an incident holds its sender, every destination that has an owner and every expected id`.
- `entity-icon.test.tsx`, `draws the server of the internet as a device`.
- `entity-icon.test.tsx`, `every device variant has an icon and a catalog cell`.
- `pieces.test.ts`, `an actor of kind server is drawn as the internet-server variant of the device piece`.
- `inspection.test.ts`, `the box of the server of the internet says it is a device and shows its IP, with no actor role`.
- `terms.test.ts`, `the internet-server variant is named by the term device`.
- Playwright `entities`: regrabadas **a propósito** con `pnpm exec playwright test entities --update-snapshots=all`; el diff de la captura de piezas muestra solo el especimen del servidor y la captura de la interfaz no cambia. `pnpm check` verde.

**Commit:** `feat(scene): lay out floors, routers and the server of the internet`.

---

### Tarea 17: El aviso y el silencio en el mapa

**Desbloqueada: V4 (a) está decidida. Cambia la captura de entidades.**

**Archivos:**
- Modify: `src/copy/terms.ts` (`EntityVariants`, `ENTITY_TERMS`, `TERM_ENTITY` para los avisos), `src/copy/packet-labels.ts` y su test (el sello nuevo del aviso), `src/scene/entities/packet.tsx`, `stamp.tsx`, `entity-icon.test.tsx`, `src/scene/catalog/catalog-cells.tsx`, `src/scene/traffic/flow-look.ts` y su test, `use-packet-runs.ts` y su test, `src/game/flow-runs.ts` (el aviso como parte del resultado), `DESIGN.md`, `tests/e2e/snapshots/entities-darwin.png`.

**Interfaces:** el aviso (host inalcanzable, Time Exceeded) es un paquete con forma propia (V4 a) que vuelve al emisor desde quien avisó, y deja un sello nuevo. El silencio sigue siendo el sello de perdido.

**Tests:**
- `flow-look.test.ts`, `a packet that ends in a warning looks like its warning and leaves the stamp of the warning`.
- `a packet that ends in silence leaves the lost stamp`.
- `use-packet-runs.test.ts`, `a warning travels back to the sender along the path`.
- `packet-labels.test.ts`, `names the stamp of a warning for a screen reader`.
- `entity-icon.test.tsx`, `every packet variant has an icon and every stamp state has its own shape`.
- `terms.test.ts`, `every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded`.
- `reasons.test.ts`, `the text of a warning quotes no operating system and says only what the player saw`.
- Playwright `entities`: regrabadas a propósito; el diff muestra solo los especímenes nuevos.

**Notas de la implementación (2026-10-10):**
- El aviso es UNA sola variante de paquete, `warning` (un triángulo con «!», V4 a). Lo nombra `host-unreachable` o `time-exceeded` a través de `TERM_ENTITY`. Su sello es el estado nuevo `warned` («!», etiqueta para lectores de pantalla «Apareció un aviso.»), y lo gobierna el término conocido, igual que `blocked`.
- El aviso de un router viaja de vuelta al emisor a lo largo del camino. Un `host-unreachable` que genera el propio emisor no viaja (`self-warned`): se queda en la puerta del emisor.
- La captura de piezas ganó una celda, «volvió un aviso».
- `ORIGIN_CARD_GAP` en `src/scene/layout.ts` pasó de 68 a 70 para que siga pasando un test de geometría de la tarjeta de terminal que ya existía.
- La leyenda de sellos no cambió (ver Tarea 11a).

**Commit:** `feat(scene): draw the warning that comes back and its stamp`.

---

### Tarea 18: El RTT y la salida de traceroute en la vista

**Desbloqueada: V1 (a) y V2 (a) están decididas.**

**Archivos:**
- Modify: `src/game/view/inspection.ts` y su test (el campo del camino de un paquete se llama «Pasó por» mientras `hop` es desconocido y «Saltos» después), `src/game/view/cards/terminal-card.ts`, `src/copy/screens/ui.ts` y `incident-ui.ts`, `src/ui/incident/inspection-box.tsx`, `src/ui/incident/map-cards/terminal-card.tsx` y su test, las guías.

**Interfaces:** la caja de inspección de un paquete suma el campo «Tiempo de ida y vuelta» cuando el término `rtt` se conoce (V1 a) y solo si `rttMs` existe: nunca para el silencio ni para un aviso que genera el propio emisor (punto 16 de «Decididas sin el estudiante»); la línea de salida del ping en la terminal no lleva el tiempo. Un traceroute se muestra como una lista numerada en la tarjeta de la terminal (V2 a): una línea por salto, con la IP que avisó (o un asterisco) y su tiempo. Lo que lista el campo «Pasó por» y lo que el mapa dibuja deben coincidir (V6 b): el campo, los motivos y las líneas de traceroute nombran solo routers que el incidente dibuja, y un tramo que cruza routers sin dibujar se escribe «fuera de la oficina» sin nombrarlos (_para revisar_). Por eso un incidente dibuja los routers que avisan (09) o que contestan un traceroute (10).

**Tests:**
- `inspection.test.ts`, `a packet that came back shows its round trip time once the term is known`.
- `the path of a packet names only the routers its incident draws, and writes outside the office for the stretch through routers that are not drawn`.
- `a packet that never came back shows no time` (ni el silencio ni el aviso del propio emisor llevan tiempo).
- `a traceroute lists its hops with the IP and the time, and a star for a silent hop`.
- `the header of a packet shows the source and the destination IP once the term header is known`.
- `the path of a packet is worded without hops until the term hop is known`.
- `terminal-card.test.tsx`, `a traceroute shows its lines after it was sent`.
- `ladder.test.ts` (vista), `shows only terms introduced in it or before` sigue verde.

**Notas de la implementación (2026-10-10):**
- La caja de un paquete muestra: «Encabezado» (Origen, Destino y, cuando el término `ttl` se conoce, «TTL»); «Encabezado del Echo Reply», cuando los términos `header` y `echo-reply` se conocen y el paquete fue contestado; «Pasó por» o «Saltos» (según se conozca `hop`); y «Tiempo de ida y vuelta», siempre con la línea «Cifra de ejemplo.»
- El traceroute es una lista numerada llamada «Salida de traceroute». Un salto que no contesta se escribe `*`; la última línea de un inalcanzable lleva `!H` o `!N`. Cada una trae su nota en palabras sencillas.
- Un router que el mapa no dibuja (V6 b) nunca se nombra, ni por nombre ni por IP, en ningún texto. Los caminos, los motivos y las líneas de traceroute dicen «dentro de la oficina» o «fuera de la oficina»; para decidirlo se usa `facesALan`, que exporta el motor. La excepción es el traceroute: ver el punto 21 de «Decididas sin el estudiante».

**Commit:** `feat(ui): show the round trip time and the traceroute lines`.

---

### Tarea 19: Preparar el relevo: el almacenamiento limpio y las pruebas que dependían de los incidentes de hoy

**Propósito:** que la Tarea 20 pueda retirar los cuatro incidentes de hoy sin dejar nada en rojo, y que el progreso guardado empiece de cero (D-1: ninguna migración). Los incidentes de hoy siguen en el registro.

**Archivos:**
- Modify: `src/storage/progress.ts` y su test (clave `v2`; al cargar se borra la clave `v1` si existe y no se copia nada), `src/testing/incidents.ts` y `index.ts` (`hostFirewallIncident`: un incidente `filter` de prueba, en una oficina, con el firewall de una laptop), `src/game/view/pieces.test.ts` y `src/ui/incident/map-cards/task-card.test.tsx` (usan ese incidente en vez del `01-04` y de `LUCIA_FIREWALL`), `src/scene/layout.test.ts` (los nombres de sus `describe` dejan de citar `01-01`, `01-02` y `01-03`), `tests/e2e/saved-progress.ts` (`CHAPTER_1_DONE` lista `01-01` a `01-14`, para abrir el 04-01; los ids que aún no existen son inocuos), `src/storage/CLAUDE.md`.

**Interfaces:** `PROGRESS_KEY` pasa a `v2`. `loadProgress` lee solo `v2` y borra `v1` si la encuentra; el almacenamiento que recibe necesita poder borrar una clave. Nada se migra: las estrellas del capítulo 1 y las del 4 desaparecen.

**Tests:**
- `progress.test.ts`, `starts empty and removes the progress saved under the old key`.
- `progress.test.ts`, `with blocked storage, progress accumulates in memory` y `broken JSON, a non-object or blocked storage start empty` (los de hoy; siguen sin lanzar aunque el almacenamiento no pueda borrar la clave vieja).
- `progress saved by version 1 keeps loading` (el de hoy) se reemplaza por el primero.
- `pieces.test.ts`, `words the card of a host firewall with rules, never with the later inbound rules` (el de hoy, ahora sobre `hostFirewallIncident`).
- `task-card.test.tsx`: los de hoy sobre `hostFirewallIncident`, sin cambiar lo que aseguran.

**Cierre:** `pnpm check` verde. **Commit:** `refactor: reset the saved progress under a new key and detach the tests from the incidents of chapter 1`.

---

### Tarea 20: Bloque 1 · retirar los cuatro incidentes de hoy, el puente, y los incidentes 01 y 02

**Decididas: D-2 (A) y D-8 (A).** Presenta 01 y 02 (fichas arriba). Retira los cuatro incidentes de hoy y los reemplaza en el mismo commit, para que el capítulo 1 nunca quede vacío (el roadmap seguiría contando 31 tarjetas «Próximamente»).

**Archivos:**
- Delete: `src/levels/01-first-day/01-the-address.ts`, `02-there-and-back.ts`, `03-from-outside.ts`, `04-the-firewall.ts` y el `shared.ts` de hoy.
- Create: `src/levels/01-first-day/shared.ts` (el mundo base y los constructores: `officeWorld`, fichas de dirección, constructor de tareas), `where-you-are/01-the-office.ts`, `where-you-are/02-the-envelope.ts`, `where-you-are/CLAUDE.md`, `src/game/chapter-1.test.ts`.
- Modify: `src/levels/04-iaas/01-the-first-ping.ts` (el puente: su `introduces` suma, de forma temporal, los 18 términos de hoy del capítulo 1; el 01 y el 02 sacan del puente los suyos), `src/copy/terms.ts` (registra `source-ip` y `destination-ip`, que la definición de hoy de `packet` y la de `router` nombran con las palabras «IP de origen» y «IP de destino» y por eso no podían registrarse en la Tarea 2; redefine `device` con «(host)», `network`, `ip-address`, `ipv4` y `packet`; `TERM_ENTITY`), `src/levels/registry.ts`, `src/levels/registry.test.ts`, `src/levels/ladder.test.ts`, `src/game/incidents.test.ts` (quita los bloques de los incidentes borrados), `src/game/view/ladder.test.ts`, `tests/e2e/chapter-1.spec.ts` (se reduce a un humo del 01 y el 02 nuevos), `src/levels/CLAUDE.md`, `src/levels/01-first-day/CLAUDE.md`.

**Interfaces:** `01` es `identify`; `02` es `send` con mensaje `command: packet`. Los dos citan `LESSON` y `CONCEPT` como hoy. El puente es una lista temporal en el `introduces` del 04-01; cada tarea de bloque saca de ella lo que presenta y la Tarea 26 la deja vacía.

**Tests:**
- `registry.test.ts`, `registers the prototype incidents in game order` (el de hoy; su lista pasa a `01-01`, `01-02`, `04-01` y `04-02`): el glob ve la carpeta de bloque.
- `ladder.test.ts`, `introduces, incident by incident, the terms of the approved design`.
- `04-01 bridges exactly the chapter 1 terms that no chapter 1 incident introduces yet` (reemplaza a `chapter 1 brings the basic terms, so 04-01 no longer introduces ping, ICMP or Echo Request, nor 04-02 Echo Reply`).
- `the rules of a host firewall open with the term rule (01-04), and those of a Security Group with inbound rule (chapter 4)` se actualiza a los incidentes que existen.
- `the official name of ICMP says Internet before the term internet arrives: the one declared leak` se relaja a «no después» mientras ICMP e internet los presenta el mismo incidente (el puente); la Tarea 23 vuelve a exigir «antes».
- `names no topic of the chapters that come later, in any text of chapter 1`.
- `defines its new terms without naming a term the player does not know yet` (el de hoy) sigue verde con `packet`, `source-ip` y `destination-ip`.
- `chapter-1.test.ts`, `01-01: marking laptop-visita and picking 192.168.1.21 for the printer closes the incident`.
- `01-01: marking a connected laptop as outside leaves the task open and the box says it has an IP`.
- `01-01: Lucía's note gives 192.168.1.300 and that chip starts picked for the printer, with its task open`.
- `01-01: pressing Listo with 192.168.1.300 picked shows that the numbers stop at 255 and leaves the task open`.
- `01-01: pressing Listo with 192.168.1.12 picked says it is the IP of laptop-marta`.
- `01-02: a packet to 192.168.1.21 reaches the printer and completes the task`.
- `01-02: a packet to 192.168.1.12 reaches laptop-marta and the task stays open`.
- `01-02: the box shows the header with the source and the destination IP`.
- Playwright (humo): `chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star`.
- Los genéricos (`incidents.test.ts`: `starts with a task to fix`, `its reference solution fixes every task and earns every star but the explanation`; los de la escalera de las vistas) corren solos sobre los dos incidentes nuevos.

**Cierre:** `grep -rn "01-0[1-4]" src tests` solo muestra ids de los incidentes nuevos; `pnpm check` verde; golden sin cambios. **Commit:** `feat(levels): retire the four incidents of chapter 1 and add block 1, the office and the envelope`.

**Prueba humana del bloque 1.** El estudiante juega el 01 y el 02 con su servidor. Comprueba: (a) que el 01 se entiende sin que nada viaje; (b) que la IP inválida y la «sin conexión» se resuelven con el mouse; (c) que ningún mensaje lo pierde; (d) cómo se ve el encabezado; (e) que la nota de Lucía y la ficha ya elegida se entienden, y que la línea aparece al pulsar «Listo». Se anota qué se ajusta; si el 01 sobra, se fusiona con el 02 (cambia D-2 y los ids).

---

### Tarea 21: Bloque 2 · 03, 04 y 05

**Decidida: D-7 (B).** Presenta 03, 04 y 05.

**Archivos:**
- Create: `src/levels/01-first-day/the-ping/03-are-you-there.ts`, `04-ping-yourself.ts`, `05-when-it-does-not-come-back.ts` y `the-ping/CLAUDE.md`.
- Modify: `src/levels/01-first-day/shared.ts` (el firewall oculto de `laptop-marta`, los constructores del bloque), `src/copy/terms.ts` (las definiciones de `protocol`, `icmp`, `ping`, `echo-request` y `echo-reply`; con D-7 en B se retiran `request` y `response` del registro y del puente, y las definiciones dejan de nombrarlos), `src/levels/04-iaas/01-the-first-ping.ts` (puente), `src/levels/registry.test.ts`, `src/game/chapter-1.test.ts`, `src/levels/CLAUDE.md`.

**Interfaces:** 03 es un `send` con ping y su pregunta final sobre el encabezado de la respuesta; 04 usa las fichas `localhost` y `127.0.0.1`; 05 usa `expect.outcome` de silencio y de aviso.

**Tests:**
- `chapter-1.test.ts`, `01-03: the reply header of a ping to the printer swaps source and destination`.
- `01-03: the question asks for the origin and the destination of the Echo Reply, and the right option is the swapped pair`.
- `01-03: a ping to laptop-lucia comes back but does not complete the task`.
- `01-04: a ping to 127.0.0.1 and to localhost come back with a time smaller than the printer's`.
- `01-04: both pings must come back to close the incident`.
- `01-05: a ping to laptop-marta ends in silence and no piece, stamp or text names a firewall`.
- `01-05: a ping to 192.168.1.50 ends in a warning from your own laptop`.
- `01-05: the incident closes only after both results were seen`.
- `ladder.test.ts` y `game/view/ladder.test.ts`, los de siempre sobre cinco incidentes; `introduces, incident by incident, the terms of the approved design`.

**Commit:** `feat(levels): add chapter 1 block 2, the ping`.

**Prueba humana del bloque 2.** Se juegan 03, 04 y 05. Comprueba: (a) si el 03 se siente pesado (el riesgo declarado; si sí, es el primero en separarse y los ids siguientes se corren); (b) que la pregunta final del 03 se puede contestar con lo que la caja mostró; (c) que el silencio de `laptop-marta` en el 05 deja la duda abierta; (d) que el aviso se entiende como «mi laptop me avisó».

---

### Tarea 22: Bloque 3, primera parte · 06 y 07

**Bloqueada por la Tarea 13** (la tarjeta «Ajustes de red» que usa el 07; la 13 espera a la 11a). V6 (b) está decidida y ya no la bloquea: cada incidente trae su lista `shown`, el campo que suma la Tarea 16, y la de estos dos queda en sus fichas. Presenta 06 y 07.

**Archivos:**
- Create: `src/levels/01-first-day/leaving-the-office/06-your-network-and-the-router.ts`, `07-who-gets-whats-outside.ts`, `leaving-the-office/CLAUDE.md`.
- Modify: `shared.ts` (el piso 2, `router-oficina`, la puerta de enlace), `src/copy/terms.ts` (`lan`, `router`), el puente del 04-01, `registry.test.ts`, `chapter-1.test.ts`, guías.

**Tests:**
- `chapter-1.test.ts`, `01-06: a ping to the printer goes straight and a ping to laptop-andres goes through the router`.
- `01-06: the box says the ping to the second floor went through the router and shows its IP, without the word hop`.
- `01-06: draws tu-laptop, laptop-lucia, the printer, laptop-andres and the office router, and no other device`.
- `01-06: draws no internet and no router of the provider`.
- `01-07: draws the same pieces as 01-06` (_para revisar_: el 07 no se prototipó).
- `01-07: the ping to the second floor does not leave a laptop with no gateway`.
- `01-07: the printer as a gateway receives the packet and nothing comes back`.
- `01-07: an IP nobody has as a gateway gives a warning from the laptop`.
- `01-07: setting 192.168.1.1 as gateway makes the ping come back and clears the stamps of before`.
- `01-07: the gateway is set from the Ajustes de red card of the laptop, and its terminal offers no setting`.
- Los genéricos y los de la escalera sobre siete incidentes.

**Commit:** `feat(levels): add chapter 1 block 3, your network, the router and the gateway`.

---

### Tarea 23: Bloque 3, segunda parte · 08, 09 y 10

**Decididas: D-3 (A), D-5 (A) y V6 (b).** Ninguna decisión la bloquea y no espera a otra tarea más que lo que el orden del plan ya pone antes: va después de la 22 (ambas tocan `shared.ts`) y usa el campo `shown` de la Tarea 16. Cada uno de los tres trae su lista de piezas, la de su ficha. Presenta 08, 09 y 10.

**Archivos:**
- Create: `leaving-the-office/08-the-network-of-networks.ts`, `09-counting-hops.ts`, `10-seeing-the-path.ts`.
- Modify: `shared.ts` (los routers del proveedor, el servidor, la IP de la otra oficina), `src/copy/terms.ts` (`internet`, `private-ip`, `public-ip`, `hop`, `ttl`, `time-exceeded`, `traceroute`; `public-ip` se redefine sin la palabra «instancia», que es de AWS), el puente del 04-01, `registry.test.ts`, `chapter-1.test.ts`, `game/view/inspection.test.ts` (D-5), guías.

**Tests:**
- `chapter-1.test.ts`, `01-08: a ping to the server of the internet comes back`.
- `01-08: a ping to the private IP of another office dies at the first router outside the office with no warning`.
- `01-08: no text or box of the trip names NAT`.
- `01-08: draws the office of 01-06, the internet and the server, and no router of the provider`.
- `01-08: the lost ping to 10.0.0.10 ends between the office router and the internet, and no text of its box names a router outside the office`.
- `01-09: a ping with TTL 3 gets Time Exceeded from the router of the office`.
- `01-09: a ping with TTL 64 gets Time Exceeded too, because the packet loops`.
- `01-09: with TTL 1 the router of the office warns and with TTL 2 the router of the provider`.
- `01-09: draws tu-laptop, the two routers of the loop, the internet and the server, and no other device of the office` (_para revisar_: el 09 no se prototipó).
- `01-09: every router that sends Time Exceeded is drawn`.
- `01-10: the ping to the server ends in silence`.
- `01-10: a traceroute lists the two routers and then stars`.
- `01-10: the last router that answered is the one before the broken stretch`.
- `01-10: tu-laptop is the only device of the office drawn, and the office router, the two routers of the provider, the internet and the server are drawn`.
- `01-10: every router a line of the traceroute names is drawn`.
- `registry.test.ts`, `an incident that offers traceroute draws every router its traceroutes cross` (punto 21 de «Decididas sin el estudiante»). Vale también para la Tarea 26: todo incidente que ofrezca traceroute lo cumple.
- `inspection.test.ts`, `with the term IP pública known the box of an instance and of an actor shows its IP` (D-5).
- `ladder.test.ts`, `the private IP of the other office is not inside any LAN of the office`.
- `ladder.test.ts`, `the official name of ICMP says Internet before the term internet arrives: the one declared leak` vuelve a exigir que ICMP se presente antes que `internet` (en la Tarea 20 se relajó por el puente).
- Los genéricos y los de la escalera sobre diez incidentes.

**Commit:** `feat(levels): add chapter 1 block 3, the network of networks, hops and the path`.

**Prueba humana del bloque 3.** Se juegan 06 a 10. Comprueba: (a) que el mapa con pisos y routers no se amontona; (b) que el 09 se explica con lo que se vio en la caja; (c) que la salida de traceroute se lee; (d) que el 08 no deja una duda sobre cómo sale el paquete (caja negra); (e) que 06 y 07 no se sienten largos.

---

### Tarea 24: Bloque 4, primera parte · 11

**Decidida: D-7 (B).** Presenta 11. Resuelve el misterio del 05.

**Archivos:**
- Create: `src/levels/01-first-day/the-guard/11-the-guard.ts`, `the-guard/CLAUDE.md`.
- Modify: `src/copy/terms.ts` (`firewall`, `traffic`, `drop`; `firewall` se redefine sin la palabra «reglas», porque `rule` se presenta en el 12), el puente del 04-01, `registry.test.ts`, `chapter-1.test.ts`, `src/game/view/ladder.test.ts`, guías.

**Tests:**
- `chapter-1.test.ts`, `01-11: the ping to laptop-marta now leaves a blocked stamp on its firewall and the reason says it was dropped without a warning`.
- `01-11: the ping to laptop-lucia comes back`.
- `01-11: inspecting the firewall of laptop-marta says what a firewall is`.
- `ladder.test.ts` (vista), `shows no firewall, in any text or piece, before the incident that introduces it` (ahora sobre los 10 incidentes reales).
- `the same ping of 01-05 and 01-11 has the same trace and only the words change`.

**Commit:** `feat(levels): add chapter 1 block 4, the guard`.

---

### Tarea 25: Bloque 4, segunda parte · 12 y 13

**Decidida: D-7 (B); `traffic` ya está presentado.** Presenta 12 y 13.

**Archivos:**
- Create: `the-guard/12-your-first-rule.ts`, `13-in-and-out.ts`.
- Modify: `shared.ts` (los flujos y las fichas de regla), `src/copy/terms.ts` (`rule`, `allow`, `deny`, `default-deny`, `least-privilege` si no se movió antes, `inbound`, `outbound`), `src/levels/04-iaas/02-open-just-enough.ts` (deja de presentar `least-privilege`), el puente del 04-01, `registry.test.ts`, `chapter-1.test.ts`, `game/incidents.test.ts`, guías.

**Tests:**
- `chapter-1.test.ts`, `01-12: Echo Request from laptop-lucia lets her ping in and keeps the visitor out, with the middle star`.
- `01-12: any source lets the visitor in and raises the alert`.
- `01-12: the probe battery finds the extra opening of any source and none of laptop-lucia`.
- `01-13: an outbound rule for laptop-lucia lets the ping leave and come back`.
- `01-13: an inbound rule does not let the ping leave`.
- `01-13: the stamp stays on your own laptop until the rule is outbound`.
- `01-13: the firewall card of your laptop shows the tabs Entrada and Salida, and a rule placed in Entrada leaves the ping stopped`.
- `01-13: no text of the incident says or suggests that a firewall closes its outbound side by default`: ninguno de sus textos (reporte, ficha, motivo, pista, opción de la pregunta, lista vacía de la tarjeta) contiene «por defecto», «de fábrica» ni «normalmente». Esa laptop tiene la salida cerrada porque alguien la configuró así.
- `01-13: the reason of the drop on your own laptop says that its outbound side was set closed, and states no general rule about firewalls`.
- `ladder.test.ts`, `a term is introduced by one incident at most` (con `least-privilege` solo en el 01-12).
- `04-02 no longer introduces least-privilege`.
- Los genéricos y la escalera sobre trece incidentes.

**Commit:** `feat(levels): add chapter 1 block 4, your first rule and in and out`.

**Prueba humana del bloque 4.** Se juegan 11, 12 y 13. Comprueba: (a) que el 11 resuelve el misterio del 05 con una sola idea; (b) si el 12 se siente pesado (el segundo riesgo declarado; si sí, se separa); (c) que la ficha «Cualquier IP de origen» se entiende; (d) que las pestañas «Entrada» y «Salida» se ven y se entienden en la tarjeta; (e) que ningún mensaje sugiere que una salida cerrada es lo normal de un firewall.

---

### Tarea 26: Bloque 5 · 14

**Decididas: D-4 (A) y D-3 (A).** Presenta 14.

**Archivos:**
- Create: `src/levels/01-first-day/first-watch/14-final-watch.ts`, `cases.ts`, `first-watch/CLAUDE.md`.
- Modify: el puente del 04-01 (ahora vacío), `registry.test.ts`, `chapter-1.test.ts`, guías.

**Interfaces:** siete casos (tabla de la ficha), cada uno como un cambio sobre el mundo del 13. Los constructores de `cases.ts` evitan que `jscpd` vea siete casos casi iguales.

**Tests:**
- `chapter-1.test.ts`, `01-14: case 1 shows the four tests and the fourth does not leave the laptop`.
- `01-14: case 2 warns from your own laptop for 192.168.1.22`.
- `01-14: case 3 fails from the second floor and the router answers`.
- `01-14: case 4 reaches the server and is silent towards 10.0.0.10`.
- `01-14: case 5 alternates two routers in its Time Exceeded`.
- `01-14: case 6 is silent towards one laptop only, and its firewall is visible`.
- `01-14: case 7 stops everything at your own laptop, even the ping to the gateway`.
- `01-14: naming the right cause of the seven cases earns three stars`.
- `01-14: each case has a different cause or is the declared repeat of case 1`.
- `ladder.test.ts`, `04-01 bridges exactly the chapter 1 terms that no chapter 1 incident introduces yet` (ahora con el puente vacío).
- `01-14: no report and no correct option names a switched-off device as the cause`.
- `01-14: every case report names a ping that does not come back and none uses a verb of the web`.
- Los genéricos y la escalera sobre catorce incidentes.

**Commit:** `feat(levels): add chapter 1 block 5, the final watch`.

**Prueba humana del bloque 5 y del capítulo entero.** El estudiante juega el 14 y, después, los catorce de seguido. Comprueba: (a) que los casos sin pistas se pueden resolver con lo aprendido; (b) que la secuencia de cuatro pruebas del primer caso ayuda; (c) si el capítulo entero se siente largo (el riesgo «primer día lento», otra vez): qué se fusiona o se separa; (d) que el capítulo 4 sigue jugable.

---

### Tarea 27: Playwright del capítulo entero

**Archivos:**
- Modify: `tests/e2e/chapter-1.spec.ts` (el capítulo entero), `tests/e2e/saved-progress.ts`, `tests/e2e/incidents.spec.ts` (si algún nombre cambió), `tests/e2e/closing.ts`, `tests/e2e/map-boxes.ts` (si hace falta), `tests/e2e/CLAUDE.md`.

**Tests:**
- `chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each`.
- `the roadmap lists the fourteen incidents of chapter 1 with their stars`.
- `04-01 opens after 01-14 has a star`.
- Dentro de «Sin animaciones»: `after the pings of 08, no label or stamp overlaps, and the lost ping says why`.
- `in 06 the open terminal covers neither the router nor the labels of the second floor`.
- `in 06, 08 and 10 the whole map and its labels fit the area of the map at full size` (V6 b: el mapa no se reduce; el ancho que le queda es el de la ventana menos el panel de 380 px).
- `in 05 the stamp of the ping to laptop-marta tells a screen reader that it was lost, not blocked`.
- Dentro de «Sin animaciones»: `in 05 the warning for 192.168.1.50 appears at your own laptop and does not travel` (el aviso que genera el propio emisor muestra el sello «!» en el emisor y no hace viaje de vuelta; Tarea 17, `self-warned`).
- `in 11 the stamp of the ping to laptop-marta tells a screen reader that the firewall blocked it`.
- `in 07 picking the gateway in the Ajustes de red card changes the stamps of the ping`.
- `in 13 the tabs Entrada and Salida of the firewall card are reached and switched with the keyboard`.
- Cada prueba de geometría corre a 1280×800 y a 1440×900, con el mapa a tamaño completo (V6 b). Si al escribir el 11 al 14 el mundo entero no cabe a tamaño completo, ese incidente trae su lista y la prueba de ajuste se amplía a él (punto 20 de «Decididas sin el estudiante»).

**Commit:** `test(e2e): play the fourteen incidents of chapter 1`.

---

### Tarea 28: Documentos

**Archivos:**
- Modify: `README.md` (el capítulo 1 es de catorce subcapítulos; enlaza el spec y este plan), `DESIGN.md` (se revisa que refleje el estilo B, `Tabs`, la nueva estructura de `src/design/` y las variantes de V4 y V5; cada tarea ya lo actualizó), `../../docs/plans/follow-the-packet-roadmap.md` (la fila pasa de `en curso` a `hecho` con los commits, y «Prueba humana del capítulo 1» se reemplaza por las de los cinco bloques), `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (lo que quedó: I1, el puente que se cerró, lo que anotaron las pruebas humanas), `../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md` (una nota al inicio: los incidentes 01-01 a 01-04 y el riesgo «Primer día lento» los sustituye el spec nuevo), `../../docs/research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 1: temas y «qué viaja y qué configura»; la tabla de la sección 2 no cambia), este documento (los totales reales y las decisiones tomadas).
- Antes de cerrar, correr el chequeo de links del `CLAUDE.md` del repo sobre el Markdown cambiado: debe decir `LINKS OK`.

**Tests:** `chapters.test.ts`, `match the chapter map of the chapters doc, in game order` sigue verde (la tabla no cambió).

**Cierre:** `pnpm check` verde. **Commit:** `docs: record chapter 1 in fourteen subchapters`. Al cerrar el plan se sugiere `/clear`.

---

## Cobertura de requisitos

| Pide el diseño o el encargo | Dónde |
|------------------------------|-------|
| 01 · La oficina: red, dispositivo, IP, IPv4; marcar el que no está; hallar la IP; descartar `192.168.1.300` | Tareas 3, 4, 12, 20; D-2 |
| 02 · El sobre: paquete, encabezado, IP de origen y destino; destino mal escrito llega a otro | Tareas 7, 10, 18, 20 |
| 03 · ¿Estás ahí?: protocolo, ICMP, ping, Echo Request, Echo Reply; el encabezado de la respuesta, en la pregunta final a Lucía | Tareas 2, 7, 21 |
| 04 · Ping a ti mismo: loopback, localhost, RTT | Tareas 3, 7, 18, 21 |
| 05 · Cuando no vuelve: timeout, Destination Host Unreachable; silencio frente a aviso | Tareas 5, 11, 17, 21 |
| 06 · Tu red y el router: LAN, router; el otro piso por el router | Tareas 4, 6, 16, 22 |
| 07 · Puerta de enlace: sin ella no sale; el jugador la configura | Tareas 4, 5, 13, 22 |
| 08 · La red de redes: internet, IP privada, IP pública; un ping llega y otro muere | Tareas 4, 6, 16, 23; D-3, D-5 |
| 09 · Contar saltos: hop, TTL, Time Exceeded; bucle dado | Tareas 6, 8, 10, 23 |
| 10 · Ver el camino: traceroute; quién avisa marca el tramo roto | Tareas 6, 8, 18, 23 |
| 11 · El guardia: firewall, descartar; resuelve el timeout del 05 | Tareas 11, 24 |
| 12 · Tu primera regla: regla, permitir, denegar, denegación por defecto, mínimo privilegio | Tareas 2, 25 |
| 13 · Entrar y salir: entrada y salida; una regla de salida impide que salga el ping | Tareas 9, 11b, 15, 25 |
| 14 · Guardia final: caso guiado y seis sin pistas, cada uno con causa distinta | Tareas 14, 26; D-4 |
| El firewall del capítulo 1 nunca bloquea la respuesta | Tarea 6 (`the reply of a ping is never stopped by a firewall, outbound or inbound`) y Review Focus 6 |
| Ningún caso usa «equipo apagado» como causa | Tarea 26 (`01-14: no report and no correct option names a switched-off device as the cause`) y las fichas |
| Red local sin máscara | Fichas 06 y 07; Tarea 20 (`names no topic of the chapters that come later`) |
| NAT como caja negra | Tarea 6 (`the trip out of the office has no step and no reason that names NAT or the public IP`) y Tarea 23 |
| Lo que queda fuera del capítulo | Tarea 20 (`names no topic of the chapters that come later, in any text of chapter 1`) |
| Un solo motor, mecánicas que le faltan | «Inventario de mecánicas»; Tareas 3 a 9 |
| Cada bloque cierra con una prueba humana | Tareas 20, 21, 23, 25 y 26 |
| Decisiones que no toma quien escribe | «Decisiones del estudiante (2026-10-10)» (con D-12), D-6 (V6 incluida) y la Tarea 0 |
| El capítulo 4 no cambia lo que calcula | Review Focus 1 y el cierre de las Tareas 3 a 9 |
| Docs, roadmap, spec viejo, tests e2e como tareas | Tareas 27 y 28 |
| Las decisiones visuales del 2026-10-10 (V1 a V9, el inventario del estilo B, el botón primario como sello y D-12) | D-6, «Decisiones visuales aprobadas» y las Tareas 11, 11a, 11b, 12 a 18, 22, 23 y 27 |
| El estilo B en todas las tarjetas del juego, también las del capítulo 4 | Tarea 11a y «Cambios visibles del capítulo 4» |
| El botón primario como sello en todas las tarjetas | Tarea 11a, «Cambios visibles del capítulo 4» y Review Focus 17 |
| Pestañas «Entrada» y «Salida» con Radix, con una dependencia exacta de al menos 14 días | Tareas 1a, 11b y 15; Global Constraints, «Dependencias» |
| La puerta de enlace como ajuste guardado, en una tarjeta propia | Tarea 13, ficha 01-07 y Tareas 22 y 27 |
| Rigor siempre (D-11) | Global Constraints, Review Focus 15 y las pruebas de las Tareas 13, 15, 25 y 26 |
| El mapa sigue la historia: cada incidente dibuja solo las piezas que usa, a tamaño completo (V6 b) | D-6, «V6 en detalle», punto 20 de «Decididas sin el estudiante», fichas 06 a 10 y Tareas 16, 18, 22, 23 y 27 |
| La IP del 01 con fichas: la nota de Lucía deja elegida la `192.168.1.300` y la línea sale al pulsar «Listo» (D-12) | «Decisiones del estudiante», ficha 01-01, punto 22 de «Decididas sin el estudiante» y Tareas 12 y 20 |

## Decisiones visuales aprobadas

Decidido el 2026-10-10: V1 a V9 (V6 fue la b), la aprobación completa del inventario de tarjetas en estilo B, el botón primario como sello y D-12 (fichas). No queda nada pendiente: ninguna tarea espera una elección del estudiante.

| # | Elección del estudiante | Fecha |
|---|--------------------------|-------|
| V1 | a. Un campo «Tiempo de ida y vuelta» en la caja de inspección (Tarea 18) | 2026-10-10 |
| V2 | a. La salida de traceroute es una lista numerada en la tarjeta (Tarea 18) | 2026-10-10 |
| V3 | b. Una tarjeta aparte, «Ajustes de red», de la laptop, separada de la terminal (Tarea 13). Razón: la puerta de enlace predeterminada es un ajuste guardado del dispositivo y no parte de un comando; en macOS, `networksetup -getinfo Wi-Fi` la llama «Router» (verificado por el copiloto en el Mac del estudiante el 2026-10-10) | 2026-10-10 |
| V4 | a. El aviso es un paquete con forma propia y un sello nuevo (Tarea 17) | 2026-10-10 |
| V5 | b. El servidor de internet se dibuja como una variante de la pieza de dispositivo, no de la de actor (Tarea 16) | 2026-10-10 |
| V6 | b. El mapa sigue la historia: cada pantalla se dibuja a tamaño completo (100 %) y solo con las piezas que ese subcapítulo usa; la oficina puede cambiar de sitio entre subcapítulos (en el 10, de los dispositivos de la oficina solo queda `tu-laptop`). Cada incidente trae su lista de piezas (punto 20 de «Decididas sin el estudiante», para revisar) (Tareas 16, 18, 22 y 23) | 2026-10-10 |
| V7 | a. El paquete cuya causa está oculta se detiene en la puerta del equipo, con «?» (Tarea 11) | 2026-10-10 |
| V8 | B del prototipo de estilos, como el estilo NUEVO de TODAS las tarjetas del juego, también las del capítulo 4: franja de título oscura con icono y tipo, esquinas redondeadas, borde grueso, sombra, interruptor, opciones con letra y sello. Una sola primitiva por familia: el estilo cambia la primitiva y no suma hermanas (Tarea 11a) | 2026-10-10 |
| V8 · inventario | Aprobado completo, como en la sección V8 del prototipo: franja de título oscura con icono y tipo, esquinas de 14 px, borde grueso, sombra hacia abajo; `ChipTray` gana la variante `segmented` para Sí / No; las opciones de `Choice` llevan una letra que sale de un contador de CSS; una sola primitiva por familia (Tarea 11a) | 2026-10-10 |
| V9 | b, con Radix. Pestañas «Entrada» y «Salida» con `@radix-ui/react-tabs` (versión exacta, publicada al menos dos semanas antes), envuelto como la primitiva `Tabs` de `src/design/` con los tokens del juego; servirá también para la entrada y la salida del Security Group y de la NACL (Tareas 11b y 15) | 2026-10-10 |
| Botón primario · sello | Sí, en todas las tarjetas. Es `Button` `primary`, como en el prototipo: fondo `surface`, texto y borde discontinuo (`dashed`) en `emphasis`, pastilla, mayúsculas con `tracking-caps`, `rotate(-2deg)` fijo y `translateY(2px)` al pulsar; con `prefers-reduced-motion` no se mueve al pulsar. El estudiante lo vio junto al botón relleno de hoy y eligió el sello. Es un cambio de la primitiva `Button` (Tarea 11a), no un elemento nuevo | 2026-10-10 |
| D-12 | Fichas. La tarjeta de la impresora pregunta «¿Cuál es su dirección IP?» con `192.168.1.21`, `192.168.1.300` y `192.168.1.12`; Lucía le da al jugador una nota con la IP de la impresora anotada mal, `192.168.1.300`, y esa ficha llega ya elegida; al pulsar «Listo» aparece «No es IPv4: cada uno de los cuatro números va de 0 a 255.»; la IP real se lee en la caja de la impresora y la otra ficha válida es la IP de otro dispositivo (`192.168.1.12`, la de `laptop-marta`). La tarjeta de `laptop-visita` conserva «¿Está en la red?» Sí / No (variante `segmented`) (Tareas 12 y 20) | 2026-10-10 |
