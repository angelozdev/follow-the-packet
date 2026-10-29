import { useState } from 'react';
import { ALMANAC_TEXT, type TermId } from '@/copy';
import { Tabs } from '@/design';
import { AlmanacLessons, type Lesson } from './almanac-lessons';
import { AlmanacTerms } from './almanac-terms';
import { SystemWindow } from './system-window';
import { SYSTEM_WINDOW, type SystemWindowId, type SystemWindowState } from './use-system-window';

interface AlmanacWindowProps {
  windows: SystemWindowState<SystemWindowId>;
  known: ReadonlySet<TermId>;
  newTerms: ReadonlySet<TermId>;
  lessons: Lesson[];
}

const TAB = { terms: 'terms', lessons: 'lessons' } as const;

export function AlmanacWindow({ windows, known, newTerms, lessons }: AlmanacWindowProps) {
  const [selected, setSelected] = useState<string>(TAB.terms);
  const id = SYSTEM_WINDOW.almanac;
  return (
    <SystemWindow name={ALMANAC_TEXT.open} open={windows.open === id} onClose={windows.close} buttonId={windows.buttonId(id)}>
      <Tabs
        name={ALMANAC_TEXT.tabs}
        selected={selected}
        onSelect={setSelected}
        tabs={[
          { id: TAB.terms, label: ALMANAC_TEXT.terms, panel: <AlmanacTerms known={known} newTerms={newTerms} /> },
          { id: TAB.lessons, label: ALMANAC_TEXT.lessons, panel: <AlmanacLessons lessons={lessons} /> },
        ]}
      />
    </SystemWindow>
  );
}
