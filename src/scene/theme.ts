import { token, tokenPx } from '@/design';

export const INK = token('--color-ink');
export const PAPER_FILL = token('--color-surface');
export const PAPER_SHADE = token('--color-shade');
export const DANGER = token('--color-danger');

/** The map's line widths in pixels: the same stroke scale as the borders of the interface. */
export const LINE = {
  thin: tokenPx('--stroke-thin'),
  regular: tokenPx('--stroke-regular'),
  bold: tokenPx('--stroke-bold'),
  heavy: tokenPx('--stroke-heavy'),
} as const;
