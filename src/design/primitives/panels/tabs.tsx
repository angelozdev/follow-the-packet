import { Content, List, Root, Trigger } from '@radix-ui/react-tabs';
import { useRef, type ReactNode, type SyntheticEvent } from 'react';
import { useRevealSelectedTab } from './use-reveal-selected-tab';

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

const bringIntoView = (event: SyntheticEvent<HTMLButtonElement>) => event.currentTarget.scrollIntoView(NEAREST);

/** A named list of tabs, built on Radix Tabs, of which one is selected and only its panel is shown: the name labels the list for screen readers, selecting a tab reports its id, and the arrow keys, Home and End move the selection. The list is one row that scrolls sideways by itself when its tabs do not fit, fades the edge that hides tabs, and brings a focused or clicked tab into view (Safari and Firefox on macOS do not focus a button on click), and brings the selected tab into view when the bar mounts and each time the selection changes, so a tab that the caller chose from outside, one that lies past the edge of a bar that scrolls, is not left out of sight (`use-reveal-selected-tab.ts`). Radix mounts only the panel of the selected tab, so whatever a panel's content keeps in its own state is lost when another tab is selected: the caller keeps that state above the tabs. */
export function Tabs({ name, tabs, selected, onSelect }: TabsProps) {
  const list = useRef<HTMLDivElement>(null);
  useRevealSelectedTab(list, selected);
  return (
    <Root className="tabs" value={selected} onValueChange={onSelect}>
      <List ref={list} className="tabs__list" aria-label={name}>
        {tabs.map(({ id, label }) => (
          <Trigger key={id} className="tabs__tab" value={id} onFocus={bringIntoView} onClick={bringIntoView}>
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
