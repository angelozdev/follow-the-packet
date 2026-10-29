import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { PIECE_TEXT, TASK_CARD_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { openCard, showTheScreen } from '@/testing/browser-play';
import { outboundFilterIncident } from '@/testing/incidents';
import { tokenColor } from '@/testing/token-color';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const OUTBOUND = outboundFilterIncident();
const CASES = [
  { where: 'the routes and translations of a router at 1280×800', incidents: INCIDENTS, id: '02-08', piece: 'router-oficina', tab: 'Tablas', row: 'Tablas', window: { width: 1280, height: 800 } },
  { where: 'the questions of a laptop at 390×844', incidents: INCIDENTS, id: '02-04', piece: 'tu-laptop', tab: 'Preguntas', row: 'Preguntas', window: { width: 390, height: 844 } },
  { where: 'the two directions of the rules of a firewall at 1280×800', incidents: [OUTBOUND], id: OUTBOUND.id, piece: 'firewall tu-laptop', tab: 'Tablas', row: TASK_CARD_TEXT.tabsName, window: { width: 1280, height: 800 } },
];

const tabsOf = (row: Element) => [...row.querySelectorAll<HTMLElement>('[role="tab"]')];

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the rows of tabs of the panel of a piece', () => {
  it.each(CASES)('$where: the six tabs of the piece keep their pills and the tabs inside the chosen one are an underlined row', async ({ incidents, id, piece, tab, row, window: size }) => {
    await page.viewport(size.width, size.height);
    await showTheScreen(<IncidentScreen incidents={incidents} incidentId={id} nextId={null} onFinish={() => undefined} />);
    await openCard(piece, tab);
    const outer = tabsOf(page.getByRole('tablist', { name: PIECE_TEXT.tabsName, exact: true }).element());
    const inner = tabsOf(page.getByRole('tablist', { name: row, exact: true }).element());
    expect(inner.length, 'the chosen tab has tabs of its own').toBeGreaterThan(1);
    for (const pill of outer) expect(getComputedStyle(pill).borderRadius, `${pill.textContent} is a pill`).not.toBe('0px');
    const [chosen, ...others] = inner;
    for (const underlined of inner) {
      expect(getComputedStyle(underlined).backgroundColor, `${underlined.textContent} has no fill`).toBe(TRANSPARENT);
      expect(getComputedStyle(underlined).borderRadius, `${underlined.textContent} is not rounded`).toBe('0px');
      expect(Number.parseFloat(getComputedStyle(underlined).fontSize), `${underlined.textContent} is smaller than a pill`).toBeLessThan(Number.parseFloat(getComputedStyle(outer[0]).fontSize));
      expect(underlined.getBoundingClientRect().top, `${underlined.textContent} is on the line of the first`).toBe(chosen.getBoundingClientRect().top);
    }
    expect(getComputedStyle(chosen).borderBottomColor, 'the chosen tab is underlined in ink').toBe(tokenColor('--color-ink'));
    for (const rest of others) expect(getComputedStyle(rest).borderBottomColor, `${rest.textContent} has no underline`).toBe(TRANSPARENT);
  });
});
