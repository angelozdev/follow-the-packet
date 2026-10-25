import { Content, List, Root, Trigger } from '@radix-ui/react-tabs';
import type { FocusEvent, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: ReactNode;
  panel: ReactNode;
}

const NEAREST: ScrollIntoViewOptions = { block: 'nearest', inline: 'nearest' };

interface TabsProps {
  name: string;
  tabs: TabItem[];
  selected: string;
  onSelect: (tabId: string) => void;
}

const bringIntoView = (event: FocusEvent<HTMLButtonElement>) => event.currentTarget.scrollIntoView(NEAREST);

/** A named list of tabs, built on Radix Tabs, of which one is selected and only its panel is shown: the name labels the list for screen readers, selecting a tab reports its id, and the arrow keys, Home and End move the selection. The list is one row that scrolls sideways by itself when its tabs do not fit, fades the edge that hides tabs, and brings a focused tab into view. Radix mounts only the panel of the selected tab, so whatever a panel's content keeps in its own state is lost when another tab is selected: the caller keeps that state above the tabs. */
export function Tabs({ name, tabs, selected, onSelect }: TabsProps) {
  return (
    <Root className="tabs" value={selected} onValueChange={onSelect}>
      <List className="tabs__list" aria-label={name}>
        {tabs.map(({ id, label }) => (
          <Trigger key={id} className="tabs__tab" value={id} onFocus={bringIntoView}>
            {label}
          </Trigger>
        ))}
      </List>
      {tabs.map(({ id, panel }) => (
        <Content key={id} className="tabs__panel" value={id}>
          {panel}
        </Content>
      ))}
    </Root>
  );
}
