import { realpathSync } from 'node:fs';

export const FIRST_E2E_PORT = 4183;
export const E2E_PORT_COUNT = 100;

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const ENCODER = new TextEncoder();

/** Returns the port the e2e server of a checkout listens on, from 4183 to 4282, from the path of its repo: the same path gives the same port and two worktrees get ports that are almost always different, so they can run their suites at once. The range holds neither 5173 nor 5180, the ports of the student's own servers. Two paths can still land on the same port (one chance in a hundred); the server starts with `--strictPort`, so then the second suite stops with an error and nothing is shared. */
export function e2ePort(repoPath: string): number {
  let hash = FNV_OFFSET;
  for (const byte of ENCODER.encode(repoPath)) hash = Math.imul(hash ^ byte, FNV_PRIME) >>> 0;
  return FIRST_E2E_PORT + (hash % E2E_PORT_COUNT);
}

/** Returns the port for a folder inside a checkout, from its real path, so a link to the folder gives the same port as the folder. */
export function e2ePortOf(folder: string): number {
  return e2ePort(realpathSync(folder));
}
