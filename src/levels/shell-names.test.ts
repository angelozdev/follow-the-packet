import { describe, expect, it } from 'vitest';
import * as copy from '@/copy';
import { incidentTexts } from './ladder';
import { INCIDENTS } from './registry';

const { PIECE_TEXT, SYSTEMS_TEXT, TASK_CARD_TEXT, toPlainText } = copy;

/**
 * The incidents whose texts still send the player to a place the shell does not have, as incident → why.
 * The test asserts that this list is exactly the incidents that name one, so it can neither hide a new text nor keep a fixed one; it is empty when every text names a place the shell draws.
 */
const NAMED_BEFORE_BUILT: Record<string, string> = {
  '03-07': 'its report sends the player to the card of servidor-app, which block 3 task 3 builds on the shell and does not exist today',
};

/** The text maps of `src/copy/` that the player reads while playing: every `*_TEXT` export but `LEFT_OUT`, so a new map is swept without being listed. */
const LEFT_OUT = ['CATALOG_TEXT', 'INTERFACE_TEXT'];
const COPY_TEXTS = Object.entries(copy)
  .filter(([name]) => name.endsWith('_TEXT') && !LEFT_OUT.includes(name))
  .map(([, texts]) => texts);

function plainLabels(labels: string[]): string[] {
  return labels.map((label) => toPlainText(label).toLowerCase());
}

const NAMED_PLACE = /\b(pestaña|sección)\s+«([^»]+)»/giu;
const RETIRED_PLACE = /\btarjetas?\b|\babre su terminal\b/iu;
const TABS_OF_THE_SHELL = plainLabels([...Object.values(PIECE_TEXT.tabs), ...Object.values(TASK_CARD_TEXT.tabs).flatMap((directions) => Object.values(directions))]);
const SECTIONS_OF_THE_SHELL = plainLabels([PIECE_TEXT.parts.settings, PIECE_TEXT.parts.services]);
const NAMED_BUTTON = /\bbotón\s+«([^»]+)»/giu;
const BUTTONS_OF_THE_SHELL = plainLabels(Object.values(SYSTEMS_TEXT));
const NAMED_WINDOW = /\bventana\s+«([^»]+)»/giu;
const WINDOWS_OF_THE_SHELL = plainLabels([SYSTEMS_TEXT.registry]);

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

function missingButtons(text: string): string[] {
  return [...toPlainText(text).matchAll(NAMED_BUTTON)].filter(([, name]) => !BUTTONS_OF_THE_SHELL.includes(name.toLowerCase())).map(([, name]) => `botón «${name}»`);
}

function missingWindows(text: string): string[] {
  return [...toPlainText(text).matchAll(NAMED_WINDOW)].filter(([, name]) => !WINDOWS_OF_THE_SHELL.includes(name.toLowerCase())).map(([, name]) => `ventana «${name}»`);
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

describe('the texts that name a button of the shell', () => {
  it('every button that a text names exists in the shell', () => {
    const unknown = [
      ...INCIDENTS.flatMap((incident) => incidentTexts(incident).flatMap(missingButtons).map((button) => `${incident.id}: ${button}`)),
      ...TEXTS_OF_THE_COPY.flatMap(missingButtons).map((button) => `copy: ${button}`),
    ];

    expect(BUTTONS_OF_THE_SHELL).toEqual(['terminal', 'navegador', 'historial']);
    expect(missingButtons('Pulsa el botón «Terminal» o el botón «{{browser|Navegador}}».')).toEqual([]);
    expect(missingButtons('Pulsa el botón «Mapa».')).toEqual(['botón «Mapa»']);
    expect(unknown).toEqual([]);
  });
});

describe('the texts that name a window of the shell', () => {
  it('every window that a text names exists in the shell', () => {
    const unknown = [
      ...INCIDENTS.flatMap((incident) => incidentTexts(incident).flatMap(missingWindows).map((window) => `${incident.id}: ${window}`)),
      ...TEXTS_OF_THE_COPY.flatMap(missingWindows).map((window) => `copy: ${window}`),
    ];

    expect(WINDOWS_OF_THE_SHELL).toEqual(['historial']);
    expect(missingWindows('Abre la ventana «Historial» y mira la última fila.')).toEqual([]);
    expect(missingWindows('Abre la ventana «Almanaque».')).toEqual(['ventana «Almanaque»']);
    expect(unknown).toEqual([]);
  });
});
