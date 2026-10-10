import TOKENS_CSS from './tokens.css?raw';

const DECLARATION = /(--[a-z0-9-]+):\s*([^;]+);/g;
const REFERENCE = /^var\((--[a-z0-9-]+)\)$/;
const PIXELS = /^(\d+(?:\.\d+)?)px$/;
const TOKENS = new Map(Array.from(TOKENS_CSS.matchAll(DECLARATION), ([, name, value]) => [name, value.trim()]));

/** Returns the value of a token of tokens.css; throws when tokens.css was not loaded, or for an unknown token. A value that is a single var() reference is followed down to its raw value; a composite value, such as a shadow, is returned as written, inner var() included. */
export function token(name: string): string {
  if (TOKENS.size === 0) throw new Error('Design tokens are empty: tokens.css was not loaded (Vitest needs css.include in vite.config.ts)');
  const value = TOKENS.get(name);
  if (value === undefined) throw new Error(`Unknown design token: ${name}`);
  const reference = REFERENCE.exec(value)?.[1];
  return reference === undefined ? value : token(reference);
}

/** Returns a token measured in pixels as a number, such as a line width of the 3D map; throws when the token is not in pixels. */
export function tokenPx(name: string): number {
  const pixels = PIXELS.exec(token(name))?.[1];
  if (pixels === undefined) throw new Error(`Design token ${name} is not in pixels`);
  return Number(pixels);
}
