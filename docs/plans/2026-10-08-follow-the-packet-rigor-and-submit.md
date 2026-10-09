# Sigue el paquete · Plan 3: nombres oficiales, definiciones al pasar el mouse y «Enviar solución»

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar al prototipo 04-01 y 04-02 los dos cambios que pidió la primera prueba humana: todo se llama por su nombre oficial de AWS y muestra su definición al pasar el mouse, y el incidente se cierra con un botón «Enviar solución» en vez de la barra de 3 segundos.

**Architecture:**
1. `copy` cambia el registro de términos: nombres oficiales, definiciones rigurosas, el término `anywhere-ipv4` y una forma corta registrada (`SG`). Suma `unofficialNames`, que detecta un término mostrado con otras palabras.
2. `levels` reescribe los textos y las fichas de los dos incidentes. La escalera deja de esconder nombres: el Internet gateway se llama así desde el 04-01.
3. `game` declara el término de cada clase de pieza, pone «Qué es» primero en la inspección y cambia el reloj de estabilidad por la acción `submit` y la respuesta de Lucía (`rejection`).
4. `ui` dibuja cada término con su definición en un cuadrito portado a `document.body` y posicionado con `@floating-ui/react-dom`. La tarjeta de Lucía suma el botón, la respuesta, las tareas al instante y el glosario plegado.

**Tech Stack:** Vite 8, TypeScript 6.0.3, React 19.3, React Three Fiber 9, drei 10, three 0.186, zod 4, `@mantine/hooks` 9.7.1, `just-compare` 2.3.0, Vitest 5, Testing Library + user-event, Playwright 1.64. Dependencia nueva: `@floating-ui/react-dom` 2.1.9.

**Spec:** `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`. Lo que manda está en "Cambios tras la primera prueba (2026-10-08)", "El incidente, paso a paso" (pasos 3, 4 y 6), "Escalera de términos" (con la tabla «antes → nombre oficial»), la tabla del capítulo 4, "Prototipo", "Escena y arte", "Arquitectura" y "Tests y validación". Backlog: `docs/plans/2026-10-08-follow-the-packet-followups.md`, bloque E (este plan hace E2 y E3). Plan anterior, ya implementado: `docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md`. Donde el código y el plan 2 difieren, manda el código.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` (raíz del repo).
- **Rama.** `feat/live-incidents`. No se crea otra.
- **Punto de partida verificado (2026-10-08):** `npx vitest run` pasa entero, con 371 tests en 39 archivos.
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Desde la Tarea 1, `rigorous-plain-copy` reemplaza a `plain-language-copy`. Las que más pesan aquí:
  - `folder-structure`: capas `app → ui → game · scene · storage → levels → copy → engine`, barrels, alias `@/` y nada de `../`. Tope de 12 archivos por carpeta (sin contar `CLAUDE.md`).
  - `view-renders-domain-result`: `scene/` y `ui/` solo importan tipos de `@/engine`. Lo que muestran sale de la sesión de `game`.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. Texto visible en español solo en `src/copy/` y en los archivos de incidente.
  - `no-raw-effects`: efectos solo en archivos `use-*.ts`. Los hooks de librería (`useFloating`) se llaman directo.
  - `user-event-for-interactions`: `const user = userEvent.setup()` en cada test y `await` en cada interacción.
  - `dry`: jscpd con umbral 0 (`npm run dup`). Lo que se repite en tests va a un helper.
- **Nombres oficiales** (spec, tabla «antes → nombre oficial»):

  | Antes (plan 2) | Nombre oficial |
  |----------------|----------------|
  | puerta | Security Group |
  | servidor | instancia EC2 (la etiqueta del mapa es su nombre, `servidor2`) |
  | red privada (VPC) | VPC |
  | regla | regla de entrada (*Inbound rule* en la consola) |
  | entrada desde internet | Internet gateway |
  | ficha «Ping» | ICMP · Echo Request |
  | ficha «Todo internet» | Anywhere-IPv4 (0.0.0.0/0) |
  | ficha «servidor1» | SG servidor1 (el origen es el Security Group de servidor1) |
  | ficha «Ping completo (todo ICMP)» | All ICMP - IPv4 |
  | Linux ignora el ping | `icmp_echo_ignore_all` |
  | bandejas «Qué» y «Desde dónde» | «Type» y «Source» |

- **Escalera.** Ningún texto, pieza, campo de inspección ni ficha usa un término antes del incidente que lo introduce. Todo texto que usa un término lo marca con `{{term-id}}` o `{{term-id|palabras}}`. En piezas y fichas, las palabras de un término son su nombre oficial o su forma corta registrada (`SG`), nada más.
- **Fuentes de los nombres (consultadas el 2026-10-08):**
  - *Security group:* «The security group acts as a virtual firewall. The only traffic that reaches the instance is the traffic allowed by the security group rules.» <https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html>
  - *Anywhere-IPv4:* «Anywhere-IPv4 – The 0.0.0.0/0 IPv4 CIDR block.» <https://docs.aws.amazon.com/vpc/latest/userguide/working-with-security-group-rules.html>
  - *Rules for ping/ICMP:* types «Custom ICMP - IPv4» (Protocol «Echo request») y «All ICMP - IPv4». <https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html>
  - *Internet gateway:* «a horizontally scaled, redundant, and highly available VPC component that allows communication between your VPC and the internet», que además hace el NAT uno a uno de la IP pública. <https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html>
- **Dependencia nueva permitida:** solo `@floating-ui/react-dom@2.1.9`, para posicionar el cuadrito de cada término. Comprobado con `npm view` y la API de descargas de npm el 2026-10-08:
  - 2.1.9 se publicó el 2026-07-11 y la anterior, 2.1.8, el 2026-03-03.
  - `peerDependencies`: `react >=16.8.0` y `react-dom >=16.8.0`. Trae tipos propios (`dist/floating-ui.react-dom.d.ts`).
  - Trae `@floating-ui/dom` 1.8.0, `@floating-ui/core` 1.8.0 y `@floating-ui/utils` 0.2.12. Ninguno tiene script de instalación.
  - 108 702 207 descargas en la semana del 2026-09-28 al 2026-10-04.
  - No se superpone con nada instalado: `@mantine/hooks` no posiciona elementos y `Html` de drei ancla HTML a puntos 3D, no a otro elemento del DOM.

  Se instala con `npm install @floating-ui/react-dom@2.1.9` en la Tarea 6, junto con su primer uso.
- **"Listo"** = `npm run check` pasa entero. Cada tarea termina con `npm run check` en verde.
- **Commits.** Los pasos "Commit" se ejecutan solo si el estudiante aprobó commits por tarea al empezar la ejecución. Si no, se omiten. Nunca se agregan `pnpm-lock.yaml` ni `pnpm-workspace.yaml` (E10).
- **Fuera de este plan:** E4 a E10 del backlog: la posición de la tarjeta, los sellos que se tocan, el «!» que tapa la etiqueta, el candado del atacante, las pantallas bajas y los menores de E9 (las estrellas se siguen guardando al pulsar «Ver resultado»).
- Ningún comando `aws`. No se toca el almacén personal de reglas (`~/dotfiles`, `~/.claude/skills/az-rules/rules/`).

## Desviaciones del spec (para revisar antes de ejecutar)

1. **«SG servidor1».** El spec pide esa ficha y «nombre oficial siempre». El término `security-group` registra la forma corta `SG` (`short: 'SG'`), y es la única alternativa que aceptan piezas y fichas.
2. **El atacante no tiene «Qué es».** No es un término de AWS. Su primer campo sigue siendo «Quién es» (spec, paso 3: «actor: quién es e IP»).
3. **Las etiquetas del mapa no tienen cuadrito.** Son botones: al pasar el mouse muestran el cuadro de inspección, con «Qué es» primero (spec, paso 3).
4. **Los ids de término cambian con el nombre:** `server` → `ec2-instance`, `rule` → `inbound-rule`, `linux-ignore-ping` → `icmp-echo-ignore-all`. Es interno: el jugador ve los nombres.
5. **`az-rules.json`.** La regla nueva es local. Según el formato del skill `az-rules`, una regla solo local no entra en `rules`. `plain-language-copy` pasa a `declined`, con el motivo y el nombre de la regla que la reemplaza, para que `/az-rules update` no la vuelva a ofrecer.
6. **El Internet gateway conserva «Qué hace»** además de «Qué es», porque el spec lo pide en el paso 3.

## Preguntas abiertas (responder antes de la tarea indicada)

Cada una cambia lo que ve el jugador. El plan trae escrita la opción por defecto. Si el estudiante elige otra, se ajusta la tarea antes de ejecutarla.

1. **(Tarea 5) «Qué es» de un paquete.** El plan muestra la definición de su mensaje ICMP: Echo Request para el ping de ida, porque es lo que viaja. Alternativa: la definición de «ping», que coincide con la etiqueta «ping de servidor1 a servidor2».
2. **(Tarea 3) «All ICMP - IPv4».** La tabla del capítulo no lo lista como término nuevo del 04-02. El plan escribe la ficha `All {{icmp}} - IPv4`, y el cuadrito sale solo sobre «ICMP». Alternativa: un término `all-icmp-ipv4` que introduce el 04-02.
3. **(Tarea 3) Bandejas «Type» y «Source».** El plan las deja como texto simple, sin cuadrito: las explica la definición de «regla de entrada». Alternativa: dos términos más.
4. **(Tarea 6) Términos dentro del cuadro de inspección.** El spec dice que el cuadro «no toma el mouse», y además se va al salir de la pieza. El plan los dibuja en negrita, sin subrayado ni cuadrito, y deja que su «Qué es» dé la definición. Choca con «cada término de los textos va subrayado».
5. **(Tarea 7) Orden del glosario.** El plan lo ordena alfabéticamente (`localeCompare` en español). Alternativa: el orden de la escalera.
6. **(Tarea 9) Texto de la respuesta a «Enviar solución».** El spec no da las palabras. El plan escribe una línea por tarea que falla, «Todavía no se cumple: «<tarea>»», y suma «Además, algo prohibido está entrando.» si es el caso.

## Review Focus

1. **Enviar dos veces seguidas sin cambiar nada:** Lucía responde otra vez. El mensaje se vuelve a montar y se anuncia; no queda mudo. Tests: Tarea 8 (`attempt`) y Tarea 9 (nodo nuevo en la tarjeta).
2. **Enviar con todo cumplido y la tarjeta de tarea abierta:** la tarjeta se va y el foco cae en la pregunta de Lucía, no en `body`. Tests: Tarea 9 (pantalla y Playwright).
3. **Un movimiento que no cambia el mundo** (poner la misma regla otra vez) no borra la respuesta de Lucía. Quitar o poner una regla de verdad sí la borra. Test: Tarea 8.
4. **Un término dentro de la tarjeta de tarea** (capa HTML con `overflow: hidden`) **o pegado al borde de la ventana:** el cuadrito se ve entero, sin cortes. Tests: Tarea 6 (portal en `document.body`, unitario y Playwright).
5. **El glosario de un incidente no muestra términos de incidentes posteriores:** la escalera también manda ahí. Test: Tarea 7.

## Árbol al terminar (solo lo nuevo o cambiado)

```
.claude/rules/rigorous-plain-copy.md (nuevo; se borra plain-language-copy.md)  .claude/rules/prefer-established-libraries.md  .claude/az-rules.json
package.json  package-lock.json  README.md
src/styles.css
src/copy/        CLAUDE.md terms.ts terms.test.ts term-text.ts term-text.test.ts reasons.ts reasons.test.ts incident-ui.ts index.ts
src/levels/      ladder.ts ladder.test.ts world.test.ts
│   └── 04-iaas/ CLAUDE.md shared.ts 01-the-first-ping.ts 02-open-just-enough.ts
src/game/        CLAUDE.md index.ts session.ts session.test.ts tasks.ts tasks.test.ts stars.test.ts incidents.test.ts
│   └── view/    CLAUDE.md pieces.ts pieces.test.ts inspection.ts inspection.test.ts ladder.test.ts
src/scene/overlay/piece-label.test.tsx
src/ui/          CLAUDE.md tagged-text.tsx tagged-text.test.tsx term-tip.tsx (nuevo)
│   └── incident/ CLAUDE.md lucia-card.tsx lucia-card.test.tsx task-card.tsx task-card.test.tsx inspection-box.tsx
│                 incident-screen.tsx incident-screen.test.tsx
tests/e2e/incidents.spec.ts
```

Se borra `src/ui/incident/use-stability-clock.ts`. Topes: `src/ui/` queda en 9 archivos y `src/ui/incident/` en 10.

---

### Task 1: La regla `rigorous-plain-copy`

La regla manda sobre los textos de todas las tareas siguientes, por eso va primero. Su línea "Enforcement" llega en la Tarea 4, cuando existen los tests que la hacen cumplir.

**Files:**
- Create: `.claude/rules/rigorous-plain-copy.md`
- Delete: `.claude/rules/plain-language-copy.md`
- Modify: `.claude/az-rules.json`, `src/copy/CLAUDE.md`

**Interfaces:**
- Consumes: nada.
- Produces: la regla `rigorous-plain-copy`, que las guías citan como `.claude/rules/rigorous-plain-copy.md`.

- [ ] **Step 1: Comprobar el punto de partida**

```bash
npm run check
```

Expected: PASS. Si Playwright no encuentra Chromium, correr `npx playwright install chromium` y repetir. Si falla otra cosa, parar y avisar: el plan parte de una base en verde.

- [ ] **Step 2: Listar las referencias a la regla vieja**

```bash
grep -rn "plain-language-copy" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git
```

Expected: `.claude/az-rules.json` (dos líneas) y `src/copy/CLAUDE.md:7`. Ninguna otra regla la enlaza con `[[plain-language-copy]]` y el `README.md` no la nombra (comprobado el 2026-10-08).

- [ ] **Step 3: Reemplazar el archivo de la regla**

```bash
git mv .claude/rules/plain-language-copy.md .claude/rules/rigorous-plain-copy.md
```

Contenido completo de `.claude/rules/rigorous-plain-copy.md`:

````markdown
# Rigorous plain copy

Every AWS service, resource or setting the player reads is called by its official AWS name, exactly as the AWS console shows it in English, and every term is defined where it appears. What stays plain is the sentence around the name.

**Why:** the reader is a student who wants a cloud job, has no networking background and reads Spanish. A friendly stand-in ("puerta" for Security Group) is easier on day one, but it teaches a word that no console, document or interviewer uses. After the first playtest the student asked for the real name, with its definition on hover.

**How to apply:**

- Use the official AWS name, as the English console shows it: `Security Group`, `Internet gateway`, `Anywhere-IPv4`, `Echo Request`, `All ICMP - IPv4`. Never an invented synonym, and never a descriptive phrase in place of the name. Spanish goes around the name: "el Security Group de servidor2".
- Define every term where it appears. Tag it in the text (`{{security-group}}`) so its definition shows on hover, and keep it in Lucía's glossary for keyboard and screen-reader users. A definition is rigorous and short, at most 120 characters, and uses no term the player has not met yet.
- Keep the surrounding copy plain: one idea per screen, panel or message, and short sentences. Cut side notes the player does not need for the next action.
- An analogy may come after the name, never in its place: "Security Group: un firewall virtual de la instancia", never "la puerta".
- Visible text lives in `src/copy/` or in the level files, as [[english-only]] says, so editing copy never means editing logic.
````

- [ ] **Step 4: Anotar en el manifiesto que la regla se apartó del almacén**

En `.claude/az-rules.json`:

1. Borrar la entrada `"plain-language-copy"` de `rules`, entera (origen `frontend/plain-language-copy`, versión 1 y sus dos notas).
2. Cambiar `"declined": {}` por:

```json
  "declined": {
    "plain-language-copy": "replaced on 2026-10-08 by the local rule rigorous-plain-copy (.claude/rules/rigorous-plain-copy.md) after the first playtest: official AWS names as the English console shows them, each defined where it appears; the store version puts the plain word first. The local rule is not synced with the personal store."
  }
```

`rigorous-plain-copy` no entra en `rules`, porque es una regla solo local (ver "Desviaciones", punto 5).

- [ ] **Step 5: Actualizar la guía de `copy`**

En `src/copy/CLAUDE.md`, la línea

```markdown
- Text follows `.claude/rules/plain-language-copy.md`.
```

pasa a

```markdown
- Text follows `.claude/rules/rigorous-plain-copy.md`.
```

- [ ] **Step 6: Verificar**

```bash
grep -rn "plain-language-copy" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git | grep -v '"declined"' | grep -v 'az-rules.json'
node -e "const m=JSON.parse(require('fs').readFileSync('.claude/az-rules.json','utf8'));const k=Object.keys(m.rules);if(m.schema!==1||m.rules['plain-language-copy']||!m.declined['plain-language-copy']||k.join()!==[...k].sort().join())process.exit(1);console.log('manifest OK')"
npm run check
```

Expected: el `grep` no imprime nada, `manifest OK` y `npm run check` PASS.

- [ ] **Step 7: Commit**

```bash
git add .claude src/copy/CLAUDE.md
git commit -m "chore(rules): replace plain-language-copy with rigorous-plain-copy"
```

---

### Task 2: Registro, motivos y textos con nombres oficiales

**Files:**
- Modify (reescribir): `src/copy/terms.ts`, `src/copy/terms.test.ts`, `src/copy/reasons.ts`, `src/copy/incident-ui.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`, `src/levels/ladder.test.ts`, `src/ui/tagged-text.test.tsx`
- Modify: `src/copy/term-text.ts`, `src/copy/term-text.test.ts`, `src/copy/reasons.test.ts`, `src/copy/index.ts`, `src/levels/ladder.ts`, `src/game/view/inspection.ts`, `src/game/view/inspection.test.ts`, `src/ui/incident/task-card.tsx`, `src/ui/incident/task-card.test.tsx`, `src/ui/incident/lucia-card.test.tsx`, `src/ui/incident/incident-screen.test.tsx`, `src/scene/overlay/piece-label.test.tsx`, `tests/e2e/incidents.spec.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces:
  - `interface Term { name: string; short?: string; definition: string }`. Ids nuevos: `ec2-instance`, `inbound-rule`, `anywhere-ipv4`, `icmp-echo-ignore-all`. Se van `server`, `rule` y `linux-ignore-ping`.
  - `unofficialNames(texts: TermText[]): string[]` en `@/copy`. Devuelve `"<term-id>: <palabras>"` por cada término mostrado con palabras que no son ni su nombre ni su forma corta.
  - `MAP_TEXT.barrier(name)` = `{{security-group}} <name>` («Security Group servidor2»).
  - `INSPECTION_TEXT` cambia `doors` → `securityGroups`, `linuxPing`/`yes`/`no` → `echoIgnore`/`answersPing`/`ignoresPing`, e `inbound` pasa a «Reglas de entrada».
  - `TASK_CARD_TEXT.noRules` ahora es `TermText`.
  - `configurableParts` lee `inbound-rule` e `icmp-echo-ignore-all`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/copy/terms.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { TERMS, isTermId, type Term, type TermId } from './terms';

const MAX_DEFINITION_LENGTH = 120;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OFFICIAL_NAMES: [TermId, string][] = [
  ['ec2-instance', 'instancia EC2'],
  ['vpc', 'VPC'],
  ['security-group', 'Security Group'],
  ['inbound-rule', 'regla de entrada'],
  ['icmp', 'ICMP'],
  ['echo-request', 'Echo Request'],
  ['echo-reply', 'Echo Reply'],
  ['anywhere-ipv4', 'Anywhere-IPv4'],
  ['internet-gateway', 'Internet gateway'],
  ['icmp-echo-ignore-all', 'icmp_echo_ignore_all'],
];
const PLAN_2_IDS = ['server', 'rule', 'linux-ignore-ping'];

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

  it.each(OFFICIAL_NAMES)('%s is called «%s», its official name', (id, name) => {
    expect(TERMS[id].name).toBe(name);
  });

  it('drops the ids named after the plain words of plan 2', () => {
    expect(PLAN_2_IDS.filter(isTermId)).toEqual([]);
  });

  it('a Security Group is the virtual firewall of an instance, shortened SG', () => {
    const securityGroup: Term = TERMS['security-group'];
    expect(securityGroup.definition).toMatch(/^Un firewall virtual de una instancia EC2/);
    expect(securityGroup.short).toBe('SG');
  });

  it('only the Security Group has a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['security-group']);
  });
});
```

En `src/copy/term-text.test.ts`:

1. El import pasa a `import { parseTermText, termsIn, toPlainText, unofficialNames } from './term-text';`.
2. El test `'shows a tag with the name of its term'` se reemplaza por:

```ts
  it('shows a tag with the official name of its term', () => {
    expect(parseTermText('Mira el {{security-group}} de servidor2.')).toEqual([
      { kind: 'text', text: 'Mira el ' },
      { kind: 'term', id: 'security-group', text: 'Security Group' },
      { kind: 'text', text: ' de servidor2.' },
    ]);
  });
```

3. El test `'a tag can show its own words'` se reemplaza por:

```ts
  it('a tag can show its own words', () => {
    expect(parseTermText('{{inbound-rule|Reglas de entrada}}')).toEqual([{ kind: 'term', id: 'inbound-rule', text: 'Reglas de entrada' }]);
  });
```

4. El bloque `describe('termsIn and toPlainText', …)` se reemplaza por:

```ts
describe('termsIn and toPlainText', () => {
  const text = 'Un {{ping}} pasa si una {{inbound-rule}} del {{security-group}} lo permite.';

  it('lists the terms in order', () => {
    expect(termsIn(text)).toEqual(['ping', 'inbound-rule', 'security-group']);
  });

  it('reads the way the player sees it', () => {
    expect(toPlainText(text)).toBe('Un ping pasa si una regla de entrada del Security Group lo permite.');
  });
});

describe('unofficialNames', () => {
  it('accepts the official name and the registered short form', () => {
    expect(unofficialNames(['El {{security-group}} de servidor2', '{{security-group|SG}} servidor1', 'Sin términos'])).toEqual([]);
  });

  it('names each term shown with other words', () => {
    expect(unofficialNames(['La {{security-group|puerta}} de servidor2', '{{anywhere-ipv4|Todo internet}}'])).toEqual([
      'security-group: puerta',
      'anywhere-ipv4: Todo internet',
    ]);
  });
});
```

Las filas de `'rejects a malformed tag'` se quedan como están. Fallan por la forma de la etiqueta, no por el id `rule`.

En `src/copy/reasons.test.ts`:

1. `SG_IN_DROP` pasa a:

```ts
const SG_IN_DROP = 'Se queda en el {{security-group}} de servidor2: ninguna {{inbound-rule}} lo deja entrar.';
```

2. Cambian estas filas de `CASES` (las demás se quedan):

```ts
  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ninguna {{ec2-instance}} tiene la {{private-ip}} 172.31.99.9.'],
  [{ code: 'route-no-public-instance', ip: '52.0.0.1' }, 'Ninguna {{ec2-instance}} tiene la {{public-ip}} 52.0.0.1.'],
  [{ code: 'sg-out-pass', instanceId: 'servidor1' }, 'El {{security-group}} de servidor1 lo deja salir.'],
  [{ code: 'sg-out-drop', instanceId: 'servidor1' }, 'Se queda en el {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.'],
  [{ code: 'sg-in-pass', instanceId: 'servidor2' }, 'El {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'linux-ignores-echo', instanceId: 'servidor2' }, 'Llega, pero servidor2 tiene {{icmp-echo-ignore-all}} en 1 y no contesta.'],
  [{ code: 'reply-stateful', instanceId: 'servidor2' }, 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.'],
```

3. El último test pasa a:

```ts
  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
    const trace = simulate(NET, ping(inst('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });
```

`src/levels/ladder.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { TERMS, type TermId } from '@/copy';
import type { Incident } from './incident';
import { configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const ONLY_INBOUND = { inboundRules: true, outboundRules: false, linuxSettings: false };
const ALL_TERMS = Object.keys(TERMS) as TermId[];
const BY_INCIDENT = INCIDENTS.map((i): [string, Incident] => [i.id, i]);

describe('term ladder', () => {
  it('a term is introduced by one incident at most', () => {
    const introduced = INCIDENTS.flatMap((i) => i.introduces);
    expect(introduced.filter((term, index) => introduced.indexOf(term) !== index)).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s only uses terms introduced in it or before', (id, incident) => {
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, id))).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s defines its new terms without naming a term the player does not know yet', (id, incident) => {
    const known = knownTerms(INCIDENTS, id);
    const unknown = ALL_TERMS.filter((term) => !known.has(term));
    const leaks = incident.introduces.flatMap((term) =>
      unknown.filter((other) => TERMS[term].definition.includes(TERMS[other].name)).map((other) => `${term} → ${other}`),
    );
    expect(leaks).toEqual([]);
  });

  it('catches a text that uses a later term', () => {
    const early = { ...INCIDENTS[0], report: 'El {{security-group}} es {{stateful}}.' };
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
    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: true, outboundRules: true, linuxSettings: true });
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/copy src/levels/ladder.test.ts`
Expected: FAIL. `terms.test.ts` falla porque `security-group` todavía se llama «puerta» y faltan `ec2-instance` y `anywhere-ipv4`. `term-text.test.ts` falla porque `unofficialNames` no existe. `reasons.test.ts` y `ladder.test.ts` fallan con `unknown term: inbound-rule`, o con el texto viejo.

- [ ] **Step 3: Escribir el registro**

`src/copy/terms.ts` (reemplazar entero). Las definiciones de 04-03 en adelante también cambian, para que todo el registro siga la regla nueva:

```ts
export interface Term {
  name: string;
  short?: string;
  definition: string;
}

export const TERMS = {
  'ec2-instance': {
    name: 'instancia EC2',
    definition: 'Un servidor virtual en la nube de AWS (Amazon EC2), con su sistema operativo, sus IPs y sus Security Groups.',
  },
  vpc: { name: 'VPC', definition: 'Virtual Private Cloud: una red virtual aislada dentro de AWS, con su propio rango de IPs privadas.' },
  'private-ip': { name: 'IP privada', definition: 'La dirección IPv4 de una instancia dentro de su VPC. Desde internet no se llega a ella.' },
  ping: { name: 'ping', definition: 'Un comando que manda un ICMP Echo Request a una IP y espera la respuesta: prueba si hay camino de ida y vuelta.' },
  'security-group': {
    name: 'Security Group',
    short: 'SG',
    definition: 'Un firewall virtual de una instancia EC2: solo deja pasar el tráfico que permite una de sus reglas.',
  },
  'inbound-rule': {
    name: 'regla de entrada',
    definition: 'Inbound rule en la consola: un permiso del Security Group con Type (qué tráfico) y Source (su origen).',
  },
  icmp: { name: 'ICMP', definition: 'Internet Control Message Protocol: el protocolo de los mensajes de control entre máquinas, como los del ping.' },
  'echo-request': { name: 'Echo Request', definition: 'El mensaje ICMP de ida del ping (tipo 8): le pregunta al destino si responde.' },
  'anywhere-ipv4': {
    name: 'Anywhere-IPv4',
    definition: 'Un Source de la consola que equivale a 0.0.0.0/0: cualquier dirección IPv4, también las de internet.',
  },
  'internet-gateway': {
    name: 'Internet gateway',
    definition: 'El componente de la VPC que permite la comunicación entre la VPC e internet, en los dos sentidos.',
  },
  'echo-reply': { name: 'Echo Reply', definition: 'El mensaje ICMP de vuelta del ping (tipo 0): la respuesta del destino.' },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Dar solo los permisos necesarios para una tarea, y solo a quien los necesita.' },
  stateful: { name: 'stateful', definition: 'El Security Group recuerda cada conexión que deja pasar: su respuesta vuelve sin que se evalúen reglas.' },
  'outbound-rule': {
    name: 'regla de salida',
    definition: 'Outbound rule en la consola: un permiso del Security Group para el tráfico que sale, con Type y Destination.',
  },
  cidr: { name: 'CIDR', definition: 'Una notación para un rango de IPs, IP/número: /32 es una sola IP; /16, 65 536; 0.0.0.0/0, todas las IPv4.' },
  'vpc-range': { name: 'rango CIDR de la VPC', definition: 'El rango de IPs privadas de la VPC, escrito como un CIDR (por ejemplo 172.31.0.0/16).' },
  'public-ip': { name: 'IP pública', definition: 'La dirección IPv4 de una instancia que se alcanza desde internet.' },
  nat: {
    name: 'NAT',
    definition: 'Network Address Translation: al salir por el Internet gateway, la IP privada del remitente se cambia por su IP pública.',
  },
  dns: { name: 'DNS', definition: 'Domain Name System: el sistema que traduce un nombre a una IP.' },
  'public-dns-name': {
    name: 'nombre DNS público',
    definition: 'Public IPv4 DNS en la consola: el nombre público de la instancia. Desde dentro de la VPC resuelve a la IP privada.',
  },
  'private-dns-name': {
    name: 'nombre DNS privado',
    definition: 'Private IP DNS name en la consola: el nombre de la instancia que solo resuelve dentro de la VPC.',
  },
  tcpdump: { name: 'tcpdump', definition: 'Un programa de Linux que muestra los paquetes que pasan por la interfaz de red de la máquina.' },
  'icmp-echo-ignore-all': {
    name: 'icmp_echo_ignore_all',
    definition: 'Un ajuste del kernel de Linux: en 1, la instancia recibe el Echo Request pero no lo contesta.',
  },
  'default-sg': {
    name: 'Security Group default',
    definition: 'El Security Group que AWS crea con cada VPC: deja entrar solo el tráfico de lo que tiene ese mismo Security Group.',
  },
  'multiple-sgs': {
    name: 'varios Security Groups',
    definition: 'Una instancia puede tener varios Security Groups: sus reglas se suman y basta con que una permita el tráfico.',
  },
} as const satisfies Record<string, Term>;

export type TermId = keyof typeof TERMS;

export function isTermId(value: string): value is TermId {
  return Object.hasOwn(TERMS, value);
}
```

Todas las definiciones tienen 120 caracteres o menos (contadas el 2026-10-08; la más larga, la de NAT, tiene 119).

- [ ] **Step 4: Escribir `unofficialNames`**

En `src/copy/term-text.ts`:

1. El import pasa a `import { TERMS, isTermId, type Term, type TermId } from './terms';`.
2. Agregar al final:

```ts
/** Returns, as "term-id: words", every term the texts show with words other than its official name or its short form. */
export function unofficialNames(texts: TermText[]): string[] {
  return texts.flatMap((text) =>
    parseTermText(text).flatMap((segment) => {
      if (segment.kind === 'text') return [];
      const term: Term = TERMS[segment.id];
      return segment.text === term.name || segment.text === term.short ? [] : [`${segment.id}: ${segment.text}`];
    }),
  );
}
```

En `src/copy/index.ts`, la línea de `term-text` pasa a:

```ts
export { parseTermText, termsIn, toPlainText, unofficialNames } from './term-text';
```

- [ ] **Step 5: Reescribir los motivos**

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
      return `Ninguna {{ec2-instance}} tiene la {{private-ip}} ${reason.ip}.`;
    case 'route-private':
      return 'Viaja por dentro de la {{vpc}}.';
    case 'route-no-public-instance':
      return `Ninguna {{ec2-instance}} tiene la {{public-ip}} ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${instanceName(net, reason.instanceId)} no tiene {{public-ip}}: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el {{internet-gateway}} y su remitente cambia de ${reason.from} a ${reason.to}: eso es {{nat}}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el {{internet-gateway}}.';
    case 'sg-out-pass':
      return `El {{security-group}} de ${instanceName(net, reason.instanceId)} lo deja salir.`;
    case 'sg-out-drop':
      return `Se queda en el {{security-group}} de ${instanceName(net, reason.instanceId)}: ninguna {{outbound-rule}} lo deja salir.`;
    case 'sg-in-pass':
      return `El {{security-group}} de ${instanceName(net, reason.instanceId)} lo deja entrar.`;
    case 'sg-in-drop':
      return `Se queda en el {{security-group}} de ${instanceName(net, reason.instanceId)}: ninguna {{inbound-rule}} lo deja entrar.`;
    case 'linux-unsolicited-icmp':
      return `Llega un {{echo-reply}} que nadie pidió: ${instanceName(net, reason.instanceId)} no contesta.`;
    case 'linux-ignores-echo':
      return `Llega, pero ${instanceName(net, reason.instanceId)} tiene {{icmp-echo-ignore-all}} en 1 y no contesta.`;
    case 'linux-replies':
      return `${instanceName(net, reason.instanceId)} contesta.`;
    case 'linux-refused':
      return `Llega, pero ningún programa escucha en el puerto ${reason.port}: ${instanceName(net, reason.instanceId)} lo rechaza.`;
    case 'linux-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'linux-udp-no-service':
      return `Llega por UDP al puerto ${reason.port}, pero en este juego ningún programa UDP contesta.`;
    case 'reply-stateful':
      return 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.';
  }
}
```

- [ ] **Step 6: Reescribir los textos de la pantalla**

`src/copy/incident-ui.ts` (reemplazar entero). `gatewayPlain` se va en la Tarea 4; las bandejas, en la Tarea 3; `LUCIA_TEXT`, en las Tareas 7 y 9.

```ts
import type { Actor } from '@/engine';
import type { TermText } from './term-text';

export const MAP_TEXT = {
  barrier: (name: string): TermText => `{{security-group}} ${name}`,
  gateway: '{{internet-gateway}}',
  gatewayPlain: 'entrada desde internet',
  locked: 'con candado',
  packet: (label: string) => `Paquete: ${label}`,
} as const;

export const INSPECTION_TEXT = {
  privateIp: '{{private-ip}}',
  publicIp: '{{public-ip}}',
  dnsNames: 'Nombres {{dns}}',
  echoIgnore: '{{icmp-echo-ignore-all}}',
  answersPing: '0: contesta el {{ping}}',
  ignoresPing: '1: no contesta el {{ping}}',
  securityGroups: '{{security-group|Security Groups}}',
  inbound: '{{inbound-rule|Reglas de entrada}}',
  noRules: 'Ninguna: no deja entrar nada.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
  who: 'Quién es',
  ip: '{{public-ip}}',
  does: 'Qué hace',
  gatewayDoes: 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
  result: 'Resultado',
  stoppedAt: 'Dónde y por qué se detuvo',
  none: 'No tiene',
} as const;

export const ACTOR_ROLE_TEXT: Record<Actor['kind'], TermText> = {
  attacker: 'Alguien de internet que prueba si los {{security-group|Security Groups}} ajenos lo dejan entrar.',
  you: 'Tu computadora.',
};

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

export const TASK_CARD_TEXT = {
  noRules: 'No tiene {{inbound-rule|reglas de entrada}}: no deja entrar nada.',
  slot: 'Regla de entrada nueva',
  what: 'Qué',
  from: 'Desde dónde',
  done: 'Listo',
  remove: (rule: string) => `Quitar la regla ${rule}`,
  giveBack: (chip: string) => `Devolver ${chip} a su bandeja`,
} as const;

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

En `src/ui/incident/task-card.tsx`, el párrafo sin reglas dibuja sus términos:

```tsx
        <p className="muted">
          <TaggedText text={TASK_CARD_TEXT.noRules} />
        </p>
```

(reemplaza a `<p className="muted">{TASK_CARD_TEXT.noRules}</p>`).

- [ ] **Step 7: La escalera y la inspección con los ids nuevos**

En `src/levels/ladder.ts`, el cuerpo de `configurableParts` pasa a:

```ts
  return {
    inboundRules: known.has('inbound-rule'),
    outboundRules: known.has('outbound-rule'),
    linuxSettings: known.has('icmp-echo-ignore-all'),
  };
```

En `src/game/view/inspection.ts`:

1. En `server`, la constante `doors` pasa a llamarse `groups`.
2. La línea del ajuste de Linux pasa a:

```ts
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [instance.linux.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
```

3. La línea de los Security Groups pasa a:

```ts
        { term: 'security-group', label: INSPECTION_TEXT.securityGroups, lines: () => groups.map((group) => MAP_TEXT.barrier(group.name)) },
```

4. En `barrier`, `term: 'rule'` pasa a `term: 'inbound-rule'`.

- [ ] **Step 8: Los textos de los dos incidentes**

Las fichas siguen siendo las del plan 2 hasta la Tarea 3. Cambian los textos, que pasan a los del spec ("Prototipo"), y los términos introducidos. `internet-gateway` entra al 04-01 en la Tarea 4, junto con su etiqueta.

`src/levels/04-iaas/01-the-first-ping.ts` (reemplazar entero):

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
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'ping', 'security-group', 'inbound-rule', 'icmp', 'echo-request', 'anywhere-ipv4'],
  base: BASE_WORLD,
  report: 'servidor1 no logra hacer {{ping}} a servidor2. ¿Lo revisas?',
  tasks: [{ id: 'ping', text: 'Que servidor1 pueda hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.ping], from: [FROM.servidor1, FROM.internet] },
  hints: [
    'Mira el {{security-group}} de servidor2: ¿qué deja pasar hoy?',
    'En el {{security-group}} de servidor2, agrega una {{inbound-rule}}: {{icmp}} · {{echo-request}}, desde {{security-group|SG}} servidor1.',
  ],
  explanation: [
    {
      text: 'servidor2 estaba apagado.',
      feedback: 'No: servidor2 estaba encendido. El {{ping}} se quedaba en su {{security-group}}, antes de llegar.',
      correct: false,
    },
    {
      text: 'El {{security-group}} de servidor2 solo deja pasar lo que una {{inbound-rule}} permite, y no había ninguna para el {{ping}} de servidor1.',
      feedback: 'Eso es. Sin una {{inbound-rule}} que lo permita, el {{security-group}} no deja pasar nada.',
      correct: true,
    },
    {
      text: 'Faltaba una {{inbound-rule|regla}} que prohibiera al atacante.',
      feedback: 'Un {{security-group}} no tiene reglas para prohibir: lo que ninguna {{inbound-rule}} permite ya queda fuera.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id }],
  takeaway: 'El {{security-group}} de una {{ec2-instance}} solo deja pasar lo que una {{inbound-rule}} permite: Type + Source.',
});
```

`src/levels/04-iaas/02-open-just-enough.ts` (reemplazar entero):

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
  introduces: ['echo-reply', 'least-privilege'],
  changes: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: ruleIdFor(WHAT.ping.id, FROM.servidor1.id) },
    { type: 'addRule', sgId: SG.servidor2, rule: DAY_SHIFT_RULE },
  ],
  report: 'Alguien cambió el {{security-group}} de servidor2: dice que «abrió la respuesta del {{ping}}». Ahora el {{ping}} de servidor1 vuelve a fallar.',
  tasks: [{ id: 'ping', text: 'Que servidor1 vuelva a hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp], from: [FROM.servidor1, FROM.internet] },
  hints: [
    'Un {{ping}} tiene ida ({{echo-request}}) y vuelta ({{echo-reply}}). ¿Cuál de las dos entra a servidor2?',
    'En el {{security-group}} de servidor2: {{icmp}} · {{echo-request}} desde {{security-group|SG}} servidor1. Y quita la {{inbound-rule}} del turno de día.',
  ],
  explanation: [
    {
      text: 'Había que abrir la vuelta, porque es la que llega a servidor2.',
      feedback: 'No: lo que llega a servidor2 es la ida, el {{echo-request}}. Por eso la {{inbound-rule}} del turno de día no arreglaba nada.',
      correct: false,
    },
    {
      text: 'Abrir All {{icmp}} desde {{anywhere-ipv4}} es suficiente y no tiene riesgo.',
      feedback: 'Funciona, pero también deja entrar al atacante. Abrir más de lo necesario siempre es un riesgo.',
      correct: false,
    },
    {
      text: 'Un {{ping}} tiene ida ({{echo-request}}) y vuelta ({{echo-reply}}). Para entrar a servidor2 solo hace falta permitir la ida, y solo desde {{security-group|SG}} servidor1.',
      feedback: 'Eso es. Abrir solo lo que hace falta, y solo para quien lo necesita, se llama {{least-privilege}}.',
      correct: true,
    },
  ],
  solution: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id },
    { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.servidor1.id },
  ],
  takeaway: 'Para recibir un {{ping}} basta con dejar entrar la ida ({{echo-request}}), y solo desde quien la necesita: eso es {{least-privilege}}.',
});
```

- [ ] **Step 9: Correr los tests de `copy` y `levels`**

Run: `npx vitest run src/copy src/levels`
Expected: PASS.

- [ ] **Step 10: Actualizar lo que esperan los demás tests**

`src/ui/tagged-text.test.tsx` (reemplazar entero; la Tarea 6 lo vuelve a reescribir):

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its official name', () => {
    const { container } = render(<TaggedText text="Mira el {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira el Security Group de servidor2.');
    expect(screen.getByText('Security Group')).toHaveClass('term');
  });

  it('marks the new terms', () => {
    render(<TaggedText text="Una {{inbound-rule}} del {{security-group}}." newTerms={new Set<TermId>(['inbound-rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(LUCIA_TEXT.newBadge).closest('.term')).toHaveTextContent(/^regla de entrada nuevo$/);
  });
});
```

`src/game/view/inspection.test.ts`:

1. En `'a server shows its private IP and its door…'`, la fila `['Puerta', 'puerta de servidor2'],` pasa a `['Security Groups', 'Security Group servidor2'],`.
2. `expect(fields).toEqual(['IP privada', 'IP pública', 'Nombres DNS', 'Puerta']);` pasa a `expect(fields).toEqual(['IP privada', 'IP pública', 'Nombres DNS', 'Security Groups']);`.
3. `[['Deja entrar', 'Nada: no tiene reglas.']]` pasa a `[['Reglas de entrada', 'Ninguna: no deja entrar nada.']]`.
4. `['Deja entrar', 'Echo Reply (vuelta) ← Todo internet'],` pasa a `['Reglas de entrada', 'Echo Reply (vuelta) ← Todo internet'],`.
5. `'Se queda en la puerta de servidor2: ninguna regla lo deja entrar.'` pasa a `'Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.'`.
6. `[['Quién es', ACTOR_ROLE_TEXT.attacker]]` pasa a `[['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)]]`. `toPlainText` ya está importado.

`src/ui/incident/lucia-card.test.tsx`:

1. `TERMS.rule.definition` pasa a `TERMS['inbound-rule'].definition`.
2. `'Mira la puerta de servidor2: ¿qué deja pasar hoy?'` pasa a `'Mira el Security Group de servidor2: ¿qué deja pasar hoy?'`.
3. `'En la puerta de servidor2, agrega: Ping, desde servidor1.'` pasa a `'En el Security Group de servidor2, agrega una regla de entrada: ICMP · Echo Request, desde SG servidor1.'`.

`src/ui/incident/task-card.test.tsx`:

1. Agregar `toPlainText` al import de `@/copy`: `import { TASK_CARD_TEXT, toPlainText } from '@/copy';`.
2. `const DOOR = 'puerta de servidor2';` pasa a `const DOOR = 'Security Group servidor2';`.
3. `expect(screen.getByText(TASK_CARD_TEXT.noRules)).toBeInTheDocument();` pasa a `expect(screen.getByRole('dialog', { name: DOOR })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules));`.

`src/ui/incident/incident-screen.test.tsx`:

1. `const DOOR = 'puerta de servidor2';` pasa a `const DOOR = 'Security Group servidor2';`.
2. `const OTHER_DOOR = 'puerta de servidor1';` pasa a `const OTHER_DOOR = 'Security Group servidor1';`.
3. `'Se queda en la puerta de servidor2: ninguna regla lo deja entrar.'` pasa a `'Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.'`.

`src/scene/overlay/piece-label.test.tsx`:

1. `label: '{{security-group}} de servidor2'` pasa a `label: '{{security-group}} servidor2'`.
2. Las tres apariciones de `'puerta de servidor2'` pasan a `'Security Group servidor2'`.

`tests/e2e/incidents.spec.ts`: `const DOOR = 'puerta de servidor2';` pasa a `const DOOR = 'Security Group servidor2';`.

- [ ] **Step 11: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src tests
git commit -m "feat(copy): name every term by its official AWS name"
```

---

### Task 3: Fichas y bandejas con nombres oficiales

Ver "Preguntas abiertas", puntos 2 y 3, antes de empezar.

**Files:**
- Modify: `src/levels/04-iaas/shared.ts`, `src/levels/04-iaas/01-the-first-ping.ts`, `src/levels/04-iaas/02-open-just-enough.ts`, `src/copy/incident-ui.ts`, `src/levels/ladder.test.ts`
- Modify (solo nombres de constantes): `src/levels/world.test.ts`, `src/game/tasks.test.ts`, `src/game/stars.test.ts`, `src/game/incidents.test.ts`, `src/game/session.test.ts`, `src/game/view/inspection.test.ts`, `src/game/view/pieces.test.ts`, `src/ui/incident/lucia-card.test.tsx`
- Modify (reescribir): `src/ui/incident/task-card.test.tsx`
- Modify: `src/ui/incident/incident-screen.test.tsx`, `tests/e2e/incidents.spec.ts`

**Interfaces:**
- Consumes: `unofficialNames`, `termsIn` (Tarea 2).
- Produces:
  - `WHAT = { echoRequest, echoReply, allIcmp }`. Se va `WHAT.ping`: el 04-01 usa `WHAT.echoRequest`.
  - `FROM = { sgServidor1, anywhere }`, con ids `sg-servidor1` y `anywhere-ipv4`.
  - Etiquetas: `{{icmp}} · {{echo-request}}`, `{{icmp}} · {{echo-reply}}`, `All {{icmp}} - IPv4`, `{{security-group|SG}} servidor1` y `{{anywhere-ipv4}} (0.0.0.0/0)`.
  - `TASK_CARD_TEXT.what = 'Type'` y `TASK_CARD_TEXT.from = 'Source'`.

- [ ] **Step 1: Escribir los tests que fallan**

En `src/levels/ladder.test.ts`:

1. El import de `@/copy` pasa a `import { TERMS, termsIn, unofficialNames, type TermId } from '@/copy';`.
2. Agregar dentro de `describe('term ladder', …)`:

```ts
  it.each(BY_INCIDENT)('%s names each chip after a term, by its official name', (_id, incident) => {
    const labels = [...incident.chips.what, ...incident.chips.from].map((chip) => chip.label);
    expect(labels.filter((label) => termsIn(label).length === 0)).toEqual([]);
    expect(unofficialNames(labels)).toEqual([]);
  });
```

`src/ui/incident/task-card.test.tsx` (reemplazar entero):

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, toPlainText } from '@/copy';
import { barrierCard, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { TaskCard } from './task-card';

const DOOR = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const DAY_SHIFT_ROW = 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)';

function renderCard(incidentId: string) {
  const session = startSession(INCIDENTS, incidentId);
  const card = barrierCard(session, PIECE_ID.barrier(SG.servidor2));
  if (!card) throw new Error('missing Security Group');
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={session.incident.chips} {...handlers} />);
  return handlers;
}

describe('task card', () => {
  it('opens with the focus on its title and says when the Security Group has no inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: DOOR })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules));
  });

  it('names its trays Type and Source, like the inbound rules of the console', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.what })).toHaveTextContent(ECHO_REQUEST);
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.from })).toHaveTextContent(SG_SERVIDOR1);
  });

  it('builds a rule with clicks: one chip from each tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.tab();
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: SG_SERVIDOR1 })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
  });

  it('a chip clicked in the slot goes back to its tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('gives a chip back from the slot with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes a rule with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard('04-02');
    await user.tab();
    const removeButton = screen.getByRole('button', { name: TASK_CARD_TEXT.remove(DAY_SHIFT_ROW) });
    expect(removeButton).toHaveFocus();
    await user.keyboard('{Enter}');
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

Run: `npx vitest run src/levels/ladder.test.ts src/ui/incident/task-card.test.tsx`
Expected: FAIL. La ficha «Todo internet» no nombra ningún término, `{{ping|Ping}}` no es el nombre oficial, `FROM.sgServidor1` no existe y las bandejas se llaman «Qué» y «Desde dónde».

- [ ] **Step 3: Escribir las fichas**

En `src/levels/04-iaas/shared.ts`:

1. `const ANYWHERE = '0.0.0.0/0';` pasa a `const ANYWHERE_IPV4 = '0.0.0.0/0';`, y en `allOutbound` va `cidr: ANYWHERE_IPV4`.
2. Los bloques `WHAT`, `FROM` y `DAY_SHIFT_RULE` se reemplazan por:

```ts
export const WHAT = {
  echoRequest: { id: 'echo-request', label: '{{icmp}} · {{echo-request}}', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: '{{icmp}} · {{echo-reply}}', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { id: 'all-icmp', label: 'All {{icmp}} - IPv4', what: { kind: 'icmp', icmpType: 'all' } },
} satisfies Record<string, WhatChip>;

export const FROM = {
  sgServidor1: { id: 'sg-servidor1', label: `{{security-group|SG}} ${S1.id}`, peer: { kind: 'sg', sgId: SG.servidor1 } },
  anywhere: { id: 'anywhere-ipv4', label: `{{anywhere-ipv4}} (${ANYWHERE_IPV4})`, peer: { kind: 'cidr', cidr: ANYWHERE_IPV4 } },
} satisfies Record<string, FromChip>;

export const DAY_SHIFT_RULE: Rule = { id: 'day-shift-echo-reply', what: WHAT.echoReply.what, peer: FROM.anywhere.peer };
```

En `src/levels/04-iaas/01-the-first-ping.ts`:

```ts
  chips: { what: [WHAT.echoRequest], from: [FROM.sgServidor1, FROM.anywhere] },
```

```ts
  solution: [{ type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id }],
```

En `src/levels/04-iaas/02-open-just-enough.ts`:

```ts
  changes: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id) },
    { type: 'addRule', sgId: SG.servidor2, rule: DAY_SHIFT_RULE },
  ],
```

```ts
  chips: { what: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp], from: [FROM.sgServidor1, FROM.anywhere] },
```

```ts
  solution: [
    { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id },
    { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id },
  ],
```

En `src/copy/incident-ui.ts`, dentro de `TASK_CARD_TEXT`, reemplazar las claves `what` y `from` que escribió la Tarea 2 (no agregar otras: una clave repetida es el error TS1117). Quedan así:

```ts
  what: 'Type',
  from: 'Source',
```

- [ ] **Step 4: Renombrar las constantes en los tests**

```bash
perl -pi -e 's/\bWHAT\.ping\b/WHAT.echoRequest/g; s/\bFROM\.servidor1\b/FROM.sgServidor1/g; s/\bFROM\.internet\b/FROM.anywhere/g' \
  src/levels/world.test.ts src/game/tasks.test.ts src/game/stars.test.ts src/game/incidents.test.ts src/game/session.test.ts \
  src/game/view/inspection.test.ts src/game/view/pieces.test.ts src/ui/incident/lucia-card.test.tsx
grep -rnE "WHAT\.ping|FROM\.servidor1|FROM\.internet" src tests
```

Expected: el `grep` no imprime nada.

En `src/game/view/inspection.test.ts`, la fila `['Reglas de entrada', 'Echo Reply (vuelta) ← Todo internet'],` pasa a `['Reglas de entrada', 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)'],`.

En `src/ui/incident/incident-screen.test.tsx`:

1. Debajo de `const RIGHT_ANSWER = …;`, agregar:

```ts
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
```

2. En `placeFix`, `{ name: 'Ping' }` pasa a `{ name: ECHO_REQUEST }` y `{ name: 'servidor1' }` pasa a `{ name: SG_SERVIDOR1 }`.
3. `{ name: 'Quitar la regla Ping ← servidor1' }` pasa a `{ name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${SG_SERVIDOR1}`) }`.
4. En `'switching to another door…'`: `{ name: 'Ping' }` pasa a `{ name: ECHO_REQUEST }`, `TASK_CARD_TEXT.giveBack('Ping')` pasa a `TASK_CARD_TEXT.giveBack(ECHO_REQUEST)` y `{ name: 'Ping', pressed: false }` pasa a `{ name: ECHO_REQUEST, pressed: false }`.

En `tests/e2e/incidents.spec.ts`:

1. Debajo de `const DOOR = …;`, agregar:

```ts
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
```

2. En `playBoth` y en `'focus goes to the question…'`: `{ name: 'Ping', exact: true }` pasa a `{ name: ECHO_REQUEST, exact: true }`, `{ name: 'servidor1', exact: true }` pasa a `{ name: SG_SERVIDOR1, exact: true }` y `{ name: 'Echo Request (ida)', exact: true }` pasa a `{ name: ECHO_REQUEST, exact: true }`.
3. `/^Quitar la regla Echo Reply/` pasa a `/^Quitar la regla ICMP · Echo Reply/`.

- [ ] **Step 5: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(levels): offer chips and trays named as in the AWS console"
```

---

### Task 4: Escalera sin nombres escondidos

**Files:**
- Modify: `src/levels/04-iaas/01-the-first-ping.ts`, `src/game/view/pieces.ts`, `src/game/view/inspection.ts`, `src/copy/incident-ui.ts`, `src/game/view/inspection.test.ts`, `.claude/rules/rigorous-plain-copy.md`
- Modify (reescribir): `src/game/view/pieces.test.ts`, `src/game/view/ladder.test.ts`

**Interfaces:**
- Consumes: `unofficialNames`, `termsIn`, `toPlainText` (`@/copy`), `incidentTexts`, `unknownTerms` (`@/levels/ladder`).
- Produces:
  - `PIECE_TERM = { server: 'ec2-instance', barrier: 'security-group', gateway: 'internet-gateway', actor: null }` en `src/game/view/pieces.ts`.
  - `PieceView.term: TermId | null`.
  - Se van `gatewayLabel` y `MAP_TEXT.gatewayPlain`.
  - El 04-01 introduce `internet-gateway`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/view/ladder.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { termsIn, toPlainText, unofficialNames, type TermText } from '@/copy';
import { INCIDENTS, type Incident } from '@/levels';
import { incidentTexts, unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { barrierCard } from './barrier';
import { inspect } from './inspection';
import { pieceViews, type PieceKind } from './pieces';

const NAMED_BY_KIND: PieceKind[] = ['barrier', 'gateway'];
const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];

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

  it('names every piece by the official name of its term', () => {
    for (const session of sessionsToCheck(incident)) {
      const pieces = pieceViews(session);
      expect(unofficialNames(pieces.map((piece) => piece.label))).toEqual([]);
      for (const piece of pieces.filter((candidate) => NAMED_BY_KIND.includes(candidate.kind))) expect(termsIn(piece.label), piece.id).toContain(piece.term);
    }
  });

  it('uses none of the names the first playtest retired', () => {
    const texts = [...incidentTexts(incident), ...sessionsToCheck(incident).flatMap(shownTexts)].map((text) => toPlainText(text).toLowerCase());
    expect(RETIRED_NAMES.filter((name) => texts.some((text) => text.includes(name)))).toEqual([]);
  });
});
```

Las piezas de `NAMED_BY_KIND` se dibujan con el nombre de su clase. Las instancias y el atacante se dibujan con su propio nombre (`servidor2`, `Atacante`), como pide el spec.

`src/game/view/pieces.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { MAP_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { startSession } from '@/game/session';
import { barrierCard } from './barrier';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');

describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker and the Internet gateway, each with its term', () => {
    expect(pieceViews(first).map(({ id, term, label, locked, configurable }) => ({ id, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.server(S1.id), term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.server(S2.id), term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.barrier(SG.servidor1), term: 'security-group', label: MAP_TEXT.barrier(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.barrier(SG.servidor2), term: 'security-group', label: MAP_TEXT.barrier(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.gateway, term: 'internet-gateway', label: MAP_TEXT.gateway, locked: true, configurable: false },
    ]);
  });
});

describe('barrierCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(barrierCard(second, PIECE_ID.barrier(SG.servidor2))).toEqual({
      sgId: SG.servidor2,
      title: MAP_TEXT.barrier(S2.id),
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
    });
  });

  it('is null for anything that is not a Security Group', () => {
    expect(barrierCard(first, PIECE_ID.server(S2.id))).toBeNull();
    expect(barrierCard(first, PIECE_ID.barrier('sg-ghost'))).toBeNull();
  });
});
```

En `src/game/view/inspection.test.ts`, el test del Internet gateway pasa a:

```ts
  it('the Internet gateway is named so from 04-01 on', () => {
    expect(plain(inspect(first, PIECE_ID.gateway))?.title).toBe('Internet gateway');
  });
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game/view`
Expected: FAIL. La etiqueta del gateway es «entrada desde internet» (sin término y retirada), `PieceView` no tiene `term` y el título de la inspección es el nombre viejo.

- [ ] **Step 3: El Internet gateway desde el 04-01**

En `src/levels/04-iaas/01-the-first-ping.ts`, `introduces` pasa a:

```ts
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'ping', 'security-group', 'inbound-rule', 'icmp', 'echo-request', 'anywhere-ipv4', 'internet-gateway'],
```

En `src/copy/incident-ui.ts`, borrar la línea `gatewayPlain: 'entrada desde internet',` de `MAP_TEXT`.

`src/game/view/pieces.ts` (reemplazar entero):

```ts
import { MAP_TEXT, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface PieceView {
  id: string;
  kind: PieceKind;
  anchorId: string;
  term: TermId | null;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export const GATEWAY_ANCHOR = 'igw';

export const PIECE_TERM = {
  server: 'ec2-instance',
  barrier: 'security-group',
  gateway: 'internet-gateway',
  actor: null,
} as const satisfies Record<PieceKind, TermId | null>;

function barriers(session: Session): PieceView[] {
  const { world } = session;
  return world.securityGroups.flatMap((group): PieceView[] => {
    const owner = world.instances.find((instance) => instance.sgIds.includes(group.id));
    if (!owner) return [];
    const configurable = canConfigure(session, group.id);
    return [
      { id: PIECE_ID.barrier(group.id), kind: 'barrier', anchorId: owner.id, term: PIECE_TERM.barrier, label: MAP_TEXT.barrier(group.name), locked: !configurable, configurable },
    ];
  });
}

/** Returns every piece the map shows, with its term, its label by official name and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  return [
    ...world.instances.map(
      (instance): PieceView => ({ id: PIECE_ID.server(instance.id), kind: 'server', anchorId: instance.id, term: PIECE_TERM.server, label: instance.name, locked: !parts.linuxSettings, configurable: false }),
    ),
    ...barriers(session),
    ...world.actors.map(
      (actor): PieceView => ({ id: PIECE_ID.actor(actor.id), kind: 'actor', anchorId: actor.id, term: PIECE_TERM.actor, label: actor.name, locked: false, configurable: false }),
    ),
    { id: PIECE_ID.gateway, kind: 'gateway', anchorId: GATEWAY_ANCHOR, term: PIECE_TERM.gateway, label: MAP_TEXT.gateway, locked: true, configurable: false },
  ];
}
```

En `src/game/view/inspection.ts`:

1. Borrar `import { gatewayLabel } from './pieces';`.
2. En `inspect`, `title: gatewayLabel(session.known)` pasa a `title: MAP_TEXT.gateway`.

- [ ] **Step 4: Dejar escrito cómo se hace cumplir la regla**

Al final de `.claude/rules/rigorous-plain-copy.md`, agregar:

```markdown

Enforcement:
- `unofficialNames` (`src/copy/term-text.ts`) rejects a piece or a chip that shows a term with words other than its official name or short form, in `src/levels/ladder.test.ts` (chips) and `src/game/view/ladder.test.ts` (pieces).
- `src/game/view/ladder.test.ts` also rejects the plain names the first playtest retired.
- `src/copy/terms.test.ts` checks that every term has a definition of at most 120 characters.
- `src/levels/ladder.test.ts` rejects a definition that names a term the player does not know yet.
```

- [ ] **Step 5: Correr todo**

Run: `npm run check`
Expected: PASS. La prueba de Playwright `labels and stamps do not overlap` sigue pasando con «Security Group servidor2» e «Internet gateway». Si fallara, parar y avisar: la posición de las etiquetas es E4 a E6 y queda fuera de este plan.

- [ ] **Step 6: Commit**

```bash
git add src .claude/rules/rigorous-plain-copy.md
git commit -m "feat(game): name the Internet gateway from 04-01 and give every piece its term"
```

---

### Task 5: «Qué es» primero en el cuadro de inspección

Ver "Preguntas abiertas", punto 1, antes de empezar.

**Files:**
- Modify: `src/copy/incident-ui.ts`, `src/game/view/inspection.ts`, `src/ui/incident/incident-screen.test.tsx`
- Modify (reescribir): `src/game/view/inspection.test.ts`

**Interfaces:**
- Consumes: `PIECE_TERM` (Tarea 4) y `TERMS` (`@/copy`).
- Produces: `INSPECTION_TEXT.whatIs = 'Qué es'`. Los campos de la inspección empiezan con `{ label: INSPECTION_TEXT.whatIs, lines: [TERMS[term].definition] }` para instancias, Security Groups, el Internet gateway y paquetes. La firma de `inspect` no cambia.

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/view/inspection.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { ACTOR_ROLE_TEXT, TERMS, toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { inspect, type Inspection } from './inspection';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const WHAT_IS = 'Qué es';
const ATTACKER_BLOCKED = ['Resultado', 'No llegó: no volvió ninguna respuesta.'];
const first = startSession(INCIDENTS, '04-01');
const fixed = sessionReducer(first, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id });

function plain(inspection: Inspection | null) {
  return inspection && { title: toPlainText(inspection.title), fields: inspection.fields.map((f) => [toPlainText(f.label), ...f.lines.map(toPlainText)]) };
}

function knowing(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set([...session.known, ...terms]) };
}

function whatIs(term: TermId): string[] {
  return [WHAT_IS, TERMS[term].definition];
}

describe('inspect', () => {
  it('every piece but the attacker, and every packet, starts with what it is', () => {
    const ids = [...pieceViews(first).filter((piece) => piece.kind !== 'actor').map((piece) => piece.id), ...first.runs.map((run) => run.pieceId)];
    expect(ids.map((id) => inspect(first, id)?.fields[0]?.label)).toEqual(ids.map(() => WHAT_IS));
  });

  it('an instance shows what an EC2 instance is, its private IP and its Security Group, and nothing of later terms', () => {
    expect(plain(inspect(first, PIECE_ID.server(S2.id)))).toEqual({
      title: 'servidor2',
      fields: [whatIs('ec2-instance'), ['IP privada', S2.private], ['Security Groups', 'Security Group servidor2']],
    });
  });

  it('later terms add their fields', () => {
    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.server(S2.id)))?.fields.map(([label]) => label);
    expect(fields).toEqual([WHAT_IS, 'IP privada', 'IP pública', 'Nombres DNS', 'Security Groups']);
  });

  it('a Security Group without rules says it lets nothing in', () => {
    expect(plain(inspect(first, PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([whatIs('security-group'), ['Reglas de entrada', 'Ninguna: no deja entrar nada.']]);
  });

  it('a Security Group lists its inbound rules as chips', () => {
    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([
      whatIs('security-group'),
      ['Reglas de entrada', 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)'],
    ]);
  });

  it('a blocked packet says what it is, and where and why it stopped', () => {
    expect(plain(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id)))).toEqual({
      title: 'ping de Atacante a servidor2',
      fields: [
        whatIs('echo-request'),
        ATTACKER_BLOCKED,
        ['Dónde y por qué se detuvo', 'Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.'],
      ],
    });
  });

  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([whatIs('echo-request'), ['Resultado', 'Llegó y volvió la respuesta.']]);
  });

  it('a packet whose term is not known yet leaves out what it is', () => {
    const unaware: Session = { ...first, known: new Set<TermId>() };
    expect(plain(inspect(unaware, PIECE_ID.packet(FLOWS.attackerPing.id)))?.fields[0]).toEqual(ATTACKER_BLOCKED);
  });

  it('the attacker says who it is, but not its IP yet', () => {
    expect(plain(inspect(first, PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)]]);
  });

  it('the Internet gateway says what it is and what it does', () => {
    expect(plain(inspect(first, PIECE_ID.gateway))).toEqual({
      title: 'Internet gateway',
      fields: [whatIs('internet-gateway'), ['Qué hace', 'Por aquí entra y sale el tráfico entre la VPC e internet.']],
    });
  });

  it('an id that names nothing shows nothing', () => {
    expect(inspect(first, PIECE_ID.server('ghost'))).toBeNull();
    expect(inspect(first, 'nonsense')).toBeNull();
  });
});
```

En `src/ui/incident/incident-screen.test.tsx`:

1. Agregar `TERMS` al import de `@/copy`.
2. El test `'the inspection box leaves out fields whose term comes later'` pasa a:

```tsx
  it('the inspection box starts with what the piece is and leaves out fields whose term comes later', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(box.querySelector('dt')).toHaveTextContent('Qué es');
    expect(box.querySelector('dd')).toHaveTextContent(TERMS['ec2-instance'].definition);
    expect(box).toHaveTextContent('IP privada');
    expect(box).toHaveTextContent('172.31.38.97');
    expect(box).not.toHaveTextContent('IP pública');
    expect(box).not.toHaveTextContent('34.244.254.100');
  });
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game/view/inspection.test.ts src/ui/incident/incident-screen.test.tsx`
Expected: FAIL. Ninguna inspección empieza con «Qué es».

- [ ] **Step 3: Escribir «Qué es»**

En `src/copy/incident-ui.ts`:

1. Primera clave de `INSPECTION_TEXT`: `whatIs: 'Qué es',`.
2. `SCREEN_TEXT.inspectHelp` pasa a `'Pasa el mouse o el foco por una pieza o un sello para ver qué es y cómo está.'`.

`src/game/view/inspection.ts` (reemplazar entero):

```ts
import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Instance, type PacketSpec, type SecurityGroup } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './barrier';
import { parsePieceId } from './piece-id';
import { PIECE_TERM } from './pieces';

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

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map((spec) => ({ label: spec.label, lines: spec.lines() }));
}

function whatIs(term: TermId): FieldSpec {
  return { term, label: INSPECTION_TEXT.whatIs, lines: () => [TERMS[term].definition] };
}

function packetTerm(packet: PacketSpec): TermId | null {
  return packet.protocol === 'icmp' && packet.icmpType !== undefined ? ICMP_MESSAGE_TERM[packet.icmpType] : null;
}

function server(session: Session, instance: Instance): Inspection {
  const { region, securityGroups } = session.world;
  const groups = securityGroups.filter((group) => instance.sgIds.includes(group.id));
  return {
    title: instance.name,
    fields: visible(
      [
        whatIs(PIECE_TERM.server),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [instance.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [instance.publicIp ?? INSPECTION_TEXT.none] },
        {
          term: 'dns',
          label: INSPECTION_TEXT.dnsNames,
          lines: () => [...(instance.publicIp ? [publicDnsName(instance.publicIp, region)] : []), privateDnsName(instance.privateIp, region)],
        },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [instance.linux.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        { term: 'security-group', label: INSPECTION_TEXT.securityGroups, lines: () => groups.map((group) => MAP_TEXT.barrier(group.name)) },
      ],
      session.known,
    ),
  };
}

function barrier(session: Session, group: SecurityGroup): Inspection {
  const rows = ruleRows(group, session.incident);
  return {
    title: MAP_TEXT.barrier(group.name),
    fields: visible(
      [whatIs(PIECE_TERM.barrier), { term: 'inbound-rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }],
      session.known,
    ),
  };
}

function gateway(session: Session): Inspection {
  return {
    title: MAP_TEXT.gateway,
    fields: visible([whatIs(PIECE_TERM.gateway), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.gatewayDoes] }], session.known),
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
  const term = packetTerm(run.packet);
  return {
    title: run.label,
    fields: [
      ...visible(term ? [whatIs(term)] : [], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world)] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece or a packet, starting with what it is, or null when the id names nothing on the map. */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  if (ref.kind === 'gateway') return gateway(session);
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

Una definición es texto sin etiquetas, así que vale como `TermText` y la escalera la acepta tal cual.

- [ ] **Step 4: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(game): start every inspection with what the piece or packet is"
```

---

### Task 6: La definición de cada término al pasar el mouse

Ver "Preguntas abiertas", punto 4, antes de empezar.

**Files:**
- Create: `src/ui/term-tip.tsx`
- Modify (reescribir): `src/ui/tagged-text.tsx`, `src/ui/tagged-text.test.tsx`
- Modify: `src/ui/incident/inspection-box.tsx`, `src/ui/incident/incident-screen.test.tsx`, `src/styles.css`, `tests/e2e/incidents.spec.ts`, `package.json`, `package-lock.json`, `.claude/rules/prefer-established-libraries.md`, `.claude/az-rules.json`

**Interfaces:**
- Consumes: `TERMS`, `parseTermText` (`@/copy`).
- Produces:
  - `TermTip({ id: TermId; children: ReactNode })`: un `<span class="term term--tip">`. Mientras el mouse está encima, pinta en `document.body` un `<span role="tooltip" class="term-tip">` con «nombre: definición».
  - `TaggedText({ text, newTerms?, tips? = true })`: con `tips={false}` dibuja `<span class="term">`, sin cuadrito. La marca «nuevo» va ahora justo después del término, fuera de su `<span>`.

- [ ] **Step 1: Instalar la dependencia**

```bash
npm install @floating-ui/react-dom@2.1.9
grep -n '"@floating-ui/react-dom"' package.json
```

Expected: `"@floating-ui/react-dom": "2.1.9"`, sin `^`: `.npmrc` tiene `save-exact=true`. No se agregan `pnpm-lock.yaml` ni `pnpm-workspace.yaml`.

- [ ] **Step 2: Escribir los tests que fallan**

`src/ui/tagged-text.test.tsx` (reemplazar entero):

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

const SECURITY_GROUP = TERMS['security-group'];

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its official name', () => {
    const { container } = render(<TaggedText text="Mira el {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira el Security Group de servidor2.');
    expect(screen.getByText(SECURITY_GROUP.name)).toHaveClass('term');
  });

  it('marks the new terms right after them', () => {
    render(<TaggedText text="Una {{inbound-rule}} del {{security-group}}." newTerms={new Set<TermId>(['inbound-rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(TERMS['inbound-rule'].name).nextElementSibling).toHaveTextContent(LUCIA_TEXT.newBadge);
  });

  it('hovering a term shows its definition in document.body, out of any clipping box, and leaving hides it', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="clipping-box" style={{ overflow: 'hidden' }}>
        <TaggedText text="Mira el {{security-group}} de servidor2." />
      </div>,
    );
    const term = screen.getByText(SECURITY_GROUP.name);
    await user.hover(term);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(SECURITY_GROUP.definition);
    expect(tooltip.parentElement).toBe(document.body);
    expect(screen.getByTestId('clipping-box')).not.toContainElement(tooltip);
    await user.unhover(term);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows one definition at a time when the same term appears twice', async () => {
    const user = userEvent.setup();
    render(<TaggedText text="Un {{ping}} va y otro {{ping}} vuelve." />);
    const [firstPing, secondPing] = screen.getAllByText(TERMS.ping.name);
    await user.hover(firstPing);
    await user.hover(secondPing);
    expect(await screen.findAllByRole('tooltip')).toHaveLength(1);
  });

  it('a term is not a Tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TaggedText text="Mira el {{security-group}}." />
        <button type="button">Siguiente</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
  });

  it('without tips a term stays bold, with no underline and no definition', async () => {
    const user = userEvent.setup();
    render(<TaggedText text="El {{security-group}}." tips={false} />);
    const term = screen.getByText(SECURITY_GROUP.name);
    await user.hover(term);
    expect(term).toHaveClass('term');
    expect(term).not.toHaveClass('term--tip');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
```

`findByRole` espera dentro de `act` a que `useFloating` termine de calcular la posición, que es asíncrona. Así no aparecen avisos de `act`.

En `src/ui/incident/incident-screen.test.tsx`, el test `'a packet says where and why it stopped'` pasa a:

```tsx
  it('a packet says where and why it stopped, and the box shows no hover definitions', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
    expect(box.querySelector('.term--tip')).toBeNull();
  });
```

En `tests/e2e/incidents.spec.ts`, agregar al final (Review Focus 4):

```ts
test('a term shows its definition inside the window, also from a chip of the open card', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/level/04-01');
  const size = await windowSize(page);
  const tooltip = page.locator('body > [role="tooltip"]');
  await page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first().hover();
  await expect(tooltip).toContainText('Echo Request');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  const card = await openDoor(page);
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).getByText('Echo Request', { exact: true }).hover();
  await expect(tooltip).toContainText('tipo 8');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  expect(errors).toEqual([]);
});
```

El primer término está arriba en el panel de Lucía, pegado al borde superior derecho de la ventana: obliga a `flip` y a `shift`. El segundo está dentro de la capa HTML del mapa, que tiene `overflow: hidden`.

- [ ] **Step 3: Correrlos y verlos fallar**

Run: `npx vitest run src/ui/tagged-text.test.tsx src/ui/incident/incident-screen.test.tsx`
Expected: FAIL. No hay `role="tooltip"`, la marca «nuevo» está dentro del término y `tips` no existe.

- [ ] **Step 4: Escribir el cuadrito**

`src/ui/term-tip.tsx`:

```tsx
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TERMS, type TermId } from '@/copy';

const GAP_PX = 6;
const WINDOW_MARGIN_PX = 8;

/** Renders a term with a dotted underline; while the mouse is on it, its definition floats in a tooltip drawn in document.body, over every clipping box. It is not a Tab stop. */
export function TermTip({ id, children }: { id: TermId; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'top',
    strategy: 'fixed',
    middleware: [offset(GAP_PX), flip({ padding: WINDOW_MARGIN_PX }), shift({ padding: WINDOW_MARGIN_PX })],
    whileElementsMounted: autoUpdate,
  });
  return (
    <span ref={refs.setReference} className="term term--tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open &&
        createPortal(
          <span ref={refs.setFloating} role="tooltip" className="term-tip" style={floatingStyles}>
            <strong>{TERMS[id].name}</strong>: {TERMS[id].definition}
          </span>,
          document.body,
        )}
    </span>
  );
}
```

`autoUpdate` solo usa `ResizeObserver` e `IntersectionObserver` si existen (`typeof … === 'function'` en `@floating-ui/dom` 1.8.0), así que funciona en jsdom.

`src/ui/tagged-text.tsx` (reemplazar entero):

```tsx
import { Fragment } from 'react';
import { LUCIA_TEXT, parseTermText, type TermId, type TermText } from '@/copy';
import { TermTip } from './term-tip';

interface TaggedTextProps {
  text: TermText;
  newTerms?: ReadonlySet<TermId>;
  tips?: boolean;
}

/** Renders a tagged text: each term by its name, with its definition on hover unless tips is false, and each new term followed by its "nuevo" mark. */
export function TaggedText({ text, newTerms, tips = true }: TaggedTextProps) {
  return (
    <>
      {parseTermText(text).map((segment, index) => {
        if (segment.kind === 'text') return <Fragment key={index}>{segment.text}</Fragment>;
        return (
          <Fragment key={index}>
            {tips ? <TermTip id={segment.id}>{segment.text}</TermTip> : <span className="term">{segment.text}</span>}
            {newTerms?.has(segment.id) && (
              <>
                {' '}
                <span className="term__new">{LUCIA_TEXT.newBadge}</span>
              </>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
```

En `src/ui/incident/inspection-box.tsx`, los tres `<TaggedText text={…} />` (título, etiqueta y línea) llevan `tips={false}`: el cuadro no toma el mouse.

En `src/styles.css`, debajo de `.term { font-weight: 600; }`, agregar:

```css
.term--tip { text-decoration: underline dotted; text-underline-offset: 3px; cursor: help; }
.term-tip { z-index: 100; width: max-content; max-width: min(18rem, calc(100vw - 16px)); padding: 0.4rem 0.6rem; font: 400 0.85rem/1.4 var(--font-body); color: var(--paper-fill); background: var(--ink); border-radius: 3px; box-shadow: 2px 2px 0 var(--accent); pointer-events: none; text-align: left; text-transform: none; letter-spacing: normal; }
```

`z-index: 100` queda por encima de la barra del incidente (40) y del cuadro de inspección (35). No queda por encima de todo lo que dibuja drei: el `<Html>` de `src/scene/pieces.tsx` no fija `zIndexRange`, así que usa el rango por defecto de drei (`[16777271, 0]`), y la marca «!» que se ve con «Sin animaciones» puede quedar sobre el cuadrito. Este plan no cambia ese código. `pointer-events: none` hace que el cuadrito nunca tape un clic.

- [ ] **Step 5: Anotar la elección de la librería**

En `.claude/rules/prefer-established-libraries.md`, al final de "Choices so far":

```markdown
- Positioning a tooltip beside its anchor and inside the window: `@floating-ui/react-dom` (2.1.9, published 2026-07-11, checked 2026-10-08). Radix Tooltip was not chosen while `prefer-radix` is undecided; it uses this same library inside.
```

En `.claude/az-rules.json`, agregar a las `notes` de `prefer-established-libraries`, al final, sin borrar la nota que ya está:

```json
"tooltip positioning: @floating-ui/react-dom 2.1.9 (published 2026-07-11, checked 2026-10-08); Radix Tooltip not chosen while prefer-radix is undecided (backlog D)"
```

- [ ] **Step 6: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src tests .claude
git commit -m "feat(ui): show each term's definition on hover"
```

---

### Task 7: Palabras nuevas y glosario plegado

Ver "Preguntas abiertas", punto 5, antes de empezar.

**Files:**
- Modify: `src/copy/incident-ui.ts`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/lucia-card.test.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `session.known` (`@/game`) y `TERMS` (`@/copy`).
- Produces: `LUCIA_TEXT.glossary = 'Glosario'`. La tarjeta de Lucía muestra un `<details class="lucia__glossary">` plegado con todos los términos conocidos, en orden alfabético.

- [ ] **Step 1: Escribir los tests que fallan**

En `src/ui/incident/lucia-card.test.tsx`:

1. El import de Testing Library pasa a `import { render, screen, within } from '@testing-library/react';`.
2. `Harness` pasa a:

```tsx
function Harness({ incidentId = INCIDENTS[0].id, actions = [] }: { incidentId?: string; actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, incidentId)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} />;
}

function glossary(): HTMLElement {
  const details = screen.getByText(LUCIA_TEXT.glossary).closest('details');
  if (!details) throw new Error('missing glossary');
  return details;
}

function newWords(): HTMLElement {
  const list = screen.getByText(LUCIA_TEXT.newTerms).nextElementSibling;
  if (!(list instanceof HTMLElement)) throw new Error('missing new words');
  return list;
}
```

3. Desde aquí, el glosario repite las definiciones de «Palabras nuevas», así que el test `'defines the new terms of the incident'` busca solo dentro de esa lista:

```tsx
  it('defines the new terms of the incident', () => {
    render(<Harness />);
    expect(within(newWords()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
    expect(within(newWords()).getByText(TERMS['inbound-rule'].definition)).toBeInTheDocument();
  });
```

4. Agregar dentro de `describe("Lucía's card", …)` (Review Focus 5):

```tsx
  it('folds a glossary with every known term, from earlier incidents too, in alphabetical order', () => {
    render(<Harness incidentId="04-02" />);
    const names = [...startSession(INCIDENTS, '04-02').known].map((id) => TERMS[id].name).sort((a, b) => a.localeCompare(b, 'es'));
    expect(glossary()).not.toHaveAttribute('open');
    expect([...glossary().querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(names);
    expect(within(glossary()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
  });

  it('the glossary of 04-01 has no term from a later incident', () => {
    render(<Harness />);
    expect(glossary()).not.toHaveTextContent(TERMS['echo-reply'].name);
    expect(glossary()).not.toHaveTextContent(TERMS['least-privilege'].name);
  });
```

5. El `<summary>` del glosario va antes que el botón de las pistas en el orden del Tab, y user-event lo cuenta como parada del Tab. El test `'keeps the focus on the button after hint 1, then moves it to the last hint'` pasa a empezar con un clic (es la misma versión que trae la Tarea 9):

```tsx
  it('keeps the focus on the button after hint 1, then moves it to the last hint', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const button = screen.getByRole('button', { name: LUCIA_TEXT.askHint });
    await user.click(button);
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    const lastHint = screen.getByText(LUCIA_TEXT.hint(2)).closest('p');
    expect(lastHint).toHaveFocus();
    expect(document.body).not.toHaveFocus();
    expect(screen.getByRole('region', { name: new RegExp(LUCIA_TEXT.name) })).toContainElement(lastHint);
  });
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/ui/incident/lucia-card.test.tsx`
Expected: FAIL. `LUCIA_TEXT.glossary` no existe y no hay `<details>`.

- [ ] **Step 3: Escribir el glosario**

En `src/copy/incident-ui.ts`, en `LUCIA_TEXT`, debajo de `newBadge: 'nuevo',`, agregar `glossary: 'Glosario',`.

`src/ui/incident/lucia-card.tsx` (reemplazar entero; la Tarea 9 cambia las tareas y suma el botón):

```tsx
import type { RefObject } from 'react';
import { LUCIA_TEXT, TERMS, type TermId, type TermText } from '@/copy';
import { STABLE_MS, isIntruding, isStable, type Session } from '@/game';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface HintLineProps {
  number: number;
  text: TermText;
  lineRef?: RefObject<HTMLParagraphElement | null>;
}

function HintLine({ number, text, lineRef }: HintLineProps) {
  return (
    <p ref={lineRef} tabIndex={lineRef ? -1 : undefined} className="hint">
      <strong>{LUCIA_TEXT.hint(number)}</strong> <TaggedText text={text} />
    </p>
  );
}

function FocusedHintLine({ number, text }: HintLineProps) {
  const line = useFocusOnMount<HTMLParagraphElement>();
  return <HintLine number={number} text={text} lineRef={line} />;
}

function byName(a: TermId, b: TermId): number {
  return TERMS[a].name.localeCompare(TERMS[b].name, 'es');
}

function TermList({ terms, markNew }: { terms: TermId[]; markNew: boolean }) {
  return (
    <dl className="glossary">
      {terms.map((id) => (
        <div key={id}>
          <dt>
            {TERMS[id].name}
            {markNew && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
          </dt>
          <dd>{TERMS[id].definition}</dd>
        </div>
      ))}
    </dl>
  );
}

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
      <TermList terms={incident.introduces} markNew />
      <details className="lucia__glossary">
        <summary>{LUCIA_TEXT.glossary}</summary>
        <TermList terms={[...session.known].sort(byName)} markNew={false} />
      </details>
      <div aria-live="polite">
        {incident.hints.slice(0, session.hintsShown).map((hint, index) => {
          const Line = index === incident.hints.length - 1 ? FocusedHintLine : HintLine;
          return <Line key={hint} number={index + 1} text={hint} />;
        })}
      </div>
      {session.hintsShown < incident.hints.length && (
        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>
      )}
    </section>
  );
}
```

El `<summary>` es una parada del Tab y abre el glosario con Enter. Es el camino del teclado y del lector de pantalla hacia las definiciones (spec, paso 3).

En `src/styles.css`, debajo de `.glossary dd { … }`, agregar:

```css
.lucia__glossary { margin: 0 0 0.8rem; }
.lucia__glossary summary { cursor: pointer; font: 600 0.8rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: 0.08em; }
.lucia__glossary[open] summary { margin-bottom: 0.6rem; }
.lucia__glossary summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 4: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(ui): fold a glossary of every known term in Lucía's card"
```

---

### Task 8: «Enviar solución» en la sesión

La acción se suma sin quitar todavía `tick`. La Tarea 9 quita el reloj junto con la pantalla que lo usa.

**Files:**
- Modify: `src/game/tasks.ts`, `src/game/tasks.test.ts`, `src/game/session.ts`, `src/game/session.test.ts`

**Interfaces:**
- Consumes: `taskHolds` (ya existe), `isTight` y `hasIntrusion` (`session.ts`).
- Produces:
  - `failingTaskIds(tasks: IncidentTask[], runs: FlowRun[]): string[]` en `src/game/tasks.ts`.
  - `interface Rejection { attempt: number; failingTaskIds: string[]; intruding: boolean }`.
  - `Session.rejection: Rejection | null`.
  - La acción `{ type: 'submit' }`:
    - si alguna tarea falla, el incidente sigue abierto y se guarda la respuesta, con `attempt` + 1;
    - si todas se cumplen, pasa a `explaining`, mide `tight` en ese momento y deja `rejection: null`.
  - Todo movimiento que cambia el mundo deja `rejection: null`.

- [ ] **Step 1: Escribir los tests que fallan**

En `src/game/tasks.test.ts`:

1. El import de `./tasks` suma `failingTaskIds`.
2. Agregar dentro de `describe('tasks', …)`:

```ts
  it('lists the tasks that do not hold, in the order of the incident', () => {
    expect(failingTaskIds(incident.tasks, failing)).toEqual([task.id]);
    expect(failingTaskIds(incident.tasks, holding)).toEqual([]);
  });
```

En `src/game/session.test.ts`:

1. El import de `shared` pasa a `import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';`.
2. Debajo de `const WRONG = …;`, agregar:

```ts
const SUBMIT: SessionAction = { type: 'submit' };
const PING_TASK = FIRST.tasks[0].id;
const DROP_DAY_SHIFT: SessionAction = { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id };
```

3. Agregar al final del archivo (Review Focus 1 y 3):

```ts
describe('sending the solution', () => {
  it('with the task failing, the incident stays open and the reply names the task', () => {
    const session = play(place(SG.servidor1, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: false });
  });

  it('with something forbidden getting in, the reply says so', () => {
    const session = play(FIX, WIDE, SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: true });
  });

  it('sending again without a change counts a new attempt, so Lucía answers again', () => {
    expect(play(SUBMIT, SUBMIT).rejection?.attempt).toBe(2);
  });

  it('the reply goes away when a rule changes, and stays when a move or a hint changes nothing', () => {
    const rejected = play(FIX, WIDE, SUBMIT);
    expect(sessionReducer(rejected, WIDE)).toBe(rejected);
    expect(sessionReducer(rejected, { type: 'showHint' }).rejection).toEqual(rejected.rejection);
    expect(sessionReducer(rejected, UNWIDE).rejection).toBeNull();
  });

  it('with every task done it closes and measures only-what-is-needed right then', () => {
    const second = startSession(INCIDENTS, '04-02');
    const keptDayShift = [place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(keptDayShift.phase).toBe('explaining');
    expect(keptDayShift.rejection).toBeNull();
    expect(starsOf(keptDayShift)).toMatchObject({ closed: true, tight: false });
    expect(sessionReducer(keptDayShift, DROP_DAY_SHIFT)).toBe(keptDayShift);
    const cleaned = [DROP_DAY_SHIFT, place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(starsOf(cleaned)).toMatchObject({ closed: true, tight: true });
  });

  it('sending once the incident is closed changes nothing', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, SUBMIT)).toBe(closed);
  });
});
```

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game/tasks.test.ts src/game/session.test.ts`
Expected: FAIL. `failingTaskIds` no existe, `submit` no es una acción y `rejection` es `undefined`.

- [ ] **Step 3: Escribir el envío**

En `src/game/tasks.ts`, agregar debajo de `taskHolds`:

```ts
/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs)).map((task) => task.id);
}
```

En `src/game/session.ts`:

1. El import de `./tasks` pasa a `import { advanceTasks, failingTaskIds, isStable } from './tasks';`.
2. Debajo de `SessionPhase`, agregar:

```ts
export interface Rejection {
  attempt: number;
  failingTaskIds: string[];
  intruding: boolean;
}
```

3. En `Session`, debajo de `runs: FlowRun[];`, agregar `rejection: Rejection | null;`.
4. En `SessionAction`, agregar `| { type: 'submit' }`.
5. En `startSession`, debajo de `runs,`, agregar `rejection: null,`.
6. En `move`, el `return` final pasa a:

```ts
  return { ...state, world, runs, alerts: state.alerts + (startsEpisode ? 1 : 0), rejection: null };
```

7. Debajo de `move`, agregar:

```ts
function submit(state: Session): Session {
  if (state.phase !== 'playing') return state;
  const failing = failingTaskIds(state.incident.tasks, state.runs);
  if (failing.length === 0) return { ...state, phase: 'explaining', tight: isTight(state.world, state.incident.flows), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
}
```

8. En `sessionReducer`, agregar el caso:

```ts
    case 'submit':
      return submit(state);
```

- [ ] **Step 4: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat(game): send the solution and keep Lucía's reply until a rule changes"
```

---

### Task 9: El botón «Enviar solución», la respuesta de Lucía y fuera el reloj

Ver "Preguntas abiertas", punto 6, antes de empezar.

**Files:**
- Delete: `src/ui/incident/use-stability-clock.ts`
- Modify: `src/copy/incident-ui.ts`, `src/game/session.ts`, `src/game/index.ts`, `src/ui/incident/incident-screen.tsx`, `src/styles.css`
- Modify (reescribir): `src/game/tasks.ts`, `src/game/tasks.test.ts`, `src/game/session.test.ts`, `src/ui/incident/lucia-card.tsx`, `src/ui/incident/lucia-card.test.tsx`, `src/ui/incident/incident-screen.test.tsx`, `tests/e2e/incidents.spec.ts`

**Interfaces:**
- Consumes: `Rejection`, `submit` y `failingTaskIds` (Tarea 8), `taskHolds`.
- Produces:
  - `LuciaCard({ session, onAskHint, onSubmit })`.
  - `@/game` exporta `taskHolds` y el tipo `Rejection`, y deja de exportar `STABLE_MS` e `isStable`.
  - Se van `tick`, `taskMs`, `advanceTasks`, `STABLE_MS`, `isStable`, `TICK_MS`, `useStabilityClock` y `LUCIA_TEXT.steady`.
  - Textos nuevos: `LUCIA_TEXT.submit`, `LUCIA_TEXT.failing(task)` y `LUCIA_TEXT.intruding`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/ui/incident/lucia-card.test.tsx` (reemplazar entero):

```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS, toPlainText } from '@/copy';
import { sessionReducer, startSession, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { LuciaCard } from './lucia-card';

const FIRST = INCIDENTS[0];
const FIX: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
const WIDE: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id };
const SUBMIT: SessionAction = { type: 'submit' };
const NOT_YET = toPlainText(LUCIA_TEXT.failing(FIRST.tasks[0].text));

function Harness({ incidentId = FIRST.id, actions = [] }: { incidentId?: string; actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, incidentId)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch(SUBMIT)} />;
}

function glossary(): HTMLElement {
  const details = screen.getByText(LUCIA_TEXT.glossary).closest('details');
  if (!details) throw new Error('missing glossary');
  return details;
}

function newWords(): HTMLElement {
  const list = screen.getByText(LUCIA_TEXT.newTerms).nextElementSibling;
  if (!(list instanceof HTMLElement)) throw new Error('missing new words');
  return list;
}

describe("Lucía's card", () => {
  it('reports the problem and lists the task as pending', () => {
    render(<Harness />);
    expect(screen.getByText(/no logra hacer/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('marks the task done as soon as it holds, with no wait', () => {
    render(<Harness actions={[FIX]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.done);
  });

  it('defines the new terms of the incident', () => {
    render(<Harness />);
    expect(within(newWords()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
    expect(within(newWords()).getByText(TERMS['inbound-rule'].definition)).toBeInTheDocument();
  });

  it('folds a glossary with every known term, from earlier incidents too, in alphabetical order', () => {
    render(<Harness incidentId="04-02" />);
    const names = [...startSession(INCIDENTS, '04-02').known].map((id) => TERMS[id].name).sort((a, b) => a.localeCompare(b, 'es'));
    expect(glossary()).not.toHaveAttribute('open');
    expect([...glossary().querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(names);
    expect(within(glossary()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
  });

  it('the glossary of 04-01 has no term from a later incident', () => {
    render(<Harness />);
    expect(glossary()).not.toHaveTextContent(TERMS['echo-reply'].name);
    expect(glossary()).not.toHaveTextContent(TERMS['least-privilege'].name);
  });

  it('sending with the task failing: Lucía says which one, and the game goes on', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(NOT_YET);
    expect(screen.getByRole('status')).not.toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.getByRole('button', { name: LUCIA_TEXT.submit })).toBeInTheDocument();
  });

  it('sending with Anywhere-IPv4 open also says that something forbidden is getting in', async () => {
    const user = userEvent.setup();
    render(<Harness actions={[FIX, WIDE]} />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(NOT_YET);
    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
  });

  it('sending again repeats the reply as a new message, so it is announced again', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const submit = screen.getByRole('button', { name: LUCIA_TEXT.submit });
    await user.click(submit);
    const status = screen.getByRole('status');
    const firstReply = status.firstElementChild;
    await user.click(submit);
    expect(status.firstElementChild).not.toBe(firstReply);
    expect(status).toHaveTextContent(NOT_YET);
  });

  it('the button and the reply go away once the incident is closed', () => {
    render(<Harness actions={[FIX, SUBMIT]} />);
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.submit })).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('gives hint 1, then hint 2, then no more', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(1)).closest('p')).toHaveTextContent('Mira el Security Group de servidor2: ¿qué deja pasar hoy?');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(2)).closest('p')).toHaveTextContent(
      'En el Security Group de servidor2, agrega una regla de entrada: ICMP · Echo Request, desde SG servidor1.',
    );
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.askHint })).toBeNull();
  });

  it('announces each hint through an always-mounted polite region', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(region).toHaveTextContent(LUCIA_TEXT.hint(1));
  });

  it('keeps the focus on the button after hint 1, then moves it to the last hint', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const button = screen.getByRole('button', { name: LUCIA_TEXT.askHint });
    await user.click(button);
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    const lastHint = screen.getByText(LUCIA_TEXT.hint(2)).closest('p');
    expect(lastHint).toHaveFocus();
    expect(document.body).not.toHaveFocus();
    expect(screen.getByRole('region', { name: new RegExp(LUCIA_TEXT.name) })).toContainElement(lastHint);
  });

  it('warns when something forbidden gets in', () => {
    render(<Harness actions={[WIDE]} />);
    expect(screen.getByRole('alert')).toHaveTextContent(LUCIA_TEXT.intrusion);
  });
});
```

El test del foco de las pistas sigue empezando con un clic, como desde la Tarea 7, porque el botón «Enviar solución» y el `<summary>` del glosario van antes en el orden del Tab. `[aria-live="polite"]` sigue siendo solo la región de las pistas: la respuesta usa `role="status"` sin atributo.

`src/ui/incident/incident-screen.test.tsx` (reemplazar entero; Review Focus 2):

```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT, TERMS } from '@/copy';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { IncidentScreen } from './incident-screen';

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

const DOOR = 'Security Group servidor2';
const OTHER_DOOR = 'Security Group servidor1';
const LOCKED_SERVER = 'servidor2 con candado';
const ATTACKER_PACKET = 'ping de Atacante a servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const ANYWHERE = 'Anywhere-IPv4 (0.0.0.0/0)';
const FULL_STARS = 3;
const FIRST = INCIDENTS[0];
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;

type User = ReturnType<typeof userEvent.setup>;

function renderFirst() {
  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId={INCIDENTS[1].id} onFinish={onFinish} />);
  return onFinish;
}

async function placeRule(user: User, source: string) {
  await user.click(screen.getByRole('button', { name: DOOR }));
  const card = screen.getByRole('dialog', { name: DOOR });
  await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
  await user.click(within(card).getByRole('button', { name: source }));
  return card;
}

describe('incident screen', () => {
  it('opens the card from its Security Group, and Esc closes it and gives the focus back to it', async () => {
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
    const card = await placeRule(user, SG_SERVIDOR1);
    expect(within(card).getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${SG_SERVIDOR1}`) })).toBeInTheDocument();
  });

  it('switching to another Security Group opens its card with an empty slot', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: DOOR }));
    await user.click(within(screen.getByRole('dialog', { name: DOOR })).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: OTHER_DOOR }));
    const card = screen.getByRole('dialog', { name: OTHER_DOOR });
    expect(within(card).queryByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toBeNull();
    expect(within(card).getByRole('button', { name: ECHO_REQUEST, pressed: false })).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: OTHER_DOOR })).toHaveFocus();
  });

  it('a locked piece can be inspected but opens no card', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
  });

  it('the inspection box starts with what the piece is and leaves out fields whose term comes later', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(box.querySelector('dt')).toHaveTextContent('Qué es');
    expect(box.querySelector('dd')).toHaveTextContent(TERMS['ec2-instance'].definition);
    expect(box).toHaveTextContent('IP privada');
    expect(box).toHaveTextContent('172.31.38.97');
    expect(box).not.toHaveTextContent('IP pública');
    expect(box).not.toHaveTextContent('34.244.254.100');
  });

  it('a packet says where and why it stopped, and the box shows no hover definitions', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
    expect(box.querySelector('.term--tip')).toBeNull();
  });

  it('sending with Anywhere-IPv4 open gets Lucía’s reply and the incident goes on, until a rule changes', async () => {
    const user = userEvent.setup();
    renderFirst();
    const card = await placeRule(user, ANYWHERE);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.queryByRole('heading', { name: EXPLANATION_TEXT.asks })).toBeNull();
    expect(within(card).getByRole('heading', { name: DOOR })).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${ANYWHERE}`) }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('sending with every task done and the card open closes the card, moves the focus to Lucía’s question, and the right answer gives 3 stars', async () => {
    const user = userEvent.setup();
    const onFinish = renderFirst();
    await placeRule(user, SG_SERVIDOR1);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: EXPLANATION_TEXT.asks })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
    expect(onFinish).toHaveBeenCalledWith(FULL_STARS);
    expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeInTheDocument();
  });
});
```

`src/game/tasks.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { failingTaskIds, taskHolds } from './tasks';

const incident = INCIDENTS[0];
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing)).toBe(false);
    expect(taskHolds(task, holding)).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows))).toBe(false);
  });

  it('lists the tasks that do not hold, in the order of the incident', () => {
    expect(failingTaskIds(incident.tasks, failing)).toEqual([task.id]);
    expect(failingTaskIds(incident.tasks, holding)).toEqual([]);
  });
});
```

`src/game/session.test.ts` (reemplazar entero):

```ts
import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { ruleIdFor } from '@/levels/incident';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
import { countStars } from './stars';

const FIRST = INCIDENTS[0];
const FULL_STARS = 3;
const place = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', sgId, whatId, fromId });
const remove = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', sgId, ruleId: ruleIdFor(whatId, fromId) });
const FIX = place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id);
const WIDE = place(SG.servidor2, WHAT.echoRequest.id, FROM.anywhere.id);
const UNWIDE = remove(SG.servidor2, WHAT.echoRequest.id, FROM.anywhere.id);
const SUBMIT: SessionAction = { type: 'submit' };
const DROP_DAY_SHIFT: SessionAction = { type: 'removeRule', sgId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id };
const choose = (index: number): SessionAction => ({ type: 'chooseExplanation', index });
const RIGHT = FIRST.explanation.findIndex((option) => option.correct);
const WRONG = FIRST.explanation.findIndex((option) => !option.correct);
const PING_TASK = FIRST.tasks[0].id;

const play = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(INCIDENTS, FIRST.id));

describe('incident session', () => {
  it('starts playing, with nothing getting in and no reply from Lucía', () => {
    const start = play();
    expect(start.phase).toBe('playing');
    expect(isIntruding(start)).toBe(false);
    expect(start.alerts).toBe(0);
    expect(start.rejection).toBeNull();
  });

  it('a forbidden flow that starts getting in warns once per episode', () => {
    const opened = play(FIX, WIDE);
    expect(isIntruding(opened)).toBe(true);
    expect(opened.alerts).toBe(1);
    expect(sessionReducer(opened, place(SG.servidor1, WHAT.echoRequest.id, FROM.anywhere.id)).alerts).toBe(1);
    expect([UNWIDE, WIDE].reduce(sessionReducer, opened).alerts).toBe(2);
  });

  it('closing tight with the right explanation gives 3 stars', () => {
    const explained = play(FIX, SUBMIT, choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, tight: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
  });

  it('only the first explanation counts', () => {
    const session = play(FIX, SUBMIT, choose(WRONG), choose(RIGHT));
    expect(session.choice).toBe(WRONG);
    expect(starsOf(session).explained).toBe(false);
  });

  it('an explanation out of range is ignored, and the result needs a choice', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, choose(FIRST.explanation.length))).toBe(closed);
    expect(sessionReducer(closed, { type: 'showResult' })).toBe(closed);
    expect(play(FIX, SUBMIT, choose(RIGHT), { type: 'showResult' }).phase).toBe('result');
  });

  it('nothing on the map changes once the incident closed', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, WIDE)).toBe(closed);
  });

  it('hints come one by one, up to two', () => {
    const hint: SessionAction = { type: 'showHint' };
    expect(play(hint).hintsShown).toBe(1);
    expect(play(hint, hint, hint).hintsShown).toBe(FIRST.hints.length);
  });

  it('a Security Group the ladder keeps closed cannot be changed', () => {
    const start = startSession(INCIDENTS, FIRST.id);
    const closedGroups: Session = { ...start, parts: { ...start.parts, inboundRules: false } };
    expect(sessionReducer(closedGroups, FIX)).toBe(closedGroups);
  });
});

describe('sending the solution', () => {
  it('with the task failing, the incident stays open and the reply names the task', () => {
    const session = play(place(SG.servidor1, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: false });
  });

  it('with something forbidden getting in, the reply says so', () => {
    const session = play(FIX, WIDE, SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: true });
  });

  it('sending again without a change counts a new attempt, so Lucía answers again', () => {
    expect(play(SUBMIT, SUBMIT).rejection?.attempt).toBe(2);
  });

  it('the reply goes away when a rule changes, and stays when a move or a hint changes nothing', () => {
    const rejected = play(FIX, WIDE, SUBMIT);
    expect(sessionReducer(rejected, WIDE)).toBe(rejected);
    expect(sessionReducer(rejected, { type: 'showHint' }).rejection).toEqual(rejected.rejection);
    expect(sessionReducer(rejected, UNWIDE).rejection).toBeNull();
  });

  it('with every task done it closes and measures only-what-is-needed right then', () => {
    const second = startSession(INCIDENTS, '04-02');
    const keptDayShift = [place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(keptDayShift.phase).toBe('explaining');
    expect(keptDayShift.rejection).toBeNull();
    expect(starsOf(keptDayShift)).toMatchObject({ closed: true, tight: false });
    expect(sessionReducer(keptDayShift, DROP_DAY_SHIFT)).toBe(keptDayShift);
    const cleaned = [DROP_DAY_SHIFT, place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(starsOf(cleaned)).toMatchObject({ closed: true, tight: true });
  });

  it('sending once the incident is closed changes nothing', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, SUBMIT)).toBe(closed);
  });
});
```

`tests/e2e/incidents.spec.ts` (reemplazar entero):

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const DOOR = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const ANYWHERE = 'Anywhere-IPv4 (0.0.0.0/0)';
const SUBMIT = 'Enviar solución';
const INTRUDING = 'algo prohibido está entrando';
const INSPECTED_SERVER = 'servidor2 con candado';
const INSPECTION_TITLE = 'servidor2';
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

function isInside(outer: Size, inner: Omit<Box, 'name'> | null): boolean {
  return inner !== null && inner.x >= 0 && inner.y >= 0 && inner.x + inner.width <= outer.width && inner.y + inner.height <= outer.height;
}

async function windowSize(page: Page): Promise<Size> {
  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
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

async function openDoor(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: DOOR, exact: true }).click();
  return page.getByRole('dialog', { name: DOOR });
}

async function placeRule(card: Locator, source: string) {
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await card.getByRole('button', { name: source, exact: true }).click();
}

async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: SUBMIT }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

async function playBoth(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  const first = await openDoor(page);
  await placeRule(first, SG_SERVIDOR1);
  await first.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /no había ninguna para el ping de servidor1/);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abre lo justo' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'vuelva a hacer' })).toContainText('pendiente');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await openDoor(page);
  await second.getByRole('button', { name: /^Quitar la regla ICMP · Echo Reply/ }).click();
  await placeRule(second, SG_SERVIDOR1);
  await second.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /solo hace falta permitir la ida/);
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

test('labels and stamps do not overlap, and the open card does not cover its Security Group', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('button', { name: DOOR, exact: true })).toBeVisible();
  await expect.poll(() => overlappingPairs(page)).toEqual([]);
  const card = await openDoor(page);
  const label = page.getByRole('button', { name: DOOR, exact: true });
  await expect.poll(async () => overlaps(await card.boundingBox(), await label.boundingBox())).toBe(false);
});

test('the inspection box floats inside the window and covers no label or stamp', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.locator('button.stamp').first()).toBeVisible();
  await page.getByRole('button', { name: INSPECTED_SERVER, exact: true }).hover();
  const inspection = page.getByRole('region', { name: INSPECTION_TITLE, exact: true });
  await expect(inspection).toBeVisible();
  const rect = await inspection.boundingBox();
  expect(isInside(await windowSize(page), rect)).toBe(true);
  const covered = (await mapBoxes(page)).filter((other) => overlaps(rect, other)).map((other) => other.name);
  expect(covered).toEqual([]);
});

test('focus goes to the card heading when a Security Group opens, and back to it on Escape', async ({ page }) => {
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await expect(card.getByRole('heading', { level: 2 })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('button', { name: DOOR, exact: true })).toBeFocused();
});

test('a term shows its definition inside the window, also from a chip of the open card', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/level/04-01');
  const size = await windowSize(page);
  const tooltip = page.locator('body > [role="tooltip"]');
  await page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first().hover();
  await expect(tooltip).toContainText('Echo Request');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  const card = await openDoor(page);
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).getByText('Echo Request', { exact: true }).hover();
  await expect(tooltip).toContainText('tipo 8');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  expect(errors).toEqual([]);
});

test('sending with Anywhere-IPv4 open gets Lucía’s reply, and with the card still open the fix closes it and focuses the question', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await placeRule(card, ANYWHERE);
  await page.getByRole('button', { name: SUBMIT }).click();
  await expect(page.getByRole('status')).toContainText(INTRUDING);
  await expect(page.getByRole('heading', { name: QUESTION })).toHaveCount(0);
  await card.getByRole('button', { name: /^Quitar la regla/ }).click();
  await expect(page.getByRole('status')).toBeEmpty();
  await placeRule(card, SG_SERVIDOR1);
  await page.getByRole('button', { name: SUBMIT }).click();
  await expect(page.getByRole('heading', { name: QUESTION })).toBeFocused();
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});
```

El último test reemplaza al viejo «focus goes to the question when the incident closes with the card still open». Así jscpd no ve dos tests con los mismos cinco pasos. `CLOSE_TIMEOUT_MS` se va: el cierre ya es instantáneo.

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/game src/ui/incident`
Expected: FAIL. `LUCIA_TEXT.submit` y el botón no existen, la tarea se marca solo después de 3 s y `@/game` no exporta `taskHolds`.

- [ ] **Step 3: Quitar el reloj de la sesión**

`src/game/tasks.ts` (reemplazar entero):

```ts
import type { IncidentTask } from '@/levels';
import type { FlowRun } from './flow-runs';

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

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs)).map((task) => task.id);
}
```

En `src/game/session.ts`:

1. El import de `./tasks` pasa a `import { failingTaskIds } from './tasks';`.
2. Borrar `taskMs: Record<string, number>;` de `Session`.
3. Borrar `| { type: 'tick'; ms: number }` de `SessionAction`.
4. En `startSession`, borrar `taskMs: Object.fromEntries(incident.tasks.map((task) => [task.id, 0])),`. El JSDoc pasa a `/** Starts an incident from its canonical world, with Lucía's reply empty. */`.
5. Borrar la función `tick` entera y el caso `case 'tick':` del reducer.

`src/game/index.ts` (reemplazar entero):

```ts
export { intrudedServerIds } from './flow-runs';
export { isIntruding, sessionReducer, startSession, starsOf } from './session';
export type { Rejection, Session, SessionAction } from './session';
export { countStars } from './stars';
export type { Stars } from './stars';
export { taskHolds } from './tasks';
export { barrierCard, rowText } from './view/barrier';
export type { BarrierCard } from './view/barrier';
export { inspect } from './view/inspection';
export type { Inspection } from './view/inspection';
export { pieceViews } from './view/pieces';
```

- [ ] **Step 4: El botón y la respuesta en la tarjeta de Lucía**

En `src/copy/incident-ui.ts`, `LUCIA_TEXT` pasa a:

```ts
export const LUCIA_TEXT = {
  name: 'Lucía',
  role: 'soporte',
  tasks: 'Tareas',
  pending: 'pendiente',
  done: 'hecha',
  submit: 'Enviar solución',
  failing: (task: TermText): TermText => `Todavía no se cumple: «${task}»`,
  intruding: 'Además, algo prohibido está entrando.',
  intrusion: '¡Algo raro está entrando!',
  newTerms: 'Palabras nuevas',
  newBadge: 'nuevo',
  glossary: 'Glosario',
  askHint: '¿Alguna pista?',
  hint: (number: number) => `Pista ${number}:`,
} as const;
```

`src/ui/incident/lucia-card.tsx` (reemplazar entero):

```tsx
import type { RefObject } from 'react';
import { LUCIA_TEXT, TERMS, type TermId, type TermText } from '@/copy';
import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';
import type { IncidentTask } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface HintLineProps {
  number: number;
  text: TermText;
  lineRef?: RefObject<HTMLParagraphElement | null>;
}

interface LuciaCardProps {
  session: Session;
  onAskHint: () => void;
  onSubmit: () => void;
}

function HintLine({ number, text, lineRef }: HintLineProps) {
  return (
    <p ref={lineRef} tabIndex={lineRef ? -1 : undefined} className="hint">
      <strong>{LUCIA_TEXT.hint(number)}</strong> <TaggedText text={text} />
    </p>
  );
}

function FocusedHintLine({ number, text }: HintLineProps) {
  const line = useFocusOnMount<HTMLParagraphElement>();
  return <HintLine number={number} text={text} lineRef={line} />;
}

function byName(a: TermId, b: TermId): number {
  return TERMS[a].name.localeCompare(TERMS[b].name, 'es');
}

function TermList({ terms, markNew }: { terms: TermId[]; markNew: boolean }) {
  return (
    <dl className="glossary">
      {terms.map((id) => (
        <div key={id}>
          <dt>
            {TERMS[id].name}
            {markNew && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
          </dt>
          <dd>{TERMS[id].definition}</dd>
        </div>
      ))}
    </dl>
  );
}

function RejectionReply({ rejection, tasks }: { rejection: Rejection; tasks: IncidentTask[] }) {
  return (
    <>
      {tasks
        .filter((task) => rejection.failingTaskIds.includes(task.id))
        .map((task) => (
          <p key={task.id}>
            <TaggedText text={LUCIA_TEXT.failing(task.text)} />
          </p>
        ))}
      {rejection.intruding && <p>{LUCIA_TEXT.intruding}</p>}
    </>
  );
}

export function LuciaCard({ session, onAskHint, onSubmit }: LuciaCardProps) {
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
          const done = taskHolds(task, session.runs);
          return (
            <li key={task.id} className="task">
              <span aria-hidden="true">{done ? '✓ ' : '☐ '}</span>
              <TaggedText text={task.text} newTerms={newTerms} />
              <span className="sr-only"> ({done ? LUCIA_TEXT.done : LUCIA_TEXT.pending})</span>
            </li>
          );
        })}
      </ul>
      {session.phase === 'playing' && (
        <button type="button" className="btn btn--primary" onClick={onSubmit}>
          {LUCIA_TEXT.submit}
        </button>
      )}
      <div role="status" className="lucia__reply">
        {session.rejection && <RejectionReply key={session.rejection.attempt} rejection={session.rejection} tasks={incident.tasks} />}
      </div>
      <h3>{LUCIA_TEXT.newTerms}</h3>
      <TermList terms={incident.introduces} markNew />
      <details className="lucia__glossary">
        <summary>{LUCIA_TEXT.glossary}</summary>
        <TermList terms={[...session.known].sort(byName)} markNew={false} />
      </details>
      <div aria-live="polite">
        {incident.hints.slice(0, session.hintsShown).map((hint, index) => {
          const Line = index === incident.hints.length - 1 ? FocusedHintLine : HintLine;
          return <Line key={hint} number={index + 1} text={hint} />;
        })}
      </div>
      {session.hintsShown < incident.hints.length && (
        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>
      )}
    </section>
  );
}
```

`role="status"` siempre está montado: una región viva tiene que existir antes de su contenido. El `key` con `attempt` vuelve a montar la respuesta en cada envío, para que se anuncie otra vez (Review Focus 1).

- [ ] **Step 5: La pantalla sin reloj**

En `src/ui/incident/incident-screen.tsx`:

1. Borrar `import { useStabilityClock } from './use-stability-clock';` y la línea `useStabilityClock(dispatch);`.
2. La línea de `LuciaCard` pasa a:

```tsx
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
```

```bash
git rm src/ui/incident/use-stability-clock.ts
```

En `src/styles.css`:

1. Borrar la línea `.task progress { … }`.
2. Debajo de `.lucia__alert { … }`, agregar:

```css
.lucia__reply p { margin: 0.4rem 0; padding-left: 0.6rem; border-left: 3px solid var(--accent); }
```

El texto de la respuesta va en tinta y el bermellón queda en el borde. Así no se suma texto con el contraste bajo de E9.

- [ ] **Step 6: Comprobar que no quedó nada del reloj**

```bash
grep -rnE --include='*.ts' --include='*.tsx' "STABLE_MS|TICK_MS|taskMs|'tick'|useStabilityClock|use-stability-clock|isStable|advanceTasks|LUCIA_TEXT.steady|CLOSE_TIMEOUT_MS" src tests
```

Expected: sin resultados. Solo mira código (`*.ts`, `*.tsx`): `src/ui/incident/CLAUDE.md` todavía nombra `use-stability-clock` y lo reescribe la Tarea 10.

- [ ] **Step 7: Correr todo**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat(ui): close the incident with Enviar solución instead of a 3-second bar"
```

---

### Task 10: Documentación al día

**Files:**
- Modify: `src/copy/CLAUDE.md`, `src/levels/04-iaas/CLAUDE.md`, `src/game/CLAUDE.md`, `src/game/view/CLAUDE.md`, `src/ui/CLAUDE.md`, `src/ui/incident/CLAUDE.md`, `README.md`
- Modify: `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md` (línea de estado), `docs/plans/2026-10-08-follow-the-packet-followups.md` (estado, E2, E3 y B7)

- [ ] **Step 1: Guías de las carpetas que cambiaron**

`src/copy/CLAUDE.md` (reemplazar entero):

```markdown
# copy

Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap and notice screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- Each term has its official AWS name, as the English console shows it, and a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{inbound-rule|reglas de entrada}}` shows other words. An unknown tag throws. Pieces and chips show only the name or the short form (`unofficialNames`).
- Not here: logic that decides outcomes (`src/engine/`), incident content (`src/levels/`).
- Text follows `.claude/rules/rigorous-plain-copy.md`.
- May import: `@/engine`.
```

En `src/levels/04-iaas/CLAUDE.md`, la línea

```markdown
- Texts tag their terms (`{{security-group}}`) and use only terms introduced by this incident or an earlier one.
```

pasa a

```markdown
- Texts and chips use official AWS names (`.claude/rules/rigorous-plain-copy.md`), tag their terms (`{{security-group}}`) and use only terms introduced by this incident or an earlier one.
```

`src/game/CLAUDE.md` (reemplazar entero):

```markdown
# game

The session of one incident, as a pure reducer: the current world, the run of every flow, the tasks (done or not, read from the runs at once), the sent solution and Lucía's reply, hints, the explanation and the stars. What the map and the panels show lives in `view/`.

- No game clock: the session changes only with player actions; nothing here reads the clock, storage or the DOM.
- Not here: network rules (`src/engine/`), incident content and the world chain (`src/levels/`), drawing (`src/scene/`, `src/ui/`).
- May import: `@/engine`, `@/copy`, `@/levels`. Files inside import each other directly (`./x`, `./view/x`, `@/game/<folder>/x`).
```

`src/game/view/CLAUDE.md` (reemplazar entero):

```markdown
# game/view

What the map and the panels show, computed from the session and filtered by the terms the player knows: piece ids, piece labels and locks, a Security Group's rules named by chips, and the inspection box.

- Every piece kind declares its term (`PIECE_TERM`). Labels use the term's official name; the inspection of a piece or a packet starts with `INSPECTION_TEXT.whatIs`, the definition of its term (a packet's term is its ICMP message).
- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
```

`src/ui/CLAUDE.md` (reemplazar entero):

```markdown
# ui

Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), plus shared pieces (`stars.tsx`, `tagged-text.tsx`, `term-tip.tsx`).

- A term in a text shows its definition on hover, in a tooltip portaled to `document.body` and positioned with `@floating-ui/react-dom` (`term-tip.tsx`). Terms are not Tab stops. The inspection box renders its terms with `tips={false}`, because it does not take the mouse.
- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
```

`src/ui/incident/CLAUDE.md` (reemplazar entero):

```markdown
# ui/incident

The incident screen: Lucía's card (tasks, the "Enviar solución" button and her reply, new terms, the folded glossary and hints), the task card of a Security Group, the inspection box, Lucía's question and the result.

- State lives in the session reducer of `@/game`; there is no game clock.
- Effects live in `use-*.ts` hooks next to their first consumer.
- Not here: session state and what the panels show (`src/game/`), the map and its labels (`src/scene/`), visible Spanish text (`src/copy/`).
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
```

- [ ] **Step 2: README del proyecto**

En `README.md`, la línea de enlaces pasa a:

```markdown
Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md) · [incidents prototype](../../docs/plans/2026-10-08-follow-the-packet-live-incidents-prototype.md) · [official names and submit](../../docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md)
```

y la primera frase termina en «…incidents 04-01 and 04-02 are playable, with official AWS names defined on hover and an "Enviar solución" button.»

- [ ] **Step 3: Estado en el spec y en el backlog**

En el spec, la línea de estado pasa a:

```markdown
Fecha: 2026-10-08 · Estado: prototipo 04-01 y 04-02 construido (plan 2) con los cambios de rigor y «Enviar solución» (plan 3); falta la segunda prueba humana
```

En el backlog:

1. Debajo del estado del plan 2, agregar:

```markdown
> **Estado (plan 3, `docs/plans/2026-10-08-follow-the-packet-rigor-and-submit.md`):** hechos E2 (nombres oficiales de AWS, definición al pasar el mouse, glosario y la regla `rigorous-plain-copy`) y E3 («Enviar solución», sin la barra de 3 s). Siguen pendientes E4 a E10, A1 (llega con servidor3 en 04-04), A2 (04-07) y el bloque D.
```

2. En la tabla del bloque E, la columna "Destino" de E2 y de E3 pasa a `Hecho en el plan 3`.
3. La línea de B7 termina en «(la regla se reemplazó por `rigorous-plain-copy` en el plan 3)».

- [ ] **Step 4: Chequeo de links del repo y check final**

Desde la raíz del repo, correr el chequeo de links del `CLAUDE.md` raíz (sección "Chequeo de links").
Expected: `LINKS OK`.

Run (en `projects/follow-the-packet/`): `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src README.md ../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md
git commit -m "docs: describe official names, hover definitions and the submit button"
```

---

## Después del plan

- **Segunda prueba humana.** El estudiante juega 04-01 y 04-02 con `npm run dev` y dice si los nombres oficiales con su cuadrito y el botón «Enviar solución» le sirven. Lo que salga se anota en el bloque E del backlog antes del plan siguiente.
- **Lo que ningún test cubre:** si el cuadrito tapa algo que el jugador necesita ver mientras arma una regla. Se mira en la prueba humana.
- **Bloque D.** Si el estudiante adopta `prefer-radix`, el cuadrito puede pasar a `@radix-ui/react-tooltip`, que usa `@floating-ui/react-dom` por dentro. Antes habría que resolver que Radix espera un disparador que reciba el foco, y aquí los términos no son paradas del Tab.
- **Almacén personal.** Llevar `rigorous-plain-copy` al almacén de `~/dotfiles` lo decide el estudiante. No se propone sin preguntar.
