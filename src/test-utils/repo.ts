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
