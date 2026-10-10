# Sigue el paquete · Capítulo 1, plan 3 de 3: enviar paquetes y los cuatro incidentes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer jugable el capítulo 1, «Tu primer día». Llegan:
- la jugada «enviar»: el contrato `send`, la jugada `sendPacket`, las tareas `replied` y `any`, y la estrella «sin pistas»;
- la tarjeta terminal junto al origen;
- los incidentes 01-01 a 01-04 con sus 18 términos;
- la escalera que compara palabras completas, y la regla de progreso nueva.

También cierra F4 a F6, G3 a G5, G7 y G8 del backlog. Lo que el motor calcula para el capítulo 4 no cambia.

**Architecture:**
1. **Motor (Tarea 1).** El esquema rechaza dos dispositivos con la misma IP (F5) y una red con un rango que no es de RFC 1918, también una VPC (F6). Llegan dos acciones de red, `addActor` y `addFirewall`, para que el 01-03 sume la casa de Lucía y el 01-04 el firewall de su laptop.
2. **Progreso (Tarea 2).** `isUnlocked` abre un incidente si es el primero, si el anterior tiene estrellas o si él mismo ya las tiene.
3. **La casa de Lucía (Tarea 3).** Un tipo de actor nuevo, `home`, con su pieza (un cubo de papel con techo) y su ícono en el catálogo. La captura de `#/entidades` se regraba.
4. **El contrato y la sesión (Tarea 4).**
   - El incidente pasa a ser una unión por `mechanic`. Un incidente `send` trae fichas de origen (`endpoint`), de dirección (`address`) y de mensaje (`label`, `icmpType`), tareas con `expect` y una solución de jugadas `sendPacket`. La pregunta de Lucía es un campo opcional, `question`.
   - La sesión guarda en `sent` el último paquete de cada combinación de fichas. Las tareas leen `runs` y `sent`, y `Stars` pasa a `{ closed, middle, explained }`.
   - `officeLeaks` comprueba que ningún flujo ni ninguna combinación de fichas saque un paquete de la oficina.
5. **Escena (Tarea 5).**
   - Cada envío viaja una sola vez y deja su sello.
   - El sello le dice su estado al lector de pantalla (G8).
   - Solo un firewall bloquea; lo demás se dibuja perdido (G3).
   - Un paquete no cruza el borde si el borde no se dibuja (G4).
   - Dos grupos de sellos que se acercan se unen (G5).
   - La tarjeta se puede anclar a cualquier pieza.
6. **Vista del juego (Tarea 6).**
   - `terminalCard` y `terminalLine`: la terminal de cada origen.
   - Las piezas de origen abren su terminal y no llevan candado.
   - La caja inspecciona los paquetes enviados y suma el campo «Mensaje».
   - No se inspecciona el borde ni internet mientras no se dibujan (G7).
7. **Interfaz (Tarea 7).** La tarjeta de reglas y la terminal comparten el marco (`ChipCard`) y la bandeja (`ChipTray`) en `src/ui/incident/map-cards/`.
8. **Contenido (Tareas 8 y 9).**
   - Los cuatro incidentes y sus 18 términos.
   - Los nombres de la oficina y las etiquetas de sus piezas por término.
   - Los textos por tipo de red y de firewall (F4).
   - Las reglas que se abren por tipo de firewall.
9. **Playwright (Tarea 10) y documentos (Tarea 11).**

**Tech Stack:** Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, Vitest 5.0.3, Testing Library + user-event y Playwright 1.64, todo con pnpm 11.3.0. Sin dependencias nuevas.

**Spec:** `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`. Mandan estas secciones:
- «Capítulo 1 · Introducción: Tu primer día»: Mundo, Cómo envías un paquete e Incidentes;
- «Mecánica `send`»: Contrato, Sesión e Interfaz;
- «Escalera de términos»;
- «Progreso y desbloqueo»;
- «Entrega» (punto 3), «Tests y validación» y «Riesgos».

Otros documentos:
- **Planes anteriores, ya implementados:** `docs/plans/2026-10-09-follow-the-packet-generic-model.md` y `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`.
- **Pendientes que cierra:** F4, F5, F6, G3, G4, G5, G7 y G8 de `docs/plans/2026-10-08-follow-the-packet-followups.md`.

Donde el código y los planes viejos difieren, manda el código.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` (raíz del repo). Todos los comandos se corren desde `projects/follow-the-packet/`.
- **Rama.** `feat/live-incidents`. No se crea otra.
- **Punto de partida verificado (2026-10-09).** El punto de partida es el commit `58c548e`, el que pasa el proyecto a pnpm, sobre `d9db379`. Con él, `pnpm test` pasa entero con **524 tests en 44 archivos**, y `pnpm check` también: 14 tests de Playwright y 0 clones.
- **Tests al cerrar cada tarea:**

  | Tarea | Vitest | Playwright |
  |-------|--------|------------|
  | 1 | 529 tests en 44 archivos | 14 |
  | 2 | 530 en 44 | 14 |
  | 3 | 531 en 44 | 14 (captura regrabada) |
  | 4 | 554 en 44 | 14 |
  | 5 | 559 en 44 | 14 |
  | 6 | 569 en 45 | 14 |
  | 7 | 579 en 46 | 14 |
  | 8 | 623 en 46 | 14 |
  | 9 | 662 en 46 | 14 |
  | 10 | 662 en 46 | 17 |
  | 11 | 662 en 46 | 17 |

  Estos son los números del ensayo. Los reales, con los ajustes de la revisión, son otros: 701 tests en 48 archivos y 20 de Playwright al cerrar la Tarea 11, y 712 en 48 y 21 con el commit de la revisión final. Están en «Ajustes de la revisión (2026-10-09)» y en «Revisión final (2026-10-09)».

- **Plan ensayado (Tareas 1 a 11).**
  - Las tareas se implementaron en orden sobre una copia limpia de `58c548e` (`git archive` y `pnpm install --frozen-lockfile --offline`), con un commit por tarea.
  - Los bloques de código de este documento salen de esos commits. Se volvieron a aplicar, tal cual y tarea por tarea, sobre una segunda copia limpia.
  - Al cerrar cada tarea pasan `tsc`, ESLint, la estructura, jscpd, Vitest y Playwright con los números de arriba, y `golden-traces.json` no cambia.
  - Los fallos esperados del paso «Verlos fallar» también salen del ensayo: los tests de la tarea, aplicados solos sobre la tarea anterior.
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: capas `app → ui → game · scene · storage → levels → copy → engine`, barrels, alias `@/` y nada de `../`. Tope de 12 archivos por carpeta (sin contar `CLAUDE.md`). `src/levels/` ya tiene 12, así que el contrato `send` vive en `incident.ts` y sus fichas en `chips.ts`. Las tarjetas del mapa pasan a `src/ui/incident/map-cards/` (Desviación 18).
  - `view-renders-domain-result`: el estado de un paquete enviado (llegó, volvió, lo frenó un firewall, intruso) llega calculado desde `game`.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. Texto visible en español solo en `src/copy/` y en los archivos de incidente.
  - `no-raw-effects`: los relojes de los paquetes viven en `use-packet-runs.ts`.
  - `dry`: jscpd con umbral 0 (`pnpm dup`). Por eso existen `ChipCard`, `PING_TO_LUCIA`, `closing.ts` y `map-boxes.ts`.
  - `user-event-for-interactions`: los tests de interacción usan `userEvent.setup()` y esperan cada llamada.
  - `rigorous-plain-copy`: cada término se define donde aparece y se introduce en el incidente que lo necesita; nombre oficial donde hay término.
  - `caller-controls-visibility`: la pantalla decide qué tarjeta se abre; ninguna tarjeta decide si se dibuja.
  - Un elemento de interfaz, un estándar: ver «Elementos de interfaz».
- **El motor no cambia lo que calcula para el capítulo 4.** `src/levels/04-iaas/golden-traces.json` no se edita nunca: están prohibidos `vitest -u`, `--update` y editarlo a mano. Cada tarea lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Si el test dorado falla, se corrige el código.
- **Cambios visibles del capítulo 4.** Es lo que ve quien juega el 04-01 y el 04-02. La lista sale de `git diff 614d6a3 -- projects/follow-the-packet/src/copy`, contra el árbol final.
  - **Pedidos por el spec:**
    - El capítulo 1 va antes: el 04-01 se abre con una estrella en el 01-04, o con las suyas.
    - El glosario del 04-01 y el 04-02 trae los términos del capítulo 1. Ping, ICMP, Echo Request, Echo Reply e IP privada tienen su definición nueva.
    - La etiqueta «internet» es un término y su caja empieza por «Qué es».
    - La caja de un paquete ICMP suma «Mensaje».
    - El sello dice su estado al lector de pantalla.
  - **Sumados por la revisión** (ver «Ajustes de la revisión (2026-10-09)»):
    - La caja de internet dice «Lleva cada paquete de una red a otra.», con «paquete» y «red» como términos (`internetDoes`, Tarea 9).
    - El texto del motivo `route-no-device` lleva sus términos (Tarea 8). Los trazados dorados del 04-01 y el 04-02 no llegan a ese motivo, así que ahí hoy no se ve.
    - El aviso de un incidente bloqueado dice «termina antes el incidente anterior» (Tarea 2, ajuste 10).
    - Junto a la ayuda de inspección (cuando no hay nada inspeccionado) hay una leyenda de los sellos y del candado (Tarea 7, ajuste 6).
- **Scripts de edición.** Los cambios en archivos que ya existen llegan como scripts de Python 3 que se pegan tal cual en la terminal (`python3 - <<'EOF' … EOF`).
  - Cada reemplazo exige encontrar exactamente una vez el texto viejo. Si no, el script se detiene con `expected 1 match`: el árbol no es el que el plan supone. Se para y se avisa, sin arreglar a mano.
  - Un archivo nuevo, o uno que cambia casi entero, llega como «Contenido completo de `ruta`»: se escribe tal cual, creando su carpeta si no existe.
- **"Listo"** = `pnpm check` pasa entero: tipos, lint, estructura, jscpd, Vitest y Playwright. Cada tarea termina con `pnpm check` en verde. Si Playwright no encuentra Chromium: `pnpm exec playwright install chromium`.
- **Commits.** Un commit por tarea, con `git add` de las rutas que la tarea lista. Nunca se agrega `labs/03-ping-connectivity/`. Los cambios de este plan sobre sí mismo (esta nota y «Ajustes de la revisión») van en el commit de la Tarea 11.
- **Captura.** Solo la Tarea 3 cambia cómo se ve una entidad (la casa de Lucía). Regraba `tests/e2e/snapshots/entities-darwin.png` con `pnpm exec playwright test entities --update-snapshots=all` y la commitea. Ninguna otra tarea la toca.
- **Servidores.** No se arranca `pnpm dev` ni nada en los puertos 5173 y 5180: ahí corre el servidor del estudiante. Playwright levanta su propio servidor en el 4183.
- **Ningún comando `aws`.**
- **Plan del design system.** Si el plan del design system (botón, fichas, tarjeta y etiquetas compartidos) se ejecuta antes que este, este plan se rebasa sobre él. Lo que toca la interfaz está aislado:
  - la Tarea 5 (escena: sellos y tráfico) y la Tarea 7 (las tarjetas);
  - la Tarea 4 toca `ui/` solo donde el tipo la obliga: `Stars.middle`, `taskHolds` con `sent`, las fichas de un incidente `filter` y la pregunta;
  - la Tarea 9 toca una línea de `task-card.tsx` (`card.empty`).

## Los nombres de la oficina: nombre, artículo y etiqueta

El riesgo «Nombres dentro de los motivos» del spec pide que una frase armada por el juego se lea bien: «el firewall de la laptop de Lucía», no «de laptop de Lucía». La decisión (Desviación 1):

- **Qué nombre lleva cada dispositivo.** Su nombre de equipo (hostname), como el `Name` de una instancia EC2: `tu-laptop`, `laptop-lucia` e `impresora`. Es un nombre propio sin artículo.
- **Los textos que arma el juego** lo marcan con `nameTag` y no le ponen artículo. Así se leen igual que en el capítulo 4 («el Security Group de servidor2»).
- **Los textos escritos a mano del incidente** (Lucía, tareas, pistas y pregunta) hablan en español llano, «la laptop de Lucía», y no se marcan.
- **La casa de Lucía es un personaje**, como «Atacante»: se llama «Casa de Lucía».

| Dónde | Cómo se lee (las cajitas son la etiqueta de nombre) |
|-------|------------------------------------------------------|
| Etiqueta del mapa | [tu-laptop] · [laptop-lucia] · [impresora] · firewall [laptop-lucia] · router · internet · [Casa de Lucía] |
| Motivo (caja de inspección) | «Se queda en el firewall de [laptop-lucia]: ninguna regla lo deja entrar.» |
| Respuesta | «La respuesta vuelve sola: el firewall de [laptop-lucia] recuerda la conversación.» |
| Título del paquete | «ping de [tu-laptop] a [impresora]» · «Echo Reply de [tu-laptop] a [laptop-lucia]» · «ping de [Casa de Lucía] a 192.168.1.10» |
| Terminal | «Terminal de [tu-laptop]» · fichas de origen [tu-laptop] y [Casa de Lucía] |
| Ficha Source del 01-04 | «[tu-laptop] (IP 192.168.1.10)» · «[impresora] (IP 192.168.1.20)» |
| Texto de Lucía | «Hazme ping otra vez: ya no me llega.» · «Que la laptop de Lucía conteste tu Echo Request.» (sin marca) |

**Descartado:**
- **Nombres con artículo** («la impresora»): la etiqueta del mapa diría «la impresora», y una frase que empieza con el nombre («[la impresora] contesta») empezaría en minúscula.
- **Un artículo por dispositivo**, guardado en el modelo o en una tabla de `copy` por id: pondría gramática española en el motor o ataría `copy` a los ids de un capítulo.

## Elementos de interfaz

Regla del estudiante: un estándar por elemento. Antes de crear algo se reutiliza el componente, la clase y los tokens que ya existen. Ningún color, tamaño de letra ni espacio nuevo se escribe a mano.

| Elemento | Componente | Reutiliza | Nuevo, y por qué |
|----------|------------|-----------|------------------|
| Tarjeta junto a una pieza (reglas y terminal) | `ChipCard` (`src/ui/incident/map-cards/chip-card.tsx`) | `.card`; el diálogo, el título con foco, Esc y «Listo» de la tarjeta de tarea; `useFocusOnMount` | Nada de aspecto: el marco sale de `TaskCard` para que lo usen las dos tarjetas. La clase `.task-card` pasa a llamarse `.chip-card`, con los mismos valores |
| Bandeja de fichas (Type, Source, Origen, Destino, Mensaje) | `ChipTray` (mismo archivo) | `.tray`, `.tray__name`, `.chip`, `aria-pressed` | Nada: se muda de `task-card.tsx` |
| Línea de la terminal | `TerminalCard` | `.slot` (la ranura punteada de la regla nueva), `.slot__empty`, `code` (`--font-mono`) | Nada. No hay pantalla negra de terminal: sería un elemento nuevo |
| Botón «Enviar» | `TerminalCard` | `.btn .btn--primary` *(superado por el ajuste 8: queda un `.btn` normal)* | El estado `.btn:disabled` del botón compartido, solo con tokens (`--ink-soft`, `--paper-shade`): hoy ningún botón se desactiva, y «Enviar» espera una ficha de cada bandeja |
| Botón «Listo» | `ChipCard` | `.btn` | Nada |
| Etiquetas del mapa (tu-laptop, Casa de Lucía, firewall, router, internet) | `PieceLabel` | `.map-button`, `.map-button--name`, `.name-tag`, candado en tinta | Nada |
| Alfombra del origen elegido | `DevicePiece` (`selected`) | La alfombra del plan 2 | Nada: es la de la tarjeta abierta |
| Pieza e ícono de la casa | `ActorPiece`, `ActorIcon` | `InkBox`, `InkIcon`, `INK`, `PAPER_FILL`, `PAPER_SHADE` | La variante `home` del actor: un techo de dos aguas |
| Sellos | `StampPiece` | `.stamp--arrived`, `--blocked`, `--lost`, `--intruder` | Solo el `aria-label` |
| Pregunta de Lucía | `ExplanationCard` | El `h2` y `TaggedText` | Nada |
| Estrellas del resultado | `ResultCard` | La lista de hoy | El texto de la estrella del medio según la mecánica |
| Caja de inspección | `InspectionBox` | `dt` y `dd` | El campo «Mensaje» (copy) |
| Roadmap | `Roadmap` | `.chapter`, `.level-item`, `Stars` | Nada |

Divergencias: ninguna de aspecto. Hay dos cambios en piezas compartidas: el nombre `.task-card` → `.chip-card` y el estado `.btn:disabled`. Ambos están en la Tarea 7.

## El capítulo 1 en el juego

Los textos finales, que el spec dejó para este plan, están completos en las Tareas 8 y 9. El resumen:

| # | Título | Mecánica | Bandejas que se ven | Términos nuevos | Tareas | Pregunta de Lucía |
|---|--------|----------|---------------------|-----------------|--------|-------------------|
| 01-01 | La dirección | `send` | Destino (.20, .11, .30) | dispositivo, red, dirección IP, IPv4, paquete, ping | Que tu ping a la impresora vuelva con respuesta | ¿Cómo supo la red a quién entregar tu paquete? |
| 01-02 | Ida y vuelta | `send` | Destino (.11, .20), Mensaje (Echo Request, Echo Reply) | protocolo, solicitud, respuesta, ICMP, Echo Request, Echo Reply | Que la laptop de Lucía conteste tu Echo Request | Si me envías un Echo Reply, ¿por qué no vuelve nada? |
| 01-03 | Desde afuera | `send` | Origen (tu-laptop, Casa de Lucía), Destino (.10, .11, .20), Mensaje | internet, router, IP privada | Experimento: desde la casa de Lucía, ping a tu laptop (`any`). Contraste: desde tu laptop, ping a la laptop de Lucía (`replied`) | ¿Por qué no llegó el ping desde mi casa? |
| 01-04 | El firewall | `filter` | Type (Echo Request, Echo Reply), Source (tu-laptop, impresora) | firewall, tráfico, regla | Que tu ping a la laptop de Lucía vuelva con respuesta | ¿Qué hizo el firewall con tu primer ping? |

- **El mundo:** la oficina `192.168.1.0/24` con `tu-laptop` (.10), `laptop-lucia` (.11) e `impresora` (.20), detrás de un router. La casa de Lucía (`198.51.100.24`, oculta hasta la IP pública) llega en el 01-03. El firewall de la laptop de Lucía llega en el 01-04: sin reglas de entrada y con toda la salida permitida.
- **Las respuestas correctas** cambian de lugar (1.ª, 3.ª, 2.ª y 2.ª) para que no se adivinen.

## Desviaciones del spec y decisiones (para revisar antes de ejecutar)

1. **Nombres, artículo y etiqueta.** Ver la sección «Los nombres de la oficina». Los dispositivos se llaman por su nombre de equipo (`tu-laptop`, `laptop-lucia`, `impresora`): los textos armados dicen «el firewall de [laptop-lucia]», no «el firewall de la laptop de Lucía».
2. **El aspecto de la tarjeta terminal.** Es la misma tarjeta de papel que la de reglas, con su marco:
   - el título «Terminal de [tu-laptop]»;
   - la línea en la ranura punteada, en letra de código: `ping 192.168.1.20`, sin `$` delante para que se lea como se escribe;
   - las bandejas Origen, Destino y Mensaje, cada una solo si ofrece más de una ficha;
   - «Enviar», desactivado hasta tener una ficha de cada bandeja, y «Listo».

   No hay pantalla negra de terminal (regla de un estándar por elemento).
3. **La tarjeta tapa piezas (E4).** *Superada por el ajuste 1 de «Ajustes de la revisión (2026-10-09)»: la terminal ya no tapa la impresora en el 01-01. Lo que sigue es lo que decía el plan.*
   - En el 01-01, la terminal de tu laptop se abre a la derecha y tapa la impresora, cuya IP hay que leer.
   - Es la regla de hoy de `CardAnchor` (el lado con más espacio en la pantalla), que ya tapa servidor1 en el 04-01 (E4).
   - Este plan no la cambia, porque el plan del design system revisará las tarjetas. Mientras: la pista 1 dice que se pase el mouse sobre la impresora, la tarjeta se cierra con «Listo» o Esc, y la Tarea 11 lo anota en E4.
4. **Una bandeja con una sola ficha es fija.** No se muestra y su ficha va siempre (`TerminalCard.fixed`). Así cada incidente muestra solo las bandejas que necesita, sin un campo más en el contrato.
5. **Las fichas de origen y de destino no traen texto.**
   - La ficha de origen trae su `endpoint` y se nombra con el nombre del mundo (`endpointName`, marcado).
   - La de destino trae su `address` y se muestra tal cual: en el 01-01 hay que buscar la IP de la impresora.
   - Solo las de mensaje traen `label`.
   - La prueba «cada ficha nombra un término» mira Type, Source y Mensaje (`chipLabels`).
6. **La pregunta de Lucía es un campo opcional, `question`.** El spec da una pregunta por incidente, y la tarjeta decía siempre «¿Qué pasó?». Sin el campo (capítulo 4), sigue esa.
7. **«Esa es mi laptop».** Lucía no reacciona a cada envío. El sello ✓ en su laptop y la tarea pendiente muestran que no era la impresora, y la pista 1 lleva a ella. Una reacción por ficha pediría otro campo del contrato.
8. **«Nada sale de la oficina» es una comprobación por incidente, no una regla del esquema.** El esquema no conoce el mundo de un incidente que solo trae cambios. Por eso `officeLeaks(incident, world)` vive en `src/levels/chips.ts`, y el test del registro la corre sobre el mundo de inicio de cada incidente. El esquema sí comprueba lo que no necesita el mundo:
   - que cada `expect` y cada `sendPacket` usen fichas ofrecidas;
   - que los flujos sean `ambient`;
   - que el mensaje sea tipo 8 o 0.
9. **La regla de progreso, literal.** «El anterior» es el inmediato. Cambia el test que pedía estrellas en todo lo anterior.
10. **Lo que muestra la caja de un paquete.**
    - **Origen y destino:** ya van en el título («ping de [tu-laptop] a [impresora]»).
    - **«Mensaje»:** el campo nuevo (`ICMP · Echo Request`). Aparece cuando se conoce `echo-request`, también en el capítulo 4.
    - **«Qué es» antes del 01-02:** define el paquete como «paquete».
    - **La IP de un dispositivo:** se llama «dirección IP» hasta que llega «IP privada» (01-03). En el 01-01 hay que poder leerla.
11. **Términos que nombran varias variantes.**
    - `device` nombra la laptop y la impresora; su ícono es la laptop.
    - `packet` nombra todo paquete; su ícono es el Echo Request.
    - El test de íconos acepta los dos casos.
12. **Las etiquetas de la oficina, con su término.** `firewall [laptop-lucia]`, `router` e `internet` pasan a `{{firewall}}`, `{{router}}` y `{{internet}}`. Por eso el capítulo 4 también muestra «internet» como término, y su caja empieza por «Qué es».
13. **Textos por tipo (F4).**
    - `route-private` en una oficina: «Viaja por dentro de la red de la oficina.»
    - La respuesta, según el firewall del destino: con Security Group, el texto de hoy (stateful); con el firewall de la laptop, «el firewall de [x] recuerda la conversación»; sin firewall, «La respuesta vuelve por el mismo camino.»
    - La tarjeta de reglas sin reglas dice «No tiene reglas de entrada» con el término `rule` en una oficina. El texto llega calculado en `FirewallCard.empty`. *El ajuste 12 lo cambió para el firewall de la laptop: dice «No tiene reglas: no deja entrar nada.», sin «de entrada». El Security Group conserva «reglas de entrada».*
14. **Reglas por tipo de firewall.** `ConfigurableParts.inboundRules` pasa a `Record<FirewallKind, boolean>`. Se abren con un término cada una: las de `host-firewall` con `rule` (01-04) y las de `security-group` con `inbound-rule` (04-01).
15. **Solo un firewall bloquea (G3).**
    - Cada paquete calculado trae `blocked` (un paso de firewall con `drop`) e `intruder` (un flujo prohibido); `lost` se va.
    - Un paquete que no llega a ningún dispositivo y que ningún firewall frenó se dibuja perdido. Eso incluye un `timeout` de ruta y un nombre que no resuelve.
16. **Los sellos se separan por grupos que se unen (G5).** Si los sellos ya repartidos de dos grupos quedan a menos de 1 unidad, los grupos se unen y se reparten juntos. Así ningún par queda a menos de 0.8.
17. **El nombre del sello (G8).** El sello se lee así: «Paquete: ping de tu-laptop a impresora. Llegó.» (`stampLabel`). `StampState` se muda a `copy`, porque `copy` nombra cada estado.
18. **Archivos por carpeta.** Con la terminal y la bandeja compartida, `src/ui/incident/` llegaría a 13 archivos. Por eso la tarjeta de reglas y la terminal se mudan a `src/ui/incident/map-cards/` (5 archivos y su `CLAUDE.md`).
19. **El concepto citado.** Los cuatro incidentes citan la lección del lab 03 y `concepts/security-groups.md`: el repo no tiene una nota de redes básicas.
20. **La excepción de la prueba de fugas.** La definición de ICMP dice «Internet» (su nombre oficial) antes del 01-03. Es la única fuga declarada (`DECLARED_LEAKS`), y un test exige que ICMP llegue antes que `internet`.
21. **La casa de Lucía sigue en el 01-04.** El mundo crece: el router e internet también se ven en el 01-04.
22. **Las pruebas de Playwright del capítulo 4** abren con el capítulo 1 hecho (`CHAPTER_1_DONE`, guardado solo si no hay progreso). Así una recarga conserva lo que la prueba ganó.
23. **La tarjeta se ancla a cualquier pieza.** `cardAnchorPosition` recibe la pieza (dispositivo, firewall o actor), no un id de dispositivo: la terminal de la casa de Lucía se abre junto a la casa.

## Review Focus

1. **Los nombres dentro de las frases** (Desviación 1). Tests:
   - Tarea 9: `an office names its own network and its own firewalls, not the VPC nor a Security Group`;
   - Tarea 6: `a packet the player sent is inspected like a flow`.
2. **La terminal que ya no tapa la impresora en el 01-01** (Desviación 3, superada por el ajuste 1). Tests:
   - Playwright, `chapter-1.spec.ts`: `in 01-01 the open terminal covers neither the printer, nor its stamp, nor the laptop of Lucía`;
   - `src/scene/layout.test.ts`: los de `terminalSide`. En el 01-03 ningún lado queda libre: la terminal se acopla en la esquina inferior izquierda del mapa (`no side is clear, so the terminal docks in the bottom left corner of the map`, con los dos orígenes y las dos ventanas), y no tapa etiquetas ni sellos (`the docked terminal covers no label and no possible stamp`).
   - Playwright, `chapter-1.spec.ts`: `in 01-03 the open terminal covers neither the lost ping, nor the router, nor the internet, for any origin`. Lo suma la revisión final.
3. **04-01 abierto con estrellas guardadas.** Test: Tarea 10, `04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it`.
4. **Perdido no es bloqueado** (G3). Test: Tarea 5, `a packet that reaches no device and that no firewall stopped is lost, not blocked`. El atacante del 04-01 sigue bloqueado: lo fija el test dorado.
5. **La escalera.** Tests: Tarea 8, `finds a term in a definition by whole words, ignoring case`, y la prueba de fugas por incidente. Tarea 9: `the official name of ICMP says Internet before the term internet arrives: the one declared leak`.

## Ajustes de la revisión (2026-10-09)

Mientras se ejecutaba el plan, el estudiante aprobó 13 ajustes. Donde contradicen el texto de este documento, mandan ellos. Los bloques de código de las tareas son los del ensayo y no se reescribieron: manda el árbol final.

Cada ajuste dice qué cambió y en qué commit. «Este commit» es el de la Tarea 11, que también agrega este plan.

1. **La terminal no tapa su destino.**
   - La regla `terminalSide` de `src/scene/layout.ts` abre la terminal en el lado que queda dentro del mapa y no tapa la etiqueta de otra pieza.
   - Las tarjetas de un origen se abren a 68 px de su pieza.
   - En el 01-03 ningún lado queda libre. La revisión final acopla ahí la terminal en la esquina inferior izquierda del mapa (`dockOffset` en `src/scene/layout.ts`): a 1440×900 o más (medido hasta 1920×1080) no tapa ninguna etiqueta ni ningún sello. A 1280×800 y a 1366×768 la de Casa de Lucía, más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo». Antes, la terminal volvía al lado con más espacio y tapaba el sello, las etiquetas `router` e `internet` y la de Casa de Lucía.
   - Cambia la Desviación 3.
   - La regla: `9acb697`. Se comprobó en el 01-01 real, a 1280×800 y a 1440×900, y no hizo falta cambiar nada: `93f23a9`. La prueba de Playwright: `1b5010f`.
2. **G3 y G8 con datos reales.**
   - `src/ui/incident/stamp-states.test.ts` pasa paquetes reales por el juego hasta el sello. Vive en `ui` porque ESLint no deja que `scene` importe `game`: `36423f0`.
   - Playwright comprueba «Perdido.» y «Bloqueado.»: `1b5010f`.
3. **El capítulo 1 en `src/game/incidents.test.ts`.** Un bloque con los incidentes reales. El 01-01 y el 01-02: `93f23a9`. El 01-04: `1495dfa`.
4. **`useSendOnce` tiene su test** (`src/scene/traffic/use-packet-runs.test.ts`): `36423f0`.
5. **La prueba humana pasa a `siguiente`.** En la hoja de ruta, la fila «Prueba humana del capítulo 1» deja de ser `idea`. Lleva la decisión pendiente del «primer día lento»: si algún incidente se fusiona. Este commit.
6. **La leyenda de los sellos y del candado.** Está junto a la ayuda de inspección (cuando no hay nada inspeccionado) y desaparece mientras se inspecciona una pieza (`SCREEN_TEXT.stampLegend`): `9acb697`.
7. **La tarjeta de reglas vacía del firewall de la laptop** tiene su test: `firewallCard(…, 'fw-lucia').empty`. `1495dfa`.
8. **«Enviar» es un `.btn` normal.** El plan decía `.btn .btn--primary`: `9acb697`. Cambiado por el estudiante (2026-10-10): «Enviar» es `primary`, como «Enviar solución».
9. **Dos textos de Lucía que no eran ciertos.**
   - La pista 1 del 01-02 hablaba de todo ICMP; ahora habla solo del ping: `93f23a9`.
   - El reporte del 01-04 dice que el firewall está en «mi laptop», no en todas: `1495dfa`.
10. **El aviso de un incidente bloqueado nombra el anterior:** «termina antes el incidente anterior» (`d726ba9`). La lista de cambios visibles del capítulo 4 de este plan se corrigió en este commit.
11. **`namedTerms` entiende plurales** («redes», «reglas»): `93f23a9`. Ninguna definición tuvo que cambiar.
12. **Sin «de entrada» en el firewall de la laptop.**
    - Su etiqueta dice «Reglas»; la tarjeta vacía, «No tiene reglas: no deja entrar nada.»; la ranura, «Regla nueva».
    - Cambia el texto «No tiene reglas de entrada» de la Desviación 13 para ese firewall. El Security Group no cambia.
    - `1495dfa`.
13. **Detalles de la revisión.**
    - La convención de la etiqueta «Casa de Lucía» se comprobó y ya la cumplía: `06cec68`.
    - `packetMessage` en lugar de `icmpType === 8`, y `Chip` y `SendTray` ya no se exportan: `33b79be`.
    - `tests/e2e/saved-progress.ts` importa `PROGRESS_KEY` de `src/storage/progress.ts`: `93f23a9`.
    - Se quitaron de este documento las citas de las capturas temporales del ensayo: este commit.

Quedó como lo decía el plan, por decisión del estudiante:
- Los dispositivos se llaman por su nombre de equipo: `tu-laptop`, `laptop-lucia` e `impresora`.
- Los textos que arma el juego los marcan con `nameTag`.
- Lucía dice «mi laptop», sin marca.

Otras dos decisiones:
- Un test fija la diferencia entre `replied` y `any`: `21ca3ff`.
- `src/copy/CLAUDE.md` y `RULES_TERM['host-firewall'] = 'rule'` se corrigieron en `1495dfa`.

### Qué texto de este documento ya no vale

- La Desviación 3 (la terminal tapa la impresora): la supera el ajuste 1.
- Del «Review Focus», el punto 2 se reescribió por lo mismo.
- Del ajuste 1, lo que decía del 01-03 («puede que ningún lado quede libre: entonces vuelve a la regla de antes»): lo supera la revisión final.
- La pista 2 del 01-03 que trae la Tarea 9 no dice que la terminal se cierra con «Listo»: la revisión final lo suma.
- La Desviación 13, en «No tiene reglas de entrada» del firewall de la laptop: la supera el ajuste 12.
- La fila «Enviar» de «Elementos de interfaz»: la supera el ajuste 8.
- «Ningún otro texto del capítulo 4 cambia» no era cierto. Se quitó y la lista se completó.
- Los números de tests del plan son los del ensayo. Los reales están en la tabla de abajo.

### Tests reales al cerrar cada tarea

Vitest (tests en archivos) y Playwright. La tabla de «Global Constraints» queda con los números del ensayo.

| Tarea | Commit | Vitest | Playwright |
|-------|--------|--------|------------|
| 1 | `20bc9be` | 529 en 44 | 14 |
| 2 | `d726ba9` | 531 en 44 | 14 |
| 3 | `06cec68` | 532 en 44 | 14 |
| 4 | `21ca3ff` | 556 en 44 | 14 |
| 5 | `36423f0` | 570 en 46 | 14 |
| 6 | `33b79be` | 580 en 47 | 14 |
| 7 | `9acb697` | 603 en 48 | 14 |
| 8 | `93f23a9` | 653 en 48 | 14 |
| 9 | `1495dfa` | 701 en 48 | 14 |
| 10 | `1b5010f` | 701 en 48 | 20 |
| 11 | este commit | 701 en 48 | 20 |
| Revisión final | el commit de la revisión final | 712 en 48 | 21 |

## Revisión final (2026-10-09)

La revisión de toda la rama encontró lo siguiente. Lo arregla un solo commit, el commit de la revisión final, sobre la Tarea 11.

- **I1: la terminal tapaba el resultado del experimento del 01-03.**
  - Con el exterior dibujado, ningún lado de la terminal queda libre, y el sello del ping perdido quedaba bajo la tarjeta.
  - Ahora la terminal se acopla en la esquina inferior izquierda del mapa (`terminalSide` y `dockOffset` en `src/scene/layout.ts`). Cuelga de su borde de abajo, así que su altura no importa.
  - Al cambiar de origen o mover el mapa, la terminal acoplada no se mueve de su sitio: el desplazamiento se escribe en el mismo cuadro en que drei mueve el ancla, y no pasa por el estado de React (un estado la mostraba desplazada durante un cuadro).
  - El 01-01, el 01-02 y la tarjeta del firewall del 04-01 quedan como antes.
  - La regla cuenta también la etiqueta de la propia pieza: la de la casa cuelga a su izquierda, y a 1920×1080 la terminal la tapaba.
  - A 1440×900, a 1512×982 y a 1920×1080 no tapa nada, con cualquiera de los dos orígenes. A 1280×800 y a 1366×768 queda libre con tu-laptop. La de Casa de Lucía, más alta porque su título ocupa dos líneas, aún tapa la parte de abajo del sello perdido, y la pista 2 dice que se cierra con «Listo».
  - Playwright comprueba que, con la terminal abierta tras cada envío, no tapa el sello perdido ni las etiquetas `router` e `internet`.
- **I2: una ficha elegida con etiqueta de nombre no se leía.** La etiqueta conservaba su fondo claro bajo el color claro de la ficha. Una regla nueva, solo con tokens, la deja transparente y con borde del color de la ficha.
- **m2: la hoja de ruta.** El plan 2 está hecho: sus filas pasan a «Hecho». El backlog anota que G6 está hecho (`6e5630d`).
- **Las pruebas de la Tarea 10.** Se comprueba que la terminal del 01-01 es visible antes de medirla, se espera el sello perdido antes de buscar superposiciones, y el sello del 01-04 nombra `laptop-lucia`.
- **Guías y backlog.**
  - Se corrigieron la guía de `src/levels/` (qué hace `chips.ts`) y el comentario de `namedTerms` (solo el final del nombre completo toma el plural).
  - El backlog dice que los textos nuevos de F4 aún no se dibujan, y que E4 ya no alcanza a la terminal.
  - El backlog suma el bloque H (H1 a H3).

## Árbol al terminar (solo lo nuevo o cambiado)

```
README.md
src/engine/        index.ts  network/{CLAUDE.md,actions.ts,actions.test.ts,schema.ts,schema.test.ts}
src/storage/       CLAUDE.md progress.ts progress.test.ts
src/copy/          CLAUDE.md index.ts incident-ui.ts packet-labels.ts packet-labels.test.ts reasons.ts reasons.test.ts term-text.test.ts terms.ts terms.test.ts ui.ts
src/levels/        CLAUDE.md chips.ts incident.ts incident.test.ts index.ts ladder.ts ladder.test.ts registry.test.ts world.ts
│   01-first-day/  (nuevo) CLAUDE.md shared.ts 01-the-address.ts 02-there-and-back.ts 03-from-outside.ts 04-the-firewall.ts
│   04-iaas/       01-the-first-ping.ts 02-open-just-enough.ts golden-traces.test.ts
src/game/          CLAUDE.md flow-runs.ts incidents.test.ts index.ts session.ts session.test.ts stars.ts stars.test.ts tasks.ts tasks.test.ts
│   view/          CLAUDE.md firewall-card.ts inspection.ts inspection.test.ts ladder.test.ts pieces.ts pieces.test.ts terminal-card.ts (nuevo) terminal-card.test.ts (nuevo)
src/scene/         game-scene.tsx layout.ts layout.test.ts
│   catalog/       catalog-cells.tsx
│   entities/      CLAUDE.md actor.tsx entity-icon.test.tsx index.ts stamp.tsx
│   traffic/       CLAUDE.md flow-look.ts flow-look.test.ts flow-traffic.tsx traffic.tsx use-packet-runs.ts
src/testing/       CLAUDE.md index.ts incidents.ts (nuevo)
src/ui/            catalog/entities-page.test.tsx
│   incident/      CLAUDE.md explanation-card.tsx incident-screen.tsx incident-screen.test.tsx lucia-card.tsx lucia-card.test.tsx result-card.tsx
│   incident/map-cards/ (nuevo) CLAUDE.md chip-card.tsx task-card.tsx (antes en incident/) task-card.test.tsx (antes en incident/) terminal-card.tsx terminal-card.test.tsx
src/styles.css
tests/e2e/         CLAUDE.md incidents.spec.ts roadmap.spec.ts chapter-1.spec.ts (nuevo) closing.ts (nuevo) map-boxes.ts (nuevo) saved-progress.ts (nuevo)
│   snapshots/     entities-darwin.png
docs/plans/2026-10-08-follow-the-packet-followups.md  docs/plans/follow-the-packet-roadmap.md  docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md
```

---

### Task 1: El esquema y las acciones de red (F5, F6)

El esquema exige dos cosas nuevas:
- **F5:** cada dispositivo tiene su propia IP privada.
- **F6:** toda red, también una VPC, usa un rango de RFC 1918. Hoy solo lo exige en una oficina.

Llegan dos acciones de red, que los incidentes 01-03 y 01-04 usan en sus `changes`:
- `addActor` suma un actor en internet;
- `addFirewall` suma un firewall y lo pone en su dispositivo.

Nada del capítulo 4 cambia: su VPC (`172.31.0.0/16`) es privada y sus IPs no se repiten.

**Files:**
- Modify: `src/engine/network/schema.ts`, `src/engine/network/actions.ts`, `src/engine/network/CLAUDE.md`
- Test: `src/engine/network/schema.test.ts`, `src/engine/network/actions.test.ts`

**Interfaces:**
- Consumes: `networkSchema`, `networkActionSchema`, `applyAction` y los esquemas `actorSchema` y `firewallSchema` de `src/engine/network/`.
- Produces:
  - `networkSchema` rechaza `<id>: <ip> is already the IP of <otro id>` y `<cidr> is not a private range (RFC 1918)`, este también en una VPC.
  - `NetworkAction` suma `{ type: 'addActor'; actor: Actor }` y `{ type: 'addFirewall'; deviceId: string; firewall: Firewall }`.

- [ ] **Step 1: Comprobar el punto de partida**

```bash
git status --short src tests
git log -1 --format=%h
pnpm test
```

Expected:
- `git status`: nada bajo `src/` ni `tests/`.
- `git log`: `58c548e`.
- Vitest: `Test Files 44 passed (44)` y `Tests 524 passed (524)`.

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
    'src/engine/network/actions.test.ts',
    (
        r"""import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net } from '@/testing';
import { applyAction } from './actions';

""",
        r"""import { describe, expect, it } from 'vitest';
import { ATTACKER_IP, echoFrom, lab03Net, officeNet } from '@/testing';
import { applyAction } from './actions';
import type { Actor, Firewall } from './types';

""",
    ),
    (
        r"""  });
});
""",
        r"""  });

  it('adds an actor on the internet', () => {
    const visitor: Actor = { id: 'visitor', name: 'Visita', ip: ATTACKER_IP, kind: 'attacker' };
    expect(applyAction(officeNet(), { type: 'addActor', actor: visitor }).actors.at(-1)).toEqual(visitor);
  });

  it('adds a firewall and puts it on its device', () => {
    const firewall: Firewall = { id: 'fw-printer', name: 'printer', kind: 'host-firewall', inbound: [], outbound: [] };
    const guarded = applyAction(officeNet(), { type: 'addFirewall', deviceId: 'printer', firewall });
    expect(guarded.firewalls.at(-1)).toEqual(firewall);
    expect(guarded.devices.find((d) => d.id === 'printer')?.firewallIds).toEqual(['fw-printer']);
    expect(guarded.devices.find((d) => d.id === 'your-laptop')?.firewallIds).toEqual([]);
  });
});
""",
    ),
)

edit(
    'src/engine/network/schema.test.ts',
    (
        r"""  ['an office range wider than a private range', { ...officeNet(), cidr: '192.168.0.0/15' }, '192.168.0.0/15 is not a private range (RFC 1918)'],
  ['a Security Group in an office', withFirewall(officeNet(), SECURITY_GROUP), 'sg-x: an office firewall is a host firewall'],
""",
        r"""  ['an office range wider than a private range', { ...officeNet(), cidr: '192.168.0.0/15' }, '192.168.0.0/15 is not a private range (RFC 1918)'],
  ['a VPC with a range that is not private', { ...lab03Net(), cidr: '100.64.0.0/16' }, '100.64.0.0/16 is not a private range (RFC 1918)'],
  ['two devices with the same IP', withDevice(officeNet(), 'printer', { privateIp: '192.168.1.11' }), 'printer: 192.168.1.11 is already the IP of lucia-laptop'],
  ['two EC2 instances with the same private IP', withDevice(lab03Net(), 'servidor2', { subnetId: 'subnet-a', privateIp: '172.31.16.131' }), 'servidor2: 172.31.16.131 is already the IP of servidor1'],
  ['a Security Group in an office', withFirewall(officeNet(), SECURITY_GROUP), 'sg-x: an office firewall is a host firewall'],
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/engine/network/actions.test.ts src/engine/network/schema.test.ts
```

Expected: FAIL, `Test Files 2 failed (2)` y `Tests 5 failed | 24 passed (29)`. Fallan:
- `adds an actor on the internet` y `adds a firewall and puts it on its device` (la acción no existe y devuelve `undefined`);
- `rejects a VPC with a range that is not private`, `rejects two devices with the same IP` y `rejects two EC2 instances with the same private IP`.

- [ ] **Step 4: Implementar**

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
    'src/engine/network/CLAUDE.md',
    (
        r"""
- `networkSchema` checks each kind: a VPC has a region, subnets, a Security Group on every device and an Internet gateway as its edge; an office has no region, no subnets and no public IPs, its range is private and its edge is a router. A Security Group source (`sg`) only exists on a Security Group and points at one.

""",
        r"""
- `networkSchema` checks each kind: a VPC has a region, subnets, a Security Group on every device and an Internet gateway as its edge; an office has no region, no subnets and no public IPs, and its edge is a router. Both kinds use a private range (RFC 1918) and give each device its own private IP. A Security Group source (`sg`) only exists on a Security Group and points at one.
- An action changes a network: it adds or removes an inbound rule, sets an app target or the host's echo setting, adds an actor on the internet, or adds a firewall and puts it on its device.

""",
    ),
)

edit(
    'src/engine/network/actions.ts',
    (
        r"""import { z } from 'zod';
import { ruleSchema } from './schema';
import type { Network } from './types';
""",
        r"""import { z } from 'zod';
import { actorSchema, firewallSchema, ruleSchema } from './schema';
import type { Network } from './types';
""",
    ),
    (
        r"""  z.object({ type: z.literal('setIgnoreIcmpEcho'), deviceId: z.string().min(1), value: z.boolean() }),
]);
""",
        r"""  z.object({ type: z.literal('setIgnoreIcmpEcho'), deviceId: z.string().min(1), value: z.boolean() }),
  z.object({ type: z.literal('addActor'), actor: actorSchema }),
  z.object({ type: z.literal('addFirewall'), deviceId: z.string().min(1), firewall: firewallSchema }),
]);
""",
    ),
    (
        r"""      };
  }
""",
        r"""      };
    case 'addActor':
      return { ...net, actors: [...net.actors, action.actor] };
    case 'addFirewall':
      return {
        ...net,
        firewalls: [...net.firewalls, action.firewall],
        devices: net.devices.map((d) => (d.id === action.deviceId ? { ...d, firewallIds: [...d.firewallIds, action.firewall.id] } : d)),
      };
  }
""",
    ),
)

edit(
    'src/engine/network/schema.ts',
    (
        r"""
function checkVpc(net: NetworkShape, fail: Fail): void {
""",
        r"""
function checkAddresses(net: NetworkShape, fail: Fail): void {
  if (isCidr(net.cidr) && !isPrivateCidr(net.cidr)) fail(`${net.cidr} is not a private range (RFC 1918)`);
  net.devices.forEach((device, index) => {
    const first = net.devices.find((other) => other.privateIp === device.privateIp);
    if (first && net.devices.indexOf(first) < index) fail(`${device.id}: ${device.privateIp} is already the IP of ${first.id}`);
  });
}

function checkVpc(net: NetworkShape, fail: Fail): void {
""",
    ),
    (
        r"""  if (net.subnets !== undefined) fail('an office network has no subnets');
  if (isCidr(net.cidr) && !isPrivateCidr(net.cidr)) fail(`${net.cidr} is not a private range (RFC 1918)`);
  for (const firewall of net.firewalls) {
""",
        r"""  if (net.subnets !== undefined) fail('an office network has no subnets');
  for (const firewall of net.firewalls) {
""",
    ),
    (
        r"""  checkIds(net, fail);
  if (net.kind === 'vpc') checkVpc(net, fail);
""",
        r"""  checkIds(net, fail);
  checkAddresses(net, fail);
  if (net.kind === 'vpc') checkVpc(net, fail);
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 529 passed (529)` en 44 archivos; `git diff` sin salida; `pnpm check` PASS (`Found 0 clones`, 14 tests de Playwright).

- [ ] **Step 6: Commit**

```bash
git add src/engine
git commit -m "feat(engine): give each device its own IP and every network a private range, and add actors and firewalls to a world"
```

---

### Task 2: Un incidente con estrellas sigue abierto

Hoy un incidente se abre solo si todos los anteriores tienen estrellas. El capítulo 1 va antes del capítulo 4, así que las estrellas que el estudiante ya tiene en el 04-01 y el 04-02 quedarían bajo llave. Regla nueva del spec: un incidente está abierto si es el primero, si el anterior tiene estrellas, o si él mismo ya las tiene.

**Files:**
- Modify: `src/storage/progress.ts`, `src/storage/CLAUDE.md`
- Test: `src/storage/progress.test.ts`

**Interfaces:**
- Consumes: `LevelEntry` de `@/levels`, `Progress`.
- Produces: la misma firma de `isUnlocked(level, progress, levels)`, con la regla nueva.

- [ ] **Step 1: Comprobar que se parte de la Tarea 1**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 529 passed (529)`.

- [ ] **Step 2: Escribir los tests**

El test «un capítulo se abre solo si todo lo anterior tiene estrellas» se reemplaza por los dos de la regla nueva.

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
    'src/storage/progress.test.ts',
    (
        r"""
  it('a chapter opens only when every incident of the chapters before it has a star', () => {
    expect(isUnlocked(COURSE[2], { '04-01': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-02': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-01': 1, '04-02': 1 }, COURSE)).toBe(true);
  });
""",
        r"""
  it('the first incident of a chapter opens when the last one of the chapter before has a star', () => {
    expect(isUnlocked(COURSE[2], { '04-01': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-02': 1 }, COURSE)).toBe(true);
  });

  it('an incident with stars stays open even when the one before it has none', () => {
    expect(isUnlocked(COURSE[1], { '04-02': 2 }, COURSE)).toBe(true);
    expect(isUnlocked(COURSE[2], { '05-01': 1 }, COURSE)).toBe(true);
  });
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/storage/progress.test.ts
```

Expected: FAIL, `Tests 2 failed | 6 passed (8)`: `the first incident of a chapter opens when the last one of the chapter before has a star` y `an incident with stars stays open even when the one before it has none` (reciben `false`).

- [ ] **Step 4: Implementar**

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
    'src/storage/CLAUDE.md',
    (
        r"""
Progress kept in the browser: best stars per incident, and incidents and chapters that open in course order.

""",
        r"""
Progress kept in the browser: best stars per incident, and which incidents are open. An incident opens when it is the first one, when the one right before it in course order has a star, or when it has stars itself.

""",
    ),
)

edit(
    'src/storage/progress.ts',
    (
        r"""
/** True when every incident before this one, in course order, has at least one star; the first one is always open. */
export function isUnlocked(level: LevelEntry, progress: Progress, levels: LevelEntry[]): boolean {
  const index = levels.findIndex((l) => l.id === level.id);
  return levels.slice(0, Math.max(index, 0)).every((l) => (progress[l.id] ?? 0) > 0);
}
""",
        r"""
function hasStars(progress: Progress, levelId: string): boolean {
  return (progress[levelId] ?? 0) > 0;
}

/** True when the incident is the first one in course order, when the one right before it has a star, or when it already has a star itself: an incident the player already won never locks again. */
export function isUnlocked(level: LevelEntry, progress: Progress, levels: LevelEntry[]): boolean {
  const index = levels.findIndex((l) => l.id === level.id);
  return index <= 0 || hasStars(progress, level.id) || hasStars(progress, levels[index - 1].id);
}
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
pnpm check
```

Expected: `Tests 530 passed (530)` en 44 archivos; `pnpm check` PASS.

- [ ] **Step 6: Commit**

```bash
git add src/storage
git commit -m "feat(storage): keep an incident open once it has stars, and open it when the one right before has a star"
```

---

### Task 3: La casa de Lucía

El spec trae la casa de Lucía en el 01-03, como un actor en internet («su IP queda oculta hasta el 04-05, como la del atacante»). El plan 2 dejó dicho que llega con su propio tipo de actor.
- **El modelo:** el tipo nuevo es `home`, sin término, porque un actor es un personaje.
- **La pieza:** el cubo de papel de «Tu Mac» bajo un techo de dos aguas.
- **El ícono:** la silueta de una casa.
- **La caja de inspección:** dice quién es.

El catálogo `#/entidades` la suma a la fila de actores, así que la captura se regraba.

**Files:**
- Modify: `src/engine/network/schema.ts`, `src/copy/terms.ts`, `src/copy/ui.ts`, `src/copy/incident-ui.ts`, `src/scene/entities/actor.tsx`, `src/scene/catalog/catalog-cells.tsx`, `tests/e2e/snapshots/entities-darwin.png` (se regraba)
- Test: `src/engine/network/schema.test.ts`, `src/copy/terms.test.ts`, `src/ui/catalog/entities-page.test.tsx`

**Interfaces:**
- Consumes: `actorSchema`, `ENTITY_TERMS`, `ENTITY_NAMES`, `ACTOR_ROLE_TEXT`, `InkBox`, `InkIcon`, `PAPER_SHADE`.
- Produces:
  - `Actor['kind']` es `'you' | 'attacker' | 'home'`;
  - `ENTITY_TERMS.actor.home = null` y `entityName({ kind: 'actor', variant: 'home' })`, que da `[[Casa de Lucía]]`;
  - `ACTOR_ROLE_TEXT.home`;
  - `ActorPiece` y `ActorIcon` con la variante `home`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 2**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 530 passed (530)`.

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
    'src/copy/terms.test.ts',
    (
        r"""    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
  });
""",
        r"""    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'home' })).toBeNull();
  });
""",
    ),
)

edit(
    'src/engine/network/schema.test.ts',
    (
        r"""
  it('accepts an office whose laptop has its host firewall', () => {
""",
        r"""
  it('accepts a home on the internet as an actor', () => {
    expect(problems({ ...officeNet(), actors: [{ id: 'home', name: 'Casa', ip: '198.51.100.24', kind: 'home' }] })).toEqual([]);
  });

  it('accepts an office whose laptop has its host firewall', () => {
""",
    ),
)

edit(
    'src/ui/catalog/entities-page.test.tsx',
    (
        r"""    expect(screen.getByText('Atacante')).toHaveClass('name-tag');
  });
""",
        r"""    expect(screen.getByText('Atacante')).toHaveClass('name-tag');
    expect(screen.getByText('Casa de Lucía')).toHaveClass('name-tag');
  });
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/copy/terms.test.ts src/engine/network/schema.test.ts src/ui/catalog/entities-page.test.tsx
```

Expected: FAIL, `Test Files 3 failed (3)` y `Tests 3 failed | 71 passed (74)`. Fallan:
- `gives a character no term` (recibe `undefined`);
- `accepts a home on the internet as an actor`;
- `shows the name of an actor as a name tag` (no hay «Casa de Lucía»).

- [ ] **Step 4: Implementar**

Contenido completo de `src/scene/entities/actor.tsx`:

```tsx
import type { Actor } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, PAPER_FILL, PAPER_SHADE } from '@/scene/theme';

const CUBE = 0.5;
const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL, home: PAPER_FILL };
const ROOF_PITCH = 0.6;
const ROOF_SIDES = [-1, 1] as const;

function Roof({ x, z }: { x: number; z: number }) {
  return (
    <>
      {ROOF_SIDES.map((side) => (
        <group key={side} position={[x + side * 0.14, 0.6, z]} rotation-z={-side * ROOF_PITCH}>
          <InkBox size={[0.36, 0.05, 0.62]} position={[0, 0, 0]} fill={PAPER_SHADE} lineWidth={1} />
        </group>
      ))}
    </>
  );
}

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you, and a paper cube under a roof for a home. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return (
    <>
      <InkBox size={[CUBE, CUBE, CUBE]} position={[x, CUBE / 2, z]} fill={ACTOR_FILL[variant]} />
      {variant === 'home' && <Roof x={x} z={z} />}
    </>
  );
}

const ACTOR_ICON: Record<Actor['kind'], { body: string; filled: boolean; detail?: string }> = {
  attacker: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: true },
  you: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: false, detail: 'M4 7.5l8 4.5 8-4.5M12 12v9' },
  home: { body: 'M4 11l8-7 8 7v9H4z', filled: false, detail: 'M10 20v-5h4v5' },
};

/** The actor's icon: its cube, filled for the attacker and drawn in outline for you, and a house for a home. */
export function ActorIcon({ variant }: { variant: Actor['kind'] }) {
  const { body, filled, detail } = ACTOR_ICON[variant];
  return (
    <InkIcon>
      <path d={body} fill={filled ? 'currentColor' : 'none'} />
      {detail && <path d={detail} />}
    </InkIcon>
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
    'src/copy/incident-ui.ts',
    (
        r"""  you: 'Tu computadora.',
};
""",
        r"""  you: 'Tu computadora.',
  home: 'Una casa fuera de la oficina, conectada a internet.',
};
""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""  internet: { internet: null },
  actor: { you: null, attacker: null },
  packet: { 'echo-request': 'echo-request', 'echo-reply': 'echo-reply' },
""",
        r"""  internet: { internet: null },
  actor: { you: null, attacker: null, home: null },
  packet: { 'echo-request': 'echo-request', 'echo-reply': 'echo-reply' },
""",
    ),
)

edit(
    'src/copy/ui.ts',
    (
        r"""  internet: { internet: 'internet' },
  actor: { attacker: nameTag('Atacante'), you: nameTag('Tu Mac') },
  packet: { 'echo-request': 'Echo Request', 'echo-reply': 'Echo Reply' },
""",
        r"""  internet: { internet: 'internet' },
  actor: { attacker: nameTag('Atacante'), you: nameTag('Tu Mac'), home: nameTag('Casa de Lucía') },
  packet: { 'echo-request': 'Echo Request', 'echo-reply': 'Echo Reply' },
""",
    ),
)

edit(
    'src/engine/network/schema.ts',
    (
        r"""  ip,
  kind: z.enum(['you', 'attacker']),
});
""",
        r"""  ip,
  kind: z.enum(['you', 'attacker', 'home']),
});
""",
    ),
)

edit(
    'src/scene/catalog/catalog-cells.tsx',
    (
        r"""  [edgeCell('router'), edgeCell('internet-gateway'), INTERNET_CELL],
  [actorCell('attacker'), actorCell('you')],
  [packetCell('echo-request', false), packetCell('echo-reply', false), packetCell('echo-request', true), packetCell('echo-reply', true)],
""",
        r"""  [edgeCell('router'), edgeCell('internet-gateway'), INTERNET_CELL],
  [actorCell('attacker'), actorCell('you'), actorCell('home')],
  [packetCell('echo-request', false), packetCell('echo-reply', false), packetCell('echo-request', true), packetCell('echo-reply', true)],
""",
    ),
)
EOF
```

- [ ] **Step 5: Regrabar la captura y mirarla**

La captura cambia a propósito: la fila de actores suma la casa, y la lista de íconos, su ícono.

```bash
pnpm test
pnpm exec playwright test entities --update-snapshots=all
```

Expected: `Tests 531 passed (531)` en 44 archivos; los 3 tests de `entities.spec.ts` pasan.

Abrir `tests/e2e/snapshots/entities-darwin.png` con la herramienta Read y comprobar:
- la fila de actores tiene tres celdas: el cubo de tinta (Atacante), el de papel (Tu Mac) y el de papel con techo (Casa de Lucía);
- las tres etiquetas son etiquetas de nombre y no tapan su pieza;
- nada más cambió.

- [ ] **Step 6: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
pnpm check
```

Expected: `git diff` sin salida. `pnpm check` PASS dos veces seguidas (la captura recién grabada debe ser estable): `Found 0 clones`, 531 tests y 14 de Playwright.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat(scene): draw Lucía's home as an actor under a roof"
```

---

### Task 4: El contrato `send` y la sesión

El corazón del plan, en las capas `levels` y `game`.

1. **El contrato.**
   - El incidente es una unión discriminada por `mechanic`. `filter` es lo de hoy, y los dos incidentes del capítulo 4 lo declaran.
   - `send` trae `send: { from, to, message }` con al menos una ficha cada una, tareas `{ id, text, expect: { fromId, toId, messageId, outcome: 'replied' | 'any' } }`, flujos solo `ambient` y una solución de jugadas `sendPacket`.
   - Los campos comunes no cambian, salvo uno nuevo y opcional: `question`, la pregunta de Lucía.
   - El esquema rechaza fichas repetidas, tareas o jugadas con fichas que no ofrece, y flujos que no son `ambient`.
2. **Las fichas.**
   - `packetFromChips` arma el paquete ICMP de tres fichas, y `sendCombinations` lista todas las combinaciones.
   - `officeLeaks` devuelve cada flujo o combinación que saldría de la oficina hacia afuera, y el test del registro la corre en cada incidente.
3. **La sesión.**
   - La jugada `sendPacket` simula el paquete y lo guarda en `sent`: el último de cada combinación, en su lugar, con el número de su envío. Además borra la respuesta de Lucía.
   - `taskHolds(task, runs, sent)` decide una tarea de envío: `replied` exige que haya vuelto la respuesta y `any`, que se haya enviado.
   - `Stars` pasa a `{ closed, middle, explained }`, y `earnsMiddle` da la estrella del medio según la mecánica.
4. **La interfaz,** solo donde el tipo la obliga:
   - `ResultCard` toma el texto de la estrella del medio según la mecánica;
   - `LuciaCard` pasa `sent`;
   - la pantalla da las fichas solo a un incidente `filter`;
   - `ExplanationCard` muestra `question`, o «¿Qué pasó?».
5. **Los tests,** con dos ayudantes nuevos en `src/testing/incidents.ts`:
   - `filterIncident(id)` devuelve un incidente del registro ya tipado;
   - `sendIncident()` es un incidente `send` de prueba sobre la oficina.

**Files:**
- Create: `src/testing/incidents.ts`
- Modify:
  - `src/engine/index.ts`
  - `src/levels/incident.ts`, `src/levels/chips.ts`, `src/levels/world.ts`, `src/levels/ladder.ts`, `src/levels/index.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`
  - `src/game/flow-runs.ts`, `src/game/tasks.ts`, `src/game/stars.ts`, `src/game/session.ts`, `src/game/index.ts`
  - `src/copy/incident-ui.ts`
  - `src/ui/incident/result-card.tsx`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/incident/incident-screen.tsx`
  - `src/testing/index.ts`
  - las guías `src/levels/CLAUDE.md`, `src/game/CLAUDE.md` y `src/testing/CLAUDE.md`
- Test:
  - `src/levels/incident.test.ts`, `src/levels/ladder.test.ts`, `src/levels/registry.test.ts`, `src/levels/04-iaas/golden-traces.test.ts` (solo el tipo)
  - `src/game/session.test.ts`, `src/game/tasks.test.ts`, `src/game/stars.test.ts`, `src/game/incidents.test.ts`, `src/game/view/ladder.test.ts`
  - `src/ui/incident/incident-screen.test.tsx`, `src/ui/incident/task-card.test.tsx`

**Interfaces:**
- Consumes: `endpointSchema`, `icmpTypeSchema`, `ipInCidr`, `isIpv4` (exportados ahora desde `@/engine`); `simulate`, `reachesHost`, `extraOpenings`; `packetLabel`.
- Produces:
  - **Desde `@/levels`:**
    - los tipos `Incident`, `FilterIncident`, `SendIncident`, `Mechanic`, `FilterTask`, `SendTask`, `OriginChip`, `AddressChip`, `MessageChip`, `SendMove` y `PlayerMove`, que suma `sendPacket`;
    - las funciones `packetFromChips(incident, { fromId, toId, messageId })` y `sendCombinations(incident)`.
  - **Dentro de `levels`:** `officeLeaks(incident, world): string[]` y `chipLabels(incident)`.
  - **Desde `@/game`:**
    - `Session` suma `sent: SentPacket[]`, `sends: number` y `middle: boolean` (antes `tight`);
    - `SessionAction` suma `{ type: 'sendPacket', fromId, toId, messageId }`;
    - `taskHolds(task, runs, sent)`, `Stars = { closed, middle, explained }` y el tipo `SentPacket`.
  - **Dentro de `game`:** `earnsMiddle(incident, world, hintsShown)`, en `stars.ts`.
  - **Desde `@/copy`:** `EXPLANATION_TEXT.whatHappened` y `EXPLANATION_TEXT.asks(question)`; `RESULT_TEXT.middle[mechanic]`.
  - **Desde `@/testing`:** `filterIncident(id)` y `sendIncident()`. Un test de jsdom los importa de `@/testing/incidents`, porque el barrel trae `repo.ts`, que necesita una URL de archivo.

- [ ] **Step 1: Comprobar que se parte de la Tarea 3**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 531 passed (531)`.

- [ ] **Step 2: Escribir los tests y los ayudantes de prueba**

Contenido completo de `src/game/stars.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident, sendIncident } from '@/testing';
import { countStars, earnsMiddle, isTight } from './stars';

describe('stars', () => {
  it('counts the stars earned', () => {
    expect(countStars({ closed: true, middle: false, explained: true })).toBe(2);
  });

  it('a world that lets nothing in opens nothing extra', () => {
    const incident = filterIncident('04-01');
    expect(isTight(startWorld(INCIDENTS, incident.id), incident.flows)).toBe(true);
  });

  it('ping from all of internet opens too much', () => {
    const incident = filterIncident('04-01');
    const wide = applyMove(startWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(isTight(wide, incident.flows)).toBe(false);
  });

  it('the middle star of a filter is opening only what is needed, and of a send, closing without hints', () => {
    const first = filterIncident('04-01');
    const world = startWorld(INCIDENTS, first.id);
    expect(earnsMiddle(first, world, 2)).toBe(true);
    expect(earnsMiddle(sendIncident(), world, 0)).toBe(true);
    expect(earnsMiddle(sendIncident(), world, 1)).toBe(false);
  });
});
```


Contenido completo de `src/game/tasks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident, officeNet, sendIncident } from '@/testing';
import { runFlows, sendPacket, type SentPacket } from './flow-runs';
import { failingTaskIds, taskHolds } from './tasks';

const incident = filterIncident('04-01');
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing, [])).toBe(false);
    expect(taskHolds(task, holding, [])).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows), [])).toBe(false);
  });

  it('lists the tasks that do not hold, in the order of the incident', () => {
    expect(failingTaskIds(incident.tasks, failing, [])).toEqual([task.id]);
    expect(failingTaskIds(incident.tasks, holding, [])).toEqual([]);
  });
});

describe('send tasks', () => {
  const sending = sendIncident();
  const [printer, outside] = sending.tasks;
  const sent = (fromId: string, toId: string, messageId: string): SentPacket[] => {
    const packet = sendPacket(officeNet(), sending, { type: 'sendPacket', fromId, toId, messageId }, 1);
    return packet ? [packet] : [];
  };

  it('a task that expects the reply holds only when the reply of its combination came back', () => {
    expect(taskHolds(printer, [], [])).toBe(false);
    expect(taskHolds(printer, [], sent('you', 'printer', 'reply'))).toBe(false);
    expect(taskHolds(printer, [], sent('you', 'printer', 'ping'))).toBe(true);
  });

  it('a task that expects any result holds as soon as its combination is sent, even when the packet is lost', () => {
    const lost = sent('attacker', 'lucia', 'ping');
    expect(lost[0].lost).toBe(true);
    expect(taskHolds(outside, [], lost)).toBe(true);
    expect(failingTaskIds(sending.tasks, [], lost)).toEqual([printer.id]);
  });
});
```


Contenido completo de `src/testing/incidents.ts`:

```ts
import { INCIDENTS, type FilterIncident, type SendIncident } from '@/levels';
import { OFFICE, actor, device, officeNet } from './fixtures';

/** Returns a registered incident that filters with rules, by its id; throws when there is none. */
export function filterIncident(id: string): FilterIncident {
  const found = INCIDENTS.find((incident) => incident.id === id);
  if (found?.mechanic !== 'filter') throw new Error(`${id} is not a filter incident`);
  return found;
}

/** Returns a send incident on the chapter 1 office: ping the printer from your laptop and get its reply, and send anything from the attacker. */
export function sendIncident(): SendIncident {
  return {
    id: '09-01',
    chapter: 9,
    order: 1,
    title: 'Prueba',
    role: 'defender',
    lesson: 'Una lección',
    concept: 'concepts/una-nota.md',
    introduces: ['ping', 'echo-reply'],
    base: officeNet(),
    mechanic: 'send',
    report: 'Haz {{ping}} a la impresora.',
    tasks: [
      { id: 'printer', text: 'Que vuelva el {{ping}} a la impresora.', expect: { fromId: 'you', toId: 'printer', messageId: 'ping', outcome: 'replied' } },
      { id: 'outside', text: 'Prueba desde afuera.', expect: { fromId: 'attacker', toId: 'lucia', messageId: 'ping', outcome: 'any' } },
    ],
    flows: [],
    send: {
      from: [
        { id: 'you', endpoint: device('your-laptop') },
        { id: 'attacker', endpoint: actor('attacker') },
      ],
      to: [
        { id: 'printer', address: OFFICE.printer },
        { id: 'lucia', address: OFFICE.lucia },
        { id: 'nobody', address: OFFICE.nobody },
      ],
      message: [
        { id: 'ping', label: '{{ping}}', icmpType: 8 },
        { id: 'reply', label: '{{echo-reply}}', icmpType: 0 },
      ],
    },
    hints: ['Primera.', 'Segunda.'],
    question: '¿Por qué volvió el {{ping}}?',
    explanation: [
      { text: 'A', feedback: 'a', correct: false },
      { text: 'B', feedback: 'b', correct: true },
      { text: 'C', feedback: 'c', correct: false },
    ],
    solution: [
      { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' },
      { type: 'sendPacket', fromId: 'attacker', toId: 'lucia', messageId: 'ping' },
    ],
    takeaway: 'Una idea.',
  };
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
    'src/game/incidents.test.ts',
    (
        r"""import type { Network } from '@/engine';
import { INCIDENTS, applyMove, solvedWorld, startWorld, type Incident } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { isTight } from './stars';
""",
        r"""import type { Network } from '@/engine';
import { INCIDENTS, applyMove, startWorld, type FilterIncident, type Incident } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing';
import { runFlows } from './flow-runs';
import { sessionReducer, startSession, starsOf } from './session';
import { isTight } from './stars';
""",
    ),
    (
        r"""
function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function holdsAll(of: Incident, world: Network): boolean {
  const runs = runFlows(world, of.flows);
  return of.tasks.every((task) => taskHolds(task, runs));
}
""",
        r"""
function holdsAll(of: FilterIncident, world: Network): boolean {
  const runs = runFlows(world, of.flows);
  return of.tasks.every((task) => taskHolds(task, runs, []));
}
""",
    ),
    (
        r"""describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (id, of) => {
  it('starts with a task to fix', () => {
    expect(holdsAll(of, startWorld(INCIDENTS, id))).toBe(false);
  });

  it('its reference solution fixes every task and opens nothing extra', () => {
    const world = solvedWorld(INCIDENTS, id);
    expect(holdsAll(of, world)).toBe(true);
    expect(isTight(world, of.flows)).toBe(true);
  });
""",
        r"""describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (id, of) => {
  const start = startSession(INCIDENTS, id);

  it('starts with a task to fix', () => {
    expect(of.tasks.some((task) => !taskHolds(task, start.runs, start.sent))).toBe(true);
  });

  it('its reference solution fixes every task and earns every star but the explanation', () => {
    const solved = [...of.solution, { type: 'submit' } as const].reduce(sessionReducer, start);
    expect(solved.phase).toBe('explaining');
    expect(starsOf(solved)).toMatchObject({ closed: true, middle: true });
  });
""",
    ),
    (
        r"""describe('04-01, the first ping', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);
""",
        r"""describe('04-01, the first ping', () => {
  const first = filterIncident('04-01');
  const start = startWorld(INCIDENTS, first.id);
""",
    ),
    (
        r"""describe('04-02, only what is needed', () => {
  const second = incident('04-02');
  const start = startWorld(INCIDENTS, second.id);
""",
        r"""describe('04-02, only what is needed', () => {
  const second = filterIncident('04-02');
  const start = startWorld(INCIDENTS, second.id);
""",
    ),
)

edit(
    'src/game/session.test.ts',
    (
        r"""import { ruleIdFor } from '@/levels/incident';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
""",
        r"""import { ruleIdFor } from '@/levels/incident';
import { filterIncident, sendIncident } from '@/testing';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
""",
    ),
    (
        r"""
const FIRST = INCIDENTS[0];
const FULL_STARS = 3;
""",
        r"""
const FIRST = filterIncident('04-01');
const FULL_STARS = 3;
""",
    ),
    (
        r"""    const explained = play(FIX, SUBMIT, choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, tight: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
""",
        r"""    const explained = play(FIX, SUBMIT, choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, middle: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
""",
    ),
    (
        r"""    expect(keptDayShift.rejection).toBeNull();
    expect(starsOf(keptDayShift)).toMatchObject({ closed: true, tight: false });
    expect(sessionReducer(keptDayShift, DROP_DAY_SHIFT)).toBe(keptDayShift);
    const cleaned = [DROP_DAY_SHIFT, place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(starsOf(cleaned)).toMatchObject({ closed: true, tight: true });
  });
""",
        r"""    expect(keptDayShift.rejection).toBeNull();
    expect(starsOf(keptDayShift)).toMatchObject({ closed: true, middle: false });
    expect(sessionReducer(keptDayShift, DROP_DAY_SHIFT)).toBe(keptDayShift);
    const cleaned = [DROP_DAY_SHIFT, place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(starsOf(cleaned)).toMatchObject({ closed: true, middle: true });
  });
""",
    ),
    (
        r"""    expect(sessionReducer(closed, SUBMIT)).toBe(closed);
  });
});
""",
        r"""    expect(sessionReducer(closed, SUBMIT)).toBe(closed);
  });
});

describe('sending packets', () => {
  const SENDING = sendIncident();
  const send = (fromId: string, toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId, toId, messageId });
  const PING_PRINTER = send('you', 'printer', 'ping');
  const FROM_OUTSIDE = send('attacker', 'lucia', 'ping');
  const sending = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([SENDING], SENDING.id));

  it('starts with nothing sent', () => {
    expect(sending().sent).toEqual([]);
  });

  it('simulates the packet of three chips and keeps it with its combination and its result', () => {
    const [packet] = sending(PING_PRINTER).sent;
    expect(packet).toMatchObject({ fromId: 'you', toId: 'printer', messageId: 'ping', replied: true, send: 1 });
    expect(packet.packet).toEqual({ from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 });
  });

  it('keeps only the last packet of each combination, in its place, with the number of its last send', () => {
    const session = sending(PING_PRINTER, FROM_OUTSIDE, PING_PRINTER);
    expect(session.sent.map((packet) => [packet.id, packet.send])).toEqual([
      ['sent-you-printer-ping', 3],
      ['sent-attacker-lucia-ping', 2],
    ]);
    expect(session.sends).toBe(3);
  });

  it('chips the incident does not offer change nothing, and a filter incident sends nothing', () => {
    const start = sending();
    expect(sessionReducer(start, send('you', 'ghost', 'ping'))).toBe(start);
    const first = play();
    expect(sessionReducer(first, PING_PRINTER)).toBe(first);
  });

  it('tasks hold from the packets sent, and a new send takes Lucía’s reply away', () => {
    const rejected = sending(PING_PRINTER, SUBMIT);
    expect(rejected.rejection).toEqual({ attempt: 1, failingTaskIds: ['outside'], intruding: false });
    expect(sessionReducer(rejected, FROM_OUTSIDE).rejection).toBeNull();
  });

  it('closing without hints earns the middle star, and with a hint it does not', () => {
    expect(starsOf(sending(PING_PRINTER, FROM_OUTSIDE, SUBMIT))).toMatchObject({ closed: true, middle: true });
    expect(starsOf(sending({ type: 'showHint' }, PING_PRINTER, FROM_OUTSIDE, SUBMIT))).toMatchObject({ closed: true, middle: false });
  });

  it('nothing is sent once the incident is closed', () => {
    const closed = sending(PING_PRINTER, FROM_OUTSIDE, SUBMIT);
    expect(sessionReducer(closed, PING_PRINTER)).toBe(closed);
  });
});
""",
    ),
)

edit(
    'src/game/view/ladder.test.ts',
    (
        r"""import { termsIn, toPlainText, unofficialNames, type TermText } from '@/copy';
import { INCIDENTS, type Incident } from '@/levels';
import { incidentTexts, unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { firewallCard } from './firewall-card';
""",
        r"""import { termsIn, toPlainText, unofficialNames, type TermText } from '@/copy';
import { INCIDENTS, sendCombinations, type Incident } from '@/levels';
import { incidentTexts, unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { firewallCard } from './firewall-card';
""",
    ),
    (
        r"""
function sessionsToCheck(incident: Incident): Session[] {
""",
        r"""
function movesToTry(incident: Incident, start: Session): SessionAction[] {
  if (incident.mechanic === 'send') return sendCombinations(incident).map((combination) => ({ type: 'sendPacket', ...combination }));
  const cards = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => firewallCard(start, piece.id) ?? []);
  return cards.flatMap((card) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => ({ type: 'placeRule', firewallId: card.firewallId, whatId: what.id, fromId: from.id }) as const)),
  );
}

function sessionsToCheck(incident: Incident): Session[] {
""",
    ),
    (
        r"""  const solved = incident.solution.reduce(sessionReducer, start);
  const cards = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => firewallCard(start, piece.id) ?? []);
  const placed = cards.flatMap((card) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', firewallId: card.firewallId, whatId: what.id, fromId: from.id }))),
  );
  return [start, solved, ...placed];
}
""",
        r"""  const solved = incident.solution.reduce(sessionReducer, start);
  return [start, solved, ...movesToTry(incident, start).map((move) => sessionReducer(start, move))];
}
""",
    ),
)

edit(
    'src/levels/04-iaas/golden-traces.test.ts',
    (
        r"""import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
""",
        r"""import { extraOpenings, simulate, type Network } from '@/engine';
import type { FilterIncident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
""",
    ),
    (
        r"""
function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
""",
        r"""
function worlds(incident: FilterIncident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
""",
    ),
    (
        r"""function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => RECORDED_INCIDENTS.includes(incident.id)).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
""",
        r"""function references(): [string, unknown][] {
  const recordedIncidents = INCIDENTS.flatMap((incident) => (incident.mechanic === 'filter' && RECORDED_INCIDENTS.includes(incident.id) ? [incident] : []));
  return recordedIncidents.flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
""",
    ),
)

edit(
    'src/levels/incident.test.ts',
    (
        r"""import { describe, expect, it } from 'vitest';
import { actor, device, lab03Net, ping } from '@/testing';
import { incidentSchema, ruleIdFor } from './incident';

const VALID: Record<string, unknown> = {
""",
        r"""import { describe, expect, it } from 'vitest';
import { actor, device, lab03Net, officeNet, ping, sendIncident } from '@/testing';
import { officeLeaks, packetFromChips } from './chips';
import { incidentSchema, ruleIdFor } from './incident';

const SEND = sendIncident();
const VALID: Record<string, unknown> = {
""",
    ),
    (
        r"""  role: 'defender',
  lesson: 'Una lección',
""",
        r"""  role: 'defender',
  mechanic: 'filter',
  lesson: 'Una lección',
""",
    ),
    (
        r"""  },
  hints: ['Primera.', 'Segunda.'],
  explanation: [
    { text: 'A', feedback: 'a', correct: false },
    { text: 'B', feedback: 'b', correct: true },
    { text: 'C', feedback: 'c', correct: false },
  ],
  solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],
""",
        r"""  },
  hints: SEND.hints,
  explanation: SEND.explanation,
  solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],
""",
    ),
    (
        r"""  });
});
""",
        r"""  });
});

const SEND_BROKEN: [string, Record<string, unknown>][] = [
  ['a send task with a chip it does not offer', { tasks: [{ ...SEND.tasks[0], expect: { ...SEND.tasks[0].expect, toId: 'ghost' } }] }],
  ['a send solution with a chip it does not offer', { solution: [{ type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ghost' }] }],
  ['a send solution that places a rule', { solution: [{ type: 'placeRule', firewallId: 'fw-lucia', whatId: 'echo', fromId: 'one' }] }],
  ['a flow that is not ambient', { flows: [{ id: 'wanted', kind: 'required', packet: ping(device('your-laptop'), '192.168.1.20') }] }],
  ['two origin chips with the same id', { send: { ...SEND.send, from: [SEND.send.from[0], SEND.send.from[0]] } }],
  ['an empty tray', { send: { ...SEND.send, message: [] } }],
  ['a message that is not an Echo Request or an Echo Reply', { send: { ...SEND.send, message: [{ id: 'other', label: 'Otro', icmpType: 3 }] } }],
];

describe('send incident contract', () => {
  it('accepts a send incident with ambient flows only', () => {
    expect(incidentSchema.safeParse(SEND).success).toBe(true);
    expect(incidentSchema.safeParse({ ...SEND, flows: [{ id: 'noise', kind: 'ambient', packet: ping(device('printer'), '192.168.1.11') }] }).success).toBe(true);
  });

  it.each(SEND_BROKEN)('rejects %s', (_name, patch) => {
    expect(incidentSchema.safeParse({ ...SEND, ...patch }).success).toBe(false);
  });

  it('builds the packet of three chips', () => {
    expect(packetFromChips(SEND, { fromId: 'you', toId: 'lucia', messageId: 'reply' })).toEqual({ from: device('your-laptop'), to: '192.168.1.11', protocol: 'icmp', icmpType: 0 });
    expect(packetFromChips(SEND, { fromId: 'you', toId: 'ghost', messageId: 'reply' })).toBeNull();
  });
});

describe('office leaks', () => {
  it('a chip that sends from the office to an address outside it is a leak, and from the internet it is not', () => {
    const leaking = { ...SEND, send: { ...SEND.send, to: [...SEND.send.to, { id: 'dns', address: '8.8.8.8' }] } };
    expect(officeLeaks(SEND, officeNet())).toEqual([]);
    expect(officeLeaks(leaking, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
  });

  it('a flow from the office to an address outside it is a leak, and a VPC has none', () => {
    const leaking = { ...SEND, flows: [{ id: 'out', kind: 'ambient' as const, packet: ping(device('printer'), '8.8.8.8') }] };
    expect(officeLeaks(leaking, officeNet())).toEqual(['printer → 8.8.8.8']);
    expect(officeLeaks(leaking, lab03Net())).toEqual([]);
  });
});
""",
    ),
)

edit(
    'src/levels/ladder.test.ts',
    (
        r"""import type { Incident } from './incident';
import { configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';
""",
        r"""import type { Incident } from './incident';
import { chipLabels, configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';
""",
    ),
    (
        r"""  it.each(BY_INCIDENT)('%s names each chip after a term, by its official name', (_id, incident) => {
    const labels = [...incident.chips.what, ...incident.chips.from].map((chip) => chip.label);
    expect(labels.filter((label) => termsIn(label).length === 0)).toEqual([]);
""",
        r"""  it.each(BY_INCIDENT)('%s names each chip after a term, by its official name', (_id, incident) => {
    const labels = chipLabels(incident);
    expect(labels.filter((label) => termsIn(label).length === 0)).toEqual([]);
""",
    ),
)

edit(
    'src/levels/registry.test.ts',
    (
        r"""import { CHAPTERS } from './chapters';
import { incidentSchema, type Incident } from './incident';
import { INCIDENTS } from './registry';

""",
        r"""import { CHAPTERS } from './chapters';
import { officeLeaks } from './chips';
import { incidentSchema, type Incident } from './incident';
import { INCIDENTS } from './registry';
import { startWorld } from './world';

""",
    ),
    (
        r"""
  it('brings the base world only when it opens its chapter', () => {
""",
        r"""
  it('sends nothing from the office to the outside, neither in a flow nor with its chips', () => {
    expect(officeLeaks(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('brings the base world only when it opens its chapter', () => {
""",
    ),
)

edit(
    'src/testing/index.ts',
    (
        r"""export { ATTACKER_IP, OFFICE, YOU_IP, actor, allOut, device, echoFrom, lab03Net, officeNet, ping, sshFromYou, tcp, withDevice, withInbound } from './fixtures';
export { REPO_ROOT, readSyllabus, syllabusChapters, syllabusLessons } from './repo';
""",
        r"""export { ATTACKER_IP, OFFICE, YOU_IP, actor, allOut, device, echoFrom, lab03Net, officeNet, ping, sshFromYou, tcp, withDevice, withInbound } from './fixtures';
export { filterIncident, sendIncident } from './incidents';
export { REPO_ROOT, readSyllabus, syllabusChapters, syllabusLessons } from './repo';
""",
    ),
)

edit(
    'src/ui/incident/incident-screen.test.tsx',
    (
        r"""import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT, TERMS } from '@/copy';
import { INCIDENTS } from '@/levels';
""",
        r"""import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
""",
    ),
    (
        r"""const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;

""",
        r"""const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
const QUESTION = toPlainText(EXPLANATION_TEXT.asks(EXPLANATION_TEXT.whatHappened));

""",
    ),
    (
        r"""    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.queryByRole('heading', { name: EXPLANATION_TEXT.asks })).toBeNull();
    expect(within(card).getByRole('heading', { name: SG_SERVIDOR2 })).toBeInTheDocument();
""",
        r"""    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull();
    expect(within(card).getByRole('heading', { name: SG_SERVIDOR2 })).toBeInTheDocument();
""",
    ),
    (
        r"""    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: EXPLANATION_TEXT.asks })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
""",
        r"""    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: QUESTION })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
""",
    ),
)

edit(
    'src/ui/incident/task-card.test.tsx',
    (
        r"""import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { TaskCard } from './task-card';
""",
        r"""import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing/incidents';
import { TaskCard } from './task-card';
""",
    ),
    (
        r"""  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={session.incident.chips} {...handlers} />);
  return handlers;
""",
        r"""  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={filterIncident(incidentId).chips} {...handlers} />);
  return handlers;
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

El test dorado queda fuera de este paso a propósito: no se corre hasta que el contrato exista (y su JSON no se toca).

```bash
pnpm exec vitest run src/game/incidents.test.ts src/game/session.test.ts src/game/stars.test.ts src/game/tasks.test.ts src/game/view/ladder.test.ts src/levels/incident.test.ts src/levels/ladder.test.ts src/levels/registry.test.ts src/ui/incident/incident-screen.test.tsx src/ui/incident/task-card.test.tsx
```

Expected: FAIL, `Test Files 9 failed | 1 passed (10)` y `Tests 19 failed | 56 passed (75)`. Hay tres causas:
- Los archivos que usan `filterIncident('04-01')` fallan con `04-01 is not a filter incident`, porque el 04-01 todavía no declara `mechanic`: `game/incidents`, `session`, `stars`, `tasks` y `task-card`.
- `incident-screen.test.tsx` falla con `EXPLANATION_TEXT.asks is not a function`.
- `packetFromChips`, `officeLeaks` y `chipLabels` todavía no existen, y el incidente `send` de prueba no pasa el esquema.

- [ ] **Step 4: Implementar**

Llegan enteros, porque cambian casi todos sus renglones: `src/levels/incident.ts`, `src/levels/chips.ts`, `src/levels/index.ts`, `src/game/flow-runs.ts` y `src/game/tasks.ts`. El resto llega en el script.

Contenido completo de `src/game/flow-runs.ts`:

```ts
import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import { packetFromChips, type Flow, type FlowKind, type SendIncident, type SendMove } from '@/levels';
import { PIECE_ID } from './view/piece-id';

export interface PacketRun {
  id: string;
  pieceId: string;
  packet: PacketSpec;
  trace: Trace;
  replied: boolean;
  reached: boolean;
  lost: boolean;
  label: TermText;
}

export interface FlowRun extends PacketRun {
  kind: FlowKind;
}

export interface SentPacket extends PacketRun {
  fromId: string;
  toId: string;
  messageId: string;
  send: number;
}

function runPacket(world: Network, id: string, packet: PacketSpec): PacketRun {
  const trace = simulate(world, packet);
  return {
    id,
    pieceId: PIECE_ID.packet(id),
    packet,
    trace,
    replied: trace.outcome === 'replied',
    reached: reachesHost(trace),
    lost: trace.outcome === 'lost',
    label: packetLabel(packet, trace, world),
  };
}

/** Simulates every flow on the world and returns one run per flow, in the same order. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => ({ ...runPacket(world, flow.id, flow.packet), kind: flow.kind }));
}

/** Simulates the packet three send chips stand for, as the send number `send`; null when the incident does not offer one of the chips. Its id names the combination, so a new send of the same chips replaces the old one. */
export function sendPacket(world: Network, incident: SendIncident, { fromId, toId, messageId }: SendMove, send: number): SentPacket | null {
  const packet = packetFromChips(incident, { fromId, toId, messageId });
  return packet && { ...runPacket(world, `sent-${fromId}-${toId}-${messageId}`, packet), fromId, toId, messageId, send };
}

/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => run.trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop').map((step) => step.at)));
}
```


Contenido completo de `src/game/tasks.ts`:

```ts
import type { FilterTask, IncidentTask, SendTask } from '@/levels';
import type { FlowRun, SentPacket } from './flow-runs';

function runIsFine(run: FlowRun): boolean {
  switch (run.kind) {
    case 'required':
      return run.replied;
    case 'forbidden':
      return !run.reached;
    case 'ambient':
      return true;
  }
}

function flowsHold(task: FilterTask, runs: FlowRun[]): boolean {
  return runs.filter((run) => task.flowIds.includes(run.id)).every(runIsFine);
}

function sentHolds({ expect }: SendTask, sent: SentPacket[]): boolean {
  const last = sent.find((packet) => packet.fromId === expect.fromId && packet.toId === expect.toId && packet.messageId === expect.messageId);
  return last !== undefined && (expect.outcome === 'any' || last.replied);
}

/** True when the task holds: a filter task when every required flow gets its reply and none of its forbidden flows reaches a device; a send task when the last packet sent with its chips has the expected result (`replied`: its reply came back; `any`: it was sent). */
export function taskHolds(task: IncidentTask, runs: FlowRun[], sent: SentPacket[]): boolean {
  return 'expect' in task ? sentHolds(task, sent) : flowsHold(task, runs);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[], sent: SentPacket[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs, sent)).map((task) => task.id);
}
```


Contenido completo de `src/levels/chips.ts`:

```ts
import compare from 'just-compare';
import { ipInCidr, isIpv4, type Network, type PacketSpec, type Rule } from '@/engine';
import { ruleIdFor, type FromChip, type Incident, type SendIncident, type SendMove, type WhatChip } from './incident';

type RuleShape = Pick<Rule, 'what' | 'peer'>;
type Combination = Omit<SendMove, 'type'>;

/** True when two rules allow the same thing from the same place, whatever their ids. */
export function sameRule(a: RuleShape, b: RuleShape): boolean {
  return compare(a.what, b.what) && compare(a.peer, b.peer);
}

/** Builds the rule a pair of the incident's chips stands for, or null when the incident offers no rule chips or not these two. */
export function ruleFromChips(incident: Incident, whatId: string, fromId: string): Rule | null {
  if (incident.mechanic !== 'filter') return null;
  const what = incident.chips.what.find((chip) => chip.id === whatId);
  const from = incident.chips.from.find((chip) => chip.id === fromId);
  return what && from ? { id: ruleIdFor(whatId, fromId), what: what.what, peer: from.peer } : null;
}

/** Returns the chips that name a rule, or null when the incident offers no rule chips or none for its what or its from. */
export function chipsOfRule(incident: Incident, rule: RuleShape): { what: WhatChip; from: FromChip } | null {
  if (incident.mechanic !== 'filter') return null;
  const what = incident.chips.what.find((chip) => compare(chip.what, rule.what));
  const from = incident.chips.from.find((chip) => compare(chip.peer, rule.peer));
  return what && from ? { what, from } : null;
}

/** Builds the packet three send chips stand for: an ICMP message from the origin to the address; null when the incident does not offer one of them. */
export function packetFromChips(incident: SendIncident, { fromId, toId, messageId }: Combination): PacketSpec | null {
  const from = incident.send.from.find((chip) => chip.id === fromId);
  const to = incident.send.to.find((chip) => chip.id === toId);
  const message = incident.send.message.find((chip) => chip.id === messageId);
  return from && to && message ? { from: from.endpoint, to: to.address, protocol: 'icmp', icmpType: message.icmpType } : null;
}

/** Returns every combination of the incident's send chips, one origin, one address and one message each. */
export function sendCombinations(incident: SendIncident): Combination[] {
  return incident.send.from.flatMap((from) =>
    incident.send.to.flatMap((to) => incident.send.message.map((message) => ({ fromId: from.id, toId: to.id, messageId: message.id }))),
  );
}

function packetsOf(incident: Incident): PacketSpec[] {
  const flows = incident.flows.map((flow) => flow.packet);
  if (incident.mechanic !== 'send') return flows;
  return [...flows, ...sendCombinations(incident).flatMap((combination) => packetFromChips(incident, combination) ?? [])];
}

/** Returns, as "device → address", every flow and every combination of send chips that sends a packet from a device of an office to an address outside it: the game does not model the office's NAT. */
export function officeLeaks(incident: Incident, world: Network): string[] {
  if (world.kind !== 'office') return [];
  return packetsOf(incident)
    .filter((packet) => packet.from.kind === 'device' && isIpv4(packet.to) && !ipInCidr(packet.to, world.cidr))
    .map((packet) => `${packet.from.id} → ${packet.to}`);
}
```


Contenido completo de `src/levels/incident.ts`:

```ts
import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { endpointSchema, icmpTypeSchema, networkActionSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from '@/engine';

const id = z.string().min(1);

function termTextProblem(text: string): string | undefined {
  try {
    parseTermText(text);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const termText = z.string().min(1).check((context) => {
  const problem = termTextProblem(context.value);
  if (problem) context.issues.push({ code: 'custom', message: problem, input: context.value });
});
const termIdSchema = z.custom<TermId>((value) => typeof value === 'string' && isTermId(value), 'unknown term');

export const flowKindSchema = z.enum(['required', 'forbidden', 'ambient']);

const placeRuleSchema = z.object({ type: z.literal('placeRule'), firewallId: id, whatId: id, fromId: id });
const removeRuleSchema = z.object({ type: z.literal('removeRule'), firewallId: id, ruleId: id });
const sendPacketSchema = z.object({ type: z.literal('sendPacket'), fromId: id, toId: id, messageId: id });
const ruleMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema]);

export const playerMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema, sendPacketSchema]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const filterTaskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const sendTaskSchema = z.object({
  id,
  text: termText,
  expect: z.object({ fromId: id, toId: id, messageId: id, outcome: z.enum(['replied', 'any']) }),
});
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const fromChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
const originChipSchema = z.object({ id, endpoint: endpointSchema });
const addressChipSchema = z.object({ id, address: id });
const messageChipSchema = z.object({ id, label: termText, icmpType: icmpTypeSchema });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });

const common = {
  id: z.string().regex(/^\d{2}-\d{2}$/),
  chapter: z.number().int().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  role: z.enum(['defender', 'attacker']),
  lesson: z.string().min(1),
  concept: z.string().min(1),
  introduces: z.array(termIdSchema),
  base: networkSchema.optional(),
  changes: z.array(networkActionSchema).optional(),
  report: termText,
  hints: z.tuple([termText, termText]),
  question: termText.optional(),
  explanation: z.tuple([optionSchema, optionSchema, optionSchema]),
  takeaway: termText,
};

const filterIncidentSchema = z.object({
  ...common,
  mechanic: z.literal('filter'),
  tasks: z.array(filterTaskSchema).min(1),
  flows: z.array(flowSchema).min(1),
  chips: z.object({ what: z.array(whatChipSchema).min(1), from: z.array(fromChipSchema).min(1) }),
  solution: z.array(ruleMoveSchema).min(1),
});

const sendIncidentSchema = z.object({
  ...common,
  mechanic: z.literal('send'),
  tasks: z.array(sendTaskSchema).min(1),
  flows: z.array(flowSchema),
  send: z.object({ from: z.array(originChipSchema).min(1), to: z.array(addressChipSchema).min(1), message: z.array(messageChipSchema).min(1) }),
  solution: z.array(sendPacketSchema).min(1),
});

type FilterShape = z.infer<typeof filterIncidentSchema>;
type SendShape = z.infer<typeof sendIncidentSchema>;
type Fail = (message: string) => void;

function repeated(values: string[]): string | undefined {
  return values.find((value, index) => values.indexOf(value) !== index);
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function uniqueIn(fail: Fail) {
  return (name: string, values: string[]) => {
    const twice = repeated(values);
    if (twice) fail(`${name} repeated: ${twice}`);
  };
}

function checkFilter(incident: FilterShape, fail: Fail): void {
  const unique = uniqueIn(fail);
  unique('what chip id', incident.chips.what.map((c) => c.id));
  unique('from chip id', incident.chips.from.map((c) => c.id));
  const kinds = new Map(incident.flows.map((f) => [f.id, f.kind]));
  for (const task of incident.tasks) {
    for (const flowId of task.flowIds) if (!kinds.has(flowId)) fail(`${task.id}: unknown flow ${flowId}`);
    if (!task.flowIds.some((flowId) => kinds.get(flowId) === 'required')) fail(`${task.id}: needs a required flow`);
  }
  const inTasks = new Set(incident.tasks.flatMap((t) => t.flowIds));
  for (const flow of incident.flows) {
    if (flow.kind !== 'ambient' && !inTasks.has(flow.id)) fail(`${flow.id}: required and forbidden flows belong to a task`);
  }
  const whatIds = new Set(incident.chips.what.map((c) => c.id));
  const fromIds = new Set(incident.chips.from.map((c) => c.id));
  for (const move of incident.solution) {
    if (move.type === 'placeRule' && !(whatIds.has(move.whatId) && fromIds.has(move.fromId))) {
      fail(`the solution uses chips the incident does not offer: ${move.whatId}, ${move.fromId}`);
    }
  }
}

function checkSend(incident: SendShape, fail: Fail): void {
  const unique = uniqueIn(fail);
  const ids = { from: incident.send.from.map((c) => c.id), to: incident.send.to.map((c) => c.id), message: incident.send.message.map((c) => c.id) };
  unique('origin chip id', ids.from);
  unique('address chip id', ids.to);
  unique('message chip id', ids.message);
  const offers = (combination: { fromId: string; toId: string; messageId: string }) =>
    ids.from.includes(combination.fromId) && ids.to.includes(combination.toId) && ids.message.includes(combination.messageId);
  for (const task of incident.tasks) {
    if (!offers(task.expect)) fail(`${task.id}: expects chips the incident does not offer`);
  }
  for (const flow of incident.flows) {
    if (flow.kind !== 'ambient') fail(`${flow.id}: a send incident has only ambient flows`);
  }
  for (const move of incident.solution) {
    if (!offers(move)) fail(`the solution uses chips the incident does not offer: ${move.fromId}, ${move.toId}, ${move.messageId}`);
  }
}

export const incidentSchema = z.discriminatedUnion('mechanic', [filterIncidentSchema, sendIncidentSchema]).superRefine((incident, ctx) => {
  const fail: Fail = (message) => ctx.addIssue({ code: 'custom', message });
  const unique = uniqueIn(fail);
  if ((incident.base === undefined) === (incident.changes === undefined)) fail('an incident has either a base world or changes');
  if (incident.id !== `${twoDigits(incident.chapter)}-${twoDigits(incident.order)}`) fail(`id ${incident.id} must be chapter-order`);
  unique('introduced term', incident.introduces);
  unique('flow id', incident.flows.map((f) => f.id));
  unique('task id', incident.tasks.map((t) => t.id));
  if (incident.explanation.filter((option) => option.correct).length !== 1) fail('exactly one explanation is correct');
  if (incident.mechanic === 'filter') checkFilter(incident, fail);
  else checkSend(incident, fail);
});

export type Incident = z.infer<typeof incidentSchema>;
export type Mechanic = Incident['mechanic'];
export type FilterIncident = Extract<Incident, { mechanic: 'filter' }>;
export type SendIncident = Extract<Incident, { mechanic: 'send' }>;
export type Flow = Incident['flows'][number];
export type FlowKind = z.infer<typeof flowKindSchema>;
export type IncidentTask = Incident['tasks'][number];
export type FilterTask = FilterIncident['tasks'][number];
export type SendTask = SendIncident['tasks'][number];
export type WhatChip = FilterIncident['chips']['what'][number];
export type FromChip = FilterIncident['chips']['from'][number];
export type OriginChip = SendIncident['send']['from'][number];
export type AddressChip = SendIncident['send']['to'][number];
export type MessageChip = SendIncident['send']['message'][number];
export type PlayerMove = z.infer<typeof playerMoveSchema>;
export type SendMove = z.infer<typeof sendPacketSchema>;
export type ExplanationOption = Incident['explanation'][number];
export type LevelEntry = Pick<Incident, 'id' | 'chapter' | 'order' | 'title' | 'role'>;
export type LevelRole = Incident['role'];

/** Returns the id a rule gets when the player places it from two chips. */
export function ruleIdFor(whatId: string, fromId: string): string {
  return `${whatId}-from-${fromId}`;
}

/** Validates an incident file and returns it typed; throws with every problem when the file is wrong. */
export function defineIncident(input: z.input<typeof incidentSchema>): Incident {
  return incidentSchema.parse(input);
}
```


Contenido completo de `src/levels/index.ts`:

```ts
export { CHAPTERS } from './chapters';
export type { Chapter } from './chapters';
export type {
  AddressChip,
  ExplanationOption,
  FilterIncident,
  FilterTask,
  Flow,
  FlowKind,
  FromChip,
  Incident,
  IncidentTask,
  LevelEntry,
  LevelRole,
  Mechanic,
  MessageChip,
  OriginChip,
  PlayerMove,
  SendIncident,
  SendMove,
  SendTask,
  WhatChip,
} from './incident';
export { INCIDENTS } from './registry';
export { chipsOfRule, packetFromChips, sendCombinations } from './chips';
export { applyMove, solvedWorld, startWorld } from './world';
export { configurableParts, knownTerms } from './ladder';
export type { ConfigurableParts } from './ladder';
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
    'src/copy/incident-ui.ts',
    (
        r"""export const EXPLANATION_TEXT = {
  asks: 'Lucía: «¿Qué pasó?»',
  right: 'Correcto.',
""",
        r"""export const EXPLANATION_TEXT = {
  whatHappened: '¿Qué pasó?',
  asks: (question: TermText): TermText => `Lucía: «${question}»`,
  right: 'Correcto.',
""",
    ),
    (
        r"""  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', tight: 'Abriste solo lo justo', explained: 'Explicaste qué pasó a la primera' },
  earned: 'conseguida',
""",
        r"""  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', explained: 'Explicaste qué pasó a la primera' },
  middle: { filter: 'Abriste solo lo justo', send: 'Lo resolviste sin pistas' },
  earned: 'conseguida',
""",
    ),
)

edit(
    'src/engine/index.ts',
    (
        r"""export type { Actor, Device, Endpoint, Firewall, FirewallKind, Network, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from './network/types';
export { networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from './network/schema';
export { simulate } from './simulation/simulate';
""",
        r"""export type { Actor, Device, Endpoint, Firewall, FirewallKind, Network, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from './network/types';
export { endpointSchema, icmpTypeSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from './network/schema';
export { ipInCidr, isIpv4 } from './network/cidr';
export { simulate } from './simulation/simulate';
""",
    ),
)

edit(
    'src/game/CLAUDE.md',
    (
        r"""
The session of one incident, as a pure reducer: the current world, the run of every flow, the tasks (done or not, read from the runs at once), the sent solution and Lucía's reply, hints, the explanation and the stars. What the map and the panels show lives in `view/`.

""",
        r"""
The session of one incident, as a pure reducer: the current world, the run of every flow, the packets the player sent (the last one of each combination of chips, with the number of its send), the tasks (done or not, read from the runs and the sent packets at once), the sent solution and Lucía's reply, hints, the explanation and the stars. The middle star depends on the mechanic: only what is needed for a filter, no hints for a send. What the map and the panels show lives in `view/`.

""",
    ),
)

edit(
    'src/game/index.ts',
    (
        r"""export type { Rejection, Session, SessionAction } from './session';
export { countStars } from './stars';
""",
        r"""export type { Rejection, Session, SessionAction } from './session';
export type { SentPacket } from './flow-runs';
export { countStars } from './stars';
""",
    ),
)

edit(
    'src/game/session.ts',
    (
        r"""import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type ConfigurableParts, type Incident, type PlayerMove } from '@/levels';
import { runFlows, type FlowRun } from './flow-runs';
import { isTight, type Stars } from './stars';
import { failingTaskIds } from './tasks';

""",
        r"""import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type ConfigurableParts, type Incident, type PlayerMove, type SendMove } from '@/levels';
import { runFlows, sendPacket, type FlowRun, type SentPacket } from './flow-runs';
import { earnsMiddle, type Stars } from './stars';
import { failingTaskIds } from './tasks';

type RuleMove = Exclude<PlayerMove, SendMove>;

""",
    ),
    (
        r"""  runs: FlowRun[];
  rejection: Rejection | null;
""",
        r"""  runs: FlowRun[];
  sent: SentPacket[];
  sends: number;
  rejection: Rejection | null;
""",
    ),
    (
        r"""  phase: SessionPhase;
  tight: boolean;
  choice: number | null;
""",
        r"""  phase: SessionPhase;
  middle: boolean;
  choice: number | null;
""",
    ),
    (
        r"""    runs,
    rejection: null,
""",
        r"""    runs,
    sent: [],
    sends: 0,
    rejection: null,
""",
    ),
    (
        r"""    phase: 'playing',
    tight: false,
    choice: null,
""",
        r"""    phase: 'playing',
    middle: false,
    choice: null,
""",
    ),
    (
        r"""
function move(state: Session, action: PlayerMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.firewallId)) return state;
""",
        r"""
function move(state: Session, action: RuleMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.firewallId)) return state;
""",
    ),
    (
        r"""
function submit(state: Session): Session {
  if (state.phase !== 'playing') return state;
  const failing = failingTaskIds(state.incident.tasks, state.runs);
  if (failing.length === 0) return { ...state, phase: 'explaining', tight: isTight(state.world, state.incident.flows), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
""",
        r"""
/** Sends the packet of three chips: the last packet of each combination stays, and a new send takes Lucía's reply away. */
function send(state: Session, action: SendMove): Session {
  if (state.phase !== 'playing' || state.incident.mechanic !== 'send') return state;
  const packet = sendPacket(state.world, state.incident, action, state.sends + 1);
  if (!packet) return state;
  const again = state.sent.some((other) => other.id === packet.id);
  const sent = again ? state.sent.map((other) => (other.id === packet.id ? packet : other)) : [...state.sent, packet];
  return { ...state, sent, sends: packet.send, rejection: null };
}

function submit(state: Session): Session {
  if (state.phase !== 'playing') return state;
  const failing = failingTaskIds(state.incident.tasks, state.runs, state.sent);
  if (failing.length === 0) return { ...state, phase: 'explaining', middle: earnsMiddle(state.incident, state.world, state.hintsShown), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
""",
    ),
    (
        r"""      return move(state, action);
    case 'submit':
""",
        r"""      return move(state, action);
    case 'sendPacket':
      return send(state, action);
    case 'submit':
""",
    ),
    (
        r"""
/** Returns the stars as they stand: closed, only what is needed at the close, and the first explanation right. */
export function starsOf(session: Session): Stars {
""",
        r"""
/** Returns the stars as they stand: closed, the middle star of the mechanic at the close (only what is needed, or no hints), and the first explanation right. */
export function starsOf(session: Session): Stars {
""",
    ),
    (
        r"""    closed: session.phase !== 'playing',
    tight: session.tight,
    explained: session.choice !== null && session.incident.explanation[session.choice].correct,
""",
        r"""    closed: session.phase !== 'playing',
    middle: session.middle,
    explained: session.choice !== null && session.incident.explanation[session.choice].correct,
""",
    ),
)

edit(
    'src/game/stars.ts',
    (
        r"""import { extraOpenings, type Network } from '@/engine';
import type { Flow } from '@/levels';

""",
        r"""import { extraOpenings, type Network } from '@/engine';
import type { Flow, Incident } from '@/levels';

""",
    ),
    (
        r"""  closed: boolean;
  tight: boolean;
  explained: boolean;
""",
        r"""  closed: boolean;
  middle: boolean;
  explained: boolean;
""",
    ),
    (
        r"""  return extraOpenings(world, expected).length === 0;
}
""",
        r"""  return extraOpenings(world, expected).length === 0;
}

/** True when the close earns the middle star: for a filter, nothing opened beyond what is needed; for a send, no hint asked. */
export function earnsMiddle(incident: Incident, world: Network, hintsShown: number): boolean {
  return incident.mechanic === 'filter' ? isTight(world, incident.flows) : hintsShown === 0;
}
""",
    ),
)

edit(
    'src/levels/04-iaas/01-the-first-ping.ts',
    (
        r"""  role: 'defender',
  lesson: LESSON,
""",
        r"""  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
""",
    ),
)

edit(
    'src/levels/04-iaas/02-open-just-enough.ts',
    (
        r"""  role: 'defender',
  lesson: LESSON,
""",
        r"""  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
""",
    ),
)

edit(
    'src/levels/CLAUDE.md',
    (
        r"""- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
""",
        r"""- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- An incident has a mechanic. `filter`: the player places rules with Type and Source chips, and tasks read live flows. `send`: the player sends packets with origin, address and message chips (`packetFromChips`), and each task expects the result of one combination (`replied` or `any`); its flows are only ambient. A send move never changes the world.
- No flow and no combination of chips sends a packet from a device of an office to an address outside it (`officeLeaks`): the game does not model the office's NAT. The registry test checks it on each incident's start world.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
""",
    ),
)

edit(
    'src/levels/ladder.ts',
    (
        r"""
/** Returns every text of the incident the player reads: report, tasks, chips, hints, explanation and takeaway. */
export function incidentTexts(incident: Incident): TermText[] {
""",
        r"""
/** Returns the labels of the chips the incident writes: Type and Source for a filter, the messages for a send (an origin is named after the world and an address is only an address). */
export function chipLabels(incident: Incident): TermText[] {
  const chips = incident.mechanic === 'filter' ? [...incident.chips.what, ...incident.chips.from] : incident.send.message;
  return chips.map((chip) => chip.label);
}

/** Returns every text of the incident the player reads: report, tasks, chips, hints, the question, the explanation and the takeaway. */
export function incidentTexts(incident: Incident): TermText[] {
""",
    ),
    (
        r"""    ...incident.tasks.map((task) => task.text),
    ...incident.chips.what.map((chip) => chip.label),
    ...incident.chips.from.map((chip) => chip.label),
    ...incident.hints,
    ...incident.explanation.flatMap((option) => [option.text, option.feedback]),
""",
        r"""    ...incident.tasks.map((task) => task.text),
    ...chipLabels(incident),
    ...incident.hints,
    ...(incident.question ? [incident.question] : []),
    ...incident.explanation.flatMap((option) => [option.text, option.feedback]),
""",
    ),
)

edit(
    'src/levels/world.ts',
    (
        r"""
/** Applies a player move; returns the same world when the move changes nothing (unknown firewall or chip, a rule that already exists, a rule id that is not there). */
export function applyMove(world: Network, incident: Incident, move: PlayerMove): Network {
  const firewall = world.firewalls.find((f) => f.id === move.firewallId);
""",
        r"""
/** Applies a player move; returns the same world when the move changes nothing (sending a packet, an unknown firewall or chip, a rule that already exists, a rule id that is not there). */
export function applyMove(world: Network, incident: Incident, move: PlayerMove): Network {
  if (move.type === 'sendPacket') return world;
  const firewall = world.firewalls.find((f) => f.id === move.firewallId);
""",
    ),
)

edit(
    'src/testing/CLAUDE.md',
    (
        r"""
Helpers for tests only: network fixtures (`fixtures.ts`: the lab 03 VPC and the chapter 1 office), readers for the repository's `syllabus.md` (`repo.ts`) and the Vitest setup (`setup.ts`).

""",
        r"""
Helpers for tests only: network fixtures (`fixtures.ts`: the lab 03 VPC and the chapter 1 office), incidents (`incidents.ts`: a registered filter incident by its id, and a send incident on the office), readers for the repository's `syllabus.md` (`repo.ts`) and the Vitest setup (`setup.ts`).

""",
    ),
)

edit(
    'src/ui/incident/explanation-card.tsx',
    (
        r"""import { EXPLANATION_TEXT } from '@/copy';
import type { ExplanationOption } from '@/levels';
""",
        r"""import { EXPLANATION_TEXT, type TermText } from '@/copy';
import type { ExplanationOption } from '@/levels';
""",
    ),
    (
        r"""interface ExplanationCardProps {
  options: ExplanationOption[];
""",
        r"""interface ExplanationCardProps {
  question: TermText;
  options: ExplanationOption[];
""",
    ),
    (
        r"""
export function ExplanationCard({ options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
""",
        r"""
export function ExplanationCard({ question, options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
""",
    ),
    (
        r"""      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        {EXPLANATION_TEXT.asks}
      </h2>
""",
        r"""      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        <TaggedText text={EXPLANATION_TEXT.asks(question)} />
      </h2>
""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { useReducer, useState } from 'react';
import { SCREEN_TEXT } from '@/copy';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
""",
        r"""import { useReducer, useState } from 'react';
import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
""",
    ),
    (
        r"""  const pieces = pieceViews(session);
  const card = playing && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;
""",
        r"""  const pieces = pieceViews(session);
  const chips = session.incident.mechanic === 'filter' ? session.incident.chips : null;
  const card = playing && chips && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;
""",
    ),
    (
        r"""          overlay={
            card && (
              <TaskCard
""",
        r"""          overlay={
            card &&
            chips && (
              <TaskCard
""",
    ),
    (
        r"""                card={card}
                chips={session.incident.chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })}
""",
        r"""                card={card}
                chips={chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })}
""",
    ),
    (
        r"""        {session.phase === 'explaining' && (
          <ExplanationCard options={session.incident.explanation} choice={session.choice} onChoose={(index) => dispatch({ type: 'chooseExplanation', index })} onContinue={showResult} />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} takeaway={session.incident.takeaway} nextId={nextId} />}
      </aside>
""",
        r"""        {session.phase === 'explaining' && (
          <ExplanationCard
            question={session.incident.question ?? EXPLANATION_TEXT.whatHappened}
            options={session.incident.explanation}
            choice={session.choice}
            onChoose={(index) => dispatch({ type: 'chooseExplanation', index })}
            onContinue={showResult}
          />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} mechanic={session.incident.mechanic} takeaway={session.incident.takeaway} nextId={nextId} />}
      </aside>
""",
    ),
)

edit(
    'src/ui/incident/lucia-card.tsx',
    (
        r"""        {incident.tasks.map((task) => {
          const done = taskHolds(task, session.runs);
          return (
""",
        r"""        {incident.tasks.map((task) => {
          const done = taskHolds(task, session.runs, session.sent);
          return (
""",
    ),
)

edit(
    'src/ui/incident/result-card.tsx',
    (
        r"""import { countStars, type Stars as EarnedStars } from '@/game';
import { Stars } from '@/ui/stars';
""",
        r"""import { countStars, type Stars as EarnedStars } from '@/game';
import type { Mechanic } from '@/levels';
import { Stars } from '@/ui/stars';
""",
    ),
    (
        r"""
const STAR_KEYS = ['closed', 'tight', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

export function ResultCard({ stars, takeaway, nextId }: { stars: EarnedStars; takeaway: TermText; nextId: string | null }) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
""",
        r"""
const STAR_KEYS = ['closed', 'middle', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

function starText(key: (typeof STAR_KEYS)[number], mechanic: Mechanic): string {
  return key === 'middle' ? RESULT_TEXT.middle[mechanic] : RESULT_TEXT.stars[key];
}

export function ResultCard({ stars, mechanic, takeaway, nextId }: { stars: EarnedStars; mechanic: Mechanic; takeaway: TermText; nextId: string | null }) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
""",
    ),
    (
        r"""            <span aria-hidden="true">{stars[key] ? '★ ' : '☆ '}</span>
            {RESULT_TEXT.stars[key]}
            <span className="sr-only"> ({stars[key] ? RESULT_TEXT.earned : RESULT_TEXT.missed})</span>
""",
        r"""            <span aria-hidden="true">{stars[key] ? '★ ' : '☆ '}</span>
            {starText(key, mechanic)}
            <span className="sr-only"> ({stars[key] ? RESULT_TEXT.earned : RESULT_TEXT.missed})</span>
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected:
- Vitest: `Tests 554 passed (554)` en 44 archivos, incluido el test dorado.
- `git diff`: sin salida.
- `pnpm check`: PASS, con 14 tests de Playwright. El capítulo 4 se juega igual; la estrella del medio sigue diciendo «Abriste solo lo justo».

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(levels): add the send mechanic to the incident contract and the session, with the no-hints star"
```

---

### Task 5: Escena: cada envío viaja una vez, y los sellos (G3, G4, G5, G8)

La escena dibuja lo que la sesión ya calculó:
- **Paquetes enviados.** Cada paquete de `sent` viaja una vez por envío (`useSendOnce` sobre el mismo reloj de los flujos, `usePacketRuns`). En «Sin animaciones» se dibuja su trazo, y deja su sello como un flujo; los sellos de flujos y envíos se reparten juntos.
- **G3.** Cada paquete calculado trae `blocked` (lo frenó un firewall) e `intruder` (un flujo prohibido), y deja de traer `lost`. Así un `timeout` de ruta o de DNS se dibuja perdido, no como un firewall que dice no.
- **G4.** `pathFor` suma el punto del borde solo si el mapa dibuja el afuera.
- **G5.** Los grupos de sellos ya repartidos que quedan a menos de 1 unidad se unen y se reparten juntos.
- **G8.** El sello se llama por su paquete y por cómo terminó (`stampLabel`), y `StampState` pasa a `copy`.
- **Anclas.** La tarjeta se ancla a cualquier pieza: `cardAnchorPosition(piece, layout)`. La terminal de la casa de Lucía lo necesita en la Tarea 7.

**Files:**
- Modify:
  - `src/game/flow-runs.ts`
  - `src/copy/packet-labels.ts`, `src/copy/incident-ui.ts`, `src/copy/index.ts`
  - `src/scene/layout.ts`, `src/scene/game-scene.tsx`, `src/scene/catalog/catalog-cells.tsx`, `src/scene/entities/stamp.tsx`, `src/scene/entities/index.ts`, `src/scene/traffic/flow-look.ts`, `src/scene/traffic/flow-traffic.tsx`, `src/scene/traffic/traffic.tsx`, `src/scene/traffic/use-packet-runs.ts`
  - `src/ui/incident/incident-screen.tsx` (pasa `sent`)
  - las guías `src/scene/traffic/CLAUDE.md` y `src/scene/entities/CLAUDE.md`
- Test: `src/scene/traffic/flow-look.test.ts`, `src/scene/layout.test.ts`, `src/copy/packet-labels.test.ts`, `src/scene/entities/entity-icon.test.tsx`, `src/game/tasks.test.ts`

**Interfaces:**
- Consumes: `SentPacket` y `FlowRun` de `@/game`; `runSeconds`, `sendsBetween`; `PacketRun`, `PacketTrace` y `StampPiece` de `@/scene/entities`.
- Produces:
  - `PacketRun` (de `game`) trae `blocked` e `intruder` en lugar de `lost`.
  - `FlowResult = { packet, intruder, reached, replied, blocked }`.
  - `stampLabel(packet, state)` y el tipo `StampState`, desde `@/copy`.
  - `usePacketRuns(look, sendsBetween)` y `useSendOnce(send)`; los componentes `FlowTraffic({ look, index })` y `SentTraffic({ look, send })`.
  - `Traffic({ flows, sent, layout, still, onInspect })` y `GameSceneProps.sent: MapSent[]`, con `MapSent = MapFlow & { send: number }`.
  - `cardAnchorPosition({ kind, anchorId }, layout)`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 4**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 554 passed (554)`.

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
    'src/copy/packet-labels.test.ts',
    (
        r"""import { actor, device, lab03Net, ping } from '@/testing';
import { deviceName, endpointName, packetLabel, packetMessage, serviceLabel } from './packet-labels';

""",
        r"""import { actor, device, lab03Net, ping } from '@/testing';
import { deviceName, endpointName, packetLabel, packetMessage, serviceLabel, stampLabel } from './packet-labels';

""",
    ),
    (
        r"""
  it('tag Echo Reply and leave TCP plain', () => {
""",
        r"""
  it('name a stamp by its packet and by how it ended, so a screen reader tells ✓, ✕ and ? apart', () => {
    const labels = (['arrived', 'blocked', 'lost', 'intruder'] as const).map((state) => stampLabel('ping de tu-laptop a impresora', state));
    expect(labels[0]).toBe('Paquete: ping de tu-laptop a impresora. Llegó.');
    expect(new Set(labels).size).toBe(4);
  });

  it('tag Echo Reply and leave TCP plain', () => {
""",
    ),
)

edit(
    'src/game/tasks.test.ts',
    (
        r"""    const lost = sent('attacker', 'lucia', 'ping');
    expect(lost[0].lost).toBe(true);
    expect(taskHolds(outside, [], lost)).toBe(true);
""",
        r"""    const lost = sent('attacker', 'lucia', 'ping');
    expect(lost[0].reached).toBe(false);
    expect(taskHolds(outside, [], lost)).toBe(true);
""",
    ),
)

edit(
    'src/scene/entities/entity-icon.test.tsx',
    (
        r"""import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, type EntityKind, type EntityRef } from '@/copy';
import { EntityIcon } from './entity-icon';
import { StampIcon, type StampState } from './stamp';

""",
        r"""import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, type EntityKind, type EntityRef, type StampState } from '@/copy';
import { EntityIcon } from './entity-icon';
import { StampIcon } from './stamp';

""",
    ),
)

edit(
    'src/scene/layout.test.ts',
    (
        r"""    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([layout.actors.attacker, layout.internet]);
  });
});

""",
        r"""    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([layout.actors.attacker, layout.internet]);
  });

  it('while the map does not show the outside, a packet never travels to the edge it does not draw', () => {
    const alone = { ...net, actors: [] };
    const inside = computeLayout(alone, false);
    const packet = ping(device('your-laptop'), '8.8.8.8');
    const path = pathFor(simulate(alone, packet), packet, inside);
    expect(path).not.toContainEqual(inside.edge);
    expect(path.at(-1)).toEqual(inside.devices['your-laptop'].road);
  });
});

""",
    ),
    (
        r"""    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.firewall[0]);
  });
""",
        r"""    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[0]).toBe(spot.firewall[0]);
  });

  it('a card can open beside a device or an actor too', () => {
    const [x, , z] = cardAnchorPosition({ kind: 'actor', anchorId: 'attacker' }, layout);
    expect([x, z]).toEqual(layout.actors.attacker);
    expect(cardAnchorPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[0]).toBe(layout.devices.servidor2.x);
  });
""",
    ),
    (
        r"""
  it('moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device', () => {
    const minimumGap = 0.8;
    const { door, doorstep, firewall } = computeLayout(officeNet(), false).devices['your-laptop'];
""",
        r"""
  const minimumGap = 0.8;
  const gaps = (stamps: Vec2[]) => stamps.flatMap((stamp, index) => stamps.slice(index + 1).map((other) => Math.hypot(stamp[0] - other[0], stamp[1] - other[1])));

  it('chains close points into one group: A near B and B near C spread together, although A is far from C', () => {
    const points: Vec2[] = [[0, 0], [0.9, 0], [1.8, 0]];
    for (const gap of gaps(spreadStamps(points))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('a spread group that comes close to another stamp takes it in, so no two stamps end up closer than the minimum', () => {
    for (const gap of gaps(spreadStamps([[0, 0], [0, 0], [1, 0]]))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device', () => {
    const { door, doorstep, firewall } = computeLayout(officeNet(), false).devices['your-laptop'];
""",
    ),
)

edit(
    'src/scene/traffic/flow-look.test.ts',
    (
        r"""const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const flow = (result: Partial<FlowResult>): FlowResult => ({ kind: 'required', packet: PING, reached: false, replied: false, lost: false, ...result });

""",
        r"""const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const flow = (result: Partial<FlowResult>): FlowResult => ({ packet: PING, intruder: false, reached: false, replied: false, blocked: false, ...result });

""",
    ),
    (
        r"""
  it('a blocked packet bursts and leaves ✕', () => {
    expect(flowLook(flow({}))).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });

  it('a lost packet fades and leaves its own stamp, not the one of a block', () => {
    expect(flowLook(flow({ lost: true }))).toMatchObject({ end: 'lost', stamp: 'lost' });
  });

  it('a forbidden flow is an intruder, and its stamp says so only when it gets in', () => {
    expect(flowLook(flow({ kind: 'forbidden', reached: true }))).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(flowLook(flow({ kind: 'forbidden' }))).toMatchObject({ intruder: true, stamp: 'blocked' });
  });
""",
        r"""
  it('a packet a firewall blocks bursts and leaves ✕', () => {
    expect(flowLook(flow({ blocked: true }))).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });

  it('a packet that reaches no device and that no firewall stopped is lost, not blocked: it fades and leaves its own stamp', () => {
    expect(flowLook(flow({}))).toMatchObject({ end: 'lost', stamp: 'lost' });
  });

  it('an intruder is drawn as one, and its stamp says so only when it gets in', () => {
    expect(flowLook(flow({ intruder: true, reached: true }))).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(flowLook(flow({ intruder: true, blocked: true }))).toMatchObject({ intruder: true, stamp: 'blocked' });
  });
""",
    ),
    (
        r"""  it('a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion', () => {
    expect(flowLook(flow({ kind: 'forbidden', lost: true }))).toEqual({ message: 'echo-request', intruder: true, end: 'lost', stamp: 'lost' });
  });
""",
        r"""  it('a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion', () => {
    expect(flowLook(flow({ intruder: true }))).toEqual({ message: 'echo-request', intruder: true, end: 'lost', stamp: 'lost' });
  });
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/copy/packet-labels.test.ts src/game/tasks.test.ts src/scene/entities/entity-icon.test.tsx src/scene/layout.test.ts src/scene/traffic/flow-look.test.ts
```

Expected: FAIL, `Test Files 3 failed | 2 passed (5)` y `Tests 8 failed | 52 passed (60)`. Fallan:
- `stampLabel is not a function`;
- en `flow-look`, los tres casos de perdido e intruso;
- en `layout`: el borde que no se dibuja, las dos anclas (`cardAnchorPosition` todavía pide un id) y el par de grupos que se acercan (`0.72` < `0.8`).

- [ ] **Step 4: Implementar**

Contenido completo de `src/scene/traffic/CLAUDE.md`:

```markdown
# scene/traffic

Traffic: each live flow sends a packet every few seconds along the path of its trace, each packet the player sent travels once per send, and every one leaves a stamp at the end of its path, all drawn with the catalog (`@/scene/entities`). With "Sin animaciones" each path is drawn still. The stamps of flows and sent packets are spread together.

- The clock lives in `use-packet-runs.ts`: a live flow leaves on its schedule, a sent packet once for each new send number. `flow-look.ts` turns each packet's result (`intruder`, `reached`, `replied`, `blocked`) into its look (its message, whether it is an intruder, how its run ends) and the state of its stamp. Only a firewall blocks: a packet that reaches no device and that no firewall stopped is lost. Nothing here decides whether a packet gets in.
- Not here: deciding whether a packet gets in (`src/engine/`, run by `src/game/`), the shape of a packet or a stamp (`src/scene/entities/`), piece labels and the task card anchor (`src/scene/overlay/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
```


Contenido completo de `src/scene/traffic/flow-look.ts`:

```ts
import { packetMessage, type PacketMessage, type StampState } from '@/copy';
import type { PacketSpec } from '@/engine';
import type { PacketEnd } from '@/scene/entities';

export interface FlowResult {
  packet: PacketSpec;
  intruder: boolean;
  reached: boolean;
  replied: boolean;
  blocked: boolean;
}

export interface FlowLook {
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
  stamp: StampState;
}

function packetEnd(flow: FlowResult): PacketEnd {
  if (flow.replied) return 'replied';
  if (flow.reached) return 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

function stampState(flow: FlowResult): StampState {
  if (flow.reached) return flow.intruder ? 'intruder' : 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

/** Turns a packet's computed result into its look and its stamp: the message it carries, whether it is an intruder, how its run ends and which stamp it leaves. Only a firewall blocks: a packet that reaches no device and that no firewall stopped is lost. */
export function flowLook(flow: FlowResult): FlowLook {
  return { message: packetMessage(flow.packet), intruder: flow.intruder, end: packetEnd(flow), stamp: stampState(flow) };
}
```


Contenido completo de `src/scene/traffic/flow-traffic.tsx`:

```tsx
import { PacketRun, type PacketLook } from '@/scene/entities';
import { sendsBetween } from './schedule';
import { usePacketRuns, useSendOnce, type SendsBetween } from './use-packet-runs';

function PacketRuns({ look, sends }: { look: PacketLook; sends: SendsBetween }) {
  const runs = usePacketRuns(look, sends);
  return (
    <>
      {runs.map((run) => (
        <PacketRun key={run.key} path={run.path} message={run.message} intruder={run.intruder} end={run.end} />
      ))}
    </>
  );
}

/** A live flow: it sends a packet every few seconds, shifted by its position among the flows. */
export function FlowTraffic({ look, index }: { look: PacketLook; index: number }) {
  return <PacketRuns look={look} sends={(from, to) => sendsBetween(from, to, index)} />;
}

/** A packet the player sent: it travels once for each send. */
export function SentTraffic({ look, send }: { look: PacketLook; send: number }) {
  return <PacketRuns look={look} sends={useSendOnce(send)} />;
}
```


Contenido completo de `src/scene/traffic/traffic.tsx`:

```tsx
import { toPlainText, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { flowLook, type FlowResult } from './flow-look';
import { FlowTraffic, SentTraffic } from './flow-traffic';

export interface MapFlow extends FlowResult {
  id: string;
  pieceId: string;
  trace: Trace;
  label: TermText;
}

export interface MapSent extends MapFlow {
  send: number;
}

/** Draws every live flow and every packet the player sent along its path, each with its stamp at the end; without animations, each path is drawn still. */
export function Traffic({ flows, sent, layout, still, onInspect }: { flows: MapFlow[]; sent: MapSent[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const packets: (MapFlow & { send?: number })[] = [...flows, ...sent];
  const paths = packets.map((packet) => pathFor(packet.trace, packet.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {packets.map((packet, index) => {
        const { stamp, ...look } = flowLook(packet);
        const moving = { path: paths[index], ...look };
        return (
          <group key={packet.id}>
            {still && <PacketTrace {...moving} />}
            {!still && (packet.send === undefined ? <FlowTraffic look={moving} index={index} /> : <SentTraffic look={moving} send={packet.send} />)}
            <StampPiece position={stamps[index]} state={stamp} name={toPlainText(packet.label)} pieceId={packet.pieceId} onInspect={onInspect} />
          </group>
        );
      })}
    </>
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
    'src/copy/incident-ui.ts',
    (
        r"""  alert: 'con alerta: entra algo prohibido',
  packet: (label: string) => `Paquete: ${label}`,
} as const;
""",
        r"""  alert: 'con alerta: entra algo prohibido',
} as const;
""",
    ),
)

edit(
    'src/copy/index.ts',
    (
        r"""export { describeReason } from './reasons';
export { OUTCOME_TEXT, endpointName, packetLabel, packetMessage } from './packet-labels';
export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';
""",
        r"""export { describeReason } from './reasons';
export { OUTCOME_TEXT, endpointName, packetLabel, packetMessage, stampLabel } from './packet-labels';
export type { StampState } from './packet-labels';
export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';
""",
    ),
)

edit(
    'src/copy/packet-labels.ts',
    (
        r"""
export const OUTCOME_TEXT: Record<Outcome, TermText> = {
""",
        r"""
export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder';

const STAMP_TEXT: Record<StampState, string> = { arrived: 'Llegó.', blocked: 'Bloqueado.', lost: 'Perdido.', intruder: 'Entró sin permiso.' };

/** Names a stamp for a screen reader: the packet it stands for and how it ended, since its mark is only drawn. */
export function stampLabel(packet: string, state: StampState): string {
  return `Paquete: ${packet}. ${STAMP_TEXT[state]}`;
}

export const OUTCOME_TEXT: Record<Outcome, TermText> = {
""",
    ),
)

edit(
    'src/game/flow-runs.ts',
    (
        r"""import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import { packetFromChips, type Flow, type FlowKind, type SendIncident, type SendMove } from '@/levels';
""",
        r"""import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Step, type Trace } from '@/engine';
import { packetFromChips, type Flow, type FlowKind, type SendIncident, type SendMove } from '@/levels';
""",
    ),
    (
        r"""  reached: boolean;
  lost: boolean;
  label: TermText;
""",
        r"""  reached: boolean;
  blocked: boolean;
  intruder: boolean;
  label: TermText;
""",
    ),
    (
        r"""
function runPacket(world: Network, id: string, packet: PacketSpec): PacketRun {
  const trace = simulate(world, packet);
""",
        r"""
function firewallStops(trace: Trace): Step[] {
  return trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop');
}

function runPacket(world: Network, id: string, packet: PacketSpec, intruder: boolean): PacketRun {
  const trace = simulate(world, packet);
""",
    ),
    (
        r"""    reached: reachesHost(trace),
    lost: trace.outcome === 'lost',
    label: packetLabel(packet, trace, world),
""",
        r"""    reached: reachesHost(trace),
    blocked: firewallStops(trace).length > 0,
    intruder,
    label: packetLabel(packet, trace, world),
""",
    ),
    (
        r"""
/** Simulates every flow on the world and returns one run per flow, in the same order. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => ({ ...runPacket(world, flow.id, flow.packet), kind: flow.kind }));
}
""",
        r"""
/** Simulates every flow on the world and returns one run per flow, in the same order; a forbidden flow's packet is an intruder. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => ({ ...runPacket(world, flow.id, flow.packet, flow.kind === 'forbidden'), kind: flow.kind }));
}
""",
    ),
    (
        r"""  const packet = packetFromChips(incident, { fromId, toId, messageId });
  return packet && { ...runPacket(world, `sent-${fromId}-${toId}-${messageId}`, packet), fromId, toId, messageId, send };
}
""",
        r"""  const packet = packetFromChips(incident, { fromId, toId, messageId });
  return packet && { ...runPacket(world, `sent-${fromId}-${toId}-${messageId}`, packet, false), fromId, toId, messageId, send };
}
""",
    ),
    (
        r"""export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => run.trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop').map((step) => step.at)));
}
""",
        r"""export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => firewallStops(run.trace).map((step) => step.at)));
}
""",
    ),
)

edit(
    'src/scene/catalog/catalog-cells.tsx',
    (
        r"""import type { ReactNode } from 'react';
import { CATALOG_TEXT, entityName, type EntityRef, type PacketMessage } from '@/copy';
import type { Actor, Device, FirewallKind, Network } from '@/engine';
""",
        r"""import type { ReactNode } from 'react';
import { CATALOG_TEXT, entityName, type EntityRef, type PacketMessage, type StampState } from '@/copy';
import type { Actor, Device, FirewallKind, Network } from '@/engine';
""",
    ),
    (
        r"""  type PacketEnd,
  type StampState,
} from '@/scene/entities';
""",
        r"""  type PacketEnd,
} from '@/scene/entities';
""",
    ),
)

edit(
    'src/scene/entities/CLAUDE.md',
    (
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.
- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?.
- An icon is the piece seen from the front, in one colour (`currentColor`, drawn with `InkIcon` from `@/scene/ink`), hidden from screen readers because the text beside it names it. Every variant and every stamp state has its own shape.
""",
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.
- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?. A stamp tells a screen reader its packet and how it ended (`stampLabel`).
- An icon is the piece seen from the front, in one colour (`currentColor`, drawn with `InkIcon` from `@/scene/ink`), hidden from screen readers because the text beside it names it. Every variant and every stamp state has its own shape.
""",
    ),
)

edit(
    'src/scene/entities/index.ts',
    (
        r"""export { StampIcon, StampPiece } from './stamp';
export type { StampState } from './stamp';
""",
        r"""export { StampIcon, StampPiece } from './stamp';
""",
    ),
)

edit(
    'src/scene/entities/stamp.tsx',
    (
        r"""import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
""",
        r"""import { Html } from '@react-three/drei';
import { stampLabel, type StampState } from '@/copy';
import { useHtmlPortal } from '@/scene/html-layer';
""",
    ),
    (
        r"""
export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder';

const STAMP_Y = 0.9;
""",
        r"""
const STAMP_Y = 0.9;
""",
    ),
    (
        r"""
/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when a firewall blocks it, ? when it is lost, and a double ring for an intruder that gets in; hovering or focusing it inspects the packet. */
export function StampPiece({ position, state, name, pieceId, onInspect }: { position: Vec2; state: StampState; name: string; pieceId: string; onInspect: OnInspect }) {
""",
        r"""
/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when a firewall blocks it, ? when it is lost, and a double ring for an intruder that gets in. A screen reader hears the packet and how it ended; hovering or focusing it inspects the packet. */
export function StampPiece({ position, state, name, pieceId, onInspect }: { position: Vec2; state: StampState; name: string; pieceId: string; onInspect: OnInspect }) {
""",
    ),
    (
        r"""    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${state}`} aria-label={name} {...inspectHandlers(pieceId, onInspect)}>
        <span aria-hidden="true">{STAMP_GLYPH[state]}</span>
""",
        r"""    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${state}`} aria-label={stampLabel(name, state)} {...inspectHandlers(pieceId, onInspect)}>
        <span aria-hidden="true">{STAMP_GLYPH[state]}</span>
""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""import { Road } from './road';
import { Traffic, type MapFlow } from './traffic/traffic';

""",
        r"""import { Road } from './road';
import { Traffic, type MapFlow, type MapSent } from './traffic/traffic';

""",
    ),
    (
        r"""  flows: MapFlow[];
  still: boolean;
""",
        r"""  flows: MapFlow[];
  sent: MapSent[];
  still: boolean;
""",
    ),
    (
        r"""
export function GameScene({ world, pieces, flows, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world, pieces.some((piece) => piece.kind === 'edge'));
""",
        r"""
export function GameScene({ world, pieces, flows, sent, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world, pieces.some((piece) => piece.kind === 'edge'));
""",
    ),
    (
        r"""      ))}
      <Traffic flows={flows} layout={layout} still={still} onInspect={onInspect} />
      {active && overlay && <CardAnchor position={cardAnchorPosition(active.anchorId, layout)}>{overlay}</CardAnchor>}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
""",
        r"""      ))}
      <Traffic flows={flows} sent={sent} layout={layout} still={still} onInspect={onInspect} />
      {active && overlay && <CardAnchor position={cardAnchorPosition(active, layout)}>{overlay}</CardAnchor>}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
""",
    ),
)

edit(
    'src/scene/layout.ts',
    (
        r"""
/** Returns where the task card of the firewall of this device is anchored. */
export function cardAnchorPosition(deviceId: string, layout: Layout): Vec3 {
  const [x, z] = layout.devices[deviceId].firewall;
  return [x, CARD_Y, z];
""",
        r"""
/** Returns where the card of a piece is anchored: beside a firewall, a device or an actor. */
export function cardAnchorPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  const [x, z] = piecePosition(piece, layout);
  return [x, CARD_Y, z];
""",
    ),
    (
        r"""
/** Returns the points the packet travels along its trace, ending where it stopped: at its own doorstep for a packet to its own IP, at the far end of the road when no device has its IP, in the internet when the internet does not deliver it. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
""",
        r"""
/** Returns the points the packet travels along its trace, ending where it stopped: at its own doorstep for a packet to its own IP, at the far end of the road when no device has its IP, in the internet when the internet does not deliver it. It crosses the edge only while the map shows the outside. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
""",
    ),
    (
        r"""  if (trace.steps.some((s) => s.reason.code === 'route-no-device')) return [...points, [layout.roadToX, layout.roadZ]];
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;
""",
        r"""  if (trace.steps.some((s) => s.reason.code === 'route-no-device')) return [...points, [layout.roadToX, layout.roadZ]];
  if (layout.outside && trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;
""",
    ),
    (
        r"""
/** Returns, in order, the indexes of the points chained to the one at `start` by gaps shorter than `STAMP_NEAR`, `start` included. */
function nearGroup(points: Vec2[], start: number): number[] {
  const group = [start];
  for (const member of group) {
    points.forEach((point, index) => {
      if (!group.includes(index) && distance(point, points[member]) < STAMP_NEAR) group.push(index);
    });
  }
  return group.sort((a, b) => a - b);
}

/** Moves stamps that are close together (less than one unit apart, chained: A near B and B near C make one group) apart along the screen's horizontal (x up, z down), keeping each group centered on the average of its points. Within a group the slots go in the order of the points' screen x (x - z), ties by input index, so each stamp stays on its own side of the screen. A stamp with no close neighbour stays where it is. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  const screenX = (member: number) => points[member][0] - points[member][1];
  return points.map((_, index): Vec2 => {
    const group = nearGroup(points, index);
    const average = (axis: 0 | 1) => group.reduce((sum, member) => sum + points[member][axis], 0) / group.length;
""",
        r"""
/** Returns the group of each point: points chained by gaps shorter than `STAMP_NEAR` share one (A near B and B near C make one group). */
function nearGroups(points: Vec2[]): number[] {
  const groups = points.map((_, index) => index);
  points.forEach((point, index) => {
    points.forEach((other, otherIndex) => {
      if (groups[otherIndex] !== groups[index] && distance(point, other) < STAMP_NEAR) merge(groups, groups[index], groups[otherIndex]);
    });
  });
  return groups;
}

function merge(groups: number[], keep: number, drop: number): void {
  groups.forEach((group, index) => {
    if (group === drop) groups[index] = keep;
  });
}

/** Places each group's stamps along the screen's horizontal (x up, z down), STAMP_SPREAD apart and centered on the average of its points, in the order of the points' screen x (x - z), ties by input index. */
function placeGroups(points: Vec2[], groups: number[]): Vec2[] {
  const screenX = (member: number) => points[member][0] - points[member][1];
  return points.map((_, index): Vec2 => {
    const group = points.flatMap((__, member) => (groups[member] === groups[index] ? [member] : []));
    const average = (axis: 0 | 1) => group.reduce((sum, member) => sum + points[member][axis], 0) / group.length;
""",
    ),
    (
        r"""    return [average(0) + shift, average(1) - shift];
  });
}
""",
        r"""    return [average(0) + shift, average(1) - shift];
  });
}

/** Returns two stamps of different groups that ended up closer than `STAMP_NEAR`, or null when there are none. */
function closePair(stamps: Vec2[], groups: number[]): [number, number] | null {
  for (let a = 0; a < stamps.length; a++) {
    for (let b = a + 1; b < stamps.length; b++) {
      if (groups[a] !== groups[b] && distance(stamps[a], stamps[b]) < STAMP_NEAR) return [a, b];
    }
  }
  return null;
}

/** Moves stamps that are close together apart along the screen's horizontal, so no two end up closer than `STAMP_NEAR`: points chained by gaps shorter than `STAMP_NEAR` form a group spread around its average, and two groups whose spread stamps come too close join into one. Each stamp keeps its side of the screen within its group; a stamp with no close neighbour stays where it is. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  const groups = nearGroups(points);
  for (;;) {
    const stamps = placeGroups(points, groups);
    const pair = closePair(stamps, groups);
    if (!pair) return stamps;
    merge(groups, groups[pair[0]], groups[pair[1]]);
  }
}
""",
    ),
)

edit(
    'src/scene/traffic/use-packet-runs.ts',
    (
        r"""import type { PacketLook } from '@/scene/entities';
import { runSeconds, sendsBetween } from './schedule';

""",
        r"""import type { PacketLook } from '@/scene/entities';
import { runSeconds } from './schedule';

""",
    ),
    (
        r"""
/** Sends a packet with the latest look once per period and forgets it when it finishes; packets already travelling keep the look they started with. */
export function usePacketRuns(look: PacketLook, flowIndex: number): Run[] {
  const [runs, setRuns] = useState<Run[]>([]);
""",
        r"""
export type SendsBetween = (from: number, to: number) => boolean;

/** Sends a packet with the latest look whenever `sendsBetween` says one leaves in the last frame, and forgets it when it finishes; packets already travelling keep the look they started with. */
export function usePacketRuns(look: PacketLook, sendsBetween: SendsBetween): Run[] {
  const [runs, setRuns] = useState<Run[]>([]);
""",
    ),
    (
        r"""    clock.current = now;
    const sends = sendsBetween(from, now, flowIndex);
    if (!sends && !runs.some((run) => run.endsAt <= now)) return;
""",
        r"""    clock.current = now;
    const sends = sendsBetween(from, now);
    if (!sends && !runs.some((run) => run.endsAt <= now)) return;
""",
    ),
    (
        r"""  return runs;
}
""",
        r"""  return runs;
}

/** Returns a check for `usePacketRuns` that says yes once for each new send number, so each send of the player leaves one packet. */
export function useSendOnce(send: number): SendsBetween {
  const seen = useRef(0);
  return () => {
    if (seen.current === send) return false;
    seen.current = send;
    return true;
  };
}
""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""          flows={session.runs}
          still={still}
""",
        r"""          flows={session.runs}
          sent={session.sent}
          still={still}
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 559 passed (559)` en 44 archivos; `git diff` sin salida; `pnpm check` PASS. Playwright sigue en 14, y la captura de `#/entidades` no cambia: los sellos del catálogo no se reparten y su aspecto es el mismo.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(scene): send each packet of the player once, and tell a blocked packet from a lost one"
```

---

### Task 6: La terminal en la vista del juego, y la caja de los paquetes enviados (G7)

`game/view` calcula lo que la terminal muestra:
- **`terminalCard(session, pieceId)`:** la terminal de una pieza de origen. Trae su título, las bandejas con algo que elegir, las fichas fijas y dónde está cada origen. Es `null` para cualquier otra pieza o en un incidente `filter`.
- **`terminalLine(session, picks)`:** el comando `ping <IP>` para un Echo Request, o el paquete armado a mano para otro mensaje. Es `null` mientras falte una ficha.
- **Las piezas de origen** se abren (`configurable`) y no llevan candado.
- **La caja** inspecciona también los paquetes enviados y suma el campo «Mensaje» cuando se conoce `echo-request`.
- **G7:** el borde e internet no se inspeccionan mientras no se dibujan; `showsOutside` es la regla única.

**Files:**
- Create: `src/game/view/terminal-card.ts`
- Modify: `src/game/view/pieces.ts`, `src/game/view/inspection.ts`, `src/game/index.ts`, `src/copy/incident-ui.ts`, `src/copy/packet-labels.ts`, `src/copy/index.ts`, `src/game/view/CLAUDE.md`, `src/testing/incidents.ts` (el incidente de prueba conoce `echo-request`)
- Test: `src/game/view/terminal-card.test.ts` (nuevo), `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/ladder.test.ts`

**Interfaces:**
- Consumes: `Session` (con `sent`) y `SendIncident`; `endpointName`.
- Produces:
  - **Desde `@/game`:**
    - `terminalCard(session, pieceId): TerminalCard | null` y `terminalLine(session, picks: Partial<SendPicks>): TermText | null`;
    - los tipos `TerminalCard = { fromId, title, trays: SendTray[], fixed: Partial<SendPicks>, origins: Record<chipId, pieceId> }`, `SendTray = { name: 'from' | 'to' | 'message'; chips: Chip[] }` y `SendPicks = Record<'from' | 'to' | 'message', string>`.
  - **Dentro de `game/view`:** `originPieces(session)` y `showsOutside(world)`.
  - **Desde `@/copy`:** `TERMINAL_TEXT` (`title`, `trays`, `ping`, `handmade`, `incomplete`, `send`), `INSPECTION_TEXT.message` y `messageLabel(message)`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 5**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 559 passed (559)`.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/game/view/terminal-card.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, type SendIncident } from '@/levels';
import { sendIncident } from '@/testing';
import { startSession, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';
import { terminalCard, terminalLine } from './terminal-card';

const SENDING = sendIncident();
const session = startSession([SENDING], SENDING.id);
const YOURS = PIECE_ID.device('your-laptop');

function withTrays(send: Partial<SendIncident['send']>): Session {
  const incident = { ...SENDING, send: { ...SENDING.send, ...send } };
  return startSession([incident], incident.id);
}

describe('terminalCard', () => {
  it('opens from an origin with its title, the origin, every tray with a choice and where each origin sits', () => {
    expect(terminalCard(session, YOURS)).toEqual({
      fromId: 'you',
      title: 'Terminal de [[your-laptop]]',
      trays: [
        { name: 'from', chips: [{ id: 'you', label: '[[your-laptop]]' }, { id: 'attacker', label: '[[Atacante]]' }] },
        { name: 'to', chips: [{ id: 'printer', label: '192.168.1.20' }, { id: 'lucia', label: '192.168.1.11' }, { id: 'nobody', label: '192.168.1.30' }] },
        { name: 'message', chips: [{ id: 'ping', label: '{{ping}}' }, { id: 'reply', label: '{{echo-reply}}' }] },
      ],
      fixed: {},
      origins: { you: YOURS, attacker: PIECE_ID.actor('attacker') },
    });
  });

  it('opens from an actor that is an origin too', () => {
    expect(terminalCard(session, PIECE_ID.actor('attacker'))?.fromId).toBe('attacker');
  });

  it('a tray with a single chip is fixed: it is not shown and its chip is always picked', () => {
    const card = terminalCard(withTrays({ from: [SENDING.send.from[0]], message: [SENDING.send.message[0]] }), YOURS);
    expect(card?.trays.map((tray) => tray.name)).toEqual(['to']);
    expect(card?.fixed).toEqual({ from: 'you', message: 'ping' });
  });

  it('is null for a piece that is not an origin, and in an incident that does not send', () => {
    expect(terminalCard(session, PIECE_ID.device('printer'))).toBeNull();
    expect(terminalCard(startSession(INCIDENTS, '04-01'), PIECE_ID.device('servidor1'))).toBeNull();
  });
});

describe('terminalLine', () => {
  it('an Echo Request is the real ping command', () => {
    expect(terminalLine(session, { to: 'printer', message: 'ping' })).toBe('ping 192.168.1.20');
  });

  it('an Echo Reply is a packet made by hand: no common command sends it', () => {
    expect(terminalLine(session, { to: 'lucia', message: 'reply' })).toBe('paquete armado a mano: {{echo-reply}} → 192.168.1.11');
  });

  it('is null until an address and a message are picked', () => {
    expect(terminalLine(session, { to: 'printer' })).toBeNull();
    expect(terminalLine(session, { message: 'ping' })).toBeNull();
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
    'src/game/view/inspection.test.ts',
    (
        r"""import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
""",
        r"""import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
""",
    ),
    (
        r"""const WHAT_IS = 'Qué es';
const ATTACKER_BLOCKED = ['Resultado', 'No llegó: no volvió ninguna respuesta.'];
""",
        r"""const WHAT_IS = 'Qué es';
const ECHO_REQUEST = ['Mensaje', 'ICMP · Echo Request'];
const ATTACKER_BLOCKED = ['Resultado', 'No llegó: no volvió ninguna respuesta.'];
""",
    ),
    (
        r"""        whatIs('echo-request'),
        ATTACKER_BLOCKED,
""",
        r"""        whatIs('echo-request'),
        ECHO_REQUEST,
        ATTACKER_BLOCKED,
""",
    ),
    (
        r"""  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([whatIs('echo-request'), ['Resultado', 'Llegó y volvió la respuesta.']]);
  });
""",
        r"""  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([whatIs('echo-request'), ECHO_REQUEST, ['Resultado', 'Llegó y volvió la respuesta.']]);
  });
""",
    ),
    (
        r"""
  it('the internet says what it does, with no definition while its term does not exist', () => {
""",
        r"""
  it('the edge and the internet show nothing while nobody is outside, as they are not on the map', () => {
    const alone: Session = { ...office, world: { ...office.world, actors: [] } };
    expect(inspect(alone, PIECE_ID.edge)).toBeNull();
    expect(inspect(alone, PIECE_ID.internet)).toBeNull();
  });

  it('a packet the player sent is inspected like a flow: an Echo Reply names its message and says it arrived and nobody answers it', () => {
    const sending = sendIncident();
    const start = startSession([sending], sending.id);
    const sent = sessionReducer(start, { type: 'sendPacket', fromId: 'you', toId: 'lucia', messageId: 'reply' });
    const [packet] = sent.sent;
    expect(plain(inspect(sent, packet.pieceId))).toEqual({
      title: 'Echo Reply de your-laptop a lucia-laptop',
      fields: [
        whatIs('echo-reply'),
        ['Mensaje', 'ICMP · Echo Reply'],
        ['Resultado', 'Llegó, pero nadie contestó.'],
        ['Dónde y por qué se detuvo', 'Un Echo Reply es una respuesta: llegó, y nadie lo contesta.'],
      ],
    });
    expect(inspect(sent, packet.pieceId)?.entity).toEqual({ kind: 'packet', variant: 'echo-reply', intruder: false });
  });

  it('the internet says what it does, with no definition while its term does not exist', () => {
""",
    ),
)

edit(
    'src/game/view/ladder.test.ts',
    (
        r"""import { pieceViews, type PieceKind } from './pieces';

""",
        r"""import { pieceViews, type PieceKind } from './pieces';
import { terminalCard, terminalLine } from './terminal-card';

""",
    ),
    (
        r"""
function shownTexts(session: Session): TermText[] {
  const pieces = pieceViews(session);
  const ids = [...pieces.map((piece) => piece.id), ...session.runs.map((run) => run.pieceId)];
  const inspected = ids.flatMap((id) => {
""",
        r"""
function terminalTexts(session: Session, pieceIds: string[]): TermText[] {
  return pieceIds.flatMap((id) => {
    const card = terminalCard(session, id);
    if (!card) return [];
    const lines = session.sent.flatMap((packet) => terminalLine(session, { to: packet.toId, message: packet.messageId }) ?? []);
    return [card.title, ...card.trays.flatMap((tray) => tray.chips.map((chip) => chip.label)), ...lines];
  });
}

function shownTexts(session: Session): TermText[] {
  const pieces = pieceViews(session);
  const packets = [...session.runs, ...session.sent];
  const ids = [...pieces.map((piece) => piece.id), ...packets.map((packet) => packet.pieceId)];
  const inspected = ids.flatMap((id) => {
""",
    ),
    (
        r"""  });
  return [...pieces.map((piece) => piece.label), ...session.runs.map((run) => run.label), ...inspected];
}
""",
        r"""  });
  return [...pieces.map((piece) => piece.label), ...packets.map((packet) => packet.label), ...inspected, ...terminalTexts(session, ids)];
}
""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
""",
        r"""import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
""",
    ),
    (
        r"""
  it('shows no router and no internet while nobody is outside the office', () => {
""",
        r"""
  it('in a send incident, every origin opens its terminal and has no lock; the other devices stay locked', () => {
    const sending = sendIncident();
    const opening = pieceViews(startSession([sending], sending.id)).map(({ id, locked, configurable }) => ({ id, locked, configurable }));
    expect(opening).toContainEqual({ id: PIECE_ID.device('your-laptop'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.actor('attacker'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.device('printer'), locked: true, configurable: false });
  });

  it('shows no router and no internet while nobody is outside the office', () => {
""",
    ),
)

edit(
    'src/testing/incidents.ts',
    (
        r"""    concept: 'concepts/una-nota.md',
    introduces: ['ping', 'echo-reply'],
    base: officeNet(),
""",
        r"""    concept: 'concepts/una-nota.md',
    introduces: ['ping', 'echo-request', 'echo-reply'],
    base: officeNet(),
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/game/view/inspection.test.ts src/game/view/ladder.test.ts src/game/view/pieces.test.ts src/game/view/terminal-card.test.ts
```

Expected: FAIL, `Test Files 4 failed (4)` y `Tests 5 failed | 21 passed (26)`. Hay tres causas:
- `terminal-card.test.ts` y `ladder.test.ts` no encuentran `./terminal-card`.
- En `inspection`, dos casos esperan el campo «Mensaje», uno espera `null` sin nadie afuera, y el paquete enviado devuelve `null`.
- En `pieces`, el origen todavía lleva candado.

- [ ] **Step 4: Implementar**

Contenido completo de `src/game/view/terminal-card.ts`:

```ts
import { TERMINAL_TEXT, endpointName, type TermText } from '@/copy';
import type { Endpoint } from '@/engine';
import type { SendIncident } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type SendTrayName = 'from' | 'to' | 'message';
export type SendPicks = Record<SendTrayName, string>;

export interface Chip {
  id: string;
  label: TermText;
}

export interface SendTray {
  name: SendTrayName;
  chips: Chip[];
}

export interface TerminalCard {
  fromId: string;
  title: TermText;
  trays: SendTray[];
  fixed: Partial<SendPicks>;
  origins: Record<string, string>;
}

const TRAY_ORDER: SendTrayName[] = ['from', 'to', 'message'];

function endpointPieceId(endpoint: Endpoint): string {
  return endpoint.kind === 'device' ? PIECE_ID.device(endpoint.id) : PIECE_ID.actor(endpoint.id);
}

function sendingIncident(session: Session): SendIncident | null {
  return session.incident.mechanic === 'send' ? session.incident : null;
}

/** Returns the piece ids where the incident's origin chips sit, by chip id; empty when the incident does not send. */
export function originPieces(session: Session): Record<string, string> {
  const incident = sendingIncident(session);
  return Object.fromEntries((incident?.send.from ?? []).map((chip) => [chip.id, endpointPieceId(chip.endpoint)]));
}

function chipsOf(incident: SendIncident, session: Session): Record<SendTrayName, Chip[]> {
  return {
    from: incident.send.from.map((chip) => ({ id: chip.id, label: endpointName(chip.endpoint, session.world) })),
    to: incident.send.to.map((chip) => ({ id: chip.id, label: chip.address })),
    message: incident.send.message.map((chip) => ({ id: chip.id, label: chip.label })),
  };
}

/** Returns what the terminal card of an origin piece shows: its title, the trays with a choice to make, and the chip of each tray that offers only one (that tray is fixed and not shown); null when the piece is not an origin of a send incident. */
export function terminalCard(session: Session, pieceId: string): TerminalCard | null {
  const incident = sendingIncident(session);
  const origin = incident?.send.from.find((chip) => endpointPieceId(chip.endpoint) === pieceId);
  if (!incident || !origin) return null;
  const chips = chipsOf(incident, session);
  return {
    fromId: origin.id,
    title: TERMINAL_TEXT.title(endpointName(origin.endpoint, session.world)),
    trays: TRAY_ORDER.filter((name) => chips[name].length > 1).map((name) => ({ name, chips: chips[name] })),
    fixed: Object.fromEntries(TRAY_ORDER.flatMap((name) => (chips[name].length === 1 ? [[name, chips[name][0].id]] : []))),
    origins: originPieces(session),
  };
}

/** Returns the line the terminal shows for an address and a message: the real ping command for an Echo Request, a packet made by hand for any other message; null until both are picked. */
export function terminalLine(session: Session, { to, message }: Partial<SendPicks>): TermText | null {
  const incident = sendingIncident(session);
  const address = incident?.send.to.find((chip) => chip.id === to)?.address;
  const picked = incident?.send.message.find((chip) => chip.id === message);
  if (!address || !picked) return null;
  return picked.icmpType === 8 ? TERMINAL_TEXT.ping(address) : TERMINAL_TEXT.handmade(picked.label, address);
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
    'src/copy/incident-ui.ts',
    (
        r"""  internetDoes: 'Lleva los paquetes de una red a otra.',
  result: 'Resultado',
""",
        r"""  internetDoes: 'Lleva los paquetes de una red a otra.',
  message: 'Mensaje',
  result: 'Resultado',
""",
    ),
    (
        r"""
export const EXPLANATION_TEXT = {
""",
        r"""
export const TERMINAL_TEXT = {
  title: (origin: TermText): TermText => `Terminal de ${origin}`,
  trays: { from: 'Origen', to: 'Destino', message: 'Mensaje' },
  ping: (address: string): TermText => `ping ${address}`,
  handmade: (message: TermText, address: string): TermText => `paquete armado a mano: ${message} → ${address}`,
  incomplete: 'Elige una ficha de cada bandeja.',
  send: 'Enviar',
} as const;

export const EXPLANATION_TEXT = {
""",
    ),
)

edit(
    'src/copy/index.ts',
    (
        r"""export { describeReason } from './reasons';
export { OUTCOME_TEXT, endpointName, packetLabel, packetMessage, stampLabel } from './packet-labels';
export type { StampState } from './packet-labels';
export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';
export { ACTOR_ROLE_TEXT, EXPLANATION_TEXT, INSPECTION_TEXT, LUCIA_TEXT, MAP_TEXT, RESULT_TEXT, SCREEN_TEXT, TASK_CARD_TEXT } from './incident-ui';
""",
        r"""export { describeReason } from './reasons';
export { OUTCOME_TEXT, endpointName, messageLabel, packetLabel, packetMessage, stampLabel } from './packet-labels';
export type { StampState } from './packet-labels';
export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';
export { ACTOR_ROLE_TEXT, EXPLANATION_TEXT, INSPECTION_TEXT, LUCIA_TEXT, MAP_TEXT, RESULT_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT } from './incident-ui';
""",
    ),
)

edit(
    'src/copy/packet-labels.ts',
    (
        r"""
/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to. */
""",
        r"""
/** Names an ICMP message by its protocol and its type, with both terms tagged. */
export function messageLabel(message: PacketMessage): TermText {
  return `{{icmp}} · {{${message}}}`;
}

/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to. */
""",
    ),
)

edit(
    'src/game/index.ts',
    (
        r"""export { pieceViews } from './view/pieces';
""",
        r"""export { pieceViews } from './view/pieces';
export { terminalCard, terminalLine } from './view/terminal-card';
export type { Chip, SendPicks, SendTray, SendTrayName, TerminalCard } from './view/terminal-card';
""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""
What the map and the panels show, computed from the session: piece ids, piece labels and locks, a firewall's rules named by chips (`firewall-card.ts`), and the inspection box.

""",
        r"""
What the map and the panels show, computed from the session: piece ids, piece labels and locks, a firewall's rules named by chips (`firewall-card.ts`), the terminal of an origin (`terminal-card.ts`) and the inspection box.

""",
    ),
    (
        r"""- Every piece has a state, read from the runs: a device is `intruded` while a forbidden flow reaches it, a firewall is `blocking` while its device's firewalls stop a flow, and every other piece is `normal`.
- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
""",
        r"""- Every piece has a state, read from the runs: a device is `intruded` while a forbidden flow reaches it, a firewall is `blocking` while its device's firewalls stop a flow, and every other piece is `normal`.
- Every inspection field declares the term it uses; a field whose term is not known yet is left out. A packet shows its message once Echo Request is known; a packet the player sent is inspected like a flow's. The edge and the internet are inspected only while they are on the map.
- In a send incident, every origin of its chips (a device or an actor) opens its terminal and has no lock. The terminal shows the trays with a choice to make; a tray with a single chip is fixed, not shown, and its chip is always picked. Its line is the real `ping` command for an Echo Request and a packet made by hand for any other message: no common command sends a lone Echo Reply.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, nameTag, packetMessage, type EntityRef, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Device, type Firewall, type FirewallKind, type PacketSpec } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
""",
        r"""import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, messageLabel, nameTag, packetMessage, type EntityRef, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Device, type Firewall, type FirewallKind, type PacketSpec } from '@/engine';
import type { PacketRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
""",
    ),
    (
        r"""import { parsePieceId } from './piece-id';

""",
        r"""import { parsePieceId } from './piece-id';
import { showsOutside } from './pieces';

""",
    ),
    (
        r"""
function packet(session: Session, run: FlowRun): Inspection {
  const step = stopStep(run.trace);
  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.kind === 'forbidden' },
    title: run.label,
    fields: [
      ...visible(definition(packetTerm(run.packet)), session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
""",
        r"""
function messageField(packet: PacketSpec): FieldSpec[] {
  return packet.protocol === 'icmp' ? [{ term: 'echo-request', label: INSPECTION_TEXT.message, lines: () => [messageLabel(packetMessage(packet))] }] : [];
}

function packet(session: Session, run: PacketRun): Inspection {
  const step = stopStep(run.trace);
  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.intruder },
    title: run.label,
    fields: [
      ...visible([...definition(packetTerm(run.packet)), ...messageField(run.packet)], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
""",
    ),
    (
        r"""
/** Returns what the inspection box shows for a piece or a packet, starting with what it is, or null when the id names nothing on the map. */
export function inspect(session: Session, pieceId: string): Inspection | null {
""",
        r"""
/** Returns what the inspection box shows for a piece, a flow's packet or a packet the player sent, starting with what it is, or null when the id names nothing on the map (the edge and the internet are not on it while nobody is outside). */
export function inspect(session: Session, pieceId: string): Inspection | null {
""",
    ),
    (
        r"""  if (!ref) return null;
  if (ref.kind === 'edge') return edge(session);
  if (ref.kind === 'internet') return internet(session);
  const { world, runs } = session;
  switch (ref.kind) {
""",
        r"""  if (!ref) return null;
  const { world, runs, sent } = session;
  if (ref.kind === 'edge' || ref.kind === 'internet') {
    if (!showsOutside(world)) return null;
    return ref.kind === 'edge' ? edge(session) : internet(session);
  }
  switch (ref.kind) {
""",
    ),
    (
        r"""    case 'packet': {
      const found = runs.find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
""",
        r"""    case 'packet': {
      const found = [...runs, ...sent].find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
""",
    ),
)

edit(
    'src/game/view/pieces.ts',
    (
        r"""import { MAP_TEXT, entityTerm, nameTag, type EntityRef, type TermId, type TermText } from '@/copy';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
""",
        r"""import { MAP_TEXT, entityTerm, nameTag, type EntityRef, type TermId, type TermText } from '@/copy';
import type { Network } from '@/engine';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
""",
    ),
    (
        r"""import { PIECE_ID } from './piece-id';

""",
        r"""import { PIECE_ID } from './piece-id';
import { originPieces } from './terminal-card';

""",
    ),
    (
        r"""
function outside(session: Session): PieceView[] {
  const { world } = session;
  if (world.actors.length === 0) return [];
  return [
""",
        r"""
/** True while the map shows the outside of the network, its edge and the internet: only while someone is out there. */
export function showsOutside(world: Network): boolean {
  return world.actors.length > 0;
}

function outside(session: Session): PieceView[] {
  const { world } = session;
  if (!showsOutside(world)) return [];
  return [
""",
    ),
    (
        r"""
/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state; the edge and the internet show only when someone is outside the network. */
export function pieceViews(session: Session): PieceView[] {
""",
        r"""
/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state. A firewall opens its rules; a device or an actor that is an origin of a send incident opens its terminal. The edge and the internet show only when someone is outside the network. */
export function pieceViews(session: Session): PieceView[] {
""",
    ),
    (
        r"""  const intruded = intrudedDeviceIds(session.runs);
  return [
    ...world.devices.map((device) =>
      piece(
        { kind: 'device', variant: device.kind },
        { id: PIECE_ID.device(device.id), anchorId: device.id, label: nameTag(device.name), locked: !parts.hostSettings, configurable: false, state: intruded.has(device.id) ? 'intruded' : 'normal' },
      ),
    ),
    ...firewalls(session),
    ...world.actors.map((actor) =>
      piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: nameTag(actor.name), locked: false, configurable: false, state: 'normal' }),
    ),
    ...outside(session),
""",
        r"""  const intruded = intrudedDeviceIds(session.runs);
  const origins = new Set(Object.values(originPieces(session)));
  return [
    ...world.devices.map((device) => {
      const id = PIECE_ID.device(device.id);
      const sends = origins.has(id);
      return piece(
        { kind: 'device', variant: device.kind },
        { id, anchorId: device.id, label: nameTag(device.name), locked: !parts.hostSettings && !sends, configurable: sends, state: intruded.has(device.id) ? 'intruded' : 'normal' },
      );
    }),
    ...firewalls(session),
    ...world.actors.map((actor) => {
      const id = PIECE_ID.actor(actor.id);
      return piece({ kind: 'actor', variant: actor.kind }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: false, configurable: origins.has(id), state: 'normal' });
    }),
    ...outside(session),
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 569 passed (569)` en 45 archivos; `git diff` sin salida; `pnpm check` PASS (14 de Playwright).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(game): compute the terminal of an origin and inspect the packets the player sent"
```

---

### Task 7: Interfaz: la tarjeta terminal, con el marco y la bandeja compartidos

La tarjeta de reglas y la terminal se arman con las mismas piezas, en `src/ui/incident/map-cards/`:
- **`ChipCard`:** el diálogo con su título (con el foco al abrirse), Esc y «Listo».
- **`ChipTray`:** una bandeja de fichas.
- **`TaskCard`:** se muda ahí y usa las dos.
- **`TerminalCard`** (nueva):
  - elige una ficha de cada bandeja que se ve;
  - muestra la línea en la ranura (`.slot`, `code`);
  - envía con «Enviar», desactivado hasta tener todas las fichas;
  - al elegir otro origen, pide a la pantalla que la mueva junto a él, y conserva las otras fichas.

La pantalla decide qué tarjeta abre: la de reglas para un firewall, la terminal para un origen. La clase `.task-card` pasa a ser `.chip-card` y el botón compartido gana el estado `:disabled`. Ver «Elementos de interfaz».

**Files:**
- Create: `src/ui/incident/map-cards/CLAUDE.md`, `src/ui/incident/map-cards/chip-card.tsx`, `src/ui/incident/map-cards/terminal-card.tsx`
- Move: `src/ui/incident/task-card.tsx` → `src/ui/incident/map-cards/task-card.tsx` (y se edita); `src/ui/incident/task-card.test.tsx` → `src/ui/incident/map-cards/task-card.test.tsx` (sin cambios)
- Modify: `src/ui/incident/incident-screen.tsx`, `src/styles.css`, `src/ui/incident/CLAUDE.md`
- Test: `src/ui/incident/map-cards/terminal-card.test.tsx` (nuevo), `src/ui/incident/incident-screen.test.tsx`

**Interfaces:**
- Consumes: `terminalCard`, `terminalLine`, `TerminalCard`, `SendPicks`, `SendTrayName` y `firewallCard` de `@/game`; `TERMINAL_TEXT` y `TASK_CARD_TEXT` de `@/copy`; `useFocusOnMount`.
- Produces:
  - `ChipCard({ title, heading, onClose, children })` y `ChipTray({ name, chips, picked, onPick })`;
  - `TerminalCard({ card, describe, onPickOrigin, onSend, onClose })`;
  - las clases `.chip-card` (antes `.task-card`) y `.btn:disabled`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 6**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 569 passed (569)`.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/ui/incident/map-cards/terminal-card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { startSession, terminalCard, terminalLine } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { sendIncident } from '@/testing/incidents';
import { TerminalCard } from './terminal-card';

const SENDING = sendIncident();
const SESSION = startSession([SENDING], SENDING.id);
const TITLE = 'Terminal de your-laptop';

function renderTerminal(pieceId = PIECE_ID.device('your-laptop')) {
  const card = terminalCard(SESSION, pieceId);
  if (!card) throw new Error('missing terminal');
  const handlers = { onPickOrigin: vi.fn(), onSend: vi.fn(), onClose: vi.fn() };
  const view = render(<TerminalCard card={card} describe={(picks) => terminalLine(SESSION, picks)} {...handlers} />);
  return { ...handlers, card, view };
}

describe('terminal card', () => {
  it('opens with the focus on its title, asks for a chip from each tray and cannot send yet', () => {
    renderTerminal();
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: TITLE })).toHaveTextContent(TERMINAL_TEXT.incomplete);
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
  });

  it('names its trays Origen, Destino and Mensaje, with the origin of the card picked', () => {
    renderTerminal();
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(Object.values(TERMINAL_TEXT.trays));
    expect(screen.getByRole('button', { name: 'your-laptop' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the real ping command for the picked chips and sends them with a click', async () => {
    const user = userEvent.setup();
    const { onSend } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.20' }));
    await user.click(screen.getByRole('button', { name: 'ping' }));
    expect(screen.getByRole('dialog', { name: TITLE }).querySelector('code')).toHaveTextContent('ping 192.168.1.20');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(onSend).toHaveBeenCalledWith({ from: 'you', to: 'printer', message: 'ping' });
  });

  it('shows an Echo Reply as a packet made by hand, without inventing a command', async () => {
    const user = userEvent.setup();
    renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Echo Reply' }));
    expect(screen.getByRole('dialog', { name: TITLE }).querySelector('code')).toHaveTextContent('paquete armado a mano: Echo Reply → 192.168.1.11');
  });

  it('picks and sends with the keyboard', async () => {
    const user = userEvent.setup();
    const { onSend } = renderTerminal();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: '192.168.1.20' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'ping' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith({ from: 'you', to: 'printer', message: 'ping' });
  });

  it('picking another origin asks to move the card, and the other picks stay when it moves', async () => {
    const user = userEvent.setup();
    const { onPickOrigin, view } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Atacante' }));
    expect(onPickOrigin).toHaveBeenCalledWith('attacker');
    const moved = terminalCard(SESSION, PIECE_ID.actor('attacker'));
    if (!moved) throw new Error('missing terminal');
    view.rerender(<TerminalCard card={moved} describe={(picks) => terminalLine(SESSION, picks)} onPickOrigin={vi.fn()} onSend={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Atacante' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '192.168.1.11' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderTerminal();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
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
    'src/ui/incident/incident-screen.test.tsx',
    (
        r"""import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { IncidentScreen } from './incident-screen';
""",
        r"""import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';
""",
    ),
    (
        r"""  return {
    GameScene: ({ pieces, flows, overlay, onInspect, onActivate }: GameSceneProps) => (
      <div>
""",
        r"""  return {
    GameScene: ({ pieces, flows, sent, overlay, onInspect, onActivate }: GameSceneProps) => (
      <div>
""",
    ),
    (
        r"""        ))}
        {flows.map((flow) => (
          <button key={flow.id} type="button" onFocus={() => onInspect(flow.pieceId)}>
""",
        r"""        ))}
        {[...flows, ...sent].map((flow) => (
          <button key={flow.id} type="button" onFocus={() => onInspect(flow.pieceId)}>
""",
    ),
    (
        r"""  });
});
""",
        r"""  });
});

describe('incident screen of a send incident', () => {
  const SENDING = sendIncident();
  const TERMINAL = 'Terminal de your-laptop';

  function renderSending() {
    render(<IncidentScreen incidents={[SENDING]} incidentId={SENDING.id} nextId={null} onFinish={vi.fn()} />);
  }

  function terminal(): HTMLElement {
    return screen.getByRole('dialog', { name: /^Terminal de/ });
  }

  async function send(user: User, address: string, message: string) {
    await user.click(within(terminal()).getByRole('button', { name: address }));
    await user.click(within(terminal()).getByRole('button', { name: message }));
    await user.click(within(terminal()).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('your laptop opens its terminal, and a packet sent from it shows up and can be inspected', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    expect(screen.getByRole('dialog', { name: TERMINAL })).toBeInTheDocument();
    await send(user, '192.168.1.20', 'ping');
    await user.click(screen.getByRole('button', { name: 'ping de your-laptop a printer' }));
    expect(screen.getByRole('region', { name: 'ping de your-laptop a printer' })).toHaveTextContent('Llegó y volvió la respuesta.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(LUCIA_TEXT.done);
  });

  it('picking another origin moves the terminal beside it, and Esc gives the focus back to the piece it stands beside', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    await user.click(within(terminal()).getByRole('button', { name: 'Atacante' }));
    expect(terminal()).toHaveAccessibleName('Terminal de Atacante');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Atacante' })).toHaveFocus();
  });

  it('with every send task done, Lucía asks the incident’s own question', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    await send(user, '192.168.1.20', 'ping');
    await user.click(within(terminal()).getByRole('button', { name: 'Atacante' }));
    await send(user, '192.168.1.11', 'ping');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('heading', { name: 'Lucía: «¿Por qué volvió el ping?»' })).toHaveFocus();
  });
});
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/ui/incident/incident-screen.test.tsx src/ui/incident/map-cards/terminal-card.test.tsx
```

Expected: FAIL, `Test Files 2 failed (2)` y `Tests 3 failed | 8 passed (11)`. `terminal-card.test.tsx` no encuentra `./terminal-card`, y los tres tests nuevos de la pantalla no encuentran el diálogo `Terminal de your-laptop`.

- [ ] **Step 4: Implementar**

Primero se mudan las dos tarjetas de reglas. Después se escriben los archivos nuevos y se aplica el script.

```bash
mkdir -p src/ui/incident/map-cards
git mv src/ui/incident/task-card.test.tsx src/ui/incident/map-cards/task-card.test.tsx
git mv src/ui/incident/task-card.tsx src/ui/incident/map-cards/task-card.tsx
```

Contenido completo de `src/ui/incident/map-cards/CLAUDE.md`:

```markdown
# ui/incident/map-cards

The cards that open beside a piece of the map, both built from `chip-card.tsx` (`ChipCard`: the dialog with its title, Escape and "Listo"; `ChipTray`: a named tray of chips): the task card of a firewall (`task-card.tsx`, rules from Type and Source chips) and the terminal of an origin (`terminal-card.tsx`, a packet from origin, address and message chips, its line and "Enviar").

- A card shows what `@/game` computed (`FirewallCard`, `TerminalCard`) and reports the player's picks; it never decides what a rule or a packet does.
- Both use the same classes: `card chip-card`, `tray`, `chip`, `slot` and `btn`. A new card reuses them before adding any.
- Not here: the screen that opens a card (`src/ui/incident/incident-screen.tsx`), the anchor that keeps it beside its piece (`src/scene/overlay/`).
- May import: `@/game`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`, `@/ui/incident/use-focus-on-mount`), and only types from `@/engine`.
```


Contenido completo de `src/ui/incident/map-cards/chip-card.tsx`:

```tsx
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { TaggedText } from '@/ui/tagged-text';

interface ChipCardProps {
  title: TermText;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  children: ReactNode;
}

interface ChipTrayProps {
  name: string;
  chips: { id: string; label: TermText }[];
  picked: string | null;
  onPick: (chipId: string) => void;
}

/** The card that opens beside a piece of the map: a dialog with its title, what the caller puts in it and the "Listo" button; Escape closes it too. */
export function ChipCard({ title, heading, onClose, children }: ChipCardProps) {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  return (
    <section role="dialog" aria-label={toPlainText(title)} className="card chip-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={title} />
      </h2>
      {children}
      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>
    </section>
  );
}

/** A named tray of chips, the picked one pressed; a click or Enter picks a chip. */
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
  );
}
```


Contenido completo de `src/ui/incident/map-cards/terminal-card.tsx`:

```tsx
import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import type { SendPicks, SendTrayName, TerminalCard as Terminal } from '@/game';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, ChipTray } from './chip-card';

interface TerminalCardProps {
  card: Terminal;
  describe: (picks: Partial<SendPicks>) => TermText | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
  onClose: () => void;
}

/** The terminal of an origin: a chip from each tray it shows, the line those chips make (the real ping command, or a packet made by hand) and "Enviar". Picking another origin moves the card beside it; the other picks stay. */
export function TerminalCard({ card, describe, onPickOrigin, onSend, onClose }: TerminalCardProps) {
  const [picks, setPicks] = useState<Partial<SendPicks>>(card.fixed);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const chosen: Partial<SendPicks> = { ...picks, from: card.fromId };
  const line = describe(chosen);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else setPicks({ ...picks, [tray]: chipId });
  };
  const send = () => {
    if (chosen.to && chosen.message) onSend({ from: card.fromId, to: chosen.to, message: chosen.message });
  };
  return (
    <ChipCard title={card.title} heading={heading} onClose={onClose}>
      <p className="slot" aria-live="polite">
        {line ? (
          <code>
            <TaggedText text={line} />
          </code>
        ) : (
          <span className="slot__empty">{TERMINAL_TEXT.incomplete}</span>
        )}
      </p>
      {card.trays.map((tray) => (
        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={tray.chips} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
      ))}
      <button type="button" className="btn btn--primary" disabled={!line} onClick={send}>
        {TERMINAL_TEXT.send}
      </button>
    </ChipCard>
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
    'src/styles.css',
    (
        r""".btn--small { padding: 0.2rem 0.5rem; font-size: 0.8rem; box-shadow: none; }
.btn:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
""",
        r""".btn--small { padding: 0.2rem 0.5rem; font-size: 0.8rem; box-shadow: none; }
.btn:disabled { color: var(--ink-soft); background: var(--paper-shade); border-color: var(--ink-soft); box-shadow: none; cursor: default; }
.btn:disabled:active { transform: none; }
.btn:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
""",
    ),
    (
        r"""
.task-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.6rem; }
.task-card h2:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rules { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
""",
        r"""
.chip-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.6rem; }
.chip-card h2:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rules { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
""",
    ),
)

edit(
    'src/ui/incident/CLAUDE.md',
    (
        r"""
The incident screen: Lucía's card (tasks, the "Enviar solución" button and her reply, the folded glossary with this incident's new terms first, and hints), the task card of a Security Group, the inspection box, Lucía's question and the result.

""",
        r"""
The incident screen: Lucía's card (tasks, the "Enviar solución" button and her reply, the folded glossary with this incident's new terms first, and hints), the cards that open beside a piece of the map (`map-cards/`: the task card of a firewall and the terminal of an origin), the inspection box, Lucía's question (the incident's own, or «¿Qué pasó?») and the result.

""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
import type { Incident } from '@/levels';
""",
        r"""import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf, terminalCard, terminalLine } from '@/game';
import type { Incident } from '@/levels';
""",
    ),
    (
        r"""import { LuciaCard } from './lucia-card';
import { ResultCard } from './result-card';
import { TaskCard } from './task-card';

""",
        r"""import { LuciaCard } from './lucia-card';
import { TaskCard } from './map-cards/task-card';
import { TerminalCard } from './map-cards/terminal-card';
import { ResultCard } from './result-card';

""",
    ),
    (
        r"""  const card = playing && chips && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;
""",
        r"""  const card = playing && chips && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const terminal = playing && cardPieceId ? terminalCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;
""",
    ),
    (
        r"""          still={still}
          activePieceId={card ? cardPieceId : null}
          overlay={
            card &&
            chips && (
              <TaskCard
""",
        r"""          still={still}
          activePieceId={card || terminal ? cardPieceId : null}
          overlay={
            (card && chips && (
              <TaskCard
""",
    ),
    (
        r"""              />
            )
          }
""",
        r"""              />
            )) ||
            (terminal && (
              <TerminalCard
                card={terminal}
                describe={(picks) => terminalLine(session, picks)}
                onPickOrigin={(fromId) => setCardPieceId(terminal.origins[fromId])}
                onSend={({ from, to, message }) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message })}
                onClose={closeCard}
              />
            ))
          }
""",
    ),
)

edit(
    'src/ui/incident/map-cards/task-card.tsx',
    (
        r"""import { useState, type KeyboardEvent } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
""",
        r"""import { useState } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
""",
    ),
    (
        r"""import type { FromChip, WhatChip } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

""",
        r"""import type { FromChip, WhatChip } from '@/levels';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, ChipTray } from './chip-card';

""",
    ),
    (
        r"""  onClose: () => void;
}

function ChipTray({ name, chips, picked, onPick }: { name: string; chips: Chip[]; picked: string | null; onPick: (chipId: string) => void }) {
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
  );
}
""",
        r"""  onClose: () => void;
}
""",
    ),
    (
        r"""  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  const pickedWhat = chips.what.find((chip) => chip.id === slot.what);
""",
        r"""  };
  const pickedWhat = chips.what.find((chip) => chip.id === slot.what);
""",
    ),
    (
        r"""  return (
    <section role="dialog" aria-label={toPlainText(card.title)} className="card task-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={card.title} />
      </h2>
      {card.rules.length > 0 ? (
""",
        r"""  return (
    <ChipCard title={card.title} heading={heading} onClose={onClose}>
      {card.rules.length > 0 ? (
""",
    ),
    (
        r"""      <ChipTray name={TASK_CARD_TEXT.from} chips={chips.from} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />
      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>
    </section>
  );
""",
        r"""      <ChipTray name={TASK_CARD_TEXT.from} chips={chips.from} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />
    </ChipCard>
  );
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 579 passed (579)` en 46 archivos; `git diff` sin salida; `pnpm check` PASS. En Playwright siguen los 14, y la tarjeta del Security Group del 04-01 se ve igual.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(ui): open a terminal beside an origin, built from the same card and tray as the rules card"
```

---

### Task 8: El capítulo 1, primera parte: 01-01 y 01-02

Llegan la carpeta `src/levels/01-first-day/` y los dos primeros incidentes `send`, con sus 12 términos. Cuatro términos se redefinen: ping, ICMP, Echo Request y Echo Reply.

1. **Los términos y sus íconos.**
   - La red de la oficina es `network`, y la laptop y la impresora, `device`.
   - El ícono de `device` es la laptop, y el de `packet`, el Echo Request.
2. **El capítulo 4** deja de introducir ping, ICMP, Echo Request y Echo Reply. La IP privada llega en la Tarea 9.
3. **La prueba de fugas** compara palabras completas, sin distinguir mayúsculas (`namedTerms`).
4. **La caja de inspección:**
   - la IP de un dispositivo es su «dirección IP» hasta que se conoce «IP privada»;
   - un paquete se define como «paquete» hasta que se conoce su mensaje;
   - el motivo «perdido en la red» etiqueta sus términos.
5. **Los tests que usaban `INCIDENTS[0]` como el 04-01** lo buscan por su id.
6. **Playwright:** las pruebas del capítulo 4 abren con el capítulo 1 hecho, y el roadmap muestra 18 capítulos «próximamente».

**Files:**
- Create: `src/levels/01-first-day/CLAUDE.md`, `src/levels/01-first-day/shared.ts`, `src/levels/01-first-day/01-the-address.ts`, `src/levels/01-first-day/02-there-and-back.ts`, `tests/e2e/saved-progress.ts`
- Modify:
  - `src/copy/terms.ts`, `src/copy/incident-ui.ts`, `src/copy/reasons.ts`
  - `src/levels/ladder.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`
  - `src/game/view/inspection.ts`
  - las guías `src/copy/CLAUDE.md`, `src/game/view/CLAUDE.md` y `tests/e2e/CLAUDE.md`
- Test:
  - `src/copy/terms.test.ts`, `src/copy/reasons.test.ts`
  - `src/levels/ladder.test.ts`, `src/levels/registry.test.ts`
  - `src/game/view/inspection.test.ts`, `src/game/view/pieces.test.ts`
  - `src/ui/incident/incident-screen.test.tsx`, `src/ui/incident/lucia-card.test.tsx`
  - `tests/e2e/incidents.spec.ts`, `tests/e2e/roadmap.spec.ts`

**Interfaces:**
- Consumes: `defineIncident`, `OriginChip`, `AddressChip`, `MessageChip` (Tarea 4); `TERMS`.
- Produces:
  - **Términos:** `device`, `network`, `ip-address` (corto `IP`), `ipv4`, `packet`, `protocol`, `request` y `response`, más las definiciones nuevas de `ping`, `icmp`, `echo-request` y `echo-reply`.
  - **Íconos:** `TERM_ENTITY` suma `network`, `device` y `packet`.
  - **Incidentes:** 01-01 y 01-02 en el registro.
  - **`namedTerms(text, terms)`**, en `src/levels/ladder.ts`.
  - **Copy:** `INSPECTION_TEXT.ipAddress`.
  - **Playwright:** `startWithProgress(page, progress)` y `CHAPTER_1_DONE`, en `tests/e2e/saved-progress.ts`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 7**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 579 passed (579)`.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `tests/e2e/saved-progress.ts`:

```ts
import type { Page } from '@playwright/test';

const PROGRESS_KEY = 'follow-the-packet:progress:v1';

export const CHAPTER_1_DONE: Record<string, number> = { '01-01': 3, '01-02': 3, '01-03': 3, '01-04': 3 };

/** Opens every page of the test with this saved progress, unless the game already saved its own, so a reload keeps what the test earned. */
export async function startWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.addInitScript(
    ([key, saved]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, saved);
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
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
    'src/copy/reasons.test.ts',
    (
        r"""  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.'],
  [{ code: 'route-no-device', ip: '192.168.1.30' }, 'Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
""",
        r"""  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.'],
  [{ code: 'route-no-device', ip: '192.168.1.30' }, 'Ningún {{device|dispositivo}} de la {{network|red}} tiene esa IP: el {{packet|paquete}} no llega a nadie.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
""",
    ),
)

edit(
    'src/copy/terms.test.ts',
    (
        r"""
  it('only the Security Group has a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['security-group']);
  });
""",
        r"""
  it('only the IP address and the Security Group have a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['ip-address', 'security-group']);
  });
""",
    ),
    (
        r"""describe('entity terms', () => {
  it('names a variant by the term the ladder already has, and leaves the office ones without a term until chapter 1', () => {
    expect(entityTerm({ kind: 'device', variant: 'ec2-instance' })).toBe('ec2-instance');
""",
        r"""describe('entity terms', () => {
  it('names each variant by its term: the office ones by the general terms of chapter 1, the AWS ones by their official names', () => {
    expect(entityTerm({ kind: 'device', variant: 'ec2-instance' })).toBe('ec2-instance');
""",
    ),
    (
        r"""    expect(entityTerm({ kind: 'network', variant: 'vpc' })).toBe('vpc');
    expect(entityTerm({ kind: 'device', variant: 'laptop' })).toBeNull();
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBeNull();
""",
        r"""    expect(entityTerm({ kind: 'network', variant: 'vpc' })).toBe('vpc');
    expect(entityTerm({ kind: 'network', variant: 'office' })).toBe('network');
    expect(entityTerm({ kind: 'device', variant: 'laptop' })).toBe('device');
    expect(entityTerm({ kind: 'device', variant: 'printer' })).toBe('device');
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBeNull();
""",
    ),
    (
        r"""describe('term icons', () => {
  it('every term that names a variant shows that variant\'s entity as its icon', () => {
    const named = Object.entries(ENTITY_TERMS).flatMap(([kind, variants]) =>
      Object.entries(variants).flatMap(([variant, term]) => (term === null ? [] : [{ term, kind, variant }])),
    );
    for (const { term, kind, variant } of named) expect(TERM_ENTITY[term as TermId], term).toMatchObject({ kind, variant });
  });

  it('every icon belongs to the term that names its entity', () => {
    for (const [term, entity] of Object.entries(TERM_ENTITY)) expect(entityTerm(entity as EntityRef)).toBe(term);
  });
""",
        r"""describe('term icons', () => {
  const GENERAL_TERMS: TermId[] = ['packet'];

  it('every term that names a variant shows the entity of one of the variants it names as its icon', () => {
    const named = Object.entries(ENTITY_TERMS).flatMap(([kind, variants]) =>
      Object.entries(variants).flatMap(([, term]) => (term === null ? [] : [{ term, kind }])),
    );
    for (const { term, kind } of named) {
      const icon = TERM_ENTITY[term as TermId];
      expect(icon?.kind, term).toBe(kind);
      expect(icon && entityTerm(icon), term).toBe(term);
    }
  });

  it('every icon belongs to the term that names its entity, or to a term that names every variant of it', () => {
    for (const [term, entity] of Object.entries(TERM_ENTITY)) {
      if (!GENERAL_TERMS.includes(term as TermId)) expect(entityTerm(entity as EntityRef), term).toBe(term);
    }
    expect(TERM_ENTITY.packet).toEqual({ kind: 'packet', variant: 'echo-request' });
  });
""",
    ),
)

edit(
    'src/game/view/inspection.test.ts',
    (
        r"""  return { ...session, known: new Set([...session.known, ...terms]) };
}
""",
        r"""  return { ...session, known: new Set([...session.known, ...terms]) };
}

function knowingOnly(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set(terms) };
}
""",
    ),
    (
        r"""
  it('a laptop of the office shows its IP and its firewall, with no definition while its term does not exist', () => {
    expect(plain(inspect(office, PIECE_ID.device('lucia-laptop')))).toEqual({
      title: 'lucia-laptop',
      fields: [['IP privada', '192.168.1.11'], ['Firewall', 'firewall lucia-laptop']],
    });
  });
""",
        r"""
  it('a laptop of the office says what a device is, and shows its IP and its firewall', () => {
    expect(plain(inspect(office, PIECE_ID.device('lucia-laptop')))).toEqual({
      title: 'lucia-laptop',
      fields: [whatIs('device'), ['IP privada', '192.168.1.11'], ['Firewall', 'firewall lucia-laptop']],
    });
  });

  it('calls the IP of a device dirección IP until the term IP privada is known', () => {
    const early = knowingOnly(office, 'device', 'ip-address');
    expect(plain(inspect(early, PIECE_ID.device('printer')))?.fields).toEqual([whatIs('device'), ['dirección IP', '192.168.1.20']]);
  });

  it('defines a packet as a packet until the term of its message is known', () => {
    const early = knowingOnly(first, 'packet');
    expect(plain(inspect(early, PIECE_ID.packet(FLOWS.attackerPing.id)))?.fields[0]).toEqual(whatIs('packet'));
  });
""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""
  it('draws an office by the kind of each device and firewall, with a router as its edge, and no term for them before chapter 1', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
      { kind: 'device', variant: 'laptop', term: null, label: '[[your-laptop]]' },
      { kind: 'device', variant: 'laptop', term: null, label: '[[lucia-laptop]]' },
      { kind: 'device', variant: 'printer', term: null, label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: null, label: 'firewall [[lucia-laptop]]' },
""",
        r"""
  it('draws an office by the kind of each device and firewall, with a router as its edge, and a laptop or a printer named by the term device', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
      { kind: 'device', variant: 'laptop', term: 'device', label: '[[your-laptop]]' },
      { kind: 'device', variant: 'laptop', term: 'device', label: '[[lucia-laptop]]' },
      { kind: 'device', variant: 'printer', term: 'device', label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: null, label: 'firewall [[lucia-laptop]]' },
""",
    ),
)

edit(
    'src/levels/ladder.test.ts',
    (
        r"""import { TERMS, termsIn, unofficialNames, type TermId } from '@/copy';
import { FROM } from './04-iaas/shared';
import type { Incident } from './incident';
import { chipLabels, configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';
""",
        r"""import { TERMS, termsIn, unofficialNames, type TermId } from '@/copy';
import { filterIncident } from '@/testing';
import { FROM } from './04-iaas/shared';
import type { Incident } from './incident';
import { chipLabels, configurableParts, incidentTexts, knownTerms, namedTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';
""",
    ),
    (
        r"""const ONLY_INBOUND = { inboundRules: true, outboundRules: false, hostSettings: false };
const ALL_TERMS = Object.keys(TERMS) as TermId[];
""",
        r"""const ONLY_INBOUND = { inboundRules: true, outboundRules: false, hostSettings: false };
const NOTHING = { inboundRules: false, outboundRules: false, hostSettings: false };
const ALL_TERMS = Object.keys(TERMS) as TermId[];
""",
    ),
    (
        r"""    const unknown = ALL_TERMS.filter((term) => !known.has(term));
    const leaks = incident.introduces.flatMap((term) =>
      unknown.filter((other) => TERMS[term].definition.includes(TERMS[other].name)).map((other) => `${term} → ${other}`),
    );
    expect(leaks).toEqual([]);
  });
""",
        r"""    const unknown = ALL_TERMS.filter((term) => !known.has(term));
    const leaks = incident.introduces.flatMap((term) => namedTerms(TERMS[term].definition, unknown).map((other) => `${term} → ${other}`));
    expect(leaks).toEqual([]);
  });

  it('finds a term in a definition by whole words, ignoring case', () => {
    expect(namedTerms('Amazon Redshift guarda datos en sus redes.', ['network'])).toEqual([]);
    expect(namedTerms('Una Red de la oficina.', ['network'])).toEqual(['network']);
    expect(namedTerms('Las IPs privadas de la VPC.', ['private-ip', 'vpc'])).toEqual(['vpc']);
  });

  it('chapter 1 brings the basic terms, so 04-01 no longer introduces ping, ICMP or Echo Request, nor 04-02 Echo Reply', () => {
    const introduced = (id: string) => INCIDENTS.find((incident) => incident.id === id)?.introduces;
    expect(introduced('04-01')).not.toContain('ping');
    expect(introduced('04-01')).not.toContain('icmp');
    expect(introduced('04-01')).not.toContain('echo-request');
    expect(introduced('04-02')).not.toContain('echo-reply');
  });
""",
    ),
    (
        r"""  it('catches a text that uses a later term', () => {
    const early = { ...INCIDENTS[0], report: 'El {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
""",
        r"""  it('catches a text that uses a later term', () => {
    const early = { ...filterIncident('04-01'), report: 'El {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
""",
    ),
    (
        r"""  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, '04-01')]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, '04-02')]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('the prototype opens only inbound rules, so its solutions touch only those', () => {
    for (const incident of INCIDENTS) expect(configurableParts(knownTerms(INCIDENTS, incident.id))).toEqual(ONLY_INBOUND);
  });
""",
        r"""  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, INCIDENTS[0].id)]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, INCIDENTS[1].id)]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('chapter 1 opens no rules yet, and chapter 4 opens only inbound rules, so its solutions touch only those', () => {
    for (const incident of INCIDENTS) {
      expect(configurableParts(knownTerms(INCIDENTS, incident.id)), incident.id).toEqual(incident.chapter === 4 ? ONLY_INBOUND : NOTHING);
    }
  });
""",
    ),
)

edit(
    'src/levels/registry.test.ts',
    (
        r"""
const PROTOTYPE_IDS = ['04-01', '04-02'];
const HINT_COUNT = 2;
""",
        r"""
const PROTOTYPE_IDS = ['01-01', '01-02', '04-01', '04-02'];
const HINT_COUNT = 2;
""",
    ),
)

edit(
    'src/ui/incident/incident-screen.test.tsx',
    (
        r"""import type { GameSceneProps } from '@/scene';
import { sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';
""",
        r"""import type { GameSceneProps } from '@/scene';
import { filterIncident, sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';
""",
    ),
    (
        r"""const FULL_STARS = 3;
const FIRST = INCIDENTS[0];
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
""",
        r"""const FULL_STARS = 3;
const FIRST = filterIncident('04-01');
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
""",
    ),
    (
        r"""  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId={INCIDENTS[1].id} onFinish={onFinish} />);
  return onFinish;
""",
        r"""  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId="04-02" onFinish={onFinish} />);
  return onFinish;
""",
    ),
)

edit(
    'src/ui/incident/lucia-card.test.tsx',
    (
        r"""import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { LuciaCard } from './lucia-card';

const FIRST = INCIDENTS[0];
const FIX: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
""",
        r"""import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing/incidents';
import { LuciaCard } from './lucia-card';

const FIRST = filterIncident('04-01');
const FIX: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
""",
    ),
    (
        r"""    render(<Harness incidentId="04-02" />);
    const second = INCIDENTS[1];
    const earlier = [...startSession(INCIDENTS, second.id).known].filter((id) => !second.introduces.includes(id));
""",
        r"""    render(<Harness incidentId="04-02" />);
    const second = filterIncident('04-02');
    const earlier = [...startSession(INCIDENTS, second.id).known].filter((id) => !second.introduces.includes(id));
""",
    ),
    (
        r"""
  it('the glossary of 04-01 has no term from a later incident', () => {
    render(<Harness />);
    expect(glossary()).not.toHaveTextContent(TERMS['echo-reply'].name);
    expect(glossary()).not.toHaveTextContent(TERMS['least-privilege'].name);
""",
        r"""
  it('the glossary of 04-01 keeps the terms of chapter 1 and has none from a later incident', () => {
    render(<Harness />);
    expect(glossaryNames()).toContain(TERMS['ip-address'].name);
    expect(glossary()).not.toHaveTextContent(TERMS['least-privilege'].name);
""",
    ),
)

edit(
    'tests/e2e/incidents.spec.ts',
    (
        r"""import { collectErrors } from './console-errors';

""",
        r"""import { collectErrors } from './console-errors';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';

""",
    ),
    (
        r"""  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

async function playBoth(page: Page) {
""",
        r"""  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await startWithProgress(page, CHAPTER_1_DONE);
});

async function playBoth(page: Page) {
""",
    ),
    (
        r"""  await page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first().hover();
  await expect(tooltip).toContainText('Echo Request');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
""",
        r"""  await page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first().hover();
  await expect(tooltip).toContainText('dirección IP');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
""",
    ),
)

edit(
    'tests/e2e/roadmap.spec.ts',
    (
        r"""
const SOON_CHAPTER_COUNT = 19;

""",
        r"""
const SOON_CHAPTER_COUNT = 18;

""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/copy/reasons.test.ts src/copy/terms.test.ts src/game/view/inspection.test.ts src/game/view/pieces.test.ts src/levels/ladder.test.ts src/levels/registry.test.ts src/ui/incident/incident-screen.test.tsx src/ui/incident/lucia-card.test.tsx
```

Expected: FAIL, `Test Files 7 failed | 1 passed (8)` y `Tests 14 failed | 162 passed (176)`. Fallan:
- los términos nuevos, que todavía no existen (`Cannot read properties of undefined`);
- `namedTerms is not a function`;
- el registro, que espera 01-01 y 01-02;
- el 04-01, que todavía introduce `ping`;
- las etiquetas de la oficina, que todavía no tienen el término `device`;
- el motivo «perdido en la red», todavía sin etiquetas.

- [ ] **Step 4: Implementar**

Contenido completo de `src/levels/01-first-day/01-the-address.ts`:

```ts
import { defineIncident } from '@/levels/incident';
import { ADDRESS, BASE_WORLD, CONCEPT, LESSON, MESSAGE, ORIGIN } from './shared';

export default defineIncident({
  id: '01-01',
  chapter: 1,
  order: 1,
  title: 'La dirección',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['device', 'network', 'ip-address', 'ipv4', 'packet', 'ping'],
  base: BASE_WORLD,
  report: 'Te doy la bienvenida. Primera tarea: haz {{ping}} a la impresora desde tu laptop. Un clic en tu laptop abre su terminal.',
  tasks: [
    {
      id: 'ping-printer',
      text: 'Que tu {{ping}} a la impresora vuelva con respuesta.',
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id, outcome: 'replied' },
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.lucia, ADDRESS.nobody], message: [MESSAGE.ping] },
  hints: [
    'Tu laptop necesita la {{ip-address}} de la impresora. Pasa el mouse sobre la impresora para verla.',
    'La impresora tiene la {{ip-address|IP}} 192.168.1.20. Elígela en la terminal de tu laptop y pulsa «Enviar».',
  ],
  question: '¿Cómo supo la {{network|red}} a quién entregar tu {{packet|paquete}}?',
  explanation: [
    {
      text: 'Por la {{ip-address}} de destino que lleva el paquete.',
      feedback: 'Eso es. Cada {{packet|paquete}} lleva la IP de destino, y la red se lo entrega al {{device|dispositivo}} que tiene esa IP.',
      correct: true,
    },
    {
      text: 'Por el nombre del dispositivo.',
      feedback: 'No: el {{packet|paquete}} no lleva nombres. Lleva la {{ip-address}} de destino, y por ella lo encuentra la red.',
      correct: false,
    },
    {
      text: 'Lo mandó a todos y contestó el que quiso.',
      feedback: 'No: el {{packet|paquete}} llega solo al {{device|dispositivo}} que tiene la IP de destino. Por eso un {{ping}} a 192.168.1.30 no vuelve: nadie tiene esa IP.',
      correct: false,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id }],
  takeaway: 'Cada {{device|dispositivo}} de una {{network|red}} tiene su {{ip-address}}: en {{ipv4}}, cuatro números como 192.168.1.20. Un {{packet|paquete}} llega al que tiene la IP de destino.',
});
```


Contenido completo de `src/levels/01-first-day/02-there-and-back.ts`:

```ts
import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, LESSON, MESSAGE, ORIGIN } from './shared';

export default defineIncident({
  id: '01-02',
  chapter: 1,
  order: 2,
  title: 'Ida y vuelta',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['protocol', 'request', 'response', 'icmp', 'echo-request', 'echo-reply'],
  changes: [],
  report: 'Ahora haz que mi laptop te conteste. Esta vez también eliges el mensaje: el {{ping}} usa dos mensajes de {{icmp}}.',
  tasks: [
    {
      id: 'echo-lucia',
      text: 'Que la laptop de Lucía conteste tu {{echo-request}}.',
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id, outcome: 'replied' },
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.lucia, ADDRESS.printer], message: [MESSAGE.echoRequest, MESSAGE.echoReply] },
  hints: [
    'En {{icmp}}, cada mensaje es una {{request|solicitud}} o una {{response|respuesta}}. ¿Cuál de los dos pide que te contesten?',
    'Envía un {{echo-request}} a 192.168.1.11, la {{ip-address|IP}} de mi laptop.',
  ],
  question: 'Si me envías un {{echo-reply}}, ¿por qué no vuelve nada?',
  explanation: [
    {
      text: 'Mi laptop estaba apagada.',
      feedback: 'No: el sello ✓ muestra que tu {{echo-reply}} llegó a mi laptop. Llegó, y nadie lo contesta.',
      correct: false,
    },
    {
      text: '{{icmp}} solo funciona con impresoras.',
      feedback: 'No: {{icmp}} es un {{protocol|protocolo}} de todos los dispositivos de la red, también de mi laptop.',
      correct: false,
    },
    {
      text: 'Solo un {{echo-request}} pide respuesta: un {{echo-reply}} ya es la {{response|respuesta}}.',
      feedback: 'Eso es. En {{icmp}}, el {{echo-request}} es la {{request|solicitud}} y el {{echo-reply}}, la respuesta. Nadie contesta una respuesta.',
      correct: true,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id }],
  takeaway: 'Un {{protocol|protocolo}} dice qué mensajes existen. En {{icmp}}, el {{echo-request}} pide una {{response|respuesta}} y el {{echo-reply}} es esa respuesta: el {{ping}} usa los dos.',
});
```


Contenido completo de `src/levels/01-first-day/CLAUDE.md`:

```markdown
# levels/01-first-day

Chapter 1 (Introducción), your first day at the office with Lucía: one file per incident (`NN-<slug>.ts`, a default export built with `defineIncident`) and `shared.ts` with the chapter's lesson, the office (`192.168.1.0/24`: your laptop, Lucía's laptop and the printer) and the chips.

- 01-01 brings the base world; every later incident brings only its changes over the reference solution of the one before.
- A device's own name is its hostname (`tu-laptop`, `laptop-lucia`, `impresora`), like the `Name` of an EC2 instance: a proper name with no article, so a generated sentence reads «el firewall de laptop-lucia». The texts written here call the devices in plain Spanish («la laptop de Lucía») and do not mark their names.
- Texts tag their terms (`{{packet|paquete}}`) and use only terms introduced by this incident or an earlier one; no text names an AWS term, which arrive in chapter 4.
- Not here: the incident contract, chips and registry (`src/levels/`), visible UI text (`src/copy/`), network rules (`src/engine/`).
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`.
```


Contenido completo de `src/levels/01-first-day/shared.ts`:

```ts
import type { Device, Network } from '@/engine';
import type { AddressChip, MessageChip, OriginChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.1.0/24';

export const IP = { you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' } as const;
export const DEVICE = {
  you: { id: 'your-laptop', name: 'tu-laptop' },
  lucia: { id: 'lucia-laptop', name: 'laptop-lucia' },
  printer: { id: 'printer', name: 'impresora' },
} as const;

function officeDevice({ id, name }: { id: string; name: string }, kind: Device['kind'], privateIp: string): Device {
  return { id, name, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] } };
}

export const BASE_WORLD: Network = {
  kind: 'office',
  cidr: OFFICE_RANGE,
  devices: [officeDevice(DEVICE.you, 'laptop', IP.you), officeDevice(DEVICE.lucia, 'laptop', IP.lucia), officeDevice(DEVICE.printer, 'printer', IP.printer)],
  firewalls: [],
  edge: 'router',
  actors: [],
};

export const ORIGIN = {
  you: { id: 'you', endpoint: { kind: 'device', id: DEVICE.you.id } },
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  you: { id: 'ip-you', address: IP.you },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  printer: { id: 'ip-printer', address: IP.printer },
  nobody: { id: 'ip-nobody', address: IP.nobody },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8 },
  echoRequest: { id: 'echo-request', label: '{{icmp}} · {{echo-request}}', icmpType: 8 },
  echoReply: { id: 'echo-reply', label: '{{icmp}} · {{echo-reply}}', icmpType: 0 },
} satisfies Record<string, MessageChip>;
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
    'src/copy/CLAUDE.md',
    (
        r"""
- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1. The other way round, a term that names an entity declares the entity whose icon goes with it in `TERM_ENTITY`; a term with no entity, like `least-privilege`, has no icon. `ENTITY_REFS` lists every entity in every variant for the catalog page, and `entityName` names one as that page shows it.
- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{inbound-rule|reglas de entrada}}` shows other words. An unknown tag throws. Pieces and chips show only the name or the short form (`unofficialNames`).
""",
        r"""
- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the IP address (`IP`) and the Security Group (`SG`) have a short form.
- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants have the general terms of chapter 1 (`device`, `network`). The other way round, a term that names an entity declares the entity whose icon goes with it in `TERM_ENTITY`: a term that names several variants shows one of them, and `packet` shows an Echo Request; a term with no entity, like `least-privilege`, has no icon. `ENTITY_REFS` lists every entity in every variant for the catalog page, and `entityName` names one as that page shows it.
- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{inbound-rule|reglas de entrada}}` shows other words. An unknown tag throws. Pieces and chips show only the name or the short form (`unofficialNames`).
""",
    ),
)

edit(
    'src/copy/incident-ui.ts',
    (
        r"""  whatIs: 'Qué es',
  privateIp: '{{private-ip}}',
""",
        r"""  whatIs: 'Qué es',
  ipAddress: '{{ip-address}}',
  privateIp: '{{private-ip}}',
""",
    ),
)

edit(
    'src/copy/reasons.ts',
    (
        r"""    case 'route-no-device':
      return 'Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.';
    case 'route-private':
""",
        r"""    case 'route-no-device':
      return 'Ningún {{device|dispositivo}} de la {{network|red}} tiene esa IP: el {{packet|paquete}} no llega a nadie.';
    case 'route-private':
""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""export const TERMS = {
  'ec2-instance': {
""",
        r"""export const TERMS = {
  device: { name: 'dispositivo', definition: 'Un equipo que puede enviar y recibir datos: una laptop, una impresora, un servidor.' },
  network: { name: 'red', definition: 'Un conjunto de dispositivos conectados entre sí que pueden intercambiar datos.' },
  'ip-address': {
    name: 'dirección IP',
    short: 'IP',
    definition: 'El número que identifica a un dispositivo dentro de una red, para que los datos lleguen a él.',
  },
  ipv4: { name: 'IPv4', definition: 'La versión 4 de IP: sus direcciones son cuatro números de 0 a 255 separados por puntos, como 192.168.1.20.' },
  packet: { name: 'paquete', definition: 'Un bloque de datos que viaja por una red con la dirección IP de origen y la de destino.' },
  ping: { name: 'ping', definition: 'Un comando que manda un paquete a una dirección IP y espera que vuelva otro: prueba el camino de ida y vuelta.' },
  protocol: {
    name: 'protocolo',
    definition: 'Un acuerdo entre dispositivos sobre cómo intercambiar datos: qué mensajes existen y qué significa cada uno.',
  },
  request: { name: 'solicitud', definition: 'Un mensaje que le pide algo a otro dispositivo.' },
  response: { name: 'respuesta', definition: 'El mensaje con que un dispositivo contesta una solicitud.' },
  icmp: { name: 'ICMP', definition: 'Internet Control Message Protocol: el protocolo de los mensajes de control entre dispositivos, como los del ping.' },
  'echo-request': { name: 'Echo Request', definition: 'La solicitud ICMP del ping (tipo 8): le pide al destino que conteste con un Echo Reply.' },
  'echo-reply': { name: 'Echo Reply', definition: 'La respuesta ICMP del ping (tipo 0). Solo se envía al recibir un Echo Request, y nadie la contesta.' },
  'ec2-instance': {
""",
    ),
    (
        r"""  'private-ip': { name: 'IP privada', definition: 'La dirección IPv4 de una instancia dentro de su VPC. Desde internet no se llega a ella.' },
  ping: { name: 'ping', definition: 'Un comando que manda un ICMP Echo Request a una IP y espera la respuesta: prueba si hay camino de ida y vuelta.' },
  'security-group': {
""",
        r"""  'private-ip': { name: 'IP privada', definition: 'La dirección IPv4 de una instancia dentro de su VPC. Desde internet no se llega a ella.' },
  'security-group': {
""",
    ),
    (
        r"""  },
  icmp: { name: 'ICMP', definition: 'Internet Control Message Protocol: el protocolo de los mensajes de control entre máquinas, como los del ping.' },
  'echo-request': { name: 'Echo Request', definition: 'El mensaje ICMP de ida del ping (tipo 8): le pregunta al destino si responde.' },
  'anywhere-ipv4': {
""",
        r"""  },
  'anywhere-ipv4': {
""",
    ),
    (
        r"""  },
  'echo-reply': { name: 'Echo Reply', definition: 'El mensaje ICMP de vuelta del ping (tipo 0): la respuesta del destino.' },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Dar solo los permisos necesarios para una tarea, y solo a quien los necesita.' },
""",
        r"""  },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Dar solo los permisos necesarios para una tarea, y solo a quien los necesita.' },
""",
    ),
    (
        r"""export const ENTITY_TERMS: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermId | null> } = {
  network: { office: null, vpc: 'vpc' },
  device: { laptop: null, printer: null, 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': null, 'security-group': 'security-group' },
""",
        r"""export const ENTITY_TERMS: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermId | null> } = {
  network: { office: 'network', vpc: 'vpc' },
  device: { laptop: 'device', printer: 'device', 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': null, 'security-group': 'security-group' },
""",
    ),
    (
        r"""
/** The entity whose icon goes with each term that names one; a term left out, like least-privilege, has no icon. */
export const TERM_ENTITY: Partial<Record<TermId, EntityRef>> = {
  vpc: { kind: 'network', variant: 'vpc' },
""",
        r"""
/** The entity whose icon goes with each term that names one: a term that names several variants (device) shows the first one, and `packet`, which names every packet, shows an Echo Request. A term left out, like least-privilege, has no icon. */
export const TERM_ENTITY: Partial<Record<TermId, EntityRef>> = {
  network: { kind: 'network', variant: 'office' },
  device: { kind: 'device', variant: 'laptop' },
  packet: { kind: 'packet', variant: 'echo-request' },
  vpc: { kind: 'network', variant: 'vpc' },
""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""
- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `ec2-instance`, `security-group` and `internet-gateway` today, none yet for the office variants, and none ever for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet with an ICMP message, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message); a piece without a term has no definition.
- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.
""",
        r"""
- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `device` for a laptop or a printer, `ec2-instance`, `security-group` and `internet-gateway`, and none ever for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message, and `packet` while that one is not known); a piece without a term has no definition. A device's IP is its dirección IP until the term IP privada is known.
- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.
""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""
function packetTerm(packet: PacketSpec): TermId | null {
  return packet.protocol === 'icmp' ? entityTerm({ kind: 'packet', variant: packetMessage(packet) }) : null;
}
""",
        r"""
/** The term a packet is defined by: its ICMP message once that term is known, and the general term `packet` before. */
function packetTerm(packet: PacketSpec, known: ReadonlySet<TermId>): TermId {
  const message = packet.protocol === 'icmp' ? entityTerm({ kind: 'packet', variant: packetMessage(packet) }) : null;
  return message && known.has(message) ? message : 'packet';
}

/** The field with a device's IP: called IP privada once that term is known, and dirección IP before. */
function addressField(own: Device, known: ReadonlySet<TermId>): FieldSpec {
  const term: TermId = known.has('private-ip') ? 'private-ip' : 'ip-address';
  return { term, label: term === 'private-ip' ? INSPECTION_TEXT.privateIp : INSPECTION_TEXT.ipAddress, lines: () => [own.privateIp] };
}
""",
    ),
    (
        r"""        ...whatIs({ kind: 'device', variant: own.kind }),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [own.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
""",
        r"""        ...whatIs({ kind: 'device', variant: own.kind }),
        addressField(own, session.known),
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
""",
    ),
    (
        r"""    fields: [
      ...visible([...definition(packetTerm(run.packet)), ...messageField(run.packet)], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
""",
        r"""    fields: [
      ...visible([...definition(packetTerm(run.packet, session.known)), ...messageField(run.packet)], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
""",
    ),
)

edit(
    'src/levels/04-iaas/01-the-first-ping.ts',
    (
        r"""  concept: CONCEPT,
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'ping', 'security-group', 'inbound-rule', 'icmp', 'echo-request', 'anywhere-ipv4', 'internet-gateway'],
  base: BASE_WORLD,
""",
        r"""  concept: CONCEPT,
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'security-group', 'inbound-rule', 'anywhere-ipv4', 'internet-gateway'],
  base: BASE_WORLD,
""",
    ),
)

edit(
    'src/levels/04-iaas/02-open-just-enough.ts',
    (
        r"""  concept: CONCEPT,
  introduces: ['echo-reply', 'least-privilege'],
  changes: [
""",
        r"""  concept: CONCEPT,
  introduces: ['least-privilege'],
  changes: [
""",
    ),
)

edit(
    'src/levels/ladder.ts',
    (
        r"""import { termsIn, type TermId, type TermText } from '@/copy';
import type { Incident } from './incident';
""",
        r"""import { TERMS, termsIn, type TermId, type TermText } from '@/copy';
import type { Incident } from './incident';
""",
    ),
    (
        r"""
/** Returns, once each, the terms the texts use that are not known yet. */
""",
        r"""
function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the terms whose name the text says as whole words, ignoring case: «red» in «una Red», but not in «redes» or «Redshift». */
export function namedTerms(text: string, terms: TermId[]): TermId[] {
  return terms.filter((term) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeForPattern(TERMS[term].name)}(?![\\p{L}\\p{N}])`, 'iu').test(text));
}

/** Returns, once each, the terms the texts use that are not known yet. */
""",
    ),
)

edit(
    'tests/e2e/CLAUDE.md',
    (
        r"""- Interact through roles and labels, the way a player would.
- Shared helpers (`console-errors.ts`) are plain modules next to the specs.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
""",
        r"""- Interact through roles and labels, the way a player would.
- Shared helpers (`console-errors.ts`, and `saved-progress.ts` to open a page with progress already saved) are plain modules next to the specs. A spec that plays a later chapter starts with the chapters before it done.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 623 passed (623)` en 46 archivos (los tests por incidente corren también para el 01-01 y el 01-02); `git diff` sin salida; `pnpm check` PASS con 14 de Playwright.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(levels): add 01-01 and 01-02 at the office, with the first terms of chapter 1"
```

---

### Task 9: El capítulo 1, segunda parte: 01-03 y 01-04 (F4)

Llegan el 01-03 (la casa de Lucía, con `addActor`) y el 01-04 (un incidente `filter` con el firewall de la laptop de Lucía, con `addFirewall`), con sus seis términos:
- **01-03:** internet, router e IP privada, que se redefine y deja el 04-01.
- **01-04:** firewall, tráfico y regla.

Con esos términos cambian varias cosas:
- **Etiquetas:** las de la oficina usan su término (`{{firewall}} [[laptop-lucia]]`, `{{router}}`, `{{internet}}`), y sus cajas empiezan por «Qué es».
- **Reglas:** se abren por tipo de firewall (`inboundRules` por `FirewallKind`).
- **Textos por tipo (F4):** el firewall de la laptop, la ruta dentro de la oficina, la respuesta según el firewall del destino, y la tarjeta de reglas vacía según su tipo (`FirewallCard.empty`).
- **La prueba de fugas** declara su única excepción: «Internet» dentro de ICMP.

**Files:**
- Create: `src/levels/01-first-day/03-from-outside.ts`, `src/levels/01-first-day/04-the-firewall.ts`
- Modify:
  - `src/copy/terms.ts`, `src/copy/incident-ui.ts`, `src/copy/reasons.ts`
  - `src/levels/01-first-day/shared.ts`, `src/levels/01-first-day/02-there-and-back.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/ladder.ts`
  - `src/game/session.ts`, `src/game/view/firewall-card.ts`
  - `src/ui/incident/map-cards/task-card.tsx` (una línea: `card.empty`)
  - las guías `src/levels/CLAUDE.md` y `src/game/view/CLAUDE.md`
- Test:
  - `src/copy/terms.test.ts`, `src/copy/term-text.test.ts`, `src/copy/reasons.test.ts`
  - `src/levels/ladder.test.ts`, `src/levels/registry.test.ts`, `src/levels/incident.test.ts`
  - `src/game/session.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/pieces.test.ts`, `src/game/view/ladder.test.ts`
  - `src/ui/incident/map-cards/task-card.test.tsx`

**Interfaces:**
- Consumes: `addActor`, `addFirewall` (Tarea 1); `HOME` y el tipo de actor `home` (Tarea 3); `canConfigure`.
- Produces:
  - **Términos:** `internet`, `router`, `firewall`, `traffic` y `rule`, más la definición nueva de `private-ip`.
  - **Entidades:** `ENTITY_TERMS` le da su término al firewall de la laptop, al router y a internet, y `TERM_ENTITY` suma los tres.
  - **Escalera:** `ConfigurableParts.inboundRules: Record<FirewallKind, boolean>`.
  - **Vista:** `FirewallCard.empty: TermText`.
  - **Copy:** `TASK_CARD_TEXT.noRules[kind]`.
  - **Incidentes:** 01-03 y 01-04 en el registro.
  - **Fichas compartidas, en `01-first-day/shared.ts`:** `PING_TO_LUCIA`, `PING_LUCIA`, `WHAT`, `FROM`, `HOME` y `LUCIA_FIREWALL`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 8**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 623 passed (623)`.

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
    'src/copy/reasons.test.ts',
    (
        r"""import { simulate, type Reason } from '@/engine';
import { device, lab03Net, ping } from '@/testing';
import { describeReason } from './reasons';
""",
        r"""import { simulate, type Reason } from '@/engine';
import { device, lab03Net, officeNet, ping, withDevice } from '@/testing';
import { describeReason } from './reasons';
""",
    ),
    (
        r"""  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' }, SG_IN_DROP],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'El firewall de [[servidor1]] lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'Se queda en el firewall de [[servidor1]]: ninguna regla lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'El firewall de [[servidor2]] lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'Se queda en el firewall de [[servidor2]]: ninguna regla lo deja entrar.'],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.'],
""",
        r"""  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' }, SG_IN_DROP],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'El {{firewall}} de [[servidor1]] lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'Se queda en el {{firewall}} de [[servidor1]]: ninguna {{rule|regla}} lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'El {{firewall}} de [[servidor2]] lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'Se queda en el {{firewall}} de [[servidor2]]: ninguna {{rule|regla}} lo deja entrar.'],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.'],
""",
    ),
    (
        r"""
  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
""",
        r"""
  it('an office names its own network and its own firewalls, not the VPC nor a Security Group', () => {
    const office = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    expect(describeReason({ code: 'route-private' }, office)).toBe('Viaja por dentro de la {{network|red}} de la oficina.');
    expect(describeReason({ code: 'reply-stateful', deviceId: 'lucia-laptop' }, office)).toBe(
      'La respuesta vuelve sola: el {{firewall}} de [[lucia-laptop]] recuerda la conversación.',
    );
    expect(describeReason({ code: 'reply-stateful', deviceId: 'printer' }, office)).toBe('La respuesta vuelve por el mismo camino.');
  });

  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
""",
    ),
)

edit(
    'src/copy/term-text.test.ts',
    (
        r"""  it('rejects a tag whose term is not registered', () => {
    expect(() => parseTermText('El {{firewall}} bloquea.')).toThrow('unknown term: firewall');
  });
""",
        r"""  it('rejects a tag whose term is not registered', () => {
    expect(() => parseTermText('La {{puerta}} bloquea.')).toThrow('unknown term: puerta');
  });
""",
    ),
)

edit(
    'src/copy/terms.test.ts',
    (
        r"""];
const RETIRED_IDS = ['server', 'rule', 'linux-ignore-ping'];

""",
        r"""];
const RETIRED_IDS = ['server', 'linux-ignore-ping'];

""",
    ),
    (
        r"""    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('firewall')).toBe(false);
    expect(isTermId('toString')).toBe(false);
""",
        r"""    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('puerta')).toBe(false);
    expect(isTermId('toString')).toBe(false);
""",
    ),
    (
        r"""    expect(entityTerm({ kind: 'device', variant: 'printer' })).toBe('device');
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBeNull();
    expect(entityTerm({ kind: 'edge', variant: 'router' })).toBeNull();
  });
""",
        r"""    expect(entityTerm({ kind: 'device', variant: 'printer' })).toBe('device');
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBe('firewall');
    expect(entityTerm({ kind: 'edge', variant: 'router' })).toBe('router');
    expect(entityTerm({ kind: 'internet', variant: 'internet' })).toBe('internet');
  });
""",
    ),
)

edit(
    'src/game/session.test.ts',
    (
        r"""    const start = startSession(INCIDENTS, FIRST.id);
    const closedGroups: Session = { ...start, parts: { ...start.parts, inboundRules: false } };
    expect(sessionReducer(closedGroups, FIX)).toBe(closedGroups);
""",
        r"""    const start = startSession(INCIDENTS, FIRST.id);
    const closedGroups: Session = { ...start, parts: { ...start.parts, inboundRules: { ...start.parts.inboundRules, 'security-group': false } } };
    expect(sessionReducer(closedGroups, FIX)).toBe(closedGroups);
""",
    ),
)

edit(
    'src/game/view/inspection.test.ts',
    (
        r"""      title: 'lucia-laptop',
      fields: [whatIs('device'), ['IP privada', '192.168.1.11'], ['Firewall', 'firewall lucia-laptop']],
    });
""",
        r"""      title: 'lucia-laptop',
      fields: [whatIs('device'), ['IP privada', '192.168.1.11'], ['firewall', 'firewall lucia-laptop']],
    });
""",
    ),
    (
        r"""
  it('a host firewall lists its inbound rules like a Security Group, named after its device', () => {
    expect(plain(inspect(office, PIECE_ID.firewall('fw-lucia')))).toEqual({
      title: 'firewall lucia-laptop',
      fields: [['Reglas de entrada', 'Ninguna: no deja entrar nada.']],
    });
""",
        r"""
  it('a host firewall says what a firewall is and lists its inbound rules like a Security Group, named after its device', () => {
    expect(plain(inspect(office, PIECE_ID.firewall('fw-lucia')))).toEqual({
      title: 'firewall lucia-laptop',
      fields: [whatIs('firewall'), ['Reglas de entrada', 'Ninguna: no deja entrar nada.']],
    });
""",
    ),
    (
        r"""
  it('the router of an office says what it does', () => {
    expect(plain(inspect(office, PIECE_ID.edge))).toEqual({
      title: 'router',
      fields: [['Qué hace', 'Por aquí entra y sale el tráfico entre la oficina e internet.']],
    });
""",
        r"""
  it('the router of an office says what a router is and what it does', () => {
    expect(plain(inspect(office, PIECE_ID.edge))).toEqual({
      title: 'router',
      fields: [whatIs('router'), ['Qué hace', 'Conecta la red de la oficina con internet.']],
    });
""",
    ),
    (
        r"""
  it('the internet says what it does, with no definition while its term does not exist', () => {
    expect(plain(inspect(first, PIECE_ID.internet))).toEqual({ title: 'internet', fields: [['Qué hace', 'Lleva los paquetes de una red a otra.']] });
  });
""",
        r"""
  it('the internet says what it is and what it does', () => {
    expect(plain(inspect(first, PIECE_ID.internet))).toEqual({ title: 'internet', fields: [whatIs('internet'), ['Qué hace', 'Lleva cada paquete de una red a otra.']] });
  });
""",
    ),
)

edit(
    'src/game/view/ladder.test.ts',
    (
        r"""
const NAMED_BY_KIND: PieceKind[] = ['firewall', 'edge'];
const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];
""",
        r"""
const NAMED_BY_KIND: PieceKind[] = ['firewall', 'edge', 'internet'];
const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];
""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { INCIDENTS } from '@/levels';
""",
        r"""import { describe, expect, it } from 'vitest';
import { MAP_TEXT, TASK_CARD_TEXT, nameTag } from '@/copy';
import { INCIDENTS } from '@/levels';
""",
    ),
    (
        r"""      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
      { id: PIECE_ID.internet, variant: 'internet', term: null, label: MAP_TEXT.internet, locked: false, configurable: false },
    ]);
""",
        r"""      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
      { id: PIECE_ID.internet, variant: 'internet', term: 'internet', label: MAP_TEXT.internet, locked: false, configurable: false },
    ]);
""",
    ),
    (
        r"""
  it('draws an office by the kind of each device and firewall, with a router as its edge, and a laptop or a printer named by the term device', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
""",
        r"""
  it('draws an office by the kind of each device and firewall, with a router as its edge, each named by its term of chapter 1', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
""",
    ),
    (
        r"""      { kind: 'device', variant: 'printer', term: 'device', label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: null, label: 'firewall [[lucia-laptop]]' },
      { kind: 'actor', variant: 'attacker', term: null, label: '[[Atacante]]' },
      { kind: 'edge', variant: 'router', term: null, label: 'router' },
      { kind: 'internet', variant: 'internet', term: null, label: 'internet' },
    ]);
""",
        r"""      { kind: 'device', variant: 'printer', term: 'device', label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: 'firewall', label: '{{firewall}} [[lucia-laptop]]' },
      { kind: 'actor', variant: 'attacker', term: null, label: '[[Atacante]]' },
      { kind: 'edge', variant: 'router', term: 'router', label: '{{router}}' },
      { kind: 'internet', variant: 'internet', term: 'internet', label: '{{internet}}' },
    ]);
""",
    ),
    (
        r"""      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
    });
""",
        r"""      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
      empty: TASK_CARD_TEXT.noRules['security-group'],
    });
""",
    ),
)

edit(
    'src/levels/incident.test.ts',
    (
        r"""  ['a solution with a chip it does not offer', { solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }],
  ['an unknown term tag', { report: 'El {{firewall}} falla.' }],
  ['a term tag with capitals', { report: 'La {{Security-Group}} falla.' }],
""",
        r"""  ['a solution with a chip it does not offer', { solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }],
  ['an unknown term tag', { report: 'La {{puerta}} falla.' }],
  ['a term tag with capitals', { report: 'La {{Security-Group}} falla.' }],
""",
    ),
    (
        r"""  ['a term tag opened inside the words', { report: 'La {{rule|a {{b}} falla.' }],
  ['an unknown introduced term', { introduces: ['firewall'] }],
  ['a term introduced twice', { introduces: ['ping', 'ping'] }],
""",
        r"""  ['a term tag opened inside the words', { report: 'La {{rule|a {{b}} falla.' }],
  ['an unknown introduced term', { introduces: ['puerta'] }],
  ['a term introduced twice', { introduces: ['ping', 'ping'] }],
""",
    ),
)

edit(
    'src/levels/ladder.test.ts',
    (
        r"""
const ONLY_INBOUND = { inboundRules: true, outboundRules: false, hostSettings: false };
const NOTHING = { inboundRules: false, outboundRules: false, hostSettings: false };
const ALL_TERMS = Object.keys(TERMS) as TermId[];
""",
        r"""
const NOTHING = { inboundRules: { 'host-firewall': false, 'security-group': false }, outboundRules: false, hostSettings: false };
const HOST_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': false } };
const INBOUND_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': true } };
const DECLARED_LEAKS = ['icmp → internet'];
const ALL_TERMS = Object.keys(TERMS) as TermId[];
""",
    ),
    (
        r"""    const leaks = incident.introduces.flatMap((term) => namedTerms(TERMS[term].definition, unknown).map((other) => `${term} → ${other}`));
    expect(leaks).toEqual([]);
  });
""",
        r"""    const leaks = incident.introduces.flatMap((term) => namedTerms(TERMS[term].definition, unknown).map((other) => `${term} → ${other}`));
    expect(leaks.filter((leak) => !DECLARED_LEAKS.includes(leak))).toEqual([]);
  });

  it('the official name of ICMP says Internet before the term internet arrives: the one declared leak', () => {
    expect(namedTerms(TERMS.icmp.definition, ['internet'])).toEqual(['internet']);
    expect(INCIDENTS.findIndex((incident) => incident.introduces.includes('icmp'))).toBeLessThan(INCIDENTS.findIndex((incident) => incident.introduces.includes('internet')));
  });
""",
    ),
    (
        r"""
  it('chapter 1 opens no rules yet, and chapter 4 opens only inbound rules, so its solutions touch only those', () => {
    for (const incident of INCIDENTS) {
      expect(configurableParts(knownTerms(INCIDENTS, incident.id)), incident.id).toEqual(incident.chapter === 4 ? ONLY_INBOUND : NOTHING);
    }
  });
""",
        r"""
  it('the rules of a host firewall open with the term rule (01-04), and those of a Security Group with inbound rule (chapter 4)', () => {
    const parts = Object.fromEntries(INCIDENTS.map((incident) => [incident.id, configurableParts(knownTerms(INCIDENTS, incident.id))]));
    expect(parts).toEqual({ '01-01': NOTHING, '01-02': NOTHING, '01-03': NOTHING, '01-04': HOST_RULES, '04-01': INBOUND_RULES, '04-02': INBOUND_RULES });
  });
""",
    ),
    (
        r"""    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: true, outboundRules: true, hostSettings: true });
  });
""",
        r"""    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: { 'host-firewall': false, 'security-group': true }, outboundRules: true, hostSettings: true });
  });
""",
    ),
)

edit(
    'src/levels/registry.test.ts',
    (
        r"""
const PROTOTYPE_IDS = ['01-01', '01-02', '04-01', '04-02'];
const HINT_COUNT = 2;
""",
        r"""
const PROTOTYPE_IDS = ['01-01', '01-02', '01-03', '01-04', '04-01', '04-02'];
const HINT_COUNT = 2;
""",
    ),
)

edit(
    'src/ui/incident/map-cards/task-card.test.tsx',
    (
        r"""    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules));
  });
""",
        r"""    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules['security-group']));
  });
""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/copy/reasons.test.ts src/copy/term-text.test.ts src/copy/terms.test.ts src/game/session.test.ts src/game/view/inspection.test.ts src/game/view/ladder.test.ts src/game/view/pieces.test.ts src/levels/incident.test.ts src/levels/ladder.test.ts src/levels/registry.test.ts src/ui/incident/map-cards/task-card.test.tsx
```

Expected: FAIL, `Test Files 9 failed | 2 passed (11)` y `Tests 20 failed | 253 passed (273)`. Fallan:
- los textos del firewall de la laptop y de la oficina, que todavía no etiquetan `firewall` ni `rule`;
- los términos nuevos, que no existen;
- las partes configurables, que todavía son un `boolean`;
- el registro, que espera los seis incidentes;
- las etiquetas de la oficina, que todavía son texto llano;
- `TASK_CARD_TEXT.noRules`, que todavía no va por tipo.

- [ ] **Step 4: Implementar**

Contenido completo de `src/levels/01-first-day/03-from-outside.ts`:

```ts
import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, HOME, LESSON, MESSAGE, ORIGIN, PING_TO_LUCIA } from './shared';

export default defineIncident({
  id: '01-03',
  chapter: 1,
  order: 3,
  title: 'Desde afuera',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['internet', 'router', 'private-ip'],
  changes: [{ type: 'addActor', actor: HOME }],
  report: 'Esta tarde trabajo desde casa. Mi casa está afuera, en {{internet}}, y la oficina sale a internet por su {{router}}. ¿Podré hacerle {{ping}} a tu laptop?',
  tasks: [
    {
      id: 'from-home',
      text: 'Experimento: desde la casa de Lucía, haz {{ping}} a tu laptop.',
      expect: { fromId: ORIGIN.home.id, toId: ADDRESS.you.id, messageId: MESSAGE.echoRequest.id, outcome: 'any' },
    },
    {
      id: 'to-lucia',
      text: 'Contraste: desde tu laptop, haz {{ping}} a la laptop de Lucía.',
      expect: PING_TO_LUCIA.expect,
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you, ORIGIN.home], to: [ADDRESS.you, ADDRESS.lucia, ADDRESS.printer], message: [MESSAGE.echoRequest, MESSAGE.echoReply] },
  hints: [
    'En la terminal de tu laptop, elige mi casa como origen: la terminal pasa a mi casa. ¿Hasta dónde llega el {{ping}}?',
    'Pasa el mouse sobre el sello del {{ping}} que salió de mi casa: dice dónde se perdió y por qué.',
  ],
  question: '¿Por qué no llegó el {{ping}} desde mi casa?',
  explanation: [
    {
      text: 'El {{router}} de la oficina lo bloqueó.',
      feedback: 'No: el {{ping}} se perdió en {{internet}}, antes de llegar al router.',
      correct: false,
    },
    {
      text: '192.168.1.10 es una {{private-ip}}: fuera de la oficina no significa nada, e {{internet}} no la entrega.',
      feedback: 'Eso es. Muchas redes usan las mismas IP privadas, así que internet no sabría a cuál de ellas llevarlo.',
      correct: true,
    },
    {
      text: 'Mi laptop no sabe hacer {{ping}} desde casa.',
      feedback: 'No: el {{ping}} salió de mi casa y se perdió en {{internet}}. Lo que falla es el destino: internet no entrega paquetes a una {{private-ip}}.',
      correct: false,
    },
  ],
  solution: [
    { type: 'sendPacket', fromId: ORIGIN.home.id, toId: ADDRESS.you.id, messageId: MESSAGE.echoRequest.id },
    PING_TO_LUCIA.send,
  ],
  takeaway: 'Una {{private-ip}} solo sirve dentro de su {{network|red}}: {{internet}} no entrega paquetes a una IP privada.',
});
```


Contenido completo de `src/levels/01-first-day/04-the-firewall.ts`:

```ts
import { defineIncident } from '@/levels/incident';
import { CONCEPT, DEVICE, FROM, LESSON, LUCIA_FIREWALL, PING_LUCIA, WHAT } from './shared';

export default defineIncident({
  id: '01-04',
  chapter: 1,
  order: 4,
  title: 'El firewall',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['firewall', 'traffic', 'rule'],
  changes: [{ type: 'addFirewall', deviceId: DEVICE.lucia.id, firewall: LUCIA_FIREWALL }],
  report: 'Esta tarde, soporte activó un {{firewall}} en todas las laptops. Hazme {{ping}} otra vez: ya no me llega.',
  tasks: [{ id: 'ping-lucia', text: 'Que tu {{ping}} a la laptop de Lucía vuelva con respuesta.', flowIds: [PING_LUCIA.id] }],
  flows: [PING_LUCIA],
  chips: { what: [WHAT.echoRequest, WHAT.echoReply], from: [FROM.you, FROM.printer] },
  hints: [
    'Mira el {{firewall}} de mi laptop: ¿qué {{traffic|tráfico}} deja entrar hoy?',
    'En el {{firewall}} de mi laptop, agrega una {{rule|regla}}: {{icmp}} · {{echo-request}}, desde tu laptop.',
  ],
  question: '¿Qué hizo el {{firewall}} con tu primer {{ping}}?',
  explanation: [
    {
      text: 'Lo dejó pasar, pero mi laptop no contestó.',
      feedback: 'No: el {{ping}} se quedó en el {{firewall}}, antes de llegar a mi laptop.',
      correct: false,
    },
    {
      text: 'Lo bloqueó: ninguna {{rule|regla}} dejaba pasar ese {{traffic|tráfico}}.',
      feedback: 'Eso es. Un {{firewall}} solo deja pasar lo que permite una de sus reglas, y no tenía ninguna.',
      correct: true,
    },
    {
      text: 'Bloqueó solo la respuesta.',
      feedback: 'No: lo que el {{firewall}} frenó fue la ida, el {{echo-request}}. Sin ida, no hay respuesta.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: LUCIA_FIREWALL.id, whatId: WHAT.echoRequest.id, fromId: FROM.you.id }],
  takeaway: 'Un {{firewall}} solo deja entrar el {{traffic|tráfico}} que permite una {{rule|regla}}: qué tráfico (Type) y de qué origen (Source).',
});
```


Contenido completo de `src/levels/01-first-day/shared.ts`:

```ts
import { nameTag } from '@/copy';
import type { Actor, Device, Firewall, Network, PacketSpec } from '@/engine';
import type { AddressChip, Flow, FromChip, MessageChip, OriginChip, SendMove, SendTask, WhatChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.1.0/24';
const ANYWHERE = '0.0.0.0/0';
const ECHO_REQUEST = '{{icmp}} · {{echo-request}}';
const ECHO_REPLY = '{{icmp}} · {{echo-reply}}';

export const IP = { you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' } as const;
export const DEVICE = {
  you: { id: 'your-laptop', name: 'tu-laptop' },
  lucia: { id: 'lucia-laptop', name: 'laptop-lucia' },
  printer: { id: 'printer', name: 'impresora' },
} as const;

function officeDevice({ id, name }: { id: string; name: string }, kind: Device['kind'], privateIp: string): Device {
  return { id, name, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] } };
}

export const BASE_WORLD: Network = {
  kind: 'office',
  cidr: OFFICE_RANGE,
  devices: [officeDevice(DEVICE.you, 'laptop', IP.you), officeDevice(DEVICE.lucia, 'laptop', IP.lucia), officeDevice(DEVICE.printer, 'printer', IP.printer)],
  firewalls: [],
  edge: 'router',
  actors: [],
};

export const HOME: Actor = { id: 'lucia-home', name: 'Casa de Lucía', ip: '198.51.100.24', kind: 'home' };

export const LUCIA_FIREWALL: Firewall = {
  id: 'fw-lucia',
  name: DEVICE.lucia.name,
  kind: 'host-firewall',
  inbound: [],
  outbound: [{ id: 'all-out-lucia', what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANYWHERE } }],
};

export const ORIGIN = {
  you: { id: 'you', endpoint: { kind: 'device', id: DEVICE.you.id } },
  home: { id: 'home', endpoint: { kind: 'actor', id: HOME.id } },
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  you: { id: 'ip-you', address: IP.you },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  printer: { id: 'ip-printer', address: IP.printer },
  nobody: { id: 'ip-nobody', address: IP.nobody },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8 },
  echoRequest: { id: 'echo-request', label: ECHO_REQUEST, icmpType: 8 },
  echoReply: { id: 'echo-reply', label: ECHO_REPLY, icmpType: 0 },
} satisfies Record<string, MessageChip>;

const YOUR_PING_TO_LUCIA = { fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id };

export const PING_TO_LUCIA: { send: SendMove; expect: SendTask['expect'] } = {
  send: { type: 'sendPacket', ...YOUR_PING_TO_LUCIA },
  expect: { ...YOUR_PING_TO_LUCIA, outcome: 'replied' },
};

const pingFromYou: PacketSpec = { from: ORIGIN.you.endpoint, to: IP.lucia, protocol: 'icmp', icmpType: 8 };

export const PING_LUCIA = { id: 'ping-you-lucia', kind: 'required', packet: pingFromYou } satisfies Flow;

export const WHAT = {
  echoRequest: { id: 'echo-request', label: ECHO_REQUEST, what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: ECHO_REPLY, what: { kind: 'icmp', icmpType: 0 } },
} satisfies Record<string, WhatChip>;

function fromDevice(device: { name: string }, ip: string): FromChip {
  return { id: `from-${ip}`, label: `${nameTag(device.name)} ({{ip-address|IP}} ${ip})`, peer: { kind: 'cidr', cidr: `${ip}/32` } };
}

export const FROM = { you: fromDevice(DEVICE.you, IP.you), printer: fromDevice(DEVICE.printer, IP.printer) };
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
    'src/copy/incident-ui.ts',
    (
        r"""  'security-group': (name) => `{{security-group}} ${nameTag(name)}`,
  'host-firewall': (name) => `firewall ${nameTag(name)}`,
};
""",
        r"""  'security-group': (name) => `{{security-group}} ${nameTag(name)}`,
  'host-firewall': (name) => `{{firewall}} ${nameTag(name)}`,
};
""",
    ),
    (
        r"""  'internet-gateway': '{{internet-gateway}}',
  router: 'router',
};
""",
        r"""  'internet-gateway': '{{internet-gateway}}',
  router: '{{router}}',
};
""",
    ),
    (
        r"""  edge: EDGE_LABEL,
  internet: 'internet',
  locked: 'con candado',
""",
        r"""  edge: EDGE_LABEL,
  internet: '{{internet}}',
  locked: 'con candado',
""",
    ),
    (
        r"""  ignoresPing: '1: no contesta el {{ping}}',
  firewalls: { 'security-group': '{{security-group|Security Groups}}', 'host-firewall': 'Firewall' } satisfies Record<FirewallKind, TermText>,
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': 'Reglas de entrada' } satisfies Record<FirewallKind, TermText>,
  noRules: 'Ninguna: no deja entrar nada.',
""",
        r"""  ignoresPing: '1: no contesta el {{ping}}',
  firewalls: { 'security-group': '{{security-group|Security Groups}}', 'host-firewall': '{{firewall}}' } satisfies Record<FirewallKind, TermText>,
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': '{{rule|Reglas}} de entrada' } satisfies Record<FirewallKind, TermText>,
  noRules: 'Ninguna: no deja entrar nada.',
""",
    ),
    (
        r"""    'internet-gateway': 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
    router: 'Por aquí entra y sale el tráfico entre la oficina e internet.',
  } satisfies Record<Network['edge'], TermText>,
  internetDoes: 'Lleva los paquetes de una red a otra.',
  message: 'Mensaje',
""",
        r"""    'internet-gateway': 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
    router: 'Conecta la {{network|red}} de la oficina con {{internet}}.',
  } satisfies Record<Network['edge'], TermText>,
  internetDoes: 'Lleva cada {{packet|paquete}} de una {{network|red}} a otra.',
  message: 'Mensaje',
""",
    ),
    (
        r"""  you: 'Tu computadora.',
  home: 'Una casa fuera de la oficina, conectada a internet.',
};
""",
        r"""  you: 'Tu computadora.',
  home: 'Una casa fuera de la oficina, conectada a {{internet}}.',
};
""",
    ),
    (
        r"""export const TASK_CARD_TEXT = {
  noRules: 'No tiene {{inbound-rule|reglas de entrada}}: no deja entrar nada.',
  slot: 'Regla de entrada nueva',
""",
        r"""export const TASK_CARD_TEXT = {
  noRules: {
    'security-group': 'No tiene {{inbound-rule|reglas de entrada}}: no deja entrar nada.',
    'host-firewall': 'No tiene {{rule|reglas}} de entrada: no deja entrar nada.',
  } satisfies Record<FirewallKind, TermText>,
  slot: 'Regla de entrada nueva',
""",
    ),
)

edit(
    'src/copy/reasons.ts',
    (
        r"""  'host-firewall': {
    passOut: (device) => `El firewall de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el firewall de ${device}: ninguna regla lo deja salir.`,
    passIn: (device) => `El firewall de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el firewall de ${device}: ninguna regla lo deja entrar.`,
  },
};

""",
        r"""  'host-firewall': {
    passOut: (device) => `El {{firewall}} de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja salir.`,
    passIn: (device) => `El {{firewall}} de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja entrar.`,
  },
};

const ROUTE_INSIDE: Record<Network['kind'], TermText> = {
  vpc: 'Viaja por dentro de la {{vpc}}.',
  office: 'Viaja por dentro de la {{network|red}} de la oficina.',
};

function replyText(net: Network, deviceId: string): TermText {
  const device = net.devices.find((d) => d.id === deviceId);
  const kind = net.firewalls.find((f) => device?.firewallIds.includes(f.id))?.kind;
  if (kind === 'security-group') return 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.';
  if (kind === 'host-firewall') return `La respuesta vuelve sola: el {{firewall}} de ${deviceName(net, deviceId)} recuerda la conversación.`;
  return 'La respuesta vuelve por el mismo camino.';
}

""",
    ),
    (
        r"""    case 'route-private':
      return 'Viaja por dentro de la {{vpc}}.';
    case 'route-no-public-device':
""",
        r"""    case 'route-private':
      return ROUTE_INSIDE[net.kind];
    case 'route-no-public-device':
""",
    ),
    (
        r"""    case 'reply-stateful':
      return 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.';
  }
""",
        r"""    case 'reply-stateful':
      return replyText(net, reason.deviceId);
  }
""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""  'echo-reply': { name: 'Echo Reply', definition: 'La respuesta ICMP del ping (tipo 0). Solo se envía al recibir un Echo Request, y nadie la contesta.' },
  'ec2-instance': {
""",
        r"""  'echo-reply': { name: 'Echo Reply', definition: 'La respuesta ICMP del ping (tipo 0). Solo se envía al recibir un Echo Request, y nadie la contesta.' },
  internet: { name: 'internet', definition: 'La red mundial formada por muchas redes unidas entre sí.' },
  router: { name: 'router', definition: 'Un dispositivo que conecta redes y reenvía cada paquete según su dirección IP de destino.' },
  'private-ip': {
    name: 'IP privada',
    definition: 'Una dirección IPv4 de uso interno (10.x, 172.16–31.x, 192.168.x): se repite en muchas redes e internet no la entrega.',
  },
  firewall: { name: 'firewall', definition: 'Un sistema que revisa el tráfico de un dispositivo y solo deja pasar lo que permite una de sus reglas.' },
  traffic: { name: 'tráfico', definition: 'Los paquetes que circulan por una red.' },
  rule: { name: 'regla', definition: 'Un permiso del firewall: dice qué tráfico puede pasar (Type) y desde dónde (Source).' },
  'ec2-instance': {
""",
    ),
    (
        r"""  vpc: { name: 'VPC', definition: 'Virtual Private Cloud: una red virtual aislada dentro de AWS, con su propio rango de IPs privadas.' },
  'private-ip': { name: 'IP privada', definition: 'La dirección IPv4 de una instancia dentro de su VPC. Desde internet no se llega a ella.' },
  'security-group': {
""",
        r"""  vpc: { name: 'VPC', definition: 'Virtual Private Cloud: una red virtual aislada dentro de AWS, con su propio rango de IPs privadas.' },
  'security-group': {
""",
    ),
    (
        r"""  device: { laptop: 'device', printer: 'device', 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': null, 'security-group': 'security-group' },
  edge: { router: null, 'internet-gateway': 'internet-gateway' },
  internet: { internet: null },
  actor: { you: null, attacker: null, home: null },
""",
        r"""  device: { laptop: 'device', printer: 'device', 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': 'firewall', 'security-group': 'security-group' },
  edge: { router: 'router', 'internet-gateway': 'internet-gateway' },
  internet: { internet: 'internet' },
  actor: { you: null, attacker: null, home: null },
""",
    ),
    (
        r"""  packet: { kind: 'packet', variant: 'echo-request' },
  vpc: { kind: 'network', variant: 'vpc' },
""",
        r"""  packet: { kind: 'packet', variant: 'echo-request' },
  internet: { kind: 'internet', variant: 'internet' },
  router: { kind: 'edge', variant: 'router' },
  firewall: { kind: 'firewall', variant: 'host-firewall' },
  vpc: { kind: 'network', variant: 'vpc' },
""",
    ),
)

edit(
    'src/game/session.ts',
    (
        r"""
/** True when a device has this firewall, so it is on the map, and the ladder lets the player change its inbound rules. */
export function canConfigure(session: Session, firewallId: string): boolean {
  return session.parts.inboundRules && session.world.devices.some((device) => device.firewallIds.includes(firewallId));
}
""",
        r"""
/** True when a device has this firewall, so it is on the map, and the ladder lets the player change the inbound rules of its kind. */
export function canConfigure(session: Session, firewallId: string): boolean {
  const firewall = session.world.firewalls.find((candidate) => candidate.id === firewallId);
  return firewall !== undefined && session.parts.inboundRules[firewall.kind] && session.world.devices.some((device) => device.firewallIds.includes(firewallId));
}
""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""
- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `device` for a laptop or a printer, `ec2-instance`, `security-group` and `internet-gateway`, and none ever for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message, and `packet` while that one is not known); a piece without a term has no definition. A device's IP is its dirección IP until the term IP privada is known.
""",
        r"""
- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `device` for a laptop or a printer, `firewall` for the firewall of a laptop, `router`, `internet`, and the AWS ones (`ec2-instance`, `security-group`, `internet-gateway`); none ever for an actor. A firewall label, the edge label and the internet label carry their term's name (`Security Group servidor2`, `firewall laptop-lucia`, `router`, `internet`); a device's label is its name (`servidor2`, `tu-laptop`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message, and `packet` while that one is not known); a piece without a term has no definition. A device's IP is its dirección IP until the term IP privada is known.
""",
    ),
)

edit(
    'src/game/view/firewall-card.ts',
    (
        r"""import { INSPECTION_TEXT, MAP_TEXT, type TermText } from '@/copy';
import type { Firewall } from '@/engine';
""",
        r"""import { INSPECTION_TEXT, MAP_TEXT, TASK_CARD_TEXT, type TermText } from '@/copy';
import type { Firewall } from '@/engine';
""",
    ),
    (
        r"""  rules: RuleRow[];
}
""",
        r"""  rules: RuleRow[];
  empty: TermText;
}
""",
    ),
    (
        r"""
/** Returns what the task card of a firewall shows, or null when the piece is not a firewall on the map. */
export function firewallCard(session: Session, pieceId: string): FirewallCard | null {
""",
        r"""
/** Returns what the task card of a firewall shows (its title, its rules named by chips, and what it says without rules, in the words of its kind), or null when the piece is not a firewall on the map. */
export function firewallCard(session: Session, pieceId: string): FirewallCard | null {
""",
    ),
    (
        r"""  const firewall = ref?.kind === 'firewall' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.firewall[firewall.kind](firewall.name), rules: ruleRows(firewall, session.incident) } : null;
}
""",
        r"""  const firewall = ref?.kind === 'firewall' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  if (!firewall) return null;
  return { firewallId: firewall.id, title: MAP_TEXT.firewall[firewall.kind](firewall.name), rules: ruleRows(firewall, session.incident), empty: TASK_CARD_TEXT.noRules[firewall.kind] };
}
""",
    ),
)

edit(
    'src/levels/01-first-day/02-there-and-back.ts',
    (
        r"""import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, LESSON, MESSAGE, ORIGIN } from './shared';

""",
        r"""import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, LESSON, MESSAGE, ORIGIN, PING_TO_LUCIA } from './shared';

""",
    ),
    (
        r"""      text: 'Que la laptop de Lucía conteste tu {{echo-request}}.',
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id, outcome: 'replied' },
    },
""",
        r"""      text: 'Que la laptop de Lucía conteste tu {{echo-request}}.',
      expect: PING_TO_LUCIA.expect,
    },
""",
    ),
    (
        r"""  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id }],
  takeaway: 'Un {{protocol|protocolo}} dice qué mensajes existen. En {{icmp}}, el {{echo-request}} pide una {{response|respuesta}} y el {{echo-reply}} es esa respuesta: el {{ping}} usa los dos.',
""",
        r"""  ],
  solution: [PING_TO_LUCIA.send],
  takeaway: 'Un {{protocol|protocolo}} dice qué mensajes existen. En {{icmp}}, el {{echo-request}} pide una {{response|respuesta}} y el {{echo-reply}} es esa respuesta: el {{ping}} usa los dos.',
""",
    ),
)

edit(
    'src/levels/04-iaas/01-the-first-ping.ts',
    (
        r"""  concept: CONCEPT,
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'security-group', 'inbound-rule', 'anywhere-ipv4', 'internet-gateway'],
  base: BASE_WORLD,
""",
        r"""  concept: CONCEPT,
  introduces: ['ec2-instance', 'vpc', 'security-group', 'inbound-rule', 'anywhere-ipv4', 'internet-gateway'],
  base: BASE_WORLD,
""",
    ),
)

edit(
    'src/levels/CLAUDE.md',
    (
        r"""- An incident has a mechanic. `filter`: the player places rules with Type and Source chips, and tasks read live flows. `send`: the player sends packets with origin, address and message chips (`packetFromChips`), and each task expects the result of one combination (`replied` or `any`); its flows are only ambient. A send move never changes the world.
- No flow and no combination of chips sends a packet from a device of an office to an address outside it (`officeLeaks`): the game does not model the office's NAT. The registry test checks it on each incident's start world.
""",
        r"""- An incident has a mechanic. `filter`: the player places rules with Type and Source chips, and tasks read live flows. `send`: the player sends packets with origin, address and message chips (`packetFromChips`), and each task expects the result of one combination (`replied` or `any`); its flows are only ambient. A send move never changes the world.
- The ladder opens what the player may change: the inbound rules of a host firewall once `rule` is known (01-04), those of a Security Group once `inbound-rule` is known (04-01).
- No flow and no combination of chips sends a packet from a device of an office to an address outside it (`officeLeaks`): the game does not model the office's NAT. The registry test checks it on each incident's start world.
""",
    ),
)

edit(
    'src/levels/ladder.ts',
    (
        r"""import { TERMS, termsIn, type TermId, type TermText } from '@/copy';
import type { Incident } from './incident';
""",
        r"""import { TERMS, termsIn, type TermId, type TermText } from '@/copy';
import type { FirewallKind } from '@/engine';
import type { Incident } from './incident';
""",
    ),
    (
        r"""export interface ConfigurableParts {
  inboundRules: boolean;
  outboundRules: boolean;
""",
        r"""export interface ConfigurableParts {
  inboundRules: Record<FirewallKind, boolean>;
  outboundRules: boolean;
""",
    ),
    (
        r"""
/** Returns which parts of the map the player may change once these terms are known. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return {
    inboundRules: known.has('inbound-rule'),
    outboundRules: known.has('outbound-rule'),
""",
        r"""
/** Returns which parts of the map the player may change once these terms are known: the inbound rules of a host firewall with `rule`, and of a Security Group with `inbound-rule`. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return {
    inboundRules: { 'host-firewall': known.has('rule'), 'security-group': known.has('inbound-rule') },
    outboundRules: known.has('outbound-rule'),
""",
    ),
)

edit(
    'src/ui/incident/map-cards/task-card.tsx',
    (
        r"""        <p className="muted">
          <TaggedText text={TASK_CARD_TEXT.noRules} />
        </p>
""",
        r"""        <p className="muted">
          <TaggedText text={card.empty} />
        </p>
""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
pnpm test
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `Tests 662 passed (662)` en 46 archivos; `git diff` sin salida; `pnpm check` PASS con 14 de Playwright y `Found 0 clones` (por eso `PING_TO_LUCIA` vive en `shared.ts`). La captura de `#/entidades` no cambia: el catálogo nombra sus piezas con `entityName`, no con las etiquetas del mapa.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(levels): add 01-03 and 01-04, name the office pieces by their terms and write the texts by kind"
```

---

### Task 10: Playwright: el capítulo 1 entero y el 04-01 con estrellas guardadas

El spec pide tres comprobaciones:
- jugar del 01-01 al 01-04 entero;
- que el 04-01 siga abierto con estrellas guardadas;
- que la captura de `#/entidades` no cambie sin querer, cosa que ya cubre `entities.spec.ts`.

Las pruebas nuevas:
- **El capítulo 1 entero,** con animaciones: cada incidente abre el siguiente y cierra con 3 estrellas; al volver al roadmap, el 04-01 queda abierto.
- **El 04-01 con estrellas guardadas,** sin ninguna del capítulo 1.
- **En «Sin animaciones», después de los dos pings del 01-03:** ninguna etiqueta ni sello se superpone, y el ping perdido dice por qué.

Dos ayudantes que `incidents.spec.ts` ya tenía se mudan a módulos compartidos, porque jscpd no deja copiarlos: las cajas del mapa y cerrar el incidente.

**Files:**
- Create: `tests/e2e/chapter-1.spec.ts`, `tests/e2e/closing.ts`, `tests/e2e/map-boxes.ts`
- Modify: `tests/e2e/incidents.spec.ts`, `tests/e2e/CLAUDE.md`

**Interfaces:**
- Consumes: `collectErrors`, `startWithProgress` (Tarea 8).
- Produces: `submitAndFinish(page, answer)` y `FULL_STARS` en `tests/e2e/closing.ts`; `overlaps`, `mapBoxes` y `overlappingPairs` en `tests/e2e/map-boxes.ts`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 9**

```bash
git status --short src tests
pnpm test
```

Expected: nada bajo `src/` ni `tests/`; `Tests 662 passed (662)`.

- [ ] **Step 2: Escribir las pruebas y los ayudantes**

Contenido completo de `tests/e2e/chapter-1.spec.ts`:

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { FULL_STARS, submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { overlappingPairs } from './map-boxes';
import { startWithProgress } from './saved-progress';

const SEND = 'Enviar';
const ECHO_REQUEST = 'ICMP · Echo Request';

function terminal(page: Page): Locator {
  return page.getByRole('dialog', { name: /^Terminal de/ });
}

async function openTerminal(page: Page) {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).click();
  await expect(terminal(page)).toHaveAccessibleName('Terminal de tu-laptop');
}

async function pick(page: Page, ...chips: string[]) {
  for (const chip of chips) await terminal(page).getByRole('button', { name: chip, exact: true }).click();
}

async function next(page: Page, title: string) {
  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

async function sendFromHomeAndYours(page: Page) {
  await openTerminal(page);
  await pick(page, 'Casa de Lucía');
  await expect(terminal(page)).toHaveAccessibleName('Terminal de Casa de Lucía');
  await pick(page, '192.168.1.10', ECHO_REQUEST, SEND, 'tu-laptop', '192.168.1.11', SEND);
}

test('chapter 1 is played from 01-01 to 01-04, each incident opening the next, with 3 stars each', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La dirección' }).click();
  await openTerminal(page);
  await pick(page, '192.168.1.20', SEND);
  await submitAndFinish(page, /Por la dirección IP de destino/);

  await next(page, 'Ida y vuelta');
  await openTerminal(page);
  await pick(page, '192.168.1.11', ECHO_REQUEST, SEND);
  await submitAndFinish(page, /Solo un Echo Request pide respuesta/);

  await next(page, 'Desde afuera');
  await sendFromHomeAndYours(page);
  await submitAndFinish(page, /es una IP privada/);

  await next(page, 'El firewall');
  await page.getByRole('button', { name: 'firewall laptop-lucia', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'firewall laptop-lucia' });
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await card.getByRole('button', { name: 'tu-laptop (IP 192.168.1.10)', exact: true }).click();
  await card.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /Lo bloqueó/);

  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  for (const id of ['01-01', '01-02', '01-03', '01-04']) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.getByRole('link', { name: '1. El primer ping' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it', async ({ page }) => {
  await startWithProgress(page, { '04-01': 2 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: '1. El primer ping' })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.getByRole('link', { name: '2. Abre lo justo' })).toBeVisible();
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText('(bloqueado)');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El primer ping' })).toBeVisible();
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('after the pings of 01-03, no label or stamp overlaps, and the lost ping says why', async ({ page }) => {
    await startWithProgress(page, { '01-02': 3 });
    await page.goto('/#/level/01-03');
    await sendFromHomeAndYours(page);
    await terminal(page).getByRole('button', { name: 'Listo' }).click();
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
    await page.getByRole('button', { name: /^Paquete: ping de Casa de Lucía/ }).hover();
    await expect(page.getByRole('region', { name: 'ping de Casa de Lucía a 192.168.1.10' })).toContainText('Internet no entrega paquetes a una IP privada');
  });
});
```


Contenido completo de `tests/e2e/closing.ts`:

```ts
import { expect, type Page } from '@playwright/test';

export const FULL_STARS = '3 de 3 estrellas';

/** Sends the solution, gives Lucía this answer and opens the result, which must show 3 stars. */
export async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: 'Enviar solución' }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}
```


Contenido completo de `tests/e2e/map-boxes.ts`:

```ts
import type { Page } from '@playwright/test';

export interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** True when two boxes on the screen overlap; a missing box overlaps nothing. */
export function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Returns the box of every label and every stamp on the map, named as a screen reader reads it. */
export async function mapBoxes(page: Page): Promise<Box[]> {
  return page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

/** Returns every pair of labels or stamps of the map that overlap, as "a / b". */
export async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes = await mapBoxes(page);
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
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
    'tests/e2e/incidents.spec.ts',
    (
        r"""import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';
""",
        r"""import { expect, test, type Locator, type Page } from '@playwright/test';
import { FULL_STARS, submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { mapBoxes, overlappingPairs, overlaps, type Box } from './map-boxes';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';
""",
    ),
    (
        r"""const INSPECTION_TITLE = 'servidor2';
const FULL_STARS = '3 de 3 estrellas';
const QUESTION = /¿Qué pasó\?/;

interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Size = Pick<Box, 'width' | 'height'>;

function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

""",
        r"""const INSPECTION_TITLE = 'servidor2';
const QUESTION = /¿Qué pasó\?/;

type Size = Pick<Box, 'width' | 'height'>;

""",
    ),
    (
        r"""  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
}

async function mapBoxes(page: Page): Promise<Box[]> {
  return page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes = await mapBoxes(page);
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}
""",
        r"""  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
}
""",
    ),
    (
        r"""  await card.getByRole('button', { name: source, exact: true }).click();
}

async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: SUBMIT }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}
""",
        r"""  await card.getByRole('button', { name: source, exact: true }).click();
}
""",
    ),
)
EOF
```

- [ ] **Step 3: La guía de `tests/e2e`**

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
    'tests/e2e/CLAUDE.md',
    (
        r"""- Interact through roles and labels, the way a player would.
- Shared helpers (`console-errors.ts`, and `saved-progress.ts` to open a page with progress already saved) are plain modules next to the specs. A spec that plays a later chapter starts with the chapters before it done.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
""",
        r"""- Interact through roles and labels, the way a player would.
- Shared helpers are plain modules next to the specs: `console-errors.ts`, `saved-progress.ts` (open a page with progress already saved), `closing.ts` (send the solution, answer Lucía and see the stars) and `map-boxes.ts` (the boxes of the map's labels and stamps, and the pairs that overlap). A spec that plays a later chapter starts with the chapters before it done.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
""",
    ),
)
EOF
```

- [ ] **Step 4: Verificar**

Estas pruebas ya pasan sobre la Tarea 9: prueban lo que las tareas anteriores construyeron.

```bash
pnpm exec playwright test chapter-1
pnpm check
```

Expected: los 3 tests de `chapter-1.spec.ts` pasan. `pnpm check` PASS: `Found 0 clones`, `Tests 662 passed (662)` y 17 tests de Playwright.

- [ ] **Step 5: Commit**

```bash
git add tests
git commit -m "test(e2e): play chapter 1 to the end and keep 04-01 open with its stored stars"
```

---

### Task 11: Documentos: backlog, hoja de ruta, README y el spec anterior

> **Ajustes de la revisión (ver esa sección):**
> - La nota de E4 del backlog dice lo que es cierto tras el ajuste 1. El script de abajo decía que en el 01-01 la terminal tapa la impresora; ya no.
> - La fila «Prueba humana del capítulo 1» de la hoja de ruta pasa de `idea` a `siguiente`, con la decisión pendiente del «primer día lento».
> - El commit incluye este plan.
> - La revisión final reescribió después la nota de E4 (la terminal se acopla en el 01-03) y sumó el bloque H del backlog.
> - Los números de tests de esta tarea son los reales: 701 tests en 48 archivos y 20 de Playwright, no los del ensayo.

El cierre en los documentos:
- **El backlog:** marca F4 a F6, G3 a G5, G7 y G8 como hechos, con su tarea. Además anota lo de E4 y la terminal: el plan creía que la alcanzaba; tras el ajuste 1 y la revisión final ya no.
- **La hoja de ruta:** «Capítulo 1 jugable» pasa a «En curso» con el enlace a este plan.
- **El README del proyecto:** dice que el capítulo 1 se juega y enlaza este plan.
- **El spec de incidentes en vivo:** su tabla del capítulo 4 pasa a decir qué términos ya no trae el 04-01 ni el 04-02, como pide la sección «Cambios en el capítulo 4» del spec del capítulo 1.

Los scripts coinciden con el backlog de `58c548e`, que ya marca E10 como hecho.

**Files:**
- Modify: `README.md`, `docs/plans/2026-10-08-follow-the-packet-followups.md`, `docs/plans/follow-the-packet-roadmap.md`, `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`

- [ ] **Step 1: Comprobar que se parte de la Tarea 10**

```bash
git status --short src tests ../../docs
```

Expected: nada bajo `src/`, `tests/` ni `docs/`, salvo este plan (`docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`) si todavía no se commiteó.

- [ ] **Step 2: Editar los documentos**

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
    '../../docs/plans/2026-10-08-follow-the-packet-followups.md',
    (
        r"""> **Estado (capítulo 1, plan 2, `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`):** hechos F1, F2, F3 y E6 (el «!» vive dentro de la etiqueta). E7 queda decidido por la ficha de Actor: un personaje no lleva candado. E5 quedó resuelto con los sellos cercanos (Tarea 10 y arreglo final). Siguen pendientes E4, E8 y E9, F4 a F6 (plan 3), el bloque G, A1, A2 y el bloque D.

""",
        r"""> **Estado (capítulo 1, plan 2, `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`):** hechos F1, F2, F3 y E6 (el «!» vive dentro de la etiqueta). E7 queda decidido por la ficha de Actor: un personaje no lleva candado. E5 quedó resuelto con los sellos cercanos (Tarea 10 y arreglo final). Siguen pendientes E4, E8 y E9, F4 a F6 (plan 3), el bloque G, A1, A2 y el bloque D.

> **Estado (capítulo 1, plan 3, `docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md`):** hechos F4 (los textos de la respuesta y de `route-private` según el tipo de red y de firewall), F5, F6, G3, G4, G5, G7 y G8. E4 sigue pendiente y ahora alcanza también a la tarjeta terminal: en el 01-01 tapa la impresora. Siguen pendientes E4, E8, E9, G1, G2, G9, A1, A2 y el bloque D.

""",
    ),
    (
        r"""| F3 | Faltan tests de escena para el ping a la propia IP y para la IP que nadie tiene | Hecho en el plan 2 (Tarea 5) |
| F4 | Los textos de la respuesta y de `route-private` todavía nombran el Security Group y la VPC, también en una oficina | Plan 3 (textos por tipo) |
| F5 | El esquema acepta dos dispositivos con la misma IP privada | Plan 3 (regla del esquema con su test) |
| F6 | Una VPC con rango no privado (por ejemplo `100.64.0.0/16`) deja que un actor de internet llegue a una IP privada; antes del plan 1 se bloqueaba. El spec dice que en el juego toda VPC usa rangos de RFC 1918 | Plan 3: el esquema exige un `cidr` de RFC 1918 también en la VPC |

""",
        r"""| F3 | Faltan tests de escena para el ping a la propia IP y para la IP que nadie tiene | Hecho en el plan 2 (Tarea 5) |
| F4 | Los textos de la respuesta y de `route-private` todavía nombran el Security Group y la VPC, también en una oficina | Hecho en el capítulo 1, plan 3 (Tarea 9): la red de la oficina y el firewall de la laptop tienen sus textos |
| F5 | El esquema acepta dos dispositivos con la misma IP privada | Hecho en el capítulo 1, plan 3 (Tarea 1) |
| F6 | Una VPC con rango no privado (por ejemplo `100.64.0.0/16`) deja que un actor de internet llegue a una IP privada; antes del plan 1 se bloqueaba. El spec dice que en el juego toda VPC usa rangos de RFC 1918 | Hecho en el capítulo 1, plan 3 (Tarea 1): el esquema exige un rango de RFC 1918 en toda red |

""",
    ),
    (
        r"""| G2 | La lógica de cada cuadro de `PacketRun` no tiene test unitario (`src/scene/entities/packet.tsx:56`): si el arreglo del paquete perdido se rompiera, solo se vería en el mapa animado | Pendiente |
| G3 | Todo `timeout` que no es «perdido» se dibuja como un bloqueo de firewall, con ✕ y estallido (`src/scene/traffic/flow-look.ts`): un `timeout` de ruta o de DNS parecería un firewall que dice no | Plan 3 |
| G4 | En una oficina sin nadie afuera, un paquete a una IP pública suma el punto del borde, que no se dibuja: el paquete viajaría a un lugar invisible (`src/scene/layout.ts`, `pathFor`) | Plan 3 |
| G5 | `spreadStamps` no tiene test del encadenamiento (A cerca de B, B cerca de C, A lejos de C) y no compara grupos entre sí: `[[0,0],[0,0],[1,0]]` deja dos sellos a 0.72, bajo el mínimo de 0.8 (`src/scene/layout.ts`) | Plan 3: en la oficina caen varios sellos en el mismo dispositivo |
| G6 | La etiqueta del actor tapa la mitad de abajo de su cubo (`LABEL_OFFSET.actor` en `src/scene/layout.ts`) | Plan 2, Tarea 11 |
| G7 | `inspect()` devuelve la inspección del borde y de internet aunque nadie esté afuera y esas piezas no se dibujen (`src/game/view/inspection.ts:131-132`); hoy la interfaz no llega ahí | Plan 3 |
| G8 | El lector de pantalla no dice el estado del sello: ✓, ✕ y ? suenan igual (`src/scene/entities/stamp.tsx`). Viene de antes del plan 2 | Plan 3 (los sellos de «enviar») |
| G9 | La prueba animada del catálogo espera 7 s calculados a mano (`WATCH_MS` en `tests/e2e/entities.spec.ts:7`): si el horario crece, deja de cubrir el último paquete sin avisar | Pendiente: calcularlo desde el horario |
""",
        r"""| G2 | La lógica de cada cuadro de `PacketRun` no tiene test unitario (`src/scene/entities/packet.tsx:56`): si el arreglo del paquete perdido se rompiera, solo se vería en el mapa animado | Pendiente |
| G3 | Todo `timeout` que no es «perdido» se dibuja como un bloqueo de firewall, con ✕ y estallido (`src/scene/traffic/flow-look.ts`): un `timeout` de ruta o de DNS parecería un firewall que dice no | Hecho en el capítulo 1, plan 3 (Tarea 5): solo un firewall bloquea; lo demás se dibuja como perdido |
| G4 | En una oficina sin nadie afuera, un paquete a una IP pública suma el punto del borde, que no se dibuja: el paquete viajaría a un lugar invisible (`src/scene/layout.ts`, `pathFor`) | Hecho en el capítulo 1, plan 3 (Tarea 5) |
| G5 | `spreadStamps` no tiene test del encadenamiento (A cerca de B, B cerca de C, A lejos de C) y no compara grupos entre sí: `[[0,0],[0,0],[1,0]]` deja dos sellos a 0.72, bajo el mínimo de 0.8 (`src/scene/layout.ts`) | Hecho en el capítulo 1, plan 3 (Tarea 5): dos grupos que se acercan se unen |
| G6 | La etiqueta del actor tapa la mitad de abajo de su cubo (`LABEL_OFFSET.actor` en `src/scene/layout.ts`) | Plan 2, Tarea 11 |
| G7 | `inspect()` devuelve la inspección del borde y de internet aunque nadie esté afuera y esas piezas no se dibujen (`src/game/view/inspection.ts:131-132`); hoy la interfaz no llega ahí | Hecho en el capítulo 1, plan 3 (Tarea 6) |
| G8 | El lector de pantalla no dice el estado del sello: ✓, ✕ y ? suenan igual (`src/scene/entities/stamp.tsx`). Viene de antes del plan 2 | Hecho en el capítulo 1, plan 3 (Tarea 5): el sello dice su paquete y cómo terminó |
| G9 | La prueba animada del catálogo espera 7 s calculados a mano (`WATCH_MS` en `tests/e2e/entities.spec.ts:7`): si el horario crece, deja de cubrir el último paquete sin avisar | Pendiente: calcularlo desde el horario |
""",
    ),
)

edit(
    '../../docs/plans/follow-the-packet-roadmap.md',
    (
        r"""| **Catálogo de entidades** (capítulo 1, plan 2): cada pieza del mapa en su archivo, con su ícono 2D; piezas de oficina; Echo Request y Echo Reply por forma; estado «perdido»; página `#/entidades` | Las mismas piezas sirven en todos los capítulos, y la captura de Playwright avisa si una cambia sin querer | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 2](2026-10-09-follow-the-packet-entity-catalog.md). Tareas 1 a 10 hechas (`91f30b1..f2fee1e`), falta la 11 |
| **El nombre propio se ve como etiqueta.** En «Security Group servidor2», «servidor2» va en letra de código dentro de una cajita sombreada (estilo B); «Security Group» queda igual. Aplica al mapa, a la tarjeta del Security Group y a la caja de inspección | «Para saber que no son entidades». Además es fiel a AWS: «servidor2» es el valor de la etiqueta `Name` del recurso | Prueba del estudiante, 2026-10-09. [Prototipo con las opciones](https://claude.ai/artifact/MDFXJtYLUqMHtJgxxQHQ71) | `en curso`: Tarea 11 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md) |
""",
        r"""| **Catálogo de entidades** (capítulo 1, plan 2): cada pieza del mapa en su archivo, con su ícono 2D; piezas de oficina; Echo Request y Echo Reply por forma; estado «perdido»; página `#/entidades` | Las mismas piezas sirven en todos los capítulos, y la captura de Playwright avisa si una cambia sin querer | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 2](2026-10-09-follow-the-packet-entity-catalog.md). Tareas 1 a 10 hechas (`91f30b1..f2fee1e`), falta la 11 |
| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 3](2026-10-09-follow-the-packet-chapter-1-send.md) |
| **El nombre propio se ve como etiqueta.** En «Security Group servidor2», «servidor2» va en letra de código dentro de una cajita sombreada (estilo B); «Security Group» queda igual. Aplica al mapa, a la tarjeta del Security Group y a la caja de inspección | «Para saber que no son entidades». Además es fiel a AWS: «servidor2» es el valor de la etiqueta `Name` del recurso | Prueba del estudiante, 2026-10-09. [Prototipo con las opciones](https://claude.ai/artifact/MDFXJtYLUqMHtJgxxQHQ71) | `en curso`: Tarea 11 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md) |
""",
    ),
    (
        r"""|------|---------|--------|--------|
| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `siguiente`: plan por escribir |
| **Design system del juego.** Un `DESIGN.md` con los colores, las letras, la escala tipográfica y de espacios y las reglas visuales. Una sección nueva en `#/entidades` con cada elemento de la interfaz en vivo (botones, fichas, tarjetas, etiquetas del mapa, nombre propio y sellos), dentro de la captura de Playwright | Hoy los colores viven en `src/styles.css` y se repiten en `src/scene/theme.ts`. Las reglas están repartidas en dos specs y los tamaños se eligieron caso por caso. Con un catálogo, un cambio sin querer rompe la prueba | Pregunta del estudiante, 2026-10-09. Relacionado con el bloque D del backlog (reglas `design-tokens` y `primitive-semantic-tokens` sin decidir) | `siguiente`: después del plan 2 |
""",
        r"""|------|---------|--------|--------|
| **Design system del juego.** Un `DESIGN.md` con los colores, las letras, la escala tipográfica y de espacios y las reglas visuales. Una sección nueva en `#/entidades` con cada elemento de la interfaz en vivo (botones, fichas, tarjetas, etiquetas del mapa, nombre propio y sellos), dentro de la captura de Playwright | Hoy los colores viven en `src/styles.css` y se repiten en `src/scene/theme.ts`. Las reglas están repartidas en dos specs y los tamaños se eligieron caso por caso. Con un catálogo, un cambio sin querer rompe la prueba | Pregunta del estudiante, 2026-10-09. Relacionado con el bloque D del backlog (reglas `design-tokens` y `primitive-semantic-tokens` sin decidir) | `siguiente`: después del plan 2 |
""",
    ),
)

edit(
    '../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md',
    (
        r"""|---|-----------|-----|----------|-----------------|
| 1 | El primer ping | Defensor | servidor1 no logra hacer ping a servidor2 | instancia EC2, VPC, IP privada, ping, Security Group (solo deja pasar), regla de entrada = Type + Source, ICMP, Echo Request, Anywhere-IPv4 (0.0.0.0/0), Internet gateway |
| 2 | Abre lo justo | Defensor | Alguien cambió el Security Group de servidor2 y el ping volvió a fallar | Echo Reply (la vuelta del ping), mínimo privilegio |
| 3 | El camino de vuelta | Defensor | Ahora servidor2 quiere hacer ping a servidor1 | stateful (el Security Group recuerda la conversación), reglas de salida |
""",
        r"""|---|-----------|-----|----------|-----------------|
| 1 | El primer ping | Defensor | servidor1 no logra hacer ping a servidor2 | instancia EC2, VPC, Security Group (solo deja pasar), regla de entrada = Type + Source, Anywhere-IPv4 (0.0.0.0/0), Internet gateway. IP privada, ping, ICMP y Echo Request llegan en el capítulo 1 (spec del capítulo 1, «Escalera de términos») |
| 2 | Abre lo justo | Defensor | Alguien cambió el Security Group de servidor2 y el ping volvió a fallar | mínimo privilegio. Echo Reply llega en el capítulo 1 |
| 3 | El camino de vuelta | Defensor | Ahora servidor2 quiere hacer ping a servidor1 | stateful (el Security Group recuerda la conversación), reglas de salida |
""",
    ),
)

edit(
    'README.md',
    (
        r"""
A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, is on the `#/entidades` page, which the roadmap does not link to.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md)

""",
        r"""
A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module. Chapter 1 is playable: four incidents at the office with Lucía, where the player sends packets from a terminal (IP address, ping, Echo Request and Echo Reply, private IPs and the internet) and opens a host firewall. Chapter 4 is being rebuilt as live incidents based on [lab 03](../../labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, is on the `#/entidades` page, which the roadmap does not link to.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md) · [chapter 1](../../docs/plans/2026-10-09-follow-the-packet-chapter-1-send.md)

""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS con `Found 0 clones`, `Tests 662 passed (662)` en 46 archivos y 17 tests de Playwright.

Desde la raíz del repo, corre el chequeo de links de `CLAUDE.md` (cubre el README del proyecto): `LINKS OK`.

- [ ] **Step 4: Commit**

```bash
git add README.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md ../../docs/plans/follow-the-packet-roadmap.md ../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md
git commit -m "docs: mark F4 to F6, G3 to G5, G7 and G8 done, and put chapter 1 in progress"
```

---

## Cobertura del spec

| Pide el spec (plan 3) | Dónde |
|------------------------|-------|
| Contrato `send`: `mechanic`, `send: { from, to, message }` con al menos una ficha por lista, tareas `expect` con `replied` o `any`, flujos solo `ambient`, solución `sendPacket` | Tarea 4 |
| El esquema: cada `expect` usa fichas ofrecidas; la solución cumple todas las tareas al reproducirse; ninguna combinación saca un paquete de la oficina | Tarea 4 (esquema, `game/incidents.test.ts`, `officeLeaks` en el test del registro; Desviación 8) |
| Jugada `sendPacket`: arma, simula y guarda en `sent` el último envío de cada combinación; el reenvío de la misma combinación | Tarea 4 (`session.test.ts`) |
| Las tareas de envío se cumplen con su combinación y su resultado | Tarea 4 (`tasks.test.ts`) |
| «Enviar solución» y el rechazo de Lucía como hoy; el rechazo se borra con un envío nuevo | Tarea 4 |
| `Stars = { closed, middle, explained }`: «sin abrir de más» en `filter`, «sin pistas» en `send`; el guardado sigue de 0 a 3 | Tarea 4 (`earnsMiddle`) |
| Tarjeta terminal junto al origen, que se mueve con otro origen; `ping <IP>` y la línea del Echo Reply sin inventar comando; «Enviar» con clic y teclado; las mismas bandejas que la tarjeta de tarea | Tareas 5 (ancla), 6 (vista) y 7 (`ChipCard`, `ChipTray`, `TerminalCard`) |
| Cada envío se anima una vez; el último de cada combinación deja su sello | Tarea 5 |
| Inspección: el dispositivo con nombre, tipo, IP y firewalls; el paquete con origen, destino, mensaje (desde el 01-02), dónde llegó o murió y por qué; la IP de los actores oculta | Tareas 6 y 8 (Desviación 10) |
| `configurableParts` mira el tipo de firewall | Tarea 9 |
| Mundo del capítulo 1, incidentes 01-01 a 01-04 con sus fichas, tareas, preguntas y textos | Tareas 8 y 9; «El capítulo 1 en el juego» |
| 18 términos, ≤ 120 caracteres, sin términos posteriores; redefinidos ping, ICMP, Echo Request, Echo Reply e IP privada | Tareas 8 y 9 |
| La prueba de fugas compara palabras completas; «Internet» en ICMP como excepción declarada | Tareas 8 y 9 |
| El 04-01 deja de introducir IP privada, ping, ICMP y Echo Request; el 04-02, Echo Reply | Tareas 8 y 9; el spec anterior en la Tarea 11 |
| `isUnlocked`: primero, anterior con estrellas, o él mismo con estrellas | Tarea 2; Playwright en la Tarea 10 |
| Riesgo «nombres dentro de los motivos» | «Los nombres de la oficina»; Desviación 1; Tarea 9 |
| Playwright: el capítulo 1 entero; el 04-01 abierto con estrellas guardadas; la captura sin cambios sin querer | Tarea 10; captura regrabada a propósito solo en la Tarea 3 |
| F4, F5, F6 | Tareas 9 (F4) y 1 (F5, F6) |
| G3, G4, G5, G7, G8 | Tareas 5 (G3, G4, G5, G8) y 6 (G7) |
| La casa de Lucía como tipo de actor | Tarea 3 |
| La regla del estudiante: un estándar por elemento de interfaz | «Elementos de interfaz»; Tarea 7 |
