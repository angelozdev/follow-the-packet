# Sigue el paquete · Capítulo 3 «La web por dentro» en diecisiete subcapítulos: motor, contrato y contenido

> **Nota (2026-10-24): el bloque 1 se construyó con otro plan.** El [plan corto del bloque 1](2026-10-23-follow-the-packet-chapter-3-block-1.md) reemplazó las Tareas 0 a 32 de este plan (hasta «Tarea 32: Bloque 1 · 04») y se escribió sobre el código 2D de `feat/chapter-2`: donde el código y este plan difieren, manda el código. Las Tareas 33 en adelante siguen vigentes, y cada bloque posterior tendrá su propio plan corto. Lo construido se aparta de las fichas en siete puntos y suma un aviso que ninguna ficha trae; los rulings están en el libro de registro del bloque (`.superpowers/sdd/2026-10-23-follow-the-packet-chapter-3-block-1/progress.md`, una carpeta local fuera de git):
> - **03-02, tarea de los POST y takeaway** (la tarea (2) de la ficha 03-02 de este plan dice «el pedido 9 y el 10»; la ficha del spec dice «Los dos POST crearon dos pedidos» y no nombra números; `Text review: Ruling (user)` I-1 y Ruling TR-10): la tarea pide dos POST iguales a la URL sin `?id` y que cada uno cree un pedido nuevo, sin nombrar números, porque un POST a `?id=N` también crea un pedido; el takeaway dice «un segundo DELETE puede contestar que el pedido ya no existe» y no «404», porque la regla 3 del spec manda sobre la ficha.
> - **03-03, origen del `curl` y página** (`T8: Ruling`): el `curl` a la app de reportes (3001) sale de `laptop-lucia` a su propia IP, porque desde `tu-laptop` el SYN muere en su firewall y no se vería el rechazo; la página es `http://192.168.1.11:3000/pedidos?id=7` y no `…:3000/`, porque la app de pedidos no sirve `/`.
> - **03-04, bandeja `serves`** (Ruling TR-2): ofrece solo «El blog», sin «La tienda»; bajo el nombre correcto, la tienda no se podía quitar (el bloque no trae `removeSite`) y la tarea de `blog` quedaba sin salida.
> - **03-02, tarea del GET** (`bf09b92`): lee el pedido 8 y no el 7, porque ningún PUT cambia el 8 y la tarea no se pierde si el jugador manda un PUT antes.
> - **03-01, caja** (`T7`, punto (a)): la caja muestra la URL por partes y no el cuerpo; el cuerpo se lee en la salida de `curl`. La prueba `03-01: the box shows the url in its parts and the body` mira la caja para las partes y la tarjeta de salida para el cuerpo.
> - **03-03, pregunta** (`92eea80`): dice «ninguna respuesta HTTP» y no «ningún código».
> - **03-03, pestaña «Navegador»** (D-24): se ofrece en las dos laptops, `tu-laptop` y `laptop-lucia`, y no solo en `tu-laptop`.
> - **Aviso nuevo en los capítulos 1, 2 y 3** (`b4b2f62`, decidido por el estudiante al jugar el 02-03): cuando un cambio a la red vacía los envíos, la tarjeta de tareas dice qué dispositivo cambió y que las pruebas de antes eran con la red anterior. Se ve en el 01-07, 02-03, 02-07, 02-11, 02-14, 03-03 y 03-04. Por eso la sección «Cambios visibles en los capítulos 1, 2 y 4» ya no es exacta cuando dice que en el capítulo 1 ningún texto, comportamiento ni apariencia cambia: el 01-07 muestra el aviso, y también el 02-03, el 02-07, el 02-11 y el 02-14 del capítulo 2.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Este plan no trae código: cada tarea dice qué contrato, qué archivos y qué tests nombrados; el código lo escribe quien ejecuta, con TDD.

**Goal:** Agregar el capítulo 3, «La web por dentro», con los diecisiete subcapítulos y los 65 términos que el estudiante aprobó. Va encima del capítulo 2 terminado. No cambia lo que el motor calcula para los capítulos 1, 2 y 4 ni lo que esos capítulos muestran, salvo lo que este plan lista. Llegan:
- lo que le falta al motor:
  - procesos que corren o no;
  - un mensaje HTTP que viaja dentro de una conexión TCP;
  - un servidor web con sitios (hosts virtuales), caminos, métodos, códigos, usuarios, sesiones y cookies, y el estado de una app entre peticiones;
  - un proxy inverso con una segunda conexión real, una lista de orígenes y `X-Forwarded-For`;
  - un límite por IP, tiempos, conexiones persistentes y su cruce;
  - certificados, claves, autoridades, raíces de confianza y una fecha del juego;
  - la validación de un certificado y el saludo TLS;
  - la terminación de TLS, la redirección y HSTS;
  - un navegador con memoria;
  - la captura de lo que ve un router del camino;
- lo que le falta al contrato del incidente y a la sesión:
  - `curl` y `openssl s_client` como comandos, una URL en fichas y una ráfaga;
  - tablas de sitios y de orígenes, y el pedido de un certificado;
  - resultados esperados con código de estado, quién lo generó y fallos de TLS;
- en las tarjetas, todo con las primitivas que existen y una sola primitiva nueva, la sección que se pliega (V27 = D):
  - la terminal de `curl` y la tarjeta «Salida» para `curl` y `openssl s_client`;
  - las tarjetas de sitios, orígenes, tiempos, redirección y HSTS;
  - las de certificados y de raíces de confianza, y la del navegador;
  - la caja con HTTP, saludo, captura y quién generó el código;
- en la escena: `servidor-app` y `servidor-falso` como piezas, y un sello propio para el fallo de TLS (V26);
- los diecisiete incidentes, en siete bloques, con un revisor de textos por bloque y una sola prueba humana, la del capítulo entero, al final;
- el cierre de I1 (la lección del pensum es opcional si el capítulo no nombra módulos) y el desbloqueo del 04-01 con el 03-17.

**Architecture:**
1. **Decisiones, punto de partida y términos (Tareas 0 a 4).** Los prototipos y las decisiones (Tarea 0). Una comprobación del punto de partida, con la medición de carpetas (Tarea 1). I1 (Tarea 2). Los 65 términos, antes de que nada los etiquete (Tarea 3). Los cambios explicados, que miran todo (Tarea 4). El mundo encadenado se comprueba en la Tarea 29.
2. **Motor (Tareas 5 a 18).** Un solo motor, puro y determinista. Cada tarea de motor deja intactas las trazas de los capítulos 1, 2 y 4: los campos nuevos son opcionales, la etapa nueva solo escribe pasos para un paquete con mensaje de aplicación, y el estado nuevo viaja en `Carried` y se mide contra `at`.
3. **Contrato, sesión, texto y herramientas (Tareas 19 a 22).** Se amplía el contrato `send`. La sesión lleva el estado nuevo. La vista dice lo que la traza trae con los términos que el jugador conoce. La terminal escribe `curl` y `openssl s_client` con sus salidas leídas del código.
4. **Tarjetas y escena (Tareas 23 a 27).** Las tarjetas por pieza con pestañas agrupadas y secciones que se pliegan (V15 = B, V27 = D), la caja de inspección y la escena.
5. **La cadena y el contenido (Tareas 28 a 44).** La Tarea 28 prepara el desbloqueo y los ayudantes. Las 29 a 44 traen los diecisiete incidentes por bloques. Cada bloque cierra con la revisión de sus textos por un revisor `sonnet`. La prueba humana es una sola, al final de la Tarea 44.
6. **Cierre (Tareas 45 y 46).** Playwright del capítulo entero y los documentos.

**Tech Stack:** el de hoy (Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, `@radix-ui/react-tabs` 1.1.21, Vitest 5.0.3, Testing Library con user-event, Playwright 1.64, pnpm 11.3.0). **Ninguna dependencia nueva, salvo una posible:** si la Tarea 23 elige Radix Accordion para la sección que se pliega (V27 = D), `@radix-ui/react-accordion`, en una versión exacta publicada hace al menos dos semanas. Un certificado, una firma y un hash son datos del juego; no hace falta una librería de criptografía.

**Spec:** [`docs/specs/2026-10-11-follow-the-packet-chapter-3-design.md`](../specs/2026-10-11-follow-the-packet-chapter-3-design.md) (los 17, los 65 términos, lo que la simulación enseña con sus fuentes, las simplificaciones y lo que no se pudo verificar). Investigación: [`docs/research/2026-10-11-follow-the-packet-chapter-3-concepts.md`](../research/2026-10-11-follow-the-packet-chapter-3-concepts.md) y [propuesta de subcapítulos](../research/2026-10-11-follow-the-packet-chapter-3-subchapters.md). Del capítulo 2 siguen valiendo su [spec](../specs/2026-10-11-follow-the-packet-chapter-2-design.md) y su [plan](2026-10-11-follow-the-packet-chapter-2.md); del capítulo 1, su [spec](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) y su [plan](2026-10-10-follow-the-packet-chapter-1-fourteen.md). Donde el código y un plan viejo difieren, manda el código.

## Estado al empezar (2026-10-11)

Este plan se escribió **antes** de que el capítulo 2 termine. Dice qué da por hecho y qué comprueba la Tarea 1 antes de tocar nada.

- **Dónde se implementa.** Encima del capítulo 2 terminado. El capítulo 2 vive en el worktree `/Users/angelozdev/me/aws-commit-academy-chapter-2/` (rama `feat/chapter-2`) y se une con la rama del capítulo 1 (`feat/chapter-1-fourteen`, HEAD `7df44f6` en el árbol principal) cuando el estudiante lo decida. Este capítulo parte del HEAD final del capítulo 2, el commit `docs: record chapter 2 in fourteen subchapters` de su Tarea 35.
- **Lo que vi en el código el 2026-10-11** (HEAD `a2da8eb` al empezar a leer, `4e15c90` al terminar; solo lectura):
  - Hechas las Tareas 0 a 15 del capítulo 2 (la 15 con un commit de seguimiento): `Service` con `listen`, `simulateSequence` con `Carried` (`nat` y `dnsCache`) y `at`, UDP y Port Unreachable, tablas de rutas, NAT con puertos, DNS con resolver, autoritativo, caché con TTL, archivo hosts, el contrato con `nc` y `dig`, tablas, reloj y ajustes, y la sesión con el reloj. Hay 106 términos en el registro (38 + 53 + 15 solo del 4).
  - `Outcome` es una unión cerrada de 10 valores y `Reason` una unión cerrada de motivos (los de DNS, NAT y puertos ya incluidos); `PacketSpec` no tiene contenido; el motor tiene una tubería de 8 etapas (`address`, `dns`, `route`, `firewall-out`, `forward`, `firewall-in`, `host`, `reply`) y una etapa `nat`.
  - `MESSAGE_COMMANDS` es `packet`, `ping`, `traceroute`, `nc` y `dig`. `PIECE_CARDS` es `terminal`, `settings`, `services`, `routes` y `records`.
  - `lesson` y `concept` son obligatorios en `incidentSchema` y solo los lee `registry.test.ts` (prueba `cites a lesson of syllabus.md and a concept note that exists`). Ese es I1.
  - Carpetas llenas: `src/ui/` con 12; con 11, `src/ui/incident/`, `src/scene/`, `src/scene/entities/`, `src/game/`, `src/engine/simulation/` y `src/copy/`.
- **Lo que doy por hecho al cerrar el capítulo 2** (lo dice su plan, no está hecho todavía; la Tarea 1 lo comprueba pieza por pieza):
  - la tarjeta «Salida» plegable de `nc` y `dig` y de traceroute (Tarea 18, V11 = B), en `src/copy/tools/` y `terminal/`;
  - la primitiva `Table` (Tarea 17) y la primitiva `Message` con `note`, `success`, `warning` y `error` y el aspecto «Pestaña» (Tarea 18 bis, V18);
  - las pestañas por pieza, un botón por etiqueta (Tarea 19, V15 = B), y la tarjeta «Reloj del juego» (V16 = C);
  - las formas de paquete por protocolo con el borde de intruso (Tarea 21, V12 = B y V19 = B);
  - `casa-lucia`, `servidor-nuevo` (`198.51.100.60`, TCP 80 y 443 «solo como números»), `servidor-dns`, `servidor-autoritativo` con `lucia.example`, `blog` alias de `www` y el firewall de `laptop-lucia` que solo deja entrar el 22;
  - el 04-01 se abre con el 02-14 y `CHAPTER_2_DONE` de `tests/e2e/saved-progress.ts` lo abre;
  - 53 términos del capítulo 2 en el registro y 91 conocidos antes del capítulo 3.
- **Lo que no existe y este capítulo trae:** todo lo de «Inventario de huecos».
- **Totales al cerrar el capítulo 2:** no se conocen. El criterio de cierre de este plan es el mismo de siempre: `pnpm check` verde, con los totales que existan entonces.
- **Contra qué versión del plan del 2 se escribió este.** El plan del capítulo 2 tenía 2030 líneas y su suma SHA-256 empieza por `65519dff`; su spec, por `2b195229` (2026-10-11). La Tarea 1 compara las dos con las de ese día y, si difieren, relee lo que cambió antes de seguir.
- **Cambios sin commit del estudiante fuera del juego** (en el árbol principal): `concepts/ami.md`, las investigaciones del capítulo 3 y archivos del capítulo 1. Ninguna tarea los toca.

## Formato de este plan

- **Sin bloques de código y sin ensayo.** Hay identificadores en línea, tablas y prosa. Los contratos nuevos se describen con nombre, tipo y significado; la forma exacta de cada función la decide quien implementa.
- **Sin totales de tests por tarea.** Nadie ensayó el plan. El criterio de cierre de cada tarea es `pnpm check` verde y que existan los tests nombrados. Los totales reales se miden al cerrar el plan y se anotan en la Tarea 46.
- **Los nombres de tests están en inglés y son exactos.** Cada uno dice qué asierta. Quien implementa puede agregar más; no puede cambiar ni quitar estos. Una prueba comprueba que no hay dos iguales (Tarea 46).
- **Las fichas de los 17 son ideas, no texto final.** La redacción en español (con tildes y ñ) se escribe al ejecutar cada bloque, en lenguaje llano y con una idea por mensaje, y sin nombrar un término que el jugador aún no conoce.
- **Las definiciones de los 65 términos están en el spec** y son propuestas: `ladder.test.ts` y `chapter-3.test.ts` deciden.
- **Cada afirmación de rigor** lleva su fuente y su fecha en el spec; el plan solo la cita.

## Global Constraints

- **Rutas.** Relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Los comandos se corren desde `projects/follow-the-packet/`.
- **Reglas.** Valen las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Pesan sobre todo:
  - `folder-structure`: tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), barrels, alias `@/` y nada de `../`. Hoy (2026-10-11, con el capítulo 2 a medias) están en 12 `src/ui/` y, con el plan del 2 cumplido, `src/ui/incident/`, `src/game/view/cards/` y probablemente `src/game/`. **Toda pieza nueva de este capítulo nace en una subcarpeta nueva** (`src/engine/web/`, `src/engine/tls/`, `src/engine/client/`, `src/engine/observe/`, `src/engine/simulation/stages/web/`, `src/copy/web/`, `src/game/view/cards/web/` y `tls/`, `src/ui/incident/map-cards/web/` y `tls/`, `tests/e2e/chapter-3/`, `src/levels/03-the-web-inside/`). La Tarea 1 mide las carpetas de verdad y hace la mudanza que haga falta, en un commit propio.
  - `pure-domain-core` y `view-renders-domain-result`: el motor devuelve datos y códigos, sin reloj ni azar; ninguna vista recalcula un resultado. El estado entra al motor como entrada explícita, nunca como lectura escondida.
  - `english-only` y `no-comments`: código, tests, guías y commits en inglés; solo JSDoc. El texto visible va en `src/copy/` y en los archivos de incidente.
  - `rigorous-plain-copy`: nombre oficial, cada término definido donde aparece, frases cortas.
  - `explained-behavior-changes`: cada incidente y cada caso de la guardia que cambia el mundo nombra el dispositivo, servidor o programa cuya configuración cambió. La Tarea 4 amplía el test.
  - `dry` con `jscpd` en umbral 0: los incidentes de un bloque comparten constructores en su `shared.ts`. `pnpm dup` corre en cada tarea.
  - Un estándar por elemento (`DESIGN.md`): toda interfaz nueva reutiliza `Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, `Tabs`, `Table`, `Message` y la leyenda. Una apariencia nueva es una variante de su primitiva. **Este capítulo suma una sola primitiva, la sección que se pliega (V27 = D)**, justificada en `DESIGN.md` como una primitiva para toda la familia. Si una tarea cree que necesita otra, se detiene y lo justifica por escrito (`DESIGN.md`, «Adding a variant instead of a new element»).
  - Los avisos y los errores **del juego** se dicen con `Message`. Lo que dicen la red, el navegador o una herramienta (un código de estado, una página de error, una línea de `curl`) **no** va en `Message`: va como texto de su tarjeta, como la salida de `nc` y `dig` en el capítulo 2.
- **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE» (estudiante, 2026-10-10). Ninguna opción, recomendada o no, enseña algo inexacto aunque sea más simple: ni un texto, ni una opción de pregunta, ni una ficha, ni una decisión de diseño. Una opción inexacta se marca como tal. Lo que no se pudo verificar se dice o no se afirma (spec, «Sin verificar»).
- **Dependencias.** Ninguna nueva. `package.json` y `pnpm-lock.yaml` no cambian en ninguna tarea. **Única excepción posible:** la Tarea 23, si elige Radix Accordion (V27 = D); entonces suma `@radix-ui/react-accordion` en una versión exacta publicada hace al menos dos semanas, y su commit lo dice.
- **Los capítulos 1, 2 y 4 no cambian lo que calculan ni lo que muestran, salvo lo que este plan lista** (sección «Cambios visibles en los capítulos 1, 2 y 4»).
  - `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibidos `vitest -u`, `--update` y editarlo a mano. Cada tarea de motor lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Si una tarea lo rompe, se detiene y se le pregunta al estudiante; no se regenera por cuenta propia (D-1 del capítulo 2).
  - Las pruebas de los capítulos 1, 2 y 4 corren sin editarse en cada tarea. Las únicas que cambian a propósito se listan en la sección de cambios visibles y en la tarea que las toca.
  - **Ninguna etapa nueva escribe un paso en una traza de los capítulos 1, 2 ni 4.** Los datos nuevos van en campos aparte. Si una prueba existente falla por un campo nuevo de la traza, la tarea se detiene y se le pregunta al estudiante: no se edita la prueba por cuenta propia.
- **Capturas.** Las dos capturas de `#/entidades` (`tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png`) cambian solo en la Tarea 27 (el sello de rechazo, V26, y, si el catálogo gana una fila, el desplazamiento de la sección de la interfaz), a propósito y revisando el diff. Ninguna otra tarea las toca.
- **Fuentes y fechas.** Toda cifra, límite o texto de una herramienta que el juego muestre lleva su fuente y su fecha en el test que lo fija o en la guía de la carpeta. Lo del spec se consultó el 2026-10-11.
- **"Listo"** = `pnpm check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea cierra con eso; lo que su sección llama «Cierre» es lo que se suma. Si Playwright no encuentra Chromium: `pnpm exec playwright install chromium`.
- **Commits.** Uno por tarea, cuando el estudiante lo aprueba (regla del repo), con `git add` de las rutas que la tarea lista, **nunca `git add .`**. El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (segundo `-m`). **Nunca se agrega nada de `labs/`.** Sin `git push`.
- **Servidores y procesos.** No se arranca nada en los puertos 5173 y 5180 (los del estudiante): son intocables. Playwright levanta el suyo en el 4183 con su configuración. Si una tarea deja un proceso, se mata solo ese PID; **prohibido matar procesos por patrón** (`pkill`, `killall`). Para la prueba humana el estudiante usa su propio servidor.
- **Ejecución.** La sesión principal orquesta y cada tarea la hace un subagente con `model` explícito: `sonnet` para explorar, implementar, revisar e investigar en la web, y `haiku` solo para correr un comando y contar su salida; **nunca `opus`**. Cada subagente recibe solo lo que necesita (el plan, las rutas y la tarea), no la historia. La ejecución ligera es la de siempre: un implementador por tarea, gobernado por los comandos de verificación de la propia tarea, y, para los textos, un revisor `sonnet` por bloque que los lee antes de pasar al siguiente: lenguaje llano, escalera de términos, rigor y la causa de cada cambio de comportamiento. No hay prueba humana entre bloques. Al cerrar un bloque se sugiere `/clear`.
- **Antes de empezar cualquier tarea de contenido** se confirma que la anterior dejó `pnpm check` verde y que el revisor de los textos del bloque anterior terminó y sus correcciones se aplicaron.
- **Preguntas al estudiante: una por mensaje.** La Tarea 0 recoge las decisiones de a una.
- **Los archivos de las herramientas** (`src/copy/tools/`) citan la fuente de cada línea con su ruta, su versión y su fecha. Una línea sin fuente no se imprime.
- Ningún comando `aws`.

## Decisiones del estudiante (ya tomadas)

El estudiante aprobó los diecisiete subcapítulos, sus 65 términos y el reparto en bloques; el plan no los cambia. Lo que sigue son las reglas que dio y cómo las aplica el plan.

| Regla del estudiante | Cómo la aplica el plan |
|----------------------|------------------------|
| **Rigor siempre.** | Global Constraints; Review Focus 26; las opciones inexactas se marcan en cada decisión abierta; D-19, D-21 y D-25 existen por esta regla |
| **Ningún cambio de comportamiento sin causa** (`explained-behavior-changes`). | Cada incidente nombra lo que cambió (procesos, sitios, orígenes, certificados, raíces, redirecciones, el archivo hosts). Tarea 4 y Review Focus 7 |
| **Sin predicciones antes de actuar.** | Ninguna ficha tiene predicción; la comprobación va en la pregunta final a Lucía |
| **Lenguaje simple.** | Las fichas son ideas; la redacción final sigue `rigorous-plain-copy`; el revisor de cada bloque y la prueba humana lo comprueban |
| **Una sola primitiva de UI por familia.** | Este capítulo suma una sola primitiva, la sección que se pliega (V27 = D), para toda la familia; el resto usa `Card`, `Table`, `Tabs`, `ChipTray`, `Choice`, `Button` y `Message`. Global Constraints y Review Focus 24 |
| **Elecciones visuales con prototipos renderizados.** | Tarea 0 (V20 a V28) |
| **Sintaxis de Linux en la terminal** (D-10 del capítulo 1). | `curl`, `openssl s_client`; salidas de Amazon Linux 2023 (D-12 = A) |
| **El progreso guardado se puede resetear; sin migraciones.** | Los ids `03-01` a `03-17` son nuevos; la clave `v2` no cambia; no hay migración |
| **IPs de RFC 5737 y nombres reservados por RFC 2606** (D-13 del capítulo 2). | Todo nombre nuevo va bajo `.example` (`marta.example`) y toda IP nueva en `192.0.2.0/24` o `198.51.100.0/24`. Review Focus 27 |
| **Una sola prueba humana, al final del capítulo.** | Al final de la Tarea 44; entre bloques, un revisor `sonnet` lee los textos |
| **Una pregunta por mensaje al estudiante.** | Tarea 0 |

### Decisiones abiertas ya contestadas (2026-10-11)

El estudiante contestó las dieciocho decisiones de la propuesta de subcapítulos. Aceptó la recomendación de la propuesta en las dieciocho. En D-10 la recomendación dependía de confirmar el RFC (se confirmó abajo) y en D-6 el estudiante dio su razón: «visual y entendible».

| Decisión | Elección | Nota |
|----------|----------|------|
| D-1 | A, un capítulo de 17 | Los capítulos 1 y 4 conservan su número |
| D-2 | B, N0.1 al capítulo 7 | El 3 no enseña CPU, memoria ni disco |
| D-3 | A, `curl` en el 01 | Definición reescrita (105 caracteres) |
| D-4 | A, los 18 cambios de orden | El script de la escalera da 0 problemas (spec) |
| D-5 | A, la app en `laptop-lucia` y el sitio en `servidor-nuevo` | La app se muda a `servidor-app` en el 07 |
| D-6 | A, `servidor-app` como dispositivo aparte | La variante B va como dato práctico al final del 07 |
| D-7 | A, `router-proveedor` mira el camino | |
| D-8 | A, una línea en el archivo hosts | |
| D-9 | A, viaja la firma | Cifrar con la clave pública no viaja dentro de TLS |
| D-10 | B, la clave de sesión es una por sentido | **Confirmado en el RFC 8446 el 2026-10-11:** §7.1 deriva `client_application_traffic_secret_0` y `server_application_traffic_secret_0` del mismo Master Secret; §7.3 deriva `[sender]_write_key` de la clave de quien envía. Tarea 3 lo fija con la definición de 114 caracteres |
| D-11 | A, el mundo da el certificado | Ver D-21 para cómo se pide |
| D-12 | A, las versiones de Amazon Linux 2023 | `curl` 8.21.0 y `openssl` 3.5.8 (spec, «Las herramientas…») |
| D-13 | A, proxy genérico según los RFC y el ALB | |
| D-14 | A, la regla del firewall en el 03 | B solo si la prueba humana lo pide |
| D-15 | A, HTTP/3 solo texto | |
| D-16 | A, los siete casos de la guardia | |
| D-17 | B, lección opcional | Tarea 2 |
| D-18 | A, construir los 17 | |

### Decisiones abiertas contestadas el 2026-10-11 (D-19 a D-26)

El estudiante contestó las ocho decisiones nuevas, de a una. Su criterio, tal como lo dio: «se aceptan si son rigurosas, visuales y entendibles para un usuario». Las seis primeras cumplen los tres. D-20 y D-24 se cerraron después, con sus prototipos, V28 y V22 (Tarea 0). En las ocho eligió la opción que el plan recomendaba, así que ninguna tarea cambia.

| Decisión | Elección | Nota |
|----------|----------|------|
| D-19 | B, el cruce | Esperas de 3, 5 y 10 s; solo la de 5 s da 502. Tareas 12 y 36 |
| D-21 | B, pedir un certificado nuevo que el mundo emite | El viejo queda en la tarjeta; la simplificación (emitir e instalar en un movimiento) se declara. Tareas 13, 40 y 44 (caso 2) |
| D-22 | A, una fecha fija del mundo | `today`, escrita en `shared.ts`. Tarea 13 |
| D-23 | A, palabras llanas del juego en el navegador | No imita a ningún navegador. Tarea 25 |
| D-25 | A, HTTP como capa sobre la conexión TCP | La etapa `app` corre solo si el paquete trae mensaje. Tarea 6 |
| D-26 | A, la última entrada de `X-Forwarded-For` | Con un solo proxy delante es la IP real del cliente; el texto dice que la regla cambia si hay más. Tarea 11 |
| D-20 | C, mixto (V28 = B en el 01 y C desde el 02) | La URL por partes, en una franja, en el 01; URL completas desde el 02. Tareas 19, 22 y 29 |
| D-24 | A, un programa de `tu-laptop` (V22 = A) | Ninguna pieza nueva en el mapa. Vive en la pestaña «Navegador». Tareas 17 y 25 |

El mismo día el estudiante revisó y aceptó las dos notas «para revisar» de «Decididas sin el estudiante». Las dos cambian el texto aprobado y las dos quedan como están escritas:

- **37 · El 03 usa dos programas en `laptop-lucia`:** una app de pedidos (puerto 3000, corriendo) y una de reportes (puerto 3001, cerrada).
- **38 · El 12 usa `openssl s_client`, que no corta ante un error de verificación:** por eso el impostor se ve fallar con `curl`.

## Decisiones abiertas

Ocho decisiones nuevas, D-19 a D-26. El estudiante contestó las ocho el 2026-10-11: seis de a una (D-19, D-21, D-22, D-23, D-25 y D-26; ver «Decisiones abiertas contestadas» arriba) y **D-20 y D-24** con sus prototipos, V28 y V22. Cada una trae sus opciones, una recomendación que sigue la regla de rigor («entre una opción más simple y otra que modela la realidad, la segunda») y el porqué. **Una opción inexacta va marcada así: «inexacta».** La Tarea 0 las recoge de a una por mensaje y escribe la respuesta debajo de cada una.

### D-19. El 502 de la conexión persistente (el 09)

El subcapítulo aprobado dice: «Sale a ratos si el origen cierra una conexión persistente sin uso antes que el proxy», y su ficha propone dos peticiones separadas por una espera de 10 s con un 502 al final. El RFC 9112 §9.5 pide que quien tiene conexiones abiertas **las vigile** para ver si le llegó un cierre. El 502 aparece solo en el cruce: la petición sale en el mismo instante en que el origen cierra la conexión sin uso. AWS documenta la misma condición para el ALB: el keep-alive del destino menor que el idle timeout del balanceador. El proxy del juego es genérico y sigue los RFC (D-13 = A).

- **A. Como se aprobó:** con una espera de 10 s (más que los 5 s del origen y menos que los 60 s del proxy) el proxy reutiliza una conexión que el origen ya cerró y da 502, siempre. **Inexacta para un proxy genérico:** se aparta de RFC 9112 §9.5 y de D-13 = A, y enseña que el 502 sale con cualquier espera mayor que el keep-alive del origen, cuando el RFC y AWS lo describen como un cruce. Solo dejaría de ser inexacta si el texto declarara un proxy que no vigila las conexiones sin uso, y ese ya no sería el proxy genérico.
- **B. El cruce.** El origen cierra una conexión sin uso a los 5 s. El proxy se entera un instante después, así que la petición que sale en ese mismo segundo se cruza con el cierre y da 502. Antes de los 5 s reutiliza la conexión (200) y después ya sabe del cierre y abre otra (200). El jugador prueba tres esperas (3, 5 y 10 s) y ve que solo la de 5 s da 502. El ajuste (subir el idle timeout del origen por encima de los 60 s del proxy) quita el cruce: el proxy cierra primero. Exacta (RFC 9112 §9.5; AWS, ALB).
- **C. Al azar:** el 502 sale «a ratos» con cierta probabilidad. **Inexacta con el motor:** `pure-domain-core` prohíbe el azar y la traza no se podría reproducir.
- **Recomendación: B.** Es la única que no contradice el RFC y conserva el ajuste de la ficha. Enseña «a ratos» como un cruce con causa y no como magia. Costo: el jugador tiene que dar con la espera de 5 s, y las pistas la nombran. Si el estudiante elige A, solo cambian la función que decide el cruce (Tarea 12), la ficha del 09 y el texto, que debe declarar un proxy que no vigila.
- **Bloquea:** la regla de la Tarea 12 y el contenido de la Tarea 36. El resto del motor no espera.

**Decisión del estudiante (2026-10-11):** B. El cruce: esperas de 3, 5 y 10 s; solo la de 5 s da 502.

### D-20. Cómo se arma la URL y el comando `curl`

- **A. Una bandeja por parte de la URL en todos los incidentes** (esquema, nombre o IP, puerto, path, query string) más una de opciones. El 01 enseña las partes, pero los otros dieciséis repiten cinco bandejas y la terminal se alarga.
- **B. URLs completas como fichas desde el 01.** El 01 trata justo de las partes de una URL y no las enseñaría.
- **C. Mixto.** El 01 arma la URL por partes y desde el 02 las URL van completas, en una bandeja; las opciones (`-i`, `-v`, `-L`, `-d`, `-X`, `-H`, `-u`, `-b` y `--connect-timeout`) van en otra.
- Ninguna es inexacta. **Dato que pesa (curl 8.21.0, leído el 2026-10-11):** un POST se pide con `-d` y no con `-X POST`. Con `-L`, una 301 cambia el POST a GET, y la documentación de `-X` dice que su método se usa en todas las peticiones del `-L`; por eso el juego ofrece `-d`, `-X PUT` y `-X DELETE`.
- **Recomendación: C.** Las partes enseñan en el 01 y estorban después. La Tarea 0 la prototipa (V28).
- **Bloquea:** las Tareas 19 y 29.

**Decisión del estudiante (2026-10-11):** C. Mixto, con el prototipo V28: la URL por partes, en una franja, en el 01 (V28 = B), y las URL completas desde el 02 (V28 = C).

### D-21. El certificado nuevo del 13 y del caso 2 de la guardia

La ficha aprobada dice: «Agrega `lucia.example` a los nombres del certificado». Es una edición en el sitio. El 12 enseña lo contrario: la autoridad certificadora firma los nombres, y si cambia un byte la firma deja de valer.

- **A. Editar los nombres del certificado** en su tarjeta. **Inexacta:** el certificado resultante tendría una firma que ya no cubre sus datos, y el juego mostraría válido lo que su propio 12 llama inválido.
- **B. Pedir un certificado nuevo.** El jugador elige los nombres con fichas (cada ficha es una lista completa: `*.lucia.example`; `*.lucia.example` y `lucia.example`; `lucia.example`) y el mundo lo emite y lo instala en `servidor-nuevo` (D-11 = A). El certificado viejo queda en la tarjeta de certificados, sin cambios. Exacta; la simplificación (emitir e instalar en un movimiento) se declara.
- **C. Pedir y después instalar,** en dos movimientos. Exacta y más fiel a la vida, pero agrega un paso que no enseña nada nuevo aquí: instalar un certificado es del capítulo 7.
- **Recomendación: B.** Es coherente con D-11 = A y con el 12.
- **Bloquea:** las Tareas 13, 40 y 44 (caso 2).

**Decisión del estudiante (2026-10-11):** B. Pedir un certificado nuevo que el mundo emite.

### D-22. La fecha de «hoy»

El 13 dice las fechas y el caso 3 de la guardia las juega: el certificado de `blog.lucia.example` venció. El reloj del capítulo 2 cuenta segundos.

- **A. Una fecha fija del mundo.** El report la dice («Hoy es …»); las fechas de un certificado son fechas del juego; no se espera en días.
- **B. Un reloj en días:** fichas «Esperar 1 día» sobre el reloj del juego. Exacta, pero mezcla segundos y días en el mismo reloj, y 90 días son 7 776 000 segundos para el TTL de DNS y para el idle timeout.
- **C. Leer la fecha real del sistema.** **Inexacta con el motor:** `pure-domain-core` prohíbe leer el reloj, las pruebas dependerían del día y un certificado del juego se vencería con el tiempo real.
- **Recomendación: A.** El capítulo enseña que las fechas se comprueban, no que el tiempo las vence. B queda si la prueba humana pide esperar hasta un vencimiento.
- **Bloquea:** la Tarea 13.

**Decisión del estudiante (2026-10-11):** A. Una fecha fija del mundo.

### D-23. Qué texto dice el navegador

- **A. Palabras llanas del juego** («No se pudo conectar», «La conexión se rechazó», «El certificado no sirve para este nombre», «Demasiadas redirecciones»). No imita a ningún navegador.
- **B. Imitar códigos y textos de un navegador real** (`ERR_CONNECTION_REFUSED`, `NET::ERR_CERT_COMMON_NAME_INVALID`). **Inexacta:** esos textos no se verificaron para ningún navegador ni versión (investigación, 7.2), y `NET::ERR_CERT_COMMON_NAME_INVALID` dice «common name» cuando la comprobación es contra el SAN (investigación, 4.6): enseñaría la corrección 4.6 al revés.
- **C. Sin texto:** una página vacía. No explica nada.
- **Recomendación: A.**
- **Bloquea:** la Tarea 25.

**Decisión del estudiante (2026-10-11):** A. Palabras llanas del juego en el navegador.

### D-24. Dónde vive el navegador

- **A. Un programa de `tu-laptop`.** No es una pieza del mapa. Vive en la pestaña «Navegador» de la tarjeta de `tu-laptop` (V15 = B) y sus peticiones salen de `tu-laptop`.
- **B. Una pieza aparte del mapa** conectada a `tu-laptop`. **Inexacta:** un navegador corre en el dispositivo; dibujarlo aparte enseña que es otro equipo y contradice «cliente y servidor son roles, no tipos de equipo».
- **Recomendación: A.**
- **Bloquea:** las Tareas 17 y 25.

**Decisión del estudiante (2026-10-11):** A. El navegador es un programa de `tu-laptop`; no hay una pieza nueva en el mapa. Se cerró con el prototipo V22 = A.

### D-25. Cómo vive el mensaje HTTP en el motor

- **A. Una capa sobre la conexión.** El motor simula la conexión TCP con la tubería de hoy y, si el paquete trae un mensaje, una etapa `app` calcula la petición y la respuesta y las pone en `Trace.app`. Sin mensaje, la etapa no hace nada.
- **B. Un paquete nuevo «HTTP»** en el catálogo y en la tubería. **Inexacta:** el mensaje HTTP no es un paquete; viaja en los datos de una conexión TCP (investigación, sección 2; spec, regla 2).
- **C. Un segundo motor aparte** para HTTP, fuera de `simulate`. Duplica o salta las rutas, el firewall y los servicios, y rompe «un solo motor».
- **Recomendación: A.**
- **Bloquea:** la Tarea 6.

**Decisión del estudiante (2026-10-11):** A. HTTP como capa sobre la conexión TCP.

### D-26. Qué entrada de `X-Forwarded-For` toma el origen

El proxy agrega la IP del cliente a la cabecera. El cliente también puede escribir la suya.

- **A. La última entrada,** la que agregó el propio proxy del origen. Con un solo proxy delante, es la IP real del cliente.
- **B. La primera entrada.** **Inexacta como regla general e insegura:** es la que el cliente quiso poner. Quien limita por IP se deja engañar.
- **C. Todas, contra una lista de proxies de confianza.** Exacta con varios proxies, pero es del capítulo 7 o del 20.
- **Recomendación: A.** Con un solo proxy delante basta, y el texto dice que la regla cambia si hay más. Cómo lo hace cada programa real (por ejemplo `trust proxy` de Express) **no se verificó**.
- **Bloquea:** la Tarea 11.

**Decisión del estudiante (2026-10-11):** A. La última entrada de `X-Forwarded-For`.

## Decididas sin el estudiante (para revisar)

Cada una tiene una razón técnica y una sola respuesta razonable; si el estudiante no está de acuerdo, se cambia la tarea que la aplica.

1. **El 03-01 parte del mundo del 02-14.** El capítulo 2 generaliza `worldBeforeChanges` para partir de la solución del último incidente del capítulo anterior (decidida 1 de su plan). Como el 02-14 es una guardia y cada caso es un cambio sobre el mundo del 02-13, el mundo común es el del 02-13. La Tarea 29 lo comprueba con un test.
2. **`changedNames` se amplía** a lo que este capítulo cambia: procesos, sitios, orígenes, certificados, raíces de confianza, redirecciones y ajustes de una app. Tarea 4.
3. **El mensaje HTTP viaja en la conexión TCP** (D-25 = A). `PacketSpec.message` es opcional; la etapa `app` corre después de `host` solo si el paquete lo trae. Un paquete sin mensaje (todo el capítulo 1, el 2 y el 4) pasa exactamente por la tubería de hoy.
4. **La segunda conexión del proxy es un paquete real** que sale de `servidor-nuevo` a `servidor-app` y pasa por toda la tubería (rutas, firewalls, servicios). Se ve en el mapa (D-6 = A) y su traza va en `Trace.app.upstream`. El camino por internet no se modela más allá de lo que modela el capítulo 2.
5. **El estado entra como entrada.** `Carried` gana: el estado de cada app (`apps`), las sesiones (`sessions`), los contadores por IP (`hits`), el pool de conexiones del proxy (`pool`) y la memoria del navegador (`browser`). Todo se mide contra `at`. `simulate` suelto sigue sin estado.
6. **Un movimiento que cambia el mundo** limpia los envíos y, con ellos, el estado derivado (pedidos creados, sesiones, contadores, conexiones, cookies y HSTS); el reloj no vuelve atrás. Es la regla del capítulo 2 aplicada al estado nuevo. Por eso «la segunda visita va directo a HTTPS» (15) ocurre después del último ajuste.
7. **Cabeceras mínimas.** Las respuestas del juego traen solo `Content-Type`, `Content-Length` y, según el caso, `Location`, `Set-Cookie`, `WWW-Authenticate`, `Retry-After` y `Strict-Transport-Security`. Sin `Date`, `Server` ni `Connection`. Es una simplificación declarada.
8. **La app responde 200 a un POST que crea.** 200 es válido para un POST (RFC 9110 §15.3.1); 201 no es uno de los once códigos.
9. **Los pedidos.** La app arranca con los pedidos 7 y 8. Un POST crea el 9, el siguiente el 10. Un PUT al 7 deja el 7 igual aunque se repita. Un DELETE al 7 lo borra y el segundo DELETE da 404 con el estado igual (idempotencia del efecto).
10. **Cuerpos de texto llano** hasta el 15 («Pedido 7: 2 cafés.») y **JSON** desde el 16. Ningún texto nombra JSON antes de que el término llegue.
11. **El navegador y `curl` de `tu-laptop` comparten la lista de raíces** del dispositivo. La tarjeta «Raíces de confianza» es de `tu-laptop`. El texto avisa que cada cliente real tiene la suya.
12. **`curl` no guarda ni manda cookies** si no se le da `-b`; el navegador sí. Lo que une varias peticiones es la cookie.
13. **Una ráfaga es un campo de la ficha de mensaje** (`repeat`): la sesión la expande en N envíos en el mismo segundo del reloj. La caja muestra el primero y el último.
14. **El límite de la app** es de 10 peticiones por segundo del juego y por IP; la ráfaga de `casa-lucia` es de 20. Son números del juego. El 429 trae `Retry-After: 1`.
15. **El proxy usa el primer origen de la lista** y no reparte. Una lista vacía da 503 (D-13 = A). No hay health checks ni «falla abierto» (capítulo 7).
16. **Tiempos en segundos del juego.** `/informe` tarda 90 s; el proxy espera 60 s a una respuesta (504 si no llega). La petición no adelanta el reloj: `wait` sí. Son números del juego; el 60 coincide con el idle timeout por defecto del ALB y no se afirma que sea el de ningún proxy real.
17. **Idle timeouts.** El del proxy es 60 s (ALB, **[fuente]**) y el de `servidor-app` es 5 s (`keepAliveTimeout` de Node, **[fuente]**). El ajuste de la ficha del 09 sube el de `servidor-app` por encima de 60.
18. **La fecha** (D-22 = A): una constante del mundo, `today`, escrita en `shared.ts`. Las fechas de un certificado (`notBefore` y `notAfter`) son fechas del juego; un certificado nuevo dura 90 días desde `today`.
19. **Pedir un certificado** (D-21 = B) crea un certificado con número de serie nuevo, firmado por la autoridad del juego, y lo instala en el sitio que lo pidió. El viejo queda en la lista.
20. **La autoridad certificadora no es una pieza del mapa.** El juego tiene una autoridad de confianza que `tu-laptop` trae en sus raíces. El impostor tiene otra que `tu-laptop` no trae.
21. **TLS 1.3 en todos los servidores.** El cliente ofrece las versiones y los protocolos `h2` y `http/1.1`; el servidor del juego elige `http/1.1`. El certificado va cifrado y la captura no lo ve.
22. **Certificado por defecto.** `servidor-nuevo` tiene un certificado para `servidor-nuevo.example`, que da a quien llega sin nombre (D-13 = A). Un nombre bajo `.example`, nunca un nombre real.
23. **Los comandos de `openssl s_client`** son `openssl s_client -connect <nombre>:443 -servername <nombre>` y, para llegar sin SNI, `-noservername`. Salen sin el bloque PEM (spec, «Lo que el juego no imprime»).
24. **La captura** muestra, de cada paquete que `router-proveedor` reenvía, IP, puertos, protocolo y, en un saludo TLS, el SNI; de un mensaje HTTP en claro, el mensaje entero; de uno cifrado, «datos cifrados». No muestra tamaños ni momentos.
25. **El impostor es un programa a medida** (D-8 = A): presenta la copia del certificado de Lucía y firma con su propia clave.
26. **HSTS** se recuerda el resto de la sesión; `max-age` no se agota y no hay precarga. Se manda solo por HTTPS.
27. **El navegador recuerda una 301** y no la vuelve a pedir; `curl` no.
28. **Una cookie lleva nombre y valor.** El valor lo da la sesión de forma determinista (`sesion=s1`, `sesion=s2`). Sin atributos.
29. **Basic para `-u`.** `-u usuario:clave` manda `Authorization: Basic` con la base64 de «usuario:clave»; el 401 trae `WWW-Authenticate: Basic realm="admin"`. Las contraseñas son del juego.
30. **El navegador sigue hasta 20 redirecciones** y `curl -L` hasta 50 (`src/tool_main.h` de curl 8.21.0). El 20 del navegador es un número del juego, no se afirma de ningún navegador real.
31. **La variante B de D-6** (la app en `127.0.0.1:3000` detrás del proxy en el mismo equipo) va como dato práctico al final del 07, en el takeaway, sin dibujarla.
32. **El proceso detenido** (03 y caso 1 de la guardia) lo detiene el mundo con la acción `setProcess` y el report dice quién («Lucía cerró la terminal donde corría su app»). El jugador no detiene procesos.
33. **El 04-01 se abre con el 03-17.** El desbloqueo usa el orden del juego (capítulo 2, decidida 18). `CHAPTER_2_DONE` deja de abrirlo y la Tarea 28 agrega `CHAPTER_3_DONE`. No se resetea nada del progreso guardado.
34. **Un fallo de TLS no es «Bloqueado».** Nadie descartó el paquete: el cliente lo rechazó. Tiene su sello (V26) y su resultado `tls-failed`.
35. **La guardia reutiliza las tarjetas.** El caso 2 trae `fix` (D-12 del capítulo 2) con la tarjeta de pedir un certificado.
36. **Sin `Message` para la red.** Un código de estado, un error del navegador o una línea de `curl` no se dicen con `Message` (Global Constraints).
37. **El 03 usa dos programas en `laptop-lucia`.** _Revisada y aceptada por el estudiante (2026-10-11): cambia el texto aprobado._ La propuesta cerraba «la app» después de un primer intento. Un mundo de `send` no puede detener un proceso a la mitad del incidente (decidida 32). Por eso hay una app de pedidos (puerto 3000, corriendo) y una de reportes (puerto 3001, cerrada), y la pregunta final habla de la app de reportes.
38. **El 12 usa `openssl s_client`, que no corta ante un error de verificación.** _Revisada y aceptada por el estudiante (2026-10-11): cambia el texto aprobado._ La propuesta decía que las conexiones del impostor «mueren en la validación». Con `curl` morirían; con `openssl s_client` siguen y dicen `Verification error` (`apps/s_client.c` y `apps/lib/s_cb.c` de OpenSSL 3.5.8, leídos el 2026-10-11). El 12 lee la cadena con `s_client` y el 13 comprueba el nombre con `curl`.
39. **El 12 elige el servidor por IP y puerto, con `-servername`.** `servidor-falso` escucha en el 443 (certificado editado) y en el 8443 (autofirmado). Así las tres conexiones no dependen de una línea del archivo hosts.

## Inventario de huecos

Lo que el motor, el contrato y la vista saben hacer hoy (HEAD `4e15c90` del capítulo 2, solo lectura) y lo que falta para los diecisiete. Los huecos del motor van primero y antes del contenido. La propuesta de subcapítulos listó 28 huecos. Este inventario los reordena en 30 (H1 a H30) y le da su propia fila y su propia tarea a seis cosas que la propuesta nombraba de pasada o no nombraba: el estado de la app entre peticiones (H5), las sesiones con su valor de cookie (H7), la ráfaga (H9), el pool de conexiones del proxy (H10), emitir un certificado (H12) y la memoria del navegador (H17). Cada una viaja en `Carried` y se mide contra `at`.

| # | Hueco | Hoy | Lo piden | Lo que falta | Tarea |
|---|-------|-----|----------|--------------|-------|
| H1 | Un proceso que corre o no | No existe. «Sin servicio» es puerto cerrado | 03, 09, 17 | `Process`, `Service.processId`, la acción `setProcess`; un servicio de un proceso detenido no escucha | 5 |
| H2 | Qué habla un servicio | `Service` es `{protocol, port, listen}`, sin tipo ni comportamiento | 01 a 17 | `Service.web` con sitios, TLS, redirección y HSTS | 5 |
| H3 | Un mensaje HTTP dentro de una conexión TCP | `PacketSpec` no tiene contenido; `Trace` no tiene mensaje; `reply.ts` solo anota «TCP 80 reply» | 01 a 17 | `PacketSpec.message`, `Trace.app`, la etapa `app` (D-25 = A) | 6 |
| H4 | Una app de origen: caminos, métodos, códigos, cuerpos y validación | No existe. El único precedente es `ServerActor.dns` | 01 a 17 | `SiteBehavior` de páginas, `PathRule` y sus manejadores | 7 |
| H5 | El estado de la app entre peticiones (pedidos creados, cambiados y borrados) | `Carried` lleva `nat` y `dnsCache` | 02, 06, 16 | `Carried.apps` | 7 |
| H6 | Hosts virtuales: el sitio según la cabecera Host y el sitio por defecto | No existe | 04, 14 | `Site`, la elección por Host y su tarjeta | 8 |
| H7 | Usuarios, permisos por camino, sesiones y cookie | No existe | 06, 17 | `User`, `needs-role`, `login`, `Carried.sessions`; 401 con `WWW-Authenticate` y 403 | 9 |
| H8 | Proxy inverso: segunda conexión, lista de orígenes, `X-Forwarded-For`, reenviar tal cual y generar 502, 503 y 504; quién generó cada código | No existe. Ninguna entidad de proxy ni de balanceador | 07 a 09, 15, 17 | `SiteBehavior` de proxy, `Trace.app.upstream` y `generatedBy` | 10 |
| H9 | Límite por IP y la ráfaga | No existe | 07 | `RateLimit`, `Carried.hits`, 429 con `Retry-After`, `readsClientIpFrom` y el campo `repeat` | 11 |
| H10 | Tiempos: origen lento, espera del proxy y conexiones persistentes con un idle timeout en cada extremo | El reloj del juego (`wait`) existe desde el capítulo 2; `timeout` es un desenlace sin duración | 08, 09, 17 | latencia de un camino, `Carried.pool`, el cruce (D-19) | 12 |
| H11 | Certificados como datos: nombres (SAN y comodín), clave pública, quién lo firmó, fechas, hash de lo firmado, cadena que se envía y quién tiene la clave privada | No existe | 11 a 15, 17 | `Certificate`, `Authority`, claves, `Device.trustedRoots`, `Network.today` (D-22) | 13 |
| H12 | Emitir un certificado nuevo | No existe | 13, 17 | la acción `issueCertificate` (D-21 = B) | 13 |
| H13 | Desenlaces de TLS antes de cualquier código HTTP: nombre, cadena, autofirmado, vencido, firma | `OUTCOMES` tiene 10 desenlaces y ninguno es de TLS. Los motivos no son web | 11 a 14, 17 | `tls-failed` y los motivos de validación | 14 |
| H14 | El saludo TLS como pasos: ClientHello con SNI y versiones, ServerHello, certificado (cifrado), firma, Finished, datos cifrados; la clave por sentido | No existe | 10 a 15 | `Trace.tls` y la etapa `tls` | 15 |
| H15 | Desajuste de protocolo: TLS a un puerto que habla HTTP | No existe | 17 | el desenlace con `wrong version number` | 15 |
| H16 | Terminación de TLS en el proxy, `X-Forwarded-Proto`, redirección a HTTPS y el bucle | No existe | 15, 17 | `WebService.redirectToHttps`, `hsts`, `X-Forwarded-Proto` y el bucle de redirecciones | 16 |
| H17 | La memoria del navegador (cookies, HSTS, 301 recordada) y seguir redirecciones (también `curl -L`) | No existe | 03, 04, 06, 15 | `Carried.browser`, `Trace.app.followed`, `Trace.app.client` | 17 |
| H18 | Captura en un router del camino: qué se lee y qué no | La VPC tiene un resumen de `tcpdump` (capítulo 4). No hay contenido que mostrar | 10, 15 | `Trace.capture` | 18 |
| H19 | JSON en el cuerpo y su validación (400) | No existe | 16 | cuerpo JSON en `PathRule` | 7 |
| H20 | Una fecha del juego para las fechas de un certificado | El reloj del 2 cuenta segundos | 13, 17 | `Network.today` (D-22 = A) | 13 |
| H21 | `curl` y `openssl s_client` como comandos, con su salida como la imprime una versión real | `MESSAGE_COMMANDS` acepta `packet`, `ping`, `traceroute`, `nc` y `dig`; un test rechaza `curl` | 01 a 17 | los dos comandos, la URL en fichas y las dos salidas con fuente | 19, 22 |
| H22 | Tarjetas editables nuevas: la regla de firewall junto a un envío (03), sitios, orígenes, tiempos, redirección y HSTS, hosts, certificados y raíces | `send.tables` conoce `routes` y `records`; `filter` es la única mecánica con reglas | 03 a 17 | `send.rules`, tablas `sites`, `origins`, `hosts` y `certificate-request`; ajustes nuevos | 19, 23, 24 |
| H23 | El navegador como tarjeta | No existe, ni como actor ni como tarjeta | 03, 04, 06, 15 | la pestaña «Navegador» (D-24 = A) | 25 |
| H24 | Entidades del mapa: `servidor-app`, `servidor-falso` y el sello del fallo de TLS | `ENTITY_TERMS` no tiene ninguna web | 07, 11, 17 | dos piezas de servidor y un estado de sello (V26) | 27 |
| H25 | Términos: 65 ids nuevos, la prueba que cuenta los ids y la tabla del capítulo 3 | Registro de 106 (más los del capítulo 2 al cerrar) | todos | el registro, `chapter-3.test.ts` y la prohibición de temas posteriores | 3 |
| H26 | Lección del pensum y nota de concepto opcionales (I1) | `incidentSchema` las exige | todos | `lesson` y `concept` opcionales si `modules: []` | 2 |
| H27 | Desbloqueo: el 04-01 se abre con el último incidente del 3 | Hoy lo abre `CHAPTER_2_DONE` | 17 | `CHAPTER_3_DONE` y el cambio de `isUnlocked` en los datos | 28 |
| H28 | Cambios explicados: los campos nuevos del mundo entran en `changedNames` | Cubre dispositivos, routers y servidores (capítulo 2) | todos | procesos, sitios, orígenes, certificados, raíces y ajustes de app | 4 |
| H29 | Prueba espejo: ningún texto da una razón falsa de por qué vuelve la respuesta ni dice «stateful» | Existe para ICMP, TCP, UDP y NAT | todos | HTTP y TLS tampoco dan razón | 21 |
| H30 | El test dorado del capítulo 4 no cambia (81 trazas ICMP) | Riesgo, no hueco: los campos nuevos de la traza deben faltar en la VPC | todos | cada tarea de motor lo comprueba | 5 a 18 |

## Contratos nuevos

Nombre, tipo y significado. Toda propiedad nueva es opcional salvo que se diga lo contrario, para que la VPC y las oficinas de hoy sigan validando.

### Modelo de la red (`src/engine/network/` y las carpetas nuevas del motor)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Process` | `{ id, name, running }` | Un programa que corre o no. Vive en `Device.host.processes` y en `ServerActor.processes` |
| `Service.processId` | id de un `Process` | El servicio escucha desde ese proceso. Si `running` es falso, el servicio no escucha: el puerto está cerrado y el paquete recibe un RST |
| `Service.web` | `WebService` | Lo que el servicio contesta cuando alguien le habla en HTTP. Sin él, el servicio acepta la conexión y no dice nada (como los de `nc`) |
| `WebService` | `{ sites, defaultSiteId, tls?, redirectToHttps?, hsts? }` | Los sitios que sirve, el que da a quien llega con un nombre que no tiene sitio, el TLS del servicio (si es un puerto de TLS), la redirección a HTTPS y la política HSTS (`maxAge`, solo por HTTPS) |
| `Site` | `{ id, names, behavior }` | Un sitio con los nombres que atiende. Un servicio de una sola app usa solo `defaultSiteId` |
| `SiteBehavior` de páginas | `{ kind: 'pages', paths, users?, rateLimit?, idleTimeoutSeconds, clientIpFrom }` | Una app de origen. `clientIpFrom` es `peer` o `forwarded-for` (D-26) |
| `SiteBehavior` de proxy | `{ kind: 'proxy', routes, origins, readTimeoutSeconds, idleTimeoutSeconds }` | Un proxy inverso. `routes` mapea un prefijo de path a la lista de `origins`; el proxy usa el primero de la lista |
| `PathRule` | `{ path, match: 'exact' \| 'prefix', methods, handler }` | Un camino de la app y qué hace |
| `Handler` | unión: `fixed`, `order-read`, `order-create`, `order-replace`, `order-delete`, `slow`, `fails`, `login`, `needs-role`, `redirect`, `json-resource` | Lo que hace un camino. `needs-role` envuelve a otro manejador y da 401 sin credencial y 403 con credencial sin el rol. `order-read` da 400 si el id no es un número y 404 si no existe |
| `User` | `{ name, password, role }` | Quién existe para una app |
| `RateLimit` | `{ perSecond }` | Cuántas peticiones por segundo del juego acepta de una misma IP; la siguiente recibe 429 con `Retry-After` |
| `Origin` | `{ ip, port }` | Un origen de un proxy |
| `TlsServer` | `{ chains, defaultCertificateId }` | Para cada sitio, la lista de certificados que el servidor manda (el suyo y los de las autoridades hasta una raíz, sin la raíz); el certificado por defecto para quien llega sin nombre |
| `Certificate` | `{ id, names, subjectKeyId, issuerId, notBefore, notAfter, signedDigest }` | Un documento público. `signedDigest` es el hash de los datos que la autoridad firmó; la firma vale si coincide con el hash de los datos de hoy. Un certificado autofirmado tiene como emisor a su propia clave |
| `Device.privateKeys` y `ServerActor.privateKeys` | lista de ids de clave | Quién tiene cada clave privada. La clave privada nunca viaja |
| `Authority` | `{ id, name, keyId }` | Una autoridad certificadora. No es una pieza del mapa |
| `Device.trustedRoots` | lista de ids de autoridad | Las raíces de confianza del dispositivo, para `curl` y el navegador (decidida 11) |
| `Network.today` | `{ year, month, day }` | La fecha del mundo (D-22 = A). Entra al motor como dato |
| `PacketSpec.message` | `AppMessage` | Lo que el paquete lleva dentro de la conexión. Sin él, el paquete es el de hoy |
| `AppMessage` | `{ kind: 'http', method, url, headers, body?, client }` o `{ kind: 'tls-probe', serverName? }` | La petición HTTP de un `curl` o del navegador, o la sonda de `openssl s_client`, que abre el saludo TLS y no manda HTTP |
| `Client` | `{ program: 'curl' \| 'browser', follow?, credentials?, cookies?, connectTimeoutSeconds? }` | Quién pide y cómo. El navegador sigue redirecciones y usa su memoria; `curl` solo lo que se le pide |
| Acciones nuevas | `setProcess`, `setWebService`, `addSite`, `removeSite`, `addOrigin`, `removeOrigin`, `setRedirectToHttps`, `setHsts`, `setIdleTimeout`, `setClientIpFrom`, `issueCertificate` | Cambian el modelo. `addSite` y `addOrigin` devuelven la misma red si la entrada repite un nombre o un origen; las funciones `siteProblem` y `originProblem` dicen por qué |

Reglas del esquema:
- Ninguna IP se repite (los servidores nuevos cuentan).
- Un `processId` apunta a un proceso del mismo dispositivo.
- Un `Site` de proxy apunta a orígenes con IP y puerto válidos. Pueden no existir: eso es un 502.
- Un certificado de `TlsServer` existe.
- Un nombre de un certificado y de un sitio van bajo `.example`.
- Un servicio con `tls` es un puerto de TCP.
- Una VPC no trae `web`, `processes`, `trustedRoots` ni `today`.

### Traza (`src/engine/simulation/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `Trace.app` | `{ request, response?, generatedBy?, upstream?, followed?, client?, tls? }` | Lo que pasó con el mensaje. Ausente en todo paquete sin mensaje. `generatedBy` dice quién generó el código: `{ id, role: 'origin' \| 'proxy' \| 'server' }` |
| `Trace.app.request` y `response` | `{ startLine, headers, body? }` más los campos estructurados (método, path, query, código) | El mensaje como viaja. Se muestra en la caja (V20) |
| `Trace.app.upstream` | `Trace` | La traza de la segunda conexión, del proxy al origen (decidida 4). Lleva su propio `app` |
| `Trace.app.followed` | lista de `Trace` | Las peticiones que el cliente hizo después de una redirección, en orden. La última es la final |
| `Trace.app.client` | `{ result, redirectsFollowed? }` | Lo que el cliente concluyó: `ok`, `too-many-redirects`, `tls-failed` o `no-connection` |
| `Trace.tls` | `{ clientHello, serverHello?, chain?, signature?, verification, failure? }` | El saludo como datos: versiones, SNI, protocolos ofrecidos, versión y protocolo elegidos, cadena enviada, quién firmó con qué clave y la validación (nombre, cadena, fechas, firma) |
| `Trace.capture` | `{ observerId, lines }` | Lo que ve un router del camino. Una línea por paquete reenviado: IP, puertos, protocolo y, según la capa, el SNI o el mensaje en claro |
| `Outcome` | gana `'tls-failed'` | El cliente abortó el saludo: no hay código HTTP |
| Códigos de motivo nuevos | `process-stopped`, `web-site-chosen`, `web-default-site`, `web-answered`, `web-passed-through`, `web-generated`, `web-no-origin`, `web-origin-timeout`, `web-origin-refused`, `web-origin-cut`, `web-rate-limited`, `web-needs-login`, `web-forbidden`, `web-redirects`, `web-loop`, `tls-hello`, `tls-certificate-chosen`, `tls-signature-checked`, `tls-name-mismatch`, `tls-chain-untrusted`, `tls-expired`, `tls-bad-signature`, `tls-wrong-protocol`, `tls-no-sni` | Cada uno trae sus datos (ids, nombres, códigos); `src/copy/web/` los vuelve texto |
| `Carried` | gana `apps`, `sessions`, `hits`, `pool` y `browser` | El estado que viaja de un envío al siguiente (decidida 5). Todo se mide contra `at` |
| `simulateSequence(net, sends)` | sin cambios de firma | Una traza por envío, aunque un envío siga redirecciones: las trazas siguientes van en `Trace.app.followed` |

Los campos nuevos están ausentes en toda traza que el test dorado registra, y la etapa `app` solo escribe pasos para un paquete con `message`.

### Contrato del incidente (`src/levels/contract/`)

| Nombre | Tipo | Significado |
|--------|------|-------------|
| `mechanic` | las cuatro de hoy | Ninguna nueva. 17 = `diagnose`; los demás son `send` |
| Ficha de mensaje | gana `curl` y `openssl-s-client` como `command`; `curl` lleva `method?`, `body?`, `headers?`, `options?` y `repeat?` | `curl` es TCP al puerto de la URL. `repeat` (de 2 a 50) manda la misma petición N veces en el mismo segundo (decidida 13). `openssl-s-client` es una sonda TLS al 443 |
| Ficha de URL | `{ id, scheme?, host?, port?, path?, query?, url? }` | Por partes en el 01 y completa desde el 02 (D-20 = C). La URL completa que forman las partes es la que se manda |
| Ficha de opción | `{ id, label, option }` | `-i`, `-v`, `-L`, `-d`, `-X PUT`, `-X DELETE`, `-H`, `-u`, `-b` y `--connect-timeout 3` |
| `send.tables` | gana `kind: 'sites'`, `'origins'`, `'hosts'` y `'certificate-request'` | Sitios (nombre y comportamiento), orígenes (IP y puerto), las líneas del archivo hosts (solo se quitan) y el pedido de un certificado (cada ficha es una lista completa de nombres) |
| `send.rules` | `{ firewallId, what, from }` | La tarjeta de reglas de un firewall de equipo dentro de un incidente `send` (el 03), con las fichas y el movimiento `placeRule` de `filter` |
| `send.settings` | gana `kind: 'redirect-to-https'`, `'hsts'`, `'idle-timeout'`, `'client-ip-from'` y `'process-running'` | Cada ajuste tiene su dueño (una app, un servidor web o un proceso). El jugador arranca un proceso detenido (09 y caso 1 de la guardia); el mundo es quien lo detiene (decidida 32) |
| `SendTask.expect` | gana `status?`, `generatedBy?`, `tlsFailure?`, `body?`, `secure?`, `hidden?` y `verification?` | El código HTTP que debe volver, quién debe haberlo generado, el motivo de un fallo de TLS, el cuerpo exacto, si fue por TLS, qué campo no debe leer un observador (`{ observerId, field }`) y lo que `openssl s_client` debe decir de la verificación |
| `PlayerMove` | gana `requestCertificate { tableId, picks }` | Cambia el mundo y limpia los envíos |
| `PIECE_CARDS` | gana `sites`, `origins`, `certificates`, `trust`, `browser`, `redirect` | Las tarjetas que una pieza puede abrir primero |
| `lesson` y `concept` | opcionales si el capítulo no nombra módulos | I1 (D-17 = B). Tarea 2 |
| `officeLeaks` | función | Un `curl` o un `openssl s_client` a una IP fuera de una oficina sin routers sigue siendo una fuga |

### Sistema de diseño (`src/design/`)

**Una primitiva nueva: la sección que se pliega (V27 = D).** Es una excepción a «ninguna primitiva»: se justifica en `DESIGN.md` como una primitiva para toda la familia de secciones que se pliegan y sigue el patrón acordeón de W3C WAI-ARIA (Enter o Espacio la abre y la cierra). La Tarea 23 elige cómo se implementa: la opción recomendada es Radix Accordion, de la misma familia que `@radix-ui/react-tabs`; la alternativa, `details` y `summary` nativos, si cumplen el patrón. **Ninguna otra primitiva.** Las tarjetas son `Card` con `Table`, `ChipTray`, `Choice`, `Button`, `Tabs` y la sección que se pliega. Los avisos y errores **del juego** usan `Message`. El sello del fallo de TLS (V26) es un estado del sello (`StampState`), no un elemento hermano. La tarjeta de captura (V25 = A2) usa `Card` y una lista de campo y valor; la Tarea 26 confirma que esa lista no es una primitiva nueva (si ya existe una de lista, se reutiliza). `DESIGN.md` no cambia salvo tres cosas: una línea para el nuevo estado de sello, la justificación de la sección que se pliega y, solo si la Tarea 26 no halla una lista que reutilizar, la justificación de la lista.

### Sesión y vista (`src/game/`)

| Nombre | Significado |
|--------|-------------|
| `Session.browser` | La memoria del navegador (cookies, HSTS, 301) que `simulateSequence` lleva; la vista la muestra en la pestaña «Navegador» |
| Acciones nuevas | `requestCertificate`; `placeEntry` y `removeEntry` valen también para `sites` y `origins`; `setSetting` gana los cuatro tipos nuevos |
| `ServerCard` | Lo que muestra la tarjeta de un servidor: sitios, orígenes, tiempos, redirección y HSTS. La calcula `game` |
| `CertificateCard` | Lo que muestra la tarjeta de certificados: cada certificado con sus nombres, emisor, fechas, si su firma vale y quién tiene su clave privada |
| `BrowserCard` | Lo que muestra el navegador: la página o el error con palabras llanas (D-23) y lo que recuerda |
| `CaptureCard` | La captura de un router (V25 = A2): un grupo por protocolo, partido en «se lee» y «cifrado» con su cuenta, y una lista de campo y valor donde solo lo que se lee trae valor |
| `describeReason(reason, net, known)` | Los motivos nuevos, con los términos que el jugador conoce; un motivo cuyo término es desconocido dice solo lo que el jugador vio |
| Campos de la caja | «Petición HTTP», «Respuesta HTTP», «Quién lo generó», «Saludo TLS», «Certificado» y «Lo que ve el camino», cada uno detrás del término que usa |

## Los diecisiete: fichas

Cada ficha: mecánica, términos, mundo (qué cambia y a quién se nombra, por `explained-behavior-changes`), qué viaja, qué hace el jugador y con qué fichas, tareas, éxito, fallo y causa, la pregunta de Lucía con la idea de la correcta y el error que refleja cada incorrecta, las dos pistas y el rigor. Los números del mundo pueden ajustarse al escribir. Los términos de cada incidente salen de la tabla «Los diecisiete» del spec y sus definiciones, de su tabla de 65. Posición de la respuesta correcta: 01 = 2.ª, 02 = 3.ª, 03 = 1.ª, 04 = 2.ª, 05 = 3.ª, 06 = 1.ª, 07 = 2.ª, 08 = 3.ª, 09 = 1.ª, 10 = 2.ª, 11 = 3.ª, 12 = 1.ª, 13 = 2.ª, 14 = 3.ª, 15 = 1.ª, 16 = 2.ª; el 17, por caso, abajo.

El mundo base de cada incidente es la solución del anterior (decidida 1 del capítulo 2): el 03-01 parte de la oficina tal como la deja el 02-13, con el sitio de `servidor-nuevo` solo como números, `www.lucia.example` y `blog.lucia.example` en el DNS y el firewall de `laptop-lucia` que solo deja entrar el 22. Una laptop, un servidor o un programa que ya existía y cambia de configuración se nombra en el report, en la explicación correcta o en el takeaway; una pieza que una acción agrega no hace falta nombrarla. Qué se dibuja (`shown`) está en cada ficha: un router que el mapa no dibuja no se nombra.

**La caja de inspección crece detrás de los términos.** Cada campo declara el término que usa y se deja fuera mientras no se conozca: «URL» (`url`, desde el 01); «Petición HTTP» y «Respuesta HTTP» (`http-request` y `http-response`, desde el 02); «Quién lo generó» (`status-code`, desde el 05); «Saludo TLS» (`tls-handshake`, desde el 14); «Certificado» (`certificate`, desde el 11); «Lo que ve el camino» (`tls`, desde el 10).

### Bloque 1 · Pedir una página

**03-01 · Una dirección para cada cosa** · `send` · términos: HTTP, URL, path, query string (apoyo), curl. Denso (cinco términos).
- **Mundo:** `setWebService` de `laptop-lucia`: el programa del puerto 3000, que en el 02-01 solo aceptaba conexiones, ahora contesta HTTP. El report nombra a `laptop-lucia` («Lucía terminó su app de pedidos: el programa del puerto 3000 de laptop-lucia ahora contesta HTTP»). Dibuja `laptop-lucia`.
- **Qué viaja:** dos `curl http://localhost:3000/pedidos?id=7` y `?id=8`, desde `laptop-lucia` a su propia app, por loopback. El firewall de `laptop-lucia` no estorba porque el juego no filtra el loopback (simplificación del capítulo 1).
- **Jugador y fichas (D-20 = C):** origen fijo `laptop-lucia`; la URL por partes: Esquema (`http`), Nombre (`localhost`), Puerto (`3000`, `80`), Path (`/pedidos`, `/pedido`) y Query string (`?id=7`, `?id=8`). Sin opciones de `curl`.
- **Tareas:** (1) que el `curl` devuelva el cuerpo del pedido 7; (2) que devuelva el del pedido 8.
- **Éxito:** las dos. Sin opciones, `curl` imprime solo el cuerpo (el cuerpo de las respuestas es texto llano, decidida 10).
- **Fallo y causa:** el puerto 80 recibe un rechazo (`curl: (7) Failed to connect to localhost:80 after <N> ms: Could not connect to server`; `<N>` es ilustrativo): nadie escucha en el 80. Un path equivocado devuelve el cuerpo «No hay nada en ese camino.». La caja de este incidente muestra la URL partida en sus partes y el cuerpo; todavía no la petición.
- **Pregunta:** «¿Qué parte de la URL eligió el pedido 7?» Correcta (2.ª): la query string, `?id=7`. Incorrectas: «El path, `/pedidos`» (el path elige el recurso, no cuál pedido); «El puerto, 3000» (el puerto elige el servicio).
- **Pistas:** (1) una URL tiene partes: esquema, nombre, puerto, path y query string. (2) lo que va después de `?` precisa lo que se pide.
- **Rigor:** el mensaje HTTP no es un paquete: viaja en los datos de la conexión TCP que abrió el saludo de tres pasos del capítulo 2. El fragmento `#…` no llega al servidor (RFC 9110 §7.1). El takeaway dice que la salida es la de `curl` 8.21.0 de Amazon Linux 2023 y que en un Mac los errores se ven distintos (como el `nc` del 02-01). No afirma que `curl` venga instalado en la AMI estándar (spec, «Sin verificar»). `localhost` resuelve a `127.0.0.1` y el juego no modela IPv6.

**03-02 · Pedir y contestar** · `send` · términos: petición HTTP, respuesta HTTP, método HTTP, idempotente.
- **Mundo:** `setWebService` de `laptop-lucia`: la app acepta crear (POST), cambiar (PUT) y borrar (DELETE) pedidos. El report nombra a `laptop-lucia`. Dibuja `laptop-lucia`.
- **Qué viaja:** un GET, dos POST iguales y dos PUT iguales de `laptop-lucia` a su app. La caja muestra ahora la «Petición HTTP» (método, path con su query string, cabeceras, cuerpo) y la «Respuesta HTTP» (código, cabeceras, cuerpo), sin nombrar «código de estado»: ese término llega en el 05.
- **Jugador y fichas:** URL completa (`http://localhost:3000/pedidos?id=7`, `http://localhost:3000/pedidos`, `http://localhost:3000/pedidos?id=9`); opciones: ninguna (GET), `-d` con el cuerpo «producto=café» (POST), `-X PUT -d` con «producto=té» (PUT). `-d` y no `-X POST`: con `-X` el método se repite en todas las peticiones del `-L`, y el POST se pide con su propia opción (curl 8.21.0, leído el 2026-10-11).
- **Tareas:** (1) que el GET devuelva el pedido 7; (2) que dos POST iguales dejen el pedido 9 y el 10; (3) que dos PUT iguales al pedido 7 lo dejen igual (`expect.body`). El bloque 1 construyó (1) y (2) de otro modo: ver la nota del principio.
- **Fallo y causa:** no hay fallo; el contraste es el efecto de repetir: el segundo POST crea otro pedido y el segundo PUT no cambia nada.
- **Pregunta:** «Se cortó la red al mandar un POST. ¿Es seguro repetirlo?» Correcta (3.ª): no, porque POST no es idempotente y repetirlo puede crear otro pedido. Incorrectas: «Sí, la respuesta será la misma» (idempotente habla del efecto, no de la respuesta); «Sí, HTTP evita los duplicados» (HTTP no evita nada).
- **Pistas:** (1) compara lo que dejó el segundo POST con lo que dejó el segundo PUT. (2) idempotente: repetir deja el mismo efecto que hacerlo una vez.
- **Rigor (4.11):** idempotente no es lo mismo que seguro ni que «devuelve lo mismo»: un segundo DELETE puede dar 404 y el estado es el mismo; el texto lo dice con esas palabras. Un cliente no reintenta solo un POST y un proxy no lo reintenta nunca (RFC 9110 §9.2.2). La app responde 200 al POST que crea (decidida 8).

**03-03 · Quién contesta** · `send` con la tarjeta del firewall de `laptop-lucia` y el navegador de `tu-laptop` · términos: proceso, servidor web, navegador.
- **Mundo:** `laptop-lucia` corre dos programas: la app de pedidos (puerto 3000, corriendo) y la app de reportes (puerto 3001). `setProcess` detiene el segundo. El report nombra a `laptop-lucia` («Lucía cerró la terminal donde corría su app de reportes»). Dibuja `tu-laptop` y `laptop-lucia`. *Cambio respecto de la propuesta:* la propuesta cerraba «la app» después de un primer intento. Con dos procesos los dos intentos conviven en un mismo mundo, que es lo que `send` necesita (decidida 32).
- **Qué viaja:** el navegador de `tu-laptop` pide `http://192.168.1.11:3000/`; un `curl --connect-timeout 3` a la misma URL antes de la regla; y un `curl` a `http://192.168.1.11:3001/`.
- **Jugador y fichas (D-14 = A):** agrega en el firewall de `laptop-lucia` la regla TCP 3000 solo para `192.168.1.0/24` (fichas de tipo `TCP · 3000`, `TCP · 3001`, `TCP · 1-1023`; de origen `[tu-laptop]`, `192.168.1.0/24` y `Cualquier IP de origen`).
- **Tareas:** (1) que el navegador reciba la página de la app de pedidos; (2) que el `curl` al 3001 sea rechazado por `laptop-lucia` (`refused`).
- **Éxito:** las dos. Con la regla, la página llega.
- **Fallo y causa:** sin la regla, la petición muere en el firewall: el navegador no recibe nada y `curl` se rinde con el código 28. La tarjeta «Salida» no imprime ninguna línea de ese error, porque el código de `curl` 8.21.0 tiene dos textos posibles y no se sabe cuál sale (spec), y la caja dice «curl esperó y se rindió». Es silencio, el puerto filtrado del capítulo 2. Con la app de reportes cerrada, `curl` recibe `curl: (7) Failed to connect to 192.168.1.11:3001 after <N> ms: Could not connect to server`: nadie escucha y TCP rechaza antes de que haya HTTP.
- **Pregunta:** «Con la app de reportes cerrada, ¿por qué `curl` no recibió ningún código?» Correcta (1.ª): no había ningún proceso escuchando en el 3001, y TCP rechazó la conexión antes de que hubiera HTTP. Incorrectas: «Porque el firewall descartó el paquete» (eso sería silencio; aquí hubo un rechazo); «Porque el servidor web devolvió un error» (en ese puerto no corría ningún servidor web).
- **Pistas:** (1) un rechazo lo manda el dispositivo; el silencio es que nadie contesta. (2) un código lo manda un servidor web, y aquí no había ninguno.
- **Rigor (6.3):** un proceso no es un puerto: uno puede escuchar en varios. El puerto no decide el protocolo. Un rechazo, un silencio y una respuesta son tres cosas distintas; el cuarto modo de fallo, hablar otro protocolo, llega en el caso 7 de la guardia. El navegador del juego dice con palabras llanas lo que vio (D-23). Una regla del firewall dice TCP y puerto, no «HTTP».

**03-04 · Un servidor, varios sitios** · `send` con la tarjeta «Sitios» de `servidor-nuevo` · términos: cabecera HTTP, cabecera Host, host virtual.
- **Mundo:** `setWebService` de `servidor-nuevo`: un servidor web en el 80 con un solo sitio, la tienda (`www.lucia.example`), que es el sitio por defecto. El report nombra a `servidor-nuevo` («Lucía instaló un servidor web en servidor-nuevo con un solo sitio: la tienda»). Por eso `blog` mostraba la tienda. Dibuja `tu-laptop`, `servidor-dns`, `router-oficina` y `servidor-nuevo`.
- **Qué viaja:** `curl -i` y el navegador a `http://www.lucia.example/`, a `http://blog.lucia.example/` (alias de `www` desde el 02-11) y a `http://198.51.100.60/`. Sin puerto: van al 80. La caja muestra la cabecera `Host` de cada petición. `curl -i` imprime la línea de estado y las cabeceras tal como llegan.
- **Jugador y fichas:** agrega el sitio `blog.lucia.example` en la tarjeta «Sitios» (tabla: Nombre y Qué sirve; fichas de nombre `blog.lucia.example` y `blogs.lucia.example`; de contenido «El blog» y «La tienda»).
- **Tareas:** (1) que `www` reciba la tienda; (2) que `blog` reciba el blog; (3) que la IP sola reciba el sitio por defecto, la tienda.
- **Fallo y causa:** antes de agregar el sitio, `blog` recibe la tienda: la cabecera `Host` dice `blog.lucia.example`, el servidor no tiene ese sitio y sirve el de por defecto.
- **Pregunta:** «`blog` es un alias de `www`. ¿Cómo sabe `servidor-nuevo` qué sitio dar?» Correcta (2.ª): por la cabecera Host, que lleva el nombre escrito en la URL. Incorrectas: «Por la IP, que es distinta para cada sitio» (es la misma); «Por el registro CNAME» (el servidor web no ve el DNS).
- **Pistas:** (1) la IP y el puerto son iguales para los dos nombres. (2) fíjate en la cabecera `Host` de la caja.
- **Rigor (4.12):** en HTTP/1.1 la cabecera Host es obligatoria y un servidor responde 400 si falta (RFC 9112 §3.2). El nombre de la URL viaja aunque el DNS haya seguido un CNAME **[inferencia]**. Cada servidor decide qué hace con un nombre sin sitio; el del juego sirve el sitio por defecto. El nombre viaja en tres lugares con distinta protección (DNS, SNI y Host); el 04 solo habla de Host. Una URL sin puerto va al 80, el puerto por defecto del capítulo 2.

**Revisión de los textos del bloque 1** (01 a 04) por un revisor `sonnet`, antes del bloque 2 (ver «Contenido»).

### Bloque 2 · Cómo salió y quién eres

**03-05 · ¿Cómo salió?** · `send` · términos: código de estado, 200 OK, error 4xx, 404 Not Found, 400 Bad Request (apoyo).
- **Mundo:** `setWebService` de `laptop-lucia`: la app comprueba el id (`/pedidos?id=siete` no es un número). El report nombra a `laptop-lucia`. El firewall conserva la regla del 03. Dibuja `tu-laptop` y `laptop-lucia`.
- **Qué viaja:** tres `curl -i` de `tu-laptop` a `http://192.168.1.11:3000/…`. La caja suma «Quién lo generó» (la app) y el código.
- **Jugador y fichas:** URL completas: `…/pedidos?id=7`, `…/pedido?id=7`, `…/pedidos?id=siete` y `…/pedidos?id=99`. Opción: `-i`.
- **Tareas:** (1) 200 con el pedido 7; (2) 404 con un path que no existe; (3) 400 con el id mal escrito.
- **Pregunta:** «¿Qué dice la primera cifra de un 404?» Correcta (3.ª): la clase: la petición, tal como llegó, no se puede cumplir. Incorrectas: «Que el servidor falló» (esa es la clase 5); «Que siempre es culpa del cliente» (lo parece, pero no siempre).
- **Pistas:** (1) la primera cifra da la clase. (2) 2: se cumplió; 4: la petición, tal como llegó, no se puede cumplir.
- **Rigor (4.14):** un 4xx parece un error del cliente y no siempre lo es (RFC 9110 §15.5); un 200 dice que la petición se cumplió según el servidor, no que salió bien en el negocio. El 404 «o el servidor no quiere decir si existe» queda para el 06.

**03-06 · Quién eres y qué puedes** · `send` · términos: autenticación, autorización, cabecera Authorization, 401 Unauthorized, 403 Forbidden, cookie (apoyo). Denso (seis términos, el tope).
- **Mundo:** `setWebService` de `laptop-lucia`: `/admin` con dos usuarios, Lucía (administradora) y Marta (sin permiso de administración), y `/login` que da una cookie. El report nombra a `laptop-lucia`. Dibuja `tu-laptop` y `laptop-lucia`.
- **Qué viaja:** `curl -i` a `/admin` sin credencial, con la de Marta (`-u`) y con la de Lucía; el navegador inicia sesión en `/login`, guarda la cookie y la devuelve. `curl` no guarda cookies si no se le da `-b`.
- **Jugador y fichas:** opciones `-u marta:…`, `-u lucia:…` y `-b sesion=…`; en la pestaña «Navegador», iniciar sesión como Lucía o como Marta.
- **Tareas:** (1) 401 sin credencial; (2) 403 con la de Marta; (3) 200 con la de Lucía; (4) que el navegador entre a `/admin` con la cookie.
- **Pregunta:** «Marta recibió 403. ¿Le sirve repetir con la misma credencial?» Correcta (1.ª): no: el servidor sabe quién es y no le da permiso. Incorrectas: «Sí, el 403 es temporal»; «Sí, el 403 dice que su contraseña está mal» (eso es el 401).
- **Pistas:** (1) 401: no sabe quién eres. 403: lo sabe y no te deja. (2) mira qué cabecera mandó cada `curl`.
- **Rigor (4.1):** los nombres engañan: «Unauthorized» y «Authorization» hablan de autenticación (RFC 9110 §11.6.2). El 401 trae `WWW-Authenticate`. Un 403 puede esconder un 404 (§15.5.4). El takeaway avisa que en AWS el número solo no basta y hay que ver quién lo generó, sin nombrar servicios. Cada petición se entiende sola; lo que las une es la cookie; no se registra «sin estado». El takeaway dice que una credencial por HTTP la puede leer cualquiera que vea el camino, y el 10 lo muestra.

**Revisión de los textos del bloque 2** (05 y 06) por un revisor `sonnet`, antes del bloque 3.

### Bloque 3 · El servidor de delante

**03-07 · Un servidor delante** · `send` con la tarjeta de `servidor-app` · términos: proxy inverso, servidor de origen, X-Forwarded-For (apoyo), 429 Too Many Requests.
- **Mundo:** `addActor` de `servidor-app` (`198.51.100.61`, la app en el 3000, límite de 10 peticiones por segundo por IP, toma la IP del par), `setWebService` de `servidor-nuevo` (proxy: reenvía `/pedidos`, `/admin` y `/api` a `servidor-app:3000`) y `setProcess` de `laptop-lucia` (la app ya no corre allí). El report nombra a `laptop-lucia`, a `servidor-nuevo` y a `servidor-app` («Lucía subió su app a servidor-app, la dejó de correr en laptop-lucia y puso servidor-nuevo delante, como proxy inverso»). Dibuja `tu-laptop`, `casa-lucia`, `servidor-dns`, `router-oficina`, el globo, `servidor-nuevo` y `servidor-app`.
- **Qué viaja:** una ráfaga de 20 peticiones de `casa-lucia` a `http://www.lucia.example/pedidos?id=7` y una de `tu-laptop`. Dos conexiones: la del cliente al proxy y la del proxy al origen.
- **Jugador y fichas:** configura `servidor-app`: ajuste «IP del cliente» con las fichas «La IP de la conexión» y «La que trae X-Forwarded-For». Fichas de origen: `casa-lucia` y `tu-laptop`; de mensaje: «Una petición» y «Una ráfaga de 20».
- **Tareas (estado final):** (1) que la ráfaga de `casa-lucia` termine en 429; (2) que la petición de `tu-laptop`, mandada después, reciba 200.
- **Fallo y causa:** antes del ajuste, el origen ve todas las peticiones con la IP de `servidor-nuevo` y las cuenta juntas: después de la ráfaga, hasta la petición de `tu-laptop` recibe 429. El 429 lo genera `servidor-app` y el proxy lo reenvía tal cual (D-26 = A: el origen toma la última entrada).
- **Pregunta:** «Antes del cambio, ¿por qué `tu-laptop` recibía 429 si mandó una sola petición?» Correcta (2.ª): el origen veía todas las peticiones con la IP del proxy y las contaba juntas. Incorrectas: «Porque el proxy limita las peticiones» (el 429 vino del origen); «Porque `tu-laptop` mandó demasiadas».
- **Pistas:** (1) fíjate de quién cree el origen que viene cada petición. (2) la cabecera `X-Forwarded-For` trae la IP del cliente.
- **Rigor:** el cliente puede escribir su propia `X-Forwarded-For`; por eso el origen toma la última entrada, la que agregó su proxy. Cómo lo hace cada programa real no se verificó. Los clientes de la oficina salen todos con la IP pública `203.0.113.10` (NAT del capítulo 2): un límite por IP también los junta **[inferencia]**. **Dato práctico (D-6, variante B):** el takeaway cuenta que muchas apps nuevas empiezan con la app en `127.0.0.1:3000` detrás del servidor web, en el mismo equipo; aquí está en su propio equipo para que se vean los dos tramos.

**03-08 · ¿El origen o el proxy?** · `send` con la tarjeta «Orígenes» de `servidor-nuevo` · términos: error 5xx, 500 Internal Server Error (apoyo), 503 Service Unavailable, 504 Gateway Timeout.
- **Mundo:** `/informe` tarda 90 s (más que la espera del proxy, 60 s); `/pedidos/roto` falla; `removeOrigin` de `servidor-nuevo` vacía su lista de orígenes. El report nombra a `servidor-app` y a `servidor-nuevo` («Lucía quitó servidor-app de la lista de orígenes de servidor-nuevo para actualizarlo»). Dibuja lo del 07.
- **Qué viaja:** tres `curl -i` por el proxy: a `/pedidos/roto` (500 de `servidor-app`, que el proxy pasa tal cual), a `/informe` (504 de `servidor-nuevo`) y, con la lista vacía, a cualquier path (503 de `servidor-nuevo`). La caja dice «Quién lo generó».
- **Jugador y fichas:** vuelve a poner `servidor-app` en la lista de orígenes (tabla: IP y puerto; fichas `198.51.100.61:3000`, `198.51.100.61:3001`, `198.51.100.62:3000`).
- **Tareas (estado final):** (1) `/pedidos/roto` da 500 generado por `servidor-app`; (2) `/informe` da 504 generado por `servidor-nuevo`; (3) `/pedidos?id=7` da 200.
- **Pregunta:** «¿Quién generó el 504?» Correcta (3.ª): `servidor-nuevo`, porque el origen no contestó a tiempo. Incorrectas: `servidor-app` (no llegó a contestar); `tu-laptop` (un cliente no genera códigos).
- **Pistas:** (1) el proxy pasa tal cual lo que el origen contesta, incluso sus errores. (2) un proxy genera su propio código cuando el origen no contesta.
- **Rigor (4.2):** el 503 sale de una lista vacía, el caso «no registered targets» del ALB. El juego **no** enseña «todos los orígenes caídos = 503»: un ALB así falla abierto (capítulo 7). Otros proxies pueden dar otro código **[sin verificar]**. Un 5xx dice que el servidor falló o no puede cumplir una petición que parece válida.

**03-09 · Rechazada o cortada** · `send` con la tarjeta «Tiempos» de `servidor-app`, el reloj del juego y los ajustes · términos: 502 Bad Gateway, conexión persistente, idle timeout. **Su contenido depende de D-19.**
- **Mundo:** `setProcess` de `servidor-app`: el programa de la app terminó. El report nombra a `servidor-app` («El programa de la app en servidor-app terminó»). Dibuja `tu-laptop`, `servidor-nuevo` y `servidor-app`.
- **Primer caso (rechazada):** un `curl` con la app detenida. `servidor-app` rechaza la conexión del proxy con un RST y el proxy genera un 502. El jugador arranca la app (ajuste «El programa de la app»: «Corriendo»).
- **Segundo caso (cortada, D-19 = B):** el proxy reutiliza hasta 60 s una conexión sin uso (idle timeout del proxy); `servidor-app` cierra las suyas a los 5 s (el `keepAliveTimeout` de Node, 5000 ms). Con las fichas «Esperar 3 s», «Esperar 5 s» y «Esperar 10 s» del reloj del juego entre dos peticiones: 3 s da 200 (la conexión se reutiliza), 5 s da 502 (la petición del proxy se cruza con el cierre) y 10 s da 200 (el proxy ya supo del cierre y abre otra conexión). Con D-19 = A, el 502 sale con la espera de 10 s y el texto declara un proxy que no vigila las conexiones sin uso.
- **Jugador y fichas:** sube el idle timeout de `servidor-app` por encima de los 60 s del proxy (fichas `5 s`, `30 s`, `65 s`, `120 s`; con `30 s` el cruce ocurre a los 30 s).
- **Tareas (estado final):** (1) con la app corriendo, `curl` da 200; (2) tras esperar 5 s, otra petición da 200.
- **Pregunta (D-19 = B):** «¿Por qué el 502 solo salía con la espera de 5 s?» Correcta (1.ª): el origen cerraba la conexión sin uso justo cuando el proxy mandó la petición: se cruzaron. Incorrectas: «Porque la app se cae cada 5 s» (sin espera contestaba); «Porque el proxy tarda en contestar» (eso sería un 504).
- **Pistas:** (1) el origen cierra las conexiones sin uso a los 5 s. (2) el proxy cierra las suyas a los 60 s: que cierre primero el proxy quita el cruce.
- **Rigor (4.2):** RFC 9112 §9.5: quien tiene conexiones abiertas las vigila y el 502 sale en el cruce. AWS documenta la misma condición para el ALB (el keep-alive del destino menor que el idle timeout del balanceador). El proxy del juego no reintenta; RFC 9110 §9.2.2 prohíbe a un proxy reintentar una petición no idempotente. Cómo se porta un ALB real con una espera cualquiera **no se verificó**.

**Revisión de los textos del bloque 3** (07 a 09) por un revisor `sonnet`, antes del bloque 4.

### Bloque 4 · Cifrar y probar quién eres

**03-10 · Lo que ve el camino** · `send` con la captura de `router-proveedor` · términos: cifrado, cifrado simétrico, TLS, HTTPS.
- **Mundo:** `setWebService` de `servidor-nuevo`: TLS en el 443 con un certificado de `www.lucia.example`. El report nombra a `servidor-nuevo` («Lucía activó HTTPS en servidor-nuevo»). Quien mira es `router-proveedor`, porque reenvía todo lo que pasa entre la oficina e internet (D-7 = A). Dibuja `tu-laptop`, `router-oficina`, `router-proveedor`, `servidor-dns`, `servidor-nuevo` y `servidor-app`.
- **Qué viaja:** el inicio de sesión del 06 contra `www.lucia.example`: `curl -i -u lucia:… http://www.lucia.example/admin` y la misma por `https://`. La tarjeta «Lo que ve router-proveedor» (V25 = A2) tiene un grupo por protocolo («Por http://», «Por https://»), con lo que se lee y lo que va cifrado.
- **Jugador y fichas:** cambia el esquema de la URL a `https` (fichas de URL completa, `http://…` y `https://…`).
- **Tareas:** (1) que la petición por `https` vuelva con 200 (`expect.secure`); (2) que la captura ya no muestre la credencial (`expect.hidden`).
- **Fallo y causa:** por `http://`, la captura muestra la petición entera, con la cabecera `Authorization`. Por `https://`, muestra las IP, los puertos y el nombre del sitio, y «datos cifrados» donde estaba el mensaje.
- **Pregunta:** «Con HTTPS, ¿qué sigue viendo `router-proveedor`?» Correcta (2.ª): las IP, los puertos y el nombre del sitio. Incorrectas: «Nada: HTTPS cifra todo»; «El path y las cabeceras» (van cifrados).
- **Pistas:** (1) compara la captura de `http://` con la de `https://`. (2) el cifrado esconde el contenido del mensaje, no a dónde va.
- **Rigor (4.3 y 4.4):** HTTPS es HTTP dentro de TLS y el 443 es costumbre. Bajo TLS 1.3 el camino ve las IP, los puertos y el nombre que el cliente manda en claro; el término del nombre llega en el 14 y aquí se dice «el nombre del sitio». La consulta DNS también viaja en claro. El juego dice «TLS» y no «certificado SSL». El cifrado de este incidente es el simétrico: una clave que ambos tienen.

**03-11 · ¿Eres tú?** · `send` con la tarjeta de hosts de `tu-laptop` y la de certificados · términos: cifrado asimétrico, clave pública, clave privada, firma digital, certificado. Denso (cinco términos difíciles).
- **Mundo:** `addActor` de `servidor-falso` (`192.0.2.66`, un programa a medida con una copia del certificado de Lucía y su propia clave) y `setHosts` de `tu-laptop` con una línea que manda `www.lucia.example` a `192.0.2.66`. El report nombra a `tu-laptop` («Un programa que alguien instaló en tu-laptop agregó una línea a su archivo hosts: www.lucia.example va a 192.0.2.66»). Dibuja `tu-laptop`, `router-oficina`, `router-proveedor`, `servidor-nuevo` y `servidor-falso`.
- **Qué viaja:** `curl https://www.lucia.example/`: con la línea llega a `servidor-falso` y muere en la firma; sin la línea llega a `servidor-nuevo`. La caja muestra el certificado que llegó y quién firmó el saludo.
- **Jugador y fichas:** quita la línea del archivo hosts (tabla de hosts de `tu-laptop`, con un botón por fila). Ficha de URL: `https://www.lucia.example/`.
- **Tareas (estado final):** que el `curl` a `www.lucia.example` llegue a `servidor-nuevo` y vuelva con 200.
- **Fallo y causa:** con la línea, `servidor-falso` presenta la copia del certificado, que es pública, y firma el saludo con **su propia** clave porque no tiene la de Lucía. El cliente comprueba la firma con la clave pública del certificado y no cuadra: `curl: (35) TLS connect error: OpenSSL/3.5.8: error:0A00007B:SSL routines::bad signature` (leído en el código; ver el spec). No hay ningún código HTTP. Resultado `tls-failed`, con el sello de V26.
- **Pregunta:** «¿Por qué no le sirvió al impostor copiar el certificado de Lucía?» Correcta (3.ª): firmar exige la clave privada, y no la tiene. Incorrectas: «Porque el certificado copiado está cifrado» (el certificado es público); «Porque la copia cambia el nombre» (el nombre es el mismo).
- **Pistas:** (1) el certificado se reparte a todos; lo que no se reparte es la clave privada. (2) quien firma el saludo es el servidor, con su clave privada.
- **Rigor (4.5):** en TLS 1.3 la clave privada **firma** (`CertificateVerify`) y no descifra nada; el cifrado con la clave pública existe (capítulo 8) pero no viaja dentro de TLS (D-9 = A). Un servidor real no arranca con un certificado que no cuadra con su clave: `servidor-falso` es un programa a medida y el texto lo dice. Ninguna clave se muestra: la tarjeta dice quién tiene cada una.

**Revisión de los textos del bloque 4** (10 y 11) por un revisor `sonnet`, antes del bloque 5.

### Bloque 5 · El certificado y el saludo

**03-12 · ¿Quién lo firmó?** · `send` con la tarjeta «Raíces de confianza» de `tu-laptop` · términos: hash, autoridad certificadora, cadena de certificados, certificado autofirmado (apoyo), openssl s_client (apoyo). Denso (cinco términos).
- **Mundo:** `setTls` de `servidor-falso`: en el 443 presenta un certificado editado (con su propia clave pública, pero con la firma de la autoridad sobre el original) y en el 8443 uno autofirmado que dice `www.lucia.example`. El report nombra a `servidor-falso` («El programa de servidor-falso ahora prueba dos certificados más»). Dibuja `tu-laptop`, `servidor-nuevo` y `servidor-falso`.
- **Qué viaja:** tres `openssl s_client` de `tu-laptop` con el nombre `www.lucia.example` (`-servername`): a `servidor-nuevo:443`, a `servidor-falso:443` y a `servidor-falso:8443`. La salida de `openssl s_client` (D-12 = A) muestra la cadena y `Verification: OK` o `Verification error: …`.
- **Jugador y fichas:** lee la cadena y la tarjeta de raíces de `tu-laptop` (una tabla de autoridades de confianza). Fichas de mensaje: `s_client · puerto 443` y `s_client · puerto 8443`; de dirección: `198.51.100.60` y `192.0.2.66`.
- **Tareas:** (1) la conexión a `servidor-nuevo` verifica (`expect.verification`: ok); (2) la del 443 de `servidor-falso` da `certificate signature failure`; (3) la del 8443 da `self-signed certificate`.
- **Fallo y causa:** el certificado editado ya no tiene el hash que la autoridad firmó, así que su firma no vale; el autofirmado no lo firmó ninguna raíz que `tu-laptop` traiga. `openssl s_client` no corta ante un error de verificación: lo dice en `Verification error`.
- **Pregunta:** «El certificado autofirmado del impostor decía `www.lucia.example`. ¿Por qué `tu-laptop` no lo da por bueno?» Correcta (1.ª): ninguna raíz de confianza de `tu-laptop` lo firmó. Incorrectas: «Porque el nombre no coincide» (coincide); «Porque no estaba cifrado» (el cifrado no firma nada).
- **Pistas:** (1) un certificado vale si la cadena llega a una raíz que el cliente ya trae. (2) mira la tarjeta de raíces de `tu-laptop`.
- **Rigor (4.5 y 4.6):** el servidor manda la cadena y puede omitir la raíz; cada cliente tiene su propia lista de raíces (la de `tu-laptop` la comparten `curl` y el navegador, simplificación declarada). `openssl s_client` no comprueba el nombre sin `-verify_hostname`: eso lo hace `curl` en el 13. Apagar la verificación en el propio programa (por ejemplo `NODE_TLS_REJECT_UNAUTHORIZED=0`) no es un arreglo. La autoridad no es una pieza del mapa. Cambiar un byte cambia el hash. La cadena incompleta queda de reserva.

**03-13 · ¿Es para este nombre?** · `send` con la tarjeta de certificados de `servidor-nuevo` · términos: SAN, certificado comodín, validación del certificado. **Su contenido depende de D-21.**
- **Mundo:** `setDns` de `servidor-autoritativo` (registro A de `lucia.example` a `198.51.100.60`; el nombre de la zona no admite un CNAME, capítulo 2) y `issueCertificate` de `servidor-nuevo` (un certificado comodín `*.lucia.example` para los sitios). El sitio de la tienda suma el nombre `lucia.example`. El report nombra a `servidor-autoritativo` y a `servidor-nuevo` («Lucía pidió un certificado para *.lucia.example y creó el registro A de lucia.example»). Dibuja `tu-laptop`, `servidor-dns`, `servidor-autoritativo` y `servidor-nuevo`.
- **Qué viaja:** `curl https://www.lucia.example/` y `curl https://lucia.example/`. La caja muestra la validación: nombre, cadena y fechas.
- **Jugador y fichas (D-21 = B):** pide un certificado nuevo en la tarjeta de certificados: una bandeja con tres listas de nombres (`*.lucia.example`; `*.lucia.example` y `lucia.example`; `lucia.example`). El mundo lo emite y lo instala. El certificado viejo queda en la tarjeta.
- **Tareas (estado final):** (1) `www.lucia.example` valida y vuelve con 200; (2) `lucia.example` valida y vuelve con 200.
- **Fallo y causa:** con el comodín solo, `curl https://lucia.example/` termina con `curl: (60) SSL: no alternative certificate subject name matches target hostname 'lucia.example'` y el párrafo de ayuda de `curl`. No hay ningún código HTTP. El comodín cubre un nivel por debajo, no el nombre de la zona.
- **Pregunta:** «¿`*.lucia.example` cubre `lucia.example`?» Correcta (2.ª): no: un comodín cubre un nivel por debajo, no el nombre de la zona. Incorrectas: «Sí, el asterisco cubre todo»; «Sí, si el DNS apunta a la misma IP».
- **Pistas:** (1) el cliente busca el nombre de la URL en la lista de nombres del certificado. (2) un comodín reemplaza una sola etiqueta, la de más a la izquierda.
- **Rigor (4.6):** se valida contra el SAN, nunca contra el CN. El nombre sale de la URL, no de la IP. `*.lucia.example` no cubre `a.b.lucia.example`. Las fechas se dicen aquí y se juegan en el caso 3 de la guardia. **Con D-21 = A el incidente sería inexacto,** porque cambiar los nombres de un certificado deja su firma sin valor; por eso el jugador pide uno nuevo.

**03-14 · El saludo TLS** · `send` con la salida de `curl -v` · términos: saludo TLS, clave de sesión (apoyo), SNI, versiones de HTTP (apoyo).
- **Mundo:** `setDns` de `servidor-autoritativo` (zona `marta.example` con `marta.example` A `198.51.100.60`), `addSite` de `servidor-nuevo` (el sitio de Marta, con su propio certificado) y un certificado por defecto para quien llega sin nombre. El report nombra a `servidor-autoritativo` y a `servidor-nuevo` («Marta aloja marta.example en servidor-nuevo, con su propio certificado»). Dibuja lo del 13.
- **Qué viaja:** `curl -v https://www.lucia.example/`, `curl -v https://marta.example/` y `curl https://198.51.100.60/`. La caja suma «Saludo TLS»: el saludo va después del saludo de tres pasos; el cliente manda versiones, protocolos (`h2` y `http/1.1`) y el nombre en claro; el servidor elige el certificado, firma, y ambos calculan una clave de sesión por sentido.
- **Jugador y fichas:** manda con nombre y sin nombre (fichas de URL con el nombre y con la IP; mensaje `openssl s_client` con y sin `-servername`).
- **Tareas:** (1) `www.lucia.example` valida con el certificado de Lucía; (2) `marta.example` valida con el de Marta; (3) la petición por IP falla en la validación del nombre (`expect.tlsFailure`).
- **Fallo y causa:** por IP no hay SNI, así que el servidor da el certificado por defecto, y `curl` lo rechaza: `curl: (60) SSL: no alternative certificate subject name matches target ipv4 address '198.51.100.60'`.
- **Pregunta:** «¿Por qué el nombre viaja en claro en el saludo?» Correcta (3.ª): el servidor lo necesita para elegir el certificado antes de que exista la clave de sesión. Incorrectas: «Porque es un error de configuración»; «Porque TLS no cifra nada».
- **Pistas:** (1) un mismo servidor tiene varios certificados. (2) ¿qué sabe el servidor cuando recibe el primer mensaje?
- **Rigor (4.4 y 4.9):** un nombre que es una IP no viaja en el SNI (RFC 6066 §3). Sin SNI, el ALB da su certificado por defecto (AWS); otros servidores cortan el saludo **[local]**. Todo servidor del juego habla TLS 1.3, donde el certificado va cifrado. HTTP/3 va por UDP: una regla que abre TCP 443 no abre UDP 443; solo como texto (D-15 = A). La clave de sesión es una por sentido (RFC 8446 §7.1 y §7.3). `curl -v` omite el cifrado y el grupo negociados (spec, «Lo que el juego no imprime»).

**Revisión de los textos del bloque 5** (12 a 14) por un revisor `sonnet`, antes del bloque 6.

### Bloque 6 · HTTPS para todos y las API

**03-15 · Todos a HTTPS** · `send` con las tarjetas de redirección y HSTS · términos: terminación de TLS, redirección, 301 Moved Permanently, HSTS (apoyo).
- **Mundo:** `setRedirectToHttps` de `servidor-app`: Lucía puso en su app una redirección a HTTPS para todo lo que llega por `http://`. El report nombra a `servidor-app` («Lucía puso en su app una redirección a HTTPS»). Como TLS termina en `servidor-nuevo`, la app ve todo por HTTP y redirige siempre: es un bucle. Dibuja `tu-laptop`, `servidor-nuevo`, `router-destino` y `servidor-app`.
- **Qué viaja:** el navegador a `http://www.lucia.example` (bucle); la captura del tramo de `servidor-nuevo` a `servidor-app` (`router-destino`); `curl -L -d "producto=café" http://www.lucia.example/pedidos`.
- **Jugador y fichas:** quita la redirección de la app, la pone en `servidor-nuevo` y agrega HSTS (ajustes «Redirigir a HTTPS» y «HSTS», de `servidor-app` y de `servidor-nuevo`).
- **Tareas (estado final):** (1) el navegador va de `http://` a `https://` con una 301 y termina en 200 sin bucle; (2) una segunda visita al mismo sitio va directo a `https://`; (3) el `curl -L -d` termina en 200 con un GET.
- **Fallo y causa:** el navegador sigue la redirección de la app, vuelve a llegar por `http://` al origen (porque TLS termina en el proxy) y la app redirige otra vez: «Demasiadas redirecciones». Con `curl -L`: `curl: (47) Maximum (50) redirects followed`.
- **Pregunta:** «¿Por qué la app de `servidor-app` no podía hacer la redirección?» Correcta (1.ª): ve todo por HTTP, porque TLS termina en el proxy, y redirige siempre. Incorrectas: «Porque la app no sabe redirigir»; «Porque HSTS lo impide».
- **Pistas:** (1) mira por qué esquema le llega la petición a `servidor-app`. (2) la redirección va donde termina TLS.
- **Rigor (4.7 y 4.8):** la redirección necesita el 80 abierto y escuchando; cerrar el 80 es mínimo privilegio y deja sin redirección a quien escriba `http://` (D-14 = A: como texto). Una 301 puede volver GET a un POST; una 307 o 308 lo conserva (RFC 9110 §15.4; `lib/http.c` de curl 8.21.0). El ALB solo hace 301 y 302. HSTS solo vale por HTTPS, no cubre la primera visita y no reemplaza la redirección. El otro arreglo válido, que la app lea `X-Forwarded-Proto`, va en el takeaway.

**03-16 · Datos para programas** · `send` · términos: API, JSON, REST.
- **Mundo:** `setWebService` de `servidor-app`: `/api/pedidos` con JSON y un enlace a las líneas de cada pedido. El report nombra a `servidor-app`. Dibuja `tu-laptop`, `servidor-nuevo` y `servidor-app`.
- **Qué viaja:** `curl https://www.lucia.example/api/pedidos/7`, al enlace que trae la respuesta y un POST con un cuerpo mal formado.
- **Jugador y fichas:** URL completas y cuerpos: `{"producto":"café"}` y `{'producto':'café'}`. Elige el cuerpo y sigue el enlace.
- **Tareas:** (1) 200 con el pedido 7 en JSON; (2) 200 con las líneas, siguiendo el enlace; (3) 400 con el cuerpo mal formado.
- **Pregunta:** «¿Esta API es REST porque devuelve JSON?» Correcta (2.ª): no: REST es un estilo, con recursos en URL, métodos y enlaces; JSON es solo un formato. Incorrectas: «Sí, REST es JSON por HTTP»; «Sí, porque usa GET».
- **Pistas:** (1) mira qué trae la respuesta además de los datos. (2) un cuerpo con comillas simples no es JSON.
- **Rigor (4.10):** REST no es «JSON por HTTP». «REST API» y «HTTP API» son nombres de producto de API Gateway y no aparecen hasta el 13. JSON no es un objeto de JavaScript; un cuerpo con comillas simples no es JSON **[local]**.

**Revisión de los textos del bloque 6** (15 y 16) por un revisor `sonnet`, antes del bloque 7.

### Bloque 7 · La guardia

**03-17 · Guardia: «la web no carga»** · `diagnose` con reparación en el caso 2 · sin términos nuevos (D-16 = A).
- **Mundo:** el del 16 más los cambios de cada caso (cada caso es un cambio sobre ese mundo y no sobre el del caso anterior); cada caso dibuja solo las piezas que usa (`shown` por caso). El report de cada caso nombra lo que cambió.
- **Qué viaja:** lo que el jugador elija. El caso 1 muestra el orden de seis pruebas: ¿resuelve el nombre (`dig`)?, ¿hay ruta (`ping`)?, ¿contesta el puerto (`nc`)?, ¿completa el saludo TLS (`openssl s_client`)?, ¿qué código vuelve (`curl -i`)?, ¿quién lo generó (la caja)?
- **Éxito:** nombrar la causa de cada caso; en el 2, también pedir un certificado que cubra `lucia.example` hasta que el `curl` vuelva con 200. Pistas y report por caso. Las estrellas son las de siempre: cerrar es los siete casos cerrados (en el 2, causa y reparación); la del medio es ninguna pista; explicar es la causa de los siete a la primera.

| Caso | Reporte y origen | Qué enseña la evidencia | Causa | Opciones incorrectas (error que reflejan) |
|------|------------------|--------------------------|-------|-------------------------------------------|
| 1, guiado (2.ª) | «El `curl` a `https://www.lucia.example` vuelve con un error»; origen `tu-laptop`; el programa de la app de `servidor-app` terminó (el report nombra a `servidor-app`) | Resuelve, hay ruta, el 443 contesta, el saludo se completa y vuelve un 502 generado por `servidor-nuevo`. Un `curl` directo a `servidor-app:3000` da `Connection refused` | El proceso de la app de `servidor-app` terminó | «El certificado venció» (el saludo se completó); «La app falló y dio 500» (un 500 del origen pasa tal cual; este código lo generó el proxy) |
| 2, repara (1.ª) | «`curl https://lucia.example` no carga»; origen `tu-laptop` | Resuelve, hay ruta, el 443 contesta y el saludo falla en la validación del nombre: no hay ningún código | `lucia.example` no está en el SAN del certificado | «El servidor dio 404» (no hubo código); «Es autofirmado» (la cadena llega a una raíz) |
| 3 (3.ª) | «`curl https://blog.lucia.example` falla, pero `www` carga»; el certificado de `blog` venció (el report nombra a `servidor-nuevo`) | Falla la validación por fecha; `www` valida | El certificado de `blog.lucia.example` venció | «El nombre no está en el SAN» (coincide); «El proxy no alcanza el origen» (eso sería un 502, y habría código) |
| 4 (2.ª) | «Marta no puede entrar a `/admin`»; Lucía le quitó el permiso de administración (el report nombra a `servidor-app`) | 403 en `/admin` con la credencial de Marta; con la de Lucía, 200 | Marta está autenticada y no tiene permiso | «Su contraseña está mal» (eso sería 401); «El proxy no tiene a quién reenviar» (eso sería 503) |
| 5 (3.ª) | «El navegador dice que hay demasiadas redirecciones»; Lucía puso otra vez la redirección en la app (el report nombra a `servidor-app`) | `curl -L` termina en `Maximum (50) redirects followed`; la captura del tramo muestra HTTP en claro | La app redirige a HTTPS detrás de la terminación de TLS | «El 443 está cerrado» (habría rechazo, no 301 repetidas); «HSTS bloquea el sitio» (HSTS no redirige) |
| 6 (1.ª) | «`https://www.lucia.example/pedidos` tarda y falla»; origen `tu-laptop`; la app tarda más que la espera del proxy (el report nombra a `servidor-app`) | 504 generado por `servidor-nuevo`; un `curl` directo al origen tarda | El origen tarda más que la espera del proxy | «La app se cayó» (eso sería 502); «No hay orígenes en la lista» (eso sería 503) |
| 7 (2.ª) | «`curl https://192.168.1.11:3000/` falla»; Lucía volvió a correr su app en `laptop-lucia` (el report nombra a `laptop-lucia`) | Resuelve, hay ruta, el 3000 contesta, y el saludo TLS falla con `wrong version number`, sin código | La app habla HTTP sin TLS en ese puerto | «El firewall descarta» (sería silencio); «Falta la IP en el SAN» (la app no tiene certificado) |

La correcta va en la posición 2.ª en el caso 1, 1.ª en el 2, 3.ª en el 3, 2.ª en el 4, 3.ª en el 5, 1.ª en el 6 y 2.ª en el 7. Los siete casos tienen causas distintas. Las tres opciones de cada caso quedan equilibradas para que la correcta no sea la más larga, y ninguna opción dice que un equipo está apagado (el capítulo 1 lo decidió y sigue valiendo). El caso 7 es el modo de fallo nuevo del capítulo: ni nadie escucha ni un firewall calla; el proceso habla otro protocolo.

**Revisión de los textos del bloque 7** (17) por un revisor `sonnet`.

## Cambios visibles en los capítulos 1, 2 y 4

Lo que ve quien juega el capítulo 1, el 2 o el 4 con este plan. La lista sale de lo que las tareas editan: las pruebas, los documentos y los textos que existen hoy y que alguna tarea toca. Las trazas y el test dorado no cambian.

**Capítulo 4**
- **El 04-01 se abre con el 03-17.** Hoy, con el plan del capítulo 2, se abre con el 02-14 (decidida 18 de ese plan: «cuando exista el capítulo 3, el 04-01 pasará a abrirse con su último incidente»). Quien ya ganó una estrella en el 04-01 lo conserva abierto. Tarea 28.
- **El glosario es más largo.** Antes de pisar el capítulo 4 el jugador conoce 156 términos (38 del capítulo 1, 53 del 2 y 65 de este), no 91.
- **Ningún término del capítulo 4 se muda al 3.** Se buscaron los 65 nombres y ids en los documentos del capítulo 4 y no hay ninguno (spec, «Escalera de términos»). Los 15 términos registrados «del capítulo 4» no chocan con ninguno.
- **Las cajas, las tarjetas y las etiquetas del capítulo 4 no cambian.** Los campos nuevos (petición y respuesta HTTP, quién generó el código, saludo TLS, certificado, lo que ve el camino, procesos) aparecen solo en un dispositivo con `web`, con procesos o con certificados, y la VPC no trae ninguno. Una prueba lo guarda (Tarea 21).
- **Las capturas de `#/entidades` cambian en la Tarea 27,** por el sello nuevo del fallo de TLS (V26): `entities-darwin.png` siempre e `interface-darwin.png` solo si el catálogo gana una fila. El sello no aparece en el capítulo 4.
- **Sin cambios de comportamiento:** `04-iaas/shared.ts` no cambia, el test dorado no se edita y la batería de sondas no se toca.

**Capítulo 2**
- **El 02-14 abre el 03-01,** no el 04-01. Después de la guardia del capítulo 2 sigue el capítulo 3.
- **`CHAPTER_2_DONE` deja de abrir el 04-01.** El ayudante de `tests/e2e/saved-progress.ts` sigue listando `02-01` a `02-14`; el 04-01 lo abre ahora `CHAPTER_3_DONE`. Cambian a propósito la prueba de Playwright `04-01 opens after 02-14 has a star` (del plan del capítulo 2, Tarea 34), que pasa a `04-01 opens after 03-17 has a star`; la `CHAPTER_2_DONE opens 04-01 once chapter 2 exists` (Tarea 22 de ese plan), que pasa a abrir el 03-01; y las filas que la Tarea 33 de ese plan sumó a `src/storage/progress.test.ts`. La Tarea 1 busca los nombres exactos con un script.
- **Los textos del capítulo 2 no cambian,** salvo que la búsqueda de palabras corrientes de la Tarea 1 y de la Tarea 3 encuentre un choque con uno de los 65 términos: en ese caso se arregla el texto del capítulo 2 y se anota aquí.
- **Los documentos del capítulo 2** (su spec y su plan) dicen en varios sitios «el 04-01 se abre con el 02-14». La Tarea 46 agrega una nota que dice que el capítulo 3 lo reemplaza.
- **La hoja de ruta y el README** dejan de decir «Próximamente» para el capítulo 3.

**Capítulo 1**
- **Ningún texto, comportamiento ni apariencia cambia.** El glosario de Lucía en los incidentes del capítulo 1 no cambia: los términos nuevos todavía no son conocidos.

**Pruebas que cambian a propósito** (lo que prueban se conserva; la Tarea que las toca las lista):
- `src/levels/contract/incident.test.ts`, `rejects a command that is not a packet, a ping or a traceroute`: usa `curl` como ejemplo de comando inválido. `curl` pasa a ser válido (Tarea 19); el ejemplo inválido pasa a ser `wget`.
- `src/levels/registry.test.ts`, `cites a lesson of syllabus.md and a concept note that exists`: pasa a exigirlos solo en un capítulo que nombra módulos (Tarea 2).
- Las pruebas que recorren `OUTCOMES` o `StampState` suman el caso nuevo `tls-failed` o `rejected` (Tareas 14 y 27); la Tarea 14 las encuentra con un script de búsquedas, no de memoria.
- Las pruebas de `terms.test.ts` que fijan el tamaño del registro, si existen (Tarea 3).
- Las pruebas de Playwright que abren el 04-01 con `CHAPTER_2_DONE` (`incidents.spec.ts`, `card-layout.spec.ts`) pasan a `CHAPTER_3_DONE` (Tarea 28).

## Review Focus

Cada riesgo, con la prueba que lo guarda.

1. **El capítulo 4 no cambia.** Test (el de hoy, sin tocar): `chapter 4 golden traces keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model`. En las Tareas 5 a 18, `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Pruebas nuevas: `the new trace fields are absent from every trace of a VPC` (Tarea 6) y `the web stage writes no step for a packet with no message` (Tarea 6).
2. **Los capítulos 1 y 2 no cambian.** Sus pruebas corren sin editarse en cada tarea de motor, en particular (las de hoy) `the trip out of the office has no step and no reason that names NAT or the public IP`, `a private address is dropped by the first router outside the office, with no warning` y las de `steps` con `toEqual`. Prueba nueva: `the sends of chapters 1 and 2 give the same traces with the state this chapter adds to Carried` (Tarea 17).
3. **Los 65 términos, cada uno en su subcapítulo.** Tests: `registers the 65 new ids of chapter 3` y `every definition of chapter 3 names only terms that are known at its incident, in the approved order` (Tarea 3); `introduces, incident by incident, the terms of the approved design` (Tarea 28, ampliado en cada bloque); `introduces exactly the 65 terms of the approved design, each in its incident` y `no term of the approved design is missing: the ids of the table of the spec equal the ids that 03-01 to 03-17 introduce` (Tarea 44).
4. **Nada de lo que viene después.** Test: `names no topic of the chapters that come later, in any text of chapter 3` (Tarea 44; CORS, caché HTTP, token, JWT, OAuth, Cognito, firma de AWS, ACM, balanceador, CloudFront, API Gateway, Lambda, `Security Group`, IPv6, WebSocket). Ningún texto de un incidente nombra, con palabras corrientes, un término que presenta uno posterior: `a text of an incident names no term that a later incident of chapter 3 introduces` (Tarea 28). La salida literal de una herramienta es la excepción declarada y la fija un test (Tarea 22).
5. **El mensaje HTTP no es un paquete.** Tests: `no packet shape, entity or catalog row is named after HTTP` (Tarea 27), `a packet with a message travels in a tcp connection that the greeting opened` (Tarea 6) y `no text calls an http message a packet` (Tarea 21).
6. **La respuesta no se bloquea y ningún texto dice por qué.** Tests: `the reply of an http exchange is never stopped by a firewall, outbound or inbound` (Tarea 6) y `no text says stateful or gives a reason for a reply to come back` (Tarea 21, ampliado).
7. **Cada cambio de mundo se nombra.** Test (el de hoy, sin cambiar su nombre; la Tarea 4 lo amplía): `every change to the world of an incident is explained by naming the device, server or program it changes`. Las pruebas de `changedNames` de las Tareas 4, 5, 8, 10 y 13 comprueban que cada campo nuevo se lista, y cada incidente tiene su prueba `03-NN: the report names …`, como `03-07: the report names laptop-lucia, servidor-nuevo and servidor-app`.
8. **Silencio, rechazo, desajuste y código no se confunden.** Tests: `a tcp port nobody listens on answers with a reset and a firewall that drops answers with nothing` (el de hoy), `a tcp port whose process stopped answers with a reset and a firewall that drops answers with nothing` (Tarea 5), `tls to a port that speaks plain http ends in a failed greeting with no status code` (Tarea 15) y `a status code exists only when a response exists` (Tarea 6).
9. **Quién generó cada código.** Tests: `a 500 of the origin goes through the proxy untouched and says the origin generated it` (Tarea 10), `the proxy passes a 429 of the origin through untouched` (Tarea 11), `a code that the proxy generates says the proxy generated it` (Tarea 10) y `the box says who generated the code once status-code is known` (Tarea 21).
10. **El 502 de la conexión persistente.** Tests (con D-19 = B, Tarea 12): `a request in the second the origin closes the idle connection ends in 502`, `a request before the idle timeout of the origin reuses the connection`, `a request after the origin closed opens a new connection and is answered` y `raising the idle timeout of the origin above the one of the proxy removes the crossing`.
11. **Lo que TLS 1.3 deja ver.** Tests (Tarea 18): `the capture of a path shows the addresses, the ports and the name of the site of a tls greeting and never its certificate`, `the capture of a path shows an http message in the clear and hides it inside tls` y `a dns query is shown in the clear in the capture`.
12. **La firma y la clave privada.** Tests: `a signature holds when the digest it signed equals the digest of the data` y `a copy of a certificate carries no private key` (Tarea 13); `the server signs the greeting with its private key and the client checks it with the public key of the certificate` y `a server that holds no private key for the certificate it presents fails the signature check` (Tarea 15).
13. **La validación.** Tests: `a name is checked against the SAN and never against a common name`, `a wildcard covers one label below and not the name of the zone nor two labels`, `a self-signed certificate fails when the client does not trust it`, `a certificate out of its dates fails against today and the dates are inclusive` y `a chain that ends in a root the client does not trust fails` (Tarea 14); `a certificate with an edited name loses its signature` (Tarea 13).
14. **SNI y el certificado por defecto.** Tests (Tarea 15): `a name that is an ip is not sent as server name`, `a greeting with no server name gets the default certificate` y `the server answers with the certificate that matches the server name`.
15. **Redirección, bucle y HSTS.** Tests: `a 301 turns a post into a get and a 307 keeps it`, `the browser follows at most 20 redirects and then stops`, `curl follows at most 50 redirects and then stops`, `hsts is ignored when it arrives over plain http` y `the browser remembers hsts from a response over tls and goes straight to https the next time` (Tarea 17); `an app that redirects to https every request it receives loops behind the termination of tls` (Tarea 16).
16. **401 frente a 403.** Tests (Tarea 9): `a request with no credential to a protected path answers 401 with WWW-Authenticate`, `a request with the credential of a user without the role answers 403` y `repeating a request with the same credential gives the same 403`.
17. **Idempotencia.** Tests (Tarea 7): `a put leaves the order as its body says and a second put leaves it the same`, `a post creates the next order and a second post creates another` y `a delete removes the order and a second delete answers 404 with the same state`.
18. **Host y sitios.** Tests: `the site is chosen by the host header and not by the ip`, `a name with no site gets the default site` y `a name that went through a cname travels in host as the url wrote it`.
19. **`X-Forwarded-For` y el 429.** Tests (Tarea 11): `the origin counts the requests of one ip in one second of the game`, `the proxy adds the client ip to X-Forwarded-For`, `with clientIpFrom forwarded-for the origin counts by the last entry of X-Forwarded-For` y `a client that writes its own X-Forwarded-For does not change the entry the proxy added`.
20. **Pureza.** Tests: `gives the same traces for the same sends` (el del capítulo 2, sobre el estado nuevo), `a move that changes the world clears the sends, the sessions, the counters, the connections and the browser memory and keeps the clock` y la regla de lint de `pure-domain-core` (`pnpm lint`).
21. **Las salidas de las herramientas son fieles a su fuente.** Tests: `every line curl prints matches the source of curl 8.21.0`, `every line openssl s_client prints matches the source of openssl 3.5.8`, `a line that the source cannot confirm is not printed` y `curl keeps no cookie unless it is given -b`. Cada uno cita su fuente y su fecha.
22. **Un mapa con más piezas no se amontona.** Tests de Playwright (Tarea 45): `in 03-07 the map and its labels fit the area at full size`, `in 03-10 and 03-15 no label or stamp overlaps` y `the cards of servers, certificates and capture cover no piece of the map`, a 1280×800 y a 1440×900.
23. **Las capturas cambian solo lo que se quiso** (Tarea 27): el diff muestra solo el especimen del sello nuevo; `entities` de Playwright pasa después.
24. **Carpetas y primitivas.** `pnpm structure` pasa en cada tarea; el tope de 12 no se rompe; ninguna primitiva nueva salvo la sección que se pliega (V27 = D), una para toda la familia y justificada en `DESIGN.md`.
25. **Los casos de la guardia se cuentan bien.** Tests (los de hoy): `the middle star is no hint asked in any case`, `the explained star needs every cause right at the first try` y `the case closes only when the cause is named and the tasks of its fix hold`. Pruebas nuevas: `03-17: each case starts from the world before the incident plus its own changes, not from the case before` (Tarea 44).
26. **Rigor, sin simplificar a lo falso.** Ninguna opción enseña algo inexacto. Tests: `no text calls the lock a sign that a site is trustworthy`, `no text says https encrypts everything`, `no text says the private key decrypts in tls`, `no text says rest is json over http`, `no text says a 4xx is always the fault of the client`, `no text says every dead origin gives 503`, `no text says the certificate is secret` y la lectura del estudiante en la prueba humana.
27. **Ejemplos de documentación.** Test: `every public address of chapter 3 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
28. **Texto llano.** La comprobación es el revisor de cada bloque (`sonnet`, antes de pasar al siguiente) y la prueba humana del capítulo entero, una sola.
29. **Los avisos de la red no son `Message`.** Tests: `a status code, a browser error and a line of a tool are drawn outside Message` y `every warning and error of the game in chapter 3 is drawn by Message` (Tarea 26).
30. **El mundo se encadena.** Tests: `03-01 starts from the world chapter 2 leaves` (Tarea 29) y `each incident of chapter 3 starts from the solved world of the one before it` (Tarea 28, crece con cada bloque).

## Árbol al terminar (solo lo cambiado)

- `README.md` · `DESIGN.md` (una línea: el estado de sello nuevo)
- `docs/` (raíz del repo)
  - `specs/2026-10-11-follow-the-packet-chapter-3-design.md`
  - `plans/2026-10-11-follow-the-packet-chapter-3.md` · `plans/follow-the-packet-roadmap.md` · `plans/2026-10-08-follow-the-packet-followups.md`
  - `research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 3)
- `.claude/rules/explained-behavior-changes.md` (una línea: procesos, sitios, certificados)
- `src/engine/`
  - `index.ts`
  - `network/`: `schema.ts`, `types.ts`, `actions.ts` y sus tests; `CLAUDE.md`
  - `web/` (nueva): `url.ts`, `messages.ts`, `sites.ts` y sus tests; `origin/` (`app.ts`, `users.ts`, `rate-limit.ts` y sus tests); `proxy/` (`proxy.ts`, `pool.ts` y sus tests)
  - `tls/` (nueva): `certificates.ts`, `trust.ts`, `validation.ts`, `handshake.ts` y sus tests
  - `client/` (nueva): `browser.ts`, `follow.ts` y sus tests
  - `observe/` (nueva): `capture.ts` y su test
  - `simulation/`: `simulate.ts`, `sequence.ts`, `trace.ts`, `context.ts`; `stages/web/` (nueva: `app.ts`, `tls.ts`, `proxy.ts`, `redirect.ts`)
- `src/copy/`: `terms.ts`, `reasons.ts`, `packet-labels.ts` y sus tests; `web/` (nueva: textos de motivos y de la caja); `tools/` (`curl-output.ts`, `openssl-output.ts` y sus tests)
- `src/levels/`
  - `world.ts`, `explained-changes.test.ts`, `registry.test.ts`, `ladder.test.ts`; `contract/`: `incident.ts`, `chips.ts`, `tables.ts` y sus tests
  - `03-the-web-inside/` (nueva): `shared.ts`, `CLAUDE.md`
    - `asking-for-a-page/`: `01-an-address-for-everything.ts`, `02-ask-and-answer.ts`, `03-who-answers.ts`, `04-one-server-many-sites.ts`, `CLAUDE.md`
    - `how-it-went/`: `05-how-did-it-go.ts`, `06-who-you-are-and-what-you-can.ts`, `CLAUDE.md`
    - `server-in-front/`: `07-a-server-in-front.ts`, `08-the-origin-or-the-proxy.ts`, `09-refused-or-cut.ts`, `CLAUDE.md`
    - `encrypt-and-prove/`: `10-what-the-path-sees.ts`, `11-is-it-you.ts`, `CLAUDE.md`
    - `certificate-and-greeting/`: `12-who-signed-it.ts`, `13-is-it-for-this-name.ts`, `14-the-tls-greeting.ts`, `CLAUDE.md`
    - `https-for-all/`: `15-everyone-to-https.ts`, `16-data-for-programs.ts`, `CLAUDE.md`
    - `on-call/`: `17-on-call-the-web-does-not-load.ts`, `cases.ts`, `CLAUDE.md`
- `src/game/`: `session.ts`, `flow-runs.ts`, `tasks.ts`, `chapters/` si la Tarea 1 la crea (`chapter-1.test.ts`, `chapter-2.test.ts`, `chapter-3.test.ts`), `index.ts`, `CLAUDE.md`
  - `view/`: `pieces.ts`, `inspection.ts` y sus tests
  - `view/cards/`: `web/` (nueva: `server-card.ts`, `browser-card.ts` y sus tests) y `tls/` (nueva: `certificate-card.ts`, `trust-card.ts`, `capture-card.ts` y sus tests); `terminal/` (`terminal-card.ts` y `output-card.ts` ampliados)
- `src/scene/`: `layout.ts`, `game-scene.tsx`; `entities/stamp.tsx`; `traffic/flow-look.ts`; `catalog/catalog-cells.tsx`
- `src/ui/incident/`: `inspection-box.tsx`; `map-cards/web/` (nueva: `server-card.tsx`, `browser-card.tsx` y sus tests) y `map-cards/tls/` (nueva: `certificate-card.tsx`, `trust-card.tsx`, `capture-card.tsx` y sus tests)
- `src/testing/`: `fixtures.ts`, `incidents.ts`
- `tests/e2e/`: `chapter-3/` (nueva: `chapter-3.spec.ts` y `chapter-3-play.ts`), `saved-progress.ts` (`CHAPTER_3_DONE`), `incidents.spec.ts`, `card-layout.spec.ts`, `entities.spec.ts`, `snapshots/` (una o dos capturas, regrabadas en la Tarea 27)

---

## Tareas

Cuarenta y siete tareas (0 a 46). Cada una: propósito, archivos, interfaces, tests con nombre, Review Focus, cierre y commit. El orden es el de ejecución: prototipos y decisiones, punto de partida, I1, términos, motor, contrato, sesión, texto y herramientas, tarjetas, escena, cadena, contenido en siete bloques, Playwright y documentos. Una tarea de contenido no empieza hasta que la anterior dejó `pnpm check` verde y, al cerrar un bloque, su revisor terminó y sus correcciones se aplicaron.

**Comprobación de la forma del motor en cada tarea 5 a 18:** `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida, las pruebas de los capítulos 1, 2 y 4 sin editar, y `pnpm structure` verde.

---

### Tarea 0: Prototipos y decisiones del estudiante (sin código del juego)

**Bloquea:** las Tareas 6 (D-25), 11 (D-26), 12 y 36 (D-19), 13, 40 y 44 (D-21 y D-22), 17 y 25 (D-23 y D-24), 19, 22 y 29 (D-20 y V28), 23 (V27), 24 (V23), 26 (V20, V21, V24 y V25) y 27 (V26). La Tarea 1 y las de motor que no nombra esa lista no dependen de ninguna decisión; si el estudiante no contesta, el plan sigue la recomendación. Es la única tarea sin código del juego.

Propósito: que el estudiante vea, renderizadas, las opciones visuales y conteste las ocho decisiones abiertas, **de a una por mensaje**.

**Archivos:**
- Modify: este documento (pasa cada respuesta a «Decididas» debajo de su decisión y a la tabla «Decisiones visuales», al final), `../../docs/specs/2026-10-11-follow-the-packet-chapter-3-design.md` (la tabla de «Decisiones abiertas») y `../../docs/plans/follow-the-packet-roadmap.md` (suma la fila del capítulo 3, en `en curso`).
- Fuera del repo: una página HTML de prototipos, publicada con la herramienta Artifact. Muestra, con las primitivas reales (colores y tokens de `DESIGN.md`, estilo B) y nunca con dibujos de texto:
  - **V20 · El mensaje HTTP:** (A) en la caja, con las secciones «Petición HTTP» y «Respuesta HTTP», y el paquete con la forma de TCP; (B) en la etiqueta del paquete («GET /pedidos» y «200»); (C) una forma nueva de paquete para HTTP. B y C se muestran como las opciones que **no** se recomiendan: B mezcla capas y, bajo TLS, la etiqueta mostraría lo que el camino no ve (inexacta); C dice que el mensaje es un paquete (inexacta).
  - **V21 · Quién generó el código:** (A) un campo «Quién lo generó» en la caja y la respuesta que sale de quien la generó; (B) una insignia sobre la pieza; (C) solo el color del código. B suma un elemento hermano y C no cumple «nunca solo color» (`DESIGN.md`).
  - **V22 · El navegador de `tu-laptop`:** (A) una pestaña de su tarjeta con la dirección, la página o el error como texto de la tarjeta y una tabla «Lo que recuerda»; (B) una ventana flotante sobre el mapa; (C) dos pestañas, «Navegador» y «Memoria».
  - **V23 · El certificado:** (A) una `Table` de campo y valor dentro de una `Card`, con la firma («vale» o «no vale») y quién tiene la clave privada dichos con palabra y marca; (B) un aspecto de documento con sello; (C) un candado verde en cada certificado válido, que es **inexacto**: el candado no dice que un sitio sea de fiar (investigación, 4.4).
  - **V24 · El saludo TLS en la caja:** (A) una lista numerada como la del saludo de tres pasos, con «(cifrado)» después del ServerHello; (B) un diagrama de secuencia con dos líneas de vida; (C) todos los mensajes en claro, que es **inexacto** en TLS 1.3 (RFC 8446 §1.2).
  - **V25 · Lo que ve el camino:** (A) una `Table` con una fila por paquete y cada campo marcado «se lee» o «cifrado»; (B) un volcado hexadecimal; (C) campos tachados solo con color.
  - **V26 · El sello del fallo de TLS:** (A) reutilizar «Bloqueado», que es **inexacto** (nadie descartó el paquete: el cliente lo rechazó); (B) un estado nuevo, «Rechazado por el cliente», con su palabra y su forma; (C) ningún sello.
  - **V27 · Muchas pestañas en una pieza:** `servidor-nuevo` con cinco y `tu-laptop` con cinco: (A) todas, en una fila que se desplaza; (B) agrupadas (servidor: «Sitios y certificados», «Proxy», «Redirección y HSTS»; laptop: «Terminal», «Navegador», «Red y confianza»); (C) en dos filas.
  - **V28 · La terminal de `curl` (D-20):** (A) bandejas apiladas, una por parte de la URL más una de opciones; (B) una franja de URL con las partes en línea y una bandeja de opciones; (C) solo URL completas.

**Pasos:**
- [x] Preparar la página de prototipos y mostrársela al estudiante. Publicada en https://claude.ai/artifact/CRqhoqv8GunPSNcdBpP9jc; la segunda ronda sumó V25 A1 a A3 y V27 D a F. El estudiante la vio y decidió todas las secciones (2026-10-11).
- [x] Recoger D-19 a D-26, una por mensaje, empezando por D-19 y D-21, que bloquean contenido. Las ocho contestadas el 2026-10-11 (D-20 y D-24, con V28 y V22).
- [x] Recoger V20 a V28, una por mensaje. Las nueve cerradas el 2026-10-11 (V25 = A2, V27 = D). Ver «Decisiones visuales».
- [x] Si alguna respuesta cambia el plan (por ejemplo D-19 = A, D-21 = A o D-25), reescribir las tareas que toca antes de seguir. Con D-21 = A el 13 y el caso 2 de la guardia serían inexactos: la tarea se detiene y se le dice al estudiante.
- [x] Escribir las elecciones en «Decisiones visuales» y debajo de cada decisión. Hecho en este plan y en el spec (2026-10-11); el roadmap no tiene nada que cambiar.
- [ ] Sumar la fila del capítulo 3 al roadmap, en `en curso`.

**Cierre:** solo cambian los tres documentos (este plan, el spec y el roadmap; el resto de `git status --short` no es suyo). Commit: `docs: record the decisions for chapter 3`.

---

### Tarea 1: Punto de partida y estructura

**Propósito:** comprobar que el capítulo 2 terminó como su plan dice y hacer sitio. Es una mudanza pura, si hace falta: ni una línea de lógica cambia. **Si el capítulo 2 se aparta de su plan en algo que este usa, la tarea se detiene y se le pregunta al estudiante.**

**Archivos:**
- Fuera del repo (en el directorio temporal de la sesión, nunca en el repo): un script de búsquedas que comprueba, por archivo y por nombre de prueba, cada pieza que este capítulo reutiliza. Los archivos: `src/design/primitives/panels/table.tsx`, `src/design/primitives/message.tsx`, `src/copy/tools/nc-output.ts` y `dig-output.ts`, `src/game/view/cards/terminal/output-card.ts`, `src/ui/incident/map-cards/terminal/output-card.tsx`, `src/ui/incident/clock-card.tsx`, `src/game/view/cards/piece-card.ts`, `src/engine/simulation/sequence.ts`, `src/engine/dns/cache.ts`, `src/levels/02-ports-and-names/` (los 14 incidentes), `tests/e2e/chapter-2/` y `CHAPTER_2_DONE` en `tests/e2e/saved-progress.ts`. Los nombres de pruebas: `a label draws one button however many cards its piece has`, `the output of dig shows only the status line and the answer until the rest is unfolded`, `takes no className and no style` (en `table.test.tsx` y en `message.test.tsx`), `the clock card shows only in an incident that has a clock`, `every protocol has an intruder version with the intruder border`, `gives the same traces for the same sends`, `introduces exactly the 53 terms of the approved design, each in its incident` y `04-01 opens after 02-14 has a star`.
- El mismo script compara la suma SHA-256 del spec y del plan del capítulo 2 con las de «Estado al empezar» (`65519dff…` y `2b195229…`) y, si difieren, imprime las líneas que cambiaron.
- Mide cada carpeta de `src/` y `tests/` y lista las que tienen 11 archivos o más. Cuenta, con el plan del 2 en la mano, cuántos archivos suma cada tarea de este plan a cada carpeta.
- Busca en los textos de los incidentes del capítulo 2 (`src/levels/02-ports-and-names/`) el nombre de cada uno de los 65 términos con la expresión de `namedTerms`. Un choque se arregla en el texto del capítulo 2 y se anota en «Cambios visibles».
- Move (solo si la medición lo pide): si `src/game/` está en 12 archivos, `src/game/chapter-1.test.ts` y `src/game/chapter-2.test.ts` pasan a `src/game/chapters/` (con su `CLAUDE.md`), y `chapter-3.test.ts` nace allí. Lo mismo para cualquier otra carpeta que la medición muestre sin sitio para lo que este plan le suma.
- Modify: los imports de lo que mude, las guías `CLAUDE.md` afectadas y la sección «Estado al empezar» de este plan, con los totales que midió (`pnpm check`: Vitest y Playwright).

**Interfaces:** ninguna nueva. Después de la mudanza, ninguna carpeta que este plan toque pasa de 12.

**Tests:** ninguno nuevo; todos los de hoy pasan sin cambiar su contenido.
- `git diff -M --stat` muestra solo renombres y cambios de import y de ruta.
- `pnpm check` verde, con las dos capturas de `#/entidades` iguales píxel a píxel. `git diff --exit-code src/levels/04-iaas/golden-traces.json` sin salida.

**Review Focus:** 1, 2, 24 y 30.

**Cierre:** si no hubo mudanza, no hay commit y el resultado del script va al orquestador. **Commit (si hubo mudanza):** `refactor: make room in the full folders before chapter 3`.

---

### Tarea 2: I1, la lección y la nota opcionales (D-17 = B)

**Propósito:** que un capítulo sin módulos del curso (`modules: []`) tenga incidentes sin lección en `syllabus.md` y sin nota en `concepts/`. La nota nace cuando el estudiante verifique el tema, como manda `CLAUDE.md` del repo: no se crea solo para un test.

**Archivos:**
- Modify: `src/levels/contract/incident.ts` (`lesson` y `concept` opcionales), `incident.test.ts`, `src/levels/registry.test.ts`, `src/testing/incidents.ts` si una fixture lo necesita, `src/levels/CLAUDE.md`, `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (I1 pasa a cerrado, con el commit).

**Interfaces:** `lesson` y `concept` son opcionales en `incidentSchema`. Una prueba exige que un incidente de un capítulo que nombra módulos las cite, y que una cita, si existe, apunte a algo que existe. Los incidentes de los capítulos 1, 2 y 4 siguen citando las suyas.

**Tests:**
- `incident.test.ts`, `accepts an incident that gives no lesson and no concept note`.
- `accepts an incident that gives a lesson and a concept note`.
- `rejects a lesson that is an empty string`.
- `registry.test.ts`, `cites a lesson of syllabus.md and a concept note that exists when its chapter names modules`.
- `an incident of a chapter that names no modules may leave out its lesson and its concept note`.
- `an incident that cites a concept note cites one that exists`.
- Cierre: golden sin cambios; los incidentes de los capítulos 1, 2 y 4 pasan sin editarse.

**Review Focus:** 24.

**Commit:** `feat(levels): make the lesson and the concept note optional for a chapter with no course modules`.

---

### Tarea 3: Los 65 términos en el registro

**Propósito:** que los motivos y los textos de las tareas siguientes puedan etiquetar los términos de este capítulo. Un término registrado y aún no presentado por ningún incidente es inerte.

**Archivos:**
- Modify: `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/levels/ladder.test.ts`, `src/copy/CLAUDE.md`.

**Interfaces:** 65 ids nuevos con el nombre oficial y la definición de la tabla del spec (120 caracteres o menos, sin términos que se presentan después), incluidos `curl` (105) y `session-key` (114, «una por sentido», D-10 = B). Ningún id nuevo entra en `TERM_ENTITY` ni en `ENTITY_TERMS`. Las definiciones citan su fuente en un JSDoc cuando traen una cifra o una regla (RFC 9110 y 8446).

**Cómo se calculó la escalera (spec, «Escalera de términos»):** un script que repite `namedTerms`. La prueba de esta tarea es ese script hecho código: una tabla de datos (id y subcapítulo) que no depende de que los incidentes existan.

**Tests:**
- `terms.test.ts`, `registers the 65 new ids of chapter 3`.
- `every definition of chapter 3 names only terms that are known at its incident, in the approved order`.
- `no definition of chapter 1, chapter 2 or chapter 4 names a term of chapter 3`.
- `the definition of curl does not name the request, the response or the greeting`.
- `the definition of session-key says there is one per direction`.
- `chapter 3 registers 55 core terms and 10 support terms`.
- `no plain word of the texts of chapters 1, 2 and 4 is the name of a term of chapter 3`.
- Los de hoy corren sobre los ids nuevos: `%s has a name and a short definition`, `ids are English kebab-case` y `only the IP address and the Security Group have a short form`.
- `ladder.test.ts`, `a term is introduced by one incident at most`: sigue verde (nadie presenta aún los nuevos).
- Cambia a propósito, si existe: la prueba que fija el tamaño del registro.

**Review Focus:** 3 y 26.

**Cierre:** `pnpm check` verde. **Commit:** `feat(copy): register the terms of chapter 3`.

---

### Tarea 4: Los cambios explicados miran todo el dispositivo y todo el servidor

**Propósito:** que `explained-changes.test.ts` cubra por sí solo cada campo que este capítulo agrega a un dispositivo o a un servidor (procesos, servicio web, claves, raíces), sin tener que editar la función cada vez. Cada tarea de motor que agrega un campo suma una prueba de que `changedNames` lo ve.

**Archivos:**
- Modify: `src/levels/contract/changes.ts`, `changes.test.ts`, `src/levels/explained-changes.test.ts`, `.claude/rules/explained-behavior-changes.md` (una línea: procesos, sitios, certificados y redirecciones), `src/levels/CLAUDE.md`.

**Interfaces:** `changedNames` compara el dispositivo y el servidor enteros (todos sus campos, también los que se agreguen después) y sigue sin contar el cableado de una pieza que la misma acción agrega.

**Tests:**
- `changes.test.ts`, `changedNames lists a device when any field of it differs`.
- `changedNames lists a server of the internet when any field of it differs`.
- `a field that is added to a device after this function was written is still listed when it differs`.
- `a router interface that faces a piece added by the same action is not a configuration change` (el de hoy, sin editar).
- `explained-changes.test.ts`, `every change to the world of an incident is explained by naming the device, server or program it changes` (el de hoy, sin cambiar su nombre).
- Cierre: golden sin cambios; los incidentes de los capítulos 1, 2 y 4 pasan sin editarse.

**Review Focus:** 7.

**Commit:** `feat(levels): explain a change to any field of a device or a server`.

---

### Tarea 5: Procesos y el servicio web de un puerto

**Propósito:** el 03, el 09 y la guardia necesitan un proceso que corre o no, y los 17 necesitan un servicio que contesta HTTP. Esta tarea es solo el modelo: todavía nadie habla HTTP.

**Archivos:**
- Create: `src/engine/web/schema.ts` y `schema.test.ts` (`WebService`, `Site`, `SiteBehavior`, `PathRule`, `Handler`, `User`, `RateLimit`, `Origin`), `src/engine/web/CLAUDE.md`.
- Modify: `src/engine/network/schema.ts` (`Process`, `Device.host.processes`, `ServerActor.processes`, `Service.processId`, `Service.web`), `types.ts`, `actions.ts` (`setProcess`, `setWebService`), `services.ts` (`lookupService` honra el proceso), `src/engine/index.ts`, `src/engine/CLAUDE.md`, `src/engine/network/CLAUDE.md`, `src/engine/exposure/exposure.test.ts`.

**Interfaces:** ver «Modelo de la red». Un servicio cuyo proceso no corre no escucha: el paquete recibe un RST, como un puerto cerrado.

**Tests:**
- `services.test.ts`, `a service of a stopped process does not listen`.
- `a service of a running process listens as before`.
- `a service with no process listens as before`.
- `actions.test.ts`, `setProcess changes whether a process runs and keeps the rest`.
- `setProcess on a process that does not exist returns the same network`.
- `setWebService replaces the web service of one port and keeps the rest`.
- `schema.test.ts` (de `web`), `rejects a service whose process is not a process of its device`.
- `rejects a web service whose default site does not exist`.
- `rejects two sites that answer to the same name`.
- `rejects a name that is not under .example`.
- `network schema.test.ts`, `a VPC rejects processes and web services`.
- `simulate`, `a tcp port whose process stopped answers with a reset and a firewall that drops answers with nothing`.
- `exposure.test.ts`, `the probe battery treats a stopped process as a closed port`.
- `changes.test.ts`, `changedNames lists a device whose process stopped`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 7 y 8.

**Commit:** `feat(engine): model processes and the web service of a port`.

---

### Tarea 6: El mensaje de aplicación dentro de una conexión TCP (D-25 = A)

**Propósito:** que un paquete lleve una petición HTTP dentro de la conexión que el saludo de tres pasos abrió, sin que el mensaje sea un paquete. Es el cimiento de las Tareas 7 a 18. **Depende de:** D-25.

**Archivos:**
- Create: `src/engine/web/url.ts` y `url.test.ts`, `src/engine/web/messages.ts` y `messages.test.ts`, `src/engine/simulation/stages/web/app.ts` y `CLAUDE.md`.
- Modify: `src/engine/network/schema.ts` (`PacketSpec.message`), `types.ts`, `src/engine/simulation/trace.ts` (`Trace.app`), `simulate.ts` (la etapa `app` corre después de `host` solo si el paquete trae `message`), `context.ts`, `src/engine/index.ts`, guías.

**Interfaces:** `AppMessage` con `{ kind: 'http', method, url, headers, body?, client }` o `{ kind: 'tls-probe', serverName? }`. `parseUrl` separa esquema, nombre o IP, puerto (80 para `http` y 443 para `https` si falta), path y query string, y descarta el fragmento. La petición lleva la cabecera `Host` con el nombre de la URL (y el puerto si no es el por defecto). `Trace.app` lleva la petición y la respuesta como viajan y está ausente sin mensaje. Ninguna etapa nueva escribe un paso en un paquete sin mensaje.

**Tests:**
- `url.test.ts`, `a url without a port gets 80 for http and 443 for https`.
- `a url keeps its path and its query string apart`.
- `the fragment is dropped before the request is built`.
- `a url whose host is an ip keeps the ip as host`.
- `messages.test.ts`, `the request line has the method, the path with its query string and the version`.
- `the request carries a Host header with the name of the url, and the port when it is not the default`.
- `the response line has the version, the code and its phrase`.
- `the response carries the length of its body`.
- `simulate`, `a packet with a message travels in a tcp connection that the greeting opened`.
- `the web stage writes no step for a packet with no message`.
- `the reply of an http exchange is never stopped by a firewall, outbound or inbound`.
- `a message to a closed port ends refused and has no response`.
- `a message through a firewall that drops ends in timeout and has no response`.
- `a status code exists only when a response exists`.
- `the new trace fields are absent from every trace of a VPC`.
- `the trace of an icmp, tcp or udp packet with no message is the same as before`.
- Cierre: golden sin cambios; las pruebas de los capítulos 1, 2 y 4 sin editar.

**Review Focus:** 1, 2, 5, 6 y 8.

**Commit:** `feat(engine): carry an application message inside a tcp connection`.

---

### Tarea 7: La app de un origen: caminos, métodos, códigos, cuerpos y estado

**Propósito:** el 01, el 02, el 05 y el 16 necesitan una app que conteste según el path y el método, valide el id, cree, cambie y borre pedidos, y devuelva JSON. Los pedidos son estado que viaja en `Carried`.

**Archivos:**
- Create: `src/engine/web/origin/app.ts`, `app.test.ts` y `CLAUDE.md`.
- Modify: `src/engine/simulation/stages/web/app.ts`, `sequence.ts` y `simulate.ts` (`Carried.apps`), `src/engine/web/schema.ts` (los manejadores), `trace.ts`, guías.

**Interfaces:** un camino coincide exacto o por prefijo. Los manejadores son los de «Contratos nuevos». Un método que un camino no admite recibe 404, como una app de Node con Express (decidida: la app elige 404 y no 405; 405 no es de los once códigos). Los pedidos arrancan en 7 y 8; un POST crea el siguiente; el PUT deja el pedido como dice el cuerpo; el DELETE lo quita y el segundo da 404 con el mismo estado. Los cuerpos son texto llano; un `json-resource` devuelve JSON válido con un enlace a las líneas del pedido; un POST a una ruta JSON con un cuerpo que no es JSON válido da 400.

**Tests:**
- `app.test.ts`, `a get of an order that exists answers 200 with its body`.
- `an id that is not a number answers 400`.
- `an order that does not exist answers 404`.
- `a path that is not served answers 404`.
- `a method that a path does not accept answers 404`.
- `a post creates the next order and a second post creates another`.
- `a put leaves the order as its body says and a second put leaves it the same`.
- `a delete removes the order and a second delete answers 404 with the same state`.
- `a handler that fails answers 500`.
- `a json resource answers a body that is valid json and a link to its lines`.
- `a post with a body that is not valid json answers 400`.
- `the response of the app carries only the headers the chapter teaches`.
- `the orders are carried from one send to the next`.
- `the orders go back to their start when the world changes`.
- `gives the same traces for the same sends` (el de hoy, sobre el estado nuevo).
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 17 y 20.

**Commit:** `feat(engine): serve paths, methods, codes and bodies from an app and keep its orders`.

---

### Tarea 8: Hosts virtuales y el sitio por defecto

**Propósito:** el 04 y el 14 necesitan elegir el sitio por la cabecera `Host` y servir uno por defecto.

**Archivos:**
- Create: `src/engine/web/sites.ts` y `sites.test.ts`.
- Modify: `src/engine/network/actions.ts` (`addSite`, `removeSite`, con `siteProblem`), `stages/web/app.ts`, `src/engine/index.ts`, guías.

**Interfaces:** el servicio elige el sitio cuyo nombre coincide con el `Host` de la petición; sin coincidencia sirve `defaultSiteId`. `addSite` devuelve la misma red si el nombre ya tiene sitio; `siteProblem` dice por qué.

**Tests:**
- `the site is chosen by the host header and not by the ip`.
- `a name with no site gets the default site`.
- `a name that went through a cname travels in host as the url wrote it`.
- `two names can lead to one site`.
- `a request with no Host header answers 400`.
- `addSite adds a site and keeps the others`.
- `addSite with a name that already has a site returns the same network and siteProblem says why`.
- `removeSite removes a site and its names go to the default site`.
- `the default site cannot be removed`.
- `changedNames lists a server whose sites changed`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 7 y 18.

**Commit:** `feat(engine): choose a site by the host header and serve a default site`.

---

### Tarea 9: Usuarios, sesiones y cookies

**Propósito:** el 06 y el caso 4 de la guardia separan el 401 del 403 y llevan quién eres en una cookie.

**Archivos:**
- Create: `src/engine/web/origin/users.ts` y `users.test.ts`.
- Modify: `src/engine/web/origin/app.ts`, `sequence.ts` y `simulate.ts` (`Carried.sessions`), `trace.ts`, guías.

**Interfaces:** `needs-role` envuelve un manejador: sin credencial, 401 con `WWW-Authenticate: Basic realm="admin"`; con credencial de un usuario sin el rol, 403. `-u usuario:clave` manda `Authorization: Basic` con la base64 de «usuario:clave» (decidida 29). `login` valida y responde `Set-Cookie: sesion=s<n>`; una petición con esa cookie es el usuario de la sesión. Una cookie de una sesión que no existe es una petición sin credencial.

**Tests:**
- `a request with no credential to a protected path answers 401 with WWW-Authenticate`.
- `a request with the credential of a user without the role answers 403`.
- `a request with the credential of a user with the role answers 200`.
- `a wrong password answers 401`.
- `repeating a request with the same credential gives the same 403`.
- `a login with a good password answers 200 and sets a cookie with the session`.
- `a request with that cookie is the user of the session`.
- `the value of the cookie follows the order of the sessions`.
- `a cookie of a session that does not exist is a request with no credential`.
- `the basic credential is the base64 of user and password`.
- `the sessions are carried and go away when the world changes`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 16 y 20.

**Commit:** `feat(engine): authenticate users, authorize paths and keep sessions with a cookie`.

---

### Tarea 10: El proxy inverso y su segunda conexión

**Propósito:** el 07 a 09, el 15 y la guardia necesitan un proxy. Reenvía por otra conexión y toma la lista de orígenes. Pasa tal cual lo que el origen contesta. Genera su propio 502, 503 y 504. Y la traza dice quién generó cada código.

**Archivos:**
- Create: `src/engine/web/proxy/proxy.ts`, `proxy.test.ts` y `CLAUDE.md`, `src/engine/simulation/stages/web/proxy.ts`.
- Modify: `src/engine/network/actions.ts` (`addOrigin`, `removeOrigin`, con `originProblem`), `trace.ts` (`generatedBy`, `upstream`), `src/engine/web/schema.ts`, `src/engine/index.ts`, guías.

**Interfaces:** el proxy elige la ruta por el prefijo más largo y toma el primer origen de su lista. La segunda conexión es un paquete real del dispositivo del proxy al origen, con la misma petición más `X-Forwarded-For` (la IP del cliente) y `X-Forwarded-Proto`, y pasa por toda la tubería (decidida 4). Si el origen contesta, el proxy pasa su respuesta tal cual (`generatedBy` = el origen). Si la conexión es rechazada con un RST, o un router avisa que no hay a quién entregar, el proxy genera un 502. Si el origen no contesta a tiempo, un 504. Con la lista vacía, un 503. Los cuerpos que genera el proxy son la frase del código en inglés (por ejemplo `Bad Gateway`).

**Tests:**
- `the proxy forwards the request to the first origin of its list by a second connection`.
- `the second connection is a packet that crosses the same stages as any other`.
- `a response of the origin goes through the proxy with the same code and body`.
- `a 500 of the origin goes through the proxy untouched and says the origin generated it`.
- `a refused connection to the origin makes the proxy answer 502`.
- `an origin whose ip nobody owns makes the proxy answer 502`.
- `an empty list of origins makes the proxy answer 503`.
- `an origin that answers later than the read timeout of the proxy makes the proxy answer 504`.
- `a code that the proxy generates says the proxy generated it`.
- `the origin sees the ip of the proxy as the source of the second connection`.
- `the client sees only the proxy`.
- `the trace of the second connection is kept in app.upstream`.
- `addOrigin and removeOrigin change the list and keep the rest`.
- `addOrigin with an origin already in the list returns the same network and originProblem says why`.
- `changedNames lists a server whose origins changed`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 9 y 20.

**Commit:** `feat(engine): add the reverse proxy with its second connection and the codes it generates`.

---

### Tarea 11: El límite por IP, la ráfaga y `X-Forwarded-For` (D-26)

**Propósito:** el 07 muestra que un origen detrás de un proxy cuenta mal a los clientes hasta que lee `X-Forwarded-For`. **Depende de:** D-26.

**Archivos:**
- Create: `src/engine/web/origin/rate-limit.ts` y `rate-limit.test.ts`.
- Modify: `src/engine/web/origin/app.ts`, `sequence.ts` y `simulate.ts` (`Carried.hits`), `src/engine/network/actions.ts` (`setClientIpFrom`), guías.

**Interfaces:** la app cuenta las peticiones por IP y por segundo del juego; la siguiente al límite (10) recibe 429 con `Retry-After: 1`. `clientIpFrom` es `peer` (la IP de la conexión) o `forwarded-for` (la última entrada de la cabecera, D-26 = A). El proxy agrega la IP del cliente al final de la cabecera. El proxy pasa el 429 tal cual.

**Tests:**
- `the origin counts the requests of one ip in one second of the game`.
- `the request after the limit answers 429 with Retry-After`.
- `a request in the next second is counted from zero`.
- `behind a proxy the origin counts every request with the ip of the proxy`.
- `with clientIpFrom forwarded-for the origin counts by the last entry of X-Forwarded-For`.
- `the proxy adds the client ip to X-Forwarded-For`.
- `a client that writes its own X-Forwarded-For does not change the entry the proxy added`.
- `the proxy passes a 429 of the origin through untouched`.
- `a burst of 20 requests in one second gets 429 after the tenth`.
- `the counters are carried from one send to the next and go away when the world changes`.
- `setClientIpFrom changes where the app reads the ip from and keeps the rest`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 9, 19 y 20.

**Commit:** `feat(engine): limit the requests of an ip and read the ip of the client from X-Forwarded-For`.

---

### Tarea 12: Tiempos y conexiones persistentes (D-19)

**Propósito:** el 08 y el 09 necesitan un origen lento, una espera del proxy y conexiones persistentes con un idle timeout en cada extremo, medidas contra el reloj del juego. **Depende de:** D-19. La regla del cruce es una sola función; con D-19 = A cambia solo esa función.

**Archivos:**
- Create: `src/engine/web/proxy/pool.ts` y `pool.test.ts`.
- Modify: `src/engine/web/proxy/proxy.ts`, `sequence.ts` y `simulate.ts` (`Carried.pool`), `src/engine/network/actions.ts` (`setIdleTimeout`), `trace.ts` (`app.connection`: nueva, reutilizada o cruzada), guías.

**Interfaces:** el proxy guarda la conexión al origen después de cada respuesta y la reutiliza mientras no pasen 60 s sin uso. El origen cierra la suya a los `idleTimeoutSeconds` (5 s en `servidor-app`). **Con D-19 = B:** una petición que sale en el segundo en que el origen cierra se cruza con el cierre y da 502 (el proxy no reintenta); antes reutiliza la conexión; después abre otra. Si el origen cierra después que el proxy (idle timeout del origen mayor que 60 s), el proxy cierra primero y no hay cruce. Un proceso que se detiene cierra sus conexiones.

**Tests (con D-19 = B):**
- `an origin slower than the read timeout of the proxy answers 504 and one faster answers 200`.
- `the first request opens a connection to the origin and the proxy keeps it`.
- `a request before the idle timeout of the origin reuses the connection`.
- `a request in the second the origin closes the idle connection ends in 502`.
- `a request after the origin closed opens a new connection and is answered`.
- `a request after the idle timeout of the proxy opens a new connection`.
- `raising the idle timeout of the origin above the one of the proxy removes the crossing`.
- `the proxy does not retry a request that crossed`.
- `the trace says whether the connection was reused, new or crossed`.
- `the pool is carried and measured against the clock of the game`.
- `a process that stopped closes the connections it had`.
- `the rule of the crossing is one function`.
- `setIdleTimeout changes the idle timeout of one app and keeps the rest`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 10 y 20.

**Commit:** `feat(engine): keep persistent connections between the proxy and the origin and cross them with the close of the origin`.

---

### Tarea 13: Certificados, claves, autoridades, raíces y la fecha (D-21 y D-22)

**Propósito:** el 11 a 14 y la guardia necesitan certificados como datos con una firma que vale o no, claves privadas que no viajan, autoridades, raíces de confianza por dispositivo y una fecha del mundo. **Depende de:** D-21 y D-22.

**Archivos:**
- Create: `src/engine/tls/certificates.ts`, `certificates.test.ts`, `trust.ts`, `trust.test.ts` y `CLAUDE.md`.
- Modify: `src/engine/network/schema.ts` (`Certificate`, `Authority`, `privateKeys`, `trustedRoots`, `Network.today`), `types.ts`, `actions.ts` (`issueCertificate`), `src/engine/index.ts`, guías.

**Interfaces:** ver «Modelo de la red». `digestOf(certificate)` es una etiqueta de sus datos; la firma vale si `signedDigest` coincide. `issueCertificate` crea un certificado con serie nueva, firmado por la autoridad del juego, con `notBefore` = `today` y `notAfter` = 90 días después, y lo instala en el sitio que lo pidió; el viejo queda (D-21 = B).

**Tests:**
- `a certificate lists its names, its public key, its issuer and its dates`.
- `the hash of a certificate changes when any of its data changes`.
- `a signature holds when the digest it signed equals the digest of the data`.
- `a certificate with an edited name loses its signature`.
- `a self-signed certificate is signed with its own key`.
- `a private key belongs to one device or server and never travels`.
- `a copy of a certificate carries no private key`.
- `issueCertificate gives a new certificate signed by the authority of the game and keeps the old one`.
- `issueCertificate installs the new certificate in the site that asked for it`.
- `a new certificate lasts 90 days from today`.
- `the dates of a certificate are dates of the game and today is a datum of the world`.
- `a chain lists the certificates the server sends, without the root`.
- `an authority is not a piece of the map`.
- `rejects a certificate whose name is not under .example`.
- `a VPC rejects certificates, keys, roots and today`.
- `changedNames lists a server whose certificate changed and a device whose roots changed`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 7, 12 y 13.

**Commit:** `feat(engine): model certificates, keys, authorities, trusted roots and the date of the game`.

---

### Tarea 14: La validación de un certificado y los desenlaces de TLS

**Propósito:** el 11 a 14 y la guardia terminan en un fallo de TLS antes de cualquier código HTTP. Esta tarea agrega el desenlace y la validación; el saludo que los usa es la Tarea 15.

**Archivos:**
- Create: `src/engine/tls/validation.ts` y `validation.test.ts`.
- Modify: `src/engine/simulation/trace.ts` (`Outcome` gana `tls-failed`; motivos de validación; `Trace.tls.verification`), y todo consumidor exhaustivo de `Outcome`: `src/copy/packet-labels.ts` (`OUTCOME_TEXT` y `UNKNOWN_OUTCOME`), `src/engine/simulation/paths/traceroute.ts` (`ANSWER_OF`), `src/game/tasks.ts` (`outcomeHolds`), `src/scene/traffic/flow-look.ts` (`stampState`) y las pruebas que recorren `OUTCOMES` (la tarea las busca con `git grep -n "OUTCOMES"` antes de editar nada), `src/engine/index.ts`, guías.

**Interfaces:** `validate(chain, serverNameOrIp, clientRoots, today)` devuelve la primera falla o éxito. El nombre se compara con el SAN y nunca con un nombre común; el comodín cubre una etiqueta de más a la izquierda; la cadena llega a una raíz del cliente; las fechas incluyen los dos extremos. Si la cadena y el nombre fallan a la vez, sale primero la cadena, como `curl` con OpenSSL (leído en `lib/vtls/openssl.c`, la comprobación del nombre corre después del saludo; sin corrida). Un fallo termina con `tls-failed` y no hay código HTTP.

**Tests:**
- `a name is checked against the SAN and never against a common name`.
- `a wildcard covers one label below and not the name of the zone nor two labels`.
- `a name that is an ip is checked against the ip names of the SAN`.
- `a chain that ends in a root the client trusts passes`.
- `a chain that ends in a root the client does not trust fails`.
- `a self-signed certificate fails when the client does not trust it`.
- `a certificate whose signature does not hold fails`.
- `a certificate out of its dates fails against today and the dates are inclusive`.
- `when the chain and the name both fail the chain failure is reported first`.
- `a failed validation ends the outcome as tls-failed and there is no status code`.
- `every consumer of the outcomes handles tls-failed`.
- `the new outcome is absent from every trace of chapters 1, 2 and 4`.
- Cambia a propósito: las pruebas que recorren `OUTCOMES` suman `tls-failed`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 8 y 13.

**Commit:** `feat(engine): validate a certificate and end a failed greeting as tls-failed`.

---

### Tarea 15: El saludo TLS

**Propósito:** el 10 a 15 y la guardia necesitan el saludo como pasos: lo que el cliente manda en claro, lo que el servidor elige, lo que viaja cifrado, la firma y las claves.

**Archivos:**
- Create: `src/engine/tls/handshake.ts` y `handshake.test.ts`, `src/engine/simulation/stages/web/tls.ts`.
- Modify: `simulate.ts` (la etapa `tls` corre entre `host` y `app` si el esquema es `https` o el mensaje es una sonda), `trace.ts` (`Trace.tls`), `src/engine/index.ts`, guías.

**Interfaces:** el saludo va después del saludo de tres pasos. ClientHello: versiones, protocolos (`h2` y `http/1.1`) y el nombre del servidor, en claro; un nombre que es una IP no viaja. ServerHello: la versión y el protocolo elegido (`http/1.1`). A partir de ahí todo va cifrado: el certificado que corresponde al nombre (o el por defecto), la firma del saludo con la clave privada del certificado, y Finished. Ambos calculan una clave por sentido (RFC 8446 §7.1 y §7.3); ninguna viaja. Todo servidor del juego habla TLS 1.3. Un `https` a un puerto sin TLS termina en un saludo fallido (`wrong version number`) y sin código.

**Tests:**
- `the greeting comes after the three steps of tcp and before the first byte of http`.
- `the client hello carries the versions, the protocols and the server name in the clear`.
- `a name that is an ip is not sent as server name`.
- `the server answers with the certificate that matches the server name`.
- `a greeting with no server name gets the default certificate`.
- `the certificate and the signature travel encrypted after the server hello`.
- `the server signs the greeting with its private key and the client checks it with the public key of the certificate`.
- `a server that holds no private key for the certificate it presents fails the signature check`.
- `both ends compute a key for each direction and none travels`.
- `the server picks http/1.1 from the protocols the client offers`.
- `tls to a port that speaks plain http ends in a failed greeting with no status code`.
- `the trace has no tls when the scheme is http`.
- `a probe of openssl s_client opens the greeting and sends no http`.
- `a probe of openssl s_client does not stop at a verification failure and reports it`.
- `every server of the game speaks TLS 1.3`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 8, 11, 12 y 14.

**Commit:** `feat(engine): run the tls greeting with the server name, the signature and a key per direction`.

---

### Tarea 16: La terminación de TLS, la redirección y HSTS

**Propósito:** el 15 y el caso 5 de la guardia necesitan que el proxy termine TLS, redirija y mande HSTS, y que una app detrás del proxy que redirige siempre entre en un bucle.

**Archivos:**
- Create: `src/engine/simulation/stages/web/redirect.ts`.
- Modify: `src/engine/web/schema.ts` (`redirectToHttps`, `hsts`), `src/engine/network/actions.ts` (`setRedirectToHttps`, `setHsts`), `stages/web/proxy.ts`, `src/engine/index.ts`, guías.

**Interfaces:** el proxy termina el TLS del cliente y manda la petición al origen por HTTP con `X-Forwarded-Proto: https`. Un servicio con `redirectToHttps` contesta 301 con `Location` al mismo nombre y path por `https` a toda petición por `http`. Una app que redirige siempre, detrás de la terminación, ve todo por HTTP y entra en bucle. El servidor manda `Strict-Transport-Security` solo por HTTPS.

**Tests:**
- `the proxy ends tls and sends the request to the origin without it`.
- `the proxy adds X-Forwarded-Proto with the scheme the client used`.
- `an app that redirects to https every request it receives loops behind the termination of tls`.
- `an app that redirects only when X-Forwarded-Proto says http does not loop`.
- `a proxy that redirects http to https answers 301 with the location of the same host and path`.
- `a request over https is not redirected`.
- `the redirect needs the port 80 open and listening`.
- `hsts is sent only over tls`.
- `a redirect answers before the request reaches the origin`.
- `setRedirectToHttps and setHsts change one service and keep the rest`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 15 y 20.

**Commit:** `feat(engine): end tls at the proxy, redirect to https and send hsts`.

---

### Tarea 17: El navegador y el seguimiento de redirecciones (D-23 y D-24)

**Propósito:** el 03, el 04, el 06 y el 15 necesitan un cliente con memoria que siga redirecciones, y `curl -L` también las sigue. **Depende de:** D-23 y D-24.

**Archivos:**
- Create: `src/engine/client/browser.ts`, `browser.test.ts`, `follow.ts`, `follow.test.ts` y `CLAUDE.md`.
- Modify: `sequence.ts` y `simulate.ts` (`Carried.browser`), `trace.ts` (`Trace.app.followed`, `Trace.app.client`), `src/engine/index.ts`, guías.

**Interfaces:** `curl -L` sigue hasta 50 redirecciones y el navegador hasta 20 (número del juego, decidida 30). Una 301 o una 302 vuelve GET a un POST; una 307 o una 308 lo conserva (RFC 9110 §15.4; `lib/http.c` de curl 8.21.0). El navegador guarda las cookies que recibe y las devuelve al mismo nombre; recuerda HSTS (solo si llegó por TLS y no para una IP) y las 301; `curl` no recuerda nada y no manda cookies sin `-b`. Un fallo de TLS termina el resultado del cliente en `tls-failed`. Las peticiones siguientes van en `Trace.app.followed`.

**Tests:**
- `curl with -L follows a redirect and records each request in followed`.
- `curl follows at most 50 redirects and then stops`.
- `a 301 turns a post into a get and a 307 keeps it`.
- `the browser follows at most 20 redirects and then stops`.
- `the browser keeps the cookie of a Set-Cookie and sends it to the same host`.
- `curl sends a cookie only when it is given -b`.
- `the browser remembers hsts from a response over tls and goes straight to https the next time`.
- `hsts is ignored when it arrives over plain http`.
- `hsts does not apply to an ip`.
- `the browser remembers a 301 and does not ask again`.
- `curl remembers nothing between two sends`.
- `the browser memory goes away when the world changes`.
- `a failed greeting ends the result of the client as tls-failed`.
- `the sends of chapters 1 and 2 give the same traces with the state this chapter adds to Carried`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2, 15 y 20.

**Commit:** `feat(engine): follow redirects and give the browser its memory`.

---

### Tarea 18: La captura de lo que ve un router del camino

**Propósito:** el 10 y el 15 muestran qué lee quien mira el camino.

**Archivos:**
- Create: `src/engine/observe/capture.ts`, `capture.test.ts` y `CLAUDE.md`.
- Modify: `trace.ts` (`Trace.capture`), `simulate.ts`, `src/engine/index.ts`, guías.

**Interfaces:** `captureAt(trace, observerId)` devuelve una línea por paquete que el router reenvía: IP, puertos, protocolo y, según la capa, el nombre del sitio de un saludo TLS (en claro), el mensaje HTTP entero si va en claro, o «datos cifrados» si va dentro de TLS. No muestra el certificado (cifrado en TLS 1.3) ni tamaños ni momentos (decidida 24). Solo un router que está en el camino captura algo.

**Tests:**
- `the capture of a path shows the addresses, the ports and the name of the site of a tls greeting and never its certificate`.
- `the capture of a path shows an http message in the clear and hides it inside tls`.
- `a dns query is shown in the clear in the capture`.
- `a router that is not on the path captures nothing`.
- `the capture lists one line per packet in order`.
- `the capture is absent unless the incident asks for an observer`.
- Cierre: golden sin cambios.

**Review Focus:** 1, 2 y 11.

**Commit:** `feat(engine): capture what a router of the path can read`.

---

### Tarea 19: El contrato del incidente: `curl`, `openssl s_client`, tablas y expectativas nuevas (D-20)

**Propósito:** que un incidente `send` haga estas cosas. Mande un `curl` o un `openssl s_client`. Arme una URL en fichas y mande una ráfaga. Edite sitios, orígenes, hosts y pedidos de certificados. Cambie ajustes de una app o de un servidor. Ponga una regla de firewall junto a un envío. Pida lo que la web responde. **Depende de:** D-20.

**Archivos:**
- Modify: `src/levels/contract/incident.ts`, `incident.test.ts`, `chips.ts`, `tables.ts`, `src/levels/registry.test.ts`, `src/levels/CLAUDE.md`, `src/levels/contract/CLAUDE.md`.

**Interfaces:** ver «Contrato del incidente». `packetFromChips` arma el paquete TCP de un `curl` con el mensaje de su URL (por partes o completa, sin mezclar las dos) y el de un `openssl s_client` como sonda TLS. `send.rules` pone la tarjeta de un firewall de equipo en un incidente `send` (el 03) con las fichas de `filter`. `send.tables` gana `sites`, `origins`, `hosts` (solo quitar) y `certificate-request`. `send.settings` gana los tipos `redirect-to-https`, `hsts`, `idle-timeout`, `client-ip-from` y `process-running` (el jugador arranca un proceso detenido; el mundo es quien lo detiene). `SendTask.expect` gana `status`, `generatedBy`, `tlsFailure`, `body`, `secure`, `hidden` y `verification`. `officeLeaks` cuenta también un `curl` y un `openssl s_client` a una IP fuera de una oficina sin routers.

**Tests:**
- `incident.test.ts`, `accepts a curl message with a url, a method, a body, headers and options`.
- `accepts an openssl s_client message with a port and no http`.
- `rejects a curl message with no url`.
- `rejects a body on a message whose method is get or delete`.
- `rejects a repeat below 2 or above 50`.
- `rejects an option that is not one of the offered ones`.
- `rejects a command that is not a packet, a ping, a traceroute, an nc, a dig, a curl or an openssl s_client` (reemplaza a `rejects a command that is not a packet, a ping or a traceroute`, que usaba `curl` como ejemplo inválido y ahora usa `wget`).
- `a url chip is built from its parts or given whole, and the whole url is what is sent`.
- `rejects a url chip that mixes parts and a whole url`.
- `accepts a table of sites, one of origins, one of hosts and one of certificate requests`.
- `rejects a table whose owner is not a server with a web service`.
- `accepts settings of kind redirect-to-https, hsts, idle-timeout, client-ip-from and process-running and rejects a chip value that does not fit its kind`.
- `accepts a rules card in a send incident and the placeRule move`.
- `accepts an expected status, generator, tls failure, body, secure flag, verification and hidden field`.
- `rejects an expected status on an openssl s_client message`.
- `builds the tcp packet of a curl with the message of its url`.
- `builds the probe of an openssl s_client with the server name of its chip`.
- `a curl or an openssl s_client to an address outside an office with no router is a leak`.
- `accepts the card a piece opens first among the new cards and rejects a card the piece does not have`.
- `registry.test.ts`, `every message of a curl goes to a service that has a web service in the start world of its incident`.
- `no incident sends plain http to a port that speaks tls`.
- `every table owner and every setting device names something in the start world of its incident` (el de hoy, sobre las tablas nuevas).
- Cierre: golden sin cambios.

**Review Focus:** 2, 3 y 24.

**Commit:** `feat(levels): send curl and openssl s_client and edit sites, origins, hosts and certificate requests from the contract`.

---

### Tarea 20: La sesión: la ráfaga, los movimientos nuevos y lo que piden las tareas

**Propósito:** que la sesión expanda una ráfaga, aplique los movimientos nuevos con las reglas del plan y lea el código, quién lo generó y el fallo de TLS de los envíos.

**Archivos:**
- Modify: `src/game/session.ts`, `session.test.ts`, `flow-runs.ts`, `flow-runs.test.ts`, `tasks.ts`, `tasks.test.ts`, `src/levels/world.ts`, `world.test.ts` (`applyMove` para los movimientos nuevos), `src/game/index.ts`, `src/game/CLAUDE.md`.

**Interfaces:** `repeat` se expande en N envíos en el mismo segundo del reloj. `placeEntry` y `removeEntry` valen también para `sites`, `origins` y `hosts`; cuando el motor devuelve la misma red porque la regla lo impide, la sesión guarda el problema (`siteProblem` u `originProblem`) para que la tarjeta lo muestre. `requestCertificate` aplica `issueCertificate`. `setSetting` aplica los cinco tipos nuevos. Un movimiento que cambia el mundo limpia los envíos, y con ellos el estado derivado, y no toca el reloj. Una tarea con `status`, `generatedBy`, `tlsFailure`, `body`, `secure`, `hidden` o `verification` mira la traza del último envío de sus fichas (o la última de la cadena de redirecciones).

**Tests:**
- `session.test.ts`, `a repeat of 20 becomes 20 sends in the same second`.
- `the sends are simulated in sequence so the orders, the sessions, the counters, the connections and the browser memory carry over`.
- `a move that changes the world clears the sends, the sessions, the counters, the connections and the browser memory and keeps the clock`.
- `placeEntry of a site changes the table and clears the sends`.
- `placeEntry of a site the engine refuses leaves the world as it was and keeps the problem`.
- `removeEntry of an origin removes the row it names`.
- `requestCertificate issues a certificate, installs it and keeps the old one`.
- `setSetting sets the redirect, hsts, idle timeout, client ip source and process of an app or a server`.
- `tasks.test.ts`, `a send task holds when the last curl answers with the expected status`.
- `holds only when the code was generated by the expected device`.
- `holds when the greeting failed for the expected reason`.
- `holds when the body is the expected one`.
- `holds when the exchange went over tls`.
- `holds when the capture of the observer hides the expected field`.
- `holds when s_client reports the expected verification`.
- `a task about a redirect looks at the last request of the chain`.
- `world.test.ts`, `applyMove returns the same world when a site is already in the table`.
- Cierre: golden sin cambios; las pruebas de la sesión de los capítulos 1 y 2 sin editar.

**Review Focus:** 2, 7 y 20.

**Commit:** `feat(game): expand a burst, apply the web moves and read status, generator and failure from the sends`.

---

### Tarea 21: Los textos y la caja de inspección

**Propósito:** que la vista diga lo que la traza ya trae (la URL, la petición y la respuesta, quién generó el código, el saludo, el certificado y lo que ve el camino) con los términos que el jugador conoce, y nada más.

**Archivos:**
- Create: `src/copy/web/reasons.ts`, `reasons.test.ts`, `labels.ts`, `labels.test.ts` y `CLAUDE.md`.
- Modify: `src/copy/reasons.ts` (los motivos nuevos delegan en `web/`), `packet-labels.ts` y `packet-labels.test.ts` (el texto de `tls-failed`), `src/copy/screens/incident-ui.ts`, `src/game/view/inspection.ts` y `inspection.test.ts`, `src/game/view/pieces.ts`, `src/game/view/CLAUDE.md`, `src/copy/CLAUDE.md`.

**Interfaces:** cada campo de la caja declara el término que usa y se deja fuera mientras no se conozca (ver la nota de «Los diecisiete: fichas»). «Servicios» suma el proceso de cada servicio (solo si lo tiene). Los motivos nuevos se escriben con los términos conocidos; si el término de la causa es desconocido, el texto dice solo lo que el jugador vio. **Etiqueta del paquete:** no cambia; un mensaje HTTP se dibuja con la forma de TCP y su etiqueta de protocolo y puertos (V20 = A). Un fallo de TLS dice que el cliente lo rechazó y no que alguien lo bloqueó.

**Tests:**
- `inspection.test.ts`, `the box shows the url in its parts behind the term url`.
- `the box shows the request and the response behind their terms`.
- `the box says who generated the code once status-code is known`.
- `the box shows the greeting behind the term tls-handshake`.
- `the box shows the certificate behind the term certificate`.
- `the box shows what the path sees behind the term tls`.
- `a service lists the process it listens from`.
- `a device of a VPC shows none of the new fields`.
- `reasons.test.ts`, `describes every new reason of chapter 3 with registered terms only`.
- `a reason whose term is unknown says only what the player saw`.
- `the text of a failed greeting says what the client checked and names no browser`.
- `no text says stateful or gives a reason for a reply to come back` (el de hoy, ampliado a HTTP y TLS).
- `no text calls an http message a packet`.
- `no text says a 4xx is always the fault of the client`.
- `no text says https encrypts everything`.
- `no text says the private key decrypts in tls`.
- `no text calls the lock a sign that a site is trustworthy`.
- `no text says the certificate is secret`.
- `no text says every dead origin gives 503`.
- `no text says rest is json over http`.
- `packet-labels.test.ts`, `the result tls-failed says the client rejected the greeting and that nothing was blocked`.
- Cierre: golden sin cambios; el 01-08 sigue como estaba.

**Review Focus:** 4, 5, 6, 8, 26 y 29.

**Commit:** `feat(copy): write the web, the greeting, the certificate and the capture with the terms the player knows`.

---

### Tarea 22: Las salidas de `curl` y de `openssl s_client`, y la terminal (D-12, D-20 y V28)

**Propósito:** que la terminal escriba el comando de Linux y la tarjeta «Salida» muestre lo que imprime la herramienta, con su fuente. **Depende de:** V28 y D-20.

**Archivos:**
- Create: `src/copy/tools/curl-output.ts`, `curl-output.test.ts`, `openssl-output.ts` y `openssl-output.test.ts`.
- Modify: `src/copy/tools/CLAUDE.md` (la fuente de cada línea con su ruta, su versión y su fecha), `src/game/view/cards/terminal/terminal-card.ts` y `output-card.ts` (y sus tests), `src/ui/incident/map-cards/terminal/terminal-card.tsx` y `output-card.tsx` (y sus tests), `src/copy/screens/incident-ui.ts` (`TERMINAL_TEXT`), guías.

**Interfaces:** la terminal escribe `curl [opciones] <url>` y `openssl s_client -connect <ip>:<puerto> -servername <nombre>`. La salida de `curl` sigue `curl` 8.21.0 y la de `openssl s_client`, OpenSSL 3.5.8: las versiones de Amazon Linux 2023 (D-12 = A).

**Antes de imprimir una línea se lee su origen.** La tarea baja `curl-8.21.0.tar.xz` y `openssl-3.5.8.tar.gz` a un directorio nuevo y vacío. Los lee con `python3 -I` o con `grep`. Nunca ejecuta nada de ahí.

**Ya se leyó el 2026-10-11** y está en el spec («Las herramientas…»):
- el formato `curl: (N) …` y los errores 7, 35, 47 y 60;
- los textos de verificación de OpenSSL;
- los formatos `error:0A00010B:SSL routines::wrong version number` y `error:0A00007B:SSL routines::bad signature`;
- el comportamiento de `-L` con una 301 y el de `-b`;
- las líneas de `s_client`.

**Queda por leer o por probar antes de imprimir:**
- el texto de `curl` ante un silencio y ante un nombre que no resuelve (el código tiene más de un camino y no se sabe cuál sale);
- las líneas de `-v` de la resolución y la conexión (`Host … was resolved.`, `IPv4: …`, `  Trying …`, `Connected to` y `Established connection`);
- las líneas de `TLSv1.3 (OUT)` y `(IN)` y `ALPN: curl offers …`;
- el bloque `Server certificate:` y `SSL certificate verify ok`;
- las cabeceras que `-v` escribe con `> ` y `< `, y el cierre de la conexión.

Lo que no se confirme **no se imprime** y la guía lo dice. Los tiempos y el cifrado negociado no se imprimen o van ilustrativos (spec). El bloque PEM de `s_client` no se imprime. La tarjeta pliega la salida de `curl -v` y la de `openssl s_client` como la de `dig` (V11 = B del capítulo 2): las líneas clave a la vista y el resto detrás de «Ver las N líneas restantes».

**Sin bloquear el cierre.** El estudiante puede correr `curl` y `openssl s_client` en un EC2 con Amazon Linux 2023 y pegar las líneas. La tarea las compara con los tests y anota las diferencias en la guía. Si no las pega, lo que solo está leído en el código fuente queda así en la guía y la tarea cierra igual.

**Tests:**
- `curl-output.test.ts`, `a plain curl prints only the body`.
- `curl -i prints the status line, the headers and a blank line before the body`.
- `a refused connection prints the line of code 7 with host and port and Could not connect to server`.
- `a connection that times out prints no line and the box says curl waited and gave up with code 28`.
- `a failed certificate prints the line of code 60 with the text of OpenSSL and the paragraph of help`.
- `a name that is not in the SAN prints the line of code 60 for a hostname and for an ipv4 address`.
- `a failed signature prints the line of code 35 with OpenSSL/3.5.8 and the code 0A00007B`.
- `tls to a plain port prints the line of code 35 with the code 0A00010B`.
- `too many redirects print the line of code 47 with 50`.
- `the lines of -v use the prefixes * < and >`.
- `the numbers of a time are illustrative and the box says so`.
- `every line curl prints matches the source of curl 8.21.0`.
- `a line that the source cannot confirm is not printed`.
- `openssl-output.test.ts`, `s_client prints the chain with subject, issuer, key and dates per certificate`.
- `s_client prints Verification OK or the verification error and the return code`.
- `s_client prints the lines depth and verify error of the verification`.
- `s_client prints no PEM block and no negotiated cipher`.
- `s_client does not check the name without -verify_hostname`.
- `every line openssl s_client prints matches the source of openssl 3.5.8`.
- `terminal-card.test.ts`, `the line of a curl is built from the chips of the url and the options in Linux syntax`.
- `the line of an openssl s_client names the port and the server name`.
- `a burst chip writes the same line once and says how many times`.
- `output-card.test.ts`, `the output of curl -v and of s_client folds the lines that are not key lines and prints all of them when unfolded`.
- `the output of a plain curl is not folded`.
- `terminal-card.test.tsx`, `the url chips lay out as the prototype V28 chose`.
- Cierre: golden sin cambios; la captura de la interfaz no cambia (la tarjeta «Salida» ya existe).

**Review Focus:** 21 y 26.

**Commit:** `feat: print the output of curl and openssl s_client the way the tools do`.

---

### Tarea 23: Las tarjetas de un servidor: sitios, orígenes, tiempos, redirección y hosts (V27 = D)

**Propósito:** que el jugador agregue un sitio, ponga o quite un origen, vea los tiempos, mueva la redirección y HSTS, y quite una línea del archivo hosts, desde **un solo botón** por pieza con pestañas (V15 = B) y, dentro de cada pestaña, tarjetas que se pliegan (V27 = D). **Depende de:** V27 (cerrada: D).

**Archivos:**
- Create: `src/game/view/cards/web/server-card.ts`, `server-card.test.ts` y `CLAUDE.md`; `src/ui/incident/map-cards/web/server-card.tsx`, `server-card.test.tsx` y `CLAUDE.md`.
- Create: la primitiva de la sección que se pliega, en `src/design/` (la ruta y el nombre los fija la tarea), con su test y su entrada en `DESIGN.md`.
- Modify: `src/game/view/cards/piece-card.ts` (las tarjetas nuevas, su agrupación en pestañas y el resumen de cada una, V27 = D), `src/game/view/pieces.ts`, `settings-card.ts` (los tipos de ajuste nuevos), `DESIGN.md` (la justificación de la primitiva), guías. Solo si elige Radix Accordion: `package.json` y `pnpm-lock.yaml`.

**Interfaces:** una tarjeta de servidor es el view model de sus tablas y ajustes: «Sitios» (Nombre, Qué sirve y cuál es el de por defecto), «Orígenes» (IP:puerto y cuál se usa), «Tiempos» (el idle timeout del origen y el del proxy, y la espera del proxy), «Redirección y HSTS» (dónde está la redirección y si se manda HSTS) y, en un dispositivo, «Hosts» (las líneas del archivo, cada una con su botón de quitar) y «Procesos». Usan `Table`, `ChipTray`, `Button` y `Message`; el rechazo de una entrada se dice como en el capítulo 2: una línea bajo la tabla, con `Message`, en una región `status` que ya existía.

**V27 = D (B más tarjetas que se pliegan):**
- **Las pestañas agrupadas de B se quedan.** En `servidor-nuevo`: «Sitios y certificados», «Proxy» y «Redirección y HSTS». En `tu-laptop`: «Terminal», «Navegador» y «Red y confianza».
- **Cada tarjeta, dentro de su pestaña, es una sección que se pliega.** Cerrada, muestra su título y un resumen de una línea de su estado («2 sitios», «hasta 2026-11-30», «1 línea»). Enter o Espacio la abre y la cierra, como en el patrón acordeón de W3C WAI-ARIA. Cada tarjeta que se suma cuesta una línea de unos 45 px cuando está cerrada.
- **Reglas de rigor.** (1) La sección que empieza abierta es fija: la primera, en un orden fijo por pestaña. Nunca depende del incidente ni de su causa; si dependiera, en la guardia (03-17) y en los diagnósticos la sección abierta le diría al jugador dónde mirar. (2) Una sola tarjeta no muestra barra de pestañas. (3) Cuatro pestañas por pieza, como máximo. El número es nuestro, no de Nielsen Norman Group: esa fuente solo dice «The fewer tabs, the better» (https://www.nngroup.com/articles/tabs-used-right/, leída el 2026-10-11).
- **La implementación la elige esta tarea.** Recomendada: Radix Accordion (`@radix-ui/react-accordion`), de la misma familia que `@radix-ui/react-tabs`, que el proyecto ya usa, en una versión exacta publicada hace al menos dos semanas (la tarea comprueba la fecha en el registro). Alternativa: `details` y `summary` nativos, si cumplen el patrón acordeón. Es una excepción a «ninguna primitiva» y, si es Radix, a «ninguna dependencia»: se justifica en `DESIGN.md` como una primitiva para toda la familia.

**Tests:**
- `server-card.test.ts`, `the sites card lists the name and what each site serves and marks the default one`.
- `the origins card lists the origins in order and marks the one in use`.
- `the times card shows the idle timeouts and the wait of the proxy in seconds`.
- `the redirect card says where the redirect is, in the app or in the proxy, and whether hsts is sent`.
- `the hosts card lists the lines of the file`.
- `a rejected entry carries the problem the engine gave`.
- `a piece with several web cards offers the tabs the incident names`.
- `server-card.test.tsx`, `placing a site needs both trays and then places it`.
- `removing an origin calls the move with that row`.
- `removing a line of the hosts file calls the move with that line`.
- `a rejected entry shows its problem as an error message under the table, in a status region that was already there`.
- `switching tabs keeps what was picked in the other tab`.
- `the tabs and the trays are reached and used with the keyboard`.
- `a section opens and closes with the keyboard`.
- `the section that starts open is the same whatever the incident and its cause`.
- `a piece with a single card draws no tab bar`.
- `a label draws one button however many cards its piece has` (el de hoy, sobre `servidor-nuevo`).
- Cierre: golden sin cambios; las tarjetas de los capítulos 1, 2 y 4 sin cambiar de contenido.

**Review Focus:** 7, 24 y 29.

**Commit:** `feat(ui): open the sites, origins, times, redirect and hosts cards of a server from one button`.

---

### Tarea 24: Las tarjetas de certificados y de raíces de confianza (V23)

**Propósito:** que el jugador lea un certificado y pida uno nuevo, y vea en qué autoridades confía su dispositivo. **Depende de:** V23 y D-21.

**Archivos:**
- Create: `src/game/view/cards/tls/certificate-card.ts`, `certificate-card.test.ts`, `trust-card.ts`, `trust-card.test.ts` y `CLAUDE.md`; `src/ui/incident/map-cards/tls/certificate-card.tsx`, `certificate-card.test.tsx`, `trust-card.tsx`, `trust-card.test.tsx` y `CLAUDE.md`.
- Modify: `src/game/view/cards/piece-card.ts`, `src/game/view/pieces.ts`, guías.

**Interfaces:** la tarjeta de certificados lista los certificados que un servidor presenta. Cada uno trae sus nombres (SAN), su emisor, sus fechas contra el «hoy» del mundo, si su firma vale y quién tiene su clave privada. Todo se dice con una palabra y una marca, no solo con el color. Muestra la cadena que el servidor manda, sin la raíz. Si el incidente la ofrece, trae la bandeja «Pedir un certificado» (D-21 = B) con las listas de nombres y un botón; el certificado viejo se queda en la lista. La tarjeta de raíces lista las autoridades de confianza de un dispositivo y dice que `curl` y el navegador la comparten. Ninguna tarjeta dibuja un candado ni dice que un sitio sea de fiar.

**Tests:**
- `certificate-card.test.ts`, `the card lists the names, the issuer, the dates, whether the signature holds and who holds the private key`.
- `the signature is said with a word and a mark and not only with colour`.
- `a copied certificate says its private key belongs to someone else`.
- `the chain the server sends is listed without the root`.
- `a certificate out of its dates says so against today`.
- `the request tray offers lists of names and keeps the old certificate in the list`.
- `trust-card.test.ts`, `the card lists the authorities a device trusts`.
- `the card says that curl and the browser of the device share the list`.
- `certificate-card.test.tsx`, `the card has no padlock and no word that says the site is trustworthy`.
- `requesting a certificate calls the move with the picked names`.
- `the cards are reached and used with the keyboard`.
- Cierre: golden sin cambios.

**Review Focus:** 12, 13 y 26.

**Commit:** `feat(ui): show the certificates a server presents and the roots a device trusts`.

---

### Tarea 25: El navegador de `tu-laptop` (V22, D-23 y D-24)

**Propósito:** que el jugador use un navegador que muestre la página o el error con palabras llanas, inicie sesión y recuerde. **Depende de:** V22, D-23 y D-24.

**Archivos:**
- Create: `src/game/view/cards/web/browser-card.ts`, `browser-card.test.ts`; `src/ui/incident/map-cards/web/browser-card.tsx`, `browser-card.test.tsx`.
- Modify: `src/game/view/cards/piece-card.ts` (la pestaña «Navegador» de `tu-laptop`), guías.

**Interfaces:** la pestaña «Navegador» muestra la dirección, la página o el error como texto de la tarjeta (nunca con `Message`: es lo que dice la red, no un aviso del juego) y una tabla «Lo que recuerda» (cookies, HSTS y 301). El navegador del juego no imita a ninguno (D-23 = A) y no es una pieza del mapa (D-24 = A). Sus errores: «No se pudo conectar», «La conexión se rechazó», «El certificado no sirve para este nombre», «El saludo no se completó» y «Demasiadas redirecciones».

**Tests:**
- `browser-card.test.ts`, `the tab shows the address, the page or the error in plain words and the code`.
- `the browser says the connection was refused, got no answer, was rejected in the greeting or went through too many redirects, each in plain words`.
- `the memory table lists cookies, hsts and remembered 301s`.
- `the browser names no real browser and no real error code`.
- `browser-card.test.tsx`, `a browser error is drawn outside Message`.
- `signing in from the browser sends a post to the login and keeps the cookie`.
- `the browser is a tab of the card of tu-laptop and not a piece of the map`.
- `switching tabs keeps the address picked`.
- `the tab is reached and used with the keyboard`.
- Cierre: golden sin cambios.

**Review Focus:** 15, 26 y 29.

**Commit:** `feat(ui): add the browser tab with the page, the error and what it remembers`.

---

### Tarea 26: La caja: el mensaje HTTP, quién lo generó, el saludo y lo que ve el camino (V20, V21, V24 y V25)

**Propósito:** que la caja de inspección y la tarjeta de captura muestren lo que la traza trae. **Depende de:** V20, V21, V24 y V25.

**Archivos:**
- Create: `src/game/view/cards/tls/capture-card.ts`, `capture-card.test.ts`; `src/ui/incident/map-cards/tls/capture-card.tsx`, `capture-card.test.tsx`.
- Modify: `src/ui/incident/inspection-box.tsx`, `src/game/view/inspection.ts` y su test, `src/copy/screens/incident-ui.ts`, guías.

**Interfaces:** la caja gana, detrás de sus términos, las secciones «Petición HTTP» y «Respuesta HTTP» (V20 = A), el campo «Quién lo generó» (V21 = A), la lista numerada del saludo TLS con «(cifrado)» después del ServerHello (V24 = A) y el campo «Certificado». La tarjeta de captura es una sola `Card`, «Lo que ve router-proveedor», con un grupo por protocolo («Por http://», «Por https://») (V25 = A2). Cada grupo se parte en «se lee» y «cifrado», con la palabra en el encabezado del grupo y la cuenta («5 datos», «2 datos», «3 datos»), y trae una lista de campo y valor: IP y puertos, nombre del sitio, método y path, cabeceras y respuesta del servidor. El valor se muestra solo donde se lee; los campos cifrados muestran solo su nombre. Sin columnas, y sin tamaños ni momentos. La tarea confirma que la lista no es una primitiva nueva: si ya existe una de lista, la reutiliza; si no, lo justifica en `DESIGN.md`. La respuesta sale en el mapa de quien la generó (V21).

**Tests:**
- `the box shows the request and the response as sections and keeps the packet shape of tcp`.
- `the greeting is listed in order and marks as encrypted everything after the server hello`.
- `the capture card marks every field readable or encrypted with a word`.
- `the capture card has one group per protocol, split into read and encrypted, with the word and the count in the header of the group`.
- `a field that is encrypted shows its name and no value`.
- `the capture of http in the clear shows the credential and the capture of tls hides it`.
- `who generated the code is a field of the box and the response leaves the device that generated it`.
- `a status code, a browser error and a line of a tool are drawn outside Message`.
- `every warning and error of the game in chapter 3 is drawn by Message`.
- `a VPC box shows none of the new fields`.
- Cierre: golden sin cambios.

**Review Focus:** 5, 11, 22, 24 y 29.

**Commit:** `feat(ui): show the http message, the greeting, the generator and what the path sees in the box`.

---

### Tarea 27: La escena: `servidor-app`, `servidor-falso` y el sello del fallo de TLS (V26)

**Propósito:** que el mapa dibuje los servidores nuevos y que un saludo que el cliente rechazó deje su propio sello. **Depende de:** V26.

**Archivos:**
- Modify: `src/scene/layout.ts` y `layout.test.ts`, `src/scene/entities/stamp.tsx`, `src/copy/packet-labels.ts` (`StampState` gana `rejected` y `STAMP_TEXT` su palabra), `src/scene/traffic/flow-look.ts` y su test, `src/scene/catalog/catalog-cells.tsx`, `src/game/view/pieces.ts` y su test, `src/scene/entities/entity-icon.test.tsx`, `tests/e2e/entities.spec.ts`, `tests/e2e/snapshots/entities-darwin.png` (se regraba a propósito) e `interface-darwin.png` solo si el catálogo gana una fila (`DESIGN.md`, «Adding a variant instead of a new element», paso 3), `DESIGN.md` (una línea), guías.

**Interfaces:** `servidor-app` y `servidor-falso` son piezas de servidor de internet de la variante que ya existe (`internet-server`, V14 del capítulo 2), detrás del globo y sin tapar etiquetas. Un envío que termina en `tls-failed` deja el sello `rejected` («Rechazado por el cliente.»): la forma de ✕ con su palabra, distinta de `blocked` (V26 = B). Las celdas nuevas del catálogo caben en celdas libres de la rejilla (se cuentan al empezar); la tarea dice en su commit cuál de los dos casos fue.

**Tests:**
- `layout.test.ts`, `places servidor-app and servidor-falso on the road behind the globe without covering a label`.
- `pieces.test.ts`, `a server added by the chapter is drawn as a device piece of the variant internet-server once its name is shown`.
- `flow-look.test.ts`, `a failed greeting leaves the rejected stamp and not the blocked one`.
- `entity-icon.test.tsx`, `every stamp state has its own shape` (el de hoy, con el estado nuevo).
- `terms.test.ts`, `no packet shape, entity or catalog row is named after HTTP`.
- Playwright `entities.spec.ts`: `the specimen of the rejected stamp is part of the capture`.
- Cierre: la captura de piezas cambia solo por el especimen nuevo; la de la interfaz no cambia, salvo si el catálogo gana una fila y entonces cambia solo por el desplazamiento.

**Review Focus:** 5, 22 y 23.

**Commit:** `feat(scene): place the new servers and mark a rejected greeting with its own stamp`.

---

### Tarea 28: Preparar la cadena, el desbloqueo y los ayudantes

**Propósito:** que el primer incidente del capítulo 3 se abra con el 02-14 y que el 04-01 se abra con el 03-17, y que el mundo del capítulo tenga sus constantes.

**Archivos:**
- Create: `src/levels/03-the-web-inside/shared.ts` (las constantes del mundo: `IP`, `DEVICE`, `ROUTER`, `SERVER`, `NAME`, `CERT`, `TASK`, la fecha `TODAY`, las acciones de cada bloque y las listas `shown`) y `CLAUDE.md`; `tests/e2e/chapter-3/chapter-3-play.ts` (el esqueleto) y `CLAUDE.md`; `chapter-3.test.ts` (el esqueleto), donde la Tarea 1 lo dejó.
- Modify: `tests/e2e/saved-progress.ts` (`CHAPTER_3_DONE` lista `03-01` a `03-17`; el 04-01 se abre con ese y `CHAPTER_2_DONE` deja de abrirlo), `tests/e2e/incidents.spec.ts` y `card-layout.spec.ts` (abren el 04-01 con `CHAPTER_3_DONE`), `src/storage/progress.test.ts`, `tests/e2e/CLAUDE.md`, `src/levels/CLAUDE.md`.

**Interfaces:** `isUnlocked` no cambia (ya usa el orden del juego). Cada acción de `shared.ts` es una constante nombrada, como en el capítulo 2. `chapter-3.test.ts` crece con cada bloque: comprueba que los incidentes que existen presentan exactamente los términos de su fila de la tabla aprobada y, al llegar el 03-17, que los 65 están y no sobra ninguno.

**Tests:**
- `progress.test.ts`, `the first incident of chapter 4 opens with the last incident of chapter 3 in game order`.
- `the first incident of chapter 3 opens with the last incident of chapter 2 in game order`.
- `an incident with a star stays open even when the one before it has none` (el de hoy).
- `chapter-3.test.ts`, `introduces, incident by incident, the terms of the approved design` (vacío hasta el 03-01; crece por bloque).
- `each incident of chapter 3 starts from the solved world of the one before it` (vacía hasta el 03-01; crece por bloque).
- `a text of an incident names no term that a later incident of chapter 3 introduces`: repite `namedTerms` sobre los textos de cada incidente con los términos que presentan los incidentes de después. Lista corta de excepciones, escrita en la prueba y con su razón.
- Playwright (humo, sin incidentes aún): `CHAPTER_3_DONE opens 04-01 once chapter 3 exists` se activa en la Tarea 44.
- Cierre: `pnpm check` verde; golden sin cambios.

**Review Focus:** 3, 24 y 30.

**Commit:** `chore(levels): prepare the chain of chapter 3 and its helpers`.

---

### Contenido: lo que comparten las Tareas 29 a 44

- **Cada incidente** es un archivo `NN-<slug>.ts` en la carpeta de su bloque, con `defineIncident`, `chapter: 3`, `role: 'defender'`, su `introduces` (los términos de su fila del spec), sus `changes` (acciones nombradas en `shared.ts`), su lista `shown`, `report`, `tasks`, `hints`, `question`, `explanation` (tres opciones, una correcta en la posición de la ficha), `solution` y `takeaway`. **No cita lección ni nota** (el capítulo no nombra módulos; I1 y D-17 = B, Tarea 2).
- **El texto** lo escribe quien ejecuta, en español llano, con una idea por frase, con los términos conocidos etiquetados (`{{url}}` y compañía) y con el nombre de cada dispositivo, servidor o programa tomado del registro de `shared.ts` (`DEVICE`, `ROUTER`, `SERVER`, `NAME`, `CERT`), nunca como literal.
- **Cada tarea de contenido** suma sus pruebas a `chapter-3.test.ts`, extiende `tests/e2e/chapter-3/chapter-3-play.ts` con cómo se juega ese incidente con el ratón (un humo por bloque, no un recorrido completo) y deja pasar los genéricos de `incidents.test.ts` y de la escalera de las vistas (`starts with a task to fix`, `its reference solution fixes every task and earns every star but the explanation`, `only uses terms introduced in it or before`, `names each chip after a term, by its official name`).
- **Antes de empezar un bloque,** el implementador relee las fichas de ese bloque, la lista de «Simplificaciones declaradas» del spec y la guía de la carpeta del motor que le toca.
- **Al cerrar un bloque,** un revisor (`sonnet`) lee los textos de ese bloque antes de que empiece el siguiente. Recibe solo las rutas de los archivos del bloque, las reglas de `rigorous-plain-copy` y esta lista de qué mirar: lenguaje llano (frases cortas, una idea por frase), escalera de términos (ningún término que el jugador aún no conoce), rigor (cifras, límites y comportamientos con su fuente, y lo no verificado, dicho; ninguna opción enseña algo inexacto) y la causa de cada cambio de comportamiento (el report, la explicación correcta o el takeaway nombran lo que cambió). Sus correcciones se aplican antes del bloque siguiente. No hay prueba humana entre bloques: es una sola, al final de la Tarea 44. Se sugiere `/clear`.
- **Un test por incidente comprueba la lista de lo que el incidente nombra:** `03-NN: the report names ...` (Review Focus 7).

### Tarea 29: Bloque 1 · 01

**Presenta:** HTTP, URL, path, query string, curl (ficha 03-01). Denso: tarea propia. **Depende de:** D-20 y V28.

**Archivos:**
- Create: `src/levels/03-the-web-inside/asking-for-a-page/01-an-address-for-everything.ts` y `asking-for-a-page/CLAUDE.md`.
- Modify: `shared.ts` (el `setWebService` de `laptop-lucia`, las fichas de URL por partes y los mensajes de `curl`), `chapter-3.test.ts`, `src/levels/registry.test.ts`, `src/levels/CLAUDE.md`, `tests/e2e/chapter-3/chapter-3-play.ts`.

**Interfaces:** `send`, mundo = 02-13 más el `setWebService`; `shown` = `laptop-lucia`; dos tareas (ficha). La salida de `curl` es la de la Tarea 22.

**Tests:**
- `03-01: the curl of the order 7 and the one of the order 8 each complete their task`.
- `03-01: the box shows the url in its parts and the body`.
- `03-01: a plain curl prints only the body`.
- `03-01: port 80 is refused because nobody listens on it`.
- `03-01: the report names laptop-lucia and says the program now answers http`.
- `03-01: draws laptop-lucia and no other piece`.
- `03-01: introduces http, url, path, query string and curl, and uses no later term`.
- `03-01: the takeaway says the output is the one of curl 8.21.0 of Amazon Linux 2023 and that a Mac prints errors differently`.
- `03-01: the takeaway says the fragment of a url never reaches the server`.
- `03-01 starts from the world chapter 2 leaves` (comprueba que el mundo de partida es el que el capítulo 2 deja, con `laptop-lucia` sin servicio web).
- `registry.test.ts`, `registers the incidents in game order` (suma el `03-01`).
- Playwright (humo): `chapter 3 opens at 03-01 once 02-14 has a star and 04-01 stays closed`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4, 5, 7 y 21.

**Commit:** `feat(levels): add chapter 3 incident 01, an address for everything`.

---

### Tarea 30: Bloque 1 · 02

**Presenta:** petición HTTP, respuesta HTTP, método HTTP, idempotente (ficha 03-02).

**Archivos:**
- Create: `src/levels/03-the-web-inside/asking-for-a-page/02-ask-and-answer.ts`.
- Modify: `shared.ts`, `chapter-3.test.ts`, `registry.test.ts`, `asking-for-a-page/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-02: the get, the two posts and the two puts each complete their task`.
- `03-02: the second post creates another order and the second put leaves the same`.
- `03-02: the box shows the request and the response behind their terms and names no status code`.
- `03-02: the question separates the effect of repeating from the answer`.
- `03-02: no text says idempotent means the same answer`.
- `03-02: no text says http prevents duplicates`.
- `03-02: the report names laptop-lucia`.
- `03-02: introduces http request, http response, http method and idempotent, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 17 y 26.

**Commit:** `feat(levels): add chapter 3 incident 02, ask and answer`.

---

### Tarea 31: Bloque 1 · 03

**Presenta:** proceso, servidor web, navegador (ficha 03-03).

**Archivos:**
- Create: `src/levels/03-the-web-inside/asking-for-a-page/03-who-answers.ts`.
- Modify: `shared.ts` (la regla de firewall, el `setProcess` de la app de reportes), `chapter-3.test.ts`, `registry.test.ts`, `asking-for-a-page/CLAUDE.md`, `chapter-3-play.ts`.

**Interfaces:** `send` con la tarjeta de reglas de `laptop-lucia` y la pestaña «Navegador» de `tu-laptop`. Dos procesos en `laptop-lucia` (decidida 32).

**Tests:**
- `03-03: the browser reaches the page once the rule opens the port 3000 to the office`.
- `03-03: without the rule the request dies in the firewall, the browser gets nothing and curl times out`.
- `03-03: the curl to the stopped app is refused by laptop-lucia and prints no status code`.
- `03-03: a refusal, a silence and a page leave different stamps`.
- `03-03: the rule opens the port 3000 and no other`.
- `03-03: the report names laptop-lucia and says who stopped the process`.
- `03-03: no text says that a stopped app and a firewall are the same`.
- `03-03: introduces process, web server and browser, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 8 y 26.

**Commit:** `feat(levels): add chapter 3 incident 03, who answers`.

---

### Tarea 32: Bloque 1 · 04

**Presenta:** cabecera HTTP, cabecera Host, host virtual (ficha 03-04).

**Archivos:**
- Create: `src/levels/03-the-web-inside/asking-for-a-page/04-one-server-many-sites.ts`.
- Modify: `shared.ts` (el servidor web de `servidor-nuevo`, las fichas de sitio), `chapter-3.test.ts`, `registry.test.ts`, `asking-for-a-page/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-04: adding blog gives blog its own site and www keeps the shop`.
- `03-04: the ip alone gets the default site`.
- `03-04: before the site exists blog gets the shop because its host has no site`.
- `03-04: the box shows the Host header of each request`.
- `03-04: a url without a port goes to 80`.
- `03-04: no text says the server knows the site by the ip or by the cname`.
- `03-04: the report names servidor-nuevo`.
- `03-04: draws tu-laptop, servidor-dns, router-oficina and servidor-nuevo`.
- `03-04: introduces http header, Host header and virtual host, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7 y 18.

**Commit:** `feat(levels): add chapter 3 incident 04, one server and many sites`.

**Revisión de los textos del bloque 1** (01 a 04) por un revisor `sonnet`, antes del bloque 2 (ver «Contenido»).

---

### Tarea 33: Bloque 2 · 05 y 06

**Presenta:** código de estado, 200 OK, error 4xx, 404 Not Found, 400 Bad Request (05); autenticación, autorización, cabecera Authorization, 401 Unauthorized, 403 Forbidden, cookie (06) (fichas 03-05 y 03-06). El 06 tiene seis términos, el tope.

**Archivos:**
- Create: `src/levels/03-the-web-inside/how-it-went/05-how-did-it-go.ts`, `06-who-you-are-and-what-you-can.ts` y `how-it-went/CLAUDE.md`.
- Modify: `shared.ts` (la validación del id, `/admin`, los usuarios y `/login`), `chapter-3.test.ts`, `registry.test.ts`, `chapter-3-play.ts`.

**Tests:**
- `03-05: 200, 404 and 400 each complete their task`.
- `03-05: the box says the app generated each code`.
- `03-05: no text says a 4xx is always the fault of the client`.
- `03-05: no text says a 200 means the business went well`.
- `03-05: the report names laptop-lucia`.
- `03-05: introduces status code, 200 OK, 4xx error, 404 Not Found and 400 Bad Request, and uses no later term`.
- `03-06: 401 without a credential, 403 with the one of Marta and 200 with the one of Lucía each complete their task`.
- `03-06: the browser enters /admin with the cookie after signing in as Lucía`.
- `03-06: curl keeps no cookie unless it is given -b`.
- `03-06: repeating the request of Marta gives the same 403`.
- `03-06: the takeaway says that in AWS the number alone is not enough and names no service`.
- `03-06: no text registers or uses the word stateless`.
- `03-06: the takeaway says a credential over http can be read by anyone who sees the path`.
- `03-06: the report names laptop-lucia`.
- `03-06: introduces authentication, authorization, Authorization header, 401, 403 and cookie, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 16 y 26.

**Commit:** `feat(levels): add chapter 3 incidents 05 and 06, how did it go and who you are`.

**Revisión de los textos del bloque 2** (05 y 06) por un revisor `sonnet`, antes del bloque 3.

---

### Tarea 34: Bloque 3 · 07

**Presenta:** proxy inverso, servidor de origen, X-Forwarded-For, 429 Too Many Requests (ficha 03-07). **Depende de:** D-26.

**Archivos:**
- Create: `src/levels/03-the-web-inside/server-in-front/07-a-server-in-front.ts` y `server-in-front/CLAUDE.md`.
- Modify: `shared.ts` (`servidor-app`, el proxy de `servidor-nuevo`, la ráfaga de `casa-lucia`, el ajuste de la IP del cliente), `chapter-3.test.ts`, `registry.test.ts`, `chapter-3-play.ts`.

**Tests:**
- `03-07: after the burst even the request of tu-laptop gets 429 while the app reads the ip of the connection`.
- `03-07: after the setting casa-lucia gets 429 and tu-laptop gets 200`.
- `03-07: the 429 is generated by servidor-app and the proxy passes it through`.
- `03-07: the box shows two connections, the one of the client and the one of the proxy`.
- `03-07: no text says the proxy limits the requests`.
- `03-07: the report names laptop-lucia, servidor-nuevo and servidor-app`.
- `03-07: the takeaway tells the practical case of the app on 127.0.0.1 behind the web server`.
- `03-07: the takeaway says the client can write its own X-Forwarded-For and the origin takes the entry its proxy added`.
- `03-07: draws tu-laptop, casa-lucia, servidor-dns, router-oficina, the globe, servidor-nuevo and servidor-app`.
- `03-07: introduces reverse proxy, origin server, X-Forwarded-For and 429, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 9 y 19.

**Commit:** `feat(levels): add chapter 3 incident 07, a server in front`.

---

### Tarea 35: Bloque 3 · 08

**Presenta:** error 5xx, 500 Internal Server Error, 503 Service Unavailable, 504 Gateway Timeout (ficha 03-08).

**Archivos:**
- Create: `src/levels/03-the-web-inside/server-in-front/08-the-origin-or-the-proxy.ts`.
- Modify: `shared.ts` (`/informe`, `/pedidos/roto`, la lista de orígenes vacía), `chapter-3.test.ts`, `registry.test.ts`, `server-in-front/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-08: the broken path answers 500 generated by servidor-app`.
- `03-08: the slow path answers 504 generated by servidor-nuevo`.
- `03-08: an empty list of origins answers 503 generated by servidor-nuevo`.
- `03-08: putting servidor-app back in the list closes the incident with a 200`.
- `03-08: no text says every dead origin gives 503`.
- `03-08: the report names servidor-app and servidor-nuevo`.
- `03-08: introduces 5xx error, 500, 503 and 504, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 9 y 26.

**Commit:** `feat(levels): add chapter 3 incident 08, the origin or the proxy`.

---

### Tarea 36: Bloque 3 · 09

**Presenta:** 502 Bad Gateway, conexión persistente, idle timeout (ficha 03-09). **Depende de:** D-19.

**Archivos:**
- Create: `src/levels/03-the-web-inside/server-in-front/09-refused-or-cut.ts`.
- Modify: `shared.ts` (el proceso detenido, el idle timeout de `servidor-app`, las fichas de espera del reloj), `chapter-3.test.ts`, `registry.test.ts`, `server-in-front/CLAUDE.md`, `chapter-3-play.ts`.

**Tests (con D-19 = B; con D-19 = A cambian los tres de la espera):**
- `03-09: with the app stopped the proxy answers 502 because the origin refused`.
- `03-09: starting the app makes the request answer 200`.
- `03-09: a wait of 3 seconds reuses the connection and answers 200`.
- `03-09: a wait of 5 seconds crosses the close of the origin and answers 502`.
- `03-09: a wait of 10 seconds opens a new connection and answers 200`.
- `03-09: an idle timeout of 30 seconds still crosses at 30 seconds and one of 65 seconds does not`.
- `03-09: the text says the requests crossed and never that the proxy is slow`.
- `03-09: the text separates a 502 from a 504`.
- `03-09: the report names servidor-app`.
- `03-09: introduces 502, persistent connection and idle timeout, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 10 y 26.

**Commit:** `feat(levels): add chapter 3 incident 09, refused or cut`.

**Revisión de los textos del bloque 3** (07 a 09) por un revisor `sonnet`, antes del bloque 4.

---

### Tarea 37: Bloque 4 · 10

**Presenta:** cifrado, cifrado simétrico, TLS, HTTPS (ficha 03-10).

**Archivos:**
- Create: `src/levels/03-the-web-inside/encrypt-and-prove/10-what-the-path-sees.ts` y `encrypt-and-prove/CLAUDE.md`.
- Modify: `shared.ts` (TLS en el 443 de `servidor-nuevo`, la captura de `router-proveedor`), `chapter-3.test.ts`, `registry.test.ts`, `chapter-3-play.ts`.

**Tests:**
- `03-10: the request over https answers 200 and the capture hides the credential`.
- `03-10: the request over http shows the credential in the capture`.
- `03-10: the capture lists the addresses, the ports and the name of the site of the greeting`.
- `03-10: no text says https encrypts everything`.
- `03-10: no text calls a certificate an SSL certificate`.
- `03-10: the report names servidor-nuevo`.
- `03-10: draws router-proveedor because the capture names it`.
- `03-10: introduces encryption, symmetric encryption, TLS and HTTPS, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4, 11 y 26.

**Commit:** `feat(levels): add chapter 3 incident 10, what the path sees`.

---

### Tarea 38: Bloque 4 · 11

**Presenta:** cifrado asimétrico, clave pública, clave privada, firma digital, certificado (ficha 03-11). Denso (cinco términos difíciles).

**Archivos:**
- Create: `src/levels/03-the-web-inside/encrypt-and-prove/11-is-it-you.ts`.
- Modify: `shared.ts` (`servidor-falso`, la línea del archivo hosts, el certificado copiado), `chapter-3.test.ts`, `registry.test.ts`, `encrypt-and-prove/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-11: with the hosts line the curl reaches servidor-falso and fails the signature with no status code`.
- `03-11: removing the line makes the curl reach servidor-nuevo and answer 200`.
- `03-11: the certificate card of servidor-falso says the private key is not there`.
- `03-11: the copy of the certificate is public and valid and does not help`.
- `03-11: the failure leaves the rejected stamp and not the blocked one`.
- `03-11: no text says the private key decrypts in tls`.
- `03-11: no text says the certificate is secret`.
- `03-11: the text says servidor-falso is a program made for this and that a real server does not start with a certificate that does not match its key`.
- `03-11: the report names tu-laptop`.
- `03-11: introduces asymmetric encryption, public key, private key, digital signature and certificate, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 12 y 26.

**Commit:** `feat(levels): add chapter 3 incident 11, is it you`.

**Revisión de los textos del bloque 4** (10 y 11) por un revisor `sonnet`, antes del bloque 5.

---

### Tarea 39: Bloque 5 · 12

**Presenta:** hash, autoridad certificadora, cadena de certificados, certificado autofirmado, openssl s_client (ficha 03-12). Denso (cinco términos).

**Archivos:**
- Create: `src/levels/03-the-web-inside/certificate-and-greeting/12-who-signed-it.ts` y `certificate-and-greeting/CLAUDE.md`.
- Modify: `shared.ts` (el certificado editado, el autofirmado y el 8443 de `servidor-falso`), `chapter-3.test.ts`, `registry.test.ts`, `chapter-3-play.ts`.

**Tests:**
- `03-12: s_client to servidor-nuevo verifies`.
- `03-12: s_client to the 443 of servidor-falso reports certificate signature failure`.
- `03-12: s_client to the 8443 of servidor-falso reports self-signed certificate`.
- `03-12: s_client does not stop at a verification failure and the text says so`.
- `03-12: the trust card shows the authority tu-laptop trusts and not the one of servidor-falso`.
- `03-12: no text says s_client checks the name`.
- `03-12: no text says that turning verification off fixes a certificate`.
- `03-12: the report names servidor-falso`.
- `03-12: introduces hash, certificate authority, certificate chain, self-signed certificate and openssl s_client, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 13, 21 y 26.

**Commit:** `feat(levels): add chapter 3 incident 12, who signed it`.

---

### Tarea 40: Bloque 5 · 13

**Presenta:** SAN, certificado comodín, validación del certificado (ficha 03-13). **Depende de:** D-21.

**Archivos:**
- Create: `src/levels/03-the-web-inside/certificate-and-greeting/13-is-it-for-this-name.ts`.
- Modify: `shared.ts` (el registro A de `lucia.example`, el certificado comodín, el pedido de certificado), `chapter-3.test.ts`, `registry.test.ts`, `certificate-and-greeting/CLAUDE.md`, `chapter-3-play.ts`.

**Tests (con D-21 = B):**
- `03-13: the wildcard alone validates www and fails lucia.example with the SAN line`.
- `03-13: requesting the list that includes lucia.example makes both names validate`.
- `03-13: the old certificate stays in the card`.
- `03-13: no card lets the player edit the names of a certificate`.
- `03-13: the failure comes before any status code`.
- `03-13: the text says the dates are checked and the game plays them in the guard`.
- `03-13: the text says a wildcard does not cover two labels`.
- `03-13: the report names servidor-autoritativo and servidor-nuevo`.
- `03-13: introduces SAN, wildcard certificate and certificate validation, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 13 y 26.

**Commit:** `feat(levels): add chapter 3 incident 13, is it for this name`.

---

### Tarea 41: Bloque 5 · 14

**Presenta:** saludo TLS, clave de sesión, SNI, versiones de HTTP (ficha 03-14).

**Archivos:**
- Create: `src/levels/03-the-web-inside/certificate-and-greeting/14-the-tls-greeting.ts`.
- Modify: `shared.ts` (la zona `marta.example`, el sitio de Marta, el certificado por defecto), `chapter-3.test.ts`, `registry.test.ts`, `certificate-and-greeting/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-14: www and marta each get their certificate from the server name`.
- `03-14: by ip no server name is sent and the default certificate fails the name check`.
- `03-14: the box lists the greeting in order and marks everything after the server hello as encrypted`.
- `03-14: curl -v prints only lines the source confirms`.
- `03-14: no text says the name travels in the clear by mistake`.
- `03-14: the text on HTTP/3 says a rule for TCP 443 does not open UDP 443`.
- `03-14: the text says the session key is one per direction and never travels`.
- `03-14: the report names servidor-autoritativo and servidor-nuevo`.
- `03-14: introduces TLS greeting, session key, SNI and http versions, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 11 y 14.

**Commit:** `feat(levels): add chapter 3 incident 14, the tls greeting`.

**Revisión de los textos del bloque 5** (12 a 14) por un revisor `sonnet`, antes del bloque 6.

---

### Tarea 42: Bloque 6 · 15

**Presenta:** terminación de TLS, redirección, 301 Moved Permanently, HSTS (ficha 03-15).

**Archivos:**
- Create: `src/levels/03-the-web-inside/https-for-all/15-everyone-to-https.ts` y `https-for-all/CLAUDE.md`.
- Modify: `shared.ts` (la redirección de la app, la del proxy, HSTS, la captura del tramo), `chapter-3.test.ts`, `registry.test.ts`, `chapter-3-play.ts`.

**Tests:**
- `03-15: before the fix the browser loops and curl -L stops at 50`.
- `03-15: moving the redirect to servidor-nuevo ends the loop with a 301 and a 200`.
- `03-15: hsts makes the second visit go straight to https`.
- `03-15: a curl -L -d over http ends as a get`.
- `03-15: the capture of the leg from servidor-nuevo to servidor-app shows plain http`.
- `03-15: the text says the redirect needs the port 80 open and listening`.
- `03-15: the text says hsts does not cover the first visit`.
- `03-15: the takeaway names the other fix, that the app reads X-Forwarded-Proto`.
- `03-15: the report names servidor-app`.
- `03-15: draws router-destino because the capture names it`.
- `03-15: introduces TLS termination, redirect, 301 and HSTS, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 7, 15 y 26.

**Commit:** `feat(levels): add chapter 3 incident 15, everyone to https`.

---

### Tarea 43: Bloque 6 · 16

**Presenta:** API, JSON, REST (ficha 03-16).

**Archivos:**
- Create: `src/levels/03-the-web-inside/https-for-all/16-data-for-programs.ts`.
- Modify: `shared.ts` (`/api/pedidos`, los cuerpos), `chapter-3.test.ts`, `registry.test.ts`, `https-for-all/CLAUDE.md`, `chapter-3-play.ts`.

**Tests:**
- `03-16: the get of the order answers json with a link to its lines`.
- `03-16: following the link answers its lines`.
- `03-16: a body with single quotes answers 400`.
- `03-16: the question separates rest from json`.
- `03-16: no text says rest is json over http`.
- `03-16: no text names rest api or http api as products`.
- `03-16: the report names servidor-app`.
- `03-16: introduces API, JSON and REST, and uses no later term`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4 y 26.

**Commit:** `feat(levels): add chapter 3 incident 16, data for programs`.

**Revisión de los textos del bloque 6** (15 y 16) por un revisor `sonnet`, antes del bloque 7.

---

### Tarea 44: Bloque 7 · 17

**Presenta:** ningún término (ficha 03-17). **Depende de:** D-21 (el caso 2).

**Archivos:**
- Create: `src/levels/03-the-web-inside/on-call/17-on-call-the-web-does-not-load.ts`, `cases.ts` y `on-call/CLAUDE.md`.
- Modify: `shared.ts` (los cambios de cada caso, las listas `shown` por caso), `chapter-3.test.ts` (ahora exige los 65 términos), `registry.test.ts`, `chapter-3-play.ts`, `src/storage/progress.test.ts`.

**Interfaces:** siete casos (tabla de la ficha), cada uno como un cambio sobre el mundo del 16; `cases.ts` usa constructores para que `jscpd` no vea siete casos casi iguales. El caso 2 trae `fix` con la tarjeta de pedir un certificado. El caso 1 ofrece los comandos de las seis pruebas.

**Tests:**
- `03-17: case 1 shows the six tests in order and the sixth says servidor-nuevo generated the 502`.
- `03-17: case 2 fails the name check with no status code and closes when a certificate that covers lucia.example is requested`.
- `03-17: case 3 fails the dates of blog and www validates`.
- `03-17: case 4 answers 403 to Marta and 200 to Lucía`.
- `03-17: case 5 ends in Maximum (50) redirects followed`.
- `03-17: case 6 answers 504 generated by servidor-nuevo`.
- `03-17: case 7 fails the tls greeting with wrong version number and no status code`.
- `03-17: naming the right cause of the seven cases earns three stars`.
- `03-17: each case has a different cause`.
- `03-17: each case starts from the world before the incident plus its own changes, not from the case before`.
- `03-17: no report and no correct option names a switched-off device as the cause`.
- `03-17: every change a case makes is named in its report or in the feedback of its right cause`.
- `chapter-3.test.ts`, `introduces exactly the 65 terms of the approved design, each in its incident`.
- `no term of the approved design is missing: the ids of the table of the spec equal the ids that 03-01 to 03-17 introduce`.
- `names no topic of the chapters that come later, in any text of chapter 3`.
- `every public address of chapter 3 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example`.
- Playwright: `04-01 opens once 03-17 has a star`.
- Cierre: golden sin cambios.

**Review Focus:** 3, 4, 7, 25 y 27.

**Commit:** `feat(levels): add chapter 3 incident 17, on call`.

**Revisión de los textos del bloque 7** (17) por un revisor `sonnet` (ver «Contenido»).

**Prueba humana del capítulo entero** (única, como en los capítulos 1 y 2). El estudiante la hace con su propio servidor al terminar esta tarea: juega los diecisiete de seguido y entra después al capítulo 4, y dice si algún mensaje lo pierde. Las Tareas 45 y 46 no se detienen a esperarla; lo que anote se agrega al backlog. Comprueba, por bloque:
1. **Bloque 1 · 01 a 04.**
   - ¿El 01 se siente pesado (cinco términos)?
   - ¿La URL en partes se arma bien (V28)?
   - ¿El mensaje HTTP se entiende como algo que viaja dentro de la conexión y no como un paquete?
   - ¿Se distinguen el rechazo, el silencio y una respuesta (03)?
   - ¿«Sitios» y la cabecera Host se leen?
2. **Bloque 2 · 05 y 06.**
   - ¿El 06 se siente pesado (seis términos)?
   - ¿El 401 y el 403 se separan?
   - ¿La cookie y la diferencia entre `curl` y el navegador quedan claras?
3. **Bloque 3 · 07 a 09.**
   - ¿El mapa del 07, con `servidor-app`, se amontona?
   - ¿Se ve en la caja quién generó cada código?
   - ¿El cruce del 09 se entiende y las pistas llevan a la espera de 5 s?
   - ¿«Sale a ratos» queda explicado?
4. **Bloque 4 · 10 y 11.**
   - ¿La captura se lee y queda claro qué sigue viendo el camino?
   - ¿El 11 se siente pesado (cinco términos)?
   - ¿«Copiar el certificado no sirve» se entiende?
5. **Bloque 5 · 12 a 14.**
   - ¿El 12 y el 14 se sienten pesados?
   - ¿La cadena y la tarjeta de raíces ayudan?
   - ¿Pedir un certificado en el 13 se entiende?
   - ¿El saludo TLS en la caja se lee y el SNI queda claro?
   - ¿`curl -v` y `openssl s_client` se leen aunque falten líneas?
6. **Bloque 6 · 15 y 16.**
   - ¿El bucle se entiende como un cambio de dónde termina TLS?
   - ¿HSTS queda claro?
   - ¿REST frente a JSON queda claro?
7. **Bloque 7 · 17 y el capítulo entero.**
   - ¿Se pueden resolver los siete casos con lo aprendido?
   - ¿Es posible reparar el caso 2 con la tarjeta de certificados?
   - ¿El capítulo entero se siente largo (cuarenta y cinco subcapítulos antes del 04-01)? ¿Qué se fusiona o se separa? ¿Se parten el 06, el 11 o el 12?
   - ¿El capítulo 4 sigue jugable?
   - ¿Nada de la red se siente «mágico»? Cada vez que se porta distinto, el juego dice qué cambió.
   - ¿Algún texto del navegador o de `curl` parece de otro programa que el que dice?

---

### Tarea 45: Playwright del capítulo entero

**Archivos:**
- Modify: `tests/e2e/chapter-3/chapter-3.spec.ts` (nuevo), `chapter-3-play.ts`, `tests/e2e/saved-progress.ts`, `tests/e2e/incidents.spec.ts` (si algún nombre cambió), `tests/e2e/card-layout.spec.ts` (suma las escenas de las tarjetas nuevas), `tests/e2e/map-boxes.ts` y `card-boxes.ts` (si hace falta), `tests/e2e/CLAUDE.md`.

**Tests:**
- `chapter 3 is played from 03-01 to 03-17, each incident opening the next, with 3 stars each`.
- `the roadmap lists the seventeen incidents of chapter 3 with their stars`.
- `04-01 opens after 03-17 has a star`.
- Dentro de «Sin animaciones»: `in 03-07 the map and its labels fit the area at full size`.
- `in 03-10 and 03-15 no label or stamp overlaps`.
- `the cards of servers, certificates and capture cover no piece of the map`.
- `in 03-09 waiting from the clock card changes the answer of the second request`.
- `in 03-04 adding the site from the sites tab changes the answer for blog`.
- `in 03-13 requesting a certificate from the certificates tab makes lucia.example validate`.
- `in 03-17 case 2 can be repaired from the certificates tab`.
- Cada prueba de geometría corre a 1280×800 y a 1440×900, con el mapa a tamaño completo.
- Cierre: `pnpm check` completo.

**Review Focus:** 22.

**Commit:** `test(e2e): play the seventeen incidents of chapter 3`.

---

### Tarea 46: Documentos

**Archivos:**
- Modify: `README.md` (el capítulo 3 es de diecisiete subcapítulos en siete bloques; enlaza el spec y este plan), `DESIGN.md` (se revisa que refleje el estado de sello nuevo y que la única primitiva nueva sea la sección que se pliega), `../../docs/plans/follow-the-packet-roadmap.md` (la fila del capítulo 3 pasa de `en curso` a `hecho` con los commits, y se suma la prueba humana del capítulo 3 si falta), `../../docs/plans/2026-10-08-follow-the-packet-followups.md` (lo que quedó: las líneas de `curl` y `openssl s_client` que no se pudieron verificar, los subcapítulos que la prueba humana pidió separar o fusionar, D-14 B), `../../docs/research/2026-10-09-follow-the-packet-chapters.md` (la ficha del capítulo 3: temas y «qué viaja y qué configura» de los diecisiete), `../../docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md` y `../../docs/plans/2026-10-11-follow-the-packet-chapter-2.md` (una nota donde dicen «el 04-01 se abre con el 02-14»: lo reemplaza el capítulo 3), `../../docs/specs/2026-10-11-follow-the-packet-chapter-3-design.md` (estado), este documento (los totales reales y las decisiones tomadas).
- Antes de cerrar, se corren cuatro comprobaciones sobre el Markdown cambiado:
  - el chequeo de links del `CLAUDE.md` del repo, que debe decir `LINKS OK`;
  - un script que busca nombres de pruebas repetidos en la sección «Tareas» de este plan;
  - un script que comprueba que cada «Tarea N», «D-N», «VN», «Review Focus N» y «decidida N» que se cita existe;
  - una búsqueda de tildes que faltan y de frases de más de 25 palabras.
- Se vuelve a calcular la suma SHA-256 del spec y del plan del capítulo 2 y, si cambiaron desde «Estado al empezar», se relee lo que cambió.

**Tests:** `chapters.test.ts`, `match the chapter map of the chapters doc, in game order` sigue verde (la tabla no cambia).

**Cierre:** `pnpm check` verde. **Commit:** `docs: record chapter 3 in seventeen subchapters`. Al cerrar el plan se sugiere `/clear`.

---

## Cobertura de los 65 términos

El plan prueba que no falta ninguno de dos maneras: esta tabla, hecha del spec por un script, y el test `no term of the approved design is missing: the ids of the table of the spec equal the ids that 03-01 to 03-17 introduce` (Tarea 44), que además exige `registers the 65 new ids of chapter 3` (Tarea 3). Los 65 suman 5 + 4 + 3 + 3 + 5 + 6 + 4 + 4 + 3 + 4 + 5 + 5 + 3 + 4 + 4 + 3. Los 65 ids son nuevos: ninguno del capítulo 2 se reescribe. La escalera de las definiciones la comprueba `every definition of chapter 3 names only terms that are known at its incident, in the approved order` (Tarea 3). Se calculó con el script descrito en el spec: 0 problemas hacia adelante, hacia atrás y con los 15 términos del capítulo 4.

| Inc. | Tarea | Ids que presenta | Cuántos |
|------|-------|------------------|---------|
| 01 | 29 | `http`, `url`, `url-path`, `query-string`, `curl` | 5 |
| 02 | 30 | `http-request`, `http-response`, `http-method`, `idempotent` | 4 |
| 03 | 31 | `process`, `web-server`, `browser` | 3 |
| 04 | 32 | `http-header`, `host-header`, `virtual-host` | 3 |
| 05 | 33 | `status-code`, `status-200`, `client-error`, `status-404`, `status-400` | 5 |
| 06 | 33 | `authentication`, `authorization`, `authorization-header`, `status-401`, `status-403`, `cookie` | 6 |
| 07 | 34 | `reverse-proxy`, `origin-server`, `x-forwarded-for`, `status-429` | 4 |
| 08 | 35 | `server-error`, `status-500`, `status-503`, `status-504` | 4 |
| 09 | 36 | `status-502`, `persistent-connection`, `idle-timeout` | 3 |
| 10 | 37 | `encryption`, `symmetric-encryption`, `tls`, `https` | 4 |
| 11 | 38 | `asymmetric-encryption`, `public-key`, `private-key`, `digital-signature`, `certificate` | 5 |
| 12 | 39 | `hash`, `certificate-authority`, `certificate-chain`, `self-signed-certificate`, `openssl-s-client` | 5 |
| 13 | 40 | `san`, `wildcard-certificate`, `certificate-validation` | 3 |
| 14 | 41 | `tls-handshake`, `session-key`, `sni`, `http-versions` | 4 |
| 15 | 42 | `tls-termination`, `redirect`, `status-301`, `hsts` | 4 |
| 16 | 43 | `api`, `json`, `rest` | 3 |
| 17 | 44 | ninguno | 0 |
| **Total** | | | **65** |

## Cobertura de requisitos

| Pide el encargo o el estudiante | Dónde |
|---------------------------------|-------|
| Spec y plan en español con tildes, en los dos archivos pedidos | Estos dos documentos |
| Los 17 subcapítulos aprobados, tal cual, con D-1 a D-18 | Spec («Los diecisiete»); fichas 03-01 a 03-17; «Decisiones del estudiante» |
| Huecos del motor primero, antes del contenido, con un solo motor puro y determinista | «Inventario de huecos»; Tareas 5 a 18 antes de las 19 a 44; Review Focus 20 |
| Las trazas de los capítulos 1, 2 y 4 no cambian y el dorado del 4 no se edita nunca | Global Constraints; cada tarea de motor repite `git diff --exit-code`; Review Focus 1 y 2 |
| Petición y respuesta HTTP como algo que viaja, y el mensaje no es un paquete | Tarea 6; D-25; V20; Review Focus 5 |
| Servidor web, proxy inverso, certificados, saludo TLS, `curl`, `openssl s_client` y los desenlaces HTTP y TLS | Tareas 5 a 18 y 22 |
| Tarea 0 con prototipos HTML renderizados desde V20, nunca dibujos de texto | Tarea 0; «Decisiones visuales» (V20 a V28) |
| Decisiones abiertas nuevas desde D-19, con opciones, recomendación y porqué, y las inexactas marcadas | «Decisiones abiertas» (D-19 a D-26) |
| Las salidas de `curl` y `openssl` imitan Amazon Linux 2023, con fuente y fecha, y lo que no se verifica no se imprime | Spec («Las herramientas, como las imprime su código»); Tarea 22; Review Focus 21 |
| Escalera de términos con el test que la comprueba y cómo se calculó | Spec («Escalera de términos»); Tarea 3; Review Focus 3 |
| Rigor siempre; ninguna opción, texto o ficha enseña algo inexacto | Global Constraints; cada decisión abierta; Review Focus 26 |
| Ningún cambio de comportamiento sin causa | Tarea 4; Review Focus 7; cada ficha nombra lo que cambió |
| Sin predicciones antes de actuar | Reglas del spec; fichas |
| Una sola primitiva de UI por familia; este capítulo suma solo la sección que se pliega (V27 = D) | Global Constraints; Contratos nuevos («Sistema de diseño»); Review Focus 24 y 29 |
| El progreso guardado se puede resetear; sin migraciones | «Decisiones del estudiante»; los ids `03-xx` son nuevos |
| Lenguaje simple | Formato; fichas; revisor de cada bloque y prueba humana |
| Una sola prueba humana, al final, con un revisor `sonnet` de los textos de cada bloque | Final de la Tarea 44; «Contenido»; Global Constraints («Ejecución») |
| Cambios visibles en los capítulos 1, 2 y 4, todos | «Cambios visibles en los capítulos 1, 2 y 4» |
| El desbloqueo del 04-01 pasa a abrirse con el 03-17 | Tarea 28; «Cambios visibles» |
| Los términos que se mudan | Spec («Escalera de términos»): ninguno entre capítulos; los 18 cambios de orden internos |
| I1 y la lección opcional (D-17 = B), antes del contenido | Tarea 2 |
| D-10 confirmado en el RFC 8446 §7.3 y citado | Spec («Decisiones del estudiante»); Tarea 3; D-10 arriba |
| D-6 = A: el origen es `servidor-app`; la variante en `127.0.0.1:3000` como dato práctico al final de un subcapítulo | Ficha 03-07 (rigor); decidida 31 |
| «Estado al empezar»: lo que se da por hecho del capítulo 2 y lo que comprueba la primera tarea | «Estado al empezar»; Tarea 1 |
| Global Constraints: commits con rutas de la tarea, trailer, sin push, puertos 5173 y 5180 intocables, Playwright en el 4183, nada de matar por patrón, ninguna dependencia (salvo la del acordeón, si la Tarea 23 la elige), ningún `aws`, subagentes con `model` explícito (`sonnet` o `haiku`, nunca `opus`) | «Global Constraints» |
| «Decisiones abiertas», «Decididas sin el estudiante» y «Decisiones visuales», fichas por bloque, Review Focus, tareas con archivos, tests con nombre en inglés y commit, y las coberturas | Las secciones de este plan |

## Decisiones visuales

La Tarea 0 las prepara con prototipos renderizados y las recoge **de a una por mensaje**. El 2026-10-11 el estudiante cerró las nueve (V20 a V28). La columna «Recomendada» es la que proponía el plan; la columna «Estado» dice lo que el estudiante eligió y las respuestas van debajo de la tabla. Toda elección visual nueva se le muestra con prototipos renderizados, no con dibujos de texto. La columna «Primitiva que se reutiliza» es la regla de `DESIGN.md`: ninguna elección suma un elemento hermano; el estilo cambia la primitiva. **Inexacta** quiere decir que la opción enseñaría algo falso; **no cumple `DESIGN.md`** quiere decir que rompe una regla del sistema de diseño.

| # | Qué se decide | Primitiva que se reutiliza | Opciones | Recomendada | Estado | Tareas |
|---|---------------|----------------------------|----------|-------------|--------|--------|
| V20 | El mensaje HTTP en el mapa y en la caja (D-25) | La caja de inspección y el paquete de TCP | A. En la caja, con secciones «Petición HTTP» y «Respuesta HTTP»; el paquete conserva la forma de TCP. B. En la etiqueta del paquete («GET /pedidos», «200»): **inexacta**, mezcla capas y, bajo TLS, la etiqueta mostraría lo que el camino no ve. C. Una forma nueva de paquete para HTTP: **inexacta**, el mensaje no es un paquete | A | Cerrada: A | 26 |
| V21 | Quién generó el código | La caja y el paquete de respuesta | A. Un campo «Quién lo generó» y la respuesta que sale de quien la generó. B. Una insignia sobre la pieza: **no cumple `DESIGN.md`** (elemento hermano). C. Solo el color del código: **no cumple `DESIGN.md`** («nunca solo color») | A | Cerrada: A | 26 |
| V22 | El navegador de `tu-laptop` | `Card`, `Tabs`, `Table` | A. Una pestaña con la dirección, la página o el error y la tabla «Lo que recuerda». B. Una ventana flotante sobre el mapa: **no cumple `DESIGN.md`**. C. Dos pestañas, «Navegador» y «Memoria» | A | Cerrada: A (D-24 = A) | 25 |
| V23 | El certificado | `Card`, `Table` | A. Una tabla de campo y valor, con la firma y la clave privada dichas con palabra y marca. B. Aspecto de documento con sello: **no cumple `DESIGN.md`** (variante nueva de `Card` sin justificar). C. Un candado verde en cada certificado válido: **inexacta**, el candado no dice que un sitio sea de fiar (investigación, 4.4) | A | Cerrada: A | 24 |
| V24 | El saludo TLS en la caja | La lista del saludo de tres pasos | A. Una lista numerada con «(cifrado)» después del ServerHello. B. Un diagrama de secuencia: **no cumple `DESIGN.md`** (elemento nuevo). C. Todos los mensajes en claro: **inexacta**, en TLS 1.3 todo después del ServerHello va cifrado (RFC 8446 §1.2) | A | Cerrada: A | 26 |
| V25 | Lo que ve el camino | `Card` y una lista de campo y valor (`kvl` en el prototipo); la Tarea 26 confirma que no es una primitiva nueva | A. Cada campo marcado «se lee» o «cifrado» con una palabra. La ronda de prototipos probó tres disposiciones: A1 (una tabla con una columna por protocolo), A2 (una tarjeta con un grupo por protocolo) y A3 (una fila por paquete). B. Un volcado hexadecimal: no es lenguaje llano. C. Campos tachados solo con color: **no cumple `DESIGN.md`** | A | Cerrada: A2 | 26 |
| V26 | El sello del fallo de TLS | El estado del sello (`StampState`) | A. Reutilizar «Bloqueado»: **inexacta**, nadie descartó el paquete, el cliente lo rechazó. B. Un estado nuevo, «Rechazado por el cliente», con su palabra y su forma. C. Ningún sello | B | Cerrada: B | 27 |
| V27 | Muchas pestañas en una pieza | `Tabs` y una primitiva nueva, la sección que se pliega (excepción justificada en `DESIGN.md`) | A. Todas las pestañas en una fila que se desplaza. B. Agrupadas (servidor: «Sitios y certificados», «Proxy», «Redirección y HSTS»; laptop: «Terminal», «Navegador», «Red y confianza»). C. En dos filas. D. B más tarjetas que se pliegan dentro de cada pestaña. F. Mostrar solo las tarjetas que el incidente nombra | F (recomendada; no elegida) | Cerrada: D | 23 |
| V28 | La terminal de `curl` (D-20) | `Card`, `ChipTray`, `Choice`, `Button` | A. Bandejas apiladas, una por parte de la URL y una de opciones. B. Una franja de URL con las partes en línea y una bandeja de opciones. C. Solo URL completas | B para el 01 y C desde el 02 | Cerrada: B en el 01 y C desde el 02 (D-20 = C) | 22 |

### Respuestas del estudiante a V20 a V28 (2026-10-11)

Las nueve están cerradas.

- **V20 · El mensaje HTTP.** **Decisión del estudiante (2026-10-11):** A. El mensaje HTTP vive en la caja de inspección; el paquete del mapa conserva su forma de TCP y su etiqueta de protocolo y puertos. El estudiante preguntó por qué no A + C. Respuesta: C dibuja HTTP como un paquete propio, y eso es falso, porque el mensaje HTTP viaja dentro de los datos del paquete TCP. Con A + C la caja diría la verdad mientras el mapa enseñaría lo falso.
- **V21 · Quién generó el código.** **Decisión del estudiante (2026-10-11):** A. Un campo «Quién lo generó» en la caja, y el paquete de respuesta sale de la pieza que generó el código. El estudiante preguntó cuál opción era la más rigurosa, visual y entendible. A es la única que cumple las tres: B suma un elemento hermano (rompe `DESIGN.md`) y C usa el color como única señal. Se acepta con su criterio de siempre.
- **V22 · El navegador de `tu-laptop`.** **Decisión del estudiante (2026-10-11):** A. El navegador es una pestaña de la tarjeta de `tu-laptop`, con una tabla «Lo que recuerda». El estudiante preguntó si C («Navegador» y «Memoria» como pestañas aparte) escalaría mejor. Respuesta: no. Lo nuevo que el navegador recuerde pasa a ser filas nuevas de la misma tabla, mientras que C suma una pestaña por cada cosa y empeora el problema de pestañas de V27. Cierra D-24 = A.
- **V23 · El certificado.** **Decisión del estudiante (2026-10-11):** A. Una tabla de campo y valor, con la firma y la clave privada dichas con palabra y marca.
- **V24 · El saludo TLS en la caja.** **Decisión del estudiante (2026-10-11):** A. Una lista numerada con «(cifrado)» después del ServerHello.
- **V25 · Lo que ve el camino.** **Decisión del estudiante (2026-10-11):** A2. Una tarjeta «Lo que ve router-proveedor» con un grupo por protocolo («Por http://», «Por https://»). Cada grupo se parte en «se lee» y «cifrado», con la palabra en el encabezado del grupo y la cuenta («5 datos», «2 datos», «3 datos»). Debajo va una lista de campo y valor: IP y puertos, nombre del sitio, método y path, cabeceras y respuesta del servidor. El valor se muestra solo donde se lee; los campos cifrados muestran solo su nombre. Sin columnas, y sin columna de tamaños ni de momentos. Por qué A2 y no A1: el estudiante preguntó cuál escala mejor. A1 (una tabla, una columna por protocolo) suma datos barato, como filas, pero en un teléfono caben a lo sumo dos o tres casos lado a lado. A2 suma datos como líneas y los casos nuevos (una VPN, otro protocolo) como grupos apilados debajo, sin límite de ancho. El costo: los casos no se comparan lado a lado. A3 (una fila por paquete) es la que peor escala. Nota de diseño: A2 reutiliza `Card` más una lista (en el prototipo, la clase `kvl`). La Tarea 26 debe confirmar que no es una primitiva nueva: si ya existe una primitiva de lista, se reutiliza; si no, se justifica en `DESIGN.md`.
- **V26 · El sello del fallo de TLS.** **Decisión del estudiante (2026-10-11):** B. Un estado nuevo del sello, «Rechazado por el cliente». La forma del prototipo es un cuadrado redondeado con ✕ en tinta. Esa forma es una propuesta del prototipo; la confirma la Tarea 27.
- **V27 · Muchas pestañas en una pieza.** **Decisión del estudiante (2026-10-11):** D, que es B más tarjetas que se pliegan. Las pestañas agrupadas de B se quedan. Dentro de una pestaña, cada tarjeta es una sección que se pliega, con su título y un resumen de una línea cuando está cerrada («2 sitios», «hasta 2026-11-30», «1 línea»). Enter o Espacio la abre y la cierra (patrón acordeón de W3C WAI-ARIA). Cada tarjeta que se suma cuesta una línea de unos 45 px cerrada. Reglas de rigor: (1) la sección que empieza abierta es fija, la primera en un orden fijo por pestaña, y nunca depende del incidente ni de su causa, porque en la guardia (03-17) y en los diagnósticos la sección abierta diría dónde mirar; (2) una sola tarjeta no muestra barra de pestañas; (3) cuatro pestañas por pieza, como máximo: el número es nuestro, no de Nielsen Norman Group, que solo dice «The fewer tabs, the better» (https://www.nngroup.com/articles/tabs-used-right/, leída el 2026-10-11). Por qué D y no F: el plan recomendaba F (mostrar solo las tarjetas que el incidente nombra) y el estudiante prefirió D; D se había presentado como la alternativa para cuando una pestaña pasa de tres tarjetas. Consecuencia de diseño: D suma una primitiva nueva, la sección que se pliega, que el plan decía que este capítulo no sumaría. Es una excepción: se justifica en `DESIGN.md` como una primitiva para toda la familia. Cómo se implementa lo decide la Tarea 23: recomendada, Radix Accordion (misma familia que `@radix-ui/react-tabs`), en una versión exacta publicada hace al menos dos semanas; alternativa, `details` y `summary` nativos si cumplen el patrón acordeón. La Tarea 23 queda desbloqueada.
- **V28 · La terminal de `curl`.** **Decisión del estudiante (2026-10-11):** B en el 01 y C desde el 02. Cierra D-20 = C (mixto): la URL por partes, en una franja, en el 01, y las URL completas desde el 02.
