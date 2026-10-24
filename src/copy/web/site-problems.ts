import type { SiteProblem } from '@/engine';
import type { TermText } from '@/copy/term-text';

/** The sentence that tells the player why the engine did not take a site they placed in a table of sites, by the code `siteProblem` gives. */
export const SITE_PROBLEM_TEXT = {
  'no-web-service': 'Ese servidor no tiene, en ese puerto, un programa que conteste páginas web.',
  'name-has-site': 'Ese nombre ya tiene un sitio en este servidor, y un servidor guarda un solo sitio por nombre.',
} as const satisfies Record<SiteProblem, TermText>;
