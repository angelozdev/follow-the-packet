import { useEffect, type RefObject } from 'react';

const NEAREST: ScrollIntoViewOptions = { block: 'nearest', inline: 'nearest' };

export function useRevealSelectedTab(list: RefObject<HTMLElement | null>, selected: string) {
  useEffect(() => {
    const bar = list.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!bar || !tab) return;
    const [edge, box] = [bar.getBoundingClientRect(), tab.getBoundingClientRect()];
    if (box.left < edge.left || box.right > edge.right) tab.scrollIntoView(NEAREST);
  }, [list, selected]);
}
