import { describe, expect, it } from 'vitest';
import { token, tokenPx } from './tokens';

const TEXT_MIN_CONTRAST = 4.5;
const NON_TEXT_MIN_CONTRAST = 3;
const GRAIN_DARKENING = 0.04;
const HEX_COLOUR = /^#[0-9a-f]{6}$/;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722];
const FLARE = 0.05;
const ACCENT_ROLES = ['--color-danger', '--color-emphasis'];
const PAPERS = {
  page: token('--color-page'),
  'page with grain': mix(token('--color-page'), token('--color-ink'), GRAIN_DARKENING),
  surface: token('--color-surface'),
  shade: token('--color-shade'),
};

function channels(hex: string): number[] {
  if (!HEX_COLOUR.test(hex)) throw new Error(`Not a #rrggbb colour: ${hex}`);
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

function linear(channel: number): number {
  const share = channel / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

/** Returns the WCAG 2.2 relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  return channels(hex).reduce((sum, channel, index) => sum + LUMINANCE_WEIGHTS[index] * linear(channel), 0);
}

/** Returns the WCAG 2.2 contrast ratio between two #rrggbb colours, from 1 to 21. */
function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + FLARE) / (darker + FLARE);
}

/** Returns the #rrggbb colour `share` of the way from `from` to `to`. */
function mix(from: string, to: string, share: number): string {
  const target = channels(to);
  const blended = channels(from).map((channel, index) => Math.round(channel + (target[index] - channel) * share));
  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const CONTRAST_CASES = [
  ...ACCENT_ROLES.flatMap((role) =>
    Object.entries(PAPERS).map(([paper, background]) => ({ name: `${role} as text on ${paper}`, foreground: token(role), background, minimum: TEXT_MIN_CONTRAST })),
  ),
  ...ACCENT_ROLES.map((role) => ({ name: `--color-on-fill as text on ${role}`, foreground: token('--color-on-fill'), background: token(role), minimum: TEXT_MIN_CONTRAST })),
  ...Object.entries(PAPERS).map(([paper, background]) => ({ name: `--color-focus as the focus ring on ${paper}`, foreground: token('--color-focus'), background, minimum: NON_TEXT_MIN_CONTRAST })),
];

describe('design tokens', () => {
  it('follows a role down to the raw colour of its palette entry', () => {
    expect(token('--color-danger')).toBe(token('--palette-vermilion'));
    for (const role of ['--color-ink', '--color-surface', '--color-shade', '--color-danger']) {
      expect(token(role)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('reads a length in pixels as a number', () => {
    expect(tokenPx('--stroke-regular')).toBe(1.5);
  });

  it('throws for an unknown token, and for a token that is not in pixels', () => {
    expect(() => token('--color-nowhere')).toThrow('Unknown design token: --color-nowhere');
    expect(() => tokenPx('--color-ink')).toThrow('is not in pixels');
  });

  describe('contrast, WCAG 2.2 AA', () => {
    it.each(CONTRAST_CASES)('$name reaches $minimum:1', ({ foreground, background, minimum }) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it('leaves the ink beside a vermilion shape out of the 3:1 check, because that outline already separates it from every paper', () => {
      for (const background of Object.values(PAPERS)) {
        expect(contrast(token('--color-ink'), background)).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
      }
    });
  });
});
