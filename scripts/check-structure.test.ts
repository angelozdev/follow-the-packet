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
