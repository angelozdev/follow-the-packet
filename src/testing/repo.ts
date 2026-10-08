import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

export function readSyllabus(): string {
  return readFileSync(resolve(REPO_ROOT, 'syllabus.md'), 'utf8');
}

/** Returns the "## N. Title" headings of the repository's syllabus.md. */
export function syllabusChapters(text = readSyllabus()): { number: number; title: string }[] {
  return [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ number: Number(m[1]), title: m[2].trim() }));
}

/** Returns the lesson names of syllabus.md lines, without " · verificada" or the links after "→". */
export function syllabusLessons(text = readSyllabus()): Set<string> {
  return new Set([...text.matchAll(/^- \[[ x]\] (.+?)(?: · verificada)?(?: → .*)?$/gm)].map((m) => m[1].trim()));
}
