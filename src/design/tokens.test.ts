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

function labOf(hex: string): number[] {
  const rgb = channels(hex).map(linear);
  const [fx, fy, fz] = XYZ_FROM_LINEAR_RGB.map((row, index) => row.reduce((sum, weight, at) => sum + weight * rgb[at], 0) / D65_WHITE[index]).map((share) => (share > LAB_EPSILON ? Math.cbrt(share) : (LAB_KAPPA * share + 16) / 116));
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Returns the CIE 1976 colour difference between two #rrggbb colours: the distance between them in CIELAB under D65. */
function deltaE(a: string, b: string): number {
  const [first, second] = [labOf(a), labOf(b)];
  return Math.hypot(...first.map((value, index) => value - second[index]));
}

const MESSAGE_TABS = [
  { text: '--color-ink-soft', fill: '--color-surface', frame: '--color-ink-soft' },
  { text: '--color-on-fill', fill: '--color-success', frame: '--color-success' },
  { text: '--color-ink', fill: '--color-surface', frame: '--color-ink' },
  { text: '--color-on-fill', fill: '--color-danger', frame: '--color-danger' },
];
const SUCCESS_GREEN_ON_SURFACE = { light: 5.83, dark: 6.67 };
const SUCCESS_FILL_TEXT_ON_GREEN = { light: 5.83, dark: 7.54 };
const PROTOTYPE_DARK = { surface: '#292623', onFill: '#1e1c19', success: '#86b896' };
const RATIO_DIGITS = 2;
const ROLES = ['resolver', 'authoritative', 'proxy', 'app', 'web'];
const roleColours = () => ROLES.map((role) => ({ role, colour: token(`--role-${role}`), tint: token(`--role-${role}-tint`) }));
const ROLE_TINT_SHARE = 0.5;
const ROLE_TINT_INK_MIN_CONTRAST = 7;
const ROLE_MIN_DELTA_E = 25;
const D65_WHITE = [0.95047, 1, 1.08883];
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;
const XYZ_FROM_LINEAR_RGB = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
];

const CONTRAST_CASES = [
  ...ACCENT_ROLES.flatMap((role) =>
    Object.entries(PAPERS).map(([paper, background]) => ({ name: `${role} as text on ${paper}`, foreground: token(role), background, minimum: TEXT_MIN_CONTRAST })),
  ),
  ...ACCENT_ROLES.map((role) => ({ name: `--color-on-fill as text on ${role}`, foreground: token('--color-on-fill'), background: token(role), minimum: TEXT_MIN_CONTRAST })),
  ...Object.entries(PAPERS).map(([paper, background]) => ({ name: `--color-focus as the focus ring on ${paper}`, foreground: token('--color-focus'), background, minimum: NON_TEXT_MIN_CONTRAST })),
  { name: 'the text of the dark panel keeps 4.5:1 on ink', foreground: token('--color-on-fill'), background: token('--color-ink'), minimum: TEXT_MIN_CONTRAST },
  { name: 'the prompt keeps 4.5:1 on ink', foreground: token('--color-shade'), background: token('--color-ink'), minimum: TEXT_MIN_CONTRAST },
  { name: 'the inverted key line keeps 4.5:1', foreground: token('--color-ink'), background: token('--color-surface'), minimum: TEXT_MIN_CONTRAST },
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

  it('reads the radii of the card style as the measures of the approved prototype', () => {
    expect(tokenPx('--radius-card')).toBe(14);
    expect(tokenPx('--radius-tile')).toBe(10);
  });

  it('throws for an unknown token, and for a token that is not in pixels', () => {
    expect(() => token('--color-nowhere')).toThrow('Unknown design token: --color-nowhere');
    expect(() => tokenPx('--color-ink')).toThrow('is not in pixels');
  });

  describe('contrast, WCAG 2.2 AA', () => {
    it.each(CONTRAST_CASES)('$name reaches $minimum:1', ({ foreground, background, minimum }) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it('keeps 4.5 to 1 for the text on the title stripe', () => {
      expect(contrast(token('--color-on-fill'), token('--color-ink'))).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
    });

    it('the text of every variant of Message keeps 4.5:1 on its background and its mark keeps 3:1', () => {
      expect(contrast(token('--color-ink'), token('--color-surface'))).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      for (const { text, fill, frame } of MESSAGE_TABS) {
        expect(contrast(token(text), token(fill))).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
        for (const background of Object.values(PAPERS)) expect(contrast(token(frame), background)).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
      }
    });

    it('the text of the light panel keeps 4.5:1 on shade and its border 3:1', () => {
      expect(contrast(token('--color-ink'), token('--color-shade'))).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      for (const paper of [PAPERS.page, PAPERS.surface]) expect(contrast(token('--color-ink-soft'), paper)).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
      expect(contrast(token('--color-ink-soft'), token('--color-shade'))).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
    });

    it('the success green keeps 4.5:1 on the surface and under its fill text, in light and in dark', () => {
      const green = token('--color-success');
      expect(green).toBe(token('--palette-green'));
      expect(contrast(green, token('--color-surface'))).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      expect(contrast(token('--color-on-fill'), green)).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      expect(contrast(green, token('--color-surface'))).toBeCloseTo(SUCCESS_GREEN_ON_SURFACE.light, RATIO_DIGITS);
      expect(contrast(token('--color-on-fill'), green)).toBeCloseTo(SUCCESS_FILL_TEXT_ON_GREEN.light, RATIO_DIGITS);
      expect(contrast(PROTOTYPE_DARK.success, PROTOTYPE_DARK.surface)).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      expect(contrast(PROTOTYPE_DARK.onFill, PROTOTYPE_DARK.success)).toBeGreaterThanOrEqual(TEXT_MIN_CONTRAST);
      expect(contrast(PROTOTYPE_DARK.success, PROTOTYPE_DARK.surface)).toBeCloseTo(SUCCESS_GREEN_ON_SURFACE.dark, RATIO_DIGITS);
      expect(contrast(PROTOTYPE_DARK.onFill, PROTOTYPE_DARK.success)).toBeCloseTo(SUCCESS_FILL_TEXT_ON_GREEN.dark, RATIO_DIGITS);
    });

    it('leaves the ink beside a vermilion shape out of the 3:1 check, because that outline already separates it from every paper', () => {
      for (const background of Object.values(PAPERS)) {
        expect(contrast(token('--color-ink'), background)).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
      }
    });
  });

  describe('the colours of the roles of a server', () => {
    it('each role tint is half its role colour and half the surface', () => {
      for (const { role, colour, tint } of roleColours()) expect(tint, role).toBe(mix(colour, token('--color-surface'), ROLE_TINT_SHARE));
    });

    it('ink keeps 7:1 on each role tint', () => {
      for (const { role, tint } of roleColours()) expect(contrast(token('--color-ink'), tint), role).toBeGreaterThanOrEqual(ROLE_TINT_INK_MIN_CONTRAST);
    });

    it('each role colour keeps 3:1 on the surface', () => {
      for (const { role, colour } of roleColours()) expect(contrast(colour, token('--color-surface')), role).toBeGreaterThanOrEqual(NON_TEXT_MIN_CONTRAST);
    });

    it('each role colour keeps a distance of 25 from the success green and from the danger vermilion', () => {
      for (const { role, colour } of roleColours()) {
        expect(deltaE(colour, token('--color-success')), `${role} from the success green`).toBeGreaterThanOrEqual(ROLE_MIN_DELTA_E);
        expect(deltaE(colour, token('--color-danger')), `${role} from the danger vermilion`).toBeGreaterThanOrEqual(ROLE_MIN_DELTA_E);
      }
    });

    it('no two role colours are closer than 25', () => {
      const colours = roleColours();
      for (const [index, first] of colours.entries()) {
        for (const second of colours.slice(index + 1)) expect(deltaE(first.colour, second.colour), `${first.role} and ${second.role}`).toBeGreaterThanOrEqual(ROLE_MIN_DELTA_E);
      }
    });
  });
});
