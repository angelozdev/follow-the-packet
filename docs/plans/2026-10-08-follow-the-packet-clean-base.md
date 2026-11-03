# Sigue el paquete · Plan 1 de 2: base limpia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el proyecto solo con las partes que el prototipo de incidentes en vivo conserva, ordenadas según las reglas del proyecto, con los controles de esas reglas corriendo en `npm run check` y con los errores del motor y del guardado arreglados.

**Architecture:**
1. Se borra el flujo viejo: la predicción, los 7 niveles, los paneles y el reducer de fases. Queda una app que solo muestra el roadmap.
2. Lo que queda se reparte en capas con barrels y el alias `@/`. El motor deja de escribir frases: devuelve códigos de motivo, y `src/copy/` los convierte en español.
3. Un `eslint.config.js` generado desde la tabla de capas, un script de estructura y jscpd hacen cumplir las reglas. Un test prueba que cada control salta.

**Tech Stack:** Vite 8, TypeScript 6.0.3, React 19, React Three Fiber 9, drei 10, zod 4, Vitest 5, Testing Library, Playwright, ESLint 10 + typescript-eslint 8, `@mantine/hooks` 9.7.1, `eslint-plugin-no-comments` 1.2.1, `eslint-plugin-check-file` 3.3.2, `jscpd` 5.0.16.

**Spec:** `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md` (sección "Orden de trabajo", pasos 1 y 2; tabla "Relación con el backlog"). Backlog: `docs/plans/2026-10-08-follow-the-packet-followups.md`. El plan 2 (prototipo) se escribe cuando este termine.

## Global Constraints

- **Rutas.** Carpeta del proyecto: `projects/follow-the-packet/`. Todas las rutas son relativas a ella, salvo las que empiezan por `docs/` (raíz del repo).
- **Rama.** `feat/live-incidents`, creada en la Tarea 1 a partir de `feat/follow-the-packet`.
- **Reglas.** Valen las 19 de `.claude/rules/`. Las más relevantes aquí:
  - `folder-structure`: capas, alias `@/`, barrels, sin `../`, tope de 12 archivos por carpeta, `CLAUDE.md` en cada carpeta.
  - `english-only`: código, nombres de tests, JSDoc y docs del proyecto en inglés. El texto visible en español vive solo en `src/copy/`.
  - `no-comments`: solo JSDoc en inglés de entrada y salida, más la directiva `// @vitest-environment jsdom`.
  - `pure-domain-core` y `no-raw-effects`.
  - `exact-dependency-versions`: dependencias solo con `npm install`; desde la Tarea 1 rige `save-exact`.
  - `user-event-for-interactions`.
- **Dependencias nuevas permitidas:** `@mantine/hooks@9.7.1`, `eslint-plugin-no-comments@1.2.1`, `eslint-plugin-check-file@3.3.2` y `jscpd@5.0.16`. Ninguna tiene scripts de instalación; se comprobó con `npm view` el 2026-10-08.
- **TypeScript se queda en 6.0.3**, porque typescript-eslint 8.71 acepta TypeScript menor que 6.1.
- **Desviación aceptada en este plan.** Las fronteras entre capas se hacen con la regla core `no-restricted-imports`, generada desde la tabla de capas, y no con `eslint-plugin-boundaries`.
  - Motivo: es igual de estricta y no suma una dependencia ni un resolver de alias.
  - `scripts/eslint-config.test.ts` prueba que funciona.
  - La Tarea 10 deja la nota en `az-rules.json`.
- **"Listo"** = `npm run check` pasa entero.
- **Commits.** Los pasos "Commit" se ejecutan solo si el estudiante aprobó commits por tarea al empezar la ejecución. Si no, se omiten.
- Ningún comando `aws`.

## Review Focus

1. **Un enlace viejo a un nivel** (`#/level/04-01`) muestra "Nivel no encontrado" con un enlace que vuelve al roadmap, sin romper la app. Tests: Tarea 2 (`app.test.tsx` y e2e).
2. **El progreso guardado por la versión 1** (`{"04-01":3,"04-07":2}`) sigue cargando entero. Test: Tarea 6.
3. **En `scene/` y `ui/`, un `import type` desde `@/engine` pasa el lint, y un import de valor falla.** Test: Tarea 8.
4. **Archivos ocultos como `.DS_Store`** no cuentan para el tope de 12 archivos. Test: Tarea 3.
5. **Un flujo pedido por nombre DNS** cuenta igual que el mismo flujo por la IP a la que resuelve: no aparece como apertura de más. Test: Tarea 4.

## Árbol al terminar

```
projects/follow-the-packet/
├── .npmrc  .jscpd.json  eslint.config.js  vite.config.ts  tsconfig.json  package.json  README.md
├── scripts/
│   ├── check-structure.ts  check-structure.test.ts  eslint-config.test.ts
├── src/
│   ├── CLAUDE.md  app.tsx  app.test.tsx  main.tsx  styles.css
│   ├── engine/            CLAUDE.md  index.ts
│   │   ├── network/       CLAUDE.md  types.ts  schema.ts  schema.test.ts  cidr.ts  cidr.test.ts  dns.ts  dns.test.ts
│   │   │                  actions.ts  actions.test.ts  app-target.ts  app-target.test.ts
│   │   ├── simulation/    CLAUDE.md  trace.ts  context.ts  simulate.ts  simulate.test.ts  rules.ts  rules.test.ts
│   │   │   │              checkpoints.ts  checkpoints.test.ts
│   │   │   └── stages/    CLAUDE.md  dns.ts  route.ts  sg-out.ts  sg-in.ts  linux.ts  reply.ts
│   │   └── exposure/      CLAUDE.md  exposure.ts  exposure.test.ts
│   ├── copy/              CLAUDE.md  index.ts  reasons.ts  reasons.test.ts  rule-labels.ts  rule-labels.test.ts
│   │                      packet-labels.ts  packet-labels.test.ts  ui.ts
│   ├── levels/            CLAUDE.md  index.ts  level-entry.ts  registry.ts  chapters.ts  chapters.test.ts
│   ├── storage/           CLAUDE.md  index.ts  progress.ts  progress.test.ts
│   ├── scene/             CLAUDE.md  index.ts  game-scene.tsx  layout.ts  layout.test.ts  edges.ts  edges.test.ts
│   │                      html-layer.ts  theme.ts  pieces.tsx
│   ├── ui/                CLAUDE.md  index.ts  roadmap.tsx  not-found.tsx
│   └── testing/           CLAUDE.md  index.ts  fixtures.ts  repo.ts  setup.ts
└── tests/
    ├── CLAUDE.md
    └── e2e/               CLAUDE.md  roadmap.spec.ts
```

Capas y lo que cada una puede importar (la misma tabla que usa `eslint.config.js`):

| Capa | Puede importar |
|------|----------------|
| `engine` | nada de otras capas; ni React, three, `@react-three/*`, `@mantine/*`, almacenamiento del navegador, `Date.now()` ni `Math.random()` |
| `copy` | `engine` |
| `levels` | `engine`, `copy` |
| `game` (llega en el plan 2), `scene`, `storage` | `engine`, `copy`, `levels` (pares entre sí: no) |
| `ui` | `engine`, `copy`, `levels`, `game`, `scene`, `storage` |
| `testing` | `engine`, `copy`, `levels`; solo lo importan los tests |
| raíz de `src/` (`app.tsx`, `main.tsx`) | todas las capas |

`scene/` y `ui/` solo importan tipos desde `@/engine`. Entre capas se importa el barrel (`@/engine`). Dentro de una capa, el archivo directo: `./x` en la misma carpeta, `@/engine/<carpeta>/x` entre subcarpetas. Los tests pueden importar `@/testing` y rutas profundas de cualquier capa permitida, por ejemplo para `vi.mock`.

---

### Task 1: Rama y versiones exactas

**Files:**
- Create: `.npmrc`
- Modify: `package.json` (rangos `^` y `~` → versiones instaladas), `package-lock.json`

**Interfaces:**
- Consumes: nada.
- Produces: `.npmrc` con `save-exact=true`. Desde aquí, todo `npm install` fija la versión exacta.

- [ ] **Step 1: Crear la rama**

```bash
git switch feat/follow-the-packet
git switch -c feat/live-incidents
```

- [ ] **Step 2: Comprobar el punto de partida**

Run: `grep -cE '"[\^~]' package.json`
Expected: `25` (hay rangos).

- [ ] **Step 3: Activar save-exact**

```bash
printf 'save-exact=true\n' > .npmrc
```

- [ ] **Step 4: Reemplazar cada rango por la versión instalada**

No se escribe ningún número a mano: cada versión se lee de `node_modules`.

```bash
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));for(const k of ['dependencies','devDependencies'])for(const n of Object.keys(p[k]))p[k][n]=require('./node_modules/'+n+'/package.json').version;fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
npm install
```

- [ ] **Step 5: Verificar**

Run: `grep -cE '"[\^~]' package.json; grep '"typescript"' package.json`
Expected: `0` y `"typescript": "6.0.3",`

Run: `npm run check`
Expected: PASS (nada más cambió).

- [ ] **Step 6: Commit**

```bash
git add .npmrc package.json package-lock.json
git commit -m "build: pin exact dependency versions"
```

---

### Task 2: Quitar el flujo viejo

**Files:**
- Delete: `src/game/`, `src/levels/04-iaas/`, `src/ui/attacker/`, `src/ui/defender/`, `src/ui/shared/{BriefPanel,LevelScreen,LevelScreen.test,PredictPanel,ResultPanel,ToolsPanel,TraceList}.tsx`, `src/ui/shared/usePrefersReducedMotion.ts`, `src/levels/{schema,evaluate,evaluate.test,levels.test}.ts`, `src/scene/{PacketRun,overlays}.tsx`, `src/engine/{scoring,scoring.test}.ts`, `tests/e2e/game.spec.ts`
- Create: `src/levels/level-entry.ts`, `tests/e2e/roadmap.spec.ts`
- Modify: `src/App.tsx`, `src/App.test.tsx`, `src/levels/registry.ts`, `src/levels/apply.ts`, `src/storage/progress.ts`, `src/storage/progress.test.ts`, `src/ui/shared/Roadmap.tsx`, `src/scene/GameScene.tsx`, `src/scene/pieces.tsx`, `src/format.ts`, `src/format.test.ts`, `src/engine/checkpoints.ts`, `src/engine/checkpoints.test.ts`, `src/styles.css`, `package.json`

**Interfaces:**
- Consumes: Tarea 1.
- Produces:
  - `LevelEntry`, en `src/levels/level-entry.ts`:
    ```ts
    export type LevelRole = 'defender' | 'attacker';
    export interface LevelEntry { id: string; chapter: number; order: number; title: string; role: LevelRole }
    ```
  - `LEVELS: LevelEntry[]` (vacío hasta el plan 2).
  - `networkActionSchema`, `NetworkAction`, `applyAction(net, action)` y `materialize(packet, net)` en `src/levels/apply.ts`.
  - `GameScene({ network })`.

- [ ] **Step 1: Escribir los tests de la app nueva (fallan)**

`src/App.test.tsx` completo:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

const CHAPTER_COUNT = 20;

afterEach(() => {
  window.location.hash = '';
  localStorage.clear();
});

describe('App', () => {
  it('shows the roadmap with every chapter coming soon', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente')).toHaveLength(CHAPTER_COUNT);
  });

  it('an old level link shows "Nivel no encontrado" with a link back', () => {
    window.location.hash = '#/level/04-01';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Nivel no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al roadmap' })).toHaveAttribute('href', '#/');
  });

  it('corrupt saved progress does not break the roadmap', () => {
    localStorage.setItem('follow-the-packet:progress:v1', '{broken');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
  });
});
```

`tests/e2e/roadmap.spec.ts` completo:

```ts
import { expect, test, type Page } from '@playwright/test';

const CHAPTER_COUNT = 20;
const FONT_LOAD_ERROR = /Failed to load resource/;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !FONT_LOAD_ERROR.test(message.text())) errors.push(message.text());
  });
  return errors;
}

test('the roadmap loads every chapter without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('li.chapter--soon')).toHaveCount(CHAPTER_COUNT);
  expect(errors).toEqual([]);
});

test('an old level link leads back to the roadmap', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('heading', { name: 'Nivel no encontrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
});
```

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL. La primera prueba cuenta 19 "Próximamente", porque el capítulo 4 todavía tiene niveles.

- [ ] **Step 2: Borrar el flujo viejo**

```bash
git rm -r -q src/game src/levels/04-iaas src/ui/attacker src/ui/defender
git rm -q src/ui/shared/BriefPanel.tsx src/ui/shared/LevelScreen.tsx src/ui/shared/LevelScreen.test.tsx src/ui/shared/PredictPanel.tsx src/ui/shared/ResultPanel.tsx src/ui/shared/ToolsPanel.tsx src/ui/shared/TraceList.tsx src/ui/shared/usePrefersReducedMotion.ts
git rm -q src/levels/schema.ts src/levels/evaluate.ts src/levels/evaluate.test.ts src/levels/levels.test.ts
git rm -q src/scene/PacketRun.tsx src/scene/overlays.tsx src/engine/scoring.ts src/engine/scoring.test.ts tests/e2e/game.spec.ts
```

- [ ] **Step 3: Contrato mínimo de nivel y registro vacío**

`src/levels/level-entry.ts`:

```ts
export type LevelRole = 'defender' | 'attacker';

export interface LevelEntry {
  id: string;
  chapter: number;
  order: number;
  title: string;
  role: LevelRole;
}
```

`src/levels/registry.ts` completo:

```ts
import type { LevelEntry } from './level-entry';

const modules = import.meta.glob<{ default: LevelEntry }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const LEVELS: LevelEntry[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);
```

- [ ] **Step 4: Las acciones sobre la red quedan en `apply.ts`**

`src/levels/apply.ts` completo. El esquema de acciones viene de `levels/schema.ts`, que se borró; los cuerpos de `applyAction` y `materialize` no cambian.

```ts
import { z } from 'zod';
import { ruleSchema } from '../engine/schema';
import type { Network, PacketSpec } from '../engine/types';

export const networkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), sgId: z.string().min(1), rule: ruleSchema }),
  z.object({ type: z.literal('removeRule'), sgId: z.string().min(1), ruleId: z.string().min(1) }),
  z.object({ type: z.literal('setAppTarget'), instanceId: z.string().min(1), target: z.string().min(1) }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), instanceId: z.string().min(1), value: z.boolean() }),
]);

export type NetworkAction = z.infer<typeof networkActionSchema>;

export function applyAction(net: Network, action: NetworkAction): Network {
  switch (action.type) {
    case 'addRule':
      return {
        ...net,
        securityGroups: net.securityGroups.map((g) => (g.id === action.sgId ? { ...g, inbound: [...g.inbound, action.rule] } : g)),
      };
    case 'removeRule':
      return {
        ...net,
        securityGroups: net.securityGroups.map((g) =>
          g.id === action.sgId ? { ...g, inbound: g.inbound.filter((r) => r.id !== action.ruleId) } : g,
        ),
      };
    case 'setAppTarget':
      return { ...net, instances: net.instances.map((i) => (i.id === action.instanceId ? { ...i, appTarget: action.target } : i)) };
    case 'setIgnoreIcmpEcho':
      return {
        ...net,
        instances: net.instances.map((i) =>
          i.id === action.instanceId ? { ...i, linux: { ...i.linux, ignoreIcmpEcho: action.value } } : i,
        ),
      };
  }
}

export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== '@appTarget') return packet;
  const from = packet.from;
  const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error('@appTarget needs a source instance with an appTarget');
  return { ...packet, to: source.appTarget };
}
```

- [ ] **Step 5: Guardado y roadmap usan `LevelEntry`**

En `src/storage/progress.ts`:
- Cambia `import type { Level } from '../levels/schema';` por `import type { LevelEntry } from '../levels/level-entry';`.
- La firma de `isUnlocked` queda así: `export function isUnlocked(level: LevelEntry, progress: Progress, chapterLevels: LevelEntry[]): boolean {`.

En `src/storage/progress.test.ts`:
- Cambia `import { LEVELS } from '../levels/registry';` por `import type { LevelEntry } from '../levels/level-entry';`.
- Reemplaza la última prueba por esta:

```ts
  it('a level unlocks when the previous one in its chapter has a star', () => {
    const chapter: LevelEntry[] = [
      { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
      { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
    ];
    expect(isUnlocked(chapter[0], {}, chapter)).toBe(true);
    expect(isUnlocked(chapter[1], {}, chapter)).toBe(false);
    expect(isUnlocked(chapter[1], { '04-01': 1 }, chapter)).toBe(true);
  });
```

En `src/ui/shared/Roadmap.tsx`:
- Cambia `import type { Level } from '../../levels/schema';` por `import type { LevelEntry } from '../../levels/level-entry';`.
- Cambia `levels: Level[]` por `levels: LevelEntry[]`.

- [ ] **Step 6: Escena sin predicción ni recorrido**

`src/scene/GameScene.tsx` completo:

```tsx
import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import type { Network } from '../engine/types';
import { HtmlLayerContext } from './htmlLayer';
import { computeLayout } from './layout';
import { ActorMark, Barrier, Building, Gateway, Road, Sheet, Zone } from './pieces';

export function GameScene({ network }: { network: Network }) {
  const layout = computeLayout(network);
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Canvas
        orthographic
        camera={{ position: [14, 14, 14], zoom: 38, near: 0.1, far: 500 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <HtmlLayerContext.Provider value={htmlLayer}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} />
          <MapControls enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
          <Sheet layout={layout} />
          {network.subnets.map((s) => (
            <Zone key={s.id} spot={layout.subnets[s.id]} />
          ))}
          <Road layout={layout} />
          <Gateway position={layout.igw} />
          {network.instances.map((i) => (
            <group key={i.id}>
              <Building spot={layout.instances[i.id]} name={i.name} />
              <Barrier spot={layout.instances[i.id]} />
            </group>
          ))}
          {network.actors.map((a) => (
            <ActorMark key={a.id} position={layout.actors[a.id]} actor={a} />
          ))}
          <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
```

En `src/scene/pieces.tsx`, borra la función `PredictRing` completa (el último export del archivo).

- [ ] **Step 7: Quitar lo que solo servía al flujo viejo**

En `src/format.ts`:
- Borra `findRule`, `formatSolution` y la línea `import type { Level } from './levels/schema';`.
- Quita `Rule` del import de tipos de `./engine/types`.

En `src/format.test.ts`:
- Borra la prueba `describe la solución de un nivel`.
- Borra los imports `formatSolution` y `level01`.

En `src/engine/checkpoints.ts`, borra la función `sameCheckpoint`. En `src/engine/checkpoints.test.ts`, borra su import y su bloque `describe('sameCheckpoint', ...)`.

En `src/styles.css`, borra las reglas de estos selectores; todo lo demás queda igual:
- formularios y paneles: `.card`, `fieldset.card`, `legend`, `.field`, `.field label`, `select { … }`, `.choices`, `.actions`;
- tablas y terminal: `.rules`, `.rules th`, `.rules td`, `.terminal`;
- desplegables: `details`, `summary`;
- pantalla de nivel: `.level`, `.stage`, `.side`, `.side__top`, `.eyebrow`, `.objective`, `.stars`, `.stars span[aria-hidden]`, `.checklist`, `.hints`, `.hint`;
- recorrido: `.trace`, `.trace__step--drop, .trace__step--reject`, `.trace__outcome`;
- sellos y guardia: `.stamp`, `.stamp--pass`, `.stamp--drop`, `.guard`, `.guard__title`, `.guard__row`.

- [ ] **Step 8: La app nueva, con `useHash` de `@mantine/hooks`**

```bash
npm install @mantine/hooks@9.7.1
```

`src/App.tsx` completo:

```tsx
import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { LEVELS } from './levels/registry';
import { loadProgress } from './storage/progress';
import { Roadmap } from './ui/shared/Roadmap';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  if (levelId === undefined) return <Roadmap levels={LEVELS} progress={progress} />;
  return (
    <main className="page">
      <h1>Nivel no encontrado</h1>
      <p>No existe el nivel {levelId}.</p>
      <a href="#/">Volver al roadmap</a>
    </main>
  );
}
```

- [ ] **Step 9: Verificar**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (3 pruebas).

Run: `npm run check`
Expected: PASS. Si `tsc` señala un import a un archivo borrado, ese import pertenece al flujo viejo: quítalo.

- [ ] **Step 10: Commit**

```bash
git add -A src tests package.json package-lock.json
git commit -m "refactor: remove the prediction-based level flow"
```

---

### Task 3: Capas, alias `@/`, barrels, guías y script de estructura

**Files:**
- Create: `scripts/check-structure.ts`, `scripts/check-structure.test.ts`, `src/engine/index.ts`, `src/engine/simulation/trace.ts`, `src/engine/network/actions.test.ts`, `src/engine/network/app-target.ts`, `src/engine/network/app-target.test.ts`, `src/copy/index.ts`, `src/copy/ui.ts`, `src/copy/rule-labels.ts`, `src/copy/rule-labels.test.ts`, `src/copy/packet-labels.ts`, `src/copy/packet-labels.test.ts`, `src/levels/index.ts`, `src/storage/index.ts`, `src/scene/index.ts`, `src/ui/index.ts`, `src/ui/not-found.tsx`, `src/testing/index.ts`, y un `CLAUDE.md` en cada carpeta de `src/` y `tests/`
- Move: comandos `git mv` del Step 3
- Modify: `tsconfig.json`, `vite.config.ts`, `package.json`, todos los imports de `src/`

**Interfaces:**
- Consumes: `LevelEntry`, `LEVELS`, `networkActionSchema`, `applyAction`, `materialize` y `GameScene` (Tarea 2).
- Produces:
  - **Barrels:**
    - `@/engine`: `APP_TARGET`, `materialize`, `applyAction`, `networkActionSchema`, `describePacket`, `deathPoint`, `simulate`, `extraOpenings`, `reachesHost` y los tipos `NetworkAction`, `Actor`, `Endpoint`, `Instance`, `Network`, `PacketSpec`, `Rule`, `RulePeer`, `RuleWhat`, `SecurityGroup`, `Subnet`, `Checkpoint`, `Outcome`, `Step`, `Trace`.
    - `@/copy`: `formatWhat`, `formatPeer`, `endpointName`, `formatPacket`, `OUTCOME_TEXT`, `ROADMAP_TEXT`, `NOT_FOUND_TEXT`, `SCENE_TEXT`.
    - `@/levels`: `CHAPTERS`, `LEVELS` y los tipos `Chapter`, `LevelEntry`, `LevelRole`.
    - `@/storage`: `isUnlocked`, `loadProgress`, `saveStars` y el tipo `Progress`.
    - `@/scene`: `GameScene`.
    - `@/ui`: `Roadmap`, `NotFound`.
    - `@/testing`: fixtures y lectores de `syllabus.md`.
  - **Script:** `findStructureProblems(projectRoot: string, roots?: string[]): string[]`, junto con `MAX_FILES_PER_FOLDER = 12` y `GUIDE_FILE = 'CLAUDE.md'`.
  - Los barrels exponen la API pública de cada capa: lo que hoy usan otras capas más lo que el plan 2 consume (`GameScene`, `saveStars`, `simulate`…).

- [ ] **Step 1: Test del script de estructura (falla)**

`scripts/check-structure.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_FILE, MAX_FILES_PER_FOLDER, findStructureProblems } from './check-structure';

function project(folders: Record<string, string[]>): string {
  const root = mkdtempSync(join(tmpdir(), 'structure-'));
  for (const [folder, files] of Object.entries(folders)) {
    mkdirSync(join(root, folder), { recursive: true });
    for (const file of files) writeFileSync(join(root, folder, file), '');
  }
  return root;
}

const numbered = (count: number) => Array.from({ length: count }, (_, index) => `file-${index}.ts`);

describe('findStructureProblems', () => {
  it('accepts folders with a guide and up to the file cap', () => {
    const root = project({ src: [GUIDE_FILE, 'main.tsx'], 'src/engine': [GUIDE_FILE, ...numbered(MAX_FILES_PER_FOLDER)] });
    expect(findStructureProblems(root)).toEqual([]);
  });

  it('reports a folder over the cap', () => {
    const root = project({ src: [GUIDE_FILE, ...numbered(MAX_FILES_PER_FOLDER + 1)] });
    expect(findStructureProblems(root)).toEqual([`src: ${MAX_FILES_PER_FOLDER + 1} files (max ${MAX_FILES_PER_FOLDER})`]);
  });

  it('reports a folder without its guide', () => {
    const root = project({ src: [GUIDE_FILE], 'src/ui': ['roadmap.tsx'] });
    expect(findStructureProblems(root)).toEqual([`src/ui: missing ${GUIDE_FILE}`]);
  });

  it('ignores hidden files such as .DS_Store', () => {
    const root = project({ src: [GUIDE_FILE, '.DS_Store', ...numbered(MAX_FILES_PER_FOLDER)] });
    expect(findStructureProblems(root)).toEqual([]);
  });

  it('skips roots that do not exist', () => {
    const root = project({ src: [GUIDE_FILE] });
    expect(findStructureProblems(root, ['src', 'tests'])).toEqual([]);
  });
});
```

En `vite.config.ts`, agrega `'scripts/**/*.test.ts'` a `test.include`:

```ts
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
```

Run: `npx vitest run scripts/check-structure.test.ts`
Expected: FAIL con "Failed to resolve import ./check-structure".

- [ ] **Step 2: Implementar el script**

`scripts/check-structure.ts`:

```ts
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_FILES_PER_FOLDER = 12;
export const GUIDE_FILE = 'CLAUDE.md';
const CHECKED_ROOTS = ['src', 'tests'];

/** Returns one line per folder under the given roots that exceeds the file cap or lacks its guide file. */
export function findStructureProblems(projectRoot: string, roots: string[] = CHECKED_ROOTS): string[] {
  const problems: string[] = [];
  const visit = (folder: string) => {
    const entries = readdirSync(folder, { withFileTypes: true }).filter((entry) => !entry.name.startsWith('.'));
    const name = relative(projectRoot, folder);
    const files = entries.filter((entry) => entry.isFile() && entry.name !== GUIDE_FILE);
    if (files.length > MAX_FILES_PER_FOLDER) problems.push(`${name}: ${files.length} files (max ${MAX_FILES_PER_FOLDER})`);
    if (!entries.some((entry) => entry.isFile() && entry.name === GUIDE_FILE)) problems.push(`${name}: missing ${GUIDE_FILE}`);
    for (const entry of entries) if (entry.isDirectory()) visit(join(folder, entry.name));
  };
  for (const root of roots) {
    const path = join(projectRoot, root);
    if (existsSync(path)) visit(path);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = findStructureProblems(process.cwd());
  for (const problem of problems) console.error(problem);
  process.exitCode = problems.length > 0 ? 1 : 0;
}
```

En `package.json`, agrega el script `structure` y súmalo a `check`:

```json
    "structure": "node scripts/check-structure.ts",
    "check": "npm run typecheck && npm run lint && npm run structure && npm run test && npm run e2e"
```

En `tsconfig.json`, agrega `"scripts"` a `include` y el alias en `compilerOptions`:

```json
    "paths": { "@/*": ["./src/*"] }
```
```json
  "include": ["src", "tests", "scripts", "vite.config.ts", "playwright.config.ts"]
```

Run: `npx vitest run scripts/check-structure.test.ts`
Expected: PASS (5 pruebas).

Run: `npm run structure`
Expected: FAIL, con una línea `missing CLAUDE.md` por carpeta. Es lo esperado hasta el Step 7.

- [ ] **Step 3: Mover los archivos a sus capas**

```bash
mkdir -p src/engine/network src/engine/simulation/stages src/engine/exposure src/copy src/testing src/ui
git mv src/App.tsx src/app.tsx
git mv src/App.test.tsx src/app.test.tsx
git mv src/test-setup.ts src/testing/setup.ts
git mv src/test-utils/repo.ts src/testing/repo.ts
git mv src/engine/fixtures.ts src/testing/fixtures.ts
git mv src/engine/types.ts src/engine/network/types.ts
for f in schema schema.test cidr cidr.test dns dns.test; do git mv src/engine/$f.ts src/engine/network/$f.ts; done
git mv src/levels/apply.ts src/engine/network/actions.ts
for f in rules rules.test simulate simulate.test checkpoints checkpoints.test; do git mv src/engine/$f.ts src/engine/simulation/$f.ts; done
git mv src/engine/stages/context.ts src/engine/simulation/context.ts
for f in dns route sg-out sg-in linux reply; do git mv src/engine/stages/$f.ts src/engine/simulation/stages/$f.ts; done
git mv src/engine/exposure.ts src/engine/exposure/exposure.ts
git mv src/engine/exposure.test.ts src/engine/exposure/exposure.test.ts
git mv src/scene/GameScene.tsx src/scene/game-scene.tsx
git mv src/scene/htmlLayer.ts src/scene/html-layer.ts
git mv src/ui/shared/Roadmap.tsx src/ui/roadmap.tsx
git rm -q src/format.ts src/format.test.ts
```

`format.ts` se reparte en `src/copy/` en el Step 5. Su contenido actual está en `git show HEAD:projects/follow-the-packet/src/format.ts`.

Con `setup.ts` ya en `src/testing/`, `vite.config.ts` completo queda así (alias `@/` y la nueva ruta del setup):

```ts
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['./src/testing/setup.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Repartir los tipos y las acciones del motor**

`src/engine/simulation/trace.ts`, con los tipos de recorrido que salen de `network/types.ts`:

```ts
export type StepStage = 'dns' | 'route' | 'nat' | 'sg-out' | 'sg-in' | 'linux' | 'reply';
export type Verdict = 'pass' | 'drop' | 'reject' | 'info';
export type CheckpointStage = Exclude<StepStage, 'nat'>;

export interface Checkpoint {
  stage: CheckpointStage;
  at: string;
}

export interface RuleCheck {
  sgId: string;
  ruleId: string;
  what: boolean;
  from: boolean;
}

export interface Step {
  stage: StepStage;
  at: string;
  verdict: Verdict;
  reason: string;
  checks?: RuleCheck[];
}

export type Outcome = 'replied' | 'timeout' | 'refused' | 'arrived-no-reply' | 'unresolved';

export interface TcpdumpLine {
  instanceId: string;
  direction: 'In' | 'Out';
  src: string;
  dst: string;
  summary: string;
}

export interface Trace {
  steps: Step[];
  outcome: Outcome;
  resolvedIp: string | null;
  destinationId: string | null;
  effectiveSource: string;
  tcpdump: TcpdumpLine[];
}
```

`src/engine/network/types.ts` completo:

```ts
import type { z } from 'zod';
import type {
  actorSchema,
  endpointSchema,
  instanceSchema,
  networkSchema,
  packetSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
  securityGroupSchema,
  subnetSchema,
} from './schema';

export type RuleWhat = z.infer<typeof ruleWhatSchema>;
export type RulePeer = z.infer<typeof rulePeerSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type SecurityGroup = z.infer<typeof securityGroupSchema>;
export type Instance = z.infer<typeof instanceSchema>;
export type Subnet = z.infer<typeof subnetSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type Network = z.infer<typeof networkSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type PacketSpec = z.infer<typeof packetSchema>;
```

En `src/engine/network/schema.ts`, borra `checkpointSchema` (el último export).

`src/engine/network/actions.ts` se queda con `networkActionSchema`, `NetworkAction` y `applyAction`. Sus imports quedan así:

```ts
import { z } from 'zod';
import { ruleSchema } from './schema';
import type { Network } from './types';
```

Mueve `materialize` a `src/engine/network/app-target.ts`:

```ts
import type { Network, PacketSpec } from './types';

export const APP_TARGET = '@appTarget';

export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== APP_TARGET) return packet;
  const from = packet.from;
  const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error(`${APP_TARGET} needs a source instance with an appTarget`);
  return { ...packet, to: source.appTarget };
}
```

`src/engine/network/actions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net } from '@/testing';
import { applyAction } from './actions';

const inboundIds = (net: ReturnType<typeof lab03Net>, sgId: string) => net.securityGroups.find((g) => g.id === sgId)?.inbound.map((r) => r.id);

describe('applyAction', () => {
  it('adds and removes inbound rules', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', sgId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1') });
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2', 'echo']);
    const removed = applyAction(added, { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
    expect(inboundIds(removed, 'sg-servidor2')).toEqual(['echo']);
  });

  it('changes an app target and the Linux echo setting', () => {
    const targeted = applyAction(lab03Net(), { type: 'setAppTarget', instanceId: 'servidor1', target: '172.31.38.97' });
    expect(targeted.instances.find((i) => i.id === 'servidor1')?.appTarget).toBe('172.31.38.97');
    const ignoring = applyAction(lab03Net(), { type: 'setIgnoreIcmpEcho', instanceId: 'servidor2', value: true });
    expect(ignoring.instances.find((i) => i.id === 'servidor2')?.linux.ignoreIcmpEcho).toBe(true);
  });
});
```

`src/engine/network/app-target.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { inst, lab03Net, ping, withInstance } from '@/testing';
import { APP_TARGET, materialize } from './app-target';

describe('materialize', () => {
  it('replaces the app target placeholder with the target of the source instance', () => {
    const net = withInstance(lab03Net(), 'servidor1', { appTarget: '172.31.38.97' });
    expect(materialize(ping(inst('servidor1'), APP_TARGET), net).to).toBe('172.31.38.97');
  });

  it('leaves other packets untouched', () => {
    const packet = ping(inst('servidor1'), '172.31.38.97');
    expect(materialize(packet, lab03Net())).toBe(packet);
  });

  it('fails when the source instance has no app target', () => {
    expect(() => materialize(ping(inst('servidor1'), APP_TARGET), lab03Net())).toThrow(APP_TARGET);
  });
});
```

- [ ] **Step 5: Texto visible a `src/copy/`**

`src/copy/rule-labels.ts`. Las funciones `formatWhat` y `formatPeer` salen de `format.ts` sin cambiar su cuerpo:

```ts
import type { Network, RulePeer, RuleWhat } from '@/engine';

export function formatWhat(what: RuleWhat): string {
  switch (what.kind) {
    case 'all':
      return 'Todo el tráfico';
    case 'tcp':
    case 'udp':
      return `${what.kind.toUpperCase()} ${what.fromPort === what.toPort ? what.fromPort : `${what.fromPort}-${what.toPort}`}`;
    case 'icmp':
      return what.icmpType === 'all' ? 'ICMP · todos los tipos' : what.icmpType === 8 ? 'ICMP · Echo Request' : 'ICMP · Echo Reply';
  }
}

export function formatPeer(peer: RulePeer, net: Network): string {
  if (peer.kind === 'cidr') return peer.cidr;
  return `SG ${net.securityGroups.find((g) => g.id === peer.sgId)?.name ?? peer.sgId}`;
}
```

`src/copy/packet-labels.ts`:

```ts
import { APP_TARGET, type Endpoint, type Network, type Outcome, type PacketSpec } from '@/engine';

export function endpointName(e: Endpoint, net: Network): string {
  if (e.kind === 'instance') return net.instances.find((i) => i.id === e.id)?.name ?? e.id;
  return net.actors.find((a) => a.id === e.id)?.name ?? 'Internet';
}

export function formatPacket(p: PacketSpec, net: Network): string {
  const service = p.protocol === 'icmp' ? (p.icmpType === 8 ? 'ping' : 'ICMP Echo Reply') : `${p.protocol.toUpperCase()} ${p.port}`;
  const to = p.to === APP_TARGET ? 'el destino de su app' : p.to;
  return `${service} de ${endpointName(p.from, net)} a ${to}`;
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  replied: 'Respondió.',
  timeout: 'Timeout: nadie contestó.',
  refused: 'Connection refused: llegó, pero nada escuchaba.',
  'arrived-no-reply': 'Llegó, pero nadie respondió.',
  unresolved: 'El nombre no se pudo resolver.',
};
```

`src/copy/ui.ts`. No importa nada: `copy` no puede importar `levels`, así que `ROADMAP_TEXT.role` usa las claves literales del rol.

```ts
export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Un capítulo por módulo del curso. Cada nivel repasa una lección jugando.',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOT_FOUND_TEXT = {
  title: 'Nivel no encontrado',
  body: (levelId: string) => `No existe el nivel ${levelId}.`,
  back: 'Volver al roadmap',
} as const;

export const SCENE_TEXT = {
  gateway: 'internet gateway',
} as const;
```

`src/copy/rule-labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { lab03Net } from '@/testing';
import { formatPeer, formatWhat } from './rule-labels';

describe('rule labels', () => {
  it('describes what a rule allows in plain words', () => {
    expect(formatWhat({ kind: 'icmp', icmpType: 8 })).toBe('ICMP · Echo Request');
    expect(formatWhat({ kind: 'icmp', icmpType: 0 })).toBe('ICMP · Echo Reply');
    expect(formatWhat({ kind: 'tcp', fromPort: 22, toPort: 22 })).toBe('TCP 22');
    expect(formatWhat({ kind: 'all' })).toBe('Todo el tráfico');
  });

  it('describes where a rule allows from, by security group name or by CIDR', () => {
    const net = lab03Net();
    expect(formatPeer({ kind: 'sg', sgId: 'sg-servidor1' }, net)).toBe('SG servidor1');
    expect(formatPeer({ kind: 'cidr', cidr: '0.0.0.0/0' }, net)).toBe('0.0.0.0/0');
  });
});
```

`src/copy/packet-labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from '@/testing';
import { formatPacket } from './packet-labels';

describe('packet labels', () => {
  it('describes a packet by service, source name and destination', () => {
    const net = lab03Net();
    expect(formatPacket(ping(inst('servidor1'), '172.31.38.97'), net)).toBe('ping de servidor1 a 172.31.38.97');
    expect(formatPacket(ping(actor('probe-internet'), '34.244.254.100'), net)).toBe('ping de Internet a 34.244.254.100');
  });
});
```

`src/ui/not-found.tsx`:

```tsx
import { NOT_FOUND_TEXT } from '@/copy';

export function NotFound({ levelId }: { levelId: string }) {
  return (
    <main className="page">
      <h1>{NOT_FOUND_TEXT.title}</h1>
      <p>{NOT_FOUND_TEXT.body(levelId)}</p>
      <a href="#/">{NOT_FOUND_TEXT.back}</a>
    </main>
  );
}
```

`src/ui/roadmap.tsx` completo:

```tsx
import { ROADMAP_TEXT } from '@/copy';
import { CHAPTERS, type LevelEntry } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';

function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(3 - count)}
      </span>
      <span className="sr-only">{ROADMAP_TEXT.starsOf(count)}</span>
    </span>
  );
}

export function Roadmap({ levels, progress }: { levels: LevelEntry[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>{ROADMAP_TEXT.title}</h1>
        <p className="lede">{ROADMAP_TEXT.lede}</p>
      </header>
      <ol className="chapters">
        {CHAPTERS.map((chapter) => {
          const own = levels.filter((l) => l.chapter === chapter.number);
          const done = own.filter((l) => (progress[l.id] ?? 0) > 0).length;
          return (
            <li key={chapter.number} className={own.length > 0 ? 'chapter' : 'chapter chapter--soon'}>
              <div className="chapter__head">
                <span className="chapter__num">{chapter.number}</span>
                <h2>{chapter.title}</h2>
                <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : ROADMAP_TEXT.soon}</span>
              </div>
              {own.length > 0 && (
                <ol className="levels">
                  {own.map((level) => {
                    const label = `${level.order}. ${level.title}`;
                    return (
                      <li key={level.id} data-level-id={level.id} className="level-item">
                        {isUnlocked(level, progress, own) ? (
                          <a href={`#/level/${level.id}`}>{label}</a>
                        ) : (
                          <span className="locked" aria-disabled="true">
                            {label} {ROADMAP_TEXT.locked}
                          </span>
                        )}
                        <span className="role">{ROADMAP_TEXT.role[level.role]}</span>
                        <Stars count={progress[level.id] ?? 0} />
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
```

`src/app.tsx` completo:

```tsx
import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { LEVELS } from '@/levels';
import { loadProgress } from '@/storage';
import { NotFound, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  return levelId === undefined ? <Roadmap levels={LEVELS} progress={progress} /> : <NotFound levelId={levelId} />;
}
```

En `src/main.tsx`, cambia `import { App } from './App';` por `import { App } from './app';`. En `src/app.test.tsx`, cambia `import { App } from './App';` por `import { App } from './app';`.

En `src/scene/pieces.tsx`:
- Agrega `import { SCENE_TEXT } from '@/copy';`.
- Cambia `<Label position={[x, 1.95, z]}>internet gateway</Label>` por `<Label position={[x, 1.95, z]}>{SCENE_TEXT.gateway}</Label>`.

- [ ] **Step 6: Barrels y reescritura de imports**

`src/engine/index.ts`:

```ts
export { APP_TARGET, materialize } from './network/app-target';
export { applyAction, networkActionSchema } from './network/actions';
export type { NetworkAction } from './network/actions';
export type { Actor, Endpoint, Instance, Network, PacketSpec, Rule, RulePeer, RuleWhat, SecurityGroup, Subnet } from './network/types';
export { describePacket } from './simulation/context';
export { deathPoint } from './simulation/checkpoints';
export { simulate } from './simulation/simulate';
export type { Checkpoint, Outcome, Step, Trace } from './simulation/trace';
export { extraOpenings, reachesHost } from './exposure/exposure';
```

`src/copy/index.ts`:

```ts
export { endpointName, formatPacket, OUTCOME_TEXT } from './packet-labels';
export { formatPeer, formatWhat } from './rule-labels';
export { NOT_FOUND_TEXT, ROADMAP_TEXT, SCENE_TEXT } from './ui';
```

`src/levels/index.ts`:

```ts
export { CHAPTERS } from './chapters';
export type { Chapter } from './chapters';
export type { LevelEntry, LevelRole } from './level-entry';
export { LEVELS } from './registry';
```

`src/storage/index.ts`:

```ts
export { isUnlocked, loadProgress, saveStars } from './progress';
export type { Progress } from './progress';
```

`src/scene/index.ts`:

```ts
export { GameScene } from './game-scene';
```

`src/ui/index.ts`:

```ts
export { NotFound } from './not-found';
export { Roadmap } from './roadmap';
```

`src/testing/index.ts`:

```ts
export { ATTACKER_IP, YOU_IP, actor, allOut, echoFrom, inst, lab03Net, ping, sshFromYou, tcp, withInbound, withInstance } from './fixtures';
export { REPO_ROOT, readSyllabus, syllabusChapters, syllabusLessons } from './repo';
```

Reescribe los imports de cada archivo movido con esta tabla. Ningún import usa `../`.

| Archivo | Imports nuevos |
|---------|----------------|
| `engine/network/schema.ts` | `import { ipInCidr, isIpv4, parseCidr } from './cidr';` |
| `engine/network/dns.ts` | `import type { Network } from './types';` |
| `engine/simulation/context.ts` | `import type { Endpoint, Instance, Network, PacketSpec, SecurityGroup } from '@/engine/network/types';` y `import type { Outcome, Step, TcpdumpLine } from './trace';` |
| `engine/simulation/rules.ts` | `import { ipInCidr } from '@/engine/network/cidr';`, `import type { PacketSpec, RulePeer, RuleWhat, SecurityGroup } from '@/engine/network/types';`, `import type { RuleCheck } from './trace';` |
| `engine/simulation/checkpoints.ts` | `import type { Checkpoint, Trace } from './trace';` |
| `engine/simulation/simulate.ts` | `import type { SimContext, Stage } from './context';`, las seis etapas desde `./stages/<nombre>`, `import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';`, `import type { Outcome, Trace } from './trace';`. Borra la línea `export { describePacket } from './stages/context';` |
| `engine/simulation/stages/dns.ts` | `import { isIpv4 } from '@/engine/network/cidr';`, `import { resolveName } from '@/engine/network/dns';`, `import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';` |
| `engine/simulation/stages/route.ts` | `import { ipInCidr } from '@/engine/network/cidr';`, `import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';` |
| `engine/simulation/stages/sg-out.ts`, `sg-in.ts` | `import { checkRules } from '@/engine/simulation/rules';`, `import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';` |
| `engine/simulation/stages/linux.ts` | `import { CONTINUE, describePacket, stop, type Stage } from '@/engine/simulation/context';` |
| `engine/simulation/stages/reply.ts` | `import { stop, type Stage } from '@/engine/simulation/context';` |
| `engine/exposure/exposure.ts` | `import type { Actor, Endpoint, Network, PacketSpec } from '@/engine/network/types';`, `import { simulate } from '@/engine/simulation/simulate';`, `import type { Trace } from '@/engine/simulation/trace';` |
| tests del motor | fixtures desde `@/testing`; el archivo probado desde `./<archivo>`; tipos desde `@/engine/network/types` o `./trace` |
| `testing/fixtures.ts` | `import type { Endpoint, Instance, Network, PacketSpec, Rule } from '@/engine';` |
| `levels/chapters.test.ts` | `import { syllabusChapters } from '@/testing';` |
| `storage/progress.ts` | `import type { LevelEntry } from '@/levels';` |
| `storage/progress.test.ts` | `import type { LevelEntry } from '@/levels';` |
| `scene/layout.ts` | `import type { Checkpoint, Network, PacketSpec, Trace } from '@/engine';` |
| `scene/layout.test.ts` | `import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '@/testing';`, `import { simulate } from '@/engine/simulation/simulate';` |
| `scene/pieces.tsx` | `import type { Actor } from '@/engine';`, `import { useHtmlPortal } from './html-layer';` |
| `scene/game-scene.tsx` | `import type { Network } from '@/engine';`, `import { HtmlLayerContext } from './html-layer';` |

- [ ] **Step 7: Una guía `CLAUDE.md` por carpeta**

Crea cada archivo con este contenido exacto.

`src/CLAUDE.md`:

```markdown
# src

Entry point and layers. `main.tsx` mounts `app.tsx`, which routes between screens; `styles.css` holds the global styles.

- Layers, top to bottom: `ui` → `game` · `scene` · `storage` → `levels` → `copy` → `engine`. A layer imports only layers below it, never a peer, and only through their barrel (`@/engine`). `game` arrives with the incidents.
- `testing/` is for tests only.
- New code goes to the layer that `.claude/rules/folder-structure.md` picks, never to this folder.
- May import: every layer's barrel.
```

`src/engine/CLAUDE.md`:

```markdown
# engine

The pure domain core: the AWS network model and the packet simulation. The same input always gives the same output.

- Belongs here: network model (`network/`), simulation and its stages (`simulation/`), the exposure probes (`exposure/`).
- Not here: text shown to the player (`src/copy/`), level content (`src/levels/`), anything that draws, stores or reads the clock.
- May import: nothing from other layers. No React, three, `@react-three/*`, `@mantine/*`, browser storage, `Date.now()` or `Math.random()`.
- Other layers import `@/engine`. Files inside import each other directly (`./x`, or `@/engine/<folder>/x` across folders).
```

`src/engine/network/CLAUDE.md`:

```markdown
# engine/network

The network model: zod schemas and types, CIDR math, EC2 DNS names, actions that change a network, and app targets.

- Not here: anything that moves a packet (`src/engine/simulation/`).
- May import: `zod` and other files of `src/engine/`.
```

`src/engine/simulation/CLAUDE.md`:

```markdown
# engine/simulation

`simulate(network, packet)` and its trace: the stage pipeline, rule matching and where a packet stops.

- Not here: the stages themselves (`stages/`), the network model (`src/engine/network/`).
- May import: other files of `src/engine/`.
```

`src/engine/simulation/stages/CLAUDE.md`:

```markdown
# engine/simulation/stages

One file per pipeline stage: `dns`, `route`, `sg-out`, `sg-in`, `linux`, `reply`. A stage reads and extends the simulation context and says whether the packet continues.

- A new network mechanic (for example NACL) adds a stage here and registers it in the pipeline of `src/engine/simulation/simulate.ts`.
- May import: other files of `src/engine/`.
```

`src/engine/exposure/CLAUDE.md`:

```markdown
# engine/exposure

The fixed probe battery behind "only what is needed": which probes reach a host without being an expected flow.

- May import: other files of `src/engine/`.
```

`src/copy/CLAUDE.md`:

```markdown
# copy

Every Spanish text the player sees, as named constants and formatters, one file per area: rule labels, packet labels, UI screens and, from the engine refactor on, reasons.

- Not here: logic that decides outcomes (`src/engine/`), level content (level files in `src/levels/`).
- Text follows `.claude/rules/plain-language-copy.md`.
- May import: `@/engine`.
```

`src/levels/CLAUDE.md`:

```markdown
# levels

The course chapters (`chapters.ts`), what the roadmap needs from a level (`level-entry.ts`) and the registry that loads level files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`.

- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
```

`src/storage/CLAUDE.md`:

```markdown
# storage

Progress kept in the browser: best stars per level and level unlocking.

- Not here: anything that decides an outcome or draws.
- May import: `@/engine`, `@/copy`, `@/levels`.
```

`src/scene/CLAUDE.md`:

```markdown
# scene

The isometric paper-and-ink map drawn with React Three Fiber: layout, pieces, and labels on an HTML layer.

- Draws what the engine computed; never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
```

`src/ui/CLAUDE.md`:

```markdown
# ui

Screens and panels: the roadmap and the not-found page.

- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
```

`src/testing/CLAUDE.md`:

```markdown
# testing

Helpers for tests only: network fixtures (`fixtures.ts`), readers for the repository's `syllabus.md` (`repo.ts`) and the Vitest setup (`setup.ts`).

- Production code never imports `@/testing`.
- May import: `@/engine`, `@/copy`, `@/levels`.
```

`tests/CLAUDE.md`:

```markdown
# tests

End-to-end tests live in `e2e/`. Unit tests live next to the file they test inside `src/`.
```

`tests/e2e/CLAUDE.md`:

```markdown
# tests/e2e

Playwright tests against the production build (`npm run e2e`, port 4183). One file per flow, named `<flow>.spec.ts`.

- Interact through roles and labels, the way a player would.
```

- [ ] **Step 8: Verificar**

```bash
rmdir src/test-utils src/engine/stages src/ui/shared 2>/dev/null; true
```

Run: `npm run typecheck && npm run structure && npx vitest run`
Expected: PASS. `structure` no imprime nada.

Run: `grep -rn "from '\.\./" src scripts tests`
Expected: sin salida.

Run: `npm run check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A src tests scripts tsconfig.json vite.config.ts package.json
git commit -m "refactor: organize the code into layers with barrels and the @/ alias"
```

---

### Task 4: Motor: `parseCidr` estricto y sondas que distinguen el camino

Arregla los ítems A11 y A3 del backlog. Nota: la batería de sondas ya incluye Echo Reply (tipo 0) en `SERVICES`, así que ese punto del spec no requiere trabajo.

**Files:**
- Modify: `src/engine/network/cidr.ts`, `src/engine/network/cidr.test.ts`, `src/engine/exposure/exposure.ts`, `src/engine/exposure/exposure.test.ts`

**Interfaces:**
- Consumes: estructura de la Tarea 3.
- Produces:
  - `parseCidr(cidr)` lanza `invalid CIDR: <cidr>` ante cualquier texto que no sea `a.b.c.d/N` con N de 0 a 32.
  - `flowKey(net, packet)` devuelve `"<kind>:<id>@<origen efectivo>><destino>@<IP resuelta>:<servicio>"`.

- [ ] **Step 1: Tests que fallan**

En `src/engine/network/cidr.test.ts`, reemplaza el bloque `describe('parseCidr', ...)` por:

```ts
describe('parseCidr', () => {
  it('reads the base address and the prefix', () => {
    expect(parseCidr('172.31.0.0/16').prefix).toBe(16);
    expect(parseCidr('0.0.0.0/0').prefix).toBe(0);
  });

  it('rejects anything that is not address/prefix with a prefix from 0 to 32', () => {
    for (const bad of ['10.0.0.0/33', '10.0.0.0', '10.0.0.0/', '10.0.0.0/ 8', '10.0.0.0/8/9', ' 10.0.0.0/8', '10.0.0/8']) {
      expect(() => parseCidr(bad), bad).toThrow('invalid CIDR');
    }
  });
});
```

En `src/engine/exposure/exposure.test.ts`:
- Agrega `withInbound` al import de `@/testing`, si no está.
- Reemplaza el bloque `describe('flowKey', ...)` por estos dos:

```ts
describe('flowKey', () => {
  it('names the source, the effective source, the destination, the resolved address and the service', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    expect(flowKey(net, ping(inst('servidor1'), S2.private))).toBe('instance:servidor1@172.31.16.131>servidor2@172.31.38.97:icmp:8');
  });

  it('a DNS name and the IP it resolves to are the same flow', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const byName = flowKey(net, ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(byName).toBe(flowKey(net, ping(inst('servidor1'), S2.private)));
  });
});

describe('extraOpenings by path', () => {
  it('an allowed private-IP flow does not hide an opening on the public path', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'), {
      id: 'servidor1-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: '54.78.154.66/32' },
    });
    const extra = extraOpenings(net, [ping(inst('servidor1'), S2.private)]);
    expect(extra).toContainEqual(ping(inst('servidor1'), S2.public));
  });

  it('a flow expected by DNS name is not an opening on its own IP', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const expectedByName = [
      ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'),
      tcp(actor('you'), '54.78.154.66', 22),
      tcp(actor('you'), S2.public, 22),
    ];
    expect(extraOpenings(net, expectedByName)).toEqual([]);
  });
});
```

Run: `npx vitest run src/engine/network/cidr.test.ts src/engine/exposure/exposure.test.ts`
Expected: FAIL.
- `parseCidr('10.0.0.0/')` no lanza.
- `flowKey` devuelve el formato viejo.
- "an allowed private-IP flow…" no encuentra la apertura pública.

- [ ] **Step 2: Implementar**

En `src/engine/network/cidr.ts`, reemplaza `parseCidr` por:

```ts
const CIDR = /^([\d.]+)\/(\d{1,2})$/;

export function parseCidr(cidr: string): { base: number; prefix: number } {
  const match = CIDR.exec(cidr);
  const prefix = Number(match?.[2]);
  if (!match || !isIpv4(match[1]) || prefix > 32) throw new Error(`invalid CIDR: ${cidr}`);
  return { base: ipToInt(match[1]), prefix };
}
```

En `src/engine/exposure/exposure.ts`, reemplaza `keyFor`, `flowKey` y `extraOpenings` por:

```ts
function keyFor(from: Endpoint, trace: Trace, p: Service): string {
  const detail = p.protocol === 'icmp' ? `icmp:${p.icmpType}` : `${p.protocol}:${p.port}`;
  return `${from.kind}:${from.id}@${trace.effectiveSource}>${trace.destinationId}@${trace.resolvedIp}:${detail}`;
}

export function flowKey(net: Network, packet: PacketSpec): string | null {
  const trace = simulate(withProbeActor(net), packet);
  return trace.destinationId ? keyFor(packet.from, trace, packet) : null;
}

export function extraOpenings(net: Network, expected: PacketSpec[]): PacketSpec[] {
  const probeNet = withProbeActor(net);
  const allowed = new Set(expected.map((p) => flowKey(net, p)).filter((k): k is string => k !== null));
  return probePackets(net).filter((packet) => {
    const trace = simulate(probeNet, packet);
    return reachesHost(trace) && trace.destinationId !== null && !allowed.has(keyFor(packet.from, trace, packet));
  });
}
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run src/engine`
Expected: PASS, incluidas las pruebas anteriores de `extraOpenings`.

- [ ] **Step 4: Commit**

```bash
git add src/engine/network src/engine/exposure
git commit -m "fix(engine): reject malformed CIDRs and tell exposure paths apart"
```

---

### Task 5: Motor sin frases: códigos de motivo y `describeReason`

**Files:**
- Create: `src/copy/reasons.ts`, `src/copy/reasons.test.ts`
- Modify: `src/engine/network/types.ts`, `src/engine/simulation/trace.ts`, `src/engine/simulation/stages/{dns,route,sg-out,sg-in,linux,reply}.ts`, `src/engine/simulation/checkpoints.test.ts`, `src/engine/network/schema.ts`, `src/engine/network/schema.test.ts`, `src/engine/network/cidr.ts`, `src/engine/simulation/simulate.ts`, `src/engine/index.ts`, `src/copy/index.ts`, `src/copy/CLAUDE.md`, `src/engine/simulation/CLAUDE.md`

**Interfaces:**
- Consumes: estructura de la Tarea 3.
- Produces:
  - `Step.reason: Reason`, una unión discriminada por `code` (definida abajo).
  - `describeReason(reason: Reason, net: Network): string` en `@/copy`.
  - El tipo `IcmpType` en `@/engine/network/types`, y `Reason` exportado por `@/engine`.

- [ ] **Step 1: Test de `describeReason` (falla)**

`src/copy/reasons.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Reason } from '@/engine';
import { simulate } from '@/engine/simulation/simulate';
import { inst, lab03Net, ping } from '@/testing';
import { describeReason } from './reasons';

const NET = lab03Net();
const SG_IN_DROP = 'Descartado en silencio: ninguna regla de entrada de servidor2 coincide en qué y desde dónde a la vez.';

const CASES: [Reason, string][] = [
  [{ code: 'dns-unresolved', name: 'db.internal', fromInside: false }, 'Nadie responde por el nombre db.internal desde fuera de la VPC.'],
  [
    { code: 'dns-resolved', name: 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com', ip: '172.31.38.97', fromInside: true },
    'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com → 172.31.38.97 (preguntando desde dentro de la VPC)',
  ],
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, '172.31.38.97 es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.'],
  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ninguna instancia tiene la IP 172.31.99.9.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la VPC, con IPs privadas.'],
  [{ code: 'route-no-public-instance', ip: '52.0.0.1' }, 'Ninguna instancia de la VPC tiene la IP pública 52.0.0.1.'],
  [{ code: 'route-no-public-ip', instanceId: 'servidor1' }, 'servidor1 no tiene IP pública: no puede salir a internet.'],
  [{ code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' }, 'Sale por el internet gateway: el origen cambia de 172.31.16.131 a 54.78.154.66.'],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el internet gateway.'],
  [{ code: 'sg-out-pass', instanceId: 'servidor1' }, 'La salida de servidor1 lo deja salir.'],
  [{ code: 'sg-out-drop', instanceId: 'servidor1' }, 'Ninguna regla de salida de servidor1 coincide.'],
  [{ code: 'sg-in-pass', instanceId: 'servidor2' }, 'El SG de servidor2 lo deja entrar.'],
  [{ code: 'sg-in-drop', instanceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'linux-unsolicited-icmp', instanceId: 'servidor2', icmpType: 0 }, 'Llega un ICMP echo reply que nadie pidió: Linux no contesta.'],
  [{ code: 'linux-ignores-echo', instanceId: 'servidor2' }, 'Llega, pero Linux de servidor2 tiene icmp_echo_ignore_all=1 y no contesta.'],
  [{ code: 'linux-replies', instanceId: 'servidor2' }, 'Linux de servidor2 contesta.'],
  [{ code: 'linux-refused', instanceId: 'servidor2', port: 80 }, 'Llega, pero nada escucha en el puerto 80: Linux contesta "connection refused".'],
  [{ code: 'linux-accepts', instanceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'linux-udp-no-service', instanceId: 'servidor2', port: 53 }, 'Llega un paquete UDP 53, pero en este juego ningún servicio UDP contesta.'],
  [{ code: 'reply-stateful', instanceId: 'servidor2' }, 'La respuesta vuelve sola: el SG es stateful y recuerda la conversación.'],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o in Spanish', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it('describes the step where a ping without an ICMP rule dies', () => {
    const trace = simulate(NET, ping(inst('servidor1'), '172.31.38.97'));
    expect(describeReason(trace.steps.at(-1)!.reason, NET)).toBe(SG_IN_DROP);
  });
});
```

Run: `npx vitest run src/copy/reasons.test.ts`
Expected: FAIL. `Reason` no existe y `./reasons` no resuelve.

- [ ] **Step 2: El tipo `Reason` en el motor**

En `src/engine/network/types.ts`, agrega `icmpTypeSchema` al import de `./schema` y este tipo:

```ts
export type IcmpType = z.infer<typeof icmpTypeSchema>;
```

En `src/engine/simulation/trace.ts`:
- Agrega `import type { IcmpType } from '@/engine/network/types';`.
- Agrega el tipo `Reason`.
- Cambia `reason: string;` por `reason: Reason;` en `Step`.

```ts
export type Reason =
  | { code: 'dns-unresolved'; name: string; fromInside: boolean }
  | { code: 'dns-resolved'; name: string; ip: string; fromInside: boolean }
  | { code: 'route-private-from-outside'; ip: string }
  | { code: 'route-no-private-instance'; ip: string }
  | { code: 'route-private' }
  | { code: 'route-no-public-instance'; ip: string }
  | { code: 'route-no-public-ip'; instanceId: string }
  | { code: 'route-nat'; from: string; to: string }
  | { code: 'route-from-internet' }
  | { code: 'sg-out-pass'; instanceId: string }
  | { code: 'sg-out-drop'; instanceId: string }
  | { code: 'sg-in-pass'; instanceId: string }
  | { code: 'sg-in-drop'; instanceId: string }
  | { code: 'linux-unsolicited-icmp'; instanceId: string; icmpType: IcmpType }
  | { code: 'linux-ignores-echo'; instanceId: string }
  | { code: 'linux-replies'; instanceId: string }
  | { code: 'linux-refused'; instanceId: string; port: number }
  | { code: 'linux-accepts'; instanceId: string; port: number }
  | { code: 'linux-udp-no-service'; instanceId: string; port: number }
  | { code: 'reply-stateful'; instanceId: string };
```

En `src/engine/index.ts`, cambia la línea de tipos de `trace` por:

```ts
export type { Checkpoint, Outcome, Reason, Step, Trace } from './simulation/trace';
```

- [ ] **Step 3: Las etapas devuelven códigos**

`src/engine/simulation/stages/dns.ts`:

```ts
import { isIpv4 } from '@/engine/network/cidr';
import { resolveName } from '@/engine/network/dns';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

export const dnsStage: Stage = (ctx) => {
  const { packet, source, net } = ctx;
  if (isIpv4(packet.to)) {
    ctx.destIp = packet.to;
    return CONTINUE;
  }
  const ip = resolveName(net, packet.to, source.inside);
  if (ip === null) {
    ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'drop', reason: { code: 'dns-unresolved', name: packet.to, fromInside: source.inside } });
    return stop('unresolved');
  }
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'info', reason: { code: 'dns-resolved', name: packet.to, ip, fromInside: source.inside } });
  return CONTINUE;
};
```

`src/engine/simulation/stages/route.ts`:

```ts
import { ipInCidr } from '@/engine/network/cidr';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (ipInCidr(destIp, net.vpcCidr)) {
    if (!source.inside) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: destIp } });
      return stop('timeout');
    }
    const dest = net.instances.find((i) => i.privateIp === destIp);
    if (!dest) {
      ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'drop', reason: { code: 'route-no-private-instance', ip: destIp } });
      return stop('timeout');
    }
    ctx.dest = dest;
    ctx.path = 'private';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'pass', reason: { code: 'route-private' } });
    return CONTINUE;
  }

  const dest = net.instances.find((i) => i.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-no-public-instance', ip: destIp } });
    return stop('timeout');
  }
  if (source.instance) {
    const publicIp = source.instance.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-no-public-ip', instanceId: source.instance.id } });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: 'igw', verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'pass', reason: { code: 'route-from-internet' } });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
```

`src/engine/simulation/stages/sg-out.ts`:

```ts
import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgOutStage: Stage = (ctx) => {
  const instance = ctx.source.instance;
  if (!instance) return CONTINUE;
  const dest = ctx.dest!;
  const { allowed, checks } = checkRules(groupsOf(ctx.net, instance), 'outbound', ctx.packet, {
    ip: ctx.destIp!,
    sgIds: ctx.path === 'private' ? dest.sgIds : [],
  });
  ctx.steps.push({
    stage: 'sg-out',
    at: instance.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-out-pass' : 'sg-out-drop', instanceId: instance.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

`src/engine/simulation/stages/sg-in.ts`:

```ts
import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const sgIds = ctx.path === 'private' && ctx.source.instance ? ctx.source.instance.sgIds : [];
  const { allowed, checks } = checkRules(groupsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, sgIds });
  ctx.steps.push({
    stage: 'sg-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-in-pass' : 'sg-in-drop', instanceId: dest.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

`src/engine/simulation/stages/linux.ts`:

```ts
import { CONTINUE, describePacket, stop, type Stage } from '@/engine/simulation/context';

export const linuxStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'In', src, dst: dest.privateIp, summary: describePacket(p) });

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-unsolicited-icmp', instanceId: dest.id, icmpType: p.icmpType! } });
      return stop('arrived-no-reply');
    }
    if (dest.linux.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-ignores-echo', instanceId: dest.id } });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: { code: 'linux-replies', instanceId: dest.id } });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    if (!dest.linux.listeningTcpPorts.includes(p.port!)) {
      ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: src, summary: `TCP ${p.port} RST` });
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'reject', reason: { code: 'linux-refused', instanceId: dest.id, port: p.port! } });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: { code: 'linux-accepts', instanceId: dest.id, port: p.port! } });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-udp-no-service', instanceId: dest.id, port: p.port! } });
  return stop('arrived-no-reply');
};
```

`src/engine/simulation/stages/reply.ts`:

```ts
import { stop, type Stage } from '@/engine/simulation/context';

export const replyStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const summary = p.protocol === 'icmp' ? 'ICMP echo reply' : `${p.protocol.toUpperCase()} ${p.port} reply`;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: ctx.effectiveSource!, summary });
  ctx.steps.push({ stage: 'reply', at: dest.id, verdict: 'pass', reason: { code: 'reply-stateful', instanceId: dest.id } });
  return stop('replied');
};
```

El resumen de tcpdump pasa de `… respuesta` a `… reply`, para que el motor no tenga español. Ningún test lo comprueba.

En `src/engine/simulation/checkpoints.test.ts`, reemplaza cada `reason: ''` según su etapa:
- `stage: 'route'` → `reason: { code: 'route-private' }`;
- `stage: 'sg-in'` → `reason: { code: 'sg-in-drop', instanceId: 'servidor2' }`;
- `stage: 'reply'` → `reason: { code: 'reply-stateful', instanceId: 'servidor2' }`.

- [ ] **Step 4: Errores del motor en inglés**

Reemplaza los textos exactos de esta tabla:

| Archivo | Texto actual | Texto nuevo |
|---------|--------------|-------------|
| `network/schema.ts` | `'IPv4 inválida'` | `'invalid IPv4'` |
| `network/schema.ts` | `'CIDR inválido'` | `'invalid CIDR'` |
| `network/schema.ts` | `` `id repetido: ${repeated}` `` | `` `duplicate id: ${repeated}` `` |
| `network/schema.ts` | `` `${subnet.id}: ${subnet.cidr} no está dentro de la VPC` `` | `` `${subnet.id}: ${subnet.cidr} is outside the VPC` `` |
| `network/schema.ts` | `` `${instance.id}: la subred ${instance.subnetId} no existe` `` | `` `${instance.id}: subnet ${instance.subnetId} does not exist` `` |
| `network/schema.ts` | `` `${instance.id}: ${instance.privateIp} no está en ${subnet.cidr}` `` | `` `${instance.id}: ${instance.privateIp} is not in ${subnet.cidr}` `` |
| `network/schema.ts` | `` `${instance.id}: el SG ${sgId} no existe` `` | `` `${instance.id}: security group ${sgId} does not exist` `` |
| `network/schema.ts` | `` `${group.id}/${rule.id}: el SG ${sgId} no existe` `` | `` `${group.id}/${rule.id}: security group ${sgId} does not exist` `` |
| `network/schema.ts` | `'ICMP necesita icmpType; TCP y UDP necesitan port'` | `'ICMP needs icmpType; TCP and UDP need port'` |
| `network/cidr.ts` | `` `IP inválida: ${ip}` `` | `` `invalid IP: ${ip}` `` |
| `simulation/simulate.ts` | `` `No existe la instancia ${from.id}` `` | `` `unknown instance ${from.id}` `` |
| `simulation/simulate.ts` | `` `No existe el actor ${from.id}` `` | `` `unknown actor ${from.id}` `` |
| `simulation/simulate.ts` | `'La simulación terminó sin resultado'` | `'the simulation ended without an outcome'` |
| `network/schema.test.ts` | `'no está en 172.31.16.0/20'` | `'is not in 172.31.16.0/20'` |

- [ ] **Step 5: `describeReason` en `src/copy/`**

`src/copy/reasons.ts`:

```ts
import { describePacket, type Network, type Reason } from '@/engine';

function instanceName(net: Network, instanceId: string): string {
  return net.instances.find((i) => i.id === instanceId)?.name ?? instanceId;
}

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

export function describeReason(reason: Reason, net: Network): string {
  switch (reason.code) {
    case 'dns-unresolved':
      return `Nadie responde por el nombre ${reason.name} desde ${side(reason.fromInside)} de la VPC.`;
    case 'dns-resolved':
      return `${reason.name} → ${reason.ip} (preguntando desde ${side(reason.fromInside)} de la VPC)`;
    case 'route-private-from-outside':
      return `${reason.ip} es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.`;
    case 'route-no-private-instance':
      return `Ninguna instancia tiene la IP ${reason.ip}.`;
    case 'route-private':
      return 'Viaja por dentro de la VPC, con IPs privadas.';
    case 'route-no-public-instance':
      return `Ninguna instancia de la VPC tiene la IP pública ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${instanceName(net, reason.instanceId)} no tiene IP pública: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el internet gateway: el origen cambia de ${reason.from} a ${reason.to}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el internet gateway.';
    case 'sg-out-pass':
      return `La salida de ${instanceName(net, reason.instanceId)} lo deja salir.`;
    case 'sg-out-drop':
      return `Ninguna regla de salida de ${instanceName(net, reason.instanceId)} coincide.`;
    case 'sg-in-pass':
      return `El SG de ${instanceName(net, reason.instanceId)} lo deja entrar.`;
    case 'sg-in-drop':
      return `Descartado en silencio: ninguna regla de entrada de ${instanceName(net, reason.instanceId)} coincide en qué y desde dónde a la vez.`;
    case 'linux-unsolicited-icmp':
      return `Llega un ${describePacket({ protocol: 'icmp', icmpType: reason.icmpType })} que nadie pidió: Linux no contesta.`;
    case 'linux-ignores-echo':
      return `Llega, pero Linux de ${instanceName(net, reason.instanceId)} tiene icmp_echo_ignore_all=1 y no contesta.`;
    case 'linux-replies':
      return `Linux de ${instanceName(net, reason.instanceId)} contesta.`;
    case 'linux-refused':
      return `Llega, pero nada escucha en el puerto ${reason.port}: Linux contesta "connection refused".`;
    case 'linux-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'linux-udp-no-service':
      return `Llega un paquete UDP ${reason.port}, pero en este juego ningún servicio UDP contesta.`;
    case 'reply-stateful':
      return 'La respuesta vuelve sola: el SG es stateful y recuerda la conversación.';
  }
}
```

En `src/copy/index.ts`, agrega:

```ts
export { describeReason } from './reasons';
```

En `src/copy/CLAUDE.md`, cambia "rule labels, packet labels, UI screens and, from the engine refactor on, reasons." por "reasons (engine reason codes), rule labels, packet labels and UI screens.".

En `src/engine/simulation/CLAUDE.md`, agrega esta línea antes de "- Not here":

```markdown
- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
```

- [ ] **Step 6: Verificar**

Run: `npx vitest run src/copy src/engine`
Expected: PASS.

Run: `grep -rnE "[áéíóúñ¿¡]" src/engine --include='*.ts' | grep -v '\.test\.ts'`
Expected: sin salida.

- [ ] **Step 7: Commit**

```bash
git add src/engine src/copy
git commit -m "refactor(engine): return reason codes and render them in src/copy"
```

---

### Task 6: Guardado que no pierde progreso

Arregla los ítems A4 y A12 del backlog.

**Files:**
- Modify: `src/storage/progress.ts`, `src/storage/progress.test.ts`

**Interfaces:**
- Consumes: `LevelEntry` (`@/levels`).
- Produces:
  - `loadProgress(storage?)`: descarta solo las entradas inválidas.
  - `saveStars(current: Progress, levelId: string, stars: number, storage?): Progress`: fusiona con el progreso en memoria y guarda si puede. Ojo: la firma cambia; `current` va primero.
  - `PROGRESS_KEY` y `MAX_STARS`.

- [ ] **Step 1: Tests que fallan**

`src/storage/progress.test.ts` completo:

```ts
import { describe, expect, it } from 'vitest';
import type { LevelEntry } from '@/levels';
import { PROGRESS_KEY, isUnlocked, loadProgress, saveStars } from './progress';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const blocked = {
  getItem: (): string | null => {
    throw new Error('blocked');
  },
  setItem: (): void => {
    throw new Error('blocked');
  },
};

describe('progress', () => {
  it('keeps the best stars per level and saves them', () => {
    const storage = memoryStorage();
    const first = saveStars({}, '04-01', 2, storage);
    const second = saveStars(first, '04-01', 1, storage);
    expect(second).toEqual({ '04-01': 2 });
    expect(loadProgress(storage)).toEqual({ '04-01': 2 });
  });

  it('with blocked storage, progress accumulates in memory', () => {
    const afterFirst = saveStars({}, '04-01', 3, blocked);
    const afterSecond = saveStars(afterFirst, '04-02', 3, blocked);
    const afterReplay = saveStars(afterSecond, '04-02', 1, blocked);
    expect(afterReplay).toEqual({ '04-01': 3, '04-02': 3 });
  });

  it('drops only the invalid entries', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{"04-01":"three","04-02":9,"04-03":2,"04-04":1.5,"04-05":0}' });
    expect(loadProgress(storage)).toEqual({ '04-03': 2, '04-05': 0 });
  });

  it('progress saved by version 1 keeps loading', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{"04-01":3,"04-07":2}' });
    expect(loadProgress(storage)).toEqual({ '04-01': 3, '04-07': 2 });
  });

  it('broken JSON, a non-object or blocked storage start empty', () => {
    for (const raw of ['{broken', '[1,2]', '"text"', 'null', '7']) {
      expect(loadProgress(memoryStorage({ [PROGRESS_KEY]: raw })), raw).toEqual({});
    }
    expect(loadProgress(blocked)).toEqual({});
  });

  it('a level unlocks when the previous one in its chapter has a star', () => {
    const chapter: LevelEntry[] = [
      { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
      { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
    ];
    expect(isUnlocked(chapter[0], {}, chapter)).toBe(true);
    expect(isUnlocked(chapter[1], {}, chapter)).toBe(false);
    expect(isUnlocked(chapter[1], { '04-01': 1 }, chapter)).toBe(true);
  });
});
```

Run: `npx vitest run src/storage`
Expected: FAIL.
- `PROGRESS_KEY` no existe.
- `saveStars` recibe `{}` como `levelId`.
- La prueba de entradas inválidas devuelve `{}`.

- [ ] **Step 2: Implementar**

`src/storage/progress.ts` completo:

```ts
import type { LevelEntry } from '@/levels';

export const PROGRESS_KEY = 'follow-the-packet:progress:v1';
export const MAX_STARS = 3;

export type Progress = Record<string, number>;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isStarCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_STARS;
}

function persist(storage: WritableStorage | undefined, progress: Progress): boolean {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** Reads the saved progress, keeping every valid entry and dropping the rest; returns {} when nothing usable is saved. */
export function loadProgress(storage: ReadableStorage | undefined = browserStorage()): Progress {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, stars]) => isStarCount(stars)));
  } catch {
    return {};
  }
}

/** Merges a result into the in-memory progress, keeping the best stars per level; saves it when storage allows and returns the merged progress. */
export function saveStars(current: Progress, levelId: string, stars: number, storage: WritableStorage | undefined = browserStorage()): Progress {
  const next = { ...current, [levelId]: Math.max(current[levelId] ?? 0, stars) };
  persist(storage, next);
  return next;
}

export function isUnlocked(level: LevelEntry, progress: Progress, chapterLevels: LevelEntry[]): boolean {
  const index = chapterLevels.findIndex((l) => l.id === level.id);
  return index <= 0 || (progress[chapterLevels[index - 1].id] ?? 0) > 0;
}
```

En `src/storage/index.ts`, exporta también las constantes:

```ts
export { MAX_STARS, PROGRESS_KEY, isUnlocked, loadProgress, saveStars } from './progress';
export type { Progress } from './progress';
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run src/storage src/app.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/storage
git commit -m "fix(storage): merge results in memory and drop only invalid entries"
```

---

### Task 7: Todo en inglés y sin comentarios (control C4)

**Files:**
- Create: `scripts/eslint-config.test.ts`
- Modify: `eslint.config.js`, `package.json`, `package-lock.json`, `playwright.config.ts`, y los archivos de `src/`, `scripts/` y `tests/` que el lint marque

**Interfaces:**
- Consumes: Tareas 3 a 6.
- Produces:
  - La regla `no-comments/disallowComments` activa en `**/*.{js,ts,tsx}`.
  - `ruleIdsFor(filePath, code)` en `scripts/eslint-config.test.ts`; lo reutilizan las Tareas 8 y 9.

- [ ] **Step 1: Test del control (falla)**

```bash
npm install -D eslint-plugin-no-comments@1.2.1
```

`scripts/eslint-config.test.ts`:

```ts
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const LINT_TIMEOUT_MS = 30_000;
const eslint = new ESLint({ cwd: PROJECT_ROOT });

async function ruleIdsFor(filePath: string, code: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

describe('eslint config', { timeout: LINT_TIMEOUT_MS }, () => {
  describe('comments', () => {
    it('rejects a plain comment', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', '// note\nexport const value = 1;\n')).toContain('no-comments/disallowComments');
    });

    it('allows English JSDoc', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', '/** Returns one. */\nexport function one(): number {\n  return 1;\n}\n')).toEqual([]);
    });

    it('allows the Vitest environment directive', async () => {
      expect(await ruleIdsFor('src/levels/probe.test.ts', '// @vitest-environment jsdom\nexport const value = 1;\n')).toEqual([]);
    });
  });
});
```

Run: `npx vitest run scripts/eslint-config.test.ts`
Expected: FAIL en "rejects a plain comment" (la regla no existe todavía).

- [ ] **Step 2: Activar la regla**

En `eslint.config.js`:
- Agrega `import noComments from 'eslint-plugin-no-comments';`.
- Agrega este bloque al final de `tseslint.config(...)`:

```js
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { 'no-comments': noComments },
    rules: {
      'no-comments/disallowComments': ['error', { allow: ['\\*', '@vitest-environment', 'eslint', 'global'] }],
    },
  },
```

El plugin arma la expresión `^\s?(\*|@vitest-environment|eslint|global)` sobre el texto de cada comentario. Por eso `/** … */` y la directiva pasan, y todo lo demás falla.

Run: `npx vitest run scripts/eslint-config.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 3: Dejar el código sin comentarios**

Run: `npm run lint 2>&1 | grep -c disallowComments`
Expected: un número mayor que 0. Esos son los comentarios a resolver.

Para cada comentario marcado:
- **JSDoc de una función exportada de esta lista:** reemplázalo por el JSDoc en inglés indicado.
- **Cualquier otro comentario** (en línea, de bloque o JSDoc sobre tipos, campos o constantes): bórralo.

| Función | JSDoc nuevo |
|---------|-------------|
| `resolveName` (`engine/network/dns.ts`) | `/** Resolves an EC2 DNS name the way AWS does: from inside the VPC a public name gives the private IP and from outside the public IP; a private name resolves only inside. Returns null when nothing answers. */` |
| `materialize` (`engine/network/app-target.ts`) | `/** Replaces the app target placeholder with the app target of the packet's source instance. */` |
| `simulate` (`engine/simulation/simulate.ts`) | `/** Runs the packet through every stage and returns its trace; the same network and packet always give the same trace. */` |
| `checkRules` (`engine/simulation/rules.ts`) | `/** Checks a packet against every rule of the given groups; allowed when one rule matches both what and from. */` |
| `deathPoint` (`engine/simulation/checkpoints.ts`) | `/** Returns where the packet stopped, or the reply at its destination when nothing stopped it. */` |
| `probePackets` (`engine/exposure/exposure.ts`) | `/** Builds the fixed probe battery: from every actor, from the internet and from every instance, to every IP of every other instance. */` |
| `reachesHost` (`engine/exposure/exposure.ts`) | `/** True when the packet passed the destination's inbound security group, even if Linux then stays silent. */` |
| `extraOpenings` (`engine/exposure/exposure.ts`) | `/** Returns the probes that reach a host without matching any expected flow. */` |
| `computeLayout` (`scene/layout.ts`) | `/** Lays out one column per subnet, the instances of each subnet in a row, and the internet on the left. */` |
| `pathFor` (`scene/layout.ts`) | `/** Returns the points the packet travels along its trace, ending where it stopped. */` |
| `boxEdgePoints` (`scene/edges.ts`) | `/** Returns the 12 edges of a centered box as 24 points (start-end pairs) for drei <Line segments>. */` |
| `useHtmlPortal` (`scene/html-layer.ts`) | `/** Returns the value for the portal prop of drei <Html>, or undefined to keep drei's default. */` |
| `lab03Net` (`testing/fixtures.ts`) | `/** Returns the lab 03 network: two servers in different availability zones, SSH only from your Mac. */` |
| `syllabusChapters` (`testing/repo.ts`) | `/** Returns the "## N. Title" headings of the repository's syllabus.md. */` |
| `syllabusLessons` (`testing/repo.ts`) | `/** Returns the lesson names of syllabus.md lines, without " · verificada" or the links after "→". */` |

La explicación que se borra de `html-layer.ts` y de `playwright.config.ts` va en el mensaje del commit (Step 6).

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Nombres de tests en inglés**

Traduce al inglés cada título de `describe` e `it` de `src/**/*.test.{ts,tsx}`, sin cambiar lo que comprueba la prueba:
- Conserva las referencias al lab tal cual, por ejemplo `lab 03, V5:`.
- Los textos visibles que la prueba busca en pantalla siguen en español.

Por ejemplo, `it('rechaza una IP privada fuera de su subred', …)` pasa a ser `it('rejects a private IP outside its subnet', …)`.

Run: `grep -rnE "(describe|it|it\.each\([^)]*\))\('[^']*([áéíóúñ¿¡]|\b(el|la|los|las|de|del|que|una|con|sin|por|para|en|se|su|y)\b)" src scripts tests`
Expected: sin salida.

- [ ] **Step 5: Verificar**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src scripts tests eslint.config.js playwright.config.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
style: English-only code and no comments outside JSDoc and directives

Removed explanations kept here:
- scene/html-layer.ts: drei mounts <Html> inside the container React
  manages for the Canvas; when leaving a screen React and drei fight over
  that node ("Failed to execute 'removeChild' on 'Node'"), so labels go
  to an HTML layer of our own.
- playwright.config.ts: the launch args enable software WebGL so the
  canvas renders in headless Chromium.
EOF
)"
```

---

### Task 8: Fronteras entre capas, efectos y fireEvent (controles C5 a C9)

**Files:**
- Modify: `eslint.config.js`, `scripts/eslint-config.test.ts`

**Interfaces:**
- Consumes: `ruleIdsFor` (Tarea 7) y la tabla de capas del "Árbol al terminar".
- Produces: un `eslint.config.js` que genera `no-restricted-imports` por capa.

- [ ] **Step 1: Tests de cada control (fallan)**

Dentro del `describe('eslint config', …)` de `scripts/eslint-config.test.ts`, agrega:

```ts
  describe('layers and imports', () => {
    const cases: [string, string, string][] = [
      ['engine imports react', 'src/engine/network/probe.ts', "import { useState } from 'react';\nexport const hook = useState;\n"],
      ['copy imports a higher layer', 'src/copy/probe.ts', "import { CHAPTERS } from '@/levels';\nexport const chapters = CHAPTERS;\n"],
      ['scene imports a peer', 'src/scene/probe.ts', "import { loadProgress } from '@/storage';\nexport const load = loadProgress;\n"],
      ['ui reaches into another layer', 'src/ui/probe.ts', "import { CHAPTERS } from '@/levels/chapters';\nexport const chapters = CHAPTERS;\n"],
      ['a layer imports its own barrel', 'src/levels/probe.ts', "import { CHAPTERS } from '@/levels';\nexport const chapters = CHAPTERS;\n"],
      ['a parent-relative import', 'src/levels/probe.ts', "import { CHAPTERS } from '../levels/chapters';\nexport const chapters = CHAPTERS;\n"],
      ['production code imports testing', 'src/levels/probe.ts', "import { lab03Net } from '@/testing';\nexport const net = lab03Net;\n"],
      ['a component imports useEffect', 'src/ui/probe.tsx', "import { useEffect } from 'react';\nexport function Probe() {\n  useEffect(() => undefined, []);\n  return null;\n}\n"],
      ['a test imports fireEvent', 'src/ui/probe.test.tsx', "import { fireEvent } from '@testing-library/react';\nexport const fire = fireEvent;\n"],
    ];

    it.each(cases)('rejects: %s', async (_name, filePath, code) => {
      expect(await ruleIdsFor(filePath, code)).toContain('no-restricted-imports');
    });

    it('rejects a value import from the engine in a view', async () => {
      expect(await ruleIdsFor('src/scene/probe.ts', "import { describePacket } from '@/engine';\nexport const describe = describePacket;\n")).toContain(
        '@typescript-eslint/no-restricted-imports',
      );
    });

    it('allows a type import from the engine in a view', async () => {
      expect(await ruleIdsFor('src/scene/probe.ts', "import type { Network } from '@/engine';\nexport type Net = Network;\n")).toEqual([]);
    });

    it('allows tests to import testing helpers', async () => {
      expect(await ruleIdsFor('src/levels/probe.test.ts', "import { lab03Net } from '@/testing';\nexport const net = lab03Net;\n")).toEqual([]);
    });

    it('allows effects inside a use-*.ts hook', async () => {
      const code = "import { useEffect } from 'react';\nexport function useProbe(): void {\n  useEffect(() => undefined, []);\n}\n";
      expect(await ruleIdsFor('src/ui/use-probe.ts', code)).toEqual([]);
    });

    it('rejects React.useEffect in a component', async () => {
      const code = "import * as React from 'react';\nexport function Probe() {\n  React.useEffect(() => undefined, []);\n  return null;\n}\n";
      expect(await ruleIdsFor('src/ui/probe.tsx', code)).toContain('no-restricted-syntax');
    });

    it('rejects reading the clock, randomness or browser storage in the engine', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', 'export const now = () => Date.now();\n')).toContain('no-restricted-syntax');
      expect(await ruleIdsFor('src/engine/probe.ts', 'export const roll = () => Math.random();\n')).toContain('no-restricted-syntax');
      expect(await ruleIdsFor('src/engine/probe.ts', "export const read = () => localStorage.getItem('x');\n")).toContain('no-restricted-globals');
    });
  });
```

Run: `npx vitest run scripts/eslint-config.test.ts`
Expected: FAIL en los casos nuevos de rechazo. Los casos que permiten algo ya pasan.

- [ ] **Step 2: `eslint.config.js` completo**

```js
import js from '@eslint/js';
import noComments from 'eslint-plugin-no-comments';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYER_IMPORTS = {
  engine: [],
  copy: ['engine'],
  levels: ['engine', 'copy'],
  game: ['engine', 'copy', 'levels'],
  scene: ['engine', 'copy', 'levels'],
  storage: ['engine', 'copy', 'levels'],
  ui: ['engine', 'copy', 'levels', 'game', 'scene', 'storage'],
  testing: ['engine', 'copy', 'levels'],
};
const LAYERS = Object.keys(LAYER_IMPORTS);
const VIEW_LAYERS = ['scene', 'ui'];
const TEST_FILES = ['**/*.test.{ts,tsx}'];
const HOOK_FILES = ['src/**/use-*.ts'];

const PARENT_IMPORT = { regex: '^\\.\\./', message: 'Use the @/ alias instead of ../ imports.' };
const NO_EFFECTS = { name: 'react', importNames: ['useEffect', 'useLayoutEffect'], message: 'Effects live in use-*.ts hooks; prefer @mantine/hooks.' };
const NO_FIRE_EVENT = ['@testing-library/react', '@testing-library/dom'].map((name) => ({
  name,
  importNames: ['fireEvent'],
  message: 'Use @testing-library/user-event.',
}));
const ENGINE_PACKAGES = { group: ['react', 'react-dom', 'three', '@react-three/*', '@mantine/*'], message: 'The engine stays free of UI, rendering and hooks.' };

function layerImports(layer, { isTest, isHook }) {
  const allowed = new Set([layer, ...LAYER_IMPORTS[layer]]);
  const forbiddenLayers = LAYERS.filter((other) => !allowed.has(other) && !(isTest && other === 'testing'));
  const paths = [
    ...NO_FIRE_EVENT,
    ...(isHook ? [] : [NO_EFFECTS]),
    ...forbiddenLayers.map((other) => ({ name: `@/${other}`, message: `${layer} may not import ${other}.` })),
    ...(isTest ? [] : [{ name: `@/${layer}`, message: 'Inside a layer, import the file directly.' }]),
  ];
  const patterns = [
    PARENT_IMPORT,
    ...(isTest ? [] : [{ regex: `^@/(?!${layer}/)[a-z]+/`, message: 'Import other layers through their barrel.' }]),
    ...(layer === 'engine' ? [ENGINE_PACKAGES] : []),
  ];
  return ['error', { paths, patterns }];
}

function rootImports({ isTest }) {
  const paths = [...NO_FIRE_EVENT, NO_EFFECTS, ...(isTest ? [] : [{ name: '@/testing', message: 'Only tests import @/testing.' }])];
  const patterns = [PARENT_IMPORT, ...(isTest ? [] : [{ regex: '^@/[a-z]+/', message: 'Import layers through their barrel.' }])];
  return ['error', { paths, patterns }];
}

const layerBlocks = LAYERS.flatMap((layer) => [
  {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    ignores: [...TEST_FILES, ...HOOK_FILES],
    rules: { 'no-restricted-imports': layerImports(layer, { isTest: false, isHook: false }) },
  },
  { files: [`src/${layer}/**/use-*.ts`], rules: { 'no-restricted-imports': layerImports(layer, { isTest: false, isHook: true }) } },
  { files: [`src/${layer}/**/*.test.{ts,tsx}`], rules: { 'no-restricted-imports': layerImports(layer, { isTest: true, isHook: false }) } },
]);

const viewBlocks = VIEW_LAYERS.map((layer) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  ignores: TEST_FILES,
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      { paths: [{ name: '@/engine', allowTypeImports: true, message: 'Views read engine types and results only.' }] },
    ],
  },
}));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  { files: ['src/*.{ts,tsx}'], ignores: TEST_FILES, rules: { 'no-restricted-imports': rootImports({ isTest: false }) } },
  { files: ['src/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': rootImports({ isTest: true }) } },
  { files: ['tests/**/*.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [PARENT_IMPORT] }] } },
  ...layerBlocks,
  ...viewBlocks,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [...HOOK_FILES, 'src/engine/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "MemberExpression[object.name='React'][property.name=/^use(Layout)?Effect$/]", message: 'Effects live in use-*.ts hooks.' },
      ],
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'fetch'],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'Take the time as a parameter.' },
        { selector: "NewExpression[callee.name='Date']", message: 'Take the time as a parameter.' },
        { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: 'Take randomness as a parameter.' },
      ],
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { 'no-comments': noComments },
    rules: {
      'no-comments/disallowComments': ['error', { allow: ['\\*', '@vitest-environment', 'eslint', 'global'] }],
    },
  },
);
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run scripts/eslint-config.test.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS. Si falla en un archivo real, ese archivo viola la tabla de capas. Arréglalo en el archivo (import por barrel, `import type`, alias), nunca relajando la configuración.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js scripts/eslint-config.test.ts src
git commit -m "build(lint): enforce layer boundaries, effects in hooks and user-event"
```

---

### Task 9: Nombres kebab-case y detector de duplicados (controles C1 y C3)

**Files:**
- Create: `.jscpd.json`
- Modify: `eslint.config.js`, `scripts/eslint-config.test.ts`, `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `ruleIdsFor` (Tarea 7).
- Produces:
  - La regla `check-file/*` sobre `src/` y `tests/`.
  - `npm run dup` (jscpd con umbral 0) dentro de `npm run check`.

- [ ] **Step 1: Tests de nombres (fallan)**

```bash
npm install -D eslint-plugin-check-file@3.3.2 jscpd@5.0.16
```

Dentro del `describe('eslint config', …)` de `scripts/eslint-config.test.ts`, agrega:

```ts
  describe('names', () => {
    const SOURCE = 'export const value = 1;\n';

    it('rejects a PascalCase file name', async () => {
      expect(await ruleIdsFor('src/ui/RoadMap.tsx', SOURCE)).toContain('check-file/filename-naming-convention');
    });

    it('rejects a PascalCase folder name', async () => {
      expect(await ruleIdsFor('src/ui/Shared/roadmap.tsx', SOURCE)).toContain('check-file/folder-naming-convention');
    });

    it('allows numbered kebab-case level files and test suffixes', async () => {
      expect(await ruleIdsFor('src/levels/04-iaas/01-the-first-ping.ts', SOURCE)).toEqual([]);
      expect(await ruleIdsFor('src/ui/roadmap.test.tsx', SOURCE)).toEqual([]);
    });
  });
```

Run: `npx vitest run scripts/eslint-config.test.ts`
Expected: FAIL en los dos rechazos.

- [ ] **Step 2: Activar la regla de nombres**

En `eslint.config.js`:
- Agrega `import checkFile from 'eslint-plugin-check-file';`.
- Agrega la constante `const KEBAB_CASE = '+([a-z0-9])*(-+([a-z0-9]))';` junto a las demás.
- Agrega este bloque antes del bloque de `no-comments`:

```js
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.{ts,tsx}': KEBAB_CASE }, { ignoreMiddleExtensions: true }],
      'check-file/folder-naming-convention': ['error', { 'src/**/': KEBAB_CASE, 'tests/**/': KEBAB_CASE }],
    },
  },
```

`KEBAB_CASE` no usa el patrón predefinido del plugin, porque ese exige que el nombre empiece con letra. Este acepta nombres como `04-iaas` y `01-the-first-ping`.

Run: `npx vitest run scripts/eslint-config.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 3: Detector de duplicados**

`.jscpd.json`:

```json
{
  "threshold": 0,
  "minTokens": 50,
  "minLines": 5,
  "reporters": ["console"],
  "ignore": ["**/node_modules/**", "**/dist/**", "**/test-results/**"]
}
```

En `package.json`, agrega el script `dup` y súmalo a `check`:

```json
    "dup": "jscpd src tests scripts",
    "check": "npm run typecheck && npm run lint && npm run structure && npm run dup && npm run test && npm run e2e"
```

Run: `npm run dup`
Expected: `Found 0 clones.` y código de salida 0. Si encuentra un clon, extrae la parte repetida a una función compartida en la capa que corresponda; no subas el umbral.

- [ ] **Step 4: Verificar**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .jscpd.json eslint.config.js scripts/eslint-config.test.ts package.json package-lock.json
git commit -m "build(lint): enforce kebab-case names and run the copy-paste detector"
```

---

### Task 10: Documentación al día

**Files:**
- Modify: `README.md`, `.claude/rules/folder-structure.md`, `.claude/rules/no-comments.md`, `.claude/rules/kebab-case-filenames.md`, `.claude/rules/exact-dependency-versions.md`, `.claude/rules/user-event-for-interactions.md`, `.claude/rules/dry.md`, `.claude/rules/no-raw-effects.md`, `.claude/rules/no-magic-strings.md`, `.claude/rules/pure-domain-core.md`, `.claude/rules/view-renders-domain-result.md`, `.claude/az-rules.json`, `docs/plans/2026-10-08-follow-the-packet-followups.md`, `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`

**Interfaces:**
- Consumes: Tareas 1 a 9.
- Produces: documentación que describe el estado real.

- [ ] **Step 1: README en inglés**

`README.md` completo:

```markdown
# Follow the packet

A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module; chapter 4 is being rebuilt as live incidents based on [lab 03](https://github.com/angelozdev/aws-commit-academy/blob/main/labs/03-ping-connectivity/README.md).

Design: [live incidents spec](../../docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md) · Plans: [clean base](../../docs/plans/2026-10-08-follow-the-packet-clean-base.md)

## Run

    npm install
    npx playwright install chromium
    npm run dev

## Check

    npm run check

Runs types, lint (layer boundaries, names, comments), the folder-structure check, the copy-paste detector, unit tests and Playwright. "Done" means it passes entirely.

## Layout

The code lives in layers under `src/`; every folder has a `CLAUDE.md` guide that says what belongs there and what it may import. The rules are in `.claude/rules/`.
```

- [ ] **Step 2: Reglas y manifiesto**

En cada regla de esta tabla, reemplaza la línea `Enforcement:` por la indicada:

| Regla | Línea nueva |
|-------|-------------|
| `folder-structure.md` | `Enforcement: no-restricted-imports rules generated from the layer table in eslint.config.js (npm run lint, proven by scripts/eslint-config.test.ts) and scripts/check-structure.ts for the 12-file cap and the guides (npm run structure).` |
| `no-comments.md` | `Enforcement: eslint-plugin-no-comments in npm run lint; only JSDoc and tool directives pass.` |
| `kebab-case-filenames.md` | `Enforcement: eslint-plugin-check-file on src/ and tests/ in npm run lint.` |
| `exact-dependency-versions.md` | `Enforcement: .npmrc with save-exact=true; package.json has no ^ or ~ ranges.` |
| `user-event-for-interactions.md` | `Enforcement: no-restricted-imports bans fireEvent from the Testing Library packages in npm run lint.` |
| `dry.md` | `Enforcement: jscpd with threshold 0 in npm run check (npm run dup).` |
| `no-raw-effects.md` | `Enforcement: no-restricted-imports and no-restricted-syntax forbid useEffect and useLayoutEffect outside use-*.ts files in npm run lint.` |

En `pure-domain-core.md` y `view-renders-domain-result.md`, si tienen línea `Enforcement:`, reemplázala por:
- en `pure-domain-core.md`: `Enforcement: no-restricted-imports, no-restricted-globals and no-restricted-syntax on src/engine/** in npm run lint.`;
- en `view-renders-domain-result.md`: `Enforcement: @typescript-eslint/no-restricted-imports lets src/scene/** and src/ui/** import only types from @/engine.`

Si alguna no tiene esa línea, agrégala al final.

Otros cambios en las reglas:
- **`user-event-for-interactions.md`:** cambia "The reference interaction test is `src/ui/shared/LevelScreen.test.tsx`." por "The first interaction test arrives with the incident screen (plan 2).".
- **`no-magic-strings.md`:** cambia "(in each chapter's `shared.ts`, today `src/levels/04-iaas/shared.ts`)" por "(in each chapter's `shared.ts` once levels exist, and in `src/testing/fixtures.ts` for tests)". Cambia también "(`src/copy/`; today `src/format.ts`)" por "(`src/copy/`)".

En `.claude/az-rules.json`:
- **Notas de cada regla:** cambia cada nota que empiece con `"enforcement accepted:"` por `"enforced: <la línea Enforcement de su regla, sin el prefijo>"`.
- **`folder-structure`:** agrega esta nota:
  `"deviation: boundaries use core no-restricted-imports generated from the layer table instead of eslint-plugin-boundaries (no extra dependency or alias resolver)"`.
- **`no-magic-strings`:** cambia la nota de constantes por
  `"constants: chapter shared.ts once levels exist, src/scene/theme.ts, src/storage/progress.ts (PROGRESS_KEY, MAX_STARS), src/copy/"`.
- **`user-event-for-interactions`:** cambia `"reference test src/ui/shared/LevelScreen.test.tsx"` por `"first interaction test arrives with the incident screen"`.
- Mantén 2 espacios de sangría y las claves ordenadas.

Run: `python3 -c "import json;json.load(open('.claude/az-rules.json'))" && echo OK`
Expected: `OK`

- [ ] **Step 3: Backlog y spec**

En `docs/plans/2026-10-08-follow-the-packet-followups.md`, agrega bajo el título:

```markdown
> **Estado (plan 1, `docs/plans/2026-10-08-follow-the-packet-clean-base.md`):** hechos A3, A4, A11, A12, B1-B3, B5-B6 y C1-C9. B4 y B7 pasan al plan 2 (el panel de getent ya no existe; la revisión del texto se hace con los textos nuevos). El destino del resto está en la tabla "Relación con el backlog" del spec de incidentes en vivo.
```

En `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`, reemplaza la oración:

"Por eso la batería de sondas agrega Echo Reply (tipo 0) a sus sondas ICMP."

por esta:

"La batería de sondas ya prueba Echo Reply (tipo 0) en sus sondas ICMP (`SERVICES` en `src/engine/exposure/exposure.ts`)."

- [ ] **Step 4: Verificar**

Run: `npm run check` (en `projects/follow-the-packet/`) y el chequeo de links de la raíz del repo (el comando de la sección "Chequeo de links" de `CLAUDE.md`).
Expected: PASS y `LINKS OK`.

- [ ] **Step 5: Commit**

`.claude/` sigue sin seguimiento en git hasta que el estudiante decida. Este commit lleva solo los archivos que git ya sigue:

```bash
git add README.md
git commit -m "docs: describe the layered base and its checks"
git -C ../.. add docs/plans/2026-10-08-follow-the-packet-followups.md docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md
git -C ../.. commit -m "docs: record the clean-base progress in the backlog and spec"
```
