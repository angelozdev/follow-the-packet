import { describe, expect, it } from 'vitest';
import {
  ACTOR_ROLE_TEXT,
  BROWSER_TEXT,
  CASE_TEXT,
  CLASSIFY_TEXT,
  CLOCK_TEXT,
  EXPLANATION_TEXT,
  INSPECTION_TEXT,
  LUCIA_TEXT,
  MAP_TEXT,
  MESSAGE_TEXT,
  NOTICE_TEXT,
  PIECE_TEXT,
  RESTART_TEXT,
  RESULT_TEXT,
  ROADMAP_TEXT,
  SCREEN_TEXT,
  SERVICES_TEXT,
  SETTINGS_TEXT,
  SITES_TEXT,
  TABLE_TEXT,
  TASK_CARD_TEXT,
  TERMINAL_TEXT,
  URL_STRIP_TEXT,
  WEB_BOX_TEXT,
  toPlainText,
} from '@/copy';
import { incidentTexts } from './ladder';
import { INCIDENTS } from './registry';

/**
 * The incidents whose texts still send the player to a place the shell does not have, as incident → why.
 * The test asserts that this list is exactly the incidents that name one, so it can neither hide a new text nor keep a fixed one; it is empty when every text names a place the shell draws.
 */
const NAMED_BEFORE_BUILT: Record<string, string> = {
  '03-07': 'its report sends the player to the card of servidor-app, which block 3 task 3 builds on the shell and does not exist today',
};

/** The text maps of `src/copy/` that the player reads while playing; `CATALOG_TEXT` and `INTERFACE_TEXT` name the specimens of the design system, which does have cards, and are left out. */
const COPY_TEXTS = [
  ACTOR_ROLE_TEXT,
  BROWSER_TEXT,
  CASE_TEXT,
  CLASSIFY_TEXT,
  CLOCK_TEXT,
  EXPLANATION_TEXT,
  INSPECTION_TEXT,
  LUCIA_TEXT,
  MAP_TEXT,
  MESSAGE_TEXT,
  NOTICE_TEXT,
  PIECE_TEXT,
  RESTART_TEXT,
  RESULT_TEXT,
  ROADMAP_TEXT,
  SCREEN_TEXT,
  SERVICES_TEXT,
  SETTINGS_TEXT,
  SITES_TEXT,
  TABLE_TEXT,
  TASK_CARD_TEXT,
  TERMINAL_TEXT,
  URL_STRIP_TEXT,
  WEB_BOX_TEXT,
];

function plainLabels(labels: string[]): string[] {
  return labels.map((label) => toPlainText(label).toLowerCase());
}

const NAMED_PLACE = /\b(pestaña|sección)\s+«([^»]+)»/giu;
const RETIRED_PLACE = /\btarjetas?\b|\babre su terminal\b/iu;
const TABS_OF_THE_SHELL = plainLabels([...Object.values(PIECE_TEXT.tabs), ...Object.values(TASK_CARD_TEXT.tabs).flatMap((directions) => Object.values(directions))]);
const SECTIONS_OF_THE_SHELL = plainLabels([PIECE_TEXT.parts.settings, PIECE_TEXT.parts.services]);

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value && typeof value === 'object') return Object.values(value).flatMap(leaves);
  return [];
}

function missingPlaces(text: string): string[] {
  return [...toPlainText(text).matchAll(NAMED_PLACE)]
    .filter(([, noun, name]) => !(noun.toLowerCase() === 'pestaña' ? TABS_OF_THE_SHELL : SECTIONS_OF_THE_SHELL).includes(name.toLowerCase()))
    .map(([, noun, name]) => `${noun} «${name}»`);
}

const TEXTS_OF_THE_COPY = COPY_TEXTS.flatMap(leaves);

describe('the texts that name a place of the shell', () => {
  it('every tab, card or box that a text names exists in the shell', () => {
    const unknown = [
      ...INCIDENTS.flatMap((incident) => incidentTexts(incident).flatMap(missingPlaces).map((place) => `${incident.id}: ${place}`)),
      ...TEXTS_OF_THE_COPY.flatMap(missingPlaces).map((place) => `copy: ${place}`),
    ];
    const retired = INCIDENTS.filter((incident) => incidentTexts(incident).some((text) => RETIRED_PLACE.test(toPlainText(text)))).map(({ id }) => id);
    const retiredInTheCopy = TEXTS_OF_THE_COPY.filter((text) => RETIRED_PLACE.test(toPlainText(text)));

    expect(unknown).toEqual([]);
    expect(retired).toEqual(Object.keys(NAMED_BEFORE_BUILT));
    expect(retiredInTheCopy).toEqual([]);
  });
});
