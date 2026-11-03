# Plan: mudar «Sigue el paquete» a su propio repo

Fecha: 2026-10-30. Lo decidió el estudiante el 2026-10-30: «yo creo que es mejor separar este proyecto de este repo», al cerrar el bloque 2 del shell B. Ese bloque está cerrado: `796f640`, en `main` y en GitHub.

Aprobado por el estudiante el 2026-11-03, con la opción A de la decisión 4.

Excepción a las rebanadas verticales: esto es una mudanza entre repos, no un comportamiento nuevo. Se comprueba con `pnpm check` en el repo nuevo.

## Decisiones (se aprueban con el plan)

1. **Ruta local:** `/Users/angelozdev/me/follow-the-packet`, que hoy está libre. Su puerto e2e, calculado con `scripts/e2e-port.ts`, es 4193; no es 4183, 5173 ni 5180.
2. **Repo en GitHub:** `angelozdev/follow-the-packet`, privado. El nombre está libre.
3. **Ramas:** una sola, `main`, que sale de la punta de `feat/chapter-3` (es `main` más el commit de este plan). Las otras ramas del juego ya están fusionadas en `main`. `wip/task-19` (un commit, pausada el 2026-10-11 y reemplazada por la 19 bis) no se muda.
4. **El acople con el curso.** Hoy dos tests del juego leen archivos del curso:
   - `src/levels/chapters.test.ts` lee los módulos de `syllabus.md`;
   - `src/levels/registry.test.ts` lee la lección que cita cada incidente en `syllabus.md` y comprueba que exista su nota, `concepts/security-groups.md`.

   El juego no muestra esos datos en pantalla.
   - **A (recomendada y elegida):** una copia de `syllabus.md` y de `concepts/security-groups.md` en `docs/course/`, con un `docs/course/README.md` que dice de dónde salió y su fecha, y los tests leen de ahí. El repo funciona solo, en cualquier máquina o sesión en la nube. Costo: la copia no se actualiza sola. Cuando el juego cite una lección o una nota nueva, se copia otra vez.
   - B: los tests leen el repo del curso en su ruta de esta máquina. Siempre está al día, pero los tests del juego fallan en cualquier otra máquina.

   Con A o con B, cada test sigue comprobando lo mismo. Solo cambia de dónde lee.

## Qué se muda

- **Con su historia**, con `git filter-repo` sobre un clon nuevo, nunca sobre esta copia:
  - `projects/follow-the-packet/` pasa a ser la raíz del repo nuevo (432 commits).
  - `docs/{plans,specs,research}/*follow-the-packet*` (35 archivos, más este plan) y `docs/research/2026-10-09-aws-roadmap-zero-to-expert.md` se quedan en `docs/`. Esa hoja de ruta es del juego: nada del curso la enlaza.
  - Ningún archivo del juego cambió de ruta en la historia, así que no hay renombres que seguir.
- **Sin git**, copiados:
  - Los 17 espacios `.superpowers/sdd/*follow-the-packet*` van a `.superpowers/sdd/` del repo nuevo.
  - 20 memorias van a `~/.claude/projects/-Users-angelozdev-me-follow-the-packet/memory/`, con su `MEMORY.md`:
    - las 10 del juego: `chapter-2-paused-2026-10-12`, `chapter-3-state`, `fixed-ui-shell`, `follow-the-packet-progress-resettable`, `game-explain-every-behavior-change`, `game-explain-to-lucia-no-predictions`, `game-one-human-test-per-chapter`, `game-unique-entity-designs`, `ui-one-standard`, `game-repo-split`;
    - las 10 de forma de trabajo: `orchestrator-not-implementer`, `subagents-no-broad-kill`, `no-code-comments`, `lean-execution-first`, `short-plans-per-block`, `e2e-once-at-block-close`, `visual-choices-as-rendered-prototypes`, `rigor-over-convenience-in-design`, `plain-language`, `one-atomic-question`.

## Pasos

1. **Commit de este plan** en `feat/chapter-3`, para que se mude con el resto.
2. **Clon y filtro** (subagente):
   ```
   git clone --no-local --single-branch --branch feat/chapter-3 "/Users/angelozdev/me/AWS Commit Academy" /Users/angelozdev/me/follow-the-packet
   cd /Users/angelozdev/me/follow-the-packet
   git filter-repo --path projects/follow-the-packet/ --path-glob 'docs/*/*follow-the-packet*' --path docs/research/2026-10-09-aws-roadmap-zero-to-expert.md --path-rename projects/follow-the-packet/:
   git branch -m feat/chapter-3 main
   ```
3. **Ajustes en el repo nuevo**, un commit en la rama `chore/stand-alone` (subagente), que tú fusionas en `main`. Ningún test cambia lo que comprueba:
   - **Copia del curso (decisión 4A):**
     - `src/testing/repo.ts` toma como raíz el repo nuevo y lee `syllabus.md` de `docs/course/`;
     - `registry.test.ts` busca la nota en `docs/course/`;
     - las copias de `docs/course/` salen del commit de `feat/chapter-3` que se clona; el temario cambió el 2026-11-01 (`6098a69`).
   - **Links de Markdown que salían de la carpeta:**
     - `../../docs/` pasa a `docs/`;
     - `../../projects/follow-the-packet/` pasa a `../../`;
     - `../../syllabus.md` pasa a `../course/syllabus.md`;
     - el resto de links al curso (`../../labs/…`) pasan a su URL de GitHub, `https://github.com/angelozdev/aws-commit-academy/blob/main/…`.
   - **Rutas viejas en el texto:** el texto que nombra `projects/follow-the-packet/…` en 30 docs históricos no se reescribe. El README dice que en los docs anteriores a la mudanza (2026-11-03) esa ruta es la raíz.
   - **`.gitignore`:** se suman `.DS_Store` y `.superpowers/`.
   - **Reglas:** `.claude/rules/english-only.md` y `.claude/az-rules.json` dicen «este repo» en vez de `projects/follow-the-packet/`. Los specs, planes e investigaciones siguen en español en `docs/`.
   - **`scripts/e2e-port.test.ts`:** `MAIN_TREE` pasa a ser la ruta nueva.
   - **`CLAUDE.md` nuevo en la raíz:** corto y en inglés. Dice que se habla con el estudiante en español claro, una pregunta por mensaje, y que los planes van a `docs/plans/` y se aprueban con «aprobado» antes de trabajar. Hoy esas reglas vienen del `CLAUDE.md` del curso, que el repo nuevo no lee.
4. **Copias sin git**: los espacios `.superpowers/sdd/` y las 20 memorias.
5. **Verificación**, antes de decir que el repo nuevo está completo:
   - `pnpm install` y `pnpm check` completo una vez, con el e2e en 4193;
   - los commits que no son merge, iguales en los dos repos para las rutas que se mudaron;
   - el árbol de archivos igual al de `projects/follow-the-packet/` más los docs, sin contar lo nuevo del paso 3;
   - el chequeo de links sobre `README.md`, `DESIGN.md` y `docs/{plans,specs,research}`. `docs/course/` queda fuera: es una copia literal y sus links apuntan al curso.
6. **GitHub** (lo haces tú o das el OK):
   ```
   gh repo create angelozdev/follow-the-packet --private --source /Users/angelozdev/me/follow-the-packet --remote origin
   git -C /Users/angelozdev/me/follow-the-packet push -u origin main
   ```
   - `gh repo create … --private` crea el repo privado en tu cuenta.
   - `--source` lo conecta con la carpeta local.
   - `--remote origin` guarda esa conexión con el nombre `origin`.
   - `push -u origin main` sube `main` y deja recordado que `main` sigue a `origin/main`.
7. **Sacar el juego de este repo** (lo haces tú o das el OK), solo después de los pasos 5 y 6:
   - **Rama `chore/move-game-out` desde `main`:**
     - `git rm -r projects/follow-the-packet` y los docs que se mudaron;
     - la línea 12 de `README.md` enlaza el repo nuevo en GitHub, ya no `projects/`, que queda vacío;
     - chequeo de links y commit. Tú fusionas y subes.
   - **Lo que no está en git:** se borran `projects/follow-the-packet/` (`node_modules`, `dist`…) y `.superpowers/sdd/*follow-the-packet*`. Antes paras tu vite de 5180, que corre desde esa carpeta, y lo arrancas desde la ruta nueva.
   - **Memorias de este repo:** se borran las 10 del juego y sus líneas en `MEMORY.md`. Las 10 de forma de trabajo se quedan, porque sirven también al curso.

## Riesgos

- Si `filter-repo` deja fuera alguna ruta, faltan commits o archivos. Lo detecta la comparación del paso 5.
- La copia del curso envejece (decisión 4A).
- Entre el paso 2 y el 7 el juego existe en los dos repos. No se hace ningún commit del juego en la copia vieja.

## Fuera de este plan

- No se borra ninguna rama, ni local ni de GitHub.
- Pendientes del juego, para después de la mudanza:
  - la prueba humana del shell B;
  - el bloque 3 del shell: el menú contextual (`@radix-ui/react-context-menu`, una dependencia nueva que decides tú) y «Aplicar» en los ajustes;
  - replanear las tareas T2–T7 del bloque 3 del capítulo 3 sobre el shell B.
