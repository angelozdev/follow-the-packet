import { describe, expect, it } from 'vitest';
import { token, tokenPx } from './tokens';

describe('design tokens', () => {
  it('follows a role down to the raw colour of its palette entry', () => {
    expect(token('--color-danger')).toBe(token('--palette-vermilion'));
    expect(token('--color-danger')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('reads a length in pixels as a number', () => {
    expect(tokenPx('--stroke-regular')).toBe(1.5);
  });

  it('throws for an unknown token, and for a token that is not in pixels', () => {
    expect(() => token('--color-nowhere')).toThrow('Unknown design token: --color-nowhere');
    expect(() => tokenPx('--color-ink')).toThrow('is not in pixels');
  });
});
