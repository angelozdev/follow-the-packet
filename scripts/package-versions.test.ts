import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PACKAGE_JSON_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const manifest: PackageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
const declared = Object.entries({ ...manifest.dependencies, ...manifest.devDependencies });

describe('package.json versions', () => {
  it('declares at least one dependency', () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  it.each(declared)('%s is pinned to an exact version (%s)', (_name, version) => {
    expect(version).toMatch(EXACT_VERSION);
  });
});
