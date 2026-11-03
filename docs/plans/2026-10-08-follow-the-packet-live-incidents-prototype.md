# Sigue el paquete · Plan 2 de 2: prototipo de incidentes en vivo (04-01 y 04-02)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir los incidentes 04-01 y 04-02 completos con la mecánica nueva (aviso de Lucía, tráfico vivo, inspección, tarjeta de tarea, cierre con barra de 3 s, «¿Qué pasó?», estrellas y resultado), para que el estudiante los juegue y decida si se construyen 04-03 a 04-08.

**Architecture:**
1. `copy` gana el registro de términos y un formato de texto con etiquetas (`{{security-group}}`) que sirve para dibujar y para comprobar la escalera.
2. `levels` gana el contrato del incidente (zod), los dos incidentes, la cadena del mundo (solución del anterior + cambios) y la escalera (términos conocidos y partes configurables).
3. `game` (capa nueva) guarda la sesión del incidente en un reducer puro: mundo, recorridos de los flujos, barras de estabilidad que avanzan con `tick(ms)`, avisos, pistas, explicación y estrellas. `game/view/` calcula lo que muestran el mapa y el cuadro de inspección, filtrado por los términos conocidos.
4. `scene` dibuja el mundo con etiquetas que son botones, anima el tráfico a partir de los recorridos y ancla la tarjeta de tarea junto a su puerta. `ui` arma la pantalla del incidente.

**Tech Stack:** Vite 8, TypeScript 6.0.3, React 19, React Three Fiber 9, drei 10, three 0.186, zod 4, `@mantine/hooks` 9.7.1, Vitest 5, Testing Library + user-event, Playwright. Dependencia nueva: `just-compare` 2.3.0.

**Spec:** `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md` (secciones "El incidente, paso a paso", "Ver, configurar, agregar", "Escalera de términos", "Prototipo", "Escena y arte", "Arquitectura", "Tests y validación" y tabla "Relación con el backlog"). Base: `docs/plans/2026-10-08-follow-the-packet-clean-base.md`. Backlog: `docs/plans/2026-10-08-follow-the-packet-followups.md`.

## Global Constraints

- **Rutas.** Carpeta del proyecto: `projects/follow-the-packet/`. Todas las rutas son relativas a ella, salvo las que empiezan por `docs/` (raíz del repo).
- **Rama.** `feat/live-incidents` (la dejó el plan 1). No se crea otra.
- **Reglas.** Valen las 19 de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: capas `app → ui → game · scene · storage → levels → copy → engine`, barrels, alias `@/`, sin `../`, tope de 12 archivos por carpeta (sin contar `CLAUDE.md`), un `CLAUDE.md` en cada carpeta nueva.
  - `view-renders-domain-result`: `scene/` y `ui/` solo importan tipos de `@/engine`; todo resultado que muestran sale de la sesión de `game`.
  - `pure-domain-core`: `engine` sin reloj, azar ni almacenamiento. `game` tampoco lee el reloj: el tiempo llega como `tick(ms)`.
  - `english-only` y `no-comments`: código, tests y guías en inglés; solo JSDoc de entrada y salida. Texto visible en español solo en `src/copy/` y en los archivos de incidente.
  - `plain-language-copy`: una idea por mensaje, frases cortas, palabra sencilla primero.
  - `no-raw-effects`: efectos solo en archivos `use-*.ts`; preferir `@mantine/hooks`.
  - `user-event-for-interactions`: `const user = userEvent.setup()` en cada test y `await` en cada interacción.
  - `caller-controls-visibility`: un componente no se oculta a sí mismo según sus datos; decide quien lo coloca.
  - `prefer-just-utilities`: igualdad profunda con `just-compare`.
- **Escalera de términos.** Ningún texto visible, pieza, campo de inspección ni ficha usa un término antes del incidente que lo introduce. Todo texto que usa un término lo marca con `{{term-id}}` o `{{term-id|palabras}}`.
- **Dependencia nueva permitida:** solo `just-compare@2.3.0` (2.3.0 publicada el 2022-12-17; solo tiene scripts `test` y `build`, ningún script de instalación; tipos propios. Comprobado con `npm view` el 2026-10-08). Se instala con `npm install just-compare` en la Tarea 5, junto con su primer uso.
- **"Listo"** = `npm run check` pasa entero.
- **Commits.** Los pasos "Commit" se ejecutan solo si el estudiante aprobó commits por tarea al empezar la ejecución. Si no, se omiten.
- Ningún comando `aws`.

## Desviaciones del spec (para revisar antes de ejecutar)

1. **Registro de términos.** Trae los 24 términos de la escalera del capítulo 4, porque los textos de los motivos del motor y los campos futuros de inspección ya los nombran. Mientras no existan 04-03 a 04-08, la prueba es "cada término se introduce **a lo sumo** una vez"; con el capítulo completo pasa a "exactamente una".
2. **Sin campo `tools`** en el contrato: llega con tcpdump en 04-07 (KISS).
3. **Cuadro de inspección fijo** en el panel lateral, no flotante junto a la pieza: evita otra superposición en el mapa.
4. **Marca «nuevo»:** en la tarjeta de Lucía (aviso, tareas y una lista "Palabras nuevas" con cada definición), no en cada aparición del término.
5. **Paquetes inspeccionables por su sello:** cada flujo tiene un sello ✓/✕ fijo al final de su camino, que es un botón. Los paquetes en movimiento no se inspeccionan.
6. **Orden de las 3 explicaciones = orden del archivo.** Sin azar; cada incidente pone la correcta en otra posición.
7. **La ruta sigue siendo `#/level/NN-NN`.**
8. **Reglas de salida fuera del cuadro de inspección** hasta 04-03: su término llega ahí y todavía no tienen fichas para nombrarlas.

## Review Focus

1. **Abrir de más mientras la barra se llena:** la barra vuelve a cero, el incidente no se cierra y Lucía avisa una sola vez por episodio. Test: Tarea 8.
2. **La misma regla dos veces** (o una ficha que equivale a una regla que ya existe): no aparece una fila repetida, como en AWS. Test: Tarea 5.
3. **El incidente se cierra con la tarjeta abierta:** la tarjeta se va y el foco cae en la pregunta de Lucía, no en `body`. Test: Tarea 15.
4. **Quitar una regla con el teclado:** el foco se queda dentro de la tarjeta (en su título). Test: Tarea 12.
5. **«Siguiente incidente» empieza limpio:** 04-02 abre con la tarea pendiente y sin tarjeta abierta, no con el estado del 04-01. Test: Tarea 16.

## Árbol al terminar (solo lo nuevo o cambiado)

```
src/
├── app.tsx  app.test.tsx  styles.css
├── copy/            terms.ts terms.test.ts term-text.ts term-text.test.ts reasons.ts reasons.test.ts
│                    packet-labels.ts packet-labels.test.ts ui.ts incident-ui.ts index.ts
├── levels/          incident.ts incident.test.ts registry.ts registry.test.ts chips.ts world.ts world.test.ts
│   │                ladder.ts ladder.test.ts chapters.ts chapters.test.ts index.ts
│   └── 04-iaas/     CLAUDE.md shared.ts 01-the-first-ping.ts 02-open-just-enough.ts
├── game/            CLAUDE.md index.ts flow-runs.ts tasks.ts tasks.test.ts stars.ts stars.test.ts
│   │                session.ts session.test.ts incidents.test.ts
│   └── view/        CLAUDE.md piece-id.ts pieces.ts pieces.test.ts barrier.ts inspection.ts inspection.test.ts ladder.test.ts
├── storage/         progress.ts progress.test.ts
├── scene/           index.ts game-scene.tsx layout.ts layout.test.ts pieces.tsx
│   ├── overlay/     CLAUDE.md piece-label.tsx piece-label.test.tsx piece-anchor.tsx card-anchor.tsx use-card-side.ts inspect-handlers.ts
│   └── traffic/     CLAUDE.md traffic.tsx flow-traffic.tsx packet-run.tsx use-packet-runs.ts schedule.ts schedule.test.ts stamp.tsx still-path.tsx
└── ui/              index.ts roadmap.tsx roadmap.test.tsx notice-page.tsx stars.tsx tagged-text.tsx tagged-text.test.tsx incident-page.tsx
    └── incident/    CLAUDE.md incident-screen.tsx incident-screen.test.tsx use-stability-clock.ts use-focus-on-mount.ts
                     lucia-card.tsx lucia-card.test.tsx task-card.tsx task-card.test.tsx inspection-box.tsx explanation-card.tsx result-card.tsx
tests/e2e/           roadmap.spec.ts incidents.spec.ts console-errors.ts
```

Se borran: `src/copy/rule-labels.ts` (+ test), `src/levels/level-entry.ts`, `src/ui/not-found.tsx`.

---

### Task 1: Registro de términos y texto con etiquetas

**Files:**
- Create: `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/copy/term-text.ts`, `src/copy/term-text.test.ts`
- Modify: `src/copy/index.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TERMS: Record<TermId, Term>`, `interface Term { name: string; definition: string }`, `type TermId`, `isTermId(value: string): value is TermId`.
  - `type TermText = string`, `type TermSegment = { kind: 'text'; text: string } | { kind: 'term'; id: TermId; text: string }`.
  - `parseTermText(text: TermText): TermSegment[]` (lanza `unknown term: <id>`), `termsIn(text: TermText): TermId[]`, `toPlainText(text: TermText): string`.

- [ ] **Step 1: Comprobar el punto de partida**

`node_modules/@mantine` estaba vacío el 2026-10-08, así que primero se reinstala desde el lockfile:

```bash
npm ci
npx playwright install chromium
npm run check
```

Expected: `npm run check` PASS. Si falla, parar y avisar: el plan parte de una base en verde.

- [ ] **Step 2: Escribir los tests que fallan**

`src/copy/terms.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TERMS, isTermId } from './terms';

const MAX_DEFINITION_LENGTH = 120;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('term registry', () => {
  it.each(Object.entries(TERMS))('%s has a name and a short definition', (_id, term) => {
    expect(term.name.trim()).not.toBe('');
    expect(term.definition.trim()).not.toBe('');
    expect(term.definition.length).toBeLessThanOrEqual(MAX_DEFINITION_LENGTH);
  });

  it('ids are English kebab-case', () => {
    for (const id of Object.keys(TERMS)) expect(id).toMatch(KEBAB_CASE);
  });

  it('recognizes registered ids only', () => {
    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('firewall')).toBe(false);
    expect(isTermId('toString')).toBe(false);
  });
});
```

`src/copy/term-text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseTermText, termsIn, toPlainText } from './term-text';

describe('parseTermText', () => {
  it('keeps a text without tags as one plain segment', () => {
    expect(parseTermText('servidor1 no contesta.')).toEqual([{ kind: 'text', text: 'servidor1 no contesta.' }]);
  });

  it('shows a tag with the name of its term', () => {
    expect(parseTermText('Mira la {{security-group}} de servidor2.')).toEqual([
      { kind: 'text', text: 'Mira la ' },
      { kind: 'term', id: 'security-group', text: 'puerta' },
      { kind: 'text', text: ' de servidor2.' },
    ]);
  });

  it('a tag can show its own words', () => {
    expect(parseTermText('{{rule|Reglas}}')).toEqual([{ kind: 'term', id: 'rule', text: 'Reglas' }]);
  });

  it('rejects a tag whose term is not registered', () => {
    expect(() => parseTermText('El {{firewall}} bloquea.')).toThrow('unknown term: firewall');
  });
});

describe('termsIn and toPlainText', () => {
  const text = 'Un {{ping}} pasa si una {{rule|regla}} de la {{security-group}} lo permite.';

  it('lists the terms in order', () => {
    expect(termsIn(text)).toEqual(['ping', 'rule', 'security-group']);
  });

  it('reads the way the player sees it', () => {
    expect(toPlainText(text)).toBe('Un ping pasa si una regla de la puerta lo permite.');
  });
});
```

- [ ] **Step 3: Correrlos y verlos fallar**

Run: `npx vitest run src/copy/terms.test.ts src/copy/term-text.test.ts`
Expected: FAIL con "Failed to resolve import './terms'" y "'./term-text'".

- [ ] **Step 4: Escribir el registro**

`src/copy/terms.ts` (los 24 términos de la escalera del capítulo 4; ver "Desviaciones", punto 1):

```ts
export interface Term {
  name: string;
  definition: string;
}

export const TERMS = {
  server: { name: 'servidor', definition: 'Una computadora en la nube que corre tus programas. En AWS se llama instancia EC2.' },
  vpc: { name: 'red privada (VPC)', definition: 'Tu red dentro de AWS. Los servidores de adentro se hablan entre sí.' },
  'private-ip': { name: 'IP privada', definition: 'La dirección de un servidor dentro de la red privada. Desde internet no se llega a ella.' },
  ping: { name: 'ping', definition: 'Un mensaje corto que pregunta «¿estás ahí?». Si vuelve la respuesta, hay camino.' },
  'security-group': { name: 'puerta', definition: 'Security Group (SG): la puerta de cada servidor. Solo deja pasar lo que una regla permite.' },
  rule: { name: 'regla', definition: 'Un permiso de la puerta con dos partes: qué puede pasar y desde dónde.' },
  icmp: { name: 'ICMP', definition: 'El tipo de mensaje que usa el ping: avisos cortos entre máquinas.' },
  'echo-request': { name: 'Echo Request', definition: 'La ida del ping: «¿estás ahí?».' },
  'echo-reply': { name: 'Echo Reply', definition: 'La vuelta del ping: «sí, aquí estoy».' },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Abrir solo lo justo: lo que hace falta y solo para quien lo necesita.' },
  stateful: { name: 'stateful', definition: 'La puerta recuerda la conversación: la respuesta a algo que salió vuelve sin otra regla.' },
  'outbound-rule': { name: 'regla de salida', definition: 'Un permiso para lo que sale del servidor.' },
  cidr: { name: 'CIDR', definition: 'Una forma de escribir un rango de IPs: /32 es una sola IP y 0.0.0.0/0 es todo internet.' },
  'vpc-range': { name: 'rango de la VPC', definition: 'Todas las IPs privadas de tu red, escritas como un CIDR.' },
  'public-ip': { name: 'IP pública', definition: 'La dirección de un servidor en internet.' },
  'internet-gateway': { name: 'internet gateway', definition: 'La entrada y la salida entre tu red privada e internet.' },
  nat: { name: 'NAT', definition: 'El cambio del remitente al salir a internet: la IP privada se cambia por la pública.' },
  dns: { name: 'DNS', definition: 'La agenda de internet: convierte un nombre en una IP.' },
  'public-dns-name': { name: 'nombre público', definition: 'El nombre DNS de un servidor en internet. Desde dentro de la red da la IP privada.' },
  'private-dns-name': { name: 'nombre privado', definition: 'El nombre DNS de un servidor que solo funciona dentro de la red privada.' },
  tcpdump: { name: 'tcpdump', definition: 'Un programa que muestra los paquetes que llegan a un servidor y salen de él.' },
  'linux-ignore-ping': { name: 'Linux ignora el ping', definition: 'Un ajuste de Linux: el ping llega, pero nadie lo contesta.' },
  'default-sg': { name: 'puerta default', definition: 'El SG que AWS crea con cada red: deja entrar solo a sus propios miembros.' },
  'multiple-sgs': { name: 'varias puertas', definition: 'Un servidor puede tener varias puertas: pasa lo que permita cualquiera de ellas.' },
} as const satisfies Record<string, Term>;

export type TermId = keyof typeof TERMS;

export function isTermId(value: string): value is TermId {
  return Object.hasOwn(TERMS, value);
}
```

- [ ] **Step 5: Escribir el texto con etiquetas**

`src/copy/term-text.ts`:

```ts
import { TERMS, isTermId, type TermId } from './terms';

export type TermText = string;

export type TermSegment = { kind: 'text'; text: string } | { kind: 'term'; id: TermId; text: string };

const TAG = /\{\{([a-z0-9-]+)(?:\|([^}]+))?\}\}/g;

/** Splits a text into plain and term segments: `{{term-id}}` shows the term's name and `{{term-id|words}}` shows the given words; throws on an unregistered term. */
export function parseTermText(text: TermText): TermSegment[] {
  const segments: TermSegment[] = [];
  const tags = new RegExp(TAG);
  let cursor = 0;
  for (let match = tags.exec(text); match !== null; match = tags.exec(text)) {
    const [tag, id, words] = match;
    if (!isTermId(id)) throw new Error(`unknown term: ${id}`);
    if (match.index > cursor) segments.push({ kind: 'text', text: text.slice(cursor, match.index) });
    segments.push({ kind: 'term', id, text: words ?? TERMS[id].name });
    cursor = match.index + tag.length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}

/** Returns the ids of the terms a text uses, in order of appearance. */
export function termsIn(text: TermText): TermId[] {
  return parseTermText(text).flatMap((segment) => (segment.kind === 'term' ? [segment.id] : []));
}

/** Returns the text as the player reads it, with every tag replaced by its words. */
export function toPlainText(text: TermText): string {
  return parseTermText(text)
    .map((segment) => segment.text)
    .join('');
}
```

- [ ] **Step 6: Exportarlos desde el barrel**

En `src/copy/index.ts`, agregar:

```ts
export { TERMS, isTermId } from './terms';
export type { Term, TermId } from './terms';
export { parseTermText, termsIn, toPlainText } from './term-text';
export type { TermSegment, TermText } from './term-text';
```

- [ ] **Step 7: Correr los tests y el lint**

Run: `npx vitest run src/copy && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/copy
git commit -m "feat(copy): add the term registry and tagged text"
```

---

### Task 2: Motivos y etiquetas de paquete con la escalera

Los textos de los motivos del motor pasan a lenguaje sencillo (backlog B7) y marcan sus términos, para que el cuadro de inspección respete la escalera.

**Files:**
- Modify: `src/engine/simulation/checkpoints.ts`, `src/engine/simulation/checkpoints.test.ts`, `src/engine/exposure/exposure.test.ts`, `src/engine/index.ts`
- Modify (reescribir): `src/copy/reasons.ts`, `src/copy/reasons.test.ts`, `src/copy/packet-labels.ts`, `src/copy/packet-labels.test.ts`, `src/copy/index.ts`
- Delete: `src/copy/rule-labels.ts`, `src/copy/rule-labels.test.ts`

**Interfaces:**
- Consumes: `TermText`, `termsIn`, `toPlainText` (Tarea 1).
- Produces:
  - Motor: `stopStep(trace: Trace): Step | undefined` (en `src/engine/simulation/checkpoints.ts`; `deathPoint` lo usa).
  - Copy: `describeReason(reason: Reason, net: Network): TermText`, `instanceName(net: Network, instanceId: string): string`, `endpointName(endpoint: Endpoint, net: Network): string`, `serviceLabel(packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): TermText`, `packetLabel(packet: PacketSpec, trace: Trace, net: Network): TermText`, `OUTCOME_TEXT: Record<Outcome, TermText>`.

- [ ] **Step 1: Escribir los tests que fallan**

En `src/engine/simulation/checkpoints.test.ts`, agregar al import `stopStep` y este bloque al final:

```ts
describe('stopStep', () => {
  it('is the step that dropped the packet', () => {
    const drop = { stage: 'sg-in', at: 'servidor2', verdict: 'drop', reason: { code: 'sg-in-drop', instanceId: 'servidor2' } } as const;
    const trace: Trace = { ...base, outcome: 'timeout', steps: [{ stage: 'route', at: 'vpc', verdict: 'pass', reason: { code: 'route-private' } }, drop] };
    expect(stopStep(trace)).toEqual(drop);
  });

  it('is undefined when nothing stopped it', () => {
    const trace: Trace = { ...base, outcome: 'replied', steps: [{ stage: 'reply', at: 'servidor2', verdict: 'pass', reason: { code: 'reply-stateful', instanceId: 'servidor2' } }] };
    expect(stopStep(trace)).toBeUndefined();
  });
});
```

En `src/engine/exposure/exposure.test.ts`, dentro de `describe('extraOpenings', …)`, agregar (spec, "Tests y validación" 1: las sondas Echo Reply). Pasa sin cambiar el motor: documenta que la ★2 del 04-02 se puede medir.

```ts
  it('Echo Reply from 0.0.0.0/0 lets the internet in (the day-shift rule of 04-02)', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'reply-world', what: { kind: 'icmp', icmpType: 0 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
    expect(extraOpenings(net, expected)).toContainEqual({ from: actor('probe-internet'), to: S2.public, protocol: 'icmp', icmpType: 0 });
  });
```

`src/copy/reasons.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { simulate, type Reason } from '@/engine';
import { inst, lab03Net, ping } from '@/testing';
import { describeReason } from './reasons';
import { termsIn, toPlainText } from './term-text';

const NET = lab03Net();
const SG_IN_DROP = 'Se queda en la {{security-group}} de servidor2: ninguna {{rule}} lo deja entrar.';
const PUBLIC_NAME = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

const CASES: [Reason, string][] = [
  [{ code: 'dns-unresolved', name: 'db.internal', fromInside: false }, 'El {{dns}} no conoce db.internal cuando se pregunta desde fuera de la {{vpc}}.'],
  [
    { code: 'dns-resolved', name: PUBLIC_NAME, ip: '172.31.38.97', fromInside: true },
    `El {{dns}} convierte ${PUBLIC_NAME} en 172.31.38.97 (se preguntó desde dentro de la {{vpc}}).`,
  ],
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, '172.31.38.97 es una {{private-ip}}: desde internet no hay camino hasta ella.'],
  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ningún {{server}} tiene la {{private-ip}} 172.31.99.9.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
  [{ code: 'route-no-public-instance', ip: '52.0.0.1' }, 'Ningún {{server}} tiene la {{public-ip}} 52.0.0.1.'],
  [{ code: 'route-no-public-ip', instanceId: 'servidor1' }, 'servidor1 no tiene {{public-ip}}: no puede salir a internet.'],
  [
    { code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' },
    'Sale por el {{internet-gateway}} y su remitente cambia de 172.31.16.131 a 54.78.154.66: eso es {{nat}}.',
  ],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],
  [{ code: 'sg-out-pass', instanceId: 'servidor1' }, 'La {{security-group}} de servidor1 lo deja salir.'],
  [{ code: 'sg-out-drop', instanceId: 'servidor1' }, 'Se queda en la {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.'],
  [{ code: 'sg-in-pass', instanceId: 'servidor2' }, 'La {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'sg-in-drop', instanceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'linux-unsolicited-icmp', instanceId: 'servidor2', icmpType: 0 }, 'Llega un {{echo-reply}} que nadie pidió: servidor2 no contesta.'],
  [{ code: 'linux-ignores-echo', instanceId: 'servidor2' }, 'Llega, pero servidor2 tiene activado «{{linux-ignore-ping}}» y no contesta.'],
  [{ code: 'linux-replies', instanceId: 'servidor2' }, 'servidor2 contesta.'],
  [{ code: 'linux-refused', instanceId: 'servidor2', port: 80 }, 'Llega, pero ningún programa escucha en el puerto 80: servidor2 lo rechaza.'],
  [{ code: 'linux-accepts', instanceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'linux-udp-no-service', instanceId: 'servidor2', port: 53 }, 'Llega por UDP al puerto 53, pero en este juego ningún programa UDP contesta.'],
  [{ code: 'reply-stateful', instanceId: 'servidor2' }, 'La respuesta vuelve sola: la {{security-group}} es {{stateful}} y recuerda la conversación.'],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it.each(CASES)('tags only registered terms: %o', (reason) => {
    expect(() => termsIn(describeReason(reason, NET))).not.toThrow();
  });

  it('a ping without an ICMP rule stops at the door, in plain words', () => {
    const trace = simulate(NET, ping(inst('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en la puerta de servidor2: ninguna regla lo deja entrar.');
  });
});
```

`src/copy/packet-labels.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine';
import { actor, inst, lab03Net, ping } from '@/testing';
import { endpointName, packetLabel, serviceLabel } from './packet-labels';

const NET = lab03Net();

describe('packet labels', () => {
  it('name the service, the source and the destination server', () => {
    const packet = ping(inst('servidor1'), '172.31.38.97');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de servidor1 a servidor2');
  });

  it('name an actor, and the internet probe that is not on the map', () => {
    const packet = ping(actor('attacker'), '34.244.254.100');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de Atacante a servidor2');
    expect(endpointName(actor('probe-internet'), NET)).toBe('Internet');
  });

  it('keep the address when the packet reached no server', () => {
    const packet = ping(inst('servidor1'), 'no-existe.example');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de servidor1 a no-existe.example');
  });

  it('tag Echo Reply and leave TCP plain', () => {
    expect(serviceLabel({ protocol: 'icmp', icmpType: 0 })).toBe('{{echo-reply}}');
    expect(serviceLabel({ protocol: 'tcp', port: 22 })).toBe('TCP 22');
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/engine/simulation/checkpoints.test.ts src/copy`
Expected: FAIL: `stopStep` no existe, los textos no coinciden y `packetLabel`/`serviceLabel` no existen.

- [ ] **Step 3: `stopStep` en el motor**

`src/engine/simulation/checkpoints.ts` (reemplazar entero):

```ts
import type { Checkpoint, Step, Trace } from './trace';

/** Returns the step where the packet was dropped or rejected, or undefined when nothing stopped it. */
export function stopStep(trace: Trace): Step | undefined {
  return trace.steps.find((s) => s.verdict === 'drop' || s.verdict === 'reject');
}

/** Returns where the packet stopped, or the reply at its destination when nothing stopped it. */
export function deathPoint(trace: Trace): Checkpoint {
  const step = stopStep(trace);
  if (step) return { stage: step.stage === 'nat' ? 'route' : step.stage, at: step.at };
  return { stage: 'reply', at: trace.destinationId ?? 'vpc' };
}
```

- [ ] **Step 4: Etiquetas de paquete**

`src/copy/packet-labels.ts` (reemplazar entero):

```ts
import type { Endpoint, Network, Outcome, PacketSpec, Trace } from '@/engine';
import type { TermText } from './term-text';

const INTERNET_NAME = 'Internet';

export function instanceName(net: Network, instanceId: string): string {
  return net.instances.find((i) => i.id === instanceId)?.name ?? instanceId;
}

export function endpointName(endpoint: Endpoint, net: Network): string {
  if (endpoint.kind === 'instance') return instanceName(net, endpoint.id);
  return net.actors.find((a) => a.id === endpoint.id)?.name ?? INTERNET_NAME;
}

/** Names what a packet carries, with its term tagged. */
export function serviceLabel(packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): TermText {
  if (packet.protocol === 'icmp') return packet.icmpType === 8 ? '{{ping}}' : '{{echo-reply}}';
  return `${packet.protocol.toUpperCase()} ${packet.port}`;
}

/** Describes a packet as what, from whom and to whom, naming the server the trace reached or else the address it was sent to. */
export function packetLabel(packet: PacketSpec, trace: Trace, net: Network): TermText {
  const to = trace.destinationId ? instanceName(net, trace.destinationId) : packet.to;
  return `${serviceLabel(packet)} de ${endpointName(packet.from, net)} a ${to}`;
}

export const OUTCOME_TEXT: Record<Outcome, TermText> = {
  replied: 'Llegó y volvió la respuesta.',
  timeout: 'No llegó: no volvió ninguna respuesta.',
  refused: 'Llegó, pero ningún programa lo estaba esperando.',
  'arrived-no-reply': 'Llegó, pero nadie contestó.',
  unresolved: 'No salió: el nombre no se pudo convertir en una IP.',
};
```

- [ ] **Step 5: Motivos con etiquetas**

`src/copy/reasons.ts` (reemplazar entero):

```ts
import type { Network, Reason } from '@/engine';
import { instanceName } from './packet-labels';
import type { TermText } from './term-text';

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

/** Turns an engine reason into the sentence the player reads, with its terms tagged. */
export function describeReason(reason: Reason, net: Network): TermText {
  switch (reason.code) {
    case 'dns-unresolved':
      return `El {{dns}} no conoce ${reason.name} cuando se pregunta desde ${side(reason.fromInside)} de la {{vpc}}.`;
    case 'dns-resolved':
      return `El {{dns}} convierte ${reason.name} en ${reason.ip} (se preguntó desde ${side(reason.fromInside)} de la {{vpc}}).`;
    case 'route-private-from-outside':
      return `${reason.ip} es una {{private-ip}}: desde internet no hay camino hasta ella.`;
    case 'route-no-private-instance':
      return `Ningún {{server}} tiene la {{private-ip}} ${reason.ip}.`;
    case 'route-private':
      return 'Viaja por dentro de la {{vpc}}.';
    case 'route-no-public-instance':
      return `Ningún {{server}} tiene la {{public-ip}} ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${instanceName(net, reason.instanceId)} no tiene {{public-ip}}: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el {{internet-gateway}} y su remitente cambia de ${reason.from} a ${reason.to}: eso es {{nat}}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el {{internet-gateway}}.';
    case 'sg-out-pass':
      return `La {{security-group}} de ${instanceName(net, reason.instanceId)} lo deja salir.`;
    case 'sg-out-drop':
      return `Se queda en la {{security-group}} de ${instanceName(net, reason.instanceId)}: ninguna {{outbound-rule}} lo deja salir.`;
    case 'sg-in-pass':
      return `La {{security-group}} de ${instanceName(net, reason.instanceId)} lo deja entrar.`;
    case 'sg-in-drop':
      return `Se queda en la {{security-group}} de ${instanceName(net, reason.instanceId)}: ninguna {{rule}} lo deja entrar.`;
    case 'linux-unsolicited-icmp':
      return `Llega un {{echo-reply}} que nadie pidió: ${instanceName(net, reason.instanceId)} no contesta.`;
    case 'linux-ignores-echo':
      return `Llega, pero ${instanceName(net, reason.instanceId)} tiene activado «{{linux-ignore-ping}}» y no contesta.`;
    case 'linux-replies':
      return `${instanceName(net, reason.instanceId)} contesta.`;
    case 'linux-refused':
      return `Llega, pero ningún programa escucha en el puerto ${reason.port}: ${instanceName(net, reason.instanceId)} lo rechaza.`;
    case 'linux-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'linux-udp-no-service':
      return `Llega por UDP al puerto ${reason.port}, pero en este juego ningún programa UDP contesta.`;
    case 'reply-stateful':
      return 'La respuesta vuelve sola: la {{security-group}} es {{stateful}} y recuerda la conversación.';
  }
}
```

- [ ] **Step 6: Borrar las etiquetas de reglas y ajustar los barrels**

```bash
git rm src/copy/rule-labels.ts src/copy/rule-labels.test.ts
```

Las filas de reglas se nombran con las fichas del incidente (Tarea 9). `src/copy/index.ts` queda así:

```ts
export { TERMS, isTermId } from './terms';
export type { Term, TermId } from './terms';
export { parseTermText, termsIn, toPlainText } from './term-text';
export type { TermSegment, TermText } from './term-text';
export { describeReason } from './reasons';
export { OUTCOME_TEXT, endpointName, instanceName, packetLabel, serviceLabel } from './packet-labels';
export { NOT_FOUND_TEXT, ROADMAP_TEXT, SCENE_TEXT } from './ui';
```

`src/engine/index.ts` deja de exportar lo que ya nadie importa fuera del motor (`APP_TARGET`, `materialize`, `describePacket`, `deathPoint`):

```ts
export { applyAction, networkActionSchema } from './network/actions';
export type { NetworkAction } from './network/actions';
export type { Actor, Endpoint, Instance, Network, PacketSpec, Rule, RulePeer, RuleWhat, SecurityGroup, Subnet } from './network/types';
export { simulate } from './simulation/simulate';
export type { Checkpoint, Outcome, Reason, Step, Trace } from './simulation/trace';
export { extraOpenings, reachesHost } from './exposure/exposure';
```

- [ ] **Step 7: Correr todo lo rápido**

Run: `npx vitest run src/engine src/copy && npm run typecheck && npm run lint && npm run dup`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/engine src/copy
git commit -m "refactor(copy): tag terms in reasons and packet labels"
```

---

### Task 3: Contrato del incidente

**Files:**
- Create: `src/levels/incident.ts`, `src/levels/incident.test.ts`
- Modify: `src/levels/registry.ts`, `src/levels/index.ts`, `src/engine/index.ts`, `src/app.tsx`
- Delete: `src/levels/level-entry.ts`

**Interfaces:**
- Consumes: `isTermId`, `parseTermText`, `TermId` (Tarea 1); del motor `networkSchema`, `packetSchema`, `ruleWhatSchema`, `rulePeerSchema`, `networkActionSchema`.
- Produces (en `src/levels/incident.ts`):
  - `incidentSchema`, `playerMoveSchema`, `flowKindSchema`.
  - Tipos `Incident`, `Flow`, `FlowKind = 'required' | 'forbidden' | 'ambient'`, `IncidentTask`, `WhatChip`, `FromChip`, `PlayerMove = { type: 'placeRule'; sgId; whatId; fromId } | { type: 'removeRule'; sgId; ruleId }`, `ExplanationOption`, `LevelEntry = Pick<Incident, 'id' | 'chapter' | 'order' | 'title' | 'role'>`, `LevelRole`.
  - `defineIncident(input: z.input<typeof incidentSchema>): Incident`.
  - `ruleIdFor(whatId: string, fromId: string): string` → `"<whatId>-from-<fromId>"`: el id de una regla colocada con fichas. Los `changes` de un incidente lo usan para quitar la regla de la solución anterior.
  - `INCIDENTS: Incident[]` (en `registry.ts`, ordenado por capítulo y orden; reemplaza a `LEVELS`).

- [ ] **Step 1: Escribir el test que falla**

`src/levels/incident.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from '@/testing';
import { incidentSchema, ruleIdFor } from './incident';

const VALID: Record<string, unknown> = {
  id: '09-03',
  chapter: 9,
  order: 3,
  title: 'Prueba',
  role: 'defender',
  lesson: 'Una lección',
  concept: 'concepts/una-nota.md',
  introduces: ['ping'],
  base: lab03Net(),
  report: 'El {{ping}} falla.',
  tasks: [{ id: 'task', text: 'Que vuelva el {{ping}}.', flowIds: ['wanted', 'unwanted'] }],
  flows: [
    { id: 'wanted', kind: 'required', packet: ping(inst('servidor1'), '172.31.38.97') },
    { id: 'unwanted', kind: 'forbidden', packet: ping(actor('attacker'), '34.244.254.100') },
  ],
  chips: {
    what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }],
    from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }],
  },
  hints: ['Primera.', 'Segunda.'],
  explanation: [
    { text: 'A', feedback: 'a', correct: false },
    { text: 'B', feedback: 'b', correct: true },
    { text: 'C', feedback: 'c', correct: false },
  ],
  solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],
  takeaway: 'Una idea.',
};

const BROKEN: [string, Record<string, unknown>][] = [
  ['two correct explanations', { explanation: [{ text: 'A', feedback: 'a', correct: true }, { text: 'B', feedback: 'b', correct: true }, { text: 'C', feedback: 'c', correct: false }] }],
  ['both a base and changes', { changes: [] }],
  ['neither a base nor changes', { base: undefined }],
  ['a task with an unknown flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted', 'unwanted', 'ghost'] }] }],
  ['a forbidden flow outside every task', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted'] }] }],
  ['a task without a required flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['unwanted'] }, { id: 'other', text: 'y', flowIds: ['wanted'] }] }],
  ['a solution with a chip it does not offer', { solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }],
  ['an unknown term tag', { report: 'El {{firewall}} falla.' }],
  ['an unknown introduced term', { introduces: ['firewall'] }],
  ['a term introduced twice', { introduces: ['ping', 'ping'] }],
  ['an id that does not match chapter and order', { id: '09-04' }],
  ['one hint only', { hints: ['Solo una.'] }],
  ['two chips with the same id', { chips: { what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }], from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }, { id: 'one', label: 'otro', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }] } }],
];

describe('incident contract', () => {
  it('accepts a complete incident', () => {
    expect(incidentSchema.safeParse(VALID).success).toBe(true);
  });

  it.each(BROKEN)('rejects %s', (_name, patch) => {
    expect(incidentSchema.safeParse({ ...VALID, ...patch }).success).toBe(false);
  });

  it('names a placed rule after its chips', () => {
    expect(ruleIdFor('ping', 'servidor1')).toBe('ping-from-servidor1');
  });
});
```

- [ ] **Step 2: Correrlo y verlo fallar**

Run: `npx vitest run src/levels/incident.test.ts`
Expected: FAIL con "Failed to resolve import './incident'".

- [ ] **Step 3: Exportar los esquemas del motor**

En `src/engine/index.ts`, agregar:

```ts
export { networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from './network/schema';
```

- [ ] **Step 4: Escribir el contrato**

`src/levels/incident.ts`:

```ts
import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { networkActionSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from '@/engine';

const id = z.string().min(1);

function isTermText(text: string): boolean {
  try {
    parseTermText(text);
    return true;
  } catch {
    return false;
  }
}

const termText = z.string().min(1).refine(isTermText, 'unknown term tag');
const termIdSchema = z.custom<TermId>((value) => typeof value === 'string' && isTermId(value), 'unknown term');

export const flowKindSchema = z.enum(['required', 'forbidden', 'ambient']);

export const playerMoveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('placeRule'), sgId: id, whatId: id, fromId: id }),
  z.object({ type: z.literal('removeRule'), sgId: id, ruleId: id }),
]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const taskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const fromChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });

function repeated(values: string[]): string | undefined {
  return values.find((value, index) => values.indexOf(value) !== index);
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export const incidentSchema = z
  .object({
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
    tasks: z.array(taskSchema).min(1),
    flows: z.array(flowSchema).min(1),
    chips: z.object({ what: z.array(whatChipSchema).min(1), from: z.array(fromChipSchema).min(1) }),
    hints: z.tuple([termText, termText]),
    explanation: z.tuple([optionSchema, optionSchema, optionSchema]),
    solution: z.array(playerMoveSchema).min(1),
    takeaway: termText,
  })
  .superRefine((incident, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const unique = (name: string, values: string[]) => {
      const twice = repeated(values);
      if (twice) fail(`${name} repeated: ${twice}`);
    };
    if ((incident.base === undefined) === (incident.changes === undefined)) fail('an incident has either a base world or changes');
    if (incident.id !== `${twoDigits(incident.chapter)}-${twoDigits(incident.order)}`) fail(`id ${incident.id} must be chapter-order`);
    unique('introduced term', incident.introduces);
    unique('flow id', incident.flows.map((f) => f.id));
    unique('task id', incident.tasks.map((t) => t.id));
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
    if (incident.explanation.filter((option) => option.correct).length !== 1) fail('exactly one explanation is correct');
    const whatIds = new Set(incident.chips.what.map((c) => c.id));
    const fromIds = new Set(incident.chips.from.map((c) => c.id));
    for (const move of incident.solution) {
      if (move.type === 'placeRule' && !(whatIds.has(move.whatId) && fromIds.has(move.fromId))) {
        fail(`the solution uses chips the incident does not offer: ${move.whatId}, ${move.fromId}`);
      }
    }
  });

export type Incident = z.infer<typeof incidentSchema>;
export type Flow = Incident['flows'][number];
export type FlowKind = z.infer<typeof flowKindSchema>;
export type IncidentTask = Incident['tasks'][number];
export type WhatChip = Incident['chips']['what'][number];
export type FromChip = Incident['chips']['from'][number];
export type PlayerMove = z.infer<typeof playerMoveSchema>;
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

- [ ] **Step 5: El registro carga incidentes**

```bash
git rm src/levels/level-entry.ts
```

`src/levels/registry.ts` (reemplazar entero):

```ts
import type { Incident } from './incident';

const modules = import.meta.glob<{ default: Incident }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const INCIDENTS: Incident[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);
```

`src/levels/index.ts` (reemplazar entero):

```ts
export { CHAPTERS } from './chapters';
export type { Chapter } from './chapters';
export type { ExplanationOption, Flow, FlowKind, FromChip, Incident, IncidentTask, LevelEntry, LevelRole, PlayerMove, WhatChip } from './incident';
export { INCIDENTS } from './registry';
```

En `src/app.tsx`, cambiar `LEVELS` por `INCIDENTS` en el import y en `<Roadmap levels={INCIDENTS} … />`.

- [ ] **Step 6: Correr todo lo rápido**

Run: `npx vitest run src/levels && npm run typecheck && npm run lint && npm run dup`
Expected: PASS (sin incidentes todavía, el roadmap sigue igual).

- [ ] **Step 7: Commit**

```bash
git add src/levels src/engine/index.ts src/app.tsx
git commit -m "feat(levels): add the incident contract"
```

---

### Task 4: Capítulo 4: incidentes 04-01 y 04-02

**Files:**
- Create: `src/levels/04-iaas/CLAUDE.md`, `src/levels/04-iaas/shared.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`, `src/levels/registry.test.ts`
- Modify: `src/app.test.tsx`, `tests/e2e/roadmap.spec.ts` (el capítulo 4 deja de estar "Próximamente")

**Interfaces:**
- Consumes: `defineIncident`, `ruleIdFor`, tipos `Flow`, `WhatChip`, `FromChip` (Tarea 3).
- Produces (en `src/levels/04-iaas/shared.ts`; los tests de otras capas lo importan por ruta profunda):
  - `LESSON`, `CONCEPT`, `BASE_WORLD: Network`.
  - `S1`, `S2` = `{ id, private, public }` de cada servidor; `SG = { servidor1: 'sg-servidor1', servidor2: 'sg-servidor2' }`.
  - `FLOWS.pingToServer2` (requerido), `FLOWS.attackerPing` (prohibido), `PING_TASK_FLOWS`.
  - Fichas `WHAT.ping | echoRequest | echoReply | allIcmp` y `FROM.servidor1 | internet`.
  - `DAY_SHIFT_RULE: Rule` (Echo Reply ← Todo internet, id `day-shift-echo-reply`).
- Incidentes registrados en `INCIDENTS`: `04-01` («El primer ping») y `04-02` («Abre lo justo»).

- [ ] **Step 1: Escribir el test genérico que falla**

`src/levels/registry.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, syllabusLessons } from '@/testing';
import { CHAPTERS } from './chapters';
import { incidentSchema, type Incident } from './incident';
import { INCIDENTS } from './registry';

const PROTOTYPE_IDS = ['04-01', '04-02'];
const HINT_COUNT = 2;
const lessons = syllabusLessons();

it('registers the prototype incidents in course order', () => {
  expect(INCIDENTS.map((i) => i.id)).toEqual(PROTOTYPE_IDS);
});

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (_id, incident) => {
  it('passes the contract', () => {
    expect(incidentSchema.safeParse(incident).success).toBe(true);
  });

  it('belongs to a chapter of the syllabus', () => {
    expect(CHAPTERS.map((c) => c.number)).toContain(incident.chapter);
  });

  it('cites a lesson of syllabus.md and a concept note that exists', () => {
    expect(lessons.has(incident.lesson)).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, incident.concept))).toBe(true);
  });

  it('has two hints and exactly one correct explanation', () => {
    expect(incident.hints).toHaveLength(HINT_COUNT);
    expect(incident.explanation.filter((option) => option.correct)).toHaveLength(1);
  });

  it('brings the base world only when it opens its chapter', () => {
    const opensChapter = INCIDENTS.find((i) => i.chapter === incident.chapter) === incident;
    expect(incident.base !== undefined).toBe(opensChapter);
  });
});
```

- [ ] **Step 2: Correrlo y verlo fallar**

Run: `npx vitest run src/levels/registry.test.ts`
Expected: FAIL en "registers the prototype incidents" (`[]` en vez de los dos ids).

- [ ] **Step 3: Lo compartido del capítulo**

`src/levels/04-iaas/shared.ts` (mundo base del spec, "Prototipo › Mundo base"):

```ts
import type { Endpoint, Instance, Network, PacketSpec, Rule } from '@/engine';
import type { Flow, FromChip, WhatChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const REGION = 'eu-west-1';
const VPC_CIDR = '172.31.0.0/16';
const ANYWHERE = '0.0.0.0/0';
const SSH_PORT = 22;
const ATTACKER = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66' } as const;

export const S1 = { id: 'servidor1', private: '172.31.16.131', public: '54.78.154.66' } as const;
export const S2 = { id: 'servidor2', private: '172.31.38.97', public: '34.244.254.100' } as const;
export const SG = { servidor1: 'sg-servidor1', servidor2: 'sg-servidor2' } as const;

function server(ips: { id: string; private: string; public: string }, subnetId: string, sgId: string): Instance {
  return {
    id: ips.id,
    name: ips.id,
    subnetId,
    privateIp: ips.private,
    publicIp: ips.public,
    sgIds: [sgId],
    linux: { ignoreIcmpEcho: false, listeningTcpPorts: [SSH_PORT] },
  };
}

function allOutbound(id: string): Rule {
  return { id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANYWHERE } };
}

/** The night shift's world before anyone touches it: two servers in different zones, new doors with no inbound rules and every outbound open, and an attacker on the internet. */
export const BASE_WORLD: Network = {
  region: REGION,
  vpcCidr: VPC_CIDR,
  subnets: [
    { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
    { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
  ],
  instances: [server(S1, 'subnet-a', SG.servidor1), server(S2, 'subnet-b', SG.servidor2)],
  securityGroups: [
    { id: SG.servidor1, name: S1.id, inbound: [], outbound: [allOutbound('all-out-servidor1')] },
    { id: SG.servidor2, name: S2.id, inbound: [], outbound: [allOutbound('all-out-servidor2')] },
  ],
  actors: [{ ...ATTACKER, kind: 'attacker' }],
};

function ping(from: Endpoint, to: string): PacketSpec {
  return { from, to, protocol: 'icmp', icmpType: 8 };
}

export const FLOWS = {
  pingToServer2: { id: 'ping-servidor1-servidor2', kind: 'required', packet: ping({ kind: 'instance', id: S1.id }, S2.private) },
  attackerPing: { id: 'ping-attacker-servidor2', kind: 'forbidden', packet: ping({ kind: 'actor', id: ATTACKER.id }, S2.public) },
} satisfies Record<string, Flow>;

export const PING_TASK_FLOWS = [FLOWS.pingToServer2.id, FLOWS.attackerPing.id];

export const WHAT = {
  ping: { id: 'ping', label: '{{ping|Ping}}', what: { kind: 'icmp', icmpType: 8 } },
  echoRequest: { id: 'echo-request', label: '{{echo-request}} (ida)', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: '{{echo-reply}} (vuelta)', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { id: 'all-icmp', label: '{{ping|Ping}} completo (todo {{icmp}})', what: { kind: 'icmp', icmpType: 'all' } },
} satisfies Record<string, WhatChip>;

export const FROM = {
  servidor1: { id: 'servidor1', label: 'servidor1', peer: { kind: 'sg', sgId: SG.servidor1 } },
  internet: { id: 'internet', label: 'Todo internet', peer: { kind: 'cidr', cidr: ANYWHERE } },
} satisfies Record<string, FromChip>;

/** The day shift's rule in 04-02: Echo Reply from all of internet, "to open the ping's answer". */
export const DAY_SHIFT_RULE: Rule = { id: 'day-shift-echo-reply', what: WHAT.echoReply.what, peer: FROM.internet.peer };
```

- [ ] **Step 4: 04-01 · El primer ping**

`src/levels/04-iaas/01-the-first-ping.ts` (spec, "Prototipo › 04-01"; la explicación correcta va segunda):

```ts
import { defineIncident } from '@/levels/incident';
import { BASE_WORLD, CONCEPT, FLOWS, FROM, LESSON, PING_TASK_FLOWS, SG, WHAT } from './shared';

export default defineIncident({
  id: '04-01',
  chapter: 4,
  order: 1,
  title: 'El primer ping',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['server', 'vpc', 'private-ip', 'ping', 'security-group', 'rule'],
  base: BASE_WORLD,
  report: 'servidor1 no logra hacer {{ping}} a servidor2. ¿Lo revisas?',
  tasks: [{ id: 'ping', text: 'Que servidor1 pueda hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.ping], from: [FROM.servidor1, FROM.internet] },
  hints: ['Mira la {{security-group}} de servidor2: ¿qué deja pasar hoy?', 'En la {{security-group}} de servidor2, agrega: {{ping|Ping}}, desde servidor1.'],
  explanation: [
    {
      text: 'servidor2 estaba apagado.',
      feedback: 'No: servidor2 estaba encendido. El {{ping}} se quedaba en su {{security-group}}, antes de llegar.',
      correct: false,
    },
    {
      text: 'La {{security-group}} de servidor2 solo deja pasar lo que una {{rule}} permite, y no había ninguna para el {{ping}} de servidor1.',
      feedback: 'Eso es. Sin una {{rule}} que lo permita, la {{security-group}} no deja pasar nada.',
      correct: true,
    },
    {
      text: 'Faltaba una {{rule}} que prohibiera al atacante.',
      feedback: 'La {{security-group}} no tiene {{rule|reglas}} para prohibir: lo que ninguna regla permite ya queda fuera.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id }],
  takeaway: 'La {{security-group}} de un {{server}} solo deja pasar lo que una {{rule}} permite: qué + desde dónde.',
});
```

- [ ] **Step 5: 04-02 · Abre lo justo**

`src/levels/04-iaas/02-open-just-enough.ts` (spec, "Prototipo › 04-02"; la correcta va tercera):

```ts
import { defineIncident, ruleIdFor } from '@/levels/incident';
import { CONCEPT, DAY_SHIFT_RULE, FLOWS, FROM, LESSON, PING_TASK_FLOWS, SG, WHAT } from './shared';

export default defineIncident({
  id: '04-02',
  chapter: 4,
  order: 2,
  title: 'Abre lo justo',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['icmp', 'echo-request', 'echo-reply', 'least-privilege'],
  changes: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: ruleIdFor(WHAT.ping.id, FROM.servidor1.id) },
    { type: 'addRule', sgId: SG.servidor2, rule: DAY_SHIFT_RULE },
  ],
  report: 'Alguien cambió la {{security-group}} de servidor2: dice que «abrió la respuesta del {{ping}}». Ahora el {{ping}} de servidor1 vuelve a fallar.',
  tasks: [{ id: 'ping', text: 'Que servidor1 vuelva a hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp], from: [FROM.servidor1, FROM.internet] },
  hints: [
    'Un {{ping}} tiene ida y vuelta. ¿Cuál de las dos entra a servidor2?',
    'En la {{security-group}} de servidor2: {{echo-request}} desde servidor1. Y quita la {{rule}} del turno de día.',
  ],
  explanation: [
    {
      text: 'Había que abrir la vuelta, porque es la que llega a servidor2.',
      feedback: 'No: lo que llega a servidor2 es la ida, el {{echo-request}}. Por eso la {{rule}} del turno de día no arreglaba nada.',
      correct: false,
    },
    {
      text: 'Abrir todo el {{icmp}} desde todo internet es suficiente y no tiene riesgo.',
      feedback: 'Funciona, pero también deja entrar al atacante. Abrir más de lo necesario siempre es un riesgo.',
      correct: false,
    },
    {
      text: 'Un {{ping}} tiene ida ({{echo-request}}) y vuelta ({{echo-reply}}). Para entrar a servidor2 solo hace falta permitir la ida, y solo desde servidor1.',
      feedback: 'Eso es. Abrir solo lo que hace falta, y solo para quien lo necesita, se llama {{least-privilege}}.',
      correct: true,
    },
  ],
  solution: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id },
    { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.servidor1.id },
  ],
  takeaway: 'Para recibir un {{ping}} basta con dejar entrar la ida ({{echo-request}}), y solo desde quien la necesita.',
});
```

- [ ] **Step 6: Guía de la carpeta**

`src/levels/04-iaas/CLAUDE.md`:

```markdown
# levels/04-iaas

Chapter 4 (IaaS), the night shift: one file per incident (`NN-<slug>.ts`, a default export built with `defineIncident`) and `shared.ts` with the chapter's lesson, base world, flows and chips.

- 04-01 brings the base world; every later incident brings only its changes over the reference solution of the one before.
- Texts tag their terms (`{{security-group}}`) and use only terms introduced by this incident or an earlier one.
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`.
```

- [ ] **Step 7: El roadmap ya no tiene 20 capítulos "Próximamente"**

En `src/app.test.tsx`, el primer test pasa a contar los capítulos sin incidentes desde los datos:

```tsx
import { CHAPTERS, INCIDENTS } from '@/levels';

const SOON_COUNT = CHAPTERS.length - new Set(INCIDENTS.map((i) => i.chapter)).size;
```

y en el test: `it('shows the roadmap with the chapters without incidents coming soon', …)` con `expect(screen.getAllByText('Próximamente')).toHaveLength(SOON_COUNT);`. Borrar la constante `CHAPTER_COUNT`.

En `tests/e2e/roadmap.spec.ts`: `const SOON_CHAPTER_COUNT = 19;`, el test se llama `'the roadmap loads every chapter without console errors'` igual que antes y espera `toHaveCount(SOON_CHAPTER_COUNT)`.

- [ ] **Step 8: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/levels src/app.test.tsx tests/e2e/roadmap.spec.ts
git commit -m "feat(levels): add incidents 04-01 and 04-02"
```

---

### Task 5: El mundo que crece

**Files:**
- Create: `src/levels/chips.ts`, `src/levels/world.ts`, `src/levels/world.test.ts`
- Modify: `src/levels/index.ts`, `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `Incident`, `PlayerMove`, `ruleIdFor` (Tarea 3); `applyAction` del motor; lo compartido del capítulo (Tarea 4).
- Produces:
  - `chips.ts`: `sameRule(a, b): boolean` (mismo qué y mismo desde dónde), `ruleFromChips(incident, whatId, fromId): Rule | null`, `chipsOfRule(incident, rule): { what: WhatChip; from: FromChip } | null`.
  - `world.ts`: `applyMove(world: Network, incident: Incident, move: PlayerMove): Network` (devuelve **el mismo objeto** cuando nada cambia), `startWorld(incidents: Incident[], incidentId: string): Network`, `solvedWorld(incidents: Incident[], incidentId: string): Network`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/levels/world.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyAction, networkSchema, type Network } from '@/engine';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from './04-iaas/shared';
import { chipsOfRule } from './chips';
import { ruleIdFor, type Incident, type PlayerMove } from './incident';
import { INCIDENTS } from './registry';
import { applyMove, solvedWorld, startWorld } from './world';

function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function inbound(world: Network, sgId: string) {
  return world.securityGroups.find((g) => g.id === sgId)?.inbound ?? [];
}

const IDS = INCIDENTS.map((i) => [i.id]);

describe('the world that grows', () => {
  it('04-01 starts from the base world: doors with no inbound rules', () => {
    const start = startWorld(INCIDENTS, '04-01');
    expect(inbound(start, SG.servidor1)).toEqual([]);
    expect(inbound(start, SG.servidor2)).toEqual([]);
  });

  it('04-02 starts from the solution of 04-01 plus its own changes', () => {
    const start = startWorld(INCIDENTS, '04-02');
    expect(start).toEqual((incident('04-02').changes ?? []).reduce(applyAction, solvedWorld(INCIDENTS, '04-01')));
    expect(inbound(start, SG.servidor2)).toEqual([DAY_SHIFT_RULE]);
  });

  it.each(IDS)('%s starts and ends with a valid network', (id) => {
    expect(networkSchema.safeParse(startWorld(INCIDENTS, id)).success).toBe(true);
    expect(networkSchema.safeParse(solvedWorld(INCIDENTS, id)).success).toBe(true);
  });

  it.each(IDS)('%s can name every rule of its doors with its chips', (id) => {
    for (const world of [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)]) {
      for (const group of world.securityGroups) {
        for (const rule of group.inbound) expect(chipsOfRule(incident(id), rule), `${group.id}/${rule.id}`).not.toBeNull();
      }
    }
  });
});

describe('applyMove', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);
  const place: PlayerMove = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id };

  it('builds the rule from the chips', () => {
    expect(inbound(applyMove(start, first, place), SG.servidor2)).toEqual([
      { id: ruleIdFor(WHAT.ping.id, FROM.servidor1.id), what: WHAT.ping.what, peer: FROM.servidor1.peer },
    ]);
  });

  it('placing the same rule twice changes nothing', () => {
    const once = applyMove(start, first, place);
    expect(applyMove(once, first, place)).toBe(once);
  });

  it('a chip the incident does not offer, or an unknown door, changes nothing', () => {
    expect(applyMove(start, first, { ...place, whatId: WHAT.echoReply.id })).toBe(start);
    expect(applyMove(start, first, { ...place, sgId: 'sg-ghost' })).toBe(start);
  });

  it('removes a rule by its id, and an unknown id changes nothing', () => {
    const once = applyMove(start, first, place);
    const removed = applyMove(once, first, { type: 'removeRule', sgId: SG.servidor2, ruleId: ruleIdFor(WHAT.ping.id, FROM.servidor1.id) });
    expect(inbound(removed, SG.servidor2)).toEqual([]);
    expect(applyMove(once, first, { type: 'removeRule', sgId: SG.servidor2, ruleId: 'ghost' })).toBe(once);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/levels/world.test.ts`
Expected: FAIL con "Failed to resolve import './chips'".

- [ ] **Step 3: Instalar `just-compare`**

```bash
npm install just-compare
```

Expected: `package.json` gana `"just-compare": "2.3.0"` (exacta, por `.npmrc`).

- [ ] **Step 4: Fichas y reglas**

`src/levels/chips.ts`:

```ts
import compare from 'just-compare';
import type { Rule } from '@/engine';
import { ruleIdFor, type FromChip, type Incident, type WhatChip } from './incident';

type RuleShape = Pick<Rule, 'what' | 'peer'>;

/** True when two rules allow the same thing from the same place, whatever their ids. */
export function sameRule(a: RuleShape, b: RuleShape): boolean {
  return compare(a.what, b.what) && compare(a.peer, b.peer);
}

/** Builds the rule a pair of the incident's chips stands for, or null when the incident does not offer one of them. */
export function ruleFromChips(incident: Incident, whatId: string, fromId: string): Rule | null {
  const what = incident.chips.what.find((chip) => chip.id === whatId);
  const from = incident.chips.from.find((chip) => chip.id === fromId);
  return what && from ? { id: ruleIdFor(whatId, fromId), what: what.what, peer: from.peer } : null;
}

/** Returns the chips that name a rule, or null when the incident offers no chip for its what or its from. */
export function chipsOfRule(incident: Incident, rule: RuleShape): { what: WhatChip; from: FromChip } | null {
  const what = incident.chips.what.find((chip) => compare(chip.what, rule.what));
  const from = incident.chips.from.find((chip) => compare(chip.peer, rule.peer));
  return what && from ? { what, from } : null;
}
```

- [ ] **Step 5: La cadena del mundo**

`src/levels/world.ts`:

```ts
import { applyAction, type Network } from '@/engine';
import { ruleFromChips, sameRule } from './chips';
import type { Incident, PlayerMove } from './incident';

function findIncident(incidents: Incident[], incidentId: string): Incident {
  const found = incidents.find((i) => i.id === incidentId);
  if (!found) throw new Error(`unknown incident ${incidentId}`);
  return found;
}

/** Applies a player move; returns the same world when the move changes nothing (unknown door or chip, a rule that already exists, a rule id that is not there). */
export function applyMove(world: Network, incident: Incident, move: PlayerMove): Network {
  const group = world.securityGroups.find((g) => g.id === move.sgId);
  if (!group) return world;
  if (move.type === 'removeRule') {
    return group.inbound.some((r) => r.id === move.ruleId) ? applyAction(world, move) : world;
  }
  const rule = ruleFromChips(incident, move.whatId, move.fromId);
  if (!rule || group.inbound.some((r) => sameRule(r, rule))) return world;
  return applyAction(world, { type: 'addRule', sgId: move.sgId, rule });
}

/** Returns the world an incident starts from: its base world, or the reference solution of the previous incident of its chapter plus its changes. Incidents come in course order. */
export function startWorld(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  if (incident.base) return incident.base;
  const previous = incidents.filter((i) => i.chapter === incident.chapter && i.order < incident.order).at(-1);
  if (!previous) throw new Error(`${incidentId} has changes but no previous incident`);
  return (incident.changes ?? []).reduce(applyAction, solvedWorld(incidents, previous.id));
}

/** Returns the world after the incident's reference solution. */
export function solvedWorld(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  return incident.solution.reduce((world, move) => applyMove(world, incident, move), startWorld(incidents, incidentId));
}
```

`applyAction(world, move)` acepta el `removeRule` del jugador tal cual, porque tiene la misma forma que la acción del motor.

- [ ] **Step 6: Exportarlos**

En `src/levels/index.ts`, agregar:

```ts
export { chipsOfRule } from './chips';
export { applyMove, solvedWorld, startWorld } from './world';
```

- [ ] **Step 7: Correr todo lo rápido**

Run: `npx vitest run src/levels scripts && npm run typecheck && npm run lint && npm run dup`
Expected: PASS (incluye `scripts/package-versions.test.ts`: sin rangos).

- [ ] **Step 8: Commit**

```bash
git add src/levels package.json package-lock.json
git commit -m "feat(levels): build each incident's world from the chain of solutions"
```

---

### Task 6: Escalera de términos

**Files:**
- Create: `src/levels/ladder.ts`, `src/levels/ladder.test.ts`
- Modify: `src/levels/index.ts`

**Interfaces:**
- Consumes: `termsIn`, `TermId`, `TermText` (Tarea 1); `INCIDENTS` (Tarea 4).
- Produces:
  - `interface ConfigurableParts { inboundRules: boolean; outboundRules: boolean; linuxSettings: boolean }`.
  - `knownTerms(incidents: Incident[], incidentId: string): ReadonlySet<TermId>`: lo que introducen ese incidente y los anteriores (los incidentes vienen en orden del curso).
  - `configurableParts(known: ReadonlySet<TermId>): ConfigurableParts`: entrada desde `rule` (04-01), salida desde `outbound-rule` (04-03), Linux desde `linux-ignore-ping` (04-07).
  - `incidentTexts(incident: Incident): TermText[]` y `unknownTerms(texts: TermText[], known: ReadonlySet<TermId>): TermId[]` (sin repetir).

- [ ] **Step 1: Escribir los tests que fallan**

`src/levels/ladder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TermId } from '@/copy';
import type { Incident } from './incident';
import { configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const ONLY_INBOUND = { inboundRules: true, outboundRules: false, linuxSettings: false };

describe('term ladder', () => {
  it('a term is introduced by one incident at most', () => {
    const introduced = INCIDENTS.flatMap((i) => i.introduces);
    expect(introduced.filter((term, index) => introduced.indexOf(term) !== index)).toEqual([]);
  });

  it.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('%s only uses terms introduced in it or before', (id, incident) => {
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, id))).toEqual([]);
  });

  it('catches a text that uses a later term', () => {
    const early = { ...INCIDENTS[0], report: 'La {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
  });

  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, '04-01')]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, '04-02')]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('the prototype opens only inbound rules, so its solutions touch only those', () => {
    for (const incident of INCIDENTS) expect(configurableParts(knownTerms(INCIDENTS, incident.id))).toEqual(ONLY_INBOUND);
  });

  it('outbound rules and the Linux setting open with their own terms', () => {
    const later = new Set<TermId>(['rule', 'outbound-rule', 'linux-ignore-ping']);
    expect(configurableParts(later)).toEqual({ inboundRules: true, outboundRules: true, linuxSettings: true });
  });
});
```

La prueba "lo configurable coincide con la escalera" queda en la quinta: las jugadas del contrato solo tocan reglas de entrada, y la escalera abre solo esas.

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/levels/ladder.test.ts`
Expected: FAIL con "Failed to resolve import './ladder'".

- [ ] **Step 3: Escribir la escalera**

`src/levels/ladder.ts`:

```ts
import { termsIn, type TermId, type TermText } from '@/copy';
import type { Incident } from './incident';

export interface ConfigurableParts {
  inboundRules: boolean;
  outboundRules: boolean;
  linuxSettings: boolean;
}

/** Returns every term introduced by the incident and the ones before it; incidents come in course order. */
export function knownTerms(incidents: Incident[], incidentId: string): ReadonlySet<TermId> {
  const index = incidents.findIndex((i) => i.id === incidentId);
  if (index < 0) throw new Error(`unknown incident ${incidentId}`);
  return new Set(incidents.slice(0, index + 1).flatMap((i) => i.introduces));
}

/** Returns which parts of the map the player may change once these terms are known. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return {
    inboundRules: known.has('rule'),
    outboundRules: known.has('outbound-rule'),
    linuxSettings: known.has('linux-ignore-ping'),
  };
}

/** Returns every text of the incident the player reads: report, tasks, chips, hints, explanation and takeaway. */
export function incidentTexts(incident: Incident): TermText[] {
  return [
    incident.report,
    ...incident.tasks.map((task) => task.text),
    ...incident.chips.what.map((chip) => chip.label),
    ...incident.chips.from.map((chip) => chip.label),
    ...incident.hints,
    ...incident.explanation.flatMap((option) => [option.text, option.feedback]),
    incident.takeaway,
  ];
}

/** Returns, once each, the terms the texts use that are not known yet. */
export function unknownTerms(texts: TermText[], known: ReadonlySet<TermId>): TermId[] {
  return [...new Set(texts.flatMap((text) => termsIn(text)))].filter((term) => !known.has(term));
}
```

- [ ] **Step 4: Exportar lo que usa `game`**

En `src/levels/index.ts`, agregar:

```ts
export { configurableParts, knownTerms } from './ladder';
export type { ConfigurableParts } from './ladder';
```

(`incidentTexts` y `unknownTerms` solo los usan tests: se importan por ruta profunda.)

- [ ] **Step 5: Correr todo lo rápido**

Run: `npx vitest run src/levels && npm run typecheck && npm run lint && npm run structure`
Expected: PASS (`src/levels/` queda con 12 archivos: el tope).

- [ ] **Step 6: Commit**

```bash
git add src/levels
git commit -m "feat(levels): check the term ladder"
```

---

### Task 7: `game`: flujos, tareas y estrellas

**Files:**
- Create: `src/game/CLAUDE.md`, `src/game/index.ts`, `src/game/flow-runs.ts`, `src/game/tasks.ts`, `src/game/tasks.test.ts`, `src/game/stars.ts`, `src/game/stars.test.ts`, `src/game/incidents.test.ts`, `src/game/view/CLAUDE.md`, `src/game/view/piece-id.ts`

**Interfaces:**
- Consumes: `simulate`, `reachesHost`, `extraOpenings` del motor; `packetLabel`, `TermText` (Tarea 2); `Flow`, `FlowKind`, `IncidentTask`, `INCIDENTS`, `applyMove`, `startWorld`, `solvedWorld` (Tareas 3 a 5).
- Produces:
  - `view/piece-id.ts`: `PIECE_ID = { server(id), barrier(sgId), actor(id), packet(flowId), gateway }` → `"server:servidor2"`, `"barrier:sg-servidor2"`, `"actor:attacker"`, `"packet:<flowId>"`, `"gateway"`; `parsePieceId(pieceId): PieceRef | null` con `PieceRef = { kind: 'server' | 'barrier' | 'actor' | 'packet'; id: string } | { kind: 'gateway' }`.
  - `flow-runs.ts`: `interface FlowRun { id; pieceId; kind: FlowKind; packet: PacketSpec; trace: Trace; replied: boolean; reached: boolean; label: TermText }`, `runFlows(world, flows): FlowRun[]`, `intrudedServerIds(runs): ReadonlySet<string>`.
  - `tasks.ts`: `STABLE_MS = 3000`, `taskHolds(task, runs): boolean`, `advanceTasks(tasks, runs, elapsed, ms): Record<string, number>`, `isStable(ms): boolean`.
  - `stars.ts`: `interface Stars { closed; tight; explained }`, `countStars(stars): number`, `isTight(world, flows): boolean`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/tasks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { STABLE_MS, advanceTasks, isStable, taskHolds } from './tasks';

const incident = INCIDENTS[0];
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);
const SOME_MS = 2500;
const STEP_MS = 1000;

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing)).toBe(false);
    expect(taskHolds(task, holding)).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id });
    expect(taskHolds(task, runFlows(wide, incident.flows))).toBe(false);
  });

  it('adds time while the task holds, up to STABLE_MS', () => {
    expect(advanceTasks(incident.tasks, holding, { [task.id]: SOME_MS }, STEP_MS)).toEqual({ [task.id]: STABLE_MS });
  });

  it('drops to zero when the task breaks', () => {
    expect(advanceTasks(incident.tasks, failing, { [task.id]: SOME_MS }, STEP_MS)).toEqual({ [task.id]: 0 });
  });

  it('is stable from STABLE_MS on', () => {
    expect(isStable(STABLE_MS - 1)).toBe(false);
    expect(isStable(STABLE_MS)).toBe(true);
  });
});
```

`src/game/stars.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { countStars, isTight } from './stars';

describe('stars', () => {
  it('counts the stars earned', () => {
    expect(countStars({ closed: true, tight: false, explained: true })).toBe(2);
  });

  it('a world that lets nothing in opens nothing extra', () => {
    const incident = INCIDENTS[0];
    expect(isTight(startWorld(INCIDENTS, incident.id), incident.flows)).toBe(true);
  });

  it('ping from all of internet opens too much', () => {
    const incident = INCIDENTS[0];
    const wide = applyMove(startWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id });
    expect(isTight(wide, incident.flows)).toBe(false);
  });
});
```

`src/game/incidents.test.ts` (los chequeos dinámicos de cada incidente del spec, "Tests y validación" 2, y la ★2 del 04-02):

```ts
import { describe, expect, it } from 'vitest';
import type { Network } from '@/engine';
import { INCIDENTS, applyMove, solvedWorld, startWorld, type Incident } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { isTight } from './stars';
import { taskHolds } from './tasks';

function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function holdsAll(of: Incident, world: Network): boolean {
  const runs = runFlows(world, of.flows);
  return of.tasks.every((task) => taskHolds(task, runs));
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (id, of) => {
  it('starts with a task to fix', () => {
    expect(holdsAll(of, startWorld(INCIDENTS, id))).toBe(false);
  });

  it('its reference solution fixes every task and opens nothing extra', () => {
    const world = solvedWorld(INCIDENTS, id);
    expect(holdsAll(of, world)).toBe(true);
    expect(isTight(world, of.flows)).toBe(true);
  });
});

describe('04-01, the first ping', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);

  it('a rule on the door of servidor1 does not help: the destination decides', () => {
    const world = applyMove(start, first, { type: 'placeRule', sgId: SG.servidor1, whatId: WHAT.ping.id, fromId: FROM.servidor1.id });
    expect(holdsAll(first, world)).toBe(false);
  });

  it('ping from all of internet lets the attacker reach servidor2', () => {
    const world = applyMove(start, first, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id });
    expect(runFlows(world, first.flows).find((run) => run.kind === 'forbidden')?.reached).toBe(true);
    expect(holdsAll(first, world)).toBe(false);
  });
});

describe('04-02, only what is needed', () => {
  const second = incident('04-02');
  const start = startWorld(INCIDENTS, second.id);
  const fromServer1 = (whatId: string) => applyMove(start, second, { type: 'placeRule', sgId: SG.servidor2, whatId, fromId: FROM.servidor1.id });
  const withoutDayShift = (world: Network) => applyMove(world, second, { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id });

  it('the way back (Echo Reply) does not let the ping in', () => {
    expect(holdsAll(second, fromServer1(WHAT.echoReply.id))).toBe(false);
  });

  it('keeping the day-shift Echo Reply fixes the task but opens too much', () => {
    const world = fromServer1(WHAT.echoRequest.id);
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });

  it('the full ping from servidor1 opens too much', () => {
    const world = withoutDayShift(fromServer1(WHAT.allIcmp.id));
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game`
Expected: FAIL con "Failed to resolve import './flow-runs'".

- [ ] **Step 3: Ids de las piezas**

`src/game/view/piece-id.ts`:

```ts
export type PieceRef = { kind: 'server' | 'barrier' | 'actor' | 'packet'; id: string } | { kind: 'gateway' };

const ID_KINDS = ['server', 'barrier', 'actor', 'packet'] as const;
const SEPARATOR = ':';

export const PIECE_ID = {
  server: (instanceId: string) => `server${SEPARATOR}${instanceId}`,
  barrier: (sgId: string) => `barrier${SEPARATOR}${sgId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  gateway: 'gateway',
} as const;

function isIdKind(value: string): value is (typeof ID_KINDS)[number] {
  return (ID_KINDS as readonly string[]).includes(value);
}

/** Reads a piece id back into what it names, or null when it names nothing the map draws. */
export function parsePieceId(pieceId: string): PieceRef | null {
  if (pieceId === PIECE_ID.gateway) return { kind: 'gateway' };
  const separator = pieceId.indexOf(SEPARATOR);
  const kind = pieceId.slice(0, separator);
  return separator > 0 && isIdKind(kind) ? { kind, id: pieceId.slice(separator + 1) } : null;
}
```

- [ ] **Step 4: Recorridos de los flujos**

`src/game/flow-runs.ts`:

```ts
import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import type { Flow, FlowKind } from '@/levels';
import { PIECE_ID } from './view/piece-id';

export interface FlowRun {
  id: string;
  pieceId: string;
  kind: FlowKind;
  packet: PacketSpec;
  trace: Trace;
  replied: boolean;
  reached: boolean;
  label: TermText;
}

/** Simulates every flow on the world and returns one run per flow, in the same order. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => {
    const trace = simulate(world, flow.packet);
    return {
      id: flow.id,
      pieceId: PIECE_ID.packet(flow.id),
      kind: flow.kind,
      packet: flow.packet,
      trace,
      replied: trace.outcome === 'replied',
      reached: reachesHost(trace),
      label: packetLabel(flow.packet, trace, world),
    };
  });
}

/** Returns the servers that a forbidden flow reaches. */
export function intrudedServerIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}
```

- [ ] **Step 5: Tareas y estrellas**

`src/game/tasks.ts`:

```ts
import type { IncidentTask } from '@/levels';
import type { FlowRun } from './flow-runs';

export const STABLE_MS = 3000;

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

/** True when every required flow of the task gets its reply and none of its forbidden flows reaches a server. */
export function taskHolds(task: IncidentTask, runs: FlowRun[]): boolean {
  return runs.filter((run) => task.flowIds.includes(run.id)).every(runIsFine);
}

/** Adds the elapsed milliseconds to each task that holds, up to STABLE_MS, and drops the ones that broke back to zero. */
export function advanceTasks(tasks: IncidentTask[], runs: FlowRun[], elapsed: Record<string, number>, ms: number): Record<string, number> {
  return Object.fromEntries(tasks.map((task) => [task.id, taskHolds(task, runs) ? Math.min(STABLE_MS, (elapsed[task.id] ?? 0) + ms) : 0]));
}

export function isStable(ms: number): boolean {
  return ms >= STABLE_MS;
}
```

`src/game/stars.ts`:

```ts
import { extraOpenings, type Network } from '@/engine';
import type { Flow } from '@/levels';

export interface Stars {
  closed: boolean;
  tight: boolean;
  explained: boolean;
}

export function countStars(stars: Stars): number {
  return Object.values(stars).filter(Boolean).length;
}

/** True when the probe battery finds nothing reaching a server beyond the incident's required and ambient flows. */
export function isTight(world: Network, flows: Flow[]): boolean {
  const expected = flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
  return extraOpenings(world, expected).length === 0;
}
```

- [ ] **Step 6: Barrel y guías**

`src/game/index.ts`:

```ts
export { intrudedServerIds } from './flow-runs';
export type { FlowRun } from './flow-runs';
export { countStars } from './stars';
export type { Stars } from './stars';
export { STABLE_MS, isStable } from './tasks';
```

`src/game/CLAUDE.md`:

```markdown
# game

The session of one incident, as a pure reducer: the current world, the run of every flow, the stability time of each task, hints, the explanation and the stars. What the map and the panels show lives in `view/`.

- Time arrives only as `tick(ms)` actions; nothing here reads the clock, storage or the DOM.
- Not here: network rules (`src/engine/`), incident content and the world chain (`src/levels/`), drawing (`src/scene/`, `src/ui/`).
- May import: `@/engine`, `@/copy`, `@/levels`. Files inside import each other directly (`./x`, `./view/x`, `@/game/<folder>/x`).
```

`src/game/view/CLAUDE.md`:

```markdown
# game/view

What the map and the panels show, computed from the session and filtered by the terms the player knows: piece ids, piece labels and locks, a door's rules named by chips, and the inspection box.

- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
```

- [ ] **Step 7: Correr todo lo rápido**

Run: `npx vitest run src/game && npm run typecheck && npm run lint && npm run structure && npm run dup`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/game
git commit -m "feat(game): run flows, hold tasks and score stars"
```

---

### Task 8: La sesión del incidente (reducer)

**Files:**
- Create: `src/game/session.ts`, `src/game/session.test.ts`
- Modify: `src/game/index.ts`

**Interfaces:**
- Consumes: Tarea 7 entera; `knownTerms`, `configurableParts`, `startWorld`, `applyMove` (Tareas 5 y 6).
- Produces (en `src/game/session.ts`):

```ts
export type SessionPhase = 'playing' | 'explaining' | 'result';

export interface Session {
  incident: Incident;
  known: ReadonlySet<TermId>;
  parts: ConfigurableParts;
  world: Network;
  runs: FlowRun[];
  taskMs: Record<string, number>;
  alerts: number;
  hintsShown: number;
  phase: SessionPhase;
  tight: boolean;
  choice: number | null;
}

export type SessionAction = PlayerMove | { type: 'tick'; ms: number } | { type: 'showHint' } | { type: 'chooseExplanation'; index: number } | { type: 'showResult' };

export function startSession(incidents: Incident[], incidentId: string): Session;
export function sessionReducer(state: Session, action: SessionAction): Session;
export function canConfigure(session: Session, sgId: string): boolean;
export function isIntruding(session: Session): boolean;
export function starsOf(session: Session): Stars;
```

Reglas del reducer:
- Una jugada (`placeRule`, `removeRule`) solo vale en `playing` y en una puerta que existe en el mapa y que la escalera abre. Si el mundo no cambia, devuelve **el mismo** estado.
- Cada mundo nuevo recalcula los recorridos. `alerts` suma 1 cuando un flujo prohibido empieza a llegar (flanco de subida): un aviso por episodio.
- `tick(ms)` solo cuenta en `playing`. Cuando todas las tareas llegan a `STABLE_MS` en el mismo tick, la fase pasa a `explaining` y se guarda `tight` (la batería de sondas, una vez, al cierre).
- `chooseExplanation` solo guarda la primera elección válida; `showResult` exige una elección.

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { ruleIdFor } from '@/levels/incident';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
import { countStars } from './stars';
import { STABLE_MS } from './tasks';

const FIRST = INCIDENTS[0];
const SECOND_MS = 1000;
const FULL_STARS = 3;
const place = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', sgId, whatId, fromId });
const remove = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', sgId, ruleId: ruleIdFor(whatId, fromId) });
const FIX = place(SG.servidor2, WHAT.ping.id, FROM.servidor1.id);
const UNFIX = remove(SG.servidor2, WHAT.ping.id, FROM.servidor1.id);
const WIDE = place(SG.servidor2, WHAT.ping.id, FROM.internet.id);
const UNWIDE = remove(SG.servidor2, WHAT.ping.id, FROM.internet.id);
const tick = (ms: number): SessionAction => ({ type: 'tick', ms });
const choose = (index: number): SessionAction => ({ type: 'chooseExplanation', index });
const RIGHT = FIRST.explanation.findIndex((option) => option.correct);
const WRONG = FIRST.explanation.findIndex((option) => !option.correct);

const play = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(INCIDENTS, FIRST.id));
const taskMs = (session: Session): number => session.taskMs[session.incident.tasks[0].id];

describe('incident session', () => {
  it('starts playing, with the bar at zero and nothing getting in', () => {
    const start = play();
    expect(start.phase).toBe('playing');
    expect(taskMs(start)).toBe(0);
    expect(isIntruding(start)).toBe(false);
    expect(start.alerts).toBe(0);
  });

  it('a rule on the door of servidor1 does not fix the ping', () => {
    const session = play(place(SG.servidor1, WHAT.ping.id, FROM.servidor1.id), tick(STABLE_MS));
    expect(session.phase).toBe('playing');
    expect(taskMs(session)).toBe(0);
  });

  it('the bar fills in 3 seconds and then the incident closes', () => {
    const twoSeconds = play(FIX, tick(SECOND_MS), tick(SECOND_MS));
    expect(twoSeconds.phase).toBe('playing');
    expect(taskMs(twoSeconds)).toBe(2 * SECOND_MS);
    expect(sessionReducer(twoSeconds, tick(SECOND_MS)).phase).toBe('explaining');
  });

  it('the bar drops to zero when the condition breaks', () => {
    expect(taskMs(play(FIX, tick(2 * SECOND_MS), UNFIX, tick(SECOND_MS)))).toBe(0);
  });

  it('a forbidden flow that gets in blocks the close and warns once per episode', () => {
    const opened = play(FIX, WIDE, tick(2 * STABLE_MS));
    expect(opened.phase).toBe('playing');
    expect(isIntruding(opened)).toBe(true);
    expect(opened.alerts).toBe(1);
    expect(sessionReducer(opened, place(SG.servidor1, WHAT.ping.id, FROM.internet.id)).alerts).toBe(1);
    expect([UNWIDE, WIDE].reduce(sessionReducer, opened).alerts).toBe(2);
  });

  it('closing right, tight and with the right explanation gives 3 stars', () => {
    const explained = play(FIX, tick(STABLE_MS), choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, tight: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
  });

  it('only the first explanation counts', () => {
    const session = play(FIX, tick(STABLE_MS), choose(WRONG), choose(RIGHT));
    expect(session.choice).toBe(WRONG);
    expect(starsOf(session).explained).toBe(false);
  });

  it('an explanation out of range is ignored, and the result needs a choice', () => {
    const closed = play(FIX, tick(STABLE_MS));
    expect(sessionReducer(closed, choose(FIRST.explanation.length))).toBe(closed);
    expect(sessionReducer(closed, { type: 'showResult' })).toBe(closed);
    expect(play(FIX, tick(STABLE_MS), choose(RIGHT), { type: 'showResult' }).phase).toBe('result');
  });

  it('nothing on the map changes once the incident closed', () => {
    const closed = play(FIX, tick(STABLE_MS));
    expect(sessionReducer(closed, WIDE)).toBe(closed);
  });

  it('hints come one by one, up to two', () => {
    const hint: SessionAction = { type: 'showHint' };
    expect(play(hint).hintsShown).toBe(1);
    expect(play(hint, hint, hint).hintsShown).toBe(FIRST.hints.length);
  });

  it('a door the ladder keeps closed cannot be changed', () => {
    const start = startSession(INCIDENTS, FIRST.id);
    const closedDoors: Session = { ...start, parts: { ...start.parts, inboundRules: false } };
    expect(sessionReducer(closedDoors, FIX)).toBe(closedDoors);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game/session.test.ts`
Expected: FAIL con "Failed to resolve import './session'".

- [ ] **Step 3: Escribir la sesión**

`src/game/session.ts`:

```ts
import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type ConfigurableParts, type Incident, type PlayerMove } from '@/levels';
import { runFlows, type FlowRun } from './flow-runs';
import { isTight, type Stars } from './stars';
import { advanceTasks, isStable } from './tasks';

export type SessionPhase = 'playing' | 'explaining' | 'result';

export interface Session {
  incident: Incident;
  known: ReadonlySet<TermId>;
  parts: ConfigurableParts;
  world: Network;
  runs: FlowRun[];
  taskMs: Record<string, number>;
  alerts: number;
  hintsShown: number;
  phase: SessionPhase;
  tight: boolean;
  choice: number | null;
}

export type SessionAction =
  | PlayerMove
  | { type: 'tick'; ms: number }
  | { type: 'showHint' }
  | { type: 'chooseExplanation'; index: number }
  | { type: 'showResult' };

function hasIntrusion(runs: FlowRun[]): boolean {
  return runs.some((run) => run.kind === 'forbidden' && run.reached);
}

/** Starts an incident from its canonical world, with every task at zero. */
export function startSession(incidents: Incident[], incidentId: string): Session {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error(`unknown incident ${incidentId}`);
  const known = knownTerms(incidents, incidentId);
  const world = startWorld(incidents, incidentId);
  const runs = runFlows(world, incident.flows);
  return {
    incident,
    known,
    parts: configurableParts(known),
    world,
    runs,
    taskMs: Object.fromEntries(incident.tasks.map((task) => [task.id, 0])),
    alerts: hasIntrusion(runs) ? 1 : 0,
    hintsShown: 0,
    phase: 'playing',
    tight: false,
    choice: null,
  };
}

/** True when the door of this security group is on the map and the ladder lets the player change its inbound rules. */
export function canConfigure(session: Session, sgId: string): boolean {
  return session.parts.inboundRules && session.world.instances.some((instance) => instance.sgIds.includes(sgId));
}

/** True while a forbidden flow reaches its server. */
export function isIntruding(session: Session): boolean {
  return hasIntrusion(session.runs);
}

function move(state: Session, action: PlayerMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.sgId)) return state;
  const world = applyMove(state.world, state.incident, action);
  if (world === state.world) return state;
  const runs = runFlows(world, state.incident.flows);
  const startsEpisode = hasIntrusion(runs) && !hasIntrusion(state.runs);
  return { ...state, world, runs, alerts: state.alerts + (startsEpisode ? 1 : 0) };
}

function tick(state: Session, ms: number): Session {
  if (state.phase !== 'playing') return state;
  const taskMs = advanceTasks(state.incident.tasks, state.runs, state.taskMs, ms);
  if (!Object.values(taskMs).every(isStable)) return { ...state, taskMs };
  return { ...state, taskMs, phase: 'explaining', tight: isTight(state.world, state.incident.flows) };
}

function choose(state: Session, index: number): Session {
  const valid = Number.isInteger(index) && index >= 0 && index < state.incident.explanation.length;
  return state.phase === 'explaining' && state.choice === null && valid ? { ...state, choice: index } : state;
}

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'placeRule':
    case 'removeRule':
      return move(state, action);
    case 'tick':
      return tick(state, action.ms);
    case 'showHint':
      return { ...state, hintsShown: Math.min(state.hintsShown + 1, state.incident.hints.length) };
    case 'chooseExplanation':
      return choose(state, action.index);
    case 'showResult':
      return state.phase === 'explaining' && state.choice !== null ? { ...state, phase: 'result' } : state;
  }
}

/** Returns the stars as they stand: closed, only what is needed at the close, and the first explanation right. */
export function starsOf(session: Session): Stars {
  return {
    closed: session.phase !== 'playing',
    tight: session.tight,
    explained: session.choice !== null && session.incident.explanation[session.choice].correct,
  };
}
```

- [ ] **Step 4: Exportarla**

En `src/game/index.ts`, agregar:

```ts
export { isIntruding, sessionReducer, startSession, starsOf } from './session';
export type { Session, SessionAction, SessionPhase } from './session';
```

- [ ] **Step 5: Correr todo lo rápido**

Run: `npx vitest run src/game && npm run typecheck && npm run lint && npm run dup`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game
git commit -m "feat(game): add the incident session reducer"
```

---

### Task 9: Lo que muestra el mapa: piezas, puertas e inspección

**Files:**
- Create: `src/copy/incident-ui.ts`, `src/game/view/pieces.ts`, `src/game/view/pieces.test.ts`, `src/game/view/barrier.ts`, `src/game/view/inspection.ts`, `src/game/view/inspection.test.ts`, `src/game/view/ladder.test.ts`
- Modify: `src/copy/index.ts`, `src/engine/index.ts`, `src/game/index.ts`

**Interfaces:**
- Consumes: `Session`, `sessionReducer`, `startSession` (Tarea 8); `PIECE_ID`, `parsePieceId` (Tarea 7); `chipsOfRule` (Tarea 5); `unknownTerms` (Tarea 6); `describeReason`, `OUTCOME_TEXT` (Tarea 2); del motor `stopStep`, `publicDnsName`, `privateDnsName`.
- Produces:
  - `copy/incident-ui.ts`: `MAP_TEXT`, `INSPECTION_TEXT`, `ACTOR_ROLE_TEXT` (contenido abajo).
  - `view/pieces.ts`: `type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway'`, `interface PieceView { id; kind: PieceKind; anchorId: string; label: TermText; locked: boolean; configurable: boolean }`, `GATEWAY_ANCHOR = 'igw'`, `gatewayLabel(known): TermText`, `pieceViews(session): PieceView[]`.
  - `view/barrier.ts`: `interface RuleRow { id; what: TermText; from: TermText }`, `interface BarrierCard { sgId; title: TermText; rules: RuleRow[] }`, `ruleRows(group, incident): RuleRow[]`, `rowText(row): TermText` («qué ← desde dónde»), `barrierCard(session, pieceId): BarrierCard | null`.
  - `view/inspection.ts`: `interface InspectionField { label: TermText; lines: TermText[] }`, `interface Inspection { title: TermText; fields: InspectionField[] }`, `inspect(session, pieceId): Inspection | null`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/view/pieces.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MAP_TEXT, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { startSession } from '@/game/session';
import { barrierCard } from './barrier';
import { PIECE_ID } from './piece-id';
import { gatewayLabel, pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');

describe('pieceViews', () => {
  it('shows both servers locked, both doors open to edit, the attacker and the internet entrance', () => {
    expect(pieceViews(first).map(({ id, label, locked, configurable }) => ({ id, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.server(S1.id), label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.server(S2.id), label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.barrier(SG.servidor1), label: MAP_TEXT.barrier(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.barrier(SG.servidor2), label: MAP_TEXT.barrier(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.gateway, label: MAP_TEXT.gatewayPlain, locked: true, configurable: false },
    ]);
  });

  it('names the internet gateway once its term is known', () => {
    expect(gatewayLabel(new Set<TermId>(['internet-gateway']))).toBe(MAP_TEXT.gateway);
  });
});

describe('barrierCard', () => {
  it('names the rules of a door with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(barrierCard(second, PIECE_ID.barrier(SG.servidor2))).toEqual({
      sgId: SG.servidor2,
      title: MAP_TEXT.barrier(S2.id),
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.internet.label }],
    });
  });

  it('is null for anything that is not a door', () => {
    expect(barrierCard(first, PIECE_ID.server(S2.id))).toBeNull();
    expect(barrierCard(first, PIECE_ID.barrier('sg-ghost'))).toBeNull();
  });
});
```

`src/game/view/inspection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ACTOR_ROLE_TEXT, toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { inspect, type Inspection } from './inspection';
import { PIECE_ID } from './piece-id';

const first = startSession(INCIDENTS, '04-01');
const fixed = sessionReducer(first, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id });

function plain(inspection: Inspection | null) {
  return inspection && { title: toPlainText(inspection.title), fields: inspection.fields.map((f) => [toPlainText(f.label), ...f.lines.map(toPlainText)]) };
}

function knowing(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set([...session.known, ...terms]) };
}

describe('inspect', () => {
  it('a server shows its private IP and its door, and nothing of later terms', () => {
    expect(plain(inspect(first, PIECE_ID.server(S2.id)))).toEqual({
      title: 'servidor2',
      fields: [
        ['IP privada', S2.private],
        ['Puerta', 'puerta de servidor2'],
      ],
    });
  });

  it('later terms add their fields', () => {
    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.server(S2.id)))?.fields.map(([label]) => label);
    expect(fields).toEqual(['IP privada', 'IP pública', 'Nombres DNS', 'Puerta']);
  });

  it('a door without rules says it lets nothing in', () => {
    expect(plain(inspect(first, PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([['Deja entrar', 'Nada: no tiene reglas.']]);
  });

  it('a door lists what it lets in as chips', () => {
    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([
      ['Deja entrar', 'Echo Reply (vuelta) ← Todo internet'],
    ]);
  });

  it('a blocked packet says where and why it stopped', () => {
    expect(plain(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id)))).toEqual({
      title: 'ping de Atacante a servidor2',
      fields: [
        ['Resultado', 'No llegó: no volvió ninguna respuesta.'],
        ['Dónde y por qué se detuvo', 'Se queda en la puerta de servidor2: ninguna regla lo deja entrar.'],
      ],
    });
  });

  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([['Resultado', 'Llegó y volvió la respuesta.']]);
  });

  it('the attacker says who it is, but not its IP yet', () => {
    expect(plain(inspect(first, PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', ACTOR_ROLE_TEXT.attacker]]);
  });

  it('the internet entrance explains what it does', () => {
    expect(plain(inspect(first, PIECE_ID.gateway))?.title).toBe('entrada desde internet');
  });

  it('an id that names nothing shows nothing', () => {
    expect(inspect(first, PIECE_ID.server('ghost'))).toBeNull();
    expect(inspect(first, 'nonsense')).toBeNull();
  });
});
```

`src/game/view/ladder.test.ts` (spec, "Tests y validación" 4: nada de lo que muestra el mapa usa un término futuro, al empezar, con la solución y con cada regla que se puede armar):

```ts
import { describe, expect, it } from 'vitest';
import type { TermText } from '@/copy';
import { INCIDENTS, type Incident } from '@/levels';
import { unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { barrierCard } from './barrier';
import { inspect } from './inspection';
import { pieceViews } from './pieces';

function shownTexts(session: Session): TermText[] {
  const pieces = pieceViews(session);
  const ids = [...pieces.map((piece) => piece.id), ...session.runs.map((run) => run.pieceId)];
  const inspected = ids.flatMap((id) => {
    const shown = inspect(session, id);
    return shown ? [shown.title, ...shown.fields.flatMap((field) => [field.label, ...field.lines])] : [];
  });
  return [...pieces.map((piece) => piece.label), ...session.runs.map((run) => run.label), ...inspected];
}

function sessionsToCheck(incident: Incident): Session[] {
  const start = startSession(INCIDENTS, incident.id);
  const solved = incident.solution.reduce(sessionReducer, start);
  const doors = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => barrierCard(start, piece.id) ?? []);
  const placed = doors.flatMap((door) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', sgId: door.sgId, whatId: what.id, fromId: from.id }))),
  );
  return [start, solved, ...placed];
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s on the map', (_id, incident) => {
  it('shows only terms introduced in it or before', () => {
    for (const session of sessionsToCheck(incident)) expect(unknownTerms(shownTexts(session), session.known)).toEqual([]);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game/view`
Expected: FAIL con "Failed to resolve import './barrier'" (y `MAP_TEXT` no existe en `@/copy`).

- [ ] **Step 3: Textos del mapa y de la inspección**

`src/copy/incident-ui.ts` (más textos llegan en las Tareas 11, 12 y 15):

```ts
import type { Actor } from '@/engine';
import type { TermText } from './term-text';

export const MAP_TEXT = {
  barrier: (name: string): TermText => `{{security-group}} de ${name}`,
  gateway: '{{internet-gateway}}',
  gatewayPlain: 'entrada desde internet',
  locked: 'con candado',
  packet: (label: string) => `Paquete: ${label}`,
} as const;

export const INSPECTION_TEXT = {
  privateIp: '{{private-ip}}',
  publicIp: '{{public-ip}}',
  dnsNames: 'Nombres {{dns}}',
  linuxPing: 'Linux contesta el {{ping}}',
  doors: '{{security-group|Puerta}}',
  inbound: 'Deja entrar',
  noRules: 'Nada: no tiene {{rule|reglas}}.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
  who: 'Quién es',
  ip: '{{public-ip|IP}}',
  does: 'Qué hace',
  gatewayDoes: 'Por aquí entra y sale el tráfico de internet.',
  result: 'Resultado',
  stoppedAt: 'Dónde y por qué se detuvo',
  yes: 'Sí',
  no: 'No',
  none: 'No tiene',
} as const;

export const ACTOR_ROLE_TEXT: Record<Actor['kind'], TermText> = {
  attacker: 'Alguien de internet que prueba puertas ajenas.',
  you: 'Tu computadora.',
};
```

En `src/copy/index.ts`, agregar:

```ts
export { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT } from './incident-ui';
```

En `src/engine/index.ts`, agregar:

```ts
export { privateDnsName, publicDnsName } from './network/dns';
export { stopStep } from './simulation/checkpoints';
```

- [ ] **Step 4: Piezas**

`src/game/view/pieces.ts`:

```ts
import { MAP_TEXT, type TermId, type TermText } from '@/copy';
import type { Network } from '@/engine';
import type { ConfigurableParts } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface PieceView {
  id: string;
  kind: PieceKind;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export const GATEWAY_ANCHOR = 'igw';

/** Names the internet entrance plainly until its term is known. */
export function gatewayLabel(known: ReadonlySet<TermId>): TermText {
  return known.has('internet-gateway') ? MAP_TEXT.gateway : MAP_TEXT.gatewayPlain;
}

function barriers(world: Network, parts: ConfigurableParts): PieceView[] {
  return world.securityGroups.flatMap((group): PieceView[] => {
    const owner = world.instances.find((instance) => instance.sgIds.includes(group.id));
    if (!owner) return [];
    return [{ id: PIECE_ID.barrier(group.id), kind: 'barrier', anchorId: owner.id, label: MAP_TEXT.barrier(group.name), locked: !parts.inboundRules, configurable: parts.inboundRules }];
  });
}

/** Returns every piece the map shows, with labels that respect the ladder and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts, known } = session;
  return [
    ...world.instances.map((instance): PieceView => ({ id: PIECE_ID.server(instance.id), kind: 'server', anchorId: instance.id, label: instance.name, locked: !parts.linuxSettings, configurable: false })),
    ...barriers(world, parts),
    ...world.actors.map((actor): PieceView => ({ id: PIECE_ID.actor(actor.id), kind: 'actor', anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    { id: PIECE_ID.gateway, kind: 'gateway', anchorId: GATEWAY_ANCHOR, label: gatewayLabel(known), locked: true, configurable: false },
  ];
}
```

- [ ] **Step 5: Puertas**

`src/game/view/barrier.ts`:

```ts
import { INSPECTION_TEXT, MAP_TEXT, type TermText } from '@/copy';
import type { SecurityGroup } from '@/engine';
import { chipsOfRule, type Incident } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from './piece-id';

export interface RuleRow {
  id: string;
  what: TermText;
  from: TermText;
}

export interface BarrierCard {
  sgId: string;
  title: TermText;
  rules: RuleRow[];
}

/** Names each inbound rule of the door with the incident's chips; throws for a rule without chips, which the incident tests rule out. */
export function ruleRows(group: SecurityGroup, incident: Incident): RuleRow[] {
  return group.inbound.map((rule) => {
    const chips = chipsOfRule(incident, rule);
    if (!chips) throw new Error(`${group.id}/${rule.id} has no chips in ${incident.id}`);
    return { id: rule.id, what: chips.what.label, from: chips.from.label };
  });
}

export function rowText(row: RuleRow): TermText {
  return INSPECTION_TEXT.ruleRow(row.what, row.from);
}

/** Returns what the task card of a door shows, or null when the piece is not a door on the map. */
export function barrierCard(session: Session, pieceId: string): BarrierCard | null {
  const ref = parsePieceId(pieceId);
  const group = ref?.kind === 'barrier' ? session.world.securityGroups.find((g) => g.id === ref.id) : undefined;
  return group ? { sgId: group.id, title: MAP_TEXT.barrier(group.name), rules: ruleRows(group, session.incident) } : null;
}
```

- [ ] **Step 6: Inspección**

`src/game/view/inspection.ts`:

```ts
import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, describeReason, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Instance, type SecurityGroup } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './barrier';
import { parsePieceId } from './piece-id';
import { gatewayLabel } from './pieces';

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

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map((spec) => ({ label: spec.label, lines: spec.lines() }));
}

function server(session: Session, instance: Instance): Inspection {
  const { region, securityGroups } = session.world;
  const doors = securityGroups.filter((group) => instance.sgIds.includes(group.id));
  return {
    title: instance.name,
    fields: visible(
      [
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [instance.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [instance.publicIp ?? INSPECTION_TEXT.none] },
        {
          term: 'dns',
          label: INSPECTION_TEXT.dnsNames,
          lines: () => [...(instance.publicIp ? [publicDnsName(instance.publicIp, region)] : []), privateDnsName(instance.privateIp, region)],
        },
        { term: 'linux-ignore-ping', label: INSPECTION_TEXT.linuxPing, lines: () => [instance.linux.ignoreIcmpEcho ? INSPECTION_TEXT.no : INSPECTION_TEXT.yes] },
        { term: 'security-group', label: INSPECTION_TEXT.doors, lines: () => doors.map((group) => MAP_TEXT.barrier(group.name)) },
      ],
      session.known,
    ),
  };
}

function barrier(session: Session, group: SecurityGroup): Inspection {
  const rows = ruleRows(group, session.incident);
  return {
    title: MAP_TEXT.barrier(group.name),
    fields: visible([{ term: 'rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }], session.known),
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
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world)] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece or a packet, or null when the id names nothing on the map. */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  if (ref.kind === 'gateway') return { title: gatewayLabel(session.known), fields: [{ label: INSPECTION_TEXT.does, lines: [INSPECTION_TEXT.gatewayDoes] }] };
  const { world, runs } = session;
  switch (ref.kind) {
    case 'server': {
      const found = world.instances.find((instance) => instance.id === ref.id);
      return found ? server(session, found) : null;
    }
    case 'barrier': {
      const found = world.securityGroups.find((group) => group.id === ref.id);
      return found ? barrier(session, found) : null;
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

- [ ] **Step 7: Exportar lo que usa `ui`**

`src/game/index.ts` queda así:

```ts
export { intrudedServerIds } from './flow-runs';
export type { FlowRun } from './flow-runs';
export { isIntruding, sessionReducer, startSession, starsOf } from './session';
export type { Session, SessionAction, SessionPhase } from './session';
export { countStars } from './stars';
export type { Stars } from './stars';
export { STABLE_MS, isStable } from './tasks';
export { barrierCard, rowText } from './view/barrier';
export type { BarrierCard, RuleRow } from './view/barrier';
export { inspect } from './view/inspection';
export type { Inspection, InspectionField } from './view/inspection';
export { pieceViews } from './view/pieces';
export type { PieceView } from './view/pieces';
```

- [ ] **Step 8: Correr todo lo rápido**

Run: `npx vitest run src/game src/copy && npm run typecheck && npm run lint && npm run dup`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/game src/copy src/engine/index.ts
git commit -m "feat(game): show map pieces and inspection by known terms"
```

---

### Task 10: Capítulos e incidentes se abren en orden

**Files:**
- Create: `src/ui/stars.tsx`
- Modify: `src/storage/progress.ts`, `src/storage/progress.test.ts`, `src/ui/roadmap.tsx`, `src/copy/ui.ts`

**Interfaces:**
- Consumes: `LevelEntry` (Tarea 3).
- Produces:
  - `isUnlocked(level: LevelEntry, progress: Progress, levels: LevelEntry[]): boolean`: un incidente se abre cuando **todos** los anteriores en orden del curso tienen al menos una estrella. Un capítulo se abre así al terminar el anterior (backlog A8).
  - `Stars({ count })` en `src/ui/stars.tsx` (sale de `roadmap.tsx`; la usa también el resultado, Tarea 15).

- [ ] **Step 1: Escribir los tests que fallan**

En `src/storage/progress.test.ts`, reemplazar el test `'a level unlocks when the previous one in its chapter has a star'` por:

```ts
  const COURSE: LevelEntry[] = [
    { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
    { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
    { id: '05-01', chapter: 5, order: 1, title: 'Uno de otro capítulo', role: 'defender' },
  ];

  it('an incident opens when the one before it has a star', () => {
    expect(isUnlocked(COURSE[0], {}, COURSE)).toBe(true);
    expect(isUnlocked(COURSE[1], {}, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[1], { '04-01': 1 }, COURSE)).toBe(true);
  });

  it('a chapter opens only when every incident of the chapters before it has a star', () => {
    expect(isUnlocked(COURSE[2], { '04-01': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-02': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-01': 1, '04-02': 1 }, COURSE)).toBe(true);
  });
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/storage`
Expected: FAIL en "a chapter opens only when…" (`05-01` se abre hoy porque es el primero de su capítulo).

- [ ] **Step 3: Desbloqueo en orden del curso**

En `src/storage/progress.ts`, reemplazar `isUnlocked`:

```ts
/** True when every incident before this one, in course order, has at least one star; the first one is always open. */
export function isUnlocked(level: LevelEntry, progress: Progress, levels: LevelEntry[]): boolean {
  const index = levels.findIndex((l) => l.id === level.id);
  return levels.slice(0, Math.max(index, 0)).every((l) => (progress[l.id] ?? 0) > 0);
}
```

- [ ] **Step 4: Estrellas reutilizables y roadmap**

`src/ui/stars.tsx`:

```tsx
import { ROADMAP_TEXT } from '@/copy';
import { MAX_STARS } from '@/storage';

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(MAX_STARS - count)}
      </span>
      <span className="sr-only">{ROADMAP_TEXT.starsOf(count)}</span>
    </span>
  );
}
```

En `src/ui/roadmap.tsx`: borrar la función `Stars` local, importar `import { Stars } from './stars';`, y llamar `isUnlocked(level, progress, levels)` (la lista entera, no `own`).

En `src/copy/ui.ts`, `ROADMAP_TEXT.lede` pasa a `'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.'`.

- [ ] **Step 5: Correr todo lo rápido**

Run: `npx vitest run src/storage src/ui src/app.test.tsx && npm run typecheck && npm run lint`
Expected: PASS (los tests del roadmap siguen valiendo: 04-03 sigue bloqueado con solo 04-01 hecho).

- [ ] **Step 6: Commit**

```bash
git add src/storage src/ui src/copy/ui.ts
git commit -m "feat(storage): open incidents and chapters in course order"
```

---

### Task 11: Texto con términos y la tarjeta de Lucía

**Files:**
- Create: `src/ui/tagged-text.tsx`, `src/ui/tagged-text.test.tsx`, `src/ui/incident/CLAUDE.md`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/lucia-card.test.tsx`
- Modify: `src/copy/incident-ui.ts`, `src/copy/index.ts`, `src/styles.css`

**Interfaces:**
- Consumes: `parseTermText`, `TERMS` (Tarea 1); `Session`, `sessionReducer`, `startSession`, `isIntruding`, `isStable`, `STABLE_MS` (Tareas 7 y 8).
- Produces:
  - `TaggedText({ text: TermText; newTerms?: ReadonlySet<TermId> })`: dibuja cada término en negrita (`.term`) y, si está en `newTerms`, con la marca «nuevo».
  - `LuciaCard({ session: Session; onAskHint: () => void })`.
  - `LUCIA_TEXT` en `src/copy/incident-ui.ts`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/ui/tagged-text.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its name', () => {
    const { container } = render(<TaggedText text="Mira la {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira la puerta de servidor2.');
    expect(screen.getByText('puerta')).toHaveClass('term');
  });

  it('marks the new terms', () => {
    render(<TaggedText text="Una {{rule}} de la {{security-group}}." newTerms={new Set<TermId>(['rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(LUCIA_TEXT.newBadge).closest('.term')).toHaveTextContent('regla');
  });
});
```

`src/ui/incident/lucia-card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS } from '@/copy';
import { STABLE_MS, sessionReducer, startSession, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { LuciaCard } from './lucia-card';

const FIX: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id };
const WIDE: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id };

function Harness({ actions = [] }: { actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, INCIDENTS[0].id)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} />;
}

describe("Lucía's card", () => {
  it('reports the problem and lists the task as pending', () => {
    render(<Harness />);
    expect(screen.getByText(/no logra hacer/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('defines the new terms of the incident', () => {
    render(<Harness />);
    expect(screen.getByText(TERMS['security-group'].definition)).toBeInTheDocument();
    expect(screen.getByText(TERMS.rule.definition)).toBeInTheDocument();
  });

  it('gives hint 1, then hint 2, then no more', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(1)).closest('p')).toHaveTextContent('Mira la puerta de servidor2: ¿qué deja pasar hoy?');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(2)).closest('p')).toHaveTextContent('En la puerta de servidor2, agrega: Ping, desde servidor1.');
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.askHint })).toBeNull();
  });

  it('warns when something forbidden gets in', () => {
    render(<Harness actions={[WIDE]} />);
    expect(screen.getByRole('alert')).toHaveTextContent(LUCIA_TEXT.intrusion);
  });

  it('marks the task done once it holds for 3 seconds', () => {
    render(<Harness actions={[FIX, { type: 'tick', ms: STABLE_MS }]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.done);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/ui`
Expected: FAIL con "Failed to resolve import './tagged-text'" y "'./lucia-card'".

- [ ] **Step 3: Textos de Lucía**

En `src/copy/incident-ui.ts`, agregar:

```ts
export const LUCIA_TEXT = {
  name: 'Lucía',
  role: 'soporte',
  tasks: 'Tareas',
  pending: 'pendiente',
  done: 'hecha',
  steady: 'Tiempo funcionando sin cortes',
  intrusion: '¡Algo raro está entrando!',
  newTerms: 'Palabras nuevas',
  newBadge: 'nuevo',
  askHint: '¿Alguna pista?',
  hint: (number: number) => `Pista ${number}:`,
} as const;
```

y en `src/copy/index.ts` sumar `LUCIA_TEXT` al export de `./incident-ui`.

- [ ] **Step 4: Texto con términos**

`src/ui/tagged-text.tsx`:

```tsx
import { Fragment } from 'react';
import { LUCIA_TEXT, parseTermText, type TermId, type TermText } from '@/copy';

/** Renders a tagged text: each term in bold, and the new ones with their "nuevo" mark. */
export function TaggedText({ text, newTerms }: { text: TermText; newTerms?: ReadonlySet<TermId> }) {
  return (
    <>
      {parseTermText(text).map((segment, index) =>
        segment.kind === 'text' ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <span key={index} className="term">
            {segment.text}
            {newTerms?.has(segment.id) && <span className="term__new">{LUCIA_TEXT.newBadge}</span>}
          </span>
        ),
      )}
    </>
  );
}
```

- [ ] **Step 5: La tarjeta de Lucía**

`src/ui/incident/lucia-card.tsx`:

```tsx
import { LUCIA_TEXT, TERMS } from '@/copy';
import { STABLE_MS, isIntruding, isStable, type Session } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

export function LuciaCard({ session, onAskHint }: { session: Session; onAskHint: () => void }) {
  const { incident } = session;
  const newTerms = new Set(incident.introduces);
  return (
    <section className="card lucia" aria-labelledby="lucia-title">
      <h2 id="lucia-title">
        {LUCIA_TEXT.name} <span className="muted">· {LUCIA_TEXT.role}</span>
      </h2>
      <p>
        <TaggedText text={incident.report} newTerms={newTerms} />
      </p>
      {isIntruding(session) && (
        <p key={session.alerts} role="alert" className="lucia__alert">
          {LUCIA_TEXT.intrusion}
        </p>
      )}
      <h3>{LUCIA_TEXT.tasks}</h3>
      <ul className="tasks">
        {incident.tasks.map((task) => {
          const ms = session.taskMs[task.id] ?? 0;
          const done = isStable(ms);
          return (
            <li key={task.id} className="task">
              <span aria-hidden="true">{done ? '✓ ' : '☐ '}</span>
              <TaggedText text={task.text} newTerms={newTerms} />
              <span className="sr-only"> ({done ? LUCIA_TEXT.done : LUCIA_TEXT.pending})</span>
              <progress aria-label={LUCIA_TEXT.steady} max={STABLE_MS} value={ms} />
            </li>
          );
        })}
      </ul>
      <h3>{LUCIA_TEXT.newTerms}</h3>
      <dl className="glossary">
        {incident.introduces.map((id) => (
          <div key={id}>
            <dt>
              {TERMS[id].name} <span className="term__new">{LUCIA_TEXT.newBadge}</span>
            </dt>
            <dd>{TERMS[id].definition}</dd>
          </div>
        ))}
      </dl>
      {incident.hints.slice(0, session.hintsShown).map((hint, index) => (
        <p key={hint} className="hint">
          <strong>{LUCIA_TEXT.hint(index + 1)}</strong> <TaggedText text={hint} />
        </p>
      ))}
      {session.hintsShown < incident.hints.length && (
        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>
      )}
    </section>
  );
}
```

El `role="alert"` lleva `key={session.alerts}`: un episodio nuevo lo vuelve a montar y el lector de pantalla lo anuncia otra vez; mientras dura el mismo episodio, se anuncia una sola vez.

- [ ] **Step 6: Guía y estilos**

`src/ui/incident/CLAUDE.md`:

```markdown
# ui/incident

The incident screen: Lucía's card with tasks and hints, the task card of a door, the inspection box, Lucía's question and the result.

- State lives in the session reducer of `@/game`; the clock that sends `tick` lives in `use-stability-clock.ts`.
- Effects live in `use-*.ts` hooks next to their first consumer.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
```

Al final de `src/styles.css`:

```css
.card { border: 1.5px solid var(--ink); background: var(--paper-fill); padding: 0.9rem 1rem; box-shadow: 3px 3px 0 var(--ink); }
.term { font-weight: 600; }
.term__new { margin-left: 0.2rem; font: 600 0.65rem var(--font-body); color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; vertical-align: super; }
.lucia__alert { margin: 0.5rem 0; color: var(--accent); font-weight: 600; }
.tasks { list-style: none; padding: 0; margin: 0 0 0.8rem; display: grid; gap: 0.5rem; }
.task progress { display: block; width: 100%; height: 0.5rem; accent-color: var(--ink); }
.glossary { margin: 0 0 0.8rem; }
.glossary dt { font-weight: 600; }
.glossary dd { margin: 0 0 0.4rem; color: var(--ink-soft); }
.hint { margin: 0.4rem 0; }
```

- [ ] **Step 7: Correr todo lo rápido**

Run: `npx vitest run src/ui && npm run typecheck && npm run lint && npm run structure`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ui src/copy src/styles.css
git commit -m "feat(ui): add Lucía's card with tasks, hints and new terms"
```

---

### Task 12: La tarjeta de tarea

**Files:**
- Create: `src/ui/incident/task-card.tsx`, `src/ui/incident/task-card.test.tsx`, `src/ui/incident/use-focus-on-mount.ts`
- Modify: `src/copy/incident-ui.ts`, `src/copy/index.ts`, `src/styles.css`

**Interfaces:**
- Consumes: `BarrierCard`, `rowText` (Tarea 9); `WhatChip`, `FromChip` (Tarea 3); `TaggedText` (Tarea 11).
- Produces:
  - `useFocusOnMount<T extends HTMLElement>(): RefObject<T | null>`: enfoca su elemento una vez, al montarse (efecto dentro de un `use-*.ts`).
  - `TaskCard({ card: BarrierCard; chips: { what: WhatChip[]; from: FromChip[] }; onPlace(whatId, fromId); onRemove(ruleId); onClose() })`.
  - `TASK_CARD_TEXT` en `src/copy/incident-ui.ts`.

Comportamiento (spec, "El incidente, paso a paso" 4):
- La tarjeta es un `role="dialog"` no modal con el nombre de la puerta. Al abrirse, el foco va a su título.
- Filas «qué ← desde dónde», cada una con su ×. Al quitar una, el foco vuelve al título (Review Focus 4).
- Ranura «Regla nueva» y dos bandejas, «Qué» y «Desde dónde». Una ficha elegida queda marcada en su bandeja (`aria-pressed`) y aparece en la ranura; otro clic, en la bandeja o en la ranura, la devuelve. La ficha se queda en la bandeja para que el foco del teclado no se pierda.
- Con una ficha de cada bandeja, llama a `onPlace` y vacía la ranura.
- Esc o «Listo» llaman a `onClose`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/ui/incident/task-card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT } from '@/copy';
import { barrierCard, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { TaskCard } from './task-card';

const DOOR = 'puerta de servidor2';

function renderCard(incidentId: string) {
  const session = startSession(INCIDENTS, incidentId);
  const card = barrierCard(session, PIECE_ID.barrier(SG.servidor2));
  if (!card) throw new Error('missing door');
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={session.incident.chips} {...handlers} />);
  return handlers;
}

describe('task card', () => {
  it('opens with the focus on its title and says when the door has no rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
    expect(screen.getByText(TASK_CARD_TEXT.noRules)).toBeInTheDocument();
  });

  it('builds a rule with clicks: one chip from each tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: 'Ping' }));
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'servidor1' }));
    expect(onPlace).toHaveBeenCalledWith(WHAT.ping.id, FROM.servidor1.id);
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'servidor1' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith(WHAT.ping.id, FROM.servidor1.id);
  });

  it('a chip clicked again, or clicked in the slot, goes back to its tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: 'Ping' }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack('Ping') }));
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'servidor1' }));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('removes a rule and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard('04-02');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.remove('Echo Reply (vuelta) ← Todo internet') }));
    expect(onRemove).toHaveBeenCalledWith(DAY_SHIFT_RULE.id);
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/ui/incident/task-card.test.tsx`
Expected: FAIL con "Failed to resolve import './task-card'".

- [ ] **Step 3: Textos de la tarjeta**

En `src/copy/incident-ui.ts`, agregar (y exportarlo en `src/copy/index.ts`):

```ts
export const TASK_CARD_TEXT = {
  noRules: 'No tiene reglas: no deja entrar nada.',
  slot: 'Regla nueva',
  what: 'Qué',
  from: 'Desde dónde',
  done: 'Listo',
  remove: (rule: string) => `Quitar la regla ${rule}`,
  giveBack: (chip: string) => `Devolver ${chip} a su bandeja`,
} as const;
```

- [ ] **Step 4: Foco al montar**

`src/ui/incident/use-focus-on-mount.ts`:

```ts
import { useEffect, useRef, type RefObject } from 'react';

/** Returns a ref whose element gets the focus once, right after it mounts. */
export function useFocusOnMount<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
```

- [ ] **Step 5: La tarjeta**

`src/ui/incident/task-card.tsx`:

```tsx
import { useState, type KeyboardEvent } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { rowText, type BarrierCard } from '@/game';
import type { FromChip, WhatChip } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

type Tray = 'what' | 'from';
type Slot = Record<Tray, string | null>;
type Chip = { id: string; label: TermText };

const EMPTY_SLOT: Slot = { what: null, from: null };

interface TaskCardProps {
  card: BarrierCard;
  chips: { what: WhatChip[]; from: FromChip[] };
  onPlace: (whatId: string, fromId: string) => void;
  onRemove: (ruleId: string) => void;
  onClose: () => void;
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

function SlotChip({ chip, placeholder, onGiveBack }: { chip: Chip | undefined; placeholder: string; onGiveBack: () => void }) {
  return chip ? (
    <button type="button" className="chip" aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} />
    </button>
  ) : (
    <span className="slot__empty">{placeholder}</span>
  );
}

export function TaskCard({ card, chips, onPlace, onRemove, onClose }: TaskCardProps) {
  const [slot, setSlot] = useState<Slot>(EMPTY_SLOT);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const toggle = (tray: Tray, chipId: string) => {
    const next = { ...slot, [tray]: slot[tray] === chipId ? null : chipId };
    if (next.what !== null && next.from !== null) {
      onPlace(next.what, next.from);
      setSlot(EMPTY_SLOT);
    } else {
      setSlot(next);
    }
  };
  const remove = (ruleId: string) => {
    onRemove(ruleId);
    heading.current?.focus();
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  const pickedWhat = chips.what.find((chip) => chip.id === slot.what);
  const pickedFrom = chips.from.find((chip) => chip.id === slot.from);
  return (
    <section role="dialog" aria-label={toPlainText(card.title)} className="card task-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={card.title} />
      </h2>
      {card.rules.length > 0 ? (
        <ul className="rules">
          {card.rules.map((row) => (
            <li key={row.id}>
              <TaggedText text={rowText(row)} />
              <button type="button" className="btn btn--small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => remove(row.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{TASK_CARD_TEXT.noRules}</p>
      )}
      <div role="group" aria-label={TASK_CARD_TEXT.slot} className="slot">
        <SlotChip chip={pickedWhat} placeholder={TASK_CARD_TEXT.what} onGiveBack={() => setSlot({ ...slot, what: null })} />
        <span aria-hidden="true">←</span>
        <SlotChip chip={pickedFrom} placeholder={TASK_CARD_TEXT.from} onGiveBack={() => setSlot({ ...slot, from: null })} />
      </div>
      <ChipTray name={TASK_CARD_TEXT.what} chips={chips.what} picked={slot.what} onPick={(chipId) => toggle('what', chipId)} />
      <ChipTray name={TASK_CARD_TEXT.from} chips={chips.from} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />
      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>
    </section>
  );
}
```

- [ ] **Step 6: Estilos**

Al final de `src/styles.css`:

```css
.task-card { display: grid; gap: 0.6rem; }
.task-card h2:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rules { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
.rules li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.slot { display: flex; align-items: center; gap: 0.4rem; min-height: 2.2rem; padding: 0.3rem 0.5rem; border: 1.5px dashed var(--ink-soft); }
.slot__empty { color: var(--ink-soft); font-size: 0.85rem; }
.tray { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
.tray__name { width: 100%; font: 600 0.75rem var(--font-body); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); }
.chip { font: 600 0.85rem var(--font-body); color: var(--ink); background: var(--paper); border: 1.5px solid var(--ink); border-radius: 999px; padding: 0.2rem 0.7rem; cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--ink); color: var(--paper-fill); }
.chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 7: Correr todo lo rápido**

Run: `npx vitest run src/ui && npm run typecheck && npm run lint && npm run dup`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ui src/copy src/styles.css
git commit -m "feat(ui): add the task card to build rules from chips"
```

---

### Task 13: El mapa: etiquetas que son botones y la tarjeta anclada

Las etiquetas del mapa pasan a ser botones (foco = mouse encima, Enter abre la tarea), el mapa se centra en lo que dibuja (backlog A6), las subredes y las IPs dejan de dibujarse (escalera) y la tarjeta se ancla junto a su puerta, del lado con más espacio.

**Files:**
- Create: `src/scene/overlay/CLAUDE.md`, `src/scene/overlay/inspect-handlers.ts`, `src/scene/overlay/piece-label.tsx`, `src/scene/overlay/piece-label.test.tsx`, `src/scene/overlay/piece-anchor.tsx`, `src/scene/overlay/card-anchor.tsx`, `src/scene/overlay/use-card-side.ts`
- Modify (reescribir): `src/scene/layout.ts`, `src/scene/layout.test.ts`, `src/scene/pieces.tsx`, `src/scene/game-scene.tsx`, `src/scene/index.ts`
- Modify: `src/copy/ui.ts` y `src/copy/index.ts` (se va `SCENE_TEXT`), `src/styles.css`

**Interfaces:**
- Consumes: `MAP_TEXT`, `toPlainText`, `TermText` (Tareas 1 y 9).
- Produces:
  - `overlay/inspect-handlers.ts`: `type OnInspect = (pieceId: string | null) => void`, `inspectHandlers(pieceId, onInspect)` → `{ onMouseEnter, onMouseLeave, onFocus, onBlur }`.
  - `overlay/piece-label.tsx`: `type MapPieceKind = 'server' | 'barrier' | 'actor' | 'gateway'`, `interface MapPiece { id; kind: MapPieceKind; anchorId: string; label: TermText; locked: boolean }` (un `PieceView` de `game` cabe tal cual), `pieceDomId(pieceId): string`, `PieceLabel`.
  - `layout.ts`: además de lo que ya tenía (`computeLayout`, `pathFor`, `cumulativeLengths`, `pointAt`), `Vec3`, `CardSide`, `layoutCenter(layout): Vec2`, `labelPosition(piece, layout): Vec3`, `cardAnchorPosition(anchorId, layout): Vec3`, `sideForNdc(ndcX): CardSide`, `roundTrip(path): Vec2[]`, `pathLength(path): number`, `spreadStamps(points): Vec2[]`. Se van `checkpointPosition` y `SubnetSpot.az`.
  - `GameScene` con `GameSceneProps = { world: Network; pieces: MapPiece[]; intrudedServerIds: ReadonlySet<string>; still: boolean; activePieceId: string | null; overlay: ReactNode; onInspect: OnInspect; onActivate: (pieceId: string) => void }`. La Tarea 14 le suma `flows`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/scene/overlay/piece-label.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PieceLabel, pieceDomId, type MapPiece } from './piece-label';

const SERVER: MapPiece = { id: 'server:servidor2', kind: 'server', anchorId: 'servidor2', label: 'servidor2', locked: true };
const DOOR: MapPiece = { id: 'barrier:sg-servidor2', kind: 'barrier', anchorId: 'servidor2', label: '{{security-group}} de servidor2', locked: false };

function renderLabel(piece: MapPiece) {
  const handlers = { onInspect: vi.fn(), onActivate: vi.fn() };
  render(<PieceLabel piece={piece} {...handlers} />);
  return handlers;
}

describe('piece label', () => {
  it('reads its plain label and says when the piece is locked', () => {
    renderLabel(SERVER);
    expect(screen.getByRole('button', { name: 'servidor2 con candado' })).toBeInTheDocument();
  });

  it('hovering or focusing inspects the piece, and leaving stops', async () => {
    const user = userEvent.setup();
    const { onInspect } = renderLabel(DOOR);
    const label = screen.getByRole('button', { name: 'puerta de servidor2' });
    await user.hover(label);
    expect(onInspect).toHaveBeenLastCalledWith(DOOR.id);
    await user.unhover(label);
    expect(onInspect).toHaveBeenLastCalledWith(null);
    await user.tab();
    expect(onInspect).toHaveBeenLastCalledWith(DOOR.id);
  });

  it('a click or Enter activates it', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderLabel(DOOR);
    await user.click(screen.getByRole('button', { name: 'puerta de servidor2' }));
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenCalledWith(DOOR.id);
  });

  it('has a DOM id so the focus can come back to it', () => {
    renderLabel(DOOR);
    expect(screen.getByRole('button', { name: 'puerta de servidor2' })).toHaveAttribute('id', pieceDomId(DOOR.id));
  });
});
```

En `src/scene/layout.test.ts`: borrar el `describe('checkpointPosition', …)` y su import, importar también `cardAnchorPosition, labelPosition, layoutCenter, pathLength, roundTrip, sideForNdc, spreadStamps`, y agregar:

```ts
describe('anchors', () => {
  const layout = computeLayout(lab03Net());

  it('the camera looks at the middle of everything drawn, actors included', () => {
    const [x] = layoutCenter(layout);
    const left = Math.min(...Object.values(layout.actors).map(([actorX]) => actorX));
    expect(x - left).toBeCloseTo(layout.sheet.width / 2 - x);
  });

  it('a door label sits in front of its door, and a server label above its building', () => {
    const spot = layout.instances.servidor2;
    expect(labelPosition({ kind: 'barrier', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.barrier[1]);
    expect(labelPosition({ kind: 'server', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.barrier[0]);
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

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/scene`
Expected: FAIL: `./piece-label` no existe y `layoutCenter`, `labelPosition`… no están exportados.

- [ ] **Step 3: Manejadores de inspección y etiqueta**

`src/scene/overlay/inspect-handlers.ts`:

```ts
export type OnInspect = (pieceId: string | null) => void;

/** Returns the props that inspect a piece while the mouse is over it or it has the focus, and stop when either leaves. */
export function inspectHandlers(pieceId: string, onInspect: OnInspect) {
  const inspect = () => onInspect(pieceId);
  const leave = () => onInspect(null);
  return { onMouseEnter: inspect, onMouseLeave: leave, onFocus: inspect, onBlur: leave };
}
```

`src/scene/overlay/piece-label.tsx`:

```tsx
import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import { inspectHandlers, type OnInspect } from './inspect-handlers';

export type MapPieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface MapPiece {
  id: string;
  kind: MapPieceKind;
  anchorId: string;
  label: TermText;
  locked: boolean;
}

/** Returns the DOM id of a piece's label, so the focus can come back to it. */
export function pieceDomId(pieceId: string): string {
  return `piece-${pieceId.replaceAll(':', '-')}`;
}

export function PieceLabel({ piece, onInspect, onActivate }: { piece: MapPiece; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  return (
    <button
      type="button"
      id={pieceDomId(piece.id)}
      className={piece.locked ? 'map-button map-button--locked' : 'map-button'}
      onClick={() => onActivate(piece.id)}
      {...inspectHandlers(piece.id, onInspect)}
    >
      {toPlainText(piece.label)}
      {piece.locked && (
        <>
          <span aria-hidden="true"> 🔒</span>
          <span className="sr-only"> {MAP_TEXT.locked}</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Anclas en el mapa**

`src/scene/overlay/piece-anchor.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import type { OnInspect } from './inspect-handlers';
import { PieceLabel, type MapPiece } from './piece-label';

const LABEL_LAYERS: [number, number] = [20, 10];

export function PieceAnchor({ piece, position, onInspect, onActivate }: { piece: MapPiece; position: Vec3; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center zIndexRange={LABEL_LAYERS}>
      <PieceLabel piece={piece} onInspect={onInspect} onActivate={onActivate} />
    </Html>
  );
}
```

`src/scene/overlay/use-card-side.ts`:

```ts
import { useFrame } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { sideForNdc, type CardSide, type Vec3 } from '@/scene/layout';

/** Returns the side of its anchor a card should open on, following the camera while the player pans and zooms. */
export function useCardSide([x, y, z]: Vec3): CardSide {
  const [side, setSide] = useState<CardSide>('right');
  const projected = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    const next = sideForNdc(projected.set(x, y, z).project(camera).x);
    if (next !== side) setSide(next);
  });
  return side;
}
```

`src/scene/overlay/card-anchor.tsx`:

```tsx
import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import { useCardSide } from './use-card-side';

const CARD_LAYERS: [number, number] = [30, 20];

export function CardAnchor({ position, children }: { position: Vec3; children: ReactNode }) {
  const portal = useHtmlPortal();
  const side = useCardSide(position);
  return (
    <Html portal={portal} position={position} zIndexRange={CARD_LAYERS}>
      <div className={`map-card map-card--${side}`}>{children}</div>
    </Html>
  );
}
```

`src/scene/overlay/CLAUDE.md`:

```markdown
# scene/overlay

HTML drawn on the map's HTML layer: piece labels as buttons, the anchor that keeps the task card beside its door, and the shared hover-and-focus handlers.

- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed.
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).
```

- [ ] **Step 5: Distribución**

`src/scene/layout.ts` (reemplazar entero; `pathFor`, `cumulativeLengths` y `pointAt` no cambian):

```ts
import type { Network, PacketSpec, Trace } from '@/engine';
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

export interface InstanceSpot {
  x: number;
  z: number;
  barrier: Vec2;
  door: Vec2;
  road: Vec2;
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  instances: Record<string, InstanceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  igw: Vec2;
  actors: Record<string, Vec2>;
}

const GAP = 3.2;
const MIN_COLUMN = 5;
const DEPTH = 6;
const ROAD_Z = 1.9;
const BUILDING_Z = -0.9;
const BARRIER_Z = 0.7;
const DOOR_Z = -0.2;
const GATEWAY_MARGIN = 1.5;
const ACTOR_GAP = 3.5;
const ACTOR_SPACING = 2.5;
const ACTOR_STAGGER_Z = 1.6;
const LABEL = { serverY: 1.75, barrierY: 0.1, barrierDz: 0.8, actorY: 0.05, actorDz: 0.7, gatewayY: 2.6 } as const;
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.6;

/** Lays out one column per subnet, the instances of each subnet in a row, and the internet on the left. */
export function computeLayout(net: Network): Layout {
  const widths = net.subnets.map((s) => Math.max(MIN_COLUMN, net.instances.filter((i) => i.subnetId === s.id).length * GAP + 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const sheetWidth = total + 2;
  const subnets: Record<string, SubnetSpot> = {};
  const instances: Record<string, InstanceSpot> = {};
  let cursor = -total / 2;
  net.subnets.forEach((subnet, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width;
    subnets[subnet.id] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1 };
    const own = net.instances.filter((i) => i.subnetId === subnet.id);
    own.forEach((instance, k) => {
      const x = cx + (k - (own.length - 1) / 2) * GAP;
      instances[instance.id] = { x, z: BUILDING_Z, barrier: [x, BARRIER_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const igw: Vec2 = [-sheetWidth / 2 - GATEWAY_MARGIN, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [igw[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, instances, roadZ: ROAD_Z, roadFromX: igw[0], roadToX: sheetWidth / 2 - 0.5, igw, actors };
}

/** Returns the middle of everything drawn, so the camera can look at it. */
export function layoutCenter(layout: Layout): Vec2 {
  const left = Math.min(layout.igw[0], ...Object.values(layout.actors).map(([x]) => x));
  return [(left + layout.sheet.width / 2) / 2, 0];
}

/** Returns where the label of a piece floats: above a building, in front of a door, below an actor, above the internet entrance. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  switch (piece.kind) {
    case 'server': {
      const spot = layout.instances[piece.anchorId];
      return [spot.x, LABEL.serverY, spot.z];
    }
    case 'barrier': {
      const [x, z] = layout.instances[piece.anchorId].barrier;
      return [x, LABEL.barrierY, z + LABEL.barrierDz];
    }
    case 'actor': {
      const [x, z] = layout.actors[piece.anchorId];
      return [x, LABEL.actorY, z + LABEL.actorDz];
    }
    case 'gateway':
      return [layout.igw[0], LABEL.gatewayY, layout.igw[1]];
  }
}

/** Returns where the task card of the door of this instance is anchored. */
export function cardAnchorPosition(instanceId: string, layout: Layout): Vec3 {
  const [x, z] = layout.instances[instanceId].barrier;
  return [x, CARD_Y, z];
}

/** Picks the side with more room for a card anchored at this normalized screen x (-1 is the left edge, 1 the right edge). */
export function sideForNdc(ndcX: number): CardSide {
  return ndcX > 0 ? 'left' : 'right';
}
```

Después, sin cambios, `pathFor`, `cumulativeLengths` y `pointAt` tal como están hoy, y al final:

```ts
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

Los valores de `LABEL`, `ACTOR_GAP` y `STAMP_SPREAD` salen de una cuenta a mano con la cámara isométrica; la prueba de punta a punta de la Tarea 16 dice si alcanzan. Si no, se ajustan **solo** aquí.

- [ ] **Step 6: Piezas: sacudida, pulso, sin etiquetas propias**

`src/scene/pieces.tsx` (reemplazar entero; `Sheet`, `Road` e `InkBox` no cambian de comportamiento; `Label` y `Zone` se van):

```tsx
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Actor } from '@/engine';
import { boxEdgePoints } from './edges';
import { useHtmlPortal } from './html-layer';
import type { InstanceSpot, Layout, Vec2, Vec3 } from './layout';
import { ACCENT, INK, PAPER_FILL, PAPER_SHADE } from './theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const PULSE_SPEED = 4;
const PULSE_AMPLITUDE = 0.35;
const PULSE_STILL_SCALE = 1.5;
const WARNING_Y = 2.1;

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

export function Sheet({ layout }: { layout: Layout }) {
  return <InkBox size={[layout.sheet.width, 0.2, layout.sheet.depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}

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
      {Object.entries(layout.instances).map(([id, spot]) => (
        <mesh key={id} rotation-x={-Math.PI / 2} position={[spot.x, 0.012, (spot.door[1] + z) / 2]}>
          <planeGeometry args={[0.5, z - spot.door[1]]} />
          <meshBasicMaterial color={PAPER_SHADE} />
        </mesh>
      ))}
    </group>
  );
}

/** A server's building; it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function Building({ spot, shaking, still }: { spot: InstanceSpot; shaking: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = shaking && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <InkBox size={[1.6, 1.1, 1.2]} position={[spot.x, 0.55, spot.z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[spot.x, 1.16, spot.z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[spot.x, 0.28, spot.z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
      {shaking && still && (
        <Html portal={portal} position={[spot.x, WARNING_Y, spot.z]} center>
          <span className="stamp stamp--drop" aria-hidden="true">
            !
          </span>
        </Html>
      )}
    </group>
  );
}

/** A server's door; its bar pulses while its task card is open, or stays thicker without animations. */
export function Barrier({ spot, active, still }: { spot: InstanceSpot; active: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = spot.barrier;
  useFrame(({ clock }) => {
    if (!bar.current) return;
    const pulse = still ? PULSE_STILL_SCALE : 1 + Math.abs(Math.sin(clock.elapsedTime * PULSE_SPEED)) * PULSE_AMPLITUDE;
    const scale = active ? pulse : 1;
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

export function Gateway({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z - 0.65]} />
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z + 0.65]} />
      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
    </group>
  );
}

export function ActorMark({ position, actor }: { position: Vec2; actor: Actor }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={actor.kind === 'attacker' ? INK : PAPER_FILL} />;
}
```

- [ ] **Step 7: La escena**

`src/scene/game-scene.tsx` (reemplazar entero):

```tsx
import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import type { Network } from '@/engine';
import { HtmlLayerContext } from './html-layer';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter } from './layout';
import { CardAnchor } from './overlay/card-anchor';
import type { OnInspect } from './overlay/inspect-handlers';
import { PieceAnchor } from './overlay/piece-anchor';
import type { MapPiece } from './overlay/piece-label';
import { ActorMark, Barrier, Building, Gateway, Road, Sheet } from './pieces';

const CAMERA_OFFSET = 14;
const CAMERA_ZOOM = 38;

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  intrudedServerIds: ReadonlySet<string>;
  still: boolean;
  activePieceId: string | null;
  overlay: ReactNode;
  onInspect: OnInspect;
  onActivate: (pieceId: string) => void;
}

export function GameScene({ world, pieces, intrudedServerIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world);
  const [cx, cz] = layoutCenter(layout);
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  const active = pieces.find((piece) => piece.id === activePieceId);
  return (
    <>
      <Canvas
        orthographic
        camera={{ position: [cx + CAMERA_OFFSET, CAMERA_OFFSET, cz + CAMERA_OFFSET], zoom: CAMERA_ZOOM, near: 0.1, far: 500 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <HtmlLayerContext.Provider value={htmlLayer}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} />
          <MapControls target={[cx, 0, cz]} enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
          <Sheet layout={layout} />
          <Road layout={layout} />
          <Gateway position={layout.igw} />
          {world.instances.map((instance) => (
            <Building key={instance.id} spot={layout.instances[instance.id]} shaking={intrudedServerIds.has(instance.id)} still={still} />
          ))}
          {pieces
            .filter((piece) => piece.kind === 'barrier')
            .map((piece) => (
              <Barrier key={piece.id} spot={layout.instances[piece.anchorId]} active={piece.id === activePieceId} still={still} />
            ))}
          {world.actors.map((actor) => (
            <ActorMark key={actor.id} position={layout.actors[actor.id]} actor={actor} />
          ))}
          {pieces.map((piece) => (
            <PieceAnchor key={piece.id} piece={piece} position={labelPosition(piece, layout)} onInspect={onInspect} onActivate={onActivate} />
          ))}
          {active && overlay && <CardAnchor position={cardAnchorPosition(active.anchorId, layout)}>{overlay}</CardAnchor>}
          <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
```

`src/scene/index.ts`:

```ts
export { GameScene } from './game-scene';
export type { GameSceneProps } from './game-scene';
export { pieceDomId } from './overlay/piece-label';
export type { MapPiece } from './overlay/piece-label';
```

- [ ] **Step 8: `SCENE_TEXT` se va y estilos del mapa**

Borrar `SCENE_TEXT` de `src/copy/ui.ts` y de `src/copy/index.ts` (el nombre de la entrada desde internet ahora viene de `game`).

En `src/styles.css`, reemplazar las tres reglas `.label3d…` por:

```css
.map-button { pointer-events: auto; font: 500 13px var(--font-body); color: var(--ink); background: var(--paper-fill); border: 1px solid var(--ink); padding: 1px 6px; white-space: nowrap; cursor: pointer; }
.map-button--locked { border-style: dashed; color: var(--ink-soft); }
.map-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.map-card { pointer-events: auto; width: 300px; }
.map-card--right { transform: translate(110px, -50%); }
.map-card--left { transform: translate(calc(-100% - 110px), -50%); }
.stamp { pointer-events: auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; font: 700 18px var(--font-display); background: var(--paper-fill); border: 2.5px solid currentColor; border-radius: 50%; transform: rotate(-8deg); }
.stamp--pass { color: var(--ink); }
.stamp--drop { color: var(--accent); }
```

- [ ] **Step 9: Correr todo**

Run: `npm run check`
Expected: PASS (la escena todavía no se usa en ninguna pantalla; el e2e del roadmap sigue igual).

- [ ] **Step 10: Commit**

```bash
git add src/scene src/copy src/styles.css
git commit -m "feat(scene): label pieces as buttons and anchor the task card"
```

---

### Task 14: Tráfico vivo

**Files:**
- Create: `src/scene/traffic/CLAUDE.md`, `src/scene/traffic/schedule.ts`, `src/scene/traffic/schedule.test.ts`, `src/scene/traffic/use-packet-runs.ts`, `src/scene/traffic/packet-run.tsx`, `src/scene/traffic/flow-traffic.tsx`, `src/scene/traffic/stamp.tsx`, `src/scene/traffic/still-path.tsx`, `src/scene/traffic/traffic.tsx`
- Modify: `src/scene/game-scene.tsx`, `src/scene/index.ts`, `src/styles.css`

**Interfaces:**
- Consumes: `pathFor`, `roundTrip`, `pathLength`, `spreadStamps`, `cumulativeLengths`, `pointAt` (Tarea 13); `inspectHandlers`, `OnInspect`; `MAP_TEXT`, `toPlainText`; tipo `FlowKind`.
- Produces:
  - `traffic.tsx`: `interface MapFlow { id; pieceId; kind: FlowKind; packet: PacketSpec; trace: Trace; reached: boolean; replied: boolean; label: TermText }` (un `FlowRun` de `game` cabe tal cual) y `Traffic({ flows, layout, still, onInspect })`.
  - `schedule.ts`: `FLOW_PERIOD_S = 3.5`, `FLOW_OFFSET_S = 1.1`, `PACKET_SPEED = 3.2`, `BURST_S = 0.5`, `sendsBetween(from, to, flowIndex): boolean`, `runSeconds(path): number`.
  - `use-packet-runs.ts`: `interface Trip { path: Vec2[]; blocked: boolean }`, `usePacketRuns(trip, flowIndex): (Trip & { key: number; endsAt: number })[]`.
  - `GameSceneProps` gana `flows: MapFlow[]`.

Comportamiento (spec, "El incidente, paso a paso" 2 y "Escena y arte"):
- Cada flujo manda un paquete cada `FLOW_PERIOD_S` segundos, desfasado `FLOW_OFFSET_S` por su posición. Legítimo: círculo de tinta. Atacante: rombo bermellón.
- Un paquete bloqueado estalla en la barrera (anillo bermellón). Uno con respuesta vuelve por el mismo camino.
- Al cambiar el mundo, los paquetes nuevos siguen el recorrido nuevo y los que están en vuelo terminan el suyo.
- Cada flujo tiene un sello fijo al final de su camino: ✓ si llega, ✕ si no. Es un botón que inspecciona el paquete.
- Con "Sin animaciones", cada camino se pinta quieto: tinta si llega, bermellón si no.

- [ ] **Step 1: Escribir el test que falla**

`src/scene/traffic/schedule.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BURST_S, FLOW_OFFSET_S, FLOW_PERIOD_S, PACKET_SPEED, runSeconds, sendsBetween } from './schedule';

const FRAME_S = 1 / 60;
const FRAMES_IN_TWO_PERIODS = Math.round((2 * FLOW_PERIOD_S) / FRAME_S);

describe('traffic schedule', () => {
  it('the first flow sends on the first frame, the second one FLOW_OFFSET_S later', () => {
    expect(sendsBetween(-Number.EPSILON, FRAME_S, 0)).toBe(true);
    expect(sendsBetween(-Number.EPSILON, FRAME_S, 1)).toBe(false);
    expect(sendsBetween(FLOW_OFFSET_S - FRAME_S, FLOW_OFFSET_S + FRAME_S, 1)).toBe(true);
  });

  it('each flow sends once per period', () => {
    let sent = 0;
    for (let frame = 0; frame < FRAMES_IN_TWO_PERIODS; frame++) {
      const from = frame * FRAME_S - Number.EPSILON;
      if (sendsBetween(from, from + FRAME_S, 0)) sent++;
    }
    expect(sent).toBe(2);
  });

  it('a packet stays its travel time plus the burst', () => {
    expect(runSeconds([[0, 0], [PACKET_SPEED, 0]])).toBeCloseTo(1 + BURST_S);
  });
});
```

- [ ] **Step 2: Correrlo y verlo fallar**

Run: `npx vitest run src/scene/traffic`
Expected: FAIL con "Failed to resolve import './schedule'".

- [ ] **Step 3: El horario**

`src/scene/traffic/schedule.ts`:

```ts
import { pathLength, type Vec2 } from '@/scene/layout';

export const FLOW_PERIOD_S = 3.5;
export const FLOW_OFFSET_S = 1.1;
export const PACKET_SPEED = 3.2;
export const BURST_S = 0.5;

/** True when a flow sends a packet in the window (from, to]: one every FLOW_PERIOD_S seconds, shifted by the flow's position so flows do not leave together. */
export function sendsBetween(from: number, to: number, flowIndex: number): boolean {
  const offset = flowIndex * FLOW_OFFSET_S;
  return Math.floor((to - offset) / FLOW_PERIOD_S) > Math.floor((from - offset) / FLOW_PERIOD_S);
}

/** Seconds a packet stays on the map: its travel along the path plus the burst at the end. */
export function runSeconds(path: Vec2[]): number {
  return pathLength(path) / PACKET_SPEED + BURST_S;
}
```

- [ ] **Step 4: El reloj de los paquetes**

`src/scene/traffic/use-packet-runs.ts`:

```ts
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Vec2 } from '@/scene/layout';
import { runSeconds, sendsBetween } from './schedule';

export interface Trip {
  path: Vec2[];
  blocked: boolean;
}

interface Run extends Trip {
  key: number;
  endsAt: number;
}

/** Sends a packet along the latest trip once per period and forgets it when it finishes; packets already travelling keep the trip they started with. */
export function usePacketRuns(trip: Trip, flowIndex: number): Run[] {
  const [runs, setRuns] = useState<Run[]>([]);
  const clock = useRef(-Number.EPSILON);
  const nextKey = useRef(0);
  useFrame((_, delta) => {
    const from = clock.current;
    const now = from + delta;
    clock.current = now;
    const sends = sendsBetween(from, now, flowIndex);
    if (!sends && !runs.some((run) => run.endsAt <= now)) return;
    const key = nextKey.current;
    if (sends) nextKey.current += 1;
    const sent = sends ? [{ ...trip, key, endsAt: now + runSeconds(trip.path) }] : [];
    setRuns((current) => [...current.filter((run) => run.endsAt > now), ...sent]);
  });
  return runs;
}
```

- [ ] **Step 5: Un paquete**

`src/scene/traffic/packet-run.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { cumulativeLengths, pointAt } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';
import { PACKET_SPEED } from './schedule';
import type { Trip } from './use-packet-runs';

export const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const RHOMBUS_RADIUS = 0.24;
const BURST_GROWTH = 3;
const BURST_RING: [number, number, number] = [0.22, 0.3, 24];

/** One packet travelling its trip: an ink dot for legitimate traffic, a vermilion rhombus for the attacker, and a burst where a blocked one stops. */
export function PacketRun({ path, blocked, attacker }: Trip & { attacker: boolean }) {
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
          {attacker ? <octahedronGeometry args={[RHOMBUS_RADIUS]} /> : <sphereGeometry args={[DOT_RADIUS, 16, 12]} />}
          <meshStandardMaterial color={attacker ? ACCENT : INK} roughness={1} />
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
```

- [ ] **Step 6: Flujo, sello, camino quieto y tráfico**

`src/scene/traffic/flow-traffic.tsx`:

```tsx
import { roundTrip, type Vec2 } from '@/scene/layout';
import { PacketRun } from './packet-run';
import type { MapFlow } from './traffic';
import { usePacketRuns } from './use-packet-runs';

export function FlowTraffic({ path, flow, index }: { path: Vec2[]; flow: MapFlow; index: number }) {
  const runs = usePacketRuns({ path: flow.replied ? roundTrip(path) : path, blocked: !flow.reached }, index);
  return (
    <>
      {runs.map((run) => (
        <PacketRun key={run.key} path={run.path} blocked={run.blocked} attacker={flow.kind === 'forbidden'} />
      ))}
    </>
  );
}
```

`src/scene/traffic/stamp.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { MAP_TEXT, toPlainText } from '@/copy';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec2 } from '@/scene/layout';
import { inspectHandlers, type OnInspect } from '@/scene/overlay/inspect-handlers';
import type { MapFlow } from './traffic';

const STAMP_Y = 0.9;
const STAMP_LAYERS: [number, number] = [15, 5];

function tone(flow: MapFlow): 'pass' | 'drop' | 'intruder' {
  if (!flow.reached) return 'drop';
  return flow.kind === 'forbidden' ? 'intruder' : 'pass';
}

/** The fixed stamp at the end of a flow's path: ✓ when it gets in, ✕ when it does not; hovering or focusing it inspects the packet. */
export function Stamp({ position, flow, onInspect }: { position: Vec2; flow: MapFlow; onInspect: OnInspect }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${tone(flow)}`} aria-label={MAP_TEXT.packet(toPlainText(flow.label))} {...inspectHandlers(flow.pieceId, onInspect)}>
        <span aria-hidden="true">{flow.reached ? '✓' : '✕'}</span>
      </button>
    </Html>
  );
}
```

`src/scene/traffic/still-path.tsx`:

```tsx
import { Line } from '@react-three/drei';
import type { Vec2, Vec3 } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';
import { PACKET_Y } from './packet-run';

const STILL_LINE_WIDTH = 2.5;

/** A flow's path drawn without movement: ink when it gets in, vermilion up to where it stops. */
export function StillPath({ path, reached }: { path: Vec2[]; reached: boolean }) {
  return <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={reached ? INK : ACCENT} lineWidth={STILL_LINE_WIDTH} />;
}
```

`src/scene/traffic/traffic.tsx`:

```tsx
import type { TermText } from '@/copy';
import type { PacketSpec, Trace } from '@/engine';
import type { FlowKind } from '@/levels';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { FlowTraffic } from './flow-traffic';
import { Stamp } from './stamp';
import { StillPath } from './still-path';

export interface MapFlow {
  id: string;
  pieceId: string;
  kind: FlowKind;
  packet: PacketSpec;
  trace: Trace;
  reached: boolean;
  replied: boolean;
  label: TermText;
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const paths = flows.map((flow) => pathFor(flow.trace, flow.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {flows.map((flow, index) => (
        <group key={flow.id}>
          {still ? <StillPath path={paths[index]} reached={flow.reached} /> : <FlowTraffic path={paths[index]} flow={flow} index={index} />}
          <Stamp position={stamps[index]} flow={flow} onInspect={onInspect} />
        </group>
      ))}
    </>
  );
}
```

`src/scene/traffic/CLAUDE.md`:

```markdown
# scene/traffic

Live traffic: each flow sends a packet every few seconds along the path of its trace, a blocked one bursts at the door, a replied one comes back, and a stamp at the end of each path can be inspected. With "Sin animaciones" each path is drawn still.

- The clock lives in `use-packet-runs.ts`; whether a packet gets in comes from the flow's `reached` and `replied`, never from here.
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).
```

- [ ] **Step 7: La escena dibuja el tráfico**

En `src/scene/game-scene.tsx`:
- importar `import { Traffic, type MapFlow } from './traffic/traffic';`;
- sumar `flows: MapFlow[];` a `GameSceneProps` y `flows` a la desestructuración;
- dibujar `<Traffic flows={flows} layout={layout} still={still} onInspect={onInspect} />` justo después de las `PieceAnchor`.

En `src/scene/index.ts`, agregar `export type { MapFlow } from './traffic/traffic';`.

Al final de `src/styles.css`:

```css
.stamp--intruder { color: var(--accent); border-style: double; border-width: 4px; }
button.stamp { cursor: help; }
button.stamp:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 8: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/scene src/styles.css
git commit -m "feat(scene): animate live traffic with stamps and a still mode"
```

---

### Task 15: La pantalla del incidente, de punta a punta

**Files:**
- Create: `src/ui/incident/use-stability-clock.ts`, `src/ui/incident/inspection-box.tsx`, `src/ui/incident/explanation-card.tsx`, `src/ui/incident/result-card.tsx`, `src/ui/incident/incident-screen.tsx`, `src/ui/incident/incident-screen.test.tsx`, `src/ui/notice-page.tsx`, `src/ui/incident-page.tsx`
- Modify: `src/copy/incident-ui.ts`, `src/copy/ui.ts`, `src/copy/index.ts`, `src/ui/index.ts`, `src/app.tsx`, `src/app.test.tsx`, `src/styles.css`, `tests/e2e/roadmap.spec.ts`
- Delete: `src/ui/not-found.tsx`

**Interfaces:**
- Consumes: todo `@/game` (Tareas 7 a 9); `GameScene`, `pieceDomId`, `GameSceneProps` (Tareas 13 y 14); `LuciaCard`, `TaskCard`, `useFocusOnMount`, `TaggedText`, `Stars` (Tareas 10 a 12); `isUnlocked`, `saveStars`, `MAX_STARS`.
- Produces:
  - `TICK_MS = 100` y `useStabilityClock(dispatch)` (manda `tick` cada `TICK_MS` con `useInterval` de `@mantine/hooks`; el reducer ignora los ticks fuera de `playing`).
  - `IncidentScreen({ incidents, incidentId, nextId, onFinish(stars) })`.
  - `IncidentPage({ incidents, levelId, progress, onFinish(levelId, stars) })`: aviso si el incidente no existe o está bloqueado (backlog A8), pantalla del incidente si no.
  - `NoticePage({ title, body })`.
  - Copy: `EXPLANATION_TEXT`, `RESULT_TEXT`, `SCREEN_TEXT` (en `incident-ui.ts`) y `NOTICE_TEXT` (en `ui.ts`, reemplaza a `NOT_FOUND_TEXT`).

Comportamiento:
- La tarjeta de tarea solo se abre en una pieza `configurable` y mientras se juega. Al cerrarla (Esc o «Listo»), el foco vuelve a la etiqueta de su puerta.
- Si el incidente se cierra con la tarjeta abierta, la tarjeta se va y el foco cae en la pregunta de Lucía (Review Focus 3).
- «Sin animaciones» empieza con la preferencia del sistema (`useReducedMotion` de `@mantine/hooks`) y el jugador la cambia.
- «Ver resultado» guarda las estrellas (`onFinish`) en el mismo clic: no hace falta un efecto.

- [ ] **Step 1: Escribir los tests que fallan**

`src/ui/incident/incident-screen.test.tsx` (la escena se reemplaza por un doble que dibuja las etiquetas reales, porque jsdom no tiene WebGL):

```tsx
// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, ROADMAP_TEXT } from '@/copy';
import { STABLE_MS } from '@/game';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { IncidentScreen } from './incident-screen';
import { TICK_MS } from './use-stability-clock';

vi.mock('@/scene/game-scene', async () => {
  const { PieceLabel } = await vi.importActual<typeof import('@/scene/overlay/piece-label')>('@/scene/overlay/piece-label');
  const { toPlainText } = await vi.importActual<typeof import('@/copy')>('@/copy');
  return {
    GameScene: ({ pieces, flows, overlay, onInspect, onActivate }: GameSceneProps) => (
      <div>
        {pieces.map((piece) => (
          <PieceLabel key={piece.id} piece={piece} onInspect={onInspect} onActivate={onActivate} />
        ))}
        {flows.map((flow) => (
          <button key={flow.id} type="button" onFocus={() => onInspect(flow.pieceId)}>
            {toPlainText(flow.label)}
          </button>
        ))}
        {overlay}
      </div>
    ),
  };
});

const DOOR = 'puerta de servidor2';
const LOCKED_SERVER = 'servidor2 con candado';
const ATTACKER_PACKET = 'ping de Atacante a servidor2';
const FULL_STARS = 3;
const FIRST = INCIDENTS[0];
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;

type User = ReturnType<typeof userEvent.setup>;

function renderFirst() {
  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId={INCIDENTS[1].id} onFinish={onFinish} />);
  return onFinish;
}

async function placeFix(user: User) {
  await user.click(screen.getByRole('button', { name: DOOR }));
  const card = screen.getByRole('dialog', { name: DOOR });
  await user.click(within(card).getByRole('button', { name: 'Ping' }));
  await user.click(within(card).getByRole('button', { name: 'servidor1' }));
  return card;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('incident screen', () => {
  it('opens the card from its door, and Esc closes it and gives the focus back to the door', async () => {
    const user = userEvent.setup();
    renderFirst();
    const door = screen.getByRole('button', { name: DOOR });
    await user.click(door);
    expect(screen.getByRole('dialog', { name: DOOR })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(door).toHaveFocus();
  });

  it('a rule placed from the card shows up in it', async () => {
    const user = userEvent.setup();
    renderFirst();
    const card = await placeFix(user);
    expect(within(card).getByRole('button', { name: 'Quitar la regla Ping ← servidor1' })).toBeInTheDocument();
  });

  it('a locked piece can be inspected but opens no card', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
  });

  it('the inspection box leaves out fields whose term comes later', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(box).toHaveTextContent('IP privada');
    expect(box).toHaveTextContent('172.31.38.97');
    expect(box).not.toHaveTextContent('IP pública');
    expect(box).not.toHaveTextContent('34.244.254.100');
  });

  it('a packet says where and why it stopped', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    expect(screen.getByRole('region', { name: ATTACKER_PACKET })).toHaveTextContent('Se queda en la puerta de servidor2: ninguna regla lo deja entrar.');
  });

  it('closing with the card open moves the focus to Lucía’s question, and the right answer gives 3 stars', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onFinish = renderFirst();
    await placeFix(user);
    await act(async () => {
      vi.advanceTimersByTime(STABLE_MS + TICK_MS);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: EXPLANATION_TEXT.asks })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
    expect(onFinish).toHaveBeenCalledWith(FULL_STARS);
    expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeInTheDocument();
  });
});
```

En `src/app.test.tsx`, reemplazar el test del enlace viejo por estos dos:

```tsx
  it('an unknown incident shows "Incidente no encontrado" with a link back', () => {
    window.location.hash = '#/level/09-99';
    render(<App />);
    expect(screen.getByRole('heading', { name: NOTICE_TEXT.notFound.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: NOTICE_TEXT.back })).toHaveAttribute('href', '#/');
  });

  it('a locked incident does not open from its URL', () => {
    window.location.hash = `#/level/${INCIDENTS[1].id}`;
    render(<App />);
    expect(screen.getByRole('heading', { name: NOTICE_TEXT.locked.title })).toBeInTheDocument();
  });
```

(importar `NOTICE_TEXT` de `@/copy`).

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/ui src/app.test.tsx`
Expected: FAIL: `./incident-screen` no existe y `NOTICE_TEXT` tampoco.

- [ ] **Step 3: Textos**

En `src/copy/incident-ui.ts`, agregar:

```ts
export const EXPLANATION_TEXT = {
  asks: 'Lucía: «¿Qué pasó?»',
  right: 'Correcto.',
  wrong: 'No es eso.',
  seeResult: 'Ver resultado',
} as const;

export const RESULT_TEXT = {
  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', tight: 'Abriste solo lo justo', explained: 'Explicaste qué pasó a la primera' },
  earned: 'conseguida',
  missed: 'sin conseguir',
  takeaway: 'Lo que te llevas',
  next: 'Siguiente incidente',
  back: 'Volver al roadmap',
} as const;

export const SCREEN_TEXT = {
  back: '← Roadmap',
  motion: 'Sin animaciones',
  inspectHelp: 'Pasa el mouse o el foco por una pieza o un sello para ver cómo está.',
} as const;
```

En `src/copy/ui.ts`, reemplazar `NOT_FOUND_TEXT` por:

```ts
export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes los incidentes anteriores.` },
  back: 'Volver al roadmap',
} as const;
```

`src/copy/index.ts` exporta `NOTICE_TEXT, ROADMAP_TEXT` de `./ui` y suma `EXPLANATION_TEXT, RESULT_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, LUCIA_TEXT` al export de `./incident-ui`.

- [ ] **Step 4: Reloj, inspección, pregunta y resultado**

`src/ui/incident/use-stability-clock.ts`:

```ts
import { useInterval } from '@mantine/hooks';
import type { SessionAction } from '@/game';

export const TICK_MS = 100;

/** Sends a tick to the session every TICK_MS; the session ignores ticks once the incident is closed. */
export function useStabilityClock(dispatch: (action: SessionAction) => void): void {
  useInterval(() => dispatch({ type: 'tick', ms: TICK_MS }), TICK_MS, { autoInvoke: true });
}
```

`src/ui/incident/inspection-box.tsx`:

```tsx
import type { Inspection } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

export function InspectionBox({ inspection }: { inspection: Inspection }) {
  return (
    <section className="card inspection" aria-labelledby="inspection-title">
      <h2 id="inspection-title">
        <TaggedText text={inspection.title} />
      </h2>
      <dl>
        {inspection.fields.map((field) => (
          <div key={field.label}>
            <dt>
              <TaggedText text={field.label} />
            </dt>
            {field.lines.map((line) => (
              <dd key={line}>
                <TaggedText text={line} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}
```

`src/ui/incident/explanation-card.tsx`:

```tsx
import { EXPLANATION_TEXT } from '@/copy';
import type { ExplanationOption } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface ExplanationCardProps {
  options: ExplanationOption[];
  choice: number | null;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  const button = useFocusOnMount<HTMLButtonElement>();
  return (
    <button ref={button} type="button" className="btn btn--primary" onClick={onContinue}>
      {EXPLANATION_TEXT.seeResult}
    </button>
  );
}

export function ExplanationCard({ options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section className="card explanation" aria-labelledby="explanation-title">
      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        {EXPLANATION_TEXT.asks}
      </h2>
      <ol className="options">
        {options.map((option, index) => (
          <li key={option.text}>
            <button type="button" className="option" disabled={choice !== null} aria-pressed={choice === index} onClick={() => onChoose(index)}>
              <TaggedText text={option.text} />
            </button>
            {choice !== null && (index === choice || option.correct) && (
              <p className={option.correct ? 'feedback feedback--right' : 'feedback feedback--wrong'}>
                <strong>{option.correct ? EXPLANATION_TEXT.right : EXPLANATION_TEXT.wrong}</strong> <TaggedText text={option.feedback} />
              </p>
            )}
          </li>
        ))}
      </ol>
      {choice !== null && <ContinueButton onContinue={onContinue} />}
    </section>
  );
}
```

Al elegir, las opciones se desactivan y el foco pasa a «Ver resultado». Se muestra la retroalimentación de la elegida y, si fue incorrecta, también la de la correcta.

`src/ui/incident/result-card.tsx`:

```tsx
import { RESULT_TEXT, type TermText } from '@/copy';
import { countStars, type Stars as EarnedStars } from '@/game';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

const STAR_KEYS = ['closed', 'tight', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

export function ResultCard({ stars, takeaway, nextId }: { stars: EarnedStars; takeaway: TermText; nextId: string | null }) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section className="card result" aria-labelledby="result-title">
      <h2 id="result-title" ref={heading} tabIndex={-1}>
        {RESULT_TEXT.title}
      </h2>
      <Stars count={countStars(stars)} />
      <ul className="result__list">
        {STAR_KEYS.map((key) => (
          <li key={key}>
            <span aria-hidden="true">{stars[key] ? '★ ' : '☆ '}</span>
            {RESULT_TEXT.stars[key]}
            <span className="sr-only"> ({stars[key] ? RESULT_TEXT.earned : RESULT_TEXT.missed})</span>
          </li>
        ))}
      </ul>
      <h3>{RESULT_TEXT.takeaway}</h3>
      <p>
        <TaggedText text={takeaway} />
      </p>
      <nav className="result__nav">
        {nextId !== null && (
          <a className="btn btn--primary" href={`#/level/${nextId}`}>
            {RESULT_TEXT.next}
          </a>
        )}
        <a className="btn" href="#/">
          {RESULT_TEXT.back}
        </a>
      </nav>
    </section>
  );
}
```

- [ ] **Step 5: La pantalla del incidente**

`src/ui/incident/incident-screen.tsx`:

```tsx
import { useReducedMotion } from '@mantine/hooks';
import { useReducer, useState } from 'react';
import { SCREEN_TEXT } from '@/copy';
import { barrierCard, countStars, inspect, intrudedServerIds, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
import type { Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { ExplanationCard } from './explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './lucia-card';
import { ResultCard } from './result-card';
import { TaskCard } from './task-card';
import { useStabilityClock } from './use-stability-clock';

interface IncidentScreenProps {
  incidents: Incident[];
  incidentId: string;
  nextId: string | null;
  onFinish: (stars: number) => void;
}

export function IncidentScreen({ incidents, incidentId, nextId, onFinish }: IncidentScreenProps) {
  const [session, dispatch] = useReducer(sessionReducer, incidentId, (id) => startSession(incidents, id));
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [cardPieceId, setCardPieceId] = useState<string | null>(null);
  const prefersStill = useReducedMotion(false, { getInitialValueInEffect: false });
  const [stillChoice, setStillChoice] = useState<boolean | null>(null);
  useStabilityClock(dispatch);

  const still = stillChoice ?? prefersStill;
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const card = playing && cardPieceId ? barrierCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;

  const activate = (pieceId: string) => {
    if (playing && pieces.some((piece) => piece.id === pieceId && piece.configurable)) setCardPieceId(pieceId);
  };
  const closeCard = () => {
    if (cardPieceId) document.getElementById(pieceDomId(cardPieceId))?.focus();
    setCardPieceId(null);
  };
  const showResult = () => {
    dispatch({ type: 'showResult' });
    onFinish(countStars(starsOf(session)));
  };

  return (
    <main className="incident">
      <div className="incident__map">
        <header className="incident__bar">
          <a href="#/">{SCREEN_TEXT.back}</a>
          <h1>{session.incident.title}</h1>
          <label className="incident__motion">
            <input type="checkbox" checked={still} onChange={(event) => setStillChoice(event.target.checked)} /> {SCREEN_TEXT.motion}
          </label>
        </header>
        <GameScene
          world={session.world}
          pieces={pieces}
          flows={session.runs}
          intrudedServerIds={intrudedServerIds(session.runs)}
          still={still}
          activePieceId={card ? cardPieceId : null}
          overlay={
            card && (
              <TaskCard
                card={card}
                chips={session.incident.chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', sgId: card.sgId, whatId, fromId })}
                onRemove={(ruleId) => dispatch({ type: 'removeRule', sgId: card.sgId, ruleId })}
                onClose={closeCard}
              />
            )
          }
          onInspect={setInspecting}
          onActivate={activate}
        />
      </div>
      <aside className="incident__side">
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} />
        {session.phase === 'explaining' && (
          <ExplanationCard options={session.incident.explanation} choice={session.choice} onChoose={(index) => dispatch({ type: 'chooseExplanation', index })} onContinue={showResult} />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} takeaway={session.incident.takeaway} nextId={nextId} />}
        <div aria-live="polite">{inspection ? <InspectionBox inspection={inspection} /> : <p className="muted">{SCREEN_TEXT.inspectHelp}</p>}</div>
      </aside>
    </main>
  );
}
```

- [ ] **Step 6: Rutas: aviso, bloqueo e incidente**

```bash
git rm src/ui/not-found.tsx
```

`src/ui/notice-page.tsx`:

```tsx
import { NOTICE_TEXT } from '@/copy';

export function NoticePage({ title, body }: { title: string; body: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{body}</p>
      <a href="#/">{NOTICE_TEXT.back}</a>
    </main>
  );
}
```

`src/ui/incident-page.tsx`:

```tsx
import { NOTICE_TEXT } from '@/copy';
import type { Incident } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';
import { IncidentScreen } from './incident/incident-screen';
import { NoticePage } from './notice-page';

interface IncidentPageProps {
  incidents: Incident[];
  levelId: string;
  progress: Progress;
  onFinish: (levelId: string, stars: number) => void;
}

/** Opens an incident from its URL: a notice when it does not exist or is still locked, the incident screen otherwise. */
export function IncidentPage({ incidents, levelId, progress, onFinish }: IncidentPageProps) {
  const incident = incidents.find((candidate) => candidate.id === levelId);
  if (!incident) return <NoticePage title={NOTICE_TEXT.notFound.title} body={NOTICE_TEXT.notFound.body(levelId)} />;
  if (!isUnlocked(incident, progress, incidents)) return <NoticePage title={NOTICE_TEXT.locked.title} body={NOTICE_TEXT.locked.body(levelId)} />;
  const next = incidents.at(incidents.indexOf(incident) + 1);
  return <IncidentScreen key={incident.id} incidents={incidents} incidentId={incident.id} nextId={next?.id ?? null} onFinish={(stars) => onFinish(incident.id, stars)} />;
}
```

El `key` vuelve a montar la pantalla al pasar al siguiente incidente: sesión, tarjeta e inspección empiezan de cero (Review Focus 5).

`src/ui/index.ts`:

```ts
export { IncidentPage } from './incident-page';
export { Roadmap } from './roadmap';
```

`src/app.tsx` (reemplazar entero):

```tsx
import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { INCIDENTS } from '@/levels';
import { loadProgress, saveStars } from '@/storage';
import { IncidentPage, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress, setProgress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  if (levelId === undefined) return <Roadmap levels={INCIDENTS} progress={progress} />;
  return <IncidentPage incidents={INCIDENTS} levelId={levelId} progress={progress} onFinish={(id, stars) => setProgress(saveStars(progress, id, stars))} />;
}
```

En `tests/e2e/roadmap.spec.ts`, el test `'an old level link leads back to the roadmap'` pasa a `'an unknown incident leads back to the roadmap'`: abre `/#/level/09-99` y espera el título `'Incidente no encontrado'`.

- [ ] **Step 7: Estilos de la pantalla**

Al final de `src/styles.css`:

```css
.incident { display: grid; grid-template-columns: minmax(0, 1fr) 380px; height: 100vh; }
.incident__map { position: relative; min-height: 0; }
.incident__bar { position: absolute; inset: 0 0 auto 0; z-index: 40; display: flex; align-items: baseline; gap: 1rem; padding: 0.8rem 1rem; pointer-events: none; }
.incident__bar > * { pointer-events: auto; }
.incident__bar h1 { font-size: 1.5rem; margin: 0; }
.incident__motion { margin-left: auto; font-size: 0.9rem; }
.incident__side { display: grid; align-content: start; gap: 1rem; padding: 1rem; overflow-y: auto; background: var(--paper); border-left: 1.5px solid var(--ink); }
.inspection dl { margin: 0; }
.inspection dt { margin-top: 0.5rem; font: 600 0.75rem var(--font-body); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); }
.inspection dd { margin: 0; }
.explanation h2:focus-visible, .result h2:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.options { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.option { width: 100%; text-align: left; font: 0.95rem/1.4 var(--font-body); color: var(--ink); background: var(--paper); border: 1.5px solid var(--ink); padding: 0.5rem 0.7rem; cursor: pointer; }
.option[aria-pressed='true'] { background: var(--paper-shade); }
.option:disabled { cursor: default; }
.feedback { margin: 0.3rem 0 0; font-size: 0.9rem; }
.feedback--wrong { color: var(--accent); }
.result__list { list-style: none; padding: 0; }
.result__nav { display: flex; gap: 0.6rem; flex-wrap: wrap; }
@media (max-width: 900px) {
  .incident { grid-template-columns: 1fr; grid-template-rows: 65vh auto; height: auto; }
  .incident__side { border-left: none; border-top: 1.5px solid var(--ink); }
}
```

- [ ] **Step 8: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src tests/e2e/roadmap.spec.ts
git commit -m "feat(ui): play an incident from the roadmap to the result"
```

---

### Task 16: De punta a punta con Playwright

**Files:**
- Create: `tests/e2e/console-errors.ts`, `tests/e2e/incidents.spec.ts`
- Modify: `tests/e2e/roadmap.spec.ts` (usa el ayudante compartido)
- Modify, solo si la prueba de superposición falla: las constantes `LABEL`, `ACTOR_GAP` y `STAMP_SPREAD` de `src/scene/layout.ts`, y el desplazamiento de `.map-card--left/right` en `src/styles.css`

**Interfaces:**
- Consumes: la app entera.
- Produces: `collectErrors(page: Page): string[]` en `tests/e2e/console-errors.ts`.

- [ ] **Step 1: Ayudante compartido de errores de consola**

`tests/e2e/console-errors.ts` (sale de `roadmap.spec.ts`; dos copias harían saltar jscpd):

```ts
import type { Page } from '@playwright/test';

const FONT_LOAD_ERROR = /Failed to load resource/;

/** Collects page errors and console errors, leaving out font downloads that fail without network. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !FONT_LOAD_ERROR.test(message.text())) errors.push(message.text());
  });
  return errors;
}
```

En `tests/e2e/roadmap.spec.ts`: borrar `FONT_LOAD_ERROR` y `collectErrors` locales e importar `import { collectErrors } from './console-errors';`.

- [ ] **Step 2: Escribir las pruebas**

`tests/e2e/incidents.spec.ts`:

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const DOOR = 'puerta de servidor2';
const FULL_STARS = '3 de 3 estrellas';
const CLOSE_TIMEOUT_MS = 15_000;

interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes: Box[] = await page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}

async function openDoor(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: DOOR, exact: true }).click();
  return page.getByRole('dialog', { name: DOOR });
}

async function explainAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: answer }).click({ timeout: CLOSE_TIMEOUT_MS });
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

async function playBoth(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  const first = await openDoor(page);
  await first.getByRole('button', { name: 'Ping', exact: true }).click();
  await first.getByRole('button', { name: 'servidor1', exact: true }).click();
  await first.getByRole('button', { name: 'Listo' }).click();
  await explainAndFinish(page, /no había ninguna para el ping de servidor1/);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abre lo justo' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'vuelva a hacer' })).toContainText('pendiente');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await openDoor(page);
  await second.getByRole('button', { name: /^Quitar la regla Echo Reply/ }).click();
  await second.getByRole('button', { name: 'Echo Request (ida)', exact: true }).click();
  await second.getByRole('button', { name: 'servidor1', exact: true }).click();
  await second.getByRole('button', { name: 'Listo' }).click();
  await explainAndFinish(page, /solo hace falta permitir la ida/);
}

test('04-01 and 04-02 reach 3 stars, and the progress survives a reload', async ({ page }) => {
  const errors = collectErrors(page);
  await playBoth(page);
  await page.goto('/#/');
  await page.reload();
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(FULL_STARS);
  await expect(page.locator('li[data-level-id="04-02"]')).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('starts checked from the system preference, and both incidents still reach 3 stars', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/#/level/04-01');
    await expect(page.getByLabel('Sin animaciones')).toBeChecked();
    await playBoth(page);
    expect(errors).toEqual([]);
  });
});

test('a locked incident does not open from its URL', async ({ page }) => {
  await page.goto('/#/level/04-02');
  await expect(page.getByRole('heading', { name: 'Incidente bloqueado' })).toBeVisible();
});

test('labels and stamps do not overlap, and the open card does not cover its door', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('button', { name: DOOR, exact: true })).toBeVisible();
  await expect.poll(() => overlappingPairs(page)).toEqual([]);
  const card = await openDoor(page);
  const label = page.getByRole('button', { name: DOOR, exact: true });
  await expect.poll(async () => overlaps(await card.boundingBox(), await label.boundingBox())).toBe(false);
});
```

- [ ] **Step 3: Correrlas**

Run: `npm run e2e`
Expected: PASS.

Si falla la prueba de superposición, el mensaje lista los pares que se tocan (por ejemplo `puerta de servidor2 / Paquete: ping de Atacante a servidor2`). Ajustar solo las constantes de posición de `src/scene/layout.ts` (y, para la tarjeta, el desplazamiento de `.map-card--left/right`), volver a correr `npx vitest run src/scene` y `npm run e2e`, y anotar los valores finales en el mensaje del commit. Si tras tres intentos sigue fallando, parar y mostrar la captura de `test-results/` al estudiante.

- [ ] **Step 4: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests src/scene/layout.ts src/styles.css
git commit -m "test(e2e): play 04-01 and 04-02 to three stars"
```

---

### Task 17: Documentación al día

**Files:**
- Modify: `src/CLAUDE.md`, `src/copy/CLAUDE.md`, `src/levels/CLAUDE.md`, `src/scene/CLAUDE.md`, `src/storage/CLAUDE.md`, `src/ui/CLAUDE.md`, `tests/e2e/CLAUDE.md`, `README.md`
- Modify: `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md` (línea de estado), `docs/plans/2026-10-08-follow-the-packet-followups.md` (línea de estado)

- [ ] **Step 1: Guías de las carpetas que cambiaron**

`src/CLAUDE.md`: quitar "`game` arrives with the incidents." y dejar la línea de capas igual.

`src/copy/CLAUDE.md`:

```markdown
# copy

Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap and notice screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{rule|reglas}}` shows other words. An unknown tag throws.
- Not here: logic that decides outcomes (`src/engine/`), incident content (`src/levels/`).
- Text follows `.claude/rules/plain-language-copy.md`.
- May import: `@/engine`.
```

`src/levels/CLAUDE.md`:

```markdown
# levels

The course chapters (`chapters.ts`), the incident contract (`incident.ts`), the registry that loads incident files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`, the chips that name rules (`chips.ts`), the world chain (`world.ts`) and the term ladder (`ladder.ts`).

- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
```

`src/scene/CLAUDE.md`:

```markdown
# scene

The isometric paper-and-ink map drawn with React Three Fiber: layout, pieces, labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`).

- Draws what the game computed: piece labels, locks and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
```

`src/storage/CLAUDE.md`: "Progress kept in the browser: best stars per incident, and incidents and chapters that open in course order."

`src/ui/CLAUDE.md`:

```markdown
# ui

Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), plus shared pieces (`stars.tsx`, `tagged-text.tsx`).

- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
```

`tests/e2e/CLAUDE.md`: sumar "Shared helpers (`console-errors.ts`) are plain modules next to the specs."

- [ ] **Step 2: README del proyecto**

En `README.md`, la segunda línea de enlaces pasa a:

```markdown
Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md)
```

y la primera frase termina en "…chapter 4 is being rebuilt as live incidents based on [lab 03](https://github.com/angelozdev/aws-commit-academy/blob/main/labs/03-ping-connectivity/README.md); incidents 04-01 and 04-02 are playable."

- [ ] **Step 3: Estado en el spec y en el backlog**

En el spec, la línea de estado pasa a: `Fecha: 2026-10-08 · Estado: prototipo 04-01 y 04-02 construido (plan 2); falta la prueba humana`.

En el backlog, debajo del estado del plan 1, agregar:

```markdown
> **Estado (plan 2, `docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md`):** hechos A6 (escena centrada, etiquetas sin superponerse, con prueba de Playwright), A8 (desbloqueo en orden), A13 (foco de la tarjeta de tarea), B4 (la inspección llega calculada desde `game`) y B7 (textos de los motivos en lenguaje sencillo). A5 lo reemplaza el tráfico vivo. Siguen pendientes A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.
```

- [ ] **Step 4: Chequeo de links del repo y check final**

Desde la raíz del repo, correr el chequeo de links de `CLAUDE.md` (sección "Chequeo de links").
Expected: `LINKS OK`.

Run (en `projects/follow-the-packet/`): `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests README.md ../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md
git commit -m "docs: describe the live incidents prototype"
```

---

## Después del plan

- **Prueba humana** (spec, "Tests y validación" 9): el estudiante juega 04-01 y 04-02 con `npm run dev` y dice qué no lo engancha. Esa prueba decide si se construyen 04-03 a 04-08 con esta mecánica; lo que salga se anota en el backlog antes de escribir el plan siguiente.
- **Lo que ningún test cubre:** que la tarjeta abierta no tape el camino principal (solo se comprueba que no tapa su puerta). Se mira en la prueba humana.
