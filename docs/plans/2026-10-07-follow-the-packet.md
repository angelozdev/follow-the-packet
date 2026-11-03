# Sigue el paquete: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir "Sigue el paquete", un juego web de estudio sobre redes en AWS con el capítulo 4 (7 niveles de Security Groups basados en el lab 03), validado por `npm run check`.

**Architecture:** Un motor de simulación en TS puro (`src/engine/`) recorre etapas (DNS, ruta, SG de salida, SG de entrada, Linux, vuelta) y devuelve el recorrido del paquete. Los niveles son datos validados con zod (`src/levels/`), uno por archivo. React gestiona la partida con un reducer puro (`src/game/`) y la interfaz (`src/ui/`); React Three Fiber dibuja la escena isométrica de papel y tinta a partir del recorrido (`src/scene/`).

**Tech Stack:** Vite, TypeScript, React, React Three Fiber, drei, three, zod, Vitest, Testing Library, Playwright, ESLint.

**Spec:** `docs/specs/2026-10-07-follow-the-packet-design.md`

## Global Constraints

- Carpeta del proyecto: `projects/follow-the-packet/`. Todas las rutas de este plan son relativas a esa carpeta salvo que empiecen por la raíz del repo.
- Nombres de archivos y carpetas en inglés, kebab-case. Textos visibles en español con ortografía completa (tildes, ñ, ¿?, ¡!).
- `src/engine/` no importa `react`, `three` ni `@react-three/*`.
- Un nivel = un archivo `src/levels/NN-<capítulo>/NN-<slug>.ts` con `export default defineLevel({...})`. Agregar un nivel no exige tocar ningún otro archivo.
- IPs de actores ficticias (rangos de documentación): tu Mac `198.51.100.7`, atacante `203.0.113.66`, sonda de internet `203.0.113.200`.
- Región `eu-west-1`, VPC `172.31.0.0/16`, subredes `172.31.16.0/20` (`eu-west-1a`) y `172.31.32.0/20` (`eu-west-1b`).
- Lenguaje simple en la interfaz: frases cortas, una idea por pantalla, ningún término sin definir.
- Arte: papel `#f6f1e7`, relleno `#fbf8f2`, sombra de papel `#efe8da`, tinta `#2b2b2b`, acento bermellón `#e4572e`. Tipografías: Newsreader (títulos), IBM Plex Sans (texto), IBM Plex Mono (IPs, comandos y reglas).
- Cámara ortográfica isométrica fija: zoom y desplazamiento, sin giro.
- Escritorio primero (viewport de referencia 1440×900); móvil fuera de v1.
- "Listo" = `npm run check` pasa entero (tipos, lint, unitarios, Playwright).
- Git: trabajar en la rama `feat/follow-the-packet`. Los pasos "Commit" se ejecutan solo si el estudiante aprobó commits por tarea al empezar la ejecución; si no, se omiten.
- Ningún comando `aws`.

## Review Focus

1. **`localStorage` corrupto o bloqueado** (modo privado, JSON roto): el juego debe abrir y jugarse; el progreso cae a vacío sin romper nada. Test en la tarea 9.
2. **Un enlace a un nivel que no existe** (`#/level/99-99`): debe mostrar "Nivel no encontrado" con un enlace al roadmap, no una pantalla en blanco. Test en la tarea 11.
3. **Relanzar después de un resultado**: la predicción solo cuenta la primera vez; relanzar no la vuelve a evaluar ni la cambia. Test en la tarea 9.
4. **Quitar reglas que ya existían** (por ejemplo, el SSH desde tu Mac): la evaluación no debe romperse ni castigar al jugador por cerrar de más. Test en la tarea 6.
5. **Atacante que se pasa de intentos**: todavía puede ganar, pero sin la segunda estrella. Test en la tarea 9.

---

### Task 1: Andamiaje del proyecto y capítulos del pensum

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/test-setup.ts`
- Create: `src/test-utils/repo.ts`
- Create: `src/levels/chapters.ts`
- Test: `src/levels/chapters.test.ts`

**Interfaces:**
- Produces: `CHAPTERS: Chapter[]` con `interface Chapter { number: number; title: string }`; `REPO_ROOT: string`; `readSyllabus(): string`; `syllabusChapters(text?): Chapter[]`; `syllabusLessons(text?): Set<string>`.

- [ ] **Step 1: Crear la rama y la carpeta**

```bash
cd "/Users/angelozdev/me/AWS Commit Academy"
git checkout -b feat/follow-the-packet
mkdir -p projects/follow-the-packet && cd projects/follow-the-packet
```

- [ ] **Step 2: Escribir `package.json`**

```json
{
  "name": "follow-the-packet",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "e2e": "playwright test",
    "check": "npm run typecheck && npm run lint && npm run test && npm run e2e"
  }
}
```

- [ ] **Step 3: Instalar dependencias**

Las versiones mayores de React, R3F, drei y zod quedan fijadas porque el código del plan usa sus APIs (R3F 9 exige React 19; drei 10 va con R3F 9; zod 4 para `superRefine` con `code: 'custom'`). El resto, la versión estable actual.

```bash
npm install react@^19 react-dom@^19 three @react-three/fiber@^9 @react-three/drei@^10 zod@^4
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/three @types/node vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks globals
npx playwright install chromium
```

Expected: `npm install` termina sin errores de dependencias (`ERESOLVE`). Si aparece `ERESOLVE`, copiar el error exacto y detenerse.

- [ ] **Step 4: Escribir la configuración**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

`vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    environment: 'node',
  },
});
```

`eslint.config.js`:

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

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
);
```

`.gitignore` (del proyecto):

```
node_modules/
dist/
test-results/
playwright-report/
```

`index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sigue el paquete</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (provisional; la tarea 11 lo reemplaza):

```tsx
export function App() {
  return (
    <main>
      <h1>Sigue el paquete</h1>
    </main>
  );
}
```

`src/styles.css` (provisional; la tarea 11 lo reemplaza):

```css
body {
  margin: 0;
  background: #f6f1e7;
  color: #2b2b2b;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}
```

`src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

- [ ] **Step 5: Escribir las utilidades para leer el pensum**

`src/test-utils/repo.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raíz del repo AWS Commit Academy (src/test-utils → raíz: 4 niveles arriba). */
export const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

export function readSyllabus(): string {
  return readFileSync(resolve(REPO_ROOT, 'syllabus.md'), 'utf8');
}

/** Encabezados `## N. Título` de syllabus.md. */
export function syllabusChapters(text = readSyllabus()): { number: number; title: string }[] {
  return [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ number: Number(m[1]), title: m[2].trim() }));
}

/** Nombres de lección de las líneas `- [ ] …` o `- [x] …`, sin " · verificada" ni los enlaces tras "→". */
export function syllabusLessons(text = readSyllabus()): Set<string> {
  return new Set([...text.matchAll(/^- \[[ x]\] (.+?)(?: · verificada)?(?: → .*)?$/gm)].map((m) => m[1].trim()));
}
```

- [ ] **Step 6: Escribir el test de capítulos (falla)**

`src/levels/chapters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { syllabusChapters } from '../test-utils/repo';
import { CHAPTERS } from './chapters';

describe('capítulos', () => {
  it('coinciden con los módulos de syllabus.md', () => {
    expect(CHAPTERS).toEqual(syllabusChapters());
  });

  it('son 20', () => {
    expect(CHAPTERS).toHaveLength(20);
  });
});
```

- [ ] **Step 7: Correr el test y ver que falla**

Run: `npx vitest run src/levels/chapters.test.ts`
Expected: FAIL, no encuentra `./chapters`.

- [ ] **Step 8: Escribir `src/levels/chapters.ts`**

```ts
export interface Chapter {
  number: number;
  title: string;
}

/** Los 20 módulos del pensum (syllabus.md). Un test exige que coincidan. */
export const CHAPTERS: Chapter[] = [
  { number: 1, title: 'Introducción' },
  { number: 2, title: 'Fundamentos de Cloud Computing y AWS' },
  { number: 3, title: 'Introducción a AWS' },
  { number: 4, title: 'Infraestructura Tradicional y Compute Clásico (IaaS)' },
  { number: 5, title: 'Alta disponibilidad en EC2' },
  { number: 6, title: 'Almacenamiento con S3 y CloudFront' },
  { number: 7, title: 'Bases de Datos con RDS' },
  { number: 8, title: 'Contenedores' },
  { number: 9, title: 'Redes y Arquitectura en AWS' },
  { number: 10, title: 'Principios de Diseño Cloud Native' },
  { number: 11, title: 'Arquitecturas Cloud Native y Serverless' },
  { number: 12, title: 'DynamoDB' },
  { number: 13, title: 'Infraestructura como Código (IaC)' },
  { number: 14, title: 'CI/CD y Despliegue de Aplicaciones' },
  { number: 15, title: 'Introducción a Git (opcional)' },
  { number: 16, title: 'Observabilidad y Operaciones' },
  { number: 17, title: 'Seguridad, Gobernanza y FinOps' },
  { number: 18, title: 'Kubernetes' },
  { number: 19, title: 'Kubernetes en AWS (EKS)' },
  { number: 20, title: 'Proyecto Final' },
];
```

- [ ] **Step 9: Verificar test, tipos y lint**

Run: `npx vitest run src/levels/chapters.test.ts && npm run typecheck && npm run lint`
Expected: 2 tests PASS; `tsc` y ESLint sin errores.

- [ ] **Step 10: Commit**

```bash
git add projects/follow-the-packet
git commit -m "feat(game): scaffold follow-the-packet with syllabus chapters"
```

---

### Task 2: IPs, esquema de red y DNS

**Files:**
- Create: `src/engine/cidr.ts`, `src/engine/schema.ts`, `src/engine/types.ts`, `src/engine/dns.ts`, `src/engine/fixtures.ts`
- Test: `src/engine/cidr.test.ts`, `src/engine/schema.test.ts`, `src/engine/dns.test.ts`

**Interfaces:**
- Produces:
  - `isIpv4(value: string): boolean`, `ipToInt(ip: string): number`, `parseCidr(cidr: string): { base: number; prefix: number }`, `ipInCidr(ip: string, cidr: string): boolean`
  - Esquemas zod: `ruleWhatSchema`, `rulePeerSchema`, `ruleSchema`, `securityGroupSchema`, `instanceSchema`, `subnetSchema`, `actorSchema`, `networkSchema`, `endpointSchema`, `packetSchema`, `checkpointSchema`, `icmpTypeSchema`
  - Tipos: `RuleWhat`, `RulePeer`, `Rule`, `SecurityGroup`, `Instance`, `Subnet`, `Actor`, `Network`, `Endpoint`, `PacketSpec`, `Checkpoint`, `StepStage`, `Verdict`, `RuleCheck`, `Step`, `Outcome`, `TcpdumpLine`, `Trace`
  - `publicDnsName(publicIp, region): string`, `privateDnsName(privateIp, region): string`, `resolveName(net: Network, name: string, fromInsideVpc: boolean): string | null`
  - Fixtures de test: `lab03Net(): Network`, `YOU_IP`, `ATTACKER_IP`, `sshFromYou(id)`, `allOut(id)`, `echoFrom(id, sgId, icmpType?)`, `withInbound(net, sgId, ...rules)`, `withInstance(net, id, patch)`, `ping(from, to)`, `tcp(from, to, port)`, `inst(id)`, `actor(id)`

- [ ] **Step 1: Escribir los tests de CIDR (fallan)**

`src/engine/cidr.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

describe('isIpv4', () => {
  it('acepta IPs válidas y rechaza nombres y octetos fuera de rango', () => {
    expect(isIpv4('172.31.16.131')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv4('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com')).toBe(false);
  });
});

describe('ipInCidr', () => {
  it('ubica IPs del lab 03 en sus subredes', () => {
    expect(ipInCidr('172.31.38.97', '172.31.0.0/16')).toBe(true);
    expect(ipInCidr('172.31.38.97', '172.31.32.0/20')).toBe(true);
    expect(ipInCidr('172.31.16.131', '172.31.32.0/20')).toBe(false);
  });

  it('0.0.0.0/0 incluye cualquier IP y /32 solo una', () => {
    expect(ipInCidr('203.0.113.66', '0.0.0.0/0')).toBe(true);
    expect(ipInCidr('198.51.100.7', '198.51.100.7/32')).toBe(true);
    expect(ipInCidr('198.51.100.8', '198.51.100.7/32')).toBe(false);
  });
});

describe('parseCidr', () => {
  it('rechaza prefijos inválidos', () => {
    expect(() => parseCidr('10.0.0.0/33')).toThrow('CIDR inválido');
    expect(() => parseCidr('10.0.0.0')).toThrow('CIDR inválido');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run src/engine/cidr.test.ts`
Expected: FAIL, no existe `./cidr`.

- [ ] **Step 3: Escribir `src/engine/cidr.ts`**

```ts
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpv4(value: string): boolean {
  const m = IPV4.exec(value);
  return m !== null && m.slice(1).every((part) => Number(part) <= 255);
}

export function ipToInt(ip: string): number {
  if (!isIpv4(ip)) throw new Error(`IP inválida: ${ip}`);
  // Aritmética en vez de operadores de bits: evita el signo de los enteros de 32 bits.
  return ip.split('.').reduce((acc, part) => acc * 256 + Number(part), 0);
}

export function parseCidr(cidr: string): { base: number; prefix: number } {
  const [ip, prefixText] = cidr.split('/');
  const prefix = Number(prefixText);
  if (prefixText === undefined || !Number.isInteger(prefix) || prefix < 0 || prefix > 32 || !isIpv4(ip)) {
    throw new Error(`CIDR inválido: ${cidr}`);
  }
  return { base: ipToInt(ip), prefix };
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const { base, prefix } = parseCidr(cidr);
  const size = 2 ** (32 - prefix);
  const start = Math.floor(base / size) * size;
  const value = ipToInt(ip);
  return value >= start && value < start + size;
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `npx vitest run src/engine/cidr.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Escribir el esquema y los tipos**

`src/engine/schema.ts`:

```ts
import { z } from 'zod';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

const ip = z.string().refine(isIpv4, 'IPv4 inválida');
const cidr = z.string().refine((value) => {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}, 'CIDR inválido');
const port = z.number().int().min(0).max(65535);

/** 0 = Echo Reply, 8 = Echo Request. Los únicos tipos ICMP del juego en v1. */
export const icmpTypeSchema = z.union([z.literal(0), z.literal(8)]);

export const ruleWhatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('tcp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('udp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('icmp'), icmpType: z.union([icmpTypeSchema, z.literal('all')]) }),
]);

/** En una regla de entrada, el peer es el origen; en una de salida, el destino. */
export const rulePeerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cidr'), cidr }),
  z.object({ kind: z.literal('sg'), sgId: z.string().min(1) }),
]);

export const ruleSchema = z.object({ id: z.string().min(1), what: ruleWhatSchema, peer: rulePeerSchema });

export const securityGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  inbound: z.array(ruleSchema),
  outbound: z.array(ruleSchema),
});

export const instanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subnetId: z.string().min(1),
  privateIp: ip,
  publicIp: ip.optional(),
  sgIds: z.array(z.string().min(1)),
  linux: z.object({ ignoreIcmpEcho: z.boolean(), listeningTcpPorts: z.array(port) }),
  /** Adónde apunta la app de esta instancia: IP o nombre DNS. */
  appTarget: z.string().min(1).optional(),
});

export const subnetSchema = z.object({ id: z.string().min(1), az: z.string().min(1), cidr });

export const actorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ip,
  kind: z.enum(['you', 'attacker']),
});

function safeInCidr(value: string, range: string): boolean {
  try {
    return ipInCidr(value, range);
  } catch {
    return false;
  }
}

export const networkSchema = z
  .object({
    region: z.string().min(1),
    vpcCidr: cidr,
    subnets: z.array(subnetSchema).min(1),
    instances: z.array(instanceSchema),
    securityGroups: z.array(securityGroupSchema),
    actors: z.array(actorSchema),
  })
  .superRefine((net, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = [
      ...net.subnets.map((s) => s.id),
      ...net.instances.map((i) => i.id),
      ...net.securityGroups.map((g) => g.id),
      ...net.actors.map((a) => a.id),
    ];
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated) fail(`id repetido: ${repeated}`);
    for (const subnet of net.subnets) {
      if (!safeInCidr(subnet.cidr.split('/')[0], net.vpcCidr)) fail(`${subnet.id}: ${subnet.cidr} no está dentro de la VPC`);
    }
    for (const instance of net.instances) {
      const subnet = net.subnets.find((s) => s.id === instance.subnetId);
      if (!subnet) fail(`${instance.id}: la subred ${instance.subnetId} no existe`);
      else if (!safeInCidr(instance.privateIp, subnet.cidr)) fail(`${instance.id}: ${instance.privateIp} no está en ${subnet.cidr}`);
      for (const sgId of instance.sgIds) {
        if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${instance.id}: el SG ${sgId} no existe`);
      }
    }
    for (const group of net.securityGroups) {
      for (const rule of [...group.inbound, ...group.outbound]) {
        const peer = rule.peer;
        if (peer.kind === 'sg') {
          const sgId = peer.sgId;
          if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${group.id}/${rule.id}: el SG ${sgId} no existe`);
        }
      }
    }
  });

export const endpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('instance'), id: z.string().min(1) }),
  z.object({ kind: z.literal('actor'), id: z.string().min(1) }),
]);

export const packetSchema = z
  .object({
    from: endpointSchema,
    /** IP, nombre DNS o "@appTarget" (lo que tenga configurado la app de la instancia de origen). */
    to: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'icmp']),
    port: port.optional(),
    icmpType: icmpTypeSchema.optional(),
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP necesita icmpType; TCP y UDP necesitan port',
  });

export const checkpointSchema = z.object({
  stage: z.enum(['dns', 'route', 'sg-out', 'sg-in', 'linux', 'reply']),
  at: z.string().min(1),
});
```

`src/engine/types.ts`:

```ts
import type { z } from 'zod';
import type {
  actorSchema,
  checkpointSchema,
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
export type Checkpoint = z.infer<typeof checkpointSchema>;

export type StepStage = 'dns' | 'route' | 'nat' | 'sg-out' | 'sg-in' | 'linux' | 'reply';
export type Verdict = 'pass' | 'drop' | 'reject' | 'info';

export interface RuleCheck {
  sgId: string;
  ruleId: string;
  what: boolean;
  from: boolean;
}

export interface Step {
  stage: StepStage;
  /** Pieza del mapa: id de instancia o actor, "igw" o "vpc". */
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
  /** IP de origen que ve el destino (cambia con NAT). */
  effectiveSource: string;
  tcpdump: TcpdumpLine[];
}
```

- [ ] **Step 6: Escribir los fixtures de test**

`src/engine/fixtures.ts` (solo lo importan tests):

```ts
import type { Endpoint, Instance, Network, PacketSpec, Rule } from './types';

export const YOU_IP = '198.51.100.7';
export const ATTACKER_IP = '203.0.113.66';

export const sshFromYou = (id: string): Rule => ({
  id,
  what: { kind: 'tcp', fromPort: 22, toPort: 22 },
  peer: { kind: 'cidr', cidr: `${YOU_IP}/32` },
});
export const allOut = (id: string): Rule => ({ id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
export const echoFrom = (id: string, sgId: string, icmpType: 0 | 8 = 8): Rule => ({
  id,
  what: { kind: 'icmp', icmpType },
  peer: { kind: 'sg', sgId },
});

export const inst = (id: string): Endpoint => ({ kind: 'instance', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

/** La red del lab 03: dos servidores en AZs distintas, solo SSH desde tu Mac. */
export function lab03Net(): Network {
  return {
    region: 'eu-west-1',
    vpcCidr: '172.31.0.0/16',
    subnets: [
      { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
      { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
    ],
    instances: [
      {
        id: 'servidor1',
        name: 'servidor1',
        subnetId: 'subnet-a',
        privateIp: '172.31.16.131',
        publicIp: '54.78.154.66',
        sgIds: ['sg-servidor1'],
        linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
      {
        id: 'servidor2',
        name: 'servidor2',
        subnetId: 'subnet-b',
        privateIp: '172.31.38.97',
        publicIp: '34.244.254.100',
        sgIds: ['sg-servidor2'],
        linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
    ],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOut('out-1')] },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOut('out-2')] },
      {
        id: 'sg-default',
        name: 'default',
        inbound: [{ id: 'default-self', what: { kind: 'all' }, peer: { kind: 'sg', sgId: 'sg-default' } }],
        outbound: [allOut('out-default')],
      },
    ],
    actors: [
      { id: 'you', name: 'Tu Mac', ip: YOU_IP, kind: 'you' },
      { id: 'attacker', name: 'Atacante', ip: ATTACKER_IP, kind: 'attacker' },
    ],
  };
}

export function withInbound(net: Network, sgId: string, ...rules: Rule[]): Network {
  return {
    ...net,
    securityGroups: net.securityGroups.map((g) => (g.id === sgId ? { ...g, inbound: [...g.inbound, ...rules] } : g)),
  };
}

export function withInstance(net: Network, id: string, patch: Partial<Instance>): Network {
  return { ...net, instances: net.instances.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}
```

- [ ] **Step 7: Escribir los tests del esquema y del DNS (fallan)**

`src/engine/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { lab03Net, withInstance } from './fixtures';
import { networkSchema, packetSchema } from './schema';

describe('networkSchema', () => {
  it('acepta la red del lab 03', () => {
    expect(networkSchema.safeParse(lab03Net()).success).toBe(true);
  });

  it('rechaza una IP privada fuera de su subred', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' });
    const result = networkSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('no está en 172.31.16.0/20');
  });

  it('rechaza un SG que no existe', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { sgIds: ['sg-fantasma'] });
    expect(networkSchema.safeParse(bad).success).toBe(false);
  });
});

describe('packetSchema', () => {
  it('exige icmpType en ICMP y port en TCP', () => {
    const from = { kind: 'instance', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });
});
```

`src/engine/dns.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { privateDnsName, publicDnsName, resolveName } from './dns';
import { lab03Net } from './fixtures';

describe('nombres DNS de EC2', () => {
  it('siguen el formato que vimos en el lab 03', () => {
    expect(publicDnsName('34.244.254.100', 'eu-west-1')).toBe('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com');
    expect(privateDnsName('172.31.38.97', 'eu-west-1')).toBe('ip-172-31-38-97.eu-west-1.compute.internal');
  });
});

describe('resolveName (lab 03, V3)', () => {
  const net = lab03Net();
  const publicName = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

  it('desde dentro de la VPC, el nombre público da la IP privada', () => {
    expect(resolveName(net, publicName, true)).toBe('172.31.38.97');
  });

  it('desde fuera, el mismo nombre da la IP pública', () => {
    expect(resolveName(net, publicName, false)).toBe('34.244.254.100');
  });

  it('el nombre privado no se resuelve desde fuera', () => {
    expect(resolveName(net, 'ip-172-31-38-97.eu-west-1.compute.internal', false)).toBeNull();
  });

  it('un nombre desconocido no se resuelve', () => {
    expect(resolveName(net, 'no-existe.example', true)).toBeNull();
  });
});
```

- [ ] **Step 8: Correr y ver que fallan**

Run: `npx vitest run src/engine/schema.test.ts src/engine/dns.test.ts`
Expected: `schema.test.ts` PASS (el esquema ya existe) y `dns.test.ts` FAIL, no existe `./dns`.

- [ ] **Step 9: Escribir `src/engine/dns.ts`**

```ts
import type { Network } from './types';

export function publicDnsName(publicIp: string, region: string): string {
  return `ec2-${publicIp.replaceAll('.', '-')}.${region}.compute.amazonaws.com`;
}

export function privateDnsName(privateIp: string, region: string): string {
  return `ip-${privateIp.replaceAll('.', '-')}.${region}.compute.internal`;
}

/**
 * Resuelve como el DNS de AWS: desde dentro de la VPC, el nombre público de una
 * instancia da su IP privada; desde fuera, la pública (lab 03, V3). El nombre
 * privado solo existe dentro de la VPC.
 */
export function resolveName(net: Network, name: string, fromInsideVpc: boolean): string | null {
  for (const instance of net.instances) {
    if (instance.publicIp && name === publicDnsName(instance.publicIp, net.region)) {
      return fromInsideVpc ? instance.privateIp : instance.publicIp;
    }
    if (name === privateDnsName(instance.privateIp, net.region)) {
      return fromInsideVpc ? instance.privateIp : null;
    }
  }
  return null;
}
```

- [ ] **Step 10: Verificar**

Run: `npx vitest run src/engine && npm run typecheck && npm run lint`
Expected: todos los tests de `src/engine` PASS; tipos y lint sin errores.

- [ ] **Step 11: Commit**

```bash
git add projects/follow-the-packet/src/engine
git commit -m "feat(engine): add CIDR math, network schema and split-horizon DNS"
```

---

### Task 3: Coincidencia de reglas

**Files:**
- Create: `src/engine/rules.ts`
- Test: `src/engine/rules.test.ts`

**Interfaces:**
- Consumes: `RuleWhat`, `RulePeer`, `SecurityGroup`, `PacketSpec`, `RuleCheck` (tarea 2); `ipInCidr` (tarea 2).
- Produces: `matchesWhat(what: RuleWhat, packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): boolean`; `interface PeerContext { ip: string; sgIds: string[] }`; `matchesPeer(peer: RulePeer, ctx: PeerContext): boolean`; `checkRules(groups: SecurityGroup[], direction: 'inbound' | 'outbound', packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>, ctx: PeerContext): { allowed: boolean; checks: RuleCheck[] }`.

- [ ] **Step 1: Escribir los tests (fallan)**

`src/engine/rules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { echoFrom, sshFromYou } from './fixtures';
import { checkRules, matchesPeer, matchesWhat } from './rules';
import type { SecurityGroup } from './types';

const echoRequest = { protocol: 'icmp', icmpType: 8 } as const;
const echoReply = { protocol: 'icmp', icmpType: 0 } as const;

describe('matchesWhat', () => {
  it('lab 03, V5: una regla Echo Reply no coincide con un Echo Request', () => {
    expect(matchesWhat({ kind: 'icmp', icmpType: 0 }, echoRequest)).toBe(false);
    expect(matchesWhat({ kind: 'icmp', icmpType: 8 }, echoRequest)).toBe(true);
    expect(matchesWhat({ kind: 'icmp', icmpType: 'all' }, echoReply)).toBe(true);
  });

  it('lab 03, paso 3: SSH (TCP 22) no coincide con un ping', () => {
    expect(matchesWhat({ kind: 'tcp', fromPort: 22, toPort: 22 }, echoRequest)).toBe(false);
  });

  it('respeta rangos de puertos y "todo el tráfico"', () => {
    expect(matchesWhat({ kind: 'tcp', fromPort: 1000, toPort: 2000 }, { protocol: 'tcp', port: 1500 })).toBe(true);
    expect(matchesWhat({ kind: 'tcp', fromPort: 1000, toPort: 2000 }, { protocol: 'udp', port: 1500 })).toBe(false);
    expect(matchesWhat({ kind: 'all' }, { protocol: 'udp', port: 53 })).toBe(true);
  });
});

describe('matchesPeer', () => {
  it('un CIDR compara la IP; un SG compara la pertenencia', () => {
    expect(matchesPeer({ kind: 'cidr', cidr: '198.51.100.7/32' }, { ip: '198.51.100.7', sgIds: [] })).toBe(true);
    expect(matchesPeer({ kind: 'sg', sgId: 'sg-servidor1' }, { ip: '172.31.16.131', sgIds: ['sg-servidor1'] })).toBe(true);
    expect(matchesPeer({ kind: 'sg', sgId: 'sg-servidor1' }, { ip: '172.31.16.131', sgIds: [] })).toBe(false);
  });
});

describe('checkRules', () => {
  const groups: SecurityGroup[] = [
    { id: 'sg-a', name: 'a', inbound: [sshFromYou('ssh')], outbound: [] },
    { id: 'sg-b', name: 'b', inbound: [echoFrom('echo', 'sg-servidor1')], outbound: [] },
  ];

  it('las reglas de varios SGs se suman: basta con que una coincida en qué y desde dónde', () => {
    const result = checkRules(groups, 'inbound', echoRequest, { ip: '172.31.16.131', sgIds: ['sg-servidor1'] });
    expect(result.allowed).toBe(true);
    expect(result.checks).toEqual([
      { sgId: 'sg-a', ruleId: 'ssh', what: false, from: false },
      { sgId: 'sg-b', ruleId: 'echo', what: true, from: true },
    ]);
  });

  it('lab 03, V4: tu IP está en la regla de SSH, pero el ping no coincide en el qué', () => {
    const result = checkRules(groups, 'inbound', echoRequest, { ip: '198.51.100.7', sgIds: [] });
    expect(result.allowed).toBe(false);
    expect(result.checks[0]).toEqual({ sgId: 'sg-a', ruleId: 'ssh', what: false, from: true });
  });

  it('sin reglas no pasa nada (un SG solo permite)', () => {
    expect(checkRules([], 'inbound', echoRequest, { ip: '1.2.3.4', sgIds: [] })).toEqual({ allowed: false, checks: [] });
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run src/engine/rules.test.ts`
Expected: FAIL, no existe `./rules`.

- [ ] **Step 3: Escribir `src/engine/rules.ts`**

```ts
import { ipInCidr } from './cidr';
import type { PacketSpec, RuleCheck, RulePeer, RuleWhat, SecurityGroup } from './types';

type PacketKind = Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>;

export interface PeerContext {
  /** IP que ve la regla (origen en entrada, destino en salida). */
  ip: string;
  /** SGs del otro extremo; vacío si el paquete no viaja por IP privada dentro de la VPC. */
  sgIds: string[];
}

export function matchesWhat(what: RuleWhat, packet: PacketKind): boolean {
  switch (what.kind) {
    case 'all':
      return true;
    case 'tcp':
    case 'udp':
      return packet.protocol === what.kind && packet.port !== undefined && packet.port >= what.fromPort && packet.port <= what.toPort;
    case 'icmp':
      return packet.protocol === 'icmp' && (what.icmpType === 'all' || what.icmpType === packet.icmpType);
  }
}

export function matchesPeer(peer: RulePeer, ctx: PeerContext): boolean {
  return peer.kind === 'cidr' ? ipInCidr(ctx.ip, peer.cidr) : ctx.sgIds.includes(peer.sgId);
}

/** Un SG solo permite: pasa si alguna regla de alguno de los SGs coincide en qué y desde dónde a la vez. */
export function checkRules(
  groups: SecurityGroup[],
  direction: 'inbound' | 'outbound',
  packet: PacketKind,
  ctx: PeerContext,
): { allowed: boolean; checks: RuleCheck[] } {
  const checks = groups.flatMap((group) =>
    group[direction].map((rule) => ({
      sgId: group.id,
      ruleId: rule.id,
      what: matchesWhat(rule.what, packet),
      from: matchesPeer(rule.peer, ctx),
    })),
  );
  return { allowed: checks.some((c) => c.what && c.from), checks };
}
```

- [ ] **Step 4: Verificar**

Run: `npx vitest run src/engine/rules.test.ts && npm run typecheck && npm run lint`
Expected: PASS; tipos y lint sin errores.

- [ ] **Step 5: Commit**

```bash
git add projects/follow-the-packet/src/engine/rules.ts projects/follow-the-packet/src/engine/rules.test.ts
git commit -m "feat(engine): match security group rules by what and from"
```

---

### Task 4: Simulación del paquete por etapas

**Files:**
- Create: `src/engine/stages/context.ts`, `src/engine/stages/dns.ts`, `src/engine/stages/route.ts`, `src/engine/stages/sg-out.ts`, `src/engine/stages/sg-in.ts`, `src/engine/stages/linux.ts`, `src/engine/stages/reply.ts`
- Create: `src/engine/simulate.ts`, `src/engine/checkpoints.ts`
- Test: `src/engine/simulate.test.ts`, `src/engine/checkpoints.test.ts`

**Interfaces:**
- Consumes: tipos (tarea 2), `checkRules` (tarea 3), `resolveName` (tarea 2), `ipInCidr`/`isIpv4` (tarea 2).
- Produces: `simulate(net: Network, packet: PacketSpec): Trace`; `PIPELINE: Stage[]`; `deathPoint(trace: Trace): Checkpoint`; `sameCheckpoint(a: Checkpoint, b: Checkpoint): boolean`; `describePacket(p: PacketSpec): string`.

- [ ] **Step 1: Escribir los tests de simulación (fallan)**

`src/engine/simulate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deathPoint } from './checkpoints';
import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound, withInstance } from './fixtures';
import { simulate } from './simulate';
import type { Network } from './types';

const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));

describe('lab 03 en el motor', () => {
  it('paso 3: sin regla ICMP el ping muere en la entrada de servidor2 y tcpdump no ve nada', () => {
    const trace = simulate(lab03Net(), ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
    expect(trace.tcpdump).toEqual([]);
  });

  it('paso 5: con Echo Request desde el SG de servidor1 responde, y tcpdump ve In y Out', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.tcpdump.map((l) => `${l.instanceId} ${l.direction}`)).toEqual(['servidor2 In', 'servidor2 Out']);
  });

  it('V1: stateful; la respuesta vuelve sin regla en servidor1, pero al revés no pasa', () => {
    expect(simulate(withEcho(), ping(inst('servidor1'), S2.private)).outcome).toBe('replied');
    const back = simulate(withEcho(), ping(inst('servidor2'), S1.private));
    expect(back.outcome).toBe('timeout');
    expect(deathPoint(back)).toEqual({ stage: 'sg-in', at: 'servidor1' });
  });

  it('V5: una regla Echo Reply no deja entrar un ping', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('reply', 'sg-servidor1', 0));
    expect(simulate(net, ping(inst('servidor1'), S2.private)).outcome).toBe('timeout');
  });

  it('V2: por la IP pública el origen cambia (NAT) y la regla con SG como origen no coincide', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), S2.public));
    expect(trace.steps.some((s) => s.stage === 'nat')).toBe(true);
    expect(trace.effectiveSource).toBe(S1.public);
    expect(trace.outcome).toBe('timeout');
    const sgIn = trace.steps.find((s) => s.stage === 'sg-in');
    expect(sgIn?.checks?.find((c) => c.ruleId === 'echo')).toMatchObject({ what: true, from: false });
  });

  it('V2: con la IP pública de servidor1 como origen /32, sí pasa por la pública', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'echo-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: `${S1.public}/32` },
    });
    expect(simulate(net, ping(inst('servidor1'), S2.public)).outcome).toBe('replied');
  });

  it('V3: por el nombre público desde dentro resuelve a la IP privada y responde', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(trace.resolvedIp).toBe(S2.private);
    expect(trace.outcome).toBe('replied');
  });

  it('V4: el ping desde tu Mac a la IP pública se descarta aunque tu IP tenga SSH', () => {
    const trace = simulate(withEcho(), ping(actor('you'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
  });

  it('V6: Linux que ignora el ping; llega (tcpdump In) pero nadie responde', () => {
    const net = withInstance(withEcho(), 'servidor2', { linux: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } });
    const trace = simulate(net, ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(deathPoint(trace)).toEqual({ stage: 'linux', at: 'servidor2' });
    expect(trace.tcpdump.map((l) => l.direction)).toEqual(['In']);
  });

  it('TCP a un puerto sin programa escuchando: connection refused', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'web',
      what: { kind: 'tcp', fromPort: 80, toPort: 80 },
      peer: { kind: 'sg', sgId: 'sg-servidor1' },
    });
    const trace = simulate(net, tcp(inst('servidor1'), S2.private, 80));
    expect(trace.outcome).toBe('refused');
    expect(trace.tcpdump.map((l) => l.summary)).toEqual(['TCP 80', 'TCP 80 RST']);
  });

  it('una IP privada desde internet no tiene camino: timeout en el internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('V8: el SG default solo deja entrar a sus miembros', () => {
    const onlyServer2 = withInstance(lab03Net(), 'servidor2', { sgIds: ['sg-servidor2', 'sg-default'] });
    expect(simulate(onlyServer2, ping(inst('servidor1'), S2.private)).outcome).toBe('timeout');
    const both = withInstance(onlyServer2, 'servidor1', { sgIds: ['sg-servidor1', 'sg-default'] });
    expect(simulate(both, ping(inst('servidor1'), S2.private)).outcome).toBe('replied');
  });

  it('sin IP pública no se sale a internet', () => {
    const net = withInstance(withEcho(), 'servidor1', { publicIp: undefined });
    const trace = simulate(net, ping(inst('servidor1'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('la salida del origen también cuenta', () => {
    const net: Network = {
      ...withEcho(),
      securityGroups: withEcho().securityGroups.map((g) => (g.id === 'sg-servidor1' ? { ...g, outbound: [] } : g)),
    };
    const trace = simulate(net, ping(inst('servidor1'), S2.private));
    expect(deathPoint(trace)).toEqual({ stage: 'sg-out', at: 'servidor1' });
  });

  it('un nombre desconocido no se resuelve', () => {
    const trace = simulate(lab03Net(), ping(inst('servidor1'), 'no-existe.example'));
    expect(trace.outcome).toBe('unresolved');
    expect(deathPoint(trace)).toEqual({ stage: 'dns', at: 'servidor1' });
  });
});
```

`src/engine/checkpoints.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deathPoint, sameCheckpoint } from './checkpoints';
import type { Trace } from './types';

const base: Omit<Trace, 'steps' | 'outcome'> = {
  resolvedIp: '172.31.38.97',
  destinationId: 'servidor2',
  effectiveSource: '172.31.16.131',
  tcpdump: [],
};

describe('deathPoint', () => {
  it('es el primer paso que descarta o rechaza', () => {
    const trace: Trace = {
      ...base,
      outcome: 'timeout',
      steps: [
        { stage: 'route', at: 'vpc', verdict: 'pass', reason: '' },
        { stage: 'sg-in', at: 'servidor2', verdict: 'drop', reason: '' },
      ],
    };
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
  });

  it('si nada lo frena, es la respuesta en el destino', () => {
    const trace: Trace = { ...base, outcome: 'replied', steps: [{ stage: 'reply', at: 'servidor2', verdict: 'pass', reason: '' }] };
    expect(deathPoint(trace)).toEqual({ stage: 'reply', at: 'servidor2' });
  });
});

describe('sameCheckpoint', () => {
  it('compara etapa y pieza', () => {
    expect(sameCheckpoint({ stage: 'sg-in', at: 'a' }, { stage: 'sg-in', at: 'a' })).toBe(true);
    expect(sameCheckpoint({ stage: 'sg-in', at: 'a' }, { stage: 'linux', at: 'a' })).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/engine/simulate.test.ts src/engine/checkpoints.test.ts`
Expected: FAIL, no existen `./simulate` ni `./checkpoints`.

- [ ] **Step 3: Escribir el contexto de las etapas**

`src/engine/stages/context.ts`:

```ts
import type { Endpoint, Instance, Network, Outcome, PacketSpec, SecurityGroup, Step, TcpdumpLine } from '../types';

export interface SimContext {
  net: Network;
  packet: PacketSpec;
  source: { endpoint: Endpoint; id: string; ip: string; inside: boolean; instance?: Instance };
  destIp?: string;
  dest?: Instance;
  path?: 'private' | 'public';
  effectiveSource?: string;
  steps: Step[];
  tcpdump: TcpdumpLine[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
/** Una etapa lee y amplía el contexto; simulate() crea un contexto nuevo en cada llamada. */
export type Stage = (ctx: SimContext) => StageResult;

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function groupsOf(net: Network, instance: Instance): SecurityGroup[] {
  return instance.sgIds.flatMap((id) => net.securityGroups.filter((g) => g.id === id));
}

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
```

- [ ] **Step 4: Escribir las seis etapas**

`src/engine/stages/dns.ts`:

```ts
import { isIpv4 } from '../cidr';
import { resolveName } from '../dns';
import { CONTINUE, stop, type Stage } from './context';

export const dnsStage: Stage = (ctx) => {
  const { packet, source, net } = ctx;
  if (isIpv4(packet.to)) {
    ctx.destIp = packet.to;
    return CONTINUE;
  }
  const where = source.inside ? 'dentro' : 'fuera';
  const ip = resolveName(net, packet.to, source.inside);
  if (ip === null) {
    ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'drop', reason: `Nadie responde por el nombre ${packet.to} desde ${where} de la VPC.` });
    return stop('unresolved');
  }
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'info', reason: `${packet.to} → ${ip} (preguntando desde ${where} de la VPC)` });
  return CONTINUE;
};
```

`src/engine/stages/route.ts`:

```ts
import { ipInCidr } from '../cidr';
import { CONTINUE, stop, type Stage } from './context';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (ipInCidr(destIp, net.vpcCidr)) {
    if (!source.inside) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `${destIp} es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.` });
      return stop('timeout');
    }
    const dest = net.instances.find((i) => i.privateIp === destIp);
    if (!dest) {
      ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'drop', reason: `Ninguna instancia tiene la IP ${destIp}.` });
      return stop('timeout');
    }
    ctx.dest = dest;
    ctx.path = 'private';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'pass', reason: 'Viaja por dentro de la VPC, con IPs privadas.' });
    return CONTINUE;
  }

  const dest = net.instances.find((i) => i.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `Ninguna instancia de la VPC tiene la IP pública ${destIp}.` });
    return stop('timeout');
  }
  if (source.instance) {
    const publicIp = source.instance.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `${source.instance.name} no tiene IP pública: no puede salir a internet.` });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: 'igw', verdict: 'info', reason: `Sale por el internet gateway: el origen cambia de ${source.ip} a ${publicIp}.` });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'pass', reason: 'Entra desde internet por el internet gateway.' });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
```

`src/engine/stages/sg-out.ts`:

```ts
import { checkRules } from '../rules';
import { CONTINUE, groupsOf, stop, type Stage } from './context';

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
    reason: allowed ? `La salida de ${instance.name} lo deja salir.` : `Ninguna regla de salida de ${instance.name} coincide.`,
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

`src/engine/stages/sg-in.ts`:

```ts
import { checkRules } from '../rules';
import { CONTINUE, groupsOf, stop, type Stage } from './context';

export const sgInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  // Un SG como origen solo coincide si el paquete viaja por IP privada dentro de la VPC (lab 03, V2).
  const sgIds = ctx.path === 'private' && ctx.source.instance ? ctx.source.instance.sgIds : [];
  const { allowed, checks } = checkRules(groupsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, sgIds });
  ctx.steps.push({
    stage: 'sg-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: allowed
      ? `El SG de ${dest.name} lo deja entrar.`
      : `Descartado en silencio: ninguna regla de entrada de ${dest.name} coincide en qué y desde dónde a la vez.`,
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
```

`src/engine/stages/linux.ts`:

```ts
import { CONTINUE, describePacket, stop, type Stage } from './context';

export const linuxStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'In', src, dst: dest.privateIp, summary: describePacket(p) });

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega un ${describePacket(p)} que nadie pidió: Linux no contesta.` });
      return stop('arrived-no-reply');
    }
    if (dest.linux.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega, pero Linux de ${dest.name} tiene icmp_echo_ignore_all=1 y no contesta.` });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: `Linux de ${dest.name} contesta.` });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    if (!dest.linux.listeningTcpPorts.includes(p.port!)) {
      ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: src, summary: `TCP ${p.port} RST` });
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'reject', reason: `Llega, pero nada escucha en el puerto ${p.port}: Linux contesta "connection refused".` });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: `Un programa escucha en el puerto ${p.port} y acepta.` });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega un paquete UDP ${p.port}, pero en este juego ningún servicio UDP contesta.` });
  return stop('arrived-no-reply');
};
```

`src/engine/stages/reply.ts`:

```ts
import { stop, type Stage } from './context';

export const replyStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const summary = p.protocol === 'icmp' ? 'ICMP echo reply' : `${p.protocol.toUpperCase()} ${p.port} respuesta`;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: ctx.effectiveSource!, summary });
  ctx.steps.push({ stage: 'reply', at: dest.id, verdict: 'pass', reason: 'La respuesta vuelve sola: el SG es stateful y recuerda la conversación.' });
  return stop('replied');
};
```

- [ ] **Step 5: Escribir `simulate` y los puntos de control**

`src/engine/simulate.ts`:

```ts
import type { SimContext, Stage } from './stages/context';
import { dnsStage } from './stages/dns';
import { linuxStage } from './stages/linux';
import { replyStage } from './stages/reply';
import { routeStage } from './stages/route';
import { sgInStage } from './stages/sg-in';
import { sgOutStage } from './stages/sg-out';
import type { Endpoint, Network, Outcome, PacketSpec, Trace } from './types';

/** Orden de las etapas. Un capítulo nuevo (por ejemplo, NACL) agrega etapas aquí. */
export const PIPELINE: Stage[] = [dnsStage, routeStage, sgOutStage, sgInStage, linuxStage, replyStage];

function resolveSource(net: Network, from: Endpoint): SimContext['source'] {
  if (from.kind === 'instance') {
    const instance = net.instances.find((i) => i.id === from.id);
    if (!instance) throw new Error(`No existe la instancia ${from.id}`);
    return { endpoint: from, id: instance.id, ip: instance.privateIp, inside: true, instance };
  }
  const found = net.actors.find((a) => a.id === from.id);
  if (!found) throw new Error(`No existe el actor ${from.id}`);
  return { endpoint: from, id: found.id, ip: found.ip, inside: false };
}

function finish(ctx: SimContext, outcome: Outcome): Trace {
  return {
    steps: ctx.steps,
    outcome,
    resolvedIp: ctx.destIp ?? null,
    destinationId: ctx.dest?.id ?? null,
    effectiveSource: ctx.effectiveSource ?? ctx.source.ip,
    tcpdump: ctx.tcpdump,
  };
}

/** Recorre las etapas en orden. Pura: misma entrada, mismo recorrido. */
export function simulate(net: Network, packet: PacketSpec): Trace {
  const ctx: SimContext = { net, packet, source: resolveSource(net, packet.from), steps: [], tcpdump: [] };
  for (const stage of PIPELINE) {
    const result = stage(ctx);
    if (result.done) return finish(ctx, result.outcome);
  }
  throw new Error('La simulación terminó sin resultado');
}
```

`src/engine/checkpoints.ts`:

```ts
import type { Checkpoint, Trace } from './types';

/** Dónde murió el paquete; si no murió, la respuesta en el destino. */
export function deathPoint(trace: Trace): Checkpoint {
  const stopStep = trace.steps.find((s) => s.verdict === 'drop' || s.verdict === 'reject');
  if (stopStep) return { stage: stopStep.stage === 'nat' ? 'route' : stopStep.stage, at: stopStep.at };
  return { stage: 'reply', at: trace.destinationId ?? 'vpc' };
}

export function sameCheckpoint(a: Checkpoint, b: Checkpoint): boolean {
  return a.stage === b.stage && a.at === b.at;
}
```

- [ ] **Step 6: Verificar**

Run: `npx vitest run src/engine && npm run typecheck && npm run lint`
Expected: todos PASS (15 de simulación + 3 de puntos de control + los anteriores); tipos y lint sin errores.

- [ ] **Step 7: Commit**

```bash
git add projects/follow-the-packet/src/engine
git commit -m "feat(engine): simulate packets through DNS, route, SGs and Linux"
```

---

### Task 5: Aperturas de más y estrellas

**Files:**
- Create: `src/engine/exposure.ts`, `src/engine/scoring.ts`
- Test: `src/engine/exposure.test.ts`, `src/engine/scoring.test.ts`

**Interfaces:**
- Consumes: `simulate` (tarea 4), tipos (tarea 2).
- Produces: `PROBE_INTERNET: Actor`; `probePackets(net: Network): PacketSpec[]`; `withProbeActor(net: Network): Network`; `reachesHost(trace: Trace): boolean`; `flowKey(net: Network, packet: PacketSpec): string | null`; `extraOpenings(net: Network, expected: PacketSpec[]): PacketSpec[]`; `interface Stars { objective: boolean; tight: boolean; prediction: boolean; count: 0 | 1 | 2 | 3 }`; `scoreStars(objective: boolean, tight: boolean, prediction: boolean): Stars`.

- [ ] **Step 1: Escribir los tests (fallan)**

`src/engine/exposure.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extraOpenings, flowKey, probePackets } from './exposure';
import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound } from './fixtures';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const expected = [
  ping(inst('servidor1'), S2.private),
  tcp(actor('you'), '54.78.154.66', 22),
  tcp(actor('you'), S2.public, 22),
];

describe('extraOpenings', () => {
  it('con la regla justa no hay aperturas de más', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    expect(extraOpenings(net, expected)).toEqual([]);
  });

  it('ICMP de todos los tipos desde el SG de servidor1 abre de más (deja entrar Echo Reply)', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'all-icmp', what: { kind: 'icmp', icmpType: 'all' }, peer: { kind: 'sg', sgId: 'sg-servidor1' } });
    const extra = extraOpenings(net, expected);
    expect(extra).toContainEqual({ from: inst('servidor1'), to: S2.private, protocol: 'icmp', icmpType: 0 });
  });

  it('Echo Request desde 0.0.0.0/0 abre a internet', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'world', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
    const extra = extraOpenings(net, expected);
    expect(extra.some((p) => p.from.kind === 'actor' && p.from.id === 'probe-internet')).toBe(true);
  });

  it('el SSH esperado desde tu Mac no cuenta como apertura de más', () => {
    expect(extraOpenings(lab03Net(), expected)).toEqual([]);
  });
});

describe('flowKey', () => {
  it('identifica el flujo por origen, instancia destino y servicio, sin importar si va por IP o nombre', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const byIp = flowKey(net, ping(inst('servidor1'), S2.private));
    const byName = flowKey(net, ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(byIp).toBe('instance:servidor1>servidor2:icmp:8');
    expect(byName).toBe(byIp);
  });
});

describe('probePackets', () => {
  it('no se sondea una instancia a sí misma', () => {
    const packets = probePackets(lab03Net());
    expect(packets.some((p) => p.from.kind === 'instance' && p.from.id === 'servidor1' && p.to === '172.31.16.131')).toBe(false);
  });
});
```

`src/engine/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { scoreStars } from './scoring';

describe('scoreStars', () => {
  it('sin objetivo no hay estrellas', () => {
    expect(scoreStars(false, true, true).count).toBe(0);
  });

  it('objetivo + no abrir de más + predicción = 3', () => {
    expect(scoreStars(true, true, true)).toEqual({ objective: true, tight: true, prediction: true, count: 3 });
    expect(scoreStars(true, false, true).count).toBe(2);
    expect(scoreStars(true, false, false).count).toBe(1);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/engine/exposure.test.ts src/engine/scoring.test.ts`
Expected: FAIL, no existen `./exposure` ni `./scoring`.

- [ ] **Step 3: Escribir `src/engine/exposure.ts`**

```ts
import { simulate } from './simulate';
import type { Actor, Endpoint, Network, PacketSpec, Trace } from './types';

/** Una IP cualquiera de internet que no está en la red del nivel. */
export const PROBE_INTERNET: Actor = { id: 'probe-internet', name: 'Internet', ip: '203.0.113.200', kind: 'attacker' };

type Service = Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>;
const SERVICES: Service[] = [
  { protocol: 'icmp', icmpType: 8 },
  { protocol: 'icmp', icmpType: 0 },
  { protocol: 'tcp', port: 22 },
  { protocol: 'tcp', port: 80 },
  { protocol: 'tcp', port: 443 },
  { protocol: 'tcp', port: 3306 },
  { protocol: 'tcp', port: 5432 },
  { protocol: 'udp', port: 53 },
];

export function withProbeActor(net: Network): Network {
  return { ...net, actors: [...net.actors, PROBE_INTERNET] };
}

/** Batería fija: desde cada actor, desde internet y desde cada instancia, a cada IP de cada otra instancia. */
export function probePackets(net: Network): PacketSpec[] {
  const sources: Endpoint[] = [
    ...net.actors.map((a): Endpoint => ({ kind: 'actor', id: a.id })),
    { kind: 'actor', id: PROBE_INTERNET.id },
    ...net.instances.map((i): Endpoint => ({ kind: 'instance', id: i.id })),
  ];
  const packets: PacketSpec[] = [];
  for (const from of sources) {
    for (const target of net.instances) {
      if (from.kind === 'instance' && from.id === target.id) continue;
      const addresses = target.publicIp ? [target.privateIp, target.publicIp] : [target.privateIp];
      for (const to of addresses) for (const service of SERVICES) packets.push({ from, to, ...service });
    }
  }
  return packets;
}

/** "Llega al host" = pasó el SG de entrada, aunque Linux luego no conteste. */
export function reachesHost(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'sg-in' && s.verdict === 'pass');
}

function keyFor(from: Endpoint, destinationId: string, p: Service): string {
  const detail = p.protocol === 'icmp' ? `icmp:${p.icmpType}` : `${p.protocol}:${p.port}`;
  return `${from.kind}:${from.id}>${destinationId}:${detail}`;
}

export function flowKey(net: Network, packet: PacketSpec): string | null {
  const trace = simulate(withProbeActor(net), packet);
  return trace.destinationId ? keyFor(packet.from, trace.destinationId, packet) : null;
}

/** Sondas que llegan a un host y no corresponden a ningún flujo esperado. */
export function extraOpenings(net: Network, expected: PacketSpec[]): PacketSpec[] {
  const probeNet = withProbeActor(net);
  const allowed = new Set(expected.map((p) => flowKey(net, p)).filter((k): k is string => k !== null));
  return probePackets(net).filter((packet) => {
    const trace = simulate(probeNet, packet);
    return reachesHost(trace) && trace.destinationId !== null && !allowed.has(keyFor(packet.from, trace.destinationId, packet));
  });
}
```

- [ ] **Step 4: Escribir `src/engine/scoring.ts`**

```ts
export interface Stars {
  objective: boolean;
  tight: boolean;
  prediction: boolean;
  count: 0 | 1 | 2 | 3;
}

/** Defensor: tight = no abrir de más. Atacante: tight = en los intentos máximos o menos. */
export function scoreStars(objective: boolean, tight: boolean, prediction: boolean): Stars {
  const count = objective ? ((1 + Number(tight) + Number(prediction)) as 1 | 2 | 3) : 0;
  return { objective, tight, prediction, count };
}
```

- [ ] **Step 5: Verificar**

Run: `npx vitest run src/engine && npm run typecheck && npm run lint`
Expected: todos PASS; tipos y lint sin errores.

- [ ] **Step 6: Commit**

```bash
git add projects/follow-the-packet/src/engine
git commit -m "feat(engine): detect extra openings and score stars"
```

---

### Task 6: Contrato del nivel, evaluación, registro y nivel 1

**Files:**
- Create: `src/levels/schema.ts`, `src/levels/apply.ts`, `src/levels/evaluate.ts`, `src/levels/registry.ts`
- Create: `src/levels/04-iaas/shared.ts`, `src/levels/04-iaas/01-where-ping-dies.ts`
- Test: `src/levels/evaluate.test.ts`, `src/levels/levels.test.ts`

**Interfaces:**
- Consumes: esquemas y tipos (tarea 2), `simulate` (tarea 4), `deathPoint`/`sameCheckpoint` (tarea 4), `extraOpenings`/`reachesHost` (tarea 5), `scoreStars` (tarea 5), `CHAPTERS` (tarea 1), utilidades del pensum (tarea 1).
- Produces:
  - `levelSchema`, `actionSchema`; tipos `Level`, `LevelAction`, `Candidate = { label: string; checkpoint: Checkpoint }`, `AttackerObjective`, `DefenderObjective`; `defineLevel(input: z.input<typeof levelSchema>): Level`
  - `applyAction(net: Network, action: LevelAction): Network`; `materialize(packet: PacketSpec, net: Network): PacketSpec`
  - `interface FlowResult { packet: PacketSpec; trace: Trace; ok: boolean }`; `interface DefenderEvaluation { kind: 'defender'; objective: boolean; tight: boolean; mustPass: FlowResult[]; mustBlock: FlowResult[]; extra: PacketSpec[] }`; `interface AttackerEvaluation { kind: 'attacker'; objective: boolean; trace: Trace }`; `evaluateDefender(level: Level, net: Network): DefenderEvaluation`; `evaluateAttack(level: Level, net: Network, packet: PacketSpec): AttackerEvaluation`; `applySolution(level: Level): Network`
  - `LEVELS: Level[]`; `levelById(id: string): Level | undefined`; `levelsOfChapter(chapter: number): Level[]`
  - Del archivo `shared.ts`: `LESSON`, `CONCEPT`, `YOU`, `ATTACKER`, `NETWORK_BASE`, `S1`, `S2`, `inst`, `actor`, `ping`, `tcp`, `sshFromYou`, `allOutbound`, `server`, `WHAT`, `PEER`, `cand`

- [ ] **Step 1: Escribir el contrato del nivel**

`src/levels/schema.ts`:

```ts
import { z } from 'zod';
import { sameCheckpoint } from '../engine/checkpoints';
import {
  checkpointSchema,
  endpointSchema,
  icmpTypeSchema,
  networkSchema,
  packetSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
} from '../engine/schema';

const protocolSchema = z.enum(['tcp', 'udp', 'icmp']);

export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), sgId: z.string().min(1), rule: ruleSchema }),
  z.object({ type: z.literal('removeRule'), sgId: z.string().min(1), ruleId: z.string().min(1) }),
  z.object({ type: z.literal('setAppTarget'), instanceId: z.string().min(1), target: z.string().min(1) }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), instanceId: z.string().min(1), value: z.boolean() }),
]);

const editableSchema = z.object({
  /** v1: solo reglas de entrada. */
  rules: z
    .object({
      sgIds: z.array(z.string().min(1)).min(1),
      whatOptions: z.array(z.object({ label: z.string().min(1), what: ruleWhatSchema })).min(1),
      peerOptions: z.array(z.object({ label: z.string().min(1), peer: rulePeerSchema })).min(1),
    })
    .optional(),
  appTarget: z
    .object({
      instanceId: z.string().min(1),
      options: z.array(z.object({ label: z.string().min(1), target: z.string().min(1) })).min(2),
    })
    .optional(),
  linuxFlags: z.object({ instanceIds: z.array(z.string().min(1)).min(1) }).optional(),
});

const serviceSchema = z.object({
  label: z.string().min(1),
  protocol: protocolSchema,
  port: z.number().int().min(0).max(65535).optional(),
  icmpType: icmpTypeSchema.optional(),
});

const defenderObjectiveSchema = z.object({
  kind: z.literal('defender'),
  mustPass: z.array(packetSchema).min(1),
  mustBlock: z.array(packetSchema),
  /** Flujos que ya existían y no cuentan como apertura de más (por ejemplo, tu SSH). */
  allowed: z.array(packetSchema),
});

const attackerObjectiveSchema = z.object({
  kind: z.literal('attacker'),
  target: z.object({
    instanceId: z.string().min(1),
    protocol: protocolSchema,
    port: z.number().int().min(0).max(65535).optional(),
    icmpType: icmpTypeSchema.optional(),
  }),
  maxAttempts: z.number().int().min(1),
  attack: z.object({
    origins: z.array(z.object({ label: z.string().min(1), endpoint: endpointSchema })).min(1),
    targets: z.array(z.object({ label: z.string().min(1), to: z.string().min(1) })).min(1),
    services: z.array(serviceSchema).min(1),
  }),
});

const candidateSchema = z.object({ label: z.string().min(1), checkpoint: checkpointSchema });

const pad = (n: number) => String(n).padStart(2, '0');

export const levelSchema = z
  .object({
    id: z.string().regex(/^\d{2}-\d{2}$/),
    chapter: z.number().int().min(1).max(20),
    order: z.number().int().min(1),
    title: z.string().min(1),
    role: z.enum(['defender', 'attacker']),
    /** Texto exacto de la lección en syllabus.md. */
    lesson: z.string().min(1),
    /** Ruta de la nota de concepto desde la raíz del repo. */
    concept: z.string().regex(/^concepts\/[a-z0-9-]+\.md$/),
    brief: z.string().min(1),
    network: networkSchema,
    objective: z.discriminatedUnion('kind', [defenderObjectiveSchema, attackerObjectiveSchema]),
    editable: editableSchema,
    tools: z.array(z.enum(['tcpdump', 'getent', 'rules'])),
    prediction: z.object({ packet: packetSchema, candidates: z.array(candidateSchema).min(2), answer: checkpointSchema }),
    hints: z.tuple([z.string().min(1), z.string().min(1)]),
    solution: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('defender'), actions: z.array(actionSchema).min(1) }),
      z.object({ kind: z.literal('attacker'), packet: packetSchema }),
    ]),
    takeaway: z.string().min(1),
  })
  .superRefine((level, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (level.id !== `${pad(level.chapter)}-${pad(level.order)}`) fail(`el id debe ser ${pad(level.chapter)}-${pad(level.order)}`);
    if (level.objective.kind !== level.role) fail('el objetivo no corresponde al rol');
    if (level.solution.kind !== level.role) fail('la solución no corresponde al rol');
    if (!level.prediction.candidates.some((c) => sameCheckpoint(c.checkpoint, level.prediction.answer))) {
      fail('la respuesta de la predicción no está entre los candidatos');
    }
    for (const sgId of level.editable.rules?.sgIds ?? []) {
      if (!level.network.securityGroups.some((g) => g.id === sgId)) fail(`editable.rules: el SG ${sgId} no existe`);
    }
  });

export type Level = z.infer<typeof levelSchema>;
export type LevelAction = z.infer<typeof actionSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type DefenderObjective = Extract<Level['objective'], { kind: 'defender' }>;
export type AttackerObjective = Extract<Level['objective'], { kind: 'attacker' }>;

export function defineLevel(input: z.input<typeof levelSchema>): Level {
  const result = levelSchema.safeParse(input);
  if (!result.success) throw new Error(`Nivel ${input.id} inválido: ${JSON.stringify(result.error.issues)}`);
  return result.data;
}
```

- [ ] **Step 2: Escribir las acciones y la evaluación**

`src/levels/apply.ts`:

```ts
import type { Network, PacketSpec } from '../engine/types';
import type { LevelAction } from './schema';

export function applyAction(net: Network, action: LevelAction): Network {
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

/** Reemplaza "@appTarget" por el destino configurado en la app de la instancia de origen. */
export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== '@appTarget') return packet;
  const from = packet.from;
  const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error('@appTarget necesita una instancia de origen con appTarget');
  return { ...packet, to: source.appTarget };
}
```

`src/levels/evaluate.ts`:

```ts
import { extraOpenings, reachesHost } from '../engine/exposure';
import { simulate } from '../engine/simulate';
import type { Network, PacketSpec, Trace } from '../engine/types';
import { applyAction, materialize } from './apply';
import type { Level } from './schema';

export interface FlowResult {
  packet: PacketSpec;
  trace: Trace;
  ok: boolean;
}

export interface DefenderEvaluation {
  kind: 'defender';
  objective: boolean;
  tight: boolean;
  mustPass: FlowResult[];
  mustBlock: FlowResult[];
  extra: PacketSpec[];
}

export interface AttackerEvaluation {
  kind: 'attacker';
  objective: boolean;
  trace: Trace;
}

export function evaluateDefender(level: Level, net: Network): DefenderEvaluation {
  const objective = level.objective;
  if (objective.kind !== 'defender') throw new Error(`El nivel ${level.id} no es de defensor`);
  const run = (p: PacketSpec) => {
    const packet = materialize(p, net);
    return { packet, trace: simulate(net, packet) };
  };
  const mustPass = objective.mustPass.map(run).map((r) => ({ ...r, ok: r.trace.outcome === 'replied' }));
  const mustBlock = objective.mustBlock.map(run).map((r) => ({ ...r, ok: !reachesHost(r.trace) }));
  const expected = [...objective.mustPass, ...objective.allowed].map((p) => materialize(p, net));
  const extra = extraOpenings(net, expected);
  return {
    kind: 'defender',
    objective: mustPass.every((r) => r.ok) && mustBlock.every((r) => r.ok),
    tight: extra.length === 0,
    mustPass,
    mustBlock,
    extra,
  };
}

export function evaluateAttack(level: Level, net: Network, packet: PacketSpec): AttackerEvaluation {
  const objective = level.objective;
  if (objective.kind !== 'attacker') throw new Error(`El nivel ${level.id} no es de atacante`);
  const trace = simulate(net, packet);
  const target = objective.target;
  const sameService =
    packet.protocol === target.protocol && (target.protocol === 'icmp' ? packet.icmpType === target.icmpType : packet.port === target.port);
  return { kind: 'attacker', objective: trace.outcome === 'replied' && trace.destinationId === target.instanceId && sameService, trace };
}

export function applySolution(level: Level): Network {
  if (level.solution.kind !== 'defender') return level.network;
  return level.solution.actions.reduce(applyAction, level.network);
}
```

- [ ] **Step 3: Escribir el registro**

`src/levels/registry.ts`:

```ts
import type { Level } from './schema';

// Solo archivos NN-*.ts dentro de carpetas NN-*: shared.ts y los tests quedan fuera.
const modules = import.meta.glob<{ default: Level }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const LEVELS: Level[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsOfChapter(chapter: number): Level[] {
  return LEVELS.filter((l) => l.chapter === chapter);
}
```

- [ ] **Step 4: Escribir los datos compartidos del capítulo 4**

`src/levels/04-iaas/shared.ts`:

```ts
import type { Actor, Endpoint, Instance, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from '../../engine/types';
import type { Candidate } from '../schema';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

export const YOU: Actor = { id: 'you', name: 'Tu Mac', ip: '198.51.100.7', kind: 'you' };
export const ATTACKER: Actor = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' };

const SUBNETS: Subnet[] = [
  { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
  { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
];
export const NETWORK_BASE = { region: 'eu-west-1', vpcCidr: '172.31.0.0/16', subnets: SUBNETS };

export const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
export const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

export const inst = (id: string): Endpoint => ({ kind: 'instance', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

export const sshFromYou = (id: string): Rule => ({
  id,
  what: { kind: 'tcp', fromPort: 22, toPort: 22 },
  peer: { kind: 'cidr', cidr: '198.51.100.7/32' },
});
export const allOutbound = (id: string): Rule => ({ id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });

/** Instancia con su SG `sg-<id>`, SSH escuchando y Linux contestando pings. */
export function server(id: string, subnetId: string, privateIp: string, publicIp?: string, extra: Partial<Instance> = {}): Instance {
  return {
    id,
    name: id,
    subnetId,
    privateIp,
    ...(publicIp ? { publicIp } : {}),
    sgIds: [`sg-${id}`],
    linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
    ...extra,
  };
}

export const WHAT = {
  echoRequest: { label: 'ICMP · Echo Request ("Repetir solicitud")', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { label: 'ICMP · Echo Reply ("Repetir respuesta")', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { label: 'ICMP · Todos los tipos', what: { kind: 'icmp', icmpType: 'all' } },
  ssh: { label: 'SSH · TCP 22', what: { kind: 'tcp', fromPort: 22, toPort: 22 } },
  all: { label: 'Todo el tráfico', what: { kind: 'all' } },
} satisfies Record<string, { label: string; what: RuleWhat }>;

export const PEER = {
  you: { label: 'Mi IP · 198.51.100.7/32', peer: { kind: 'cidr', cidr: '198.51.100.7/32' } },
  sgServidor1: { label: 'SG servidor1', peer: { kind: 'sg', sgId: 'sg-servidor1' } },
  sgServidor2: { label: 'SG servidor2', peer: { kind: 'sg', sgId: 'sg-servidor2' } },
  vpc: { label: 'Toda la VPC · 172.31.0.0/16', peer: { kind: 'cidr', cidr: '172.31.0.0/16' } },
  anywhere: { label: 'Cualquiera · 0.0.0.0/0', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } },
} satisfies Record<string, { label: string; peer: RulePeer }>;

export const cand = {
  sgOut: (id: string): Candidate => ({ label: `Al salir de ${id} (su SG de salida)`, checkpoint: { stage: 'sg-out', at: id } }),
  sgIn: (id: string): Candidate => ({ label: `En la barrera de ${id} (su SG de entrada)`, checkpoint: { stage: 'sg-in', at: id } }),
  linux: (id: string): Candidate => ({ label: `Dentro de ${id} (Linux)`, checkpoint: { stage: 'linux', at: id } }),
  igw: { label: 'En el internet gateway', checkpoint: { stage: 'route', at: 'igw' } } satisfies Candidate,
  arrives: (id: string): Candidate => ({ label: `No muere: llega a ${id} y vuelve la respuesta`, checkpoint: { stage: 'reply', at: id } }),
};
```

- [ ] **Step 5: Escribir el nivel 1**

`src/levels/04-iaas/01-where-ping-dies.ts`:

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-01',
  chapter: 4,
  order: 1,
  title: '¿Dónde muere el ping?',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'servidor1 quiere hacerle ping a servidor2, pero no responde. Haz que responda sin abrirle la puerta a nadie más.',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOutbound('out-2')] },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor2'],
      whatOptions: [WHAT.ssh, WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp],
      peerOptions: [PEER.you, PEER.sgServidor1, PEER.anywhere],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Mira la lista del guardia de servidor2: ¿alguna regla habla de ICMP?',
    'Una regla necesita dos cosas: qué (el mensaje que entra primero) y desde dónde (quién lo manda).',
  ],
  solution: {
    kind: 'defender',
    actions: [{ type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } }],
  },
  takeaway: 'Un Security Group solo deja pasar lo que una regla permite, y la regla tiene que coincidir en el qué y en el desde dónde a la vez.',
});
```

- [ ] **Step 6: Escribir los tests de evaluación y los tests automáticos por nivel**

`src/levels/evaluate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import level01 from './04-iaas/01-where-ping-dies';
import { applyAction } from './apply';
import { applySolution, evaluateDefender } from './evaluate';

describe('evaluateDefender (nivel 04-01)', () => {
  it('quitar el SSH que ya existía no rompe la evaluación ni castiga (Review Focus 4)', () => {
    const net = applyAction(applySolution(level01), { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(true);
    expect(result.tight).toBe(true);
  });

  it('abrir Echo Request a todo internet incumple el objetivo (el atacante entra)', () => {
    const net = applyAction(level01.network, {
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: { id: 'world', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } },
    });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(false);
    expect(result.mustBlock[0].ok).toBe(false);
  });

  it('todos los tipos ICMP desde el SG de servidor1 cumple, pero abre de más', () => {
    const net = applyAction(level01.network, {
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: { id: 'all-icmp', what: { kind: 'icmp', icmpType: 'all' }, peer: { kind: 'sg', sgId: 'sg-servidor1' } },
    });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(true);
    expect(result.tight).toBe(false);
  });
});
```

`src/levels/levels.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deathPoint } from '../engine/checkpoints';
import { scoreStars } from '../engine/scoring';
import { simulate } from '../engine/simulate';
import { REPO_ROOT, syllabusLessons } from '../test-utils/repo';
import { materialize } from './apply';
import { CHAPTERS } from './chapters';
import { applySolution, evaluateAttack, evaluateDefender } from './evaluate';
import { LEVELS } from './registry';
import type { Level } from './schema';

const lessons = syllabusLessons();

it('hay niveles registrados y sin ids repetidos', () => {
  expect(LEVELS.length).toBeGreaterThan(0);
  expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
});

describe.each(LEVELS.map((l): [string, Level] => [l.id, l]))('nivel %s', (_id, level) => {
  it('pertenece a un capítulo del pensum', () => {
    expect(CHAPTERS.map((c) => c.number)).toContain(level.chapter);
  });

  it('cita una lección que existe en syllabus.md', () => {
    expect(lessons.has(level.lesson)).toBe(true);
  });

  it('enlaza una nota de concepto que existe', () => {
    expect(existsSync(resolve(REPO_ROOT, level.concept))).toBe(true);
  });

  it('la respuesta de la predicción coincide con el motor', () => {
    const packet = materialize(level.prediction.packet, level.network);
    expect(deathPoint(simulate(level.network, packet))).toEqual(level.prediction.answer);
  });

  it('el punto de partida no cumple el objetivo', () => {
    if (level.objective.kind === 'defender') {
      expect(evaluateDefender(level, level.network).objective).toBe(false);
    } else {
      expect(evaluateAttack(level, level.network, level.prediction.packet).objective).toBe(false);
    }
  });

  it('la solución de referencia gana con 3 estrellas', () => {
    if (level.solution.kind === 'defender') {
      const result = evaluateDefender(level, applySolution(level));
      expect(result.mustPass.filter((r) => !r.ok).map((r) => r.packet)).toEqual([]);
      expect(result.mustBlock.filter((r) => !r.ok).map((r) => r.packet)).toEqual([]);
      expect(result.extra).toEqual([]);
      expect(scoreStars(result.objective, result.tight, true).count).toBe(3);
    } else if (level.objective.kind === 'attacker') {
      const result = evaluateAttack(level, level.network, level.solution.packet);
      expect(scoreStars(result.objective, 1 <= level.objective.maxAttempts, true).count).toBe(3);
    }
  });

  it('la solución solo usa opciones que el nivel ofrece', () => {
    const { rules, appTarget, linuxFlags } = level.editable;
    if (level.solution.kind === 'defender') {
      for (const action of level.solution.actions) {
        switch (action.type) {
          case 'addRule':
            expect(rules?.sgIds).toContain(action.sgId);
            expect(rules?.whatOptions.map((o) => o.what)).toContainEqual(action.rule.what);
            expect(rules?.peerOptions.map((o) => o.peer)).toContainEqual(action.rule.peer);
            break;
          case 'removeRule':
            expect(rules?.sgIds).toContain(action.sgId);
            break;
          case 'setAppTarget':
            expect(appTarget?.options.map((o) => o.target)).toContain(action.target);
            break;
          case 'setIgnoreIcmpEcho':
            expect(linuxFlags?.instanceIds).toContain(action.instanceId);
            break;
        }
      }
    } else if (level.objective.kind === 'attacker') {
      const { attack } = level.objective;
      const p = level.solution.packet;
      expect(attack.origins.map((o) => o.endpoint)).toContainEqual(p.from);
      expect(attack.targets.map((t) => t.to)).toContain(p.to);
      expect(attack.services.map((s) => ({ protocol: s.protocol, port: s.port, icmpType: s.icmpType }))).toContainEqual({
        protocol: p.protocol,
        port: p.port,
        icmpType: p.icmpType,
      });
    }
  });
});
```

- [ ] **Step 7: Verificar**

Run: `npx vitest run src/levels && npm run typecheck && npm run lint`
Expected: PASS (capítulos, evaluación, y 7 tests automáticos para el nivel 04-01); tipos y lint sin errores.

- [ ] **Step 8: Commit**

```bash
git add projects/follow-the-packet/src/levels
git commit -m "feat(levels): add level contract, evaluation, registry and level 04-01"
```

---

### Task 7: Niveles 2 y 3 (defensor)

**Files:**
- Create: `src/levels/04-iaas/02-open-just-enough.ts`, `src/levels/04-iaas/03-the-way-back.ts`
- Test: los cubre `src/levels/levels.test.ts` (tarea 6) automáticamente.

**Interfaces:**
- Consumes: `defineLevel` (tarea 6) y `shared.ts` (tarea 6).

- [ ] **Step 1: Escribir `02-open-just-enough.ts`**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-02',
  chapter: 4,
  order: 2,
  title: 'Abre lo justo',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Alguien ya agregó una regla ICMP en servidor2 y aun así el ping no responde. Arréglalo dejando solo lo justo.',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      {
        id: 'sg-servidor2',
        name: 'servidor2',
        inbound: [sshFromYou('ssh-2'), { id: 'echo-reply', what: WHAT.echoReply.what, peer: PEER.sgServidor1.peer }],
        outbound: [allOutbound('out-2')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor2'],
      whatOptions: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp, WHAT.ssh],
      peerOptions: [PEER.sgServidor1, PEER.vpc, PEER.anywhere, PEER.you],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Cuando servidor1 hace ping, ¿qué mensaje llega primero a servidor2: la pregunta o la respuesta?',
    'Lo que entra es el Echo Request. La regla Echo Reply no sirve para esto y, además, sobra.',
  ],
  solution: {
    kind: 'defender',
    actions: [
      { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'echo-reply' },
      { type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } },
    ],
  },
  takeaway: 'En un ping, lo que entra al destino es la pregunta (Echo Request). Abre solo eso: cada regla de más es una puerta abierta.',
});
```

- [ ] **Step 2: Escribir `03-the-way-back.ts`**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-03',
  chapter: 4,
  order: 3,
  title: 'El camino de vuelta',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'servidor1 debe poder hacerle ping a servidor2, pero servidor2 no debe poder hacerle ping a servidor1. Alguien abrió ICMP en servidor1 "para que vuelva la respuesta".',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      {
        id: 'sg-servidor1',
        name: 'servidor1',
        inbound: [sshFromYou('ssh-1'), { id: 'icmp-back', what: WHAT.allIcmp.what, peer: PEER.sgServidor2.peer }],
        outbound: [allOutbound('out-1')],
      },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOutbound('out-2')] },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(inst('servidor2'), S1.private)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor1', 'sg-servidor2'],
      whatOptions: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp, WHAT.ssh],
      peerOptions: [PEER.sgServidor1, PEER.sgServidor2, PEER.you, PEER.anywhere],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.sgIn('servidor1'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Para que la respuesta vuelva a servidor1, ¿hace falta alguna regla en servidor1?',
    'El SG es stateful: la respuesta de una conversación permitida vuelve sola. La regla de servidor1 sobra y deja que servidor2 inicie pings.',
  ],
  solution: {
    kind: 'defender',
    actions: [
      { type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } },
      { type: 'removeRule', sgId: 'sg-servidor1', ruleId: 'icmp-back' },
    ],
  },
  takeaway:
    'El SG es stateful: la respuesta vuelve sola. Abrir la entrada del origen "para la vuelta" solo sirve para que el otro pueda iniciar conversaciones.',
});
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run src/levels && npm run typecheck && npm run lint`
Expected: PASS; ahora `levels.test.ts` corre 7 tests por cada uno de los niveles 04-01, 04-02 y 04-03.

- [ ] **Step 4: Commit**

```bash
git add projects/follow-the-packet/src/levels/04-iaas
git commit -m "feat(levels): add levels 04-02 open just enough and 04-03 the way back"
```

---

### Task 8: Niveles 4 a 7

**Files:**
- Create: `src/levels/04-iaas/04-too-wide.ts`, `src/levels/04-iaas/05-public-ip-and-name.ts`, `src/levels/04-iaas/06-doorman-or-owner.ts`, `src/levels/04-iaas/07-default-club.ts`
- Test: los cubre `src/levels/levels.test.ts` automáticamente.

**Interfaces:**
- Consumes: `defineLevel` (tarea 6) y `shared.ts` (tarea 6).

- [ ] **Step 1: Escribir `04-too-wide.ts` (atacante)**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, YOU, actor, allOutbound, cand, inst, server, sshFromYou, tcp } from './shared';

const DB = '172.31.40.10';
const WEB_PUBLIC = '54.78.154.66';

export default defineLevel({
  id: '04-04',
  chapter: 4,
  order: 4,
  title: 'El rango demasiado ancho',
  role: 'attacker',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Eres el atacante. Ya controlas web, el servidor público. Tu objetivo: conectarte a la base de datos (db) por el puerto 5432.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('web', 'subnet-a', '172.31.16.20', WEB_PUBLIC, { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22, 80] } }),
      server('db', 'subnet-b', DB, undefined, { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [5432] } }),
    ],
    securityGroups: [
      {
        id: 'sg-web',
        name: 'web',
        inbound: [{ id: 'http', what: { kind: 'tcp', fromPort: 80, toPort: 80 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }, sshFromYou('ssh-web')],
        outbound: [allOutbound('out-web')],
      },
      {
        id: 'sg-db',
        name: 'db',
        inbound: [{ id: 'pg-vpc', what: { kind: 'tcp', fromPort: 5432, toPort: 5432 }, peer: { kind: 'cidr', cidr: '172.31.0.0/16' } }],
        outbound: [allOutbound('out-db')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'attacker',
    target: { instanceId: 'db', protocol: 'tcp', port: 5432 },
    maxAttempts: 2,
    attack: {
      origins: [
        { label: 'Desde internet (tu máquina)', endpoint: actor('attacker') },
        { label: 'Desde web (el servidor que controlas)', endpoint: inst('web') },
      ],
      targets: [
        { label: `db por su IP privada · ${DB}`, to: DB },
        { label: `web por su IP pública · ${WEB_PUBLIC}`, to: WEB_PUBLIC },
      ],
      services: [
        { label: 'PostgreSQL · TCP 5432', protocol: 'tcp', port: 5432 },
        { label: 'SSH · TCP 22', protocol: 'tcp', port: 22 },
      ],
    },
  },
  editable: {},
  tools: ['rules'],
  prediction: {
    packet: tcp(actor('attacker'), DB, 5432),
    candidates: [cand.igw, cand.sgIn('db'), cand.linux('db'), cand.arrives('db')],
    answer: { stage: 'route', at: 'igw' },
  },
  hints: [
    'Desde internet, ¿existe un camino hacia una IP privada?',
    'Mira desde dónde permite la regla de db: 172.31.0.0/16 es toda la VPC. ¿Cuál de tus servidores está dentro?',
  ],
  solution: { kind: 'attacker', packet: tcp(inst('web'), DB, 5432) },
  takeaway:
    'Una regla con un rango como "toda la VPC" deja entrar a cualquier servidor de dentro, también a uno hackeado. Por eso el origen debería ser el SG de quien de verdad lo necesita.',
});
```

- [ ] **Step 2: Escribir `05-public-ip-and-name.ts` (defensor)**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

const S2_PUBLIC_NAME = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

export default defineLevel({
  id: '04-05',
  chapter: 4,
  order: 5,
  title: 'La IP pública y el nombre',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'servidor1 tiene un monitor que le hace ping a servidor2 y siempre falla. La regla de servidor2 está bien. Arregla el monitor sin tocar el Security Group.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('servidor1', 'subnet-a', S1.private, S1.public, { appTarget: S2.public }),
      server('servidor2', 'subnet-b', S2.private, S2.public),
    ],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      {
        id: 'sg-servidor2',
        name: 'servidor2',
        inbound: [sshFromYou('ssh-2'), { id: 'echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer }],
        outbound: [allOutbound('out-2')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [{ from: inst('servidor1'), to: '@appTarget', protocol: 'icmp', icmpType: 8 }],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    appTarget: {
      instanceId: 'servidor1',
      options: [
        { label: `IP pública · ${S2.public}`, target: S2.public },
        { label: `IP privada · ${S2.private}`, target: S2.private },
        { label: `Nombre público · ${S2_PUBLIC_NAME}`, target: S2_PUBLIC_NAME },
      ],
    },
  },
  tools: ['getent', 'rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.public),
    candidates: [cand.igw, cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    '¿Por dónde viaja un paquete que va a una IP pública? ¿Con qué IP de origen llega?',
    'Por la IP pública el origen pasa a ser 54.78.154.66 y la regla con el SG de servidor1 ya no coincide. Apunta por dentro de la VPC.',
  ],
  solution: { kind: 'defender', actions: [{ type: 'setAppTarget', instanceId: 'servidor1', target: S2_PUBLIC_NAME }] },
  takeaway:
    'Entre servidores de la misma VPC, usa la IP privada o el nombre DNS: desde dentro, hasta el nombre público resuelve a la IP privada.',
});
```

- [ ] **Step 3: Escribir `06-doorman-or-owner.ts` (defensor)**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-06',
  chapter: 4,
  order: 6,
  title: '¿Portero o dueño?',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'Te escriben: "servidor2 está caído, no responde el ping". La regla ICMP de servidor2 está puesta. Descubre dónde se pierde el ping y arréglalo.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('servidor1', 'subnet-a', S1.private, S1.public),
      server('servidor2', 'subnet-b', S2.private, S2.public, { linux: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } }),
    ],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      {
        id: 'sg-servidor2',
        name: 'servidor2',
        inbound: [sshFromYou('ssh-2'), { id: 'echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer }],
        outbound: [allOutbound('out-2')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor2'],
      whatOptions: [WHAT.echoRequest, WHAT.allIcmp, WHAT.all],
      peerOptions: [PEER.sgServidor1, PEER.vpc, PEER.anywhere],
    },
    linuxFlags: { instanceIds: ['servidor2'] },
  },
  tools: ['tcpdump', 'rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'linux', at: 'servidor2' },
  },
  hints: [
    'Envía el ping tal cual y mira tcpdump en servidor2: ¿llega la pregunta?',
    'Si tcpdump ve llegar la pregunta y no sale respuesta, el portero ya la dejó pasar: el que no abre es Linux. Y no está caído: está encendido, solo calla.',
  ],
  solution: { kind: 'defender', actions: [{ type: 'setIgnoreIcmpEcho', instanceId: 'servidor2', value: false }] },
  takeaway: 'Un ping sin respuesta no significa "caído". Si tcpdump ve llegar la pregunta, el SG ya la dejó pasar y el problema está dentro de la máquina.',
});
```

- [ ] **Step 4: Escribir `07-default-club.ts` (atacante)**

```ts
import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, YOU, allOutbound, cand, inst, server, sshFromYou, tcp } from './shared';

const DB = '172.31.40.10';

export default defineLevel({
  id: '04-07',
  chapter: 4,
  order: 7,
  title: 'El club default',
  role: 'attacker',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Eres el atacante y controlas dos servidores: web y batch. Tu objetivo: conectarte a db por el puerto 5432.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('web', 'subnet-a', '172.31.16.20', '54.78.154.66', { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22, 80] } }),
      server('batch', 'subnet-a', '172.31.16.30', undefined, { sgIds: ['sg-default'] }),
      server('db', 'subnet-b', DB, undefined, { sgIds: ['sg-db', 'sg-default'], linux: { ignoreIcmpEcho: false, listeningTcpPorts: [5432] } }),
    ],
    securityGroups: [
      {
        id: 'sg-web',
        name: 'web',
        inbound: [{ id: 'http', what: { kind: 'tcp', fromPort: 80, toPort: 80 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }, sshFromYou('ssh-web')],
        outbound: [allOutbound('out-web')],
      },
      { id: 'sg-api', name: 'api', inbound: [], outbound: [allOutbound('out-api')] },
      {
        id: 'sg-db',
        name: 'db',
        inbound: [{ id: 'pg-api', what: { kind: 'tcp', fromPort: 5432, toPort: 5432 }, peer: { kind: 'sg', sgId: 'sg-api' } }],
        outbound: [allOutbound('out-db')],
      },
      {
        id: 'sg-default',
        name: 'default',
        inbound: [{ id: 'default-self', what: { kind: 'all' }, peer: { kind: 'sg', sgId: 'sg-default' } }],
        outbound: [allOutbound('out-default')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'attacker',
    target: { instanceId: 'db', protocol: 'tcp', port: 5432 },
    maxAttempts: 2,
    attack: {
      origins: [
        { label: 'Desde web', endpoint: inst('web') },
        { label: 'Desde batch', endpoint: inst('batch') },
      ],
      targets: [{ label: `db por su IP privada · ${DB}`, to: DB }],
      services: [
        { label: 'PostgreSQL · TCP 5432', protocol: 'tcp', port: 5432 },
        { label: 'SSH · TCP 22', protocol: 'tcp', port: 22 },
      ],
    },
  },
  editable: {},
  tools: ['rules'],
  prediction: {
    packet: tcp(inst('web'), DB, 5432),
    candidates: [cand.sgOut('web'), cand.sgIn('db'), cand.linux('db'), cand.arrives('db')],
    answer: { stage: 'sg-in', at: 'db' },
  },
  hints: [
    'Mira qué SGs tiene db. ¿Alguno deja entrar a "sus propios miembros"?',
    'La regla del SG default permite todo desde el SG default. ¿Cuál de tus servidores está en ese club?',
  ],
  solution: { kind: 'attacker', packet: tcp(inst('batch'), DB, 5432) },
  takeaway:
    'El SG default deja entrar todo lo que también lleva el SG default. Si metes ahí tus recursos, cualquiera del club, incluso uno hackeado, llega a todos los demás.',
});
```

- [ ] **Step 5: Verificar**

Run: `npx vitest run src/levels && npm run typecheck && npm run lint`
Expected: PASS; `levels.test.ts` corre 7 tests por cada uno de los 7 niveles.

- [ ] **Step 6: Commit**

```bash
git add projects/follow-the-packet/src/levels/04-iaas
git commit -m "feat(levels): add levels 04-04 to 04-07 with attacker roles"
```

---

### Task 9: Estado de la partida y progreso

**Files:**
- Create: `src/game/reducer.ts`, `src/storage/progress.ts`
- Test: `src/game/reducer.test.ts`, `src/storage/progress.test.ts`

**Interfaces:**
- Consumes: `Level`, `LevelAction` (tarea 6); `applyAction` (tarea 6); `evaluateDefender`, `evaluateAttack`, tipos de evaluación (tarea 6); `sameCheckpoint` (tarea 4); `scoreStars`, `Stars` (tarea 5).
- Produces:
  - `type Phase = 'brief' | 'predict' | 'act' | 'result'`; `type Evaluation = DefenderEvaluation | AttackerEvaluation`; `interface GameState { level: Level; phase: Phase; network: Network; prediction: Checkpoint | null; predictionCorrect: boolean | null; attempts: number; lastTrace: Trace | null; lastPacket: PacketSpec | null; evaluation: Evaluation | null; stars: Stars | null; hintsShown: number }`; `type GameAction`; `initGame(level: Level): GameState`; `gameReducer(state: GameState, action: GameAction): GameState`
  - `type Progress = Record<string, number>`; `loadProgress(storage?: Pick<Storage, 'getItem'>): Progress`; `saveStars(levelId: string, stars: number, storage?: Pick<Storage, 'getItem' | 'setItem'>): Progress`; `isUnlocked(level: Level, progress: Progress, chapterLevels: Level[]): boolean`

- [ ] **Step 1: Escribir los tests (fallan)**

`src/game/reducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import level01 from '../levels/04-iaas/01-where-ping-dies';
import level07 from '../levels/04-iaas/07-default-club';
import { gameReducer, initGame, type GameAction, type GameState } from './reducer';

const play = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const solution01 = level01.solution.kind === 'defender' ? level01.solution.actions[0] : undefined;

describe('gameReducer', () => {
  it('sigue las fases brief → predecir → actuar → resultado', () => {
    let state = initGame(level01);
    expect(state.phase).toBe('brief');
    state = play(state, { type: 'start' });
    expect(state.phase).toBe('predict');
    state = play(state, { type: 'predict', point: level01.prediction.answer });
    expect(state.phase).toBe('act');
    expect(state.predictionCorrect).toBe(true);
    state = play(state, { type: 'apply', action: solution01! }, { type: 'launch' });
    expect(state.phase).toBe('result');
    expect(state.stars?.count).toBe(3);
  });

  it('ignora acciones fuera de su fase', () => {
    const state = initGame(level01);
    expect(play(state, { type: 'launch' })).toBe(state);
    expect(play(state, { type: 'apply', action: solution01! })).toBe(state);
  });

  it('la predicción solo cuenta la primera vez; relanzar no la cambia (Review Focus 3)', () => {
    let state = play(initGame(level01), { type: 'start' }, { type: 'predict', point: { stage: 'linux', at: 'servidor2' } });
    expect(state.predictionCorrect).toBe(false);
    state = play(state, { type: 'launch' }, { type: 'retry' }, { type: 'predict', point: level01.prediction.answer });
    expect(state.predictionCorrect).toBe(false);
    state = play(state, { type: 'apply', action: solution01! }, { type: 'launch' });
    expect(state.stars?.count).toBe(2);
    expect(state.attempts).toBe(2);
  });

  it('deshacer cambios vuelve a la red inicial', () => {
    let state = play(initGame(level01), { type: 'start' }, { type: 'predict', point: level01.prediction.answer });
    state = play(state, { type: 'apply', action: solution01! }, { type: 'reset' });
    expect(state.network).toEqual(level01.network);
  });

  it('las pistas llegan como máximo a 3 (la tercera es la solución)', () => {
    const state = play(initGame(level01), { type: 'showHint' }, { type: 'showHint' }, { type: 'showHint' }, { type: 'showHint' });
    expect(state.hintsShown).toBe(3);
  });

  it('el atacante que se pasa de intentos gana sin la segunda estrella (Review Focus 5)', () => {
    const wrong = level07.prediction.packet;
    const right = level07.solution.kind === 'attacker' ? level07.solution.packet : wrong;
    let state = play(initGame(level07), { type: 'start' }, { type: 'predict', point: level07.prediction.answer });
    state = play(state, { type: 'launch', attack: wrong }, { type: 'retry' }, { type: 'launch', attack: wrong }, { type: 'retry' });
    state = play(state, { type: 'launch', attack: right });
    expect(state.attempts).toBe(3);
    expect(state.stars).toEqual({ objective: true, tight: false, prediction: true, count: 2 });
  });

  it('un atacante no puede lanzar sin paquete', () => {
    const state = play(initGame(level07), { type: 'start' }, { type: 'predict', point: level07.prediction.answer });
    expect(play(state, { type: 'launch' })).toBe(state);
  });
});
```

`src/storage/progress.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/registry';
import { isUnlocked, loadProgress, saveStars } from './progress';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('progreso', () => {
  it('guarda la mejor marca de cada nivel', () => {
    const storage = memoryStorage();
    saveStars('04-01', 2, storage);
    saveStars('04-01', 1, storage);
    expect(loadProgress(storage)).toEqual({ '04-01': 2 });
  });

  it('JSON roto o valores raros: arranca vacío (Review Focus 1)', () => {
    expect(loadProgress(memoryStorage({ 'follow-the-packet:progress:v1': '{roto' }))).toEqual({});
    expect(loadProgress(memoryStorage({ 'follow-the-packet:progress:v1': '{"04-01":"tres","04-02":9}' }))).toEqual({});
  });

  it('un storage que lanza errores no rompe nada (Review Focus 1)', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(loadProgress(broken)).toEqual({});
    expect(saveStars('04-01', 3, broken)).toEqual({ '04-01': 3 });
  });

  it('un nivel se desbloquea cuando el anterior del capítulo tiene al menos una estrella', () => {
    const chapter = LEVELS.filter((l) => l.chapter === 4);
    expect(isUnlocked(chapter[0], {}, chapter)).toBe(true);
    expect(isUnlocked(chapter[1], {}, chapter)).toBe(false);
    expect(isUnlocked(chapter[1], { [chapter[0].id]: 1 }, chapter)).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/game src/storage`
Expected: FAIL, no existen `./reducer` ni `./progress`.

- [ ] **Step 3: Escribir `src/game/reducer.ts`**

```ts
import { sameCheckpoint } from '../engine/checkpoints';
import { scoreStars, type Stars } from '../engine/scoring';
import type { Checkpoint, Network, PacketSpec, Trace } from '../engine/types';
import { applyAction } from '../levels/apply';
import { evaluateAttack, evaluateDefender, type AttackerEvaluation, type DefenderEvaluation } from '../levels/evaluate';
import type { Level, LevelAction } from '../levels/schema';

export type Phase = 'brief' | 'predict' | 'act' | 'result';
export type Evaluation = DefenderEvaluation | AttackerEvaluation;

export interface GameState {
  level: Level;
  phase: Phase;
  network: Network;
  prediction: Checkpoint | null;
  /** Se calcula al predecir, contra la red inicial; relanzar no la cambia. */
  predictionCorrect: boolean | null;
  attempts: number;
  lastTrace: Trace | null;
  lastPacket: PacketSpec | null;
  evaluation: Evaluation | null;
  stars: Stars | null;
  /** 0-3; la tercera "pista" es la solución. */
  hintsShown: number;
}

export type GameAction =
  | { type: 'start' }
  | { type: 'predict'; point: Checkpoint }
  | { type: 'apply'; action: LevelAction }
  | { type: 'reset' }
  | { type: 'launch'; attack?: PacketSpec }
  | { type: 'retry' }
  | { type: 'showHint' };

export function initGame(level: Level): GameState {
  return {
    level,
    phase: 'brief',
    network: level.network,
    prediction: null,
    predictionCorrect: null,
    attempts: 0,
    lastTrace: null,
    lastPacket: null,
    evaluation: null,
    stars: null,
    hintsShown: 0,
  };
}

function launch(state: GameState, attack: PacketSpec | undefined): GameState {
  const { level } = state;
  const objective = level.objective;
  const attempts = state.attempts + 1;
  const prediction = state.predictionCorrect === true;
  if (objective.kind === 'defender') {
    const evaluation = evaluateDefender(level, state.network);
    const main = evaluation.mustPass[0];
    return {
      ...state,
      phase: 'result',
      attempts,
      evaluation,
      lastTrace: main.trace,
      lastPacket: main.packet,
      stars: scoreStars(evaluation.objective, evaluation.tight, prediction),
    };
  }
  if (!attack) return state;
  const evaluation = evaluateAttack(level, state.network, attack);
  return {
    ...state,
    phase: 'result',
    attempts,
    evaluation,
    lastTrace: evaluation.trace,
    lastPacket: attack,
    stars: scoreStars(evaluation.objective, attempts <= objective.maxAttempts, prediction),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'brief' ? { ...state, phase: 'predict' } : state;
    case 'predict':
      if (state.phase !== 'predict') return state;
      return {
        ...state,
        phase: 'act',
        prediction: action.point,
        predictionCorrect: sameCheckpoint(action.point, state.level.prediction.answer),
      };
    case 'apply':
      return state.phase === 'act' ? { ...state, network: applyAction(state.network, action.action) } : state;
    case 'reset':
      return state.phase === 'act' ? { ...state, network: state.level.network } : state;
    case 'launch':
      return state.phase === 'act' ? launch(state, action.attack) : state;
    case 'retry':
      return state.phase === 'result' ? { ...state, phase: 'act' } : state;
    case 'showHint':
      return { ...state, hintsShown: Math.min(3, state.hintsShown + 1) };
  }
}
```

- [ ] **Step 4: Escribir `src/storage/progress.ts`**

```ts
import type { Level } from '../levels/schema';

const KEY = 'follow-the-packet:progress:v1';

/** id de nivel → mejores estrellas (0-3). */
export type Progress = Record<string, number>;

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isValid(value: unknown): value is Progress {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3)
  );
}

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined = browserStorage()): Progress {
  try {
    const raw = storage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return isValid(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStars(
  levelId: string,
  stars: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = browserStorage(),
): Progress {
  const current = loadProgress(storage);
  const next = { ...current, [levelId]: Math.max(current[levelId] ?? 0, stars) };
  try {
    storage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (modo privado): el progreso vive solo en memoria.
  }
  return next;
}

export function isUnlocked(level: Level, progress: Progress, chapterLevels: Level[]): boolean {
  const index = chapterLevels.findIndex((l) => l.id === level.id);
  return index <= 0 || (progress[chapterLevels[index - 1].id] ?? 0) > 0;
}
```

- [ ] **Step 5: Verificar**

Run: `npx vitest run src/game src/storage && npm run typecheck && npm run lint`
Expected: PASS; tipos y lint sin errores.

- [ ] **Step 6: Commit**

```bash
git add projects/follow-the-packet/src/game projects/follow-the-packet/src/storage
git commit -m "feat(game): add game reducer and resilient progress storage"
```

---

### Task 10: Escena de papel y tinta

**Files:**
- Create: `src/scene/edges.ts`, `src/scene/layout.ts`, `src/scene/theme.ts`, `src/scene/pieces.tsx`, `src/scene/overlays.tsx`, `src/scene/PacketRun.tsx`, `src/scene/GameScene.tsx`
- Create: `src/format.ts` (lo usan la escena y la interfaz)
- Test: `src/scene/edges.test.ts`, `src/scene/layout.test.ts`, `src/format.test.ts`

**Interfaces:**
- Consumes: tipos (tarea 2), `simulate` (tarea 4, solo en tests), `Candidate`/`Level` (tarea 6), nivel 04-01 (tests).
- Produces:
  - `boxEdgePoints(w: number, h: number, d: number): Point3[]`
  - `type Vec2 = [number, number]`; `interface SubnetSpot { x; z; width; depth; az }`; `interface InstanceSpot { x; z; barrier: Vec2; door: Vec2; road: Vec2 }`; `interface Layout { sheet; subnets: Record<string, SubnetSpot>; instances: Record<string, InstanceSpot>; roadZ; roadFromX; roadToX; igw: Vec2; actors: Record<string, Vec2> }`; `computeLayout(net: Network): Layout`; `pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[]`; `cumulativeLengths(path: Vec2[]): number[]`; `pointAt(path: Vec2[], lengths: number[], distance: number): Vec2`; `checkpointPosition(cp: Checkpoint, layout: Layout): Vec2`
  - `formatWhat(what: RuleWhat): string`; `formatPeer(peer: RulePeer, net: Network): string`; `endpointName(e: Endpoint, net: Network): string`; `formatPacket(p: PacketSpec, net: Network): string`; `findRule(net: Network, sgId: string, ruleId: string): Rule | undefined`; `formatSolution(level: Level): string`; `OUTCOME_TEXT: Record<Outcome, string>`
  - `<GameScene network trace packet runId reducedMotion packetColor candidates onPredict />` con `interface GameSceneProps { network: Network; trace: Trace | null; packet: PacketSpec | null; runId: number; reducedMotion: boolean; packetColor: 'accent' | 'ink'; candidates: Candidate[]; onPredict: (cp: Checkpoint) => void }`

- [ ] **Step 1: Escribir los tests puros (fallan)**

`src/scene/edges.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { boxEdgePoints } from './edges';

describe('boxEdgePoints', () => {
  it('da las 12 aristas de una caja como 24 puntos en pares', () => {
    const points = boxEdgePoints(2, 4, 6);
    expect(points).toHaveLength(24);
    for (const [x, y, z] of points) {
      expect(Math.abs(x)).toBe(1);
      expect(Math.abs(y)).toBe(2);
      expect(Math.abs(z)).toBe(3);
    }
    for (let i = 0; i < points.length; i += 2) {
      const differing = [0, 1, 2].filter((axis) => points[i][axis] !== points[i + 1][axis]);
      expect(differing).toHaveLength(1);
    }
  });
});
```

`src/scene/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '../engine/fixtures';
import { simulate } from '../engine/simulate';
import { checkpointPosition, computeLayout, cumulativeLengths, pathFor, pointAt } from './layout';

const S2 = '172.31.38.97';

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net());

  it('pone una columna por subred y cada instancia dentro de la suya', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.instances.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.instances.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('la barrera y la carretera quedan delante del edificio (z mayor, hacia la cámara)', () => {
    const spot = layout.instances.servidor2;
    expect(spot.barrier[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.barrier[1]);
  });

  it('el internet gateway y los actores quedan a la izquierda de la hoja', () => {
    expect(layout.igw[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.igw[0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net);

  it('paso 3: termina en la barrera de servidor2', () => {
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.barrier);
  });

  it('paso 5: llega hasta la puerta de servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.door);
  });

  it('una IP privada desde internet termina en el internet gateway', () => {
    const packet = ping(actor('attacker'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.igw);
  });
});

describe('interpolación del recorrido', () => {
  it('pointAt recorre los tramos en orden', () => {
    const path: [number, number][] = [[0, 0], [2, 0], [2, 2]];
    const lengths = cumulativeLengths(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(pointAt(path, lengths, 1)).toEqual([1, 0]);
    expect(pointAt(path, lengths, 3)).toEqual([2, 1]);
    expect(pointAt(path, lengths, 99)).toEqual([2, 2]);
  });
});

describe('checkpointPosition', () => {
  it('sitúa cada punto de control en su pieza', () => {
    const layout = computeLayout(lab03Net());
    expect(checkpointPosition({ stage: 'sg-in', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.barrier);
    expect(checkpointPosition({ stage: 'linux', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.door);
    expect(checkpointPosition({ stage: 'route', at: 'igw' }, layout)).toEqual(layout.igw);
  });
});
```

`src/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from './engine/fixtures';
import { formatPacket, formatPeer, formatSolution, formatWhat } from './format';
import level01 from './levels/04-iaas/01-where-ping-dies';

describe('formatos', () => {
  it('describe el qué de una regla en lenguaje simple', () => {
    expect(formatWhat({ kind: 'icmp', icmpType: 8 })).toBe('ICMP · Echo Request');
    expect(formatWhat({ kind: 'icmp', icmpType: 0 })).toBe('ICMP · Echo Reply');
    expect(formatWhat({ kind: 'tcp', fromPort: 22, toPort: 22 })).toBe('TCP 22');
    expect(formatWhat({ kind: 'all' })).toBe('Todo el tráfico');
  });

  it('describe el desde dónde por nombre de SG o por CIDR', () => {
    const net = lab03Net();
    expect(formatPeer({ kind: 'sg', sgId: 'sg-servidor1' }, net)).toBe('SG servidor1');
    expect(formatPeer({ kind: 'cidr', cidr: '0.0.0.0/0' }, net)).toBe('0.0.0.0/0');
  });

  it('describe un paquete', () => {
    const net = lab03Net();
    expect(formatPacket(ping(inst('servidor1'), '172.31.38.97'), net)).toBe('ping de servidor1 a 172.31.38.97');
    expect(formatPacket(ping(actor('probe-internet'), '34.244.254.100'), net)).toBe('ping de Internet a 34.244.254.100');
  });

  it('describe la solución de un nivel', () => {
    expect(formatSolution(level01)).toBe('Agregar en el SG servidor2: ICMP · Echo Request desde SG servidor1.');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/scene src/format.test.ts`
Expected: FAIL, no existen `./edges`, `./layout` ni `./format`.

- [ ] **Step 3: Escribir las funciones puras**

`src/scene/edges.ts`:

```ts
export type Point3 = [number, number, number];

/** Las 12 aristas de una caja centrada, como 24 puntos (pares inicio-fin) para drei <Line segments>. */
export function boxEdgePoints(w: number, h: number, d: number): Point3[] {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const c: Point3[] = [
    [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z],
    [-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return edges.flatMap(([a, b]) => [c[a], c[b]]);
}
```

`src/scene/layout.ts`:

```ts
import type { Checkpoint, Network, PacketSpec, Trace } from '../engine/types';

/** [x, z] sobre el plano del suelo. La cámara mira desde +x, +z: "delante" es z mayor. */
export type Vec2 = [number, number];

export interface SubnetSpot {
  x: number;
  z: number;
  width: number;
  depth: number;
  az: string;
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

/** Una columna por subred (en el orden del nivel), instancias en fila, internet a la izquierda. */
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
    subnets[subnet.id] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1, az: subnet.az };
    const own = net.instances.filter((i) => i.subnetId === subnet.id);
    own.forEach((instance, k) => {
      const x = cx + (k - (own.length - 1) / 2) * GAP;
      instances[instance.id] = { x, z: BUILDING_Z, barrier: [x, BARRIER_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const igw: Vec2 = [-sheetWidth / 2 - 1.5, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [igw[0] - 3 - k * 2.5, ROAD_Z + (k % 2 === 0 ? 0 : 1.6)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, instances, roadZ: ROAD_Z, roadFromX: igw[0], roadToX: sheetWidth / 2 - 0.5, igw, actors };
}

/** Puntos por los que viaja el paquete según su recorrido; termina donde murió. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
  const points: Vec2[] = [];
  const from = packet.from;
  const source = from.kind === 'instance' ? layout.instances[from.id] : undefined;
  if (source) points.push(source.door, source.barrier, source.road);
  else points.push(layout.actors[from.id] ?? layout.igw);

  if (trace.steps.some((s) => s.stage === 'sg-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && s.at === 'igw'))) points.push(layout.igw);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.instances[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.barrier);
  if (trace.steps.some((s) => s.stage === 'sg-in' && s.verdict === 'drop')) return points;
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

export function checkpointPosition(cp: Checkpoint, layout: Layout): Vec2 {
  const spot = layout.instances[cp.at];
  switch (cp.stage) {
    case 'route':
      return cp.at === 'igw' ? layout.igw : [0, layout.roadZ];
    case 'dns':
      return spot?.door ?? layout.actors[cp.at] ?? layout.igw;
    case 'sg-out':
    case 'sg-in':
      return spot?.barrier ?? layout.igw;
    case 'linux':
      return spot?.door ?? layout.igw;
    case 'reply':
      return spot ? [spot.door[0], spot.door[1] - 0.6] : layout.igw;
  }
}
```

`src/format.ts`:

```ts
import type { Endpoint, Network, Outcome, PacketSpec, Rule, RulePeer, RuleWhat } from './engine/types';
import type { Level } from './levels/schema';

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

export function endpointName(e: Endpoint, net: Network): string {
  if (e.kind === 'instance') return net.instances.find((i) => i.id === e.id)?.name ?? e.id;
  return net.actors.find((a) => a.id === e.id)?.name ?? 'Internet';
}

export function formatPacket(p: PacketSpec, net: Network): string {
  const service = p.protocol === 'icmp' ? (p.icmpType === 8 ? 'ping' : 'ICMP Echo Reply') : `${p.protocol.toUpperCase()} ${p.port}`;
  const to = p.to === '@appTarget' ? 'el destino de su app' : p.to;
  return `${service} de ${endpointName(p.from, net)} a ${to}`;
}

export function findRule(net: Network, sgId: string, ruleId: string): Rule | undefined {
  const group = net.securityGroups.find((g) => g.id === sgId);
  return group ? [...group.inbound, ...group.outbound].find((r) => r.id === ruleId) : undefined;
}

export function formatSolution(level: Level): string {
  const net = level.network;
  const sgName = (id: string) => net.securityGroups.find((g) => g.id === id)?.name ?? id;
  const instanceName = (id: string) => net.instances.find((i) => i.id === id)?.name ?? id;
  if (level.solution.kind === 'attacker') return `Lanzar ${formatPacket(level.solution.packet, net)}.`;
  return level.solution.actions
    .map((a) => {
      switch (a.type) {
        case 'addRule':
          return `Agregar en el SG ${sgName(a.sgId)}: ${formatWhat(a.rule.what)} desde ${formatPeer(a.rule.peer, net)}.`;
        case 'removeRule': {
          const rule = findRule(net, a.sgId, a.ruleId);
          return `Borrar del SG ${sgName(a.sgId)} la regla ${rule ? `${formatWhat(rule.what)} desde ${formatPeer(rule.peer, net)}` : a.ruleId}.`;
        }
        case 'setAppTarget':
          return `Apuntar la app de ${instanceName(a.instanceId)} a ${a.target}.`;
        case 'setIgnoreIcmpEcho':
          return `Linux de ${instanceName(a.instanceId)}: ${a.value ? 'ignorar' : 'contestar'} los ping.`;
      }
    })
    .join(' ');
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  replied: 'Respondió.',
  timeout: 'Timeout: nadie contestó.',
  refused: 'Connection refused: llegó, pero nada escuchaba.',
  'arrived-no-reply': 'Llegó, pero nadie respondió.',
  unresolved: 'El nombre no se pudo resolver.',
};
```

- [ ] **Step 4: Correr los tests puros**

Run: `npx vitest run src/scene src/format.test.ts`
Expected: PASS.

- [ ] **Step 5: Escribir las piezas 3D**

`src/scene/theme.ts`:

```ts
export const INK = '#2b2b2b';
export const PAPER_FILL = '#fbf8f2';
export const PAPER_SHADE = '#efe8da';
export const ACCENT = '#e4572e';
```

`src/scene/pieces.tsx`:

```tsx
import { Html, Line } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Actor } from '../engine/types';
import { boxEdgePoints } from './edges';
import type { InstanceSpot, Layout, SubnetSpot, Vec2 } from './layout';
import { ACCENT, INK, PAPER_FILL, PAPER_SHADE } from './theme';

type V3 = [number, number, number];

/** Caja con relleno de papel y aristas de tinta de grosor real (Line2). */
export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = 1.5 }: { size: V3; position: V3; fill?: string; lineWidth?: number }) {
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

export function Label({ position, children, tone = 'plain' }: { position: V3; children: ReactNode; tone?: 'plain' | 'mono' | 'accent' }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]}>
      <span className={`label3d label3d--${tone}`}>{children}</span>
    </Html>
  );
}

export function Sheet({ layout }: { layout: Layout }) {
  return <InkBox size={[layout.sheet.width, 0.2, layout.sheet.depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}

export function Zone({ spot }: { spot: SubnetSpot }) {
  const { x, z, width: w, depth: d } = spot;
  const corners: V3[] = [
    [x - w / 2, 0.01, z - d / 2],
    [x + w / 2, 0.01, z - d / 2],
    [x + w / 2, 0.01, z + d / 2],
    [x - w / 2, 0.01, z + d / 2],
    [x - w / 2, 0.01, z - d / 2],
  ];
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.005, z]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={corners} color={INK} lineWidth={1.2} dashed dashSize={0.3} gapSize={0.18} />
      <Label position={[x - w / 2 + 0.9, 0.05, z + d / 2 - 0.35]} tone="mono">
        {spot.az}
      </Label>
    </group>
  );
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

export function Building({ spot, name }: { spot: InstanceSpot; name: string }) {
  return (
    <group>
      <InkBox size={[1.6, 1.1, 1.2]} position={[spot.x, 0.55, spot.z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[spot.x, 1.16, spot.z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[spot.x, 0.28, spot.z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
      <Label position={[spot.x, 1.75, spot.z]}>{name}</Label>
    </group>
  );
}

export function Barrier({ spot }: { spot: InstanceSpot }) {
  const [x, z] = spot.barrier;
  return (
    <group>
      <InkBox size={[0.1, 0.5, 0.1]} position={[x - 0.6, 0.25, z]} />
      <InkBox size={[0.1, 0.5, 0.1]} position={[x + 0.6, 0.25, z]} />
      <InkBox size={[1.2, 0.07, 0.07]} position={[x, 0.46, z]} fill={ACCENT} lineWidth={1} />
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
      <Label position={[x, 1.95, z]}>internet gateway</Label>
    </group>
  );
}

export function ActorMark({ position, actor }: { position: Vec2; actor: Actor }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={actor.kind === 'attacker' ? INK : PAPER_FILL} />
      <Label position={[x, 0.95, z]}>{actor.name}</Label>
      <Label position={[x, 0.05, z + 0.65]} tone="mono">
        {actor.ip}
      </Label>
    </group>
  );
}

export function PredictRing({ position, onSelect }: { position: Vec2; onSelect: () => void }) {
  const [x, z] = position;
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[x, 0.04, z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <ringGeometry args={[0.4, 0.55, 40]} />
      <meshBasicMaterial color={ACCENT} transparent opacity={0.85} />
    </mesh>
  );
}
```

`src/scene/overlays.tsx`:

```tsx
import { Html } from '@react-three/drei';
import type { Network, Trace } from '../engine/types';
import { findRule, formatPeer, formatWhat } from '../format';
import type { Layout } from './layout';
import { Label } from './pieces';

/** Notas del DNS ("nombre → IP") y del NAT ("el origen cambia") sobre el mapa. */
export function StepNotes({ trace, layout }: { trace: Trace; layout: Layout }) {
  return (
    <>
      {trace.steps
        .filter((s) => s.stage === 'dns' || s.stage === 'nat')
        .map((s, index) => {
          const position = s.stage === 'nat' ? layout.igw : (layout.instances[s.at]?.door ?? layout.actors[s.at] ?? layout.igw);
          return (
            <Label key={`${s.stage}-${index}`} position={[position[0], 2.5, position[1]]} tone="accent">
              {s.reason}
            </Label>
          );
        })}
    </>
  );
}

/** La lista del guardia: cada regla de entrada con qué ✓/✕ y desde dónde ✓/✕. */
export function GuardList({ trace, network, layout }: { trace: Trace; network: Network; layout: Layout }) {
  const step = trace.steps.find((s) => s.stage === 'sg-in');
  const spot = step ? layout.instances[step.at] : undefined;
  if (!step?.checks || !spot) return null;
  return (
    <Html position={[spot.barrier[0] + 1.3, 1.3, spot.barrier[1]]} zIndexRange={[20, 0]}>
      <div className="guard">
        <p className="guard__title">Lista del guardia</p>
        {step.checks.length === 0 && <p>Sin reglas de entrada.</p>}
        {step.checks.map((c) => {
          const rule = findRule(network, c.sgId, c.ruleId);
          return (
            <p key={`${c.sgId}-${c.ruleId}`} className="guard__row">
              <span className="mono">{rule ? `${formatWhat(rule.what)} · ${formatPeer(rule.peer, network)}` : c.ruleId}</span>
              <span>qué {c.what ? '✓' : '✕'}</span>
              <span>desde dónde {c.from ? '✓' : '✕'}</span>
            </p>
          );
        })}
      </div>
    </Html>
  );
}
```

`src/scene/PacketRun.tsx`:

```tsx
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { cumulativeLengths, pointAt, type Vec2 } from './layout';
import { InkBox } from './pieces';

const SPEED = 3.2; // unidades por segundo

/** El paquete viaja por el recorrido y deja un sello al final. Montar con key nueva en cada envío. */
export function PacketRun({ path, reducedMotion, color, verdict }: { path: Vec2[]; reducedMotion: boolean; color: string; verdict: 'pass' | 'drop' }) {
  const group = useRef<Group>(null);
  const travelled = useRef(0);
  const lengths = useMemo(() => cumulativeLengths(path), [path]);
  const total = lengths[lengths.length - 1];
  const [arrived, setArrived] = useState(reducedMotion || total === 0);

  useFrame((_, delta) => {
    if (arrived || !group.current) return;
    travelled.current = Math.min(travelled.current + delta * SPEED, total);
    const [x, z] = pointAt(path, lengths, travelled.current);
    group.current.position.set(x, 0.3, z);
    if (travelled.current >= total) setArrived(true);
  });

  const end = path[path.length - 1];
  const start = arrived ? end : path[0];
  return (
    <>
      <group ref={group} position={[start[0], 0.3, start[1]]}>
        <InkBox size={[0.36, 0.36, 0.36]} position={[0, 0, 0]} fill={color} />
      </group>
      {arrived && (
        <Html position={[end[0], 1.3, end[1]]} center>
          <span className={`stamp stamp--${verdict}`} aria-label={verdict === 'pass' ? 'Pasa' : 'Descartado'}>
            {verdict === 'pass' ? '✓' : '✕'}
          </span>
        </Html>
      )}
    </>
  );
}
```

`src/scene/GameScene.tsx`:

```tsx
import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { Checkpoint, Network, PacketSpec, Trace } from '../engine/types';
import type { Candidate } from '../levels/schema';
import { checkpointPosition, computeLayout, pathFor } from './layout';
import { GuardList, StepNotes } from './overlays';
import { PacketRun } from './PacketRun';
import { ActorMark, Barrier, Building, Gateway, PredictRing, Road, Sheet, Zone } from './pieces';
import { ACCENT, INK } from './theme';

export interface GameSceneProps {
  network: Network;
  trace: Trace | null;
  packet: PacketSpec | null;
  runId: number;
  reducedMotion: boolean;
  packetColor: 'accent' | 'ink';
  candidates: Candidate[];
  onPredict: (cp: Checkpoint) => void;
}

export function GameScene({ network, trace, packet, runId, reducedMotion, packetColor, candidates, onPredict }: GameSceneProps) {
  // La distribución es pura y barata: se recalcula en cada render.
  const layout = computeLayout(network);
  const path = trace && packet ? pathFor(trace, packet, layout) : null;
  return (
    <Canvas
      orthographic
      camera={{ position: [14, 14, 14], zoom: 38, near: 0.1, far: 500 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      dpr={[1, 2]}
    >
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
      {candidates.map((c) => (
        <PredictRing key={c.label} position={checkpointPosition(c.checkpoint, layout)} onSelect={() => onPredict(c.checkpoint)} />
      ))}
      {trace && path && (
        <PacketRun
          key={runId}
          path={path}
          reducedMotion={reducedMotion}
          color={packetColor === 'accent' ? ACCENT : INK}
          verdict={trace.outcome === 'replied' ? 'pass' : 'drop'}
        />
      )}
      {trace && <StepNotes trace={trace} layout={layout} />}
      {trace && <GuardList trace={trace} network={network} layout={layout} />}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
    </Canvas>
  );
}
```

- [ ] **Step 6: Verificar**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: todos los tests PASS; tipos y lint sin errores (la escena se prueba visualmente en las tareas 11 y 12).

- [ ] **Step 7: Commit**

```bash
git add projects/follow-the-packet/src/scene projects/follow-the-packet/src/format.ts projects/follow-the-packet/src/format.test.ts
git commit -m "feat(scene): add paper-and-ink isometric scene driven by the trace"
```

---

### Task 11: Interfaz y flujo de la partida

**Files:**
- Modify: `src/App.tsx`, `src/styles.css` (reemplazar el contenido provisional)
- Create: `src/ui/shared/usePrefersReducedMotion.ts`, `src/ui/shared/Roadmap.tsx`, `src/ui/shared/LevelScreen.tsx`, `src/ui/shared/BriefPanel.tsx`, `src/ui/shared/PredictPanel.tsx`, `src/ui/shared/ResultPanel.tsx`, `src/ui/shared/TraceList.tsx`, `src/ui/shared/ToolsPanel.tsx`
- Create: `src/ui/defender/RuleEditor.tsx`, `src/ui/defender/AppTargetPicker.tsx`, `src/ui/defender/LinuxFlags.tsx`, `src/ui/defender/DefenderPanel.tsx`
- Create: `src/ui/attacker/AttackComposer.tsx`
- Test: `src/ui/defender/RuleEditor.test.tsx`, `src/ui/attacker/AttackComposer.test.tsx`, `src/ui/shared/LevelScreen.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `GameScene` (tarea 10), `gameReducer`/`initGame`/`GameState` (tarea 9), `loadProgress`/`saveStars`/`isUnlocked`/`Progress` (tarea 9), `LEVELS`/`levelById`/`levelsOfChapter` (tarea 6), `CHAPTERS` (tarea 1), formatos (tarea 10), `resolveName`/`publicDnsName`/`privateDnsName` (tarea 2).
- Produces: `<App />`; `<LevelScreen level reducedMotion onToggleMotion onFinish />`; `<RuleEditor spec network onApply />`; `<AttackComposer objective attempts onLaunch />`.

- [ ] **Step 1: Escribir los tests de interfaz (fallan)**

`src/ui/defender/RuleEditor.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level01 from '../../levels/04-iaas/01-where-ping-dies';
import { RuleEditor } from './RuleEditor';

describe('RuleEditor', () => {
  it('agrega la regla elegida en qué y desde dónde', async () => {
    const onApply = vi.fn();
    render(<RuleEditor spec={level01.editable.rules!} network={level01.network} onApply={onApply} />);
    await userEvent.selectOptions(screen.getByLabelText('Qué'), 'ICMP · Echo Request ("Repetir solicitud")');
    await userEvent.selectOptions(screen.getByLabelText('Desde dónde'), 'SG servidor1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar regla' }));
    expect(onApply).toHaveBeenCalledWith({
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: expect.objectContaining({ what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'sg', sgId: 'sg-servidor1' } }),
    });
  });

  it('borra una regla existente', async () => {
    const onApply = vi.fn();
    render(<RuleEditor spec={level01.editable.rules!} network={level01.network} onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar regla TCP 22 desde 198.51.100.7/32' }));
    expect(onApply).toHaveBeenCalledWith({ type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
  });
});
```

`src/ui/attacker/AttackComposer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level04 from '../../levels/04-iaas/04-too-wide';
import { AttackComposer } from './AttackComposer';

describe('AttackComposer', () => {
  it('arma el paquete con el origen, el destino y el servicio elegidos', async () => {
    if (level04.objective.kind !== 'attacker' || level04.solution.kind !== 'attacker') throw new Error('nivel 04-04 debe ser de atacante');
    const onLaunch = vi.fn();
    render(<AttackComposer objective={level04.objective} attempts={0} onLaunch={onLaunch} />);
    await userEvent.selectOptions(screen.getByLabelText('Desde'), 'Desde web (el servidor que controlas)');
    await userEvent.selectOptions(screen.getByLabelText('Hacia'), 'db por su IP privada · 172.31.40.10');
    await userEvent.selectOptions(screen.getByLabelText('Servicio'), 'PostgreSQL · TCP 5432');
    await userEvent.click(screen.getByRole('button', { name: 'Lanzar ataque' }));
    expect(onLaunch).toHaveBeenCalledWith(level04.solution.packet);
  });
});
```

`src/ui/shared/LevelScreen.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level01 from '../../levels/04-iaas/01-where-ping-dies';
import { LevelScreen } from './LevelScreen';

// Sin JSX en la fábrica: vi.mock se sube al inicio del archivo, antes que el runtime de JSX.
vi.mock('../../scene/GameScene', () => ({ GameScene: () => null }));

describe('LevelScreen', () => {
  it('juega el nivel 1 de punta a punta y reporta 3 estrellas', async () => {
    const onFinish = vi.fn();
    render(<LevelScreen level={level01} reducedMotion onToggleMotion={() => {}} onFinish={onFinish} />);
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    await userEvent.click(screen.getByRole('button', { name: 'En la barrera de servidor2 (su SG de entrada)' }));
    await userEvent.selectOptions(screen.getByLabelText('Qué'), 'ICMP · Echo Request ("Repetir solicitud")');
    await userEvent.selectOptions(screen.getByLabelText('Desde dónde'), 'SG servidor1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar regla' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('3 de 3 estrellas')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledWith(3);
  });

  it('si falla, ofrece pistas en escalera hasta la solución', async () => {
    render(<LevelScreen level={level01} reducedMotion onToggleMotion={() => {}} onFinish={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dentro de servidor2 (Linux)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('0 de 3 estrellas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pedir una pista' }));
    expect(screen.getByText(level01.hints[0])).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pedir una pista' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ver la solución' }));
    expect(screen.getByText(/Solución: Agregar en el SG servidor2/)).toBeInTheDocument();
  });
});
```

`src/App.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

// Sin JSX en la fábrica: vi.mock se sube al inicio del archivo, antes que el runtime de JSX.
vi.mock('./scene/GameScene', () => ({ GameScene: () => null }));

afterEach(() => {
  window.location.hash = '';
  localStorage.clear();
});

describe('App', () => {
  it('muestra el roadmap con los 20 capítulos', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
    expect(screen.getByText('Infraestructura Tradicional y Compute Clásico (IaaS)')).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente')).toHaveLength(19);
  });

  it('un nivel que no existe muestra "Nivel no encontrado" (Review Focus 2)', () => {
    window.location.hash = '#/level/99-99';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Nivel no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al roadmap' })).toHaveAttribute('href', '#/');
  });

  it('un progreso corrupto no rompe el roadmap (Review Focus 1)', () => {
    localStorage.setItem('follow-the-packet:progress:v1', '{roto');
    render(<App />);
    expect(screen.getByRole('link', { name: /¿Dónde muere el ping\?/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/ui src/App.test.tsx`
Expected: FAIL, no existen los componentes.

- [ ] **Step 3: Escribir los componentes del defensor**

`src/ui/defender/RuleEditor.tsx`:

```tsx
import { useId, useState } from 'react';
import type { Network } from '../../engine/types';
import { formatPeer, formatWhat } from '../../format';
import type { Level, LevelAction } from '../../levels/schema';

let counter = 0;
function newRuleId(): string {
  counter += 1;
  return `user-${counter}`;
}

export interface RuleEditorProps {
  spec: NonNullable<Level['editable']['rules']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}

export function RuleEditor({ spec, network, onApply }: RuleEditorProps) {
  const ids = { sg: useId(), what: useId(), peer: useId() };
  const [sgId, setSgId] = useState(spec.sgIds[0]);
  const [whatIndex, setWhatIndex] = useState(0);
  const [peerIndex, setPeerIndex] = useState(0);
  const group = network.securityGroups.find((g) => g.id === sgId);
  if (!group) return null;

  const add = () =>
    onApply({
      type: 'addRule',
      sgId,
      rule: { id: newRuleId(), what: spec.whatOptions[whatIndex].what, peer: spec.peerOptions[peerIndex].peer },
    });

  return (
    <section className="card" aria-labelledby={`${ids.sg}-title`}>
      <h3 id={`${ids.sg}-title`}>Reglas de entrada</h3>
      {spec.sgIds.length > 1 && (
        <div className="field">
          <label htmlFor={ids.sg}>Security Group</label>
          <select id={ids.sg} value={sgId} onChange={(e) => setSgId(e.target.value)}>
            {spec.sgIds.map((id) => (
              <option key={id} value={id}>
                {network.securityGroups.find((g) => g.id === id)?.name ?? id}
              </option>
            ))}
          </select>
        </div>
      )}
      <table className="rules">
        <caption className="sr-only">Reglas de entrada del SG {group.name}</caption>
        <thead>
          <tr>
            <th scope="col">Qué</th>
            <th scope="col">Desde dónde</th>
            <th scope="col">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {group.inbound.length === 0 && (
            <tr>
              <td colSpan={3}>Sin reglas: no entra nada.</td>
            </tr>
          )}
          {group.inbound.map((rule) => (
            <tr key={rule.id}>
              <td className="mono">{formatWhat(rule.what)}</td>
              <td className="mono">{formatPeer(rule.peer, network)}</td>
              <td>
                <button
                  className="btn btn--small"
                  aria-label={`Borrar regla ${formatWhat(rule.what)} desde ${formatPeer(rule.peer, network)}`}
                  onClick={() => onApply({ type: 'removeRule', sgId, ruleId: rule.id })}
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rule-form">
        <div className="field">
          <label htmlFor={ids.what}>Qué</label>
          <select id={ids.what} value={whatIndex} onChange={(e) => setWhatIndex(Number(e.target.value))}>
            {spec.whatOptions.map((o, i) => (
              <option key={o.label} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.peer}>Desde dónde</label>
          <select id={ids.peer} value={peerIndex} onChange={(e) => setPeerIndex(Number(e.target.value))}>
            {spec.peerOptions.map((o, i) => (
              <option key={o.label} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={add}>
          Agregar regla
        </button>
      </div>
    </section>
  );
}
```

`src/ui/defender/AppTargetPicker.tsx`:

```tsx
import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';

export function AppTargetPicker({
  spec,
  network,
  onApply,
}: {
  spec: NonNullable<Level['editable']['appTarget']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}) {
  const instance = network.instances.find((i) => i.id === spec.instanceId);
  return (
    <fieldset className="card">
      <legend>¿A dónde apunta la app de {instance?.name ?? spec.instanceId}?</legend>
      {spec.options.map((o) => (
        <label key={o.target} className="radio">
          <input
            type="radio"
            name="app-target"
            value={o.target}
            checked={instance?.appTarget === o.target}
            onChange={() => onApply({ type: 'setAppTarget', instanceId: spec.instanceId, target: o.target })}
          />{' '}
          <span className="mono">{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
```

`src/ui/defender/LinuxFlags.tsx`:

```tsx
import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';

export function LinuxFlags({
  spec,
  network,
  onApply,
}: {
  spec: NonNullable<Level['editable']['linuxFlags']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}) {
  return (
    <fieldset className="card">
      <legend>Linux</legend>
      {spec.instanceIds.map((id) => {
        const instance = network.instances.find((i) => i.id === id);
        if (!instance) return null;
        return (
          <label key={id} className="check">
            <input
              type="checkbox"
              checked={instance.linux.ignoreIcmpEcho}
              onChange={(e) => onApply({ type: 'setIgnoreIcmpEcho', instanceId: id, value: e.target.checked })}
            />{' '}
            {instance.name} ignora los ping <span className="mono">(icmp_echo_ignore_all)</span>
          </label>
        );
      })}
    </fieldset>
  );
}
```

`src/ui/defender/DefenderPanel.tsx`:

```tsx
import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';
import { AppTargetPicker } from './AppTargetPicker';
import { LinuxFlags } from './LinuxFlags';
import { RuleEditor } from './RuleEditor';

export function DefenderPanel({
  level,
  network,
  onApply,
  onLaunch,
  onReset,
}: {
  level: Level;
  network: Network;
  onApply: (action: LevelAction) => void;
  onLaunch: () => void;
  onReset: () => void;
}) {
  const { editable } = level;
  return (
    <>
      {editable.rules && <RuleEditor spec={editable.rules} network={network} onApply={onApply} />}
      {editable.appTarget && <AppTargetPicker spec={editable.appTarget} network={network} onApply={onApply} />}
      {editable.linuxFlags && <LinuxFlags spec={editable.linuxFlags} network={network} onApply={onApply} />}
      <div className="actions">
        <button className="btn btn--primary" onClick={onLaunch}>
          Enviar
        </button>
        <button className="btn" onClick={onReset}>
          Deshacer cambios
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Escribir el panel del atacante**

`src/ui/attacker/AttackComposer.tsx`:

```tsx
import { useId, useState } from 'react';
import type { PacketSpec } from '../../engine/types';
import type { AttackerObjective } from '../../levels/schema';

export function AttackComposer({
  objective,
  attempts,
  onLaunch,
}: {
  objective: AttackerObjective;
  attempts: number;
  onLaunch: (packet: PacketSpec) => void;
}) {
  const ids = { origin: useId(), target: useId(), service: useId() };
  const [origin, setOrigin] = useState(0);
  const [target, setTarget] = useState(0);
  const [service, setService] = useState(0);
  const { attack, maxAttempts } = objective;

  const launch = () => {
    const svc = attack.services[service];
    onLaunch({
      from: attack.origins[origin].endpoint,
      to: attack.targets[target].to,
      protocol: svc.protocol,
      ...(svc.protocol === 'icmp' ? { icmpType: svc.icmpType } : { port: svc.port }),
    });
  };

  return (
    <section className="card" aria-labelledby={`${ids.origin}-title`}>
      <h3 id={`${ids.origin}-title`}>Arma el ataque</h3>
      <div className="field">
        <label htmlFor={ids.origin}>Desde</label>
        <select id={ids.origin} value={origin} onChange={(e) => setOrigin(Number(e.target.value))}>
          {attack.origins.map((o, i) => (
            <option key={o.label} value={i}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={ids.target}>Hacia</label>
        <select id={ids.target} value={target} onChange={(e) => setTarget(Number(e.target.value))}>
          {attack.targets.map((t, i) => (
            <option key={t.label} value={i}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={ids.service}>Servicio</label>
        <select id={ids.service} value={service} onChange={(e) => setService(Number(e.target.value))}>
          {attack.services.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p className="muted">
        Intentos: {attempts}. Para la segunda estrella, {maxAttempts} o menos.
      </p>
      <button className="btn btn--primary" onClick={launch}>
        Lanzar ataque
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Escribir los paneles compartidos**

`src/ui/shared/usePrefersReducedMotion.ts`:

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(QUERY);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

`src/ui/shared/BriefPanel.tsx`:

```tsx
import type { Level } from '../../levels/schema';

export function BriefPanel({ level, onStart }: { level: Level; onStart: () => void }) {
  return (
    <section className="card">
      <p>{level.brief}</p>
      <p className="muted">
        {level.role === 'defender'
          ? 'Eres el defensor: configura la red para que pase lo bueno y nada más.'
          : 'Eres el atacante: encuentra el camino que la configuración deja abierto.'}
      </p>
      <p className="muted">Repasa: {level.lesson}</p>
      <button className="btn btn--primary" onClick={onStart}>
        Empezar
      </button>
    </section>
  );
}
```

`src/ui/shared/PredictPanel.tsx`:

```tsx
import type { Checkpoint } from '../../engine/types';
import { formatPacket } from '../../format';
import type { Level } from '../../levels/schema';

export function PredictPanel({ level, onPredict }: { level: Level; onPredict: (cp: Checkpoint) => void }) {
  return (
    <section className="card" aria-labelledby="predict-title">
      <h3 id="predict-title">Predice</h3>
      <p>
        Antes de tocar nada: <strong>{formatPacket(level.prediction.packet, level.network)}</strong>. ¿Dónde crees que muere?
      </p>
      <p className="muted">Elige aquí o haz clic en un círculo del mapa.</p>
      <div className="choices">
        {level.prediction.candidates.map((c) => (
          <button key={c.label} className="btn btn--choice" onClick={() => onPredict(c.checkpoint)}>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
```

`src/ui/shared/TraceList.tsx`:

```tsx
import type { Trace, Verdict } from '../../engine/types';
import { OUTCOME_TEXT } from '../../format';

const MARK: Record<Verdict, string> = { pass: '✓', drop: '✕', reject: '⊘', info: '·' };

export function TraceList({ trace }: { trace: Trace }) {
  return (
    <section className="card" aria-labelledby="trace-title">
      <h3 id="trace-title">Recorrido</h3>
      <ol className="trace">
        {trace.steps.map((step, index) => (
          <li key={index} className={`trace__step trace__step--${step.verdict}`}>
            <span aria-hidden="true">{MARK[step.verdict]}</span> {step.reason}
          </li>
        ))}
      </ol>
      <p className="trace__outcome">{OUTCOME_TEXT[trace.outcome]}</p>
    </section>
  );
}
```

`src/ui/shared/ToolsPanel.tsx`:

```tsx
import { useId, useState } from 'react';
import { privateDnsName, publicDnsName, resolveName } from '../../engine/dns';
import type { Network, Trace } from '../../engine/types';
import { formatPeer, formatWhat } from '../../format';
import type { Level } from '../../levels/schema';

function RulesTool({ network }: { network: Network }) {
  return (
    <details>
      <summary>Ver reglas</summary>
      {network.instances.map((instance) => (
        <div key={instance.id} className="tool-block">
          <p className="tool-block__title">{instance.name}</p>
          {instance.sgIds.map((sgId) => {
            const group = network.securityGroups.find((g) => g.id === sgId);
            if (!group) return null;
            return (
              <div key={sgId}>
                <p className="muted">SG {group.name} · entrada</p>
                <ul className="mono">
                  {group.inbound.length === 0 ? (
                    <li>Sin reglas</li>
                  ) : (
                    group.inbound.map((r) => (
                      <li key={r.id}>
                        {formatWhat(r.what)} · {formatPeer(r.peer, network)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </details>
  );
}

function TcpdumpTool({ network, trace }: { network: Network; trace: Trace | null }) {
  const id = useId();
  const [instanceId, setInstanceId] = useState(network.instances[0]?.id ?? '');
  const lines = trace ? trace.tcpdump.filter((l) => l.instanceId === instanceId) : [];
  const output = !trace
    ? 'Aún no has enviado nada.'
    : lines.length === 0
      ? '(nada: ningún paquete llegó a esta máquina)'
      : lines.map((l) => `${l.direction.padEnd(3)} IP ${l.src} > ${l.dst}: ${l.summary}`).join('\n');
  return (
    <details>
      <summary>tcpdump</summary>
      <div className="field">
        <label htmlFor={id}>Escuchar en</label>
        <select id={id} value={instanceId} onChange={(e) => setInstanceId(e.target.value)}>
          {network.instances.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <pre className="terminal" aria-live="polite">
        {output}
      </pre>
    </details>
  );
}

function GetentTool({ network }: { network: Network }) {
  const fromId = useId();
  const nameId = useId();
  const names = network.instances.flatMap((i) => [
    ...(i.publicIp ? [publicDnsName(i.publicIp, network.region)] : []),
    privateDnsName(i.privateIp, network.region),
  ]);
  const [from, setFrom] = useState('outside');
  const [name, setName] = useState(names[0] ?? '');
  const answer = name ? resolveName(network, name, from !== 'outside') : null;
  return (
    <details>
      <summary>getent hosts</summary>
      <div className="field">
        <label htmlFor={fromId}>Preguntar desde</label>
        <select id={fromId} value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="outside">Tu Mac (fuera de AWS)</option>
          {network.instances.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={nameId}>Nombre</label>
        <select id={nameId} value={name} onChange={(e) => setName(e.target.value)}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <pre className="terminal">{answer ? `${answer}    ${name}` : '(sin respuesta)'}</pre>
    </details>
  );
}

export function ToolsPanel({ tools, network, trace }: { tools: Level['tools']; network: Network; trace: Trace | null }) {
  if (tools.length === 0) return null;
  return (
    <section className="card" aria-labelledby="tools-title">
      <h3 id="tools-title">Herramientas</h3>
      {tools.includes('rules') && <RulesTool network={network} />}
      {tools.includes('tcpdump') && <TcpdumpTool network={network} trace={trace} />}
      {tools.includes('getent') && <GetentTool network={network} />}
    </section>
  );
}
```

`src/ui/shared/ResultPanel.tsx`:

```tsx
import type { Network } from '../../engine/types';
import { formatPacket, formatSolution } from '../../format';
import type { GameState } from '../../game/reducer';
import type { DefenderEvaluation } from '../../levels/evaluate';
import { levelsOfChapter } from '../../levels/registry';
import type { Level } from '../../levels/schema';

function DefenderDetails({ evaluation, network }: { evaluation: DefenderEvaluation; network: Network }) {
  const failedPass = evaluation.mustPass.filter((r) => !r.ok);
  const failedBlock = evaluation.mustBlock.filter((r) => !r.ok);
  if (failedPass.length === 0 && failedBlock.length === 0 && evaluation.extra.length === 0) return null;
  return (
    <div className="details">
      {failedPass.map((r, i) => (
        <p key={`pass-${i}`}>✕ Debía pasar: {formatPacket(r.packet, network)}</p>
      ))}
      {failedBlock.map((r, i) => (
        <p key={`block-${i}`}>✕ Debía quedar fuera: {formatPacket(r.packet, network)}</p>
      ))}
      {evaluation.extra.length > 0 && (
        <>
          <p>Abriste de más ({evaluation.extra.length}). Por ejemplo:</p>
          <ul className="mono">
            {evaluation.extra.slice(0, 5).map((p, i) => (
              <li key={`extra-${i}`}>{formatPacket(p, network)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Hints({ level, shown, onHint }: { level: Level; shown: number; onHint: () => void }) {
  const items = [level.hints[0], level.hints[1], `Solución: ${formatSolution(level)}`].slice(0, shown);
  return (
    <div className="hints">
      {items.map((text) => (
        <p key={text} className="hint">
          {text}
        </p>
      ))}
      {shown < 3 && (
        <button className="btn" onClick={onHint}>
          {shown < 2 ? 'Pedir una pista' : 'Ver la solución'}
        </button>
      )}
    </div>
  );
}

export function ResultPanel({ state, onRetry, onHint }: { state: GameState; onRetry: () => void; onHint: () => void }) {
  const { level, stars, evaluation } = state;
  if (!stars || !evaluation) return null;
  const next = levelsOfChapter(level.chapter).find((l) => l.order === level.order + 1);
  const tightLabel = level.objective.kind === 'attacker' ? `En ${level.objective.maxAttempts} intentos o menos` : 'Sin abrir de más';
  return (
    <section className="card result" aria-live="polite">
      <p className="stars">
        <span aria-hidden="true">
          {'★'.repeat(stars.count)}
          {'☆'.repeat(3 - stars.count)}
        </span>{' '}
        {stars.count} de 3 estrellas
      </p>
      <ul className="checklist">
        <li>{stars.objective ? '✓' : '✕'} Objetivo</li>
        <li>
          {stars.tight ? '✓' : '✕'} {tightLabel}
        </li>
        <li>{stars.prediction ? '✓' : '✕'} Predicción</li>
      </ul>
      {evaluation.kind === 'defender' && <DefenderDetails evaluation={evaluation} network={state.network} />}
      {stars.objective ? (
        <>
          <h3>Lo que te llevas</h3>
          <p>{level.takeaway}</p>
          <p className="muted">
            Tu nota: <code>{level.concept}</code>
          </p>
          <a className="btn btn--primary" href={next ? `#/level/${next.id}` : '#/'}>
            {next ? 'Siguiente nivel' : 'Volver al roadmap'}
          </a>
        </>
      ) : (
        <p>Todavía no. Mira el recorrido paso a paso y vuelve a intentarlo.</p>
      )}
      <Hints level={level} shown={state.hintsShown} onHint={onHint} />
      <button className="btn" onClick={onRetry}>
        Volver a intentar
      </button>
    </section>
  );
}
```

`src/ui/shared/LevelScreen.tsx`:

```tsx
import { useEffect, useReducer, useRef } from 'react';
import { gameReducer, initGame } from '../../game/reducer';
import type { Level } from '../../levels/schema';
import { GameScene } from '../../scene/GameScene';
import { AttackComposer } from '../attacker/AttackComposer';
import { DefenderPanel } from '../defender/DefenderPanel';
import { BriefPanel } from './BriefPanel';
import { PredictPanel } from './PredictPanel';
import { ResultPanel } from './ResultPanel';
import { ToolsPanel } from './ToolsPanel';
import { TraceList } from './TraceList';

export interface LevelScreenProps {
  level: Level;
  reducedMotion: boolean;
  onToggleMotion: () => void;
  onFinish: (stars: number) => void;
}

export function LevelScreen({ level, reducedMotion, onToggleMotion, onFinish }: LevelScreenProps) {
  const [state, dispatch] = useReducer(gameReducer, level, initGame);
  // onFinish cambia de identidad en cada render del padre: guardarlo en una ref evita bucles.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  useEffect(() => {
    if (state.phase === 'result' && state.stars && state.stars.count > 0) onFinishRef.current(state.stars.count);
  }, [state.phase, state.stars]);

  const objective = level.objective;
  return (
    <div className="level">
      <section className="stage" aria-label="Mapa de la red">
        <GameScene
          network={state.network}
          trace={state.phase === 'result' ? state.lastTrace : null}
          packet={state.lastPacket}
          runId={state.attempts}
          reducedMotion={reducedMotion}
          packetColor={level.role === 'attacker' ? 'ink' : 'accent'}
          candidates={state.phase === 'predict' ? level.prediction.candidates : []}
          onPredict={(point) => dispatch({ type: 'predict', point })}
        />
      </section>
      <aside className="side">
        <nav className="side__top">
          <a href="#/">← Roadmap</a>
          <label className="check">
            <input type="checkbox" checked={reducedMotion} onChange={onToggleMotion} /> Sin animaciones
          </label>
        </nav>
        <header>
          <p className="eyebrow">
            Capítulo {level.chapter} · Nivel {level.order} · {level.role === 'defender' ? 'Defensor' : 'Atacante'}
          </p>
          <h1>{level.title}</h1>
        </header>
        {state.phase === 'brief' && <BriefPanel level={level} onStart={() => dispatch({ type: 'start' })} />}
        {state.phase === 'predict' && <PredictPanel level={level} onPredict={(point) => dispatch({ type: 'predict', point })} />}
        {state.phase === 'act' && (
          <>
            <p className="objective">{level.brief}</p>
            {objective.kind === 'attacker' ? (
              <AttackComposer objective={objective} attempts={state.attempts} onLaunch={(attack) => dispatch({ type: 'launch', attack })} />
            ) : (
              <DefenderPanel
                level={level}
                network={state.network}
                onApply={(action) => dispatch({ type: 'apply', action })}
                onLaunch={() => dispatch({ type: 'launch' })}
                onReset={() => dispatch({ type: 'reset' })}
              />
            )}
            <ToolsPanel tools={level.tools} network={state.network} trace={state.lastTrace} />
          </>
        )}
        {state.phase === 'result' && (
          <>
            <ResultPanel state={state} onRetry={() => dispatch({ type: 'retry' })} onHint={() => dispatch({ type: 'showHint' })} />
            {state.lastTrace && <TraceList trace={state.lastTrace} />}
          </>
        )}
      </aside>
    </div>
  );
}
```

`src/ui/shared/Roadmap.tsx`:

```tsx
import { CHAPTERS } from '../../levels/chapters';
import type { Level } from '../../levels/schema';
import { isUnlocked, type Progress } from '../../storage/progress';

function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(3 - count)}
      </span>
      <span className="sr-only">{count} de 3 estrellas</span>
    </span>
  );
}

export function Roadmap({ levels, progress }: { levels: Level[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>Sigue el paquete</h1>
        <p className="lede">Un capítulo por módulo del curso. Cada nivel repasa una lección jugando.</p>
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
                <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : 'Próximamente'}</span>
              </div>
              {own.length > 0 && (
                <ol className="levels">
                  {own.map((level) => {
                    const stars = progress[level.id] ?? 0;
                    const label = `${level.order}. ${level.title}`;
                    return (
                      <li key={level.id} data-level-id={level.id} className="level-item">
                        {isUnlocked(level, progress, own) ? (
                          <a href={`#/level/${level.id}`}>{label}</a>
                        ) : (
                          <span className="locked" aria-disabled="true">
                            {label} (bloqueado)
                          </span>
                        )}
                        <span className="role">{level.role === 'defender' ? 'Defensor' : 'Atacante'}</span>
                        <Stars count={stars} />
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

- [ ] **Step 6: Reemplazar `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { LEVELS, levelById } from './levels/registry';
import { loadProgress, saveStars, type Progress } from './storage/progress';
import { LevelScreen } from './ui/shared/LevelScreen';
import { Roadmap } from './ui/shared/Roadmap';
import { usePrefersReducedMotion } from './ui/shared/usePrefersReducedMotion';

function levelIdFrom(hash: string): string | null {
  const match = /^#\/level\/(\d{2}-\d{2})$/.exec(hash);
  return match ? match[1] : null;
}

export function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const prefersReduced = usePrefersReducedMotion();
  const [skipAnimations, setSkipAnimations] = useState<boolean | null>(null);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const reducedMotion = skipAnimations ?? prefersReduced;
  const levelId = levelIdFrom(hash);
  if (levelId === null) return <Roadmap levels={LEVELS} progress={progress} />;

  const level = levelById(levelId);
  if (!level) {
    return (
      <main className="page">
        <h1>Nivel no encontrado</h1>
        <p>No existe el nivel {levelId}.</p>
        <a href="#/">Volver al roadmap</a>
      </main>
    );
  }

  return (
    <LevelScreen
      key={level.id}
      level={level}
      reducedMotion={reducedMotion}
      onToggleMotion={() => setSkipAnimations(!reducedMotion)}
      onFinish={(stars) => setProgress(saveStars(level.id, stars))}
    />
  );
}
```

- [ ] **Step 7: Reemplazar `src/styles.css`**

```css
:root {
  --paper: #f6f1e7;
  --paper-fill: #fbf8f2;
  --paper-shade: #efe8da;
  --ink: #2b2b2b;
  --ink-soft: #5f5a52;
  --accent: #e4572e;
  --font-display: 'Newsreader', Georgia, serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 .06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--paper) var(--grain); color: var(--ink); font: 16px/1.5 var(--font-body); }
h1 { font: 500 2.25rem/1.1 var(--font-display); margin: 0 0 0.5rem; }
h2 { font: 500 1.4rem/1.2 var(--font-display); margin: 0; }
h3 { font: 600 0.8rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.6rem; }
a { color: var(--ink); text-underline-offset: 3px; }
code, .mono { font-family: var(--font-mono); font-size: 0.875rem; }
.muted { color: var(--ink-soft); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.btn { font: 600 0.95rem var(--font-body); background: var(--paper-fill); color: var(--ink); border: 1.5px solid var(--ink); border-radius: 3px; padding: 0.5rem 0.9rem; cursor: pointer; text-decoration: none; display: inline-block; box-shadow: 2px 2px 0 var(--ink); }
.btn:active { transform: translate(2px, 2px); box-shadow: none; }
.btn--primary { background: var(--accent); color: #fff; }
.btn--small { padding: 0.2rem 0.5rem; font-size: 0.8rem; box-shadow: none; }
.btn--choice { text-align: left; width: 100%; }
.btn:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.card { background: var(--paper-fill); border: 1.5px solid var(--ink); border-radius: 4px; padding: 1rem; box-shadow: 3px 3px 0 var(--ink); margin: 0; }
fieldset.card { display: grid; gap: 0.4rem; }
legend { font-weight: 600; padding: 0 0.3rem; }
.field { display: grid; gap: 0.2rem; margin-bottom: 0.6rem; }
.field label { font-size: 0.85rem; font-weight: 600; }
select { font: 0.9rem var(--font-body); padding: 0.35rem; border: 1.5px solid var(--ink); background: #fff; border-radius: 3px; }
.choices { display: grid; gap: 0.5rem; }
.actions { display: flex; gap: 0.6rem; }
.rules { width: 100%; border-collapse: collapse; margin-bottom: 0.8rem; }
.rules th { text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1.5px solid var(--ink); padding: 0.3rem 0; }
.rules td { border-bottom: 1px dashed var(--ink-soft); padding: 0.35rem 0.3rem 0.35rem 0; }
.terminal { background: var(--ink); color: var(--paper); font: 0.8rem/1.5 var(--font-mono); padding: 0.6rem; border-radius: 3px; white-space: pre-wrap; }
details { margin-bottom: 0.5rem; }
summary { cursor: pointer; font-weight: 600; }

.page { max-width: 880px; margin: 0 auto; padding: 2.5rem 1.5rem; }
.lede { color: var(--ink-soft); font-size: 1.1rem; }
.chapters { list-style: none; padding: 0; display: grid; gap: 0.9rem; }
.chapter { border: 1.5px solid var(--ink); background: var(--paper-fill); padding: 0.9rem 1rem; box-shadow: 3px 3px 0 var(--ink); }
.chapter--soon { opacity: 0.5; box-shadow: none; border-style: dashed; }
.chapter__head { display: flex; align-items: baseline; gap: 0.8rem; }
.chapter__num { font: 500 1.4rem var(--font-display); color: var(--accent); min-width: 1.6rem; }
.chapter__meta { margin-left: auto; font-size: 0.85rem; color: var(--ink-soft); }
.levels { list-style: none; padding: 0.6rem 0 0 2.4rem; margin: 0; display: grid; gap: 0.35rem; }
.level-item { display: flex; gap: 0.8rem; align-items: baseline; }
.level-item .role { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); }
.stars-inline { margin-left: auto; color: var(--accent); }
.locked { color: var(--ink-soft); }

.level { display: grid; grid-template-columns: 1fr 400px; height: 100vh; }
.stage { position: relative; background: var(--paper) var(--grain); }
.side { overflow-y: auto; padding: 1rem 1.2rem 2rem; display: flex; flex-direction: column; gap: 1rem; border-left: 1.5px solid var(--ink); background: var(--paper); }
.side__top { display: flex; justify-content: space-between; font-size: 0.9rem; }
.eyebrow { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); margin: 0; }
.objective { margin: 0; }
.stars { font: 500 1.3rem var(--font-display); margin: 0 0 0.5rem; }
.stars span[aria-hidden] { color: var(--accent); letter-spacing: 0.1em; }
.checklist { list-style: none; padding: 0; margin: 0 0 0.8rem; }
.hints { display: grid; gap: 0.5rem; margin: 0.8rem 0; }
.hint { border-left: 3px solid var(--accent); padding-left: 0.6rem; margin: 0; }
.trace { padding-left: 1.2rem; margin: 0; display: grid; gap: 0.35rem; }
.trace__step--drop, .trace__step--reject { color: var(--accent); font-weight: 600; }
.trace__outcome { font-weight: 600; margin: 0.6rem 0 0; }

.label3d { font: 500 13px var(--font-body); background: var(--paper-fill); border: 1px solid var(--ink); padding: 1px 6px; white-space: nowrap; }
.label3d--mono { font: 12px var(--font-mono); border-style: dashed; }
.label3d--accent { border-color: var(--accent); color: var(--accent); white-space: normal; max-width: 240px; display: block; }
.stamp { font: 700 22px var(--font-display); border: 2.5px solid currentColor; border-radius: 50%; width: 38px; height: 38px; display: grid; place-items: center; transform: rotate(-8deg); background: var(--paper-fill); }
.stamp--pass { color: var(--ink); }
.stamp--drop { color: var(--accent); }
.guard { background: var(--paper-fill); border: 1.5px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); padding: 0.4rem 0.6rem; font-size: 12px; min-width: 260px; }
.guard__title { font-weight: 600; margin: 0 0 0.3rem; text-transform: uppercase; letter-spacing: 0.06em; }
.guard__row { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; margin: 0.15rem 0; }

@media (prefers-reduced-motion: reduce) {
  .btn:active { transform: none; }
}
```

- [ ] **Step 8: Correr los tests de interfaz**

Run: `npx vitest run src/ui src/App.test.tsx`
Expected: PASS (2 de RuleEditor, 1 de AttackComposer, 2 de LevelScreen, 3 de App).

- [ ] **Step 9: Probar en el navegador**

Run: `npm run dev` y abrir la URL que imprime Vite.
Expected: el roadmap muestra 20 capítulos (19 "Próximamente"); el nivel 1 se juega hasta 3 estrellas; el paquete viaja por el mapa y se detiene con sello en la barrera de `servidor2` antes de la regla, y llega a la puerta después. Cortar el servidor con Ctrl+C.

- [ ] **Step 10: Verificar todo lo unitario**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: sin errores; todos los tests PASS.

- [ ] **Step 11: Commit**

```bash
git add projects/follow-the-packet/src
git commit -m "feat(ui): add roadmap, level flow, defender and attacker panels"
```

---

### Task 12: Partida completa en navegador real y entrega

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/game.spec.ts`, `README.md` (del proyecto)
- Modify (raíz del repo): `README.md` (sección "Mapa")

**Interfaces:**
- Consumes: la aplicación completa (tareas 1-11).

- [ ] **Step 1: Escribir la configuración de Playwright**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    // WebGL por software para que el canvas funcione en modo headless.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Escribir las pruebas de punta a punta**

`tests/e2e/game.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // Las fuentes de Google pueden fallar sin red; no es un error del juego.
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function winLevel1(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /¿Dónde muere el ping\?/ }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'En la barrera de servidor2 (su SG de entrada)' }).click();
  await page.getByLabel('Qué').selectOption({ label: 'ICMP · Echo Request ("Repetir solicitud")' });
  await page.getByLabel('Desde dónde').selectOption({ label: 'SG servidor1' });
  await page.getByRole('button', { name: 'Agregar regla' }).click();
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
}

test('nivel 1 de punta a punta, con 3 estrellas', async ({ page }) => {
  const errors = collectErrors(page);
  await winLevel1(page);
  await expect(page.getByText('3 de 3 estrellas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('el progreso sobrevive a recargar', async ({ page }) => {
  await winLevel1(page);
  await expect(page.getByText('3 de 3 estrellas')).toBeVisible();
  await page.goto('/#/');
  await page.reload();
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText('3 de 3 estrellas');
  await expect(page.locator('li[data-level-id="04-02"] a')).toBeVisible();
});

test('cada nivel carga sin errores y deja una captura para revisar', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  const ids = await page.locator('li[data-level-id]').evaluateAll((items) => items.map((item) => item.getAttribute('data-level-id') ?? ''));
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    await page.goto(`/#/level/${id}`);
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/levels/${id}.png` });
  }
  expect(errors).toEqual([]);
});
```

- [ ] **Step 3: Correr y ver que pasan**

Run: `npm run e2e`
Expected: 3 tests PASS y 7 capturas en `test-results/levels/`. Si el canvas no aparece en headless, copiar el error exacto antes de cambiar nada.

- [ ] **Step 4: Escribir `README.md` del proyecto**

```markdown
# Sigue el paquete

Juego para estudiar redes en AWS: predices dónde muere un paquete, lo ves viajar y arreglas (o atacas) la configuración. Un capítulo por módulo del curso; el capítulo 4 tiene 7 niveles de Security Groups basados en el [lab 03](https://github.com/angelozdev/aws-commit-academy/blob/main/labs/03-ping-connectivity/README.md).

Diseño: [spec](../../docs/specs/2026-10-07-follow-the-packet-design.md) · Plan: [plan](../../docs/plans/2026-10-07-follow-the-packet.md)

## Correr

```bash
npm install
npx playwright install chromium
npm run dev
```

## Validar

```bash
npm run check
```

Corre tipos, lint, tests unitarios y Playwright. "Listo" significa que pasó entero.

## Agregar un nivel

1. Crea `src/levels/NN-<capítulo>/NN-<slug>.ts` con `export default defineLevel({...})`. Usa un nivel existente como modelo.
2. `lesson` debe ser el texto exacto de su lección en `syllabus.md`, y `concept` una nota que exista en `concepts/`.
3. Corre `npm test`: los tests por nivel comprueban que arranca roto, que la solución gana con 3 estrellas, que la predicción coincide con el motor y que la solución solo usa opciones del nivel.
```

- [ ] **Step 5: Enlazar el juego en el `README.md` raíz**

En la sección "Mapa", reemplazar la línea de `projects/`:

```markdown
- [projects/](projects/): portafolio y otros proyectos. Juego de estudio: [Sigue el paquete](projects/follow-the-packet/README.md).
```

Y desde la raíz del repo correr el chequeo de links de `CLAUDE.md`:

```bash
setopt nullglob 2>/dev/null; broken=$(for f in README.md syllabus.md artifacts/README.md labs/*/README.md exercises/*/README.md concepts/*.md projects/*/README.md; do [ -f "$f" ] || continue; d=$(dirname "$f"); grep -oE '\]\([^)#]+' "$f" | sed 's/^](//' | grep -vE '^(https?:|mailto:)' | while read -r l; do [ -e "$d/$l" ] || echo "ROTO: $f -> $l"; done; done); [ -z "$broken" ] && echo "LINKS OK" || echo "$broken"
```

Expected: `LINKS OK`.

- [ ] **Step 6: Validación completa**

Run (en `projects/follow-the-packet/`): `npm run check`
Expected: tipos, lint, unitarios y Playwright PASS. Guardar la salida para mostrársela al estudiante.

- [ ] **Step 7: Commit**

```bash
git add projects/follow-the-packet README.md
git commit -m "test(game): add end-to-end game tests and project README"
```

---

### Task 13: Revisión final independiente

**Files:** ninguno (revisión).

- [ ] **Step 1: Lanzar la revisión de Codex en segundo plano**

Según las reglas globales: agente `codex:codex-rescue`, solo lectura, con `--model gpt-6.1-sol --effort xhigh` (entrega grande), sobre el diff de `feat/follow-the-packet` contra `main`. Foco: fidelidad del motor a AWS (SG solo permite, stateful, SG como origen solo por IP privada, NAT por IP pública, DNS dividido), niveles imposibles o triviales, y fugas de React (bucles de efectos, estado obsoleto).

- [ ] **Step 2: Verificar cada hallazgo**

Para cada hallazgo: reproducirlo con un test o descartarlo con evidencia. Aplicar solo los confirmados (con su test) y volver a correr `npm run check`. Informar al estudiante qué falsos positivos se descartaron y por qué. Si Codex falla o no tiene cuota, hacer la revisión con un subagente Sonnet y decirlo.

- [ ] **Step 3: Cierre**

Mostrar al estudiante la salida de `npm run check`, proponer el commit final y el `git push` (solo con su aprobación), y sugerir `/clear`.
