import type { ReactNode } from 'react';
import { InkIcon } from '@/scene';

export type CardIconKind = 'lucia' | 'question' | 'result' | 'inspection' | 'terminal' | 'settings' | 'table' | 'clock' | 'case' | 'chapter';

const SHAPES: Record<CardIconKind, ReactNode> = {
  lucia: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3-6 7-6s7 2 7 6" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9.5a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.6v.6M12 17h.01" />
    </>
  ),
  result: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z" />,
  inspection: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M7 10l3 2-3 2M12 15h5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
    </>
  ),
  table: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 10h16M4 14.5h16M10 5v14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  case: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="1" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h6" />
    </>
  ),
  chapter: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
    </>
  ),
};

/** The icon on the stripe of a card whose kind is not an entity of the map: Lucía, her question, the result, an inspection, a terminal, the network settings of a device, a table, the clock of the game, a case of a diagnose and a chapter of the roadmap. A card about an entity wears that entity's icon (`EntityIcon`). */
export function CardIcon({ kind }: { kind: CardIconKind }) {
  return <InkIcon>{SHAPES[kind]}</InkIcon>;
}
