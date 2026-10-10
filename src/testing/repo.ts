import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const CHAPTERS_DOC = 'docs/research/2026-10-09-follow-the-packet-chapters.md';
const OPTIONAL_MARK = ' (opcional)';

export function readSyllabus(): string {
  return readFileSync(resolve(REPO_ROOT, 'syllabus.md'), 'utf8');
}

/** Returns the "## N. Title" headings of the repository's syllabus.md. */
export function syllabusChapters(text = readSyllabus()): { number: number; title: string }[] {
  return [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ number: Number(m[1]), title: m[2].trim() }));
}

export function readChaptersDoc(): string {
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

/** Returns the lesson names of syllabus.md lines, without " · verificada" or the links after "→". */
export function syllabusLessons(text = readSyllabus()): Set<string> {
  return new Set([...text.matchAll(/^- \[[ x]\] (.+?)(?: · verificada)?(?: → .*)?$/gm)].map((m) => m[1].trim()));
}
