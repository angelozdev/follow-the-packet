# Sigue el paquete · Capítulo 1, plan 2 de 3: el catálogo de entidades

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar las piezas del mapa a un catálogo de entidades (`src/scene/entities/`, un archivo por entidad con su pieza y su ícono 2D), sumar las variantes y los estados de las fichas del spec (laptop, impresora, router, internet, firewall de la laptop, Echo Request y Echo Reply, «perdido»), dibujar la oficina en el mapa y abrir la página `#/entidades` con su captura de Playwright, sin cambiar lo que el motor calcula para el capítulo 4.

**Architecture:**
1. El motor usa el `edge` de la red (F2): el esquema exige un router en una oficina y un Internet gateway en una VPC, y la etapa `route` escribe el borde real (`router` o `internet-gateway`) donde hoy escribe `igw`. El test dorado traduce `internet-gateway` a `igw` con su tabla de renombres; el JSON no cambia.
2. Dos refactors puros. Primero la vista toma los nombres del modelo (`device`, `firewall`, `edge`) en vez de `server`, `barrier` y `gateway`. Después las piezas pasan al catálogo `src/scene/entities/`, con `ink.tsx` (la caja de papel) y `road.tsx` al lado.
3. `copy` declara el vocabulario de las entidades: `EntityRef` (entidad y variante; las variantes son los `kind` del modelo) y `ENTITY_TERMS` (qué término nombra cada variante). `game/view` arma cada pieza con su entidad, su variante, su término y su estado; la escena dibuja cada pieza desde esa lista y no decide nada.
4. El layout pone una oficina en una sola fila y, mientras alguien esté afuera, el borde, internet y los actores a la izquierda (F1). Los caminos nuevos (ping a la propia IP, IP que nadie tiene, perdido en internet) tienen sus tests (F3).
5. Paquetes y sellos: Echo Request y Echo Reply se distinguen por la forma, el regreso de un ping se dibuja como Echo Reply y llega el estado «perdido», distinto de «bloqueado».
6. Cada archivo del catálogo exporta su ícono 2D. `TERM_ENTITY` (término → entidad) pone el ícono en el glosario y la inspección dice qué entidad muestra, para la cabecera de la caja.
7. La página `#/entidades` (`src/ui/catalog/` y `src/scene/catalog/`) muestra cada entidad en cada variante y estado, con una captura de Playwright quieta, a tamaño y densidad de píxeles fijos y sin fuentes web.

**Tech Stack:** Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9 (`Billboard`, `Html`, `Line`), three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, Vitest 5.0.3, Testing Library + user-event, Playwright 1.64 (`toHaveScreenshot`). Sin dependencias nuevas.

**Spec:** `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`. Mandan las secciones "Catálogo de entidades" (formato de la ficha, fichas y dónde vive), "Decisiones" (fila Entidades), "Entrega" (punto 2), "Tests y validación" (Interfaz y Playwright: la captura de `/entidades`) y "Riesgos" (capturas de WebGL). Spec anterior, que este amplía: `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md` ("Escena y arte", "Escalera de términos"). Plan anterior, ya implementado: `docs/plans/2026-10-09-follow-the-packet-generic-model.md` (commits `8f916a9..1a84c42`). Pendientes que cierra: `docs/plans/2026-10-08-follow-the-packet-followups.md`, filas F1, F2, F3 y E6 (E7 queda decidida). Donde el código y los planes viejos difieren, manda el código.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` (raíz del repo). Todos los comandos se corren desde `projects/follow-the-packet/`.
- **Rama.** `feat/live-incidents`. No se crea otra.
- **Punto de partida verificado (2026-10-09):** `npx vitest run` pasa entero, con **452 tests en 40 archivos**, y `npm run check` también (10 tests de Playwright). Al cerrar cada tarea: Tareas 1, 2 y 3, 455 tests en 40 archivos; Tarea 4, 461; Tarea 5, 472; Tarea 6, 475 (Playwright, 11); Tarea 7, 482 en 41; Tarea 8, 502 en 42; Tarea 9, 509 en 44 (Playwright, 14); Tarea 10, 511 en 44 (Playwright, 14).
- **Plan ensayado (Tareas 1 a 9).** Las tareas se implementaron en orden sobre una copia limpia del proyecto en el estado de partida, con un commit por tarea; los bloques de código de este documento salen de esos commits y se volvieron a aplicar, tal cual, sobre otra copia limpia. Al cerrar cada tarea pasan `tsc`, ESLint, la estructura, jscpd, Vitest y Playwright con los números de arriba, y `golden-traces.json` no cambia.
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: capas `app → ui → game · scene · storage → levels → copy → engine`, barrels, alias `@/` y nada de `../`. Tope de 12 archivos por carpeta (sin contar `CLAUDE.md`): `src/scene/entities/`, `src/scene/`, `src/ui/` y `src/copy/` terminan con 11 cada una.
  - `view-renders-domain-result`: `scene/` y `ui/` solo importan tipos de `@/engine`; el estado de una pieza o de un paquete llega calculado.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. Texto visible en español solo en `src/copy/` y en los archivos de incidente.
  - `no-raw-effects`: nada de `useEffect` en componentes; `useStillMode` envuelve `useReducedMotion` de `@mantine/hooks`.
  - `dry`: jscpd con umbral 0 (`npm run dup`). Por eso existen `MapCanvas` y `MotionToggle`.
  - `user-event-for-interactions`: los tests de interacción usan `userEvent.setup()` y esperan cada llamada.
  - `rigorous-plain-copy`: nombre oficial de AWS donde hay término; los nombres de la oficina que todavía no son términos (laptop, impresora, router, internet, firewall) van en texto llano hasta el plan 3.
  - `caller-controls-visibility`: el que compone decide si un ícono se dibuja (`{entity && <EntityIcon … />}`), nunca el ícono.
- **El motor no cambia lo que calcula para el capítulo 4.** `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibido `vitest -u`, `--update` y editarlo a mano. Cada tarea lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Si el test dorado falla, se corrige el código.
- **Cambios visibles del capítulo 4, todos pedidos por el spec:** el globo de internet entre el atacante y el Internet gateway (Tarea 5); la barra del Security Group en papel mientras no frena nada, en bermellón mientras frena (Tarea 6); el «!» de alerta dentro de la etiqueta de la instancia y un borde doble quieto (Tarea 6); los paquetes planos, el regreso del ping como Echo Reply y la figura del paquete sobre el trazo quieto (Tarea 7); los íconos del glosario y de la caja (Tarea 8). Ningún texto del capítulo 4 cambia.
- **Scripts de edición.** Los cambios en archivos que ya existen llegan como scripts de Python 3 que se pegan tal cual en la terminal (`python3 - <<'EOF' … EOF`). Cada reemplazo exige encontrar exactamente una vez el texto viejo y, si no, el script se detiene con `expected 1 match`. Si eso pasa, el árbol no es el que el plan supone: se para y se avisa, sin arreglar a mano. Un archivo nuevo, o uno que cambia casi entero, llega como «Contenido completo de `ruta`»: se escribe tal cual.
- **"Listo"** = `npm run check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea termina con `npm run check` en verde.
- **Commits.** Un commit por tarea, con `git add` de las rutas que la tarea lista. Nunca se agregan `pnpm-lock.yaml`, `pnpm-workspace.yaml` ni nada de `labs/03-ping-connectivity/`.
- **Captura.** Playwright guarda la captura de la Tarea 9 por plataforma: `tests/e2e/snapshots/entities-darwin.png`. Solo se regraba a propósito (`--update-snapshots`) cuando una tarea cambia cómo se ve una entidad, y se commitea con ese cambio.
- **Servidores.** No se arranca `npm run dev` ni nada en los puertos 5173 y 5180: ahí corre el servidor del estudiante. Playwright levanta su propio servidor en el 4183.
- Ningún comando `aws`.

## Vocabulario: qué cambia de nombre (Tarea 2)

Lo que el plan 1 dejó "igual" para este plan.

| Antes | Después | Dónde |
|-------|---------|-------|
| clases de pieza `server`, `barrier`, `gateway` | `device`, `firewall`, `edge` (`actor` sigue; llega `internet` en la Tarea 5) | `PieceKind`, `MapPieceKind`, `PieceRef`, `PIECE_ID`, ids de pieza (`device:servidor2`, `firewall:sg-servidor2`, `edge`) |
| `PIECE_TERM` | `entityTerm` (Tarea 4) | `game/view/pieces.ts` → `src/copy/terms.ts` |
| `GATEWAY_ANCHOR = 'igw'` | `EDGE_ANCHOR = 'edge'` | `game/view/pieces.ts` |
| `BarrierCard`, `barrierCard`, `game/view/barrier.ts` | `FirewallCard`, `firewallCard`, `game/view/firewall-card.ts` | `game`, `ui/incident` |
| `intrudedServerIds` | `intrudedDeviceIds` (y en la Tarea 6 pasa a ser el estado de la pieza) | `game/flow-runs.ts`, `GameScene` |
| `Layout.instances`, `InstanceSpot`, `spot.barrier`, `Layout.igw` | `Layout.devices`, `DeviceSpot`, `spot.firewall`, `Layout.edge` | `scene/layout.ts` |
| `Building`, `Barrier`, `Gateway`, `Sheet`, `ActorMark`, `PacketRun`, `StillPath`, `Stamp` | `DevicePiece`, `FirewallPiece`, `EdgePiece`, `NetworkPiece`, `ActorPiece`, `PacketRun`, `PacketTrace`, `StampPiece` (Tarea 3) | `src/scene/entities/` |
| `MAP_TEXT.barrier`, `MAP_TEXT.gateway` | `MAP_TEXT.firewall`, `MAP_TEXT.edge` (por tipo desde la Tarea 4) | `copy/incident-ui.ts` |
| `INSPECTION_TEXT.securityGroups`, `INSPECTION_TEXT.gatewayDoes` | `INSPECTION_TEXT.firewalls`, `INSPECTION_TEXT.edgeDoes` (por tipo desde la Tarea 4) | `copy/incident-ui.ts` |
| clases CSS `stamp--pass`, `stamp--drop` | `stamp--arrived`, `stamp--blocked` (y llegan `stamp--lost` y `map-button__alert`) | `src/styles.css` |

Se quedan igual: el peer `{ kind: 'sg', sgId }`, `echoFrom(id, sgId)`, la constante `SG` del capítulo 4 y el ayudante `server()` de `levels/04-iaas/shared.ts`: nombran el Security Group y la instancia del capítulo, no la vista.

## Fichas: las formas decididas

El spec fija el formato de la ficha y sus límites (tinta sobre papel, bermellón solo para el peligro, nunca solo color, ícono con la misma silueta que la pieza) y deja el diseño de cada forma a este plan. Esta tabla es la decisión que un revisor puede juzgar; la página `#/entidades` la muestra entera. Todas las piezas se arman con `InkBox` (caja de papel con aristas de tinta), como hoy.

| Entidad | Forma base | Variantes: el detalle que las separa | Estados (props) | Movimiento y versión quieta |
|---------|------------|--------------------------------------|-----------------|------------------------------|
| Red | La losa de papel con borde grueso de tinta (`NetworkPiece`). | VPC: la losa de hoy. Oficina: la losa con una pared baja de papel sombreado a lo largo del borde de atrás. | normal | Ninguno. |
| Dispositivo | Una caja de papel sobre la losa, de frente a la cámara; los paquetes llegan a su puerta, al frente. | Instancia EC2: el edificio de hoy (caja, techo y puerta). Laptop: base baja con teclado y la pantalla de pie atrás. Impresora: caja media con una hoja que asoma arriba y una bandeja al frente. | normal · con candado (en la etiqueta) · seleccionado (una alfombra de papel sombreado debajo; para la tarjeta terminal del plan 3) · alerta (un «!» bermellón dentro de la etiqueta) | Tiembla mientras entra algo prohibido; quieto, un borde doble de tinta alrededor. |
| Firewall | Dos postes y una barra delante de su dispositivo. | Security Group: la barra fina de hoy. Firewall de la laptop: la barra es un muro bajo de ladrillos, con las juntas en tinta. | con candado y configurable (en la etiqueta) · seleccionado (una alfombra de papel sombreado debajo, como el dispositivo; la barra late y, quieta, queda más gruesa) · bloqueó algo (la barra en bermellón; en reposo, en papel sombreado) | El destello al bloquear es el estallido del paquete sobre la barra; quieto, la barra queda en bermellón. |
| Salida a internet | El arco sobre el camino. | Internet gateway: el arco de hoy. Router: el arco con dos antenas. | con candado (en la etiqueta) | Ninguno. |
| Internet | Un globo de papel con su contorno, el ecuador y dos meridianos en tinta. | Una sola. | normal | Ninguno. |
| Actor | Un cubo pequeño. | Atacante: cubo de tinta. Tu Mac: cubo de papel. La casa de Lucía llega en el plan 3, con su tipo de actor en el modelo. | normal (sin candado: es un personaje) | Ninguno. |
| Paquete | Una figura plana que siempre mira a la cámara (`Billboard`): el mismo trazo que su ícono. | Echo Request: punto lleno. Echo Reply: anillo. Intruso: rombo bermellón, lleno si pide y hueco si responde. | en viaje · llegó · llegó y volvió (regresa como Echo Reply) · bloqueado · perdido | Viaja por el camino; bloqueado estalla en un anillo bermellón; perdido se encoge hasta desaparecer. Quieto: el trazo del recorrido (bermellón si se bloqueó, punteado si se perdió) con la figura a mitad de camino y, si volvió, un Echo Reply cerca del origen. |
| Sello | Un botón redondo con su marca (HTML), como hoy. | — | llegó ✓ (tinta) · bloqueado ✕ (bermellón) · perdido ? (tinta suave, borde punteado) · intruso ✓ (bermellón, borde doble) | Ninguno. |

**Íconos 2D:** 24×24, trazo de 1.6 en `currentColor`, ocultos al lector de pantalla porque el texto de al lado los nombra. Son el frente de la pieza: la vista isométrica no se lee a 16 px. Cada variante y cada estado del sello tiene su propia forma (lo prueba `entity-icon.test.tsx`).

## Desviaciones del spec y decisiones (para revisar antes de ejecutar)

1. **Ruta.** La app enruta con el hash, así que la página `/entidades` del spec es `#/entidades`. El mapa del curso (el roadmap) no la enlaza.
2. **Archivos del catálogo.** `src/scene/entities/` termina con 11 archivos contados (el spec decía 10 contando el `CLAUDE.md`): las 8 entidades, `index.ts`, `entity-icon.tsx` (dibuja el ícono de cualquier entidad) y su test. Lo que no es una entidad queda en `src/scene/`: `ink.tsx` (la caja de papel y el marco de los íconos) y `road.tsx`. `traffic/still-path.tsx` también pasa al catálogo: el trazo quieto es la versión quieta del paquete (`PacketTrace`).
3. **El barrel del catálogo.** El resto de la escena importa el catálogo por `@/scene/entities`, como si fuera un paquete; dentro del catálogo, `./x`. La regla `folder-structure` pide importar el archivo dentro de una capa, pero el spec pide el `index.ts` para poder sacar el catálogo a un paquete; el plan lo trata como ese límite y lo escribe en las guías.
4. **El vocabulario de las entidades vive en `copy`** (`src/copy/terms.ts`): `EntityRef`, `ENTITY_TERMS`, `TERM_ENTITY` y `ENTITY_REFS`. `game` (que arma las piezas y la inspección) y `scene` (que las dibuja) no se importan entre sí y los dos importan `copy`. Las variantes son los `kind` del modelo (`Device['kind']`, `FirewallKind`, `Network['edge']`, `Network['kind']`, `Actor['kind']`) y el mensaje del paquete.
5. **Dos tablas, un test.** `ENTITY_TERMS` (variante → término) da la etiqueta y el «Qué es»; `TERM_ENTITY` (término → entidad) da el ícono del glosario. Un test exige que coincidan. El plan 3 suma sus términos en las dos.
6. **El borde e internet solo con alguien afuera.** El modelo exige `edge`, pero el spec trae el router e internet en el 01-03, con la casa de Lucía. Regla, en `game/view`: el mapa dibuja el borde e internet mientras el mundo tenga actores. El capítulo 4 siempre tiene al atacante, así que su mapa gana el globo de internet; el spec dice que el catálogo "se usa igual en todos los capítulos".
7. **Términos que llegan en el plan 3.** Laptop, impresora, router, internet y el firewall de la laptop no tienen término todavía: sus etiquetas van en texto llano (`router`, `internet`, `firewall <nombre>`) y su inspección no empieza con «Qué es». `ENTITY_TERMS` los deja en `null`.
8. **Textos nuevos mínimos.** `INSPECTION_TEXT.edgeDoes.router`, `INSPECTION_TEXT.internetDoes`, `INSPECTION_TEXT.firewalls['host-firewall']`, `INSPECTION_TEXT.inbound['host-firewall']`, `MAP_TEXT.alert` y `CATALOG_TEXT`. La inspección no puede quedar vacía para las piezas nuevas; el plan 3 los revisa con los textos por tipo (F4).
9. **Candado y alerta en la etiqueta.** El spec lista «con candado» y «alerta «!»» como estados del dispositivo. El candado ya vive en la etiqueta; la alerta se muda ahí también, con su texto para el lector de pantalla, y así no puede tapar la etiqueta (cierra E6). La pieza 3D muestra el movimiento: tiembla o, quieta, borde doble.
10. **«Bloqueó algo».** La barra se pinta en bermellón mientras su dispositivo frena un paquete (paso `firewall-in` o `firewall-out` con `drop`). Hoy la barra del Security Group es bermellón siempre, y eso viola «bermellón solo para el peligro»: la barra de servidor1, que no frena nada, queda en papel.
11. **El paquete del intruso en la cabecera de la caja.** El `EntityRef` de un paquete lleva `intruder?` para que el ícono de la caja sea el rombo, como en el mapa.
12. **TCP y UDP.** Ningún flujo los usa todavía; `packetMessage` los dibuja como solicitud y la inspección no les da término. El capítulo que traiga un flujo TCP decide su forma.
13. **El lugar del borde en el recorrido.** La etapa `route` escribe `net.edge` en `at`. Para el capítulo 4 cambia `igw` por `internet-gateway`; el test dorado lo traduce con su tabla de renombres y el JSON no cambia. `deathPoint` de una VPC sin salida devuelve `{ stage: 'route', at: 'internet-gateway' }`.
14. **Los caminos nuevos (F3).** «A su propia IP»: el paquete sale de la puerta hasta el umbral (`doorstep`, entre la puerta y la barra) y vuelve, sin llegar a su firewall ni al camino. «Perdido en la red»: corre por el camino hasta su final y ahí se pierde. «Perdido en internet»: termina en el globo, antes del borde.
15. **La página también se anima.** Tiene la casilla «Sin animaciones», compartida con la pantalla del incidente (`MotionToggle` y `useStillMode`), para revisar el movimiento. La captura se toma quieta.
16. **La captura no depende de la red.** El test bloquea Google Fonts y usa las fuentes del sistema, fija la ventana (1280×2200) y la densidad (1). Si la captura falla sin un cambio de código, se sigue el plan B del spec descrito en la Tarea 9 (comparar la estructura de la página).
17. **E7.** La ficha de Actor no tiene candado («son personajes»): el atacante sigue sin candado por diseño. Lo fija el test de piezas que ya existe (`locked: false`).

## Review Focus

1. **«Sin animaciones» con una intrusión en el 04-01:** el «!» está dentro de la etiqueta de servidor2 y ninguna etiqueta ni sello se superpone (E6). Test: Tarea 6 (`an intrusion shows its alert inside the label of the device, and no label or stamp overlaps`).
2. **Un paquete prohibido que se pierde:** deja el sello de perdido, no el de intrusión. Test: Tarea 7 (`a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion`).
3. **Una oficina sin nadie afuera (el 01-01 y el 01-02 del plan 3):** sin router ni internet, el camino queda en la losa y la cámara mira la losa. Tests: Tarea 5 (`shows no router and no internet while nobody is outside the office` y `without the outside, the road stays on the sheet and the camera looks at the sheet only`).
4. **Un ping a la propia IP:** no cruza su propio firewall ni sale al camino. Test: Tarea 5 (`a ping to its own IP stays at its own doorstep: it never reaches its firewall or the road`).
5. **La página del catálogo con animaciones:** corre sin errores de consola. Test: Tarea 9 (`the entity catalog also runs with its animations, without errors`).

## Árbol al terminar (solo lo nuevo o cambiado)

```
README.md  playwright.config.ts
src/               app.tsx app.test.tsx styles.css
src/engine/        network/{CLAUDE.md,schema.ts,schema.test.ts}  simulation/{CLAUDE.md,simulate.test.ts,stages/route.ts}
src/copy/          CLAUDE.md index.ts terms.ts terms.test.ts incident-ui.ts packet-labels.ts packet-labels.test.ts ui.ts
src/levels/04-iaas/ CLAUDE.md golden-traces.test.ts
src/game/          flow-runs.ts index.ts session.ts stars.ts tasks.ts
│   view/          CLAUDE.md firewall-card.ts (antes barrier.ts) piece-id.ts pieces.ts pieces.test.ts inspection.ts inspection.test.ts ladder.test.ts
src/scene/         CLAUDE.md index.ts game-scene.tsx layout.ts layout.test.ts ink.tsx (nuevo) road.tsx (nuevo) map-canvas.tsx (nuevo)
│   entities/      (nuevo) CLAUDE.md index.ts network.tsx device.tsx firewall.tsx edge.tsx internet.tsx actor.tsx packet.tsx stamp.tsx entity-icon.tsx entity-icon.test.tsx
│   catalog/       (nuevo) CLAUDE.md catalog-cells.tsx catalog-grid.ts catalog-grid.test.ts catalog-scene.tsx
│   overlay/       CLAUDE.md piece-label.tsx piece-label.test.tsx
│   traffic/       CLAUDE.md flow-look.ts (nuevo) flow-look.test.ts (nuevo) flow-traffic.tsx schedule.ts schedule.test.ts traffic.tsx use-packet-runs.ts
│                  (se van: packet-run.tsx, stamp.tsx, still-path.tsx; y src/scene/pieces.tsx)
src/ui/            CLAUDE.md index.ts motion-toggle.tsx (nuevo) use-still-mode.ts (nuevo)
│   catalog/       (nuevo) CLAUDE.md entities-page.tsx entities-page.test.tsx
│   incident/      CLAUDE.md incident-screen.tsx incident-screen.test.tsx inspection-box.tsx lucia-card.tsx lucia-card.test.tsx task-card.tsx task-card.test.tsx
tests/e2e/         CLAUDE.md incidents.spec.ts entities.spec.ts (nuevo)
│   snapshots/     (nuevo) CLAUDE.md entities-darwin.png
docs/plans/2026-10-08-follow-the-packet-followups.md
```

---

### Task 1: El borde de la red en el motor (F2)

El modelo tiene `edge` (`router` o `internet-gateway`) desde el plan 1, pero nadie lo usa: el esquema no lo valida contra el `kind` de la red y la etapa `route` escribe `igw` aunque la red sea una oficina. Esta tarea hace que el esquema exija el borde de cada tipo de red y que `route` escriba el borde real. La escena solo cambia la lista de lugares que cuentan como borde. Para el capítulo 4 el único cambio es el nombre del lugar (`igw` → `internet-gateway`), y el test dorado lo traduce sin tocar el JSON.

**Files:**
- Modify: `src/engine/network/schema.ts`, `src/engine/simulation/stages/route.ts`, `src/scene/layout.ts`, `src/engine/network/CLAUDE.md`, `src/engine/simulation/CLAUDE.md`, `src/levels/04-iaas/CLAUDE.md`
- Test: `src/engine/network/schema.test.ts`, `src/engine/simulation/simulate.test.ts`, `src/levels/04-iaas/golden-traces.test.ts`

**Interfaces:**
- Consumes: `networkSchema`, `routeStage` y el test dorado del plan 1.
- Produces:
  - `networkSchema` rechaza una VPC cuyo `edge` no es `internet-gateway` (`a VPC reaches the internet through an Internet gateway`) y una oficina cuyo `edge` no es `router` (`an office reaches the internet through a router`).
  - Los pasos de `route` y `nat` que hoy dicen `at: 'igw'` dicen `at: net.edge`. Los lugares de un paso quedan: un id de dispositivo, `office` o `vpc`, `router` o `internet-gateway`, e `internet`.
  - `src/scene/layout.ts` reconoce como borde `['internet-gateway', 'router', 'internet']` (la Tarea 5 separa internet del borde).

- [ ] **Step 1: Comprobar el punto de partida**

```bash
git status --short
npx vitest run
```

Expected: `git status` solo muestra lo que ya estaba fuera de esta tarea (`../../labs/03-ping-connectivity/…`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`). Vitest: `Test Files 40 passed (40)` y `Tests 452 passed (452)`. Si Playwright no encuentra Chromium más adelante, correr `npx playwright install chromium`.

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
    'src/engine/network/schema.test.ts',
    (
        r"""  ['a VPC without subnets', { ...lab03Net(), subnets: [] }, 'a VPC needs at least one subnet'],""",
        r"""  ['a VPC without subnets', { ...lab03Net(), subnets: [] }, 'a VPC needs at least one subnet'],
  ['a VPC whose edge is a router', { ...lab03Net(), edge: 'router' }, 'a VPC reaches the internet through an Internet gateway'],""",
    ),
    (
        r"""  ['an office with a region', { ...officeNet(), region: 'eu-west-1' }, 'an office network has no region'],""",
        r"""  ['an office with a region', { ...officeNet(), region: 'eu-west-1' }, 'an office network has no region'],
  ['an office whose edge is an Internet gateway', { ...officeNet(), edge: 'internet-gateway' }, 'an office reaches the internet through a router'],""",
    ),
)

edit(
    'src/engine/simulation/simulate.test.ts',
    (
        r"""    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });""",
        r"""    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet-gateway' });""",
    ),
    (
        r"""    expect(trace.steps).toEqual([{ stage: 'route', at: 'internet', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: OFFICE.you } }]);""",
        r"""    expect(trace.steps).toEqual([{ stage: 'route', at: 'internet', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: OFFICE.you } }]);
  });

  it('a public IP that no device has stops at the edge of the network: the router of an office', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), '34.244.254.100'));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'router' });""",
    ),
)

edit(
    'src/levels/04-iaas/golden-traces.test.ts',
    (
        r"""  ['route-no-public-device', 'route-no-public-instance'],""",
        r"""  ['route-no-public-device', 'route-no-public-instance'],
  ['internet-gateway', 'igw'],""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/engine/network/schema.test.ts src/engine/simulation/simulate.test.ts src/levels/04-iaas/golden-traces.test.ts
```

Expected: FAIL, `Tests 4 failed | 44 passed (48)`: `rejects a VPC whose edge is a router`, `rejects an office whose edge is an Internet gateway`, `without a public IP there is no way out to the internet` (recibe `at: 'igw'`) y `a public IP that no device has stops at the edge of the network: the router of an office` (recibe `at: 'igw'`).

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
        r"""- `networkSchema` checks each kind: a VPC has a region, subnets and a Security Group on every device; an office has no region, no subnets and no public IPs, and its range is private. A Security Group source (`sg`) only exists on a Security Group and points at one.""",
        r"""- `networkSchema` checks each kind: a VPC has a region, subnets, a Security Group on every device and an Internet gateway as its edge; an office has no region, no subnets and no public IPs, its range is private and its edge is a router. A Security Group source (`sg`) only exists on a Security Group and points at one.""",
    ),
)

edit(
    'src/engine/network/schema.ts',
    (
        r"""  if (!net.region) fail('a VPC needs a region');""",
        r"""  if (!net.region) fail('a VPC needs a region');
  if (net.edge !== 'internet-gateway') fail('a VPC reaches the internet through an Internet gateway');""",
    ),
    (
        r"""  if (net.region !== undefined) fail('an office network has no region');""",
        r"""  if (net.region !== undefined) fail('an office network has no region');
  if (net.edge !== 'router') fail('an office reaches the internet through a router');""",
    ),
)

edit(
    'src/engine/simulation/CLAUDE.md',
    (
        r"""- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved` and `lost`. A packet is lost when no device of the network has its IP, or when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP answers itself, past no firewall.""",
        r"""- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved` and `lost`. A packet is lost when no device of the network has its IP, or when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP answers itself, past no firewall.
- A step's `at` names where it happened: a device id, the network (`office` or `vpc`), its edge (`router` or `internet-gateway`) or `internet`.""",
    ),
)

edit(
    'src/engine/simulation/stages/route.ts',
    (
        r"""const GATEWAY = 'igw';
""",
        r"""""",
    ),
    (
        r"""    ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'drop', reason: { code: 'route-no-public-device', ip: destIp } });""",
        r"""    ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'drop', reason: { code: 'route-no-public-device', ip: destIp } });""",
    ),
    (
        r"""      ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'drop', reason: { code: 'route-no-public-ip', deviceId: source.device.id } });""",
        r"""      ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'drop', reason: { code: 'route-no-public-ip', deviceId: source.device.id } });""",
    ),
    (
        r"""    ctx.steps.push({ stage: 'nat', at: GATEWAY, verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'pass', reason: { code: 'route-from-internet' } });""",
        r"""    ctx.steps.push({ stage: 'nat', at: net.edge, verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'pass', reason: { code: 'route-from-internet' } });""",
    ),
)

edit(
    'src/levels/04-iaas/CLAUDE.md',
    (
        r"""- `golden-traces.test.ts` keeps the chapter's golden references in `golden-traces.json`: the trace of every flow and the probe battery of 04-01 and 04-02, in its start world, its solved world and its start world plus each one-chip rule, recorded before the generic network model. The JSON is never edited by hand or rewritten with `vitest -u`: a difference means the engine changed what chapter 4 shows. When the engine renames something the trace carries, the test maps the new name back to the recorded one.""",
        r"""- `golden-traces.test.ts` keeps the chapter's golden references in `golden-traces.json`: the trace of every flow and the probe battery of 04-01 and 04-02, in its start world, its solved world and its start world plus each one-chip rule, recorded before the generic network model. The JSON is never edited by hand or rewritten with `vitest -u`: a difference means the engine changed what chapter 4 shows. When the engine renames something the trace carries (a field, a stage, a reason code or a place such as `internet-gateway`, recorded as `igw`), the test maps the new name back to the recorded one.""",
    ),
)

edit(
    'src/scene/layout.ts',
    (
        r"""const GATEWAY_PLACES = ['igw', 'internet'];""",
        r"""const GATEWAY_PLACES = ['internet-gateway', 'router', 'internet'];""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 455 passed (455)` en 40 archivos; `git diff` sin salida; `npm run check` PASS (jscpd: `Found 0 clones`; Playwright: 10 passed).

- [ ] **Step 6: Commit**

```bash
git add src/engine src/levels/04-iaas src/scene/layout.ts
git commit -m "feat(engine): check the edge of each kind of network and name it in the trace"
```

---

### Task 2: El vocabulario de la vista

Refactor puro: la vista toma los nombres del modelo (tabla «Vocabulario»). No cambia ningún comportamiento ni texto visible; los ids de pieza cambian (`device:servidor2`, `firewall:sg-servidor2`, `edge`), pero ningún test de Playwright los usa (se buscan por nombre visible). Los componentes de las piezas (`Building`, `Barrier`, `Gateway`) cambian de nombre en la Tarea 3, cuando se mudan. No se puede partir: a medio renombrar el árbol no compila.

**Files:**
- Rename: `src/game/view/barrier.ts` → `src/game/view/firewall-card.ts`
- Modify: `src/copy/incident-ui.ts`, `src/game/flow-runs.ts`, `src/game/index.ts`, `src/game/session.ts`, `src/game/stars.ts`, `src/game/tasks.ts`, `src/game/view/CLAUDE.md`, `src/game/view/inspection.ts`, `src/game/view/piece-id.ts`, `src/game/view/pieces.ts`, `src/scene/game-scene.tsx`, `src/scene/layout.ts`, `src/scene/overlay/piece-label.tsx`, `src/scene/pieces.tsx`, `src/ui/incident/incident-screen.tsx`, `src/ui/incident/task-card.tsx`
- Test: `src/copy/packet-labels.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/ladder.test.ts`, `src/game/view/pieces.test.ts`, `src/scene/layout.test.ts`, `src/scene/overlay/piece-label.test.tsx`, `src/ui/incident/incident-screen.test.tsx`, `src/ui/incident/task-card.test.tsx`

**Interfaces:**
- Consumes: la Tarea 1.
- Produces:
  - `PieceKind` y `MapPieceKind`: `'device' | 'firewall' | 'actor' | 'edge'`. `PIECE_ID.device(id)`, `PIECE_ID.firewall(id)`, `PIECE_ID.actor(id)`, `PIECE_ID.packet(id)`, `PIECE_ID.edge` (`'edge'`); `PieceRef` igual.
  - `PIECE_TERM` con las claves `device`, `firewall`, `edge`, `actor`; `EDGE_ANCHOR = 'edge'`.
  - `FirewallCard { firewallId, title, rules }` y `firewallCard(session, pieceId)` en `src/game/view/firewall-card.ts`, exportados por `@/game`.
  - `intrudedDeviceIds(runs)` (exportado por `@/game`); `GameScene` recibe `intrudedDeviceIds`.
  - `MAP_TEXT.firewall(name)`, `MAP_TEXT.edge`, `INSPECTION_TEXT.firewalls`, `INSPECTION_TEXT.edgeDoes`.
  - `Layout.devices: Record<string, DeviceSpot>` con `DeviceSpot { x, z, firewall, door, road }`, y `Layout.edge`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 1**

```bash
git status --short src tests
npx vitest run
```

Expected: `git status` no muestra nada bajo `src/` ni `tests/`; `Tests 455 passed (455)`.

- [ ] **Step 2: Renombrar**

```bash
git mv src/game/view/barrier.ts src/game/view/firewall-card.ts
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
        r"""  barrier: (name: string): TermText => `{{security-group}} ${name}`,
  gateway: '{{internet-gateway}}',""",
        r"""  firewall: (name: string): TermText => `{{security-group}} ${name}`,
  edge: '{{internet-gateway}}',""",
    ),
    (
        r"""  securityGroups: '{{security-group|Security Groups}}',""",
        r"""  firewalls: '{{security-group|Security Groups}}',""",
    ),
    (
        r"""  gatewayDoes: 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',""",
        r"""  edgeDoes: 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',""",
    ),
)

edit(
    'src/game/flow-runs.ts',
    (
        r"""/** Returns the servers that a forbidden flow reaches. */
export function intrudedServerIds(runs: FlowRun[]): ReadonlySet<string> {""",
        r"""/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {""",
    ),
)

edit(
    'src/game/index.ts',
    (
        r"""export { intrudedServerIds } from './flow-runs';""",
        r"""export { intrudedDeviceIds } from './flow-runs';""",
    ),
    (
        r"""export { barrierCard, rowText } from './view/barrier';
export type { BarrierCard } from './view/barrier';""",
        r"""export { firewallCard, rowText } from './view/firewall-card';
export type { FirewallCard } from './view/firewall-card';""",
    ),
)

edit(
    'src/game/session.ts',
    (
        r"""/** True while a forbidden flow reaches its server. */""",
        r"""/** True while a forbidden flow reaches its device. */""",
    ),
)

edit(
    'src/game/stars.ts',
    (
        r"""/** True when the probe battery finds nothing reaching a server beyond the incident's required and ambient flows. */""",
        r"""/** True when the probe battery finds nothing reaching a device beyond the incident's required and ambient flows. */""",
    ),
)

edit(
    'src/game/tasks.ts',
    (
        r"""/** True when every required flow of the task gets its reply and none of its forbidden flows reaches a server. */""",
        r"""/** True when every required flow of the task gets its reply and none of its forbidden flows reaches a device. */""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""What the map and the panels show, computed from the session: piece ids, piece labels and locks, a Security Group's rules named by chips, and the inspection box.

- Every piece kind declares its term in `PIECE_TERM`: `ec2-instance` for a server, `security-group` for a barrier, `internet-gateway` for the gateway and none (`null`) for an actor. A barrier label and the gateway label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a server's label is its device name (`servidor2`) and an actor's label is its own name.
- The inspection of a server, a barrier, the gateway or a packet with an ICMP message starts with `INSPECTION_TEXT.whatIs`, the definition of its term, once that term is known (a packet's term is its ICMP message); an actor's inspection has no definition.""",
        r"""What the map and the panels show, computed from the session: piece ids, piece labels and locks, a firewall's rules named by chips (`firewall-card.ts`), and the inspection box.

- Every piece kind declares its term in `PIECE_TERM`: `ec2-instance` for a device, `security-group` for a firewall, `internet-gateway` for the edge and none (`null`) for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a device, a firewall, the edge or a packet with an ICMP message starts with `INSPECTION_TEXT.whatIs`, the definition of its term, once that term is known (a packet's term is its ICMP message); an actor's inspection has no definition.""",
    ),
)

edit(
    'src/game/view/firewall-card.ts',
    (
        r"""export interface BarrierCard {""",
        r"""export interface FirewallCard {""",
    ),
    (
        r"""export function barrierCard(session: Session, pieceId: string): BarrierCard | null {
  const ref = parsePieceId(pieceId);
  const firewall = ref?.kind === 'barrier' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.barrier(firewall.name), rules: ruleRows(firewall, session.incident) } : null;""",
        r"""export function firewallCard(session: Session, pieceId: string): FirewallCard | null {
  const ref = parsePieceId(pieceId);
  const firewall = ref?.kind === 'firewall' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.firewall(firewall.name), rules: ruleRows(firewall, session.incident) } : null;""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""import { rowText, ruleRows } from './barrier';""",
        r"""import { rowText, ruleRows } from './firewall-card';""",
    ),
    (
        r"""function server(session: Session, device: Device): Inspection {
  const { region, firewalls } = session.world;
  const own = firewalls.filter((firewall) => device.firewallIds.includes(firewall.id));
  return {
    title: device.name,
    fields: visible(
      [
        whatIs(PIECE_TERM.server),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [device.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [device.publicIp ?? INSPECTION_TEXT.none] },
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(device, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [device.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        { term: 'security-group', label: INSPECTION_TEXT.securityGroups, lines: () => own.map((firewall) => MAP_TEXT.barrier(firewall.name)) },""",
        r"""function device(session: Session, own: Device): Inspection {
  const { region, firewalls } = session.world;
  const guards = firewalls.filter((firewall) => own.firewallIds.includes(firewall.id));
  return {
    title: own.name,
    fields: visible(
      [
        whatIs(PIECE_TERM.device),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [own.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(own, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [own.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        { term: 'security-group', label: INSPECTION_TEXT.firewalls, lines: () => guards.map((firewall) => MAP_TEXT.firewall(firewall.name)) },""",
    ),
    (
        r"""function barrier(session: Session, firewall: Firewall): Inspection {
  const rows = ruleRows(firewall, session.incident);
  return {
    title: MAP_TEXT.barrier(firewall.name),
    fields: visible(
      [whatIs(PIECE_TERM.barrier), { term: 'inbound-rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }],""",
        r"""function firewall(session: Session, own: Firewall): Inspection {
  const rows = ruleRows(own, session.incident);
  return {
    title: MAP_TEXT.firewall(own.name),
    fields: visible(
      [whatIs(PIECE_TERM.firewall), { term: 'inbound-rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }],""",
    ),
    (
        r"""function gateway(session: Session): Inspection {
  return {
    title: MAP_TEXT.gateway,
    fields: visible([whatIs(PIECE_TERM.gateway), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.gatewayDoes] }], session.known),""",
        r"""function edge(session: Session): Inspection {
  return {
    title: MAP_TEXT.edge,
    fields: visible([whatIs(PIECE_TERM.edge), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.edgeDoes] }], session.known),""",
    ),
    (
        r"""  if (ref.kind === 'gateway') return gateway(session);
  const { world, runs } = session;
  switch (ref.kind) {
    case 'server': {
      const found = world.devices.find((device) => device.id === ref.id);
      return found ? server(session, found) : null;
    }
    case 'barrier': {
      const found = world.firewalls.find((firewall) => firewall.id === ref.id);
      return found ? barrier(session, found) : null;""",
        r"""  if (ref.kind === 'edge') return edge(session);
  const { world, runs } = session;
  switch (ref.kind) {
    case 'device': {
      const found = world.devices.find((candidate) => candidate.id === ref.id);
      return found ? device(session, found) : null;
    }
    case 'firewall': {
      const found = world.firewalls.find((candidate) => candidate.id === ref.id);
      return found ? firewall(session, found) : null;""",
    ),
)

edit(
    'src/game/view/piece-id.ts',
    (
        r"""export type PieceRef = { kind: 'server' | 'barrier' | 'actor' | 'packet'; id: string } | { kind: 'gateway' };

const ID_KINDS = ['server', 'barrier', 'actor', 'packet'] as const;""",
        r"""export type PieceRef = { kind: 'device' | 'firewall' | 'actor' | 'packet'; id: string } | { kind: 'edge' };

const ID_KINDS = ['device', 'firewall', 'actor', 'packet'] as const;""",
    ),
    (
        r"""  server: (deviceId: string) => `server${SEPARATOR}${deviceId}`,
  barrier: (firewallId: string) => `barrier${SEPARATOR}${firewallId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  gateway: 'gateway',""",
        r"""  device: (deviceId: string) => `device${SEPARATOR}${deviceId}`,
  firewall: (firewallId: string) => `firewall${SEPARATOR}${firewallId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  edge: 'edge',""",
    ),
    (
        r"""  if (pieceId === PIECE_ID.gateway) return { kind: 'gateway' };""",
        r"""  if (pieceId === PIECE_ID.edge) return { kind: 'edge' };""",
    ),
)

edit(
    'src/game/view/pieces.ts',
    (
        r"""export type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway';""",
        r"""export type PieceKind = 'device' | 'firewall' | 'actor' | 'edge';""",
    ),
    (
        r"""export const GATEWAY_ANCHOR = 'igw';

export const PIECE_TERM = {
  server: 'ec2-instance',
  barrier: 'security-group',
  gateway: 'internet-gateway',""",
        r"""export const EDGE_ANCHOR = 'edge';

export const PIECE_TERM = {
  device: 'ec2-instance',
  firewall: 'security-group',
  edge: 'internet-gateway',""",
    ),
    (
        r"""function barriers(session: Session): PieceView[] {""",
        r"""function firewalls(session: Session): PieceView[] {""",
    ),
    (
        r"""      { id: PIECE_ID.barrier(firewall.id), kind: 'barrier', anchorId: owner.id, term: PIECE_TERM.barrier, label: MAP_TEXT.barrier(firewall.name), locked: !configurable, configurable },""",
        r"""      { id: PIECE_ID.firewall(firewall.id), kind: 'firewall', anchorId: owner.id, term: PIECE_TERM.firewall, label: MAP_TEXT.firewall(firewall.name), locked: !configurable, configurable },""",
    ),
    (
        r"""      (device): PieceView => ({ id: PIECE_ID.server(device.id), kind: 'server', anchorId: device.id, term: PIECE_TERM.server, label: device.name, locked: !parts.hostSettings, configurable: false }),
    ),
    ...barriers(session),""",
        r"""      (device): PieceView => ({ id: PIECE_ID.device(device.id), kind: 'device', anchorId: device.id, term: PIECE_TERM.device, label: device.name, locked: !parts.hostSettings, configurable: false }),
    ),
    ...firewalls(session),""",
    ),
    (
        r"""    { id: PIECE_ID.gateway, kind: 'gateway', anchorId: GATEWAY_ANCHOR, term: PIECE_TERM.gateway, label: MAP_TEXT.gateway, locked: true, configurable: false },""",
        r"""    { id: PIECE_ID.edge, kind: 'edge', anchorId: EDGE_ANCHOR, term: PIECE_TERM.edge, label: MAP_TEXT.edge, locked: true, configurable: false },""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""  intrudedServerIds: ReadonlySet<string>;""",
        r"""  intrudedDeviceIds: ReadonlySet<string>;""",
    ),
    (
        r"""export function GameScene({ world, pieces, flows, intrudedServerIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
        r"""export function GameScene({ world, pieces, flows, intrudedDeviceIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
    ),
    (
        r"""          <Gateway position={layout.igw} />
          {world.devices.map((device) => (
            <Building key={device.id} spot={layout.instances[device.id]} shaking={intrudedServerIds.has(device.id)} still={still} />
          ))}
          {pieces
            .filter((piece) => piece.kind === 'barrier')
            .map((piece) => (
              <Barrier key={piece.id} spot={layout.instances[piece.anchorId]} active={piece.id === activePieceId} still={still} />""",
        r"""          <Gateway position={layout.edge} />
          {world.devices.map((device) => (
            <Building key={device.id} spot={layout.devices[device.id]} shaking={intrudedDeviceIds.has(device.id)} still={still} />
          ))}
          {pieces
            .filter((piece) => piece.kind === 'firewall')
            .map((piece) => (
              <Barrier key={piece.id} spot={layout.devices[piece.anchorId]} active={piece.id === activePieceId} still={still} />""",
    ),
)

edit(
    'src/scene/layout.ts',
    (
        r"""export interface InstanceSpot {
  x: number;
  z: number;
  barrier: Vec2;""",
        r"""export interface DeviceSpot {
  x: number;
  z: number;
  firewall: Vec2;""",
    ),
    (
        r"""  instances: Record<string, InstanceSpot>;""",
        r"""  devices: Record<string, DeviceSpot>;""",
    ),
    (
        r"""  igw: Vec2;""",
        r"""  edge: Vec2;""",
    ),
    (
        r"""const BUILDING_Z = -0.9;
const BARRIER_Z = 0.7;
const DOOR_Z = -0.2;
const GATEWAY_MARGIN = 1.5;""",
        r"""const DEVICE_Z = -0.9;
const FIREWALL_Z = 0.7;
const DOOR_Z = -0.2;
const EDGE_MARGIN = 1.5;""",
    ),
    (
        r"""const LABEL = { serverY: 1.75, barrierY: 0.1, barrierDz: 0.8, actorY: 0.05, actorDz: 0.7, gatewayY: 2.6 } as const;
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.8;
const GATEWAY_PLACES = ['internet-gateway', 'router', 'internet'];""",
        r"""const LABEL = { deviceY: 1.75, firewallY: 0.1, firewallDz: 0.8, actorY: 0.05, actorDz: 0.7, edgeY: 2.6 } as const;
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.8;
const EDGE_PLACES = ['internet-gateway', 'router', 'internet'];""",
    ),
    (
        r"""  const instances: Record<string, InstanceSpot> = {};""",
        r"""  const devices: Record<string, DeviceSpot> = {};""",
    ),
    (
        r"""      instances[device.id] = { x, z: BUILDING_Z, barrier: [x, BARRIER_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const igw: Vec2 = [-sheetWidth / 2 - GATEWAY_MARGIN, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [igw[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, instances, roadZ: ROAD_Z, roadFromX: igw[0], roadToX: sheetWidth / 2 - 0.5, igw, actors };""",
        r"""      devices[device.id] = { x, z: DEVICE_Z, firewall: [x, FIREWALL_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const edge: Vec2 = [-sheetWidth / 2 - EDGE_MARGIN, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [edge[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, devices, roadZ: ROAD_Z, roadFromX: edge[0], roadToX: sheetWidth / 2 - 0.5, edge, actors };""",
    ),
    (
        r"""  const left = Math.min(layout.igw[0], ...Object.values(layout.actors).map(([x]) => x));""",
        r"""  const left = Math.min(layout.edge[0], ...Object.values(layout.actors).map(([x]) => x));""",
    ),
    (
        r"""/** Returns where the label of a piece floats: above a building, in front of a Security Group, below an actor, above the Internet gateway. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  switch (piece.kind) {
    case 'server': {
      const spot = layout.instances[piece.anchorId];
      return [spot.x, LABEL.serverY, spot.z];
    }
    case 'barrier': {
      const [x, z] = layout.instances[piece.anchorId].barrier;
      return [x, LABEL.barrierY, z + LABEL.barrierDz];""",
        r"""/** Returns where the label of a piece floats: above a device, in front of its firewall, below an actor, above the edge. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return [spot.x, LABEL.deviceY, spot.z];
    }
    case 'firewall': {
      const [x, z] = layout.devices[piece.anchorId].firewall;
      return [x, LABEL.firewallY, z + LABEL.firewallDz];""",
    ),
    (
        r"""    case 'gateway':
      return [layout.igw[0], LABEL.gatewayY, layout.igw[1]];""",
        r"""    case 'edge':
      return [layout.edge[0], LABEL.edgeY, layout.edge[1]];""",
    ),
    (
        r"""  const [x, z] = layout.instances[deviceId].barrier;""",
        r"""  const [x, z] = layout.devices[deviceId].firewall;""",
    ),
    (
        r"""  const source = from.kind === 'device' ? layout.instances[from.id] : undefined;
  if (source) points.push(source.door, source.barrier, source.road);
  else points.push(layout.actors[from.id] ?? layout.igw);

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && GATEWAY_PLACES.includes(s.at)))) points.push(layout.igw);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.instances[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.barrier);""",
        r"""  const source = from.kind === 'device' ? layout.devices[from.id] : undefined;
  if (source) points.push(source.door, source.firewall, source.road);
  else points.push(layout.actors[from.id] ?? layout.edge);

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.devices[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.firewall);""",
    ),
)

edit(
    'src/scene/overlay/piece-label.tsx',
    (
        r"""export type MapPieceKind = 'server' | 'barrier' | 'actor' | 'gateway';""",
        r"""export type MapPieceKind = 'device' | 'firewall' | 'actor' | 'edge';""",
    ),
)

edit(
    'src/scene/pieces.tsx',
    (
        r"""import type { InstanceSpot, Layout, Vec2, Vec3 } from './layout';""",
        r"""import type { DeviceSpot, Layout, Vec2, Vec3 } from './layout';""",
    ),
    (
        r"""      {Object.entries(layout.instances).map(([id, spot]) => (""",
        r"""      {Object.entries(layout.devices).map(([id, spot]) => (""",
    ),
    (
        r"""/** A server's building; it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function Building({ spot, shaking, still }: { spot: InstanceSpot; shaking: boolean; still: boolean }) {""",
        r"""/** A device's building; it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function Building({ spot, shaking, still }: { spot: DeviceSpot; shaking: boolean; still: boolean }) {""",
    ),
    (
        r"""/** A server's Security Group barrier; its bar pulses while its task card is open, or stays thicker without animations. */
export function Barrier({ spot, active, still }: { spot: InstanceSpot; active: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = spot.barrier;""",
        r"""/** A device's Security Group barrier; its bar pulses while its task card is open, or stays thicker without animations. */
export function Barrier({ spot, active, still }: { spot: DeviceSpot; active: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = spot.firewall;""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { barrierCard, countStars, inspect, intrudedServerIds, pieceViews, sessionReducer, startSession, starsOf } from '@/game';""",
        r"""import { countStars, firewallCard, inspect, intrudedDeviceIds, pieceViews, sessionReducer, startSession, starsOf } from '@/game';""",
    ),
    (
        r"""  const card = playing && cardPieceId ? barrierCard(session, cardPieceId) : null;""",
        r"""  const card = playing && cardPieceId ? firewallCard(session, cardPieceId) : null;""",
    ),
    (
        r"""          intrudedServerIds={intrudedServerIds(session.runs)}""",
        r"""          intrudedDeviceIds={intrudedDeviceIds(session.runs)}""",
    ),
)

edit(
    'src/ui/incident/task-card.tsx',
    (
        r"""import { rowText, type BarrierCard } from '@/game';""",
        r"""import { rowText, type FirewallCard } from '@/game';""",
    ),
    (
        r"""  card: BarrierCard;""",
        r"""  card: FirewallCard;""",
    ),
)
EOF
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
    'src/copy/packet-labels.test.ts',
    (
        r"""  it('name the service, the source and the destination server', () => {""",
        r"""  it('name the service, the source and the destination device', () => {""",
    ),
    (
        r"""  it('keep the address when the packet reached no server', () => {""",
        r"""  it('keep the address when the packet reached no device', () => {""",
    ),
)

edit(
    'src/game/view/inspection.test.ts',
    (
        r"""    expect(plain(inspect(first, PIECE_ID.server(S2.id)))).toEqual({""",
        r"""    expect(plain(inspect(first, PIECE_ID.device(S2.id)))).toEqual({""",
    ),
    (
        r"""    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.server(S2.id)))?.fields.map(([label]) => label);""",
        r"""    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.device(S2.id)))?.fields.map(([label]) => label);""",
    ),
    (
        r"""    expect(plain(inspect(first, PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([whatIs('security-group'), ['Reglas de entrada', 'Ninguna: no deja entrar nada.']]);""",
        r"""    expect(plain(inspect(first, PIECE_ID.firewall(SG.servidor2)))?.fields).toEqual([whatIs('security-group'), ['Reglas de entrada', 'Ninguna: no deja entrar nada.']]);""",
    ),
    (
        r"""    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([""",
        r"""    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.firewall(SG.servidor2)))?.fields).toEqual([""",
    ),
    (
        r"""    expect(plain(inspect(first, PIECE_ID.gateway))).toEqual({""",
        r"""    expect(plain(inspect(first, PIECE_ID.edge))).toEqual({""",
    ),
    (
        r"""    expect(inspect(first, PIECE_ID.server('ghost'))).toBeNull();""",
        r"""    expect(inspect(first, PIECE_ID.device('ghost'))).toBeNull();""",
    ),
)

edit(
    'src/game/view/ladder.test.ts',
    (
        r"""import { barrierCard } from './barrier';""",
        r"""import { firewallCard } from './firewall-card';""",
    ),
    (
        r"""const NAMED_BY_KIND: PieceKind[] = ['barrier', 'gateway'];""",
        r"""const NAMED_BY_KIND: PieceKind[] = ['firewall', 'edge'];""",
    ),
    (
        r"""  const barriers = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => barrierCard(start, piece.id) ?? []);
  const placed = barriers.flatMap((barrier) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', firewallId: barrier.firewallId, whatId: what.id, fromId: from.id }))),""",
        r"""  const cards = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => firewallCard(start, piece.id) ?? []);
  const placed = cards.flatMap((card) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', firewallId: card.firewallId, whatId: what.id, fromId: from.id }))),""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""import { barrierCard } from './barrier';""",
        r"""import { firewallCard } from './firewall-card';""",
    ),
    (
        r"""      { id: PIECE_ID.server(S1.id), term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.server(S2.id), term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.barrier(SG.servidor1), term: 'security-group', label: MAP_TEXT.barrier(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.barrier(SG.servidor2), term: 'security-group', label: MAP_TEXT.barrier(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.gateway, term: 'internet-gateway', label: MAP_TEXT.gateway, locked: true, configurable: false },""",
        r"""      { id: PIECE_ID.device(S1.id), term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.device(S2.id), term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.firewall(SG.servidor1), term: 'security-group', label: MAP_TEXT.firewall(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.firewall(SG.servidor2), term: 'security-group', label: MAP_TEXT.firewall(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.edge, term: 'internet-gateway', label: MAP_TEXT.edge, locked: true, configurable: false },""",
    ),
    (
        r"""describe('barrierCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(barrierCard(second, PIECE_ID.barrier(SG.servidor2))).toEqual({
      firewallId: SG.servidor2,
      title: MAP_TEXT.barrier(S2.id),""",
        r"""describe('firewallCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(firewallCard(second, PIECE_ID.firewall(SG.servidor2))).toEqual({
      firewallId: SG.servidor2,
      title: MAP_TEXT.firewall(S2.id),""",
    ),
    (
        r"""    expect(barrierCard(first, PIECE_ID.server(S2.id))).toBeNull();
    expect(barrierCard(first, PIECE_ID.barrier('sg-ghost'))).toBeNull();""",
        r"""    expect(firewallCard(first, PIECE_ID.device(S2.id))).toBeNull();
    expect(firewallCard(first, PIECE_ID.firewall('sg-ghost'))).toBeNull();""",
    ),
)

edit(
    'src/scene/layout.test.ts',
    (
        r"""    expect(Math.abs(layout.instances.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.instances.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the barrier and the road sit in front of the building (greater z, toward the camera)', () => {
    const spot = layout.instances.servidor2;
    expect(spot.barrier[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.barrier[1]);
  });

  it('the internet gateway and the actors sit on the left of the sheet', () => {
    expect(layout.igw[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.igw[0]);""",
        r"""    expect(Math.abs(layout.devices.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.devices.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the firewall and the road sit in front of the device (greater z, toward the camera)', () => {
    const spot = layout.devices.servidor2;
    expect(spot.firewall[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.firewall[1]);
  });

  it('the edge and the actors sit on the left of the sheet', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.edge[0]);""",
    ),
    (
        r"""  it('step 3: ends at the barrier of servidor2', () => {
    const packet = ping(device('servidor1'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.barrier);""",
        r"""  it('step 3: ends at the firewall of servidor2', () => {
    const packet = ping(device('servidor1'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.firewall);""",
    ),
    (
        r"""    expect(path.at(-1)).toEqual(layout.instances.servidor2.door);
  });

  it('a private IP from the internet ends at the internet gateway', () => {
    const packet = ping(actor('attacker'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.igw);""",
        r"""    expect(path.at(-1)).toEqual(layout.devices.servidor2.door);
  });

  it('a private IP from the internet ends at the edge', () => {
    const packet = ping(actor('attacker'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.edge);""",
    ),
    (
        r"""  it('a Security Group label sits in front of its barrier, and a server label above its building', () => {
    const spot = layout.instances.servidor2;
    expect(labelPosition({ kind: 'barrier', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.barrier[1]);
    expect(labelPosition({ kind: 'server', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.barrier[0]);""",
        r"""  it('a Security Group label sits in front of its firewall, and a device label above it', () => {
    const spot = layout.devices.servidor2;
    expect(labelPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.firewall[1]);
    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.firewall[0]);""",
    ),
)

edit(
    'src/scene/overlay/piece-label.test.tsx',
    (
        r"""const SERVER: MapPiece = { id: 'server:servidor2', kind: 'server', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'barrier:sg-servidor2', kind: 'barrier', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };""",
        r"""const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };""",
    ),
)

edit(
    'src/ui/incident/incident-screen.test.tsx',
    (
        r"""    const barrier = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await user.click(barrier);""",
        r"""    const label = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await user.click(label);""",
    ),
    (
        r"""    expect(barrier).toHaveFocus();""",
        r"""    expect(label).toHaveFocus();""",
    ),
)

edit(
    'src/ui/incident/task-card.test.tsx',
    (
        r"""import { barrierCard, startSession } from '@/game';""",
        r"""import { firewallCard, startSession } from '@/game';""",
    ),
    (
        r"""  const card = barrierCard(session, PIECE_ID.barrier(SG.servidor2));""",
        r"""  const card = firewallCard(session, PIECE_ID.firewall(SG.servidor2));""",
    ),
)
EOF
```

- [ ] **Step 3: Verificar que no queda nada del vocabulario viejo**

```bash
grep -rnE "\bserver\b|barrier|Barrier|gateway\b|Gateway|\.instances|InstanceSpot|igw|intrudedServer|GATEWAY|securityGroups" src tests --include='*.ts' --include='*.tsx' --include='*.md' | grep -vE "golden-traces|Internet gateway|internet-gateway|'igw'\]|RETIRED_IDS|function server|server\(S|^src/scene/pieces.tsx|Building|Barrier|Gateway"
```

Expected: sin salida. (Quedan, a propósito, `src/scene/pieces.tsx` y los nombres `Building`, `Barrier` y `Gateway` en `src/scene/game-scene.tsx`, que se mudan en la Tarea 3; `RETIRED_IDS` y el ayudante `server()` del capítulo 4.)

- [ ] **Step 4: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 455 passed (455)` en 40 archivos; `git diff` sin salida; `npm run check` PASS (Playwright: 10 passed).

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor: name the view after devices, firewalls and the edge"
```

---

### Task 3: El catálogo: las piezas en `src/scene/entities/`

Refactor sin cambios visibles: cada pieza se muda a su archivo del catálogo con su nombre de entidad, y recibe su posición, su variante y su estado por props. `InkBox` pasa a `src/scene/ink.tsx` y `Road` a `src/scene/road.tsx`, porque no son entidades. El sello deja de decidir: `traffic.tsx` le pasa su estado (`arrived`, `blocked` o `intruder`), y el actor recibe su `kind` como variante. `PACKET_SPEED` y la duración del final del paquete (`PACKET_END_S`, antes `BURST_S`) pasan al paquete, porque son su movimiento; `schedule.ts` los importa. Las clases CSS del sello toman el nombre del estado.

**Files:**
- Create: `src/scene/ink.tsx`, `src/scene/road.tsx`, `src/scene/entities/CLAUDE.md`, `src/scene/entities/index.ts`, `src/scene/entities/network.tsx`, `src/scene/entities/device.tsx`, `src/scene/entities/firewall.tsx`, `src/scene/entities/edge.tsx`, `src/scene/entities/actor.tsx`, `src/scene/entities/packet.tsx`, `src/scene/entities/stamp.tsx`
- Delete: `src/scene/pieces.tsx`, `src/scene/traffic/packet-run.tsx`, `src/scene/traffic/stamp.tsx`, `src/scene/traffic/still-path.tsx`
- Modify: `src/scene/game-scene.tsx`, `src/scene/traffic/flow-traffic.tsx`, `src/scene/traffic/schedule.ts`, `src/scene/traffic/traffic.tsx`, `src/styles.css`, `src/scene/CLAUDE.md`, `src/scene/traffic/CLAUDE.md`
- Test: `src/scene/traffic/schedule.test.ts`

**Interfaces:**
- Consumes: `DeviceSpot`, `Layout`, `Vec2`, `Vec3`, `cumulativeLengths`, `pointAt` de `@/scene/layout`; `useHtmlPortal` de `@/scene/html-layer`; `inspectHandlers` de `@/scene/overlay/inspect-handlers`.
- Produces (todo por `@/scene/entities`):
  - `NetworkPiece({ width, depth })`, `DevicePiece({ position, intruded, still })`, `FirewallPiece({ position, selected, still })`, `EdgePiece({ position })`, `ActorPiece({ position, variant: Actor['kind'] })`. `position` es `Vec2` (x, z del suelo).
  - `PacketRun({ path, blocked, intruder })`, `PacketTrace({ path, reached })`, `PACKET_SPEED`, `PACKET_END_S`.
  - `StampPiece({ position, state, name, pieceId, onInspect })` y `StampState = 'arrived' | 'blocked' | 'intruder'`.
  - `InkBox` en `@/scene/ink`; `Road({ layout })` en `@/scene/road`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 2**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 455 passed (455)`.

- [ ] **Step 2: Crear el catálogo y mudar las piezas**

```bash
mkdir -p src/scene/entities
```

Contenido completo de `src/scene/entities/CLAUDE.md`:

```markdown
# scene/entities

The entity catalog: one file per entity of the map (`network`, `device`, `firewall`, `edge`, `internet`, `actor`, `packet`, `stamp`). Each file exports the entity's map piece and, from the icons task on, its 2D icon. The design of every entity (its card: concept, shape, variants, states, label, movement and accessibility) is in `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`, section "Catálogo de entidades".

- A piece takes its position, its variant and its state as props and decides nothing: whether a packet got in, whether a device is under attack or whether a card is open comes from the caller.
- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.
- Every animation has a still version for "Sin animaciones", chosen by the `still` prop.
- The rest of the game reaches the catalog only through `index.ts` (`@/scene/entities`); files inside import each other directly (`./x`).
- Not here: where a piece sits (`src/scene/layout.ts`), the traffic clock (`src/scene/traffic/`), labels as buttons (`src/scene/overlay/`).
- May import: `@/copy`, only types from `@/engine`, and the scene's drawing helpers (`@/scene/ink`, `@/scene/theme`, `@/scene/layout`, `@/scene/html-layer`, `@/scene/overlay/inspect-handlers`).
```

Contenido completo de `src/scene/entities/actor.tsx`:

```tsx
import type { Actor } from '@/engine';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL };

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={ACTOR_FILL[variant]} />;
}
```

Contenido completo de `src/scene/entities/device.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { useHtmlPortal } from '@/scene/html-layer';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const WARNING_Y = 2.1;

/** A device: it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function DevicePiece({ position, intruded, still }: { position: Vec2; intruded: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  const [x, z] = position;
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
      {intruded && still && (
        <Html portal={portal} position={[x, WARNING_Y, z]} center>
          <span className="stamp stamp--blocked" aria-hidden="true">
            !
          </span>
        </Html>
      )}
    </group>
  );
}
```

Contenido completo de `src/scene/entities/edge.tsx`:

```tsx
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

/** The network's way out to the internet: an arch over the road. */
export function EdgePiece({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z - 0.65]} />
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z + 0.65]} />
      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
    </group>
  );
}
```

Contenido completo de `src/scene/entities/firewall.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { ACCENT } from '@/scene/theme';

const PULSE_SPEED = 4;
const PULSE_AMPLITUDE = 0.35;
const PULSE_STILL_SCALE = 1.5;

/** A firewall standing in front of its device: its bar pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, selected, still }: { position: Vec2; selected: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = position;
  useFrame(({ clock }) => {
    if (!bar.current) return;
    const pulse = still ? PULSE_STILL_SCALE : 1 + Math.abs(Math.sin(clock.elapsedTime * PULSE_SPEED)) * PULSE_AMPLITUDE;
    const scale = selected ? pulse : 1;
    bar.current.scale.set(1, scale, scale);
  });
  return (
    <group>
      <InkBox size={[0.1, 0.5, 0.1]} position={[x - 0.6, 0.25, z]} />
      <InkBox size={[0.1, 0.5, 0.1]} position={[x + 0.6, 0.25, z]} />
      <group ref={bar} position={[x, 0.46, z]}>
        <InkBox size={[1.2, 0.07, 0.07]} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />
      </group>
    </group>
  );
}
```

Contenido completo de `src/scene/entities/index.ts`:

```ts
export { ActorPiece } from './actor';
export { DevicePiece } from './device';
export { EdgePiece } from './edge';
export { FirewallPiece } from './firewall';
export { NetworkPiece } from './network';
export { PACKET_END_S, PACKET_SPEED, PacketRun, PacketTrace } from './packet';
export { StampPiece } from './stamp';
export type { StampState } from './stamp';
```

Contenido completo de `src/scene/entities/network.tsx`:

```tsx
import { InkBox } from '@/scene/ink';

/** The network's slab: the floor its devices stand on. */
export function NetworkPiece({ width, depth }: { width: number; depth: number }) {
  return <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}
```

Contenido completo de `src/scene/entities/packet.tsx`:

```tsx
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { cumulativeLengths, pointAt, type Vec2, type Vec3 } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';

export const PACKET_SPEED = 3.2;
export const PACKET_END_S = 0.5;
const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const RHOMBUS_RADIUS = 0.24;
const BURST_GROWTH = 3;
const BURST_RING: [number, number, number] = [0.22, 0.3, 24];
const TRACE_LINE_WIDTH = 2.5;

/** One packet travelling its path: an ink dot for legitimate traffic, a vermilion rhombus for an intruder, and a burst where a blocked one stops. */
export function PacketRun({ path, blocked, intruder }: { path: Vec2[]; blocked: boolean; intruder: boolean }) {
  const lengths = useMemo(() => cumulativeLengths(path), [path]);
  const total = lengths.at(-1) ?? 0;
  const packet = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const travelled = useRef(0);
  useFrame((_, delta) => {
    travelled.current += delta * PACKET_SPEED;
    const over = travelled.current - total;
    const [x, z] = pointAt(path, lengths, travelled.current);
    if (packet.current) {
      packet.current.position.set(x, PACKET_Y, z);
      packet.current.visible = over <= 0;
    }
    if (burst.current) {
      burst.current.visible = blocked && over > 0;
      burst.current.scale.setScalar(1 + Math.max(over, 0) * BURST_GROWTH);
    }
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = path[path.length - 1];
  return (
    <>
      <group ref={packet} position={[startX, PACKET_Y, startZ]}>
        <mesh>
          {intruder ? <octahedronGeometry args={[RHOMBUS_RADIUS]} /> : <sphereGeometry args={[DOT_RADIUS, 16, 12]} />}
          <meshStandardMaterial color={intruder ? ACCENT : INK} roughness={1} />
        </mesh>
      </group>
      <group ref={burst} position={[endX, PACKET_Y, endZ]} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={BURST_RING} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      </group>
    </>
  );
}

/** A packet's path drawn without movement: ink when it gets in, vermilion up to where it stops. */
export function PacketTrace({ path, reached }: { path: Vec2[]; reached: boolean }) {
  return <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={reached ? INK : ACCENT} lineWidth={TRACE_LINE_WIDTH} />;
}
```

Contenido completo de `src/scene/entities/stamp.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec2 } from '@/scene/layout';
import { inspectHandlers, type OnInspect } from '@/scene/overlay/inspect-handlers';

export type StampState = 'arrived' | 'blocked' | 'intruder';

const STAMP_Y = 0.9;
const STAMP_LAYERS: [number, number] = [15, 5];
const STAMP_GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', intruder: '✓' };

/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when it is blocked, a double ring for an intruder; hovering or focusing it inspects the packet. */
export function StampPiece({ position, state, name, pieceId, onInspect }: { position: Vec2; state: StampState; name: string; pieceId: string; onInspect: OnInspect }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${state}`} aria-label={name} {...inspectHandlers(pieceId, onInspect)}>
        <span aria-hidden="true">{STAMP_GLYPH[state]}</span>
      </button>
    </Html>
  );
}
```

Contenido completo de `src/scene/ink.tsx`:

```tsx
import { Line } from '@react-three/drei';
import { boxEdgePoints } from './edges';
import type { Vec3 } from './layout';
import { INK, PAPER_FILL } from './theme';

/** A paper box with ink edges: the brick every map piece is built from. */
export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = 1.5 }: { size: Vec3; position: Vec3; fill?: string; lineWidth?: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={fill} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={boxEdgePoints(size[0], size[1], size[2])} segments color={INK} lineWidth={lineWidth} />
    </group>
  );
}
```

Contenido completo de `src/scene/road.tsx`:

```tsx
import { Line } from '@react-three/drei';
import type { Layout } from './layout';
import { INK, PAPER_SHADE } from './theme';

/** The road every packet travels inside the network, with a short path from it to the door of each device. */
export function Road({ layout }: { layout: Layout }) {
  const { roadZ: z, roadFromX: x1, roadToX: x2 } = layout;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(x1 + x2) / 2, 0.012, z]}>
        <planeGeometry args={[x2 - x1, 0.7]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={1} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={1} />
      {Object.entries(layout.devices).map(([id, spot]) => (
        <mesh key={id} rotation-x={-Math.PI / 2} position={[spot.x, 0.012, (spot.door[1] + z) / 2]}>
          <planeGeometry args={[0.5, z - spot.door[1]]} />
          <meshBasicMaterial color={PAPER_SHADE} />
        </mesh>
      ))}
    </group>
  );
}
```

Contenido completo de `src/scene/traffic/CLAUDE.md`:

```markdown
# scene/traffic

Live traffic: each flow sends a packet every few seconds along the path of its trace and leaves a stamp at the end of the path, both drawn with the catalog (`@/scene/entities`). With "Sin animaciones" each path is drawn still.

- The clock lives in `use-packet-runs.ts`; `traffic.tsx` turns each flow's result (`reached`, `replied`) into the look of its packet and its stamp, and never decides whether a packet gets in.
- Not here: deciding whether a packet gets in (`src/engine/`, run by `src/game/`), the shape of a packet or a stamp (`src/scene/entities/`), piece labels and the task card anchor (`src/scene/overlay/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
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
    'src/scene/CLAUDE.md',
    (
        r"""The isometric paper-and-ink map drawn with React Three Fiber: layout, pieces, labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`).

- Draws what the game computed: piece labels, locks and every packet's outcome come in as props; it never decides an outcome.""",
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`). `ink.tsx` holds the paper box with ink edges that every piece is built from.

- Draws what the game computed: piece labels, locks, states and every packet's outcome come in as props; it never decides an outcome.""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""import type { Network } from '@/engine';""",
        r"""import type { Network } from '@/engine';
import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, NetworkPiece } from './entities';""",
    ),
    (
        r"""import { ActorMark, Barrier, Building, Gateway, Road, Sheet } from './pieces';""",
        r"""import { Road } from './road';""",
    ),
    (
        r"""          <Sheet layout={layout} />
          <Road layout={layout} />
          <Gateway position={layout.edge} />
          {world.devices.map((device) => (
            <Building key={device.id} spot={layout.devices[device.id]} shaking={intrudedDeviceIds.has(device.id)} still={still} />""",
        r"""          <NetworkPiece width={layout.sheet.width} depth={layout.sheet.depth} />
          <Road layout={layout} />
          <EdgePiece position={layout.edge} />
          {world.devices.map((device) => (
            <DevicePiece key={device.id} position={[layout.devices[device.id].x, layout.devices[device.id].z]} intruded={intrudedDeviceIds.has(device.id)} still={still} />""",
    ),
    (
        r"""              <Barrier key={piece.id} spot={layout.devices[piece.anchorId]} active={piece.id === activePieceId} still={still} />
            ))}
          {world.actors.map((actor) => (
            <ActorMark key={actor.id} position={layout.actors[actor.id]} actor={actor} />""",
        r"""              <FirewallPiece key={piece.id} position={layout.devices[piece.anchorId].firewall} selected={piece.id === activePieceId} still={still} />
            ))}
          {world.actors.map((actor) => (
            <ActorPiece key={actor.id} position={layout.actors[actor.id]} variant={actor.kind} />""",
    ),
)

edit(
    'src/scene/traffic/flow-traffic.tsx',
    (
        r"""import { roundTrip, type Vec2 } from '@/scene/layout';
import { PacketRun } from './packet-run';""",
        r"""import { PacketRun } from '@/scene/entities';
import { roundTrip, type Vec2 } from '@/scene/layout';""",
    ),
    (
        r"""        <PacketRun key={run.key} path={run.path} blocked={run.blocked} attacker={flow.kind === 'forbidden'} />""",
        r"""        <PacketRun key={run.key} path={run.path} blocked={run.blocked} intruder={flow.kind === 'forbidden'} />""",
    ),
)

edit(
    'src/scene/traffic/schedule.ts',
    (
        r"""import { pathLength, type Vec2 } from '@/scene/layout';""",
        r"""import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';
import { pathLength, type Vec2 } from '@/scene/layout';""",
    ),
    (
        r"""export const PACKET_SPEED = 3.2;
export const BURST_S = 0.5;
""",
        r"""""",
    ),
    (
        r"""/** Seconds a packet stays on the map: its travel along the path plus the burst at the end. */
export function runSeconds(path: Vec2[]): number {
  return pathLength(path) / PACKET_SPEED + BURST_S;""",
        r"""/** Seconds a packet stays on the map: its travel along the path plus its end (a burst or a fade). */
export function runSeconds(path: Vec2[]): number {
  return pathLength(path) / PACKET_SPEED + PACKET_END_S;""",
    ),
)

edit(
    'src/scene/traffic/traffic.tsx',
    (
        r"""import type { TermText } from '@/copy';
import type { PacketSpec, Trace } from '@/engine';
import type { FlowKind } from '@/levels';""",
        r"""import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import type { PacketSpec, Trace } from '@/engine';
import type { FlowKind } from '@/levels';
import { PacketTrace, StampPiece, type StampState } from '@/scene/entities';""",
    ),
    (
        r"""import { Stamp } from './stamp';
import { StillPath } from './still-path';
""",
        r"""""",
    ),
    (
        r"""
export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {""",
        r"""
function stampState(flow: MapFlow): StampState {
  if (!flow.reached) return 'blocked';
  return flow.kind === 'forbidden' ? 'intruder' : 'arrived';
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {""",
    ),
    (
        r"""          {still ? <StillPath path={paths[index]} reached={flow.reached} /> : <FlowTraffic path={paths[index]} flow={flow} index={index} />}
          <Stamp position={stamps[index]} flow={flow} onInspect={onInspect} />""",
        r"""          {still ? <PacketTrace path={paths[index]} reached={flow.reached} /> : <FlowTraffic path={paths[index]} flow={flow} index={index} />}
          <StampPiece position={stamps[index]} state={stampState(flow)} name={MAP_TEXT.packet(toPlainText(flow.label))} pieceId={flow.pieceId} onInspect={onInspect} />""",
    ),
)

edit(
    'src/styles.css',
    (
        r""".stamp--pass { color: var(--ink); }
.stamp--drop { color: var(--accent); }""",
        r""".stamp--arrived { color: var(--ink); }
.stamp--blocked { color: var(--accent); }""",
    ),
)
EOF
```

```bash
git rm -q src/scene/traffic/packet-run.tsx
git rm -q src/scene/pieces.tsx
git rm -q src/scene/traffic/stamp.tsx
git rm -q src/scene/traffic/still-path.tsx
```

- [ ] **Step 3: El test del horario lee las constantes del paquete**

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
    'src/scene/traffic/schedule.test.ts',
    (
        r"""import { BURST_S, FLOW_OFFSET_S, FLOW_PERIOD_S, PACKET_SPEED, runSeconds, sendsBetween } from './schedule';""",
        r"""import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';
import { FLOW_OFFSET_S, FLOW_PERIOD_S, runSeconds, sendsBetween } from './schedule';""",
    ),
    (
        r"""  it('a packet stays its travel time plus the burst', () => {
    expect(runSeconds([[0, 0], [PACKET_SPEED, 0]])).toBeCloseTo(1 + BURST_S);""",
        r"""  it('a packet stays its travel time plus its end', () => {
    expect(runSeconds([[0, 0], [PACKET_SPEED, 0]])).toBeCloseTo(1 + PACKET_END_S);""",
    ),
)
EOF
```

- [ ] **Step 4: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 455 passed (455)` en 40 archivos; `git diff` sin salida; `npm run check` PASS (estructura: `src/scene/entities/` con 8 archivos y su `CLAUDE.md`; Playwright: 10 passed, el mapa se ve igual que antes).

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor(scene): move the map pieces into the entity catalog"
```

---

### Task 4: Las variantes: laptop, impresora, firewall de la laptop, router y la oficina

Cada pieza pasa a ser una entidad del catálogo en la variante de su modelo. `copy` declara el vocabulario (`EntityRef`) y qué término nombra cada variante (`ENTITY_TERMS`); `game/view` arma las piezas con `kind`, `variant` y `term` (adiós `PIECE_TERM`) y escribe etiquetas e inspecciones por tipo. La escena dibuja cada pieza desde la lista de piezas con un `PieceShape` y las entidades dibujan sus variantes nuevas (tabla «Fichas»). Una oficina todavía no se puede dibujar en el juego: no tiene layout hasta la Tarea 5, y ningún incidente la usa. El capítulo 4 se ve igual.

**Files:**
- Modify: `src/copy/terms.ts`, `src/copy/index.ts`, `src/copy/incident-ui.ts`, `src/game/view/pieces.ts`, `src/game/view/inspection.ts`, `src/game/view/firewall-card.ts`, `src/scene/overlay/piece-label.tsx`, `src/scene/game-scene.tsx`, `src/scene/entities/network.tsx`, `src/scene/entities/device.tsx`, `src/scene/entities/firewall.tsx`, `src/scene/entities/edge.tsx`, `src/copy/CLAUDE.md`, `src/game/view/CLAUDE.md`
- Test: `src/copy/terms.test.ts`, `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts`, `src/scene/overlay/piece-label.test.tsx`

**Interfaces:**
- Consumes: `Device`, `FirewallKind`, `Network`, `Actor` (tipos de `@/engine`); `officeNet`, `withDevice` de `@/testing` (solo en tests).
- Produces:
  - `@/copy`: `EntityVariants` (`network`, `device`, `firewall`, `edge`, `actor`; la Tarea 5 suma `internet` y la 7 `packet`), `EntityKind`, `EntityRef` (`{ kind, variant }`), `ENTITY_TERMS: { [Kind]: Record<variant, TermId | null> }`, `entityTerm(entity: EntityRef): TermId | null`.
  - `MAP_TEXT.firewall: Record<FirewallKind, (name: string) => TermText>` y `MAP_TEXT.edge: Record<Network['edge'], TermText>`; `INSPECTION_TEXT.firewalls`, `.inbound` y `.edgeDoes`, por tipo.
  - `PieceView = PieceEntity & { id, anchorId, label, locked, configurable, term }`, con `PieceEntity = Extract<EntityRef, { kind: PieceKind }>`.
  - `MapPiece = Extract<EntityRef, { kind: MapPieceKind }> & { id, anchorId, label, locked }`.
  - `NetworkPiece({ variant, width, depth })`, `DevicePiece({ position, variant, intruded, still })`, `FirewallPiece({ position, variant, selected, still })`, `EdgePiece({ position, variant })`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 3**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 455 passed (455)`.

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
        r"""import { TERMS, isTermId, type Term, type TermId } from './terms';""",
        r"""import { TERMS, entityTerm, isTermId, type Term, type TermId } from './terms';""",
    ),
    (
        r"""  });
});""",
        r"""  });
});

describe('entity terms', () => {
  it('names a variant by the term the ladder already has, and leaves the office ones without a term until chapter 1', () => {
    expect(entityTerm({ kind: 'device', variant: 'ec2-instance' })).toBe('ec2-instance');
    expect(entityTerm({ kind: 'firewall', variant: 'security-group' })).toBe('security-group');
    expect(entityTerm({ kind: 'edge', variant: 'internet-gateway' })).toBe('internet-gateway');
    expect(entityTerm({ kind: 'network', variant: 'vpc' })).toBe('vpc');
    expect(entityTerm({ kind: 'device', variant: 'laptop' })).toBeNull();
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBeNull();
    expect(entityTerm({ kind: 'edge', variant: 'router' })).toBeNull();
  });

  it('gives a character no term: an actor is a person, not a piece of the network', () => {
    expect(entityTerm({ kind: 'actor', variant: 'attacker' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
  });
});""",
    ),
)

edit(
    'src/game/view/inspection.test.ts',
    (
        r"""import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';""",
        r"""import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, withDevice } from '@/testing';""",
    ),
    (
        r"""const first = startSession(INCIDENTS, '04-01');""",
        r"""const first = startSession(INCIDENTS, '04-01');
const office: Session = { ...first, world: withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }) };""",
    ),
    (
        r"""
  it('an id that names nothing shows nothing', () => {""",
        r"""
  it('a laptop of the office shows its IP and its firewall, with no definition while its term does not exist', () => {
    expect(plain(inspect(office, PIECE_ID.device('lucia-laptop')))).toEqual({
      title: 'lucia-laptop',
      fields: [['IP privada', '192.168.1.11'], ['Firewall', 'firewall lucia-laptop']],
    });
  });

  it('a host firewall lists its inbound rules like a Security Group, named after its device', () => {
    expect(plain(inspect(office, PIECE_ID.firewall('fw-lucia')))).toEqual({
      title: 'firewall lucia-laptop',
      fields: [['Reglas de entrada', 'Ninguna: no deja entrar nada.']],
    });
  });

  it('the router of an office says what it does', () => {
    expect(plain(inspect(office, PIECE_ID.edge))).toEqual({
      title: 'router',
      fields: [['Qué hace', 'Por aquí entra y sale el tráfico entre la oficina e internet.']],
    });
  });

  it('an id that names nothing shows nothing', () => {""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""import { startSession } from '@/game/session';""",
        r"""import { officeNet, withDevice } from '@/testing';
import { startSession, type Session } from '@/game/session';""",
    ),
    (
        r"""
describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker and the Internet gateway, each with its term', () => {
    expect(pieceViews(first).map(({ id, term, label, locked, configurable }) => ({ id, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.device(S1.id), term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.device(S2.id), term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.firewall(SG.servidor1), term: 'security-group', label: MAP_TEXT.firewall(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.firewall(SG.servidor2), term: 'security-group', label: MAP_TEXT.firewall(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.edge, term: 'internet-gateway', label: MAP_TEXT.edge, locked: true, configurable: false },""",
        r"""const office: Session = { ...first, world: withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }) };

describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker and the Internet gateway, each with its variant and its term', () => {
    expect(pieceViews(first).map(({ id, variant, term, label, locked, configurable }) => ({ id, variant, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.device(S1.id), variant: 'ec2-instance', term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.device(S2.id), variant: 'ec2-instance', term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.firewall(SG.servidor1), variant: 'security-group', term: 'security-group', label: MAP_TEXT.firewall['security-group'](S1.id), locked: false, configurable: true },
      { id: PIECE_ID.firewall(SG.servidor2), variant: 'security-group', term: 'security-group', label: MAP_TEXT.firewall['security-group'](S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), variant: 'attacker', term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
    ]);
  });

  it('draws an office by the kind of each device and firewall, with a router as its edge, and no term for them before chapter 1', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
      { kind: 'device', variant: 'laptop', term: null, label: 'your-laptop' },
      { kind: 'device', variant: 'laptop', term: null, label: 'lucia-laptop' },
      { kind: 'device', variant: 'printer', term: null, label: 'printer' },
      { kind: 'firewall', variant: 'host-firewall', term: null, label: 'firewall lucia-laptop' },
      { kind: 'actor', variant: 'attacker', term: null, label: 'Atacante' },
      { kind: 'edge', variant: 'router', term: null, label: 'router' },""",
    ),
    (
        r"""      title: MAP_TEXT.firewall(S2.id),""",
        r"""      title: MAP_TEXT.firewall['security-group'](S2.id),""",
    ),
)

edit(
    'src/scene/overlay/piece-label.test.tsx',
    (
        r"""const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };""",
        r"""const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/copy/terms.test.ts src/game/view/pieces.test.ts src/game/view/inspection.test.ts src/scene/overlay/piece-label.test.tsx
```

Expected: FAIL, `Test Files 3 failed | 1 passed (4)` y `Tests 8 failed | 56 passed (64)`: `entityTerm is not a function`, `MAP_TEXT.firewall.security-group is not a function`, y la oficina inspeccionada todavía como Internet gateway y Security Group.

- [ ] **Step 4: Implementar**

Contenido completo de `src/game/view/inspection.ts`:

```ts
import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Device, type Firewall, type FirewallKind, type PacketSpec } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './firewall-card';
import { parsePieceId } from './piece-id';

export interface InspectionField {
  label: TermText;
  lines: TermText[];
}

export interface Inspection {
  title: TermText;
  fields: InspectionField[];
}

interface FieldSpec {
  term: TermId | null;
  label: TermText;
  lines: () => TermText[];
}

const ICMP_MESSAGE_TERM = { 8: 'echo-request', 0: 'echo-reply' } as const satisfies Record<NonNullable<PacketSpec['icmpType']>, TermId>;
const RULES_TERM: Record<FirewallKind, TermId | null> = { 'security-group': 'inbound-rule', 'host-firewall': null };

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map((spec) => ({ label: spec.label, lines: spec.lines() }));
}

function definition(term: TermId | null): FieldSpec[] {
  return term ? [{ term, label: INSPECTION_TEXT.whatIs, lines: () => [TERMS[term].definition] }] : [];
}

function whatIs(entity: EntityRef): FieldSpec[] {
  return definition(entityTerm(entity));
}

function packetTerm(packet: PacketSpec): TermId | null {
  return packet.protocol === 'icmp' && packet.icmpType !== undefined ? ICMP_MESSAGE_TERM[packet.icmpType] : null;
}

function dnsNames(device: Device, region: string | undefined): string[] {
  if (!region) return [];
  return [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)];
}

function guardsField(guards: Firewall[]): FieldSpec[] {
  const [first] = guards;
  if (!first) return [];
  return [{ term: entityTerm({ kind: 'firewall', variant: first.kind }), label: INSPECTION_TEXT.firewalls[first.kind], lines: () => guards.map((guard) => MAP_TEXT.firewall[guard.kind](guard.name)) }];
}

function device(session: Session, own: Device): Inspection {
  const { region, firewalls } = session.world;
  const guards = firewalls.filter((firewall) => own.firewallIds.includes(firewall.id));
  return {
    title: own.name,
    fields: visible(
      [
        ...whatIs({ kind: 'device', variant: own.kind }),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [own.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(own, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [own.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        ...guardsField(guards),
      ],
      session.known,
    ),
  };
}

function firewall(session: Session, own: Firewall): Inspection {
  const rows = ruleRows(own, session.incident);
  return {
    title: MAP_TEXT.firewall[own.kind](own.name),
    fields: visible(
      [
        ...whatIs({ kind: 'firewall', variant: own.kind }),
        { term: RULES_TERM[own.kind], label: INSPECTION_TEXT.inbound[own.kind], lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) },
      ],
      session.known,
    ),
  };
}

function edge(session: Session): Inspection {
  const variant = session.world.edge;
  return {
    title: MAP_TEXT.edge[variant],
    fields: visible([...whatIs({ kind: 'edge', variant }), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.edgeDoes[variant]] }], session.known),
  };
}

function actor(session: Session, who: Actor): Inspection {
  return {
    title: who.name,
    fields: visible(
      [
        { term: null, label: INSPECTION_TEXT.who, lines: () => [ACTOR_ROLE_TEXT[who.kind]] },
        { term: 'public-ip', label: INSPECTION_TEXT.ip, lines: () => [who.ip] },
      ],
      session.known,
    ),
  };
}

function packet(session: Session, run: FlowRun): Inspection {
  const step = stopStep(run.trace);
  return {
    title: run.label,
    fields: [
      ...visible(definition(packetTerm(run.packet)), session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world)] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece or a packet, starting with what it is, or null when the id names nothing on the map. */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  if (ref.kind === 'edge') return edge(session);
  const { world, runs } = session;
  switch (ref.kind) {
    case 'device': {
      const found = world.devices.find((candidate) => candidate.id === ref.id);
      return found ? device(session, found) : null;
    }
    case 'firewall': {
      const found = world.firewalls.find((candidate) => candidate.id === ref.id);
      return found ? firewall(session, found) : null;
    }
    case 'actor': {
      const found = world.actors.find((candidate) => candidate.id === ref.id);
      return found ? actor(session, found) : null;
    }
    case 'packet': {
      const found = runs.find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
    }
  }
}
```

Contenido completo de `src/game/view/pieces.ts`:

```ts
import { MAP_TEXT, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'actor';

type PieceEntity = Extract<EntityRef, { kind: PieceKind }>;

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export type PieceView = PieceEntity & PieceFacts & { term: TermId | null };

export const EDGE_ANCHOR = 'edge';

function piece(entity: PieceEntity, facts: PieceFacts): PieceView {
  return { ...entity, ...facts, term: entityTerm(entity) };
}

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable };
    return [piece({ kind: 'firewall', variant: firewall.kind }, facts)];
  });
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  return [
    ...world.devices.map((device) =>
      piece({ kind: 'device', variant: device.kind }, { id: PIECE_ID.device(device.id), anchorId: device.id, label: device.name, locked: !parts.hostSettings, configurable: false }),
    ),
    ...firewalls(session),
    ...world.actors.map((actor) => piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false }),
  ];
}
```

Contenido completo de `src/scene/entities/device.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Device } from '@/engine';
import { useHtmlPortal } from '@/scene/html-layer';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const WARNING_Y = 2.1;

function Server({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Laptop({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.4, 0.12, 1]} position={[x, 0.06, z]} />
      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Printer({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.4, 0.6, 1]} position={[x, 0.3, z]} />
      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

const DEVICE_SHAPE = { laptop: Laptop, printer: Printer, 'ec2-instance': Server } satisfies Record<Device['kind'], (spot: { x: number; z: number }) => unknown>;

/** A device of the network, drawn by its variant: it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function DevicePiece({ position, variant, intruded, still }: { position: Vec2; variant: Device['kind']; intruded: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  const [x, z] = position;
  const Shape = DEVICE_SHAPE[variant];
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <Shape x={x} z={z} />
      {intruded && still && (
        <Html portal={portal} position={[x, WARNING_Y, z]} center>
          <span className="stamp stamp--blocked" aria-hidden="true">
            !
          </span>
        </Html>
      )}
    </group>
  );
}
```

Contenido completo de `src/scene/entities/network.tsx`:

```tsx
import type { Network } from '@/engine';
import { InkBox } from '@/scene/ink';
import { PAPER_SHADE } from '@/scene/theme';

const WALL_HEIGHT = 0.5;
const WALL_DEPTH = 0.12;

/** The network's slab, the floor its devices stand on: an office adds a low wall along its back edge. */
export function NetworkPiece({ variant, width, depth }: { variant: Network['kind']; width: number; depth: number }) {
  return (
    <group>
      <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={2} />
      {variant === 'office' && <InkBox size={[width, WALL_HEIGHT, WALL_DEPTH]} position={[0, WALL_HEIGHT / 2, (WALL_DEPTH - depth) / 2]} fill={PAPER_SHADE} />}
    </group>
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
    'src/copy/CLAUDE.md',
    (
        r"""- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).""",
        r"""- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1.""",
    ),
)

edit(
    'src/copy/incident-ui.ts',
    (
        r"""import type { Actor } from '@/engine';
import type { TermText } from './term-text';

export const MAP_TEXT = {
  firewall: (name: string): TermText => `{{security-group}} ${name}`,
  edge: '{{internet-gateway}}',""",
        r"""import type { Actor, FirewallKind, Network } from '@/engine';
import type { TermText } from './term-text';

const FIREWALL_LABEL: Record<FirewallKind, (name: string) => TermText> = {
  'security-group': (name) => `{{security-group}} ${name}`,
  'host-firewall': (name) => `firewall ${name}`,
};

const EDGE_LABEL: Record<Network['edge'], TermText> = {
  'internet-gateway': '{{internet-gateway}}',
  router: 'router',
};

export const MAP_TEXT = {
  firewall: FIREWALL_LABEL,
  edge: EDGE_LABEL,""",
    ),
    (
        r"""  firewalls: '{{security-group|Security Groups}}',
  inbound: '{{inbound-rule|Reglas de entrada}}',""",
        r"""  firewalls: { 'security-group': '{{security-group|Security Groups}}', 'host-firewall': 'Firewall' } satisfies Record<FirewallKind, TermText>,
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': 'Reglas de entrada' } satisfies Record<FirewallKind, TermText>,""",
    ),
    (
        r"""  edgeDoes: 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',""",
        r"""  edgeDoes: {
    'internet-gateway': 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
    router: 'Por aquí entra y sale el tráfico entre la oficina e internet.',
  } satisfies Record<Network['edge'], TermText>,""",
    ),
)

edit(
    'src/copy/index.ts',
    (
        r"""export { TERMS, isTermId } from './terms';
export type { TermId } from './terms';""",
        r"""export { ENTITY_TERMS, TERMS, entityTerm, isTermId } from './terms';
export type { EntityKind, EntityRef, EntityVariants, TermId } from './terms';""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""export interface Term {""",
        r"""import type { Actor, Device, FirewallKind, Network } from '@/engine';

export interface Term {""",
    ),
    (
        r"""  return Object.hasOwn(TERMS, value);
}""",
        r"""  return Object.hasOwn(TERMS, value);
}

export interface EntityVariants {
  network: Network['kind'];
  device: Device['kind'];
  firewall: FirewallKind;
  edge: Network['edge'];
  actor: Actor['kind'];
}

export type EntityKind = keyof EntityVariants;

/** One entity of the map in one of its variants, as the entity catalog draws it. */
export type EntityRef = { [Kind in EntityKind]: { kind: Kind; variant: EntityVariants[Kind] } }[EntityKind];

/** The term that names each variant of each entity, or null while the ladder has no term for it. */
export const ENTITY_TERMS: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermId | null> } = {
  network: { office: null, vpc: 'vpc' },
  device: { laptop: null, printer: null, 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': null, 'security-group': 'security-group' },
  edge: { router: null, 'internet-gateway': 'internet-gateway' },
  actor: { you: null, attacker: null },
};

/** Returns the term that names an entity in this variant, or null when it has none yet. */
export function entityTerm(entity: EntityRef): TermId | null {
  const terms: Record<string, TermId | null> = ENTITY_TERMS[entity.kind];
  return terms[entity.variant];
}""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""- Every piece kind declares its term in `PIECE_TERM`: `ec2-instance` for a device, `security-group` for a firewall, `internet-gateway` for the edge and none (`null`) for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a device, a firewall, the edge or a packet with an ICMP message starts with `INSPECTION_TEXT.whatIs`, the definition of its term, once that term is known (a packet's term is its ICMP message); an actor's inspection has no definition.""",
        r"""- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `ec2-instance`, `security-group` and `internet-gateway` today, none yet for the office variants, and none ever for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet with an ICMP message, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message); a piece without a term has no definition.""",
    ),
)

edit(
    'src/game/view/firewall-card.ts',
    (
        r"""  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.firewall(firewall.name), rules: ruleRows(firewall, session.incident) } : null;""",
        r"""  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.firewall[firewall.kind](firewall.name), rules: ruleRows(firewall, session.incident) } : null;""",
    ),
)

edit(
    'src/scene/entities/edge.tsx',
    (
        r"""import { InkBox } from '@/scene/ink';""",
        r"""import type { Network } from '@/engine';
import { InkBox } from '@/scene/ink';""",
    ),
    (
        r"""/** The network's way out to the internet: an arch over the road. */
export function EdgePiece({ position }: { position: Vec2 }) {""",
        r"""/** The network's way out to the internet, an arch over the road: plain for an Internet gateway, with two antennas for a router. */
export function EdgePiece({ position, variant }: { position: Vec2; variant: Network['edge'] }) {""",
    ),
    (
        r"""      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />""",
        r"""      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
      {variant === 'router' && (
        <>
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z - 0.45]} lineWidth={1} />
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z + 0.45]} lineWidth={1} />
        </>
      )}""",
    ),
)

edit(
    'src/scene/entities/firewall.tsx',
    (
        r"""import { useFrame } from '@react-three/fiber';""",
        r"""import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';""",
    ),
    (
        r"""import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { ACCENT } from '@/scene/theme';""",
        r"""import type { FirewallKind } from '@/engine';
import { InkBox } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';""",
    ),
    (
        r"""
/** A firewall standing in front of its device: its bar pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, selected, still }: { position: Vec2; selected: boolean; still: boolean }) {""",
        r"""const BAR: Record<FirewallKind, { size: Vec3; y: number }> = {
  'security-group': { size: [1.2, 0.07, 0.07], y: 0.46 },
  'host-firewall': { size: [1.2, 0.24, 0.1], y: 0.36 },
};
const BRICK_JOINTS: Vec3[] = [
  [-0.6, 0, 0.051], [0.6, 0, 0.051],
  [-0.3, 0.12, 0.051], [-0.3, 0, 0.051], [0.3, 0.12, 0.051], [0.3, 0, 0.051],
  [0, 0, 0.051], [0, -0.12, 0.051],
];

/** A firewall standing in front of its device, a bar between two posts: a thin bar for a Security Group, a brick wall for the firewall of a laptop. Its bar pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, variant, selected, still }: { position: Vec2; variant: FirewallKind; selected: boolean; still: boolean }) {""",
    ),
    (
        r"""      <group ref={bar} position={[x, 0.46, z]}>
        <InkBox size={[1.2, 0.07, 0.07]} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />""",
        r"""      <group ref={bar} position={[x, BAR[variant].y, z]}>
        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />
        {variant === 'host-firewall' && <Line points={BRICK_JOINTS} segments color={INK} lineWidth={1} />}""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter } from './layout';""",
        r"""import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter, type Layout } from './layout';""",
    ),
    (
        r"""
export function GameScene({ world, pieces, flows, intrudedDeviceIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
        r"""
function PieceShape({ piece, layout, intruded, selected, still }: { piece: MapPiece; layout: Layout; intruded: boolean; selected: boolean; still: boolean }) {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return <DevicePiece position={[spot.x, spot.z]} variant={piece.variant} intruded={intruded} still={still} />;
    }
    case 'firewall':
      return <FirewallPiece position={layout.devices[piece.anchorId].firewall} variant={piece.variant} selected={selected} still={still} />;
    case 'edge':
      return <EdgePiece position={layout.edge} variant={piece.variant} />;
    case 'actor':
      return <ActorPiece position={layout.actors[piece.anchorId]} variant={piece.variant} />;
  }
}

export function GameScene({ world, pieces, flows, intrudedDeviceIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
    ),
    (
        r"""          <NetworkPiece width={layout.sheet.width} depth={layout.sheet.depth} />
          <Road layout={layout} />
          <EdgePiece position={layout.edge} />
          {world.devices.map((device) => (
            <DevicePiece key={device.id} position={[layout.devices[device.id].x, layout.devices[device.id].z]} intruded={intrudedDeviceIds.has(device.id)} still={still} />
          ))}
          {pieces
            .filter((piece) => piece.kind === 'firewall')
            .map((piece) => (
              <FirewallPiece key={piece.id} position={layout.devices[piece.anchorId].firewall} selected={piece.id === activePieceId} still={still} />
            ))}
          {world.actors.map((actor) => (
            <ActorPiece key={actor.id} position={layout.actors[actor.id]} variant={actor.kind} />""",
        r"""          <NetworkPiece variant={world.kind} width={layout.sheet.width} depth={layout.sheet.depth} />
          <Road layout={layout} />
          {pieces.map((piece) => (
            <PieceShape key={piece.id} piece={piece} layout={layout} intruded={intrudedDeviceIds.has(piece.anchorId)} selected={piece.id === activePieceId} still={still} />""",
    ),
)

edit(
    'src/scene/overlay/piece-label.tsx',
    (
        r"""import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import { inspectHandlers, type OnInspect } from './inspect-handlers';

export type MapPieceKind = 'device' | 'firewall' | 'actor' | 'edge';

export interface MapPiece {
  id: string;
  kind: MapPieceKind;""",
        r"""import { MAP_TEXT, toPlainText, type EntityRef, type TermText } from '@/copy';
import { inspectHandlers, type OnInspect } from './inspect-handlers';

export type MapPieceKind = 'device' | 'firewall' | 'edge' | 'actor';

export type MapPiece = Extract<EntityRef, { kind: MapPieceKind }> & {
  id: string;""",
    ),
    (
        r"""  locked: boolean;
}""",
        r"""  locked: boolean;
};""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 461 passed (461)` en 40 archivos; `git diff` sin salida; `npm run check` PASS (Playwright: 10 passed; el capítulo 4 se ve igual: sus variantes son las de hoy).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(scene): draw every piece by the variant of its model"
```

---

### Task 5: La oficina en el mapa, internet y los caminos nuevos (F1, F3)

El layout ubica una oficina (sin subredes) en una sola fila sobre la losa y, mientras el mapa muestre el afuera, el borde, internet y los actores a la izquierda, en ese orden. `game/view` decide qué es el afuera: el borde e internet son piezas solo mientras el mundo tenga actores. Llega la entidad internet (un globo) con su etiqueta llana y su inspección. Los caminos nuevos: un paquete desde internet pasa por el globo antes del borde; uno que internet no entrega termina en el globo; uno a la propia IP llega al umbral de la puerta y vuelve; uno a una IP que nadie tiene corre hasta el final del camino. El layout separa dónde está cada pieza (`piecePosition`) de dónde flota su etiqueta (`labelOffset`), para que el catálogo de la Tarea 9 use lo mismo.

**Files:**
- Create: `src/scene/entities/internet.tsx`
- Modify: `src/scene/layout.ts` (reescribir), `src/scene/game-scene.tsx`, `src/scene/entities/index.ts`, `src/scene/overlay/piece-label.tsx`, `src/copy/terms.ts`, `src/copy/incident-ui.ts`, `src/game/view/piece-id.ts`, `src/game/view/pieces.ts`, `src/game/view/inspection.ts`, `src/game/view/CLAUDE.md`, `src/scene/CLAUDE.md`
- Test: `src/scene/layout.test.ts`, `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts`

**Interfaces:**
- Consumes: `officeNet`, `OFFICE` de `@/testing` (tests); el resultado `route-self` y `route-no-device` del plan 1.
- Produces:
  - `computeLayout(net: Network, outside: boolean): Layout`; `Layout` suma `outside: boolean` e `internet: Vec2`; `DeviceSpot` suma `doorstep: Vec2`.
  - `piecePosition(piece: { kind; anchorId }, layout): Vec2`, `labelOffset(kind: MapPieceKind): Vec3`, `labelPosition(piece, layout): Vec3`.
  - `pathFor` con los caminos de arriba; los lugares de borde son `['internet-gateway', 'router']`.
  - `InternetPiece({ position })`; `PIECE_ID.internet = 'internet'`; `PieceKind` y `MapPieceKind` suman `'internet'`; `INTERNET_ANCHOR`.
  - `EntityVariants.internet = 'internet'`; `MAP_TEXT.internet = 'internet'`; `INSPECTION_TEXT.internetDoes`.
  - `GameScene` calcula el layout con `outside = pieces.some((piece) => piece.kind === 'edge')`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 4**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 461 passed (461)`.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/scene/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, withInbound } from '@/testing';
import { simulate } from '@/engine/simulation/simulate';
import { cardAnchorPosition, computeLayout, cumulativeLengths, labelPosition, layoutCenter, pathFor, pathLength, pointAt, roundTrip, sideForNdc, spreadStamps } from './layout';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net(), true);

  it('puts one column per subnet and each instance inside its own', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.devices.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.devices.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the firewall and the road sit in front of the device (greater z, toward the camera)', () => {
    const spot = layout.devices.servidor2;
    expect(spot.firewall[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.firewall[1]);
  });

  it('the edge, then the internet, then the actors sit on the left of the sheet, and the road starts at the edge', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
    expect(layout.roadFromX).toBe(layout.edge[0]);
  });
});

describe('computeLayout for an office', () => {
  const layout = computeLayout(officeNet(), true);
  const spots = ['your-laptop', 'lucia-laptop', 'printer'].map((id) => layout.devices[id]);

  it('puts every device in one row on the sheet, with no subnet', () => {
    expect(layout.subnets).toEqual({});
    expect(spots.map((spot) => spot.z)).toEqual([spots[0].z, spots[0].z, spots[0].z]);
    expect(spots[0].x).toBeLessThan(spots[1].x);
    expect(spots[1].x).toBeLessThan(spots[2].x);
    for (const spot of spots) expect(Math.abs(spot.x)).toBeLessThan(layout.sheet.width / 2);
  });

  it('puts the router, the internet and the actor on the left, like a VPC', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
  });

  it('without the outside, the road stays on the sheet and the camera looks at the sheet only', () => {
    const inside = computeLayout(officeNet(), false);
    expect(inside.roadFromX).toBeGreaterThan(-inside.sheet.width / 2);
    expect(layoutCenter(inside)).toEqual([0, 0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net, true);

  it('step 3: ends at the firewall of servidor2', () => {
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.firewall);
  });

  it('step 5: reaches the door of servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.door);
  });

  it('a ping from the internet to a public IP crosses the internet and the edge before the firewall', () => {
    const packet = ping(actor('attacker'), S2.public);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet, layout.edge, layout.devices.servidor2.road, layout.devices.servidor2.firewall]);
  });

  it('a private IP from the internet is lost in the internet, before the edge', () => {
    const packet = ping(actor('attacker'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet]);
  });
});

describe('pathFor in an office', () => {
  const net = officeNet();
  const layout = computeLayout(net, true);
  const you = layout.devices['your-laptop'];

  it('a ping to its own IP stays at its own doorstep: it never reaches its firewall or the road', () => {
    const packet = ping(device('your-laptop'), OFFICE.you);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([you.door, you.doorstep]);
    expect(you.doorstep[1]).toBeLessThan(you.firewall[1]);
  });

  it('a ping to an IP that no device has runs to the far end of the road and stops there', () => {
    const packet = ping(device('your-laptop'), OFFICE.nobody);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([you.door, you.firewall, you.road, [layout.roadToX, layout.roadZ]]);
  });

  it('a ping between two laptops runs along the road from one door to the other', () => {
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const lucia = layout.devices['lucia-laptop'];
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('a ping from the internet to a private IP of the office is lost in the internet, before the router', () => {
    const packet = ping(actor('attacker'), OFFICE.you);
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([layout.actors.attacker, layout.internet]);
  });
});

describe('path interpolation', () => {
  it('pointAt walks the segments in order', () => {
    const path: [number, number][] = [[0, 0], [2, 0], [2, 2]];
    const lengths = cumulativeLengths(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(pointAt(path, lengths, 1)).toEqual([1, 0]);
    expect(pointAt(path, lengths, 3)).toEqual([2, 1]);
    expect(pointAt(path, lengths, 99)).toEqual([2, 2]);
  });
});

describe('anchors', () => {
  const layout = computeLayout(lab03Net(), true);

  it('the camera looks at the middle of everything drawn, actors included', () => {
    const [x] = layoutCenter(layout);
    const left = Math.min(...Object.values(layout.actors).map(([actorX]) => actorX));
    expect(x - left).toBeCloseTo(layout.sheet.width / 2 - x);
  });

  it('a Security Group label sits in front of its firewall, and a device label above it', () => {
    const spot = layout.devices.servidor2;
    expect(labelPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.firewall[1]);
    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.firewall[0]);
  });

  it('the internet label floats above the internet', () => {
    const [x, y, z] = labelPosition({ kind: 'internet', anchorId: 'internet' }, layout);
    expect([x, z]).toEqual(layout.internet);
    expect(y).toBeGreaterThan(1);
  });

  it('a card opens on the side of the screen with more room', () => {
    expect(sideForNdc(0.4)).toBe('left');
    expect(sideForNdc(-0.4)).toBe('right');
  });
});

describe('paths and stamps', () => {
  it('a round trip goes and comes back along the same points', () => {
    expect(roundTrip([[0, 0], [2, 0], [2, 2]])).toEqual([[0, 0], [2, 0], [2, 2], [2, 0], [0, 0]]);
    expect(pathLength([[0, 0], [3, 0], [3, 4]])).toBe(7);
  });

  it('stamps on the same point spread apart along the screen, the rest stay', () => {
    const [a, b, c] = spreadStamps([[1, 1], [1, 1], [5, 5]]);
    expect(a[0] + b[0]).toBeCloseTo(2);
    expect(a[0]).toBeLessThan(b[0]);
    expect(a[0] - 1).toBeCloseTo(-(a[1] - 1));
    expect(c).toEqual([5, 5]);
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
        r"""  it('every piece but the attacker, and every packet, starts with what it is', () => {
    const ids = [...pieceViews(first).filter((piece) => piece.kind !== 'actor').map((piece) => piece.id), ...first.runs.map((run) => run.pieceId)];""",
        r"""  it('every piece with a term, and every packet, starts with what it is', () => {
    const ids = [...pieceViews(first).filter((piece) => piece.term !== null).map((piece) => piece.id), ...first.runs.map((run) => run.pieceId)];""",
    ),
    (
        r"""
  it('an id that names nothing shows nothing', () => {""",
        r"""
  it('the internet says what it does, with no definition while its term does not exist', () => {
    expect(plain(inspect(first, PIECE_ID.internet))).toEqual({ title: 'internet', fields: [['Qué hace', 'Lleva los paquetes de una red a otra.']] });
  });

  it('an id that names nothing shows nothing', () => {""",
    ),
)

edit(
    'src/game/view/pieces.test.ts',
    (
        r"""  it('shows both instances locked, both Security Groups open to edit, the attacker and the Internet gateway, each with its variant and its term', () => {""",
        r"""  it('shows both instances locked, both Security Groups open to edit, the attacker, the Internet gateway and the internet, each with its variant and its term', () => {""",
    ),
    (
        r"""      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },""",
        r"""      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
      { id: PIECE_ID.internet, variant: 'internet', term: null, label: MAP_TEXT.internet, locked: false, configurable: false },""",
    ),
    (
        r"""      { kind: 'edge', variant: 'router', term: null, label: 'router' },
    ]);""",
        r"""      { kind: 'edge', variant: 'router', term: null, label: 'router' },
      { kind: 'internet', variant: 'internet', term: null, label: 'internet' },
    ]);
  });

  it('shows no router and no internet while nobody is outside the office', () => {
    const alone: Session = { ...office, world: { ...office.world, actors: [] } };
    expect(pieceViews(alone).map((piece) => piece.kind)).toEqual(['device', 'device', 'device', 'firewall']);""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/scene/layout.test.ts src/game/view/pieces.test.ts src/game/view/inspection.test.ts
```

Expected: FAIL, `Test Files 3 failed (3)` y `Tests 15 failed | 26 passed (41)`: el layout no tiene `internet` ni `doorstep` ni coloca a los dispositivos de una oficina (`Cannot read properties of undefined`), y las piezas no incluyen internet.

- [ ] **Step 4: Implementar**

Contenido completo de `src/scene/entities/internet.tsx`:

```tsx
import { Billboard, Line } from '@react-three/drei';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const RADIUS = 0.62;
const LINE_RADIUS = RADIUS * 1.01;
const SEGMENTS = 48;
const CENTER_Y = RADIUS + 0.04;

function circle(radius: number, toPoint: (cos: number, sin: number) => Vec3): Vec3[] {
  return Array.from({ length: SEGMENTS + 1 }, (_, index) => {
    const angle = (index / SEGMENTS) * Math.PI * 2;
    return toPoint(Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
}

const OUTLINE = circle(RADIUS * 1.02, (a, b) => [a, b, 0]);
const EQUATOR = circle(LINE_RADIUS, (a, b) => [a, 0, b]);
const MERIDIAN_X = circle(LINE_RADIUS, (a, b) => [0, a, b]);
const MERIDIAN_Z = circle(LINE_RADIUS, (a, b) => [a, b, 0]);

/** The internet, outside every network: a paper globe with an ink equator and two meridians. */
export function InternetPiece({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group position={[x, CENTER_Y, z]}>
      <mesh>
        <sphereGeometry args={[RADIUS, 32, 24]} />
        <meshStandardMaterial color={PAPER_FILL} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={EQUATOR} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_X} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_Z} color={INK} lineWidth={1} />
      <Billboard>
        <Line points={OUTLINE} color={INK} lineWidth={1.5} />
      </Billboard>
    </group>
  );
}
```

Contenido completo de `src/scene/layout.ts`:

```ts
import type { Device, Network, PacketSpec, Trace } from '@/engine';
import type { MapPieceKind } from './overlay/piece-label';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type CardSide = 'left' | 'right';

export interface SubnetSpot {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface DeviceSpot {
  x: number;
  z: number;
  firewall: Vec2;
  door: Vec2;
  doorstep: Vec2;
  road: Vec2;
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  devices: Record<string, DeviceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  outside: boolean;
  edge: Vec2;
  internet: Vec2;
  actors: Record<string, Vec2>;
}

interface Column {
  subnetId: string | null;
  devices: Device[];
}

const GAP = 3.2;
const MIN_COLUMN = 5;
const DEPTH = 6;
const ROAD_Z = 1.9;
const ROAD_INSET = 0.5;
const DEVICE_Z = -0.9;
const FIREWALL_Z = 0.7;
const DOOR_Z = -0.2;
const DOORSTEP_Z = 0.25;
const EDGE_MARGIN = 1.5;
const INTERNET_GAP = 3.6;
const ACTOR_GAP = 3;
const ACTOR_SPACING = 2.5;
const ACTOR_STAGGER_Z = 1.6;
const LABEL_OFFSET: Record<MapPieceKind, Vec3> = { device: [0, 1.75, 0], firewall: [0, 0.1, 0.8], actor: [0, 0.05, 0.7], edge: [0, 2.6, 0], internet: [0, 2.1, 0] };
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.8;
const EDGE_PLACES: string[] = ['internet-gateway', 'router'] satisfies Network['edge'][];

function columnsOf(net: Network): Column[] {
  if (!net.subnets) return [{ subnetId: null, devices: net.devices }];
  return net.subnets.map((subnet) => ({ subnetId: subnet.id, devices: net.devices.filter((d) => d.subnetId === subnet.id) }));
}

/** Lays out one column per subnet (a single one for an office), the devices of each column in a row and, when the map shows the outside, the edge, the internet and its actors on the left. */
export function computeLayout(net: Network, outside: boolean): Layout {
  const columns = columnsOf(net);
  const widths = columns.map((column) => Math.max(MIN_COLUMN, column.devices.length * GAP + 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const sheetWidth = total + 2;
  const subnets: Record<string, SubnetSpot> = {};
  const devices: Record<string, DeviceSpot> = {};
  let cursor = -total / 2;
  columns.forEach((column, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width;
    if (column.subnetId) subnets[column.subnetId] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1 };
    column.devices.forEach((device, k) => {
      const x = cx + (k - (column.devices.length - 1) / 2) * GAP;
      devices[device.id] = { x, z: DEVICE_Z, firewall: [x, FIREWALL_Z], door: [x, DOOR_Z], doorstep: [x, DOORSTEP_Z], road: [x, ROAD_Z] };
    });
  });
  const edge: Vec2 = [-sheetWidth / 2 - EDGE_MARGIN, ROAD_Z];
  const internet: Vec2 = [edge[0] - INTERNET_GAP, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [internet[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  const roadFromX = outside ? edge[0] : -sheetWidth / 2 + ROAD_INSET;
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, devices, roadZ: ROAD_Z, roadFromX, roadToX: sheetWidth / 2 - ROAD_INSET, outside, edge, internet, actors };
}

/** Returns the middle of everything drawn, so the camera can look at it. */
export function layoutCenter(layout: Layout): Vec2 {
  const outsideXs = layout.outside ? [layout.internet[0], ...Object.values(layout.actors).map(([x]) => x)] : [];
  const left = Math.min(-layout.sheet.width / 2, ...outsideXs);
  return [(left + layout.sheet.width / 2) / 2, 0];
}

/** Returns where a piece of this kind stands on the ground: a device, the firewall in front of its device, an actor, the edge or the internet. */
export function piecePosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec2 {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return [spot.x, spot.z];
    }
    case 'firewall':
      return layout.devices[piece.anchorId].firewall;
    case 'actor':
      return layout.actors[piece.anchorId];
    case 'edge':
      return layout.edge;
    case 'internet':
      return layout.internet;
  }
}

/** Returns where the label of a piece floats from the point it stands on: above a device, in front of a firewall, below an actor, above the edge and the internet. */
export function labelOffset(kind: MapPieceKind): Vec3 {
  return LABEL_OFFSET[kind];
}

/** Returns where the label of a piece floats on the map. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  const [x, z] = piecePosition(piece, layout);
  const [dx, y, dz] = labelOffset(piece.kind);
  return [x + dx, y, z + dz];
}

/** Returns where the task card of the firewall of this device is anchored. */
export function cardAnchorPosition(deviceId: string, layout: Layout): Vec3 {
  const [x, z] = layout.devices[deviceId].firewall;
  return [x, CARD_Y, z];
}

/** Picks the side with more room for a card anchored at this normalized screen x (-1 is the left edge, 1 the right edge). */
export function sideForNdc(ndcX: number): CardSide {
  return ndcX > 0 ? 'left' : 'right';
}

/** Returns the points the packet travels along its trace, ending where it stopped: at its own doorstep for a packet to its own IP, at the far end of the road when no device has its IP, in the internet when the internet does not deliver it. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
  const from = packet.from;
  const source = from.kind === 'device' ? layout.devices[from.id] : undefined;
  if (source && trace.steps.some((s) => s.reason.code === 'route-self')) return [source.door, source.doorstep];
  const points: Vec2[] = source ? [source.door, source.firewall, source.road] : [layout.actors[from.id] ?? layout.internet, layout.internet];

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.reason.code === 'route-no-device')) return [...points, [layout.roadToX, layout.roadZ]];
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.devices[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.firewall);
  if (trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'drop')) return points;
  points.push(dest.door);
  return points;
}

export function cumulativeLengths(path: Vec2[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  }
  return acc;
}

export function pointAt(path: Vec2[], lengths: number[], distance: number): Vec2 {
  if (path.length === 1) return path[0];
  const total = lengths[lengths.length - 1];
  const d = Math.min(Math.max(distance, 0), total);
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < d) i++;
  const segment = lengths[i] - lengths[i - 1];
  const t = segment === 0 ? 1 : (d - lengths[i - 1]) / segment;
  return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
}

/** Returns the path out and, for a reply, the same path back to the start. */
export function roundTrip(path: Vec2[]): Vec2[] {
  return [...path, ...path.slice(0, -1).reverse()];
}

export function pathLength(path: Vec2[]): number {
  return cumulativeLengths(path).at(-1) ?? 0;
}

function samePoint(point: Vec2) {
  return (other: Vec2) => other[0] === point[0] && other[1] === point[1];
}

/** Moves stamps that share a point apart along the screen's horizontal (x up, z down), keeping each group centered on its point. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  return points.map((point, index): Vec2 => {
    const group = points.filter(samePoint(point)).length;
    const rank = points.slice(0, index).filter(samePoint(point)).length;
    const shift = (rank - (group - 1) / 2) * STAMP_SPREAD;
    return [point[0] + shift, point[1] - shift];
  });
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
        r"""  edge: EDGE_LABEL,""",
        r"""  edge: EDGE_LABEL,
  internet: 'internet',""",
    ),
    (
        r"""  } satisfies Record<Network['edge'], TermText>,""",
        r"""  } satisfies Record<Network['edge'], TermText>,
  internetDoes: 'Lleva los paquetes de una red a otra.',""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""  edge: Network['edge'];""",
        r"""  edge: Network['edge'];
  internet: 'internet';""",
    ),
    (
        r"""  edge: { router: null, 'internet-gateway': 'internet-gateway' },""",
        r"""  edge: { router: null, 'internet-gateway': 'internet-gateway' },
  internet: { internet: null },""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""- The inspection of a piece whose variant has a term, or of a packet with an ICMP message, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message); a piece without a term has no definition.""",
        r"""- The inspection of a piece whose variant has a term, or of a packet with an ICMP message, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message); a piece without a term has no definition.
- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""
function actor(session: Session, who: Actor): Inspection {""",
        r"""
function internet(session: Session): Inspection {
  return {
    title: MAP_TEXT.internet,
    fields: visible([...whatIs({ kind: 'internet', variant: 'internet' }), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.internetDoes] }], session.known),
  };
}

function actor(session: Session, who: Actor): Inspection {""",
    ),
    (
        r"""  if (ref.kind === 'edge') return edge(session);""",
        r"""  if (ref.kind === 'edge') return edge(session);
  if (ref.kind === 'internet') return internet(session);""",
    ),
)

edit(
    'src/game/view/piece-id.ts',
    (
        r"""export type PieceRef = { kind: 'device' | 'firewall' | 'actor' | 'packet'; id: string } | { kind: 'edge' };""",
        r"""export type PieceRef = { kind: 'device' | 'firewall' | 'actor' | 'packet'; id: string } | { kind: 'edge' } | { kind: 'internet' };""",
    ),
    (
        r"""  edge: 'edge',""",
        r"""  edge: 'edge',
  internet: 'internet',""",
    ),
    (
        r"""  if (pieceId === PIECE_ID.edge) return { kind: 'edge' };""",
        r"""  if (pieceId === PIECE_ID.edge) return { kind: 'edge' };
  if (pieceId === PIECE_ID.internet) return { kind: 'internet' };""",
    ),
)

edit(
    'src/game/view/pieces.ts',
    (
        r"""export type PieceKind = 'device' | 'firewall' | 'edge' | 'actor';""",
        r"""export type PieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';""",
    ),
    (
        r"""export const EDGE_ANCHOR = 'edge';""",
        r"""export const EDGE_ANCHOR = 'edge';
export const INTERNET_ANCHOR = 'internet';""",
    ),
    (
        r"""/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name and whether the player may open it. */""",
        r"""function outside(session: Session): PieceView[] {
  const { world } = session;
  if (world.actors.length === 0) return [];
  return [
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false }),
    piece({ kind: 'internet', variant: 'internet' }, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false }),
  ];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name and whether the player may open it; the edge and the internet show only when someone is outside the network. */""",
    ),
    (
        r"""    ...world.actors.map((actor) => piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false }),""",
        r"""    ...world.actors.map((actor) => piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    ...outside(session),""",
    ),
)

edit(
    'src/scene/CLAUDE.md',
    (
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`). `ink.tsx` holds the paper box with ink edges that every piece is built from.""",
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`). `ink.tsx` holds the paper box with ink edges that every piece is built from.""",
    ),
)

edit(
    'src/scene/entities/index.ts',
    (
        r"""export { FirewallPiece } from './firewall';""",
        r"""export { FirewallPiece } from './firewall';
export { InternetPiece } from './internet';""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, NetworkPiece } from './entities';
import { HtmlLayerContext } from './html-layer';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter, type Layout } from './layout';""",
        r"""import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, InternetPiece, NetworkPiece } from './entities';
import { HtmlLayerContext } from './html-layer';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter, piecePosition, type Layout } from './layout';""",
    ),
    (
        r"""  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return <DevicePiece position={[spot.x, spot.z]} variant={piece.variant} intruded={intruded} still={still} />;
    }
    case 'firewall':
      return <FirewallPiece position={layout.devices[piece.anchorId].firewall} variant={piece.variant} selected={selected} still={still} />;
    case 'edge':
      return <EdgePiece position={layout.edge} variant={piece.variant} />;
    case 'actor':
      return <ActorPiece position={layout.actors[piece.anchorId]} variant={piece.variant} />;""",
        r"""  const position = piecePosition(piece, layout);
  switch (piece.kind) {
    case 'device':
      return <DevicePiece position={position} variant={piece.variant} intruded={intruded} still={still} />;
    case 'firewall':
      return <FirewallPiece position={position} variant={piece.variant} selected={selected} still={still} />;
    case 'edge':
      return <EdgePiece position={position} variant={piece.variant} />;
    case 'internet':
      return <InternetPiece position={position} />;
    case 'actor':
      return <ActorPiece position={position} variant={piece.variant} />;""",
    ),
    (
        r"""  const layout = computeLayout(world);""",
        r"""  const layout = computeLayout(world, pieces.some((piece) => piece.kind === 'edge'));""",
    ),
)

edit(
    'src/scene/overlay/piece-label.tsx',
    (
        r"""export type MapPieceKind = 'device' | 'firewall' | 'edge' | 'actor';""",
        r"""export type MapPieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 472 passed (472)` en 40 archivos; `git diff` sin salida; `npm run check` PASS. En Playwright pasa `labels and stamps do not overlap, and the open card does not cover its Security Group`: la etiqueta «internet» del 04-01 no pisa la del Internet gateway (el globo está 3.6 unidades a la izquierda del borde).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(scene): lay out an office and draw the internet between the edge and its actors"
```

---

### Task 6: Estados de las piezas: seleccionado, alerta y bloqueó algo

`game/view` da a cada pieza su estado, leído de los recorridos: un dispositivo está `intruded` mientras un flujo prohibido lo alcanza (lo de `intrudedDeviceIds`, que deja de viajar aparte) y un firewall está `blocking` mientras los firewalls de su dispositivo frenan un flujo. La etiqueta de un dispositivo atacado lleva el «!» adentro, con su texto para el lector de pantalla (cierra E6). El dispositivo tiembla o, quieto, muestra un borde doble; seleccionado, se apoya en una alfombra de papel sombreado. La barra del firewall es de papel en reposo y bermellón mientras frena algo.

**Files:**
- Modify: `src/game/flow-runs.ts`, `src/game/index.ts`, `src/game/view/pieces.ts`, `src/copy/incident-ui.ts`, `src/scene/overlay/piece-label.tsx`, `src/scene/game-scene.tsx`, `src/scene/entities/device.tsx`, `src/scene/entities/firewall.tsx`, `src/ui/incident/incident-screen.tsx`, `src/styles.css`, `src/game/view/CLAUDE.md`, `src/scene/overlay/CLAUDE.md`
- Test: `src/game/view/pieces.test.ts`, `src/scene/overlay/piece-label.test.tsx`, `tests/e2e/incidents.spec.ts`

**Interfaces:**
- Consumes: `intrudedDeviceIds` (Tarea 2), `FlowRun.trace`.
- Produces:
  - `blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string>` en `src/game/flow-runs.ts`; `@/game` deja de exportar `intrudedDeviceIds`.
  - `PieceState = 'normal' | 'intruded' | 'blocking'`; `PieceView.state` y `MapPiece.state`.
  - `MAP_TEXT.alert = 'con alerta: entra algo prohibido'`.
  - `DevicePiece({ position, variant, selected, intruded, still })`, `FirewallPiece({ position, variant, selected, blocking, still })`.
  - `GameSceneProps` pierde `intrudedDeviceIds`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 5**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 472 passed (472)`.

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
    'src/game/view/pieces.test.ts',
    (
        r"""import { startSession, type Session } from '@/game/session';""",
        r"""import { sessionReducer, startSession, type Session } from '@/game/session';""",
    ),
    (
        r"""
  it('shows no router and no internet while nobody is outside the office', () => {""",
        r"""
  it('marks the Security Group that stops a packet as blocking, and the instance a forbidden flow reaches as intruded', () => {
    const states = (session: Session) => pieceViews(session).map(({ id, state }) => [id, state]);
    expect(states(first)).toContainEqual([PIECE_ID.firewall(SG.servidor2), 'blocking']);
    expect(states(first)).toContainEqual([PIECE_ID.firewall(SG.servidor1), 'normal']);
    expect(states(first)).toContainEqual([PIECE_ID.device(S2.id), 'normal']);
    const wide = sessionReducer(first, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(states(wide)).toContainEqual([PIECE_ID.device(S2.id), 'intruded']);
    expect(states(wide)).toContainEqual([PIECE_ID.firewall(SG.servidor2), 'normal']);
  });

  it('shows no router and no internet while nobody is outside the office', () => {""",
    ),
)

edit(
    'src/scene/overlay/piece-label.test.tsx',
    (
        r"""const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };""",
        r"""const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: 'servidor2', locked: true, state: 'normal' };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false, state: 'normal' };""",
    ),
    (
        r"""
  it('has a DOM id so the focus can come back to it', () => {""",
        r"""
  it('a device under attack carries its alert inside its label, read as text, so it never covers the label', () => {
    renderLabel({ ...SERVER, state: 'intruded' });
    const label = screen.getByRole('button', { name: 'servidor2 con candado con alerta: entra algo prohibido' });
    expect(label).toContainElement(screen.getByText('!'));
  });

  it('a firewall that stops a packet shows no alert in its label', () => {
    renderLabel({ ...SG_PIECE, state: 'blocking' });
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).not.toHaveTextContent('!');
  });

  it('has a DOM id so the focus can come back to it', () => {""",
    ),
)

edit(
    'tests/e2e/incidents.spec.ts',
    (
        r"""const INSPECTED_SERVER = 'servidor2 con candado';""",
        r"""const INSPECTED_SERVER = 'servidor2 con candado';
const ATTACKED_SERVER = 'servidor2 con candado con alerta: entra algo prohibido';""",
    ),
    (
        r"""  });""",
        r"""  });

  test('an intrusion shows its alert inside the label of the device, and no label or stamp overlaps', async ({ page }) => {
    await page.goto('/#/level/04-01');
    const card = await openDoor(page);
    await placeRule(card, ANYWHERE);
    await card.getByRole('button', { name: 'Listo' }).click();
    await expect(page.getByRole('button', { name: ATTACKED_SERVER, exact: true })).toBeVisible();
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
  });""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/game/view/pieces.test.ts src/scene/overlay/piece-label.test.tsx
```

Expected: FAIL, `Test Files 2 failed (2)` y `Tests 2 failed | 10 passed (12)`: las piezas no tienen `state`, y la etiqueta no tiene el nombre `servidor2 con candado con alerta: entra algo prohibido`.

- [ ] **Step 4: Implementar**

Contenido completo de `src/game/view/pieces.ts`:

```ts
import { MAP_TEXT, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';
export type PieceState = 'normal' | 'intruded' | 'blocking';

type PieceEntity = Extract<EntityRef, { kind: PieceKind }>;

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
  state: PieceState;
}

export type PieceView = PieceEntity & PieceFacts & { term: TermId | null };

export const EDGE_ANCHOR = 'edge';
export const INTERNET_ANCHOR = 'internet';

function piece(entity: PieceEntity, facts: PieceFacts): PieceView {
  return { ...entity, ...facts, term: entityTerm(entity) };
}

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  const blocking = blockingDeviceIds(session.runs);
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);
    const state: PieceState = blocking.has(owner.id) ? 'blocking' : 'normal';
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable, state };
    return [piece({ kind: 'firewall', variant: firewall.kind }, facts)];
  });
}

function outside(session: Session): PieceView[] {
  const { world } = session;
  if (world.actors.length === 0) return [];
  return [
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false, state: 'normal' }),
    piece({ kind: 'internet', variant: 'internet' }, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false, state: 'normal' }),
  ];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state; the edge and the internet show only when someone is outside the network. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  const intruded = intrudedDeviceIds(session.runs);
  return [
    ...world.devices.map((device) =>
      piece(
        { kind: 'device', variant: device.kind },
        { id: PIECE_ID.device(device.id), anchorId: device.id, label: device.name, locked: !parts.hostSettings, configurable: false, state: intruded.has(device.id) ? 'intruded' : 'normal' },
      ),
    ),
    ...firewalls(session),
    ...world.actors.map((actor) =>
      piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false, state: 'normal' }),
    ),
    ...outside(session),
  ];
}
```

Contenido completo de `src/scene/entities/device.tsx`:

```tsx
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { Device } from '@/engine';
import { boxEdgePoints } from '@/scene/edges';
import { InkBox } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const DOUBLE_BORDER_GAP = 0.16;
const MAT: Vec3 = [2.1, 0.04, 1.8];

type Spot = { x: number; z: number };

function Server({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Laptop({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.12, 1]} position={[x, 0.06, z]} />
      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Printer({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.6, 1]} position={[x, 0.3, z]} />
      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

const DEVICE_SHAPE: Record<Device['kind'], (spot: Spot) => ReactNode> = { laptop: Laptop, printer: Printer, 'ec2-instance': Server };
const DEVICE_BOX: Record<Device['kind'], { size: Vec3; y: number }> = {
  laptop: { size: [1.4, 1.02, 1], y: 0.51 },
  printer: { size: [1.4, 1.11, 1.4], y: 0.555 },
  'ec2-instance': { size: [1.7, 1.22, 1.3], y: 0.61 },
};

function DoubleBorder({ x, z, variant }: Spot & { variant: Device['kind'] }) {
  const { size, y } = DEVICE_BOX[variant];
  const [w, h, d] = size.map((side) => side + DOUBLE_BORDER_GAP);
  return (
    <group position={[x, y, z]}>
      <Line points={boxEdgePoints(w, h, d)} segments color={INK} lineWidth={1.5} />
    </group>
  );
}

/** A device of the network, drawn by its variant: on a paper mat while selected; shaking while something forbidden gets in, or with a double border without animations. */
export function DevicePiece({ position, variant, selected, intruded, still }: { position: Vec2; variant: Device['kind']; selected: boolean; intruded: boolean; still: boolean }) {
  const group = useRef<Group>(null);
  const [x, z] = position;
  const Shape = DEVICE_SHAPE[variant];
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={1} />}
      <Shape x={x} z={z} />
      {intruded && still && <DoubleBorder x={x} z={z} variant={variant} />}
    </group>
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
        r"""  locked: 'con candado',""",
        r"""  locked: 'con candado',
  alert: 'con alerta: entra algo prohibido',""",
    ),
)

edit(
    'src/game/flow-runs.ts',
    (
        r"""  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}""",
        r"""  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => run.trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop').map((step) => step.at)));
}""",
    ),
)

edit(
    'src/game/index.ts',
    (
        r"""export { intrudedDeviceIds } from './flow-runs';
""",
        r"""""",
    ),
)

edit(
    'src/game/view/CLAUDE.md',
    (
        r"""- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.""",
        r"""- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.
- Every piece has a state, read from the runs: a device is `intruded` while a forbidden flow reaches it, a firewall is `blocking` while its device's firewalls stop a flow, and every other piece is `normal`.""",
    ),
)

edit(
    'src/scene/entities/firewall.tsx',
    (
        r"""import { ACCENT, INK } from '@/scene/theme';""",
        r"""import { ACCENT, INK, PAPER_SHADE } from '@/scene/theme';""",
    ),
    (
        r"""/** A firewall standing in front of its device, a bar between two posts: a thin bar for a Security Group, a brick wall for the firewall of a laptop. Its bar pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, variant, selected, still }: { position: Vec2; variant: FirewallKind; selected: boolean; still: boolean }) {""",
        r"""/** A firewall standing in front of its device, a bar between two posts: a thin bar for a Security Group, a brick wall for the firewall of a laptop. The bar turns vermilion while it stops a packet; it pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, variant, selected, blocking, still }: { position: Vec2; variant: FirewallKind; selected: boolean; blocking: boolean; still: boolean }) {""",
    ),
    (
        r"""        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />""",
        r"""        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={blocking ? ACCENT : PAPER_SHADE} lineWidth={1} />""",
    ),
)

edit(
    'src/scene/game-scene.tsx',
    (
        r"""  intrudedDeviceIds: ReadonlySet<string>;
""",
        r"""""",
    ),
    (
        r"""function PieceShape({ piece, layout, intruded, selected, still }: { piece: MapPiece; layout: Layout; intruded: boolean; selected: boolean; still: boolean }) {""",
        r"""function PieceShape({ piece, layout, selected, still }: { piece: MapPiece; layout: Layout; selected: boolean; still: boolean }) {""",
    ),
    (
        r"""      return <DevicePiece position={position} variant={piece.variant} intruded={intruded} still={still} />;
    case 'firewall':
      return <FirewallPiece position={position} variant={piece.variant} selected={selected} still={still} />;""",
        r"""      return <DevicePiece position={position} variant={piece.variant} selected={selected} intruded={piece.state === 'intruded'} still={still} />;
    case 'firewall':
      return <FirewallPiece position={position} variant={piece.variant} selected={selected} blocking={piece.state === 'blocking'} still={still} />;""",
    ),
    (
        r"""export function GameScene({ world, pieces, flows, intrudedDeviceIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
        r"""export function GameScene({ world, pieces, flows, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {""",
    ),
    (
        r"""            <PieceShape key={piece.id} piece={piece} layout={layout} intruded={intrudedDeviceIds.has(piece.anchorId)} selected={piece.id === activePieceId} still={still} />""",
        r"""            <PieceShape key={piece.id} piece={piece} layout={layout} selected={piece.id === activePieceId} still={still} />""",
    ),
)

edit(
    'src/scene/overlay/CLAUDE.md',
    (
        r"""- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed.""",
        r"""- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed. It shows the lock of a fixed piece and the alert «!» of a device under attack, both also read as text, so neither can cover another label.""",
    ),
)

edit(
    'src/scene/overlay/piece-label.tsx',
    (
        r"""  locked: boolean;""",
        r"""  locked: boolean;
  state: 'normal' | 'intruded' | 'blocking';""",
    ),
    (
        r"""    >""",
        r"""    >
      {piece.state === 'intruded' && (
        <>
          <span className="map-button__alert" aria-hidden="true">
            !
          </span>{' '}
        </>
      )}""",
    ),
    (
        r"""      )}
    </button>""",
        r"""      )}
      {piece.state === 'intruded' && (
        <>
          {' '}
          <span className="sr-only">{MAP_TEXT.alert}</span>
        </>
      )}
    </button>""",
    ),
)

edit(
    'src/styles.css',
    (
        r""".map-button--locked { border-style: dashed; color: var(--ink-soft); }""",
        r""".map-button--locked { border-style: dashed; color: var(--ink-soft); }
.map-button__alert { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: 50%; font: 700 11px var(--font-body); color: var(--paper-fill); background: var(--accent); vertical-align: 1px; }""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { countStars, firewallCard, inspect, intrudedDeviceIds, pieceViews, sessionReducer, startSession, starsOf } from '@/game';""",
        r"""import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf } from '@/game';""",
    ),
    (
        r"""          intrudedDeviceIds={intrudedDeviceIds(session.runs)}
""",
        r"""""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 475 passed (475)` en 40 archivos; `git diff` sin salida; `npm run check` PASS con 11 tests de Playwright, entre ellos `Sin animaciones › an intrusion shows its alert inside the label of the device, and no label or stamp overlaps`.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(scene): show each piece's state: alert in the label, a blocking firewall in vermilion"
```

---

### Task 7: Echo Request, Echo Reply y «perdido»

El paquete se dibuja por su mensaje: un Echo Request es un punto lleno, un Echo Reply un anillo, y un intruso un rombo bermellón, lleno o hueco. Las figuras son planas y miran a la cámara (`Billboard`), como sus íconos. Un ping que vuelve regresa como Echo Reply, así que en el 01-02 se ve que lo que volvió es otro mensaje. Llega «perdido»: el recorrido trae `lost` (resultado `lost` del motor), el paquete se encoge hasta desaparecer y deja un sello «?» de borde punteado, distinto del ✕ de un bloqueo. `flow-look.ts` convierte el resultado de cada flujo en cómo se ven su paquete y su sello; las piezas no deciden nada. Sin animaciones, el trazo muestra la figura a mitad de camino y, si volvió, un Echo Reply cerca del origen.

**Files:**
- Create: `src/scene/traffic/flow-look.ts`
- Modify: `src/copy/terms.ts`, `src/copy/index.ts`, `src/copy/packet-labels.ts`, `src/game/flow-runs.ts`, `src/game/view/inspection.ts`, `src/scene/entities/packet.tsx` (reescribir), `src/scene/entities/stamp.tsx`, `src/scene/entities/index.ts`, `src/scene/traffic/traffic.tsx`, `src/scene/traffic/flow-traffic.tsx`, `src/scene/traffic/use-packet-runs.ts`, `src/scene/traffic/schedule.ts`, `src/styles.css`, `src/scene/entities/CLAUDE.md`, `src/scene/traffic/CLAUDE.md`
- Test: `src/scene/traffic/flow-look.test.ts` (nuevo), `src/copy/packet-labels.test.ts`, `src/scene/traffic/schedule.test.ts`

**Interfaces:**
- Consumes: `FlowRun` (`reached`, `replied`), `Trace.outcome`, `roundTrip` y `pathLength` de `@/scene/layout`.
- Produces:
  - `@/copy`: `PacketMessage = 'echo-request' | 'echo-reply'`, `EntityVariants.packet`, `ENTITY_TERMS.packet`, `packetMessage(packet): PacketMessage`.
  - `FlowRun.lost: boolean`; `MapFlow extends FlowResult { id, pieceId, trace, label }` con `FlowResult { kind, packet, reached, replied, lost }`.
  - `flowLook(flow: FlowResult): FlowLook` con `FlowLook { message, intruder, end, stamp }`.
  - `@/scene/entities`: `PacketEnd = 'replied' | 'arrived' | 'blocked' | 'lost'`, `PacketLook { path, message, intruder, end }`, `PacketRun(look)`, `PacketTrace(look)`, `PacketGlyph({ message, intruder })`, `travelPath(path, end)`; `StampState` suma `'lost'`.
  - `runSeconds({ path, end })` y `usePacketRuns(look, flowIndex)`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 6**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 475 passed (475)`.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/scene/traffic/flow-look.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { PacketSpec } from '@/engine';
import { flowLook, type FlowResult } from './flow-look';

const PING: PacketSpec = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 };
const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const flow = (result: Partial<FlowResult>): FlowResult => ({ kind: 'required', packet: PING, reached: false, replied: false, lost: false, ...result });

describe('flowLook', () => {
  it('an answered ping comes back and leaves ✓', () => {
    expect(flowLook(flow({ reached: true, replied: true }))).toEqual({ message: 'echo-request', intruder: false, end: 'replied', stamp: 'arrived' });
  });

  it('an Echo Reply that arrives stops there, drawn as a reply', () => {
    expect(flowLook(flow({ packet: ECHO_REPLY, reached: true }))).toEqual({ message: 'echo-reply', intruder: false, end: 'arrived', stamp: 'arrived' });
  });

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

  it('a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion', () => {
    expect(flowLook(flow({ kind: 'forbidden', lost: true }))).toEqual({ message: 'echo-request', intruder: true, end: 'lost', stamp: 'lost' });
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
    'src/copy/packet-labels.test.ts',
    (
        r"""import { endpointName, packetLabel, serviceLabel } from './packet-labels';""",
        r"""import { endpointName, packetLabel, packetMessage, serviceLabel } from './packet-labels';""",
    ),
    (
        r"""
  it('tag Echo Reply and leave TCP plain', () => {""",
        r"""
  it('draw an Echo Reply as a reply, and an Echo Request or any other packet as a request', () => {
    expect(packetMessage({ protocol: 'icmp', icmpType: 0 })).toBe('echo-reply');
    expect(packetMessage({ protocol: 'icmp', icmpType: 8 })).toBe('echo-request');
    expect(packetMessage({ protocol: 'tcp' })).toBe('echo-request');
  });

  it('tag Echo Reply and leave TCP plain', () => {""",
    ),
)

edit(
    'src/scene/traffic/schedule.test.ts',
    (
        r"""import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';""",
        r"""import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';
import type { Vec2 } from '@/scene/layout';""",
    ),
    (
        r"""  it('a packet stays its travel time plus its end', () => {
    expect(runSeconds([[0, 0], [PACKET_SPEED, 0]])).toBeCloseTo(1 + PACKET_END_S);""",
        r"""  it('a packet stays its travel time plus its end, and its travel back too when it is answered', () => {
    const path: Vec2[] = [[0, 0], [PACKET_SPEED, 0]];
    expect(runSeconds({ path, end: 'blocked' })).toBeCloseTo(1 + PACKET_END_S);
    expect(runSeconds({ path, end: 'replied' })).toBeCloseTo(2 + PACKET_END_S);""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/scene/traffic/flow-look.test.ts src/copy/packet-labels.test.ts src/scene/traffic/schedule.test.ts
```

Expected: FAIL, `Test Files 3 failed (3)`: `Cannot find module './flow-look'`, `packetMessage is not a function` y `expected 0.5 to be close to 1.5` (el horario todavía no sabe del regreso).

- [ ] **Step 4: Implementar**

Contenido completo de `src/scene/entities/packet.tsx`:

```tsx
import { Billboard, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { PacketMessage } from '@/copy';
import { cumulativeLengths, pathLength, pointAt, roundTrip, type Vec2, type Vec3 } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';

export type PacketEnd = 'replied' | 'arrived' | 'blocked' | 'lost';

export interface PacketLook {
  path: Vec2[];
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
}

export const PACKET_SPEED = 3.2;
export const PACKET_END_S = 0.5;
const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const RHOMBUS_RADIUS = 0.26;
const HOLLOW = 0.55;
const ROUND_SEGMENTS = 24;
const RHOMBUS_SEGMENTS = 4;
const BURST_GROWTH = 3;
const BURST_RING: [number, number, number] = [0.22, 0.3, 24];
const TRACE_LINE_WIDTH = 2.5;
const DASH = { dashSize: 0.18, gapSize: 0.14 } as const;
const REPLY_MARK_DISTANCE = 0.6;

/** Returns the points a packet travels: its path, and the same path back when it is answered. */
export function travelPath(path: Vec2[], end: PacketEnd): Vec2[] {
  return end === 'replied' ? roundTrip(path) : path;
}

/** The flat shape of a packet, facing the camera: a filled dot for an Echo Request and a ring for an Echo Reply, in ink; a rhombus in vermilion, filled or hollow, for an intruder. */
export function PacketGlyph({ message, intruder }: { message: PacketMessage; intruder: boolean }) {
  const radius = intruder ? RHOMBUS_RADIUS : DOT_RADIUS;
  const segments = intruder ? RHOMBUS_SEGMENTS : ROUND_SEGMENTS;
  return (
    <Billboard>
      <mesh>
        {message === 'echo-request' ? <circleGeometry args={[radius, segments]} /> : <ringGeometry args={[radius * HOLLOW, radius, segments]} />}
        <meshBasicMaterial color={intruder ? ACCENT : INK} />
      </mesh>
    </Billboard>
  );
}

/** One packet travelling its path. An answered one comes back as an Echo Reply; at the end a blocked one bursts and a lost one shrinks away. */
export function PacketRun({ path, message, intruder, end }: PacketLook) {
  const route = useMemo(() => travelPath(path, end), [path, end]);
  const lengths = useMemo(() => cumulativeLengths(route), [route]);
  const total = lengths.at(-1) ?? 0;
  const turn = end === 'replied' ? pathLength(path) : total;
  const going = useRef<Group>(null);
  const back = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const travelled = useRef(0);
  useFrame((_, delta) => {
    travelled.current += delta * PACKET_SPEED;
    const over = travelled.current - total;
    const fading = end === 'lost' && over > 0 && over < PACKET_END_S;
    const [x, z] = pointAt(route, lengths, travelled.current);
    for (const [glyph, shown] of [
      [going.current, travelled.current <= turn],
      [back.current, travelled.current > turn],
    ] as const) {
      if (!glyph) continue;
      glyph.position.set(x, PACKET_Y, z);
      glyph.visible = shown && (over <= 0 || fading);
      glyph.scale.setScalar(fading ? 1 - over / PACKET_END_S : 1);
    }
    if (burst.current) {
      burst.current.visible = end === 'blocked' && over > 0;
      burst.current.scale.setScalar(1 + Math.max(over, 0) * BURST_GROWTH);
    }
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = route[route.length - 1];
  return (
    <>
      <group ref={going} position={[startX, PACKET_Y, startZ]}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
      <group ref={back} position={[startX, PACKET_Y, startZ]} visible={false}>
        <PacketGlyph message="echo-reply" intruder={intruder} />
      </group>
      <group ref={burst} position={[endX, PACKET_Y, endZ]} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={BURST_RING} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      </group>
    </>
  );
}

function markAt(path: Vec2[], distance: number): Vec3 {
  const [x, z] = pointAt(path, cumulativeLengths(path), distance);
  return [x, PACKET_Y, z];
}

/** A packet's path drawn without movement: a line in ink, vermilion when it is blocked and dashed when it is lost, with the packet's shape halfway and, when it was answered, an Echo Reply back near its start. */
export function PacketTrace({ path, message, intruder, end }: PacketLook) {
  const length = pathLength(path);
  return (
    <>
      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? ACCENT : INK} lineWidth={TRACE_LINE_WIDTH} dashed={end === 'lost'} {...DASH} />
      <group position={markAt(path, length / 2)}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
      {end === 'replied' && (
        <group position={markAt(path, Math.min(REPLY_MARK_DISTANCE, length / 4))}>
          <PacketGlyph message="echo-reply" intruder={intruder} />
        </group>
      )}
    </>
  );
}
```

Contenido completo de `src/scene/traffic/flow-look.ts`:

```ts
import { packetMessage, type PacketMessage } from '@/copy';
import type { PacketSpec } from '@/engine';
import type { FlowKind } from '@/levels';
import type { PacketEnd, StampState } from '@/scene/entities';

export interface FlowResult {
  kind: FlowKind;
  packet: PacketSpec;
  reached: boolean;
  replied: boolean;
  lost: boolean;
}

export interface FlowLook {
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
  stamp: StampState;
}

function packetEnd(flow: FlowResult): PacketEnd {
  if (flow.replied) return 'replied';
  if (flow.lost) return 'lost';
  return flow.reached ? 'arrived' : 'blocked';
}

function stampState(flow: FlowResult, intruder: boolean): StampState {
  if (flow.lost) return 'lost';
  if (!flow.reached) return 'blocked';
  return intruder ? 'intruder' : 'arrived';
}

/** Turns a flow's computed result into the look of its packet and its stamp: the message it carries, whether it is an intruder, how its run ends and which stamp it leaves. */
export function flowLook(flow: FlowResult): FlowLook {
  const intruder = flow.kind === 'forbidden';
  return { message: packetMessage(flow.packet), intruder, end: packetEnd(flow), stamp: stampState(flow, intruder) };
}
```

Contenido completo de `src/scene/traffic/flow-traffic.tsx`:

```tsx
import { PacketRun, type PacketLook } from '@/scene/entities';
import { usePacketRuns } from './use-packet-runs';

export function FlowTraffic({ look, index }: { look: PacketLook; index: number }) {
  const runs = usePacketRuns(look, index);
  return (
    <>
      {runs.map((run) => (
        <PacketRun key={run.key} path={run.path} message={run.message} intruder={run.intruder} end={run.end} />
      ))}
    </>
  );
}
```

Contenido completo de `src/scene/traffic/traffic.tsx`:

```tsx
import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { flowLook, type FlowResult } from './flow-look';
import { FlowTraffic } from './flow-traffic';

export interface MapFlow extends FlowResult {
  id: string;
  pieceId: string;
  trace: Trace;
  label: TermText;
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const paths = flows.map((flow) => pathFor(flow.trace, flow.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {flows.map((flow, index) => {
        const { stamp, ...look } = flowLook(flow);
        return (
          <group key={flow.id}>
            {still ? <PacketTrace path={paths[index]} {...look} /> : <FlowTraffic look={{ path: paths[index], ...look }} index={index} />}
            <StampPiece position={stamps[index]} state={stamp} name={MAP_TEXT.packet(toPlainText(flow.label))} pieceId={flow.pieceId} onInspect={onInspect} />
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
    'src/copy/index.ts',
    (
        r"""export type { EntityKind, EntityRef, EntityVariants, TermId } from './terms';""",
        r"""export type { EntityKind, EntityRef, EntityVariants, PacketMessage, TermId } from './terms';""",
    ),
    (
        r"""export { OUTCOME_TEXT, endpointName, packetLabel } from './packet-labels';""",
        r"""export { OUTCOME_TEXT, endpointName, packetLabel, packetMessage } from './packet-labels';""",
    ),
)

edit(
    'src/copy/packet-labels.ts',
    (
        r"""import type { TermText } from './term-text';""",
        r"""import type { TermText } from './term-text';
import type { PacketMessage } from './terms';""",
    ),
    (
        r"""
/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to. */""",
        r"""
/** Returns the message a packet is drawn as: an Echo Reply answers, and every other packet (an Echo Request, or TCP and UDP, which no flow sends yet) asks. */
export function packetMessage(packet: Pick<PacketSpec, 'protocol' | 'icmpType'>): PacketMessage {
  return packet.protocol === 'icmp' && packet.icmpType === 0 ? 'echo-reply' : 'echo-request';
}

/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to. */""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""
export interface EntityVariants {""",
        r"""
export type PacketMessage = 'echo-request' | 'echo-reply';

export interface EntityVariants {""",
    ),
    (
        r"""  actor: Actor['kind'];""",
        r"""  actor: Actor['kind'];
  packet: PacketMessage;""",
    ),
    (
        r"""  actor: { you: null, attacker: null },""",
        r"""  actor: { you: null, attacker: null },
  packet: { 'echo-request': 'echo-request', 'echo-reply': 'echo-reply' },""",
    ),
)

edit(
    'src/game/flow-runs.ts',
    (
        r"""  reached: boolean;""",
        r"""  reached: boolean;
  lost: boolean;""",
    ),
    (
        r"""      reached: reachesHost(trace),""",
        r"""      reached: reachesHost(trace),
      lost: trace.outcome === 'lost',""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';""",
        r"""import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, packetMessage, type EntityRef, type TermId, type TermText } from '@/copy';""",
    ),
    (
        r"""const ICMP_MESSAGE_TERM = { 8: 'echo-request', 0: 'echo-reply' } as const satisfies Record<NonNullable<PacketSpec['icmpType']>, TermId>;
""",
        r"""""",
    ),
    (
        r"""  return packet.protocol === 'icmp' && packet.icmpType !== undefined ? ICMP_MESSAGE_TERM[packet.icmpType] : null;""",
        r"""  return packet.protocol === 'icmp' ? entityTerm({ kind: 'packet', variant: packetMessage(packet) }) : null;""",
    ),
)

edit(
    'src/scene/entities/CLAUDE.md',
    (
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.""",
        r"""- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.
- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?.""",
    ),
)

edit(
    'src/scene/entities/index.ts',
    (
        r"""export { PACKET_END_S, PACKET_SPEED, PacketRun, PacketTrace } from './packet';""",
        r"""export { PACKET_END_S, PACKET_SPEED, PacketGlyph, PacketRun, PacketTrace, travelPath } from './packet';
export type { PacketEnd, PacketLook } from './packet';""",
    ),
)

edit(
    'src/scene/entities/stamp.tsx',
    (
        r"""export type StampState = 'arrived' | 'blocked' | 'intruder';""",
        r"""export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder';""",
    ),
    (
        r"""const STAMP_GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', intruder: '✓' };

/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when it is blocked, a double ring for an intruder; hovering or focusing it inspects the packet. */""",
        r"""const STAMP_GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', lost: '?', intruder: '✓' };

/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when a firewall blocks it, ? when it is lost, and a double ring for an intruder that gets in; hovering or focusing it inspects the packet. */""",
    ),
)

edit(
    'src/scene/traffic/CLAUDE.md',
    (
        r"""- The clock lives in `use-packet-runs.ts`; `traffic.tsx` turns each flow's result (`reached`, `replied`) into the look of its packet and its stamp, and never decides whether a packet gets in.""",
        r"""- The clock lives in `use-packet-runs.ts`. `flow-look.ts` turns each flow's result (`reached`, `replied`, `lost`) into the look of its packet (its message, whether it is an intruder, how its run ends) and the state of its stamp; nothing here decides whether a packet gets in.""",
    ),
)

edit(
    'src/scene/traffic/schedule.ts',
    (
        r"""import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';
import { pathLength, type Vec2 } from '@/scene/layout';""",
        r"""import { PACKET_END_S, PACKET_SPEED, travelPath, type PacketLook } from '@/scene/entities';
import { pathLength } from '@/scene/layout';""",
    ),
    (
        r"""/** Seconds a packet stays on the map: its travel along the path plus its end (a burst or a fade). */
export function runSeconds(path: Vec2[]): number {
  return pathLength(path) / PACKET_SPEED + PACKET_END_S;""",
        r"""/** Seconds a packet stays on the map: its travel along its path, and back when it is answered, plus its end (a burst or a fade). */
export function runSeconds({ path, end }: Pick<PacketLook, 'path' | 'end'>): number {
  return pathLength(travelPath(path, end)) / PACKET_SPEED + PACKET_END_S;""",
    ),
)

edit(
    'src/scene/traffic/use-packet-runs.ts',
    (
        r"""import type { Vec2 } from '@/scene/layout';
import { runSeconds, sendsBetween } from './schedule';

export interface Trip {
  path: Vec2[];
  blocked: boolean;
}

interface Run extends Trip {""",
        r"""import type { PacketLook } from '@/scene/entities';
import { runSeconds, sendsBetween } from './schedule';

interface Run extends PacketLook {""",
    ),
    (
        r"""/** Sends a packet along the latest trip once per period and forgets it when it finishes; packets already travelling keep the trip they started with. */
export function usePacketRuns(trip: Trip, flowIndex: number): Run[] {""",
        r"""/** Sends a packet with the latest look once per period and forgets it when it finishes; packets already travelling keep the look they started with. */
export function usePacketRuns(look: PacketLook, flowIndex: number): Run[] {""",
    ),
    (
        r"""    const sent = sends ? [{ ...trip, key, endsAt: now + runSeconds(trip.path) }] : [];""",
        r"""    const sent = sends ? [{ ...look, key, endsAt: now + runSeconds(look) }] : [];""",
    ),
)

edit(
    'src/styles.css',
    (
        r""".stamp--intruder { color: var(--accent); border-style: double; border-width: 4px; }""",
        r""".stamp--intruder { color: var(--accent); border-style: double; border-width: 4px; }
.stamp--lost { color: var(--ink-soft); border-style: dashed; }""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 482 passed (482)` en 41 archivos; `git diff` sin salida; `npm run check` PASS (Playwright: 11 passed).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(scene): tell Echo Request from Echo Reply by shape and draw a lost packet"
```

---

### Task 8: Íconos 2D en el glosario y en la caja de inspección

Cada archivo del catálogo exporta el ícono de su entidad: el frente de la pieza, 24×24, en `currentColor` y oculto al lector de pantalla (`InkIcon` en `src/scene/ink.tsx`). `EntityIcon` dibuja el de cualquier `EntityRef`. `TERM_ENTITY` dice qué entidad acompaña a cada término; el glosario de Lucía muestra el ícono junto al nombre, y los términos sin entidad (como mínimo privilegio) van sin ícono. La inspección dice qué entidad muestra (`Inspection.entity`) y la caja pone su ícono en la cabecera; el de un paquete intruso es el rombo.

**Files:**
- Create: `src/scene/entities/entity-icon.tsx`
- Modify: `src/scene/ink.tsx`, `src/scene/entities/network.tsx`, `src/scene/entities/device.tsx`, `src/scene/entities/firewall.tsx`, `src/scene/entities/edge.tsx`, `src/scene/entities/internet.tsx`, `src/scene/entities/actor.tsx`, `src/scene/entities/packet.tsx`, `src/scene/entities/stamp.tsx`, `src/scene/entities/index.ts`, `src/scene/index.ts`, `src/copy/terms.ts`, `src/copy/index.ts`, `src/game/view/inspection.ts`, `src/ui/incident/inspection-box.tsx`, `src/ui/incident/lucia-card.tsx`, `src/styles.css`, `src/copy/CLAUDE.md`, `src/scene/entities/CLAUDE.md`, `src/ui/incident/CLAUDE.md`
- Test: `src/scene/entities/entity-icon.test.tsx` (nuevo), `src/copy/terms.test.ts`, `src/game/view/inspection.test.ts`, `src/ui/incident/lucia-card.test.tsx`, `src/ui/incident/incident-screen.test.tsx`

**Interfaces:**
- Consumes: `EntityRef`, `ENTITY_TERMS`, `entityTerm` (Tareas 4, 5 y 7); `StampState` (Tarea 7).
- Produces:
  - `InkIcon({ children })` en `@/scene/ink`.
  - `NetworkIcon({ variant })`, `DeviceIcon({ variant })`, `FirewallIcon({ variant })`, `EdgeIcon({ variant })`, `InternetIcon()`, `ActorIcon({ variant })`, `PacketIcon({ message, intruder })`, `StampIcon({ state })`, `EntityIcon({ entity })`, por `@/scene/entities`; `@/scene` exporta `EntityIcon` y `StampIcon`.
  - `EntityRef` de un paquete: `{ kind: 'packet'; variant; intruder?: boolean }`.
  - `TERM_ENTITY: Partial<Record<TermId, EntityRef>>` en `@/copy`.
  - `Inspection.entity: EntityRef`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 7**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 482 passed (482)` en 41 archivos.

- [ ] **Step 2: Escribir los tests**

Contenido completo de `src/scene/entities/entity-icon.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, type EntityKind, type EntityRef } from '@/copy';
import { EntityIcon } from './entity-icon';
import { StampIcon, type StampState } from './stamp';

const STAMP_STATES: StampState[] = ['arrived', 'blocked', 'lost', 'intruder'];

function variantsOf(kind: EntityKind): EntityRef[] {
  return Object.keys(ENTITY_TERMS[kind]).flatMap((variant) =>
    kind === 'packet' ? [false, true].map((intruder) => ({ kind, variant, intruder }) as EntityRef) : [{ kind, variant } as EntityRef],
  );
}

function drawn(icon: ReactElement): SVGElement {
  const svg = render(icon).container.querySelector('svg');
  if (!svg) throw new Error('no icon drawn');
  return svg;
}

describe.each(Object.keys(ENTITY_TERMS) as EntityKind[])('the %s icon', (kind) => {
  const variants = variantsOf(kind);

  it('is drawn in the colour of the text around it and hidden from screen readers', () => {
    for (const entity of variants) {
      const svg = drawn(<EntityIcon entity={entity} />);
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('tells every variant apart by its shape', () => {
    const shapes = new Set(variants.map((entity) => drawn(<EntityIcon entity={entity} />).innerHTML));
    expect(shapes.size).toBe(variants.length);
  });
});

describe('the stamp icon', () => {
  it('tells every state apart by its shape, not only by colour', () => {
    expect(new Set(STAMP_STATES.map((state) => drawn(<StampIcon state={state} />).innerHTML)).size).toBe(STAMP_STATES.length);
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
    'src/copy/terms.test.ts',
    (
        r"""import { TERMS, entityTerm, isTermId, type Term, type TermId } from './terms';""",
        r"""import { ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId, type EntityRef, type Term, type TermId } from './terms';""",
    ),
    (
        r"""    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
  });
});""",
        r"""    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
  });
});

describe('term icons', () => {
  it('every term that names a variant shows that variant\'s entity as its icon', () => {
    const named = Object.entries(ENTITY_TERMS).flatMap(([kind, variants]) =>
      Object.entries(variants).flatMap(([variant, term]) => (term === null ? [] : [{ term, kind, variant }])),
    );
    for (const { term, kind, variant } of named) expect(TERM_ENTITY[term as TermId], term).toMatchObject({ kind, variant });
  });

  it('every icon belongs to the term that names its entity', () => {
    for (const [term, entity] of Object.entries(TERM_ENTITY)) expect(entityTerm(entity as EntityRef)).toBe(term);
  });

  it('a term with no entity, like least-privilege, has no icon', () => {
    expect(TERM_ENTITY['least-privilege']).toBeUndefined();
  });
});""",
    ),
)

edit(
    'src/game/view/inspection.test.ts',
    (
        r"""
  it('an id that names nothing shows nothing', () => {""",
        r"""
  it('says which entity it shows, so the box can draw its icon: an intruder packet is told apart from a legitimate one', () => {
    expect(inspect(first, PIECE_ID.device(S2.id))?.entity).toEqual({ kind: 'device', variant: 'ec2-instance' });
    expect(inspect(office, PIECE_ID.edge)?.entity).toEqual({ kind: 'edge', variant: 'router' });
    expect(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id))?.entity).toEqual({ kind: 'packet', variant: 'echo-request', intruder: true });
    expect(inspect(first, PIECE_ID.packet(FLOWS.pingToServer2.id))?.entity).toEqual({ kind: 'packet', variant: 'echo-request', intruder: false });
  });

  it('an id that names nothing shows nothing', () => {""",
    ),
)

edit(
    'src/ui/incident/incident-screen.test.tsx',
    (
        r"""    const box = screen.getByRole('region', { name: 'servidor2' });""",
        r"""    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(within(box).getByRole('heading', { name: 'servidor2' }).querySelector('svg.entity-icon')).toBeInTheDocument();""",
    ),
)

edit(
    'src/ui/incident/lucia-card.test.tsx',
    (
        r"""function glossaryNames(): (string | null | undefined)[] {
  return [...glossary().querySelectorAll('dt')].map((dt) => dt.firstChild?.textContent);""",
        r"""function nameOf(dt: Element): string | null | undefined {
  return dt.querySelector('.glossary__name')?.textContent;
}

function glossaryNames(): (string | null | undefined)[] {
  return [...glossary().querySelectorAll('dt')].map(nameOf);
}

function termRow(name: string): HTMLElement {
  const row = [...glossary().querySelectorAll('dt')].find((dt) => nameOf(dt) === name);
  if (!(row instanceof HTMLElement)) throw new Error(`missing glossary row ${name}`);
  return row;""",
    ),
    (
        r"""    expect(marked.map((dt) => dt.firstChild?.textContent)).toEqual(namesOf(second.introduces));""",
        r"""    expect(marked.map(nameOf)).toEqual(namesOf(second.introduces));
  });

  it('shows the icon of the entity a term names, and none for a term with no entity', () => {
    render(<Harness incidentId="04-02" />);
    expect(termRow(TERMS['security-group'].name).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(termRow(TERMS['echo-reply'].name).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(termRow(TERMS['least-privilege'].name).querySelector('svg')).toBeNull();""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/scene/entities/entity-icon.test.tsx src/copy/terms.test.ts src/game/view/inspection.test.ts src/ui/incident/lucia-card.test.tsx src/ui/incident/incident-screen.test.tsx
```

Expected: FAIL, `Test Files 5 failed (5)` y `Tests 7 failed | 76 passed (83)`: falta `./entity-icon`, falta `TERM_ENTITY`, la inspección no tiene `entity`, el glosario no tiene `.glossary__name` ni íconos y la cabecera de la caja no tiene `svg.entity-icon`.

- [ ] **Step 4: Implementar**

Contenido completo de `src/scene/entities/actor.tsx`:

```tsx
import type { Actor } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL };

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={ACTOR_FILL[variant]} />;
}

/** The actor's icon: its cube, filled for the attacker and drawn in outline for you. */
export function ActorIcon({ variant }: { variant: Actor['kind'] }) {
  return (
    <InkIcon>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill={variant === 'attacker' ? 'currentColor' : 'none'} />
      {variant === 'you' && <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />}
    </InkIcon>
  );
}
```

Contenido completo de `src/scene/entities/entity-icon.tsx`:

```tsx
import type { EntityRef } from '@/copy';
import { ActorIcon } from './actor';
import { DeviceIcon } from './device';
import { EdgeIcon } from './edge';
import { FirewallIcon } from './firewall';
import { InternetIcon } from './internet';
import { NetworkIcon } from './network';
import { PacketIcon } from './packet';

/** Draws the icon of any entity in any variant. */
export function EntityIcon({ entity }: { entity: EntityRef }) {
  switch (entity.kind) {
    case 'network':
      return <NetworkIcon variant={entity.variant} />;
    case 'device':
      return <DeviceIcon variant={entity.variant} />;
    case 'firewall':
      return <FirewallIcon variant={entity.variant} />;
    case 'edge':
      return <EdgeIcon variant={entity.variant} />;
    case 'internet':
      return <InternetIcon />;
    case 'actor':
      return <ActorIcon variant={entity.variant} />;
    case 'packet':
      return <PacketIcon message={entity.variant} intruder={entity.intruder ?? false} />;
  }
}
```

Contenido completo de `src/scene/entities/index.ts`:

```ts
export { ActorIcon, ActorPiece } from './actor';
export { DeviceIcon, DevicePiece } from './device';
export { EdgeIcon, EdgePiece } from './edge';
export { EntityIcon } from './entity-icon';
export { FirewallIcon, FirewallPiece } from './firewall';
export { InternetIcon, InternetPiece } from './internet';
export { NetworkIcon, NetworkPiece } from './network';
export { PACKET_END_S, PACKET_SPEED, PacketGlyph, PacketIcon, PacketRun, PacketTrace, travelPath } from './packet';
export type { PacketEnd, PacketLook } from './packet';
export { StampIcon, StampPiece } from './stamp';
export type { StampState } from './stamp';
```

Contenido completo de `src/scene/entities/stamp.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import { InkIcon } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { inspectHandlers, type OnInspect } from '@/scene/overlay/inspect-handlers';

export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder';

const STAMP_Y = 0.9;
const STAMP_LAYERS: [number, number] = [15, 5];
const STAMP_GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', lost: '?', intruder: '✓' };

/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when a firewall blocks it, ? when it is lost, and a double ring for an intruder that gets in; hovering or focusing it inspects the packet. */
export function StampPiece({ position, state, name, pieceId, onInspect }: { position: Vec2; state: StampState; name: string; pieceId: string; onInspect: OnInspect }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${state}`} aria-label={name} {...inspectHandlers(pieceId, onInspect)}>
        <span aria-hidden="true">{STAMP_GLYPH[state]}</span>
      </button>
    </Html>
  );
}

const CHECK = 'M8 12.5l2.5 2.5L16 9.5';
const STAMP_ICON: Record<StampState, { mark: string; dashed: boolean; double: boolean }> = {
  arrived: { mark: CHECK, dashed: false, double: false },
  blocked: { mark: 'M9 9l6 6M15 9l-6 6', dashed: false, double: false },
  lost: { mark: 'M9.8 9.5a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.6v.6M12 17h.01', dashed: true, double: false },
  intruder: { mark: CHECK, dashed: false, double: true },
};

/** The stamp's icon: its ring and its mark, dashed when the packet is lost and doubled for an intruder. */
export function StampIcon({ state }: { state: StampState }) {
  const { mark, dashed, double } = STAMP_ICON[state];
  return (
    <InkIcon>
      <circle cx="12" cy="12" r="9" strokeDasharray={dashed ? '3 2.4' : undefined} />
      {double && <circle cx="12" cy="12" r="6.6" />}
      <path d={mark} />
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
    'src/copy/CLAUDE.md',
    (
        r"""- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1.""",
        r"""- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1. The other way round, a term that names an entity declares the entity whose icon goes with it in `TERM_ENTITY`; a term with no entity, like `least-privilege`, has no icon.""",
    ),
)

edit(
    'src/copy/index.ts',
    (
        r"""export { ENTITY_TERMS, TERMS, entityTerm, isTermId } from './terms';""",
        r"""export { ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId } from './terms';""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""/** One entity of the map in one of its variants, as the entity catalog draws it. */
export type EntityRef = { [Kind in EntityKind]: { kind: Kind; variant: EntityVariants[Kind] } }[EntityKind];""",
        r"""type VariantOf<Kind extends EntityKind> = { kind: Kind; variant: EntityVariants[Kind] };

/** One entity of the map in one of its variants, as the entity catalog draws it; a packet can also be an intruder's. */
export type EntityRef = { [Kind in EntityKind]: Kind extends 'packet' ? VariantOf<Kind> & { intruder?: boolean } : VariantOf<Kind> }[EntityKind];""",
    ),
    (
        r"""
/** Returns the term that names an entity in this variant, or null when it has none yet. */""",
        r"""
/** The entity whose icon goes with each term that names one; a term left out, like least-privilege, has no icon. */
export const TERM_ENTITY: Partial<Record<TermId, EntityRef>> = {
  vpc: { kind: 'network', variant: 'vpc' },
  'ec2-instance': { kind: 'device', variant: 'ec2-instance' },
  'security-group': { kind: 'firewall', variant: 'security-group' },
  'internet-gateway': { kind: 'edge', variant: 'internet-gateway' },
  'echo-request': { kind: 'packet', variant: 'echo-request' },
  'echo-reply': { kind: 'packet', variant: 'echo-reply' },
};

/** Returns the term that names an entity in this variant, or null when it has none yet. */""",
    ),
)

edit(
    'src/game/view/inspection.ts',
    (
        r"""export interface Inspection {""",
        r"""export interface Inspection {
  entity: EntityRef;""",
    ),
    (
        r"""  return {
    title: own.name,""",
        r"""  return {
    entity: { kind: 'device', variant: own.kind },
    title: own.name,""",
    ),
    (
        r"""  return {
    title: MAP_TEXT.firewall[own.kind](own.name),""",
        r"""  return {
    entity: { kind: 'firewall', variant: own.kind },
    title: MAP_TEXT.firewall[own.kind](own.name),""",
    ),
    (
        r"""  return {
    title: MAP_TEXT.edge[variant],""",
        r"""  return {
    entity: { kind: 'edge', variant },
    title: MAP_TEXT.edge[variant],""",
    ),
    (
        r"""  return {
    title: MAP_TEXT.internet,""",
        r"""  return {
    entity: { kind: 'internet', variant: 'internet' },
    title: MAP_TEXT.internet,""",
    ),
    (
        r"""  return {
    title: who.name,""",
        r"""  return {
    entity: { kind: 'actor', variant: who.kind },
    title: who.name,""",
    ),
    (
        r"""  return {
    title: run.label,""",
        r"""  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.kind === 'forbidden' },
    title: run.label,""",
    ),
)

edit(
    'src/scene/entities/CLAUDE.md',
    (
        r"""The entity catalog: one file per entity of the map (`network`, `device`, `firewall`, `edge`, `internet`, `actor`, `packet`, `stamp`). Each file exports the entity's map piece and, from the icons task on, its 2D icon. The design of every entity (its card: concept, shape, variants, states, label, movement and accessibility) is in `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`, section "Catálogo de entidades".""",
        r"""The entity catalog: one file per entity of the map (`network`, `device`, `firewall`, `edge`, `internet`, `actor`, `packet`, `stamp`). Each file exports the entity's map piece and its 2D icon; `entity-icon.tsx` draws the icon of any `EntityRef`. The design of every entity (its card: concept, shape, variants, states, label, movement and accessibility) is in `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`, section "Catálogo de entidades".""",
    ),
    (
        r"""- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?.""",
        r"""- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?.
- An icon is the piece seen from the front, in one colour (`currentColor`, drawn with `InkIcon` from `@/scene/ink`), hidden from screen readers because the text beside it names it. Every variant and every stamp state has its own shape.""",
    ),
)

edit(
    'src/scene/entities/device.tsx',
    (
        r"""import { InkBox } from '@/scene/ink';""",
        r"""import { InkBox, InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""      {intruded && still && <DoubleBorder x={x} z={z} variant={variant} />}
    </group>
  );
}""",
        r"""      {intruded && still && <DoubleBorder x={x} z={z} variant={variant} />}
    </group>
  );
}

const DEVICE_ICON: Record<Device['kind'], ReactNode> = {
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1" />
      <path d="M3 19l2-4h14l2 4z" />
    </>
  ),
  printer: (
    <>
      <path d="M7 10V4h10v6" />
      <rect x="3" y="10" width="18" height="7" rx="1" />
      <path d="M7 17v3h10v-3" />
    </>
  ),
  'ec2-instance': (
    <>
      <rect x="4" y="5" width="16" height="3" />
      <rect x="5" y="8" width="14" height="12" />
      <rect x="10" y="14" width="4" height="6" />
    </>
  ),
};

/** The device's icon: the front of its piece. */
export function DeviceIcon({ variant }: { variant: Device['kind'] }) {
  return <InkIcon>{DEVICE_ICON[variant]}</InkIcon>;
}""",
    ),
)

edit(
    'src/scene/entities/edge.tsx',
    (
        r"""import { InkBox } from '@/scene/ink';""",
        r"""import { InkBox, InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""  );
}""",
        r"""  );
}

/** The edge's icon: the arch, with the router's two antennas. */
export function EdgeIcon({ variant }: { variant: Network['edge'] }) {
  return (
    <InkIcon>
      <rect x="4" y="7" width="16" height="3" />
      <path d="M6 10v10M18 10v10" />
      {variant === 'router' && <path d="M9 7V3M15 7V3" />}
    </InkIcon>
  );
}""",
    ),
)

edit(
    'src/scene/entities/firewall.tsx',
    (
        r"""import { InkBox } from '@/scene/ink';""",
        r"""import { InkBox, InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""  );
}""",
        r"""  );
}

/** The firewall's icon: two posts and its bar, thin for a Security Group and of bricks for the firewall of a laptop. */
export function FirewallIcon({ variant }: { variant: FirewallKind }) {
  return (
    <InkIcon>
      <path d="M5 7v13M19 7v13" />
      {variant === 'security-group' ? (
        <rect x="5" y="10" width="14" height="2" />
      ) : (
        <>
          <rect x="5" y="9" width="14" height="7" />
          <path d="M5 12.5h14M9.5 9v3.5M14.5 9v3.5M12 12.5V16" />
        </>
      )}
    </InkIcon>
  );
}""",
    ),
)

edit(
    'src/scene/entities/internet.tsx',
    (
        r"""import { Billboard, Line } from '@react-three/drei';""",
        r"""import { Billboard, Line } from '@react-three/drei';
import { InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""  );
}""",
        r"""  );
}

/** The internet's icon: the globe with its equator and a meridian. */
export function InternetIcon() {
  return (
    <InkIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </InkIcon>
  );
}""",
    ),
)

edit(
    'src/scene/entities/network.tsx',
    (
        r"""import { InkBox } from '@/scene/ink';""",
        r"""import { InkBox, InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""  );
}""",
        r"""  );
}

/** The network's icon: its slab, with the office's wall behind it. */
export function NetworkIcon({ variant }: { variant: Network['kind'] }) {
  return (
    <InkIcon>
      <rect x="2" y="15" width="20" height="4" rx="0.5" />
      {variant === 'office' && <path d="M3 15V9h18v6" />}
    </InkIcon>
  );
}""",
    ),
)

edit(
    'src/scene/entities/packet.tsx',
    (
        r"""import { cumulativeLengths, pathLength, pointAt, roundTrip, type Vec2, type Vec3 } from '@/scene/layout';""",
        r"""import { cumulativeLengths, pathLength, pointAt, roundTrip, type Vec2, type Vec3 } from '@/scene/layout';
import { InkIcon } from '@/scene/ink';""",
    ),
    (
        r"""      )}
    </>
  );
}""",
        r"""      )}
    </>
  );
}

const PACKET_ICON_PATH = { round: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z', rhombus: 'M12 5l7 7-7 7-7-7z' } as const;

/** The packet's icon, the same shape as on the map: filled for an Echo Request, hollow for an Echo Reply, a rhombus for an intruder. */
export function PacketIcon({ message, intruder }: { message: PacketMessage; intruder: boolean }) {
  const request = message === 'echo-request';
  return (
    <InkIcon>
      <path d={PACKET_ICON_PATH[intruder ? 'rhombus' : 'round']} fill={request ? 'currentColor' : 'none'} strokeWidth={request ? 1.6 : 2.6} />
    </InkIcon>
  );
}""",
    ),
)

edit(
    'src/scene/index.ts',
    (
        r"""export { GameScene } from './game-scene';""",
        r"""export { EntityIcon, StampIcon } from './entities';
export { GameScene } from './game-scene';""",
    ),
)

edit(
    'src/scene/ink.tsx',
    (
        r"""import { Line } from '@react-three/drei';""",
        r"""import { Line } from '@react-three/drei';
import type { ReactNode } from 'react';""",
    ),
    (
        r"""  );
}""",
        r"""  );
}

/** A 24×24 ink icon in the text's colour (`currentColor`), hidden from screen readers: the text beside it names what it shows. */
export function InkIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="entity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}""",
    ),
)

edit(
    'src/styles.css',
    (
        r""".glossary dt { font-weight: 600; }""",
        r""".glossary dt { font-weight: 600; }
.entity-icon { width: 1.2em; height: 1.2em; margin-right: 0.35em; vertical-align: -0.22em; }""",
    ),
)

edit(
    'src/ui/incident/CLAUDE.md',
    (
        r"""
- State lives in the session reducer of `@/game`; there is no game clock.""",
        r"""
- The glossary shows the icon of each term that names an entity, and the inspection box shows the icon of what it inspects in its heading (`EntityIcon` from `@/scene`).
- State lives in the session reducer of `@/game`; there is no game clock.""",
    ),
)

edit(
    'src/ui/incident/inspection-box.tsx',
    (
        r"""import type { Inspection } from '@/game';""",
        r"""import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';""",
    ),
    (
        r"""      <h2 id="inspection-title">""",
        r"""      <h2 id="inspection-title">
        <EntityIcon entity={inspection.entity} />""",
    ),
)

edit(
    'src/ui/incident/lucia-card.tsx',
    (
        r"""import { LUCIA_TEXT, TERMS, type TermId, type TermText } from '@/copy';
import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';
import type { IncidentTask } from '@/levels';""",
        r"""import { LUCIA_TEXT, TERMS, TERM_ENTITY, type TermId, type TermText } from '@/copy';
import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';
import type { IncidentTask } from '@/levels';
import { EntityIcon } from '@/scene';""",
    ),
    (
        r"""      {terms.map((id) => (
        <div key={id}>
          <dt>
            {TERMS[id].name}
            {newTerms.has(id) && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
          </dt>
          <dd>{TERMS[id].definition}</dd>
        </div>
      ))}""",
        r"""      {terms.map((id) => {
        const entity = TERM_ENTITY[id];
        return (
          <div key={id}>
            <dt>
              {entity && <EntityIcon entity={entity} />}
              <span className="glossary__name">{TERMS[id].name}</span>
              {newTerms.has(id) && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
            </dt>
            <dd>{TERMS[id].definition}</dd>
          </div>
        );
      })}""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar**

```bash
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `Tests 502 passed (502)` en 42 archivos; `git diff` sin salida; `npm run check` PASS (Playwright: 11 passed; el nombre de la caja sigue siendo `servidor2` porque el ícono es `aria-hidden`).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(ui): draw each entity's 2D icon in the glossary and the inspection box"
```

---

### Task 9: La página `#/entidades` y su captura

La página de revisión del catálogo: un lienzo con cada entidad en cada variante y estado, en una cuadrícula alineada con la pantalla de la cámara isométrica, con una leyenda bajo cada celda, y la lista de íconos con su nombre. No se enlaza desde el roadmap. Tiene la casilla «Sin animaciones», compartida con la pantalla del incidente (`MotionToggle` y `useStillMode`). El lienzo del juego y el del catálogo comparten `MapCanvas` (cámara ortográfica, luz y capa HTML): jscpd no deja copiarlo, y la capa HTML es la que hace aparecer todas las etiquetas. Playwright compara la sección «Piezas del mapa» con una captura, quieta, a 1280×2200 y densidad 1, con Google Fonts bloqueado. Al final se anota en el backlog lo que este plan cerró.

**Files:**
- Create: `src/scene/map-canvas.tsx`, `src/scene/catalog/CLAUDE.md`, `src/scene/catalog/catalog-grid.ts`, `src/scene/catalog/catalog-cells.tsx`, `src/scene/catalog/catalog-scene.tsx`, `src/ui/use-still-mode.ts`, `src/ui/motion-toggle.tsx`, `src/ui/catalog/CLAUDE.md`, `src/ui/catalog/entities-page.tsx`, `tests/e2e/snapshots/CLAUDE.md`, `tests/e2e/snapshots/entities-darwin.png` (la escribe Playwright)
- Modify: `src/copy/terms.ts`, `src/copy/ui.ts`, `src/copy/index.ts`, `src/scene/entities/packet.tsx`, `src/scene/entities/index.ts`, `src/scene/game-scene.tsx`, `src/scene/index.ts`, `src/ui/index.ts`, `src/ui/incident/incident-screen.tsx`, `src/app.tsx`, `src/styles.css`, `playwright.config.ts`, `README.md`, `src/copy/CLAUDE.md`, `src/scene/CLAUDE.md`, `src/ui/CLAUDE.md`, `tests/e2e/CLAUDE.md`, `docs/plans/2026-10-08-follow-the-packet-followups.md`
- Test: `src/scene/catalog/catalog-grid.test.ts`, `src/ui/catalog/entities-page.test.tsx`, `src/app.test.tsx`, `tests/e2e/entities.spec.ts`

**Interfaces:**
- Consumes: todo el catálogo (Tareas 3 a 8), `labelOffset` (Tarea 5), `PieceAnchor` de `@/scene/overlay/piece-anchor`, `FlowTraffic` de `@/scene/traffic/flow-traffic`.
- Produces:
  - `@/copy`: `ENTITY_REFS: EntityRef[]` (cada entidad en cada variante; cada paquete también como intruso), `CATALOG_TEXT`, `entityName(entity): string`.
  - `PACKET_Y` por `@/scene/entities`.
  - `MapCanvas({ camera: Vec3, zoom, children })` en `src/scene/map-canvas.tsx`.
  - `screenToGround(right, down): Vec2`, `cellPosition(column, row)`, `catalogTarget(columns, rows)`, `catalogSize(columns, rows)`, `CELL_WIDTH`, `CELL_HEIGHT`, `CATALOG_ZOOM` en `src/scene/catalog/catalog-grid.ts`.
  - `CATALOG_ROWS: CatalogCell[][]` y `CatalogScene({ still })`; `@/scene` exporta `CatalogScene`.
  - `EntitiesPage` por `@/ui`; la ruta `#/entidades` en `src/app.tsx`.
  - `useStillMode(): [boolean, (still: boolean) => void]` y `MotionToggle({ still, className, onChange })`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 8**

```bash
git status --short src tests
npx vitest run
```

Expected: nada bajo `src/` ni `tests/`; `Tests 502 passed (502)` en 42 archivos.

- [ ] **Step 2: Escribir los tests**

```bash
mkdir -p src/scene/catalog
mkdir -p src/ui/catalog
```

Contenido completo de `src/scene/catalog/catalog-grid.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Vec2 } from '@/scene/layout';
import { CATALOG_ZOOM, CELL_HEIGHT, CELL_WIDTH, catalogSize, catalogTarget, cellPosition, screenToGround } from './catalog-grid';

function onScreen([x, z]: Vec2): Vec2 {
  return [(x - z) / Math.SQRT2, (x + z) / Math.sqrt(6)];
}

describe('catalog grid', () => {
  it('moves right and down on the screen of the isometric camera, and nothing else', () => {
    const [right, down] = onScreen(screenToGround(3, 2));
    expect(right).toBeCloseTo(3);
    expect(down).toBeCloseTo(2);
  });

  it('puts the cells of a row side by side and the rows one below the other', () => {
    const [right, down] = onScreen(cellPosition(2, 3));
    expect(right).toBeCloseTo(2 * CELL_WIDTH);
    expect(down).toBeCloseTo(3 * CELL_HEIGHT);
  });

  it('frames the cells exactly, with a margin on the left for the labels that stick out', () => {
    const { width, height } = catalogSize(5, 10);
    const [right] = onScreen(catalogTarget(5, 10));
    const halfWidth = width / CATALOG_ZOOM / 2;
    expect(right + halfWidth).toBeCloseTo(4 * CELL_WIDTH + CELL_WIDTH / 2);
    expect(right - halfWidth).toBeLessThan(-CELL_WIDTH / 2);
    expect(height).toBe(10 * CELL_HEIGHT * CATALOG_ZOOM);
  });
});
```

Contenido completo de `src/ui/catalog/entities-page.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, ENTITY_REFS, SCREEN_TEXT, entityName } from '@/copy';
import { EntitiesPage } from './entities-page';

vi.mock('@/scene/catalog/catalog-scene', () => ({
  CatalogScene: ({ still }: { still: boolean }) => <p>{still ? 'still' : 'moving'}</p>,
}));

describe('entities page', () => {
  it('names every entity in every variant beside its icon, and every stamp', () => {
    render(<EntitiesPage />);
    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons })).getAllByRole('listitem');
    expect(icons).toHaveLength(ENTITY_REFS.length + 4);
    for (const entity of ENTITY_REFS) expect(screen.getByText(entityName(entity))).toContainHTML('<svg');
  });

  it('draws the pieces moving, and still once "Sin animaciones" is checked', async () => {
    const user = userEvent.setup();
    render(<EntitiesPage />);
    const pieces = screen.getByRole('region', { name: CATALOG_TEXT.pieces });
    expect(pieces).toHaveTextContent('moving');
    await user.click(screen.getByLabelText(SCREEN_TEXT.motion));
    expect(pieces).toHaveTextContent('still');
  });
});
```

Contenido completo de `tests/e2e/entities.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const FONT_HOSTS = /fonts\.(googleapis|gstatic)\.com/;
const PIECES = 'Piezas del mapa';
const LAST_CAPTION = 'intruso';
const FRAMES = 60;

test.use({ viewport: { width: 1280, height: 2200 }, deviceScaleFactor: 1 });

async function openCatalog(page: Page) {
  await page.route(FONT_HOSTS, (route) => route.abort());
  await page.goto('/#/entidades');
  const pieces = page.getByRole('region', { name: PIECES });
  await expect(pieces.getByText(LAST_CAPTION, { exact: true })).toBeVisible();
  return pieces;
}

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the entity catalog draws every entity in every variant and state as recorded', async ({ page }) => {
    const errors = collectErrors(page);
    const pieces = await openCatalog(page);
    await expect(page.getByLabel('Sin animaciones')).toBeChecked();
    await expect(pieces).toHaveScreenshot('entities.png', { maxDiffPixelRatio: 0.01 });
    expect(errors).toEqual([]);
  });
});

test('the entity catalog also runs with its animations, without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await openCatalog(page);
  await expect(page.getByLabel('Sin animaciones')).not.toBeChecked();
  await page.evaluate((frames) => new Promise<void>((done) => {
    let left = frames;
    const tick = () => (--left > 0 ? requestAnimationFrame(tick) : done());
    requestAnimationFrame(tick);
  }), FRAMES);
  expect(errors).toEqual([]);
});

test('the roadmap does not link to the entity catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('a[href="#/entidades"]')).toHaveCount(0);
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
    'src/app.test.tsx',
    (
        r"""import { afterEach, describe, expect, it } from 'vitest';
import { NOTICE_TEXT } from '@/copy';
import { CHAPTERS, INCIDENTS } from '@/levels';
import { App } from './app';""",
        r"""import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, NOTICE_TEXT } from '@/copy';
import { CHAPTERS, INCIDENTS } from '@/levels';
import { App } from './app';

vi.mock('@/scene/catalog/catalog-scene', () => ({ CatalogScene: () => null }));""",
    ),
    (
        r"""
  it('corrupt saved progress does not break the roadmap', () => {""",
        r"""
  it('the roadmap does not link to the entity catalog', () => {
    render(<App />);
    expect(document.querySelector('a[href="#/entidades"]')).toBeNull();
  });

  it('the entity catalog opens from its URL', () => {
    window.location.hash = '#/entidades';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: CATALOG_TEXT.title })).toBeInTheDocument();
  });

  it('corrupt saved progress does not break the roadmap', () => {""",
    ),
)
EOF
```

- [ ] **Step 3: Verlos fallar**

```bash
npx vitest run src/scene/catalog/catalog-grid.test.ts src/ui/catalog/entities-page.test.tsx src/app.test.tsx
```

Expected: FAIL, `Test Files 3 failed (3)`: faltan `./catalog-grid` y `./entities-page`, y `CATALOG_TEXT` no existe (`Cannot read properties of undefined (reading 'title')`).

- [ ] **Step 4: Implementar**

```bash
mkdir -p src/scene/catalog
mkdir -p src/ui/catalog
mkdir -p tests/e2e/snapshots
```

Contenido completo de `src/copy/ui.ts`:

```ts
import type { EntityKind, EntityRef, EntityVariants } from './terms';

export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes los incidentes anteriores.` },
  back: 'Volver al roadmap',
} as const;

const ENTITY_NAMES: { [Kind in EntityKind]: Record<EntityVariants[Kind], string> } = {
  network: { office: 'red de la oficina', vpc: 'VPC' },
  device: { laptop: 'laptop', printer: 'impresora', 'ec2-instance': 'instancia EC2' },
  firewall: { 'host-firewall': 'firewall de la laptop', 'security-group': 'Security Group' },
  edge: { router: 'router', 'internet-gateway': 'Internet gateway' },
  internet: { internet: 'internet' },
  actor: { attacker: 'Atacante', you: 'Tu Mac' },
  packet: { 'echo-request': 'Echo Request', 'echo-reply': 'Echo Reply' },
};

export const CATALOG_TEXT = {
  title: 'Catálogo de entidades',
  lede: 'Cada pieza del mapa en sus variantes y sus estados, con su ícono.',
  pieces: 'Piezas del mapa',
  icons: 'Íconos',
  intruder: 'intruso',
  state: {
    normal: 'normal',
    locked: 'con candado',
    configurable: 'configurable',
    selected: 'seleccionado',
    alert: 'alerta',
    blocking: 'bloqueó algo',
    replied: 'llegó y volvió',
    arrived: 'llegó',
    blocked: 'bloqueado',
    lost: 'perdido',
  },
} as const;

/** Returns the name of an entity in this variant, as the catalog shows it; an intruder's packet says so. */
export function entityName(entity: EntityRef): string {
  const names: Record<string, string> = ENTITY_NAMES[entity.kind];
  const name = names[entity.variant];
  return entity.kind === 'packet' && entity.intruder ? `${name} · ${CATALOG_TEXT.intruder}` : name;
}
```

Contenido completo de `src/scene/catalog/CLAUDE.md`:

```markdown
# scene/catalog

The canvas of the `/entidades` page: every entity of the catalog (`src/scene/entities/`) in every variant and state, in a grid that lines up on the screen of the isometric camera.

- `catalog-cells.tsx` lists the cells, one row per entity or variant; `catalog-grid.ts` places them; `catalog-scene.tsx` draws them with a caption under each one.
- A cell draws pieces through the catalog with fixed props: nothing here reads a game or a world.
- Not here: the page around the canvas and the icon list (`src/ui/catalog/`), the pieces themselves (`src/scene/entities/`).
- May import: `@/copy`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
```

Contenido completo de `src/scene/catalog/catalog-cells.tsx`:

```tsx
import type { ReactNode } from 'react';
import { CATALOG_TEXT, entityName, type EntityRef, type PacketMessage } from '@/copy';
import type { Actor, Device, FirewallKind, Network } from '@/engine';
import {
  ActorPiece,
  DevicePiece,
  EdgePiece,
  FirewallPiece,
  InternetPiece,
  NetworkPiece,
  PACKET_Y,
  PacketGlyph,
  PacketTrace,
  StampPiece,
  type PacketEnd,
  type StampState,
} from '@/scene/entities';
import { labelOffset, type Vec2 } from '@/scene/layout';
import { PieceAnchor } from '@/scene/overlay/piece-anchor';
import type { MapPiece, MapPieceKind } from '@/scene/overlay/piece-label';
import { FlowTraffic } from '@/scene/traffic/flow-traffic';
import { screenToGround } from './catalog-grid';

export interface CatalogCell {
  id: string;
  caption: string;
  draw: (still: boolean) => ReactNode;
}

type PieceEntity = Extract<EntityRef, { kind: MapPieceKind }>;

const ORIGIN: Vec2 = [0, 0];
const NETWORK_SIZE = { width: 3.2, depth: 2.2 };
const TRACE_HALF = 1.7;
const TRACE: Vec2[] = [screenToGround(-TRACE_HALF, 0), screenToGround(TRACE_HALF, 0)];
const DEVICE_STATES = ['normal', 'locked', 'selected', 'alert'] as const;
const FIREWALL_STATES = ['locked', 'configurable', 'selected', 'blocking'] as const;
const TRACE_ENDS: { end: PacketEnd; message: PacketMessage; intruder: boolean; stamp: StampState }[] = [
  { end: 'replied', message: 'echo-request', intruder: false, stamp: 'arrived' },
  { end: 'arrived', message: 'echo-reply', intruder: false, stamp: 'arrived' },
  { end: 'blocked', message: 'echo-request', intruder: false, stamp: 'blocked' },
  { end: 'lost', message: 'echo-request', intruder: false, stamp: 'lost' },
  { end: 'arrived', message: 'echo-request', intruder: true, stamp: 'intruder' },
];
const ignore = () => {};

function Label({ id, entity, locked, state }: { id: string; entity: PieceEntity; locked: boolean; state: MapPiece['state'] }) {
  const piece: MapPiece = { ...entity, id, anchorId: id, label: entityName(entity), locked, state };
  return <PieceAnchor piece={piece} position={labelOffset(entity.kind)} onInspect={ignore} onActivate={ignore} />;
}

function deviceRow(variant: Device['kind']): CatalogCell[] {
  return DEVICE_STATES.map((state) => {
    const id = `device-${variant}-${state}`;
    return {
      id,
      caption: CATALOG_TEXT.state[state],
      draw: (still) => (
        <>
          <DevicePiece position={ORIGIN} variant={variant} selected={state === 'selected'} intruded={state === 'alert'} still={still} />
          <Label id={id} entity={{ kind: 'device', variant }} locked={state === 'locked'} state={state === 'alert' ? 'intruded' : 'normal'} />
        </>
      ),
    };
  });
}

function firewallRow(variant: FirewallKind): CatalogCell[] {
  return FIREWALL_STATES.map((state) => {
    const id = `firewall-${variant}-${state}`;
    return {
      id,
      caption: CATALOG_TEXT.state[state],
      draw: (still) => (
        <>
          <FirewallPiece position={ORIGIN} variant={variant} selected={state === 'selected'} blocking={state === 'blocking'} still={still} />
          <Label id={id} entity={{ kind: 'firewall', variant }} locked={state === 'locked'} state={state === 'blocking' ? 'blocking' : 'normal'} />
        </>
      ),
    };
  });
}

function networkCell(variant: Network['kind']): CatalogCell {
  return { id: `network-${variant}`, caption: entityName({ kind: 'network', variant }), draw: () => <NetworkPiece variant={variant} {...NETWORK_SIZE} /> };
}

function edgeCell(variant: Network['edge']): CatalogCell {
  const id = `edge-${variant}`;
  return {
    id,
    caption: CATALOG_TEXT.state.locked,
    draw: () => (
      <>
        <EdgePiece position={ORIGIN} variant={variant} />
        <Label id={id} entity={{ kind: 'edge', variant }} locked state="normal" />
      </>
    ),
  };
}

const INTERNET_CELL: CatalogCell = {
  id: 'internet',
  caption: CATALOG_TEXT.state.normal,
  draw: () => (
    <>
      <InternetPiece position={ORIGIN} />
      <Label id="internet" entity={{ kind: 'internet', variant: 'internet' }} locked={false} state="normal" />
    </>
  ),
};

function actorCell(variant: Actor['kind']): CatalogCell {
  const id = `actor-${variant}`;
  return {
    id,
    caption: CATALOG_TEXT.state.normal,
    draw: () => (
      <>
        <ActorPiece position={ORIGIN} variant={variant} />
        <Label id={id} entity={{ kind: 'actor', variant }} locked={false} state="normal" />
      </>
    ),
  };
}

function packetCell(message: PacketMessage, intruder: boolean): CatalogCell {
  return {
    id: `packet-${message}-${intruder}`,
    caption: entityName({ kind: 'packet', variant: message, intruder }),
    draw: () => (
      <group position={[0, PACKET_Y, 0]}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
    ),
  };
}

function traceCell({ end, message, intruder, stamp }: (typeof TRACE_ENDS)[number], index: number): CatalogCell {
  const id = `trace-${end}-${stamp}`;
  const look = { path: TRACE, message, intruder, end };
  const caption = intruder ? CATALOG_TEXT.intruder : CATALOG_TEXT.state[end];
  return {
    id,
    caption,
    draw: (still) => (
      <>
        {still ? <PacketTrace {...look} /> : <FlowTraffic look={look} index={index} />}
        <StampPiece position={TRACE[1]} state={stamp} name={caption} pieceId={id} onInspect={ignore} />
      </>
    ),
  };
}

/** Every entity of the map in every variant and state, one row per entity or variant, in the order of the catalog in the chapter 1 design. */
export const CATALOG_ROWS: CatalogCell[][] = [
  [networkCell('office'), networkCell('vpc')],
  deviceRow('laptop'),
  deviceRow('printer'),
  deviceRow('ec2-instance'),
  firewallRow('host-firewall'),
  firewallRow('security-group'),
  [edgeCell('router'), edgeCell('internet-gateway'), INTERNET_CELL],
  [actorCell('attacker'), actorCell('you')],
  [packetCell('echo-request', false), packetCell('echo-reply', false), packetCell('echo-request', true), packetCell('echo-reply', true)],
  TRACE_ENDS.map(traceCell),
];
```

Contenido completo de `src/scene/catalog/catalog-grid.ts`:

```ts
import type { Vec2 } from '@/scene/layout';

export const CELL_WIDTH = 5;
export const CELL_HEIGHT = 4.8;
export const CATALOG_ZOOM = 40;
const GROUND_DROP = 0.6;
const LEFT_MARGIN = 0.3;
const SCREEN_RIGHT: Vec2 = [Math.SQRT1_2, -Math.SQRT1_2];
const SCREEN_DOWN: Vec2 = [Math.sqrt(1.5), Math.sqrt(1.5)];

/** Returns the point of the ground that the isometric camera shows this many units to the right of and below the origin. */
export function screenToGround(right: number, down: number): Vec2 {
  return [right * SCREEN_RIGHT[0] + down * SCREEN_DOWN[0], right * SCREEN_RIGHT[1] + down * SCREEN_DOWN[1]];
}

/** Returns where the cell in this column and row stands on the ground, so the cells line up in rows and columns on the screen. */
export function cellPosition(column: number, row: number): Vec2 {
  return screenToGround(column * CELL_WIDTH, row * CELL_HEIGHT);
}

/** Returns the point the camera looks at so a grid of this size fills its canvas, with a margin on the left for the labels that stick out, and each piece standing low in its cell to leave room for its label above. */
export function catalogTarget(columns: number, rows: number): Vec2 {
  return screenToGround(((columns - 1 - LEFT_MARGIN) * CELL_WIDTH) / 2, (rows / 2 - GROUND_DROP) * CELL_HEIGHT);
}

/** Returns the size in pixels of the canvas that holds a grid of this size. */
export function catalogSize(columns: number, rows: number): { width: number; height: number } {
  return { width: (columns + LEFT_MARGIN) * CELL_WIDTH * CATALOG_ZOOM, height: rows * CELL_HEIGHT * CATALOG_ZOOM };
}
```

Contenido completo de `src/scene/catalog/catalog-scene.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import { MapCanvas } from '@/scene/map-canvas';
import { CATALOG_ROWS } from './catalog-cells';
import { CATALOG_ZOOM, catalogSize, catalogTarget, cellPosition, screenToGround } from './catalog-grid';

const CAMERA_OFFSET = 60;
const CAPTION_DOWN = 1.55;
const [CAPTION_X, CAPTION_Z] = screenToGround(0, CAPTION_DOWN);
const COLUMNS = Math.max(...CATALOG_ROWS.map((row) => row.length));
const [TARGET_X, TARGET_Z] = catalogTarget(COLUMNS, CATALOG_ROWS.length);

function Caption({ text }: { text: string }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[CAPTION_X, 0, CAPTION_Z]} center>
      <p className="catalog__caption">{text}</p>
    </Html>
  );
}

/** Draws the whole entity catalog on one isometric canvas: each cell is a piece in one variant and one state, with a caption under it. */
export function CatalogScene({ still }: { still: boolean }) {
  return (
    <div className="catalog__canvas" style={catalogSize(COLUMNS, CATALOG_ROWS.length)}>
      <MapCanvas camera={[CAMERA_OFFSET, CAMERA_OFFSET, CAMERA_OFFSET]} zoom={CATALOG_ZOOM}>
        <group position={[-TARGET_X, 0, -TARGET_Z]}>
          {CATALOG_ROWS.flatMap((row, rowIndex) =>
            row.map((cell, column) => {
              const [x, z] = cellPosition(column, rowIndex);
              return (
                <group key={cell.id} position={[x, 0, z]}>
                  {cell.draw(still)}
                  <Caption text={cell.caption} />
                </group>
              );
            }),
          )}
        </group>
      </MapCanvas>
    </div>
  );
}
```

Contenido completo de `src/scene/game-scene.tsx`:

```tsx
import { ContactShadows, MapControls } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Network } from '@/engine';
import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, InternetPiece, NetworkPiece } from './entities';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter, piecePosition, type Layout } from './layout';
import { MapCanvas } from './map-canvas';
import { CardAnchor } from './overlay/card-anchor';
import type { OnInspect } from './overlay/inspect-handlers';
import { PieceAnchor } from './overlay/piece-anchor';
import type { MapPiece } from './overlay/piece-label';
import { Road } from './road';
import { Traffic, type MapFlow } from './traffic/traffic';

const CAMERA_OFFSET = 14;
const CAMERA_ZOOM = 38;

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  flows: MapFlow[];
  still: boolean;
  activePieceId: string | null;
  overlay: ReactNode;
  onInspect: OnInspect;
  onActivate: (pieceId: string) => void;
}

function PieceShape({ piece, layout, selected, still }: { piece: MapPiece; layout: Layout; selected: boolean; still: boolean }) {
  const position = piecePosition(piece, layout);
  switch (piece.kind) {
    case 'device':
      return <DevicePiece position={position} variant={piece.variant} selected={selected} intruded={piece.state === 'intruded'} still={still} />;
    case 'firewall':
      return <FirewallPiece position={position} variant={piece.variant} selected={selected} blocking={piece.state === 'blocking'} still={still} />;
    case 'edge':
      return <EdgePiece position={position} variant={piece.variant} />;
    case 'internet':
      return <InternetPiece position={position} />;
    case 'actor':
      return <ActorPiece position={position} variant={piece.variant} />;
  }
}

export function GameScene({ world, pieces, flows, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world, pieces.some((piece) => piece.kind === 'edge'));
  const [cx, cz] = layoutCenter(layout);
  const active = pieces.find((piece) => piece.id === activePieceId);
  return (
    <MapCanvas camera={[cx + CAMERA_OFFSET, CAMERA_OFFSET, cz + CAMERA_OFFSET]} zoom={CAMERA_ZOOM}>
      <MapControls target={[cx, 0, cz]} enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
      <NetworkPiece variant={world.kind} width={layout.sheet.width} depth={layout.sheet.depth} />
      <Road layout={layout} />
      {pieces.map((piece) => (
        <PieceShape key={piece.id} piece={piece} layout={layout} selected={piece.id === activePieceId} still={still} />
      ))}
      {pieces.map((piece) => (
        <PieceAnchor key={piece.id} piece={piece} position={labelPosition(piece, layout)} onInspect={onInspect} onActivate={onActivate} />
      ))}
      <Traffic flows={flows} layout={layout} still={still} onInspect={onInspect} />
      {active && overlay && <CardAnchor position={cardAnchorPosition(active.anchorId, layout)}>{overlay}</CardAnchor>}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
    </MapCanvas>
  );
}
```

Contenido completo de `src/scene/map-canvas.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import { HtmlLayerContext } from './html-layer';
import type { Vec3 } from './layout';

const FAR = 500;

/** The canvas every map is drawn on: an orthographic camera at this position looking at the origin, paper light, and an HTML layer for labels, stamps and cards. */
export function MapCanvas({ camera, zoom, children }: { camera: Vec3; zoom: number; children: ReactNode }) {
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Canvas orthographic camera={{ position: camera, zoom, near: 0.1, far: FAR }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} dpr={[1, 2]}>
        <HtmlLayerContext.Provider value={htmlLayer}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} />
          {children}
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
```

Contenido completo de `src/ui/catalog/CLAUDE.md`:

```markdown
# ui/catalog

The `#/entidades` page: the entity catalog for design review, with every piece on one canvas (`src/scene/catalog/`) and every icon with its name. The roadmap does not link to it.

- Not here: the pieces, the icons and the canvas (`src/scene/`), the names of the variants (`src/copy/ui.ts`).
- May import: `@/scene`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
```

Contenido completo de `src/ui/catalog/entities-page.tsx`:

```tsx
import { CATALOG_TEXT, ENTITY_REFS, entityName } from '@/copy';
import { CatalogScene, EntityIcon, StampIcon } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';

const STAMP_STATES = ['arrived', 'blocked', 'lost', 'intruder'] as const;
const STAMP_NAME = { arrived: CATALOG_TEXT.state.arrived, blocked: CATALOG_TEXT.state.blocked, lost: CATALOG_TEXT.state.lost, intruder: CATALOG_TEXT.intruder } as const;

/** The design review page of the entity catalog: every piece in every variant and state on one canvas, and every icon with its name. */
export function EntitiesPage() {
  const [still, setStill] = useStillMode();
  return (
    <main className="catalog">
      <header className="catalog__head">
        <h1>{CATALOG_TEXT.title}</h1>
        <p className="lede">{CATALOG_TEXT.lede}</p>
        <MotionToggle still={still} className="catalog__motion" onChange={setStill} />
      </header>
      <section aria-labelledby="catalog-pieces" className="catalog__section">
        <h2 id="catalog-pieces">{CATALOG_TEXT.pieces}</h2>
        <CatalogScene still={still} />
      </section>
      <section aria-labelledby="catalog-icons" className="catalog__section">
        <h2 id="catalog-icons">{CATALOG_TEXT.icons}</h2>
        <ul className="catalog__icons">
          {ENTITY_REFS.map((entity) => {
            const name = entityName(entity);
            return (
              <li key={name}>
                <EntityIcon entity={entity} />
                {name}
              </li>
            );
          })}
          {STAMP_STATES.map((state) => (
            <li key={state}>
              <StampIcon state={state} />
              {STAMP_NAME[state]}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

Contenido completo de `src/ui/motion-toggle.tsx`:

```tsx
import { SCREEN_TEXT } from '@/copy';

/** The "Sin animaciones" checkbox. */
export function MotionToggle({ still, className, onChange }: { still: boolean; className: string; onChange: (still: boolean) => void }) {
  return (
    <label className={className}>
      <input type="checkbox" checked={still} onChange={(event) => onChange(event.target.checked)} /> {SCREEN_TEXT.motion}
    </label>
  );
}
```

Contenido completo de `src/ui/use-still-mode.ts`:

```ts
import { useReducedMotion } from '@mantine/hooks';
import { useState } from 'react';

/** Returns whether the map is drawn without animations: the player's choice once made, the system's reduced-motion preference until then; and the function that records the choice. */
export function useStillMode(): [boolean, (still: boolean) => void] {
  const prefersStill = useReducedMotion(false, { getInitialValueInEffect: false });
  const [choice, setChoice] = useState<boolean | null>(null);
  return [choice ?? prefersStill, setChoice];
}
```

Contenido completo de `tests/e2e/snapshots/CLAUDE.md`:

```markdown
# tests/e2e/snapshots

Reference captures of `toHaveScreenshot`, one per platform (`<name>-<platform>.png`). Playwright writes them; nothing else edits them.

- A capture changes only on purpose: when a task changes how an entity looks, it records the new capture with `npx playwright test entities --update-snapshots` and commits it with the change.
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
    'README.md',
    (
        r"""A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](https://github.com/angelozdev/aws-commit-academy/blob/main/labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md)""",
        r"""A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](https://github.com/angelozdev/aws-commit-academy/blob/main/labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button. The engine models any network: an office or a VPC, with devices and firewalls by kind. Every entity of the map, in every variant and state, is on the `#/entidades` page, which the roadmap does not link to.

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md) · [entity catalog](../../docs/plans/2026-10-09-follow-the-packet-entity-catalog.md)""",
    ),
)

edit(
    'playwright.config.ts',
    (
        r"""  testDir: 'tests/e2e',""",
        r"""  testDir: 'tests/e2e',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}-{platform}{ext}',""",
    ),
)

edit(
    'src/app.tsx',
    (
        r"""import { IncidentPage, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;""",
        r"""import { EntitiesPage, IncidentPage, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;
const ENTITIES_ROUTE = '#/entidades';""",
    ),
    (
        r"""  const [progress, setProgress] = useState(loadProgress);""",
        r"""  const [progress, setProgress] = useState(loadProgress);
  if (hash === ENTITIES_ROUTE) return <EntitiesPage />;""",
    ),
)

edit(
    'src/copy/CLAUDE.md',
    (
        r"""Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap and notice screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1. The other way round, a term that names an entity declares the entity whose icon goes with it in `TERM_ENTITY`; a term with no entity, like `least-privilege`, has no icon.""",
        r"""Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap, notice and entity catalog screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- Every entity of the map, in every variant (`EntityRef`: its kind and the variant its model gives it), names its term in `ENTITY_TERMS` (`terms.ts`), or `null` while the ladder has none; `entityTerm` reads it. The office variants get their terms in chapter 1. The other way round, a term that names an entity declares the entity whose icon goes with it in `TERM_ENTITY`; a term with no entity, like `least-privilege`, has no icon. `ENTITY_REFS` lists every entity in every variant for the catalog page, and `entityName` names one as that page shows it.""",
    ),
)

edit(
    'src/copy/index.ts',
    (
        r"""export { ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId } from './terms';""",
        r"""export { ENTITY_REFS, ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId } from './terms';""",
    ),
    (
        r"""export { NOTICE_TEXT, ROADMAP_TEXT } from './ui';""",
        r"""export { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './ui';""",
    ),
)

edit(
    'src/copy/terms.ts',
    (
        r"""  return terms[entity.variant];
}""",
        r"""  return terms[entity.variant];
}

function variantsOf<Kind extends EntityKind>(kind: Kind): EntityVariants[Kind][] {
  return Object.keys(ENTITY_TERMS[kind]) as EntityVariants[Kind][];
}

/** Every entity in every variant, in the order of ENTITY_TERMS, with each packet also as an intruder's. */
export const ENTITY_REFS: EntityRef[] = [
  ...variantsOf('network').map((variant) => ({ kind: 'network', variant }) as const),
  ...variantsOf('device').map((variant) => ({ kind: 'device', variant }) as const),
  ...variantsOf('firewall').map((variant) => ({ kind: 'firewall', variant }) as const),
  ...variantsOf('edge').map((variant) => ({ kind: 'edge', variant }) as const),
  ...variantsOf('internet').map((variant) => ({ kind: 'internet', variant }) as const),
  ...variantsOf('actor').map((variant) => ({ kind: 'actor', variant }) as const),
  ...variantsOf('packet').flatMap((variant) => [{ kind: 'packet', variant } as const, { kind: 'packet', variant, intruder: true } as const]),
];""",
    ),
)

edit(
    'src/scene/CLAUDE.md',
    (
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`). `ink.tsx` holds the paper box with ink edges that every piece is built from.""",
        r"""The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), live traffic (`traffic/`) and the canvas of the `/entidades` page (`catalog/`). `map-canvas.tsx` is the canvas both maps are drawn on; `ink.tsx` holds the paper box with ink edges that every piece is built from and the frame of every icon.""",
    ),
)

edit(
    'src/scene/entities/index.ts',
    (
        r"""export { PACKET_END_S, PACKET_SPEED, PacketGlyph, PacketIcon, PacketRun, PacketTrace, travelPath } from './packet';""",
        r"""export { PACKET_END_S, PACKET_SPEED, PACKET_Y, PacketGlyph, PacketIcon, PacketRun, PacketTrace, travelPath } from './packet';""",
    ),
)

edit(
    'src/scene/entities/packet.tsx',
    (
        r"""const PACKET_Y = 0.3;""",
        r"""export const PACKET_Y = 0.3;""",
    ),
)

edit(
    'src/scene/index.ts',
    (
        r"""export { EntityIcon, StampIcon } from './entities';""",
        r"""export { CatalogScene } from './catalog/catalog-scene';
export { EntityIcon, StampIcon } from './entities';""",
    ),
)

edit(
    'src/styles.css',
    (
        r"""  .incident__side { border-left: none; border-top: 1.5px solid var(--ink); }
}""",
        r"""  .incident__side { border-left: none; border-top: 1.5px solid var(--ink); }
}

.catalog { padding: 2rem 1.5rem 3rem; }
.catalog__head { max-width: 880px; display: grid; gap: 0.4rem; margin-bottom: 1.5rem; }
.catalog__head .lede { margin: 0; }
.catalog__motion { font-size: 0.9rem; }
.catalog__section { margin-bottom: 2rem; }
.catalog__section h2 { margin-bottom: 0.8rem; }
.catalog__canvas { position: relative; border: 1.5px solid var(--ink); background: var(--paper-fill); }
.catalog__caption { margin: 0; font: 400 12px var(--font-body); color: var(--ink-soft); white-space: nowrap; }
.catalog__icons { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.6rem 1.2rem; }
.catalog__icons li { display: flex; align-items: center; }""",
    ),
)

edit(
    'src/ui/CLAUDE.md',
    (
        r"""Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), plus shared pieces (`stars.tsx`, `tagged-text.tsx`, `term-tip.tsx`).""",
        r"""Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), the entity catalog page (`catalog/`, at `#/entidades`, not linked from the roadmap), plus shared pieces (`stars.tsx`, `tagged-text.tsx`, `term-tip.tsx`, and the "Sin animaciones" checkbox: `motion-toggle.tsx` with `use-still-mode.ts`).""",
    ),
)

edit(
    'src/ui/incident/incident-screen.tsx',
    (
        r"""import { useReducedMotion } from '@mantine/hooks';
""",
        r"""""",
    ),
    (
        r"""import { GameScene, pieceDomId } from '@/scene';""",
        r"""import { GameScene, pieceDomId } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';""",
    ),
    (
        r"""  const prefersStill = useReducedMotion(false, { getInitialValueInEffect: false });
  const [stillChoice, setStillChoice] = useState<boolean | null>(null);

  const still = stillChoice ?? prefersStill;""",
        r"""  const [still, setStill] = useStillMode();""",
    ),
    (
        r"""          <label className="incident__motion">
            <input type="checkbox" checked={still} onChange={(event) => setStillChoice(event.target.checked)} /> {SCREEN_TEXT.motion}
          </label>""",
        r"""          <MotionToggle still={still} className="incident__motion" onChange={setStill} />""",
    ),
)

edit(
    'src/ui/index.ts',
    (
        r"""export { IncidentPage } from './incident-page';""",
        r"""export { EntitiesPage } from './catalog/entities-page';
export { IncidentPage } from './incident-page';""",
    ),
)

edit(
    'tests/e2e/CLAUDE.md',
    (
        r"""- Shared helpers (`console-errors.ts`) are plain modules next to the specs.""",
        r"""- Shared helpers (`console-errors.ts`) are plain modules next to the specs.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.""",
    ),
)
EOF
```

- [ ] **Step 5: Verificar los tests unitarios**

```bash
npx vitest run
```

Expected: `Tests 509 passed (509)` en 44 archivos.

- [ ] **Step 6: Grabar la captura**

```bash
npx playwright test entities --update-snapshots
npx playwright test entities
npx playwright test entities
```

Expected: la primera corrida dice `A snapshot doesn't exist at …/tests/e2e/snapshots/entities-darwin.png, writing actual.` y `3 passed`; las otras dos, `3 passed` sin escribir nada. Abrir `tests/e2e/snapshots/entities-darwin.png` y compararla con la tabla «Fichas»: diez filas (las dos redes; laptop, impresora e instancia EC2 en normal, con candado, seleccionado y alerta; los dos firewalls en con candado, configurable, seleccionado y bloqueó algo; router, Internet gateway e internet; Atacante y Tu Mac; los cuatro paquetes; y los cinco finales: llegó y volvió, llegó, bloqueado, perdido e intruso), con una leyenda bajo cada celda. Si falta una celda o una leyenda, parar y avisar.

  **Plan B del spec, solo si la captura falla sin un cambio de código en dos corridas seguidas:** en `tests/e2e/entities.spec.ts`, reemplazar la línea `await expect(pieces).toHaveScreenshot('entities.png', { maxDiffPixelRatio: 0.01 });` por estas dos, borrar `tests/e2e/snapshots/entities-darwin.png` y anotar el cambio en el mensaje del commit:

  ```ts
    await expect(pieces.locator('.catalog__caption')).toHaveCount(36);
    await expect(pieces).toMatchAriaSnapshot({ name: 'entities.aria.yml' });
  ```

  Después correr `npx playwright test entities --update-snapshots` (escribe `tests/e2e/snapshots/entities-darwin.aria.yml`), revisar que esa estructura nombre cada etiqueta y cada leyenda, y correr `npx playwright test entities` dos veces más.

- [ ] **Step 7: Anotar en el backlog lo que se cerró**

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
        '\nBacklog, no plan.',
        '\n> **Estado (capítulo 1, plan 2, `docs/plans/2026-10-09-follow-the-packet-entity-catalog.md`):** hechos F1, F2, F3 y E6 (el «!» vive dentro de la etiqueta). E7 queda decidido por la ficha de Actor: un personaje no lleva candado. Siguen pendientes E4, E5, E8 a E10, F4 a F6 (plan 3), A1, A2 y el bloque D.\n\nBacklog, no plan.',
    ),
    (
        '| E6 | En «Sin animaciones», el «!» de intrusión tapa la etiqueta de servidor2 | Pendiente (revisión del plan 2) |',
        '| E6 | En «Sin animaciones», el «!» de intrusión tapa la etiqueta de servidor2 | Hecho en el capítulo 1, plan 2 (Tarea 6): el «!» va dentro de la etiqueta |',
    ),
    (
        '| E7 | El atacante se dibuja sin candado; el spec dice que una pieza fija lleva candado | Pendiente de decidir (revisión del plan 2) |',
        '| E7 | El atacante se dibuja sin candado; el spec dice que una pieza fija lleva candado | Decidido en el capítulo 1, plan 2: la ficha de Actor no lleva candado (es un personaje) |',
    ),
    (
        '`Building` fallarían al dibujar una oficina | Plan 2 (catálogo de entidades) |',
        '`Building` fallarían al dibujar una oficina | Hecho en el plan 2 (Tarea 5) |',
    ),
    (
        'la etapa `route` escribe `igw` aunque la red sea una oficina | Plan 2 |',
        'la etapa `route` escribe `igw` aunque la red sea una oficina | Hecho en el plan 2 (Tareas 1 y 5) |',
    ),
    (
        '| F3 | Faltan tests de escena para el ping a la propia IP y para la IP que nadie tiene | Plan 2 |',
        '| F3 | Faltan tests de escena para el ping a la propia IP y para la IP que nadie tiene | Hecho en el plan 2 (Tarea 5) |',
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 8: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
```

Expected: `git diff` sin salida; `npm run check` PASS: estructura sin quejas (cada carpeta nueva tiene su `CLAUDE.md`; `src/scene/`, `src/scene/entities/`, `src/ui/` y `src/copy/` con 11 archivos), `Found 0 clones`, `Tests 509 passed (509)` y 14 tests de Playwright.

- [ ] **Step 9: Commit**

```bash
git add src tests playwright.config.ts README.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md
git commit -m "feat(ui): open the entity catalog at #/entidades with a Playwright capture"
```

---

### Task 10: Ajustes de la revisión: candado en tinta, firewall seleccionado, antenas del router y sellos cercanos

La revisión del plan, sobre las capturas del ensayo, encontró cuatro problemas de las fichas. Esta tarea **no está ensayada** como las anteriores: no trae scripts de edición, sino lo que cada cambio debe cumplir, sus tests y pistas de código. El implementador escribe el código; el orden es TDD como en el resto del plan.

1. **El candado es un emoji a color.** `PieceLabel` dibuja `🔒`, que el navegador pinta dorado: rompe «tinta y papel». Debe ser un ícono en tinta, como los demás.
2. **El firewall seleccionado casi no se distingue del configurable.** Solo cambia el grosor de la barra. Debe llevar la misma alfombra de papel sombreado que el dispositivo seleccionado.
3. **La etiqueta del router tapa sus antenas.** Las antenas son lo único que separa al router del Internet gateway, y en la página del catálogo quedan debajo de la etiqueta.
4. **Los sellos cercanos se enciman.** `spreadStamps` solo separa los sellos que caen en el mismo punto exacto. Dos sellos en puntos cercanos pero distintos se tapan: por ejemplo, el de un ping a la propia IP (en el umbral, `doorstep`) y el de un paquete que llega a la puerta de ese mismo dispositivo (`door`), que están a 0.45. El plan 3 manda varios paquetes al mismo dispositivo, así que pasará en el capítulo 1.

**Files:**
- Modify: `src/scene/overlay/piece-label.tsx`, `src/scene/entities/firewall.tsx`, `src/scene/layout.ts`, `src/styles.css`, `tests/e2e/snapshots/entities-darwin.png` (se regraba)
- Test: `src/scene/overlay/piece-label.test.tsx`, `src/scene/layout.test.ts`

**Interfaces:**
- Consumes: `InkIcon` y `InkBox` de `@/scene/ink`; `PAPER_SHADE` de `@/scene/theme`; `FirewallPiece` (Tareas 4 y 6), con sus props `selected`, `blocking` y `still`; `LABEL_OFFSET`, `labelOffset`, `STAMP_SPREAD` y `spreadStamps` de `src/scene/layout.ts`; `computeLayout(officeNet(), false)` y `layout.devices[id].door`, `.doorstep` y `.firewall` (Tarea 5).
- Produces: la misma firma de `spreadStamps(points: Vec2[]): Vec2[]`, con otro criterio de grupo. Ninguna firma pública cambia.

- [ ] **Step 1: Escribir los tests**

En `src/scene/overlay/piece-label.test.tsx`, un test nuevo: `draws the lock of a locked piece in ink, not as an emoji`. Debe comprobar tres cosas:
- el botón de una pieza con candado (`SERVER`, que tiene `locked: true`) no contiene el texto `🔒`;
- contiene un `svg` con `aria-hidden="true"`;
- su nombre accesible sigue diciendo «con candado» (`MAP_TEXT.locked`).

En `src/scene/layout.test.ts`, dentro de `describe` de `spreadStamps`, un test nuevo: `moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device`.
- Toma la puerta, el umbral y el firewall de un dispositivo de `computeLayout(officeNet(), false)`.
- Comprueba que, después de `spreadStamps`, cada par de sellos queda al menos a `0.8` (`STAMP_SPREAD`) de distancia.
- El test que ya existe (`[[1, 1], [1, 1], [5, 5]]`: dos sellos en el mismo punto se separan centrados en él y el sello lejano no se mueve) debe seguir pasando sin cambios.

- [ ] **Step 2: Verlos fallar**

```bash
npx vitest run src/scene/overlay/piece-label.test.tsx src/scene/layout.test.ts
```

Expected: FAIL, los 2 tests nuevos. El del candado encuentra `🔒`; el de los sellos encuentra un par a menos de `0.8`.

- [ ] **Step 3: Implementar**

1. **Candado en tinta.**
   - En `piece-label.tsx`, reemplazar `<span aria-hidden="true">🔒</span>` por un candado dibujado con `InkIcon` (de `@/scene/ink`): un cuerpo rectangular y el arco arriba, por ejemplo `<rect x="5" y="11" width="14" height="10" rx="1.5" />` y `<path d="M8 11V7a4 4 0 0 1 8 0v4" />`.
   - El `<span className="sr-only">{MAP_TEXT.locked}</span>` se queda.
   - `.entity-icon` trae `margin-right: 0.35em`, pensado para un ícono antes del texto; el candado va después. Envolverlo en `<span className="map-button__lock">` y agregar en `src/styles.css`, junto a `.map-button__alert`: `.map-button__lock .entity-icon { margin-right: 0; }`.
2. **Alfombra del firewall seleccionado.**
   - En `FirewallPiece`, con `selected`, dibujar debajo de los postes una alfombra de papel sombreado, como la de `DevicePiece`: `InkBox` con `fill={PAPER_SHADE}` y `lineWidth={1}`, de unos `[1.6, 0.04, 0.6]`, a `y` igual a la mitad de su alto.
   - Debe cubrir los dos postes (que están a ±0.6 en x) sin llegar a la alfombra del dispositivo, que termina en z = 0.0 (el firewall está en z = 0.7).
   - El latido de la barra y la barra más gruesa en modo quieto se quedan como están.
   - Actualizar el JSDoc de `FirewallPiece` para que diga que el seleccionado lleva su alfombra.
3. **Antenas a la vista.**
   - En `LABEL_OFFSET` de `layout.ts`, subir la etiqueta del borde (`edge: [0, 2.6, 0]`), por ejemplo a `[0, 3.1, 0]`, hasta que las antenas del router queden enteras debajo de la etiqueta, con aire.
   - Las puntas de las antenas están en y ≈ 2.04.
   - Se comprueba mirando la captura (Step 4), en la celda del router y en la del Internet gateway.
   - `labelOffset` lo usan el mapa y el catálogo, así que el cambio vale para los dos.
4. **Sellos cercanos.**
   - En `spreadStamps`, el grupo deja de ser «mismo punto exacto» (`samePoint`). Pasa a ser «puntos a menos de 1 unidad, encadenados»: si A está cerca de B y B de C, los tres son un grupo.
   - Cada grupo se reparte como hoy: a lo largo de la horizontal de la pantalla (x sube, z baja), separados por `STAMP_SPREAD` y centrados en el promedio de sus puntos.
   - Un sello sin vecinos cercanos no se mueve.
   - Nombrar la distancia con una constante (`STAMP_NEAR = 1`) junto a `STAMP_SPREAD`, y actualizar el JSDoc.

- [ ] **Step 4: Regrabar la captura y mirarla**

La captura cambia a propósito: el candado, la alfombra del firewall seleccionado y la etiqueta del borde.

```bash
npx vitest run
npx playwright test tests/e2e/entities.spec.ts --update-snapshots
```

Expected: `Tests 511 passed (511)` en 44 archivos.

Abrir `tests/e2e/snapshots/entities-darwin.png` con la herramienta Read y comprobar:
- ningún candado dorado: todos en tinta;
- las celdas «seleccionado» de los dos firewalls tienen alfombra y se distinguen de «configurable»;
- las dos antenas del router se ven enteras debajo de su etiqueta;
- nada más cambió.

Si algo no cumple, se corrige y se regraba.

- [ ] **Step 5: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
npm run check
```

Expected: `git diff` sin salida. `npm run check` PASS dos veces seguidas (la captura recién grabada debe ser estable): `Found 0 clones`, `Tests 511 passed (511)` y 14 tests de Playwright, incluido el de etiquetas y sellos sin superponerse del 04-01 (Tarea 6).

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "fix(scene): draw the lock in ink, mark the selected firewall, clear the router's antennas and spread close stamps"
```

---

### Task 11: El nombre propio se ve como etiqueta

Tras jugar con el plan 2, el estudiante pidió que el nombre propio de cada recurso se distinga de la entidad: «quiero que el "servidor1" tenga otro estilo porque es un label. El nombre de la entidad está bien como está». Eligió el estilo B del [prototipo](https://claude.ai/artifact/MDFXJtYLUqMHtJgxxQHQ71): el nombre va en letra monoespaciada, dentro de una cajita sombreada. En AWS, «servidor2» es justamente el valor de la etiqueta `Name` del recurso.

Esta tarea **no está ensayada**: trae lo que el cambio debe cumplir, sus tests y pistas de código. El orden es TDD.

**La regla.** Todo nombre de un recurso o de un actor que el código arma a partir del mundo se marca como nombre:
- la etiqueta del mapa (dispositivo, firewall y actor);
- el título de la tarjeta del firewall y el de la caja de inspección;
- las filas de reglas;
- las líneas de la caja;
- la descripción de un paquete;
- los motivos.

La entidad («Security Group», «Internet gateway», «firewall») sigue en texto normal. Los textos escritos a mano en los incidentes (el mensaje de Lucía, las tareas, las pistas, la explicación y la pregunta final) **no cambian**: quedan como idea en la hoja de ruta.

**Files:**
- Modify:
  - `src/copy/term-text.ts`, `src/copy/packet-labels.ts`, `src/copy/incident-ui.ts`, `src/copy/ui.ts`, `src/copy/index.ts`, `src/copy/CLAUDE.md`
  - `src/levels/04-iaas/shared.ts`
  - `src/game/view/pieces.ts`, `src/game/view/inspection.ts`
  - `src/ui/tagged-text.tsx`
  - `src/scene/overlay/piece-label.tsx`, `src/scene/layout.ts`
  - `src/styles.css`
  - `tests/e2e/snapshots/entities-darwin.png` (se regraba)
- Test:
  - `src/copy/term-text.test.ts`, `src/ui/tagged-text.test.tsx`, `src/scene/overlay/piece-label.test.tsx`
  - y los tests que hoy comparan textos con nombres: `src/copy/reasons.test.ts`, `src/copy/packet-labels.test.ts`, `src/game/view/pieces.test.ts`, `src/game/view/inspection.test.ts` y los que el implementador encuentre con `npx vitest run`.

**Interfaces:**
- Consumes: `TermText`, `parseTermText`, `toPlainText`, `TermSegment` (`src/copy/term-text.ts`); `deviceName`, `endpointName` (`src/copy/packet-labels.ts`); `MAP_TEXT.firewall` (`src/copy/incident-ui.ts`); `PieceLabel` (`src/scene/overlay/piece-label.tsx`); `TaggedText` (`src/ui/tagged-text.tsx`); `LABEL_OFFSET` (`src/scene/layout.ts`).
- Produces:
  - **La marca.** `[[nombre]]` dentro de un `TermText`. `TermSegment` suma la variante `{ kind: 'name'; text: string }`. `parseTermText` la reconoce, y un `[[` o `]]` suelto lanza un error, como hoy un `{{` suelto. `toPlainText` devuelve solo el nombre, sin corchetes.
  - **La función que marca.** `nameTag(name: string): TermText` devuelve `[[${name}]]`. Se exporta desde el barrel de `@/copy`.
  - **Dónde se usa `nameTag`:**
    - `deviceName` y `endpointName` devuelven el nombre ya marcado y pasan a tipar `TermText`; el `'Internet'` de reserva no es un nombre y queda sin marcar;
    - `MAP_TEXT.firewall[kind](name)` marca el nombre;
    - `pieces.ts` marca el nombre del dispositivo y el del actor;
    - `inspection.ts` marca los títulos `own.name` y `who.name`;
    - en `levels/04-iaas/shared.ts`, las fichas que nombran un recurso (`sgServidor1` y cualquier otra con `${S1.id}` o `${S2.id}`) marcan el nombre;
    - `CATALOG` y `MAP_TEXT` en `copy/ui.ts`: los actores del catálogo (`Atacante`, `Tu Mac`) son nombres de personajes y se marcan.
  - **El dibujo.** `TaggedText` dibuja un segmento `name` como `<span className="name-tag">nombre</span>`. `PieceLabel` deja de aplanar la etiqueta con `toPlainText`: dibuja cada segmento, con el nombre en `<span className="name-tag">`. Si todos los segmentos con texto son nombres, el botón suma la clase `map-button--name`.
  - **Atributos.** Todo `TermText` que termina en un atributo (`aria-label`, `title`) pasa por `toPlainText`. Revisar `task-card.tsx`, `stamp.tsx` y cualquier otro con `grep -rn "aria-label={" src`.

- [ ] **Step 1: Escribir los tests**

Cada test nuevo, en su archivo:

1. **`src/copy/term-text.test.ts`:**
   - `parses a resource name as its own segment`: `parseTermText('{{security-group}} [[servidor2]]')` devuelve el término, el espacio como texto y `{ kind: 'name', text: 'servidor2' }`. `toPlainText` de lo mismo es `'Security Group servidor2'`.
   - `rejects a name tag that is not closed`: `parseTermText('[[servidor2')` lanza.
2. **`src/ui/tagged-text.test.tsx`:** `draws a resource name as a name tag`. El texto `servidor1 a [[servidor2]]` deja un solo `.name-tag`, con `servidor2`, y el texto visible completo sigue siendo `servidor1 a servidor2`.
3. **`src/scene/overlay/piece-label.test.tsx`:**
   - `draws the name of a firewall's device as a name tag`: con la pieza `SG_PIECE` y su etiqueta `'{{security-group}} [[servidor2]]'`, el botón tiene un `.name-tag` con `servidor2`, no tiene la clase `map-button--name`, y su nombre accesible sigue siendo `Security Group servidor2`.
   - `a label that is only a name looks like a name tag`: con `SERVER` y la etiqueta `'[[servidor2]]'`, el botón tiene la clase `map-button--name`, y su nombre accesible sigue diciendo `servidor2` y «con candado».

Actualizar las constantes de prueba de `piece-label.test.tsx` (`SERVER`, `SG_PIECE`) para que sus etiquetas lleven la marca.

- [ ] **Step 2: Verlos fallar**

```bash
npx vitest run src/copy/term-text.test.ts src/ui/tagged-text.test.tsx src/scene/overlay/piece-label.test.tsx
```

Expected: FAIL. Los tests nuevos fallan porque `[[` todavía no se reconoce: pasa como texto, o lanza en los que esperan un error.

- [ ] **Step 3: Implementar**

1. **En `term-text.ts`:**
   - Reconocer `[[nombre]]` junto a `{{término}}`, en una sola pasada y en orden de aparición. Ojo: un nombre no puede contener `[`, `]`, `{` ni `}`.
   - Ampliar `BROKEN_TAG` para detectar `[[` o `]]` sueltos.
   - `termsIn` y `unofficialNames` ignoran los segmentos `name`.
   - Exportar `nameTag`, con su JSDoc.
2. **Marcar los nombres** en los lugares que lista «Produces», usando siempre `nameTag`: nada de escribir `[[` a mano fuera de `term-text.ts`.
3. **Estilos en `src/styles.css`:**
   - Junto a `.term`, agregar `.name-tag { font-family: var(--font-mono); font-weight: 400; font-size: 0.82em; line-height: 1.35; border: 1px solid var(--ink-soft); border-radius: 3px; background: var(--paper-shade); padding: 0 0.35em; white-space: nowrap; }`.
   - Junto a `.map-button`:
     - `.map-button--name { border-color: var(--ink-soft); border-radius: 3px; background: var(--paper-shade); }`
     - `.map-button--name .name-tag { border: 0; padding: 0; background: none; font-size: 12px; }`
   - Una etiqueta con candado conserva el borde punteado: `.map-button--locked` ya lo pone.
4. **La etiqueta del actor** (hallazgo del plan 2: tapa la mitad de abajo de su cubo). En `LABEL_OFFSET`, bajar la del actor, hoy `actor: [0, 0.05, 0.7]`, hasta que quede debajo del cubo sin taparlo; por ejemplo, `z` en `1.0`. Se comprueba en la captura y en el 04-01.
5. **Actualizar los tests que comparan textos con nombres** (motivos, descripciones de paquetes, piezas e inspección) para que esperen la marca. Ojo: un test que compara lo que se ve en pantalla (Testing Library, Playwright) no cambia, porque el texto visible es el mismo.
6. **`src/copy/CLAUDE.md`:** documentar la marca `[[nombre]]` y `nameTag`, junto a la de los términos.

- [ ] **Step 4: Verificar y regrabar la captura**

```bash
npx vitest run
npx playwright test entities --update-snapshots=all
```

Expected: Vitest PASS (512 más los tests nuevos de este paso; anotar el número). Abrir con la herramienta Read:
- `tests/e2e/snapshots/entities-darwin.png`;
- una captura del 04-01 en «Sin animaciones», con la tarjeta del Security Group de servidor2 abierta y el mouse sobre su etiqueta (se toma con un script de Playwright en el scratchpad, nunca en los puertos 5173 ni 5180).

En las dos, comprobar:
- `servidor1`, `servidor2` y `Atacante` se ven como etiqueta, con letra monoespaciada y cajita sombreada;
- «Security Group» e «Internet gateway» no cambian;
- la etiqueta del actor ya no tapa su cubo;
- nada se superpone.

- [ ] **Step 5: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
npm run check
npm run check
```

Expected: `git diff` sin salida. `npm run check` PASS dos veces seguidas: 0 clones, 14 tests de Playwright, incluido el de etiquetas y sellos sin superponerse en el 04-01.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(ui): show a resource's own name as a name tag, apart from its entity"
```

---

## Cobertura del spec

| Pide el spec (plan 2) | Dónde |
|------------------------|-------|
| Las piezas pasan a `src/scene/entities/`, un archivo por entidad (`network`, `device`, `firewall`, `edge`, `internet`, `actor`, `packet`, `stamp`), con `index.ts` y `CLAUDE.md` | Tareas 3 y 5 (`internet.tsx`); Desviación 2 |
| Cada archivo exporta la pieza y su ícono 2D (SVG de un color, `currentColor`) | Tarea 8 |
| La pieza no decide nada: recibe la variante y el estado por props | Tareas 3 (sello y actor), 4 (variantes), 6 (estados) y 7 (`flowLook`) |
| `pieces.tsx`, `traffic/packet-run.tsx` y `traffic/stamp.tsx` pasan al catálogo; `traffic/` dibuja con las entidades | Tarea 3 |
| Variantes nuevas: laptop, impresora, router, internet, firewall de laptop | Tareas 4 y 5 |
| Echo Request y Echo Reply se distinguen a la vista; el intruso se reconoce por la forma | Tarea 7 |
| «Perdido», distinto de «bloqueado», en el paquete y en el sello | Tarea 7 |
| Estados de las fichas (candado, configurable, seleccionado, alerta, tiembla, bloqueó algo, en viaje, llegó) | Tareas 6 y 7; tabla «Fichas» |
| Movimiento con versión quieta para «Sin animaciones» | Tareas 6 (borde doble) y 7 (trazo con la figura) |
| Tinta y papel; bermellón solo para el peligro; nunca solo color | Tablas «Fichas»; Tarea 6 (barra en papel en reposo); Tarea 8 (cada variante y estado con su forma) |
| Íconos junto al término en el glosario y en la cabecera de la caja; cada término declara su entidad | Tarea 8 (`TERM_ENTITY`, `Inspection.entity`) |
| Página `/entidades` con cada entidad en sus variantes y estados, sin enlace desde el mapa del curso | Tarea 9 (Desviación 1) |
| Captura de Playwright quieta, con ventana fija; plan B si falla sin motivo | Tarea 9 (Steps 6 y plan B) |
| El capítulo 4 sin cambios en el motor: recorridos dorados idénticos | Todas las tareas (`git diff --exit-code`); Tarea 1 traduce `internet-gateway` |
| F1: posición de los dispositivos de una oficina | Tarea 5 |
| F2: `edge` validado y usado | Tareas 1 (esquema y `route`) y 5 (se dibuja el borde por su variante) |
| F3: tests de escena del ping a la propia IP y de la IP que nadie tiene | Tarea 5 |
| Renombres que el plan 1 dejó para este plan | Tarea 2 |
| Ajustes de la revisión del plan: candado en tinta, firewall seleccionado con alfombra, antenas del router visibles, sellos cercanos separados | Tarea 10 |
| Pedido del estudiante tras jugar: el nombre propio de un recurso se ve como etiqueta (estilo B); la etiqueta del actor no tapa su cubo | Tarea 11 |
