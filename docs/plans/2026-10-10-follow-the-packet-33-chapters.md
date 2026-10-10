# Sigue el paquete · Temario de 33 capítulos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el roadmap del juego deje de copiar los 20 módulos del curso y muestre los 33 capítulos del juego, agrupados por nivel, tal como los corta el documento de capítulos. Lo pidió el estudiante (2026-10-10): «Cambia todo el temario del juego para que muestre los 33 caps».

**Architecture:**
1. **Los datos.** `CHAPTERS` (`src/levels/chapters.ts`) pasa a los 33 capítulos del juego: número (el orden del juego), nivel, título, los módulos del curso que juega (puede no haber ninguno) y si es opcional (solo el 24). Un arreglo nuevo, `TIERS`, guarda los cinco niveles (0 Bases a 4 Especialista). Un test compara los dos con el documento de capítulos, que pasa a ser la fuente: si el documento y el juego se separan, falla.
2. **Lo que no cambia.** Los capítulos 1 y 4 conservan su número, sus ids de incidente, sus carpetas (`src/levels/01-first-day/`, `src/levels/04-iaas/`) y el progreso guardado, que se guarda por id de incidente. Solo cambian sus títulos: «Tu primer día» y «La noche de guardia».
3. **La pantalla.** El roadmap agrupa los capítulos por nivel, cada grupo con su encabezado («Nivel 0 · Bases»). El encabezado es la leyenda de siempre (`caption`), el capítulo sigue siendo un `Card` y el 24 lleva la marca «Opcional» con la leyenda suave del rol. No hay componente ni regla CSS nueva: una sola declaración (`margin`) en la regla que ya existe, `.chapters`.

**Tech Stack:** Vite 8.3.3, TypeScript 6.0.3 (con `lib` ES2022), React 19.3, Vitest 5.0.3, Testing Library, Playwright 1.64. Sin dependencias nuevas: `pnpm-lock.yaml` no cambia.

**Spec:** [`docs/research/2026-10-09-follow-the-packet-chapters.md`](../research/2026-10-09-follow-the-packet-chapters.md): la sección 2 (el mapa de capítulos: número, nivel, título, qué viaja y módulos del curso), la 4 (lo que queda fuera: MLOps y CAF; el 24 opcional) y la 5 (encaje con lo que ya existe). Aprobado tal cual por el estudiante el 2026-10-10.

## Global Constraints

- **Rutas.** Todas son relativas a `projects/follow-the-packet/`, salvo las que empiezan por `docs/` o `../../` (raíz del repo). Todos los comandos se corren desde `projects/follow-the-packet/`.
- **Punto de partida verificado (2026-10-10, `19237fb`, `main`):** `pnpm check` pasa entero, con **738 tests de Vitest en 51 archivos**, 22 tests de Playwright y `Found 0 clones`. Al cerrar la Tarea 1: 741 en 51 (Playwright, 22). Al cerrar la Tarea 2: 743 en 51 (Playwright, 23).
- **Plan ensayado.** Las dos tareas se implementaron primero a mano sobre `19237fb`, con un commit cada una; los bloques de este documento salen de esos commits. Con las decisiones 11 y 12 del estudiante ya escritas (2026-10-10), el plan se aplicó tal cual, sin tocar nada a mano, sobre dos copias limpias de `19237fb`. En las dos, al cerrar cada tarea `pnpm check` pasó entero con los números de arriba, `golden-traces.json` y las capturas no cambiaron, y los commits quedaron con los mismos árboles (Tarea 1: `8cc6280`; Tarea 2: `1923f71`).
- **Reglas.** Valen todas las de `.claude/rules/` y el `CLAUDE.md` de cada carpeta. Las que más pesan aquí:
  - `folder-structure`: ningún archivo nuevo. `src/levels/` sigue con 12 archivos (el tope); `src/testing/` con 5 y `src/ui/` con 11.
  - `english-only` y `no-comments`: código, tests, guías y mensajes de commit en inglés; solo JSDoc. El texto visible nuevo vive en `src/copy/ui.ts` (`ROADMAP_TEXT`); los títulos de capítulo y los nombres de nivel son contenido y viven en `src/levels/chapters.ts`, como hoy los títulos.
  - `rigorous-plain-copy`: ver la decisión 11.
  - `dry`: jscpd con umbral 0 (`pnpm dup`).
  - Un estándar por elemento (`DESIGN.md`): el encabezado de nivel es la leyenda (`caption`), el capítulo es `Card`, la marca «Opcional» es `caption caption--soft`. Nada de un componente o una clase nueva.
- **El capítulo 4 no cambia lo que calcula ni lo que dice.** `src/levels/04-iaas/golden-traces.json` no se edita nunca: prohibido `vitest -u`, `--update` y editarlo a mano. Cada tarea lo comprueba con `git diff --exit-code src/levels/04-iaas/golden-traces.json`. Ningún texto de un incidente cambia.
- **Capturas.** Las dos capturas de `#/entidades` (`tests/e2e/snapshots/entities-darwin.png` e `interface-darwin.png`) no se regraban: ninguna tarea toca lo que muestran, y deben pasar tal cual.
- **Scripts de edición.** Los cambios en archivos que ya existen llegan como scripts de Python 3 que se pegan tal cual en la terminal (`python3 - <<'EOF' … EOF`). Cada reemplazo exige encontrar exactamente una vez el texto viejo y, si no, el script se detiene con `expected 1 match`. Si eso pasa, el árbol no es el que el plan supone: se para y se avisa, sin arreglar a mano. Un archivo que cambia entero llega como «Contenido completo de `ruta`»: se escribe tal cual.
- **"Listo"** = `pnpm check` pasa entero (tipos, lint, estructura, jscpd, Vitest y Playwright). Cada tarea termina con `pnpm check` en verde.
- **Commits.** Un commit por tarea, con `git add` de las rutas exactas que la tarea lista (nunca `git add .`: otras sesiones trabajan en el mismo árbol). El mensaje termina con una línea en blanco y `Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh` (el segundo `-m`). Nunca se agrega nada de `labs/03-ping-connectivity/`. Sin `git push`.
- **Servidores y puertos.** No se arranca nada en los puertos 5173 y 5180 (el servidor del estudiante). Playwright levanta su propio servidor en el 4183 (`playwright.config.ts`). Si otra sesión usa el 4183 al mismo tiempo, el puerto se cambia solo en local: se edita `playwright.config.ts` (las tres apariciones de `4183`) y se marca con `git update-index --skip-worktree playwright.config.ts`, para que ningún commit lo lleve. El ensayo corrió así en el 4186 y en el 4187.
- Ningún comando `aws`.

## Decisiones (para revisar antes de ejecutar)

Las 1, 2, 11 y 12 son del estudiante. Las marcadas «Decidido sin el estudiante» las tomó quien escribió el plan.

1. **Los 33 capítulos del documento, tal cual.** **Decidido por el estudiante (2026-10-10).** Los capítulos nuevos 2 «Puertos y nombres» y 3 «La web por dentro» van antes del 4. El número es el orden del juego, no el módulo del curso. Los capítulos 1 y 4 conservan su número, sus ids de incidente, sus carpetas y el progreso guardado; sus títulos pasan a los del documento: «Introducción» → «Tu primer día» y «Infraestructura Tradicional y Compute Clásico (IaaS)» → «La noche de guardia».
2. **El alcance de la sección 4.** **Decidido por el estudiante (2026-10-10).** El capítulo 24 «Datos en movimiento» es opcional. MLOps (N2.22) y CAF (N4.10) no tienen capítulo.
3. **En el código, el nivel se llama `tier`.** **Decidido sin el estudiante.** «Level» ya nombra a un incidente en el roadmap y el almacenamiento (`LevelEntry`, `levels`, `.level-item`, `#/level/…`): `chapter.level` junto a `level.chapter` se leería al revés. En pantalla dice «Nivel». `Tier` es `{ number, name }`, `Chapter` es `{ number, tier, title, modules, optional? }`, y `optional` solo aparece en el 24.
4. **Qué módulos del curso juega cada capítulo.** **Decidido sin el estudiante.** Los módulos son los `M<n>` que la columna «Módulos del curso» nombra antes de su primer «;»; lo que sigue es una nota. Así: el 1 juega el 9 («Adelanta M9»; cita el lab 03 del módulo 4, pero no lo juega), el 6 juega el 9 (los módulos 4, 5 y 7 lo necesitan, no lo juegan), el 17 juega el 5, el 7 y el 10, y el 23 no juega ninguno (la clase magistral de Bedrock no es un módulo). Los módulos no se muestran en pantalla: hoy solo los leen los tests.
5. **El documento es la fuente de los capítulos.** **Decidido sin el estudiante.** El test que comparaba `CHAPTERS` con los títulos de `syllabus.md` pasa a compararlo con la tabla de la sección 2 del documento (número, nivel, título, opcional y módulos) y `TIERS` con sus encabezados «Nivel N · Nombre». Con `syllabus.md` quedan dos tests: los módulos que nombra un capítulo existen, y cada módulo del curso salvo el 1 (Introducción) se juega en algún capítulo. Los lectores viven en `src/testing/repo.ts`, junto a los de `syllabus.md`.
6. **El encabezado de nivel es un `h2` con la clase `caption`.** **Decidido sin el estudiante.** `DESIGN.md` dice que la leyenda es «el encabezado de una lista», y un nivel encabeza la lista de sus capítulos. Es `h2` porque un `h3` justo después del `h1` saltaría un nivel de encabezado; los títulos de capítulo siguen siendo `h2` (un `h3` se vería como leyenda). Cada nivel es un `section` con `aria-labelledby`: el lector de pantalla lo anuncia como una región con el nombre del nivel.
7. **Separación entre niveles.** **Decidido sin el estudiante.** La regla `.chapters` suma `margin: var(--space-xs) 0 var(--space-2xl)`: 8 px entre el encabezado y su primer capítulo, 40 px entre el último capítulo de un nivel y el encabezado siguiente. Con los márgenes por defecto de la lista quedaban 16 px arriba y abajo, y el encabezado no se veía de ningún grupo. No es una regla nueva: es una declaración en la regla de la lista.
8. **La marca «Opcional» va dentro del título.** **Decidido sin el estudiante.** Es `<span className="caption caption--soft">`, la leyenda suave del rol («Defensor»). Va dentro del `h2`, después de un espacio: como hermana del título, a 390 px de ancho la fila del 24 no podía encoger y ensanchaba todo el nivel 2 (11 px de scroll horizontal, medido en el primer ensayo). Dentro del título se parte con él. El lector de pantalla lee «Datos en movimiento Opcional».
9. **La entrada del roadmap.** **Decidido sin el estudiante.** «Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.» → «Los capítulos van de cero a especialista en AWS, nivel por nivel. Termina cada incidente para abrir el siguiente.» La primera frase dice lo que hay en la página sin contar capítulos ni niveles (un número escrito en el texto se desfasaría); la segunda dice la regla de desbloqueo con el verbo del aviso de bloqueo («termina antes el incidente anterior»). No nombra términos de la escalera.
10. **La regla de la lección se queda como está (I1).** **Decidido sin el estudiante.** El test «cites a lesson of syllabus.md and a concept note that exists» sigue igual: los seis incidentes que existen la cumplen. El choque con los capítulos sin lección (3, 17, 20, 24 y del 25 en adelante) queda anotado en el backlog como I1, para decidirlo cuando uno de ellos tenga su primer incidente.
11. **Un título del roadmap puede nombrar un término sin definirlo.** **Decidido por el estudiante (2026-10-10).** «La VPC por dentro», «DynamoDB por dentro», «Kubernetes en EKS» y otros nombran términos antes de su capítulo. Ningún test lee los títulos de capítulo: la escalera de términos (`src/levels/ladder.test.ts`, `src/game/view/ladder.test.ts`) lee los textos de los incidentes, las piezas y las fichas, y los títulos son texto plano, sin etiquetas `{{…}}`. Pero `rigorous-plain-copy` pide «define every term where it appears». Ya pasaba con los títulos del curso («Almacenamiento con S3 y CloudFront», «Kubernetes en AWS (EKS)»). La Tarea 1 suma una línea a la regla: un título del roadmap es un índice, no una lección; puede nombrar el término oficial que enseña su capítulo sin etiquetarlo ni definirlo, y los incidentes de ese capítulo lo presentan y lo definen; nunca usa un sustituto.
12. **Las tarjetas «Próximamente» siguen desvanecidas (I2).** **Decidido por el estudiante (2026-10-10): A, se queda el desvanecido** («me gustan que estén con opacidad»). Con este plan, 31 de las 33 tarjetas usan la variante `soon` de `Card`, que se desvanece entera con `opacity: 0.5`. Medido sobre el papel de la página, el número en bermellón queda en 2.25:1, el título en 2.98:1 y «Próximamente» en 2.21:1 (sin desvanecer serían 5.26, 13.36 y 6.45). Es contenido inactivo: un capítulo que aún no se abre. La Tarea 1 lo anota en `DESIGN.md` («Contrast»: «Faded on purpose», con las cifras y la fecha, en lugar de «near 2:1») y en la guía de `src/design/`, para que ningún agente lo «arregle» después; el backlog lo registra como I2, decidido. Ningún estilo cambia.
13. **La prueba del roadmap busca por texto y por región, no por clase.** **Decidido sin el estudiante.** `roadmap.spec.ts` contaba `li.card--soon` (18). Ahora cuenta el texto «Próximamente» (31) y busca cada nivel por su región con nombre, como lo vería un jugador; una clase del design system puede cambiar sin que cambie lo que se ve. Suma una prueba a 390 px: el roadmap no tiene scroll horizontal (decisión 8).
14. **«Course order» pasa a «game order».** **Decidido sin el estudiante.** El nombre del test de registro, el JSDoc de `world.ts` y de `isUnlocked` y la guía de `src/storage/` decían que los incidentes van «en el orden del curso». Ahora es el orden del juego. Ninguna lógica cambia: `INCIDENTS` se ordena por número de capítulo y orden, y los capítulos 2 y 3 no tienen incidentes, así que el 04-01 se sigue abriendo después del 01-04.
15. **El README deja de decir «AWS networking».** **Decidido sin el estudiante.** Los 33 capítulos van de redes a IAM, bases de datos, serverless, CI/CD e IA: «A study game about AWS networking» pasa a «A study game about AWS».

## Cambios visibles

Todos en el roadmap (`#/`). Los incidentes, `#/entidades` y sus dos capturas no cambian.

| Tarea | Dónde | Antes → después | Por qué |
|-------|-------|-----------------|---------|
| 1 | Lista de capítulos | 20 tarjetas (los módulos del curso) → 33 (los capítulos del juego), en el orden del juego | Decisión 1 |
| 1 | Capítulo 1 | «Introducción» → «Tu primer día» (sus cuatro incidentes y su progreso, igual) | Decisión 1 |
| 1 | Capítulo 4 | «Infraestructura Tradicional y Compute Clásico (IaaS)» → «La noche de guardia» (el 04-01 y el 04-02, igual) | Decisión 1 |
| 1 | Capítulos 2 y 3 | «Fundamentos de Cloud Computing y AWS», «Introducción a AWS» → «Puertos y nombres», «La web por dentro» | Decisión 1 |
| 1 | Capítulos 5 a 20 | Títulos de los módulos 5 a 20 → títulos del documento (5 «Tu cuenta de AWS» a 20 «Proteger la app») | Decisión 1 |
| 1 | Capítulos 21 a 33 | No existían → 13 tarjetas «Próximamente» más | Decisión 1 |
| 1 | Tarjetas «Próximamente» | 18 → 31, con el mismo desvanecido | Decisiones 1 y 12 |
| 2 | Encabezados de nivel | No había → cinco leyendas en tinta: «NIVEL 0 · BASES», «NIVEL 1 · FUNDAMENTOS», «NIVEL 2 · ASOCIADO», «NIVEL 3 · PROFESIONAL», «NIVEL 4 · ESPECIALISTA» | Decisión 6 |
| 2 | Separación | Entre la entrada y la primera tarjeta, 18 px → entre la entrada y «NIVEL 0 · BASES», 18 px, y 8 px hasta la primera tarjeta; entre niveles, 40 px; entre tarjetas de un nivel, 16 px como hoy; debajo de la última tarjeta, 16 → 40 px más el relleno de la página | Decisión 7 |
| 2 | Capítulo 24 | «Datos en movimiento» → «Datos en movimiento OPCIONAL», con la leyenda suave dentro del título | Decisión 8 |
| 2 | Entrada | «Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.» → «Los capítulos van de cero a especialista en AWS, nivel por nivel. Termina cada incidente para abrir el siguiente.» (a 1280 px ocupa dos líneas) | Decisión 9 |

## Review Focus

1. **El documento y el juego se separan.** Si alguien edita la tabla de la sección 2 del documento (un título, una columna, un `|` dentro de una celda), `chapters.test.ts` falla. Es lo que se busca: el fallo dice que el documento y el juego ya no dicen lo mismo, y se arregla en los dos, nunca saltándose el test. Test: Tarea 1 (`match the chapter map of the chapters doc, in game order`).
2. **El progreso guardado sobrevive.** Un jugador que ya ganó el capítulo 1 o el 04-01 sigue viendo sus estrellas: el progreso se guarda por id y ningún id cambia. Tests sin cambios: Playwright `04-01 and 04-02 reach 3 stars, and the progress survives a reload` y `04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it`.
3. **El desbloqueo cruza capítulos vacíos.** Los capítulos 2 y 3 no tienen incidentes: el 04-01 se abre cuando el 01-04 tiene una estrella, como antes. Test sin cambios: Playwright `chapter 1 is played from 01-01 to 01-04, each incident opening the next, with 3 stars each`.
4. **El lector de pantalla recorre los niveles.** Encabezados en orden (`h1`, luego el `h2` de cada nivel y los `h2` de sus capítulos) y una región con nombre por nivel. Tests: Tarea 2 (`groups the chapters under a heading per level, in game order`; Playwright `the roadmap loads every chapter, grouped by level, without console errors`).
5. **Un teléfono.** A 390 px ningún título, marca ni «Próximamente» ensancha la página. Test: Tarea 2 (Playwright `the roadmap fits a phone screen, without a horizontal scroll`), que falla con la marca fuera del título (decisión 8).

## Árbol al terminar (solo lo cambiado)

```
README.md  DESIGN.md
.claude/rules/  rigorous-plain-copy.md
src/           styles.css
│   copy/      ui.ts
│   design/    CLAUDE.md
│   levels/    CLAUDE.md chapters.ts chapters.test.ts index.ts registry.test.ts world.ts
│   │   01-first-day/  CLAUDE.md
│   │   04-iaas/       CLAUDE.md
│   storage/   CLAUDE.md progress.ts
│   testing/   CLAUDE.md index.ts repo.ts
│   ui/        CLAUDE.md roadmap.tsx roadmap.test.tsx
tests/e2e/     roadmap.spec.ts
docs/research/2026-10-09-follow-the-packet-chapters.md
docs/plans/2026-10-08-follow-the-packet-followups.md
docs/plans/follow-the-packet-roadmap.md
```

---

### Task 1: Los 33 capítulos del juego como datos

`CHAPTERS` deja de copiar los módulos del curso y pasa a los 33 capítulos del documento, con su nivel, su título, sus módulos del curso y si es opcional; `TIERS` guarda los cinco niveles. Un test los compara con el documento. El roadmap todavía no agrupa: muestra los 33 en una sola lista, con los títulos nuevos. La documentación que habla de «un capítulo por módulo» cambia aquí, el documento de capítulos queda aprobado, la regla de copia suma la línea de los títulos (decisión 11), `DESIGN.md` y la guía de `src/design/` anotan el desvanecido de las tarjetas «Próximamente» como decisión del estudiante (decisión 12), y el backlog anota I1 (abierto) e I2 (decidido).

**Files:**
- Modify: `src/levels/chapters.ts` (contenido completo), `src/levels/index.ts`, `src/levels/world.ts`, `src/levels/CLAUDE.md`, `src/levels/01-first-day/CLAUDE.md`, `src/levels/04-iaas/CLAUDE.md`, `src/testing/repo.ts`, `src/testing/index.ts`, `src/testing/CLAUDE.md`, `src/storage/progress.ts`, `src/storage/CLAUDE.md`, `.claude/rules/rigorous-plain-copy.md`, `DESIGN.md`, `src/design/CLAUDE.md`, `README.md`, `../../docs/research/2026-10-09-follow-the-packet-chapters.md`, `../../docs/plans/2026-10-08-follow-the-packet-followups.md`
- Test: `src/levels/chapters.test.ts` (contenido completo), `src/levels/registry.test.ts`, `tests/e2e/roadmap.spec.ts`

**Interfaces:**
- Consumes: `syllabusChapters()` y `REPO_ROOT` de `src/testing/repo.ts`; la tabla de la sección 2 y los encabezados `### Nivel N · Nombre` de la sección 3 del documento de capítulos.
- Produces:
  - En `@/levels`: `TIERS: Tier[]` y `CHAPTERS: Chapter[]`, con `interface Tier { number: number; name: string }` e `interface Chapter { number: number; tier: number; title: string; modules: number[]; optional?: boolean }`.
  - En `@/testing`: `docChapters(text?)`, que devuelve `{ number, tier, title, modules, optional }[]`, y `docTiers(text?)`, que devuelve `{ number, name }[]`.

- [ ] **Step 1: Comprobar el punto de partida**

```bash
git status --short
git log --oneline -1
pnpm exec vitest run
```

Expected: `git status` no muestra nada bajo `projects/follow-the-packet/` ni en los tres documentos de `docs/` que este plan toca; solo, si todavía no tiene commit, este plan (`../../docs/plans/2026-10-10-follow-the-packet-33-chapters.md`), y lo que otras sesiones tengan fuera de esas rutas. El último commit es `19237fb feat(ui): make the terminal's send button a primary action`, o uno posterior que no toque esas rutas. Vitest: `Test Files  51 passed (51)` y `Tests  738 passed (738)`.

- [ ] **Step 2: Escribir los tests**

El test de capítulos se reescribe entero; los lectores del documento van a `src/testing/repo.ts`, y el test de registro cambia dos nombres: «belongs to a game chapter» y «in game order».

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


Path('src/levels/chapters.test.ts').write_text(
    r"""import { describe, expect, it } from 'vitest';
import { docChapters, docTiers, syllabusChapters } from '@/testing';
import { CHAPTERS, TIERS } from './chapters';

const CHAPTER_COUNT = 33;
const COURSE_INTRODUCTION = 1;

describe('chapters', () => {
  it('match the chapter map of the chapters doc, in game order', () => {
    expect(CHAPTERS.map(({ number, tier, title, modules, optional = false }) => ({ number, tier, title, modules, optional }))).toEqual(docChapters());
  });

  it('there are 33, numbered from 1', () => {
    expect(CHAPTERS.map((chapter) => chapter.number)).toEqual(Array.from({ length: CHAPTER_COUNT }, (_, index) => index + 1));
  });

  it('their levels match the levels of the chapters doc', () => {
    expect(TIERS).toEqual(docTiers());
  });

  it('name only modules of syllabus.md', () => {
    const modules = new Set(syllabusChapters().map((module) => module.number));
    expect(CHAPTERS.flatMap((chapter) => chapter.modules).filter((module) => !modules.has(module))).toEqual([]);
  });

  it('play every course module but the introduction', () => {
    const played = new Set(CHAPTERS.flatMap((chapter) => chapter.modules));
    expect(syllabusChapters().filter((module) => !played.has(module.number)).map((module) => module.number)).toEqual([COURSE_INTRODUCTION]);
  });
});
"""
)


edit(
    'src/testing/repo.ts',
    (
        r"""export const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
""",
        r"""export const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const CHAPTERS_DOC = 'docs/research/2026-10-09-follow-the-packet-chapters.md';
const OPTIONAL_MARK = ' (opcional)';
""",
    ),
    (
        r"""/** Returns the lesson names of syllabus.md lines, without " · verificada" or the links after "→". */""",
        r"""export function readChaptersDoc(): string {
  return readFileSync(resolve(REPO_ROOT, CHAPTERS_DOC), 'utf8');
}

/** Returns the rows of the chapter map of the chapters doc: number, level, title without " (opcional)", whether it is optional, and the course modules its column names before the first ";", sorted (what follows is a note). */
export function docChapters(text = readChaptersDoc()): { number: number; tier: number; title: string; modules: number[]; optional: boolean }[] {
  return [...text.matchAll(/^\| (\d+) \| (\d) \| ([^|]+) \| [^|]+ \| [^|]+ \| ([^|]+) \|/gm)].map((m) => {
    const title = m[3].trim();
    const optional = title.endsWith(OPTIONAL_MARK);
    const modules = [...m[4].split(';')[0].matchAll(/M(\d+)/g)].map((module) => Number(module[1])).sort((a, b) => a - b);
    return { number: Number(m[1]), tier: Number(m[2]), title: optional ? title.slice(0, -OPTIONAL_MARK.length) : title, modules, optional };
  });
}

/** Returns the levels of the chapters doc, from its "### Nivel N · Name" headings. */
export function docTiers(text = readChaptersDoc()): { number: number; name: string }[] {
  return [...text.matchAll(/^### Nivel (\d) · (.+)$/gm)].map((m) => ({ number: Number(m[1]), name: m[2].trim() }));
}

/** Returns the lesson names of syllabus.md lines, without " · verificada" or the links after "→". */""",
    ),
)


edit(
    'src/testing/index.ts',
    (
        r"""export { REPO_ROOT, readSyllabus, syllabusChapters, syllabusLessons } from './repo';""",
        r"""export { REPO_ROOT, docChapters, docTiers, readSyllabus, syllabusChapters, syllabusLessons } from './repo';""",
    ),
)


edit(
    'src/levels/registry.test.ts',
    (
        r"""it('registers the prototype incidents in course order', () => {""",
        r"""it('registers the prototype incidents in game order', () => {""",
    ),
    (
        r"""  it('belongs to a chapter of the syllabus', () => {""",
        r"""  it('belongs to a game chapter', () => {""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 3: Verlos fallar**

```bash
pnpm exec vitest run src/levels/chapters.test.ts src/levels/registry.test.ts
```

Expected: `Test Files  1 failed | 1 passed (2)` y `Tests  5 failed | 37 passed (42)`. Fallan los cinco de `chapters.test.ts`: los dos primeros porque `CHAPTERS` tiene 20 capítulos y no 33, el tercero con `expected undefined to deeply equal [ { number: +0, name: 'Bases' }, …(4) ]` (todavía no existe `TIERS`) y los dos últimos porque los capítulos no tienen `modules`.

- [ ] **Step 4: Implementar**

Contenido completo de `src/levels/chapters.ts`:

```ts
export interface Tier {
  number: number;
  name: string;
}

export interface Chapter {
  number: number;
  tier: number;
  title: string;
  modules: number[];
  optional?: boolean;
}

export const TIERS: Tier[] = [
  { number: 0, name: 'Bases' },
  { number: 1, name: 'Fundamentos' },
  { number: 2, name: 'Asociado' },
  { number: 3, name: 'Profesional' },
  { number: 4, name: 'Especialista' },
];

export const CHAPTERS: Chapter[] = [
  { number: 1, tier: 0, title: 'Tu primer día', modules: [9] },
  { number: 2, tier: 0, title: 'Puertos y nombres', modules: [9] },
  { number: 3, tier: 0, title: 'La web por dentro', modules: [] },
  { number: 4, tier: 1, title: 'La noche de guardia', modules: [3, 4] },
  { number: 5, tier: 1, title: 'Tu cuenta de AWS', modules: [2, 3] },
  { number: 6, tier: 2, title: 'La VPC por dentro', modules: [9] },
  { number: 7, tier: 2, title: 'Muchos servidores, una dirección', modules: [4, 5, 9, 10] },
  { number: 8, tier: 2, title: 'Quién puede hacer qué', modules: [6, 17] },
  { number: 9, tier: 2, title: 'El bucket y el borde', modules: [6] },
  { number: 10, tier: 2, title: 'Los datos de la app', modules: [7] },
  { number: 11, tier: 2, title: 'Contenedores', modules: [8] },
  { number: 12, tier: 2, title: 'Conectar redes', modules: [9] },
  { number: 13, tier: 2, title: 'Una API sin servidores', modules: [10, 11] },
  { number: 14, tier: 2, title: 'Mensajes y eventos', modules: [11] },
  { number: 15, tier: 2, title: 'DynamoDB por dentro', modules: [12] },
  { number: 16, tier: 2, title: 'Ver lo que pasa', modules: [10, 16, 17] },
  { number: 17, tier: 2, title: 'Cuando algo cae', modules: [5, 7, 10] },
  { number: 18, tier: 2, title: 'La infraestructura en un archivo', modules: [13] },
  { number: 19, tier: 2, title: 'Del commit a producción', modules: [14, 15] },
  { number: 20, tier: 2, title: 'Proteger la app', modules: [11] },
  { number: 21, tier: 2, title: 'Costos y cuentas', modules: [4, 17] },
  { number: 22, tier: 2, title: 'Kubernetes en EKS', modules: [18, 19] },
  { number: 23, tier: 2, title: 'IA generativa en tu app', modules: [] },
  { number: 24, tier: 2, title: 'Datos en movimiento', modules: [], optional: true },
  { number: 25, tier: 3, title: 'Redes a escala', modules: [] },
  { number: 26, tier: 3, title: 'Una organización, muchas cuentas', modules: [17] },
  { number: 27, tier: 3, title: 'Varias Regiones', modules: [] },
  { number: 28, tier: 3, title: 'La guardia automática', modules: [14, 16] },
  { number: 29, tier: 3, title: 'La mudanza', modules: [10] },
  { number: 30, tier: 3, title: 'IA generativa en producción', modules: [] },
  { number: 31, tier: 3, title: 'Revisión de arquitectura', modules: [10, 20] },
  { number: 32, tier: 4, title: 'La noche del ataque', modules: [] },
  { number: 33, tier: 4, title: 'Redes avanzadas', modules: [] },
];
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
    'src/levels/index.ts',
    (
        r"""export { CHAPTERS } from './chapters';
export type { Chapter } from './chapters';""",
        r"""export { CHAPTERS, TIERS } from './chapters';
export type { Chapter, Tier } from './chapters';""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 5: Verlos pasar**

```bash
pnpm exec vitest run
```

Expected: `Test Files  51 passed (51)` y `Tests  741 passed (741)`.

- [ ] **Step 6: La prueba del roadmap y la documentación**

`roadmap.spec.ts` cuenta 31 capítulos «Próximamente» por su texto, no por la clase `card--soon` (decisión 13). La documentación deja de decir que un capítulo es un módulo del curso; el documento de capítulos queda aprobado; `rigorous-plain-copy` suma la línea de los títulos (decisión 11); `DESIGN.md` («Contrast») y la guía de `src/design/` dicen que el desvanecido de la tarjeta «Próximamente» es decisión del estudiante, con sus cifras (decisión 12); el backlog anota su estado y el bloque I.

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
    'tests/e2e/roadmap.spec.ts',
    (
        r"""const SOON_CHAPTER_COUNT = 18;""",
        r"""const SOON = 'Próximamente';
const SOON_CHAPTER_COUNT = 31;""",
    ),
    (
        r"""  await expect(page.locator('li.card--soon')).toHaveCount(SOON_CHAPTER_COUNT);""",
        r"""  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);""",
    ),
)


edit(
    'src/levels/world.ts',
    (
        r"""Incidents come in course order. */""",
        r"""Incidents come in game order. */""",
    ),
)


edit(
    'src/storage/progress.ts',
    (
        r"""/** True when the incident is the first one in course order,""",
        r"""/** True when the incident is the first one in game order,""",
    ),
)


edit(
    'src/storage/CLAUDE.md',
    (
        r"""when the one right before it in course order has a star""",
        r"""when the one right before it in game order has a star""",
    ),
)


edit(
    'src/levels/CLAUDE.md',
    (
        r"""The course chapters (`chapters.ts`), the incident contract""",
        r"""The game chapters and their levels (`chapters.ts`), the incident contract""",
    ),
    (
        r"""- An incident starts from its chapter's base world""",
        r"""- `CHAPTERS` holds the 33 chapters of `docs/research/2026-10-09-follow-the-packet-chapters.md` in game order, each with its level (`tier`, one of `TIERS`: 0 Bases to 4 Especialista), its title, the course modules it plays (maybe none) and whether it is optional; `chapters.test.ts` checks them against that doc. A chapter's number is its place in the game, not a course module: chapters 1 and 4 keep their numbers, folders and incident ids. In code a level of the roadmap is a tier, because `level` already names an incident (`LevelEntry`, `#/level/…`).
- An incident starts from its chapter's base world""",
    ),
)


edit(
    'src/levels/01-first-day/CLAUDE.md',
    (
        r"""Chapter 1 (Introducción), your first day at the office with Lucía:""",
        r"""Chapter 1, «Tu primer día» (level 0, Bases), your first day at the office with Lucía:""",
    ),
)


edit(
    'src/levels/04-iaas/CLAUDE.md',
    (
        r"""Chapter 4 (IaaS), the night shift:""",
        r"""Chapter 4, «La noche de guardia» (level 1, Fundamentos), the night shift; the folder keeps the name of the course module it was first cut from:""",
    ),
)


edit(
    'src/testing/CLAUDE.md',
    (
        r"""readers for the repository's `syllabus.md` (`repo.ts`)""",
        r"""readers for the repository's `syllabus.md` and for the chapter map and the levels of the chapters doc (`repo.ts`)""",
    ),
)


edit(
    '.claude/rules/rigorous-plain-copy.md',
    (
        r"""- Keep the surrounding copy plain:""",
        r"""- A chapter title on the roadmap is a table of contents, not a lesson: it may name the official term its chapter teaches (`La VPC por dentro`, `Kubernetes en EKS`) before the player meets it, without a tag or a definition; the chapter's incidents introduce and define it. It still uses the official name, never a stand-in.
- Keep the surrounding copy plain:""",
    ),
)


edit(
    'DESIGN.md',
    (
        r"""- **Not covered.** A `soon` card fades all its content with `opacity: 0.5`; its chapter numbers, in vermilion, and its ink text land near 2:1.""",
        r"""- **Faded on purpose.** A `soon` card fades all its content with `opacity: 0.5`, on the student's choice (2026-10-10, «me gustan que estén con opacidad»): it is inactive content, a chapter that does not open yet. Measured on the page's paper, its vermilion number lands at 2.25:1, its ink title at 2.98:1 and «Próximamente» at 2.21:1 (5.26, 13.36 and 6.45 without the fade). Keep the fade: the dashed border, the missing shadow and the word «Próximamente» also mark the state, and raising these ratios is the student's call, not a fix.""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""the `soon` variant holds what is not open yet.""",
        r"""the `soon` variant holds what is not open yet, faded to half on the student's choice (2026-10-10): its low contrast is deliberate (`DESIGN.md`, "Contrast"), so do not raise it.""",
    ),
)


edit(
    'README.md',
    (
        r"""A study game about AWS networking. On screen it is called "Sigue el paquete". One chapter per course module.""",
        r"""A study game about AWS. On screen it is called "Sigue el paquete". It has 33 chapters in five levels, from zero to AWS specialist, as the [chapters doc](../../docs/research/2026-10-09-follow-the-packet-chapters.md) cuts them: a chapter's number is its place in the game, not a course module, and each chapter names the course modules it plays, if any.""",
    ),
    (
        r"""· [design system](../../docs/plans/2026-10-09-follow-the-packet-design-system.md)""",
        r"""· [design system](../../docs/plans/2026-10-09-follow-the-packet-design-system.md) · [33 chapters](../../docs/plans/2026-10-10-follow-the-packet-33-chapters.md)""",
    ),
)


edit(
    '../../docs/research/2026-10-09-follow-the-packet-chapters.md',
    (
        r"""Fecha: 2026-10-09 · Estado: propuesta de alto nivel, para revisión del estudiante.""",
        r"""Fecha: 2026-10-09 · Estado: aprobado por el estudiante el 2026-10-10, tal cual («Cambia todo el temario del juego para que muestre los 33 caps»). El juego lo sigue desde el [plan de los 33 capítulos](../plans/2026-10-10-follow-the-packet-33-chapters.md).""",
    ),
)


edit(
    '../../docs/plans/2026-10-08-follow-the-packet-followups.md',
    (
        r"""

Las ideas y el rumbo del juego van en la [hoja de ruta](follow-the-packet-roadmap.md).""",
        r"""

> **Estado (temario de 33 capítulos, `docs/plans/2026-10-10-follow-the-packet-33-chapters.md`):** `CHAPTERS` y el roadmap pasan a los 33 capítulos del juego. Queda abierto I1 (bloque I); I2 lo decidió el estudiante. Siguen pendientes E4, E8, E9, G2, G9, A1, A2 y H1 a H3.

Las ideas y el rumbo del juego van en la [hoja de ruta](follow-the-packet-roadmap.md).""",
    ),
    (
        r"""

## Fuera de este backlog (decide el estudiante)""",
        r"""

## Bloque I: lo que dejó el temario de 33 capítulos (2026-10-10)

Lo dejó el plan `docs/plans/2026-10-10-follow-the-packet-33-chapters.md`. Ninguno impide jugar los capítulos 1 y 4.

| # | Hallazgo | Destino |
|---|----------|---------|
| I1 | Cada incidente cita una lección de `syllabus.md` (`src/levels/registry.test.ts`, «cites a lesson of syllabus.md and a concept note that exists»). Los capítulos 3, 17, 20, 24 y del 25 en adelante no tienen lección en el curso: su primer incidente no podrá cumplirlo. Hoy lo cumplen los seis incidentes que existen, de los capítulos 1 y 4 | Pendiente: decidirlo cuando uno de esos capítulos tenga su primer incidente (por ejemplo, que la lección sea opcional si el capítulo no nombra módulos del curso, o que cite un tema de la hoja de ruta de AWS) |
| I2 | 31 de los 33 capítulos son «Próximamente» y usan la tarjeta `soon`, que se desvanece entera con `opacity: 0.5`. Medido sobre el papel de la página: el número en bermellón queda en 2.25:1, el título en 2.98:1 y «Próximamente» en 2.21:1, bajo el 4.5:1 de WCAG 1.4.3; sin desvanecer serían 5.26, 13.36 y 6.45 | Decidido por el estudiante (2026-10-10): se queda el desvanecido («me gustan que estén con opacidad»). Es contenido inactivo, un capítulo que aún no se abre. `DESIGN.md` («Contrast») y la guía de `src/design/` lo anotan con sus cifras, para que nadie lo «arregle» |

## Fuera de este backlog (decide el estudiante)""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 7: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones.`, `Test Files  51 passed (51)`, `Tests  741 passed (741)` y `22 passed` en Playwright, con las dos capturas de `#/entidades` sin regrabar.

- [ ] **Step 8: Commit**

```bash
git add README.md DESIGN.md .claude/rules/rigorous-plain-copy.md src/design/CLAUDE.md src/levels/chapters.ts src/levels/chapters.test.ts src/levels/index.ts src/levels/registry.test.ts src/levels/world.ts src/levels/CLAUDE.md src/levels/01-first-day/CLAUDE.md src/levels/04-iaas/CLAUDE.md src/testing/repo.ts src/testing/index.ts src/testing/CLAUDE.md src/storage/progress.ts src/storage/CLAUDE.md tests/e2e/roadmap.spec.ts ../../docs/research/2026-10-09-follow-the-packet-chapters.md ../../docs/plans/2026-10-08-follow-the-packet-followups.md
git commit -m "feat(levels): replace the course modules with the 33 game chapters" -m "Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh"
git status --short
```

Expected: el commit se crea con 20 archivos; `git status` vuelve a mostrar solo lo del Step 1.

---

### Task 2: El roadmap agrupado por nivel

El roadmap muestra un encabezado por nivel («Nivel 0 · Bases»), cada uno con la lista de sus capítulos; el 24 lleva «Opcional» dentro del título y la entrada dice lo que hay en la página. Todo con los primitivos que ya existen: la leyenda (`caption`), `Card` y la leyenda suave del rol. `DESIGN.md`, las guías y la hoja de ruta lo anotan.

**Files:**
- Modify: `src/ui/roadmap.tsx` (contenido completo), `src/copy/ui.ts`, `src/styles.css`, `DESIGN.md`, `src/design/CLAUDE.md`, `src/ui/CLAUDE.md`, `../../docs/plans/follow-the-packet-roadmap.md`
- Test: `src/ui/roadmap.test.tsx`, `tests/e2e/roadmap.spec.ts`

**Interfaces:**
- Consumes: `TIERS`, `CHAPTERS` y el tipo `Chapter` de `@/levels` (Tarea 1); `Card` y `Button` de `@/design`; las clases `caption` y `caption--soft`.
- Produces:
  - En `ROADMAP_TEXT` (`@/copy`): `tier({ number, name })`, que devuelve `Nivel ${number} · ${name}`, y `optional: 'Opcional'`; `lede` cambia de texto.
  - En `Roadmap`: un `section` con `aria-labelledby` por nivel, con un `h2.caption` (`id` `tier-<n>`) y un `ol.chapters`; un componente interno, `ChapterCard`, por capítulo.

- [ ] **Step 1: Escribir los tests**

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
    'src/ui/roadmap.test.tsx',
    (
        r"""import type { LevelEntry } from '@/levels';""",
        r"""import { TIERS, type LevelEntry } from '@/levels';""",
    ),
    (
        r"""const EARNED_STARS = 2;""",
        r"""const EARNED_STARS = 2;
const FUNDAMENTALS = 'Nivel 1 · Fundamentos';""",
    ),
    (
        r"""  it('reads the stars of a level to screen readers', () => {
    render(<Roadmap levels={LEVELS} progress={{ '04-01': EARNED_STARS }} />);
    expect(within(levelItem('04-01')).getByText(ROADMAP_TEXT.starsOf(EARNED_STARS))).toBeTruthy();
  });
});""",
        r"""  it('reads the stars of a level to screen readers', () => {
    render(<Roadmap levels={LEVELS} progress={{ '04-01': EARNED_STARS }} />);
    expect(within(levelItem('04-01')).getByText(ROADMAP_TEXT.starsOf(EARNED_STARS))).toBeTruthy();
  });
});

describe('roadmap of the game chapters', () => {
  it('groups the chapters under a heading per level, in game order', () => {
    render(<Roadmap levels={LEVELS} progress={{}} />);
    expect(screen.getAllByRole('region')).toHaveLength(TIERS.length);
    const headings = within(screen.getByRole('region', { name: FUNDAMENTALS })).getAllByRole('heading');
    expect(headings.map((heading) => heading.textContent)).toEqual([FUNDAMENTALS, 'La noche de guardia', 'Tu cuenta de AWS']);
  });

  it('marks the optional chapter inside its title, and only that one', () => {
    render(<Roadmap levels={LEVELS} progress={{}} />);
    const marks = screen.getAllByText(ROADMAP_TEXT.optional);
    expect(marks).toHaveLength(1);
    expect(marks[0].closest('h2')).toHaveTextContent('Datos en movimiento');
  });
});""",
    ),
)


edit(
    'tests/e2e/roadmap.spec.ts',
    (
        r"""const SOON_CHAPTER_COUNT = 31;""",
        r"""const SOON_CHAPTER_COUNT = 31;
const TIER_HEADINGS = ['Nivel 0 · Bases', 'Nivel 1 · Fundamentos', 'Nivel 2 · Asociado', 'Nivel 3 · Profesional', 'Nivel 4 · Especialista'];
const PHONE = { width: 390, height: 844 };""",
    ),
    (
        r"""test('the roadmap loads every chapter without console errors', async ({ page }) => {""",
        r"""test('the roadmap loads every chapter, grouped by level, without console errors', async ({ page }) => {""",
    ),
    (
        r"""  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);""",
        r"""  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);
  for (const name of TIER_HEADINGS) await expect(page.getByRole('region', { name })).toBeVisible();""",
    ),
    (
        r"""test('an unknown incident leads back to the roadmap', async ({ page }) => {""",
        r"""test('the roadmap fits a phone screen, without a horizontal scroll', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
});

test('an unknown incident leads back to the roadmap', async ({ page }) => {""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 2: Verlos fallar**

```bash
pnpm exec vitest run src/ui/roadmap.test.tsx
```

Expected: `Test Files  1 failed (1)` y `Tests  2 failed | 4 passed (6)`. `groups the chapters under a heading per level, in game order` falla con `Unable to find an accessible element with the role "region"`, y `marks the optional chapter inside its title, and only that one` con `It looks like undefined was passed instead of a matcher` (todavía no existe `ROADMAP_TEXT.optional`).

- [ ] **Step 3: Implementar**

Contenido completo de `src/ui/roadmap.tsx`:

```tsx
import { ROADMAP_TEXT } from '@/copy';
import { Button, Card } from '@/design';
import { CHAPTERS, TIERS, type Chapter, type LevelEntry } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';
import { Stars } from './stars';

function ChapterCard({ chapter, levels, progress }: { chapter: Chapter; levels: LevelEntry[]; progress: Progress }) {
  const own = levels.filter((l) => l.chapter === chapter.number);
  const done = own.filter((l) => (progress[l.id] ?? 0) > 0).length;
  return (
    <Card as="li" variant={own.length > 0 ? 'default' : 'soon'}>
      <div className="chapter__head">
        <span className="chapter__num">{chapter.number}</span>
        <h2>
          {chapter.title}
          {chapter.optional && (
            <>
              {' '}
              <span className="caption caption--soft">{ROADMAP_TEXT.optional}</span>
            </>
          )}
        </h2>
        <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : ROADMAP_TEXT.soon}</span>
      </div>
      {own.length > 0 && (
        <ol className="levels">
          {own.map((level) => {
            const label = `${level.order}. ${level.title}`;
            return (
              <li key={level.id} data-level-id={level.id} className="level-item">
                {isUnlocked(level, progress, levels) ? (
                  <Button variant="text" href={`#/level/${level.id}`}>
                    {label}
                  </Button>
                ) : (
                  <span className="locked" aria-disabled="true">
                    {label} {ROADMAP_TEXT.locked}
                  </span>
                )}
                <span className="caption caption--soft">{ROADMAP_TEXT.role[level.role]}</span>
                <Stars count={progress[level.id] ?? 0} />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function Roadmap({ levels, progress }: { levels: LevelEntry[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>{ROADMAP_TEXT.title}</h1>
        <p className="lede">{ROADMAP_TEXT.lede}</p>
      </header>
      {TIERS.map((tier) => (
        <section key={tier.number} aria-labelledby={`tier-${tier.number}`}>
          <h2 id={`tier-${tier.number}`} className="caption">
            {ROADMAP_TEXT.tier(tier)}
          </h2>
          <ol className="chapters">
            {CHAPTERS.filter((chapter) => chapter.tier === tier.number).map((chapter) => (
              <ChapterCard key={chapter.number} chapter={chapter} levels={levels} progress={progress} />
            ))}
          </ol>
        </section>
      ))}
    </main>
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
    'src/copy/ui.ts',
    (
        r"""  lede: 'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.',
  soon: 'Próximamente',""",
        r"""  lede: 'Los capítulos van de cero a especialista en AWS, nivel por nivel. Termina cada incidente para abrir el siguiente.',
  tier: ({ number, name }: { number: number; name: string }) => `Nivel ${number} · ${name}`,
  optional: 'Opcional',
  soon: 'Próximamente',""",
    ),
)


edit(
    'src/styles.css',
    (
        r""".chapters { list-style: none; padding: 0; display: grid; gap: var(--space-md); }""",
        r""".chapters { list-style: none; padding: 0; margin: var(--space-xs) 0 var(--space-2xl); display: grid; gap: var(--space-md); }""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 4: Verlos pasar**

```bash
pnpm exec vitest run
```

Expected: `Test Files  51 passed (51)` y `Tests  743 passed (743)`.

- [ ] **Step 5: Documentación**

`DESIGN.md` y la guía de `src/design/` dicen que un nivel del roadmap es una leyenda (`h2` con la clase) y que la marca de un capítulo opcional es la leyenda suave; la guía de `src/ui/` describe el roadmap; la hoja de ruta suma la fila de este cambio y actualiza la idea de los capítulos 2 y 3.

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
    'DESIGN.md',
    (
        r"""- **Caption:** the class `caption` (bold, `--text-xs`, uppercase, `--tracking-caps`) for the heading of a list; `caption caption--soft` for the label of a field, a tray or a role. Every `h3` is a caption.""",
        r"""- **Caption:** the class `caption` (bold, `--text-xs`, uppercase, `--tracking-caps`) for the heading of a list; `caption caption--soft` for the label of a field, a tray or a role, and for the mark of an optional chapter. Every `h3` is a caption. A level of the roadmap («Nivel 0 · Bases») heads the list of its chapters, so it is a caption too, written as an `h2` with the class: an `h3` right after the `h1` would skip a heading level.""",
    ),
    (
        r"""| `caption` (class) | `caption`, `caption--soft` | the heading of a list; the label of a field, a tray or a role |""",
        r"""| `caption` (class) | `caption`, `caption--soft` | the heading of a list, a level of the roadmap included; the label of a field, a tray or a role, or the mark of an optional chapter |""",
    ),
)


edit(
    'src/design/CLAUDE.md',
    (
        r"""- A caption is the class `caption` (with `caption--soft` for the label of a field, a tray or a role); every `h3` looks like one.""",
        r"""- A caption is the class `caption` (with `caption--soft` for the label of a field, a tray or a role, or the mark of an optional chapter); every `h3` looks like one, and so does the `h2` of a level of the roadmap.""",
    ),
)


edit(
    'src/ui/CLAUDE.md',
    (
        r"""Screens and panels: the roadmap, the notice page""",
        r"""Screens and panels: the roadmap (the game chapters grouped by level: a caption `h2` per level and a `Card` per chapter), the notice page""",
    ),
)


edit(
    '../../docs/plans/follow-the-packet-roadmap.md',
    (
        r"""

## Siguiente
""",
        r"""
| **Temario de 33 capítulos.** El roadmap deja de copiar los 20 módulos del curso y muestra los 33 capítulos del juego, agrupados en cinco niveles (0 Bases a 4 Especialista), con el 24 opcional. `CHAPTERS` guarda el nivel, el título, los módulos del curso que juega cada capítulo y si es opcional; un test lo compara con el documento de capítulos. Los capítulos 1 y 4 conservan su número, sus carpetas, sus ids y el progreso guardado | El juego va de cero a experto y su orden no es el del curso: los capítulos 2 «Puertos y nombres» y 3 «La web por dentro» van antes del 4 | «Cambia todo el temario del juego para que muestre los 33 caps», 2026-10-10. [Capítulos del juego](../research/2026-10-09-follow-the-packet-chapters.md) | `en curso`: [plan](2026-10-10-follow-the-packet-33-chapters.md). Tareas 1 y 2 hechas; queda I1 en el backlog |

## Siguiente
""",
    ),
    (
        r"""| **Capítulos 2 y 3** | Completar el recorrido del curso entre la introducción y el capítulo 4 | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md) | `idea` |""",
        r"""| **Capítulos 2 «Puertos y nombres» y 3 «La web por dentro»** | Las bases de redes y de la web antes de AWS: puertos, TCP, UDP, CIDR, rutas, NAT, DNS, HTTP y TLS | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md); sus fichas, en los [capítulos del juego](../research/2026-10-09-follow-the-packet-chapters.md), 2026-10-10 | `idea`: ya están en el roadmap como «Próximamente»; falta la investigación de cada uno |""",
    ),
)
EOF
```

Expected: sin salida.

- [ ] **Step 6: Verificar todo**

```bash
git diff --exit-code src/levels/04-iaas/golden-traces.json
pnpm check
```

Expected: `git diff` sin salida; `pnpm check` PASS: `Found 0 clones.`, `Test Files  51 passed (51)`, `Tests  743 passed (743)` y `23 passed` en Playwright (la prueba nueva es `the roadmap fits a phone screen, without a horizontal scroll`), con las dos capturas de `#/entidades` sin regrabar.

- [ ] **Step 7: Commit**

```bash
git add DESIGN.md src/copy/ui.ts src/styles.css src/design/CLAUDE.md src/ui/roadmap.tsx src/ui/roadmap.test.tsx src/ui/CLAUDE.md tests/e2e/roadmap.spec.ts ../../docs/plans/follow-the-packet-roadmap.md
git commit -m "feat(ui): group the roadmap chapters by level, with the optional chapter marked" -m "Claude-Session: https://claude.ai/code/session_01Ce4XnAt6WDkNZzoR4QRWgh"
git status --short
```

Expected: el commit se crea con 9 archivos; `git status` vuelve a mostrar solo lo del Step 1 de la Tarea 1.

---

## Cobertura del pedido

| Pedido | Dónde |
|--------|-------|
| `CHAPTERS` con los 33 capítulos: número, nivel, título, módulos del curso (puede estar vacío) y opcional (24) | Tarea 1 (decisiones 1 a 5) |
| Los capítulos 1 y 4 conservan número, ids, carpetas y progreso; sus títulos pasan a «Tu primer día» y «La noche de guardia» | Tarea 1 (decisión 1); Review Focus 2 y 3 |
| El roadmap muestra los 33 agrupados por nivel, con un encabezado por nivel; el 24 dice que es opcional; los capítulos sin incidentes siguen «Próximamente» | Tarea 2 (decisiones 6 a 8) |
| Una frase nueva en lugar de «Un capítulo por módulo del curso…» | Tarea 2 (decisión 9) |
| Un estándar por elemento: `Card`, la leyenda, los tokens; nada nuevo sin justificar en `DESIGN.md` | Tarea 2 (decisiones 6 a 8; `DESIGN.md`, «Caption» y la tabla de primitivos) |
| «Belongs to a chapter of the syllabus» → «belongs to a game chapter»; la regla de la lección se queda y su choque va al backlog | Tarea 1 (decisión 10; backlog I1) |
| Reglas de copia: si algún test o regla aplica a los títulos y la resolución más chica | Decisión 11 (del estudiante; Tarea 1) |
| README, guías `CLAUDE.md`, hoja de ruta y estado del documento de capítulos | Tarea 1 (README, guías de `levels`, `testing`, `storage` y `design`, documento, backlog); Tarea 2 (guías de `ui` y `design`, `DESIGN.md`, hoja de ruta) |
| Pruebas e2e que buscaban por clase, robustas | Tareas 1 y 2 (decisión 13) |
| El contraste de las tarjetas «Próximamente»: se queda el desvanecido, anotado con sus cifras | Decisión 12 (del estudiante; Tarea 1: `DESIGN.md`, guía de `src/design/` y backlog I2) |

## Capturas del ensayo

A 1280×800, con movimiento reducido («Sin animaciones»; el roadmap no tiene animaciones) y el capítulo 1 hecho con 3 estrellas en cada incidente, sobre la copia que volvió a aplicar el plan tal cual. Están en el scratchpad de la sesión que escribió este plan, `/private/tmp/claude-501/-Users-angelozdev-me-AWS-Commit-Academy/f9ca50bc-62fa-4496-8b80-72423b4cf50b/scratchpad/chapters-shots/`, que es temporal: si se borró, se rehacen con el plan ya ejecutado.

| Archivo | Qué muestra |
|---------|-------------|
| `1-top-levels-0-1.png` | Arriba: la entrada nueva, «NIVEL 0 · BASES» con el capítulo 1 hecho (4/4) y el 2 y el 3 «Próximamente», y «NIVEL 1 · FUNDAMENTOS» con el 4 (0/2) y el 5 |
| `2-middle-level-2-start.png` | En medio: «NIVEL 2 · ASOCIADO» y sus capítulos 6 a 15 |
| `3-middle-level-2-end-optional.png` | En medio: el final del nivel 2 con el 24 «OPCIONAL», y el comienzo del nivel 3 |
| `4-bottom-levels-3-4.png` | Abajo: los niveles 3 y 4, capítulos 25 a 33 |
| `5-phone-390.png` | A 390 px de ancho: los títulos largos se parten en dos o tres líneas y la página no tiene scroll horizontal (decisión 8) |
