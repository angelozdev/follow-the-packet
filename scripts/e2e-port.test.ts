import { mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { E2E_PORT_COUNT, FIRST_E2E_PORT, e2ePort, e2ePortOf } from './e2e-port';

const LAST_E2E_PORT = FIRST_E2E_PORT + E2E_PORT_COUNT - 1;
const STUDENT_PORTS = [5173, 5180];
const MAIN_TREE = '/Users/angelozdev/me/AWS Commit Academy/projects/follow-the-packet';
const CHAPTER_2_TREE = '/Users/angelozdev/me/aws-commit-academy-chapter-2/projects/follow-the-packet';
const SAMPLE_COUNT = 2000;
const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => `/Users/angelozdev/me/worktree-${index}/projects/follow-the-packet`);

describe('e2ePort', () => {
  it('the port of the e2e server is derived from the path of the repo and stays in 4183-4282', () => {
    expect(FIRST_E2E_PORT).toBe(4183);
    expect(LAST_E2E_PORT).toBe(4282);
    for (const path of [...samples, MAIN_TREE, CHAPTER_2_TREE, '', '/']) {
      const port = e2ePort(path);
      expect(Number.isInteger(port), path).toBe(true);
      expect(port, path).toBeGreaterThanOrEqual(FIRST_E2E_PORT);
      expect(port, path).toBeLessThanOrEqual(LAST_E2E_PORT);
    }
  });

  it('the same path always gives the same port', () => {
    for (const path of [MAIN_TREE, CHAPTER_2_TREE, ...samples.slice(0, 50)]) expect(e2ePort(path)).toBe(e2ePort(path));
  });

  it('the port is never 5173 or 5180', () => {
    const ports = new Set([...samples, MAIN_TREE, CHAPTER_2_TREE].map(e2ePort));
    for (const port of STUDENT_PORTS) expect(ports.has(port)).toBe(false);
  });

  it('the main tree and the worktree of chapter 2 get different ports, so they can run their suites at once', () => {
    expect(e2ePort(MAIN_TREE)).not.toBe(e2ePort(CHAPTER_2_TREE));
  });

  it('the paths spread over the whole range', () => {
    expect(new Set(samples.map(e2ePort)).size).toBe(E2E_PORT_COUNT);
  });
});

describe('e2ePortOf', () => {
  it('gives a link to a folder the same port as the folder', () => {
    const real = mkdtempSync(join(tmpdir(), 'e2e-port-'));
    const link = join(mkdtempSync(join(tmpdir(), 'e2e-port-link-')), 'project');
    symlinkSync(real, link);
    expect(e2ePortOf(link)).toBe(e2ePortOf(real));
  });
});
