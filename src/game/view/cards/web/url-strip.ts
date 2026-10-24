import { URL_STRIP_TEXT, type TermText } from '@/copy';
import type { AddressChip } from '@/levels';

export type UrlPartName = 'scheme' | 'host' | 'port' | 'path' | 'query';

/** The value picked for each part of the url, by the id of its chip (the value itself). */
export type UrlPicks = Partial<Record<UrlPartName, string>>;

const PART_ORDER: UrlPartName[] = ['scheme', 'host', 'port', 'path', 'query'];

interface PartChip {
  id: string;
  label: TermText;
}

export interface UrlStripPart {
  name: UrlPartName;
  label: string;
  chips: PartChip[];
}

/** The strip of the address of a terminal whose urls come by parts: a tray for each part of the url, in the order of the url, and the address chip each combination of values stands for. */
export interface UrlStrip {
  name: string;
  parts: UrlStripPart[];
  addresses: { id: string; values: Record<UrlPartName, string> }[];
}

function valuesOf({ scheme, address, port, path = '/', query }: AddressChip): Record<UrlPartName, string> {
  return { scheme: scheme ?? '', host: address, port: port === undefined ? '' : String(port), path, query: query ?? '' };
}

function labelOf(name: UrlPartName, value: string): TermText {
  if (value === '' && (name === 'port' || name === 'query')) return URL_STRIP_TEXT.none[name];
  return name === 'query' ? URL_STRIP_TEXT.query(value) : value;
}

/** Returns the strip for the address chips of a send, or null unless there are several and every one gives its url by parts: a chip that gives its whole url, or that is no url, keeps the tray of whole addresses. */
export function urlStrip(chips: AddressChip[]): UrlStrip | null {
  if (chips.length < 2 || !chips.every((chip) => chip.url === undefined && chip.scheme !== undefined)) return null;
  const addresses = chips.map((chip) => ({ id: chip.id, values: valuesOf(chip) }));
  return {
    name: URL_STRIP_TEXT.name,
    parts: PART_ORDER.map((name) => ({
      name,
      label: URL_STRIP_TEXT.parts[name],
      chips: [...new Set(addresses.map(({ values }) => values[name]))].map((value) => ({ id: value, label: labelOf(name, value) })),
    })),
    addresses,
  };
}

/** Returns the picks with the part that offers a single value already picked: there is nothing to choose in it. */
export function pickedParts(strip: UrlStrip, picks: UrlPicks): UrlPicks {
  return Object.fromEntries(strip.parts.flatMap(({ name, chips }) => (picks[name] !== undefined ? [[name, picks[name]]] : chips.length === 1 ? [[name, chips[0].id]] : [])));
}

/** Returns the id of the address chip whose url the picks write, or undefined while a part is missing. */
export function stripAddress(strip: UrlStrip, picks: UrlPicks): string | undefined {
  return strip.addresses.find(({ values }) => PART_ORDER.every((name) => picks[name] === values[name]))?.id;
}
