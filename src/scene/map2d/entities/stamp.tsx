import { MAP_TEXT, stampLabel, type StampState } from '@/copy';
import type { TriggerProps } from '@/scene/overlay/inspect-trigger';

const GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', lost: '?', intruder: '✓', warned: '!' };
const SMALL_LETTER_FROM = 10;

export interface MoreSpecimen {
  hidden: number;
  hidesProblem: boolean;
}

export const MORE_SPECIMENS: readonly MoreSpecimen[] = [
  { hidden: 2, hidesProblem: false },
  { hidden: 12, hidesProblem: false },
  { hidden: 2, hidesProblem: true },
];

/** Takes the state of a stamp, the plain name of its packet and the props of its trigger; returns the button of the stamp a packet leaves: its mark is only drawn, so a screen reader hears the packet and how it ended, and the props of the trigger inspect the packet. The layer that stands it on the map (`../overlay/map-stamps.tsx`) is not part of it, so it can be tested alone. */
export function StampButton({ state, name, trigger }: { state: StampState; name: string; trigger: TriggerProps }) {
  return (
    <button type="button" className={`stamp stamp--${state}`} aria-label={stampLabel(name, state)} {...trigger}>
      <span aria-hidden="true">{GLYPH[state]}</span>
    </button>
  );
}

/** Takes how many stamps the «+N» hides, how many the place holds in all, whether a hidden one is a problem and the props of the trigger of the list; returns the «+N» button: the same stamp as the others, with its number as text (in a smaller letter from ten hidden) and the name of its list, and, when a hidden stamp is a problem, a small dot on its lower right edge, which its name says in words. The props of the trigger inspect the list. */
export function StampMore({ hidden, total, hidesProblem, trigger }: { hidden: number; total: number; hidesProblem: boolean; trigger: TriggerProps }) {
  const small = hidden >= SMALL_LETTER_FROM ? ' stamp--tight' : '';
  const name = hidesProblem ? MAP_TEXT.moreStampsWithProblem(hidden, total) : MAP_TEXT.moreStamps(hidden, total);
  return (
    <button type="button" className={`stamp stamp--more${small}`} aria-label={name} {...trigger}>
      <span aria-hidden="true">{`+${hidden}`}</span>
      {hidesProblem && <span className="stamp__dot" aria-hidden="true" />}
    </button>
  );
}
