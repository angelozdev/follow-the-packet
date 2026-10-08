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
