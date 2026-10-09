# Sigue el paquete · Capítulo 1, plan 1 de 3: el modelo genérico de red

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalizar el motor para que un mismo modelo describa la red de una oficina y una VPC de AWS (dispositivos y firewalls con tipo, borde y actores), con los resultados nuevos que pide el capítulo 1, sin ningún cambio visible en el capítulo 4.

**Architecture:**
1. Antes de tocar el modelo, un test guarda como referencia (`golden-traces.json`) el recorrido de cada flujo del 04-01 y el 04-02 y el resultado de la batería de sondas, en el mundo inicial, el resuelto y cada regla de una ficha. Ese archivo no se vuelve a editar: los renombres posteriores se traducen al vocabulario grabado dentro del test.
2. Dos refactors puros cambian los nombres en todas las capas: primero la forma de la red (`instances → devices`, `securityGroups → firewalls`, `sgIds → firewallIds`, `linux → host`, `vpcCidr → cidr`, endpoint `instance → device`, `sgId → firewallId` en jugadas y acciones) y después el vocabulario del recorrido (etapas `firewall-out`, `firewall-in`, `host`; códigos `firewall-*` y `host-*`; `instanceId → deviceId`).
3. `engine/network` suma los tipos (`kind` de red, dispositivo y firewall; `edge`) y las reglas del esquema para una red `office` y para el peer `sg`. `testing` suma la red de oficina del capítulo 1.
4. `engine/simulation` suma los resultados nuevos: perdido en la red, perdido en internet, ping a la propia IP, Echo Reply que llega sin vuelta y bloqueo de un `host-firewall`. Un dispositivo sin firewall recibe todo y no cuenta como apertura. `copy` escribe sus motivos; `scene` y `ui` solo cambian lo que exige el tipo.

**Tech Stack:** Vite 8.3.3, TypeScript 6.0.3, React 19.3, React Three Fiber 9.8.1, drei 10.7.9, three 0.186.1, zod 4.6.5, `@mantine/hooks` 9.7.1, `just-compare` 2.3.0, Vitest 5.0.3 (`toMatchFileSnapshot`), Testing Library + user-event, Playwright 1.64. Sin dependencias nuevas.

**Spec:** `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`. Mandan las secciones "Modelo genérico (motor)", "Decisiones" (fila Arquitectura), "Base de investigación" (afirmaciones verificadas y la simplificación declarada de ARP), "Entrega" (punto 1), "Tests y validación" (Motor) y "Riesgos". Spec anterior, que este amplía: `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`. Plan anterior, ya implementado: `docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md`. Donde el código y los planes viejos difieren, manda el código.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` (raíz del repo). Todos los comandos se corren desde `projects/follow-the-packet/`.
- **Rama.** `feat/live-incidents`. No se crea otra.
- **Punto de partida verificado (2026-10-09):** `npx vitest run` pasa entero, con **410 tests en 39 archivos**. Al cerrar cada tarea: Tareas 1, 2 y 3, 411 tests en 40 archivos; Tarea 4, 429; Tarea 5, 437; Tarea 6, 451.
- **Plan ensayado.** Los bloques de código de este documento se aplicaron en orden, tal cual, sobre una copia limpia del proyecto en el estado de partida: al cerrar cada tarea pasan `tsc`, ESLint, la estructura, jscpd y Vitest con los números de arriba, y `golden-traces.json` no cambia después de la Tarea 1. Playwright no se corrió en el ensayo; lo corre `npm run check` en cada tarea.
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: capas `app → ui → game · scene · storage → levels → copy → engine`, barrels, alias `@/` y nada de `../`. Tope de 12 archivos por carpeta (sin contar `CLAUDE.md`). `src/levels/` ya tiene 12, por eso el test dorado vive en `src/levels/04-iaas/`.
  - `view-renders-domain-result`: `scene/` y `ui/` solo importan tipos de `@/engine`.
  - `pure-domain-core`: el motor no lee reloj, azar ni almacenamiento.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. Texto visible en español solo en `src/copy/` y en los archivos de incidente.
  - `dry`: jscpd con umbral 0 (`npm run dup`). El JSON dorado pasa: cada entrada va en una línea con su propia clave (comprobado con la configuración del proyecto).
  - `user-event-for-interactions`: no hay tests de interacción nuevos en este plan.
- **Sin cambios visibles en el capítulo 4.** Ningún texto, pieza, sello ni recorrido del 04-01 y el 04-02 cambia. Lo garantizan el test dorado (Tarea 1) y los tests de `game`, `ui` y Playwright, que no se tocan salvo por los nombres.
- **El archivo dorado no se edita.** `src/levels/04-iaas/golden-traces.json` se crea en la Tarea 1 y no cambia nunca más. Prohibido `vitest -u`, `--update` y editarlo a mano. Si el test dorado falla, el refactor cambió lo que el capítulo 4 muestra: se corrige el código, nunca el archivo. Cada tarea lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`.
- **Scripts de edición.** Los cambios mecánicos llegan como scripts de Python 3 que se pegan tal cual en la terminal (`python3 - <<'EOF' … EOF`). Cada reemplazo exige encontrar exactamente el texto viejo (o el número exacto de coincidencias) y si no, el script se detiene con `expected … match`. Si eso pasa, el árbol no es el que el plan supone: se para y se avisa, sin arreglar a mano.
- **"Listo"** = `npm run check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea termina con `npm run check` en verde.
- **Commits.** Un commit por tarea, con `git add` de las rutas que la tarea lista. Nunca se agregan `pnpm-lock.yaml`, `pnpm-workspace.yaml` ni nada de `labs/03-ping-connectivity/`.
- Ningún comando `aws`.

## Vocabulario: qué cambia de nombre y qué no

El modelo (lo que decide qué pasa con un paquete) toma nombres genéricos; el vocabulario de la vista se queda como está hasta el plan 2, que trae el catálogo de entidades.

| Antes | Después | Dónde |
|-------|---------|-------|
| `Network.instances` / `Instance` / `instanceSchema` | `Network.devices` / `Device` / `deviceSchema` | modelo, todas las capas |
| `Network.securityGroups` / `SecurityGroup` / `securityGroupSchema` | `Network.firewalls` / `Firewall` / `firewallSchema` | modelo, todas las capas |
| `Network.vpcCidr` | `Network.cidr` | modelo |
| `Instance.sgIds` / `Instance.linux` | `Device.firewallIds` / `Device.host` | modelo |
| endpoint `{ kind: 'instance' }` | `{ kind: 'device' }` | modelo, sondas (`device:servidor1@…` en `flowKey`) |
| acciones y jugadas `sgId` | `firewallId` | `addRule`, `removeRule`, `placeRule` |
| acciones `instanceId` | `deviceId` | `setAppTarget`, `setIgnoreIcmpEcho` |
| `groupsOf`, `source.instance` | `firewallsOf`, `source.device` | contexto de la simulación |
| `ConfigurableParts.linuxSettings` | `hostSettings` | escalera |
| `BarrierCard.sgId`, `canConfigure(session, sgId)` | `firewallId` | `game` |
| `instanceName` (interno de `copy`) | `deviceName` | `copy` |
| `inst()`, `withInstance()` (tests) | `device()`, `withDevice()` | `src/testing` |
| etapas `sg-out`, `sg-in`, `linux` | `firewall-out`, `firewall-in`, `host` | recorrido; archivos `stages/firewall-out.ts`, `firewall-in.ts`, `host.ts` |
| códigos `sg-*-pass/drop`, `linux-*` | `firewall-*-pass/drop`, `host-*` | recorrido y `copy/reasons.ts` |
| `route-no-public-instance`; `route-no-private-instance` | `route-no-public-device`; `route-no-device` (Tarea 5) | recorrido |
| `instanceId` en motivos y `tcpdump` | `deviceId` | recorrido |
| `RuleCheck.sgId`, `PeerContext.sgIds` | `firewallId`, `firewallIds` | reglas |

Se quedan igual: el peer `{ kind: 'sg', sgId }` (es la Source de tipo Security Group), `echoFrom(id, sgId)`, la constante `SG` del capítulo 4, las clases de pieza (`server`, `barrier`, `gateway`, `actor`), `PIECE_ID`, `PIECE_TERM`, `BarrierCard`/`barrierCard`, `intrudedServerIds`, `Layout.instances`/`InstanceSpot`, los componentes `Building`/`Barrier`/`Gateway`, `MAP_TEXT.barrier` e `INSPECTION_TEXT.securityGroups`. Los renombra el plan 2 junto con el catálogo.

## Desviaciones del spec y decisiones (para revisar antes de ejecutar)

1. **Renombres derivados.** El spec lista `instances`, `securityGroups`, `sgIds`, `linux`, las etapas y el endpoint. El plan aplica la misma regla a los nombres que salen de esos (tabla de arriba): `firewallId` en jugadas y acciones (en el 01-04 la jugada actúa sobre un `host-firewall`), `deviceId`, los códigos `firewall-*` y `host-*`, `vpcCidr → cidr` (el modelo del spec ya dice `cidr`).
2. **Resultado nuevo `lost`.** "Perdido en la red" y "perdido en internet" son el `Outcome` `'lost'`; el lugar va en `at` del paso: `office` o `vpc` (el `kind` de la red) y `internet`. El spec no da la línea de «Resultado» de un paquete perdido: el plan escribe `OUTCOME_TEXT.lost` = «Se perdió: no llegó a ningún dispositivo.».
3. **«Desde internet, a una IP privada».** Se decide con los rangos de RFC 1918 (`isPrivateIpv4`), no con el rango de la red: un `10.0.0.5` desde internet también se pierde en internet. El código del motivo sigue siendo `route-private-from-outside`; cambian su texto, su lugar (`internet` en vez de `igw`) y su resultado (`lost` en vez de `timeout`). Ningún flujo del capítulo 4 pasa por ahí; las sondas que pasan tampoco llegaban antes, así que la batería da lo mismo (lo comprueba el test dorado).
4. **Echo Reply que llega.** Es el resultado que ya existe, `arrived-no-reply`, con el paso `host` que lo detiene (`host-unsolicited-icmp`, antes `linux-unsolicited-icmp`) y el texto nuevo del spec. El paquete cuenta como llegado: el sello será ✓.
5. **«Llegó» y «abrir de más» se separan.** Hoy `reachesHost` es «pasó el Security Group de entrada». Un dispositivo sin firewall no tiene ese paso, y el 01-01 necesita ✓ al hacer ping a la impresora. Desde la Tarea 6, `reachesHost` es «el paquete llegó al host» (hay un paso `host`) y la batería de sondas cuenta solo lo que **un firewall dejó entrar**: un dispositivo sin firewall no abre nada. Para el capítulo 4 las dos definiciones coinciden (todas sus instancias tienen Security Group); lo prueba el test dorado.
6. **Un dispositivo sin firewall no se filtra.** Las etapas `firewall-out` y `firewall-in` no agregan paso cuando el dispositivo no tiene firewalls. Para que una instancia EC2 nunca quede abierta por error, el esquema exige al menos un Security Group en cada dispositivo de una VPC (AWS siempre asocia uno).
7. **Validaciones que el spec no lista.** Además de las del spec (red `office` sin `region`, sin `subnets` ni `publicIp`, IP dentro del `cidr`, `cidr` de RFC 1918; peer `sg` solo en un `security-group`):
   - una VPC necesita `region`, al menos una subred y una subred existente por dispositivo (hoy son obligatorias; pasan a opcionales en el tipo);
   - un dispositivo de oficina no tiene subred;
   - los firewalls de un dispositivo son todos del mismo tipo (el motivo nombra ese tipo);
   - la Source `sg` debe apuntar a un firewall de tipo `security-group` (la regla del spec leída en las dos direcciones).

   `edge` no se valida contra `kind`: el spec no lo pide.
8. **Textos de motivos.** Los textos del spec se copian tal cual. Las palabras de términos que llegan en el plan 3 (dispositivo, red, IP, internet, firewall, regla, tráfico) van sin etiqueta; se etiquetan los términos que ya existen (`{{echo-reply}}`, `{{private-ip}}`). Los motivos de «perdido en la red» y «a su propia IP» no nombran el ping: valen para cualquier paquete. Los cuatro textos de un `host-firewall` siguen el patrón de los del Security Group y nombran el dispositivo: «El firewall de X lo deja entrar.», «El firewall de X lo deja salir.», «Se queda en el firewall de X: ninguna regla lo deja salir.» y «Se queda en el firewall de X: ninguna regla lo deja entrar.» (ajuste de la revisión del 2026-10-09; el spec se actualizó igual).
9. **La vista, solo para compilar.** Un paquete perdido en internet se dibuja como hoy uno que muere en el Internet gateway (`GATEWAY_PLACES` en `scene/layout.ts`); un ping a sí mismo sale al camino y vuelve. Un mundo sin `subnets` no dibuja columnas. Las formas reales llegan con el plan 2.
10. **Dispositivo de la oficina hacia afuera.** La regla del spec («el esquema del incidente rechaza un flujo … de la oficina a un destino fuera de ella») es del contrato del incidente y comparte el ayudante con la regla de fichas de `send`. Pasa al plan 3, junto con los incidentes de oficina. En este plan el motor no la necesita.
11. **«Idénticos después del refactor».** El test compara contra el archivo grabado en la Tarea 1 a través de una tabla de renombres declarada en el propio test (`RECORDED_KEYS`, `RECORDED_VALUES`) y de los datos nuevos que la grabación no tenía (`ADDED_KEYS`, solo `firewallKind`). El archivo nunca se regenera.

## Review Focus

1. **Una instancia EC2 que se hace ping a su propia IP privada con su Security Group cerrado:** vuelve la respuesta, sin pasos de firewall. Test: Tarea 5 (`an EC2 instance that pings its own private IP answers even with no inbound rule`).
2. **Un paquete desde internet a una IP privada que no es del rango de la red (`10.0.0.5` contra la oficina `192.168.1.0/24`):** se pierde en internet, no muere en el borde como «IP pública que nadie tiene». Test: Tarea 5 (`a private IP outside the network range is lost in the internet too`).
3. **Un dispositivo sin firewall:** el paquete llega (sello ✓) y la batería de sondas no lo cuenta como apertura, así que en el 01-04 solo mide el firewall de Lucía. Tests: Tarea 6 (`a packet gets to them, but they open nothing` y `a host firewall that lets in more than the expected ping is an opening`).
4. **Una oficina con un rango más ancho que uno privado (`192.168.0.0/15`) o público (`8.8.8.0/24`):** el esquema la rechaza, aunque sus IP caigan en 192.168. Tests: Tarea 4 (`isPrivateCidr` y las filas de `BROKEN`).
5. **Una instancia EC2 sin Security Group:** el esquema la rechaza; sin esa regla, desde la Tarea 6 dejaría entrar todo. Test: Tarea 4 (`an EC2 instance without a Security Group`).

## Árbol al terminar (solo lo nuevo o cambiado)

```
README.md  .claude/rules/english-only.md
src/engine/        CLAUDE.md index.ts
│   network/       CLAUDE.md types.ts schema.ts schema.test.ts actions.ts actions.test.ts app-target.ts app-target.test.ts
│                  cidr.ts cidr.test.ts dns.ts dns.test.ts
│   simulation/    CLAUDE.md trace.ts context.ts rules.ts rules.test.ts simulate.ts simulate.test.ts checkpoints.test.ts
│                  firewall-check.ts (nuevo)
│     stages/      CLAUDE.md route.ts reply.ts host.ts (antes linux.ts) firewall-in.ts (antes sg-in.ts) firewall-out.ts (antes sg-out.ts)
│   exposure/      CLAUDE.md exposure.ts exposure.test.ts
src/testing/       CLAUDE.md fixtures.ts index.ts
src/copy/          packet-labels.ts packet-labels.test.ts reasons.ts reasons.test.ts
src/levels/        incident.ts incident.test.ts ladder.ts ladder.test.ts world.ts world.test.ts
│   04-iaas/       CLAUDE.md shared.ts 01-the-first-ping.ts 02-open-just-enough.ts golden-traces.test.ts (nuevo) golden-traces.json (nuevo)
src/game/          session.ts session.test.ts stars.test.ts tasks.test.ts incidents.test.ts
│   view/          CLAUDE.md barrier.ts piece-id.ts pieces.ts pieces.test.ts inspection.ts inspection.test.ts ladder.test.ts
src/scene/         layout.ts layout.test.ts game-scene.tsx
src/ui/incident/   incident-screen.tsx lucia-card.test.tsx
```

`tests/e2e/` no cambia: no nombra nada del modelo (comprobado con `grep -nE "instance|sgId|linux|server:|barrier:" tests/e2e/*.ts`, que no devuelve nada). Topes: `src/levels/04-iaas/` queda en 5 archivos y `src/engine/simulation/` en 9.

---

### Task 1: Recorridos dorados del capítulo 4

Antes de tocar el modelo se graba lo que el capítulo 4 calcula hoy. El test recorre los dos incidentes del capítulo 4 en su mundo inicial, en su mundo resuelto y en el mundo inicial más cada regla que se arma con una ficha de cada bandeja sobre cada firewall (4 mundos del 04-01 y 12 del 04-02). Por cada mundo guarda el recorrido de cada flujo y la lista de `extraOpenings` con los flujos esperados (los que no son `forbidden`, igual que `isTight`). Son 60 entradas.

Las claves de cada objeto se ordenan (`canonical`) para que el orden en que el motor arma un objeto no importe; el orden de las listas (pasos, comprobaciones, sondas) sí importa y queda fijo. Vitest escribe el archivo la primera vez (`toMatchFileSnapshot`) y desde entonces lo compara línea por línea.

**Files:**
- Create: `src/levels/04-iaas/golden-traces.test.ts`, `src/levels/04-iaas/golden-traces.json` (lo escribe Vitest)
- Modify: `src/levels/04-iaas/CLAUDE.md`

**Interfaces:**
- Consumes: `simulate`, `extraOpenings` y `Network` de `@/engine`; `INCIDENTS` de `@/levels/registry`; `applyMove`, `startWorld`, `solvedWorld` de `@/levels/world`.
- Produces: `golden-traces.json`, la referencia que las Tareas 2 a 6 no pueden cambiar. Las tareas siguientes reemplazan el test entero cuando cambian los nombres.

- [ ] **Step 1: Comprobar el punto de partida**

```bash
git status --short
npx vitest run
npm run check
```

Expected: `git status` solo muestra lo que ya estaba (`labs/03-ping-connectivity/…`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`). Vitest: `Test Files 39 passed (39)` y `Tests 410 passed (410)`. `npm run check` PASS. Si Playwright no encuentra Chromium, correr `npx playwright install chromium` y repetir. Si falla otra cosa, parar y avisar.

- [ ] **Step 2: Escribir el test dorado**

Contenido completo de `src/levels/04-iaas/golden-traces.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
import { applyMove, solvedWorld, startWorld } from '@/levels/world';

const CHAPTER = 4;
const FIXTURE = './golden-traces.json';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
  const placed = start.securityGroups.flatMap((group) =>
    incident.chips.what.flatMap((what) =>
      incident.chips.from.map((from): [string, Network] => [
        `start+${group.id}:${what.id}<-${from.id}`,
        applyMove(start, incident, { type: 'placeRule', sgId: group.id, whatId: what.id, fromId: from.id }),
      ]),
    ),
  );
  return [['start', start], ['solved', solvedWorld(INCIDENTS, incident.id)], ...placed];
}

function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => incident.chapter === CHAPTER).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
      const expected = incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
      return [
        ...incident.flows.map((flow): [string, unknown] => [`${incident.id} ${name} ${flow.id}`, simulate(world, flow.packet)]),
        [`${incident.id} ${name} extra-openings`, extraOpenings(world, expected)],
      ];
    }),
  );
}

function serialize(entries: [string, unknown][]): string {
  return `{\n${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(canonical(value))}`).join(',\n')}\n}\n`;
}

describe('chapter 4 golden traces', () => {
  it('keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model', async () => {
    await expect(serialize(references())).toMatchFileSnapshot(FIXTURE);
  });
});
```

- [ ] **Step 3: Grabar la referencia**

```bash
npx vitest run src/levels/04-iaas
```

Expected: `Snapshots  1 written` y `Tests  1 passed (1)`. Aparece `src/levels/04-iaas/golden-traces.json`. Si la salida dice que falta el snapshot y no lo escribe, la variable `CI` está activa: repetir con `env -u CI npx vitest run src/levels/04-iaas`.

- [ ] **Step 4: Revisar lo grabado**

```bash
node -e "const g=JSON.parse(require('fs').readFileSync('src/levels/04-iaas/golden-traces.json','utf8'));const k=Object.keys(g);console.log(k.length,k[0],'|',k.at(-1));console.log(g['04-01 start ping-servidor1-servidor2'].outcome,g['04-01 solved ping-servidor1-servidor2'].outcome,g['04-02 start+sg-servidor2:all-icmp<-anywhere-ipv4 extra-openings'].length>0)"
head -c 240 src/levels/04-iaas/golden-traces.json
```

Expected:

```
60 04-01 start ping-servidor1-servidor2 | 04-02 start+sg-servidor2:all-icmp<-anywhere-ipv4 extra-openings
timeout replied true
{
"04-01 start ping-servidor1-servidor2": {"destinationId":"servidor2","effectiveSource":"172.31.16.131","outcome":"timeout","resolvedIp":"172.31.38.97","steps":[{"at":"vpc","reason":{"code":"route-private"},"stage":"route","verdict":"pass"
```

El archivo tiene 62 líneas: `{`, una línea por entrada y `}`.

- [ ] **Step 5: Correrlo otra vez: ahora compara**

```bash
npx vitest run src/levels/04-iaas
```

Expected: `Tests  1 passed (1)`, sin `written`.

- [ ] **Step 6: Guía de la carpeta**

En `src/levels/04-iaas/CLAUDE.md`, después de la línea que empieza por `- Texts and chips use official AWS names`, agregar:

```markdown
- `golden-traces.test.ts` keeps the chapter's golden references in `golden-traces.json`: the trace of every flow and the probe battery of every chapter 4 incident, in its start world, its solved world and its start world plus each one-chip rule, recorded before the generic network model. The JSON is never edited by hand or rewritten with `vitest -u`: a difference means the engine changed what chapter 4 shows. When the engine renames something the trace carries, the test maps the new name back to the recorded one.
```

Y la última línea:

```markdown
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`.
```

pasa a:

```markdown
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`; the golden test also imports `@/levels/registry` and `@/levels/world`.
```

- [ ] **Step 7: Verificar**

```bash
npm run check
```

Expected: PASS (Vitest: 411 tests en 40 archivos; jscpd: `Found 0 clones`).

- [ ] **Step 8: Commit**

```bash
git add src/levels/04-iaas
git commit -m "test(levels): record the chapter 4 golden traces before the generic model"
```

---

### Task 2: La red con dispositivos y firewalls

Refactor puro: la forma de la red y todos sus consumidores cambian de nombre (tabla «Vocabulario», todo menos las filas del recorrido). No cambia ningún comportamiento ni texto visible. Lo protegen el test dorado y la suite entera; no hay test nuevo. No se puede partir: a medio renombrar el árbol no compila.

**Files:**
- Modify (motor): `src/engine/index.ts`, `src/engine/network/types.ts`, `src/engine/network/schema.ts`, `src/engine/network/actions.ts`, `src/engine/network/app-target.ts`, `src/engine/network/dns.ts`, `src/engine/simulation/context.ts`, `src/engine/simulation/rules.ts`, `src/engine/simulation/simulate.ts`, `src/engine/simulation/stages/route.ts`, `src/engine/simulation/stages/sg-in.ts`, `src/engine/simulation/stages/sg-out.ts`, `src/engine/simulation/stages/linux.ts`, `src/engine/exposure/exposure.ts`
- Modify (resto): `src/testing/fixtures.ts`, `src/testing/index.ts`, `src/copy/packet-labels.ts`, `src/copy/reasons.ts`, `src/levels/incident.ts`, `src/levels/world.ts`, `src/levels/ladder.ts`, `src/levels/04-iaas/shared.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`, `src/game/session.ts`, `src/game/view/barrier.ts`, `src/game/view/piece-id.ts`, `src/game/view/pieces.ts`, `src/game/view/inspection.ts`, `src/game/view/CLAUDE.md`, `src/scene/layout.ts`, `src/scene/game-scene.tsx`, `src/ui/incident/incident-screen.tsx`
- Test: `src/copy/packet-labels.test.ts`, `src/copy/reasons.test.ts`, `src/engine/network/actions.test.ts`, `src/engine/network/app-target.test.ts`, `src/engine/network/schema.test.ts`, `src/engine/simulation/rules.test.ts`, `src/engine/simulation/simulate.test.ts`, `src/engine/exposure/exposure.test.ts`, `src/levels/incident.test.ts`, `src/levels/ladder.test.ts`, `src/levels/world.test.ts`, `src/levels/04-iaas/golden-traces.test.ts`, `src/game/incidents.test.ts`, `src/game/session.test.ts`, `src/game/stars.test.ts`, `src/game/tasks.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/ladder.test.ts`, `src/game/view/pieces.test.ts`, `src/scene/layout.test.ts`, `src/ui/incident/lucia-card.test.tsx`

**Interfaces:**
- Consumes: el test dorado de la Tarea 1.
- Produces:
  - Tipos de `@/engine`: `Device` (`{ id, name, subnetId, privateIp, publicIp?, firewallIds, host: { ignoreIcmpEcho, listeningTcpPorts }, appTarget? }`), `Firewall` (`{ id, name, inbound, outbound }`), `Network` (`{ region, cidr, subnets, devices, firewalls, actors }`), `Endpoint` (`{ kind: 'device' | 'actor', id }`). `Instance` y `SecurityGroup` dejan de existir.
  - `NetworkAction`: `addRule { firewallId, rule }`, `removeRule { firewallId, ruleId }`, `setAppTarget { deviceId, target }`, `setIgnoreIcmpEcho { deviceId, value }`.
  - `PlayerMove` (`@/levels`): `placeRule { firewallId, whatId, fromId }`, `removeRule { firewallId, ruleId }`.
  - `firewallsOf(net: Network, device: Device): Firewall[]` en `src/engine/simulation/context.ts`; `SimContext.source.device?: Device`.
  - `ConfigurableParts.hostSettings`; `BarrierCard.firewallId`; `canConfigure(session, firewallId)`.
  - `src/testing`: `device(id): Endpoint` y `withDevice(net, id, patch: Partial<Device>)`; `inst` y `withInstance` dejan de existir; `withInbound(net, firewallId, ...rules)`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 1**

```bash
git status --short src
npx vitest run src/levels/04-iaas
```

Expected: `git status` no muestra nada bajo `src/`; el test dorado pasa.

- [ ] **Step 2: Renombrar en el código**

```bash
python3 - <<'EOF'
import re
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


def edit_all(path, pattern, new, count):
    text, found = re.subn(pattern, new, Path(path).read_text())
    if found != count:
        raise SystemExit(f'{path}: expected {count} matches of {pattern!r}, found {found}')
    Path(path).write_text(text)


edit(
    'src/engine/network/actions.ts',
    ("  z.object({ type: z.literal('addRule'), sgId: z.string().min(1),", "  z.object({ type: z.literal('addRule'), firewallId: z.string().min(1),"),
    ("  z.object({ type: z.literal('removeRule'), sgId: z.string().min(1),", "  z.object({ type: z.literal('removeRule'), firewallId: z.string().min(1),"),
    ("z.literal('setAppTarget'), instanceId:", "z.literal('setAppTarget'), deviceId:"),
    ("z.literal('setIgnoreIcmpEcho'), instanceId:", "z.literal('setIgnoreIcmpEcho'), deviceId:"),
    (
        '        securityGroups: net.securityGroups.map((g) => (g.id === action.sgId ? { ...g, inbound: [...g.inbound, action.rule] } : g)),',
        '        firewalls: net.firewalls.map((f) => (f.id === action.firewallId ? { ...f, inbound: [...f.inbound, action.rule] } : f)),',
    ),
    (
        '        securityGroups: net.securityGroups.map((g) =>\n          g.id === action.sgId ? { ...g, inbound: g.inbound.filter((r) => r.id !== action.ruleId) } : g,',
        '        firewalls: net.firewalls.map((f) =>\n          f.id === action.firewallId ? { ...f, inbound: f.inbound.filter((r) => r.id !== action.ruleId) } : f,',
    ),
    (
        '      return { ...net, instances: net.instances.map((i) => (i.id === action.instanceId ? { ...i, appTarget: action.target } : i)) };',
        '      return { ...net, devices: net.devices.map((d) => (d.id === action.deviceId ? { ...d, appTarget: action.target } : d)) };',
    ),
    (
        '        instances: net.instances.map((i) =>\n          i.id === action.instanceId ? { ...i, linux: { ...i.linux, ignoreIcmpEcho: action.value } } : i,\n        ),',
        '        devices: net.devices.map((d) => (d.id === action.deviceId ? { ...d, host: { ...d.host, ignoreIcmpEcho: action.value } } : d)),',
    ),
)
edit(
    'src/engine/network/app-target.ts',
    ("app target of the packet's source instance. */", "app target of the packet's source device. */"),
    (
        "const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;",
        "const source = from.kind === 'device' ? net.devices.find((d) => d.id === from.id) : undefined;",
    ),
    ('needs a source instance with an appTarget', 'needs a source device with an appTarget'),
)
edit(
    'src/engine/network/dns.ts',
    ('  for (const instance of net.instances) {', '  for (const device of net.devices) {'),
    ('    if (instance.publicIp && name === publicDnsName(instance.publicIp, net.region)) {', '    if (device.publicIp && name === publicDnsName(device.publicIp, net.region)) {'),
    ('      return fromInsideVpc ? instance.privateIp : instance.publicIp;', '      return fromInsideVpc ? device.privateIp : device.publicIp;'),
    ('    if (name === privateDnsName(instance.privateIp, net.region)) {', '    if (name === privateDnsName(device.privateIp, net.region)) {'),
    ('      return fromInsideVpc ? instance.privateIp : null;', '      return fromInsideVpc ? device.privateIp : null;'),
)
edit(
    'src/engine/network/schema.ts',
    ('export const securityGroupSchema = z.object({', 'export const firewallSchema = z.object({'),
    ('export const instanceSchema = z.object({', 'export const deviceSchema = z.object({'),
    (
        "  sgIds: z.array(z.string().min(1)),\n  linux: z.object({",
        "  firewallIds: z.array(z.string().min(1)),\n  host: z.object({",
    ),
    ('    vpcCidr: cidr,', '    cidr,'),
    (
        '    instances: z.array(instanceSchema),\n    securityGroups: z.array(securityGroupSchema),',
        '    devices: z.array(deviceSchema),\n    firewalls: z.array(firewallSchema),',
    ),
    (
        '      ...net.instances.map((i) => i.id),\n      ...net.securityGroups.map((g) => g.id),',
        '      ...net.devices.map((d) => d.id),\n      ...net.firewalls.map((f) => f.id),',
    ),
    ("net.vpcCidr)) fail(", "net.cidr)) fail("),
    (
        """    for (const instance of net.instances) {
      const subnet = net.subnets.find((s) => s.id === instance.subnetId);
      if (!subnet) fail(`${instance.id}: subnet ${instance.subnetId} does not exist`);
      else if (!safeInCidr(instance.privateIp, subnet.cidr)) fail(`${instance.id}: ${instance.privateIp} is not in ${subnet.cidr}`);
      for (const sgId of instance.sgIds) {
        if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${instance.id}: security group ${sgId} does not exist`);
      }
    }
    for (const group of net.securityGroups) {
      for (const rule of [...group.inbound, ...group.outbound]) {""",
        """    for (const device of net.devices) {
      const subnet = net.subnets.find((s) => s.id === device.subnetId);
      if (!subnet) fail(`${device.id}: subnet ${device.subnetId} does not exist`);
      else if (!safeInCidr(device.privateIp, subnet.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${subnet.cidr}`);
      for (const firewallId of device.firewallIds) {
        if (!net.firewalls.some((f) => f.id === firewallId)) fail(`${device.id}: firewall ${firewallId} does not exist`);
      }
    }
    for (const firewall of net.firewalls) {
      for (const rule of [...firewall.inbound, ...firewall.outbound]) {""",
    ),
    (
        "          if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${group.id}/${rule.id}: security group ${sgId} does not exist`);",
        "          if (!net.firewalls.some((f) => f.id === sgId)) fail(`${firewall.id}/${rule.id}: security group ${sgId} does not exist`);",
    ),
    ("  z.object({ kind: z.literal('instance'), id: z.string().min(1) }),", "  z.object({ kind: z.literal('device'), id: z.string().min(1) }),"),
)
edit(
    'src/engine/network/types.ts',
    ('  actorSchema,\n  endpointSchema,\n  icmpTypeSchema,\n  instanceSchema,\n', '  actorSchema,\n  deviceSchema,\n  endpointSchema,\n  firewallSchema,\n  icmpTypeSchema,\n'),
    ('  ruleWhatSchema,\n  securityGroupSchema,\n  subnetSchema,', '  ruleWhatSchema,\n  subnetSchema,'),
    (
        'export type SecurityGroup = z.infer<typeof securityGroupSchema>;\nexport type Instance = z.infer<typeof instanceSchema>;',
        'export type Firewall = z.infer<typeof firewallSchema>;\nexport type Device = z.infer<typeof deviceSchema>;',
    ),
)
edit(
    'src/engine/index.ts',
    (
        "export type { Actor, Endpoint, Instance, Network, PacketSpec, Rule, RulePeer, RuleWhat, SecurityGroup, Subnet } from './network/types';",
        "export type { Actor, Device, Endpoint, Firewall, Network, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from './network/types';",
    ),
)
edit(
    'src/engine/simulation/context.ts',
    (
        "import type { Endpoint, Instance, Network, PacketSpec, SecurityGroup } from '@/engine/network/types';",
        "import type { Device, Endpoint, Firewall, Network, PacketSpec } from '@/engine/network/types';",
    ),
    ('inside: boolean; instance?: Instance };', 'inside: boolean; device?: Device };'),
    ('  dest?: Instance;', '  dest?: Device;'),
    (
        'export function groupsOf(net: Network, instance: Instance): SecurityGroup[] {\n  return instance.sgIds.flatMap((id) => net.securityGroups.filter((g) => g.id === id));',
        'export function firewallsOf(net: Network, device: Device): Firewall[] {\n  return device.firewallIds.flatMap((id) => net.firewalls.filter((f) => f.id === id));',
    ),
)
edit(
    'src/engine/simulation/rules.ts',
    (
        "import type { PacketSpec, RulePeer, RuleWhat, SecurityGroup } from '@/engine/network/types';",
        "import type { Firewall, PacketSpec, RulePeer, RuleWhat } from '@/engine/network/types';",
    ),
    ('every rule of the given groups;', 'every rule of the given firewalls;'),
    ('  groups: SecurityGroup[],', '  firewalls: Firewall[],'),
    (
        '  const checks = groups.flatMap((group) =>\n    group[direction].map((rule) => ({\n      sgId: group.id,',
        '  const checks = firewalls.flatMap((firewall) =>\n    firewall[direction].map((rule) => ({\n      sgId: firewall.id,',
    ),
)
edit(
    'src/engine/simulation/simulate.ts',
    (
        """  if (from.kind === 'instance') {
    const instance = net.instances.find((i) => i.id === from.id);
    if (!instance) throw new Error(`unknown instance ${from.id}`);
    return { endpoint: from, id: instance.id, ip: instance.privateIp, inside: true, instance };""",
        """  if (from.kind === 'device') {
    const device = net.devices.find((d) => d.id === from.id);
    if (!device) throw new Error(`unknown device ${from.id}`);
    return { endpoint: from, id: device.id, ip: device.privateIp, inside: true, device };""",
    ),
)
edit(
    'src/engine/simulation/stages/route.ts',
    ('if (ipInCidr(destIp, net.vpcCidr)) {', 'if (ipInCidr(destIp, net.cidr)) {'),
    ('    const dest = net.instances.find((i) => i.privateIp === destIp);', '    const dest = net.devices.find((d) => d.privateIp === destIp);'),
    ('  const dest = net.instances.find((i) => i.publicIp === destIp);', '  const dest = net.devices.find((d) => d.publicIp === destIp);'),
    ('  if (source.instance) {\n    const publicIp = source.instance.publicIp;', '  if (source.device) {\n    const publicIp = source.device.publicIp;'),
    ('instanceId: source.instance.id } });', 'instanceId: source.device.id } });'),
)
edit(
    'src/engine/simulation/stages/sg-in.ts',
    ('import { CONTINUE, groupsOf, stop,', 'import { CONTINUE, firewallsOf, stop,'),
    (
        "const sgIds = ctx.path === 'private' && ctx.source.instance ? ctx.source.instance.sgIds : [];",
        "const sgIds = ctx.path === 'private' && ctx.source.device ? ctx.source.device.firewallIds : [];",
    ),
    ('checkRules(groupsOf(ctx.net, dest),', 'checkRules(firewallsOf(ctx.net, dest),'),
)
edit(
    'src/engine/simulation/stages/sg-out.ts',
    ('import { CONTINUE, groupsOf, stop,', 'import { CONTINUE, firewallsOf, stop,'),
    ('  const instance = ctx.source.instance;\n  if (!instance) return CONTINUE;', '  const device = ctx.source.device;\n  if (!device) return CONTINUE;'),
    ("checkRules(groupsOf(ctx.net, instance), 'outbound',", "checkRules(firewallsOf(ctx.net, device), 'outbound',"),
    ("    sgIds: ctx.path === 'private' ? dest.sgIds : [],", "    sgIds: ctx.path === 'private' ? dest.firewallIds : [],"),
    ('    at: instance.id,', '    at: device.id,'),
    ('instanceId: instance.id },', 'instanceId: device.id },'),
)
edit(
    'src/engine/simulation/stages/linux.ts',
    ('    if (dest.linux.ignoreIcmpEcho) {', '    if (dest.host.ignoreIcmpEcho) {'),
    ('    if (!dest.linux.listeningTcpPorts.includes(p.port!)) {', '    if (!dest.host.listeningTcpPorts.includes(p.port!)) {'),
)
edit(
    'src/engine/exposure/exposure.ts',
    ('from every instance, to every IP of every other instance. */', 'from every device, to every IP of every other device. */'),
    ("    ...net.instances.map((i): Endpoint => ({ kind: 'instance', id: i.id })),", "    ...net.devices.map((d): Endpoint => ({ kind: 'device', id: d.id })),"),
    (
        "    for (const target of net.instances) {\n      if (from.kind === 'instance' && from.id === target.id) continue;",
        "    for (const target of net.devices) {\n      if (from.kind === 'device' && from.id === target.id) continue;",
    ),
)
edit(
    'src/testing/fixtures.ts',
    ("import type { Endpoint, Instance, Network, PacketSpec, Rule } from '@/engine';", "import type { Device, Endpoint, Network, PacketSpec, Rule } from '@/engine';"),
    ("export const inst = (id: string): Endpoint => ({ kind: 'instance', id });", "export const device = (id: string): Endpoint => ({ kind: 'device', id });"),
    ('lab 03 network: two servers in different', 'lab 03 network: two EC2 instances in different'),
    ("    vpcCidr: '172.31.0.0/16',", "    cidr: '172.31.0.0/16',"),
    ('    instances: [', '    devices: ['),
    ("        sgIds: ['sg-servidor1'],\n        linux: {", "        firewallIds: ['sg-servidor1'],\n        host: {"),
    ("        sgIds: ['sg-servidor2'],\n        linux: {", "        firewallIds: ['sg-servidor2'],\n        host: {"),
    ('    securityGroups: [', '    firewalls: ['),
    (
        'export function withInbound(net: Network, sgId: string, ...rules: Rule[]): Network {\n  return {\n    ...net,\n    securityGroups: net.securityGroups.map((g) => (g.id === sgId ? { ...g, inbound: [...g.inbound, ...rules] } : g)),',
        'export function withInbound(net: Network, firewallId: string, ...rules: Rule[]): Network {\n  return {\n    ...net,\n    firewalls: net.firewalls.map((f) => (f.id === firewallId ? { ...f, inbound: [...f.inbound, ...rules] } : f)),',
    ),
    (
        'export function withInstance(net: Network, id: string, patch: Partial<Instance>): Network {\n  return { ...net, instances: net.instances.map((i) => (i.id === id ? { ...i, ...patch } : i)) };',
        'export function withDevice(net: Network, id: string, patch: Partial<Device>): Network {\n  return { ...net, devices: net.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) };',
    ),
)
edit(
    'src/testing/index.ts',
    (
        "export { ATTACKER_IP, YOU_IP, actor, allOut, echoFrom, inst, lab03Net, ping, sshFromYou, tcp, withInbound, withInstance } from './fixtures';",
        "export { ATTACKER_IP, YOU_IP, actor, allOut, device, echoFrom, lab03Net, ping, sshFromYou, tcp, withDevice, withInbound } from './fixtures';",
    ),
)
edit(
    'src/copy/packet-labels.ts',
    (
        'export function instanceName(net: Network, instanceId: string): string {\n  return net.instances.find((i) => i.id === instanceId)?.name ?? instanceId;',
        'export function deviceName(net: Network, deviceId: string): string {\n  return net.devices.find((d) => d.id === deviceId)?.name ?? deviceId;',
    ),
    ("  if (endpoint.kind === 'instance') return instanceName(net, endpoint.id);", "  if (endpoint.kind === 'device') return deviceName(net, endpoint.id);"),
    ('naming the server the trace reached', 'naming the device the trace reached'),
    ('  const to = trace.destinationId ? instanceName(net, trace.destinationId) : packet.to;', '  const to = trace.destinationId ? deviceName(net, trace.destinationId) : packet.to;'),
)
edit_all('src/copy/reasons.ts', r'\binstanceName\b', 'deviceName', 10)
edit(
    'src/levels/incident.ts',
    (
        "  z.object({ type: z.literal('placeRule'), sgId: id, whatId: id, fromId: id }),\n  z.object({ type: z.literal('removeRule'), sgId: id, ruleId: id }),",
        "  z.object({ type: z.literal('placeRule'), firewallId: id, whatId: id, fromId: id }),\n  z.object({ type: z.literal('removeRule'), firewallId: id, ruleId: id }),",
    ),
)
edit(
    'src/levels/world.ts',
    ('(unknown Security Group or chip,', '(unknown firewall or chip,'),
    (
        """  const group = world.securityGroups.find((g) => g.id === move.sgId);
  if (!group) return world;
  if (move.type === 'removeRule') {
    return group.inbound.some((r) => r.id === move.ruleId) ? applyAction(world, move) : world;
  }
  const rule = ruleFromChips(incident, move.whatId, move.fromId);
  if (!rule || group.inbound.some((r) => sameRule(r, rule))) return world;
  return applyAction(world, { type: 'addRule', sgId: move.sgId, rule });""",
        """  const firewall = world.firewalls.find((f) => f.id === move.firewallId);
  if (!firewall) return world;
  if (move.type === 'removeRule') {
    return firewall.inbound.some((r) => r.id === move.ruleId) ? applyAction(world, move) : world;
  }
  const rule = ruleFromChips(incident, move.whatId, move.fromId);
  if (!rule || firewall.inbound.some((r) => sameRule(r, rule))) return world;
  return applyAction(world, { type: 'addRule', firewallId: move.firewallId, rule });""",
    ),
)
edit(
    'src/levels/ladder.ts',
    ('  linuxSettings: boolean;', '  hostSettings: boolean;'),
    ("    linuxSettings: known.has('icmp-echo-ignore-all'),", "    hostSettings: known.has('icmp-echo-ignore-all'),"),
)
edit(
    'src/levels/04-iaas/shared.ts',
    ("import type { Endpoint, Instance, Network, PacketSpec, Rule } from '@/engine';", "import type { Device, Endpoint, Network, PacketSpec, Rule } from '@/engine';"),
    ('subnetId: string, sgId: string): Instance {', 'subnetId: string, sgId: string): Device {'),
    ('    sgIds: [sgId],\n    linux: {', '    firewallIds: [sgId],\n    host: {'),
    ('  vpcCidr: VPC_CIDR,', '  cidr: VPC_CIDR,'),
    ('  instances: [server(S1,', '  devices: [server(S1,'),
    ('  securityGroups: [', '  firewalls: ['),
    ("packet: ping({ kind: 'instance', id: S1.id }, S2.private) },", "packet: ping({ kind: 'device', id: S1.id }, S2.private) },"),
)
edit('src/levels/04-iaas/01-the-first-ping.ts', ("{ type: 'placeRule', sgId: SG.servidor2,", "{ type: 'placeRule', firewallId: SG.servidor2,"))
edit_all('src/levels/04-iaas/02-open-just-enough.ts', r'sgId: SG\.servidor2', 'firewallId: SG.servidor2', 4)
edit(
    'src/game/session.ts',
    (
        """/** True when an instance has this Security Group, so it is on the map, and the ladder lets the player change its inbound rules. */
export function canConfigure(session: Session, sgId: string): boolean {
  return session.parts.inboundRules && session.world.instances.some((instance) => instance.sgIds.includes(sgId));""",
        """/** True when a device has this firewall, so it is on the map, and the ladder lets the player change its inbound rules. */
export function canConfigure(session: Session, firewallId: string): boolean {
  return session.parts.inboundRules && session.world.devices.some((device) => device.firewallIds.includes(firewallId));""",
    ),
    ('!canConfigure(state, action.sgId)', '!canConfigure(state, action.firewallId)'),
)
edit(
    'src/game/view/barrier.ts',
    ("import type { SecurityGroup } from '@/engine';", "import type { Firewall } from '@/engine';"),
    ('  sgId: string;\n  title: TermText;', '  firewallId: string;\n  title: TermText;'),
    ('/** Names each inbound rule of the Security Group with', '/** Names each inbound rule of the firewall with'),
    (
        'export function ruleRows(group: SecurityGroup, incident: Incident): RuleRow[] {\n  return group.inbound.map((rule) => {',
        'export function ruleRows(firewall: Firewall, incident: Incident): RuleRow[] {\n  return firewall.inbound.map((rule) => {',
    ),
    ('throw new Error(`${group.id}/${rule.id} has no chips', 'throw new Error(`${firewall.id}/${rule.id} has no chips'),
    (
        '/** Returns what the task card of a Security Group shows, or null when the piece is not a Security Group on the map. */',
        '/** Returns what the task card of a firewall shows, or null when the piece is not a firewall on the map. */',
    ),
    (
        "  const group = ref?.kind === 'barrier' ? session.world.securityGroups.find((g) => g.id === ref.id) : undefined;\n  return group ? { sgId: group.id, title: MAP_TEXT.barrier(group.name), rules: ruleRows(group, session.incident) } : null;",
        "  const firewall = ref?.kind === 'barrier' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;\n  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.barrier(firewall.name), rules: ruleRows(firewall, session.incident) } : null;",
    ),
)
edit(
    'src/game/view/piece-id.ts',
    (
        '  server: (instanceId: string) => `server${SEPARATOR}${instanceId}`,\n  barrier: (sgId: string) => `barrier${SEPARATOR}${sgId}`,',
        '  server: (deviceId: string) => `server${SEPARATOR}${deviceId}`,\n  barrier: (firewallId: string) => `barrier${SEPARATOR}${firewallId}`,',
    ),
)
edit(
    'src/game/view/pieces.ts',
    (
        """  return world.securityGroups.flatMap((group): PieceView[] => {
    const owner = world.instances.find((instance) => instance.sgIds.includes(group.id));
    if (!owner) return [];
    const configurable = canConfigure(session, group.id);""",
        """  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);""",
    ),
    (
        "      { id: PIECE_ID.barrier(group.id), kind: 'barrier', anchorId: owner.id, term: PIECE_TERM.barrier, label: MAP_TEXT.barrier(group.name),",
        "      { id: PIECE_ID.barrier(firewall.id), kind: 'barrier', anchorId: owner.id, term: PIECE_TERM.barrier, label: MAP_TEXT.barrier(firewall.name),",
    ),
    (
        "    ...world.instances.map(\n      (instance): PieceView => ({ id: PIECE_ID.server(instance.id), kind: 'server', anchorId: instance.id, term: PIECE_TERM.server, label: instance.name, locked: !parts.linuxSettings,",
        "    ...world.devices.map(\n      (device): PieceView => ({ id: PIECE_ID.server(device.id), kind: 'server', anchorId: device.id, term: PIECE_TERM.server, label: device.name, locked: !parts.hostSettings,",
    ),
)
edit(
    'src/game/view/inspection.ts',
    (
        "import { privateDnsName, publicDnsName, stopStep, type Actor, type Instance, type PacketSpec, type SecurityGroup } from '@/engine';",
        "import { privateDnsName, publicDnsName, stopStep, type Actor, type Device, type Firewall, type PacketSpec } from '@/engine';",
    ),
    (
        'function server(session: Session, instance: Instance): Inspection {\n  const { region, securityGroups } = session.world;\n  const groups = securityGroups.filter((group) => instance.sgIds.includes(group.id));\n  return {\n    title: instance.name,',
        'function server(session: Session, device: Device): Inspection {\n  const { region, firewalls } = session.world;\n  const own = firewalls.filter((firewall) => device.firewallIds.includes(firewall.id));\n  return {\n    title: device.name,',
    ),
    ('lines: () => [instance.privateIp] },', 'lines: () => [device.privateIp] },'),
    ('lines: () => [instance.publicIp ?? INSPECTION_TEXT.none] },', 'lines: () => [device.publicIp ?? INSPECTION_TEXT.none] },'),
    (
        'lines: () => [...(instance.publicIp ? [publicDnsName(instance.publicIp, region)] : []), privateDnsName(instance.privateIp, region)],',
        'lines: () => [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)],',
    ),
    ('lines: () => [instance.linux.ignoreIcmpEcho ?', 'lines: () => [device.host.ignoreIcmpEcho ?'),
    ('lines: () => groups.map((group) => MAP_TEXT.barrier(group.name)) },', 'lines: () => own.map((firewall) => MAP_TEXT.barrier(firewall.name)) },'),
    (
        'function barrier(session: Session, group: SecurityGroup): Inspection {\n  const rows = ruleRows(group, session.incident);\n  return {\n    title: MAP_TEXT.barrier(group.name),',
        'function barrier(session: Session, firewall: Firewall): Inspection {\n  const rows = ruleRows(firewall, session.incident);\n  return {\n    title: MAP_TEXT.barrier(firewall.name),',
    ),
    ('      const found = world.instances.find((instance) => instance.id === ref.id);', '      const found = world.devices.find((device) => device.id === ref.id);'),
    ('      const found = world.securityGroups.find((group) => group.id === ref.id);', '      const found = world.firewalls.find((firewall) => firewall.id === ref.id);'),
)
edit(
    'src/scene/layout.ts',
    ('the instances of each subnet in a row,', 'the devices of each subnet in a row,'),
    ('net.instances.filter((i) => i.subnetId === s.id).length', 'net.devices.filter((d) => d.subnetId === s.id).length'),
    (
        '    const own = net.instances.filter((i) => i.subnetId === subnet.id);\n    own.forEach((instance, k) => {',
        '    const own = net.devices.filter((d) => d.subnetId === subnet.id);\n    own.forEach((device, k) => {',
    ),
    ('      instances[instance.id] = {', '      instances[device.id] = {'),
    (
        '/** Returns where the task card of the Security Group of this instance is anchored. */\nexport function cardAnchorPosition(instanceId: string, layout: Layout): Vec3 {\n  const [x, z] = layout.instances[instanceId].barrier;',
        '/** Returns where the task card of the firewall of this device is anchored. */\nexport function cardAnchorPosition(deviceId: string, layout: Layout): Vec3 {\n  const [x, z] = layout.instances[deviceId].barrier;',
    ),
    ("  const source = from.kind === 'instance' ? layout.instances[from.id] : undefined;", "  const source = from.kind === 'device' ? layout.instances[from.id] : undefined;"),
)
edit(
    'src/scene/game-scene.tsx',
    (
        '          {world.instances.map((instance) => (\n            <Building key={instance.id} spot={layout.instances[instance.id]} shaking={intrudedServerIds.has(instance.id)} still={still} />',
        '          {world.devices.map((device) => (\n            <Building key={device.id} spot={layout.instances[device.id]} shaking={intrudedServerIds.has(device.id)} still={still} />',
    ),
)
edit(
    'src/ui/incident/incident-screen.tsx',
    ('                key={card.sgId}', '                key={card.firewallId}'),
    ("dispatch({ type: 'placeRule', sgId: card.sgId, whatId, fromId })", "dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })"),
    ("dispatch({ type: 'removeRule', sgId: card.sgId, ruleId })", "dispatch({ type: 'removeRule', firewallId: card.firewallId, ruleId })"),
)
print('sources renamed')
EOF
```

Expected: `sources renamed`.

- [ ] **Step 3: Renombrar en los tests**

```bash
python3 - <<'EOF'
import re
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


def edit_all(path, pattern, new, count):
    text, found = re.subn(pattern, new, Path(path).read_text())
    if found != count:
        raise SystemExit(f'{path}: expected {count} matches of {pattern!r}, found {found}')
    Path(path).write_text(text)


INST_CALLS = {
    'src/copy/packet-labels.test.ts': 2,
    'src/copy/reasons.test.ts': 1,
    'src/scene/layout.test.ts': 2,
    'src/levels/incident.test.ts': 1,
    'src/engine/network/app-target.test.ts': 3,
    'src/engine/exposure/exposure.test.ts': 8,
    'src/engine/simulation/simulate.test.ts': 15,
}
for path, count in INST_CALLS.items():
    edit_all(path, r'\binst\(', 'device(', count)

edit('src/copy/packet-labels.test.ts', ("import { actor, inst, lab03Net, ping } from '@/testing';", "import { actor, device, lab03Net, ping } from '@/testing';"))
edit('src/copy/reasons.test.ts', ("import { inst, lab03Net, ping } from '@/testing';", "import { device, lab03Net, ping } from '@/testing';"))
edit('src/scene/layout.test.ts', ("import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '@/testing';", "import { actor, device, echoFrom, lab03Net, ping, withInbound } from '@/testing';"))
edit(
    'src/levels/incident.test.ts',
    ("import { actor, inst, lab03Net, ping } from '@/testing';", "import { actor, device, lab03Net, ping } from '@/testing';"),
    ("  solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],", "  solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],"),
    ("{ solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }", "{ solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }"),
)
edit(
    'src/engine/network/app-target.test.ts',
    ("import { inst, lab03Net, ping, withInstance } from '@/testing';", "import { device, lab03Net, ping, withDevice } from '@/testing';"),
    ('with the target of the source instance', 'with the target of the source device'),
    ("const net = withInstance(lab03Net(), 'servidor1',", "const net = withDevice(lab03Net(), 'servidor1',"),
    ('fails when the source instance has no app target', 'fails when the source device has no app target'),
)
edit(
    'src/engine/network/schema.test.ts',
    ("import { lab03Net, withInstance } from '@/testing';", "import { lab03Net, withDevice } from '@/testing';"),
    ("const bad = withInstance(lab03Net(), 'servidor1', { privateIp:", "const bad = withDevice(lab03Net(), 'servidor1', { privateIp:"),
    (
        "  it('rejects a security group that does not exist', () => {\n    const bad = withInstance(lab03Net(), 'servidor1', { sgIds: ['sg-fantasma'] });",
        "  it('rejects a firewall that does not exist', () => {\n    const bad = withDevice(lab03Net(), 'servidor1', { firewallIds: ['sg-fantasma'] });",
    ),
    ("    const from = { kind: 'instance', id: 'servidor1' } as const;", "    const from = { kind: 'device', id: 'servidor1' } as const;"),
)
edit(
    'src/engine/network/actions.test.ts',
    (
        'const inboundIds = (net: ReturnType<typeof lab03Net>, sgId: string) => net.securityGroups.find((g) => g.id === sgId)?.inbound.map((r) => r.id);',
        'const inboundIds = (net: ReturnType<typeof lab03Net>, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.inbound.map((r) => r.id);',
    ),
    ("{ type: 'addRule', sgId: 'sg-servidor2', rule:", "{ type: 'addRule', firewallId: 'sg-servidor2', rule:"),
    ("{ type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' }", "{ type: 'removeRule', firewallId: 'sg-servidor2', ruleId: 'ssh-2' }"),
    ('changes an app target and the Linux echo setting', 'changes an app target and the host echo setting'),
    ("{ type: 'setAppTarget', instanceId: 'servidor1',", "{ type: 'setAppTarget', deviceId: 'servidor1',"),
    ("expect(targeted.instances.find((i) => i.id === 'servidor1')?.appTarget)", "expect(targeted.devices.find((d) => d.id === 'servidor1')?.appTarget)"),
    ("{ type: 'setIgnoreIcmpEcho', instanceId: 'servidor2',", "{ type: 'setIgnoreIcmpEcho', deviceId: 'servidor2',"),
    ("expect(ignoring.instances.find((i) => i.id === 'servidor2')?.linux.ignoreIcmpEcho)", "expect(ignoring.devices.find((d) => d.id === 'servidor2')?.host.ignoreIcmpEcho)"),
)
edit(
    'src/engine/simulation/rules.test.ts',
    ("import type { SecurityGroup } from '@/engine/network/types';", "import type { Firewall } from '@/engine/network/types';"),
    ('  const groups: SecurityGroup[] = [', '  const firewalls: Firewall[] = ['),
    ("const result = checkRules(groups, 'inbound', echoRequest, { ip: '172.31.16.131',", "const result = checkRules(firewalls, 'inbound', echoRequest, { ip: '172.31.16.131',"),
    ("const result = checkRules(groups, 'inbound', echoRequest, { ip: '198.51.100.7',", "const result = checkRules(firewalls, 'inbound', echoRequest, { ip: '198.51.100.7',"),
)
edit(
    'src/engine/simulation/simulate.test.ts',
    (
        "import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound, withInstance } from '@/testing';",
        "import { actor, device, echoFrom, lab03Net, ping, tcp, withDevice, withInbound } from '@/testing';",
    ),
    ("withInstance(withEcho(), 'servidor2', { linux: { ignoreIcmpEcho: true,", "withDevice(withEcho(), 'servidor2', { host: { ignoreIcmpEcho: true,"),
    ("withInstance(lab03Net(), 'servidor2', { sgIds: ['sg-servidor2', 'sg-default'] });", "withDevice(lab03Net(), 'servidor2', { firewallIds: ['sg-servidor2', 'sg-default'] });"),
    ("withInstance(onlyServer2, 'servidor1', { sgIds: ['sg-servidor1', 'sg-default'] });", "withDevice(onlyServer2, 'servidor1', { firewallIds: ['sg-servidor1', 'sg-default'] });"),
    ("withInstance(withEcho(), 'servidor1', { publicIp: undefined });", "withDevice(withEcho(), 'servidor1', { publicIp: undefined });"),
    (
        "      securityGroups: withEcho().securityGroups.map((g) => (g.id === 'sg-servidor1' ? { ...g, outbound: [] } : g)),",
        "      firewalls: withEcho().firewalls.map((f) => (f.id === 'sg-servidor1' ? { ...f, outbound: [] } : f)),",
    ),
)
edit(
    'src/engine/exposure/exposure.test.ts',
    ("import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound } from '@/testing';", "import { actor, device, echoFrom, lab03Net, ping, tcp, withInbound } from '@/testing';"),
    ("toBe('instance:servidor1@172.31.16.131>servidor2@172.31.38.97:icmp:8');", "toBe('device:servidor1@172.31.16.131>servidor2@172.31.38.97:icmp:8');"),
    ("  it('an instance is not probed from itself', () => {", "  it('a device is not probed from itself', () => {"),
    ("p.from.kind === 'instance' && p.from.id === 'servidor1'", "p.from.kind === 'device' && p.from.id === 'servidor1'"),
)
edit(
    'src/levels/ladder.test.ts',
    ('const ONLY_INBOUND = { inboundRules: true, outboundRules: false, linuxSettings: false };', 'const ONLY_INBOUND = { inboundRules: true, outboundRules: false, hostSettings: false };'),
    ("outbound rules and the Linux setting open with their own terms", "outbound rules and the host setting open with their own terms"),
    ('{ inboundRules: true, outboundRules: true, linuxSettings: true }', '{ inboundRules: true, outboundRules: true, hostSettings: true }'),
)
edit(
    'src/levels/world.test.ts',
    (
        'function inbound(world: Network, sgId: string) {\n  return world.securityGroups.find((g) => g.id === sgId)?.inbound ?? [];',
        'function inbound(world: Network, firewallId: string) {\n  return world.firewalls.find((f) => f.id === firewallId)?.inbound ?? [];',
    ),
    (
        '      for (const group of world.securityGroups) {\n        for (const rule of group.inbound) expect(chipsOfRule(incident(id), rule), `${group.id}/${rule.id}`).not.toBeNull();',
        '      for (const firewall of world.firewalls) {\n        for (const rule of firewall.inbound) expect(chipsOfRule(incident(id), rule), `${firewall.id}/${rule.id}`).not.toBeNull();',
    ),
    ("{ ...place, sgId: 'sg-ghost' }", "{ ...place, firewallId: 'sg-ghost' }"),
)
edit_all('src/levels/world.test.ts', r'sgId: SG\.servidor2', 'firewallId: SG.servidor2', 4)
MOVES = {
    'src/game/incidents.test.ts': 4,
    'src/game/stars.test.ts': 1,
    'src/game/tasks.test.ts': 1,
    'src/game/view/inspection.test.ts': 1,
    'src/game/view/pieces.test.ts': 1,
    'src/ui/incident/lucia-card.test.tsx': 2,
    'src/game/session.test.ts': 1,
}
for path, count in MOVES.items():
    edit_all(path, r'\bsgId: SG\.', 'firewallId: SG.', count)
edit(
    'src/game/session.test.ts',
    (
        "const place = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', sgId, whatId, fromId });",
        "const place = (firewallId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', firewallId, whatId, fromId });",
    ),
    (
        "const remove = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', sgId, ruleId: ruleIdFor(whatId, fromId) });",
        "const remove = (firewallId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', firewallId, ruleId: ruleIdFor(whatId, fromId) });",
    ),
)
edit(
    'src/game/view/ladder.test.ts',
    ("{ type: 'placeRule', sgId: barrier.sgId, whatId: what.id, fromId: from.id }", "{ type: 'placeRule', firewallId: barrier.firewallId, whatId: what.id, fromId: from.id }"),
)
print('tests renamed')
EOF
```

Expected: `tests renamed`.

- [ ] **Step 4: El test dorado con los nombres nuevos**

Reemplazar entero `src/levels/04-iaas/golden-traces.test.ts`. Cambian `worlds` (recorre `start.firewalls` y la jugada lleva `firewallId`) y aparece `recorded`, que devuelve el endpoint `device` al `instance` grabado:

```ts
import { describe, expect, it } from 'vitest';
import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
import { applyMove, solvedWorld, startWorld } from '@/levels/world';

const CHAPTER = 4;
const FIXTURE = './golden-traces.json';
const RECORDED_VALUES = new Map([['device', 'instance']]);

function recorded(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(recorded);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, recorded(inner)]));
  }
  return typeof value === 'string' ? (RECORDED_VALUES.get(value) ?? value) : value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
  const placed = start.firewalls.flatMap((firewall) =>
    incident.chips.what.flatMap((what) =>
      incident.chips.from.map((from): [string, Network] => [
        `start+${firewall.id}:${what.id}<-${from.id}`,
        applyMove(start, incident, { type: 'placeRule', firewallId: firewall.id, whatId: what.id, fromId: from.id }),
      ]),
    ),
  );
  return [['start', start], ['solved', solvedWorld(INCIDENTS, incident.id)], ...placed];
}

function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => incident.chapter === CHAPTER).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
      const expected = incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
      return [
        ...incident.flows.map((flow): [string, unknown] => [`${incident.id} ${name} ${flow.id}`, simulate(world, flow.packet)]),
        [`${incident.id} ${name} extra-openings`, extraOpenings(world, expected)],
      ];
    }),
  );
}

function serialize(entries: [string, unknown][]): string {
  return `{\n${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(canonical(recorded(value)))}`).join(',\n')}\n}\n`;
}

describe('chapter 4 golden traces', () => {
  it('keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model', async () => {
    await expect(serialize(references())).toMatchFileSnapshot(FIXTURE);
  });
});
```

- [ ] **Step 5: Tipos y tests**

```bash
npm run typecheck
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
```

Expected: `typecheck` sin errores; Vitest `Tests 411 passed (411)` en 40 archivos; `git diff` sin salida.

- [ ] **Step 6: Buscar nombres viejos**

```bash
grep -rnE "securityGroups|vpcCidr|linuxSettings|withInstance|\binst\(|instanceName|groupsOf|\bInstance\b|\bSecurityGroup\b|\.linux\b|linux: \{" src tests
```

Expected: exactamente estas dos líneas, en cualquier orden; son `INSPECTION_TEXT.securityGroups`, una etiqueta visible que se queda:

```
src/game/view/inspection.ts:55:        { term: 'security-group', label: INSPECTION_TEXT.securityGroups, lines: () => own.map((firewall) => MAP_TEXT.barrier(firewall.name)) },
src/copy/incident-ui.ts:19:  securityGroups: '{{security-group|Security Groups}}',
```

`sgIds` sigue en `rules.ts` y en las etapas de firewall: lo cambia la Tarea 3.

- [ ] **Step 7: Guía de `game/view`**

En `src/game/view/CLAUDE.md`, en la primera viñeta, el texto

```markdown
a server's label is its instance name (`servidor2`)
```

pasa a

```markdown
a server's label is its device name (`servidor2`)
```

- [ ] **Step 8: Verificar**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src
git status --short
git commit -m "refactor: name the network model after devices and firewalls"
```

Antes del commit, `git status --short` muestra como agregados (columna izquierda con letra) solo archivos bajo `src/`; `labs/…`, `pnpm-lock.yaml` y `pnpm-workspace.yaml` siguen sin agregar.

---

### Task 3: El recorrido con `firewall-out`, `firewall-in` y `host`

Refactor puro del vocabulario del recorrido: etapas, códigos de motivo, `instanceId → deviceId` en motivos y `tcpdump`, y `sgId → firewallId` en las comprobaciones de reglas. Los textos en español no cambian. El test dorado traduce cada nombre nuevo al grabado.

**Files:**
- Rename: `src/engine/simulation/stages/sg-in.ts` → `firewall-in.ts`, `sg-out.ts` → `firewall-out.ts`, `linux.ts` → `host.ts`
- Modify: `src/engine/simulation/trace.ts`, `src/engine/simulation/rules.ts`, `src/engine/simulation/simulate.ts`, `src/engine/simulation/stages/host.ts`, `src/engine/simulation/stages/reply.ts`, `src/engine/simulation/stages/route.ts`, `src/engine/exposure/exposure.ts`, `src/copy/reasons.ts`, `src/scene/layout.ts`, `src/engine/simulation/stages/CLAUDE.md`, `.claude/rules/english-only.md`
- Test: `src/copy/reasons.test.ts`, `src/engine/simulation/checkpoints.test.ts`, `src/engine/simulation/rules.test.ts`, `src/engine/simulation/simulate.test.ts`, `src/levels/04-iaas/golden-traces.test.ts`

**Interfaces:**
- Consumes: los nombres de la Tarea 2.
- Produces:
  - `StepStage = 'dns' | 'route' | 'nat' | 'firewall-out' | 'firewall-in' | 'host' | 'reply'`.
  - `RuleCheck { firewallId, ruleId, what, from }`; `PeerContext { ip, firewallIds }`; `TcpdumpLine { deviceId, direction, src, dst, summary }`.
  - Códigos de `Reason`: `route-no-public-device { ip }`, `route-no-public-ip { deviceId }`, `firewall-out-pass|drop { deviceId }`, `firewall-in-pass|drop { deviceId }`, `host-unsolicited-icmp { deviceId, icmpType }`, `host-ignores-echo`, `host-replies`, `host-refused { port }`, `host-accepts { port }`, `host-udp-no-service { port }` (todos con `deviceId`), `reply-stateful { deviceId }`. `route-no-private-instance { ip }` sigue hasta la Tarea 5.
  - Exports `firewallOutStage`, `firewallInStage`, `hostStage`.

- [ ] **Step 1: Comprobar que se parte de la Tarea 2**

```bash
git status --short src
npx vitest run
```

Expected: nada bajo `src/`; `Tests 411 passed (411)`.

- [ ] **Step 2: Renombrar los archivos de las etapas**

```bash
git mv src/engine/simulation/stages/sg-in.ts src/engine/simulation/stages/firewall-in.ts
git mv src/engine/simulation/stages/sg-out.ts src/engine/simulation/stages/firewall-out.ts
git mv src/engine/simulation/stages/linux.ts src/engine/simulation/stages/host.ts
```

- [ ] **Step 3: Las dos etapas de firewall**

Contenido completo de `src/engine/simulation/stages/firewall-in.ts`:

```ts
import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const firewallInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const firewallIds = ctx.path === 'private' && ctx.source.device ? ctx.source.device.firewallIds : [];
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, firewallIds });
  ctx.steps.push({
    stage: 'firewall-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'firewall-in-pass' : 'firewall-in-drop', deviceId: dest.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

Contenido completo de `src/engine/simulation/stages/firewall-out.ts`:

```ts
import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const firewallOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device) return CONTINUE;
  const dest = ctx.dest!;
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, device), 'outbound', ctx.packet, {
    ip: ctx.destIp!,
    firewallIds: ctx.path === 'private' ? dest.firewallIds : [],
  });
  ctx.steps.push({
    stage: 'firewall-out',
    at: device.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'firewall-out-pass' : 'firewall-out-drop', deviceId: device.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

- [ ] **Step 4: Renombrar en el código**

```bash
python3 - <<'EOF'
import re
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


def edit_all(path, pattern, new, count):
    text, found = re.subn(pattern, new, Path(path).read_text())
    if found != count:
        raise SystemExit(f'{path}: expected {count} matches of {pattern!r}, found {found}')
    Path(path).write_text(text)


edit(
    'src/engine/simulation/trace.ts',
    ("export type StepStage = 'dns' | 'route' | 'nat' | 'sg-out' | 'sg-in' | 'linux' | 'reply';", "export type StepStage = 'dns' | 'route' | 'nat' | 'firewall-out' | 'firewall-in' | 'host' | 'reply';"),
    ('  sgId: string;\n  ruleId: string;', '  firewallId: string;\n  ruleId: string;'),
    ("  | { code: 'route-no-public-instance'; ip: string }", "  | { code: 'route-no-public-device'; ip: string }"),
    ("  | { code: 'sg-out-pass'; instanceId: string }", "  | { code: 'firewall-out-pass'; instanceId: string }"),
    ("  | { code: 'sg-out-drop'; instanceId: string }", "  | { code: 'firewall-out-drop'; instanceId: string }"),
    ("  | { code: 'sg-in-pass'; instanceId: string }", "  | { code: 'firewall-in-pass'; instanceId: string }"),
    ("  | { code: 'sg-in-drop'; instanceId: string }", "  | { code: 'firewall-in-drop'; instanceId: string }"),
    ('export interface TcpdumpLine {\n  instanceId: string;', 'export interface TcpdumpLine {\n  deviceId: string;'),
)
edit_all('src/engine/simulation/trace.ts', r"code: 'linux-", "code: 'host-", 6)
edit_all('src/engine/simulation/trace.ts', r'instanceId: string', 'deviceId: string', 12)
edit(
    'src/engine/simulation/rules.ts',
    ('export interface PeerContext {\n  ip: string;\n  sgIds: string[];', 'export interface PeerContext {\n  ip: string;\n  firewallIds: string[];'),
    ('ctx.sgIds.includes(peer.sgId);', 'ctx.firewallIds.includes(peer.sgId);'),
    ('      sgId: firewall.id,', '      firewallId: firewall.id,'),
)
edit(
    'src/engine/simulation/simulate.ts',
    (
        "import { dnsStage } from './stages/dns';\nimport { linuxStage } from './stages/linux';\nimport { replyStage } from './stages/reply';\nimport { routeStage } from './stages/route';\nimport { sgInStage } from './stages/sg-in';\nimport { sgOutStage } from './stages/sg-out';",
        "import { dnsStage } from './stages/dns';\nimport { firewallInStage } from './stages/firewall-in';\nimport { firewallOutStage } from './stages/firewall-out';\nimport { hostStage } from './stages/host';\nimport { replyStage } from './stages/reply';\nimport { routeStage } from './stages/route';",
    ),
    (
        'export const PIPELINE: Stage[] = [dnsStage, routeStage, sgOutStage, sgInStage, linuxStage, replyStage];',
        'export const PIPELINE: Stage[] = [dnsStage, routeStage, firewallOutStage, firewallInStage, hostStage, replyStage];',
    ),
)
edit('src/engine/simulation/stages/host.ts', ('export const linuxStage: Stage', 'export const hostStage: Stage'))
edit_all('src/engine/simulation/stages/host.ts', r"stage: 'linux'", "stage: 'host'", 6)
edit_all('src/engine/simulation/stages/host.ts', r"code: 'linux-", "code: 'host-", 6)
edit_all('src/engine/simulation/stages/host.ts', r'instanceId: dest\.id', 'deviceId: dest.id', 8)
edit_all('src/engine/simulation/stages/reply.ts', r'instanceId: dest\.id', 'deviceId: dest.id', 2)
edit(
    'src/engine/simulation/stages/route.ts',
    ("reason: { code: 'route-no-public-instance', ip: destIp } });", "reason: { code: 'route-no-public-device', ip: destIp } });"),
    ("reason: { code: 'route-no-public-ip', instanceId: source.device.id } });", "reason: { code: 'route-no-public-ip', deviceId: source.device.id } });"),
)
edit(
    'src/engine/exposure/exposure.ts',
    (
        "/** True when the packet passed the destination's inbound security group, even if Linux then stays silent. */\nexport function reachesHost(trace: Trace): boolean {\n  return trace.steps.some((s) => s.stage === 'sg-in' && s.verdict === 'pass');",
        "/** True when the packet passed the destination's inbound firewalls, even if the host then stays silent. */\nexport function reachesHost(trace: Trace): boolean {\n  return trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'pass');",
    ),
)
edit(
    'src/copy/reasons.ts',
    ("    case 'route-no-public-instance':", "    case 'route-no-public-device':"),
    ("    case 'sg-out-pass':", "    case 'firewall-out-pass':"),
    ("    case 'sg-out-drop':", "    case 'firewall-out-drop':"),
    ("    case 'sg-in-pass':", "    case 'firewall-in-pass':"),
    ("    case 'sg-in-drop':", "    case 'firewall-in-drop':"),
)
edit_all('src/copy/reasons.ts', r"case 'linux-", "case 'host-", 6)
edit_all('src/copy/reasons.ts', r'reason\.instanceId', 'reason.deviceId', 9)
edit(
    'src/scene/layout.ts',
    ("s.stage === 'sg-out' && s.verdict === 'drop'", "s.stage === 'firewall-out' && s.verdict === 'drop'"),
    ("s.stage === 'sg-in' && s.verdict === 'drop'", "s.stage === 'firewall-in' && s.verdict === 'drop'"),
)
print('sources renamed')
EOF
```

Expected: `sources renamed`.

- [ ] **Step 5: Renombrar en los tests**

```bash
python3 - <<'EOF'
import re
from pathlib import Path


def edit(path, *pairs):
    text = Path(path).read_text()
    for old, new in pairs:
        found = text.count(old)
        if found != 1:
            raise SystemExit(f'{path}: expected 1 match, found {found}: {old[:90]!r}')
        text = text.replace(old, new)
    Path(path).write_text(text)


def edit_all(path, pattern, new, count):
    text, found = re.subn(pattern, new, Path(path).read_text())
    if found != count:
        raise SystemExit(f'{path}: expected {count} matches of {pattern!r}, found {found}')
    Path(path).write_text(text)


edit(
    'src/copy/reasons.test.ts',
    ("{ code: 'route-no-public-instance',", "{ code: 'route-no-public-device',"),
    ("{ code: 'route-no-public-ip', instanceId:", "{ code: 'route-no-public-ip', deviceId:"),
    ("{ code: 'sg-out-pass', instanceId:", "{ code: 'firewall-out-pass', deviceId:"),
    ("{ code: 'sg-out-drop', instanceId:", "{ code: 'firewall-out-drop', deviceId:"),
    ("{ code: 'sg-in-pass', instanceId:", "{ code: 'firewall-in-pass', deviceId:"),
    ("{ code: 'sg-in-drop', instanceId:", "{ code: 'firewall-in-drop', deviceId:"),
    ("{ code: 'reply-stateful', instanceId:", "{ code: 'reply-stateful', deviceId:"),
)
edit_all('src/copy/reasons.test.ts', r"\{ code: 'linux-([a-z-]+)', instanceId:", r"{ code: 'host-\1', deviceId:", 6)
edit_all('src/engine/simulation/checkpoints.test.ts', r"stage: 'sg-in'", "stage: 'firewall-in'", 3)
edit_all('src/engine/simulation/checkpoints.test.ts', r"code: 'sg-in-drop', instanceId:", "code: 'firewall-in-drop', deviceId:", 2)
edit_all('src/engine/simulation/checkpoints.test.ts', r"code: 'reply-stateful', instanceId:", "code: 'reply-stateful', deviceId:", 2)
edit_all('src/engine/simulation/rules.test.ts', r'\bsgIds:', 'firewallIds:', 6)
edit(
    'src/engine/simulation/rules.test.ts',
    ("{ sgId: 'sg-a', ruleId: 'ssh', what: false, from: false },", "{ firewallId: 'sg-a', ruleId: 'ssh', what: false, from: false },"),
    ("{ sgId: 'sg-b', ruleId: 'echo', what: true, from: true },", "{ firewallId: 'sg-b', ruleId: 'echo', what: true, from: true },"),
    ("toEqual({ sgId: 'sg-a', ruleId: 'ssh', what: false, from: true });", "toEqual({ firewallId: 'sg-a', ruleId: 'ssh', what: false, from: true });"),
)
edit_all('src/engine/simulation/simulate.test.ts', r"\{ stage: 'sg-in', at:", "{ stage: 'firewall-in', at:", 3)
edit(
    'src/engine/simulation/simulate.test.ts',
    ("`${l.instanceId} ${l.direction}`", "`${l.deviceId} ${l.direction}`"),
    ("    const sgIn = trace.steps.find((s) => s.stage === 'sg-in');\n    expect(sgIn?.checks", "    const firewallIn = trace.steps.find((s) => s.stage === 'firewall-in');\n    expect(firewallIn?.checks"),
    ("{ stage: 'linux', at: 'servidor2' }", "{ stage: 'host', at: 'servidor2' }"),
    ("{ stage: 'sg-out', at: 'servidor1' }", "{ stage: 'firewall-out', at: 'servidor1' }"),
)
print('tests renamed')
EOF
```

Expected: `tests renamed`.

- [ ] **Step 6: El test dorado traduce el vocabulario nuevo**

Reemplazar entero `src/levels/04-iaas/golden-traces.test.ts`. Suma `RECORDED_KEYS` y completa `RECORDED_VALUES` con cada nombre del recorrido que cambió:

```ts
import { describe, expect, it } from 'vitest';
import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
import { applyMove, solvedWorld, startWorld } from '@/levels/world';

const CHAPTER = 4;
const FIXTURE = './golden-traces.json';
const RECORDED_KEYS = new Map([
  ['deviceId', 'instanceId'],
  ['firewallId', 'sgId'],
]);
const RECORDED_VALUES = new Map([
  ['device', 'instance'],
  ['firewall-out', 'sg-out'],
  ['firewall-in', 'sg-in'],
  ['host', 'linux'],
  ['firewall-out-pass', 'sg-out-pass'],
  ['firewall-out-drop', 'sg-out-drop'],
  ['firewall-in-pass', 'sg-in-pass'],
  ['firewall-in-drop', 'sg-in-drop'],
  ['host-unsolicited-icmp', 'linux-unsolicited-icmp'],
  ['host-ignores-echo', 'linux-ignores-echo'],
  ['host-replies', 'linux-replies'],
  ['host-refused', 'linux-refused'],
  ['host-accepts', 'linux-accepts'],
  ['host-udp-no-service', 'linux-udp-no-service'],
  ['route-no-public-device', 'route-no-public-instance'],
]);

function recorded(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(recorded);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [RECORDED_KEYS.get(key) ?? key, recorded(inner)]));
  }
  return typeof value === 'string' ? (RECORDED_VALUES.get(value) ?? value) : value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
  const placed = start.firewalls.flatMap((firewall) =>
    incident.chips.what.flatMap((what) =>
      incident.chips.from.map((from): [string, Network] => [
        `start+${firewall.id}:${what.id}<-${from.id}`,
        applyMove(start, incident, { type: 'placeRule', firewallId: firewall.id, whatId: what.id, fromId: from.id }),
      ]),
    ),
  );
  return [['start', start], ['solved', solvedWorld(INCIDENTS, incident.id)], ...placed];
}

function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => incident.chapter === CHAPTER).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
      const expected = incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
      return [
        ...incident.flows.map((flow): [string, unknown] => [`${incident.id} ${name} ${flow.id}`, simulate(world, flow.packet)]),
        [`${incident.id} ${name} extra-openings`, extraOpenings(world, expected)],
      ];
    }),
  );
}

function serialize(entries: [string, unknown][]): string {
  return `{\n${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(canonical(recorded(value)))}`).join(',\n')}\n}\n`;
}

describe('chapter 4 golden traces', () => {
  it('keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model', async () => {
    await expect(serialize(references())).toMatchFileSnapshot(FIXTURE);
  });
});
```

- [ ] **Step 7: Tipos y tests**

```bash
npm run typecheck
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
```

Expected: `typecheck` sin errores; `Tests 411 passed (411)`; `git diff` sin salida.

- [ ] **Step 8: Buscar nombres viejos**

```bash
grep -rnE "'sg-in|'sg-out|'linux|linuxStage|sgInStage|sgOutStage|instanceId|\bsgIds\b|route-no-public-instance" src tests --exclude=golden-traces.test.ts --exclude=golden-traces.json
```

Expected: exactamente estas dos líneas, en cualquier orden. Son listas de nombres retirados que los tests usan para comprobar que no vuelven:

```
src/copy/terms.test.ts:18:const RETIRED_IDS = ['server', 'rule', 'linux-ignore-ping'];
src/game/view/ladder.test.ts:11:const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];
```

- [ ] **Step 9: Guía de las etapas y regla `english-only`**

En `src/engine/simulation/stages/CLAUDE.md`, la línea

```markdown
One file per pipeline stage: `dns`, `route`, `sg-out`, `sg-in`, `linux`, `reply`. A stage reads and extends the simulation context and says whether the packet continues.
```

pasa a

```markdown
One file per pipeline stage: `dns`, `route`, `firewall-out`, `firewall-in`, `host`, `reply`. A stage reads and extends the simulation context and says whether the packet continues.
```

En `.claude/rules/english-only.md`, el ejemplo `{ code: 'sg-in-drop', instanceId: 'servidor2' }` pasa a `{ code: 'host-refused', deviceId: 'servidor2', port: 80 }` (un código que ya no cambia en este plan).

- [ ] **Step 10: Verificar**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src .claude/rules/english-only.md
git status --short
git commit -m "refactor(engine): name the trace stages firewall-out, firewall-in and host"
```

---

### Task 4: Tipos de red, dispositivo y firewall, y la red de oficina

El modelo suma lo que el spec pide: `kind` de red (`office` | `vpc`), de dispositivo (`laptop` | `printer` | `ec2-instance`) y de firewall (`host-firewall` | `security-group`), y `edge` (`router` | `internet-gateway`). `region`, `subnets` y `subnetId` pasan a opcionales y el esquema decide según el tipo de red. El esquema se parte en funciones con un solo trabajo cada una (`checkIds`, `checkVpc`, `checkOffice`, `checkFirewalls`).

**Files:**
- Modify: `src/engine/network/schema.ts` (reescribir), `src/engine/network/cidr.ts`, `src/engine/network/dns.ts`, `src/game/view/inspection.ts`, `src/scene/layout.ts`, `src/levels/04-iaas/shared.ts`, `src/testing/fixtures.ts`, `src/testing/index.ts`, `src/engine/CLAUDE.md`, `src/engine/network/CLAUDE.md`, `src/testing/CLAUDE.md`
- Test: `src/engine/network/schema.test.ts` (reescribir), `src/engine/network/cidr.test.ts`, `src/engine/network/dns.test.ts`, `src/engine/simulation/rules.test.ts`

**Interfaces:**
- Consumes: los nombres de las Tareas 2 y 3.
- Produces:
  - `Network = { kind: 'office' | 'vpc'; cidr; region?; subnets?; devices; firewalls; edge: 'router' | 'internet-gateway'; actors }`.
  - `Device.kind: 'laptop' | 'printer' | 'ec2-instance'`, `Device.subnetId?`; `Firewall.kind: 'host-firewall' | 'security-group'`.
  - `isPrivateCidr(cidr: string): boolean` y la constante interna `PRIVATE_RANGES` en `src/engine/network/cidr.ts`.
  - `resolveName` devuelve `null` en una red sin `region`.
  - `src/testing`: `OFFICE = { cidr: '192.168.1.0/24', you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' }` y `officeNet(): Network` (dispositivos `your-laptop`, `lucia-laptop`, `printer`, ninguno con firewall; firewall `fw-lucia` de tipo `host-firewall`, sin reglas de entrada y con salida a todo, sin asociar; actor `attacker`).
  - Mensajes del esquema que los tests citan: `a VPC needs a region`, `a VPC needs at least one subnet`, `<device>: a device in a VPC needs at least one Security Group`, `<device>: firewall <id> does not exist`, `an office network has no region`, `an office network has no subnets`, `<device>: an office device has no public IP`, `<device>: an office device has no subnet`, `<device>: <ip> is not in <cidr>`, `<cidr> is not a private range (RFC 1918)`, `<firewall>/<rule>: only a Security Group takes a Security Group as source`, `<firewall>/<rule>: <id> is not a Security Group of this network`, `<device>: its firewalls mix kinds`.

- [ ] **Step 1: Escribir los tests que fallan**

Contenido completo de `src/engine/network/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net, officeNet, withDevice, withInbound } from '@/testing';
import { networkSchema, packetSchema } from './schema';
import type { Firewall, Network } from './types';

const OS_FIREWALL: Firewall = { id: 'fw-os', name: 'os', kind: 'host-firewall', inbound: [], outbound: [] };
const SECURITY_GROUP: Firewall = { id: 'sg-x', name: 'x', kind: 'security-group', inbound: [], outbound: [] };

function problems(net: unknown): string[] {
  const result = networkSchema.safeParse(net);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function withFirewall(net: Network, firewall: Firewall): Network {
  return { ...net, firewalls: [...net.firewalls, firewall] };
}

const BROKEN: [string, Network, string][] = [
  ['a VPC without a region', { ...lab03Net(), region: undefined }, 'a VPC needs a region'],
  ['a VPC without subnets', { ...lab03Net(), subnets: [] }, 'a VPC needs at least one subnet'],
  ['a private IP outside its subnet', withDevice(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' }), 'servidor1: 172.31.38.5 is not in 172.31.16.0/20'],
  ['an EC2 instance without a Security Group', withDevice(lab03Net(), 'servidor1', { firewallIds: [] }), 'servidor1: a device in a VPC needs at least one Security Group'],
  ['a firewall that does not exist', withDevice(lab03Net(), 'servidor1', { firewallIds: ['sg-fantasma'] }), 'servidor1: firewall sg-fantasma does not exist'],
  ['an office with a region', { ...officeNet(), region: 'eu-west-1' }, 'an office network has no region'],
  ['an office with subnets', { ...officeNet(), subnets: [{ id: 'subnet-a', az: 'eu-west-1a', cidr: '192.168.1.0/25' }] }, 'an office network has no subnets'],
  ['an office device with a public IP', withDevice(officeNet(), 'printer', { publicIp: '54.78.154.66' }), 'printer: an office device has no public IP'],
  ['an office device in a subnet', withDevice(officeNet(), 'printer', { subnetId: 'subnet-a' }), 'printer: an office device has no subnet'],
  ['an office device outside the office range', withDevice(officeNet(), 'printer', { privateIp: '192.168.2.20' }), 'printer: 192.168.2.20 is not in 192.168.1.0/24'],
  ['an office with a public range', { ...officeNet(), cidr: '8.8.8.0/24' }, '8.8.8.0/24 is not a private range (RFC 1918)'],
  ['an office range wider than a private range', { ...officeNet(), cidr: '192.168.0.0/15' }, '192.168.0.0/15 is not a private range (RFC 1918)'],
  ['a Security Group in an office', withFirewall(officeNet(), SECURITY_GROUP), 'sg-x: an office firewall is a host firewall'],
  [
    'a host firewall with a Security Group as Source',
    withFirewall(lab03Net(), { ...OS_FIREWALL, inbound: [echoFrom('echo', 'sg-servidor1')] }),
    'fw-os/echo: only a Security Group takes a Security Group as source',
  ],
  [
    'a Security Group whose Source is a host firewall',
    withInbound(withFirewall(lab03Net(), OS_FIREWALL), 'sg-servidor2', echoFrom('echo', 'fw-os')),
    'sg-servidor2/echo: fw-os is not a Security Group of this network',
  ],
  [
    'a device whose firewalls mix kinds',
    withDevice(withFirewall(officeNet(), SECURITY_GROUP), 'your-laptop', { firewallIds: ['fw-lucia', 'sg-x'] }),
    'your-laptop: its firewalls mix kinds',
  ],
];

describe('networkSchema', () => {
  it('accepts the lab 03 VPC and the chapter 1 office', () => {
    expect(problems(lab03Net())).toEqual([]);
    expect(problems(officeNet())).toEqual([]);
  });

  it('accepts an office whose laptop has its host firewall', () => {
    expect(problems(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }))).toEqual([]);
  });

  it.each(BROKEN)('rejects %s', (_name, net, message) => {
    expect(problems(net)).toContain(message);
  });
});

describe('packetSchema', () => {
  it('requires icmpType for ICMP and port for TCP', () => {
    const from = { kind: 'device', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });
});
```

Y los tests de `isPrivateCidr` y de DNS en la oficina:

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
    'src/engine/network/cidr.test.ts',
    ("import { ipInCidr, isIpv4, parseCidr } from './cidr';", "import { ipInCidr, isIpv4, isPrivateCidr, parseCidr } from './cidr';"),
)
Path('src/engine/network/cidr.test.ts').write_text(
    Path('src/engine/network/cidr.test.ts').read_text()
    + """
describe('isPrivateCidr', () => {
  it('accepts a range inside 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16 (RFC 1918)', () => {
    for (const range of ['192.168.1.0/24', '172.31.0.0/16', '10.0.0.0/8', '172.16.0.0/12']) expect(isPrivateCidr(range), range).toBe(true);
  });

  it('rejects a public range and a range that spills out of a private one', () => {
    for (const range of ['8.8.8.0/24', '172.32.0.0/16', '192.168.0.0/15', '172.0.0.0/11', '0.0.0.0/0']) expect(isPrivateCidr(range), range).toBe(false);
  });
});
"""
)
edit(
    'src/engine/network/dns.test.ts',
    ("import { lab03Net } from '@/testing';", "import { OFFICE, lab03Net, officeNet } from '@/testing';"),
    (
        "    expect(resolveName(net, 'no-existe.example', true)).toBeNull();\n  });",
        "    expect(resolveName(net, 'no-existe.example', true)).toBeNull();\n  });\n\n  it('an office has no region, so no EC2 name resolves there', () => {\n    expect(resolveName(officeNet(), privateDnsName(OFFICE.printer, 'eu-west-1'), true)).toBeNull();\n  });",
    ),
)
print('tests written')
EOF
```

Expected: `tests written`.

- [ ] **Step 2: Comprobar que fallan**

```bash
npx vitest run src/engine/network
```

Expected: FAIL en 3 archivos: `schema.test.ts` y `dns.test.ts` con `TypeError: officeNet is not a function`, `cidr.test.ts` con `TypeError: isPrivateCidr is not a function`.

- [ ] **Step 3: El esquema con tipos y las reglas de cada red**

Contenido completo de `src/engine/network/schema.ts`:

```ts
import { z } from 'zod';
import { ipInCidr, isIpv4, isPrivateCidr, parseCidr } from './cidr';

const ip = z.string().refine(isIpv4, 'invalid IPv4');
const cidr = z.string().refine((value) => {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}, 'invalid CIDR');
const port = z.number().int().min(0).max(65535);

export const icmpTypeSchema = z.union([z.literal(0), z.literal(8)]);

export const ruleWhatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('tcp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('udp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('icmp'), icmpType: z.union([icmpTypeSchema, z.literal('all')]) }),
]);

export const rulePeerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cidr'), cidr }),
  z.object({ kind: z.literal('sg'), sgId: z.string().min(1) }),
]);

export const ruleSchema = z.object({ id: z.string().min(1), what: ruleWhatSchema, peer: rulePeerSchema });

export const firewallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['host-firewall', 'security-group']),
  inbound: z.array(ruleSchema),
  outbound: z.array(ruleSchema),
});

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['laptop', 'printer', 'ec2-instance']),
  subnetId: z.string().min(1).optional(),
  privateIp: ip,
  publicIp: ip.optional(),
  firewallIds: z.array(z.string().min(1)),
  host: z.object({ ignoreIcmpEcho: z.boolean(), listeningTcpPorts: z.array(port) }),
  appTarget: z.string().min(1).optional(),
});

export const subnetSchema = z.object({ id: z.string().min(1), az: z.string().min(1), cidr });

export const actorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ip,
  kind: z.enum(['you', 'attacker']),
});

const networkShape = z.object({
  kind: z.enum(['office', 'vpc']),
  cidr,
  region: z.string().min(1).optional(),
  subnets: z.array(subnetSchema).optional(),
  devices: z.array(deviceSchema),
  firewalls: z.array(firewallSchema),
  edge: z.enum(['router', 'internet-gateway']),
  actors: z.array(actorSchema),
});

type NetworkShape = z.infer<typeof networkShape>;
type Fail = (message: string) => void;

function safeInCidr(value: string, range: string): boolean {
  try {
    return ipInCidr(value, range);
  } catch {
    return false;
  }
}

function checkIds(net: NetworkShape, fail: Fail): void {
  const ids = [
    ...(net.subnets ?? []).map((s) => s.id),
    ...net.devices.map((d) => d.id),
    ...net.firewalls.map((f) => f.id),
    ...net.actors.map((a) => a.id),
  ];
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) fail(`duplicate id: ${repeated}`);
}

function checkVpc(net: NetworkShape, fail: Fail): void {
  const subnets = net.subnets ?? [];
  if (!net.region) fail('a VPC needs a region');
  if (subnets.length === 0) fail('a VPC needs at least one subnet');
  for (const subnet of subnets) {
    if (!safeInCidr(subnet.cidr.split('/')[0], net.cidr)) fail(`${subnet.id}: ${subnet.cidr} is outside the VPC`);
  }
  for (const device of net.devices) {
    const subnet = subnets.find((s) => s.id === device.subnetId);
    if (!subnet) fail(`${device.id}: subnet ${device.subnetId} does not exist`);
    else if (!safeInCidr(device.privateIp, subnet.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${subnet.cidr}`);
    const hasSecurityGroup = net.firewalls.some((f) => f.kind === 'security-group' && device.firewallIds.includes(f.id));
    if (!hasSecurityGroup) fail(`${device.id}: a device in a VPC needs at least one Security Group`);
  }
}

function checkOffice(net: NetworkShape, fail: Fail): void {
  if (net.region !== undefined) fail('an office network has no region');
  if (net.subnets !== undefined) fail('an office network has no subnets');
  if (!isPrivateCidr(net.cidr)) fail(`${net.cidr} is not a private range (RFC 1918)`);
  for (const firewall of net.firewalls) {
    if (firewall.kind !== 'host-firewall') fail(`${firewall.id}: an office firewall is a host firewall`);
  }
  for (const device of net.devices) {
    if (device.publicIp !== undefined) fail(`${device.id}: an office device has no public IP`);
    if (device.subnetId !== undefined) fail(`${device.id}: an office device has no subnet`);
    if (!safeInCidr(device.privateIp, net.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${net.cidr}`);
  }
}

function checkFirewalls(net: NetworkShape, fail: Fail): void {
  const byId = new Map(net.firewalls.map((f) => [f.id, f]));
  for (const device of net.devices) {
    const missing = device.firewallIds.filter((id) => !byId.has(id));
    for (const id of missing) fail(`${device.id}: firewall ${id} does not exist`);
    const kinds = new Set(device.firewallIds.flatMap((id) => byId.get(id)?.kind ?? []));
    if (kinds.size > 1) fail(`${device.id}: its firewalls mix kinds`);
  }
  for (const firewall of net.firewalls) {
    for (const rule of [...firewall.inbound, ...firewall.outbound]) {
      const peer = rule.peer;
      if (peer.kind !== 'sg') continue;
      if (firewall.kind !== 'security-group') fail(`${firewall.id}/${rule.id}: only a Security Group takes a Security Group as source`);
      if (byId.get(peer.sgId)?.kind !== 'security-group') fail(`${firewall.id}/${rule.id}: ${peer.sgId} is not a Security Group of this network`);
    }
  }
}

export const networkSchema = networkShape.superRefine((net, ctx) => {
  const fail: Fail = (message) => ctx.addIssue({ code: 'custom', message });
  checkIds(net, fail);
  if (net.kind === 'vpc') checkVpc(net, fail);
  else checkOffice(net, fail);
  checkFirewalls(net, fail);
});

export const endpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('device'), id: z.string().min(1) }),
  z.object({ kind: z.literal('actor'), id: z.string().min(1) }),
]);

export const packetSchema = z
  .object({
    from: endpointSchema,
    to: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'icmp']),
    port: port.optional(),
    icmpType: icmpTypeSchema.optional(),
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP needs icmpType; TCP and UDP need port',
  });
```

- [ ] **Step 4: El rango privado, los consumidores y los mundos**

`isPrivateCidr`, `resolveName` sin región, los nombres DNS de la inspección y las columnas del mapa sin subredes, `kind` y `edge` en el mundo base del capítulo 4 y en `lab03Net`, y la red de oficina:

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


def append(path, text):
    Path(path).write_text(Path(path).read_text() + text)


append(
    'src/engine/network/cidr.ts',
    """
const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

/** True when the whole range lies inside one private range of RFC 1918 (10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16). */
export function isPrivateCidr(cidr: string): boolean {
  const { prefix } = parseCidr(cidr);
  const [base] = cidr.split('/');
  return PRIVATE_RANGES.some((range) => prefix >= parseCidr(range).prefix && ipInCidr(base, range));
}
""",
)
edit(
    'src/engine/network/dns.ts',
    ('a private name resolves only inside. Returns null when nothing answers. */', 'a private name resolves only inside. Returns null when nothing answers, and always for a network without a region (an office has no EC2 names). */'),
    (
        'export function resolveName(net: Network, name: string, fromInsideVpc: boolean): string | null {\n  for (const device of net.devices) {',
        'export function resolveName(net: Network, name: string, fromInsideVpc: boolean): string | null {\n  const { region } = net;\n  if (!region) return null;\n  for (const device of net.devices) {',
    ),
    ('publicDnsName(device.publicIp, net.region)', 'publicDnsName(device.publicIp, region)'),
    ('privateDnsName(device.privateIp, net.region)', 'privateDnsName(device.privateIp, region)'),
)
edit(
    'src/game/view/inspection.ts',
    (
        'function server(session: Session, device: Device): Inspection {',
        """function dnsNames(device: Device, region: string | undefined): string[] {
  if (!region) return [];
  return [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)];
}

function server(session: Session, device: Device): Inspection {""",
    ),
    (
        """        {
          term: 'dns',
          label: INSPECTION_TEXT.dnsNames,
          lines: () => [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)],
        },""",
        "        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(device, region) },",
    ),
)
edit(
    'src/scene/layout.ts',
    ('  const widths = net.subnets.map((s) =>', '  const columns = net.subnets ?? [];\n  const widths = columns.map((s) =>'),
    ('  net.subnets.forEach((subnet, index) => {', '  columns.forEach((subnet, index) => {'),
)
edit(
    'src/levels/04-iaas/shared.ts',
    ('    name: ips.id,\n    subnetId,', "    name: ips.id,\n    kind: 'ec2-instance',\n    subnetId,"),
    ('export const BASE_WORLD: Network = {\n  region: REGION,', "export const BASE_WORLD: Network = {\n  kind: 'vpc',\n  region: REGION,"),
    ("    { id: SG.servidor1, name: S1.id, inbound: []", "    { id: SG.servidor1, name: S1.id, kind: 'security-group', inbound: []"),
    ("    { id: SG.servidor2, name: S2.id, inbound: []", "    { id: SG.servidor2, name: S2.id, kind: 'security-group', inbound: []"),
    ('  ],\n  actors: [{ ...ATTACKER', "  ],\n  edge: 'internet-gateway',\n  actors: [{ ...ATTACKER"),
)
edit(
    'src/testing/fixtures.ts',
    ("export function lab03Net(): Network {\n  return {\n    region: 'eu-west-1',", "export function lab03Net(): Network {\n  return {\n    kind: 'vpc',\n    region: 'eu-west-1',"),
    ("        name: 'servidor1',\n        subnetId:", "        name: 'servidor1',\n        kind: 'ec2-instance',\n        subnetId:"),
    ("        name: 'servidor2',\n        subnetId:", "        name: 'servidor2',\n        kind: 'ec2-instance',\n        subnetId:"),
    ("{ id: 'sg-servidor1', name: 'servidor1', inbound:", "{ id: 'sg-servidor1', name: 'servidor1', kind: 'security-group', inbound:"),
    ("{ id: 'sg-servidor2', name: 'servidor2', inbound:", "{ id: 'sg-servidor2', name: 'servidor2', kind: 'security-group', inbound:"),
    ("        name: 'default',\n        inbound:", "        name: 'default',\n        kind: 'security-group',\n        inbound:"),
    ("    ],\n    actors: [\n      { id: 'you',", "    ],\n    edge: 'internet-gateway',\n    actors: [\n      { id: 'you',"),
    (
        'export function withInbound(',
        """export const OFFICE = { cidr: '192.168.1.0/24', you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' } as const;

function officeDevice(id: string, kind: Device['kind'], privateIp: string): Device {
  return { id, name: id, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] } };
}

/** Returns the chapter 1 office: your laptop, Lucía's laptop and a printer behind a router, none with a firewall yet; Lucía's host firewall exists but guards nothing. */
export function officeNet(): Network {
  return {
    kind: 'office',
    cidr: OFFICE.cidr,
    devices: [officeDevice('your-laptop', 'laptop', OFFICE.you), officeDevice('lucia-laptop', 'laptop', OFFICE.lucia), officeDevice('printer', 'printer', OFFICE.printer)],
    firewalls: [{ id: 'fw-lucia', name: 'lucia-laptop', kind: 'host-firewall', inbound: [], outbound: [allOut('fw-lucia-out')] }],
    edge: 'router',
    actors: [{ id: 'attacker', name: 'Atacante', ip: ATTACKER_IP, kind: 'attacker' }],
  };
}

export function withInbound(""",
    ),
)
edit(
    'src/testing/index.ts',
    (
        "export { ATTACKER_IP, YOU_IP, actor, allOut, device, echoFrom, lab03Net, ping, sshFromYou, tcp, withDevice, withInbound } from './fixtures';",
        "export { ATTACKER_IP, OFFICE, YOU_IP, actor, allOut, device, echoFrom, lab03Net, officeNet, ping, sshFromYou, tcp, withDevice, withInbound } from './fixtures';",
    ),
)
edit(
    'src/engine/simulation/rules.test.ts',
    ("{ id: 'sg-a', name: 'a', inbound:", "{ id: 'sg-a', name: 'a', kind: 'security-group', inbound:"),
    ("{ id: 'sg-b', name: 'b', inbound:", "{ id: 'sg-b', name: 'b', kind: 'security-group', inbound:"),
)
print('kinds and office in place')
EOF
```

Expected: `kinds and office in place`.

- [ ] **Step 5: Comprobar que pasan**

```bash
npm run typecheck
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
```

Expected: `typecheck` sin errores; `Tests 429 passed (429)` en 40 archivos; `git diff` sin salida.

- [ ] **Step 6: Guías**

En `src/engine/CLAUDE.md`, `The pure domain core: the AWS network model and the packet simulation.` pasa a `The pure domain core: the network model (an office or an AWS VPC) and the packet simulation.`

En `src/engine/network/CLAUDE.md`, la línea

```markdown
The network model: zod schemas and types, CIDR math, EC2 DNS names, actions that change a network, and app targets.
```

pasa a

```markdown
The network model as zod schemas and types: an office or a VPC (`kind`), its range, its devices (laptop, printer, EC2 instance), its firewalls (host firewall or Security Group), its edge (router or Internet gateway) and the actors on the internet. Also CIDR math with the private ranges of RFC 1918, EC2 DNS names, actions that change a network, and app targets.

- `networkSchema` checks each kind: a VPC has a region, subnets and a Security Group on every device; an office has no region, no subnets and no public IPs, and its range is private. A Security Group source (`sg`) only exists on a Security Group and points at one.
```

En `src/testing/CLAUDE.md`, el texto

```markdown
network fixtures (`fixtures.ts`)
```

pasa a

```markdown
network fixtures (`fixtures.ts`: the lab 03 VPC and the chapter 1 office)
```

- [ ] **Step 7: Verificar**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git status --short
git commit -m "feat(engine): model office networks and the kind of every device and firewall"
```

---

### Task 5: Perdido en la red, perdido en internet y ping a la propia IP

La etapa `route` suma tres casos, en este orden: un dispositivo que se manda un paquete a su propia IP se contesta sin salir a la red (`route-self`, y las etapas de firewall no se aplican); un paquete desde internet a una IP de RFC 1918 se pierde en internet (`lost`, en `internet`); una IP del rango de la red que ningún dispositivo tiene se pierde en la red (`route-no-device`, `lost`, en `office` o `vpc`). Los textos son los del spec.

**Files:**
- Modify: `src/engine/simulation/stages/route.ts` (reescribir), `src/engine/simulation/trace.ts`, `src/engine/simulation/context.ts`, `src/engine/network/cidr.ts`, `src/engine/simulation/stages/firewall-in.ts`, `src/engine/simulation/stages/firewall-out.ts`, `src/copy/reasons.ts`, `src/copy/packet-labels.ts`, `src/scene/layout.ts`, `src/engine/simulation/CLAUDE.md`
- Test: `src/engine/simulation/simulate.test.ts`, `src/copy/reasons.test.ts`, `src/engine/network/cidr.test.ts`

**Interfaces:**
- Consumes: `officeNet`, `OFFICE` y `device` de `src/testing` (Tarea 4).
- Produces:
  - `Outcome` suma `'lost'`. `OUTCOME_TEXT.lost` = `'Se perdió: no llegó a ningún dispositivo.'`.
  - `Reason`: `route-no-device { ip }` reemplaza a `route-no-private-instance`; nuevo `route-self { deviceId }`. `route-private-from-outside { ip }` queda, ahora en `at: 'internet'` y con `lost`.
  - `SimContext.path: 'private' | 'public' | 'self'`.
  - `isPrivateIpv4(ip: string): boolean` en `src/engine/network/cidr.ts`.
  - Lugares (`Step.at`) de la etapa `route`: el `kind` de la red, `igw`, `internet` y el id del dispositivo (ping a sí mismo).

- [ ] **Step 1: Escribir los tests que fallan**

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


def append(path, text):
    Path(path).write_text(Path(path).read_text() + text)


edit(
    'src/copy/reasons.test.ts',
    (
        "  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, '172.31.38.97 es una {{private-ip}}: desde internet no hay camino hasta ella.'],\n  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ninguna {{ec2-instance}} tiene la {{private-ip}} 172.31.99.9.'],",
        "  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.'],\n  [{ code: 'route-no-device', ip: '192.168.1.30' }, 'Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.'],",
    ),
    (
        "  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],",
        "  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],\n  [{ code: 'route-self', deviceId: 'your-laptop' }, 'Va a la propia IP del dispositivo: no sale a la red.'],",
    ),
)
edit(
    'src/engine/simulation/simulate.test.ts',
    (
        "import { actor, device, echoFrom, lab03Net, ping, tcp, withDevice, withInbound } from '@/testing';",
        "import { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, tcp, withDevice, withInbound } from '@/testing';",
    ),
    (
        """  it('a private IP from the internet has no path: timeout at the internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });""",
        """  it('a private IP from the internet is lost in the internet, before the Internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('lost');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet' });""",
    ),
)
append(
    'src/engine/simulation/simulate.test.ts',
    """
describe('lost packets and a device that pings itself', () => {
  it('an IP of the office that no device has: the packet is lost in the network', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), OFFICE.nobody));
    expect(trace.outcome).toBe('lost');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'office', verdict: 'drop', reason: { code: 'route-no-device', ip: OFFICE.nobody } }]);
  });

  it('a private IP from the internet: the packet is lost in the internet, before the router', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), OFFICE.you));
    expect(trace.outcome).toBe('lost');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'internet', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: OFFICE.you } }]);
  });

  it('a private IP outside the network range is lost in the internet too', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), '10.0.0.5'));
    expect(trace.outcome).toBe('lost');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet' });
  });

  it('a device that pings its own IP answers itself without the packet going out to the network', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), OFFICE.you));
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe('your-laptop');
    expect(trace.steps.map((step) => [step.stage, step.reason.code])).toEqual([
      ['route', 'route-self'],
      ['host', 'host-replies'],
      ['reply', 'reply-stateful'],
    ]);
  });

  it('an EC2 instance that pings its own private IP answers even with no inbound rule', () => {
    const trace = simulate(lab03Net(), ping(device('servidor2'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.steps.filter((step) => step.stage === 'firewall-in' || step.stage === 'firewall-out')).toEqual([]);
  });
});
""",
)
edit(
    'src/engine/network/cidr.test.ts',
    ("import { ipInCidr, isIpv4, isPrivateCidr, parseCidr } from './cidr';", "import { ipInCidr, isIpv4, isPrivateCidr, isPrivateIpv4, parseCidr } from './cidr';"),
)
append(
    'src/engine/network/cidr.test.ts',
    """
describe('isPrivateIpv4', () => {
  it('knows the three private ranges of RFC 1918 and nothing else', () => {
    for (const ip of ['10.0.0.5', '172.16.0.1', '172.31.38.97', '192.168.1.10']) expect(isPrivateIpv4(ip), ip).toBe(true);
    for (const ip of ['172.32.0.1', '34.244.254.100', '203.0.113.66', '192.169.0.1']) expect(isPrivateIpv4(ip), ip).toBe(false);
  });
});
""",
)
print('tests written')
EOF
```

Expected: `tests written`.

- [ ] **Step 2: Comprobar que fallan**

```bash
npx vitest run src/engine src/copy
```

Expected: FAIL en 3 archivos, 12 tests (`simulate.test.ts`, `reasons.test.ts`, `cidr.test.ts`): `'lost'` frente a `'timeout'`, `isPrivateIpv4 is not a function` y los textos nuevos.

- [ ] **Step 3: La etapa `route`**

Contenido completo de `src/engine/simulation/stages/route.ts`:

```ts
import { ipInCidr, isPrivateIpv4 } from '@/engine/network/cidr';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

const INTERNET = 'internet';
const GATEWAY = 'igw';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (source.device && destIp === source.ip) {
    ctx.dest = source.device;
    ctx.path = 'self';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: source.device.id, verdict: 'pass', reason: { code: 'route-self', deviceId: source.device.id } });
    return CONTINUE;
  }

  if (!source.inside && isPrivateIpv4(destIp)) {
    ctx.steps.push({ stage: 'route', at: INTERNET, verdict: 'drop', reason: { code: 'route-private-from-outside', ip: destIp } });
    return stop('lost');
  }

  if (ipInCidr(destIp, net.cidr)) {
    const dest = net.devices.find((d) => d.privateIp === destIp);
    if (!dest) {
      ctx.steps.push({ stage: 'route', at: net.kind, verdict: 'drop', reason: { code: 'route-no-device', ip: destIp } });
      return stop('lost');
    }
    ctx.dest = dest;
    ctx.path = 'private';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: net.kind, verdict: 'pass', reason: { code: 'route-private' } });
    return CONTINUE;
  }

  const dest = net.devices.find((d) => d.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'drop', reason: { code: 'route-no-public-device', ip: destIp } });
    return stop('timeout');
  }
  if (source.device) {
    const publicIp = source.device.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'drop', reason: { code: 'route-no-public-ip', deviceId: source.device.id } });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: GATEWAY, verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: GATEWAY, verdict: 'pass', reason: { code: 'route-from-internet' } });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
```

- [ ] **Step 4: El resto del motor, los textos y la vista**

El tipo del recorrido, el camino `self`, `isPrivateIpv4`, las etapas de firewall que no se aplican a sí mismo, los motivos, `OUTCOME_TEXT.lost` y el mapa, que por ahora dibuja un paquete perdido en internet como uno que muere en el Internet gateway:

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
    'src/engine/simulation/trace.ts',
    ("  | { code: 'route-no-private-instance'; ip: string }", "  | { code: 'route-no-device'; ip: string }"),
    ("  | { code: 'route-from-internet' }", "  | { code: 'route-from-internet' }\n  | { code: 'route-self'; deviceId: string }"),
    (
        "export type Outcome = 'replied' | 'timeout' | 'refused' | 'arrived-no-reply' | 'unresolved';",
        "export type Outcome = 'replied' | 'timeout' | 'refused' | 'arrived-no-reply' | 'unresolved' | 'lost';",
    ),
)
edit('src/engine/simulation/context.ts', ("  path?: 'private' | 'public';", "  path?: 'private' | 'public' | 'self';"))
edit(
    'src/engine/network/cidr.ts',
    (
        "const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];\n",
        """const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

/** True when the IPv4 address is in a private range of RFC 1918, which the internet does not deliver. */
export function isPrivateIpv4(ip: string): boolean {
  return PRIVATE_RANGES.some((range) => ipInCidr(ip, range));
}
""",
    ),
)
edit('src/engine/simulation/stages/firewall-out.ts', ('  if (!device) return CONTINUE;', "  if (!device || ctx.path === 'self') return CONTINUE;"))
edit('src/engine/simulation/stages/firewall-in.ts', ('export const firewallInStage: Stage = (ctx) => {\n', "export const firewallInStage: Stage = (ctx) => {\n  if (ctx.path === 'self') return CONTINUE;\n"))
edit(
    'src/copy/reasons.ts',
    (
        """    case 'route-private-from-outside':
      return `${reason.ip} es una {{private-ip}}: desde internet no hay camino hasta ella.`;
    case 'route-no-private-instance':
      return `Ninguna {{ec2-instance}} tiene la {{private-ip}} ${reason.ip}.`;""",
        """    case 'route-private-from-outside':
      return 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.';
    case 'route-no-device':
      return 'Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.';""",
    ),
    (
        "    case 'route-from-internet':\n      return 'Entra desde internet por el {{internet-gateway}}.';",
        "    case 'route-from-internet':\n      return 'Entra desde internet por el {{internet-gateway}}.';\n    case 'route-self':\n      return 'Va a la propia IP del dispositivo: no sale a la red.';",
    ),
)
edit(
    'src/copy/packet-labels.ts',
    ("  unresolved: 'No salió: el nombre no se pudo convertir en una IP.',\n", "  unresolved: 'No salió: el nombre no se pudo convertir en una IP.',\n  lost: 'Se perdió: no llegó a ningún dispositivo.',\n"),
)
edit(
    'src/scene/layout.ts',
    ('const STAMP_SPREAD = 0.8;', "const STAMP_SPREAD = 0.8;\nconst GATEWAY_PLACES = ['igw', 'internet'];"),
    ("(s.stage === 'route' && s.at === 'igw')", "(s.stage === 'route' && GATEWAY_PLACES.includes(s.at))"),
)
print('route outcomes in place')
EOF
```

Expected: `route outcomes in place`.

- [ ] **Step 5: Comprobar que pasan**

```bash
npm run typecheck
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
```

Expected: `typecheck` sin errores; `Tests 437 passed (437)`; `git diff` sin salida. El test de `scene/layout.test.ts` «a private IP from the internet ends at the internet gateway» sigue pasando sin cambios: es el dibujo de hoy.

- [ ] **Step 6: Guía de la simulación**

En `src/engine/simulation/CLAUDE.md`, después de la línea

```markdown
- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
```

agregar:

```markdown
- Outcomes: `replied`, `timeout`, `refused`, `arrived-no-reply`, `unresolved` and `lost`. A packet is lost when no device of the network has its IP, or when it goes from the internet to a private IP (RFC 1918). A device that sends a packet to its own IP answers itself, past no firewall.
```

- [ ] **Step 7: Verificar**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git status --short
git commit -m "feat(engine): lose packets in the network and the internet, and answer a ping to the own IP"
```

---

### Task 6: Firewalls por tipo y dispositivos sin firewall

Las dos etapas de firewall comparten `passFirewalls` (`src/engine/simulation/firewall-check.ts`): un dispositivo sin firewalls deja pasar todo sin paso; si tiene, el paso nombra el tipo (`firewallKind`). `copy` elige el texto por tipo; el bloqueo de un `host-firewall` dice el texto del spec. `reachesHost` pasa a «llegó al host» y la batería de sondas cuenta solo lo que un firewall dejó entrar. El Echo Reply que llega toma el texto del spec.

**Files:**
- Create: `src/engine/simulation/firewall-check.ts`
- Modify: `src/engine/simulation/stages/firewall-in.ts` (reescribir), `src/engine/simulation/stages/firewall-out.ts` (reescribir), `src/engine/network/types.ts`, `src/engine/index.ts`, `src/engine/simulation/trace.ts`, `src/engine/simulation/context.ts`, `src/engine/exposure/exposure.ts`, `src/copy/reasons.ts`, `src/engine/simulation/CLAUDE.md`, `src/engine/exposure/CLAUDE.md`, `README.md`
- Test: `src/engine/simulation/simulate.test.ts`, `src/engine/exposure/exposure.test.ts`, `src/engine/simulation/checkpoints.test.ts`, `src/copy/reasons.test.ts`, `src/levels/04-iaas/golden-traces.test.ts`

**Interfaces:**
- Consumes: `officeNet`, `OFFICE`, `withDevice`, `withInbound` (Tareas 2 y 4); `Firewall.kind` (Tarea 4).
- Produces:
  - `FirewallKind = Firewall['kind']`, exportado por `@/engine`.
  - Los cuatro motivos `firewall-out-pass|drop` y `firewall-in-pass|drop` llevan `{ deviceId, firewallKind }`.
  - `passFirewalls(ctx: SimContext, device: Device, direction: 'inbound' | 'outbound', peer: PeerContext): StageResult`. `firewallsOf` se muda de `context.ts` a `firewall-check.ts` (privada).
  - `reachesHost(trace)` = hay un paso `host`. `extraOpenings` usa una función privada `passesFirewall` (un paso `firewall-in` con `pass`).
  - `FIREWALL_TEXT: Record<FirewallKind, …>` en `src/copy/reasons.ts`.

- [ ] **Step 1: Escribir los tests que fallan**

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


def append(path, text):
    Path(path).write_text(Path(path).read_text() + text)


edit(
    'src/copy/reasons.test.ts',
    (
        """  [{ code: 'firewall-out-pass', deviceId: 'servidor1' }, 'El {{security-group}} de servidor1 lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1' }, 'Se queda en el {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2' }, 'El {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Llega un {{echo-reply}} que nadie pidió: servidor2 no contesta.'],""",
        """  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'security-group' }, 'El {{security-group}} de servidor1 lo deja salir.'],
  [
    { code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'security-group' },
    'Se queda en el {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.',
  ],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'security-group' }, 'El {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' }, SG_IN_DROP],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'El firewall de servidor1 lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'Se queda en el firewall de servidor1: ninguna regla lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'El firewall de servidor2 lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'Se queda en el firewall de servidor2: ninguna regla lo deja entrar.'],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.'],""",
    ),
)
text = Path('src/engine/simulation/checkpoints.test.ts').read_text()
old = "code: 'firewall-in-drop', deviceId: 'servidor2' }"
if text.count(old) != 2:
    raise SystemExit('checkpoints.test.ts: expected 2 firewall-in-drop reasons')
Path('src/engine/simulation/checkpoints.test.ts').write_text(text.replace(old, "code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' }"))
edit(
    'src/engine/simulation/simulate.test.ts',
    ("import { deathPoint } from './checkpoints';", "import { deathPoint, stopStep } from './checkpoints';"),
    (
        "const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));",
        "const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));\nconst guardedOffice = (): Network => withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });",
    ),
)
append(
    'src/engine/simulation/simulate.test.ts',
    """
describe('devices and their firewalls', () => {
  it('a device without a firewall receives everything: an Echo Reply arrives and nobody answers it', () => {
    const trace = simulate(officeNet(), { from: device('your-laptop'), to: OFFICE.lucia, protocol: 'icmp', icmpType: 0 });
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(trace.steps.map((step) => step.stage)).toEqual(['route', 'host']);
    expect(stopStep(trace)?.reason).toEqual({ code: 'host-unsolicited-icmp', deviceId: 'lucia-laptop', icmpType: 0 });
  });

  it('a host firewall without inbound rules blocks the ping, and its step names its kind', () => {
    const trace = simulate(guardedOffice(), ping(device('your-laptop'), OFFICE.lucia));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-in', at: 'lucia-laptop' });
    expect(stopStep(trace)?.reason).toEqual({ code: 'firewall-in-drop', deviceId: 'lucia-laptop', firewallKind: 'host-firewall' });
  });

  it('a host firewall rule for Echo Request from your laptop lets the ping in, and the reply comes back', () => {
    const fromYou = { id: 'echo-you', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE.you}/32` } } as const;
    expect(simulate(withInbound(guardedOffice(), 'fw-lucia', fromYou), ping(device('your-laptop'), OFFICE.lucia)).outcome).toBe('replied');
  });

  it('a Security Group step names its kind too', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), S2.private));
    expect(stopStep(trace)?.reason).toEqual({ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' });
  });
});
""",
)
edit(
    'src/engine/exposure/exposure.test.ts',
    (
        "import { extraOpenings, flowKey, probePackets } from './exposure';\nimport { actor, device, echoFrom, lab03Net, ping, tcp, withInbound } from '@/testing';",
        "import { simulate } from '@/engine/simulation/simulate';\nimport { extraOpenings, flowKey, probePackets, reachesHost } from './exposure';\nimport { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, tcp, withDevice, withInbound } from '@/testing';",
    ),
)
append(
    'src/engine/exposure/exposure.test.ts',
    """
describe('devices without a firewall', () => {
  it('a packet gets to them, but they open nothing', () => {
    const net = officeNet();
    expect(reachesHost(simulate(net, ping(device('your-laptop'), OFFICE.printer)))).toBe(true);
    expect(extraOpenings(net, [])).toEqual([]);
  });

  it('a host firewall that lets in more than the expected ping is an opening', () => {
    const guarded = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    const fromPrinter = { id: 'echo-printer', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE.printer}/32` } } as const;
    expect(extraOpenings(withInbound(guarded, 'fw-lucia', fromPrinter), [ping(device('your-laptop'), OFFICE.lucia)])).toEqual([ping(device('printer'), OFFICE.lucia)]);
  });
});
""",
)
print('tests written')
EOF
```

Expected: `tests written`.

Reemplazar entero `src/levels/04-iaas/golden-traces.test.ts`. Suma `ADDED_KEYS`, el dato que la grabación no tenía:

```ts
import { describe, expect, it } from 'vitest';
import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
import { applyMove, solvedWorld, startWorld } from '@/levels/world';

const CHAPTER = 4;
const FIXTURE = './golden-traces.json';
const RECORDED_KEYS = new Map([
  ['deviceId', 'instanceId'],
  ['firewallId', 'sgId'],
]);
const RECORDED_VALUES = new Map([
  ['device', 'instance'],
  ['firewall-out', 'sg-out'],
  ['firewall-in', 'sg-in'],
  ['host', 'linux'],
  ['firewall-out-pass', 'sg-out-pass'],
  ['firewall-out-drop', 'sg-out-drop'],
  ['firewall-in-pass', 'sg-in-pass'],
  ['firewall-in-drop', 'sg-in-drop'],
  ['host-unsolicited-icmp', 'linux-unsolicited-icmp'],
  ['host-ignores-echo', 'linux-ignores-echo'],
  ['host-replies', 'linux-replies'],
  ['host-refused', 'linux-refused'],
  ['host-accepts', 'linux-accepts'],
  ['host-udp-no-service', 'linux-udp-no-service'],
  ['route-no-public-device', 'route-no-public-instance'],
]);
const ADDED_KEYS = new Set(['firewallKind']);

function recorded(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(recorded);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !ADDED_KEYS.has(key))
        .map(([key, inner]) => [RECORDED_KEYS.get(key) ?? key, recorded(inner)]),
    );
  }
  return typeof value === 'string' ? (RECORDED_VALUES.get(value) ?? value) : value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
  const placed = start.firewalls.flatMap((firewall) =>
    incident.chips.what.flatMap((what) =>
      incident.chips.from.map((from): [string, Network] => [
        `start+${firewall.id}:${what.id}<-${from.id}`,
        applyMove(start, incident, { type: 'placeRule', firewallId: firewall.id, whatId: what.id, fromId: from.id }),
      ]),
    ),
  );
  return [['start', start], ['solved', solvedWorld(INCIDENTS, incident.id)], ...placed];
}

function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => incident.chapter === CHAPTER).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
      const expected = incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
      return [
        ...incident.flows.map((flow): [string, unknown] => [`${incident.id} ${name} ${flow.id}`, simulate(world, flow.packet)]),
        [`${incident.id} ${name} extra-openings`, extraOpenings(world, expected)],
      ];
    }),
  );
}

function serialize(entries: [string, unknown][]): string {
  return `{\n${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(canonical(recorded(value)))}`).join(',\n')}\n}\n`;
}

describe('chapter 4 golden traces', () => {
  it('keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model', async () => {
    await expect(serialize(references())).toMatchFileSnapshot(FIXTURE);
  });
});
```

- [ ] **Step 2: Comprobar que fallan**

```bash
npx vitest run src/engine src/copy src/levels/04-iaas
```

Expected: FAIL en 3 archivos (`simulate.test.ts`, `exposure.test.ts`, `reasons.test.ts`), 11 tests: falta `firewallKind`, el Echo Reply a un dispositivo sin firewall se queda en `firewall-in`, y los textos de `host-firewall`. El test dorado pasa.

- [ ] **Step 3: El filtro compartido por las dos etapas**

Contenido completo de `src/engine/simulation/firewall-check.ts`:

```ts
import type { Device, Firewall, Network } from '@/engine/network/types';
import { CONTINUE, stop, type SimContext, type StageResult } from './context';
import { checkRules, type PeerContext } from './rules';

const STEP = {
  inbound: { stage: 'firewall-in', pass: 'firewall-in-pass', drop: 'firewall-in-drop' },
  outbound: { stage: 'firewall-out', pass: 'firewall-out-pass', drop: 'firewall-out-drop' },
} as const;

function firewallsOf(net: Network, device: Device): Firewall[] {
  return device.firewallIds.flatMap((id) => net.firewalls.filter((f) => f.id === id));
}

/** Checks the packet against the device's firewalls in one direction and records the step; a device without firewalls lets everything through, with no step. */
export function passFirewalls(ctx: SimContext, device: Device, direction: keyof typeof STEP, peer: PeerContext): StageResult {
  const firewalls = firewallsOf(ctx.net, device);
  if (firewalls.length === 0) return CONTINUE;
  const { allowed, checks } = checkRules(firewalls, direction, ctx.packet, peer);
  const step = STEP[direction];
  ctx.steps.push({
    stage: step.stage,
    at: device.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? step.pass : step.drop, deviceId: device.id, firewallKind: firewalls[0].kind },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
}
```

Contenido completo de `src/engine/simulation/stages/firewall-in.ts`:

```ts
import { CONTINUE, type Stage } from '@/engine/simulation/context';
import { passFirewalls } from '@/engine/simulation/firewall-check';

export const firewallInStage: Stage = (ctx) => {
  if (ctx.path === 'self') return CONTINUE;
  const source = ctx.source.device;
  const firewallIds = ctx.path === 'private' && source ? source.firewallIds : [];
  return passFirewalls(ctx, ctx.dest!, 'inbound', { ip: ctx.effectiveSource!, firewallIds });
};
```

Contenido completo de `src/engine/simulation/stages/firewall-out.ts`:

```ts
import { CONTINUE, type Stage } from '@/engine/simulation/context';
import { passFirewalls } from '@/engine/simulation/firewall-check';

export const firewallOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device || ctx.path === 'self') return CONTINUE;
  const firewallIds = ctx.path === 'private' ? ctx.dest!.firewallIds : [];
  return passFirewalls(ctx, device, 'outbound', { ip: ctx.destIp!, firewallIds });
};
```

- [ ] **Step 4: Tipo, motivos, sondas y textos**

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
    'src/engine/network/types.ts',
    ('export type Firewall = z.infer<typeof firewallSchema>;', "export type Firewall = z.infer<typeof firewallSchema>;\nexport type FirewallKind = Firewall['kind'];"),
)
edit(
    'src/engine/index.ts',
    (
        "export type { Actor, Device, Endpoint, Firewall, Network, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from './network/types';",
        "export type { Actor, Device, Endpoint, Firewall, FirewallKind, Network, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from './network/types';",
    ),
)
edit(
    'src/engine/simulation/trace.ts',
    ("import type { IcmpType } from '@/engine/network/types';", "import type { FirewallKind, IcmpType } from '@/engine/network/types';"),
    ("  | { code: 'firewall-out-pass'; deviceId: string }", "  | { code: 'firewall-out-pass'; deviceId: string; firewallKind: FirewallKind }"),
    ("  | { code: 'firewall-out-drop'; deviceId: string }", "  | { code: 'firewall-out-drop'; deviceId: string; firewallKind: FirewallKind }"),
    ("  | { code: 'firewall-in-pass'; deviceId: string }", "  | { code: 'firewall-in-pass'; deviceId: string; firewallKind: FirewallKind }"),
    ("  | { code: 'firewall-in-drop'; deviceId: string }", "  | { code: 'firewall-in-drop'; deviceId: string; firewallKind: FirewallKind }"),
)
edit(
    'src/engine/simulation/context.ts',
    ("import type { Device, Endpoint, Firewall, Network, PacketSpec } from '@/engine/network/types';", "import type { Device, Endpoint, Network, PacketSpec } from '@/engine/network/types';"),
    (
        'export function firewallsOf(net: Network, device: Device): Firewall[] {\n  return device.firewallIds.flatMap((id) => net.firewalls.filter((f) => f.id === id));\n}\n\n',
        '',
    ),
)
edit(
    'src/engine/exposure/exposure.ts',
    (
        """/** True when the packet passed the destination's inbound firewalls, even if the host then stays silent. */
export function reachesHost(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'pass');
}""",
        """/** True when the packet got to the destination's host, past its firewalls or with none, even if the host then stays silent. */
export function reachesHost(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'host');
}

function passesFirewall(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'pass');
}""",
    ),
    (
        '/** Returns the probes that reach a host without matching any expected flow. */',
        '/** Returns the probes that a firewall lets in without matching any expected flow; a device without firewalls opens nothing. */',
    ),
    ('    return reachesHost(trace) && trace.destinationId !== null', '    return passesFirewall(trace) && trace.destinationId !== null'),
)
edit(
    'src/copy/reasons.ts',
    (
        """import type { Network, Reason } from '@/engine';
import { deviceName } from './packet-labels';
import type { TermText } from './term-text';
""",
        """import type { FirewallKind, Network, Reason } from '@/engine';
import { deviceName } from './packet-labels';
import type { TermText } from './term-text';

type FirewallSentence = (device: string) => TermText;

const FIREWALL_TEXT: Record<FirewallKind, { passOut: FirewallSentence; dropOut: FirewallSentence; passIn: FirewallSentence; dropIn: FirewallSentence }> = {
  'security-group': {
    passOut: (device) => `El {{security-group}} de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{outbound-rule}} lo deja salir.`,
    passIn: (device) => `El {{security-group}} de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{inbound-rule}} lo deja entrar.`,
  },
  'host-firewall': {
    passOut: (device) => `El firewall de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el firewall de ${device}: ninguna regla lo deja salir.`,
    passIn: (device) => `El firewall de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el firewall de ${device}: ninguna regla lo deja entrar.`,
  },
};
""",
    ),
    (
        """    case 'firewall-out-pass':
      return `El {{security-group}} de ${deviceName(net, reason.deviceId)} lo deja salir.`;
    case 'firewall-out-drop':
      return `Se queda en el {{security-group}} de ${deviceName(net, reason.deviceId)}: ninguna {{outbound-rule}} lo deja salir.`;
    case 'firewall-in-pass':
      return `El {{security-group}} de ${deviceName(net, reason.deviceId)} lo deja entrar.`;
    case 'firewall-in-drop':
      return `Se queda en el {{security-group}} de ${deviceName(net, reason.deviceId)}: ninguna {{inbound-rule}} lo deja entrar.`;
    case 'host-unsolicited-icmp':
      return `Llega un {{echo-reply}} que nadie pidió: ${deviceName(net, reason.deviceId)} no contesta.`;""",
        """    case 'firewall-out-pass':
      return FIREWALL_TEXT[reason.firewallKind].passOut(deviceName(net, reason.deviceId));
    case 'firewall-out-drop':
      return FIREWALL_TEXT[reason.firewallKind].dropOut(deviceName(net, reason.deviceId));
    case 'firewall-in-pass':
      return FIREWALL_TEXT[reason.firewallKind].passIn(deviceName(net, reason.deviceId));
    case 'firewall-in-drop':
      return FIREWALL_TEXT[reason.firewallKind].dropIn(deviceName(net, reason.deviceId));
    case 'host-unsolicited-icmp':
      return 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.';""",
    ),
)
print('firewalls by kind in place')
EOF
```

Expected: `firewalls by kind in place`.

- [ ] **Step 5: Comprobar que pasan**

```bash
npm run typecheck
npx vitest run
git diff --exit-code src/levels/04-iaas/golden-traces.json
```

Expected: `typecheck` sin errores; `Tests 451 passed (451)` en 40 archivos; `git diff` sin salida.

- [ ] **Step 6: Guías y README**

En `src/engine/simulation/CLAUDE.md`, después de la viñeta de los resultados (Tarea 5), agregar:

```markdown
- `firewall-check.ts` filters a packet through a device's firewalls for both firewall stages and names their kind in the step. A device without firewalls is not filtered and gets no step.
```

En `src/engine/exposure/CLAUDE.md`, la línea

```markdown
The fixed probe battery behind "only what is needed": which probes reach a host without being an expected flow.
```

pasa a

```markdown
The fixed probe battery behind "only what is needed": which probes a firewall lets in without being an expected flow. A device without firewalls opens nothing. `reachesHost` says whether a packet got to its device, past its firewalls or with none.
```

En `README.md`:

1. Al final del primer párrafo, después de `and an "Enviar solución" button.`, agregar: ` The engine models any network: an office or a VPC, with devices and firewalls by kind.`
2. La línea `Design: …` pasa a:

```markdown
Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · [chapter 1 spec](../../docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md) · [generic model](../../docs/plans/2026-10-09-follow-the-packet-generic-model.md)
```

Chequeo de links desde la raíz del repo (regla del `CLAUDE.md` raíz):

```bash
cd ../.. && setopt nullglob 2>/dev/null; broken=$(for f in README.md syllabus.md artifacts/README.md labs/*/README.md exercises/*/README.md concepts/*.md projects/*/README.md; do [ -f "$f" ] || continue; d=$(dirname "$f"); grep -oE '\]\([^)#]+' "$f" | sed 's/^](//' | grep -vE '^(https?:|mailto:)' | while read -r l; do [ -e "$d/$l" ] || echo "ROTO: $f -> $l"; done; done); [ -z "$broken" ] && echo "LINKS OK" || echo "$broken"; cd projects/follow-the-packet
```

Expected: `LINKS OK`.

- [ ] **Step 7: Verificar**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src README.md
git status --short
git commit -m "feat(engine): filter by firewall kind and let a device without a firewall receive everything"
```

---

## Cobertura del spec

| Pide el spec (plan 1) | Dónde |
|------------------------|-------|
| Guardar los recorridos del 04-01 y el 04-02 y la batería de sondas antes del refactor; un test exige que sigan idénticos | Tarea 1; cada tarea lo comprueba con `git diff --exit-code` |
| `kind: 'office' \| 'vpc'`, `cidr`, `region?`, `subnets?`, `edge`, actores | Tareas 2 (`cidr`) y 4 |
| `devices` con `kind`, `privateIp`, `publicIp?`, `subnetId?`, `firewallIds`, `host`, `appTarget?` | Tareas 2 y 4 |
| `firewalls` con `kind`, `inbound`, `outbound` | Tareas 2 y 4 |
| Renombres de campos, etapas y endpoint | Tareas 2 y 3 |
| Peer `sg` solo en firewalls `security-group` | Tarea 4 (`checkFirewalls`) |
| Red `office` sin `region`, `subnets` ni `publicIp`; IP en su `cidr`; `cidr` de RFC 1918 | Tarea 4 (`checkOffice`, `isPrivateCidr`) |
| Perdido en la red | Tarea 5 (`route-no-device`) |
| Perdido en internet (IP privada desde internet) | Tarea 5 (`route-private-from-outside`, `isPrivateIpv4`) |
| Echo Reply que llega, sin vuelta | Tarea 6 (texto; llega a un dispositivo sin firewall) |
| Ping a la propia IP, sin salir a la red | Tarea 5 (`route-self`) |
| Bloqueado por un `host-firewall` | Tarea 6 (`FIREWALL_TEXT['host-firewall'].dropIn`) |
| La batería recorre `devices` y sigue probando Echo Reply | Tarea 2 |
| Consumidores migrados sin cambios visibles en el capítulo 4 | Tareas 2 a 6; Playwright en cada `npm run check` |
| Guías `CLAUDE.md` y reglas que nombran lo renombrado | Tareas 1 (04-iaas), 2 (game/view), 3 (stages, `english-only`), 4 (engine, network, testing), 5 y 6 (simulation, exposure) |
| Rechazar flujos de la oficina hacia afuera | Plan 3 (Desviación 10) |
